/**
 * The name of the translations property in a `LocalizedValue`.
 */
export const TRANSLATIONS_KEY = '__translations__';

/**
 * A localized string
 */
export type LocalizedValue = {
  [TRANSLATIONS_KEY]: { [locale: string]: string };
};

/**
 * An object possibly containing localized values
 */
export type LocalizedObject<TData extends object> = {
  [K in keyof TData]: MaybeLocalizedProp<TData[K]>;
};

/**
 * An array possibly containing localized values
 */
export type LocalizedArray<TItem> = Array<MaybeLocalizedProp<TItem>>;

/**
 * An object property that may be localized
 */
export type MaybeLocalizedProp<TItem> =
  | TItem
  | (NonNullable<TItem> extends string
      ? LocalizedValue
      : NonNullable<TItem> extends Array<infer U>
        ? LocalizedArray<U>
        : NonNullable<TItem> extends object
          ? LocalizedObject<NonNullable<TItem>>
          : never);

/**
 * Check whether `value` is `LocalizedValue`.
 * NB. It may nonetheless contain no translations.
 */
export function isLocalizedValue(value: unknown): value is LocalizedValue {
  return (
    typeof value === 'object' &&
    value !== null &&
    TRANSLATIONS_KEY in value &&
    typeof value[TRANSLATIONS_KEY] === 'object' &&
    !Array.isArray(value[TRANSLATIONS_KEY]) &&
    value[TRANSLATIONS_KEY] !== null
  );
}
