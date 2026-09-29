---
phase: 153-build-tooling-config-correctness
plan: 06
subsystem: build-tooling
tags: [gitignore, tsbuildinfo, supabase-cli, git-index, negative-control, REVIEW-CFG-06, D-B2]
status: complete
requires: []
provides:
  - "root `.gitignore` rules `*.tsbuildinfo` (:29) and `supabase/.branches/` (:56)"
  - "`153-NC-ROW-4-CFG-06.md` — Row 4 of the phase negative-control ledger"
  - "two `.planning/todos/pending/` filings per D-N2"
affects:
  - ".gitignore (hand-maintained region only, above the auto-generated header)"
  - "the shared git index — four literal path removals"
tech-stack:
  added: []
  patterns:
    - "`git rm --cached <literal path>` ×4, never `-r` / `.` / `-A` / glob, on an index shared with eleven concurrent agents"
    - "ignore rules and index removal in ONE commit, so the paths are never simultaneously untracked and unignored"
    - "`git check-ignore -v --no-index` to prove a rule matches while the path is still tracked"
key-files:
  created:
    - .planning/phases/153-build-tooling-config-correctness/153-NC-ROW-4-CFG-06.md
    - .planning/todos/pending/2026-08-28-153-stray-top-level-supabase-directory.md
    - .planning/todos/pending/2026-08-28-153-tsbuildinfo-prevention-via-tsbuildinfofile.md
  modified:
    - .gitignore
  untracked_not_deleted:
    - apps/docs/tsconfig.tsbuildinfo
    - apps/frontend/tsconfig.tsbuildinfo
    - packages/supabase-types/tsconfig.tsbuildinfo
    - supabase/.branches/_current_branch
decisions:
  - "Root `.gitignore` rule for `supabase/.branches/` rather than a nested `supabase/.gitignore` — symmetric with the `supabase/.temp/` entry already at that spot (RESEARCH § E.3)."
  - "`tsBuildInfoFile` prevention filed as a todo, not done — beyond REVIEW-CFG-06's wording (plan `<open_decision id=\"OQ-none-here\">`)."
  - "Stray top-level `supabase/` directory NOT deleted — B2 option (c) not chosen; evidence recorded, the cwd-resolution check still owed."
  - "Regeneration proof performed with `tsc -p` directly, because the plan's prescribed `yarn build && yarn typecheck` route was measured NOT to write these artefacts at all."
  - "No E2E run: the only working-tree file changed is `.gitignore`, which no build step, test, or runtime path reads."
metrics:
  duration: ~35 min
  completed: 2026-08-29
  commits: 2
actuals:
  tokens: 7291
  tasks: 3
  commits: 2
  note: "chars/4 over the AUTHORED diff (`.gitignore` + three `.planning/` docs) = 29 164 chars → 7 291. The full commit range is 624 941 chars → 156 235, but 148 944 of that is the deletion of four pre-existing generated blobs from the index, which is not authored content. Reported on the authored scale so it is comparable to the plan's `estimate.tokens: 20000`; the raw figure is given here rather than hidden."
---

# Phase 153 Plan 06: Tracked Build Artefacts (REVIEW-CFG-06) Summary

Removed four tracked build artefacts (594 815 B / 581 KiB) from the index and closed the class globally with two `.gitignore` rules, then proved the rules bind against freshly written files — and found that the repo's own build pipeline does not produce these artefacts at all.

## Commits

| Commit | Message |
|---|---|
| `133e35f79` | `chore(153-06): untrack four build artefacts and close the class globally` |
| `fa4dd0969` | `docs(153-06): Row-4 evidence for REVIEW-CFG-06 and two deferred-item filings` |

## What landed

**`.gitignore`, 7 added lines, 0 removed**, all in the hand-maintained region above the
`# ── GSD baseline (auto-generated) ──` header (which moved from `:55` to `:62`):

- `:29` `*.tsbuildinfo`, beside the `.turbo` block, under a four-line rationale naming the canonical
  `tsBuildInfoFile` → `dist/` rule and why a workspace that omits it reopens the class.
- `:56` `supabase/.branches/`, immediately above the existing `supabase/.temp/` and under its
  section header — same stray directory, same rationale, alphabetical order matching
  `apps/supabase/supabase/.gitignore`'s own `.branches` / `.temp` pair.

**Four literal `git rm --cached` invocations.** No `-r`, no `.`, no `-A`, no glob, no
`git update-index --skip-worktree`, no `git clean`, no `git stash`, no blanket reset.
`git show --stat HEAD` on the removal commit lists exactly `.gitignore` plus four deletions. Rules
and removals are in the **same** commit, so the four paths were never simultaneously untracked and
unignored.

**All four files remain on disk.** The stray top-level `supabase/` directory was not deleted.

## Premises verified before use

Every positional citation in this plan and in `153-RESEARCH.md` § E was checked against the file
rather than trusted, per the phase's standing warning. **All of them were accurate:**

| Citation | Verdict |
|---|---|
| `.gitignore:23` `.turbo`, `:49-50` `supabase/.temp/` + comment, `:55` GSD header, `:67-68` `dist/` `build/` | accurate |
| `packages/shared-config/tsconfig.base.json:6` = `"composite": true` | accurate |
| `packages/README.md:20` = the `tsBuildInfoFile` → `dist/` rule | accurate |
| RESEARCH § E.1 tracked set: 4 paths, sizes 116 813 / 407 535 / 70 463 / 4 B, 1/2/1/1 commits, all 2026-08-17 | accurate, re-measured from `git cat-file -s` and `git log` |
| RESEARCH § E.5 stray-directory listing, absent `config.toml`/`migrations/`/`functions/`, `db:*` cwd, `apps/supabase/supabase/.gitignore` | accurate |

## Falsified premise (the significant finding)

**Plan Task 2 and `153-RESEARCH.md` § E.4 both assert that `yarn build` + `yarn typecheck`
regenerates the three `.tsbuildinfo` files. They do not.**

With all three deleted from disk:

```
yarn build      →  Tasks: 14 successful, 14 total   (0 cached)   EXIT 0
yarn typecheck  →  Tasks: 22 successful, 22 total   (10 cached)  EXIT 0
```

Both fully green, matching the phase baseline exactly, and **none of the three reappeared**. This is
not turbo caching — it is the scripts:

| Workspace | `build` | `typecheck` |
|---|---|---|
| `apps/docs` | `vite build` | `svelte-kit sync && svelte-check --tsconfig ./tsconfig.json` |
| `apps/frontend` | `svelte-kit sync && vite build && …` | `svelte-kit sync && svelte-check --tsconfig ./tsconfig.json` |
| `packages/supabase-types` | `echo 'Raw .ts source — no build step needed'` | **no `typecheck` script at all** |

No repo script invokes `tsc -b` or `tsc -p` for any of the three; `svelte-check` uses the compiler
API and writes no `.tsbuildinfo`. **These artefacts were never produced by the project's own
pipeline** — they came from an ad-hoc `tsc` run or an IDE and were swept into three bulk commits on
2026-08-17. This *strengthens* the criterion: the files are not merely redundant in the index, they
are not reproducible from the repository's commands.

The regeneration proof was therefore performed with the tool that actually writes them:

```
node_modules/.bin/tsc -p packages/supabase-types/tsconfig.json   → 35 032 B written
node_modules/.bin/tsc -p apps/docs/tsconfig.json --noEmit        → EXIT 0, 112 340 B written
node_modules/.bin/tsc -p apps/frontend/tsconfig.json --noEmit    → EXIT 2, 450 367 B written
```

Fresh md5s, all different from the tracked blobs — genuinely new files, not restored copies. Scoped
`git status --porcelain -- apps packages scripts tests supabase .gitignore` was empty before and
after all three runs: **no stray emission**. The `apps/frontend` non-zero exit is 61 `TS7031`-family
errors from driving raw `tsc` at a SvelteKit project whose real typecheck is `svelte-check` (raw
`tsc` cannot resolve `.svelte` imports). Pre-existing, not introduced here, not in scope —
`yarn typecheck` is 22/22 green. `tsc` writes the `.tsbuildinfo` regardless of exit status, which is
what the proof required.

## Second falsified premise: the plan's `git ls-files` predicate is too loose

`grep -P 'tsbuildinfo|\.branches'` is an unanchored substring test over whole paths. Once this
plan's own deferred-item todo was committed, the plan's PASS check went red:

```
$ git ls-files | grep -P 'tsbuildinfo|\.branches'
.planning/todos/pending/2026-08-28-153-tsbuildinfo-prevention-via-tsbuildinfofile.md
```

The match is a **filename**, not a build artefact — the document filed to record the deferred
prevention work makes the check that the work is done report a violation. Anchored to what the
criterion actually forbids, both halves still discriminate:

```
$ git ls-tree -r --name-only HEAD      | grep -P '\.tsbuildinfo$|(^|/)\.branches/'  → empty, exit 1  PASS
$ git ls-tree -r --name-only 0955daec4 | grep -P '\.tsbuildinfo$|(^|/)\.branches/'  → all four, exit 0  FAIL
```

**Re-verification of REVIEW-CFG-06 should use the anchored form.** Recorded in
`153-NC-ROW-4-CFG-06.md` § *The plan's predicate is too loose*, with both halves; the loose form is
preserved there too, since it is what the plan specified.

## Mechanism finding: `git check-ignore` is index-aware

Run *after* the `.gitignore` edit but *before* the removal, `git check-ignore -v` reported
**not-ignored** for all four paths. That is not a rule failure — `check-ignore` consults the index
and declines to report a tracked path as ignored. `--no-index` confirmed the rules matched all
along.

The consequence is worth keeping: **a green `git check-ignore` on these paths is only reachable
after the untracking**, so this check is a real gate on the criterion rather than a restatement of
the `.gitignore` edit. Had the plan asserted `check-ignore` before the removal, it would have read
as a rule failure and sent an executor chasing a non-defect.

## Both halves of every gate

| Gate | Half that PASSES | Half that FAILS |
|---|---|---|
| `test -z "$(git ls-files \| grep -P 'tsbuildinfo\|\.branches')"` | after removal → `EMPTY (PASS)` | same expression at `0955daec4` → `FAIL`, printed the four paths |
| scoped `git status --porcelain` | the four paths → empty | probe `supabase/zz-flip-probe.txt` → `?? supabase/zz-flip-probe.txt` |
| `git check-ignore -v --no-index` | the four paths → named rule | `packages/core/src/index.ts` → non-zero, no rule |
| `check-ignore` exactly-one-rule | 1 line each for the four | `packages/core/dist/tsconfig.tsbuildinfo` → still its pre-existing `packages/core/.gitignore:2:dist/`, not double-reported, not un-ignored |

Note `grep -E` has no `\b` on this git/grep pairing, so `-P` was used throughout, per the phase's
scanning rule.

## Baselines after the change

| Check | Baseline | Measured | Verdict |
|---|---|---|---|
| `yarn build` | 14/14 | **14/14**, exit 0 | match |
| `yarn typecheck` | 22/22 | **22/22**, exit 0 | match |
| `yarn lint:check` | 22/22, exit 0 | **exit 0**; lint 11/11, typecheck 22/22 | match |
| comment-hygiene | 1579 files / 0 violations | **1579 / 0** | match |
| edge-env-defaults | 17 / 0 | **17 / 0** | match |
| declared-binaries | 16 workspaces / 0 | **16 / 0** (20 binary invocations) | match |
| i18n-catalog / a11y-scan / node-engine | 0 violations | **0 / 0 / OK** | match |
| prettier on the three new docs | clean | **clean** | match |

`yarn db:lint:sql` not run — pre-existing red by construction (it lints the live database and reads
no working-tree file), never scored as a regression.

**E2E: declined, on this diff's own merits.** The only working-tree file this plan changed is
`.gitignore`, plus three `.planning/` markdown documents. Nothing in that set is read by a build
step, a test, or any runtime path; the diff cannot reach the served application. The four untracked
files are still byte-present on disk, so even a tool that read them sees no change. Build, typecheck
and lint are all green post-change.

## Deviations from Plan

**1. [Rule 3 — blocking issue] Task 2's prescribed regeneration route does not work**

- **Found during:** Task 2
- **Issue:** The plan's `<verify>` block is `rm -f <three files> && yarn build && yarn typecheck &&
  test -f <each>`. The `test -f` step fails: neither command writes any of the three.
- **Fix:** Regenerated with `tsc -p <tsconfig>` directly — the tool that actually produces the
  artefact — after confirming via each workspace's `package.json` scripts *why* the prescribed route
  cannot. The criterion behind the step ("the ignore rules bind against artefacts written after the
  change") is fully satisfied, and more strongly: the regenerated files have different md5s from the
  tracked blobs, so they are provably new.
- **Files modified:** none tracked (the artefacts are ignored by design).
- **Recorded in:** `153-NC-ROW-4-CFG-06.md` § *Falsified premise*, and carried into
  `2026-08-28-153-tsbuildinfo-prevention-via-tsbuildinfofile.md` so the follow-up does not inherit
  the same wrong assumption.

**2. [Cosmetic] The `*.tsbuildinfo` rationale is four comment lines, not the "one-line rationale"
the plan's action specifies**

- The instruction was to follow the file's own convention. The file's convention for a rule needing
  explanation *is* a multi-line `#` block — `.gitignore:41-43` (E2E evidence dirs) and `:12-15`
  (mock OIDC cert) are both multi-line. A single line carrying the same content would have run past
  180 characters. `.gitignore` is not scanned by `assert-comment-hygiene.mjs` (its `GLOBS` are
  source-file globs), so no hygiene rule applies; the guard was nonetheless re-run and is 1579/0.

## Deferred / registered, not fixed

- **Stray top-level `supabase/` directory** — survives per D-B2 (option (c) not chosen). Filed with
  the residue evidence (no `config.toml`/`migrations/`/`functions/`; real project at
  `apps/supabase/supabase/`; all `db:*` scripts run with cwd `apps/supabase`; no tracked file
  references the root-relative path) **and** the three checks still owed before deletion.
  → `.planning/todos/pending/2026-08-28-153-stray-top-level-supabase-directory.md`
- **`tsBuildInfoFile` prevention** for the three offending tsconfigs — beyond the criterion's
  wording, and `tsconfig.json` edits would collide with sibling plans mid-wave.
  → `.planning/todos/pending/2026-08-28-153-tsbuildinfo-prevention-via-tsbuildinfofile.md`
- **Adjacent gap, noted inside the stray-directory todo rather than filed separately:**
  `.gitignore:53` ignores `apps/supabase/supabase/snippets/` but there is no rule for the
  root-level `supabase/snippets/`, which also exists (currently empty, hence invisible to git).
  Deleting the stray directory resolves it.
- **`apps/frontend` raw-`tsc` errors (61, `TS7031` family)** — an artefact of driving `tsc` at a
  project whose typecheck is `svelte-check`. Not a defect in the codebase, not introduced here, no
  action proposed.

## Known Stubs

None. No stub, placeholder, skipped test, or unrun `<verify>` was introduced. All three tasks' verify
blocks were executed (Task 2's in corrected form, documented above).

## Requirements

`REVIEW-CFG-06` — met. All four measured paths untracked, all four still on disk, class closed
globally, rules proven to bind against freshly written artefacts with both halves of every gate
recorded.

## Self-Check: PASSED

All four created files verified present on disk; both commits (`133e35f79`, `fa4dd0969`) verified
present in `git log --oneline --all`. Prettier clean on all four documents.
