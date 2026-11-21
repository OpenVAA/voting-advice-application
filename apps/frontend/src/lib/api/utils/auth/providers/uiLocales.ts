/**
 * The value of an authorization request's `ui_locales` parameter (OpenID Connect Core 1.0, section 3.1.2.1) for the application's locale.
 *
 * Only the locale's language subtag is sent: the providers take two-letter ISO 639-1 codes, and the application's locales are such codes already. A value whose first subtag is no language code sends nothing, so nothing but a code of letters ever reaches the provider's URL or request object.
 *
 * @param locale - The application's locale, e.g. `fi` or `sv-FI`.
 * @returns The lower-cased language subtag, or `undefined` when no locale is given or its first subtag is not two or three letters.
 */
export function uiLocalesFor(locale: string | undefined): string | undefined {
  const language = locale?.split('-')[0].toLowerCase();
  return language && /^[a-z]{2,3}$/.test(language) ? language : undefined;
}
