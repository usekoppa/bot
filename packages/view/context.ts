import { Deferred, deferred } from "@utils/deferred";
import { Logger } from "@utils/logger";
import { mergeMaps } from "@utils/merge_maps";

import { Message } from "discord.js";
import rfdc from "rfdc";

import {
  AnyPiece,
  AnyPieceState,
  PieceFactory,
  PieceState,
  PieceWithAnyState,
  resolvePiece,
} from "./piece";
import { kPieceInitialStates, kRunLifeCycle, View, ViewResult } from "./view";

const clone = rfdc({ proto: true, circles: true });

export const kCleanupError = Symbol("context.cleanup.error");
export const kCleanupErrorOccurred = Symbol("context.cleanup.error.occurred");

export class Context<S, R> {
  public log: Logger;
  public resolve: Deferred<R>["resolve"];
  public reject: Deferred<R>["reject"];

  private pieceStates = new Map<symbol, AnyPieceState>();

  #finished = false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  #cleanupError?: any;
  #cleanupErrorOccurred = false;

  public constructor(
    public msg: Message,
    public state: S,
    public readonly childID: number,
    private pieceInitialStates: Map<symbol, AnyPieceState>,
    log: Logger,
    promise: Deferred<R>
  ) {
    this.log = log.child(`view.${childID}`);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.resolve = (...args: any[]) => {
      this.#finished = true;
      promise.resolve(...args);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.reject = (reason?: any) => {
      if (this.#finished) {
        this.log.error("Cleanup failure", reason);
        this.#cleanupErrorOccurred = true;
      } else {
        this.#finished = true;
        promise.reject(reason);
      }
    };
  }

  public has<P extends PieceWithAnyState<S, R>>(
    piece: P | PieceFactory<P>
  ): boolean {
    const resolved = resolvePiece(piece);
    return this.pieceInitialStates.has(resolved.id);
  }

  public async child<V extends View<S, unknown>>(
    view: V
  ): Promise<ViewResult<V>> {
    const childPromise = deferred<ViewResult<V>>();
    const ctx = new Context(
      this.msg,
      this.state,
      this.childID + 1,
      // The states of the current context take
      // precedence over the initial states of the child context.
      mergeMaps(
        view[kPieceInitialStates],
        this.pieceInitialStates,
        this.pieceStates
      ),
      this.log,
      childPromise
    );

    await view[kRunLifeCycle](ctx, childPromise, [...this.pieceStates.keys()]);

    return await childPromise;
  }

  public getPieceState<P extends AnyPiece>(
    piece: P | PieceFactory<P>
  ): PieceState<P> | undefined {
    const resolvedPiece = resolvePiece(piece);

    let state = this.pieceStates.get(resolvedPiece.id) as
      | PieceState<P>
      | undefined;

    if (
      typeof state === "undefined" &&
      !this.pieceStates.has(resolvedPiece.id)
    ) {
      state = this.getConfiguredPieceState(resolvedPiece);
      this.pieceStates.set(resolvedPiece.id, state);
    }

    return state;
  }

  /**
   * This gets the current initial state (after configurers have ran) in this view.
   * Note: This state can change if another piece of the same type is added, hence
   * why the result is not a reference but rather a deep clone of the state.
   */
  public getConfiguredPieceState<P extends PieceWithAnyState<S, R>>(
    piece: P | PieceFactory<P>
  ): PieceState<P> | undefined {
    const resolved = resolvePiece(piece);
    const state = this.pieceInitialStates.get(resolved.id) as
      | PieceState<P>
      | undefined;

    if (typeof state === "undefined") return;
    return clone(state);
  }

  public get finished() {
    return this.#finished;
  }

  public get [kCleanupError]() {
    return this.#cleanupError;
  }

  public get [kCleanupErrorOccurred]() {
    return this.#cleanupErrorOccurred;
  }
}
