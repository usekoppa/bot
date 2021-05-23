/* eslint-disable @typescript-eslint/no-explicit-any */
type Asyncable<T> = Promise<T> | T;

export type UnionToTuple<T> = (
  (T extends any ? (t: T) => T : never) extends infer U
    ? (U extends any ? (u: U) => any : never) extends (v: infer V) => any
      ? V
      : never
    : never
) extends (_: any) => infer W
  ? [...UnionToTuple<Exclude<T, W>>, W]
  : [];

interface ArgumentNode<T = unknown> {
  name: string;
  greedy: boolean;
  optional: boolean;
  parse(): T | undefined;
}

type Name<AN> = AN extends { name: infer N }
  ? N extends string
    ? N
    : never
  : never;

type ParsedValue<AN> = AN extends {
  greedy: infer G;
  optional: infer O;
  parse(): infer T | undefined;
}
  ? (G extends true ? T[] : T) | (O extends true ? undefined : never)
  : never;

type ArgumentRecord<A> = A extends ArgumentNode[]
  ? {
      [K in Exclude<keyof A, keyof []> as Name<A[K]>]: ParsedValue<A[K]>;
    }
  : never;

type ArgumentTuple<A extends ArgumentNode[]> = A extends (infer T)[]
  ? UnionToTuple<T>
  : never;

interface Context<A extends ArgumentNode[]> {
  args: A extends [] ? never : ArgumentRecord<ArgumentTuple<A>>;
}

type Runner<A extends ArgumentNode[]> = (ctx: Context<A>) => Asyncable<void>;

interface Command<A extends ArgumentNode[]> {
  usage: A;
  run: Runner<A>;
}

declare function create<A extends ArgumentNode[]>(cmd: Command<A>): void;

declare function node<
  T,
  N extends string,
  G extends boolean,
  O extends boolean
>(
  name: N,
  parser: () => T | undefined,
  opts: { optional: O; greedy: G }
): {
  name: N;
  greedy: G;
  optional: O;
  parse: typeof parser;
};

create({
  usage: [
    node("foo", () => "Hello", { greedy: true, optional: false }),
    node("foo2", () => "Hello", { greedy: false, optional: true }),
  ],
  run(ctx) {
    ctx.args.foo; // string[] ~ should be: string[]
    ctx.args.foo2; // string | undefined ~ should be: string | undefined
  },
});

create({
  usage: [
    node("foo", () => "Hello", { greedy: false, optional: false }),
    node("foo2", () => "Hello", { greedy: true, optional: true }),
  ],
  run(ctx) {
    ctx.args.foo; // string
    ctx.args.foo2; // string[] | undefined ~ should be: string[] | undefined
  },
});
