import type { DataObjectData } from './dataObject.type';

/**
 * We implement this in `DataObject`s with `TData` as their own `DataObjectData` subtype to make sure that we have accessors for all of the properties in the object's data except those used to initialize the object's children. The type requires that all required and optional properties of the data are present in the object with the exception of id references and those listed in the `TExclude` parameter.
 * Furthermore, the values returned can never be `undefined`. In special cases, `null` may be returned, such as for missing `Date`s.
 */
export type DataAccessor<TData extends DataObjectData, TExclude extends keyof TData = never> = {
  [TKey in keyof TData as TKey extends IdRef
    ? never
    : TKey extends TExclude
      ? never
      : TKey]-?: NonNullable<unknown> | null;
};
type IdRef = `${string}Id` | `${string}Ids`;
