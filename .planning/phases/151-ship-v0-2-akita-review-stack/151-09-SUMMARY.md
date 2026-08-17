---
phase: 151-ship-v0-2-akita-review-stack
plan: 09
subsystem: release-engineering
tags: [git-stack, code-review, disposition-matrix, pure-rename, partition-integrity, checklist-sweep]
status: complete

requires:
  - phase: 151-05
    provides: "the operator-approved twelve-slice partition + slices.tsv + the canonical pathspec reader"
  - phase: 151-06
    provides: "the D-22 integration merge (criterion 7's target as a single ref), the 163-cell disposition scaffold, PD-01/PD-02, and the 842-file dropped-finding class"
  - phase: 151-08
    provides: "criterion 3 closed with an operator-approved red gate; the branch tip the slices are cut from"
provides:
  - "the stack's base and bottom three slices as live local branches: ship/v0.2-akita-01a-layout-move (602b79351), -01b-strapi-removal (4a7c85934), -02-shared-packages (4c7d3db5a)"
  - "36 terminal disposition cells for slices 01a, 01b and 02 — NOT-SWEPT 21, FIXED 6, DEFERRED 6, MET 3, zero MET on any content-shaped item of the rename slice"
  - "the sweep-fix-cut loop executed end to end, so plans 151-11..151-17 have a proven procedure rather than a described one"
  - "F-11..F-17 — seven new findings, five fixed pre-cut per D-04"
  - "F-15: the structural blocker that no unclaimed file can be fixed without amending the partition, with the remedy named"
  - "F-17: the invisible-to-review class is 1202 files, not 842, and the unclaimed-by-pathspec count is 120, not 110"
  - "the measured fact that stack states 01a..09 declare workspaces that do not exist, with a standing instruction for PR #1's body"
affects:
  - "plan 151-10 (opens PR #1 and #2; owns the workspace-globs explanation in pr-bodies/01.md)"
  - "plans 151-11..151-17 (copy this loop; must NOT copy the plan's broken <verify> string)"
  - "plan 151-16 (owns F-01, F-10, F-15's operator decision, F-16's now-fixed file, and the ~140-file stale-path class)"
  - "plan 151-17 (CLAUDE.md's missing @openvaa/dev-tools entry)"
  - "plan 151-18 (phase-level items 11, 12 and 16 — this plan supplied measured evidence for all three)"

actuals:
  tokens: 15767
  tasks: 3
  commits: 7

tech-stack:
  added: []
  patterns:
    - "sweep from the target tree, not the slice diff, for any file byte-identical across the layout move"
    - "per-slice catch-all + partial-stack tree identity run immediately after each cut, so a partition bug localises to the slice that caused it"
    - "catch-all measured in a scratch GIT_INDEX_FILE and compared by write-tree, so the measurement creates no commit and no ref"
    - "a disposition cell may not read FIXED before the commit it must cite exists — PENDING is the honest intermediate state"

key-files:
  created:
    - .planning/phases/151-ship-v0-2-akita-review-stack/151-09-SUMMARY.md
  modified:
    - .planning/phases/151-ship-v0-2-akita-review-stack/151-DISPOSITION.md
    - .planning/phases/151-ship-v0-2-akita-review-stack/151-STACK-MANIFEST.md
    - packages/README.md
    - packages/app-shared/src/utils/mergeSettings.ts
    - packages/dev-tools/src/pem-to-jwk.ts
    - .prettierignore

key-decisions:
  - "Findings on the 120 unclaimed files are DEFERRED, not fixed: fixing one breaks the catch-all and byte-identity, and the remedy edits an operator-approved slices.tsv — an agent's call to make would violate the record's own 'no agent may create a waiver unilaterally' rule"
  - "The plan's automated <verify> asserts the 01a status set equals 'DR'; a correct pure-rename commit yields 'R', so the assertion would have passed only on a broken slice. Asserted the plan's prose criterion (R>0, A=0, M=0) instead and recorded the correction in the manifest"
  - "Items 12 and 16 are phase-level in this record's arithmetic, so the plan's instruction to disposition them per-slice was not followed literally; their evidence is recorded as input to the phase-level cells, which stay PENDING->18"
  - "D-19's one-agent-per-item fan-out ran sequentially because the executing context had no subagent tool; the one-lens-across-the-slice property is preserved, the parallelism is not"
  - "packages/README.md was reformatted with prettier on that single path only — yarn format would have 'fixed' the two PD-03-fenced files and worsened the baseline"

patterns-established:
  - "Reconcile a class count against an independent source before trusting it: the 842 dropped-finding class balanced internally and still undercounted the invisible-to-review set by 360"
  - "State a completeness claim in a doc only if you can enumerate it — packages/README.md's 'No other packages currently diverge' was false about five workspaces on the day it was written"
  - "A red exit code is only meaningful once you know which rows produced it — applied to verify-commit-taxonomy.sh over a branch sub-range, as 151-08 established for the hygiene gate"

requirements-completed: [criterion-1, criterion-2, criterion-4, criterion-6]

metrics:
  duration: ~35m
  completed: 2026-08-17
---

# Phase 151 Plan 09: Sweep and Cut the Bottom Three Slices Summary

**Executed the sweep-fix-cut loop end to end on the stack's three cheapest slices — 36 disposition cells with `MET` as the rarest verdict, five fixes landed pre-cut, and three chained local branches whose base is provably renames only (`1316 R / 0 A / 0 M / 0 D`) and whose partition arithmetic closes at a gap of exactly zero.**

## What was built

| Task | Outcome | Commit |
|---|---|---|
| 1 | Sweep of slices 01a, 01b, 02 against the 12 per-slice checklist items — 36 cells, 7 new findings | `ad914dc1e` |
| 2 | Five queued fixes landed on `feat-gsd-roadmap` before any cut (D-04) | `63c1a180e`, `36dde5287`, `572b5dd20`, `70c3ad770`, cells closed in `3c40ae8ad` |
| 3 | Three slices cut from the fixed tip; catch-all + partial-stack identity verified; manifest updated | `03e5227b2` |

## Task 1 — the sweep, and the four things it found that nobody was looking for

The sweep itself is recorded cell by cell in `151-DISPOSITION.md` § "Slices 01a, 01b and 02 — cell-by-cell evidence" and is not restated here. Four results are worth surfacing because they change what a later plan must do.

**1. The invisible-to-review class is 1,202 files, not 842 (F-17).** The 842 the manifest and 151-06 enumerate is the *moved-and-identical* subset. The full set of files that ship in the stack and appear in **no** slice's diff is `5052 tracked at TARGET − 4274 in the comparable diff = 1202`. The extra **360** were never moved and are byte-identical at both ends — **341 of them inside slice 02's own pathspec**. This is not a partition defect: those 360 are unchanged by v0.2 and so are correctly `NOT-SWEPT — unchanged by v0.2, outside the phase boundary's net-diff scope`. It matters because F-09 as written claims 842 files "ship with their content reviewed by nobody", and the honest number for *that* claim is 1,202. Relatedly, the unclaimed-by-any-pathspec count is **120**, not 110.

**2. Fixing an unclaimed file is structurally impossible without amending the partition (F-15).** `build-slice.sh` derives each slice from `PARENT..TARGET` restricted to a pathspec, so a `TARGET`-side change to a path no pathspec claims enters **no** slice, lands in the catch-all, and breaks both `files=0` and criterion 7's byte-identity. This is what blocks F-01 (`jest.config.json`), F-10 (the 89 Capacitor orphans), and the finding below. The remedy is named precisely in the record so 151-16 need not re-derive it — claim `README.md` into slice 09 and `apps/frontend/{android,ios,jest.config.json}` into slice 10 — but it edits an operator-approved `slices.tsv`, so it is flagged as the operator's decision, not taken.

**3. The repo's front-page README image is broken by the layout move, and nobody can see it.** `README.md:12` renders `<img src="./docs/static/images/shiba-inu-facing-front.png">`. That blob exists at `origin/main:docs/static/images/…` and at `TARGET:apps/docs/static/images/…` — and not at the path the README names. `README.md` is byte-identical at both ends, so it is in no slice's diff, and it is claimed by no pathspec, so it is blocked by F-15. It is the single cleanest instance of the class this plan was told to own: a real defect, caused by v0.2, invisible to every reviewer, and unfixable without a partition decision.

This also widens **F-04** substantially. Research measured the stale-path class at 13 files / 20 occurrences of the `docs/src/routes/…` spelling. The class is really **~140 files / 269 occurrences** of pre-move path references, including `.github/workflows/claude.yml`, `.github/workflows/claude-code-review.yml` and `.github/PULL_REQUEST_TEMPLATE` — all three byte-identical at both ends and therefore in no slice's diff either.

**4. Stack states 01a through 09 cannot `yarn install`.** `origin/main`'s root `package.json` declares `workspaces: ['packages/*', 'backend/vaa-strapi', 'backend/vaa-strapi/src/plugins/*', 'frontend', 'docs']`. Slice 01a moves `frontend/` and `docs/` but — being a pure rename by rule — does not touch `package.json`; slice 01b deletes `backend/vaa-strapi`. The fix lands in slice **10**. So three of the five globs are stale for nine slices. This is D-11 working as designed, and it is the concrete mechanism behind Pitfall 7's "PR #1 will likely be red in isolation". A **standing instruction for plan 151-10** is recorded: say this in `pr-bodies/01.md`, naming the globs, because a reviewer meeting an unexplained red CI run will read it as a broken PR.

**Slice 01a carries zero `MET` on any content-shaped item**, which was an acceptance criterion rather than an outcome. Its twelve cells are 9 `NOT-SWEPT` (each with a mandatory reason) and 3 `DEFERRED`. Across all three slices the token totals are `NOT-SWEPT` 21, `FIXED` 6, `DEFERRED` 6, `MET` 3 — `MET` is the *rarest* verdict in the three cheapest slices in the stack, which is the shape an honest sweep of a rename slice and a deletion slice should produce.

## Task 2 — five fixes, all landed before any slice was cut

| ID | Items | Fix | Commit |
|---|---|---|---|
| **F-11** | 6, 7 | `packages/README.md` claimed "No other packages currently diverge." in the same change that adds a diverging package. Seven workspaces diverge; each is now named with *what* it diverges on. | `572b5dd20` |
| **F-12** | 3, 4 | A new file opened a bare `eslint-disable no-explicit-any` over four `as any` casts. The reason is now documented, including why `Record<string, unknown>` is worse and why `@ts-expect-error` was rejected. | `63c1a180e` |
| **F-13** | 3, 6 | Exported `DeepPartial<TObject>` had no TSDoc, against the guide's "add comments to all exported variables". | `63c1a180e` |
| **F-14** | 1, 10 | `pem-to-jwk.ts` matched `BEGIN ENCRYPTED PRIVATE KEY` then handed the blob to `jose.importPKCS8`, which takes no passphrase — an opaque decode error where every other invalid input in the same file was handled. Now detected, with the `openssl` command in the message. | `36dde5287` |
| **F-16** | 5, 7 | `.prettierignore` shipped six ignore lines for `apps/strapi/**`, **a path that has never existed here**. At `origin/main` the same block reads `backend/vaa-strapi/**` — v0.2 rewrote the dead block instead of deleting it with the tree. | `70c3ad770` |

**All four gates match `151-BASELINE.md` exactly**, re-run under `TURBO_FORCE=1` because a bare re-run can be a cache replay:

| Gate | Baseline | After | |
|---|---|---|---|
| `yarn build` | 14/14 | 14 successful / 14 total, **0 cached** | unchanged |
| `yarn test:unit` | 1522 / 149 files | **1522 / 149** (16+244+21+22+446+773 across 1+47+3+1+43+54), 21/21 tasks, 0 cached | unchanged |
| `yarn lint:check` | 0 errors / 20 warnings | **0 errors / 20 warnings** (core 2, dev-seed 15, frontend 1, tests 2), 11/11, 0 cached | unchanged |
| `yarn format:check` | RED on exactly 2 | RED on exactly **2** — the same two PD-03-fenced files | unchanged |

`e2e_collisions` stays **0**: PD-01's trigger is a *landed* fix taking a gate green-to-red, and no landed fix did. One transient is recorded rather than counted — F-14's first draft used a template literal for a non-interpolating string and tripped `quotes` (1 error), corrected before the commit existed. It is recorded because a suppressed transient is how a real collision gets normalised.

## Task 3 — the cut

| slice | branch | commit | files | +lines | −lines |
|---|---|---|---|---|---|
| 01a | `ship/v0.2-akita-01a-layout-move` | `602b79351` | 1316 | **0** | **0** |
| 01b | `ship/v0.2-akita-01b-strapi-removal` | `4a7c85934` | 252 | 0 | 55663 |
| 02 | `ship/v0.2-akita-02-shared-packages` | `4c7d3db5a` | 97 | 1273 | 289 |

- **01a is renames only at the maximally hostile setting.** `diff.renameLimit=1` yields a single row, `1316 R`, with `0 A`, `0 M` and `0 D`; `git show -M --shortstat` reads `1316 files changed, 0 insertions(+), 0 deletions(-)`. Its parent is `origin/main` = `ac30f132a`, still unmoved since research.
- **The chain is intact:** `01b^ == 01a` and `02^ == 01b`, both verified by `rev-parse`.
- **Catch-all `files=3925`**, and `252 + 97 + 3925 = 4274` = the comparable total. **Gap: 0.** The 3925 is attributed slice by slice (118+162+195+526+213+329+39+37+2306), every count matching the dry run file for file except slice 11's +19 `.planning/` growth. Deviation from the dry run's predicted 3906 is **0.486%**, inside the 1% halt threshold and fully explained.
- **Partial-stack identity:** `read-tree TIP02` plus the catch-all applied produces tree `6f8fa499e`, equal to `TARGET^{tree}`. The catch-all was applied into a scratch `GIT_INDEX_FILE` and compared by `write-tree`, so **no commit and no ref was created for it** — literally honouring "it is a measurement, not a slice".
- **Nothing pushed:** `git ls-remote --heads origin 'ship/*'` is empty. `git status --porcelain` is empty and `HEAD` never left `feat-gsd-roadmap`.

Slice 02's `+lines` moved 1228 → 1273. The 45-line delta is this plan's three slice-02 fixes, landed pre-cut exactly as D-04 requires, so the reviewer of PR #3 sees corrected code and never a fix-of-itself.

## Deviations from Plan

### 1. [Rule 1 — Bug] The plan's automated `<verify>` for slice 01a asserts a status set that a correct slice cannot produce

**Found during:** Task 3.
**Issue:** The plan's `<verify>` is `test "$(git -c diff.renameLimit=1 show -M --name-status --format= ship/… | cut -c1 | sort -u | tr -d '\n')" = "DR"`. `git diff --name-status` renders a rename as **one** line, `R100<TAB>old<TAB>new`; there is no accompanying `D` line. A correct pure-rename commit therefore yields `"R"`, and a `"D"` in that set would mean 01a *deleted* a file — the exact failure the assertion exists to catch. The check would have failed on a correct 01a and passed only on a broken one.
**Fix:** Asserted the plan's own prose acceptance criterion instead — R > 0, A = 0, M = 0 — which passed at `R=1316 A=0 M=0`, and additionally asserted `D=0`. Measured value recorded verbatim.
**Files modified:** `151-STACK-MANIFEST.md` (the correction is written where the next plan will read it, with an explicit warning not to copy the plan's string).
**Commit:** `03e5227b2`.

### 2. [Rule 1 — Bug] `packages/README.md` was newly `format:check`-dirty after the F-11 edit

**Found during:** Task 2.
**Issue:** The F-11 edit made a third file fail `format:check`, worsening the baseline of exactly two.
**Fix:** `npx prettier --write packages/README.md` — that single path only. `yarn format` was **not** run, because it would also have "fixed" the two PD-03-fenced files that the baseline deliberately leaves red. Confirmed the file was prettier-clean at `HEAD` before the edit, so the dirt was mine and not pre-existing.
**Commit:** `572b5dd20`.

### 3. [Rule 3 — Blocking] F-14's first draft tripped the `quotes` lint rule

**Found during:** Task 2. A non-interpolating template literal at `packages/dev-tools/src/pem-to-jwk.ts:80`, 1 error under `TURBO_FORCE=1`. Converted to a single-quoted string; lint returned to 0 errors / 20 warnings. Nothing was ever committed red, so PD-01 was not reached and `e2e_collisions` stays 0.

### 4. [Recorded discrepancy] The plan directs per-slice disposition of two phase-level items

**Issue:** Task 1 directs slice 01a to disposition **item 16** (commit history) and slice 01b to disposition **item 12** (blast radius). Both are phase-level in this record's arithmetic (items 1, 11, 12, 16), dispositioned once by plan 151-18, and neither has a per-slice cell.
**Resolution:** The record's arithmetic governs — filling per-slice cells for them would push `cells_expected` from 163 back toward the superseded 207. The evidence was not discarded: it is recorded as explicit input to those phase-level cells, which stay `PENDING→18`. That is where the workspace-globs finding and 01a's taxonomy-as-history-evidence live.

### 5. [Recorded deviation] D-19's fan-out ran sequentially

The executing context had no subagent-spawning tool, so "one agent per checklist item" ran as one lens at a time applied across the whole of each slice's file set. The property D-19 buys — an item judged consistently across a slice rather than file-by-file — is preserved; the parallelism is not. Recorded because a later plan may have the tool.

## Known Stubs

None. No stub, placeholder, skipped test or unrun `<verify>` was introduced. The two `<verify>` blocks that exist were both run: Task 1's blank-cell scan (`0 blank cells`) and Task 2's `yarn test:unit && yarn lint:check` (both green at baseline). Task 3's `<verify>` was corrected before running, per Deviation 1.

## Deferred Issues

Six findings ship unfixed, each with its rationale in `151-DISPOSITION.md` and each routed to the plan that owns the file:

| ID | Routed to | Why not fixed here |
|---|---|---|
| **F-01**, **F-10** | 151-16 | Blocked by F-15 — no pathspec claims `jest.config.json` or `apps/frontend/{android,ios}` |
| **F-15** (incl. the broken `README.md:12`) | 151-16 | The remedy edits an operator-approved `slices.tsv`; that is the operator's call |
| **F-04**, widened to ~140 files / 269 occurrences | 151-16 | The bulk is slice 09's and slice 10's, both uncut; D-07 sweeps bottom-up |
| `CLAUDE.md` omits `@openvaa/dev-tools` | 151-17 | Slice 11's file |
| `app-and-repo-structure/+page.md:7-21` omits `@openvaa/dev-tools`, keeps `@openvaa/strapi`, links `blob/main/frontend/` | 151-16 | Slice 09's file |

## Notes for the next plans

- **151-10** opens PR #1 and #2. The workspace-globs explanation is a standing instruction, not a suggestion — see § "Evidence contributed to phase-level item 12" in the disposition record.
- **151-11 … 151-17** copy this loop. **Do not copy the plan's `<verify>` string.** Do run the catch-all and the partial-stack tree comparison after every cut; both cost seconds and both closed at 0 here.
- The standing sum-check is now stated as an *identity* (Σ per-slice `files=` equals the comparable total) rather than a literal, because the literal has moved three times — 4255 → 4257 → 4274 — every time from `.planning/` growth that rides slice 11.

## Self-Check: PASSED

| Claim | Check | Result |
|---|---|---|
| `151-09-SUMMARY.md` created | `[ -f … ]` | FOUND |
| `151-DISPOSITION.md` modified | `git show ad914dc1e --stat` | FOUND |
| `151-STACK-MANIFEST.md` modified | `git show 03e5227b2 --stat` | FOUND |
| Commits `ad914dc1e`, `63c1a180e`, `36dde5287`, `572b5dd20`, `70c3ad770`, `3c40ae8ad`, `03e5227b2` | `git log --oneline --all \| grep -q` | all 7 FOUND |
| Branches `ship/v0.2-akita-{01a-layout-move,01b-strapi-removal,02-shared-packages}` | `git branch --list … \| wc -l` → 3 | FOUND |
| Nothing pushed | `git ls-remote --heads origin 'ship/*'` | empty |
| Worktree clean | `git status --porcelain` | empty |

---

*Phase: 151-ship-v0-2-akita-review-stack · Plan 09 · completed 2026-08-17*
