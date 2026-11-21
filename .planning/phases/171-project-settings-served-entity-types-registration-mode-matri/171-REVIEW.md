---
phase: 171-project-settings-served-entity-types-registration-mode-matri
reviewed: 2026-10-22T19:57:43Z
depth: standard
files_reviewed: 42
files_reviewed_list:
  - apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.test.ts
  - apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts
  - apps/frontend/src/lib/contestant/utils/contestantAppName.test.ts
  - apps/frontend/src/lib/contestant/utils/contestantAppName.ts
  - apps/frontend/src/lib/contexts/app/appContext.settingsRemerge.svelte.test.ts
  - apps/frontend/src/lib/contexts/app/appContext.svelte.ts
  - apps/frontend/src/lib/dynamic-components/navigation/contestant/ContestantNav.svelte
  - apps/frontend/src/lib/i18n/tests/translations.test.ts
  - apps/frontend/src/lib/utils/settings.svelte.test.ts
  - apps/frontend/src/lib/utils/settings.test.ts
  - apps/frontend/src/lib/utils/settings.ts
  - apps/frontend/src/routes/contestant/+layout.svelte
  - apps/frontend/src/routes/contestant/forgot-password/+page.svelte
  - apps/frontend/src/routes/contestant/help/+page.svelte
  - apps/frontend/src/routes/contestant/login/+page.svelte
  - apps/frontend/src/routes/contestant/password-reset/+page.svelte
  - apps/frontend/src/routes/contestant/register/+page.svelte
  - apps/supabase/supabase/migrations/00001_initial_schema.sql
  - apps/supabase/supabase/schema/106-app-settings.sql
  - apps/supabase/supabase/schema/301-auth-functions.sql
  - apps/supabase/supabase/tests/database/07-rpc-security.test.sql
  - apps/supabase/supabase/tests/database/38-contestant-app-public-config.test.sql
  - packages/app-shared/src/data/schemas/storedSettings.schema.test.ts
  - packages/app-shared/src/data/schemas/storedSettings.schema.ts
  - packages/app-shared/src/index.ts
  - packages/app-shared/src/settings/contestantAppConfig.test.ts
  - packages/app-shared/src/settings/contestantAppConfig.ts
  - packages/app-shared/src/settings/dynamicSettings.ts
  - packages/app-shared/src/settings/dynamicSettings.type.ts
  - packages/app-shared/src/utils/mergeSettings.ts
  - packages/dev-seed/src/templates/default.ts
  - packages/dev-seed/src/templates/e2e/base.ts
  - packages/dev-seed/src/templates/e2e/perm/shared.ts
  - packages/dev-seed/tests/templates/base-app-settings.test.ts
  - packages/dev-seed/tests/templates/built-in-templates-contestant-app.test.ts
  - scripts/assert-no-candidate-app-names.mjs
  - scripts/assert-project-scoped-queries.mjs
  - scripts/fixtures/assert-no-candidate-app-names.input.ts
  - tests/tests/setup/shared/setupFromTemplate.ts
  - tests/tests/specs/contestant/contestant-journey.spec.ts
  - tests/tests/specs/perm/perm-closed-project.spec.ts
  - tests/tests/utils/testIds.ts
findings:
  critical: 0
  warning: 2
  info: 5
  total: 7
status: issues_found
---

# Phase 171: Code Review Report

**Reviewed:** 2026-10-22T19:57:43Z
**Depth:** standard
**Files Reviewed:** 42
**Status:** issues_found

## Summary

This is a retroactive review of the files at HEAD. It concentrates on what phase 171 introduced (`git diff 4c8b80651`, commits `(171-NN)`): the served-entity-types and registration-mode-matrix settings and their accessors (`contestantAppConfig.ts`), the strict stored-settings schema for them, the deep `mergeAppSettings` and the app context's recompute from the base, the anon-callable SECURITY DEFINER `contestant_app_public_config` and the provider's closed-project branch that reads it, and the contestant app's name.

Authorisation checks:

- **Who reads settings.** `contestant_app_public_config` is `SECURITY DEFINER` with `search_path = ''`. It is granted only to `anon` and `authenticated`, and builds its answer from fixed paths. 38-contestant-app-public-config.test.sql pins the key set at every level and the absence of an existence oracle, and it shows that the table's RLS is not widened.
- **Who writes settings.** Writes need `project.edit_app_settings` (302-rls.sql), which phase 171 did not change. No entity-scope role can write settings.
- **Server-side gates.** `registrationGuard.ts` and the OIDC authorize and callback endpoints read the settings through an explicitly anonymous client. A caller cannot supply the settings these gates use.
- **Merge safety.** The new merge skips `__proto__`, `constructor` and `prototype` and never mutates its target.

I found no blocker.

The main finding is WR-01. The registration rule is applied to two different inputs. The screens and the SvelteKit gates read the settings after the strict zod parse. The database and `identity-callback` read the raw JSON. If one member of `contestantApp` is invalid, the two sides give different answers. The second warning: the documentation that describes what the anon endpoint exposes is out of date.

Findings already reported in 177.1-REVIEW.md and 179-REVIEW.md are not repeated here.

## Warnings

### WR-01: The screens and the database apply the registration rule to different inputs, so one invalid member of `contestantApp` hides registration in the app while the database still honours it

**File:** `apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts:133-151, 157-162`, `packages/app-shared/src/data/schemas/storedSettings.schema.ts:35-48, 164-174`, `packages/app-shared/src/settings/contestantAppConfig.ts:99-109`; the raw reader is in `apps/supabase/supabase/schema/301-auth-functions.sql` (`private.registration_mode_allowed_in`)

**Issue:**

- **How the app reads it.** Phase 171 made `contestantApp.entityTypes`, `contestantApp.registrationModes` and every row of the matrix strict:
  - `z.enum` with no dropping of values;
  - `.min(1)` on the list of entity types;
  - `z.strictObject` on the matrix.

  The provider parses the row with `parseWithPartialPreserve`, which drops the whole failing top-level member. One rejected value anywhere under `contestantApp` therefore discards the whole `contestantApp` root, so the frontend falls back to the shipped defaults: candidates only and an empty matrix. Examples of a rejected value are an unknown mode, an extra row key such as `alliance`, `entityTypes: []`, or an invalid `questions` member. The SvelteKit gates read through the same provider. They are `registrationGuard.ts` and `api/oidc/authorize|callback/+server.ts`.
- **How the database reads it.** `private.registration_mode_allowed_in` filters the raw JSON. So does the `identity-callback` copy of the rule (`registrationMatrix.ts`). Neither rejects anything. `claim_invitations` asks the SQL function before it honours an invitation.
- **Concrete case.** A project editor stores `{"contestantApp":{"entityTypes":["candidate"],"registrationModes":{"candidate":["email"],"alliance":[]}}}`. Nothing validates the column on write.
  - **The app:** the name becomes the default "Candidate app", no registration mode is listed, and `/contestant/register` redirects to the login page.
  - **The database:** `registration_mode_allowed_in(settings, 'candidate', 'email')` is true, and `claim_invitations` keeps writing candidate grants from email invitations.
  - **Consequences:** the publisher sees registration as off while it is on. The reverse case, where the app shows the default name for a project that serves only organizations, mislabels the app.
- **Why the tests miss it.** `registrationModeMatrixParity.test.ts` runs the TypeScript accessor on the raw rows. It never runs the zod layer the screens actually go through, so it cannot catch this.

**Fix:** Make the app read the same thing the database reads. The simplest way is to make the two list schemas filter rather than reject, matching what `membersOf` already does in the accessors. A non-list value would still fail.
```ts
const ServedEntityTypeListSchema = z
  .array(z.unknown())
  .transform((v) => SERVED_ENTITY_TYPES.filter((t) => v.includes(t)));
const RegistrationModeListSchema = z
  .array(z.unknown())
  .transform((v) => REGISTRATION_MODES.filter((m) => v.includes(m)));
// and for the matrix: z.object({ candidate: ..., organization: ... }) (non-strict, unknown rows stripped)
```
Alternatively, validate on write with a `validate_app_settings` trigger on `public.app_settings` that rejects a `contestantApp` the schema would reject, so invalid values can never be stored. Then extend the parity test to send each truth-table row through `StoredSettingsSchema` before it reaches the accessor.

### WR-02: The documentation of the anon endpoint understates what it exposes

**File:** `scripts/assert-project-scoped-queries.mjs:215-218`, `apps/supabase/supabase/schema/301-auth-functions.sql:38` (the same text is in `apps/supabase/supabase/migrations/00001_initial_schema.sql:2180`)

**Issue:**

- **The two descriptions.** The written disposition in the project-scope guard says `contestant_app_public_config` "returns three stored settings values". It lists only access, entity types and registration modes. The `public`-schema rationale in 301 says "four fixed settings values".
- **What it actually returns.** The function returns five values: the three above plus `access.answersLocked` and `analytics.trackEvents`. 106-app-settings.sql and the 38 pgTAP file both say five.
- **Why this matters.** These two texts are the places a reviewer reads to judge the anon SECURITY DEFINER surface. The guard's own docblock says that a disposition which misstates scoping "hides the leak from the next reader". The census was not updated when the endpoint gained two values, so the next widening may also go through without review.

**Fix:** Update both texts to name all five values. In 301 and the migration, change "four" to "five" and list them. In `assert-project-scoped-queries.mjs`:
```js
 * `contestant_app_public_config` returns five stored settings values of one project and never a
 * row: whether the Contestant app is accessible, whether answers are locked, the entity types it
 * serves, its registration modes and whether usage events are tracked. ...
```

## Info

### IN-01: The accessor's input type contradicts the accessor on an absent matrix row

**File:** `packages/app-shared/src/settings/contestantAppConfig.ts:65` vs `:96, 106`

**Issue:** The `ContestantAppConfigInput` docs say that "each row of the matrix may be absent, and an absent member reads as its shipped default". `getEffectiveRegistrationModes` does something else when the matrix is present but a row is missing: it returns an empty row (`membersOf(..., undefined)`), as its own docs at line 96 say. The SQL and Deno readers also treat a missing row as allowing nothing. Behaviour is the same today only because the shipped rows are empty.

**Fix:** Change line 65 to say that an absent root, entity-type list or matrix reads as its shipped default, and that an absent row within a declared matrix reads as empty.

### IN-02: The stored-settings schema docblock describes a failure mode the provider no longer has

**File:** `packages/app-shared/src/data/schemas/storedSettings.schema.ts:57-59`

**Issue:** Phase 171 edited this paragraph, and it still says two things that are wrong:
- It says the provider "returns `{}` on `PGRST116`". The provider reads with `maybeSingle` and branches on `project_open_for_voters`.
- It says the provider "degrades a failed parse of any depth to `{}` and takes every sibling setting down with it". The provider uses `parseWithPartialPreserve`, which drops only the failing top-level member.

The real consequence is narrower but still matters for WR-01: one invalid inner value discards its whole top-level root, here the whole `contestantApp`.

**Fix:** Describe the current behaviour: a rejected inner value drops its top-level member, and the remaining members are kept.

### IN-03: The base dataset's comment states the replace-by-root merge that phase 171 removed

**File:** `packages/dev-seed/src/templates/e2e/base.ts:207`

**Issue:** "The whole root, because a stored `contestantApp` replaces the default one whole." After 05a10320c, `mergeAppSettings` merges objects member by member. Only lists replace whole. The stated reason is therefore false. The perm templates give the correct reason: `entityTypes` is a list, and the voter loaders merge over the static settings only.

**Fix:** Reword it, for example: "The whole root: `entityTypes` is a list, which replaces the default whole, and the voter loaders merge the row over the static settings only."

### IN-04: `contestant_app_public_config` returns the stored list and matrix subtrees unbounded

**File:** `apps/supabase/supabase/schema/106-app-settings.sql:39-42` (the same body is in `migrations/00001_initial_schema.sql:1713-1716`)

**Issue:** `'registrationModes', v.settings #> '{contestantApp,registrationModes}'` returns whatever JSON is stored at that path, and the same goes for `entityTypes`. Nothing validates the column on write. Any extra member an editor stores under the matrix is therefore readable by `anon` for any project id. The function's own docs promise "exactly five values" and "no other member of `settings` is reachable through it".

**Fix:** Build the matrix from its two known rows:
```sql
'registrationModes', jsonb_build_object(
  'candidate',    v.settings #> '{contestantApp,registrationModes,candidate}',
  'organization', v.settings #> '{contestantApp,registrationModes,organization}')
```
This needs a matching update to the null-answer literals in 38-contestant-app-public-config.test.sql and to the closed-branch tests in the provider.

### IN-05: The help page's settings docblock omits the setting that decides the name it shows

**File:** `apps/frontend/src/routes/contestant/help/+page.svelte:7-9`

**Issue:** The ingress embeds the app's name, which comes from `contestantApp.entityTypes` (line 27). The component's `### Settings` list names only `admin.email`. The login, register and other entry pages list `contestantApp.entityTypes`.

**Fix:** Add `- \`contestantApp.entityTypes\`: The entity types the project serves, which decide the app's name in the ingress.`

---

_Reviewed: 2026-10-22T19:57:43Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
