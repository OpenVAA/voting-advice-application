---
phase: 151-ship-v0-2-akita-review-stack
plan: 03
artifact: baseline
captured: 2026-08-16

# --- Task 1: the criterion-5 pin (D-01, C-11) ---
pre_sweep_tip: fe91f3099e923039837bf88516f8ce14ded4078c
context_snapshot_sha: 94be73a61c8facf33770a845c8ed67cbe3ff15af
snapshot_is_ancestor: true
snapshot_drift_commits: 15
snapshot_drift_touches_source: false
backup_worktree_path: /Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd-backup
backup_head_detached: true
hooks_path: /dev/null
worktrees_before: 7
worktrees_after: 8

# --- Task 2: the gate baseline (A5) ---
lint_check: green
format_check: red
test_unit: green
pre_existing_failures: 2
lint_check_exit: 0
format_check_exit: 1
test_unit_exit: 0
lint_check_secs: 13
format_check_secs: 9
test_unit_secs: 14
lint_warnings: 20
lint_errors: 0
unit_tests_passed: 1522
unit_test_files: 149
any_files_naive: 24
any_occurrences_naive: 96
any_files_corrected: 14
any_occurrences_corrected: 77
any_files_in_lint_scope: 7
ts_expect_error_occurrences: 7
ts_expect_error_files: 4
ts_ignore_occurrences: 0
no_explicit_any_disable_files: 15
---

# Phase 151 — Baseline Record

**Everything this phase later calls "fixed" is measured against this file.** It is captured before
any plan mutates `feat-gsd-roadmap`, so a value recorded here cannot have been influenced by the
work it will be used to judge.

Every number below carries the command that produced it. A value without a command is an
assumption, and this phase has already been bitten twice by inheriting one (C-5's mis-attributed
725; A5's unmeasured lint state).

---

## The pin (criterion 5, D-01)

| Field | Value |
|---|---|
| Pre-sweep tip (**resolved at execution time**) | `fe91f3099e923039837bf88516f8ce14ded4078c` |
| `151-CONTEXT.md` D-01 snapshot | `94be73a61c8facf33770a845c8ed67cbe3ff15af` |
| Snapshot is an ancestor of the pin | **yes** (`git merge-base --is-ancestor` → exit 0) |
| Commits of drift between them | **15** |
| Backup worktree | `/Users/kallejarvenpaa/Desktop/OpenVAA/voting-advice-application-gsd-backup` |
| Backup HEAD state | detached (`git symbolic-ref -q HEAD` → exit 1) |
| Backup working tree | clean (`git status --porcelain` → empty) |
| `core.hooksPath` in this checkout | `/dev/null` (worktree-local override) |

### Producing commands

```
$ git rev-parse feat-gsd-roadmap
fe91f3099e923039837bf88516f8ce14ded4078c

$ git rev-parse 94be73a61
94be73a61c8facf33770a845c8ed67cbe3ff15af

$ git merge-base --is-ancestor 94be73a61 feat-gsd-roadmap; echo $?
0

$ git rev-list --count 94be73a61..fe91f3099
15

$ git worktree add --detach ../voting-advice-application-gsd-backup fe91f3099e923039837bf88516f8ce14ded4078c
Preparing worktree (detached HEAD fe91f3099)
HEAD is now at fe91f3099 docs(151-02): complete Wave-0 verification and report tooling plan

$ git -C ../voting-advice-application-gsd-backup rev-parse HEAD
fe91f3099e923039837bf88516f8ce14ded4078c

$ git -C ../voting-advice-application-gsd-backup symbolic-ref -q HEAD; echo $?
1                                   # non-zero == detached, which is the requirement

$ git -C ../voting-advice-application-gsd-backup status --porcelain
                                    # empty

$ git config --get core.hooksPath
/dev/null

$ git worktree list | wc -l         # before: 7   after: 8
```

`git worktree list` after the add — all seven pre-existing paths still present, four agent
worktrees still **locked** and untouched, one new entry:

```
/Users/…/voting-advice-application                             5b48cab39 [deploy-young-votes-mockup-vaa]
/Users/…/voting-advice-application-gsd                         fe91f3099 [feat-gsd-roadmap]
/Users/…/voting-advice-application-gsd-2                       6a5209148 [deploy-nuorten-vaalikone-2025]
/Users/…/voting-advice-application-gsd-backup                  fe91f3099 (detached HEAD)      ← new
/Users/…/.claude/worktrees/agent-a37e1f33985fba46d             e20151769 […] locked
/Users/…/.claude/worktrees/agent-a5b3afe4607f057a9             0c3cea154 […] locked
/Users/…/.claude/worktrees/agent-ae553bd6b747d72a8             8148e01f4 […] locked
/Users/…/.claude/worktrees/agent-af0317d08d973c05e             39d97da2a […] locked
```

### Why the two SHAs differ, and why the difference is harmless

C-11 anticipated drift and forbade hard-coding `94be73a61`. The drift is real — 15 commits — but
its **content** is the reassuring part. All fifteen are Phase 151's own planning and tooling
commits:

```
$ git log --oneline 94be73a61..fe91f3099
fe91f3099 docs(151-02): complete Wave-0 verification and report tooling plan
e4cf979f9 feat(151-02): add slice-overlap-matrix.sh for criterion 6
5816cac31 feat(151-02): add hygiene-grep-report.sh for criterion 3
b9570dc6c feat(151-02): encode criterion 4.1-4.6 as verify-commit-taxonomy.sh
c83472e65 docs(151-01): complete byte-identity tracer plan
b4eeeea6d docs(151-01): summarize byte-identity tracer plan
bb9b57941 docs(151-01): record the dry-run byte-identity proof
698ffc98d feat(151-01): add stack-construction scripts and prove the pipeline end to end
ca10b9736 docs(151): create phase plan
52d5d9f48 docs(151): create phase plan — 19 plans, tracer-first, 17 waves
f8af2d779 docs(151): map phase patterns to in-repo analogs
01624f828 docs(151): add validation strategy
f34bdf51e docs(151): research phase domain
55415cf5a docs(state): record phase 151 context session
41d23af71 docs(151): capture phase context
```

Not one of them touches shipped source:

```
$ git diff --name-only 94be73a61..fe91f3099 -- . ':(exclude).planning'
.planning/phases/151-…/scripts/…      # (only the phase-local scripts, all under .planning/)
```

So the pin is a **strict superset** of D-01's intent: it contains everything `94be73a61` contained,
plus this phase's own paperwork, and **zero** sweep edits. The reiterative history criterion 5
exists to preserve is fully inside it.

**Deviation from the plan's precondition, recorded rather than waved through.** Task 1's
precondition reads "`feat-gsd-roadmap` is the current branch and Phase 150 is complete". The first
clause holds. The second does **not**: `.planning/phases/` contains 137–140 and 151 only — phases
141–150 have no directories and have not run. The precondition's stated *reason* ("so the tip about
to be pinned is the real pre-sweep tip rather than a mid-phase state") is nonetheless satisfied, and
by a stronger route than the one it assumed: the working tree is clean, no phase is mid-execution,
and the 15 drift commits are provably source-free. Proceeding was therefore correct on the
precondition's own logic, but the literal clause is false and is recorded here so no later reader
infers that phases 141–150 ran.

**Consequence to be aware of:** if phases 141–150 are executed *after* this pin and *before* the
sweep, this backup will not contain their commits. The pin would then need re-taking. It does not
need re-taking for work that lands after the sweep begins — that is what criterion 7's byte-identity
proof against the post-sweep tip covers.

---

## Baseline

Assumption **A5** — "`yarn lint:check` currently passes" — is now measured rather than assumed.
It holds. `yarn format:check` does **not**.

| Gate | Verdict | Exit | Wall time | Notes |
|---|---|---|---|---|
| `yarn lint:check` | **green** | `0` | 13 s | 0 errors, **20 warnings**. Re-run with `TURBO_FORCE=1` — see below. |
| `yarn format:check` | **red** | `1` | 9 s | **2 files**. Enumerated under *Pre-existing failures*. |
| `yarn test:unit` | **green** | `0` | 14 s | 1,522 tests / 149 files, 0 failed, 0 skipped. |

Nothing was fixed. This section measures.

### `yarn lint:check` — green, and measured uncached

The first run returned exit 0 in 5 s with `Cached: 11 cached, 11 total >>> FULL TURBO`. A replayed
green is a green in turbo's model — the cache key is an input hash — but a baseline that the whole
phase will be judged against should not rest on a cache entry this file cannot inspect. It was
re-run forced:

```
$ TURBO_FORCE=1 yarn lint:check ; echo $?
 Tasks:    11 successful, 11 total
Cached:    0 cached, 11 total
  Time:    9.899s
0
```

`lint:check` is `turbo run lint && eslint --flag v10_config_lookup_from_file tests && yarn
typecheck:tests`, so the typecheck of `tests/tsconfig.json` is included in that exit 0 — no separate
typecheck invocation is needed, and none was made.

**20 warnings, 0 errors.** Warnings do not fail the gate and are therefore *not* baseline failures,
but they are recorded because D-05's fix bar ("anything a reviewer would block on") may reach some
of them:

| Count | Rule | Where |
|---|---|---|
| 15 | `unused-imports/no-unused-vars` | `packages/dev-seed/src/generators/*.ts` — an unused `ctx` parameter in 14 generators, plus an unused `external_id` in `FeedbackGenerator.ts:56` |
| 2 | `unused-imports/no-unused-vars` | `packages/core/src/controller/controller.ts:73` — `operationId`, `subOperations` |
| 1 | `unused-imports/no-unused-vars` | `apps/frontend/src/lib/contexts/candidate/candidateContext.svelte.test.ts:39` — `question` |
| 1 | `playwright/prefer-to-have-length` | `tests/tests/specs/candidate/candidate-bank-auth-journey.spec.ts:223:94` |
| 1 | `unused eslint-disable directive` | `tests/tests/support/mockOidcIssuerEntry.ts:33:3` — disables `no-console`, which reports nothing |

The 15 dev-seed `ctx` warnings are one shape repeated, not 15 independent findings; the rule allows
`^_`-prefixed args, so the whole class is a rename away from silent.

### `yarn test:unit` — green

```
@openvaa/filters      Test Files   1 passed (1)     Tests   22 passed (22)
@openvaa/supabase     Test Files   1 passed (1)     Tests   16 passed (16)
@openvaa/app-shared   Test Files   3 passed (3)     Tests   21 passed (21)
@openvaa/data         Test Files  47 passed (47)    Tests  244 passed (244)
@openvaa/frontend     Test Files  54 passed (54)    Tests  773 passed (773)
@openvaa/dev-seed     Test Files  43 passed (43)    Tests  446 passed (446)

 Tasks:    21 successful, 21 total
Cached:    14 cached, 21 total
  Time:    13.347s
```

Exit code **0**. Totals: **1,522 tests across 149 files**, zero failed, zero skipped. Seven
workspaces expose a `test:unit` script (the six above plus `@openvaa/docs`, which contributes no
test files). `matching`, `core`, `llm`, `question-info` and `argument-condensation` have **no**
`test:unit` script — their `tests/` directories exist but are not reached by this gate.

---

## Pre-existing failures

Two, both from `yarn format:check`, both cosmetic. **Per PD-03 they are outside D-05's fix bar by
default** — they are pre-existing debt, not findings introduced by the v0.2 body of work, and
repairing them here would add unrelated noise to the diff the stack exists to make reviewable.

**Exception (PD-03 clause 3):** if a slice sweep independently surfaces either one under checklist
item 3 or 4, it is in scope *for that slice* and is dispositioned there, citing this section as the
baseline evidence. Both files fall inside planned slices — `packages/dev-seed/…` in slice 04
(`dev-seed`) and `tests/README.md` in slice 05 (`e2e-tests`) — so this exception is likely to fire
rather than being theoretical.

Each gets a row in `151-DISPOSITION.md` with verdict `**DEFERRED** — pre-existing at baseline`.

### 1. `packages/dev-seed/src/templates/e2e/perm/perm-bankauth-notloc.ts:30–33`

Rule: **Prettier `printWidth`** (no eslint rule id — prettier reports files, not rules). The
declaration is hand-wrapped across four lines; prettier collapses it to one, because the collapsed
form is 111 chars and fits.

```diff
-export const permBankauthNotLocatedTemplate: Template = buildNotLocated2e2cgTemplate(
-  'e2e-bankauth-notloc-',
-  'BA-'
-);
+export const permBankauthNotLocatedTemplate: Template = buildNotLocated2e2cgTemplate('e2e-bankauth-notloc-', 'BA-');
```

### 2. `tests/README.md:182–185`

Rule: **Prettier markdown table alignment**. A later edit added the `bank-auth-journey` row (line
186) with much longer cell content without re-padding the header, separator and two preceding rows,
so columns 3–5 are narrower than the widest cell. Prettier re-pads lines 182–185; line 186 is
already correct and is unchanged.

### Producing commands

```
$ yarn lint:check ; echo $?                    # 0   (and TURBO_FORCE=1 rerun: 0)
$ yarn format:check ; echo $?                  # 1
Checking formatting...
[warn] packages/dev-seed/src/templates/e2e/perm/perm-bankauth-notloc.ts
[warn] tests/README.md
[warn] Code style issues found in 2 files. Run Prettier with --write to fix.

$ yarn test:unit ; echo $?                     # 0
$ npx prettier <file> | diff -u <file> -       # to enumerate the two above
```

---

## Checklist items 3 and 4 — the counts "fixed" will be measured against

### `@ts-expect-error` / `@ts-ignore`

```
$ git grep -o -P '@ts-expect-error' -- apps/ packages/ tests/ | wc -l      # 7   (4 files)
$ git grep -o -P '@ts-ignore'       -- apps/ packages/ tests/ | wc -l      # 0
```

Both reproduce `151-RESEARCH.md`'s figures exactly.

### `any` usage — research's count is inflated, and A6 is resolved

Research's pattern reproduces its own number exactly (**24 files / 96 occurrences**), so the figure
is *reproducible*; it is not *correct*. Two defects:

1. **`as\s+any\b` has no left word boundary**, so it matches the tail of ordinary English —
   "h**as any** active rule" (`packages/filters/src/filter/enumerated/enumeratedFilter.ts:109`),
   "w**as any**", and so on, inside prose comments. The `\b` anchor alone drops **73 → 70**
   occurrences, and removes three files whose *only* matches were prose.
2. **Non-source files are counted**: two `apps/docs/**/+page.md` documentation pages (one of them
   the code-style guide, which discusses `any` by name) and `apps/frontend/tsconfig.tsbuildinfo`.

Corrected pattern and result:

```
$ CORR='(?<![A-Za-z0-9_]):\s*any\b|\bas\s+any\b|<any>'
$ git grep -l -P "$CORR" -- apps/ packages/ tests/ ':(exclude)*.md' ':(exclude)*.tsbuildinfo' | wc -l
14
$ git grep -o -P "$CORR" -- apps/ packages/ tests/ ':(exclude)*.md' ':(exclude)*.tsbuildinfo' | wc -l
77
```

| Measure | Naive (research) | Corrected |
|---|---|---|
| Files | 24 | **14** |
| Occurrences | 96 | **77** |

**Both are recorded.** The naive figure is what `151-RESEARCH.md` says and is kept so the two
records can be reconciled; the corrected figure is what checklist item 4 should be dispositioned
against. This is the same failure mode as C-5 — a pattern without a word boundary silently
over-counting — and is the second time it has appeared in this phase.

### A6 resolved: which of the 14 the lint gate actually reaches

A6 asked whether the `any`-bearing test files are eslint-exempt. They are not *exempt* — they are
**not linted at all**. Every workspace lint script is `eslint … src/`:

```
$ for f in packages/*/package.json apps/*/package.json; do grep -o '"lint": "[^"]*"' "$f"; done
packages/app-shared, argument-condensation, core, data, dev-seed, dev-tools, filters,
llm, matching, question-info, apps/frontend   →   all: eslint … src/
apps/supabase, apps/docs                      →   no lint script at all
```

No workspace lints its own `tests/`. The root `eslint tests` in `lint:check` covers only the
top-level Playwright `tests/` directory. So of the 14 corrected files:

| Lint reach | Count | Files |
|---|---|---|
| **Inside** the gate | 7 | 5 × `apps/frontend/src/…`, `packages/app-shared/src/utils/mergeSettings.ts`, `packages/llm/src/llm-providers/provider.types.ts` |
| **Outside** the gate | 7 | `apps/frontend/vite.config.ts` (outside `src/`), 3 × `packages/dev-seed/tests/`, `packages/llm/tests/llmProvider.test.ts` (57 occurrences — the single largest concentration), 2 × `packages/question-info/tests/` |

And the 7 inside the gate are green lawfully, not accidentally:

- **4 carry an explicit `no-explicit-any` disable** (`popupComponent.type.ts`, `buildRoute.ts`,
  `mergeSettings.ts` ×2, `provider.types.ts`) — i.e. checklist item 4's "document or
  `@ts-expect-error`" clause is already satisfied for these.
- **3 have no disable and still pass** because their matches are `...args: Array<any>` rest
  parameters, which the rule allows via its `ignoreRestArgs: true` option
  (`packages/shared-config/eslint.config.mjs`), or sit in a comment.

Repo-wide, **15 files** carry a `no-explicit-any` disable directive
(`git grep -l -P 'no-explicit-any' -- apps/ packages/ tests/ | wc -l`). That is more than double the
7 `@ts-expect-error` occurrences, and is the real shape of checklist item 4's surface.

**Incidental finding for 151-04:** `apps/frontend/tsconfig.tsbuildinfo` is a **tracked build
artifact** (`git ls-files --error-unmatch` succeeds). Not a checklist item 3 or 4 matter, and not
dispositioned here, but it belongs in the frontend slice's pre-seeded findings.

### Tree untouched

```
$ git status --porcelain -- . ':(exclude).planning'
                                    # empty, after all three gates and every grep
```
