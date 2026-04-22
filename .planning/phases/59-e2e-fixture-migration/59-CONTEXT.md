# Phase 59: E2E Fixture Migration - Context

**Gathered:** 2026-04-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Swap the E2E test data source from hand-authored JSON fixtures to the
generator-backed `e2e` template shipped in Phase 58. Prove parity against
the current JSON-fixture Playwright baseline (15 pass / 19 data-race fail /
55 cascade). Delete the legacy fixtures only after parity is proven in
both local and CI runs. Finalize the D-24 `supabaseAdminClient` split
decision per E2E-04.

Deliverables:

- Baseline Playwright JSON report captured from `main` pre-swap, committed
  under `.planning/phases/59-e2e-fixture-migration/baseline/`
- `tests/seed-test-data.ts` rewritten as a thin wrapper calling the
  `@openvaa/dev-seed` public entry with the `e2e` template
- Playwright global-teardown swapped to use the package teardown API
- Post-swap Playwright run produces a pass/fail set that satisfies the
  parity delta rule (all previously-passing tests still pass; no new
  regressions)
- Legacy fixtures deleted in the same PR, final commit, only after CI is
  green on the swap commit:
  - `tests/tests/data/default-dataset.json`
  - `tests/tests/data/voter-dataset.json`
  - `tests/tests/data/candidate-addendum.json`
  - Any orphaned overlay files under `tests/tests/data/overlays/`
- Zero remaining references to those filenames anywhere in the repo
  (grep + tsc enforcement)
- VERIFICATION.md documents the D-24 split rationale per E2E-04 and
  confirms no circular dependencies were introduced

Explicitly **out of scope:**
- Fixing any of the 19 pre-existing data-race E2E failures — owned by
  the "Svelte 5 Migration Cleanup" future milestone
- Fixing any of the 55 cascade failures caused by the data-race
  upstream
- Expanding the `e2e` template beyond what existing specs require
- Moving the dev-seed base back to `tests/` or adding new helpers to it

**Carried forward (no re-asking):**
- Phase 56 56-CONTEXT.md — D-24 split: `@openvaa/dev-seed` owns
  `bulkImport`, `bulkDelete`, `importAnswers`, `linkJoinTables`,
  `updateAppSettings`, the constructor, the shared maps, and
  `TEST_PROJECT_ID`. `tests/` retains auth/email helpers (`setPassword`,
  `forceRegister`, `unregisterCandidate`, `sendEmail`,
  `sendForgotPassword`, `deleteAllTestUsers`, `safeListUsers`,
  `fixGoTrueNulls`) + legacy E2E utilities (`findData`, `query`,
  `update`, `documentId` alias) via a subclass / composition wrapper.
  Phase 56 Plan 10 confirmed the subclass route. E2E-04's "either stays
  or moves" requirement is already answered; Phase 59 documents, does
  not re-litigate.
- Phase 58 58-CONTEXT.md — D-58-15 authored the `e2e` template via
  Playwright spec audit; Phase 59 consumes it as a ready-to-use built-in.
- Memory: "did not run" E2E tests count as failures in all counts
  (cascade failures from upstream dependencies).
- Baseline context: 15 pass / 19 data-race fail / 55 cascade — this
  is the pass/fail set Phase 59 must preserve.

</domain>

<decisions>
## Implementation Decisions

### Baseline Capture (E2E-03)
- **D-59-01:** **Baseline captured from `main`** — checkout main at the
  commit Phase 59 branches from, run
  `yarn dev:reset && yarn dev && (wait for health) && yarn test:e2e`,
  save the Playwright JSON report. This is the contract the post-swap
  run must satisfy. Capture happens as the first commit of Phase 59.
- **D-59-02:** **Baseline artifact home**: committed at
  `.planning/phases/59-e2e-fixture-migration/baseline/playwright-report.json`
  plus a hand-written `baseline/summary.md` listing:
  - Baseline commit SHA
  - Capture date
  - 15 passing test names (the locked set)
  - 19 data-race failing test names (the shifting pool)
  - 55 cascade failing test names
  - Total runtime
  Committed permanence beats CI-artifact retention (90d expiry); the
  summary.md survives for future maintainers to re-verify the gate.
- **D-59-03:** **Exact Playwright invocation** for both baseline and
  post-swap runs:
  ```
  yarn dev:reset
  yarn dev &
  # wait for Supabase API (:54321) + Vite dev server (:5173) to respond
  yarn test:e2e --reporter=json,list --workers=1
  ```
  `--workers=1` serializes test execution to remove parallelism as a
  variance source (relevant because the 19 known failures are
  data-race flakes whose incidence depends on concurrency). `json,list`
  gets both the machine-parseable report and a human-readable console.
  Planner codifies the wait-for-healthy loop as a small shell script
  or inline in the baseline-capture commit.

### Parity Delta Rule (E2E-03)
- **D-59-04:** **Pass-set is locked, fail-set may shift within the
  19-race pool only.** Formal rule:
  - Every test in the baseline **pass** set MUST pass post-swap
  - Every test in the baseline **cascade-fail** set must still fail
    (or pass) — "did not run" counts as a failure per stored memory
  - Tests in the baseline **data-race fail** set may pass or fail
    post-swap (they are known flakes)
  - **No test previously in pass + cascade sets may enter the
    data-race or any new fail set** — the data-race pool does not
    grow
  Produces a deterministic gate: a single test_case diff comparing
  the two reports, filtering out the known data-race test names,
  must show empty delta.

### seed-test-data.ts Rewrite (E2E-01)
- **D-59-05:** **Thin wrapper pattern.** Post-rewrite file is ~15-20
  lines:
  ```ts
  import { config } from 'dotenv';
  import { seedDatabase } from '@openvaa/dev-seed';

  config();
  await seedDatabase({ template: 'e2e' });
  ```
  All complexity lives behind the `@openvaa/dev-seed` public API. No
  inline pipeline construction, no direct generator imports, no
  per-test template overrides (reject D-59 third option).
  If a Playwright spec needs a variant dataset, it composes a small
  template inline and passes a path to the CLI — but that's a per-spec
  concern not a Phase 59 deliverable.
- **D-59-06:** **Playwright teardown switches to the package teardown
  API.** Existing `clearTestData()` (or whatever the current path is
  called) is replaced by a call to the Phase 58
  `seedTeardown({ externalIdPrefix: 'seed_' })` entry (exact name is
  planner's call). No belt-and-suspenders double-teardown.
- **D-59-07:** **No pre-flight drift check.** If the `e2e` template
  from Phase 58 doesn't produce what a spec expects, that spec's own
  testId assertions fail with clear "element not found" errors — fix
  either the template or the spec, as normal. A dedicated pre-flight
  validator would couple the seed step to verification concerns and
  rot over time; Phase 59 trusts the Phase 58 audit (D-58-15) +
  natural test-failure signals.

### Fixture Deletion Ordering (E2E-02)
- **D-59-08:** **Same PR, final commit, CI-gated.** Commit sequence:
  1. `baseline capture` — baseline report + summary
  2. `swap` — rewrite `tests/seed-test-data.ts`, wire teardown
  3. `post-swap verify` — post-swap report + diff analysis
  4. `delete legacy fixtures` — only if commit 2's CI is green
  Commit 4 may be amended / squashed into commit 3 if parity is proven
  locally and CI round-trip isn't needed — but the default flow waits
  for CI green before deletion.
- **D-59-09:** **Verify zero references via grep + TypeScript.** Before
  committing the delete:
  ```
  grep -rn 'default-dataset.json\|voter-dataset.json\|candidate-addendum.json' \
    --exclude-dir=node_modules --exclude-dir=.planning --exclude-dir=.git
  ```
  must return zero hits. After the delete, `yarn build` catches any
  residual import statements via tsc errors. No bespoke check script;
  the two existing tools are sufficient.
- **D-59-10:** **Orphan overlay cleanup.** `tests/tests/data/overlays/`
  and other JSON files under `tests/tests/data/` that are ONLY consumed
  by the three deleted fixtures also get deleted. The audit during the
  Phase 58 `e2e` template authoring (D-58-15) identifies which overlay
  files are used vs orphaned; Phase 59 deletes the orphans alongside
  the main three. Non-fixture media (test-poster.jpg, test-video.mp4,
  etc.) stays — those are referenced directly by specs.

### supabaseAdminClient Finalization (E2E-04)
- **D-59-11:** **Keep the D-24 split; document and verify.** Phase 59
  produces a VERIFICATION.md section that:
  1. Restates the D-24 split boundary
  2. Confirms no circular dependencies introduced (run `madge` or
     `depcruise` or equivalent dep-graph analyzer; attach output)
  3. Lists the public surface of `@openvaa/dev-seed` vs the
     `tests/` shell as a reference table
  No code moves in Phase 59. E2E-04's "either stays or moves" clause
  is already answered by D-24.

### Rollback / Failure Handling
- **D-59-12:** **Fix forward, no rollback.** If the post-swap parity
  check shows a regression, the phase stays open: debug the failure,
  adjust the e2e template or the seed-test-data.ts wrapper or
  (worst case) surface a needed `@openvaa/dev-seed` API change and
  land it, then re-run parity. Phase 59 does NOT complete until the
  parity gate passes. No git revert of the swap commit unless debugging
  truly exhausts the options — in which case Phase 59 is paused and
  converted to an investigation ticket, but that's an operational
  decision outside the workflow.
- **D-59-13:** **19 data-race failures are explicitly out of scope.**
  Phase 59 does NOT attempt to fix or reduce them. If one flakes
  differently post-swap but stays within the data-race pool, that's
  acceptable per D-59-04. Reducing these belongs to the "Svelte 5
  Migration Cleanup" future milestone (listed in PROJECT.md §Milestones).
  VERIFICATION.md explicitly notes this scope boundary.
- **D-59-14:** **Git flow: linear commits on `feat-gsd-roadmap`.**
  Continues the pattern from Phases 56-58. One commit per plan, per
  GSD convention. `git revert <sha>` on an individual commit if any
  specific plan needs undo. No phase-specific branches; no pre-merge
  squash.

### Claude's Discretion
- Exact command + library choice for circular-dependency verification
  (`madge`, `depcruise`, `yarn workspaces foreach run typecheck` to
  force-fail on cycles, etc.) — planner's call.
- Whether `baseline/summary.md` is generated by script or hand-written
  — either works; script reduces rot but adds maintenance.
- Exact shell script or inline snippet that implements
  `wait-for-healthy` in D-59-03 — `curl` retry loop, `wait-on`,
  custom Node script are all fine.
- Decision on whether to amend commit 3 into commit 4 vs keep as
  separate commits (D-59-08) — follow CI feedback-loop latency on
  the day.
- Which existing Playwright teardown entry point gets swapped
  (`global-teardown.ts` vs a pre-test cleanup vs both) — planner
  audits current tests/ setup.

### Folded Todos
None — milestone-internal scope.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone & Prior-Phase Context
- `.planning/ROADMAP.md` §"Phase 59: E2E Fixture Migration" — goal, 4
  success criteria
- `.planning/REQUIREMENTS.md` — E2E-01, E2E-02, E2E-03, E2E-04
- `.planning/phases/56-generator-foundations-plumbing/56-CONTEXT.md` —
  D-24 split boundary (load-bearing for E2E-04)
- `.planning/phases/57-latent-factor-answer-model/57-CONTEXT.md` —
  latent emitter wired; not directly used by e2e template (D-58-16:
  e2e template has `generateTranslationsForAllLocales: false`; answers
  flow through the latent emitter only if the e2e spec audit
  established specific candidate-answer contracts that depend on it)
- `.planning/phases/58-templates-cli-default-dataset/58-CONTEXT.md` —
  D-58-15 e2e template audit, D-58-16 translations flag, D-58-17
  teardown permissiveness

### Phase 58 Deliverables (Phase 59 consumes)
- `packages/dev-seed/src/templates/e2e.ts` — the built-in e2e template
  from Phase 58
- `@openvaa/dev-seed` public entry — `seedDatabase()` + `seedTeardown()`
  (or equivalent names from Phase 58 D-58-08)
- CLI commands `yarn dev:seed --template e2e` / `yarn dev:seed:teardown`
  — Phase 59 may call these directly from Playwright teardown, or use
  the programmatic API

### Existing E2E Infrastructure (Phase 59 rewrites / reads)
- `tests/seed-test-data.ts` — 88 lines currently; Phase 59 shrinks to ~20
- `tests/tests/data/default-dataset.json` — DELETE in Phase 59
- `tests/tests/data/voter-dataset.json` — DELETE in Phase 59
- `tests/tests/data/candidate-addendum.json` — DELETE in Phase 59
- `tests/tests/data/overlays/` — audit for orphans, delete unused
- `tests/tests/data/assets/` — KEEP (non-fixture media referenced by
  specs directly)
- `tests/tests/utils/supabaseAdminClient.ts` — post-D-24 subclass
  shell; Phase 59 does NOT modify, only verifies
- Playwright config (`playwright.config.ts` or similar — planner
  confirms path) — source of the current test runner + reporter
  configuration
- Playwright global setup / teardown files — target for D-59-06
  teardown swap
- `tests/tests/*.spec.ts` — the spec files whose testId assertions
  become the natural drift detector per D-59-07

### Baseline Reference
- Run environment baseline: 15 passed / 19 data-race failed / 55
  cascade — captured in STATE.md and PROJECT.md §Current State
- 19 data-race failures + 55 cascades are pre-existing from v2.4; they
  are deferred to "Svelte 5 Migration Cleanup" milestone

### Stored Memory Policy
- "E2E did not run" tests count as failures in all counts per stored
  memory `feedback_e2e_did_not_run.md` — load-bearing for D-59-04's
  delta-rule interpretation

### Circular-Dependency Verification Tools (D-59-11)
- Candidates: `madge`, `dependency-cruiser`, `yarn workspaces foreach
  -A run typecheck`. Planner picks one that fits the existing tool
  surface (check if either is already in catalog before adding).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`@openvaa/dev-seed` public API** — Phase 58 ships this; Phase 59
  just calls it.
- **`tests/tests/utils/supabaseAdminClient.ts`** — post-D-24 shell;
  Phase 59 verifies it but doesn't change it.
- **Playwright JSON reporter** — built into Playwright; no new tool.
- **Grep + tsc** — D-59-09's verification pipeline uses existing tools;
  no new infrastructure.

### Established Patterns
- **GSD per-plan atomic commits** — phase branches accumulate commits
  per plan. Phase 59 extends the pattern; one commit each for baseline,
  swap, post-swap verify, fixture delete.
- **VERIFICATION.md as phase-completion gate** — every prior phase has
  one. Phase 59's documents the D-24 decision, baseline → post-swap
  delta, and zero-circular-deps confirmation.
- **`feat-gsd-roadmap` branch continues** — no branch switching between
  phases.

### Integration Points
- **`tests/seed-test-data.ts`**: rewritten (shrinks from 88 lines to
  ~15-20).
- **Playwright global-teardown file**: one-line swap to call the
  package's teardown entry.
- **Test CI job (`.github/workflows/e2e.yml` or similar)**: no change —
  the baseline run is a local captured artifact; CI continues running
  its normal E2E flow which will pass/fail based on the new seed path.
- **`tests/tests/data/`**: deleted files. Directory itself may become
  empty modulo `assets/`; planner decides whether to keep the directory
  or collapse.
- **No `packages/dev-seed/*` changes** — Phase 59 is pure consumer-side
  work.

</code_context>

<specifics>
## Specific Ideas

- **Baseline commit SHA is load-bearing** — future readers of
  `baseline/summary.md` need to be able to re-capture if ever needed;
  the SHA locks the state of the world at capture time.
- **`--workers=1` on the Playwright baseline run** — the 19 data-race
  failures depend on concurrency. Serializing removes concurrency
  as a variance source; the same flag applies to both baseline and
  post-swap runs so they're comparable.
- **The diff tool for comparing the two JSON reports** should be a
  small script (or inline jq filter) that filters out the 19
  known-race test names and reports the delta. Planner writes the
  script as part of the swap plan.
- **Circular-dep verification artifact** — store output of the
  dep-graph tool (e.g. `madge --circular --extensions ts packages/`)
  in `.planning/phases/59-.../deps-check.txt` so the E2E-04
  documentation has concrete evidence, not a claim.
- **Teardown idempotency matters** — if the package teardown is called
  twice (e.g. Playwright retries the afterAll hook), it must no-op
  cleanly. Phase 58 D-58-17's permissive prefix deletion is already
  idempotent (deleting a row that doesn't exist is a no-op); confirm
  in the Phase 59 plan.
- **CI timing** — the post-swap run in CI is the parity gate; the
  delete-fixtures commit waits for that CI to go green. If CI takes
  >30 min, planner may choose to run the delete locally after CI
  passes and push both commits together — operational judgment.

</specifics>

<deferred>
## Deferred Ideas

- **Fixing the 19 data-race E2E failures** — explicitly out of scope
  (D-59-13). Belongs to the "Svelte 5 Migration Cleanup" future
  milestone.
- **Moving auth/email helpers from `tests/` to `@openvaa/dev-seed`** —
  rejected (D-59-11 keeps D-24 split).
- **Hard-rollback rollback on parity failure** — rejected (D-59-12
  fix-forward).
- **Mechanical port of JSON fixtures to the e2e template** — already
  rejected at Phase 58 D-58-15 via the audit-first approach; noted
  here for completeness.
- **Pre-flight drift detector (`e2e` template shape validator)** —
  rejected (D-59-07). Specs are the natural contract; a second layer
  rots.
- **Removing `--workers=1` from E2E runs going forward** — deferred.
  Phase 59 uses `--workers=1` only for the parity-gate comparison.
  Whether the production CI flow uses parallelism is a separate
  concern (the existing `yarn test:e2e` command may already default
  to parallel; planner audits).
- **Pruning `tests/tests/data/assets/`** — keep; those are non-fixture
  media referenced by specs directly.

</deferred>

---

*Phase: 59-e2e-fixture-migration*
*Context gathered: 2026-04-22*
