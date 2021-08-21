import { CommandInteraction } from "discord.js";

// eslint-disable-next-line @typescript-eslint/ban-types
export interface CommandContext<A = {}> {
  args: A;
  interaction: CommandInteraction;
}
