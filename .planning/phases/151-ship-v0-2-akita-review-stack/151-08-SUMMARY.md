---
phase: 151-ship-v0-2-akita-review-stack
plan: 08
subsystem: comment-hygiene
tags: [hygiene, criterion-3, code-review, planning-references, sweep]
status: complete

requires:
  - 151-07 (Stage-1 mechanical codemod + the residue table this plan consumed)
  - 151-03 (hygiene-grep-report.sh + 151-hygiene-baseline.tsv)
  - 151-BASELINE.md (the four gate values matched exactly at close)
provides:
  - criterion-3 CLOSED, operator-approved
  - 151-HYGIENE-REPORT.md at stage 2, three measured states
  - 10 checklist item 3 + item 10 findings in 151-DISPOSITION.md
  - 1 checklist item 5 finding (shipped bug, recorded not fixed)
  - the read rule plan 151-18 needs to score a red gate as a pass
  - the REPORT-only gate-rescope argument, deferred to plan 151-19
affects:
  - 151-18 (must read a red --assert-clean with exactly two KEEP rows as PASS)
  - 151-19 (inherits the gate-design argument rather than rediscovering it)
  - every slice cut after this point — D-04 fix landed on feat-gsd-roadmap first

tech-stack:
  added: []
  patterns:
    - dry-run-then-review before any bulk rewrite (caught 4 corrupting regex bugs)
    - positive shape check, not absence-only, to detect a reference that evades the pattern
    - four-verdict closed set with a one-line reason per item, so judgements are auditable

key-files:
  created:
    - .planning/phases/151-ship-v0-2-akita-review-stack/151-08-SUMMARY.md
  modified:
    - .planning/phases/151-ship-v0-2-akita-review-stack/151-HYGIENE-REPORT.md
    - .planning/phases/151-ship-v0-2-akita-review-stack/151-DISPOSITION.md
    - apps/frontend/src/lib/contexts/filter/filterContext.svelte.ts
    - apps/frontend/src/lib/contexts/filter/filterContext.type.ts
    - apps/frontend/eslint.config.mjs
    - packages/dev-seed/src/writer.ts
    - packages/dev-seed/src/cli/teardown-help.ts
    - tests/scripts/e2e-run.sh
    - tests/scripts/determinism-batch.sh
    - tests/playwright.config.ts

decisions:
  - The gate stays honestly RED. Two named, measured, justified KEEP exceptions are stronger evidence for criterion 3 than a green gate re-scoped until it passed.
  - task-id (84) is KEEP because determinism-batch.sh matches a step title as a functional string; stripping it would break the determinism gate silently and no test would catch it.
  - phase-ref bare (11) is KEEP because the remaining occurrences are benchmark/pgTAP/condenser step labels, not planning references.
  - Decision-IDs WERE stripped from ~40 unit-test titles; the decision-ID vs task-ID distinction is the line, and nothing selects tests by decision ID.
  - The hyphenated `phase-56` form was rejected — it evades the pattern rather than satisfying the criterion.
  - REPORT-only re-scope of the two red rows deferred to 151-19, not applied here.

metrics:
  duration: ~3h
  completed: 2026-08-17
  tasks: 4
  commits: 3
  files_changed: 151
  checkpoints: 2

actuals:
  tokens: 58589
  tasks: 4
  commits: 3
---

# Phase 151 Plan 08: Comment-Hygiene Residue Pass Summary

Closed criterion 3 by resolving all 528 residue items the codemod refused plus 6 it never
attributed, under a four-verdict rule — and left the gate red on purpose, with two
measured KEEP exceptions the operator explicitly approved.

## What was done

Stage 1 (plan 151-07) removed the deterministic 79 % of the planning-reference surface and
handed over a residue table. This plan worked that table file by file.

**Six of nine gate rows went red → green:** `decision-id-long` 185→0, `decision-id-bare`
540→0, `section-anchor` 219→0, `planning-path` 27→0, `plan-number` 105→0, `spike-ref` bare
41→0. `phase-ref` bare went 154→11.

**Criterion 3 was proven by shape, not only by absence.** 659 phase references survive, 648
of them in the collapsed `see phase N` form; 40 spike references survive, all 40 in pointer
form. 648 + 40 = 688 pointers, + 11 KEEP = 699. The arithmetic closes.

**Clause 2 measured rather than inherited:** `[PR review]` count is 0, measured after the
pass.

## The three findings that mattered more than the counts

**1. Ten user-visible planning references, not the two the plan anticipated.** The plan
named the two `filterContext` runtime warnings. The file-by-file pass found eight more
crossing the same trust boundary: an ESLint rule message every contributor sees, the
`dev-seed` CLI `--help` text, four generator/writer log messages, and operator stdout in
`e2e-run.sh` and `determinism-batch.sh`. All ten are rewritten to read as complete
sentences and recorded in `151-DISPOSITION.md` against checklist items 3 and 10.

**2. Task IDs are functional identities — measured, not assumed.**
`determinism-batch.sh:96` sets `EPERM07_STEP_PREFIX='EPERM-07 customData.terms'` and line
493 uses it to locate that step in `results.json`; the matching title is
`voter-journey.spec.ts:894`. Stripping the ID to satisfy the `task-id` row would have left
the determinism gate silently unable to find the step it exists to measure. This turned
T-151-08-02 from a precaution into a demonstrated cost.

**3. The Stage-1 codemod left damage nobody counted.** Where it stripped a `.planning/`
path from mid-sentence it left an empty backtick pair — `lives in ` ` § Adjudication`.
Eleven such sites, none in the 7-line prose-review queue, because the codemod counted a
rewrite clean once the reference was gone. "The reference is gone" and "the sentence still
parses" are different properties.

## Deviations from Plan

### Auto-fixed / re-decided

**1. [Rule 3 — Blocking] No Agent tool available in this context**
- **Found during:** Task 2
- **Issue:** The plan's action specifies fanning out one agent per residue file (D-19). This
  execution context has no Agent tool (a known GSD fork limitation).
- **Fix:** Hand-drove the file-by-file pass sequentially under the identical written rule.
  Functionally equivalent — same four verdicts, same per-item reasons.
- **Commit:** `5862397ad`

**2. [Rule 1 — Bug] Four corrupting regex bugs caught by dry-run-before-apply**
- **Found during:** Task 2
- **Issue:** The bulk decision-ID strip, run as a dry run first, would have (a) deleted the
  `()` of every `() => {` arrow function via an empty-paren cleanup, (b) left a stray `14`
  from `D-57-14` through backtracking, (c) collapsed leading indentation on every touched
  line, (d) left a stray `: ` where an ID preceded a colon mid-title.
- **Fix:** Fixed all four and re-verified before applying. Nothing broken was committed.
- **Commit:** `5862397ad`

**3. [Rule 1 — Bug] YAML duplicate-key collision in my own frontmatter**
- **Found during:** Task 4
- **Issue:** Stage-1's `criterion_3_closed: false` sat *later* in the same frontmatter
  mapping than my Stage-2 `criterion_3_closed: true`. The later duplicate wins, so the
  report would have declared criterion 3 open.
- **Fix:** Renamed the Stage-1 measurement keys `s1_*`; verified by parsing the frontmatter.
- **Commit:** `8f0ac9d95`

**4. [PD-01 re-decision] Runtime message rewrite reddened two unit tests**
- **Found during:** Task 2 verification
- **Issue:** The first cut of the `FeedbackGenerator` / `Writer` log rewrites changed more
  wording than the reference required, breaking two assertions on `synthetic feedback
  disabled` and `feedback writes skipped`.
- **Fix:** PD-01's trigger fired. Re-decided the item rather than editing the tests: the
  messages were re-cut to excise only the reference and preserve the asserted substrings.
  Both tests pass untouched and the diff is strictly smaller. Editing the assertions would
  also have gone green and would have been worse — it moves a test to fit a comment sweep.
- **Commit:** `5862397ad`

**5. [Deviation] `yarn format` deliberately not run**
- Carried forward from Stage 1 and re-confirmed by the orchestrator. Running it would
  reformat the two PD-03-fenced files this phase may not touch.

### Corrections to the plan's own text

- **Task 2's `<verify>` grep is stricter than D-14.** It greps `(?i)phase\s+\d+` over the
  filter-context directory with **no `see ` lookbehind**, so it would flag the exact
  collapsed form D-14 authorises. Satisfied literally by making that directory
  reference-free; recorded as a plan defect.
- **The TODO class is TODO-only.** `FIXME`, `HACK`, `XXX` are each 0. The plan's
  "65 TODO/FIXME/HACK/XXX" over-specified it.
- **`-P` is load-bearing alongside `-I`.** `git grep -E '\b(TODO)\b'` returns 0 — git's ERE
  does not honour `\b`. The Stage-1 note about `-I` is right but incomplete.
- **5 of the 65 TODOs are not actionable markers** — 3 generated-file mirrors and 2 prose
  mentions, one of which (`tests/README.md:135`) is a correction record *about* a TODO that
  never existed and was deliberately preserved.

## Operator decisions recorded

**Task 1 — TODO disposition:** `leave-and-record` plus two named exceptions (not a fourth
policy). 64 left in place; `mapRow.ts:7` relabelled `TODO:` → `Note:` because it was a
rationale note wearing a marker; `FeatureJobs.svelte:103` recorded as a checklist item 5
finding — an admitted shipped bug in the admin Past Jobs section — with its product
question ("do we even want to keep this section?") **surfaced and deliberately unanswered**.

**Task 4 — approval, with one rejection of my recommendation.** All three judgement calls
agreed explicitly. I recommended re-scoping the two red rows to REPORT-only on the
`milestone-ver` precedent; the operator declined and kept the gate honestly red. The
argument is recorded in full and deferred to plan 151-19.

## Known Stubs

None introduced. One pre-existing defect is now *recorded* rather than introduced:
`apps/frontend/src/lib/admin/components/jobs/FeatureJobs.svelte:103` — admitted shipped bug,
deliberately not fixed, logged in `151-DISPOSITION.md` and `.planning/WINDOWS.md`.

## Gates at close — identical to 151-BASELINE.md

| Gate | Baseline | At close | Verdict |
|---|---|---|---|
| `yarn build` | green | 14/14 tasks | identical |
| `yarn test:unit` | 1522 passed / 149 files | 1522 passed / 149 files | identical |
| `yarn lint:check` | 0 errors / 20 warnings | 0 errors / 20 warnings (`TURBO_FORCE=1`) | identical |
| `yarn format:check` | red on 2 files | red on exactly those 2 files | identical |

`hygiene-grep-report.sh --assert-clean` exits **1 by design**, with exactly `task-id` (84)
and `phase-ref` bare (11) — both operator-approved KEEP rows. **For plan 151-18: that is a
PASS for criterion 3. Any other red row is a real failure.**

## Requirements satisfied

- `criterion-3` — CLOSED, operator-approved.
- `criterion-2` — advanced: the D-04 fix landed on `feat-gsd-roadmap` before any slice is cut.

## Self-Check: PASSED
