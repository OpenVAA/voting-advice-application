---
phase: 179-identity-provider-registration-coverage-close
plan: 13
subsystem: identity-callback
tags: [edge-function, identity-provider, registration-matrix, passwordless, app-metadata, e2e]
status: complete

requires:
  - phase: 179-identity-provider-registration-coverage-close
    provides: "179-08 requestContract.ts, registrationMatrix.ts, placeholderAddress.ts; 179-09 organizationRecord.ts, ownEntity.ts, appMetadata.ts; 179-02 probe rows P5, P6, P9"
provides:
  - "identity-callback/index.ts wired to the request contract, the matrix authority, the invite recipe, the own-entity record, both entity types and the link for the current address; closed results with the legacy session.action_link beside the token"
  - "candidateRecord.ts without the grant lookup; claimConfig.ts without claim extraction"
  - "flowConformance.test.ts, envReadSites.test.ts and verificationLogPrivacy.test.ts over the new entry point"
  - "contestant-bank-auth.spec.ts on two projects of its own: created / found / organization created / no_entity / mode_not_allowed / invalid_token / bad_request, and hetu and birthdate absent from app_metadata"
affects: [179-14, 179-15, 179-16, 179-20, 179-22, 179-24]

tech-stack:
  added: []
  patterns:
    - "The direct-call spec owns scratch projects (ids ...ba01 / ...ba02 on seed.sql's account) with their own app_settings rows, so its matrices never touch the suite project's singleton settings row"
    - "Source conformance over a comment-stripped index.ts with a bracket-balanced call-argument reader"

key-files:
  created: []
  modified:
    - apps/supabase/supabase/functions/identity-callback/index.ts
    - apps/supabase/supabase/functions/identity-callback/candidateRecord.ts
    - apps/supabase/supabase/functions/identity-callback/candidateRecord.test.ts
    - apps/supabase/supabase/functions/identity-callback/claimConfig.ts
    - apps/supabase/supabase/functions/identity-callback/claimConfig.test.ts
    - apps/supabase/supabase/functions/identity-callback/flowConformance.test.ts
    - apps/supabase/supabase/functions/identity-callback/envReadSites.test.ts
    - apps/supabase/supabase/functions/identity-callback/appMetadata.test.ts
    - apps/supabase/supabase/functions/identity-callback/verificationLogPrivacy.test.ts
    - apps/supabase/supabase/functions/.env.example
    - apps/frontend/src/lib/api/utils/auth/providers/idura.ts
    - apps/frontend/src/lib/api/utils/auth/providers/signicat.ts
    - apps/frontend/src/lib/api/utils/auth/providers/types.ts
    - tests/tests/specs/contestant/contestant-bank-auth.spec.ts

key-decisions:
  - "The direct-call spec registers into two projects it creates and removes itself, because the bank-auth project runs in a parallel phase on data-setup-base, whose template does not allow the identity provider's mode, and the suite project's settings row is a singleton"
  - "ENTITY_GRANT_VOCABULARY stays private: the decided type reaches writeEntityGrant as a ServedEntityType, ownEntity.ts binds the grant's target type to EntityGrantType at compile time, and exporting would change a loaded module for no behaviour"
  - "Every metadata write re-writes the whole record through withRegisteredEntity with an id the branch already holds (found id, recorded id, created id), so no reader of the whole record had to be exported from ownEntity.ts"
  - "A non-POST request answers bad_request (400) through the contract instead of a free-form 405"
  - "A configuration failure inside decryption or verification is rethrown and answered configuration (500), not invalid_token"

patterns-established:
  - "Each sign-in through the function writes app_metadata by identityAppMetadata, which sends hetu and birthdate as null and so removes them from an older account (PL-09, P9 null-removes)"

requirements-completed: []

actuals:
  tokens: 34863
  tasks: 3
  commits: 1
plan_head_before: 27b10028bd23e63d7675b7d8342ff3f3d1de3fdd
plan_head_after: 0b6ab0cec97038dd611eecb3b8ccc1520a390c98

metrics:
  duration: "about 40 minutes (03:34Z to 04:15Z host clock, 2026-10-22)"
  completed: 2026-10-22
---

# Phase 179 Plan 13: identity-callback with its new contract Summary

**`identity-callback` now decides the entity type from the named project's stored matrix before it touches anything, creates accounts by invite (no password), finds an identity's own entity through the `app_metadata` record confirmed by a live grant, creates a confirmed candidate or an unconfirmed nameless organization with its grant and record before the sign-in link, generates that link for the account's current address, keeps no `hetu` or `birthdate`, and answers one closed result. The legacy pre-registration route still works: it sends `{ id_token }` alone and reads `session.action_link`.**

## Task commits

The plan holds one set, so there is one commit:

| Task | Commit | What |
|---|---|---|
| 1–3 | 0b6ab0cec | `feat(179-13)`: the entry point, the claim configuration, the frontend docblocks, the env template, the source tests and the direct-call spec, committed after the held run was green |

## The function as built

The order of `Deno.serve`:

1. Preflight answers `ok`. A non-POST request gets `bad_request`.
2. `IDENTITY_PROVIDER_TYPE` is read through `requireEnv`. An unknown provider answers `configuration`.
3. The body goes through `parseIdentityCallbackRequest`. Unreadable JSON or a null parse answers `bad_request`.
4. The project is `request.projectId`, or `PUBLIC_PROJECT_ID` through `requireEnv` when the request names none.
5. Decrypt and verify. Each failure answers `invalid_token`, and the verification failure is logged by fields only. A configuration failure in either step is rethrown.
6. `extractIdentityClaims` returns only the match value and the two names. A failure answers `invalid_token`.
7. The service-role client reads `app_settings.settings` for the project. A read error throws and answers `unavailable`; no row reads as `{}`.
8. `resolveEntityType(settings, request.entityType)`. A refusal answers `mode_not_allowed` (403), before any account or row is touched.
9. The account: `findUserByIdentityMatch`, which still pages the auth users.
   - A new identity gets `generateLink({ type: 'invite', email: placeholderAddressFor(matchValue), options: { data: { given_name, family_name } } })`.
   - An `email_exists` answer is read as this identity's own account, found by its placeholder address.
   - Then `updateUserById(id, { app_metadata: identityAppMetadata({…, registeredEntities: {} }), email_confirm: true })`. This is the only confirmation, and it confirms the placeholder.
10. `readRegisteredEntity` → `resolveOwnEntity`:
    - `found` gives result `found`.
    - `gone` gives `no_entity`, and nothing is created.
    - `none` runs `createCandidate` (confirmed, the provider's names) or `createOrganization` (unconfirmed, nameless), and gives `created`.
11. In one try block: `writeEntityGrant` with the decided type (created branch only), then `updateUserById(id, { app_metadata: identityAppMetadata({…, registeredEntities: withRegisteredEntity(…) }) })` on every branch. If either write fails, the created row is deleted (`deleteCandidate` or `deleteOrganization`; a failed delete is logged) and the error is rethrown.
12. `getUserById(id)` reads the current address. `generateLink({ type: 'magiclink', email: <that address> })`. The token is the `token` parameter of `action_link`.
13. `respond(result, token, actionLink)` builds `resultBody` plus `session: { action_link }`, sent with `resultStatus`.
14. The final catch logs the error and answers `configuration` for `ERR_ENV_UNCONFIGURED`, `ERR_AUDIENCE_UNCONFIGURED` and `ERR_ISSUER_UNCONFIGURED`, and `unavailable` for everything else. The answer interpolates nothing.

The function no longer reads `SITE_URL`, and `redirectTo` is gone.

### Probe branches as built

- **P5 held:** the invite recipe described above (J2). The direct-call spec does not read `password_set`; P5 observed it as false for this recipe. The spec does assert that the account is created through the served function.
- **P6 action-link-token:** applies to 179-10's `email_change_new`. For the magic link this function generates, the token is also taken from `action_link` (as the legacy route reads it), never from `hashed_token`.
- **P9 null-removes:** every metadata write goes through `identityAppMetadata`, which sends `hetu: null` and `birthdate: null`. **Observed on the stack:** the found test plants both keys on the account, and after one sign-in neither is present.

## Conformance assertions (flowConformance.test.ts, over the comment-stripped source)

- No `createUser`.
- No `updateUserById(` argument carries an `email` key, written out or as shorthand.
- `email_confirm: true` occurs exactly once, in the first `updateUserById` after the `'invite'` `generateLink`, whose `email` is `placeholderAddress` (`= placeholderAddressFor(matchValue)`).
- Every `app_metadata:` value starts with `identityAppMetadata(`, and no claims object or token payload is spread.
- `resolveEntityType(` comes before the first `generateLink(`, `updateUserById(`, `createCandidate(`, `createOrganization(` and `writeEntityGrant(`. The refusal returns `mode_not_allowed`.
- One `await writeEntityGrant(`, placed before `type: 'magiclink'`. `getUserById(` also comes before the magic link, and the magic link's `email` is `currentAddress`.
- The catch arm guarded by `createdEntity` deletes the organization or the candidate before `throw writeError`.
- `writeEntityGrant` receives the shorthand `entityType`, bound from `decision.entityType`. No `entityType: '<literal>'` appears anywhere. Both create modules are imported.
- Exactly two `new Response(`: the preflight's, and the one in `respond`, which builds its body with `resultBody(result, token)`. There is one `JSON.stringify(`, and no `error: '…'` string or `Internal server error`.
- The configuration-versus-outage split is made on the three codes.

The test that asserted one entity type on the path is inverted into the two entity-type cases. The earlier grant-module cases are kept. The permission-literal pattern now matches quoted strings only: `account.id` is a property read, not a permission (see Deviations).

**Negative control:** the conformance and read-site tests were run against the old `index.ts` (HEAD's, swapped in and then restored byte for byte). They exited 1 with 19 of 42 failing (`tests/e2e-runs/179-unit/179-13-t3-conformance-control.{log,exit}`).

`envReadSites.test.ts` changes:
- The guarded set is `IDENTITY_PROVIDER_TYPE`, `…_DECRYPTION_JWKS`, `…_JWKS_URI` and `PUBLIC_PROJECT_ID`.
- The whole read set equals those four, the two claim-binding names and the platform's two.
- `'SITE_URL'` is absent.
- `PUBLIC_PROJECT_ID` is read once, as `request.projectId ?? requireEnv('PUBLIC_PROJECT_ID'`.
- The catch comment counts four throws.

## The bank-auth spec: tests added

**+3** (6 → 9), pinned as `--except bank-auth=3`.

The spec creates two projects of its own and removes them, with both identities' accounts and grants, before and after the tests:
- `…ba01` allows the identity provider's mode for candidates and organizations.
- `…ba02` allows it for neither.

The tests:
1. `created` with a token, and body keys exactly `result`, `session`, `token`. One confirmed candidate with the token's names. Exactly one editor grant. `app_metadata` has the provider, `sub`, the match value and `registered_entities = { ba01: { candidate } }`, and `hetu` and `birthdate` are undefined.
2. A wrong encryption key answers 401 `{ result: 'invalid_token' }` exactly.
3. `found` after `hetu` and `birthdate` are planted on the account. `session.action_link` carries `token=`. The candidate and the grant are unchanged, the record is unchanged, and both claims are undefined.
4. **(new)** `entity_type: 'organization'` answers `created`: one organization with `name: null` and `confirmed: false`. The account holds two grants, and the record holds both types.
5. **(new)** With the candidate grant deleted, the answer is `no_entity` with a token. The same single candidate remains and no grant is added.
6. **(new)** A second identity on `…ba02` answers 403 `{ result: 'mode_not_allowed' }`. No account exists for it, and `…ba02` has no candidates.
7. CORS preflight (unchanged).
8. `{}` answers 400 `{ result: 'bad_request' }`.
9. `not.a.valid.jwt.token` answers 401 `{ result: 'invalid_token' }`.

## Runs

| Run | Tree | Result | Verdict |
|---|---|---|---|
| `179-unit/179-13-t2-red` (`.log`, `.junit.xml`, `.json`, `.classifier`) | the claim cases against the extracting `claimConfig.ts` (Task 1's set in the tree) | exit 1, 4 failed / 31 | `gsd-tools check tdd-red-evidence`: **RED_EVIDENCE_OK** (`target_test_failed`, target `extractIdentityClaims > idura-ftn: answers the match value and the two names only, with neither hetu nor birthdate`). The failures are assertions: `expected [ 'extractClaims', …(3) ]` and `expected { …(3) } to strictly equal { …(2) }` |
| `179-unit/179-13-supabase-unit` | held set | 26 files, 1075 tests, exit 0 | — |
| `179-unit/179-13-lint` | held set | `yarn lint:check` exit 0, including `assert:edge-function-env` and `assert:edge-env-defaults` | — |
| `179-e2e/179-13-bankauth` | held set, `--project bank-auth` | 11/11 (bank-auth 9/9), wrapper exit 0, restore ok | not a gate; a quick check before the full run |
| `179-e2e/179-13-held` | held set at 27b10028b | **572/572**, wrapper exit 0, restore ok, no void marker | `control --full --same-projects-as 179-11-close --except bank-auth=3 --dirty-only apps/supabase/supabase/functions/ --dirty-only apps/frontend/src/lib/api/utils/auth/providers/ --dirty-only tests/tests/specs/contestant/contestant-bank-auth.spec.ts --green`: **PASS** (131 projects). The same against `179-12-close`: **PASS** (`_drivers/179-13-held.verdict-179-1{1,2}-close.log`) |
| `179-e2e/179-13-close` | committed 0b6ab0cec | **572/572**, driver exit 0, `restore: ok`, `sleep_entries_in_window: 0`, AC power | `179-verdict e2e 179-13-close --same-projects-as 179-13-held`: **PASS** (131 projects) |

- **Held copies:** `tests/e2e-runs/179-e2e/179-13-held.<path with / as __>.kept`, 14 files. `cmp` showed each identical to the committed file.
- **Function logs:** the bank-auth run's function log carries no `sub`, no placeholder address and no claim value (grep count 0). It holds only the two expected decryption-failure lines.

## Verify blocks (`tests/e2e-runs/179-unit/179-13-t{1,2,3}-verify*.{sh,log,exit,head}`)

- **Task 1:** exit 0 as written. Re-run at the final head as `-verify-final`: exit 0.
- **Task 2:** exit 0 as written. Re-run at the final head: exit 0.
- **Task 3:** exit 1 as written, only at the `yarn -s` stage (Yarn 4.18.1: `Unsupported option name ("-s")`). Restated with `yarn` in place of `yarn -s` (`179-13-t3-verify-restated`): exit 0 at head 0b6ab0cec. The restated form ran the whole chain, including the supabase suite, `lint:check`, the held run's `results.json`, the close verdict and a clean tree.

## Carried items

1. **(179-08) The inline placeholder.** Settled: `index.ts` uses `placeholderAddressFor(matchValue)`, and the conformance test asserts it.
2. **(179-09) `ENTITY_GRANT_VOCABULARY`.** Decided **not to export it.** `writeEntityGrant` takes the decided `ServedEntityType`, and `ownEntity.ts` types the grant's target as `EntityGrantType`, which is derived from the vocabulary. The link holds at compile time, which is stronger than an import of the string. Exporting it would change a loaded module and no behaviour. The plan's key link stays unmet as literal text.
3. **(179-09) Is the nested `registered_entities` stored as given?** **Measured on the stack: yes.** The served function wrote it through `updateUserById`, and the admin read returned exactly `{ [project]: { candidate: id } }` after one entry, and `{ [project]: { candidate: id, organization: id } }` after the second type was added (spec tests 1, 3 and 4, in both the held run and the close run).
4. **(179-09 / 179-10) The database skill.** Not edited: `.claude/skills/database/` is not on this plan's file list. Reported below. 179-22 lists `SKILL.md`.
5. **(179-11) The `identity_provider_arrival` cookie.** This plan does not set it. Nothing in `apps/frontend/src` sets `COOKIE.identityProviderArrival` yet, so the allowlist in `tests/tests/utils/privacyAllowlists.ts` is unchanged. It goes with the plan that first sets the cookie (179-14).

## Deviations from Plan

### Auto-fixed issues

**1. [Rule 3 - Blocking] The direct-call spec registers into projects of its own**
- **Found during:** Task 3. The `bank-auth` project depends on `data-setup-base` alone, so it runs in a parallel phase. The base template does not allow the identity provider's mode (`bank-auth-journey.setup.ts` says so), and the suite project's `app_settings` row is a singleton that other projects replace. With the function now the matrix authority, the plan's "a first call for a fresh identity answers `created`" could not hold on the suite project.
- **Fix:** the spec inserts two projects on `seed.sql`'s account, each with its own settings row. Its request names the project, which J5 allows. It removes everything before and after the tests. `playwright.config.ts` is unchanged.
- **Commit:** 0b6ab0cec.

**2. [Rule 3 - Blocking] Three tests not on the plan's list read what this plan removed**
- `appMetadata.test.ts` read `PROVIDER_CONFIGS[*].extractClaims` and `extraClaims`. Its "names every claim a provider configuration extracts" case is gone, and the "carries no value" case now hands the builder the two claims directly.
- `verificationLogPrivacy.test.ts` located the arm's end at `return new Response` and asserted the old `'Token verification failed'` 401 body. It now ends the arm at its `return respond(` and asserts `invalid_token`. One case was added: a configuration failure is rethrown before anything is logged.
- `candidateRecord.test.ts` is on the list. Its lookup cases went with the lookup.
- **Commit:** 0b6ab0cec.

**3. [Rule 1 - Test precision] The permission-literal pattern in `flowConformance.test.ts`**
- The pattern `\b(?:…|account|…)\.[a-z0-9_]+\b` matched the property read `account.id`.
- The code was not renamed to pass. The pattern now matches the literal inside quotes, which is the only form a permission takes.

**4. [Rule 2 - Correctness] Configuration failures during decryption and verification**
- `requireEnv` (JWKS variables) and `requireVerifyClaimBinding` throw inside the two token arms, which used to answer them as 401.
- Plan step 5 requires `configuration` for those codes, so both arms rethrow a configuration failure first. `verificationLogPrivacy.test.ts` pins the order.

**5. [Rule 3 - Recurring] `yarn -s`** is refused by Yarn 4.18.1. Both forms of the Task 3 block are kept.

### Judgement calls within the plan's text

- **An `email_exists` answer to the invite:** the account is found by its placeholder address with the same pager. The research reads that the auth service reuses an unconfirmed user, so this arm is reached only for a confirmed placeholder that has no match value; no run reached it.
- **A new account's first metadata write** carries an empty record. The later record write builds on no prior metadata.
- **The non-POST answer** is `bad_request` (400) through the contract.
- **The legacy `session.action_link`** is sent beside `token` on every success, whether or not the request named a project, until 179-15.

**Files touched that the plan did not list:**
- `apps/supabase/supabase/functions/identity-callback/appMetadata.test.ts`
- `apps/supabase/supabase/functions/identity-callback/verificationLogPrivacy.test.ts`

Both are covered by Deviation 2.

## Code review checklist (`.agents/code-review-checklist.md`)

- **Solves the plan's issues:** yes. REG-04, REG-06 and REG-07 are advanced but not completed (`requirements-completed` is empty, as the plan says).
- **OWASP:**
  - T-179-131: the matrix is read and checked before anything is written. A failed read refuses. Spec test 6 and conformance cover it.
  - T-179-132: `identityAppMetadata` is the only writer, and claims are no longer extracted. Spec tests 1 and 3 cover it.
  - T-179-133: the link is generated for `getUserById(...).email`.
  - T-179-134: the invite recipe is used, and there is no `createUser`.
  - T-179-135: the record and `resolveOwnEntity`. Spec test 4 shows two grants with no throw, and spec test 5 shows `no_entity`.
  - T-179-136: one `respond`, and code-only classification.
  - T-179-137: transferred to 179-15, as planned.
  - No address, `sub` or claim value appears in any log line. Error messages carry the client's text only.
- **`any`:** three `supabaseAdmin: any` parameters, each with `deno-lint-ignore` and a reason. One was already there; the other two are the address and match finders, which share it. No repository gate type-checks `index.ts`.
- **Repetition:** the delete-on-failure selects one of two modules by type. No new copies of anything.
- **Docs:** headers and TSDoc are updated, and so is the functions env template. The other documents this plan made false are listed below; they are not on this plan's list.
- **Tracking, Svelte, WCAG, keyboard:** not applicable (no UI).
- **Errors:** every failure is a throw with a code or one closed answer, and is logged in the function.
- **Shared dependencies:** the legacy route still works. The held run and the close run both include `bank-auth-journey` and `contestant-identity-provider`, green.
- **Comment hygiene:** `assert:comment-hygiene` reported 0 before the commit. The touched comments carry no ids and no history.
- **Commits:** one `feat` commit. No `[db]`, because there is no schema change.
- **Edge Functions section:** the function acts for no signed-in caller, so `callerMayOnProject` does not apply. Its trust anchor is the verified token, plus the matrix read with the service role.
- **"Descriptive error messages":** deliberately not applied. The closed result is the security requirement.

## Items to report rather than edit

- **Database skill** (`.claude/skills/database/SKILL.md`):
  - Service Patterns § 1 says `identity-callback` "creates user + candidate + magic link session" and that "a returning identity's candidate is found through its `(entity, candidate, id, editor)` grant in the served project".
  - RLS § 9's last bullet says the question is "two service-role queries: the user's candidate-editor grants, then the entity table".
  - § 7 lists `SITE_URL` as required by `identity-callback`, and `PUBLIC_PROJECT_ID` as required unconditionally, with a body `project_id` refused unless it matches.
  - All of these are false now. 179-22 lists `SKILL.md`.
- **`apps/docs/.../backend/edge-functions/+page.md`** lists `PUBLIC_PROJECT_ID` and `SITE_URL` as read by `identity-callback`. That is now true for `PUBLIC_PROJECT_ID` only, and only for a request without a project. 179-22 lists this page.
- **`apps/docs/.../contestant-app/bank-authentication/+page.md`:**
  - Line 53 says `birthdate` and `hetu` "are stored in the auth user's `app_metadata`".
  - Line 83 lists `SITE_URL` among the function's variables.
  - 179-14, 179-22 and 179-23 list this guide.
- **`tests/IDURA-TEST-RUNBOOK.md`** (the bank-auth "Expected" paragraph) says the spec asserts "the `hetu`/`birthdate` claim flow-through". It now asserts their absence. 179-15 lists the runbook.
- **`apps/supabase/README.md`** (the `identity-callback` bullet) says the function "creates the matching auth user, its candidate" and "reads … `PUBLIC_PROJECT_ID` and `SITE_URL`". No later plan lists the README (the same gap was reported at 179-10).
- **`apps/frontend/src/routes/api/contestant/preregister/+server.ts`:** its comment says the function's 500 body is "a fixed 'Internal server error' literal". It is now `{ result: 'configuration' | 'unavailable' }`. The route itself still works, because it forwards the status and reads `session.action_link`. 179-14 replaces the route.
- **Concurrency:** two simultaneous first sign-ins of one identity can both pass the invite (the second reuses or finds the account) and each create an entity. Nothing serialises them. Inferred from the code; not measured.

## Statements observed and inferred

- **Observed:**
  - Every run, count and verdict above.
  - The red run and its classification.
  - The negative control against the old entry point.
  - That `registered_entities` is stored as given, and that the planted claims are removed, both on the served function.
  - That the function log of the bank-auth run carries no identity value.
  - That no file under `apps/frontend/src` sets the arrival cookie.
- **Inferred:**
  - That the `email_exists` arm finds the identity's own account (never reached in a run).
  - That the invite with `data` leaves the password unset, as P5's recipe did without `data`. P5 recorded this as its own inference; the spec does not read `password_set`.

## Known Stubs

None.

## Threat Flags

None beyond the plan's register. The settings read uses the service role on a table the function did not read before; it is scoped by `project_id` and decides only refusal.

## Self-Check: PASSED

- Every file under `key-files.modified` exists, and the commit holds all 14.
- 0b6ab0cec is an ancestor of HEAD, and `git rev-list --count 27b10028b..HEAD` = 1 before this summary's commit.
- `tests/e2e-runs/179-e2e/179-13-held/results.json` and `179-13-close/restore.txt` (`restore: ok`) exist.
- STATE.md, ROADMAP.md, REQUIREMENTS.md, CONTEXT, RESEARCH, PATTERNS, UI-SPEC and CLAUDE.md were not touched.
