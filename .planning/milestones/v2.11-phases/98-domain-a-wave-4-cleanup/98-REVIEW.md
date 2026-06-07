---
phase: 98-domain-a-wave-4-cleanup
reviewed: 2026-06-05T00:00:00Z
depth: standard
files_reviewed: 21
files_reviewed_list:
  - apps/frontend/eslint.config.mjs
  - apps/frontend/src/lib/contexts/app/appContext.svelte.ts
  - apps/frontend/src/lib/contexts/app/appContext.type.ts
  - apps/frontend/src/lib/contexts/app/survey.svelte.test.ts
  - apps/frontend/src/lib/contexts/app/tracking/trackingService.svelte.test.ts
  - apps/frontend/src/lib/contexts/app/tracking/trackingService.type.ts
  - apps/frontend/src/lib/contexts/app/userPreferences.type.ts
  - apps/frontend/src/lib/contexts/data/dataContext.svelte.ts
  - apps/frontend/src/lib/contexts/data/dataContext.type.ts
  - apps/frontend/src/lib/contexts/utils/persistedState.svelte.test.ts
  - apps/frontend/src/lib/contexts/utils/persistedState.svelte.ts
  - apps/frontend/src/lib/contexts/utils/SettingsOverlay.svelte.test.ts
  - apps/frontend/src/lib/contexts/utils/SettingsOverlay.svelte.ts
  - apps/frontend/src/routes/+layout.svelte
  - apps/frontend/src/routes/admin/+layout.svelte
  - apps/frontend/src/routes/admin/login/+page.svelte
  - apps/frontend/src/routes/Banner.svelte
  - apps/frontend/src/routes/candidate/(protected)/+layout.svelte
  - apps/frontend/src/routes/candidate/+layout.svelte
  - apps/frontend/src/routes/Header.svelte
findings:
  critical: 0
  warning: 3
  info: 4
  total: 7
status: issues_found
---

# Phase 98: Code Review Report

**Reviewed:** 2026-06-05
**Depth:** standard
**Files Reviewed:** 21
**Status:** issues_found

## Summary

Phase 98 removes the legacy `svelte/store` seam from the AppContext / DataContext
factories, the `persistedState` / `SettingsOverlay` utilities, and the route
consumers, converting store-shaped exports (`fromStore(x)` / `$store.y` template
auto-subscribe) into pure rune `{ current }` handles. A scoped
`no-restricted-imports` ESLint guard bans re-introduction of `svelte/store`.

The migration is, on the whole, careful and correct on the highest-value axes:

- **Reactivity correctness** is sound. The reactive accessors
  (`reactiveAppSettings`, `reactiveLocale`, `reactiveDataRoot.current`,
  `appSettings.current`, `darkMode.current`, `routeTitle.current`) are read via
  `.current` inside tracking scopes (`$derived` / `$derived.by` / template), never
  captured-once via destructuring. The two data-provide effects in
  `+layout.svelte` and `candidate/(protected)/+layout.svelte` correctly use the
  non-reactive `reactiveDataRoot.instance` inside `untrack()`, preserving the
  write-after-read invariant.
- **Auth-layout regressions** were not found. `admin/+layout.svelte`,
  `admin/login/+page.svelte`, and `candidate/(protected)/+layout.svelte`
  destructure only stable handle objects and read `.current` at the point of use,
  so the Phase-97 CONS-03 admin-auth reactivity is preserved.
- **ESLint guard** is correct: the `svelte/store` ban is scoped to the two
  intended globs and the inherited deep-relative-`lib` `patterns` ban is
  re-included verbatim (confirmed against `packages/shared-config/eslint.config.mjs:144-156`).

The findings below are quality / robustness issues plus one genuine logic
weakness in the survey-link interpolation. No BLOCKERs.

## Warnings

### WR-01: `surveyLink` only replaces the FIRST `{sessionId}` placeholder

**File:** `apps/frontend/src/lib/contexts/app/survey.svelte.ts:26` (producer consumed by `appContext.svelte.ts:180`)
**Issue:** The interpolation uses a non-global regex:
```ts
linkTemplate.replace(/\{\s*sessionId\s*\}/, sessionId.current ?? '')
```
`String.prototype.replace` with a non-`g` regex replaces only the first match. A
`linkTemplate` containing `{sessionId}` more than once (e.g. a tracking param
plus a fragment, or a redundant double-templated URL) silently leaves the second
placeholder un-interpolated, producing a malformed survey URL with a literal
`{sessionId}` in it. The test suite (`survey.svelte.test.ts`) only ever exercises
single-placeholder templates, so this gap is uncovered. This is a behavioral
weakness carried through the migration's reshaped producer.
**Fix:** Use a global regex so every occurrence is interpolated:
```ts
linkTemplate.replace(/\{\s*sessionId\s*\}/g, sessionId.current ?? '')
```
Add a test with a two-placeholder template asserting both are replaced.

### WR-02: `persistedState` init-persist on `localStorage` ignores write failures and can desync `current` from storage

**File:** `apps/frontend/src/lib/contexts/utils/persistedState.svelte.ts:96` (and `saveItemToStorage:155-165`)
**Issue:** `storageState` persists the default on init via `saveItemToStorage`, and
every `set`/`update` calls `storage.setItem(...)` with no try/catch. `setItem`
throws synchronously when storage is full or blocked (Safari Private Browsing
historically throws `QuotaExceededError` even for `sessionStorage`). In that case:
- the init-persist at line 96 throws out of `localStorageState(...)`, which runs
  **inside `initAppContext()`** (`appContext.svelte.ts:159`) — an uncaught throw
  there aborts context initialization and 500s the whole app on first load;
- `set`/`update` (lines 104, 108) assign `value` to the `$state` **before**
  `saveItemToStorage`, so a throwing `setItem` leaves `current` updated but
  storage stale (silent divergence on the next reload).

The superseded store bridge had the same exposure, but the migration is the right
moment to harden the single chokepoint that now backs `userPreferences` and the
tracking `sessionId`.
**Fix:** Wrap the storage write in a guarded helper that logs and swallows:
```ts
function saveItemToStorage<TValue>(type, key, value): void {
  const storage = getStorage(type);
  if (!storage) return;
  try {
    const toSave = type === 'localStorage' ? { version: ..., data: value } : (value ?? null);
    storage.setItem(key, JSON.stringify(toSave));
  } catch (e) {
    logDebugError(`Failed to persist ${key} to ${type}`, e);
  }
}
```

### WR-03: `admin/login/+page.svelte` ternary selects the same image for both branches (dead conditional)

**File:** `apps/frontend/src/routes/admin/login/+page.svelte:71`
**Issue:**
```ts
topBarSettings.use({
  imageSrc: darkMode.current ? '/images/hero-admin.png' : '/images/hero-admin.png'
});
```
Both arms of the `darkMode.current ? … : …` ternary return the identical literal
`'/images/hero-admin.png'`. The condition is dead — it takes a reactive dependency
on `darkMode.current` (re-running the `use()` overlay push on every theme toggle)
yet can never change the result. This is migration debris: the `fromStore`→`.current`
swap was applied mechanically to a ternary that was already a no-op (or whose
dark-variant asset was lost). Either the dark-mode hero asset is missing (a visual
bug) or the ternary should be collapsed.
**Fix:** If a dark hero exists, reference it
(`darkMode.current ? '/images/hero-admin-dark.png' : '/images/hero-admin.png'`);
otherwise collapse to the unconditional literal and drop the `darkMode` read:
```ts
topBarSettings.use({ imageSrc: '/images/hero-admin.png' });
```
(If `darkMode` then becomes unused in this file, remove it from the destructure.)

## Info

### IN-01: Redundant `userPrefsReactive` alias

**File:** `apps/frontend/src/lib/contexts/app/appContext.svelte.ts:212`
**Issue:** `const userPrefsReactive = userPreferences;` is a pure alias — both refer
to the same `localStorageState` handle, and `.current` reads are identical through
either name. The migration comment claims it is "the reactive read used by the
popup-countdown predicates," but `userPreferences.current` would read identically.
The alias adds a second name for one value with no semantic distinction.
**Fix:** Delete the alias and read `userPreferences.current` directly in
`startFeedbackPopupCountdown` / `startSurveyPopupCountdown`.

### IN-02: Stale "wraps this handle back to a readable store" docstring in `surveyLink`

**File:** `apps/frontend/src/lib/contexts/app/survey.svelte.ts:11-13` (producer for `appContext.svelte.ts`)
**Issue:** The producer docstring still describes the removed seam: "The
store-shaped exported surface (`$surveyLink` consumers) is owned by the
`appContext` seam, which wraps this handle back to a readable store." After Phase
98 the AppContext exposes `surveyLink` as a pure `{ readonly current }` handle
(`appContext.type.ts:78`); there is no store wrap. The comment now misdescribes the
architecture and will mislead future maintainers into thinking a store bridge
survives.
**Fix:** Update the docstring to state the output is consumed directly via
`.current` with no store bridge. (Note: `survey.svelte.ts` is not in the Phase-98
changed-file list; flag for a follow-up doc sweep.)

### IN-03: `appContext.svelte.ts` relies on ambient global types (`AppSettings`, `AppType` shadow, `UserDataCollectionConsent`, `UserFeedbackStatus`)

**File:** `apps/frontend/src/lib/contexts/app/appContext.svelte.ts:88, 243, 253, 260`
**Issue:** `appSettingsValue = $state<AppSettings>(...)`, `setDataConsent(consent:
UserDataCollectionConsent)`, and `setFeedbackStatus(status: UserFeedbackStatus)`
reference ambient globals never imported in this file. `AppType` is **both** an
ambient global (used at line 63 `$state<AppType>`) **and** an imported type
(`./appContext.type` line 20) — the local import shadows/aliases the global with
the same name, which is fragile. This is pre-existing (not introduced by the
migration) but the reshaped `$state<AppSettings>` line is a changed line that
re-touches the pattern.
**Fix:** Import the concrete types explicitly
(`import type { AppSettings } from '@openvaa/app-shared'` etc.) so the file does
not depend on global augmentation resolution order. Low priority; out of strict
migration scope.

### IN-04: Commented-out dead code blocks retained

**File:** `apps/frontend/src/routes/candidate/+layout.svelte:44-54`, `apps/frontend/src/routes/Header.svelte:52-61`
**Issue:** Both files retain sizable commented-out blocks: the candidate layout's
disabled `$effect` popup-notification block (with a "results in
effect_update_depth_exceeded" note) and the Header's stashed `videoHeight`/
`videoWidth`/`invertLogo` proxy logic. These are pre-existing and not introduced by
the store migration, but they sit in changed files and degrade readability. The
candidate-layout block in particular is a latent reactivity hazard kept as a
comment rather than tracked as a TODO/issue.
**Fix:** Remove the dead blocks and convert any still-relevant intent
(re-enabling the candidate-app notification popup; restoring video-aware header
styling) into tracked issues. No behavioral change.

---

_Reviewed: 2026-06-05_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
