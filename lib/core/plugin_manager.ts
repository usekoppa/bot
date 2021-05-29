import { readdir } from "fs/promises";
import { join } from "path";

import { CommandRegistry } from "@cmds/registry";
import { createLogger } from "@utils/logger";

import { FSWatcher, watch } from "chokidar";
import { Collection } from "discord.js";
import { Container, Service } from "typedi";

import { EventManager, WrappedEventListener } from "./event_manager";
import { Events } from "./events";
import { BasePlugin, kPlugin, Plugin, PluginInstance } from "./plugin";

const registry = Container.get(CommandRegistry);
const manager = Container.get(EventManager);

@Service()
export class PluginManager {
  #log = createLogger();
  #plugins = new Map<Plugin, PluginInstance>();
  #events = new Map<Plugin, Record<keyof Events, WrappedEventListener>>();
  #paths = new Collection<Plugin, string>();
  #path?: string;
  #hasLoaded = false;
  #watcher?: FSWatcher;

  get<P extends Plugin>(plugin: P): InstanceType<P> {
    return this.#plugins.get(plugin) as InstanceType<P>;
  }

  watch() {
    if (!this.#hasLoaded) {
      throw new Error(
        "Can not watch the plugins directory if it has not been loaded yet"
      );
    }

    if (typeof this.#watcher !== "undefined") return;

    this.#watcher = watch(this.#path!);

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    this.#watcher.on("change", this.onChange.bind(this));
  }

  async stopWatching() {
    this.#watcher?.removeAllListeners("change");
    await this.#watcher?.close();
    this.#watcher = void 0;
  }

  async reload(plugin: Plugin | string) {
    let path: string;
    if (typeof plugin === "string") {
      path = plugin;
      plugin = this.#paths.findKey(pluginPath => path === pluginPath)!;
    } else {
      path = this.#paths.get(plugin)!;
    }

    if (typeof plugin === "undefined" || typeof path === "undefined") return;

    const pl = this.get(plugin);
    await pl.cleanup?.();

    delete require.cache[path];

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const newPlugin = (await import(path))[kPlugin] as Plugin;

    this.add(newPlugin);

    // I'm assuming that we may end up with some places calling for the plugin
    // using the old constructor, so we just point those to the new one.
    this.#plugins.set(plugin, this.get(newPlugin));
  }

  async loadDir(path: string) {
    if (this.#hasLoaded) return;

    this.#log.info("Loading plugins");
    const startTime = Date.now();
    const pluginPaths = await readdir(path);
    await Promise.all(
      pluginPaths.map(async file => {
        this.#log.debug("Importing plugin", { file });
        const pluginPath = join(path, file);
        const pluginExports = await import(pluginPath);
        let plugin: Plugin | undefined;
        for (const pluginExport of Object.values(pluginExports)) {
          if (pluginExport instanceof BasePlugin) {
            plugin = pluginExport as unknown as Plugin;
            break;
          }
        }

        if (typeof plugin === "undefined") return;

        this.add(plugin);
        this.#paths.set(plugin, pluginPath);
      })
    ).catch(err => {
      this.#log.error("Failed to load plugins", err);
      process.exit(1);
    });

    const endTime = Date.now() - startTime;
    this.#log.info(`Loaded plugins in ~${endTime}ms`);
  }

  off(plugin: Plugin, name: keyof Events) {
    const listener = this.#events.get(plugin)?.[name];
    if (typeof listener === "undefined") return;
    manager.off(name, listener);
  }

  private add(plugin: Plugin) {
    const pl = new plugin();
    pl.commands.forEach(cmd => {
      cmd.pluginName = pl.name;
      registry.add(cmd);
    });

    pl.events.forEach(event => {
      const listener = manager.add(event);
      const events =
        this.#events.get(plugin) ??
        ({} as Record<keyof Events, WrappedEventListener>);

      events[event.name] = listener;

      this.#events.set(plugin, events);
    });

    this.#plugins.set(plugin, pl);
  }

  private async onChange(path: string) {
    this.#log.debug("File change in plugin detected. Reloading", { path });
    await this.reload(path);
  }
}
