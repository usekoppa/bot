import { NoArgsCommandContext } from "@cmds/context";
import { StringConsumer } from "@utils/string_consumer";

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

// group 1 = key name
// group 2 = quotation mark type (ignore it)
// group 3 = sentence content (if any)
// group 4 = comma separated list
const pairsMatcher =
  /(?:(\w+)(?:\s*=\s*)(?:("|'{1,})(?:([^"'\\]+))*\2|((?:(?:\w)(?:,\s?[^\s])*)*)))/g;

interface ParseError {
  name: string;
  reason: string;
}

interface ParseResult {
  args: Record<string, unknown>;
  error?: ParseError;
}

export function parse2(
  ctx: NoArgsCommandContext,
  content: string
): ParseResult {
  // eslint-disable-next-line prettier/prettier
  const { cmd: { usage } } = ctx;

  // Short circuit if there is no usage for ths command.
  if (typeof usage === "undefined" || usage.length === 0) {
    return { args: {} };
  }
}

function parsePairedArguments(ctx: NoArgsCommandContext, content: string) {
  const matches = [...content.matchAll(pairsMatcher)];
  for (const match of matches) parsePairedArgument(ctx, match, content);
}

interface ParsePairedArgResult {
  value: unknown;
  error?: ParseError;
}

function parsePairedArgument(
  ctx: NoArgsCommandContext,
  match: RegExpMatchArray,
  content: string
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
        error: pairError({
          offendingString: `${quoteMark}${sentence}${quoteMark}`,
          invalidType: "sentence",
          matchingString,
          param,
        }),
      };
    }

    value = parseArg(ctx, sentence, param);
  } else if (typeof listString !== "undefined" && listString !== "") {
    if (!param.greedy) {
      return {
        // This error would look like:
        // ... key=thing,thing2,thing3,thing4 ...
        //         ~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // Expected *one* item of type "${param.parser.name}" here
        // but found a list of [`type "${infer type}"` | "values"] instead.
        error: pairError({
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
          error: pairError({
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

  return { value };
}

function checkArgForNullErrors() {}

function pairError(opts: {
  idx?: number;
  matchingString: string;
  // With the offending string, we should search through the
  // parsers to find what was most likely supplied and then in
  // the error say that the user provided that type as opposed
  // to the expected type. We don't have to do this but it is
  // very nice for the UX. It likely won't have a large
  // performance penalty.
  offendingString: string;
  invalidType?: "list" | "sentence";
  param: Parameter;
}) {
  opts.idx = opts.idx ?? opts.matchingString.indexOf(opts.offendingString);
  let reason = `... ${opts.matchingString} ...\n`;

  // Add 4 because of the "... ".
  reason += " ".repeat(opts.idx + 4);
  reason += "~".repeat(opts.offendingString.length);
  reason += "\n";
  reason += `Expected ${opts.invalidType === "list" ? "a single " : ""}${
    param.parser.name
  }`;
}

export function parse(
  ctx: NoArgsCommandContext,
  usage: Usage | undefined,
  content: string
): { args: Record<string, unknown>; error?: { name: string; reason: string } } {
  const results = [...content.matchAll(pairsMatcher)];
  const args: Record<string, unknown> = {};
  const resultRanges: [number, number][] = [];
  const consumedParamNames: string[] = [];
  let newContent = content;

  for (const result of results) {
    let val: unknown | unknown[] | undefined;
    const [match, key, , sentence, list] = result;
    const paramIdx = usage.findIndex(
      param => param.aliases.includes(key) || param.name === key
    );

    if (paramIdx < 0) continue;

    const param = usage[paramIdx];

    // We need to know the index of where this match was made for errors to work correctly.
    if (typeof result.index === "undefined") {
      ctx.log.pureError(result);
      throw new Error("Result index is undefined for some unknown reason");
    }

    if (typeof sentence !== "undefined" && param.sentence) {
      val = parseArg(sentence, param);
      if (val === parseError) {
        return createRequiredArgError(param, result.index);
      }
    } else if (
      (typeof list === "undefined" || list === "") &&
      !param.optional
    ) {
      return createParsingError({
        reason: `Invalid argument: Was expecting a ${
          param.sentence ? "sentence" : param.parser.name
        }.`,
        index: result.index + Math.max(0, match.indexOf("=")),
        param,
      });
    } else if (param.greedy) {
      if (final.length === 0) {
        final = param.default?.(ctx) as unknown[];

        if (typeof final === "undefined" || final.length === 0) {
          if (!param.optional) {
            return createRequiredArgError(param, result.index);
          }

          final = [];
        }
      }

      args[param.name] = final;
    } else {
      // If a key=value argument is present and it is not a list,
      // we resolve it to a single value as the regex parses
      // the value as a list all the time anyway.
      const val = parseArg(list[0], param);

      if (typeof val === "undefined") {
        const equalsIdx = result.index + Math.max(match.indexOf("="), 0);
        if (!param.optional) {
          return createRequiredArgError(param, equalsIdx);
        } else {
          return createRequiredArgError(param, equalsIdx);
        }
      }
    }

    if (val === missingArgError) {
      return createRequiredArgError(
        param,
        result.index + Math.max(match.indexOf("="), 0)
      );
    }

    args[param.name] = val;

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

    // Start parsing the positional arguments that are left over.
    for (;;) {
      let value: unknown;
      const posBeforeWord = consumer.position;
      const word = consumer.readWord();

      // Parse sentences.
      if (param.sentence) {
      } else {
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

  function createRequiredArgError(param: Parameter, index: number) {
    return createParsingError({
      usage: usage!,
      reason: "This argument is required.",
      content,
      index,
      param,
    });
  }
}

function parseKeyedGreedyArg() {
  const listItems = list.split(/,+/g).map(item => item.trim());
  const final: unknown[] | undefined = [];
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

  return final;
}

function parsePositionalArg() {
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

function parsePositionalGreedyArg() {}

function parsePositionalSentenceArg() {
  // We use the next param so that we can gradually consume a sentence until
  // an argument that satisfies the next positional parameter is found.
  const nextParam = usage[i + 1];
  const noNext = typeof nextParam === "undefined";
  if (noNext) value = consumer.readRest();
  if (noNext && (typeof word === "undefined" || word === "")) {
    if (!param.optional) {
      return createRequiredArgError(
        param,
        determineContentIndex(consumer.position)
      );
    }

    arg = nextParam.default?.(ctx);

    break;
  }

  if (noNext) {
    arg = `${word!}${(value as string | undefined) ?? ""}`;
    break;
  }

  const nextParamVal = nextParam.parser.parse(ctx, word!);
  if (typeof nextParamVal === "undefined") {
    // This is so we include various forms of whitespace.
    arg += consumer.raw.slice(posBeforeWord, consumer.position);
  } else {
    break;
  }
}

function parseKeyedSentenceArg() {}

function determineContentIndex(pos: number, resultRanges: [number, number][]) {
  for (const [start, end] of resultRanges) {
    if (pos <= start) return pos;
    pos += end;
  }

  return pos;
}

function createParsingError(opts: {
  usage: Usage;
  reason: string;
  content: string;
  index: number;
  param: Parameter;
}) {
  const name = getParameterString(opts.param);
  let errContentStr = opts.content;
  if (errContentStr === "") {
    errContentStr = getUsageString(opts.usage);
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

function parseArg(
  ctx: NoArgsCommandContext,
  str: string | undefined,
  param: Parameter
): unknown | symbol | undefined {
  if (typeof str === "undefined" || str === "") {
    if (param.optional) return param.default?.(ctx) ?? missingArgError;
    return missingArgError;
  }

  return param.parser.parse(ctx, str) ?? param.optional
    ? void 0
    : missingArgError;
}
