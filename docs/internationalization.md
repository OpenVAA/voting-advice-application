# Localization

Localization uses:

- [`sveltekit-i18n`](https://github.com/sveltekit-i18n/lib)
- [`@sveltekit-i18n/parser-icu`](https://github.com/sveltekit-i18n/parsers/tree/master/parser-icu) which enables the [ICU message format](https://formatjs.io/docs/intl-messageformat/)

> When updating to Svelte 5, its built-in localization features can probably be used instead.

In short:

- The locale is set exclusively by an optional `lang` route parameter at the start of the route.
- In the frontend, all translations are accessed with the same `$t('foo.bar')` function regardless of source.
- Localization uses soft locale matching whenever possible, i.e. `en-UK` matches both `en` and `en-US` if an exact match is not available.

## Localization in the frontend

All localized strings are fetched using the same `$t('foo.bar', {numBar: 5})` provided by the [`I18nContext`](../frontend/src/lib/contexts/i18n/i18nContext.type.ts) and, for convenience, all other contexts including it, such as the [`ComponentContext`](../frontend/src/lib/contexts/component/componentContext.type.ts). This is agnostic to both:

1. Whether the translations are local (i.e. from `json` files) or fetched from the database. Local fallbacks are overwritten by those from the database.
2. Whether SSR or CSR rendering is used.

> Never import any stores directly from `$lib/i18n`. Use the imports provided by the contexts instead. You can safely use the utilities in [`$lib/i18n/utils`](../frontend/src/lib/i18n/utils), however.

### Value interpolation

For value interpolation in already translated strings, such as those contained in database objects, the same [ICU message format](https://formatjs.io/docs/intl-messageformat/) value interpolation is provided with a `parse('Foo is {value}', {value: 'bar'})` function also provided by `$lib/i18n`.

Some commonly used values are automatically provided for interpolation. See [`updateDefaultPayload`](../frontend/src/lib/i18n/init.ts).

> If any interpolated values are missing, the string will not be translated and its key will be displayed.

### Localized default values in components

When providing localized default values to component properties, be sure to assign these reactively or they won't be updated when the locale is changed, i.e.

```tsx
// This will NOT update
export let label = $t('someLabel');
// On the page
<label>{label}</label>;

// This will update
export let label = undefined;
// On the page
<label>{label ?? $t('someLabel')}</label>;
```

### Localized texts included in dynamically loaded data

Specific care must be taken with any localized content loaded dynamically so that language changes are propagated everywhere where the data is used.

The data loaded by the Data API (settings, app customization and anything contained in the [`dataRoot`](../frontend/src/lib/contexts/data/dataContext.type.ts) store or its descendants) is always returned already translated. Therefore, if any such data is used in the frontend, it should be reactive.

This is usually automatically the case, because the contexts hold such data in stores, but when reading store values make sure not to use outdated local copies.

## Localization in Strapi

Strapi's built-in i18n plugin is not used because it creates objects with different ids for each locale. Thus, a proprietary `json`-based format is used for translated strings instead of regular text fields. (This format is defined in [`global.d.ts`](../frontend/src/lib/types/global.d.ts) as `LocalizedString`.) The example below also demonstrates the use of [ICU message format](https://formatjs.io/docs/intl-messageformat/) value interpolation.

```json
{
  "en": "You have {testValue, plural, =0 {no photos.} =1 {one photo.} other {# photos.}}",
  "fi": "Sinulla {testValue, plural, =0 {ei ole valokuvia.} =1 {on yksi valokuva.} other {on # valokuvaa.}}",
  "es-CO": "Tienes {testValue, plural, =0 {no photos.} =1 {un photo.} other {# photos.}}"
}
```

The methods offered by [`DataProvider`](../frontend/src/lib/api/base/dataProvider.type.ts) handle the translations based on an optional `locale` parameter accepted by all of them. This defaults to the current locale. The functions pick the requested language (or the best match) from the `json` fields and return them as regular `string`s.

## Local translations

Local translations are stored in `$lib/i18n/translations` and organized by language and key. The logic by which they're separated into different files is not absolutely rigid, but the following principles should be followed:

1. Create a new file for each Voter App page or [dynamic component](./frontend/components.md#dynamic-and-static-components), named `<pageOrComponentName>.json`.
2. Create a new file for each Candidate App page, named `candidateApp.<pageName>.json`.
3. For translations needed by [static components](./frontend/components.md#dynamic-and-static-components), create a new subkey in the `components.json` file.

Whenever adding translations, be sure to create them for all supported languages.

### The [`TranslationKey`](../frontend/src/lib/types/generated/translationKey.ts) type

The available translation keys are defined by the [`TranslationKey`](../frontend/src/lib/types/generated/translationKey.ts) type. These can be automatically generated by running `yarn workspace @openvaa/frontend generate:translation-key-type`.

If you need to use a dynamically constructed translation key that is not recognized by the linter, use the [assertTranslationKey](../frontend/src/lib/i18n/utils/assertTranslationKey.ts) utility.

When committing any changes the `pre-commit` hook will check that the type matches the translations.

## Locale routes

All routes start with an optional `locale` route parameter. The parameter matches any supported locale defined in the [`StaticSettings`](../packages/app-shared/src/settings/staticSettings.ts) and their soft matches (using [`$lib/i18n/utils/matchLocale`](../frontend/src/lib/i18n/utils/matchLocale.ts)). Thus, if `en`, `fi` and `es-CO` are supported and `en` is marked as `isDefault`, routes behave as follows:

- `/foo` redirects to the default English version unless the user has a supported locale listed in `Request.accept-language`, in which case the user is redirected to `/fi/foo` (if `fi` is preferred)
- `/en/foo` shows the English version
- `/es-CO/foo` shows the Spanish version
- `/fi/foo` shows the Finnish version
- `/en-UK/foo` redirects to `/en/foo`, `/es/foo` to `/es-CO/foo` and so on for all soft locale matches

Switching between locales happens by only changing the language parameter in the route.

### The `getRoute` helper

To facilitate locale switching, a `getRoute` helper function is provided as a store by the [`I18nContext`](../frontend/src/lib/contexts/i18n/i18nContext.type.ts). It is passed a `Route` name, possible parameters and optionally a `locale` from which it constructs the proper url to go to. It can also be used to just switch the locale of the current page, by calling `$getRoute({locale: 'foo'})`.

## Locale selection step-by-step

The locale selection process works as follows.

[`$lib/i18n`](init.ts) is initialized:

1. Supported `locales` and the `defautlLocale` are loaded from [`StaticSettings`](../packages/app-shared/src/settings/staticSettings.ts)

[`hooks.server.ts: handle`](../frontend/src/hooks.server.ts) parses the route and `Request.accept-language`:

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

[`+layout.ts`](../frontend/src/routes/[[lang=locale]]/+layout.ts) loads translations from the local source and the database:

1. Load `DataProvider.getAppCustomization(•).translationOverrides` as dynamic translations for use with `i18n`.
2. Load local translations with `$lib/i18n: loadTranslations`
3. Add the `translationOverrides` by `$lib/i18n: addTranslations`
4. Set the locale to `params.lang`
5. Call `$lib/i18n: setRoute('')` which is required for the translations to be available.

## Supported locales

Supported locales are defined app-wide in [`StaticSettings`](../packages/app-shared/src/settings/staticSettings.ts).
