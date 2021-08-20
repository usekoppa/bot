import { Category } from "../lib/cmds_old/categories";
import { plugin } from "@core/plugin";

export const AutoModPlugin = plugin(
  Plugin =>
    class extends Plugin {
      name = "AutoModeration";
      description = "Auto moderation features";
      category = Category.Moderation;
    }
);
