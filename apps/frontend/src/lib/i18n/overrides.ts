import { IntlMessageFormat } from 'intl-messageformat';
import { getLocale } from '$lib/paraglide/runtime';

/** Map of locale -> flat key -> override string (ICU format) */
let overrideMap: Record<string, Record<string, string>> = {};

/**
 * Set overrides for a locale. Called from +layout.ts after loading appCustomization.
 */
export function setOverrides(locale: string, overrides: Record<string, unknown>): void {
  overrideMap[locale] = flattenObject(overrides);
}

/**
 * Clear all overrides (useful for testing).
 */
export function clearOverrides(): void {
  overrideMap = {};
}

/**
 * Get an override for a key, or undefined if no override exists.
 * Parses ICU format strings with intl-messageformat.
 */
export function getOverride(key: string, params?: Record<string, unknown>): string | undefined {
  const locale = getLocale();
  const overrides = overrideMap[locale];
  if (!overrides || !(key in overrides)) return undefined;

  const template = overrides[key];
  if (!params || Object.keys(params).length === 0) return template;

  try {
    return new IntlMessageFormat(template, locale).format(params) as string;
  } catch {
    return template;
  }
}

/** Flatten nested object to dot-notation keys */
function flattenObject(obj: Record<string, unknown>, prefix = ''): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'string') {
      result[fullKey] = value;
    } else if (typeof value === 'object' && value !== null) {
      Object.assign(result, flattenObject(value as Record<string, unknown>, fullKey));
    }
  }
  return result;
}
