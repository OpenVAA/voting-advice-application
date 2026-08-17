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
slices_cut: ["01a", "01b", "02", "03", "04", "05", "06"]
slices_cut_by: "151-09 (01a, 01b, 02); 151-11 (03; 02 re-cut from the F-18-fixed tip); 151-12 (04); 151-13 (05); 151-14 (06)"
cut_base_sha: ac30f132a407084bf30626029a0a71a0a521982f
cut_target_sha: d8e75d868
cut_target_tree: 06f7ab4f4
partition_total_files_at_cut: 4292
catchall_remaining_files: 2934
catchall_deviation_pct: 0.0
partial_stack_identity_verified: true
branches_pushed: 6
prs_opened: 6
pushed_by: "151-10 (01a, 01b); 151-11 (02); 151-12 (03); 151-13 (04); 151-14 (05)"
prs_open: [863, 864, 865, 866, 867, 868]
adapter_block_dispositioned_by: "151-14"
criterion_4_3_satisfied_by: 545cc26c8790c54b532f3d50fe5bceb02d851177
ruleset_8477541: untouched-active
pr_860_decision: repurpose-at-151-18
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
| 06 | 7 | `ship/v0.2-akita-06-frontend-lib` | `feat: rewrite the frontend library layer on Svelte 5 runes and the Supabase adapter` | **533** | **22715** | **8344** | **files > 300 AND lines > 20k** — 533 files (cap 300) and 31,059 changed lines (cap 20,000); the ONLY row over both budgets other than the by-design planning slice | `8c613634b` | pending (opens at 151-15, per D-07) |
| 07 | 8 | `ship/v0.2-akita-07-frontend-routes` | `feat: rewrite the frontend app shell and the voter and candidate routing surface` | 213 | 10291 | 8267 | ok | pending | pending |
| 08 | 9 | `ship/v0.2-akita-08-i18n-messages` | `feat: add the Paraglide message catalogues for every supported locale` | 329 | 8904 | 0 | **files > 300** — 47 messages × 7 locales, one shape | pending | pending |
| 09 | 10 | `ship/v0.2-akita-09-docs` | `docs: update the project documentation - the docs site, the root roadmap and the key-generation guide` | 39 | 490 | 92 | ok | pending | pending |
| 10 | 11 | `ship/v0.2-akita-10-root-config` | `chore: update the monorepo and frontend-app build, lint, CI and deployment plumbing` | 37 | 8665 | 25535 | **lines > 20k** — `yarn.lock` alone accounts for most of it | pending | pending |
| 11 | 12 | `ship/v0.2-akita-11-planning` | `docs[planning]: add the v0.2 planning record and agent configuration` | 2287 | 866928 | 100 | **files > 300 and lines > 20k** — unreadable by design (D-12) | pending | pending |

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



---

---

*Phase: 151-ship-v0-2-akita-review-stack · Plan 05 · dry run executed 2026-08-17*
