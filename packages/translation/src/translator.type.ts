import type { LocalizedString } from '@openvaa/app-shared';

/** Instructions and relevant information for better-aligned translations. */
export type TranslationContext = {
  /** Stylistic tips or other guidance. */
  instructions?: string;
  /** Optional context info to use for better translations. Can be election info, term definitions and/or a glossary. */
  context?: string;
};

/** Language code, e.g. "en", "en-US", "fr", "de". */
export type Locale = string;

/** JSON object with translations. */
export type Translations = {
  [key: string]: Translations | string;
};

/** Arguments for the `translate` method. */
export type TranslateArgs<
  TInput extends string | Array<string> | LocalizedString | Array<LocalizedString> | Translations = string,
  TMultiLocale extends boolean = false
> = {
  from: string;
  to: TMultiLocale extends true ? Array<Locale> : Locale;
  input: TInput;
  context?: TranslationContext;
};
