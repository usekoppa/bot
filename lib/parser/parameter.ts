import { CommandContext, NoArgsCommandContext } from "@cmds/context";

import { Parser } from "./parser";

export interface Parameter<T = unknown> {
  name: string;
  aliases: string[];
  greedy: boolean;
  optional: boolean;
  sentence: boolean;
  pluralise: boolean;
  parser: Parser<T>;
  default?: (ctx: NoArgsCommandContext) => T;
}

export function parameter<T, N extends string, G = false, O = false>(
  name: N,
  parser: Parser<T>,
  opts?: {
    greedy?: G;
    optional?: O;
    sentence?: boolean;
    aliases?: string[];
    pluralise?: G extends false ? false : boolean;
    default?: (ctx: CommandContext) => T;
  }
): {
  name: N;
  // Stupid workarounds.
  greedy: G extends false ? false : true;
  optional: O extends false ? false : true;
  sentence: boolean;
  pluralise: boolean;
  aliases: string[];
  parser: Parser<T>;
  default?: (ctx: CommandContext) => T;
} {
  const param = {
    name,
    greedy: (opts?.greedy ?? false) as G,
    optional: (opts?.optional ?? false) as O,
    sentence: opts?.sentence ?? false,
    pluralise: opts?.pluralise ?? false,
    aliases: opts?.aliases ?? [],
    parser,
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
