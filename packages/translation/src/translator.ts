import type { LocalizedString } from '@openvaa/app-shared';
import type { Locale, TranslateArgs, Translations } from './translator.type';

export abstract class Translator {
  // Single string to single language
  abstract translate(args: TranslateArgs<string>): Promise<string>;

  // Single string to multiple languages
  abstract translate(args: TranslateArgs<string, true>): Promise<LocalizedString>;

  // Array of strings to single language
  abstract translate(args: TranslateArgs<Array<string>>): Promise<Array<string>>;

  // Array of strings to multiple languages
  abstract translate(args: TranslateArgs<Array<string>, true>): Promise<Array<LocalizedString>>;

  // LocalizedString to single language
  abstract translate(args: TranslateArgs<LocalizedString>): Promise<LocalizedString>;

  // LocalizedString to multiple languages
  abstract translate(args: TranslateArgs<LocalizedString, true>): Promise<LocalizedString>;

  // Array of LocalizedStrings to single language
  abstract translate(args: TranslateArgs<Array<LocalizedString>>): Promise<Array<LocalizedString>>;

  // Array of LocalizedStrings to multiple languages
  abstract translate(args: TranslateArgs<Array<LocalizedString>, true>): Promise<Array<LocalizedString>>;

  // JSON object to single language
  abstract translate(args: TranslateArgs<Translations>): Promise<Translations>;

  // JSON object to multiple languages
  abstract translate(args: TranslateArgs<Translations, true>): Promise<Record<Locale, Translations>>;
}
