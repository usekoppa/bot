import { deferred } from "@utils/deferred";
import { Asyncable } from "@utils/util_types";

import { Message } from "discord.js";
import rfdc from "rfdc";

import { Context } from "./context";
import { kGlobalPiece, Piece } from "./piece";

export type Middleware<S, R> = (ctx: Context<S, R>) => Asyncable<unknown>;

interface RunResult<S, R> {
  state: S;
  result: R;
  ctx: Context<S, R>;
}

const clone = rfdc({ proto: true });

const kBuiltView = Symbol("view.built");

export class View<S, R> {
  public stacks = new Map<symbol, Middleware<S, R>[]>();
  /* eslint-disable @typescript-eslint/no-explicit-any */
  public pieces = new Map<symbol, Piece<S, R, any>>();
  public pieceInitStates = new Map<symbol, any>();
  /* eslint-enable @typescript-eslint/no-explicit-any */

  public constructor() {
    this.pieces.set(kGlobalPiece, { id: kGlobalPiece });
    this.stacks.set(kGlobalPiece, []);
  }

  public add(piece: Piece<S, R, unknown>) {
    // @ts-expect-error Typescript doesn't like the fact that that I'm using .bind on a function with overloads.
    const use = this.use.bind(this, piece.id);
    const state =
      this.pieceInitStates.get(piece.id) ?? clone(piece.initialState);
    piece.configure?.(use, state, this);

    this.pieceInitStates.set(piece.id, state);
    this.pieces.set(piece.id, piece);
  }

  public use(
    id: symbol,
    fn: Middleware<S, R>,
    ...fns: Middleware<S, R>[]
  ): void;
  public use(fn: Middleware<S, R>, ...fns: Middleware<S, R>[]): void;
  public use(...fns: (symbol | Middleware<S, R>)[]) {
    let id = kGlobalPiece;
    if (typeof fns[0] === "symbol") {
      [id] = fns;
      fns = fns.slice(1);
    }

    const stack = this.stacks.get(id) ?? [];
    stack.push(...(fns as Middleware<S, R>[]));
    this.stacks.set(id, stack);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public async execute(piece: Piece<S, R, any>, ctx: Context<S, R>) {
    if (!ctx.pieceStates.has(piece.id)) {
      ctx.pieceStates.set(
        piece.id,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        clone(this.pieceInitStates.get(piece.id) ?? {})
      );
    }

    await this.executeStack(piece.id, ctx);
  }

  public async executeStack(id: symbol, ctx: Context<S, R>) {
    for (const fn of this.stacks.get(id) ?? []) {
      await fn(ctx);
    }
  }

  public build() {
    return {
      run: this.run.bind(this),
      [kBuiltView]: this,
    };
  }

  private run(msg: Message, initialState?: S): Promise<RunResult<S, R>> {
    const ctxPromise = deferred<R>();
    const state =
      typeof initialState === "undefined" ? ({} as S) : clone(initialState);

    const ctx = new Context(this, msg, state, ctxPromise);

    // eslint-disable-next-line no-async-promise-executor, @typescript-eslint/no-misused-promises
    return new Promise(async (resolve, reject) => {
      ctxPromise
        .then(result => resolve({ ctx, state, result }))
        .catch(reject)
        .finally(() => {
          ctx.finished = true;
          for (const piece of this.pieces.values()) {
            piece.cleanup?.(ctx);
          }
        });

      for (const piece of this.pieces.values()) {
        if (ctx.finished) break;
        await this.execute(piece, ctx);
      }
    });
  }
}
