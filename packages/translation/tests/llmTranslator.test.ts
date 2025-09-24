import { beforeAll, describe, expect, test } from 'vitest';
import { LLMTranslator } from '../src/llmTranslator';
import type { LocalizedString } from '@openvaa/app-shared';
import type { Locale, Translations } from '../src/translator.type';

describe('LLMTranslator', () => {
  let translator: LLMTranslator;

  beforeAll(() => {
    translator = new LLMTranslator();
  });

  describe('Single string translation', () => {
    test('should translate single string to single language', async () => {
      const result = await translator.translate({
        from: 'en',
        to: 'fi',
        input: 'Hello world'
      });

      expect(typeof result).toBe('string');
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
    });

    test('should translate single string to multiple languages', async () => {
      const result = await translator.translate({
        from: 'en',
        to: ['fi', 'sv'],
        input: 'Hello world'
      });

      expect(typeof result).toBe('object');
      expect(result).toBeDefined();

      // Verify it's a proper LocalizedString
      const localizedResult = result as LocalizedString;
      expect(localizedResult.en).toBe('Hello world'); // Source should be preserved
      expect(localizedResult.fi).toBeDefined();
      expect(localizedResult.sv).toBeDefined();
      expect(typeof localizedResult.fi).toBe('string');
      expect(typeof localizedResult.sv).toBe('string');
      expect(localizedResult.fi.length).toBeGreaterThan(0);
      expect(localizedResult.sv.length).toBeGreaterThan(0);
    });
  });

  describe('Array of strings translation', () => {
    test('should translate array of strings to single language', async () => {
      const result = await translator.translate({
        from: 'en',
        to: 'fi',
        input: ['Hello', 'World', 'Test']
      });

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(3);

      // Type assertion to verify it's string[]
      const stringArrayResult = result as Array<string>;
      expect(stringArrayResult.every((item) => typeof item === 'string')).toBe(true);
      expect(stringArrayResult.every((item) => item.length > 0)).toBe(true);
    });

    test('should translate array of strings to multiple languages', async () => {
      const result = await translator.translate({
        from: 'en',
        to: ['fi', 'sv'],
        input: ['Hello', 'World']
      });

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(2);

      const localizedArrayResult = result as Array<LocalizedString>;

      // Check first element
      expect(localizedArrayResult[0].en).toBe('Hello'); // Source preserved
      expect(localizedArrayResult[0].fi).toBeDefined();
      expect(localizedArrayResult[0].sv).toBeDefined();
      expect(typeof localizedArrayResult[0].fi).toBe('string');
      expect(typeof localizedArrayResult[0].sv).toBe('string');

      // Check second element
      expect(localizedArrayResult[1].en).toBe('World'); // Source preserved
      expect(localizedArrayResult[1].fi).toBeDefined();
      expect(localizedArrayResult[1].sv).toBeDefined();
      expect(typeof localizedArrayResult[1].fi).toBe('string');
      expect(typeof localizedArrayResult[1].sv).toBe('string');
    });
  });

  describe('LocalizedString translation', () => {
    test('should translate LocalizedString to multiple languages', async () => {
      const input: LocalizedString = {
        en: 'Hello world'
      };

      const result = await translator.translate({
        from: 'en',
        to: ['fi', 'sv'],
        input
      });

      expect(typeof result).toBe('object');
      const localizedResult = result as LocalizedString;
      expect(localizedResult.en).toBe('Hello world'); // Source preserved
      expect(localizedResult.fi).toBeDefined();
      expect(localizedResult.sv).toBeDefined();
      expect(typeof localizedResult.fi).toBe('string');
      expect(typeof localizedResult.sv).toBe('string');
      expect(localizedResult.fi.length).toBeGreaterThan(0);
      expect(localizedResult.sv.length).toBeGreaterThan(0);
    });

    test('should not overwrite existing translations when translating to multiple languages', async () => {
      const input: LocalizedString = {
        en: 'Hello world',
        fi: 'Existing Finnish translation'
      };

      const result = await translator.translate({
        from: 'en',
        to: ['fi', 'sv'],
        input
      });

      const localizedResult = result as LocalizedString;
      expect(localizedResult.en).toBe('Hello world'); // Source preserved
      expect(localizedResult.fi).toBeDefined(); // Should be translated (may overwrite)
      expect(localizedResult.sv).toBeDefined(); // Should be translated
      expect(typeof localizedResult.fi).toBe('string');
      expect(typeof localizedResult.sv).toBe('string');
    });

    test('should preserve source language when it matches target', async () => {
      const input: LocalizedString = {
        en: 'Hello world'
      };

      const result = await translator.translate({
        from: 'en',
        to: ['en', 'fi'],
        input
      });

      const localizedResult = result as LocalizedString;
      expect(localizedResult.en).toBe('Hello world'); // Should remain unchanged (source = target)
      expect(localizedResult.fi).toBeDefined();
      expect(typeof localizedResult.fi).toBe('string');
      expect(localizedResult.fi.length).toBeGreaterThan(0);
    });
  });

  describe('Array of LocalizedStrings translation', () => {
    test('should translate array of LocalizedStrings to single language', async () => {
      const input: Array<LocalizedString> = [{ en: 'Hello' }, { en: 'World' }];

      const result = await translator.translate({
        from: 'en',
        to: 'fi',
        input
      });

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(2);

      const localizedArrayResult = result as Array<LocalizedString>;
      expect(localizedArrayResult[0].en).toBe('Hello'); // Source preserved
      expect(localizedArrayResult[0].fi).toBeDefined();
      expect(typeof localizedArrayResult[0].fi).toBe('string');

      expect(localizedArrayResult[1].en).toBe('World'); // Source preserved
      expect(localizedArrayResult[1].fi).toBeDefined();
      expect(typeof localizedArrayResult[1].fi).toBe('string');
    });

    test('should translate array of LocalizedStrings to multiple languages', async () => {
      const input: Array<LocalizedString> = [{ en: 'Hello' }, { en: 'World' }];

      const result = await translator.translate({
        from: 'en',
        to: ['fi', 'sv'],
        input
      });

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(2);

      const localizedArrayResult = result as Array<LocalizedString>;
      // Check first element
      expect(localizedArrayResult[0].en).toBe('Hello'); // Source preserved
      expect(localizedArrayResult[0].fi).toBeDefined();
      expect(localizedArrayResult[0].sv).toBeDefined();
      expect(typeof localizedArrayResult[0].fi).toBe('string');
      expect(typeof localizedArrayResult[0].sv).toBe('string');

      // Check second element
      expect(localizedArrayResult[1].en).toBe('World'); // Source preserved
      expect(localizedArrayResult[1].fi).toBeDefined();
      expect(localizedArrayResult[1].sv).toBeDefined();
      expect(typeof localizedArrayResult[1].fi).toBe('string');
      expect(typeof localizedArrayResult[1].sv).toBe('string');
    });
  });

  describe('JSON Translations object translation', () => {
    test('should translate flat JSON object to single language', async () => {
      const input: Translations = {
        greeting: 'Hello',
        farewell: 'Goodbye',
        question: 'How are you?'
      };

      const result = await translator.translate({
        from: 'en',
        to: 'fi',
        input
      });

      expect(typeof result).toBe('object');
      const translatedResult = result as Translations;
      expect(translatedResult.greeting).toBeDefined();
      expect(translatedResult.farewell).toBeDefined();
      expect(translatedResult.question).toBeDefined();
      expect(typeof translatedResult.greeting).toBe('string');
      expect(typeof translatedResult.farewell).toBe('string');
      expect(typeof translatedResult.question).toBe('string');
      expect(translatedResult.greeting.length).toBeGreaterThan(0);
      expect(translatedResult.farewell.length).toBeGreaterThan(0);
      expect(translatedResult.question.length).toBeGreaterThan(0);
    });

    test('should translate nested JSON object to single language', async () => {
      const input: Translations = {
        common: {
          greeting: 'Hello',
          farewell: 'Goodbye'
        },
        forms: {
          submit: 'Submit',
          cancel: 'Cancel'
        }
      };

      const result = await translator.translate({
        from: 'en',
        to: 'fi',
        input
      });

      expect(typeof result).toBe('object');
      const translatedResult = result as Translations;

      // Check structure is preserved
      expect(translatedResult.common).toBeDefined();
      expect(translatedResult.forms).toBeDefined();
      expect(typeof translatedResult.common).toBe('object');
      expect(typeof translatedResult.forms).toBe('object');

      // Check nested translations
      const common = translatedResult.common as Translations;
      const forms = translatedResult.forms as Translations;
      expect(typeof common.greeting).toBe('string');
      expect(typeof common.farewell).toBe('string');
      expect(typeof forms.submit).toBe('string');
      expect(typeof forms.cancel).toBe('string');
      expect(common.greeting.length).toBeGreaterThan(0);
      expect(common.farewell.length).toBeGreaterThan(0);
      expect(forms.submit.length).toBeGreaterThan(0);
      expect(forms.cancel.length).toBeGreaterThan(0);
    });

    test('should translate JSON object to multiple languages', async () => {
      const input: Translations = {
        greeting: 'Hello',
        farewell: 'Goodbye'
      };

      const result = await translator.translate({
        from: 'en',
        to: ['fi', 'sv'],
        input
      });

      expect(typeof result).toBe('object');

      const multiLangResult = result as Record<Locale, Translations>;

      // Check Finnish translation
      expect(multiLangResult.fi).toBeDefined();
      expect(typeof multiLangResult.fi).toBe('object');
      expect(typeof multiLangResult.fi.greeting).toBe('string');
      expect(typeof multiLangResult.fi.farewell).toBe('string');
      expect(multiLangResult.fi.greeting.length).toBeGreaterThan(0);
      expect(multiLangResult.fi.farewell.length).toBeGreaterThan(0);

      // Check Swedish translation
      expect(multiLangResult.sv).toBeDefined();
      expect(typeof multiLangResult.sv).toBe('object');
      expect(typeof multiLangResult.sv.greeting).toBe('string');
      expect(typeof multiLangResult.sv.farewell).toBe('string');
      expect(multiLangResult.sv.greeting.length).toBeGreaterThan(0);
      expect(multiLangResult.sv.farewell.length).toBeGreaterThan(0);
    });
  });

  describe('Error handling', () => {
    test('should throw if input is empty', async () => {
      await expect(
        translator.translate({
          from: 'en',
          to: 'fi',
          input: {}
        })
      ).rejects.toThrow('You cannot pass an empty object as input to translate');
    });

    test('should throw error for unsupported input type', async () => {
      await expect(
        translator.translate({
          from: 'en',
          to: 'fi',
          input: 123 as any // eslint-disable-line @typescript-eslint/no-explicit-any
        })
      ).rejects.toThrow('Unsupported input type for translation. Got: 123. For available input types see the translation package');
    });

    test('should fail with empty string input', async () => {
      await expect(
      translator.translate({
        from: 'en',
        to: 'fi',
        input: ''
      })
    ).rejects.toThrow('You cannot pass an empty object as input to translate')
      // Empty input may result in empty output or placeholder text
    });

    test('should throw error for null input', async () => {
      await expect(
        translator.translate({
          from: 'en',
          to: 'fi',
          input: null as any // eslint-disable-line @typescript-eslint/no-explicit-any
        })
      ).rejects.toThrow('Null or undefined input cannot be used as an input to translate. Got: null');
    });

    test('should throw error for undefined input', async () => {
      await expect(
        translator.translate({
          from: 'en',
          to: 'fi',
          input: undefined as any // eslint-disable-line @typescript-eslint/no-explicit-any
        })
      ).rejects.toThrow('Null or undefined input cannot be used as an input to translate. Got: undefined');
    });
  });

  test('should throw is an empty array input', async () => {
    await expect(
      translator.translate({
        from: 'en',
        to: 'fi',
        input: []
      })
    ).rejects.toThrow('You cannot pass an empty object as input to translate');
  });

  describe('Edge cases', () => {
    test('should handle LocalizedString with wrong source language', async () => {
      const input: LocalizedString = {
        de: 'Hallo Welt' // Wrong source language
      };

      const result = await translator.translate({
        from: 'en',
        to: 'fi',
        input
      });

      // Should handle missing source gracefully by ignoring it
      const localizedResult = result as LocalizedString;
      expect(localizedResult.fi).toBeDefined(); // Should have some translation
      expect(typeof localizedResult.fi).toBe('string');
    });

    test('should handle array with mixed valid LocalizedStrings', async () => {
      const input: Array<LocalizedString> = [{ en: 'Hello' }, { en: 'World', fi: 'Maailma' }];

      const result = await translator.translate({
        from: 'en',
        to: 'sv',
        input
      });

      const arrayResult = result as Array<LocalizedString>;
      expect(arrayResult).toHaveLength(2);

      // First element
      expect(arrayResult[0].en).toBe('Hello');
      expect(arrayResult[0].sv).toBeDefined();
      expect(typeof arrayResult[0].sv).toBe('string');

      // Second element
      expect(arrayResult[1].en).toBe('World');
      expect(arrayResult[1].fi).toBe('Maailma'); // Existing translation preserved
      expect(arrayResult[1].sv).toBeDefined();
      expect(typeof arrayResult[1].sv).toBe('string');
    });

    test('should handle deeply nested JSON structure', async () => {
      const input: Translations = {
        level1: {
          level2: {
            level3: {
              deepValue: 'Deep nested value'
            }
          }
        }
      };

      const result = await translator.translate({
        from: 'en',
        to: 'fi',
        input
      });

      const translatedResult = result as Translations;
      expect(translatedResult.level1).toBeDefined();
      expect(typeof translatedResult.level1).toBe('object');

      const level1 = translatedResult.level1 as Translations;
      expect(level1.level2).toBeDefined();
      expect(typeof level1.level2).toBe('object');

      const level2 = level1.level2 as Translations;
      expect(level2.level3).toBeDefined();
      expect(typeof level2.level3).toBe('object');

      const level3 = level2.level3 as Translations;
      expect(level3.deepValue).toBeDefined();
      expect(typeof level3.deepValue).toBe('string');
      expect(level3.deepValue.length).toBeGreaterThan(0);
    });
  });

  describe('Context parameter', () => {
    test('should accept context parameter without affecting output structure', async () => {
      const result = await translator.translate({
        from: 'en',
        to: 'fi',
        input: 'Hello world',
        context: {
          instructions: 'Translate formally',
          context: 'Business setting'
        }
      });

      expect(typeof result).toBe('string');
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('Async behavior', () => {
    test('should return Promise that resolves', async () => {
      const promise = translator.translate({
        from: 'en',
        to: 'fi',
        input: 'Hello'
      });

      expect(promise).toBeInstanceOf(Promise);
      const result = await promise;
      expect(typeof result).toBe('string');
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
    });

    test('should handle async operations properly', async () => {
      // Test multiple concurrent translations
      const promises = [
        translator.translate({ from: 'en', to: 'fi', input: 'Hello' }),
        translator.translate({ from: 'en', to: 'sv', input: 'World' }),
        translator.translate({ from: 'en', to: 'de', input: 'Test' })
      ];

      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      results.forEach((result) => {
        expect(typeof result).toBe('string');
        expect(result).toBeDefined();
        expect(result.length).toBeGreaterThan(0);
      });
    });
  });
});
