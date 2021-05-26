import { Category } from "@cmds/categories";
import { Command } from "@cmds/command";
import { Usage } from "@cmds/syntax/usage";
import { Asyncable } from "@utils/types";

import { Event, Events } from "./events";

abstract class Plugin {
  abstract name: string;
  abstract category: Category;
  abstract description: string;
}

interface ImplementedPlugin extends Plugin {
  cleanup?: () => Asyncable<void>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ImplementedPluginCtor = new (...args: any[]) => ImplementedPlugin;

export function plugin(
  fn: (BasePlugin: typeof Plugin) => ImplementedPluginCtor
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const events: Event<any>[] = [];
  const commands: Command[] = [];

  class BasePlugin extends Plugin {
    name = "BasePlugin";
    description = "A plugin that is the base for all other plugins";
    category = "None" as Category;

    static command<U extends Usage>(cmd: Command<U>) {
      commands.push(cmd);
    }

    static event<N extends keyof Events>(event: Event<N>) {
      events.push(event);
    }

    get events() {
      return events;
    }

    get commands() {
      return commands;
    }
  }

  return fn((BasePlugin as unknown) as typeof Plugin) as ImplementedPluginCtor &
    typeof BasePlugin;
}
