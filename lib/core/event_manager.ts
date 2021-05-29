import { createLogger, Logger } from "@utils/logger";
import { UnionToTuple } from "@utils/types";

import { Container } from "typedi";

import { KoppaClient } from "./client";
import { clientEventsMap } from "./client_events";
import { EventContext } from "./context";
import { Event } from "./event";
import { Events, EventsMap, eventsMap } from "./events";
// import { ClientEventMap, clientEventMap } from "./client_events";

type EventValues<N extends keyof Events> = UnionToTuple<
  {
    [V in keyof Events[N]]: Events[N][V];
  }
>;

export type WrappedEventListener<N extends keyof Events = keyof Events> = (
  ...args: EventValues<N>
) => Promise<void>;

export class EventManager {
  private static log = createLogger("evs");

  #client = Container.get(KoppaClient);

  constructor(public moduleLogger: Logger) {}

  add<N extends keyof Events>(event: Event<N>): WrappedEventListener<N> {
    const totalListeners = this.#client.rawListeners(event.name).length + 1;
    EventManager.log.debug("Adding listener", {
      name: event.name,
      type: event.type,
      totalListeners,
    });

    const wrapped = this.wrapListener(event);
    this.#client[event.type](
      event.name,
      wrapped as unknown as (...args: unknown[]) => void
    );

    return wrapped;
  }

  off<N extends keyof Events>(name: N, listener: WrappedEventListener<N>) {
    this.#client.removeListener(
      name,
      listener as unknown as (...args: unknown[]) => void
    );
  }

  private wrapListener<N extends keyof Events>(
    event: Event<N>
  ): WrappedEventListener<N> {
    const childLogger = this.moduleLogger.child(event.name);

    return async (...args) => {
      EventManager.log.debug("Listener called", {
        name: event.name,
        type: event.type,
      });

      const ctx = { log: childLogger } as EventContext & Events[N];
      for (let i = 0; i < args.length; i++) {
        const name = Object.getOwnPropertyNames(eventsMap).includes(event.name)
          ? eventsMap[event.name as keyof EventsMap][i]
          : clientEventsMap[event.name][i];

        // @ts-ignore No idea, but please shut up.
        ctx[name as unknown as keyof typeof ctx] = args[i];
      }

      await event.run(ctx);
    };
  }
}
