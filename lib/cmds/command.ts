import { Asyncable } from "@utils/types";

import { PermissionString, TextChannel } from "discord.js-light";

import { Usage } from "../parser/usage";

import { Category } from "./categories";
import { CommandContext } from "./context";

type Runner<U extends Usage> = (
  ctx: CommandContext<U>
) => Asyncable<Parameters<TextChannel["send"]>[0]>;

export interface Command<U extends Usage = Usage> {
  name: string;
  pluginName: string;
  permissions: number;
  botPermissions: PermissionString[];
  aliases?: string[];
  category: Category;
  description: string;
  usage?: U;
  run: Runner<U>;
}
