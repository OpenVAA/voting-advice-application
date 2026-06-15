# Phase 119 — Deferred / Out-of-Scope Items

Discoveries logged during execution that are OUT OF SCOPE for the plan that found them
(SCOPE BOUNDARY: only auto-fix issues directly caused by the current task's changes).

## From Plan 119-07 (EFLOW fixtures/helpers)

### DEF-119-07-01 — Pre-existing `simple-import-sort` error in `dev-seed/src/templates/index.ts`

- **Found during:** Plan 119-07, Task 2 (`yarn lint:check` gate).
- **File:** `packages/dev-seed/src/templates/index.ts` (line ~16, import block).
- **Error:** `simple-import-sort/imports — Run autofix to sort these imports!` —
  `permAccessDisableTemplate` import is sorted out of order relative to
  `permAnswersLockedTemplate` (capital-`A` vs lowercase ordering).
- **Owner:** introduced by commit `b723973c5` (`feat(119-04): add customData.terms to
  e2e/base + reconcile registry`) — a SIBLING plan's committed file. NOT touched by
  Plan 119-07 (this plan touches only `tests/tests/fixtures/**`).
- **Impact:** the monorepo-wide `yarn lint:check` exits 1 on `@openvaa/dev-seed#lint`.
  Plan 119-07's own five fixture files lint clean (exit 0) — the A3 locator-guard
  intent for THIS plan's deliverables is satisfied.
- **Fix:** trivial one-line autofix — `cd packages/dev-seed && yarn lint:fix` (or
  reorder the `permAccessDisableTemplate` import above `permAnswersLockedTemplate`).
- **Disposition:** ✅ RESOLVED by the execute-phase orchestrator at the post-Wave-3
  integration gate (`yarn workspace @openvaa/dev-seed lint:fix` — 1-line import reorder).
  Cross-plan gate failures are orchestrator-owned; `dev-seed lint:check` now exits 0 (errors).

## From Plan 119-08 (fixtures-first smoke/probes)

### DEF-119-08-01 — 4 perm-seeded probes deferred to Phase 120 (isolation-first re-diagnosis + UNCONFIRMED root-cause)

- **Found during:** Plan 119-08, Task 3 (`checkpoint:human-verify` — run each probe green
  against the running app). Reached 4/8 live-green; the 4 perm-seeded probes blocked at the
  checkpoint. SC1 (typecheck:tests + locator guard with all 8 probes present) is GREEN; SC2
  is PARTIAL.
- **Disposition:** ⏭ DEFERRED to **Phase 120** by operator decision (2026-06-15). Plan 119-08
  closes on SC1-green + 4/8-live; the 4 below remain **NOT live-proven** and carry forward.

**The 4 deferred probes + their seed templates:**

| Probe | Seed template | Probe file |
|-------|---------------|------------|
| video | `perm-question-video` | `tests/tests/specs/_probes/video.probe.spec.ts` |
| questionInfo | `perm-interactive-info` | `tests/tests/specs/_probes/questionInfo.probe.spec.ts` |
| popupNotice | `show-feedback-survey` | `tests/tests/specs/_probes/popupNotice.probe.spec.ts` |
| orgMatching | `perm-org-matching` | `tests/tests/specs/_probes/orgMatching.probe.spec.ts` |

**Per-probe seed + run commands** (each in ISOLATION — perm templates clobber the
`app_settings` singleton; copied from the 119-08 SUMMARY checkpoint table). Setup:
local Supabase up, a Vite frontend on a free port (5173 is occupied by the broken Docker
build), `FRONTEND_PORT=<port>`, and a `_probes`-scoped Playwright project (the base config
scopes each project's testDir to a specific subdir, so `_probes/` matches no project — Phase
120 adds the proper `_probes`/setup project; this session used a throwaway ad-hoc config,
not committed). `...` = `npx playwright test -c <probes-config> <name>`.

| Probe | Seed command | Run command |
|-------|--------------|-------------|
| video | `yarn db:seed --template perm-question-video` | `... video.probe` |
| questionInfo | `yarn db:seed --template perm-interactive-info` | `... questionInfo.probe` |
| popupNotice | `yarn db:seed --template show-feedback-survey` | `... popupNotice.probe` |
| orgMatching | `yarn db:seed --template perm-org-matching` | `... orgMatching.probe` |

**CONDITION 1 — Isolation-first diagnosis (binding):** in Phase 120 these 4 probes MUST first
be re-tested in TRUE ISOLATION — minimal mixing with other tests/seeds, a fresh/clean env —
to diagnose the failures correctly. The 119-08 evidence came from a contaminated, multi-run,
degraded-env session (stale long-lived Vite server, /results cold-start timeouts, repeated
perm re-seeds) and must NOT be trusted as a clean signal.

**CONDITION 2 — Diagnosis flagged UNCONFIRMED (binding):** the recorded 119-08 root-cause
verdict — that the minimal perm seeds make `voterCtx.selectedQuestionBlocks` churn enough that
the `voter-questions-start` Button (a) detaches mid-click (TOCTOU) and (b) intermittently never
mounts, and that the full `e2e/base` seed "doesn't churn this way" — is **UNCONFIRMED /
SUSPICIOUS**, NOT established fact. Phase 120 must independently RE-DIAGNOSE before any fix.
Operator objections to answer:
  1. **Counterintuitive:** a SMALLER seed (1–5 questions) churning MORE than the larger
     `e2e/base` seed is unexplained — less data should naively be more stable.
  2. **Two failure modes conflated:** mid-click detach (TOCTOU) vs. never-mounts are lumped
     under one "reactive churn" banner WITHOUT an actual trace/measurement separating them.
  3. **Env confound unaddressed:** the degraded Vite env (stale modules, /results cold-start
     timeouts) could ITSELF produce intermittent mount failures independent of seed size.

**Suspected-but-UNCONFIRMED work item:** the shared `tests/tests/fixtures/voter/voter-journey.fixture.ts`
intro-start hardening (a churn-robust mount→click→navigate around the `voter-questions-start`
Button) is the *suspected* fix — but it is NOT to be applied until the isolation-first
re-diagnosis confirms it. A naive one-line `dispatchEvent('click')` change at
`voter-journey.fixture.ts:209` was tried in 119-08 and REVERTED (it regressed the base journey
/ entityFilters probe). The fix should be done with the proper `_probes` setup-project wiring
that Phase 120 adds (which keeps perm seeds out of the shared serial chain), not forced onto
the broadly-used journey fixture under a flaky env.
