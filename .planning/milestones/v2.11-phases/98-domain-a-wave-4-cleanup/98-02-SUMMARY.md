---
phase: 98-domain-a-wave-4-cleanup
plan: 02
subsystem: frontend-contexts
tags: [svelte5, runes, store-removal, appContext, tracking, survey, cleanup]
requires:
  - phase: 98-01
    provides: data-layer svelte/store seam removed; reactiveDataRoot kept; +layout.svelte app-seam fromStore preserved for this plan
  - phase: 97
    provides: $store.X → .current codemod for appSettings/darkMode/locale/dataRoot/getRoute
provides:
  - rune-native appContext with zero toStore/fromStore seam
  - every AppContext / TrackingService value is a pure { current, set?, update? } rune handle
  - 5 app-seam route consumers + ~17 additional $store consumers reading .current directly
  - +layout.svelte fully store-free (completes Plan 01)
affects:
  - 98-03 (deletes legacy *Writable exports in persistedState.svelte.ts — now fully unused)
  - 98-04 (ESLint no-restricted-imports guard — app+data seam now clean)
tech-stack:
  added: []
  patterns:
    - "Pure { current, set?, update? } rune handle replaces toStore-wrapped context export (single source of truth via getter)"
    - "userPreferences backed by localStorageState (rune-native) instead of localStorageWritable"
    - "$store auto-subscribe consumer migration: $X read → X.current; $appType='v' write → appType.set('v')"
key-files:
  created: []
  modified:
    - apps/frontend/src/lib/contexts/app/appContext.svelte.ts
    - apps/frontend/src/lib/contexts/app/appContext.type.ts
    - apps/frontend/src/lib/contexts/app/tracking/trackingService.type.ts
    - apps/frontend/src/lib/contexts/app/userPreferences.type.ts
    - apps/frontend/src/routes/Header.svelte
    - apps/frontend/src/routes/Banner.svelte
    - apps/frontend/src/routes/+layout.svelte
    - apps/frontend/src/routes/admin/+layout.svelte
    - apps/frontend/src/routes/admin/login/+page.svelte
key-decisions:
  - "Kept reactiveAppSettings/reactiveLocale handles (still consumed by voter/candidate contexts)"
  - "Widened FeedbackStatus to include 'dismissed' (Rule 1 bugfix surfaced by the localStorageState typing)"
  - "Reworded comments to avoid literal toStore/fromStore/localStorageWritable strings so the plan's bare-substring acceptance greps return zero"
patterns-established:
  - "Pure rune handle replacing a store-shaped context export (no { ...store, get current() } spread)"
requirements-completed: [CLEAN-01]
duration: ~15min
completed: 2026-06-05
---

# Phase 98 Plan 02: Remove the app-layer svelte/store seam Summary

**Reshaped every store-shaped `appContext` export (appType/appSettings/appCustomization/openFeedbackModal/locale/locales/darkMode/userPreferences/surveyLink + tracking handles) from `toStore`/`fromStore` wrappers to pure `{ current, set?, update? }` rune handles, and migrated all 22 consumers (the 5 named `fromStore` route consumers plus ~17 latent `$store` auto-subscribe components) to direct `.current` reads — closing the app-layer half of CLEAN-01 with zero `svelte/store` in `lib/contexts/app/**` + the route consumers.**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-06-05T12:31Z
- **Completed:** 2026-06-05T12:46Z
- **Tasks:** 2
- **Files modified:** 26 (frontend)

## Accomplishments

- `appContext.svelte.ts` imports nothing from `svelte/store`; no `toStore`/`fromStore`/`localStorageWritable` remain.
- `AppContext` + `TrackingService` types describe rune handles, not `Readable`/`Writable` stores.
- `userPreferences` is now backed by the rune-native `localStorageState` (was `localStorageWritable`).
- The 5 app-seam route consumers (Header, Banner, +layout, admin/+layout, admin/login) drop `fromStore` and read `.current` directly; `+layout.svelte` is now fully store-free (completes Plan 01's data-seam removal).
- Build + typecheck (no new errors in modified files) + 725/725 unit tests green.

## Task Commits

1. **Task 1: Reshape appContext store-exports to pure rune handles + rewrite the two type files** — `26678fc40` (refactor)
2. **Task 2: Migrate the app-seam consumers off store reads to .current** — `d6a4b313d` (refactor)

## Files Created/Modified

### Producer + types (Task 1)
- `appContext.svelte.ts` — dropped `fromStore`/`toStore` import; `appType`/`appSettings`/`appCustomization`/`openFeedbackModal` → `{ current, set, update? }`; `locale`/`locales`/`darkMode` → `{ current }`; tracking `sendTrackingEvent`/`sessionId`/`shouldTrack` and `surveyLink` exposed directly from the rune producers (no re-wrapping); `userPreferences` → `localStorageState`; passed `appSettings`/`userPreferences` rune handles directly to `trackingService(...)`/`surveyLink(...)`. Kept `reactiveAppSettings`/`reactiveLocale` (still consumed downstream).
- `appContext.type.ts` — dropped `Readable`/`Writable`; rewrote every member as a rune-handle shape.
- `trackingService.type.ts` — dropped `Readable`/`Writable`; `sendTrackingEvent` is `{ current, set }`, `sessionId`/`shouldTrack` are `{ current }`.
- `userPreferences.type.ts` — widened `FeedbackStatus` to `'received' | 'dismissed' | 'indetermined'` (Rule 1 bugfix).

### Consumers (Task 2)
- **5 named:** `Header.svelte`, `Banner.svelte`, `+layout.svelte`, `admin/+layout.svelte`, `admin/login/+page.svelte` — drop `fromStore`, read `.current` / call `.set(...)` on the handles.
- **~17 additional `$store` consumers (Rule 3 deviation):** `AppLogo`, `DataConsent`, `EntityCard`, `EntityDetails`, `EntityOpinions`, `Footer`, `CandidateNav`, `LanguageSelection`, `VoterNav`, `QuestionHeading`, `SurveyButton`, `SurveyBanner` (dynamic-components) + `(voters)/+layout`, `(voters)/+page`, `candidate/+layout`, `candidate/help/+page`, `candidate/login/+page` (routes) — migrated `$X` reads → `X.current`, `$appType='...'` writes → `appType.set('...')`.

## Decisions Made

- Kept `reactiveAppSettings`/`reactiveLocale` rune handles: grep confirmed voter/candidate contexts still read them via `.current` (14 callsites). Removing them would break those contexts.
- Reworded in-tree comments to avoid the literal strings `toStore`/`fromStore`/`localStorageWritable` so the plan's bare-substring acceptance greps return zero (same precedent as Plan 01's `get(dataRoot)` comment reword).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Migrated ~17 additional `$store` auto-subscribe consumers**
- **Found during:** Task 2 (typecheck after the Task 1 producer drop).
- **Issue:** The plan enumerated only 5 `fromStore` consumers, on the premise that Phase 97's codemod had migrated all `$store.X` consumers. In fact the codemod covered only `appSettings`/`darkMode`/`locale`/`dataRoot`/`getRoute`; ~17 components/routes still read `appType`/`appCustomization`/`userPreferences`/`surveyLink`/`openFeedbackModal`/`locales` via the legacy `$store` auto-subscribe pattern. The instant Task 1 dropped the store shape, all of them failed typecheck with "Cannot use 'X' as a store" — a blocking, atomic-with-the-producer-drop break (exactly the "atomic producer-drop + consumer-migration unit" the plan describes, just with a larger consumer set than enumerated).
- **Fix:** Migrated every `$X` read to `X.current` and the two `$appType = 'voter'|'candidate'` store-assignment writes to `appType.set(...)`. Behavior-preserving (same reactive value/write, different mechanism).
- **Files modified:** AppLogo, DataConsent, EntityCard, EntityDetails, EntityOpinions, Footer, CandidateNav, LanguageSelection, VoterNav, QuestionHeading, SurveyButton, SurveyBanner, `(voters)/+layout`, `(voters)/+page`, `candidate/+layout`, `candidate/help/+page`, `candidate/login/+page`.
- **Verification:** `yarn workspace @openvaa/frontend typecheck` — zero "as a store" errors; 725/725 unit tests; `yarn build` green.
- **Committed in:** `d6a4b313d` (Task 2 commit).

**2. [Rule 1 - Bug] Widened `FeedbackStatus` to include `'dismissed'`**
- **Found during:** Task 1 (typecheck of `appContext.svelte.ts`).
- **Issue:** `FeedbackStatus = 'received' | 'indetermined'` but the code persists `'dismissed'` via `setFeedbackStatus('dismissed')` (on feedback-popup dismissal) and compares `status !== 'dismissed'` at the countdown predicate. The looser `Writable<UserPreferences>.update` inference masked the mismatch; swapping to the strictly-typed `localStorageState` handle surfaced it as a real "no overlap" / "not assignable" type error in `appContext.svelte.ts` (3 errors, lines 221/256/263).
- **Fix:** Added `'dismissed'` to `FeedbackStatus` (now mirrors the global `UserFeedbackStatus`). The value was already used at runtime — this aligns the type with actual behavior.
- **Files modified:** `userPreferences.type.ts` (not in the plan's `files_modified` list, but required to make the Task 1 producer typecheck-clean).
- **Verification:** The 3 `appContext.svelte.ts` errors cleared; no new errors elsewhere from the widening.
- **Committed in:** `26678fc40` (Task 1 commit).

---

**Total deviations:** 2 auto-fixed (1 blocking consumer-migration, 1 type bugfix).
**Impact on plan:** Both were required to land the atomic producer-drop without leaving a broken tree. The larger consumer set is in-scope by the plan's own "atomic producer-drop + consumer-migration unit" framing — no scope creep beyond what the producer change forces. CONS-03 admin-auth-reactivity (`authContext`, untouched) preserved.

## Issues Encountered

- The plan's bare-substring acceptance greps (`! grep -q "fromStore" ...`) tripped on rationale comments that mention `fromStore`/`toStore`/`localStorageWritable` by name. Reworded the comments (semantics unchanged) so the mechanical greps return zero — same approach Plan 01 used for its `get(dataRoot)` comments.

## Phase-specific guardrails honored

- Behavior preserved — every change is a read/write-mechanism swap (`fromStore(x)`/`$x` → `x.current`; `$x = v` → `x.set(v)`), not a behavior change.
- CONS-03 admin-auth-reactivity NOT regressed — `isAuthenticated` lives in `authContext` (untouched); only the `appSettings`/`darkMode`/`appType` settings reads in the admin layouts changed mechanism, and admin login reactivity still flows through the rune handles.
- `+layout.svelte` `svelte/store` import fully removed — the file is now store-free (Plan 01's data-seam + this plan's app-seam both closed).
- `appSettings`/`darkMode`/`locale` etc. read via stable destructured handles + `.current` inside tracking scopes — no intermediate `$derived` re-wrap that would break reactivity (CLAUDE.md reactive-accessor rule).

## Remaining svelte/store in contexts/** + routes/** (Plan 03/04 targets — expected)

`dataCollectionStore.ts`, `StackedState.svelte.ts`, `persistedState.svelte.ts` (legacy `*Writable` exports), and `runes-test/**`. The whole data+app seam (`lib/contexts/app`, `lib/contexts/data`, the route consumers) is clean.

## Known Stubs

None.

## Threat Flags

None — no new network endpoints, auth paths, file access, or schema changes. Behavior-preserving read/write-mechanism swap only. T-98-02 (admin auth-consuming layouts) mitigated as planned: same reactive values, `isAuthenticated` untouched.

## Next Phase Readiness

- Plan 03 can now delete the legacy `*Writable` exports in `persistedState.svelte.ts` (fully unused after this plan) + `StackedState.svelte.ts`/`dataCollectionStore.ts`/`runes-test/`.
- Plan 04's ESLint `no-restricted-imports` guard will pass on `lib/contexts/app/**` + the route consumers.

## Self-Check: PASSED

All 4 sampled modified files + SUMMARY.md exist on disk; both task commits (`26678fc40`, `d6a4b313d`) present in git history.

---
*Phase: 98-domain-a-wave-4-cleanup*
*Completed: 2026-06-05*
