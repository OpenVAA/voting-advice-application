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

*Not yet written. Plan 151-18 appends it, mirroring the frontmatter keys above with the `run:` key
set to `final` and the real `ship/*` branch tips.*

Note for 151-18: keep the literal `run: <value>` string confined to frontmatter. Plan 151-01's
acceptance criterion greps for exactly one occurrence, and prose that repeats the literal breaks
that count — it did here, and was fixed rather than waived.
