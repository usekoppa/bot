import { Optional } from "@utils/types";

import { Usage } from "@parser/usage";

import { Command } from "../lib/cmds_old/command";

// These properties are generally handled by the plugin.
export type PluginCommand<U extends Usage> = Omit<
  Optional<Command<U>, "permissions" | "botPermissions" | "category">,
  "pluginName"
>;
