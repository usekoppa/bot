// import { Asyncable } from "@utils/types";

// // eslint-disable-next-line @typescript-eslint/no-explicit-any
// type AnyContextType = any;

// class Context<T> {}
// type Runner<T> = (ctx: Context<T>) => Asyncable<unknown>;
// type Resolver<T> = () => Asyncable<Context<T>>;

// const kPieceResolver = Symbol("registry.piece.resolve");
// class Piece<T> {
//   private static [kPieceResolver](id: string) {}
// }

// export class Registry {
//   private resolvers = new Map<symbol, Resolver<AnyContextType>>();
//   public pieces: Record<symbol, Record<string, Piece<any>>>;

//   public constructor() {}

//   public add(piece: Piece<any>) {}
// }
