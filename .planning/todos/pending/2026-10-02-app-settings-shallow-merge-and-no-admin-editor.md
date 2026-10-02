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
