type StripFunctions<T extends Record<unknown, unknown>> = {
  [K in keyof T as T[K] extends (...args: any[]) => unknown ? never : K]: T[K];
};

type Complete<T> = {
  [K in keyof Required<T>]: Pick<T, K> extends Required<Pick<T, K>> ? T[K] : T[K] | undefined;
};
