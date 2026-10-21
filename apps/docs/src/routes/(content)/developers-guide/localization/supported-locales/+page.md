# Supported locales

Two lists decide which locales the app has, and they are easy to confuse:

- **The compiled locales** are `locales` in [`apps/frontend/project.inlang/settings.json`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/project.inlang/settings.json). Paraglide compiles a message catalogue for each of them, so each needs a complete directory in `apps/frontend/messages/`. The same file sets `baseLocale`, which is `en`.
- **The offered locales** are `supportedLocales` in [`StaticSettings`](https://github.com/OpenVAA/voting-advice-application/blob/main/packages/app-shared/src/settings/staticSettings.ts). They are the locales a deployment offers its users, and they are meant to be edited per instance. Each entry has a `code`, and one may be marked `isDefault`; without one, the first entry is the default. Every `code` must be a compiled locale, or the app stops with an error when `$lib/i18n` is loaded.

The `locales` member of the contexts and the language menu list the offered locales only. A compiled locale that is not offered still needs a complete catalogue.

The display name of each locale, such as "suomi" for `fi`, comes from the `lang` messages in `messages/<locale>/lang.json`, not from the `name` in `supportedLocales`.

## Adding a locale

1. Add the locale code to `locales` in `apps/frontend/project.inlang/settings.json`.
2. Create `apps/frontend/messages/<locale>/` with every file that `plugin.inlang.messageFormat.pathPattern` in the same settings file lists, each with the same keys as the base locale.
3. Add the locale's display name to `lang.json` in every locale directory.
4. Add the locale to `supportedLocales` in `StaticSettings` if the deployment should offer it.
5. Run `yarn workspace @openvaa/frontend test:unit`. The translation tests check the set of locale directories and the files and keys in each, so update the expected list of locales in `src/lib/i18n/tests/translations.test.ts` as well.

The rules translators follow are in the [`messages` README](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/messages/README.md). See also [Translations and overrides](/developers-guide/localization/translations-and-overrides).
