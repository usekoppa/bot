import { Asyncable } from "@utils/types";

import {
  ApplicationCommandData,
  ApplicationCommandOptionChoice,
  ApplicationCommandOptionData,
  Channel,
  Role,
  User,
} from "discord.js";
import { ApplicationCommandOptionTypes } from "discord.js/typings/enums";
import { Snowflake } from "discord-api-types";

interface OptionTypesMap {
  [ApplicationCommandOptionTypes.SUB_COMMAND]: Command;
  [ApplicationCommandOptionTypes.SUB_COMMAND_GROUP]: Command[];
  [ApplicationCommandOptionTypes.STRING]: string;
  [ApplicationCommandOptionTypes.INTEGER]: number;
  [ApplicationCommandOptionTypes.BOOLEAN]: boolean;
  [ApplicationCommandOptionTypes.USER]: User;
  [ApplicationCommandOptionTypes.CHANNEL]: Channel;
  [ApplicationCommandOptionTypes.ROLE]: Role;
  [ApplicationCommandOptionTypes.MENTIONABLE]: Snowflake;
  [ApplicationCommandOptionTypes.NUMBER]: number;
}

abstract class BaseBuilder {
  protected _name?: string;
  protected _description?: string;
  get name() {
    this.throwIfNotSet(this._name);
    return this._name!;
  }

  get description() {
    this.throwIfNotSet(this._description);
    return this._description!;
  }

  protected throwIfNotSet(data: unknown) {
    if (
      typeof data === "undefined" ||
      data === null ||
      (typeof data === "string" && data === "")
    ) {
      throw new Error("The property has not been set.");
    }
  }
}

class Option<
    T extends ApplicationCommandOptionTypes,
    N extends string = string,
    R extends boolean = false
  >
  extends BaseBuilder
  implements ApplicationCommandOptionData
{
  _required = false;

  constructor(public type: T) {
    super();
  }

  get required() {
    this.throwIfNotSet(this._required);
    return this._required as R;
  }

  setName<NN extends string>(name: NN) {
    this._name = name;
    return this as unknown as Option<T, NN, R>;
  }

  setDescription(description: string) {
    this._description = description;
    return this;
  }

  setRequired<IR extends boolean>(required: IR) {
    this._required = required;
    return this as unknown as Option<T, N, IR>;
  }
}

class Context<A = Record<string, never>> {
  args = {} as A;
}

class OptionWithChoices<
  T extends
    | ApplicationCommandOptionTypes.INTEGER
    | ApplicationCommandOptionTypes.STRING,
  N extends string = string,
  R extends boolean = false,
  C extends OptionTypesMap[T] = never
> extends Option<T, N, R> {
  choices?: ApplicationCommandOptionChoice[];

  setName<NN extends string>(name: NN) {
    this._name = name;
    return this as unknown as OptionWithChoices<T, NN, R, C>;
  }

  setRequired<IR extends boolean>(required: IR) {
    this._required = required;
    return this as unknown as OptionWithChoices<T, N, IR, C>;
  }

  addChoice<V extends OptionTypesMap[T]>(name: string, value: V) {
    if (typeof this.choices === "undefined") this.choices = [];
    this.choices.push({ name, value });

    return this as unknown as OptionWithChoices<T, N, R, C | V>;
  }
}

type Middleware<A = Record<string, never>> = (
  ctx: Context<A>
) => Asyncable<void>;

type ArgumentContainer<
  T extends ApplicationCommandOptionTypes,
  N extends string,
  R extends boolean
> = Record<N, OptionTypesMap[T] | (R extends false ? undefined : never)>;

type AddOptionCb<
  T extends ApplicationCommandOptionTypes,
  N extends string,
  R extends boolean
> = (opt: Option<T>) => Option<T, N, R>;

type AddOptionWithChoiceCb<
  T extends
    | ApplicationCommandOptionTypes.INTEGER
    | ApplicationCommandOptionTypes.STRING,
  N extends string,
  R extends boolean,
  C extends OptionTypesMap[T]
> = (opt: OptionWithChoices<T>) => OptionWithChoices<T, N, R, C>;

// eslint-disable-next-line @typescript-eslint/ban-types
type Subcommand<A = {}> = Omit<
  Command<A, true>,
  "addSubcommand" | "addSubcommandGroup"
>;

class SubcommandGroup extends BaseBuilder {
  readonly type = ApplicationCommandOptionTypes.SUB_COMMAND_GROUP;
  options: Subcommand[] = [];

  setName(name: string) {
    this._name = name;
    return this;
  }

  setDescription(description: string) {
    this._description = description;
    return this;
  }

  addSubcommand(fn: (subcommand: Subcommand) => Subcommand) {
    const cmd = new Command(true);
    const subCmd = fn(cmd);
    this.options.push(subCmd);

    return this as Omit<this, "run">;
  }
}

// eslint-disable-next-line @typescript-eslint/ban-types
export class Command<A = {}, S extends boolean = false>
  extends BaseBuilder
  implements ApplicationCommandData
{
  type: ApplicationCommandOptionTypes = undefined!;
  #stack: Middleware<A>[] = [];
  #options: ApplicationCommandOptionData[] = [];
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
    return this as Omit<this, "run">;
  }

  addSubcommandGroup(fn: (group: SubcommandGroup) => SubcommandGroup) {
    const group = new SubcommandGroup();
    const finalGroup = fn(group);
    this.#options.push(finalGroup);
    return this as Omit<this, "run">;
  }

  addStringOption<
    T extends ApplicationCommandOptionTypes.STRING,
    N extends string,
    R extends boolean,
    C extends string
  >(fn: AddOptionWithChoiceCb<T, N, R, C>) {
    return this.#addOptionWithChoices<T, N, R, C>(
      ApplicationCommandOptionTypes.STRING as T,
      fn
    );
  }

  addNumberOption<N extends string, R extends boolean>(
    fn: AddOptionCb<ApplicationCommandOptionTypes.NUMBER, N, R>
  ) {
    return this.#addOption(ApplicationCommandOptionTypes.NUMBER, fn);
  }

  use(fn: Middleware<A> | Middleware<A>[]) {
    this.#stack.push(...(Array.isArray(fn) ? fn : [fn]));
    return this;
  }

  run(fn: Middleware<A>) {
    this.#stack.push(fn);
    return this;
  }

  #addOptionWithChoices<
    T extends
      | ApplicationCommandOptionTypes.INTEGER
      | ApplicationCommandOptionTypes.STRING,
    N extends string,
    R extends boolean,
    C extends OptionTypesMap[T]
  >(type: T, cb: AddOptionWithChoiceCb<T, N, R, C>) {
    const opt = new OptionWithChoices(type);
    const newOpt = cb(opt);
    this.#options.push(newOpt);
    return this as unknown as Command<
      A & Record<N, C | (R extends false ? undefined : never)>,
      S
    >;
  }

  #addOption<
    T extends ApplicationCommandOptionTypes,
    N extends string,
    R extends boolean
  >(type: T, cb: AddOptionCb<T, N, R>) {
    const opt = new Option(type);
    const newOpt = cb(opt);
    this.#options.push(newOpt);
    return this as unknown as Command<A & ArgumentContainer<T, N, R>, S>;
  }
}
