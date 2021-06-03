
function handleSentence() {}

const pairsMatcher =
  /([^\s,=,,]+)(?:\s*=\s*)([^\s,=]+)(?:(?:,\s*|$)([^\s,=]+)){0,}/g;
export function parse<U extends Usage>(
  ctx: CommandContext,
  usage: Usage,
  content: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): { result: ParsedArguments<U>; error?: string } {
  // Short circuit.
  if (usage.length === 0) return { result: {} as ParsedArguments<U> };

  const collected = collectPairs();
  const { pairs, offset } = collected;
  usage = collected.usage;
  content = collected.content;

  function collectPairs() {
    let adjustedContent = content;
    const adjustedUsage = [...usage];

    const matches = [...content.matchAll(pairsMatcher)];

    const collectedPairs: Pair[] = [];

    let indexOffset = 0;
    for (let i = 0; i < matches.length; i++) {
      let match: RegExpMatchArray;

      // eslint-disable-next-line prefer-const
      let [pair, key, firstArg, ...args] = (match = matches[i]);
      const firstArgIdx = pair.indexOf(firstArg);

      const paramIdx = adjustedUsage.findIndex(
        param => param.name === key || param.aliases?.includes(key)
      );

      if (paramIdx < 0) continue;
      const [param] = adjustedUsage.splice(paramIdx);

      if (param.sentence) {
        let stopPoint = matches[i + 1]?.index;
        if (typeof stopPoint !== "undefined") stopPoint -= indexOffset;
        const consumed = adjustedContent.slice(firstArgIdx, stopPoint);
        args = [consumed];
      } else if (!param.greedy) {
        if (args.length > 1)
          pair = pair.slice(0, firstArgIdx + firstArg.length);
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

    return {
      pairs: collectedPairs,
      content: adjustedContent,
      usage: adjustedUsage,
      offset: indexOffset,
    };
  }

  function handleGreedyPairs() {}

  const parsed: Record<string, unknown> = {};

  const consumer = new StringConsumer(adjustedContent);
  for (let i = 0; i < adjustedUsage.length; i++) {
    const raw = adjustedContent.split(/\s+/g);
    const param = adjustedUsage[i];
    const pairIdx = collectedPairs.findIndex(
      pair => pair.position === consumer.position
    )!;

    const pair = collectedPairs[pairIdx];

    let value = "";
    let data: unknown;

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
        value = consumer.readRest();
      } else {
        const nextStoppingPoint =
          collectedPairs[pairIdx + 1] ?? adjustedContent.length - 1;

        function processSentence(stoppingPoint: number) {}

        let consumed = "";
        for (;;) {
          const arg = consumer.peakWord();
          const parsed = param.parser.parse({
            ctx,
            arg,
            raw,
          });

          if (typeof parsed === "undefined") {
            void consumer.readWord();
            data = parsed;
            break;
          }

          const nextChar = consumer.read(1);
          if (nextChar === "") break;
          consumed += nextChar;
        }
      }
    } else if (param.greedy) {
      data = [];
      let arg: string | undefined;
      while (typeof (arg = consumer.peakWord()) !== "undefined") {
        const parsed =
          param.parser.parse({
            ctx,
            arg,
            raw,
          }) ?? param.default?.(ctx);

        void consumer.readWord();

        (data as unknown[]).push(parsed);
      }
    } else {
      data = value === "" ? consumer.readWord() : value;
    }

    parsed[param.name] = data;

    // TODO: Do the rest of the parser.
  }

  return { result: parsed };
}
