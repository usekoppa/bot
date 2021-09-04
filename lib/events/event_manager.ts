import { level } from "@utils/debug";
import { createLogger } from "@utils/logger";
import { UnionToTuple } from "@utils/types";

import { Client } from "discord.js";

import { Event, EventListener } from "./event";
import { EventContext } from "./event_context";
import { Events, eventsMap } from "./events";

type EventValues<N extends keyof Events> = UnionToTuple<
  {
    [V in keyof Events[N]]: Events[N][V];
  }
>;

export type WrappedEventListener<N extends keyof Events> = (
  ...args: EventValues<N>
) => Promise<void>;

// This is a useful abstraction to create use the client event emitter with extra features
// such as the production of an object from an emitted event.
export class EventManager {
  private static log = createLogger("events", {
    debugEnabled: level >= 2,
  });

  private static client: Client;

  static setClient(client: Client) {
    EventManager.client = client;
  }

  static on<N extends keyof Events>(name: N, listener: EventListener<N>) {
    return EventManager.add({
      type: "on",
      name: name,
      run: listener,
    });
  }

  static once<N extends keyof Events>(name: N, listener: EventListener<N>) {
    return EventManager.add({
      type: "once",
      name: name,
      run: listener,
    });
  }

  static off<N extends keyof Events>(
    name: N,
    listener: WrappedEventListener<N>
  ) {
    this.assertClient();

    const newTotal = EventManager.client.rawListeners(name).length;
    EventManager.log.debug("Removing listener", { name, newTotal });
    EventManager.client.removeListener(
      name,
      listener as unknown as (...args: unknown[]) => void
    );
  }

  private static add<N extends keyof Events>(
    event: Event<N>
  ): WrappedEventListener<N> {
    this.assertClient();

    const newTotal = EventManager.client.rawListeners(event.name).length + 1;
    EventManager.log.debug("Adding listener", {
      name: event.name,
      type: event.type,
      newTotal,
    });

    const wrapped = EventManager.wrapListener(event);
    EventManager.client[event.type](
      event.name,
      wrapped as unknown as (...args: unknown[]) => void
    );

    return wrapped;
  }

  private static wrapListener<N extends keyof Events>(
    event: Event<N>
  ): WrappedEventListener<N> {
    const childLogger = EventManager.log.child(event.name);

    return async function wrappedListener(...args) {
      EventManager.log.debug("Listener called", {
        name: event.name,
        type: event.type,
      });

      const ctx = { log: childLogger } as EventContext<N>;
      for (let i = 0; i < args.length; i++) {
        if (!Object.getOwnPropertyNames(eventsMap).includes(event.name)) {
          ctx.log.warn("Unknown event", { name: event.name, args });
          return;
        }

        const name = eventsMap[event.name][i];

        // I have many questions about typescript sometimes....
        ctx[name as Exclude<keyof EventContext<N>, "log">] = args[
          i
        ] as EventContext<N>[Exclude<keyof Events[N], "log">];
      }

      await event.run(ctx);
    };
  }

  private static assertClient() {
    if (typeof EventManager.client === "undefined") {
      throw new Error("Client was not set using EventManager.setClient()");
    }
  }
}
