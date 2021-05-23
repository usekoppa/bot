import { Parser } from "./parser";

export interface ArgumentNode<T = unknown> {
  name: string;
  greedy: boolean;
  optional: boolean;
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
  opts?: { optional?: O; greedy?: G }
): {
  name: N;
  greedy: G;
  optional: O;
  parse: Parser<T>;
} {
  return {
    name,
    greedy: (opts?.greedy ?? false) as G,
    optional: (opts?.optional ?? false) as O,
    parse: parser,
  };
}
