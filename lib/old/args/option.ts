// @ts-nocheck

import { NoArgsCommandContext } from "../lib/cmds_old/context";

import { ApplicationCommandOptionData } from "discord.js";

import type { Resolver } from "./resolver";

// type: ApplicationCommandOptionType | ApplicationCommandOptionTypes;
// name: string;
// description: string;
// required?: boolean;
// choices?: ApplicationCommandOptionChoice[];
// options?: this[];

type OptionType<T> = T;

export interface Option<T = unknown> extends ApplicationCommandOptionData {
  name: string;
  resolver: Resolver<T>;
  default?: (ctx: NoArgsCommandContext) => T;
}

export function option<T, N extends string, G = false, O = false>(
  name: N,
  type: OptionType<T>,
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
  type: OptionType<T>;
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
    type,
    default: opts?.default,
  };

  if (param.greedy && param.sentence) {
    throw new Error("A parameter can not be greedy and a sentence");
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return param as any;
}

export function getParameterString(param: Option) {
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
