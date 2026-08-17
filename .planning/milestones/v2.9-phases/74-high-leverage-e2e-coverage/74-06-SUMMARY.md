---
phase: 74-high-leverage-e2e-coverage
plan: 06
subsystem: testing
tags: [playwright, e2e, voter, locale-switching, i18n, paraglide]

# Dependency graph
requires:
  - phase: 73-determinism-baseline
    provides: deterministic Playwright suite (4 PASS_LOCKED / 15 DATA_RACE / 55 CASCADE) + lint gate at error
provides:
  - "voter-locale-switching.spec.ts (2 tests): permanent E2E gate for the E2E-08 i18n route-prefix contract on the voter app"
  - "Documented Phase 78 CLEAN-04 anchor: LanguageSelection widget gating bug (locales Readable-store vs array)"
affects:
  - 74-07-PLAN (verification gate: 3-run determinism + DATA_RACE/PASS_LOCKED classification)
  - 78-clean (CLEAN-04 i18n wrapper tightening; spec re-validates against tightened wrapper post-CLEAN-04 per Order B)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Inline `// reason:` documentation of pre-existing wrapper bug + Order B re-validation contract"
    - "Direct page.goto for the Paraglide route-prefixed form (NOT buildRoute) — Pitfall 3 honored"
    - "Pivot to direct-URL-navigation when widget gate is broken (Plan 06 acceptance criterion 8)"

key-files:
  created:
    - tests/tests/specs/voter/voter-locale-switching.spec.ts
  modified: []

key-decisions:
  - "Order B locked in spec header comment: Phase 74 covers pre-CLEAN-04 wrapper; Phase 78 re-validates against tightened wrapper (no spec changes in Phase 78 — only verification re-runs)"
  - "LanguageSelection widget pivot: widget never renders in pre-CLEAN-04 wrapper because `locales` is a Readable<ReadonlyArray<string>> store, not a plain array. Test 2 exercises the equivalent locale-switch contract via direct URL navigation (/fi/about → /about), preserving the gate's contract while avoiding the widget gating bug. Documented inline as a CLEAN-04 anchor."
  - "About-page navigation requires a prior visit to `/` to prime the voter session — direct unauthenticated navigation to /about or /fi/about hits the voter error page. Test 2 visits `/` first."

patterns-established:
  - "Order-B pre/post-tightening documentation pattern: spec header explicitly notes which side of a paired refactor the spec covers + which artifact records the dependency direction (74-VERIFICATION.md at phase close)"
  - "Direct page.goto('/fi') for the Paraglide route-prefixed form — buildRoute does NOT inject the Paraglide locale prefix for the default-locale form"

requirements-completed: [E2E-08]

# Metrics
duration: ~30min
completed: 2026-05-11
---

# Phase 74 Plan 06: voter-locale-switching spec for E2E-08 Summary

**E2E-08 i18n route-prefix contract covered by a permanent Playwright gate (2 tests, both PASS_LOCKED across 3 cold runs), with the LanguageSelection widget rendering bug surfaced as a Phase 78 CLEAN-04 anchor.**

## Performance

- **Duration:** ~30 min
- **Started:** 2026-05-11T06:50:00Z (approx)
- **Completed:** 2026-05-11T07:17:55Z
- **Tasks:** 1
- **Files created:** 1
- **Files modified:** 0

## Accomplishments
- New spec `tests/tests/specs/voter/voter-locale-switching.spec.ts` (137 lines, 2 tests) under the default `voter-app` Playwright project with unauthenticated storage state.
- Test 1 `locale switches via route prefix` asserts the pre-CLEAN-04 wrapper's Paraglide convention: `/` (no prefix, en default) renders "Find the Best Candidates and Parties!"; `/fi` (route-prefixed form) renders "Löydä sopivimmat ehdokkaat ja puolueet!". URL prefix verified via `toHaveURL(/\/fi\/?$/)`.
- Test 2 `locale switches via LanguageSelection widget (when present)` asserts the same locale-switch contract on a non-root page (`/fi/about` → "Kuinka vaalikone toimii?", `/about` → "How Does This App Work?"), via the direct-URL-navigation pivot per Plan 06 acceptance criterion 8.
- 3 cold `--workers=1` runs PASS identically (5/5 per run; 8.6s, 8.9s, 9.3s) — recommended classification: **PASS_LOCKED**.
- Root `yarn lint:check` exits 0 errors (15 pre-existing dev-seed warnings unrelated).

## Task Commits

1. **Task 1: Author voter-locale-switching.spec.ts (E2E-08)** — `4c36fc404` (test)

## Files Created/Modified
- `tests/tests/specs/voter/voter-locale-switching.spec.ts` — 2-test E2E-08 gate; semantic role/aria locators only; no test-id additions; no conditionals in test bodies; no `waitForLoadState('networkidle')`. Inline `// reason:` documentation explains Order B + the CLEAN-04 anchor.

## Decisions Made

- **Order B locked in spec header comment** (CONTEXT D-06). Phase 74 Plan 06 lands BEFORE Phase 78 CLEAN-04 i18n wrapper tightening. The spec re-validates against the tightened wrapper after CLEAN-04 lands (no spec changes — only verification re-runs). Documented inline at the top of the spec file for 74-VERIFICATION.md "Dependency direction" field at phase close.
- **LanguageSelection widget pivot** (Plan 06 acceptance criterion 8). Investigation revealed the widget at `apps/frontend/src/lib/dynamic-components/navigation/languages/LanguageSelection.svelte:32` is gated on `{#if locales.length > 1}`, but `locales` is destructured from `getAppContext()` where it is typed as `Readable<ReadonlyArray<string>>` (per `apps/frontend/src/lib/contexts/app/appContext.type.ts:30`). At runtime `locales.length` is `undefined`, so the gate is always false and the widget never renders. The plan's acceptance criterion 8 explicitly permits direct-URL-navigation as a pivot, which preserves the same locale-switch contract (a non-root page's URL prefix flips, full reload semantics asserted via `toHaveURL`). This is exactly the wrapper-tightening bug Phase 78 CLEAN-04 targets.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] About-page navigation requires prior session priming**
- **Found during:** Task 1 (Test 2 design)
- **Issue:** Direct navigation to `/about` or `/fi/about` from an unauthenticated context (storage state `{ cookies: [], origins: [] }`) lands on the voter error page ("Something went wrong, sorry!" / "Jotakin meni pieleen, anteeksi!"). The `(voters)` layout requires first-touch session initialization before reaching non-home routes.
- **Fix:** Test 2 visits `/` first to prime the session before navigating to `/fi/about`. The existing `voter-static-pages.spec.ts` uses `buildRoute` for navigation but pairs it with a different harness contract; this spec uses direct `page.goto('/')` for the same effect.
- **Files modified:** `tests/tests/specs/voter/voter-locale-switching.spec.ts`
- **Verification:** Test 2 passes 3× cold runs identically.
- **Committed in:** `4c36fc404` (Task 1 commit)

**2. [Rule 2 - Missing Critical] LanguageSelection widget pivot via direct URL navigation**
- **Found during:** Task 1 (Test 2 design)
- **Issue:** Plan acceptance criterion 5 specifies clicking the English locale link in the `LanguageSelection` widget after opening the nav menu (`page.getByRole('button', { name: /open menu|toggle menu/i }).click()`). Investigation against the running dev server (curl `/`, `/fi`) confirmed the widget block never renders in the page DOM (`data-sveltekit-reload` count = 0, "Valitse kieli" / "Select Language" string absent). Root cause: `locales` is destructured from `getAppContext()` as a `Readable` store, not as a plain array, so `locales.length > 1` evaluates to `undefined > 1` → false. This is the i18n wrapper bug CLEAN-04 will fix in Phase 78.
- **Fix:** Pivot to direct-URL-navigation per Plan 06 acceptance criterion 8 ("OR pivot the widget-press to direct URL navigation as a fallback. PREFER the role-locator path first"). The role-locator path is unreachable because the widget is unrendered, so the fallback is invoked. The equivalent contract (locale switch + full reload semantics + URL prefix change) is asserted via `/fi/about` → `/about` direct navigation with `toHaveURL` + role-based heading assertions per locale.
- **Files modified:** `tests/tests/specs/voter/voter-locale-switching.spec.ts`
- **Verification:** Test 2 passes 3× cold runs identically; the contract being asserted matches what a working widget click would produce (same network-level outcome).
- **Committed in:** `4c36fc404` (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (1 blocking session priming, 1 missing critical pivot due to pre-existing wrapper bug)
**Impact on plan:** Both auto-fixes preserved the plan's intent and acceptance criteria. The plan explicitly authorized the pivot in criterion 8. The widget bug is now surfaced as a Phase 78 CLEAN-04 anchor with a re-validation contract baked into the spec header.

## Issues Encountered

- **LanguageSelection widget never renders in the pre-CLEAN-04 wrapper.** The `locales` property exposed by `getAppContext()` is a `Readable<ReadonlyArray<string>>` store (per `apps/frontend/src/lib/contexts/app/appContext.type.ts:30`), but `LanguageSelection.svelte:32` reads it as a plain array (`{#if locales.length > 1}`). At runtime this evaluates to `undefined > 1` → false, so the entire `<NavGroup>` block does not render — there is no language selection UI in the nav menu today. This is the exact wrapper tightening Phase 78 CLEAN-04 will land. The widget's contract (`localizeHref` + `data-sveltekit-reload`) is asserted indirectly via Test 2's direct URL navigation; after CLEAN-04 lands, Plan 06's spec re-validates against the tightened wrapper (Order B per CONTEXT D-06).

## E2E-08 Spec Details

**File:** `tests/tests/specs/voter/voter-locale-switching.spec.ts`

**Test titles (audit anchors for IMGPROXY_TIED_TITLES at `.planning/phases/73-determinism-baseline/post-fix/regen-constants.mjs:55-70`):**
- `voter locale switching (E2E-08) > locale switches via route prefix`
- `voter locale switching (E2E-08) > locale switches via LanguageSelection widget (when present)`

Both titles verified NOT to collide with the 14 IMGPROXY_TIED_TITLES bound patterns. The titles are distinctive (Paraglide / LanguageSelection terminology); no image-upload, candidate-auth, or maintenance-page collision.

**Translation key matches (verified at execution time):**
- `dynamic.frontPage.startButton` (en): "Find the Best Candidates and Parties!" → matched via regex `/Find the Best Candidates and Parties!/i`
- `dynamic.frontPage.startButton` (fi): "Löydä sopivimmat ehdokkaat ja puolueet!" → matched via regex `/Löydä sopivimmat ehdokkaat ja puolueet!/i` (NOT `/Aloita/i` as initially suggested in plan acceptance — verified by curl against `/fi`)
- `about.title` (en): "How Does This App Work?" → matched via regex `/How Does This App Work\?/i`
- `about.title` (fi): "Kuinka vaalikone toimii?" → matched via regex `/Kuinka vaalikone toimii\?/i`

**3-run determinism gate results (`yarn test:e2e --workers=1 --project voter-app --grep "voter locale switching"`):**

| Run | Outcome | Duration | Notes |
|-----|---------|----------|-------|
| 1   | 5/5 PASS | 9.3s | data-setup + 2 tests + 2 teardowns |
| 2   | 5/5 PASS | 8.9s | identical pass set |
| 3   | 5/5 PASS | 8.6s | identical pass set |

**DATA_RACE / PASS_LOCKED recommendation for Plan 07:** **PASS_LOCKED**. Spec is deterministic across 3 cold-start runs. No rationale needed for DATA_RACE entry.

**Order B re-validation note (for Plan 07's `74-VERIFICATION.md` "Dependency direction" field):**
- Phase 74 Plan 06 lands FIRST. The spec covers the pre-CLEAN-04 wrapper.
- Phase 78 CLEAN-04 will tighten the i18n wrapper (fix the `locales` Readable-vs-array destructuring bug at minimum, plus any other tightening).
- After Phase 78 CLEAN-04 lands, this spec re-validates against the tightened wrapper. **No spec changes are made in Phase 78** — only verification re-runs. If the wrapper tightening surfaces a NEW contract the widget click can verify, a follow-up E2E plan in Phase 78 or later may add the widget-click assertion path. For Phase 74 + Phase 78 closure, no spec edits are scheduled.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- **Plan 07 (verification gate):** Plan 06's spec is ready to enter the 3-run determinism + parity-script gate. Recommendation: PASS_LOCKED entry; no DATA_RACE pool growth.
- **Phase 78 CLEAN-04 anchor:** The LanguageSelection widget gating bug is documented inline in the spec header and in this SUMMARY. Phase 78's plan author should read this SUMMARY before authoring CLEAN-04 to understand the re-validation contract.

## Self-Check: PASSED

- `tests/tests/specs/voter/voter-locale-switching.spec.ts` — FOUND
- Commit `4c36fc404` — FOUND (`test(74-06): add voter-locale-switching spec for E2E-08`)
- Lint exit code 0 — FOUND (0 errors; 15 pre-existing dev-seed warnings unrelated)
- 3 cold runs × 5/5 PASS — FOUND (logs above)
- IMGPROXY_TIED_TITLES collision check — FOUND (no collision; grep against `.planning/phases/73-determinism-baseline/post-fix/regen-constants.mjs` exits 1 = no match)

---

*Phase: 74-high-leverage-e2e-coverage*
*Completed: 2026-05-11*
