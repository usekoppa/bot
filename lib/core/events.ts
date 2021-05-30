import { UnionToTuple } from "@utils/types";

import { ClientEvents } from "./client_events";

// All events used by plugins must be put into the Events interface.

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Events extends ClientEvents {}

export type EventsMap = {
  [N in Exclude<keyof Events, keyof ClientEvents>]: UnionToTuple<
    keyof Events[N]
  >;
};

// You then need to create a map from the events above similar to that in the ./client_events.ts file.
export const eventsMap: EventsMap = {};
