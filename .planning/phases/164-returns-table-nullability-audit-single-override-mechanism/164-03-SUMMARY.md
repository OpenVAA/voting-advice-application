---
phase: 164-returns-table-nullability-audit-single-override-mechanism
plan: 03
subsystem: infra
tags: [ci, github-actions, supabase, type-generation, drift-gate, repo-meta-spec, vitest]

requires:
  - phase: 164-returns-table-nullability-audit-single-override-mechanism
    provides: "164-01's database.overrides.ts / database.merged.ts override locus (what a regeneration could revert) and 164-02's assert:rpc-nullability lint:check link (what this plan's spec pins)"
  - phase: 156-supabase-schema-corrections
    provides: "the migrations 00001-00004 whose applied state is the schema the local regeneration was performed against"
provides:
  - "the supabase-types-drift job in .github/workflows/main.yaml — unfiltered, path-scoped diff, starts and stops Supabase itself"
  - "packages/dev-seed/tests/rpcNullabilityGate.test.ts — 7 assertions, each proven able to fail, pinning the job's existence, its deliberate lack of a paths-filter, its path-scoped diff and the lint:check link"
  - "ROADMAP criterion 4 discharged by an ACTUAL regeneration with the exit code recorded, plus two probes proving the observing instrument is not vacuous"
  - "a measured correction: packages/supabase-types/tsconfig.tsbuildinfo is neither tracked nor ungitignored, contrary to the premise carried by the plan, 164-RESEARCH R8 and this phase's earlier notes"
affects: [164-04, 164-05, 163-ci-gates, any future yarn db:types regeneration, Phase 156 follow-on schema work]

actuals:
  tokens: 3653
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "Comment-stripped vs raw block assertion pair: a negative assertion runs on the comment-stripped job block and its positive mirror on the raw block, so a job whose whole point is explaining an absence cannot fail its own gate"
    - "Reversible live-schema probe: CREATE TABLE then regenerate then DROP then regenerate, with a sha256 equality check proving the restore was byte-exact — a way to prove a drift diff can report failure without touching git history"

key-files:
  created:
    - packages/dev-seed/tests/rpcNullabilityGate.test.ts
  modified:
    - .github/workflows/main.yaml

key-decisions:
  - "Proceeded with the .github/workflows/main.yaml edit although the plan's Task 1 precondition (Phase 163 landed) is literally unmet, because the orchestrator confirmed 163 is not running and the precondition's stated purpose is parallel-edit conflict avoidance — recorded as a deviation, not silently"
  - "Placed the job's explanatory comment INSIDE the job block rather than above the job key, because the plan's own awk extraction starts after the key and an above-key comment would have been attributed to dev-seed-integration, making the raw-block assertion unsatisfiable"
  - "Corrected the shipped justification for the path-scoped diff after measuring that tsconfig.tsbuildinfo is untracked and gitignored — the scoping stayed, its false reason did not"
  - "Proved criterion 4 with two probes rather than one observation: R1 (a live schema change makes the scoped diff exit 1) and R2 (a renamed override key is TS2344, not a silent no-op)"

patterns-established:
  - "An observation of 'the guarantee survived' is only evidence once the observing instrument has been made to report the opposite"
  - "A permanent comment's justification is measured before it ships; a correct decision resting on a false stated reason is corrected at the reason, not left standing"

requirements-completed: [CIGATE-04, CIGATE-05]

coverage:
  - id: D1
    description: "A CI job regenerates packages/supabase-types/src/database.ts against a live local Supabase and fails on a path-scoped diff, so a regeneration cannot silently revert the RETURNS TABLE nullability override"
    requirement: CIGATE-04
    verification:
      - kind: other
        ref: "Task 1 gate: job key count 1; comment-stripped block has 0 paths-filter, 0 unscoped `git diff --exit-code`, 1 scoped diff naming packages/supabase-types/src/database.ts; exit 0"
        status: pass
      - kind: other
        ref: "yaml.parse of .github/workflows/main.yaml -> jobs list includes supabase-types-drift with 9 steps; npx prettier --check exit 0"
        status: pass
    human_judgment: false
  - id: D2
    description: "The job carries NO paths-filter, so a Supabase CLI version change that alters generator output with no repo path changing still reddens the build"
    requirement: CIGATE-04
    verification:
      - kind: unit
        ref: "packages/dev-seed/tests/rpcNullabilityGate.test.ts#carries NO path filter, so a generator change with no repo path changing still reddens"
        status: pass
      - kind: other
        ref: "probe P2: a dorny/paths-filter block inserted into the job -> spec exit 1 naming that assertion; reverted, 0 tree changes"
        status: pass
    human_judgment: false
  - id: D3
    description: "The drift gate is not silently deletable: a committed repo-meta vitest pins the job name, the filter absence, the scoped diff, and the assert:rpc-nullability link in lint:check"
    requirement: CIGATE-04
    verification:
      - kind: unit
        ref: "yarn workspace @openvaa/dev-seed test:unit rpcNullabilityGate -> 7 passed, exit 0"
        status: pass
      - kind: other
        ref: "probes P1, P2, P3(corrected), P4, P5, P6, P7 -> each assertion made to fail by mutation and restored; 7/7 proven non-vacuous"
        status: pass
    human_judgment: false
  - id: D4
    description: "ROADMAP criterion 4: regeneration was actually performed against a live local Supabase and its outcome observed, not assumed"
    requirement: CIGATE-05
    verification:
      - kind: other
        ref: "yarn db:start exit 0; supabase migration list -> 00001-00004 applied; yarn db:types exit 0; git diff --exit-code -- packages/supabase-types/src/database.ts EXIT 0; sha256 unchanged at e5b2f7da957f4ed621a707084fa4b91b9cb0934f248b70c8dd65343a6a753acd"
        status: pass
      - kind: other
        ref: "probe R1: CREATE TABLE public.gsd_probe_164 -> yarn db:types -> scoped diff EXIT 1 showing +gsd_probe_164; DROP TABLE -> yarn db:types -> EXIT 0 and sha256 byte-identical to the pre-probe value"
        status: pass
    human_judgment: false
  - id: D5
    description: "The type-level nullability survived the regeneration, and would fail loudly rather than no-op if it had not"
    requirement: CIGATE-05
    verification:
      - kind: other
        ref: "git status --porcelain packages/supabase-types/ -> 0 lines: the generator wrote only src/database.ts and left database.overrides.ts and database.merged.ts untouched"
        status: pass
      - kind: other
        ref: "probe R2: an override key renamed to parent_nomination_id_dropped -> yarn workspace @openvaa/supabase-types typecheck EXIT 2, error TS2344 naming the key; reverted, exit 0"
        status: pass
      - kind: other
        ref: "yarn workspace @openvaa/frontend check -> 2750 FILES 0 ERRORS 0 WARNINGS after the regeneration; node scripts/assert-rpc-return-nullability.mjs exit 0"
        status: pass
    human_judgment: false
  - id: D6
    description: "The supabase-types-drift job is observed running green in CI"
    verification: []
    human_judgment: true
    rationale: "STRUCTURALLY UNOBSERVABLE ON THIS BRANCH, and deliberately not claimed. .github/workflows/main.yaml triggers only on push and pull_request against `main`; this work is on integration/ship-12-squash, which has never run CI. The job's shape, YAML validity, step vocabulary and gate logic are proven locally, but no GitHub Actions run of it exists or can exist here. Discharge on the branch's first PR to main, alongside the identical standing item from Phase 137."
  - id: D7
    description: "Full E2E suite green after this plan"
    verification: []
    human_judgment: true
    rationale: "Not called for by this plan's verification block and no runtime behaviour changed: the deliverables are a CI workflow job, a repo-meta vitest, and a regeneration that produced a byte-identical file. yarn lint:check ran the full monorepo typecheck (23/23, 0 cached) and the frontend check reported 0 errors and 0 warnings. Plan 164-05 owns the phase E2E gate and must run yarn db:reset first — see Next Phase Readiness."

duration: 15 min
completed: 2026-09-03
status: complete
---

# Phase 164 Plan 03: The Regeneration-Drift Gate Summary

**An unfiltered `supabase-types-drift` CI job that regenerates the Supabase types against a live stack and fails on a path-scoped diff, pinned by a seven-assertion repo-meta vitest whose every assertion was made to fail on purpose — and criterion 4 discharged by actually running `yarn db:types` and recording `git diff --exit-code` = 0, with two probes proving that instrument can report 1.**

## Performance

- **Duration:** 15 min
- **Started:** 2026-09-03T08:48:16Z
- **Completed:** 2026-09-03T09:03:00Z
- **Tasks:** 3
- **Files modified:** 2 (1 created, 1 modified)

## Accomplishments

- **Criterion 4 is discharged by measurement, not by reasoning.** `yarn db:types` was run against a live local Supabase with migrations `00001`–`00004` applied, and `git diff --exit-code -- packages/supabase-types/src/database.ts` returned **exit 0** — the committed file is current and the override survived.
- **That exit 0 is meaningful because the instrument was proven able to return 1.** A real schema change (`CREATE TABLE public.gsd_probe_164`) made the same scoped diff exit **1**; dropping it and regenerating returned the file to a **byte-identical sha256**.
- **The "or a check fails loudly" half was exercised for real.** Renaming one override key produced **TS2344, exit 2**, naming the key — so a regeneration that dropped or renamed an RPC return column cannot silently no-op.
- The `supabase-types-drift` job ships **deliberately unfiltered**, with the measured host decision (O-3) written into the job itself, and its diff **path-scoped**.
- A repo-meta vitest pins all of it. **All 7 assertions were mutated into failure and restored** — including one first probe that did **not** fire and had to be corrected (below).
- **A premise carried by the plan, `164-RESEARCH` § R8 and this phase's earlier notes turned out false at HEAD** and was corrected rather than shipped: `packages/supabase-types/tsconfig.tsbuildinfo` is neither tracked nor ungitignored.

## Task Commits

1. **Task 1: the unfiltered `supabase-types-drift` job** — `2a2b666e1` (ci)
2. **Task 2: the repo-meta anti-vacuity spec** — `b318d7eb3` (test)
3. **Task 3: the regeneration** — produced no file change (exit 0, outcome A). The measurement it produced did require one: `3ca70a95c` (fix) — see Deviations.

**Plan metadata:** see the `docs(164-03)` commit.

## The `supabase-types-drift` job block, verbatim (required by the plan's output spec)

```yaml
  supabase-types-drift:
    # Regenerates `packages/supabase-types/src/database.ts` against a live local Supabase and
    # fails if the committed file differs. Silent reversion on the next schema change is the
    # failure mode this job exists to prevent: the nullability the type generator throws away is
    # restored by a hand-maintained override in `src/database.overrides.ts`, and a regeneration
    # that renames or drops a column has to redden here rather than pass quietly.
    #
    # WHY A NEW JOB RATHER THAN A STEP INSIDE `supabase-tests`, which already starts Supabase and
    # therefore looks like the cheap host. Measured, it is not:
    #
    #   1. `supabase-tests` has five steps in total, and among them no `actions/setup-node`, no
    #      `threeal/setup-yarn-action` and no `yarn install`. `yarn db:types` is
    #      `yarn workspace @openvaa/supabase-types generate`, which needs Yarn 4, Node, an install
    #      and the `supabase` devDependency. Hosting this check there means adding three setup
    #      steps and an install to a job that has none, which is to say making it a different job.
    #
    #   2. Every step in `supabase-tests` sits behind a `dorny/paths-filter`, so a drift check
    #      placed there does not run when neither `apps/supabase/**` nor `packages/supabase-types/**`
    #      changed. The comment above `dev-seed-integration` records this project's position on
    #      exactly that pattern.
    #
    #   3. That filter's path set is provably incomplete for this check. `supabase/setup-cli@v1` is
    #      pinned to `version: latest`, so a CLI update can change the generator's output with no
    #      repo path changing at all — precisely the silent-reversion class the requirement names,
    #      and precisely what a filter would hide.
    #
    # So: a new job modelled on `dev-seed-integration`, with deliberately NO paths-filter.
    # `packages/dev-seed/tests/rpcNullabilityGate.test.ts` asserts that absence, so reintroducing a
    # filter here is a red test rather than a quiet narrowing nobody notices.
    #
    # No runner-cost claim is made here, because this file supports none: it sets no
    # `timeout-minutes` on any job and caches no Supabase Docker images, so there is no baseline to
    # compare against. The cost is runner minutes, and the job runs in parallel with `e2e-tests`,
    # which does strictly more work.
    runs-on: ubuntu-latest

    steps:
      - name: "Checkout source code"
        uses: actions/checkout@v4

      - uses: supabase/setup-cli@v1
        with:
          version: latest

      - name: Setup Yarn 4.13
        uses: threeal/setup-yarn-action@v2
        with:
          version: 4.13

      - name: Setup Node.js 22.22.1
        uses: actions/setup-node@v4
        with:
          node-version: 22.22.1
          cache: "yarn"

      - name: "Install all dependencies"
        run: yarn install --frozen-lockfile

      - name: "Start Supabase"
        working-directory: apps/supabase
        run: supabase start

      # `yarn db:types` does NOT start Supabase itself. Root `package.json` defines `db:reset` as
      # `yarn db:start && ...` but `db:types` as a bare `yarn workspace @openvaa/supabase-types
      # generate`, and the generator runs `supabase gen types typescript --local`, so it needs the
      # stack started by the step above or it fails for the wrong reason.
      - name: "Regenerate the Supabase types"
        run: yarn db:types

      # The diff is PATH-SCOPED deliberately, so the only thing that can redden this step is drift in
      # the generated types, and the failure names the one file the reader has to commit. An unscoped
      # `git diff --exit-code` would also go red on any unrelated working-tree change the runner
      # happens to leave behind, which turns a precise signal into a noisy one that gets muted.
      #
      # ⚠ Measured 2026-09-03, correcting the reason earlier phase notes gave for this scoping:
      # `packages/supabase-types/tsconfig.tsbuildinfo` is NOT tracked and IS ignored by the
      # `*.tsbuildinfo` rule in the root `.gitignore`, so `git diff` never reports it and that
      # particular hazard does not exist. The scoping is right; that justification for it was not.
      - name: "Assert the committed types match the regenerated ones"
        run: |
          if ! git diff --exit-code -- packages/supabase-types/src/database.ts; then
            echo "::error::yarn db:types produced a different packages/supabase-types/src/database.ts than the one committed. Commit the regenerated file, then re-check packages/supabase-types/src/database.overrides.ts, because a renamed or dropped RPC return column must be reflected there or an override widens a column that no longer exists."
            exit 1
          fi

      - name: "Stop Supabase"
        if: always()
        working-directory: apps/supabase
        run: supabase stop
```

Placement measured: `dev-seed-integration:` at `:163`, `supabase-types-drift:` at `:247`, `e2e-tests:` at `:331`. `git diff --numstat` on the Task 1 commit: **84 additions, 0 deletions**.

## Criterion 4: the regeneration, performed and observed

**Which database state this was regenerated against**, because a regeneration proof against an unexpected schema proves the wrong thing:

| Fact | Measured |
|---|---|
| Stack | local Supabase, already running; `yarn db:start` exit **0** |
| Migrations applied (`supabase migration list --local`) | `00001`, `00002`, `00003`, `00004` — all four on disk, all four applied |
| Supabase CLI | **v2.83.0** (the CLI itself advertised v2.116.0 as available; not upgraded, since an unannounced CLI bump is the very drift class this job exists to catch) |
| `sha256` of the committed `src/database.ts` before | `e5b2f7da957f4ed621a707084fa4b91b9cb0934f248b70c8dd65343a6a753acd` |

**The commands, with every exit code read directly and never through a pipe:**

| Command | Exit |
|---|---|
| `yarn db:start` | **0** |
| `yarn db:types` | **0** |
| **`git diff --exit-code -- packages/supabase-types/src/database.ts`** | **0** |
| `git status --porcelain packages/supabase-types/` | — (**0 lines**) |
| `yarn workspace @openvaa/supabase-types typecheck` | **0** |
| `yarn workspace @openvaa/frontend check` | **0** (`2750 FILES 0 ERRORS 0 WARNINGS`) |
| `node scripts/assert-rpc-return-nullability.mjs` | **0** |

**Which of the two legitimate outcomes occurred: outcome A (exit 0).** The committed `packages/supabase-types/src/database.ts` was already current — its `sha256` after regeneration is byte-identical to the value above — and the override locus survived untouched. The generator writes only `src/database.ts`; `git status --porcelain packages/supabase-types/` returned **zero lines**, so `database.overrides.ts` and `database.merged.ts` were demonstrably not in its output path. That mechanical fact is now **observed rather than assumed**, which is what made D-M2(a) (a sibling override file) the right shape over post-processing the generated file.

### Why exit 0 is evidence rather than an absence of evidence

An observation is only as good as the instrument, and an instrument nobody has seen report failure has reported nothing. Two probes, both fully reverted:

**Probe R1 — the drift diff can report drift.** A real, reversible schema change against the live database:

| Step | Result |
|---|---|
| `CREATE TABLE public.gsd_probe_164 (id uuid PRIMARY KEY);` | `CREATE TABLE` |
| `yarn db:types` | exit **0** |
| `git diff --exit-code -- packages/supabase-types/src/database.ts` | **exit 1**, 13 added lines including `+      gsd_probe_164: {` |
| `DROP TABLE public.gsd_probe_164;` | `DROP TABLE` |
| `yarn db:types` | exit **0** |
| `git diff --exit-code -- packages/supabase-types/src/database.ts` | **exit 0** |
| `sha256` of the restored file | `e5b2f7da…a753acd` — **byte-identical to the pre-probe value** |
| `information_schema.tables` count for `gsd_probe_164` | **0** — the probe table is gone |

**Probe R2 — the type-level guarantee fails loudly rather than no-ops.** This is criterion 4's "or a check fails loudly when it does not", and the CIGATE-05 adjacency truth this plan inherited from `164-01`:

```
src/database.overrides.ts(52,7): error TS2344: Type '"parent_nomination_id_dropped" | "candidate_id" | … '
does not satisfy the constraint '"candidate_id" | "organization_id" | … | "short_name"'.
```

`'parent_nomination_id'` was renamed to `'parent_nomination_id_dropped'` — which is exactly what a regeneration dropping or renaming that RPC output column would look like from the override's side. `yarn workspace @openvaa/supabase-types typecheck` exited **2** and named the key. Reverted; typecheck back to **0**.

## The repo-meta spec: red/green pair for every assertion (PROH-01)

`yarn workspace @openvaa/dev-seed test:unit rpcNullabilityGate` — **green: exit 0, 7 passed**.

Each assertion was then mutated into failure and restored with `git checkout -- <specific file>`; the tree was confirmed clean after each.

| Probe | Assertion targeted | Mutation | Red exit | Restored |
|---|---|---|---|---|
| P1 | job declared exactly once | job key renamed to `supabase-types-drift-renamed:` | **1** (6 of 7 failed — the extraction helper throws, as designed) | 0 tree changes |
| P2 | no `paths-filter` | a `dorny/paths-filter` block inserted into the job body | **1** | 0 tree changes |
| P3 | the reason is written down | **first attempt: exit 0 — did NOT fire.** Corrected below | **1** after correction | 0 tree changes |
| P4 | diff is path-scoped | `git diff --exit-code -- <path>` replaced by a bare `git diff --exit-code` | **1** | 0 tree changes |
| P5 | Supabase stopped unconditionally | `if: always()` removed from the stop step | **1** | 0 tree changes |
| P6 | no shell tracing | `set -x` added to the diff step | **1** | 0 tree changes |
| P7 | `lint:check` chain membership | ` && yarn assert:rpc-nullability` removed from root `package.json` | **1** | 0 tree changes |

**P3's first attempt is worth recording, because a probe that fails to fire is how a vacuous assertion gets certified.** The mutation removed **one** of the **two** `paths-filter` mentions in the job's header comment, and the spec stayed green. On inspection the guard was behaving correctly — its claim is "the reason is written down somewhere in this block", and with one mention surviving the reason *was* still written down; the probe, not the assertion, was wrong. The corrected probe removed **both** mentions (raw-block count 2 → 0) and the assertion fired: exit **1**, `writes down WHY there is no filter, in the job itself`. Recorded rather than quietly re-run, because the difference between "the probe was too weak" and "the assertion cannot fail" is exactly what a probe exists to distinguish, and it is only visible if the first attempt is reported.

## Verification results (every exit code read directly, never through a pipe)

| Gate | Exit | Detail |
|---|---|---|
| Task 1 `<verify>` command, verbatim | **0** | `supabase-types-drift job OK` |
| `yaml.parse` of `main.yaml` | **0** | 8 jobs; `supabase-types-drift` has 9 steps |
| `yarn workspace @openvaa/dev-seed test:unit rpcNullabilityGate` | **0** | 7 passed, 0 failed, 0 skipped |
| `yarn test:unit` | **0** | 25/25 workspaces; dev-seed **54 files / 610 tests** (was 53 / 603 — this plan's file plus its 7 assertions); frontend 88 / 1591; **0 failed, 0 skipped** |
| `TURBO_FORCE=true yarn lint:check` | **0** | **0 cached** on both turbo invocations (11/11 lint, 23/23 typecheck); the rpc-nullability guard's summary printed last |
| `yarn format:check` | **0** | after `prettier --write` on both touched files |
| `node scripts/assert-comment-hygiene.mjs` (run **after** `git add`, per the tracked-files-only scan) | **0** | 1645 files scanned, 2 rules live, 0 violations |
| `node scripts/assert-rpc-return-nullability.mjs` | **0** | 3 RPCs, 4/32/15, 32-name alternation, 0 cast hits, 0 violations |
| `yarn workspace @openvaa/dev-seed typecheck` | **0** | the new spec compiles |
| `git status --porcelain` at plan close | — | **0 lines**, clean |
| Dependency diff `git diff -- package.json packages/dev-seed/package.json yarn.lock` | — | **0 lines** — no YAML parser, no dependency added |

## Decisions Made

- **The job's explanatory comment lives INSIDE the job block, not above the job key.** This was forced by the plan's own extraction: `awk '/^  supabase-types-drift:$/{f=1;next} …'` begins *after* the key, so a comment above it belongs to `dev-seed-integration`'s block and the raw-block `paths-filter` ≥ 1 assertion would have been unsatisfiable. Placing it inside satisfies both halves of the split gate — 0 in the comment-stripped block, 2 in the raw one.
- **No type-level nullability unit test was added anywhere**, per D-M3's rejected sibling (b): such a test passes happily if the override file is deleted and the assertion rewritten with it. The compiler enforces the type-level half through `K extends keyof ReturnsRow<F>`, as probe R2 demonstrates.
- **The Supabase CLI was not upgraded** despite the v2.83.0 → v2.116.0 notice printed on every invocation. An unannounced CLI bump changing generator output is precisely threat `T-164-05`, which this job exists to catch; upgrading mid-plan would have conflated the observation with the thing being observed.
- **The path scoping was kept and its stated reason replaced.** Correct decision, false justification — the reason was fixed at the reason.

## Deviations from Plan

### 1. [Rule 3 - Blocking] Task 1's precondition is literally unmet: Phase 163 has not landed

- **Found during:** Task 1, before any edit
- **Issue:** The plan's Task 1 `<precondition>` requires `grep -c 'db:lint:sql' .github/workflows/main.yaml` ≥ 1 and says "If it returns 0, Phase 163 has not landed and this task must not run." Measured at HEAD it returns **0**, and ROADMAP shows Phase 163 as `0/TBD, Not started`.
- **Why it was not escalated as a blocking-human checkpoint:** the dispatching orchestrator addressed this exact condition explicitly and in advance — "Phase 163 has NOT started and will not start while you run — you have the file to yourself… just leave the file in a state a later phase can add to." The precondition's **stated purpose** is parallel-edit conflict avoidance ("Two agents editing that block in parallel will conflict"), and that risk is nil under a confirmed non-concurrent schedule. The literal check is unmet; the hazard it guards is absent.
- **What was done to keep 163 mergeable:** the new job is a single self-contained block inserted between `dev-seed-integration` and `e2e-tests`, touching nothing else. `git diff --numstat` on the Task 1 commit is **84 additions, 0 deletions**, and `git diff -U0 | grep -c '^-[^-]'` is **0** — no existing line was modified, so 163's three jobs will append with no textual conflict wherever they land.
- **Committed in:** `2a2b666e1`

### 2. [Rule 1 - Bug] A shipped comment justified the path-scoped diff with a premise that measurement disproves

- **Found during:** Task 3, running the acceptance criterion that asks for `tsconfig.tsbuildinfo` to be "restored" after the typecheck
- **Issue:** The plan, `164-RESEARCH` § R8 and consequently my Task 1 job comment and Task 2 spec comment all stated that `packages/supabase-types/tsconfig.tsbuildinfo` is **tracked** and carries **no `.gitignore` entry**. Measured at HEAD, **both halves are false**: `git ls-files packages/supabase-types/` lists eight files and not that one, and `git check-ignore -v` reports `.gitignore:29:*.tsbuildinfo`. The file exists on disk, untracked and ignored, so `git diff` never reports it and the named hazard does not exist.
- **Fix:** the scoping was **kept** — it is still right, for the reason that survives measurement: it keeps the only possible cause of a red step "the generated types drifted" and names the one file to commit, where an unscoped diff also reddens on unrelated runner-side working-tree churn and gets muted as noisy. Both comments were rewritten to state that, plus the measured correction so the next reader is not sent looking for a tracked file.
- **Files modified:** `.github/workflows/main.yaml`, `packages/dev-seed/tests/rpcNullabilityGate.test.ts`
- **Verification:** Task 1 gate re-run exit 0; spec re-run 7/7 exit 0; `yaml.parse` 9 steps; comment hygiene 0 violations; `prettier --check` exit 0
- **Committed in:** `3ca70a95c`

---

**Total deviations:** 2 (1 blocking-precondition proceeded-with-justification, 1 bug). **Impact:** neither changed the plan's deliverables. The first is a scheduling fact recorded rather than hidden; the second removed a false claim from two permanent comments while leaving the decision it wrongly justified intact. No scope creep, no suppression, and no criterion satisfied by bending code or prose to a stale fact.

## Unsatisfiable acceptance criteria (measured, reported, not met)

| Criterion as written | Returns | Why, and what was checked instead |
|---|---|---|
| Task 1: "Phase 163's jobs are still present and intact: `grep -c 'db:lint:sql' .github/workflows/main.yaml` returns ≥ 1" | **0** | Phase 163 has not landed (ROADMAP: `0/TBD, Not started`), so there are no 163 jobs to be intact. The criterion's *intent* — that this plan damages nothing — was checked by its sibling half instead: `git diff --numstat` = **84 additions, 0 deletions**, and **0** deleted lines anywhere in the diff. Note `db:lint:sql` **does** exist as a root `package.json` script; it is the *workflow job* that does not exist. |
| Task 3: "`packages/supabase-types/tsconfig.tsbuildinfo` is restored and `git status --porcelain` no longer lists it" | vacuously true | `git status --porcelain` **never** listed it, because it is gitignored (deviation 2). `git checkout -- packages/supabase-types/tsconfig.tsbuildinfo` is a no-op against an untracked path. Recorded as trivially satisfied rather than reported as a pass that means something. |

Every other acceptance criterion across the three tasks passes as written.

## Issues Encountered

- **A probe that did not fire (P3).** Resolved by strengthening the probe, not the assertion — see the red/green table. One attempt.
- No other issue required more than one attempt. The fix-attempt limit was not approached.

## Known Stubs

None. No placeholder values, no unwired assertions, no `TODO` or `FIXME` introduced. Every one of the spec's 7 assertions has been observed failing.

## Threat Flags

None new. Dispositions from this plan's register:

- **`T-164-03`** (credential disclosure in the drift job's log) — **mitigated**. The job acquires no Supabase credential at all: no `env:` block, no `supabase status -o env` export step, no `TURBO_TOKEN`, no `cp .env.example .env`. Asserted twice, by Task 1's gate (`set -x` and key-echo greps = 0 on the comment-stripped block) and by the committed spec's `prints no Supabase credential and enables no shell tracing`, which probe P6 proved can fail.
- **`T-164-04`** (a gate that reports its own absence as a pass) — **mitigated**. The job carries no `paths-filter` and the spec asserts that absence; probes P1 and P2 showed both halves firing.
- **`T-164-05`** (`supabase/setup-cli@v1` pinned to `version: latest`) — **mitigated as designed, and the risk is live and visible**: the CLI advertised v2.116.0 against the installed v2.83.0 during this very plan. The unfiltered job running on every PR is the mitigation, and the `::error::` annotation tells the reader to re-check `database.overrides.ts`.
- **`T-164-10`** (an assertion never seen red) — **mitigated**, 7 of 7 probed, with the one weak probe reported rather than papered over.
- **`T-164-SC`** — no package-manager install occurred; `git diff` on `package.json`, `packages/dev-seed/package.json` and `yarn.lock` is **0 lines**.

## User Setup Required

None.

## Next Phase Readiness

Ready for `164-04` (the `NC-1`…`NC-6` negative-control ledger and the two deferred TODOs). Four things it and `164-05` inherit:

- **Criterion 4 is delivered.** The regeneration was performed, the exit code is recorded above, and the observing instrument was proven able to report the opposite. `NC-6` in `164-04`'s ledger can cite probe R2's verbatim TS2344 rather than re-deriving it.
- **⚠ The CI job cannot be observed green on this branch, and this plan does not claim it is.** `.github/workflows/main.yaml` triggers only on `push`/`pull_request` against `main`; this work is on `integration/ship-12-squash`, which has never run CI. Everything provable locally is proven; the GitHub-Actions-run half is **unobservable here** and is carried as `D6` with `human_judgment: true`. Discharge on the branch's first PR to `main`, alongside the identical standing item from Phase 137. Do not let a later plan or the phase gate record this job as "verified in CI".
- **⚠ The local database state at plan close:** migrations `00001`–`00004` applied, and **whatever seed data was already resident is unchanged** — this plan added and dropped exactly one probe table and seeded nothing. `164-05`'s E2E gate must still run **`yarn db:reset`** first regardless, because the `dev-seed-integration` path writes the `default` template into the live database with no teardown while the E2E suite asserts against `e2e/base`.
- **Phase 163 has still not landed** and now has one more sibling in the `jobs:` block. The insertion was additions-only, so 163's three jobs append cleanly, but the ROADMAP's "must not share an execution wave" note remains in force for whoever runs 163.

---

_Phase: 164-returns-table-nullability-audit-single-override-mechanism_
_Completed: 2026-09-03_

## Self-Check: PASSED

`packages/dev-seed/tests/rpcNullabilityGate.test.ts` verified present on disk with `[ -f ]`. All three commits (`2a2b666e1`, `b318d7eb3`, `3ca70a95c`) verified present in `git log --oneline --all`. Every task acceptance criterion and the plan-level `<verification>` block re-run at plan close: Task 1 gate exit 0, spec 7/7 exit 0, `yarn db:types` exit 0 with the scoped diff exit 0, `git status --porcelain packages/supabase-types/` 0 lines, `node scripts/assert-rpc-return-nullability.mjs` exit 0, `yarn test:unit` exit 0 with 0 failed and 0 skipped, `TURBO_FORCE=true yarn lint:check` exit 0 with 0 cached, `yarn format:check` exit 0, comment hygiene exit 0, working tree clean. Two acceptance criteria are reported unsatisfiable-or-vacuous above with what was measured instead; neither was met by bending code or prose.
