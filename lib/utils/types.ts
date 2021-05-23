/* eslint-disable @typescript-eslint/no-explicit-any */
export type Asyncable<T> = Promise<T> | T;

export type PromiseResult<P extends Promise<unknown>> = P extends Promise<
  infer T
>
  ? T
  : never;

// https://github.com/Microsoft/TypeScript/issues/13298#issuecomment-707364842
export type UnionToTuple<T> = (
  (T extends any ? (t: T) => T : never) extends infer U
    ? (U extends any ? (u: U) => any : never) extends (v: infer V) => any
      ? V
      : never
    : never
) extends (_: any) => infer W
  ? [...UnionToTuple<Exclude<T, W>>, W]
  : [];

// https://github.com/millsp/ts-toolbelt/blob/a0d62d8cfcd28eab7132c225ba187556ca749b4d/sources/Function/Narrow.ts
type NarrowBase<T> =
  | (T extends [] ? T : never)
  | (T extends string | number | bigint | boolean ? T : never)
  // eslint-disable-next-line @typescript-eslint/ban-types
  | { [K in keyof T]: T[K] extends Function ? T[K] : NarrowBase<T[K]> };

export type Narrow<T> = T extends [] ? T : NarrowBase<T>;

export function narrow<T>(x: Narrow<T>): Narrow<T> {
  return x;
}
