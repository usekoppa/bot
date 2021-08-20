import {
  ApplicationCommandData,
  ApplicationCommandOptionData,
  Channel,
  Role,
  User,
} from "discord.js";
import { ApplicationCommandOptionType } from "discord-api-types";

type $TODO_COMMAND = unknown;

interface OptionTypeMap {
  [ApplicationCommandOptionType.SubCommand]: $TODO_COMMAND;
  [ApplicationCommandOptionType.SubCommandGroup]: $TODO_COMMAND;
  [ApplicationCommandOptionType.String]: string;
  [ApplicationCommandOptionType.Integer]: number;
  [ApplicationCommandOptionType.Boolean]: boolean;
  [ApplicationCommandOptionType.User]: User;
  [ApplicationCommandOptionType.Channel]: Channel;
  [ApplicationCommandOptionType.Role]: Role;
  [ApplicationCommandOptionType.Mentionable]: User | Role | Channel;
}

class Option<T> {
  private data = {} as ApplicationCommandOptionData;

  setType<OT extends ApplicationCommandOptionType>(
    optionType: OT
  ): Option<OptionTypeMap[OT]> {
    this.data.type = optionType;
    return this;
  }
}

const opt = new Option();

opt.setType(ApplicationCommandOptionType.String);
