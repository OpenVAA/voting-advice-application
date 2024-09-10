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

### Value interpolation

Note that if any interpolated values are missing, the string will not be translated and its name will be displayed.

For value interpolation in already translated strings, such as those contained in database objects, the same [ICU message format](https://formatjs.io/docs/intl-messageformat/) value interpolation is provided with a `parse('Foo is {value}', {value: 'bar'})` function also provided by `$lib/i18n`.

### Localized default values in components

When providing localized default values to component properties, be sure to assign these reactively or they won't be updated when the locale is changed, i.e.

```tsx
// This will NOT update
export let label = $t('someLabel');
// On the page
<label>{label}</label>

// This will update
export let label = undefined;
// On the page
<label>{label ?? $t('someLabel')}</label>
```

### Localized texts included in `export let data`

Specific care must be taken with any localized content loaded on the server so that language changes are propagated everywhere where the data is used.

1. The `load` functions must depend either on the `i18n.currentLocale` of the outermost server `load` function or the `lang` route parameter. To accomplish the first, use `await parent()`:

```ts
// +layout.server.ts
export const load = (async ({parent}) => {
  const locale = (await parent()).i18n.currentLocale;
  return {
    questions: await getOpinionQuestions({locale})
  };
}) satisfies LayoutServerLoad;
```

1. The Svelte pages and components using `data` are not automatically rerendered. To ensure this, either make updates reactive or use the `page` store instead of `export let data`, i.e.:

```tsx
// +page.svelte

// Option 1: Using export let data
export let data: PageServerData;
let candidates: CandidateProps[];
$: candidates = data.candidates;
// On the page
{#each candidates as candidate}
  // Render
{/each}

// Option 2: Using the page store
import {page} from '$app/stores';
// On the page
{#each $page.data.candidates as candidate}
  // Render
{/each}
```

## Localization in Strapi

Strapi's built-in i18n plugin is not used because it creates objects with different ids for each locale. Thus,a proprietary `json`-based format is used for translated strings instead of regular text fields. (This format is defined in [`global.d.ts`](../frontend/src/lib/types/global.d.ts) as `LocalizedString`.) The example below also demonstrates the use of [ICU message format](https://formatjs.io/docs/intl-messageformat/) value interpolation.

```json
{
  "en": "You have {testValue, plural, =0 {no photos.} =1 {one photo.} other {# photos.}}",
  "fi": "Sinulla {testValue, plural, =0 {ei ole valokuvia.} =1 {on yksi valokuva.} other {on # valokuvaa.}}",
  "es-CO": "Tienes {testValue, plural, =0 {no photos.} =1 {un photo.} other {# photos.}}"
}
```

The methods offered by [`DataProvider`](../frontend/src/lib/api/dataProvider.ts) handle the translations based on an optional `locale` parameter accepted by all of them. This defaults to the current locale. The functions pick the requested language (or the best match) from the `json` fields and return them as strings

## Local translations

Local translations are stored in `$lib/i18n/translations` and organized by language and key.

## Locale routes

All routes start with an optional `locale` route parameter. The parameter matches any supported locale defined in the [`$lib/config/settings.json`](../frontend/lib/config/settings.json) and their soft matches (using `$lib/i18n/utils/matchLocale`). Thus, if `en`, `fi` and `es-CO` are supported and `en` is marked as `isDefault`, routes behave as follows:

- `/foo` redirects to the default English version unless the user has a supported locale listed in `Request.accept-language`, in which case the user is redirected to `/fi/foo` (if `fi` is preferred)
- `/en/foo` shows the English version
- `/es-CO/foo` shows the Spanish version
- `/fi/foo` shows the Finnish version
- `/en-UK/foo` redirects to `/en/foo`, `/es/foo` to `/es-CO/foo` and so on for all soft locale matches

Switching between locales happens by only changing the language parameter in the route.

### The `getRoute` helper

To facilitate locale switching, a `getRoute` helper function is provided as a store in [`$lib/utils/navigation`](../utils/navigation.ts). It is passed a `Route` enum value, a possible `id` and optionally a `locale` from which it constructs the proper url to go to. It can also be used to just switch the locale of the current page, by calling `$getRoute({locale: 'foo'})`. Note that the function is contained in a store, because it depends on changes to the `page` store and needs thus to be reactively updated.

When sharing links, it's best to use the route without the locale param, i.e. with `locale: 'none'`.

## Locale selection step-by-step

The locale selection process works as follows.

[`$lib/i18n`](init.ts) is initialized:

1. Supported `locales` and the `defautlLocale` are loaded from [`$lib/config/settings.json`](..frontend/lib/config/settings.json)

[`hooks.server.ts: handle`](../frontend/src/hooks.server.ts) parses the route and `Request.accept-language`:

1. Supported `locales` are loaded from `$lib/i18n`
2. The locales listed in `Request.accept-language` are iterated and the first one found (using a soft match) in `locales` is saved as `preferredLocale`
3. We check if there is a `lang` route parameter and it is included in `locales`
4. Depending on these, one of the following happens:

| `lang` route param | `preferredLocale`  |  Action                                                                                          |
| ------------------ | ------------------ | ------------------------------------------------------------------------------------------------ |
| not defined        | not supported      | Redirect to `/${defautlLocale}/${route}`                                                                             |
| not defined        | supported | Redirect to `/${preferredLocale}/${route}`                                                                            |
| soft match | N/A | Redirect to `/${supportedLocale}/${route}` where `supportedLocale` is the soft-matched locale, e.g. `'en'` for `lang = 'en-UK'` |
| supported  | N/A | Serve content in `lang` (and show notification in the front end if `preferredLocale` is supported and `!= lang`) |

1. Both `preferredLocale` and `currentLocale` (in which the content is served) are passed further in `locals`

[`+layout.server.ts`](../frontend/src/routes/[[lang=locale]]/+layout.server.ts) loads translations from the local source and the database:

1. Receive `currentLocale` and `route` from `locals` and `params.lang`:
2. Set the locale to `params.lang ?? currentLocale`. (In theory, we could just use `currentLocale` but we must explicitly use `params.lang` to rerun `load` on param changes.)
3. Load all the globally needed data from Strapi using the correct `locale` parameter
4. Load local translations with `$lib/i18n.loadTranslations`
5. Pass `currentLocale`, `preferredLocale` and `route` in `data.i18n`

[`+layout.ts`](../../routes/[[lang=locale]]/+layout.ts) runs twice and sets translations up for SSR and CSR:

1. Receive `currentLocale` and `route`from `data.i18n`.
2. Add `DataProvider.getAppCustomization(•).translationOverrides` as dynamic translations for use with `i18n`.
3. Set current locale to `currentLocale`
4. Set the translations route to `setRoute` (which is used for separating translations into multiple files based on the route, but must be called even if no such are used)

In the frontend `svelte` files:

1. Translations are accessed using `$lib/i18n: $t('foo.bar')`
2. For value interpolation in already translated strings, such as those contained in database objects, the same [ICU message format](https://formatjs.io/docs/intl-messageformat/) value interpolation is provided with a `$lib/i18n: parse('Foo is {value}', {value: 'bar'})`.
3. The locale can be changed using `$lib/utils/navigation: $getRoute({locale: 'foo'})`
4. The `$data.i18n.preferredLocale` can be matched against `$lib/i18n: locale` to show a notification to the user if their preferred locale is available

## Supported locales

Ssupported locales are defined locally in [`$lib/config/settings.json`](..frontend/lib/config/settings.json).