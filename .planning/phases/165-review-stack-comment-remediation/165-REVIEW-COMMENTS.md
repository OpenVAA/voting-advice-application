# Phase 165 — Raw review-comment inventory (PRs #876-#887)

Collected 2026-09-27T14:37Z via `gh api repos/OpenVAA/voting-advice-application/pulls/<n>/comments|reviews` and `issues/<n>/comments`. Bot noise (changeset-bot, Copilot review summaries, maintainer "Checked." review bodies) is listed at the end, not per row.

## PR #876 — 01/12 feat[db]: extend the shared @openvaa packages — app-shared settings, data model and generated Supabase types (`ship/v2.15-01-shared-packages`)

### C-4080507169 — Copilot — `packages/app-shared/src/data/getLocalized.ts:31`

- url: https://github.com/OpenVAA/voting-advice-application/pull/876#discussion_r4080507169
- commit_id: edde885083aa
- in_reply_to: -

The container check does not validate the values inside the JSONB object. A database value such as `{ en: 42 }` or `{ en: null }` reaches these branches and returns a non-string despite the `string | null` signature; `localizeRow` then can call `.split()` on that result for keywords (`apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts:216`). Validate selected/fallback values as strings and skip invalid entries so malformed JSON does not fail a page load.

### C-4080507215 — Copilot — `packages/app-shared/src/data/schemas/sendEmailResult.schema.ts:38`

- url: https://github.com/OpenVAA/voting-advice-application/pull/876#discussion_r4080507215
- commit_id: edde885083aa
- in_reply_to: -

Every branch of the Edge Function includes `success` (see `apps/supabase/supabase/functions/send-email/index.ts:197-202`, `:271-277`, and `:283-289`), but this field is optional and the test accepts `{ results: [] }`. That lets a malformed invoke response pass the boundary schema; require the branch discriminator instead of making it optional.

### C-4080507248 — Copilot — `packages/app-shared/src/settings/staticSettings.ts:17`

- url: https://github.com/OpenVAA/voting-advice-application/pull/876#discussion_r4080507248
- commit_id: edde885083aa
- in_reply_to: -

The checked-in Supabase config sets `api.max_rows = 1000` (`apps/supabase/supabase/config.toml:18`), not 50000. A page size of 50000 therefore violates the contract documented immediately above it; once the provider uses this value, every paged read will hit the server cap and the short-page guard will report truncation/warnings. Set the shared default to the actual cap (or make the value deployment-configured rather than claiming it must equal 50000).

### C-4080507280 — Copilot — `packages/app-shared/src/settings/staticSettings.ts:45`

- url: https://github.com/OpenVAA/voting-advice-application/pull/876#discussion_r4080507280
- commit_id: edde885083aa
- in_reply_to: -

This now emits a stylesheet URL that is not present under `apps/frontend/static`, while `apps/frontend/src/routes/+layout.svelte:225` always links `staticSettings.font.url` and the visual suite asserts that Inter loaded. The `/fonts/inter.css` request therefore 404s and the app falls back to the system font; restore a reachable URL or add the stylesheet and font assets.


## PR #877 — 02/12 feat[db]: the permissions schema, RLS policies, pgTAP suite and read-cost benchmarks (`ship/v2.15-02-supabase`)

### C-4080520022 — Copilot — `apps/supabase/supabase/config.toml:194`

- url: https://github.com/OpenVAA/voting-advice-application/pull/877#discussion_r4080520022
- commit_id: 5f2ffe900989
- in_reply_to: -

The allowlist paths add `/api`, but the actual callback is `apps/frontend/src/routes/candidate/auth/callback/+server.ts` and the client constructs `/candidate/auth/callback` (without `/api`). Supabase will reject the localhost redirect URI as not allowed, breaking the password-reset/invite callback flow. Match the real route, including its optional locale prefix.

### C-4080520062 — Copilot — `apps/supabase/supabase/functions/identity-callback/claimConfig.ts:39`

- url: https://github.com/OpenVAA/voting-advice-application/pull/877#discussion_r4080520062
- commit_id: 5f2ffe900989
- in_reply_to: -

Changing Signicat's identity key from `birthdate` to `sub` also changes the value used by `findUserByIdentityMatch` in `app_metadata.identity_match_value`. Existing Signicat users were created with their birthdate, so their next login will not match, and this flow will create a second auth user/candidate instead of reusing the existing account. Add a one-time rekey/migration or a carefully bounded compatibility lookup before switching the key.

### C-4080520102 — Copilot — `apps/supabase/supabase/functions/send-email/index.ts:16`

- url: https://github.com/OpenVAA/voting-advice-application/pull/877#discussion_r4080520102
- commit_id: 5f2ffe900989
- in_reply_to: -

The Edge Function contract validates and renders `tmpl.body`, while the existing frontend sender API supplies `{ subject, text, html }`. Current requests are rejected as missing `body` before any email is sent, and the supplied HTML is ignored. Align the request shape and the renderer with the actual caller contract.

### C-4080520123 — Copilot — `apps/supabase/supabase/functions/send-email/index.ts:16`

- url: https://github.com/OpenVAA/voting-advice-application/pull/877#discussion_r4080520123
- commit_id: 5f2ffe900989
- in_reply_to: -

`project_id` is now required and is passed to `callerMayOnProject`, but the existing frontend `SupabaseAdminWriter.sendEmail` request contains only templates, recipient IDs, `from`, and `dry_run`. Every current send therefore reaches this gate with an undefined project and is denied before SMTP. Thread the configured project ID through the client/request contract.

### C-4080520167 — Copilot — `apps/supabase/supabase/schema/107-feedback.sql:27`

- url: https://github.com/OpenVAA/voting-advice-application/pull/877#discussion_r4080520167
- commit_id: 5f2ffe900989
- in_reply_to: -

Making `project_id` nullable while leaving both INSERT policies as `WITH CHECK (true)` lets an API caller omit it and manufacture an orphan feedback row. The new global-orphan clauses then expose that row to global admins even though it was never associated with a project; previously `NOT NULL` rejected this input. Keep INSERT requiring `project_id IS NOT NULL` and allow NULL only through `ON DELETE SET NULL`.

### C-4080520206 — Copilot — `apps/supabase/supabase/schema/301-auth-functions.sql:55`

- url: https://github.com/OpenVAA/voting-advice-application/pull/877#discussion_r4080520206
- commit_id: 5f2ffe900989
- in_reply_to: -

The hook now writes `grants` instead of the retired `user_roles` claim, but the existing candidate login, admin login, and `supabaseDataWriter` still read `payload.user_roles`. They will see an empty role list for every valid session, reject candidate/admin logins, and lose the writer's role context. Update all claim consumers together or keep a compatibility claim until they migrate.

### C-4080520234 — Copilot — `apps/supabase/supabase/schema/301-auth-functions.sql:528`

- url: https://github.com/OpenVAA/voting-advice-application/pull/877#discussion_r4080520234
- commit_id: 5f2ffe900989
- in_reply_to: -

`g_target_type` is validated above but is not compared in this entity-scope equality. Every entity RLS policy passes only the UUID, so a grant for a candidate can authorize an organization/faction/alliance row that reuses that UUID; these tables have independent primary keys and bulk import can supply IDs. That makes the type/project boundary bypassable. Make entity reach type-aware (or enforce global entity-ID uniqueness) before using this as the central authorization predicate.

### C-4080520279 — Copilot — `apps/supabase/supabase/schema/503-entity-rpcs.sql:15`

- url: https://github.com/OpenVAA/voting-advice-application/pull/877#discussion_r4080520279
- commit_id: 5f2ffe900989
- in_reply_to: -

`get_nominations` now requires `p_project_id`, but the existing `SupabaseDataProvider` calls it with only the election/constituency filters. PostgREST named-argument resolution cannot match that call to this required-parameter signature, so nomination loading fails before the query runs. Pass the project ID from the provider.

### C-4080520322 — Copilot — `apps/supabase/supabase/schema/503-entity-rpcs.sql:58`

- url: https://github.com/OpenVAA/voting-advice-application/pull/877#discussion_r4080520322
- commit_id: 5f2ffe900989
- in_reply_to: -

The candidate table has no `name` column, but this RPC still selects `c.name`. Any result containing a candidate nomination will fail at execution with `column c.name does not exist`, so the new project-scoped nomination path cannot serve the normal candidate data. Use the candidate fields that remain in `102-entities.sql` or remove this reference and adjust the return mapping.

### C-4080520354 — Copilot — `apps/supabase/supabase/schema/503-entity-rpcs.sql:167`

- url: https://github.com/OpenVAA/voting-advice-application/pull/877#discussion_r4080520354
- commit_id: 5f2ffe900989
- in_reply_to: -

This RPC now requires `p_project_id`, but `supabaseDataWriter._getCandidateUserData` still calls it with only `p_entity_type`. The call no longer matches any PostgREST function signature, so candidate profile loading fails before the returned row can be read. Supply the active project id and update the associated tests/types with the signature change.

### C-4080520386 — Copilot — `apps/supabase/supabase/schema/504-admin-rpcs.sql:10`

- url: https://github.com/OpenVAA/voting-advice-application/pull/877#discussion_r4080520386
- commit_id: 5f2ffe900989
- in_reply_to: -

The RPC was renamed to `merge_question_custom_data`, but the existing `SupabaseAdminWriter` and `SupabaseDataWriter` still call `merge_custom_data` (and their tests assert that name). After a reset this is the only function created, so every question custom-data update fails with an RPC-not-found error. Update all callers/types/tests or retain a compatibility wrapper.

### C-4080520413 — Copilot — `apps/supabase/supabase/schema/101-elections.sql:21`

- url: https://github.com/OpenVAA/voting-advice-application/pull/877#discussion_r4080520413
- commit_id: 5f2ffe900989
- in_reply_to: -

This retypes `elections.election_type` to `nomination_shape`, but the shipped dev-seed generator and templates still insert `general`/`local` (for example `packages/dev-seed/src/generators/ElectionsGenerator.ts:57` and `packages/dev-seed/src/templates/default.ts:49`). The default seed path will now fail with `22P02` on its first election. Update every producer to one of the three enum values before applying this retype.

### C-4080520453 — Copilot — `apps/supabase/supabase/schema/501-bulk-operations.sql:107`

- url: https://github.com/OpenVAA/voting-advice-application/pull/877#discussion_r4080520453
- commit_id: 5f2ffe900989
- in_reply_to: -

The candidates relationship arm was removed here, but `CandidatesGenerator` still emits an `organization: { external_id: ... }` field. Without a relationship entry, `_bulk_upsert_record` treats that key as a real SQL column; because `candidates.organization_id` is gone, the default candidate import now fails with an unknown-column error. Remove or translate that generator field in the same change.

### C-4094521874 — kaljarv — `apps/supabase/supabase/schema/102-entities.sql:50`

- url: https://github.com/OpenVAA/voting-advice-application/pull/877#discussion_r4094521874
- commit_id: 5f2ffe900989
- in_reply_to: -

Use same column order as in org for all related tables.

### C-4094555940 — kaljarv — `apps/supabase/supabase/schema/101-elections.sql:13`

- url: https://github.com/OpenVAA/voting-advice-application/pull/877#discussion_r4094555940
- commit_id: 5f2ffe900989
- in_reply_to: -

Check whether we actually use this for anything meaningful that cannot be recovered from external id. If not, remove it from all tables and seed data with no historical traces.

### C-4094600054 — kaljarv — `apps/supabase/supabase/schema/100-tenancy.sql:1`

- url: https://github.com/OpenVAA/voting-advice-application/pull/877#discussion_r4094600054
- commit_id: 5f2ffe900989
- in_reply_to: -

Add concise comment on or other docs for all table columns that are not completely self-evident. Be especially careful to mention type of jsonb columns, like localised strings.

### C-4094736695 — kaljarv — `apps/supabase/supabase/schema/503-entity-rpcs.sql:105`

- url: https://github.com/OpenVAA/voting-advice-application/pull/877#discussion_r4094736695
- commit_id: 5f2ffe900989
- in_reply_to: -

Taking in the id wo entity type looks iffy. Examine whether we could require it as a parameter for all such functions.


## PR #878 — 03/12 feat: dev-seed templates, determinism guarantees and template validation (`ship/v2.15-03-dev-seed`)

### C-4080515679 — Copilot — `packages/dev-seed/src/assertKnownRowProps.ts:56`

- url: https://github.com/OpenVAA/voting-advice-application/pull/878#discussion_r4080515679
- commit_id: 390657cf17b1
- in_reply_to: -

`unknownPropertyMessage` describes the wrong failure mode: `bulkImport` only strips `_`/declared non-column fields, while an ordinary key such as `bogus` is forwarded into `_bulk_upsert_record`'s dynamic INSERT and fails as an unknown column rather than being silently dropped. The remediation is also incomplete because new DB columns and relationship refs belong in `TABLE_COLUMNS`/`RELATIONSHIP_REFS`, not only `LINK_SENTINELS` or `COLLECTION_NON_COLUMNS`; please make this message describe the unhandled key and point to the appropriate declaration.

### C-4080515718 — Copilot — `packages/dev-seed/src/templates/e2e/perm/perm-closed-project.ts:30`

- url: https://github.com/OpenVAA/voting-advice-application/pull/878#discussion_r4080515718
- commit_id: 390657cf17b1
- in_reply_to: -

`openForVoters: false` is not applied by the E2E setup path: `tests/tests/setup/shared/setupFromTemplate.ts:208` still calls `writer.write(rows, prefix)` without the third options argument, while `Writer.write` updates `projects.open_for_voters` only when `options.openForVoters` is defined. As a result this registered template seeds an open project and cannot exercise the closed-project state; pass the template value from the setup caller while leaving teardown's default `runTeardown` call unchanged so concurrent E2E chains are not reopened.

### C-4080515735 — Copilot — `packages/dev-seed/src/cli/summary.ts:6`

- url: https://github.com/OpenVAA/voting-advice-application/pull/878#discussion_r4080515735
- commit_id: 390657cf17b1
- in_reply_to: -

This example no longer documents `formatSummary`'s actual output: the implementation emits the template, seed/elapsed time, and portrait count on separate lines, while this flattened line presents them as one line. Keep the example's line breaks or replace it with an accurate description.

### C-4080515761 — Copilot — `packages/dev-seed/src/generators/FeedbackGenerator.ts:14`

- url: https://github.com/OpenVAA/voting-advice-application/pull/878#discussion_r4080515761
- commit_id: 390657cf17b1
- in_reply_to: -

The reflow changed this sentence to “That limitation stands for as long as feedback seeding becomes useful,” which is grammatically incorrect and changes the original conditional meaning. Use “That limitation remains until feedback seeding becomes useful.”

### C-4080515791 — Copilot — `packages/dev-seed/tests/generators/QuestionCategoriesGenerator.test.ts:4`

- url: https://github.com/OpenVAA/voting-advice-application/pull/878#discussion_r4080515791
- commit_id: 390657cf17b1
- in_reply_to: -

This reflow removed the separator after “spot-check”, so the test header now reads “spot-check The `_elections`…” as one sentence. Restore the sentence break; the current comment is grammatically misleading about where the next clause begins.


## PR #879 — 04/12 test: the Playwright end-to-end suite — specs, fixtures, setup and runner utilities (`ship/v2.15-04-e2e-tests`)

### C-4080508297 — Copilot — `tests/tests/fixtures/shared/emailBucket.fixture.ts:198`

- url: https://github.com/OpenVAA/voting-advice-application/pull/879#discussion_r4080508297
- commit_id: 81e54584afe9
- in_reply_to: -

The default callback URL now targets `/en/api/candidate/auth/callback`, but the only Supabase callback route is `apps/frontend/src/routes/candidate/auth/callback/+server.ts` (there is no `/api/candidate/auth/callback`). Both candidate email journeys call this default and will navigate to a 404 instead of running `verifyOtp`; restore the candidate callback path.

### C-4080508343 — Copilot — `tests/tests/setup/admin/admin-auth.setup.ts:48`

- url: https://github.com/OpenVAA/voting-advice-application/pull/879#discussion_r4080508343
- commit_id: 81e54584afe9
- in_reply_to: -

The new admin identity is minted with a `public.grants` row, which the access-token hook exposes as the `grants` claim, but the admin login action and `getBasicUserData` still read the retired `user_roles` claim. Consequently this form submission returns 403 and the setup never writes `admin.json` (and updating only the setup would still make the protected layout reject the session). Update the product auth readers to the current grants-based check, or otherwise make the minted identity and all consumers use one claim contract before enabling this setup.

### C-4080508380 — Copilot — `tests/tests/setup/perm/perm-closed-project.teardown.ts:21`

- url: https://github.com/OpenVAA/voting-advice-application/pull/879#discussion_r4080508380
- commit_id: 81e54584afe9
- in_reply_to: -

If either `unregisterCandidate` or `runTeardownAsserted` throws, execution never reaches `ensureProject()`, leaving the shared E2E project closed after this terminal node fails. Put the delete steps in a `try` and reopen in `finally` so a teardown assertion failure cannot poison the next run's environment.

### C-4080508426 — Copilot — `tests/tests/specs/admin/admin-access.spec.ts:156`

- url: https://github.com/OpenVAA/voting-advice-application/pull/879#discussion_r4080508426
- commit_id: 81e54584afe9
- in_reply_to: -

This positive control cannot succeed against the current app: the admin server loaders serialize the session/user data, but they never serialize the browser cookie name. `page.content()` therefore has no reason to contain the `sb-*` cookie name, so `sentinelPresent` is false even for a valid authenticated session and the test fails. Assert a value that is actually in the serialized authenticated payload (for example `TEST_ADMIN_EMAIL`) instead of the cookie name.

### C-4080508462 — Copilot — `tests/tests/utils/axeScan.ts:22`

- url: https://github.com/OpenVAA/voting-advice-application/pull/879#discussion_r4080508462
- commit_id: 81e54584afe9
- in_reply_to: -

This type-only import also references the nonexistent `apps/frontend/src/lib/routes/route` module. The a11y project imports this utility, so collecting or running the a11y specs fails with a module-not-found error; use the existing `apps/frontend/src/lib/utils/route/route` module instead.

### C-4080508490 — Copilot — `tests/tests/utils/buildRoute.ts:3`

- url: https://github.com/OpenVAA/voting-advice-application/pull/879#discussion_r4080508490
- commit_id: 81e54584afe9
- in_reply_to: -

These imports point at `apps/frontend/src/lib/routes/route`, but this checkout has the route module at `apps/frontend/src/lib/utils/route/route.ts` and no `lib/routes` path. Any setup/spec importing `buildRoute` will fail module resolution before the E2E suite can start; keep both imports on the existing module path.

### C-4080508533 — Copilot — `tests/tests/utils/supabaseAdminClient.ts:53`

- url: https://github.com/OpenVAA/voting-advice-application/pull/879#discussion_r4080508533
- commit_id: 81e54584afe9
- in_reply_to: -

`apps/frontend/src/lib/auth/roles` does not exist in this checkout, so importing `supabaseAdminClient.ts` fails module resolution before the admin setup or any dependent E2E project can run. Define the grant shape from an existing shared contract (or keep the small `{ scope: 'project'; role: 'admin' }` type local) instead of importing this nonexistent module.


## PR #880 — 05/12 refactor: the frontend library layer — contexts, components and API adapters (`ship/v2.15-05-frontend-lib`)

### C-4080514940 — Copilot — `apps/frontend/src/lib/api/dataWriter.ts:13`

- url: https://github.com/OpenVAA/voting-advice-application/pull/880#discussion_r4080514940
- commit_id: 41bee400226a
- in_reply_to: -

This factory removes the old exported `dataWriter`, but current route modules still import `dataWriter as dataWriterPromise`, await it, and call `.init(...)` (for example `routes/api/auth/login/+server.ts:2,20-21` and the protected admin/candidate layouts). Those imports now fail because this module exports only `createDataWriter`. Convert every remaining route caller to the factory/source contract before removing the singleton export.

### C-4080514990 — Copilot — `apps/frontend/src/lib/candidate/components/passwordSetter/PasswordSetter.type.ts:25`

- url: https://github.com/OpenVAA/voting-advice-application/pull/880#discussion_r4080514990
- commit_id: 41bee400226a
- in_reply_to: -

Replacing the bindable `valid` and `errorMessage` props with `onValidityChange` is not wired to the three production callers: the register, password-reset, and settings pages still use `bind:valid` and `bind:errorMessage`. Svelte type checking will reject those bindings and the parents will no longer receive the derived verdict. Migrate all callers before removing the props.

### C-4080515025 — Copilot — `apps/frontend/src/lib/contexts/auth/authContext.type.ts:40`

- url: https://github.com/OpenVAA/voting-advice-application/pull/880#discussion_r4080515025
- commit_id: 41bee400226a
- in_reply_to: -

The public `setPassword` signature now accepts only `{ password }`, but the settings route still calls `setPassword({ currentPassword, password })` at line 52. This is an excess-property type error, and the page still collects a current password that the new wrapper deliberately ignores. Update that caller and remove the obsolete input, or keep a compatible contract if the field is still required.

### C-4080515081 — Copilot — `apps/frontend/src/lib/server/admin/requireVerifiedAdmin.ts:25`

- url: https://github.com/OpenVAA/voting-advice-application/pull/880#discussion_r4080515081
- commit_id: 41bee400226a
- in_reply_to: -

This endpoint wrapper is not used by the job endpoints: `routes/api/admin/jobs/active/+server.ts` and `start/+server.ts` still perform their own `getUserData(...).role === 'admin'` check, and the other job endpoints follow the same pattern. Consequently the new `safeGetSession` verification and deployment-project permission check in `requireAdminIdentity` never protect those endpoints. Import this wrapper at all six endpoint sites instead of leaving the old checks in place.

### C-4080515115 — Copilot — `apps/frontend/src/lib/api/adapters/supabase/utils/convertFilterValue.ts:26`

- url: https://github.com/OpenVAA/voting-advice-application/pull/880#discussion_r4080515115
- commit_id: 41bee400226a
- in_reply_to: -

Throwing for `[]` is not safe with the current caller. `parseParams` turns `?electionId=` into an empty array, and `(voters)/(located)/+layout.ts` treats that array as truthy, skips the implication/redirect branch, and passes it to `getQuestionData`; `convertFilterValue` then throws instead of redirecting. Normalize empty arrays at the route boundary or make this helper use the no-filter sentinel for that input.

### C-4080515146 — Copilot — `apps/frontend/src/lib/api/base/getDataOptions.type.ts:40`

- url: https://github.com/OpenVAA/voting-advice-application/pull/880#discussion_r4080515146
- commit_id: 41bee400226a
- in_reply_to: -

Adding `electionRound` to the shared nomination options makes it look supported by every `DataProvider`, but the local server provider still destructures only `constituencyId`, `electionId`, and `locale` and silently returns nominations from all rounds. Implement the round filter in the local adapter (or explicitly reject/warn it) so local and Supabase adapters do not return different datasets.

### C-4080515180 — Copilot — `apps/frontend/src/lib/api/base/getDataOptions.type.ts:56`

- url: https://github.com/OpenVAA/voting-advice-application/pull/880#discussion_r4080515180
- commit_id: 41bee400226a
- in_reply_to: -

The expanded question options advertise `constituencyId` and `electionRound`, but `localServerDataProvider.getQuestionData()` still reads only `electionId` and applies no filtering for these new fields. In local-adapter deployments a scoped question load will therefore include questions outside the requested constituency/round; implement the same filtering or reject the unsupported options.

### C-4105280581 — kaljarv — `apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts:60`

- url: https://github.com/OpenVAA/voting-advice-application/pull/880#discussion_r4105280581
- commit_id: 41bee400226a
- in_reply_to: -

Move this and possibly the consts into supabase/utils or another file(s) in this folder to keep this file as focused on the DP implementation as possible.

### C-4105374348 — kaljarv — `apps/frontend/src/lib/api/utils/auth/providers/idura.ts:1`

- url: https://github.com/OpenVAA/voting-advice-application/pull/880#discussion_r4105374348
- commit_id: 41bee400226a
- in_reply_to: -

Rename both idura and signicat provider keywords in the configs to idura-ftn and signicat-ftn, and check that all configs that are specific to the Finnish case are marked as such, e.g., IDURA_AUTH_CONFIG => IDURA_FTN_AUTH_CONFIG. The providers themselves can stay generic wrt to the specifc auth method.

### C-4105438045 — kaljarv — `apps/frontend/src/lib/api/dataProvider.ts:1`

- url: https://github.com/OpenVAA/voting-advice-application/pull/880#discussion_r4105438045
- commit_id: 41bee400226a
- in_reply_to: -

The data provider, writer and feedbackWriter entrypoints must check for the adapter in static settings and use the local one if it's chosen. Supabase modules should be lazy-loaded depending on the adapter chosen.

However, let's do this on a follow up phase after the initial ship. In it we must also:
- consider moving adapter registration to a build time module or env
- have each adapter register its capabilities itself
- have them register hooks to prevent adapter-specific code like the one below in route loaders

```
import { SUPABASE_COOKIE_PREFIX } from '$lib/api/dataProvider';
```

### C-4106561819 — kaljarv — `apps/frontend/src/lib/candidate/components/passwordValidator/PasswordValidator.svelte:105`

- url: https://github.com/OpenVAA/voting-advice-application/pull/880#discussion_r4106561819
- commit_id: 41bee400226a
- in_reply_to: -

If password validation is now used only in the frontend, move it from app-shared to lib/utils/password-validation/

### C-4106608766 — kaljarv — `apps/frontend/src/lib/components/input/parts/ImagePart.svelte:104`

- url: https://github.com/OpenVAA/voting-advice-application/pull/880#discussion_r4106608766
- commit_id: 41bee400226a
- in_reply_to: -

Inline these classes

### C-4106633861 — kaljarv — `apps/frontend/src/lib/auth/roles.ts:1`

- url: https://github.com/OpenVAA/voting-advice-application/pull/880#discussion_r4106633861
- commit_id: 41bee400226a
- in_reply_to: -

We'd like to keep the frontend agnostic to the adapter chosen. Audit the whole repo for imports of supabase-types and define the frontend types in place and ensure matching with supabase types in a test colocated with the supabase adapter.

### C-4106666404 — kaljarv — `apps/frontend/src/lib/components/questions/QuestionChoices.svelte:97`

- url: https://github.com/OpenVAA/voting-advice-application/pull/880#discussion_r4106666404
- commit_id: 41bee400226a
- in_reply_to: -

This kind of historical narrative should NEVER be included in comments.

### C-4106671920 — kaljarv — `apps/frontend/src/lib/components/questions/QuestionChoices.svelte:101`

- url: https://github.com/OpenVAA/voting-advice-application/pull/880#discussion_r4106671920
- commit_id: 41bee400226a
- in_reply_to: -

No need to link to the line above. Use cn instead of interpolation to combine classes.

### C-4106679567 — kaljarv — `apps/frontend/src/lib/components/questions/QuestionChoices.svelte:99`

- url: https://github.com/OpenVAA/voting-advice-application/pull/880#discussion_r4106679567
- commit_id: 41bee400226a
- in_reply_to: -

Rename to UNPICKED_RADIO and UNPICKED_CHECKBOX.

### C-4106737701 — kaljarv — `apps/frontend/src/lib/contexts/utils/prepareDataWriter.ts:18`

- url: https://github.com/OpenVAA/voting-advice-application/pull/880#discussion_r4106737701
- commit_id: 41bee400226a
- in_reply_to: -

Check whether there's any use for caching the data writer here or in createDataWriter

### C-4106783651 — kaljarv — `apps/frontend/src/lib/contexts/voter/voterContext.svelte.ts:545`

- url: https://github.com/OpenVAA/voting-advice-application/pull/880#discussion_r4106783651
- commit_id: 41bee400226a
- in_reply_to: -

Move to contexts/utils and remove historical narrative.

### C-4106826598 — kaljarv — `apps/frontend/src/lib/layouts/main/Header.svelte:100`

- url: https://github.com/OpenVAA/voting-advice-application/pull/880#discussion_r4106826598
- commit_id: 41bee400226a
- in_reply_to: -

Inline as tailwind classes as much as possible. Do this for all style blocks in components.

### C-4106923157 — kaljarv — `apps/frontend/src/lib/utils/components.ts:22`

- url: https://github.com/OpenVAA/voting-advice-application/pull/880#discussion_r4106923157
- commit_id: 41bee400226a
- in_reply_to: -

Check whether we could get rid of this duplication by using different theme variables in app.css while still maintaining the p-xs semantics.

### C-4106942130 — kaljarv — `apps/frontend/src/lib/utils/focusNavigationTarget.ts:61`

- url: https://github.com/OpenVAA/voting-advice-application/pull/880#discussion_r4106942130
- commit_id: 41bee400226a
- in_reply_to: -

Is it possible to cancel auto focus by listening to any pointer event without distracting other interactions? If not, lower the timeout to 5 000 ms.

### C-4106960010 — kaljarv — `apps/frontend/src/lib/utils/logLevel.ts:1`

- url: https://github.com/OpenVAA/voting-advice-application/pull/880#discussion_r4106960010
- commit_id: 41bee400226a
- in_reply_to: -

This rather simple file has way too much prose. Just state the point and that's it.


## PR #881 — 06/12 refactor: the frontend routes — the voter and candidate app surfaces (`ship/v2.15-06-frontend-routes`)

### C-4080520474 — Copilot — `apps/frontend/src/routes/(voters)/(located)/layout.load.test.ts:21`

- url: https://github.com/OpenVAA/voting-advice-application/pull/881#discussion_r4080520474
- commit_id: fa320cc33df0
- in_reply_to: -

The route code now imports `createDataProvider` and `createSupabaseUniversalClient`, but this mock exports only the removed `dataProvider` singleton. Vitest will fail while linking `./+layout` with a missing-export error before any redirect assertion runs; export mocks for both factory functions (the redirect cases do not need them to be called).

### C-4080520522 — Copilot — `apps/frontend/src/routes/candidate/login/+page.svelte:29`

- url: https://github.com/OpenVAA/voting-advice-application/pull/881#discussion_r4080520522
- commit_id: fa320cc33df0
- in_reply_to: -

This import cannot resolve: `$layouts` is not declared in `svelte.config.js`'s `kit.alias` or in `vitest.config.ts`'s aliases (the only relevant entries are `$lib`, `$types`, `$voter`, and `$candidate`). As a result every moved route import, including this one, fails both the Svelte/Vite build and unit-test module resolution. Add the alias in both resolver configurations before relying on `$layouts/main`.

### C-4080520561 — Copilot — `apps/frontend/src/routes/candidate/register/password/+page.svelte:19`

- url: https://github.com/OpenVAA/voting-advice-application/pull/881#discussion_r4080520561
- commit_id: fa320cc33df0
- in_reply_to: -

`$layouts/main` is not registered in `apps/frontend/svelte.config.js` or `apps/frontend/vitest.config.ts` (the configured aliases only cover `$types`, `$voter`, `$candidate`, and `$lib`). Since the routes in this change now use this specifier, the Svelte/Vite resolver cannot resolve these imports and the app/unit suite will fail; add the alias to both resolver configs or use `$lib/layouts/main` consistently.


## PR #882 — 07/12 chore: the frontend app shell — entry points, route params, static assets and build config (`ship/v2.15-07-frontend-shell`)

### C-4080502788 — Copilot — `apps/frontend/.env.example:4`

- url: https://github.com/OpenVAA/voting-advice-application/pull/882#discussion_r4080502788
- commit_id: 2a2cce8ed46a
- in_reply_to: -

The committed root `.env.example` does not define `PUBLIC_PROJECT_ID`, even though this file now directs every setup to use it as the canonical template and the adapter throws when that variable is absent. A fresh checkout following these instructions therefore reaches the new bridge with no project id and fails on the first adapter construction. Add the required local default to the root template (or provide it through the documented setup path).

### C-4080502829 — Copilot — `apps/frontend/src/hooks.server.ts:115`

- url: https://github.com/OpenVAA/voting-advice-application/pull/882#discussion_r4080502829
- commit_id: 2a2cce8ed46a
- in_reply_to: -

This adds a second `safeGetSession()` call on every authenticated admin request: `admin/+layout.server.ts` still calls it for every admin route, including login and protected pages. Because `safeGetSession` performs both `auth.getSession()` and the verifying `auth.getUser()` request, the new gate causes two verification round trips per request. Cache the hook result on the request locals or arrange for the downstream loader to reuse it.

### C-4080502860 — Copilot — `apps/frontend/vite.projectIdEnv.ts:28`

- url: https://github.com/OpenVAA/voting-advice-application/pull/882#discussion_r4080502860
- commit_id: 2a2cce8ed46a
- in_reply_to: -

`loadEnv` overlays matching `process.env` entries after reading the env files. Because this call passes the real process environment, an explicitly empty `PUBLIC_PROJECT_ID` or `E2E_PROJECT_ID` shadows the non-empty value in the root `.env`; the loop then treats that empty value as missing but has no file value left to copy. Load the file values without the process-env overlay here and keep applying `target` precedence in the loop, so the documented empty-target behavior and shell override behavior both hold.


## PR #883 — 08/12 chore[i18n]: corrections to the Paraglide message catalogues (`ship/v2.15-08-i18n-messages`)


## PR #884 — 09/12 docs: the documentation site (`ship/v2.15-09-docs`)

### C-4080518476 — Copilot — `apps/docs/src/routes/(content)/developers-guide/frontend/routing/+page.md:20`

- url: https://github.com/OpenVAA/voting-advice-application/pull/884#discussion_r4080518476
- commit_id: 7b57493038a4
- in_reply_to: -

These examples still describe the pre-Svelte 5 store API: `getRoute.ts` no longer exists and `AppContext.getRoute` is a `{ current: RouteBuilder }` handle, so `$getRoute(...)` cannot be used. Update this section to link to `getRoute.svelte.ts`/`AppContext` and call `getRoute.current(...)`; otherwise the page sends readers to a 404 and non-working code.


## PR #885 — 10/12 chore: the experimental packages — llm, argument-condensation and question-info (`ship/v2.15-10-experimental-pkgs`)

### C-4080487670 — Copilot — `packages/argument-condensation/tests/condensation/condenseQuestions.test.ts:152`

- url: https://github.com/OpenVAA/voting-advice-application/pull/885#discussion_r4080487670
- commit_id: 83c941dff26c
- in_reply_to: -

Flattening here masks a public-shape bug instead of testing it. `Condenser.run()` returns `currentData` from the MAP/ITERATE_MAP-only path as `Argument[][]`, while `CondensationRunResult.data.arguments` is declared as `Argument[]` and the frontend maps each item as `{ id, text }`; this path can pass this test and still fail production. Fix the pipeline/type contract, then assert the flat result here rather than calling `flat()`.

### C-4080487730 — Copilot — `packages/question-info/src/prompts/en/generateBoth.yaml:15`

- url: https://github.com/OpenVAA/voting-advice-application/pull/885#discussion_r4080487730
- commit_id: 83c941dff26c
- in_reply_to: -

`generateBoth` now requires and renders `questionType`/`choices`, but the mixed-operation test that selects this template never inspects its composed request; it only checks canned responses and transformed metrics. A missing or renamed placeholder here would remain green even though the other two templates are covered. Capture this request and assert the type and choice labels for the `generateBoth` path.

### C-4080487775 — Copilot — `packages/argument-condensation/src/api.ts:39`

- url: https://github.com/OpenVAA/voting-advice-application/pull/885#discussion_r4080487775
- commit_id: 83c941dff26c
- in_reply_to: -

The public `handleQuestion` example is no longer a usable code example: the inline comments swallow the code that follows on the same lines, and the setup/closing braces are compressed into prose. Restore the multiline JSDoc example so consumers can copy it without reconstructing the syntax.

### C-4080487819 — Copilot — `packages/argument-condensation/src/core/condensation/condenser.ts:61`

- url: https://github.com/OpenVAA/voting-advice-application/pull/885#discussion_r4080487819
- commit_id: 83c941dff26c
- in_reply_to: -

This exported `Condenser` example has the same documentation regression: the inline `// Your DataRoot instance` comments out the closing constructor syntax, leaving a non-copyable example. Keep the example multiline instead of collapsing it.

### C-4080487851 — Copilot — `packages/argument-condensation/src/core/types/condensation/condensationInput.ts:11`

- url: https://github.com/OpenVAA/voting-advice-application/pull/885#discussion_r4080487851
- commit_id: 83c941dff26c
- in_reply_to: -

This reflow changes the JSDoc example rather than only its formatting: `// number or string` now comments out the required `text` property and the closing brace, so the public `Comment` example is not valid copyable code. Preserve the line breaks around inline comments when formatting API examples.

This issue also appears on line 26 of the same file.

### C-4080487884 — Copilot — `packages/argument-condensation/src/core/types/condensation/condensationResult.ts:15`

- url: https://github.com/OpenVAA/voting-advice-application/pull/885#discussion_r4080487884
- commit_id: 83c941dff26c
- in_reply_to: -

The `CondensationRunResult` example is now invalid documentation: the inline `// Optional` comment consumes the remainder of the object literal, including fields that are shown as if they were still part of the example. Keep this example multiline so its structure matches the declared result.

### C-4080487924 — Copilot — `packages/llm/src/prompts/promptRegistry.ts:29`

- url: https://github.com/OpenVAA/voting-advice-application/pull/885#discussion_r4080487924
- commit_id: 83c941dff26c
- in_reply_to: -

The public `registerPrompts` and `loadPrompt` examples are now placed after inline `//` text on the same JSDoc lines, so most of each snippet is treated as a comment and is no longer copyable code. Preserve the original multiline examples.


## PR #886 — 11/12 chore: root tooling — CI workflows, lint and format config, scripts and the audit baseline (`ship/v2.15-11-root-config`)

### C-4080504623 — Copilot — `.env.example:34`

- url: https://github.com/OpenVAA/voting-advice-application/pull/886#discussion_r4080504623
- commit_id: 95eecbc26f41
- in_reply_to: -

The E2E jobs copy the root `.env.example` (main.yaml:623 and 704), start Supabase, and then start the frontend without replacing this value from `supabase status`. `<your-supabase-anon-key>` is therefore sent as the public API/JWT key, so frontend Supabase requests cannot authenticate against the local stack. Keep a valid local example value or make those jobs export the generated anon key before starting the app.

### C-4080504664 — Copilot — `.env.example:65`

- url: https://github.com/OpenVAA/voting-advice-application/pull/886#discussion_r4080504664
- commit_id: 95eecbc26f41
- in_reply_to: -

The same CI copy at main.yaml:623 loads this placeholder into `process.env` before each Playwright setup imports `@openvaa/dev-seed`; `setupFromTemplate` constructs its Writer with `SUPABASE_SERVICE_ROLE_KEY`, so seeding now sends `<your-supabase-service-role-key>` to PostgREST and the default E2E jobs fail before tests run. Supply the generated local service-role key in CI (as the integration job already does) or stop copying this placeholder as a runtime env file.

### C-4080504697 — Copilot — `scripts/assert-edge-function-env.mjs:75`

- url: https://github.com/OpenVAA/voting-advice-application/pull/886#discussion_r4080504697
- commit_id: 95eecbc26f41
- in_reply_to: -

`commentMapOf` delegates to `commentSpans`, whose family contract is `{ c: true }` (as used by the sibling guards). This `{ slash, blockC, template }` object is ignored by the shared classifier, so `blankComments()` leaves `//` and `/* */` text intact and can derive required variables from commented examples instead of code. Use the shared family shape here.

### C-4080504728 — Copilot — `packages/dev-tools/src/keygen.ts:9`

- url: https://github.com/OpenVAA/voting-advice-application/pull/886#discussion_r4080504728
- commit_id: 95eecbc26f41
- in_reply_to: -

The continuation backslashes are now followed by option text on the same line. In a shell, `\ ` escapes a space rather than continuing the command, so copying this usage block passes malformed arguments; restore one option per continued line.


## PR #887 — 12/12 docs[planning]: the v2.15 planning record and agent configuration (`ship/v2.15-12-planning`)

### C-4080515788 — Copilot — `.planning/phases/163-ci-gates-sql-lint-format-secrets-vulnerability-scanning/163-VALIDATION.md:26`

- url: https://github.com/OpenVAA/voting-advice-application/pull/887#discussion_r4080515788
- commit_id: 8efd206062aa
- in_reply_to: -

This newly added validation contract is still the untouched template (`{pytest...}`, `{quick command}`, and `{N} seconds`), while `163-VERIFICATION.md` reports 4/4 truths verified and `163-09-SUMMARY.md` declares the evidence closed. It is not an actionable validation record in this state; fill it from the phase's actual commands/evidence or explicitly record why validation was not performed.

### C-4080515841 — Copilot — `.planning/todos/pending/2026-08-27-147-empty-answer-candidate-states-unscanned.md:33`

- url: https://github.com/OpenVAA/voting-advice-application/pull/887#discussion_r4080515841
- commit_id: 8efd206062aa
- in_reply_to: -

The empty-answer premise is contradicted by the canonical fixture: `test-e2e-base-ca-aa-unregistered` already has `answersByExternalId` deliberately absent (`base.ts:1074-1085`). The `grep` for an explicit `{}` does not prove every candidate has answers, so adding another answerless candidate is not justified by this observation.

### C-4080515881 — Copilot — `.planning/todos/pending/2026-08-27-147-scan-determinism-is-a-bound-not-an-absence.md:28`

- url: https://github.com/OpenVAA/voting-advice-application/pull/887#discussion_r4080515881
- commit_id: 8efd206062aa
- in_reply_to: -

The probability is inverted: four green runs leave a `0.95^4 ≈ 0.81` chance of a 1-in-20 defect hiding, not a one-in-seven chance. Since this todo is specifically documenting the statistical bound, the current numbers undermine its conclusion.

### C-4080515920 — Copilot — `.planning/todos/pending/2026-08-28-ci-frontend-does-not-read-root-env.md:21`

- url: https://github.com/OpenVAA/voting-advice-application/pull/887#discussion_r4080515920
- commit_id: 8efd206062aa
- in_reply_to: -

This pending todo says `kit.env.dir` still defaults to the frontend cwd, but the current `apps/frontend/svelte.config.js:15-24` explicitly sets it to the repository root. The root-env premise is already fixed, so leaving this item pending would direct future work to reapply a resolved change.

### C-4080515954 — Copilot — `.planning/todos/pending/2026-09-03-ci-e2e-ssr-500.md:44`

- url: https://github.com/OpenVAA/voting-advice-application/pull/887#discussion_r4080515954
- commit_id: 8efd206062aa
- in_reply_to: -

This says `main.yaml` only triggers on `main`, but the current workflow also has the `ci-evidence/**` push channel (`.github/workflows/main.yaml:3-35`). The historical E2E failures remain useful, but this explanation is now false and can make a later investigator miss the channel that produced the evidence runs.


## Review bodies and issue comments (non-actionable)

- PR #876 review by copilot-pull-request-reviewer[bot] (COMMENTED): <!-- ccr-overview-v2 -->  ## Copilot review overview  ### 🟡 Changes recommended  Five unresolved findings remain across localization validation, email-result va
- PR #876 review by kaljarv (COMMENTED): Checked.
- PR #876 issue comment by changeset-bot[bot]: ### ⚠️ No Changeset found  Latest commit: edde885083aab4abe98f3d3c62077c63ed4ce346  Merging this PR will not cause a version bump for any packages. If these cha
- PR #877 review by copilot-pull-request-reviewer[bot] (COMMENTED): <!-- ccr-overview-v2 -->  ## Copilot review overview  ### 🟡 Changes recommended  Critical integration, authorization, migration, and RPC compatibility findings 
- PR #877 review by kaljarv (COMMENTED): Checked.
- PR #877 issue comment by changeset-bot[bot]: ### ⚠️ No Changeset found  Latest commit: 5f2ffe900989ffa43fef10e002a3357fd491e07e  Merging this PR will not cause a version bump for any packages. If these cha
- PR #878 review by copilot-pull-request-reviewer[bot] (COMMENTED): <!-- ccr-overview-v2 -->  ## Copilot review overview  ### 🟡 Changes recommended  Two moderate issues remain, along with five documentation and test-comment nits
- PR #878 review by kaljarv (COMMENTED): Review skipped as non-critical.
- PR #878 issue comment by changeset-bot[bot]: ### ⚠️ No Changeset found  Latest commit: 390657cf17b1c31912621365536a7042e7160687  Merging this PR will not cause a version bump for any packages. If these cha
- PR #879 review by copilot-pull-request-reviewer[bot] (COMMENTED): <!-- ccr-overview-v2 -->  ## Copilot review overview  ### 🟡 Changes recommended  Critical findings remain in authentication, routing, module resolution, admin v
- PR #879 review by kaljarv (COMMENTED): Checked.
- PR #879 issue comment by changeset-bot[bot]: ### ⚠️ No Changeset found  Latest commit: 81e54584afe952110c9787626925fdd65cd3ad1b  Merging this PR will not cause a version bump for any packages. If these cha
- PR #880 review by copilot-pull-request-reviewer[bot] (COMMENTED): <!-- ccr-overview-v2 -->  ## Copilot review overview  ### 🟡 Changes recommended  One or more issues must be addressed before approval.  *Get a fresh assessment 
- PR #880 review by kaljarv (COMMENTED): Checked.
- PR #880 issue comment by changeset-bot[bot]: ### ⚠️ No Changeset found  Latest commit: 41bee400226af746da52bf890560acc0b758ef13  Merging this PR will not cause a version bump for any packages. If these cha
- PR #881 review by copilot-pull-request-reviewer[bot] (COMMENTED): <!-- ccr-overview-v2 -->  ## Copilot review overview  ### 🟡 Changes recommended  One or more issues must be addressed before approval.  *Get a fresh assessment 
- PR #881 review by kaljarv (COMMENTED): Checked.
- PR #881 issue comment by changeset-bot[bot]: ### ⚠️ No Changeset found  Latest commit: fa320cc33df029578b3e57c69672df95681c7ccb  Merging this PR will not cause a version bump for any packages. If these cha
- PR #882 review by copilot-pull-request-reviewer[bot] (COMMENTED): <!-- ccr-overview-v2 -->  ## Copilot review overview  ### 🟡 Changes recommended  Unresolved environment setup, logging, authentication, test-isolation, and lint
- PR #882 review by kaljarv (COMMENTED): Checked.
- PR #882 issue comment by changeset-bot[bot]: ### ⚠️ No Changeset found  Latest commit: 2a2cce8ed46ab3df3ca6625cf0d6066ab8d7a252  Merging this PR will not cause a version bump for any packages. If these cha
- PR #883 review by copilot-pull-request-reviewer[bot] (COMMENTED): <!-- ccr-overview-v2 -->  ## Copilot review overview  ### 🟢 Approval recommended  No blocking issues were identified in the reviewed catalogue updates.  **Revie
- PR #883 review by kaljarv (COMMENTED): Checked.
- PR #883 issue comment by changeset-bot[bot]: ### ⚠️ No Changeset found  Latest commit: 23dfc71af5af70659cab174af1ca3b7981784a6b  Merging this PR will not cause a version bump for any packages. If these cha
- PR #884 review by copilot-pull-request-reviewer[bot] (COMMENTED): <!-- ccr-overview-v2 -->  ## Copilot review overview  ### 🟡 Changes recommended  One or more issues must be addressed before approval.  *Get a fresh assessment 
- PR #884 review by kaljarv (COMMENTED): Check passed.
- PR #884 issue comment by changeset-bot[bot]: ### ⚠️ No Changeset found  Latest commit: 7b57493038a4dbe4bfbe8a259699ab80f3beb92f  Merging this PR will not cause a version bump for any packages. If these cha
- PR #885 review by copilot-pull-request-reviewer[bot] (COMMENTED): <!-- ccr-overview-v2 -->  ## Copilot review overview  ### 🟡 Changes recommended  An unresolved critical result-shape contract issue and a moderate `generateBoth
- PR #885 review by kaljarv (COMMENTED): Check passed.
- PR #885 issue comment by changeset-bot[bot]: ### ⚠️ No Changeset found  Latest commit: 83c941dff26c265290dfd63cd8a76c278d78e6ee  Merging this PR will not cause a version bump for any packages. If these cha
- PR #886 review by copilot-pull-request-reviewer[bot] (COMMENTED): <!-- ccr-overview-v2 -->  ## Copilot review overview  ### 🟡 Changes recommended  Critical CI environment-template failures and unresolved moderate tooling issue
- PR #886 review by kaljarv (COMMENTED): Check passed.
- PR #886 issue comment by changeset-bot[bot]: ### ⚠️ No Changeset found  Latest commit: 95eecbc26f41b15ca781fad2e14be36867775e97  Merging this PR will not cause a version bump for any packages. If these cha
- PR #887 review by copilot-pull-request-reviewer[bot] (COMMENTED): <!-- ccr-overview-v2 -->  ## Copilot review overview  ### 🟡 Changes recommended  The supplied review identifies unresolved documentation and planning-record iss
- PR #887 review by kaljarv (COMMENTED): Check passed.
- PR #887 issue comment by changeset-bot[bot]: ### ⚠️ No Changeset found  Latest commit: 8efd206062aadf4991bc3707d798096379a6039a  Merging this PR will not cause a version bump for any packages. If these cha
