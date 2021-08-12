import { Logger } from "@utils/logger";

import { Events } from "./events";

// all contexts are based off the event context
export type EventContext<N extends keyof Events = keyof Events> = Events[N] & {
  log: Logger;
};
