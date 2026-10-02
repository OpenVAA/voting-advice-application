# Localization overview

The frontend is localized with [Paraglide JS](https://inlang.com/m/gerre34r/library-inlang-paraglideJs). In short:

- **Messages** live in JSON files in [`apps/frontend/messages/<locale>/`](https://github.com/OpenVAA/voting-advice-application/tree/main/apps/frontend/messages), one file per namespace. Paraglide compiles them into message functions in `src/lib/paraglide/`. Its Vite plugin does this during `dev` and `build`, and `yarn workspace @openvaa/frontend paraglide:compile` does it without a build. The compiled output is generated and not committed.
- **Components call `t()`**, the wrapper in [`$lib/i18n`](https://github.com/OpenVAA/voting-advice-application/tree/main/apps/frontend/src/lib/i18n), for example `t('results.title.results')` or `t('results.candidate.numShown', { numShown })`. They do not call the Paraglide message functions directly. `t` is a plain function: there is no `$` prefix. The key must be a `TranslationKey`, so a key that does not exist is a type error.
- **Runtime overrides** come first. A deployment can override any message in its app customization; `t()` checks the overrides for the current locale before it falls back to the compiled message. When neither has the key, `t()` returns the key itself.
- **The locale comes from the URL.** No route has a locale segment: Paraglide's `url` strategy reads the locale prefix, such as `/fi/`, and the base locale has no prefix.
- **Data from the database** is stored with all its translations, and the data adapters pick the current locale when they read it.

In components, `t`, `translate`, `locale` and `locales` are read from the contexts, for example `getAppContext()`. See [Contexts](/developers-guide/frontend/contexts).

## Pages in this section

- [Supported locales](/developers-guide/localization/supported-locales): which locales are compiled, which are offered, and how to add one.
- [Locale resolution](/developers-guide/localization/locale-resolution): how a request gets its locale and how a user switches it.
- [Translations and overrides](/developers-guide/localization/translations-and-overrides): editing messages, the checks that keep them consistent, and runtime overrides.
- [Multi-locale data](/developers-guide/localization/storing-multi-locale-data): how translated data is stored and read.
