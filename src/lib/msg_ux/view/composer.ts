import { Piece } from "./piece";
import { View } from "./view";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ComposerPieces<S, R> = (Piece<S, R, any> | ComposerPieces<S, R>)[];

export function compose<S, R>(...compPieces: ComposerPieces<S, R>) {
  const pieces = flatten(compPieces);
  const view = new View<S, R>();

  for (const piece of pieces) view.add(piece);

  return view.build();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function flatten<S, R>(pieces: ComposerPieces<S, R>): Piece<any, any, any>[] {
  return pieces.flatMap(piece => {
    return Array.isArray(piece) ? flatten(piece) : piece;
  });
}
