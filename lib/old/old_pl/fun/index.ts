import { Category } from "../lib/cmds_old/categories";
import { plugin } from "@core/plugin";

export const FunPlugin = plugin(
  Plugin =>
    class extends Plugin {
      name = "Fun";
      description = "Fun commands";
      category = Category.Fun;
    }
);
