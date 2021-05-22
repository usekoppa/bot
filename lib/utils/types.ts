export type Asyncable<T> = Promise<T> | T;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type $TS_FIX = any;

export type PromiseResult<P extends Promise<unknown>> = P extends Promise<
  infer T
>
  ? T
  : never;
