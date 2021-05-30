/* eslint-disable @typescript-eslint/no-explicit-any */

// A return value (T) that is either itself or wrapped in a promise.
export type Asyncable<T> = Promise<T> | T;

// The value of a promise (P) when awaited.
export type PromiseResult<P extends Promise<unknown>> = P extends Promise<
  infer T
>
  ? T
  : never;

// Makes a specific entry (K) in an object (T) optional.
export type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;

// https://github.com/Microsoft/TypeScript/issues/13298#issuecomment-707364842
// The best way I could describe how this works is the following:
// Imagine a Venn diagram (two overlapping circles) where
// A U B, (A overlaps B, or A union B, or in TS that would be A | B).
// You then removed the wings of it just to leave an oval behind.
// This is called A ∩ B, (A intersects B, or in TS that would be A & B).
// The next step is to use the following bug in typescript to get B by itself:
//   type C = ((arg: any) => true) & ((arg: any) => false);
//   type D = C extends (arg: any) => infer R ? R : never; // false
// Now that we have B by itself, we can return [...UnionToTuple<Exclude<A | B, B>>, B].
// Note that Exclude<A | B, B> removes the type B from the type A | B.
// We also run UnionToTuple<A> again as A could be a union in itself (A = D | E for example).
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

// This does nothing that I could only describe as magic,
// just use it when something breaks and maybe it'll solve it.
export type Narrow<T> = T extends [] ? T : NarrowBase<T>;

export function narrow<T>(x: Narrow<T>): Narrow<T> {
  return x;
}
