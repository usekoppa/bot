import { NoArgsCommandContext } from "../context";

import { Transformer } from "./transformer";

export interface Parameter<T = unknown> {
  name: string;
  aliases: string[];
  greedy: boolean;
  pairable: boolean;
  optional: boolean;
  sentence: boolean;
  pluralise: boolean;
  transformer: Transformer<T>;
  default?: (ctx: NoArgsCommandContext) => T;
}

export function parameter<T, N extends string, G = false, O = false>(
  name: N,
  transformer: Transformer<T>,
  opts?: {
    greedy?: G;
    optional?: O;
    pairable?: boolean;
    sentence?: boolean;
    aliases?: string[];
    pluralise?: G extends false ? false : boolean;
    default?: (ctx: NoArgsCommandContext) => T;
  }
): {
  name: N;
  // Workaround for more explicit types.
  greedy: G extends false ? false : true;
  optional: O extends false ? false : true;
  pairable: boolean;
  sentence: boolean;
  pluralise: boolean;
  aliases: string[];
  transformer: Transformer<T>;
  default?: (ctx: NoArgsCommandContext) => T;
} {
  const param = {
    name,
    greedy: (opts?.greedy ?? false) as G,
    optional: (opts?.optional ?? false) as O,
    pairable: opts?.pairable ?? true,
    sentence: opts?.sentence ?? false,
    pluralise: opts?.pluralise ?? false,
    aliases: opts?.aliases ?? [],
    transformer,
    default: opts?.default,
  };

  if (param.greedy && param.sentence) {
    throw new Error("A parameter can not be greedy and a sentence");
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return param as any;
}

export function getParameterString(param: Parameter) {
  let key =
    param.name.endsWith("s") && param.pluralise
      ? `${param.name.slice(0, -1)}(s)`
      : param.name;

  if (param.greedy) key += "...";
  if (param.optional) {
    key = `[${key}]`;
  } else {
    key = `<${key}>`;
  }

  return key;
}
