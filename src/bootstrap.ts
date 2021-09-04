import { EventManager } from "@events";
import { level } from "@utils/debug";
import { createLogger, setProdMode } from "@utils/logger";

import ms from "ms";

import { getClient } from "./client";
import { config } from "./config";
import { connect } from "./db_driver";
import { testCommands } from "./test_commands";

setProdMode(!config.dev);

const client = getClient();
EventManager.setClient(client);

const log = createLogger();

export async function bootstrap() {
  try {
    const startTime = Date.now();
    testCommands();
    setupClientHandlers(startTime);
    await connect("mongodb://localhost:27017", "koppa");
    log.info("Logging into Discord");
    await client.login(config.bot.token);
  } catch (err) {
    log.error("Failed to bootstrap", err);
    process.exit(1);
  }
}

function setupClientHandlers(startTime: number) {
  EventManager.once("ready", ctx => {
    ctx.log.info("First login completed", {
      time: `~${ms(Date.now() - startTime)}`,
    });
  });

  EventManager.on("ready", ctx => {
    ctx.log.info("Logged into Discord", {
      id: client.user?.id,
      tag: client.user?.tag,
    });

    setStatus();
  });

  if (level >= 3) {
    EventManager.on("debug", ctx => {
      ctx.log.debug("Discord.js debug log emitted", { info: ctx.info });
    });
  }

  EventManager.on("warn", ctx => ctx.log.warn(ctx.info));

  EventManager.on("error", ctx =>
    ctx.log.error("Client emitted an error", ctx.error)
  );

  EventManager.on("shardReconnecting", ctx =>
    ctx.log.warn(`Shard is reconnecting`, { shardId: ctx.shardId })
  );
}

function setStatus() {
  // TODO(@zorbyte): Make this more dynamic.
  client.user?.setActivity(`Koppa - /say`);
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
