import { Context } from "node:vm";

import { ClientEvents } from "./client_events";

export interface Events extends ClientEvents {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [k: string]: Record<string, any>;
}

export interface Event<N extends keyof Events> {
  type: "on" | "once";
  name: N;
  run: (ctx: Context & Events[N]) => void;
}
