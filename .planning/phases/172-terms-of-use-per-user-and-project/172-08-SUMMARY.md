---
phase: 172-terms-of-use-per-user-and-project
plan: 08
subsystem: testing
tags: [e2e, playwright, axe, a11y, storage-state, fixtures, terms-of-use, comment-hygiene]

requires:
  - phase: 172-terms-of-use-per-user-and-project
    provides: "Plan 02: forceRegister's { acceptTermsOfUse: false } opt-out. Plan 04: the terms-of-use view rendered by the protected layout from the gate list, with terms-checkbox and terms-of-use-submit. Plan 07: unregisterCandidate deleting grants and the auth user only; the interim census naming the stale comments under tests/"
provides:
  - "TEST_TERMS_PENDING_CANDIDATE_EXTERNAL_ID, TEST_TERMS_PENDING_CANDIDATE_EMAIL and TERMS_PENDING_STORAGE_STATE in tests/tests/utils/testCredentials.ts: the identity of a registered user who has not accepted the terms of use, and the one declaration of its stored-session path"
  - "registerAndStoreSession(page, identity) in tests/tests/setup/shared/auth.setup.ts: register, sign in through the login form, optionally settle on a test id, store the session; two setup tests, one call each"
  - "The contestant a11y spec scans the terms-of-use view in the light and the dark theme under a describe-scoped stored session, through declareScans(entry), toScanEntry and assertAxeScan"
  - "No comment under tests/ describes acceptance as a property of the candidate, and the retired column's name appears nowhere under tests/"
  - "Stage 3, part 1, closed on one tree: nine gate rows at 0 and 180 of 180 E2E tests"
affects: [172-09, 173, 174, 178]

actuals:
  tokens: 13458
  tasks: 3
  commits: 4
plan_head_before: 722f62a76df2176b7a1dbcb62d3ef5b701783637
plan_head_after: cd9a4ad8c3943ee5551519e807f3cb94504fe967

tech-stack:
  added: []
  patterns:
    - "A stored session beyond the project's own is declared once beside its identity, written by one more setup test that is one call of a shared helper, and read by a describe-scoped test.use({ storageState }) in the spec that needs it"
    - "A scan spec with more than one stored session keeps one entry table per session and one module-level function that declares the light scan and its dark twin for an entry"

key-files:
  created: []
  modified:
    - tests/tests/utils/testCredentials.ts
    - tests/tests/setup/shared/auth.setup.ts
    - tests/tests/setup/shared/base.teardown.ts
    - tests/README.md
    - tests/tests/specs/a11y/contestant-a11y.spec.ts
    - tests/playwright.config.ts
    - tests/tests/specs/voter/voter-journey.spec.ts
    - tests/tests/specs/contestant/contestant-journey.spec.ts
    - tests/tests/utils/contestantJourneyConstants.ts
    - tests/tests/fixtures/contestant/contestantTermsOfUsePage.fixture.ts
    - tests/tests/utils/testIds.ts
    - tests/tests/setup/admin/admin-auth.setup.ts
    - tests/tests/setup/contestant/contestant-journey.setup.ts
    - tests/tests/setup/perm/perm-closed-project.setup.ts
    - tests/tests/utils/axeScan.ts
    - tests/tests/utils/rawKeyScan.ts

key-decisions:
  - "The helper is a module-level function of auth.setup.ts and is not exported: a Playwright test file cannot be imported by another, and 173-12 plans to move it to a plain module"
  - "The base session's path stays spelled in auth.setup.ts, so the Playwright config's comment that STORAGE_STATE is spelled twice stays true; only the new path is declared once and imported"
  - "The terms-pending user signs in with the existing TEST_CANDIDATE_PASSWORD; no second password constant was added"
  - "The two decision ids in perm-closed-project.setup.ts's docblock were removed on the dispatch handover's word; the plan's own sweep rule covers only comments that are false about acceptance"
  - "The comment in bank-auth-journey.setup.ts (\"remove any auth.users + grants + ToU state left behind\") was judged true as it stands and left: the acceptance goes with the user"
  - "The scanned-surface count was corrected in three comments of axeScan.ts and rawKeyScan.ts, files the plan does not list, because this plan made those sentences false"

patterns-established:
  - "One more stored contestant session: one identity object, one setup test holding one registerAndStoreSession call, one unregister line in the teardown that owns the dataset"

requirements-completed: [REG-12]

coverage:
  - id: D1
    description: "A second identity is registered with the acceptance opt-out as the editor of test-e2e-base-ca-aa-hidden, signed in through the login form, settled on the terms submit button, and its session stored under a path declared once"
    requirement: REG-12
    verification:
      - kind: e2e
        ref: "tests/e2e-runs/172/172-08-axe: auth-setup 2 of 2, 'register + authenticate as a user who has not accepted the terms of use' passed (4.1 s)"
        status: pass
      - kind: other
        ref: "git grep -n user-terms-pending.json -- tests: one line, the declaration in testCredentials.ts"
        status: pass
    human_judgment: false
  - id: D2
    description: "Registering an identity and storing its session is one call of a shared helper; the base setup test keeps its title and is one call too"
    verification:
      - kind: other
        ref: "auth.setup.ts holds two setup( tests and one registerAndStoreSession; no if inside either setup body (awk over the two bodies prints nothing); Task 1's verify chain as one command, exit 0"
        status: pass
      - kind: e2e
        ref: "tests/e2e-runs/172/172-08-axe: auth-setup 2 of 2; the 15 tests that read the base session (contestant-a11y-scan's 14, cold-entry-dataroot-contestant's 1) passed"
        status: pass
    human_judgment: false
  - id: D3
    description: "The base teardown unregisters both users, so the state is the same at the start of every run"
    verification:
      - kind: e2e
        ref: "data-teardown-base 1 of 1 in 172-08-auth-slice, 172-08-axe-slice and 172-08-axe"
        status: pass
      - kind: other
        ref: "psql on the local database after the full run: 0 auth users on test.openvaa.local, 0 rows in terms_of_use_acceptances"
        status: pass
    human_judgment: false
  - id: D4
    description: "The terms-of-use view is scanned by axe and the raw-key gate in the light and the dark theme, through assertAxeScan, with the reach proof and the dark-theme guard, and has zero violations and zero raw-key findings"
    requirement: REG-12
    verification:
      - kind: e2e
        ref: "tests/e2e-runs/172/172-08-axe/results.json: 'axe accessibility scan — contestant-terms-gate' and '… (dark)' passed, no retry; attachments axe-violations-* and raw-i18n-keys-* are [] for both; the reach proof (slice run) names /contestant, h1 'Terms of use', marker text 'Continue'"
        status: pass
      - kind: other
        ref: "plan verification as one command (exit 0): 172-e2e.sh --judge 172-08-axe and the node check that results.json holds the entry at least twice and its dark twin"
        status: pass
    human_judgment: false
  - id: D5
    description: "The scan project keeps storageState: STORAGE_STATE; the wiring guard passes with its script unmodified; the spec holds no axe builder of its own"
    verification:
      - kind: other
        ref: "yarn assert:a11y-scan-wiring (exit 0, 0 violations) before the commit and inside row 01 of the gate set; git diff 722f62a76..HEAD -- scripts is empty; git grep AxeBuilder on the spec prints nothing"
        status: pass
    human_judgment: false
  - id: D6
    description: "The a11y spec's docblock counts eight surfaces and 16 scans, its known-gaps table no longer lists the terms-of-use view, and the spec does not name the retired column"
    verification:
      - kind: other
        ref: "playwright --list: contestant-a11y-scan 16; git grep -n terms_of_use_accepted -- tests prints nothing (exit 1)"
        status: pass
    human_judgment: false
  - id: D7
    description: "Outside the a11y spec, the comments of the E2E tree state acceptance as a fact about the user and visibility as a matter of confirmation; the edits are comment lines only"
    verification:
      - kind: other
        ref: "for a9575e04b and 027636c92: every changed line starts with a comment marker (the filter for other lines prints nothing) and every file is under tests/; playwright --list exits 0, so the soft-assertion budget of voter-journey.spec.ts (equality, counted outside comments) holds"
        status: pass
      - kind: other
        ref: "tsx over BUILT_IN_TEMPLATES['e2e/base']: CO-Reg-N has 15 candidate nominations, 2 of unconfirmed candidates; 7 under Party AA's nomination, 2 unconfirmed"
        status: pass
      - kind: e2e
        ref: "tests/e2e-runs/172/172-08-axe: voter-journey 2 of 2, contestant-journey 1 of 1"
        status: pass
    human_judgment: false
  - id: D8
    description: "The full default suite is green on one tree with the two new scans and the new setup test in it, and the static gate set is green on the same tree"
    requirement: REG-12
    verification:
      - kind: other
        ref: "bash 172-gates.sh --judge 172-08-axe (exit 0; nine rows, every status 0; head cd9a4ad8c, clean tree)"
        status: pass
      - kind: e2e
        ref: "bash 172-e2e.sh --judge 172-08-axe (exit 0; 180 total, 180 passed, 0 failed, 0 flaky, 0 skipped, 0 did not run; the full default suite; head cd9a4ad8c, clean tree)"
        status: pass
    human_judgment: false

duration: 23min
completed: 2026-10-06
status: complete
---

# Phase 172 Plan 08: The Terms-of-Use View Under the Axe Scan, the Second Stored Session and the Comment Sweep Summary

**The terms-of-use view is now scanned by axe and the raw-key gate in the light and the dark theme, with zero violations and zero raw-key findings, under the stored session of a user who is registered with `{ acceptTermsOfUse: false }` and never accepts. That session's path is declared once, its setup is one call of `registerAndStoreSession`, and the comments of the E2E tree no longer describe acceptance as a property of the candidate. Nine gate rows at 0 and 180 of 180 E2E tests on one tree.**

## Performance

- **Duration:** about 23 min. Started 2026-10-06T06:31:01Z; the last source commit landed at 06:38:21Z; the scan slice ran 06:38:25Z to 06:38:50Z, the gate set 06:39:39Z to 06:42:45Z and the full E2E run 06:43:39Z to 06:49:05Z.
- **Tasks:** 3 of 3
- **Files changed outside `.planning/`:** 16, all under `tests/`: the 10 of the plan's `files_modified` and 6 more (see "Files beyond the plan's list")
- **Start revision:** `722f62a76df2176b7a1dbcb62d3ef5b701783637`
- **The tree the gate run, the scan slice, the full E2E run and every closing check describe:** `cd9a4ad8c3943ee5551519e807f3cb94504fe967`, clean apart from the operator's untracked `CAND-APP-PLAN.md`

## For Phase 173: the Mechanism

| Item | Value |
|---|---|
| The helper | `registerAndStoreSession(page: Page, identity: StoredSessionIdentity): Promise<void>`, a module-level function of `tests/tests/setup/shared/auth.setup.ts`. Not exported |
| Its identity argument | `externalId: string` (the base-dataset candidate the user becomes the editor of), `email: string`, `password: string`, `storageStatePath: string` (absolute), `acceptTermsOfUse: boolean` (required, no default), `settledTestId?: string` |
| What it does, in order | creates the session directory; `unregisterCandidate(email)`; `forceRegister(externalId, email, password, { acceptTermsOfUse })`; `waitForLoginForm` on the contestant home route; fills and submits the login form; waits for the URL to leave the login route; when `settledTestId` is given, waits for it to be visible (`TIMEOUTS.slowPage`); writes the storage state |
| The session-path constant | `TERMS_PENDING_STORAGE_STATE` in `tests/tests/utils/testCredentials.ts` = `path.join(TESTS_DIR, '../playwright/.auth/user-terms-pending.json')`. `testCredentials.ts` now imports `path` and `./testsDir` |
| The identity | `TEST_TERMS_PENDING_CANDIDATE_EXTERNAL_ID` = `'test-e2e-base-ca-aa-hidden'`; `TEST_TERMS_PENDING_CANDIDATE_EMAIL` = `'test-e2e-base-ca-aa-hidden@test.openvaa.local'`; password `TEST_CANDIDATE_PASSWORD` |
| The describe-scoped form in the spec | `test.describe(() => { test.use({ storageState: TERMS_PENDING_STORAGE_STATE }); for (const entry of TERMS_PENDING_AXE_ROUTES) { declareScans(entry); } });` at the foot of `contestant-a11y.spec.ts`, with a comment above it saying why the session is scoped there |
| The scan-declaring function | `declareScans(entry: ContestantAxeRoute): void`: the light test and, in an anonymous describe with `colorScheme: 'dark'`, the dark twin. The main loop is `for (const entry of CONTESTANT_AXE_ROUTES) { declareScans(entry); }` |
| A further identity | one more `setup(…)` test holding one call of the helper, one more session-path constant, one more unregister line in `base.teardown.ts`; in the spec, one more entry table and one more describe |

What Phase 173 should know beyond the table:

- **The two setup tests of `auth-setup` run at the same time,** on two workers (measured: both started within 1 ms of each other in `172-08-auth-slice`). Each makes its own admin client and names its own user. A third identity that shares a candidate or a user with one of them would not be safe there.
- **`test-e2e-base-ca-aa-hidden` has an editor for the length of a run.** `idx_grants_one_candidate_editor` admits one editor per candidate, so 173-12's multi-grant user cannot be granted this candidate while the terms-pending user holds it, nor CA-AA-1.
- **The terms-pending session must never accept.** A spec that ticks the box and continues under this session ends the state for every later reader of the file in the run.
- **The helper unregisters the email itself.** 173-12's wording ("each one call of the shared helper preceded by an unregister of the same email") describes a step the helper already holds.
- **`playwright/no-conditional-in-test` is off for `*.setup.ts`.** Once the helper sits in a plain module, the default rules apply to that module; it holds no test body, so the rule has nothing to report there.
- **Places that state the number of contestant scans (16) or scanned surfaces (30)** and will need 173-13's six: the docblock of `contestant-a11y.spec.ts` (head, divergence 2, the known-gaps lead, limit 3), `axeScan.ts` (two comments), `rawKeyScan.ts` (one), and `scripts/assert-a11y-scan-wiring.mjs`, which still says 14 (deferred item 1).
- **`tests/README.md` has no section on the contestant scan.** 173-13 speaks of "the scan section"; the only mention of the family is the `a11y-smoke` row of the opt-out table.

## What the Plan Asked to Have Recorded

| Item | `172-07-stage2` | `172-08-axe` |
|---|---|---|
| `auth-setup` | 1 of 1 | **2 of 2** (one higher) |
| `contestant-a11y-scan` | 14 of 14 | **16 of 16** (two higher) |
| Every other project (98 of them) | | the same total as in `172-07-stage2`, each fully passed |
| Suite | 177 of 177, 100 projects | **180 of 180**, 100 projects |

The expected total was derived before the run by enumeration: `playwright test --list` printed 177 tests in 99 files at the start revision and 180 at `cd9a4ad8c`, and a per-project comparison of the two listings differs in exactly those two rows.

**Defects the scan found in the acceptance view: none.** Both scans passed on their first execution, in the slice and in the full run, with empty `axe-violations-*` and `raw-i18n-keys-*` attachments. No component was changed, no rule and no node was excluded, and the gate's Logout button was not given a test id because nothing needed one.

## Accomplishments

- `testCredentials.ts` declares the terms-pending identity and its session path, and its docblock says why the base candidate's user lands past the terms-of-use view (`forceRegister` records the acceptance; the candidate row carries nothing).
- `auth.setup.ts` is one helper and two setup tests. The second waits for `terms-of-use-submit` before the session is written.
- `base.teardown.ts` unregisters both users.
- The a11y spec gained the `contestant-terms-gate` entry in a table of its own, `declareScans`, and the describe that swaps the session in. Its docblock counts eight surfaces and 16 scans and its known-gaps table lost the row for the view.
- The stale comments listed under "The Comment Sweep, Comment by Comment", in eleven files under `tests/`, were rewritten to say what is true now, and three count statements in the scan utilities follow the new total.
- The gate set and the full suite are green on one tree; the `default` dataset was seeded again.

## Task Commits

1. **Task 1: the identity, its stored session and the shared helper** — `cd4796bf1` `test(172-08): register a user who has not accepted the terms of use and store its session through a shared setup helper`
2. **Task 2: the comment-only sweep** — `a9575e04b` `docs(172-08): state terms-of-use acceptance as a fact about the user in the comments of the E2E tree`, and its fix `027636c92` `docs(172-08): keep the Party AA member count of the voter journey on one comment line`
3. **Task 3: the two gate scans** — `cd9a4ad8c` `test(172-08): scan the terms-of-use view with axe in both themes under the terms-pending session`

`git rev-list --count 722f62a76..cd9a4ad8c` is 4. The commit that carries this file follows them.

## The Comment Sweep, Comment by Comment

The population command (`git grep -n -i -e "terms_of_use" -e "termsOfUseAccepted" -e "terms of use" -e "ToU" -- tests/tests ':!tests/tests/specs/a11y'`) and a second search for "unlink", "reset", "ToU state" and "gate modal" were read hit by hit.

| File | What the comment said | What it says now |
|---|---|---|
| `testCredentials.ts` (Task 1) | CA-AA-1 "carries" the column, so the gate does not intercept | the user lands past the view because `forceRegister` records the acceptance; the candidate row carries nothing about it |
| `auth.setup.ts` (Task 1) | the unregister is "safe with respect to" the column | unregistering deletes the user, and the grants and the acceptance go with them; the candidate row is left as it is |
| `base.teardown.ts` (Task 1) | unregister runs before the row wipe "so the candidate row is still present to unlink"; `auth-setup` is opt-in and registers CA-AA-1 | each call deletes one auth user; neither reads or writes a candidate row, so the order relative to the wipe does not matter; `auth-setup` registers two users |
| `voter-journey.spec.ts` | Party AA has 6 nominal members, 1 hidden through the absent column | 7 nominal members, 2 unconfirmed and so hidden, 5 visible |
| `voter-journey.spec.ts` | "14 candidates minus the one who is hidden" | CO-Reg-N has 15 candidate nominations, 2 of unconfirmed candidates, 13 cards |
| `voter-journey.spec.ts` | the hidden candidate is absent "(termsOfUseAccepted=false)" | it is unconfirmed |
| `contestant-journey.spec.ts`, step 5 | the column is null on the unregistered candidate, so the layout shows the form | the user registered through the email flow has no acceptance for the project, so the layout shows the view in place of the page |
| `contestantJourneyConstants.ts` | `unregisterCandidate` "resets terms of use on the candidate the grant names" | it deletes the auth user; the grant and the acceptance the journey records go with the user |
| `contestantTermsOfUsePage.fixture.ts` | the form is rendered by the layout "when `candidate.termsOfUseAccepted == null`" | the view is `TermsOfUseGate.svelte`, rendered in place of the page for a signed-in user with no acceptance for the project |
| `testIds.ts`, `terms.submit` | the submit button lives in the consuming layout | it lives in the view itself, `lib/contestant/gates/TermsOfUseGate.svelte` |
| `admin-auth.setup.ts` | `unregisterCandidate`'s "terms-of-use reset" touches no candidate of an admin | it deletes the grant rows and the account, and reads or writes no candidate row |
| `contestant-journey.setup.ts` | clears "ToU state for the unregistered candidate" | removes any auth user holding the candidate's email; the grants and the acceptance go with it |
| `perm-closed-project.setup.ts` | cited `162.1 D-21` and `162.1 D-16` | the two ids are gone; the sentences are otherwise unchanged |

**Read and left, because true as they stand:** `bank-auth-journey.setup.ts` ("remove any auth.users + grants + ToU state left behind": the acceptance does go with the user); the three comments of `perm-localisation-positive.spec.ts` that 172-02 wrote; `forceRegisterAdmin`'s docblock, which 172-07 had already corrected; the preregister fixtures and the bank-auth journey spec, whose "ToU" is the checkbox of the preregister email step; steps 8 and 9 of the contestant journey ("ToU already accepted").

Both totals were derived from `e2e/base.ts` by importing the template: CO-Reg-N has 15 candidate nominations, 7 of them under Party AA's nomination, and exactly two candidates of the template are unconfirmed (`test-e2e-base-ca-aa-hidden`, `test-e2e-base-ca-aa-unregistered`), both among Party AA's seven.

## Gate and E2E Results

Every exit status was read from the command itself or from the attempt's `done` file, never through a pipe.

| What | Command | Exit | Result |
|---|---|---|---|
| Enumeration at the start revision | `playwright test -c tests/playwright.config.ts --grep-invert @probe --list` | 0 | 177 tests in 99 files, 100 projects |
| Task 1 verify chain | `yarn typecheck:tests`, ESLint on the three files, the two greps, as one command | 0 | |
| Task 1 criteria | the column name in the three files (grep exit 1); `user-terms-pending.json` under `tests` (one line); two `setup(` and no `if` in either body (awk) | | hold |
| Prettier, comment hygiene, app-name gate, scan wiring after Task 1 | `prettier --check` on the four files; the three root scripts | 0, 0, 0, 0 | |
| Early slice | `172-e2e.sh 172-08-auth-slice --project auth-setup` | 0 | 4 of 4 (`auth-setup` 2, base setup 1, base teardown 1); run on the uncommitted Task 1 files |
| Task 2 verify chain | `yarn typecheck:tests`, ESLint on the voter journey spec, `tests/tests/utils` and `tests/tests/fixtures`, the grep, as one command | 0 | |
| ESLint and Prettier on the eight Task 2 files | per file list | 0, 0 | |
| Comment-only check | changed lines of the Task 2 files that do not start with a comment marker | | none of 25 |
| Soft-assertion budget | `playwright … --list` (the config throws on a divergence) | 0 | |
| **Comment hygiene after Task 2's edits** | `yarn assert:comment-hygiene` | **1** | one violation, `voter-journey.spec.ts:941`: a comment line wrapping without terminal punctuation. See deviation 1 |
| Comment hygiene after the fix | same | 0 | 1807 files scanned, 0 violations |
| Task 3, static | `yarn assert:a11y-scan-wiring`, `yarn typecheck:tests`, ESLint on the spec and the two utilities, Prettier on the four files, comment hygiene, app-name gate | 0 each | ESLint ignores `tests/playwright.config.ts` by its own ignore pattern (a warning, exit 0) |
| Enumeration after Task 3 | `playwright … --list` | 0 | 180 tests in 99 files; per project only `auth-setup` 1 to 2 and `contestant-a11y-scan` 14 to 16 differ |
| Task 3 verify, part 1 | wiring, typecheck, the two greps, as one command, chained to the commit | 0 | |
| **Scan slice** | `172-e2e.sh 172-08-axe-slice --project contestant-a11y-scan`, judged with `--allow-slice` | **0** | **20 / 20**: `auth-setup` 2, `contestant-a11y-scan` 16, base setup 1, base teardown 1; head `cd9a4ad8c`, clean tree |
| **Gate set** | `172-gates.sh 172-08-axe` | **0** | **nine rows, all `0`**, head `cd9a4ad8c`, clean tree |
| **E2E** | `172-e2e.sh 172-08-axe` | **0** | **180 / 180 / 0 failed / 0 flaky / 0 skipped / 0 did not run**; 100 projects; 4.8 min; no test was retried |
| Task 3 verify, part 2 | `172-e2e.sh --judge 172-08-axe` and the node check on `results.json`, as one command | 0 | verdict GREEN, the full default suite, not below the baseline total; the entry and its dark twin are in the report |
| Re-seed | `yarn db:seed:default` | 0 | 752 rows |
| Allowlist | `170-allowlist-probe.sh after` | 0 | every row OK; the stack was not restarted |

The nine rows of `172-08-axe`: lint 44 s, types-regen 32 s, types-clean 0 s, sql-lint 3 s, pgtap 5 s (38 files, 1385 tests), unit 58 s (frontend 2170 in 137, dev-seed 996 in 67, supabase 206 in 15, app-shared 141 in 10), svelte-check 9 s, build 16 s, format 18 s. Every count equals its `172-07-stage2` value.

### Every run directory of this plan

| Directory | Head | Counts | Verdict |
|---|---|---|---|
| `tests/e2e-runs/172/172-08-auth-slice` | `722f62a76` with Task 1's four files modified | 4 of 4 over three projects | green, a project slice |
| `tests/e2e-runs/172/172-08-axe-slice` | `cd9a4ad8c`, clean | 20 of 20 over four projects | green, a project slice |
| `tests/e2e-runs/172-gates/172-08-axe` | `cd9a4ad8c`, clean | nine rows, all `0` | green |
| `tests/e2e-runs/172/172-08-axe` | `cd9a4ad8c`, clean | 180 of 180 over 100 projects | **green, the full default suite** |

There was no red gate row and no red E2E run, no rerun under a label, and nothing under `tests/e2e-runs/` was deleted. Each E2E attempt has one preflight success, no preflight failure and wrapper status 0.

**Reading the full run.** `auth-setup` 2 of 2, `contestant-a11y-scan` 16 of 16, `cold-entry-dataroot-contestant` 1 of 1, `voter-journey` 2 of 2, `contestant-journey` 1 of 1, `perm-closed-project` 11 of 11, `admin-access` 1 of 1, `data-teardown-base` 1 of 1. The dev-server log holds 2 lines of the known data-provider noise (2 in `172-07-stage2`) and none naming `getBasicUserData`, `acceptTermsOfUse` or a user-data fetch error; no log of the run holds `does not exist`, `schema cache` or `PGRST204`.

## What the Evidence Does and Does Not Show

- **Shown by the runs:** a user registered with the opt-out is stopped at the terms-of-use view at the contestant home route (settled URL `/contestant`, h1 "Terms of use", the submit button present once), in a browser context born light and one born dark; axe reports no violation and the raw-key gate no finding on that document in either theme; the dark-theme guard passes, so the header's menu toggle is rendered on the view and takes the dark token.
- **Shown by the residue:** the base teardown removes both users. After the full run the database held no auth user on `test.openvaa.local` and no acceptance row.
- **Shown by the voter journey passing:** giving the hidden candidate an editor while the voter journey runs changes nothing a voter sees.
- **Not shown:** that the scan would go red on a defect in this view. No negative control was run (a mutated view under the scan); what stands in for it is that the scans go through the same `assertAxeScan` as the other 28, and that the reach proof and the checkbox anchor place the scan on the rendered view.
- **Not shown:** the view's error state (`tou-save-error`) under the scan, or the view at a mobile viewport. Neither is reachable without a step the entry does not take.
- **Not shown:** axe's `incomplete` results for the two new scans. They are outside the gate for every scan; the 72 the docblock records were counted on the 14 scans under the base session, and the docblock now says so.
- **Not run:** the two opt-in bank-auth projects. They have not been exercised since `unregisterCandidate` changed in 172-07, and this plan changed a comment in `contestant-journey.setup.ts` and nothing they execute. `yarn typecheck:tests` covers their call sites.

## Decisions Made

The plan's five listed deviations from CONTEXT.md stand as planned. The calls the plan does not make are under `key-decisions`.

**Where the plan and the dispatch handover differ.** The handover lists `perm-closed-project.setup.ts`'s decision ids, the `terms.submit` comment and `forceRegisterAdmin`'s docblock among what this sweep owns. The plan's sweep rule is narrower (comments false about acceptance, in any file the population command lists). The `terms.submit` comment and the two decision ids were corrected, the second on the handover's word alone and recorded as such; `forceRegisterAdmin`'s docblock was read and found already true. The plan was followed for everything else, including leaving `scripts/assert-a11y-scan-wiring.mjs` unmodified.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Task 2's commit went in with the comment-hygiene gate red**
- **Found during:** Task 2, at its commit.
- **Issue:** The rewritten Party AA comment in `voter-journey.spec.ts` kept the four-line wrap of the comment it replaced. `yarn assert:comment-hygiene` reports a comment line that wraps without terminal punctuation (exit 1, one violation). The gate was run in the same command as the commit, separated by `;` rather than `&&`, so the commit `a9575e04b` was made although the gate had failed. The gate is a link of `lint:check`, so that commit boundary has a red lint row. Typecheck and every other check of the task were green.
- **Fix:** the list item is one comment line. From then on every gate that precedes a commit was chained to it with `&&`.
- **Files modified:** `tests/tests/specs/voter/voter-journey.spec.ts`
- **Verification:** `yarn assert:comment-hygiene` exit 0; Prettier, ESLint and the config load exit 0; row `01-lint` of the gate set is 0 on `cd9a4ad8c`.
- **Committed in:** `027636c92`

### Files beyond the plan's list

Task 2, step 3 provides for these; all are comment-only:

- `tests/tests/utils/testIds.ts` (the `terms.submit` comment)
- `tests/tests/setup/admin/admin-auth.setup.ts`
- `tests/tests/setup/contestant/contestant-journey.setup.ts`
- `tests/tests/setup/perm/perm-closed-project.setup.ts` (decision ids; see "Decisions Made")

Task 3, comment-only, not provided for by the plan:

- `tests/tests/utils/axeScan.ts`: "all 28 scanned surfaces (14 voter + 14 candidate…)" and "28 of them, the voter 14 and the candidate 14" now say 30 and 16.
- `tests/tests/utils/rawKeyScan.ts`: "which of the 28 scanned surfaces" now says 30 and 16.

In two of those three sentences a trailing clause about what the count used to be was dropped, since a changed comment may not narrate history.

### Small departures in form

- **`testCredentials.ts`'s docblock** also lost "opt-in" before `auth-setup`: the project is declared unconditionally.
- **`base.teardown.ts`'s docblock paragraph** on the unregister step was rewritten, not only the comment above the two calls: it said `auth-setup` is opt-in and registers one candidate.
- **The file docblock of `auth.setup.ts`** moved from above the first setup test to the head of the file.
- **`waitForLoginForm`'s docblock** no longer says the hoist makes the lint rule hold for the setup body; the rule is off for setup files (deferred item 4).
- **`tests/README.md`:** one table cell. The new text was kept within the column's width, so the table was not re-padded. No other sentence of the file says the setup writes one session.
- **`tests/playwright.config.ts`:** three comment sentences (the line above the `auth-setup` project, the paragraph above the a11y projects, the closing docblock's sentence on what the scan project consumes). No project changed. The comment on the session-tag split of the cold-entry spec was left: it is about `STORAGE_STATE`, and it stays true.
- **The a11y spec's docblock** was corrected in these places: the head, a new paragraph on the second session, divergences 1 and 2, the measurement in divergence 5, the lead, the header and the removed row of the known-gaps table, and limit 3.

### Beyond the plan's list

- **An early slice,** `172-08-auth-slice`, before Task 1's commit.
- **The static gate set,** `172-08-axe`. The plan closes on the E2E run; the dispatch asks for the gate set on the same tree.
- **A per-project comparison of two `--list` enumerations,** before and after.
- **A read of the database residue** after the full run.

### Acceptance criteria that did not hold as written

- **Task 1: "No `if` sits inside either `setup(…)` body (ESLint passes on the file)."** ESLint passes, but it cannot show this: `playwright/no-conditional-in-test` is off for `*.setup.ts`. The criterion's claim holds and was checked by reading and by an awk pass over the two bodies.
- **Task 2: "`git show --stat <the task's commit sha>`".** The task has two commits. Both list files under `tests/` only and change comment lines only.

Every other criterion holds as written, and each `<automated>` check was run as one command and exited 0.

### Departures in procedure

- **The commits sit on `feat/entity-signup-multi-grant` in a linked worktree,** as the run's standing notes direct; the branch was checked before each commit.
- **Polling** was a bounded foreground loop of `--status` calls 45 seconds apart; every helper run was started with the tool's background mode.
- **One command printed a page of yarn usage:** `yarn -s`, an option this yarn does not have. It ran nothing; the three scripts were run again without it.
- **The local database was reset once,** by the gate run, and `default` was seeded again at the end.
- **Reading.** The plan, the standing notes, `172-NAMES.md`, `deferred-items.md` and the summaries of plans 02, 04 and 07 were read whole. Of `172-CONTEXT.md`, `172-RESEARCH.md` and `172-PATTERNS.md` the sections the plan names. `173-12-PLAN.md` and `173-13-PLAN.md` by search for the session helper and the scan entries. Of `execute-plan.md` the step list, of the summary template the frontmatter and the body outline. `checkpoints.md`, `executor-examples.md`, `PROJECT.md`, `STATE.md`, `config.json` and the components skill were not opened; no component was touched.

---

**Total deviations:** 1 auto-fixed (a red gate at one commit boundary, fixed in the next commit), six files beyond the plan's list, seven small departures in form, four additions beyond the plan, two criteria met in a different form.
**Impact on plan:** none on behaviour or scope. The one to weigh is deviation 1: commit `a9575e04b` alone would fail `lint:check`.

## Threat Model, Each Disposition

| Threat | Disposition | Where it stands |
|---|---|---|
| T-172-18 a stored session file and credentials for a second local test identity | accept | the file is under the gitignored `tests/playwright/` (`git status` does not list it); the credentials are on `test.openvaa.local`; `git grep TEST_TERMS_PENDING -- apps packages` has no reader; the base teardown removes the auth user (0 left after the run) |
| T-172-25 weakening the scan to get the view through | mitigate | the two scans go through `toScanEntry` and `assertAxeScan` unchanged; the spec holds no axe builder; `yarn assert:a11y-scan-wiring` is 0 with its script unmodified; nothing was excluded, and there was no finding to exclude |
| T-172-SC package installs | accept | no package was installed; `yarn.lock` and every `package.json` are unchanged |

No security-relevant surface was added beyond the plan's threat model.

## Deferred Issues

None fixed, all outside this plan. Items 1 to 4 were added to `deferred-items.md` under "From plan 172-08":

1. `scripts/assert-a11y-scan-wiring.mjs` says the scan project holds 14 scans, in three places.
2. The "RANKING CONTRACT" comment of the voter journey describes the hidden candidate as a ranked card with polar-MAX answers.
3. A config comment says two projects consume the candidate session; three do.
4. Two Playwright lint rules are off for setup and teardown files.
5. Item 4 of 172-07's list (the decision ids in `perm-closed-project.setup.ts`) is resolved by this plan.
6. `172-VALIDATION.md` was not touched; its rows for this plan are answered in this file.

The cross-phase defect ledger (`.planning/WINDOWS.md`) was not appended to: there is no stub, no skipped test and no verification of this plan that was not run. No todo was filed; `.planning/todos/pending/2026-08-27-147-tou-gate-modal-unscanned.md` is 172-09's to close.

## Issues Encountered

One, of my own making: deviation 1.

## Known Stubs

None.

## User Setup Required

None - no external service configuration required.

## What the Next Plan and Later Phases Must Know

**Plan 172-09**

- **Compare against:** gates and E2E `172-08-axe` (nine rows at 0; **180** / 180, 100 projects). pgTAP 38 files, 1385 tests; frontend 2170 in 137; dev-seed 996 in 67; supabase 206 in 15; app-shared 141 in 10.
- **The census of the retired column is 4 files and 6 lines,** all yours: the two docs pages (1 line each), `.claude/skills/database/rls-policy-map.md` (3) and `schema-reference.md` (1). Nothing under `tests/`, `apps/supabase`, `apps/frontend`, `packages` or `scripts` names it.
- **The axe todo's closing note:** the view is scanned as `contestant-terms-gate` in both themes, zero violations; the lever was a user with no acceptance row, registered with the opt-out as the editor of `test-e2e-base-ca-aa-hidden`; the surface is an in-layout view, not a modal.
- **No file under `.claude/skills` or `apps/docs` states the contestant scan count** (searched for `14 scans`, `16 scans` and `contestant-a11y`). If you write it anywhere: 16 scans over eight surfaces, and 30 scanned surfaces in the two-project family.
- **A gate run still resets the database;** run gates first, E2E after, and seed `default` at the end.

**Phase 173**

- See "For Phase 173: the Mechanism" above.

**Phases 174 and 178**

- Whatever replaces `forceRegister` must keep an opt-out that leaves a user without an acceptance, or the terms-pending session and its two scans lose their state.

**Host state:** the stack is up and healthy on the live allowlist (`170-allowlist-probe.sh after`, exit 0); nothing listens on 5173 or 5273. The database carries the schema of `cd9a4ad8c`, the pgTAP helper functions in `public` (left by the gate run), what the E2E run left in its own project, and the `default` dataset in the default project (328 candidates). `terms_of_use_acceptances` is empty and no test auth user remains. `tests/playwright/.auth/` holds the two session files of the last run; both users are gone, so both sessions are dead until the next run rewrites them. `CAND-APP-PLAN.md` was not edited, moved, staged or committed. `.planning/STATE.md`, `.planning/ROADMAP.md` and `.planning/REQUIREMENTS.md` are unchanged.

## Self-Check: PASSED

- The 16 files under `key-files.modified`, `deferred-items.md` and this file exist, and `git diff --name-only 722f62a76..cd9a4ad8c` lists exactly those 16 files.
- The four commits (`cd4796bf1`, `a9575e04b`, `027636c92`, `cd9a4ad8c`) are ancestors of HEAD; `git rev-list --count 722f62a76..HEAD` was 4 when this file was written.
- `tests/e2e-runs/172/172-08-axe/summary.json` and `tests/e2e-runs/172-gates/172-08-axe/summary.tsv` exist; the four attempt directories of this plan hold `done` = 0, and the scan slice, the gate set and the full run record head `cd9a4ad8c`.
- The plan's verification items were run on the final tree: `yarn assert:a11y-scan-wiring` (0), `yarn typecheck:tests` (0), `172-e2e.sh --judge 172-08-axe` with the report check (0), and `git grep -n "terms_of_use_accepted" -- tests` prints nothing.
- Every acceptance criterion of the three tasks was checked by command; the two that do not hold as written are listed above with what was measured.
- No stub pattern is in the added lines. `.planning/STATE.md`, `.planning/ROADMAP.md` and `.planning/REQUIREMENTS.md` are unchanged since the start revision; `CAND-APP-PLAN.md` is untracked and untouched.
