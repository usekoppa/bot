import { Logger } from "@utils/logger";

import { Events } from "./events";

export type EventContext<N extends keyof Events = keyof Events> = Events[N] & {
  log: Logger;
};
