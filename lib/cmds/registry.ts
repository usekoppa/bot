import { createLogger } from "@utils/logger";

import equal from "fast-deep-equal";
import { Service } from "typedi";

import { Command } from "./command";

// The values of aliases are a string, which are then resolved to commands.
type CommandResolvable = Command | string;

@Service()
export class Registry {
  private log = createLogger("registry");
  private commands = new Map<string, CommandResolvable>();
  #size = 0;

  public add(cmd: Command) {
    this.log.debug(`Adding command ${cmd.name}`);
    if (this.has(cmd.name) || this.has(cmd)) {
      throw new Error(`Duplicate command ${cmd.name}`);
    }

    this.commands.set(cmd.name, cmd);
    this.#size += 1;
    for (const alias of cmd.aliases ?? []) this.commands.set(alias, cmd.name);
  }

  public find(key: string) {
    const resolvable = this.commands.get(key);
    return this.resolve(resolvable);
  }

  public has(resolvable: CommandResolvable): boolean {
    if (typeof resolvable === "string") return this.commands.has(resolvable);
    for (const cmd of this.commands.values()) {
      if (equal(resolvable, cmd)) return true;
    }

    return false;
  }

  public resolve(resolvable: CommandResolvable | undefined) {
    if (typeof resolvable === "string") {
      return this.commands.get(resolvable) as Command | undefined;
    }

    return resolvable;
  }

  public get size() {
    return this.#size;
  }

  public *values() {
    for (const resolvable of this.commands.values()) {
      if (typeof resolvable !== "string") yield resolvable;
    }
  }

  public *[Symbol.iterator]() {
    yield* this.values();
  }
}
