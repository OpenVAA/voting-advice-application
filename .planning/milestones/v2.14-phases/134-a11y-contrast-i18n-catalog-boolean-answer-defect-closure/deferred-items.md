# Phase 134 — Deferred Items

Out-of-scope discoveries logged during execution. Per the executor SCOPE BOUNDARY rule these are
NOT fixed here — they are recorded so they are not silently lost.

---

## DEF-134-04-01 — `@openvaa/dev-seed` NF-01 seed-budget assertion fails locally (root `yarn test:unit`)

- **Found during:** Plan 04, Task 2 (running the plan's root-level `yarn test:unit` verification)
- **Symptom:** `yarn test:unit` (turbo, all workspaces) exits 1. Frontend is green
  (54 files / 773 tests). The single failure is in `@openvaa/dev-seed`:

  ```
  FAIL  tests/integration/default-template.integration.test.ts
        > default template integration (DX-03)
        > applies default template and meets NF-01 (<10s) + D-58-20 assertions
  AssertionError: expected 23630 to be less than 10000
   Test Files  1 failed | 41 passed (42)
        Tests  1 failed | 443 passed (444)
  ```

- **Nature:** a **wall-clock performance budget** (NF-01, seed step ≤ 10 000 ms), not a
  correctness assertion. All 443 other dev-seed tests pass, including every row-count,
  relational-wiring, portrait and locale-fan-out assertion in the same file's suite.
- **Why it is out of scope for Plan 04:** this plan's entire diff is one file,
  `apps/frontend/src/lib/i18n/tests/translations.test.ts`. `packages/dev-seed/package.json`
  declares no dependency on `@openvaa/frontend` (deps: `app-shared`, `core`, `matching`,
  `supabase-types`, `supabase-js`, `faker`, `zod`), and `grep -rn 'openvaa/frontend'` over
  `packages/dev-seed/` returns nothing. There is no path by which a frontend unit test can
  affect this timing.
- **Probable cause (unverified):** the test is gated on `SUPABASE_URL` and seeds a **live**
  local Supabase. It was run on a developer machine with a dev server already attached to that
  same instance, so the 10 s budget was measured under contention. The budget was authored for
  a quiet CI runner.
- **Deliberately NOT re-run to confirm:** re-running mutates the shared local database, and the
  phase brief scopes the live environment to Plans 06/08's E2E gate. The test does self-teardown
  (`seed_` prefix + `TEST_PROJECT_ID` storage cleanup), so the one run it got left no residue.
- **Suggested owner:** a dev-seed/perf phase. Either re-baseline NF-01 against a measured
  quiet-machine distribution, or make the budget assertion CI-only
  (`it.skipIf(!process.env.CI)`) so a loaded dev box does not red the local suite.
