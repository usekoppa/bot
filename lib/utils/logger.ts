import { createWriteStream, existsSync, mkdirSync } from "fs";
import { inspect } from "util";

import { bold, cyan, gray, green, magenta, red, yellow } from "chalk";

import { level } from "./debug";

const METHOD_COLOURS = {
  debug: gray,
  info: cyan,
  warn: yellow,
  pureError: red,
};

type LevelNames = keyof typeof METHOD_COLOURS | "error";
type LoggerMethods = Record<LevelNames, typeof console.log>;

export interface Logger extends LoggerMethods {
  child(...names: string[]): Logger;
  error(msg: string, err: Error): void;
  error(msg: string, err: unknown): void;
}

let defaultName = "";
export function setDefaultName(newDefaultName: string) {
  defaultName = newDefaultName;
}

let prod = false;
export function setProdMode(production: boolean) {
  prod = production;
}

/* TODO(@zorbyte): Use type-di and/or implement a mechanism to store loggers and prevent duplicate instances.
 *                 Debug log environment variable should allow scopes, to print logs for certain child loggers
 *                 instead.
 */

// These overloads are so that the child creation function isn't usually visible.
export function createLogger(name?: string): Logger;
export function createLogger(
  name: string,
  opts: { childNames?: string[]; debugEnabled?: boolean }
): Logger;
export function createLogger(
  name = defaultName,
  opts?: { childNames?: string[]; debugEnabled?: boolean }
) {
  const knownChildNames = opts?.childNames ?? [];
  const debugEnabled = opts?.debugEnabled ?? level >= 1;

  // If a logger has a blank name and has children, take the first child name as the main name.
  if (name === "" && knownChildNames.length) name = knownChildNames.pop() ?? "";
  const displayName = [name, ...knownChildNames]
    .filter(name => name !== "")
    .map(name => green(name))
    .join(gray(" > "));

  const loggerObj: Logger = {
    debug(...args: unknown[]) {
      if (!debugEnabled) return;
      writeLog(displayName, "debug", ...args);
    },
    info: writeLog.bind(null, displayName, "info"),
    warn: writeLog.bind(null, displayName, "warn"),
    error(msg: string, err: unknown) {
      loggerObj.pureError(msg);
      if (typeof err === "undefined") {
        loggerObj.pureError(
          new Error(
            'Error object provided to error printer was "undefined". Using quasi-error for stacktrace instead'
          )
        );
      } else {
        loggerObj.pureError(err);
      }
    },
    pureError: writeLog.bind(null, displayName, "error"),
    child(...childNames: string[]) {
      return createLogger(name, {
        debugEnabled,
        childNames: [...knownChildNames, ...childNames],
      });
    },
  };

  if (prod && !existsSync("logs/")) mkdirSync("logs/");

  return loggerObj;
}

function writeLog(displayName: string, key: LevelNames, ...args: unknown[]) {
  const callableKey = key === "warn" ? "info" : key;
  const colouriser = METHOD_COLOURS[key === "error" ? "pureError" : key];

  const consoleArgs = [
    formatLog(displayName, { method: key, colouriser }),
    ...args,
  ];

  console[callableKey as "log"](...consoleArgs);

  writeLogToFile(key, consoleArgs);
}

function writeLogToFile(key: string, consoleArgs: unknown[]) {
  // Only write to logs/ when it's a warning or an error
  if (prod && ["error", "warn"].includes(key)) {
    if (!existsSync("logs/")) mkdirSync("logs/");

    // We could also have a static file stream for both of the files, but since this technique is easier and has no
    // impact on performance, we'll keep doing that instead
    const stream = createWriteStream(
      `logs/${key}-${new Date()
        .toISOString()
        .split("T")[0]
        .replace(/\//g, "-")}.log`,
      {
        flags: "a", // Append it
        encoding: "utf-8",
      }
    );

    consoleArgs
      .filter(element => element instanceof Error)
      .map(
        err =>
          // Replace error objects by their stack
          (consoleArgs[consoleArgs.indexOf(err)] =
            (err as Error | undefined)?.stack ?? new String(err))
      );

    consoleArgs
      .filter(element => typeof element === "object")
      // Pretty-print object args
      .map(
        object => (consoleArgs[consoleArgs.indexOf(object)] = inspect(object))
      );

    stream.write(
      // Replace all ANSI styling codes.
      consoleArgs.join(" ").replace(
        // eslint-disable-next-line no-control-regex
        /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g,
        ""
      ) + "\n"
    );

    // Avoid EMFILE errors by closing the stream when we're done using it.
    stream.end();
  }
}

function formatLog(
  displayName: string,
  opts: { method: string; colouriser: typeof gray }
) {
  // 11 is the length of the ANSI escape codes.
  if (displayName.length > 11) displayName += " ";
  return `${bold(
    // Split it so that we only get the time without the date.
    magenta(new Date().toTimeString().split(" ")[0])
  )} ${displayName}${opts.colouriser(opts.method)}`;
}
