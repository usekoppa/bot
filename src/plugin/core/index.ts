import { Category } from "@cmds/categories";
import { kPlugin, plugin } from "@core/plugin";

export const CorePlugin = plugin(
  Plugin =>
    class extends Plugin {
      name = "Core";
      description = "Core features that come with the bot.";
      category = Category.Information;
      global = true;
    }
);

export default { [kPlugin]: CorePlugin };
