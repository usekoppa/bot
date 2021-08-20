import { Category } from "../lib/cmds_old/categories";
import { plugin } from "@core/plugin";

export const CorePlugin = plugin(
  Plugin =>
    class extends Plugin {
      name = "Core";
      description = "Core features that come with the bot";
      category = Category.Information;
      global = true;

      public ala() {
        // cheese
      }
    }
);


CorePlugin.command({ category:  })