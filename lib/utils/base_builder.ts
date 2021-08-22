export abstract class BaseBuilder {
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
