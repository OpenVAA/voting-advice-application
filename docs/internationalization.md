# Localization

Localization uses:

- [`sveltekit-i18n`](https://github.com/sveltekit-i18n/lib)
- [`@sveltekit-i18n/parser-icu`](https://github.com/sveltekit-i18n/parsers/tree/master/parser-icu) which enables the [ICU message format](https://formatjs.io/docs/intl-messageformat/)

The locale is set exclusively by an optional `lang` route parameter at the start of the route.

In the frontend, all translations are accessed with the same `$t('foo.bar')` function regardless of source.

Localization uses soft locale matching whenever possible, i.e. `en-UK` matches both `en` and `en-US` if an exact match is not available.

## Localization in the frontend

All localized strings are fetched using the same `$t('foo.bar', {numBar: 5})` function provided by `$lib/i18n`. This is agnostic to both:

1. Whether the translations are local (i.e. from `json` files) or fetched from the database. Local fallbacks are overwritten by those from the database.
2. Whether SSR or CSR rendering is used.

For value interpolation in already translated strings, such as those contained in database objects, the same [ICU message format](https://formatjs.io/docs/intl-messageformat/) value interpolation is provided with a `parse('Foo is {value}', {value: 'bar'})` function also provided by `$lib/i18n`.

## Localization in Strapi

Strapi's built-in i18n plugin is only used to translate `AppLabels`. For all other translations, a proprietary `json`-based format is used instead of regular text fields. (This format is defined in [`global.d.ts`](../frontend/src/lib/types/global.d.ts) as `LocalizedString`.) The example below also demonstrates the use of [ICU message format](https://formatjs.io/docs/intl-messageformat/) value interpolation.

```json
{
  "en": "You have {testValue, plural, =0 {no photos.} =1 {one photo.} other {# photos.}}",
  "fi": "Sinulla {testValue, plural, =0 {ei ole valokuvia.} =1 {on yksi valokuva.} other {on # valokuvaa.}}",
  "es-CO": "Tienes {testValue, plural, =0 {no photos.} =1 {un photo.} other {# photos.}}"
}
```

The functions in [`getData`](../frontend/src/lib/api/getData.ts) handle the translations based on an optional `locale` parameter accepted by all of them. This defaults to the current locale. The functions either:

1. Use Strapi's built-in i18n plugin (only for `AppLabels`)
2. Pick the requested language (or the best match) from the `json` fields and return them as strings

## Local translations

Local translations are stored in `$lib/i18n/translations` and organized by language and key. The same 'paths' are used to access both local translations and those fetched from the database with the database ones overriding local ones.

## Locale routes

All routes start with an optional `locale` route parameter. The parameter matches any valid locale code (validated using `Intl.getCanonicalLocales`). Thus, if `en`, `fi` and `es-CO` are supported and `en` is marked as `isDefault`, routes behave as follows:

- `/foo` shows the default English version unless the user has a supported locale listed in `Request.accept-language`, in which case the user is redirected to `/fi/foo` (if `fi` is preferred)
- `/en/foo` redirects to `/foo` because it's the default, but only if `Request.accept-language`:
  1. is not defined
  2. is not included in supported locales, or
  3. is `en`, i.e. is the default language from `settings.json`.
  - Otherwise, `/en/foo` is not redirected and shows the English version
- `/es-CO/foo` shows the Spanish version
- `/fi/foo` shows the Finnish version

Switching between locales happens by only changing the language parameter in the route.

### The `getRoute` helper

To facilitate locale switching, a `getRoute` helper function is provided in [`$lib/utils/navigation`](../utils/navigation.ts). It is passed a `Route` enum value, a possible `id` and optionally a `locale` from which it constructs the proper url to go to. It can also be used to just switch the locale of the current page, by calling `getRoute({locale: 'foo'})`.

## Locale selection step-by-step

The locale selection process works as follows.

[`$lib/i18n`](init.ts) is initialized:

1. Supported `locales` and the `defautlLocale` are loaded from `$lib/i18n/settings.json`

[`hooks.server.ts: handle`](../frontend/src/hooks.server.ts) parses the route and `Request.accept-language`:

1. Supported `locales` are loaded from `$lib/i18n`
2. The locales listed in `Request.accept-language` are iterated and the first one found (using a soft match) in `locales` is saved as `preferredLocale`
3. We check if there is a `lang` route parameter and it is included in `locales`
4. Depending on these, one of the following happens:

| `lang` route param | `preferredLocale`  | `defautlLocale`      | Action                                                                                           |
| ------------------ | ------------------ | -------------------- | ------------------------------------------------------------------------------------------------ |
| not defined        | not supported      | any                  | Serve `defautlLocale`                                                                            |
| not defined        | `== defautlLocale` | `== preferredLocale` | Serve `defautlLocale`                                                                            |
| not defined        | `!= defautlLocale` | `!= preferredLocale` | Redirect to `/${preferredLocale}/${route}`                                                       |
| `== defautlLocale` | `== defautlLocale` | `== preferredLocale` | Redirect to `/${route}` (no lang param)                                                          |
| `== defautlLocale` | `!= defautlLocale` | `!= preferredLocale` | Serve `defautlLocale` (and show notification in the front end if `preferredLocale` is supported) |
| `!= defautlLocale` | any                | `!= defautlLocale`   | Serve `lang`                                                                                     |

5. Both `preferredLocale` and `currentLocale` are passed further in `locals`

[`+layout.server.ts`](../frontend/src/routes/[[lang=locale]]/+layout.server.ts) loads translations from the local source and the database:

1. Receive `currentLocale` from `locals`:
2. Set the locale to `currentLocale`.
3. ~~Check whether `getData.getSupportedLocales` matches `$lib/i18n: locales` and throws if not~~ (This is currently not implemented due to CSR issues.)
4. Load all the globally needed data from Strapi using `currentLocale` as the `locale` parameter
   1. `getElection` uses Strapi's own `i18n` plugin to localize `appLabels` contained in the `Election` object
5. Load local translations for `currentLocale` with `$lib/i18n.loadTranslations`
6. Parse the `route` without locale information and pass this along with `currentLocale`, `preferredLocale` and `translations` in `data.i18n`

[`+layout.ts`](../frontend/src/routes/[[lang=locale]]/+layout.ts) runs twice and sets translations up for SSR and CSR:

1. Receive `currentLocale`, `route` and `translations` from `data.i18n` as well as the `appLabels`
2. Add the received `translations` and the `appLabels` for use with `i18n`
3. Set current locale to `currentLocale`
4. Set the translations route to `setRoute` (which is used for separating translations into multiple files based on the route, but must be called even if no such are used)

In the frontend `svelte` files:

1. Translations are accessed using `$lib/i18n: $t('foo.bar')`
2. For value interpolation in already translated strings, such as those contained in database objects, the same [ICU message format](https://formatjs.io/docs/intl-messageformat/) value interpolation is provided with a `$lib/i18n: parse('Foo is {value}', {value: 'bar'})`.
3. The locale can be changed using `$lib/utils/navigation: getRoute({locale: 'foo'})`
4. The `$data.i18n.preferredLocale` can be matched against `$lib/i18n: locale` to show a notification to the user if their preferred locale is available

## For future consideration: Fetching supported locales from the database

Currently, the supported locales are defined locally in [`settings.json`](./settings.json). This is redundant because we could also get the from Strapi. However, due to `getData` being only available on the server side, we run into complications with this. Below, is a solution that does that, but it involves passing more data via the `$page` store and does not seem worth the added complexity.

```ts
// $lib/i18n/init.ts

// NB. This becomes very complicated due to getData being only available
// on the server side. This can be simplified by either creating a public
// api for locales or by just saving the supported locales on a local
// config file and not using api/i18n/locales at all.
// Now we also need export defaultLocale and localeMatches and pass those
// into page.data in /+layout.server.ts.

if (!browser) {
  // SSR: We may use the getData api
  try {
    await import('$lib/api/getData').then((getData) => {
      if (!getData.supportedLocales.length) throw new Error('No supported locales found');
      dbLocales = getData.supportedLocales.map((l) => l.code);
      dbDefaultLocale = getData.defaultLocale;
    });
  } catch (e) {
    // We'll throw this at the end of initialization so that we have the static
    // translations available for error messages
    dbError = e;
  }
  // If we got locales from the database, build a map of locale matches between
  // database locales and static ones (e.g. 'en-UK' => 'en')
  const staticDefaultLocale = Object.keys(staticTranslations)[0];
  if (dbLocales.length) {
    for (const l of dbLocales)
      localeMatches[l] = matchLocale(l, Object.keys(staticTranslations)) ?? staticDefaultLocale;
  } else {
    // Otherwise just use an identity map
    for (const l in staticTranslations) localeMatches[l] = l;
  }
  defaultLocale = dbDefaultLocale ?? staticDefaultLocale;
} else {
  // CSR: We can't use getData but supported locales are initialized by now
  console.info(get(page));
  const i18nData = get(page).data.i18n;
  defaultLocale = i18nData.defaultLocale;
  localeMatches = i18nData.localeMatches;
}
```
