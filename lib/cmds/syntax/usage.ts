import { UnionToTuple } from "@utils/types";

import { getParameterString, Parameter } from "./parameter";

export type Usage = Parameter[];

export type UsageTuple<U extends Usage> = U extends (infer A)[]
  ? UnionToTuple<A>
  : never;

export function getUsageString(usage: Usage) {
  let usageString = "";
  for (const param of usage) usageString += `${getParameterString(param)} `;

  return usageString.trimRight();
}
