---
phase: 174-invitations-grants-defined-in-advance
verified: 2026-10-07T14:40:00Z
status: passed
score: 16/17 must-haves verified
covered_files:
  - .planning/phases/174-invitations-grants-defined-in-advance/174-01-PLAN.md
  - .planning/phases/174-invitations-grants-defined-in-advance/174-01-SUMMARY.md
  - .planning/phases/174-invitations-grants-defined-in-advance/174-02-PLAN.md
  - .planning/phases/174-invitations-grants-defined-in-advance/174-02-SUMMARY.md
  - .planning/phases/174-invitations-grants-defined-in-advance/174-03-PLAN.md
  - .planning/phases/174-invitations-grants-defined-in-advance/174-03-SUMMARY.md
  - .planning/phases/174-invitations-grants-defined-in-advance/174-04-PLAN.md
  - .planning/phases/174-invitations-grants-defined-in-advance/174-04-SUMMARY.md
  - .planning/phases/174-invitations-grants-defined-in-advance/174-05-PLAN.md
  - .planning/phases/174-invitations-grants-defined-in-advance/174-05-SUMMARY.md
  - .planning/phases/174-invitations-grants-defined-in-advance/174-06-PLAN.md
  - .planning/phases/174-invitations-grants-defined-in-advance/174-06-SUMMARY.md
  - .planning/phases/174-invitations-grants-defined-in-advance/174-07-PLAN.md
  - .planning/phases/174-invitations-grants-defined-in-advance/174-07-SUMMARY.md
  - .planning/phases/174-invitations-grants-defined-in-advance/174-08-PLAN.md
  - .planning/phases/174-invitations-grants-defined-in-advance/174-08-SUMMARY.md
  - .planning/phases/174-invitations-grants-defined-in-advance/174-09-PLAN.md
  - .planning/phases/174-invitations-grants-defined-in-advance/174-09-SUMMARY.md
  - .planning/phases/174-invitations-grants-defined-in-advance/174-10-PLAN.md
  - .planning/phases/174-invitations-grants-defined-in-advance/174-10-SUMMARY.md
  - apps/docs/src/routes/(content)/developers-guide/backend/authentication/+page.md
  - apps/docs/src/routes/(content)/developers-guide/backend/edge-functions/+page.md
  - apps/docs/src/routes/(content)/developers-guide/contestant-app/pre-registration-and-invitation/+page.md
  - apps/docs/src/routes/(content)/developers-guide/deployment/+page.md
  - apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts
  - apps/frontend/src/lib/api/adapters/supabase/utils/invitationAccess.ts
  - apps/frontend/src/lib/auth/invitationCodeLogin.ts
  - apps/frontend/src/lib/auth/passwordLogin.ts
  - apps/frontend/src/lib/auth/sessionAdmission.ts
  - apps/frontend/src/routes/admin/login/+page.server.ts
  - apps/frontend/src/routes/api/auth/callback/+server.ts
  - apps/frontend/src/routes/contestant/login/+page.server.ts
  - apps/supabase/scripts/lint-schema.mjs
  - apps/supabase/supabase/config.toml
  - apps/supabase/supabase/functions/account-access/contract.ts
  - apps/supabase/supabase/functions/account-access/deploymentChecks.ts
  - apps/supabase/supabase/functions/account-access/envConfig.ts
  - apps/supabase/supabase/functions/account-access/flowConformance.test.ts
  - apps/supabase/supabase/functions/account-access/index.ts
  - apps/supabase/supabase/functions/account-access/linkIssue.ts
  - apps/supabase/supabase/functions/account-access/mailTemplates.ts
  - apps/supabase/supabase/functions/account-access/signInLink.ts
  - apps/supabase/supabase/migrations/00001_initial_schema.sql
  - apps/supabase/supabase/schema/305-invitations.sql
  - apps/supabase/supabase/schema/506-invitation-rpcs.sql
  - apps/supabase/supabase/tests/database/07-rpc-security.test.sql
  - apps/supabase/supabase/tests/database/25-matrix-conformance.test.sql
  - apps/supabase/supabase/tests/database/39-invitations.test.sql
  - package.json
  - packages/dev-seed/src/supabaseAdminClient.ts
  - packages/dev-seed/src/templates/e2e/base.ts
  - scripts/assert-auth-signup-closed.mjs
  - scripts/assert-edge-env-defaults.mjs
  - scripts/assert-no-candidate-app-names.mjs
  - scripts/assert-project-scoped-queries.mjs
  - tests/IDURA-TEST-RUNBOOK.md
  - tests/playwright.config.ts
  - tests/tests/fixtures/shared/invitationFlow.fixture.ts
  - tests/tests/specs/auth/public-signup-closed.spec.ts
  - tests/tests/specs/contestant/contestant-journey.spec.ts
  - tests/tests/specs/contestant/invitation-contract.spec.ts
  - tests/tests/specs/contestant/invitation-landing.spec.ts
  - tests/tests/specs/perm/perm-localisation-positive.spec.ts
  - tests/tests/utils/mailedLink.ts
  - tests/tests/utils/supabaseAdminClient.ts
covered_digest: "v3:sha256:31121e5bc92f05d51f286480844c2160e44959ef16e2da8d03a18c22cc72d7fc"
behavior_unverified: 1
overrides_applied: 1
decision_coverage:
  honored: 24
  total: 24
  not_honored: []
deferred:
  - truth: "INV-05 / criterion 5 shown end to end through the application: an invited candidate using the Contestant App in the state create_invitations leaves it (confirmed)"
    addressed_in: "Phase 177.1"
    evidence: "Phase 177.1 success criterion 4: 'The E2E journey invites its candidate through the extended call, with the entity's confirmed state and its nomination stated outright, and runs as the invitation model leaves an invited user. invitationFlow.whileHiddenFromVoters is removed'"
  - truth: "INV-04 'leading to password sign-in' as a path a user can walk: invitationCodeLogin and the writer's checkInvitationCode, requestSignInLink and signInWithInvitationCode have no caller in the application"
    addressed_in: "Phase 178"
    evidence: "Phase 178 discussion record: 'the phase builds screens over the endpoints Phase 174 delivers — the code check answering valid, used or unknown, the link request, the code sign-in and claim_invitations'; Phase 174 roadmap record: 'it builds no new screen — the screens that drive a claim are Phase 178 (174-A2)'"
behavior_unverified_items:
  - truth: "The served account-access function issues no link, and takes no slot, on a deployment whose auth service allows public sign-up or whose redirect allowlist refuses the callback URL"
    test: "Serve the function against an auth service with enable_signup = true (or with the callback entry removed from additional_redirect_urls), seed an email invitation, and send request-link for that address with a witness"
    expected: "The answer is the usual { accepted: true }; the witness reads not-sent; the mail catcher holds no mail; no auth user exists for the address; private.invitation_throttle holds no link: key for it; the function log holds the one line naming which check refused"
    why_human: "Both refusing branches are exercised only in linkIssue.test.ts and deploymentChecks.test.ts with injected answers. index.ts, which wires them to the real auth service, is imported by no test and type-checked by nothing; the local stack is configured to pass both checks, and making it fail one needs a config change and a stack restart, which this verification was not allowed to do"
human_verification:
  - test: "Serve account-access against an auth service that fails one deployment check, then request a link for an invited address"
    expected: "No mail, no account, no throttle key, witness not-sent, one log line naming the refusing check"
    why_human: "Present and wired, behaviour on the served function unverified (see behavior_unverified_items)"
  - test: "Review the 28 judgment-tier prohibitions listed in the report, in particular PROH-174-01 (two CLAUDE.md commits and several STATE/ROADMAP/REQUIREMENTS commits were made during the phase window by the orchestrating session, outside any plan), PROH-174-02 (nothing under tests/e2e-runs/ deleted, no run retried until green), PROH-174-03 (stack restarted only with yarn db:stop / yarn db:start), PROH-174-14 (the uncommitted probe function) and PROH-174-27 (never supabase db push, nothing generated edited by hand)"
    expected: "The operator confirms each, or names the one that was broken. For PROH-174-01: confirms that c1d049136 (the void run added to the E2E hard rule) and 78a9ff95b (the Edge Function names) were made at the operator's direction"
    why_human: "Judgment-tier prohibitions are never passed silently. The verifier's verdicts are non-authoritative, and five of them concern what was typed or deleted during execution, which no file on disk can show"
  - test: "A native speaker reads the sign-in mail in da, et, fi, fr, lb and sv (apps/supabase/supabase/functions/account-access/mailTemplates.ts)"
    expected: "Subject and body are correct and natural in each language"
    why_human: "The six non-English texts were written by the executor; text quality cannot be verified programmatically (todo 2026-10-07-174-native-speaker-review-sign-in-mail.md)"
  - test: "On the first hosted project: read GET <project url>/auth/v1/settings with the anon key, check the redirect allowlist entry for <SITE_URL>/*/api/auth/callback, set SITE_URL and the SMTP secrets, request one link and read the function log"
    expected: "disable_signup true and mailer_autoconfirm false; one mail arrives; no refusal line in the log. Correct the two dashboard switch names in the deployment docs if they differ"
    why_human: "External service. Nothing is deployed; the dashboard labels in the docs are stated there as unverified, and INV-03 on a hosted project rests on these two switches alone because claim_invitations has no guard of its own"
  - test: "Run yarn vitest run --config tests/vitest.config.ts mailedLink once, and decide whether tests/tests/utils/*.test.ts belongs in a gate row"
    expected: "22 tests pass"
    why_human: "The test that holds 'the mailed link is opened as received' against a parse-and-rebuild is in no gate row and has no recorded run at the closing head; the verifier was not permitted to run test suites"
overrides:
  - must_have: "The served account-access function refuses a misconfigured deployment (both deployment-check branches)"
    reason: "Operator acceptance, 2026-10-07: present and wired, held by unit and source tests only; never run on the served function. Accepted as a recorded residual; the Edge Functions come under a typecheck in Phase 180."
    accepted_by: "operator"
    accepted_at: "2026-10-07T15:00:00Z"
operator_acceptance:
  accepted_by: "operator"
  accepted_at: "2026-10-07"
  statement: "Accept all five items."
  items:
    - item: "The served function on a misconfigured deployment — behaviour unverified"
      decision: "accepted as a residual (override above)"
    - item: "The 28 judgment-tier prohibitions, including PROH-174-01 (two CLAUDE.md commits in the phase window)"
      decision: "accepted. c1d049136 (the void run in the E2E hard rule) was made at the operator's explicit request. 78a9ff95b (the Edge Function names) was made by the orchestrating session on its own announced intent, without a prior instruction; the operator accepted it afterwards with this item."
    - item: "Native-speaker review of the sign-in mail in da, et, fi, fr, lb and sv"
      decision: "accepted; stays a filed todo (2026-10-07-174-native-speaker-review-sign-in-mail.md). The review has not been done."
    - item: "A hosted project's auth settings, allowlist entry and SMTP secrets; the two dashboard switch names"
      decision: "accepted; nothing is deployed. Stays a filed todo (2026-10-07-174-hosted-project-auth-settings-allowlist-and-function-variables.md). Not checked."
    - item: "tests/tests/utils/mailedLink.test.ts is in no gate row"
      decision: "accepted. Run once by the orchestrating session on 2026-10-07 at head a7a106654-equivalent tree: `yarn vitest run --config tests/vitest.config.ts mailedLink`, exit 0, 1 file, 22 tests passed. Whether tests/tests/utils/*.test.ts joins a gate row is not decided."
---

# Phase 174: Invitations — Grants Defined in Advance Verification Report

**Phase Goal:** An admin can attach an email or a registration code to an entity ahead of time, and the person who later proves that email or code receives exactly the grant the invitation defined — no more, and nobody else.
**Verified:** 2026-10-07T14:40:00Z
**Status:** passed — verified `human_needed` with no gap; the operator accepted all five human-verification items on 2026-10-07 (frontmatter `operator_acceptance`). One truth is PASSED (override): the served function's refusal of a misconfigured deployment is held by unit and source tests only.
**Re-verification:** No, initial verification

**Method.** Goal-backward against the tree at HEAD `a7a106654` and the applied local database (127.0.0.1:54322). `git diff d6ad5ed92..HEAD -- . ':!.planning'` is empty and the working tree holds no tracked change, so the recorded closing runs describe the tree as it stands.

**What I did not do.** I started no dev server, ran no E2E suite, no gate set, no pgTAP and no unit test, reset or wrote nothing in the database, and restarted nothing. I opened no untracked environment file and no `db-start.log`. Every E2E, pgTAP and unit result below is a **recorded** run I read on disk and did not make. The run directories under `tests/e2e-runs/` are gitignored, so that evidence exists on this host only.

**Provenance tags used below.** `[RAN]` a command I executed myself, exit status read directly. `[TREE]` read in the tree or in git history. `[DB]` read from the applied database in a read-only transaction. `[RECORDED]` a recorded run directory or log, read, not made. `[SUMMARY]` taken from a SUMMARY or the name map and not checked.

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | **Criterion 1 / INV-01.** An admin seeds an invitation for a candidate or an organization with an email or a code, stating the grant; a caller without admin authority is refused | ✓ VERIFIED | `[DB]` `public.invitations` with its 14 constraints, 3 policies (`admin_select/insert/delete_invitations`, all `TO authenticated`), column grants (INSERT on seven columns, SELECT on twelve, neither `code_hash` nor `pending_email`), RLS on; `create_invitations(uuid, jsonb)` is `SECURITY INVOKER`, `search_path=""`, executable by `authenticated` and `service_role`, not `anon`. `[DB]` as `anon`: `create_invitations` and a table read are each `permission denied`. `[TREE]` the INSERT policy is the authority map with its three permission literals inline; `invitations_scope_check`, `invitations_role_confers_check` and `invitations_project_target_check` bind the service role. `[TREE]` pgTAP Section 2 asserts every case twice (function and direct insert): the three admitted shapes, self-promotion, cross-project target, account/global/entity-admin shapes, entity editor and `anon`. `[RECORDED]` pgTAP row 0, `Files=39, Tests=1706, PASS` in gate set `174-10-final-r2`. `[RECORDED]` E2E `invitation-contract` seeds both rows. **The refusals are shown in pgTAP only**; see Residuals R1 |
| 2 | **Criterion 2 / INV-02.** A duplicate is refused and the first is unchanged: same email for the same target whatever the role, or a code the project already holds whatever its target | ✓ VERIFIED | `[DB]` `invitations_email_target_key` unique on `(project_id, email, scope, target_type, target_id) NULLS NOT DISTINCT WHERE email IS NOT NULL`; `invitations_code_hash_key` unique on `(project_id, code_hash)`. `[TREE]` pgTAP Section 4: other letter case refused, first row's id and `created_at` unchanged, same address on another target accepted, a batch with one duplicate writes nothing, project scope with the other role refused, a second code hash refused, a claimed row still refuses. `[RECORDED]` E2E "a duplicate invitation is refused, and the first is left unchanged" (23505, rows equal before and after). The code-hash duplicate is pgTAP only: no API caller can choose a hash |
| 3 | **Criterion 3 / INV-03.** A user who proves the email or the code holds exactly the promised grants; one who proves neither gets none; an invitation cannot be claimed into another account | ✓ VERIFIED | `[DB]` `claim_invitations(uuid)` has one signature, `SECURITY DEFINER`, executable by `authenticated` only; `anon` and `service_role` each get `permission denied` (observed). `[DB]` the applied bodies of `claim_invitations`, `create_invitations`, `invitation_link_request`, `invitation_code_status`, `invitation_code_claimant_email` and `invitation_link_release` are byte-equal to the schema file at HEAD (md5 of `prosrc` against the source), so no negative-control mutant is left applied. `[TREE]` the claim reads `auth.uid()` and that user's own `auth.users` row, requires `email_confirmed_at`, copies the invitation's four columns, tells the two unique violations apart by constraint name (both names exist in the applied database). `[TREE]` pgTAP Sections 10 to 13 and 15. `[RECORDED]` E2E `invitation-contract` 15/15 (the claim is called over the API with the user's own token; grants claim empty before, exactly the promised grant after the refresh; a second claim nothing; a user who proved another address nothing; a claim naming an address is `PGRST202`), `invitation-landing` 3/3, `contestant-journey` step 5.5. `[RECORDED]` seven mutant slices, each red with exactly one failure. `[RAN]` the control this rests on is live: `174-stack-probe.sh after` exit 0 (`GOTRUE_DISABLE_SIGNUP true`, `GOTRUE_MAILER_AUTOCONFIRM false`, both live requests `422 signup_disabled`, no user left) |
| 4 | **Criterion 4 / INV-04.** A used code is still on record: answered `used`, leading to password sign-in, never `unknown` or an error, and grants nothing twice | ✓ VERIFIED (server contract; the screen is Phase 178's) | `[TREE]` `invitation_code_status` answers `used` on `claimed_at IS NOT NULL`; the DELETE policy admits unclaimed rows only; both user columns are `ON DELETE SET NULL`. `[DB]` a string naming nothing answers `unknown`. `[TREE]` pgTAP Section 16. `[RECORDED]` E2E "the code then answers used", "a used code grants nothing twice", "a used code signs in with its claimant's password only, and no answer names the claimant". `[RECORDED]` writer integration report `174-10-integration-r2.json`, head `d6ad5ed92`: 11 of 11, the four invitation cases included. `invitationCodeLogin` and three of the four writer methods have **no caller in the application** `[TREE]`; see Deferred |
| 5 | **Criterion 5 / INV-05.** A named entity seeded with an email or a code is confirmed from that moment; one seeded without either stays unconfirmed and invisible to voters | ✓ VERIFIED (database and screenless E2E; not end to end through the app, see Deferred) | `[TREE]` `create_invitations` sets `confirmed = true` in the same transaction for a candidate with two non-blank names and for the other three types with text in `name`. `[TREE]` pgTAP Section 6: named candidate and organization confirmed, nameless ones stay unconfirmed, a named candidate nobody invited stays unconfirmed, a direct insert confirms nothing, a project-scope promise confirms nothing. `[RECORDED]` E2E "seeding an invitation confirms the named entity" reads both reserved rows `false` before and `true` after. `[DB]` `confirmed` defaults to `false` on all five tables and `anon_select_candidates` / `anon_select_organizations` each require `confirmed`. The "stays unconfirmed" half is pgTAP only |
| 6 | **Criterion 6 / E2E-03.** The full E2E suite is green at close, the invitation and registration specs re-pointed at the new model | ✓ VERIFIED (recorded) | `[RAN]` `174-verdict.mjs e2e 174-10-final-r3 --same-projects-as 174-09-close` exit 0: total 218, passed 218, failed 0, flaky 0, skipped 0, did not run 0, 106 projects, every project at its `174-09-close` total, head `d6ad5ed92`, no Sleep entry. `[RECORDED]` retries 0 for every project; `contestant-journey` and both `perm-localisation-positive` tests passed at retry 0. `[RAN]` `gates 174-10-final-r2` exit 0, fifteen rows at 0. `[RAN]` `e2e 174-10-r2-bank-auth` exit 0 (8 of 8) and `e2e 174-10-r2-bank-auth-journey` exit 0 (152 of 152). The journey's invited candidate runs unconfirmed under `whileHiddenFromVoters`; see Deferred |
| 7 | **Plan 01.** Preconditions, name map, five drivers, green baseline before any source edit | ✓ VERIFIED | `[RECORDED]` `174-01-baseline`: E2E 198 of 198, exit 0; thirteen gate rows at 0. `[RAN]` six artifacts and two key links pass `verify.artifacts` / `verify.key-links` |
| 8 | **Plan 02.** The table, the authority map in its policies, the server-generated code, the two ratified lists, the repository's own schema workflow | ✓ VERIFIED | Truths 1 and 2, and: `[DB]` 20 draws of `private.generate_invitation_code()` all match the Crockford shape and are distinct; `normalise(' ab-oi l0 ')` is `AB0110`; two spellings hash alike. `[TREE]` `SAME_PERMISSION_ALLOW` gains exactly two entries and `m17_unenforced_ratified` loses exactly two (the whole diff of both files read). `[RAN]` `assert-schema-migration-parity.mjs` exit 0; both schema files are contained verbatim in the one migration. `[TREE]` `claim_invitations` first appears in `de0cc2808` (174-04), not in 174-02 |
| 9 | **Plan 03.** Public sign-up closed and confirmations on, in the file and on the running stack; a gate in `lint:check`; one E2E project; `per_worker`; the docs | ✓ VERIFIED | `[TREE]` `[auth] enable_signup = false`, `[auth.email] enable_signup = true`, `enable_confirmations = true`, `[edge_runtime] policy = "per_worker"`. `[RAN]` `assert-auth-signup-closed.mjs` exit 0, `--self-test` exit 0 (seven cases); it is the last link of `lint:check`. `[RAN]` stack probe exit 0, edge rows `SITE_URL`, `SMTP_HOST`, `SMTP_PORT` each EQUAL to the tracked template. `[RAN]` `170-allowlist-probe.sh after` exit 0, ten rows OK. `[RECORDED]` `auth-service-contract` 2/2; `174-03-probe-before.txt` shows both requests answering 200 before the change; `174-03-mail-probe.txt` PASS; bank-auth 8/8 and 152/152 under `per_worker` at 174-03's close. `[SUMMARY]` that the operator set the three lines of the functions' file at the checkpoint |
| 10 | **Plan 04.** `claim_invitations` with `password_set`, the six service-only helpers, the limits, the slot release, the witness | ✓ VERIFIED | Truth 3, and: `[DB]` the six `invitation_*` helpers are `SECURITY DEFINER` and executable by `service_role` only (`authenticated` refused on three of them, observed); `private.invitation_throttle` and `private.invitation_link_witness` grant nothing to any API role (`service_role` refused a read, observed). `[TREE]` throttle keys are `link:<project>:<sha256 of the address>` and `code:<project>:<hash>`; no header reaches them. `[TREE]` the definer census in `07-rpc-security.test.sql` gains exactly `claim_invitations`. `[TREE]` pgTAP Sections 14 and 16 to 21. The tool cannot resolve this plan's three key links (their `from` is an SQL object, not a file); read by hand in the source and the applied database: WIRED |
| 11 | **Plan 05.** `account-access`: three operations, the uniform answer returned before any work, the link's origin from configuration, seven locales, the order of a link issue, log hygiene, one live run | ✓ VERIFIED for everything the served function was seen to do | `[TREE]` `index.ts` builds the answer and returns after `EdgeRuntime.waitUntil`; the project is validated as a uuid and read from the request only; `linkIssue.ts` runs sign-up check, redirect check, eligibility, `invite` then `magiclink`, mail, release, witness, in that order; no `createUser`, no `inviteUserByEmail`; the log receives a fixed message and at most a name and a code that match `^[A-Za-z0-9_.:-]{1,64}$`. `[RAN]` `OPTIONS` answers 200 for the three functions. `[RECORDED]` `174-05-fn-probe.txt` PASS, twelve steps; unit row: `linkIssue` 65, `contract` 54, `signInLink` 46, `mailTemplates` 70, `deploymentChecks` 27, `flowConformance` 31. `[RECORDED]` E2E: hostile headers do not move the link; the locale reaches path and text. The refusing branches are truth 17 |
| 12 | **Plan 06.** Fixtures first, then the screenless contract spec; negatives asserted after a completion witness; cleanup | ✓ VERIFIED | `[TREE]` every link request of the spec goes through `askForLink`, which waits for the request's own witness; `expectNothingSent` asserts the witness outcome first; no elapsed-time wait carries a negative. `[TREE]` `toRunOrigin` replaces the origin by slicing and leaves path and query byte-identical; `assertSignInLinkShape` checks path, exactly two parameters, the type, a non-empty token, no credentials, no fragment. `[RECORDED]` 15/15; `afterAll` asserts no invitation and no user left. `[DB]` `public.invitations` holds 0 rows and `auth.users` 2. **Warning:** `mailedLink.test.ts` is in no gate row (Anti-Patterns) |
| 13 | **Plan 07.** `invite-candidate`, its client contract, its gate entries and its name-gate exemption are gone | ✓ VERIFIED | `[RAN]` `OPTIONS /functions/v1/invite-candidate` answers 404. `[RAN]` `174-verdict.mjs greps` exit 0, four literals, no hit; `exemptions` exit 0, one entry, both stated counts agree. `[RAN]` my own `git grep` over the whole tree outside `.planning/` for the four literals and `get_candidate_user_data`: no hit, `CLAUDE.md` included. `[RAN]` `assert-no-candidate-app-names.mjs`, `assert-edge-env-defaults.mjs`, `assert-project-scoped-queries.mjs`, `assert-edge-function-env.mjs` each exit 0. `[TREE]` the name gate's fixture is 136 lines before and after, four lines edited in place. `[TREE]` `send-email` and `identity-callback` changed in comments only (the non-comment diff of seven files is empty) |
| 14 | **Plan 08.** Session, claim, refresh, gates at every entry point; four writer methods; code login without a screen | ✓ VERIFIED | `[TREE]` `admitSession` claims, refreshes when `claimed` is non-empty, then reads the session and gates; `passwordLogin` and `invitationCodeLogin` both end in it; both login actions pass `createDataWriter({ fetch, locals }).claimInvitations()`; the callback verifies, claims, refreshes, lands. The claim's only argument is the adapter's project. `signInWithInvitationCode` hands the two tokens to `setSession` and returns neither. No route, page, layout or message file was added by the phase. `[RECORDED]` unit row: `sessionAdmission` 10, `passwordLogin` 27, `invitationCodeLogin` 6, callback `server.test.ts` 15, `invitationAccess` 23; titles include "claims, then refreshes, then reads the session, and gates on the session it read". `[RECORDED]` E2E "an invited project admin enters the Admin App through its login, with the grant claimed in the same request". One disclosed exception to "every entry point": `api/contestant/preregister` establishes a session and calls no claim (roadmap todo X2 (a), filed) |
| 15 | **Plan 09.** The journey and the localisation spec register through the mailed link; the old helper and the callback's `invite` arm are gone; landing spec | ✓ VERIFIED, with the scheduled residual | `[TREE]` journey step 3 seeds with `inviteByEmail`, asserts that seeding alone created no account and no editor, reads the mail, asserts the link's shape, replaces only the origin; step 4 opens it through the real callback; step 5.5 reads the grant with nothing in the walk writing one. `[TREE]` `REFUSED_TYPE = 'invite'` is refused before `verifyOtp`. `[TREE]` no `inviteUserByEmail` anywhere outside `.planning/`. `[RECORDED]` `contestant-journey` 1/1, `perm-localisation-positive` 2/2, `invitation-landing` 3/3 in the closing run. The journey's candidate is made unconfirmed again by `whileHiddenFromVoters` (Deferred) |
| 16 | **Plan 10.** Docs with every residual by mechanism, skills, todos, obligations, the closing gate on one tree | ✓ VERIFIED | `[TREE]` the six required residuals are on `developers-guide/backend/authentication` § _What this does not protect against_, each by mechanism, with two more (the auth service's own `/otp`; `identity-callback` accounts reading as `password_set`). `developers-guide/backend/security` holds a `+page.ts` redirect only. `[TREE]` the deployment page states the two switches, the allowlist entry, `SITE_URL`, the SMTP variables, that the function's refusal does not protect the claim, and that the switch names are unverified. `[DB]` the skill's counts match: 21 tables, 92 + 15 = 107 policies, 23 permission members; `[RECORDED]` 1706 assertions. `[TREE]` 22 todos named `2026-10-07-174-*`, the two the roadmap assigns among them. `[RAN]` all four closing runs record `d6ad5ed92`. `[RAN]` `audit-skill-links.sh database` exit 1, 30 dangling: every one of the 30 tokens is already in the pre-phase text of its file, so the count did not grow (checked token by token; I did not run the audit on the pre-phase tree) |
| 17 | **Plan 05, the refusals.** The served function issues no link and takes no slot when public sign-up is open or the callback URL is not an admitted redirect | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | `[TREE]` the two checks precede the eligibility call in `linkIssue.ts`, and `index.ts` wires them to `GET /auth/v1/settings` and to the redirect question. `[RECORDED]` `linkIssue.test.ts` and `deploymentChecks.test.ts` pass with injected answers. Nothing runs the served function against an auth service that fails either check; `index.ts` is imported by no test and type-checked by nothing. The positive path is live, which shows the two setting names are read correctly. See Human Verification 1 |

**Score:** 16/17 truths verified; 1 PASSED (override) — present, behaviour on the served function unverified, accepted by the operator on 2026-10-07

### Deferred Items

Not failures of this phase's criteria. They are what is left of "shown end to end", each scheduled in the roadmap.

| # | Item | Addressed In | Evidence |
|---|------|--------------|----------|
| 1 | INV-05 through the application. `invitationFlow.whileHiddenFromVoters` unconfirms the candidate's nominations, seeds, unconfirms the candidate, restores the nominations. The journey's invited candidate therefore uses every Contestant App page **unconfirmed**, a state `create_invitations` never leaves a named entity in. The claim, the mail and the callback do not read `confirmed`, so INV-03 is unaffected. What is **not** shown anywhere: a confirmed, invited entity driven through the app, and the voter side of an entity that an invitation made public | Phase 177.1 | success criterion 4 removes the wrapper and makes the journey "run as the invitation model leaves an invited user" |
| 2 | INV-04's "leading to password sign-in" as a path a user walks. `invitationCodeLogin`, `checkInvitationCode`, `requestSignInLink` and `signInWithInvitationCode` have no caller under `apps/frontend/src` | Phase 178 | "the phase builds screens over the endpoints Phase 174 delivers"; Phase 174 "builds no new screen" |

**What this means for INV-05 and criterion 5.** The rule is shown where it is enforced: in the database as a project editor through row-level security (pgTAP), and on the running stack on two reserved rows that hold no nomination (E2E, seeded by the service role). It is not shown end to end. No spec opens an application page as or about an entity in the confirmed-by-invitation state, and the one spec that would have done so undoes the confirmation on purpose.

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `apps/supabase/supabase/schema/305-invitations.sql` | table, constraints, code functions, trigger, privileges, three policies, cleanup triggers | ✓ VERIFIED | applied database matches, object by object |
| `apps/supabase/supabase/schema/506-invitation-rpcs.sql` | `create_invitations`, `claim_invitations`, six helpers, throttle, witness | ✓ VERIFIED | six applied bodies byte-equal to the source |
| `apps/supabase/supabase/tests/database/39-invitations.test.sql` | INV-01 to INV-05 as behaviour | ✓ VERIFIED (recorded) | `plan (259)`, 21 sections, no skip |
| `apps/supabase/supabase/functions/account-access/` | three operations, pure modules, conformance test | ✓ VERIFIED | served: `OPTIONS` 200 |
| `scripts/assert-auth-signup-closed.mjs` | the gate over the auth switches | ✓ VERIFIED | ran, with its self-test |
| `apps/frontend/src/lib/auth/sessionAdmission.ts` | claim, refresh, session, gate | ✓ VERIFIED | used by both login helpers |
| `apps/frontend/src/lib/auth/invitationCodeLogin.ts` | code login | ⚠️ ORPHANED by design | exported, unit-tested, no caller until Phase 178 |
| `apps/frontend/src/routes/api/auth/callback/+server.ts` | `magiclink` arm, no `invite` arm | ✓ VERIFIED | |
| `tests/tests/specs/contestant/invitation-contract.spec.ts`, `invitation-landing.spec.ts`, `tests/tests/specs/auth/public-signup-closed.spec.ts` | the contract, the landings, the closed sign-up | ✓ VERIFIED (recorded) | 15, 3 and 2 tests, all passed at retry 0 |
| `tests/tests/utils/mailedLink.ts` | the one normalisation of a received link | ✓ VERIFIED | its unit test is ungated |
| docs, skill, `174-NAME-MAP.md` | as plan 10 | ✓ VERIFIED | `verify.artifacts` passes for all ten plans (34 of 34) |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| INSERT/SELECT/DELETE policies | `public.user_can` | three permission literals inline | WIRED | `[DB]` |
| `create_invitations` | `public.invitations` | INSERT as the caller; code read from a transaction-local setting | WIRED | `[TREE]` |
| `claim_invitations` | `public.grants`, `auth.users` | one INSERT per row; `email_confirmed_at` of `auth.uid()` | WIRED | `[TREE]` `[DB]`, by hand |
| `invitation_link_request` | `private.invitation_throttle_take` | one slot per address per 60 seconds | WIRED | `[TREE]`, by hand |
| `account-access/index.ts` | `invitation_link_request`, `invitation_link_release`, `invitation_link_witness`, the auth service | `rpc`; `generateLink` invite then magiclink | WIRED | `[TREE]` |
| login actions, auth callback | `claim_invitations` | `createDataWriter({ fetch, locals }).claimInvitations()` on the request's own client | WIRED | `[TREE]` |
| `package.json` `lint:check` | `assert-auth-signup-closed.mjs` | last link | WIRED | `[TREE]` `[RAN]` |
| `playwright.config.ts` | the three new specs | projects `auth-service-contract`, `invitation-contract`, `invitation-landing` | WIRED | `[TREE]` `[RECORDED]` |
| journey, localisation spec | `mailedLink.ts` | `assertSignInLinkShape`, `toRunOrigin`, `page.goto` | WIRED | `[TREE]` |

`verify.key-links` passes 25 of 28; the three it cannot resolve are plan 04's, read by hand above.

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| auth callback | `claim` | `claim_invitations` RPC on the user's session | yes: E2E reads the grant row and the refreshed token's claim | ✓ FLOWING |
| `admitSession` | `session.access_token` grants | token issued after `refreshSession` | yes: landing spec, admin login | ✓ FLOWING |
| `account-access` mail | `link` | `generateLink` `hashed_token` + `SITE_URL` | yes: the mailed link verifies to a session | ✓ FLOWING |

No component renders invitation data in this phase.

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Public sign-up refused on the running service | `bash 174-stack-probe.sh after` | every row OK, exit 0 | ✓ PASS |
| Redirect allowlist admits the callback and nothing else | `bash 170-allowlist-probe.sh after` | ten rows OK, exit 0 | ✓ PASS |
| The gate catches each regressed switch | `node scripts/assert-auth-signup-closed.mjs --self-test` | 7 cases, exit 0 | ✓ PASS |
| The three functions are served and the deleted one is not | `curl -X OPTIONS` ×4 | 200, 200, 200, 404 | ✓ PASS |
| The claim is refused to `anon` and to `service_role` | `set role …; select claim_invitations(…)` | `permission denied` twice | ✓ PASS |
| The helpers are refused to `authenticated` | `set role authenticated; select invitation_code_status / link_request / claimant_email` | `permission denied` three times | ✓ PASS |
| No API role reads a code hash or a pending address | `select code_hash` / `select pending_email` / `select *` as `authenticated` | `permission denied` three times | ✓ PASS |
| An unknown code answers `unknown`; codes fold look-alikes | read-only `select` | `unknown`; `AB0110`; hashes equal | ✓ PASS |
| Closing verdicts | `174-verdict.mjs gates / e2e ×3 / greps / exemptions / hygiene` | exit 0 each | ✓ PASS |

### Probe Execution

| Probe | Command | Result | Status |
|-------|---------|--------|--------|
| `174-stack-probe.sh` | `bash … after` | exit 0 | PASS |
| `170-allowlist-probe.sh` | `bash … after` | exit 0 | PASS |

### The closing evidence

| Label | Kind | Head | Result | Evidence? |
|-------|------|------|--------|-----------|
| `174-gates/174-10-final-r2` | gate set | `d6ad5ed92` | 15 rows at 0 | **yes** |
| `174-e2e/174-10-final-r3` | default E2E | `d6ad5ed92` | 218 / 0 / 0 / 0 / 0, 106 projects | **yes** |
| `174-e2e/174-10-r2-bank-auth` | bank-auth | `d6ad5ed92` | 8 of 8 | **yes** |
| `174-e2e/174-10-r2-bank-auth-journey` | bank-auth journey | `d6ad5ed92` | 152 of 152 | **yes** |
| `174-gates/174-10-integration-r2.json` | writer integration | `d6ad5ed92` | 11 of 11 | **yes** |
| `174-e2e/174-10-final` | default E2E | `0b393f144` | exit 8, 0 tests | **VOID**, not evidence |
| `174-e2e/174-10-final-r2`, `174-gates/174-10-final`, `174-e2e/174-10-bank-auth` | green | `0b393f144` | green | superseded (stale head) |
| `174-e2e/174-10-bank-auth-journey` | bank-auth journey | `0b393f144` | 69 passed, 1 failed, 82 did not run | **RED**, see below |

`[RAN]` the verdict on the plan's own bank-auth labels exits 1 for both (stale; the journey red with five failures). The evidence labels are the `r2` / `r3` ones.

**The void run.** `VOID-host-suspend.txt` exists in `174-e2e/174-10-final` and in no other directory under `174-e2e/` or `174-gates/` (`find`, both trees). Its `exit` file holds 8. The marker is corroborated independently: `power.txt` holds a `pmset` Sleep entry inside the window ("Clamshell Sleep", 247 s) and the heartbeat gap is 244,909 ms. No run counted as evidence carries the marker or a Sleep entry.

**The red bank-auth-journey run: is the cause established?** Yes. It is established by evidence on disk and not only by the green re-run.

1. `[RECORDED]` The one failed test is `contestant-journey`: `inviteByEmail: the link request finished without handing a mail over`. It started at 13:41:32.423Z and ran 4.037 s.
2. `[RECORDED]` The driver's function log for that run holds one `account-access` request, and 0.18 s before the test threw: `account-access: a link could not be issued or mailed; its slot is given back {"name":"Error","code":"ERR_ENV_UNCONFIGURED"}`.
3. `[TREE]` That message is written in one place, the `catch` around create-user, mint-token, build-link, render-mail and send-mail in `linkIssue.ts`. The code `ERR_ENV_UNCONFIGURED` is assigned in one place, `requireEnv`. Inside that block `requireEnv` is reached only in `sendMail`, for `SMTP_HOST`, `SMTP_PORT` and `SMTP_FROM`. An unset `SITE_URL` cannot produce this line: it throws while the dependencies are built and logs a different message.
4. `[TREE]` The driver's generated function environment before `d6ad5ed92` is seven fixed lines with no `SMTP_*` among them.
5. `[RECORDED]` On the same tree head, `0b393f144`, `contestant-journey` passes on the default stack (`174-10-final-r2`), where the container holds `SMTP_HOST`.
6. `[TREE]` `[RECORDED]` `d6ad5ed92` adds exactly the three lines, read from the tracked template; the same slice is then 152 of 152.

So a required SMTP variable was unset in the function environment the driver served: that is read from the log and the source, not inferred. Which of the three threw is not in the log; with all three absent the code reads `SMTP_HOST` first. The mechanism is deterministic (a missing variable throws on every send), not a race. The defect was in the bank-auth driver and the runbook it encodes, not in product code or in a spec, and the product behaved as designed for a deployment with no mail transport. The failure was not reproduced a second time before the fix; given points 2 to 4 that does not leave the cause open. **Not a red rerun to green without a cause; not a cardinal failure.** All four closing runs were made again on the fixed head, as PROH-174-26 requires.

Incidental live evidence from the same line: the served function's failed-send branch ran, released its slot (no "the slot could not be given back" line follows) and completed its witness as `not-sent` (which is what the test read). The slot release was therefore seen on the served function once, in the log, although no test asserts it there.

### Requirements Coverage

| Requirement | Source Plans | Description | Status | Where it is shown |
|-------------|--------------|-------------|--------|-------------------|
| INV-01 | 01, 02, 07, 09, 10 | An admin can seed an entity with an email or a code, defining the grant in advance | ✓ SATISFIED | applied database (read); pgTAP Section 2 (recorded); E2E seeding by the service role. Refusals: pgTAP and my direct `anon` reads only |
| INV-02 | 02, 06, 10 | A duplicate is refused and the first is unchanged | ✓ SATISFIED | two unique indexes (read); pgTAP Section 4; E2E duplicate test (email half) |
| INV-03 | 01, 03, 04, 05, 06, 07, 08, 09, 10 | Claiming writes exactly the promised grants, only for the user who proved the email or the code | ✓ SATISFIED on the local stack | applied function equal to source (read); pgTAP 10 to 13, 15; E2E contract, landing, journey; sign-up closed (probe, ran). On a hosted project it rests on two dashboard switches |
| INV-04 | 04, 05, 06, 08, 10 | A used code is retained and leads to password sign-in | ✓ SATISFIED at the server contract | pgTAP 16; E2E used-code tests; integration report. The screen is Phase 178's |
| INV-05 | 02, 06, 10 | A named, invited entity is confirmed automatically; one without either stays unconfirmed | ✓ SATISFIED in the database and on reserved rows | pgTAP Section 6; E2E first test. Not end to end (Phase 177.1) |

No orphaned requirement: `REQUIREMENTS.md` maps exactly INV-01 to INV-05 to this phase, and every one is claimed by a plan. All five still read "Pending" there, and the phase's roadmap checkbox is open; both are the orchestrator's to update.

### Decision Coverage

All trackable CONTEXT.md decisions are honored by shipped artifacts (`check.decision-coverage-verify`: 24 of 24, exit 0). The check is a substring heuristic. Two decisions are honoured in part only, by the executors' own account `[SUMMARY]` and by the source `[TREE]`:

- **D-15 and D-18, the per-caller caps.** Neither "a cap per caller" nor "a coarse per-caller limit for unknown codes" is built. What stands: one mail per address per 60 seconds, one rebinding per code per 60 seconds, ten look-ups per used code per fifteen minutes. Stated in the docs as a residual and filed as a todo.
- **D-07, a code-hash collision "resolved by generating again".** Not built: a collision raises `23505` and undoes the batch.

### Prohibitions

Thirty prohibitions across the ten plans. Two are explicit-tier and are held by a wired check. **Twenty-eight are judgment-tier: every verdict below is the verifier's own, non-authoritative, and each is marked for human review.** None is passed silently.

| Id | Tier | Verdict | Basis |
|----|------|---------|-------|
| PROH-174-01 protected files never edited by a plan | judgment | holds for plan commits; **review** | `[TREE]` no commit scoped `(174-NN)` touches `CLAUDE.md`, `ROADMAP.md`, `REQUIREMENTS.md`, `PROJECT.md` or `STATE.md`; `CAND-APP-PLAN.md` is untracked with 0 commits. But `CLAUDE.md` was edited twice in the phase window by the orchestrating session (`c1d049136`, the void run added to the E2E hard rule; `78a9ff95b`, the Edge Function names), and STATE, ROADMAP and REQUIREMENTS by `docs(state)` / `docs(roadmap)` / `docs(v2.16)` commits. Whether the operator directed the two `CLAUDE.md` commits is not readable from git |
| PROH-174-02 no retry until green, no skip, nothing deleted | judgment | holds on what can be seen; **review** | `[RECORDED]` retries 0, skipped 0; `[TREE]` no `skip`, `fixme` or `only` added under `tests/`; the void and the red directory are kept; the red was fixed at an established cause. That nothing was ever deleted cannot be shown |
| PROH-174-03 restart only by `db:stop` / `db:start` | judgment | unverifiable; **review** | `[TREE]` no phase script holds a forbidden form. What was typed is not on disk |
| PROH-174-04 no claim before 174-03 | judgment | holds | `[TREE]` first appears in `de0cc2808` (174-04) |
| PROH-174-05 the map inline, one policy per command | judgment | holds | `[DB]` three policies; literals inline |
| PROH-174-06 ratified lists changed by two entries only | judgment | holds | `[TREE]` whole diffs read |
| PROH-174-07 `[auth.email] enable_signup` not false | judgment | holds | `[TREE]` `[RAN]` |
| PROH-174-08 no untracked environment file | **explicit** | green | `[RAN]` `174-verdict.mjs hygiene` exit 0, 0 hits over 9 scripts and 10 plans. It scans scripts and plan text, not commands typed by hand |
| PROH-174-09 the claim takes no address, user or invitation id | judgment | holds | `[DB]` one signature `(uuid)`; pgTAP token-claim case; E2E `PGRST202` |
| PROH-174-10 no address, code or hash to an API role | judgment | holds | `[DB]` privileges observed |
| PROH-174-11 no limit keyed on a header | judgment | holds | `[TREE]` |
| PROH-174-12 `invite` before `magiclink`, no `createUser` | judgment | holds | `[TREE]` |
| PROH-174-13 the caller supplies only a locale from a closed set | judgment | holds | `[TREE]` `contract.ts`, `resolveMailLocale` |
| PROH-174-14 the probe function never committed, not served | judgment | holds for the tree; **review** | `[TREE]` only `account-access` was ever added under `functions/`; three functions are served now. Whether it was served when the task ended is not on disk |
| PROH-174-15 the token comes out of the mail | judgment | holds | `[TREE]` `generateLink` under `tests/` is the pre-existing recovery helper only |
| PROH-174-16 the spec cleans up and touches only its rows | judgment | holds | `[RECORDED]` `[DB]` 0 invitations left |
| PROH-174-17 no invitation in `seed.sql` or the default template | judgment | holds | `[TREE]` |
| PROH-174-18 fixture lines edited in place | judgment | holds | `[TREE]` 136 / 136 |
| PROH-174-19 `send-email` behaviour unchanged | judgment | holds | `[TREE]` comment-only diff |
| PROH-174-20 no gate between sign-in and the refresh | judgment | holds | `[TREE]`; unit tests `[RECORDED]` |
| PROH-174-21 the claim's only argument is the project | judgment | holds | `[TREE]` |
| PROH-174-22 no route, page or message file added | judgment | holds | `[TREE]` |
| PROH-174-23 the session token is never logged or returned | judgment | holds | `[TREE]` |
| PROH-174-24 no fixture writes the grant of an invited user | judgment | holds | `[TREE]` `inviteByEmail` writes none |
| PROH-174-25 the password-reset step not re-pointed | judgment | holds | `[TREE]` |
| PROH-174-26 the closing statement from one tree | judgment | holds | `[RAN]` four runs and the integration report at `d6ad5ed92` |
| PROH-174-27 never `db push`; generated files not hand-edited | judgment | consistent; **review** | `[RAN]` parity exit 0; `[RECORDED]` `types-clean` 0. "Never" cannot be shown |
| PROH-174-28 no gate list widened to pass | judgment | holds | `[TREE]` every added entry names something that exists |
| PROH-174-29 no container's whole environment, no unfiltered log | **explicit** | green, with a note | `[RAN]` hygiene exit 0. `[SUMMARY]` one adjacent slip in 174-05 (the output of `yarn db:start`, local keys included, written to an evidence file and corrected); the E2E wrapper and the bank-auth driver still write `db-start.log` that way (todo filed). I opened none of those files |
| PROH-174-30 no negative on elapsed time | judgment | holds | `[TREE]` |

### Security

| Claim | Status | Basis |
|-------|--------|-------|
| The claim runs as the signed-in user, never the service role | ✓ | `[TREE]` the three call sites use the request's own client; `[DB]` `service_role` is refused `claim_invitations`; no service-role key under `apps/frontend/src` |
| No token, mailed link or code is logged | ✓ in the source | `[TREE]` the function's logger takes a fixed message and a filtered name and code; the writer and both login helpers log messages only; `[RECORDED]` unit cases "logs neither credential". The set-password redirect carries the user's own address in its query (pre-existing shape; Phase 178 moves it out of the URL) |
| Public sign-up is closed in `config.toml` and on the running stack | ✓ | `[TREE]` `[RAN]` probe |
| Held by `yarn assert:auth-signup-closed` in `lint:check` | ✓ | `[TREE]` `[RAN]` |
| Held by the `auth-service-contract` E2E project | ✓ | `[RECORDED]` 2/2 in the default suite |
| A confirmed address means a mailed link was opened or the service role vouched | ✓ locally | sign-up off, anonymous sign-ins off, `double_confirm_changes` on, confirmations on; `identity-callback` users carry a placeholder address |

### Comment Hygiene

`[RAN]` `assert-comment-hygiene.mjs` exit 0 (1889 files). `[TREE]` my own sweep of every line the phase added under `apps/`, `packages/`, `tests/` and `scripts/` (16,964 diff lines; generated migration and types excluded): **0** requirement, decision, plan, ruling or milestone ids, **0** phase references, and no history narrative (13 pattern hits, all describing runtime behaviour). The pgTAP section titles at HEAD carry no id. The docs pages the phase touched hold no planning id; two history sentences in `apps/supabase/README.md` (lines 40 and 101) predate the phase.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `tests/tests/utils/mailedLink.test.ts` | whole file | a test linked to a must-have truth that no gate row runs | ⚠️ Warning | `yarn test:unit` runs workspaces under `packages/*` and `apps/*`; `tests/` is not one, and the unit-coverage guard does not see it. No run of the file is recorded at the closing head. The helper is short and correct by reading, and the E2E specs exercise its positive path |
| `apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts` | 173, 179 | stale comments: "Supabase uses invite-based registration", "Invite session already established by auth callback's verifyOtp" | ⚠️ Warning | pre-existing lines in a file the phase edited; the phase made them false when it removed the callback's `invite` arm |
| `apps/supabase/supabase/functions/*/index.ts` | — | type-checked by nothing | ⚠️ Warning | pre-existing condition, now covering a third function; todo filed |
| `supabaseDataWriter.integration.test.ts` | — | gated on `SUPABASE_URL`, runs in no CI job | ⚠️ Warning | recorded 11 of 11 at the closing head by hand |
| `506-invitation-rpcs.sql` | 388 | the grant-holder arm compares `lower(btrim(u.email))`, which no index of `auth.users` serves | ℹ️ Info | `[DB]` the indexes are on `email` and on `(instance_id, lower(email))`. An anonymous link request for an address with no open invitation reads every user row; not measured with a plan |
| `305-invitations.sql`, `506-invitation-rpcs.sql`, `e2e-run.sh` | several | `XXXX-XXXX-XXXX`, `mktemp … .XXXXXX` | ℹ️ Info | matches of the debt-marker pattern that are a code format and a template, not markers. No `TBD`, `FIXME`, `TODO` or `HACK` was added by the phase |
| `apps/frontend/eslint.config.mjs` | one comment | a changed comment keeps its `158-MEDIUM:` tag | ℹ️ Info | passes the deterministic gate |

No blocker.

### Residuals: gap, human item or record?

| # | Fact | Decision | Why |
|---|------|----------|-----|
| R1 | INV-01's refusals are shown in pgTAP only; the E2E spec seeds as the service role | **recorded residual**, not a gap | The control is the INSERT policy. pgTAP exercises it as `authenticated` callers of four authority levels through both paths, and the policy, the privileges and the `anon` refusals are in the applied database as I read it. What no test does: seed as a real signed-in admin over HTTP with a token minted by the access-token hook. The `user_can` path is the one every other policy of the schema uses |
| R2 | `invitationCodeLogin` has no caller | **deferred** to Phase 178 | The roadmap says this phase builds no screen |
| R3 | The two refusing deployment-check branches are held by unit and source tests only | **human-verification item** (truth 17) | Behaviour on the served function was never exercised |
| R4 | The slot release after a failed send is held by unit tests only | **recorded residual** | Verified at module level, and seen once on the served function in the red run's log |
| R5 | Nothing type-checks `apps/supabase/supabase/functions/` | **recorded residual** | Pre-existing; all three operations of the new `index.ts` ran on the stack in the closing E2E run; todo filed |
| R6 | The dashboard switch names were never checked against a hosted project | **human-verification item**, at first deployment | External service. The docs say so and give a check that does not depend on a label |
| R7 | `audit-skill-links.sh database` exits 1 with 30 dangling | not a finding of this phase | Count did not grow |

### Statements in the SUMMARYs tested and found stronger than their evidence

I found no statement in a SUMMARY that the tree, the database or the recorded runs contradict. Four say more than their evidence carries:

1. **174-10, "the operator's `78a9ff95b`".** The commit carries the same `Claude-Session` trailer as the executors' commits. That the operator directed it may be true and is not readable from git (PROH-174-01, human item 2).
2. **174-10, "All five … each shown in the database and on the running stack".** For INV-05 only the confirming half is on the running stack; "stays unconfirmed" is pgTAP only. For INV-02 the code-hash half is pgTAP only. The SUMMARY's parenthesis names the INV-01 exception and not these two.
3. **174-08's truth "every entry point that can sign an invitee in".** Three do. `api/contestant/preregister` establishes a session and claims nothing; 174-08's own SUMMARY discloses it and the roadmap's todo covers it.
4. **174-06, `mailedLink.test.ts (22 tests)` as evidence.** A task-time run with no recorded output, of a file no gate runs.

The executors' own caveats held up: the red run's variable is inferred and its fix was not isolated (both true, and neither leaves the cause open); the refusing branches are untested on the served function; the hosted topology is unmeasured.

### Human Verification — accepted by the operator, 2026-10-07

The operator accepted all five items below ("Accept all five items"). What that does and does not mean for each: item 1 is accepted as a residual and has not been run; item 2 is accepted, with the two `CLAUDE.md` commits accounted for in the frontmatter; item 3 (native-speaker review) and item 4 (a hosted project) stay filed todos and have not been done; item 5 was run once after this report was written — 22 of 22, exit 0 — and its place in a gate row is undecided.

### 1. The served function on a deployment that fails a check

**Test:** Serve `account-access` against an auth service with public sign-up open, or with the callback entry removed from the redirect allowlist. Seed an email invitation and send `request-link` for it with a witness.
**Expected:** `{ accepted: true }`; witness `not-sent`; no mail; no auth user; no `link:` key in `private.invitation_throttle`; one log line naming the refusing check.
**Why human:** Present and wired, exercised only with injected answers. Needs a config change and a stack restart.

### 2. The judgment-tier prohibitions

**Test:** Read the Prohibitions table. Confirm in particular PROH-174-01 (were `c1d049136` and `78a9ff95b` operator-directed?), PROH-174-02, PROH-174-03, PROH-174-14 and PROH-174-27.
**Expected:** Each confirmed, or the broken one named.
**Why human:** Judgment-tier; five of them concern what was typed or deleted during execution.

### 3. The sign-in mail in six languages

**Test:** A native speaker reads the da, et, fi, fr, lb and sv texts in `mailTemplates.ts`.
**Expected:** Correct and natural.
**Why human:** Text quality.

### 4. A hosted project

**Test:** On the first hosted project, read `/auth/v1/settings`, check the allowlist entry, set `SITE_URL` and the SMTP secrets, request one link, read the function log.
**Expected:** `disable_signup: true`, `mailer_autoconfirm: false`, one mail, no refusal line; the docs' switch names corrected if they differ.
**Why human:** External service; nothing is deployed. On a hosted project INV-03 rests on these switches alone.

### 5. The ungated unit test

**Test:** `yarn vitest run --config tests/vitest.config.ts mailedLink`; decide whether `tests/tests/utils/*.test.ts` joins a gate row.
**Expected:** 22 passed.
**Why human:** No recorded run at the closing head; the verifier ran no test suite.

### Gaps Summary

No blocking gap. All six roadmap criteria hold: the model, its two ends and its endpoints exist in the tree, are applied in the local database exactly as the source states them, and are held by a 259-assertion pgTAP file and by three E2E projects in a closing run that is complete, green, unretried and made on a tree equal to HEAD. The control the whole model rests on, closed public sign-up, was observed live.

The status is `human_needed` for five reasons, none of which is a failed truth: one truth is present and wired but its behaviour on the served function was never exercised (the function's refusal on a misconfigured deployment); twenty-eight judgment-tier prohibitions need the operator's eye, five of which no file can settle; the mail texts need native speakers; a hosted project has never been observed; and one unit test that carries a must-have truth is in no gate.

Two things are shown less far than the criteria's wording might suggest, and both are scheduled: INV-05 is shown in the database and on reserved rows but never through the application, because the journey deliberately undoes the confirmation (Phase 177.1); and INV-04's "leading to password sign-in" is a working server operation with no screen in front of it (Phase 178).

The red bank-auth-journey run is not a cardinal failure: its cause is established by the function's own log line and the source, was in the harness driver, and was fixed there before every closing run was made again.

---

_Verified: 2026-10-07T14:40:00Z_
_Verifier: Claude (gsd-verifier)_

## Phase 180 note (2026-11-13)

The one behaviour-unverified truth above, "The served account-access function refuses a misconfigured deployment
(both deployment-check branches)", now has a type-checked `index.ts`: since phase 180, `yarn typecheck` runs
`deno check .` (Deno 2.9.6) from `apps/supabase/supabase/functions/` over every non-test module, among them
`account-access/index.ts`, `linkIssue.ts` and `deploymentChecks.ts`, and CI run `43405262494`
(`frontend-and-shared-module-validation`, `success`) shows it running there. The function was also bundled and
served standalone from the committed tree with `edge-runtime:v1.76.2`, answering `OPTIONS` with 200. There is still
no live run of the served function on a misconfigured deployment (open public sign-up, or a callback URL that is not
an admitted redirect): the item stays behaviour-unverified, and nothing is deployed (phase 180 decision D-27). This
note leaves the frontmatter unchanged.
