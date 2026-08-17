---
phase: 121-e2e-specs-flow-coverage
plan: 07
subsystem: testing
tags: [playwright, e2e, analytics, umami, consent, userPreferences, tracking, privacy]

# Dependency graph
requires:
  - phase: 121-05
    provides: voter-prefs-tracking Playwright project + perm-analytics-tracking triad wiring
  - phase: 121-04
    provides: perm-analytics-tracking dev-seed template (analytics-armed app_settings singleton — platform.name umami + trackEvents true)
  - phase: 119
    provides: trackingIntercept fixture (window.umami.track capture seam, getTrackCalls/clear)
provides:
  - EFLOW-08 spec — tracking emit-under-consent vs suppress-without-consent + user-preferences round-trip
  - Consent-gate regression guard (no umami emission without consent='granted', threat T-121-CON)
affects: [121-08, phase-130, e2e-coverage]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Same-window tracking-buffer flush via forced visibilitychange (avoids hard-nav teardown of the capture array)"
    - "Grant consent through the DataConsentPopup dialog (scoped getByRole('dialog')) — the canonical voter consent surface"
    - "userPreferences round-trip through the real versioned localStorage envelope (version preserved from the UI-driven consent write)"

key-files:
  created:
    - tests/tests/specs/voter/voter-prefs-tracking.spec.ts
  modified: []

key-decisions:
  - "Flush the tracking buffer via a forced document visibilitychange→hidden on the SAME window, not a navigation — a hard page.goto tears down the window (and the __trackCalls capture array) before it can be read; the visibilitychange handler (+layout.svelte:188-194) calls submitAllEvents() in place."
  - "Drive consent through the DataConsentPopup modal (scoped to getByRole('dialog')) rather than the inline privacy-page DataConsent — the popup auto-opens when consent is indetermined and overlays the inline copy, causing a strict-mode 2-element clash; the popup is also the canonical voter consent surface."
  - "Round-trip feedback.status/survey.status by patching the app's existing versioned localStorage envelope (preserving the version written by the UI consent grant) so the reload read passes getItemFromStorage's version gate — never fabricate a version."

patterns-established:
  - "flushTrackingBuffer(page): forces visibilityState hidden + dispatches visibilitychange to trigger submitAllEvents on the current window for in-place emission capture."
  - "grantConsentViaPopup(page): clicks the dialog-scoped granted button, asserts the popup closes — the runtime consent-arming step (NOT seeded)."

requirements-completed: [EFLOW-08]

# Metrics
duration: ~35min
completed: 2026-06-16
---

# Phase 121 Plan 07: voter-prefs-tracking (EFLOW-08) Summary

**Perm-hosted E2E spec asserting umami tracking emits a pageview + bundled dataConsent_granted startEvent only after runtime consent is granted, stays empty under the consent gate, and that every persisted user-preference (consent + feedback.status + survey.status) survives a reload.**

## Performance

- **Duration:** ~35 min
- **Started:** 2026-06-16
- **Completed:** 2026-06-16
- **Tasks:** 1
- **Files modified:** 1 created

## Accomplishments
- New `voter-prefs-tracking.spec.ts` (3 tests) hosted under the `voter-prefs-tracking` project (analytics-armed singleton via `data-setup-perm-analytics-tracking`).
- EMISSION test: grant consent at runtime via the DataConsentPopup → flush buffer in place → assert `getTrackCalls()` contains a `pageview` track call whose data bundle includes the prefixed `dataConsent_granted` subevent key (proves BOTH the immediate track boundary and the buffered startEvent action).
- SUPPRESSION test: without consent, flush the buffer on the same window → `getTrackCalls()` is `[]` (consent-gate regression guard, threat T-121-CON).
- PREFS round-trip: consent granted via UI (real versioned envelope), feedback.status + survey.status patched through the same envelope, reload, re-read all three through the version gate — each round-trips; reloaded app still reflects granted consent (inline button disabled).
- Cardinal 3× determinism gate green (re-seeding the analytics overlay before each `--no-deps` rerun per the shared `app_settings` singleton discipline).

## Task Commits

1. **Task 1: EFLOW-08 tracking emit/suppress + prefs round-trip** - `979217361` (test)

**Plan metadata:** (this docs commit)

## Files Created/Modified
- `tests/tests/specs/voter/voter-prefs-tracking.spec.ts` - EFLOW-08: trackingIntercept emit-vs-suppress (getTrackCalls) + userPreferences round-trip; consent granted at runtime via DataConsentPopup.

## Decisions Made
- See `key-decisions` frontmatter (flush mechanism, popup-scoped consent, versioned-envelope round-trip).

## Deviations from Plan

The plan's stated emission/flush mechanism ("navigate/unload to trigger submitAllEvents") had to be adapted to a same-window flush. Logged as a Rule 1/3 adaptation:

### Auto-fixed Issues

**1. [Rule 1 - Bug] Same-window flush instead of hard navigation for emission capture**
- **Found during:** Task 1 (EMITS test)
- **Issue:** The plan suggested flushing buffered events by navigating/unloading. A hard `page.goto` tears down the window — and with it the `window.__trackCalls` capture array the trackingIntercept fixture reads — so the flush's emission was lost and `getTrackCalls()` came back empty. (The first full run failed on the emission poll for exactly this reason.)
- **Fix:** Added `flushTrackingBuffer(page)` which forces `document.visibilityState='hidden'` and dispatches `visibilitychange`, invoking the layout's `submitAllEvents()` (+layout.svelte:188-194) on the CURRENT window so the capture array survives the read. Applied to both EMITS and SUPPRESSION for a symmetric, navigation-free flush.
- **Files modified:** tests/tests/specs/voter/voter-prefs-tracking.spec.ts
- **Verification:** 3/3 tests pass, 3× determinism gate green.
- **Committed in:** 979217361

**2. [Rule 1 - Bug] Consent granted via dialog-scoped DataConsentPopup (strict-mode clash)**
- **Found during:** Task 1 (EMITS test)
- **Issue:** `getByRole('button', { name: /agree to share my data/i })` matched TWO buttons — the inline privacy-page DataConsent and the auto-opened DataConsentPopup (modal Alert) — a Playwright strict-mode violation; the modal also overlays/blocks the inline control.
- **Fix:** Added `grantConsentViaPopup(page)` scoping the granted button to `getByRole('dialog')` and asserting the popup closes after the click. The post-reload round-trip check uses the inline button (the popup does not reopen once consent is granted).
- **Files modified:** tests/tests/specs/voter/voter-prefs-tracking.spec.ts
- **Verification:** 3/3 tests pass, 3× determinism gate green.
- **Committed in:** 979217361

**3. [Rule 1 - Bug] Home URL for base locale is `/` (no `/en` prefix)**
- **Found during:** Task 1 (initial nav-based flush attempt, later superseded)
- **Issue:** An interim implementation asserted the post-flush URL matched `/\/en\/?$/`, but `getRoute.current('Home')` for the base locale resolves to the root `/` under Paraglide. (Superseded entirely by the same-window flush, which needs no navigation — the URL assertion was removed.)
- **Fix:** Removed navigation-based flush + URL assertion in favour of `flushTrackingBuffer`.
- **Files modified:** tests/tests/specs/voter/voter-prefs-tracking.spec.ts
- **Verification:** 3/3 tests pass.
- **Committed in:** 979217361

---

**Total deviations:** 3 auto-fixed (all Rule 1 — test-mechanism bugs). All discovered + fixed within Task 1 before commit; the committed spec reflects the final, green mechanism.
**Impact on plan:** No scope change — same EFLOW-08 assertions (emit/suppress + 3-field round-trip), more robust mechanism. No app code touched.

## Issues Encountered
- **`voter-journey` E2E fails in the full dependency-driven run (OUT OF SCOPE).** `voter-journey.spec.ts` (not modified by Plan 07) fails at its end-to-end test; because it is a setup dependency in the perm serial chain, the failure cascades and `voter-prefs-tracking` "did not run" under full deps. Plan 07 was verified in isolation instead: seed `data-setup-base` + `data-setup-perm-analytics-tracking` with `--no-deps`, then run `voter-prefs-tracking --no-deps` (3/3 green, 3×). Logged to `deferred-items.md` — `voter-journey` is sibling-plan scope (EFLOW-01/04) and must be fixed for the full-suite green at wave merge.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- EFLOW-08 complete; `voter-prefs-tracking` project green 3× in isolation.
- BLOCKER for full-suite green: `voter-journey` end-to-end failure (sibling-plan scope) must be resolved at wave merge before the cardinal full `yarn test:e2e` can pass ("did not run" counts as failure).

## Self-Check: PASSED

- FOUND: `tests/tests/specs/voter/voter-prefs-tracking.spec.ts`
- FOUND: `.planning/phases/121-e2e-specs-flow-coverage/121-07-SUMMARY.md`
- FOUND: commit `979217361`

---
*Phase: 121-e2e-specs-flow-coverage*
*Completed: 2026-06-16*
