import { Parser } from "./parser";

export interface Argument<T = unknown> {
  name: string;
  greedy: boolean;
  optional: boolean;
  sentence: boolean;
  pluralise: boolean;
  parse: Parser<T>;
}

export function argument<
  T,
  N extends string,
  G extends boolean = false,
  O extends boolean = false
>(
  name: N,
  parser: Parser<T>,
  opts?: {
    greedy?: G;
    optional?: O;
    sentence?: boolean;
    pluralise?: G extends true ? boolean : false;
  }
): {
  name: N;
  greedy: G;
  optional: O;
  sentence: boolean;
  pluralise: boolean;
  parse: Parser<T>;
} {
  const arg = {
    name,
    greedy: (opts?.greedy ?? false) as G,
    optional: (opts?.optional ?? false) as O,
    sentence: opts?.sentence ?? false,
    pluralise: opts?.pluralise ?? false,
    parse: parser,
  };

  if (arg.greedy && arg.sentence) {
    throw new Error("An argument can not be greedy and a sentence");
  }

  return arg;
}
