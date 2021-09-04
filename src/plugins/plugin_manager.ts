import { ApplicationCommandManager } from "@cmds/application_command_manager";
import { Command } from "@cmds/command";

import { Snowflake } from "discord-api-types/v9";

import { Plugin } from "./plugin";

export class PluginManager {
  appCmdManager: ApplicationCommandManager;

  #globalCommandsToRegister: Command[] = [];

  #plugins: Record<string, Plugin> = {};

  constructor(clientId: Snowflake, token: string) {
    this.appCmdManager = new ApplicationCommandManager(clientId, token);
  }

  addPlugin(fn: (plugin: Plugin) => Plugin) {
    const plugin = fn(new Plugin());
    this.#plugins[plugin.name] = plugin;
    return this;
  }

  #processPlugin(plugin: Plugin) {
    /*if (plugin.global) {
      this.#globalCommandsToRegister.push(plugin.commands.filter(pl => pl.));
    }*/
  }
}

const plugins = new Map<string, Plugin>();

function enable(pluginName: string) {
  const pl = plugins.get(pluginName);
  if (typeof pl === "undefined") throw new Error("Plugin not foudn");
}

// /enable plugin -> interaction listener -> finds command -> looks at the associated plugin -> check if global
//   -> if global:
//       continue to run command and get db data if needed
//  -> if not global:
//       get db data and check if enabled
//      if disabled:
//        check if the command is in the guilds commands and use the plugin manager to resubmit the guild plugins
//  -> using the record that has been collected and attached to ctx
//  -> use the plugin manager to re-register the guild plugins & send to the db that we need to disable the commands.
//  -> enable the plugin and commit it to the db.
