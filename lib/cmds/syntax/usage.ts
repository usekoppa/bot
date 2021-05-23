import { UnionToTuple } from "@utils/types";

import { ArgumentNode } from "./argument";

export type Usage = ArgumentNode[];

export type UsageTuple<U extends Usage> = U extends (infer A)[]
  ? UnionToTuple<A>
  : never;

export function getUsageString(usage: Usage) {
  let usageString = "";
  for (const argument of usage) {
    let key = argument.greedy ? "..." : "";
    key += argument.name;
    if (argument.optional) {
      key = `[${key}]`;
    } else {
      key = `<${key}>`;
    }

    usageString += `${key} `;
  }

  return usageString.trimRight();
}
