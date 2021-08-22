import { ApplicationCommandManager } from "@cmds/application_command_manager";

import { Snowflake } from "discord.js";

export class PluginManager {
  appCmdManager: ApplicationCommandManager;

  constructor(clientId: Snowflake) {}

  registerCommand() {}

  addPlugin() {}
}
