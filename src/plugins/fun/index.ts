import { Category } from "@cmds/categories";
import { plugin } from "@core/plugin";

export const FunPlugin = plugin(
  Plugin =>
    class extends Plugin {
      name = "fun";
      description = "Fun commands";
      category = Category.Fun;
    }
);
