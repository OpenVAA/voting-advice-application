---
phase: 174-invitations-grants-defined-in-advance
plan: 07
subsystem: backend
tags: [edge-functions, supabase, invitations, removal, gates, docs, skills]

requires:
  - phase: 174-invitations-grants-defined-in-advance
    provides: "plan 05: the Edge Function account-access with its byte-identical envConfig.ts; plan 06: the invitation contract held by the suite (project invitation-contract, 15 of 15 in the full run 174-06-close)"
provides:
  - "the functions tree holds account-access, identity-callback and send-email; the endpoint of the deleted function answers 404 on the restarted stack"
  - "the data writer without its pre-registration-by-API-token member, in the interface, the base class and the Supabase adapter"
  - "DUPLICATED_MODULES naming envConfig.ts alone; PROJECT_SCOPED_EDGE_FUNCTIONS, its fixtures and the dev-seed gate test naming the three functions"
  - "the name gate with one exemption entry and its count sentences corrected; four fixture lines edited in place"
  - "docs, the Supabase README and the database skill describing three functions and the invitation model"
affects: [174-08, 174-09, 174-10, 178]

actuals:
  tokens: 52554
  tasks: 5
  commits: 6
plan_head_before: b43946d0fa3b56fcfb90ee2ea83583d10c34403e
plan_head_after: bb86956e7f50eff1c0ef4583fd5dffe97cca1423

tech-stack:
  added: []
  patterns:
    - "A removal is closed by a search over the committed tree that finds nothing, read by its own exit status"
    - "A test that is the only test of a module which remains moves with the module's remaining copy instead of leaving with the directory it sat in"
    - "A gate list loses an entry only when the thing it names is gone: a module with one copy leaves the duplicated-module list, and the copies that remain are compared with cmp"

key-files:
  created: []
  modified:
    - "apps/frontend/src/lib/api/base/dataWriter.type.ts"
    - "apps/frontend/src/lib/api/base/universalDataWriter.ts"
    - "apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts"
    - "apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.test.ts"
    - "apps/frontend/eslint.config.mjs"
    - "scripts/assert-edge-env-defaults.mjs"
    - "scripts/assert-project-scoped-queries.mjs"
    - "scripts/assert-no-candidate-app-names.mjs"
    - "scripts/fixtures/assert-no-candidate-app-names.input.ts"
    - "scripts/fixtures/project-scoped-queries/clean.fixture.ts"
    - "scripts/fixtures/project-scoped-queries/violation.fixture.ts"
    - "packages/dev-seed/tests/projectScopingGate.test.ts"
    - "apps/supabase/supabase/functions/send-email/ (callerAuthority.ts, jwtSegment.ts, jwtSegment.test.ts, index.ts, flowConformance.test.ts, templateVars.ts, envConfig.ts)"
    - "apps/supabase/supabase/functions/identity-callback/ (entityGrant.ts, entityGrant.test.ts, envConfig.ts)"
    - "apps/supabase/supabase/functions/account-access/envConfig.ts"
    - ".env.example"
    - "apps/supabase/supabase/functions/.env.example"
    - "apps/docs/src/routes/(content)/developers-guide/ (backend: authentication, edge-functions, email, intro; contestant-app: pre-registration-and-invitation, registration; architecture; configuration/environmental-variables)"
    - "apps/supabase/README.md"
    - ".claude/skills/database/SKILL.md"
    - ".planning/phases/174-invitations-grants-defined-in-advance/174-NAME-MAP.md"
  deleted:
    - "apps/supabase/supabase/functions/invite-candidate/ (eight files deleted, two moved to send-email/)"
  moved:
    - "apps/supabase/supabase/functions/invite-candidate/callerAuthority.test.ts -> send-email/callerAuthority.test.ts"
    - "apps/supabase/supabase/functions/invite-candidate/envConfig.test.ts -> send-email/envConfig.test.ts"

key-decisions:
  - "The tests of callerAuthority.ts and envConfig.ts move to send-email instead of being deleted: each was the only test of a module that remains"
  - "DUPLICATED_MODULES is ['envConfig.ts']: jwtSegment.ts and callerAuthority.ts exist once each, and check 2 requires two copies of every name it lists"
  - "The fixtures of the project-scoping gate keep their bodies and change the function name only, so every line count and expected finding stands"
  - "The docs describe what the tree does at this commit: a verified magiclink lands on the Contestant App home through the callback's default arm, and the frontend calls neither account-access nor claim_invitations"
  - "No sentence on undeploying the function from a hosted project is written: nothing is deployed (ruling of 2026-10-04)"
  - "The pre-existing red of the skill link audit is reported and not repaired here: its findings are in files this plan does not touch"

patterns-established:
  - "A module that exists in one function directory says so in its docblock, and says what a second copy would need (an entry in DUPLICATED_MODULES)"

requirements-completed: [INV-01, INV-03]

coverage:
  - id: D1
    description: "The Edge Function that pre-created a user and wrote a grant at invite time is gone from the tree and from the running stack"
    requirement: "INV-01"
    verification:
      - kind: other
        ref: "test ! -e apps/supabase/supabase/functions/invite-candidate (exit 0); OPTIONS /functions/v1/invite-candidate answers 404 after yarn db:stop and yarn db:start; the three remaining functions answer 200"
        status: pass
      - kind: other
        ref: "node 174-verdict.mjs greps --only 1,3,4 on head 340e1a0a1 — exit 0, no hit for the function's name, the writer method or the path of the page that never existed"
        status: pass
    human_judgment: false
  - id: D2
    description: "The data writer holds no member that reached the function: the interface, the base class and the Supabase adapter, and their tests"
    verification:
      - kind: unit
        ref: "yarn workspace @openvaa/frontend check (0 errors in 2111 files); the adapter's test file, 81 passed and 7 skipped; yarn assert:adapter-casts exit 0"
        status: pass
      - kind: other
        ref: "git grep -n -F preregisterWithApiToken -- . ':!.planning' and git grep -n -P '\\b_preregister\\b' -- . ':!.planning', each exit 1"
        status: pass
    human_judgment: false
  - id: D3
    description: "Every gate that named the function names what is true now, and no list is narrower than the deletion requires"
    verification:
      - kind: other
        ref: "yarn assert:edge-env-defaults (36 files, 3 of 3 checks, 0 violations); yarn assert:project-scoped-queries (0 violations, self-test passed); yarn assert:edge-function-env; cmp of the three envConfig.ts copies, exit 0 twice"
        status: pass
      - kind: unit
        ref: "yarn workspace @openvaa/dev-seed test:unit — 68 files, 1030 tests"
        status: pass
    human_judgment: true
    rationale: "That DUPLICATED_MODULES is not narrower than it should be is a reading of the tree (one copy each of jwtSegment.ts and callerAuthority.ts), not something a gate asserts"
  - id: D4
    description: "send-email behaves as before: its request handling, authority check and mail sending are unchanged"
    verification:
      - kind: other
        ref: "git diff of send-email/index.ts over the plan: one comment line; 174-mail-probe.mjs after the restart, exit 0, eight steps PASS (answered 200, sent 1, delivered)"
        status: pass
      - kind: unit
        ref: "send-email's five test files: 65 tests (callerAuthority 23, envConfig 5, flowConformance 15, jwtSegment 6, templateVars 16)"
        status: pass
    human_judgment: false
  - id: D5
    description: "The name gate declares no exemption for the function, states the number of entries it holds, and its self-test passes against unshifted expectations"
    verification:
      - kind: other
        ref: "node 174-verdict.mjs exemptions — exit 0, one entry, both count sentences agree; --self-test: 82 findings, 82 expected; the fixture's numstat 4 added and 4 removed; the expected file unchanged"
        status: pass
    human_judgment: false
  - id: D6
    description: "The docs, the README, the templates and the database skill describe three Edge Functions and the invitation model, and name neither the deleted function nor the page that never existed"
    requirement: "INV-03"
    verification:
      - kind: other
        ref: "git grep -n -F invite-candidate -- apps/docs apps/supabase/README.md .claude (exit 1); yarn workspace @openvaa/docs validate:links --check (0 findings); the docs workspace's format check (exit 0)"
        status: pass
      - kind: other
        ref: "bash .claude/scripts/audit-skill-links.sh database — exit 1, on citations this plan did not write"
        status: fail
    human_judgment: true
    rationale: "Whether the prose is accurate is a reading against the code; the skill link audit was red before this plan and is red after it, for citations in files this plan does not touch"
  - id: D7
    description: "With the function gone, the fifteen gate rows are green on the restarted stack"
    verification:
      - kind: other
        ref: "node 174-verdict.mjs gates 174-07-close — exit 0, 15 rows, head 340e1a0a1, sleep_entries_in_window 0, no void marker"
        status: pass
    human_judgment: false

duration: 25min
completed: 2026-10-07
status: complete
---

# Phase 174 Plan 07: Removing the Invite Function Summary

**The Edge Function that created a user and wrote a grant at invite time is deleted, with the data writer member that reached it, its entries in five gates, its exemption in the name gate and every description of it. The stack serves `account-access`, `identity-callback` and `send-email`, and `invite-candidate` answers 404. Outside the planning record the function's name is left in `CLAUDE.md` alone. Fifteen gate rows are green on the restarted stack; no E2E run closed this plan, and the full default run that closes 174-08 is its boundary proof.**

## Performance

- **Duration:** 25 min
- **Started:** 2026-10-07T10:53:57Z
- **Completed:** 2026-10-07T11:19Z
- **Tasks:** 5 of 5
- **Files:** 8 deleted, 2 moved, 36 modified (`git diff --name-status b43946d0f..HEAD`)
- **Restarts of the stack:** one, after the commit that deletes the directory (13:59:57 to 14:00:28 local)

## Task Commits

| Task | Name | Commit |
| --- | --- | --- |
| 1 | The client contract of the deleted function leaves the data writer | `25132e40b` (refactor) |
| 2 | Delete the function; the gate entries and the one test that read it follow in the same commit; restart | `287a2b97d` (feat) |
| 3 | The sibling functions' comments and the two templates stop citing the deleted function | `d773474ba` (docs) |
| 4 | The docs, the README and the database skill describe three functions and the invitation model | `be12bbed4` (docs) |
| 5 | The name gate loses the function's exemption; close on the gate set | `340e1a0a1` (chore), `bb86956e7` (docs: name map) |

**Plan metadata:** the commit that adds this file. `commits: 6` is `git rev-list --count b43946d0f..HEAD` when this file was written; all six are this plan's.

## The population, at the start and at the end

`git grep -n -F "invite-candidate" -- . ':!.planning'`:

- **At the start** (head `b43946d0f`): hits in 36 tracked files (`git grep -l`). Seven were in the function's own directory; the rest were the data writer and its test (2), the three sibling functions (9 files), six gate scripts and fixtures, the dev-seed gate test, two environment templates, six docs pages, `apps/supabase/README.md`, `.claude/skills/database/SKILL.md` and `CLAUDE.md`.
- **At the end** (head `340e1a0a1`): exit 0 with two lines, both in `CLAUDE.md` § _Backend (Supabase)_. With `':!CLAUDE.md' ':!CAND-APP-PLAN.md'` added: **prints nothing, exit 1**.

The other searches at the end, each read by its own status:

| Search | Exit | Hits |
| --- | --- | --- |
| `git grep -n -F "preregisterWithApiToken" -- . ':!.planning'` | 1 | none |
| `git grep -n -P "\b_preregister\b" -- . ':!.planning'` | 1 | none |
| `git grep -n -F "complete-registration" -- . ':!.planning'` | 1 | none |
| `git grep -n -i -e "invite.candidate" -e "inviteCandidate" -e "invite_candidate" -- . ':!.planning' ':!CLAUDE.md'` | 1 | none |
| `git grep -c -F "inviteUserByEmail" -- . ':!.planning'` | 0 | 11 lines in 5 files under `tests/tests/` |
| `node 174-verdict.mjs greps --only 1,3,4` | 0 | PASS on the committed tree |
| `node 174-verdict.mjs exemptions` | 0 | PASS: one entry, both count sentences agree |

**The fourth search literal is not cleared by this plan and is cleared by 174-09.** `inviteUserByEmail` remains in `tests/tests/utils/supabaseAdminClient.ts` (6 lines, the helper `sendEmail`), `specs/perm/perm-localisation-positive.spec.ts` (2), `specs/contestant/contestant-journey.spec.ts` (1), `utils/contestantJourneyConstants.ts` (1) and `setup/perm/perm-localisation-positive.teardown.ts` (1).

### What remains that speaks of inviting, and why it stays

- `CLAUDE.md`, two sentences: the operator's file (PROH-174-01). Quoted below with replacements.
- `supabaseDataWriter.ts`, `_checkRegistrationKey` and `_register`: "Supabase uses invite-based registration", the thrown message "Use invite-based registration." and "Invite session already established by auth callback's verifyOtp". The registration-key members stay exactly as they are; Phases 178 and 179 own them.
- `apps/frontend/src/routes/api/auth/callback/+server.ts`: the `invite` arm and its docblock line. 174-09 removes the arm.
- `apps/frontend/src/routes/contestant/register/password/+page.svelte`: the "Invite flow" branch. Phase 178's.
- `account-access/index.ts` and its conformance test: `generateLink({ type: 'invite' })`, which is how a first-time invitee's user is created without a password. Not the deleted function.
- The E2E helper and its callers, above: 174-09's.

## Each gate edit, with its reason

| Gate | Edit | Reason |
| --- | --- | --- |
| `scripts/assert-edge-env-defaults.mjs`, `DUPLICATED_MODULES` | `['envConfig.ts', 'jwtSegment.ts', 'callerAuthority.ts']` → `['envConfig.ts']` | `jwtSegment.ts` and `callerAuthority.ts` exist once each after the deletion, and check 2 fails a listed name with fewer than two copies. `envConfig.ts` has three copies and stays. No check changed |
| the same file, docblock and the comment above the list | present tense; no function is named as the origin of the class; check 2's line says `envConfig.ts` exists once in each of the three directories; the comment names `index.ts` and `flowConformance.test.ts` as the repeated basenames that must differ | the old text named the deleted function twice and described two-copy modules that have one |
| `send-email/flowConformance.test.ts` | the test `shares ONE gate module with invite-candidate, byte for byte` removed | it read a file that does not exist; there is no second copy to compare. The other 15 tests are unchanged |
| `scripts/assert-project-scoped-queries.mjs`, `PROJECT_SCOPED_EDGE_FUNCTIONS` | the entry `'invite-candidate': 'requires a project term'` removed | the function is gone. `send-email`, `account-access` and `identity-callback` keep their entries |
| the same file, the comment above the map | "because the live call sites use both spellings" → "and accepts either spelling" | the one camelCase call site was the writer method Task 1 removed; the check still accepts both keys |
| `scripts/fixtures/project-scoped-queries/clean.fixture.ts` | two `invoke('invite-candidate', …)` lines name `account-access`; two comment lines that spoke of "live call sites" reworded | the fixture invokes a function that has a disposition; line count 4 added, 4 removed |
| `scripts/fixtures/project-scoped-queries/violation.fixture.ts` | one `invoke('invite-candidate', …)` line names `account-access` | the same; 1 added, 1 removed. The self-test's expected counts did not move (41 lines flagged in the violation fixture) |
| `packages/dev-seed/tests/projectScopingGate.test.ts` | the loop's list is `['identity-callback', 'send-email', 'account-access']` | the three functions that exist |
| `scripts/assert-no-candidate-app-names.mjs`, `EXEMPT` | the entry `/invite-candidate/g` deleted; "exactly two entries" → "exactly one entry" in the docblock and above the array | the thing the entry masked is gone. One entry remains: the three names the app shows for itself |

## The fixture lines of the name gate

**Four lines named the function, not three** (the name map's count; the plan's action lists three). Each is edited in place:

| Line | Before | After |
| --- | --- | --- |
| 91 | `// @as apps/supabase/supabase/functions/invite-candidate/index.ts` | `// @as apps/supabase/supabase/functions/account-access/index.ts` |
| 94 | `const e02 = functions.invoke('invite-candidate') && data.candidateUserData;` | `const e02 = functions.invoke('account-access') && data.candidateUserData;` |
| 108 | `const n11 = functions.invoke('invite-candidate');` | `const n11 = functions.invoke('account-access');` |
| 109 | `import n12 from '../invite-candidate/callerAuthority.ts';` | `import n12 from '../account-access/envConfig.ts';` |

`git diff --numstat` over the fixture: 4 added, 4 removed. **The expected file did not change.** `--self-test`: "82 finding(s) on the fixture, 82 expected", before the edit and after it. Lines 92 and 94 are still reported (`candidateApp`, `candidateUserData`), and lines 108 and 109 report nothing. The gate over the tree: 2798 tracked files, 0 findings, so the checkpoint the plan reserves for a finding in `CLAUDE.md` was not needed.

## The unit totals, file by file

Supabase functions: **21 files and 499 tests before, 18 files and 462 tests after** (`yarn vitest run --reporter=json` in `apps/supabase`, both times exit 0).

| File | Before | After |
| --- | --- | --- |
| `invite-candidate/entityGrant.test.ts` | 11 | gone (its byte-identical twin stays in `identity-callback`, 11) |
| `invite-candidate/flowConformance.test.ts` | 19 | gone with the handler it read |
| `invite-candidate/jwtSegment.test.ts` | 6 | gone (`send-email/jwtSegment.test.ts`, 6, stays) |
| `invite-candidate/callerAuthority.test.ts` | 23 | moved: `send-email/callerAuthority.test.ts`, 23 |
| `invite-candidate/envConfig.test.ts` | 5 | moved: `send-email/envConfig.test.ts`, 5 |
| `send-email/flowConformance.test.ts` | 16 | 15 |
| the other fifteen files | 419 | 419 |

499 − 36 − 1 = 462, and 21 − 3 = 18. Frontend: 2546 passed and 7 skipped → **2543 passed and 7 skipped** (the three cases of the removed member; 159 files passed and 1 skipped, as before). dev-seed 68 files and 1030 tests, app-shared 10 and 141, data 47 and 244: unchanged.

## Closing evidence

**The restart** (Task 2): `yarn db:stop` exit 0, `yarn db:start` exit 0, the output of neither kept. Then:

```
OPTIONS invite-candidate -> 404
OPTIONS account-access -> 200
OPTIONS identity-callback -> 200
OPTIONS send-email -> 200
OPTIONS r174-probe -> 404
170-allowlist-probe.sh [after]: every row OK      (exit 0)
174-stack-probe.sh [after]: every row OK          (exit 0)
174-mail-probe: PASS                              (exit 0, eight steps)
```

**Gate set `174-07-close`**: `tests/e2e-runs/174-gates/174-07-close`, driver exit 0, first attempt, head `340e1a0a1`, 2026-10-07 14:13:09 to 14:16:37 local, AC power, under `caffeinate -dimsu`. `power.txt`: `sleep_entries_in_window: 0`. No void marker exists in the directory.

| Row | Status | Seconds |
| --- | --- | --- |
| typecheck | 0 | 19 |
| lint | 0 | 46 |
| db-reset | 0 | 29 |
| types-regen | 0 | 2 |
| types-clean | 0 | 0 |
| pgtap | 0 | 5 |
| sql-lint | 0 | 3 |
| unit | 0 | 59 |
| check-frontend | 0 | 8 |
| build | 0 | 16 |
| format | 0 | 18 |
| docs-links | 0 | 1 |
| name-gate-self-test | 0 | 0 |
| auth-config | 0 | 0 |
| stack | 0 | 2 |

`node 174-verdict.mjs gates 174-07-close` exits 0: "rows: 15 expected (the full gate set), 15 recorded", "not stale: head 340e1a0a1 is tree-equal to HEAD outside .planning/", "power: no Sleep entry inside the run window", "PASS". From the rows' logs: pgTAP 39 files and 1706 tests, `Result: PASS`; the schema linter "policies examined: 107, tables partitioned: 21, permission members: 23 (row-level-security tables in public+storage: 31)", `0 error(s), 3 warning(s)`; `auth-config` "3 key(s) hold"; `stack` "every row OK". `node 174-verdict.mjs hygiene` exits 0: 0 hits, the same two advisory lines as at the baseline.

**The production build is one of the fifteen rows** (`build`, `yarn build`, status 0), so the removal is held by a build as well as by the typecheck and the unit suites.

**After the close:** `yarn db:seed:default` exit 0 (752 rows); `170-allowlist-probe.sh after` exit 0 and `174-stack-probe.sh after` exit 0 once more; `OPTIONS` 404 from `invite-candidate` and 200 from the three functions.

**No E2E run closed this plan.** It removes a function, a writer member, gate entries and comments that nothing in the suite reaches. The full default run that closes 174-08 is its boundary proof; a failure there in which a function's endpoint answers 404 or the edge runtime does not answer points back to this plan (recorded in the name map).

## Decisions Made

- **The two tests move.** See Deviations 1.
- **The fixtures of the project-scoping gate keep their request bodies.** Only the function name changes on each line, so no count the gate's self-test or the dev-seed test pins could move.
- **The docs say where a mailed link lands at this commit.** The callback has no `magiclink` arm; a verified link of that type takes the `default` arm to the Contestant App home, and nothing calls the claim. The invitation page says so in a short section, "Callers", which 174-10 replaces once 174-08 has wired the entry points.
- **No sentence on undeploying the function from a hosted project is written**, although the research lists one: nothing is deployed, and the project's ruling of 2026-10-04 drops hosted-upgrade obligations.
- **`requirements-completed` lists INV-01 and INV-03 for their removal half**: no account and no grant can come into being through the old path. The entry points that claim and refresh are 174-08's.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical] The only tests of two modules that remain would have been deleted with the directory**
- **Found during:** Task 2
- **Issue:** `callerAuthority.test.ts` (23 tests: the fail-closed edges of the `user_can` gate `send-email` stands on) and `envConfig.test.ts` (5 tests of `requireEnv`, which all three functions use) existed in `invite-candidate/` only. The plan deletes the directory's ten files. `send-email/callerAuthority.ts` and all three copies of `envConfig.ts` would have been left with no unit test. The name map's note 8 flags this for 174-07; the plan's action does not act on it.
- **Fix:** Both files moved to `send-email/` with `git mv`, content unchanged, in the commit that deletes the directory. Each imports its module by a relative specifier, so nothing in either changed. Eight files are deleted and two moved.
- **Files modified:** `apps/supabase/supabase/functions/send-email/callerAuthority.test.ts`, `…/envConfig.test.ts`
- **Commit:** `287a2b97d`

**2. [Rule 1 - Bug] Sentences made false by the deletion that the literal search does not find**
- **Found during:** Tasks 2 to 4
- **Issue:** Seven sentences spoke of the deleted function's behaviour or of two-copy modules without naming the function: the "live call sites use both spellings" comment of the project-scoping gate and two of its fixture's comments; `send-email/templateVars.ts` ("unlike `jwtSegment.ts` and `envConfig.ts`"); `identity-callback/entityGrant.test.ts` ("a candidate who received an invite"); the `envConfig.ts` docblock's paragraph on invite links; the docs architecture page ("candidate invitations … run as Edge Functions") and the environment-variables page (`SITE_URL` for "invitation links", SMTP for `send-email` alone); and the email page's "`enable_confirmations = false`", false since 174-03.
- **Fix:** Each reworded in present tense in the commit of the task that owns its file. Five of these files are outside the plan's file list: `send-email/templateVars.ts`, `identity-callback/entityGrant.test.ts`, the two docs pages named, and the two fixtures' comment lines.
- **Commits:** `287a2b97d`, `d773474ba`, `be12bbed4`

### Verify commands that could not pass as written

**3. Task 1's verify ends with `174-verdict.mjs greps --only 3`, which fails until Task 4.** On Task 1's commit it reported 2 hits of `preregisterWithApiToken`, both in the docs pages Task 4 rewrites. Every other term of Task 1's verify exited 0, and its acceptance criteria, which search `apps/frontend packages tests`, held. The verdict passed on Task 4's commit (`greps --only 3,4`, exit 0). Nothing was changed to make it pass earlier.

**4. Task 4's verify term `bash .claude/scripts/audit-skill-links.sh database` exits 1, and exited 1 before this plan.** Confirmed, not inferred: `extension-patterns.md` (11 dangling) and `rls-policy-map.md` (5) are unchanged since the plan's start and are reported; `SKILL.md` had 16 dangling citations before this plan's edit of it and has 14 after, none written by this plan (its four new citations are repo-relative; the two that went named the deleted directory). The findings are the corpus's package-relative citations (`schema/302-rls.sql`, `functions/send-email/templateVars.ts`) and permission names read as paths (`feedback.read`). Not repaired here: thirty citations in three files, two of which this plan does not touch. **174-10's Task 2 has the same command in its verify and will meet the same exit 1.** Every other term of Task 4's verify exited 0.

### Additions and differences

- **Four fixture lines, not three**, in the name gate's fixture (above).
- **The `@as` directive's import twin names `envConfig.ts`**: the plan asks for "a module that exists there", and `account-access/` has no `callerAuthority.ts`.
- **The database skill gains a dated "Updated 2026-10-07" paragraph**, as its earlier updates have, and two sentences of its older review notes name the three directories that exist. Its counts and the definer census of § 8c are left for 174-10, as the plan directs.
- **The docs workspace has its own Prettier.** The root `prettier --check` ignores `apps/docs`; the two pages with new tables were formatted with `yarn workspace @openvaa/docs prettier --write`, which changed table rows only (no prose line), before the docs commit. No separate reflow commit was needed.
- **`apps/frontend/…/supabaseDataWriter.test.ts` keeps `functions: { invoke: vi.fn() }` in its mock client** although no remaining test uses it: 174-08 adds the writer methods that invoke `account-access` and their cases in this file.

**Total deviations:** 2 auto-fixed (1 missing critical, 1 group of stale sentences), 2 verify terms that could not pass as written, the differences listed above.

## Issues Encountered

None. No gate, unit run or probe was red on a tree meant to be green, no run was void, and nothing was repeated after a red. The two failing verify terms above failed for reasons that precede their tasks' changes.

## Observations for the operator

- **`send-email/jwtSegment.ts` is imported by no `index.ts`.** `decodeJwtSegment` has no caller in the functions tree; with its sibling copy gone, the module's only reader is its own test. Left in place: removing it is outside "comments and the one test" (PROH-174-19). The skill says so.
- **`scripts/assert-edge-env-defaults.mjs` names a constant `NOT_DUPLICATED` in its "NO OPT-OUT" paragraph that the file does not declare.** Not caused by this plan and not edited.
- **`publishers-guide/preparing/candidates-and-parties-data-be`** says candidates "can be added to the VAA and sent an invitation email, with which they set a password", and **`publishers-guide/app-settings`** says "Invitations sent by an administrator keep working". Under the model at this commit, creating an invitation sends nothing and the invited person asks for a link. Neither page names the function; neither was edited.
- **`apps/supabase/README.md` § Tests still says "11 pgTAP files"** (39 at the last gate run). A count; 174-10 re-measures.
- **The name map's row "Auth callback and its arms" says anything else goes to the login page.** A verified link of an unlisted type goes to the Contestant App home (row G6 of the name map).

## `CLAUDE.md` read against the tree

`CLAUDE.md` was not edited (`git diff --stat b43946d0f..HEAD -- CLAUDE.md` prints nothing). **Two sentences of it are false:**

> - **Edge Functions**: `apps/supabase/supabase/functions/` — `identity-callback`, `invite-candidate`, `send-email`

The directory holds `account-access`, `identity-callback` and `send-email`, and `OPTIONS /functions/v1/invite-candidate` answers 404. Replacement:

```
- **Edge Functions**: `apps/supabase/supabase/functions/` — `account-access`, `identity-callback`, `send-email`
```

> - **Auth**: cookie-based sessions with PKCE; candidates authenticate via Supabase Auth; candidate pre-registration goes through the `invite-candidate` Edge Function; bank authentication via OpenID Connect (Signicat), IdP settings in `.env`, completed by the `identity-callback` Edge Function

No such function exists, and nothing pre-creates a user or a grant for an invited person. Replacement:

```
- **Auth**: cookie-based sessions with PKCE; candidates authenticate via Supabase Auth; an invitation is a row of `public.invitations` that promises a grant — `create_invitations` creates it and sends nothing, the `account-access` Edge Function mails a sign-in link when one is asked for, and `claim_invitations` writes the promised grants for the signed-in user's own confirmed address; bank authentication via OpenID Connect (Signicat), IdP settings in `.env`, completed by the `identity-callback` Edge Function
```

Read and still true: § _Development Environment_ on `PUBLIC_PROJECT_ID` ("The `identity-callback` Edge Function reads the same variable under the same name"). `send-email` reads it too and `account-access` reads none, so the sentence is true and names one of two readers. § _Skill Routing_ names no function.

## Review against the checklist

Read against `.agents/code-review-checklist.md`, the general items and § _Edge Functions_.

- **`any`:** none added.
- **Dead code:** the removed member leaves no caller, no import and no type behind (`Id` in both writer files is still used by `preregisterWithIdToken`). One unused mock member and one unimported module are named above.
- **Comments:** every comment changed under `apps/`, `packages/` and `scripts/` is in present tense and carries no decision, requirement or review id (`yarn assert:comment-hygiene` exits 0; the changed paragraphs were read). Paragraphs this plan did not change keep their earlier wording, history included.
- **Documentation:** the docs site, the README and the skill are updated in this plan; exported symbols are unchanged.
- **Behaviour:** `send-email/index.ts` differs by one comment line; no statement, import, assertion or exported symbol of any function changed in Task 3 (one test title lost the word "shared").

## Threat Flags

None. The plan removes a service-role surface and adds none.

## Known Stubs

None.

## User Setup Required

None on this host. On any other host the stack is restarted once after pulling this plan (`yarn db:stop`, `yarn db:start`), or `invite-candidate` keeps being served from the running edge runtime.

## Next Phase Readiness

- The stack is up, restarted once, and serves three functions. The gate set reset the database and `yarn db:seed:default` was run after it (exit 0, 752 rows). The mail catcher holds the one mail of the mail probe. No dev server is running and nothing listens on 5173 or 5273.
- 174-08 adds the first `functions.invoke('account-access', …)` under `apps/frontend/src`; the gate entry exists, and the argument must carry `project_id` or `projectId`.
- 174-09 clears the fourth literal and removes the callback's `invite` arm; the registration docs page's sentence about that arm then needs to go, and no later plan lists that page.
- 174-10 meets the red skill link audit (Deviation 4) and replaces the invitation page's "Callers" section.

## Self-Check: PASSED

- Files: `apps/supabase/supabase/functions/invite-candidate` does not exist; `send-email/callerAuthority.test.ts` and `send-email/envConfig.test.ts` exist; the three copies of `envConfig.ts` compare equal.
- Commits: `25132e40b`, `287a2b97d`, `d773474ba`, `be12bbed4`, `340e1a0a1` and `bb86956e7` are ancestors of HEAD; `git rev-list --count b43946d0f..HEAD` printed 6 when this file was written.
- Evidence: `tests/e2e-runs/174-gates/174-07-close` exists, holds no void marker, and its verdict exits 0 on HEAD; the two verdict files, the three probe files of Task 2 and the two probe files of the close exist.
- Working tree: `git status --short` shows only the operator's untracked `CAND-APP-PLAN.md`.
