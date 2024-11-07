import { expect, test } from 'vitest';
import { isLocalizedValue, TRANSLATIONS_KEY } from '../internal';

test('IsLocalizedValue should match localized values', () => {
  expect(isLocalizedValue({ [TRANSLATIONS_KEY]: { en: 'Hello' } })).toBe(true);
  expect(isLocalizedValue({ [TRANSLATIONS_KEY]: { en: 'Hello', fi: 'Moi' } })).toBe(true);
  expect(isLocalizedValue({ [TRANSLATIONS_KEY]: {} }), 'To allow empty translations').toBe(true);
  expect(isLocalizedValue({ [TRANSLATIONS_KEY]: ['Hi'] }), 'To not allow arrays').toBe(false);
  expect(isLocalizedValue({ foo: 'bar' })).toBe(false);
  expect(isLocalizedValue({ foo: { en: 'Hello', fi: 'Moi' } })).toBe(false);
  expect(isLocalizedValue('Hello')).toBe(false);
});
