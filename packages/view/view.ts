import { Deferred, deferred } from "@utils/deferred";
import { Logger } from "@utils/logger";
import { Asyncable } from "@utils/util_types";

import { Message } from "discord.js";
import rfdc from "rfdc";

import { Context, kCleanupError, kCleanupErrorOccurred } from "./context";
import {
  AnyPieceState,
  kGlobalPiece,
  Piece,
  PieceFactory,
  PieceWithAnyState,
  resolvePiece,
} from "./piece";

export type Middleware<S, R> = (ctx: Context<S, R>) => Asyncable<unknown>;

interface RunResult<S, R> {
  state: S;
  result: R;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyState = any;

export type ViewResult<C extends View<AnyState, unknown>> = C extends View<
  AnyState,
  infer R
>
  ? R
  : never;

const clone = rfdc({ proto: false, circles: true });

export const kRunLifeCycle = Symbol("view.life_cycle.runner");
export const kPieceInitialStates = Symbol("view.pieces.state.initial");

export class View<S, R> {
  private ran = false;
  private stacks = new Map<symbol, Middleware<S, R>[]>();
  private pieces = new Map<symbol, PieceWithAnyState<S, R>>();
  private pieceInitialStates = new Map<symbol, AnyPieceState>();

  public constructor() {
    this.pieces.set(kGlobalPiece, { id: kGlobalPiece } as Piece<S, R, unknown>);
    this.stacks.set(kGlobalPiece, []);
  }

  public add(piece: PieceWithAnyState<S, R>) {
    if (this.ran) {
      throw new Error(
        "Pieces cannot be added to a view if it has been ran before doing so"
      );
    }

    // @ts-ignore Typescript doesn't like the fact that that I'm using .bind on a function with overloads.
    const use = this.use.bind(this, piece.id);
    const state = Object.getOwnPropertyNames(piece).includes("initialState")
      ? this.pieceInitialStates.get(piece.id) ?? clone(piece.initialState)
      : ({} as Record<string, never>);

    piece.configure?.(use, state, this);

    this.pieceInitialStates.set(piece.id, state);
    this.pieces.set(piece.id, piece);
  }

  public use(
    id: symbol,
    fn: Middleware<S, R>,
    ...fns: Middleware<S, R>[]
  ): void;
  public use(fn: Middleware<S, R>, ...fns: Middleware<S, R>[]): void;
  public use(...fns: (symbol | Middleware<S, R>)[]) {
    if (this.ran) {
      throw new Error(
        "Middleware cannot be added to a view if it has been ran before doing so"
      );
    }

    let id = kGlobalPiece;
    if (typeof fns[0] === "symbol") {
      [id] = fns;
      fns = fns.slice(1);
    }

    const stack = this.stacks.get(id) ?? [];
    stack.push(...(fns as Middleware<S, R>[]));
    this.stacks.set(id, stack);
  }

  public has<P extends PieceWithAnyState<S, R>>(
    piece: P | PieceFactory<P>
  ): boolean {
    const resolved = resolvePiece(piece);
    return this.pieces.has(resolved.id);
  }

  public run(
    msg: Message,
    log: Logger,
    // eslint-disable-next-line @typescript-eslint/ban-types
    initialState: S extends object ? S : undefined
  ): Promise<RunResult<S, R>> {
    const ctxPromise = deferred<R>();
    const state = (typeof initialState === "undefined"
      ? {}
      : clone(initialState)) as S;

    const ctx = new Context(
      msg,
      state,
      0,
      this.clonePieceInitialStates(),
      log,
      ctxPromise
    );

    return this.runLifeCycle(ctx, ctxPromise);
  }

  public get [kRunLifeCycle]() {
    return this.runLifeCycle.bind(this);
  }

  public get [kPieceInitialStates]() {
    return this.clonePieceInitialStates();
  }

  private runLifeCycle(
    ctx: Context<S, R>,
    promise: Deferred<R>,
    cleanupExclusions: symbol[] = []
  ) {
    this.ran = true;

    // eslint-disable-next-line no-async-promise-executor, @typescript-eslint/no-misused-promises
    return new Promise<RunResult<S, R>>(async (resolve, reject) => {
      promise
        .then(result =>
          this.cleanup(ctx, cleanupExclusions)
            .then(() => resolve({ state: ctx.state, result }))
            .catch(reject)
        )
        .catch(reject);

      await this.runPieces(ctx);
    });
  }

  private async runPieces(ctx: Context<S, R>) {
    for (const piece of this.pieces.values()) {
      if (ctx.finished) break;
      await this.runPieceStack(piece.id, ctx);
    }
  }

  private async runPieceStack(id: symbol, ctx: Context<S, R>) {
    for (const fn of this.stacks.get(id) ?? []) {
      await fn(ctx);
    }
  }

  private clonePieceInitialStates() {
    return clone(this.pieceInitialStates);
  }

  private async cleanup(ctx: Context<S, R>, exclusions: symbol[]) {
    const ranCleaners = new Set<symbol>(exclusions);
    for (const piece of [...this.pieces.values()].reverse()) {
      if (ranCleaners.has(piece.id)) continue;
      ranCleaners.add(piece.id);
      await piece.cleanup?.(ctx);
      if (ctx[kCleanupErrorOccurred]) throw ctx[kCleanupError];
    }
  }
}
