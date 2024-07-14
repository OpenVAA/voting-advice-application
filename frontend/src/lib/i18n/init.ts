import { error } from '@sveltejs/kit';
import I18n from '@sveltekit-i18n/base';
import parser, { type Config } from '@sveltekit-i18n/parser-icu';
import IntlMessageFormat from 'intl-messageformat';
import { derived, get } from 'svelte/store';
import { DEFAULT_PAYLOAD_KEYS, staticTranslations, type TranslationsPayload } from './translations';
import { matchLocale, purgeTranslations } from './utils';
import localSettings from '$lib/config/settings.json';
import { logDebugError } from '$lib/utils/logger';
import { ucFirst } from '$lib/utils/text/ucFirst';

// We don't want to use the implicit json file typing
const settings = localSettings as AppSettings;

const { supportedLocales } = settings;
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
 * @param key The key to translate.
 * @param payload A record of values to replace in the message.
 * @returns The translated and interpolated string or `key` if there was an error.
 */
export const t = {
  ...derived(i18n.t, ($t) => (key: string, payload?: TranslationsPayload) => {
    let parsed: string | undefined;
    try {
      parsed = $t(key, { ...defaultPayload, ...payload });
    } catch (e) {
      logDebugError(e);
    }
    return parsed == null ? key : parsed;
  }),
  get: (key: string, payload?: TranslationsPayload) =>
    get(i18n.t)(key, { ...defaultPayload, ...payload })
};

export const {
  locale,
  locales,
  loading,
  addTranslations,
  loadTranslations,
  translations,
  setRoute,
  setLocale
} = i18n;

export { defaultLocale };

/////////////////////////////////////////////////////
// 4. Utility function exports
/////////////////////////////////////////////////////

const dynamicTranslationsAdded: Record<string, boolean> = {};

/**
 * Add dynamic translations to the i18n with this method so that they will only be added once per locale.
 * @param loc The locale to which add the translations.
 * @param translations The translations
 */
export function addDynamicTranslations(
  loc: string,
  translations: Parameters<typeof addTranslations>[0]
) {
  if (dynamicTranslationsAdded[loc]) return;
  addTranslations(purgeTranslations({ [loc]: translations }));
  dynamicTranslationsAdded[loc] = true;
}

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
 * @param message The ICU message string
 * @param payload A record of values to replace in the message
 * @param useLocale An optional locale to use instead of the current locale
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
  defaultPayload.adminEmail = settings.admin.email;
  defaultPayload.analyticsLink = settings.analytics?.platform?.infoUrl
    ? `<a href="${settings.analytics.platform.infoUrl}" target="_blank">${ucFirst(settings.analytics.platform.name)}</a>`
    : '—';
}

locale.subscribe((l) => {
  if (l) updateDefaultPayload();
});
