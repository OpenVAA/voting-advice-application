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

_Pending — recorded by Task 2._

---

## D-03 gate summary

| # | Gate | Result |
|---|------|--------|
| 1 | Build (`yarn build`) | ✅ GREEN (14/14) |
| 2 | Full unit suite | ✅ GREEN (60 files / 769 tests) |
| 3 | svelte-check ≤ pinned baseline | ✅ PASS (151 ERR / 1 WARN, delta 0) |
| 4 | One full `yarn test:e2e` run | _pending (Task 2)_ |
