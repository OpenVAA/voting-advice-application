import { isLocalizedString, type LocalizedString } from '@openvaa/app-shared';
import { isEmptyValue } from '@openvaa/core';
import { Translator } from './translator';
import type { Locale, TranslateArgs, Translations } from './translator.type';

export class LLMTranslator extends Translator {
  private getAvailableSourceLanguage(input: LocalizedString, preferredFrom: string): string | null {
    // Try the preferred language first
    if (input[preferredFrom]) {
      return preferredFrom;
    }

    // Fall back to the first available language
    console.warn(
      '[LLMTranslator]: Tried getting source language ' +
        preferredFrom +
        ', but it was not available in the input ' +
        JSON.stringify(input) +
        ' - Falling back to the first available language'
    );
    const availableLanguages = Object.keys(input).filter((lang) => typeof input[lang] === 'string');
    return availableLanguages.length > 0 ? availableLanguages[0] : null;
  }

  private validateInput(input: string | Array<string> | LocalizedString | Array<LocalizedString> | Translations): void {
    if (input == null || input == undefined) {
      throw new Error('Null or undefined input cannot be used as an input to translate. Got: ' + input);
    }

    if (isEmptyValue(input)) {
      throw new Error('You cannot pass an empty object as input to translate.');
    }
  }

  // Single string to single language
  async translate(args: TranslateArgs<string>): Promise<string>;

  // Single string to multiple languages
  async translate(args: TranslateArgs<string, true>): Promise<LocalizedString>;

  // Array of strings to single language
  async translate(args: TranslateArgs<Array<string>>): Promise<Array<string>>;

  // Array of strings to multiple languages
  async translate(args: TranslateArgs<Array<string>, true>): Promise<Array<LocalizedString>>;

  // LocalizedString to single language
  async translate(args: TranslateArgs<LocalizedString>): Promise<LocalizedString>;

  // LocalizedString to multiple languages
  async translate(args: TranslateArgs<LocalizedString, true>): Promise<LocalizedString>;

  // Array of LocalizedStrings to single language
  async translate(args: TranslateArgs<Array<LocalizedString>>): Promise<Array<LocalizedString>>;

  // Array of LocalizedStrings to multiple languages
  async translate(args: TranslateArgs<Array<LocalizedString>, true>): Promise<Array<LocalizedString>>;

  // JSON object to single language
  async translate(args: TranslateArgs<Translations>): Promise<Translations>;

  // JSON object to multiple languages
  async translate(args: TranslateArgs<Translations, true>): Promise<Record<Locale, Translations>>;

  // Actual implementation that handles all overloads
  async translate(
    args: TranslateArgs<string | Array<string> | LocalizedString | Array<LocalizedString> | Translations, boolean>
  ): Promise<
    string | LocalizedString | Array<string> | Array<LocalizedString> | Translations | Record<Locale, Translations>
  > {
    const { from, to, input } = args;

    // Throw inside the validateInput method
    this.validateInput(input);

    // Simulate async operation
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Handle single string input
    if (typeof input === 'string') {
      if (Array.isArray(to)) {
        // Multiple languages - return LocalizedString
        const result: LocalizedString = { [from]: input };
        to.forEach((locale) => {
          result[locale] = `[STUB_TRANSLATED_${locale.toUpperCase()}] ${input}`;
        });
        return result;
      } else {
        // Single language - return string
        return `[STUB_TRANSLATED_${to.toUpperCase()}] ${input}`;
      }
    }

    // Handle array of strings
    if (Array.isArray(input) && (input.length === 0 || typeof input[0] === 'string')) {
      if (Array.isArray(to)) {
        // Multiple languages - return array of LocalizedStrings
        return input.map((str) => {
          const result: LocalizedString = { [from]: str } as LocalizedString;
          to.forEach((locale) => {
            result[locale] = `[STUB_TRANSLATED_${locale.toUpperCase()}] ${str}`;
          });
          return result;
        });
      } else {
        // Single language - return array of strings
        return input.map((str) => `[STUB_TRANSLATED_${to.toUpperCase()}] ${str}`);
      }
    }

    // Handle LocalizedString input
    if (isLocalizedString(input)) {
      const sourceLanguage = this.getAvailableSourceLanguage(input as LocalizedString, from);
      if (!sourceLanguage) {
        throw new Error('No available source language found');
      }

      const sourceText = input[from];
      if (Array.isArray(to)) {
        // Multiple languages - return LocalizedString with all translations
        const result: LocalizedString = { ...input } as LocalizedString;
        to.forEach((locale) => {
          if (locale !== from) {
            result[locale] = `[STUB_TRANSLATED_${locale.toUpperCase()}] ${sourceText}`;
          }
        });
        return result;
      } else {
        // Single language - return LocalizedString with new translation
        return {
          ...input,
          [to]: `[STUB_TRANSLATED_${to.toUpperCase()}] ${sourceText}`
        };
      }
    }

    // Handle array of LocalizedStrings
    if (Array.isArray(input) && input[0] && isLocalizedString(input[0])) {
      const localizedInput = input as Array<LocalizedString>; // Add type assertion
      if (Array.isArray(to)) {
        // Multiple languages
        return localizedInput.map((localizedStr) => {
          const sourceText = localizedStr[from] as string;
          const result: LocalizedString = { ...localizedStr } as LocalizedString;
          to.forEach((locale) => {
            if (locale !== from) {
              result[locale] = `[STUB_TRANSLATED_${locale.toUpperCase()}] ${sourceText}`;
            }
          });
          return result;
        });
      } else {
        // Single language
        return localizedInput.map((localizedStr) => ({
          ...localizedStr,
          [to]: `[STUB_TRANSLATED_${to.toUpperCase()}] ${localizedStr[from]}`
        }));
      }
    }

    // Handle JSON translations object
    if (input && typeof input === 'object' && !Array.isArray(input)) {
      function translateObject(obj: Translations, targetLocale: string): Translations {
        const result: Translations = {};
        for (const [key, value] of Object.entries(obj)) {
          if (typeof value === 'string') {
            result[key] = `[STUB_TRANSLATED_${targetLocale.toUpperCase()}] ${value}`;
          } else if (typeof value === 'object') {
            result[key] = translateObject(value, targetLocale);
          }
        }
        return result;
      }

      if (Array.isArray(to)) {
        // Multiple languages - return Record<Locale, Translations>
        const result: Record<Locale, Translations> = {};
        to.forEach((locale) => {
          result[locale] = translateObject(input, locale);
        });
        return result;
      } else {
        // Single language - return Translations
        return translateObject(input, to);
      }
    }

    throw new Error(
      'Unsupported input type for translation. Got: ' +
        input +
        '. For available input types see the translation package'
    );
  }
}
