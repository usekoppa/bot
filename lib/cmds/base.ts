import { BaseBuilder } from "@utils/base_builder";

export abstract class Base extends BaseBuilder {
  abstract toJSON(): Record<string, unknown>;
}
