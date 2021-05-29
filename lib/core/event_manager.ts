import { createLogger, Logger } from "@utils/logger";
import { Asyncable } from "@utils/types";

import { ClientEvents } from "discord.js";
import { Container } from "typedi";

import { KoppaClient } from "./client";
// import { ClientEventMap, clientEventMap } from "./client_events";

type EventListener = (...args: [...unknown[], Logger]) => Asyncable<void>;

type ClientEventListener<K extends keyof ClientEvents> = (
  ...args: [...ClientEvents[K], Logger]
) => Asyncable<void>;

export type WrappedEventListener<L extends EventListener> = (
  // LL is the potential logger type.
  ...args: Parameters<L> extends [...infer ParamsWithoutLog, infer LL]
    ? LL extends Logger
      ? ParamsWithoutLog
      : Parameters<L>
    : unknown[]
) => Promise<void>;

export type WrappedClientEventListener<K extends keyof ClientEvents> = (
  ...args: ClientEvents[K]
) => Promise<void>;

export class EventManager {
  private static log = createLogger("evs");

  #client = Container.get(KoppaClient);

  constructor(public moduleLogger: Logger) {}

  on<K extends keyof ClientEvents>(
    event: K,
    listener: ClientEventListener<K>
  ): WrappedClientEventListener<K>;
  on<E extends string, L extends EventListener>(
    event: Exclude<E, keyof ClientEvents>,
    listener: L
  ): WrappedEventListener<L> {
    const wrapped = this.addListener(event, "on", listener);
    return wrapped;
  }

  once<K extends keyof ClientEvents>(
    event: K,
    listener: ClientEventListener<K>
  ): WrappedClientEventListener<K>;
  once<E extends string, L extends EventListener>(
    event: Exclude<E, keyof ClientEvents>,
    listener: L
  ): WrappedEventListener<L> {
    const wrapped = this.addListener(event, "once", listener);
    return wrapped;
  }

  off<K extends keyof ClientEvents>(
    event: K,
    wrapped: WrappedClientEventListener<K>
  ): void;
  off<S extends string>(
    event: Exclude<S, keyof ClientEvents>,
    wrapped: (...args: unknown[]) => void
  ) {
    this.#client.off(event, wrapped);
  }

  private addListener(
    event: string,
    type: "on" | "once",
    listener: EventListener
  ) {
    const totalListeners = this.#client.rawListeners(event).length + 1;
    EventManager.log.debug("Adding listener", { event, type, totalListeners });

    const wrapped = this.wrapListener(event, type, listener);
    this.#client[type](event, wrapped as (...args: unknown[]) => void);

    return wrapped;
  }

  private wrapListener(
    event: string,
    type: "on" | "once",
    listener: EventListener
  ) {
    const childLogger = this.moduleLogger.child(event);

    return async (...args: unknown[]) => {
      EventManager.log.debug("Listener called", { event, type });

      // const ctx = { log: childLogger };
      // for (let i = 0; i < args.length; i++) {
      //   args[i] = clientEventMap[event as keyof ClientEventMap][i];
      // }

      // for (const arg of args) {
      //   ctx[]
      // }

      await listener(...args, childLogger);
    };
  }
}
