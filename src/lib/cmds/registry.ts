import { Logger } from "@utils/logger";
import { Asyncable } from "@utils/util_types";

import { Message, TextChannel } from "discord.js";
import equal from "fast-deep-equal";
import { Service } from "typedi";

type Runner = (opts: {
  msg: Message;

  // TODO(@zorbyte): This would be dynamically produced from the syntax usage tree.
  args: string[];
  callKey: string;
  log: Logger;
}) => Asyncable<Parameters<TextChannel["send"]>[0]>;

export interface Command {
  name: string;
  aliases?: string[];
  description?: string;

  // TODO(@zorbyte): This will depend on a syntax usage tree, that produces an easy to use representation to the user.
  usage?: string;
  run: Runner;
}

// The values of aliases are a string, which are then resolved to commands.
type CommandResolvable = Command | string;

@Service()
export class Registry {
  private commands = new Map<string, CommandResolvable>();

  public add(cmd: Command) {
    if (this.has(cmd.name) || this.has(cmd)) {
      throw new Error(`Duplicate command ${cmd.name}`);
    }

    this.commands.set(cmd.name, cmd);
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

  public *values() {
    for (const resolvable of this.commands.values()) {
      if (typeof resolvable !== "string") yield resolvable;
    }
  }

  public *[Symbol.iterator]() {
    yield* this.values();
  }
}
