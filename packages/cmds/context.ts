import { Logger } from "@utils/logger";

import { Message } from "discord.js";

export interface Context {
  msg: Message;
  // TODO(@voltexene): This would be dynamically produced from the syntax usage tree.
  args: string[];
  callKey: string;
  prefix: string;
  log: Logger;
}
