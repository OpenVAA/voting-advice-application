---
phase: 152-comment-naming-hygiene-sweep
plan: 09
subsystem: packages
tags: [sweep, judgement-pass, shared-packages, convention-comments, behaviour-neutrality, classifier-false-positive, codemod-residue-repair]

# Dependency graph
requires:
  - phase: 152-comment-naming-hygiene-sweep
    provides: "152-05's `assert-comment-only-diff.mjs` prover, the shared `hygiene-codemod.mjs` classifier, and `152-RESIDUE-REGISTER.md`'s seven-way prefix partition"
  - phase: 152-comment-naming-hygiene-sweep
    provides: "152-06's finding that the shipped gate invocation exits 2 under a caller-supplied pathspec, and its reword-don't-strip precedent for numerals that carry meaning"
  - phase: 152-comment-naming-hygiene-sweep
    provides: "152-07's memo items 10 and 11 — the gate is not a completeness test, and the register's per-plan queue is a floor"
  - phase: 152-comment-naming-hygiene-sweep
    provides: "152-08's four added scanner classes, its assert-once-per-replacement applier, and its 64% gate-blindness measurement"
  - phase: 152-comment-naming-hygiene-sweep
    provides: "152-05's discharged E2E cardinal gate (150 passed / 0 failed / 0 did-not-run), which is why a comment-only plan does not re-run the suite"
provides:
  - "the eleven non-dev-seed `packages/**` workspaces swept — every data-model, matching, filter and settings convention kept, every citation gone"
  - "a THIRD measurement of the gate-vs-reality gap, and the first that separates id-shaped residue from id-less narrative: the gate saw 13 of 28 real lines, missing 54%"
  - "the finding that an id-shaped scanner, however wide, cannot see narrative naming no artifact — 5 of this partition's 28 lines were found only by reading"
  - "`packages/dev-tools/**` checked and cleared: in the prefix, named by no plan frontmatter and in no register queue"
  - "one more 152-05-class codemod sentence break repaired, and the partition proven to hold no others"
  - "a negative finding on BOTH fenced operator questions (memo items 12 and 13): neither fires in this partition"
  - "the classifier's YAML block-scalar blind spot, registered rather than worked around"
affects: [152-10, 152-11, 152-12, 152-13, 152-14, 152-15]

# Actuals (#2632)
actuals:
  tokens: 34000
  tasks: 3
  commits: 3

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "assert-once-per-replacement applier, inherited from 152-06/07/08: a table of [file, old, new, expectedCount] verified against the ORIGINAL text in full BEFORE any byte is written; a drifted anchor aborts the whole batch rather than applying a subset"
    - "THREE-TIER completeness measurement — nine gate rows, then an id-shaped wide sweep, then a second-order scan for planning DEIXIS that carries no id (`this phase`, `the phase ledger`, `RED before the product fix`, `T1`/`T2`/`T3`)"
    - "flip-tested gate: nine injected tokens turn all nine rows red, reverting returns all nine to zero — run because a gate that examines nothing also reports green"
    - "prefix-partition sweep: the register's span-derived per-plan file list treated as a floor, the prefix rule (`packages/` after `packages/dev-seed/`) as the authority"
    - "reword-don't-strip for numerals that name something other than a planning phase (152-06's Playwright precedent, applied to `PHASE 1..4` → `STAGE 1..4`)"

key-files:
  created: []
  modified:
    - packages/data/src/objects/questions/variants/multipleChoiceCategoricalQuestion.test.ts
    - packages/filters/src/filter/enumerated/enumeratedFilter.ts
    - packages/filters/tests/filter.test.ts
    - packages/app-shared/src/settings/dynamicSettings.type.ts
    - packages/app-shared/src/utils/mergeSettings.ts
    - packages/argument-condensation/src/core/condensation/condenser.ts
    - packages/argument-condensation/tests/condensation/condenseQuestions.test.ts
    - packages/argument-condensation/tests/unit/handleQuestion.test.ts
    - packages/question-info/src/core/infoGeneration.ts
    - packages/question-info/tests/questionTypes.test.ts
    - packages/supabase-types/src/column-map.ts

key-decisions:
  - "`condenser.ts`'s `PHASE 1..4` labels were REWORDED to `STAGE 1..4`, not stripped. They name the four internal stages of one method, not this project's planning phases — 152-06's Playwright precedent (memo item 7). `STAGE` was chosen over `STEP` because `step`/`stepIndex` already names the condensation plan's own steps in the same method."
  - "`packages/shared-config/**` was not edited at all. Its five `\\uXXXX` occurrences are import-sort regex STRING LITERALS, and the gate reported zero on every row over that workspace, so there was nothing to sweep and nothing to risk."
  - "`packages/question-info/src/prompts/en/generateBoth.yaml:30,36` were left byte-identical. `## Task 1:` / `## Task 2:` sit inside a `promptText: |` block scalar — LLM prompt content, not comments. The shared classifier reads a leading `#` in YAML as a comment opener and has no block-scalar state, so it over-reports. Editing them would change model input."
  - "`packages/dev-tools/**` is inside the prefix, is named by no plan frontmatter in the phase and appears in no register queue. It was checked (nine gate rows 0, wide sweep 0) rather than assumed, and needed nothing."
  - "The T1/T2/T3 assertion labels in `questionTypes.test.ts` were struck but every assertion kept its reason, re-tensed from 'RED before the product fix' into what a type-blind composition breaks — so the note explains the guard instead of dating it."
  - "`matchingAlgorithm.ts:44`'s `see.` typo was NOT fixed: `git log -S` traces it to a 2024 formatting refactor, not to any citation strip, so it falls outside this plan's scope boundary. Registered."

coverage:
  - deliverable: "packages/{core,data,matching,filters}/** swept — 4 rules at 4 sites across 3 files"
    verification:
      - kind: command
        ref: "node .planning/phases/152-comment-naming-hygiene-sweep/scripts/assert-comment-only-diff.mjs --range 87e02f40b~1..87e02f40b"
        status: pass
      - kind: command
        ref: "transcribed nine-row gate over packages/{core,data,matching,filters} — 0 on every row"
        status: pass
      - kind: test
        ref: "@openvaa/data 244 tests / @openvaa/filters 22 tests / @openvaa/matching 43 tests / @openvaa/core 8 tests — all passed, counts identical before and after"
        status: pass
    human_judgment: false
  - deliverable: "packages/{app-shared,shared-config,supabase-types,llm,argument-condensation,question-info,dev-tools}/** swept — 26 rules at 26 sites across 8 files"
    verification:
      - kind: command
        ref: "node .planning/phases/152-comment-naming-hygiene-sweep/scripts/assert-comment-only-diff.mjs --range 7390fd983~1..7390fd983"
        status: pass
      - kind: command
        ref: "transcribed nine-row gate over the seven workspaces — 0 on every row"
        status: pass
      - kind: command
        ref: "git grep -c -P '\\\\u[0-9a-fA-F]{4}' -- packages/shared-config/eslint.config.mjs → 5, unchanged"
        status: pass
    human_judgment: false
  - deliverable: "the empty-include contract survives its citation"
    verification:
      - kind: test
        ref: "packages/filters/tests/filter.test.ts — 22/22 passed, incl. the empty-include-semantics test"
        status: pass
    human_judgment: false
  - deliverable: "PHASE 1..4 reworded to STAGE 1..4 without losing the sequence"
    human_judgment: true
    rationale: "Whether STAGE reads as well as PHASE for a reader of the condensation executor is a judgement no test makes. The four labels and their bodies are recorded verbatim below."
  - deliverable: "the gate-vs-reality gap measured at 54% on this partition"
    verification:
      - kind: command
        ref: "comment-scoped gate at 87e02f40b~1 → 13 lines / 6 files; id-shaped wide sweep → 29 lines / 11 files (6 false positives); second-order narrative scan → 5 further real lines"
        status: pass
    human_judgment: true
    rationale: "The classification of each wide-sweep hit as real or false-positive was made by reading it. A reviewer must accept the classification, not just the arithmetic; every hit is enumerated below."
  - deliverable: "one 152-05-class sentence break repaired, and no others in the partition"
    verification:
      - kind: command
        ref: "git show 0c538024c -- …/multipleChoiceCategoricalQuestion.test.ts → '(binary subdimensions per D-06).' became '(binary subdimensions per).'"
        status: pass
      - kind: command
        ref: "comment-scoped seven-signature damage scan over packages/** excl. dev-seed → this line plus false positives only"
        status: pass
    human_judgment: false

requirements-completed: [REVIEW-HYG-02]

duration: 1h 18m
completed: 2026-08-29
status: complete
---

# Phase 152 Plan 09: Shared Packages Sweep Summary

Swept the eleven non-dev-seed `packages/**` workspaces — the smallest partition of the seven by
span count and, as the register warned it might be, not the smallest by work. Every data-model,
matching, filter and settings convention survives as a citation-free statement; the shared lint
configuration is byte-identical; one sentence the phase's own predecessor broke is repaired.

**Duration:** 1h 18m · **Tasks:** 3 · **Commits:** 3 · **Files:** 11 · **Rules/sites:** 30/30

---

## The two completeness numbers, and a third the memo did not ask for

The memo required both what the gate says and what the wider sweep finds. Measuring this
partition produced a **third** tier, because the wider sweep was not enough either.

| Measure, at the pre-plan baseline `87e02f40b~1`, over `packages/**` excluding `dev-seed/` | Comment lines | Files |
|---|---:|---:|
| Matched by the **nine gate rows** (raw and comment-scoped agree exactly) | **13** | 6 |
| Matched by the **id-shaped wide sweep** (152-07's grep + 152-08's four classes + 10 more) | **29** | 11 |
| — of which **false positives**, read individually | 6 | — |
| — id-shaped **real** | **23** | — |
| Found only by a **second-order scan for id-less planning deixis** | **+5** | — |
| **Real reference-bearing comment lines** | **28** | 10 |
| **Invisible to the gate** | **15 — 54%** | |

The gate's 13 matched the register's count exactly. That agreement is the trap: it makes the
partition look finished at 46% swept.

### What the 16 wide-only lines were

Ten real, six false. Every one was read, not predicted.

| Line | Class | Verdict |
|---|---|---|
| `filters/src/filter/enumerated/enumeratedFilter.ts:81` | `TIR3 cluster 1` — a planning-artifact name (152-08's class 1) | real |
| `filters/src/filter/enumerated/enumeratedFilter.ts:111` | same | real |
| `filters/tests/filter.test.ts:316` | same | real |
| `argument-condensation/tests/unit/handleQuestion.test.ts:85` | `ROADMAP criterion 3` — document name + `criterion N` | real |
| `argument-condensation/tests/condensation/condenseQuestions.test.ts:153` | a probe date, `2026-08-20` | real |
| `argument-condensation/tests/condensation/condenseQuestions.test.ts:160` | *"recorded as a finding in the phase ledger … this plan changes no product source"* | real |
| `question-info/tests/questionTypes.test.ts:38` | *"the phase's negative-control ledger cannot credit as evidence"* | real |
| `question-info/tests/questionTypes.test.ts:604` | *"deleted elsewhere in this phase"* | real |
| `question-info/tests/questionTypes.test.ts:616` | *"in the phase whose purpose is removing them"* | real |
| `question-info/tests/questionTypes.test.ts:690` | *"exactly what this phase removes"* | real |
| `argument-condensation/src/core/utils/condensation/getParallelFactor.ts:18` | `10-20 seconds` — a duration | false positive |
| `argument-condensation/tests/unit/planValidation.test.ts:107` | `` `:94-96` `` — a source line reference | false positive |
| `matching/src/distance/metric.ts:8` | `27:1, 31-55` — journal volume and page range in an academic citation | false positive |
| `question-info/tests/questionTypes.test.ts:600` | `responseTransformer.ts:38-46` — a source line reference | false positive |
| `question-info/src/prompts/en/generateBoth.yaml:30` | `## Task 1:` inside a `promptText: \|` block scalar | false positive — see below |
| `question-info/src/prompts/en/generateBoth.yaml:36` | `## Task 2:` inside the same block scalar | false positive — see below |

### The five lines no scanner could reach — the new finding

152-08's lesson was *widen the scanner*. This partition's lesson is that widening has a floor:
**five real lines name no artifact at all**, so no id-shaped pattern, however generous, matches
them. They were found by reading the partition end to end.

| Line | Text | Why no pattern matches |
|---|---|---|
| `condenseQuestions.test.ts:147` | *"the axis **F15-C** names"* | `F15-C` is letter-digits-dash-letter. `[A-Z]{2,}-\d{2}` needs letters then digits; `\d{2,3}-\d{2}` needs digits both sides. |
| `questionTypes.test.ts:671` | *"**T2** — the question type must change the prompt. **RED before the product fix**"* | `T2` is one letter and one digit; no id pattern is that loose without matching half the codebase. |
| `questionTypes.test.ts:675` | *"**T3** — … Also **RED before the product fix**."* | same |
| `questionTypes.test.ts:680` | *"Recorded as supporting, never as one of **the two red targets**."* | pure prose; names a plan's proof-obligation list without quoting an id |
| `questionTypes.test.ts:688` | *"The boundary guard **added with the product fix**."* | pure prose |

The practical rule this yields: **a partition small enough to read end to end should be read end
to end.** Thirteen spans is such a partition. A 208-span partition is not, which is why 152-08
was right to build the scanner and why the two findings are complements rather than a
correction.

---

## Per-span dispositions

The plan asked for every span of seven lines and up. Three qualify. All three are **rewrites**;
nothing in this partition was deleted as pure narrative.

| File:line | Lines | Disposition | Reason |
|---|---:|---|---|
| `question-info/tests/questionTypes.test.ts:596-606` | 11 | rewrite | The `responseTransformer.ts:38-46` targeting argument. Re-tensed out of a narrative about an edit (*"The three assertions that **stood here** … they **are REPOINTED** at"*) into a statement of what the assertions do and why (*"These deliberately do NOT pin the exact strings this test handed the mock … They point instead at the only product logic on this path that no other assertion covers"*). The rename fact, the `latencyMs`→`processingTimeMs` mechanism and the *"do not modernise this into `toBeGreaterThan(0)`"* prohibition all survive verbatim. |
| `argument-condensation/tests/condensation/condenseQuestions.test.ts:147-161` | 15 | rewrite | The measured `[[arg, arg]]` nesting note. Every measurement kept — the nesting itself, the single-batch MAP-terminated plan that causes it, the `condenser.ts:205` cast, the contrast with `condenserStandalone.test.ts`, and why `flat()` is load-bearing rather than convenient. Struck: the axis id `F15-C`, the probe date, and *"recorded as a finding in the phase ledger … this plan changes no product source"*, which becomes *"a known defect of the product path and … deliberately NOT fixed here: this is a test-only file"* — a statement that stays true after the ledger is archived. |
| `questionTypes.test.ts:668-682` | 15 | rewrite | The T2/T3/supporting block. Labels struck; each assertion keeps its reason, re-tensed from *"RED before the product fix"* to *"what a type-blind composition breaks"*, and the supporting assertion keeps its subordinate status through an argument rather than a citation: *"A composition carrying no choices at all would satisfy this one too, which is why the two assertions above carry the weight."* |

### The two numerals kept, reworded

`condenser.ts:706 / 745 / 763 / 792` read `// PHASE 1: CREATE TREE NODES`, `// PHASE 2: PREPARE
LLM INPUTS`, `// PHASE 3: EXECUTE PARALLEL LLM CALLS WITH VALIDATION`, `// PHASE 4: PROCESS
RESULTS AND COLLECT METRICS`. They label the four internal stages of a single method
(`executeParallelOperation`), not this project's planning phases — the same shape as Playwright's
`phase 2` / `phase 3` vocabulary that 152-06 reworded rather than stripped (memo item 7).
Deleting the ordinals would turn an ordered four-stage description into four unrelated labels.

Renamed `PHASE n` → `STAGE n`. `STAGE` rather than `STEP` because `step` and `stepIndex` already
name the *condensation plan's* own steps inside the same method, and reusing that word would
collide two distinct concepts one screen apart. Verified: `git grep -ci stage --
packages/argument-condensation/` returned nothing before the change, so no existing vocabulary
was overloaded.

---

## The 152-05-class repair (memo item 14)

**One** break in this partition, and it is not from 152-05 itself but from its ancestor
`0c538024c` ("strip leaked planning references from comments"):

```
- // Every non-missing coordinate is exactly Max or Min (binary subdimensions per D-06).
+ // Every non-missing coordinate is exactly Max or Min (binary subdimensions per).
```

The strip took the noun and closed the parenthesis over the hole, leaving a dangling preposition.
The lost fact is recoverable **without** the ledger: the sibling test title one block above reads
*"Should have one binary subdimension per choice"*, and the class docblock states the same rule.
Repaired to `(one binary subdimension per choice)`.

**And no others.** A comment-scoped scan for seven damage signatures — dangling `per`/`see`,
double space, empty parenthesis, doubled punctuation, stub tail, orphan dash — over the whole
partition returns this line plus false positives only (indented code examples inside JSDoc,
list-introducing colons, and the LLM prompt headings). The other three strip commits that reached
this partition (`5862397ad`, `bfcf2dae5`, `f2f0108a1`) left grammatical text; their diffs were
read line by line to confirm it.

---

## What was deliberately not touched

| Target | Why |
|---|---|
| `packages/shared-config/**` — not one byte | The five `\uXXXX` occurrences at `eslint.config.mjs:164-174` are import-sort regex **string literals**. The escape rule is comment-scoped precisely so it cannot reach them. The gate reported **0 on every row** over this workspace, so there was nothing to sweep and nothing to risk. Count verified at **5** before and after. |
| `question-info/src/prompts/en/generateBoth.yaml:30,36` | `## Task 1:` / `## Task 2:` sit inside the `promptText: \|` block scalar opened at line 24 — Markdown headings inside the LLM prompt this package sends to the model. The shared classifier maps `yaml` to the `#` family with no block-scalar state, so it reports them as comments. Editing them would change model input: a behavioural change, and a non-comment byte change the prover forbids. The same shape recurs across every `argument-condensation/.../prompts/**/*.yaml`. Registered; the classifier was **not** modified (one shared classifier, no copies). |
| every `describe`/`it`/`test` title | Plan `152-13` owns titles. `filter.test.ts:315`'s title still reads `'ChoiceQuestionFilter: TIR3 empty-include semantics'` — its comment is swept, its title is not. Diff grep for title lines: **0**. |
| `matching/src/algorithms/matchingAlgorithm.ts:44` | `@param options - Matching options, see. \`MatchingOptions\`.` — a stray period matching the dangling-pointer shape. **Not** citation damage: `git log -S` traces it to `c95b55a21` (a 2024 formatting refactor); no strip commit ever touched this file. Outside the scope boundary. Registered. |
| `packages/dev-seed/**` | A sibling's partition. Its gate is still non-zero (`phase-ref 5`, `decision-id-bare 9`, `task-id 53`) — exactly the unsatisfiable-by-construction residue 152-08 registered. Zero dev-seed paths appear in this plan's diff. |

---

## Memo items 12 and 13 — a negative finding on both

Both fenced operator questions were checked and **neither fires here.** Recorded because a
negative narrows the operator's question rather than adding to it.

- **Item 12 (E2E coverage ids).** The `task-id` gate row reads **0** across all eleven non-dev-seed
  workspaces. None of the 23 residual `EFLOW-`/`EPERM-`/`TMPL-` coverage ids reaches this
  partition. Nothing to defer, nothing to strip.
- **Item 13 (Markdown).** The nine gate rows over `packages/**/*.md` excluding dev-seed report
  **0 on every row**; a raw wide sweep over the same set returns only false positives (README
  headings `Option 1` / `Option 2`, the word *summary*, `gpt-4o` model names). No `.md` file in
  this partition carries a planning reference, so no `.md` byte needed to change and **none did**.
  The Markdown question stays exactly where 152-08 left it.

---

## Whole-prefix ownership — fourth confirmation

The register's `152-09` queue lists **6 files / 13 spans**. The prefix rule (`packages/` after
`packages/dev-seed/`) covers **5 more** carrying references no gate pattern matches:

| File | Why the queue missed it |
|---|---|
| `filters/src/filter/enumerated/enumeratedFilter.ts` | `TIR3 cluster 1` ×2 |
| `filters/tests/filter.test.ts` | `TIR3 cluster 1` |
| `argument-condensation/tests/unit/handleQuestion.test.ts` | `ROADMAP criterion 3` |
| `argument-condensation/tests/condensation/condenseQuestions.test.ts` | `F15-C`, `the phase ledger`, a probe date |
| `data/src/objects/questions/variants/multipleChoiceCategoricalQuestion.test.ts` | the repair — the break carries no citation *because* the citation was deleted |

6 + 5 = **11 files in the diff**; all 6 register files appear in it; **0** paths outside
`packages/` and **0** under `packages/dev-seed/`.

Separately, **`packages/dev-tools/**` is in the prefix but is named by no plan frontmatter in the
phase and appears in no register queue** — the exact ownerless-gap shape memo item 1 describes. It
was checked rather than assumed: nine gate rows **0**, wide sweep **0**, second-order scan clean.
It needed nothing, but it is now known to need nothing.

---

## Verification

| Check | Result |
|---|---|
| `assert-comment-only-diff.mjs --range 87e02f40b~1..7390fd983` (the plan's **sweep** range) | **11 files compared, 0 allowed by name, 0 violations, exit 0** |
| — per task: `87e02f40b~1..87e02f40b` | 3 compared, 0 allowed, 0 violations |
| — per task: `7390fd983~1..7390fd983` | 8 compared, 0 allowed, 0 violations |
| transcribed nine-row gate over the ten workspaces the plan names | **0 on every row**, `milestone-ver` 0 |
| — plus `packages/dev-tools` (prefix ownership) | **0 on every row** |
| — raw gate and comment-scoped gate | agree exactly, 13 → 0 |
| — **flip test** | injecting one token of each class into one comment turns **all 9 rows red** (raw and comment-scoped); reverting returns **all 9 to 0** |
| — `packages/dev-seed` for contrast (sibling partition) | `phase-ref 5 / decision-id-bare 9 / task-id 53` — non-zero, as 152-08 registered |
| id-shaped wide sweep, post | 6 lines, all read and classified as false positives |
| second-order narrative scan, post | 0 real lines |
| damage-signature scan, post | 0 real lines |
| out-of-partition paths in the plan diff | **0** |
| `packages/dev-seed/` paths in the plan diff | **0** |
| register-queue files missing from the diff | **0** (all 6) |
| in-partition files the queue never listed, swept anyway | **5** |
| `describe`/`it`/`test` title lines changed | **0** |
| `export`/`const`/`function`/`import`/`type`/`interface`/`class` lines changed | **0** |
| `packages/shared-config/eslint.config.mjs` escape occurrences | **5** before, **5** after |
| dangling `see`-at-end-of-line across the four Task-1 workspaces | **0** |
| `yarn build` | **exit 0** — 14 tasks successful |
| `yarn test:unit` | **exit 0** — 25 tasks, **1,835 tests / 173 files passed**, counts identical before and after |
| `yarn lint:check` | **exit 0** — 22 tasks, svelte-check 0 errors / 0 warnings, all three repo guards 0 violations |
| `node scripts/assert-comment-hygiene.mjs` | **exit 0** — 1,560 files scanned, 0 violations |
| `npx prettier --check` on all 11 files | clean |

### One trap in the prover range, for `152-10` through `152-12`

Task 3's criterion reads *"`--range <plan-start>..HEAD` exits 0"*. Taken literally with the
metadata commit as `HEAD`, **that is unsatisfiable for every plan in the phase**: the docs commit
touches `.planning/ROADMAP.md`, `STATE.md`, `WINDOWS.md` and the SUMMARY itself, and the shared
classifier maps `md` to an **empty** comment family, so the prover reads every byte of those four
as code and reports 4 violations. Measured here: `87e02f40b~1..ea5bf6685` → *15 files compared,
4 violations*; `87e02f40b~1..7390fd983` → *11 compared, **0** violations, exit 0*.

The criterion is satisfiable read as the plan's **sweep** range — the refactor commits, excluding
the metadata commit — which is how 152-08 read it (*"it spans only the two refactor commits at
the time it was run"*). **Run the prover before the docs commit, or bound the range at the last
refactor commit.** Do not add an allow entry for a `.planning/` path; the violations are an
artifact of pointing a source-tree prover at the D-15 exempt tree, not a defect in either.

**The E2E suite was not re-run**, per the plan's own `<verification>` and the phase memo. The
change is comment-only, `assert-comment-only-diff.mjs` with zero allow entries is the stronger
guarantee for a comment-only diff, and 152-05 discharged the phase's cardinal gate at 150 passed /
0 failed / 0 flaky / 0 did-not-run. The prover confirms this plan changed nothing the suite can
observe.

---

## Deviations from Plan

### Auto-fixed

**1. [Rule 2 — missing critical] Repaired a broken sentence the plan did not anticipate**
- **Found during:** Task 1
- **Issue:** `multipleChoiceCategoricalQuestion.test.ts:51` read `(binary subdimensions per).`
- **Fix:** restored the lost noun from the sibling test title — `(one binary subdimension per choice)`
- **Commit:** `87e02f40b`

**2. [Rule 2 — missing critical] Swept 5 in-partition files the plan's `files_modified` and the register queue both omit**
- **Found during:** Tasks 1 and 2, from the prefix rule rather than the queue
- **Issue:** memo items 1 and 11 — the queue is span-derived, ownership is a prefix rule
- **Fix:** swept all 5; `packages/dev-tools/**` additionally checked and found clean
- **Commits:** `87e02f40b`, `7390fd983`

**3. [Rule 3 — blocker] The plan's gate invocation exits 2**
- **Found during:** Task 1
- **Issue:** memo item 2 — `hygiene-grep-report.sh` rejects any caller pathspec by design (`SCOPE IS LOAD-BEARING`)
- **Fix:** transcribed the same nine patterns under a caller-supplied pathspec, as 152-06 and 152-08 did. The script was **not** modified.

### Registered, not engineered around

None of this plan's acceptance criteria proved unsatisfiable — a first for the judgement waves.
The raw gate reaches **0 on every row** over the whole partition without a single alternate route,
because this partition's residue is all genuine comment bytes: no `throw` messages, no operator
`echo`s, no shell strings. The flip test is reported anyway, because a gate that examines nothing
also reports green.

Four items were registered in `.planning/WINDOWS.md` (entries 92-97):
1. the YAML block-scalar classifier false positive
2. `matchingAlgorithm.ts:44`'s pre-existing `see.` typo, outside the scope boundary
3. the negative finding on memo items 12 and 13
4. the fourth queue-vs-prefix confirmation, the repair, and the 54% gate-blindness measurement

**Total deviations:** 3 auto-fixed (1 repair, 1 scope expansion, 1 tooling workaround). **Impact:**
none on behaviour — the prover reports zero non-comment byte changes with zero allow entries.

---

## Issues Encountered

None. Every acceptance criterion in all three tasks was satisfied as written.

---

## Next Phase Readiness

Ready for `152-10`. Three notes it should carry:

1. **Read your partition if you can.** 152-08's four scanner classes are necessary and not
   sufficient: five of this partition's 28 real lines name no artifact and no regex reaches them.
   `152-10` has 132 spans across 71 files — too large to read whole, so build the scanner *and*
   read the long spans.
2. **The queue is a floor, four plans running.** Check the prefix, not the frontmatter, and check
   for ownerless directories the way `packages/dev-tools/` turned out to be.
3. **Both fenced questions stay fenced.** Neither fired here, so both remain exactly as 152-07 and
   152-08 left them.

## Self-Check: PASSED

- All 11 modified files exist on disk and appear in `git diff --name-only 87e02f40b~1..HEAD`.
- Both task commits found in `git log`: `87e02f40b`, `7390fd983`.
- All acceptance criteria from all three tasks re-run and passing; the plan-level `<verification>`
  block re-run in full, results recorded in the Verification table above.
