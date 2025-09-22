import type { LocalizedString } from '@openvaa/app-shared';

export type TranslationContext = {
  /**
   * Stylistic tips or other guidance.
   */
  instructions?: string;

  /** Optional context info to use for better translations. Can be election info, term definitions and/or a glossary.
   * 
   */
  contextualInfo?: string;
};

// We want to be able to:
// (1) Translate a single string value to one string value. 
// (1.1) Translate a single string value to multiple string values (different target languages)
// (2) Translate an array of string values to one language. 
// (2.1) Translate an array of string values to multiple languages. 
// (3) Translate a localized string onto a single language.
// (3.1) Translate a localized string onto multiple languages.)
// (4) Translate localized strings onto a single language.
// (4.1) Translate localized strings onto multiple languages.
// (5) Translate one JSON object onto a single language.
// (5.1) Translate one JSON object onto multiple languages.
// (6) Translate multiple JSON objects onto a single language
// (6.1.) Translate multiple JSON object on multiple languages.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type JsonObject = { [key: string]: any };

type TranslateArgsBase = {
  from?: string;
  context?: TranslationContext;
}

// Define the overload parameter export types
export type TranslateStringSingle = {
  input: string;
  to: string;
} & TranslateArgsBase;

export type TranslateStringMultiple = {
  input: string;
  to: Array<string>;
} & TranslateArgsBase;

export type TranslateStringArraySingle = {
  input: Array<string>;
  to: string;
} & TranslateArgsBase;

export type TranslateStringArrayMultiple = {
  input: Array<string>;
  to: Array<string>;
} & TranslateArgsBase;

export type TranslateLocalizedStringSingle = {
  input: LocalizedString;
  to: string;
} & TranslateArgsBase;

export type TranslateLocalizedStringMultiple = {
  input: LocalizedString;
  to: Array<string>;
} & TranslateArgsBase;

export type TranslateLocalizedStringArraySingle = {
  input: Array<LocalizedString>;
  to: string;
} & TranslateArgsBase;

export type TranslateLocalizedStringArrayMultiple = {
  input: Array<LocalizedString>;
  to: Array<string>;
} & TranslateArgsBase;

export type TranslateJsonSingle = {
  input: JsonObject;
  to: string;
} & TranslateArgsBase;

export type TranslateJsonMultiple = {
  input: JsonObject;
  to: Array<string>;
} & TranslateArgsBase;

export type TranslateJsonArraySingle = {
  input: Array<JsonObject>;
  to: string;
} & TranslateArgsBase;

export type TranslateJsonArrayMultiple = {
  input: Array<JsonObject>;
  to: Array<string>;
} & TranslateArgsBase;

// Union export type for all possible parameter combinations
export type TranslateArgs =
  | TranslateStringSingle
  | TranslateStringMultiple
  | TranslateStringArraySingle
  | TranslateStringArrayMultiple
  | TranslateLocalizedStringSingle
  | TranslateLocalizedStringMultiple
  | TranslateLocalizedStringArraySingle
  | TranslateLocalizedStringArrayMultiple
  | TranslateJsonSingle
  | TranslateJsonMultiple
  | TranslateJsonArraySingle
  | TranslateJsonArrayMultiple;

// Union export type for all possible return export types
export type TranslateResult =
  | string
  | Record<string, string>
  | Array<string>
  | Record<string, Array<string>>
  | LocalizedString
  | Array<LocalizedString>
  | JsonObject
  | Record<string, JsonObject>
  | Array<JsonObject>
  | Record<string, Array<JsonObject>>;
