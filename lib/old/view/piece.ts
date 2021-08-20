/* eslint-disable @typescript-eslint/no-explicit-any */
import { Asyncable } from "@utils/types";

import { Context } from "./context";
import { Middleware, View } from "./view";

export const kGlobalPiece = Symbol("view.pieces.*");

export type AnyPieceState = any;

type ConfigurePiece<S, R, PS> = (
  use: (...fns: Middleware<S, R>[]) => void,
  state: PS,
  view: View<S, R>
) => Asyncable<void>;

type CleanupPiece<S, R> = (ctx: Context<S, R>) => Asyncable<void>;

export interface Piece<S, R, PS = Record<string, never>> {
  id: symbol;
  factory?: PieceFactory<Piece<S, R, PS>>;
  initialState: PS extends Record<string, never> ? never : PS;
  configure?: ConfigurePiece<S, R, PS>;
  cleanup?: CleanupPiece<S, R>;
}

export type PieceFactory<P extends AnyPiece> = (...args: any[]) => P;

export type AnyPiece = Piece<any, any, any>;
export type PieceWithAnyState<S, V> = Piece<S, V, AnyPieceState>;

export type PieceState<P extends AnyPiece> = P extends Piece<any, any, infer PS>
  ? PS
  : never;

const memoisedPieces = new Map<PieceFactory<AnyPiece>, AnyPiece>();
export function resolvePiece<P extends AnyPiece>(
  piece: P | PieceFactory<P>
): P {
  let resolvedPiece = piece as P;
  if (typeof piece === "function") {
    let memoisedPiece = memoisedPieces.get(piece) as P | undefined;
    if (typeof memoisedPiece === "undefined") {
      memoisedPiece = piece();
      memoisedPieces.set(piece, memoisedPiece);
    }

    resolvedPiece = memoisedPiece;
  } else if (typeof piece.factory === "function") {
    memoisedPieces.set(piece.factory, piece);
  }

  return resolvedPiece;
}
