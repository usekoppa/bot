import { Logger } from "@utils/logger";

import { Message } from "discord.js";

import { Arguments } from "./parser/transformer";
import { Usage, UsageTuple } from "./parser/usage";
import { Command } from "./command";

export interface CommandContext<U extends Usage = Usage> {
  msg: Message;
  cmd: Command<U>;
  args: Arguments<UsageTuple<U>>;
  content: string;
  callKey: string;
  prefix: string;
  log: Logger;
}

export type NoArgsCommandContext = Omit<CommandContext, "args">;
