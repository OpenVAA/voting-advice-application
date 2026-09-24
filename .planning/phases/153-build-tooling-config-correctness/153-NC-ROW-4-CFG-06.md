# Phase 153 — Negative Control, Row 4 (REVIEW-CFG-06)

**One row, two halves.** The BEFORE half records the defect as measured while it was still live;
the AFTER half records the same measurement once the work landed. A green measurement on its own
is not evidence — a rule that binds and a rule that examines nothing are indistinguishable from a
single observation — so every claim below is paired with the run that could have contradicted it.

- **Date:** 2026-08-29
- **Plan:** `153-06-PLAN.md` (wave 1) — both halves owned by this plan
- **Requirements:** REVIEW-CFG-06
- **Decisions discharged:** D-B2 (untrack the *measured* set, add a global ignore, do **not** delete the stray directory); D-N2 (adjacent questions are filed as todos, not silently done or dropped)
- **Standing acceptance rule:** prove the check fails before claiming it checks — a gate that examines nothing also reports green
- **Precedent followed:** `.planning/phases/141-package-unit-test-coverage-test-unit-invariant-guard/141-NEGATIVE-CONTROL.md`

## Environment

```
date (UTC):        2026-08-29T16:44:11Z
repo root:         /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd
git HEAD:          133e35f793f7dc225ea99876e9d44e8eef09f6c9  (the Row-4 index-removal commit)
git branch:        integration/ship-12-squash
OS:                macOS / Darwin 25.5.0
Node:              v24.14.1
Yarn:              4.13.0
tsc:               5.9.3
turbo:             2.8.17
git:               2.50.1 (Apple Git-155)
```

> **Why the bare `git status` is not the gate, and why that matters more here than anywhere else in
> this phase.** This is the only plan in Phase 153 that mutates the **git index**, and it does so
> while eleven sibling agents share that index and the GSD orchestrator writes `.planning/`
> continuously. An unscoped `git status` in this worktree is expected to be dirty at any moment, so
> an unscoped assertion would be both flaky and meaningless: sibling dirt could satisfy it or fail
> it independently of anything this row claims. **Every status claim below is scoped to exactly
> five paths** — `.gitignore`, `apps/docs/tsconfig.tsbuildinfo`,
> `apps/frontend/tsconfig.tsbuildinfo`, `packages/supabase-types/tsconfig.tsbuildinfo`, and
> `supabase/.branches/_current_branch`. The index mutation itself was four separate literal
> `git rm --cached` invocations: no `-r`, no `.`, no `-A`, no glob, no
> `git update-index --skip-worktree` at any point. No `git clean`, no `git stash`, and no blanket
> working-tree reset was run.
>
> The scoped form is **not** vacuous, and that is demonstrated rather than asserted — see
> *Non-vacuity of the scoped status gate* in the AFTER half.

---

## Row 4 — REVIEW-CFG-06 / **BEFORE**

**Claim under test:** build artefacts are tracked in version control, and nothing in the repository
prevents the class from reopening in another workspace.

### The tracked set — four paths, not the one the reviewer's comment named

The reviewer's comment named a single file and the roadmap inherited that scope. The index says
otherwise. Measured at `0955daec4`, immediately before the change:

```
$ git ls-files | grep -P 'tsbuildinfo|\.branches'
apps/docs/tsconfig.tsbuildinfo
apps/frontend/tsconfig.tsbuildinfo
packages/supabase-types/tsconfig.tsbuildinfo
supabase/.branches/_current_branch
```

Blob sizes taken from the index itself (`git cat-file -s $(git rev-parse HEAD:<path>)`), and
history from `git log -- <path>`:

| Path | Blob size | Commits touching it | First / last |
|---|---|---|---|
| `apps/docs/tsconfig.tsbuildinfo` | 116 813 B | 1 | 2026-08-17 / 2026-08-17 |
| `apps/frontend/tsconfig.tsbuildinfo` | 407 535 B | 2 | 2026-08-17 / 2026-08-17 |
| `packages/supabase-types/tsconfig.tsbuildinfo` | 70 463 B | 1 | 2026-08-17 / 2026-08-17 |
| `supabase/.branches/_current_branch` | 4 B (content: `main`) | 1 | 2026-08-17 / 2026-08-17 |
| **Total** | **594 815 B (581 KiB)** | | |

Introducing commits: `602b79351` *"refactor: move frontend/ and docs/ under apps/"*, `3d75e3e27`
*"chore: update the monorepo and frontend-app build, lint, CI and deployment plumbing"*, and
`11f877913` *"feat[db]: replace the Strapi backend with the Supabase schema, RLS, functions and
generated types"*. All three are bulk-restructuring commits — the artefacts were swept in, never
chosen.

This confirms the phase's framing: **fixing one of three leaves the noisy-diff problem in the two
busiest workspaces**, and `apps/frontend/tsconfig.tsbuildinfo` — the largest of the four at
407 535 B — is precisely the one the single-file scope would have left behind.

### No rule existed, and nothing was closing the class

`.gitignore` at `0955daec4` was 78 lines and contained **no `tsbuildinfo` rule and no `.branches`
rule**:

```
$ grep -nE 'tsbuildinfo|\.branches' .gitignore
$ echo $?
1
```

The nearest neighbours are `.turbo` at `:23` (the other build-tool artefact) and, at `:49-50`, the
*sibling* residue of the very same stray directory:

```
49:# Supabase CLI local state (rewritten on every CLI run — machine-local, never shared)
50:supabase/.temp/
```

So the repository already treated `supabase/.temp/` as machine-local CLI state while versioning
`supabase/.branches/_current_branch` — the asymmetry was the defect, not a judgement call.

### Why the class could reopen

`packages/shared-config/tsconfig.base.json:6` is `"composite": true` [verified, read this session],
so **every** workspace extending the shared config emits a `.tsbuildinfo`. Where it lands is decided
by `tsBuildInfoFile`. `packages/README.md:20` states the canonical rule verbatim:

> The `tsBuildInfoFile` is set to `./dist/tsconfig.tsbuildinfo` in `tsconfig.json` so the
> incremental-build artifact is also gitignored.

Eight `packages/*` workspaces follow it (`git grep -n tsBuildInfoFile -- '*tsconfig*.json'` →
`app-shared`, `argument-condensation`, `core`, `data`, `filters`, `llm`, `matching`,
`question-info`). The three offenders do **not** set it at all [verified, all three tsconfigs read
in full], so TypeScript writes the artefact beside the tsconfig at the workspace root, where no
rule caught it. Nothing stopped a fourth workspace from joining them.

**Verdict — BEFORE: DEFECT CONFIRMED, and wider than reported.** Four tracked paths, 581 KiB of
opaque compiler state, zero ignore rules, and a `composite: true` base guaranteeing the class stays
open.

---

## Row 4 — REVIEW-CFG-06 / **AFTER**

Landed as `133e35f79` *"chore(153-06): untrack four build artefacts and close the class globally"*.

### The index no longer holds any of them

```
$ git ls-files | grep -P 'tsbuildinfo|\.branches'
$ test -z "$(git ls-files | grep -P 'tsbuildinfo|\.branches')" && echo "EMPTY (PASS)"
EMPTY (PASS)
```

The check treats grep's empty-set exit status as the PASS condition (`test -z "$(…)"`), not as a
command failure. **Discrimination proof:** the *identical* predicate run against `0955daec4`
reported `FAIL (correct: 4 paths still tracked)` and printed the four paths. Same expression, both
outcomes observed. Note also that `grep -E` has no `\b` support on this git/grep pairing — `-P` is
used throughout.

### The plan's predicate is too loose, and this row's own filing trips it

Re-run once the two deferred-item todos were committed, the plan's expression stops being empty:

```
$ git ls-files | grep -P 'tsbuildinfo|\.branches'
.planning/todos/pending/2026-08-28-153-tsbuildinfo-prevention-via-tsbuildinfofile.md
```

The match is a **filename**, not a build artefact. `tsbuildinfo|\.branches` is an unanchored
substring test over whole paths, so the very document filed to record the deferred prevention work
makes the check that the work is done report red. Anchoring to what the criterion actually forbids —
a file whose name *ends* in `.tsbuildinfo`, or any path inside a `.branches/` directory — separates
the two:

```
$ git ls-tree -r --name-only HEAD | grep -P '\.tsbuildinfo$|(^|/)\.branches/'
$ echo $?
1                       # empty set — PASS

$ git ls-tree -r --name-only 0955daec4 | grep -P '\.tsbuildinfo$|(^|/)\.branches/'
apps/docs/tsconfig.tsbuildinfo
apps/frontend/tsconfig.tsbuildinfo
packages/supabase-types/tsconfig.tsbuildinfo
supabase/.branches/_current_branch
$ echo $?
0                       # matched all four — correctly FAILS pre-change
```

Both halves observed with the *tightened* expression, so it discriminates exactly as well as the
loose one on the real defect while no longer being fooled by prose about the defect. **Anyone
re-verifying REVIEW-CFG-06 should use the anchored form**; the loose form is preserved above only
because it is what the plan specified and what the discrimination proof was originally run with.

### One commit, five entries, additions only

```
$ git show --stat --format='' HEAD
 .gitignore                                   | 7 +++++++
 apps/docs/tsconfig.tsbuildinfo               | 1 -
 apps/frontend/tsconfig.tsbuildinfo           | 1 -
 packages/supabase-types/tsconfig.tsbuildinfo | 1 -
 supabase/.branches/_current_branch           | 1 -
 5 files changed, 7 insertions(+), 4 deletions(-)

$ git diff HEAD~1 HEAD --numstat -- .gitignore
7	0	.gitignore
```

Seven added lines, **zero** removed — the two rules only *widen* exclusion, and nothing below the
`# ── GSD baseline (auto-generated) ──` header (now `:62`) was touched. `*.tsbuildinfo` sits at
`:29`, beside the `.turbo` block; `supabase/.branches/` at `:56`, under the existing
`supabase/.temp/` section header. Both are above `:62`.

### `git check-ignore -v` — exactly one rule per path

```
$ for p in apps/docs/tsconfig.tsbuildinfo apps/frontend/tsconfig.tsbuildinfo \
           packages/supabase-types/tsconfig.tsbuildinfo supabase/.branches/_current_branch; do
    git check-ignore -v "$p"
  done
.gitignore:29:*.tsbuildinfo         apps/docs/tsconfig.tsbuildinfo
.gitignore:29:*.tsbuildinfo         apps/frontend/tsconfig.tsbuildinfo
.gitignore:29:*.tsbuildinfo         packages/supabase-types/tsconfig.tsbuildinfo
.gitignore:56:supabase/.branches/   supabase/.branches/_current_branch
```

One line each (`git check-ignore -v <path> | wc -l` = 1 for all four). **No double-reporting and no
un-ignoring** of an artefact already covered elsewhere:

```
$ git check-ignore -v packages/core/dist/tsconfig.tsbuildinfo
packages/core/.gitignore:2:dist/    packages/core/dist/tsconfig.tsbuildinfo
```

The eight `packages/*/dist/tsconfig.tsbuildinfo` files still resolve to their pre-existing `dist/`
rule, exactly as before the change. **Negative control on the rule set:**
`git check-ignore -v --no-index packages/core/src/index.ts` exits non-zero — the new rules do not
sweep in source.

### The rules were also checked index-blind, which caught a mechanism worth recording

Run *before* the removal, with the rules already in `.gitignore`, `git check-ignore -v` reported
**not-ignored** for all four paths. That is not a rule failure: `git check-ignore` consults the
index and declines to report a *tracked* path as ignored. `--no-index` proves the rules themselves
match:

```
$ git check-ignore -v --no-index apps/frontend/tsconfig.tsbuildinfo
.gitignore:29:*.tsbuildinfo	apps/frontend/tsconfig.tsbuildinfo
```

Consequence worth stating plainly: **a green `git check-ignore` on these paths is only reachable
after the untracking.** The check cannot be satisfied by the `.gitignore` edit alone, which makes
it a real gate on this criterion rather than a restatement of the edit.

### The rules bind against artefacts written *after* the change

An ignore rule never tested against a freshly written file is a rule nobody has checked. The three
`.tsbuildinfo` files were deleted from disk and regenerated from scratch. Fresh md5s, all different
from the tracked blobs, confirming these are new files and not restored copies:

| Path | tracked blob (md5) | regenerated (md5) | new size |
|---|---|---|---|
| `apps/docs/tsconfig.tsbuildinfo` | `0e02e0eb…` | `43deefec…` | 112 340 B |
| `apps/frontend/tsconfig.tsbuildinfo` | `5c00372c…` | `969ebe4f…` | 450 367 B |
| `packages/supabase-types/tsconfig.tsbuildinfo` | `035c1c0b…` | `7e1e92e0…` | 35 032 B |

```
$ test -z "$(git ls-files | grep -P 'tsbuildinfo|\.branches')" && echo EMPTY
EMPTY
$ git status --porcelain -- apps/docs/tsconfig.tsbuildinfo apps/frontend/tsconfig.tsbuildinfo \
      packages/supabase-types/tsconfig.tsbuildinfo supabase/.branches/_current_branch
$                       # empty — regenerated and invisible to git
```

All four files remain **on disk**; only their tracking was removed.

For the fourth path, the Supabase CLI was not run (Docker start is disproportionate, and the file
is 4 bytes of CLI state). Its contents were rewritten by hand and restored:

```
$ printf 'scratch-153-06' > supabase/.branches/_current_branch   # 14 bytes
$ git status --porcelain -- supabase/.branches/_current_branch
$                       # empty
$ printf 'main' > supabase/.branches/_current_branch             # restored, 4 bytes
```

### Non-vacuity of the scoped status gate

The scoped `git status --porcelain` above is empty for the four paths. That is only evidence if the
same expression can be made non-empty:

```
$ printf 'x' > supabase/.branches/zz-flip-probe.txt
$ git status --porcelain -- supabase/.branches/zz-flip-probe.txt
$                       # empty — inside the newly ignored directory, as designed

$ printf 'x' > supabase/zz-flip-probe.txt
$ git status --porcelain -- supabase/zz-flip-probe.txt
?? supabase/zz-flip-probe.txt          # NON-EMPTY — the gate does report unignored files
```

Both probes removed afterwards; `git status --porcelain -- supabase/` is empty again. The gate
discriminates.

### Falsified premise: `yarn build && yarn typecheck` does **not** regenerate these artefacts

The plan's Task 2 and `153-RESEARCH.md` § E.4 both assume the repo's own pipeline rewrites the three
files. It does not. With all three deleted:

```
### yarn build
 Tasks:    14 successful, 14 total
Cached:    0 cached, 14 total
BUILD_EXIT=0
### yarn typecheck
 Tasks:    22 successful, 22 total
Cached:   10 cached, 22 total
TYPECHECK_EXIT=0

$ for p in apps/docs/… apps/frontend/… packages/supabase-types/…; do test -f "$p"; done
NOT REGENERATED apps/docs/tsconfig.tsbuildinfo
NOT REGENERATED apps/frontend/tsconfig.tsbuildinfo
NOT REGENERATED packages/supabase-types/tsconfig.tsbuildinfo
```

Both commands fully green (14/14 and 22/22, matching the phase baseline) with all three artefacts
**absent**. The reason is in the scripts, not in turbo caching:

| Workspace | `build` | `typecheck` |
|---|---|---|
| `apps/docs` | `vite build` | `svelte-kit sync && svelte-check --tsconfig ./tsconfig.json` |
| `apps/frontend` | `svelte-kit sync && vite build && …` | `svelte-kit sync && svelte-check --tsconfig ./tsconfig.json` |
| `packages/supabase-types` | `echo 'Raw .ts source — no build step needed'` | *(no `typecheck` script at all)* |

No repo script invokes `tsc -b` or `tsc -p` for any of the three. `svelte-check` runs the compiler
API, not `tsc`, and writes no `.tsbuildinfo`. **These artefacts were never produced by the repo's
pipeline** — they came from an ad-hoc `tsc` invocation or an IDE and were swept into the three bulk
commits of 2026-08-17. That strengthens the criterion rather than weakening it: the files are not
merely redundant in the index, they are not reproducible from the project's own commands.

Regeneration was therefore performed with the tool that actually writes them:

```
$ node_modules/.bin/tsc -p packages/supabase-types/tsconfig.json          # noEmit:true in its config
$ node_modules/.bin/tsc -p apps/docs/tsconfig.json --noEmit               # EXIT=0
$ node_modules/.bin/tsc -p apps/frontend/tsconfig.json --noEmit           # EXIT=2, 61 TS errors
```

`git status --porcelain -- apps packages scripts tests supabase .gitignore` was empty before and
after all three runs: **no stray emission**. The `apps/frontend` non-zero exit is an artefact of
driving raw `tsc` at a SvelteKit project whose real typecheck is `svelte-check` (raw `tsc` cannot
resolve `.svelte` imports, hence 61 `TS7031`-family errors). It is not a regression and not
introduced here — `yarn typecheck` is 22/22 green. `tsc` writes the `.tsbuildinfo` regardless of
exit status, which is what the proof needed.

### Baseline

`yarn build` 14/14 and `yarn typecheck` 22/22, both matching the phase baseline, run with the
artefacts deleted. Deleting and regenerating the incremental state broke nothing. No E2E run was
performed: the only working-tree file this plan changed is `.gitignore`, which no build step, no
test, and no runtime path reads — the diff cannot reach the served application.

**Verdict — AFTER: CRITERION MET.** All four measured paths are out of version control, all four
remain on disk, the class is closed globally by a single rule that provably binds against freshly
written artefacts, the pre-existing `dist/` coverage is undisturbed, and every claim about the
shared index is scoped to five named paths and shown to discriminate.

---

## Deliberately not done, and filed

Per D-B2 and D-N2, two adjacent questions were left open rather than answered inside this criterion:

- The stray top-level `supabase/` directory **survives** — B2 option (c) was considered and not
  chosen. Only the tracked file under it was untracked.
  → `.planning/todos/pending/2026-08-28-153-stray-top-level-supabase-directory.md`
- Setting `tsBuildInfoFile` into the three offenders' ignored output directories — *prevention*
  rather than ignoring — is beyond REVIEW-CFG-06's wording.
  → `.planning/todos/pending/2026-08-28-153-tsbuildinfo-prevention-via-tsbuildinfofile.md`
