import { Message } from "discord.js";

import { Usage, UsageTuple } from "./usage";

export type Parser<T> = (opts: {
  msg: Message;
  data: string;
  raw: string[];
}) => T | undefined;

type Name<A> = A extends { name: infer N }
  ? N extends string
    ? N
    : never
  : never;

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
