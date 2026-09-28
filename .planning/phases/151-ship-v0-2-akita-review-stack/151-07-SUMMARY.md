---
phase: 151-ship-v0-2-akita-review-stack
plan: 07
subsystem: release-engineering
tags: [codemod, comment-hygiene, criterion-3, residue-handoff, static-analysis]
status: complete
requires:
  - 151-03 (151-hygiene-baseline.tsv — the pre-codemod measurement this run is judged against)
  - 151-06 (the D-04 checkpoint approving fixes landing on feat-gsd-roadmap before any slice is cut)
provides:
  - "hygiene-codemod.mjs — dry-run-by-default, comment-span-only, with four committed fixtures"
  - "the applied Stage-1 sweep on feat-gsd-roadmap (commit 0c538024c, 346 files)"
  - "151-HYGIENE-REPORT.md — before/after from the same script, plus a 528-row residue work queue"
  - "151-hygiene-residue.tsv + 151-hygiene-prose-queue.tsv — machine-readable handoffs to 151-08"
affects:
  - "plan 151-08 (owns all 528 residue rows and the 7-line prose queue; only it can turn the gate green)"
  - "every per-slice sweep 151-12 … 151-18 (they read comments this plan rewrote)"
  - "plan 151-18 (criterion 3's closing proof re-runs hygiene-grep-report.sh --assert-clean)"
tech-stack:
  added: []
  patterns:
    - "comment-span state machine over four comment families, with multi-line template-literal tracking"
    - "NUL-sentinel deletion + neighbourhood-only repair, so untouched text on a changed line stays byte-identical"
    - "exhaustive pattern set: every occurrence is a hit or a reported residue item, asserted per run"
    - "reconcile the report against raw git grep rather than against the report's own arithmetic"
key-files:
  created:
    - .planning/phases/151-ship-v0-2-akita-review-stack/scripts/hygiene-codemod.mjs
    - .planning/phases/151-ship-v0-2-akita-review-stack/scripts/fixtures/ (4 input + 4 expected)
    - .planning/phases/151-ship-v0-2-akita-review-stack/151-HYGIENE-REPORT.md
    - .planning/phases/151-ship-v0-2-akita-review-stack/151-hygiene-residue.tsv
    - .planning/phases/151-ship-v0-2-akita-review-stack/151-hygiene-prose-queue.tsv
    - .planning/phases/151-ship-v0-2-akita-review-stack/151-hygiene-summary.json
  modified:
    - apps/ packages/ tests/ (346 files, comment spans only)
    - .planning/WINDOWS.md (3 entries filed)
decisions:
  - "attributive references are reported, not collapsed — `the see phase 64 fix` is worse noise than the citation it replaces (108 occurrences, breaks this plan's own must-have, stated rather than hidden)"
  - "alphabetic and quoted section anchors are residue; only numeric-leading anchors have a mechanical end boundary"
  - "`yarn format` deliberately not run — prettier --check over all 346 changed files reports only the file already dirty at baseline, and running it would have unfenced the two PD-03 files"
  - "the codemod's own hits+residue arithmetic cannot detect an occurrence no pattern matches; reconciliation against raw git grep is the only check that can"
metrics:
  duration: ~2h10m
  completed: 2026-08-17
actuals:
  tokens: 96000
  tasks: 3
  commits: 5
---

# Phase 151 Plan 07: Mechanical Comment Hygiene Summary

**Built a comment-span-only codemod, applied it to 346 files removing 1,985 leaked planning references with every gate identical to baseline — and then declined to rewrite 528 more, because a regex that keeps going past the point it can be right produces worse noise than the citations it replaces.**

## What was built

| Task | Outcome | Commit |
|---|---|---|
| 1 | `hygiene-codemod.mjs` + 4 fixture pairs. Dry-run default, `--apply`, `--self-test`, D-15 guard in code. | `98f5a4516`, `44fdc7ab9`, `8f38158cb` |
| 2 | The applied sweep: 346 files, 1,985 references removed or collapsed, 11 dead comment lines cut. | `0c538024c` |
| 3 | `151-HYGIENE-REPORT.md` — before/after from the same script, 528-row residue queue, criterion-3 status clause by clause. | `610c94bdb` |

## The numbers

Both tables come from `hygiene-grep-report.sh` with the same `-- apps/ packages/ tests/` pathspec, the "before" half read from 151-03's saved baseline TSV.

| Row | Before | After | Δ |
|---|---:|---:|---:|
| `phase-ref` (**bare**) | 700 | **154** | −546 |
| `spike-ref` (**bare**) | 41 | **5** | −36 |
| `decision-id-long` | 185 | **49** | −136 |
| `decision-id-bare` | 540 | **47** | −493 |
| `section-anchor` | 219 | **70** | −149 |
| `planning-path` | 27 | **5** | −22 |
| `plan-number` | 105 | **2** | −103 |
| `task-id` | 535 | **84** | −451 |
| `milestone-ver` | 45 | 45 | 0 (report-only by decision) |
| collapsed `see phase/spike N` | 4 | **586** | +582 |

**Read the survivor rows on `bare`, not `occ`.** The script's `delta` column shows `0` for `phase-ref` because collapsing `Phase 88` → `see phase 88` prefixes the words rather than removing them; the baseline TSV stores only `occ`, so `bare` had to be measured directly. 154 bare + 550 collapsed = 704 = the unchanged `occ`. The arithmetic closes.

Codemod totals: **1788 scanned · 346 rewritten · 2513 occurrences = 1985 hits + 528 residue**, asserted equal on every run (the process exits non-zero if it is not).

## Gates — every one identical to baseline

| Gate | Baseline | After | |
|---|---|---|---|
| `yarn build` | green | 14/14 | same |
| `yarn test:unit` | 1522 passed / 149 files | **1522 / 149** | identical |
| `yarn lint:check` (`TURBO_FORCE=1`) | 0 errors / 20 warnings | **0 / 20** | identical |
| `yarn format:check` | red on 2 files | red on **exactly those 2** | same |

The unit count matching baseline to the test is the strongest available evidence that no program text moved.

## Deviations from Plan

### 1. [Rule 1 — Bug] 108 attributive references are reported, not collapsed — this breaks the plan's own must-have

**Found during:** Task 2, reading the first real applied diff.

D-14's `see phase N` form is correct in citation position and ungrammatical in attributive position. Collapsing everywhere would have produced `Mirrors the see phase 64 fix` and `went bare in see phase 113` — **113 of 704 phase references and 5 of 41 spike references**, measured.

The sweep exists to make this code read well to an outside reviewer. 113 lines of `the see phase 64 fix` would defeat that more thoroughly than the citations they replace, so a reference immediately preceded by an article or preposition became residue under a new `attributive-reference` reason.

**This makes must-have truth 4 — "surviving phase and spike references appear only in the collapsed short-pointer form" — false at the end of this plan**, and the `phase-ref`/`spike-ref` gate rows stay red until 151-08 rewords them. Recorded in the report, in the commit message, and as WINDOWS entry #9. The alternative was a must-have satisfied by output nobody would want to ship.

### 2. [Rule 1 — Bug] Threat T-151-07-03 fired: six occurrences were reported by nobody

**Found during:** Task 3, reconciling the residue table against raw `git grep`.

Six `§"Seeding local data"` occurrences matched **neither** the numeric strip rule nor the alphabetic residue rule — a double quote is neither a digit nor a letter. They were not rewritten and not reported.

**The codemod's own `hits + residue == total` check could not have caught this**: an occurrence no pattern matches is absent from `total` as well, so the arithmetic balanced while the set was incomplete. Only checking the report *against the world* found it. The residue pattern now ends in a bare `/§/`, making the set exhaustive; reconciliation reports **0 unattributed on all nine gate rows**. Fixed in `8f38158cb`; residue-only, so the applied tree is byte-identical across the fix.

### 3. [Rule 1 — Bug] Four repair defects the fixtures alone did not catch

The first full dry run over the real tree exposed what a small fixture could not:

| Defect | Symptom | Fix |
|---|---|---|
| unanchored bracket-space rule | `` `entityTab` / `entity` `` reformatted to `` `entityTab`/ `entity` `` on every touched line | removed; the sentinel-anchored rule already covers it |
| label colon orphaned | `(D-09: all selector changes)` → `(: all selector changes)` | a deleted label takes its introducing colon |
| `+` not a separator | `(D-01 + D-03)` → `(+)` | `+`, `&`, `~` added; `,` and `;` deliberately excluded, being sentence punctuation |
| **escaped-string replacement** | the infix rule inserted the literal text ` ` into rewritten output | replacement is the sentinel constant; the fixture that caught it is committed |
| rule 7 never fired | the degenerate-line probe re-classified with a **fresh** state, so a `*` continuation line inside a block comment looked like code and could never be deleted | probe seeded from the state the line started in; 11 dead lines now cut |

All were caught by reverting the apply wholesale (`git checkout -- apps packages tests`) and re-running, never by hand-repairing output — a codemod whose output needs hand repair is a codemod that edited something it should not have.

### 4. [Rule 3 — Blocking] Enumeration had to be intersected with the tracked set

`globSync` sees the working tree, not the index. The default globs matched **82 gitignored files** — Playwright evidence directories under `tests/e2e-runs/**`, generated paraglide sources, a stray `Untitled query 786.sql`. Rewriting them would have produced an unexplainable dirty tree. Enumeration is still `globSync` per the precedent; `git ls-files` is used only as a **tracked-file filter**, with a `SKIP_PATH_RE` denylist kept alongside it because either alone has been wrong before.

### 5. [Rule 3] `yarn format` deliberately not run

The plan says run it after applying. Evidence says not to:

```
$ npx prettier --check <all 346 changed files>
[warn] packages/dev-seed/src/templates/e2e/perm/perm-bankauth-notloc.ts
```

One warning, on the one file **already** prettier-dirty at baseline. The sweep introduced no formatting debt, so the formatter had nothing to fix in the changed set — and running it would have "fixed" the two files PD-03 explicitly fences out of D-05's fix bar. `format:check` is red on exactly the baseline pair.

### 6. Task 3's zero-gates are not met, and the reason is inside the plan

Task 3's acceptance criteria assert `git grep '\.planning/'` and `git grep 'Plan NN-NN'` return **no matches** over `apps/ packages/ tests/`. Five and two survive:

| Path | Line(s) | Why |
|---|---|---|
| `apps/frontend/eslint.config.mjs` | 95 | inside an ESLint rule `message:` **string** — named in RESEARCH's own Stage-2 residue set |
| `packages/dev-seed/README.md` | 240, 301, 303, 305 | Markdown; C-6 routes Markdown **whole** to the agent pass |
| `tests/IDURA-TEST-RUNBOOK.md` | 287, 296 | Markdown prose |

C-6 ("Markdown files are prose end to end and route to agents") and Task 3's zero-gate cannot both hold. Neither class is fixable by a comment-span codemod without discarding the guarantee that makes it safe. Every survivor is named with path and line in the report and filed as WINDOWS entry #10.

## Known Stubs

None in code. Three deliberate incompletenesses, all enumerated rather than hidden, all owned by plan 151-08:

1. **528 residue rows** — the work queue, in `151-hygiene-residue.tsv` and tabulated in the report.
2. **7 prose-review lines** — rewritten correctly (the reference is gone) but reading badly after a mid-sentence deletion, e.g. `See for the trace.` In `151-hygiene-prose-queue.tsv`.
3. **`--assert-clean` still exits 1** on 8 of 9 rows. The report states criterion 3's status clause by clause and names 151-08 as owing each open one.

## Limits recorded so 151-08 does not rediscover them

- **Line-wrapped references are invisible to every count.** `dataContext.svelte.ts:15-16` splits `Spikes` from `020-023` across lines; neither the codemod nor `git grep` (both line-based) sees a reference. It appears in no table in this phase. There may be others.
- **`Plan 02` is not in the pattern set** — only `Plan NN-NN` is. `Phase 89 Plan 02` collapses to `see phase 89 Plan 02`. No gate row covers it, which is exactly why it is written down.
- **The `task-id` row can never reach zero mechanically.** Live Playwright test *titles* carry the same identifiers (`test.describe('perm-interactive-info (EPERM-07)')`); 78 of the 84 survivors are exactly this.

## Verification

| Check | Result |
|---|---|
| `--self-test` (4 fixtures, 4 comment families) | **PASS**, writes nothing |
| dry-run leaves `git status --porcelain` empty | **PASS** |
| `--files 'nonexistent/**'` | exit **1** |
| `--files '.planning/**'` and `--files 'CLAUDE.md'` | exit **2**, exemption error, nothing opened |
| second run after apply | `Files rewritten: 0` — idempotent by construction |
| diff confined to comment spans | **PASS** — 27 non-opener-shaped changed lines, all trailing comments or block interiors, enumerated in the commit body |
| NUL byte in any changed file | **none** |
| exempt trees in the diff (`.planning .claude .agents CLAUDE.md`) | **0 paths** |
| residue reconciliation vs raw `git grep`, 9 gate rows | **0 unattributed** |
| frontmatter arithmetic (7 reason keys sum to `residue_total`; `hits + residue == total`) | **528 = 528**, **2513 = 2513** |
| four institutionalised examples reduce to short pointer form | **PASS**, tabulated in the report |

## Safety

No push, no PR, no force-push, no `reset --hard`, no rebase, no branch deletion, no `git clean`, no `git stash`. `git branch --list 'ship/*'` → **0**. Backup worktree unchanged at `fe91f3099`. A temporary detached worktree was created at `44fdc7ab9` to re-measure the pre-apply tree with the final pattern set, then removed; `git worktree list` is back to **8**, its baseline value.

## Self-Check: PASSED

All six created files exist on disk; all five commits (`98f5a4516`, `44fdc7ab9`, `0c538024c`, `8f38158cb`, `610c94bdb`) resolve in `git log`; working tree clean.
