import { Command } from "@cmds/command";
import { Usage } from "@cmds/syntax/usage";
import { Optional } from "@utils/types";

// These properties are generally handled by the plugin.
export type PluginCommand<U extends Usage> = Omit<
  Optional<Command<U>, "permissions" | "botPermissions" | "category">,
  "pluginName"
>;
