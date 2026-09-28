---
phase: 165-review-stack-comment-remediation
plan: 29
subsystem: frontend
tags: [password-validation, app-shared, candidate-app, docs, logout, e2e]

requires:
  - phase: 165-review-stack-comment-remediation
    provides: "165-01 instruments (assert-absent.sh, hygiene-changed-files.sh, record-hygiene-read.sh, e2e-verdict.mjs, tip-proofs.sh); 165-28's green tip"
provides:
  - "apps/frontend/src/lib/utils/password-validation/passwordValidation.ts (+ colocated test): minPasswordLength, ValidationDetail, PasswordValidation, validatePassword, validatePasswordDetails"
  - "@openvaa/app-shared without password validation"
  - "A password-validation docs page that describes the frontend check and Supabase Auth's server-side policy"
  - "A candidate LogoutButton that navigates to the login page once"
affects: [165-35, 165-36]

actuals:
  tokens: 8200
  tasks: 3
  commits: 6
plan_head_before: 60b0966c9a4e3367cb92ea117b014c7b2083be17
plan_head_after: 7af66057ceea21178ce79b83433815c701cf6511

tech-stack:
  added: []
  patterns:
    - "A frontend-only utility lives under apps/frontend/src/lib/utils/<kebab-dir>/ beside its colocated test, imported as $lib/utils/<kebab-dir>/<module>"

key-files:
  created:
    - apps/frontend/src/lib/utils/password-validation/passwordValidation.ts
    - apps/frontend/src/lib/utils/password-validation/passwordValidation.test.ts
    - .planning/phases/165-review-stack-comment-remediation/scripts/hygiene-reads/165-29.tsv
  modified:
    - packages/app-shared/src/index.ts
    - packages/app-shared/README.md
    - apps/frontend/src/lib/candidate/components/passwordValidator/PasswordValidator.svelte
    - apps/frontend/src/lib/candidate/components/logoutButton/LogoutButton.svelte
    - apps/frontend/src/lib/candidate/components/logoutButton/LogoutButton.type.ts
    - "apps/docs/src/routes/(content)/developers-guide/candidate-user-management/password-validation/+page.md"
    - "apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/candidate/components/passwordValidator/PasswordValidator/+page.md"
    - "apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/candidate/components/logoutButton/LogoutButton/+page.md"
    - .planning/phases/165-review-stack-comment-remediation/165-LEDGER.md
  deleted:
    - apps/frontend/tests/password-validation.spec.ts

key-decisions:
  - "C-4106561819 verdict: frontend-only. The tip importer census found PasswordValidator.svelte as the only runtime consumer, so the module moved to apps/frontend/src/lib/utils/password-validation/ as a git rename and the app-shared barrel line was removed"
  - "apps/frontend/tests/password-validation.spec.ts was folded into the colocated test: no case was an exact duplicate; its short-password message assertion was merged into the existing too-short test, the other eight cases were added"
  - "The docs page states that the frontend check is advisory and that Supabase Auth enforces its own policy (minimum_password_length and password_requirements in config.toml, or the hosted project's Auth settings)"
  - "The candidate LogoutButton no longer navigates after logout(): the context's logout() already redirects to the login page, and the second navigation's focus reset dropped text typed into the login form (the root cause of an intermittent candidate-journey step 9 failure)"

patterns-established:
  - "When an E2E fill is lost with the field left empty, look for a later navigation whose focus reset lands between Playwright's focus and its insertText"

requirements-completed: [165-SC2, 165-SC3, 165-SC4, C-4106561819]

coverage:
  - id: D1
    description: "Password validation lives in the frontend with its colocated test; app-shared neither contains nor exports it; every importer uses the new path"
    requirement: "C-4106561819"
    verification:
      - kind: unit
        ref: "yarn build --filter=@openvaa/app-shared && yarn workspace @openvaa/frontend test:unit passwordValidation (exit 0, 16/16)"
        status: pass
      - kind: other
        ref: "assert-absent.sh '(validatePassword|validatePasswordDetails|minPasswordLength)' -- packages apps/supabase (exit 0, absent)"
        status: pass
      - kind: other
        ref: "yarn workspace @openvaa/frontend check (exit 0, 0 errors, 0 warnings); yarn workspace @openvaa/app-shared test:unit (exit 0, 92/92)"
        status: pass
    human_judgment: false
  - id: D2
    description: "The docs page links the moved module and describes the current flow without the Strapi backend claim"
    requirement: "C-4106561819"
    verification:
      - kind: other
        ref: "assert-absent.sh 'packages/app-shared/utils/passwordValidation|vaa-strapi|Strapi' -- <password-validation page> (exit 0); git ls-files --error-unmatch on all 8 linked paths (exit 0); yarn workspace @openvaa/docs build (exit 0)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Build, lint, unit tests and the full E2E suite pass after the move and the logout fix"
    requirement: "165-SC4"
    verification:
      - kind: other
        ref: "TURBO_FORCE=true yarn build (exit 0, 14/14); TURBO_FORCE=true yarn lint:check (exit 0); yarn workspace @openvaa/frontend test:unit (exit 0, 1881/1881)"
        status: pass
      - kind: e2e
        ref: "tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/165-29-run02 --no-db-reset; e2e-verdict.mjs (VERDICT: GREEN, 165 expected, 0 failed, 0 flaky, 0 did-not-run)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Every changed file is hygiene-clean with current read records"
    requirement: "165-SC2"
    verification:
      - kind: other
        ref: "hygiene-changed-files.sh --check-reads --files <182 committed paths since ship/v2.15-12-planning> (VERDICT: CLEAN, 0 unread)"
        status: pass
    human_judgment: false

duration: 34min
completed: 2026-09-28
status: complete
---

# Phase 165 Plan 29: Password Validation Moved to the Frontend Summary

**`passwordValidation.ts` and its test now live in `apps/frontend/src/lib/utils/password-validation/` beside `PasswordValidator.svelte`, their only consumer; `@openvaa/app-shared` no longer exports them, and the docs page describes the frontend check and Supabase Auth's server-side policy. A redundant second login navigation in the candidate `LogoutButton`, which broke the full E2E run, is gone.**

## Performance

- **Duration:** 34 min
- **Started:** 2026-09-28T01:18Z
- **Completed:** 2026-09-28T01:52Z
- **Tasks:** 3
- **Files modified:** 13 (2 moved, 1 deleted, 10 modified), plus the ledger and the read record

## Gate results

| Gate | Exit | Result |
|---|---|---|
| `yarn build --filter=@openvaa/app-shared && yarn workspace @openvaa/frontend test:unit passwordValidation` | 0 | 1 file, 16/16 |
| `assert-absent.sh '(validatePassword\|validatePasswordDetails\|minPasswordLength)' -- packages apps/supabase` | 0 | `absent` |
| `yarn workspace @openvaa/frontend check` | 0 | 2193 files, 0 errors, 0 warnings |
| `yarn workspace @openvaa/app-shared test:unit` | 0 | 9 files, 92/92 |
| `grep -rn passwordValidation packages/app-shared/dist` after the rebuild | 1 | nothing printed (`dist/` is untracked) |
| `assert-absent.sh 'packages/app-shared/utils/passwordValidation\|vaa-strapi\|Strapi' -- <docs page>` | 0 | `absent` |
| `yarn workspace @openvaa/docs build` | 0 | site written |
| `TURBO_FORCE=true yarn build` | 0 | 14/14 tasks |
| `TURBO_FORCE=true yarn lint:check` | 0 | 0 errors; pre-existing warnings only (dev-seed 15, frontend `candidateContext.svelte.test.ts` 1, tests 2) |
| `yarn workspace @openvaa/frontend test:unit` | 0 | 108 files, 1881/1881 |
| `bash scripts/tip-proofs.sh` | 0 | all PASS |
| `hygiene-changed-files.sh --check-reads --files <182 committed paths>` | 0 | `VERDICT: CLEAN` |
| `ledger-check.sh` | 0 | `VERDICT: PASSED` |
| `e2e-verdict.mjs tests/e2e-runs/165-29-run02` | 0 | `VERDICT: GREEN (expected 165 >= 165, 0 failed, 0 flaky, 0 did-not-run)` |

The plan's literal `hygiene-changed-files.sh --base ship/v2.15-12-planning --check-reads` exits 1 on exactly one item: `apps/frontend/src/lib/layouts/main/MainContent.svelte` has no read row. That file is the maintainer's uncommitted edit, which is never read-recorded, staged or edited. The committed-scope run above is the gate, as the phase's executor notes prescribe.

`git log --follow --oneline -- apps/frontend/src/lib/utils/password-validation/passwordValidation.ts` lists `d9ff2341a`, then `6fe18ddfd`, `c95b55a21`, `b061aa8e3` and older, so the move is a rename that keeps the module's history.

## Importer census (verdict: frontend-only)

`git grep -n -E "validatePassword|validatePasswordDetails|minPasswordLength|passwordValidation" -- ':!.planning' ':!**/messages/**' ':!**/translations/**'` at the plan's base found:

- `PasswordValidator.svelte`: the only runtime import (`minPasswordLength`, `validatePasswordDetails`, `ValidationDetail`).
- `apps/frontend/tests/password-validation.spec.ts`: a unit test importing from `@openvaa/app-shared`.
- The module, its test and the barrel line in `packages/app-shared`.
- `packages/app-shared/README.md`, the docs page and the generated PasswordValidator docs page.
- Comments in `PasswordSetter.svelte.test.ts` and `PasswordValidator.svelte.test.ts`, and the `candidateApp.register.passwordValidation.*` translation keys. These name the file or key strings, not the export.

No Edge Function, dev-seed module or backend code imported it.

## Merged test cases

`apps/frontend/tests/password-validation.spec.ts` (9 cases) was folded into `passwordValidation.test.ts` (8 cases), giving 16 cases:

- **Added as a new `describe('validatePassword')` block (7):** shorter than the minimum length, no uppercase, no lowercase, no numbers, no symbols, contains the username, and a valid password.
- **Merged into an existing test (1):** the spec's `validatePasswordDetails('short')` case duplicated the existing too-short test except for its `details.length.message` assertion, which now sits in that test.
- **Added to `describe('validatePasswordDetails')` (1):** `'aaaaaaBBB123!'` stays valid while `details.repetition` fails, because the repetition rule is not enforced.
- **Exact duplicates dropped:** none.

## Accomplishments

- The module and its test moved to `apps/frontend/src/lib/utils/password-validation/` as git renames, and the barrel line left `packages/app-shared/src/index.ts`. `PasswordValidator.svelte` imports from `$lib/utils/password-validation/passwordValidation`, and its docstring and generated docs page name that path. The app-shared README no longer lists password validation.
- The docs page lists the three current password pages, `PasswordSetter` and `PasswordValidator`, what `validatePassword`, `validatePasswordDetails` and `minPasswordLength` provide, and the flow from debounced validation to `supabase.auth.updateUser({ password })` through the candidate context's `register`, `resetPassword` and `setPassword`. It says Supabase Auth enforces its own policy. The Strapi note, the Strapi links, the false backend-reuse claim and the stale translation keys in the examples are gone.
- The moved module's reflow-damaged JSDoc tags (`@param {string} - password -`, `@param {(char: - string) => boolean}`) are now plain TSDoc.
- `LogoutButton.svelte` navigates to the login page once (see Deviations).

## Task Commits

1. **Task 1 (tracer): move the module and its test, re-point the consumer, drop the barrel export**: `d9ff2341a` (refactor). Tracer gate: automated verify re-run after the commit, 16/16, then expanded.
2. **Task 2: docs page**: `401041d32` (docs)
3. **Task 3: hygiene closure, build, lint, full E2E**: `8e634223c` (style, `Hygiene: D-04`), `568bce827` (chore, read record), `b0c2b7d65` (fix, deviation 1), `7af66057c` (style, `Hygiene: D-04`, read record)

Commits for C-4106561819 carry `Review-Comment: C-4106561819`. The logout fix `b0c2b7d65` and its hygiene follow-up `7af66057c` do not, because they answer no review comment and must not be linked from that ledger row. Every commit stages explicit paths only.

## Review-comment dispositions

| Comment | Disposition | Commits | Evidence | Draft reply |
|---|---|---|---|---|
| C-4106561819 (#880 `PasswordValidator.svelte:105`, kaljarv) | fix | `d9ff2341a`, `401041d32`, `8e634223c` | Importer census above (verdict: frontend-only); `assert-absent.sh` over `packages apps/supabase` exit 0; `git log --follow` keeps the history; colocated test 16/16; app-shared 92/92; frontend check clean; build and lint exit 0; E2E `165-29-run02` GREEN 165/0/0/0 | Fixed in d9ff2341a: password validation was used only by `PasswordValidator.svelte`, so it now lives in `apps/frontend/src/lib/utils/password-validation/passwordValidation.ts` with its colocated test, and `@openvaa/app-shared` no longer exports it; 401041d32 rewrites the docs page to the current flow, where Supabase Auth enforces its own server-side password policy. |

The same row is filled in `165-LEDGER.md`.

## Docs links checked

All eight paths the page links pass `git ls-files --error-unmatch`:

- `apps/frontend/src/routes/candidate/register/password/+page.svelte`
- `apps/frontend/src/routes/candidate/password-reset/+page.svelte`
- `apps/frontend/src/routes/candidate/(protected)/settings/+page.svelte`
- `apps/frontend/src/lib/candidate/components/passwordSetter/PasswordSetter.svelte`
- `apps/frontend/src/lib/candidate/components/passwordValidator/PasswordValidator.svelte`
- `apps/frontend/src/lib/utils/password-validation/passwordValidation.ts`
- `apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts`
- `apps/supabase/supabase/config.toml`

## E2E verdict

`VERDICT: GREEN (expected 165 >= 165, 0 failed, 0 flaky, 0 did-not-run)` for `tests/e2e-runs/165-29-run02`.

The first full run, `tests/e2e-runs/165-29`, failed with 77 passed, 1 failed and 87 did not run. The failure was candidate-journey step 9: `login-submit` stayed disabled because the password field was empty. The trace is kept in `tests/e2e-runs/165-29/failed-artifacts/`. `tests/e2e-runs/165-29-cj-r1` is a candidate-journey-only diagnostic run (5/5 passed), not a gate run.

## Decisions Made

See `key-decisions` in the frontmatter.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The candidate LogoutButton navigated to the login page twice**
- **Found during:** Task 3 (first full E2E run)
- **Issue:** In the logout modal, `handleLogout` awaited the candidate context's `logout()`, which already runs `goto(login, { invalidateAll: true })`, and then ran the same `goto` again. The trace shows two `candidate/login/__data.json?x-sveltekit-invalidated=111` loads about 43 ms apart. The login page was already interactive after the first navigation. When the second one completed, its focus reset moved focus while Playwright was filling the password field. Playwright's fill focuses the input and then inserts the text, so the text went to the body. The DOM snapshots show the email value landing and the password input staying `''`. A real user typing in that window loses keystrokes the same way. The failure is intermittent: it did not reproduce in the candidate-journey-only run.
- **Fix:** Removed the second navigation. Removed the `stayOnPage` prop with it: no caller passed the prop, and it could not keep anyone on the page because `logout()` always redirects. Its docstring line, type and generated docs line went too.
- **Files modified:** `LogoutButton.svelte`, `LogoutButton.type.ts`, `generated/.../LogoutButton/+page.md`
- **Verification:** frontend check clean; full E2E `165-29-run02` GREEN 165/0/0/0
- **Commit:** `b0c2b7d65`

**2. [Rule 1 - Bug] A colocated test credited the repetition rule for a failure it did not cause**
- **Found during:** Task 1 (test merge)
- **Issue:** The existing test `'aaaa123!'` asserted `result.status === false` under a repetition-rule name. The password fails because it has no uppercase letter; repetition is not enforced. The merged spec's case (`'aaaaaaBBB123!'` stays valid) shows the opposite behaviour.
- **Fix:** The test now asserts only `details.repetition.status === false`, under the name "Should flag repeated characters at the repetition limit (4)". The overall verdict is covered by the merged non-enforced case.
- **Files modified:** `passwordValidation.test.ts`
- **Commit:** `d9ff2341a`

**3. [Rule 2 - Missing critical] Stale references to the old location outside `files_modified`**
- **Found during:** Task 1
- **Issue:** `packages/app-shared/README.md` linked the removed module. `PasswordValidator.svelte`'s docstring, and the generated PasswordValidator docs page copied from it, said the component used `@openvaa/app-shared`.
- **Fix:** The README lists only settings merge. The docstring and the generated page name the new path.
- **Commit:** `d9ff2341a`

**Hygiene edits beyond the plan (D-04):** reflow-damaged JSDoc in the moved module, a dangling colon in the PasswordValidator docstring and its generated page (`8e634223c`), and commented-out wrapper markup in `LogoutButton.svelte` (`7af66057c`).

**Total deviations:** 3 auto-fixed (2 bugs, 1 stale-reference cleanup). **Impact:** the logout fix is a small behaviour change outside the plan's comment. It removes a duplicate navigation and a prop that did nothing, and it is what made the cardinal E2E gate pass.

## Issues Encountered

- zsh reads `echo =====` as `=cmd` expansion (`===== not found`). Use quoted separators in Bash tool calls.

## Known Stubs

None.

## Threat Flags

None. T-165-48 is handled as planned: the docs now say the client check is advisory and that Supabase Auth enforces the policy. The logout fix removes a navigation and adds no surface.

## User Setup Required

None.

## Next Phase Readiness

- The gate plans (165-35, 165-36) find every file this plan changed recorded in `hygiene-reads/165-29.tsv` at its current blob. `LogoutButton.svelte` has two rows, and only the later blob `794b3809` is current.
- The ledger row for C-4106561819 is filled, and `ledger-check.sh` passes.

## Self-Check: PASSED

- `passwordValidation.ts`, `passwordValidation.test.ts`, `hygiene-reads/165-29.tsv` and the docs page exist on disk. `apps/frontend/tests/password-validation.spec.ts` is gone, as intended.
- Commits `d9ff2341a`, `401041d32`, `8e634223c`, `568bce827`, `b0c2b7d65` and `7af66057c` are in `git log`.
- `git rev-list --count 60b0966c9..HEAD` = 6 before this SUMMARY commit.
- `git status --short` lists only the ledger (committed with this SUMMARY), the maintainer's unstaged `MainContent.svelte` and the untracked `.planning/milestone.lock`.
