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

const defaultDebugEnabled = level >= 1;

// TODO(@zorbyte): Use type-di and/or implement a mechanism to store loggers and prevent duplicate instances.
//                 Debug log environment variable should allow scopes, to print logs for certain child loggers instead.
//                 Logs should be written to a file with criteria for the types of logs to be written to the file

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
  const debugEnabled = opts?.debugEnabled ?? defaultDebugEnabled;

  // If a logger has a blank name and has children,
  // take the first child name as the main name.
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

  return loggerObj;
}

function writeLog(displayName: string, key: LevelNames, ...args: unknown[]) {
  const callableKey = key === "warn" ? "info" : key;
  const colouriser = METHOD_COLOURS[key === "error" ? "pureError" : key];

  console[callableKey as "log"](
    formatLog(displayName, { method: key, colouriser }),
    ...args
  );
}

function formatLog(
  displayName: string,
  opts: { method: string; colouriser: typeof gray }
) {
  // 11 is the length of the ANSI escape codes.
  if (displayName.length > 11) displayName += " ";
  const currentTime = new Date();
  const timeStr = currentTime.toLocaleTimeString();
  return `${bold(
    // Sliced so that we only get the time without the date.
    magenta(timeStr.slice(0, timeStr.indexOf(" ")))
  )} ${displayName}${opts.colouriser(opts.method)}`;
}
