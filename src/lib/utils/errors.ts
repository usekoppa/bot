import { createLogger, Logger } from "./logger";

const genericErrorLog = createLogger();
interface PrinterOpts {
  log?: Logger;
  err?: unknown;
}

// TODO(@zorbyte): Have an error reporting webhook and potentially a service like sentry.
export function printError(
  msg: string,
  { log = genericErrorLog, err }: PrinterOpts
) {
  log.error(msg);
  if (typeof err === "undefined") {
    log.error(
      new Error(
        'Error object provided to error printer was "undefined". Using quasi-error for stacktrace instead'
      )
    );
  } else {
    log.error(err);
  }
}
