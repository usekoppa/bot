import { ApplicationCommandManager } from "@cmds/application_command_manager";
import { Command } from "@cmds/command";
import { BaseBuilder } from "@utils/base_builder";

import { PluginManager } from "./plugin_manager";

export class Plugin extends BaseBuilder {
  global = false;
  enabledByDefault = true;

  constructor(private appCmdManager: ApplicationCommandManager) {
    super();
  }

  setEnabledByDefault(enabledByDefault: boolean) {
    this.enabledByDefault = enabledByDefault;
    return this;
  }

  addCommand(fn: (cmd: Command) => Command) {
    let cmd = new Command();
    cmd.setDefaultPermissionEnabled(this.enabledByDefault);
    cmd = fn(cmd);
 //   this.appCmdManager.registerGuildCommands()
  }
}
