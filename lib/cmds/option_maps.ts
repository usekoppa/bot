import { Channel, GuildMember, Role, User } from "discord.js";
import { ApplicationCommandOptionTypes } from "discord.js/typings/enums";

import { Command } from "./command";

export interface OptionTypesMap {
  [ApplicationCommandOptionTypes.SUB_COMMAND]: Command;
  [ApplicationCommandOptionTypes.SUB_COMMAND_GROUP]: Command[];
  [ApplicationCommandOptionTypes.STRING]: string;
  [ApplicationCommandOptionTypes.INTEGER]: number;
  [ApplicationCommandOptionTypes.BOOLEAN]: boolean;
  [ApplicationCommandOptionTypes.USER]: User;
  [ApplicationCommandOptionTypes.CHANNEL]: Channel;
  [ApplicationCommandOptionTypes.ROLE]: Role;
  [ApplicationCommandOptionTypes.MENTIONABLE]: User | GuildMember | Role;
  [ApplicationCommandOptionTypes.NUMBER]: number;
}

export const ObjectEnumToStringMap = {
  [ApplicationCommandOptionTypes.SUB_COMMAND]: "SUB_COMMAND",
  [ApplicationCommandOptionTypes.SUB_COMMAND_GROUP]: "SUB_COMMAND_GROUP",
  [ApplicationCommandOptionTypes.STRING]: "STRING",
  [ApplicationCommandOptionTypes.INTEGER]: "INTEGER",
  [ApplicationCommandOptionTypes.BOOLEAN]: "BOOLEAN",
  [ApplicationCommandOptionTypes.USER]: "USER",
  [ApplicationCommandOptionTypes.CHANNEL]: "CHANNEL",
  [ApplicationCommandOptionTypes.ROLE]: "ROLE",
  [ApplicationCommandOptionTypes.MENTIONABLE]: "MENTIONABLE",
  [ApplicationCommandOptionTypes.NUMBER]: "NUMBER",
};
