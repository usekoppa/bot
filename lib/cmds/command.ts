import {
  ApplicationCommandData,
  ApplicationCommandOptionData,
  CommandInteractionOptionResolver,
} from "discord.js";
import { ApplicationCommandOptionTypes } from "discord.js/typings/enums";

import { Base } from "./base";
import { CommandContext } from "./command_context";
import { Middleware, NextFn } from "./middleware";
import { Option, OptionWithChoices } from "./option";
import { OptionTypesMap } from "./option_type_map";
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
  | "setDefaultPermissionEnabled"
  | "toJSON"
  | "name"
  | "options"
  | "type"
  | "addRunner"
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

  setDefaultPermissionEnabled(enabled: boolean) {
    this.#defaultPermissionEnabled = enabled;
    return this;
  }

  addSubcommand(fn: (subcommand: Subcommand) => Subcommand) {
    const subcmd = new Command(true) as unknown as Subcommand;
    const finalSubcmd = fn(subcmd);
    this.#options.push(finalSubcmd);
    this.stack.push((ctx, next) => {
      if (ctx.interaction.options.getSubcommand(true) === finalSubcmd.name) {
        return next();
      }
    });

    return this as unknown as CommandWithSubcommands<A>;
  }

  addSubcommandGroup(fn: (group: SubcommandGroup) => SubcommandGroup) {
    const group = new SubcommandGroup();
    const finalGroup = fn(group);
    this.#options.push(finalGroup);
    this.stack.push(async (ctx, next) => {
      if (ctx.interaction.options.getSubcommandGroup(true) === group.name) {
        const subcmdName = ctx.interaction.options.getSubcommand(true);
        const subcmd = group.options.find(subcmd => subcmd.name === subcmdName);
        if (typeof subcmd === "undefined") return;
        await subcmd._executeStack(ctx, next);
      }
    });

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

  addIntegerOption<
    T extends ApplicationCommandOptionTypes.INTEGER,
    N extends string,
    R extends boolean,
    C extends number
  >(fn: AddOptionWithChoiceFn<T, N, R, C>) {
    return this.#addOptionWithChoices<T, N, R, C>(
      ApplicationCommandOptionTypes.INTEGER as T,
      fn
    );
  }

  addNumberOption<N extends string, R extends boolean>(
    fn: AddOptionFn<ApplicationCommandOptionTypes.NUMBER, N, R>
  ) {
    return this.#addOption(ApplicationCommandOptionTypes.NUMBER, fn);
  }

  addRoleOption<N extends string, R extends boolean>(
    fn: AddOptionFn<ApplicationCommandOptionTypes.ROLE, N, R>
  ) {
    return this.#addOption(ApplicationCommandOptionTypes.ROLE, fn);
  }

  addMentionableOption<N extends string, R extends boolean>(
    fn: AddOptionFn<ApplicationCommandOptionTypes.MENTIONABLE, N, R>
  ) {
    return this.#addOption(ApplicationCommandOptionTypes.MENTIONABLE, fn);
  }

  addUserOption<N extends string, R extends boolean>(
    fn: AddOptionFn<ApplicationCommandOptionTypes.USER, N, R>
  ) {
    return this.#addOption(ApplicationCommandOptionTypes.USER, fn);
  }

  addChannelOption<N extends string, R extends boolean>(
    fn: AddOptionFn<ApplicationCommandOptionTypes.CHANNEL, N, R>
  ) {
    return this.#addOption(ApplicationCommandOptionTypes.CHANNEL, fn);
  }

  addBooleanOption<N extends string, R extends boolean>(
    fn: AddOptionFn<ApplicationCommandOptionTypes.BOOLEAN, N, R>
  ) {
    return this.#addOption(ApplicationCommandOptionTypes.BOOLEAN, fn);
  }

  addRunner(fn: Middleware<A>) {
    this.stack.push(fn);
    return this;
  }

  toJSON() {
    const data: Partial<ApplicationCommandData> = {
      name: this.name,
      description: this.description,
      defaultPermission: this.defaultPermission,
      options: this.#options.map(
        opt =>
          opt.toJSON() as ReturnType<
            Option<ApplicationCommandOptionTypes>["toJSON"]
          >
      ),
    };

    if (this.isSubcommand) {
      (data as ApplicationCommandOptionData).type = this.type;
    }

    return data as Record<string, unknown>;
  }

  _executeStack(ctx: CommandContext<A>, next?: NextFn) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;

    return new Promise<void>((resolve, reject) => {
      function curNext(idx: number, err?: Error) {
        if (typeof err !== "undefined") return reject(err);
        if (self.stack.length < idx) {
          if (typeof next !== "undefined") next();
          return resolve();
        }

        const fn = self.stack[idx];
        const res = fn(ctx, curNext.bind(null, idx + 1));

        if (typeof res?.then !== "undefined") {
          res.then(resolve).catch(reject);
        } else {
          resolve();
        }
      }

      try {
        curNext(0);
      } catch (err) {
        reject(err);
      }
    });
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
    const finalOpt = fn(opt);
    this.#options.push(finalOpt);
    this.#addOptionMiddleware(finalOpt as Option);

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
    const finalOpt = fn(opt);
    this.#options.push(finalOpt);
    this.#addOptionMiddleware(finalOpt as Option);

    return this as unknown as Omit<
      Command<A & ArgumentContainer<T, N, R>, S>,
      "addSubcommand" | "addSubcommandGroup"
    >;
  }

  #addOptionMiddleware(opt: Option) {
    this.stack.push((ctx, next) => {
      let optMethod: keyof CommandInteractionOptionResolver;
      switch (opt.type) {
        case ApplicationCommandOptionTypes.BOOLEAN: {
          optMethod = "getBoolean";
          break;
        }
        case ApplicationCommandOptionTypes.CHANNEL: {
          optMethod = "getChannel";
          break;
        }
        case ApplicationCommandOptionTypes.INTEGER: {
          optMethod = "getInteger";
          break;
        }
        case ApplicationCommandOptionTypes.MENTIONABLE: {
          optMethod = "getMentionable";
          break;
        }
        case ApplicationCommandOptionTypes.NUMBER: {
          optMethod = "getNumber";
          break;
        }
        case ApplicationCommandOptionTypes.ROLE: {
          optMethod = "getRole";
          break;
        }
        case ApplicationCommandOptionTypes.STRING: {
          optMethod = "getString";
          break;
        }
        case ApplicationCommandOptionTypes.USER: {
          optMethod = "getUser";
          break;
        }
        default: {
          throw new Error("Unknown option type");
        }
      }

      const val =
        ctx.interaction.options[optMethod](opt.name, opt.required) ?? void 0;

      if (typeof val === "undefined") return next();

      ctx.args[opt.name as unknown as keyof A] = val as unknown as A[keyof A];

      next();
    });
  }
}
