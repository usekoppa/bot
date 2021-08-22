import { ApplicationCommandOptionTypes } from "./application_command_option_types";
import { Base } from "./base";
import { Command } from "./command";

// eslint-disable-next-line @typescript-eslint/ban-types
export type Subcommand<A = {}> = Omit<
  Command<A, true>,
  "addSubcommand" | "addSubcommandGroup"
> &
  Base;

export class SubcommandGroup extends Base {
  readonly type = ApplicationCommandOptionTypes.SUB_COMMAND_GROUP;
  options: Subcommand[] = [];

  setName(name: string) {
    this._name = name;
    return this;
  }

  setDescription(description: string) {
    this._description = description;
    return this;
  }

  addSubcommand(fn: (subcommand: Subcommand) => Subcommand) {
    const cmd = new Command(true);
    const subCmd = fn(cmd);
    this.options.push(subCmd);

    return this as Omit<this, "run">;
  }

  toJSON() {
    return {
      name: this.name,
      description: this.description,
      options: this.options.map(opt => opt.toJSON()),
    };
  }
}
