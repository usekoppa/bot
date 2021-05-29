import { UnionToTuple } from "@utils/types";

import { ClientEvents } from "./client_events";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Events extends ClientEvents {}

export type EventsMap = {
  [N in Exclude<keyof Events, keyof ClientEvents>]: UnionToTuple<
    keyof Events[N]
  >;
};

export const eventsMap: EventsMap = {};
