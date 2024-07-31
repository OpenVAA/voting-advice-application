# Translations

Internationalization is handled by `sveltekit-i18n`. See the [i18n Docs](/docs/internationalization.md) for more information.

Translations are accessed using the `t` store, e.g. `$t('translation.key', {variable: value})`.

## Translation sources

1. Local translation files (see next section)
2. Translations loaded from the backend using `DataProvider`
   - This will override any local translations with same keys (unless empty)
   - By default these include only translations listed in `dynamic.json` but arbitrary ones may also be provided

## Translation files

The translations are contained in the `translations` folder, each locale in its own subfolder.

The files in each locale folder must match as well as the keys in them. They also need to be listed in the `keys` const in [`translations/index.ts`](./translations/index.ts) This is checked during CD/CI.

The files are json files with a nested structure of the type:

```ts
type Translation = {
  [key: string]: Translation | string;
};
```

Translations keys contain the name of the file as the first part, e.g. `error.404` for the key `404` in `error.json` or `candidateApp.basicInfo.disclaimer` for `disclaimer` in `candidateApp.basicInfo.json`.

### File organisation

Translations are spread into files such that:

- `dynamic.json` contains default values for those translations that usually require editing for each instance of the app. These should be overridden by data returned by the `DataProvider`.
- `common.json` contains common terms that are used throughout the app and sometimes as part of other translations.
- `components.json` contains translations used by static components with the translations for grouped by component name.
- One file each for each page and dynamic component. Files for the Candidate App are prefixed like `candidateApp.basicInfo.json` and accessed likewise with a key like `candidateApp.basicInfo.disclaimer`.

## Types

### `TranslationKey`

Contains all the existing translation keys. The type is generated [automatically](/frontend/tools/translationKey/generateTranslationKeyType.ts) and stored in [translationKey.ts](/frontend/src/lib/types/generated/translationKey.ts).

The [`assertTranslationKey()`](./utils/assertTranslationKey.ts) utility can be used to assert the type.

## Managing translations

Whenever larger changes to translations are needed, it's best to use the [`editTranslations`](/frontend/tools/editTranslations/editTranslations.ts) tool for that. It can be used to manage translations, export them and replace changed translation keys in the source code.

NB! Automatic key replacement only covers `.svelte` files in the frontend. Make sure to check that translations accessed by, for example, [e2e tests](/tests/) and [passwordValidation.ts](/shared/utils/passwordValidation.ts) are also updated accordingly.
