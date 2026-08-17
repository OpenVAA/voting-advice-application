# Phase 123 — D-03 Acceptance Gate (evidence record)

**Authored:** 2026-06-17 (plan 123-04)
**Purpose:** The committed, auditable acceptance-gate evidence for Phase 123 (svelte-5-idiom-polish). Records all four D-03 gate results: build, full frontend unit suite, svelte-check ERRORS/WARNINGS vs the pinned `123-BASELINE.md`, and one full `yarn test:e2e` run (the cardinal final trust signal).

**Git HEAD at gate run:** `8f9fedc9b` (branch `feat-gsd-roadmap`) — Waves 0-1 committed (both RUNES-05 bug fixes landed; RUNES-01/02 audit-and-document only, 0 source `.svelte` migrations per `123-LIFECYCLE-DISPOSITIONS.md`).
**Tree state:** Only the unrelated pre-existing root `package.json` working-tree edit (a `db:reset-with-e2e-data` script) — not in this phase's surface; not staged.

---

## Gate 1 — Build (`yarn build`, Turborepo)

**Command:** `yarn build`
**Result:** ✅ GREEN — `14 successful, 14 total` (4 cached). Frontend (`@openvaa/frontend:build`) built in 7.65s via `@sveltejs/adapter-node` (`✔ done`).

> Note: turbo emitted three pre-existing `no output files found for task …#build` WARNINGS for `@openvaa/dev-seed`, `@openvaa/dev-tools`, `@openvaa/supabase-types` — these are `turbo.json` `outputs`-key config notes (cacheability hints), NOT build failures. All 14 build tasks exited successfully.

## Gate 2 — Full frontend unit suite (`yarn workspace @openvaa/frontend test:unit`)

**Command:** `yarn workspace @openvaa/frontend test:unit`
**Result:** ✅ GREEN — `Test Files  60 passed (60)` / `Tests  769 passed (769)` in 3.65s.

Includes the Wave-0 `candidateContext` regression test (Bug 1 — `entityType` passed to the blocks-path `getApplicableQuestions`) and Tests 5+6 in `candidateUserDataState.svelte.test.ts` (Bug 2 — tri-state `termsOfUseAccepted` `!== undefined` guards). Both bug-regression tests are GREEN.

## Gate 3 — svelte-check ERRORS/WARNINGS vs pinned baseline (criterion 4)

**Command:** `yarn workspace @openvaa/frontend check`
**Machine-readable summary line (verbatim):**

```
COMPLETED 2672 FILES 151 ERRORS 1 WARNINGS 30 FILES_WITH_PROBLEMS
```

| Metric | Pinned baseline (`123-BASELINE.md`) | This run | Verdict |
|--------|--------------------------------------|----------|---------|
| ERRORS | 151 | **151** | ✅ ≤ baseline (delta 0 — no net-new errors) |
| WARNINGS | 1 | **1** | ✅ ≤ baseline (delta 0) |
| FILES_WITH_PROBLEMS | 30 | 30 | (informational — unchanged) |

> The `FILES` total (2672 here vs 2086 at baseline) differs because `check` runs `svelte-kit sync` first, which regenerates a tree-state-dependent count of route/`.svelte-kit` type files; the criterion-4 gate is the ERRORS/WARNINGS counts (per `123-BASELINE.md` § Criterion-4 rule), which match the pinned baseline exactly.

**Error-family spot-check (all pre-existing TYPE-01/02 deferrals, outside Phase-123 surface):** `qs` ambient module (TS7016) at `routes/api/data/[collection]/+server.ts`, `routes/(voters)/constituencies/+page.svelte`; admin-jobs `cookies` does-not-exist drift across `routes/api/admin/jobs/**/+server.ts`; route string→number at `questions/+layout.svelte:232` and `candidate/(protected)/questions/[questionId]/+page.svelte:282`; settings `currentPassword`/`confirmPasswordTestId` prop drift at `candidate/(protected)/settings/+page.svelte`. These match the baseline's three documented families verbatim — no Phase-123 edit added to the count.

**Criterion 4:** ✅ PASS — ERRORS 151 ≤ 151, WARNINGS 1 ≤ 1.

## Gate 4 — Full E2E suite (`yarn test:e2e`) — cardinal final trust signal

**Run command:** `yarn test:e2e` (root → `playwright test -c ./tests/playwright.config.ts ./tests --grep-invert @probe`)
**Environment:** host Vite dev server on :5173 (fresh restart) + local Supabase (clean `yarn db:reset`, storage settled to HTTP 200). No Docker. No Playwright `webServer` (the suite assumes one externally-managed dev server).

**Result (trusted-config run):** ✅ GREEN — **`125 passed (9.0m)`** — zero failed, zero did-not-run/cascade-failed.

Bug-1 behavior-neutrality (Pitfall 4) confirmed: the `candidate-journey` full end-to-end spec (exercises the candidate questions flow on the default single-entity-type seed) plus the candidate-questions perm specs (`perm-hide-hero`, `perm-disable-allow-open`) are all within the 125-passed suite — no opinion questions disappear from the addition of `entityType` to the blocks-path `getApplicableQuestions`. Per `123-LIFECYCLE-DISPOSITIONS.md` there were **0 source `.svelte` lifecycle/reactive-`let` migrations** in Waves 0-1, so NO borderline lifecycle site required a flagged-spec re-verification beyond the full green suite.

### Determinism note (two non-deterministic full-suite flakes before the trusted run)

Two earlier full-suite attempts each surfaced a single failure on a **different** spec, both of which **passed in isolation** — confirming environment non-determinism, NOT a Phase-123 code regression:

| Attempt | Outcome | Failing spec | Isolated re-run |
|---------|---------|--------------|-----------------|
| 1 | 81 passed / 1 failed / 43 did-not-run (cascade) | `perm-localisation-positive` EFLOW-06 | ✅ PASS (52/52) — setup logged "Database is NOT fresh" (residual non-test data) |
| 2 | 124 passed / 1 failed | `voter-journey-mobile` EFLOW-11 | ✅ PASS (3/3) — long-lived dev server (HMR staleness over a ~9m run) |
| 3 (trusted) | **125 passed / 0 failed / 0 did-not-run** | — | — |

Root cause (per project memory `project_e2e_hmr_staleness_restart` + `project_bank_auth_e2e_env_and_determinism`): a long-lived Vite dev server serves stale large/SSR modules mid-run, and a `db:reset` immediately followed by `yarn dev`'s own `seed.sql` left the DB "not fresh." The documented remedy — restart the dev server fresh + re-`db:reset` (letting the known storage-502 wedge settle to 200) + re-run the FULL suite — produced the clean 125/125 trusted-config run above. Each failing spec was a different one, none reproduced, both passed in isolation → flake, not regression. No flaky-skip, no retry-until-green: the FULL suite is green on the trusted configuration, satisfying the cardinal rule.

**Gate 4:** ✅ PASS — one full `yarn test:e2e` run is fully green (125/125, zero did-not-run).

---

## D-03 gate summary

| # | Gate | Result |
|---|------|--------|
| 1 | Build (`yarn build`) | ✅ GREEN (14/14) |
| 2 | Full unit suite | ✅ GREEN (60 files / 769 tests) |
| 3 | svelte-check ≤ pinned baseline | ✅ PASS (151 ERR / 1 WARN, delta 0) |
| 4 | One full `yarn test:e2e` run | ✅ GREEN (125/125, 0 did-not-run) |

**All four D-03 acceptance gates PASS.** Phase 123 criterion 3 (both RUNES-05 bug fixes verified by targeted unit tests + the green E2E suite), criterion 4 (no net-new svelte-check errors, 151/1 = baseline), and the behavior-neutrality of RUNES-01/02 (0 source migrations + green E2E) are all satisfied.
