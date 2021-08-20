import { ApplicationCommand } from "discord.js";
import { DefaultPermissions } from "../perms/permissions";

ApplicationCommand

class Command {
  #name?: string;
  #description?: string;
  #subcommands?: Command[];

  get name() {
    this.#throwIfNotSet(this.#name);
    return this.#name!;
  }

  get description() {
    this.#throwIfNotSet(this.#description);
    return this.#description!;
  }

  setName(name: string) {
    this.#name = name;
    return this;
  }

  setDescription(description: string) {
    this.#description = description;
    return this;
  }



  #throwIfNotSet(data: unknown) {
    if (
      typeof data === "undefined" ||
      data === null ||
      (typeof data === "string" && data === "")
    ) {
      throw new Error("The property has not been set.");
    }
  }
}

Plugin.addCommand((cmd: Command) =>
  cmd
    .setName("name")
    .setDescription("it does something")
    .setDefaultPermissions(DefaultPermissions.Administrator)
    .addStringOption(op =>
      opt.setName("input").isRequired(true).setDescription("Enter a string")
    )
    .addIntegerOption(opt =>
      opt.setName("int").setDescription("Enter an integer")
    )
    .addNumberOption(opt => opt.setName("num").setDescription("Enter a number"))
    .addBooleanOption(opt =>
      opt.setName("choice").setDescription("Select a boolean")
    )
    .addUserOption(opt => opt.setName("target").setDescription("Select a user"))
    .addChannelOption(opt =>
      opt.setName("destination").setDescription("Select a channel")
    )
    .addRoleOption(opt => opt.setName("muted").setDescription("Select a role"))
    .addMentionableOption(opt =>
      opt.setName("mentionable").setDescription("Mention something")
    )
    .use(ctx => {
      ctx.args.input; // string
      ctx.args.int // number | undefined

    })
);
