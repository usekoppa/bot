// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.

export interface Deferred<T> extends Promise<T> {
  resolve(this: void, value?: T | PromiseLike<T>): void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  reject(this: void, reason?: any): void;
}

/**
 * Creates a Promise with the `reject` and `resolve` functions
 * placed as methods on the promise object itself. It allows you to do:
 *
 *     const p = deferred<number>();
 *     // ...
 *     p.resolve(42);
 */
export function deferred<T>(): Deferred<T> {
  let methods;
  const promise = new Promise<T>((resolve, reject): void => {
    methods = { resolve, reject };
  });

  return Object.assign(promise, methods) as Deferred<T>;
}
