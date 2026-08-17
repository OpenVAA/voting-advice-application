---
phase: 151-ship-v0-2-akita-review-stack
plan: 16
subsystem: release-engineering
tags: [review-stack, documentation, partition, checklist-disposition, ci]
status: complete

requires:
  - "151-15 (slices 07 and 08 cut; slice 08 unpushed)"
  - "the operator's F-15 decision, taken at this plan's checkpoint"
provides:
  - "slices 09 and 10 cut; criterion 4.2 satisfied structurally by 2865b05b3"
  - "PRs #871 and #872 open — the stack is ten of twelve PRs deep"
  - "items 7 and 15 discharged phase-wide in one reconciled 17-entry list"
  - "the amended slices.tsv: README.md claimed by slice 09, the Capacitor scaffold by slice 10"
  - "151-DISPOSITION.md at cells_filled 147 of 163"
affects:
  - "plan 151-17 (opens PR 11; owes slice 10's body TWO cold-reviewer justifications; owns F-07, F-81, F-86)"
  - "plan 151-18 (phase-level items 1, 11, 12, 16; the D-24 E2E run; F-79, F-80, F-87)"
  - "plan 151-19 (F-83 — lint:check does not reach apps/docs)"

metrics:
  duration: "one session"
  completed: 2026-08-17

actuals:
  tokens: 119211
  tasks: 3
  commits: 15

tech-stack:
  added: []
  patterns:
    - "re-derive an invisible-file census by a second, independent method (ls-files vs diff) before trusting either"
    - "prove a substring-based finding count with a negative lookbehind before treating it as a target set"
    - "assert per file that a pathspec claims nothing already cut, so a partition amendment provably needs no force-push"
    - "measure both the --no-renames and the rename-aware triple even when they coincide, and say that they do"

key-files:
  created:
    - .planning/phases/151-ship-v0-2-akita-review-stack/pr-bodies/08.md
    - .planning/phases/151-ship-v0-2-akita-review-stack/pr-bodies/09.md
    - .planning/phases/151-ship-v0-2-akita-review-stack/151-16-SUMMARY.md
  modified:
    - .planning/phases/151-ship-v0-2-akita-review-stack/151-DISPOSITION.md
    - .planning/phases/151-ship-v0-2-akita-review-stack/151-STACK-MANIFEST.md
    - .planning/phases/151-ship-v0-2-akita-review-stack/slices.tsv
    - README.md
    - .agents/code-review-checklist.md
    - ROADMAP.md
    - apps/docs (120 files)
    - .github/PULL_REQUEST_TEMPLATE
    - .github/workflows/claude-solve-issue.yml
    - apps/frontend/docker-compose.dev.yml
  deleted:
    - apps/frontend/android (55 files)
    - apps/frontend/ios (34 files)
    - apps/frontend/jest.config.json

key-decisions:
  - "F-15 options 1 and 2 accepted by the operator, 3 declined — the first amendment to the operator-approved partition in the phase, and it was taken by the operator rather than by an agent"
  - "F-04's '13 files / 20 occurrences' is a substring artefact: 8 of the 13 were already correct, and the plan's -F acceptance grep is unsatisfiable because the correct path contains the stale one"
  - "273 stale permalinks repaired by path prefix; the 12 targets that still do not resolve are named rather than chased, because each needs a semantic re-target"
  - "the 48 apps/strapi references restored to backend/vaa-strapi rather than deleted — a path that existed beats a path that never did"
  - "both PR bodies state the MEASURED reason no checks run (sibling base), not the plan's markdown-paths claim"
---

# Phase 151 Plan 16: Sweep and Cut the Last Two Code Slices Summary

**The stack's last two code slices are swept, cut and — for slice 09 — published, criterion 4.2 is
satisfied by a single 152-file commit, and the two documentation checklist items that no single slice
owned are discharged phase-wide in one reconciled list with a terminal verdict on every entry.**

## What shipped

| | |
|---|---|
| slice 09 `ship/v0.2-akita-09-docs` | `2865b05b3` — **152 files, +777 / −347** (`2 A / 150 M`) → [#872](https://github.com/OpenVAA/voting-advice-application/pull/872) |
| slice 10 `ship/v0.2-akita-10-root-config` | `3aa503741` — **129 files, +8,662 / −27,267** (`9 A / 94 D / 26 M`), cut and **not** pushed (D-07) |
| slice 08 published | `6a810df8a` → [#871](https://github.com/OpenVAA/voting-advice-application/pull/871) |
| disposition | `cells_filled` **123 → 147** of 163; 24 cells, all terminal, no blanks |
| findings | **F-77 … F-87**, eleven new |

## The operator gate, and why it was worth stopping for

The plan's own instruction was to prepare F-15's remedy and stop, because the remedy edits an
operator-approved `slices.tsv`. **Both options were accepted, and both fixes were structurally
impossible before the decision**: `build-slice.sh` derives every slice as `PARENT..TARGET` restricted
to a pathspec, so a change to a path no pathspec claims enters no slice, lands in the catch-all, and
breaks criterion 7.

- **`README.md:12`** rendered a mascot image at `./docs/static/images/…`, a path that does not exist —
  the v1.1 layout move took the blob to `apps/docs/static/images/`. The file is byte-identical at both
  ends, so it was in no slice's diff *and* claimed by no pathspec: the repository's front page shipped
  a broken image that no reviewer of a twelve-PR stack could see. Fixed in `aad244085`.
- **89 orphaned Capacitor files** plus a dead `jest.config.json`, removed in `6c40fb57b`. Every
  in-repo signal says the scaffold is dead; the residual risk is an **external** app-store pipeline,
  which no in-repo measurement can see, and the operator accepted it knowing that. `pr-bodies/09.md`
  states it in those terms so a reviewer who knows of one can object from the body alone.

**The decision package cost nothing to honour:** it asserted *per file* that all three paths were
claimed by no slice and fell inside no already-cut slice's pathspec, so **no option required a
force-push** — and PRs #863 … #870 were indeed never touched.

## The two documentation items, discharged

A 17-entry reconciled list, each entry terminal: **11 fixed, 1 cross-slice landing, 4 deferred with
rationales, 1 unblocked by the operator**. The headline repairs:

| Finding | Scale | Outcome |
|---|---|---|
| Stale `blob/main/frontend/…` permalinks | **273** occurrences / **117** files | repointed; **240 of 252** distinct targets verified to resolve, one `git cat-file -e` each |
| `apps/strapi/…` — a path that has **never existed** | **48** / 15 files | restored to `backend/vaa-strapi/…` (F-77); same defect shape as F-16, same blanket rewrite |
| Workspace inventory | 2 dead entries, 4 missing | corrected; **symmetric difference against `yarn workspaces list --json` empty both ways** |
| Guides naming removed scripts | 6 sites | `dev:down`/`dev:stop`/`build:app-shared`/`prod` replaced with the current commands |
| Dead links under `.github/` | 3 | reached **from the target tree** — all three files byte-identical across the move (F-84) |
| `.agents/code-review-checklist.md` | 4 links | fixed, **ships in slice 11** — the cross-slice landing, recorded so slice 09's reviewer knows |

**A correction that changes an acceptance command.** F-04 is recorded as *13 files / 20 occurrences*
of `docs/src/routes`. That is a **substring artefact** — `grep -F` also matches the *correct*
`apps/docs/src/routes`, and **8 of the 13 files were already correct**. Measured with a negative
lookbehind the genuinely stale set was **5 files / 11 occurrences**, and is now **1 / 2** (deferred:
its owning slice 02 is published). **The plan's acceptance criterion is unsatisfiable as written**,
because the correct path contains the stale one.

## The measurements that carried the plan

- **Slice 10 measured 37 files against a predicted 37, and slice 09 39 against 39** — the plan's halt
  condition, checked before any fix. Both unchanged from the dry run **file for file** after eight
  intervening plans.
- **The catch-all after slice 10 is 2,321 files and contains zero paths outside slice 11's pathspec.**
  The last real chance to catch a partition gap closes at **0.000%**. Partial-stack identity: tree
  `40f5d20c5` = `TARGET^{tree}`. **MATCH.**
- **Σ per-slice = 4,504 = comparable total, gap 0**; the +208 rise from 151-15 attributed **by set
  difference**, every file named, **zero leaving**.
- **The 120 unclaimed files re-derived by a second, independent method** — `ls-files` census (5,070
  tracked − 4,950 claimed) against 151-06's diff-based derivation. The two agree exactly, and the
  census additionally *enumerates* them, reaching 11 root-level files the earlier method never saw.
- **Rename detection coincides for all three slices, and that was measured rather than assumed.**
  GitHub's API then confirmed both published rows to the digit: `#871 330/+8986/−0`,
  `#872 152/+777/−347`.

## Gates

`build` **14/14**, `test:unit` **1,522 / 149 files**, `lint:check` **0 errors / 20 warnings**
(2+15+1+2), `format:check` **red on exactly the two PD-03 files** — all four under `TURBO_FORCE=1`,
0 cached, identical to `151-BASELINE.md`. New evidence: docs site **builds**, `validate:links`
**0 broken** over 191 files, hygiene gate **byte-identical** (`phase-ref` 660/235/**bare 11**,
`task-id` 84/46).

**One gate was found red that the baseline never covered (F-82).** Root `format:check` chains
`prettier --check .` and the docs workspace's own check with `&&`, so it **short-circuits** on the two
PD-03 files and the docs half had never run in this phase. It was red — on the same D-22-merged block
this record predicted would break it. Now green.

**The 43 E2E specs were not run.** Per `CLAUDE.md` a did-not-run E2E test counts as a failure, so no
green suite is claimed for either slice; D-24 pays that once at 151-18.

## Deviations from Plan

### Auto-fixed and corrected

**1. [Rule 3 — blocking] The plan's task order would have acted before the F-15 gate.** Treated as the
plan defect the gate's own instruction anticipates: Tasks 1 and 2 ran, the decision was prepared with
verbatim edits and per-option counts, and execution halted before Task 3. Resumed on the operator's
acceptance.

**2. [Rule 1 — wrong as written] The markdown-paths CI claim.** The plan instructs `pr-bodies/08.md`
to say a markdown-only PR fires no workflow because CI ignores markdown paths. Slice 08 is **329
`.json` files and one `.md`**; slice 09 has **7** non-markdown files; and `paths-ignore` only filters a
run the trigger already selected. Both bodies state the measured reason — the **sibling base**. The
thirteenth plan-encoded claim in this phase to be wrong as written.

**3. [Rule 1 — wrong as written] The acceptance grep.** See the F-04 correction above; the `-P`
negative-lookbehind form is what was asserted, and the correction is recorded as F-85.

**4. [Rule 2 — completeness] The cell census table was one plan stale**, reading `84 / 99` while the
frontmatter correctly read `123`. Two views of one number disagreeing is this phase's recurring
failure shape, and here the *table* was wrong. Recomputed from the matrix: **132 / 147**.

**5. [Rule 1] A fix caused a gate failure and it was attributed rather than blamed.** The permalink
rewrite widened a markdown table cell in `frontend/contexts/+page.md` and made it non-conforming.
Verified pre-existing-or-not by running prettier over the `HEAD` blob through `--stdin-filepath`
before repairing it — it was clean at `HEAD`, so this plan caused it.

### Deferred, with reasons

`packages/app-shared/src/settings/README.md` (owning slice **published**, so a fix would reach no
slice); the 12 dead permalink targets (F-80, each needs a semantic re-target); the 5 broken root
`docs:*` scripts (F-79, pre-existing, two have no correct target at all); `.bg-shell/manifest.json`
(F-81, no identifiable owner); `"engine"` singular in root `package.json` (F-86, activating it changes
install behaviour for every contributor); the three tracked `tsconfig.tsbuildinfo` files (F-87).

## Known Stubs

None. No placeholder, empty return or "coming soon" was introduced; every deferral above is a
recorded finding with an owner, not an unfinished implementation.

## Threat Flags

None. No new network endpoint, auth path, file-access pattern or schema change at a trust boundary.
The two threat-model entries this plan owned are discharged: **T-151-16-02** (workspace globs) by a
both-directions set comparison, and **T-151-16-03** (partition gap surviving into the planning slice)
by the catch-all equalling slice 11 exactly with zero foreign paths.

## Verification

- [x] 24 cells filled for slices 09 and 10, all terminal, no blanks — `cells_filled: 147`
- [x] Items 7 and 15 discharged in one reconciled list, every entry with a terminal verdict
- [x] Slice 09 is exactly **1** commit — criterion 4.2, evidence `2865b05b3`
- [x] Slice 10's pre-fix count matched the manifest's prediction exactly (37 = 37)
- [x] Catch-all = 2,321 = slice 11, with 0 foreign paths; identity **MATCH**
- [x] `#871` base `ship/v0.2-akita-07-frontend-routes`; `#872` base `ship/v0.2-akita-08-i18n-messages`
- [x] No PR for slice 10 (D-07 lag held); 10 remote refs; `origin/main` unmoved; #860 untouched
- [x] No force-push, no `git clean`, no `git stash`, worktree clean throughout
