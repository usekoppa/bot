import { UnionToTuple } from "@utils/types";

import { getParameterString, Parameter } from "./parameter";

export type Usage = Parameter[];

// Since the usage as supplied to a function would be a union of various types,
// we separate it back into a Tuple.
export type UsageTuple<U extends Usage> = U extends (infer A)[]
  ? UnionToTuple<A>
  : never;

export function getUsageString(usage: Usage) {
  let usageString = "";
  for (const param of usage) usageString += `${getParameterString(param)} `;

  return usageString.trimRight();
}
