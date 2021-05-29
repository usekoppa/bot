import { Asyncable } from "@utils/types";

import { PermissionString, TextChannel } from "discord.js";

import { Usage } from "./syntax/usage";
import { Category } from "./categories";
import { Context } from "./context";

type Runner<U extends Usage> = (
  ctx: Context<U>
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
