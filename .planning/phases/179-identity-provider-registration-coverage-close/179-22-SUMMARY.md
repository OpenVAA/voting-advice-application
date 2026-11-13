---
phase: 179-identity-provider-registration-coverage-close
plan: 22
subsystem: docs-and-repo-gates
tags: [reg-14, docs, lint-gate, identity-provider, oidc, database-skill]
status: complete

requires:
  - phase: 179-identity-provider-registration-coverage-close
    provides: "179-21 the deletion of the legacy chain (the tree the check first runs on); 179-06..179-20 the flow the pages describe: C's provider option, the authorize endpoint, the callback, identity-callback's contract and server credential, CI1, the confirmation operation and mail, CI2's nine codes"
provides:
  - "scripts/assert-no-preregister.mjs (`yarn assert:no-preregister`, `--report`, `--self-test`) at the end of `lint:check`: zero tracked paths or lines under apps/, packages/ and tests/ match /[Pp]reregist/"
  - "Its fixture pair, and the gate row `preregister-gone-self-test` in 179-gates.sh"
  - "The bank-authentication, registration and invitation developer pages rewritten for the flow as built; the edge-functions, contexts, data-api, routing, email and publishers' pages corrected; the generated component and routing pages regenerated"
  - "tests/README.md's closed-project matrix and auth budget, and the runbook's flow, walk-through and key files, as the tree is"
  - "The database skill's identity-callback and account-access paragraphs, their variables and the own-entity lookup"
affects: [179-23, 179-24]

tech-stack:
  added: []
  patterns:
    - "A zero-hit repository gate whose rule is case-sensitive in one letter, so the test that refuses the removed setting's key needs no exemption"

key-files:
  created:
    - scripts/assert-no-preregister.mjs
    - scripts/fixtures/assert-no-preregister.input.ts
    - scripts/fixtures/assert-no-preregister.expected.ts.violations
  modified:
    - package.json
    - .planning/phases/179-identity-provider-registration-coverage-close/179-gates.sh
    - "apps/docs/src/routes/(content)/developers-guide/contestant-app/bank-authentication/+page.md"
    - "apps/docs/src/routes/(content)/developers-guide/contestant-app/registration/+page.md"
    - "apps/docs/src/routes/(content)/developers-guide/contestant-app/pre-registration-and-invitation/+page.md"
    - "apps/docs/src/routes/(content)/developers-guide/backend/edge-functions/+page.md"
    - "apps/docs/src/routes/(content)/developers-guide/frontend/contexts/+page.md"
    - "apps/docs/src/routes/(content)/developers-guide/frontend/data-api-and-adapters/+page.md"
    - "apps/docs/src/routes/(content)/publishers-guide/preparing/candidates-and-parties-data-be/+page.md"
    - "apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/+page.md"
    - "apps/docs/src/routes/(content)/developers-guide/frontend/routing/generated/+page.md"
    - apps/docs/src/lib/navigation.config.ts
    - "apps/docs/src/routes/(content)/developers-guide/backend/email/+page.md"
    - "apps/docs/src/routes/(content)/developers-guide/frontend/routing/+page.md"
    - "apps/docs/src/routes/(content)/developers-guide/frontend/intro/+page.md"
    - "apps/docs/src/routes/(content)/developers-guide/quick-start/+page.md"
    - "apps/docs/src/routes/(content)/developers-guide/deployment/+page.md"
    - "apps/docs/src/routes/(content)/publishers-guide/app-settings/+page.md"
    - tests/README.md
    - tests/IDURA-TEST-RUNBOOK.md
    - .claude/skills/database/SKILL.md
  deleted:
    - "apps/docs/src/routes/(content)/developers-guide/frontend/components/generated/contestant/components/preregisteredNotification/PreregisteredNotification/+page.md (removed by the generator)"

key-decisions:
  - "The rule is the plan's: /[Pp]reregist/ over apps/, packages/ and tests/, no exemption list. Structural only: the guard's own source and fixtures (under scripts/, outside the scanned trees anyway) and its own script name, masked where cited, as the app-name gate masks its own"
  - "A finding prints the run of name characters around the stem (`<path>:<line>: <text>`), and a path finding each path segment that holds it (`<path>: path segment <segment>`)"
  - "The invitation page is titled 'Invitation' (its first section heading became 'The invitation model' so the page has no duplicate heading); its folder keeps its name, so every link and anchor into it holds. The navigation title follows the H1 through generate:docs"
  - "Docs pages outside the plan's list that named the removed chain, or the old page title as link text, were corrected (deviation 2). The authentication page, the environment-variables page and apps/supabase/README.md are reported, not edited, as the dispatch directed for files the plan does not list"
  - "The operator's accepted residual (the auth service's own email_exists answer to a user's address change) is stated in one sentence in the bank-authentication page's confirmation section, in the edge-functions page's address-confirmation section and in the database skill"

requirements-completed: [REG-14]

estimate:
  tokens: 75000
actuals:
  tokens: 44784
  tasks: 3
  commits: 3
plan_head_before: 7284a5e98933edd46bca170631f1e1ba0a715755
plan_head_after: 340b8aafe087be8d73e179f97ef902fc466752c6

metrics:
  duration: "about 17 min of host clock (12:43Z to 13:00Z, 2026-10-22); no E2E run"
  completed: 2026-10-22
---

# Phase 179 Plan 22: REG-14's check and the docs Summary

**The legacy pre-registration chain is now kept gone by a check, not by a search made on one day. `scripts/assert-no-preregister.mjs` runs last in `lint:check`. It reports any tracked path or line under `apps/`, `packages/` or `tests/` that matches `/[Pp]reregist/`, has no exemption list, and is seen firing by its self-test and on the tree as it stood before the deletion. The developer guide's bank-authentication page now describes the flow as built. It covers the provider's option and type choice, the round trip with the server's secret, `identity-callback`'s contract, the success view and its address states, the confirmation mail with the accepted residual, the error screen's three classes and nine codes, and what `app_metadata` holds. The registration and invitation pages and every other page that named the chain describe the one `register/` tree. The tests' README, the runbook and the database skill do the same.**

## Task commits

| Task | Commit | What |
|---|---|---|
| 1 | 8f2e00bed | `docs(179-22)`: 20 files. The three developer pages rewritten. Seven more docs pages corrected. The generated pages regenerated, with the notification's page deleted by the generator. The tests' README, the runbook and the database skill |
| 2 | 864faec2b | `chore(179-22)`: the script, its two fixtures, `package.json` (the script and its `lint:check` link) and the gate row |
| 2 (fix) | 340b8aafe | `fix(179-22)`: one negative line of the fixture planted `CandidatePreregisterPage`, which the app-name gate forbids. 864faec2b made `lint:check` red, and this commit makes it green again (Deviation 1) |
| 3 | (this summary) | gate run `179-gates/179-22`; no code |

## The rule as built

- **What is scanned.** Every tracked file under `apps/`, `packages/` and `tests/`, both its path and its lines. The file list comes from `git ls-files -z -- apps/ packages/ tests/`. If that command fails, the uncaught error exits non-zero, so a check that cannot look refuses.
- **The rule.** `/[Pp]reregist/`. Zero findings are allowed and there is no exemption list.
  - The guard skips its own source and fixtures, which are under `scripts/` and so outside the scanned trees anyway.
  - It masks its own script name (`assert[-:]no-preregister`) wherever that name is cited, as the app-name gate masks its own name. So a page that names the gate is not a finding.
- **Why one case-sensitive letter (Pitfall 15, decided in the plan).** `storedSettings.schema.test.ts` asserts that a stored row's `preRegistration` key is refused. That key has a capital R, so it does not match the rule. The test stays as it is, and no exemption exists. The app-name gate's own vocabulary is under `scripts/`.
- **Output.**
  - A line finding: `<path>:<line>: <matched text>`, where the text is the run of `[\w$./+-]` around the stem.
  - A path finding: `<path>: path segment <segment>`.
  - The summary line goes to stderr.
- **Exit codes.** 0 when clean, with `--report`, or when the self-test passes. 1 on a finding or a self-test difference. 2 on a usage error. `--self-test` takes no other flag.
- **What it cannot see** (stated in its header):
  - an all-capitals spelling (`PREREGISTER`)
  - a hyphenated or spaced form (`pre-registration`, which is also the docs page's folder name)
  - a name of the chain that does not carry the stem
  - an untracked file
  - anything outside the three trees

## The self-test's cases

The fixture's lines `// @as <path>` set the path the following lines are judged in. A line `// @path <path>` is judged as a tracked path.

- **Positive, contents** (5 findings, judged as `apps/frontend/src/lib/fixture.ts`):
  - a route constant: `ContestantAppPreregisterEmail`
  - a message namespace: `contestantApp.preregister.title`
  - a URL path: `/api/contestant/preregister`
  - a writer member: `dataWriter.preregisterWithIdToken`
  - a context member: `contestantCtx.isPreregistered`
- **Positive, paths** (5 findings):
  - the page route folder
  - the message file
  - the API route folder
  - the error module's file
  - the E2E fixture's file
- **Negative** (none reported):
  - the stored-settings key `preRegistration`, both as an object key and as an expectation
  - the hyphenated docs URL
  - the stored-settings test's own path
  - a stem in a `.planning/` path and in a `scripts/fixtures/` path
  - a stem in a content line judged under `.planning/`, and in one judged under `scripts/`

**Seen firing:**

| Control | Result |
|---|---|
| The rule made case-insensitive (scratch copy) | self-test **FAILED**: 12 findings for 10 expected, the two `preRegistration` lines reported (`179-unit/179-22-t2-control-case-insensitive.log`) |
| The rule made to match nothing (scratch copy) | self-test **FAILED**: 0 findings for 10 expected (`…-control-never-matches.log`) |
| The real script over the tree at c5a5a10bf (the head before 179-21's deletion), extracted with `git archive` into a scratch repository | exit **1**, 354 findings in 63 paths, 28 of them path segments. `storedSettings.schema.test.ts` is not among them. Every file that a case-insensitive `git grep -l -i preregist` names at that head is reported, except that test. The eleven all-capitals lines there (`PREREGISTER_ROUTE`, `CONTESTANT_PREREGISTRATION_ERROR`, in three files) each sit in a file that the rule reports for another spelling or its path (`…-control-pre-deletion.{log,err,exit}`) |
| The real script over the committed tree | exit 0: 2941 files, 0 findings |

## Every page rewritten

**The three developer pages:**

1. **`contestant-app/bank-authentication`.** Rewritten whole.
   - When the mode is offered: `identityProviderEntityTypes`, for any served type.
   - The registration screen's provider form and its type choice, with no type chosen on arrival.
   - The authorize and callback steps, including the provider's error mapping and the server's secret in `x-identity-callback-secret`.
   - `identity-callback`'s nine steps: the credential refused first, the project from the request, the matrix before any write, the invite recipe and the record confirmed by a grant. Its closed results.
   - A table of the account's `app_metadata`. It holds no identity claim beyond the matched identifier; `hetu` and `birthdate` are sent as null.
   - The success view: the address states `none` / `pending` / `proved`, when it is shown, its five variants and the server endpoint's three intents. The home reminder and the settings page.
   - The confirmation mail: `confirm-address`'s four steps, the `email_change` link, and the residual in one sentence.
   - The error screen: the nine codes with their classes and what each means, and the three titles.
   - Configuration: `IDENTITY_CALLBACK_SERVER_SECRET` on both sides, and no `PUBLIC_PROJECT_ID` for the function.
   - The Signicat row now says the verifier and challenge are made on the server.
2. **`contestant-app/registration`.**
   - The three modes, all from the one `register/` tree.
   - The error screen in the entry-route table: seven entry routes, as `appGates.ts` lists them.
   - The identity provider's mode is listed for any served type, not for candidates alone (the 179-16 row).
   - The error screen is not guarded.
   - A new section, "Registering with a bank identity".
   - The gate order: `setPassword` (only on a proved address), `identityProvider`, `termsOfUse`. `addressState` beside `passwordSet` (the 179-11 row).
   - The data writer table: `getBasicUserData`'s sources, and `requestAddressConfirmation`.
3. **`contestant-app/pre-registration-and-invitation`.**
   - Titled **Invitation**. Its folder and URL are unchanged.
   - The intro names the two ways an account gets a grant.
   - The first section heading is now "The invitation model".
   - The claim's bullet: an identity-provider account claims nothing.
   - "What this does not do" no longer names the deleted route, and its sentence on the removed tree is gone.
   - The closing section is now "Registration with a bank identity", a short description with a link.

**The four other listed pages:**

- **`backend/edge-functions`:**
  - The table rows for both functions.
  - The variable table: the secret, `PUBLIC_PROJECT_ID` for `send-email` alone, `SITE_URL` for `account-access` alone.
  - `account-access` is anonymous for four operations; `confirm-address` is the fifth, with its row, its own section and the residual.
  - The writer's fifth method, `requestAddressConfirmation`.
  - The `identity-callback` section, rewritten.
  - The tests paragraph: the two identity-provider projects run in every run.
- **`frontend/contexts`:** the contestant context's member list, and the stable references, lose `preregister` and `exchangeCodeForIdToken`.
- **`frontend/data-api-and-adapters`:** the writer's purpose, the methods that call server routes (`logout` and the job methods), and the API routes (`contestant/identity-provider`, `auth/callback`).
- **`publishers-guide/…/candidates-and-parties-data-be`:**
  - "Registration with bank authentication" now covers candidates and parties. No email list is needed. The name comes from the bank identity, and the birth date and identity code are not stored. Nominations are confirmed by an administrator against the official lists.
  - The "official lists" sentence.

**Generated pages** (`generate:docs`, exit 0):

- The components index loses `PreregisteredNotification`: 115 → 114 components.
- The notification's generated page is deleted by the generator. The directory is gone.
- The routing map loses `api/contestant/preregister/`, `api/oidc/token/` and the `contestant/preregister/` tree.
- `navigation.config.ts` takes the page's new title.

**Tests and skill:**

- **`tests/README.md`:**
  - Line 320 describes the closed project's registration page under the provider's mode as it is asserted now. Organizations-alone offers Register and the party panel.
  - The auth budget states the two `config.toml` limits, and that the local stack does not enforce the verification limit. It records the measurement as 179-17's: 36 answered, none 429, `GOTRUE_RATE_LIMIT_VERIFY=30` with no header, the header's role unconfirmed. The password half was not probed.
  - It states the risk: about 95 verifications per run would fail on a stack that enforces the limit.
- **`tests/IDURA-TEST-RUNBOOK.md`:**
  - The header note names both E2E specs.
  - The flow overview has no `preregister` step and no `id_token` cookie. It shows the secret, the view, the mail and the terms of use.
  - Step 6 is a seven-step walk-through: the matrix, the type choice, the view, the address, and the mail in Inbucket.
  - The "Key files" table lists the registration screen, the error codes, the error screen, the view, its endpoint and the address confirmation, in place of the two deleted files.
  - Prettier reformatted it.
- **`.claude/skills/database/SKILL.md`:**
  - Service Patterns § 1: `account-access` is anonymous for four of five operations, plus `confirm-address`'s order and the residual. `identity-callback` as it is served.
  - § 7: the six required variables, without `PUBLIC_PROJECT_ID` or `SITE_URL`.
  - RLS § 9: the own-entity lookup through `registered_entities`, confirmed by a grant.
  - A freshness entry. No count was re-measured.

## Gate rows

| Run / gate | Tree | Result |
|---|---|---|
| `yarn workspace @openvaa/docs generate:docs` | Task 1's working tree | exit 0. Its link validation: 0 findings (`179-unit/179-22-gendocs.{log,exit}`) |
| `yarn workspace @openvaa/docs build` | Task 1's working tree | exit 0 (`179-22-docs-build.*`) |
| `yarn workspace @openvaa/docs validate:links --check` | Task 1's working tree | exit 0, 0 findings (`179-22-docs-links.*`) |
| `yarn assert:comment-hygiene` | before commit 8f2e00bed | exit 0, 0 violations |
| `yarn lint:check` | Task 2's working tree, script and fixtures untracked | exit 0 (`179-22-lint.*`). This run missed Deviation 1, because the app-name gate scans tracked files only |
| `yarn lint:check` | after the fixture fix, all tracked | exit 0. Both name gates report 0 findings (`179-22-lint-r2.*`) |
| **`179-gates/179-22 --rows lint,docs-links,preregister-gone-self-test`** | committed 340b8aafe | driver exit 0. `lint` 0 (53 s), `docs-links` 0, `preregister-gone-self-test` 0 |
| `179-verdict gates 179-22 --rows lint,docs-links,preregister-gone-self-test` | | **PASS**: 3 rows expected and recorded, all 0. The head is tree-equal to HEAD outside `.planning/`. No Sleep entry fell inside the run window (`179-unit/179-22-gates.verdict.log`) |

No E2E run was made. The plan names none, and its commits change no committed spec, page, function or harness file, only documentation, a repository gate and a skill file. The latest full run stays `179-e2e/179-21-close` (613/613).

## Verify blocks (`tests/e2e-runs/179-unit/179-22-t{1,2,3}-verify*.{sh,log,exit,head}`)

Each script is taken byte for byte from the plan's `<automated>` block.

- **Task 1, as written:** exit **0** at 8f2e00bed, and exit **0** again at 340b8aafe (`-final`).
- **Task 2:**
  - **As written:** exit **1** at 340b8aafe. The only failing stage is `yarn -s` (Yarn 4.18.1: `Unsupported option name ("-s")`, captured in `179-22-yarn-s.log`). Every stage before it passed: the files are tracked, the self-test passes, the tree run is clean, the unknown flag exits 2, and both grep stages match.
  - **Restated** with `yarn lint:check > /dev/null`: exit **0** at 340b8aafe.
  - **The first pair, at 864faec2b, is kept as `-r1`.** As written it failed at `yarn -s`. The restated form failed in `lint:check`, at `assert:no-candidate-app-names` (Deviation 1).
- **Task 3, as written:** exit **0**.

## Deviations from Plan

### Auto-fixed issues

**1. [Rule 1 - Bug] The fixture planted a name another gate forbids.**
- **Found during:** Task 2, when the restated verify block ran at 864faec2b.
- **Issue:** One negative line of the fixture was `const vocabulary = /CandidatePreregisterPage/;`, meant to stand for another gate's vocabulary under `scripts/`. The app-name gate scans every tracked file, and its `Candidate<Name>Page` pattern reports that line. The first `lint:check` ran while the fixture was still untracked, so it saw nothing. **Commit 864faec2b therefore left `lint:check` red** until 340b8aafe, two commits later and with no other change between them.
- **Fix:** the line now reads `const vocabulary = /preregisterWithIdToken/;`. It is still a stem on a line judged under `scripts/`, and it still must not be reported. The expected file is unchanged.
  - This is a fixture correction, not a check edited to pass. The line had no reason to spell an app-level name.
  - `lint:check` and both name gates are green afterwards.
- **Commit:** 340b8aafe.

**2. Docs pages outside the plan's list.** The plan's truth is that "every other docs page … describe[s] the tree as it is". Each of these named the removed chain, called the provider's mode "pre-registration", or used the page's old title as a link text:
- `backend/email`: the confirmation mail's row, and one link text
- `frontend/routing`: the `contestant/` and `api/` rows
- `frontend/intro`: a link text
- `quick-start`: a link text
- `deployment`: the identity-provider environment group's purpose
- `publishers-guide/app-settings`: the `identity_provider` mode. It is no longer "offered to candidates only", which was false since 179-16
- `navigation.config.ts`: by the generator

**3. [Rule 3 - Recurring] `yarn -s`** is rejected by Yarn 4.18.1. Both forms of Task 2's block are kept.

**4. The gate driver's header said "Nineteen rows by default".** That was already wrong before this plan; there were 20 rows. It now reads "Twenty-one rows", matching `ALL_ROWS`.

**Files touched that the plan did not list:**
- `apps/docs/src/lib/navigation.config.ts`
- `apps/docs/…/backend/email/+page.md`
- `apps/docs/…/frontend/routing/+page.md`
- `apps/docs/…/frontend/intro/+page.md`
- `apps/docs/…/quick-start/+page.md`
- `apps/docs/…/deployment/+page.md`
- `apps/docs/…/publishers-guide/app-settings/+page.md`

The plan's list names the notification's generated page, which the generator deleted.

## Carried items (`179-CARRIED-ITEMS.md` rows that name 179-22)

| Row | Outcome |
|---|---|
| 179-21: the docs the deletion made false | **Settled**, every listed line:<br>- `edge-functions` l. 8, 103, 111<br>- `bank-authentication` l. 14<br>- the invitation page l. 212, 214, 224<br>- the generated components page and the notification's generated page<br>- the generated routing page l. 48, 81<br>- `contexts` l. 26, 52<br>- `data-api-and-adapters` l. 59, 99, and l. 12<br>- the publishers' guide l. 33–45<br>- `tests/README.md` l. 320<br>- the runbook l. 19, 184, 231, 232 |
| 179-09 / 179-13: database `SKILL.md` § Service Patterns 1, RLS § 9 and § 7 | **Settled** |
| 179-10: `account-access` described as anonymous with four operations | **Settled** in `SKILL.md` and the edge-functions page. **Left:** `apps/supabase/README.md`'s bullet (not on this plan's list), for 179-24 |
| 179-11: the registration guide's F rule and `getBasicUserData` | **Settled** |
| 179-11 / 179-19: `backend/authentication/+page.md` (F's rule, no confirmation link) | **Left, reported** (not on this plan's list, as the dispatch directed). Details below |
| 179-13: edge-functions page `SITE_URL` / `PUBLIC_PROJECT_ID`; the bank-authentication guide's `hetu`/`birthdate` and `SITE_URL` | **Settled** |
| 179-13 / 179-15: `apps/supabase/README.md`'s identity-callback bullet | **Left, reported** for 179-24 (replacement text below) |
| 179-14 → 179-15: `bank-auth-journey` in the README and the runbook | Already settled by 179-15. `git grep bank-auth-journey` finds nothing in either file |
| 179-15: the runbook's flow overview, Step 6, "Key files"; `SKILL.md` § 1 and § 7; the variable in the edge-functions page and the bank-authentication guide | **Settled** |
| 179-15: the environment-variables docs page lacks `IDENTITY_CALLBACK_SERVER_SECRET` | **Left, reported** for 179-24 (not on this plan's list) |
| 179-16: the registration guide says the provider's mode is listed only for candidates | **Settled**, as is the same sentence in `publishers-guide/app-settings` |
| 179-17 / 179-18 / 179-19 / 179-20: the auth budget in `tests/README.md` | **Settled**: the README states what was measured, and the risk |
| 179-03: `schema-reference.md` and `rls-policy-map.md` lack `public.address_confirmation_request` and `private.caller_pending_email_taken` | **Left** for 179-24. This plan lists `SKILL.md` only |
| 2026-09-21 "discards email" todo, its Phase 168 docs note (D-22) | **Honoured.** The bank-authentication page no longer says the route forwards only the ID token, or that the user keeps the placeholder address. The page states that the user gives an address and confirms it by the mailed link. The todo's move to done is 179-23's |
| 179-10 → operator: the accepted email-existence oracle | **Stated** as accepted, in one sentence each, in the bank-authentication page, the edge-functions page and the skill |

## Items to report rather than edit

- **`apps/docs/…/backend/authentication/+page.md`** (for 179-24):
  - l. 116 and l. 120 still use the link text "Pre-registration and invitation". The link works, because the page's address is unchanged.
  - l. 151 says "An account created by `identity-callback` reads as having a password". That has been false since 179-13: the account is created by invite, with no password.
  - § "What the set-password gate does not cover" (l. 164 onward) describes the gate as decided by `passwordSet` alone. It is now `passwordSet === false` together with `addressState === 'proved'`.
  - The page does not mention the confirmation link (`email_change`).
- **`apps/docs/…/configuration/environmental-variables/+page.md`** lacks `IDENTITY_CALLBACK_SERVER_SECRET`, a private frontend variable that must equal the function's secret (for 179-24).
- **`apps/supabase/README.md`** (for 179-24). Proposed replacements:
  - The **`account-access`** bullet:
    - "**anonymous**" → "**anonymous** for four operations".
    - Append: "`confirm-address`, with the caller's own access token, proves an address for an account an identity provider created: it takes the account's and the address's slot, answers `sent`, `in-use` or `refused`, and mails a `type=email_change` link."
  - The **`identity-callback`** bullet: "**server-only**. Refuses every caller without the frontend server's `x-identity-callback-secret`; accepts a bank-authentication `id_token` with the request's `project_id` and entity type, verifies it against the provider's JWKS, decides the type by the project's registration matrix, and finds or creates the matching auth user (by invite, no password), its candidate or party and the editor grant between them. Reads the `IDENTITY_PROVIDER_*` variables and `IDENTITY_CALLBACK_SERVER_SECRET`."
  - The paragraph after them: "The other two have no caller check by design" → "`identity-callback` checks the server's credential; `account-access` has no caller check by design except for `confirm-address`".
- **The rule cannot see an all-capitals spelling.** The legacy chain had two: `PREREGISTER_ROUTE` and `CONTESTANT_PREREGISTRATION_ERROR`. Both sat in files the rule reports for another spelling. The rule is the plan's decided one (ruling 1), so it was not widened. Adding `|PREREGIST` would leave `preRegistration` alone; that is a located change of one expression and one fixture line.
- **D-18 names the `id_token` cookie** among the things the check keeps gone, but no cookie name carries the stem. `assert:cookie-names`, which runs in `lint:check`, is what fails on an unregistered cookie name. 179-21 removed `COOKIE.idToken`.
- **`.claude/skills/components/context-reactivity.md` and the spike-findings skill** still mention the pre-registration context members (179-21's item). They are outside the scanned trees and this plan's list.
- **CLAUDE.md:** no sentence was made false by this plan. It lists no individual `lint:check` gate.

## Code review checklist (`.agents/code-review-checklist.md`)

- **Solves the issue:** REG-14 criterion 5 is kept true by a gate in `lint:check`. Its self-test, two mutants and a run over the pre-deletion tree show it fires.
- **OWASP:** T-179-221 is mitigated by the gate. T-179-222 is mitigated by the pages: the secret, the variables and the codes as they are.
- **`any`:** none; the script is plain ESM.
- **Repetition:** the script reuses the app-name gate's shape (usage, exit codes, self-test, stderr summary) and shares no code with it, as the other `assert:` scripts do.
- **Documentation:** the script's header states what it guards, the rule, why one case-sensitive letter, and what it cannot see. The docs pages are listed above.
- **Tracking, Svelte, WCAG:** not applicable; no UI change.
- **Comment hygiene:** `assert:comment-hygiene` passed before commit 8f2e00bed. The script is under `scripts/`, outside the hygiene scope, and its header has no ids and no history.
- **Commits:** three, linear, by pathspec. No `[db]`.

## Statements observed and inferred

- **Observed:**
  - every gate, verify and control result above
  - the generator's removal of the notification's page and directory
  - the 0-finding link validation
  - the 354 findings over the pre-deletion tree, and that the stored-settings test is not among them
  - that every file a case-insensitive census named at that head, except that test, is reported
- **Inferred, not measured:**
  - **The README's statement that a stack enforcing the verification limit would fail the spec.** It is inferred from the count, about 95 per run, and the limit of 30 per 5 minutes. No such stack was run.
  - **The docs' statements about the flow.** They were read from the code (`oidcError.ts`, `gates.ts`, `addressConfirmation.ts`, `identity-callback/index.ts`, the callback route, the catalogue) and from 179-13..20's observed runs. No browser walk was made for this plan.

## Known Stubs

None.

## Threat Flags

None. The plan adds a repository gate and documentation; it adds no endpoint, auth path or schema surface.

## Self-Check: PASSED

- The script and both fixtures exist and are tracked.
- 8f2e00bed, 864faec2b and 340b8aafe are ancestors of HEAD. `git rev-list --count 7284a5e98..HEAD` = 3 before this summary's commit.
- The notification's generated page and its directory do not exist.
- `tests/e2e-runs/179-gates/179-22/summary.tsv` holds the three rows at 0, and the verdict log ends in PASS.
- `git status --short` showed only the operator's `CAND-APP-PLAN.md` before this summary was written.
- STATE.md, ROADMAP.md, REQUIREMENTS.md, CONTEXT, RESEARCH, PATTERNS, UI-SPEC and CLAUDE.md were not touched.
