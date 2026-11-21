---
phase: 178-sign-in-email-code-registration
plan: 23
subsystem: docs
tags: [legacy-removal, i18n, docs, skills, todos, e2e]

requires:
  - phase: 178-sign-in-email-code-registration
    provides: "plan 178-22: the predecessor run 178-22-close (530 tests, 123 projects) and the passwordless session; plans 178-04 to 178-21: everything the documents now describe"
provides:
  - "the writer, the universal writer, the Supabase adapter and the contestant context without checkRegistrationKey, register, CheckRegistrationData, the two forwards and newUserEmail"
  - "eleven message keys removed from seven catalogues, the key type regenerated"
  - "the docs site, two READMEs, tests/README.md and two skills describing the entry flow, the recovery mail, the registration-mode condition, the auth settings, the known residuals and what the set-password gate does not cover"
  - "ten todos closed, five updated, seven filed"
affects: [178-24, 179]

actuals:
  tokens: 59600
  tasks: 3
  commits: 4
plan_head_before: 447a307e5101ca034ec73346ff75aff59e5bc68b
plan_head_after: 397e2b0c3a49e204d737daf84ac8158a859e9e17

tech-stack:
  added: []
  patterns:
    - "A message key leaves the catalogues only after a search for the full key and for its last segment beside its namespace finds no reader"

key-files:
  created:
    - .planning/todos/pending/2026-10-16-178-confirmation-page-between-a-mailed-link-and-its-verification.md
    - .planning/todos/pending/2026-10-16-178-entry-screens-with-two-browsers-and-one-password-manager.md
    - .planning/todos/pending/2026-10-16-178-browser-suggested-passwords-against-the-rule-list.md
    - .planning/todos/pending/2026-10-16-178-the-entry-flow-by-keyboard-and-with-a-screen-reader.md
    - .planning/todos/pending/2026-10-16-178-entry-flow-strings-at-320-px-in-six-locales.md
    - .planning/todos/pending/2026-10-16-178-control-edge-contrast-on-the-shaded-page.md
    - .planning/todos/pending/2026-10-16-178-sixty-five-seconds-against-the-servers-sixty.md
  modified:
    - apps/frontend/src/lib/api/base/dataWriter.type.ts
    - apps/frontend/src/lib/api/base/universalDataWriter.ts
    - apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts
    - apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.test.ts
    - apps/frontend/src/lib/contexts/contestant/contestantContext.svelte.ts
    - apps/frontend/src/lib/contexts/contestant/contestantContext.type.ts
    - apps/frontend/messages/*/contestantApp.{login,register,resetPassword,setPassword}.json (28 files)
    - apps/frontend/src/lib/types/generated/translationKey.ts
    - "apps/docs/src/routes/(content)/developers-guide/** (15 pages) and publishers-guide/** (2 pages)"
    - apps/frontend/src/routes/contestant/README.md
    - apps/supabase/README.md
    - tests/README.md
    - tests/playwright.config.ts (comments only)
    - .claude/skills/components/SKILL.md
    - .claude/skills/components/context-reactivity.md
    - .claude/skills/database/SKILL.md
    - .claude/skills/database/schema-reference.md
    - .claude/skills/database/rls-policy-map.md

key-decisions:
  - "The registrationKey hit in registrationGuard.test.ts (an arbitrary request parameter the guard must drop) is kept: the execution rules exclude test files from a negative search, and renaming it would bend a test to a search. Task 1's verify was restated with ':!*.test.ts' in that one stage"
  - "The authentication page lists four Known residuals, because the findings read P7: difference; the fourth carries the three measured triples"
  - "The auth service's one-time-code endpoint residual moved from 'What this does not protect against' to 'Known residuals', with its sentence on the auth service's own mail removed (the hook stops it)"
  - "Pages beyond the frontmatter's list were edited where the search or the dispatch worklist found them out of date (listed under Deviations)"
  - "J1 (answered (b)), PL-29 (answered (a)), U-30 and the other items this plan builds on were read by the operator on 2026-10-11 and stand at their recommended options"

requirements-completed: [REG-09, REG-13, FIX-01]

coverage:
  - id: T1
    description: "The legacy contracts, the context's dead members and the eleven dead keys are gone; the D-24 searches find nothing outside .planning/ and the spike-findings skill, registrationKey only in Phase 179's tree and one test"
    requirement: REG-14
    verification:
      - kind: unit
        ref: "yarn workspace @openvaa/frontend test:unit (228 files, 4961 tests) and check (0 errors) at ce9fa73a7"
        status: pass
      - kind: other
        ref: "tests/e2e-runs/178-unit/178-23-t1-verify-r2.sh at ce9fa73a7"
        status: pass
    human_judgment: false
  - id: T2
    description: "The docs, READMEs and skills describe the tree; Known residuals (four) and What the set-password gate does not cover exist; the hosted settings name minimum_password_length and otp_expiry"
    verification:
      - kind: other
        ref: "tests/e2e-runs/178-unit/178-23-t2-verify.sh at bf3218bd3"
        status: pass
    human_judgment: false
  - id: T3
    description: "The todos closed, updated and filed; seven gate rows and the full run green"
    verification:
      - kind: e2e
        ref: "tests/e2e-runs/178-e2e/178-23-close (530 of 530, 123 projects)"
        status: pass
    human_judgment: false

duration: "2026-10-15 21:43Z to 22:47Z"
completed: 2026-10-16
status: complete
---

# Phase 178 Plan 23: The Legacy Registration Path Removed, and the Documents, Skills and Todos Brought in Line — Summary

**The writer's registration-key contract, the context's two forwards and `newUserEmail`, and the eleven message keys only the
legacy pages read are gone. The docs site, the two READMEs, `tests/README.md` and two skills now describe the entry flow, the
recovery mail, the registration-mode condition and the auth settings a hosted project must match, with four residuals stated as
open. Ten todos are closed, five updated, seven filed. The closing run `178-23-close` is green: 530 of 530 in 123 projects, every
project equal to `178-22-close`.**

## Read this first

- **Complete.** Three tasks, four commits, the gate rows and the full run green on the first attempt. No run was void.
- **One verify stage had a defect and was restated** (Task 1, the `registrationKey` stage): it does not exclude test files, which
  the execution rules require of a negative search. Both statuses are below.
- **A pgTAP run did not complete** (a measurement this plan added, not one of its gates): the `pg_prove` image is absent from the
  Docker VM and its pull hung for 16 minutes. **Plan 178-24's pgTAP row will meet the same pull.** See "The database".
- **`CLAUDE.md` holds one sentence this phase made false**; it is quoted with its replacement below, not edited.

## Task Commits

| # | Commit | Subject |
|---|---|---|
| 1a | `8ba4e0914` | refactor(178-23): the legacy registration contracts and the context's dead members leave the tree |
| 1b | `ce9fa73a7` | chore(178-23): the message keys only the legacy pages read leave seven catalogues |
| 2 | `bf3218bd3` | docs(178-23): the entry flow, the recovery mail, the registration-mode condition and the auth settings a hosted project must match |
| 3 | `397e2b0c3` | docs(178-23): the todos this phase closes, updates and files |

`commits: 4` is `git rev-list --count 447a307e5..HEAD` before this summary's commit.

## Task 1: what left the code

- **The writer contract** (`dataWriter.type.ts`): `checkRegistrationKey`, `register` and the type `CheckRegistrationData`.
- **The universal writer**: the two public methods and their abstract `_checkRegistrationKey` and `_register`.
- **The Supabase adapter**: `_checkRegistrationKey` (which threw) and `_register` (which set the password on the session), with
  the import; the unit cases `register` (two) and `checkRegistrationKey` (one) of `supabaseDataWriter.test.ts`.
- **The contestant context**: the forwards `checkRegistrationKey` and `register` and their two type members; `newUserEmail` in its
  four places (the private field, its line in `#reset`, the getter and setter, the type member).
- The integration test and the context's test file named none of them, so neither was edited. No reader was found under any
  removed name before the removal.

### The message keys, against the contract's list

Each was searched for by its full key and by its last segment in the files that name its namespace (outside the catalogues, the
generated key type and `.planning/`). Then every key of the four namespaces went through the same search.

| Key | Reader found | Disposition |
|---|---|---|
| `contestantApp.login.haveRegistrationCode` | none | removed |
| `contestantApp.register.codePlaceholder` | none | removed |
| `contestantApp.register.goToLoginLabel` | none | removed |
| `contestantApp.register.loggedInWarning` | none | removed |
| `contestantApp.register.titleWithPreregistration` | none | removed |
| `contestantApp.register.wrongRegistrationCode` | none | removed |
| `contestantApp.resetPassword.emailSentText` | none | removed |
| `contestantApp.resetPassword.error` | none (the segment hits are `log.error` and `status = 'failed'`) | removed |
| `contestantApp.resetPassword.failed` | none (the hit is `status === 'failed'`) | removed |
| `contestantApp.setPassword.passwordSetSuccesfully` | none | removed |
| `contestantApp.setPassword.registrationError` | none | removed |
| `contestantApp.register.passwordValidation.commonPatterns` | **none** | **kept**, by the plan's carve-out for everything under `passwordValidation` |
| `contestantApp.error.registrationLocked` | `preregister/+layout.svelte` | kept |
| `error.loginFailed` | the Admin App's login | kept |

Every other key of the four namespaces has a reader. No key beyond the contract's eleven was removed. Each catalogue lost the same
keys, so the seven hold one key set; `generate:translation-key-type` dropped 11 members; the namespace gate reads 0.

### The searches of D-24 (outside `.planning/`)

- `toCallbackUrl`, `checkRegistrationKey`, `CheckRegistrationData`, `resetPasswordForEmail`, `ContestantAppSetPassword`: **no hit**.
- `newUserEmail`: two hits, both in the spike-findings skill's record of a past spike (ruling 6, not edited):
  - `.claude/skills/spike-findings-voting-advice-application-gsd/references/consumer-migration-codemod.md:106`
  - `.claude/skills/spike-findings-voting-advice-application-gsd/sources/009-store-codemod-feasibility/spike-009-store-codemod.mjs:73`
- `registrationKey`, every remaining hit:
  - `apps/frontend/src/routes/contestant/preregister/(authenticated)/email/+page.svelte` — **Phase 179's** tree.
  - `apps/frontend/src/lib/server/contestant/registrationGuard.test.ts:185` — a test that the guard's redirect carries no
    parameter "whatever the request carries", with `registrationKey=abc` among the parameters. Not Phase 179's and not a reader of
    the old path: it sends the old parameter and asserts it is dropped. Kept (see the verify table).
  - No hit under `api/contestant/`, `identity-callback/` or the docs.

## Task 2: the documents

Pages named by the plan, each rewritten where it described something this phase changed:

- `contestant-app/registration` — rewritten whole: the entry screens and their route keys, the login screen, what lists a
  registration mode, the guard of the registration routes, registering by email and with a code step by step, the "email sent"
  screen and its 65-second count, the entry flow's state and a reload, the set-password gate, the terms of use, the writer's
  methods. The registration-key contract section is gone.
- `contestant-app/login-and-password-reset` — the sign-in screen's one sentence per refusal status and its link button; the code
  sign-in action; password reset through `request-recovery`, the reset page decided by the session; a link's type as a landing
  hint; the callback's table with the three refused types.
- `contestant-app/pre-registration-and-invitation` — a new section "The registration modes" (the condition, which functions ask
  it, which rows are judged, a project with no matrix); the link-request table and the `unknown` answer; the entry-point table;
  "What this does not do" no longer says the modes are not consulted or that no page calls the anonymous operations; the tests
  paragraph names the new projects.
- `backend/authentication` — the callback's arms; the hook's entry routes; three more pinned auth keys with what the length binds;
  **`## Known residuals`, four items** (the one-time-code endpoint, `P6-OTP`; a link spent by a scanner; a session that sets a
  password without the current one; the password sign-in's timing, with the three triples of `P7`); **`## What the set-password
  gate does not cover`** (a view of the protected layout; the data API; the Admin App, item PL-29; the routes outside
  `(protected)`); `password_set` on `get_user_entities`.
- `backend/email` — two mails from `account-access`, none from the auth service; the hook; a section on the recovery link.
- `backend/edge-functions` — the fourth operation, its wire and its discipline; the callers' table; `code-sign-in` asks no matrix.
- `deployment` — the hosted settings table (`enable_signup`, `enable_confirmations`, `minimum_password_length` 8, `otp_expiry`
  3600, the Send Email hook), that the repository cannot enforce any of them, and P5 beside the length.
- `frontend/contexts` — the AuthContext and ContestantContext rows; the stable and reactive lists.

**Pages edited beyond the listed ones** (found by the search or the dispatch worklist): `configuration/app-settings` (four public
values), `contestant-app/entity-selection` (`password_set`), `contestant-app/password-validation` (8 characters, the address as
`username`, `validate()`), `contestant-app/bank-authentication` (reached through the selector), `frontend/intro` (the entry routes),
`publishers-guide/app-settings` (the sentence that an invitation is not a registration mode is replaced; the `email` mode is now
offered), `publishers-guide/preparing/candidates-and-parties-data-be` (the link is asked for in the app; the mode an invitation
needs). Outside the docs site: `tests/README.md` (seven project rows, the entry flow's steps, the closed-project paragraph, the
passwordless session, the scan counts and entries, `registerAndStoreSession`) and three project comments of
`tests/playwright.config.ts` (`auth-setup`'s readers, the candidate session's readers, `contestant-email-registration`).

Not edited, read and found true: the a11y wiring gate's "eleven source files" and "none of the nine" (seven specs and two helper
modules in check 4a, plus the config and `axeScan.ts`); `data-api-and-adapters`' sentence on the adapter-boundary allowlist (it
names no entry); no docs page counts the `$app/*` stubs or the namespace files.

### The READMEs

- `apps/frontend/src/routes/contestant/README.md`: links to the two pages; a section "The entry flow" with the route table, the
  flow state, the guard of the registration pages, the entry routes and the gates in order (`setPassword`, `termsOfUse`).
- `apps/supabase/README.md`: the auth keys table (`minimum_password_length`, `otp_expiry`, the hook), the restart a changed
  `[auth]` key or hook needs (a reset does not serve it), `request-recovery`, the registration-mode condition and the functions
  this phase added by file. The paragraph on a function's source and the restart now states both measurements (old code served
  after an edit; an edited source served before a restart) and relies on neither.

### The skills, each count with its command

| Count | Before | After | Command |
|---|---|---|---|
| components convention 1: files calling `$props()` / co-located `*.type.ts` | 105 / 105 | 112 / 112 | `git grep -l -F '$props()'` over the three directories' `*.svelte`; `git ls-files` of the directories filtered to `*.type.ts` |
| components convention 1: `export let`, `$$Props`, `<slot` | 0, 0, 0 | 0, 0, 0 | the same greps |
| components convention 3: `concatClass` dependents, three directories / all of `apps/frontend/src` | 62 / 67 | 70 / 75 | `git grep -l -F concatClass`, less `components.ts` and its test (the command reproduces 62 and 67 at `d44b3844c`) |
| database: pgTAP files | 44 | 45 | `git ls-files 'apps/supabase/supabase/tests/database/*.test.sql'` |
| database: pgTAP assertions planned / in a run | 2303 / 2312 | 2426 / 2435 | the `plan (N)` sum; the run line of `tests/e2e-runs/178-gates/178-20-close` (`cc2651c32`; no test or schema file changed since) |
| database: lines of the pgTAP files | 46,693 | 49,122 | `cat` of the 45 files into `wc -l` |
| database: schema files, migration files | 29, 1 | 29, 1 | `git ls-files` |
| database: definer censuses and the hook census | 6 / 10 | 6 / 10 / 9; 2 | the literal lists of `07-rpc-security.test.sql` § 8c and § 8d |

Also in the skills: components convention 6 names the entry scans and the phone checks; `context-reactivity.md` § 1a gains the
seven entry-flow functions and loses `register`, § 1b gains `entryFlow` and loses `newUserEmail`; the database skill's § 2 (the
mail hook), § 4 (three censuses; the fourth public value), § 9 (`password_set`), § 10 (the registration-mode condition,
`recovery_link_request`), Service Patterns § 1 (the fourth operation), pgTAP § 1 (file 39 `plan (329)`, file 07 `plan (44)`,
test 238), a freshness entry; `schema-reference.md` (rows for `send_email_hook`, `caller_password_set`, `user_password_set` now in
301, the two `registration_mode_allowed` functions, `recovery_link_request`, `invitation_mode_allowed`,
`email_holds_grant_in_project`; the four public values); `rls-policy-map.md` (four values, two places).

The re-check lists were walked: no component changed, so `generate:docs` left the listing as it was (exit 0, no file changed);
`validate:links --check` exit 0; `audit-skill-links.sh components` exit 0; `audit-skill-links.sh database` **exit 1, 30 dangling
citations, every one present at `178-BASE`** (the 14 of `SKILL.md` were each checked against the base copy; the others are in
files whose citations this plan did not touch).

## Task 3: the todos

- **Closed** (moved to `done/`, each with `## Resolution` naming the plan and the test): the forgot-password PKCE todo, the
  hide-input todo, `password-reset-code-method.md`, `toCallbackUrl`, the callback's signup and email arms, the claim-and-refresh
  pair, the validator's username, the newest-link todo (with what stays: no "send a new link" button on the error landing; the
  third party's invalidation documented), the local mail-link todo (checked against the tree: the function builds its link from
  `SITE_URL` alone), and the registration-flow refactor, whose Resolution maps every row and item; each is held by a phase, a
  requirement (REG-04, REG-06, REG-09, REG-14, NOM-03 to NOM-08, REG-F01, REG-F02) or a pending todo, so no todo was filed for it.
- **Updated, left pending**, each with a dated section: identity-provider accounts (J2; Phase 179), the first-time invitee with
  no contestant grant (U-13; the two ways in still differ; no browser case), the one-time-code endpoint (`P6-OTP`), the hosted
  settings (the length, `otp_expiry` and the hook added), the native-speaker review (the 44 keys of plan 178-08 in six locales,
  the six `passwordNotValid` sentences of 178-11, `enterCode` and `code` of 178-16, the three rewordings of 178-18, the oddities;
  the mails' sentences of 178-06 were already there).
- **Filed** (`2026-10-16-178-…`): the confirmation page (U-30, with the research's evidence); two browsers and one password manager
  (N-6); browser-suggested passwords (N-7); keyboard and screen reader in `en`; the strings and long labels at 320 px in six
  locales; a control's edge against 3:1 (N-8); 65 seconds against 60. A todo filed before this plan,
  `2026-10-15-178-check-whether-password-sign-in-timing-can-be-exploited.md`, holds P7's follow-up and was left as it is.

## Each verify, with its real exit status

| Task | Script | Head | Exit | Note |
|---|---|---|---|---|
| 1, as written | `tests/e2e-runs/178-unit/178-23-t1-verify.sh` | `ce9fa73a7` | **1** | the `registrationKey` stage printed `registrationGuard.test.ts` |
| 1, restated | `178-23-t1-verify-r2.sh` | `ce9fa73a7` | **0** | that stage with `':!*.test.ts'`, as the execution rules' negative searches have it; every other stage byte for byte |
| 2, as written | `178-23-t2-verify.sh` | `bf3218bd3` | **0** | |
| 3, as written | `178-23-t3-verify.sh` | `397e2b0c3` | **0** | includes both verdicts |

Ad hoc before the commits: the frontend's `check` 0 (2259 files, 0 errors), `test:unit` 0 (4961 passed, 31 skipped),
`assert:i18n-catalog-namespaces` 0, `assert:comment-hygiene` 0 (twice), `eslint` on the six code files 0, `prettier --check` on
every changed document 0.

## The gate rows

| Run | Head | Rows | Verdict |
|---|---|---|---|
| `178-gates/178-23-close` | `397e2b0c3` | typecheck 0 (23 s), lint 0 (58 s), unit 0 (81 s), check-frontend 0 (10 s), build 0 (18 s), format 0 (21 s), docs-links 0 (2 s) | `gates --rows …`: PASS, not stale, no Sleep entry |
| `178-gates/178-23-skill` | `ce9fa73a7` | db-reset 0 (30 s), pgtap **130** (950 s, stopped by me) | not judged: a measurement for the skill, not a gate of this plan |

## The run

| Run | Head | Totals | Against `178-22-close` | Docker VM free before | Verdict |
|---|---|---|---|---|---|
| `178-e2e/178-23-close` | `397e2b0c3` | **530 passed**, 0 failed, flaky, skipped or did not run; 12.0 min | 123 compared, 0 not as expected, every project equal | 23.98 GiB | `e2e --same-projects-as 178-22-close`: **PASS**, not stale, no Sleep entry |

- **Power:** the host was on battery until the gate rows (80 %), then on AC for the gates and the run.
- **The auth budget** (`178-18-auth-peaks.sh` over 22:31:42Z to 22:44:35Z), origin 2 is the suite's: password sign-ins 37 in all
  (30 × 200, 7 × 400), **peak 25 in five minutes**; link verifications 20, peak 20. Unchanged from `178-22-close`; this plan adds
  no sign-in.
- The standing `Input.svelte` "reading 'map'" error appears once in the dev-server log, as in every run.

## The database

- **The reset this plan made:** the gate driver's `db-reset` row at about 22:00Z (head `ce9fa73a7`), after its in-flight check,
  with nothing on port 5273. It was added to measure the skill's pgTAP counts.
- **The pgTAP row did not run.** `supabase test db` pulls `public.ecr.aws/supabase/pg_prove:3.36`, which is not in the Docker VM.
  The pull hung: no progress for 16 minutes, while a container in the VM reached the registry (HTTP 401 from `/v2/`, the expected
  answer) and the host's own `curl` did too. A second, bounded pull of the same image hung as well. I stopped my own `docker pull`
  processes and the `supabase test db` process; the row ended 130. Nothing else was stopped, removed or restarted. Inferred, not
  observed: the image was removed by an earlier prune (178-20's), and the hang is the daemon's or the registry's, not the network's.
- **Now:** the closing run's teardowns have run on it, so pgTAP file 39 test 238 is red until the next reset (the known finding).
  The stack is up and was not restarted; nothing listens on 5273; nothing is in flight. Docker VM 23.88 GiB free after the run.

## `CLAUDE.md`: the sentence this phase made false (for the operator; not edited)

§ Backend (Supabase), the **Auth** bullet:

> **Auth**: cookie-based sessions with PKCE; candidates authenticate via Supabase Auth; an invitation is a row of
> `public.invitations` that promises a grant — `create_invitations` creates it and sends nothing, the `account-access` Edge
> Function mails a sign-in link when one is asked for, and `claim_invitations` writes the promised grants for the signed-in user's
> own confirmed address; bank authentication via OpenID Connect (Signicat), IdP settings in `.env`, completed by the
> `identity-callback` Edge Function

False now: `claim_invitations` does not write a candidate or organization invitation's grant unless the project's registration-mode
matrix allows that invitation's mode for its type; the function mails a recovery link too; and the auth service sends no mail.
Proposed replacement:

> **Auth**: cookie-based sessions; candidates authenticate via Supabase Auth, which sends no mail of its own (a no-op Send Email
> hook); an invitation is a row of `public.invitations` that promises a grant — `create_invitations` creates it and sends nothing,
> the `account-access` Edge Function mails a sign-in link or a recovery link when one is asked for, and `claim_invitations` writes
> the promised grants for the signed-in user's own confirmed address, for a candidate or organization invitation only under a
> registration mode the project allows for that type; a signed-in user with no password meets the Contestant App's set-password
> gate before any protected page; bank authentication via OpenID Connect (Signicat), IdP settings in `.env`, completed by the
> `identity-callback` Edge Function

("with PKCE" is dropped because no mailed link of the application goes through a PKCE code exchange any more: the callback
verifies a token hash. The `@supabase/ssr` client's own flow type is unchanged.) No other sentence of `CLAUDE.md` was found false.

## Deviations from Plan

**1. [Rule 1 - Defect of a verify stage] Task 1's `registrationKey` stage was restated.** Found during Task 1. It searched test
files, which `178-EXECUTION-RULES.md` § Searches excludes from a negative search, and so printed `registrationGuard.test.ts`, whose
`registrationKey=abc` is a parameter the guard is asserted to drop. Restated with `':!*.test.ts'` in that stage alone; both
statuses recorded. The test was not edited.

**2. [Rule 2 - Missing critical documentation] Pages, files and skill files beyond the frontmatter's list were edited**: seven docs
pages, `tests/README.md`, three comments of `tests/playwright.config.ts`, `schema-reference.md` and `rls-policy-map.md`. Each was
named out of date by the plan's search or by the dispatch file's "For 178-23" notes. All are in commit `bf3218bd3`.

**3. A gate subset outside the plan** (`178-23-skill`: db-reset, pgtap) was run to measure the database skill's counts. Its pgTAP
row did not complete (see "The database"); the skill states the 178-20 run's count and says why.

**4. The supabase README's restart paragraph** now states both measurements instead of asserting that an edited source is served
only after a restart, which 178-07 observed false once.

**Total deviations:** one restated verify stage, one widened document set, one extra measurement. **Impact:** no application
behaviour changed; the only code edits are the removals of Task 1 and three test-config comments.

## Not done, or not verified

- The pgTAP count of a run on today's tree (the run did not complete; the tree's tests and schema are unchanged since the 178-20
  run that read 2435).
- The authentication page's sentence "the `/api/auth/callback` route, the callback for the PKCE exchange" in § Sessions was left as
  it was found; it is not a statement this phase changed, but it is no longer accurate (the callback verifies a token hash). For
  whoever next edits the page.
- `isContestantAppRootPath` in `tests/tests/utils/contestantEntityUrl.ts` is still called only by its own unit test (noted by
  178-14); not removed, as no task of this plan names it.
- `rls-policy-map.md` and `schema-reference.md` were brought in line on the rows this phase changed; their other counts were not
  re-measured.

## Observed, and inferred

- **Observed:** every command, status, count and run above; the absence of readers for the eleven keys; the 30 dangling citations
  at `178-BASE`; the `pg_prove` image absent and its pull without progress.
- **Inferred:** why the pull hangs; that a hosted project's dashboard labels match the names the deployment page gives (the page
  says they are unverified).

## Prohibitions

- **PROH-178-66:** each key was removed after its own full-key and last-segment search; the `passwordValidation` keys,
  `registrationLocked` and `loginFailed` are kept (`commonPatterns` kept although no reader was found).
- **PROH-178-67:** no doc, README, skill or todo says a residual is closed, a translation reviewed or a person's check made; the
  residuals are under "Known residuals" with their measurements, and the filed todos say what a person is to do.
- **PROH-178-68:** no file under `preregister/`, `api/contestant/`, `functions/identity-callback/` or the spike-findings skill was
  edited; their hits are listed above.

## Threat register

- **T-178-143:** mitigated — the method, its type and the adapter implementation are removed; the searches find none.
- **T-178-144:** mitigated — the deployment page names each setting, its value and that the repository cannot enforce it.
- **T-178-145:** mitigated — four residuals under one heading, each open, each with its measurement; the gate's limits under a
  heading of their own; the todos filed or updated.
- **T-178-146:** mitigated — per-key searches, the regenerated key type, the check, the unit suite and the full run.
- **T-178-147:** mitigated — Phase 179's tree untouched.

## Known Stubs

None.

## Threat Flags

None. No new surface: removals and documents.

## For later plans

- **Predecessor label for the next full run: `178-23-close`** (530 tests, 123 projects, head `397e2b0c3`), every project equal to
  `178-22-close`, so a comparison with `178-22-close` needs no `--except`.
- **The pgTAP row cannot run until `public.ecr.aws/supabase/pg_prove:3.36` is in the Docker VM.** `supabase test db` pulls it,
  and the pull hung here for 16 minutes with the registry reachable. Plan 178-24's database rows will meet it: pull the image in
  the background first and watch it, and if it does not finish, stop and report. Do not prune, remove or restart anything to make
  room or to unstick it.
- **The database was reset at about 22:00Z** and then touched by the closing run: test 238 of file 39 is red until the next reset.
- **For 178-24:** the D-24 searches as this plan made them (outside `.planning/` and the spike-findings skill, test files
  excluded from the `registrationKey` stage); the `CLAUDE.md` replacement above for the operator; the seven filed todos are the
  person's list for N-6, N-7, N-8, the keyboard and screen-reader walk, the six locales at 320 px, U-30 and the 65-second margin.
- **Docs that a later edit should keep true:** the authentication page's `## Known residuals` (four items while `P7: difference`
  stands) and `## What the set-password gate does not cover`; the deployment page's hosted-settings table.

## Self-Check: PASSED

- The seven filed todos exist under `pending/`; the ten closed ones are under `done/` with a Resolution and absent from `pending/`.
- `8ba4e0914`, `ce9fa73a7`, `bf3218bd3` and `397e2b0c3` are ancestors of HEAD.
- `tests/e2e-runs/178-e2e/178-23-close` reads 530 passed; `178-23-t1-verify-r2.exit`, `178-23-t2-verify.exit` and
  `178-23-t3-verify.exit` are 0; `178-23-t1-verify.exit` is 1, as recorded.
