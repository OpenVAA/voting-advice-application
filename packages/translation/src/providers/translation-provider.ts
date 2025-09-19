// packages/translation/src/providers/translation-provider.ts

export abstract class TranslationProvider {
  abstract readonly name: string;

  /**
   * Translates a single string of text.
   */
  abstract translate(options: {
    text: string;
    targetLanguage: string;
    sourceLanguage?: string;
  }): Promise<{ translatedText: string }>;

  /**
   * Translates a single text into multiple target languages.
   * This is more efficient than calling `translate` multiple times.
   */
  abstract translateBatch(options: {
    text: string;
    targetLanguages: Array<string>;
    sourceLanguage?: string;
  }): Promise<Record<string, string>>; // Returns a map, e.g., { fi: "...", sv: "..." }

  /**
   * Translates an array of different texts into a single target language.
   * Returns the translated texts in the same order.
   */
  abstract translateTexts(options: {
    texts: Array<string>;
    targetLanguage: string;
    sourceLanguage?: string;
  }): Promise<{ translatedTexts: Array<string> }>;

  /**
   * Detects the language of a given text.
   */
  abstract detectLanguage(text: string): Promise<{ languageCode: string }>;
}
