import { Piece } from "./piece";
import { View } from "./view";

type ComposerPieces = (Piece<unknown, unknown, unknown> | ComposerPieces)[];

export function compose<S, R>(...compPieces: ComposerPieces) {
  const pieces = flatten(compPieces);
  const view = new View<S, R>();

  for (const piece of pieces) view.add(piece);

  return view.build();
}

function flatten(pieces: ComposerPieces): Piece<unknown, unknown, unknown>[] {
  return pieces.flatMap(piece => {
    return Array.isArray(piece) ? flatten(piece) : piece;
  });
}
