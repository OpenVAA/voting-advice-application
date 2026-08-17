import { expect, test } from 'vitest';
import { defaultLocale, translate } from '../';
import { canonize, isLocale, matchLocale, parseAcceptedLanguages } from '../utils';

test('canonize and isLocale', () => {
  // Locale names are based on the examples in the RFC:
  // https://datatracker.ietf.org/doc/html/rfc5646#appendix-A
  // NB. Some more complicated ones don't seem to be work with the Intl module, such as
  // i-enochian and zh-cmn-Hans-CN, but these should not be needed anyway
  const validLocales = ['fi-FI', 'en-US', 'es', 'es-419', 'zh-Hant', 'hy-Latn-IT-arevela'];
  const invalidLocales = ['de-419-DE', 'ar-a-aaa-b-bbb-a-ccc'];
  for (const locale of validLocales) {
    expect(canonize(locale), `Canonize locale ${locale}`).toBeDefined();
    expect(isLocale(locale), `IsLocale ${locale}`).toEqual(true);
  }
  for (const locale of invalidLocales) {
    expect(canonize(locale), `Canonize locale ${locale}`).toBeUndefined();
    expect(isLocale(locale), `IsLocale ${locale}`).toEqual(false);
  }
});

test('matchLocale', () => {
  const available = ['fi-FI', 'en-US', 'es'];
  expect(matchLocale('*', available), 'Wildcard match').toEqual('fi-FI');
  expect(matchLocale(['zn', '*'], available), 'Wildcard match from list').toEqual('fi-FI');
  expect(matchLocale('en-US', available), 'Exact match').toEqual('en-US');
  expect(matchLocale('fi', available), 'Soft match').toEqual('fi-FI');
  expect(matchLocale('es-CO', available), 'Soft match, reversed').toEqual('es');
  expect(matchLocale(['fi', 'en-US'], available), 'Soft match from list').toEqual('fi-FI');
  expect(matchLocale('de', available), 'No match').toBeUndefined();
  expect(matchLocale(['de', 'zn'], available), 'No match from list').toBeUndefined();
});

test('parseAcceptedLanguages', () => {
  const header = 'fr-CH, fr;q=0.9, en;q=0.8, de;q=0.7, *;q=0.5';
  const header2 = '*;q=0.5, fr;q=0.9, de;q=0.7, en;q=0.8, fr-CH';
  const result = ['fr-CH', 'fr', 'en', 'de', '*'];
  expect(parseAcceptedLanguages(header)).toEqual(result);
  expect(parseAcceptedLanguages(header2), 'String order should not change results').toEqual(result);
  const header3 = 'fr-CH, en';
  const result3 = ['fr-CH', 'en'];
  expect(parseAcceptedLanguages(header3), 'String order should dictate order when there are no q values').toEqual(
    result3
  );
});

test('translate', () => {
  const defLocale = defaultLocale;
  const strings: LocalizedString = {
    [defLocale]: 'Default',
    'foo-bar': 'Foo',
    bar: 'Bar',
    empty: ''
  };
  expect(translate(strings, 'bar'), 'Exact locale match').toEqual(strings.bar);
  expect(translate(strings, 'foo'), 'Soft locale match').toEqual(strings['foo-bar']);
  expect(translate(strings, 'MISSING'), 'Default match').toEqual(strings[defLocale]);
  expect(translate(strings, 'empty'), 'Default match when target locale value is empty string').toEqual(
    strings[defLocale]
  );
  expect(translate({}, 'foo'), 'Empty string').toEqual('');
  expect(translate(null, 'foo'), 'Empty string').toEqual('');
});
