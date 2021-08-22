import { Channel, GuildMember, Role, User } from "discord.js";

import type { ApplicationCommandOptionTypes } from "./application_command_option_types";
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
