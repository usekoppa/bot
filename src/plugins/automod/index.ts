import { Category } from "@cmds/categories";
import { plugin } from "@core/plugin";

export const AutoModPlugin = plugin(
  Plugin =>
    class extends Plugin {
      name = "AutoModeration";
      description = "Auto moderation features";
      category = Category.Moderation;
    }
);
