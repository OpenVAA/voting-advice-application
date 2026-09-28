---
phase: 151
phase_name: ship-v0-2-akita-review-stack
record: byte-identity-proof
run: dry-run-tracer
run_date: 2026-08-16
plan: 151-01
base_sha: ac30f132a407084bf30626029a0a71a0a521982f
base_ref: origin/main
target_source_sha: ca10b97368500d461c379c555164b1c5608aa4e1
target_source_ref: feat-gsd-roadmap
merge_target_commit: 989e3ebe266961fff3b7fabfa2c50c6f9fc4c9d3
merge_target_tree: 638cbe1aa30c04e858c3097c133d61aca4b7bef9
stack_tip_commit: b5ea64d81868c6b93bff31825ec89aee6d1124a2
stack_tip_tree: 638cbe1aa30c04e858c3097c133d61aca4b7bef9
changed_files: 0
catchall_files: 0
rename_commit: 6f0c208a6ea2a5e58d3c4ed876d69a98577be509
rename_commit_R: 1316
rename_commit_A: 0
rename_commit_M: 0
slice_count: 12
slice_file_total: 4240
negative_control: pass
toolchain:
  git: 2.50.1 (Apple Git-155)
  python3: 3.9.16
status: mechanism_proven
proves:
  - the stack-construction mechanism reproduces the merge target byte for byte
  - the partition is gap-free and overlap-free (catch-all empty, per-slice counts sum to the total)
  - the identity gate can fail (negative control)
does_not_prove:
  - the FINAL stack (no sweep fix, no hygiene codemod, no real slice boundary decision has been made yet)
  - that the slice boundaries chosen here are the right REVIEW boundaries (D-09/D-10 decide that)
---

# Phase 151 — Byte-Identity Proof

Criterion 7 says the review stack must reconstruct the merge target byte for byte. This record
holds the evidence. It is written in two passes:

- **`dry-run-tracer`** (this section, plan 151-01) — the *mechanism*, executed once end to end
  on throwaway refs before a single sweep fix or real slice exists.
- **`final`** (appended by plan 151-18) — the *real stack*, the one that becomes the PRs.

The frontmatter `run:` key above carries whichever pass the section documents, so a reader — or a
grep — can tell the two apart without reading prose.

Recording the dry run separately is the point of the tracer: byte-identity becomes a structural
property established on day one rather than a claim verified at the end, and the phase fails fast
if the repository moved since the research session.

---

## Section 1 — Dry run (pass `dry-run-tracer`)

### What was NOT touched

Nothing real was mutated. The whole pipeline ran against a standalone `GIT_INDEX_FILE` under the
scratch directory; every commit produced is **detached and unreferenced**, held only in a shell
variable, and reachable from no ref. Verified after the run:

```
$ git rev-parse --abbrev-ref HEAD
feat-gsd-roadmap
$ git rev-parse HEAD
ca10b97368500d461c379c555164b1c5608aa4e1        # unmoved by the pipeline
$ git status --porcelain -- . ':(exclude).planning'
                                                # empty
$ git branch --list 'ship/*'
                                                # empty
$ git ls-remote --heads origin 'ship/*'
                                                # empty
```

No push, no PR, no branch created or moved, no force-push, no reset.

### Step 0 — re-resolve the base (C-12)

The plan forbids hard-coding `ac30f132a`. Re-resolved at execution time:

```
$ git fetch origin
$ git rev-parse origin/main
ac30f132a407084bf30626029a0a71a0a521982f
```

It **matches** the research-time value, so the 2-file / 11-line D-22 delta measured in research
stands and the C-12 re-measurement trigger for plan 151-06 does **not** fire.

### Step 1 — materialise the merge target (D-22)

```
$ git -c merge.renameLimit=20000 merge-tree --write-tree --name-only feat-gsd-roadmap origin/main
638cbe1aa30c04e858c3097c133d61aca4b7bef9
apps/docs/static/images/youthvotes-logo.png

Auto-merging apps/docs/src/routes/+page.svelte
CONFLICT (file location): docs/static/images/youthvotes-logo.png added in origin/main inside a
directory that was renamed in feat-gsd-roadmap, suggesting it should perhaps be moved to
apps/docs/static/images/youthvotes-logo.png.
```

Exit status 1 — but **C-4 holds**: this is `merge-ort`'s directory-rename *notification*, not an
unresolved conflict. `merge-ort` already placed the file where the operator prescribed, and the
written tree proves it:

```
$ git ls-tree -r --name-only 638cbe1aa30c04e858c3097c133d61aca4b7bef9 | grep -i youthvotes
apps/docs/static/images/youthvotes-logo.png
```

There is no `docs/static/images/youthvotes-logo.png` in the tree. **No manual resolution was
performed, and none was needed.**

The delta against the branch tip is exactly the 2 files / 11 lines research measured:

```
$ git -c diff.renameLimit=20000 diff --stat feat-gsd-roadmap 638cbe1aa30c04e858c3097c133d61aca4b7bef9
 apps/docs/src/routes/+page.svelte           |  11 +++++++++++
 apps/docs/static/images/youthvotes-logo.png | Bin 0 -> 29862 bytes
 2 files changed, 11 insertions(+)
```

Committed into a detached, unreferenced commit:

```
$ git commit-tree 638cbe1aa30c04e858c3097c133d61aca4b7bef9 \
    -p feat-gsd-roadmap -p origin/main \
    -m "merge: origin/main into feat-gsd-roadmap (D-22 materialised merge target)"
989e3ebe266961fff3b7fabfa2c50c6f9fc4c9d3
```

### Step 2 — the pure-rename commit (slice 01a, PR #1)

```
$ export GIT_INDEX_FILE=<scratch>/idx
$ scripts/build-rename-commit.sh ac30f132a407084bf30626029a0a71a0a521982f
moved=1316 kept=714 dropped=0                                    # stderr
--- taxonomy of 6f0c208a6ea2a5e58d3c4ed876d69a98577be509 (diff.renameLimit=1) ---
   1316 R
6f0c208a6ea2a5e58d3c4ed876d69a98577be509                          # stdout
```

Independently re-run against the committed commit:

```
$ git -c diff.renameLimit=1 show -M --name-status --format= 6f0c208a6ea2a5e58d3c4ed876d69a98577be509 \
    | cut -c1 | sort | uniq -c
   1316 R
```

**R = 1316, A = 0, M = 0, D = 0.** `A` and `M` are zero because no line of the taxonomy is anything
but `R` — the `uniq -c` output has exactly one row. `D = 0` because `--drop-prefix` was not passed:
per Q4 the Strapi removal is split out of PR #1 into slice 01b, so the rename pass keeps
`backend/**` intact and drops nothing. (Research reported 1316 R **+ 249 D** because its draft
dropped `backend/` inside the same commit; the 249 deletions now live in slice 01b, where the count
reappears below.)

`diff.renameLimit=1` is deliberate. Exact (blob-OID) renames survive it, so a clean single-row `R`
taxonomy at the *most hostile* limit is the strongest available statement that nothing but paths
moved. This is also why the path map is derived **by rule** and never by rename detection
(threat T-151-01-02).

### Step 3 — the slices, and the catch-all tripwire

Each row is one `build-slice.sh` invocation against the same `GIT_INDEX_FILE`, `TARGET` =
`989e3ebe2`, `PARENT` = the previous row's commit.

| # | Slice | files | commit |
|---|-------|------:|--------|
| 01a | layout-move (rename commit) | 1316 R | `6f0c208a6ea2a5e58d3c4ed876d69a98577be509` |
| 01b | strapi-removal | 252 | `52b546e1a890910b0d9fb301fd63220925da5809` |
| 02 | shared-packages | 97 | `966976a306e389360006231064f7a0f3c3cc6767` |
| 03 | supabase | 118 | `ec5c25cc1271752db740a34eec1458646ebcf55a` |
| 04 | dev-seed | 161 | `9a2bd6d6f1ba8c71a33cd8b7970a03d32c8e9cbf` |
| 05 | e2e-tests | 195 | `4e7e3ece8fdfaef4e4d8e4c4ea0f667e24c49e7b` |
| 06 | frontend-lib | 526 | `b590fd847f25d69119bbef93bf384f731effa6f6` |
| 07 | frontend-routes | 206 | `98c32bd568ab3066e39af64fcab65ce6f116ca91` |
| 08 | i18n-messages | 329 | `01d91463727acf8a246556409ccc65626766b82a` |
| 09 | docs | 40 | `f6d7c4ca9cd9d0fd9fd0fe4402fbb4b4a4abb7ef` |
| 10 | root-config | 46 | `55fabc403b0cdbc3199d4c2a706abd4325afe6ee` |
| 11 | planning | 2270 | `b5ea64d81868c6b93bff31825ec89aee6d1124a2` |
| — | **catch-all** | **0** | *(EMPTY — echoes its parent)* |

**Sum of slices 01b…11 = 4240**, and the independently measured total is also 4240:

```
$ git -c diff.renameLimit=20000 diff --name-only -z --no-renames \
    6f0c208a6ea2a5e58d3c4ed876d69a98577be509 989e3ebe266961fff3b7fabfa2c50c6f9fc4c9d3 | tr -d '\0' ... 
TOTAL 4240
```

The sum matching the total is the **overlap** check (no path counted twice); the empty catch-all is
the **gap** check (no path counted zero times). Both hold, so the partition is exact.

Catch-all invocation, verbatim stderr:

```
$ PARENT=b5ea64d81868c6b93bff31825ec89aee6d1124a2 \
  TARGET=989e3ebe266961fff3b7fabfa2c50c6f9fc4c9d3 \
  scripts/build-slice.sh "ship(v0.2) catch-all — MUST BE EMPTY" .
files=0
EMPTY: ship(v0.2) catch-all — MUST BE EMPTY
b5ea64d81868c6b93bff31825ec89aee6d1124a2                          # parent echoed unchanged
```

This is the load-bearing assertion, not a formality. Research measured the failure mode live: two
broken slices, **472 files absorbed by the catch-all, and the tree hash still matched** (Pitfall 5,
threat T-151-01-01). A green identity check with a non-empty catch-all is a laundered result.

The pathspec table used (a *candidate* — D-09/D-10 set the real review boundaries later):

| Slice | pathspecs |
|-------|-----------|
| 01b | `backend` `apps/frontend/tests` |
| 02 | `packages` `:(exclude)packages/dev-seed` `:(exclude)packages/supabase-types` |
| 03 | `apps/supabase` `packages/supabase-types` `supabase` |
| 04 | `packages/dev-seed` |
| 05 | `tests` |
| 06 | `apps/frontend/src/lib` |
| 07 | `apps/frontend/src/routes` `apps/frontend/src/params` |
| 08 | `apps/frontend/messages` |
| 09 | `apps/docs` `docs` `:(glob,top)*.md` |
| 10 | `apps/frontend` + `:(exclude)` of 06/07/08/01b subtrees, `.github` `.husky` `.changeset` `.yarn` `.agents` `.bg-shell` `:(glob,top)*.json` `:(glob,top)*.yml` `:(glob,top)*.yaml` `:(glob,top)*.lock` `:(glob,top).*` |
| 11 | `.planning` `.claude` |

Two notes on this table that the next plan should carry forward:

- `:(exclude)` and `:(glob,top)` are used freely because slices are built on `git diff --raw`, which
  supports full pathspec magic. `git ls-tree` does **not** (Pitfall 4) — that is why the slice
  mechanism is diff-based.
- Slice 09 needs a bare `docs` pathspec in addition to `apps/docs`: the target reintroduces a
  top-level `docs/key-generation.md` (status `A`), which the `docs/ → apps/docs/` rename rule does
  not cover. Without it that one file would have fallen into the catch-all — a concrete instance of
  the tripwire earning its keep.

### Step 4 — the identity gate, matching pair

```
$ scripts/verify-identity.sh 989e3ebe266961fff3b7fabfa2c50c6f9fc4c9d3 b5ea64d81868c6b93bff31825ec89aee6d1124a2
== Check 1: git diff must be empty ==
target : 989e3ebe266961fff3b7fabfa2c50c6f9fc4c9d3  (989e3ebe266961fff3b7fabfa2c50c6f9fc4c9d3)
tip    : b5ea64d81868c6b93bff31825ec89aee6d1124a2  (b5ea64d81868c6b93bff31825ec89aee6d1124a2)
changed files: 0

== Check 2: tree hashes must be equal ==
target tree : 638cbe1aa30c04e858c3097c133d61aca4b7bef9
stack  tree : 638cbe1aa30c04e858c3097c133d61aca4b7bef9

---
Checks failed: 0  (changed files: 0, trees equal: yes)

BYTE-IDENTICAL

$ echo $?
0
```

### Step 5 — negative control (the standing v2.15 acceptance rule)

The rule: prove the guard fails before claiming it guards. This phase's entire criterion-7 claim
rests on one script, so the script is run twice — once on a pair that must fail, once on a pair
that must pass.

**Run A — mismatched pair.** The throwaway stack tip against `feat-gsd-roadmap` *without* the
merge-target commit. Two independent reasons to differ: the 2-file D-22 delta, plus the 3 script
files committed by this plan's Task 1.

```
$ scripts/verify-identity.sh b5ea64d81868c6b93bff31825ec89aee6d1124a2 feat-gsd-roadmap
== Check 1: git diff must be empty ==
target : b5ea64d81868c6b93bff31825ec89aee6d1124a2  (b5ea64d81868c6b93bff31825ec89aee6d1124a2)
tip    : feat-gsd-roadmap  (698ffc98dcdfac3707c0522f641a26a97eb92cc1)
 .../scripts/build-rename-commit.sh                 | 167 +++++++++++++++++++++
 .../scripts/build-slice.sh                         | 115 ++++++++++++++
 .../scripts/verify-identity.sh                     | 101 +++++++++++++
 apps/docs/src/routes/+page.svelte                  |  11 --
 apps/docs/static/images/youthvotes-logo.png        | Bin 29862 -> 0 bytes
 5 files changed, 383 insertions(+), 11 deletions(-)
changed files: 5

== Check 2: tree hashes must be equal ==
target tree : 638cbe1aa30c04e858c3097c133d61aca4b7bef9
stack  tree : 91d61cd637f2b2dead2671d4e00b972bce8a9999

---
Checks failed: 2  (changed files: 5, trees equal: no)

MISMATCH: the stack does not reconstruct the target.
First differing path: .planning/phases/151-ship-v0-2-akita-review-stack/scripts/build-rename-commit.sh
Inspect it with:  git diff b5ea64d81868c6b93bff31825ec89aee6d1124a2 feat-gsd-roadmap -- ".planning/phases/151-ship-v0-2-akita-review-stack/scripts/build-rename-commit.sh"
Then find the slice whose pathspec should own that path. A path that no slice
claims lands in the catch-all; a path two slices claim is applied twice, and the
later application wins -- both show up here as a residual difference.

$ echo $?
1
```

**Run B — matching pair.** Identical to Step 4; exit code re-captured under the same invocation
harness:

```
MATCH_EXIT=0
```

**Both exit codes verbatim: mismatch → `1`, match → `0`.** Both checks moved together and in the
right direction: the mismatched run reported *two* failed checks (non-zero file count **and**
unequal trees), which also confirms the two checks are genuinely independent rather than one
derived from the other.

### What this dry run proves, and what it does not

**Proven:**

- The mechanism reconstructs a merge target byte for byte from `origin/main`, against the
  repository **as it stands today** — not as it stood at research time. The repo *did* move: total
  reconstructed files are **4240** here versus **3969** in research, exactly the C-11 prediction
  that Phases 141–150 advance `feat-gsd-roadmap` before Phase 151 runs.
- The partition is exact in both directions (gap-free and overlap-free).
- The rename commit renders as renames only, at the most hostile rename limit.
- The identity gate can fail, and says something useful when it does.

**Not proven, and not claimed:**

- **The final stack.** No sweep fix (D-04/06/07), no hygiene codemod (D-14/16), and no disposition
  matrix exists yet. Every commit above is throwaway.
- **That these are the right review boundaries.** The pathspec table is the research § Slice
  Anatomy *candidate*, used here because the mechanism needs *some* partition to exercise. D-09/D-10
  choose the real one; slice 10 in particular currently mixes root tooling with the
  `apps/frontend` shell remainder, which is a defensible build boundary but an unexamined *review*
  boundary.
- **Anything about CI, PR wiring, or the Copilot review path.** Untouched by this plan.

### Teardown

The scratch index was deleted and the throwaway commit OIDs dropped. They are reachable from no
ref and no reflog entry and will be pruned by `git gc`. Post-teardown assertions are recorded at
the top of this section.

---

## Section 2 — Final stack (pass `final`)

**Written by plan 151-18.** This is the real stack — the twelve `ship/*` branches that become the
pull requests, not the throwaway objects of Section 1. It mirrors Section 1's frontmatter keys.

Section 1's closing note asked 151-18 to keep the literal key-and-value string confined to
frontmatter, because plan 151-01's acceptance criterion greps for exactly one occurrence. That
criterion is **superseded here by construction**: this section's whole purpose is to carry a second
value of that key, so the count becomes two. The note's *intent* — never repeat the literal in prose
— is honoured: the block below is the only place it appears in this section.

```yaml
phase: 151
phase_name: ship-v0-2-akita-review-stack
record: byte-identity-proof
run: final
run_date: 2026-08-17
plan: 151-18
base_sha: ac30f132a407084bf30626029a0a71a0a521982f
base_ref: origin/main
target_source_sha: 0c24e87dd100776959b9e5079580b0d37aeb3266   # post-fix; ff027416c was the pre-fix measurement
target_source_ref: feat-gsd-roadmap
merge_target_commit: d55587fb1cadde0c37fa75c8e4da7a265e68e6d2
merge_target_tree: c967a8457783764f9c9e9bbd9f5434cfe02f2f88
stack_tip_commit: 7dae80f35c3e45f97f144fce2bd17c43d6ed68cb   # re-cut after the perf fix
stack_tip_tree: c967a8457783764f9c9e9bbd9f5434cfe02f2f88
changed_files: 0
catchall_files: 0
rename_commit: 602b793510cf432365e14a2562cc5e3f917e040e
rename_commit_R: 1316
rename_commit_A: 0
rename_commit_M: 0
slice_count: 12
slice_file_total: 4511
comparable_total: 4511
partition_gap: 0
taxonomy_c1_to_tip: CONFORMING          # exit 0, 11 commits, 0 shared paths
taxonomy_main_to_tip: VIOLATIONS        # exit 1, 12 commits, 628 shared paths — explained below
origin_main_advanced_since_merge: false
backup_worktree_intact: true
hooks_path_intact: true
toolchain:
  git: 2.50.1 (Apple Git-155)
  python3: 3.9.16
  prettier: 3.7.4
status: criteria_4_5_7_proven
suite_green: true      # D-24 run 2: 135 passed, exit 0
recut_after_perf_fix: true
force_pushed_branches: 6   # slices 05-10, on explicit operator authorisation
```

### Step 0 — the target, re-resolved (C-12)

Criterion 7's target is `feat-gsd-roadmap` **merged with `origin/main`**, and plan 151-06 made that
a commit rather than a described construction, so the proof takes a single ref on each side. Nobody
has to reproduce a merge to check it.

```
$ git fetch origin
$ git rev-parse origin/main
ac30f132a407084bf30626029a0a71a0a521982f

$ git rev-parse d55587fb1                       # the D-22 materialised merge (plan 151-06)
d55587fb1cadde0c37fa75c8e4da7a265e68e6d2
$ git rev-parse d55587fb1^2                     # which main it merged
ac30f132a407084bf30626029a0a71a0a521982f

$ git merge-base --is-ancestor origin/main feat-gsd-roadmap ; echo $?
0
$ git rev-list --count feat-gsd-roadmap..origin/main
0
```

**`origin/main` has NOT advanced since the merge commit.** It resolves to the same SHA the merge
took as its second parent, it is an ancestor of the branch, and the branch is zero commits behind.
So the claim this record makes is unqualified: the stack is byte-identical to the branch, and the
branch contains `origin/main` **as of now**, not merely as of the merge.

Had it advanced, this paragraph would have said so and the claim would have been narrowed to "as of
the merge commit" — which is why the re-resolution is a step rather than an assumption.

### Step 1 — slice 11 re-cut, because the record required it

Plan 151-17 set `slice_11_must_be_recut_before_push: true` and it was still true here: 151-17's own
four closing commits landed **after** its cut at `384e7b40a`, so the stack no longer reconstructed
the branch. The branch is unpushed, so the re-cut moves a local ref only — **no force-push**.

```
$ git ls-remote --heads origin ship/v0.2-akita-11-planning | wc -l
0                                               # unpushed, so the ref move is not a force-push

$ git update-ref refs/heads/ship/v0.2-akita-11-planning 1e33b5073 384e7b40a
```

The re-cut is the same `build-slice.sh` invocation as every other slice, reading its pathspec from
`slices.tsv` column 4 rather than a hard-coded copy:

```
files=2328
slice 11 commit: 1e33b5073ebbcd3beba84dffc72eb81a5996e7d0
```

**The catch-all tripwire, which is the load-bearing half:**

```
$ PARENT=1e33b5073 TARGET=ff027416c build-slice.sh "ship(v0.2) catch-all -- MUST BE EMPTY" .
files=0
EMPTY: ship(v0.2) catch-all -- MUST BE EMPTY
1e33b5073ebbcd3beba84dffc72eb81a5996e7d0        # parent echoed unchanged
```

A green identity check with a non-empty catch-all is a laundered result — research measured that
live (472 files absorbed, tree hash still matching). The empty catch-all is not a formality here,
but it also proves nothing on its own about the *split*; see § "What the empty catch-all proves"
in `151-STACK-MANIFEST.md`.

**The +3 attributed file by file**, not asserted. Slice 11 went 2,325 → 2,328 files:

```
$ comm -13 old11.txt new11.txt
  + .planning/phases/151-ship-v0-2-akita-review-stack/151-17-SUMMARY.md
  + .planning/phases/151-ship-v0-2-akita-review-stack/deferred-items.md
  + .planning/phases/151-ship-v0-2-akita-review-stack/pr-bodies/10.md
$ comm -23 old11.txt new11.txt
  (empty — nothing left the set)
```

All three are files 151-17 created after taking its own measurement. Five further files were
*modified* rather than added, which is why the delta is 8 changed paths but only +3 files.

### Step 2 — criterion 7, D-23's two independent checks, verbatim

```
$ bash scripts/verify-identity.sh feat-gsd-roadmap ship/v0.2-akita-11-planning
== Check 1: git diff must be empty ==
target : feat-gsd-roadmap  (ff027416cce9abeabaa5c81af062f94b29a92c46)
tip    : ship/v0.2-akita-11-planning  (1e33b5073ebbcd3beba84dffc72eb81a5996e7d0)
changed files: 0

== Check 2: tree hashes must be equal ==
target tree : d5f77fd48b987667dea26141fd70da5de3290f2b
stack  tree : d5f77fd48b987667dea26141fd70da5de3290f2b

---
Checks failed: 0  (changed files: 0, trees equal: yes)

BYTE-IDENTICAL

$ echo $?
0
```

**Both checks pass, and they are computed by different code paths** — the file count comes from the
diff machinery, the tree hashes from object hashing. Either is reproducible on its own:

```
git diff feat-gsd-roadmap ship/v0.2-akita-11-planning        # must print nothing
git rev-parse feat-gsd-roadmap^{tree} ship/v0.2-akita-11-planning^{tree}   # must print one SHA twice
```

That reproducibility is the entire value of criterion 7: **the stack never has to be merged to be
believed.**

### Step 3 — the partition arithmetic, at the final cut

| slice | files |
|---|---:|
| 01b strapi-removal | 252 |
| 02 shared-packages | 97 |
| 03 supabase | 119 |
| 04 dev-seed | 162 |
| 05 e2e-tests | 195 |
| 06 frontend-lib | 533 |
| 07 frontend-routes | 214 |
| 08 i18n-messages | 330 |
| 09 docs | 152 |
| 10 root-config | 129 |
| 11 planning | **2328** |
| **Σ** | **4511** |

```
$ git -c diff.renameLimit=20000 diff --name-only --no-renames 602b79351 ff027416c | wc -l
4511
```

**Σ per-slice = comparable total = 4511. Gap 0.** Sum-equals-total is the *overlap* check; the empty
catch-all is the *gap* check. Both hold, so the partition is exact.

#### The 151-09 re-baseline, reconciled — the phase's one outstanding bookkeeping item

Plan 151-09 reported `252 + 97 + 3925 = 4274 — gap 0` against a standing baseline of **4257**
without attributing the +17 file by file, the way 151-06 had attributed 4255 → 4257. Every plan
since attributed its own rise by set difference; that one gap stayed open. It is closed here by
measurement rather than by argument:

| checkpoint | comparable total | Δ | attributed by |
|---|---:|---:|---|
| 151-05 dry run | 4255 | — | — |
| 151-06 | 4257 | +2 | set difference (the D-22 merge's two files) |
| 151-09 | 4274 | **+17** | **never attributed — the open item** |
| 151-16 | 4413 | +139 | set difference |
| 151-17 | 4508 | +95 | set difference |
| **151-18 (this cut)** | **4511** | **+3** | set difference, above |

The +17 is recovered the same way every other rise was, by differencing the two file sets across
`151-06`'s cut refs (`C1 = dd88de20c`, `TARGET = d55587fb1`) and `151-09`'s (`C1 = 5636a724b`,
`TARGET = 27193876e`):

```
$ git -c diff.renameLimit=20000 diff --name-only --no-renames dd88de20c d55587fb1 | sort > a.txt
$ git -c diff.renameLimit=20000 diff --name-only --no-renames 5636a724b 27193876e | sort > b.txt
$ wc -l < a.txt ; wc -l < b.txt
4257
4274
$ comm -13 a.txt b.txt | wc -l     # entered the set
17
$ comm -23 a.txt b.txt | wc -l     # left the set
0
```

**All seventeen, named** — every one a `.planning/` artifact written by plans 151-06, 151-07 and
151-08 between the two measurements, and every one inside slice 11's pathspec:

```
151-06-SUMMARY.md   151-07-SUMMARY.md   151-08-SUMMARY.md   151-DISPOSITION.md
151-HYGIENE-REPORT.md   151-hygiene-prose-queue.tsv   151-hygiene-residue.tsv
151-hygiene-summary.json   scripts/hygiene-codemod.mjs
scripts/fixtures/hygiene-codemod.{input,expected}.{sh,sql,svelte,ts}      # 8 fixture files
```

(all paths relative to `.planning/phases/151-ship-v0-2-akita-review-stack/`)

The structural fact that makes the reconciliation sound, and that 151-09 could have stated instead
of leaving a bare arithmetic identity: **every rise in the comparable total is a `.planning/` file
written by a plan of this phase, every one of them rides slice 11 by pathspec, and no file has ever
left the set** (`comm -23` is empty at every checkpoint measured, including this one). The total is
monotonically non-decreasing for a reason, not by coincidence. A rise that *did* include a departure
would be a partition defect; none has.

**The literal is a snapshot; the identity is the assertion.** 4255 → 4257 → 4274 → 4413 → 4508 →
4511 across six measurements, `gap 0` at every one.

### Step 4 — criterion 4, the commit taxonomy, both runs

**Run A — `C1..TIP`, the range the disposition record names as the one that decides criterion 4.**

```
$ bash scripts/verify-commit-taxonomy.sh 602b793510cf432365e14a2562cc5e3f917e040e..ship/v0.2-akita-11-planning

Commit Taxonomy Audit -- criterion 4.1-4.6
==========================================
range   : 602b793510cf432365e14a2562cc5e3f917e040e..ship/v0.2-akita-11-planning
commits : 11

  class         count  expected    ok    clause
  ----------  -------  ----------  ----  ------
  planning          1  == 1        ok    4.1
  docs              1  == 1        ok    4.2
  test              1  == 1        ok    4.3
  feat              6  -           -     -
  chore             2  -           -     -
  style             0  <= 1        ok    4.5

  4.6  [db] marker on db-touching commits         violations: 0
  4.4  PROXY: disjoint modified-path sets         shared paths: 0
       unplaced commits (unrecognised subject)    count: 0

---
Errors: 0  (unplaced: 0, [db] gaps: 0, shared paths: 0)
Note: 4.4 is asserted by its structural proxy (disjoint modified-path sets), not by
      deciding whether one commit fixes another. Read the verdict accordingly.

CONFORMING

$ echo $?
0
```

**4.4 IS A PROXY AND THE OUTPUT SAYS SO ON EVERY RUN.** "The PR contains no fixes of itself" is a
semantic question about intent and is not decidable from commit subjects. What was actually measured
is **disjoint modified-path sets**: no two commits in the range touch the same path. On a
path-partitioned stack that is strictly *stronger* than the criterion; as a general statement about
intent it is strictly *weaker*. This record does not claim the clause was decided — it claims the
proxy held. That distinction is why the script prints the proxy's name unconditionally, and it is
the reason no reader of this file can be misled by a green banner.

**Run B — `origin/main..TIP`. Exit 1, and that is the correct result, not a defect.**

```
$ bash scripts/verify-commit-taxonomy.sh origin/main..ship/v0.2-akita-11-planning
commits : 12
  planning 1 ok 4.1 · docs 1 ok 4.2 · test 1 ok 4.3 · style 0 ok 4.5
  feat 6 · refactor 1 · chore 2
  4.6  [db] marker on db-touching commits         violations: 0
  4.4  PROXY: disjoint modified-path sets         shared paths: 628
       unplaced commits (unrecognised subject)    count: 0
Errors: 1
$ echo $?
1
```

Both runs are recorded because recording only the green one would be the laundering this phase keeps
catching. **The difference between them is exactly one commit: `602b79351`, slice 01a, the
pure-rename layout move** — which run A excludes as the stack's base and run B includes.

Every one of the 628 shared paths is a file 01a **moved** and a later slice **edits**. The proxy
counts a rename as a modification of both the old and new path, so a rename-based stack can never
satisfy it across its own rename base. Two facts pin that down rather than leaving it to inspection:

- **Run A's zero.** If any shared path involved a pair of *later* slices, run A would report it —
  run A differs from run B only by 01a's presence. It reports **0**. Therefore all 628 involve 01a.
- **628/628 are under `apps/`** — the tree 01a moved. The first twenty printed are all
  `apps/docs/**`, paired between `602b79351` (the move) and `2865b05b3` (slice 09, docs).

This is **D-11's design expressed in path terms, not a defect in the split.** The 420 figure that
appeared in earlier drafts was 151-05's dry-run measurement and is superseded; 628 is the gate's own
rename-aware extraction, and 682 is the same quantity under this record's `--no-renames` convention
(rename detection *inside* the later slices hides 56 source paths). Both are recorded so neither
can be mistaken for a discrepancy.

### Step 5 — criterion 5, re-verified at the END of the review, not only at its start

Criterion 5 is that the original reiterative history survives **for the duration of the review**.
Proving it in plan 151-03 and never looking again would leave the criterion asserted rather than
met, so it is re-measured here:

```
$ git worktree list | grep gsd-backup
/Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd-backup  fe91f3099 (detached HEAD)

$ git -C ../voting-advice-application-gsd-backup rev-parse HEAD
fe91f3099e923039837bf88516f8ce14ded4078c

$ git -C ../voting-advice-application-gsd-backup symbolic-ref -q HEAD ; echo $?
1                                               # still DETACHED — nothing can fast-forward it

$ git -C ../voting-advice-application-gsd-backup status --porcelain | wc -l
0                                               # still clean
```

`151-BASELINE.md` records `pre_sweep_tip: fe91f3099e923039837bf88516f8ce14ded4078c`. **The worktree's
HEAD equals it exactly, is still detached, and its working tree is still clean.** No plan in this
phase touched it, and no `git clean`, `git stash`, `reset --hard` or rebase ran anywhere near it.

### Step 6 — the hooks-path override, confirmed rather than assumed

Branch and history operations do not touch git config, but plan 151-03 recorded the override and the
correct thing to do with a recorded value is read it back:

```
$ git config --get core.hooksPath
/dev/null
$ git config --worktree --get core.hooksPath
/dev/null                                       # still worktree-LOCAL, not leaked to the shared config
```

Matches `151-BASELINE.md`'s `hooks_path: /dev/null`, and the scope check confirms it is still the
worktree-local override rather than something that has escaped into the repository-wide config that
the main checkout and every sibling worktree share.

### What this section proves, and what it does not

**Proven, by command, with output recorded verbatim:**

- **Criterion 7** — the twelve-slice stack reconstructs the merge target byte for byte, by two
  independent checks, both reproducible without trusting this file.
- **Criterion 4** — every cardinality clause and the `[db]` implication, over the range the
  disposition record names, with 4.4's proxy named on the run rather than in a footnote.
- **Criterion 5** — the reiterative history is still there, still detached, still at its pin, at the
  *end* of the phase.
- The partition is exact in both directions at the final cut, and the phase's one outstanding
  bookkeeping gap (151-09's unattributed re-baseline) is closed by measurement.

**Not proven, and not claimed:**

- **That the slice boundaries are the right *review* boundaries.** Byte-identity is indifferent to
  how the content was divided; criterion 6's manual read is what answers that, and it is a separate
  gate.
- **That the split is honest.** The empty catch-all is necessary, not sufficient — the real evidence
  is the per-slice prediction checks in plans 151-09 … 151-17, each run while a wrong answer was
  still catchable.
- **That the stack stays identical.** It is identical to `ff027416c`. **Every subsequent `.planning/`
  commit — including this plan's own — makes it stale again by construction**, because every such
  file rides slice 11. That is not a defect; it is why `slice_11_must_be_recut_before_push` exists
  and why the final re-cut happens immediately before PR 12 opens, with this check re-run against
  the tip it is published from.
- **Anything about the suite, the pull requests, or the review itself.** Those are D-24's gate and
  criterion 6's read, recorded elsewhere.


---

## Section 2a — the re-cut after the perf fix, and the identity re-established

**The Section 2 measurement above was taken at `ff027416c` and is superseded by this one.** It is not
deleted: it is the proof that the mechanism held before the fix, and the two together show the
identity surviving a mid-flight content change.

The D-24 gate failed on its first run. The failure was diagnosed to a test defect, the operator chose
**fix-and-recut** over waiving it, and `0c24e87dd` landed on `feat-gsd-roadmap` **before** any slice
was re-cut — D-04's ordering, unchanged.

Slices **05–11** were then rebuilt from the fixed tip; **01a–04 were not touched**, because the only
content change is under `tests/` and they sit below slice 05 in the chain. Verified rather than
assumed:

```
$ git diff --name-only --no-renames 798c952f6 0c24e87dd
tests/tests/specs/perf/performance-budget.spec.ts        # exactly one file
```

### The identity, re-established at the new tip

```
$ bash scripts/verify-identity.sh feat-gsd-roadmap ship/v0.2-akita-11-planning
== Check 1: git diff must be empty ==
target : feat-gsd-roadmap  (0c24e87dd100776959b9e5079580b0d37aeb3266)
tip    : ship/v0.2-akita-11-planning  (7dae80f35c3e45f97f144fce2bd17c43d6ed68cb)
changed files: 0

== Check 2: tree hashes must be equal ==
target tree : c967a8457783764f9c9e9bbd9f5434cfe02f2f88
stack  tree : c967a8457783764f9c9e9bbd9f5434cfe02f2f88

---
Checks failed: 0  (changed files: 0, trees equal: yes)

BYTE-IDENTICAL
```

Catch-all `files=0`; taxonomy over `C1..TIP` **CONFORMING** (exit 0, 0 shared paths); Σ per-slice
**4,511** = comparable total **4,511**, gap **0**.

### What a force-push actually changed for a reviewer — measured, not reassured

Six published branches had their history rewritten. The question that matters to anyone already
reading them is whether the *content* changed, and for five of the six it did not:

| slice | own-patch hash before | after | |
|---|---|---|---|
| 06 | `4be7f4fdf` | `4be7f4fdf` | identical |
| 07 | `cd9f673c6` | `cd9f673c6` | identical |
| 08 | `bcfe8e0ad` | `bcfe8e0ad` | identical |
| 09 | `9c14558cc` | `9c14558cc` | identical |
| 10 | `8f23fc2b1` | `8f23fc2b1` | identical |

Each slice's own patch (`parent..self`) hashes identically before and after; **only the parent
pointer moved.** Slice 05 changed by exactly the fix — same 195 files, 0 entered, 0 left,
`1 file changed, 49 insertions(+)`.

**A first attempt at this check compared cumulative trees and reported "1 changed file" for each of
06–10.** That file was the perf spec, inherited through the chain. The check was wrong, not the
content — recorded because this phase's standing lesson is to establish which of the two is at fault
before believing either.
