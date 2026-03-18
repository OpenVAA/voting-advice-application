import { isLocalizedObject, staticSettings } from '@openvaa/app-shared';
import { error } from '@sveltejs/kit';
import { getLocale, locales as paraglideLocales, setLocale } from '$lib/paraglide/runtime';
import { logDebugError } from '$lib/utils/logger';
import { matchLocale } from './utils';

export { clearOverrides, setOverrides } from './overrides';
export { t } from './wrapper';
export { getLocale, setLocale };

const { supportedLocales } = staticSettings;

/////////////////////////////////////////////////////
// 1. Determine default locale and locale mappings
/////////////////////////////////////////////////////

let defaultLocale = '';
/** Language names for translations */
const langNames: Record<string, string> = {};

if (!supportedLocales?.length) error(500, 'Could not load supported locales from settings');

for (const { code, name, isDefault } of supportedLocales) {
  if (code == undefined || typeof code !== 'string')
    error(500, `Invalid locale code in supported locales settings: ${code}`);
  langNames[code] = name;
  if (isDefault) defaultLocale = code;
}

if (!defaultLocale) {
  logDebugError(
    `[/lib/i18n/init] Using the first locale as default because no locale has isDefault set: ${supportedLocales[0].code}`
  );
  defaultLocale = supportedLocales[0].code;
}

export { defaultLocale };

/**
 * Supported locale codes from Paraglide runtime.
 */
export const locales = paraglideLocales;

/////////////////////////////////////////////////////
// 2. Utility function exports
/////////////////////////////////////////////////////

/**
 * Return the correct string for the locale using soft-matching from the supplied LocalizedString object.
 */
export function translate(strings: LocalizedString | string | undefined | null, locale?: string | null): string {
  return typeof strings === 'string' ? strings : ((translateObject(strings, locale) as string) ?? '');
}

/**
 * Return the correct property for the locale using soft-matching from the supplied localized object.
 * NB. Empty strings and nullish values are replaced by the fallback locale.
 */
export function translateObject<
  TObject extends Record<string, unknown> | null | undefined,
  TValue = TObject extends Record<string, infer V> ? V : never
>(obj: TObject, targetLocale?: string | null): TValue | undefined {
  if (!isLocalizedObject(obj)) return undefined;
  targetLocale ??= getLocale();
  let key: string | undefined;
  const nonEmptyKeys = Object.entries(obj)
    .filter(([, v]) => v != null && (typeof v !== 'string' || v !== ''))
    .map(([k]) => k);
  if (!nonEmptyKeys.length) return undefined;
  key = nonEmptyKeys.includes(targetLocale) ? targetLocale : matchLocale(targetLocale, nonEmptyKeys);
  key ??= nonEmptyKeys.includes(defaultLocale) ? defaultLocale : nonEmptyKeys[0];
  return (obj[key] ?? undefined) as TValue | undefined;
}
