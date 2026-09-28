---
phase: 152-comment-naming-hygiene-sweep
plan: 02
subsystem: tooling
tags: [codemod, gate, baseline, classifier, instruments, negative-control, spelling-audit, line-break]

# Dependency graph
requires:
  - phase: 151-planning-reference-hygiene
    provides: "`.claude/skills/ship-review-stack/sources/hygiene-codemod.mjs` (935 lines, fixture-tested) and `hygiene-grep-report.sh` (229 lines) — the two instruments this plan retargets rather than rebuilds"
  - phase: 152-comment-naming-hygiene-sweep
    provides: "152-01's live `scripts/assert-comment-hygiene.mjs`, whose lifted-classifier precedent and `.prettierignore` fixture lesson this plan follows"
provides:
  - "`…/scripts/hygiene-codemod.mjs` — a phase-local codemod whose rule 6 DEFERS every phase/spike reference instead of collapsing it, and which is now importable as a module"
  - "`…/scripts/hygiene-grep-report.sh` — a gate that reads `occ`, not `bare`, so it is red on the 682 occurrences the inherited gate calls green"
  - "`…/scripts/uk-identifier-audit.mjs` — REVIEW-HYG-04's committed audit; a re-run, not a re-derivation"
  - "`…/scripts/assert-comment-only-diff.mjs` — criterion 5's mechanical half: a git range proved to change no program bytes"
  - "`…/scripts/unwrap-comment-paragraphs.mjs` — the D-A4 predicate with the five codified exclusions plus the ruling's Amendment 1, in three modes"
  - "`152-BASELINE.md` — the fixed pre-sweep state, with the trap demonstrated as a paired run"
  - "one shared comment-span classifier for the whole phase, exported rather than copied a third, fourth and fifth time"
affects: [152-03, 152-04, 152-05, 152-06, 152-07, 152-08, 152-09, 152-10, 152-11, 152-12, 152-13, 152-14, 152-15]

# Actuals (#2632)
actuals:
  tokens: 35034
  tasks: 3
  commits: 4

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "script-and-module: a CLI fenced behind an `IS_MAIN` argv check so its internals can be imported without running it — the alternative to a third hand-copy of a shared state machine"
    - "throw-don't-return for a scope guard: `enumerateTrackedFiles` raises `ExemptPathError` rather than returning a flag, because a caller that ignores a return value scans the exempt tree anyway"
    - "expected-residue fixture: for a rule whose behaviour is to leave text ALONE, the assertion is the residue roster, not the output diff — an output-only fixture passes vacuously"
    - "paired-instrument negative control: the retargeted gate's red is evidence only next to the inherited gate's green over the same tree"

key-files:
  created:
    - .planning/phases/152-comment-naming-hygiene-sweep/scripts/hygiene-codemod.mjs
    - .planning/phases/152-comment-naming-hygiene-sweep/scripts/hygiene-grep-report.sh
    - .planning/phases/152-comment-naming-hygiene-sweep/scripts/uk-identifier-audit.mjs
    - .planning/phases/152-comment-naming-hygiene-sweep/scripts/assert-comment-only-diff.mjs
    - .planning/phases/152-comment-naming-hygiene-sweep/scripts/unwrap-comment-paragraphs.mjs
    - .planning/phases/152-comment-naming-hygiene-sweep/scripts/fixtures/hygiene-codemod.input.ts
    - .planning/phases/152-comment-naming-hygiene-sweep/scripts/fixtures/hygiene-codemod.expected.ts
    - .planning/phases/152-comment-naming-hygiene-sweep/scripts/fixtures/hygiene-codemod.input.svelte
    - .planning/phases/152-comment-naming-hygiene-sweep/scripts/fixtures/hygiene-codemod.expected.svelte
    - .planning/phases/152-comment-naming-hygiene-sweep/scripts/fixtures/hygiene-codemod.input.sql
    - .planning/phases/152-comment-naming-hygiene-sweep/scripts/fixtures/hygiene-codemod.expected.sql
    - .planning/phases/152-comment-naming-hygiene-sweep/scripts/fixtures/hygiene-codemod.input.sh
    - .planning/phases/152-comment-naming-hygiene-sweep/scripts/fixtures/hygiene-codemod.expected.sh
    - .planning/phases/152-comment-naming-hygiene-sweep/scripts/fixtures/hygiene-codemod.input.deferred.ts
    - .planning/phases/152-comment-naming-hygiene-sweep/scripts/fixtures/hygiene-codemod.expected.deferred.ts
    - .planning/phases/152-comment-naming-hygiene-sweep/scripts/fixtures/hygiene-codemod.expected.deferred.residue
    - .planning/phases/152-comment-naming-hygiene-sweep/scripts/fixtures/unwrap-comment-paragraphs.input.paragraph-break.ts
    - .planning/phases/152-comment-naming-hygiene-sweep/scripts/fixtures/unwrap-comment-paragraphs.expected.paragraph-break.violations
    - .planning/phases/152-comment-naming-hygiene-sweep/scripts/fixtures/unwrap-comment-paragraphs.input.paragraph-joined.ts
    - .planning/phases/152-comment-naming-hygiene-sweep/scripts/fixtures/unwrap-comment-paragraphs.expected.paragraph-joined.violations
    - .planning/phases/152-comment-naming-hygiene-sweep/152-BASELINE.md
  modified: []

key-decisions:
  - "Rule 6 is inverted by DEMOTION, not by delete-and-repair. Every phase/spike reference becomes residue and the judgement pass owns all 734 of them, because a mid-sentence DELETION of an attributive reference leaves the same grammatical rubble a collapse leaves ungrammatical prose — 113 of 704 were measured attributive, and widening a regex at that exact point is how the 38/28/6 broken-comment incident happened."
  - "Exclusions (g) ambiguous-reference and (h) attributive-reference are KEPT and still classified separately even though they no longer decide whether anything is rewritten. They now select the residue REASON, which is what tells the judgement pass which queue items are not citations at all and which need a rewritten sentence."
  - "`dedupePointers()` is DELETED, not disabled. It existed only to fold duplicates of the collapsed survivor form; leaving it would have left the only literal of that form inside a live rewriting path, and would have rewritten a PRE-EXISTING collapsed pair on any line an earlier rule touched."
  - "The report gate takes PATTERNS § 4 option (b): the `survivor)` arm reads `occ`, and the `bare` column is kept and printed as a diagnostic. Option (a) (reclassify the rows as `strip`) would have printed `bare` as `-` and thrown away the fastest read on how much of the residual is the cheap half of the work."
  - "The source report's header paragraph is REWRITTEN and the old text quoted verbatim beside the inversion, not silently replaced. A file that asserts the opposite of what it does is the defect this plan exists to close."
  - "`hygiene-codemod.mjs` becomes BOTH a script and a module (CHANGE (5), beyond the plan's four). Three new instruments needed its classifier, and the phase already carries two hand-synchronised copies of that state machine; three more would make the sync unkeepable. Proven behaviour-neutral: the dry-run summary is byte-identical to the pre-refactor run."
  - "`enumerateTrackedFiles` THROWS `ExemptPathError` rather than returning a flag, so a caller that ignores it does not run at all instead of scanning `.planning/` quietly."
  - "The line-break instrument's terminal-punctuation test runs BEFORE the exclusions, unlike the reference predicate. Behaviour is identical; the point is that all seven exclusion rows then count the same thing, which is what makes Amendment 1's row readable beside the five."
  - "The UK audit blanks REGEX LITERALS as well as strings. Without it, `testMatch: /perm-localisation-positive\\.setup\\.ts/` surfaces three `localisation` hits — a regex matching a FILENAME is no more a symbol than the filename is."

patterns-established:
  - "A gate's correctness is demonstrated by running the WRONG gate beside it over the same tree, and recording the row that reports green over live violations. The retargeted script's red is not evidence on its own."
  - "When a rule's behaviour is to leave text unchanged, its fixture must assert the HANDOFF (the residue roster), not the output. An output-diff fixture for such a rule passes vacuously."
  - "An inherited figure carried into a plan's acceptance criteria is re-measured before it is asserted, and a discrepancy is recorded as a correction rather than engineered away."

# Copied verbatim from 152-02-PLAN.md. NONE is marked Complete in REQUIREMENTS.md:
# `requirements.ready-ids` returns 0/3 — every one of the three is also declared by a sibling
# plan in this phase that has no SUMMARY yet, so the shared-ID gate (#2388) holds all three
# Pending. REVIEW-HYG-01 additionally must NOT be completed here at all: its text spans the
# forced-line-break class as well as the escape, and rule 2 does not ship until 152-15.
requirements-completed: [REVIEW-HYG-01, REVIEW-HYG-02, REVIEW-HYG-04]

coverage:
  - id: D1
    description: "A phase-local codemod that defers every phase/spike reference to the judgement pass instead of collapsing it, refuses the exempt trees in code, and proves itself on extended fixtures."
    requirement: REVIEW-HYG-02
    verification:
      - kind: other
        ref: "node …/hygiene-codemod.mjs --self-test — exit 0, 5 fixtures, 0 failures, expected-residue roster asserted"
        status: pass
      - kind: other
        ref: "dry run over apps/packages/tests — 1571 files, phase-ref 0 hits, spike-ref 0 hits, phase-ref-deferred 694 + spike-ref-deferred 40, arithmetic OK, MODE: DRY-RUN, tree unchanged"
        status: pass
      - kind: other
        ref: "twice-applied scratch copy — run 2 reports 0 hits / 0 files rewritten and the file is byte-identical across runs 2 and 3"
        status: pass
      - kind: other
        ref: "--files '.planning/**/*.md' and --files 'CLAUDE.md' — both exit 2 refusing to scan, guard fires before the extension filter"
        status: pass
    human_judgment: false
  - id: D2
    description: "A gate asserting `occ = 0` on every planning-reference row, with the inherited gate's green-over-violations recorded as a paired run."
    requirement: REVIEW-HYG-02
    verification:
      - kind: other
        ref: "retargeted report — phase-ref and spike-ref both expect `occ = 0` and both FAIL; failing rows 8; --assert-clean exit 1"
        status: pass
      - kind: other
        ref: "unmodified original over the same tree — spike-ref prints OK at occ 40 / bare 0; failing rows 7. Recorded verbatim in 152-BASELINE.md § 1"
        status: pass
      - kind: other
        ref: "milestone-ver prints verdict REPORT and is excluded from the failing count in both scripts"
        status: pass
    human_judgment: false
  - id: D3
    description: "A committed UK/US identifier audit that matches whole words over split identifiers and does not flag aria-labelledby, analysis, discover or axe."
    requirement: REVIEW-HYG-04
    verification:
      - kind: other
        ref: "node …/uk-identifier-audit.mjs — 1521 files, 3 distinct identifiers over 16 occurrences in 3 files; `grep -cE 'aria-labelledby|analysis|discover|\\baxe\\b'` over the output returns 0"
        status: pass
      - kind: other
        ref: "the three named identifiers are reported: describeOffence (3 sites), offences (8), permLocalisationPositiveTemplate (5); `grep -ciE 'offen[c]e|localisation'` returns 16"
        status: pass
    human_judgment: false
  - id: D4
    description: "A mechanical prover that a git range changed no non-comment bytes, demonstrated in both directions."
    requirement: REVIEW-HYG-02
    verification:
      - kind: other
        ref: "scratch repo, comment-only range (comment rewritten + a comment line deleted + a trailing comment removed) — COMMENT-ONLY verdict, exit 0, zero allow entries"
        status: pass
      - kind: other
        ref: "scratch repo, one-digit code change over the same file — exit 1 naming the file and code-stream offset 22 with before/after context"
        status: pass
      - kind: other
        ref: "the same non-comment range with --allow probe.ts — exit 0, ALLOWED line printed, compared: 0"
        status: pass
      - kind: other
        ref: "node …/assert-comment-only-diff.mjs --range HEAD~1..HEAD against the real repo — named per-file verdicts, exit 1, no unhandled exception"
        status: pass
    human_judgment: false
  - id: D5
    description: "The D-A4 predicate in three modes, with the five structural exclusions and the operator ruling's Amendment 1 codified as constants and fixture-tested."
    requirement: REVIEW-HYG-01
    verification:
      - kind: other
        ref: "node …/unwrap-comment-paragraphs.mjs --self-test — exit 0, 2 fixtures / 10 edge cases / 0 failures; the Amendment-1 pair reports 0 violations with the blank comment line and 1 without it"
        status: pass
      - kind: other
        ref: "--report — 14,171 junctions / 5,576 paragraphs / 742 files; all five structural rows non-zero; paragraph-break 4,201 printed as its own row"
        status: pass
      - kind: other
        ref: "--gratuitous-only --report — total 1,131, strictly smaller than 14,171"
        status: pass
      - kind: other
        ref: "scratch-repo --apply — paragraphs joined, blank comment lines and @param list untouched, idempotent on the second run, and assert-comment-only-diff over the join reports zero non-comment changes with zero allow entries"
        status: pass
    human_judgment: false
  - id: D6
    description: "A pre-sweep baseline recording the occurrence, line, span and file counts the sweep will be measured against, plus the CONTEXT.md correction."
    requirement: REVIEW-HYG-02
    verification:
      - kind: other
        ref: "152-BASELINE.md — both report tables verbatim, the residue table, the machine-readable row TSV, the inherited span figures with provenance, the live D-A4 figures, and the 817-vs-888 correction table"
        status: pass
    human_judgment: false

# Metrics
duration: 28 min
completed: 2026-08-28
status: complete
---

# Phase 152 Plan 02: The Phase's Five Instruments, and the Pre-Sweep Baseline Summary

**Five committed instruments — a codemod whose rule 6 now defers rather than collapses, a gate that reads `occ` instead of `bare`, a UK-identifier audit, a comment-only-diff prover and the D-A4 line-break instrument — plus a baseline that demonstrates the inherited gate reporting OK over 40 live violations.**

## Performance

- **Duration:** ~28 min
- **Started:** 2026-08-28T20:30:04Z
- **Completed:** 2026-08-28T20:58:22Z
- **Tasks:** 3 of 3
- **Files created:** 21 (5 scripts, 15 fixtures, 1 baseline document)

## Task Commits

1. **Task 1: Retarget the citation codemod** — `1e1f8e6ea` (feat)
2. **Task 2: Gate on `occ = 0`, and record the baseline** — `3a1a88350` (feat)
3. **Task 3: The three new instruments** — `999e8f458` (feat)
4. *(follow-on)* **The live D-A4 baseline section** — `58f7e6f47` (docs)

## Accomplishments

### The trap is closed, and it was demonstrated rather than asserted

The plan's stated highest-likelihood failure was reusing `hygiene-grep-report.sh --assert-clean` unchanged. Both scripts were run against the same tree, minutes apart, and the pair is in `152-BASELINE.md` § 1. The decisive row, from the **unmodified original**:

```
  spike-ref              40      30       0  bare = 0   OK
```

**A gate reporting OK over 40 live violations in 30 files** — because all 40 are already in the collapsed `see spike N` form, and `bare` is the only column that arm reads. `phase-ref` is red only *accidentally*, on its 104 un-collapsed occurrences, while **642 collapsed ones are invisible to the verdict**. 682 occurrences in total.

The retargeted copy reports FAIL on both rows and `--assert-clean` exits 1. Exactly **one** row flips verdict and the failing-row count goes 7 → 8; every other input — tree, patterns, pathspec, `bare` computation, `milestone-ver` disposition — is held constant. That is what makes it evidence rather than two runs.

### Rule 6 is inverted, and the whole reference class is handed on rather than guessed at

The dry run over 1,571 files now reports `phase-ref` and `spike-ref` at **0 hits**, with the same occurrences appearing below as `phase-ref-deferred 694` and `spike-ref-deferred 40`, beside `attributive-reference 27` and `ambiguous-reference 9`. Nothing in the class is machine-rewritten. `markdown-file` fell from 40 to **0** — the scope narrowing.

The demotion was chosen over delete-and-repair deliberately: a mid-sentence *deletion* of an attributive reference leaves exactly the grammatical rubble a *collapse* leaves ungrammatical prose, and 113 of 704 were measured attributive. Both need a human sentence. `SKILL.md:314` records what widening a regex at that point costs: 38 broken comments in the test tree, 28 in the routing surface, 6 in the components.

### One classifier for the phase, not five

Three new instruments all needed the comment-span state machine, and this phase already carried **two** hand-synchronised copies of it (`scripts/assert-comment-hygiene.mjs` from 152-01, and the codemod). Three more copies would have made the standing "fix one, fix the other" hazard unkeepable. Instead `hygiene-codemod.mjs` became both a script and a module: the CLI is fenced behind an `IS_MAIN` argv check, and the classifier, family table, D-15 exemption and a new `enumerateTrackedFiles()` are exported.

**Proven behaviour-neutral rather than assumed:** after the refactor, `--self-test` is still 5 fixtures / 0 failures and the full dry-run summary is **byte-identical** to the pre-refactor run (`diff /tmp/152-dry.txt /tmp/152-dry-after.txt` → no output). The exemption guard still fires before the extension filter, and still exits 2 on `--files 'CLAUDE.md'`.

### The operator's Amendment 1 landed as a first-class rule

`PARAGRAPH_BREAK` sits with the other five codified exclusions, carries a comment identifying it as the paragraph-break rule and citing the ruling, has **its own row in the report** (4,201 junctions), and is proven by a committed fixture **pair** whose two inputs differ by exactly one line:

| Fixture | Content | Violations |
|---|---|---:|
| `…input.paragraph-break.ts` | two paragraphs separated by a blank comment line | **0** |
| `…input.paragraph-joined.ts` | the same two lines, blank line removed | **1** |

A single fixture could not express that. The pair is the assertion.

`--apply`, smoke-tested on a scratch repo, joins the wrapped paragraphs, leaves the blank comment lines and the `@param` list untouched, preserves the marker and post-marker indent, is idempotent on a second run, and `assert-comment-only-diff.mjs` over the resulting commit reports **zero non-comment byte changes with zero allow entries** — the exact bar the ruling sets for the real sweep.

### The live D-A4 figures confirm the ruling was made on sound numbers

`152-14` Task 1 must confirm the live figures do not materially contradict the ruling's. They agree to within **0.7%** on every quantity:

| Quantity | Ruling | Live | Δ |
|---|---:|---:|---:|
| Wrapped-prose junctions | 14,094 | **14,171** | +0.5% |
| Wrapped paragraphs | 5,550 | **5,576** | +0.5% |
| Files touched | 747 | **742** | −0.7% |
| Joined length p50 / p90 / max | 185 / 418 / 1,780 | 190 / 420 / 1,738 | ~1% |

`--gratuitous-only` prints 1,131 junctions against the unrestricted 14,171 — strictly smaller, as required. Per-tree: apps 4,090 · packages 4,105 · tests 5,976.

Per-category exclusion counts differ from RESEARCH's, and § 4b of the baseline records why rather than smoothing it: two net-new rows (`block-delimiter` 871 and Amendment 1's `paragraph-break` 4,201) absorb 5,072 junctions RESEARCH's classifier attributed to `banner-rule` and `hanging-indent`, and the terminal-punctuation test runs first so all seven rows count the same thing. **`jsdoc-tag` (429) and `comment-table` (34) match RESEARCH exactly** — the cross-check that the two implementations agree wherever the orderings cannot diverge.

### The UK audit's hit set

```
packages/dev-seed/src/templates/e2e/perm/perm-localisation-positive.ts:79,212   permLocalisationPositiveTemplate
packages/dev-seed/src/templates/index.ts:38,85,167                              permLocalisationPositiveTemplate
packages/dev-seed/tests/assertKnownRowProps.builtins.test.ts:63,99,101          describeOffence
packages/dev-seed/tests/assertKnownRowProps.builtins.test.ts:81,90,99,101,106,165,166,169   offences
```

**3 distinct identifiers, 16 occurrences, 3 files.** No `aria-labelledby`, `analysis`, `discover` or bare `axe` hit. The out-of-scope classes are excluded structurally, not by word-list special cases: comments and string literals are blanked by the shared classifier, `.svelte` is scanned only inside `<script>` regions, and regex literals are blanked too.

## The side-by-side gate demonstration

Full tables are in `152-BASELINE.md` § 1. In brief:

| | `phase-ref` | `spike-ref` | Gate rows failing |
|---|---|---|---:|
| **Unmodified original** (`.claude/skills/ship-review-stack/sources/`) | `occ 746 / bare 104` · expect `bare = 0` · **FAIL** | `occ 40 / bare 0` · expect `bare = 0` · **OK** | 7 |
| **Retargeted copy** (this plan) | `occ 746 / bare 104` · expect `occ = 0` · **FAIL** | `occ 40 / bare 0` · expect `occ = 0` · **FAIL** | 8 |

Live confirmation of the collapsed share: `see phase N` = **642** occurrences in 224 files; `see spike N` = **40**, i.e. every spike reference in the tree is already collapsed.

## ⚠ This phase moved its own baseline, and it is recorded

`152-RESEARCH.md` § 4.1 measured `phase-ref occ 744 / bare 102` at HEAD `22c2542e3`. This session measures **746 / 104**. The +2 is not drift: it is `152-01`'s own commit. The 27-line comment block it added to `packages/dev-seed/tests/ciTypecheckGate.test.ts` cites `Phase 152` and `Phase 147`.

`scripts/` is out of the swept trees and is fine. `packages/dev-seed/tests/` is **in** them. Recorded in baseline § 3 because the direction of travel matters more than the two occurrences: a phase sweeping planning references out of the code is simultaneously writing new ones in, and eleven phases are queued behind it.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 — Blocking] `hygiene-codemod.mjs` made importable — a fifth change beyond the plan's four**

- **Found during:** Task 3
- **Issue:** Task 3 requires all three new instruments to reuse "the Task-1 copy's classifier and enumeration rather than re-deriving them". The module declares no `export` and self-executes its whole enumeration on import, so it could not be imported. The alternatives were three more hand-copies of a 120-line state machine that this phase's own docblocks already warn must be kept in sync across two copies, or an undeclared shared library file.
- **Fix:** `PHASE-152 CHANGE (5)`: the CLI (argv validation, flag-value resolution, enumeration, main) is fenced behind an `IS_MAIN` check comparing `process.argv[1]` to `import.meta.url`; `commentSpans`, `inSpans`, `FAMILY_BY_EXT`, `OPENER_RE`/`openerEnd`, `SKIP_PATH_RE`, `EXEMPT_PREFIXES`/`isExempt`, `SCAN_ROOTS`, `DEFAULT_GLOBS` and a new `enumerateTrackedFiles()` are exported. `enumerateTrackedFiles` throws `ExemptPathError` rather than exiting, so callers with a different exit-code convention fail closed in their own terms. `process.argv[1]` rather than `import.meta.main` because the latter is Node 24+.
- **Files modified:** `…/scripts/hygiene-codemod.mjs`
- **Verification:** `--self-test` still 5 fixtures / 0 failures; the full dry-run summary is **byte-identical** to the pre-refactor run; `import()` of the module prints its 16 exports and runs no enumeration; `--files 'CLAUDE.md'` still exits 2.
- **Committed in:** `999e8f458`

**2. [Rule 1 — Bug] The UK audit blanks regex literals, not only strings**

- **Found during:** Task 3
- **Issue:** The first run reported `localisation` at `tests/playwright.config.ts:1270,1276,1287`. Those are `testMatch: /perm-localisation-positive\.setup\.ts/` — regex literals matching a FILENAME, which RESEARCH § 9.1 had already put out of scope when it resolved `localisation` to Playwright project naming. Blanking strings alone does not reach them.
- **Fix:** A regex-literal detector (previous-significant-token heuristic, char-class aware, refusing to cross a newline so a division is never mistaken for a regex) blanks regex bodies alongside string literals.
- **Files modified:** `…/scripts/uk-identifier-audit.mjs`
- **Verification:** the three `localisation` hits disappear; the result is exactly the 3 identifiers RESEARCH § 9.2 names; no `aria-labelledby`, `analysis`, `discover` or `axe` hit.
- **Committed in:** `999e8f458`

**3. [Rule 1 — Bug] A zero-width space removed from the line-break instrument's docblock**

- **Found during:** Task 3
- **Issue:** A `U+200B` had been used to write a block terminator inside a block comment without closing it. An invisible character in a source file is precisely the class of defect this phase exists to remove, and the repo's guard family already treats literal escapes in comments as violations.
- **Fix:** The passage was reworded to name the delimiters in prose. The file now contains zero invisible characters.
- **Files modified:** `…/scripts/unwrap-comment-paragraphs.mjs`
- **Verification:** a scan for `U+200B/200C/200D/FEFF/2060` returns 0.
- **Committed in:** `999e8f458`

**4. [Rule 1 — Bug] Two self-test edge-case expectations corrected from 1 to 2**

- **Found during:** Task 3
- **Issue:** The `BANNER_RULE` and `NEXT_IS_LIST_ITEM` edge cases were written expecting one excluded junction each; both three-line inputs produce **two** (a banner blocks a join from either side; a list blocks both lead-in→item and item→item).
- **Fix:** Expectations corrected to 2, with a comment at each case explaining why both junctions count. The *expectation* was wrong, not the predicate.
- **Files modified:** `…/scripts/unwrap-comment-paragraphs.mjs`
- **Verification:** `--self-test` → 2 fixtures / 10 edge cases / 0 failures.
- **Committed in:** `999e8f458`

### Documented corrections to inherited figures

**5. [Correction] The UK audit finds 16 occurrences, not the 14 the plan's acceptance criterion states**

The criterion reads *"exactly 3 in-scope distinct identifiers over 14 occurrences in 3 files"*. The identifier count and the file count are met exactly. The occurrence count is **16**, and the instrument is right:

- `RESEARCH § 9.1`'s own tool output reads **`8x offences`** · `5x permLocalisationPositiveTemplate` · `3x describeOffence` — which is 16, not 14.
- `RESEARCH § 9.2`'s hand-written table lists `offences` at *"`:81,90,106,165,166,169`"* — **six** sites, omitting `:99` and `:101`. Those two lines read `offences.push(describeOffence(…))`: they carry **both** identifiers, and § 9.2 attributed each line to one identifier only. `grep -nw offences` on the file returns 8 matches at `81,90,99,101,106,165,166,169`, all verified by direct read. (A ninth match at `:172` is inside a test-title string and is correctly blanked.)
- So `152-RESEARCH.md` is internally inconsistent, § 9.1 is correct, and 14 propagated from § 9.2 into this plan's criterion.

The instrument was **not** adjusted to reproduce 14. Bending an instrument to hit an inherited number is the "self-consistent and wrong" failure the phase's own risk statement names. **`152-04` must size the rename against 16 sites, not 14** — the two extra are `:99` and `:101` in `packages/dev-seed/tests/assertKnownRowProps.builtins.test.ts`, both of which need the `offences` → `offenses` rename applied alongside the `describeOffence` rename already on the same line.

**6. [Correction] The line-break exclusion counts differ from RESEARCH's, by ordering**

`banner-rule` 510 (RESEARCH 1,418) and `hanging-indent` 450 (RESEARCH 567), because two net-new rows count first and absorb 5,072 junctions between them. `jsdoc-tag` (429) and `comment-table` (34) match exactly. Recorded in baseline § 4b with the mechanism, not silently absorbed. The *joined* totals — the number that decides the sweep's size — agree to 0.5%.

---

**Total deviations:** 6 (3 auto-fixed bugs, 1 blocking, 2 documented corrections to inherited figures)
**Impact on plan:** No scope creep and no prohibition crossed. `--assert-clean` was not reused unmodified; rule 6 emits no collapsed survivor form (all seven `see phase N` occurrences in the codemod are docblock prose, none in a replacement literal); no instrument grew a dash rule; no instrument widened to `.md`, `.planning/`, `.claude/`, `.agents/` or `CLAUDE.md`; `milestone-ver` stayed a report row; `.claude/skills/ship-review-stack/` is byte-identical (`git diff --stat` empty); the UK audit matches whole words only; and `.planning/ROADMAP.md`, `.planning/REQUIREMENTS.md` and `.planning/STATE.md` were untouched by every task commit.

## Known Stubs

None. No hardcoded empty value, placeholder, `TODO`/`FIXME` marker or unwired path was introduced. `dedupePointers()` was **deleted**, not left as a disabled branch — the phase's own no-opt-out principle applied to dead policy.

## Issues Encountered

- **`152-CONTEXT.md` `<open>` item 1 remains stale and was not re-propagated.** `REVIEW-HYG-01..04` **are** defined at `.planning/REQUIREMENTS.md:88-91`, with traceability at `:260-263` and a phase-map row at `:332`. Carried forward from 152-01's correction.
- **`REVIEW-HYG-01` is deliberately NOT marked Complete.** Its text spans both the forced-line-break class and the escape; rule 2 does not go live in the guard until `152-15`. Four plans declare the id (`152-01`, `152-02`, `152-14`, `152-15`), so the shared-ID gate holds it Pending. This plan ships the *instrument* for the line-break half, not the enforcement.
- **The plan's Task-3 `<verify>` chains its four commands with `&&`.** `assert-comment-only-diff.mjs --range HEAD~1..HEAD` correctly exits **1** against a docs-only commit (`.md` files have no comment family, so their whole content is code and any change is a violation — deliberate, fail-closed behaviour). The chain therefore short-circuits. Each command was run individually and each met its own acceptance criterion, which is what the criteria state (*"exits 0 or 1 with a named per-file verdict, never with an unhandled exception"*).
- **The line-break instrument's report queue is written to `os.tmpdir()` by default**, with `--queue-out <path>` to redirect it. The plan declares an exact artifact list and a committed queue file is not on it, so the queue stays out of the tree until a plan that needs it names a path.
- **The extension-set gap registered by 152-01 is inherited, not closed.** The codemod's own `FAMILY_BY_EXT` does cover `.css`, `.scss`, `.html` and `.xml`, so the three instruments that enumerate through it see those files; the live `scripts/assert-comment-hygiene.mjs` guard does not. That asymmetry is `152-15`'s to decide, and the ledger entry stands.

## Next Phase Readiness

**Ready.** Every later plan in Phase 152 now has an instrument correct for *this* phase's criterion rather than the previous phase's, a fixed baseline to be measured against, and a mechanical way to prove a comment sweep changed no program bytes.

Carried forward:

- **`152-04`:** size the spelling rename against **16** sites, not 14. See deviation 5.
- **`152-05`:** the judgement queue is `phase-ref-deferred 694` + `spike-ref-deferred 40` + `attributive-reference 27` + `ambiguous-reference 9` = **770** in-comment occurrences across **263** files, plus `not-a-comment-span 98` for the hand review.
- **`152-14`:** the live D-A4 figures are in baseline § 4b and agree with the ruling to 0.7%; Task 1's confirmation is available without re-deriving it. `--gratuitous-only` exists as a flag, though the ruling rejected disposition (c).
- **Every sweep plan:** run `assert-comment-only-diff.mjs --range <base>..<head>` over the sweep commits and require **zero** allow entries, per the ruling.
- **Standing hazard, now smaller but not gone:** there are still **two** copies of the comment-span classifier in this repo — `scripts/assert-comment-hygiene.mjs` and `…/scripts/hygiene-codemod.mjs`. A fix to either must be applied to both. The three new instruments import rather than copy, so the count did not grow.

## Self-Check: PASSED

- All 21 created files present on disk (5 scripts, 15 fixtures, `152-BASELINE.md`).
- All four commits present: `1e1f8e6ea`, `3a1a88350`, `999e8f458`, `58f7e6f47`.
- Every Task-1 criterion re-run post-commit: self-test exit 0 / 5 fixtures / 0 failures · `phase-ref` and `spike-ref` at 0 hits with a non-zero deferred residue · `git status --porcelain -- apps packages tests` empty · balance OK + `MODE: DRY-RUN` · all seven `see phase N` matches in docblock prose, none in a replacement literal · `git diff --stat .claude/skills/ship-review-stack/` empty · `EXEMPT_PREFIXES` present and firing before the extension filter · twice-applied idempotency proven.
- Every Task-2 criterion re-run: both rows expect `occ = 0` and FAIL · the original's `spike-ref OK at occ 40` recorded verbatim · `--assert-clean` exit 1 · `milestone-ver` REPORT and uncounted · no `bare = 0` inside the `survivor)` arm (the single match is in the explanatory comment quoting the source) · originals untouched · `152-BASELINE.md` carries the row table, residue table, span figures and correction table.
- Every Task-3 criterion re-run: 3 identifiers / 3 files (16 occurrences, see deviation 5) with no forbidden false positive · `grep -ciE 'offen[c]e|localisation'` returns 16 · `--report` prints per-tree counts and all five structural rows non-zero · `--gratuitous-only` total 1,131 < 14,171 · the prover exits 0 and 1 as demonstrated with no unhandled exception · `git status --porcelain -- apps packages tests` empty after all runs · `dash` appears only on docblock prohibition lines 84, 86 and 88.
- Plan-level verification: all five instruments run to completion with the tree unchanged · codemod `--self-test` exit 0 with the extended rule-6 fixture · the retargeted report fails on `occ` while the original reports OK on `spike-ref`, both recorded · `152-BASELINE.md` exists and carries the correction table.

---
*Phase: 152-comment-naming-hygiene-sweep*
*Completed: 2026-08-28*
