import { NoArgsCommandContext } from "@cmds/context";

import { StringConsumer } from "./consumer";
import { getParameterString, Parameter } from "./parameter";
import { getUsageString, Usage } from "./usage";

export function extractContentStrings(
  prefix: string,
  content: string
): [callKey: string, args: string] {
  const [callKey, ...rest] = content
    .slice(prefix.length)
    .toLowerCase()
    .trim()
    .split(/\s/g);

  return [callKey, rest.join(" ").trim()];
}

// A feature for the parser that shall be implemented at some point:
// Suppose we have:
//   k:ban <...user(s)> [reason]
// we should allow the following too:
//   k:ban user[s]=@mention [reason]
//   k:ban user[s]=@mention,[ ]@mention,[ ]@mention [reason]
//   k:ban reason="string" <...user(s)>
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

const notOptional = "This argument is not optional.";

// group 1 = key name
// group 2 = quotation mark type (ignore it)
// group 3 = sentence content (if any)
// group 4 = comma separated list
const pairMatcher =
  /(?:(\w+)(?:\s*=\s*)(?:("|'{1,})(?:([^"'\\]+))*\2|((?:(?:\w)(?:,\s?[^\s])*)*)))/g;

export function parse(
  ctx: NoArgsCommandContext,
  usage: Usage | undefined,
  content: string
): { args: Record<string, unknown>; error?: { name: string; reason: string } } {
  if (typeof usage === "undefined" || usage.length === 0) return { args: {} };
  const results = [...content.matchAll(pairMatcher)];
  const args: Record<string, unknown> = {};
  const resultRanges: [number, number][] = [];
  const consumedParamNames: string[] = [];
  let newContent = content;
  for (const result of results) {
    const [match, key, , sentence, list] = result;
    const paramIdx = usage.findIndex(
      param => param.aliases.includes(key) || param.name === key
    );

    if (paramIdx < 0) continue;

    const param = usage[paramIdx];

    if (typeof result.index === "undefined") {
      ctx.log.pureError(result);
      throw new Error("Result index is undefined for some unknown reason");
    }

    if (typeof sentence !== "undefined" && param.sentence) {
      const val = parseArg(sentence, param);
      if (!param.optional && typeof val === "undefined") {
        return createParsingError({
          reason: notOptional,
          index: result.index,
          param,
        });
      }

      args[param.name] = val;
    } else if (
      (typeof list === "undefined" || list === "") &&
      !param.optional
    ) {
      return createParsingError({
        reason: notOptional,
        index: result.index,
        param,
      });
    } else if (param.greedy) {
      const listItems = list.split(/,+/g).map(item => item.trim());
      let final: unknown[] | undefined = [];
      for (const item of listItems) {
        const val = param.parser.parse(ctx, item);
        if (typeof val === "undefined" || param.sentence) {
          return createParsingError({
            reason: `Invalid argument: Was expecting a ${
              param.sentence ? "sentence" : param.parser.name
            }.`,
            index: result.index + Math.max(0, match.indexOf(item)),
            param,
          });
        }

        final.push(val);
      }

      if (final.length === 0) {
        final = param.default?.(ctx) as unknown[];

        if (typeof final === "undefined" || final.length === 0) {
          if (!param.optional) {
            return createParsingError({
              reason: notOptional,
              index: result.index,
              param,
            });
          }

          final = [];
        }
      }

      args[param.name] = final;
    } else {
      const val = list[0];

      if (typeof val === "undefined" || val === "") {
        const equalsIdx = result.index + Math.max(match.indexOf("="), 0);
        if (!param.optional) {
          return createParsingError({
            reason: notOptional,
            index: equalsIdx,
            param,
          });
        } else {
          return createParsingError({
            reason: `Invalid argument: No value supplied.`,
            index: equalsIdx,
            param,
          });
        }
      }

      args[param.name] = val;
    }

    resultRanges.push([result.index, result.index + match.length]);
    consumedParamNames.push(param.name);

    newContent =
      newContent.slice(0, result.index) +
      newContent.slice(result.index + match.length);
  }

  newContent = newContent.trim();
  const consumer = new StringConsumer(newContent);

  for (let i = 0; i < usage.length; i++) {
    const param = usage[i];
    if (consumedParamNames.includes(param.name)) continue;
    let arg: unknown;
    if (param.greedy) {
      arg = [];
    } else if (param.sentence) {
      arg = "";
    }

    for (;;) {
      let value: unknown;
      const posBeforeWord = consumer.position;
      const word = consumer.readWord();

      if (param.sentence) {
        const nextParam = usage[i + 1];
        const noNext = typeof nextParam === "undefined";
        if (noNext) value = consumer.readRest();
        if (
          (noNext && typeof value === "undefined") ||
          typeof word === "undefined"
        ) {
          if (!param.optional) {
            return createParsingError({
              reason: notOptional,
              index: determineContentIndex(consumer.position),
              param,
            });
          }

          arg = nextParam.default?.(ctx);

          break;
        }

        if (noNext) {
          arg = `${word}${value as string}`;
          break;
        }

        const nextParamVal = nextParam.parser.parse(ctx, word);
        if (typeof nextParamVal === "undefined") {
          // This is so we include various forms of whitespace.
          arg += consumer.raw.slice(posBeforeWord, consumer.position);
        } else {
          break;
        }
      } else {
        if (typeof word === "undefined") {
          value = !param.greedy ? param.default?.(ctx) : void 0;
          if (typeof value === "undefined" && param.optional) continue;
        }

        value = typeof word === "undefined" ? void 0 : parseArg(word, param);

        if (typeof value === "undefined") {
          if (!param.optional) {
            return createParsingError({
              reason: notOptional,
              index: determineContentIndex(consumer.position),
              param,
            });
          } else {
            break;
          }
        }
      }

      if (param.greedy) {
        (arg as unknown[]).push(value);
      } else {
        arg = value;
        break;
      }
    }

    args[param.name] = arg;
  }

  return { args };

  function determineContentIndex(pos: number) {
    for (const [start, end] of resultRanges) {
      if (pos <= start) return pos;
      pos += end;
    }

    return pos;
  }

  function parseArg(arg: string, param: Parameter) {
    return param.parser.parse(ctx, arg) ?? param.default?.(ctx);
  }

  function createParsingError(opts: {
    reason: string;
    index: number;
    param: Parameter;
  }) {
    const name = getParameterString(opts.param);
    let errContentStr = content;
    if (errContentStr === "") {
      errContentStr = getUsageString(usage!);
      opts.index = errContentStr.indexOf(name);
    }

    return {
      args: {},
      error: {
        name,
        reason: `\`\`\`${errContentStr}\n${" ".repeat(opts.index)}^\n${
          opts.reason
        }\`\`\``,
      },
    };
  }
}
