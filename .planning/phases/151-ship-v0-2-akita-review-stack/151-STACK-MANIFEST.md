---
phase: 151-ship-v0-2-akita-review-stack
plan: 05
artifact: stack-manifest
slice_count: 12
catchall_files: 0
max_offdiagonal_overlap: 0
base_ref: origin/main
base_sha: ac30f132a407084bf30626029a0a71a0a521982f
target_ref: feat-gsd-roadmap merged with origin/main (D-22, materialised)
target_sha: aa9e899c1ca9167018b06051195e3d9cf563b428
target_tree: e424d633e8e48a93a08b06cbff9369a928148c70
measured_at_branch_tip: faf55161b
segment_overlap_files: 459
partition_total_files: 4255
identity_verified: true
taxonomy_conforming: true
status: operator-approved
operator_approved: true
operator_approved_date: 2026-08-17

# --- plan 151-09: the bottom three slices cut for real (no longer a dry run) ---
slices_cut: ["01a", "01b", "02", "03", "04", "05", "06", "07", "08", "09", "10"]
slices_cut_by: "151-09 (01a, 01b, 02); 151-11 (03; 02 re-cut from the F-18-fixed tip); 151-12 (04); 151-13 (05); 151-14 (06); 151-15 (07, 08; 08 re-cut from its own README-fixed tip); 151-16 (09, 10)"
cut_base_sha: ac30f132a407084bf30626029a0a71a0a521982f
cut_target_sha: 1567c7a23
cut_target_tree: 40f5d20c5
partition_total_files_at_cut: 4504
catchall_remaining_files: 2321
catchall_deviation_pct: 0.0
partial_stack_identity_verified: true
branches_pushed: 10
prs_opened: 10
pushed_by: "151-10 (01a, 01b); 151-11 (02); 151-12 (03); 151-13 (04); 151-14 (05); 151-15 (06, 07); 151-16 (08, 09)"
prs_open: [863, 864, 865, 866, 867, 868, 869, 870, 871, 872]
adapter_block_dispositioned_by: "151-14"
cells_filled: 147  # of 163, after 151-16 filled slices 09 and 10
criterion_4_3_satisfied_by: 545cc26c8790c54b532f3d50fe5bceb02d851177
criterion_4_2_satisfied_by: 2865b05b3846015852ed15bdc3774ce7dce8890a
slices_tsv_amended_by: "151-16, on the operator's F-15 decision (options 1 and 2 accepted, 3 declined)"
ruleset_8477541: untouched-active
pr_860_decision: repurpose-at-151-18

# --- plan 151-17: the last slice cut; the stack is complete and byte-identical ---
slices_cut_all_twelve: true
slice_11_sha: 6f04fa02313b60b7447a7262a0e05a3091a7cb12
slice_11_files: 2324
slice_11_insertions: 879826
slice_11_deletions: 104
cut_target_sha_151_17: 1ab69a32b868e5b8d39e155b369ec0dbf908fa07
cut_target_tree_151_17: 291cc9a563603b0ef45f084f759fe146d521456a
partition_total_files_at_151_17: 4507
final_catchall_files: 0
full_stack_identity_verified: true
criterion_4_1_satisfied_by: 6f04fa02313b60b7447a7262a0e05a3091a7cb12
taxonomy_c1_to_tip: CONFORMING
taxonomy_whole_stack_shared_paths: 628   # rename-aware, the gate's own extraction; 682 under --no-renames
slice_11_must_be_recut_before_push: true # this plan, 151-18 and 151-19 all write .planning/ files
---

# Phase 151 — Stack Manifest

**The canonical record of the v0.2 Akita review stack: twelve slices, proven on throwaway refs to
partition the merge target completely (catch-all `files=0`), with every off-diagonal overlap cell at
`0`, reconstructing the target's tree `e424d633e` byte for byte.**

Machine-readable source: [`slices.tsv`](slices.tsv). **No plan hard-codes a pathspec** — every later
slice-cutting plan reads column 4 of that file.

## Operator approval — 2026-08-17

**The split below is APPROVED as recorded.** The operator read the slice table against criterion 6's
own question ("does the title describe every file in it, without an *and also*?") and re-opened
nothing. Approved explicitly:

- the **459-file segment-overlap resolution** — path-partitioning within the chronological framing,
  zero files shown to a reviewer in two content versions. **D-09 stays closed.**
- the **01a / 01b split of PR #1**, at the cost of one PR of the 8–12 budget.
- both **unrequested boundary moves**: `hooks.server.ts` and the six other `src/` shell files into
  slice 07; the E2E fixture image into slice 04. And `CLAUDE.md` into slice 11 per D-15.
- the **seven render-budget-exceeding slices**, including slice 11 as unreadable-by-design (D-12).

Both flagged findings are **accepted as recorded, not waived**: the `jest.config.json` dropped-*finding*
class stays a standing instruction for 151-06, and criterion 4.4's proxy stays a standing instruction
for 151-17.

**One note raised for the record, explicitly not for re-partitioning.** Slice 10 ("repo plumbing",
37 files) is the row a reviewer is most likely to challenge as *"this is three things"*. It is
approved as-is. The obligation this creates is on the **PR body**, not on the partition:

> **Standing instruction for the plan that writes `pr-bodies/11.md` (slice 10).** The justification
> under "Four partition corrections … § 2" below must reach a reviewer who arrives at that PR cold,
> in the PR body itself — not by reference to a planning artifact they will not open. Name the three
> contested files (`apps/frontend/README.md`, the two dead codemods, `tsconfig.tsbuildinfo`), say why
> each is plumbing, and state the rule that a README is reviewed with the thing it documents (which
> is also why `packages/*/README.md` are in slice 02). **Do not re-partition slice 10.**

## The slice table

Columns `commit` and `PR` are filled in by the plans that cut and open each slice (151-13 … 151-17).
They are present and marked `pending` deliberately, so the record's *shape* does not change under a
later plan — only its cells.

| id | PR | branch | subject | files | +lines | −lines | render flag | commit | PR # |
|---|---|---|---|---|---|---|---|---|---|
| 01a | 1 | `ship/v0.2-akita-01a-layout-move` | `refactor: move the frontend and docs trees into apps/ (renames only, no content change)` | 1316 | 0 | 0 | **files > 300** — 1316 renames, **zero lines** | `602b79351` | [#863](https://github.com/OpenVAA/voting-advice-application/pull/863) |
| 01b | 2 | `ship/v0.2-akita-01b-strapi-removal` | `chore: remove the Strapi backend and the frontend tests that drove it` | 252 | 0 | 55663 | **lines > 20k** — deletions only | `4a7c85934` | [#864](https://github.com/OpenVAA/voting-advice-application/pull/864) |
| 02 | 3 | `ship/v0.2-akita-02-shared-packages` | `feat: rework the shared @openvaa packages for the v0.2 data, matching and filter model` | 97 | 1273 | 289 | ok | `ee270800b` | [#865](https://github.com/OpenVAA/voting-advice-application/pull/865) |
| 03 | 4 | `ship/v0.2-akita-03-supabase` | `feat[db]: replace the Strapi backend with the Supabase schema, RLS, functions and generated types` | 119 | 16422 | 0 | ok | `11f877913` | [#866](https://github.com/OpenVAA/voting-advice-application/pull/866) |
| 04 | 5 | `ship/v0.2-akita-04-dev-seed` | `feat: add the dev-seed package that generates deterministic local and E2E data` | 162 | 19661 | 0 | ok — 19,661 lines, still inside the 20k cap | `7640f7bcb` | [#867](https://github.com/OpenVAA/voting-advice-application/pull/867) |
| 05 | 6 | `ship/v0.2-akita-05-e2e-tests` | `test: add the Playwright end-to-end suite and its runner configuration` | 195 | 23325 | 778 | **lines > 20k** | `545cc26c8` | [#868](https://github.com/OpenVAA/voting-advice-application/pull/868) |
| 06 | 7 | `ship/v0.2-akita-06-frontend-lib` | `feat: rewrite the frontend library layer on Svelte 5 runes and the Supabase adapter` | **533** | **22715** | **8344** | **files > 300 AND lines > 20k** — 533 files (cap 300) and 31,059 changed lines (cap 20,000); the ONLY row over both budgets other than the by-design planning slice | `8c613634b` | [#869](https://github.com/OpenVAA/voting-advice-application/pull/869) |
| 07 | 8 | `ship/v0.2-akita-07-frontend-routes` | `feat: rewrite the frontend app shell and the voter and candidate routing surface` | **214** | **10319** | **8268** | ok — 214 files, 18,587 changed lines, inside both caps (GitHub renders 165 / +7,593 / −5,542 with rename detection on) | `342926b93` | [#870](https://github.com/OpenVAA/voting-advice-application/pull/870) |
| 08 | 9 | `ship/v0.2-akita-08-i18n-messages` | `feat: add the Paraglide message catalogues for every supported locale` | **330** | **8986** | 0 | **files > 300** — 47 messages × 7 locales, one shape, plus the catalogue README | `6a810df8a` | [#871](https://github.com/OpenVAA/voting-advice-application/pull/871) |
| 09 | 10 | `ship/v0.2-akita-09-docs` | `docs: update the project documentation - the docs site, the root README and roadmap, and the key-generation guide` | **152** | **777** | **347** | ok — 152 files, 1,124 changed lines, inside both caps; GitHub renders the same triple (no rename detection: `2 A / 150 M`) | `2865b05b3` | [#872](https://github.com/OpenVAA/voting-advice-application/pull/872) |
| 10 | 11 | `ship/v0.2-akita-10-root-config` | `chore: update the monorepo and frontend-app build, lint, CI and deployment plumbing` | **129** | **8662** | **27267** | **lines > 20k** — `yarn.lock` alone accounts for most of it; the +90 files are the F-15 Option-2 deletions | `3aa503741` | pending (opens at 151-17, per D-07) |
| 11 | 12 | `ship/v0.2-akita-11-planning` | `docs[planning]: add the v0.2 planning record and agent configuration` | **2324** | **879826** | **104** | **files > 300 and lines > 20k** — unreadable by design (D-12) | `6f04fa023` | pending (opens at 151-18, after the identity proof and the D-24 suite gate) |

Pathspecs are **not** duplicated into this table: `slices.tsv` column 4 is the single source, and a
copy here would be a second source able to drift from it. Reproduce any row's pathspec with
`awk -F'\t' '$1=="07"{print $4}' slices.tsv`.

**Line counts are `--no-renames` sums over each slice's own commit**, except slice 01a, whose row
records what a reviewer actually sees: `git show -M --shortstat` reports
`1316 files changed, 0 insertions(+), 0 deletions(-)`, and the taxonomy renders as a single
`1316 R` row even at the maximally hostile `diff.renameLimit=1`. Measured `--no-renames` the same
commit reads 64,860 / 64,860 — that number is the add-plus-delete rendering of a move and is **not**
the review cost. **A render flag on 01a is a file-count flag only; its line budget is zero.**

## The dry run — evidence, not claim

Executed against the repository as it stood at branch tip `faf55161b`, entirely on unreferenced
objects: no branch created, no ref written, no remote touched, no worktree file changed.

| measurement | value |
|---|---|
| catch-all slice, pathspec `.` | **`files=0`**, `EMPTY:` — the literal number, per Pitfall 5 |
| pairwise overlap, largest off-diagonal cell | **0** across all 11 × 11 pathspec slices |
| union of all slices vs comparable total | 4255 vs 4255, **gap: 0** |
| `verify-identity.sh` | exit 0 — changed files **0**, both trees `e424d633e` |
| `verify-commit-taxonomy.sh` over `C1..TIP` | exit 0, **CONFORMING** |
| slice count | **12**, inside D-10's 8–12 band |
| branches created | none — `git branch --list 'ship/*'` empty |
| worktree | `git status --porcelain` empty |

Reproduce (the refs are rebuilt each run; the OIDs above are from this run):

```bash
D=.planning/phases/151-ship-v0-2-akita-review-stack
TREE=$(git -c merge.renameLimit=20000 merge-tree --write-tree --name-only feat-gsd-roadmap origin/main | head -1)
TARGET=$(git commit-tree "$TREE" -p "$(git rev-parse HEAD)" -p "$(git rev-parse origin/main)" -m "merge target")
export GIT_INDEX_FILE=/tmp/gsd-idx TARGET
C1=$(bash $D/scripts/build-rename-commit.sh "$(git rev-parse origin/main)")
# ... one build-slice.sh per row of slices.tsv, then:
PARENT=$TIP bash $D/scripts/build-slice.sh "catch-all - MUST BE EMPTY" .     # must print files=0
bash $D/scripts/verify-identity.sh "$TARGET" "$TIP"
```

The overlap matrix takes a **different file shape** from `slices.tsv` (`<id><TAB><pathspec>…`, and
no `branch`/`subject` columns), so it is driven from a derived definition rather than from
`slices.tsv` directly. Slice `01a` is excluded because it is the stack's *base*, not a pathspec
slice — it is built by `build-rename-commit.sh` and carries the sentinel `RENAME-COMMIT` in column 4:

```bash
awk -F'\t' '$4!="RENAME-COMMIT"{n=split($4,a," "); printf "%s",$1;
            for(i=1;i<=n;i++) printf "\t%s",a[i]; print ""}' $D/slices.tsv > /tmp/overlap-def.tsv
bash $D/scripts/slice-overlap-matrix.sh --union /tmp/overlap-def.tsv "$C1" "$TARGET"
```

## How to consume `slices.tsv` without silently building an empty slice

**This cost two full dry-run rebuilds and is the single most transferable thing this plan learned.**
Both failures produced a *plausible* stack — slices with a single pathspec built correctly, so the
run looked healthy — and both were caught only by the catch-all tripwire reporting `files=3205`.

Two independent traps, one symptom:

1. **The tool shell is `zsh`, not bash.** zsh does not word-split unquoted parameter expansions, so
   `build-slice.sh "$subject" $pathspec` passes the *entire* pathspec field as ONE literal
   pathspec. It matches nothing, `build-slice.sh` correctly reports `files=0` / `EMPTY:` and echoes
   its parent, and the loop marches on. Every multi-pathspec slice (01b, 02, 03, 04, 07, 09, 10, 11)
   built empty; the single-pathspec slices (05, 06, 08) built correctly.
   **Note for the record:** 151-02 established that the *script* shell is bash 3.2.57 — true, because
   the scripts carry a bash shebang. The shell an agent's inline commands run in is a different
   thing, and it is zsh.
2. **In bash, `IFS=$'\t' read` and `IFS= read` both persist into the loop body**, so even under bash
   the same collapse occurs unless IFS is restored before the expansion.

Canonical reader — verified to produce the table above, and the shape every later slice-cutting plan
should copy:

```bash
#!/usr/bin/env bash            # REQUIRED: must not run under zsh
set -euo pipefail
while IFS=$'\t' read -r id branch subject pathspec; do
  [ -n "${id:-}" ] || continue
  [ "$pathspec" = "RENAME-COMMIT" ] && continue        # 01a is built by build-rename-commit.sh
  IFS=' ' read -r -a SPECS <<< "$pathspec"             # explicit split into an array
  PARENT="$(PARENT="$PARENT" bash "$D/scripts/build-slice.sh" "$subject" "${SPECS[@]}")"
done < "$D/slices.tsv"
```

A cheap standing assertion for any consumer: the sum of the per-slice `files=` counts must equal
the comparable total, `git -c diff.renameLimit=20000 diff --name-only --no-renames "$C1" "$TARGET" | wc -l`.
**Do not hard-code the number.** It was 4255 at this dry run, 4257 at plan 151-06 and **4274** at
plan 151-09's real cut; it rises every time a plan writes its own `.planning/` artifact, all of which
ride slice 11. The *identity* is the assertion; the literal is a snapshot. Every rise so far has been
attributed file by file, and no file has ever left the set.

## The bottom three slices, cut for real — plan 151-09

**The dry run above stays as the record of the partition's design. This section records the first
three slices existing as branches.** Every OID below is a live ref, not a throwaway object.

| ref | value |
|---|---|
| base, re-resolved at cut time | `origin/main` = `ac30f132a` — **still unmoved** since research, so C-12's re-measurement trigger did not fire |
| `TARGET`, the fixed tip | `feat-gsd-roadmap` = `3c40ae8ad`, tree `6f8fa499e` — includes the D-22 integration merge, the 151-07/08 hygiene fixes, and this plan's five sweep fixes |
| `origin/main` is an ancestor of `TARGET` | yes (`git merge-base --is-ancestor` → 0), so criterion 7's target is a single ref, per 151-06 |

| slice | branch | commit | files | +lines | −lines |
|---|---|---|---|---|---|
| 01a | `ship/v0.2-akita-01a-layout-move` | `602b79351` | 1316 | **0** | **0** |
| 01b | `ship/v0.2-akita-01b-strapi-removal` | `4a7c85934` | 252 | 0 | 55663 |
| 02 | `ship/v0.2-akita-02-shared-packages` | `4c7d3db5a` | 97 | 1273 | 289 |

**Slice 01a is renames only, asserted at the maximally hostile setting.** At
`diff.renameLimit=1` the taxonomy is a single row — **`1316 R`, `0 A`, `0 M`, and `0 D`** — and
`git show -M --shortstat` reads `1316 files changed, 0 insertions(+), 0 deletions(-)`. Measured
`--no-renames` the same commit reads `2632 files changed, 64860 insertions(+), 64860 deletions(-)`,
reproducing the dry run's numbers exactly; that is the add-plus-delete *rendering* of a move and is
not the review cost.

> **Correction — the plan's own `<verify>` command is wrong, and would have passed only on a broken
> 01a.** `151-09-PLAN.md`'s automated check asserts the sorted status set equals **`"DR"`**. It
> cannot: `git diff --name-status` renders a rename as **one** line, `R100<TAB>old<TAB>new`, so a
> correct pure-rename commit yields **`"R"`**. A `D` in that set would mean 01a *deleted* a file —
> the exact failure the assertion exists to catch. Measured D-line count on 01a: **0**. The plan's
> prose acceptance criterion ("a non-zero R count and zero A and zero M lines") is the correct
> statement and is what was asserted. **Any later plan copying that `<verify>` will fail on a correct
> slice; assert `= "R"`.**

### The per-slice safety check — run here, not deferred to the end

Both checks below are **measurements**. The catch-all was never committed and no ref was created for
it; it was applied into a scratch `GIT_INDEX_FILE` and the resulting tree compared directly.

| check | result |
|---|---|
| remaining-slices catch-all, `TIP02..TARGET` pathspec `.` | **`files=3925`** |
| partition arithmetic | 252 + 97 + 3925 = **4274** = comparable total (`diff --no-renames C1..TARGET`). **Gap: 0.** |
| attribution of the 3925 | per-slice sum for 03…11 measured at this `TARGET`: 118 + 162 + 195 + 526 + 213 + 329 + 39 + 37 + 2306 = **3925**. Every slice matches the dry run's table **file for file** except slice 11, which grew by 19 `.planning/` artifacts. |
| **partial-stack identity** | `read-tree TIP02` + the catch-all applied → tree **`6f8fa499e`** = `TARGET^{tree}` **`6f8fa499e`**. The bottom three slices plus the untouched remainder reproduce the target tree exactly. |
| deviation from the dry run's predicted remainder (3906) | **0.486%**, inside the 1% halt threshold — and fully attributed to slice 11's `.planning/` growth, so the true gap is 0 rather than 19 |
| `git ls-remote --heads origin 'ship/*'` | **empty** — nothing pushed. Plan 151-10 owns the first outward-facing action. |
| `git status --porcelain` | empty — the worktree was never read or written; `HEAD` stayed on `feat-gsd-roadmap` at `3c40ae8ad` |

**Why this check runs per slice rather than once at the end.** A catch-all that absorbs a partition
bug still reproduces the target tree — measured live during research, 472 files absorbed with the
tree hash still matching. Running it after every cut is what localises a bug to the slice that caused
it. Here it localised nothing, because there was nothing to localise: the arithmetic closes at 0.

### One number in the dry-run table moved, and why

Slice 02's `+lines` reads **1273**, not the dry run's 1228. The delta of **45** is this plan's own
three slice-02 sweep fixes, landed on `feat-gsd-roadmap` before the slice was cut exactly as D-04
requires: the documented `any` rationale and the `DeepPartial` TSDoc (`63c1a180e`), the
encrypted-PEM guard (`36dde5287`), and the completed divergence list in `packages/README.md`
(`572b5dd20`). **This is D-04 working, not drift** — the fix is inside the slice's own diff, so the
reviewer of PR #3 sees the corrected code and never a fix-of-itself. `−lines` is unchanged at 289.
The fourth fix (`70c3ad770`, `.prettierignore`) lands in slice **10**, whose file count is unchanged
at 37 because that file was already in its diff.

## The tradeoff put to the operator: 459 files in both segments

**459 code files are touched by both the pre-v2.4 prefix and the post-v2.4 tail** — 51.0% of the
901-file tail (3,598 prefix files, 901 tail files, 459 in both, 3,139 prefix-only, 442 tail-only;
re-measured in `151-MEASUREMENTS.md` § 2.4 with zero drift from research).

D-09 locks the split axis and is **not re-opened**: the 35-commit prefix splits chronologically, the
tail splits by subsystem. What 459 forces is a choice about how the chronological half is *expressed*:

- A **literally chronological** prefix PR would show the reviewer the v1.2 version of 459 files that
  a later tail PR rewrites — precisely what criterion 4.4.1 forbids at the commit level and what the
  root `ROADMAP.md` Addendum tells us to "merge or split away".
- **Adopted: path-partition within the chronological framing.** The chronological axis is carried by
  the *position* of slices 01a and 01b at the bottom of the stack — the monorepo layout move and the
  Strapi removal, the chronologically first structural events, and respectively a pure-rename set and
  a pure-deletion set. Every other file, prefix-only or overlapping, lands in the subsystem slice that
  owns its path, **in its final state**. The reviewer never reads a version a later PR undoes.

The number 459 is a property of the *history*, not of this partition. In the stack as defined, the
count of files a reviewer sees twice **in two different content versions is zero** — proven by the
overlap matrix's all-zero off-diagonal.

## Discretion calls (flagged; no locked decision changed)

**Q4 — PR #1 split into 01a and 01b.** A single PR #1 is 1,565 files: 1,316 pure renames costing 0
lines, plus 249 deletions costing 46,188 lines (55,663 including the frontend Strapi tests). D-11's
stated purpose is that "paths change and contents don't"; tens of thousands of deleted lines are
contents changing. Split, 01a is a perfectly clean zero-line rename list — the entire point of D-11 —
and 01b is a self-evident "delete the dead backend". Costs one PR of the 8–12 budget.

**C-3 — the rename rule covers `docs/` → `apps/docs/` as well as `frontend/` → `apps/frontend/`**
(271 files). Omitting them would render those files as delete/add pairs in a later PR, exactly what
D-11 exists to prevent.

**Frontend sub-split into lib / routes+shell / messages.** `src/lib` at 526 files is the largest
single reviewing surface in the stack; `messages/` is 47 messages × 7 locales of identical shape and
reads as one mechanical thing. Splitting is within criterion 6's own instruction and Pitfall 8's
rendering budget.

## Four partition corrections carried in from wave 0 — each resolved

**1. Slice 09 needs a bare `docs` pathspec (151-01).** Applied: slice 09's pathspec is
`apps/docs docs ROADMAP.md`. The bare `docs` claims the top-level `docs/key-generation.md` the
`docs/ → apps/docs/` rename rule does not cover.

**2. Slice 10 was the weakest boundary (151-01), decided deliberately.** It is now **37 files**, and
the deliberate framing is *repo plumbing*: everything outside `src/` that decides how the monorepo
and the frontend app build, lint, test, containerise, release and deploy — root config and CI
workflows, the yarn releases, and the frontend app's own `package.json` / `tsconfig` / `vite.config`
/ `svelte.config` / `Dockerfile` / lint and style configs. Three of its files are worth naming because
they are what a sceptical reader will challenge:

- `apps/frontend/README.md` — kept here on the standing rule that **a README is reviewed with the
  thing it documents** (which is also why `packages/*/README.md` ride in slice 02, not slice 09).
  What it documents is exactly this slice's subject: how to install, build and run the app.
- `apps/frontend/scripts/{flatten-current,store-to-state}-codemod.mjs` — dead one-shot migration
  tooling (finding **F-03**). Tooling, and dispositioned as tooling.
- `apps/frontend/tsconfig.tsbuildinfo` — a tracked build artifact (finding **F-08**).

Two files that were in the residual bucket were moved *out* of slice 10 rather than defended in it:

- `apps/frontend/static/images/e2e-test-image-1.jpg` → **slice 04**. Its only consumer in the tree is
  `packages/dev-seed/src/templates/e2e/base.ts`; it is the portrait the E2E seed template uploads.
  Reviewed with the seeder, it is part of one thing; reviewed with `turbo.json`, it is an "and also".
- The `apps/frontend/src/` shell → **slice 07**, next.

**3. `apps/frontend/src/hooks.server.ts` was shipping inside a config PR (151-04).** Fixed. All seven
`apps/frontend/src/` files outside `lib/`, `routes/` and `params/` — `app.css`, `app.d.ts`,
`app.html`, `error.html`, `hooks.server.ts`, `hooks.ts`, `tailwind-theme.css` — are **enumerated by
name** in slice 07's pathspec. `hooks.server.ts` is the SvelteKit server hook doing Supabase session
handling and locale resolution: the most auth-relevant file in the frontend, and an OWASP-review
surface under checklist item 2. It now sits in the slice whose reviewing lens is *the request path*,
alongside the routes it wraps, instead of beside `turbo.json` and `yarn.lock`. Slice 07 is 213 files
(200 routes + 6 params + 7 shell).

**4. `apps/frontend/jest.config.json` is invisible to the partition (151-04) — confirmed, and it is a
whole class, not one file.** The blob is identical at both ends
(`81f341fce`, at `origin/main:frontend/jest.config.json` and at `TARGET:apps/frontend/jest.config.json`),
so slice 01a moves it and **no later slice's diff contains it**:
`git diff --no-renames "$C1" "$TARGET" -- apps/frontend/jest.config.json` returns nothing.

> **Standing instruction for the disposition plans (151-06 and the per-slice sweeps).** The catch-all
> tripwire catches a dropped **path**. It cannot catch a dropped **finding**. Any file whose content
> is byte-identical across the move is reviewed by *nobody* if review is organised by slice diff — a
> reviewer of 01a sees a rename list, and a reviewer of every later slice never sees the file at all.
> The disposition surface for such files is **the target tree, not any slice's diff**. Enumerate the
> class with:
> ```bash
> comm -13 <(git diff --name-only --no-renames "$C1" "$TARGET" | sort -u) \
>          <(git show --name-only --format= -M "$C1" | sort -u)
> ```
> `jest.config.json` is the known instance and is a live finding in its own right: the repo tests with
> vitest, and a jest config for a runner nothing uses is exactly what checklist item 5 is for.

## Two decision-mandated placements

- **`CLAUDE.md` rides slice 11, not slice 09.** D-15 makes `CLAUDE.md`, `.agents/` and `.claude/`
  agent-facing planning infrastructure, exempt from hygiene, riding "in the top-of-stack planning PR
  with citations intact". `151-MEASUREMENTS.md` § 2.1 classified it under area A09 ("root `*.md`");
  D-15 overrides the measurement's convenience grouping. Slice 11's pathspec is therefore
  `.planning .claude .agents CLAUDE.md`, and slice 09's root markdown is `ROADMAP.md` alone
  (the Addendum this phase implements). Slice 09 measures 39 files, slice 11 measures 2,287.
- **All non-planning documentation is one slice because criterion 4.2 requires exactly one `docs:`
  commit.** That is why the docs site, `docs/key-generation.md` and the root `ROADMAP.md` are one PR
  rather than three: the grouping is forced by the criterion, not chosen for taste.

## Criterion 4's `4.4` proxy cannot be satisfied across the rename boundary — a note for 151-17

`verify-commit-taxonomy.sh` asserts 4.4 by the structural proxy *disjoint modified-path sets*. Run
over the whole stack (`origin/main..TIP`) it reports **420 shared paths and exits 1**. Run over
`C1..TIP` — the same stack minus its rename base — it reports **0 shared paths and exits 0,
CONFORMING**, with every cardinality clause met (planning 1, docs 1, test 1, style 0, `[db]` gaps 0).

Every shared path is a file **slice 01a moved and a later slice then edits** (measured: 474 shared
paths under the `--no-renames` set comparison, 100% under `apps/`). That is not a partition defect —
it is D-11's design stated in path terms: *paths change in 01a, contents change later*. A rename-based
stack can never satisfy a proxy that treats a rename as a modification.

**Therefore: 151-17 must run the taxonomy gate over `C1..TIP` and record the whole-stack run beside
it with this explanation.** Suppressing the whole-stack run would hide a real number; presenting it
as a violation would misreport a designed property.

## When each PR may open — D-07

Slices are cut and swept **strictly bottom-up**, and **a PR opens only once the slice *above* it has
also been swept**. This is a constraint on *opening*, not on *building*: the whole stack may be built
in one pass (as it was here), but PR *N* stays closed until slice *N+1* is swept, so a cross-slice fix
is still cheap while its owning slice is unopened and criterion 4 ("the PR contains no fixes of
itself") holds without force-pushing a PR already under review. Cost: a one-slice lag in visibility.

## What this record does NOT establish

- **That these are the right review boundaries.** Zero overlap and an empty catch-all are structural
  facts. "Each PR reads as one thing" is a judgement, and it is the operator's — Task 4's checkpoint.
- **That any slice's contents pass the checklist.** No sweep has run. `151-DISPOSITION.md` is the
  artifact that answers that, per-slice, later.
- **That the OIDs above survive.** They are throwaway objects and the branch keeps moving. Every
  later plan re-derives its own refs; nothing in this stack is pinned to a SHA except `base_sha`,
  which is `origin/main` and has not moved since research (`ac30f132a`).
- **That the 2,287-file planning slice is safe to open.** It is approvable without reading (D-12),
  which is exactly why threat T-151-05-03 makes a secret scan over its diff a blocking precondition
  in 151-17.

## The stack goes public — plan 151-10

**The first outward-facing action of the phase.** `origin` is
`OpenVAA/voting-advice-application`, `visibility: PUBLIC`. Two branches pushed, two PRs opened, both
behind an explicit operator decision recorded below.

| slice | branch on `origin` | SHA (remote == local, asserted) | PR | base |
|---|---|---|---|---|
| 01a | `ship/v0.2-akita-01a-layout-move` | `602b79351` | [#863](https://github.com/OpenVAA/voting-advice-application/pull/863) | `main` |
| 01b | `ship/v0.2-akita-01b-strapi-removal` | `4a7c85934` | [#864](https://github.com/OpenVAA/voting-advice-application/pull/864) | `ship/v0.2-akita-01a-layout-move` |

`ship/v0.2-akita-02-shared-packages` was **not** pushed and PR 3 was **not** opened — D-07's
one-slice lag; slice 03 is unswept. Asserted, not assumed:
`gh pr list --head ship/v0.2-akita-02-shared-packages --json number --jq length` -> **0**, and
`git ls-remote --heads origin 'ship/*'` -> exactly **2** refs. `origin/main` unmoved at `ac30f132a`
before and after. PR **#860 was not touched** in any way.

### The operator's decisions, verbatim

- **Task 1 — `accept-reviews`.** Ruleset 8477541 stays **active and untouched**. The automatic Copilot
  review on each PR is accepted. **Do not re-litigate this** and do not alter the ruleset in any later
  plan.
- **Task 2 — `repurpose`, recorded only, executed at 151-18.** PR #860 becomes the stack's umbrella
  entry point: push the post-sweep tip to `origin/feat-gsd-roadmap`, retitle #860, and carry a table of
  the twelve slice PRs in its body. **Nothing was executed against #860 in this plan.**

Two measured corrections decided Task 2, both of which contradict the plan's own option text:

- Updating #860's head is a **fast-forward, not a force-push** — `97f55cb41` is a strict ancestor of the
  local tip (`git merge-base --is-ancestor` -> 0; 1,655 ahead, 0 behind). **Repurposing therefore does
  not fall under the phase's force-push prohibition at all.**
- #860 carries **zero human reviews** — two reviews, both bots (`copilot-pull-request-reviewer`,
  `github-advanced-security`, the latter with an empty body), 5 review comments, 1 `changeset-bot`
  comment. The plan's claim that closing "loses review history" is overstated to the point of being
  misleading.

Also measured, so no later plan re-derives it: ruleset 8477541 has **`review_on_push: false`**, so
Copilot reviews **once per PR at open time** — the stack's total cost is ~12 one-shot reviews, not
continuous re-review. And `.github/workflows/claude.yml` fires on `pull_request_review: [submitted]`,
so each Copilot review triggers its `route` job; the job gates on the review author's repo permission,
the Copilot bot resolves to `none`, and it no-ops. Expect ~12 harmless no-op runs. **Both accepted.**

### CI on PR #863 — measured, and Pitfall 7 is WRONG

**Research's Pitfall 7 must not be copied into any later PR body.** It states that PR #1 fails
`skill-drift-check` on a missing `.claude/scripts/audit-skill-drift.sh`. **That job does not exist in
the workflow these PRs fire.** `main.yaml` at 01a's tip is byte-identical to `origin/main`'s
(blob `c2fdcedb2`) and defines only `frontend-and-shared-module-validation`, `backend-validation` and
`e2e-tests`. `skill-drift-check` exists only in the branch-tip `main.yaml`, which arrives with slice 10.
This is the **fifth** plan-encoded claim in this phase to be wrong as written.

What actually happened, observed on run `32017478048`:

| check | result |
|---|---|
| `frontend-and-shared-module-validation` | **fail** — step 3, `Setup Yarn 4.6` |
| `backend-validation` | **fail** — step 3, `Setup Yarn 4.6` |
| `e2e-tests` | **fail** — step 4, `Setup Yarn 4.6` |
| `Analyze (javascript-typescript)`, `Analyze (actions)`, `CodeQL` | **pass** |
| PR #864 | **no checks at all** — `main.yaml`'s `pull_request` trigger is `branches: [main]` |

> **A sixth wrong-as-written claim, and it was this plan's own.** `pr-bodies/01a.md` first attributed the
> failure to the `Install all dependencies` step. **It is `Setup Yarn 4.6`** —
> `threeal/setup-yarn-action@v2` performs the dependency install itself as part of its caching, so the
> workflow's own, more obviously named install step is `skipped` and never runs. The *mechanism* was
> predicted correctly; the *step* was not. Corrected in both bodies before this record was written.
> **Any later plan describing CI failure must name `Setup Yarn 4.6`.**

The error is the predicted one, verbatim: `YN0085` drops **412** packages — the dependency closure of
the moved-away `frontend` and `docs` workspaces — then
`##[error]The lockfile would have been modified by this install, which is explicitly forbidden. (YN0028)`.
That is the D-11-by-design workspace-glob staleness, confirmed end to end rather than merely argued.

**Reusable for every later PR body:** stack states 01a through 09 — **ten branches** — cannot
`yarn install`, because the root `package.json` still names `frontend`, `docs` and `backend/vaa-strapi`
as workspaces while 01a moved two and 01b deleted the third. The fix lands in slice 10, whose pathspec
owns `package.json` and `yarn.lock` (verified). 151-09 recorded this as "nine slices"; enumerated, the
affected branches are 01a, 01b, 02, 03, 04, 05, 06, 07, 08 and 09 — **ten**.

### What the PR bodies must keep doing

`pr-bodies/01a.md` and `01b.md` are the shape every later body copies: the stack contract stated
self-contained (review-only; PRs need not build or pass; byte-identical final state; the stack need not
be merged; fixes may land on a separate branch), then the slice's position, base, counts, a plain
description, the rendering caveat, and a link to its disposition rows. **Every body must stand alone** —
a cold reviewer must never need to open a planning artifact. Note that links into `151-DISPOSITION.md`
only resolve once `ship/v0.2-akita-11-planning` is pushed (151-17), so both bodies say so and inline the
substance rather than relying on the link.

**GitHub confirmed 01a's central claim independently:** the API reports `files=1316, +0, -0` with
**1,316 `renamed` entries**. The zero-line rename PR renders as promised.

## Slice 03 cut, slice 02 re-cut and published — plan 151-11

**The stack's fourth slice exists and its third PR is open.** Slice 02 was **re-cut** before it was
pushed, from a tip carrying this plan's fix for F-18 — the whole point of D-07's one-slice lag, used
for the first time.

| ref | value |
|---|---|
| base, re-resolved | `origin/main` = `ac30f132a` — **still unmoved**, so C-12's re-measurement trigger has not fired at any point in this phase |
| `TARGET`, the fixed tip at cut time | `b64977c9f` — includes 151-11's six sweep fixes |
| `TIP01B`, unchanged and already pushed | `4a7c85934` — slice 02's parent; **not** re-cut, so PRs #863 and #864 were not disturbed |

| slice | branch | commit | files | +lines | −lines |
|---|---|---|---|---|---|
| 02 (re-cut) | `ship/v0.2-akita-02-shared-packages` | `4c7d3db5a` → **`ee270800b`** | 97 | 1273 | 289 |
| 03 | `ship/v0.2-akita-03-supabase` | **`11f877913`** | **119** | 16422 | 0 |

**Slice 02's counts did not move.** F-18 replaced one line of `packages/app-shared/README.md` with
another, and that line was already inside the slice's diff, so the file count stays 97 and the line
totals stay 1273 / 289 — the same numbers 151-09 recorded. Only the content of one line changed, which
is exactly the D-04 outcome: the reviewer of PR 3 sees the corrected sentence and never a fix of itself.

**Slice 03 is 119 files, not the table's 118.** The extra file is `apps/supabase/README.md`, added by
this plan's F-28 fix. It falls inside slice 03's existing pathspec (`apps/supabase`), so no partition
change was needed — the count rose for a reason attributable to a single named file.

### The per-slice safety check

| check | result |
|---|---|
| chain | `02^ == 01b` and `03^ == 02`, both by `rev-parse` |
| remaining-slices catch-all, `TIP03..TARGET` pathspec `.` | **`files=3812`** at the final tip (3811 at cut time; the +1 is `pr-bodies/02.md`) |
| partition arithmetic | 252 + 97 + 119 + 3812 = **4280** = comparable total (`diff --no-renames C1..TARGET`). **Gap: 0.** |
| attribution of the rise from 151-09's 4274 | **+6, every one named**: `151-09-SUMMARY.md`, `151-10-SUMMARY.md`, `pr-bodies/01a.md`, `pr-bodies/01b.md`, `pr-bodies/02.md` (five `.planning/` files, all riding slice 11) and `apps/supabase/README.md` (slice 03). No file has left the set. |
| predicted remainder | 151-09's catch-all was 3925 including slice 03's then-118. 3925 − 118 + 5 new `.planning/` files = **3812**, the measured value. **Deviation 0.000%**, against a 1% halt threshold. |
| **partial-stack identity** | the four cut slices plus the catch-all produce tree **`27350c243`** = `TARGET^{tree}` **`27350c243`**. **MATCH.** |
| `git status --porcelain` | empty throughout; `HEAD` never left `feat-gsd-roadmap` |

> **A trap worth recording, because it produced a false MISMATCH before the canonical path produced a
> MATCH.** The catch-all was first applied with a hand-rolled reimplementation of `build-slice.sh`'s
> `diff --raw -z` → `update-index` pipeline, capturing the NUL-separated stream through a shell
> command substitution. **Command substitution strips NUL bytes**, so the index-info stream was
> silently mangled and `write-tree` produced a tree that did not match — while the *file count* came
> out correct, because the count was taken before the corruption. The arithmetic said gap 0 and the
> identity said MISMATCH, and the arithmetic was the one telling the truth. Re-run through
> `build-slice.sh` itself, the identity matches. **Do not reimplement the applier; call the script.**

### Commit taxonomy — slice 03 carries the only `[db]` tag in the stack

`verify-commit-taxonomy.sh "ship/v0.2-akita-01a-layout-move..ship/v0.2-akita-03-supabase"`:

| clause | result |
|---|---|
| **4.6** `[db]` marker on db-touching commits | **violations: 0** — `feat[db]: replace the Strapi backend with the Supabase schema, RLS, functions and generated types` |
| **4.4** proxy, disjoint modified-path sets | **shared paths: 0** |
| unplaced commits (unrecognised subject) | **0** |
| `planning` / `docs` / `test` cardinality | `0 == 1` on each — **expected**: slices 11, 09 and 05 are not cut yet (plans 151-17, 151-16, 151-13) |

The three cardinality failures are the correct reading of a partially-cut stack, not a defect. The gate
must be re-run at 151-17 over the full `C1..TIP` range, per this record's existing note.

### Published

| slice | branch on `origin` | SHA (remote == local, asserted) | PR | base |
|---|---|---|---|---|
| 02 | `ship/v0.2-akita-02-shared-packages` | `ee270800b` | [#865](https://github.com/OpenVAA/voting-advice-application/pull/865) | `ship/v0.2-akita-01b-strapi-removal` |

Asserted after the fact, not assumed: `gh pr view 865 --json baseRefName` returns
`ship/v0.2-akita-01b-strapi-removal` and `headRefOid` equals the local tip;
`gh pr list --head ship/v0.2-akita-03-supabase --json number --jq length` returns **0**, so D-07's
one-slice lag held — **PR 4 stays closed until slice 04 is swept at plan 151-12**;
`git ls-remote --heads origin 'ship/*'` returns exactly **3** refs; `origin/main` is unmoved at
`ac30f132a`; and PR **#860 was not touched**. The push was dry-run immediately beforehand and reported
`[new branch]`, with no force anywhere.

Like #864, PR #865 fires **no checks**: `main.yaml`'s `pull_request` trigger is `branches: [main]` and
this PR's base is a sibling branch.

### Two gates the phase had never measured, found red here

`151-BASELINE.md` records `build`, `test:unit`, `lint:check` and `format:check` — and nothing else. The
Supabase slice's own two gates were outside it, and both were red:

- **the pgTAP suite** — `Files=11, Tests=272, Failed 2/272, Result: FAIL` against a database reset from
  migrations. Fixed (F-27); now `All tests successful, Result: PASS`.
- **`yarn db:lint:sql`** — exit 1 on four `plpgsql_check` warnings, and its second half,
  `scripts/lint-schema.mjs`, had **never run against this project's database at all** (F-19, a
  `54332`/`54322` port transposition). The linter half is fixed; the four warnings are **F-21** and
  need an operator decision, because the only change that greens them is a breaking signature change to
  a granted, type-generated, pgTAP-referenced public RPC.

**Any plan whose `<verify>` names `yarn db:lint:sql` will fail on a correct tree until F-21 is
discharged.** `151-11-PLAN.md` sets it as both Task 1's and Task 2's automated check; it exited 1 before
that plan changed anything. That is the **seventh** plan-encoded claim in this phase to be wrong as
written, and it is the same shape as the other six.


## Slice 04 cut and PR 4 published — plan 151-12

**The stack's fifth slice exists and its fourth PR is open.** No slice was re-cut: the six sweep
fixes this plan landed all fall inside the *uncut* slice 04, slice 09 and slice 11, so PRs #863,
#864 and #865 were never disturbed and no force-push was needed anywhere.

| ref | value |
|---|---|
| base, re-resolved | `origin/main` = `ac30f132a` — **still unmoved**, at every measurement point in this phase |
| `TARGET`, the fixed tip at cut time | `99ce9bb87` — includes this plan's six sweep fixes and its disposition record |
| `PARENT`, unchanged and already pushed | `11f877913` — slice 03; **not** re-cut, so PR #866 shows the same object that was pushed |

| slice | branch | commit | files | +lines | −lines |
|---|---|---|---|---|---|
| 04 | `ship/v0.2-akita-04-dev-seed` | **`7640f7bcb`** | **162** | **19661** | 0 |

**Slice 04's `+lines` reads 19,661, not the dry run's 19,560, and the difference is fully
attributed.** Two components, measured separately rather than netted:

- The pre-fix count at this plan's starting tip was **19,549** — the dry run's 19,560 minus 11 lines,
  the residue of the 151-07/08 hygiene rewrites landing inside this package's comments.
- This plan's four in-slice fixes added **+112** net (131 insertions, 19 deletions), attributed file
  by file: `README.md` +63/−15, `src/index.ts` +38, `src/cli/seed.ts` +11/−4,
  `tests/supabaseAdminClient.test.ts` +9, `tests/cli/teardown.test.ts` +5, `tests/writer.test.ts` +5.

19,549 + 112 = **19,661**. **The file count did not move**: all 162 files were already in the slice,
and every one of this plan's six edits touched a file already inside some slice's diff — five in
slice 04, one in slice 09, one `.planning/` file in slice 11. **No file entered or left any
partition cell.** The slice is now 339 lines under GitHub's 20,000-line render cap rather than 440;
it should not be added to casually.

### The per-slice safety check

| check | result |
|---|---|
| chain | `04^ == 03` by `rev-parse` (`11f877913` both sides) |
| remaining-slices catch-all, `TIP04..TARGET` pathspec `.` | **`files=3651`** |
| partition arithmetic | 252 + 97 + 119 + 162 + 3651 = **4281** = comparable total (`diff --no-renames C1..TARGET`). **Gap: 0.** |
| attribution of the rise from 151-11's 4280 | **+1, named**: `151-11-SUMMARY.md`, a `.planning/` file riding slice 11. Established by set difference, not by subtraction — `comm` over the two comparable file sets shows exactly one file entering and **zero leaving**. |
| predicted remainder | 151-11's catch-all was 3812 including slice 04's 162. 3812 − 162 + 1 = **3651**, the measured value. **Deviation 0.000%**, against a 1% halt threshold. |
| **partial-stack identity** | the five cut slices plus the catch-all produce tree **`c5b0fecde`** = `TARGET^{tree}` **`c5b0fecde`**. **MATCH.** |
| an independent cross-check that fell out for free | `git diff --name-only --no-renames C1 ship/v0.2-akita-03-supabase` = **468** = 252 + 97 + 119, the three lower slices summed. The chain's own arithmetic closes without reference to the catch-all. |
| `git status --porcelain` | empty throughout; `HEAD` never left `feat-gsd-roadmap`; the catch-all was applied into a scratch `GIT_INDEX_FILE` through `build-slice.sh` itself, never reimplemented |

### Commit taxonomy — unchanged, and its three failures are still the right reading

`verify-commit-taxonomy.sh "ship/v0.2-akita-01a-layout-move..ship/v0.2-akita-04-dev-seed"`:

| clause | result |
|---|---|
| **4.6** `[db]` marker on db-touching commits | **violations: 0** |
| **4.4** proxy, disjoint modified-path sets | **shared paths: 0** |
| unplaced commits (unrecognised subject) | **0** |
| `planning` / `docs` / `test` cardinality | `0 == 1` on each — **expected**: slices 11, 09 and 05 are not cut yet |

### Published

| slice | branch on `origin` | SHA (remote == local, asserted) | PR | base |
|---|---|---|---|---|
| 03 | `ship/v0.2-akita-03-supabase` | `11f877913` | [#866](https://github.com/OpenVAA/voting-advice-application/pull/866) | `ship/v0.2-akita-02-shared-packages` |

Asserted after the fact, not assumed: `gh pr view 866 --json baseRefName` returns
`ship/v0.2-akita-02-shared-packages` and `headRefOid` equals the local tip;
`gh pr list --head ship/v0.2-akita-04-dev-seed --json number --jq length` returns **0**, so D-07's
one-slice lag held — **PR 5 stays closed until slice 05 is swept at plan 151-13**;
`git ls-remote --heads origin 'ship/*'` returns exactly **4** refs; `origin/main` is unmoved at
`ac30f132a`; and PR **#860 was not touched**. The push was dry-run immediately beforehand and
reported `[new branch]`, with no force anywhere.

Like #864 and #865, PR #866 fires **no checks** — asserted, not predicted: `gh pr checks 866` returns
*"no checks reported on the 'ship/v0.2-akita-03-supabase' branch"*.

### A correction to how this record has been describing CI — the eighth wrong-as-written claim

**`151-12-PLAN.md` states that the dev-seed integration job "exists in CI but is conditional and will
not fire on a sibling-based PR". Both halves are wrong, and the workflow file says so itself.**

- `main.yaml:130-136` records that `dev-seed-integration` carries **deliberately NO `paths-filter`**,
  and names the incident that made it unconditional: *"a conditional guard is how F5 happened in the
  first place"*. It is the opposite of conditional, on purpose.
- More decisively, **the job does not exist at any of this stack's published heads.** `main.yaml` is
  blob **`c2fdcedb2`** — byte-identical to `origin/main`'s — at 01a, 01b, 02, 03 and 04, and that
  version defines exactly three jobs (`frontend-and-shared-module-validation`, `backend-validation`,
  `e2e-tests`) on `Setup Yarn 4.6`. `skill-drift-check`, `supabase-tests` and `dev-seed-integration`
  exist only in the branch-tip `main.yaml` (blob `4dcd9bdde`, `Setup Yarn 4.13`) and arrive with
  **slice 10**.

**This also sharpens 151-11's framing.** That plan recorded the `supabase-tests` job as "conditional
on a paths filter and fires on none of this stack's PRs" — true, and understated: at PR #866's head
the job **does not exist**, and the backend job that does exist there, `backend-validation`, builds
and validates `@openvaa/strapi` — the workspace slice 01b deletes. There is no CI job anywhere in the
published stack that could exercise the Supabase schema. `pr-bodies/03.md` states this in those terms
rather than repeating the softer claim.

**Reusable for every later PR body, corrected once here:** the only reason no check runs on PRs 2–12
is that `main.yaml`'s `pull_request` trigger is `branches: [main]` and their bases are siblings. Do
**not** attribute it to a paths-filter, and do **not** name a job that arrives with slice 10 as though
it were present. This is the eighth plan-encoded claim in this phase to be wrong as written, and again
the reasoning was sound while the observable signature was not.

### Two findings from this sweep that later plans own

- **F-36's second half is an operator decision, not a deferral of convenience.** `dev-seed` has **no
  locality guard**: both CLIs auto-load the repo-root `.env` and fall back
  `SUPABASE_URL ??= PUBLIC_SUPABASE_URL` — the deployed frontend's variable — and `seed:teardown` runs
  through `SupabaseAdminClient` with no env enforcement at all. The documentation now says so; adding
  a check changes the behaviour of a command that deletes rows, and CI legitimately points these CLIs
  at a non-`localhost` instance.
- **F-39 is the first finding in this phase whose fix would move a baseline number.** dev-seed
  contributes **15 of the repository's 20 `lint:check` warnings**, all one deliberate class. The
  rule's own remedy (`/^_/`) would take the gate to `0 / 5` and invalidate the "unchanged against
  `151-BASELINE.md`" comparison every later plan makes. Recorded rather than applied.


## Slice 05 cut and PR 5 published — plan 151-13

**The stack's sixth slice exists, its fifth PR is open, and criterion 4.3 is satisfied structurally
rather than by squashing.** No slice was re-cut: all 25 of this plan's `tests/` fixes fall inside the
*uncut* slice 05 and its 26th fix falls in slice 09, so PRs #863, #864, #865 and #866 were never
disturbed and no force-push was needed anywhere.

| ref | value |
|---|---|
| base, re-resolved | `origin/main` = `ac30f132a` — **still unmoved**, at every measurement point in this phase |
| `TARGET`, the fixed tip at cut time | `c0c47513f` — includes this plan's six sweep fixes and its disposition record |
| `PARENT`, unchanged and already pushed | `7640f7bcb` — slice 04; **not** re-cut, so PR #867 shows the same object that was pushed |

| slice | branch | commit | files | +lines | −lines |
|---|---|---|---|---|---|
| 05 | `ship/v0.2-akita-05-e2e-tests` | **`545cc26c8`** | **195** | **23325** | **778** |

### Criterion 4.3 — satisfied, with the commit SHA as its evidence

> **4.3 — all tests are one commit.**

`git log --oneline ship/v0.2-akita-04-dev-seed..ship/v0.2-akita-05-e2e-tests | wc -l` → **1**.
The commit is **`545cc26c8`**, subject `test: add the Playwright end-to-end suite and its runner
configuration`, and it contains the whole root `tests/` tree — 195 files, `184 A / 7 D / 4 M`, status
set `ADM`.

**The criterion and the slice coincide exactly rather than approximately.** Slice 05's pathspec in
`slices.tsv` is the single token `tests`, so "one slice" and "one commit" and "all tests" are the same
set by construction, not by a squash that happened to gather them. Nothing was collapsed to satisfy
the clause, and there is no second `test:`-typed commit anywhere in the stack to collapse — the
taxonomy gate's `test` cardinality clause goes from `0 == 1` to `1 == 1` with this cut.

### The line delta, attributed commit by commit — and the dry run was exactly right

The dry-run table predicted **+23,297**. Measured at the tip immediately *before* the hygiene commits
it is **exactly 23,297**, so the prediction needs no correction; the number then moved three times and
each move is measurable:

| tip | `+lines` | delta | cause |
|---|---:|---:|---|
| `0c538024c~1` (pre-hygiene) | **23,297** | — | the dry run's figure, reproduced |
| `0c538024c` (the hygiene codemod) | 23,293 | **−4** | reference deletions collapsing comment lines |
| `5862397ad` (hygiene stage 2) | 23,292 | **−1** | one further residue rewrite |
| `c0c47513f` (this plan) | **23,325** | **+33** | 25 in-slice fixes, `+98 / −65`, attributed per file |

**The file count never moved from 195 and `−lines` never moved from 778.** All 25 `tests/` edits
touched files already inside the slice's diff; the 26th edit is in `apps/docs/**`, slice **09**. **No
file entered or left any partition cell.** At 23,325 + 778 = **24,103 changed lines** the slice is over
GitHub's 20,000-line render cap — known and accepted at approval (D-12 class), stated in the PR body
rather than fixed by re-partitioning.

**Both ends of the file arithmetic close, stated in both directions rather than by subtraction:**
`origin/main` carries **14** files under `tests/` and `14 = 7 D + 4 M + 3 unchanged`; `HEAD` carries
**191** and `191 = 184 A + 4 M + 3 unchanged`. The 3 unchanged files — `tests/.gitignore`,
`tests/.prettierignore`, `tests/tests/utils/testsDir.ts` — are byte-identical at both ends (blobs
`1f83983be`, `df8914f52`, `106d54a85`) and appear in **no** slice's diff. They are this slice's
instance of the dropped-finding class, and the standing instruction was followed: they were swept
**from the target tree**, and `tests/.gitignore` turned out to be load-bearing — its `playwright*/`
rule is what keeps the visual chain's `storageState` (a live candidate session cookie) out of git.
`git ls-files tests/` matches `playwright/`, `.auth` and `blob-report` **0** times.

### The per-slice safety check

| check | result |
|---|---|
| chain | `05^ == 04` by `rev-parse` (`7640f7bcb` both sides) |
| remaining-slices catch-all, `TIP05..TARGET` pathspec `.` | **`files=3458`** |
| partition arithmetic | 252 + 97 + 119 + 162 + 195 + 3458 = **4283** = comparable total (`diff --no-renames C1..TARGET`). **Gap: 0.** |
| attribution of the rise from 151-12's 4280→4281→4283 | **+2, both named**: `151-12-SUMMARY.md` and `pr-bodies/03.md`, both `.planning/` files riding slice 11. Established by **set difference**, not subtraction — `comm` over the two comparable file sets shows exactly two files entering and **zero leaving**. |
| predicted remainder | 151-12's catch-all was 3651 including slice 05's 195. 3651 − 195 + 2 = **3458**, the measured value. **Deviation 0.000%**, against a 1% halt threshold. |
| a second, independent cross-check | slice 11's own pathspec measured at this `TARGET` gives **2314** files; 3458 − 2314 = **1144** = 526 + 213 + 329 + 39 + 37, the dry run's slices 06–10 summed **exactly**. The remainder decomposes without reference to the catch-all. |
| **partial-stack identity** | the six cut slices plus the catch-all produce tree **`8459312c9`** = `TARGET^{tree}` **`8459312c9`**. **MATCH.** |
| `git status --porcelain` | empty throughout; `HEAD` never left `feat-gsd-roadmap`; the catch-all was applied into a scratch `GIT_INDEX_FILE` through `build-slice.sh` itself, never reimplemented |

### Published

| slice | branch on `origin` | SHA (remote == local, asserted) | PR | base |
|---|---|---|---|---|
| 04 | `ship/v0.2-akita-04-dev-seed` | `7640f7bcb` | [#867](https://github.com/OpenVAA/voting-advice-application/pull/867) | `ship/v0.2-akita-03-supabase` |

Asserted after the fact, not assumed: `gh pr view 867` returns `baseRefName`
`ship/v0.2-akita-03-supabase`, `headRefOid` `7640f7bcb` equal to the local tip, and — independently
confirming the body's central numbers — `changedFiles: 162, additions: 19661, deletions: 0`.
`gh pr list --head ship/v0.2-akita-05-e2e-tests --json number --jq length` returns **0**, so D-07's
one-slice lag held — **PR 6 stays closed until slice 06 is swept at plan 151-14**;
`git ls-remote --heads origin 'ship/*'` returns exactly **5** refs; `origin/main` is unmoved at
`ac30f132a`; and PR **#860 was not touched** (`updatedAt` still `2026-05-19T12:08:25Z`). The push was
dry-run immediately beforehand and reported `[new branch]`, with no force anywhere.

Like #864, #865 and #866, PR #867 fires **no checks** — asserted, not predicted: `gh pr checks 867`
returns *"no checks reported on the 'ship/v0.2-akita-04-dev-seed' branch"*.

### The PR-title format has drifted across five PRs — stabilised here, for 151-14 onward

Recorded because it is visible to every reviewer and nobody decided it:

| PR | title |
|---|---|
| #863 | `ship(v0.2) 01/12 — move frontend/ and docs/ under apps/ (renames only, zero lines)` |
| #864 | `ship(v0.2) 02/12 — remove the dead Strapi backend and its orphaned frontend tests` |
| #865 | `3/12 feat: rework the shared @openvaa packages for the v0.2 data, matching and filter model` |
| #866 | `feat[db]: replace the Strapi backend with the Supabase schema, RLS, functions and generated types` — **no position marker at all** |
| #867 | `5/12 feat: add the dev-seed package that generates deterministic local and E2E data` |

**Standing instruction for 151-14 … 151-17: use `N/12 <slices.tsv column 3 verbatim>`**, the shape
#865 and #867 share. It carries the stack position a reviewer needs in a list view and it makes the
title the commit subject, so the title cannot drift from the commit it names. **Do not retitle
#863, #864 or #866** — they are open and under review, the bodies carry the position explicitly, and
editing a live PR's title to satisfy a convention chosen after it opened is churn, not a fix.

### What this plan's sweep did NOT establish, stated because the alternative is a claim

**The 43 E2E specs were not run.** The suite needs a dev server on `:5173` and a seeded local
Supabase, and D-24's full-suite run at plan **151-18** is where that cost is paid once, against the
post-sweep tip. Per `CLAUDE.md` a did-not-run E2E test counts as a failure rather than a pass, so
**this record does not claim a green suite for slice 05** — it claims a statically swept one. The
strongest executable evidence obtained is `npx playwright test --list`, which loads
`playwright.config.ts` with all three of its config-load guards active (orphan-probe,
soft-assertion-budget, teardown-prefix-uniqueness) and reports **143 tests in 94 files**. That has a
real failure mode and it passed; it is not a suite pass.

### Two things later plans need from this sweep

- **F-44 — the hygiene gate reports `plan-number occ = 0 OK` over a tree with 35 plan references in
  `tests/` alone.** Three blind spots, each a property of the pattern: its `plan-number` regex requires
  the literal word *plan* **and** a two-part number, so it misses bare `122-05` (12 occurrences, fixed
  here) and `plan 06` (23 occurrences, left in place); its `phase-ref` regex needs keyword and digits
  on the **same line**, so a wrapped reference is invisible; and `\b[A-Z]{3,}-\d{2}\b` misses
  `EFLOW-10b` on the trailing-character boundary. **Not patched here** — widening a pattern mid-stack
  would move the operator-approved counts, which is the F-39 failure mode. Routed to **151-19**.
  **151-14 / 151-15 / 151-16 must run those three patterns over their own slices; the gate will not.**
- **A trap that nearly moved criterion 3's approved state, and will catch the next plan that edits a
  wrapped comment.** Rewriting a line-broken `(Phase / 138 review WR-01)` into the D-14-authorised
  `see phase 138` form *across the same line break* leaves the continuation line reading
  `* phase 138). …`, which the gate's `(?<!see\s)\bphases?\s+\d+` correctly counts as **bare**:
  `phase-ref bare` went 11 → 12 and the approved state moved. **The authorised collapsed form is only
  authorised when it survives on one line.** The fix was reworked to drop the citation, returning
  `phase-ref` to **660 occ / 235 files / bare 11** — the `occ` column held too, not just the gated
  `bare` column, because an operator approved a report with 660 in it.


## Slice 06 cut and PR 6 published — plan 151-14

**The stack's seventh slice exists, its sixth PR is open, and the Supabase Adapter checklist block —
which applies to this slice and to no other in the stack — is dispositioned.** No slice was re-cut:
this plan's fixes land in the *uncut* slices 06, 07 and 10, so PRs #863 … #867 were never disturbed
and no force-push was needed anywhere.

| ref | value |
|---|---|
| base, re-resolved | `origin/main` = `ac30f132a` — **still unmoved**, at every measurement point in this phase |
| `TARGET`, the fixed tip at cut time | `d8e75d868`, merge tree `06f7ab4f4` — includes this plan's six sweep fixes and its disposition record |
| `PARENT`, unchanged and pushed by this plan | `545cc26c8` — slice 05; **not** re-cut, so PR #868 shows the same object that was pushed |

| slice | branch | commit | files | +lines | −lines |
|---|---|---|---|---|---|
| 06 | `ship/v0.2-akita-06-frontend-lib` | **`8c613634b`** | **533** | **22715** | **8344** |

### Slice 06 is over BOTH render budgets, and the PR body must say so

533 files against GitHub's ~300-file budget, and 22,715 + 8,344 = **31,059 changed lines** against the
20,000-line cap. It is the only slice in the stack over both other than slice 11, which is
unreadable by design (D-12). **Known and accepted at operator approval, and not to be re-partitioned**
— the row's own justification is that `src/lib` is one subsystem and splitting it would produce an
"and also". The obligation this creates is on `pr-bodies/06.md`, written at 151-15: state the
rendering cost plainly, and point the reviewer at the disposition rows as the guided path through a
diff GitHub will not show them in full.

### The file count moved 526 → 533, and all seven are named

Established by **set difference** over the two `diff --name-only --no-renames` sets, not by
subtraction. **Zero files left the set.**

| File | Why it entered |
|---|---|
| `api/adapters/apiRoute/apiRouteAdapter.ts` | dropped-finding class; documenting the mixin's `Array<any>` rest parameter put it in the diff |
| `candidate/components/README.md`, `components/README.md`, `contexts/README.md`, `dynamic-components/README.md` | dropped-finding class; the dead `docs/` local link |
| `server/api/README.md` (`A`) + `server/api/README.md 21-40-30-014.md` (`D`) | the rename of a tracked file whose NAME was editor debris |

> **A measurement artefact worth recording, because it is a new one and it will recur.**
> `awk '{print $2}'` over `git diff --name-status` output **truncates a path containing a space**, so
> the corrupted README's old path silently vanished from the delta and the first attribution read
> **+6 against a measured +7**. The count was right and the attribution was one short — the same
> shape as every other self-consistent-and-wrong artifact this phase has caught. Re-run on
> `--name-only`, both close. `build-slice.sh` already handles this correctly, and its docblock cited
> that exact path as the reason its parser splits on NUL; the docblock is updated here rather than
> left naming a path that no longer exists.

### The per-slice safety check

| check | result |
|---|---|
| chain | `06^ == 05` by `rev-parse` (`545cc26c8` both sides) |
| remaining-slices catch-all, `TIP06..TARGET` pathspec `.` | **`files=2934`** |
| partition arithmetic | 252 + 97 + 119 + 162 + 195 + 533 + 2934 = **4292** = comparable total (`diff --no-renames C1..TARGET`). **Gap: 0.** |
| attribution of the rise from 151-13's 4283 | **+9, every one named**: the seven above (slice 06), plus `151-13-SUMMARY.md` and `pr-bodies/04.md` — two `.planning/` files 151-13 committed *after* its own measurement, riding slice 11. Established by set difference; **zero files left**. |
| predicted remainder | 151-13's catch-all was 3458 including slice 06's then-526. 3458 − 526 + 2 = **2934**, the measured value. **Deviation 0.000%**, against a 1% halt threshold. |
| a second, independent decomposition | per-slice pathspecs measured at this `TARGET`: 213 + 329 + 39 + 37 + 2316 = **2934**. The remainder closes **without reference to the catch-all**, and slices 07–10 are unchanged **file for file** from the dry-run table (213/329/39/37); slice 11's rise to 2316 is exactly the two `.planning/` files named above. |
| **partial-stack identity** | the seven cut slices plus the catch-all produce tree **`06f7ab4f4`** = `TARGET^{tree}` **`06f7ab4f4`**. **MATCH.** |
| `git status --porcelain` | empty throughout; `HEAD` never left `feat-gsd-roadmap`; the catch-all was applied into a scratch `GIT_INDEX_FILE` through `build-slice.sh` itself, never reimplemented |

### Published

| slice | branch on `origin` | SHA (remote == local, asserted) | PR | base |
|---|---|---|---|---|
| 05 | `ship/v0.2-akita-05-e2e-tests` | `545cc26c8` | [#868](https://github.com/OpenVAA/voting-advice-application/pull/868) | `ship/v0.2-akita-04-dev-seed` |

Asserted after the fact, not assumed: `gh pr view 868` returns `baseRefName`
`ship/v0.2-akita-04-dev-seed`, `headRefOid` `545cc26c8` equal to the local tip, and — independently
confirming the body's central numbers — `changedFiles: 195, additions: 23325, deletions: 778`.
`gh pr list --head ship/v0.2-akita-06-frontend-lib --json number --jq length` returns **0**, so D-07's
one-slice lag held — **PR 7 stays closed until slice 07 is swept at plan 151-15**;
`git ls-remote --heads origin 'ship/*'` returns exactly **6** refs; `origin/main` is unmoved at
`ac30f132a`; and PR **#860 was not touched** (`updatedAt` still `2026-05-19T12:08:25Z`). The push was
dry-run immediately beforehand and reported `[new branch]`, with no force anywhere.

Like #864 … #867, PR #868 fires **no checks** — asserted, not predicted: `gh pr checks 868` returns
*"no checks reported on the 'ship/v0.2-akita-05-e2e-tests' branch"*.

**The title follows the format 151-13 stabilised** — `6/12 test: add the Playwright end-to-end suite
and its runner configuration`, `N/12` plus `slices.tsv` column 3 verbatim.

### The CI failure signature was re-verified against the run before it was published again

151-10 published the wrong step name and had to correct two live PR bodies, so this plan checked the
observable signature rather than copying the record. `gh run view 32017478048 --json jobs` reports,
for `frontend-and-shared-module-validation`: step **3 `Setup Yarn 4.6` — failure**, step **5
`Install all dependencies` — skipped**. The log carries `YN0085: … and 407 more` (412 packages) and
`##[error]The lockfile would have been modified by this install, which is explicitly forbidden.
(YN0028)` on all three jobs. `pr-bodies/05.md` states exactly that and no more.

### What 151-15 inherits from this cut

- **PR 6 (slice 06) opens at 151-15**, and its body owes the reviewer an explicit statement that the
  diff exceeds both render budgets, plus the guided path through it.
- **Two reactivity findings sit in slice 07's files and are recorded in `151-DISPOSITION.md` as F-61
  and F-62.** F-61 is a genuine defect —
  `results/[[electionTab]]/+layout.svelte:73-77` destructures `appSettings` and `dataRoot` while its
  own comment asserts that doing so is correct, which stopped being true at the v2.13 handle flatten.
  F-62 is the *shape* of the forbidden pattern without its failure mode, at two sites, and is recorded
  with that analysis so neither is mistaken for the other.
- **Two of F-57's eight dead-doc-link fixes already landed in slice 07's files** (`src/routes/README.md`,
  `src/routes/candidate/README.md`), so they are inside slice 07's diff and reviewed with it.
- **F-59's fix landed in `apps/frontend/eslint.config.mjs`, which rides slice 10** — cut by 151-16.
- **F-64 routes a 117-file, 272-occurrence stale-permalink class to 151-16** as a slice-09 whole-tree
  decision, generator included.



## Slices 07 and 08 cut, PRs 6 and 7 published — plan 151-15

**Two slices in one pass, the stack's eighth and ninth, and its sixth and seventh PRs open.** Slice 08
was **re-cut** after its own sweep fix landed — the second time in the phase that D-07's one-slice lag
has been spent rather than collected on, after 151-11's slice-02 re-cut. Slice 07 was pushed before
that re-cut and was asserted unaffected by it, so PRs #863 … #870 were never disturbed and **no
force-push was needed anywhere**.

| ref | value |
|---|---|
| base, re-resolved | `origin/main` = `ac30f132a` — **still unmoved**, at every measurement point in this phase |
| `TARGET` at the slice-07 cut | `f7076dbfe`, merge tree `276d89a94` |
| `TARGET` at the slice-08 re-cut | `75c10cb8f`, merge tree `10ef4af4f` — includes this plan's seven sweep fixes |
| `PARENT` for 07, unchanged and pushed by this plan | `8c613634b` — slice 06; **not** re-cut, so PR #869 shows the same object that was pushed |
| `PARENT` for 08, unchanged and already pushed | `342926b93` — slice 07; **not** re-cut, so PR #870 shows the same object that was pushed |

| slice | branch | commit | files | +lines | −lines |
|---|---|---|---|---|---|
| 07 | `ship/v0.2-akita-07-frontend-routes` | **`342926b93`** | **214** | **10319** | **8268** |
| 08 | `ship/v0.2-akita-08-i18n-messages` | **`6a810df8a`** | **330** | **8986** | 0 |

### Slice 07 is the first slice in the stack whose diff IS its whole surface

Every other slice carries a dropped-finding class — files byte-identical across the layout move, which
slice 01a renders as rename lines and no later slice's diff contains. Under slice 07's and slice 08's
paths there is **no such class**, and that is established two independent ways rather than asserted:

| Method | Slice 07 | Slice 08 |
|---|---:|---:|
| files tracked at `HEAD` under the pathspec, minus files present in the diff (`A` ∪ `M`) | **114 − 114 = 0** | **330 − 330 = 0** |
| blob comparison, `HEAD:<path>` vs `origin/main:frontend/<path>`, per file | **0 identical** | **0 identical** |

The two methods answer from opposite directions and agree. **This is the standing instruction's
question finally coming back negative**, and it matters for the disposition: for these two slices the
review surface and the diff are the same set, so nothing under them is reviewed by nobody.

### The published numbers did not match the measured ones — rename detection, reproduced before correcting anything

**GitHub reported `528 files, +22,550, −8,179` for PR #869 against a measured 533 / +22,715 / −8,344,
and `165 files, +7,593, −5,542` for PR #870 against 214 / +10,319 / −8,268.** Both bodies had already
been written with the measured numbers, so the discrepancy surfaced by comparing the published result
against the measurement rather than by trusting either one.

Cause, reproduced locally to the digit before either body was edited: **rename detection.**
`git show -M --shortstat` on the two slice commits returns exactly `528 / 22550 / 8179` and
`165 / 7593 / 5542`, with rename-aware status sets `207 A / 55 D / 261 M / 5 R` and
`60 A / 50 D / 6 M / 49 R`. This record's slice table is `--no-renames` by its own stated convention;
GitHub's Files-changed tab is not.

For slice 07 the gap is large and **favourable to the reviewer**: 49 of the 97 `[[lang=locale]]` route
files are matched to their de-localised counterparts, so GitHub shows 49 readable rename diffs where
`--no-renames` shows 98 delete-plus-add halves.

> **Standing instruction for 151-16 and 151-17.** Every PR body from here on must state **both**
> numbers and reconcile them, because a reviewer reads the header line and then the Files-changed tab
> and will otherwise conclude one of them is wrong. Slice 09 (39 files) and slice 10 (37) are unlikely
> to show much rename detection; **slice 11 will**, and slice 01a already demonstrates the extreme case
> in the opposite direction. Neither number is wrong; only an unreconciled pair is.

### The per-slice safety check

| check | result |
|---|---|
| chain | `07^ == 06` (`8c613634b` both sides) and `08^ == 07` (`342926b93` both sides), by `rev-parse` |
| commit count per slice | **1** and **1** |
| status sets | slice 07 **`ADM`** (`109 A / 99 D / 6 M`); slice 08 **`A`** (`330 A`) |
| remaining-slices catch-all, `TIP08..TARGET` pathspec `.` | **`files=2394`** |
| partition arithmetic | 252 + 97 + 119 + 162 + 195 + 533 + 214 + 330 + 2394 = **4296** = comparable total (`diff --no-renames C1..TARGET`). **Gap: 0.** |
| attribution of the rise from 151-14's 4292 | **+4, every one named, zero leaving.** By set difference: `151-14-SUMMARY.md` and `pr-bodies/05.md` — two `.planning/` files 151-14 committed *after* its own measurement, riding slice 11 (2316 → 2318) — plus this plan's `apps/frontend/src/routes/loginRedirectTarget.ts` (slice 07) and `apps/frontend/messages/README.md` (slice 08). |
| predicted remainder | 151-14's catch-all was 2934 including slice 07's then-213 and slice 08's 329. 2934 − 213 − 329 + 2 = **2394**, the measured value. **Deviation 0.000%** against a 1% halt threshold. |
| a second, independent decomposition | per-slice pathspecs measured at this `TARGET`: 39 + 37 + 2318 = **2394**. The remainder closes **without reference to the catch-all**, and slices 09 and 10 are unchanged **file for file** from the dry-run table (39 / 37). |
| **partial-stack identity** | the nine cut slices plus the catch-all produce tree **`10ef4af4f`** = `TARGET^{tree}` **`10ef4af4f`**. **MATCH.** Measured twice — `276d89a94` before this plan's last two commits and `10ef4af4f` after — matching the target both times. |
| `git status --porcelain` | empty throughout; `HEAD` never left `feat-gsd-roadmap`; the catch-all was applied into a scratch `GIT_INDEX_FILE` through `build-slice.sh` itself, never reimplemented, and never committed to a ref |

**The dry run's predictions for both slices are now fully attributed, in both directions.** Slice 07
was predicted 213 / +10,291 / −8,267; it measured 213 / +10,290 / −8,267 at 151-13's tip, 213 /
+10,291 / −8,268 at 151-14's (the +1/+1 is 151-14's F-57 dead-link repair in `src/routes/README.md`, a
file already inside the slice's diff), and 214 / +10,319 / −8,268 here. Slice 08 was predicted 329 /
+8,904 / 0 and measured exactly that until this plan's README added one file and 82 lines. **No file
has ever entered or left either slice's partition cell** other than the two this plan added.

### Slice 08's re-cut, and the assertion that made it safe

Slice 08 was cut, then this plan's item-6 fix added `apps/frontend/messages/README.md`, so it was
re-cut on the unchanged slice-07 commit. **The assertion that slice 07 needed no re-cut was made
before the rebuild, not assumed:** `diff --no-renames` between the pushed slice-07 tip `342926b93` and
the new target, restricted to slice 07's nine-token pathspec, returns **0 files**. PRs #869 and #870
therefore still show the objects that were pushed.

### Published

| slice | branch on `origin` | SHA (remote == local, asserted) | PR | base |
|---|---|---|---|---|
| 06 | `ship/v0.2-akita-06-frontend-lib` | `8c613634b` | [#869](https://github.com/OpenVAA/voting-advice-application/pull/869) | `ship/v0.2-akita-05-e2e-tests` |
| 07 | `ship/v0.2-akita-07-frontend-routes` | `342926b93` | [#870](https://github.com/OpenVAA/voting-advice-application/pull/870) | `ship/v0.2-akita-06-frontend-lib` |

Asserted after the fact, not assumed: `gh pr view` returns the expected `baseRefName` for each,
`headRefOid` equal to the local tip, and `OPEN`.
`gh pr list --head ship/v0.2-akita-08-i18n-messages --json number --jq length` returns **0** and
`git ls-remote --heads origin 'ship/v0.2-akita-08*'` returns **0**, so D-07's one-slice lag held —
**PR 9 stays closed until slice 09 is swept at plan 151-16.**
`git ls-remote --heads origin 'ship/*'` returns exactly **8** refs; `origin/main` is unmoved at
`ac30f132a`; and PR **#860 was not touched** (`updatedAt` still `2026-05-19T12:08:25Z`). Both pushes
were dry-run immediately beforehand and each reported `[new branch]`, with **no force anywhere**, no
`git clean`, no `git stash`.

Like #864 … #868, both new PRs fire **no checks** — asserted, not predicted: `gh pr checks` returns
*"no checks reported"* on each. **The titles follow the format 151-13 stabilised** — `7/12 feat: …`
and `8/12 feat: …`, `N/12` plus `slices.tsv` column 3 verbatim.

### The CI failure signature was re-verified against the run before it was published again

`gh run view 32017478048 --json jobs` reports, for `frontend-and-shared-module-validation`: step
**3 `Setup Yarn 4.6` — failure**, step 4 `Setup Node.js 20.18.1` — skipped, step **5 `Install all
dependencies` — skipped**. `backend-validation` the same; `e2e-tests` fails at step 4 `Setup Yarn 4.6`
after a passing `Configure environment`. `main.yaml` at 01a's tip is blob **`c2fdcedb2`**,
byte-identical to `origin/main`'s, and defines exactly `frontend-and-shared-module-validation`,
`backend-validation` and `e2e-tests` — so `skill-drift-check`, `supabase-tests` and
`dev-seed-integration` do **not** exist at any published head, and research's Pitfall 7 stays refuted.
Both bodies state exactly that and no more.

### What 151-16 inherits from this cut

- **PR 8 (slice 08) opens at 151-16**, once slice 09 is swept. Slice 08's branch exists locally at
  `6a810df8a` and is **not** pushed.
- **F-64 is still slice 09's** — 272 `blob/main/frontend/…` permalinks across 117 `apps/docs/` files,
  generator included. Two specifics this sweep adds to it: the routing guide's generated page describes
  neither the `admin/` app nor the `api/` tree (the same gap this plan fixed in the in-slice README),
  and the routing prose predates the locale-segment removal that is slice 07's defining change.
- **F-59's eslint-config fix rides slice 10's diff**, as 151-14 recorded.
- **A named instance for F-15, and it is load-bearing.** `apps/frontend/tools/` (3 files) is claimed by
  **no** slice's pathspec — asserted by running all eleven rows of `slices.tsv` against it, every one
  returning 0 — **and** is byte-identical across the layout move, so it is in no slice's diff either.
  One of those three files, `tools/translationKey/generateTranslationKeyType.ts`, generates the
  compile-time key union that is slice 08's only automated gate, and it reads its key list from the
  *legacy* catalogue in slice 06 rather than from `messages/`. The two agree exactly today (**598 =
  598**, symmetric difference 0 both directions) and nothing enforces that. **F-15's structural
  question remains the operator's at 151-16**; this is recorded so that decision has a concrete example
  in front of it rather than a count of 120.
- **A fourth F-44 blind spot, confirmed live** and routed to **151-19**: a phase reference broken
  across a line (`apps/frontend/src/params/etSg.ts:3-4` ends a line with `introduced by Phase` and
  continues `88 to make…`) is invisible to `phase-ref`, which needs keyword and digits on one line. It
  is left in place deliberately: it is grammatical as it stands, and **neither repair is count-neutral**
  — collapsing it adds a `phase-ref occ` if `see`-prefixed and a `bare` if not.
- **A drift this plan caught in its own work, worth copying as a habit.** Two comments it wrote added
  three `see phase N`, one `see spike N` and one `v2.13`, moving the hygiene report's **ungated** columns
  660/40/43 → 663/41/44 while the gated `bare` columns held at 11/0. `--assert-clean` would have gone on
  reporting exactly the two approved rows and the drift would have shipped unnoticed. **Check `occ`, not
  only `bare`, after every edit that writes a comment.** Corrected in `33e616758`; final state
  byte-identical to the pre-plan baseline.



## Slices 09 and 10 cut, PRs 8 and 9 published, and `slices.tsv` amended — plan 151-16

**The last two code slices exist, the stack is ten PRs deep, and the partition was amended for the
first time in the phase — on an operator decision, not an agent's.** No slice was re-cut: slice 08
was asserted unaffected before slice 09 was built, so PRs #863 … #870 were never disturbed and **no
force-push was needed anywhere**.

| ref | value |
|---|---|
| base, re-resolved | `origin/main` = `ac30f132a` — **still unmoved**, at every measurement point in this phase |
| `TARGET`, the fixed tip at cut time | `1567c7a23`, tree `40f5d20c5` — includes this plan's eleven fixes and the two F-15 fixes |
| `PARENT` for 09, unchanged and pushed by this plan | `6a810df8a` — slice 08; **not** re-cut |

| slice | branch | commit | files | +lines | −lines |
|---|---|---|---|---|---|
| 09 | `ship/v0.2-akita-09-docs` | **`2865b05b3`** | **152** | **777** | **347** |
| 10 | `ship/v0.2-akita-10-root-config` | **`3aa503741`** | **129** | **8662** | **27267** |

### Criterion 4.2 — satisfied, with the commit SHA as its evidence

> **4.2 — all documentation outside the planning tree is one commit.**

`git log --oneline ship/v0.2-akita-08-i18n-messages..ship/v0.2-akita-09-docs | wc -l` → **1**. The
commit is **`2865b05b3`**, subject `docs: update the project documentation - the docs site, the root
README and roadmap, and the key-generation guide`, 152 files, `2 A / 150 M`.

**The criterion and the slice coincide by construction, as they did for 4.3 at slice 05.** Slice 09's
pathspec *is* the non-planning documentation, so "one slice", "one commit" and "all documentation"
are the same set; nothing was collapsed to satisfy the clause. The taxonomy gate's `docs` cardinality
clause goes from `0 == 1` to `1 == 1` with this cut, leaving only `planning` outstanding until 151-17.

### `slices.tsv` was amended — the first partition change since operator approval

**F-15's remedy was put to the operator at this plan's checkpoint and accepted.** Options 1 and 2
accepted, Option 3 (claim all 120 unclaimed files) declined. The edits, and nothing else:

| row | column | before | after |
|---|---|---|---|
| `09` | pathspec | `apps/docs docs ROADMAP.md` | `apps/docs docs ROADMAP.md README.md` |
| `09` | subject | `…the docs site, the root roadmap and the key-generation guide` | `…the docs site, the root README and roadmap, and the key-generation guide` |
| `10` | pathspec | 29 tokens | + `apps/frontend/android apps/frontend/ios apps/frontend/jest.config.json` |

The subject amendment is load-bearing rather than cosmetic: criterion 6's own test is *"does the title
describe every file in it, without an 'and also'?"*, and a slice claiming `README.md` while its
subject named only the docs site and the roadmap would fail it on the file just added.

Two fixes became possible only because of it, and **both were structurally unfixable before**:
`README.md:12`'s broken front-page image (`aad244085`) and the 89 orphaned Capacitor files plus the
dead jest config (`6c40fb57b`). **The residual risk on the second is external and was accepted
knowingly**: every in-repo signal says the scaffold is dead (`@capacitor/*` in no `package.json`, 0
`yarn.lock` entries, referenced only by itself), and no in-repo measurement can see an app-store
pipeline outside this repository. `pr-bodies/09.md` states it in those terms so a reviewer who knows
of one can object from the body alone.

> **Standing instruction for the plan that writes slice 10's body (151-17).** It now owes the cold
> reviewer **two** justifications, not one: the operator's original obligation on the three contested
> files (`apps/frontend/README.md`, the two dead codemods, `tsconfig.tsbuildinfo`), **and** the
> Capacitor removal's external-pipeline risk in the same terms `pr-bodies/09.md` uses. Slice 10 is
> still **not to be re-partitioned** beyond the amendment recorded above.

### The per-slice safety check

| check | result |
|---|---|
| chain | `09^ == 08` (`6a810df8a` both sides) and `10^ == 09` (`2865b05b3` both sides), by `rev-parse` |
| commit count per slice | **1** and **1** |
| status sets | slice 09 **`AM`** (`2 A / 150 M`); slice 10 **`ADM`** (`9 A / 94 D / 26 M`) |
| remaining-slices catch-all, `TIP10..TARGET` pathspec `.` | **`files=2321`** |
| partition arithmetic | 252 + 97 + 119 + 162 + 195 + 533 + 214 + 330 + 152 + 129 + 2321 = **4504** = comparable total. **Gap: 0.** |
| **the catch-all is exactly slice 11, asserted rather than inferred** | 2321 equals slice 11's own pathspec measured at this `TARGET`, **and** the catch-all's file list contains **0** paths outside `.planning/`, `.claude/`, `.agents/`, `CLAUDE.md`. The last real chance to catch a partition gap — the final catch-all is empty by construction — closes at **0.000%**. |
| attribution of the rise from 151-15's 4296 | **+208, every one named, zero leaving**, by set difference over the two comparable file sets: +3 `.planning/` files riding slice 11 (`151-15-SUMMARY.md`, `pr-bodies/06.md`, `pr-bodies/07.md`), +112 into slice 09 and +2 into slice 10 from this plan's documentation fixes, then +91 from the two F-15 fixes (55 `android/` + 34 `ios/` + `jest.config.json` into slice 10, `README.md` into slice 09). |
| **partial-stack identity** | the eleven cut slices plus the catch-all produce tree **`40f5d20c5`** = `TARGET^{tree}` **`40f5d20c5`**. **MATCH.** |
| F-15 Option 2 post-condition | `git ls-files apps/frontend/android apps/frontend/ios apps/frontend/jest.config.json` → **0**; `capacitor` (word, case-insensitive) over the tree excluding `yarn.lock` and `.yarn/` → **0** |
| `git status --porcelain` | empty throughout; `HEAD` never left `feat-gsd-roadmap`; the catch-all was applied into a scratch `GIT_INDEX_FILE` through `build-slice.sh` itself, never reimplemented, and never committed to a ref |

### Published

| slice | branch on `origin` | SHA (remote == local, asserted) | PR | base |
|---|---|---|---|---|
| 08 | `ship/v0.2-akita-08-i18n-messages` | `6a810df8a` | [#871](https://github.com/OpenVAA/voting-advice-application/pull/871) | `ship/v0.2-akita-07-frontend-routes` |
| 09 | `ship/v0.2-akita-09-docs` | `2865b05b3` | [#872](https://github.com/OpenVAA/voting-advice-application/pull/872) | `ship/v0.2-akita-08-i18n-messages` |

Asserted after the fact, not assumed: `gh pr view` returns the expected `baseRefName` for each,
`headRefOid` equal to the local tip, and `OPEN`. **GitHub's own API independently confirms both
bodies' central numbers** — `#871: changedFiles 330, additions 8986, deletions 0` and
`#872: changedFiles 152, additions 777, deletions 347`, matching the measured triples exactly.
`gh pr list --head ship/v0.2-akita-10-root-config` returns **0**, so D-07's one-slice lag held —
**PR 11 stays closed until slice 11 is swept at plan 151-17**; `git ls-remote --heads origin 'ship/*'`
returns exactly **10** refs; `origin/main` is unmoved at `ac30f132a`; and PR **#860 was not touched**
(`updatedAt` still `2026-05-19T12:08:25Z`). Both pushes were dry-run immediately beforehand and each
reported `[new branch]`, with **no force anywhere**, no `git clean`, no `git stash`.

Like #864 … #870, both new PRs fire **no checks** — asserted, not predicted: `gh pr checks` returns
*"no checks reported"* on each. Titles follow the format 151-13 stabilised: `9/12 feat: …` and
`10/12 docs: …`, `N/12` plus `slices.tsv` column 3 verbatim.

### Rename detection: for the first time in the stack the two numbers coincide — and it was measured

151-15's standing instruction requires every body to carry both the `--no-renames` figure and
GitHub's rename-aware one and reconcile them. **Here they are identical**, and that is a measurement,
not an assumption: `git diff -M --shortstat` returns `330 / +8986 / −0`, `152 / +777 / −347` and
`129 / +8662 / −27267` — the same triples as `--no-renames` — because slice 08 is `330 A`, slice 09
is `2 A / 150 M`, and slice 10's 94 deletions have no additions to pair with. GitHub's API confirmed
both published rows after the fact. **Slice 11 is where the gap will reappear**, and 151-17 should
expect it.

### The CI signature was re-verified at all three heads before either body was published

`main.yaml` is blob **`c2fdcedb2`** — byte-identical to `origin/main`'s — at slice 08's head **and**
at slice 09's, defining exactly three jobs on `Setup Yarn 4.6`. At **slice 10's** head it is blob
**`4dcd9bdde`** with **six** jobs on Yarn 4.13, so `skill-drift-check`, `supabase-tests`,
`dev-seed-integration` and `e2e-visual` **arrive with slice 10** and with no earlier head — research's
Pitfall 7 stays refuted for every published head. The root `package.json` at slice 09's head still
declares the five stale workspace globs and `yarn@4.6.0`, read at that exact commit, so the ten-branch
`YN0028` claim still holds for both new PRs. Step names re-read from run `32017478048`: step **3
`Setup Yarn 4.6` — failure**, step **5 `Install all dependencies` — skipped**.

**A plan-encoded claim corrected before it reached a public body — the thirteenth this phase.**
`151-16-PLAN.md` instructs `pr-bodies/08.md` to say that a markdown-only PR fires no workflow because
the CI configuration ignores markdown paths. Slice 08 is **329 `.json` files and one `.md`**, slice 09
has **7** non-markdown files, and `paths-ignore` only ever filters a run the trigger already selected
— the operative reason for both is the **sibling base**. Both bodies say that instead.

### What 151-17 inherits from this cut

- **PR 11 (slice 10) opens at 151-17**, once slice 11 is swept. Slice 10's branch exists locally at
  `3aa503741` and is **not** pushed.
- **`151-DISPOSITION.md` is at `cells_filled: 147` of 163.** The remaining 16 are slice 11's twelve
  general cells and the four phase-level items, which 151-18 owns.
- **F-07** (the NBSP that makes the `any` checklist item untickable) and **F-86** (root `package.json`
  declares `"engine"`, singular, so its Node/yarn floor is inert) are slice 11's and the operator's.
- **F-81** — `.bg-shell/manifest.json`, the literal `[]`, referenced by nothing and not gitignored —
  needs an owner before it can be deleted.
- **F-87 widens F-08: three `tsconfig.tsbuildinfo` files are tracked**, not one —
  `apps/frontend/` (slice 10), `apps/docs/` (slice 09) and `packages/supabase-types/` (slice 02,
  published).
- **The taxonomy gate's `docs` cardinality clause is now satisfied** (`1 == 1`); only `planning`
  remains, and it closes when slice 11 is cut.


---

## Slice 11 cut — the stack is complete, and the final catch-all is empty — plan 151-17

**All twelve slices now exist as branches. The full stack reconstructs the branch tip byte for
byte, and the final catch-all is empty.** Every number below is measured at
`TARGET = 1ab69a32b` (`feat-gsd-roadmap` tip; `origin/main` is an ancestor, so D-22's merge is
materialised and `TARGET` is the tip itself, not a synthesised merge object).

| ref | value |
|---|---|
| slice 11 | `6f04fa02313b60b7447a7262a0e05a3091a7cb12` (`6f04fa023`), branch `ship/v0.2-akita-11-planning` |
| parent | `3aa503741` = `ship/v0.2-akita-10-root-config`, asserted by `rev-parse` on both sides |
| files / lines | **2324 files, +879,826 / −104** (`--no-renames`) |
| status set | **`2322 A / 2 M`** — the two modifications are `.agents/code-review-checklist.md` and `CLAUDE.md`, the only two files in this slice that exist at `origin/main` |
| commits in `10..11` | **1** — criterion 4.1 |
| final catch-all, pathspec `.` from slice 11 | **`files=0`**, `EMPTY:` — the literal, per Pitfall 5 |
| full-stack identity | `verify-identity.sh feat-gsd-roadmap ship/v0.2-akita-11-planning` → **exit 0**, changed files **0**, both trees `291cc9a56`. **BYTE-IDENTICAL.** |
| partition arithmetic | 252 + 97 + 119 + 162 + 195 + 533 + 214 + 330 + 152 + 129 + 2324 = **4507** = comparable total (`diff --no-renames C1..TARGET`). **Gap: 0.** |
| `git status --porcelain` | empty throughout; `HEAD` never left `feat-gsd-roadmap`; the catch-all was applied into a scratch `GIT_INDEX_FILE` through `build-slice.sh` itself and never committed to a ref |

### Criterion 4.1 — satisfied, with the commit SHA as its evidence

`git log --oneline ship/v0.2-akita-10-root-config..ship/v0.2-akita-11-planning | wc -l` returns
**1**. All planning items are one commit: **`6f04fa02313b60b7447a7262a0e05a3091a7cb12`**.

With 4.2 (`2865b05b3`, plan 151-16) and 4.3 (`545cc26c8`, plan 151-13) already closed, **every
cardinality clause of criterion 4 is now satisfied**, and the taxonomy gate says so over `C1..TIP`:
`planning 1 == 1`, `docs 1 == 1`, `test 1 == 1`, `style 0 <= 1`, `[db]` gaps `0`, unplaced `0`.

### What the empty catch-all proves, and what it does not

**It proves nothing about the partition.** The slice above the catch-all — slice 11 — had a
pathspec, but the catch-all itself has none, so the union of the slices reproduces the target
*whether or not the split was correct*. A path no slice claims is simply absorbed by whatever runs
last with an unrestricted pathspec. Research measured this exact laundering live: **two broken
slices, 472 files absorbed, the tree hash still matching** — proof true, stack wrong
(151-RESEARCH.md Pitfall 5).

**The actual evidence for the partition is the per-slice remaining-slices check run in plans
151-09 through 151-16**, each of which compared a measured remainder against a *prediction* made
before the cut and reported the deviation against a 1% halt threshold. Those ran while a wrong
answer was still catchable. This one cannot be wrong.

The one meaningful equality available at this point closed in **plan 151-16, not here**: the
catch-all measured after slice 10 was **2321 files, and its file list contained zero paths outside
`.planning/`, `.claude/`, `.agents/`, `CLAUDE.md`** — slice 11's own pathspec. That is the assertion
that says nothing leaked between the last code slice and the planning slice, and it was checked one
plan earlier precisely because by the time the final catch-all runs there is nothing left to catch.

### The plan's "equals 2321 exactly" criterion is wrong as written — the fourteenth in this phase

`151-17-PLAN.md` requires slice 11's file count to equal 151-16's recorded catch-all count
**exactly**. It measures **2324**, not 2321, and the criterion as written cannot hold: 151-16
committed three of its own artifacts *after* taking that measurement, and every `.planning/` file
any plan writes rides slice 11. This is the trap this manifest already warned against in
§ "How to consume `slices.tsv`" — *"Do not hard-code the number. The identity is the assertion;
the literal is a snapshot."* The plan hard-coded the snapshot.

**The identity does hold, and it was checked instead.** Measured at this same `TARGET`, slice 11's
pathspec claims **2324** files and the unrestricted remainder is **2324** files, with **0** paths
in the remainder outside that pathspec. Slice 11 *is* the remainder, exactly.

**The rise from 2321 → 2324 is attributed by set difference, every file named, zero leaving:**

| file | why |
|---|---|
| `.planning/phases/151-…/151-16-SUMMARY.md` | 151-16's own summary, committed after its measurement |
| `.planning/phases/151-…/pr-bodies/08.md` | 151-16's PR body for slice 08 |
| `.planning/phases/151-…/pr-bodies/09.md` | 151-16's PR body for slice 09 |

The **+883 insertion** delta (878,943 → 879,826) closes to the line over the same interval:
`151-16-SUMMARY.md` +221, `pr-bodies/08.md` +222, `pr-bodies/09.md` +294, plus edits to three files
already inside the slice — `151-STACK-MANIFEST.md` +158/−15, `.planning/STATE.md` +9/−6,
`.planning/ROADMAP.md` +2/−2. `221 + 222 + 294 + 143 + 3 + 0 = 883`. Deletions are unchanged at
**104**.

### Slice 11 MUST be re-cut before it is pushed — this cut is already stale

**This is a structural property of the slice, not a defect in this cut.** Slice 11's pathspec is
`.planning .claude .agents CLAUDE.md`, and *every plan in this phase writes `.planning/` files* —
including this one. The moment this plan commits `151-SECRET-SCAN.md`, `pr-bodies/10.md` and its
own summary, `ship/v0.2-akita-11-planning` no longer reproduces the branch tip.

Consequences, stated so they are not rediscovered:

1. **151-18 must re-cut slice 11 at its own `TARGET` before running `verify-identity.sh`.** The
   identity check that plan owns is against `feat-gsd-roadmap`, and it will fail on this commit.
   The re-cut is free — the branch is **unpushed**, so no force-push is involved. If 151-19 also
   writes `.planning/` files after 151-18's push, that ordering needs an explicit decision; it is
   not resolved here.
2. **The secret scan recorded in `151-SECRET-SCAN.md` covers *this* commit's diff.** Any file added
   to slice 11 after it — by this plan, by 151-18, by 151-19 — is **outside that scan's coverage**
   and must be re-scanned before the push. This is stated in the scan record itself as a named
   coverage limit, not left implicit.

### Criterion 4.4's proxy across the rename base — the standing instruction from 151-05, discharged

151-05 left this as a standing instruction for this plan: run the taxonomy gate over `C1..TIP` and
**record the whole-stack `origin/main..TIP` run beside it with the explanation**, because
suppressing the whole-stack run would hide a real number and presenting it as a violation would
misreport a designed property. Both runs, verbatim results:

| range | commits | verdict | 4.4 proxy: shared paths |
|---|---:|---|---:|
| `ship/v0.2-akita-01a-layout-move..ship/v0.2-akita-11-planning` (`C1..TIP`) | 11 | **CONFORMING**, exit 0 | **0** |
| `origin/main..ship/v0.2-akita-11-planning` (whole stack) | 12 | **exit 1**, `Errors: 1` | **628** |

**Every one of those shared paths pairs the rename commit `602b79351` with exactly one later
slice. Measured, not argued:**

- Directly — for each shared path, `602b79351` is one of the two owning commits: **0 exceptions**.
- Independently, and decisively — the `C1..TIP` run *excludes* 01a and reports **0** shared paths.
  If any two of the eleven later slices shared a path it would appear there. None does. So every
  shared path in the whole-stack run must involve 01a, by construction rather than by inspection.
- **100% are under `apps/`** (628/628 rename-aware; 682/682 under `--no-renames`), which is what a
  tree move looks like in path terms.

This is D-11's design stated in path terms — *paths change in 01a, contents change later* — and a
rename-based stack can never satisfy a proxy that treats a rename as a modification.

**The two shared-path counts differ, and the pair is reconciled rather than left to be distrusted.**
The gate reports **628**; an independent per-commit `--no-renames` set comparison reports **682**.
Cause, measured: the gate's extraction is `git log --name-only` at git's *default* rename settings,
so rename detection **inside the later slices** pairs a deleted source with an added destination and
prints only the destination — hiding 56 source paths that 01a had created. `apps/frontend/src/app.css`
and the four `*Store.type.ts` context files are in that set. This manifest's stated convention is
`--no-renames`, so **682 is the number consistent with every other file count in this record, and
628 is the number the gate prints.** Neither is wrong; only an unreconciled pair would be. (A
re-implementation of the gate's own extraction reproduced 626 of its 628 — the 2-path residue is in
the re-implementation, and the gate's own output is authoritative for its own claim.)

For scale: 151-05 measured 420 (gate) / 474 (`--no-renames`) at the dry run. The rise tracks slices
09 and 10 claiming 112 and 2 more files that 01a had moved.

### Rename detection: 151-16 predicted the gap would reappear on slice 11. It did not — measured

151-15's standing instruction requires every PR body to carry both the `--no-renames` triple and
GitHub's rename-aware one. 151-16 recorded the expectation that **"slice 11 is where the gap will
reappear", and 151-17 should expect it.** It does not, and this was measured before anything was
written into a body:

```
git diff --shortstat --no-renames 10 11  ->  2324 files changed, 879826 insertions(+), 104 deletions(-)
git diff --shortstat -M          10 11  ->  2324 files changed, 879826 insertions(+), 104 deletions(-)
```

Identical triples, and identical status sets (`2322 A / 2 M` both ways). **The reason is structural:
slice 11 has zero deletions**, and rename detection needs a delete to pair an add with. A slice that
only adds cannot render differently under `-M`. The same reason made the two coincide for slices 08,
09 and 10 — 151-16 attributed *those* correctly and then over-generalised the wrong half of the
mechanism to slice 11. **Recorded as a refuted prediction, not a surprise:** the prediction was made
from size, and the mechanism depends on deletions.

---

---

*Phase: 151-ship-v0-2-akita-review-stack · Plan 05 · dry run executed 2026-08-17*
