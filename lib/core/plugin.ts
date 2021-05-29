import { Category } from "@cmds/categories";
import { Command } from "@cmds/command";
import { Usage } from "@cmds/syntax/usage";
import { createLogger, Logger } from "@utils/logger";
import { Asyncable } from "@utils/types";

import { PermissionString } from "discord.js-light";
import { Container } from "typedi";

import { DefaultPermissions } from "../perms/permissions";

import { PluginCommand } from "./command";
import { Event } from "./event";
import { Events } from "./events";
import { PluginManager } from "./plugin_manager";

export const kPlugin = Symbol("plugin");

export abstract class BasePlugin {
  abstract name: string;
  abstract category: Category;
  abstract description: string;

  permissions = DefaultPermissions.User;

  global = false;
  enabled = true;
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

export function plugin<P extends ImplementedBasePlugin>(
  fn: (Plugin: BasePluginCtor) => ImplementedPluginCtor<P>
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const events: Event[] = [];
  const commands: Command[] = [];

  // eslint is having a fit
  // eslint-disable-next-line prefer-const
  let ctedPlugin: ImplementedPluginCtor<P> & typeof Plugin;

  const manager = Container.get(PluginManager);

  class Plugin extends BasePlugin {
    name = "BasePlugin";
    description = "A plugin that is the base for all other plugins";
    category = "None" as Category;

    #log?: Logger;

    static [kPlugin] = true;

    get log(): Logger {
      if (typeof this.#log === "undefined") {
        const self = manager.get(ctedPlugin);
        this.#log = createLogger(self.name);
      }

      return this.#log;
    }

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

    static event<N extends keyof Events>(event: Event<N>) {
      events.push(event as unknown as Event);
    }

    get events() {
      return events;
    }

    get commands() {
      return commands;
    }
  }

  ctedPlugin = fn(
    Plugin as unknown as typeof BasePlugin
  ) as ImplementedPluginCtor<P> & typeof Plugin;

  return ctedPlugin;
}

type PluginWithFunction = ReturnType<typeof plugin>;

// eslint-disable-next-line @typescript-eslint/ban-types
export interface Plugin extends Omit<PluginWithFunction, keyof Function> {
  new (): InstanceType<PluginWithFunction>;
}

export type PluginInstance = InstanceType<Plugin>;