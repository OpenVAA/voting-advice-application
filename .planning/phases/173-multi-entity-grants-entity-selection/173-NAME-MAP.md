# Phase 173 — Name and Fact Map

**Written by:** plan 173-01, Task 1 (the `## Baseline` section by Task 2).

tree_read: 607d471fb627808f94304c09b5dbb2a83580459c

branch: `feat/entity-signup-multi-grant` — the tree as Phases 170, 171 and 172 left it (last commit outside `.planning/`: `40523cd16`).

The thirteen plans of this phase were written while Phase 171 was executing and before Phase 172 started. **Where a plan and this file disagree, this file is the authority and no plan is edited.** Every count below is a snapshot for later comparison, never a target.

Abbreviations: `F` = `apps/frontend/src`, `P` = `apps/frontend/src/routes/contestant/(protected)`, `S` = `apps/supabase/supabase`, `T` = `tests/tests`. `git grep -E` on this host does not understand `\b`; the commands use `-F` or `-P`.

**Verdict:** every cited name resolves to something on the tree. Six rows of `## Names` are marked DIFFERS and nine rows of `## Facts re-measured` say `differs:`; the ones that change what a later task does are listed under `## What differs and which plan it touches` at the end.

## Preconditions

| Phase directory | `ls <dir> \| grep -c -- '-PLAN.md'` | `ls <dir> \| grep -c -- '-SUMMARY.md'` | Verdict |
|---|---|---|---|
| `.planning/phases/171-project-settings-served-entity-types-registration-mode-matri/` | 4 | 4 | executed in full |
| `.planning/phases/172-terms-of-use-per-user-and-project/` | 9 | 9 | executed in full |

Node: `$HOME/.nvm/versions/node/v24.21.0/bin` exists (`ls $HOME/.nvm/versions/node/`).

**D-02, read-only — verdict: record already corrected.** Neither file was edited, and no task of this phase edits `.planning/ROADMAP.md`, `.planning/REQUIREMENTS.md` or `.planning/PROJECT.md`. Found with `grep -n -E "idx_grants_one_candidate_editor|ERR_ENTITY_IDENTITY_AMBIGUOUS" .planning/ROADMAP.md .planning/PROJECT.md .planning/REQUIREMENTS.md`.

- `ROADMAP.md` § Phase 173, criterion 1: "the single-entity assumptions — the user-data RPC `get_candidate_user_data` raising `ERR_ENTITY_IDENTITY_AMBIGUOUS`, and the candidate-only sign-in gate in the frontend — no longer stand in the way. `idx_grants_one_candidate_editor` is kept: it limits a candidate to one editor, not a user to one candidate (ENT-03). (amended 2026-10-05, 173-A1)"
- `PROJECT.md`, "Known constraints to lift": "`get_candidate_user_data` assumes one entity per user per project — it raises `ERR_ENTITY_IDENTITY_AMBIGUOUS` — and so does the frontend's candidate-only sign-in gate. `idx_grants_one_candidate_editor` does not: it limits a candidate to one editor, not a user to one candidate, and it is kept (record corrected 2026-10-05, 173-A1)"
- `REQUIREMENTS.md` ENT-03 says the same ("`idx_grants_one_candidate_editor` stays … so it was never the blocker").

## Names

One row per role. A row whose tree name differs from the name these plans use carries the word DIFFERS.

| Role | Name these plans use | Name found on the tree | Command that found it |
|---|---|---|---|
| Served-types accessor module | `packages/app-shared/src/settings/contestantAppConfig.ts` with `getServedEntityTypes`, `SERVED_ENTITY_TYPES`, `ServedEntityType`, `getContestantAppNameKey` | same four exports, in that file; also `REGISTRATION_MODE(S)`, `RegistrationMode`, `RegistrationModeMatrix`, `ContestantAppNameKey`, `ContestantAppConfigInput`, `getEffectiveRegistrationModes`, `isRegistrationModeAllowed(ForAnyType)`, `isAnyRegistrationAllowed`. `SERVED_ENTITY_TYPES = ['candidate', 'organization']` | `git grep -n -E "^export (const\|function\|type) " -- packages/app-shared/src/settings/contestantAppConfig.ts` |
| Package barrel exports it | the barrel | `export * from './settings/contestantAppConfig';` in `packages/app-shared/src/index.ts` | `git grep -n -F "contestantAppConfig" -- packages/app-shared/src/index.ts` |
| Frontend app-name helper | `getContestantAppName` under `F/lib/contestant/utils/` | `getContestantAppName` in `F/lib/contestant/utils/contestantAppName.ts` (test beside it) | `git grep -n -E "^export function" -- apps/frontend/src/lib/contestant/utils/contestantAppName.ts` |
| Settings merge | `mergeAppSettings` in `F/lib/utils/settings.ts` | same; it merges member by member: `mergeLevel` recurses wherever both sides pass `isMergeable` (a non-null, non-array object); `mergeInitialAppSettings` beside it | `git grep -n -E "^(export )?function" -- apps/frontend/src/lib/utils/settings.ts` |
| Gate list | `CONTESTANT_GATES`, `firstNeededGate`, `GATE_VIEWS`, the acceptance view, under `F/lib/contestant/gates/` | `CONTESTANT_GATES`, `firstNeededGate`, `ContestantGateId = 'termsOfUse'`, `ContestantGate` in `gates.ts`; `GATE_VIEWS` in `gateViews.ts`; the view is `TermsOfUseGate.svelte`; `gates.test.ts` | `git grep -n -E "^export " -- apps/frontend/src/lib/contestant/gates` |
| Protected server load | `P/+layout.server.ts` | same. Stages in order: (1) `locals.safeGetSession()`, none → `redirect(307, ContestantAppLogin)`; (2) `dataWriter.getBasicUserData()`, failure → `handleError('loginFailed')`; (3) `firstNeededGate(user)`, a gate → `return { gate, user }`; (4) `loadEntity()`; (5) `dataProvider.getQuestionData` → return | read of the file; `grep -n -E "^(export \|async function\|  const \|  if \|  return)" "$P/+layout.server.ts"` |
| Its entity step | a named entity-step function | `loadEntity()`, an inner function of `load`: `getContestantUserData({ loadNominations: true })`, failure → `loginFailed`; `role !== 'candidate'` → `userNotAuthorized`; `!candidate` → `userNoCandidate`; no election or constituency id → `candidateNoNomination`; returns `{ userData, electionId }`. The caller's `if (!entity) return;` follows it | same read |
| Its two return shapes | `{ gate, user }` / `{ gate: null, user, … }` | `{ gate, user }` and `{ gate: null, user, questionData, contestantUserData: userData }` | same read |
| Key for the user data | `contestantUserData` | `contestantUserData` | `git grep -n -F "contestantUserData" -- "$P/+layout.server.ts"` |
| Its sign-out helper | the sign-out helper | `async function handleError(error: ContestantLoginError): Promise<void>`, an inner function: `locals.supabase.auth.signOut({ scope: 'local' })`, then `redirect(307, buildRoute({ route: 'ContestantAppLogin', locale: lang, errorMessage: error }))` | same read |
| Layout and tests beside it | the layout component and two test files | `P/+layout.svelte`, `P/layout.server.test.ts`, `P/termsOfUseLayout.svelte.test.ts`; also `P/contestantHome.helpers.ts` and its test | `find "$P" -type f \| sort` (13 files) |
| Writer types | `BasicUserData` (with `termsOfUseAccepted`), `UserRole`, `ContestantUserData`, `LocalizedCandidateData`, `EditableEntityProps`, `getContestantUserData` and its options type, in `F/lib/api/base/dataWriter.type.ts` | all there: `BasicUserData` (`termsOfUseAccepted: string \| null`), `UserRole = 'candidate' \| 'admin'`, `ContestantUserData<TNominations>` (`{ user, candidate, nominations }`), `LocalizedCandidateData`, `EditableEntityProps`, `SetPropertiesOptions`, `GetContestantUserDataOptions<TNominations>` | `git grep -n -P "export (type\|interface) (BasicUserData\|UserRole\|ContestantUserData\|LocalizedCandidateData\|EditableEntityProps\|GetContestantUserDataOptions\|SetPropertiesOptions)\b" -- apps/frontend/src/lib/api/base/dataWriter.type.ts` |
| Base writer | the base class in `universalDataWriter.ts` | `export abstract class UniversalDataWriter extends UniversalAdapter implements DataWriter`; `getContestantUserData` delegates to the abstract `_getContestantUserData` | `git grep -n -P "getContestantUserData\|^export abstract class" -- apps/frontend/src/lib/api/base/universalDataWriter.ts` |
| Supabase writer | `_getBasicUserData`, `_getContestantUserData`, `_setAnswers`, `_updateEntityProperties`, the upload helper, `scopedFrom`, in `F/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts` | all there. `_getBasicUserData` tests `CANDIDATE_GRANTS` first, then `ADMIN_GRANTS`, and reads `terms_of_use_acceptances`. `_getContestantUserData` calls `.rpc('get_candidate_user_data', { p_project_id: this.projectId, p_entity_type: 'candidate' }).single()`. `_setAnswers` throws `Unsupported entity type for setting answers` for a non-candidate. `_updateEntityProperties` is image-only and uses `scopedFrom('candidates')` twice. The upload helper is `#uploadCandidateFile`, path `${projectId}/candidates/${id}/…` | `git grep -n -P "_getBasicUserData\|_getContestantUserData\|_setAnswers\|_updateEntityProperties\|#upload\|scopedFrom\(\|GRANTS\|rpc\('" -- <the file>` |
| Adapter `utils/` with zod narrowing | the adapter's `utils/` directory | `F/lib/api/adapters/supabase/utils/`: `parseOutcome.ts` (`parseWithPartialPreserve`), `parseJsonbColumn.ts`, `parseStoredCustomization.ts`, `parseFailureMessages.ts`, `mapRow.ts`, `localizeRow.ts`, `toDataObject.ts`, `fetchAllRows.ts`, `storageUrl.ts`, `bySortOrderThenId.ts`, `convertFilterValue.ts` | `ls apps/frontend/src/lib/api/adapters/supabase/utils/` |
| User-data store | `F/lib/contexts/contestant/contestantUserDataState.svelte.ts`: the class, `init`, `reset`, `resetUnsaved`, `save`, `savedCandidateData`, `reloadCandidateData` | class `ContestantUserDataStateImpl`, factory `contestantUserDataState(…)`; arrow-function fields `init`, `reset`, `resetUnsaved`, `setAnswer`, `setImage`, `reloadCandidateData`, `save`; getters `current`, `hasUnsaved`, `savedCandidateData`, `unsavedQuestionIds`, `unsavedProperties`. `save()` stamps `type: ENTITY_TYPE.Candidate` | `grep -n -E "^class \|^  (init\|reset\|resetUnsaved\|save\|reloadCandidateData\|setAnswer\|setImage) = \|^  get " <the file>` |
| The persisted draft handle and its key | the fixed draft key, as Phase 170 left it | `#editedAnswersState = localStorageState('ContestantContext-contestantUserDataStore-editedAnswers', {} as LocalizedAnswers)` — **DIFFERS** from CONTEXT.md's expected lower-case `contestantContext-…`; equal to the literal RESEARCH R-7.1 greps for | `git grep -n -F "ContestantContext-contestantUserDataStore-editedAnswers" -- ':!.planning'` (one line) |
| Contestant context | `contestantContext.svelte.ts`: `#reset`, the effect with `const entityType = ENTITY_TYPE.Candidate`, the accessor derived from `page.data` | `#reset = (): void => { this.#userData.reset(); this.#newUserEmail = undefined; }`, run after `logout`'s `goto(ContestantAppLogin, { invalidateAll: true })`; `const entityType = ENTITY_TYPE.Candidate;` inside an `$effect`; `#idTokenClaims = $derived(page.data.claims ?? undefined)` is the accessor derived from `page.data`; other persisted keys: `contestantContext-preselectedElectionIds` (session), `contestantContext-isPreregistered` (local) | `git grep -n -P "#reset\|const entityType = ENTITY_TYPE\|page\.data\|StorageState\(" -- apps/frontend/src/lib/contexts/contestant/contestantContext.svelte.ts` |
| Persisted state | `localStorageState`, the implementation class, no removal function | `localStorageState`, `sessionStorageState`, class `PersistedStateImpl`; the handle is `{ current, set, update }` and has no removal function (the one `storage.removeItem(key)` is internal, on a stale stored version) | `git grep -n -P "^export (function\|class\|const)\|^class \|removeItem" -- apps/frontend/src/lib/contexts/utils/persistedState.svelte.ts` |
| Roles | `CANDIDATE_GRANTS`, `ADMIN_GRANTS`, `hasAnyGrant`, `readGrants` in `F/lib/auth/roles.ts` | all four, plus `GrantClaim`, `GrantShape`, `GRANT_SCOPES`, `GRANT_ROLES`; the login action passes `allowedGrants: CANDIDATE_GRANTS` (imported from `$lib/auth`) | `git grep -n -P "^export (const\|function\|type)" -- apps/frontend/src/lib/auth/roles.ts` |
| Route constants | `ROUTE`, `CONTESTANT`, `CONTESTANT_PROT`, six contestant keys of the protected tree | `CONTESTANT = '/contestant'`, `CONTESTANT_PROT = \`${CONTESTANT}/${PROTECTED_GROUP}\``; `ContestantAppHome: CONTESTANT` (the root; not built on `CONTESTANT_PROT`), `ContestantAppPreview`, `ContestantAppProfile`, `ContestantAppQuestion` (`…/questions/[questionId]`), `ContestantAppQuestions`, `ContestantAppSettings` | `git grep -n -P "CONTESTANT\|ContestantApp(Home\|Preview\|Profile\|Question\|Questions\|Settings):" -- apps/frontend/src/lib/routes/route.ts` |
| Route params | `ROUTE_PARAMS` holding `entityType` and `entityId` | `['categoryId', 'electionTab', 'entity', 'entityId', 'entityTab', 'entityType', 'id', 'jobId', 'questionId']` in `F/lib/routes/params.ts` | `git grep -n -A10 -F "ROUTE_PARAMS = " -- apps/frontend/src/lib/routes/params.ts` |
| Route builder | `buildRoute`, `getRoute`, `routeConsistency.test.ts` C1 and C2 | `buildRoute(options, current?)` in `F/lib/routes/buildRoute.ts`; `createGetRoute()` in `F/lib/contexts/app/getRoute.svelte.ts` returns `{ current }` built with `buildRoute(options, { params, route, url })`. C1: every addressable page directory inside a protected group has a `ROUTE` entry that addresses it. C2: every `ROUTE` value carrying the group segment names a directory that exists. (C3 to C5 exist too.) | `git grep -n -P "C1\|C2" -- apps/frontend/src/lib/routes/routeConsistency.test.ts` |
| View-transition overlay rule | `isOverlayNavigation` in `F/lib/utils/viewTransition.ts` | `export function isOverlayNavigation(from, to)` there | `git grep -n -F "isOverlayNavigation" -- apps/frontend/src/lib/utils/viewTransition.ts` |
| The user-data function | the block in `S/schema/503-entity-rpcs.sql` and its columns | `public.get_candidate_user_data (p_project_id uuid, p_entity_type public.entity_type DEFAULT 'candidate')`, `plpgsql STABLE SECURITY INVOKER`, the raise with `HINT = 'ERR_ENTITY_IDENTITY_AMBIGUOUS'`, `GRANT EXECUTE … TO authenticated`. Thirteen columns: `id, project_id, name, short_name, info, color, image, sort_order, subtype, custom_data, answers, first_name, last_name`. The file header line names it too | `grep -n -E "get_candidate_user_data\|ERR_ENTITY" S/schema/503-entity-rpcs.sql`; on the applied database `pg_proc`: 13 output columns |
| The helper | `private.caller_entity_ids` and its comment in `301-auth-functions.sql` | `private.caller_entity_ids (uuid, entity_type) RETURNS SETOF uuid LANGUAGE sql STABLE SECURITY DEFINER`, `search_path = ''`, reads `public.grants` for `auth.uid()` with `role = 'editor'`; its comment says "get_candidate_user_data calls it to answer \"which entity am I\""; the file's function list names it | `grep -n -E "caller_entity_ids\|get_candidate_user_data" S/schema/301-auth-functions.sql` |
| The index comment | the comment above `idx_grants_one_candidate_editor` in `300-auth-tables.sql` | the one-line comment beginning "A candidate has at most one editor, because a candidate-scope user is the candidate." directly above `CREATE UNIQUE INDEX idx_grants_one_candidate_editor ON public.grants (target_id)` | `grep -n -B1 "CREATE UNIQUE INDEX idx_grants_one_candidate_editor" S/schema/300-auth-tables.sql` |
| pgTAP "which entity am I" | `36-entity-identity.test.sql` | `plan (20)`; nine calls of the function, the `throws_ok` on the hint, `'get_candidate_user_data runs with the caller''s rights'`, the two index assertions | `grep -n -E "plan ?\(\|get_candidate_user_data\|ERR_ENTITY\|idx_grants_one" S/tests/database/36-entity-identity.test.sql` |
| pgTAP output-shape pins | `21-entity-organization.test.sql` | `plan (21)`; `'get_candidate_user_data declares 13 output columns'`, `'… returns no organization output column'`, "Section 8: get_candidate_user_data answers for ONE project", the `undefined_function` assertion | same command on that file |
| pgTAP definer censuses | `07-rpc-security.test.sql` Section 8c, both strings | anon: `contestant_app_public_config,project_open_for_voters,storage_path_can,storage_path_is_public,user_can,user_has_account_grant` (six); authenticated: the same with `get_entity_basic_data` after the first (seven) | `grep -n -E "^    '[a-z_,]+',?$" S/tests/database/07-rpc-security.test.sql` |
| pgTAP grant helper | `test_seed_identity_grants` | `test_seed_identity_grants (p_user_name text) RETURNS integer` in `00-helpers.test.sql` (and `test_seed_fixture_grants`) | `grep -n "test_seed_identity_grants" S/tests/database/00-helpers.test.sql` |
| Type override | the member in `packages/supabase-types/src/database.overrides.ts` | `get_candidate_user_data: WithReturns<'get_candidate_user_data', Nullable<'get_candidate_user_data', 'first_name' \| 'last_name' \| 'subtype' \| 'sort_order'>>` — four columns | `grep -n -A3 "get_candidate_user_data:" packages/supabase-types/src/database.overrides.ts` |
| Nullability artifact | the function's section in `RPC-NULLABILITY.md` | the bullet `get_candidate_user_data.first_name — …`, the DERIVED line `…503-entity-rpcs.sql:177  get_candidate_user_data  (RETURNS TABLE at :180, 13 columns)`, and `## 3. \`get_candidate_user_data\` — 13 columns, 4 overridden, 9 no-change` | `grep -n "get_candidate_user_data" packages/supabase-types/RPC-NULLABILITY.md` |
| Project-scoping guard | `PROJECT_SCOPED_RPCS` in `scripts/assert-project-scoped-queries.mjs` | the entry `get_candidate_user_data: 'requires p_project_id',` | `grep -n -E "PROJECT_SCOPED_RPCS\|get_candidate_user_data" scripts/assert-project-scoped-queries.mjs` |
| Name gate, exemption list | `EXEMPT`, "exactly two entries" | **DIFFERS**: `EXEMPT` holds **three** entries: `/get_candidate_user_data/g` (see phase 173), `/invite-candidate/g` (see phase 174), and the three shown names of the app as whole quoted strings, `/(?<=['"])(?:Candidate app\|Party app\|Candidate and party app)(?=['"])/g` (see phase 171). The two sentences that state the count say "exactly three": the docblock's "EXEMPTIONS: exactly three entries …" and "The exemption list. Exactly three entries; each is masked before matching." | `grep -n -E "EXEMPT\|[Ee]xactly\|see phase" scripts/assert-no-candidate-app-names.mjs`; `git grep -n -i "exactly two" -- scripts` finds only an unrelated line of `assert-grant-permission-enum.mjs` |
| Name gate, URL expression | the `/candidate URL` expression with its lookbehind | `name: '/candidate URL'`, lookbehind `(?<!candidates\|organizations\|alliances\|variants\|[Vv]oter\|party\|user\|proj\|entity\|faction\|results\|candidate\|fixtures\|setup\|specs\|generated)` — `contestant` is not in it | `grep -n -A1 "name: '/candidate URL'" scripts/assert-no-candidate-app-names.mjs` |
| Name gate, fixture lines | `e02`, `n10`, `n21` in `scripts/fixtures/assert-no-candidate-app-names.input.ts` | `const e02 = rpc('get_candidate_user_data') && data.candidateUserData;`, `const n10 = rpc('get_candidate_user_data');`, `const n21 = 'userNoCandidate' ?? 'candidateNoNomination';` | `grep -n -E "const (e02\|n10\|n21) " scripts/fixtures/assert-no-candidate-app-names.input.ts` |
| Name gate, position | its position in `lint:check` | link 8 of 20 (`yarn assert:no-candidate-app-names`); the a11y scan wiring guard is link 6 | a `node -e` split of the `lint:check` script on `&&` |
| E2E admin client | `forceRegister` with options, the public acceptance helper, `unregisterCandidate` in `T/utils/supabaseAdminClient.ts` | `forceRegister(candidateExternalId, email, password, options: { acceptTermsOfUse?: boolean } = {})`, `acceptTermsOfUse(email)`, `unregisterCandidate(email)`, the protected `insertTermsOfUseAcceptance(userId, caller)`, `candidateIdsForUser(userId)`. No `grantEntity` | `grep -n -E "async (forceRegister\|acceptTermsOfUse\|unregisterCandidate\|grantEntity\|candidateIdsForUser)\(\|insertTermsOfUseAcceptance" T/utils/supabaseAdminClient.ts` |
| Shared session helper | the register-and-store-session helper, its parameter object, its file | `async function registerAndStoreSession(page: Page, identity: StoredSessionIdentity)`, module-level and **not exported**, in `T/setup/shared/auth.setup.ts`; `interface StoredSessionIdentity` (`externalId`, `email`, `password`, `storageStatePath`, `acceptTermsOfUse`, optional `settledTestId`), also not exported; `waitForLoginForm` beside it; two `setup(…)` tests | `grep -n -E "^(export )?(async )?function \|^(export )?(interface\|const) \|^setup\(" T/setup/shared/auth.setup.ts` |
| Stored-session path constants | the constants in `T/utils/testCredentials.ts` | `TERMS_PENDING_STORAGE_STATE` only. **DIFFERS**: the base candidate's session path is not there; it is `authFile` (`playwright/.auth/user.json`), a module constant of `auth.setup.ts`. Also `TEST_CANDIDATE_EXTERNAL_ID` (`test-e2e-base-ca-aa-1`), `…_EMAIL`, `…_PASSWORD`, `TEST_TERMS_PENDING_CANDIDATE_EXTERNAL_ID` (`test-e2e-base-ca-aa-hidden`), `…_EMAIL` | `grep -n -E "^export const" T/utils/testCredentials.ts` |
| A11y spec | the entry interface, the hoisted function, the `describe` selecting the terms-pending session | `interface ContestantAxeRoute extends Omit<RawAxeRoute, 'settle'>`; tables `CONTESTANT_AXE_ROUTES` and `TERMS_PENDING_AXE_ROUTES`; `toScanEntry(entry, label, dark)`; the hoisted `declareScans(entry)`; `test.describe(() => { test.use({ storageState: TERMS_PENDING_STORAGE_STATE }); … })`. The docblock states eight surfaces, 16 scans | `grep -n -E "^(interface\|function\|const [A-Z_]+\|test\.describe\|  test\.use)" T/specs/a11y/contestant-a11y.spec.ts` |
| Playwright projects | `auth-setup`, `contestant-a11y-scan`, `contestant-journey`, `cold-entry-dataroot-contestant`, the dependency list of `data-setup-perm-1e1cg1co` | all five names in `tests/playwright.config.ts`; `contestant-a11y-scan` has `dependencies: ['data-setup-base', 'auth-setup']`; the dependency list of `data-setup-perm-1e1cg1co` is a multi-line array (read it in place) | `grep -n -E "name: '(auth-setup\|contestant-a11y-scan\|contestant-journey\|cold-entry-dataroot-contestant\|data-setup-perm-1e1cg1co)'" tests/playwright.config.ts` |
| A11y wiring guard | the four checks of `scripts/assert-a11y-scan-wiring.mjs` | Check 1: `contestant-a11y-scan` remains a project (gated, `testMatch`, `storageState`); Check 2: `a11y-smoke` keeps its explicit `testMatch`; Check 3: `contestant-a11y-scan` is named in the dependencies of `data-setup-perm-1e1cg1co`; Check 4 (4a, 4b): strictness parity and ordering. It says "14 scans" in three places — stale, the project holds 16 | `grep -n -E "\b14\b\|Check [0-9]" scripts/assert-a11y-scan-wiring.mjs` |
| Nav-menu fixture | `T/fixtures/shared/navMenu.fixture.ts` and "the constant holding the logged-in menu's ordered item list" | **DIFFERS**: the fixture (`NavMenuFixture`, `createNavMenu(page)`) holds no such constant; it takes the list as an argument, `expectNavMenuItems(expected: Array<RegExp \| string>)`. The constant is `CONTESTANT_NAV_LOGGED_IN` (with `CONTESTANT_NAV_LOGGED_OUT` beside it), declared in `T/specs/contestant/contestant-journey.spec.ts` and not exported | `grep -n -E "items\(\)\|expectNavMenuItems" T/fixtures/shared/navMenu.fixture.ts`; `git grep -n -o -E "const CONTESTANT_NAV_[A-Z_]+" -- tests/tests` |
| Test ids | the `contestant` group of `T/utils/testIds.ts` | groups `login`, `common`, `profile`, `home`, `questions`, `settings`, `preview`, `nav` (`home`, `profile`, `questions`, `settings`, `preview` as `contestant-nav-…`), `forgotPassword`, `register`, `preregister`, `passwordReset`, … The Help page's support button id `contestant-help-contact-support` is a literal in the page | `grep -n -E "^    [a-zA-Z]+: \{" T/utils/testIds.ts` |
| Tests' route builder | `T/utils/buildRoute.ts` | `buildRoute({ route, locale })`: maps `ROUTE[route]` segment by segment, replaces only `[[lang=locale]]`, passes any other `[param]` segment through as text, never throws | read of the file |
| Seed settings, E2E base | `BASE_APP_SETTINGS` in `packages/dev-seed/src/templates/e2e/base.ts` and its `contestantApp` member | `contestantApp: { questions: { hideHero: false, hideVideo: false }, entityTypes: ['candidate'], registrationModes: { candidate: ['email', 'code'], organization: [] } }` | an `awk` read from `export const BASE_APP_SETTINGS` to the member's closing brace |
| Seed settings, perm | `MINIMAL_BASE_APP_SETTINGS` in `packages/dev-seed/src/templates/e2e/perm/shared.ts` | there; it states the whole `contestantApp` root, candidates only | `grep -rn "export const MINIMAL_BASE_APP_SETTINGS" packages/dev-seed/src` |
| Tests pinning either | the tests that pin either | `packages/dev-seed/tests/templates/base-app-settings.test.ts`, `packages/dev-seed/tests/templates/built-in-templates-contestant-app.test.ts` | `git grep -l -E "BASE_APP_SETTINGS\|entityTypes" -- packages/dev-seed/tests` |
| Control candidates | the two control candidates seeded unconfirmed | `test-e2e-base-ca-aa-hidden` and `test-e2e-base-ca-aa-unregistered`, both `confirmed: false`, each with one nomination under `test-e2e-base-or-aa` in `el-reg` / `co-reg-n` | `grep -n -A3 -E "external_id: 'test-e2e-base-ca-aa-(unregistered\|hidden)'" packages/dev-seed/src/templates/e2e/base.ts` |
| `EntityCard` | its props and the `getCardQuestions` call | `F/lib/dynamic-components/entityCard/`: props `action?: CardAction`, `entity: MaybeWrappedEntityVariant`, `variant?: 'list' \| 'details' \| 'subcard'`, `maxSubcards?`, `showElection?`; it calls `getCardQuestions` from `$lib/utils/entityCards`. No `headerOnly`, `showType` or `keepScroll` | `grep -n -E "^\s+\w+\??:\|getCardQuestions" <EntityCard.type.ts and EntityCard.svelte>` |
| `EntityList` | `EntityList` | `F/lib/dynamic-components/entityList/EntityList.svelte`; `EntityListProps` with `cards: Array<EntityCardProps>` | `grep -n "cards" <EntityList.type.ts>` |
| `NavGroup`, `ContestantNav` | `NavGroup` (its `title` prop), `ContestantNav` | `F/lib/dynamic-components/navigation/NavGroup.svelte` with `title?: string` in `NavGroup.type.ts`; `F/lib/dynamic-components/navigation/contestant/ContestantNav.svelte` | `git ls-files -- apps/frontend/src \| grep -E "/(NavGroup\|ContestantNav)\."` |
| `MainContent`, `LogoutButton` | `MainContent`, `LogoutButton` | `F/lib/layouts/main/MainContent.svelte`; `F/lib/contestant/components/logoutButton/LogoutButton.svelte` | `git ls-files` on the two directories |
| Layout context page styles | the layout context's `pageStyles.push` | **DIFFERS**: there is no `pageStyles.push`. The layout context (`F/lib/contexts/layout/layoutContext.svelte.ts`) exposes `usePageStyles(overlay)`, which calls `pageStyles.use(overlay)` on a `settingsOverlay<PageStyles, DeepPartial<PageStyles>>(DEFAULT_PAGE_STYLES, …)` | `git grep -n -i -F "pageStyles" -- apps/frontend/src/lib/contexts/layout` (`git grep -n -F "pageStyles.push" -- apps/frontend/src` exits 1) |
| Help page support button | the support button and `getEmailUrl` | `P/../help/+page.svelte`: `getEmailUrl({ … })` from `$lib/utils/email`, a button with `t('contestantApp.common.contactSupport')` and `data-testid="contestant-help-contact-support"` | `git grep -n -E "getEmailUrl\|contactSupport" -- "apps/frontend/src/routes/contestant/help/+page.svelte"` |
| Header return and logout | `Banner.svelte`'s default return callback; a header logout button | `F/lib/layouts/main/Banner.svelte`: the default return callback is `goto(appType.current === 'voter' ? getRoute.current('Home') : getRoute.current('ContestantAppHome'))`. **DIFFERS**: there is no header logout button in practice — it is rendered under `topBarSettings.current.actions.logout == 'show' && page.data.token`, and no load returns `token` | `git grep -n -F "page.data.token" -- apps/frontend/src` (that one line) |

## Facts re-measured

Columns: id, claim, verdict (`holds`, `differs: <what the tree shows>` or `deferred to <plan>`), the command or file read. A1 to A13 are the research's *Assumptions Log*; F1 to F16 are the 16 baseline facts of `173-CONTEXT.md`; X1 to X3 are the three rows the research does not number.

| Id | Claim | Verdict | Command or file read |
|---|---|---|---|
| A1 | Phase 172 leaves the protected load as five stages with `firstNeededGate(user)`, a named entity-step function and the two return shapes | holds — session, `getBasicUserData`, `firstNeededGate`, `loadEntity()`, question data; `{ gate, user }` and `{ gate: null, user, questionData, contestantUserData }` | `P/+layout.server.ts`, read |
| A2 | Phase 172 removes `terms_of_use_accepted` from the function, the override and the frontend types | holds — 13 output columns on the applied database, four overridden columns, and `git grep -n terms_of_use_accepted -- ':!.planning'` exits 1 | `pg_proc` through `docker exec supabase_db_openvaa-local psql`; the override file; the grep |
| A3 | Phase 172's session helper takes one `externalId` and lives inside `auth.setup.ts` | holds — `registerAndStoreSession(page, identity)`, one `externalId` per identity, module-level, not exported | `T/setup/shared/auth.setup.ts` |
| A4 | Phase 171 makes `mergeAppSettings` deep and its templates state the whole `contestantApp` root with `entityTypes: ['candidate']` | holds — `mergeLevel` recurses over mergeable objects; both `BASE_APP_SETTINGS` and `MINIMAL_BASE_APP_SETTINGS` state the whole root | `F/lib/utils/settings.ts`; the two templates |
| A5 | Phase 171 names the three app names as planned and adds a base-dataset heading assertion reading "Candidate app" | differs: the three names exist (`ContestantAppNameKey = 'candidate' \| 'organization' \| 'candidateAndOrganization'`), but the journey spec asserts the heading through the catalogue (`….dynamic.contestantAppName.candidate`), not through the literal; the population command P-7 prints two lines, the journey spec and `perm-closed-project.spec.ts` | population P-7 below |
| A6 | Phase 171's accessor module keeps the exports read at `a4b408eb7` | holds — `getServedEntityTypes`, `SERVED_ENTITY_TYPES`, `ServedEntityType`, `getContestantAppNameKey`, exported through the barrel | the Names table, first two rows |
| A7 | `plpgsql_check` does not analyse `LANGUAGE sql` functions | deferred to 173-02 — Task 1, when `yarn db:lint:sql` runs against the two new functions (and the `sql-lint` row of its gate set) | — |
| A8 | A static or matcher-constrained route always wins over a rest route for the same path | deferred to 173-08 — Task 3 (the entity-less resolver), by `routeConsistency.test.ts` and the run that closes that plan | — |
| A9 | `scopedFrom` called with a union of two table names typechecks through `update(…).select(…).single()` | deferred to 173-03 — Task 1 (the generic entity path), by `yarn workspace @openvaa/frontend typecheck` | — |
| A10 | Playwright refuses a setup file importing another setup file | deferred to 173-12 — Task 1 (the shared session helper moves to a plain module either way: it is not exported today) | — |
| A11 | The generated type of `get_user_entities` is `Returns: Json` | deferred to 173-02 — Task 1, at `yarn db:types`. The one `jsonb`-returning public function on the tree, `contestant_app_public_config`, is generated that way | `git grep -n -A3 "contestant_app_public_config" -- packages/supabase-types/src/database.ts` |
| A12 | 172's new table does not move file 36's "What anon can read" census | holds — file 36 was last edited before Phase 172 and passed in every gate run of that phase (38 files, 1385 tests at its close); the `pgtap` row of this plan's baseline re-measures it | `172-09-SUMMARY.md`; the baseline below |
| A13 | The two opt-in visual baselines do not render the app's name | holds for all four baselines the tree has (two of the voter results, two of the contestant preview): measured by 173-11, no difference under the widened dataset | `tests/e2e-runs/173-visual/173-11-observe/observed.txt`; `## After 173-11` |
| F1 | The index is one editor per candidate, not one candidate per user | holds — `CREATE UNIQUE INDEX idx_grants_one_candidate_editor ON public.grants (target_id) WHERE scope = 'entity' AND target_type = 'candidate' AND role = 'editor'`; the comment's last clause still names `get_candidate_user_data` | `S/schema/300-auth-tables.sql` |
| F2 | A user holding the same grant twice is impossible | holds — `CONSTRAINT grants_user_scope_target_role_key UNIQUE NULLS NOT DISTINCT (user_id, scope, target_type, target_id, role)` | `grep -n -o "CONSTRAINT grants_user_scope_target_role_key.*" S/schema/300-auth-tables.sql` |
| F3 | The function's raise is the real blocker; file 36 pins the raise and the index by name | holds — the raise and the hint are in `503-entity-rpcs.sql`; file 36 holds the `throws_ok` and both index assertions | the two files |
| F4 | `private.caller_entity_ids` is `SECURITY DEFINER`, reads the table, `role = 'editor'` only; the public function is `SECURITY INVOKER` | holds | `S/schema/301-auth-functions.sql`, `503-entity-rpcs.sql` |
| F5 | The data writer is candidate-only at five points | differs: four of the five stand under Phase 170's names (`_getContestantUserData`, `#uploadCandidateFile`, the store's `save()`); `_updateEntityProperties` is now image-only (Phase 172) and still always reads and writes `candidates` | populations G-4a, G-4b, G-5, G-6 |
| F6 | An organization editor cannot sign in | holds — `CANDIDATE_GRANTS` holds the one candidate shape; the login action passes it as `allowedGrants`; `_getBasicUserData` derives the role from it; `loadEntity()` signs out with `userNotAuthorized` when `role !== 'candidate'` | populations G-7, G-8a, G-8b |
| F7 | Zero grants: refused at login, or signed out with `userNoCandidate`; no nomination → `candidateNoNomination` | holds — the branches stand inside `loadEntity()`. The research's reading stands too: `.single()` throws on zero rows, so the `userNoCandidate` branch cannot fire through the Supabase writer and no test names it | `P/+layout.server.ts`; `git grep -n -F "userNoCandidate" -- apps/frontend/src tests` |
| F8 | Unsaved answers are persisted under one fixed key | differs: the fact holds; the key is now `ContestantContext-contestantUserDataStore-editedAnswers` (Phase 170 renamed it) | population P-5 |
| F9 | No "selected entity" exists anywhere | holds — the id flows from `userData.savedCandidateData`; `entityType` is hard-coded in the context's effect | population G-2; the context file |
| F10 | Every protected route constant is built from the protected prefix; the tree is home, `profile`, `questions`, `questions/[questionId]`, `preview`, `settings` | differs: names only — `CONTESTANT_PROT` (`/contestant/(protected)`), `ContestantAppHome` is `/contestant`; the tree is as stated, 13 files with the two test files and the helper pair | populations E-2, E-3 |
| F11 | `EntityCard` takes a `@openvaa/data` entity object; `action` overrides the default link; three variants | holds | `F/lib/dynamic-components/entityCard/EntityCard.type.ts` |
| F12 | The token hook emits one four-key object per grant row with no cap | holds — `jsonb_build_object('scope', …, 'target_type', …, 'target_id', …, 'role', …)` in `custom_access_token_hook` | `grep -n -o "jsonb_build_object ('scope'.*" S/schema/301-auth-functions.sql` |
| F13 | E2E builds a signed-in candidate with `forceRegister(candidateExternalId, email, password)`; one stored session | differs: `forceRegister` has a fourth parameter, `options: { acceptTermsOfUse?: boolean } = {}`, and inserts the acceptance row by default; `auth.setup.ts` stores two sessions (the base candidate and the terms-pending user) | the Names table |
| F14 | `identity-callback` breaks for a multi-candidate user | holds — `findExistingCandidate` ends in `.maybeSingle()` and throws `ERR_CANDIDATE_LOOKUP_FAILED` "including when two granted candidates sit in this project" | `grep -n -E "maybeSingle\|ERR_CANDIDATE_LOOKUP_FAILED" S/functions/identity-callback/candidateRecord.ts` |
| F15 | The frontend types are candidate-shaped | differs: names only — `ContestantUserData { user, candidate, nominations }`, `getContestantUserData`; `LocalizedCandidateData`, `savedCandidateData`, `reloadCandidateData` are unchanged | populations G-1, G-2, G-3 |
| F16 | The four entity tables have independent primary keys | holds — "the four entity tables have independent primary keys and one uuid can name two entities" in the `get_entity_basic_data` comment | `grep -n -o -i ".{40}one uuid can name two.{30}" S/schema/503-entity-rpcs.sql` |
| X1 | Was pgTAP run green by Phase 172 on a database holding E2E data? | differs: no. Every gate run of Phase 172 reset the database in the row before pgTAP (`02-types-regen` is `yarn db:reset`, then `yarn db:types`), so pgTAP always ran on migrations plus `seed.sql`. Nothing shows the suite green on a database that holds an E2E project or the `default` dataset | `172-gates.sh` header; `172-NAMES.md` § *The two helpers* |
| X2 | Do `172-gates.sh` and this phase's row list agree? | differs: Phase 172 has nine rows (lint, types-regen, types-clean, sql-lint, pgtap, unit, svelte-check, build, format). This phase has twelve: the same nine (svelte-check is named `check-frontend`) plus `typecheck`, `docs-links` and `name-gate-self-test`. The plan writes `types-regen` as `yarn db:types` alone; Phase 172 measured that this row is then red on a correct tree whenever pgTAP has run since the last reset (18 lines of test helpers in the generated file). On the applied database at the start of this plan the helpers are there: four of four probed (`create_test_data`, `set_test_user`, `test_id`, `test_seed_identity_grants`). So `173-gates.sh` resets in that row, as Phase 172's does — see Task 2 and the list at the end | `pg_proc` on the applied database; `172-gates.sh` |
| X3 | Can the stored session helper be imported by a second setup file as it stands? | differs: no. `registerAndStoreSession` and `StoredSessionIdentity` are module-level and not exported, and the module is a setup file whose top level declares two `setup(…)` tests | `T/setup/shared/auth.setup.ts` |

Measured beside these, on the applied database and the tree at `tree_read`: 20 tables in `public`; 104 policies in `public` and `storage`, 89 of them in `public`; 27 schema files; a 6446-line migration; 38 pgTAP files, of which `37-terms-of-use-acceptances` and `38-contestant-app-public-config` are the last two, so 39 is the next free number; `terms_of_use_acceptances` holds no row. Section 7 of pgTAP file 37 is a standing census: a policy, a function or a column that names `terms_of_use` turns it red until exempted there by name.

## Populations at the start

Each block is the command and its output on the tree named at the top, before any edit of this phase. Lines longer than 220 characters are cut and end in " …"; nothing else is altered. E-1 to E-11 are the commands of research R-2.8 and G-1 to G-9 those of R-5.1, copied as they stand (E-7, G-4 and G-8 each hold two commands and are split into `a` and `b`); P-1 to P-9 are the further commands of the plan. The research's 2026-10-06 snapshots beside them, for orientation only: E-1 81 lines (now 82), E-3 12 files (13), E-5 32 (32), E-6 8 (8), E-7 23 then 3 (23, 3), E-8 21 files (21), E-10 11 (12), G-1 29 (28), G-3 8 files (9), the function's name 51 lines (54).

### E-1 — route keys and every reference to them

```bash
git grep -n -P "ContestantApp(Home|Preview|Profile|Question|Questions|Settings)\b" -- apps packages tests ':!apps/docs'
```

Exit status 0, 82 line(s).

```text
apps/frontend/src/lib/dynamic-components/navigation/contestant/ContestantNav.svelte:55:        href={getRoute.current('ContestantAppHome')}
apps/frontend/src/lib/dynamic-components/navigation/contestant/ContestantNav.svelte:60:        href={getRoute.current('ContestantAppProfile')}
apps/frontend/src/lib/dynamic-components/navigation/contestant/ContestantNav.svelte:65:        href={getRoute.current('ContestantAppQuestions')}
apps/frontend/src/lib/dynamic-components/navigation/contestant/ContestantNav.svelte:78:        href={getRoute.current('ContestantAppPreview')}
apps/frontend/src/lib/dynamic-components/navigation/contestant/ContestantNav.svelte:83:        href={getRoute.current('ContestantAppSettings')}
apps/frontend/src/lib/layouts/main/Banner.svelte:91:        (() => goto(appType.current === 'voter' ? getRoute.current('Home') : getRoute.current('ContestantAppHome')))} />
apps/frontend/src/lib/routes/appGates.test.ts:64:    ['the contestant app root', ROUTE.ContestantAppHome],
apps/frontend/src/lib/routes/appGates.test.ts:65:    ['a protected candidate page', ROUTE.ContestantAppProfile]
apps/frontend/src/lib/routes/appGates.test.ts:148:    ['the contestant app root', ROUTE.ContestantAppHome, 0],
apps/frontend/src/lib/routes/appGates.test.ts:150:    ['a protected candidate page', ROUTE.ContestantAppProfile, 0],
apps/frontend/src/lib/routes/appGates.test.ts:182:    const candidate = resolveAppGate(ROUTE.ContestantAppProfile);
apps/frontend/src/lib/routes/appGates.test.ts:221:    expect(candidate.whenAuthenticatedOnLogin.route).toBe('ContestantAppHome');
apps/frontend/src/lib/routes/appGates.ts:102:    route: 'ContestantAppHome',
apps/frontend/src/lib/routes/buildRoute.redirects.test.ts:36:    expect(buildRoute({ route: 'ContestantAppHome', locale: 'en' })).toBe('/contestant');
apps/frontend/src/lib/routes/route.ts:95:  ContestantAppHome: CONTESTANT,
apps/frontend/src/lib/routes/route.ts:96:  ContestantAppPreview: `${CONTESTANT_PROT}/preview`,
apps/frontend/src/lib/routes/route.ts:98:  ContestantAppProfile: `${CONTESTANT_PROT}/profile`,
apps/frontend/src/lib/routes/route.ts:99:  ContestantAppQuestion: `${CONTESTANT_PROT}/questions/[questionId]`,
apps/frontend/src/lib/routes/route.ts:100:  ContestantAppQuestions: `${CONTESTANT_PROT}/questions`,
apps/frontend/src/lib/routes/route.ts:111:  ContestantAppSettings: `${CONTESTANT_PROT}/settings`,
apps/frontend/src/lib/routes/routeConsistency.test.ts:396:    ['ContestantAppHome', ROUTE.ContestantAppHome],
apps/frontend/src/lib/routes/routeConsistency.test.ts:407:    const lookalike = `${ROUTE.ContestantAppHome}/xx${PROTECTED_GROUP}yy`;
apps/frontend/src/routes/api/auth/callback/+server.ts:50:            target ? localizeAppPath(`/${target}`, locale) : buildRoute({ route: 'ContestantAppHome', locale })
apps/frontend/src/routes/api/auth/callback/+server.ts:54:          throw redirect(303, buildRoute({ route: 'ContestantAppHome', locale }));
apps/frontend/src/routes/contestant/(protected)/+page.svelte:106:      href={getRoute.current('ContestantAppProfile')}
apps/frontend/src/routes/contestant/(protected)/+page.svelte:119:      href={getRoute.current('ContestantAppQuestions')}
apps/frontend/src/routes/contestant/(protected)/+page.svelte:132:      href={getRoute.current('ContestantAppPreview')}
apps/frontend/src/routes/contestant/(protected)/contestantHome.helpers.test.ts:69:      href: '/route/ContestantAppPreview'
apps/frontend/src/routes/contestant/(protected)/contestantHome.helpers.test.ts:82:      href: '/route/ContestantAppPreview'
apps/frontend/src/routes/contestant/(protected)/contestantHome.helpers.test.ts:95:      href: '/route/ContestantAppQuestions'
apps/frontend/src/routes/contestant/(protected)/contestantHome.helpers.test.ts:108:      href: '/route/ContestantAppQuestions'
apps/frontend/src/routes/contestant/(protected)/contestantHome.helpers.test.ts:121:      href: '/route/ContestantAppProfile'
apps/frontend/src/routes/contestant/(protected)/contestantHome.helpers.test.ts:134:      href: '/route/ContestantAppProfile'
apps/frontend/src/routes/contestant/(protected)/contestantHome.helpers.test.ts:147:      href: '/route/ContestantAppProfile'
apps/frontend/src/routes/contestant/(protected)/contestantHome.helpers.test.ts:160:      href: '/route/ContestantAppQuestions'
apps/frontend/src/routes/contestant/(protected)/contestantHome.helpers.test.ts:192:    expect(both.href).toBe('/route/ContestantAppPreview');
apps/frontend/src/routes/contestant/(protected)/contestantHome.helpers.ts:31:export type ContestantHomeRouteName = 'ContestantAppPreview' | 'ContestantAppProfile' | 'ContestantAppQuestions';
apps/frontend/src/routes/contestant/(protected)/contestantHome.helpers.ts:96:    href: resolveRoute('ContestantAppProfile')
apps/frontend/src/routes/contestant/(protected)/contestantHome.helpers.ts:112:      href: resolveRoute('ContestantAppPreview')
apps/frontend/src/routes/contestant/(protected)/contestantHome.helpers.ts:124:      href: resolveRoute('ContestantAppQuestions')
apps/frontend/src/routes/contestant/(protected)/preview/+page.svelte:84:      returnButtonCallback: () => goto(getRoute.current('ContestantAppHome'))
apps/frontend/src/routes/contestant/(protected)/profile/+page.svelte:98:        submitRoute: getRoute.current('ContestantAppQuestions'),
apps/frontend/src/routes/contestant/(protected)/profile/+page.svelte:103:      submitRoute: getRoute.current('ContestantAppHome'),
apps/frontend/src/routes/contestant/(protected)/profile/+page.svelte:148:    goto(getRoute.current('ContestantAppHome')).then(() => (bypassPreventNavigation = false));
apps/frontend/src/routes/contestant/(protected)/profile/+page.svelte:337:          href={getRoute.current('ContestantAppHome')}
apps/frontend/src/routes/contestant/(protected)/questions/+layout.svelte:35:      goto(getRoute.current('ContestantAppProfile'));
apps/frontend/src/routes/contestant/(protected)/questions/+layout.svelte:67:      <Button href={getRoute.current('ContestantAppHome')} text={t('common.return')} variant="main" />
apps/frontend/src/routes/contestant/(protected)/questions/+page.svelte:99:          route: 'ContestantAppQuestion',
apps/frontend/src/routes/contestant/(protected)/questions/+page.svelte:128:            route: 'ContestantAppQuestion',
apps/frontend/src/routes/contestant/(protected)/questions/+page.svelte:181:                  href={getRoute.current({ route: 'ContestantAppQuestion', questionId: id })}
apps/frontend/src/routes/contestant/(protected)/questions/+page.svelte:200:        href={getRoute.current('ContestantAppHome')}
apps/frontend/src/routes/contestant/(protected)/questions/[questionId]/+page.svelte:126:        submitRoute: getRoute.current({ route: 'ContestantAppQuestion', questionId: nextQuestionId }),
apps/frontend/src/routes/contestant/(protected)/questions/[questionId]/+page.svelte:131:        submitRoute: getRoute.current('ContestantAppHome'),
apps/frontend/src/routes/contestant/(protected)/questions/[questionId]/+page.svelte:136:      submitRoute: getRoute.current('ContestantAppQuestions'),
apps/frontend/src/routes/contestant/(protected)/questions/[questionId]/+page.svelte:230:    goto(getRoute.current('ContestantAppQuestions')).then(() => (bypassPreventNavigation = false));
apps/frontend/src/routes/contestant/(protected)/questions/[questionId]/+page.svelte:349:                href={getRoute.current('ContestantAppQuestions')}
apps/frontend/src/routes/contestant/(protected)/settings/+page.svelte:135:        href={getRoute.current('ContestantAppHome')}
apps/frontend/src/routes/contestant/help/+page.svelte:70:      href={userData.current ? getRoute.current('ContestantAppHome') : getRoute.current('ContestantAppLogin')}
apps/frontend/src/routes/contestant/login/+page.server.ts:25:    const home = buildRoute({ route: 'ContestantAppHome', locale: locals.currentLocale });
apps/frontend/src/routes/contestant/password-reset/+page.svelte:78:      window.location.href = getRoute.current('ContestantAppHome');
apps/frontend/src/routes/contestant/preregister/+layout.svelte:46:      onclick={() => goto(getRoute.current('ContestantAppHome'), { invalidateAll: true })} />
apps/frontend/src/routes/contestant/preregister/+layout.svelte:53:      onclick={() => goto(getRoute.current('ContestantAppHome'), { invalidateAll: true })} />
apps/frontend/src/routes/contestant/privacy/+page.svelte:38:      href={userData.current ? getRoute.current('ContestantAppHome') : getRoute.current('ContestantAppLogin')}
apps/frontend/src/routes/contestant/register/+layout.svelte:32:      onclick={() => goto(getRoute.current('ContestantAppHome'), { invalidateAll: true })} />
tests/tests/setup/perm/perm-answers-locked.setup.ts:66:  const contestantHome = buildRoute({ route: 'ContestantAppHome', locale: 'en' });
tests/tests/setup/perm/perm-disable-allow-open.setup.ts:55:  const contestantHome = buildRoute({ route: 'ContestantAppHome', locale: 'en' });
tests/tests/setup/perm/perm-hide-hero.setup.ts:57:  const contestantHome = buildRoute({ route: 'ContestantAppHome', locale: 'en' });
tests/tests/setup/perm/perm-question-video.setup.ts:57:  const contestantHome = buildRoute({ route: 'ContestantAppHome', locale: 'en' });
tests/tests/setup/shared/auth.setup.ts:102:  const contestantHome = buildRoute({ route: 'ContestantAppHome', locale: 'en' });
tests/tests/specs/a11y/contestant-a11y.spec.ts:171:    routeId: 'ContestantAppHome',
tests/tests/specs/a11y/contestant-a11y.spec.ts:180:    routeId: 'ContestantAppProfile',
tests/tests/specs/a11y/contestant-a11y.spec.ts:191:    routeId: 'ContestantAppQuestions',
tests/tests/specs/a11y/contestant-a11y.spec.ts:207:    routeId: 'ContestantAppQuestions',
tests/tests/specs/a11y/contestant-a11y.spec.ts:223:    routeId: 'ContestantAppPreview',
tests/tests/specs/a11y/contestant-a11y.spec.ts:233:    routeId: 'ContestantAppSettings',
tests/tests/specs/a11y/contestant-a11y.spec.ts:243:    routeId: 'ContestantAppHome',
tests/tests/specs/a11y/contestant-a11y.spec.ts:267:    routeId: 'ContestantAppHome',
tests/tests/specs/contestant/contestant-journey.spec.ts:574:      // Positively settle on the contestant-home route BEFORE asserting the home status message. With the required field still empty, profile/+page.svelte's `s …
tests/tests/specs/perm/perm-localisation-positive.spec.ts:246:    // Save q3. NOTE: because the seeded candidate has ALREADY answered every opinion question, `unansweredOpinionQuestions` is empty, so the editor's save ac …
tests/tests/specs/visual/visual-regression.spec.ts:159:    await page.goto(buildRoute({ route: 'ContestantAppPreview', locale: 'en' }));
tests/tests/specs/visual/visual-regression.spec.ts:184:    await page.goto(buildRoute({ route: 'ContestantAppPreview', locale: 'en' }));
tests/tests/specs/voter/cold-entry-dataroot.spec.ts:83:    await page.goto(buildRoute({ route: 'ContestantAppQuestions', locale: 'en' }));
```

### E-2 — the protected prefix constant

```bash
git grep -n -F "CONTESTANT_PROT" -- apps/frontend/src tests
```

Exit status 0, 7 line(s).

```text
apps/frontend/src/lib/routes/route.ts:6: * This is the single definition of the pattern. `CONTESTANT_PROT` and `ADMIN_PROT` below are built from it, every `(protected)` route id in `ROUTE` is built from those two, and `i …
apps/frontend/src/lib/routes/route.ts:13:export const CONTESTANT_PROT = `${CONTESTANT}/${PROTECTED_GROUP}`;
apps/frontend/src/lib/routes/route.ts:96:  ContestantAppPreview: `${CONTESTANT_PROT}/preview`,
apps/frontend/src/lib/routes/route.ts:98:  ContestantAppProfile: `${CONTESTANT_PROT}/profile`,
apps/frontend/src/lib/routes/route.ts:99:  ContestantAppQuestion: `${CONTESTANT_PROT}/questions/[questionId]`,
apps/frontend/src/lib/routes/route.ts:100:  ContestantAppQuestions: `${CONTESTANT_PROT}/questions`,
apps/frontend/src/lib/routes/route.ts:111:  ContestantAppSettings: `${CONTESTANT_PROT}/settings`,
```

### E-3 — files under the protected group

```bash
find "apps/frontend/src/routes/contestant/(protected)" -type f | sort
```

Exit status 0, 13 line(s).

```text
apps/frontend/src/routes/contestant/(protected)/+layout.server.ts
apps/frontend/src/routes/contestant/(protected)/+layout.svelte
apps/frontend/src/routes/contestant/(protected)/+page.svelte
apps/frontend/src/routes/contestant/(protected)/contestantHome.helpers.test.ts
apps/frontend/src/routes/contestant/(protected)/contestantHome.helpers.ts
apps/frontend/src/routes/contestant/(protected)/layout.server.test.ts
apps/frontend/src/routes/contestant/(protected)/preview/+page.svelte
apps/frontend/src/routes/contestant/(protected)/profile/+page.svelte
apps/frontend/src/routes/contestant/(protected)/questions/[questionId]/+page.svelte
apps/frontend/src/routes/contestant/(protected)/questions/+layout.svelte
apps/frontend/src/routes/contestant/(protected)/questions/+page.svelte
apps/frontend/src/routes/contestant/(protected)/settings/+page.svelte
apps/frontend/src/routes/contestant/(protected)/termsOfUseLayout.svelte.test.ts
```

### E-4 — redirects in the app's server code

```bash
git grep -n -E "redirect\(" -- apps/frontend/src/routes/contestant apps/frontend/src/routes/api/auth apps/frontend/src/hooks.server.ts
```

Exit status 0, 12 line(s).

```text
apps/frontend/src/hooks.server.ts:101:    redirect(status, buildRoute({ route: target, locale, ...params({ redirectTo: '' }) }));
apps/frontend/src/hooks.server.ts:106:    redirect(status, buildRoute({ route: target, locale, ...params({ redirectTo: loginRedirectTargetOf(url) }) }));
apps/frontend/src/routes/api/auth/callback/+server.ts:36:          throw redirect(303, buildRoute({ route: 'ContestantAppResetPassword', locale }));
apps/frontend/src/routes/api/auth/callback/+server.ts:42:          throw redirect(303, buildRoute({ route: 'ContestantAppSetPassword', locale, email: user?.email ?? '' }));
apps/frontend/src/routes/api/auth/callback/+server.ts:48:          throw redirect(
apps/frontend/src/routes/api/auth/callback/+server.ts:54:          throw redirect(303, buildRoute({ route: 'ContestantAppHome', locale }));
apps/frontend/src/routes/api/auth/callback/+server.ts:60:  throw redirect(303, buildRoute({ route: 'ContestantAppLogin', locale, errorMessage: 'authError' }));
apps/frontend/src/routes/contestant/(protected)/+layout.server.ts:35:    return redirect(
apps/frontend/src/routes/contestant/(protected)/+layout.server.ts:118:    redirect(
apps/frontend/src/routes/contestant/login/+page.server.ts:26:    return redirect(303, redirectTo ? `/${locals.currentLocale}/${redirectTo}` : home);
apps/frontend/src/routes/contestant/preregister/+layout.server.ts:24:    return redirect(
apps/frontend/src/routes/contestant/register/+layout.server.ts:32:    return redirect(
```

### E-5 — E2E gotos that name a protected page with no entity

```bash
git grep -n -P "contestant/(profile|questions|preview|settings)" -- tests/tests
```

Exit status 0, 32 line(s).

```text
tests/tests/fixtures/contestant/contestantPreviewPage.fixture.ts:4: * Function-fixture for the candidate /contestant/preview page (`apps/frontend/src/routes/contestant/(protected)/preview/+page.svelte`) which renders the …
tests/tests/fixtures/contestant/contestantProfilePage.fixture.ts:190:     * Assert the profile-submit flow advances away from /profile (i.e., the submit was successful — the page navigates to /contestant or /contestant …
tests/tests/fixtures/contestant/contestantQuestionsOverviewPage.fixture.ts:4: * Function-fixture for the candidate /contestant/questions overview page (`apps/frontend/src/routes/contestant/(protected)/questions/+page.sve …
tests/tests/fixtures/contestant/contestantQuestionsOverviewPage.fixture.ts:64:      await page.goto('/en/contestant/questions');
tests/tests/fixtures/contestant/contestantQuestionsOverviewPage.fixture.ts:148:     *   3. Await navigation off the overview onto the per-question route (`/contestant/questions/<questionId>`).
tests/tests/setup/perm/perm-answers-locked.setup.ts:6: * The storage-state file is consumed by the AUTHENTICATED sub-tests in perm-answers-locked.spec.ts (surfaces 2 + 3: /contestant/profile + /contestant/questions/[ques …
tests/tests/setup/perm/perm-hide-hero.setup.ts:6: * The spec consumes the storage state to navigate to /en/contestant/questions/[questionId] as an authenticated candidate and assert hideHero=true suppresses hero renderin …
tests/tests/setup/perm/perm-question-video.setup.ts:6: * The spec consumes the storage state for the candidate `hideVideo` slice (navigate to /en/contestant/questions/[questionId] as an authenticated candidate and assert …
tests/tests/specs/a11y/contestant-a11y.spec.ts:59: * | `/contestant/questions` empty-state intro (`contestant-questions-intro`) | every `e2e/base` candidate carries answers (0 hits for `answersByExternalId: {}` across 31 …
tests/tests/specs/a11y/contestant-a11y.spec.ts:202:    // Reached by WALKING the expanded overview through the questions-overview fixture, never by a constructed URL: `/contestant/questions/[questionId]` carries the inte …
tests/tests/specs/contestant/contestant-journey.spec.ts:12: *         /contestant/profile navigation re-redirects to /contestant/login.
tests/tests/specs/contestant/contestant-journey.spec.ts:163: * Walk the per-question editor for the candidate opinion-question loop in step 19. At each /contestant/questions/{id} URL: select choice 0 + clickContinue. Loo …
tests/tests/specs/contestant/contestant-journey.spec.ts:246: * Extract the internal question id from a settled per-question editor URL (`/contestant/questions/<id>`). The choice inputs carry `name="questionChoices-<id>"` …
tests/tests/specs/contestant/contestant-journey.spec.ts:404:      // Navigate directly to /contestant/profile while unauthenticated — protected layout redirects back to /contestant/login.
tests/tests/specs/contestant/contestant-journey.spec.ts:405:      await page.goto('/en/contestant/profile');
tests/tests/specs/contestant/contestant-journey.spec.ts:575:      // The regex matches '/contestant', '/contestant/', '/contestant?…' and '/contestant#…' (tolerating an optional locale prefix), but not '/contestant/p …
tests/tests/specs/contestant/contestant-journey.spec.ts:626:      await page.goto('/en/contestant/questions');
tests/tests/specs/contestant/contestant-journey.spec.ts:658:      await page.goto('/en/contestant/questions');
tests/tests/specs/contestant/contestant-journey.spec.ts:711:      await page.goto('/en/contestant/questions');
tests/tests/specs/contestant/contestant-journey.spec.ts:731:      await page.goto('/en/contestant/questions');
tests/tests/specs/contestant/contestant-journey.spec.ts:746:      await page.goto('/en/contestant/questions');
tests/tests/specs/contestant/contestant-journey.spec.ts:795:      await page.goto('/en/contestant/questions');
tests/tests/specs/contestant/contestant-journey.spec.ts:804:      await page.goto('/en/contestant/preview');
tests/tests/specs/perm/perm-answers-locked.spec.ts:4: *   Surface 2 (AUTHENTICATED): /en/contestant/profile renders the contestant-answers-locked-warning Warning + every visible <input>/<textarea>/<select> is disabled.
tests/tests/specs/perm/perm-answers-locked.spec.ts:5: *   Surface 3 (AUTHENTICATED): /en/contestant/questions/[questionId] renders the same warning + the question-choices radios are
tests/tests/specs/perm/perm-answers-locked.spec.ts:32:    await page.goto('/en/contestant/profile');
tests/tests/specs/perm/perm-answers-locked.spec.ts:50:    // The per-question URL is keyed on the INTERNAL question id, not the seed external_id, so `page.goto('/en/contestant/questions/<external_id>')` is impossible. Cl …
tests/tests/specs/perm/perm-disable-allow-open.spec.ts:30:  // The per-question candidate URL is keyed on the INTERNAL question id, not the seed external_id, so `page.goto('/contestant/questions/<external_id>')` resolves …
tests/tests/specs/perm/perm-hide-hero.spec.ts:4: * The candidate navigates through the questions OVERVIEW (not a raw deep link) before opening the first opinion question. This is load-bearing: deep-linking straight to /c …
tests/tests/specs/perm/perm-localisation-positive.spec.ts:195:    await page.goto('/en/contestant/profile');
tests/tests/specs/voter/cold-entry-dataroot.spec.ts:81:  test('cold direct-URL entry to /contestant/questions renders the question overview', async ({ page }) => {
tests/tests/utils/testIds.ts:22:    // single canonical testid on the <Warning> element rendering editingNotAllowed across /contestant, /contestant/profile, /contestant/questions/[questionId].
```

### E-6 — E2E gotos of the app root

```bash
git grep -n -P "goto\(['\"\`]/en/contestant['\"\`]\)" -- tests/tests
```

Exit status 0, 8 line(s).

```text
tests/tests/specs/contestant/contestant-journey.spec.ts:763:      await page.goto('/en/contestant');
tests/tests/specs/contestant/contestant-journey.spec.ts:826:      await page.goto('/en/contestant');
tests/tests/specs/perm/perm-access-disable.spec.ts:58:    await page.goto('/en/contestant');
tests/tests/specs/perm/perm-access-disable.spec.ts:68:    await page.goto('/en/contestant');
tests/tests/specs/perm/perm-access-disable.spec.ts:100:    await page.goto('/en/contestant');
tests/tests/specs/perm/perm-answers-locked.spec.ts:23:    await page.goto('/en/contestant');
tests/tests/specs/perm/perm-localisation-positive.spec.ts:271:    await page.goto('/en/contestant');
tests/tests/specs/perm/perm-per-app-notifications.spec.ts:23:    await page.goto('/en/contestant');
```

### E-7a — E2E assertions on a URL shape

```bash
git grep -n -E "toHaveURL|waitForURL" -- tests/tests | grep -i contestant
```

Exit status 0, 23 line(s).

```text
tests/tests/fixtures/contestant/contestantLogoutButton.fixture.ts:46:      await expect(page).toHaveURL(/\/contestant\/login/);
tests/tests/fixtures/contestant/contestantProfilePage.fixture.ts:193:      await expect(page).toHaveURL(/\/contestant(?!\/profile)/);
tests/tests/specs/a11y/contestant-a11y.spec.ts:215:      await page.waitForURL(/\/contestant\/questions\/[^/?#]+/, { timeout: TIMEOUTS.slowPage });
tests/tests/specs/contestant/contestant-bank-auth-journey.spec.ts:139:      await page.waitForURL(/\/contestant\/preregister\/status/, { timeout: TIMEOUTS.slowPage });
tests/tests/specs/contestant/contestant-journey.spec.ts:180:  await page.waitForURL(PER_QUESTION_URL_RE, { timeout: timeoutMs });
tests/tests/specs/contestant/contestant-journey.spec.ts:195:    await page.waitForURL((u) => u.toString() !== current, { timeout: timeoutMs });
tests/tests/specs/contestant/contestant-journey.spec.ts:223:  await page.waitForURL(
tests/tests/specs/contestant/contestant-journey.spec.ts:241:    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: timeoutMs });
tests/tests/specs/contestant/contestant-journey.spec.ts:403:      await expect(page).toHaveURL(/\/contestant\/login/, { timeout: TIMEOUTS.slowPage });
tests/tests/specs/contestant/contestant-journey.spec.ts:406:      await expect(page).toHaveURL(/\/contestant\/login/, { timeout: TIMEOUTS.slowPage });
tests/tests/specs/contestant/contestant-journey.spec.ts:475:      await expect(page).toHaveURL(/\/contestant\/profile/, { timeout: TIMEOUTS.slowPage });
tests/tests/specs/contestant/contestant-journey.spec.ts:555:      await expect(page).toHaveURL(/\/contestant\/profile/, { timeout: TIMEOUTS.slowPage });
tests/tests/specs/contestant/contestant-journey.spec.ts:577:      await page.waitForURL(/\/contestant\/?(?:\?|#|$)/, { timeout: TIMEOUTS.slowPage });
tests/tests/specs/contestant/contestant-journey.spec.ts:587:      await expect(page).toHaveURL(/\/contestant\/profile/, { timeout: TIMEOUTS.slowPage });
tests/tests/specs/contestant/contestant-journey.spec.ts:592:      await expect(page).toHaveURL(/\/contestant\/questions/, { timeout: TIMEOUTS.slowPage });
tests/tests/specs/contestant/contestant-journey.spec.ts:601:      await expect(page).toHaveURL(/\/contestant\/questions\/[^/]+/, {
tests/tests/specs/contestant/contestant-journey.spec.ts:627:      await expect(page).toHaveURL(/\/contestant\/questions(\?|$|#)/, {
tests/tests/specs/contestant/contestant-journey.spec.ts:650:      await expect(page).toHaveURL(/\/contestant\/questions\/[^/]+/, {
tests/tests/specs/contestant/contestant-journey.spec.ts:671:      await expect(page).toHaveURL(/\/contestant\/questions\/[^/]+/, { timeout: TIMEOUTS.slowPage });
tests/tests/specs/contestant/contestant-journey.spec.ts:723:      await expect(page).toHaveURL(/\/contestant\/questions\/[^/]+/, { timeout: TIMEOUTS.slowPage });
tests/tests/specs/contestant/contestant-journey.spec.ts:738:      await expect(page).toHaveURL(/\/contestant\/questions\/[^/]+/, { timeout: TIMEOUTS.slowPage });
tests/tests/specs/perm/perm-closed-project.spec.ts:116:    await expect(page).not.toHaveURL(/\/contestant\/login/);
tests/tests/specs/perm/perm-localisation-positive.spec.ts:250:    await page.waitForURL(/\/contestant\/questions(\/?$|\?)/, { timeout: L10N_SLOW_PAGE });
```

### E-7b — the per-question URL expression

```bash
git grep -n -F "PER_QUESTION_URL_RE" -- tests/tests
```

Exit status 0, 3 line(s).

```text
tests/tests/specs/contestant/contestant-journey.spec.ts:178:  const PER_QUESTION_URL_RE = /\/contestant\/questions\/[^/?]+/;
tests/tests/specs/contestant/contestant-journey.spec.ts:180:  await page.waitForURL(PER_QUESTION_URL_RE, { timeout: timeoutMs });
tests/tests/specs/contestant/contestant-journey.spec.ts:183:    if (!PER_QUESTION_URL_RE.test(current)) return;
```

### E-8 — callers of the tests' own route builder

```bash
git grep -l -E "buildRoute\(" -- tests
```

Exit status 0, 21 line(s).

```text
tests/tests/fixtures/voter/aboutPage.fixture.ts
tests/tests/fixtures/voter/resultsPage.fixture.ts
tests/tests/fixtures/voter/voter-journey.fixture.ts
tests/tests/fixtures/voter/voterHomePage.fixture.ts
tests/tests/fixtures/voter/voterIntroPage.fixture.ts
tests/tests/fixtures/voter/voterQuestionsPage.fixture.ts
tests/tests/setup/admin/admin-auth.setup.ts
tests/tests/setup/perm/perm-answers-locked.setup.ts
tests/tests/setup/perm/perm-disable-allow-open.setup.ts
tests/tests/setup/perm/perm-hide-hero.setup.ts
tests/tests/setup/perm/perm-question-video.setup.ts
tests/tests/setup/shared/auth.setup.ts
tests/tests/specs/a11y/a11y-smoke.spec.ts
tests/tests/specs/a11y/contestant-a11y.spec.ts
tests/tests/specs/admin/admin-access.spec.ts
tests/tests/specs/perm/perm-closed-project.spec.ts
tests/tests/specs/perm/perm-hide-all-nominations.spec.ts
tests/tests/specs/visual/visual-regression.spec.ts
tests/tests/specs/voter/cold-entry-dataroot.spec.ts
tests/tests/specs/voter/voter-journey.spec.ts
tests/tests/utils/buildRoute.ts
```

### E-9 — the same builder asked for an entity route

```bash
git grep -n -P "ContestantApp(Preview|Profile|Question|Questions|Settings)\b" -- tests
```

Exit status 0, 9 line(s).

```text
tests/tests/specs/a11y/contestant-a11y.spec.ts:180:    routeId: 'ContestantAppProfile',
tests/tests/specs/a11y/contestant-a11y.spec.ts:191:    routeId: 'ContestantAppQuestions',
tests/tests/specs/a11y/contestant-a11y.spec.ts:207:    routeId: 'ContestantAppQuestions',
tests/tests/specs/a11y/contestant-a11y.spec.ts:223:    routeId: 'ContestantAppPreview',
tests/tests/specs/a11y/contestant-a11y.spec.ts:233:    routeId: 'ContestantAppSettings',
tests/tests/specs/perm/perm-localisation-positive.spec.ts:246:    // Save q3. NOTE: because the seeded candidate has ALREADY answered every opinion question, `unansweredOpinionQuestions` is empty, so the editor's save ac …
tests/tests/specs/visual/visual-regression.spec.ts:159:    await page.goto(buildRoute({ route: 'ContestantAppPreview', locale: 'en' }));
tests/tests/specs/visual/visual-regression.spec.ts:184:    await page.goto(buildRoute({ route: 'ContestantAppPreview', locale: 'en' }));
tests/tests/specs/voter/cold-entry-dataroot.spec.ts:83:    await page.goto(buildRoute({ route: 'ContestantAppQuestions', locale: 'en' }));
```

### E-10 — docs that name the group or a moved file

```bash
git grep -n -F "(protected)" -- apps/docs/src ':!*generated*'
```

Exit status 0, 12 line(s).

```text
apps/docs/src/routes/(content)/developers-guide/admin-app/+page.md:9:- **Protected pages.** The pages under the `admin/(protected)` route group load the user's data and require the role `admin`; otherwise they sign the u …
apps/docs/src/routes/(content)/developers-guide/backend/authentication/+page.md:22:`hooks.server.ts` also gates the Contestant App and the Admin App on the session alone: a signed-in user is sent away from the login page …
apps/docs/src/routes/(content)/developers-guide/contestant-app/login-and-password-reset/+page.md:14:The pages under `/contestant` that need a candidate live in the `(protected)` route group. Its server loader redirects t …
apps/docs/src/routes/(content)/developers-guide/contestant-app/password-validation/+page.md:11:- [`settings/+page.svelte`](<https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/routes/contesta …
apps/docs/src/routes/(content)/developers-guide/contestant-app/registration/+page.md:20:- **When it is asked.** The server load of the protected layout, [`+layout.server.ts`](<https://github.com/OpenVAA/voting-advice-app …
apps/docs/src/routes/(content)/developers-guide/frontend/intro/+page.md:58:3. `appGateHandle` matches the route id against the app gates in `$lib/routes`. It redirects a signed-in user away from a gated app's login page, …
apps/docs/src/routes/(content)/developers-guide/frontend/intro/+page.md:69:| Contestant App | `src/routes/contestant/` | `contestant/(protected)/` needs a signed-in session                                                 …
apps/docs/src/routes/(content)/developers-guide/frontend/intro/+page.md:70:| Admin App      | `src/routes/admin/`      | `admin/(protected)/` needs a signed-in session                                                      …
apps/docs/src/routes/(content)/developers-guide/frontend/routing/+page.md:16:| `contestant/(protected)/` | The Contestant App pages that need a signed-in session: profile, questions, preview and settings.                 …
apps/docs/src/routes/(content)/developers-guide/frontend/routing/+page.md:18:| `admin/(protected)/`      | The Admin App pages that need a signed-in session: the dashboard, jobs, question info and argument condensation.  …
apps/docs/src/routes/(content)/developers-guide/frontend/routing/+page.md:21:The `(protected)` group is defined once, as `PROTECTED_GROUP` in `$lib/routes`. The request hook redirects a user without a session away from a …
apps/docs/src/routes/(content)/developers-guide/frontend/routing/+page.md:33:`routeConsistency.test.ts` checks `ROUTE` against the route tree in `yarn test:unit`. When you add a route under a `(protected)` directory, als …
```

### E-11 — source comments that name a moved path

```bash
git grep -n -F "contestant/(protected)/" -- apps tests ':!apps/docs'
```

Exit status 0, 24 line(s).

```text
apps/frontend/eslint.config.mjs:33:  'src/routes/contestant/(protected)/+layout.server.ts',
apps/frontend/src/lib/_guards/eslint-adapter-boundary-guard.test.ts:173:    it.each([['routes/contestant/(protected)/+layout.server.ts'], ['hooks.server.ts']])(
apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.test.ts:2031:      // A caller nominated in two elections passes a two-element array; picking [0] would drop the other election's scoped quest …
apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts:576:    // The `get_questions` RPC accepts a single uuid per election and constituency, so arrays from the caller fan out into one call per …
apps/frontend/src/lib/api/adapters/supabase/supabaseAdapter.concurrency.test.ts:26: * **1. The contamination window is wider than "two awaits in one function."** Fact 7 describes the window as the writer obtained at `con …
apps/frontend/src/lib/api/adapters/supabase/supabaseAdapter.concurrency.test.ts:151: * Request A's `await` on the gate models `await locals.safeGetSession()` at `contestant/(protected)/+layout.server.ts:33` — the reque …
apps/frontend/src/lib/api/adapters/supabase/supabaseAdapter.concurrency.test.ts:246:  // THE `#supabase` VECTOR — ledger row 1, filled by `157.2-02`. Request A obtains an adapter with client A and parks on the gate, re …
apps/frontend/src/lib/layouts/main/Layout.svelte.test.ts:8: * The component is mounted for real against fake contexts, following `routes/contestant/(protected)/termsOfUseLayout.svelte.test.ts`. The assertion is on `docum …
apps/frontend/src/lib/routes/route.test.ts:15:    '/contestant/(protected)/profile',
apps/frontend/src/lib/routes/routeConsistency.test.ts:108: * @returns The route id, group segments included, e.g. `/contestant/(protected)/profile`.
apps/frontend/src/lib/routes/routeConsistency.test.ts:117: * The normalisation is needed because `ROUTE` addresses the same page in two different shapes. A group-root page is addressed without its group (`/contestant` fo …
apps/frontend/src/routes/README.md:10:- Contestant app routes are in `candidate/`, and the ones requiring a signed-in candidate under `contestant/(protected)/`
apps/frontend/src/routes/contestant/(protected)/contestantHome.helpers.ts:2: * Pure helpers used inside the candidate welcome page's `$derived.by` and its two badge snippets, at `apps/frontend/src/routes/contestant/(prot …
apps/frontend/src/routes/contestant/(protected)/layout.server.test.ts:125:describe('routes/contestant/(protected)/+layout.server.ts — a user who must pass a gate', () => {
apps/frontend/src/routes/contestant/(protected)/layout.server.test.ts:153:describe('routes/contestant/(protected)/+layout.server.ts — a user past the gates', () => {
apps/frontend/src/routes/contestant/(protected)/layout.server.test.ts:185:describe('routes/contestant/(protected)/+layout.server.ts — the user-level data cannot be read', () => {
apps/frontend/src/routes/contestant/(protected)/layout.server.test.ts:204:describe('routes/contestant/(protected)/+layout.server.ts — no session', () => {
tests/tests/fixtures/contestant/contestantHomePage.fixture.ts:22: * Maps the SETTINGS-keyword task identifiers to the underlying testids on `contestant/(protected)/+page.svelte`.
tests/tests/fixtures/contestant/contestantHomePage.fixture.ts:23: * 'opinions' → contestant-home-questions per the source-of-truth attribute at `apps/frontend/src/routes/contestant/(protected)/+page.svelte:131`.
tests/tests/fixtures/contestant/contestantPreviewPage.fixture.ts:4: * Function-fixture for the candidate /contestant/preview page (`apps/frontend/src/routes/contestant/(protected)/preview/+page.svelte`) which renders the …
tests/tests/fixtures/contestant/contestantProfilePage.fixture.ts:4: * Function-fixture for the candidate profile (basic-info) page at `apps/frontend/src/routes/contestant/(protected)/profile/+page.svelte`.
tests/tests/fixtures/contestant/contestantQuestionPage.fixture.ts:4: * Function-fixture for the candidate per-question editor page (`apps/frontend/src/routes/contestant/(protected)/questions/[questionId]/+page.svelte`).
tests/tests/fixtures/contestant/contestantQuestionsOverviewPage.fixture.ts:4: * Function-fixture for the candidate /contestant/questions overview page (`apps/frontend/src/routes/contestant/(protected)/questions/+page.sve …
tests/tests/specs/perm/perm-disable-allow-open.spec.ts:10: *   Candidate side: the candidate question page (`contestant/(protected)/questions/[questionId]/+page.svelte`) gates the comment input on `{#if customData.allowO …
```

### G-1 — the user-data type's candidate member and every read of it

```bash
git grep -n -P "\.candidate\b" -- apps/frontend/src/routes/contestant apps/frontend/src/lib/contexts/contestant ':!*.test.ts'
```

Exit status 0, 28 line(s).

```text
apps/frontend/src/lib/contexts/contestant/contestantUserDataState.svelte.ts:109:      ...(this.#savedData.candidate.answers ?? {}),
apps/frontend/src/lib/contexts/contestant/contestantUserDataState.svelte.ts:114:      ...this.#savedData.candidate,
apps/frontend/src/lib/contexts/contestant/contestantUserDataState.svelte.ts:123:  #savedCandidateData = $derived(this.#savedData?.candidate);
apps/frontend/src/lib/contexts/contestant/contestantUserDataState.svelte.ts:205:    this.#updateCandidateData(userData.candidate);
apps/frontend/src/lib/contexts/contestant/contestantUserDataState.svelte.ts:206:    return userData.candidate;
apps/frontend/src/lib/contexts/contestant/contestantUserDataState.svelte.ts:218:        id: this.#savedData.candidate.id
apps/frontend/src/lib/contexts/contestant/contestantUserDataState.svelte.ts:251:      this.#updateCandidateData({ ...this.#savedData.candidate, ...updatedCandidate });
apps/frontend/src/routes/contestant/(protected)/+layout.svelte:43:    if (!ud?.nominations || !ud?.candidate) {
apps/frontend/src/routes/contestant/(protected)/+layout.svelte:50:      candidate: ud.candidate,
apps/frontend/src/routes/contestant/(protected)/+page.svelte:9:- `entities.hideIfMissingAnswers.candidate`: Affects message shown.
apps/frontend/src/routes/contestant/(protected)/+page.svelte:44:    infoOutstanding || (Boolean(appSettings.entities?.hideIfMissingAnswers?.candidate) && missingOpinionCount !== 0)
apps/frontend/src/routes/contestant/(protected)/+page.svelte:58:      username: userData.current?.candidate.firstName || '?',
apps/frontend/src/routes/contestant/(protected)/profile/+page.svelte:9:- `entities.hideIfMissingAnswers.candidate`: Affects message shown.
apps/frontend/src/routes/contestant/(protected)/profile/+page.svelte:90:    !contestantCtx.requiredInfoQuestions.some((q) => isEmptyValue(userData.current?.candidate.answers?.[q.id]?.value))
apps/frontend/src/routes/contestant/(protected)/profile/+page.svelte:176:        {#if contestantCtx.unansweredRequiredInfoQuestions?.length !== 0 || (appSettings.entities?.hideIfMissingAnswers?.candidate && contestantCtx …
apps/frontend/src/routes/contestant/(protected)/profile/+page.svelte:198:        value={userData.current?.candidate.firstName}
apps/frontend/src/routes/contestant/(protected)/profile/+page.svelte:205:        value={userData.current?.candidate.lastName}
apps/frontend/src/routes/contestant/(protected)/profile/+page.svelte:212:        {@const answer = userData.current?.candidate.answers?.[question.id]}
apps/frontend/src/routes/contestant/(protected)/profile/+page.svelte:249:              label={t('common.electionSymbol.candidate')}
apps/frontend/src/routes/contestant/(protected)/profile/+page.svelte:278:        value={userData.current?.candidate.image}
apps/frontend/src/routes/contestant/(protected)/profile/+page.svelte:288:        {@const answer = userData.current?.candidate.answers?.[question.id]}
apps/frontend/src/routes/contestant/(protected)/questions/+page.svelte:9:- `entities.hideIfMissingAnswers.candidate`: Affects message shown.
apps/frontend/src/routes/contestant/(protected)/questions/+page.svelte:81:        {#if contestantCtx.unansweredRequiredInfoQuestions?.length !== 0 || (appSettings.entities?.hideIfMissingAnswers?.candidate && contestantCt …
apps/frontend/src/routes/contestant/(protected)/questions/+page.svelte:121:          {#if appSettings.entities?.hideIfMissingAnswers?.candidate}
apps/frontend/src/routes/contestant/(protected)/questions/[questionId]/+page.svelte:120:    status !== 'loading' && !isEmptyValue(userData.current?.candidate.answers?.[question.id]?.value) && answerValid
apps/frontend/src/routes/contestant/(protected)/questions/[questionId]/+page.svelte:192:    const answer: Partial<LocalizedAnswer> = userData.current?.candidate.answers?.[question.id] ?? {};
apps/frontend/src/routes/contestant/(protected)/questions/[questionId]/+page.svelte:250:  {@const answer = userData.current?.candidate.answers?.[question.id]}
apps/frontend/src/routes/contestant/(protected)/settings/+page.svelte:9:- `entities.hideIfMissingAnswers.candidate`: Affects message shown.
```

### G-2 — candidate-named members and methods on the path

```bash
git grep -n -P "savedCandidateData|reloadCandidateData|LocalizedCandidateData|[uU]pdateCandidateData|[mM]ergeCandidateAnswers|uploadCandidateFile|translateLocalizedCandidate" -- apps/frontend/src tests
```

Exit status 0, 65 line(s).

```text
apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts:19:  LocalizedCandidateData,
apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts:240:    // Transform row to LocalizedCandidateData using established utilities
apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts:245:    const candidate: LocalizedCandidateData = {
apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts:258:    } as LocalizedCandidateData;
apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts:304:  async #uploadCandidateFile({ projectId, id, file }: { projectId: string; id: string; file: File }): Promise<string> {
apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts:332:        const storagePath = await this.#uploadCandidateFile({
apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts:368:  }: SetPropertiesOptions): DWReturnType<LocalizedCandidateData> {
apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts:380:            path: await this.#uploadCandidateFile({ projectId: this.projectId, id, file: imageWithFile.file })
apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts:396:    // reason: the declared return type is wrong for BOTH branches. The method returns only the one property it owns, the image, which the  …
apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts:399:    } as unknown as LocalizedCandidateData;
apps/frontend/src/lib/api/base/dataWriter.type.ts:180:  // Setting data owned by the user NB. The answer setters (`updateAnswers`/`overwriteAnswers`) return only the updated `LocalizedAnswers` map for synchronization — …
apps/frontend/src/lib/api/base/dataWriter.type.ts:204:   * @returns A `Promise` resolving the updated `LocalizedCandidateData` object or a `Response` containing one.
apps/frontend/src/lib/api/base/dataWriter.type.ts:207:  updateEntityProperties: (opts: SetPropertiesOptions) => DWReturnType<LocalizedCandidateData, TType>;
apps/frontend/src/lib/api/base/dataWriter.type.ts:290:export type LocalizedCandidateData = CandidateData & {
apps/frontend/src/lib/api/base/dataWriter.type.ts:306:  candidate: LocalizedCandidateData;
apps/frontend/src/lib/api/base/universalDataWriter.ts:18:  LocalizedCandidateData,
apps/frontend/src/lib/api/base/universalDataWriter.ts:173:  updateEntityProperties(opts: SetPropertiesOptions): DWReturnType<LocalizedCandidateData> {
apps/frontend/src/lib/api/base/universalDataWriter.ts:250:  protected abstract _updateEntityProperties(opts: SetPropertiesOptions): DWReturnType<LocalizedCandidateData>;
apps/frontend/src/lib/api/utils/translateLocalizedCandidate.ts:3:import type { LocalizedCandidateData } from '../base/dataWriter.type';
apps/frontend/src/lib/api/utils/translateLocalizedCandidate.ts:8:export function translateLocalizedCandidate(candidate: LocalizedCandidateData, locale: string | null): CandidateData {
apps/frontend/src/lib/contexts/contestant/contestantContext.svelte.ts:168:    const savedData = this.#userData.savedCandidateData;
apps/frontend/src/lib/contexts/contestant/contestantContext.svelte.ts:174:    const savedData = this.#userData.savedCandidateData;
apps/frontend/src/lib/contexts/contestant/contestantUserDataState.svelte.test.ts:8:  LocalizedCandidateData,
apps/frontend/src/lib/contexts/contestant/contestantUserDataState.svelte.test.ts:26:function makeUserData(overrides?: Partial<LocalizedCandidateData>): ContestantUserData<true> {
apps/frontend/src/lib/contexts/contestant/contestantUserDataState.svelte.test.ts:35:    } as LocalizedCandidateData,
apps/frontend/src/lib/contexts/contestant/contestantUserDataState.svelte.test.ts:65:    }): Promise<LocalizedCandidateData> =>
apps/frontend/src/lib/contexts/contestant/contestantUserDataState.svelte.test.ts:67:      ({ image: properties.image ?? null }) as unknown as LocalizedCandidateData
apps/frontend/src/lib/contexts/contestant/contestantUserDataState.svelte.test.ts:139:    expect(store.savedCandidateData?.id).toBe('cand-1');
apps/frontend/src/lib/contexts/contestant/contestantUserDataState.svelte.test.ts:140:    expect(store.savedCandidateData?.firstName).toBe('A');
apps/frontend/src/lib/contexts/contestant/contestantUserDataState.svelte.test.ts:141:    expect(store.savedCandidateData?.answers?.q1).toEqual({ value: 3 });
apps/frontend/src/lib/contexts/contestant/contestantUserDataState.svelte.test.ts:160:    expect(store.savedCandidateData?.id).toBe('cand-1');
apps/frontend/src/lib/contexts/contestant/contestantUserDataState.svelte.test.ts:161:    expect(store.savedCandidateData?.firstName).toBe('A');
apps/frontend/src/lib/contexts/contestant/contestantUserDataState.svelte.test.ts:162:    expect(store.savedCandidateData?.image).toEqual(image);
apps/frontend/src/lib/contexts/contestant/contestantUserDataState.svelte.test.ts:176:    expect(store.savedCandidateData?.id).toBe('cand-1');
apps/frontend/src/lib/contexts/contestant/contestantUserDataState.svelte.test.ts:187:    expect(store.savedCandidateData?.id).toBe('cand-1');
apps/frontend/src/lib/contexts/contestant/contestantUserDataState.svelte.test.ts:246:      expect(store.savedCandidateData?.answers?.q1).toEqual({ value: 3 });
apps/frontend/src/lib/contexts/contestant/contestantUserDataState.svelte.ts:11:  LocalizedCandidateData,
apps/frontend/src/lib/contexts/contestant/contestantUserDataState.svelte.ts:23: * The public methods are ARROW-FUNCTION FIELDS so they survive being held as `userData.X` on the candidate context and called detached. The  …
apps/frontend/src/lib/contexts/contestant/contestantUserDataState.svelte.ts:95:  #updateCandidateData(data: LocalizedCandidateData): void {
apps/frontend/src/lib/contexts/contestant/contestantUserDataState.svelte.ts:106:  #mergeCandidateAnswers(answers: LocalizedAnswers): void {
apps/frontend/src/lib/contexts/contestant/contestantUserDataState.svelte.ts:111:      // `LocalizedCandidateData.answers` resolves to `Answers & LocalizedAnswers` (the CandidateData/EntityData base intersected with the L …
apps/frontend/src/lib/contexts/contestant/contestantUserDataState.svelte.ts:112:    } as LocalizedCandidateData['answers'];
apps/frontend/src/lib/contexts/contestant/contestantUserDataState.svelte.ts:113:    this.#updateCandidateData({
apps/frontend/src/lib/contexts/contestant/contestantUserDataState.svelte.ts:123:  #savedCandidateData = $derived(this.#savedData?.candidate);
apps/frontend/src/lib/contexts/contestant/contestantUserDataState.svelte.ts:130:  #unsavedProperties = $derived<Array<keyof LocalizedCandidateData>>(this.#editedImage ? ['image'] : []);
apps/frontend/src/lib/contexts/contestant/contestantUserDataState.svelte.ts:142:  get savedCandidateData(): LocalizedCandidateData | undefined {
apps/frontend/src/lib/contexts/contestant/contestantUserDataState.svelte.ts:143:    return this.#savedCandidateData;
apps/frontend/src/lib/contexts/contestant/contestantUserDataState.svelte.ts:150:  get unsavedProperties(): Array<keyof LocalizedCandidateData> {
apps/frontend/src/lib/contexts/contestant/contestantUserDataState.svelte.ts:198:  reloadCandidateData = async (): Promise<LocalizedCandidateData> => {
apps/frontend/src/lib/contexts/contestant/contestantUserDataState.svelte.ts:205:    this.#updateCandidateData(userData.candidate);
apps/frontend/src/lib/contexts/contestant/contestantUserDataState.svelte.ts:224:    // The answer setters return only the updated `LocalizedAnswers` map, while the property setter returns only the saved image, typed as a …
apps/frontend/src/lib/contexts/contestant/contestantUserDataState.svelte.ts:227:    let updatedCandidate: LocalizedCandidateData | undefined;
apps/frontend/src/lib/contexts/contestant/contestantUserDataState.svelte.ts:241:      this.#mergeCandidateAnswers(updatedAnswers);
apps/frontend/src/lib/contexts/contestant/contestantUserDataState.svelte.ts:251:      this.#updateCandidateData({ ...this.#savedData.candidate, ...updatedCandidate });
apps/frontend/src/lib/contexts/contestant/contestantUserDataState.type.ts:4:import type { ContestantUserData, LocalizedCandidateData } from '$lib/api/base/dataWriter.type';
apps/frontend/src/lib/contexts/contestant/contestantUserDataState.type.ts:36:   * @returns A `Promise` resolving to `LocalizedCandidateData`.
apps/frontend/src/lib/contexts/contestant/contestantUserDataState.type.ts:39:  reloadCandidateData: () => Promise<LocalizedCandidateData>;
apps/frontend/src/lib/contexts/contestant/contestantUserDataState.type.ts:90:  readonly unsavedProperties: Array<keyof LocalizedCandidateData>;
apps/frontend/src/lib/contexts/contestant/contestantUserDataState.type.ts:96:   * The saved `LocalizedCandidateData`.
apps/frontend/src/lib/contexts/contestant/contestantUserDataState.type.ts:98:  readonly savedCandidateData: LocalizedCandidateData | undefined;
apps/frontend/src/routes/contestant/(protected)/preview/+page.svelte:16:  import { translateLocalizedCandidate } from '$lib/api/utils/translateLocalizedCandidate';
apps/frontend/src/routes/contestant/(protected)/preview/+page.svelte:54:    const result = await userData.reloadCandidateData().catch((e) => {
apps/frontend/src/routes/contestant/(protected)/preview/+page.svelte:55:      log.error(`Error with reloadCandidateData: ${e?.message}`);
apps/frontend/src/routes/contestant/(protected)/preview/+page.svelte:65:      dataRoot.provideEntityData([translateLocalizedCandidate(result, locale)]);
apps/frontend/src/routes/contestant/(protected)/questions/+page.svelte:58:    const localizedAnswer = userData.savedCandidateData?.answers?.[question.id];
```

### G-3 — the reader method

```bash
git grep -l -F "getContestantUserData" -- apps tests packages
```

Exit status 0, 9 line(s).

```text
apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.test.ts
apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts
apps/frontend/src/lib/api/adapters/supabase/supabaseAdapter.concurrency.test.ts
apps/frontend/src/lib/api/base/dataWriter.type.ts
apps/frontend/src/lib/api/base/universalDataWriter.ts
apps/frontend/src/lib/contexts/contestant/contestantUserDataState.svelte.test.ts
apps/frontend/src/lib/contexts/contestant/contestantUserDataState.svelte.ts
apps/frontend/src/routes/contestant/(protected)/+layout.server.ts
apps/frontend/src/routes/contestant/(protected)/layout.server.test.ts
```

### G-4a — the table chosen per type

```bash
git grep -n -F "scopedFrom('candidates')" -- apps/frontend/src
```

Exit status 0, 2 line(s).

```text
apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts:393:        ? await this.scopedFrom('candidates').select(columns).eq('id', id).single()
apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts:394:        : await this.scopedFrom('candidates').update(updateFields).eq('id', id).select(columns).single();
```

### G-4b — the nominations key per type

```bash
git grep -n -F ".eq('candidate_id'" -- apps/frontend/src/lib/api/adapters/supabase/dataWriter
```

Exit status 0, 1 line(s).

```text
apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts:265:        .eq('candidate_id', entityRow.id);
```

### G-5 — hard-coded type stamps on the path

```bash
git grep -n -F "ENTITY_TYPE.Candidate" -- apps/frontend/src/lib/api/adapters/supabase/dataWriter apps/frontend/src/lib/contexts/contestant ':!*.test.ts'
```

Exit status 0, 5 line(s).

```text
apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts:247:      type: ENTITY_TYPE.Candidate,
apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts:271:        entityType: ENTITY_TYPE.Candidate,
apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts:320:    if (type !== ENTITY_TYPE.Candidate) throw new Error(`Unsupported entity type for setting answers: ${type}`);
apps/frontend/src/lib/contexts/contestant/contestantContext.svelte.ts:280:      const entityType = ENTITY_TYPE.Candidate;
apps/frontend/src/lib/contexts/contestant/contestantUserDataState.svelte.ts:217:        type: ENTITY_TYPE.Candidate,
```

### G-6 — the storage path and the parse-report column labels

```bash
git grep -n -E "/candidates/|'candidates\.(answers|image)'" -- apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts
```

Exit status 0, 6 line(s).

```text
apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts:31: * `file.name` is fully controlled by the uploading candidate. Its suffix, `file.name.split('.').pop()`, cannot yield a `..` segment, becaus …
apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts:251:        answersOf(parseAnswersColumn(entityRow.answers, { column: 'candidates.answers', id: entityRow.id })) ?? {},
apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts:254:          column: 'candidates.image',
apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts:298:   * ONE helper for BOTH upload sites, `_setAnswers` and `_updateEntityProperties`, so the path sanitizing cannot drift between them. The e …
apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts:307:    const storagePath = `${projectId}/candidates/${id}/${crypto.randomUUID()}.${ext}`;
apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts:398:      image: imageOf(parseImageColumn(data.image, constants.PUBLIC_SUPABASE_URL, { column: 'candidates.image', id }))
```

### G-7 — the entry gate

```bash
git grep -n -F "CANDIDATE_GRANTS" -- apps tests packages
```

Exit status 0, 29 line(s).

```text
apps/docs/src/routes/(content)/developers-guide/contestant-app/login-and-password-reset/+page.md:11:3. It checks the grants in the access token against `CANDIDATE_GRANTS`, which admits only an `editor` grant on a `candid …
apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts:5:import { ADMIN_GRANTS, CANDIDATE_GRANTS, hasAnyGrant, readGrants } from '$lib/auth/roles';
apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts:187:    if (hasAnyGrant(grants, CANDIDATE_GRANTS)) {
apps/frontend/src/lib/auth/passwordLogin.test.ts:4:import { ADMIN_GRANTS, CANDIDATE_GRANTS, hasAnyGrant, readGrants } from './roles';
apps/frontend/src/lib/auth/passwordLogin.test.ts:96:    const outcome = await login(context, CANDIDATE_GRANTS);
apps/frontend/src/lib/auth/passwordLogin.test.ts:105:    expect(await login(context, CANDIDATE_GRANTS)).toEqual({ ok: false, status: 500, reason: 'noSession' });
apps/frontend/src/lib/auth/passwordLogin.test.ts:111:    expect(await login(context, CANDIDATE_GRANTS)).toEqual({ ok: false, status: 500, reason: 'noSession' });
apps/frontend/src/lib/auth/passwordLogin.test.ts:118:    expect(await login(context, CANDIDATE_GRANTS)).toEqual({ ok: true, session, user: { id: 'user-1' } });
apps/frontend/src/lib/auth/passwordLogin.test.ts:144:    expect(await login(context, CANDIDATE_GRANTS)).toEqual({ ok: false, status: 403, reason: 'grantNotAllowed' });
apps/frontend/src/lib/auth/passwordLogin.test.ts:165:    expect(await login(context, CANDIDATE_GRANTS)).toEqual({ ok: false, status: 403, reason: 'grantNotAllowed' });
apps/frontend/src/lib/auth/passwordLogin.test.ts:172:    expect(await login(context, CANDIDATE_GRANTS)).toEqual({ ok: false, status: 403, reason: 'grantNotAllowed' });
apps/frontend/src/lib/auth/passwordLogin.test.ts:191:    expect(await login(contextWith({ session: retired }).context, CANDIDATE_GRANTS)).toEqual({
apps/frontend/src/lib/auth/passwordLogin.test.ts:201:    await login(context, CANDIDATE_GRANTS);
apps/frontend/src/lib/auth/passwordLogin.test.ts:269:    expect(hasAnyGrant([ENTITY_EDITOR], CANDIDATE_GRANTS)).toBe(true);
apps/frontend/src/lib/auth/passwordLogin.test.ts:275:    expect(hasAnyGrant([ENTITY_ADMIN], CANDIDATE_GRANTS)).toBe(false);
apps/frontend/src/lib/auth/passwordLogin.test.ts:280:      expect(hasAnyGrant([{ ...ENTITY_EDITOR, target_type }], CANDIDATE_GRANTS)).toBe(false);
apps/frontend/src/lib/auth/passwordLogin.test.ts:282:    expect(hasAnyGrant([ENTITY_EDITOR], CANDIDATE_GRANTS)).toBe(true);
apps/frontend/src/lib/auth/passwordLogin.test.ts:297:    expect([...CANDIDATE_GRANTS]).toEqual([{ scope: 'entity', role: 'editor', target_type: 'candidate' }]);
apps/frontend/src/lib/auth/roles.ts:58:export const CANDIDATE_GRANTS = [
apps/frontend/src/lib/server/admin/requireAdminIdentity.test.ts:3:import { ADMIN_GRANTS, CANDIDATE_GRANTS } from '$lib/auth/roles';
apps/frontend/src/lib/server/admin/requireAdminIdentity.test.ts:19: * The token claims below are built from `ADMIN_GRANTS` and `CANDIDATE_GRANTS` in `$lib/auth/roles`, the single declaration of those grant shapes, rather …
apps/frontend/src/lib/server/admin/requireAdminIdentity.test.ts:192:      locals: verifiedLocals({ grants: [CANDIDATE_GRANTS[0]] })
apps/frontend/src/lib/server/admin/requireAdminIdentity.test.ts:262:      locals: verifiedLocals({ grants: [CANDIDATE_GRANTS[0]], userId: 'cand-1' })
apps/frontend/src/lib/server/admin/requireAdminIdentity.test.ts:283:      locals: verifiedLocals({ grants: [CANDIDATE_GRANTS[0]] })
apps/frontend/src/lib/server/admin/requireAdminIdentity.test.ts:314:      locals: verifiedLocals({ grants: [CANDIDATE_GRANTS[0]] })
apps/frontend/src/lib/server/admin/requireAdminIdentity.test.ts:366:    const { result, fetch } = await post(actions.default, verifiedLocals({ grants: [CANDIDATE_GRANTS[0]] }), {
apps/frontend/src/lib/server/admin/requireAdminIdentity.test.ts:379:    const { result, fetch } = await post(actions.default, verifiedLocals({ grants: [CANDIDATE_GRANTS[0]] }), {
apps/frontend/src/routes/contestant/login/+page.server.ts:8:import { CANDIDATE_GRANTS, passwordLogin } from '$lib/auth';
apps/frontend/src/routes/contestant/login/+page.server.ts:20:      allowedGrants: CANDIDATE_GRANTS,
```

### G-8a — the coarse role literal, as a type

```bash
git grep -n -F "'candidate' | 'admin'" -- apps/frontend/src
```

Exit status 0, 3 line(s).

```text
apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts:186:    let role: 'candidate' | 'admin' | null = null;
apps/frontend/src/lib/api/base/dataWriter.type.ts:255:export type UserRole = 'candidate' | 'admin';
apps/frontend/src/lib/server/admin/requireAdminIdentity.ts:30: * The shapes that open the admin door are declared once, as `ADMIN_GRANTS` in `$lib/auth/roles.ts`, and the normalisation from those shapes to the coarse `'c …
```

### G-8b — the coarse role literal, compared

```bash
git grep -n -P "role (=|===|!==) 'candidate'" -- apps/frontend/src
```

Exit status 0, 2 line(s).

```text
apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts:188:      role = 'candidate';
apps/frontend/src/routes/contestant/(protected)/+layout.server.ts:96:    if (role !== 'candidate') return await handleError('userNotAuthorized');
```

### G-9 — the one reader of user on the entity data

```bash
git grep -n -P "(current|savedData|userData|ud)\??\.user\b" -- apps/frontend/src ':!*.test.ts'
```

Exit status 0, 1 line(s).

```text
apps/frontend/src/routes/contestant/(protected)/settings/+page.svelte:85:      value={userData.current?.user.email}
```

### P-1 — the deleted function's name

```bash
git grep -n -e get_candidate_user_data -- ':!.planning'
```

Exit status 0, 54 line(s).

```text
.claude/skills/database/SKILL.md:262:   - `get_candidate_user_data(p_project_id, p_entity_type)` is SECURITY INVOKER (plpgsql) and resolves
.claude/skills/database/SKILL.md:571:Auth Patterns gains § 9 ("Which entity am I": `get_candidate_user_data` through
.claude/skills/database/schema-reference.md:304:| get_candidate_user_data(uuid, entity_type)                                   | 503  | SECURITY INVOKER | The caller's own entity row in the given project, resolved from t …
apps/docs/src/routes/(content)/developers-guide/backend/authentication/+page.md:73:- `public.get_candidate_user_data(p_project_id, p_entity_type)` returns the caller's own entity row in one project. It finds the entity t …
apps/docs/src/routes/(content)/developers-guide/backend/authentication/+page.md:77:The Contestant App loads its candidate through the Supabase data writer, which calls `get_candidate_user_data` with the deployment's `PUB …
apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.test.ts:785:    it('calls get_candidate_user_data RPC and returns structured data', async () => {
apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.test.ts:813:      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_candidate_user_data', {
apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.test.ts:1032:     * The row `get_candidate_user_data` answers with, in the project this adapter is configured for unless a test says otherwise.
apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts:228:      .rpc('get_candidate_user_data', { p_project_id: this.projectId, p_entity_type: 'candidate' })
apps/supabase/supabase/migrations/00001_initial_schema.sql:1754:-- A candidate has at most one editor, because a candidate-scope user is the candidate. Organizations admit several editors, and an `admin`-role entity gran …
apps/supabase/supabase/migrations/00001_initial_schema.sql:2539:-- Returns the target ids of the caller's own `(entity, <type>, <id>, editor)` rows in public.grants whose entity lies in p_project_id. get_candidate_user_d …
apps/supabase/supabase/migrations/00001_initial_schema.sql:5998:-- - get_candidate_user_data() - the caller's own entity row of one type in one project, resolved from their editor grant
apps/supabase/supabase/migrations/00001_initial_schema.sql:6159:-- get_candidate_user_data: the caller's own entity of one type, in ONE project
apps/supabase/supabase/migrations/00001_initial_schema.sql:6169:CREATE OR REPLACE FUNCTION public.get_candidate_user_data (
apps/supabase/supabase/migrations/00001_initial_schema.sql:6221:EXECUTE ON FUNCTION public.get_candidate_user_data (uuid, public.entity_type) TO authenticated;
apps/supabase/supabase/schema/300-auth-tables.sql:33:-- A candidate has at most one editor, because a candidate-scope user is the candidate. Organizations admit several editors, and an `admin`-role entity grant is outsid …
apps/supabase/supabase/schema/301-auth-functions.sql:700:-- Returns the target ids of the caller's own `(entity, <type>, <id>, editor)` rows in public.grants whose entity lies in p_project_id. get_candidate_user_data cal …
apps/supabase/supabase/schema/503-entity-rpcs.sql:6:-- - get_candidate_user_data() - the caller's own entity row of one type in one project, resolved from their editor grant
apps/supabase/supabase/schema/503-entity-rpcs.sql:167:-- get_candidate_user_data: the caller's own entity of one type, in ONE project
apps/supabase/supabase/schema/503-entity-rpcs.sql:177:CREATE OR REPLACE FUNCTION public.get_candidate_user_data (
apps/supabase/supabase/schema/503-entity-rpcs.sql:229:EXECUTE ON FUNCTION public.get_candidate_user_data (uuid, public.entity_type) TO authenticated;
apps/supabase/supabase/tests/database/21-entity-organization.test.sql:242:        AND p.proname = 'get_candidate_user_data'
apps/supabase/supabase/tests/database/21-entity-organization.test.sql:245:    'get_candidate_user_data declares 13 output columns'
apps/supabase/supabase/tests/database/21-entity-organization.test.sql:258:        AND p.proname = 'get_candidate_user_data'
apps/supabase/supabase/tests/database/21-entity-organization.test.sql:260:    'get_candidate_user_data returns no organization output column'
apps/supabase/supabase/tests/database/21-entity-organization.test.sql:382:-- Section 8: get_candidate_user_data answers for ONE project, named by the caller
apps/supabase/supabase/tests/database/21-entity-organization.test.sql:425:        get_candidate_user_data (test_id ('project_a'))
apps/supabase/supabase/tests/database/21-entity-organization.test.sql:437:        get_candidate_user_data (test_id ('project_b'))
apps/supabase/supabase/tests/database/21-entity-organization.test.sql:445:    $$SELECT count(*) FROM get_candidate_user_data('candidate'::public.entity_type)$$,
apps/supabase/supabase/tests/database/21-entity-organization.test.sql:448:    'get_candidate_user_data without a project raises undefined_function, so p_project_id carries no DEFAULT'
apps/supabase/supabase/tests/database/36-entity-identity.test.sql:3:-- `get_candidate_user_data` answers "which entity am I" from the caller's own `(entity, <type>, <id>, editor)` rows in `public.grants`, in the one proj …
apps/supabase/supabase/tests/database/36-entity-identity.test.sql:282:        public.get_candidate_user_data (test_id ('project_a'))
apps/supabase/supabase/tests/database/36-entity-identity.test.sql:294:        public.get_candidate_user_data (test_id ('project_b'))
apps/supabase/supabase/tests/database/36-entity-identity.test.sql:316:        public.get_candidate_user_data (test_id ('project_a'))
apps/supabase/supabase/tests/database/36-entity-identity.test.sql:338:        public.get_candidate_user_data (test_id ('project_a'))
apps/supabase/supabase/tests/database/36-entity-identity.test.sql:360:        public.get_candidate_user_data (test_id ('project_a'), 'organization')
apps/supabase/supabase/tests/database/36-entity-identity.test.sql:378:        public.get_candidate_user_data (test_id ('project_a'))
apps/supabase/supabase/tests/database/36-entity-identity.test.sql:397:      $$SELECT * FROM public.get_candidate_user_data(%L, 'organization')$$,
apps/supabase/supabase/tests/database/36-entity-identity.test.sql:436:      $$SELECT * FROM public.get_candidate_user_data(%L)$$,
apps/supabase/supabase/tests/database/36-entity-identity.test.sql:448:        $$SELECT * FROM public.get_candidate_user_data(%L)$$,
apps/supabase/supabase/tests/database/36-entity-identity.test.sql:508:          AND p.proname = 'get_candidate_user_data'
apps/supabase/supabase/tests/database/36-entity-identity.test.sql:512:    'get_candidate_user_data runs with the caller''s rights'
packages/supabase-types/RPC-NULLABILITY.md:27:- `get_candidate_user_data.first_name` — the source column `candidates.first_name` is `NOT NULL`, the
packages/supabase-types/RPC-NULLABILITY.md:78:apps/supabase/supabase/schema/503-entity-rpcs.sql:177  get_candidate_user_data  (RETURNS TABLE at :180, 13 columns)
packages/supabase-types/RPC-NULLABILITY.md:185:## 3. `get_candidate_user_data` — 13 columns, 4 overridden, 9 no-change
packages/supabase-types/src/database.overrides.ts:45: * Columns absent from a member are non-null by evidence, not by omission. On `get_nominations` those are the primary key, the two scope keys, the entity discriminator …
packages/supabase-types/src/database.overrides.ts:67:  get_candidate_user_data: WithReturns<
packages/supabase-types/src/database.overrides.ts:68:    'get_candidate_user_data',
packages/supabase-types/src/database.overrides.ts:69:    Nullable<'get_candidate_user_data', 'first_name' | 'last_name' | 'subtype' | 'sort_order'>
packages/supabase-types/src/database.ts:1131:      get_candidate_user_data: {
scripts/assert-no-candidate-app-names.mjs:55:  /get_candidate_user_data/g, // the user-data RPC — see phase 173
scripts/assert-project-scoped-queries.mjs:227:  get_candidate_user_data: 'requires p_project_id',
scripts/fixtures/assert-no-candidate-app-names.input.ts:94:const e02 = rpc('get_candidate_user_data') && data.candidateUserData;
scripts/fixtures/assert-no-candidate-app-names.input.ts:107:const n10 = rpc('get_candidate_user_data');
```

### P-2 — the function's error hint

```bash
git grep -n -F "ERR_ENTITY_IDENTITY_AMBIGUOUS" -- ':!.planning'
```

Exit status 0, 9 line(s).

```text
.claude/skills/database/SKILL.md:271:   - More than one match raises SQLSTATE `P0001` with HINT `ERR_ENTITY_IDENTITY_AMBIGUOUS` rather than
.claude/skills/database/SKILL.md:572:`private.caller_entity_ids`, editor role only, per project, `ERR_ENTITY_IDENTITY_AMBIGUOUS`,
.claude/skills/database/schema-reference.md:304:| get_candidate_user_data(uuid, entity_type)                                   | 503  | SECURITY INVOKER | The caller's own entity row in the given project, resolved from t …
apps/docs/src/routes/(content)/developers-guide/backend/authentication/+page.md:74:- If the caller holds editor grants on more than one entity of the type in the project, the function raises an error with the hint `ERR_E …
apps/supabase/supabase/migrations/00001_initial_schema.sql:6195:      USING ERRCODE = 'P0001', HINT = 'ERR_ENTITY_IDENTITY_AMBIGUOUS';
apps/supabase/supabase/schema/503-entity-rpcs.sql:203:      USING ERRCODE = 'P0001', HINT = 'ERR_ENTITY_IDENTITY_AMBIGUOUS';
apps/supabase/supabase/tests/database/36-entity-identity.test.sql:3:-- `get_candidate_user_data` answers "which entity am I" from the caller's own `(entity, <type>, <id>, editor)` rows in `public.grants`, in the one proj …
apps/supabase/supabase/tests/database/36-entity-identity.test.sql:452:    'ERR_ENTITY_IDENTITY_AMBIGUOUS',
apps/supabase/supabase/tests/database/36-entity-identity.test.sql:453:    'the ambiguity error carries the hint ERR_ENTITY_IDENTITY_AMBIGUOUS'
```

### P-3 — the retired login-error code

```bash
git grep -n -F "userNoCandidate" -- ':!.planning'
```

Exit status 0, 13 line(s).

```text
apps/docs/src/routes/(content)/developers-guide/contestant-app/login-and-password-reset/+page.md:14:The pages under `/contestant` that need a candidate live in the `(protected)` route group. Its server loader redirects t …
apps/frontend/messages/da/contestantApp.error.json:6:    "userNoCandidate": "Den indloggede bruger er ikke knyttet til nogen kandidatoplysninger. Kontakt venligst support.",
apps/frontend/messages/en/contestantApp.error.json:6:    "userNoCandidate": "The logged in user has no candidate info tied to it. Please contact support.",
apps/frontend/messages/et/contestantApp.error.json:6:    "userNoCandidate": "Sisselogitud kasutajaga ei ole seotud kandidaadi andmeid. Palun võtke ühendust toega.",
apps/frontend/messages/fi/contestantApp.error.json:6:    "userNoCandidate": "Sisäänkirjautuneeseen käyttäjään ei ole yhdistetty ehdokastietoja. Ota yhteyttä tukeen.",
apps/frontend/messages/fr/contestantApp.error.json:6:    "userNoCandidate": "L’utilisateur connecté n’a pas d’informations de candidat·e associées. Veuillez contacter l’assistance.",
apps/frontend/messages/lb/contestantApp.error.json:6:    "userNoCandidate": "De ageloggte Benotzer huet keng Kandidatinformatioun verknëppt. Kontaktéiert wgl. de Support.",
apps/frontend/messages/sv/contestantApp.error.json:6:    "userNoCandidate": "Den inloggade användaren har ingen kandidatinformation kopplad till sig. Kontakta supporten.",
apps/frontend/src/lib/contestant/utils/loginError.ts:15:  userNoCandidate: 'contestantApp.error.userNoCandidate',
apps/frontend/src/lib/contestant/utils/loginError.ts:23:  'candidateNoNomination' | 'loginFailed' | 'nominationNoElection' | 'userNoCandidate' | 'userNotAuthorized';
apps/frontend/src/lib/types/generated/translationKey.ts:284:  | 'contestantApp.error.userNoCandidate'
apps/frontend/src/routes/contestant/(protected)/+layout.server.ts:97:    if (!candidate) return await handleError('userNoCandidate');
scripts/fixtures/assert-no-candidate-app-names.input.ts:118:const n21 = 'userNoCandidate' ?? 'candidateNoNomination';
```

### P-4 — the role-based sign-out code

```bash
git grep -n -F "userNotAuthorized" -- apps/frontend/src
```

Exit status 0, 6 line(s).

```text
apps/frontend/src/lib/admin/utils/loginError.ts:13:  userNotAuthorized: 'error.403'
apps/frontend/src/lib/admin/utils/loginError.ts:19:export type LoginError = 'loginFailed' | 'userNotAuthorized';
apps/frontend/src/lib/contestant/utils/loginError.ts:16:  userNotAuthorized: 'error.403'
apps/frontend/src/lib/contestant/utils/loginError.ts:23:  'candidateNoNomination' | 'loginFailed' | 'nominationNoElection' | 'userNoCandidate' | 'userNotAuthorized';
apps/frontend/src/routes/admin/(protected)/+layout.ts:34:  if (userData.role !== 'admin') return await handleError('userNotAuthorized');
apps/frontend/src/routes/contestant/(protected)/+layout.server.ts:96:    if (role !== 'candidate') return await handleError('userNotAuthorized');
```

### P-5 — the fixed draft key

```bash
git grep -n -F "ContestantContext-contestantUserDataStore-editedAnswers" -- ':!.planning'
```

Exit status 0, 1 line(s).

```text
apps/frontend/src/lib/contexts/contestant/contestantUserDataState.svelte.ts:42:    'ContestantContext-contestantUserDataStore-editedAnswers',
```

### P-6 — base-dataset external ids named by the specs

```bash
git grep -h -o -E "test-e2e-base-(ca|or)[a-z0-9-]*" -- tests/tests | sort | uniq -c
```

Exit status 0, 3 line(s).

```text
   1 test-e2e-base-ca-aa-1
   2 test-e2e-base-ca-aa-hidden
   4 test-e2e-base-ca-aa-unregistered
```

### P-7 — assertions on the app's shown name

```bash
git grep -n -i -E "Candidate app|Party app|Candidate and party app|contestantAppName" -- tests packages/dev-seed/tests
```

Exit status 0, 2 line(s).

```text
tests/tests/specs/contestant/contestant-journey.spec.ts:84:).dynamic.contestantAppName.candidate;
tests/tests/specs/perm/perm-closed-project.spec.ts:47:  DYNAMIC_MESSAGES.contestantAppName;
```

### P-8 — the last pgTAP files

```bash
ls apps/supabase/supabase/tests/database/ | sort | tail -4
```

Exit status 0, 4 line(s).

```text
35-feedback-rate-limit-key.test.sql
36-entity-identity.test.sql
37-terms-of-use-acceptances.test.sql
38-contestant-app-public-config.test.sql
```

### P-9 — files under the protected group

```bash
find "apps/frontend/src/routes/contestant/(protected)" -type f | sort
```

Exit status 0, 13 line(s).

```text
apps/frontend/src/routes/contestant/(protected)/+layout.server.ts
apps/frontend/src/routes/contestant/(protected)/+layout.svelte
apps/frontend/src/routes/contestant/(protected)/+page.svelte
apps/frontend/src/routes/contestant/(protected)/contestantHome.helpers.test.ts
apps/frontend/src/routes/contestant/(protected)/contestantHome.helpers.ts
apps/frontend/src/routes/contestant/(protected)/layout.server.test.ts
apps/frontend/src/routes/contestant/(protected)/preview/+page.svelte
apps/frontend/src/routes/contestant/(protected)/profile/+page.svelte
apps/frontend/src/routes/contestant/(protected)/questions/[questionId]/+page.svelte
apps/frontend/src/routes/contestant/(protected)/questions/+layout.svelte
apps/frontend/src/routes/contestant/(protected)/questions/+page.svelte
apps/frontend/src/routes/contestant/(protected)/settings/+page.svelte
apps/frontend/src/routes/contestant/(protected)/termsOfUseLayout.svelte.test.ts
```

## Baseline

base_rev: 9f888dfcdaf588bc897740b102de40b3cfa86152

The tree both baseline instruments describe: `git rev-parse HEAD` at the start of each run, recorded in the run's `head` file. It differs from `tree_read` only under `.planning/` (this file and the three drivers).

**Gate set — `tests/e2e-runs/173-gates/173-01-baseline`, exit 0, twelve rows, every status 0.** Window 11:39:38 to 11:43:09 local on AC power; no Sleep entry inside it. `node …/173-verdict.mjs gates 173-01-baseline` exits 0.

| Row | Status | Seconds |
|---|---|---|
| typecheck | 0 | 19 |
| lint | 0 | 45 |
| types-regen | 0 | 31 |
| types-clean | 0 | 0 |
| sql-lint | 0 | 3 |
| pgtap | 0 | 5 |
| unit | 0 | 64 |
| check-frontend | 0 | 8 |
| build | 0 | 17 |
| format | 0 | 18 |
| docs-links | 0 | 1 |
| name-gate-self-test | 0 | 0 |

Counts read from the row logs, for later comparison: pgTAP `Files=38, Tests=1385`; linter census `policies examined: 104, tables partitioned: 20`, `0 error(s), 3 warning(s)`; svelte-check 2655 files, 0 errors, 0 warnings; docs links 0 findings; the name gate's self-test 82 findings on the fixture, 82 expected; unit tests per workspace (tests in files): supabase 206 in 15; core 8 in 3; matching 43 in 5; data 244 in 47; filters 22 in 1; app-shared 141 in 10; llm 49 in 2; question-info 22 in 2; argument-condensation 31 in 6; dev-seed 996 in 67; frontend 2170 in 137.

**E2E — `tests/e2e-runs/173-e2e/173-01-baseline-r2`, the full default suite, wrapper status 0.**

baseline_e2e_counts: total 180, passed 180, failed 0, flaky 0, skipped 0, didNotRun 0 — 100 projects, 5.6 min, no retry, one preflight success, no preflight failure

Window 12:38:21 to 12:44:09 local on battery power, started under `caffeinate -dimsu`; no Sleep entry inside it (the run's `power.txt` and a second read of `pmset -g log`). `node …/173-verdict.mjs e2e 173-01-baseline` resolves to this attempt and exits 0.

**The first attempt, `tests/e2e-runs/173-e2e/173-01-baseline`, is VOID and kept:** total 180, passed 87, failed 1, did not run 92, window 11:43:24 to 11:51:55 local. The host's lid closed at 11:46:03, its display link dropped at 11:46:14, and it slept at 11:46:44 and again from 11:46:59 to 11:51:55. The one failure (`perm-1e1cg1co`, 11:46:14 to 11:46:30) lost its Vite socket in the second of the display event. The power-log lines and the trace reading are in `tests/e2e-runs/173-e2e/173-01-baseline.void-diagnosis.txt`. No fix separates the two attempts; the tree is the same.

Per-project totals of the baseline (`byProject` of `summary.json`, name then total):

```text
a11y-smoke 16
admin-access 1
auth-setup 2
cold-entry-dataroot 3
cold-entry-dataroot-contestant 1
contestant-a11y-scan 16
contestant-journey 1
data-setup-admin-auth 1
data-setup-base 1
data-setup-contestant-journey 1
data-setup-perm-1e1cg1co 1
data-setup-perm-2e-asymmetric 1
data-setup-perm-2e-shared 1
data-setup-perm-access-disable 1
data-setup-perm-analytics-tracking 1
data-setup-perm-answers-locked 1
data-setup-perm-closed-project 1
data-setup-perm-disable-allow-open 1
data-setup-perm-disable-election-1co 1
data-setup-perm-disable-election-2co 1
data-setup-perm-disjoint-1co 1
data-setup-perm-header-show-help 1
data-setup-perm-hide-all-nominations 1
data-setup-perm-hide-category-tags 1
data-setup-perm-hide-election-tags 1
data-setup-perm-hide-hero 1
data-setup-perm-hide-if-missing-answers 1
data-setup-perm-interactive-info 1
data-setup-perm-localisation-positive 1
data-setup-perm-missing-nominations 1
data-setup-perm-not-located-2e2cg 1
data-setup-perm-org-matching 1
data-setup-perm-per-app-notifications 1
data-setup-perm-question-video 1
data-setup-perm-show-feedback-survey 1
data-setup-perm-startfromcg 1
data-teardown-admin-access 1
data-teardown-base 1
data-teardown-contestant-journey 1
data-teardown-perm-1e1cg1co 1
data-teardown-perm-2e-asymmetric 1
data-teardown-perm-2e-shared 1
data-teardown-perm-access-disable 1
data-teardown-perm-analytics-tracking 1
data-teardown-perm-answers-locked 1
data-teardown-perm-closed-project 1
data-teardown-perm-disable-allow-open 1
data-teardown-perm-disable-election-1co 1
data-teardown-perm-disable-election-2co 1
data-teardown-perm-disjoint-1co 1
data-teardown-perm-header-show-help 1
data-teardown-perm-hide-all-nominations 1
data-teardown-perm-hide-category-tags 1
data-teardown-perm-hide-election-tags 1
data-teardown-perm-hide-hero 1
data-teardown-perm-hide-if-missing-answers 1
data-teardown-perm-interactive-info 1
data-teardown-perm-localisation-positive 1
data-teardown-perm-missing-nominations 1
data-teardown-perm-not-located-2e2cg 1
data-teardown-perm-org-matching 1
data-teardown-perm-per-app-notifications 1
data-teardown-perm-question-video 1
data-teardown-perm-show-feedback-survey 1
data-teardown-perm-startfromcg 1
eperm07-term-trigger 1
performance 1
perm-1e1cg1co 1
perm-2e-asymmetric 1
perm-2e-shared 2
perm-access-disable 3
perm-answers-locked 3
perm-closed-project 11
perm-disable-allow-open 3
perm-disable-election-1co 1
perm-disable-election-2co 1
perm-disjoint-1co 2
perm-header-show-help 1
perm-hide-all-nominations 1
perm-hide-category-tags 1
perm-hide-election-tags 1
perm-hide-hero 1
perm-hide-if-missing-answers 1
perm-interactive-info 4
perm-localisation-positive 2
perm-missing-nominations 1
perm-not-located-2e2cg 5
perm-org-matching 3
perm-per-app-notifications 2
perm-question-video 4
perm-show-feedback-survey 6
perm-startfromcg 2
storage-cleanup 3
voter-alliance 1
voter-dark-mode 1
voter-journey 2
voter-journey-mobile 1
voter-nominations 1
voter-prefs-tracking 3
voter-results-redraw 5
```

**The two starting verdicts, expected to fail on this tree.**

`node …/173-verdict.mjs greps` — exit 1:

```text
'get_candidate_user_data': 54 hit(s) in 17 file(s)
'ERR_ENTITY_IDENTITY_AMBIGUOUS': 9 hit(s) in 6 file(s)
'ContestantContext-contestantUserDataStore-editedAnswers': 1 hit(s) in 1 file(s)
'userNoCandidate': 13 hit(s) in 12 file(s)
173-verdict greps: FAIL (4)
FAIL 'get_candidate_user_data': 54 hit(s) on the committed tree
FAIL 'ERR_ENTITY_IDENTITY_AMBIGUOUS': 9 hit(s) on the committed tree
FAIL 'ContestantContext-contestantUserDataStore-editedAnswers': 1 hit(s) on the committed tree
FAIL 'userNoCandidate': 13 hit(s) on the committed tree
```

`node …/173-verdict.mjs exemptions` — exit 1 (three entries on the tree, not the two the plan expected; the verdict passes on exactly two, `invite-candidate` and the shown names):

```text
EXEMPT holds 3 entries:
  /get_candidate_user_data/g, // the user-data RPC — see phase 173
  /invite-candidate/g, // the invitation Edge Function — see phase 174
  /(?<=['"])(?:Candidate app|Party app|Candidate and party app)(?=['"])/g // the three shown names of the app, as whole quoted strings — see phase 171
173-verdict exemptions: FAIL (2)
FAIL EXEMPT holds 3 entries, expected exactly 2
FAIL EXEMPT still names 'get_candidate_user_data'
```

A subset probe, `tests/e2e-runs/173-gates/173-01-rows-probe` (`--rows name-gate-self-test,typecheck`, exit 0): judged as the full gate set it fails, judged with the same `--rows` it passes.

## Write refusals

**Written by:** plan 173-02, Task 3. Three write paths by three pairings, every pairing inside one project (project A of the pgTAP fixture). Paths: (a) a row `UPDATE` of an entity table, (b) `upsert_answers`, (c) an `INSERT` into the `public-assets` bucket under `<project>/<type plural>/<id>/…`. Pairings: (i) a candidate editor targeting an organization, (ii) a candidate editor targeting another candidate, (iii) an organization editor targeting a candidate. Each description is quoted as it stands in its file (a doubled `''` is the SQL spelling of one quote), so `git grep -n -F "<description>" -- <file>` finds it. Every one of the nine is refused on the applied database: pgTAP `Files=38, Tests=1447`, all passing.

| Cell | File | Assertion's description | Cited or added |
|---|---|---|---|
| (a)(i) | `apps/supabase/supabase/tests/database/18-entity-policies.test.sql` | `a candidate editor''s image write on an organization of its own project affects no row` | added |
| (a)(ii) | `apps/supabase/supabase/tests/database/18-entity-policies.test.sql` | `an entity grantee may not update another candidate in the same project` | cited |
| (a)(iii) | `apps/supabase/supabase/tests/database/18-entity-policies.test.sql` | `an organization editor''s image write on a candidate of its own project affects no row` | added |
| (b)(i) | `apps/supabase/supabase/tests/database/10-schema-migrations.test.sql` | `candidate_a cannot call upsert_answers for org_a, an organization of its own project` | added |
| (b)(ii) | `apps/supabase/supabase/tests/database/10-schema-migrations.test.sql` | `candidate_a cannot call upsert_answers for candidate_a2, another candidate of its own project` | added |
| (b)(iii) | `apps/supabase/supabase/tests/database/10-schema-migrations.test.sql` | `organization_a cannot call upsert_answers for candidate_a, a candidate of its own project` | added |
| (c)(i) | `apps/supabase/supabase/tests/database/20-storage-authority.test.sql` | `storage: a candidate grantee is DENIED a write into an organization folder -- because org_a is not this caller''s entity` | cited |
| (c)(ii) | `apps/supabase/supabase/tests/database/20-storage-authority.test.sql` | `storage: the same grantee is DENIED a write under another candidate folder in the same project` | cited |
| (c)(iii) | `apps/supabase/supabase/tests/database/20-storage-authority.test.sql` | `storage: an organization grantee is DENIED a write into a candidate folder of the same project -- because candidate_a is not this caller''s entity` | added |

Three cited, six added; the plan expected four and five.

- **(b)(ii) is added, not cited.** The assertion the plan cites, `candidate_a cannot call upsert_answers for candidate_b (throws error)`, is on the tree, but `candidate_b` is a candidate of project B: it proves the cross-project refusal, accepts any error (`throws_ok` with no SQLSTATE), and reads nothing back. The same-project cell is the added one, with SQLSTATE `P0001`, the exact message and the stored answers read back unchanged.
- **(a)(ii) is cited as written, and it writes `subtype`, not `image`.** The row policy decides per row, whatever column is set. The `image` form of the same cell is added beside the two new ones: `a candidate editor''s image write on another candidate of its own project affects no row`.
- **What stands beside each added refusal.** (a): `…raises nothing` for both cross-type cells, the value read back as `postgres` (`that organization''s image is unchanged after the candidate editor''s denied write`, `that candidate''s image is still its own editor''s write after the organization editor''s denied write`), and one allowed write per session as the control (`a candidate editor may write the image of its own candidate row`, `an organization editor may write the image of its own organization row`). (b): the stored answers read back as `postgres` after each refusal (`candidate_a2 answers are untouched…`, `org_a answers are untouched…`, `candidate_a answers are untouched…`, the last against a non-empty value). (c): `storage: an organization grantee still INSERTs under its own entity folder at the end of this file` as the control in the same session.
- **Every target row is one the caller can see** (the shared fixture's project-A entities are confirmed and nominated), so each refusal is the write policy's and not the read policy hiding the row.
- **Where the added assertions stand.** In `18` they are a new last section, `Section 11`, and in `20` new last items `46-47`, because both files number their assertions in their section headings and an insertion in the middle would make every later number wrong. In `10`, which carries no numbers, they stand beside the assertions they extend.

## After 173-02

**Written by:** plan 173-02, Task 5. Stage 1 (schema) is closed on tree `89acaff82` (the last commit outside `.planning/`).

label: `173-02-schema` (gate set and E2E run, both first attempts, both on AC power under `caffeinate -dimsu`)

**Gate set — `tests/e2e-runs/173-gates/173-02-schema`, exit 0, twelve rows, every status 0.** Window 13:18:26 to 13:21:55 local; `sleep_entries_in_window: 0`. `node …/173-verdict.mjs gates 173-02-schema` exits 0.

**E2E — `tests/e2e-runs/173-e2e/173-02-schema`, the full default suite, wrapper status 0.**

after_173_02_e2e_counts: total 180, passed 180, failed 0, flaky 0, skipped 0, didNotRun 0 — 100 projects, no retry, one preflight success, no preflight failure

Window 13:22:13 to 13:28:30 local; `sleep_entries_in_window: 0`. `node …/173-verdict.mjs e2e 173-02-schema --min-total-of 173-01-baseline` exits 0, and so does `… --same-projects-as 173-01-baseline` (every project's total equals the baseline's).

**pgTAP `plan (N)` of every file this plan changed** (`Files=38, Tests=1447`; 1385 at the baseline):

| File | Before | After |
|---|---|---|
| `10-schema-migrations.test.sql` | 83 | 89 |
| `18-entity-policies.test.sql` | 59 | 70 |
| `20-storage-authority.test.sql` | 45 | 47 |
| `21-entity-organization.test.sql` | 21 | 23 |
| `36-entity-identity.test.sql` | 20 | 61 |

`00-helpers.test.sql` and `07-rpc-security.test.sql` are unchanged. Other counts that moved: frontend unit tests 2185 in 138 files (2170 in 137); svelte-check 2657 files. Unchanged: 104 policies, 20 tables, the two definer censuses, 82 findings on the name gate's fixture.

**Names this plan put on the tree.**

| Role | Name |
|---|---|
| The list function | `public.get_user_entities (p_project_id uuid) RETURNS jsonb` — one object, key `entities`; entry keys `entity_type`, `id`, `short_name`, `image`, `color`, `confirmed`, plus `first_name` and `last_name` (candidate) or `name` (organization). No entry carries a key of the other type |
| The one-entity read | `public.get_entity_user_data (p_project_id uuid, p_entity_type public.entity_type, p_entity_id uuid)` — thirteen columns, the deleted function's list in the same order: `id, project_id, name, short_name, info, color, image, sort_order, subtype, custom_data, answers, first_name, last_name` |
| Its type override | `get_entity_user_data` in `database.overrides.ts`, nullable `first_name`, `last_name`, `subtype`, `sort_order` |
| The narrowing module | `F/lib/api/adapters/supabase/utils/userEntities.ts`: `UserEntitiesSchema`, `UserEntityEntry`, `parseUserEntities(raw)` (throws on a malformed answer). It is declared in `GUARDED_SOURCES` of `scripts/assert-project-scoped-queries.mjs`, as every adapter source must be |
| The adapter's interim reader | `_getContestantUserData`, unchanged in name, options and return shape: `rpc('get_user_entities', { p_project_id })`, `parseUserEntities`, the `candidate` entries, exactly one or it throws `getContestantUserData: expected exactly one candidate for this user in this project, found <n>.`, then `rpc('get_entity_user_data', …).maybeSingle()` |
| The writer tests' RPC stub | `mockEntityRpcs(client, { list?, row })` with `listedCandidate(id)` and `listedOrganization(id)`, module-level in `supabaseDataWriter.test.ts` |
| The name gate | `EXEMPT` holds exactly two entries; the `/candidate URL` lookbehind includes `contestant`; fixture line `n38` holds `/contestant/candidate/123/profile` |

**The two assumptions this plan measured.** A7: `yarn db:lint:sql` reports nothing for either `LANGUAGE sql` function (`{"results":[],"message":"db lint"}`, exit 0). A11: holds — `get_user_entities: { Args: { p_project_id: string }; Returns: Json }`.

**The `greps` verdict now:** the first two literals have no hit; `ContestantContext-contestantUserDataStore-editedAnswers` (1 hit) and `userNoCandidate` (13 hits) remain for 173-04 and 173-10.

## After 173-03

**Written by:** plan 173-03, Task 6. Stage 2, part 1 (writer, types and store) is closed on tree `43385c089` (the last commit outside `.planning/`).

label: `173-03-writer` — the gate set's judged attempt is `173-03-writer-r5` and the E2E run's is `173-03-writer-r4`; `173-verdict.mjs` resolves both from the plain label. Every attempt ran on AC power under `caffeinate -dimsu`, and none holds a Sleep entry in its window, so every red attempt below is red, not void.

**Gate set — `tests/e2e-runs/173-gates/173-03-writer-r5`, exit 0, twelve rows, every status 0.** Window 14:25:41 to 14:28:58 local; `sleep_entries_in_window: 0`. `node …/173-verdict.mjs gates 173-03-writer` exits 0.

**E2E — `tests/e2e-runs/173-e2e/173-03-writer-r4`, the full default suite, wrapper status 0.**

after_173_03_e2e_counts: total 180, passed 180, failed 0, flaky 0, skipped 0, didNotRun 0 — 100 projects, no retry, one preflight success, no preflight failure

Window 14:29:21 to 14:35:01 local; `sleep_entries_in_window: 0`. `node …/173-verdict.mjs e2e 173-03-writer --min-total-of 173-01-baseline` exits 0, and so does `… --same-projects-as 173-01-baseline`.

**The attempts before the judged ones, each kept.** Each red one was diagnosed from its log or trace and fixed at its cause; none was made again without a fix.

| Attempt | Tree | Result | Cause, and the commit that fixed it |
|---|---|---|---|
| gates `173-03-writer` | `9ed92ce58` | `lint` 1, eleven rows 0 | the comment hygiene guard refused a forced line break in the integration test's docblock — `c921d473e` |
| gates `173-03-writer-r2` | `c921d473e` | twelve rows 0 | — |
| E2E `173-03-writer` | `c921d473e` | 85 passed, 1 failed, 94 did not run | `contestant-journey` step 21: the preview reloaded without end (198 `get_entity_user_data` requests in the trace), because the store's reload read the saved data before its first await inside the page's effect — `b1ec2b99f` |
| gates `173-03-writer-r3` | `b1ec2b99f` | twelve rows 0 | — |
| E2E `173-03-writer-r2` | `b1ec2b99f` | 83 passed, 3 failed, 94 did not run | the preview showed its error on three tests (no `get_entity_user_data` request, `Cannot reload entity data before user data is loaded` in the trace): the layout loads the store in an effect that runs after the page's — `cafcdba51` |
| E2E `173-03-preview-probe` (`--project contestant-journey`) | `cafcdba51` | 5 of 5 | a slice, read as a slice |
| gates `173-03-writer-r4` | `cafcdba51` | twelve rows 0 | — |
| E2E `173-03-writer-r3` | `cafcdba51` | 124 passed, 1 failed, 55 did not run | `perm-answers-locked`: the profile's name fields were rendered only once a candidate was in the store, so the server-rendered page held no input — `43385c089` |
| E2E `173-03-profile-probe` (`--project perm-answers-locked`) | `43385c089` | 78 of 78 | a slice, read as a slice |

The traces of the three red E2E attempts are kept beside them in `173-03-writer-diagnosis/`, `173-03-writer-r2-diagnosis/` and `173-03-writer-r3-diagnosis/` under `tests/e2e-runs/173-e2e/`.

**The gated integration test — `tests/e2e-runs/173-gates/173-03-integration.json`, on tree `43385c089` (`173-03-integration.head`):** 7 passed, 0 failed, 0 pending. Earlier reports are kept as `173-03-integration-attempt1.json` to `-attempt6.json`: attempt 1 is the first draft (6 passed, 1 failed: the stored answers are validated against the project's questions, so the test now creates one question of its own), attempts 2 to 6 are 7 of 7 on earlier trees. It is run with the stack up as `SUPABASE_URL=… SUPABASE_ANON_KEY=… SUPABASE_SERVICE_ROLE_KEY=… CONTESTANT_WRITER_INTEGRATION_REQUIRED=1 yarn workspace @openvaa/frontend vitest run supabaseDataWriter.integration --reporter=default --reporter=json --outputFile.json=<path>`, the three values taken from `supabase status -o env` (`API_URL`, `ANON_KEY`, `SERVICE_ROLE_KEY`) into shell variables. Without the variables it exits 0 with 7 tests skipped, which is how the default unit run and the gate set's `unit` row see it.

**Counts that moved since `## After 173-02`.** Frontend unit tests 2204 passed and 7 skipped in 139 files (2185 in 138): the skipped file is the integration test. svelte-check 2658 files (2657). Unchanged: pgTAP 38 files and 1447 tests, 104 policies, 20 tables, 82 findings on the name gate's fixture, 180 E2E tests in 100 projects.

**Names this plan put on the tree.**

| Role | Name |
|---|---|
| The two readers | `getUserEntities(opts?)` and `getEntityUserData({ type, id, loadNominations, locale })` on `DataWriter`, `UniversalDataWriter` (`_getUserEntities`, `_getEntityUserData`) and `SupabaseDataWriter`. The one-entity read resolves `undefined` for no row and rejects for a failed read |
| Their types | `UserEntity`, `LocalizedOrganizationData`, `LocalizedEntityData`, `GetUserEntitiesOptions`, `GetEntityUserDataOptions` in `F/lib/api/base/dataWriter.type.ts` |
| The user data's entity member | `ContestantUserData.entity`, typed `LocalizedEntityData` |
| The map from type to table | `ENTITY_TABLES`, with `servedEntityType(type)` and `entityTableOf(type)` (both throw `Unsupported entity type: <type>`) and the type `EntityTable`, module-level in `supabaseDataWriter.ts` |
| The upload helper | `#uploadEntityFile({ projectId, table, id, file })` |
| The store's members | `savedEntityData`, `reloadEntityData`; private `#updateEntityData`, `#mergeEntityAnswers`, `#savedEntityData` |
| The translate helper | `translateLocalizedEntity` in `F/lib/api/utils/translateLocalizedEntity.ts` (the file was renamed) |
| The load's entity step | `loadEntity()` still, returning `{ entities, userData, electionId }`; the load returns `{ gate: null, user, entities, questionData, contestantUserData }` |
| The integration test | `F/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.integration.test.ts`, gated on `SUPABASE_URL`, required by `CONTESTANT_WRITER_INTEGRATION_REQUIRED=1` |

Gone from every file outside `.planning/`: `getContestantUserData`, `GetContestantUserDataOptions`, `savedCandidateData`, `reloadCandidateData`, `ContestantUserDataWithCandidate`, `translateLocalizedCandidate`, `#uploadCandidateFile`, and the load's branch for a missing entity object.

**The assumption this plan measured.** A9 holds: `this.scopedFrom(table)` with `table` typed `'candidates' | 'organizations'` typechecks through `.update(…).eq('id', id).select('image').single()` and through `.select(…).eq('id', id).single()`; no two-arm method was needed. The nominations filter, `.eq` on the column named by the template `<type>_id`, typechecks too.

### G-1 on the final tree

```bash
git grep -n -P "\.candidate\b" -- apps/frontend/src/routes/contestant apps/frontend/src/lib/contexts/contestant ':!*.test.ts'
```

Exit status 0, 9 line(s); 28 at the start. None reads the user data's member: seven read the setting `entities.hideIfMissingAnswers.candidate` (four of them in component docblocks) and one the message key `common.electionSymbol.candidate`.

```text
apps/frontend/src/routes/contestant/(protected)/+page.svelte:9:- `entities.hideIfMissingAnswers.candidate`: Affects message shown.
apps/frontend/src/routes/contestant/(protected)/+page.svelte:44:    infoOutstanding || (Boolean(appSettings.entities?.hideIfMissingAnswers?.candidate) && missingOpinionCount !== 0)
apps/frontend/src/routes/contestant/(protected)/profile/+page.svelte:9:- `entities.hideIfMissingAnswers.candidate`: Affects message shown.
apps/frontend/src/routes/contestant/(protected)/profile/+page.svelte:183:        {#if contestantCtx.unansweredRequiredInfoQuestions?.length !== 0 || (appSettings.entities?.hideIfMissingAnswers?.candidate && contestantCtx …
apps/frontend/src/routes/contestant/(protected)/profile/+page.svelte:258:              label={t('common.electionSymbol.candidate')}
apps/frontend/src/routes/contestant/(protected)/questions/+page.svelte:9:- `entities.hideIfMissingAnswers.candidate`: Affects message shown.
apps/frontend/src/routes/contestant/(protected)/questions/+page.svelte:81:        {#if contestantCtx.unansweredRequiredInfoQuestions?.length !== 0 || (appSettings.entities?.hideIfMissingAnswers?.candidate && contestantCt …
apps/frontend/src/routes/contestant/(protected)/questions/+page.svelte:121:          {#if appSettings.entities?.hideIfMissingAnswers?.candidate}
apps/frontend/src/routes/contestant/(protected)/settings/+page.svelte:9:- `entities.hideIfMissingAnswers.candidate`: Affects message shown.
```

### G-5 on the final tree

```bash
git grep -n -F "ENTITY_TYPE.Candidate" -- apps/frontend/src/lib/api/adapters/supabase/dataWriter apps/frontend/src/lib/contexts/contestant ':!*.test.ts'
```

Exit status 0, 1 line(s); 5 at the start. The one left is the context's question scope, which is Phase 175's (obligation O-7).

```text
apps/frontend/src/lib/contexts/contestant/contestantContext.svelte.ts:280:      const entityType = ENTITY_TYPE.Candidate;
```

## After 173-04

**Written by:** plan 173-04, Task 3. Stage 2 (writer, types and store) is closed on tree `60902cbab` (the last commit outside `.planning/`).

label: `173-04-store` — a subset of the gate set, first attempt, on AC power under `caffeinate -dimsu`. No E2E run was made for this plan and no directory under `tests/e2e-runs/173-e2e/` belongs to it.

boundary proof: the full E2E run that closes 173-05

**Gate rows — `tests/e2e-runs/173-gates/173-04-store`, exit 0, four rows, every status 0.** Window 14:53:22 to 14:55:35 local; `sleep_entries_in_window: 0`. `node …/173-verdict.mjs gates 173-04-store --rows typecheck,lint,unit,check-frontend` exits 0. Judged without `--rows` the same directory exits 1, as it must: the run holds four rows and is never read as the full gate set. It reset nothing: `types-regen` is not among its rows.

| Row | Status | Seconds |
|---|---|---|
| typecheck | 0 | 20 |
| lint | 0 | 43 |
| unit | 0 | 61 |
| check-frontend | 0 | 9 |

**Counts that moved since `## After 173-03`.** Frontend unit tests 2224 passed and 7 skipped in 139 files (2204 and 7): four cases in `persistedState.svelte.test.ts` and sixteen in `contestantUserDataState.svelte.test.ts`. svelte-check 2658 files, 0 errors, 0 warnings (unchanged). Not measured by this plan, because their rows did not run: pgTAP, the linter census, the build, the format check, the docs links, the name gate's self-test and the E2E suite. The last full measurement of each is `## After 173-03`.

**The final stem and the names this plan put on the tree.**

| Role | Name |
|---|---|
| The stem of the draft keys | `EDITED_ANSWERS_KEY_STEM`, value `contestantContext-userData-editedAnswers`, exported from `F/lib/contexts/contestant/contestantUserDataState.svelte.ts` |
| The key of one entity's draft | `editedAnswersKey({ type, id })`, exported from the same file: stem, `-`, type, `-`, id — `contestantContext-userData-editedAnswers-candidate-<id>` or `…-organization-<id>` |
| The active draft | the private `#draft`, held in `$state.raw`: `{ key, answers }`, where `answers` is the `localStorageState` handle for that key; absent until the first `init` and after `leaveEntity()` or `reset()` |
| Letting go of an entity | `leaveEntity()` on the store and on the type `ContestantUserDataState`; no caller yet (173-07 adds the first) |
| The prefix removal | `removePersistedByPrefix(type, prefix)`, exported from `F/lib/contexts/utils/persistedState.svelte.ts`; an empty prefix throws |
| The logout sweep | `reset()` calls `removePersistedByPrefix('localStorage', EDITED_ANSWERS_KEY_STEM + '-')` after `leaveEntity()` |
| The stale-result check | the private `#isLoaded(key)`, asked by `save()` and `reloadEntityData()` after each await |

Gone from every file outside `.planning/`: the literal `ContestantContext-contestantUserDataStore-editedAnswers` and the store's field `#editedAnswersState`. A browser that stored a draft under the old key keeps that one key; nothing reads it and nothing removes it.

**The `greps` verdict now:** the first three literals have no hit; `userNoCandidate` (12 hits in 11 files) remains for 173-10, so the verdict still exits 1.

## After 173-05

**Written by:** plan 173-05, Task 4. Stage 3 (route tree), part 1 of 4, is closed on tree `bf2fa8d8a` (the last commit outside `.planning/`). No URL of the app changed.

label: `173-05-prep` (gate set and E2E run, both first attempts, both on AC power under `caffeinate -dimsu`)

boundary proof of 173-04: this run

**Gate set — `tests/e2e-runs/173-gates/173-05-prep`, exit 0, twelve rows, every status 0.** Window 15:15:43 to 15:18:44 local; `sleep_entries_in_window: 0`. `node …/173-verdict.mjs gates 173-05-prep` exits 0. It is the first full gate set over 173-04's five files as well as this plan's: `build` and `format` are at 0 on both.

| Row | Status | Seconds |
|---|---|---|
| typecheck | 0 | 19 |
| lint | 0 | 44 |
| types-regen | 0 | 36 |
| types-clean | 0 | 0 |
| sql-lint | 0 | 3 |
| pgtap | 0 | 5 |
| unit | 0 | 32 |
| check-frontend | 0 | 8 |
| build | 0 | 15 |
| format | 0 | 17 |
| docs-links | 0 | 2 |
| name-gate-self-test | 0 | 0 |

**E2E — `tests/e2e-runs/173-e2e/173-05-prep`, the full default suite, wrapper status 0.**

after_173_05_e2e_counts: total 180, passed 180, failed 0, flaky 0, skipped 0, didNotRun 0 — 100 projects, 5.0 min, no retry, one preflight success, no preflight failure

Window 15:19:00 to 15:24:37 local; `sleep_entries_in_window: 0`. `node …/173-verdict.mjs e2e 173-05-prep --min-total-of 173-01-baseline` exits 0, and so does `… --same-projects-as 173-01-baseline` (100 projects compared, every total equal to the baseline's).

**What the run showed for 173-04.** Every project that signs a contestant in is green at its baseline count: `contestant-journey` 1, `perm-answers-locked` 3, `perm-localisation-positive` 2, `contestant-a11y-scan` 16, `cold-entry-dataroot-contestant` 1, `auth-setup` 2. No test failed, so no failure was attributed to either plan. The run's dev-server log holds none of `Cannot set an answer before user data is loaded`, `effect_update_depth_exceeded` or `Cannot reload entity data`; its server errors are the 26 placeholder-media 404s and the 2 view-transition rejections that `173-03-writer-r4` holds too, in the same numbers. What the run proves for the per-entity draft is save, logout and the answers lock. It does not prove a draft through a reload: no spec on the tree reloads in the middle of an edit (173-12's spec does).

**Counts that moved since `## After 173-04`.** Frontend unit tests 2290 passed and 7 skipped in 143 files (2224 and 7 in 139): three matcher files, the home-button file, and cases added to the writer's, the two gate tests', the load's and the context's files. svelte-check 2665 files (2658), 0 errors, 0 warnings. Unchanged: pgTAP 38 files and 1447 tests, 104 policies, 20 tables, 82 findings on the name gate's fixture, 180 E2E tests in 100 projects.

**The final names this plan put on the tree.**

| Role | Name |
|---|---|
| The matcher of the entity-type segment | `servedEntityType`, in `F/params/servedEntityType.ts`: `match(param): param is ServedEntityType`. It imports `SERVED_ENTITY_TYPES` from `@openvaa/app-shared`; it does not spell the vocabulary |
| The matcher of the entity-id segment | `uuid`, in `F/params/uuid.ts`: the canonical 8-4-4-4-12 hexadecimal form, either letter case |
| The matcher of an entity sub-path named without an entity | `contestantEntityPage`, in `F/params/contestantEntityPage.ts`: `profile`, `questions`, `questions/<one segment>`, `preview`, `settings`; false for the empty string |
| The entry gate | `CONTESTANT_GRANTS` in `F/lib/auth/roles.ts`: `(entity, editor)` on `candidate` and on `organization` |
| The coarse role | `UserRole = 'contestant' \| 'admin'` in `F/lib/api/base/dataWriter.type.ts`; `_getBasicUserData` tests `ADMIN_GRANTS` first |
| The user-level accessors | `user`, `entities`, `selectedEntity` on `ContestantContext`; `entities` is typed `ReadonlyArray<UserEntity>` |
| Their page-data keys | `user?: BasicUserData` and `entities?: Array<UserEntity>` in `App.PageData` (`F/app.d.ts`) |
| The entity's user data | `ContestantUserData<TNominations>` is `{ entity, nominations }`; it holds no `user` |

No route uses the three matchers yet: `git grep -n -e "=servedEntityType" -e "=uuid" -e "=contestantEntityPage" -- apps/frontend/src/routes apps/frontend/src/lib/routes` exits 1.

Gone from every file outside `.planning/`: `CANDIDATE_GRANTS`, the role literal `'candidate'` of `UserRole`, the load's role check, and the `user` member of the entity's user data.

**`userNotAuthorized` now.** `git grep -n -F "userNotAuthorized" -- apps/frontend/src` prints five lines (six at the start): the Admin App's three, unchanged, and the two of `F/lib/contestant/utils/loginError.ts` (the union member and its map entry). Nothing in the Contestant App produces the code; 173-10 retires those two lines.

**The `greps` verdict now:** unchanged from `## After 173-04`: three literals without a hit, `userNoCandidate` at 12 hits in 11 files for 173-10.

## After 173-06

**Written by:** plan 173-06, Task 3. Stage 3 (route tree), part 2 of 4, is closed on tree `262854acd` (the last commit outside `.planning/`). Only harness code under `tests/` changed: `git diff --stat 049954855..262854acd -- apps packages` prints nothing. No URL of the app changed.

label: `173-06-harness` — a subset of the gate set, first attempt, on battery power under `caffeinate -dimsu`. No E2E run was made for this plan and no directory under `tests/e2e-runs/173-e2e/` belongs to it.

boundary proof: the full E2E run that closes 173-07, compared per project with 173-01-baseline

**Gate rows — `tests/e2e-runs/173-gates/173-06-harness`, exit 0, three rows, every status 0.** Window 16:12:22 to 16:14:18 local; `sleep_entries_in_window: 0`. `node …/173-verdict.mjs gates 173-06-harness --rows typecheck,lint,unit` exits 0. Judged without `--rows` the same directory exits 1, as it must. It reset nothing: `types-regen` is not among its rows.

| Row | Status | Seconds |
|---|---|---|
| typecheck | 0 | 18 |
| lint | 0 | 42 |
| unit | 0 | 55 |

The helpers' own tests: `yarn vitest run --config tests/vitest.config.ts buildRoute contestantEntityUrl` exits 0 — 2 files, 43 tests; the whole tests-utility set is 5 files, 64 tests (3 files and 21 tests before). Those files are in no gate row: the `unit` row is `yarn test:unit`, which does not collect `tests/vitest.config.ts`. Frontend unit tests are unchanged at 2290 passed and 7 skipped in 143 files. `yarn playwright test -c tests/playwright.config.ts --grep-invert @probe --list` lists 180 tests, the baseline's total, so every spec still loads.

**The names this plan put on the tree.**

| Role | Name |
|---|---|
| The tests' route builder | `buildRoute({ route, locale, params? })` in `T/utils/buildRoute.ts`; a required or rest param segment without a value throws `buildRoute: the param "<name>" of route "<key>" (<route id>) is not filled. Pass it in \`params\`.`; an unfilled optional segment is dropped; an empty string counts as no value |
| Its core, for a route id that is not in `ROUTE` | `fillRouteId({ route, routeId, locale, params? })`, `parseParamSegment(segment)`, the types `RouteParams` and `ParamSegment`, same file |
| The entity segment, declared once | `ENTITY_SEGMENT_SOURCE` in `T/utils/contestantEntityUrl.ts`: `(?:/(?:candidate|organization)/<canonical uuid, either letter case>)?` — the trailing `?` is what 173-08 removes |
| A page of an entity | `contestantUrlRe(subPath, tail = 'exact')`; `ContestantUrlTail` is `'exact'` (the page, an optional trailing slash), `'child'` (exactly one further segment) or `'any'` (the page or any slash-led continuation); each also accepts a query or a fragment; a `subPath` that is not slash-led, or ends in a slash, throws |
| Having left a page for another page of the app | `contestantUrlOutsideRe(subPath)` — an addition to the plan's four builders, for the profile fixture |
| An entity's home | `contestantHomeUrlRe()`; `isContestantHomePath(pathname)` for a path already stripped of its locale prefix |
| A path with the entity left out | `buildEntityLessRoute({ route, locale, params? })`, on `dropEntitySegments(routeId)`, which removes the param segments named `entityType` and `entityId` |

**E-7 on the final tree** (`git grep -n -E "toHaveURL|waitForURL" -- tests/tests | grep -i contestant`, 23 lines). Through the helper, 15: the profile fixture's `contestantUrlOutsideRe('/profile')`; the a11y spec's `contestantUrlRe('/questions', 'child')`; in the journey spec the wait on `PER_QUESTION_URL_RE` (now `contestantUrlRe('/questions', 'child')`), `contestantUrlRe('/profile')` three times, `contestantHomeUrlRe()`, `contestantUrlRe('/questions', 'any')`, `contestantUrlRe('/questions', 'child')` five times and `contestantUrlRe('/questions')`; the localisation spec's `contestantUrlRe('/questions')`. Left as they were, 8: four on the login path (the logout fixture, the journey spec twice, `perm-closed-project`), the journey's two predicates (the URL differs from the current one; the path no longer holds `/login`), its post-registration dispatcher (which now asks `isContestantHomePath` for the home), and the bank-auth journey's `/contestant/preregister/status`.

**E-9 on the final tree** (`git grep -n -P "ContestantApp(Preview|Profile|Question|Questions|Settings)\b" -- tests`): the a11y table's five `routeId` values, navigated by `buildEntityLessRoute` in the runner's two `goto` calls; one comment of the localisation spec; the visual-regression spec's two and the cold-entry spec's one `buildEntityLessRoute` calls; seven lines of `contestantEntityUrl.test.ts`, all `buildEntityLessRoute`. No call of the plain `buildRoute` names one of the five keys.

**The acceptance search** `git grep -n -F -e '\/contestant\/profile' -e '\/contestant\/questions' -e '\/contestant\/preview' -e '\/contestant\/settings' -- tests/tests` with the helper and its test excluded exits 1.

## After 173-07

**Written by:** plan 173-07, Task 5. Stage 3 (route tree), part 3 of 4, is closed on tree `e7a0aade6` (the last commit outside `.planning/`). No URL of the app changed: the six entity pages moved into the route group `contestant/(protected)/(entity)/`, and a group adds no URL segment.

label: `173-07-split` (gate set and E2E run, both first attempts, both on battery power under `caffeinate -dimsu`)

boundary proof of 173-06: this run

**Gate set — `tests/e2e-runs/173-gates/173-07-split`, exit 0, twelve rows, every status 0.** Window 16:55:06 to 16:57:55 local; `sleep_entries_in_window: 0`. `node …/173-verdict.mjs gates 173-07-split` exits 0.

| Row | Status | Seconds |
|---|---|---|
| typecheck | 0 | 17 |
| lint | 0 | 41 |
| types-regen | 0 | 30 |
| types-clean | 0 | 1 |
| sql-lint | 0 | 2 |
| pgtap | 0 | 5 |
| unit | 0 | 31 |
| check-frontend | 0 | 8 |
| build | 0 | 15 |
| format | 0 | 17 |
| docs-links | 0 | 1 |
| name-gate-self-test | 0 | 0 |

**E2E — `tests/e2e-runs/173-e2e/173-07-split`, the full default suite, wrapper status 0.**

after_173_07_e2e_counts: total 180, passed 180, failed 0, flaky 0, skipped 0, didNotRun 0 — 100 projects, 5.0 min, no retry, no preflight failure

Window 16:58:13 to 17:03:47 local; `sleep_entries_in_window: 0`, and a second read of `pmset -g log` after the run shows no Sleep, Wake or DarkWake entry between 16:00 and the read. `node …/173-verdict.mjs e2e 173-07-split --min-total-of 173-01-baseline` exits 0, and so does `… --same-projects-as 173-01-baseline`. Both instruments record head `e7a0aade6`, and the verdict reads each as not stale.

The per-project comparison's output (`--same-projects-as 173-01-baseline`, which resolves to `173-01-baseline-r2`; columns: project, this run, the baseline, expected, verdict):

```
a11y-smoke	16	16	equal to 16	holds
admin-access	1	1	equal to 1	holds
auth-setup	2	2	equal to 2	holds
cold-entry-dataroot	3	3	equal to 3	holds
cold-entry-dataroot-contestant	1	1	equal to 1	holds
contestant-a11y-scan	16	16	equal to 16	holds
contestant-journey	1	1	equal to 1	holds
data-setup-admin-auth	1	1	equal to 1	holds
data-setup-base	1	1	equal to 1	holds
data-setup-contestant-journey	1	1	equal to 1	holds
data-setup-perm-1e1cg1co	1	1	equal to 1	holds
data-setup-perm-2e-asymmetric	1	1	equal to 1	holds
data-setup-perm-2e-shared	1	1	equal to 1	holds
data-setup-perm-access-disable	1	1	equal to 1	holds
data-setup-perm-analytics-tracking	1	1	equal to 1	holds
data-setup-perm-answers-locked	1	1	equal to 1	holds
data-setup-perm-closed-project	1	1	equal to 1	holds
data-setup-perm-disable-allow-open	1	1	equal to 1	holds
data-setup-perm-disable-election-1co	1	1	equal to 1	holds
data-setup-perm-disable-election-2co	1	1	equal to 1	holds
data-setup-perm-disjoint-1co	1	1	equal to 1	holds
data-setup-perm-header-show-help	1	1	equal to 1	holds
data-setup-perm-hide-all-nominations	1	1	equal to 1	holds
data-setup-perm-hide-category-tags	1	1	equal to 1	holds
data-setup-perm-hide-election-tags	1	1	equal to 1	holds
data-setup-perm-hide-hero	1	1	equal to 1	holds
data-setup-perm-hide-if-missing-answers	1	1	equal to 1	holds
data-setup-perm-interactive-info	1	1	equal to 1	holds
data-setup-perm-localisation-positive	1	1	equal to 1	holds
data-setup-perm-missing-nominations	1	1	equal to 1	holds
data-setup-perm-not-located-2e2cg	1	1	equal to 1	holds
data-setup-perm-org-matching	1	1	equal to 1	holds
data-setup-perm-per-app-notifications	1	1	equal to 1	holds
data-setup-perm-question-video	1	1	equal to 1	holds
data-setup-perm-show-feedback-survey	1	1	equal to 1	holds
data-setup-perm-startfromcg	1	1	equal to 1	holds
data-teardown-admin-access	1	1	equal to 1	holds
data-teardown-base	1	1	equal to 1	holds
data-teardown-contestant-journey	1	1	equal to 1	holds
data-teardown-perm-1e1cg1co	1	1	equal to 1	holds
data-teardown-perm-2e-asymmetric	1	1	equal to 1	holds
data-teardown-perm-2e-shared	1	1	equal to 1	holds
data-teardown-perm-access-disable	1	1	equal to 1	holds
data-teardown-perm-analytics-tracking	1	1	equal to 1	holds
data-teardown-perm-answers-locked	1	1	equal to 1	holds
data-teardown-perm-closed-project	1	1	equal to 1	holds
data-teardown-perm-disable-allow-open	1	1	equal to 1	holds
data-teardown-perm-disable-election-1co	1	1	equal to 1	holds
data-teardown-perm-disable-election-2co	1	1	equal to 1	holds
data-teardown-perm-disjoint-1co	1	1	equal to 1	holds
data-teardown-perm-header-show-help	1	1	equal to 1	holds
data-teardown-perm-hide-all-nominations	1	1	equal to 1	holds
data-teardown-perm-hide-category-tags	1	1	equal to 1	holds
data-teardown-perm-hide-election-tags	1	1	equal to 1	holds
data-teardown-perm-hide-hero	1	1	equal to 1	holds
data-teardown-perm-hide-if-missing-answers	1	1	equal to 1	holds
data-teardown-perm-interactive-info	1	1	equal to 1	holds
data-teardown-perm-localisation-positive	1	1	equal to 1	holds
data-teardown-perm-missing-nominations	1	1	equal to 1	holds
data-teardown-perm-not-located-2e2cg	1	1	equal to 1	holds
data-teardown-perm-org-matching	1	1	equal to 1	holds
data-teardown-perm-per-app-notifications	1	1	equal to 1	holds
data-teardown-perm-question-video	1	1	equal to 1	holds
data-teardown-perm-show-feedback-survey	1	1	equal to 1	holds
data-teardown-perm-startfromcg	1	1	equal to 1	holds
eperm07-term-trigger	1	1	equal to 1	holds
performance	1	1	equal to 1	holds
perm-1e1cg1co	1	1	equal to 1	holds
perm-2e-asymmetric	1	1	equal to 1	holds
perm-2e-shared	2	2	equal to 2	holds
perm-access-disable	3	3	equal to 3	holds
perm-answers-locked	3	3	equal to 3	holds
perm-closed-project	11	11	equal to 11	holds
perm-disable-allow-open	3	3	equal to 3	holds
perm-disable-election-1co	1	1	equal to 1	holds
perm-disable-election-2co	1	1	equal to 1	holds
perm-disjoint-1co	2	2	equal to 2	holds
perm-header-show-help	1	1	equal to 1	holds
perm-hide-all-nominations	1	1	equal to 1	holds
perm-hide-category-tags	1	1	equal to 1	holds
perm-hide-election-tags	1	1	equal to 1	holds
perm-hide-hero	1	1	equal to 1	holds
perm-hide-if-missing-answers	1	1	equal to 1	holds
perm-interactive-info	4	4	equal to 4	holds
perm-localisation-positive	2	2	equal to 2	holds
perm-missing-nominations	1	1	equal to 1	holds
perm-not-located-2e2cg	5	5	equal to 5	holds
perm-org-matching	3	3	equal to 3	holds
perm-per-app-notifications	2	2	equal to 2	holds
perm-question-video	4	4	equal to 4	holds
perm-show-feedback-survey	6	6	equal to 6	holds
perm-startfromcg	2	2	equal to 2	holds
storage-cleanup	3	3	equal to 3	holds
voter-alliance	1	1	equal to 1	holds
voter-dark-mode	1	1	equal to 1	holds
voter-journey	2	2	equal to 2	holds
voter-journey-mobile	1	1	equal to 1	holds
voter-nominations	1	1	equal to 1	holds
voter-prefs-tracking	3	3	equal to 3	holds
voter-results-redraw	5	5	equal to 5	holds
per project: 100 compared, 0 not as expected
173-verdict e2e 173-07-split: PASS
```

**What the run showed for 173-06 (the harness).** Every spec loads and every project holds its baseline total, so no test was lost to the re-pointing. No URL assertion failed on an unchanged page, and the wrapper log, the Playwright output and the dev-server log hold no `is not filled` error from the tests' route builder. The projects whose specs go through `contestantEntityUrl.ts` are green at their baseline counts: `contestant-journey` 1, `contestant-a11y-scan` 16, `perm-localisation-positive` 2, `cold-entry-dataroot-contestant` 1.

**What the run showed for 173-07 (the load split and the home rule).** Every project that signs a contestant in is green at its baseline count: `auth-setup` 2, `contestant-journey` 1, `contestant-a11y-scan` 16, `cold-entry-dataroot-contestant` 1, `perm-answers-locked` 3, `perm-localisation-positive` 2, `perm-disable-allow-open` 3, `perm-hide-hero` 1, `perm-closed-project` 11. On the split loads the journey spec accepts the terms of use and reaches the page behind the gate, logs out and in again and finds the home page's three tasks unchanged, and sees `contestant-nav-home` in the signed-in menu. The dev-server log holds none of `effect_update_depth_exceeded`, `Cannot set an answer before user data is loaded`, `Cannot reload entity data`, `hydration_mismatch`, `loginFailed` or `candidateNoNomination`. Its server errors are the 26 placeholder-media 404s every full run of this phase holds. Its client rejections are 9 media `play()` aborts (9 in `173-05-prep`), 2 `Viewport size changed` view-transition aborts (2) and 3 `Transition was skipped. New ViewTransition started` (0 in `173-05-prep`, 3 in `173-03-writer-r4`, 4 in `173-02-schema`, 1 in `173-01-baseline-r2`): inside the range of the earlier runs, and not attributed to this plan.

What the run does not prove: the journey asserts that the menu's home item is visible, not its `href`, and no spec presses the header's return button and asserts where it lands; no spec counts the one-entity reads; and no test mounts the entity layout outside a browser (item 35 below).

**Counts that moved since `## After 173-06`.** Frontend unit tests 2336 passed and 7 skipped in 147 files and 1 skipped file (2290 and 7 in 143). svelte-check 2676 files (2665), 0 errors, 0 warnings. Unchanged: pgTAP 38 files and 1447 tests, 180 E2E tests in 100 projects.

**The protected tree** (`find "apps/frontend/src/routes/contestant/(protected)" -type f | sort`):

```
apps/frontend/src/routes/contestant/(protected)/(entity)/+layout.server.ts
apps/frontend/src/routes/contestant/(protected)/(entity)/+layout.svelte
apps/frontend/src/routes/contestant/(protected)/(entity)/+page.svelte
apps/frontend/src/routes/contestant/(protected)/(entity)/contestantHome.helpers.test.ts
apps/frontend/src/routes/contestant/(protected)/(entity)/contestantHome.helpers.ts
apps/frontend/src/routes/contestant/(protected)/(entity)/layout.server.test.ts
apps/frontend/src/routes/contestant/(protected)/(entity)/layout.tracking.test.ts
apps/frontend/src/routes/contestant/(protected)/(entity)/preview/+page.svelte
apps/frontend/src/routes/contestant/(protected)/(entity)/profile/+page.svelte
apps/frontend/src/routes/contestant/(protected)/(entity)/questions/[questionId]/+page.svelte
apps/frontend/src/routes/contestant/(protected)/(entity)/questions/+layout.svelte
apps/frontend/src/routes/contestant/(protected)/(entity)/questions/+page.svelte
apps/frontend/src/routes/contestant/(protected)/(entity)/settings/+page.svelte
apps/frontend/src/routes/contestant/(protected)/+layout.server.ts
apps/frontend/src/routes/contestant/(protected)/+layout.svelte
apps/frontend/src/routes/contestant/(protected)/layout.server.test.ts
apps/frontend/src/routes/contestant/(protected)/layout.tracking.test.ts
apps/frontend/src/routes/contestant/(protected)/loadTracking.testUtils.ts
apps/frontend/src/routes/contestant/(protected)/termsOfUseLayout.svelte.test.ts
```

**The names this plan put on the tree.**

| Role | Name |
|---|---|
| The route group of the entity pages | `contestant/(protected)/(entity)/`; its prefix is `CONTESTANT_ENTITY` = `${CONTESTANT_PROT}/(entity)` in `F/lib/routes/route.ts` |
| The entity home's route key | `ROUTE.ContestantAppEntityHome`; `ContestantAppProfile`, `ContestantAppQuestions`, `ContestantAppQuestion`, `ContestantAppPreview` and `ContestantAppSettings` are built on the same prefix; `ContestantAppHome` is unchanged |
| The sign-out both loads call | `signOutToLogin(locals, locale, error): Promise<never>` in `F/lib/server/contestant/signOutToLogin.ts`; it holds the adapter-boundary lint allowlist entry the protected load held |
| The user-level load | `F/routes/contestant/(protected)/+layout.server.ts`: `load({ fetch, locals })`, returning `{ gate, user }` while a gate is pending and `{ gate: null, user, entities }` after |
| The entity-level load | `F/routes/contestant/(protected)/(entity)/+layout.server.ts`: `load({ fetch, locals, parent })`, `await parent()` first, returning `{ questionData, contestantUserData }` |
| The entity-level layout | `F/routes/contestant/(protected)/(entity)/+layout.svelte`: `userData.init(…)` in its data-apply effect, `userData.leaveEntity()` as an effect cleanup |
| The read-recording guards | `(protected)/layout.tracking.test.ts` and `(protected)/(entity)/layout.tracking.test.ts`, on `(protected)/loadTracking.testUtils.ts` (`Untrack`, `recordingUrl`, `recordingParams`, `forbiddenRoute`) |
| The home rule | `contestantHomeRoute(params)` and the type `ContestantHomeRoute` in `F/lib/routes/contestantHomeRoute.ts`, exported from `$lib/routes` |
| Its reader on the context | the reactive accessor `homeRoute` on `ContestantContext`; `ContestantNav.svelte`'s home item and `Banner.svelte`'s return callback read it |

**E-10 and E-11 on the final tree.** The docs' generated route map shows `(entity)/` with `preview/`, `profile/`, `questions/[questionId]/` and `settings/` under it. Three hand-written pages were corrected: the settings page link of `contestant-app/password-validation`, and the sentences of `contestant-app/login-and-password-reset` and `contestant-app/registration` that described one load. Two source comments, in `supabaseDataProvider.ts` and its test, now cite `contestant/(protected)/(entity)/+layout.server.ts` as the load that derives the election ids. The citations left as they are are item 34 below.

## After 173-08

**Written by:** plan 173-08, Task 5. Stage 3 (route tree) is closed on tree `1afcbe1b6` (the last commit outside `.planning/`). The selected entity is the URL: every entity page is served at `/contestant/<entityType>/<entityId>[/profile|/questions[/<questionId>]|/preview|/settings]`.

label: `173-08-move`, judged on its re-make `173-08-move-r2` (the verdict script resolves the plain label to it)

**Two pairs of instruments, both green, both kept.** The first pair, `173-08-move`, ran on tree `24f23def5` and was the first browser run of the URL move: gate set exit 0, E2E 180 of 180. It was not red and not void. The journey spec then gained assertions on where the signed-in menu's links lead (commit `1afcbe1b6`, tests only), which changed the tree, so both instruments were made again as `173-08-move-r2`. The suffix here marks a re-make on a changed tree, not a re-run after a host sleep. All four runs were on battery power under `caffeinate -dimsu`; every `power.txt` records `sleep_entries_in_window: 0`, and `pmset -g log` read at 18:03:14 holds no Sleep, Wake or DarkWake entry after 15:58:38.

**Gate set — `tests/e2e-runs/173-gates/173-08-move-r2`, exit 0, twelve rows, every status 0.** Window 17:54:07 to 17:57:22 local. `node …/173-verdict.mjs gates 173-08-move` exits 0. The first attempt (`173-08-move`, window 17:41:25 to 17:44:39) holds the same twelve zeros.

| Row | Status | Seconds |
|---|---|---|
| typecheck | 0 | 17 |
| lint | 0 | 42 |
| types-regen | 0 | 31 |
| types-clean | 0 | 0 |
| sql-lint | 0 | 3 |
| pgtap | 0 | 4 |
| unit | 0 | 55 |
| check-frontend | 0 | 8 |
| build | 0 | 15 |
| format | 0 | 17 |
| docs-links | 0 | 2 |
| name-gate-self-test | 0 | 0 |

**E2E — `tests/e2e-runs/173-e2e/173-08-move-r2`, the full default suite, wrapper status 0.**

after_173_08_e2e_counts: total 180, passed 180, failed 0, flaky 0, skipped 0, didNotRun 0 — 100 projects, 5.0 min, no retry, no preflight failure

Window 17:57:28 to 18:03:02 local. `node …/173-verdict.mjs e2e 173-08-move --min-total-of 173-01-baseline` exits 0, and so does `… --same-projects-as 173-01-baseline`. Both instruments record head `1afcbe1b6`, and the verdict reads each as not stale. The first attempt (`tests/e2e-runs/173-e2e/173-08-move`, window 17:44:51 to 17:50:18, head `24f23def5`) holds the same counts in 4.9 min and the same 100 per-project lines.

The per-project comparison's output (`--same-projects-as 173-01-baseline`, which resolves to `173-01-baseline-r2`; columns: project, this run, the baseline, expected, verdict):

```
a11y-smoke	16	16	equal to 16	holds
admin-access	1	1	equal to 1	holds
auth-setup	2	2	equal to 2	holds
cold-entry-dataroot	3	3	equal to 3	holds
cold-entry-dataroot-contestant	1	1	equal to 1	holds
contestant-a11y-scan	16	16	equal to 16	holds
contestant-journey	1	1	equal to 1	holds
data-setup-admin-auth	1	1	equal to 1	holds
data-setup-base	1	1	equal to 1	holds
data-setup-contestant-journey	1	1	equal to 1	holds
data-setup-perm-1e1cg1co	1	1	equal to 1	holds
data-setup-perm-2e-asymmetric	1	1	equal to 1	holds
data-setup-perm-2e-shared	1	1	equal to 1	holds
data-setup-perm-access-disable	1	1	equal to 1	holds
data-setup-perm-analytics-tracking	1	1	equal to 1	holds
data-setup-perm-answers-locked	1	1	equal to 1	holds
data-setup-perm-closed-project	1	1	equal to 1	holds
data-setup-perm-disable-allow-open	1	1	equal to 1	holds
data-setup-perm-disable-election-1co	1	1	equal to 1	holds
data-setup-perm-disable-election-2co	1	1	equal to 1	holds
data-setup-perm-disjoint-1co	1	1	equal to 1	holds
data-setup-perm-header-show-help	1	1	equal to 1	holds
data-setup-perm-hide-all-nominations	1	1	equal to 1	holds
data-setup-perm-hide-category-tags	1	1	equal to 1	holds
data-setup-perm-hide-election-tags	1	1	equal to 1	holds
data-setup-perm-hide-hero	1	1	equal to 1	holds
data-setup-perm-hide-if-missing-answers	1	1	equal to 1	holds
data-setup-perm-interactive-info	1	1	equal to 1	holds
data-setup-perm-localisation-positive	1	1	equal to 1	holds
data-setup-perm-missing-nominations	1	1	equal to 1	holds
data-setup-perm-not-located-2e2cg	1	1	equal to 1	holds
data-setup-perm-org-matching	1	1	equal to 1	holds
data-setup-perm-per-app-notifications	1	1	equal to 1	holds
data-setup-perm-question-video	1	1	equal to 1	holds
data-setup-perm-show-feedback-survey	1	1	equal to 1	holds
data-setup-perm-startfromcg	1	1	equal to 1	holds
data-teardown-admin-access	1	1	equal to 1	holds
data-teardown-base	1	1	equal to 1	holds
data-teardown-contestant-journey	1	1	equal to 1	holds
data-teardown-perm-1e1cg1co	1	1	equal to 1	holds
data-teardown-perm-2e-asymmetric	1	1	equal to 1	holds
data-teardown-perm-2e-shared	1	1	equal to 1	holds
data-teardown-perm-access-disable	1	1	equal to 1	holds
data-teardown-perm-analytics-tracking	1	1	equal to 1	holds
data-teardown-perm-answers-locked	1	1	equal to 1	holds
data-teardown-perm-closed-project	1	1	equal to 1	holds
data-teardown-perm-disable-allow-open	1	1	equal to 1	holds
data-teardown-perm-disable-election-1co	1	1	equal to 1	holds
data-teardown-perm-disable-election-2co	1	1	equal to 1	holds
data-teardown-perm-disjoint-1co	1	1	equal to 1	holds
data-teardown-perm-header-show-help	1	1	equal to 1	holds
data-teardown-perm-hide-all-nominations	1	1	equal to 1	holds
data-teardown-perm-hide-category-tags	1	1	equal to 1	holds
data-teardown-perm-hide-election-tags	1	1	equal to 1	holds
data-teardown-perm-hide-hero	1	1	equal to 1	holds
data-teardown-perm-hide-if-missing-answers	1	1	equal to 1	holds
data-teardown-perm-interactive-info	1	1	equal to 1	holds
data-teardown-perm-localisation-positive	1	1	equal to 1	holds
data-teardown-perm-missing-nominations	1	1	equal to 1	holds
data-teardown-perm-not-located-2e2cg	1	1	equal to 1	holds
data-teardown-perm-org-matching	1	1	equal to 1	holds
data-teardown-perm-per-app-notifications	1	1	equal to 1	holds
data-teardown-perm-question-video	1	1	equal to 1	holds
data-teardown-perm-show-feedback-survey	1	1	equal to 1	holds
data-teardown-perm-startfromcg	1	1	equal to 1	holds
eperm07-term-trigger	1	1	equal to 1	holds
performance	1	1	equal to 1	holds
perm-1e1cg1co	1	1	equal to 1	holds
perm-2e-asymmetric	1	1	equal to 1	holds
perm-2e-shared	2	2	equal to 2	holds
perm-access-disable	3	3	equal to 3	holds
perm-answers-locked	3	3	equal to 3	holds
perm-closed-project	11	11	equal to 11	holds
perm-disable-allow-open	3	3	equal to 3	holds
perm-disable-election-1co	1	1	equal to 1	holds
perm-disable-election-2co	1	1	equal to 1	holds
perm-disjoint-1co	2	2	equal to 2	holds
perm-header-show-help	1	1	equal to 1	holds
perm-hide-all-nominations	1	1	equal to 1	holds
perm-hide-category-tags	1	1	equal to 1	holds
perm-hide-election-tags	1	1	equal to 1	holds
perm-hide-hero	1	1	equal to 1	holds
perm-hide-if-missing-answers	1	1	equal to 1	holds
perm-interactive-info	4	4	equal to 4	holds
perm-localisation-positive	2	2	equal to 2	holds
perm-missing-nominations	1	1	equal to 1	holds
perm-not-located-2e2cg	5	5	equal to 5	holds
perm-org-matching	3	3	equal to 3	holds
perm-per-app-notifications	2	2	equal to 2	holds
perm-question-video	4	4	equal to 4	holds
perm-show-feedback-survey	6	6	equal to 6	holds
perm-startfromcg	2	2	equal to 2	holds
storage-cleanup	3	3	equal to 3	holds
voter-alliance	1	1	equal to 1	holds
voter-dark-mode	1	1	equal to 1	holds
voter-journey	2	2	equal to 2	holds
voter-journey-mobile	1	1	equal to 1	holds
voter-nominations	1	1	equal to 1	holds
voter-prefs-tracking	3	3	equal to 3	holds
voter-results-redraw	5	5	equal to 5	holds
per project: 100 compared, 0 not as expected
173-verdict e2e 173-08-move-r2: PASS
```

**What the browser run showed.**

- *Sign-in to the entity home.* `auth-setup` and every project that signs a contestant in are green at their baseline counts. The journey's URL assertions go through `contestantEntityUrl.ts`, whose patterns now reject a path without an entity segment, so each passing assertion is the app standing on an entity URL: the home after the profile's return button, the profile, the questions overview, a question.
- *The resolver for a signed-in user.* `page.goto('/en/contestant/questions')` followed by `toHaveURL(contestantUrlRe('/questions'))` passes in the journey and in `perm-localisation-positive`; the a11y scans, the visual project's preview and `cold-entry-dataroot-contestant` enter through `buildEntityLessRoute` and find their pages.
- *The route builder carries the entity.* The journey asserts, on the entity home, that the menu's home item leads to the entity home and that the profile, questions, preview and settings items each lead to that page under the entity. No page passes either param.
- *A page that names no entity.* Signed in on Privacy, the menu's home item leads to the app root and none of the four entity items is rendered; pressing the home item ends on the entity home. Help's home button ends on the entity home too. No `Missing parameter` in the dev-server log.
- *The terms-of-use gate at the root.* The journey accepts at `/contestant` and reaches the page behind the gate; the a11y scan of the gate view under the terms-pending session is green.
- *No load reran on a navigation inside an entity.* Counted in the API gateway's log (`docker logs supabase_kong_openvaa-local`), by run window: `get_entity_user_data` 47 from the server and 6 from the browser in `173-07-split`, 47 and 6 in `173-08-move`, 48 and 6 in `173-08-move-r2` (the one added read is the new return from Privacy). `get_user_entities` 47, 94 and 96: exactly two list reads per entity read, because every entry through an entity-less URL is two requests, the root or the resolver and then the entity URL, and the user-level load runs for each. No list read beyond that pair, so the user-level load did not rerun on a navigation between pages of one entity either.
- *The dev-server log* holds none of `effect_update_depth_exceeded`, `Cannot set an answer before user data is loaded`, `Cannot reload entity data`, `hydration_mismatch`, `loginFailed`, `candidateNoNomination`, `Missing parameter`, `ERR_TOO_MANY_REDIRECTS` or `is not filled`. Its server 404s are 27 placeholder-media requests (26 in `173-07-split`; one more `q1.webm`). Client rejections: 9 media `play()` aborts, 2 `Viewport size changed` and 4 `Transition was skipped` in the judged run (1 and 1 in the first attempt), inside the range of the earlier runs.

What the run does not prove: no spec presses the header's return button and asserts where it lands; no test identity has zero or several entities, so the root's `loginFailed` outcome and the resolver's redirect to the root have unit tests only; no spec types an entity URL the user may not edit; no trace of a passing test is kept (`trace: 'retain-on-failure'`), so the one-entity reads were counted at the gateway and not per navigation.

**Counts that moved since `## After 173-07`.** Frontend unit tests 2445 passed and 7 skipped in 152 files and 1 skipped file (2336 and 7 in 147). The tests' utility suite 5 files and 73 tests (64). svelte-check 2686 files (2676), 0 errors, 0 warnings. Unchanged: pgTAP 38 files and 1447 tests, 180 E2E tests in 100 projects.

**The route ids.**

| Route key | Route id |
|---|---|
| `ContestantAppEntityHome` | `/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]` |
| `ContestantAppProfile` | `/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/profile` |
| `ContestantAppQuestions` | `/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/questions` |
| `ContestantAppQuestion` | `/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/questions/[questionId]` |
| `ContestantAppPreview` | `/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/preview` |
| `ContestantAppSettings` | `/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/settings` |
| `ContestantAppEntityResolver` | `/contestant/(protected)/[...page=contestantEntityPage]` |
| `ContestantAppHome` (unchanged) | `/contestant` |

**The protected tree** (`find "apps/frontend/src/routes/contestant/(protected)" -type f | sort`):

```
apps/frontend/src/routes/contestant/(protected)/[...page=contestantEntityPage]/+page.server.ts
apps/frontend/src/routes/contestant/(protected)/[...page=contestantEntityPage]/+page.svelte
apps/frontend/src/routes/contestant/(protected)/[...page=contestantEntityPage]/page.server.test.ts
apps/frontend/src/routes/contestant/(protected)/[...page=contestantEntityPage]/page.tracking.test.ts
apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/+layout.server.ts
apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/+layout.svelte
apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/+page.svelte
apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/contestantHome.helpers.test.ts
apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/contestantHome.helpers.ts
apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/layout.server.test.ts
apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/layout.tracking.test.ts
apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/preview/+page.svelte
apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/profile/+page.svelte
apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/questions/[questionId]/+page.svelte
apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/questions/+layout.svelte
apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/questions/+page.svelte
apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/settings/+page.svelte
apps/frontend/src/routes/contestant/(protected)/+layout.server.ts
apps/frontend/src/routes/contestant/(protected)/+layout.svelte
apps/frontend/src/routes/contestant/(protected)/+page.server.ts
apps/frontend/src/routes/contestant/(protected)/+page.svelte
apps/frontend/src/routes/contestant/(protected)/layout.server.test.ts
apps/frontend/src/routes/contestant/(protected)/layout.tracking.test.ts
apps/frontend/src/routes/contestant/(protected)/loadTracking.testUtils.ts
apps/frontend/src/routes/contestant/(protected)/page.server.test.ts
apps/frontend/src/routes/contestant/(protected)/page.tracking.test.ts
apps/frontend/src/routes/contestant/(protected)/termsOfUseLayout.svelte.test.ts
```

**The names this plan put on the tree.**

| Role | Name |
|---|---|
| The entity routes' prefix | `CONTESTANT_ENTITY` = `${CONTESTANT_PROT}/[entityType=servedEntityType]/[entityId=uuid]` in `F/lib/routes/route.ts` |
| The resolver's route key | `ROUTE.ContestantAppEntityResolver`; no link is built from it |
| The root's load | `F/routes/contestant/(protected)/+page.server.ts`: `load({ locals, parent })`; a pending gate returns `{}`; exactly one entity is a 307 to `ContestantAppEntityHome`; any other number is `signOutToLogin(locals, lang, 'loginFailed')` |
| The resolver's load | `F/routes/contestant/(protected)/[...page=contestantEntityPage]/+page.server.ts`: reads the `page` param alone; exactly one entity is a 307 to the same page under it; otherwise a 307 to the app root; it never signs out and drops the query string |
| The user-level load | `F/routes/contestant/(protected)/+layout.server.ts`: reads `params.entityType` and `params.entityId` and no `url` property, so it reruns when the selected entity changes |
| The entity-level load | `F/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/+layout.server.ts`: `load({ fetch, locals, params, parent })`; the pair must be in the parent's list, else a 307 to the app root before any writer is built |
| The read-recording guards | `page.tracking.test.ts` beside the root's load and beside the resolver's, `layout.tracking.test.ts` beside each layout load, all on `(protected)/loadTracking.testUtils.ts` |
| The menu's gate | `{#if contestantCtx.selectedEntity}` around the profile, questions, preview and settings items of `ContestantNav.svelte`; `ContestantNav.svelte.test.ts` holds it |
| The `$app/paths` test stub | `F/lib/i18n/tests/__mocks__/app-paths.ts` resolves a route id by SvelteKit's rules and throws `Missing parameter` |
| The tests' entity segment | `ENTITY_SEGMENT_SOURCE` in `tests/tests/utils/contestantEntityUrl.ts`, required |
| The tests' app-root builders | `contestantAppRootUrlRe()` and `isContestantAppRootPath(pathname)` in the same file |

**E-10 and E-11 on the final tree.** `git grep -F "(entity)"` over the tree outside `.planning/` finds no citation of the old group. Three hand-written docs pages were corrected: the settings page link of `contestant-app/password-validation`; the paragraph of `contestant-app/login-and-password-reset` on the protected loads, which now names the two route params, the root's redirect, the redirect of a path that names no entity and the two codes a load signs out with; and the sentence of `contestant-app/registration` on which load reads the entity. The generated route map holds `[...page=contestantEntityPage]/` and `[entityType=servedEntityType]/[entityId=uuid]/` with the four page directories; the generated page of `ContestantNav` gained the section on what the menu shows. Source comments now cite the entity pages under the two params in `supabaseDataProvider.ts` and its test, `contestantHome.helpers.ts`, `route.test.ts`, `routeConsistency.test.ts`, five contestant fixtures, `perm-disable-allow-open.spec.ts` and three dev-seed templates; `apps/frontend/src/routes/README.md` names the `contestant/` directory.

## After 173-09

**Written by:** plan 173-09, Task 4. Stage 4, part 1 of 2: the parts are on the tree, tested and rendered by no page. Last commit outside `.planning/`: `e0826df94`.

label: `173-09-parts`

boundary proof: the full E2E run that closes 173-10

**Gate rows — `tests/e2e-runs/173-gates/173-09-parts`, exit 0, five rows, every status 0.** Window 18:27:23 to 18:29:46 local, on battery power under `caffeinate -dimsu`; `power.txt` records `sleep_entries_in_window: 0`. `node …/173-verdict.mjs gates 173-09-parts --rows typecheck,lint,unit,check-frontend,docs-links` exits 0: five rows expected (the named subset), five recorded, head `e0826df94` tree-equal to HEAD outside `.planning/`. This is a subset: it is not the gate set, it reset no database, and no E2E run directory was made for this plan.

| Row | Status | Seconds |
|---|---|---|
| typecheck | 0 | 20 |
| lint | 0 | 45 |
| unit | 0 | 67 |
| check-frontend | 0 | 9 |
| docs-links | 0 | 1 |

**Counts that moved since `## After 173-08`.** Frontend unit tests 2497 passed and 7 skipped in 155 files and 1 skipped file (2445 and 7 in 152): 11 in `EntityCard.svelte.test.ts`, 4 in `ContactSupport.svelte.test.ts`, 11 in `NothingToEdit.svelte.test.ts` and 26 more in `translations.test.ts` (380, from 354). svelte-check 2703 files (2686), 0 errors, 0 warnings. Message files per locale 49 (47); catalogue keys 605 (597), of which `contestantApp.*` 167 (159). The generated component listing 105 components (103). The components skill's measured counts: 103 files calling `$props()` and 103 co-located `*.type.ts` files (101 and 101); `concatClass` in 61 files of the three libraries and 68 of `apps/frontend/src` (60 and 66 as stated; 60 and 67 as measured on `45fd21c53`). Unchanged: pgTAP, the tests' utility suite, 180 E2E tests in 100 projects (none of them run here).

**The eight message keys, as they are in the tree** (`apps/frontend/messages/<locale>/contestantApp.entitySelection.json` and `contestantApp.nothingToEdit.json`, seven locales each; both registered in `project.inlang/settings.json`, the first after `contestantApp.common`, the second after `contestantApp.logoutModal`):

| Key | English | Parameters |
|---|---|---|
| `contestantApp.entitySelection.title` | Choose a Profile to Edit | none |
| `contestantApp.entitySelection.ingress` | You can edit more than one profile. Choose the one you want to work on now. You can switch to another one at any time from the menu. | none |
| `contestantApp.entitySelection.switch` | Switch profile | none |
| `contestantApp.entitySelection.current` | {entityType}: {name} | `entityType`, `name` |
| `contestantApp.nothingToEdit.title` | Nothing to Edit Here | none |
| `contestantApp.nothingToEdit.content` | Your user account is not connected to any profile in this application, so there is nothing for you to edit. | none |
| `contestantApp.nothingToEdit.signedInAs` | Signed in as | none |
| `contestantApp.nothingToEdit.nextSteps` | If you registered with another email address, log out and sign in with that address. Otherwise, contact support and tell them the address shown above. | none |

`translations.test.ts` names the eight keys and their parameters and holds every locale to exactly them. Only `contestantApp.nothingToEdit.*` is read by a component; nothing reads `contestantApp.entitySelection.*` until 173-10.

**The eleven test ids, as they are in `tests/tests/utils/testIds.ts`.**

| Registry path | Value | Rendered today by |
|---|---|---|
| `contestant.common.contactSupport` | `contestant-contact-support` | `ContactSupport.svelte` (no page renders it yet) |
| `contestant.entitySelection.list` | `contestant-entity-selection-list` | nothing; 173-10 |
| `contestant.entitySelection.group` | `contestant-entity-selection-group` | nothing; 173-10 |
| `contestant.entitySelection.groupHeading` | `contestant-entity-selection-group-heading` | nothing; 173-10 |
| `contestant.nothingToEdit.container` | `contestant-nothing-to-edit` | `NothingToEdit.svelte` (no page renders it yet) |
| `contestant.nothingToEdit.email` | `contestant-nothing-to-edit-email` | `NothingToEdit.svelte` |
| `contestant.nothingToEdit.logout` | `contestant-nothing-to-edit-logout` | `NothingToEdit.svelte` |
| `contestant.nav.entityGroup` | `contestant-nav-entity-group` | nothing; 173-10 |
| `contestant.nav.switchEntity` | `contestant-nav-switch-entity` | nothing; 173-10 |
| `voter.results.cardType` | `entity-card-type` | `EntityCard.svelte`, only with `showType` |
| `voter.results.cardAction` | `entity-card-action` | `EntityCard.svelte`, as before this plan |

The two entity-card ids sit beside `card` and `cardTitle` in the group that already held them; the registry path above is that group's. `contestant.help.contactSupport` (`contestant-help-contact-support`) is still registered and still rendered by the Help page: this plan removes nothing.

**The names this plan put on the tree.**

| Role | Name |
|---|---|
| The card's three props | `headerOnly` (default `false`), `showType` (default `false`), `keepScroll` (default `true`) in `F/lib/dynamic-components/entityCard/EntityCard.type.ts` |
| The card's type label | `<span class="small-label" data-testid="entity-card-type">`, the first child of the `#<id>_subtitle` element, text `t('common.<type>.singular')`; never on a `subcard` |
| The support block | `ContactSupport` in `F/lib/contestant/components/contactSupport/`; props type `ContactSupportProps` (`children`, `action: 'help' | 'email'` default `'help'`, `variant` default `'prominent'`, any `<div>` attribute) |
| The support anchor | `SUPPORT_ANCHOR` = `'support'`, declared in `ContactSupport.type.ts` and exported by the directory's `index.ts` |
| The support block's links | `'help'`: `getRoute.current('ContestantAppHelp')` followed by `#support`, icon `help`; `'email'`: `getEmailUrl` with the Help page's subject and `appSettings.admin.email`, `target="_blank"`, icon `feedback` |
| The view | `NothingToEdit` in `F/lib/contestant/components/nothingToEdit/`; props type `NothingToEditProps` (`title`, `children`) |
| The view's actions | `<ContactSupport variant="main" />`, then `<LogoutButton variant="normal" icon={undefined} data-testid="contestant-nothing-to-edit-logout" />`, the call the entity home makes |
| The view's email | `contestantCtx.user?.email`, read in the markup; a `<dd class="font-bold [overflow-wrap:anywhere] hyphens-none" translate="no">` under a `<dt class="small-label">`; the whole `<dl>` absent without an email |
| The card's component cases | `F/lib/dynamic-components/entityCard/tests/EntityCard.svelte.test.ts` |

**What the default card was shown to render.** Twelve cards (a candidate as a list card with the default action, a URL, a handler and `false`; with `showElection`; as `details`; as a `subcard` with and without a URL; an organization as a list card and as `details`; an alliance; a list card with a caller's class and attribute) were mounted on `45fd21c53` and again on the changed component, over settings whose card contents name `submatches`, two question entries and `children`. With comments and the whitespace between elements removed, the markup of all twelve is equal: every element, attribute, attribute value and text. The raw markup of the two subcards is equal as well; the other ten gain one empty comment node (the anchor of the new `{#if showType}` block) and one whitespace-only text node inside the subtitle's grid, where neither is rendered. The keep-scroll attribute keeps the value it had (`data-sveltekit-noscroll="true"`). No wrapped entity (a nomination or a match) was among the twelve: the fake entities are plain objects, so sub-matches with a match, sub-cards and the alliance summary were not mounted; their conditions gained only `!headerOnly`.

## After 173-10

**Written by:** plan 173-10, Task 4. Stage 4 (screen H, the "nothing to edit" view, the switch item, the strings) is closed on tree `4bf684612` (the last commit outside `.planning/`).

label: `173-10-screens`

boundary proof of 173-09: this run

**Gate set — `tests/e2e-runs/173-gates/173-10-screens`, exit 0, twelve rows, every status 0.** Window 20:36:03 to 20:39:29 local, on battery power under `caffeinate -dimsu`, lid open; `power.txt` records `sleep_entries_in_window: 0`, and `pmset -g log` read after the run holds no Sleep, Wake or DarkWake entry between 20:35 and 20:40. `node …/173-verdict.mjs gates 173-10-screens` exits 0: twelve rows expected, twelve recorded, head `4bf684612` tree-equal to HEAD outside `.planning/`.

| Row | Status | Seconds |
|---|---|---|
| typecheck | 0 | 18 |
| lint | 0 | 44 |
| types-regen | 0 | 31 |
| types-clean | 0 | 0 |
| sql-lint | 0 | 3 |
| pgtap | 0 | 5 |
| unit | 0 | 61 |
| check-frontend | 0 | 8 |
| build | 0 | 17 |
| format | 0 | 17 |
| docs-links | 0 | 1 |
| name-gate-self-test | 0 | 0 |

**E2E — `tests/e2e-runs/173-e2e/173-10-screens`, the full default suite, wrapper status 0.**

after_173_10_e2e_counts: total 180, passed 180, failed 0, flaky 0, skipped 0, didNotRun 0 — 100 projects, no retry, no preflight failure

Window 20:39:45 to 20:45:23 local, on battery power under `caffeinate -dimsu`; `sleep_entries_in_window: 0`, and `pmset -g log` holds no Sleep, Wake or DarkWake entry between 20:39 and 20:46. `node …/173-verdict.mjs e2e 173-10-screens --min-total-of 173-01-baseline` exits 0, and so does `… --same-projects-as 173-01-baseline` (100 projects compared, every total equal to the baseline's). Both instruments record head `4bf684612`. It was the first attempt of each instrument: no `-r2` exists for this label. The plan added no E2E test, so the expected total is the baseline's 180.

`node …/173-verdict.mjs greps` exits 0: none of the four closing literals (`get_candidate_user_data`, `ERR_ENTITY_IDENTITY_AMBIGUOUS`, `ContestantContext-contestantUserDataStore-editedAnswers`, `userNoCandidate`) is on the committed tree outside `.planning/`.

**What the run showed for 173-09.** Every voter project is green at its baseline count (`voter-journey` 2, `voter-journey-mobile` 1, `voter-results-redraw` 5, `voter-nominations` 1, `voter-alliance` 1, `voter-dark-mode` 1, `perm-org-matching` 3, `perm-hide-category-tags` 1, `perm-missing-nominations` 1 and the rest of the perm family), so the cards with match scores, sub-matches, party sub-cards and the alliance summary, none of which 173-09's unit comparison mounted, render and behave as before the three props. The two a11y scan families (16 and 16) are green, the Help page with `ContactSupport` among them. No failure pointed back to 173-09, and none to this plan.

**The dev-server log of the run** holds none of `effect_update_depth_exceeded`, `Cannot set an answer`, `Cannot reload entity data`, `hydration_mismatch`, `loginFailed`, `candidateNoNomination`, `Missing parameter`, `ERR_TOO_MANY_REDIRECTS`, `is not filled`, `Error providing the user` or `Error resolving the user`. It holds `Error formatting nomination: Error: Child in collection elections with id … not found` three times, as the logs of `173-07-split` and `173-08-move-r2` do (three each): not new, not diagnosed, filed in `deferred-items.md`.

**What the suite does not show, and what a one-off browser probe did.** No test identity has zero or several entities before 173-12, so the suite reaches neither view of the root, the switch item, nor a second entity. A probe (scratch script, not committed; a dev server on the default project, started and stopped for it; the seeded user `candidate@openvaa.test` given two temporary editor grants, on the default dataset's candidate Helena Aaltonen and the organization Blue Coalition, both removed again and verified by query) ran from 20:34:42 to 20:34:57 local with no Sleep entry in its window, signed in at 1280px and observed at 390 × 844:

- *The gate comes first.* The terms-of-use view was shown at the root before the selection view.
- *Screen H.* `<h1>` "Choose a Profile to Edit"; the route announcer held the title; two groups, `candidate` headed "Candidates" with the cards "Helena Aaltonen" and "Test Candidate" in that order, `organization` headed "Parties" with "Blue Coalition"; each card with its type label ("candidate", "party"); each link the entity home, none with `data-sveltekit-noscroll`, each 100px tall; the drawer `bg-base-300`; no horizontal scroll; no logout button in the page body.
- *Picking a card.* The organization's home: `<h1>` "Hello, Blue Coalition!", focus on the `<h1>`, scroll position 0. The open menu: the group title "party: Blue Coalition", the five items under that entity, then `contestant-nav-switch-entity` linking to `/contestant`.
- *Switching.* The switch item closed the drawer and landed on H with focus on its `<h1>` and the three cards again, so the view provides its entities on a return from an entity. The second candidate's home and profile then showed that candidate ("Helena", "Aaltonen" in the locked name fields; menu title "candidate: Helena Aaltonen") and no error view: the entity layout was torn down for one entity and mounted for another.
- *Help.* The support block inside `#support` with a `mailto:` link; the menu's only signed-in item the home item, linking to `/contestant`; no group title.
- *Nothing to edit.* With every grant of the user deleted while signed in, the second candidate's URL ended at `/contestant` on the view: `<h1>` "Nothing to Edit Here" with focus on it, the email `candidate@openvaa.test`, no list wrapper, both actions 44px tall. Log Out opened no dialog and ended on `/contestant/login`. The seeded grant row was restored with its id and timestamp.

Not measured by the probe: whether the context's unanswered lists were non-empty on that view (the component case shows the modal opens there without the store check and does not with it); a 320px viewport; the dark theme; a locale other than English; the native confirm on a switch from an editor with an unsaved edit; a draft kept per entity across a switch. Two attempts before it spanned a host sleep (18:56:50 and 20:32:17 local) and are void; nothing above comes from them.

**What was done with `userNotAuthorized`.** Removed from the contestant login-error union and its map: `git grep -F "userNotAuthorized" -- apps/frontend/src apps/frontend/messages apps/docs` found, on the contestant side, the union and the map entry alone. Its message is the shared `error.403`, which the admin side's own map reads, so no message was removed. The admin population is unchanged: `lib/admin/utils/loginError.ts` (map entry and union) and `routes/admin/(protected)/+layout.ts` (`handleError('userNotAuthorized')`). The contestant union is now `'candidateNoNomination' | 'loginFailed' | 'nominationNoElection'`.

**Counts that moved since `## After 173-09`.** Frontend unit tests 2546 passed and 7 skipped in 159 files and 1 skipped file (2497 and 7 in 155): 4 in `LogoutButton.svelte.test.ts`, 7 in `userEntityDisplayName.test.ts`, 10 in `entitySelection.helpers.test.ts`, 13 in `page.svelte.test.ts`, 4 more in the root's `page.server.test.ts`, 2 more in its `page.tracking.test.ts`, 9 more in `ContestantNav.svelte.test.ts`. svelte-check 2708 files (2703), 0 errors, 0 warnings. Catalogue keys 604 (605), of which `contestantApp.*` 166 (167). Unchanged: pgTAP 38 files and 1447 tests, the tests' utility suite, 180 E2E tests in 100 projects.

**The names this plan put on the tree.**

| Role | Name |
|---|---|
| The root's load | `F/routes/contestant/(protected)/+page.server.ts`: `load({ parent })`; a pending gate returns `{}`; no entity returns `{ view: 'nothingToEdit' }`; exactly one is a 307 to `ContestantAppEntityHome`; several return `{ view: 'select' }`. It takes `parent` alone from the event and signs nobody out |
| The root's page | `F/routes/contestant/(protected)/+page.svelte`: `<NothingToEdit />` for the first view, screen H for the second, nothing when the load names no view |
| The display name | `userEntityDisplayName(entity, dataRoot)` in `F/lib/contestant/utils/userEntityDisplayName.ts`: a candidate's `name` as a `Candidate` built on that root gives it, an organization's `name` |
| The list entry as entity data | `userEntityData(entity)` in the same file: `CandidateData` or `OrganizationData` with `id`, `shortName`, `image`, `color` and the names; `confirmed` is dropped |
| The grouping | `groupEntitiesForSelection({ entities, locale, displayName })` in `(protected)/entitySelection.helpers.ts`, returning `{ groups: Array<{ type, entities }>, showHeadings }`; `SELECTION_GROUP_ORDER` = `['candidate', 'organization']` |
| H's states | `selection.state`: `'loading'` until the page's own effect has provided the current list, `'error'` when the provision threw or an entity cannot be resolved, `'resolved'` otherwise |
| H's background | `pageStyles.push({ drawer: { background: 'bg-base-300' } })` from an effect that runs it for the `select` view alone and returns its revert |
| H's rendered ids | `contestant-entity-selection-list`, `contestant-entity-selection-group` (a `<section>` with `data-entity-type`), `contestant-entity-selection-group-heading` (an `<h2>`, only with both types) |
| The menu's title | `NavGroup title={entityTitle}`: `t('contestantApp.entitySelection.current', { entityType: t('common.<type>.singular'), name: userEntityDisplayName(selected, dataRoot) })`; the group carries `data-testid="contestant-nav-entity-group"` only while an entity is selected |
| The switch item | `contestant-nav-switch-entity`, `href` the app root, icon `list`, inside `{#if contestantCtx.selectedEntity}` and `{#if contestantCtx.entities.length > 1}` |
| The logout rule | `LogoutButton` opens its modal only when `userData.savedEntityData` is set |
| Removed | `contestant.help.contactSupport` / `contestant-help-contact-support`; `contestantApp.error.userNoCandidate`; the union members `userNoCandidate` and `userNotAuthorized`; the root's import of `signOutToLogin` |

## After 173-11

**Written by:** plan 173-11, Task 3. Stage 5, part 1 of 3 (the seed side): the base dataset serves both entity types, the journey's name pin follows it, and three unconfirmed rows wait for the selection spec. Tree `8d223fb7c` (the last commit outside `.planning/`).

label: `173-11-base`

**Gate set — `tests/e2e-runs/173-gates/173-11-base`, exit 0, twelve rows, every status 0.** Window 21:03:13 to 21:06:37 local, on battery power under `caffeinate -dimsu`; `power.txt` records `sleep_entries_in_window: 0`. `node …/173-verdict.mjs gates 173-11-base` exits 0: twelve rows expected, twelve recorded, head `8d223fb7c` tree-equal to HEAD outside `.planning/`.

| Row | Status | Seconds |
|---|---|---|
| typecheck | 0 | 18 |
| lint | 0 | 44 |
| types-regen | 0 | 31 |
| types-clean | 0 | 0 |
| sql-lint | 0 | 3 |
| pgtap | 0 | 5 |
| unit | 0 | 59 |
| check-frontend | 0 | 9 |
| build | 0 | 15 |
| format | 0 | 18 |
| docs-links | 0 | 1 |
| name-gate-self-test | 0 | 0 |

**E2E — `tests/e2e-runs/173-e2e/173-11-base`, the full default suite, wrapper status 0.**

after_173_11_e2e_counts: total 180, passed 180, failed 0, flaky 0, skipped 0, didNotRun 0 — 100 projects, no retry, one preflight success, no preflight failure

Window 21:06:44 to 21:12:25 local, on battery power under `caffeinate -dimsu`; `sleep_entries_in_window: 0`, and `pmset -g log` read at 21:12:34 holds no Sleep, Wake or DarkWake entry after 20:33:53. `node …/173-verdict.mjs e2e 173-11-base --same-projects-as 173-01-baseline` exits 0 (100 projects compared, 0 not as expected), and so does `… --min-total-of 173-01-baseline`. Both instruments record head `8d223fb7c`. It was the first attempt of each instrument: no `-r2` exists for this label. The plan added no E2E test, so every project's total is the baseline's.

**What the run showed for the widening.** Every voter project is green at its baseline count (`voter-journey` 2, `voter-journey-mobile` 1, `voter-results-redraw` 5, `voter-nominations` 1, `voter-alliance` 1, `voter-dark-mode` 1, `voter-prefs-tracking` 3), with no assertion, step or count of a voter spec edited: the 13 candidate cards of CO-Reg-N, the 5 organisation cards, Party AA's 5 visible members, the "No answer" party filter count of 1 and the reset to 13 cards all hold with the three rows seeded. `contestant-journey` asserts the login heading against `dynamic.contestantAppName.candidateAndOrganization` and still sees the registration-code link and no pre-registration button, so the registration entries did not move with the served types. The perm family, on the candidates-only minimal settings, is green unedited.

**The dev-server log of the run** holds none of `effect_update_depth_exceeded`, `Cannot set an answer`, `Cannot reload entity data`, `hydration_mismatch`, `loginFailed`, `candidateNoNomination`, `Missing parameter`, `ERR_TOO_MANY_REDIRECTS`, `is not filled`, `Error providing the user` or `Error resolving the user`. It holds `Error formatting nomination` three times, as the logs of `173-07-split`, `173-08-move-r2` and `173-10-screens` do.

**The three selection rows** (all in `packages/dev-seed/src/templates/e2e/base.ts`, each `confirmed: false`, none with an editor grant, none named by a spec yet):

| External id | Type | Names | Carries | Nomination |
|---|---|---|---|---|
| `test-e2e-base-ca-sel-a` | candidate | first name `Switch-A`, last name `Entity One` (displayed "Switch-A Entity One"), `sort_order` 15, no organization | `withInfoAnswers(GENERIC)`: the same answers as `test-e2e-base-ca-aa-1`, every info question and all 14 opinion questions | `test-e2e-base-nom-reg-n-ca-sel-a`: EL-Reg, CO-Reg-N, round 1, election symbol `31`, no parent |
| `test-e2e-base-ca-sel-b` | candidate | first name `Switch-B`, last name `Entity Two` (displayed "Switch-B Entity Two"), `sort_order` 16, no organization | the same, except the one question below | `test-e2e-base-nom-reg-n-ca-sel-b`: EL-Reg, CO-Reg-N, round 1, election symbol `32`, no parent |
| `test-e2e-base-or-sel` | organization | name `[or-sel] Party Sel`, short name `SEL`, colour `#6b3fa0` / `#b79ad9`, `sort_order` 5 | no answers, as every base organization | `test-e2e-base-nom-reg-n-or-sel`: EL-Reg, CO-Reg-N, round 1, no parent, no child nomination |

The question on which the two candidates differ: `test-e2e-base-qu-opin-base-1-likert5` — A answers `'3'` ("Neutral"), B answers `'5'` ("Fully agree"). On every other question their answers are equal. A sorts before B by first name, by last name and by displayed name.

**Why voters do not see them.** `anon_select_candidates` and `anon_select_organizations` require `confirmed` on the entity, and `anon_select_nominations` requires `private.nomination_entities_confirmed(id)`, which is false for a nomination whose entity is unconfirmed; the `authenticated` policies assemble the same three conjuncts for a caller with no authority over the row. So an unconfirmed entity hides its own nomination too, and a write to any of the three is read by no voter query.

**Dataset totals that moved, each as earlier total plus delta** (pinned in `packages/dev-seed/tests/templates/base.test.ts`): organizations 5 + 1 = 6; candidates 30 + 2 = 32; nominations 61 + 3 = 64. CO-Reg-N: candidate nominations 15 + 2 = 17, of which unconfirmed 2 + 2 = 4, visible 13 as before; organization nominations 5 + 1 = 6, visible 5 as before; candidates without a parent nomination 1 + 2 = 3, visible 1 as before. Party AA: 7 nominal members, 2 unconfirmed, 5 visible, unchanged. Rows that state `confirmed`: four candidates (the two control rows and the two selection candidates) and one organization.

**The served types.** `BASE_APP_SETTINGS.contestantApp` is `{ questions: { hideHero: false, hideVideo: false }, entityTypes: ['candidate', 'organization'], registrationModes: { candidate: ['email', 'code'], organization: [] } }`. `MINIMAL_BASE_APP_SETTINGS` and the 29 other built-in templates (the `perm-*` family and `show-feedback-survey`) stay `entityTypes: ['candidate']`: the recorded choice of D-20, pinned twice (`base-app-settings.test.ts` and `built-in-templates-contestant-app.test.ts`, whose per-template case now knows three families: `default`, `e2e/base`, perm). `git diff --stat 446dd4bd9..8d223fb7c -- packages/dev-seed/src/templates/e2e/perm` prints nothing.

**The app-name pins.** Population command (`git grep -n -i -E "Candidate app|Party app|Candidate and party app|contestantAppName" -- tests packages/dev-seed/tests`): two lines. Changed: `tests/tests/specs/contestant/contestant-journey.spec.ts`, whose constant is now `BASE_DATASET_APP_NAME`, read from `dynamic.contestantAppName.candidateAndOrganization`, at its one use (step 7's login heading). Left on purpose: `tests/tests/specs/perm/perm-closed-project.spec.ts`, which writes its own settings and reads all three names. No spec or fixture holds a literal of the name or of one of the five sentences parameterised on it (`contestantApp.help.ingress`, `contestantApp.notSupported.title` and `.content`, `dynamic.contestantAppNotAccessible.title` and `.content`), and no regular expression in `tests/` matches the old name.

**The visual verdict: no difference; no baseline regenerated.** `tests/e2e-runs/173-visual/173-11-observe`: `status` 0, `observed_expected=8`, `observed_unexpected=0`, `observed_flaky=0`, `observed_skipped=0` (the four screenshot tests, the base setup, the two auth-setup tests and the base teardown), one preflight success, no failure, no update flag passed. Window 21:01:26 to 21:02:46 local with no Sleep entry. `git status --porcelain tests/tests/specs/visual/__screenshots__/` prints nothing and the four blobs are the committed ones (`contestant-preview-desktop.png` `402f4bf8`, `contestant-preview-mobile.png` `88781886`, `voter-results-desktop.png` `15dabda7`, `voter-results-mobile.png` `78d8fad2`). Assumption A13 holds. Host recipe, as phase 170 recorded it: `yarn build`; `yarn db:reset` (exit 0); storage answering 200; `yarn db:seed --template e2e/base`; `yarn dev:clean`; `PUBLIC_PROJECT_ID=00000000-0000-0000-0000-0000000000e2 yarn workspace @openvaa/frontend dev --host 0.0.0.0` in its own process group on 5173, publishing that project id; the container script; the server stopped by its process group and the port confirmed free.

**Counts that moved since `## After 173-10`.** dev-seed unit tests 1015 in 67 files (996 in 67): 16 in `base.test.ts`, 1 in `base-app-settings.test.ts`, 2 in `built-in-templates-contestant-app.test.ts`. Unchanged: frontend unit tests 2546 passed and 7 skipped in 159 files and 1 skipped file, pgTAP 38 files and 1447 tests, 180 E2E tests in 100 projects.

**State left behind.** The local database was reset twice (the visual recipe, then the gate set's `types-regen` row) and holds migrations, `seed.sql` and the `default` dataset (`yarn db:seed:default`, exit 0, 752 rows). No dev server is running; 5173 and 5273 have no listener.

## After 173-12

**Written by:** plan 173-12, Task 4. Stage 5, part 2 of 3 (the harness and the spec): the suite holds a user who edits two candidates and an organization, a user with nothing to edit and a user to log out, and a spec in which the first chooses, switches and saves to the selected entity only. Tree `b6897fd31` (the last commit outside `.planning/`).

label: `173-12-spec`

**Gate set — `tests/e2e-runs/173-gates/173-12-spec`, exit 0, twelve rows, every status 0.** Window 21:33:53 to 21:37:17 local, on battery power under `caffeinate -dimsu`; `power.txt` records `sleep_entries_in_window: 0`. `node …/173-verdict.mjs gates 173-12-spec` exits 0: twelve rows expected, twelve recorded, head `b6897fd31` tree-equal to HEAD outside `.planning/`.

| Row | Status | Seconds |
|---|---|---|
| typecheck | 0 | 18 |
| lint | 0 | 44 |
| types-regen | 0 | 31 |
| types-clean | 0 | 0 |
| sql-lint | 0 | 3 |
| pgtap | 0 | 4 |
| unit | 0 | 61 |
| check-frontend | 0 | 8 |
| build | 0 | 16 |
| format | 0 | 18 |
| docs-links | 0 | 1 |
| name-gate-self-test | 0 | 0 |

**E2E — `tests/e2e-runs/173-e2e/173-12-spec`, the full default suite, wrapper status 0.**

after_173_12_e2e_counts: total 192, passed 192, failed 0, flaky 0, skipped 0, didNotRun 0 — 103 projects, no retry, one preflight success, no preflight failure

Window 21:37:34 to 21:43:22 local, on battery power under `caffeinate -dimsu`; `sleep_entries_in_window: 0`, and `pmset -g log` read after the run holds no Sleep, Wake or DarkWake entry after 20:33:53. `node …/173-verdict.mjs e2e 173-12-spec --same-projects-as 173-11-base --except data-setup-entity-selection=+ --except data-teardown-entity-selection=+ --except contestant-entity-selection=+ --expect-project data-setup-entity-selection --expect-project contestant-entity-selection` exits 0: 103 projects compared, 0 not as expected, so every project of `173-11-base` has exactly its total there and the three new projects are the only additions. Both instruments record head `b6897fd31`. It was the first attempt of each instrument under this label.

**The expected total, by enumeration before the run** (`yarn playwright test -c tests/playwright.config.ts --grep-invert @probe --list` on `b56f0ae7c`): 192 tests in 102 files, which is 180 + 3 (`data-setup-entity-selection`) + 1 (`data-teardown-entity-selection`) + 8 (`contestant-entity-selection`); 100 + 3 = 103 projects.

| New project | Total | Passed |
|---|---|---|
| `data-setup-entity-selection` | 3 | 3 |
| `data-teardown-entity-selection` | 1 | 1 |
| `contestant-entity-selection` | 8 | 8 |

**The slice before it.** `tests/e2e-runs/173-e2e/173-12-slice` (window 21:31:08 to 21:31:59, head `b56f0ae7c`, no Sleep entry) is RED and kept: 16 tests, 13 passed, 3 failed, all three at the same line of the nav-menu fixture's new `closeNav`, which pressed Escape and then asserted the menu hidden. The Escape key does not close the drawer (no handler in `lib/layouts/main/Layout.svelte`; the journey spec presses it and asserts nothing after). `b6897fd31` closes the drawer through its close item. `tests/e2e-runs/173-e2e/173-12-slice-r2` (window 21:32:48 to 21:33:25, head `b6897fd31`): 16 of 16; `… e2e 173-12-slice --allow-slice --expect-project contestant-entity-selection --expect-project data-setup-entity-selection` exits 0. The `-r2` here is a re-make after a fix to a fixture, not a re-run after a host sleep.

**The dev-server log of the full run** holds none of `effect_update_depth_exceeded`, `Cannot set an answer`, `Cannot reload entity data`, `hydration_mismatch`, `loginFailed`, `candidateNoNomination`, `Missing parameter`, `ERR_TOO_MANY_REDIRECTS`, `is not filled`, `Error providing the user` or `Error resolving the user`. It holds `Error formatting nomination` three times, as every full run since `173-07-split` does.

**The three identities** (each on `test.openvaa.local`, password `TEST_CANDIDATE_PASSWORD`, terms of use accepted at registration; constants in `tests/tests/utils/testCredentials.ts`):

| Identity | Email (constant) | Grants | Stored session |
|---|---|---|---|
| multi | `entity-selection-multi@test.openvaa.local` (`TEST_MULTI_ENTITY_EMAIL`) | editor of `test-e2e-base-ca-sel-a`, `test-e2e-base-ca-sel-b`, `test-e2e-base-or-sel` | `MULTI_ENTITY_STORAGE_STATE` = `tests/playwright/.auth/user-multi-entity.json`, stored once the selection list has rendered; read-only for the run |
| none | `entity-selection-none@test.openvaa.local` (`TEST_NO_ENTITY_EMAIL`) | editor of `test-e2e-base-or-sel` at sign-in, removed after the session is stored | `NO_ENTITY_STORAGE_STATE` = `tests/playwright/.auth/user-no-entity.json`, stored on the organization's home; read-only for the run |
| logout | `entity-selection-logout@test.openvaa.local` (`TEST_LOGOUT_ENTITY_EMAIL`) | editor of `test-e2e-base-or-sel` until the spec removes it | none: the spec signs it in through the login form |

**The names this plan put on the tree.**

| Role | Name |
|---|---|
| Grant an entity to an existing user | `SupabaseAdminClient.grantEntity(email, { entityType, externalId })`; the type `EntityGrantTarget`. A candidate that already has an editor is refused by name before the insert |
| Its inverse | `revokeEntityGrant(email, { entityType, externalId })`, idempotent |
| A user's entity-grant count | `entityGrantCountForUser(email)` |
| Register a user with a list of grants, or none | `forceRegisterUser(email, password, { entityGrants?, acceptTermsOfUse? })`; `forceRegister` keeps its signature. Both run the private `registerWithGrants`, and every entity grant in the file (`forceRegister`, `forceRegisterUser`, `grantEntity`, `sendEmail`'s invite path) is inserted by the private `grantEntityToUser` |
| The session helper | `registerAndStoreSession(page, identity)` and `StoredSessionIdentity`, exported from the plain module `tests/tests/setup/shared/registerAndStoreSession.ts`; the identity's `externalId` is optional and `entityGrants` lists further entities |
| The row ids | `TEST_SELECTION_CANDIDATE_A_EXTERNAL_ID`, `TEST_SELECTION_CANDIDATE_B_EXTERNAL_ID`, `TEST_SELECTION_ORGANIZATION_EXTERNAL_ID` |
| Setup and teardown | `tests/tests/setup/contestant/entity-selection.setup.ts` (three setup tests) and `entity-selection.teardown.ts` |
| Projects | `data-setup-entity-selection` (depends on `data-setup-base`), `data-teardown-entity-selection` (`retries: 0`), `contestant-entity-selection` (depends on the setup and on `auth-setup`; `storageState: MULTI_ENTITY_STORAGE_STATE`; not fully parallel); `contestant-entity-selection` is in the dependencies of `data-setup-perm-1e1cg1co` |
| Page fixtures | `createContestantEntitySelectionPage` (`open`, `requestAppRootExpectingRedirect`, `expectShown`, `expectAbsent`, `expectHeadingFocused`, `readView`, `expectCardLinksTo`, `pick`), `createContestantNothingToEditPage` (`open`, `expectShown`, `expectSignedInEmail`, `expectSupportButton`, `logoutWithoutDialog`) |
| Nav-menu members | `closeNav`, `expectEntityGroupTitle`, `expectSwitchEntityItem`, `expectNoSwitchEntityItem`, `switchEntity` |
| Question-page members | `expectSelectedChoice(index)`, `clickCancel()` |
| Composition root | `tests/tests/fixtures/contestant/contestant-entity-selection.ts`: `test`, `expect`, `SELECTION_TEXT`, `entityGroupTitle(entity)`; fixtures `adminClient`, `selectionEntities`, `nativeDialogs`, `contestantEntityPages`, `navMenu` and the page fixtures |
| Spec | `tests/tests/specs/contestant/contestant-entity-selection.spec.ts`, eight tests in seven groups |

**What the spec showed in a browser, for the first time in a committed test.** The root lists three cards in two headed groups, candidates first, A before B, each with its type label and a link to its own home, and no alert. A card leads to that entity's home; the menu's group title is the catalogue's "{entityType}: {name}" and the switch item is the group's last link, leading to the app root. An unsaved answer of A is in `localStorage` under A's key, survives a reload, is shown again on A after a visit to B, and B has no draft; saving on A changes A's row (`'3'` to `'1'`) and leaves B's (`'5'`), read with the service role. The switch item lands on the selection with focus on its heading; the organization's home heading holds the organization's name; after A and then the organization in one document, B's editor, reached by links alone, shows B's answer. A switch from the editor with an unsaved edit raises exactly one native `confirm`; dismissed, the editor, the edit and the draft remain; the page's Cancel then discards the draft with no prompt. A candidate the user does not edit, and the user's own candidate under `organization`, both land on the selection with a view equal to a plain visit's. The base candidate's session is redirected from the root by the server and its menu has no switch item. An editor of one organization lands on the organization's home after sign-in (items 25 and 71, now shown); with the grant removed the root shows the "nothing to edit" view with the email and the support button, and Logout raises no modal and no native dialog and ends on the login page. The stored no-entity session shows the same view, also from the organization's URL, which its token still names.

**Counts.** 192 E2E tests in 103 projects (180 in 100). Read from this gate set's logs and unchanged: frontend unit tests 2546 passed and 7 skipped, dev-seed unit tests 1015 in 67 files, pgTAP 38 files and 1447 tests. The count of the tests' utility suite was not re-read.

**State left behind.** The gate set reset the local database; it holds migrations, `seed.sql` and the `default` dataset (`yarn db:seed:default`, exit 0, 752 rows). No auth user on `test.openvaa.local` remains, no `test-` candidate row, and the grants table holds the seed's two rows. No dev server is running; 5173 and 5273 have no listener. The two new session files are under `tests/playwright/.auth/`, which is ignored.

## Obligations to later phases

**Written by:** plan 173-13, Task 3. One row per obligation of `173-CONTEXT.md` `<cross_phase>`: what this phase left, and the file or symbol where it is. `F` is `apps/frontend/src`, `S` is `apps/supabase/supabase`.

| Id | To | What this phase left | Where |
|---|---|---|---|
| O-1 | Phase 178 | The "password set" fact is not delivered. `get_user_entities` returns ONE `jsonb` object with an `entities` array, one row even for a caller with no entity, so a per-user key can be added beside `entities` through a private definer helper without changing the function's signature or cardinality. The gates are decided on the user-level read (`getBasicUserData`), before the list is read, so a gate's field belongs there or on this object, not on the one-entity read | `S/schema/503-entity-rpcs.sql` (`get_user_entities`); `F/routes/contestant/(protected)/+layout.server.ts` stages 2 to 4; `F/lib/contestant/gates/gates.ts` (`firstNeededGate`) |
| O-2 | Phase 170 (done here) | The exemption line for the deleted user-data function is gone from the name gate; the list holds exactly two entries (`invite-candidate` and the three shown names), which `173-verdict.mjs exemptions` asserts. Every protected route constant and E2E URL moved a second time in 173-08 | `scripts/assert-no-candidate-app-names.mjs`; `F/lib/routes/route.ts` (`CONTESTANT_ENTITY`) |
| O-3 | Phases 174, 175, 177 | Schema edits stay serial: each regenerates the single migration file. This phase's schema work is in `S/schema/301-auth-functions.sql` (`private.caller_entity_ids`) and `503-entity-rpcs.sql` (the two functions); `idx_grants_one_candidate_editor` in `300-auth-tables.sql` is kept as it was (D-02). After a schema change: regenerate, reset, `yarn db:types` before pgTAP | those three files; `packages/supabase-types` |
| O-4 | every later phase that edits a contestant load | Neither protected load reads the URL tracked: the user-level load reads the two entity params for the dependency alone, the entity-level load reads the two params and nothing else, the root and the resolver read no `url` property. Each has a read-recording test that fails on any other tracked read | `layout.tracking.test.ts` beside each of the two layout loads, `page.tracking.test.ts` beside the root and the resolver, `loadTracking.testUtils.ts` |
| O-5 | Phase 174 | A grant written after the token was issued: not listed nor readable when the entity is not publicly visible; listed and readable but every write refused when it is; a removed grant stops being listed at once. The session is refreshed after a claim, before the first read or write. A claim on a candidate that has an editor fails on `idx_grants_one_candidate_editor` and is a refusal. Only `(entity, editor)` grants on a candidate or an organization make an entity selectable | `S/tests/database/36-entity-identity.test.sql`; item 13 of the list below; todo `2026-10-06-173-refresh-the-session-after-a-claim.md` |
| O-6 | Phase 176 | The `candidateNoNomination` sign-out lives in the entity-level load, stage 4, and nowhere else; the one-entity read does not require a nomination. Task state hangs off the entity-level store, which holds nothing until its first `init` and is left by `leaveEntity()` when the entity layout is torn down. The log line `Error formatting nomination` is produced three times in every full run and is not diagnosed | `F/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/+layout.server.ts` and `+layout.svelte`; `F/lib/contexts/contestant/contestantUserDataState.svelte.ts`; todo `2026-10-06-173-nomination-format-error-logged-in-every-run.md` |
| O-7 | Phase 175 | The writer and the store serve organizations: `updateAnswers`, `overwriteAnswers`, `updateEntityProperties` and the upload helper dispatch on the target's type through `ENTITY_TABLES`. The context's question scope still names the candidate type (`const entityType = ENTITY_TYPE.Candidate`). `updateEntityProperties` is the method that will save an organization's `name` and `short_name`; `EditableEntityProps` holds `image` alone today. No organization save has been shown through the UI: the integration test shows it through the adapter. The widened `page.params` annotation in the context can go | `F/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts`; `F/lib/contexts/contestant/contestantContext.svelte.ts`; `173-03-SUMMARY.md` § *For Phase 175*; todo `2026-10-06-173-widened-page-params-annotation-in-contestant-context.md` |
| O-8 | Phase 179 | `findExistingCandidate` ends in `.maybeSingle()` and throws for a returning identity-provider user who edits two candidates of the project, which this phase makes possible. A named input, not a fix. `identity-callback` redirects to `/contestant`, now the root's three-way decision. The two opt-in bank-auth projects were not run in this phase | `S/functions/identity-callback/candidateRecord.ts`; todo `2026-10-06-173-identity-callback-lookup-throws-for-two-candidate-grants.md` |
| O-9 | Phase 177 | The entity path is `/contestant/<entityType>/<entityId>/…` (`CONTESTANT_ENTITY`), guarded by the `servedEntityType` and `uuid` matchers. The card list is reusable: `EntityCard` with `headerOnly` and `showType`, grouped by `entitySelection.helpers.ts`; `showType` reads `common.<type>.singular` for all four entity types. `provideEntityData` does not reset the entity collections (item 62) and `pageStyles.push` exists (item 61) | `F/lib/routes/route.ts`; `F/params/`; `F/lib/dynamic-components/entityCard`; `F/routes/contestant/(protected)/entitySelection.helpers.ts` |
| O-10 | Phases 176 to 179, Phase 178 first | The gate order holds: the gates run on user-level data in the user-level load, then the root, then an entity's home. The "nothing to edit" view is a component with a `title` and `children`, and the support block is a component of its own; both are what a later phase shows a user whose email proved no invitation or whose claim produced no grant. `LogoutButton` logs out at once when no entity is loaded | `F/lib/contestant/components/nothingToEdit`, `…/contactSupport`, `…/logoutButton`; `F/lib/contestant/gates` |
| O-11 | Phase 172's TOU-F01 | "Primary editor" is definite for a candidate only, while `idx_grants_one_candidate_editor` stands; an organization may have several editors | `S/schema/300-auth-tables.sql`; todo `2026-10-06-172-admin-confirm-requires-editor-acceptance.md` |
| O-12 | every phase with an E2E spec on the base dataset | The base dataset serves both types (`contestantApp.entityTypes: ['candidate', 'organization']`), so the app's name and the login heading are the two-type ones in every base spec; every perm setup replaces the settings row with one that serves candidates alone. Three unconfirmed rows are reserved for entity selection, and the three identities and two read-only sessions of `data-setup-entity-selection` exist until the perm chain's first pre-clear. A reader of either session runs before the perm chain. The scan project holds 22 scans | `packages/dev-seed/src/templates/e2e/base.ts`; `tests/tests/setup/contestant/entity-selection.setup.ts`; `tests/tests/utils/testCredentials.ts`; `tests/playwright.config.ts` |

**Todos filed by this plan** (all under `.planning/todos/pending/`): `2026-10-06-173-identity-callback-lookup-throws-for-two-candidate-grants.md` (Phase 179), `2026-10-06-173-refresh-the-session-after-a-claim.md` (Phase 174), `2026-10-06-173-no-entity-name-on-answering-pages.md` (the recorded limitation of U-09, for the operator), `2026-10-06-173-writer-integration-test-runs-in-no-ci-job.md`, `2026-10-06-173-terms-of-use-view-phone-overflow-and-focus.md`, `2026-10-06-173-nav-drawer-does-not-close-on-escape.md`, `2026-10-06-173-nomination-format-error-logged-in-every-run.md`, `2026-10-06-173-widened-page-params-annotation-in-contestant-context.md`. The native-speaker review of the eight constructed strings was already filed by 173-09 (`2026-10-06-native-speaker-review-profile-selection-strings.md`); it was brought up to date, not duplicated.

## After 173-13

**Written by:** plan 173-13, Task 4. Stage 5, part 3 of 3: the three new surfaces are inside the axe family in both themes, the docs and the tests' README describe the tree, the todos are filed, and the closing gate was made on one tree. Tree `2ea3b9d8d` (the last commit outside `.planning/`); the runs record head `c8db3b8fc`, which differs from it under `.planning/` alone.

**The scan entries** (`tests/tests/specs/a11y/contestant-a11y.spec.ts`; each emits a light scan and a dark twin through `declareScans`, so through `toScanEntry` and `assertAxeScan`):

| Entry | Table | Session (`test.use` in its own `describe`) | Route key | Content anchor | Reach marker | `reach` |
|---|---|---|---|---|---|---|
| `contestant-entity-selection` | `MULTI_ENTITY_AXE_ROUTES` | `MULTI_ENTITY_STORAGE_STATE` | `ContestantAppHome` | `testIds.voter.results.card` | `testIds.contestant.entitySelection.list` | none |
| `contestant-nav-menu-switch` | `MULTI_ENTITY_AXE_ROUTES` | `MULTI_ENTITY_STORAGE_STATE` | `ContestantAppHome` | `testIds.shared.navigation.menuItem` | `testIds.contestant.nav.switchEntity` | activates the first card, waits for `contestantHomeUrlRe()` and the home's status message, opens the drawer with `navMenu.openMobileNav()` and calls `expectSwitchEntityItem()` |
| `contestant-nothing-to-edit` | `NO_ENTITY_AXE_ROUTES` | `NO_ENTITY_STORAGE_STATE` | `ContestantAppHome` | `testIds.contestant.nothingToEdit.email` | `testIds.contestant.nothingToEdit.logout` | none |

`contestant-a11y-scan` depends on `data-setup-base`, `auth-setup` and `data-setup-entity-selection`. Enumerated before each run (`npx playwright test -c playwright.config.ts --grep-invert @probe --list` in `tests/`): 198 tests in 102 files, 103 projects, 22 in `contestant-a11y-scan` (192 and 16 before).

**What the six scans reached, read from the reach proofs the slice attached** (`tests/e2e-runs/173-e2e/173-13-axe-slice/results.json`):

| Scan | Settled URL | Marker nodes | `<h1>` | Violations |
|---|---|---|---|---|
| `contestant-entity-selection`, light and dark | `/contestant` | 1 | Choose a Profile to Edit | 0 and 0 |
| `contestant-nav-menu-switch`, light and dark | `/contestant/candidate/<uuid>` | 1 | You’re Ready to Roll! | 0 and 0 |
| `contestant-nothing-to-edit`, light and dark | `/contestant` | 1 | Nothing to Edit Here | 0 and 0 |

No component was changed: all six scans were green on their first run, with no axe violation and no raw-key finding.

**The slice — `tests/e2e-runs/173-e2e/173-13-axe-slice`, head `b1bec9cc7`, wrapper status 0.** 30 tests, 30 passed, 0 failed, 0 flaky, 0 did not run, six projects. Window 21:52:06 to 21:52:35 local, on battery power under `caffeinate -dimsu`, `sleep_entries_in_window: 0`. `node …/173-verdict.mjs e2e 173-13-axe-slice --allow-slice --expect-project contestant-a11y-scan --same-projects-as 173-12-spec --except contestant-a11y-scan=6` exited 0 on that tree: `contestant-a11y-scan` 22 against 16, and `auth-setup` 2, `data-setup-base` 1, `data-setup-entity-selection` 3, `data-teardown-base` 1 and `data-teardown-entity-selection` 1 each at its total in `173-12-spec`. It was the first attempt. On any later tree the same command reports the run as stale, as it should.

**The negative control — `tests/e2e-runs/173-e2e/173-13-negative-control`, RED on purpose and kept.** (The host slept from 21:52:58 to 21:53:19, between the slice and this run and inside neither; see `## Closing gate`.) With one line added to `NothingToEdit.svelte` and not committed (`<button type="button" class="btn"></button>` after the next-steps paragraph), the scan project was run again on the tree of `b1bec9cc7` plus that line: 30 tests, 28 passed, 2 failed, Playwright status 1. The two failures are `contestant-nothing-to-edit` and its dark twin, each with one violation in its attachment, `button-name`, impact `critical`, naming the planted node; every other scan passed. The file was then restored with `git checkout --` and its SHA-256 is the one read before the edit (`b5bf0895…dd739c`). Window 21:53:39 to 21:54:13 local. The run was made through `tests/scripts/e2e-run.sh` directly, because `173-e2e.sh` refuses a working tree with an uncommitted change; its directory therefore holds no `head`, `command`, `summary.json` or `power.txt`, and its `worktree-status.txt` names the one modified file. It is not a run of the suite and no verdict reads it.

**Counts stated on the tree, corrected to what was measured** (`151f89d67`): the spec's docblock (eleven surfaces, 22 scans, the dark guard on all eleven twins, twelve public routes outside the protected group where it said eleven and listed twelve); `axeScan.ts` twice and `rawKeyScan.ts` twice (36 scanned surfaces, 14 voter and 22 contestant); `scripts/assert-a11y-scan-wiring.mjs` three times (22). The guard's four checks are as they were: `git show 151f89d67 -- scripts/assert-a11y-scan-wiring.mjs` changes two comment lines and one message string. `tests/README.md` has a section on the contestant scan: the entries by session.

**Docs.** New page `apps/docs/src/routes/(content)/developers-guide/contestant-app/entity-selection/+page.md`, registered in `navigation.config.ts` after "Login and password reset". The routing page's tree table named the app's directory `candidate/`; it says `contestant/`, and the protected group's row points at the new page. `apps/frontend/src/routes/contestant/README.md` describes the tree. `yarn workspace @openvaa/docs generate:docs` exited 0 and left the generated route map and the generated component listing as they were: both already matched the tree. `validate:links --check` exits 0.

**Skills.** Read and left as they were, because each already says what the tree holds: `context-reactivity.md` names `user`, `entities`, `selectedEntity` and `homeRoute`; the components skill's counts re-measured equal (`export let` 0, `$$Props` 0, `<slot` 0, 103 files calling `$props()`, 103 `*.type.ts`, `concatClass` in 61 files of the three directories and 68 of `apps/frontend/src`); the database skill's item 9 describes the two functions. `bash .claude/scripts/audit-skill-links.sh components` exits 0 (28 checked, 0 dangling); the whole audit exits 1 with `Checked: 719  Dangling: 222`, the count 173-02 recorded before and after its own edit.

**Counts.** 198 E2E tests in 103 projects. Read from this plan's gate set and unchanged: frontend unit tests 2546 passed and 7 skipped in 159 files and one skipped file, dev-seed unit tests 1015 in 67 files, pgTAP 38 files and 1447 tests. The tests' utility suite (`yarn vitest run --config tests/vitest.config.ts`, run by hand, in no gate row): 73 tests in 5 files, exit 0.

**State left behind.** The gate set reset the local database; after the E2E run `yarn db:seed:default` exited 0 (752 rows). Read with `psql` afterwards: no auth user on `test.openvaa.local` (two users, the seed's), no `test-` candidate or organization, two rows in `grants`. No dev server: 5173 and 5273 have no listener. `yarn db:status` exits 0.

## Closing gate

**Written by:** plan 173-13, Task 4 (D-24). Every instrument below describes one tree: head `c8db3b8fc`, whose last commit outside `.planning/` is `2ea3b9d8d`.

label: `173-13-final`

**Gate set — `tests/e2e-runs/173-gates/173-13-final`, exit 0, twelve rows, every status 0.** Window 22:05:48 to 22:09:14 local, on AC power under `caffeinate -dimsu`; `power.txt` records `sleep_entries_in_window: 0`. `node …/173-verdict.mjs gates 173-13-final` exits 0: twelve rows expected, twelve recorded, head `c8db3b8fc` tree-equal to HEAD outside `.planning/`. It was the first attempt.

| Row | Status | Seconds |
|---|---|---|
| typecheck | 0 | 19 |
| lint | 0 | 45 |
| types-regen | 0 | 31 |
| types-clean | 0 | 0 |
| sql-lint | 0 | 3 |
| pgtap | 0 | 5 |
| unit | 0 | 60 |
| check-frontend | 0 | 8 |
| build | 0 | 15 |
| format | 0 | 18 |
| docs-links | 0 | 1 |
| name-gate-self-test | 0 | 1 |

**The gated integration test — `tests/e2e-runs/173-gates/173-13-integration.json`, on head `c8db3b8fc` (`173-13-integration.head`), exit 0:** `numPassedTests` 7, `numFailedTests` 0, `numPendingTests` 0, `numTotalTests` 7, `success` true. Run after the gate set, on the database its reset left, with the required-run variable set and the three values read from `supabase status -o env` into shell variables; neither the log nor the report holds a key. The seven are the organization save and the six refused writes.

**The two verdicts.** `173-verdict.mjs greps` exits 0: no hit for `get_candidate_user_data`, `ERR_ENTITY_IDENTITY_AMBIGUOUS`, `ContestantContext-contestantUserDataStore-editedAnswers` or `userNoCandidate`. The four `git grep` commands of the plan's verification block, run by hand, each print nothing and exit 1. `173-verdict.mjs exemptions` exits 0: the name gate's list holds two entries, `invite-candidate` and the three shown names of the app, and none naming the deleted function (item 1 of the list below: the plans' "exactly one" describes a list that never existed).

**E2E — `tests/e2e-runs/173-e2e/173-13-final`, the full default suite, wrapper status 0, Playwright status 0.**

closing_e2e_counts: total 198, passed 198, failed 0, flaky 0, skipped 0, didNotRun 0 — 103 projects, no retry, one preflight success, no preflight failure

Window 22:10:09 to 22:15:45 local, on AC power under `caffeinate -dimsu`; `sleep_entries_in_window: 0`. `node …/173-verdict.mjs e2e 173-13-final --same-projects-as 173-12-spec --except contestant-a11y-scan=6 --expect-project contestant-entity-selection --expect-project contestant-a11y-scan --expect-project contestant-journey` exits 0: 103 projects compared, 0 not as expected. It was the first attempt.

| Named project | Total | Passed |
|---|---|---|
| `contestant-entity-selection` | 8 | 8 |
| `contestant-a11y-scan` | 22 (16 in `173-12-spec`) | 22 |
| `contestant-journey` | 1 | 1 |

The six new scans each passed with an empty violations attachment in this run too. The dev-server log holds none of `effect_update_depth_exceeded`, `Cannot set an answer`, `Cannot reload entity data`, `hydration_mismatch`, `loginFailed`, `candidateNoNomination`, `Missing parameter`, `ERR_TOO_MANY_REDIRECTS`, `is not filled`, `Error providing the user` or `Error resolving the user`, and `Error formatting nomination` three times, as before.

**The host's power log.** `pmset -g log`, read after the closing run, holds three Sleep entries after 21:40, and none falls inside a run window of this plan:

| Entry | Wake | The runs around it |
|---|---|---|
| `2026-10-06 21:52:58 +0300 Sleep  Entering Sleep state due to 'Clamshell Sleep'` | 21:53:19 | 23 seconds after the slice ended (21:52:06 to 21:52:35) and 20 seconds before the negative control started (21:53:39 to 21:54:13) |
| `2026-10-06 21:59:10 +0300 Sleep  Entering Sleep state due to 'Clamshell Sleep'` | a DarkWake at 22:00:00 | no run in flight |
| `2026-10-06 22:00:45 +0300 Sleep  Entering Sleep state due to 'Maintenance Sleep'` | 22:01:07, full wake 22:01:08 | no run in flight; the gate set started at 22:05:48 |

The lid was closed twice while this plan worked, both times between runs. The host went to AC power between the two: the slice and the control ran on battery, the gate set and the closing run on AC. No run of this plan is void, and none was made twice.

**Not part of this gate.** The two opt-in bank-auth projects and the visual project were not run. The bank-auth projects were last green at Phase 172's close and are unexercised since this phase changed the login gate, the app root and the route tree; `identity-callback` redirects to `/contestant`, which is now the root's three-way decision.

**The E2E counts of every label of the phase** (`tests/e2e-runs/173-e2e/<label>/summary.json`; the head is the one the run recorded):

| Label | Started (local) | Head | Scope | Total | Passed | Failed | Flaky | Skipped | Did not run | Projects | Sleep entries | What it is |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `173-01-baseline` | 11:43:24 | `9f888dfcd` | full | 180 | 87 | 1 | 0 | 0 | 92 | 100 | 3 | VOID: the host slept during the run |
| `173-01-baseline-r2` | 12:38:21 | `9f888dfcd` | full | 180 | 180 | 0 | 0 | 0 | 0 | 100 | 0 | the baseline |
| `173-02-schema` | 13:22:13 | `89acaff82` | full | 180 | 180 | 0 | 0 | 0 | 0 | 100 | 0 | closes 173-02 |
| `173-03-writer` | 13:58:59 | `c921d473e` | full | 180 | 85 | 1 | 0 | 0 | 94 | 100 | 0 | RED, kept; fixed in 173-03 |
| `173-03-writer-r2` | 14:07:55 | `b1ec2b99f` | full | 180 | 83 | 3 | 0 | 0 | 94 | 100 | 0 | RED, kept; made after a fix |
| `173-03-preview-probe` | 14:12:20 | `cafcdba51` | `contestant-journey` | 5 | 5 | 0 | 0 | 0 | 0 | 5 | 0 | a slice |
| `173-03-writer-r3` | 14:17:11 | `cafcdba51` | full | 180 | 124 | 1 | 0 | 0 | 55 | 100 | 0 | RED, kept; made after a fix |
| `173-03-profile-probe` | 14:22:42 | `43385c089` | `perm-answers-locked` | 78 | 78 | 0 | 0 | 0 | 0 | 48 | 0 | a slice |
| `173-03-writer-r4` | 14:29:21 | `43385c089` | full | 180 | 180 | 0 | 0 | 0 | 0 | 100 | 0 | closes 173-03 |
| `173-05-prep` | 15:19:00 | `bf2fa8d8a` | full | 180 | 180 | 0 | 0 | 0 | 0 | 100 | 0 | closes 173-05 (and 173-04) |
| `173-07-split` | 16:58:13 | `e7a0aade6` | full | 180 | 180 | 0 | 0 | 0 | 0 | 100 | 0 | closes 173-07 (and 173-06) |
| `173-08-move` | 17:44:51 | `24f23def5` | full | 180 | 180 | 0 | 0 | 0 | 0 | 100 | 0 | the URL move, first run |
| `173-08-move-r2` | 17:57:28 | `1afcbe1b6` | full | 180 | 180 | 0 | 0 | 0 | 0 | 100 | 0 | closes 173-08, on a tree with more assertions |
| `173-10-screens` | 20:39:45 | `4bf684612` | full | 180 | 180 | 0 | 0 | 0 | 0 | 100 | 0 | closes 173-10 (and 173-09) |
| `173-11-base` | 21:06:44 | `8d223fb7c` | full | 180 | 180 | 0 | 0 | 0 | 0 | 100 | 0 | closes 173-11 |
| `173-12-slice` | 21:31:08 | `b56f0ae7c` | `contestant-entity-selection` | 16 | 13 | 3 | 0 | 0 | 0 | 6 | 0 | RED, kept; a fixture pressed Escape |
| `173-12-slice-r2` | 21:32:48 | `b6897fd31` | `contestant-entity-selection` | 16 | 16 | 0 | 0 | 0 | 0 | 6 | 0 | made after the fixture fix |
| `173-12-spec` | 21:37:34 | `b6897fd31` | full | 192 | 192 | 0 | 0 | 0 | 0 | 103 | 0 | closes 173-12 |
| `173-13-axe-slice` | 21:52:06 | `b1bec9cc7` | `contestant-a11y-scan` | 30 | 30 | 0 | 0 | 0 | 0 | 6 | 0 | the six new scans |
| `173-13-negative-control` | 21:53:39 | `b1bec9cc7` plus one planted line | `contestant-a11y-scan` | 30 | 28 | 2 | 0 | 0 | 0 | 6 | not recorded | RED on purpose, kept |
| `173-13-final` | 22:10:09 | `c8db3b8fc` | full | 198 | 198 | 0 | 0 | 0 | 0 | 103 | 0 | the closing run |

Three further directories, `173-03-writer-diagnosis`, `-r2-diagnosis` and `-r3-diagnosis`, hold 173-03's notes on its red runs and no run. Every `-rN` above other than `173-01-baseline-r2` is a run made after a change to the tree, not a second run of an unchanged tree.

**The five roadmap criteria, on this tree.**

1. *A user holds editor grants on several entities and signs in normally, with the index kept (ENT-03).* `data-setup-entity-selection` registers a user who edits two candidates and an organization and signs that user in through the login form (3 of 3 in `173-13-final`); `36-entity-identity.test.sql` lists several entities for one caller and holds the assertions on `idx_grants_one_candidate_editor` (the `pgtap` row, 38 files and 1447 tests); the `greps` verdict shows the ambiguity raise and the function that made it are gone.
2. *A multi-entity user chooses on the selection screen, a single-entity user never sees it, and a user with nothing to edit is told so (ENT-01).* `contestant-entity-selection`, 8 of 8: three cards in two groups; the base candidate's session redirected from the root by the server; the "nothing to edit" view with the email and the support button. The three surfaces scanned in both themes, 6 of 6 with no violation.
3. *The user switches without signing out, and every page shows and saves the selected entity's data (ENT-02).* The same spec: the switch item leads to the selection with focus on its heading; an unsaved answer is kept under its own entity's key and is absent on the other; a save changes the selected candidate's row and leaves the other's, read with the service role.
4. *An organization's data loads and saves through the same writer (GEN-02).* `173-13-integration.json`, 7 passed and none skipped: the organization save and the six refused writes through the adapter; the spec reaches the organization's home with the organization's name in its heading.
5. *The selection spec and the full suite are green (E2E-02 in part, E2E-03).* `173-13-final`: 198 of 198 in 103 projects, 0 failed, 0 flaky, 0 did not run, every project at its total in `173-12-spec` except the scan project at exactly six more.

## What differs and which plan it touches

1. **The name gate's exemption list holds three entries, not two** (Names: *Name gate, exemption list*). After 173-02 Task 4 deletes the function's line it holds **two** — `invite-candidate` and the three shown names — not one. The sentences to correct there say "exactly three" and become "exactly two"; nothing on the tree says "exactly two" about this list. Ruling O-Q4's "drops to one" and the `exemptions` verdict of the plans ("exactly one entry") describe a list that never existed: `173-verdict.mjs exemptions` is written to pass on exactly those two entries with no entry naming the function. Touches 173-02 Task 4 and 173-13 Task 4.
2. **A gate run that includes `types-regen` resets the local database** (Facts X1, X2). Every plan that runs the full gate set: run the gate set first and the E2E run after it; local data, the `default` dataset included, is gone after the gate set; re-seed with `yarn db:seed:default` at the end. The hand-made `yarn db:reset` that 173-13 Task 4 step 1 asks for before the gate set is then made a second time by the row. A `--rows` subset without `types-regen` resets nothing. Touches 173-02, 173-03, 173-05, 173-07, 173-08, 173-10, 173-11, 173-12, 173-13.
3. **There is no header logout button** (Names: *Header return and logout*). Any step that expects one — a header sign-out on H, on the "nothing to edit" view or in the selection spec — describes something that does not occur. The views' own `LogoutButton` and the menu are the sign-out paths. Touches 173-07 Task 4 ("the menu and the header"), 173-09 Task 3, 173-10 and 173-12 Task 3.
4. **The fixed draft key is `ContestantContext-contestantUserDataStore-editedAnswers`** (Names; Fact F8). It is the third literal of the closing searches. The new per-entity stem the plans choose, `contestantContext-userData-editedAnswers-<type>-<id>`, does not contain it, so the search can be empty. Touches 173-04 Task 2 and 173-13 Task 4.
5. **The session helper is not importable** (Facts A3, X3) and **the base candidate's session path is not in `testCredentials.ts`** (Names: *Stored-session path constants*). Touches 173-12 Task 1.
6. **The logged-in menu's ordered item list is `CONTESTANT_NAV_LOGGED_IN`, a constant of the journey spec, not of the nav-menu fixture** (Names: *Nav-menu fixture*), and it is not exported. A second spec that asserts the menu states its own list or the constant moves to a shared module. Touches 173-10 Task 4 and 173-12 Task 3.
7. **Stated scan counts.** The a11y spec docblock, `axeScan.ts` and `rawKeyScan.ts` state 16 contestant scans and 30 surfaces; `rawKeyScan.ts` also still says "14 routes x 2 themes = 28 surfaces" near its top, and `scripts/assert-a11y-scan-wiring.mjs` says 14 in three places. `tests/README.md` has no section on the contestant scan. Touches 173-13 Task 1 and Task 2.
8. **The base-dataset heading is asserted through the catalogue** (Fact A5), so widening the served types changes which key the journey spec must read, not a literal. Touches 173-11 Task 2.
9. **The definer censuses of `07-rpc-security` Section 8c hold six and seven names** (Names). The research's table of measured behaviour lists six for `authenticated` because it predates `contestant_app_public_config`. "Unchanged" in 173-02 means unchanged from these two strings. Touches 173-02 Task 2.
10. **The layout context's page-style call is `usePageStyles(overlay)`, not `pageStyles.push`** (Names). H's scoped background goes through it. Touches 173-10 Task 2.
11. **pgTAP file 37, Section 7.** A function that reads `terms_of_use_acceptances`, or a fixture row for it inside `create_test_data`, turns the census red on purpose. The two new functions do not read it. Touches 173-02 Task 1 and Task 2.
12. **This host can sleep in the middle of a run** (Baseline: the first E2E attempt). Both drivers write `power.txt` into the run directory: the power source at the start and the end, and the host's Sleep, Wake and DarkWake entries inside the run window with a `sleep_entries_in_window:` count; `173-verdict.mjs` prints it. A run whose window holds a Sleep entry is VOID, not red: its directory is kept and the run is made again under `<label>-r2`, which the verdict resolves from the plain label. On battery, start a run under `caffeinate -dimsu`; that does not stop a lid-closed sleep, so the power record is still read before the result. Touches every plan that runs the gate set or the suite.
13. **A grant the token predates is served at once when its entity is publicly visible** (measured by 173-02; pinned in `36-entity-identity.test.sql`). The plans say a grant written after the token was issued "is neither listed nor readable" until the token refreshes. That holds for an entity that is not publicly visible. For a confirmed, nominated entity of an open project the row is already readable by every authenticated caller, so `get_user_entities` lists it and `get_entity_user_data` returns it at once; what waits for the refresh is every WRITE (`UPDATE` affects no row, `upsert_answers` raises `Entity not found or access denied`, an upload is refused). The list and the read still agree in every case. Touches 173-03 (a save can fail for a listed entity until the session refreshes), 173-07 and 173-08 (the root's redirect target is readable, so no loop), and Phase 174 (refresh the session after a claim, before the first write).
14. **The write-refusal matrix holds three cited and six added cells, not four and five** (`## Write refusals`). The assertion the plans cite for `upsert_answers` between two candidates targets a candidate of another project. Touches 173-03 (its threat rows T-173-54 to T-173-56 are covered as recorded there).
15. **The two sections above this one were inserted by 173-02 before this list,** so that this list stays the file's last section. `## Write refusals` and `## After 173-02` are where the plans say they are, by heading.
16. **A store method called inside an effect must not read what it later writes** (measured by 173-03: 198 one-entity reads in one journey test). `reloadEntityData` reads the loaded entity untracked, and the preview's effect depends on the loaded entity's type and id as one derived string. Any later caller that starts a reload from an effect, or any new store method that reads the saved data before its first await, needs the same care. Touches 173-04 (the store keyed by entity), 173-08 and 173-09 (entity switching).
17. **The layout loads the store in an effect, after the page's own effects have run on mount, and not at all on the server.** A page that renders a part only when the store holds an entity renders nothing for it on the server and on first paint; `perm-answers-locked` counts the profile's inputs without waiting and caught that. A part is left out for a known organization, never shown only for a known candidate. Touches 173-07 to 173-10 and Phase 175.
18. **`## After 173-03` was inserted before this list,** as the two sections of 173-02 were, so this list stays the file's last section.
19. **Drafts are per entity, and the store holds nothing until its first `init`** (173-04). `setAnswer` throws when no entity is loaded; `resetAnswer`, `resetAnswers` and `resetUnsaved` do nothing to answers then. The draft is read from storage at `init`, in the layout's effect, not when the store is constructed, so `hasUnsaved` and `unsavedQuestionIds` are empty on the server and on first paint, as the saved data is (item 17). `leaveEntity()` drops the saved data, the image edit and the handle and writes nothing; `reset()` is the logout path and removes every key under the stem. `save()` and `reloadEntityData()` do not write a result into the store when another entity was loaded, or this one left, while the call was in flight; a page that awaits either must not assume the store still holds the entity it asked about. Touches 173-07 (the first caller of `leaveEntity`), 173-08 and 173-09 (switching), 173-12 (the spec proves a draft through a reload, and can read the key with `editedAnswersKey`'s form).
20. **`## After 173-04` was inserted before this list,** as the earlier sections were; the plan's word "append" is read that way so that this list stays the file's last section.
21. **`contestantCtx.isAuthenticated` was a value copied once, when the context was constructed** (measured by 173-05 with the real auth context: its own accessor went from false to true on a session change and the contestant context's stayed false). The auth members reached the context through an object rest and `Object.assign`, which read the accessor once. It is now a prototype getter that re-reads the auth context, as the admin context's is. Whether the app remounted the layout on every sign-in, and so hid this, was not measured. Touches 173-07 to 173-10 (the menu's rules read `isAuthenticated` and `selectedEntity`).
22. **The generated type of `page.params` holds only the params some route declares,** and no route declares `entityType` or `entityId` until 173-08. The context reads the two through a destructuring annotated `Record<string, string | undefined>`; once the routes exist the annotation can go. Touches 173-08.
23. **The entity's user data holds no `user`, and the one-entity read makes no user lookup** (173-05). The signed-in user is `contestantCtx.user`, from `page.data.user`, which the protected load returns in both of its shapes; it is set on the server and on first paint, unlike the store. `page.data.user` and `page.data.entities` are typed in `App.PageData`. Touches 173-07 (the load split must keep returning `user` and `entities` at the level every protected page inherits) and 173-10 (the signed-in email on the "nothing to edit" view).
24. **This phase's UI contract names a fourth accessor, `homeRoute`; 173-05 adds three.** Its plan lists `user`, `entities` and `selectedEntity` and no other, and 173-07's Task adds `homeRoute` with the menu's home item. `homeRoute` is not on the tree yet. Touches 173-07.
25. **An organization editor passes the login form from 173-05 on.** In the load, a user whose served list holds exactly one entity is served it, whatever its type, and is signed out with `candidateNoNomination` when it has no nomination; a served list of none or of several ends in the `loginFailed` sign-out until 173-10. No test identity holds an organization grant, so no browser has shown any of the three. Touches 173-10 and 173-11.
26. **`## After 173-05` was inserted before this list,** as the earlier sections were.
27. **The from-root Vitest command for the tests' utilities found no file** (measured by 173-06 on `049954855`: `yarn vitest run --config tests/vitest.config.ts preflight` exits 1 with "No test files found"; from inside `tests/` the same three files passed). The config's `include` was read against the directory the run started from. `tests/vitest.config.ts` now states its `root`, so the command the config's docblock, this plan and 173-08 give works from the repository root. The file is not in 173-06's file list. Touches 173-08 Task 4.
28. **Five builders, not four** (173-06). `contestantUrlOutsideRe(subPath)` is added for the profile fixture's "has left the profile page": inside the app and not the named page or anything below it, with or without the entity segment. It does not know the app's pages, so under the app's root it matches every path that is not the named page, a malformed entity segment included. Touches 173-08 (when the segment becomes required, read this builder's test: `/contestant/login` must still count as "left the profile page").
29. **What the helper tightened and what it loosened** (173-06). Tighter than the patterns it replaced: `'exact'` and `'child'` are anchored at the end of the path, so `/contestant/profile/x` is no longer the profile page and `/contestant/questions/a/b` no longer a question page; `'any'` no longer accepts `/contestant/questionsX`. Looser, beside the optional entity segment: `'exact'` accepts a trailing slash and a fragment for both of its callers, where the journey's overview pattern accepted no trailing slash and the localisation spec's no fragment. Touches 173-07 (a URL assertion failing on an unchanged page points here first) and 173-08.
30. **The tests' README had no place that tells an author how to assert a contestant URL or build a contestant route** (173-06). One bullet naming `contestantEntityUrl.ts`, `contestantUrlRe` and `buildEntityLessRoute` was added to its fixture taxonomy. Touches 173-13 (the README pass).
31. **`## After 173-06` was inserted before this list,** as the earlier sections were.
32. **The docs generator stops before its formatter when the link check finds a broken link** (measured by 173-07: `generate:docs` exited 1 on one `github-path` finding and left `navigation.config.ts` and 48 generated component pages unformatted; with the link corrected the second run exited 0 and only the route map differed). A hand-written page that links a moved file by its GitHub path is corrected before the generator is run, not after. Touches 173-08 (the next item's first entry breaks again when the group is renamed).
33. **What 173-07 pointed at the `(entity)` group, and 173-08 points again** when it renames the directory to the two route params: the settings page link in `apps/docs/…/contestant-app/password-validation/+page.md`; the sentences naming the `(entity)` group in `…/contestant-app/login-and-password-reset/+page.md` and `…/contestant-app/registration/+page.md`; the comments citing `contestant/(protected)/(entity)/+layout.server.ts` in `supabaseDataProvider.ts` and `supabaseDataProvider.test.ts`; the docblock of `(entity)/contestantHome.helpers.ts`; the `describe` titles of the two entity-level test files; `CONTESTANT_ENTITY`. Touches 173-08.
34. **Path citations 173-07 left stale on purpose, for 173-08 to correct once.** Each names a page at `contestant/(protected)/<page>` that is now under the group: five fixtures under `tests/tests/fixtures/contestant/` (`contestantHomePage` twice, `contestantPreviewPage`, `contestantProfilePage`, `contestantQuestionPage`, `contestantQuestionsOverviewPage`), `tests/tests/specs/perm/perm-disable-allow-open.spec.ts`, three dev-seed templates (`e2e/perm/perm-disable-allow-open.ts`, `perm-hide-hero.ts`, `perm-localisation-positive.ts`), the example route id in the TSDoc of `routeConsistency.test.ts`, and the literal `/contestant/(protected)/profile` in `route.test.ts`. `apps/frontend/src/routes/README.md` line 10 still says the contestant routes are in `candidate/`; that predates this phase. Touches 173-08.
35. **No unit test mounts the entity layout** (173-07). Its data-apply effect and its `leaveEntity` cleanup are held by svelte-check and by the E2E run above; `termsOfUseLayout.svelte.test.ts` mounts the user-level layout only, and its assertions were inverted for the ungated case. The menu's home item and the header's return callback have no render test either: typecheck and searches only. Touches 173-08 and 173-09 (the first plans in which the layout is torn down and mounted for another entity) and 173-12.
36. **In 173-07 neither load reads a route param, and `homeRoute` answers the app root on every page,** because no route declares `entityType` or `entityId`. Once 173-08's group declares them, `contestantHomeRoute(page.params)` answers the entity home, provided the route builder carries the current page's params into the built route: that is a claim to verify in a browser there, on the menu's home item and on the header's return button. The entity-level guard's expectation for params changes there (it reads exactly the two), `ENTITY_SEGMENT_SOURCE`'s trailing `?` is removed there (item 28's builder test first), and assumption A8, that a matcher route wins over the rest route, is still unmeasured. Touches 173-08.
37. **Help, Privacy, password reset, preregister and register keep `'ContestantAppHome'`** (173-07): they are outside the entity tree and name the app root on purpose. Item 3 holds as written: there is no header logout button, and the condition on `page.data.token` that would show one is dead and was left as it is. Touches 173-08 (menu gating) and 173-10.
38. **The adapter-boundary lint allowlist entry moved with the sign-out** (173-07 Task 2): `apps/frontend/eslint.config.mjs` names `signOutToLogin.ts` where it named the protected load; the list still holds eight entries. An edit to a security-surface lint list, flagged for the operator's review. Touches the phase's review.
39. **The generated component pages hold no page for a route layout** (173-07): the entity layout's `@component` block produced no generated page, and the route map is the only generated page that changed.
40. **`## After 173-07` was inserted before this list,** as the earlier sections were.
41. **The URL move was green on its first browser run** (173-08: `173-08-move`, 180 of 180). The `-r2` beside it is a re-make on a tree that gained test assertions, not a re-run after a host sleep; item 12's reading of the suffix holds everywhere else. Touches the phase's verification.
42. **An entry through a URL that names no entity runs the user-level load twice** (measured at the API gateway by 173-08: two `get_user_entities` calls per `get_entity_user_data` call over a whole suite run). The root or the resolver answers the first request with a redirect and the entity URL is a second request. A navigation between pages of one entity adds neither read. Touches 173-10 (the root gains two outcomes that render instead of redirecting) and 173-12 (a spec that counts reads).
43. **The root's outcome for zero or several entities is the `loginFailed` sign-out, and no test pins it** (173-08, by the plan's ruling 5). The resolver sends the same users to the root, so they end in the same sign-out. A user with several entities who types an entity URL they edit is served it, while the root still signs that user out; no such identity exists before 173-12. Touches 173-10, which replaces the sign-out with screen H and the "nothing to edit" view and pins all three outcomes.
44. **The resolver refuses a question segment that is not a plain id** (173-08 Task 3, beyond the plan): the `contestantEntityPage` matcher sees the segment undecoded and admitted `/contestant/questions/..%2F..%2F..%2Fadmin`, so the load checks the decoded segment against `/^[A-Za-z0-9_-]+$/` and sends anything else to the app root. An open-redirect-class hardening on a security surface, flagged for the phase's review. Touches 173-13 (the docs page on the entity routes).
45. **The root and the entity-level load agree only while the list and the one-entity read agree.** For a user with one entity, the root redirects to the entity the list holds, and the entity-level load redirects to the root when the read finds no row; if the two database functions disagreed the user would loop. `36-entity-identity.test.sql` pins their agreement, item 13 included. Touches 173-10 and Phase 174 (any change to either function).
46. **What the tests' helper says about the app root** (173-08). `contestantHomeUrlRe()` and `isContestantHomePath()` are the entity home and reject `/contestant`; the root has its own builders, `contestantAppRootUrlRe()` and `isContestantAppRootPath()`. `contestantUrlOutsideRe(subPath)` rejects the named page under an entity and without one, and accepts every other path of the app, the root and `/contestant/login` included. `isContestantHomePath` has no caller on the tree. A plain tests-side `buildRoute` on an entity key throws `is not filled`; entity-less navigation goes through `buildEntityLessRoute`. Touches 173-10 and 173-12 (specs that assert the root, H or an entity home).
47. **Item 22's widened annotation is still on the tree** (173-08 did not list the file): `contestantContext.svelte.ts` reads `page.params` through `Record<string, string | undefined>`. The generated type now declares `entityType` and `entityId`, so the annotation and its comment can go in the next plan that edits the context. Touches 173-09 or 173-10.
48. **No load emits `userNoCandidate`** (measured by 173-08: the code is in `loginError.ts`, the message catalogue of seven locales and the generated key type, and in no route). The docs paragraph on the protected loads names `loginFailed` and `candidateNoNomination` only. Touches 173-10, which retires the code, and 173-13's closing search.
49. **Line numbers were dropped from three path citations 173-08 corrected** (`perm-disable-allow-open.ts`, `perm-hide-hero.ts`, `contestantHomePage.fixture.ts`): each cited a line the file no longer holds there. Other line-number citations in the contestant fixtures and perm specs predate this phase and are as they were. Touches 173-13 (the README and comment pass).
50. **Item 35 still holds after 173-08:** no unit test mounts the entity layout, and no spec presses the header's return button. The menu's links are now asserted in the journey spec, on the entity home and on Privacy. 173-09 and 173-10 are the first plans in which the entity layout is torn down and mounted for another entity. Touches 173-09, 173-10 and 173-12.
51. **`## After 173-08` was inserted before this list,** as the earlier sections were.
52. **The Help page is not changed by 173-09** (its ruling 3; 173-10 Task 2 step 9 owns it). The page still renders its own button with `contestant-help-contact-support`, and that id is read by the page and the registry line alone (`git grep -n "contestant-help-contact-support" -- apps tests` on `e0826df94`: two lines). 173-10 renders `<ContactSupport action="email" id={SUPPORT_ANCHOR} class="mt-lg" />` there and removes the registry entry. Until it does, the `#support` fragment of the `'help'` action names no element. Touches 173-10.
53. **`translations.test.ts` held no comparison of parameters between locales** (measured by 173-09; the plans say it asserts identical placeholder sets). It compares key sets and file sets. Across the catalogue one translation uses fewer parameters than English (`sv` `questions.intro.start` has no `{numQuestions}`), which reads as a translator's choice, so no catalogue-wide rule was added. 173-09 added one block that names the eight new keys with their parameters and holds every locale to exactly them, and changed the file count the test states from 47 to 49. Touches 173-10 (retiring `userNoCandidate` removes a key, not a file) and 173-13.
54. **The docs generator's link check reads tracked files only** (measured by 173-09: `generate:docs` exited 1 on four `github-path` findings, "Not a tracked file or directory", for the two new components and their type files, and left the generated pages unformatted, as item 32 describes). `git add` the new component files first, then run the generator. Touches 173-10 and every later plan that adds a component.
55. **The comment-hygiene guard is part of `yarn lint:check` and is not run by ESLint, Prettier or svelte-check.** 173-09's first commit (`7e8ad0158`) put a comment under a comment line that has no closing punctuation, which the guard reads as one comment broken over two lines; typecheck was green at that commit and lint was not, until `e0826df94` moved the comment. Run `node scripts/assert-comment-hygiene.mjs` before a commit that adds a comment. Touches every later plan.
56. **Off an entity, `LogoutButton` opens its "data still missing" modal whenever the context's `unansweredOpinionQuestions` or `unansweredRequiredInfoQuestions` is not empty,** and with no saved entity data those two are ALL of the context's opinion questions and required info questions (`contestantContext.svelte.ts`: `if (!savedData) return this.#opinionQuestions`). `NothingToEdit`'s component cases fake both as empty. Whether they are empty on the app root for a user with no entity, and for a user who came back from an entity, is for 173-10 to show in a browser; its must-have on logout without the modal depends on it. Touches 173-10 and 173-12.
57. **A header-only card keeps the match score and the caller's `children`.** `headerOnly` leaves the `<header>` as it is, the callout included, and drops the alliance summary, sub-matches, featured questions and sub-cards; content a caller passes as `children` still renders. Screen H passes naked entities and no children, so neither shows there. Touches 173-10 and Phase 177.
58. **`showType` reads `common.<type>.singular` for all four entity types;** the catalogue holds `alliance` and `faction` beside `candidate` and `organization`. Touches Phase 177.
59. **Item 47 still holds:** 173-09 did not edit the context, so the widened annotation on `page.params` is still on the tree. Touches 173-10.
60. **`## After 173-09` was inserted before this list,** as the earlier sections were.
61. **`pageStyles.push` exists** (173-10, against item 10): the layout context's `pageStyles` is a `SettingsOverlayApi` with both `push(overlay)`, which returns its own revert, and `use(overlay)`, which is `push` inside an effect of the calling component. H uses `push` from its own effect, as the UI contract writes it. Touches Phase 177 (a selector that shades its view).
62. **`provideEntityData` does not reset the entity collections** (measured by 173-10 in `packages/data/src/root/dataRoot.ts`: `provideData` sets each object into the collection's map by id and returns early for an empty array). The method's docblock and the plans say it resets. An entity provided by one page therefore stays in the root after another page provides its own, and an empty provision removes nothing. H builds its cards only once its own effect has provided the list it is showing, so a stale object of the same id is never rendered. Touches Phase 175 and Phase 177 (a page that reads an entity from the root must know who provided it).
63. **The logout modal asks for a loaded entity** (173-10; item 56): `LogoutButton` logs out at once when `userData.savedEntityData` is unset, which is the case on the root, Help, Privacy and the register page, and on an entity page before the layout's effect has loaded the store. The context's two unanswered lists still hold every question when no entity is loaded; the menu's Opinions item and the entity home read them as before. Touches 173-12 (the spec that signs out from the "nothing to edit" view) and Phase 176.
64. **Passing a gate is not a navigation** (measured by 173-10's probe): after the terms-of-use view's Continue the root showed H with focus on `<body>`, because the gate continues with `invalidateAll()`. Filed in `deferred-items.md` with the 390px overflow of the same view, where the checkbox sits left of the viewport. Both are Phase 172's view. Touches 173-12 (a selection spec that accepts the terms first must not assert focus after it, and must not run the gate at a phone width) and the phase's review.
65. **The journey's menu constants are unedited** (173-10): `CONTESTANT_NAV_LOGGED_IN`, `assertContestantAuthNavPresent` and `assertContestantEntityLessNav` read items by their own test ids or by `nav-menu-item`, and the group title is an `<h4>` outside the list, so none of them sees it. A spec that selects by the prefix `contestant-nav-` would now also match the group's `<section>`; the menu's component test selects `a[data-testid^="contestant-nav-"]` for that reason. Touches 173-12.
66. **Items 47 and 59 still hold:** 173-10 did not edit the context, so the widened annotation on `page.params` is still on the tree. Touches the next plan that edits `contestantContext.svelte.ts`.
67. **`## After 173-10` was inserted before this list,** as the earlier sections were.
68. **The visual project holds four baselines, not two** (173-11): `voter-results-desktop`, `voter-results-mobile`, `contestant-preview-desktop` and `contestant-preview-mobile`. All four compare equal under the widened base dataset, so none shows the app's name or anything else the served types change. The run needs a database reset by the recorded host recipe; with the gate set after it, the database is reset twice. Touches 173-13 (if the closing plan runs the visual project again) and Phase 175 (the preview page of an organization).
69. **The plans' "some thirty candidates and five organizations" is 30 candidates, 5 organizations and 61 nominations before 173-11** (measured on `446dd4bd9`), and 32, 6 and 64 after it. A count taken by searching the template for `external_id: 'test-e2e-base-nom-` reads 107 before and is wrong: it also counts every `parent_nomination` ref. Count rows of the `fixed` arrays instead. Touches 173-12 (a helper that derives a population from the template).
70. **No identity edits the three selection rows, and nothing removes a grant on them between runs** (173-11 seeds rows only). `data-teardown-base` deletes the rows with the dataset; whether that also removes a grant naming one of them was not measured. 173-12's setup clears its own user and grants first, as `auth.setup.ts` does with `unregisterCandidate` for CA-AA-1, and does not assume a fresh database. Touches 173-12.
71. **Item 25 holds on the base dataset now:** organizations are served there, so a user whose only grant is on `test-e2e-base-or-sel` is, by the root load's rule for exactly one served entity, redirected to that organization's home instead of the "nothing to edit" view; in a candidates-only project the same user gets "nothing to edit". Neither was shown in a browser by 173-11: no test identity holds an organization grant yet. Touches 173-12.
72. **`## After 173-11` was inserted before this list,** as the earlier sections were.
73. **The Escape key does not close the navigation drawer** (measured by 173-12's first slice: three cases failed at a fixture line that pressed Escape and asserted the menu hidden). The drawer closes through its close item, the overlay, or a link; `lib/layouts/main/Layout.svelte` has no key handler. The journey spec's `page.keyboard.press('Escape')` after its menu assertions does nothing. Whether a drawer that takes focus should close on Escape is a question for the phase's accessibility review; nothing was changed in the product. Touches 173-13 (a scan of the open multi-entity menu closes it with `navMenu.closeNav()`) and the review.
74. **The base candidate's session path is still declared in `playwright.config.ts` alone** (`STORAGE_STATE`, also spelled in `auth.setup.ts`; item 5). The selection spec imports it from the config, as the visual spec does. Touches 173-13 only if it tidies the declaration.
75. **A full navigation away from an editor with an unsaved edit does not discard the draft** (measured by 173-12's spec: the draft is in storage and shown after a reload, and again after a visit to another entity's URL and back). The mechanism was read from the code and not measured: `PreventNavigation` calls `window.confirm` from SvelteKit's `beforeNavigate`, which on a document unload cannot show a confirm, so the component cancels and `onConfirm`, which discards the draft, runs only on a confirmed in-app navigation. The spec's `nativeDialogs` fixture registers a dialog listener, so it accepts a `beforeunload` prompt itself, and the spec asserts no count of such prompts: none was counted in any run. Touches 173-13 and Phase 175.
76. **The home's heading names the entity only while something is left to do** (`contestantHome.helpers.ts`: the greeting with the name, or `contestantApp.home.ready` when everything is answered). The spec asserts the heading for the organization, which has no answers, and names a candidate through the menu's group title and the URL. Touches Phase 175.
77. **Focus on the selection's heading is asserted after the switch item, a client-side navigation, and nowhere else.** The spec's first visit to the screen is a document load under the stored session; the plan's "focus is on the page heading" for that step was neither asserted nor measured. Touches 173-13 (the scan) and the review.
78. **`data-teardown-entity-selection` runs at the end of the suite, not after the spec:** the first perm setup depends on the spec, so the whole perm chain is a transitive dependent of the setup. The perm head's `test-` pre-clear deletes the three rows long before, and the schema's `cleanup_grants_on_delete` triggers on `candidates` and `organizations` remove a grant with its target (read in `300-auth-tables.sql`; not observed separately in a run, which answers item 70 only by the schema). From then on the multi-entity session has no entity to list; what it shows then was not measured. A reader of either session therefore belongs before the perm chain, as `contestant-a11y-scan` already is. Touches 173-13.
79. **`## After 173-12` was inserted before this list,** as the earlier sections were.
80. **`173-e2e.sh` refuses a working tree with an uncommitted change, so a negative control cannot go through it** (173-13). The control was made through `tests/scripts/e2e-run.sh` directly, which records a dirty tree and does not refuse it; its run directory has no `head`, `command`, `summary.json` or `power.txt`. A later plan that wants a control with the driver's evidence commits the planted defect on a throwaway branch instead. Touches every later plan that records a control.
81. **The docs link check cuts a GitHub link short when the link's LABEL holds a parenthesis or a nested bracket** (measured by 173-13: three `github-path` findings, "Not a tracked file or directory: …/contestant/(protected", for links whose labels were `(protected)/+layout.server.ts`, `(protected)/+page.server.ts` and `[...page=contestantEntityPage]`; the same targets pass under a label without them). Name the group or the rest segment in the sentence and keep the label to the file name. Items 32 and 54 hold: with a finding the generator stops before its formatter.
82. **The plan's "exactly one exemption" is two** (173-13 Task 4; item 1): `173-verdict.mjs exemptions` passes on the two entries the tree holds.
83. **The hand-made `yarn db:reset` of 173-13 Task 4 step 1 was not made** (item 2): the gate set's `types-regen` row resets the database itself, and the driver refuses to start while an E2E run is in flight. One reset, not two.
84. **`scripts/assert-a11y-scan-wiring.mjs` was edited by 173-13 although its Task 1 says "unmodified".** The task's check was observed first, at `b1bec9cc7`, with the script as it was (exit 0). `151f89d67` then corrected the count the script states in two comment lines and one message, at the orchestrator's direction; no check changed, and the guard exits 0 after it.
85. **The generated docs pages did not move in 173-13:** the route map and the component listing already matched the tree, so the plan's two generated files are not in any commit of it.
86. **`contestantContext.svelte.ts` is not in 173-13's file list,** so items 47, 59 and 66 still hold: the widened annotation on `page.params` is on the tree, with a todo naming it for the next plan that edits the context.
87. **`## Obligations to later phases`, `## After 173-13` and `## Closing gate` were inserted before this list,** as the earlier sections were; the plan's word "append" is read that way.
