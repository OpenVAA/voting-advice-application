---
phase: 153-build-tooling-config-correctness
plan: 03
subsystem: build-tooling
tags: [ci, github-actions, negative-control, node-engine, assert-node-engine, setup-node, REVIEW-CFG-02, O5, D3, D-N2]
status: complete
requires:
  - "153-02 — `scripts/assert-node-engine.mjs`, its `preinstall` / `lint:check` wirings, and `packages/dev-seed/tests/nodeEngineGate.test.ts`"
provides:
  - "`.github/workflows/main.yaml` job `node-engine-range-negative-control` — the guard's rejecting half, exercised on every run of the workflow"
  - "six standing assertions in `packages/dev-seed/tests/nodeEngineGate.test.ts` over that job's shape"
  - "`153-NC-ROW-6-CFG-02.md` — Row 6 of the phase negative-control ledger"
  - "`.planning/todos/pending/2026-08-28-153-cfg-02-ci-observation-blocked-on-pr-to-main.md` — the unobserved half, filed per D-N2"
affects:
  - ".github/workflows/main.yaml — APPEND ONLY; the `on:` block, the four `node-version: 22.22.1` pins and every existing job are byte-identical"
  - "packages/dev-seed/tests/nodeEngineGate.test.ts — one appended describe block + a docblock correction from 'two wirings' to three"
tech-stack:
  added: []
  patterns:
    - "extract a workflow's `run:` bodies with a YAML parser and execute them under `nvm exec … bash -e`, so a local proof is a proof about the SHIPPED file rather than about a retyped equivalent"
    - "assert an expected-failure's REASON (a message discriminator), never merely its exit status, when the command under test has multiple unrelated non-zero exits"
    - "read a config file with whole-line comments stripped before asserting a literal is ABSENT from it — otherwise the file's own explanatory prose reddens the gate against an untouched tree"
    - "slice a job region between markers (key → next top-level key → EOF) rather than 'everything after the key', because a later phase appends after it"
    - "RED evidence from reverted-tree flip-tests instead of a red commit, on a shared branch"
key-files:
  created:
    - .planning/phases/153-build-tooling-config-correctness/153-NC-ROW-6-CFG-02.md
    - .planning/todos/pending/2026-08-28-153-cfg-02-ci-observation-blocked-on-pr-to-main.md
  modified:
    - .github/workflows/main.yaml
    - packages/dev-seed/tests/nodeEngineGate.test.ts
  renamed:
    - ".planning/todos/pending/2026-08-29-153-03-scope-amendment-after-d-b5-reversal.md → .planning/todos/done/ (+ `## Resolved`)"
decisions:
  - "The four `node-version: 22.22.1` pins were left untouched and `node-version-file:` was NOT introduced — ruled against by O5 AND measured by A3 to warn rather than fail AND (the decisive point) `engines.node` is the RANGE `>=22`, which setup-node resolves to newest-matching, so the swap would silently unpin all four jobs to floating-latest."
  - "The job asserts the guard's failure MESSAGE, not its exit status: `assert-node-engine` exits 1 for four reasons unrelated to the running Node's version, so an exit-code-only assertion would report green while the comparator had stopped comparing."
  - "The guard is invoked BY PATH in all three run steps, so deleting it reddens the job — observed (flip row 5), not asserted."
  - "The job is appended as the LAST key under `jobs:`; the `on:` block and `frontend-and-shared-module-validation`'s step list are untouched, to minimise the collision surface with Phase 163."
  - "`--self-test` added as a third step — a discretionary addition beyond the operator's minimum shape, named as such: its 23 comparator cases (nine negative) run nowhere automatically today."
  - "The standing spec was appended to `nodeEngineGate.test.ts` rather than given its own file: the CI job is a third wiring of the same guard the file already covers."
  - "RED evidence came from reverted-tree flip-tests, not a red commit — `integration/ship-12-squash` is shared and carries concurrent agents."
  - "No E2E run. Proven unreachable from this diff, not inherited from a sibling: the only readers of `.github/workflows/main.yaml` in the tree are three dev-seed unit tests, `apps/frontend` does not depend on `@openvaa/dev-seed`, and nothing under `tests/` references the touched spec. Phase-close full-suite run is 153-09's per operator ruling D1."
  - "REVIEW-CFG-02 was NOT re-marked: it is already `[x]` / Complete (`.planning/REQUIREMENTS.md:96,265`) on 153-02's evidence. This plan adds a standing guard against rot, not a discharge."
metrics:
  duration: ~65 min
  completed: 2026-08-29
  commits: 3
actuals:
  tokens: 12684
  tasks: 3
  commits: 3
  note: "chars/4 over the full authored diff `d7338722f..HEAD` (50 736 chars). Nothing is excluded — every byte is authored content (86 YAML lines, 63 spec lines, three planning docs). Plan estimate was 7 600, so this ran 1.67× over; the overage is concentrated in `153-NC-ROW-6-CFG-02.md` (388 lines), which carries six verbatim flip-matrix transcripts plus two quoted tables the plan required be reproduced rather than summarised."
---

# Phase 153 Plan 03: Standing CI Negative Control over the Node-Engine Guard Summary

Gave the node-engine guard's REJECTING half — the half nothing exercises, because nobody develops on an unsupported Node — a standing CI job that runs the guard by path under a deliberately out-of-range toolchain and asserts it fails for the VERSION reason, proven locally against real runtimes because no CI run is reachable from this branch.

## Commits

| Commit | Message |
|---|---|
| `a6175295d` | `feat(153-03): add a standing CI negative control over the node-engine guard` |
| `2a3114505` | `test(153-03): assert the CI negative control keeps exercising the guard` |
| `9dc7ddaeb` | `docs(153-03): Row-6 evidence for REVIEW-CFG-02, and the boundary it does not cross` |

## What shipped

**Task 1 — the job.** `.github/workflows/main.yaml` gains `node-engine-range-negative-control`,
appended as the last top-level key under `jobs:` after `e2e-visual`. `git diff --numstat` reads
`86 0` — 86 added lines, **zero deleted**. Checkout → `20.x` (deliberately out of range) → assert
the guard REJECTS → `22.22.1` (in range) → assert it ACCEPTS → run the guard's own `--self-test`.

**Task 2 — the proof and the standing spec.** Six flip-matrix rows executed against the committed
tree, and six assertions appended to `packages/dev-seed/tests/nodeEngineGate.test.ts`.

**Task 3 — the record.** `153-NC-ROW-6-CFG-02.md` (388 lines, four parts), the re-derived
CI-observation filing, and the scope-amendment todo moved to `done/` with a `## Resolved` section.

## The flip matrix — executed, not asserted

The step bodies were **extracted from the committed YAML by `js-yaml`** into a `mktemp -d` and run
with `bash -e` under `nvm exec`. Never retyped: that is what makes a local run a proof about the
shipped file. The extractor asserts it found exactly three `run:` steps and fails by name otherwise.

| # | What | Runtime | Required | Observed |
|---|---|---|---|---|
| 1 | step 1 (rejecting assertion) | v20.18.1 (out of range) | exit 0 | **0** — `rejected as required under v20.18.1: assert-node-engine: this Node is v20.18.1 …` |
| 2 | step 1 | v24.14.1 (in range) | exit 1 | **1** — `::error::assert-node-engine exited 0 under v24.14.1 … has stopped binding.` |
| 3 | step 2 (accepting assertion) | v24.14.1 | exit 0 | **0** — `accepted as required under v24.14.1: … satisfies "engines.node": ">=22" — OK` |
| 4 | step 2 | v20.18.1 | exit 1 | **1** — `::error::assert-node-engine exited 1 under v20.18.1, which the declared engines.node range does admit.` |
| 5 | step 1, **guard file moved aside** | v20.18.1 | exit 1 via "not for the version reason" | **1** — `… but not for the version reason. It reported: … Cannot find module …` |
| 6 | step 3 (comparator self-test) | v22.4.0 | exit 0 | **0** — `assert-node-engine --self-test: 23 cases OK` |

Rows 2 and 4 are what make the control non-vacuous: each half was run under the WRONG runtime and
required to go red. Row 5 is what makes the by-path invocation more than a claim — with the guard
renamed into the temp dir, the job breaks, and breaks down the *right* branch. The guard was
restored by rename; `git status --porcelain -- scripts/assert-node-engine.mjs` is empty and the
file's md5 is unchanged (`2caad5c1769f6fe2da9c6969224d4587`). No `git stash`, no `git clean`, no
unscoped reset at any point.

## The standing spec's six reds

Each new assertion was observed RED once against a deliberately broken tree, reverted with a scoped
`git checkout -- .github/workflows/main.yaml` against the already-committed Task 1 state.

| # | Assertion | Break | Observed red |
|---|---|---|---|
| 1 | job key appears exactly once | key renamed | `expected [] to have a length of 1 but got +0` (3 downstream assertions also red — the slice guard working) |
| 2 | invokes the guard by path | path → `scripts/inlined-version-comparison.mjs` | `… to contain 'node scripts/assert-node-engine.mjs'` |
| 3 | asserts the reject reason | discriminator → the non-discriminating `'assert-node-engine'` | `… to contain 'assert-node-engine: this Node is '` |
| 4 | no `continue-on-error` | `continue-on-error: true` added | `… not to contain 'continue-on-error'` |
| 5 | selected major < declared bound | `"20.x"` → `"24.x"` | `expected 24 to be less than 22` |
| 6 | no `node-version-file` anywhere | input introduced in the job | `… not to contain 'node-version-file'` |

Assertion 5 also fails CLOSED: under break 1, where the slice is empty, it fails by name
(`the negative-control job no longer selects an '<major>.x' toolchain: expected null not to be
null`) rather than skipping the comparison.

**The self-invalidating-grep class, closed and demonstrated.** Assertions 4 and 6 forbid literals
the job's own comment is entitled to name, so the spec reads the workflow with whole-line `#`
comments stripped. Demonstrated rather than asserted: injecting a comment naming each literal takes
the RAW-file substring count from 0 → 1 and leaves the suite 10/10 green. A naive raw-file spec
would have been red on an untouched tree.

## Traps the prompt named — each checked against the tree, not taken on faith

- **`"Run ESlint check on frontend"` occurs twice as a bare string** (`:66` in a block comment,
  `:91` as the step). Confirmed by measurement: `grep -c` on the bare string returns **2**; on the
  full `- name: "…"` marker, **1**. Both criteria and the verify block count on the full marker, and
  `ciTypecheckGate.test.ts`'s own `split(STEP).toHaveLength(2)` stayed green throughout.
- **Stale line citations.** Re-measured rather than assumed: `main.yaml` was 383 lines and
  `e2e-visual` did end at `:383`/EOF; the `::error::` idiom IS at `:228-230` inside the step named
  `"Export Supabase connection env"`; the four setup-node steps ARE at `:52/:188/:267/:348` with
  pins at `:54/:190/:269/:350`. All four PATTERNS/A3 citations were **accurate** on the pre-edit
  tree. (They are now stale for anything after `:383`, since the append shifted nothing but added.)
- **`git grep` has no `\b`.** Not needed here — every predicate used is either a parsed-object
  property, a full-marker string, or a `filter(line => line === HEADER)` exact-line match.

## Regression gates — all green, against the baselines given

| Gate | Baseline | Observed |
|---|---|---|
| `yarn lint:check` | 22/22, 10 chain links, every guard 0 | exit **0**; turbo 22/22; chain links **10**; comment-hygiene **1579 / 0**, edge-env **17 / 0**, declared-binaries **16 / 0**, i18n-catalog 0, a11y-scan 0 |
| `yarn test:unit` | 25/25 | exit **0**; turbo **25/25** |
| dev-seed | 593 / 52 | **599 / 52** (+6, this plan's) |
| frontend | 54 files / 816 tests | **54 / 816** unchanged |
| `yarn format:check` | clean | exit **0**, `All matched files use Prettier code style!` |
| `tsc --noEmit` (dev-seed, `include` covers `tests/**/*`) | — | exit **0** |
| `yarn db:lint:sql` | PRE-EXISTING RED | not run, never scored |

## E2E disposition — DECLINED, on this plan's own diff

Reasoned from the diff rather than inherited from a sibling, and **proved rather than asserted**:

```
$ git grep -n -P 'nodeEngineGate' -- tests apps packages   # excluding the file itself
(no references outside the file itself)
$ git grep -c -P 'dev-seed' -- apps/frontend/package.json
0   (apps/frontend does not depend on @openvaa/dev-seed)
$ git grep -l -P 'workflows/main\.yaml' -- packages
packages/dev-seed/tests/ciTypecheckGate.test.ts
packages/dev-seed/tests/integration/default-template.integration.test.ts
packages/dev-seed/tests/nodeEngineGate.test.ts
```

The two working-tree files this plan changed are a GitHub Actions workflow and a dev-seed unit
spec. Nothing under `tests/` (Playwright) reads either — the two `tests/` hits for `main.yaml` are
prose inside comments. `@openvaa/dev-seed`'s `build` is `echo 'Nothing to build.'` and the touched
file is under `tests/`, outside anything the package exports. No app code, no config the app reads,
no seed template, no schema. The full-suite run at phase close is **`153-09`'s**, per operator
ruling **D1** (disposition RAN, not DEFERRED).

## Deviations from plan

### 1. [Measurement over inherited number] The branch is 222 commits ahead of `origin/main`, not "140+"

The plan, the prompt and D3 variously say "140+" and "133". Measured
`git rev-list --count origin/main..HEAD` → **222**. All three inherited figures are lower bounds
that still hold, and the conclusion (no run is reachable) is unchanged. `153-NC-ROW-6-CFG-02.md`
records 222 with the command that produced it, and says the plan's "140+" is a lower bound rather
than silently contradicting it.

### 2. [Rule 2 — missing critical functionality] The spec's docblock said "two wirings"; it now says three

`nodeEngineGate.test.ts`'s docblock opened by explaining that *"the two wirings are asserted here"*.
Appending a third describe block without correcting that sentence would have left the file's own
framing false — the same class of stale record the rest of this plan is careful about. The
correction is the plan's only deleted line (`63 1` on the numstat) and is the reason Task 2's diff
is not additions-only. Two paragraphs were added naming what the third wiring covers that the other
two cannot.

### 3. [Disposition, sanctioned by the plan] No RED/GREEN commit pair for the `tdd="true"` task

Task 2 is marked `tdd="true"`, and its own acceptance criteria require that *"no commit in this task
is red at `HEAD`"* and that the RED evidence come from reverted-tree flip-tests. That is what was
done: one GREEN commit, with six reds recorded from deliberately broken trees that were never
committed. `integration/ship-12-squash` is shared and carries concurrent agents; a deliberately red
commit on it is a cost paid by everyone. Same disposition `153-02` recorded.

### 4. [No requirement transition] REVIEW-CFG-02 was not marked complete, because it already is

`.planning/REQUIREMENTS.md:96` reads `- [x] **REVIEW-CFG-02**` and `:265` reads `Complete`, on
`153-02`'s evidence. `requirements mark-complete` was therefore not run — marking an already-marked
requirement would imply this plan discharged it, which is precisely the false record
`153-NC-ROW-6-CFG-02.md` Part 1 exists to prevent.

## Falsified premises — none from the plan; one inherited figure corrected

The plan's premises held. The four traps it named (double-occurring step name, stale citations,
`git grep` without `\b`, the range-resolution unpinning) were each re-measured and each held as the
plan described, except that the PATTERNS/A3 line citations turned out to be **accurate** on the
pre-edit tree rather than stale — the prompt flagged them as "stale" and that flag was itself the
thing that did not survive measurement. The only correction is the commit-count figure (deviation 1).

## Out-of-scope findings — registered, not fixed

### F1. `153-09-PLAN.md` describes the CFG-02 filing with the wrong framing

`153-09-PLAN.md` still refers to *"REVIEW-CFG-02's binding observation"* as the thing that is
CI-blocked. It is not: the binding was observed by `153-02`, locally, both halves. What is blocked
is **the job's first CI run**. Not edited here — `153-09-PLAN.md` is another plan's file. The
re-derived todo states the distinction in its opening section explicitly so `153-09` cannot inherit
it silently, and this summary flags it so it is corrected when `09` executes. Also recorded in the
cross-phase defect register as **`.planning/WINDOWS.md` row 179** (`kind: deviation`, phase 153,
`status: open`), because a summary scrolls out of context and the ledger does not.

### F2. The CFG-05 sibling filing does not exist yet

`2026-08-28-153-cfg-05-ci-observation-blocked-on-pr-to-main.md` is owned by `153-08`, which has not
run. The cross-link in this plan's filing points at it and says plainly that it was **not yet
written at the time of filing**, rather than implying a file that is not there. Whoever writes it
should point back, so the pair discharges together.

### F3. Three items now discharge on the same CI event

This plan's filing, the CFG-05 filing (F2), and `.planning/STATE.md:293`'s Phase 137 deferred
verification row all wait on the same trigger fact. Cross-linked in the filing. Not consolidated —
consolidation would be a planning act.

## Known Stubs

None. No placeholder, empty-literal or TODO was introduced by any of the three commits.

## Boundary — stated, not hidden

**No workflow run has been observed, and none is claimed anywhere in this plan's output.**
`main.yaml` triggers only on push/PR to `main`; this branch is 222 commits ahead. Per D3 the trigger
change is `163-01`'s and was deliberately not folded in here. The three residual runner-only risks —
whether the runner resolves `20.x` from the setup-node version manifest, whether its default shell
reproduces the `bash -e` semantics used locally (the local proof ran GNU bash 3.2.57), and whether
the YAML-to-step wiring behaves as parsed — are the filed todo's content, with the observation
recipe (`gh run view`, the two log lines to look for) and both discharge paths.

## Threat Flags

None. The new job introduces no network egress, no secret reference, no external input, and no
runner-environment write; it executes one repository-owned script that imports only Node built-ins
and reads one file.

## Self-Check: PASSED

All five files verified present on disk; all three commit hashes verified in `git log --all`; zero
file deletions across `d7338722f..HEAD` (the one rename is `R053`, intentional and documented); no
commit lists `.planning/STATE.md`, `.planning/milestone.lock` or `.planning/ROADMAP.md`.
