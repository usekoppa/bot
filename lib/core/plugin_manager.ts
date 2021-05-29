import { readdir } from "fs/promises";
import { join } from "path";

import { CommandRegistry } from "@cmds/registry";
import { exists } from "@utils/exists";
import { createLogger } from "@utils/logger";

import { FSWatcher, watch } from "chokidar";
import { Collection } from "discord.js";
import { Container, Service } from "typedi";

import { EventManager, WrappedEventListener } from "./event_manager";
import { Events } from "./events";
import { kPlugin, Plugin, PluginInstance } from "./plugin";

const registry = Container.get(CommandRegistry);

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
          if (
            typeof pluginExport === "function" &&
            (pluginExport as Plugin)[kPlugin]
          ) {
            plugin = pluginExport as Plugin;
            break;
          }
        }

        if (typeof plugin === "undefined") {
          this.#log.warn("Plugin did not have a valid plugin export", { file });
          return;
        }

        await this.callSubdirs(pluginPath);
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
    const pl = this.get(plugin);
    const manager = new EventManager(pl.log);
    manager.off(name, listener);
  }

  private async callSubdirs(path: string) {
    const paths = ["cmds", "events"];
    await Promise.all(
      paths.map(async dirPath => {
        const absolute = join(path, dirPath);
        if (await exists(absolute)) {
          const dirFiles = await readdir(absolute);
          await Promise.all(
            dirFiles.map(fileName => import(join(absolute, fileName)))
          );
        }
      })
    );
  }

  private add(plugin: Plugin) {
    const pl = new plugin();
    this.#plugins.set(plugin, pl);
    pl.commands.forEach(registry.add.bind(registry));

    const manager = new EventManager(pl.log);

    pl.events.forEach(event => {
      const listener = manager.add(event);
      const events =
        this.#events.get(plugin) ??
        ({} as Record<keyof Events, WrappedEventListener>);

      events[event.name] = listener;

      this.#events.set(plugin, events);
    });
  }

  private async onChange(path: string) {
    this.#log.debug("File change in plugin detected. Reloading", { path });
    await this.reload(path);
  }
}
