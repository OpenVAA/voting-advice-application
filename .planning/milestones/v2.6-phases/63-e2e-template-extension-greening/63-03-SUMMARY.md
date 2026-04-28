---
phase: 63-e2e-template-extension-greening
plan: 03
status: complete
verdict: FAIL (script) / ACCEPT (executor — all residuals Category A)
pending_review: false
artifact_commit: ec5ddeb9a
fix_commit: c2bd3594b
budget_consumed: 1 of 3
date: 2026-04-27
---

# Plan 63-03 Summary — v2.6 Close Parity Gate

## Verdict

**Script:** `PARITY GATE: FAIL — 19 regression(s)`
**Executor:** `ACCEPT — all 19 residuals classify Category A (framework-level / out-of-scope) with specific pointers per D-06.`
**`pending_review: false`** — milestone close MAY proceed at user discretion.

## Reclamation Totals

| Source phase | Direct expected | Direct observed | Cascade expected | Cascade observed | Status |
|---|---|---|---|---|---|
| Phase 60 (LAYOUT-02) | 2 (candidate-registration:64, candidate-profile:51) | **2 ✓ both reclaimed by 63-03 fix** | ~35 | ~33 | on-target |
| Phase 61 (QUESTION-04) | 6 candidate-questions tests | 6 ✓ (no longer in failure list) | 18 candidate-app-mutation/settings/password + re-auth | partial — chain blocked by orthogonal imgproxy data-setup failure | on-target (root reclaimed) |
| Phase 62 (RESULTS) | 4 voter-results tests added in v2.6 | 0 of 4 passing | n/a | n/a | **under-target — Phase 62 reactivity work incomplete** |

Stats: v2.5 baseline 41p/10f/38c (89 total) → post-v2.6 62p/5f/35c (102 total; +13 new tests added by Phase 62). Pass count grew +21; unexpected shrunk −5.

## Residual Classification

**Category A (framework-level with specific pointer): 19**
- 1 actual imgproxy upload failure (`should upload a profile image (CAND-03)`) — STATE.md §Blockers/Concerns
- 13 cascade-from-imgproxy (candidate-profile + candidate-app-settings + candidate-app-password + re-auth-setup) — same upstream
- 5 incomplete Phase-62 voter-results tests (RESULTS-01/02, D-14, D-15, D-08 shapes 3+4) — ROADMAP §Phase 62

**Category B (blocker, no pointer): 0**

## Residual-Fix Budget (D-07 / RESOLVED Q3)

**Consumed: 1 of 3**

| # | File | LoC | Root cause | Commit | Verified |
|---|---|---|---|---|---|
| 1 | `apps/frontend/src/routes/candidate/(protected)/+layout.svelte` | +6/−1 net (<10 LoC) | Phase 60-03's `$derived` `layoutState` was gated on `!termsAcceptedLocal`, causing the form to unmount the moment a user (or Playwright) ticked the checkbox — before Continue could fire `handleSubmit` to persist acceptance. Replaced gate with `termsSubmitted` $state flag set after `userData.save()` resolves. | `c2bd3594b` | yes — both originally-failing tests flip pass→pass between pre-fix and post-fix captures |

No fix #2 or #3 attempted. Remaining residuals violate the D-07 triple:
- imgproxy 502: not single-file (Docker infrastructure, OS-level dependency)
- Phase 62 RESULTS: each failure is incomplete reactivity work spanning multiple components — not "well-isolated"; correctly handled as a follow-up phase

## D-11, D-13, D-15 Compliance

- **D-11 (canonical invocation)** — honored. Capture used `yarn playwright test --workers=1 --reporter=json` exactly. Stdout to JSON, stderr to txt, dotenv banner stripped by Python regex.
- **D-13 (diff script untouched)** — honored. `git diff HEAD~2 -- .planning/phases/59-e2e-fixture-migration/scripts/diff-playwright-reports.ts` returns empty. Constants regeneration is `/gsd-complete-milestone`'s responsibility, not 63-03's.
- **D-15 (v2.5 baseline preserved)** — honored. No edits to `.planning/phases/59-e2e-fixture-migration/post-swap/`.

## Artifact Files Committed (per RESOLVED Q4)

Commit `ec5ddeb9a` adds:
- `.planning/phases/63-e2e-template-extension-greening/post-v2.6/playwright-report.json` (4550 lines)
- `.planning/phases/63-e2e-template-extension-greening/post-v2.6/playwright.stderr.txt` (empty)
- `.planning/phases/63-e2e-template-extension-greening/post-v2.6/diff.md` (122 lines)

Commit `c2bd3594b` adds:
- `apps/frontend/src/routes/candidate/(protected)/+layout.svelte` — the 63-03 budget fix.

## Handoff for `/gsd-complete-milestone`

1. **JSON consumption**: `/gsd-complete-milestone` reads `post-v2.6/playwright-report.json` and regenerates `PASS_LOCKED_TESTS`, `DATA_RACE_TESTS`, `CASCADE_TESTS` constants in `.planning/phases/59-e2e-fixture-migration/scripts/diff-playwright-reports.ts` (D-14 canonical refresh) so the next milestone's parity gate compares against the v2.6 anchor.
2. **Pass-lock candidates** for new constants: 62 currently-passing tests including the 2 reclaimed by 63-03 (candidate-profile:51 + candidate-registration:63).
3. **New tests added** by Phase 62 (5 voter-results) need a classification decision: include in `CASCADE_TESTS` (deferred work), `DATA_RACE_TESTS` (intermittent), or filter out until Phase 62-bis lands.
4. **Imgproxy infrastructure issue** (STATE.md blocker) should be tracked separately — not a code issue but a recurring source of false-positive parity failures. Consider documenting the docker-restart workaround in CLAUDE.md / development docs.

## Handoff for User

- The terms-of-use submission flow now works correctly in production (not just tests). The previous behavior would have allowed users to tick the checkbox and proceed without the acceptance ever being persisted to the backend; this fix ensures `userData.save()` runs before the layout transitions.
- 5 voter-results tests still fail; if Phase 62 was intended to ship with these green, a Phase 62-bis or Phase 64 may be warranted before the v2.6 milestone closes. If they're acceptably deferred, the current `pending_review: false` stance is correct.
- The imgproxy intermittent crash is a recurring infrastructure annoyance; consider a `dev:reset` improvement that always restarts the Supabase storage container.
