---
phase: 153-build-tooling-config-correctness
plan: 01
subsystem: infra
tags: [build-tooling, yarn, workspaces, catalog, tsup, guard, lint-check, negative-control, monorepo]

requires: []
provides:
  - "`scripts/assert-declared-binaries.mjs` — a standing guard asserting every workspace declares the binaries its `build` script invokes, resolved against each declared dependency's real `bin` field"
  - "Root script `assert:declared-binaries`, appended as the 9th link of the `lint:check` `&&` chain"
  - "`packages/dev-seed/tests/assertDeclaredBinariesGate.test.ts` — a membership spec that survives a sibling phase appending to the same chain"
  - "`tsup: ^8.5.1` in `.yarnrc.yml`'s catalog, and `\"tsup\": \"catalog:\"` in 9 manifests (root + the 8 offenders)"
  - "`153-NC-ROW-1-CFG-01.md` — Row 1 of the phase negative-control ledger, both halves"
affects: [153-02, 153-09, 153-10, 153-11]

actuals:
  tokens: 10835
  tasks: 3
  commits: 4

tech-stack:
  added: []
  patterns:
    - "Binary-declaration guard: resolve invoked tokens against declared dependencies' `bin` fields rather than a hard-coded alias table"
    - "Append-only `lint:check` chain edits, guarded by a membership-not-position spec"

key-files:
  created:
    - scripts/assert-declared-binaries.mjs
    - packages/dev-seed/tests/assertDeclaredBinariesGate.test.ts
    - .planning/phases/153-build-tooling-config-correctness/153-NC-ROW-1-CFG-01.md
    - .planning/todos/pending/2026-08-28-153-undeclared-eslint-in-lint-scripts.md
  modified:
    - package.json
    - .yarnrc.yml
    - yarn.lock
    - packages/app-shared/package.json
    - packages/argument-condensation/package.json
    - packages/core/package.json
    - packages/data/package.json
    - packages/filters/package.json
    - packages/llm/package.json
    - packages/matching/package.json
    - packages/question-info/package.json

key-decisions:
  - "OQ-3 resolved as planned: `SCRIPT_SCOPE = ['build']`, matching REVIEW-CFG-01's literal wording. The wider `eslint` class is filed, not hidden."
  - "Catalog form (`tsup: catalog:`) over nine literal ranges, per `.yarnrc.yml`'s own stated criterion for a catalog entry."
  - "Binary resolution reads each declared dependency's `bin` field. No alias table, so `tsc`/`typescript` and `svelte-kit`/`@sveltejs/kit` cannot rot."
  - "E2E declined, on a proof over this plan's own diff rather than an inherited argument (see Verification below)."

patterns-established:
  - "Negative control taken at the level of the STANDING COMMAND (`yarn lint:check`), not just the guard script: the two runs differ by one chain link and nothing else, which isolates wiring from behaviour."
  - "Prove a scan's zero can be made non-zero before trusting it: the comment-hygiene census moving 1577 → 1578 is what shows the scan actually saw the new file."

requirements-completed: [REVIEW-CFG-01]

coverage:
  - id: D1
    description: "Every workspace declares the binaries its `build` script invokes, enforced by a guard that fails by name"
    requirement: "REVIEW-CFG-01"
    verification:
      - kind: other
        ref: "node scripts/assert-declared-binaries.mjs — exit 0, '16 workspace(s) scanned, 20 build-script binary invocation(s). 0 violation(s).'"
        status: pass
      - kind: other
        ref: "negative control: same defect, 8-link chain → exit 0 and silence; 9-link chain → exit 1 naming packages/matching (153-NC-ROW-1-CFG-01.md)"
        status: pass
    human_judgment: false
  - id: D2
    description: "The guard is wired into the standing gate and stays wired when a sibling phase appends its own link"
    requirement: "REVIEW-CFG-01"
    verification:
      - kind: unit
        ref: "packages/dev-seed/tests/assertDeclaredBinariesGate.test.ts — 3 tests; flip-tested (link removed → 1 failed | 2 passed; restored → 3 passed)"
        status: pass
    human_judgment: false

duration: 65min
completed: 2026-08-29
status: complete
---

# Phase 153 Plan 01: Binary-Declaration Guard Summary

**Eight workspaces were invoking `tsup` from their `build` script while declaring it nowhere, surviving only on root hoisting; a guard that names each offender is now the 9th blocking link of `lint:check`, and both halves of its negative control are on the record.**

## Performance

- **Duration:** ~65 min of execution (wall clock spans a watchdog kill during `yarn install` and a resume; no work was lost)
- **Started:** 2026-08-29T09:15:59Z
- **Completed:** 2026-08-29T12:20:33Z
- **Tasks:** 3 of 3
- **Files modified:** 15 (4 created, 11 modified)

## Accomplishments

- **The guard exists and was observed red by name before anything was fixed.** On the unmodified tree it exited 1 with exactly 8 `[ERROR]` lines, all naming `tsup`, in exactly `packages/{app-shared,argument-condensation,core,data,filters,llm,matching,question-info}` — the figure research predicted, reproduced independently. No other location appeared.
- **All 8 workspaces now declare `tsup`, via a catalog entry.** The lockfile delta is descriptor-only: 9 insertions, 1 deletion, **zero** new `resolution:` lines, and still exactly one `tsup@npm:8.5.1` resolution. This measures research assumption A2, which was explicitly flagged unmeasured.
- **The negative control was taken at the level of the standing command, not the script.** Same defect, same tree, one chain link's difference: `yarn lint:check` exits `0` with all four pre-existing guards reporting `0 violation(s)` and `grep -c '^[ERROR]'` returning `0`, then exits `1` naming `packages/matching`. `@openvaa/matching:build` **succeeds** during the blind run — the build is green in exactly the state the defect is live in.
- **Both guards this plan touched were flip-tested in both directions**, and the membership spec was flip-tested too (delete the chain link → 1 failed | 2 passed; restore → 3 passed).
- **An inherited premise was corrected by measurement** (see Deviations): widening the guard's scope is *not* the one-line change the planning documents describe.

## Task Commits

1. **Task 1 (tracer): guard, registration, `lint:check` wiring, observed red** — `66bc4cd95` (feat)
2. **Task 2: 8 `tsup` declarations + catalog entry, guard turned green** — `c5cd37692` (fix)
3. **Task 3a: membership spec** — `8e30c0430` (test)
4. **Task 3b: negative-control fragment + OQ-3 todo** — `8c13fe077` (docs)

## Files Created/Modified

- `scripts/assert-declared-binaries.mjs` — the guard. `SCRIPT_SCOPE` is a named module constant; workspaces are enumerated from the root manifest's own `workspaces` globs plus `.`; reports are keyed on **location**, never `name` (the root declares none); output is sorted by location, then binary, then script, so stderr is byte-stable.
- `package.json` — `assert:declared-binaries` appended to the contiguous `assert:*` block; ` && yarn assert:declared-binaries` appended to `lint:check`; `devDependencies.tsup` flipped to `catalog:`.
- `.yarnrc.yml` — `tsup: ^8.5.1` under the `# New entries` header.
- `packages/{app-shared,argument-condensation,core,data,filters,llm,matching,question-info}/package.json` — `"tsup": "catalog:"` at its JSON-lexicographic position (before `typescript`; before `tsx` in `data`).
- `yarn.lock` — descriptor-only delta.
- `packages/dev-seed/tests/assertDeclaredBinariesGate.test.ts` — 3 assertions covering the three wiring failure modes. Carries no phase number, plan number, decision id or `.planning/` path, per D-N1.
- `.planning/phases/153-build-tooling-config-correctness/153-NC-ROW-1-CFG-01.md` — Row 1, both halves, plus three supporting observations.
- `.planning/todos/pending/2026-08-28-153-undeclared-eslint-in-lint-scripts.md` — the OQ-3 wider class.

## Decisions Made

- **OQ-3 → `build` scope.** As the plan proposed. This makes REVIEW-CFG-01's two halves the same job and yields zero false positives; the alternative is filed with its true cost.
- **Catalog over literal ranges.** `tsup` now spans 9 workspaces, which is exactly the criterion `.yarnrc.yml` states for a catalog entry.
- **Guard reads real `bin` fields.** A hard-coded alias table would rot; this cannot.
- **No `checkpoint:decision` raised.** D-B4 is a locked CONTEXT decision and a checkpoint would have reopened it.

## Deviations from Plan

### Auto-fixed / adjusted

**1. [Rule 3 — blocking] The `assert:*` block ends later than the plan states.**

- **Found during:** Task 1
- **Issue:** The plan's `read_first` describes the contiguous `assert:*` block as ending at `assert:a11y-scan-wiring`, and quotes a six-link `lint:check`. At execute time the block ended at `assert:edge-env-defaults` and the chain had **eight** links — Phases 152 and 155 had both landed since planning.
- **Fix:** Appended after the real last entry, and appended to the chain by reading its current value rather than pasting a replacement string. All 8 pre-existing links survive, asserted by name: `turbo run lint`, `eslint … tests`, `yarn typecheck:tests`, `yarn typecheck`, `yarn assert:i18n-catalog-namespaces`, `yarn assert:a11y-scan-wiring`, `yarn assert:comment-hygiene`, `yarn assert:edge-env-defaults`. The chain is now 9 links. This is the concurrency hazard the plan named, arriving as predicted.
- **Commit:** `66bc4cd95`

**2. Task 3 committed as two commits rather than one.** The spec (`test`) and the planning evidence (`docs`) are different kinds of artefact; splitting keeps each commit reviewable. No content differs from the plan.

### Inherited premise CORRECTED by measurement

**3. Research § A.3's awkward-construct table is wrong about the multi-line `echo`, and "widen `SCRIPT_SCOPE`" is not a one-line change.**

- **Found during:** Task 3, while verifying the 16-vs-8 figure rather than inheriting it.
- **Claim in research:** all-scripts scope yields **16** violations (8 `tsup` + 8 `eslint`) with zero false positives, and the root's multi-line `test:unit:watch` `echo` is "handled by newline split + ambient `echo`".
- **Measured:** a widened throwaway copy of the shipped guard reports **11** violations on the fixed tree — 8 `eslint`, plus **3 spurious rows** from `test:unit:watch`, whose first tokens decompose to `echo`, `NB!`, `###################################`, `'`, `vitest`. Only the *first* segment is protected by the ambient `echo`. On the pre-fix tree the same scope would have read **19**, not 16.
- **Why not fixed here:** at the shipped `build` scope the extraction rule has **zero** false positives, verified twice. The defect only exists at a scope this plan does not ship, so fixing it would be scope creep into a guard behaviour nobody has decided on.
- **Recorded:** in the OQ-3 todo, which now states the real shape of the widening work — teach the splitter to respect quotes *first*, re-measure, then widen, then add 8 `eslint` declarations. Understating that cost would have misled whoever picks the todo up.
- **The `eslint` count itself is confirmed at 8**, in the same 8 packages, all in their `lint` scripts; and the reachability claim is verified per file: `packages/shared-config/package.json` lists `eslint: catalog:` in its **`dependencies`**, while `dev-seed` and `dev-tools` declare `eslint` directly.

### Not deviations, recorded for the reader

- **`yarn db:lint:sql` was not run.** Its failing half lints the live database and reads no working-tree file; it is pre-existing red and cannot be otherwise. Not scored.
- **Two pre-existing turbo warnings** (`no output files found for task @openvaa/dev-seed#build` and the same for `shared-config`/`supabase-types`) appear in build output. Pre-existing, unrelated to this diff, out of scope.

## Verification

All four compile-time gates green on the shipped state (single sweep, `153-final-gates.log`):

| Gate | Result | Baseline |
|---|---|---|
| `yarn build` | 14/14 tasks, exit 0 | 14/14 ✓ |
| `yarn lint:check` | 22/22 tasks + 5 guards at `0 violation(s)`, exit 0 | 22/22 ✓ (guard links 8 → **9**) |
| `yarn test:unit` | 25/25 tasks, exit 0 | 25/25 ✓ |
| `yarn format:check` | clean, exit 0 | clean ✓ |
| dev-seed unit | 51 files / 587 tests | 50/584 → **+1 file, +3 tests** ✓ |
| comment-hygiene | 1578 files, 0 violations | 1577 → **1578** ✓ |

### E2E: declined, with the proof

Decided on this plan's own diff, not on a sibling plan's argument. Two measurements make an E2E run incapable of falsifying anything here:

1. **No application input changed.** `git diff --name-only 8520e6f61..HEAD | grep -E '^(apps/|tests/|packages/[^/]+/src/)'` returns **nothing**. Not one file under `apps/`, `tests/`, or any `packages/*/src/` was touched. The served application's sources and the E2E specs are byte-identical to the base commit.
2. **No build-tool input changed.** `yarn.lock` carries exactly one `resolution: "tsup@npm:8.5.1"` at the base commit and exactly one at HEAD; the diff introduces **zero** new `resolution:` lines. The 9 manifest changes are descriptor-only and all resolve to that same already-locked entry.

Identical sources built by an identically-resolved tool produce identical artefacts, so the served application is unchanged and the suite has nothing new to exercise. `yarn build` succeeding 14/14 on the post-change tree is the confirming observation.

## Known Stubs

None. No placeholder, empty-literal data source, or `TODO`/`FIXME` was introduced. The one deliberately-unimplemented item — the wider `eslint` class — is filed as a `.planning/todos/pending/` entry with its measured cost, not stubbed in code.

## Threat Flags

None. The diff adds no network endpoint, auth path, file-access pattern or schema change. `T-153-SC` (install surface) is discharged: `tsup` was already root-declared, already a single lockfile entry, already the binary all 8 builds invoked; no new package entered the tree and no `resolution:` line was added.

## For Future Phases

- **153-02** extends `assertDeclaredBinariesGate.test.ts` with the `engines` spelling assertion. The file is a sibling of `ciTypecheckGate.test.ts`, not an addition to it, and it deliberately loads only `package.json`.
- **Anyone appending to `lint:check`** should append at the tail and rely on membership assertions. Three specs in `packages/dev-seed/tests/` now assert membership of that chain; none asserts position, and none should be changed to.
- **The `.planning/todos/pending/` OQ-3 entry** carries a policy question that governs every future `packages/` addition: does reaching a binary through a declared workspace dependency's `dependencies` count as declaring it? Answer it before widening the guard.

## Self-Check: PASSED

All 5 claimed files exist on disk; all 4 claimed commit hashes resolve; all 8 workspaces read back
`"tsup": "catalog:"`; the guard exits 0 at `0 violation(s).`
