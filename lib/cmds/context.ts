import { Logger } from "@utils/logger";

import { Message } from "discord.js";

import { ParsedArguments } from "../parser/parser";
import { Usage, UsageTuple } from "../parser/usage";

export interface CommandContext<U extends Usage = Usage> {
  msg: Message;
  args: ParsedArguments<UsageTuple<U>>;
  rawArgs: string[];
  callKey: string;
  prefix: string;
  log: Logger;
}

export type NoArgsCommandContext = Omit<CommandContext, "args">;
