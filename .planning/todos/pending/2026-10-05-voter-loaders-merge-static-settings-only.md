---
created: 2026-10-05T23:30:00.000Z
title: The four voter route loaders merge the stored settings over the static settings only, without the shipped dynamic defaults
area: frontend
severity: minor
source: Phase 171 research (§ "Noticed, not this phase's to fix"); filed by plan 04, Task 2
files:
  - apps/frontend/src/routes/(voters)/(located)/+layout.ts
  - apps/frontend/src/routes/(voters)/constituencies/+page.ts
  - apps/frontend/src/routes/(voters)/elections/+page.ts
  - apps/frontend/src/routes/(voters)/nominations/+layout.ts
  - apps/frontend/src/lib/utils/settings.ts
  - packages/dev-seed/src/templates/default.ts
---

## Problem

Four voter route loaders build their own settings object as

```ts
const appSettings = mergeAppSettings(staticSettings, await appSettingsData);
```

that is: the static settings and the project's stored row, with **no** `dynamicSettings` beneath the stored row. The app context does it in three layers (static, shipped dynamic defaults, stored row); these loaders skip the middle one.

The population, re-derive with `git grep -n "mergeAppSettings(staticSettings" -- apps/frontend/src/routes`:

- `apps/frontend/src/routes/(voters)/(located)/+layout.ts`
- `apps/frontend/src/routes/(voters)/constituencies/+page.ts`
- `apps/frontend/src/routes/(voters)/elections/+page.ts`
- `apps/frontend/src/routes/(voters)/nominations/+layout.ts`

So whatever the stored row leaves out is `undefined` in these loaders, where the rest of the app reads the shipped default.

**The visible case.** On a stored `'{}'` (the default project right after `yarn db:reset`, which `seed.sql` deliberately keeps empty), `appSettings.entities` is `undefined` and `(voters)/nominations/+layout.ts` throws on `appSettings.entities.showAllNominations`. The `default` dev-seed template works around it by restating the `entities` and `results` blocks in full, and its comments say so.

**A second consequence.** The Supabase provider's closed-project answer carries the whole `access` object, not only `voterApp: false`, for the same reason: these loaders would otherwise have no other gate.

## Status after Phase 171

Phase 171 made `mergeAppSettings` deep (objects merge member by member, lists replace whole). That change **neither fixes nor worsens** this: the loaders still pass two sources, so a member absent from both is still absent. It was found during the phase's research and left out of scope.

## Solution

Give the four loaders the same three-layer base the app context uses — `mergeInitialAppSettings(staticSettings, dynamicSettings, await appSettingsData)` already exists in `apps/frontend/src/lib/utils/settings.ts` and tolerates an `Error` or `undefined` payload — or hand them the merged settings from the root layout instead of having each one merge again.

Then:

- a unit test per loader, or one over the shared call, that a stored `{}` yields the shipped `entities`, `elections` and `access` members;
- the `default` template's restated `entities` and `results` blocks, and the two comments that explain them, can shrink to what the template actually changes;
- the provider's closed-project branch may keep returning the whole `access` object (it is harmless) or return only what it states; decide with the comment above it in `supabaseDataProvider.ts`.

Check the `(located)` loader against the results-navigation invariant in `CLAUDE.md` before editing it: the load must not read the URL tracked, and `layout.tracking.test.ts` guards that.
