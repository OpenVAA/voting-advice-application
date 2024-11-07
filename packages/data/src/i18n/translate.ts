import { isLocalizedValue, LocalizedArray, LocalizedObject, LocalizedValue, TRANSLATIONS_KEY } from './localized';

/**
 * Translate recursively any data structure containing some `LocalizedValues`.
 * @param value - The data to translate.
 * @param locale - The locale to translate to.
 * @returns The translated data if `value` is a `LocalizedValue`, the original `value` otherwise.
 */
export function translate<TType, TOut = TType extends LocalizedValue ? string : TType>({
  value,
  locale
}: {
  value: TType;
  locale: string;
}): TOut {
  let out: unknown;
  if (value == null) out = value;
  else if (isLocalizedValue(value))
    // Default to first locale if no matching translation is found and finally to an empty string if the translations record is empty
    out = value[TRANSLATIONS_KEY][locale] ?? Object.values(value[TRANSLATIONS_KEY])[0] ?? '';
  else if (Array.isArray(value)) out = translateArray({ data: value, locale });
  else if (typeof value === 'object') out = translateObject({ data: value, locale });
  else out = value;
  return out as TOut;
}

/**
 * Translate a `LocalizedObject`.
 * @param data - The object to translate.
 * @param locale - The locale to translate to.
 * @returns A new object with all `LocalizedValue`s recursively translated.
 */
function translateObject<TData extends object>({
  data,
  locale
}: {
  data: LocalizedObject<TData>;
  locale: string;
}): TData {
  const out: Partial<TData> = {};
  for (const kv of Object.entries(data)) {
    const key = kv[0] as keyof TData;
    const value = kv[1];
    // If value is undefined don't add it to the output
    if (value === undefined) continue;
    out[key] = translate({ value, locale });
  }
  return out as TData;
}

/**
 * Translate a `LocalizedArray`.
 * @param data - The array to translate.
 * @param locale - The locale to translate to.
 * @returns A new array with all `LocalizedValue`s recursively translated.
 */
function translateArray<TItem>({ data, locale }: { data: LocalizedArray<TItem>; locale: string }): Array<TItem> {
  return data.map((value) => translate({ value, locale }));
}
