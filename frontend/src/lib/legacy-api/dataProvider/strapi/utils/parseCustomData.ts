import { translateObject } from '$lib/i18n/utils/translate';

/**
 * Parse a custom data object from Strapi. If its root has a `localized` property, its contents will be translated.
 */

export function parseCustomData(data: JSONData): JSONData {
  if (typeof data !== 'object' || data === null || !('localized' in data)) return data;
  const { localized, ...rest } = data;
  if (typeof localized !== 'object' || localized === null) return data;
  return {
    ...(translateObject(localized as Record<string, unknown>) as object),
    ...rest
  };
}
