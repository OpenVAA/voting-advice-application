---
phase: 151-ship-v0-2-akita-review-stack
plan: 06
subsystem: release-engineering
tags: [git-stack, merge, disposition-matrix, procedural-decisions, code-review]
status: complete
requires:
  - 151-05 (the operator-approved twelve-slice partition + slices.tsv)
  - 151-03 (the backup worktree pinning the pre-sweep tip)
provides:
  - "criterion 7's byte-identity target as a SINGLE REF on feat-gsd-roadmap (commit d55587fb1)"
  - "151-DISPOSITION.md — 163-cell matrix, closed 4-token verdict vocabulary, 0 blank cells"
  - "PD-01 (E2E escape hatch) and PD-02 (migration gate) written down before any sweep fix exists"
  - "the dropped-finding class enumerated: 842 files, 110 unclaimed by any slice pathspec"
affects:
  - "plans 151-09 … 151-18 (every sweep fills cells in 151-DISPOSITION.md)"
  - "plan 151-11 (PD-02 migration gate) and 151-14 (PD-01 collision rule)"
  - "plan 151-09 (owns the dropped-finding class as a whole)"
tech-stack:
  added: []
  patterns:
    - "git merge-tree --write-tree + commit-tree two-parent form + merge --ff-only (no destructive reset)"
    - "generator-written record so cell arithmetic is self-consistent by construction"
key-files:
  created:
    - .planning/phases/151-ship-v0-2-akita-review-stack/151-DISPOSITION.md
    - apps/docs/static/images/youthvotes-logo.png
  modified:
    - apps/docs/src/routes/+page.svelte
decisions:
  - "items_total is 31, not the plan's 30 — checklist line 8 uses NBSP in its task marker"
  - "cells_expected is 163, not the plan formula's 207 — the formula double-counts 4 phase-level items"
  - "the integration commit is classed `chore`, not `docs`, so it cannot perturb clause 4.2's docs count == 1"
  - "the standing sum-check is re-baselined 4255 → 4257, with the delta attributed file by file"
metrics:
  duration: ~50m
  completed: 2026-08-17
actuals:
  tokens: 21000
  tasks: 4
  commits: 3
---

# Phase 151 Plan 06: origin/main Integration + Disposition Scaffold Summary

**Landed `origin/main` on `feat-gsd-roadmap` as one honest two-parent merge (`d55587fb1`), collapsing criterion 7's byte-identity target from a described construction to a single ref — then scaffolded the 163-cell disposition matrix on a corrected 31-item checklist index and wrote down the two procedural rules the phase would otherwise have improvised.**

## What was built

| Task | Outcome | Commit |
|---|---|---|
| 1 | Checkpoint `decision` — D-04 one-way fix-ordering. Operator selected **proceed**. | *(no file delta)* |
| 2 | The `origin/main` integration commit, two parents, delta read hunk by hunk before landing. | `d55587fb1` |
| 3 | `151-DISPOSITION.md` scaffolded — 163 cells, 0 blank, closed 4-token vocabulary. | `a41c1d023` |
| 4 | PD-01 + PD-02 recorded verbatim in that same record, with their costs attached. | `8ca07aae0` |

## Task 2 — the merge, and why the exit status was ignored

`origin/main` was re-resolved after `git fetch` and is **still `ac30f132a`**, so C-12's re-measurement trigger did not fire.

`merge-tree --write-tree` exited **1** while succeeding, exactly as carried forward — the notice was the benign `CONFLICT (file location)` reporting a placement merge-ort had **already made correctly**. The tree was judged by inspection, never by status.

The delta was exactly what research measured: **2 files, 11 insertions, 0 deletions**, both under the *moved* `apps/docs/` tree.

Verified before landing, in the merged tree rather than the worktree:

- **276 blobs** scanned under `apps/docs/` — **0 conflict markers**.
- Merged front page is **231 lines** = 220 + 11, and carries **both** main's YouthVotes block **and** the branch's own a11y additions (`role="group"`, the showcase `aria-label`, both `sr-only` prev/next labels).
- Logo blob `f109566c5` is **byte-identical** across the move and **absent** from the pre-move `docs/` path.
- The only surviving top-level `docs/` path is `docs/key-generation.md`, which the manifest states the rename rule deliberately does not cover.

All **8 acceptance assertions passed** at landing: tree equality, exactly one commit added (2582 → 2583), `^2 == origin/main`, `^1 == old tip`, 2 files all under `apps/docs/`, no markers, clean tree.

Landed with `commit-tree` + **`git merge --ff-only`** — the new commit's first parent *is* the old tip, so the branch moved and the worktree updated **without any `reset --hard`**.

## Deviations from Plan

### Auto-fixed / corrected

**1. [Rule 1 — Bug] The plan's `items_total: 30` is factually wrong; the checklist has 31 items.**
Measured: `grep -c '^- \['` → **31**, `grep -c '^- \[ \] '` → **30**. Line 8 (the *"Avoid using `any`"* item, **general item #4**) is written `- [<U+00A0>]<U+00A0>Avoid…` — two NBSPs. Frontmatter records `items_total: 31`; the body records the supersession and names the superseded value, so the plan's `<verify>` grep still passes **and the record says why it is not evidence**. Numbering pinned 1–31 per `151-MEASUREMENTS.md` § 0.

**2. [Rule 1 — Bug] The plan's `cells_expected` formula yields 207; its own action text yields 163.**
16 × 12 + 15 = 207 double-counts the four phase-level items across all twelve slices, which the same plan forbids. 207 − 48 + 4 = **163**. Arithmetic shown in the body.

**3. [Rule 2 — Missing critical functionality] PD-02's migration gate, taken literally, could never fire.**
The rule names `apps/supabase/migrations/` — which matches **zero tracked files**. Migrations live at `apps/supabase/supabase/migrations/` (3 files). Recorded as a path note attached to PD-02 instructing the gate to match the real path. `CLAUDE.md` is stale on **all three** `apps/supabase/` paths (migrations, functions, tests).

**4. [Rule 2] The integration commit is classed `chore`, not `docs`.**
`verify-commit-taxonomy.sh` caps the `docs` class at **count == 1** (clause 4.2), which slice 09 owns. A `docs:` subject here could perturb a cardinality clause; `chore` is unconstrained. Stated in the commit message itself.

**5. [Rule 3 — Blocking] A new zsh trap, cousin of the carried-forward one.**
`"$TREE:apps/…"` had `:a` consumed as zsh's **absolute-path parameter modifier** (and `:docs/` as `:d`, dirname), silently invalidating four verification checks — they reported `MISSING` for content that was present. Fixed by moving all verification into `bash` script files with `${TREE}:path` brace form. **The tool shell is zsh; this is the second distinct way it has corrupted this phase's work.**

**6. [Rule 1] The standing `Σ files == 4255` assertion now reads 4257 — benign, and attributed rather than assumed.**
Reconstructing plan 151-05's own target at its measurement tip `faf55161b` reproduces tree **`e424d633e`** and total **4255** exactly. Today's delta is exactly two files — `151-05-SUMMARY.md` and `151-STACK-MANIFEST.md`, written by 151-05's own doc commits. **Zero files left the set.** Re-baselined to **4257**, and it will keep growing as each plan writes `.planning/` artifacts (which ride slice 11).

## The dropped-finding class — the standing instruction, discharged

The manifest's enumerating command was run against the landed merge (`C1 = dd88de20c`, `TARGET = d55587fb1`). **The class is 842 files, not one.**

| Area | Files | Claimed by a slice pathspec? |
|---|---:|---|
| `apps/frontend/**` | 603 | 493 inside slice 06; **110 claimed by no slice at all** |
| `apps/docs/**` | 239 | all inside slice 09 |

This does **not** break the partition or byte-identity — these files are identical at both ends, so no slice needs to touch them and the catch-all correctly reports `files=0`. It is a **review** gap, not a construction gap.

Two new findings raised from working the class:

- **F-09** — the class itself. 842 files ship with their content reviewed by nobody: rendered as a rename list in PR #1, absent from every later slice diff. `F-01` is one known instance, not the only one.
- **F-10** — **89 orphaned Capacitor files.** `apps/frontend/{android,ios}/` remain tracked while `capacitor.config.ts` is **deleted by v0.2** (present at `C1`, absent at `TARGET`). `@capacitor/*` appears in **no `package.json`**, `yarn.lock` has **0** capacitor entries, and no source imports it. A reviewer of slice 10 sees the config deleted and would reasonably conclude the removal is complete — **the 89 orphans are invisible to them.**

The **110 unclaimed** files have no owning sweep by pathspec; plan 151-09 must disposition them or declare them `NOT-SWEPT` with a reason. Silence there is a record defect.

### D-22's own row converges with the class

The logo I just merged (`youthvotes-logo.png`) **is itself in the dropped-finding class** — byte-identical at both ends, so no slice diff shows it. D-22's requirement that this content carry its own disposition row is not bookkeeping; it is the only thing that will surface it.

One finding recorded from reading the merged hunk: the block contains `target="_blank"` with **no `rel="noopener noreferrer"`**. Severity is low (modern browsers imply `noopener`), but it arrived from `origin/main`, is produced by no v0.2 commit, and would otherwise be dispositioned by nobody.

## Known Stubs

`151-DISPOSITION.md` is a **scaffold by design** — `cells_filled: 0` of 163, every cell carrying `PENDING→NN` naming the plan that fills it. This is the plan's specified output, not an unfinished stub: the approval gate closes at 151-18 when `cells_filled == cells_expected` **and** `blank_cells == 0`. `blank_cells` is already **0**.

## Open discrepancies recorded (not silently resolved)

1. Plan says `items_total: 30`; truth is 31. → 31 authoritative.
2. Plan formula gives 207 cells; body text gives 163. → 163.
3. `151-STACK-MANIFEST.md` assigns the `C1..TIP` taxonomy run to **151-17**; `151-18`'s objective explicitly names "commit taxonomy". → Item 16 cites **151-18**, flagged so neither plan assumes the other did it.
4. `CLAUDE.md` stale on all three `apps/supabase/` paths.
5. Sum-check re-baselined 4255 → 4257 with the delta attributed.

## Verification

| Check | Result |
|---|---|
| Merge commit tree == `merge-tree` output (`4cadd9176`) | **PASS** |
| `d55587fb1^2 == origin/main` | **PASS** |
| No conflict markers under `apps/docs/` | **PASS** |
| `cells_expected: 163` + closed vocabulary section | **PASS** |
| PD-01/PD-02 present with triggers and costs | **PASS** |
| v2.14 condition 4 quoted **byte-verbatim** vs source lines 58–60 | **PASS** |
| Frontmatter parses as YAML, all required keys | **PASS** |
| `blank_cells == 0` | **PASS** |

> The plan's literal criterion *"`git rev-parse feat-gsd-roadmap^{tree}` equals the `merge-tree` OID"* is **necessarily false after Tasks 3–4**, which commit new files on top by design. It held at Task 2 (8/8) and the durable form — asserted at the merge commit — passes.

## Safety

No push, no PR, no force-push, no `reset --hard`, no rebase, no branch deletion, no `git clean`, no `git stash`. `git branch --list 'ship/*'` → **0**. Backup worktree unchanged at `fe91f3099`. `origin/feat-gsd-roadmap` remote-tracking ref untouched at `97f55cb41`.

## Self-Check: PASSED

All created files exist on disk; all three commits (`d55587fb1`, `a41c1d023`, `8ca07aae0`) resolve in `git log`; working tree clean.
