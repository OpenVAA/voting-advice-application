# Locale selection step-by-step

The locale selection process works as follows.

[`$lib/i18n`](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/i18n/init.ts) is initialized:

1. Supported `locales` and the `defautlLocale` are loaded from [`StaticSettings`](https://github.com/OpenVAA/voting-advice-application/blob/main/packages/app-shared/src/settings/staticSettings.ts)

[`hooks.server.ts: handle`](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/hooks.server.ts) parses the route and `Request.accept-language`:

1. Supported `locales` are loaded from `$lib/i18n`
2. The locales listed in `Request.accept-language` are iterated and the first one found (using a soft match) in `locales` is saved as `preferredLocale`
3. We check if there is a `lang` route parameter and it is included in `locales`
4. Depending on these, one of the following happens:

| `lang` route param | `preferredLocale` | Action                                                                                                                          |
| ------------------ | ----------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| not defined        | not supported     | Redirect to `/${defautlLocale}/${route}`                                                                                        |
| not defined        | supported         | Redirect to `/${preferredLocale}/${route}`                                                                                      |
| soft match         | N/A               | Redirect to `/${supportedLocale}/${route}` where `supportedLocale` is the soft-matched locale, e.g. `'en'` for `lang = 'en-UK'` |
| supported          | N/A               | Serve content in `lang` (and show notification in the front end if `preferredLocale` is supported and `!= lang`)                |

1. Both `preferredLocale` and `currentLocale` (in which the content is served) are passed further in `locals`.

[`+layout.ts`](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/routes/[[lang=locale]]/+layout.ts) loads translations from the local source and the database:

1. Load `DataProvider.getAppCustomization(•).translationOverrides` as dynamic translations for use with `i18n`.
2. Load local translations with `$lib/i18n: loadTranslations`
3. Add the `translationOverrides` by `$lib/i18n: addTranslations`
4. Set the locale to `params.lang`
5. Call `$lib/i18n: setRoute('')` which is required for the translations to be available.
