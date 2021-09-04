import { Command } from "@cmds";
import { Logger } from "@utils/logger";

import { CommandInteraction } from "discord.js";

// eslint-disable-next-line @typescript-eslint/ban-types
export interface CommandContext<A = {}> {
  args: A;
  interaction: CommandInteraction;
  command: Command<A>;
  log: Logger;
}
