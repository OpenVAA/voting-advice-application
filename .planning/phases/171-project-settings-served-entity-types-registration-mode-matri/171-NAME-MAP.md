# Phase 171 — Name Map

**Written by:** plan 171-01, Task 1.
**Tree read:** `4c8b80651333901151b5e6cc0a07b17d6df0428b`, branch `feat/entity-signup-multi-grant` — the tree as Phase 170 left it (last non-planning commit `e222a9b88`).
**Sources:** the four `170-*-SUMMARY.md` files, `171-CONTEXT.md` § *Name map (stated once)*, the `files_modified` lists of `171-01-PLAN.md` to `171-04-PLAN.md`, and the tree itself.

The four plans of this phase were written before Phase 170 executed and cite every name in its post-170 form. This file confirms each of those names against the tree. Where the plans and the tree disagree the tree wins, and the row says "differs from the plan".

**Verdict:** every cited name resolves. No row differs from the plan in a way that changes a task; the notes under the table list the four places where a plan's wording is looser than the tree.

## Names

Every path in the Resolved column is tracked (`git ls-files -- <path>` answers non-empty); a symbol is given with the file that declares it.

| Role | Cited in the plans | Today's name before 170 | Resolved | How resolved |
|---|---|---|---|---|
| Settings root (type) | `contestantApp` | `candidateApp` | `contestantApp` in `packages/app-shared/src/settings/dynamicSettings.type.ts` | `git grep -n -F "contestantApp" -- packages/app-shared/src/settings/dynamicSettings.type.ts` |
| Settings root (shipped defaults) | `contestantApp` | `candidateApp` | `contestantApp` in `packages/app-shared/src/settings/dynamicSettings.ts` | `git grep -n -F "contestantApp" -- packages/app-shared/src/settings/dynamicSettings.ts` |
| Settings root (stored schema) | `contestantApp` | `candidateApp` | `contestantApp` in `packages/app-shared/src/data/schemas/storedSettings.schema.ts` | `git grep -n -F "contestantApp" -- packages/app-shared/src/data/schemas/storedSettings.schema.ts` |
| Access key | `access.contestantApp` | `access.candidateApp` | `access.contestantApp` in `packages/app-shared/src/settings/dynamicSettings.ts` | same command; the member sits inside the `access` literal |
| Notification key | `notifications.contestantApp` | `notifications.candidateApp` | `notifications.contestantApp` in `packages/app-shared/src/settings/dynamicSettings.ts` | same command; the member sits inside the `notifications` literal |
| Adapter capability flag | `dataAdapter.supportsContestantApp` | `supportsCandidateApp` | `supportsContestantApp` in `packages/app-shared/src/settings/staticSettings.type.ts` | `git grep -n -F "supportsContestantApp" -- packages apps/frontend/src` |
| Context getter | `getContestantContext` | `getCandidateContext` | `getContestantContext` in `apps/frontend/src/lib/contexts/contestant/contestantContext.svelte.ts` | `git grep -n -F "export function getContestantContext" -- apps/frontend/src` |
| Context getter's conventional local | (the plans say "the existing derived value") | `candCtx` | `contestantCtx` (16 call sites; 4 use `ctx`, `routes/contestant/register/+page.svelte` among them) — declared in `apps/frontend/src/routes/contestant/login/+page.svelte` | `git grep -h -o -P "const \w+ = getContestantContext\(\)" -- apps/frontend/src \| sort \| uniq -c` |
| Alias | `$contestant` | `$candidate` | `$contestant` in `apps/frontend/svelte.config.js` | `git grep -n -F "contestant" -- apps/frontend/svelte.config.js` |
| App library directory | `apps/frontend/src/lib/contestant/` | `apps/frontend/src/lib/candidate/` | `apps/frontend/src/lib/contestant/` (26 tracked files) | `git ls-files -- apps/frontend/src/lib/contestant` |
| App utils directory (plan 3 adds a file here) | `apps/frontend/src/lib/contestant/utils/` | `…/lib/candidate/utils/` | `apps/frontend/src/lib/contestant/utils/` | `git ls-files -- apps/frontend/src/lib/contestant/utils` |
| Nav component | `ContestantNav.svelte` | `CandidateNav.svelte` | `apps/frontend/src/lib/dynamic-components/navigation/contestant/ContestantNav.svelte` | `git ls-files -- apps/frontend/src/lib/dynamic-components/navigation/contestant/` |
| Route tree | `apps/frontend/src/routes/contestant/` | `routes/candidate/` | `apps/frontend/src/routes/contestant/` | `git ls-files -- apps/frontend/src/routes/contestant` |
| App layout | `routes/contestant/+layout.svelte` | `routes/candidate/+layout.svelte` | `apps/frontend/src/routes/contestant/+layout.svelte` | same |
| Login page | `routes/contestant/login/+page.svelte` | `routes/candidate/login/+page.svelte` | `apps/frontend/src/routes/contestant/login/+page.svelte` | same |
| Register page (code entry) | `routes/contestant/register/+page.svelte` | `routes/candidate/register/+page.svelte` | `apps/frontend/src/routes/contestant/register/+page.svelte` | same |
| Register page load options | `routes/contestant/register/+page.ts` | same under `candidate/` | `apps/frontend/src/routes/contestant/register/+page.ts` | same |
| Register layout | `routes/contestant/register/+layout.svelte` | same under `candidate/` | `apps/frontend/src/routes/contestant/register/+layout.svelte` | same |
| Set-password page | `routes/contestant/register/password/+page.svelte` | same under `candidate/` | `apps/frontend/src/routes/contestant/register/password/+page.svelte` | same |
| Pre-registration guard | `routes/contestant/preregister/+layout.server.ts` | same under `candidate/` | `apps/frontend/src/routes/contestant/preregister/+layout.server.ts` | same |
| Pre-registration tree | `routes/contestant/preregister/` | same under `candidate/` | `apps/frontend/src/routes/contestant/preregister/` | same |
| Forgot-password page | `routes/contestant/forgot-password/+page.svelte` | same under `candidate/` | `apps/frontend/src/routes/contestant/forgot-password/+page.svelte` | same |
| Password-reset page | `routes/contestant/password-reset/+page.svelte` | same under `candidate/` | `apps/frontend/src/routes/contestant/password-reset/+page.svelte` | same |
| Help page | `routes/contestant/help/+page.svelte` | same under `candidate/` | `apps/frontend/src/routes/contestant/help/+page.svelte` | same |
| Route keys | `ContestantAppLogin`, `ContestantAppHome`, `ContestantAppRegister`, `ContestantAppSetPassword`, `ContestantAppPreregister`, `ContestantAppForgotPassword`, `ContestantAppHelp` | `CandAppLogin`, `CandAppHome`, `CandAppRegister`, `CandAppSetPassword`, `CandAppPreregister`, `CandAppForgotPassword`, `CandAppHelp` | all seven, under those names, in `apps/frontend/src/lib/routes/route.ts`; the same file also holds `ContestantAppPreregisterIdentityProviderCallback`, `…PreregisterElection`, `…PreregisterConstituency`, `…PreregisterEmail`, `…PreregisterStatus` | `git grep -n -P "^\s+(ContestantApp(Login\|Home\|Register\|SetPassword\|Preregister\w*\|ForgotPassword\|Help)\|AuthCallback\|AuthLogout):" -- apps/frontend/src/lib/routes/route.ts` |
| Auth route keys | `AuthCallback`, `AuthLogout` | `CandAppAuthCallback`, `CandAppLogout` | both in `apps/frontend/src/lib/routes/route.ts` | same command |
| Auth callback route | `routes/api/auth/callback/+server.ts` | `routes/api/candidate/auth/callback/+server.ts` | `apps/frontend/src/routes/api/auth/callback/+server.ts` | `git ls-files -- apps/frontend/src/routes/api/auth` |
| Pre-registration API route | `api/contestant/preregister` | `api/candidate/preregister` | `apps/frontend/src/routes/api/contestant/preregister/+server.ts` | `git ls-files -- apps/frontend/src/routes/api/contestant` |
| Message file, not-supported | `contestantApp.notSupported.json` | `candidateApp.notSupported.json` | `apps/frontend/messages/en/contestantApp.notSupported.json` (present in all seven locales) | `git ls-files -- 'apps/frontend/messages/*/contestantApp.notSupported.json'` |
| Message file, help | `contestantApp.help.json` | `candidateApp.help.json` | `apps/frontend/messages/en/contestantApp.help.json` (present in all seven locales) | `git ls-files -- 'apps/frontend/messages/*/contestantApp.help.json'` |
| Message group, the app's name | `dynamic.contestantAppName` | `dynamic.candidateAppName` | the leaf `contestantAppName` in `apps/frontend/messages/en/dynamic.json`, value "Election Compass for Candidates" (present in all seven locales) | `git grep -n -P '"contestantAppName"\|"contestantAppNotAccessible"' -- apps/frontend/messages/en/dynamic.json` |
| Message group, not accessible | `dynamic.contestantAppNotAccessible` | `dynamic.candidateAppNotAccessible` | the group `contestantAppNotAccessible` in `apps/frontend/messages/en/dynamic.json` | same command |
| Locale set | seven locales `da, en, et, fi, fr, lb, sv` | same | the seven directories under `apps/frontend/messages/` | `ls apps/frontend/messages/` |
| Generated key type | `translationKey.ts` | same | `apps/frontend/src/lib/types/generated/translationKey.ts` (holds `'dynamic.contestantAppName'`) | `git grep -n -E "contestantAppName" -- apps/frontend/src/lib/types/generated/translationKey.ts` |
| Bank-auth setup | `tests/tests/setup/contestant/bank-auth-journey.setup.ts` | `tests/tests/setup/candidate/bank-auth-journey.setup.ts` | `tests/tests/setup/contestant/bank-auth-journey.setup.ts` | `git ls-files -- tests/tests/setup/contestant/` |
| Bank-auth teardown | `tests/tests/setup/contestant/bank-auth-journey.teardown.ts` | same under `candidate/` | `tests/tests/setup/contestant/bank-auth-journey.teardown.ts` | same |
| Template setup helper | `tests/tests/setup/shared/setupFromTemplate.ts` | same | `tests/tests/setup/shared/setupFromTemplate.ts` | `git ls-files -- tests/tests/setup/shared/setupFromTemplate.ts` |
| Journey spec | `tests/tests/specs/contestant/contestant-journey.spec.ts` | `tests/tests/specs/candidate/candidate-journey.spec.ts` | `tests/tests/specs/contestant/contestant-journey.spec.ts` | `git ls-files -- tests/tests/specs/contestant/contestant-journey.spec.ts` |
| A11y spec | `tests/tests/specs/a11y/contestant-a11y.spec.ts` | `tests/tests/specs/a11y/candidate-a11y.spec.ts` | `tests/tests/specs/a11y/contestant-a11y.spec.ts` | `git ls-files -- tests/tests/specs/a11y` |
| Closed-project spec | `tests/tests/specs/perm/perm-closed-project.spec.ts` | same | `tests/tests/specs/perm/perm-closed-project.spec.ts` | `git ls-files -- tests/tests/specs/perm/perm-closed-project.spec.ts` |
| Test-id registry, app-level group | `testIds.contestant` | `testIds.candidate` | the group `contestant` in `tests/tests/utils/testIds.ts` | `git grep -n -P "^\s{2}\w+: \{" -- tests/tests/utils/testIds.ts` |
| Test-id registry, `login` group | `testIds.contestant.login` | `testIds.candidate.login` | the group `login` inside `contestant` in `tests/tests/utils/testIds.ts`, members `email`, `submit`, `errorMessage`, `answersLockedInfo` | `git grep -n -P "^\s{4}login: \{" -- tests/tests/utils/testIds.ts` |
| Playwright project, journey | `contestant-journey` (with `data-setup-contestant-journey`, `data-teardown-contestant-journey`) | `candidate-journey` | all three names in `tests/playwright.config.ts` | `git grep -n -P "name: '[a-z-]*(contestant-journey\|bank-auth)[a-z-]*'" -- tests/playwright.config.ts` |
| Playwright project, a11y scan | `contestant-a11y-scan` | `candidate-a11y-scan` | `contestant-a11y-scan` in `tests/playwright.config.ts` | same file |
| Playwright projects, opt-in bank-auth | `bank-auth`, `bank-auth-journey` | same | `bank-auth`, `bank-auth-journey`, `data-setup-bank-auth-journey`, `data-teardown-bank-auth-journey` in `tests/playwright.config.ts`; their `testMatch` patterns are `/contestant-bank-auth\.spec\.ts/`, `/contestant-bank-auth-journey\.spec\.ts/`, `/bank-auth-journey\.setup\.ts/`, `/bank-auth-journey\.teardown\.ts/` | `git grep -n -F "bank-auth" -- tests/playwright.config.ts` |
| Docs section directory | `apps/docs/src/routes/(content)/developers-guide/contestant-app/` | `…/developers-guide/candidate-app/` | `apps/docs/src/routes/(content)/developers-guide/contestant-app/` (five pages) | `git ls-files -- 'apps/docs/src/routes/(content)/developers-guide/contestant-app/'` |
| Docs page, bank authentication | `…/contestant-app/bank-authentication/+page.md` | same under `candidate-app/` | `apps/docs/src/routes/(content)/developers-guide/contestant-app/bank-authentication/+page.md` | same |
| Docs page, pre-registration | `…/contestant-app/pre-registration-and-invitation/+page.md` | same under `candidate-app/` | `apps/docs/src/routes/(content)/developers-guide/contestant-app/pre-registration-and-invitation/+page.md` | same |
| Docs page, developers' settings | `…/developers-guide/configuration/app-settings/+page.md` | same | `apps/docs/src/routes/(content)/developers-guide/configuration/app-settings/+page.md` | `git ls-files -- 'apps/docs/src/routes/(content)/developers-guide/configuration/app-settings/+page.md'` |
| Docs page, publishers' settings | `…/publishers-guide/app-settings/+page.md` | same | `apps/docs/src/routes/(content)/publishers-guide/app-settings/+page.md` | `git ls-files -- 'apps/docs/src/routes/(content)/publishers-guide/app-settings/+page.md'` |
| Naming gate, script | `assert-no-candidate-app-names.mjs` | (new in 170) | `scripts/assert-no-candidate-app-names.mjs` | `git ls-files -- scripts/assert-no-candidate-app-names.mjs` |
| Naming gate, `lint:check` link | `yarn assert:no-candidate-app-names`, link 8 of 20 | (new in 170) | the script entry and the eighth `&&` link of `lint:check` in `package.json` | `git grep -n -F "assert:no-candidate-app-names" -- package.json` |
| Frontend merge | `mergeAppSettings`, `mergeInitialAppSettings` | same | both in `apps/frontend/src/lib/utils/settings.ts` | `git grep -n -E "mergeAppSettings\|mergeInitialAppSettings" -- apps/frontend/src` |
| Package deep merge (not to be delegated to) | `mergeSettings` | same | `packages/app-shared/src/utils/mergeSettings.ts` | `git ls-files -- packages/app-shared/src/utils/mergeSettings.ts` |
| App context | `appContext.svelte.ts` | same | `apps/frontend/src/lib/contexts/app/appContext.svelte.ts` | `git ls-files -- apps/frontend/src/lib/contexts/app/appContext.svelte.ts` |
| Runes-test harness to model on | `appContext.spread.svelte.test.ts` | same | `apps/frontend/src/lib/contexts/app/appContext.spread.svelte.test.ts` | `git ls-files -- apps/frontend/src/lib/contexts/app/appContext.spread.svelte.test.ts` |
| Provider | `_getAppSettings` | same | `_getAppSettings` in `apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts` | `git grep -n -P "_getAppSettings\(" -- apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts` |
| Provider test | `supabaseDataProvider.test.ts` | same | `apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.test.ts` | `git ls-files` on the path |
| Partial-preserving parse | `parseWithPartialPreserve` | same | `apps/frontend/src/lib/api/adapters/supabase/utils/parseOutcome.ts` | `git grep -n -F "export function parseWithPartialPreserve" -- apps/frontend/src` |
| Seed template, default | `default.ts` | same | `packages/dev-seed/src/templates/default.ts` | `git ls-files` on the path |
| Seed template, E2E base | `BASE_APP_SETTINGS` | same | `BASE_APP_SETTINGS` in `packages/dev-seed/src/templates/e2e/base.ts` | `git grep -n -F "export const BASE_APP_SETTINGS" -- packages/dev-seed/src` |
| Seed template, perm base | `MINIMAL_BASE_APP_SETTINGS` | same | `MINIMAL_BASE_APP_SETTINGS` in `packages/dev-seed/src/templates/e2e/perm/shared.ts` | `git grep -n -F "export const MINIMAL_BASE_APP_SETTINGS" -- packages/dev-seed/src` |
| Pinned settings-key test | `base-app-settings.test.ts` | same | `packages/dev-seed/tests/templates/base-app-settings.test.ts` | `git ls-files` on the path |
| Settings table schema file | `106-app-settings.sql` | same | `apps/supabase/supabase/schema/106-app-settings.sql` | `git ls-files` on the path |
| Precedent definer function | `project_open_for_voters` | same | `project_open_for_voters` in `apps/supabase/supabase/schema/301-auth-functions.sql` | `git grep -n -F "project_open_for_voters" -- apps/supabase/supabase/schema/301-auth-functions.sql` |
| RPC census | Section 8c of `07-rpc-security.test.sql` | same | `apps/supabase/supabase/tests/database/07-rpc-security.test.sql` | `git grep -n -F "Section 8c" -- apps/supabase/supabase/tests/database/07-rpc-security.test.sql` |
| RPC disposition table | `PROJECT_SCOPED_RPCS` | same | `PROJECT_SCOPED_RPCS` in `scripts/assert-project-scoped-queries.mjs` | `git grep -n -F "PROJECT_SCOPED_RPCS" -- scripts/assert-project-scoped-queries.mjs` |
| Generated migration | `00001_initial_schema.sql` | same | `apps/supabase/supabase/migrations/00001_initial_schema.sql` (regenerated by `yarn schema:regenerate`, a script in `package.json`) | `git grep -n -F '"schema:regenerate"' -- package.json` |
| Generated database types | `database.ts` | same | `packages/supabase-types/src/database.ts` (regenerated by `yarn db:types`) | `git ls-files` on the path |
| Database skill pages | `schema-reference.md`, `rls-policy-map.md`, `SKILL.md` | same | `.claude/skills/database/schema-reference.md`, `.claude/skills/database/rls-policy-map.md`, `.claude/skills/database/SKILL.md` | `git ls-files -- .claude/skills/database` |
| Catalogue test | `translations.test.ts` | same | `apps/frontend/src/lib/i18n/tests/translations.test.ts` | `git ls-files` on the path |
| Tests README | `tests/README.md` | same | `tests/README.md` | `git ls-files` on the path |
| Package barrel | `packages/app-shared/src/index.ts` | same | `packages/app-shared/src/index.ts` | `git ls-files` on the path |

### Where a plan's wording is looser than the tree

None of these changes a task; each is recorded so that later plans do not look for something that is not there.

1. **The context getter's local variable has two spellings.** `contestantCtx` is the convention (16 sites: the login page and the nav among them). `routes/contestant/register/+page.svelte` uses `ctx`. A task that says "the existing derived value" finds `const appSettings = $derived(contestantCtx.appSettings)` on the login page and in the nav, and has to look at what the register page declares.
2. **`dynamic.contestantAppName` is still a leaf message** with the value "Election Compass for Candidates". Phase 170 changed keys, never values. Plan 171-03 turns it into a group of three keys; six readers exist today (the population below).
3. **The route tree has pages the plans do not name:** `routes/contestant/privacy/+page.svelte`, `routes/contestant/login/+page.server.ts`, `routes/contestant/+layout.server.ts`, `routes/contestant/README.md`, and five files under `preregister/` besides its guard. No plan of this phase edits them.
4. **The register tree has no server file today.** `routes/contestant/register/` holds `+layout.svelte`, `+page.svelte`, `+page.ts` and `password/+page.svelte`. Plan 171-03's `+layout.server.ts` there is a new file, as that plan says.

### Names the plans introduce (not on the tree, by design)

These are not resolved against the tree because this phase creates them. Listed so that a later reader does not take their absence for a failed resolution: `packages/app-shared/src/settings/contestantAppConfig.ts` and its test (plan 1); `apps/frontend/src/lib/utils/settings.svelte.test.ts` and `apps/frontend/src/lib/contexts/app/appContext.settingsRemerge.svelte.test.ts` (plan 1); the SQL function `contestant_app_public_config` and its pgTAP file (plan 2); `apps/frontend/src/lib/contestant/utils/contestantAppName.ts`, `routes/contestant/register/+layout.server.ts`, `registrationCodeGuard.ts` and their tests (plan 3); `packages/dev-seed/tests/templates/built-in-templates-contestant-app.test.ts`, `171-e2e.sh`, `171-gates.sh` and the three pending todos (plans 3 and 4).

### What Phase 170's summaries say that binds this phase

- The naming gate is link 8 of `lint:check`. It declares exactly two exemptions (`get_candidate_user_data`, `invite-candidate`); this phase adds none in plan 1.
- `yarn lint:fix` proposes removing an unused `eslint-disable` directive in `tests/tests/support/mockOidcIssuerEntry.ts` every time. It is unrelated and stays out of this phase's commits.
- A stored row that still carries a pre-170 key is read as if the key were absent. Nothing is deployed.
- The invitation redirect dangles at `/contestant/complete-registration`; Phases 174 and 178 own it.

## Populations at the start

Each block is the command and its output as measured on the tree named in the first item, before any edit of this phase. Lines longer than 220 characters are cut and end in " …"; nothing else is altered. Later tasks compare against these, not against planning prose.

### 1. The revision

```bash
git rev-parse HEAD
```

```text
4c8b80651333901151b5e6cc0a07b17d6df0428b
```

### 2. Readers and writers of the pre-registration switch

```bash
git grep -n -F "preRegistration" -- apps packages tests ':!tests/e2e-runs'
```

```text
apps/docs/src/routes/(content)/developers-guide/configuration/app-settings/+page.md:97:| `preRegistration.enabled`                         | none (`preRegistration` is unset)          | boolean                            …
apps/docs/src/routes/(content)/developers-guide/contestant-app/bank-authentication/+page.md:14:Pre-registration is switched on with the `preRegistration.enabled` app setting. When it is off, the `/contestant/preregister` …
apps/docs/src/routes/(content)/developers-guide/contestant-app/pre-registration-and-invitation/+page.md:60:When the `preRegistration.enabled` app setting is on, the login page offers pre-registration at `/contestant/prer …
apps/docs/src/routes/(content)/publishers-guide/app-settings/+page.md:160:### `preRegistration`
apps/frontend/src/lib/dynamic-components/navigation/contestant/ContestantNav.svelte:88:        {#if appSettings.preRegistration?.enabled}
apps/frontend/src/lib/dynamic-components/navigation/contestant/ContestantNav.svelte:97:          text={appSettings.preRegistration?.enabled
apps/frontend/src/routes/contestant/login/+page.svelte:17:- `preRegistration.enabled`: Whether the pre-registration button is shown and the login details collapsed.
apps/frontend/src/routes/contestant/login/+page.svelte:97:    !!(email || showLogin || answersLocked || !appSettings.preRegistration?.enabled || status === 'error')
apps/frontend/src/routes/contestant/login/+page.svelte:198:    {#if !answersLocked && appSettings.preRegistration?.enabled}
apps/frontend/src/routes/contestant/preregister/+layout.server.ts:10:  // `preRegistration.enabled` is a DynamicSetting (backend/per-instance controlled, stored in the `app_settings` JSONB row), so it is read at request  …
apps/frontend/src/routes/contestant/preregister/+layout.server.ts:23:  const preRegistrationEnabled = Boolean(appSettings.preRegistration?.enabled);
apps/frontend/src/routes/contestant/preregister/+layout.server.ts:25:  if (!preRegistrationEnabled) {
apps/frontend/src/routes/contestant/register/+page.svelte:88:  title={appSettings.preRegistration?.enabled
packages/app-shared/src/data/schemas/storedSettings.schema.ts:150:  preRegistration: z.strictObject({ enabled: z.boolean().optional() }).optional(),
packages/app-shared/src/settings/dynamicSettings.type.ts:331:  preRegistration?: {
tests/tests/setup/contestant/bank-auth-journey.setup.ts:26:  // Scoped preregistration enablement (EFLOW-10b): the candidate-preregister route guard (`/contestant/preregister/+layout.server.ts`) reads `app_settings.setti …
tests/tests/setup/contestant/bank-auth-journey.setup.ts:30:    appSettingsOverride: { preRegistration: { enabled: true } }
tests/tests/setup/contestant/bank-auth-journey.teardown.ts:32:  // Nothing is written back to the shared `app_settings` singleton here. This teardown is NOT ordered relative to the perm chain — `data-setup-bank-auth-jour …
tests/tests/setup/shared/setupFromTemplate.ts:41:   * This is a SCENARIO mutation, not a baseline-settings change: it mutates the runtime DB `app_settings` row for the duration of a single opt-in run (the caller's paired …
tests/tests/setup/shared/setupFromTemplate.ts:183:  //     post-seed subset-match so the assertion compares the seeded template shape, not the overlaid shape. Additive merge_jsonb_column — the overlay only ADDS the scope …
```

Six reads in four frontend files (the nav twice, the login page twice plus its docblock line, the guard, the register page), the type member, the schema member, one writer (the bank-auth setup) with three comments beside it, and four docs pages.

### 3. Callers of the merge

```bash
git grep -n -E "mergeAppSettings|mergeInitialAppSettings" -- apps/frontend/src
```

```text
apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts:86:        // The whole `access` object, because the app context's `mergeAppSettings` replaces settings by root key: a bare `{ voterApp: fa …
apps/frontend/src/lib/contexts/app/appContext.spread.svelte.test.ts:67:// `page.data` is read synchronously by the SSR field initializers (`mergeInitialAppSettings(..., page.data?.appSettingsData)`); provide a minimal pa …
apps/frontend/src/lib/contexts/app/appContext.svelte.ts:9:import { mergeAppSettings, mergeInitialAppSettings } from '$lib/utils/settings';
apps/frontend/src/lib/contexts/app/appContext.svelte.ts:40: * The DB-override merge is a SYNCHRONOUS FIELD INITIALIZER (`#appSettingsValue = $state(mergeInitialAppSettings(...))`) — it runs on the server AND the client,  …
apps/frontend/src/lib/contexts/app/appContext.svelte.ts:73:  // Kept on one line (prettier-ignore) so the SSR field-initializer gate `mergeInitialAppSettings(staticSettings, dynamicSettings, …)` matches the single-line s …
apps/frontend/src/lib/contexts/app/appContext.svelte.ts:75:  #appSettingsValue = $state<AppSettings>(mergeInitialAppSettings(staticSettings, dynamicSettings, page.data?.appSettingsData as DynamicSettings | Error | undefi …
apps/frontend/src/lib/contexts/app/appContext.svelte.ts:275:    // Track the previous `data` reference to skip merges when SvelteKit hands us the same loader result on a URL change (e.g., drawer open/close — root layout  …
apps/frontend/src/lib/contexts/app/appContext.svelte.ts:282:      this.#appSettingsValue = mergeAppSettings(this.#appSettingsValue, data);
apps/frontend/src/lib/dynamic-components/navigation/voter/VoterNav.svelte:40:  // `appSettings` is a bare reactive accessor — read via voterCtx.X / $derived, never destructure (destructuring captures the mount-time snaps …
apps/frontend/src/lib/utils/settings.test.ts:2:import { mergeAppSettings, mergeInitialAppSettings } from './settings';
apps/frontend/src/lib/utils/settings.test.ts:6: * Wave-0 purity gate for `mergeAppSettings` (Pattern 8).
apps/frontend/src/lib/utils/settings.test.ts:8: * The historical bug: `mergeAppSettings` returned `Object.assign(target, nonNull)`, mutating the shared `staticSettings` module reference and polluting every other context  …
apps/frontend/src/lib/utils/settings.test.ts:12:describe('mergeAppSettings', () => {
apps/frontend/src/lib/utils/settings.test.ts:17:    const result = mergeAppSettings(target, additional);
apps/frontend/src/lib/utils/settings.test.ts:31:    const result = mergeAppSettings(target, additional);
apps/frontend/src/lib/utils/settings.test.ts:47:    const result = mergeAppSettings(target, additional) as unknown as Record<string, unknown>;
apps/frontend/src/lib/utils/settings.test.ts:58:    const result = mergeAppSettings(target, additional) as unknown as Record<string, unknown>;
apps/frontend/src/lib/utils/settings.test.ts:65: * SSR-init assertion. `appContext` folds the DB override into the INITIAL `$state` value via `mergeInitialAppSettings` (read synchronously from `page.data.appSettingsData` …
apps/frontend/src/lib/utils/settings.test.ts:67: * These assertions are the unit-level equivalent of asserting `initialMergeIncludedDbOverride === true` in a browser: they pass through the same pure init-merge the `$stat …
apps/frontend/src/lib/utils/settings.test.ts:69:describe('mergeInitialAppSettings (SSR-init DB-override merge)', () => {
apps/frontend/src/lib/utils/settings.test.ts:77:    const initial = mergeInitialAppSettings(staticPart, dynamicPart, dbData) as unknown as Record<string, unknown>;
apps/frontend/src/lib/utils/settings.test.ts:87:    const initial = mergeInitialAppSettings(staticPart, dynamicPart, undefined) as unknown as Record<string, unknown>;
apps/frontend/src/lib/utils/settings.test.ts:97:    const initial = mergeInitialAppSettings(staticPart, dynamicPart, dbData) as unknown as Record<string, unknown>;
apps/frontend/src/lib/utils/settings.test.ts:109:    mergeInitialAppSettings(target, dynamicPart, dbData);
apps/frontend/src/lib/utils/settings.test.ts:131:    const merged = mergeInitialAppSettings(staticPart, maintenanceOn, malformedColumn);
apps/frontend/src/lib/utils/settings.test.ts:142:    const merged = mergeInitialAppSettings(staticPart, maintenanceOn, undefined);
apps/frontend/src/lib/utils/settings.test.ts:148:    const merged = mergeInitialAppSettings(staticPart, maintenanceOn, maintenanceOff);
apps/frontend/src/lib/utils/settings.test.ts:154:    const merged = mergeInitialAppSettings(staticPart, maintenanceOff, undefined);
apps/frontend/src/lib/utils/settings.ts:12:export function mergeAppSettings(
apps/frontend/src/lib/utils/settings.ts:34:export function mergeInitialAppSettings(
apps/frontend/src/lib/utils/settings.ts:39:  const base = mergeAppSettings(staticSettings, dynamicSettings);
apps/frontend/src/lib/utils/settings.ts:40:  if (dbData && !(dbData instanceof Error)) return mergeAppSettings(base, dbData);
apps/frontend/src/routes/(voters)/(located)/+layout.ts:17:import { mergeAppSettings } from '$lib/utils/settings';
apps/frontend/src/routes/(voters)/(located)/+layout.ts:54:    const appSettings = mergeAppSettings(staticSettings, await appSettingsData);
apps/frontend/src/routes/(voters)/constituencies/+page.ts:21:import { mergeAppSettings } from '$lib/utils/settings';
apps/frontend/src/routes/(voters)/constituencies/+page.ts:26:  const appSettings = mergeAppSettings(staticSettings, await appSettingsData);
apps/frontend/src/routes/(voters)/elections/+page.ts:22:import { mergeAppSettings } from '$lib/utils/settings';
apps/frontend/src/routes/(voters)/elections/+page.ts:27:  const appSettings = mergeAppSettings(staticSettings, await appSettingsData);
apps/frontend/src/routes/(voters)/nominations/+layout.ts:11:import { mergeAppSettings } from '$lib/utils/settings';
apps/frontend/src/routes/(voters)/nominations/+layout.ts:18:  const appSettings = mergeAppSettings(staticSettings, await appSettingsData);
```

Production call sites: the app context (initializer and effect) and four voter loaders. The rest are the definition, tests and comments.

### 4. Statements of the merge rule

```bash
git grep -n -i -E "root key|by top-level key|shallow|replaces the whole|whole .?access.? object" -- apps packages tests ':!tests/e2e-runs'
```

```text
apps/docs/src/routes/(content)/developers-guide/configuration/app-settings/+page.md:33:The merge (`mergeAppSettings` in [`settings.ts`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/src/lib …
apps/docs/src/routes/(content)/publishers-guide/app-settings/+page.md:19:A stored setting replaces the whole top-level group it belongs to. For example, to change only `results.showFeedbackPopup`, store the complete `res …
apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.test.ts:335:      // The whole `access` object is carried, because the app context merges settings by root key; the other gates keep their shi …
apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts:86:        // The whole `access` object, because the app context's `mergeAppSettings` replaces settings by root key: a bare `{ voterApp: fa …
apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts:87:        // reason: `Partial<DynamicSettings>` is a shallow partial, so a partial `access` object does not satisfy it, although the value …
apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts:122:    // reason: the declared type is wrong in two ways. `Partial<DynamicSettings>` is a shallow partial while the column is a deep parti …
apps/frontend/src/lib/api/adapters/supabase/utils/localizeRow.ts:9: *   JSONB objects, shallow-cloning each intermediate level to avoid mutating the input row.
apps/frontend/src/lib/api/adapters/supabase/utils/localizeRow.ts:37:      // Shallow-clone the top-level object to avoid mutation
apps/frontend/src/lib/api/adapters/supabase/utils/localizeRow.ts:47: * The `obj` passed here is already a shallow clone at this level.
apps/frontend/src/lib/contexts/app/appContext.svelte.ts:68:   * NB! Settings are overwritten by root key.
apps/frontend/src/lib/contexts/contestant/contestantContext.svelte.test.ts:64:// `inheritContextMembers` copies own-enumerable members + forwards accessors; with a plain-object appContext fake it behaves as a shallow cop …
apps/frontend/src/lib/contexts/utils/sameRefs.ts:2: * Shallow reference equality for two arrays: same length and the same element at every index.
apps/frontend/src/lib/utils/components.ts:105: * @returns The merged props, based on a shallow copy of `props`
apps/frontend/src/lib/utils/components.ts:108:  // Make a shallow copy of props so as not to alter its values
apps/frontend/src/lib/utils/components.ts:123: * `props` is never mutated and the result is a shallow copy. A nullish `class` contributes nothing, a non-string one is coerced with `String(...)`, and props with no `class` …
apps/frontend/src/lib/utils/components.ts:127: * @returns The merged props, based on a shallow copy of `props`, with `classes` and any `props.class` combined and their conflicts resolved
apps/frontend/src/lib/utils/settings.test.ts:10: * NB: the real `StaticSettings`/`DynamicSettings` are deep objects; the merge is a shallow root-key merge that drops nullish values. We exercise that contract with small r …
apps/frontend/src/lib/utils/settings.ts:6: * NB! Settings are overwritten by root key unless the key is nullish.
apps/frontend/src/routes/(voters)/(located)/layout.tracking.test.ts:4: * SvelteKit reruns a load whenever a `url` property it read TRACKED changes. This load deliberately `untrack`s its URL reads — it only needs the sele …
apps/frontend/src/routes/(voters)/(located)/results/[[electionTab]]/+layout.svelte:110:  // The absence of `noScroll` here is DELIBERATE, not an oversight beside its `handleEntityTabChange` sibling one level down: switch …
apps/supabase/supabase/migrations/00001_initial_schema.sql:6209:-- - merge_question_custom_data() - shallow JSONB merge on questions.custom_data
apps/supabase/supabase/migrations/00001_initial_schema.sql:6211:-- merge_question_custom_data: shallow JSONB merge on questions.custom_data
apps/supabase/supabase/schema/504-admin-rpcs.sql:4:-- - merge_question_custom_data() - shallow JSONB merge on questions.custom_data
apps/supabase/supabase/schema/504-admin-rpcs.sql:6:-- merge_question_custom_data: shallow JSONB merge on questions.custom_data
packages/app-shared/src/utils/mergeSettings.ts:13: * Hoisted to `@openvaa/app-shared` so both `@openvaa/dev-seed` and the frontend can import a single source of truth. Note that `mergeAppSettings` in `apps/frontend/src/l …
packages/dev-seed/src/templates/_helpers/buildMinimal.test.ts:57:    // Base access flags preserved (deep merge, not shallow):
packages/dev-seed/src/templates/default.ts:208:          // The frontend's `mergeAppSettings` (apps/frontend/src/lib/utils/settings.ts) shallow-merges by root key, so a value written here REPLACES the whole `results` obj …
```

Nine hits describe the settings merge: the two docs pages; line 86 of the provider and line 335 of its test (the whole `access` object, "root key"); the comment above `#appSettingsValue` in `appContext.svelte.ts`; the TSDoc in `settings.ts` and the header of `settings.test.ts`; the TSDoc of `mergeSettings`; and the comment in `default.ts`. The others use "shallow" or "replaces the whole" about something else: `localizeRow.ts`, `components.ts`, `sameRefs.ts`, the two `Partial<DynamicSettings>` reasons in the provider (they describe a type), the SQL `merge_question_custom_data` lines, `buildMinimal.test.ts`, the contestant-context test and the two voter-route comments.

### 5. Readers of the name key

```bash
git grep -n -E "contestantAppName" -- apps packages tests ':!tests/e2e-runs' ':!apps/frontend/messages'
```

```text
apps/frontend/src/lib/types/generated/translationKey.ts:431:  | 'dynamic.contestantAppName'
apps/frontend/src/routes/contestant/forgot-password/+page.svelte:59:      <PreHeading>{t('dynamic.contestantAppName')}</PreHeading>
apps/frontend/src/routes/contestant/help/+page.svelte:32:    subject: `${t('contestantApp.help.supportEmailSubject')}: ${t('dynamic.contestantAppName')}`,
apps/frontend/src/routes/contestant/login/+page.svelte:130:          : t('dynamic.contestantAppName')}
apps/frontend/src/routes/contestant/password-reset/+page.svelte:103:      <PreHeading>{t('dynamic.contestantAppName')}</PreHeading>
apps/frontend/src/routes/contestant/register/+page.svelte:93:      <PreHeading class="text-primary text-2xl font-bold">{t('dynamic.contestantAppName')}</PreHeading>
```

Five readers and the generated key type.

### 6. In-spec settings writes

```bash
git grep -n -E "updateAppSettings\(|appSettingsOverride" -- tests/tests
```

```text
tests/tests/setup/contestant/bank-auth-journey.setup.ts:26:  // Scoped preregistration enablement (EFLOW-10b): the candidate-preregister route guard (`/contestant/preregister/+layout.server.ts`) reads `app_settings.setti …
tests/tests/setup/contestant/bank-auth-journey.setup.ts:30:    appSettingsOverride: { preRegistration: { enabled: true } }
tests/tests/setup/shared/setupFromTemplate.ts:45:  appSettingsOverride?: Record<string, unknown>;
tests/tests/setup/shared/setupFromTemplate.ts:184:  if (options?.appSettingsOverride) {
tests/tests/setup/shared/setupFromTemplate.ts:185:    await client.updateAppSettings(options.appSettingsOverride);
tests/tests/specs/perm/perm-access-disable.spec.ts:34:      await client.updateAppSettings({
tests/tests/specs/perm/perm-access-disable.spec.ts:41:    await client.updateAppSettings({
tests/tests/specs/perm/perm-access-disable.spec.ts:63:    await client.updateAppSettings({
tests/tests/specs/perm/perm-access-disable.spec.ts:83:    await client.updateAppSettings({
tests/tests/specs/perm/perm-interactive-info.spec.ts:129:      await client.updateAppSettings({
tests/tests/specs/perm/perm-interactive-info.spec.ts:137:        await client.updateAppSettings({
tests/tests/specs/perm/perm-org-matching.spec.ts:42:    if (client) await client.updateAppSettings({ matching: { organizationMatching: 'impute' } });
tests/tests/specs/perm/perm-org-matching.spec.ts:46:    await client.updateAppSettings({ matching: { organizationMatching: 'none' } });
tests/tests/specs/perm/perm-org-matching.spec.ts:61:    await client.updateAppSettings({ matching: { organizationMatching: 'answersOnly' } });
tests/tests/specs/perm/perm-org-matching.spec.ts:81:    await client.updateAppSettings({ matching: { organizationMatching: 'impute' } });
tests/tests/specs/perm/perm-question-video.spec.ts:125:      await client.updateAppSettings({
tests/tests/specs/perm/perm-question-video.spec.ts:151:    await client.updateAppSettings({
tests/tests/specs/perm/perm-show-feedback-survey.spec.ts:41:    if (client) await client.updateAppSettings({ survey: { showIn: ['resultsPopup'] } });
tests/tests/specs/perm/perm-show-feedback-survey.spec.ts:122:    await client.updateAppSettings({ survey: { showIn: ['frontpage'] } });
tests/tests/specs/perm/perm-show-feedback-survey.spec.ts:144:    await client.updateAppSettings({ survey: { showIn: ['entityDetails'] } });
tests/tests/specs/perm/perm-startfromcg.spec.ts:42:    await client.updateAppSettings({
tests/tests/specs/perm/perm-startfromcg.spec.ts:49:      await client.updateAppSettings({
tests/tests/utils/supabaseAdminClient.ts:23: *   - `public updateAppSettings(partialSettings)` — see usage-policy note above
```

### 7. The last three pgTAP files

```bash
ls apps/supabase/supabase/tests/database/ | sort | tail -3
```

```text
34-feedback-project-guard.test.sql
35-feedback-rate-limit-key.test.sql
36-entity-identity.test.sql
```

The highest number in use is 36.

### 8. The two census strings of Section 8c

```bash
git grep -n -F -e "project_open_for_voters,storage_path_can" -e "census: the SECURITY DEFINER" -- apps/supabase/supabase/tests/database/07-rpc-security.test.sql
```

```text
apps/supabase/supabase/tests/database/07-rpc-security.test.sql:376:    'project_open_for_voters,storage_path_can,storage_path_is_public,user_can,user_has_account_grant',
apps/supabase/supabase/tests/database/07-rpc-security.test.sql:377:    'census: the SECURITY DEFINER functions in public that anon can execute are exactly the five allow-listed ones'
apps/supabase/supabase/tests/database/07-rpc-security.test.sql:400:    'get_entity_basic_data,project_open_for_voters,storage_path_can,storage_path_is_public,user_can,user_has_account_grant',
apps/supabase/supabase/tests/database/07-rpc-security.test.sql:401:    'census: the SECURITY DEFINER functions in public that authenticated can execute are the same five plus get_entity_basic_data'
```

Each census is a sorted, comma-joined list of function names followed by its description. Anon: five names. Authenticated: the same five plus `get_entity_basic_data`.

### 9. Whether Phase 172 has executed

```bash
ls .planning/phases/172-terms-of-use-per-user-and-project/ | grep -c -- '-SUMMARY.md' || true; ls .planning/phases/172-terms-of-use-per-user-and-project/ | grep -c -- '-PLAN.md'
```

```text
0
9
```

First number: SUMMARY files. Second: PLAN files. No summary exists, so Phase 172 has not executed and has not added a pgTAP file or a census entry.
