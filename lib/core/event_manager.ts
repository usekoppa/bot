import { level } from "@utils/debug";
import { createLogger, Logger } from "@utils/logger";
import { UnionToTuple } from "@utils/types";

import { Container } from "typedi";

import { KoppaClient } from "./client";
import { clientEventsMap } from "./client_events";
import { EventContext } from "./context";
import { Event } from "./event";
import { Events, EventsMap, eventsMap } from "./events";

type EventValues<N extends keyof Events> = UnionToTuple<
  {
    [V in keyof Events[N]]: Events[N][V];
  }
>;

export type WrappedEventListener<N extends keyof Events = keyof Events> = (
  ...args: EventValues<N>
) => Promise<void>;

// This is a useful abstraction to create use the client event emitter with extra features
// such as the production of an object from an emitted event.
export class EventManager {
  private static log = createLogger("events", {
    debugEnabled: level >= 2,
  });

  #client = Container.get(KoppaClient);

  constructor(public moduleLogger: Logger) {}

  emit<N extends keyof Events>(event: N, ...args: EventValues<N>) {
    this.#client.emit(event as string, ...(args as unknown[]));
  }

  add<N extends keyof Events>(event: Event<N>): WrappedEventListener<N> {
    const newTotal = this.#client.rawListeners(event.name).length + 1;
    EventManager.log.debug("Adding listener", {
      name: event.name,
      type: event.type,
      newTotal,
    });

    const wrapped = this.wrapListener(event);
    this.#client[event.type](
      event.name,
      wrapped as unknown as (...args: unknown[]) => void
    );

    return wrapped;
  }

  off<N extends keyof Events>(name: N, listener: WrappedEventListener<N>) {
    const newTotal = this.#client.rawListeners(name).length;
    EventManager.log.debug("Removing listener", { name, newTotal });
    this.#client.removeListener(
      name,
      listener as unknown as (...args: unknown[]) => void
    );
  }

  private wrapListener<N extends keyof Events>(
    event: Event<N>
  ): WrappedEventListener<N> {
    const childLogger = this.moduleLogger.child(event.name);

    return async function wrappedListener(...args) {
      EventManager.log.debug("Listener called", {
        name: event.name,
        type: event.type,
      });

      const ctx = { log: childLogger } as EventContext<N>;
      for (let i = 0; i < args.length; i++) {
        const name = Object.getOwnPropertyNames(eventsMap).includes(event.name)
          ? eventsMap[event.name as keyof EventsMap][i]
          : clientEventsMap[event.name][i];

        // @ts-ignore No idea, but please shut up.
        ctx[name as keyof EventContext<N>] = args[i];
      }

      await event.run(ctx);
    };
  }
}
