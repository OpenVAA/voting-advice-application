import { expect, test } from 'vitest';
import { translate, TRANSLATIONS_KEY } from '../internal';
import {
  getLocalizedTestData,
  getTranslatedTestData,
  TRANSLATED_TEST_DATA_LOCALE
} from '../testUtils/localizedTestData';
import type { LocalizedValue } from '../internal';

test('Should translate individual LocalizedValues', () => {
  const value: LocalizedValue = { [TRANSLATIONS_KEY]: { en: 'Hello', fi: 'Moi', sv: '' } };
  const emptyValue: LocalizedValue = { [TRANSLATIONS_KEY]: {} };
  expect(translate({ value, locale: 'en' })).toBe('Hello');
  expect(translate({ value, locale: 'fi' })).toBe('Moi');
  expect(translate({ value, locale: 'foo' }), 'To default to first value').toBe('Hello');
  expect(translate({ value, locale: 'sv' }), 'To default to first value if target value is empty string').toBe('Hello');
  expect(
    translate({ value: emptyValue, locale: 'en' }),
    'To return undefined if translations are empty'
  ).toBeUndefined();
});

test('Should translate localizedTestData', () => {
  expect(translate({ value: getLocalizedTestData(), locale: TRANSLATED_TEST_DATA_LOCALE })).toEqual(
    getTranslatedTestData()
  );
});
