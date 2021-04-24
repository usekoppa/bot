import { KoppaClient } from "@lib/client";
import { EventManager } from "@lib/event_manager";
import { config } from "@utils/config";
import { printError } from "@utils/errors";
import { createLogger } from "@utils/logger";

import { Container } from "typedi";

const client = Container.get(KoppaClient);
const log = createLogger("bot");
const evs = new EventManager(log);

evs.once("ready", log => {
  // TODO(@zorbyte): Make this more dynamic.
  client.user?.setActivity(`Koppa - ${config.bot.prefix}help`);

  log.info("Logged into Discord as", client.user?.tag);
});

// evs.on("debug", (msg, log) => log.debug(msg));

evs.on("warn", (msg, log) => log.warn(msg));

evs.on("error", (err, log) =>
  printError("Client emitted an error", { err, log })
);

evs.on("shardReconnecting", (id, log) =>
  log.warn(`Shard is reconnecting`, { id })
);
