import { isLocalizedObject, staticSettings } from '@openvaa/app-shared';
import { error } from '@sveltejs/kit';
import I18n from '@sveltekit-i18n/base';
import parser, { type Config } from '@sveltekit-i18n/parser-icu';
import { IntlMessageFormat } from 'intl-messageformat';
import { derived, get } from 'svelte/store';
import { logDebugError } from '$lib/utils/logger';
import { ucFirst } from '$lib/utils/text/ucFirst';
import { DEFAULT_PAYLOAD_KEYS, staticTranslations, type TranslationsPayload } from './translations';
import { matchLocale } from './utils';
import type { TranslationKey } from '$types';

const { supportedLocales } = staticSettings;
let defaultLocale = '';
/** Language names for translations */
const langNames: Record<string, string> = {};
/** Mapping of soft locale matches from locales defined in settings to the static ones */
const localeMatches: Record<string, string> = {};
/** Items to add to all translation payloads */
const defaultPayload: Partial<TranslationsPayload> = {};

/////////////////////////////////////////////////////
// 1. Load supported locales
/////////////////////////////////////////////////////

if (!supportedLocales?.length) error(500, 'Could not load supported locales from settings');

const staticDefaultLocale = Object.keys(staticTranslations)[0];

for (const { code, name, isDefault } of supportedLocales) {
  if (code == undefined || typeof code !== 'string')
    error(500, `Invalid locale code in supported locales settings: ${code}`);
  // For translations
  langNames[code] = name;
  // For a map of locale matches between supported locales and static ones (e.g. 'en-UK' => 'en')
  localeMatches[code] = matchLocale(code, Object.keys(staticTranslations)) ?? staticDefaultLocale;
  if (isDefault) defaultLocale = code;
}

if (!defaultLocale) {
  logDebugError(
    `[/lib/i18n/init] Using the first locale as default because no locale has isDefault set: ${supportedLocales[0].code}`
  );
  defaultLocale = supportedLocales[0].code;
}

/////////////////////////////////////////////////////
// 2. Load static translations
/////////////////////////////////////////////////////

// Update language name translations for those missing
for (const [l, statLoc] of Object.entries(localeMatches)) {
  if (!(l in langNames)) {
    langNames[l] = statLoc in staticTranslations ? staticTranslations[statLoc].name : l;
  }
}

const config: Config<TranslationsPayload> = {
  // log: { level: import.meta.env.DEV ? 'debug' : 'warn' },
  parser: parser({ ignoreTag: true }),
  // Add language names as default translations for all locales under the 'lang' key
  translations: Object.fromEntries(Object.keys(localeMatches).map((l) => [l, { lang: langNames }])),
  // Define loaders so that we use the dbLocales names for ones matched in static locales
  loaders: Object.entries(localeMatches)
    .map(([dbLoc, statLoc]) =>
      staticTranslations[statLoc].loaders.map((loader) => ({
        locale: dbLoc,
        ...loader
      }))
    )
    .flat(),
  fallbackLocale: defaultLocale
};

/////////////////////////////////////////////////////
// 3. Initialize the i18n instance and export methods
/////////////////////////////////////////////////////

const i18n = new I18n(config);

/**
 * A store providing the translate function wrapped in a try block because `intl-messageformat` throws an error if it encounters a malformed message string.
 *
 * @param key - The key to translate.
 * @param payload - A record of values to replace in the message.
 * @returns The translated and interpolated string or `key` if there was an error.
 */
export const t = {
  ...derived(i18n.t, ($t) => (key: TranslationKey, payload?: TranslationsPayload) => {
    let parsed: string | undefined;
    try {
      parsed = $t(key, { ...defaultPayload, ...payload });
    } catch (e) {
      logDebugError(e);
    }
    return parsed == null ? key : parsed;
  }),
  get: (key: TranslationKey, payload?: TranslationsPayload) => get(i18n.t)(key, { ...defaultPayload, ...payload })
};

export const { locale, locales, loading, addTranslations, loadTranslations, translations, setRoute, setLocale } = i18n;

export { defaultLocale };

/////////////////////////////////////////////////////
// 4. Utility function exports
/////////////////////////////////////////////////////

/**
 * Parse a message with supplied values using the international message (or ICU) format. See https://formatjs.io/docs/intl-messageformat/
 *
 * @example {
 *  "plural": "You have {value, plural, =0 {no photos.} =1 {one photo.} other {# photos.}}",
 *  "select": "{value, select, male {He} female {She} other {They}} will respond shortly.",
 *  "selectordinal": "It's my cat's {value, selectordinal, one {#st} two {#nd} few {#rd} other {#th}} birthday",
 *  "number": "The price is: {value, number, ::currency/EUR}",
 *  "date": "Today is: {value, date, ::yyyyMd}"
 *  }
 *
 * @param message - The ICU message string
 * @param payload - A record of values to replace in the message
 * @param useLocale - An optional locale to use instead of the current locale
 * @returns The string with the values interpolated
 */
export function parse(message: string, payload: Record<string, unknown> = {}, useLocale?: string) {
  useLocale ??= locale.get();
  let parsed: string | undefined;
  try {
    parsed = new IntlMessageFormat(message, useLocale).format({
      ...defaultPayload,
      ...payload
    }) as string;
  } catch (e) {
    logDebugError(e);
  }
  return parsed == null ? message : parsed;
}

/**
 * Return the correct string for the `locale` using soft-matching from the supplied `LocalizedString` object.
 *
 * @param strings - An object with locale-translation key-value pairs or a raw string
 * @param locale - The target locale
 * @returns The translalated string or ''
 */
export function translate(strings: LocalizedString | string | undefined | null, locale?: string | null): string {
  return typeof strings === 'string' ? strings : ((translateObject(strings, locale) as string) ?? '');
}

/**
 * Return the correct property for the `locale` using soft-matching from the supplied localized object.
 *
 * NB. Empty strings and nullish values are replaced by the fallback locale.
 *
 * @param strings - An object with locale-content key-value pairs
 * @param targetLocale - The target locale
 * @returns The localized content or `undefined`
 */
export function translateObject<
  TObject extends Record<string, unknown> | null | undefined,
  TValue = TObject extends Record<string, infer V> ? V : never
>(obj: TObject, targetLocale?: string | null): TValue | undefined {
  if (!isLocalizedObject(obj)) return undefined;
  targetLocale ??= locale.get();
  let key: string | undefined;
  // Treat keys with empty strings as undefined
  const nonEmptyKeys = Object.entries(obj)
    .filter(([, v]) => v != null && (typeof v !== 'string' || v !== ''))
    .map(([k]) => k);
  if (!nonEmptyKeys.length) return undefined;
  // Try to get an exact or soft match for target locale
  key = nonEmptyKeys.includes(targetLocale) ? targetLocale : matchLocale(targetLocale, nonEmptyKeys);
  // If not, use the default locale if available or just the first non-empty key
  key ??= nonEmptyKeys.includes(defaultLocale) ? defaultLocale : nonEmptyKeys[0];
  return (obj[key] ?? undefined) as TValue | undefined;
}

/////////////////////////////////////////////////////
// 5. DEFAULT PAYLOAD
/////////////////////////////////////////////////////

/**
 * Updates the default payload items.
 */
function updateDefaultPayload() {
  const t = get(i18n.t);
  for (const [key, path] of Object.entries(DEFAULT_PAYLOAD_KEYS)) {
    defaultPayload[key] = t(path);
  }
  defaultPayload.adminEmailLink = `<a href="mailto:${staticSettings.admin.email}">${staticSettings.admin.email}</a>`;
  defaultPayload.analyticsLink = staticSettings.analytics?.platform?.infoUrl
    ? `<a href="${staticSettings.analytics.platform.infoUrl}" target="_blank">${ucFirst(staticSettings.analytics.platform.name)}</a>`
    : '—';
}

locale.subscribe((l) => {
  if (l) updateDefaultPayload();
});
