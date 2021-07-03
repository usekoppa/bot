import { NoArgsCommandContext } from "@cmds/context";
import { StringConsumer } from "@utils/string_consumer";

import { createParsingError } from "./errors";
import { parsePairs } from "./pairs";

export function parse(ctx: NoArgsCommandContext, content: string) {
  // eslint-disable-next-line prettier/prettier
  const { cmd: { usage } } = ctx;

  // Short circuit if there is no usage for ths command.
  if (typeof usage === "undefined" || usage.length === 0) {
    return { args: {} };
  }

  const { args, content: strippedContent, error } = parsePairs(ctx, content);
  if (typeof error !== "undefined") {
    return { error };
  }

  const consumer = new StringConsumer(strippedContent!);
  for (let i = 0; i < usage.length; i++) {
    let value: unknown;
    const param = usage[i];
    if (Object.keys(args!).includes(param.name)) continue;

    if (param.greedy) {
      const nextParam = getNextParam(i);
      if (typeof nextParam === "undefined") {
        value = consumer.readRest();
      } else {
        for (;;) {
          const word = consumer.peakWord();
          if (typeof word === "undefined") break;

          const nextParamRes = nextParam.parser.parse(ctx, word);

          if (typeof nextParamRes !== "undefined") {
            const parsed = param.parser.parse(ctx, word);
            const [nextWord, pos] = consumer.peakWordsWithPos();
            if (typeof parsed === "undefined") {
              return {
                error: createParsingError({
                  idx: consumer.position + ,
                  offendingString: nex,
                  missing: true,
                  matchingString,
                  param,
                }),
              };
            }
            
            if (typeof nextWord === "undefined") break;
          } else {
            // something.
          }
        }
      }
    }

    const nextParam = getNextParam(i);

    args![param.name] = value;
  }

  function parseSentence() {}

  function getNextParam(idx: number) {
    for (let i = idx + 1; i < usage!.length; i++) {
      const param = usage![i];
      if (Object.keys(args!).includes(param.name)) continue;
      return param;
    }
  }
}
