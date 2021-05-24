import { Parser } from "./parser";

export interface Argument<T = unknown> {
  name: string;
  greedy: boolean;
  optional: boolean;
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
    optional?: O;
    greedy?: G;
    pluralise?: G extends true ? boolean : false;
  }
): {
  name: N;
  greedy: G;
  optional: O;
  pluralise: boolean;
  parse: Parser<T>;
} {
  return {
    name,
    greedy: (opts?.greedy ?? false) as G,
    optional: (opts?.optional ?? false) as O,
    pluralise: opts?.pluralise ?? false,
    parse: parser,
  };
}
