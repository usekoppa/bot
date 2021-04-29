import { Asyncable } from "@utils/util_types";

import { Context } from "./context";
import { Middleware, View } from "./view";

export const kGlobalPiece = Symbol("view.pieces.*");

type ConfigurePiece<S, R, PS> = (
  use: (...fns: Middleware<S, R>[]) => void,
  state: PS,
  view: View<S, R>
) => Asyncable<void>;

type CleanupPiece<S, R> = (ctx: Context<S, R>) => Asyncable<void>;

export interface Piece<S, R, PS> {
  id: symbol;
  initialState?: PS;
  configure?: ConfigurePiece<S, R, PS>;
  cleanup?: CleanupPiece<S, R>;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export type PieceState<P extends Piece<any, any, any>> = P extends Piece<
  any,
  any,
  /* eslint-enable @typescript-eslint/no-explicit-any */
  infer PS
>
  ? PS
  : never;
