import { Command } from "@cmds/command";
import { Usage } from "@cmds/syntax/usage";
import { Optional } from "@utils/types";

export type PluginCommand<U extends Usage> = Omit<
  Optional<Command<U>, "permissions" | "botPermissions" | "category">,
  "pluginName"
>;
