type StripFunctions<T extends Record<unknown, unknown>> = {
  [K in keyof T as T[K] extends (...args: any[]) => unknown ? never : K]: T[K];
};
