import { ApplicationCommandManager } from "@cmds/application_command_manager";
import { Command } from "@cmds/command";
import { BaseBuilder } from "@utils/base_builder";

import { Model } from "papr";

export class Plugin<
  S = Record<string, unknown>,
  D extends Partial<S> = Partial<S>
> extends BaseBuilder {
  #model?: Model<S, D>;
  commands: Command[] = [];

  global = false;

  enabledByDefault = true;

  setEnabledByDefault(enabledByDefault: boolean) {
    this.enabledByDefault = enabledByDefault;
    return this;
  }

  setModel<NS, D extends Partial<NS>>(model: Model<NS, D>) {
    const self = this as unknown as Plugin<NS, D>;
    self.#model = model;
    return self;
  }

  addCommand(fn: (cmd: Command) => Command) {
    let cmd = new Command();
    cmd.setDefaultPermissionEnabled(this.enabledByDefault);
    cmd = fn(cmd);
    this.commands.push(cmd);
  }
}
