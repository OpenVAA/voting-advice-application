# Phase 152 — pre-sweep BASELINE

> **What this file is.** The fixed pre-sweep state every later plan in Phase 152 is measured
> against. Recorded by `152-02` on **2026-08-28**, at commit `1e1f8e6ea` (branch
> `integration/ship-12-squash`), against the tree as it stands *after* `152-01` landed and
> *before* any sweep commit.
>
> **What it is not.** It is not an estimate and it is not inherited. Every figure in §§ 1-3 was
> produced by running a committed instrument in this session and is reproduced verbatim. Where a
> figure IS inherited (the span-level shape in § 4), that is stated at the figure, with its
> provenance and its measurement point, so a later reader can tell the two apart without asking.

---

## 1. The trap, demonstrated as a paired run

This is the evidence for `T-152-05`, and it is the *pair* that is the evidence — not the
retargeted script's red. Both scripts were run against the same tree, in the same session,
minutes apart. They read the same nine patterns over the same pathspec `-- apps/ packages/ tests/`.
**The only difference between them is which column the `survivor)` verdict arm reads.**

### 1a. The UNMODIFIED original — `.claude/skills/ship-review-stack/sources/hygiene-grep-report.sh`

```
Planning-Reference Hygiene Report -- criterion 3
===============================================
scope   : apps/ packages/ tests/   (CLAUDE.md, .agents/, .claude/ exempt per D-15)
mode    : report

  pattern               occ   files    bare  expect     verdict
  -----------------  ------  ------  ------  ---------  -------
  phase-ref             746     261     104  bare = 0   FAIL
  spike-ref              40      30       0  bare = 0   OK
  decision-id-long        1       1       -  occ = 0    FAIL
  decision-id-bare       78      27       -  occ = 0    FAIL
  section-anchor         21       8       -  occ = 0    FAIL
  planning-path          11       7       -  occ = 0    FAIL
  plan-number             1       1       -  occ = 0    FAIL
  milestone-ver          50      33       -  -          REPORT
  task-id               123      60       -  occ = 0    FAIL

  planning-reference total (8 rows, comparable to the research loop) : 948
  task-id supplementary (no counterpart in that loop)                : 123
  union files touched by any row                                     : 299

---
Gate rows failing: 7  (milestone-ver is report-only and never counted)
```

**⚠ THE ROW THAT IS THE WHOLE POINT, quoted on its own so it cannot be skimmed past:**

```
  spike-ref              40      30       0  bare = 0   OK
```

A gate reporting **OK** over **40 live violations** of this phase's criterion, in 30 files. It
reports OK because all 40 are already in the collapsed `see spike N` form, so `bare` is 0 — and
`bare` is the only column that arm ever reads. `phase-ref` is the larger case and is only
*accidentally* red: it is red on its 104 un-collapsed occurrences while its **642 collapsed
ones are invisible to the verdict**.

### 1b. The RETARGETED copy — `.planning/phases/152-comment-naming-hygiene-sweep/scripts/hygiene-grep-report.sh`

```
Planning-Reference Hygiene Report -- Phase 152 criterion 2 (REVIEW-HYG-02)
=========================================================================
scope   : apps/ packages/ tests/   (CLAUDE.md, .agents/, .claude/ exempt per D-15)
mode    : report

  pattern               occ   files    bare  expect     verdict
  -----------------  ------  ------  ------  ---------  -------
  phase-ref             746     261     104  occ = 0    FAIL
  spike-ref              40      30       0  occ = 0    FAIL
  decision-id-long        1       1       -  occ = 0    FAIL
  decision-id-bare       78      27       -  occ = 0    FAIL
  section-anchor         21       8       -  occ = 0    FAIL
  planning-path          11       7       -  occ = 0    FAIL
  plan-number             1       1       -  occ = 0    FAIL
  milestone-ver          50      33       -  -          REPORT
  task-id               123      60       -  occ = 0    FAIL

  planning-reference total (8 rows, comparable to the research loop) : 948
  task-id supplementary (no counterpart in that loop)                : 123
  union files touched by any row                                     : 299

---
Gate rows failing: 8  (milestone-ver is report-only and never counted)
```

`bash …/scripts/hygiene-grep-report.sh --assert-clean` → **exit 1** against this tree.

### 1c. The invariant that makes the pair evidence rather than two runs

| Held constant across both runs | Changed |
|---|---|
| The tree (same commit, `git status --porcelain -- apps packages tests` empty before and after) | The `survivor)` arm's tested column: `$bare` → `$occ` |
| The nine patterns, character for character | The `expect` string it prints: `bare = 0` → `occ = 0` |
| The pathspec `-- apps/ packages/ tests/`, written out at all nine call sites | — |
| The `bare` computation and the `bare` column (still computed, still printed) | — |
| `milestone-ver`'s `report` disposition | — |

Exactly **one** row flips verdict — `spike-ref`, `OK` → `FAIL` — and the failing-row count goes
`7` → `8`. The flip is attributable to the tested column and to nothing else.

**Live confirmation of the collapsed-form share** (`git grep -I -h -o -P` over the same pathspec):

| Quantity | Value |
|---|---:|
| `see phase N` occurrences (the collapsed survivor form) | **642** in 224 files |
| `see spike N` occurrences | **40** — i.e. **every** spike reference in the tree is already collapsed |
| Therefore invisible to the inherited gate | **682** occurrences |

---

## 2. The codemod dry run — the residue table

`node .planning/phases/152-comment-naming-hygiene-sweep/scripts/hygiene-codemod.mjs --quiet`,
verbatim. Wrote nothing; `git status --porcelain -- apps packages tests` empty afterwards.

```
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
    ambiguous-reference           9
    attributive-reference        27
    phase-ref-deferred          694
    spike-ref-deferred           40
    files carrying residue      318

  prose-review flags (rewritten, but the sentence needs a human): 0

  arithmetic (hits + residue == total): OK

MODE: DRY-RUN (no file on disk was modified)
```

Reading it:

- **`phase-ref 0` and `spike-ref 0` in the HIT table is the inversion working**, not the class
  being absent. The same occurrences appear below, in residue, under `phase-ref-deferred 694`
  and `spike-ref-deferred 40` (plus `attributive-reference 27` and `ambiguous-reference 9`,
  which are the same class under exclusions (h) and (g)). Nothing in the phase/spike class is
  rewritten by machine.
- **`markdown-file 0`** is scope narrowing (2) working: the source's default globs produced 40
  such rows.
- **The judgement-pass queue for the phase/spike class is `694 + 40 + 27 + 9 = 770`
  in-comment occurrences across 263 distinct files.** The report's `746 + 40 = 786` counts the
  same class over *raw text*; the 16-occurrence difference is what the classifier correctly
  refuses to call a comment (string literals, attributes, test titles) and is carried in
  `not-a-comment-span 98`.
- **`arithmetic OK` proves completeness, not correctness.** It says every occurrence the pattern
  set found was classified exactly once. It says nothing about whether any classification was
  right. `.claude/skills/ship-review-stack/SKILL.md:265` records six Phase-151 artifacts that
  were self-consistent and wrong with this line green throughout.

### Machine-readable row baseline

Written by `--save-baseline`. A later run passed this TSV as its positional argument gains
`base` and `delta` columns, making the pre- and post-sweep runs one record. Reproduce with
`bash …/scripts/hygiene-grep-report.sh --save-baseline <path>`; the content at this commit is:

```tsv
phase-ref	746	261
spike-ref	40	30
decision-id-long	1	1
decision-id-bare	78	27
section-anchor	21	8
planning-path	11	7
plan-number	1	1
milestone-ver	50	33
task-id	123	60
```

---

## 3. ⚠ THE BASELINE MOVED DURING THIS PHASE, AND THIS PHASE MOVED IT

`152-RESEARCH.md` § 4.1 recorded `phase-ref occ 744 / bare 102` at HEAD `22c2542e3`. This
session measures `746 / 104`. The **+2 is not drift and not a measurement discrepancy** — it is
`152-01`'s own commit:

```
git diff --stat 22c2542e3..HEAD -- apps packages tests
 .../entityCard/EntityCardAction.svelte             |  2 +-
 packages/dev-seed/tests/ciTypecheckGate.test.ts    | 27 ++++++++++++++++++++++
```

The 27-line block `152-01` added to `packages/dev-seed/tests/ciTypecheckGate.test.ts` is a
comment, and it cites `Phase 152` and `Phase 147`. Both are bare, so `occ` and `bare` each rise
by exactly 2. (`phases (153-164)` on the same block does *not* match `\bphases?\s+\d+` — the
parenthesis intervenes.)

**Recorded because the direction of travel matters more than the two occurrences.** A phase
sweeping planning references out of the code is simultaneously writing new ones in, from its own
guard docblocks and test comments. `scripts/` is out of the swept trees and is fine;
`packages/dev-seed/tests/` is **in** them. Every later plan in this phase — and the eleven
phases queued behind it — must treat the swept trees as live: the sweep is measured against
*this* baseline, not against RESEARCH's, and a plan that writes a `Phase NNN` citation into
`apps/`, `packages/` or `tests/` reopens the class it is closing.

---

## 4. Span-level shape — the unit judgement work is actually done in

**PROVENANCE: measured in `152-RESEARCH.md` § 4.4 at HEAD `22c2542e3`. NOT re-measured by this
plan.** Lines are the wrong unit for sizing the judgement pass — a five-line narrative block is
one decision, not five — but span identity needs the classifier's per-file state, and the
committed instruments report per *occurrence*, not per span. The figures are carried here so
later plans have them in one place; they are marked inherited so nobody mistakes them for a
fresh reading.

| Quantity | Value |
|---|---:|
| Comment **spans** containing ≥1 planning reference | **642** (apps 235 · packages 238 · tests 169) |
| Distinct files | **278** |
| Spans where every line is a reference line | 85 |

Span-length histogram (non-blank comment lines per span):

| Length | Spans | Likely disposition |
|---|---:|---|
| 1 line | 84 | mostly pure-reference — mechanical strip, near-zero judgement |
| 2-3 | 106 | strip-citation-keep-sentence |
| 4-6 | 133 | mixed |
| 7-12 | 119 | mixed; the rewrite-not-delete class concentrates here |
| **13+** | **200** | the heavy narrative blocks — the real work, ~31% of spans |

**Concentration.** RESEARCH's top-20 is led by `tests/playwright.config.ts` at **52 reference
spans / 74 reference lines** — 8% of the whole judgement surface in one file, and it should be
its own task.

**Live cross-check on the concentration, from this session's residue TSV** (in-comment reference
*lines* per file, which is a different unit from RESEARCH's spans and will not match it
numerically — it is here to confirm the *shape* and the leader, not to restate the figure):

```
  64  tests/playwright.config.ts
  18  packages/dev-seed/src/templates/e2e/base.ts
  16  tests/tests/specs/voter/voter-journey.spec.ts
  16  packages/dev-seed/tests/integration/default-template.integration.test.ts
  14  apps/frontend/src/lib/contexts/app/appContext.svelte.ts
  12  packages/dev-seed/src/writer.ts
  11  tests/tests/setup/shared/assertTeardown.ts
  10  packages/dev-seed/src/generators/CandidatesGenerator.ts
  10  apps/frontend/src/lib/contexts/voter/voterContext.svelte.ts
   9  tests/tests/helpers/navigation.ts
```

Same leader, same order of magnitude, same clusters (`dev-seed`, `frontend/lib/contexts`,
`tests/`). A later plan that needs span-exact numbers must re-measure rather than quote § 4.

---

## 4b. Forced line breaks (D-A4) — live, and against the ruling's figures

`node …/scripts/unwrap-comment-paragraphs.mjs --report`, measured this session. The operator's
`152-LINEBREAK-RULING.md` was made on `152-RESEARCH.md` § 1.1's figures; `152-14` Task 1 must
confirm the live figures do not materially contradict them. They do not.

| Quantity | Ruling (RESEARCH § 1.1) | Live, this session | Δ |
|---|---:|---:|---:|
| Wrapped-prose junctions (the target class) | 14,094 | **14,171** | +0.5% |
| Wrapped paragraphs | 5,550 | **5,576** | +0.5% |
| Files touched | 747 | **742** | −0.7% |
| Non-blank comment corpus | 45,709 | **45,733** | +0.05% |
| Joined length p50 / p90 / max | 185 / 418 / 1,780 | **190 / 420 / 1,738** | ~1% |
| `--gratuitous-only` (joins to ≤ 120 chars) | 1,113 paragraphs | **933 paragraphs / 1,131 junctions** | — |

Per tree: apps 4,090 · packages 4,105 · tests 5,976. Comment lines affected by a join
(junctions + paragraphs): **19,747**.

Excluded-category counts, from the instrument's own report. The **paragraph-break** row is the
operator ruling's Amendment 1, promoted here from an incidental line in the reference predicate
to a named, fixture-tested rule with its own row:

| Codified exclusion | Live count |
|---|---:|
| `banner-rule` | 510 |
| `list-item` | 1,298 |
| `jsdoc-tag` | 429 |
| `hanging-indent` | 450 |
| `comment-table` | 34 |
| **`paragraph-break`** (Amendment 1) | **4,201** |
| `block-delimiter` (eligibility precondition, not one of the five) | 871 |

**Why the per-category counts differ from RESEARCH's (banner 1,418 · list 1,258 · JSDoc 429 ·
hanging 567 · table 34).** Two ordering differences, both stated in the instrument's docblock,
neither of which changes which junctions are joined:

1. The instrument counts `block-delimiter` and `paragraph-break` FIRST. Those two rows are
   net-new — RESEARCH's classifier had neither — and between them they absorb 5,072 junctions
   that its classifier attributed to `banner-rule` and `hanging-indent`.
2. The terminal-punctuation test runs BEFORE the exclusions, so every exclusion row counts the
   same thing: junctions that would otherwise have been reported. That makes the seven rows
   comparable to each other, which is what lets Amendment 1's row be read beside the five.

The `jsdoc-tag` (429) and `comment-table` (34) rows match RESEARCH exactly, which is the
cross-check that the two implementations agree where the orderings cannot diverge.

---

## 5. ⚠ CORRECTION TABLE — `152-CONTEXT.md` vs measured

`152-CONTEXT.md` fact 7, `.planning/ROADMAP.md` and `.planning/REQUIREMENTS.md` all size the
planning-reference class at **817** comment lines. `152-RESEARCH.md` § 4 re-measured it at HEAD
`22c2542e3` by two independent methods and found it **larger**.

| Quantity | CONTEXT.md / ROADMAP / REQUIREMENTS | Measured | Ratio |
|---|---:|---:|---:|
| Planning-reference comment **lines** | 817 | **888** | 1.09× |
| — of which `packages` | 336 | **341** | 1.01× |
| — of which `apps` | 219 | **290** | **1.32×** |
| — of which `tests` | 223 | **257** | 1.15× |
| Non-blank comment corpus | 34,063 | **34,885** | 1.02× |

**The measured figures win, per `152-CONTEXT.md` § 0.1's own precedence rule — *"where a fact
and the roadmap disagree, the fact wins"*.** The error direction is the safe one: the sweep is
bigger than planned, not smaller. But a plan budgeting **219** lines for `apps` runs **33% over**,
and `apps` is where the whole discrepancy sits — `packages` was accurate to 1.5%.

Two further figures on the same footing, carried for completeness:

| Quantity | Measured |
|---|---:|
| Comment lines including narrative-only (no citation token) | 942 |
| Occurrences by the repo's own instrument at HEAD `22c2542e3` | 946 (+123 `task-id` = 1,069) |
| Occurrences by that instrument **at this baseline** | **948** (+123 `task-id` = **1,071**) |

The same correction has already bitten once inside this phase: `152-01` recorded that
CONTEXT.md fact 8's dash counts (85 `--`-as-dash lines, ~2,870 real-dash lines) were superseded
by RESEARCH's **212** and **3,025**. Two CONTEXT.md facts have now been corrected by
measurement. A third plan quoting an uncorrected CONTEXT.md figure should re-measure first.

---

## 6. What later plans should hold themselves to

| Gate | Command | Pre-sweep result (this file) | Post-sweep requirement |
|---|---|---|---|
| Planning references | `bash .planning/phases/152-comment-naming-hygiene-sweep/scripts/hygiene-grep-report.sh --assert-clean` | **exit 1**, 8 gate rows failing | exit 0, `HYGIENE CLEAN` |
| Mechanical stage | `node …/scripts/hygiene-codemod.mjs --self-test` | exit 0, 5 fixtures / 0 failures | unchanged — the fixtures are the contract |
| Behaviour neutrality | `node …/scripts/assert-comment-only-diff.mjs --range <base>..<head>` | n/a | exit 0 with **zero** `--allow` entries over the comment-sweep commits |

**Never** substitute the unmodified `.claude/skills/ship-review-stack/sources/hygiene-grep-report.sh`
`--assert-clean` for the first row. It is green on 682 of this phase's violations, and § 1 is the
demonstration.
