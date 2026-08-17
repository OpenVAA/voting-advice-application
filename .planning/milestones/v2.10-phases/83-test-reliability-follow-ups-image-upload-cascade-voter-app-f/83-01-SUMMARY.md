---
phase: 83-test-reliability-follow-ups-image-upload-cascade-voter-app-f
plan: 01
subsystem: testing
tags:
  - playwright
  - parity-script
  - hydration-race
  - selector-drift
  - test-reliability
  - imgproxy
  - cascade-unblock

# Dependency graph
requires:
  - phase: 79-determinism-recovery-cascading-race-fix-constants-regen
    provides: post-fix/regen-constants.mjs + post-fix/sha-identity.mjs (Phase 83 Task 0 verbatim copies); v2.10 verification anchor (SHA ff0334f856…) absorbed and replaced
  - phase: 82-a11y-01-product-gap-cell-required-empty
    provides: A11Y-07 required-empty save-gate cell (Task 1 WR-01 surface); REVIEW.md §WR-01 + IN-01 + IN-02 advisory follow-ups inputs
  - phase: 81-a11y-01-product-gap-cells-email-url-format
    provides: A11Y-05 + A11Y-06 PASS_LOCKED entries deferred from Phase 81 P01 close (Task 8 IN-02 backfill input)
  - phase: 70-svelte-5-migration-cleanup
    provides: Input.svelte:532 button refactor (DETERM-06 D-01a selector-drift source)
  - phase: 76-profile-a11y
    provides: deferred-items §1 selector-drift documentation recommending getByRole('button').first()
provides:
  - DETERM-06 closed — image-upload cascade unblocked via 4-rung ladder (D-01a selector fix + D-01b 500ms settle delay + D-01c imgproxy re-enable + Rule-2 fill-required-empty)
  - DETERM-07a closed — voter-matching worst-match flake stabilized via hydration-completeness guard
  - DETERM-07b closed — voter-detail party-drawer flake stabilized + promoted from FAILURE-CLASS narrative to PASS_LOCKED
  - WR-01 closed — variant-hidden-required overlay now strips BOTH required-info answers
  - IN-01 closed — A11Y-01 spec docstring count corrected 3 → 6
  - IN-02 closed — A11Y-05 + A11Y-06 PASS_LOCKED entries backfilled (Phase 81 deferred)
  - v2.10 milestone-close anchor regenerated — 94 PASS_LOCKED + 15 DATA_RACE + 47 CASCADE at SHA d6bfeebdb0…
affects:
  - v2.10-close audit
  - v2.11+ parity gates (new anchor binding)
  - v2.11+ DATA_RACE pool review (15-entry binding preserved verbatim)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Hydration-completeness guard before .first()/.last() indexing (DETERM-07a/b)"
    - "Cheapest-first escalation ladder for filechooser cascades (D-01a → D-01b → D-01c)"
    - "Per-run db:reset retry-with-supabase-restart for imgproxy 502 flakes"

key-files:
  created:
    - .planning/phases/83-test-reliability-follow-ups-image-upload-cascade-voter-app-f/post-fix/regen-constants.mjs
    - .planning/phases/83-test-reliability-follow-ups-image-upload-cascade-voter-app-f/post-fix/sha-identity.mjs
    - .planning/phases/83-test-reliability-follow-ups-image-upload-cascade-voter-app-f/post-fix/run-1.json
    - .planning/phases/83-test-reliability-follow-ups-image-upload-cascade-voter-app-f/post-fix/run-2.json
    - .planning/phases/83-test-reliability-follow-ups-image-upload-cascade-voter-app-f/post-fix/run-3.json
    - .planning/phases/83-test-reliability-follow-ups-image-upload-cascade-voter-app-f/post-fix/sha256.txt
    - .planning/phases/83-test-reliability-follow-ups-image-upload-cascade-voter-app-f/post-fix/regen-output.txt
    - .planning/phases/83-test-reliability-follow-ups-image-upload-cascade-voter-app-f/post-fix/parity-gate-output.txt
    - .planning/phases/83-test-reliability-follow-ups-image-upload-cascade-voter-app-f/post-fix/imgproxy-audit.txt
    - .planning/phases/83-test-reliability-follow-ups-image-upload-cascade-voter-app-f/post-fix/smoke-output.txt
  modified:
    - tests/scripts/diff-playwright-reports.ts
    - tests/tests/pages/candidate/ProfilePage.ts
    - tests/tests/specs/candidate/candidate-profile.spec.ts
    - tests/tests/specs/candidate/candidate-profile-validation.spec.ts
    - tests/tests/specs/voter/voter-matching.spec.ts
    - tests/tests/specs/voter/voter-detail.spec.ts
    - tests/tests/setup/templates/variant-hidden-required.ts
    - apps/supabase/supabase/config.toml

key-decisions:
  - "DETERM-06 closed at D-01c+Rule-2: D-01a selector fix alone did NOT unblock the filechooser TIMEOUT; D-01b 500ms settle delay alone did NOT either; D-01c imgproxy re-enable plus Rule-2 fill-required-empty together unblocked the cascade. All 4 rungs landed."
  - "Rule-2 deviation: CAND-03 test fills test-question-required-empty-1 before submit to satisfy Phase 82's allRequiredFilled save-gate. Pre-Phase-82 this step was unnecessary; cascade-unblock exposed the implicit coupling."
  - "DETERM-07b hydration-guard locator corrected: initial attempt counted entity-card-action (15 elements — shared testId across parties+subcards); final fix asserts partySection's first h3 heading text '${expectedPartyCount} parties' per voter-results.spec.ts canonical pattern."
  - "WR-01 implemented as overlay-only fix per RESEARCH Pitfall 2 Option D — spec body unchanged (existing disabled-attribute assertions hold for ANY non-zero count); structural elimination of additive coupling lives in variant-hidden-required.ts only."
  - "3-run cold-start gate PASSED first-attempt SHA-256 identity: hash d6bfeebdb0ac29d3b1632095f6ae325b468a9e5193eb350cdcc6607848173d11. No D-09 instability protocol required."
  - "DATA_RACE pool 15-entry binding (Phase 73 D-09) preserved verbatim. 2 IMGPROXY-tied cascade-unblocks (CAND-12 readback + CAND-03 readback) stay in DATA_RACE per partition contract, not promoted to PASS_LOCKED."

patterns-established:
  - "Hydration-completeness guard before indexing: assert toHaveCount before .first()/.last() to absorb partial-hydration races"
  - "Multilingual input fill pattern: regex-i label + .first() + .blur() + wait-for-button-enable for text-multilingual question fills (mirrors candidate-profile-validation.spec.ts:358 canonical)"
  - "Imgproxy 502 carry-forward mitigation: db:stop → db:start retry loop in cold-start gate scripts (3 attempts)"

requirements-completed:
  - DETERM-06
  - DETERM-07

# Metrics
duration: ~3h
completed: 2026-05-13
---

# Phase 83 Plan 01: Test Reliability Follow-ups + v2.10 Milestone-Close Hygiene Summary

**Image-upload cascade unblocked via 4-rung ladder, voter-app flakes stabilized via hydration-completeness guards, v2.10-close anchor regenerated at SHA d6bfeebdb0… (94 PASS_LOCKED + 15 DATA_RACE + 47 CASCADE).**

## Performance

- **Duration:** ~3h (including 3-run cold-start gate ~60 min, ladder escalation re-smokes ~9 min, build-up + planning + commits)
- **Started:** 2026-05-13T~15:00Z
- **Completed:** 2026-05-13T18:02Z
- **Tasks:** 10 (Task 0 + Tasks 1-9 per PLAN.md)
- **Files modified:** 8 source files + 11 post-fix/ artifacts

## Accomplishments

- **DETERM-06 closed.** CAND-03 image-upload cascade in `candidate-profile.spec.ts` serial describe block is fully unblocked. 5 downstream tests (A11Y-02 × 3 persist + CAND-12 readback + CAND-03 readback) now run successfully in cold-start. Required all 4 ladder rungs (D-01a + D-01b + D-01c + Rule-2 deviation).
- **DETERM-07a closed.** voter-matching `should show worst match candidate as last result` now passes deterministically across 3 cold-start runs (was ~33% flake pre-Phase-83). PASS_LOCKED status preserved.
- **DETERM-07b closed.** voter-detail `should open party detail drawer with info, candidates, and opinions tabs` now passes deterministically and is promoted from FAILURE-CLASS narrative to PASS_LOCKED.
- **WR-01 closed.** variant-hidden-required overlay now strips both `test-question-displayname` AND `test-question-required-empty-1` from Alpha, eliminating implicit additive coupling with Phase 82's base-seed addition.
- **IN-01 closed.** `candidate-profile-validation.spec.ts` docstring count corrected from `3 reliably-renderable cells` / `all 3 test titles` to `6 reliably-renderable cells (3 original + 2 Phase 81 lifts + 1 Phase 82 standalone)` / `all 6 test titles`.
- **IN-02 closed.** A11Y-05 email-format + A11Y-06 url-format PASS_LOCKED entries backfilled (Phase 81 deferred entries; jsdoc + caveat replaced).
- **v2.10 milestone-close anchor regenerated.** New SHA `d6bfeebdb0ac29d3b1632095f6ae325b468a9e5193eb350cdcc6607848173d11`. 94 PASS_LOCKED (Phase 82 baseline 81 + 13 net additions), 15 DATA_RACE (Phase 73 D-09 binding preserved), 47 CASCADE (-10 from Phase 79).
- **DATA_RACE_TESTS unchanged at 15 entries.** Phase 73 D-09 structural binding preserved verbatim across Phase 73 → 74 → 75 → 79 → 83.
- **Both follow-up todos moved to `.planning/todos/done/`.**

## Task Commits

Each task was committed atomically (per Phase 79 D-10 precedent):

1. **Task 0 (Wave 0): Provision verification-gate artifacts** — NO COMMIT (staged with Task 8 atomic regen)
2. **Task 9 (Wave 0): Move follow-up todos to done/** — `68b8d3ffb` (chore)
3. **Task 6 (Wave 0): IN-01 docstring count fix** — `c5465a2e4` (docs)
4. **Task 1 (Wave 1): WR-01 overlay extend** — `da8a20c27` (fix)
5. **Task 2 (Wave 2): DETERM-06 D-01a selector fix** — `5cbf571ef` (fix)
6. **Task 3 (Wave 3): 1-run smoke + D-01b escalation** — `391733c3b` (fix — pre-filechooser settle delay)
7. **Task 3 (Wave 3): D-01c escalation** — `11157a4c3` (fix — imgproxy re-enable)
8. **Task 3 (Wave 3): Rule-2 deviation #1** — `93df979b1` (fix — fill required-empty)
9. **Task 4 (Wave 4): DETERM-07a worst-match hydration guard** — `a4a64373a` (fix)
10. **Task 5 (Wave 4): DETERM-07b party-drawer hydration guard (initial)** — `a721579b2` (fix)
11. **Task 3 (Wave 3): Rule-2 deviation #2 (multilingual disambiguation)** — `ee610d8f0` (fix — refine fill locator)
12. **Task 5 (Wave 4): DETERM-07b locator correction (Run-1 audit)** — `3bd526858` (fix — heading vs entity-card-action)
13. **Task 8 (Wave 6, ATOMIC): regen + IN-02 backfill + DETERM-07b promotion** — `11befb875` (chore)

**Total: 12 atomic commits** (Task 0 + Task 7 are no-commit gate executions per plan).

## Files Created/Modified

### Created
- `.planning/phases/83-…/post-fix/regen-constants.mjs` (Phase 79 verbatim copy; reportPath edited to 'run-3.json')
- `.planning/phases/83-…/post-fix/sha-identity.mjs` (Phase 79 verbatim copy)
- `.planning/phases/83-…/post-fix/run-{1,2,3}.json` (3-run cold-start full-suite captures)
- `.planning/phases/83-…/post-fix/sha256.txt` (3-run SHA-256 identity check; PASS at `d6bfeebdb0…`)
- `.planning/phases/83-…/post-fix/regen-output.txt` (94/15/47 partitioned arrays from `node regen-constants.mjs`)
- `.planning/phases/83-…/post-fix/parity-gate-output.txt` (4 PARITY GATE PASS results: self-identity + run-1/2, 2/3, 1/3)
- `.planning/phases/83-…/post-fix/imgproxy-audit.txt` (14 titles, 15 matches; D-09 binding clean)
- `.planning/phases/83-…/post-fix/smoke-output.txt` (final D-01c+Rule-2 smoke output: `32 passed (1.1m)`)

### Modified
- `tests/scripts/diff-playwright-reports.ts` — Constants regen (94 PASS_LOCKED + 15 DATA_RACE + 47 CASCADE), Phase 83 jsdoc + FAILURE-CLASS narrative + Phase 81 caveat replacement.
- `tests/tests/pages/candidate/ProfilePage.ts` — D-01a getByRole('button').first() + D-01b 500ms settle delay + D-01e jsdoc refresh + eslint-disable drop.
- `tests/tests/specs/candidate/candidate-profile.spec.ts` — Rule-2 fill-required-empty before submit in CAND-03 (with multilingual disambiguation refinement).
- `tests/tests/specs/candidate/candidate-profile-validation.spec.ts` — IN-01 docstring count fix.
- `tests/tests/specs/voter/voter-matching.spec.ts` — DETERM-07a hydration-completeness guard (cards.toHaveCount(expectedRanking.length)).
- `tests/tests/specs/voter/voter-detail.spec.ts` — DETERM-07b hydration-completeness guard (partySection heading text contains `${expectedPartyCount} parties`) + E2E_ORGANIZATIONS import + expectedPartyCount module-scope const.
- `tests/tests/setup/templates/variant-hidden-required.ts` — WR-01 overlay extends to strip BOTH required-info answers from Alpha.
- `apps/supabase/supabase/config.toml` — D-01c re-enable `[storage.image_transformation]` block.
- `.planning/todos/pending/2026-05-13-candidate-profile-image-upload-cascade.md` → `.planning/todos/done/...` (Task 9).
- `.planning/todos/pending/2026-05-13-voter-matching-detail-flakes.md` → `.planning/todos/done/...` (Task 9).

## Decisions Made

1. **DETERM-06 ladder cumulative resolution.** CONTEXT D-01d's "1-run smoke between each rung" was honored. Smoke 1 (D-01a only) reproduced the filechooser TIMEOUT. Smoke 2 (D-01a + D-01b 500ms settle delay) reproduced same failure. Smoke 3 (D-01a + D-01b + D-01c imgproxy re-enable) moved the failure off filechooser onto a NEW failure mode (submit button disabled by Phase 82's `canSubmit && allRequiredFilled` gate). Rule-2 deviation: added `fill('Sentinel 83 …')` before submit. Smoke 4: GREEN — `32 passed (1.1m)` with all 5 cascade-downstream tests running.

2. **DETERM-07b locator correction (run-1 audit deviation).** First DETERM-07b guard attempt counted `entity-card-action` testId in partySection — but that testId is shared by both party top-level links AND nested candidate subcards (run-1.json measured 15 elements, not 4 parties). Switched to the canonical voter-results.spec.ts pattern: assert partySection's first h3 heading text matches `${expectedPartyCount} parties`. The click target stays as `getByTestId('entity-card-action').first()` (resolves to first party-card top-level link in DOM order).

3. **WR-01 Pitfall 2 Option D resolution.** CONTEXT D-05 said "tighten spec assertion to `=== 2`". RESEARCH Pitfall 2 discovered the SETTINGS-03 spec has NO `length` assertion to tighten — it only asserts DOM-level disabled-attribute on buttons (works for ANY non-zero count). The structural elimination of the implicit additive coupling lives entirely in the OVERLAY; the spec is unmodified.

4. **3-run cold-start gate first-attempt PASS.** SHA-256 identity gate passed first attempt at hash `d6bfeebdb0ac29d3b1632095f6ae325b468a9e5193eb350cdcc6607848173d11`. No D-09 instability protocol required (contrast: Phase 79 needed 3 fresh runs after initial trio diverged). Phase 83's DETERM-07a + DETERM-07b fixes eliminated the voter-app flake sources that caused Phase 79's initial divergence.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical Functionality] D-01a + D-01b alone did NOT unblock the cascade — escalated through full D-01d ladder.**
- **Found during:** Task 3 (Wave 3 1-run smoke gate)
- **Issue:** CONTEXT D-01a expected the selector-drift fix to unblock the filechooser TIMEOUT. Smoke 1 reproduced the TIMEOUT verbatim (`Test timeout of 90000ms exceeded. waiting for event "filechooser" at ProfilePage.uploadImage`).
- **Fix:** Per CONTEXT D-01b → D-01c → Rule-2 ladder, committed each escalation as its own atomic commit. D-01b (500ms settle delay) alone still RED. D-01c (imgproxy re-enable in `apps/supabase/supabase/config.toml:130-131`) moved the failure off filechooser onto a NEW failure mode (submit-disabled-by-Phase-82-gate). Rule-2 fill-required-empty unblocked the cascade.
- **Files modified:** `tests/tests/pages/candidate/ProfilePage.ts` (D-01b settle delay), `apps/supabase/supabase/config.toml` (D-01c imgproxy re-enable), `tests/tests/specs/candidate/candidate-profile.spec.ts` (Rule-2 fill required-empty).
- **Verification:** Smoke 4 (all 4 rungs applied) PASSED — `32 passed (1.1m)` in candidate-app-mutation project; all 5 cascade-downstream tests ran.
- **Committed in:** `391733c3b` (D-01b), `11157a4c3` (D-01c), `93df979b1` (Rule-2 v1), `ee610d8f0` (Rule-2 v2 — multilingual disambiguation refinement).

**2. [Rule 1 - Bug] DETERM-07b initial guard locator was structurally wrong (run-1.json audit).**
- **Found during:** Task 7 (Wave 5 3-run gate, run-1 audit)
- **Issue:** My initial DETERM-07b fix asserted `partySection.getByTestId('entity-card-action').toHaveCount(4)` — but `entity-card-action` testId is shared by BOTH party top-level links AND nested candidate subcards. Run-1.json measured 15 elements (4 parties + 11 subcard candidates). The guard's count expectation was structurally wrong; the test failed in run-1.
- **Fix:** Switched to the canonical voter-results.spec.ts pattern: assert partySection's first h3 heading text matches `${expectedPartyCount} parties`. Stable regardless of nested subcard count.
- **Files modified:** `tests/tests/specs/voter/voter-detail.spec.ts`.
- **Verification:** Restarted 3-run gate after the locator correction. Runs 1/2/3 all PASS DETERM-07b deterministically. `should open party detail drawer` promoted to PASS_LOCKED in the regen.
- **Committed in:** `3bd526858`.

**3. [Rule 3 - Blocking issue] Imgproxy 502 carry-forward (Phase 79 STATE infrastructure debt) tripped run 2's db:reset.**
- **Found during:** Task 7 (Wave 5 3-run gate, run 2 db:reset phase)
- **Issue:** `yarn db:reset` failed with `Error status 502: An invalid response was received from the upstream server` between runs 2 and 3 — the known Supabase imgproxy 502 carry-forward (STATE infrastructure debt entry).
- **Fix:** Added retry-with-supabase-restart loop to the gate script (`yarn db:stop && yarn db:start && retry`). Per-run resilience preserved without polluting test results.
- **Files modified:** /tmp/runs-2-3.sh (driver script — not committed, runtime-only).
- **Verification:** Runs 2 and 3 completed successfully after restart. SHA-256 identity gate PASS first-attempt.
- **Committed in:** N/A (runtime gate driver only; documented in `post-fix/three-run-gate-driver.log`).

---

**Total deviations:** 3 auto-fixed (1 Rule-2 + 1 Rule-1 + 1 Rule-3)
**Impact on plan:** All deviations necessary for closing DETERM-06 cascade and the 3-run gate. No scope creep; all deviations stayed in-domain (test-spec fixes + a single dev-only Supabase storage config flip).

## Issues Encountered

1. **Imgproxy 502 carry-forward.** Phase 79 STATE infrastructure debt entry tripped during the 3-run gate's db:reset between runs 2 and 3. Resolved via supabase stop/start retry loop in the gate script. Not a code issue; recurrence-tolerant.

2. **Multilingual input fill semantics (Rule-2 v1 → v2 refinement).** Initial Rule-2 fill used `getByLabel('Required-empty (Phase 82 A11Y-07 anchor)')` without `.first()` — but `test-question-required-empty-1` renders as `text-multilingual` (type=text + no disableMultilingual on profile route), so multiple inputs share the accessible name via aria-labelledby. The fill silently missed propagating the reactive state. Refined to regex-i + `.first()` + `.blur()` + wait-for-button-enable per `candidate-profile-validation.spec.ts:358` canonical pattern. v2 smoke PASSED.

3. **Gate process interruption during DETERM-07b correction.** After run-1 audit revealed the DETERM-07b locator bug, the in-flight 3-run gate (already on run 2) needed to be aborted, gate state cleaned, and restarted with the corrected code. Driver script preserves run-1 results would have been incorrect; restarted from scratch. Final 3-run gate (all post-correction) PASSED SHA-256 identity first-attempt.

## User Setup Required

None — no external service configuration changes required. The `apps/supabase/supabase/config.toml` `[storage.image_transformation]` block was un-commented, but this is a dev-only Supabase storage block (imgproxy URL transforms in local dev). Production Supabase Cloud handles imgproxy at the platform layer.

## Next Phase Readiness

**v2.10 milestone is ship-ready.** All 5 phases (79, 80, 81, 82, 83) closed. v2.10-close anchor at SHA `d6bfeebdb0…` is the binding parity gate for v2.11+.

Verified for v2.10 close:
- 94 PASS_LOCKED tests (largest contract since v2.6).
- 15 DATA_RACE pool (Phase 73 D-09 binding preserved verbatim).
- 47 CASCADE (pre-existing variant cascades; routed to v2.11+).
- 4 parity gates PASS (self-identity + all pair-wise run-1/2, 2/3, 1/3).
- IMGPROXY_TIED_TITLES audit clean (14 titles, 15 matches; pool unchanged).
- Both follow-up todos closed and moved to done/.
- 3 Phase 82 advisory items closed (WR-01 option (b), IN-01 docstring, IN-02 backfill).

Deferred to v2.11+:
- 47 CASCADE entries (variant-project chains: variant-allowopen, variant-constituency, variant-multi-election, variant-results-sections, variant-startfromcg, variant-1e-Nc, variant-Ne-Nc, variant-hidden-required, variant-low-minimum-answers).
- ~10 FAILURE-CLASS items (voter-app-popups dismissal-after-reload, voter-navigation results-CTA threshold, voter-not-located-redirect /results deeplink, voter-popup-hydration full-page-load, voter-question-rendering boolean + categorical, voter-results filter-toggle no-effect-update-depth, voter-feedback-persistence, voter-visibility-required SETTINGS-03 hidden absent, voter-detail case (d) both-missing). Filed as backlog items.
- Imgproxy 502 carry-forward (Phase 79 STATE infrastructure debt) — recurrence-tolerant; addressed via retry-loop in cold-start gate scripts.

## Self-Check

Verifying load-bearing claims:

- [x] `tests/scripts/diff-playwright-reports.ts` PASS_LOCKED count = 94 ✓
- [x] DATA_RACE count = 15 (Phase 73 D-09 binding preserved) ✓
- [x] CASCADE count = 47 ✓
- [x] All 4 parity gates PASS (self-identity + run-1/2, 2/3, 1/3) ✓
- [x] SHA-256 identity hash `d6bfeebdb0ac29d3b1632095f6ae325b468a9e5193eb350cdcc6607848173d11` ✓
- [x] All 12 atomic commits exist on `feat-gsd-roadmap` branch ✓
- [x] post-fix/ directory contains 11 artifacts (regen-constants.mjs, sha-identity.mjs, run-{1,2,3}.json, sha256.txt, regen-output.txt, parity-gate-output.txt, imgproxy-audit.txt, smoke-output.txt + 3 stderr/exit logs + driver.log) ✓
- [x] Both follow-up todos at `.planning/todos/done/2026-05-13-{candidate-profile-image-upload-cascade,voter-matching-detail-flakes}.md` ✓
- [x] No `test-question-required-empty-1` references in `tests/tests/specs/candidate/candidate-required-info.spec.ts` (WR-01 Pitfall 2 Option D — spec unmodified) ✓

**Self-Check: PASSED**

---
*Phase: 83-test-reliability-follow-ups-image-upload-cascade-voter-app-f*
*Completed: 2026-05-13*
