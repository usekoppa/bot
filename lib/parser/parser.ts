import { NoArgsCommandContext } from "@cmds/context";
import { Asyncable } from "@utils/types";

import { Usage, UsageTuple } from "./usage";

export type Parse<T> = (
  ctx: NoArgsCommandContext,
  arg: string
) => Asyncable<T | undefined>;

export interface Parser<T> {
  name: string;
  parse: Parse<T>;
  prohibitedAntecedents?: string[];
}

// We have to do it this way because TypeScript will try and intersect all the Parameter types
// together because A extends Parameter but the N itself does not, only the string aspect of it does,
// thus we are left with vague types that are not literals.
type Name<A> = A extends { name: infer N }
  ? N extends string
    ? N
    : never
  : never;

// The same problem as before is evident here, so we have to use the same workaround.
type ParsedValue<A> = A extends {
  greedy: infer G;
  optional: infer O;
  parse: Parser<infer T>;
}
  ? (G extends true ? T[] : T) | (O extends true ? undefined : never)
  : never;

export type ParsedArguments<U> = U extends UsageTuple<Usage>
  ? {
      [K in Exclude<keyof U, keyof []> as Name<U[K]>]: ParsedValue<U[K]>;
    }
  : never;
