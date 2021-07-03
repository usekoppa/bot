import { NoArgsCommandContext } from "@cmds/context";

import { createParsingError } from "./errors";

// group 1 = key name
// group 2 = quotation mark type (ignore it)
// group 3 = sentence content (if any)
// group 4 = comma separated list
const pairsMatcher =
  /(?:(\w+)(?:\s*=\s*)(?:("|'{1,})(?:([^"'\\]+))*\2|((?:(?:\w)(?:,\s?[^\s])*)*)))/g;

export function parsePairs(ctx: NoArgsCommandContext, content: string) {
  const args: Record<string, unknown> = {};
  const matches = [...content.matchAll(pairsMatcher)];
  for (const match of matches) {
    const { name, value, error } = parsePairedArgument(ctx, match);
    if (typeof error !== "undefined") {
      return { error };
    }

    args[name!] = value;

    content =
      content.slice(0, match.index) +
      content.slice(match.index! + match[0]!.length);
  }

  return { args, content };
}

function parsePairedArgument(
  ctx: NoArgsCommandContext,
  match: RegExpMatchArray
) {
  const usage = ctx.cmd.usage!;
  const [matchingString, key, quoteMark, sentence, listString] = match;
  const param = usage.find(
    p =>
      p.aliases.includes(key) ||
      p.name === key ||
      (p.pluralise && `${p.name}s` === key)
  );

  // There is no value for this if the parameter does not exist, hence
  // this should be parsed as part of the positional arguments instead.
  if (typeof param === "undefined") return { value: void 0 };

  // We need to know the index of where this match was made for errors to work correctly.
  if (typeof match.index === "undefined") {
    ctx.log.pureError(match);
    throw new Error("Result index is undefined for some unknown reason");
  }

  let value: unknown;

  if (typeof sentence !== "undefined" && sentence !== "") {
    if (!param.sentence) {
      return {
        // This error would look like:
        // ... key="some sentence that doesn't belong" ...
        //         ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Expected type "${param.parser.name}" here
        // but found type "sentence" instead.
        error: createParsingError({
          offendingString: `${quoteMark}${sentence}${quoteMark}`,
          invalidType: "sentence",
          matchingString,
          param,
        }),
      };
    }

    value = param.parser.parse(ctx, sentence);
  } else if (typeof listString !== "undefined" && listString !== "") {
    if (!param.greedy) {
      return {
        // This error would look like:
        // ... key=thing,thing2,thing3,thing4 ...
        //         ~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Expected *one* item of type "${param.parser.name}" here
        // but found a list of [`type "${infer type}"` | "values"] instead.
        error: createParsingError({
          offendingString: listString,
          invalidType: "list",
          matchingString,
          param,
        }),
      };
    }

    const list = listString.split(/,+/g).map(item => item.trim());
    const values: unknown[] = [];

    for (const item of list) {
      const val = param.parser.parse(ctx, item);
      if (typeof val === "undefined") {
        return {
          // This error would look like:
          // ... key=thing,thing2,invalid,thing4 ...
          //                      ~~~~~~~
          // Expected type "${param.parser.name}"" here
          // but found [`type ${infer type}` | "something else"] instead.
          error: createParsingError({
            idx: matchingString.indexOf(listString) + listString.indexOf(item),
            offendingString: item,
            matchingString,
            param,
          }),
        };
      }

      values.push(val);
    }

    value = values;
  }

  if (
    typeof value === "undefined" ||
    (Array.isArray(value) && value.length === 0)
  ) {
    if (param.optional) {
      value = param.default?.(ctx);
    } else {
      return {
        error: createParsingError({
          idx: match.index,
          offendingString: matchingString,
          missing: true,
          matchingString,
          param,
        }),
      };
    }
  }

  return { name: param.name, value };
}
