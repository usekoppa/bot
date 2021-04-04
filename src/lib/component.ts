import { Client } from "discord.js";

import { clientOptions } from "./client";

type Injectable = (comp: Component) => unknown;

export class Component {
  private static components = new Map<string, Component>();
  private static client = new Client(clientOptions);

  public static inject(name: string, injectable: Injectable) {
    const exists = this.components.get(name);
    const comp = exists ?? new Component();
    injectable(comp);
    if (exists) this.components.set(name, comp);
  }

  public get client() {
    return Component.client;
  }
}
