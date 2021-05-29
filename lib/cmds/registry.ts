import { createLogger } from "@utils/logger";

import equal from "fast-deep-equal";
import { Service } from "typedi";

import { Usage } from "./syntax/usage";
import { Command } from "./command";

// The values of aliases are a string, which are then resolved to commands.
type CommandResolvable<U extends Usage> = Command<U> | string;

@Service()
export class CommandRegistry {
  #log = createLogger("registry");
  #commands = new Map<string, CommandResolvable<Usage>>();
  #size = 0;

  add<U extends Usage>(cmd: Command<U>) {
    this.#log.debug("Adding command", { name: cmd.name });
    if (this.has(cmd.name) || this.has(cmd)) {
      throw new Error(`Duplicate command "${cmd.name}"`);
    }

    this.#commands.set(cmd.name, cmd);
    this.#size += 1;
    for (const alias of cmd.aliases ?? []) this.#commands.set(alias, cmd.name);
  }

  find(key: string) {
    const resolvable = this.#commands.get(key);
    return this.resolve(resolvable);
  }

  has<U extends Usage>(resolvable: CommandResolvable<U>): boolean {
    if (typeof resolvable === "string") return this.#commands.has(resolvable);
    for (const cmd of this.#commands.values()) {
      if (equal(resolvable, cmd)) return true;
    }

    return false;
  }

  resolve<U extends Usage>(resolvable: CommandResolvable<U> | undefined) {
    if (typeof resolvable === "string") {
      return this.#commands.get(resolvable) as Command<Usage> | undefined;
    }

    return resolvable;
  }

  get size() {
    return this.#size;
  }

  *values() {
    for (const resolvable of this.#commands.values()) {
      if (typeof resolvable !== "string") yield resolvable;
    }
  }

  *[Symbol.iterator]() {
    yield* this.values();
  }
}
