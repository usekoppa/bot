import { KoppaClient } from "@lib/client";
import { config } from "@utils/config";
import { createLogger } from "@utils/logger";

import { Container } from "typedi";

const client = Container.get(KoppaClient);
const log = createLogger("gateway_handler");

client.on("ready", () => {
  // TODO(@zorbyte): Make this more dynamic.
  client.user?.setActivity(`Koppa - ${config.bot.prefix}help`);

  log.info("Logged in and ready to serve as", client.user?.tag);
});
