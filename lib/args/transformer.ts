import { NoArgsCommandContext } from "@cmds/context";
import { Asyncable } from "@utils/types";

import { Usage, UsageTuple } from "./usage";

export type Transform<T> = (
  ctx: NoArgsCommandContext,
  arg: unknown
) => Asyncable<T | symbol | undefined>;

export interface Transformer<T> {
  name: string;
  transform: Transform<T>;
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
type TransformedValue<A> = A extends {
  greedy: infer G;
  optional: infer O;
  parser: Transformer<infer T>;
}
  ? (G extends true ? T[] : T) | (O extends true ? undefined : never)
  : never;

export type Arguments<U> = U extends UsageTuple<Usage>
  ? {
      [K in Exclude<keyof U, keyof []> as Name<U[K]>]: TransformedValue<U[K]>;
    }
  : never;
