import { Logger } from "@utils/logger";

import { Message } from "discord.js";

import { ParsedArguments } from "./syntax/parser";
import { Usage, UsageTuple } from "./syntax/usage";

export interface Context<U extends Usage = Usage> {
  msg: Message;
  args: ParsedArguments<UsageTuple<U>>;
  rawArgs: string[];
  callKey: string;
  prefix: string;
  log: Logger;
}
