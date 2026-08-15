---
phase: 140-blind-matcher-remediation-teardowns-null-matchers-positive-c
plan: 03
subsystem: testing
tags: [playwright, e2e, dev-seed, seed-templates, negative-control, positive-control, app-settings, svelte]

# Dependency graph
requires:
  - phase: 140-01
    provides: '140-NEGATIVE-CONTROL.md — the evidence document this plan appends Part III to, plus the HYGIENE-LOOP / COLLATERAL RULE / TWO-COLUMN conventions it inherits from 139-VERDICTS.md § 3'
  - phase: 140-02
    provides: 'the released contention on tests/playwright.config.ts, and the SOFT_ASSERTION_BUDGETS config-load guard that every Playwright invocation in this plan had to satisfy (it did; voter-journey.spec.ts was not touched)'
  - phase: 137
    provides: 'tests/scripts/e2e-run.sh and the served-application preflight — the exit-0-implies-preflight-confirmed property that makes both runs in this plan admissible evidence'
  - phase: 94
    provides: 'the 22 perm spec/template/setup family and its shared app_settings baseline (packages/dev-seed/src/templates/e2e/perm/shared.ts)'
provides:
  - '`elections: 2` on permHideCategoryTagsTemplate — the seeded precondition that lets the COMPLEMENTARY ElectionTag render in the category-tags dataset (getElectionsToShow returns [] below two elections)'
  - '`questions: { showCategoryTags: true }` in permHideElectionTagsTemplate.settingsOverlay — the seeded precondition that lets the COMPLEMENTARY CategoryTag render in the election-tags dataset'
  - 'Both perm template doc blocks rewritten to name the new topology AND the forthcoming positive control, so neither header drifts'
  - '140-NEGATIVE-CONTROL.md Part III (§§ 13-15) — the F9 lane: the defect, the rebuildable injection diff, RUN 0 (precondition confirmation) and RUN 1 (blindness), with the honest-gaps section'
  - 'The observed fact that 86/86 tests stay green with the tag-render path deleted from production source — the vacuity ROADMAP criterion 3 exists to close'
affects: [140-04, 140-06, 142-assert-07, any-future-perm-positive-control-work]

actuals:
  tokens: 6600
  tasks: 2
  commits: 2

tech-stack:
  added: []
  patterns:
    - 'In-dataset positive control: seed the precondition for the COMPLEMENTARY element in the same template, so one spec can pair an absence assertion with a presence assertion and fail on a render-path deletion'
    - 'Cross-transplant between sibling perm templates: when two datasets are each other analog, the missing precondition is usually the property the sibling already carries'
    - 'RUN 0 (precondition confirmation) recorded and explicitly labelled NOT a control half, taken BEFORE any assertion is added, so a later red cannot be misattributed to a walk regression'
    - 'Header updated in the same commit as the behaviour it describes — a stale doc block is the F10 defect class, and remediating one drift while creating another is self-defeating'

key-files:
  created: []
  modified:
    - packages/dev-seed/src/templates/e2e/perm/perm-hide-category-tags.ts
    - packages/dev-seed/src/templates/e2e/perm/perm-hide-election-tags.ts
    - .planning/phases/140-blind-matcher-remediation-teardowns-null-matchers-positive-c/140-NEGATIVE-CONTROL.md

key-decisions:
  - 'Design A (in-dataset cross-transplant) executed as planned: it is the only design under which ROADMAP criterion 3 sentence — the NAMED pair fails when the tag stops rendering — is literally true'
  - 'The election COUNT, not a flag, is the load-bearing edit for perm-hide-category-tags: the perm baseline already sets elections.showElectionTags true, and getElectionsToShow gates on elections.length < 2 (electionTags.ts:13)'
  - 'The election-tags overlay was EXTENDED, not replaced: showElectionTags: false and showCategoryTags: true now sit side by side, and buildMinimal deep-merges so the other questions.* keys are undisturbed'
  - 'D-03 honoured: QuestionHeading.svelte was mutated ONLY by deleting the two rendering {#if} blocks; ctx reads, appSettings access and $derived declarations untouched, and the now-unused imports deliberately left in place because removing them would be a refactor rather than the minimal mutation'
  - 'The plan premise that packages/dev-seed must be REBUILT is factually wrong and is recorded as such rather than quietly satisfied: dev-seed build is `echo Nothing to build`, exports point at ./src/index.ts, and there is no dist — so no stale artifact can exist'
  - 'Where the plan grep counts contradicted the measured file, the measurement was recorded and the INTENT verified by a stronger check, rather than editing prose to satisfy a grep'

patterns-established:
  - 'Precondition-before-assertion sequencing: land the seeded precondition and prove the widened walk passes in one commit, take the blindness observation in the next, and only then add the assertion in a later plan — each red thereafter has exactly one possible cause'
  - 'Prove the transitive-coverage claim rather than assuming it: the plan asserted one --project invocation runs both specs; results.json was queried per-project to observe it'
  - 'Report the sharper form of a blindness finding: not "the two named specs are blind" but "86 tests ran against a build with no tag rendering anywhere and the suite reported success"'

requirements-completed: []

coverage:
  - id: D1
    description: 'perm-hide-category-tags seeds 2 elections, so the complementary ElectionTag can render at all — the seeded precondition for its positive control'
    requirement: ASSERT-05
    verification:
      - kind: e2e
        ref: 'tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/140-f9-precondition --project perm-hide-category-tags (exit 0, 86 expected / 0 unexpected, preflight 1 success / 0 failures; data-setup-perm-hide-category-tags exact-equality app_settings assertion passed)'
        status: pass
      - kind: other
        ref: "grep -c 'elections: 2' packages/dev-seed/src/templates/e2e/perm/perm-hide-category-tags.ts == 1"
        status: pass
    human_judgment: false
  - id: D2
    description: 'perm-hide-election-tags overlay extended with questions.showCategoryTags: true, so the complementary CategoryTag renders'
    requirement: ASSERT-05
    verification:
      - kind: e2e
        ref: 'same run — data-setup-perm-hide-election-tags and perm-hide-election-tags spec projects both `expected`, proving the extended overlay stays self-consistent with setupFromTemplate.ts:256-260 exact-equality'
        status: pass
      - kind: other
        ref: "grep -c 'showCategoryTags: true' == 1 AND grep -c 'showElectionTags: false' still present (overlay extended, not replaced)"
        status: pass
    human_judgment: false
  - id: D3
    description: 'Both template doc blocks rewritten to name the new topology and the forthcoming positive control'
    requirement: ASSERT-05
    verification:
      - kind: other
        ref: "sed -n '1,16p' on each template matches both '2 elections' and 'positive control'"
        status: pass
    human_judgment: false
  - id: D4
    description: 'F9 RUN 1 (blindness) observed and recorded: both perm specs, and all 86 tests in the chain, stay green with the tag-render path deleted from QuestionHeading.svelte'
    requirement: ASSERT-05
    verification:
      - kind: e2e
        ref: 'tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/140-f9-before --project perm-hide-category-tags (exit 0, 86 expected / 0 unexpected / 0 flaky, preflight 1 success / 0 failures, injection live per worktree-status.txt)'
        status: pass
      - kind: other
        ref: 'three-check POST-GATE: per-path git status empty, scoped git status empty, no INJECTED (140) marker'
        status: pass
    human_judgment: false
  - id: D5
    description: '140-NEGATIVE-CONTROL.md Part III (§§ 13-15) records the F9 defect, the rebuildable injection, RUN 0, RUN 1, the empty collateral column and § 15.7 what this half does NOT discharge'
    requirement: ASSERT-05
    verification:
      - kind: manual_procedural
        ref: '.planning/phases/140-.../140-NEGATIVE-CONTROL.md §§ 13-15 (lines 1248-1620)'
        status: pass
    human_judgment: true
    rationale: 'Whether an evidence document is honest — whether § 15.7 genuinely names what is not discharged rather than performing candour — is a judgement about the writing, not a property any command can assert'

# Metrics
duration: 33min
completed: 2026-08-15
status: complete
---

# Phase 140 Plan 03: F9 Positive-Control Preconditions & Blindness Half Summary

Seeded each perm tag dataset with the precondition for its sibling's tag to render, then observed the
vacuity that makes the fix necessary: 86/86 tests stay green with the tag-render path deleted from
production source.

## What Was Built

**Two seed-template edits, one property each way.** `perm-hide-category-tags` and
`perm-hide-election-tags` are each other's analog, and Design A of the plan is a literal
cross-transplant:

| Template | Edit | Why this property and not another |
|---|---|---|
| `perm-hide-category-tags.ts` | `elections: 1` → `elections: 2` | `getElectionsToShow` returns `[]` when `elections.length < 2` (`apps/frontend/src/lib/utils/questions/electionTags.ts:13`). The perm baseline already sets `elections.showElectionTags: true` (`shared.ts`), so the missing ingredient was the election **count**, not a flag. At one election a future ElectionTag presence assertion would be red for a reason unrelated to the tag component. |
| `perm-hide-election-tags.ts` | `settingsOverlay` extended with `questions: { showCategoryTags: true }` | Overrides the perm baseline's `showCategoryTags: false` so the complementary CategoryTag renders. The existing `elections: { showElectionTags: false }` entry is extended, not replaced, and `buildMinimal`'s deep merge leaves `questions.categoryIntros` / `questionsIntro` / `showResultsLink` undisturbed. |

Neither edit introduces a new option key — `elections` and `settingsOverlay` are both first-class
`BuildMinimalOptions` fields (`buildMinimal.ts:77-107`). Both doc blocks were rewritten in the same
commit to name the new topology and the forthcoming positive control.

**Part III of the evidence document** (`140-NEGATIVE-CONTROL.md` §§ 13-15, 372 new lines): the defect
stated exactly, the seeded preconditions, the rebuildable injection diff, the HYGIENE-LOOP adapted to a
Playwright vehicle, the environment delta, RUN 0, RUN 1, an empty collateral column, and § 15.7 listing
six things this half does not discharge.

## The Two Runs

**RUN 0 — precondition confirmation, explicitly not a control half** (`tests/e2e-runs/140-f9-precondition`,
HEAD `d66467616`): exit 0, 86 expected / 0 unexpected / 0 flaky, preflight 1 success / 0 failures. This
was taken *before any assertion was added*, so a later red cannot be misattributed to the widened
category-tags walk — which now traverses an inserted election-selector page. It also confirmed two
things the plan had asserted rather than observed: that a single `--project perm-hide-category-tags`
invocation transitively executes both specs (`playwright.config.ts:1081`), and that both post-seed
**exact-equality** `app_settings` assertions (`setupFromTemplate.ts:256-260`) accept the new overlays —
an overlay change not mirrored in its template expectation would have failed the *setup*, loudly.

**RUN 1 — blindness** (`tests/e2e-runs/140-f9-before`, HEAD `4c0bf5839`, injection live): exit 0, 86
expected / 0 unexpected / 0 flaky, preflight 1 success / 0 failures. Both `{#if}` tag-render blocks were
deleted from `QuestionHeading.svelte` and **both perm specs still passed** — as did the other 84 tests in
the chain, including `voter-journey` and `candidate-journey`.

The provenance is what makes the halves comparable: both specs were untouched since `e4de205c4`
(2026-06-03) and carried exactly one assertion each, the absence one; the template edits were already
*committed*, so the runner's own pre-run `worktree-status.txt` shows the injection as the sole source
difference between RUN 0 and RUN 1.

## The Finding

`expect(tag).toHaveCount(0)` reports "the setting suppressed the tag" and "the component that would
render the tag no longer exists" with the same green. It measures the absence of an element — a state
the page reaches for at least four distinct reasons, only one of which is under test.

The sharper form: the blind spot is not confined to the two specs that name the tags. The entire chain
ran against a build in which no question heading anywhere renders any tag, and the suite reported
success. This is exactly why the remedy is a complementary **presence** assertion in the same dataset
rather than a stronger matcher — no count matcher can distinguish cases whose observable is identical.

## Deviations from Plan

### Corrections to plan premises (recorded, not silently satisfied)

**1. [Rule 1 - False premise] `packages/dev-seed` has no build artifact; the "stale build" risk does not exist**

- **Found during:** Task 1, at the rebuild step
- **Issue:** The plan's `must_haves.truths` asserted "`packages/dev-seed` is rebuilt before any E2E run
  that depends on the template edits; `tests/` consumes it as a built workspace package… A stale build
  silently seeds the old dataset and produces a false green", and an acceptance criterion required
  "the built `packages/dev-seed/dist` output is newer than both edited template sources".
- **Measured reality:** `packages/dev-seed/package.json` declares `"build": "echo 'Nothing to build.'"`,
  `"main": "./src/index.ts"` and `"exports": { ".": "./src/index.ts" }`. `ls packages/dev-seed/dist` →
  *No such file or directory*, and `yarn build` emits `WARNING no output files found for task
  @openvaa/dev-seed#build`. The package is **source-resolved**; there is no artifact that can go stale.
- **Action:** `yarn build` was run anyway (exit 0, 14/14 tasks) because the frontend and the other
  packages the dev server serves genuinely do build. The unsatisfiable dist-freshness criterion is
  recorded here instead of being faked. The real proof that the new dataset was seeded is the E2E run
  itself: both setups' exact-equality `app_settings` assertions passed against the new overlays.
- **Files modified:** none
- **Commit:** n/a (documentation-only correction)

**2. [Rule 1 - Measurement over prediction] Two acceptance-criterion grep counts predicted 1; the measured value is 2**

- **Found during:** Tasks 1 and 2
- **Issue:** Three criteria predicted `grep -c` values of 1 that the files do not have, because the
  pattern also occurs in a doc block that predates this plan:
  | Grep | Predicted | Measured (before AND after this plan) | Why |
  |---|---|---|---|
  | `showCategoryTags: false` in `perm-hide-category-tags.ts` | 1 | **2** | The template's own doc block names the setting under test on its `Topology`/setting line |
  | `showElectionTags: false` in `perm-hide-election-tags.ts` | 1 | **2** | same |
  | `showCategoryTags` in `QuestionHeading.svelte` | 1 | **2** | The component's `### Settings` doc block (line 18) names it alongside the code at line 85 |
- **Action:** No prose was deleted to satisfy a grep — the doc blocks are correct and the greps were
  written against an assumed file shape. The criteria's *intent* was verified by stronger checks
  instead: exactly **one code-site occurrence** of each (confirmed by grepping below the `import` line),
  and for the component, an **empty per-path `git status --porcelain`**, which asserts byte-equality with
  HEAD across the whole file rather than at two grep sites. Recorded in `140-NEGATIVE-CONTROL.md` § 15.4.
- **Files modified:** none

**3. [Rule 2 - Threat mitigation verified] T-140-04 reachability check executed before the edits landed**

- **Found during:** Task 1
- **Action:** Grepped `packages/dev-seed/src`, `apps/supabase` and root `package.json` for both template
  names. Both appear **only** in `packages/dev-seed/src/templates/index.ts` (registry map entries
  `'perm-hide-election-tags'` / `'perm-hide-category-tags'` plus their re-exports), reachable solely via
  an explicit `--template e2e/perm/<name>` selection from the corresponding `*.setup.ts`. Neither is the
  `default` template, neither is referenced by `apps/supabase/seed.sql`, and neither is reachable from
  `yarn db:reset-with-data`. T-140-04 mitigation confirmed by measurement.

### Assertions weakened

**None.** Per the plan's active prohibition, no assertion — existing or new — was weakened. The two
absence assertions are byte-identical to their 2026-06-03 form; the post-seed exact-equality
`app_settings` assertion was left untouched and passed on both edited templates.

### Two-run controls recorded

**Only what was actually executed.** RUN 0 and RUN 1 each trace to a captured run log and a retained
evidence directory (`tests/e2e-runs/140-f9-precondition/`, `tests/e2e-runs/140-f9-before/`, both
gitignored at `.gitignore:44`). RUN 2 — the catch half — is **not** recorded here, because it has not
been run; it is plan `140-04`'s work, and the section explicitly says so.

## Threat Flags

None. No new network endpoint, auth path, file-access pattern or schema change at a trust boundary. The
only production-source mutation (T-140-10, `QuestionHeading.svelte`) was transient and is byte-restored,
verified by the three-check POST-GATE plus an empty per-path `git status --porcelain`.

## Known Stubs

None. Every `<verify>` in the plan was executed; no test was skipped, stubbed or annotated as flaky.

## E2E Hard Rule

Honoured. Two full preflight-confirmed runs, both exit 0, 86/86 expected, 0 unexpected, 0 flaky, 0
skipped, 0 retries. The one run that was *expected* to be green while production source was broken
(RUN 1) is the finding itself, recorded as such — not a suppressed failure.

## Notes for Plan 04

- The injection diff in `§ 13.3` is the one to re-apply **byte-identically**; anything else breaks the
  comparability of the two halves.
- Per `140-03`'s recorded conflict resolution, the presence assertions use the **house form**
  (`const count = await locator.count(); expect(count, '<why>').toBeGreaterThan(0)`, as at
  `perm-answers-locked.spec.ts:54`), not `.not.toHaveCount(0)`, and `140-VALIDATION.md`'s ASSERT-05 rows
  are to be updated to match.
- Adding assertions to these two perm specs does **not** touch `voter-journey.spec.ts`, so the
  `SOFT_ASSERTION_BUDGETS` guard from plan 02 needs no budget update — unless a soft assertion is used,
  which the perm Rigidity contract forbids anyway.
- `§ 15.7` states that RUN 1 does not directly observe the DOM. Plan 04's RUN 2 is what converts it: if
  the new presence assertions do **not** go red under the same injection, RUN 1's premise is
  retroactively invalid and must be re-examined rather than explained away.

## Self-Check: PASSED

Files verified present:

- FOUND: `packages/dev-seed/src/templates/e2e/perm/perm-hide-category-tags.ts`
- FOUND: `packages/dev-seed/src/templates/e2e/perm/perm-hide-election-tags.ts`
- FOUND: `.planning/phases/140-.../140-NEGATIVE-CONTROL.md` (1619 lines, Part III at 1248-1620)
- FOUND: `tests/e2e-runs/140-f9-precondition/` and `tests/e2e-runs/140-f9-before/` (gitignored evidence dirs)

Commits verified present:

- FOUND: `4c0bf5839` test(140-03): seed the complementary tag preconditions in the two perm templates
- FOUND: `7f41b18aa` docs(140-03): record the F9 blindness half — 86 green with the tag render path deleted
