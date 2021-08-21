import { Event, Events } from "@events";
import { createLogger, Logger } from "@utils/logger";
import { Asyncable } from "@utils/types";

import { PermissionString } from "discord.js";
import { Container } from "typedi";

import { DefaultPermissions } from "../old/perms/permissions";

import { PluginCommand } from "./plugin_command";
import { PluginManager } from "./plugin_manager";

export const kPlugin = Symbol("plugin");

export abstract class BasePlugin {
  abstract name: string;

  // Information about the plugin.
  abstract description: string;

  // Assuming the user uses the default permissions scheme,
  // this would be the default permissions to use the command.
  permissions = DefaultPermissions.User;

  // A global plugin registers all its commands as global ones.
  global = false;

  // If the plugin is enabled by default.
  enabledByDefault = true;

  // The permissions the bot needs to run a command in the plugin, or for the plugin to work in general.
  botPermissions: PermissionString[] = [];

  get log(): Logger {
    // This is overwritten below.
    return void 0 as unknown as Logger;
  }

  cleanup?: () => Asyncable<void>;
}

type BasePluginCtor = typeof BasePlugin;

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface ImplementedBasePlugin extends BasePlugin {}

type ImplementedPluginCtor<P extends ImplementedBasePlugin> = new (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ...args: any[]
) => P;

export function createPlugin<P extends ImplementedBasePlugin>(
  fn: (Plugin: BasePluginCtor) => ImplementedPluginCtor<P>
) {
  let events: Event<keyof Events>[] = [];
  let commands: Command[] = [];

  // You have no idea how fucking retarded this is.
  if (events.length > 0) events = [];
  if (commands.length > 0) commands = [];

  // eslint is having a fit
  // eslint-disable-next-line prefer-const
  let ctedPlugin: ImplementedPluginCtor<P> & typeof Plugin;

  const manager = Container.get(PluginManager);

  class Plugin extends BasePlugin {
    name = "BasePlugin";
    description = "A plugin that is the base for all other plugins";

    #log?: Logger;

    // This is used for when the plugins are loaded by reading the plugins directory.
    // It checks the export and whether they have the kPlugin symbol on them or not.
    static [kPlugin] = true;

    static command<U extends Usage>(cmd: PluginCommand<U>) {
      commands.push({
        ...cmd,
        get botPermissions() {
          const self = manager.get(ctedPlugin);
          return cmd.botPermissions ?? self.botPermissions;
        },
        get permissions() {
          const self = manager.get(ctedPlugin);
          return cmd.permissions ?? self.permissions;
        },
        get category() {
          const self = manager.get(ctedPlugin);
          return cmd.category ?? self.category;
        },
        get pluginName() {
          const self = manager.get(ctedPlugin);
          return self.name;
        },
      });
    }

    // Registers an event for this plugin.
    static event<N extends keyof Events>(event: Event<N>) {
      events.push(event as unknown as Event<keyof Events>);
    }

    get commands() {
      return commands;
    }

    get events() {
      return events;
    }

    get log(): Logger {
      if (typeof this.#log === "undefined") {
        const self = manager.get(ctedPlugin);
        this.#log = createLogger("plugins", { childNames: [self.name] });
      }

      return this.#log;
    }
  }

  ctedPlugin = fn(
    Plugin as unknown as typeof BasePlugin
  ) as ImplementedPluginCtor<P> & typeof Plugin;

  return ctedPlugin;
}

type PluginWithFunction = ReturnType<typeof createPlugin>;

// eslint-disable-next-line @typescript-eslint/ban-types
export interface Plugin extends Omit<PluginWithFunction, keyof Function> {
  new (): InstanceType<PluginWithFunction>;
}

export type PluginInstance = InstanceType<Plugin>;
