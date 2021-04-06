import { printError } from "@utils/errors";

export async function bootstrap() {
  await loadServices();
}

async function loadServices() {
  await Promise.all(
    ["@lib/cmds/dispatcher", "./info", "./bot"].map(comp => import(comp))
  ).catch(err => {
    printError("Failed to load component", { err });
    process.exit(1);
  });
}
