import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { expect, test } from 'vitest';
import { keys, locales } from '../translations/index';

/**
 * Recursive function which returns sorted array of flattened keys.
 *
 * For example `{a: 'abc', b: {c: 'def'}}` is returned as `['<prefix>.a', '<prefix>.b.c']`
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function flattenKeys(obj: any, prefix: string): Array<string> {
  const res = Array<string>();
  for (const key in obj) {
    if (typeof obj[key] !== 'object') {
      res.push(`${prefix}.${key}`);
    } else {
      res.push(...flattenKeys(obj[key], `${prefix}.${key}`));
    }
  }
  return res.sort();
}

/**
 * Reads contents of translation file and returns sorted array of flattened keys.
 */
function getFlattenedTranslationKeys(locale: string, filename: string): Array<string> {
  const filePath = path.join(dirPath, locale, filename);
  const fileContentString = fs.readFileSync(filePath).toString();
  const fileContentJSON = JSON.parse(fileContentString);
  return flattenKeys(fileContentJSON, filename.replace('.json', ''));
}

// Path to translation files from this directory
const dirPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'translations');

const translationLocales = fs.readdirSync(dirPath).filter((name) => {
  return fs.lstatSync(path.join(dirPath, name)).isDirectory();
});

// First locale is chosen as the locale to which other locales are compared in the tests
const firstLocale = translationLocales[0];
const otherLocales = translationLocales.slice(1);

// Names of translation files in the directory of the first locale
const firstLocaleFilenames = fs.readdirSync(path.join(dirPath, firstLocale));

// Object which has filenames as keys and arrays of flattened translation keys as values for the first locale.
const firstLocaleFileKeys = Object.fromEntries(
  firstLocaleFilenames.map((filename) => {
    return [filename, getFlattenedTranslationKeys(firstLocale, filename)];
  })
);

test('translations/index.ts has all translation files', () => {
  expect(keys.sort()).toEqual(
    firstLocaleFilenames.map((filename) => filename.replace('.json', '')).sort()
  );
});

test('translations/index.ts has all locales', () => {
  expect(Object.keys(locales).sort()).toEqual(translationLocales.sort());
});

test.each(otherLocales)(`'%s' has same translation files as '${firstLocale}'`, (locale) => {
  const filenames = fs.readdirSync(path.join(dirPath, locale));
  expect(filenames).toEqual(firstLocaleFilenames);
});

describe.each(otherLocales)(`'%s' has same translation keys as '${firstLocale}'`, (locale) => {
  test.each(firstLocaleFilenames)('in %s', (filename) => {
    expect(getFlattenedTranslationKeys(locale, filename)).toEqual(firstLocaleFileKeys[filename]);
  });
});
