import { Message } from "discord.js";

import { Argument } from "./argument";
import { Usage } from "./usage";

export function extractFromCommandString(
  prefix: string,
  cmdStr: string
): [callKey: string, args: string[]] {
  const [callKey, ...args] = cmdStr
    .slice(prefix.length)
    .toLowerCase()
    .trim()
    .split(/\s+/g);

  return [callKey, args];
}

// A feature for the parser that shall be implemented at some point:
// Suppose we have:
//   k:ban <...user(s)> [reason]
// we should allow the following too:
//   k:ban user[s]=@mention [reason]
//   k:ban user[s]=@mention,[ ]@mention,[ ]@mention [reason]
//   k:ban reason=string <...user(s)>
// Essentially, using a transitive argument will work regardless of position in the content string
// In addition, we should allow for the values of greedy transitive arguments to be associated with
// each other (with optional indexes to allow more freedom for where the arguments can be placed) like so:
//   k:ban user[s]=@mention, @mention, @mention reason[idx]=string
//   e.g.
//     k:ban users=@person1, @person2, @person3 reason=dick reason=stupid reason=dumb
//     k:ban users=@person1, @person2, @person3 reason2=stupid reason1=dick reason3=dumb
// This allows the user to use the arguments similar to how they would with slash commands, except without using
// slash commands because they kinda suck.
// If the user opts to use slash commands, they have the option to do so, as another set of functions in the bot
// will be able to handle and negotiate interactions (this is a TODO) but otherwise they can use text based commands
// for best results.
// This feature should be documented on the syntax manual, so that end users can use normal ordered methods without
// having to do any extra reading.
export function parse(msg: Message, usage: Usage, raw: string[]) {
  let rawIdx = 0;
  usage.reduce((args, arg, idx) => {
    const nextArg: Argument | undefined = usage[idx + 1];
    const data = raw[rawIdx++];
    arg.parse({ msg, data, raw });
    return args;
  }, {} as Record<string, unknown>);
}
