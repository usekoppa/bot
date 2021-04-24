import { createLogger } from "@utils/logger";

const log = createLogger();

export async function bootstrap() {
  await loadServices();
}

async function loadServices() {
  await Promise.all(
    ["@lib/cmds/dispatcher", "./info", "./bot"].map(path => {
      log.debug("Importing service", { path });
      return import(path);
    })
  ).catch(err => {
    log.error("Failed to load component", err);
    process.exit(1);
  });
}
