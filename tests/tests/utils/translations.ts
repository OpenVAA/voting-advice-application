import fs from 'fs';
import path from 'path';
import { TESTS_DIR } from './testsDir';
import { locales as localeNames } from '../../../frontend/src/lib/i18n/translations';
import type { TranslationKey } from '../../../frontend/src/lib/types';

const TRANSL_DIR = path.join(TESTS_DIR, '../../frontend/src/lib/i18n/translations');

const ENCODING = 'utf8';

/** All available translation keys and their values sorted by locale. */
export const TRANSLATIONS = Object.freeze(readTranslationsAndFlatten());

/**
 * Read all translation files and return them as a record of the form:
 * "en.common.answer.no": "No"
 */
function readTranslationsAndFlatten(): {
  [locale: string]: Record<TranslationKey, string>;
} {
  const translations: Translations = {};
  const locales = fs.readdirSync(TRANSL_DIR).filter((name) => fs.lstatSync(path.join(TRANSL_DIR, name)).isDirectory());
  for (const locale of locales) {
    // The locale names are not included in the JSON translation files, so we need to add them manually
    const localeTranslations: Translations = { lang: { ...localeNames } };
    const files = fs.readdirSync(path.join(TRANSL_DIR, locale));
    for (const file of files) {
      const prefix = file.replace(/\.json$/, '');
      localeTranslations[prefix] = readJsonTranslations(locale, file);
    }
    translations[locale] = localeTranslations;
  }
  return Object.fromEntries(
    Object.entries(translations).map(([locale, localeTranslations]) => [
      locale,
      Object.fromEntries(flattenKeys(localeTranslations)) as Record<TranslationKey, string>
    ])
  );
}

/**
 * A recursive function which returns sorted array of flattened keys with their associated values.
 * @example `{a: 'abc', b: {c: 'def'}}` becomes `[['a', 'abc'], ['b.c', 'def']]`
 */
function flattenKeys(obj: Translations | string, prefix: string = ''): Array<[TranslationKey, string]> {
  const res = Array<[TranslationKey, string]>();
  for (const [key, value] of Object.entries(obj)) {
    const newKey = `${prefix}${key}`;
    if (typeof value === 'object') res.push(...flattenKeys(value, `${newKey}.`));
    else res.push([newKey as TranslationKey, value]);
  }
  return res;
}

/**
 * Reads contents of translation file
 */
function readJsonTranslations(locale: string, filename: string): Translations {
  const fp = path.join(TRANSL_DIR, locale, filename);
  return JSON.parse(fs.readFileSync(fp, ENCODING).toString());
}

type Translations = {
  [key: string]: Translations | string;
};
