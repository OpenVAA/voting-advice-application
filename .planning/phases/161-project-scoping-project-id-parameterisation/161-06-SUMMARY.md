---
phase: 161-project-scoping-project-id-parameterisation
plan: 06
subsystem: testing
tags: [documentation, e2e, playwright, supabase, multi-tenancy, static-guard, vitest]

requires:
  - phase: 161-project-scoping-project-id-parameterisation
    provides: 'ensureProject(), the re-pointed harness and --no-db-reset (161-05) — the mechanism that MAKES the retired instruction unnecessary rather than merely unwanted'
  - phase: 161-project-scoping-project-id-parameterisation
    provides: 'PUBLIC_PROJECT_ID and the no-fallback resolveProjectId throw in the Supabase adapter (161-01, 161-04), which the CLAUDE.md environment entry now documents'
  - phase: 161-project-scoping-project-id-parameterisation
    provides: 'the identity-callback convergence on PUBLIC_PROJECT_ID and the measured local-edge-runtime gap (161-03), which the runbook prerequisite now states'
provides:
  - "CLAUDE.md's full-E2E block states the prerequisites the suite actually has, with no database reset among them"
  - 'CLAUDE.md documents PUBLIC_PROJECT_ID, its default and its fail-loud behaviour at adapter construction'
  - "tests/README.md documents the project the suite owns, the teardown posture, the reset-free reseed chain and e2e-run.sh's --no-db-reset"
  - "tests/IDURA-TEST-RUNBOOK.md's prerequisites carry no reset and add the PUBLIC_PROJECT_ID export the local edge runtime requires"
  - 'packages/dev-seed/tests/e2eDocPreconditionGate.test.ts — a committed gate that fails if any live document reintroduces the reset as an E2E precondition'
affects: [161-07, 161-08, 162-permissions-and-auth-model-refactor]

actuals:
  tokens: 6499
  tasks: 2
  commits: 2

tech-stack:
  added: []
  patterns:
    - 'A retired instruction is retired by a gate, not by an edit: the edit is a snapshot, the gate is what keeps it true'
    - 'A class check with two independent halves — framing detection for the instruction returning in new words, and an explicit allowlist for it returning in words the patterns do not know'
    - 'An allowlist asserted EXACT in both directions: no occurrence outside it, and no entry matching zero occurrences, so a deleted line cannot leave a standing permission behind'
    - 'A documentation gate is proven by a flip before it is trusted, because a search for a string that is simply absent passes vacuously'

key-files:
  created:
    - packages/dev-seed/tests/e2eDocPreconditionGate.test.ts
  modified:
    - CLAUDE.md
    - tests/README.md
    - tests/IDURA-TEST-RUNBOOK.md

key-decisions:
  - "The plan's awk acceptance instrument for CLAUDE.md is unsatisfiable as written — its range runs four subsections past the block it names and captures a command-map entry the plan itself protects. The instrument was scoped to the subsection; the invariant it reaches for goes 1 to 0."
  - 'The framing patterns were validated in BOTH directions before the gate was trusted: they fire on all four retired sites in the pre-edit tree and on none of the eight permitted survivors.'
  - 'The gate matches the reset command as a token and reads a three-line window for framing, rather than searching for the roadmap-quoted literal string, which appears nowhere in the repository and would pass vacuously.'
  - "tests/README.md line 7's prerequisite line was left untouched: it already states no reset, and 161-05 added no prerequisite to the suite."
  - "The runbook DOES get the PUBLIC_PROJECT_ID shell export, because 161-03 measured the local edge-runtime wiring as necessary-but-not-sufficient and FILED the residual gap — the plan's conditional branch for a filed gap."
  - "The base.setup.ts row's 'verifies fresh-DB precondition' claim was corrected to what the probe now asks, since a table inside the edited section still asserted the retired precondition."

patterns-established:
  - 'A guard whose corpus comes from `git ls-files` must be re-run with the new file STAGED, or the file it was written for is silently outside the scan'
  - 'A gate exit is written to a file by the same subshell that ran the gate and read from there, never inferred from a wrapper process that returned first'

requirements-completed: [PRESHIP-01]

coverage:
  - id: D1
    description: 'No live document states a database reset as a precondition of running the E2E suite; the retired instruction is gone from all three documents and the documented prerequisites match what the suite needs'
    requirement: PRESHIP-01
    verification:
      - kind: unit
        ref: 'packages/dev-seed/tests/e2eDocPreconditionGate.test.ts#frames no occurrence as a step taken before a run'
        status: pass
      - kind: other
        ref: "grep -c 'db:reset' tests/IDURA-TEST-RUNBOOK.md — 0; subsection-scoped awk over CLAUDE.md's 'Running tests after changes' — 0 (1 at HEAD~1)"
        status: pass
    human_judgment: false
  - id: D2
    description: 'CLAUDE.md and tests/README.md document the canonical project-id variable, the E2E project the suite owns, and the fact that the suite creates that project itself'
    requirement: PRESHIP-01
    verification:
      - kind: other
        ref: "grep -c 'PUBLIC_PROJECT_ID' CLAUDE.md — 1; grep -c 'no-db-reset' tests/README.md — 1; the new 'The project the suite owns' subsection"
        status: pass
    human_judgment: false
  - id: D3
    description: 'The retirement is enforced by an automated gate that fails if any live document reintroduces the instruction, proven by a recorded flip rather than by an absent-string search'
    requirement: PRESHIP-01
    verification:
      - kind: unit
        ref: 'packages/dev-seed/tests/e2eDocPreconditionGate.test.ts — 4 cases, red 4/4 against the pre-edit tree and against an injected precondition line, green after'
        status: pass
      - kind: unit
        ref: 'yarn workspace @openvaa/dev-seed test:unit — 59 files / 653 tests (was 58 / 649), the new file reported by name'
        status: pass
    human_judgment: false
  - id: D4
    description: 'The gate is scoped to live documents and the archived record is untouched; the non-precondition command documentation and the mid-run-wipe warning survive intact'
    requirement: PRESHIP-01
    verification:
      - kind: other
        ref: 'git diff --name-only HEAD~1 -- .planning/milestones — empty; the same over apps/supabase/README.md and packages/dev-seed/README.md — empty'
        status: pass
      - kind: unit
        ref: 'packages/dev-seed/tests/e2eDocPreconditionGate.test.ts#keeps the allowlist exact — 8 entries, each matching exactly one occurrence'
        status: pass
    human_judgment: false
  - id: D5
    description: 'The runbook prerequisites match reality, including the shell export the identity function needs on a local edge runtime'
    verification:
      - kind: other
        ref: 'the export and its one-sentence rationale in the Step B-3 Terminal-1 block, written against the measured four-cell matrix recorded by the prior plan'
        status: pass
    human_judgment: true
    rationale: 'Whether the exported value makes the real Idura flow work end to end is only observable by walking the opt-in manual runbook against a live broker, which this plan did not run'

duration: 22 min
completed: 2026-09-04
status: complete
---

# Phase 161 Plan 06: Documented E2E Prerequisites Summary

**The database reset is gone from every live document that stated it as an E2E precondition, the three documents now describe the project the suite owns and the `PUBLIC_PROJECT_ID` it is scoped to, and a committed vitest gate — red against the pre-edit tree, red against an injected precondition line, green now — is what keeps the instruction from coming back.**

## Performance

- **Duration:** 22 min
- **Started:** 2026-09-04T14:58:00Z (approx — first tool call)
- **Completed:** 2026-09-04T15:20:40Z
- **Tasks:** 2
- **Files modified:** 4 (1 created, 3 modified)

## Accomplishments

- **The primary retired instruction is gone.** `CLAUDE.md`'s "Running tests after changes" block no longer resets the database before the suite. It states the two prerequisites `yarn dev` actually supplies — local Supabase and one fresh dev server on the configured port — and adds why a reset is not among them: the suite owns a project distinct from the seed's, so a previous run's or a development session's rows are invisible to it.
- **`PUBLIC_PROJECT_ID` is documented where a developer and an agent will find it.** The Development Environment section now names it, gives its documented default, states that there is deliberately no fallback (an unset or non-canonical value throws at adapter construction), and records that the local edge runtime resolves it from the process environment rather than the root `.env`.
- **`tests/README.md` describes the lifecycle rather than a wipe.** The manual reseed chain no longer resets; the baseline-state assumption says what is actually true (an E2E project holding only this run's rows, with the rest of the database invisible); and a new subsection, *The project the suite owns*, states the fixed committed id, the create-after-preflight ordering and its reason, the deliberate non-deletion of the project row at teardown with the mechanism behind it, and `--no-db-reset` with when to use it.
- **The Idura runbook's prerequisites are true again**, and gained the one thing that was missing: the `PUBLIC_PROJECT_ID` export the local edge runtime needs, with the sentence saying why a value living only in the root `.env` never reaches the function.
- **The retirement is enforced, not merely performed.** `packages/dev-seed/tests/e2eDocPreconditionGate.test.ts` runs on `yarn test:unit`, reads the three documents, and fails on two independent grounds: precondition framing near a mention of the reset command, and any mention outside an eight-entry allowlist that names each survivor with its reason.

## Task Commits

1. **Task 1: retire the instruction and document the real prerequisites** — `c5571d937` (docs)
2. **Task 2: the committed gate** — `91921392c` (test)

## Files Created/Modified

- `CLAUDE.md` — the full-E2E block rewritten (reset line deleted, prerequisites stated, one paragraph on why no reset is needed); a new `PUBLIC_PROJECT_ID` entry in Development Environment.
- `tests/README.md` — the manual reseed chain, the `data-setup-base` row's stale precondition claim, the baseline-state bullet, the mid-run-wipe pitfall (kept, strengthened), and the new *The project the suite owns* subsection.
- `tests/IDURA-TEST-RUNBOOK.md` — the reset removed from the Step B-3 prerequisite sentence and from the Terminal-1 block; the `PUBLIC_PROJECT_ID` export and its rationale added in their place.
- `packages/dev-seed/tests/e2eDocPreconditionGate.test.ts` — 4 cases: a non-vacuity/population case, the framing half, the completeness half, and the allowlist-exactness half.

## Surviving occurrences, enumerated

Every remaining mention of the reset command in the three live documents, with the reason it stays. The gate's allowlist contains these eight and nothing else — asserted one-for-one, in both directions.

| Site | Line | Text (abridged) | Why it stays |
| --- | --- | --- | --- |
| `CLAUDE.md` | 17 | `yarn db:reset # Reset the database only (drops + recreates …)` | Setup command map — documents the command, asks nobody to run it |
| `CLAUDE.md` | 81 | `yarn db:reset # Reset the DB only: ensure Supabase is up …` | Database command map — the canonical description |
| `CLAUDE.md` | 82 | `yarn db:reset-with-data # db:reset, then db:seed …` | Command map — names the reset to define a sibling command |
| `CLAUDE.md` | 92 | `yarn dev:reset # db:reset, then launch the full stack …` | Command map — names the reset to define a wrapper command |
| `CLAUDE.md` | 93 | `yarn dev:reset-with-data # db:reset-with-data, then …` | Command map — names the reset to define a wrapper command |
| `CLAUDE.md` | 310 | `yarn db:reset-with-data # db:reset + default template …` | Local-seeding command map — a development workflow, not a run step |
| `CLAUDE.md` | 406 | `**Database issues**: Run \`yarn db:reset\` …` | Troubleshooting remedy for a broken database — a repair, not a run step |
| `tests/README.md` | 287 | `**\`yarn db:reset\` in another terminal will wipe the suite mid-run** …` | The mid-run-wipe warning — it forbids the act rather than prescribing it |

`tests/IDURA-TEST-RUNBOOK.md` carries **zero** occurrences. The gate asserts that too, as part of its population case: the set of files producing occurrences must be exactly `{CLAUDE.md, tests/README.md}`.

## The recorded flip — both halves

**Red, against the real pre-edit tree.** `git checkout HEAD~1 --` on the three documents, then the gate:

```
FAIL … > reads a non-empty population out of every document in scope
FAIL … > frames no occurrence as a step taken before a run
  AssertionError: expected [ …(8) ] to deeply equal []
  "CLAUDE.md:283 — 'yarn db:reset' reads as a precondition of a run (an E2E invocation in the same block appears within 3 lines) …"
  "tests/README.md:83 — 'yarn db:reset && yarn db:seed --template e2e/base && yarn dev:clean' reads as a precondition of a run (ordering language placing it before a run …)"
  "tests/IDURA-TEST-RUNBOOK.md:419 — 'server stealing the port) + a **clean DB** (`yarn db:reset`) before the run.' … (a prerequisite label …)"
  "tests/IDURA-TEST-RUNBOOK.md:424 — 'yarn db:reset # clean DB first (project-memory prereq)' … (reset-first phrasing …)"
FAIL … > leaves no occurrence unaccounted for          (5 unlisted)
FAIL … > keeps the allowlist exact                     (1 entry matching 0 occurrences)
```

4 of 4 cases red, naming all four retired sites. Restored with `git checkout HEAD --`; green, 4 passed.

**Red again, against an injected line** — a `### Prereqs` heading plus `Run \`yarn db:reset\` before \`yarn test:e2e\` so the suite starts from a clean database.` inserted into `tests/README.md`:

```
tests/README.md:18 — 'Run `yarn db:reset` before `yarn test:e2e` so the suite starts from a clean database.'
  reads as a precondition of a run (an E2E invocation in the same block appears within 3 lines) …
tests/README.md:18 — … (a prerequisite label appears within 3 lines) …
tests/README.md:18 — … is a new mention of the reset command in a live document. Either retire it, or add it
  to ALLOWLIST in this file with the reason it is not an instruction to clear the database before a run.
```

The message names the file, the 1-based line and the injected text, and both halves fire independently. Reverted with `git checkout -- tests/README.md`; green again, 4 passed.

## Non-vacuity of the instruments

- **The population is non-zero and measured, not assumed.** Eight occurrences across two documents; the gate asserts `> 0` and asserts the exact set of files producing them, so a scan that lost a document is a failure rather than a clean result.
- **The framing patterns discriminate.** Run over both trees before the gate was trusted: they fire on all four retired sites at `HEAD~1` and on **none** of the eight survivors at `HEAD`. A pattern set that matched everything, or nothing, would have asserted nothing either way.
- **The comment-hygiene guard actually saw the new file.** Its corpus comes from `git ls-files`, so with the file untracked it scanned **1655** files — the same count as before the file existed. Staged, it scanned **1656**, still 0 violations. The zero is a verdict on this file, not on a corpus that excluded it.
- **Every gate exit was read directly.** `lint:check` was backgrounded per the standing lesson, with its status written to a file by the same subshell that ran it. The harness's own completion notice reported exit 0 for the *wrapper* while the chain was still running — read as the gate's verdict it would have been wrong, and it was not read that way.

## Verification Results

| Gate | Result |
| --- | --- |
| `yarn workspace @openvaa/dev-seed test:unit` | **exit 0** — 59 files / 653 tests (58 / 649 before), `e2eDocPreconditionGate.test.ts` reported by name |
| `yarn test:unit` (whole workspace) | **exit 0** |
| `TURBO_FORCE=true yarn lint:check` | **exit 0** — full chain; project-scoped query guard 0 violations, comment hygiene 0 violations |
| `node scripts/assert-comment-hygiene.mjs` (file staged) | **exit 0** — 1656 files, 0 violations |
| `npx prettier --check` on the three documents + the test | **exit 0** |
| `grep -c 'db:reset' tests/IDURA-TEST-RUNBOOK.md` | **0** |
| `grep -c 'PUBLIC_PROJECT_ID' CLAUDE.md` | **1** |
| `grep -c 'teardown projects are the only legitimate path' tests/README.md` | **1** |
| `grep -c 'no-db-reset' tests/README.md` | **1** |
| `grep -c 'milestones' packages/dev-seed/tests/e2eDocPreconditionGate.test.ts` | **0** |
| `git diff --name-only HEAD~1 -- .planning/milestones` | empty |
| `git diff --name-only HEAD~1 -- apps/supabase/README.md packages/dev-seed/README.md` | empty |

## Decisions Made

See `key-decisions` in the frontmatter. The one worth restating: the gate does **not** search for the literal string the roadmap quotes. That string is absent from the repository, so a literal grep would pass on a tree where the instruction had returned in any other wording — the vacuous-guard failure this phase has already hit once. The gate matches the command token and judges its context, and it was flipped in both directions before being believed.

## Deviations from Plan

### Measured corrections to filed documents

**1. [Rule 6 - False premise] Task 1's `awk` acceptance instrument is unsatisfiable as written**

- **Found during:** Task 1 verification.
- **Criterion:** ``awk '/### Running tests after changes/,/^## /' CLAUDE.md | grep -c 'db:reset'`` returns 0.
- **Measured:** the range's terminator `^## ` matches only an h2 heading, and the next h2 after the block is `## Important Implementation Notes` — four subsections later. The range therefore spans *Debugging matching algorithm*, *Fixing "module not found" errors* and *Seeding local data*, and necessarily captures `CLAUDE.md:310`, a command-map entry **DR-16 explicitly protects**. At `HEAD~1` the instrument returned **2**; after a correct edit it returns **1**, and the only way to reach 0 would be to delete a line the plan forbids deleting.
- **Fix:** the instrument was scoped to the subsection it names — `awk '/^### Running tests after changes/{f=1;next} /^#{2,3} /{f=0} f'` — which returns **1** at `HEAD~1` and **0** now. The document was corrected; the instrument was corrected; nothing was bent to reach a number.
- **Committed in:** `c5571d937` (the edit); the corrected instrument is recorded here and re-expressed as an assertion inside the gate.

**2. [Rule 1 - Bug] A retired precondition survived inside the section being edited**

- **Found during:** Task 1, item (7).
- **Issue:** the setup/teardown table's `base.setup.ts` row read "verifies fresh-DB precondition" — a claim the prior plan's probe re-aim had already falsified, and one that asserts the very precondition this plan retires, three lines above the section it was adding to.
- **Fix:** rewritten to what the probe now asks: it warns when the E2E project already holds rows this run does not own.
- **Verification:** the gate's framing half passes over the whole file; the row no longer states a precondition.
- **Committed in:** `c5571d937`

### Items from the stale-claims todo — disposition

`.planning/todos/pending/2026-08-28-claude-md-stale-factual-claims.md` lists three claims; its 2026-09-03 update records claim 1 as already corrected elsewhere.

- **Closed here:** none. Neither open claim sits inside a block this task rewrote.
- **Left open, deliberately:** claim 2 (`@openvaa/app-shared` described as building ESM **and** CommonJS — `CLAUDE.md:124`, inside *Core Logic Packages*) and claim 3 (the local-adapter line, inside *Frontend Data Flow*, plus the `apps/frontend/data/` line it flags). Both belong to the phase that owns `CLAUDE.md` as a deliverable surface; the todo also asks for an audit of the whole `db:*` / `dev:*` command block, which is beyond this plan's scope. Fixing them here would have been exactly the scope expansion the task text prohibits.

---

**Total deviations:** 2 (1 false plan premise, 1 bug). **Impact:** no stated behaviour dropped, no scope added. The correction that carries downstream weight is the first one — a later reader running the plan's literal `awk` will get `1` and should not conclude the retirement failed.

## Issues Encountered

- **`git ls-files` corpora do not see untracked files.** The comment-hygiene guard scanned 1655 files with the new test on disk but untracked — the identical count to before it existed. It had to be staged for the guard to scan it (1656). A guard run before staging would have reported a green that said nothing about the file it was run for.
- **A backgrounded gate's wrapper exit is not the gate's exit.** `(cmd > log; echo $? > exit) &` returns immediately, and the harness reported "completed (exit code 0)" while `lint:check` was still running. The true status came from the exit file the subshell itself wrote, polled until it appeared. This is the same failure shape as reading an exit status through a pipe, one layer out.
- **The `E2E_PROJECT_ID` double-resolver risk touched by these edits.** `tests/README.md`'s new subsection documents the override. It deliberately does **not** bless either resolver: the text states that the default is spelled out independently in the harness's TypeScript resolver and in `tests/scripts/e2e-run.sh`, that an override therefore belongs in the environment where both read it, and that neither is authoritative over the other. The divergence risk the prior plan flagged is unchanged by this plan — it is now merely visible to a reader.

## User Setup Required

None. This plan adds no dependency, no external service and no required environment variable. The `PUBLIC_PROJECT_ID` export documented in the Idura runbook is a prerequisite of that opt-in manual flow only, and was already required before this plan documented it.

## Next Phase Readiness

- **Criterion 4 is delivered and enforced.** No live document states a reset as an E2E precondition, and the gate that says so runs on every `yarn test:unit`.
- **What `161-07` inherits:** the invocation its runs need is documented in `tests/README.md` (`--no-db-reset`, with the posture keys it records), and nothing it reads now tells it to reset first. If one of its runs surfaces the freshness probe's warning, the pitfall paragraph is where a reader is sent.
- **Open, deliberately:** the two remaining stale `CLAUDE.md` claims (above), and the `E2E_PROJECT_ID` double resolver, which this plan documents rather than unifies.
- **Nothing was pushed.**

---

_Phase: 161-project-scoping-project-id-parameterisation_
_Completed: 2026-09-04_

## Broken-windows ledger

`.planning/WINDOWS.md` still refuses `windows append` — its rendered table disagrees with its own fenced JSON, the same pre-existing refusal a prior plan in this phase recorded, and untouched by this plan. The entry it would have carried:

- `deviation` — the plan's `awk` acceptance instrument for `CLAUDE.md`'s "Running tests after changes" block is unsatisfiable as written; the subsection-scoped form is the one that measures the invariant.

No stub, skipped test or unrun `<verify>` was produced by this plan.

## Self-Check: PASSED

- All four created/modified files verified present on disk with `[ -f ]`.
- Both commits (`c5571d937`, `91921392c`) verified reachable with `git log --oneline --all`.
- `git diff --diff-filter=D --name-only` over both commits is empty: no file was deleted by this plan.
- No stubs, no skipped tests, no unrun `<verify>`. Every gate named in the plan was run to a directly-read exit code, with the one acceptance instrument that could not be satisfied as written measured, corrected and recorded above.
