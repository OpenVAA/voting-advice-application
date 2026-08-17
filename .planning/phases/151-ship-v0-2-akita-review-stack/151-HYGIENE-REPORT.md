---
phase: 151-ship-v0-2-akita-review-stack
plan: 08
artifact: hygiene-report
stage: 2
measured: 2026-08-17

# --- STAGE 2 (plan 151-08, the agent pass). Stage-1 keys below are preserved as the
#     mid-sweep record; every Stage-2 key is prefixed s2_ so the two states never merge.
assert_clean: fail-by-design
s2_assert_clean_exit: 1
s2_gate_rows_failing: 2
s2_gate_rows_failing_all_keep_classified: true
criterion_3: satisfied
criterion_3_closed: true
criterion_3_closed_by: plan-151-08
criterion_3_operator_approved: true
criterion_3_approved_on: 2026-08-17

# READ THIS BEFORE TREATING THE RED GATE AS UNFINISHED WORK.
# `--assert-clean` exits 1 BY DESIGN and this is the CLOSED state of criterion 3.
# Exactly two rows are red; both are recorded KEEP verdicts with measured justification
# (see the two Exception sections below). For plan 151-18: a red --assert-clean carrying
# EXACTLY these two enumerated KEEP rows is a PASS for criterion 3, not a failure.
s2_red_gate_is_expected: true
s2_red_gate_rows: [task-id, phase-ref-bare]
s2_151_18_reads_red_as: pass
s2_report_only_rescope_proposal: deferred-to-plan-151-19

# the operator's answer to plan 151-08 Task 1, recorded verbatim in shape
todo_disposition: leave-and-record-plus-two-named-exceptions
s2_todo_occurrences: 64
s2_todo_files: 48
s2_todo_left_in_place: 64
s2_todo_relabelled: 1
s2_todo_recorded_as_finding: 1

# --- Stage-2 gate rows ---
s2_phase_ref_occ: 659
s2_phase_ref_bare: 11
s2_spike_ref_occ: 40
s2_spike_ref_bare: 0
s2_decision_id_long: 0
s2_decision_id_bare: 0
s2_section_anchor: 0
s2_planning_path: 0
s2_plan_number: 0
s2_task_id: 84
s2_milestone_ver: 43
s2_review_tag_occurrences: 0

# --- criterion 3 positive shape check (not an absence-only check) ---
s2_phase_refs_surviving: 659
s2_phase_refs_in_pointer_form: 648
s2_spike_refs_surviving: 40
s2_spike_refs_in_pointer_form: 40
s2_refs_not_in_pointer_form: 11
s2_refs_not_in_pointer_form_all_keep_classified: true

# --- the two deliberate KEEP exceptions, sized ---
s2_keep_task_id: 84
s2_keep_phase_ref_domain_labels: 11

# --- gates, against 151-BASELINE.md ---
s2_lint_check: green
s2_lint_errors: 0
s2_lint_warnings: 20
s2_format_check: red
s2_format_check_files: 2
s2_test_unit: green
s2_unit_tests_passed: 1522
s2_unit_test_files: 149
s2_build: green
s2_build_tasks: 14
s2_gates_match_baseline_exactly: true
s2_source_commit: 5862397ad

# --- what the codemod did (one pattern set, one run, pre-apply tree 44fdc7ab9) ---
files_scanned: 1788
files_rewritten: 346
comment_lines_deleted: 11
total_occurrences: 2513
total_hits: 1985
total_residue: 528
overlaps_absorbed: 222

# --- per-rule hits ---
hits_artifact_path: 67
hits_section_anchor: 149
hits_plan_number: 103
hits_decision_id_long: 136
hits_decision_id_bare: 493
hits_task_id: 451
hits_phase_ref: 550
hits_spike_ref: 36

# --- residue, one key per reason; these sum to residue_total ---
residue_total: 528
residue_not_a_comment_span: 202
residue_attributive_reference: 108
residue_unstrippable_section_anchor: 66
residue_todo_class: 60
residue_markdown_file: 45
residue_milestone_version: 37
residue_ambiguous_reference: 10
residue_files: 228

# --- separately tracked, NOT part of residue_total (these lines WERE rewritten) ---
prose_review_flags: 7

# --- criterion 3 as measured at STAGE 1 (superseded by the s2_ keys above; renamed
#     s1_ so the mid-sweep record survives without colliding with the closed state) ---
review_tag_occurrences: 0
s1_todo_occurrences: 65
s1_todo_files: 49
todo_authorised_for_deletion: false
s1_criterion_3_closed: false
s1_assert_clean_exit: 1
s1_gate_rows_failing: 8

# --- gates after the apply, against 151-BASELINE.md ---
lint_check: green
lint_errors: 0
lint_warnings: 20
format_check: red
format_check_files: 2
test_unit: green
unit_tests_passed: 1522
unit_test_files: 149
build: green
build_tasks: 14
gates_no_worse_than_baseline: true

residue_tsv: .planning/phases/151-ship-v0-2-akita-review-stack/151-hygiene-residue.tsv
prose_queue_tsv: .planning/phases/151-ship-v0-2-akita-review-stack/151-hygiene-prose-queue.tsv
summary_json: .planning/phases/151-ship-v0-2-akita-review-stack/151-hygiene-summary.json
---

# Phase 151 — Comment-Hygiene Report, Stage 1

**Criterion 3 is NOT closed by this report.** Stage 1 removed the deterministic 79 % of the
surface. Stage 2 — plan 151-08's file-by-file agent pass — owns the remaining 528 occurrences,
and until it lands, `hygiene-grep-report.sh --assert-clean` still exits **1** on **8 of 9**
gate rows. Read § What 151-08 still owes before quoting any number here as a result.

Every figure below carries the command that produced it, per the standing rule of this phase
that a value without a command is an assumption.

---

## Before and after — same script, same scope, same pattern set

Both tables are `hygiene-grep-report.sh` with the pathspec `-- apps/ packages/ tests/`
(`CLAUDE.md`, `.agents/`, `.claude/`, `.planning/` exempt per D-15). The `base` and `delta`
columns come from `151-hygiene-baseline.tsv`, written by plan 151-03's `--save-baseline` run,
so the two runs are comparable **by construction** rather than by assertion.

### Before (plan 151-03, pre-codemod)

```
  pattern               occ   files    bare  expect     verdict
  -----------------  ------  ------  ------  ---------  -------
  phase-ref             704     241     700  bare = 0   FAIL
  spike-ref              41      30      41  bare = 0   FAIL
  decision-id-long      185      44       -  occ = 0    FAIL
  decision-id-bare      540     162       -  occ = 0    FAIL
  section-anchor        219     100       -  occ = 0    FAIL
  planning-path          27      23       -  occ = 0    FAIL
  plan-number           105      56       -  occ = 0    FAIL
  milestone-ver          45      30       -  -          REPORT
  task-id               535     199       -  occ = 0    FAIL

  planning-reference total (8 rows) : 1866
  task-id supplementary             : 535
  union files touched by any row    : 366
```

### After (this plan, post-codemod)

```
$ .planning/phases/151-ship-v0-2-akita-review-stack/scripts/hygiene-grep-report.sh \
    .planning/phases/151-ship-v0-2-akita-review-stack/151-hygiene-baseline.tsv

  pattern               occ   files    bare  expect     verdict    base    delta
  -----------------  ------  ------  ------  ---------  -------  ------  -------
  phase-ref             704     241     154  bare = 0   FAIL        704        0
  spike-ref              41      30       5  bare = 0   FAIL         41        0
  decision-id-long       49      20       -  occ = 0    FAIL        185     -136
  decision-id-bare       47      24       -  occ = 0    FAIL        540     -493
  section-anchor         70      54       -  occ = 0    FAIL        219     -149
  planning-path           5       2       -  occ = 0    FAIL         27      -22
  plan-number             2       1       -  occ = 0    FAIL        105     -103
  milestone-ver          45      30       -  -          REPORT       45        0
  task-id                84      46       -  occ = 0    FAIL        535     -451

  planning-reference total (8 rows) : 963
  task-id supplementary             : 84
  union files touched by any row    : 295
```

**Read the survivor rows on `bare`, not on `occ`.** `phase-ref` shows `delta 0` because
collapsing `Phase 88` to `see phase 88` does not remove the words `phase 88` — it prefixes
them. The baseline TSV stores only `occ`, so the script cannot compute a `bare` delta; here it
is, measured directly:

| Survivor row | bare before | bare after | delta |
|---|---:|---:|---:|
| `phase-ref` | 700 | **154** | −546 |
| `spike-ref` | 41 | **5** | −36 |

```
$ git grep -I -h -o -P '(?i)(?<!see\s)\bphases?\s+\d+'      -- apps/ packages/ tests/ | wc -l   # 154
$ git grep -I -h -o -P '(?i)(?<!see\s)\bspikes?[\s\-/]\d+'  -- apps/ packages/ tests/ | wc -l   # 5
$ git grep -I -h -o -P '(?i)\bsee (phase|spike) \d+'        -- apps/ packages/ tests/ | wc -l   # 586
```

The collapsed pointer form went from **4 occurrences in 3 files** (the baseline floor D-14
authorises, not zero) to **586**. 550 phase pointers + 36 spike pointers = 586, and
154 + 550 = 704 = the unchanged `phase-ref` occurrence count. The arithmetic closes.

---

## What the codemod actually did

```
$ node .planning/phases/151-ship-v0-2-akita-review-stack/scripts/hygiene-codemod.mjs --apply
```

| | |
|---|---:|
| Files scanned | 1788 |
| Files rewritten | 346 |
| Comment lines deleted as degenerate (rule 7) | 11 |
| Occurrences found | 2513 |
| — rewritten (hits) | 1985 |
| — reported, not rewritten (residue) | 528 |
| Overlapping occurrences absorbed by an earlier rule | 222 |

| Rule | Hits |
|---|---:|
| 1 `artifact-path` | 67 |
| 2 `section-anchor` (numeric-leading only) | 149 |
| 3 `plan-number` | 103 |
| 4a `decision-id-long` | 136 |
| 4b `decision-id-bare` | 493 |
| 4c `task-id` | 451 |
| 5 `milestone-version` | **disabled** — 37 routed to residue (Pitfall 6) |
| 6a `phase-ref` collapse | 550 |
| 6b `spike-ref` collapse | 36 |
| **total** | **1985** |

`hits + residue == total` is asserted on every run and the process exits non-zero if it does
not hold. It held: 1985 + 528 = 2513.

**These figures come from one pattern set.** The original apply run used a slightly earlier
pattern set (residue 522, total 2507). After the exhaustiveness fix described under § The
silent-drop class, the final codemod was re-run against the pre-apply tree in a temporary
detached worktree to produce the numbers above. The two runs rewrite **byte-identically** —
the fix touched only a residue rule, which never writes — so the applied tree is the same
tree either way.

### The four institutionalised examples, before and after

`151-CONTEXT.md` names four sites the codemod was expected to hit. All four were hit, and none
was deleted outright or left untouched.

| Site | Before | After |
|---|---|---|
| `voterContext.svelte.ts:80` | `// QUESTION-04 follow-up (Phase 61-03 voter-side parallel fix):` | `// follow-up (see phase 61 voter-side parallel fix):` |
| `voterContext.svelte.ts:82` | ``// documented at .planning/phases/61-voter-app-question-flow/61-03-DIAGNOSIS.md.`` | `// documented.` |
| `dataContext.svelte.ts:16` | ``* 020-023; see `.planning/spikes/CONTEXT-MEMBER-AUDIT.md` + CONVENTIONS §17-22).`` | `* 020-023; see CONVENTIONS).` |
| `EntityInfo.svelte:49` | ``// .planning/spikes/CONVENTIONS.md §9 (Spike-024). Phase 117 COLD-01.`` | `// (see spike 024). see phase 117.` |
| `etPl.ts:3` | `* (short-name alias of …, introduced by Phase 88 Plan 88-02` | `* (short-name alias of …, introduced by Phase 88` |

The `etPl.ts` row is the attributive case: `Plan 88-02` was stripped, and `by Phase 88` was
**deliberately not collapsed** — see the next section.

---

## Why 108 phase and spike references were not collapsed

D-14's `see phase N` form is correct in **citation** position and wrong in **attributive**
position. `Mirrors the Phase 64 fix` would have become `Mirrors the see phase 64 fix`;
`went bare in Phase 113 FLATTEN-02` would have become `went bare in see phase 113`.

```
$ git grep -I -h -o -P '(?i)\b(the|a|an|in|at|by|per|of|to|for|with|from|during|between|within|through|since|until|this|that|these|those|and|or)\s+phases?\s+\d+' -- apps/ packages/ tests/ | wc -l
113                                  # of 704 phase references, i.e. 16 %
```

Rewriting those mechanically would have replaced one kind of noise with a **more embarrassing**
kind — the sweep exists to make this code read well to an outside reviewer, and 113 lines of
`the see phase 64 fix` would defeat that more thoroughly than the citations they replaced. So a
reference immediately preceded by an article or preposition is **reported, not collapsed**, and
rewording it — which needs a sentence, not a regex — is plan 151-08's work.

**This is a deliberate, costed deviation from this plan's own must-have** *"surviving phase and
spike references appear only in the collapsed short-pointer form"*. That must-have is not true
at the end of Stage 1 and this record says so rather than letting the number pass unremarked.
The consequence is stated in one line: **the `phase-ref` and `spike-ref` gate rows are still
red, and only 151-08 can turn them green.**

---

## The silent-drop class — found by reconciliation, not by the report's own arithmetic

Threat **T-151-07-03** is "residue silently dropped". It fired, and was caught.

Six occurrences of the form `§"Seeding local data"` matched **neither** the numeric strip rule
(`§` then a digit) **nor** the alphabetic residue rule (`§` then a letter), because a double
quote is neither. They were not rewritten and were reported by nobody — and the codemod's
internal `hits + residue == total` check could not see it, because an occurrence no pattern
matches is not in `total` either.

It was caught by reconciling the residue table against a raw `git grep` for each gate row. The
residue pattern now ends in a bare `/§/`, making the set **exhaustive** over the sign. The
reconciliation is reproducible and now reports zero unattributed occurrences on all nine rows:

| Gate row | occurrences remaining | unattributed |
|---|---:|---:|
| `phase-ref` (bare) | 154 | **0** |
| `spike-ref` (bare) | 5 | **0** |
| `decision-id-long` | 49 | **0** |
| `decision-id-bare` | 47 | **0** |
| `section-anchor` | 70 | **0** |
| `planning-path` | 5 | **0** |
| `plan-number` | 2 | **0** |
| `milestone-ver` | 45 | **0** |
| `task-id` | 84 | **0** |

**Every remaining occurrence of every gate pattern appears in the residue table below.** That
is the property plan 151-08 depends on, and it is measured rather than asserted.

---

## Measured, not assumed

### Review-tagged comments — criterion 3's second clause

```
$ git grep -I -o -P '\[PR review\]' -- apps/ packages/ tests/ | wc -l
0
```

**0, still.** C-7 said this clause was already satisfied at baseline; it is satisfied after the
codemod too, and this line is the record that the no-op was *measured* on both sides rather
than inherited. Nothing in this plan could have introduced one, but "nothing could have" is not
a measurement.

### The TODO class — sized, untouched, still an open operator question

```
$ git grep -I -o -P '\b(TODO|FIXME|HACK|XXX)\b' -- apps/ packages/ tests/ | wc -l   # 65
$ git grep -I -l -P '\b(TODO|FIXME|HACK|XXX)\b' -- apps/ packages/ tests/ | wc -l   # 49
```

**65 occurrences across 49 files — unchanged from baseline, by design.** D-14 covers *planning
references*; a `TODO` is a statement about the code's future, not a leaked artifact of how it
was planned, and deleting one would destroy information no other record holds. The codemod
scans for them **only** so that they are provably reported rather than silently ignored: all 60
that sit inside comment spans appear in the residue table under `todo-class`. (60 of 65 — the
other five are in Markdown files and are reported under `markdown-file`.)

**This class is not authorised for deletion or rewriting by any plan in this phase.** Plan
151-08 puts the question to the operator. `-I` is load-bearing on both greps: without it the
same commands return 71/55, the extra six being `XXX` byte sequences inside binary PNGs.

---

## Gates after the apply — all no worse than baseline

| Gate | Baseline (`151-BASELINE.md`) | After the apply | Verdict |
|---|---|---|---|
| `yarn build` | green | **14/14 tasks** | same |
| `yarn test:unit` | green, **1522** passed / **149** files | green, **1522** passed / **149** files | **identical** |
| `yarn lint:check` | 0 errors / 20 warnings | **0 errors / 20 warnings** (`TURBO_FORCE=1`) | **identical** |
| `yarn format:check` | red on 2 files | red on **exactly those 2 files** | same |

The two format-red files are `packages/dev-seed/src/templates/e2e/perm/perm-bankauth-notloc.ts`
and `tests/README.md`. **PD-03 fences both out of D-05's fix bar**, so they were left alone.

`yarn format` was deliberately **not** run, which is a documented deviation from the plan's
action text. The reason is evidence, not preference:

```
$ npx prettier --check <all 346 changed files>
[warn] packages/dev-seed/src/templates/e2e/perm/perm-bankauth-notloc.ts
```

One warning, on the one file that was **already** prettier-dirty at baseline. The sweep
introduced no formatting debt, so `yarn format` had nothing to fix in the changed set — and
running it would have "fixed" the two PD-03-fenced files this phase is not allowed to touch.

### The diff is comment-only, and that is checked rather than claimed

3053 changed diff lines. 27 changed lines do not begin with a comment opener; every one of them
is still inside a comment span, in exactly two shapes:

- **trailing comments on an unchanged code line** — `let scsMaxOverride: number | undefined; // …`
  and three `expect(spy).toHaveBeenCalledTimes(n); // …` lines. The text before `//` is
  byte-identical.
- **interior lines of a block comment** — `<!--@component … -->` markdown docblocks in the
  results and questions layouts, and JSDoc continuation lines that carry no opener because the
  block opened earlier.

No program text changed. Re-running the codemod now reports `Files rewritten: 0`, so the pass is
a fixed point and the applied commit is idempotent by construction.

---

## Prose-review queue — 7 lines that were rewritten and still need a human

These are **not** residue: the reference is gone, which is what criterion 3 asks for. But a
mid-sentence removal left grammatical rubble no mechanical repair can reason about, so the
codemod prints and counts them. A flag here is a request for a sentence, not a defect in the
rewrite. Machine-readable copy: `151-hygiene-prose-queue.tsv`.

| File | Line | Now reads |
|---|---:|---|
| `tests/tests/setup/shared/setupFromTemplate.ts` | 186 | `//     see and assertTeardown.ts's RATIONALE docblock.` |
| `tests/tests/fixtures/voter/voter-journey.fixture.ts` | 128 | `* resolved either way. See for the trace.` |
| `packages/dev-seed/tests/pipeline.test.ts` | 7 | `*     default to 0 rows per per-generator defaults; the seven` |
| `apps/frontend/src/routes/(voters)/(located)/results/[[electionTab]]/+layout.svelte` | 13 | `` `entityTab` / `entity` / `id`. As of the *selected* election `` |
| `apps/frontend/src/lib/contexts/filter/filterContext.svelte.ts` | 29 | `* Per the version-bridge is KEPT verbatim — it does NOT simplify away.` |
| `apps/frontend/src/lib/components/tabs/Tabs.svelte` | 61 | `resolve the baselined violations. See §Latent Risk` |
| `apps/frontend/src/lib/_guards/eslint-store-guard.test.ts` | 16 | `* AND that it stays SILENT on clean rune code. Per the guard config is` |

---

## What 151-08 still owes — criterion 3 clause by clause

`hygiene-grep-report.sh --assert-clean` exits **1** with **8 of 9** gate rows red. Clause by
clause:

| Criterion-3 clause | Status after Stage 1 | Owed by |
|---|---|---|
| No `[PR review]` tags survive | **SATISFIED** — measured 0 before and after | *(no-op, recorded)* |
| `.planning/` artifact paths at zero | **NOT MET** — 5 remain | 151-08 |
| `Plan NN-NN` at zero | **NOT MET** — 2 remain | 151-08 |
| `§` section anchors at zero | **NOT MET** — 70 remain | 151-08 |
| `D-NN(-NN)` decision IDs at zero | **NOT MET** — 96 remain | 151-08 |
| Task IDs at zero | **NOT MET** — 84 remain | 151-08 |
| Every surviving phase/spike ref in `see …` form | **NOT MET** — 159 bare remain | 151-08 |
| `v2.NN` milestone tags | **REPORT-ONLY** by design (Pitfall 6) — 45 remain | 151-08 |

### The two clauses this plan's own acceptance criteria demand at zero, and are not

This plan's Task 3 acceptance criteria assert that `.planning/` and `Plan NN-NN` return **no
matches**. They do not, and the reason is a contradiction inside the plan itself, not a failure
to run the codemod: C-6 routes **Markdown files whole** to the agent pass ("prose end to end"),
and the residual occurrences are all in Markdown or in string literals.

| Path | Line | Text | Why it survived |
|---|---:|---|---|
| `apps/frontend/eslint.config.mjs` | 95 | `… See .planning/v2.11-DECISIONS.md K1.` | inside an ESLint rule `message:` string — a **program** string, explicitly named in RESEARCH's Stage-2 residue set |
| `packages/dev-seed/README.md` | 240, 301, 303, 305 | four `.planning/phases/…` paths | Markdown; deleting the path leaves *"see for semantics"* |
| `tests/IDURA-TEST-RUNBOOK.md` | 287, 296 | `plan 122-03`, `plan 122-05` | Markdown prose |

Neither class can be fixed by a comment-span codemod without violating the guarantee that makes
the codemod safe. Both are in the residue table below, and **151-08 must close them** or record
why they stay. They are named here so no one can read this Stage-1 report as if criterion 3
were closed.

### Known limits of the mechanical pass, recorded so 151-08 does not rediscover them

1. **Line-wrapped references are invisible to every count.** `dataContext.svelte.ts:15-16`
   reads `… proof, Spikes` / `* 020-023; …` — the word and its number are on different lines,
   so neither the codemod nor `git grep` (both line-based) sees a reference at all. It is
   therefore in no table in this document. There may be others.
2. **`Plan 02` and similar short plan forms are not in the pattern set.** `Phase 89 Plan 02`
   collapses to `see phase 89 Plan 02`; only `Plan NN-NN` is matched. Not a gate failure,
   because no gate row covers it — which is exactly why it is written down here.
3. **The `task-id` row can never reach zero mechanically.** Live Playwright test *titles* carry
   the same identifiers (`test.describe('perm-interactive-info (EPERM-07)')`), and a
   string-literal rewrite is forbidden. 78 of the 84 survivors are exactly this.

---

## Residue table — plan 151-08's work queue

**528 rows, one per occurrence the codemod declined to rewrite.** Path, line number (in the
tree as it stands *after* the apply), matched text, and reason. Machine-readable copy, with the
originating rule as a fourth column: `151-hygiene-residue.tsv`.

A residue item absent from this table will be reviewed by nobody — which is why the
reconciliation above exists, and why `residue_total` in the frontmatter is asserted equal to
this table's row count.

Reasons, and what each one asks of the agent pass:

| Reason | Rows | What it means |
|---|---:|---|
| `not-a-comment-span` | 202 | The occurrence is in program text — a runtime string, a test title, an ESLint message, an XML attribute. **Rewriting it changes behaviour.** Judge each one individually. |
| `attributive-reference` | 108 | The `see …` form is ungrammatical here. Reword the sentence or drop the reference. |
| `unstrippable-section-anchor` | 66 | A titled anchor (`§Context Destructuring Rule`, `§"Seeding local data"`) with no mechanical end boundary. |
| `todo-class` | 60 | **NOT authorised for deletion.** Reported only so it is visible. Put the disposition question to the operator. |
| `markdown-file` | 45 | Markdown is prose end to end (C-6); the comment-span safety argument does not apply. |
| `milestone-version` | 37 | `v\d+\.\d+` matches `Yarn 4.13` and `Svelte 5` as readily as `v2.11` (Pitfall 6). Report-only by decision. |
| `ambiguous-reference` | 10 | `# PHASE 1: JSONB Schema` is a benchmark stage marker; `spike-009-store-codemod.mjs` is a filename. Neither is a planning citation. |

### `not-a-comment-span` — 202 rows

| # | Path | Line | Matched text | Rule |
|---:|---|---:|---|---|
| 1 | `apps/frontend/eslint.config.mjs` | 95 | `v2.11` | `milestone-ver` |
| 2 | `apps/frontend/eslint.config.mjs` | 95 | `.planning/v2.11-DECISIONS.md` | `artifact-path` |
| 3 | `apps/frontend/ios/App/App/Base.lproj/Main.storyboard` | 2 | `BYZ-38` | `task-id` |
| 4 | `apps/frontend/ios/App/App/Base.lproj/Main.storyboard` | 14 | `BYZ-38` | `task-id` |
| 5 | `apps/frontend/scripts/flatten-current-codemod.mjs` | 200 | `PHASE 113` | `phase-ref` |
| 6 | `apps/frontend/scripts/store-to-state-codemod.mjs` | 162 | `PHASE 114` | `phase-ref` |
| 7 | `apps/frontend/src/lib/_guards/eslint-store-guard.test.ts` | 39 | `RUNES-03` | `task-id` |
| 8 | `apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.test.ts` | 1630 | `Phase 64` | `phase-ref` |
| 9 | `apps/frontend/src/lib/api/adapters/supabase/utils/toDataObject.test.ts` | 76 | `D-05` | `decision-id-bare` |
| 10 | `apps/frontend/src/lib/api/utils/auth/providers/idura.test.ts` | 77 | `D-04` | `decision-id-bare` |
| 11 | `apps/frontend/src/lib/api/utils/auth/providers/signicat.test.ts` | 41 | `D-04` | `decision-id-bare` |
| 12 | `apps/frontend/src/lib/api/utils/auth/providers/signicat.test.ts` | 68 | `D-09` | `decision-id-bare` |
| 13 | `apps/frontend/src/lib/api/utils/auth/providers/signicat.test.ts` | 68 | `D-10` | `decision-id-bare` |
| 14 | `apps/frontend/src/lib/contexts/app/tracking/trackingService.svelte.test.ts` | 143 | `Phase 107` | `phase-ref` |
| 15 | `apps/frontend/src/lib/contexts/candidate/candidateContext.svelte.test.ts` | 103 | `RUNES-05` | `task-id` |
| 16 | `apps/frontend/src/lib/contexts/filter/filterContext.svelte.ts` | 130 | `Phase 62` | `phase-ref` |
| 17 | `apps/frontend/src/lib/contexts/filter/filterContext.svelte.ts` | 130 | `D-06` | `decision-id-bare` |
| 18 | `apps/frontend/src/lib/contexts/filter/filterContext.svelte.ts` | 135 | `Phase 62` | `phase-ref` |
| 19 | `apps/frontend/src/lib/contexts/filter/filterContext.svelte.ts` | 135 | `D-06` | `decision-id-bare` |
| 20 | `apps/frontend/src/lib/i18n/tests/translations.test.ts` | 218 | `CLEAN-04` | `task-id` |
| 21 | `apps/frontend/src/lib/utils/matching/imputeParentAnswers.test.ts` | 210 | `Phase 69` | `phase-ref` |
| 22 | `apps/supabase/benchmarks/scripts/run-concurrency-scaling.sh` | 77 | `PHASE 1` | `phase-ref` |
| 23 | `apps/supabase/benchmarks/scripts/run-concurrency-scaling.sh` | 114 | `PHASE 2` | `phase-ref` |
| 24 | `apps/supabase/supabase/functions/identity-callback/index.ts` | 27 | `v5.9` | `milestone-ver` |
| 25 | `packages/data/src/objects/questions/variants/multipleChoiceCategoricalQuestion.test.ts` | 28 | `D-06` | `decision-id-bare` |
| 26 | `packages/data/src/objects/questions/variants/multipleChoiceCategoricalQuestion.test.ts` | 66 | `D-07` | `decision-id-bare` |
| 27 | `packages/dev-seed/src/cli/teardown-help.ts` | 34 | `D-58-17` | `decision-id-long` |
| 28 | `packages/dev-seed/src/generators/AccountsGenerator.ts` | 48 | `D-11` | `decision-id-bare` |
| 29 | `packages/dev-seed/src/generators/FeedbackGenerator.ts` | 65 | `Phase 56` | `phase-ref` |
| 30 | `packages/dev-seed/src/generators/NominationsGenerator.ts` | 174 | `D-06` | `decision-id-bare` |
| 31 | `packages/dev-seed/src/generators/ProjectsGenerator.ts` | 48 | `D-11` | `decision-id-bare` |
| 32 | `packages/dev-seed/src/templates/_helpers/buildMinimal.test.ts` | 170 | `D-16` | `decision-id-bare` |
| 33 | `packages/dev-seed/src/templates/_helpers/buildMinimal.test.ts` | 177 | `D-16` | `decision-id-bare` |
| 34 | `packages/dev-seed/src/templates/_helpers/buildMinimal.test.ts` | 183 | `D-16` | `decision-id-bare` |
| 35 | `packages/dev-seed/src/writer.ts` | 196 | `Phase 56` | `phase-ref` |
| 36 | `packages/dev-seed/src/writer.ts` | 197 | `Phase 58` | `phase-ref` |
| 37 | `packages/dev-seed/tests/assets.test.ts` | 25 | `GEN-10` | `task-id` |
| 38 | `packages/dev-seed/tests/assets.test.ts` | 29 | `D-58-05` | `decision-id-long` |
| 39 | `packages/dev-seed/tests/cli/allowedTeardownTables.test.ts` | 75 | `Phase 140` | `phase-ref` |
| 40 | `packages/dev-seed/tests/cli/help.test.ts` | 8 | `CLI-04` | `task-id` |
| 41 | `packages/dev-seed/tests/cli/help.test.ts` | 8 | `D-58-13` | `decision-id-long` |
| 42 | `packages/dev-seed/tests/cli/summary.test.ts` | 8 | `D-58-14` | `decision-id-long` |
| 43 | `packages/dev-seed/tests/cli/teardown.test.ts` | 100 | `Phase 58` | `phase-ref` |
| 44 | `packages/dev-seed/tests/cli/teardown.test.ts` | 248 | `CLI-03` | `task-id` |
| 45 | `packages/dev-seed/tests/cli/teardown.test.ts` | 248 | `D-58-07` | `decision-id-long` |
| 46 | `packages/dev-seed/tests/cli/teardown.test.ts` | 248 | `D-58-17` | `decision-id-long` |
| 47 | `packages/dev-seed/tests/cli/teardown.test.ts` | 406 | `CLI-04` | `task-id` |
| 48 | `packages/dev-seed/tests/cli/teardown.test.ts` | 406 | `D-58-13` | `decision-id-long` |
| 49 | `packages/dev-seed/tests/cli/teardown.test.ts` | 428 | `D-58-17` | `decision-id-long` |
| 50 | `packages/dev-seed/tests/determinism.test.ts` | 18 | `TMPL-08` | `task-id` |
| 51 | `packages/dev-seed/tests/determinism.test.ts` | 93 | `Phase 56` | `phase-ref` |
| 52 | `packages/dev-seed/tests/generators/AccountsGenerator.test.ts` | 13 | `D-11` | `decision-id-bare` |
| 53 | `packages/dev-seed/tests/generators/AlliancesGenerator.test.ts` | 23 | `GEN-04` | `task-id` |
| 54 | `packages/dev-seed/tests/generators/AlliancesGenerator.test.ts` | 29 | `GEN-04` | `task-id` |
| 55 | `packages/dev-seed/tests/generators/AppSettingsGenerator.test.ts` | 41 | `GEN-04` | `task-id` |
| 56 | `packages/dev-seed/tests/generators/CandidatesGenerator.test.ts` | 46 | `GEN-04` | `task-id` |
| 57 | `packages/dev-seed/tests/generators/CandidatesGenerator.test.ts` | 89 | `D-27` | `decision-id-bare` |
| 58 | `packages/dev-seed/tests/generators/CandidatesGenerator.test.ts` | 106 | `D-27` | `decision-id-bare` |
| 59 | `packages/dev-seed/tests/generators/CandidatesGenerator.test.ts` | 106 | `Phase 57` | `phase-ref` |
| 60 | `packages/dev-seed/tests/generators/CandidatesGenerator.test.ts` | 132 | `D-57` | `decision-id-bare` |
| 61 | `packages/dev-seed/tests/generators/CandidatesGenerator.test.ts` | 152 | `Phase 56` | `phase-ref` |
| 62 | `packages/dev-seed/tests/generators/CandidatesGenerator.test.ts` | 170 | `D-57-20` | `decision-id-long` |
| 63 | `packages/dev-seed/tests/generators/CandidatesGenerator.test.ts` | 203 | `D-57-20` | `decision-id-long` |
| 64 | `packages/dev-seed/tests/generators/CandidatesGenerator.test.ts` | 234 | `D-57-20` | `decision-id-long` |
| 65 | `packages/dev-seed/tests/generators/ConstituenciesGenerator.test.ts` | 19 | `GEN-04` | `task-id` |
| 66 | `packages/dev-seed/tests/generators/ConstituenciesGenerator.test.ts` | 25 | `GEN-04` | `task-id` |
| 67 | `packages/dev-seed/tests/generators/ConstituencyGroupsGenerator.test.ts` | 19 | `GEN-04` | `task-id` |
| 68 | `packages/dev-seed/tests/generators/ConstituencyGroupsGenerator.test.ts` | 25 | `GEN-04` | `task-id` |
| 69 | `packages/dev-seed/tests/generators/ElectionsGenerator.test.ts` | 26 | `GEN-04` | `task-id` |
| 70 | `packages/dev-seed/tests/generators/ElectionsGenerator.test.ts` | 32 | `GEN-04` | `task-id` |
| 71 | `packages/dev-seed/tests/generators/FactionsGenerator.test.ts` | 23 | `GEN-04` | `task-id` |
| 72 | `packages/dev-seed/tests/generators/FactionsGenerator.test.ts` | 29 | `GEN-04` | `task-id` |
| 73 | `packages/dev-seed/tests/generators/NominationsGenerator.test.ts` | 44 | `GEN-08` | `task-id` |
| 74 | `packages/dev-seed/tests/generators/NominationsGenerator.test.ts` | 51 | `GEN-08` | `task-id` |
| 75 | `packages/dev-seed/tests/generators/NominationsGenerator.test.ts` | 58 | `GEN-08` | `task-id` |
| 76 | `packages/dev-seed/tests/generators/NominationsGenerator.test.ts` | 92 | `§9` | `section-anchor` |
| 77 | `packages/dev-seed/tests/generators/NominationsGenerator.test.ts` | 104 | `GEN-04` | `task-id` |
| 78 | `packages/dev-seed/tests/generators/OrganizationsGenerator.test.ts` | 18 | `GEN-04` | `task-id` |
| 79 | `packages/dev-seed/tests/generators/OrganizationsGenerator.test.ts` | 24 | `GEN-04` | `task-id` |
| 80 | `packages/dev-seed/tests/generators/OrganizationsGenerator.test.ts` | 52 | `Phase 56` | `phase-ref` |
| 81 | `packages/dev-seed/tests/generators/OrganizationsGenerator.test.ts` | 52 | `§4.8` | `section-anchor` |
| 82 | `packages/dev-seed/tests/generators/ProjectsGenerator.test.ts` | 13 | `D-11` | `decision-id-bare` |
| 83 | `packages/dev-seed/tests/generators/QuestionCategoriesGenerator.test.ts` | 19 | `GEN-04` | `task-id` |
| 84 | `packages/dev-seed/tests/generators/QuestionCategoriesGenerator.test.ts` | 25 | `GEN-04` | `task-id` |
| 85 | `packages/dev-seed/tests/generators/QuestionsGenerator.test.ts` | 23 | `GEN-04` | `task-id` |
| 86 | `packages/dev-seed/tests/generators/QuestionsGenerator.test.ts` | 29 | `GEN-04` | `task-id` |
| 87 | `packages/dev-seed/tests/integration/default-template.integration.test.ts` | 200 | `D-58-20` | `decision-id-long` |
| 88 | `packages/dev-seed/tests/latent/centroids.test.ts` | 33 | `D-57-03` | `decision-id-long` |
| 89 | `packages/dev-seed/tests/latent/centroids.test.ts` | 33 | `D-57-05` | `decision-id-long` |
| 90 | `packages/dev-seed/tests/latent/centroids.test.ts` | 63 | `D-57-05` | `decision-id-long` |
| 91 | `packages/dev-seed/tests/latent/centroids.test.ts` | 81 | `D-57-05` | `decision-id-long` |
| 92 | `packages/dev-seed/tests/latent/clustering.integration.test.ts` | 94 | `D-57-17` | `decision-id-long` |
| 93 | `packages/dev-seed/tests/latent/clustering.integration.test.ts` | 94 | `D-57-18` | `decision-id-long` |
| 94 | `packages/dev-seed/tests/latent/dimensions.test.ts` | 19 | `D-57-01` | `decision-id-long` |
| 95 | `packages/dev-seed/tests/latent/dimensions.test.ts` | 19 | `D-57-02` | `decision-id-long` |
| 96 | `packages/dev-seed/tests/latent/gaussian.test.ts` | 61 | `D-57-11` | `decision-id-long` |
| 97 | `packages/dev-seed/tests/latent/latentEmitter.test.ts` | 57 | `D-57-13` | `decision-id-long` |
| 98 | `packages/dev-seed/tests/latent/latentEmitter.test.ts` | 57 | `D-57-14` | `decision-id-long` |
| 99 | `packages/dev-seed/tests/latent/latentEmitter.test.ts` | 63 | `D-57-13` | `decision-id-long` |
| 100 | `packages/dev-seed/tests/latent/latentEmitter.test.ts` | 99 | `D-57-14` | `decision-id-long` |
| 101 | `packages/dev-seed/tests/latent/latentEmitter.test.ts` | 114 | `D-57-14` | `decision-id-long` |
| 102 | `packages/dev-seed/tests/latent/loadings.test.ts` | 42 | `D-57-06` | `decision-id-long` |
| 103 | `packages/dev-seed/tests/latent/loadings.test.ts` | 42 | `D-57-07` | `decision-id-long` |
| 104 | `packages/dev-seed/tests/latent/loadings.test.ts` | 63 | `Phase 56` | `phase-ref` |
| 105 | `packages/dev-seed/tests/latent/loadings.test.ts` | 90 | `D-57-07` | `decision-id-long` |
| 106 | `packages/dev-seed/tests/latent/positions.test.ts` | 23 | `D-57-04` | `decision-id-long` |
| 107 | `packages/dev-seed/tests/latent/positions.test.ts` | 38 | `D-57-04` | `decision-id-long` |
| 108 | `packages/dev-seed/tests/latent/positions.test.ts` | 83 | `D-57-04` | `decision-id-long` |
| 109 | `packages/dev-seed/tests/latent/project.test.ts` | 145 | `D-57-09` | `decision-id-long` |
| 110 | `packages/dev-seed/tests/latent/spread.test.ts` | 20 | `D-57-04` | `decision-id-long` |
| 111 | `packages/dev-seed/tests/locales.test.ts` | 19 | `TMPL-07` | `task-id` |
| 112 | `packages/dev-seed/tests/pipeline.test.ts` | 41 | `TMPL-02` | `task-id` |
| 113 | `packages/dev-seed/tests/pipeline.test.ts` | 63 | `D-25` | `decision-id-bare` |
| 114 | `packages/dev-seed/tests/pipeline.test.ts` | 70 | `D-25` | `decision-id-bare` |
| 115 | `packages/dev-seed/tests/pipeline.test.ts` | 88 | `D-08` | `decision-id-bare` |
| 116 | `packages/dev-seed/tests/pipeline.test.ts` | 198 | `D-06` | `decision-id-bare` |
| 117 | `packages/dev-seed/tests/pipeline.test.ts` | 223 | `GEN-08` | `task-id` |
| 118 | `packages/dev-seed/tests/supabaseAdminClient.test.ts` | 127 | `Phase 58` | `phase-ref` |
| 119 | `packages/dev-seed/tests/template.test.ts` | 22 | `TMPL-02` | `task-id` |
| 120 | `packages/dev-seed/tests/template.test.ts` | 22 | `D-18` | `decision-id-bare` |
| 121 | `packages/dev-seed/tests/template.test.ts` | 27 | `TMPL-09` | `task-id` |
| 122 | `packages/dev-seed/tests/template.test.ts` | 31 | `TMPL-09` | `task-id` |
| 123 | `packages/dev-seed/tests/template.test.ts` | 35 | `TMPL-09` | `task-id` |
| 124 | `packages/dev-seed/tests/template.test.ts` | 79 | `TMPL-07` | `task-id` |
| 125 | `packages/dev-seed/tests/template.test.ts` | 84 | `TMPL-07` | `task-id` |
| 126 | `packages/dev-seed/tests/template.test.ts` | 89 | `TMPL-07` | `task-id` |
| 127 | `packages/dev-seed/tests/template.test.ts` | 95 | `TMPL-07` | `task-id` |
| 128 | `packages/dev-seed/tests/template.test.ts` | 95 | `TMPL-02` | `task-id` |
| 129 | `packages/dev-seed/tests/template/latent.schema.test.ts` | 29 | `D-57-21` | `decision-id-long` |
| 130 | `packages/dev-seed/tests/template/latent.schema.test.ts` | 30 | `Phase 56` | `phase-ref` |
| 131 | `packages/dev-seed/tests/template/latent.schema.test.ts` | 42 | `D-57-02` | `decision-id-long` |
| 132 | `packages/dev-seed/tests/template/latent.schema.test.ts` | 52 | `TMPL-09` | `task-id` |
| 133 | `packages/dev-seed/tests/templates/base.test.ts` | 114 | `D-58-16` | `decision-id-long` |
| 134 | `packages/dev-seed/tests/templates/default.test.ts` | 142 | `D-58-03` | `decision-id-long` |
| 135 | `packages/dev-seed/tests/templates/default.test.ts` | 143 | `D-15` | `decision-id-bare` |
| 136 | `packages/dev-seed/tests/templates/default.test.ts` | 151 | `D-15` | `decision-id-bare` |
| 137 | `packages/dev-seed/tests/templates/default.test.ts` | 231 | `D-58-04` | `decision-id-long` |
| 138 | `packages/dev-seed/tests/templates/default.test.ts` | 235 | `D-58-01` | `decision-id-long` |
| 139 | `packages/dev-seed/tests/templates/default.test.ts` | 240 | `D-58-02` | `decision-id-long` |
| 140 | `packages/dev-seed/tests/templates/default.test.ts` | 244 | `D-58-02` | `decision-id-long` |
| 141 | `packages/dev-seed/tests/templates/default.test.ts` | 248 | `Phase 64` | `phase-ref` |
| 142 | `packages/dev-seed/tests/templates/default.test.ts` | 252 | `D-58-02` | `decision-id-long` |
| 143 | `packages/dev-seed/tests/templates/default.test.ts` | 256 | `D-58-02` | `decision-id-long` |
| 144 | `packages/dev-seed/tests/templates/default.test.ts` | 256 | `D-15` | `decision-id-bare` |
| 145 | `packages/dev-seed/tests/templates/default.test.ts` | 260 | `Phase 64` | `phase-ref` |
| 146 | `packages/dev-seed/tests/writer.test.ts` | 132 | `D-15` | `decision-id-bare` |
| 147 | `packages/dev-seed/tests/writer.test.ts` | 137 | `D-15` | `decision-id-bare` |
| 148 | `packages/dev-seed/tests/writer.test.ts` | 184 | `D-11` | `decision-id-bare` |
| 149 | `packages/dev-seed/tests/writer.test.ts` | 196 | `D-11` | `decision-id-bare` |
| 150 | `packages/dev-seed/tests/writer.test.ts` | 208 | `D-11` | `decision-id-bare` |
| 151 | `packages/dev-seed/tests/writer.test.ts` | 289 | `Phase 58` | `phase-ref` |
| 152 | `packages/dev-seed/tests/writer.test.ts` | 289 | `GEN-09` | `task-id` |
| 153 | `tests/playwright.config.ts` | 186 | `Phase 140` | `phase-ref` |
| 154 | `tests/playwright.config.ts` | 210 | `Phase 140` | `phase-ref` |
| 155 | `tests/playwright.config.ts` | 223 | `Phase 140` | `phase-ref` |
| 156 | `tests/playwright.config.ts` | 235 | `Phase 140` | `phase-ref` |
| 157 | `tests/scripts/determinism-batch.sh` | 96 | `EPERM-07` | `task-id` |
| 158 | `tests/scripts/determinism-batch.sh` | 224 | `138-DETERMINISM-LEDGER.md` | `artifact-path` |
| 159 | `tests/scripts/determinism-batch.sh` | 265 | `Phase 138` | `phase-ref` |
| 160 | `tests/scripts/determinism-batch.sh` | 265 | `INTEG-02` | `task-id` |
| 161 | `tests/scripts/determinism-batch.sh` | 296 | `Phase 137` | `phase-ref` |
| 162 | `tests/scripts/determinism-batch.sh` | 311 | `138-NEGATIVE-CONTROL.md` | `artifact-path` |
| 163 | `tests/scripts/determinism-batch.sh` | 320 | `EPERM-07` | `task-id` |
| 164 | `tests/scripts/determinism-batch.sh` | 530 | `D-17` | `decision-id-bare` |
| 165 | `tests/scripts/determinism-batch.sh` | 533 | `D-17` | `decision-id-bare` |
| 166 | `tests/scripts/determinism-batch.sh` | 548 | `EPERM-07` | `task-id` |
| 167 | `tests/scripts/e2e-run.sh` | 251 | `Phase 138` | `phase-ref` |
| 168 | `tests/scripts/e2e-run.sh` | 251 | `D-12` | `decision-id-bare` |
| 169 | `tests/scripts/e2e-run.sh` | 445 | `D-17` | `decision-id-bare` |
| 170 | `tests/scripts/e2e-run.sh` | 456 | `D-17` | `decision-id-bare` |
| 171 | `tests/tests/specs/_probes/numberScale.probe.spec.ts` | 115 | `EQTYP-01` | `task-id` |
| 172 | `tests/tests/specs/_probes/numberScale.probe.spec.ts` | 115 | `EQTYP-02` | `task-id` |
| 173 | `tests/tests/specs/_probes/orgMatching.probe.spec.ts` | 36 | `EPERM-10` | `task-id` |
| 174 | `tests/tests/specs/_probes/popupNotice.probe.spec.ts` | 29 | `EPERM-09` | `task-id` |
| 175 | `tests/tests/specs/_probes/questionInfo.probe.spec.ts` | 36 | `EPERM-07` | `task-id` |
| 176 | `tests/tests/specs/_probes/video.probe.spec.ts` | 51 | `EPERM-06` | `task-id` |
| 177 | `tests/tests/specs/candidate/candidate-bank-auth.spec.ts` | 167 | `EFLOW-10` | `task-id` |
| 178 | `tests/tests/specs/candidate/candidate-bank-auth.spec.ts` | 168 | `D-02` | `decision-id-bare` |
| 179 | `tests/tests/specs/candidate/candidate-journey.spec.ts` | 409 | `EFLOW-09` | `task-id` |
| 180 | `tests/tests/specs/candidate/candidate-journey.spec.ts` | 808 | `EQTYP-01` | `task-id` |
| 181 | `tests/tests/specs/candidate/candidate-journey.spec.ts` | 808 | `D-07` | `decision-id-bare` |
| 182 | `tests/tests/specs/candidate/candidate-journey.spec.ts` | 884 | `D-02` | `decision-id-bare` |
| 183 | `tests/tests/specs/candidate/candidate-journey.spec.ts` | 961 | `EFLOW-09` | `task-id` |
| 184 | `tests/tests/specs/perm/perm-access-disable.spec.ts` | 40 | `EPERM-11` | `task-id` |
| 185 | `tests/tests/specs/perm/perm-hide-category-tags.spec.ts` | 50 | `ASSERT-05` | `task-id` |
| 186 | `tests/tests/specs/perm/perm-hide-election-tags.spec.ts` | 50 | `ASSERT-05` | `task-id` |
| 187 | `tests/tests/specs/perm/perm-interactive-info.spec.ts` | 68 | `EPERM-07` | `task-id` |
| 188 | `tests/tests/specs/perm/perm-localisation-positive.spec.ts` | 468 | `EFLOW-06` | `task-id` |
| 189 | `tests/tests/specs/perm/perm-org-matching.spec.ts` | 52 | `EPERM-10` | `task-id` |
| 190 | `tests/tests/specs/perm/perm-show-feedback-survey.spec.ts` | 49 | `EPERM-09` | `task-id` |
| 191 | `tests/tests/specs/voter/voter-alliance.spec.ts` | 47 | `EFLOW-02` | `task-id` |
| 192 | `tests/tests/specs/voter/voter-alliance.spec.ts` | 47 | `EPERM-03` | `task-id` |
| 193 | `tests/tests/specs/voter/voter-alliance.spec.ts` | 60 | `EPERM-03` | `task-id` |
| 194 | `tests/tests/specs/voter/voter-alliance.spec.ts` | 116 | `EPERM-04` | `task-id` |
| 195 | `tests/tests/specs/voter/voter-alliance.spec.ts` | 136 | `EFLOW-02` | `task-id` |
| 196 | `tests/tests/specs/voter/voter-journey-mobile.spec.ts` | 51 | `EFLOW-11` | `task-id` |
| 197 | `tests/tests/specs/voter/voter-journey.spec.ts` | 894 | `EPERM-07` | `task-id` |
| 198 | `tests/tests/specs/voter/voter-journey.spec.ts` | 1225 | `D-10` | `decision-id-bare` |
| 199 | `tests/tests/specs/voter/voter-journey.spec.ts` | 1673 | `EFLOW-01` | `task-id` |
| 200 | `tests/tests/specs/voter/voter-journey.spec.ts` | 1814 | `EQTYP-02` | `task-id` |
| 201 | `tests/tests/specs/voter/voter-nominations.spec.ts` | 29 | `UNBLK-04` | `task-id` |
| 202 | `tests/tests/specs/voter/voter-prefs-tracking.spec.ts` | 148 | `EFLOW-08` | `task-id` |

### `attributive-reference` — 108 rows

| # | Path | Line | Matched text | Rule |
|---:|---|---:|---|---|
| 1 | `apps/frontend/scripts/flatten-current-codemod.mjs` | 72 | `spike-009` | `spike-ref` |
| 2 | `apps/frontend/scripts/flatten-current-codemod.mjs` | 73 | `Phase 113` | `phase-ref` |
| 3 | `apps/frontend/scripts/store-to-state-codemod.mjs` | 5 | `Phase 106` | `phase-ref` |
| 4 | `apps/frontend/src/lib/_guards/eslint-store-guard.test.ts` | 12 | `Phase 115` | `phase-ref` |
| 5 | `apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts` | 409 | `Phase 64` | `phase-ref` |
| 6 | `apps/frontend/src/lib/candidate/components/termsOfUse/TermsOfUseForm.svelte` | 51 | `Phase 65` | `phase-ref` |
| 7 | `apps/frontend/src/lib/components/input/Input.svelte` | 226 | `Phase 64` | `phase-ref` |
| 8 | `apps/frontend/src/lib/components/input/Input.svelte` | 422 | `Phase 65` | `phase-ref` |
| 9 | `apps/frontend/src/lib/components/input/Input.svelte` | 447 | `Phase 65` | `phase-ref` |
| 10 | `apps/frontend/src/lib/components/input/Input.svelte` | 489 | `Phase 65` | `phase-ref` |
| 11 | `apps/frontend/src/lib/components/questions/QuestionChoices.svelte` | 379 | `Phase 64` | `phase-ref` |
| 12 | `apps/frontend/src/lib/components/select/Select.svelte` | 348 | `Phase 65` | `phase-ref` |
| 13 | `apps/frontend/src/lib/contexts/app/appContext.svelte.ts` | 377 | `Phase 64` | `phase-ref` |
| 14 | `apps/frontend/src/lib/contexts/app/survey.svelte.test.ts` | 9 | `Phase 113` | `phase-ref` |
| 15 | `apps/frontend/src/lib/contexts/app/tracking/trackingService.svelte.ts` | 32 | `Phase 108` | `phase-ref` |
| 16 | `apps/frontend/src/lib/contexts/app/tracking/trackingService.svelte.ts` | 36 | `Phase 107` | `phase-ref` |
| 17 | `apps/frontend/src/lib/contexts/app/tracking/trackingService.svelte.ts` | 37 | `Phase 109` | `phase-ref` |
| 18 | `apps/frontend/src/lib/contexts/auth/authContext.svelte.ts` | 32 | `Phase 109` | `phase-ref` |
| 19 | `apps/frontend/src/lib/contexts/data/dataContext.type.ts` | 10 | `Phase 113` | `phase-ref` |
| 20 | `apps/frontend/src/lib/contexts/filter/filterContext.svelte.test.ts` | 15 | `Phase 88` | `phase-ref` |
| 21 | `apps/frontend/src/lib/contexts/filter/filterContext.type.ts` | 8 | `Phase 88` | `phase-ref` |
| 22 | `apps/frontend/src/lib/contexts/filter/filterContext.type.ts` | 13 | `Phase 62` | `phase-ref` |
| 23 | `apps/frontend/src/lib/contexts/filter/filterContext.type.ts` | 49 | `Phase 62` | `phase-ref` |
| 24 | `apps/frontend/src/lib/contexts/filter/filterContext.type.ts` | 55 | `Phase 62` | `phase-ref` |
| 25 | `apps/frontend/src/lib/contexts/utils/SettingsOverlay.svelte.ts` | 7 | `Phase 98` | `phase-ref` |
| 26 | `apps/frontend/src/lib/contexts/voter/answerState.svelte.ts` | 14 | `spike-022` | `spike-ref` |
| 27 | `apps/frontend/src/lib/contexts/voter/voterContext.svelte.ts` | 33 | `Phase 64` | `phase-ref` |
| 28 | `apps/frontend/src/lib/contexts/voter/voterContext.type.ts` | 68 | `Phase 88` | `phase-ref` |
| 29 | `apps/frontend/src/lib/dynamic-components/navigation/NavItem.svelte` | 84 | `Phase 80` | `phase-ref` |
| 30 | `apps/frontend/src/lib/i18n/tests/translations.test.ts` | 220 | `Phase 78` | `phase-ref` |
| 31 | `apps/frontend/src/lib/utils/getAllianceSummary.ts` | 10 | `Phase 69` | `phase-ref` |
| 32 | `apps/frontend/src/lib/utils/route/parseParams.test.ts` | 5 | `Phase 88` | `phase-ref` |
| 33 | `apps/frontend/src/lib/utils/route/route.ts` | 26 | `Phase 88` | `phase-ref` |
| 34 | `apps/frontend/src/lib/utils/settings.test.ts` | 77 | `spike 008` | `spike-ref` |
| 35 | `apps/frontend/src/params/etPl.test.ts` | 6 | `Phase 88` | `phase-ref` |
| 36 | `apps/frontend/src/params/etPl.test.ts` | 8 | `Phase 62` | `phase-ref` |
| 37 | `apps/frontend/src/params/etPl.test.ts` | 9 | `Phase 69` | `phase-ref` |
| 38 | `apps/frontend/src/params/etPl.ts` | 3 | `Phase 88` | `phase-ref` |
| 39 | `apps/frontend/src/params/etPl.ts` | 13 | `Phase 62` | `phase-ref` |
| 40 | `apps/frontend/src/params/etSg.test.ts` | 6 | `Phase 88` | `phase-ref` |
| 41 | `apps/frontend/src/params/etSg.test.ts` | 8 | `Phase 62` | `phase-ref` |
| 42 | `apps/frontend/src/params/etSg.test.ts` | 9 | `Phase 69` | `phase-ref` |
| 43 | `apps/frontend/src/params/etSg.ts` | 13 | `Phase 62` | `phase-ref` |
| 44 | `apps/frontend/src/routes/(voters)/(located)/results/[[electionTab]]/+layout.svelte` | 9 | `Phase 88` | `phase-ref` |
| 45 | `apps/frontend/src/routes/(voters)/(located)/results/[[electionTab]]/[[entityTab=etPl]]/[[entity=etSg]]/[[id]]/+page.ts` | 6 | `Phase 88` | `phase-ref` |
| 46 | `apps/frontend/src/routes/(voters)/+layout.svelte` | 105 | `Phase 77` | `phase-ref` |
| 47 | `apps/frontend/src/routes/+layout.svelte` | 164 | `spike-015` | `spike-ref` |
| 48 | `apps/frontend/src/routes/+layout.svelte` | 263 | `Phase 60` | `phase-ref` |
| 49 | `apps/supabase/benchmarks/scripts/swap-schema.sh` | 29 | `Phase 10` | `phase-ref` |
| 50 | `packages/app-shared/src/settings/dynamicSettings.type.ts` | 395 | `Phase 69` | `phase-ref` |
| 51 | `packages/app-shared/src/utils/mergeSettings.ts` | 8 | `Phase 63` | `phase-ref` |
| 52 | `packages/dev-seed/src/emitters/answers.ts` | 7 | `Phase 56` | `phase-ref` |
| 53 | `packages/dev-seed/src/emitters/answers.ts` | 7 | `Phase 57` | `phase-ref` |
| 54 | `packages/dev-seed/src/emitters/answers.ts` | 12 | `Phase 56` | `phase-ref` |
| 55 | `packages/dev-seed/src/emitters/latent/index.ts` | 7 | `Phase 57` | `phase-ref` |
| 56 | `packages/dev-seed/src/emitters/latent/latentEmitter.ts` | 38 | `Phase 57` | `phase-ref` |
| 57 | `packages/dev-seed/src/emitters/latent/latentEmitter.ts` | 41 | `Phase 56` | `phase-ref` |
| 58 | `packages/dev-seed/src/emitters/latent/latentTypes.ts` | 2 | `Phase 57` | `phase-ref` |
| 59 | `packages/dev-seed/src/emitters/latent/latentTypes.ts` | 11 | `Phase 57` | `phase-ref` |
| 60 | `packages/dev-seed/src/emitters/latent/project.ts` | 120 | `Phase 56` | `phase-ref` |
| 61 | `packages/dev-seed/src/emitters/latent/project.ts` | 264 | `Phase 56` | `phase-ref` |
| 62 | `packages/dev-seed/src/emitters/latent/project.ts` | 306 | `Phase 56` | `phase-ref` |
| 63 | `packages/dev-seed/src/generators/AppSettingsGenerator.ts` | 27 | `Phase 58` | `phase-ref` |
| 64 | `packages/dev-seed/src/generators/CandidatesGenerator.ts` | 19 | `Phase 56` | `phase-ref` |
| 65 | `packages/dev-seed/src/generators/CandidatesGenerator.ts` | 19 | `Phase 57` | `phase-ref` |
| 66 | `packages/dev-seed/src/generators/CandidatesGenerator.ts` | 138 | `Phase 56` | `phase-ref` |
| 67 | `packages/dev-seed/src/generators/FeedbackGenerator.ts` | 4 | `Phase 56` | `phase-ref` |
| 68 | `packages/dev-seed/src/generators/FeedbackGenerator.ts` | 23 | `Phase 58` | `phase-ref` |
| 69 | `packages/dev-seed/src/generators/NominationsGenerator.ts` | 53 | `Phase 56` | `phase-ref` |
| 70 | `packages/dev-seed/src/generators/QuestionCategoriesGenerator.ts` | 18 | `Phase 56` | `phase-ref` |
| 71 | `packages/dev-seed/src/index.ts` | 4 | `Phase 56` | `phase-ref` |
| 72 | `packages/dev-seed/src/index.ts` | 19 | `Phase 57` | `phase-ref` |
| 73 | `packages/dev-seed/src/pipeline.ts` | 171 | `Phase 57` | `phase-ref` |
| 74 | `packages/dev-seed/src/pipeline.ts` | 218 | `Phase 58` | `phase-ref` |
| 75 | `packages/dev-seed/src/pipeline.ts` | 225 | `Phase 56` | `phase-ref` |
| 76 | `packages/dev-seed/src/supabaseAdminClient.ts` | 130 | `Phase 59` | `phase-ref` |
| 77 | `packages/dev-seed/src/supabaseAdminClient.ts` | 750 | `Phase 58` | `phase-ref` |
| 78 | `packages/dev-seed/src/templates/e2e/base.ts` | 664 | `Phase 129` | `phase-ref` |
| 79 | `packages/dev-seed/src/templates/e2e/base.ts` | 916 | `Phase 134` | `phase-ref` |
| 80 | `packages/dev-seed/src/templates/e2e/perm/perm-org-matching.ts` | 34 | `Phase 119` | `phase-ref` |
| 81 | `packages/dev-seed/src/writer.ts` | 9 | `Phase 56` | `phase-ref` |
| 82 | `packages/dev-seed/src/writer.ts` | 69 | `Phase 56` | `phase-ref` |
| 83 | `packages/dev-seed/src/writer.ts` | 138 | `Phase 56` | `phase-ref` |
| 84 | `packages/dev-seed/src/writer.ts` | 193 | `Phase 56` | `phase-ref` |
| 85 | `packages/dev-seed/tests/integration/default-template.integration.test.ts` | 13 | `Phase 135` | `phase-ref` |
| 86 | `packages/dev-seed/tests/integration/default-template.integration.test.ts` | 29 | `Phase 135` | `phase-ref` |
| 87 | `packages/dev-seed/tests/integration/default-template.integration.test.ts` | 92 | `Phase 135` | `phase-ref` |
| 88 | `packages/dev-seed/tests/integration/default-template.integration.test.ts` | 257 | `Phase 88` | `phase-ref` |
| 89 | `tests/playwright.config.ts` | 26 | `Phase 119` | `phase-ref` |
| 90 | `tests/playwright.config.ts` | 27 | `Phase 136` | `phase-ref` |
| 91 | `tests/playwright.config.ts` | 436 | `Phase 140` | `phase-ref` |
| 92 | `tests/playwright.config.ts` | 477 | `Phase 140` | `phase-ref` |
| 93 | `tests/playwright.config.ts` | 692 | `Phase 119` | `phase-ref` |
| 94 | `tests/playwright.config.ts` | 692 | `Phase 136` | `phase-ref` |
| 95 | `tests/playwright.config.ts` | 697 | `Phase 136` | `phase-ref` |
| 96 | `tests/scripts/determinism-batch.sh` | 89 | `Phase 137` | `phase-ref` |
| 97 | `tests/tests/fixtures/shared/theme.fixture.ts` | 19 | `Phase 121` | `phase-ref` |
| 98 | `tests/tests/helpers/navigation.ts` | 18 | `Phase 138` | `phase-ref` |
| 99 | `tests/tests/setup/candidate/bank-auth-journey.setup.ts` | 11 | `Phase 140` | `phase-ref` |
| 100 | `tests/tests/setup/perm/perm-show-feedback-survey.setup.ts` | 9 | `Phase 119` | `phase-ref` |
| 101 | `tests/tests/specs/_probes/numberScale.probe.spec.ts` | 3 | `Phase 130` | `phase-ref` |
| 102 | `tests/tests/specs/visual/visual-regression.spec.ts` | 29 | `Phase 136` | `phase-ref` |
| 103 | `tests/tests/specs/voter/voter-journey.spec.ts` | 887 | `Phase 119` | `phase-ref` |
| 104 | `tests/tests/specs/voter/voter-journey.spec.ts` | 967 | `Phase 135` | `phase-ref` |
| 105 | `tests/tests/utils/multiChoice.ts` | 7 | `Phase 135` | `phase-ref` |
| 106 | `tests/tests/utils/selectElection.ts` | 24 | `Phase 136` | `phase-ref` |
| 107 | `tests/tests/utils/voterNavigation.ts` | 54 | `Phase 138` | `phase-ref` |
| 108 | `tests/tests/utils/voterNavigation.ts` | 72 | `Phase 138` | `phase-ref` |

### `unstrippable-section-anchor` — 66 rows

| # | Path | Line | Matched text | Rule |
|---:|---|---:|---|---|
| 1 | `apps/frontend/src/lib/components/tabs/Tabs.svelte` | 61 | `§Latent` | `section-anchor-alpha` |
| 2 | `apps/frontend/src/lib/contexts/auth/authContext.svelte.ts` | 47 | `§D` | `section-anchor-alpha` |
| 3 | `apps/frontend/src/lib/contexts/filter/filterContext.svelte.ts` | 28 | `§Pattern` | `section-anchor-alpha` |
| 4 | `apps/frontend/src/lib/contexts/filter/filterContext.type.ts` | 32 | `§Pitfall` | `section-anchor-alpha` |
| 5 | `apps/frontend/src/lib/contexts/voter/voterContext.svelte.ts` | 116 | `§Pitfall` | `section-anchor-alpha` |
| 6 | `apps/frontend/src/lib/contexts/voter/voterContext.svelte.ts` | 145 | `§below` | `section-anchor-alpha` |
| 7 | `apps/frontend/src/lib/dynamic-components/entityCard/EntityCard.svelte` | 83 | `§Context` | `section-anchor-alpha` |
| 8 | `apps/frontend/src/lib/dynamic-components/entityDetails/EntityInfo.svelte` | 48 | `§Context` | `section-anchor-alpha` |
| 9 | `apps/frontend/src/lib/dynamic-components/entityList/EntityListWithControls.svelte` | 97 | `§Pitfall` | `section-anchor-alpha` |
| 10 | `apps/frontend/src/lib/dynamic-components/entityList/index.ts` | 7 | `§Runtime` | `section-anchor-alpha` |
| 11 | `apps/frontend/src/lib/dynamic-components/navigation/NavGroup.svelte` | 36 | `§Pitfall` | `section-anchor-alpha` |
| 12 | `apps/frontend/src/lib/dynamic-components/navigation/NavItem.svelte` | 40 | `§Pitfall` | `section-anchor-alpha` |
| 13 | `apps/frontend/src/lib/dynamic-components/navigation/navGroupContext.ts` | 14 | `§Pattern` | `section-anchor-alpha` |
| 14 | `apps/frontend/src/lib/dynamic-components/questionHeading/QuestionHeading.svelte` | 51 | `§Context` | `section-anchor-alpha` |
| 15 | `apps/frontend/src/params/etPl.ts` | 20 | `§Pitfall` | `section-anchor-alpha` |
| 16 | `apps/frontend/src/params/etSg.ts` | 22 | `§Pitfall` | `section-anchor-alpha` |
| 17 | `apps/frontend/src/routes/(voters)/(located)/questions/+layout.svelte` | 61 | `§Context` | `section-anchor-alpha` |
| 18 | `apps/frontend/src/routes/(voters)/(located)/questions/category/[categoryId]/+page.svelte` | 44 | `§Context` | `section-anchor-alpha` |
| 19 | `apps/frontend/src/routes/(voters)/constituencies/+page.svelte` | 42 | `§Context` | `section-anchor-alpha` |
| 20 | `apps/frontend/src/routes/(voters)/info/+page.svelte` | 21 | `§Context` | `section-anchor-alpha` |
| 21 | `apps/frontend/src/routes/+layout.svelte` | 79 | `§Pattern` | `section-anchor-alpha` |
| 22 | `apps/frontend/src/routes/admin/(protected)/argument-condensation/+page.svelte` | 23 | `§Context` | `section-anchor-alpha` |
| 23 | `apps/frontend/src/routes/admin/(protected)/question-info/+page.svelte` | 24 | `§Context` | `section-anchor-alpha` |
| 24 | `apps/frontend/src/routes/candidate/(protected)/+layout.svelte` | 76 | `§Pattern` | `section-anchor-alpha` |
| 25 | `apps/frontend/src/routes/candidate/(protected)/+layout.svelte` | 100 | `§Alternatives` | `section-anchor-alpha` |
| 26 | `apps/frontend/src/routes/candidate/(protected)/profile/+page.svelte` | 40 | `§Context` | `section-anchor-alpha` |
| 27 | `apps/frontend/src/routes/candidate/(protected)/questions/[questionId]/+page.svelte` | 52 | `§Context` | `section-anchor-alpha` |
| 28 | `apps/frontend/src/routes/candidate/(protected)/questions/[questionId]/+page.svelte` | 55 | `§Context` | `section-anchor-alpha` |
| 29 | `apps/frontend/src/routes/candidate/login/+page.svelte` | 45 | `§Context` | `section-anchor-alpha` |
| 30 | `apps/frontend/src/routes/candidate/preregister/(authenticated)/constituencies/+page.svelte` | 14 | `§Context` | `section-anchor-alpha` |
| 31 | `apps/frontend/src/routes/candidate/preregister/(authenticated)/elections/+page.svelte` | 14 | `§Context` | `section-anchor-alpha` |
| 32 | `apps/frontend/src/routes/candidate/preregister/(authenticated)/elections/+page.svelte` | 18 | `§Context` | `section-anchor-alpha` |
| 33 | `apps/frontend/src/routes/candidate/preregister/+page.svelte` | 29 | `§Context` | `section-anchor-alpha` |
| 34 | `apps/frontend/src/routes/candidate/register/password/+page.svelte` | 32 | `§Context` | `section-anchor-alpha` |
| 35 | `packages/dev-seed/src/emitters/latent/centroids.ts` | 14 | `§` | `section-anchor-alpha` |
| 36 | `packages/dev-seed/src/emitters/latent/gaussian.ts` | 14 | `§Common` | `section-anchor-alpha` |
| 37 | `packages/dev-seed/src/emitters/latent/loadings.ts` | 33 | `§Common` | `section-anchor-alpha` |
| 38 | `packages/dev-seed/src/generators/FeedbackGenerator.ts` | 4 | `§` | `section-anchor-alpha` |
| 39 | `packages/dev-seed/src/generators/OrganizationsGenerator.ts` | 14 | `§generators` | `section-anchor-alpha` |
| 40 | `packages/dev-seed/src/supabaseAdminClient.ts` | 725 | `§Specifics:` | `section-anchor-alpha` |
| 41 | `packages/dev-seed/src/templates/e2e/base.ts` | 287 | `§` | `section-anchor-alpha` |
| 42 | `packages/dev-seed/src/templates/e2e/base.ts` | 1040 | `§` | `section-anchor-alpha` |
| 43 | `packages/dev-seed/src/writer.ts` | 171 | `§Specifics.` | `section-anchor-alpha` |
| 44 | `packages/dev-seed/src/writer.ts` | 221 | `§Specifics:` | `section-anchor-alpha` |
| 45 | `packages/dev-seed/tests/determinism.test.ts` | 43 | `§Pitfall` | `section-anchor-alpha` |
| 46 | `tests/playwright.config.ts` | 561 | `§ DEF-135-04` | `section-anchor-alpha` |
| 47 | `tests/tests/fixtures/shared/forensicCapture.fixture.ts` | 12 | `§ DEF-135-04:` | `section-anchor-alpha` |
| 48 | `tests/tests/fixtures/shared/forensicCapture.fixture.ts` | 18 | `§ U-1` | `section-anchor-alpha` |
| 49 | `tests/tests/fixtures/shared/trackingIntercept.fixture.ts` | 9 | `§Tracking` | `section-anchor-alpha` |
| 50 | `tests/tests/fixtures/voter/views.ts` | 98 | `§ U-1` | `section-anchor-alpha` |
| 51 | `tests/tests/helpers/navigation.ts` | 13 | `§ Named` | `section-anchor-alpha` |
| 52 | `tests/tests/helpers/navigation.ts` | 46 | `§ Named` | `section-anchor-alpha` |
| 53 | `tests/tests/helpers/navigation.ts` | 164 | `§B.5` | `section-anchor-alpha` |
| 54 | `tests/tests/helpers/navigation.ts` | 298 | `§ Named` | `section-anchor-alpha` |
| 55 | `tests/tests/setup/candidate/bank-auth-journey.teardown.ts` | 4 | `§Runtime` | `section-anchor-alpha` |
| 56 | `tests/tests/setup/shared/assertTeardown.ts` | 42 | `§ Adjudication` | `section-anchor-alpha` |
| 57 | `tests/tests/setup/shared/assertTeardown.ts` | 64 | `§ Adjudication` | `section-anchor-alpha` |
| 58 | `tests/tests/setup/shared/assertTeardown.ts` | 102 | `§ Adjudication` | `section-anchor-alpha` |
| 59 | `tests/tests/specs/candidate/candidate-bank-auth-journey.spec.ts` | 54 | `§EFLOW-10b` | `section-anchor-alpha` |
| 60 | `tests/tests/specs/voter/eperm07-term-trigger.spec.ts` | 10 | `§ Hypothesis` | `section-anchor-alpha` |
| 61 | `tests/tests/specs/voter/eperm07-term-trigger.spec.ts` | 152 | `§R2.4-C` | `section-anchor-alpha` |
| 62 | `tests/tests/specs/voter/eperm07-term-trigger.spec.ts` | 268 | `§R2.4-C` | `section-anchor-alpha` |
| 63 | `tests/tests/specs/voter/voter-journey.spec.ts` | 203 | `§ Named` | `section-anchor-alpha` |
| 64 | `tests/tests/specs/voter/voter-journey.spec.ts` | 405 | `§` | `section-anchor-alpha` |
| 65 | `tests/tests/specs/voter/voter-journey.spec.ts` | 903 | `§ DEF-135-04` | `section-anchor-alpha` |
| 66 | `tests/tests/utils/voterNavigation.ts` | 53 | `§ Named` | `section-anchor-alpha` |

### `todo-class` — 60 rows

| # | Path | Line | Matched text | Rule |
|---:|---|---:|---|---|
| 1 | `apps/frontend/src/app.css` | 464 | `TODO` | `todo-class` |
| 2 | `apps/frontend/src/lib/admin/components/jobs/FeatureJobs.svelte` | 103 | `TODO` | `todo-class` |
| 3 | `apps/frontend/src/lib/admin/components/jobs/JobDetails.svelte` | 83 | `TODO` | `todo-class` |
| 4 | `apps/frontend/src/lib/admin/components/jobs/WithPolling.svelte` | 5 | `TODO` | `todo-class` |
| 5 | `apps/frontend/src/lib/api/adapters/supabase/adminWriter/supabaseAdminWriter.ts` | 15 | `TODO` | `todo-class` |
| 6 | `apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts` | 380 | `TODO` | `todo-class` |
| 7 | `apps/frontend/src/lib/api/adapters/supabase/utils/mapRow.ts` | 7 | `TODO` | `todo-class` |
| 8 | `apps/frontend/src/lib/api/base/dataWriter.type.ts` | 211 | `TODO` | `todo-class` |
| 9 | `apps/frontend/src/lib/api/base/dataWriter.type.ts` | 311 | `TODO` | `todo-class` |
| 10 | `apps/frontend/src/lib/api/base/dataWriter.type.ts` | 321 | `TODO` | `todo-class` |
| 11 | `apps/frontend/src/lib/api/utils/authHeaders.ts` | 10 | `TODO` | `todo-class` |
| 12 | `apps/frontend/src/lib/components/infoAnswer/InfoAnswer.svelte` | 103 | `TODO` | `todo-class` |
| 13 | `apps/frontend/src/lib/components/input/Input.svelte` | 353 | `TODO` | `todo-class` |
| 14 | `apps/frontend/src/lib/components/tabs/Tabs.svelte` | 17 | `TODO` | `todo-class` |
| 15 | `apps/frontend/src/lib/components/video/Video.svelte` | 521 | `TODO` | `todo-class` |
| 16 | `apps/frontend/src/lib/contexts/admin/jobStates.type.ts` | 20 | `TODO` | `todo-class` |
| 17 | `apps/frontend/src/lib/contexts/admin/jobStates.type.ts` | 25 | `TODO` | `todo-class` |
| 18 | `apps/frontend/src/lib/contexts/app/appContext.svelte.ts` | 103 | `TODO` | `todo-class` |
| 19 | `apps/frontend/src/lib/contexts/app/appContext.svelte.ts` | 127 | `TODO` | `todo-class` |
| 20 | `apps/frontend/src/lib/contexts/app/appContext.type.ts` | 85 | `TODO` | `todo-class` |
| 21 | `apps/frontend/src/lib/contexts/candidate/candidateContext.type.ts` | 24 | `TODO` | `todo-class` |
| 22 | `apps/frontend/src/lib/contexts/candidate/candidateContext.type.ts` | 28 | `TODO` | `todo-class` |
| 23 | `apps/frontend/src/lib/contexts/voter/countAnswers.ts` | 5 | `TODO` | `todo-class` |
| 24 | `apps/frontend/src/lib/dynamic-components/entityCard/EntityCard.svelte` | 125 | `TODO` | `todo-class` |
| 25 | `apps/frontend/src/lib/dynamic-components/entityList/EntityListControls.svelte` | 5 | `TODO` | `todo-class` |
| 26 | `apps/frontend/src/lib/dynamic-components/navigation/admin/AdminNav.svelte` | 46 | `TODO` | `todo-class` |
| 27 | `apps/frontend/src/lib/server/api/adapters/local/dataProvider/localServerDataProvider.ts` | 153 | `TODO` | `todo-class` |
| 28 | `apps/frontend/src/lib/utils/matching/imputeParentAnswers.ts` | 136 | `TODO` | `todo-class` |
| 29 | `apps/frontend/src/lib/utils/regexp.ts` | 4 | `TODO` | `todo-class` |
| 30 | `apps/frontend/src/lib/utils/settings.ts` | 7 | `TODO` | `todo-class` |
| 31 | `apps/frontend/src/lib/utils/sorting.ts` | 40 | `TODO` | `todo-class` |
| 32 | `apps/frontend/src/routes/(voters)/(located)/+layout.ts` | 8 | `TODO` | `todo-class` |
| 33 | `apps/frontend/src/routes/(voters)/(located)/questions/+layout.svelte` | 238 | `TODO` | `todo-class` |
| 34 | `apps/frontend/src/routes/+layout.svelte` | 59 | `TODO` | `todo-class` |
| 35 | `apps/frontend/src/routes/+layout.svelte` | 71 | `TODO` | `todo-class` |
| 36 | `apps/frontend/src/routes/Banner.svelte` | 7 | `TODO` | `todo-class` |
| 37 | `apps/frontend/src/routes/admin/(protected)/jobs/+page.svelte` | 8 | `TODO` | `todo-class` |
| 38 | `apps/frontend/src/routes/api/admin/jobs/abort-all/+server.ts` | 14 | `TODO` | `todo-class` |
| 39 | `packages/app-shared/src/settings/dynamicSettings.type.ts` | 68 | `TODO` | `todo-class` |
| 40 | `packages/argument-condensation/src/core/condensation/condenser.ts` | 43 | `TODO` | `todo-class` |
| 41 | `packages/argument-condensation/src/core/types/condensation/condensationType.ts` | 4 | `TODO` | `todo-class` |
| 42 | `packages/argument-condensation/src/core/types/condensation/condensationType.ts` | 9 | `TODO` | `todo-class` |
| 43 | `packages/data/src/objects/questions/base/answer.type.ts` | 32 | `TODO` | `todo-class` |
| 44 | `packages/data/src/objects/questions/base/questionTypes.ts` | 36 | `TODO` | `todo-class` |
| 45 | `packages/data/src/objects/questions/variants/variants.ts` | 58 | `TODO` | `todo-class` |
| 46 | `packages/data/src/root/dataRoot.ts` | 743 | `TODO` | `todo-class` |
| 47 | `packages/dev-seed/src/resolveAppSettingsExternalIds.ts` | 15 | `TODO` | `todo-class` |
| 48 | `packages/llm/src/llm-providers/llmProvider.ts` | 16 | `TODO` | `todo-class` |
| 49 | `packages/llm/src/llm-providers/llmProvider.ts` | 17 | `TODO` | `todo-class` |
| 50 | `packages/llm/src/llm-providers/llmProvider.ts` | 18 | `TODO` | `todo-class` |
| 51 | `packages/llm/src/llm-providers/llmProvider.ts` | 19 | `TODO` | `todo-class` |
| 52 | `packages/llm/src/llm-providers/llmProvider.ts` | 20 | `TODO` | `todo-class` |
| 53 | `packages/llm/src/llm-providers/llmProvider.ts` | 69 | `TODO` | `todo-class` |
| 54 | `packages/llm/src/llm-providers/llmProvider.ts` | 100 | `TODO` | `todo-class` |
| 55 | `packages/llm/src/llm-providers/llmProvider.ts` | 167 | `TODO` | `todo-class` |
| 56 | `packages/llm/src/llm-providers/llmProvider.ts` | 205 | `TODO` | `todo-class` |
| 57 | `packages/llm/src/llm-providers/llmProvider.ts` | 214 | `TODO` | `todo-class` |
| 58 | `packages/llm/src/llm-providers/provider.types.ts` | 18 | `TODO` | `todo-class` |
| 59 | `packages/matching/src/distance/metric.ts` | 220 | `TODO` | `todo-class` |
| 60 | `packages/question-info/src/core/infoGeneration.ts` | 119 | `TODO` | `todo-class` |

### `markdown-file` — 45 rows

| # | Path | Line | Matched text | Rule |
|---:|---|---:|---|---|
| 1 | `apps/docs/src/routes/(content)/about/project/+page.md` | 37 | `v1.0` | `milestone-ver` |
| 2 | `apps/docs/src/routes/(content)/about/project/+page.md` | 41 | `v1.0` | `milestone-ver` |
| 3 | `apps/docs/src/routes/(content)/about/project/+page.md` | 45 | `v1.0` | `milestone-ver` |
| 4 | `apps/docs/src/routes/(content)/about/project/+page.md` | 49 | `v1.0` | `milestone-ver` |
| 5 | `apps/docs/src/routes/(content)/developers-guide/contributing/contribute/+page.md` | 15 | `v1.0` | `milestone-ver` |
| 6 | `apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/components/tabs/Tabs/+page.md` | 18 | `TODO` | `todo-class` |
| 7 | `apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/dynamic-components/entityCard/EntityCardAction/+page.md` | 5 | `TODO` | `todo-class` |
| 8 | `apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/dynamic-components/entityList/EntityListControls/+page.md` | 5 | `TODO` | `todo-class` |
| 9 | `packages/argument-condensation/README.md` | 255 | `TODO` | `todo-class` |
| 10 | `packages/dev-seed/README.md` | 22 | `D-58-11` | `decision-id-long` |
| 11 | `packages/dev-seed/README.md` | 38 | `D-58-08` | `decision-id-long` |
| 12 | `packages/dev-seed/README.md` | 51 | `D-58-09` | `decision-id-long` |
| 13 | `packages/dev-seed/README.md` | 65 | `D-58-17` | `decision-id-long` |
| 14 | `packages/dev-seed/README.md` | 92 | `Phase 57` | `phase-ref` |
| 15 | `packages/dev-seed/README.md` | 111 | `TMPL-03` | `task-id` |
| 16 | `packages/dev-seed/README.md` | 181 | `TMPL-03` | `task-id` |
| 17 | `packages/dev-seed/README.md` | 234 | `GEN-04` | `task-id` |
| 18 | `packages/dev-seed/README.md` | 239 | `Phase 57` | `phase-ref` |
| 19 | `packages/dev-seed/README.md` | 240 | ``.planning/phases/57-latent-factor-answer-model/57-CONTEXT.md`` | `artifact-path` |
| 20 | `packages/dev-seed/README.md` | 255 | `D-58-12` | `decision-id-long` |
| 21 | `packages/dev-seed/README.md` | 256 | `D-15` | `decision-id-bare` |
| 22 | `packages/dev-seed/README.md` | 285 | `TMPL-09` | `task-id` |
| 23 | `packages/dev-seed/README.md` | 285 | `D-16` | `decision-id-bare` |
| 24 | `packages/dev-seed/README.md` | 300 | `Phase 56` | `phase-ref` |
| 25 | `packages/dev-seed/README.md` | 301 | ``.planning/phases/56-generator-foundations-plumbing/`` | `artifact-path` |
| 26 | `packages/dev-seed/README.md` | 302 | `Phase 57` | `phase-ref` |
| 27 | `packages/dev-seed/README.md` | 303 | ``.planning/phases/57-latent-factor-answer-model/`` | `artifact-path` |
| 28 | `packages/dev-seed/README.md` | 304 | `Phase 58` | `phase-ref` |
| 29 | `packages/dev-seed/README.md` | 305 | ``.planning/phases/58-templates-cli-default-dataset/`` | `artifact-path` |
| 30 | `packages/dev-seed/README.md` | 307 | `§` | `section-anchor-alpha` |
| 31 | `packages/dev-seed/src/assets/portraits/LICENSE.md` | 31 | `D-58` | `decision-id-bare` |
| 32 | `tests/IDURA-TEST-RUNBOOK.md` | 192 | `EFLOW-10` | `task-id` |
| 33 | `tests/IDURA-TEST-RUNBOOK.md` | 201 | `D-02` | `decision-id-bare` |
| 34 | `tests/IDURA-TEST-RUNBOOK.md` | 279 | `§ Run` | `section-anchor-alpha` |
| 35 | `tests/IDURA-TEST-RUNBOOK.md` | 287 | `plan 122-03` | `plan-number` |
| 36 | `tests/IDURA-TEST-RUNBOOK.md` | 296 | `plan 122-05` | `plan-number` |
| 37 | `tests/IDURA-TEST-RUNBOOK.md` | 301 | `D-01` | `decision-id-bare` |
| 38 | `tests/IDURA-TEST-RUNBOOK.md` | 405 | `EFLOW-10` | `task-id` |
| 39 | `tests/IDURA-TEST-RUNBOOK.md` | 420 | `Phase 140` | `phase-ref` |
| 40 | `tests/IDURA-TEST-RUNBOOK.md` | 430 | `Phase 140` | `phase-ref` |
| 41 | `tests/IDURA-TEST-RUNBOOK.md` | 433 | `140-GATES.md` | `artifact-path` |
| 42 | `tests/README.md` | 135 | `Phase 138` | `phase-ref` |
| 43 | `tests/README.md` | 135 | `TODO` | `todo-class` |
| 44 | `tests/README.md` | 186 | `Phase 140` | `phase-ref` |
| 45 | `tests/README.md` | 186 | `Phase 140` | `phase-ref` |

### `milestone-version` — 37 rows

| # | Path | Line | Matched text | Rule |
|---:|---|---:|---|---|
| 1 | `apps/frontend/eslint.config.mjs` | 38 | `v2.13` | `milestone-ver` |
| 2 | `apps/frontend/eslint.config.mjs` | 77 | `v2.11` | `milestone-ver` |
| 3 | `apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.type.ts` | 5 | `v2.6` | `milestone-ver` |
| 4 | `apps/frontend/src/lib/components/questions/QuestionChoices.svelte` | 379 | `v2.6` | `milestone-ver` |
| 5 | `apps/frontend/src/lib/contexts/admin/adminContext.svelte.ts` | 17 | `v2.13` | `milestone-ver` |
| 6 | `apps/frontend/src/lib/contexts/admin/adminContext.svelte.ts` | 28 | `v2.11` | `milestone-ver` |
| 7 | `apps/frontend/src/lib/contexts/admin/adminContext.svelte.ts` | 30 | `v2.11` | `milestone-ver` |
| 8 | `apps/frontend/src/lib/contexts/admin/adminContext.svelte.ts` | 66 | `v2.11` | `milestone-ver` |
| 9 | `apps/frontend/src/lib/contexts/admin/adminContext.svelte.ts` | 211 | `v2.11` | `milestone-ver` |
| 10 | `apps/frontend/src/lib/contexts/admin/jobStates.svelte.ts` | 11 | `v2.13` | `milestone-ver` |
| 11 | `apps/frontend/src/lib/contexts/app/appContext.svelte.ts` | 30 | `v2.13` | `milestone-ver` |
| 12 | `apps/frontend/src/lib/contexts/app/appContext.svelte.ts` | 58 | `v2.11` | `milestone-ver` |
| 13 | `apps/frontend/src/lib/contexts/app/appContext.svelte.ts` | 204 | `v2.13` | `milestone-ver` |
| 14 | `apps/frontend/src/lib/contexts/app/popup/popupState.svelte.ts` | 6 | `v2.13` | `milestone-ver` |
| 15 | `apps/frontend/src/lib/contexts/app/tracking/trackingService.svelte.ts` | 24 | `v2.13` | `milestone-ver` |
| 16 | `apps/frontend/src/lib/contexts/auth/authContext.svelte.ts` | 14 | `v2.13` | `milestone-ver` |
| 17 | `apps/frontend/src/lib/contexts/candidate/candidateContext.svelte.ts` | 37 | `v2.13` | `milestone-ver` |
| 18 | `apps/frontend/src/lib/contexts/candidate/candidateUserDataState.svelte.ts` | 14 | `v2.13` | `milestone-ver` |
| 19 | `apps/frontend/src/lib/contexts/layout/VideoController.svelte.ts` | 6 | `v2.13` | `milestone-ver` |
| 20 | `apps/frontend/src/lib/contexts/layout/layoutContext.svelte.ts` | 97 | `v2.13` | `milestone-ver` |
| 21 | `apps/frontend/src/lib/contexts/utils/SettingsOverlay.svelte.ts` | 57 | `v2.13` | `milestone-ver` |
| 22 | `apps/frontend/src/lib/contexts/utils/paramState.svelte.ts` | 7 | `v2.13` | `milestone-ver` |
| 23 | `apps/frontend/src/lib/contexts/utils/persistedState.svelte.ts` | 70 | `v2.13` | `milestone-ver` |
| 24 | `apps/frontend/src/lib/contexts/voter/answerState.svelte.ts` | 10 | `v2.13` | `milestone-ver` |
| 25 | `apps/frontend/src/lib/contexts/voter/voterContext.svelte.ts` | 45 | `v2.13` | `milestone-ver` |
| 26 | `apps/frontend/src/routes/+layout.svelte` | 263 | `v2.1` | `milestone-ver` |
| 27 | `apps/frontend/src/routes/candidate/(protected)/+layout.svelte` | 110 | `v2.1` | `milestone-ver` |
| 28 | `packages/dev-seed/src/generators/AccountsGenerator.ts` | 26 | `v2.5` | `milestone-ver` |
| 29 | `packages/dev-seed/tests/integration/default-template.integration.test.ts` | 377 | `v2.6` | `milestone-ver` |
| 30 | `tests/scripts/determinism-batch.sh` | 91 | `v2.15` | `milestone-ver` |
| 31 | `tests/tests/fixtures/shared/forensicCapture.fixture.ts` | 42 | `v2.14` | `milestone-ver` |
| 32 | `tests/tests/fixtures/shared/forensicCapture.fixture.ts` | 43 | `v2.15` | `milestone-ver` |
| 33 | `tests/tests/fixtures/voter/views.ts` | 93 | `v2.14` | `milestone-ver` |
| 34 | `tests/tests/fixtures/voter/views.ts` | 94 | `v2.15` | `milestone-ver` |
| 35 | `tests/tests/specs/a11y/a11y-smoke.spec.ts` | 295 | `v2.14` | `milestone-ver` |
| 36 | `tests/tests/specs/visual/visual-regression.spec.ts` | 29 | `v1.2` | `milestone-ver` |
| 37 | `tests/tests/specs/visual/visual-regression.spec.ts` | 35 | `v1.58` | `milestone-ver` |

### `ambiguous-reference` — 10 rows

| # | Path | Line | Matched text | Rule |
|---:|---|---:|---|---|
| 1 | `apps/frontend/scripts/flatten-current-codemod.mjs` | 5 | `spike-009` | `spike-ref` |
| 2 | `apps/supabase/benchmarks/scripts/run-concurrency-scaling.sh` | 75 | `PHASE 1` | `phase-ref` |
| 3 | `apps/supabase/benchmarks/scripts/run-concurrency-scaling.sh` | 112 | `PHASE 2` | `phase-ref` |
| 4 | `apps/supabase/benchmarks/scripts/run-concurrency-scaling.sh` | 138 | `PHASE 3` | `phase-ref` |
| 5 | `apps/supabase/supabase/tests/database/00-helpers.test.sql` | 20 | `Phase 1` | `phase-ref` |
| 6 | `apps/supabase/supabase/tests/database/00-helpers.test.sql` | 412 | `Phase 2` | `phase-ref` |
| 7 | `packages/argument-condensation/src/core/condensation/condenser.ts` | 706 | `PHASE 1` | `phase-ref` |
| 8 | `packages/argument-condensation/src/core/condensation/condenser.ts` | 745 | `PHASE 2` | `phase-ref` |
| 9 | `packages/argument-condensation/src/core/condensation/condenser.ts` | 763 | `PHASE 3` | `phase-ref` |
| 10 | `packages/argument-condensation/src/core/condensation/condenser.ts` | 792 | `PHASE 4` | `phase-ref` |

**Row count: 528.** Equal to `residue_total` in the frontmatter, by construction —
this table is generated from `151-hygiene-residue.tsv`, which the codemod writes on the
same run that produces the count.

---
---

# Stage 2 — the agent pass (plan 151-08)

Stage 1 removed the deterministic 79 %. This stage resolved, one by one, the 528 items
the codemod reported rather than rewrote, plus 6 it had failed to attribute at all.

**Read this section for the two exceptions before quoting `criterion_3` as satisfied.**
`--assert-clean` still exits **1** on **2 of 9** rows, and that is a recorded verdict
rather than unfinished work. Both exceptions are argued from measurement below.

## The written rule applied (copied from the plan, so judgements are auditable)

Every residue item was resolved by exactly one of four verdicts. No fifth verdict exists.

| Verdict | Applies to | Action |
|---|---|---|
| **REWRITE** | a planning reference where removal changes no behaviour and no test identity | collapse to `see phase N`, or delete if nothing survives |
| **REWRITE-WITH-CARE** | a planning reference in a **runtime user- or operator-visible string** or an ESLint rule message | rewrite the message so it still reads as a complete sentence; do not merely excise the token |
| **KEEP** | a **test identity** | keep, record the reason — a deliberate exception to criterion 3 |
| **KEEP-VERSION** | a genuine tool, package, platform or domain identifier that merely looks like a planning tag | keep |

For D-13's second clause (a comment the code makes redundant) the rule was applied
narrowly, as D-13 requires: a comment was deleted only where the adjacent identifier
already said the same thing. No restructuring was performed to make a comment redundant.

## Before → Stage 1 → Stage 2

Same script, same scope (`-- apps/ packages/ tests/`), same pattern set. The `base` and
`delta` columns come from `151-hygiene-baseline.tsv`, so all three states are comparable
by construction.

```
$ .planning/phases/151-ship-v0-2-akita-review-stack/scripts/hygiene-grep-report.sh \
    .planning/phases/151-ship-v0-2-akita-review-stack/151-hygiene-baseline.tsv

  pattern               occ   files    bare  expect     verdict    base    delta
  -----------------  ------  ------  ------  ---------  -------  ------  -------
  phase-ref             659     235      11  bare = 0   FAIL        704      -45
  spike-ref              40      30       0  bare = 0   OK           41       -1
  decision-id-long        0       0       -  occ = 0    OK          185     -185
  decision-id-bare        0       0       -  occ = 0    OK          540     -540
  section-anchor          0       0       -  occ = 0    OK          219     -219
  planning-path           0       0       -  occ = 0    OK           27      -27
  plan-number             0       0       -  occ = 0    OK          105     -105
  milestone-ver          43      30       -  -          REPORT       45       -2
  task-id                84      46       -  occ = 0    FAIL        535     -451

  planning-reference total (8 rows) : 742
  task-id supplementary             : 84
  union files touched by any row    : 270

Gate rows failing: 2  (milestone-ver is report-only and never counted)
```

Row-by-row across the three states, on the column each row is actually gated on:

| Gate row | gated on | baseline | after Stage 1 | after Stage 2 | verdict |
|---|---|---:|---:|---:|---|
| `phase-ref` | `bare` | 700 | 154 | **11** | FAIL — all 11 KEEP-classified |
| `spike-ref` | `bare` | 41 | 5 | **0** | OK |
| `decision-id-long` | `occ` | 185 | 49 | **0** | OK |
| `decision-id-bare` | `occ` | 540 | 47 | **0** | OK |
| `section-anchor` | `occ` | 219 | 70 | **0** | OK |
| `planning-path` | `occ` | 27 | 5 | **0** | OK |
| `plan-number` | `occ` | 105 | 2 | **0** | OK |
| `task-id` | `occ` | 535 | 84 | **84** | FAIL — KEEP, see below |
| `milestone-ver` | — | 45 | 45 | 43 | REPORT-only by design |

Six rows went from red to green in this stage. The two that did not are argued below.

## Criterion 3 clause 1, proven by SHAPE and not only by absence

An absence-only check cannot catch a reference that survives in the wrong form, so the
surviving references are counted positively and the two counts compared.

```
$ git grep -I -h -o -P '(?i)\bphases?\s+\d+'            -- apps/ packages/ tests/ | wc -l   # 659
$ git grep -I -h -o -P '(?i)(?<!see\s)\bphases?\s+\d+'  -- apps/ packages/ tests/ | wc -l   #  11
$ git grep -I -h -o -P '(?i)\bspikes?[\s\-/]\d+'        -- apps/ packages/ tests/ | wc -l   #  40
$ git grep -I -h -o -P '(?i)(?<!see\s)\bspikes?[\s\-/]\d+' -- apps/ packages/ tests/ | wc -l #  0
$ git grep -I -h -o -P '(?i)\bsee (phase|spike) \d+'    -- apps/ packages/ tests/ | wc -l   # 688
```

| | surviving | in collapsed pointer form | not in pointer form |
|---|---:|---:|---:|
| phase references | 659 | **648** | 11 |
| spike references | 40 | **40** | 0 |
| **total** | **699** | **688** | **11** |

648 + 40 = 688, and 688 + 11 = 699. The arithmetic closes. **Every** surviving reference
is in `see phase N` / `see spike N` form **except the 11**, and those 11 are not planning
references at all — see exception 2.

A note on a temptation that was rejected: rendering an attributive reference as the
hyphenated compound `phase-56` would satisfy every grep in this file, because the gate
pattern requires whitespace (`phases?\s+\d+`). It was not used. A surviving reference
spelled `phase-56` is still a surviving reference; it merely evades the check. This
positive shape table is exactly the instrument that would have caught it.

## Criterion 3 clause 2 — review-tagged comments, measured on both sides

```
$ git grep -I -o -P '\[PR review\]' -- apps/ packages/ tests/ | wc -l
0
```

**0, measured after the agent pass** — not inherited from the Stage-1 record and not
assumed from C-7. Nothing in this stage could have introduced one, but "nothing could
have" is not a measurement.

## Exception 1 — `task-id` (84 occurrences). KEEP, and the cost of not keeping is measured

Test identities. The plan's default verdict for a test title is KEEP; this stage found
**direct evidence** that the default is correct here rather than merely cautious.

`tests/scripts/determinism-batch.sh` matches a Playwright step by its title as a
**functional string**:

```
tests/scripts/determinism-batch.sh:96    EPERM07_STEP_PREFIX='EPERM-07 customData.terms'
tests/scripts/determinism-batch.sh:493   ... "$RUN_DIR/results.json" "$EPERM07_STEP_PREFIX" ...
tests/tests/specs/voter/voter-journey.spec.ts:894
    await test.step('EPERM-07 customData.terms: in-text affordance + definition popup on Base-3', ...)
```

Stripping `EPERM-07` from that step title to satisfy the `task-id` row would leave the
determinism gate silently unable to find the step it exists to measure. That is a
regression a grep-driven rewrite would have introduced and no test would have caught.

The same class covers the rest of the row: the coverage IDs (`EPERM-*`, `EFLOW-*`,
`GEN-*`, `TMPL-*`, `EQTYP-*`) index this project's own failure history and coverage
records, and `tests/IDURA-TEST-RUNBOOK.md` § `EFLOW-10` is a cross-reference target named
from `candidate-bank-auth-journey.spec.ts`.

One member of this row is a KEEP-VERSION rather than a test identity: `BYZ-38` in
`apps/frontend/ios/App/App/Base.lproj/Main.storyboard` is an Xcode-generated
`viewController id`, a functional identifier that merely matches `[A-Z]{3,}-\d{2}`.

**Recommendation for the gate, not applied here:** `task-id` should become REPORT-only,
exactly as `milestone-ver` already is, and for the identical reason the script's own
header gives — the pattern cannot mechanically distinguish the class it should strip from
the class it must not. Changing a gate is not this plan's authority; it is recorded for
the operator.

## Exception 2 — `phase-ref` bare (11 occurrences). KEEP: these are not planning references

The pattern `phases?\s+\d+` matches domain step labels as readily as milestone phases —
Pitfall 6's problem in a different row.

| File | Occurrences | What it actually is |
|---|---:|---|
| `apps/supabase/benchmarks/scripts/run-concurrency-scaling.sh` | 5 | `# PHASE 1: JSONB Schema` / `PHASE 2: Relational Schema` — the benchmark's own two phases |
| `apps/supabase/supabase/tests/database/00-helpers.test.sql` | 2 | `-- Phase 1: Create persistent helper functions` / `-- Phase 2: Smoke tests` — pgTAP procedure steps |
| `packages/argument-condensation/src/core/condensation/condenser.ts` | 4 | `// PHASE 1: CREATE TREE NODES` … `PHASE 4` — the condensation algorithm's stages |

Renaming these to `STEP` would turn both rows green. It was not done, on purpose: the
text is correct as written, it has nothing to do with this project's planning vocabulary,
and rewriting correct domain prose so that a regex stops matching it is letting the tool
dictate the code — the same failure the KEEP verdict exists to prevent.

## The TODO class — the operator's answer, applied exactly

**Answer: `leave-and-record`, plus two named exceptions.** This is `leave-and-record`
with two specific carve-outs, NOT a fourth policy.

Three corrections to the question as originally posed, measured before it was answered:

1. The class is **TODO-only**. `FIXME`, `HACK` and `XXX` are each **0** in shipped source;
   the plan's "65 TODO/FIXME/HACK/XXX" over-specified it.
2. **5 of the 65 are not actionable markers.** Three are in *generated* files under
   `apps/docs/.../generated/` (mirrors of component-source comments, regenerated from
   their source). Two are prose mentions: `packages/argument-condensation/README.md:255`
   ("that is left TODO") and `tests/README.md:135`, which describes a TODO that **never
   existed** — *"this line previously asserted … a matching re-enable TODO marker in
   `playwright.config.ts`; neither existed in the tree — the claim was stale"*. That one
   is a correction record and is **deliberately preserved**; deleting the word would
   corrupt it.
3. **`-I` is not the only load-bearing flag — `-P` is too.** `git grep -E '\b(TODO)\b'`
   returns **0**, because git's ERE does not honour `\b`; the same pattern under `-P`
   returns 65. The Stage-1 note about `-I` is right but incomplete, and the next person
   to re-derive this count will hit the same trap.

| Disposition | Count | Action |
|---|---:|---|
| Left in place, recorded | 64 | none — locality was the deciding argument |
| Relabelled (not a TODO) | 1 | `mapRow.ts:7` |
| Recorded as a finding | 1 | `FeedbackGenerator.svelte:103`, in `151-DISPOSITION.md` |

```
$ git grep -c -I -P '\b(TODO|FIXME|HACK|XXX)\b' -- apps/ packages/ tests/   # 64 occurrences
$ git grep -l -I -P '\b(TODO|FIXME|HACK|XXX)\b' -- apps/ packages/ tests/   # 48 files
```

**Exception A — relabelled.** `apps/frontend/src/lib/api/adapters/supabase/utils/mapRow.ts:7`
read `TODO: RLS is responsible for preventing sensitive data leakage, not the mapper.`
That is not a TODO; it is a correct statement of where the responsibility lies, wearing a
TODO marker. The marker was replaced with `Note:` and the sentence kept verbatim.

**Exception B — recorded, not fixed.** `apps/frontend/src/lib/admin/components/jobs/FeatureJobs.svelte:103`
carries an admitted shipped bug (*"Past Jobs Section. Currently has a bug. TODO: fix bug
of not showing past jobs. If we even want to keep this section. Do we?"*). It sits at
D-05's fix bar as a **finding**, and it carries an unresolved product question. It is
recorded in `151-DISPOSITION.md` against checklist item 5 with the product question
surfaced to the operator. **It was deliberately not fixed and the question deliberately
not answered** — an agent answering "do we even want to keep this section?" would be
making a product decision it has no standing to make.

The rejected options are recorded with the reason: `triage` would have touched ~46 source
files for a non-blocking concern, inflating the exact diff this PR stack exists to make
reviewable, and would have destroyed locality (`TODO[Node 24]` sitting beside the polyfill
it will replace is worth more in place than in a tracker). `fix-blocking-only`'s triage
cost was already sunk — all 65 were read — and its yield was one code fix blocked on a
product question.

## REWRITE-WITH-CARE — ten sites, not the two the plan anticipated

The plan named the two frontend filter-context warnings. The file-by-file pass found
**eight more** planning references crossing the same trust boundary into user- or
operator-visible output. Every one is a checklist item 3 and item 10 finding and is
cross-referenced in `151-DISPOSITION.md`.

| # | Site | Surface | Before → after |
|---|---|---|---|
| 1 | `filterContext.svelte.ts:130` | runtime `console.warn` | `…not implemented in Phase 62 — see D-06 (future LLM chat follow-up).` → `…is not implemented: this build exposes a fixed filter set, so filters cannot be added at runtime.` |
| 2 | `filterContext.svelte.ts:135` | runtime `console.warn` | same shape, `removeFilter` |
| 3 | `apps/frontend/eslint.config.mjs:95` | ESLint rule `message:` | `…(v2.11 K1). … See .planning/v2.11-DECISIONS.md K1.` → `…banned in migrated contexts and routes. Use $state/$derived rune handles exposing \`current\` instead.` |
| 4 | `packages/dev-seed/src/cli/teardown-help.ts:34` | CLI `--help` text | `Permissive by design (D-58-17):` → `Permissive by design:` |
| 5 | `AccountsGenerator.ts:48` | runtime logger | `accounts are bootstrap-only per D-11.` → `accounts are bootstrap-only.` |
| 6 | `ProjectsGenerator.ts:48` | runtime logger | `projects are bootstrap-only per D-11.` → `projects are bootstrap-only.` |
| 7 | `NominationsGenerator.ts:174` | thrown `Error` message | `runs in D-06 topo order` → `runs in topological order` |
| 8 | `FeedbackGenerator.ts:65` + `writer.ts:196-197` | runtime logger | `disabled in Phase 56` → `disabled`; `skipped in Phase 56` → `skipped`; `Phase 58 may add direct upsert support` → `direct upsert support may be added later` |
| 9 | `tests/scripts/e2e-run.sh:251,445,456` | operator stdout | `(Phase 138, D-12)` and `(D-17)` removed from three echoed lines |
| 10 | `tests/scripts/determinism-batch.sh:530,533` | operator stdout | `(D-17)` removed from two `REASON=` strings |

### A rewrite that had to be re-decided, per PD-01

The first attempt at sites 8 reworded the messages more than the reference required
(`synthetic feedback disabled` → `synthetic feedback generation is disabled`, and
`feedback writes skipped` → `feedback writes are not supported`). Two unit tests assert on
those substrings and went red:

```
FAIL tests/generators/FeedbackGenerator.test.ts  expect(...).toContain('synthetic feedback disabled')
FAIL tests/writer.test.ts                        expect(logger).toHaveBeenCalledWith(stringContaining('feedback writes skipped'))
```

PD-01's trigger fired and the item was re-decided rather than the tests being edited to
match. Neither assertion depended on the phase reference — only on the semantic substring
— so the messages were re-cut to excise the reference and **preserve the asserted
wording**. Both tests pass untouched, and the resulting diff is strictly smaller. Editing
the assertions would also have worked and would have been worse: it would have moved a
test to fit a comment sweep.

## Damage the Stage-1 codemod left, repaired here

All 7 prose-review-queue lines were repaired. The pass also found the same failure in a
shape Stage 1 did not count: where the codemod stripped a `.planning/...` path from
mid-sentence it left an **empty backtick pair**, producing text like

```
 * analysis) lives in ` ` § Adjudication — the single
```

Eleven such sites were repaired across `tests/tests/helpers/navigation.ts`,
`assertTeardown.ts`, `forensicCapture.fixture.ts`, `views.ts`, `voterNavigation.ts`,
`eperm07-term-trigger.spec.ts` and `voter-journey.spec.ts`. They were not in the
prose-review queue because the codemod counted a rewrite as clean once the reference was
gone; "the reference is gone" and "the sentence still parses" are different properties.

## Gates — identical to `151-BASELINE.md`, not merely no worse

| Gate | Baseline | After Stage 2 | Verdict |
|---|---|---|---|
| `yarn build` | green | **14/14 tasks** | identical |
| `yarn test:unit` | 1522 passed / 149 files | **1522 passed / 149 files** | identical |
| `yarn lint:check` | 0 errors / 20 warnings | **0 errors / 20 warnings** (`TURBO_FORCE=1`) | identical |
| `yarn format:check` | red on 2 files | red on **exactly those 2 files** | identical |

The two format-red files remain `packages/dev-seed/src/templates/e2e/perm/perm-bankauth-notloc.ts`
and `tests/README.md`, both PD-03-fenced. **`yarn format` was deliberately NOT run**, a
documented deviation from this plan's action text carried forward from Stage 1: running it
would reformat the two fenced files this phase is not allowed to touch.

Scope was verified before commit: `git status` reported changes under `apps/`, `packages/`
and `tests/` only — nothing under `.planning/`, `.claude/`, `.agents/` or `CLAUDE.md`.

## Criterion 3 is CLOSED — and the gate is red on purpose

**Operator-approved 2026-08-17.** Criterion 3 is closed by this plan. Every judgement below
was put to the operator explicitly and agreed, not merely left unobjected-to.

### `--assert-clean` exits 1 BY DESIGN. That is the closed state, not an unfinished sweep.

A later reader — and in particular **plan 151-18** — must not treat the red gate as
outstanding work. The rule is:

> A red `--assert-clean` carrying **exactly** the two enumerated KEEP rows below is a
> **PASS** for criterion 3. A red gate carrying **any other** row is a genuine failure.

| Red row | Count | Why it is KEEP | Agreed |
|---|---:|---|---|
| `task-id` | 84 | `determinism-batch.sh:96` → `:493` matches the step title `EPERM-07 customData.terms` at `voter-journey.spec.ts:894` as a **functional string**. Stripping the ID leaves the determinism gate silently unable to find the step it measures, and no test would catch it. Also covers `BYZ-38`, an Xcode-generated storyboard `viewController id`. | ✅ |
| `phase-ref` (bare) | 11 | `# PHASE 1: JSONB Schema` (benchmark), `-- Phase 2: Smoke tests` (pgTAP), `// PHASE 1: CREATE TREE NODES` (condenser). Domain step labels, not planning references. | ✅ |

The operator's reasoning, recorded because it is the load-bearing part: **a red gate with
two named, measured, justified exceptions is stronger evidence for criterion 3 than a green
gate that was re-scoped until it passed.**

### The REPORT-only re-scope proposal — DEFERRED to plan 151-19, not applied

This plan recommended re-scoping `task-id` and `phase-ref` to REPORT-only, on the
`milestone-ver` precedent: the script's own header already concedes that a pattern which
cannot mechanically distinguish the class it should strip from the class it must not is a
report, not a gate. Both rows are now demonstrated members of that category.

**The proposal was rejected for this plan and deferred to 151-19**, where the ship procedure
is codified as a skill and gate design is the actual subject. The argument is recorded here
in full so 151-19 inherits it rather than rediscovering it:

> `milestone-ver` is REPORT-only because `v\d+\.\d+` matches `Yarn 4.13` and `Node 22.22.1`
> as readily as a milestone tag. `task-id` matches `BYZ-38` (Xcode) and every coverage ID
> that indexes this project's failure history. `phase-ref` matches a benchmark's own step
> labels. All three rows share one property: **the pattern cannot see the distinction the
> verdict depends on.** A gate that must be argued around at every run is a report wearing
> a gate's exit code.

Changing a gate was never this plan's authority. It is not changed here at all.

### The other two judgement calls, also explicitly agreed

**Decision-IDs stripped from ~40 unit-test titles — STANDS, do not revert.** Verified
independently: nothing selects tests by decision ID. The only machine-readable occurrence
anywhere in CI is a **comment** at `.github/workflows/main.yaml:194`, not a selector. The
titles remain descriptive without the IDs, and the stack exists to be read by reviewers who
have no access to D-numbers. This is the one place the "test titles are KEEP by default"
rule was overridden, and it was overridden on the decision-ID vs task-ID distinction —
every task-ID was kept.

**Rejecting the hyphenated `phase-56` form — ENDORSED.** It would have turned both red rows
green by evading the pattern, which requires whitespace. A reference spelled that way still
survives; it merely stops matching. The positive shape check (659 surviving phase refs, 648
in pointer form, 11 KEEP) is the instrument that makes that distinction, and is the reason
the shape check exists at all rather than an absence-only check.

### One correction to this plan's own acceptance criteria, accepted as recorded

The plan's Task 2 `<verify>` greps `(?i)phase\s+\d+` over
`apps/frontend/src/lib/contexts/filter/` **without a `see ` lookbehind**, so it would flag
the very `see phase N` form D-14 authorises. It was satisfied literally by making that
directory reference-free — the phase attribution added nothing a reader of those files
needs — but the criterion as written is stricter than the gate and than D-14.

## Final state, clause by clause

| Item | State |
|---|---|
| Clause 1 — surviving refs in collapsed pointer form | **MET** — 648/659 phase + 40/40 spike; the 11 remainder are not planning references |
| Clause 2 — no `[PR review]` tags | **MET** — measured 0 after the pass, not inherited |
| `.planning/` paths, `Plan NN-NN`, `§`, `D-NN`, `D-NN-NN` at zero | **MET** — 6 rows red → green this stage |
| `task-id` at zero | **KEEP** — recorded exception, operator-agreed |
| `phase-ref` bare at zero | **KEEP** — recorded exception, operator-agreed |
| TODO disposition | **MET** — answered, applied, recorded |
| Gates vs `151-BASELINE.md` | **MET** — identical on all four |
| **Criterion 3** | **CLOSED** |
