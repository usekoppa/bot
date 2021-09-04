import { EventManager } from "@events";
import { level } from "@utils/debug";
import { createLogger, setProdMode } from "@utils/logger";

import ms from "ms";

// import { dispatcher } from "../lib/old/cmds_old/dispatcher";
import { getClient } from "./client";
import { config } from "./config";
import { connect } from "./db_driver";
import { testCommands } from "./test_commands";

setProdMode(!config.dev);

const client = getClient();
// const plManager = new PluginManager();
const log = createLogger();
const evManager = new EventManager(client);

export async function bootstrap() {
  try {
    const startTime = Date.now();
    //  await plManager.load(join(__dirname, "plugins"));
    // if (config.hpr) plManager.watch();
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
  evManager.add({
    type: "once",
    name: "ready",
    run(ctx) {
      ctx.log.info("First login completed", {
        time: `~${ms(Date.now() - startTime)}`,
      });
    },
  });

  evManager.add({
    type: "on",
    name: "ready",
    run(ctx) {
      ctx.log.info("Logged into Discord", {
        id: client.user?.id,
        tag: client.user?.tag,
      });

      setStatus();
    },
  });

  if (level >= 3) {
    evManager.add({
      type: "on",
      name: "debug",
      run(ctx) {
        ctx.log.debug("Discord.js debug log emitted", { info: ctx.info });
      },
    });
  }

  evManager.add({
    type: "on",
    name: "warn",
    run(ctx) {
      ctx.log.warn(ctx.info);
    },
  });

  evManager.add({
    type: "on",
    name: "error",
    run(ctx) {
      ctx.log.error("Client emitted an error", ctx.error);
    },
  });

  evManager.add({
    type: "on",
    name: "shardReconnecting",
    run(ctx) {
      ctx.log.warn(`Shard is reconnecting`, { shardId: ctx.shardId });
    },
  });
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
