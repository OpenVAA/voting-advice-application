---
phase: 152-comment-naming-hygiene-sweep
plan: 13
subsystem: tests, dev-seed, frontend-tests, filters
tags:
  [test-titles, planning-reference-purge, coverage-id-fence, citation-chase, selection-safety, two-route-completeness, deferred-to-operator]
status: complete

# Dependency graph
requires:
  - phase: 152-comment-naming-hygiene-sweep
    provides: "152-05's residue register (classes A1+A2, 81 declined test-title occurrences) and `assert-comment-only-diff.mjs` with its `--allow` semantics — this is the one plan in the phase that legitimately needs them"
  - phase: 152-comment-naming-hygiene-sweep
    provides: "152-07's surfacing of the coverage-id question and 152-11's sharpening of it (VGATE-04/05 cited by the BLOCKING e2e-visual CI job)"
  - phase: 152-comment-naming-hygiene-sweep
    provides: "the accumulated scanner classes from 152-08 (four), 152-09 (ten), 152-11 (three) and 152-12 (dated walkthrough markers)"
provides:
  - "46 test titles across 24 files swept of planning references, in their own commit with no comment edit"
  - "the evidence-based split between planning references and E2E coverage ids, with both lists given and the method stated"
  - "the `task-id` gate row formally reported DEFERRED-TO-OPERATOR and registered as such"
  - "proof that no CI step selects unit tests by title (assumption A4 discharged) and that E2E selection is tag-based"
  - "a title-scoped transcription of the nine gate rows: eight of nine CLEAN, decision-id-bare closed 11 → 0"
  - "three scanner classes new to the phase: R-digit.digit requirement numbering, single-digit-suffixed ids, and capitals-plus-bare-digit artifact acronyms"
affects: [152-14, 152-15]

# Actuals (#2632)
actuals:
  tokens: 17475
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "Assert-once-per-replacement applier (inherited from 152-06/152-07), keyed on BYTE-EXACT old titles read back from the tree rather than transcribed: every anchor asserted to occur EXACTLY once in its file across the whole batch before any byte is written, so a drifted anchor aborts the batch instead of applying a subset"
    - "Citation chase as a classifier: build a corpus of the 1,400 textual files under tests/e2e-runs/ and substring-match every extracted test title VERBATIM against it — the registers store titles literally, so the test is exact rather than heuristic"
    - "Flip-test on a SCRATCH corpus rather than an injected tracked file — memo item 22's hazard avoided by construction, not by careful `git checkout`"

key-files:
  created:
    - .planning/phases/152-comment-naming-hygiene-sweep/152-TITLE-RENAMES.md
    - .planning/phases/152-comment-naming-hygiene-sweep/152-13-SUMMARY.md
  modified:
    - apps/frontend/src/lib/_guards/eslint-store-guard.test.ts
    - apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.test.ts
    - apps/frontend/src/lib/contexts/candidate/candidateContext.svelte.test.ts
    - apps/frontend/src/lib/contexts/filter/filterContext.svelte.test.ts
    - apps/frontend/src/lib/utils/matching/imputeParentAnswers.test.ts
    - packages/dev-seed/tests/assertKnownRowProps.test.ts
    - packages/dev-seed/tests/cli/resolve-template.test.ts
    - packages/dev-seed/tests/cli/teardown.test.ts
    - packages/dev-seed/tests/determinism.test.ts
    - packages/dev-seed/tests/generators/AppSettingsGenerator.test.ts
    - packages/dev-seed/tests/latent/centroids.test.ts
    - packages/dev-seed/tests/latent/clustering.integration.test.ts
    - packages/dev-seed/tests/latent/gaussian.test.ts
    - packages/dev-seed/tests/latent/latentEmitter.test.ts
    - packages/dev-seed/tests/latent/loadings.test.ts
    - packages/dev-seed/tests/latent/positions.test.ts
    - packages/dev-seed/tests/latent/project.test.ts
    - packages/dev-seed/tests/locales.test.ts
    - packages/dev-seed/tests/template.test.ts
    - packages/dev-seed/tests/template/linkSentinels.test.ts
    - packages/dev-seed/tests/template/permittedKeys.test.ts
    - packages/dev-seed/tests/templates/base-app-settings.test.ts
    - packages/dev-seed/tests/writer.test.ts
    - packages/filters/tests/filter.test.ts

key-decisions:
  - "The `task-id` gate row is reported DEFERRED-TO-OPERATOR — not met, and explicitly NOT an ordinary unsatisfiable-by-construction row. The phase's other unsatisfiable rows CANNOT be satisfied; this one COULD be and MUST NOT be."
  - "The two classes were separated by EVIDENCE, not by pattern shape. `D-07` and `EPERM-07` have identical shape and landed in different classes, which is the proof that shape was not the test."
  - "All 19 Playwright titles carrying coverage ids are quoted VERBATIM in the run registers (12–61 citing files each) and were left byte-identical. All 62 vitest coverage-id titles have zero register citations but stay with their family."
  - "`T-58-07-02` is class 1 by the evidence test and was still LEFT IN PLACE, because it is cited three times in packages/dev-seed/README.md as the name of the guard, and memo item 13 forbids this phase from repairing Markdown."
  - "The repo-wide gate exits 1 and was NOT adjusted. Every failing occurrence is attributed: 88 task-id = 70 fenced titles + 8 Markdown + 4 shell + 6 assertion strings; the sums are exact."
  - "The plan's estimate of 'roughly 23 anchored occurrences across 20 files' was measured wrong on both numbers — 46 renames across 24 files — and the plan's own acceptance grep uses `\\s` inside a POSIX ERE where it is undefined and matches nothing."

requirements-completed: []

coverage:
  - deliverable: "The rename queue, its selection-safety proofs and its per-title citation chase"
    verification:
      - kind: command
        ref: "test -f 152-TITLE-RENAMES.md && grep -q grep-invert && test -z \"$(git status --porcelain -- apps packages tests)\" — QUEUE BUILT, TREE UNTOUCHED"
        status: pass
      - kind: command
        ref: "verbatim-title scan over 1,400 textual files under tests/e2e-runs/: 19 of 49 candidate titles cited (12–61 files each), 46 of 46 renamed titles cited 0 times"
        status: pass
      - kind: command
        ref: ".github/workflows/main.yaml read end to end: unit invocations at :95 and :240 carry no -t / --testNamePattern / --grep; E2E at :289 and :370 select by tag"
        status: pass
    human_judgment: false
  - deliverable: "46 test titles renamed in their own commit, isolated from any comment edit"
    verification:
      - kind: command
        ref: "assert-comment-only-diff.mjs --range cc319db17~1..cc319db17 with 24 --allow entries: 24 changed, 24 allowed by name, 0 violations, exit 0"
        status: pass
      - kind: command
        ref: "flip test — identical range, ZERO allow entries: 24 violations, exit 1 (the prover sees and names every one)"
        status: pass
      - kind: command
        ref: "git show cc319db17 | grep -cE '^[+-]\\s*//' == 0; git diff --stat cc319db17~1..cc319db17 -- tests/playwright.config.ts empty; 24 files / 46 insertions / 46 deletions"
        status: pass
      - kind: command
        ref: "yarn test:unit — 1,835 passed / 0 failed / 0 skipped / 0 todo / 173 files, identical to the pre-rename baseline per workspace and in total"
        status: pass
    human_judgment: false
  - deliverable: "No test title in apps/, packages/ or tests/ carries a planning reference"
    verification:
      - kind: command
        ref: "title-scoped transcription of hygiene-grep-report.sh:150-163 over 1,913 extracted titles — phase-ref 0, spike-ref 0, decision-id-long 0, decision-id-bare 0 (was 11), section-anchor 0, planning-path 0, plan-number 0; task-id 70 = the fenced set"
        status: pass
      - kind: command
        ref: "flip test — one probe injected into the SCRATCH corpus: 8 rows go red, task-id 70 → 71"
        status: pass
      - kind: command
        ref: "git grep -P over titles for '[Pp]hase\\s*[0-9]' — no output, exit 1"
        status: pass
    human_judgment: false
  - deliverable: "The E2E coverage ids left byte-identical, both classes distinguished by evidence"
    verification:
      - kind: command
        ref: "git diff --stat over tests/e2e-runs/ across all three commits — empty; no register edited"
        status: pass
    human_judgment: true
    rationale: "Whether the phase should sweep coverage ids at all is an operator ruling, deliberately not taken. The mechanical claim (nothing was altered) is verified; the disposition is not."
  - deliverable: "Build, lint and comment-hygiene gates green"
    verification:
      - kind: command
        ref: "yarn build exit 0 (14/14 tasks); yarn lint:check exit 0 (svelte-check 0/0, i18n + a11y-wiring + comment-hygiene guards 0 violations); node scripts/assert-comment-hygiene.mjs exit 0 (1,560 files, 0 violations)"
        status: pass
    human_judgment: false

duration: 20 min
completed: 2026-08-29
---

# Phase 152 Plan 13: Test-Title Renames Summary

46 test titles across 24 files stripped of planning references — research pitfall numbers, criterion
numbers, decision ids, a risk id, UAT gaps, assumptions, `TIR3`, `RES-1`, `P01`, `R3.3`, `Bug 1` and
one bare `Plan 05` — in a commit containing no comment edit, while every E2E coverage id was left
byte-identical and the `task-id` gate row was reported **DEFERRED-TO-OPERATOR**.

---

## 1. The decision this plan was told not to take, and did not take

The plan's own text and the residue register both point at **81 declined test-title occurrences**
(classes A1 + A2) as the authoritative rename queue. **Not one of them was renamed.** Every one is an
E2E coverage id, and the phase memo, `152-07` and `152-11` all fence that question for the operator.

**The queue turned out to contain only work this plan must not do, and all the work it must do lay
outside the queue.** That inversion is the plan's most important finding and it is stated in
`152-TITLE-RENAMES.md` § 4.1 rather than smoothed over.

### 1.1 How the two classes were told apart — by evidence

Three sources were consulted **per token**, and shape was never used as the test:

| Source | Scanned | Method |
|---|---|---|
| E2E run registers | **1,400 textual files** under `tests/e2e-runs/` (`results.json`, `list.txt`, `stdout.log`, `durations.csv`, ledgers) — the 6.8 GB tree minus traces and video | exact **verbatim title** substring match |
| CI | all of `.github/` | per-token literal search |
| In-tree Markdown | every tracked `*.md` outside `.planning/` and `.claude/` | per-token word-boundary search |

The registers store titles **literally**, which makes the test exact rather than heuristic:

```
tests/e2e-runs/140-f3-measure/results.json:3258:  "title": "18.5. EQTYP-01: multi-choice opinion — …"
tests/e2e-runs/146-noise/list.txt:140:  … › @probe default-template results surface (TMPL-03, criterion 1) › parties list is non-empty @probe
```

**The proof that shape was not the test:** `D-07` and `EPERM-07` are the same shape and landed in
different classes. `grep D-07 tests/e2e-runs/` returns 11 files — but every hit is the
**candidate-journey Playwright title**, a *different* `D-07`, in a title that is fenced anyway. The
`packages/dev-seed` `D-07`s are another phase's decision ids with zero register footprint.
Shape-matching would have fused them; the citation chase separated them.

### 1.2 Class 2 — FENCED, left byte-identical (the full list)

**70 occurrences across 38 test titles**, on four independent grounds:

| Ground | Ids |
|---|---|
| **(a) verbatim run-register citation** — all 19 Playwright titles, **12–61 citing register files each** | `EFLOW-01/02/06/08/09/11`, `EPERM-03/04/07/09/10/11`, `EQTYP-01/02`, `UNBLK-04`, `TMPL-03` |
| **(b) a BLOCKING CI job** | `VGATE-04/05` (the `e2e-visual` provenance record, per `152-11`); `NF-01` in a CI **step name** at `main.yaml:239`; `TMPL-07` in a step comment at `:237` |
| **(c) an in-tree Markdown cross-reference the phase may not repair** | `TMPL-03`, `GEN-04`, `NF-02` (`packages/dev-seed/README.md`); `CR-01` (`tests/README.md`, `tests/IDURA-TEST-RUNBOOK.md`) |
| **(d) family coherence** — no citation of their own, but half a stripped vocabulary is worse than either consistent choice | `TMPL-02/08/09`, `GEN-08/09/10`, `GEN-06a…g`, `CLI-03/04`, `ASSERT-04/08`, `RUNES-05`, `CLEAN-04`, `WR-04`, `IN-01` |

Plus two sites fenced on ground (c) alone, and one fenced three ways:

- **`T-58-07-02`** at `packages/dev-seed/tests/cli/teardown.test.ts:379` and `:387`. **This is class 1
  by the evidence test** — a STRIDE threat-register id with 0 register citations, 0 CI citations and
  4 `.planning/` mentions. It was still left in place, because it is cited **three times** in
  `packages/dev-seed/README.md` (`:67`, `:303`, `:336`) as the *name of the guard*, and memo item 13
  forbids this phase from repairing Markdown. Same shape as `152-12`'s ASVS disclosure control: the
  correct edit was **none**, and the exemption is made legible rather than left looking like an
  oversight.
- **`'@probe default-template results surface (TMPL-03, criterion 1)'`** — register-cited verbatim,
  carries `TMPL-03`, **and** contains the `@probe` tag that `--grep-invert @probe` selects on. Its
  `criterion 1` fragment is class 1 and would otherwise have been row 47.

### 1.3 Class 1 — SWEPT (the full list)

46 rows, table in `152-TITLE-RENAMES.md` § 4. By class:

| Class | Sites |
|---|---:|
| research **Pitfall** numbers (`Pitfall #1`, `Pitfall 4 defensive`, `Pitfall-like edge`) | 21 |
| **decision ids** `D-01`, `D-03a`, `D-04`, `D-05`, `D-06`, `D-07`, `D-09` | 11 |
| planning **criterion** numbers (`criterion 4`, `Success Criterion 5`) | 2 |
| **UAT gap** ids | 2 |
| **assumption** ids (`assumption A3`, `A2 fix`) | 2 |
| sub-two-digit ids (`RES-1`, `P01`), `R3.3` | 3 (2 anchors + 1 rider) |
| **risk register** (`Risk #7`) | 1 |
| planning-artifact acronym (`TIR3`) | 1 |
| plan-internal structure (`Bug 1`, `RED until :378 fix`) | 2 |
| bare plan number (`Plan 05`) | 1 |

**`packages/filters/tests/filter.test.ts:315` is the site the plan exists for** — review comment #4,
*"Never use planning references in test names."* The comment above it had already been de-cited by an
earlier wave-4 plan; the **title** was left for this plan, and `TIR3` was its last planning reference.

### 1.4 Conflict between the fence and this plan's own text — recorded, not resolved

`152-13-PLAN.md`'s objective directs the executor to build the rename queue **from the residue TSV**
and to rename its `describe`/`it`/`test` rows. Every one of those rows is a coverage id. Following
that instruction literally would have stripped ids that a **blocking merge check** cites.
**The fence supersedes the instruction**, per the dispatch's explicit direction, and the conflict is
recorded here rather than resolved: the queue was built from the TSV as instructed, every row was
classified, and the classification — not the instruction — decided what moved.

---

## 2. Selection safety — proven, not assumed

**Assumption A4 discharged.** `152-RESEARCH.md` flags it as verified for Playwright but **not** for
vitest. `.github/workflows/main.yaml` read end to end: exactly two unit invocations, both unfiltered
(`main.yaml:95` `yarn test:unit`; `main.yaml:240`
`yarn workspace @openvaa/dev-seed test:unit`). `test:unit` = `yarn assert:unit-coverage && turbo run
test:unit`. No `-t`, no `--testNamePattern`, no positional filter. The pre-gate
`scripts/assert-unit-test-coverage.mjs` selects **workspaces and script bodies**, never a title.
**The stop-and-record branch did not fire.**

**E2E selection is by tag.** `--grep-invert @probe` (root) and `--grep "@visual"` (the blocking
visual job). **The caveat was honoured rather than assumed:** Playwright's `--grep` matches the title
chain, and a `@tag` written *inside* a title is part of that chain — so a title containing `@probe`
or `@visual` IS selection-bearing. Measured: exactly one queued title contains a tag, and it is
fenced on three independent grounds, so the caveat never becomes live.

**And the strongest structural fact:** **no Playwright title changed at all.** All 19 are fenced.
No spec, project or `--grep` selection can have moved.

---

## 3. Completeness — both numbers, per rewrite site, two routes

Unit: **rewrite site**. No row is a multi-line rewrite, so per-site and per-line agree at 46 — stated
so it can be compared against sibling plans that had to distinguish them.

| Route | Sites | Fenced | Renamed |
|---|---:|---:|---:|
| **A — nine gate rows / the residue TSV's A1+A2 queue** | 81 occurrences | **81** | **0** |
| **B1 — widened scanner** (23 classes: 152-08's four, 152-09's ten, 152-11's three, 152-12's dated-marker class, plus this plan's own) | 122 title sites | 81 tokens | 13 |
| **B2 — deliberate read** of all **1,913** extracted titles, filtered to 408 by a planning-vocabulary/digit heuristic and read end to end | — | 2 | **33** |

**Gate blind spot: 33 of 46 renamed sites — 72%, the highest in the phase.** Series across all eight
partitions: **27 / 64 / 54 / 37 / 30 / 67 / 72 %.** It has never been zero.

It is highest here for a structural reason worth recording: **this plan's partition is exactly the
surface the gate was built to see (ids), so everything the gate sees is fenced and everything the
gate cannot see is the work.**

**Memo item 17's agreement trap sprang again:** the nine gate rows and the residue register agree
*exactly* at 81 over this partition, and 33 real sites sit outside both.

### 3.1 Three scanner classes new to the phase — carried to 152-14 / 152-15

1. **`R\d+\.\d+` requirement numbering** — `R3.3`.
2. **Single-digit-suffixed ids** — `RES-1`, `P01`. Both defeat the register's `\b[A-Z]{2,}-\d{2}\b`
   floor by having only one digit.
3. **Capitals-plus-BARE-digit artifact acronyms** — `TIR3`. No hyphen at all, so it defeats every
   id-shaped row and every widened class registered so far. It also fires on **comments** outside
   this plan's scope (see § 6).

---

## 4. What was proved, and how

### 4.1 The behaviour-neutrality prover

| Run | Result |
|---|---|
| `--range cc319db17~1..cc319db17` **with 24 `--allow` entries, one per rename-table file and no others** | 24 changed · compared 0 · **allowed by name 24** · **0 violations** · **exit 0** |
| **Flip test** — identical range, **zero** allow entries | 24 compared · **24 violations** · exit 1. Each is a title line and the prover names it. |
| `--range d312957b3~1..cc319db17` (plan start through the rename) | 25 changed · **1 violation** — `152-TITLE-RENAMES.md` itself, because the classifier maps `md` to an empty comment family |

**The range is bounded at the last refactor commit `cc319db17`, not at `HEAD`, and that is
deliberate** (memo item 16): `..HEAD` would sweep `.planning/**.md` into the compared set and report
one violation per file — a scoping artefact of the range, not a property of the diff. **No allow
entry was added for any `.planning/` path.**

This is the one plan in Phase 152 that legitimately changes non-comment bytes in the swept trees. The
24 allow entries are the price, each named on the command line so the exclusion appears in the
command a reviewer reads — and the flip test shows an unlisted one would have been caught.

### 4.2 The title-scoped nine rows, and the repo-wide gate that is not green

**`hygiene-grep-report.sh --assert-clean` exits 1, and the gate was NOT adjusted.** Per the plan's
own instruction, every failing occurrence is attributed instead:

| Row | Occ | Attribution |
|---|---:|---|
| `task-id` | 88 | **70 fenced coverage ids in test titles** + 8 Markdown (memo 13) + 4 shell strings (residue B2/E) + 6 assertion / skip diagnostics (residue D). **Sums exactly.** |
| `phase-ref` | 21 | 12 Markdown + 5 benchmark `echo "--- PHASE 1: JSONB SCHEMA ---"` stage markers (152-12, correct as written) + 2 pgTAP file-stage comments |
| `decision-id-bare` | 2 | 1 Markdown + 1 operator-facing `echo` (residue B2) |
| `section-anchor` | 5 | all Markdown — **three of the five are OFL 1.1 LICENCE sections** and must survive any ruling |
| `planning-path` | 1 | a `throw new Error(...)` pointing at a live operator diagnostic (residue F) |

**Not one failing occurrence is a test title carrying a planning reference.** That property — the one
this plan actually owes — was proved by a **named alternate route**: the nine patterns transcribed
verbatim from `hygiene-grep-report.sh:150-163` (**the script was not modified**; it hardcodes its
scope deliberately and exits 2 on a caller-supplied pathspec — memo item 2) applied to the 1,913
extracted titles:

```
  phase-ref 0 OK · spike-ref 0 OK · decision-id-long 0 OK · decision-id-bare 0 OK
  section-anchor 0 OK · planning-path 0 OK · plan-number 0 OK · milestone-ver 0 REPORT
  task-id 70 FAIL  ← the fenced coverage ids, and only those
```

**`decision-id-bare` was 11 over 5 files before the renames and is 0 after — that row was closed by
this plan.**

**Flip-tested.** A probe carrying `phase 999`, `spike 7`, `D-152-04`, `D-77`, `§`, `.planning/x.md`,
`plan 12-34` and `ZZZZ-99` was injected **into the scratch corpus, never into a tracked file** —
memo item 22's hazard avoided by construction rather than by careful `git checkout`. Eight rows go
red; `task-id` moves 70 → 71. The instrument reads.

### 4.3 Gates

| Gate | Result |
|---|---|
| `yarn build` | **exit 0** — 14/14 tasks |
| `yarn test:unit` | **exit 0** — **1,835 passed / 0 failed / 0 skipped / 0 todo / 173 files**, identical to the pre-rename baseline **per workspace and in total** |
| `yarn lint:check` | **exit 0** — svelte-check 0 errors / 0 warnings; i18n, a11y-wiring and comment-hygiene guards 0 violations |
| `node scripts/assert-comment-hygiene.mjs` | **exit 0** — 1,560 files, 0 violations |
| `hygiene-grep-report.sh --assert-clean` | **exit 1** — 5 rows, every occurrence attributed above; the version row stayed report-only |

**The full E2E suite was NOT run, and that is this plan's own instruction, not an omission.** The
phase's single cardinal-gate run belongs to **`152-15`**, after the forced-line-break sweep lands.
`152-05` discharged it at 150 passed / 0 failed / 0 flaky / 0 did-not-run, exit 0. For this plan the
structural evidence is stronger than a re-run: **no Playwright title changed**, so nothing the E2E
runner reports or selects can have moved; and the unit suite — the only one whose titles changed —
returns the identical count.

**Register cross-references:** `git diff --stat -- tests/e2e-runs/` is empty across all three
commits. **No register was edited.** 17 of the 46 renamed titles are quoted verbatim in planning
records (46 citing-file references across `WINDOWS.md`, six phase directories and one
`.planning/quick/` session record); those are historical evidence and were deliberately left to read
as they were written.

---

## 5. Deviations from Plan

### 1. [Rule 2 — missing critical] The plan's acceptance grep matched nothing as written

`git grep -nEi "^\s*(describe|it|test)…"` uses `\s` inside a **POSIX ERE**, where `\s` is undefined —
the pattern silently matches nothing, so the criterion would have passed vacuously. Re-run with `-P`.
It returns 93 lines, every one classified in `152-TITLE-RENAMES.md` § 5.4 (84 fenced coverage ids,
7 JOSE algorithm names `RS256`/`RSA-OAEP-256`, 4 perm-dataset entity labels `EL1`/`CG-2`). The plan's
own queue-building grep has the same defect plus the under-counting anchor its objective already
flags. **No file changed**; the finding is a measurement correction.

### 2. [Rule 1 — bug] The plan's stated coverage was wrong on both numbers

"Roughly 23 anchored occurrences across 20 files" → measured **46 renames across 24 files**. Trusted
own measurement over the inherited number, per the memo's standing item.

### 3. [Rule 3 — blocking] The prover's `--allow` list was silently ignored on first invocation

`node … --range X $ALLOWS` under **zsh**, which does **not** word-split unquoted parameters, passed
all 24 flags as ONE argument. The prover reported `allowed by name: 0` and 24 violations — a false
red that would have read as a genuine failure. Re-run with a proper argument array: `allowed by
name: 24`, 0 violations, exit 0. Recorded because the failure mode is silent and the false red is
indistinguishable from a real one at a glance.

**Total: 3 deviations** (1 × Rule 1, 1 × Rule 2, 1 × Rule 3) — all measurement/tooling corrections;
zero production-code deviations.

---

## 6. Registered rather than fixed — `.planning/WINDOWS.md` entries 120–123

| id | kind | What |
|---:|---|---|
| **120** | `unmet-truth` | **The `task-id` row, DEFERRED-TO-OPERATOR.** Full evidence table, the distinction from an ordinary unsatisfiable row, and the ruling owed: *does the phase strip E2E coverage ids from test titles at all, and if so who repairs the run registers, the blocking `e2e-visual` provenance record and the three in-tree READMEs?* |
| **121** | `deviation` | `T-58-07-02` left in two titles despite being class 1 by evidence — the Markdown ground (§ 1.2). |
| **122** | `unmet-truth` | **A third, previously unregistered Markdown site for memo item 13:** `tests/README.md` (3 phase-refs) and `tests/IDURA-TEST-RUNBOOK.md` (2 phase-refs + 2 task-ids). `152-08` registered `packages/dev-seed/README.md`; `152-11` registered `apps/frontend/static/fonts/README.md`; these two belong to no plan's entry. Also flags that **three of the five `§` occurrences in `fonts/README.md` are OFL 1.1 licence sections** and must survive any ruling. |
| **123** | `deviation` | **Out-of-scope comment findings**: `EnumeratedEntityFilter.svelte:126,160` carry `TIR3` in **comments** (152-11's prefix, which reported 0 on all nine rows); `clustering.integration.test.ts:97` carries `B2 fix` (152-08's prefix). Plus the three new scanner classes for 152-14/152-15. |

Also noted, not registered: `NominationsGenerator.test.ts:86`'s title carries `per migration line
724-731`, an in-tree **line-range pointer** — not a planning reference, flagged only because memo
item 21 makes such pointers a known dangling-reference hazard.

**`REVIEW-HYG-02` was NOT marked complete.** `requirements.ready-ids` returns **0/1** — `152-14` and
`152-15` declare the same id and have no SUMMARY yet. The shared-ID gate is correct to hold it.

---

## 7. For 152-14 and 152-15

- **`152-14`** (forced line breaks): the split-across-a-line-break class now has a **third** sighting
  context — titles are single-line by construction, so the class lives entirely in comments. The
  three new scanner classes in § 3.1 are yours to carry.
- **`152-15`** (the guard + the cardinal E2E gate): **no Playwright title changed**, so the run
  registers stay valid as evidence and no spec selection moved. The unit suite is at 1,835/173,
  identical to the pre-plan baseline. The `task-id` row will still be red repo-wide when you run the
  closing gate — that is entry 120, not a miss.
- **The operator** owes rulings on entries **120** (coverage ids — now with the full evidence table),
  **121** (`T-58-07-02`), **122** (Markdown, third site), and the earlier entries 109/110/111.

---

## Self-Check: PASSED

- `152-TITLE-RENAMES.md` — FOUND
- `152-13-SUMMARY.md` — FOUND
- all 24 modified test files — FOUND, each present in `git show --name-only cc319db17`
- `d312957b3` — FOUND · `cc319db17` — FOUND · `99ebd5903` — FOUND
- every task's `<acceptance_criteria>` re-run: Task 1 all 6 pass; Task 2 all 7 pass with the two
  measurement corrections recorded as deviations 1 and 3; Task 3 four of five pass and the fifth
  (`--assert-clean` exits 0) is reported failing with a full occurrence-level attribution and a named,
  flip-tested alternate route, per the plan's own instruction not to adjust the gate.
