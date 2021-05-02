import { Deferred, deferred } from "@utils/deferred";

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

const clone = rfdc({ proto: true });

export class Context<S, R> {
  public finished = false;
  public resolve: Deferred<R>["resolve"];
  public reject: Deferred<R>["reject"];

  private pieceStates = new Map<symbol, AnyPieceState>();

  public constructor(
    public msg: Message,
    public state: S,
    private pieceInitialStates: Map<symbol, AnyPieceState>,
    promise: Deferred<R>
  ) {
    this.resolve = promise.resolve;
    this.reject = promise.reject;
  }

  public async child<V extends View<S, unknown>>(
    view: V
  ): Promise<ViewResult<V>> {
    const childPromise = deferred<ViewResult<V>>();
    const ctx = new Context(
      this.msg,
      this.state,
      mergePieceInitialStates(
        this.pieceInitialStates,
        view[kPieceInitialStates]
      ),
      childPromise
    );

    await view[kRunLifeCycle](ctx, childPromise);

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
}

function mergePieceInitialStates(...[m1, m2]: Map<symbol, AnyPieceState>[]) {
  const final = new Map(clone([...m1.entries()]));
  for (const [key, val] of m2.entries()) {
    if (!final.has(key)) final.set(key, val);
  }

  return final;
}
