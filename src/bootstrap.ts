import { createLogger } from "@utils/logger";

const log = createLogger();

export async function bootstrap() {
  await loadServices();
}

async function loadServices() {
  await Promise.all(
    ["@cmds/dispatcher", "./info", "@core/generic_handlers", "@core/login"].map(
      path => {
        log.debug("Importing service", { path });
        return import(path);
      }
    )
  ).catch(err => {
    log.error("Failed to load component", err);
    process.exit(1);
  });
}

process.on("warning", warn => {
  log.warn("The process issued a warning");
  log.warn(warn);
});

process.on("uncaughtException", error =>
  log.error("An uncaught exception occurred", error)
);

process.on("unhandledRejection", reason => {
  log.pureError("An unhandled rejection occurred");
  if (typeof reason !== "undefined" && reason !== null) {
    log.pureError(reason);
  } else {
    log.warn(
      "No additional information was provided in the unhanded rejection"
    );
  }
});
