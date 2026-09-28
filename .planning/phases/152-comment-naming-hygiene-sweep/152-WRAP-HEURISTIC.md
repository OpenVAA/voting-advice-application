# Phase 152 — Separating manual line-wrapping from allowed paragraph breaks

**Measured 2026-08-28** against the working tree, in response to the operator's direction: check all
sites manually, but devise heuristics if the volume is unwieldy. It is unwieldy — 14,094 lines was the
planner's literal reading of D-A4 — so this records the heuristic, its evidence, and what it leaves.

**Status:** prototype + measurement. `152-02` builds the phase's committed instruments; this is the
input for the D-A4 scan, and the evidence `152-14`'s blocking checkpoint should carry.

---

## 1. The finding that reframes the problem

`printWidth` resolves to **120**, from `.editorconfig`'s `max_line_length = 120` (prettier reads it;
`packages/shared-config/prettier.config.mjs` sets no `printWidth` of its own).

**But the comment corpus is not wrapped to 120.** Measured over 1,328 files carrying ≥8 comment lines:

| per-file max comment column | files | share |
|---|---:|---:|
| ≤ 80 | 573 | 43.1% |
| 81–100 | 377 | 28.4% |
| 101–110 | 56 | 4.2% |
| 111–120 | 65 | 4.9% |
| > 120 | 257 | 19.4% |

Median per-file maximum: **83**. The end-column histogram peaks at **78**, with the top band running
73–81. Only 4.9% of files actually use the 111–120 range.

**Consequence.** Testing "would the next word have fitted on the previous line?" against 120 flags
**14,565** breaks — essentially every wrap in the repo — because the corpus is wrapped near 80. That is
not a finding about forced line breaks; it is the yardstick being wrong. A sweep priced on it would
reflow ~14.5k lines across 1,378 files for no reader benefit, and collide with 59 of the 94 files
phases 153–160 touch.

**The right comparison is each file against its own prevailing wrap width, not against the config.**

## 2. The heuristic

For each adjacent pair of comment lines in one paragraph, classify the break:

| # | Rule | Bucket |
|---|---|---|
| 0 | File matches `.prettierignore` | **excluded** — generated (1,186 files, incl. all of `paraglide/`) |
| 1 | Previous line already exceeds 120 | **allowed** — table, ASCII diagram, long URL |
| 2 | Next line opens with `-`/`*`/`1.`/`@tag`/`\|`/```` ``` ````/`>`/`#` | **allowed** — structural |
| 3 | Previous line is a JSDoc tag (`@param`, `@returns`, …) | **allowed** — tags end where they end |
| 4 | Next line's first word would **not** have fitted before the file's prevailing width | **allowed** — necessary wrap |
| 5 | Previous line ends `.`/`!`/`?`/`:`/`;` | **allowed** — sentence boundary |
| 6 | Break lands within 15 columns of the prevailing width | **allowed** — normal fill |
| 7 | Everything else | **NEEDS EYES** — unexplained short break |

**Prevailing width** = the densest 5-column bucket among comment lines at or above the file's median
end-column, computed over lines ≤ 120 only. Wrapped prose piles up just under its wrap width, so that
band *is* the width. The ≤120 filter is load-bearing: without it a single 495-column ASCII table row in
`categoricalQuestion.ts` drags its estimate to 174 and the whole file reads as unexplained.

### Estimator choice, measured not assumed

| estimator | unexplained | files | auto |
|---|---:|---:|---:|
| p90 | 1,646 | 322 | 91.8% |
| p75 | 934 | 237 | 95.2% |
| median | 422 | 154 | 97.6% |
| **densest-band (chosen)** | **762** | **251** | **95.4%** |

Smallest residue is not the goal — correctness is. `median` under-flags, because paragraph-final short
lines drag it down. `p90` over-flags, because one long line skews it: it rates
`enumeratedFilter.ts` at 124 when its lines visibly cluster at 77–81. The densest-band estimator rates
that same file **84**, which matches what a reader sees.

## 3. Result

| bucket | breaks | share |
|---|---:|---:|
| explained by the file's own wrap | 10,958 | 65.8% |
| structural next line | 2,336 | 14.0% |
| near margin | 1,785 | 10.7% |
| sentence end | 577 | 3.5% |
| oversize line | 166 | 1.0% |
| JSDoc tag line | 76 | 0.5% |
| **NEEDS EYES** | **762** | **4.6%** |

**16,660 breaks examined · 95.4% auto-classified · 762 left across 251 files.**

Against the planner's literal 14,094, that is an **18.5× reduction**, and 762 is a reviewable number.
The residue also concentrates — `argument-condensation` alone holds ~90 across four files — so a
reviewer works file-by-file, not break-by-break.

## 4. What this does NOT settle

- **The residue is a candidate list, not a verdict.** Every one of the 762 still needs a human read;
  the heuristic only removes the 15,898 that provably need none.
- **Rules 5 and 6 are the deliberate soft edges.** A sentence-ending line *can* still be hand-wrapped,
  and a break 14 columns short of the margin is not obviously fine. Both were tuned to favour
  false negatives over false positives — a missed hand-wrap costs nothing, while a false positive
  sends a reviewer to a clean site. Rule 6's 15-column slack is the one free parameter and is worth
  a sensitivity check when the instrument is productionised.
- **This measures where breaks are, not whether the comment should exist.** The planning-reference
  purge (D-A1) is a separate axis and a separate pass.
- **The prototype is not the instrument.** It has no tests, no `--json`, no per-file report. `152-02`
  owns turning it into one.

## 5. Recommendation for the `152-14` checkpoint

Run D-A4's detection verbatim, and codify rules 0–6 as **committed, individually justified exclusions**
in the scan script — each with the measurement above as its warrant. That keeps the criterion's literal
reach (nothing is silently out of scope) while making the reviewable set 762 rather than 14,094. The
exclusions are auditable, so a later reader can challenge any single rule without re-deriving the whole
partition.

Prototype: `152-wrap-scan.py` in this directory.
