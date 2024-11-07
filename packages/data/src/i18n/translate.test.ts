import { expect, test } from 'vitest';
import { LocalizedValue, translate, TRANSLATIONS_KEY } from '../internal';
import {
  getLocalizedTestData,
  getTranslatedTestData,
  TRANSLATED_TEST_DATA_LOCALE
} from '../testUtils/localizedTestData';

test('Should translate individual LocalizedValues', () => {
  const value: LocalizedValue = { [TRANSLATIONS_KEY]: { en: 'Hello', fi: 'Moi' } };
  const emptyValue: LocalizedValue = { [TRANSLATIONS_KEY]: {} };
  expect(translate({ value, locale: 'en' })).toBe('Hello');
  expect(translate({ value, locale: 'fi' })).toBe('Moi');
  expect(translate({ value, locale: 'foo' }), 'To default to first value').toBe('Hello');
  expect(translate({ value: emptyValue, locale: 'en' }), 'To return the empty string if translations are empty').toBe(
    ''
  );
});

test('Should translate localizedTestData', () => {
  expect(translate({ value: getLocalizedTestData(), locale: TRANSLATED_TEST_DATA_LOCALE })).toEqual(
    getTranslatedTestData()
  );
});
