import { readdir } from "fs/promises";
import { join, relative, sep } from "path";

import { CommandRegistry } from "@cmds/registry";
import { count } from "@utils/count";
import { exists } from "@utils/exists";
import { createLogger } from "@utils/logger";

import { FSWatcher, watch } from "chokidar";
import { Collection } from "discord.js-light";
import ms from "ms";
import { Container, Service } from "typedi";

import { EventManager, WrappedEventListener } from "./event_manager";
import { Events } from "./events";
import { kPlugin, Plugin, PluginInstance } from "./plugin";

const registry = Container.get(CommandRegistry);

@Service()
export class PluginManager {
  #log = createLogger("plugins");
  #plugins = new Collection<Plugin, PluginInstance>();
  #events = new Map<Plugin, Record<keyof Events, WrappedEventListener>>();
  #paths = new Collection<Plugin, string>();
  #path?: string;
  #hasLoaded = false;
  #watcher?: FSWatcher;

  // This should only ever be run inside the plugin itself
  // or after the bot is ready in other plugins.
  get<P extends Plugin>(plugin: P): InstanceType<P> {
    return this.#plugins.get(plugin) as InstanceType<P>;
  }

  async load(path: string) {
    if (this.#hasLoaded) return;
    this.#path = path;

    this.#log.info("Loading plugins", { path });
    const startTime = Date.now();
    const pluginPaths = await readdir(path);
    await Promise.all(
      pluginPaths.map(async file => {
        this.#log.debug("Importing plugin", { file });
        const pluginPath = join(path, file);
        const pluginExports = await import(pluginPath);
        const plugin = this.pluginFromExports(pluginExports);
        if (typeof plugin === "undefined") {
          return this.#log.warn("Plugin did not have a valid plugin export", {
            file,
          });
        }

        await this.add(plugin, pluginPath);
      })
    ).catch(err => {
      this.#log.error("Failed to load plugins", err);
      process.exit(1);
    });

    this.#hasLoaded = true;

    const endTime = Date.now() - startTime;
    this.#log.info(`Loaded plugins`, { time: `~${ms(endTime)}` });
  }

  async reload(plugin: Plugin | PluginInstance | string) {
    let path: string;
    if (typeof plugin === "string") {
      path = plugin;
      plugin = this.#paths.findKey(pluginPath => path === pluginPath)!;
    } else {
      path = this.#paths.get(this.resolvePlugin(plugin))!;
    }

    if (typeof plugin === "undefined" || typeof path === "undefined") {
      return this.#log.warn(
        "Tried to reload a plugin that was not in the manager",
        { name: plugin?.name, path: path }
      );
    }

    const pl = this.get(plugin as Plugin);
    await pl.cleanup?.();
    this.allOff(pl);
    for (const cmd of pl.commands) registry.remove(cmd);

    delete require.cache[path];

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const newPluginExports = await import(path);
    const newPlugin = this.pluginFromExports(newPluginExports);
    if (typeof newPlugin === "undefined") {
      return this.#log.warn(
        "The plugin that got reloaded has a faulty exports signature",
        { path }
      );
    }

    this.#plugins.delete(plugin as Plugin);

    await this.add(newPlugin, path);

    // I'm assuming that we may end up with some places calling for the plugin
    // using the old constructor, so we just point those to the new one.
    this.#plugins.set(plugin as Plugin, this.get(newPlugin));
  }

  // TODO(@zorbyte): Have a functioning version of this.
  // What we'll likely have to do is have some sort of process that keeps the connection
  // to discord alive while the bot reloads using something like nodemon. The whole point in having
  // the ability to hot reload is so that we can avoid getting api banned.
  watch() {
    throw new Error("This feature currently does not function correctly");

    if (!this.#hasLoaded) {
      throw new Error(
        "Can not watch the plugins directory if it has not been loaded yet"
      );
    }

    if (typeof this.#watcher !== "undefined") {
      return this.#log.warn("Tried to watch while already watching");
    }

    this.#log.warn("Hot Plugin Reloading is starting", { path: this.#path });

    this.#watcher = watch(this.#path!, { atomic: true });

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    this.#watcher!.on("change", this.onChange.bind(this));
  }

  async stopWatching() {
    this.#watcher?.removeAllListeners("change");
    await this.#watcher?.close();
    this.#watcher = void 0;
  }

  off(plugin: Plugin | PluginInstance, name: keyof Events) {
    const listener = this.#events.get(this.resolvePlugin(plugin))?.[name];
    if (typeof listener === "undefined") return;
    const pl = this.resolveInstance(plugin);
    const manager = new EventManager(pl.log);
    manager.off(name, listener);
  }

  allOff(plugin: Plugin | PluginInstance) {
    const pl = this.resolveInstance(plugin);
    for (const event of pl.events) this.off(plugin, event.name);
  }

  private resolveInstance(plugin: Plugin | PluginInstance): PluginInstance {
    if (typeof (plugin as Plugin)[kPlugin] !== "undefined") {
      return this.get(plugin as Plugin);
    }

    return plugin as PluginInstance;
  }

  private resolvePlugin(plugin: Plugin | PluginInstance): Plugin {
    if (typeof (plugin as Plugin)[kPlugin] !== "undefined") {
      return plugin as Plugin;
    }

    return this.#plugins.findKey(
      pl => pl.name === (plugin as PluginInstance).name
    )!;
  }

  private async add(plugin: Plugin, path: string) {
    this.#paths.set(plugin, path);
    await this.callSubdirs(path);

    const pl = new plugin();
    this.#log.debug("Loading plugin", {
      name: pl.name,
      commands: pl.commands.length,
      events: pl.events.length,
    });

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

  public pluginFromExports(pluginExports: Record<string, unknown>) {
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

    return plugin;
  }

  private async callSubdirs(path: string) {
    const paths = ["cmds", "events"];
    await Promise.all(
      paths.map(async dirPath => {
        const absolute = join(path, dirPath);
        if (await exists(absolute)) {
          const dirFiles = await readdir(absolute);
          await Promise.all(
            dirFiles.map(fileName => {
              const filePath = join(absolute, fileName);
              if (typeof require.cache[filePath] !== "undefined") {
                delete require.cache[filePath];
              }

              return import(filePath);
            })
          );
        }
      })
    );
  }

  private async onChange(path: string) {
    const relPath = relative(this.#path!, path);

    // It should count pluginName/index.js as 1, hence anything else
    // deeper will not pass through to the reloader and should instead
    // refer to its actual plugin.
    if (count(relPath, sep) > 1) {
      path = join(this.#path!, relPath.split(sep)[0], "index.js");
    }

    // Removes the /index.js from the end.
    path = path.slice(0, -9);
    this.#log.debug("File change in plugin detected. Reloading", { path });
    await this.reload(path);
  }
}
