---
phase: 153-build-tooling-config-correctness
plan: 05
subsystem: infra
tags: [lint-staged, husky, pre-commit, prettier, eslint, glob, tinyexec, turbo, negative-control]

requires:
  - phase: 152-comment-naming-hygiene-sweep
    provides: the comment-hygiene guard baseline (1579 files / 0 violations) this plan had to leave intact
  - phase: 141-package-unit-test-coverage-test-unit-invariant-guard
    provides: 141-NEGATIVE-CONTROL.md, the evidence-ledger form this plan's Row-2 fragment follows
provides:
  - "`.lintstagedrc.json` with zero shell-wrapper invocations — both `bash -c 'turbo …'` entries deleted, both file-consuming tasks intact"
  - "`.lintstagedrc.json`'s first glob split from the fused `mjssvelte` token into `mjs,svelte`, so `.mjs` and `.svelte` are matched by the pre-commit hook for the first time"
  - "`.prettierignore` entry `.claude/`, closing the exit-2 `No parser could be inferred` hazard the glob fix uncovers on 45 skill fixtures"
  - "153-NC-ROW-2-CFG-08.md — the Row-2 BLINDNESS/CATCH pair (0 files → 2 files) plus the Row-2b coverage-preservation argument"
  - "153-CHURN-MEASUREMENT.md — the executed churn measurement, which falsifies the inherited zero on the eslint axis"
affects: [153-09 negative-control assembly, future-build-tooling, phase-152 comment sweep]

actuals:
  tokens: 9599
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "Evidence captured by running a tool's real binary in a throwaway `git init` repo under the scratchpad, never against the live index — mandatory where the tool stashes and restores the index (lint-staged)"
    - "Ignore-membership asserted with `prettier --file-info` / `prettier.getFileInfo`, not with a `--check` exit code, because `--check` over an ignored path is indistinguishable from a genuine pass"

key-files:
  created:
    - .planning/phases/153-build-tooling-config-correctness/153-NC-ROW-2-CFG-08.md
    - .planning/phases/153-build-tooling-config-correctness/153-CHURN-MEASUREMENT.md
    - .planning/todos/pending/2026-08-29-153-pre-commit-eslint-red-on-mjs-and-apps-docs.md
    - .planning/todos/pending/2026-08-29-153-stale-mjssvelte-comment-in-unit-test-coverage-guard.md
  modified:
    - .lintstagedrc.json
    - .prettierignore

key-decisions:
  - "OQ-5 resolved as planned, option (a): DELETE both `bash -c` entries rather than convert the config to `.mjs`. `.husky/pre-commit:1` already runs the identical turbo build, so the entries were redundant re-invocations; option (c), the bare-string replacement, was re-measured this session and breaks the hook."
  - "No churn commit created — but NOT because the number is zero. Prettier churn is genuinely 0 (flip-tested); eslint churn is 27 files rewritten with 366 problems surviving `--fix`, and no commit permitted by this plan could close it. Reported and filed instead of engineered around."
  - "REVIEW-CFG-08 deliberately left UNMARKED in REQUIREMENTS.md. Its glob half is proven both directions, but its stated acceptance also requires the gate to 'start from clean', and it demonstrably does not."

patterns-established:
  - "Flip-test a zero before believing it: `prettier --list-different` was driven 0 → 2 → 0 by injecting and reverting two real mis-formattings, so the zero is a measurement rather than an absence"
  - "Measure BOTH commands in a lint-staged task array. This plan's inherited 'zero churn' was correct for the array's first entry and wrong for its second"

requirements-completed: [REVIEW-CFG-04]

coverage:
  - id: D1
    description: "`.lintstagedrc.json` invokes every command directly — zero shell-wrapper invocations remain, and no file-consuming task was removed"
    requirement: REVIEW-CFG-04
    verification:
      - kind: other
        ref: "grep -c 'bash' .lintstagedrc.json → 0; node JSON assertion (2 glob keys, `prettier --write` + `eslint --fix` on glob 1, `prettier --write` on glob 2)"
        status: pass
      - kind: other
        ref: "yarn turbo run build --filter=@openvaa/app-shared... apps/frontend/src/app.html README.md → exit 1, 'Could not find task README.md in project' (re-measured rejection of the naive replacement)"
        status: pass
    human_judgment: false
  - id: D2
    description: "The fused `mjssvelte` glob token is split, so staged `.svelte` and `.mjs` files are matched by the pre-commit hook — proven 0 files → 2 files against the real lint-staged binary"
    requirement: REVIEW-CFG-08
    verification:
      - kind: other
        ref: "node node_modules/lint-staged/bin/lint-staged.js --verbose in a throwaway repo: BLINDNESS '— 0 files' + '[SKIPPED] … no files'; CATCH '— 2 files' naming Bad.svelte and bad.mjs. Captured verbatim in 153-NC-ROW-2-CFG-08.md"
        status: pass
    human_judgment: false
  - id: D3
    description: "The prettier hard-error the glob fix uncovers on 45 `.claude/skills/**` fixtures is closed in the same commit by a `.claude/` entry in `.prettierignore`"
    requirement: REVIEW-CFG-08
    verification:
      - kind: other
        ref: "lint-staged with the real `prettier --write` task over a `.claude/`-prefixed fixture: exit 1 + 'No parser could be inferred' without the entry, exit 0 with it; `prettier --file-info` ignored:false → ignored:true"
        status: pass
    human_judgment: false
  - id: D4
    description: "The newly-covered formatting churn is a measured number on the record, not an assumed backlog"
    verification:
      - kind: other
        ref: "prettier --list-different over all 281 tracked .svelte + .mjs → 0, flip-tested 0→2→0; eslint --fix-dry-run -f json per set → 27 files rewritten, 366 problems remaining. 153-CHURN-MEASUREMENT.md"
        status: pass
    human_judgment: false
  - id: D5
    description: "Operator ruling needed on whether REVIEW-CFG-08 is satisfied given that the pre-commit gate does not 'start from clean' — the eslint half is red on 37 of 44 .mjs and aborts on apps/docs, pre-existing but widened by this fix"
    requirement: REVIEW-CFG-08
    verification: []
    human_judgment: true
    rationale: "The requirement's own acceptance text demands the gate start from clean. Closing that needs semantic code changes across files owned by no plan, an eslint scoping decision, and an upstream Node/eslint bug investigation — all outside this plan's mandate and forbidden by its prohibition list. Whether to accept, defer, or re-scope is the operator's call, not the executor's."

duration: 35min
completed: 2026-08-29
status: complete
---

# Phase 153 Plan 05: lint-staged direct invocation + fused-glob fix Summary

**`.lintstagedrc.json` now invokes `prettier` and `eslint` with no shell wrapper and its first glob matches `.mjs` and `.svelte` for the first time — proven `0 files → 2 files` against the real lint-staged binary — with the prettier hard-error the fix uncovers closed in the same commit; the inherited "zero churn" figure survives on the prettier axis and is falsified on the eslint axis.**

## Performance

- **Duration:** ~35 min
- **Started:** 2026-08-29T12:42Z (approx — first measurement command)
- **Completed:** 2026-08-29T13:17Z
- **Tasks:** 3 of 3
- **Files modified:** 6 (2 config, 2 evidence docs, 2 todos)

## Accomplishments

- **REVIEW-CFG-04 satisfied and marked complete.** Both `bash -c 'turbo run build --filter=@openvaa/app-shared...'` entries deleted; `grep -c 'bash' .lintstagedrc.json` is `0`. Deletion rather than replacement, because `.husky/pre-commit:1` already runs that exact build before invoking lint-staged. Every file-consuming task survives.
- **REVIEW-CFG-08's glob defect fixed and proven both directions.** `mjssvelte` → `mjs,svelte`; the same staged `Bad.svelte` + `bad.mjs` pair goes from `— 0 files` / `[SKIPPED]` to `— 2 files` with both paths in the task's argv. Every capture taken via this repo's lint-staged binary in a throwaway repo — never against this worktree's index.
- **The DoS the fix uncovers closed in the same commit.** 45 `.claude/skills/**` `.svelte` fixtures made `prettier` exit 2 on an explicit path; `.claude/` added to `.prettierignore`, executed both ways rather than argued.
- **The churn re-measured, and the inherited zero falsified on one axis.** Prettier: 0 of 281, flip-tested. ESLint: 27 files rewritten by `--fix`, **366 problems surviving**, and `apps/docs` aborts eslint outright. Filed, not fixed.
- **Attribution established.** The eslint redness is **pre-existing** — the old glob already matched files leaving residuals in `tests/`, `.planning/`, `.claude/`, `scripts/`, and `apps/docs` already aborted on its `.ts`. The fix enlarges the population; it does not create the defect.

## Task Commits

1. **Task 1: BEFORE control, both config fixes, prettier hazard closed** — `9973a2f69` (fix)
2. **Task 2: AFTER control, fixture hazard check, Row-2 evidence fragment** — `d8f988704` (docs)
3. **Task 3: churn measurement + two registered findings** — `517cc3356` (docs)

No churn commit exists, by decision. See *Deviations*.

## Files Created/Modified

- `.lintstagedrc.json` — two wrapper entries deleted; first glob's fused token split. 8 lines → 7.
- `.prettierignore` — one line added, `.claude/`, at line 1 alongside `.github` / `.husky`.
- `153-NC-ROW-2-CFG-08.md` — Row 2 BLINDNESS + CATCH, the hazard's two halves, Row 2b for CFG-04, `## Ledger status`.
- `153-CHURN-MEASUREMENT.md` — per-set counts, the verdict, the attribution table, and why no commit was created.
- Two `.planning/todos/pending/2026-08-29-153-*.md` filings.

## Decisions Made

- **OQ-5 → option (a), as planned.** Delete both wrapper entries. Re-measured the rejected option (c) independently rather than inheriting research's capture: `yarn turbo run build --filter=@openvaa/app-shared... apps/frontend/src/app.html README.md` → exit 1, *"Could not find task `README.md` in project"*.
- **`.claude/` written with a trailing slash**, unlike its `.github` / `.husky` neighbours but consistent with the file's other directory entries (`.planning/`, `scripts/fixtures/`, `tests/e2e-runs/`) and with the plan's `grep -qx '.claude/'` criterion.
- **No churn commit.** Justified at length in `153-CHURN-MEASUREMENT.md` § *Why no commit*.
- **REVIEW-CFG-08 not marked complete.** See *Issues Encountered*.
- **E2E declined, on this plan's own diff.** The complete non-`.planning` diff is `.lintstagedrc.json` and `.prettierignore`. Neither is read at runtime, at build time, by Vite, by SvelteKit, or by Playwright; `.lintstagedrc.json` is read only by the `lint-staged` binary and `.prettierignore` only by `prettier`. There is no path by which either can change application behaviour. Regression cover taken instead: `yarn build` (via `lint:check`'s turbo chain, 11/11 + 22/22 cached), `yarn lint:check` exit 0, `yarn test:unit` 25/25, `yarn format:check` exit 0.

## Deviations from Plan

### 1. [Rule 3 — blocking] The plan's Task 1 acceptance criteria contradict its own action and its own CFG-04 criterion

- **Found during:** Task 1.
- **Issue:** The action says to delete *"the first element of the `:2` glob's array **and the first element of the `:7` glob's array**"*, and a sibling criterion demands `grep -c 'bash' .lintstagedrc.json` → `0`. But another criterion states *"the second glob key `*.{css,json,md}` **and its array** are byte-identical to before"* — impossible if that array's first element is deleted.
- **Resolution:** Followed the action and the `grep → 0` criterion, which are what REVIEW-CFG-04 actually requires ("zero shell-wrapper invocations"). The second glob's **key** is byte-identical (`"*.{css,json,md}"`, verified by JSON string comparison against the pre-edit file); its array went from 2 entries to 1, losing only the redundant build. Reported rather than engineered around.
- **Verification:** `node` JSON comparison of pre- and post-edit configs, in Task 1's transcript.

### 2. [Rule 4 — reported, not fixed] The inherited "zero churn" is false on the eslint axis

- **Found during:** Task 3.
- **Issue:** `153-RESEARCH.md § D.6` measured churn as zero and the plan budgeted for zero. That measurement covered only `prettier` — the first of **two** commands in the glob's task array. Measured now: `eslint --fix --flag v10_config_lookup_from_file` would rewrite **27 of 44** tracked `.mjs` files and leave **366 problems** (`no-console` 297, `func-style` 36, `no-control-regex` 26, `unused-imports/no-unused-vars` 7), and aborts with `ERR_INTERNAL_ASSERTION` on `apps/docs`.
- **Why not fixed:** every available route is barred by this plan's own constraints — 20 of the 27 rewrites are under `.claude/`/`.planning/` (forbidden), the 49 in-bounds residuals are semantic not formatting (forbidden in a churn commit, T-153-19), and weakening eslint config is in the prohibition list. `scripts/` is also a live collision surface for 153-01 and 153-10 this wave.
- **Disposition:** filed as `2026-08-29-153-pre-commit-eslint-red-on-mjs-and-apps-docs.md` with the disposition options and the pre-existence proof.

### 3. [Registered, not fixed] `scripts/assert-unit-test-coverage.mjs`'s header comment is falsified by this plan's own commit

- **Found during:** Task 3, via `git grep` for consumers of `.lintstagedrc.json`.
- **Issue:** the file documents itself as *"linted by nothing (… `.lintstagedrc.json`'s first glob carries an unseparated `mjssvelte` token so `.mjs` matches no lint-staged pattern)"*. Both halves are now false, and the file is in fact red under eslint.
- **Disposition:** filed as `2026-08-29-153-stale-mjssvelte-comment-in-unit-test-coverage-guard.md` rather than edited — outside the plan's four declared paths and in a directory two sibling plans are writing to this wave.

### 4. [Corrections to inherited figures]

| Figure | Inherited | Measured 2026-08-29 |
|---|---|---|
| `.svelte` under `.planning/**` | 3 (RESEARCH § D.6) | **5** |
| Total tracked `.svelte` | 234 (RESEARCH § D.6) | **237** (§ D.6 omits `scripts/fixtures/`, 1 file) |
| Total tracked `.mjs` | 34 (RESEARCH § D.6) | **44** |
| "the repo's largest file type" (`REQUIREMENTS.md:102`, of `.svelte`) | largest | **fourth** — md 2674, ts 1310, json 816, svelte 237. It is the largest *previously-uncovered* extension, which is what the requirement actually rests on. |
| `apps/docs` `.svelte` "prettier ✅" (RESEARCH § D.6) | clean | **never checked** — `.prettierignore:35`'s bare `docs` ignores `apps/docs` wholesale; the ✅ was a `--check` over an empty match set. (It would be clean anyway, verified with `--ignore-path` bypassed — but the evidence offered did not show that.) |

Figures that **held**: `apps/frontend` `.svelte` = 170, `apps/docs` `.svelte` = 16, `.claude/skills` `.svelte` = 45, and every citation this plan was given for `.lintstagedrc.json` (8 lines, globs at `:2` and `:7`, `:6` the closing bracket), `.husky/pre-commit` (3 lines, build at `:1`), `getSpawnedTask.js:102`, and `REQUIREMENTS.md:9-12`. Unlike plan 04's experience, this plan's own citations were all accurate.

---

**Total deviations:** 1 blocking contradiction resolved, 1 falsified premise reported, 1 out-of-scope finding registered, 5 inherited figures corrected.
**Impact on plan:** No scope creep — the non-`.planning` diff is 2 files, 6 lines. The plan's central deliverables are all met; its one unmet clause is CFG-08's "starts from clean", surfaced rather than papered over.

## Issues Encountered

**REVIEW-CFG-08 was NOT marked complete, deliberately.** Its acceptance text has two parts. Part one — *"Proven by staging a deliberately mis-formatted `.svelte` file, observing the hook pass on the current glob and reject it after"* — is fully discharged, verbatim, in `153-NC-ROW-2-CFG-08.md`. Part two — *"the one-off formatting churn this uncovers lands as its own commit **so the gate starts from clean**"* — is not. The gate does not start from clean: `eslint --fix` is red on 37 of 44 `.mjs` files and aborts on all 18 `apps/docs` files it can be handed. Marking it complete would be exactly the "however green the suite looks" failure the milestone's standing acceptance rule exists to prevent. **`REVIEW-CFG-04` was marked complete; `REVIEW-CFG-08` remains `Pending` and needs an operator ruling** — accept as scoped-to-the-glob, defer the clean-gate clause to the filed todo, or re-scope.

**The plan's Task 3 verify command contains a scan that can lie.** Its final clause,
`git status --porcelain -- 'apps/**/*.svelte' '**/*.mjs' | grep -q . && echo "CHURN PRESENT" || echo "CHURN ZERO"`, reports `CHURN ZERO` from an *unmodified working tree* — which is the state whether the churn is genuinely zero or the executor simply never ran `--write`. It was run and reports `CHURN ZERO`, but the claim in this SUMMARY rests on the flip-tested `prettier --list-different` measurement, not on that clause.

## Gates

| Gate | Baseline | This plan |
|---|---|---|
| `yarn format:check` | clean | **exit 0** |
| `yarn lint:check` | 22/22, 10 chain links, every guard 0 | **exit 0** — 22/22 turbo, comment-hygiene 1579 files / 0, edge-env-defaults 17 / 0, declared-binaries 16 workspaces / 0, assert-node-engine OK. Chain re-counted at **10** links. |
| `yarn test:unit` | 25/25 | **25/25, exit 0** |
| `yarn build` | 14/14 | not run standalone; 11/11 + 22/22 turbo tasks succeeded inside the two gates above |
| `yarn test:e2e` | 150/150 | **declined** — see *Decisions Made* for the diff-based argument |
| `yarn db:lint:sql` | pre-existing RED, not scoreable | not run |

## User Setup Required

None.

## Next Phase Readiness

- `153-09` can consume `153-NC-ROW-2-CFG-08.md` as the Row-2 fragment as-is; it carries its own `## Environment` block, both halves, and a `## Ledger status` table.
- **Blocker for phase close:** REVIEW-CFG-08's `Pending` row needs an operator ruling. It is the only requirement this plan touched that is not marked.
- **Warning for any plan that edits `apps/docs/**` or `scripts/**/*.mjs` on this branch:** the pre-commit hook is red for those paths. It does not fire in *this* worktree (`core.hooksPath=/dev/null`), so the effect is invisible here and will surface for contributors in the main checkout.

---
*Phase: 153-build-tooling-config-correctness*
*Completed: 2026-08-29*

## Self-Check: PASSED

All 7 claimed files exist on disk; all 3 claimed commit hashes resolve in `git log`. Verified
2026-08-29 after writing this document.
