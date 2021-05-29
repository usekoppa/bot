// import { Message } from "discord.js";

import { StringConsumer } from "./consumer";
import { getParameterString, Parameter } from "./parameter";
import { Usage } from "./usage";

export function extractFromCommandString(
  prefix: string,
  content: string
): [callKey: string, args: string] {
  const [callKey, ...args] = content
    .slice(prefix.length)
    .toLowerCase()
    .trim()
    .split(/\s+/g);

  return [callKey, args.join(" ")];
}

// A feature for the parser that shall be implemented at some point:
// Suppose we have:
//   k:ban <...user(s)> [reason]
// we should allow the following too:
//   k:ban user[s]=@mention [reason]
//   k:ban user[s]=@mention,[ ]@mention,[ ]@mention [reason]
//   k:ban reason=string <...user(s)>
// Essentially, using a transitive argument will work regardless of position in the content string
//
// In consideration:
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
const pairsMatcher =
  /([^\s,=,,]+)(?:\s*=\s*)([^\s,=]+)(?:(?:,\s*|$)([^\s,=]+)){0,}/g;
export function parse(
  // msg: Message,
  usage: Usage,
  content: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): { result: Record<string, any>; error?: string } {
  // Short circuit.
  if (usage.length === 0) return { result: {} };

  let adjustedContent = content;
  const adjustedUsage = [...usage];

  const matches = [...content.matchAll(pairsMatcher)];

  const collectedPairs: {
    param: Parameter;
    position: number;
    args: string[];
  }[] = [];

  let indexOffset = 0;
  for (let i = 0; i < matches.length; i++) {
    let match: RegExpMatchArray;

    // eslint-disable-next-line prefer-const
    let [pair, key, firstArg, ...args] = (match = matches[i]);
    const firstArgIdx = pair.indexOf(firstArg);

    const paramIdx = adjustedUsage.findIndex(param => param.name === key);
    if (paramIdx < 0) continue;
    const [param] = adjustedUsage.splice(paramIdx);

    if (param.sentence) {
      let stopPoint = matches[i + 1]?.index;
      if (typeof stopPoint !== "undefined") stopPoint -= indexOffset;
      const consumed = adjustedContent.slice(firstArgIdx, stopPoint);
      args = [consumed];
    } else if (!param.greedy && args.length > 1) {
      if (args.length > 1) pair = pair.slice(0, firstArgIdx + firstArg.length);
      args = [firstArg];
    }

    if (typeof match.index === "undefined") {
      const err = new Error("Match index is undefined");
      // @ts-ignore Add this for diagnostic information.
      err.match = err;
      throw err;
    }

    adjustedContent =
      adjustedContent.slice(0, match.index - indexOffset) +
      adjustedContent.slice(
        match.index -
          indexOffset +
          args.reduce((prev, arg) => prev + arg.length, 0)
      );

    collectedPairs.push({
      param,
      position: match.index - indexOffset,
      args,
    });

    indexOffset += match.index + 1;
  }

  const consumer = new StringConsumer(adjustedContent);
  for (let i = 0; i < adjustedUsage.length; i++) {
    const param = adjustedUsage[i];
    const pair = collectedPairs.find(
      pair => pair.position === consumer.position
    )!;

    // let value = "";

    if (param.sentence) {
      if (pair.param.sentence) {
        if (param.optional) continue;
        const pairString = `${pair.param.name}=${getParameterString(
          pair.param
        )}`;

        return {
          result: {},
          error:
            `\`\`\`${pairString} ${getParameterString(param)}}\n${" ".repeat(
              pairString.length
            )}^\`\`\`` +
            "Cannot use pair parameters that expect a sentence prior to a positional sentence parameter",
        };
      }

      if (i === adjustedUsage.length - 1) {
        //     value = consumer.readRest();
      } else {
        // TODO: The rest.
      }
    }

    // const word = consumer.readWord();
  }

  return { result: {} };
}
