import { join } from "path";

import { dispatcher } from "@cmds/dispatcher";
import { KoppaClient } from "@core/client";
import { EventManager } from "@core/event_manager";
import { PluginManager } from "@core/plugin_manager";
import { level } from "@utils/debug";
import { createLogger, setProdMode } from "@utils/logger";

import ms from "ms";
import { Container } from "typedi";

import { connect } from "../lib/db/connect";

import { config } from "./config";

setProdMode(!config.dev);

const client = Container.get(KoppaClient);
const plManager = Container.get(PluginManager);
const log = createLogger("bot");
const evManager = new EventManager(log);

export async function bootstrap() {
  try {
    const startTime = Date.now();
    await plManager.load(join(__dirname, "plugins"));
    // if (config.hpr) plManager.watch();
    setupClientHandlers(startTime);
    await connect("./koppa.db");
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
    name: "message",
    run: dispatcher(config.bot.prefix, config.bot.reportsChannelId),
  });

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
      ctx.log.error("Client emitted an error", ctx.reason);
    },
  });

  evManager.add({
    type: "on",
    name: "shardReconnecting",
    run(ctx) {
      ctx.log.warn(`Shard is reconnecting`, { id: ctx.id });
    },
  });
}

function setStatus() {
  // TODO(@zorbyte): Make this more dynamic.
  client.user?.setActivity(`Koppa - ${config.bot.prefix}help`);
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
