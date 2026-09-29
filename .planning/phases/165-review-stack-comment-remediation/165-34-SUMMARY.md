---
phase: 165-review-stack-comment-remediation
plan: 34
subsystem: comment-hygiene
tags: [hygiene, d-04, comments, code-review-checklist, sweep]

requires:
  - phase: 165-review-stack-comment-remediation
    provides: 165-01 instruments (hygiene gate, read log, code-identity); 165-30 gate change (a vN.M version string in code is a note); every earlier plan's read log
provides:
  - 165-34-HYGIENE-SWEEP.md, the branch-wide hygiene and checklist record
  - A second, independent read of the comment text of all 230 changed files, with 25 findings fixed in five Hygiene: D-04 commits
  - hygiene-reads/165-34.tsv, 39 re-reads after the fixes
  - Allowlist review (2 rows, both kept) and code-review-checklist dispositions
affects: [165-35, 165-36]

actuals:
  tokens: 31242
  tasks: 3
  commits: 9
plan_head_before: 6c20b132a25af9e7ae348a23a6963fc69e7bf8ae
plan_head_after: 4971869689d728bc9d8e68310cfa363336714b5a

tech-stack:
  added: []
  patterns:
    - "The base-mode gate runs in a detached worktree at HEAD, so a maintainer's uncommitted file is never in the measured set"
    - "Second read: a throwaway extractor over the shared comment classifier, plus a vocabulary grep for narrative that layer 3 does not match"
    - "A verdict from an earlier E2E run carries to HEAD when code-identity shows every later non-planning change is comment-only"

key-files:
  created:
    - .planning/phases/165-review-stack-comment-remediation/165-34-HYGIENE-SWEEP.md
    - .planning/phases/165-review-stack-comment-remediation/scripts/hygiene-reads/165-34.tsv
  modified:
    - .planning/phases/165-review-stack-comment-remediation/deferred-items.md
    - apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts
    - apps/frontend/src/lib/api/utils/auth/decryptAndVerifyIdToken.ts
    - apps/frontend/src/lib/api/utils/auth/providers/signicat.ts
    - apps/frontend/svelte.config.js
    - apps/supabase/supabase/functions/identity-callback/index.ts
    - apps/supabase/supabase/functions/identity-callback/claimConfig.ts
    - apps/supabase/supabase/tests/database/05-organization-admin.test.sql
    - apps/supabase/supabase/tests/database/12-user-can.test.sql
    - apps/supabase/supabase/tests/database/17-project-structure-authority.test.sql
    - apps/supabase/supabase/tests/database/22-content-policies.test.sql
    - .env.example
    - packages/app-shared/README.md
    - tests/IDURA-TEST-RUNBOOK.md
    - packages/dev-seed/src/generators/ConstituenciesGenerator.ts
    - packages/dev-seed/src/template/permittedKeys.ts
    - packages/dev-seed/src/templates/e2e/base.ts

key-decisions:
  - "Line-number anchors (`file.ts:NNN`, `migration line NNNN`) in changed files count as hygiene defects under the phase's content-anchor convention. All 48 on the branch were replaced; every sampled anchor already pointed at unrelated code."
  - "The literal base-mode verify command is run in a detached worktree at HEAD, because in the main checkout the maintainer's uncommitted MainContent.svelte is picked up as unread. No read was recorded for that file."
  - "The /tmp/eflow10* scratch paths in the runbook and bank-auth spec comments carry a planning id and were renamed to /tmp/bank-auth-*. EFLOW labels in 16 unchanged test files are logged, not changed."
  - "Pre-existing items in changed files that are not hygiene defects are logged in deferred-items.md rather than fixed in this comment-only plan: the svelte.config.js import order, seven class interpolations, and the per-function entityGrant copies."

patterns-established:
  - "A comment that describes a removed mechanism (backfill, role array, retired helper) is a factual error as well as narrative: fix it against the current code, not just the wording"

requirements-completed: [165-SC3]

duration: 35min
completed: 2026-09-28
status: complete
---

# Phase 165 Plan 34: Branch-wide Hygiene Sweep Summary

**All 230 files the branch changes pass the five-layer hygiene gate with a current read (exit 0). A second, independent read of their comment text found 25 defects the gate cannot see: narrative, stale facts about removed mechanisms, a planning id in scratch paths, and 48 line-number anchors. All are fixed in five code-identity-proven `Hygiene: D-04` commits, and the code-review checklist is dispositioned with evidence.**

## Performance

- **Duration:** about 35 min
- **Started:** 2026-09-28T08:16:36Z
- **Completed:** 2026-09-28T08:52Z
- **Tasks:** 3 of 3
- **Files modified:** 42, including 3 planning records

## Accomplishments

- **Deterministic gate (Task 1).**
  - The changed set is 373 paths, 230 of them in scope.
  - `hygiene-changed-files.sh --base ship/v2.15-12-planning --check-reads` exits 0 in a clean HEAD worktree. It was already clean at plan start, and still exits 0 after every fix.
  - The repo-wide report is recorded as information: the planning-reference total fell from 578 at the phase base to 309 at HEAD. The only report hit inside the changed set is the `jose@v5.9.6` package version.
- **Allowlist review (Task 2).** Both rows in `165-14.tsv` were read in place and kept. Each is a runtime or CI error message that describes a hypothetical change, not code history.
- **Second read (Task 2).**
  - 17,312 lines of extracted comment text were read end to end, grouped by file, with Markdown and `.env.example` files read whole.
  - The generated migration was reconciled against the schema sources: 827 comment lines were already covered by the main read, and the other 41 were read directly.
  - 25 findings were fixed, each listed with its commit in `165-34-HYGIENE-SWEEP.md` §2:
    - historical narrative in frontend auth, adapter and Edge Function comments;
    - four pgTAP comments describing the removed backfill and role-array model;
    - a false claim that `parent` is stripped before the RPC;
    - a reference to the no-longer-existing `constResolve`;
    - a reference to the non-existent `perm-localisation-negative`;
    - the inaccurate `svelte.config.js` bridge rationale (a 165-19 deferred item);
    - 48 stale line-number anchors in dev-seed.
- **Checklist (Task 3).** Every applicable `.agents/code-review-checklist.md` item is met or not applicable, with evidence:
  - schema scans: 102 policies, all with a role target and no bare `auth.*()` call; 24 SECURITY DEFINER functions, all with `search_path = ''`; the one new trigger is named `enforce_feedback_project`;
  - pgTAP boundaries in all 17 changed test files;
  - no `any` added;
  - the context-destructuring audit of all 32 changed components;
  - `yarn lint:check` 0, `yarn format:check` 0 and `yarn test:unit` 0 at HEAD;
  - the 165-33 E2E GREEN 165/0/0/0 verdict, carried to HEAD by code identity (36 code files identical, 3 prose).

## Task Commits

1. **Task 1: branch-wide deterministic gate record** - `460d4a413` (docs)
2. **Task 2: frontend auth and adapter narrative** - `3c7799d2f` (style, `Hygiene: D-04`)
3. **Task 2: Edge Function narrative** - `b33890dc5` (style, `Hygiene: D-04`)
4. **Task 2: pgTAP comments about the removed role-table model** - `cb97d1b62` (style, `Hygiene: D-04`)
5. **Task 2: env template, README and runbook** - `8ed327729` (docs, `Hygiene: D-04`)
6. **Task 2: dev-seed line-number anchors to content anchors** - `ce7a18490` (style, `Hygiene: D-04`)
7. **Task 2: read log (39 rows)** - `281ff81e4` (chore)
8. **Task 2: allowlist review and second-read record** - `f1cd1a6be` (docs)
9. **Task 3: code-review checklist and deferred items** - `497186968` (docs)

**Plan metadata:** the commit that contains this SUMMARY (docs).

## Verification (each exit status read directly)

| Command | Result |
|---|---|
| `hygiene-changed-files.sh --base ship/v2.15-12-planning --check-reads` (HEAD worktree, at start, after the fixes, and after Task 3) | 0, 0, 0: CLEAN, 230 in scope, unread 0 |
| `code-identity.mjs HEAD WORKTREE <files>` per fix commit | 0 each: 8, 4, 4 (also with `--blank-sql-literals`), 2 and 18 compared, 0 changed code |
| `code-identity.mjs 7fc1a849d HEAD <39 files>` (from the 165-33 E2E commit to HEAD) | 0: 36 compared, 0 changed; 3 prose files |
| `yarn lint:check` / `yarn format:check` / `yarn test:unit` | 0 / 0 / 0 |
| `yarn workspace @openvaa/supabase test:unit` / `yarn workspace @openvaa/dev-seed test:unit` | 0 (182) / 0 (797) |
| `bash .planning/.../scripts/tip-proofs.sh` | 0 |
| `node scripts/assert-env-pair-registry.mjs`, `assert-edge-function-env.mjs`, and `assert-env-pairs-agree.mjs .env.example --deno-file …` | 0 / 0 / 0 |
| `ledger-check.sh` | 0 (78 rows; this plan owns none) |
| Task 3 verify: `test -f … && grep -q 'code-review-checklist' …` | 0 |

## Decisions Made

See `key-decisions` in the frontmatter.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] The literal verify command fails in the main checkout on a file the plan may not touch**
- **Found during:** Task 1
- **Issue:** Base mode also scans uncommitted files. The maintainer's uncommitted `apps/frontend/src/lib/layouts/main/MainContent.svelte` therefore appears as `unread`, and the command exits 1. The file may not be staged, edited or read-recorded.
- **Fix:** The verify command runs unchanged in a detached worktree at HEAD, which has no uncommitted files. The same command with `--files` over the 230 committed paths was also run in the main checkout, with the same result.
- **Commit:** none (verification method; recorded in the sweep record §1)

**2. [Rule 1 - Bug] Factual errors found by the second read**
- `ConstituenciesGenerator.ts` said `parent` is stripped before the RPC. `bulkImport` passes it through unchanged, and the RPC's `WHEN 'constituencies'` arm resolves it.
- `negctl-elections-sentinel.ts` named `constResolve`, which no longer exists.
- Four pgTAP headers described a backfill and a role array that `set_test_user` no longer has.
- `perm-localisation-positive.ts` and `testIds.ts` referred to a non-existent negative variant.
- All were fixed as comment-only edits in the commits listed above.

**3. [Scope] Line-number anchors treated as hygiene defects**
- **Issue:** The five gate layers do not detect `file.ts:NNN` anchors. The phase's convention 5 and the 165-05/165-21 deferred items treat them as defects, and every one sampled was already stale.
- **Fix:** All 48 in changed files were replaced (`ce7a18490`). The one remaining match of the pattern is the `:5173` port in the runbook, which is not an anchor.

**4. [Scope] `hygiene-allow/165-34.tsv` was not created.** No allowlist row was needed.

---

**Total deviations:** 4 (1 blocking, 1 bug class, 2 scope).
**Impact on plan:** None on scope. Deviation 1 lets the literal verify command measure the committed state. Deviations 2 and 3 are what the second read exists to find.

## Issues Encountered

- `apps/frontend/svelte.config.js` fails `simple-import-sort/imports` when eslint is run on it directly. The failure is identical at the phase base, and the file is outside the frontend lint script's `src/` scope, so `yarn lint:check` exits 0. It is logged in `deferred-items.md` rather than fixed in a comment-only plan.

## Deferred items

`deferred-items.md` § "From 165-34":

- **Resolved:** the 165-19 `svelte.config.js` comment.
- **Stays deferred, outside the changed set:** every other open entry. Each is listed by file with a one-line reason.
- **Newly logged:**
  - the `svelte.config.js` import order;
  - seven pre-existing class interpolations;
  - the duplicate per-function `entityGrant` copies;
  - planning residue in `00-helpers.test.sql`, `supabaseAdminClient.ts`, 16 files carrying `EFLOW-*` labels, and two `scripts/assert-env-*` summary lines. All of these are outside the changed set.

## Known Stubs

None.

## Next Phase Readiness

- The gate plans (165-35/36) inherit a changed set that is CLEAN under all five layers with full read coverage, plus a sweep record they can cite.
- The full E2E run, pgTAP and `db:lint:sql` remain the gate plans' own checks. This plan changed comments only, and that is proven by code identity.

## Self-Check: PASSED

- Files: `165-34-HYGIENE-SWEEP.md`, `hygiene-reads/165-34.tsv` (39 rows) and `deferred-items.md` all exist.
- Commits: `460d4a413`, `3c7799d2f`, `b33890dc5`, `cb97d1b62`, `8ed327729`, `ce7a18490`, `281ff81e4`, `f1cd1a6be` and `497186968` are all in `git log`. The five fix commits each carry `Hygiene: D-04`.
- `git rev-list --count 6c20b132a..497186968` = 9, and no commit deletes a file.

---
*Phase: 165-review-stack-comment-remediation*
*Completed: 2026-09-28*
