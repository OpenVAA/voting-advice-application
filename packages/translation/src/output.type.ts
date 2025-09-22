import type { JsonObject } from './inputArgs.type';

// For single string to single language
export type SingleStringResponse = {
  translatedText: string;
}

// For single string to multiple languages  
export type MultipleLanguageResponse<TLangs extends Array<string>> = Record<TLangs[number], string>;


// For array of strings to single language
export type MultipleStringsResponse = {
  translatedTexts: Array<string>;
}

// For array of strings to multiple languages
export type MultipleStringsMultipleLanguagesResponse<TLangs extends Array<string>> = Record<TLangs[number], Array<string>>;

// For LocalizedString responses. Add to existing structure, doesn't return the entire LocalizedString.
export type LocalizedStringResponse<TLangs extends Array<string>> = Record<TLangs[number], string>; 

// For JSON object responses
export type JsonResponse<TInput extends JsonObject> = TInput;

// For multiple JSON objects to multiple languages
export type MultipleJsonResponse<TLangs extends Array<string>, TInput extends JsonObject> = Record<TLangs[number], Array<TInput>>; 