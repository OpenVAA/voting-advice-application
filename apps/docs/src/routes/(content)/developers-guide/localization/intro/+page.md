# Localization

Localization uses:

- [`sveltekit-i18n`](https://github.com/sveltekit-i18n/lib)
- [`@sveltekit-i18n/parser-icu`](https://github.com/sveltekit-i18n/parsers/tree/master/parser-icu) which enables the [ICU message format](https://formatjs.io/docs/intl-messageformat/)

> When updating to Svelte 5, its built-in localization features can probably be used instead.

In short:

- The locale is set exclusively by an optional `lang` route parameter at the start of the route.
- In the frontend, all translations are accessed with the same `$t('foo.bar')` function regardless of source.
- Localization uses soft locale matching whenever possible, i.e. `en-UK` matches both `en` and `en-US` if an exact match is not available.
