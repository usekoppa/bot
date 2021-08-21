import {
  ApplicationCommandData,
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
  #name!: string;
  #required = false;
  #description!: string;

  constructor(public type: T) {
    super();
  }

  get name() {
    this.throwIfNotSet(this.#name);
    return this.#name;
  }

  get description() {
    return this.#description;
  }

  get required() {
    this.throwIfNotSet(this.#required);
    return this.#required as R;
  }

  setName<NN extends string>(name: NN) {
    this.#name = name;
    return this as unknown as Option<T, NN, R>;
  }

  setDescription(description: string) {
    this.#description = description;
    return this;
  }

  isRequired<IR extends boolean>(required: IR) {
    this.#required = required;
    return this as unknown as Option<T, N, IR>;
  }
}

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

// eslint-disable-next-line @typescript-eslint/ban-types
class Command<A = {}> extends BaseBuilder implements ApplicationCommandData {
  #name?: string;
  #description?: string;
  #options: ApplicationCommandOptionData[] = [];
  #defaultPermissionEnabled = true;

  get name() {
    this.throwIfNotSet(this.#name);
    return this.#name!;
  }

  get description() {
    this.throwIfNotSet(this.#description);
    return this.#description!;
  }

  get defaultPermission() {
    return this.#defaultPermissionEnabled;
  }

  get options() {
    return this.#options.length === 0 ? void 0 : this.#options;
  }

  setName(name: string) {
    this.#name = name;
    return this;
  }

  setDescription(description: string) {
    this.#description = description;
    return this;
  }

  enableDefaultPermission(enabled: boolean) {
    this.#defaultPermissionEnabled = enabled;
    return this;
  }

  addStringOption<N extends string, R extends boolean>(
    cb: AddOptionCb<ApplicationCommandOptionTypes.STRING, N, R>
  ) {
    return this.#addOption(ApplicationCommandOptionTypes.STRING, cb);
  }

  // TODO(@zorbyte): Save the function and have a means to build the obj.
  run(cb: (ctx: { args: A }) => void) {
    cb({ args: {} as A });
  }

  #addOption<
    T extends ApplicationCommandOptionTypes,
    N extends string,
    R extends boolean
  >(type: T, cb: AddOptionCb<T, N, R>) {
    const opt = new Option(type);
    const newOpt = cb(opt);
    this.#options.push(newOpt);
    return this as unknown as Command<A & ArgumentContainer<T, N, R>>;
  }
}
