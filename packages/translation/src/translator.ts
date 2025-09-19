// packages/translation/src/translator.ts
import type { LocalizedString } from '@openvaa/app-shared';
import type { TranslationProvider } from '../src/providers/translation-provider';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type JsonObject = { [key: string]: any };

/**
 * A unified service for handling all translation tasks.
 */
export class Translator {
  private provider: TranslationProvider;

  constructor(provider: TranslationProvider) {
    this.provider = provider;
  }

  /**
   * For Database Content.
   * Takes a multi-language LocalizedString object, finds a source language from
   * the existing text, and populates any missing target languages.
   *
   * @example
   * translator.fill({
   *   localizedString: { en: 'Hello' },
   *   targetLanguages: ['en', 'fi', 'sv']
   * });
   * // Returns: { en: 'Hello', fi: 'Hei', sv: 'Hej' }
   */
  async fillLocalizedString(options: {
    localizedString: LocalizedString;
    targetLanguages: Array<string>;
  }): Promise<LocalizedString> {
    const { localizedString, targetLanguages } = options;

    const missingLangs = targetLanguages.filter((lang) => !localizedString[lang]);
    if (missingLangs.length === 0) return localizedString;

    const sourceEntry = Object.entries(localizedString).find(([, text]) => text);
    if (!sourceEntry) return localizedString;

    const [sourceLanguage, sourceText] = sourceEntry;

    const newTranslations = await this.provider.translateBatch({
      text: sourceText,
      targetLanguages: missingLangs,
      sourceLanguage: sourceLanguage
    });

    return { ...localizedString, ...newTranslations };
  }

  /**
   * For UI Translation Files.
   * Translates all string values within a given JSON object to a new language,
   * preserving the nested structure.
   *
   * @example
   * translator.translateJson({
   *   json: { title: 'Hello', button: 'Submit' },
   *   targetLanguage: 'fi',
   *   sourceLanguage: 'en'
   * });
   * // Returns: { title: 'Hei', button: 'Lähetä' }
   */
  async translateJson(options: {
    json: JsonObject;
    targetLanguage: string;
    sourceLanguage: string;
  }): Promise<JsonObject> {
    const { json, targetLanguage, sourceLanguage } = options;
    const originalJson = JSON.parse(JSON.stringify(json)); // Deep copy

    const stringsToTranslate: Array<string> = [];
    function findStrings(obj: JsonObject) {
      Object.values(obj).forEach((value) => {
        if (typeof value === 'string') {
          stringsToTranslate.push(value);
        } else if (typeof value === 'object' && value !== null) {
          findStrings(value);
        }
      });
    }
    findStrings(originalJson);

    if (stringsToTranslate.length === 0) return originalJson;

    const { translatedTexts } = await this.provider.translateTexts({
      texts: stringsToTranslate,
      targetLanguage,
      sourceLanguage
    });

    let i = 0;
    function replaceStrings(obj: JsonObject) {
      for (const key in obj) {
        if (typeof obj[key] === 'string') {
          obj[key] = translatedTexts[i++];
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          replaceStrings(obj[key]);
        }
      }
    }
    replaceStrings(originalJson);

    return originalJson;
  }
}
