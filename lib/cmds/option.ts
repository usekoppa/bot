import {
  ApplicationCommandOptionChoice,
  ApplicationCommandOptionData,
} from "discord.js";
import { ApplicationCommandOptionTypes } from "discord.js/typings/enums";

import { Base } from "./base";
import { OptionTypesMap } from "./options_types_map";

export class Option<
    T extends ApplicationCommandOptionTypes,
    N extends string = string,
    R extends boolean = false
  >
  extends Base
  implements ApplicationCommandOptionData
{
  protected _required = false;

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

  toJSON() {
    return {
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

  toJSON() {
    this.throwIfNotSet(this.choices);
    return { ...super.toJSON(), choices: this.choices! };
  }
}
