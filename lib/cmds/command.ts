import { Asyncable } from "@utils/types";

import { TextChannel } from "discord.js";

import { Category } from "./categories";
import { Context } from "./context";

type Runner = (ctx: Context) => Asyncable<Parameters<TextChannel["send"]>[0]>;

export interface Command {
  name: string;
  aliases?: string[];
  category: Category;
  description: string;

  // TODO(@zorbyte): This will depend on a syntax usage tree, that produces an easy to use representation to the user.
  usage?: string;
  run: Runner;
}
