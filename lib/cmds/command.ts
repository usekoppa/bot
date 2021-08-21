import {
  ApplicationCommandData,
  ApplicationCommandOptionData,
} from "discord.js";
import { ApplicationCommandOptionTypes } from "discord.js/typings/enums";

import { Base } from "./base";
import { Middleware } from "./middleware";
import { Option, OptionWithChoices } from "./option";
import { OptionTypesMap } from "./options_types_map";
import { Subcommand, SubcommandGroup } from "./subcommands";

type ArgumentContainer<
  T extends ApplicationCommandOptionTypes,
  N extends string,
  R extends boolean
> = Record<N, OptionTypesMap[T] | (R extends false ? undefined : never)>;

type AddOptionFn<
  T extends ApplicationCommandOptionTypes,
  N extends string,
  R extends boolean
> = (opt: Option<T>) => Option<T, N, R>;

type AddOptionWithChoiceFn<
  T extends
    | ApplicationCommandOptionTypes.INTEGER
    | ApplicationCommandOptionTypes.STRING,
  N extends string,
  R extends boolean,
  C extends OptionTypesMap[T]
> = (opt: OptionWithChoices<T>) => OptionWithChoices<T, N, R, C>;

type CommandWithSubcommandOpts<A> = Pick<
  Command<A, false>,
  | "addSubcommand"
  | "addSubcommandGroup"
  | "setName"
  | "setDescription"
  | "defaultPermission"
  | "description"
  | "enableDefaultPermission"
  | "toJSON"
  | "name"
  | "options"
  | "type"
  | "use"
>;

type CommandWithSubcommands<A> = Omit<
  CommandWithSubcommandOpts<A>,
  "addSubcommandGroup"
>;

type CommandWithSubcommandGroup<A> = Omit<
  CommandWithSubcommandOpts<A>,
  "addSubcommand"
>;

// eslint-disable-next-line @typescript-eslint/ban-types
export class Command<A = {}, S extends boolean = false>
  extends Base
  implements ApplicationCommandData
{
  type: ApplicationCommandOptionTypes = undefined!;
  stack: Middleware<A>[] = [];
  runner?: Middleware<A>;

  #options: (ApplicationCommandOptionData & Base)[] = [];
  #defaultPermissionEnabled = true;

  constructor(public isSubcommand: S = false as S) {
    super();

    if (isSubcommand) this.type = ApplicationCommandOptionTypes.SUB_COMMAND;
  }

  get defaultPermission() {
    return this.#defaultPermissionEnabled;
  }

  get options() {
    return this.#options.length === 0 ? void 0 : this.#options;
  }

  setName(name: string) {
    this._name = name;
    return this;
  }

  setDescription(description: string) {
    this._description = description;
    return this;
  }

  enableDefaultPermission(enabled: boolean) {
    this.#defaultPermissionEnabled = enabled;
    return this;
  }

  addSubcommand(fn: (subcommand: Subcommand) => Subcommand) {
    const cmd = new Command(true);
    const subCmd = fn(cmd);
    this.#options.push(subCmd);
    return this as unknown as CommandWithSubcommands<A>;
  }

  addSubcommandGroup(fn: (group: SubcommandGroup) => SubcommandGroup) {
    const group = new SubcommandGroup();
    const finalGroup = fn(group);
    this.#options.push(finalGroup);
    return this as unknown as CommandWithSubcommandGroup<A>;
  }

  addStringOption<
    T extends ApplicationCommandOptionTypes.STRING,
    N extends string,
    R extends boolean,
    C extends string
  >(fn: AddOptionWithChoiceFn<T, N, R, C>) {
    return this.#addOptionWithChoices<T, N, R, C>(
      ApplicationCommandOptionTypes.STRING as T,
      fn
    );
  }

  addNumberOption<N extends string, R extends boolean>(
    fn: AddOptionFn<ApplicationCommandOptionTypes.NUMBER, N, R>
  ) {
    return this.#addOption(ApplicationCommandOptionTypes.NUMBER, fn);
  }

  use(fn: Middleware<A> | Middleware<A>[]) {
    this.stack.push(...(Array.isArray(fn) ? fn : [fn]));
    return this;
  }

  run(fn: Middleware<A>) {
    this.stack.push(fn);
    return this;
  }

  toJSON() {
    return {
      name: this.name,
      description: this.description,
      options: this.#options.map(opt => opt.toJSON()),
    };
  }

  #addOptionWithChoices<
    T extends
      | ApplicationCommandOptionTypes.INTEGER
      | ApplicationCommandOptionTypes.STRING,
    N extends string,
    R extends boolean,
    C extends OptionTypesMap[T]
  >(type: T, fn: AddOptionWithChoiceFn<T, N, R, C>) {
    const opt = new OptionWithChoices(type);
    const newOpt = fn(opt);
    this.#options.push(newOpt);
    return this as unknown as Omit<
      Command<A & Record<N, C | (R extends false ? undefined : never)>, S>,
      "addSubcommand" | "addSubcommandGroup"
    >;
  }

  #addOption<
    T extends ApplicationCommandOptionTypes,
    N extends string,
    R extends boolean
  >(type: T, fn: AddOptionFn<T, N, R>) {
    const opt = new Option(type);
    const newOpt = fn(opt);
    this.#options.push(newOpt);
    return this as unknown as Omit<
      Command<A & ArgumentContainer<T, N, R>, S>,
      "addSubcommand" | "addSubcommandGroup"
    >;
  }
}
