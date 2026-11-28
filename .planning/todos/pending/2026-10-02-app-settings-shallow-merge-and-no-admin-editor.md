---
created: 2026-10-02
title: Stored app settings replace defaults by top-level key (a partial group drops its other defaults), and the Admin App has no settings/customization editor
area: apps/frontend/src/lib/utils, apps/frontend/src/routes/admin
severity: follow-up
source: Phase 168 (docs-site rewrite), 168-06 findings F11 and F9 (= 168-04 F7), filed by plan 168-08
related_phase: 168
files:
  - apps/frontend/src/lib/utils/settings.ts (`mergeAppSettings`)
  - apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts
  - apps/frontend/src/routes/admin/(protected)/+page.svelte
---

## 1. Shallow merge by top-level key (168-06 F11)

`mergeAppSettings` replaces defaults by top-level key. `apps/frontend/src/lib/utils/settings.ts` says so itself: "NB! Settings are
overwritten by root key unless the key is nullish." and "TODO: Handle merging so that empty objects do not overwrite defaults". So a
stored `results` object that sets only `showFeedbackPopup` drops the defaults for `cardContents` and `sections`.

The provider already works around this for `access`, returning the whole object:
`supabaseDataProvider.ts` has "the app context's `mergeAppSettings` replaces settings by root key: a bare `{ voterApp: false }` would drop
`candidateApp`". The old publishers' page did not mention the pitfall. Both app-settings docs pages now tell the reader to store whole
top-level groups.

**Decide (operator):** is a deep merge wanted? Whether it is the intended contract is UNCONFIRMED. If yes, implement a deep merge that
treats arrays as replace-whole, test it on `results` and `access`, then relax the docs advice. This promotes the in-code TODO to a
tracked item.

## 2. No Admin App editor for app settings or `app_settings.customization` (168-06 F9, 168-04 F7)

Nothing under `apps/frontend/src/routes/admin` edits app settings or customization: `git grep -n -i customization -- apps/frontend/src/routes/admin`
exits 1, and the home page's tool links end at `AdminAppQuestionInfo`. Operators change both directly in the database, which is what the
App settings, App customization and Admin app pages say.

This is an observation, not a defect. It matters for item 1, because a hand-edited partial group silently loses defaults. If an
editor is built, it should write whole groups or rely on a deep merge.

**An editor validates with the shared `StoredSettingsSchema` on save** (`packages/app-shared/src/data/schemas/storedSettings.schema.ts`),
as the dev-seed writer does before it writes a template's settings (Phase 179.1), so a mistyped setting is refused where it is made. The
application parses the stored column with the same schema and drops the top-level member a failed parse lies under, so a value saved
unvalidated would silently fall back to the shipped default.

## Update 2026-10-09 — item 1 is no longer true of the tree (Phase 175 close, 175-RESEARCH.md T-1)

**The merge is deep.** `mergeAppSettings` in `apps/frontend/src/lib/utils/settings.ts` begins "Merge settings over other settings, member by member at every depth", and its doc comment goes on: "Where both sides hold an object, the two are merged member by member, so a member that `additional` does not name keeps the value `target` has." Lists and scalars are replaced whole. The change is commit `05a10320c` (`feat(171-01): merge app settings member by member at every depth …`), and the developers' app-settings page describes it under *Merging*. The two in-code sentences this todo quotes ("NB! Settings are overwritten by root key …", "TODO: Handle merging …") are gone from that file.

So a stored `results: { showFeedbackPopup: 60 }` keeps the other defaults of `results`, and a writer of `access` no longer has to restate the whole group: Phase 175's lock is written as the one key, `{ access: { nominationsLocked: true } }`.

**Item 2 stands.** The Admin App has no editor for app settings or customization. Phase 175 gives it one more thing to edit: the nominations lock, `access.nominationsLocked`, which the database enforces and which today is written in Supabase Studio or by an import. Who may set it is `2026-10-09-175-a-project-editor-can-lock-and-unlock-nominations.md`.

What remains of this todo is item 2 alone; `2026-10-08-admin-ui-first-update-the-most-crucial-admin-features.md` is where an editor would be built.
