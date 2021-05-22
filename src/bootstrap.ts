import { readdir } from "fs/promises";
import { join } from "path";

import { dispatcher } from "@cmds/dispatcher";
import { KoppaClient } from "@core/client";
import { EventManager } from "@core/event_manager";
import { createLogger } from "@utils/logger";

import { Container } from "typedi";

import { connect } from "../lib/db/connect";

import { config } from "./config";

const client = Container.get(KoppaClient);
const log = createLogger("bot");
const evs = new EventManager(log);

export async function bootstrap() {
  await loadPlugins();
  setupClientHandlers();
  await connect("./koppa.db");
  await client.login(config.bot.token);
}

async function loadPlugins() {
  log.info("Loading plugins");
  const startTime = Date.now();
  const pluginPaths = await readdir(join(__dirname, "plugins"));
  await Promise.all(
    pluginPaths.map(path => {
      log.debug("Importing plugin", { path });
      return import(`./plugins/${path}`);
    })
  ).catch(err => {
    log.error("Failed to load plugins", err);
    process.exit(1);
  });
  const endTime = Date.now() - startTime;
  log.info(`Loaded plugins in ~${endTime}ms`);
}

function setupClientHandlers() {
  evs.once("ready", log => {
    log.info("Logged into Discord as", client.user?.tag);
    setStatus();
  });

  // evs.on("debug", (msg, log) => log.debug(msg));

  evs.on("message", dispatcher(config.bot.prefix, config.bot.reportsChannelId));

  evs.on("warn", (msg, log) => log.warn(msg));

  evs.on("error", (err, log) => log.error("Client emitted an error", err));

  evs.on("shardReconnecting", (id, log) => {
    log.warn(`Shard is reconnecting`, { id });
    setStatus();
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
