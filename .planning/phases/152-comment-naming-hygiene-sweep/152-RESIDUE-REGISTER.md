# Phase 152 — RESIDUE REGISTER

> **What this file is.** Criterion 5's proof, discharged as an obligation rather than left as a
> note. Criterion 5 reads: *"the codemod runs dry-run first, and a residue pass confirms every
> match it declined to touch was non-comment-shaped (a `console.warn`, a test title, an ESLint
> `message:`). Phase 151 measured 126 such lines — treat that as the expected order of magnitude,
> not as zero."* This file records the dry run, the hand review of every declined match, and the
> disposition of the one place where criterion 5 and pre-ship review comment #4 contradict each
> other.
>
> Written by `152-05` on **2026-08-29**, against the tree as it stands after `152-01` through
> `152-04` landed and **before** the mechanical apply.
>
> **A non-zero residue is the correct outcome.** A zero would mean the classifier had stopped
> declining, which is the failure this pass exists to detect.

---

## 0. The dry run

Command, verbatim (run from the repo root):

```bash
node .planning/phases/152-comment-naming-hygiene-sweep/scripts/hygiene-codemod.mjs \
  --quiet \
  --residue-out .planning/phases/152-comment-naming-hygiene-sweep/152-residue.tsv \
  --json-out   .planning/phases/152-comment-naming-hygiene-sweep/152-hygiene.json
```

Output, verbatim:

```
PHASE 152 — planning-reference hygiene codemod, retargeted (DRY-RUN)

── Summary ──
  Files scanned:      1571
  Files rewritten:    41
  Comment lines cut:  7
  Total occurrences:  1115   (hits 128 + residue 987)
  Overlaps absorbed:  13   (counted once, under the earlier rule)

  per-rule hits
    artifact-path        26
    section-anchor       0
    plan-number          1
    decision-id-long     1
    decision-id-bare     65
    task-id              35
    phase-ref            0
    spike-ref            0

  residue by reason  (this is the judgement pass's work queue)
    not-a-comment-span           98
    markdown-file                0
    milestone-version            44
    todo-class                   59
    unstrippable-section-anchor  16
    ambiguous-reference          9
    attributive-reference        27
    phase-ref-deferred          694
    spike-ref-deferred           40
    files carrying residue      318

  prose-review flags (rewritten, but the sentence needs a human): 0

  arithmetic (hits + residue == total): OK

Dry-run only. Nothing was written. Re-run with --apply to write.

MODE: DRY-RUN (no file on disk was modified)
```

**The dry run wrote nothing.** `git status --porcelain -- apps packages tests` was empty
immediately afterwards. A dry run that wrote is not a dry run, and that is checked before
anything else in this file is believed.

Figures are byte-identical to `152-BASELINE.md` § 2, which measured the same command at
`1e1f8e6ea`. `152-03` and `152-04` landed in between and moved neither the hit table nor the
residue table — their edits were renames and identifier changes inside spans that carry no
planning citation.

---

## 1. ⚠ THE BALANCE LINE IS A COMPLETENESS CHECK, NEVER A CORRECTNESS ONE

`arithmetic (hits + residue == total): OK` says that **every occurrence the pattern set found
was classified exactly once**. It says nothing whatever about whether any classification was
*right*, and nothing at all about the bytes outside a comment span.

This is not a theoretical caveat. `.claude/skills/ship-review-stack/SKILL.md:265` records **six
Phase-151 artifacts that were self-consistent and wrong**, with this line green throughout — a
balance holding while six occurrences matched no rule at all, two YAML duplicate-key collisions
silently last-wins, and a static registry returning a reproducible 31 where `Object.keys`
returns 30. `SKILL.md:314` records what that produced downstream: **38 broken comments in the
test tree, 28 in the routing surface and 6 in the components** — *after* an all-clear on the
strip patterns.

**Correctness in this plan comes from two places, and neither of them is arithmetic:**

1. `assert-comment-only-diff.mjs` over the apply range, with **zero** `--allow` entries — a
   mechanical proof that no program byte moved (Task 2).
2. A human reading the whole diff against `.agents/code-review-checklist.md`, looking for the
   sentence a removed citation left ungrammatical (Task 2).

The balance line is quoted above because a report that does not balance is definitely broken.
It is labelled here because a report that *does* balance is not thereby right. Stated once more
in the plainest terms available, so that no later reader has to reconstruct it: **the balance
line is evidence of completeness and is not evidence of correctness**, and the two words are not
interchangeable — completeness is a property of the classification, correctness is a property of
the edit, and this phase has to establish both separately.

---

## 2. The per-rule hit table — what the codemod WILL rewrite

| Rule | Hits | Disposition | Representative |
|---|---:|---|---|
| `artifact-path` | 26 | delete the match | `tests/playwright.config.ts:276` — `` `.planning/phases/147-candidate-app-scan-reach-authenticated-fixture-raw-key-gate/ `` |
| `section-anchor` | 0 | delete the match | none on this tree — every `§` present is titled, so all 16 land in `unstrippable-section-anchor` |
| `plan-number` | 1 | delete the match | `plan 151-18` |
| `decision-id-long` | 1 | delete the match | `D-136-06` |
| `decision-id-bare` | 65 | delete the match | `tests/playwright.config.ts:347` — `D-05` |
| `task-id` | 35 | delete the match | `tests/playwright.config.ts:430` — `REACH-14` |
| `phase-ref` | **0** | **defer** (PHASE-152 CHANGE (1)) | — the 694 occurrences appear below as `phase-ref-deferred` |
| `spike-ref` | **0** | **defer** (PHASE-152 CHANGE (1)) | — the 40 occurrences appear below as `spike-ref-deferred` |

**`phase-ref 0` and `spike-ref 0` are the rule-6 inversion working, not the class being absent.**
Every one of those 734 occurrences is below, in residue. Nothing in the phase/spike class is
rewritten by machine anywhere in this phase.

The 128 hits land across **41 files** — a wide-but-shallow surface. Concentration:
`tests/playwright.config.ts` 13, `packages/dev-seed/tests/assertKnownRowProps.test.ts` 10,
`packages/dev-seed/tests/template/strictRowTypes.type-test.ts` 8, then a long tail of 1-6.

---

## 3. The residue-by-reason table — every reason, with a representative

`markdown-file` is listed at zero deliberately: it is a live reason in the classifier whose count
is zero only because PHASE-152 CHANGE (2) removed `.md` from the default glob set. Its
empty-family mapping is kept as a second line of defence, so an explicit `--files '**/*.md'`
would still populate this row rather than rewrite prose. A reason with no representative line is
reported as having none, not omitted.

| Reason | Count | Representative | Why the codemod declines it |
|---|---:|---|---|
| `not-a-comment-span` | **98** | see § 4 — the full hand review | The occurrence is not inside a comment span at all. Editing it would change a runtime string: a test title, a thrown message, shell output. This is criterion 5's class. |
| `markdown-file` | **0** | *(none on this tree — `.md` is out of the default globs)* | A Markdown file is prose end to end, so the classifier's "everything outside a span is untouched" safety argument does not hold. Routed whole to the judgement pass. |
| `milestone-version` | 44 | `tests/playwright.config.ts:330` — `` * is how ~19,500 px of visible damage passed at 41 % of budget (0.41 % of the image) at v2.14 `` | `v\d+\.\d+` matches `Yarn 4.13`, `Node 22.22.1` and `jose@v5.9.6` as readily as a milestone tag. Report-only; a machine cannot tell a milestone from a dependency version. |
| `todo-class` | 59 | `packages/question-info/src/core/infoGeneration.ts:148` — `` maxConcurrent: 1, // TODO: tweak so that we use an appropriate amount of max capacity `` | `TODO`/`FIXME`/`HACK`/`XXX` are statements about the code's future, not leaked planning artifacts. D-14 does not authorise deleting them; they are scanned only so they are provably reported. |
| `unstrippable-section-anchor` | 16 | `tests/playwright.config.ts:277` — `` * 147-ORDERING.md` § *Decision (A)* — see the `candidate-a11y-scan` project below. `` | A **titled** anchor has no mechanical end boundary, so deleting `§`+token mangles the prose that follows. Numeric-leading anchors do have one and are rule 2; everything else is residue. |
| `ambiguous-reference` | 9 | `packages/argument-condensation/src/core/condensation/condenser.ts:706` — `` // PHASE 1: CREATE TREE NODES `` | Exclusion (g): an ALL-CAPS-then-colon or low-number-then-colon `PHASE n` is the script's or algorithm's **own stage marker**, not a planning citation. Rewriting it would produce a confidently wrong comment. |
| `attributive-reference` | 27 | `tests/playwright.config.ts:383` — `` // === Shared base auth setup (DEFAULT-ON since phase 147) === `` | Exclusion (h): the reference is grammatically load-bearing mid-sentence. Deleting it leaves rubble (`DEFAULT-ON since ===`); collapsing it leaves nonsense. Both need a human sentence. |
| `phase-ref-deferred` | **694** | `tests/global-setup.ts:7` — `` * PLAYWRIGHT GLOBAL SETUP — the served-application gate (see phase 137). `` | PHASE-152 CHANGE (1). Rule 6 no longer collapses; it defers the whole class. **This row is the judgement waves' work queue.** |
| `spike-ref-deferred` | **40** | `tests/playwright.config.ts:701` — `` // staleness (see spike 024). Reads the base dataset read-only (no teardown of its `` | Same inversion. All 40 spike references in the tree are already in the collapsed `see spike N` form — the form the *inherited* gate reports OK on (`152-BASELINE.md` § 1a). |

**The judgement-pass queue is `694 + 40 + 27 + 9 = 770` in-comment occurrences.** Plans `152-06`
through `152-12` must drive that to zero. § 7 partitions it.

`milestone-version`, `todo-class` and `unstrippable-section-anchor` are **not** in that queue —
they are declined permanently, not deferred. `152-14` and `152-15` decide the `§`-anchor
disposition; `TODO`s and dependency versions stay.

---

## 4. THE HAND REVIEW — all 98 `not-a-comment-span` rows

This is criterion 5's proof. Every match the codemod declined for not being comment-shaped is
here, resolved back to its source line, with a classification.

### 4.1 The measured count, and the correction to Phase 151's figure

| Source | Figure | Status |
|---|---:|---|
| Criterion 5 / Phase 151 | 126 | **STALE.** Measured on Phase 151's tree, not this one. |
| `152-RESEARCH.md` § 6, at HEAD `22c2542e3` | 98 | re-measurement |
| **This session, at the pre-apply tree** | **98** | **authoritative** |

Split by tree, measured this session (`awk -F'\t' '$3=="not-a-comment-span"{split($1,a,"/"); print a[1]}' … | sort | uniq -c`):

```
   8 apps
  58 packages
  32 tests
```

RESEARCH's split was apps 8 · packages 58 · tests 32. **Identical.** The correction from 126 to
98 is recorded rather than silently applied, and it is confirmed by two independent measurement
points four commits apart rather than carried on one.

### 4.2 ⚠ TWO of criterion 5's three example classes are historical, not one

The plan's objective records that `console.warn` has zero instances on this tree. **Measured
here, the ESLint `message:` member has zero instances too.** Only the test-title member survives.

| Criterion 5's named class | Measured on this tree | Evidence |
|---|---:|---|
| a `console.warn` | **0** | `git grep -nE "console\.(warn\|error\|log)\([^)]*([Pp]hase\s*[0-9]\|\.planning/)" -- packages apps tests` → no output, exit 1. And zero of the 98 resolved lines contain `console.`. |
| a test title | **81** | § 4.3 classes A1 + A2 |
| an ESLint `message:` | **0** | `git grep -nE "message:[[:space:]]*['\"\`][^'\"\`]*([Pp]hase[[:space:]]*[0-9]\|D-[0-9]\|\.planning/)" -- packages apps tests` → no output, exit 1. And zero of the 98 resolved lines contain `message:`. The two `message:` fields in `packages/shared-config/eslint.config.mjs` carry no planning reference — they read *"Use const assertion or a string union type instead."* and *"Use the $lib alias instead of deep relative imports."* |

**This is recorded so the register does not invent a class to fill an empty slot**, and is filed
as `.planning/WINDOWS.md` entry 76 — the plan's objective names only `console.warn` as historical,
and the second empty member is this plan's own measurement going beyond its brief. The honest
statement of criterion 5's class on this tree is: *overwhelmingly vitest and Playwright test
titles, plus a small tail of thrown messages, assertion messages, shell strings and one import
URL.* Naming a `console.warn` class with zero members, or an ESLint `message:` class with zero
members, would be the kind of self-consistent-and-wrong artifact `SKILL.md:265` is about.

The plan's own `<prohibitions>` list — *"No test title, `console.warn`, thrown message or ESLint
`message:` field is edited by the codemod"* — is **satisfied vacuously for three of its four
members and substantively for the fourth**. The 81 test titles are declined by measurement, not
by luck; the one thrown message (class F) is declined; the other two classes do not exist here.

### 4.3 The classification scheme

| Class | Count | What it is | Why the codemod declines it | Owner |
|---|---:|---|---|---|
| **A1** | 73 | The title string argument of `describe(` / `it(` / `test(` / `test.describe(` | A runtime string. Editing it changes reporter output and `--grep` selection — a program-visible change. | **`152-13`** (deliberate renames, own gate) |
| **A2** | 8 | The title argument of Playwright `test.step(` | Same. Step titles appear in the HTML report and the trace viewer. | **`152-13`** |
| **B1** | 2 | A shell script's **own stage marker** inside an `echo` | Declined **twice over**: it is a runtime string, *and* it is exclusion (g)'s ambiguous-phase class. `echo "--- PHASE 1: JSONB SCHEMA ---"` names the benchmark's stage, not a planning phase. | nobody — correct as written |
| **B2** | 4 | A shell `echo` writing operator-facing output or generated report content | A runtime string that a human reads. `determinism-batch.sh:312` writes a ledger header citing `138-NEGATIVE-CONTROL.md` — the citation is the point of the line. | out of scope (see § 5) |
| **C** | 1 | A Deno import URL matched by the **report-only** `milestone-version` row | `jose@v5.9.6` is a dependency pin. Not a planning reference at all; the row is report-only precisely because a machine cannot separate the two. | nobody — correct as written |
| **D** | 6 | An assertion message or skip/failure diagnostic string | A runtime string a human reads when a test fails. The task ID in it is what tells the reader *which criterion* failed. | out of scope (see § 5) |
| **E** | 3 | A shell variable assignment whose value is a runtime string | Same class as B2 one indirection out: `LEDGER_FILE="${LEDGER_FILE:-$LEDGER_DIR/138-DETERMINISM-LEDGER.md}"` is a **path that must resolve on disk**. | out of scope (see § 5) |
| **F** | 1 | A `throw new Error(...)` message | Criterion 5's "thrown message". It points an engineer at `.planning/debug/answer-surface-wait-timeout.md` — a live operator diagnostic, not a leaked artifact. | out of scope (see § 5) |
| | **98** | | | |

Arithmetic: 73 + 8 + 2 + 4 + 1 + 6 + 3 + 1 = **98**. Every declined row is in exactly one class.

### 4.4 The full list

Columns: class · `file:line` · the rule whose pattern matched · the matched token · the resolved
source line (truncated at 150 chars).

| Class | Site | Rule | Token | Resolved source line |
|---|---|---|---|---|
| A1 | `tests/tests/specs/voter/voter-alliance.spec.ts:47` | `task-id` | `EFLOW-02` | `test.describe('voter-alliance (EFLOW-02 + EPERM-03/04 riders)', () => {` |
| A1 | `tests/tests/specs/voter/voter-alliance.spec.ts:47` | `task-id` | `EPERM-03` | `test.describe('voter-alliance (EFLOW-02 + EPERM-03/04 riders)', () => {` |
| A2 | `tests/tests/specs/voter/voter-alliance.spec.ts:60` | `task-id` | `EPERM-03` | `await test.step('EPERM-03 rider: alliance section present in results.sections[]', async () => {` |
| A2 | `tests/tests/specs/voter/voter-alliance.spec.ts:116` | `task-id` | `EPERM-04` | `await test.step('EPERM-04 rider: alliance drawer exposes EXACTLY [info, children] — no opinions tab', async () => {` |
| A2 | `tests/tests/specs/voter/voter-alliance.spec.ts:136` | `task-id` | `EFLOW-02` | `await test.step('EFLOW-02: member-orgs drawer lists both member orgs', async () => {` |
| A1 | `tests/tests/specs/voter/voter-journey-mobile.spec.ts:51` | `task-id` | `EFLOW-11` | `test.describe('voter-journey-mobile (EFLOW-11)', () => {` |
| A2 | `tests/tests/specs/voter/voter-journey.spec.ts:894` | `task-id` | `EPERM-07` | `await test.step('EPERM-07 customData.terms: in-text affordance + definition popup on Base-3', async () => {` |
| A2 | `tests/tests/specs/voter/voter-journey.spec.ts:1673` | `task-id` | `EFLOW-01` | `await test.step('EFLOW-01: select-all/none control, text×filter intersection, reset restores full list', async () => {` |
| A1 | `tests/tests/specs/voter/voter-journey.spec.ts:1814` | `task-id` | `EQTYP-02` | `test.describe('EQTYP-02: number-scale boundary matching', () => {` |
| A1 | `tests/tests/specs/voter/voter-nominations.spec.ts:29` | `task-id` | `UNBLK-04` | `test.describe('voter-nominations (UNBLK-04)', () => {` |
| A1 | `tests/tests/specs/voter/voter-prefs-tracking.spec.ts:148` | `task-id` | `EFLOW-08` | `test.describe('voter-prefs-tracking (EFLOW-08)', () => {` |
| D | `tests/tests/specs/visual/visual-regression.spec.ts:160` | `task-id` | `VGATE-05` | ``third-party font requests observed (VGATE-05 requires none): ${thirdParty.join(', ')}`` |
| A1 | `tests/tests/specs/perm/perm-access-disable.spec.ts:40` | `task-id` | `EPERM-11` | `test.describe('perm-access-disable (EPERM-11)', () => {` |
| D | `tests/tests/specs/perm/perm-hide-category-tags.spec.ts:50` | `task-id` | `ASSERT-05` | `'ASSERT-05 positive control: the perm-hide-category-tags dataset seeds elections: 2 so the complementary election-tag must render on /questions; wi...` |
| D | `tests/tests/specs/perm/perm-hide-election-tags.spec.ts:50` | `task-id` | `ASSERT-05` | `'ASSERT-05 positive control: the perm-hide-election-tags dataset overlay sets showCategoryTags: true so the complementary category-tag must render ...` |
| A1 | `tests/tests/specs/perm/perm-interactive-info.spec.ts:67` | `task-id` | `EPERM-07` | `test.describe('perm-interactive-info (EPERM-07)', () => {` |
| A1 | `tests/tests/specs/perm/perm-localisation-positive.spec.ts:468` | `task-id` | `EFLOW-06` | `test('in-flight selections + answers survive fi→en→fi locale switch (EFLOW-06)', async ({` |
| A1 | `tests/tests/specs/perm/perm-org-matching.spec.ts:52` | `task-id` | `EPERM-10` | `test.describe('perm-org-matching (EPERM-10)', () => {` |
| A1 | `tests/tests/specs/perm/perm-show-feedback-survey.spec.ts:49` | `task-id` | `EPERM-09` | `test.describe('perm-show-feedback-survey (EPERM-09)', () => {` |
| D | `tests/tests/specs/candidate/candidate-bank-auth.spec.ts:167` | `task-id` | `EFLOW-10` | `'EFLOW-10 keys-configured path did not run — the served identity-callback Edge Function ' +` |
| A2 | `tests/tests/specs/candidate/candidate-journey.spec.ts:412` | `task-id` | `EFLOW-09` | `await test.step('2.5. EFLOW-09: candidate nav-menu logged-out item set', async () => {` |
| A2 | `tests/tests/specs/candidate/candidate-journey.spec.ts:811` | `task-id` | `EQTYP-01` | `await test.step('18.5. EQTYP-01: multi-choice opinion — type-specific input contract (checkboxes + helper + save gating)', async () => {` |
| A2 | `tests/tests/specs/candidate/candidate-journey.spec.ts:964` | `task-id` | `EFLOW-09` | `await test.step('19.5. EFLOW-09: candidate nav-menu logged-in item set (differs from logged-out)', async () => {` |
| A1 | `tests/tests/specs/_probes/defaultTemplateResults.probe.spec.ts:133` | `task-id` | `TMPL-03` | `test.describe('@probe default-template results surface (TMPL-03, criterion 1)', () => {` |
| F | `tests/tests/fixtures/voter/voter-journey.fixture.ts:150` | `artifact-path` | `.planning/debug/answer-surface-wait-timeout.md.'` | `'.planning/debug/answer-surface-wait-timeout.md.'` |
| E | `tests/scripts/determinism-batch.sh:97` | `task-id` | `EPERM-07` | `EPERM07_STEP_PREFIX='EPERM-07 customData.terms'` |
| E | `tests/scripts/determinism-batch.sh:225` | `artifact-path` | `138-DETERMINISM-LEDGER.md` | `LEDGER_FILE="${LEDGER_FILE:-$LEDGER_DIR/138-DETERMINISM-LEDGER.md}"` |
| B2 | `tests/scripts/determinism-batch.sh:266` | `task-id` | `INTEG-02` | `echo "# Determinism batch ledger (criterion 3, INTEG-02)"` |
| B2 | `tests/scripts/determinism-batch.sh:312` | `artifact-path` | `138-NEGATIVE-CONTROL.md` | `echo "**Fix state being proved.** See \`138-NEGATIVE-CONTROL.md\` for the criterion-2 pair"` |
| B2 | `tests/scripts/determinism-batch.sh:321` | `task-id` | `EPERM-07` | `echo "\| Run \| Start (UTC) \| End (UTC) \| Wall \| HEAD \| Exit \| Preflight fails \| Preflight OKs \| Executed \| Passed \| Failed \| Flaky \| Di...` |
| E | `tests/scripts/determinism-batch.sh:549` | `task-id` | `EPERM-07` | `REASON="the EPERM-07 step outcome is '$EPERM', not 'passed' -- this is the step criterion 3 is about"` |
| B2 | `tests/scripts/visual-container.sh:505` | `decision-id-bare` | `D-11` | `echo "$SELF: before the forwarder and before Playwright: D-11 requires the block to be proven"` |
| A1 | `packages/dev-seed/tests/assertKnownRowProps.test.ts:54` | `task-id` | `TMPL-02` | `describe('assertKnownRowProps — TMPL-02: the message names the key, the collection and the external_id', () => {` |
| A1 | `packages/dev-seed/tests/assertKnownRowProps.test.ts:251` | `decision-id-bare` | `D-09` | `describe('assertKnownRowProps — D-09: entity_type is denied, the other four skip_columns are excluded', () => {` |
| A1 | `packages/dev-seed/tests/assets.test.ts:25` | `task-id` | `GEN-10` | `describe('portrait assets (GEN-10)', () => {` |
| A1 | `packages/dev-seed/tests/determinism.test.ts:19` | `task-id` | `TMPL-08` | `describe('determinism (TMPL-08)', () => {` |
| A1 | `packages/dev-seed/tests/locales.test.ts:19` | `task-id` | `TMPL-07` | `describe('fanOutLocales (TMPL-07)', () => {` |
| A1 | `packages/dev-seed/tests/pipeline.test.ts:41` | `task-id` | `TMPL-02` | `it('TMPL-02: {} template produces non-empty output for every "content" entity', () => {` |
| A1 | `packages/dev-seed/tests/pipeline.test.ts:223` | `task-id` | `GEN-08` | `it('GEN-08: nominations: { count: 2 } emits 2 rows with refs pointing to real entities', () => {` |
| A1 | `packages/dev-seed/tests/template.test.ts:22` | `task-id` | `TMPL-02` | `it('TMPL-02: {} template passes validation (every field is optional)', () => {` |
| A1 | `packages/dev-seed/tests/template.test.ts:27` | `task-id` | `TMPL-09` | `it('TMPL-09: nested field-path error — candidates.count: "not-a-number"', () => {` |
| A1 | `packages/dev-seed/tests/template.test.ts:31` | `task-id` | `TMPL-09` | `it('TMPL-09: top-level field-path error — seed: "forty-two"', () => {` |
| A1 | `packages/dev-seed/tests/template.test.ts:35` | `task-id` | `TMPL-09` | `it('TMPL-09: invalid UUID projectId produces `template.projectId` path error', () => {` |
| A1 | `packages/dev-seed/tests/template.test.ts:79` | `task-id` | `TMPL-07` | `it('TMPL-07: accepts generateTranslationsForAllLocales: true', () => {` |
| A1 | `packages/dev-seed/tests/template.test.ts:84` | `task-id` | `TMPL-07` | `it('TMPL-07: accepts generateTranslationsForAllLocales: false', () => {` |
| A1 | `packages/dev-seed/tests/template.test.ts:89` | `task-id` | `TMPL-07` | `it('TMPL-07: rejects non-boolean generateTranslationsForAllLocales with field-path error', () => {` |
| A1 | `packages/dev-seed/tests/template.test.ts:95` | `task-id` | `TMPL-07` | `it('TMPL-07: {} still passes (field remains optional per TMPL-02)', () => {` |
| A1 | `packages/dev-seed/tests/template.test.ts:95` | `task-id` | `TMPL-02` | `it('TMPL-07: {} still passes (field remains optional per TMPL-02)', () => {` |
| A1 | `packages/dev-seed/tests/template.test.ts:109` | `task-id` | `ASSERT-04` | `it('ASSERT-04: rejects an unknown TOP-LEVEL key (TemplateSchema.strict())', () => {` |
| A1 | `packages/dev-seed/tests/template.test.ts:115` | `task-id` | `ASSERT-04` | `it('ASSERT-04: rejects an unknown key INSIDE a per-entity fragment (perEntityFragment.strict())', () => {` |
| A1 | `packages/dev-seed/tests/template.test.ts:126` | `decision-id-bare` | `D-04` | `it('D-04: still ACCEPTS an arbitrary key inside a fixed[] row — row keys are `assertKnownRowProps`’ authority, not zod’s', () => {` |
| A1 | `packages/dev-seed/tests/template.test.ts:135` | `decision-id-bare` | `D-04` | `it('D-04: `.strict()` does not break the `.extend({ latent })` chain link', () => {` |
| A1 | `packages/dev-seed/tests/writer.test.ts:193` | `task-id` | `TMPL-02` | `describe('Pass 0 — assertKnownRowProps (TMPL-02)', () => {` |
| A1 | `packages/dev-seed/tests/writer.test.ts:355` | `task-id` | `GEN-09` | `describe('uploadPortraits pass (GEN-09)', () => {` |
| A1 | `packages/dev-seed/tests/template/latent.schema.test.ts:60` | `task-id` | `TMPL-09` | `it('rejects unknown keys via .strict() (TMPL-09 typo-catching)', () => {` |
| A1 | `packages/dev-seed/tests/template/linkSentinels.test.ts:291` | `decision-id-bare` | `D-01` | `it('D-01 legality: questions._elections IS still read, and targets the election_ids jsonb column', () => {` |
| D | `packages/dev-seed/tests/integration/default-template.integration.test.ts:182` | `task-id` | `TMPL-03` | `'this file just skipped — the anon-RLS guard (TMPL-03), the NF-01 operation budget and the ' +` |
| D | `packages/dev-seed/tests/integration/default-template.integration.test.ts:192` | `task-id` | `TMPL-03` | ``127.0.0.1:${LOCAL_SUPABASE_API_PORT}. TMPL-03's anon-RLS guard and the NF-01 budget did not run. ` +` |
| A1 | `packages/dev-seed/tests/integration/default-template.integration.test.ts:558` | `task-id` | `TMPL-03` | `it('the seeded dataset is readable by the ANON client — the voter app path (TMPL-03)', async () => {` |
| A1 | `packages/dev-seed/tests/generators/AlliancesGenerator.test.ts:23` | `task-id` | `GEN-04` | `it('applies externalIdPrefix to generated rows (GEN-04)', () => {` |
| A1 | `packages/dev-seed/tests/generators/AlliancesGenerator.test.ts:29` | `task-id` | `GEN-04` | `it('applies externalIdPrefix to fixed[] rows (GEN-04)', () => {` |
| A1 | `packages/dev-seed/tests/generators/AppSettingsGenerator.test.ts:41` | `task-id` | `GEN-04` | `it('applies externalIdPrefix to generated rows (GEN-04)', () => {` |
| A1 | `packages/dev-seed/tests/generators/CandidatesGenerator.test.ts:46` | `task-id` | `GEN-04` | `it('applies externalIdPrefix (GEN-04)', () => {` |
| A1 | `packages/dev-seed/tests/generators/ConstituenciesGenerator.test.ts:19` | `task-id` | `GEN-04` | `it('applies externalIdPrefix to generated rows (GEN-04)', () => {` |
| A1 | `packages/dev-seed/tests/generators/ConstituenciesGenerator.test.ts:25` | `task-id` | `GEN-04` | `it('applies externalIdPrefix to fixed[] rows (GEN-04)', () => {` |
| A1 | `packages/dev-seed/tests/generators/ConstituencyGroupsGenerator.test.ts:19` | `task-id` | `GEN-04` | `it('applies externalIdPrefix to generated rows (GEN-04)', () => {` |
| A1 | `packages/dev-seed/tests/generators/ConstituencyGroupsGenerator.test.ts:25` | `task-id` | `GEN-04` | `it('applies externalIdPrefix to fixed[] rows (GEN-04)', () => {` |
| A1 | `packages/dev-seed/tests/generators/ElectionsGenerator.test.ts:26` | `task-id` | `GEN-04` | `it('applies externalIdPrefix to generated rows (GEN-04)', () => {` |
| A1 | `packages/dev-seed/tests/generators/ElectionsGenerator.test.ts:32` | `task-id` | `GEN-04` | `it('applies externalIdPrefix to fixed[] rows (GEN-04)', () => {` |
| A1 | `packages/dev-seed/tests/generators/FactionsGenerator.test.ts:23` | `task-id` | `GEN-04` | `it('applies externalIdPrefix to generated rows (GEN-04)', () => {` |
| A1 | `packages/dev-seed/tests/generators/FactionsGenerator.test.ts:29` | `task-id` | `GEN-04` | `it('applies externalIdPrefix to fixed[] rows (GEN-04)', () => {` |
| A1 | `packages/dev-seed/tests/generators/NominationsGenerator.test.ts:44` | `task-id` | `GEN-08` | `it('GEN-08: throws descriptive error when refs.candidates empty', () => {` |
| A1 | `packages/dev-seed/tests/generators/NominationsGenerator.test.ts:51` | `task-id` | `GEN-08` | `it('GEN-08: throws descriptive error when refs.elections empty', () => {` |
| A1 | `packages/dev-seed/tests/generators/NominationsGenerator.test.ts:58` | `task-id` | `GEN-08` | `it('GEN-08: throws descriptive error when refs.constituencies empty', () => {` |
| A1 | `packages/dev-seed/tests/generators/NominationsGenerator.test.ts:104` | `task-id` | `GEN-04` | `it('applies externalIdPrefix to generated rows (GEN-04)', () => {` |
| A1 | `packages/dev-seed/tests/generators/OrganizationsGenerator.test.ts:18` | `task-id` | `GEN-04` | `it('applies externalIdPrefix to generated rows (GEN-04)', () => {` |
| A1 | `packages/dev-seed/tests/generators/OrganizationsGenerator.test.ts:24` | `task-id` | `GEN-04` | `it('applies externalIdPrefix to fixed[] rows (GEN-04)', () => {` |
| A1 | `packages/dev-seed/tests/generators/QuestionCategoriesGenerator.test.ts:19` | `task-id` | `GEN-04` | `it('applies externalIdPrefix to generated rows (GEN-04)', () => {` |
| A1 | `packages/dev-seed/tests/generators/QuestionCategoriesGenerator.test.ts:25` | `task-id` | `GEN-04` | `it('applies externalIdPrefix to fixed[] rows (GEN-04)', () => {` |
| A1 | `packages/dev-seed/tests/generators/QuestionsGenerator.test.ts:23` | `task-id` | `GEN-04` | `it('applies externalIdPrefix to generated rows (GEN-04)', () => {` |
| A1 | `packages/dev-seed/tests/generators/QuestionsGenerator.test.ts:29` | `task-id` | `GEN-04` | `it('applies externalIdPrefix to fixed[] rows (GEN-04)', () => {` |
| A1 | `packages/dev-seed/tests/emitters/answers.test.ts:76` | `task-id` | `TMPL-03` | `describe('defaultRandomValidEmit — number answers respect the declared range (TMPL-03)', () => {` |
| A1 | `packages/dev-seed/tests/cli/help.test.ts:8` | `task-id` | `CLI-04` | `describe('USAGE (CLI-04)', () => {` |
| A1 | `packages/dev-seed/tests/cli/resolve-template.test.ts:115` | `decision-id-bare` | `D-07` | `it('D-07: throws for a built-in carrying an unknown top-level key (was returned unvalidated)', async () => {` |
| A1 | `packages/dev-seed/tests/cli/resolve-template.test.ts:122` | `decision-id-bare` | `D-07` | `it('D-07: a valid built-in still resolves, unchanged in substance', async () => {` |
| A1 | `packages/dev-seed/tests/cli/resolve-template.test.ts:127` | `decision-id-bare` | `D-07` | `it('D-07: the `Unknown template:` path is unchanged by the added validation', async () => {` |
| A1 | `packages/dev-seed/tests/cli/resolve-template.test.ts:132` | `decision-id-bare` | `D-04` | `it('D-04 + D-07 fallout: every registered built-in passes the strict schema', () => {` |
| A1 | `packages/dev-seed/tests/cli/resolve-template.test.ts:132` | `decision-id-bare` | `D-07` | `it('D-04 + D-07 fallout: every registered built-in passes the strict schema', () => {` |
| A1 | `packages/dev-seed/tests/cli/teardown.test.ts:253` | `task-id` | `CLI-03` | `describe('runTeardown (CLI-03 / Pitfall #5 + #6)', () => {` |
| A1 | `packages/dev-seed/tests/cli/teardown.test.ts:411` | `task-id` | `CLI-04` | `describe('TEARDOWN_USAGE (CLI-04)', () => {` |
| C | `apps/supabase/supabase/functions/identity-callback/index.ts:28` | `milestone-ver` | `v5.9` | `import * as jose from 'https://deno.land/x/jose@v5.9.6/index.ts';` |
| B1 | `apps/supabase/benchmarks/scripts/run-concurrency-scaling.sh:77` | `phase-ref` | `PHASE 1` | `echo "--- PHASE 1: JSONB SCHEMA ---"` |
| B1 | `apps/supabase/benchmarks/scripts/run-concurrency-scaling.sh:114` | `phase-ref` | `PHASE 2` | `echo "--- PHASE 2: RELATIONAL SCHEMA ---"` |
| A1 | `apps/frontend/src/lib/i18n/tests/translations.test.ts:218` | `task-id` | `CLEAN-04` | `describe('TranslationKey type safety (CLEAN-04)', () => {` |
| A1 | `apps/frontend/src/lib/contexts/candidate/candidateContext.svelte.test.ts:103` | `task-id` | `RUNES-05` | `describe('candidateContext questionBlocks — Bug 1 (RUNES-05): entityType passed to getApplicableQuestions', () => {` |
| A1 | `apps/frontend/src/lib/_guards/eslint-store-guard.test.ts:90` | `task-id` | `ASSERT-08` | `describe('svelte/store ESLint guard — ASSERT-08 app-wide reach', () => {` |
| A1 | `apps/frontend/src/lib/_guards/eslint-store-guard.test.ts:135` | `decision-id-bare` | `D-05` | `describe('extension reach (D-05)', () => {` |
| A1 | `apps/frontend/src/lib/_guards/eslint-store-guard.test.ts:150` | `decision-id-bare` | `D-06` | `describe('dynamic import() closure (D-06)', () => {` |

---

## 5. Classes B2, D, E and F — 14 rows nobody in Phase 152 owns

**A gap, recorded rather than assumed closed.** `152-13` owns the test titles (classes A1 + A2,
81 rows). The remaining **14** rows in classes B2, D, E and F are planning references living in
**runtime strings that are not test titles** — shell output, assertion messages, a shell variable
holding a path, and a thrown `Error` message. No plan in Phase 152 declares them.

That is arguably correct: every one of them is *doing work* where it sits.

| Site | Class | Why it is defensible as-is |
|---|---|---|
| `tests/scripts/determinism-batch.sh:266` | B2 | Writes the ledger's own title line: `# Determinism batch ledger (criterion 3, INTEG-02)`. The reference identifies which criterion the ledger discharges. |
| `tests/scripts/determinism-batch.sh:312` | B2 | Writes `See \`138-NEGATIVE-CONTROL.md\` for the criterion-2 pair` into the generated ledger. The citation is the line's entire purpose. |
| `tests/scripts/determinism-batch.sh:321` | B2 | A generated Markdown table header with an `EPERM-07 step` column. Renaming the column breaks every consumer of the ledger format. |
| `tests/scripts/visual-container.sh:505` | B2 | An operator-facing precondition message: `D-11 requires the block to be proven`. |
| `tests/scripts/determinism-batch.sh:97` | E | `EPERM07_STEP_PREFIX='EPERM-07 customData.terms'` — the prefix is **matched against live Playwright step output**. Editing it breaks the match. |
| `tests/scripts/determinism-batch.sh:225` | E | `LEDGER_FILE="${LEDGER_FILE:-$LEDGER_DIR/138-DETERMINISM-LEDGER.md}"` — a path that must resolve on disk. |
| `tests/scripts/determinism-batch.sh:549` | E | A failure `REASON=` string naming the step criterion 3 is about. |
| `tests/tests/specs/visual/visual-regression.spec.ts:160` | D | Assertion message: `third-party font requests observed (VGATE-05 requires none): …`. |
| `tests/tests/specs/perm/perm-hide-category-tags.spec.ts:50` | D | Positive-control assertion message; `ASSERT-05` names the guarantee being asserted. |
| `tests/tests/specs/perm/perm-hide-election-tags.spec.ts:50` | D | Same, the complementary control. |
| `tests/tests/specs/candidate/candidate-bank-auth.spec.ts:167` | D | Skip diagnostic: `EFLOW-10 keys-configured path did not run — …`. |
| `packages/dev-seed/tests/integration/default-template.integration.test.ts:182` | D | Skip diagnostic naming the guards that did not run (`TMPL-03`, `NF-01`). |
| `packages/dev-seed/tests/integration/default-template.integration.test.ts:192` | D | Same, the port-specific variant. |
| `tests/tests/fixtures/voter/voter-journey.fixture.ts:150` | F | `throw new Error(… see .planning/debug/answer-surface-wait-timeout.md.)` — points an engineer at the diagnosis for a real, recurring failure. |

**Recorded in `.planning/WINDOWS.md` as entry 75** so that a later "the planning-reference class
is closed" claim cannot be made over them silently. They are not swept by this phase, they are not in any
judgement plan's queue, and that is a decision, not an oversight.

Note the asymmetry this creates and do not paper over it: `152-13` will rename `ASSERT-05` out of
a *test title* while `perm-hide-category-tags.spec.ts:50` keeps `ASSERT-05` in the *assertion
message* three lines below it. That is the correct outcome — the title is a label, the message is
a diagnostic — but it is the kind of inconsistency a reviewer will flag, so it is written down
here with its reason.

---

## 6. ⚠ THE CONTRADICTION, DISPOSED OF: criterion 5 vs pre-ship review comment #4

The two disagree, in terms, about test titles.

**Criterion 5** treats a test title as a legitimately-**declined**, out-of-scope match. That is
exactly what makes the residue proof meaningful: if the codemod rewrote test titles, the
`not-a-comment-span` class would be empty and there would be nothing to prove.

**Review comment #4**, at `packages/filters/tests/filter.test.ts:315`, says the opposite:

> *"**Never use planning references in test names.** Also rem line breaks from comment."*

And that site has **both** problems at once:

```
315| test('ChoiceQuestionFilter: TIR3 empty-include semantics', () => {
316|   // TIR3 cluster 1: distinguish `include = undefined` (filter inactive, all
317|   // pass) from `include = []` (filter ACTIVE with zero allowed → 0 results).
318|   // Prior to this contract, both states collapsed to "filter inactive".
```

Line 315 is the test **name** (comment #4's target). Lines 316-318 are a **comment** carrying a
planning reference *and* forced line breaks (this phase's criteria 2 and D-A4).

### The disposition

**Both are satisfiable, and the resolution is `152-RESEARCH.md` § 6's:**

> **The codemod declines every test title. A separate task, with its own gate, renames them
> deliberately. That task is plan `152-13`.**

Criterion 5's *"declined = out of scope"* phrasing governs the **codemod**, not the **phase**.
This plan's job is to keep the declines clean so the proof holds; `152-13`'s job is to make the
renames as a program-visible change with the safety checks that demands.

**This paragraph is the record of that disposition. It is not left implicit**, because an
unrecorded contradiction between two acceptance criteria is how a phase reaches a green gate
having quietly satisfied only one of them.

### What `152-13` inherits from this file

- **The authoritative queue is classes A1 + A2 above — 81 occurrences.** `152-RESEARCH.md` § 6's
  anchored `git grep` returns 23 across 20 files; it **under-counts** because it requires the
  call at line start. Use the residue TSV.
- **Playwright selection is by tag, not title.** `yarn test:e2e` is
  `playwright test … --grep-invert @probe` — so renaming a title does not change project or spec
  selection. `[VERIFIED: package.json:31 this session. `152-RESEARCH.md` § 6 cites `:29`; the
  script has since moved down two lines. The mechanism is unchanged — re-measure the line, do not
  quote the research figure.]`
- **`tests/e2e-runs/` registers and `.planning/` records cite test titles verbatim.** A rename
  without a matching register update creates a dangling citation. Check each.
- **`packages/filters/tests/filter.test.ts:315` does not appear in the 98.** Its token is `TIR3`,
  which is not in the codemod's task-ID pattern set. `152-13` must take comment #4's site from the
  review document, not from this register — the residue TSV is a *lower bound* on the title
  surface, bounded by the pattern set, and comment #4's own site proves it.

---


---

## 7. POST-MECHANICAL — what the apply moved, and what it did not

Everything below was measured **after** the apply commit `bfcf2dae5`, on the tree the
judgement waves will inherit.

### 7.1 The retargeted gate, post-apply, with a delta against the baseline

`bash .planning/phases/152-comment-naming-hygiene-sweep/scripts/hygiene-grep-report.sh`,
verbatim:

```
  pattern               occ   files    bare  expect     verdict
  -----------------  ------  ------  ------  ---------  -------
  phase-ref             746     261     104  occ = 0    FAIL
  spike-ref              40      30       0  occ = 0    FAIL
  decision-id-long        0       0       -  occ = 0    OK
  decision-id-bare       13       7       -  occ = 0    FAIL
  section-anchor         16       6       -  occ = 0    FAIL
  planning-path           1       1       -  occ = 0    FAIL
  plan-number             0       0       -  occ = 0    OK
  milestone-ver          50      33       -  -          REPORT
  task-id                88      46       -  occ = 0    FAIL

  planning-reference total (8 rows, comparable to the research loop) : 866
  task-id supplementary (no counterpart in that loop)                : 88
  union files touched by any row                                     : 295

Gate rows failing: 6  (milestone-ver is report-only and never counted)
```

Against `152-BASELINE.md` § 1b, row by row:

| Pattern | Baseline `occ` | Post `occ` | Δ occ | Baseline `files` | Post `files` | Δ files | `bare` | Verdict | Reading |
|---|---:|---:|---:|---:|---:|---:|---:|---|---|
| `phase-ref` | 746 | **746** | **0** | 261 | 261 | 0 | 104 | FAIL | Deferred in full. Rule 6's inversion means the mechanical pass touches none of them. |
| `spike-ref` | 40 | **40** | **0** | 30 | 30 | 0 | 0 | FAIL | Same. All 40 are already in the collapsed `see spike N` form the *inherited* gate calls OK. |
| `decision-id-long` | 1 | **0** | **−1** | 1 | 0 | −1 | – | **OK** | Closed. |
| `decision-id-bare` | 78 | **13** | **−65** | 27 | 7 | −20 | – | FAIL | 65 hits, exactly. The 13 survivors are in non-comment spans or forms the pattern does not reach. |
| `section-anchor` | 21 | **16** | **−5** | 8 | 6 | −2 | – | FAIL | The `section-anchor` RULE scored 0 hits; the −5 is collateral from `artifact-path` deleting whole lines that also carried a `§`. |
| `planning-path` | 11 | **1** | **−10** | 7 | 1 | −6 | – | FAIL | One survivor, in a runtime string (residue class F). |
| `plan-number` | 1 | **0** | **−1** | 1 | 0 | −1 | – | **OK** | Closed. |
| `milestone-ver` | 50 | **50** | **0** | 33 | 33 | 0 | – | REPORT | Untouched by design — `v\d+\.\d+` matches dependency versions. |
| `task-id` | 123 | **88** | **−35** | 60 | 46 | −14 | – | FAIL | 35 hits, exactly. |
| **8-row total** | **948** | **866** | **−82** | | | | | | 8.6% of the occurrence surface. |
| union files | 299 | **295** | −4 | | | | | | |

`bash …/hygiene-grep-report.sh --assert-clean` → **exit 1**, as it must. A green here would
mean the gate was reading the wrong column, which is the exact defect `152-BASELINE.md` § 1
was written to make impossible to repeat.

### 7.2 ⚠ THE FIGURE THE JUDGEMENT WAVES ACTUALLY NEED: spans, not occurrences

The occurrence count fell 8.6%. **The judgement surface fell 4.5%.** Those are different
numbers about different things, and quoting the first as though it sized the second would
hand the next seven plans a work estimate that is roughly twice as optimistic as the truth.

A *span* is a maximal run of consecutive comment lines, counted once if any of its lines
carries a planning reference. It is the unit judgement work is actually done in: a
seventeen-line narrative block is one decision, not seventeen. Measured this session with the
phase's own shared classifier (imported from `hygiene-codemod.mjs` — not a sixth copy):

| Quantity | Value |
|---|---:|
| Remaining reference-bearing comment **spans** | **641** |
| Distinct files | **282** |

The delta is computed **exactly**, not re-estimated: the apply touched 41 files and left the
other ~1,519 byte-identical, so their span counts cannot have moved. Over those 41 files:

| | Spans |
|---|---:|
| Before the apply (`bfcf2dae5~1` blobs, same classifier, same pattern set) | **180** |
| After the apply | **150** |
| Δ | **−30** |

So the whole-tree figure went **671 → 641**. **82 occurrences removed; 30 spans removed.**
The ratio is the finding: nearly every citation the regex could strip safely shared a span
with a phase or spike reference that rule 6 defers, so the span survives with its judgement
still owed. **The mechanical pass bought the judgement waves about 4.5% of their work, not
8.6%, and the plans behind this one should be sized on 641.**

*(`152-BASELINE.md` § 4 carries an inherited 642 spans / 278 files from `152-RESEARCH.md`
§ 4.4 at HEAD `22c2542e3`. It is marked inherited there, and it is NOT comparable to the 671
above: different measurement point, different pattern set, different span-boundary rule. Two
numbers that happen to be close are not a cross-check. The 641 is this session's, by a named
instrument, and it is the one to use.)*

### 7.3 The seven-way partition — total, disjoint, and checked

Batched by **file concentration**, per `152-RESEARCH.md` § 4.4, not by tree. Batching by tree
splits `dev-seed`'s source and test halves across two agents that need the same context, and
that is the worse failure of the two.

| Plan | Scope | Spans | Files |
|---|---|---:|---:|
| `152-06` | `tests/**` except the spec directories — the Playwright config, utils, fixtures, helpers, setup, scripts | **130** | 36 |
| `152-07` | `tests/tests/specs/**` — the E2E spec directories | **44** | 16 |
| `152-08` | `packages/dev-seed/**` — source and tests together | **208** | 81 |
| `152-09` | the remaining `packages/**` workspaces | **13** | 6 |
| `152-10` | `apps/frontend/src/lib/**` except `components/` — contexts, dynamic components, the API adapter surface | **132** | 71 |
| `152-11` | `apps/frontend/src/routes/**` + `apps/frontend/src/lib/components/**` + the app shell | **105** | 66 |
| `152-12` | `apps/supabase/**` and `apps/docs/**` | **9** | 6 |
| **Total** | | **641** | **282** |

**The partition assertion, with its arithmetic, because a partition that silently drops a file
is how a phase reaches a green gate with untouched violations:**

```
130 + 44 + 208 + 13 + 132 + 105 + 9 = 641   ==  641 measured spans     ✓
 36 + 16 +  81 +  6 +  71 +  66 + 6 = 282   ==  282 measured files     ✓
files appearing in more than one list                            = 0   ✓
files appearing in no list (UNASSIGNED)                          = 0   ✓
```

The ownership rule is a **prefix partition over the path**, evaluated in this order, so
totality and disjointness are structural rather than checked-after-the-fact:

```
tests/tests/specs/          -> 152-07
tests/                      -> 152-06
packages/dev-seed/          -> 152-08
packages/                   -> 152-09
apps/frontend/src/lib/components/ -> 152-11
apps/frontend/src/lib/      -> 152-10
apps/frontend/              -> 152-11
apps/                       -> 152-12
```

**Two load imbalances the operator should see rather than discover.** `152-08` carries 208
spans — a third of the whole remaining surface — because `dev-seed` is where the densest
planning prose in the repo lives. `152-09` and `152-12` carry 13 and 9. That is the price of
keeping `dev-seed`'s source and test halves with one agent, and RESEARCH § 4.4 argues it is
the right price. If a later plan wants to rebalance, the split to make is inside `152-08`
(source vs `tests/`), not across the `packages/` boundary.

### 7.4 The per-plan work queues

#### `152-06` — 130 spans across 36 files

> The Playwright config, the test-suite utilities, fixtures, helpers, setup and scripts — everything under `tests/` that is NOT a spec

| Spans | File |
|---:|---|
| 53 | `tests/playwright.config.ts` |
| 6 | `tests/tests/helpers/navigation.ts` |
| 5 | `tests/tests/fixtures/voter/voter-journey.fixture.ts` |
| 5 | `tests/tests/utils/testIds.ts` |
| 4 | `tests/tests/setup/shared/assertTeardown.ts` |
| 4 | `tests/tests/utils/axeScan.ts` |
| 4 | `tests/tests/utils/voterNavigation.ts` |
| 3 | `tests/scripts/e2e-run.sh` |
| 3 | `tests/scripts/tcp-forward.mjs` |
| 3 | `tests/tests/fixtures/candidate/candidatePreregisterPage.fixture.ts` |
| 3 | `tests/tests/fixtures/voter/views.ts` |
| 3 | `tests/tests/setup/candidate/bank-auth-journey.teardown.ts` |
| 3 | `tests/tests/setup/shared/setupFromTemplate.ts` |
| 3 | `tests/tests/support/preflight.ts` |
| 2 | `tests/scripts/visual-container.sh` |
| 2 | `tests/tests/fixtures/candidate/candidateQuestionPage.fixture.ts` |
| 2 | `tests/tests/fixtures/voter/questionInfo.fixture.ts` |
| 2 | `tests/tests/setup/candidate/bank-auth-journey.setup.ts` |
| 2 | `tests/tests/utils/rawKeyScan.ts` |
| 2 | `tests/tests/utils/selectElection.ts` |
| 1 | `tests/eslint.config.mjs` |
| 1 | `tests/global-setup.ts` |
| 1 | `tests/scripts/determinism-batch.sh` |
| 1 | `tests/tests/fixtures/shared/forensicCapture.fixture.ts` |
| 1 | `tests/tests/fixtures/shared/popupNotice.fixture.ts` |
| 1 | `tests/tests/fixtures/shared/theme.fixture.ts` |
| 1 | `tests/tests/fixtures/voter/aboutPage.fixture.ts` |
| 1 | `tests/tests/fixtures/voter/voterQuestionsPage.fixture.ts` |
| 1 | `tests/tests/setup/perm/perm-show-feedback-survey.setup.ts` |
| 1 | `tests/tests/setup/perm/perm-show-feedback-survey.teardown.ts` |
| 1 | `tests/tests/setup/shared/base.setup.ts` |
| 1 | `tests/tests/setup/shared/base.teardown.ts` |
| 1 | `tests/tests/utils/multiChoice.ts` |
| 1 | `tests/tests/utils/preflight.test.ts` |
| 1 | `tests/tests/utils/supabaseAdminClient.ts` |
| 1 | `tests/tests/utils/testCredentials.ts` |

#### `152-07` — 44 spans across 16 files

> The E2E spec directories — `tests/tests/specs/**`

| Spans | File |
|---:|---|
| 14 | `tests/tests/specs/voter/voter-journey.spec.ts` |
| 7 | `tests/tests/specs/a11y/a11y-smoke.spec.ts` |
| 4 | `tests/tests/specs/visual/visual-regression.spec.ts` |
| 4 | `tests/tests/specs/voter/eperm07-term-trigger.spec.ts` |
| 3 | `tests/tests/specs/candidate/candidate-journey.spec.ts` |
| 2 | `tests/tests/specs/voter/voter-journey-mobile.spec.ts` |
| 1 | `tests/tests/specs/_probes/defaultTemplateResults.probe.spec.ts` |
| 1 | `tests/tests/specs/candidate/candidate-bank-auth-journey.spec.ts` |
| 1 | `tests/tests/specs/candidate/candidate-bank-auth.spec.ts` |
| 1 | `tests/tests/specs/perf/performance-budget.spec.ts` |
| 1 | `tests/tests/specs/perm/perm-hide-category-tags.spec.ts` |
| 1 | `tests/tests/specs/perm/perm-hide-election-tags.spec.ts` |
| 1 | `tests/tests/specs/perm/perm-show-feedback-survey.spec.ts` |
| 1 | `tests/tests/specs/voter/cold-entry-dataroot.spec.ts` |
| 1 | `tests/tests/specs/voter/voter-alliance.spec.ts` |
| 1 | `tests/tests/specs/voter/voter-prefs-tracking.spec.ts` |

#### `152-08` — 208 spans across 81 files

> The dev-seed workspace, source and tests together — `packages/dev-seed/**`

| Spans | File |
|---:|---|
| 15 | `packages/dev-seed/src/templates/e2e/base.ts` |
| 14 | `packages/dev-seed/tests/integration/default-template.integration.test.ts` |
| 12 | `packages/dev-seed/src/supabaseAdminClient.ts` |
| 11 | `packages/dev-seed/src/writer.ts` |
| 7 | `packages/dev-seed/src/pipeline.ts` |
| 6 | `packages/dev-seed/src/generators/QuestionsGenerator.ts` |
| 6 | `packages/dev-seed/src/template/schema.ts` |
| 6 | `packages/dev-seed/tests/template/permittedKeys.test.ts` |
| 6 | `packages/dev-seed/tests/writer.test.ts` |
| 5 | `packages/dev-seed/src/emitters/latent/project.ts` |
| 4 | `packages/dev-seed/src/generators/CandidatesGenerator.ts` |
| 4 | `packages/dev-seed/src/generators/NominationsGenerator.ts` |
| 4 | `packages/dev-seed/src/template/linkSentinels.ts` |
| 4 | `packages/dev-seed/src/template/permittedKeys.ts` |
| 4 | `packages/dev-seed/src/templates/index.ts` |
| 4 | `packages/dev-seed/tests/templates/default.test.ts` |
| 3 | `packages/dev-seed/src/cli/resolve-template.ts` |
| 3 | `packages/dev-seed/src/emitters/answers.ts` |
| 3 | `packages/dev-seed/src/emitters/latent/latentEmitter.ts` |
| 3 | `packages/dev-seed/src/generators/AppSettingsGenerator.ts` |
| 3 | `packages/dev-seed/src/generators/OrganizationsGenerator.ts` |
| 3 | `packages/dev-seed/tests/ciTypecheckGate.test.ts` |
| 3 | `packages/dev-seed/tests/pipeline.test.ts` |
| 2 | `packages/dev-seed/src/cli/teardown.ts` |
| 2 | `packages/dev-seed/src/ctx.ts` |
| 2 | `packages/dev-seed/src/generators/ElectionsGenerator.ts` |
| 2 | `packages/dev-seed/src/generators/FeedbackGenerator.ts` |
| 2 | `packages/dev-seed/src/generators/QuestionCategoriesGenerator.ts` |
| 2 | `packages/dev-seed/src/locales.ts` |
| 2 | `packages/dev-seed/src/templates/e2e/perm/notLocated2e2cgShape.ts` |
| 2 | `packages/dev-seed/src/templates/e2e/perm/perm-bankauth-notloc.ts` |
| 2 | `packages/dev-seed/tests/cli/resolve-template.test.ts` |
| 2 | `packages/dev-seed/tests/generators/CandidatesGenerator.test.ts` |
| 2 | `packages/dev-seed/tests/supabaseAdminClient.test.ts` |
| 2 | `packages/dev-seed/tests/template.test.ts` |
| 2 | `packages/dev-seed/tests/template/latent.schema.test.ts` |
| 2 | `packages/dev-seed/tests/template/linkSentinelRules.type-test.ts` |
| 2 | `packages/dev-seed/tests/template/strictRowTypes.type-test.ts` |
| 2 | `packages/dev-seed/tests/templates/base-app-settings.test.ts` |
| 2 | `packages/dev-seed/tests/templates/nominations-override.test.ts` |
| 1 | `packages/dev-seed/src/assertKnownRowProps.ts` |
| 1 | `packages/dev-seed/src/cli/seed.ts` |
| 1 | `packages/dev-seed/src/emitters/latent/centroids.ts` |
| 1 | `packages/dev-seed/src/emitters/latent/gaussian.ts` |
| 1 | `packages/dev-seed/src/emitters/latent/index.ts` |
| 1 | `packages/dev-seed/src/emitters/latent/latentTypes.ts` |
| 1 | `packages/dev-seed/src/emitters/latent/loadings.ts` |
| 1 | `packages/dev-seed/src/generators/AccountsGenerator.ts` |
| 1 | `packages/dev-seed/src/generators/AlliancesGenerator.ts` |
| 1 | `packages/dev-seed/src/generators/ConstituenciesGenerator.ts` |
| 1 | `packages/dev-seed/src/generators/ConstituencyGroupsGenerator.ts` |
| 1 | `packages/dev-seed/src/generators/FactionsGenerator.ts` |
| 1 | `packages/dev-seed/src/generators/ProjectsGenerator.ts` |
| 1 | `packages/dev-seed/src/index.ts` |
| 1 | `packages/dev-seed/src/resolveAppSettingsExternalIds.ts` |
| 1 | `packages/dev-seed/src/template/collectionNames.ts` |
| 1 | `packages/dev-seed/src/template/index.ts` |
| 1 | `packages/dev-seed/src/template/types.ts` |
| 1 | `packages/dev-seed/src/templates/default.ts` |
| 1 | `packages/dev-seed/src/templates/defaults/questions-override.ts` |
| 1 | `packages/dev-seed/src/templates/e2e/perm/perm-access-disable.ts` |
| 1 | `packages/dev-seed/src/templates/e2e/perm/perm-not-located-2e2cg.ts` |
| 1 | `packages/dev-seed/src/templates/e2e/perm/perm-org-matching.ts` |
| 1 | `packages/dev-seed/src/templates/e2e/perm/show-feedback-survey.ts` |
| 1 | `packages/dev-seed/tests/assertKnownRowProps.builtins.test.ts` |
| 1 | `packages/dev-seed/tests/assertKnownRowProps.test.ts` |
| 1 | `packages/dev-seed/tests/cli/allowedTeardownTables.test.ts` |
| 1 | `packages/dev-seed/tests/cli/teardown.test.ts` |
| 1 | `packages/dev-seed/tests/determinism.test.ts` |
| 1 | `packages/dev-seed/tests/fixtures/negctl-elections-sentinel.ts` |
| 1 | `packages/dev-seed/tests/fixtures/negctl-questions-answers.ts` |
| 1 | `packages/dev-seed/tests/fixtures/negctl-questions-entity-type-camel.ts` |
| 1 | `packages/dev-seed/tests/fixtures/negctl-questions-entity-type.ts` |
| 1 | `packages/dev-seed/tests/generators/AppSettingsGenerator.test.ts` |
| 1 | `packages/dev-seed/tests/generators/OrganizationsGenerator.test.ts` |
| 1 | `packages/dev-seed/tests/latent/clustering.integration.test.ts` |
| 1 | `packages/dev-seed/tests/latent/loadings.test.ts` |
| 1 | `packages/dev-seed/tests/locales.test.ts` |
| 1 | `packages/dev-seed/tests/resolveAppSettingsExternalIds.test.ts` |
| 1 | `packages/dev-seed/tests/template/linkSentinels.test.ts` |
| 1 | `packages/dev-seed/tests/templates/base.test.ts` |

#### `152-09` — 13 spans across 6 files

> The remaining `packages/**` workspaces

| Spans | File |
|---:|---|
| 4 | `packages/app-shared/src/settings/dynamicSettings.type.ts` |
| 4 | `packages/argument-condensation/src/core/condensation/condenser.ts` |
| 2 | `packages/supabase-types/src/column-map.ts` |
| 1 | `packages/app-shared/src/utils/mergeSettings.ts` |
| 1 | `packages/question-info/src/core/infoGeneration.ts` |
| 1 | `packages/question-info/tests/questionTypes.test.ts` |

#### `152-10` — 132 spans across 71 files

> The frontend library tree — contexts, dynamic components, the API adapter surface (`apps/frontend/src/lib/**` except `components/`)

| Spans | File |
|---:|---|
| 11 | `apps/frontend/src/lib/contexts/app/appContext.svelte.ts` |
| 11 | `apps/frontend/src/lib/contexts/voter/voterContext.svelte.ts` |
| 9 | `apps/frontend/src/lib/contexts/candidate/candidateContext.svelte.ts` |
| 7 | `apps/frontend/src/lib/dynamic-components/entityCard/EntityCard.svelte` |
| 3 | `apps/frontend/src/lib/_guards/eslint-store-guard.test.ts` |
| 3 | `apps/frontend/src/lib/contexts/admin/adminContext.svelte.ts` |
| 3 | `apps/frontend/src/lib/contexts/app/appContext.spread.svelte.test.ts` |
| 3 | `apps/frontend/src/lib/contexts/app/appContext.type.ts` |
| 3 | `apps/frontend/src/lib/contexts/data/dataContext.svelte.ts` |
| 3 | `apps/frontend/src/lib/contexts/voter/voterContext.type.ts` |
| 3 | `apps/frontend/src/lib/dynamic-components/entityDetails/EntityDetails.svelte` |
| 2 | `apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.test.ts` |
| 2 | `apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts` |
| 2 | `apps/frontend/src/lib/api/utils/auth/__tests__/token-endpoint.test.ts` |
| 2 | `apps/frontend/src/lib/candidate/components/logoutButton/LogoutButton.svelte` |
| 2 | `apps/frontend/src/lib/contexts/data/dataContext.type.ts` |
| 2 | `apps/frontend/src/lib/contexts/utils/settingsOverlay.svelte.ts` |
| 2 | `apps/frontend/src/lib/contexts/voter/matchState.svelte.ts` |
| 2 | `apps/frontend/src/lib/dynamic-components/entityDetails/EntityInfo.svelte` |
| 2 | `apps/frontend/src/lib/dynamic-components/entityList/EntityListWithControls.svelte` |
| 2 | `apps/frontend/src/lib/dynamic-components/navigation/candidate/CandidateNav.svelte` |
| 2 | `apps/frontend/src/lib/dynamic-components/navigation/voter/VoterNav.svelte` |
| 2 | `apps/frontend/src/lib/dynamic-components/questionHeading/QuestionHeading.svelte` |
| 2 | `apps/frontend/src/lib/i18n/tests/translations.test.ts` |
| 1 | `apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.type.ts` |
| 1 | `apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts` |
| 1 | `apps/frontend/src/lib/api/utils/auth/__tests__/authorize-endpoint.test.ts` |
| 1 | `apps/frontend/src/lib/api/utils/auth/providers/authConfig.ts` |
| 1 | `apps/frontend/src/lib/api/utils/auth/providers/idura.test.ts` |
| 1 | `apps/frontend/src/lib/api/utils/auth/providers/signicat.test.ts` |
| 1 | `apps/frontend/src/lib/api/utils/auth/providers/signicat.ts` |
| 1 | `apps/frontend/src/lib/api/utils/auth/providers/types.ts` |
| 1 | `apps/frontend/src/lib/candidate/components/termsOfUse/TermsOfUseForm.svelte` |
| 1 | `apps/frontend/src/lib/contexts/admin/index.ts` |
| 1 | `apps/frontend/src/lib/contexts/app/survey.svelte.test.ts` |
| 1 | `apps/frontend/src/lib/contexts/app/tracking/trackingService.svelte.ts` |
| 1 | `apps/frontend/src/lib/contexts/auth/authContext.svelte.ts` |
| 1 | `apps/frontend/src/lib/contexts/candidate/candidateUserDataState.svelte.ts` |
| 1 | `apps/frontend/src/lib/contexts/candidate/index.ts` |
| 1 | `apps/frontend/src/lib/contexts/component/componentContext.svelte.ts` |
| 1 | `apps/frontend/src/lib/contexts/component/darkMode.svelte.ts` |
| 1 | `apps/frontend/src/lib/contexts/filter/filterContext.svelte.ts` |
| 1 | `apps/frontend/src/lib/contexts/i18n/i18nContext.type.ts` |
| 1 | `apps/frontend/src/lib/contexts/layout/layoutContext.svelte.ts` |
| 1 | `apps/frontend/src/lib/contexts/utils/inheritContextMembers.test.ts` |
| 1 | `apps/frontend/src/lib/contexts/utils/inheritContextMembers.ts` |
| 1 | `apps/frontend/src/lib/contexts/utils/persistedState.svelte.ts` |
| 1 | `apps/frontend/src/lib/contexts/voter/answerState.svelte.ts` |
| 1 | `apps/frontend/src/lib/contexts/voter/index.ts` |
| 1 | `apps/frontend/src/lib/dynamic-components/dataConsent/DataConsent.svelte` |
| 1 | `apps/frontend/src/lib/dynamic-components/dataConsent/DataConsentInfoButton.svelte` |
| 1 | `apps/frontend/src/lib/dynamic-components/entityDetails/EntityOpinions.svelte` |
| 1 | `apps/frontend/src/lib/dynamic-components/entityList/EntityListControls.svelte` |
| 1 | `apps/frontend/src/lib/dynamic-components/entityList/EntityListWithControls.type.ts` |
| 1 | `apps/frontend/src/lib/dynamic-components/entityList/index.ts` |
| 1 | `apps/frontend/src/lib/dynamic-components/feedback/Feedback.svelte` |
| 1 | `apps/frontend/src/lib/dynamic-components/navigation/NavGroup.svelte` |
| 1 | `apps/frontend/src/lib/dynamic-components/navigation/NavItem.svelte` |
| 1 | `apps/frontend/src/lib/dynamic-components/navigation/languages/LanguageSelection.svelte` |
| 1 | `apps/frontend/src/lib/dynamic-components/navigation/navGroupContext.ts` |
| 1 | `apps/frontend/src/lib/dynamic-components/survey/banner/SurveyBanner.svelte` |
| 1 | `apps/frontend/src/lib/i18n/utils/assertTranslationKey.ts` |
| 1 | `apps/frontend/src/lib/utils/getAllianceSummary.ts` |
| 1 | `apps/frontend/src/lib/utils/matching/imputeParentAnswers.test.ts` |
| 1 | `apps/frontend/src/lib/utils/matching/imputeParentAnswers.ts` |
| 1 | `apps/frontend/src/lib/utils/route/buildRoute.ts` |
| 1 | `apps/frontend/src/lib/utils/route/filterPersistent.ts` |
| 1 | `apps/frontend/src/lib/utils/route/params.ts` |
| 1 | `apps/frontend/src/lib/utils/route/parseParams.ts` |
| 1 | `apps/frontend/src/lib/utils/route/route.ts` |
| 1 | `apps/frontend/src/lib/utils/settings.test.ts` |

#### `152-11` — 105 spans across 66 files

> The frontend route tree and the base component library (`apps/frontend/src/routes/**`, `apps/frontend/src/lib/components/**`, and the app shell)

| Spans | File |
|---:|---|
| 6 | `apps/frontend/src/routes/(voters)/(located)/results/[[electionTab]]/+layout.svelte` |
| 6 | `apps/frontend/src/routes/+layout.svelte` |
| 5 | `apps/frontend/src/routes/(voters)/(located)/questions/+layout.svelte` |
| 4 | `apps/frontend/src/lib/components/input/Input.svelte` |
| 4 | `apps/frontend/src/routes/(voters)/constituencies/+page.svelte` |
| 4 | `apps/frontend/src/routes/candidate/(protected)/profile/+page.svelte` |
| 3 | `apps/frontend/src/routes/(voters)/(located)/questions/+page.svelte` |
| 3 | `apps/frontend/src/routes/(voters)/(located)/questions/category/[categoryId]/+page.svelte` |
| 3 | `apps/frontend/src/routes/(voters)/+layout.svelte` |
| 3 | `apps/frontend/src/routes/(voters)/elections/+page.svelte` |
| 2 | `apps/frontend/scripts/flatten-current-codemod.mjs` |
| 2 | `apps/frontend/src/lib/components/questions/QuestionExtendedInfo.svelte` |
| 2 | `apps/frontend/src/lib/components/select/Select.svelte` |
| 2 | `apps/frontend/src/routes/(voters)/intro/+page.svelte` |
| 2 | `apps/frontend/src/routes/MainContent.svelte` |
| 2 | `apps/frontend/src/routes/candidate/(protected)/+page.svelte` |
| 2 | `apps/frontend/src/routes/candidate/(protected)/questions/+page.svelte` |
| 2 | `apps/frontend/src/routes/candidate/(protected)/questions/[questionId]/+page.svelte` |
| 1 | `apps/frontend/eslint.config.mjs` |
| 1 | `apps/frontend/scripts/store-to-state-codemod.mjs` |
| 1 | `apps/frontend/src/lib/components/constituencySelector/ConstituencySelector.svelte` |
| 1 | `apps/frontend/src/lib/components/electionSelector/ElectionSelector.svelte` |
| 1 | `apps/frontend/src/lib/components/entityFilters/EntityFilters.svelte` |
| 1 | `apps/frontend/src/lib/components/questions/QuestionArguments.svelte` |
| 1 | `apps/frontend/src/lib/components/questions/QuestionChoices.svelte` |
| 1 | `apps/frontend/src/lib/components/tabs/Tabs.svelte` |
| 1 | `apps/frontend/src/params/etPl.test.ts` |
| 1 | `apps/frontend/src/params/etPl.ts` |
| 1 | `apps/frontend/src/params/etSg.test.ts` |
| 1 | `apps/frontend/src/params/etSg.ts` |
| 1 | `apps/frontend/src/routes/(voters)/(located)/+layout.svelte` |
| 1 | `apps/frontend/src/routes/(voters)/(located)/questions/+layout.ts` |
| 1 | `apps/frontend/src/routes/(voters)/(located)/questions/[questionId]/+page.svelte` |
| 1 | `apps/frontend/src/routes/(voters)/(located)/results/[[electionTab]]/+layout.ts` |
| 1 | `apps/frontend/src/routes/(voters)/(located)/results/[[electionTab]]/[[entityTab=etPl]]/[[entity=etSg]]/[[id]]/+page.svelte` |
| 1 | `apps/frontend/src/routes/(voters)/(located)/results/[[electionTab]]/[[entityTab=etPl]]/[[entity=etSg]]/[[id]]/+page.ts` |
| 1 | `apps/frontend/src/routes/(voters)/(located)/results/[[electionTab]]/statistics/+page.svelte` |
| 1 | `apps/frontend/src/routes/(voters)/+page.svelte` |
| 1 | `apps/frontend/src/routes/(voters)/about/+page.svelte` |
| 1 | `apps/frontend/src/routes/(voters)/constituencies/+page.ts` |
| 1 | `apps/frontend/src/routes/(voters)/elections/+page.ts` |
| 1 | `apps/frontend/src/routes/(voters)/info/+page.svelte` |
| 1 | `apps/frontend/src/routes/(voters)/nominations/+layout.svelte` |
| 1 | `apps/frontend/src/routes/(voters)/nominations/+page.svelte` |
| 1 | `apps/frontend/src/routes/(voters)/privacy/+page.svelte` |
| 1 | `apps/frontend/src/routes/Header.svelte` |
| 1 | `apps/frontend/src/routes/SingleCardContent.svelte` |
| 1 | `apps/frontend/src/routes/admin/(protected)/argument-condensation/+layout.svelte` |
| 1 | `apps/frontend/src/routes/admin/(protected)/argument-condensation/+page.svelte` |
| 1 | `apps/frontend/src/routes/admin/(protected)/question-info/+layout.svelte` |
| 1 | `apps/frontend/src/routes/admin/(protected)/question-info/+page.svelte` |
| 1 | `apps/frontend/src/routes/admin/+layout.svelte` |
| 1 | `apps/frontend/src/routes/admin/login/+page.svelte` |
| 1 | `apps/frontend/src/routes/candidate/(protected)/+layout.svelte` |
| 1 | `apps/frontend/src/routes/candidate/(protected)/preview/+page.svelte` |
| 1 | `apps/frontend/src/routes/candidate/+layout.svelte` |
| 1 | `apps/frontend/src/routes/candidate/help/+page.svelte` |
| 1 | `apps/frontend/src/routes/candidate/login/+page.svelte` |
| 1 | `apps/frontend/src/routes/candidate/password-reset/+page.svelte` |
| 1 | `apps/frontend/src/routes/candidate/preregister/(authenticated)/+layout.svelte` |
| 1 | `apps/frontend/src/routes/candidate/preregister/(authenticated)/elections/+page.svelte` |
| 1 | `apps/frontend/src/routes/candidate/preregister/(authenticated)/email/+page.svelte` |
| 1 | `apps/frontend/src/routes/candidate/preregister/+layout.svelte` |
| 1 | `apps/frontend/src/routes/candidate/register/+layout.svelte` |
| 1 | `apps/frontend/src/routes/candidate/register/+page.svelte` |
| 1 | `apps/frontend/static/fonts/inter.css` |

#### `152-12` — 9 spans across 6 files

> The Supabase app and the docs app (`apps/supabase/**`, `apps/docs/**`)

| Spans | File |
|---:|---|
| 3 | `apps/supabase/benchmarks/scripts/run-concurrency-scaling.sh` |
| 2 | `apps/supabase/supabase/tests/database/00-helpers.test.sql` |
| 1 | `apps/supabase/supabase/config.toml` |
| 1 | `apps/supabase/supabase/functions/identity-callback/claimConfig.ts` |
| 1 | `apps/supabase/supabase/functions/identity-callback/index.ts` |
| 1 | `apps/supabase/supabase/tests/database/10-schema-migrations.test.sql` |


### 7.5 The three named hard cases, with their agreed dispositions

Recorded here so the owning executor does not re-derive them, and so the disposition is on
the record before the edit rather than justified after it.

#### (a) `apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts:88-104` — owner `152-10`

**REWRITE, DO NOT DELETE.** Seventeen lines, a `13+`-bucket span, and one of the two hardest
judgement calls in the phase.

> ⚠ **The plan and `152-CONTEXT.md` both describe this as `:86-90`, five lines. It is not.**
> `152-RESEARCH.md` records the correction (LOUD CONTRADICTION 5) and this session confirms it
> at HEAD: the block is **`:88-104`, seventeen lines**. Lines 84-85 are a *different*,
> unrelated comment about `WithAuth` compatibility shims. Do not scope the edit to five lines.

What the block actually carries, and why deletion would destroy information:

- The mechanism: `auth.updateUser({ password })` rotates the access token, and under some
  Playwright timings the next PostgREST call sent a stale/empty JWT → `auth.uid() = NULL` →
  a 406 on the ToU UPDATE.
- A **deliberately-not-taken fix** (`await this.supabase.auth.refreshSession()` at this exact
  line) with **two measured reasons** for not taking it: (a) the live failure did not
  reproduce under 20× `repeat-each`; (b) the call costs a network round-trip on every
  password set/reset and can turn a working `setPassword` into a thrown error on an expired
  refresh token.
- A **re-trigger condition**: "if the 406 reappears, add it here and mirror in
  `_resetPassword` / `_register`".

Keep all three. Strip only `(see phase 86.1 ToU-406 chase)` from line 88 and rewrite the
sentence around the gap. The rest is measured engineering content, not planning narrative.

#### (b) `packages/dev-seed/src/cli/resolve-template.ts:62-70` — owner `152-08`

**KEEP THE HAZARD AND THE GUARD; DROP THE PAST-EDIT NARRATIVE.** Nine lines. The extent
`152-CONTEXT.md` gives is exact here.

- **Lines 62-64 are a LIVE INVARIANT**: `builtIns` is a plain object literal, so
  `builtIns['toString']` returns `Object.prototype.toString` — truthy — and
  `--template toString` skipped the "Unknown template" branch entirely. That is *why*
  line 71 reads `Object.hasOwn(builtIns, arg) ? builtIns[arg] : undefined`. Delete this and
  the next reader "simplifies" the guard back into the bug.
- **Lines 65-70 are narrative about a past edit** — *"The consequence changed in THIS phase:
  the value used to be returned silently, and now it reaches `validateTemplate`…"*. A
  comment that describes what an earlier phase changed is a changelog entry in the wrong
  file.

Target: one or two lines carrying the hazard and the guard, with no `144-REVIEW`, no `WR-06`
and no "this phase".

#### (c) `apps/supabase/supabase/functions/identity-callback/index.ts:249-251` — owner `152-12`

**A LIVE SECURITY INVARIANT. KEEP EVERY WORD OF THE MEANING.**

```
249|      // Logged, never returned -- see the decryption arm above. The claim-extraction
250|      // message enumerates which configured claim names were present or missing, which
251|      // discloses the provider's claim mapping to an unauthenticated caller.
252|      console.error('[identity-callback] identity claim extraction failed:', e);
```

The comment guards the `console.error` on the very next line and the generic
`'Invalid identity claims'` 401 below it. It is the reason the caught error is *logged* and
not *returned*. Deleting or thinning it is an information-disclosure regression waiting for
its next editor — threat `T-152-02` in this plan's register, and the reason rule 6 was
inverted rather than made cleverer.

**It carries no planning reference at all.** It is named here only because the roadmap named
it, and because a judgement pass sweeping the file could plausibly mistake three lines of
prose above a `console.error` for narrative. It is not narrative. Line-joining it is fine;
shortening it is not.

### 7.6 What "done" looks like for `152-06` … `152-12`

The gate is `bash …/scripts/hygiene-grep-report.sh --assert-clean`, and it exits **1** today
with **6 failing rows**. It exits 0 when `phase-ref`, `spike-ref`, `decision-id-bare`,
`section-anchor`, `planning-path` and `task-id` all reach `occ = 0` over
`apps/ packages/ tests/`.

Three cautions, each of which has already cost this phase something:

1. **`milestone-ver` is report-only and must stay that way.** It matches `Yarn 4.13`,
   `Node 22.22.1` and `jose@v5.9.6`. Driving it to zero would edit dependency pins.
2. **The 98 `not-a-comment-span` rows in § 4 are NOT in any of the seven queues.** 81 belong
   to `152-13`; the other 17 belong to nobody (§ 5, `WINDOWS.md` entry 75). A judgement plan
   that "helpfully" renames a test title it finds in its own files is doing `152-13`'s work
   without `152-13`'s safety checks.
3. **Never substitute the inherited
   `.claude/skills/ship-review-stack/sources/hygiene-grep-report.sh --assert-clean`.** It is
   green on 682 of this phase's violations. `152-BASELINE.md` § 1 is the demonstration.
