# Local translations

Local translations are the Paraglide message files in `apps/frontend/messages/<LOCALE>/`, one JSON file per namespace. Each file holds a single top-level key equal to its filename without `.json`, so `questions.json` starts with a `questions` key and its messages have keys like `questions.intro.start`. Every file must also be listed in `plugin.inlang.messageFormat.pathPattern` in `apps/frontend/project.inlang/settings.json`, or Paraglide does not compile it. See the [`messages` README](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/messages/README.md) for the rules translators follow.

The logic by which messages are separated into different files is not absolutely rigid, but the following principles should be followed:

1. Create a new file for each Voter App page or [dynamic component](/developers-guide/frontend/components), named `<pageOrComponentName>.json`.
2. Create a new file for each Candidate App page, named `candidateApp.<pageName>.json`.
3. For translations needed by [static components](/developers-guide/frontend/components), create a new subkey in the `components.json` file.

Whenever adding translations, be sure to create them for all supported languages.

### The [`TranslationKey`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/types/generated/translationKey.ts) type

The available translation keys are defined by the [`TranslationKey`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/types/generated/translationKey.ts) type. The type is generated from the base-locale message files by running `yarn workspace @openvaa/frontend generate:translation-key-type`.

If you need to use a dynamically constructed translation key that is not recognized by the linter, use the [assertTranslationKey](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib/i18n/utils/assertTranslationKey.ts) utility.

The frontend unit test `apps/frontend/src/lib/i18n/tests/translations.test.ts` fails when the committed type does not match the base-locale messages. Rerun the generator after adding, renaming or removing a key.
