import { Deferred } from "@utils/deferred";

import { Message } from "discord.js";

import { Piece, PieceState } from "./piece";
import { View } from "./view";

export class Context<S, R> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public pieceStates = new Map<symbol, any>();
  public finished = false;
  public resolve: Deferred<R>["resolve"];
  public reject: Deferred<R>["reject"];

  public constructor(
    public view: View<S, R>,
    public msg: Message,
    public state: S,
    promise: Deferred<R>
  ) {
    this.resolve = promise.resolve;
    this.reject = promise.reject;
  }

  // TODO(@voltexene): Unfuck this up.

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public getPieceState<P extends Piece<S, R, any>>(
    piece: P | ((...args: any[]) => P)
  ): PieceState<P> {
    let finalPiece = piece as P;
    if (typeof piece === "function") {
      finalPiece = piece();
    }

    return this.pieceStates.get(finalPiece.id);
  }

  /**
   * This gets the state of a piece after all of it's configurators have ran.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public getPieceConfigState<P extends Piece<S, R, any>>(
    piece: P | ((...args: any[]) => P)
  ): PieceState<P> {
    let finalPiece = piece as P;
    if (typeof piece === "function") {
      finalPiece = piece();
    }

    return this.view.pieceInitStates.get(finalPiece.id);
  }
}
