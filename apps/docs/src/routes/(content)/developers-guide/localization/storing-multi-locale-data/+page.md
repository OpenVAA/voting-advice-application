# Multi-locale data

Data in the database is stored with all its translations. Most components, and the `@openvaa/data` model, work with single-locale data, so the translations are picked when the data is read.

## Storage

A translatable column, such as the `name` of an election, is a `jsonb` column holding an object keyed by locale:

```json
{ "en": "Municipal elections", "fi": "Kuntavaalit", "sv": "Kommunalval" }
```

The frontend's type for such a value is `LocalizedString` from [`@openvaa/app-shared`](https://github.com/OpenVAA/voting-advice-application/blob/main/packages/app-shared/src/data/localized.type.ts). The types prefixed with `Localized` in the same file are the multi-locale versions of other data types, such as `LocalizedAnswer` or `LocalizedQuestionArguments`.

## Reading

The data adapters pick the translation. The Supabase data provider reads the localized columns and resolves each one with `getLocalized` from `@openvaa/app-shared`, in the adapter's `locale`. `getLocalized` falls back in this order:

1. the requested locale;
2. the default locale, `en` unless the adapter is given another `defaultLocale`;
3. the first key that holds a string;
4. `null`.

The root `routes/+layout.ts` builds its data provider with the current locale, so the voter-facing data arrives in the language of the page. See [Data API and adapters](/developers-guide/frontend/data-api-and-adapters).

The database has a matching SQL function, `get_localized`, with the same fallback order. Only the email helpers use it; API responses return all locales and the frontend picks one.

## Editing

The Candidate App works with multi-locale data directly. The data writer's methods that write translations keep the raw locale objects instead of localizing them, and the `Input` component's multilingual text fields show one field per supported locale.

In components, `translate` from the contexts picks a translation from a `LocalizedString` that has not been localized yet. It uses the current locale by default, falls back to a soft match, then to the default locale and then to the first translation, and it ignores empty translations.

## The `@openvaa/data` utilities

The `@openvaa/data` package has its own representation for localized values, `LocalizedValue`, and a [`translate`](https://github.com/OpenVAA/voting-advice-application/blob/main/packages/data/src/i18n/translate.ts) utility that turns data containing such values into single-locale data. The frontend does not use them; its adapters localize with `getLocalized`.
