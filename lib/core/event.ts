import { Asyncable } from "@utils/types";

import { EventContext } from "./context";
import { Events } from "./events";

export type EventListener<N extends keyof Events> = (
  ctx: EventContext<N>
) => Asyncable<void>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface Event<N extends keyof Events = keyof Events> {
  type: "on" | "once";
  name: N;
  run: EventListener<N>;
}
