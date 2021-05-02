/* eslint-disable @typescript-eslint/no-explicit-any */
import { Deferred } from "@utils/deferred";

import { Message } from "discord.js";

import { Piece, PieceState } from "./piece";
import { View } from "./view";

type PieceFactory<P> = (...args: any[]) => P;

export class Context<S, R> {
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

  public getPieceState<P extends Piece<S, R, any>>(
    piece: P | PieceFactory<P>
  ): PieceState<P> {
    return this.pieceStates.get(this.resolvePiece(piece).id);
  }

  /**
   * This gets the state of a piece after all of it's configurators have ran.
   */
  public getPieceConfigState<P extends Piece<S, R, any>>(
    piece: P | PieceFactory<P>
  ): PieceState<P> {
    return this.view.pieceInitStates.get(this.resolvePiece(piece).id);
  }

  private resolvePiece<P extends Piece<S, R, any>>(piece: P | PieceFactory<P>) {
    let finalPiece = piece as P;
    if (typeof piece === "function") {
      finalPiece = piece();
    }

    return finalPiece;
  }
}
