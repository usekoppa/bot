import { createLogger, Logger } from "@utils/logger";
import { Asyncable } from "@utils/types";

import { ClientEvents } from "discord.js";
import { Container } from "typedi";

import { KoppaClient } from "./client";

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

  private client = Container.get(KoppaClient);

  public constructor(public moduleLogger: Logger) {}

  public on<K extends keyof ClientEvents>(
    event: K,
    listener: ClientEventListener<K>
  ): WrappedClientEventListener<K>;
  public on<E extends string, L extends EventListener>(
    event: Exclude<E, keyof ClientEvents>,
    listener: L
  ): WrappedEventListener<L> {
    const wrapped = this.addListener(event, "on", listener);
    return wrapped;
  }

  public once<K extends keyof ClientEvents>(
    event: K,
    listener: ClientEventListener<K>
  ): WrappedClientEventListener<K>;
  public once<E extends string, L extends EventListener>(
    event: Exclude<E, keyof ClientEvents>,
    listener: L
  ): WrappedEventListener<L> {
    const wrapped = this.addListener(event, "once", listener);
    return wrapped;
  }

  public off<K extends keyof ClientEvents>(
    event: K,
    wrapped: WrappedClientEventListener<K>
  ): void;
  public off<S extends string>(
    event: Exclude<S, keyof ClientEvents>,
    wrapped: (...args: unknown[]) => void
  ) {
    this.client.off(event, wrapped);
  }

  private addListener(
    event: string,
    type: "on" | "once",
    listener: EventListener
  ) {
    const totalListeners = this.client.rawListeners(event).length + 1;
    EventManager.log.debug("Added listener", { event, type, totalListeners });

    const wrapped = this.wrapListener(event, type, listener);
    this.client[type](event, wrapped as (...args: unknown[]) => void);

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
      await listener(...args, childLogger);
    };
  }
}
