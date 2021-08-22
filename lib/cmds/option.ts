import {
  ApplicationCommandOptionChoice,
  ApplicationCommandOptionData,
} from "discord.js";

import type { ApplicationCommandOptionTypes } from "./application_command_option_types";
import { Base } from "./base";
import { OptionTypesMap } from "./option_type_map";

export class Option<
    T extends ApplicationCommandOptionTypes = ApplicationCommandOptionTypes,
    N extends string = string,
    R extends boolean = true
  >
  extends Base
  implements ApplicationCommandOptionData
{
  protected _required = true;

  constructor(public readonly type: T) {
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

  toJSON(): Record<string, unknown> {
    return {
      type: this.type,
      name: this.name,
      description: this.description,
      required: this.required,
    };
  }
}

export class OptionWithChoices<
  T extends
    | ApplicationCommandOptionTypes.INTEGER
    | ApplicationCommandOptionTypes.STRING,
  N extends string = string,
  R extends boolean = true,
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

  toJSON() {
    const data = super.toJSON();
    if (typeof this.choices !== "undefined") data.choices = this.choices;

    return data;
  }
}
