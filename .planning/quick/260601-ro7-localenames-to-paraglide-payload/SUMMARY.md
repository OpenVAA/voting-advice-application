---
quick_id: 260601-ro7
slug: localenames-to-paraglide-payload
date: 2026-06-01
status: complete
commits:
  - 9d59c0b9f # feat: add lang.json message group
  - 2cc5eb37e # refactor: source localeNames from paraglide via t()
---

# Summary: Add localeNames to the paraglide translations payload for all languages

## What was done

Moved locale display names out of `staticSettings.supportedLocales` and into the
Paraglide message catalog, so they ship in the compiled translations payload for
**every** language and become overridable via backend `translationOverrides`.

### Commit 1 — `9d59c0b9f` (feat)
- Created `apps/frontend/messages/{en,fi,sv,da,et,fr,lb}/lang.json` (7 files),
  each wrapped in the `"lang"` namespace key (paraglide convention — the
  top-level key, matching the filename, becomes the message-id prefix; a flat map
  would have compiled to ids `en`/`fi` instead of `lang.en`/`lang.fi`). Identical
  endonym map in every file (`en→English, fi→Suomi, sv→Svenska, da→Dansk,
  et→Eesti, fr→Français, lb→Lëtzebuergesch`).
- Registered `"./messages/{locale}/lang.json"` in `project.inlang/settings.json`
  `pathPattern` (alphabetical slot, after `info.json`).
- Bumped `translations.test.ts` file-count assertion `46 → 47`.

### Commit 2 — `2cc5eb37e` (refactor)
- `init.ts`: removed the `localeNames` export and its `supportedLocales[].name`
  population; `supportedLocales` still drives the `locales` array + `defaultLocale`.
- `i18nContext.ts`: `initI18nContext()` now builds `localeNames` by resolving
  `t(assertTranslationKey('lang.<code>'))` over the paraglide `locales`. Built at
  context init (request scope), NOT `init.ts` module load — `t()`→`getLocale()`
  would otherwise run outside any request context. `LanguageSelection.svelte`
  unchanged (still reads `ctx.localeNames[loc]`).

## Decisions (locked via discussion)
1. Endonyms only (same native name in every file).
2. All 7 paraglide locales get an entry.
3. Rewire to read via `t()` — paraglide is the single source of truth for names.

## Verification
- `yarn test:unit src/lib/i18n/tests/translations.test.ts` → **295/295 pass**
  (structure test picks up `lang.json` across all 7 locales; identical
  filenames/keys enforced).
- `yarn check` → 0 errors/warnings in any changed file (155 errors are the
  pre-existing project baseline: `qs` decls, admin-jobs cookies, runes-test
  routes, etc. — none touched here).
- `eslint` + `prettier` clean on changed files.
- End-to-end resolution confirmed: paraglide compiled `lang_en … lang_lb` and
  `_index.js` aliases each as `export { lang_en as "lang.en" }`, so the wrapper's
  `m['lang.en']` lookup resolves and `t('lang.en')` returns "English".

## Notes / follow-ups
- The legacy `src/lib/i18n/translations/` static loader (`keys` array,
  `staticTranslations`) was intentionally left untouched — it's a local-adapter
  concern and the `TranslationKey` generator already synthesizes `lang.*` keys.
  If the local adapter ever needs the names, add `lang.json` there + `'lang'` to
  the `keys` array too.
- Full E2E not re-run (live-stack checkpoint); the `lang-selector` continues to
  show English / Suomi / Svenska (endonyms unchanged from before).
- 3 pre-existing working-tree fixture edits (candidatePasswordSetter,
  langSelectorFixture, perm-localisation-positive) were left untouched — not part
  of this task.
