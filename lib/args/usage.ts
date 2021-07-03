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

export function validateUsage(usage: Usage) {
  let prevParam: Parameter | undefined;
  for (const param of usage) {
    if (
      typeof prevParam !== "undefined" &&
      param.transformer.prohibitedAntecedents?.includes(
        prevParam.transformer.name
      )
    ) {
      throw new Error(
        `A parameter of parser ${param.transformer.name} can not have an antecedent of ${prevParam.transformer.name}`
      );
    }

    prevParam = param;
  }
}
