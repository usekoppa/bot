import { join } from "path";

import { dispatcher } from "@cmds/dispatcher";
import { KoppaClient } from "@core/client";
import { EventManager } from "@core/event_manager";
import { PluginManager } from "@core/plugin_manager";
import { createLogger } from "@utils/logger";

import { Container } from "typedi";

import { connect } from "../lib/db/connect";

import { config } from "./config";

const client = Container.get(KoppaClient);
const plManager = Container.get(PluginManager);
const log = createLogger();
const evManager = new EventManager(log);

export async function bootstrap() {
  await plManager.loadDir(join(__dirname, "plugins"));
  setupClientHandlers();
  await connect("./koppa.db");
  await client.login(config.bot.token);
}

function setupClientHandlers() {
  evManager.add({
    type: "once",
    name: "ready",
    run(ctx) {
      ctx.log.info("Logged into Discord as", client.user?.tag);
      setStatus();
    },
  });

  // evs.on("debug", (msg, log) => log.debug(msg));

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
      setStatus();
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
