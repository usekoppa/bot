import { UnionToTuple } from "@utils/types";

import { Argument } from "./argument";

export type Usage = Argument[];

export type UsageTuple<U extends Usage> = U extends (infer A)[]
  ? UnionToTuple<A>
  : never;

export function getUsageString(usage: Usage) {
  let usageString = "";
  for (const arg of usage) usageString += `${getArgumentString(arg)} `;

  return usageString.trimRight();
}

export function getArgumentString(arg: Argument) {
  let key =
    arg.name.endsWith("s") && arg.pluralise
      ? `${arg.name.slice(0, -1)}(s)`
      : arg.name;

  if (arg.greedy) key += "...";
  if (arg.optional) {
    key = `[${key}]`;
  } else {
    key = `<${key}>`;
  }

  return key;
}
