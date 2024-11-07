/**
 * Make some properties of the base type optional.
 */
export type WithOptional<TType, TKeys extends keyof TType> = Omit<TType, TKeys> & {
  [K in TKeys]?: TType[K];
};
