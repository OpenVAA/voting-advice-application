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
status: dry-run-proven
---

# Phase 151 — Stack Manifest

**The canonical record of the v0.2 Akita review stack: twelve slices, proven on throwaway refs to
partition the merge target completely (catch-all `files=0`), with every off-diagonal overlap cell at
`0`, reconstructing the target's tree `e424d633e` byte for byte.**

Machine-readable source: [`slices.tsv`](slices.tsv). **No plan hard-codes a pathspec** — every later
slice-cutting plan reads column 4 of that file.

## The slice table

Columns `commit` and `PR` are filled in by the plans that cut and open each slice (151-13 … 151-17).
They are present and marked `pending` deliberately, so the record's *shape* does not change under a
later plan — only its cells.

| id | PR | branch | subject | files | +lines | −lines | render flag | commit | PR # |
|---|---|---|---|---|---|---|---|---|---|
| 01a | 1 | `ship/v0.2-akita-01a-layout-move` | `refactor: move the frontend and docs trees into apps/ (renames only, no content change)` | 1316 | 0 | 0 | **files > 300** — 1316 renames, **zero lines** | pending | pending |
| 01b | 2 | `ship/v0.2-akita-01b-strapi-removal` | `chore: remove the Strapi backend and the frontend tests that drove it` | 252 | 0 | 55663 | **lines > 20k** — deletions only | pending | pending |
| 02 | 3 | `ship/v0.2-akita-02-shared-packages` | `feat: rework the shared @openvaa packages for the v0.2 data, matching and filter model` | 97 | 1228 | 289 | ok | pending | pending |
| 03 | 4 | `ship/v0.2-akita-03-supabase` | `feat[db]: replace the Strapi backend with the Supabase schema, RLS, functions and generated types` | 118 | 16257 | 0 | ok | pending | pending |
| 04 | 5 | `ship/v0.2-akita-04-dev-seed` | `feat: add the dev-seed package that generates deterministic local and E2E data` | 162 | 19560 | 0 | ok — 19,560 lines, just inside the 20k cap | pending | pending |
| 05 | 6 | `ship/v0.2-akita-05-e2e-tests` | `test: add the Playwright end-to-end suite and its runner configuration` | 195 | 23297 | 778 | **lines > 20k** | pending | pending |
| 06 | 7 | `ship/v0.2-akita-06-frontend-lib` | `feat: rewrite the frontend library layer on Svelte 5 runes and the Supabase adapter` | 526 | 22657 | 8315 | **files > 300 and lines > 20k** | pending | pending |
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
**4255** (`git -c diff.renameLimit=20000 diff --name-only --no-renames "$C1" "$TARGET" | wc -l`).

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

---

*Phase: 151-ship-v0-2-akita-review-stack · Plan 05 · dry run executed 2026-08-17*
