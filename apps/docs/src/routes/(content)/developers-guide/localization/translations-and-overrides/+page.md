# Translations and overrides

Every message the app shows comes through `t()` in [`$lib/i18n`](https://github.com/OpenVAA/voting-advice-application/tree/main/apps/frontend/src/lib/i18n). It looks a key up in two places, in this order:

1. **Runtime overrides** for the current locale, loaded from the deployment's app customization.
2. **The compiled message** from the Paraglide catalogue.

If neither has the key, `t()` returns the key itself, so a missing message shows up as a raw key such as `questions.intro.start`.

## Message files

The catalogue is in `apps/frontend/messages/<locale>/`, one JSON file per namespace. Each file holds a single top-level key equal to its file name without `.json`, so `questions.json` starts with a `questions` key and its messages have keys like `questions.intro.start`. Every file must also be listed in `plugin.inlang.messageFormat.pathPattern` in `apps/frontend/project.inlang/settings.json`, or Paraglide does not compile it.

The files are organised as follows:

- One file for each Voter App page or [dynamic component](/developers-guide/frontend/components), named `<pageOrComponentName>.json`.
- One file for each Candidate App page, named `candidateApp.<pageName>.json`. The Admin App's files are prefixed `adminApp.` in the same way.
- `components.json` for the base components, with a subkey per component.
- `common.json` for terms used across the app.
- `dynamic.json` for the defaults of the texts a deployment usually overrides, such as the app name.
- `lang.json` for the display names of the locales.

Whenever you add or change a message, do it in every locale.

### Message format

Messages use the [inlang message format](https://inlang.com/m/reootnfj/plugin-inlang-messageFormat): plain strings, variables such as `{numQuestions}`, and, for plurals and other variants, an object with `declarations`, `selectors` and `match` instead of ICU inline syntax. A variable is an input the calling code passes, so its name is the same in every locale. The [`messages` README](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/messages/README.md) has the full rules for translators.

## Using messages

Read `t` from a context and call it with a key and, optionally, the values to interpolate:

```ts
const { t } = getAppContext();
t('results.candidate.numShown', { numShown: 5 });
```

`t` accepts only members of the generated `TranslationKey` union, so a misspelt key is a type error. For a key built at run time, such as `` `lang.${loc}` ``, wrap it in `assertTranslationKey` from `$lib/i18n/utils/assertTranslationKey`. It only widens the type; a wrong key still renders as the raw key.

The locale does not change while a page is shown, because switching it reloads the page (see [Locale resolution](/developers-guide/localization/locale-resolution)). A value computed with `t()` when a component is initialised therefore stays correct. Data read through the Data API is already in the current locale.

## Keeping the catalogues consistent

- **The `TranslationKey` type** in `src/lib/types/generated/translationKey.ts` is generated from the base-locale messages. Run `yarn workspace @openvaa/frontend generate:translation-key-type` after you add, rename or remove a key.
- **The translation tests** in `src/lib/i18n/tests/translations.test.ts` run with `yarn workspace @openvaa/frontend test:unit`. They fail when the committed `TranslationKey` type is stale, when a locale lacks a file or a key that the base locale has, when a file is not wrapped in its namespace key, when `lang.json` lacks a display name, or when a plural uses ICU inline syntax.
- **`yarn assert:i18n-catalog-namespaces`**, part of `yarn lint:check`, fails when the `candidateApp`, `adminApp` or voter and shared namespaces of the base-locale catalogue lose most of their keys.

The [`editTranslations`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/tools/editTranslations/editTranslations.ts) tool can export, import and replace translation keys in bulk.

## Runtime overrides

A deployment can change any message without a rebuild:

1. The overrides are stored in `translationOverrides` in the project's app customization, the `customization` column of `app_settings`. Each value is a localized string keyed by locale, stored like other [multi-locale data](/developers-guide/localization/storing-multi-locale-data), for example `{ "common.next": { "en": "Onwards", "fi": "Eteenpäin" } }`.
2. The data provider's `getAppCustomization` reads them and picks each value in the request's locale.
3. The root `routes/+layout.ts` loads the app customization first and passes the overrides to `setOverrides` for the current locale.
4. `t()` asks `getOverride` before it looks at the compiled messages. An override is an ICU message: when `t()` is given values, the override is formatted with `intl-messageformat`.

The defaults of the texts that deployments usually override are in `dynamic.json`, but an override can replace any key. See [App customization](/developers-guide/configuration/app-customization) for how the customization is stored and edited.
