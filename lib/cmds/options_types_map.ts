import { Channel, Role, Snowflake, User } from "discord.js";
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
  [ApplicationCommandOptionTypes.MENTIONABLE]: Snowflake;
  [ApplicationCommandOptionTypes.NUMBER]: number;
}
