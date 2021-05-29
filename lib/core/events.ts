import { ClientEvents } from "./client_events";
import { Context } from "./event_context";

export interface Events extends ClientEvents {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [k: string]: Record<string, any>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface Event<N extends keyof Events = any> {
  type: "on" | "once";
  name: N;
  run: (ctx: Context & Events[N]) => void;
}
