---
quick_id: 260601-ro7
slug: localenames-to-paraglide-payload
date: 2026-06-01
branch: feat-gsd-roadmap
---

# Quick Task: Add localeNames to the paraglide translations payload for all languages

## Goal

Move the locale display names — currently hardcoded endonyms sourced from
`staticSettings.supportedLocales` and assembled into `localeNames` in
`apps/frontend/src/lib/i18n/init.ts` — into the Paraglide message catalog so they
ship as part of the compiled translations payload for **every** language and can
be customized per-deployment via the existing backend `translationOverrides`
mechanism.

## Decisions (locked via discussion)

1. **Endonyms only** — every language file holds the same native name per locale
   (`fi → Suomi`, `sv → Svenska`, …), identical across all files, regardless of
   the active UI language.
2. **All 7 paraglide locales** — `en, fi, sv, da, et, fr, lb` each get an entry.
3. **Rewire to read via `t()`** — Paraglide becomes the single source of truth;
   drop `staticSettings.supportedLocales` as the *name* source (it remains the
   source for which locales are *offered*, i.e. the `locales` array + default).

## Key context

- Paraglide compiles `messages/{locale}/*.json` (7 locales × 46 files) listed
  explicitly in `apps/frontend/project.inlang/settings.json` `pathPattern`. The
  README documents a `lang.json` ("Locale display names") that **never actually
  existed**.
- `t('lang.<code>')` already typechecks: the `TranslationKey` generator
  (`tools/translationKey/generateTranslationKeyType.ts`) *synthesizes* `lang.<locale>`
  keys for every locale dir, so the generated union already contains
  `lang.en … lang.lb`. No codegen change needed — only the runtime message files
  are missing.
- The structure test (`src/lib/i18n/tests/translations.test.ts`) asserts each
  locale has exactly **46** message files and identical filenames/keys to `en`.
- `localeNames` is consumed only by `i18nContext.ts` (which forwards it through
  `appContext` to `LanguageSelection.svelte`). Building it eagerly in `init.ts`
  module scope via `t()` is **unsafe** — `t()`→`getLocale()` runs outside request
  context at import time. Build it in `initI18nContext()` instead (component
  setup → request scope).

## Tasks

### Task 1 — Add the `lang` message group to the Paraglide payload
- Create `apps/frontend/messages/{en,fi,sv,da,et,fr,lb}/lang.json`, each with the
  identical endonym map:
  ```json
  { "en": "English", "fi": "Suomi", "sv": "Svenska", "da": "Dansk",
    "et": "Eesti", "fr": "Français", "lb": "Lëtzebuergesch" }
  ```
- Register `"./messages/{locale}/lang.json"` in `project.inlang/settings.json`
  `pathPattern` (alphabetical slot: after `info.json`, before `maintenance.json`).
- Bump `translations.test.ts` file-count assertion `46 → 47`.

### Task 2 — Rewire `localeNames` to source from Paraglide
- `init.ts`: stop populating `localeNames` from `supportedLocales[].name`; remove
  the `localeNames` export. Keep building `locales` + `defaultLocale` from
  `supportedLocales` (drop the now-unused `name` from the destructure).
- `i18nContext.ts`: build `localeNames` locally inside `initI18nContext()` by
  iterating the Paraglide `locales` array and resolving `t('lang.<code>')` via
  `assertTranslationKey`.

## Verification
- `yarn workspace @openvaa/frontend test:unit` — i18n structure + key tests green.
- `yarn check` / lint clean on changed files.
- Manual: `lang-selector` still shows English / Suomi / Svenska.

## Out of scope
- Translated (per-UI-language) names — endonyms only, by decision.
- The legacy `src/lib/i18n/translations/` static loader + its `keys` array (local
  adapter concern; the `TranslationKey` generator already synthesizes `lang.*`).
