# Phase 171: Project Settings — Served Entity Types & Registration-Mode Matrix - Pattern Map

**Mapped:** 2026-10-05
**Files analyzed:** 44 new or modified files (the seven-locale message catalogues counted as three files, one per namespace)
**Analogs found:** 42 / 44
**Tree read:** HEAD `fcdd35dc3`, branch `feat/entity-signup-multi-grant`, i.e. the tree **before Phase 170**.

## How to read this file

- **No line numbers.** Phase 170 rewrites most of the cited files before this phase executes. Every analog is cited by today's path plus a symbol or a verbatim quote. Find the anchor with `git grep -n -F '<quote>' -- <path>`.
- **Two paths where they differ.** `today → after 170`. The after-170 names come from the name map in `171-CONTEXT.md`; the ones that map marks "assumed" (`ContestantNav`, `$lib/contestant`) are confirmed against 170's summary at plan time.
- **Excerpts are today's text.** Where an excerpt contains `candidateApp`, `CandApp…` or `routes/candidate`, the executor meets the renamed form. The pattern is what is copied, not the identifier.
- **Every analog path below is git-tracked** (checked with `git ls-files`). Three targets are generated files; they are regenerated, never edited: `apps/supabase/supabase/migrations/00001_initial_schema.sql`, `packages/supabase-types/src/database.ts`, `apps/frontend/src/lib/types/generated/translationKey.ts`.

## File Classification

### Plan 1 — Model (gate: unit)

| New/Modified File (after 170) | N/M | Role | Data Flow | Closest Analog (today's path) | Match |
|---|---|---|---|---|---|
| `packages/app-shared/src/settings/dynamicSettings.type.ts` | M | model (type) | transform | itself: the `candidateApp` member and the `preRegistration?` member | exact |
| `packages/app-shared/src/settings/dynamicSettings.ts` | M | config (defaults) | transform | itself: the `candidateApp: { questions: … }` literal | exact |
| `packages/app-shared/src/settings/<contestant app config>.ts` (name is the planner's) | N | utility (vocabulary + pure accessors) | transform | `packages/data/src/objects/entities/base/entityTypes.ts` (`ENTITY_TYPE`, `EntityType`, `isEntityType`) for the vocabulary; `packages/app-shared/src/data/isEmoji.ts` for a pure exported function in this package | role-match |
| `packages/app-shared/src/settings/<contestant app config>.test.ts` | N | test | transform | `packages/app-shared/src/data/isEmoji.test.ts`; `packages/app-shared/src/data/schemas/storedSettings.schema.test.ts` | role-match |
| `packages/app-shared/src/data/schemas/storedSettings.schema.ts` | M | model (zod schema) | transform | itself: the `candidateApp` and `preRegistration` members of `StoredSettingsSchema` | exact |
| `packages/app-shared/src/data/schemas/storedSettings.schema.test.ts` | M | test | transform | itself: the `LEVEL 2` / `LEVEL 3` rejection cases and the "keeps its SIBLING settings" cases | exact |
| `packages/app-shared/src/index.ts` | M | config (barrel) | — | itself: `export * from './settings/dynamicSettings';` | exact |
| `packages/app-shared/src/utils/mergeSettings.ts` | M (TSDoc only) | utility | transform | itself: the sentence "a separate, SHALLOW merge with different semantics" | exact |
| `apps/frontend/src/lib/utils/settings.ts` | M | utility | transform | `deepMerge` in `packages/dev-seed/src/templates/_helpers/buildMinimal.ts` | role-match (the merge rule), **not** `mergeSettings` |
| `apps/frontend/src/lib/utils/settings.test.ts` | M | test | transform | itself: `describe('mergeAppSettings', …)` | exact |
| `apps/frontend/src/lib/utils/settings.svelte.test.ts` | N | test (runes) | transform | `apps/frontend/src/lib/contexts/app/appContext.spread.svelte.test.ts` | role-match |
| `apps/frontend/src/lib/contexts/app/appContext.svelte.ts` | M | provider | event-driven | itself: the `$effect` holding `this.#appSettingsValue = mergeAppSettings(this.#appSettingsValue, data)` | exact |

### Plan 2 — Database read (gate: pgTAP)

| New/Modified File (after 170) | N/M | Role | Data Flow | Closest Analog (today's path) | Match |
|---|---|---|---|---|---|
| `apps/supabase/supabase/schema/106-app-settings.sql` | M | migration (function + grant) | request-response | `project_open_for_voters` and its `GRANT` in `apps/supabase/supabase/schema/301-auth-functions.sql` | exact |
| `apps/supabase/supabase/schema/301-auth-functions.sql` | M (one header sentence) | migration | — | itself: "What stays in `public`: `user_can` …" | exact |
| `apps/supabase/supabase/migrations/00001_initial_schema.sql` | regenerated | migration | — | `yarn schema:regenerate` | n/a |
| `packages/supabase-types/src/database.ts` | regenerated | model | — | `yarn db:types` | n/a |
| `apps/supabase/supabase/tests/database/NN-<content name>.test.sql` | N | test (pgTAP) | request-response | `apps/supabase/supabase/tests/database/30-closed-project.test.sql` (Sections 1, 2 and 4) | exact |
| `apps/supabase/supabase/tests/database/07-rpc-security.test.sql` | M (two strings, two descriptions) | test (pgTAP) | — | itself: Section 8c | exact |
| `apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts` | M | service (adapter) | request-response | itself: `_getAppSettings`, the `if (!data) { … }` arm | exact |
| `apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.test.ts` | M | test | request-response | itself: `describe('getAppSettings', …)`, the four zero-rows cases | exact |
| `scripts/assert-project-scoped-queries.mjs` | M (one entry + one docblock paragraph) | config (gate) | — | itself: `PROJECT_SCOPED_RPCS`, the `project_open_for_voters` entry | exact |
| `.claude/skills/database/{schema-reference.md,rls-policy-map.md,SKILL.md}` | M | docs | — | the `project_open_for_voters(uuid)` rows in each | exact |

### Plan 3 — Frontend (gate: component / typecheck)

| New/Modified File (after 170) | N/M | Role | Data Flow | Closest Analog (today's path) | Match |
|---|---|---|---|---|---|
| `apps/frontend/messages/<7 locales>/dynamic.json` | M | config (catalogue) | — | itself: `candidateAppNotAccessible` (a nested group in the same file) | exact |
| `apps/frontend/messages/<7 locales>/candidateApp.notSupported.json` → `contestantApp.notSupported.json` | M | config (catalogue) | — | the `{appName}` parameter in `dynamic.candidateAppPrivacy.registryStatement.content` | role-match |
| `apps/frontend/messages/<7 locales>/candidateApp.help.json` → `contestantApp.help.json` | M | config (catalogue) | — | same | role-match |
| `apps/frontend/src/lib/types/generated/translationKey.ts` | regenerated | model | — | `yarn workspace @openvaa/frontend generate:translation-key-type` | n/a |
| `apps/frontend/src/lib/i18n/tests/translations.test.ts` | M | test | file-I/O | itself: `test('all 7 locales have message directories', …)` and the `lang.json` named-key test | exact |
| `apps/frontend/src/routes/candidate/login/+page.svelte` → `routes/contestant/login/+page.svelte` | M | component (route page) | request-response | itself: `isLoginShown`, the `login-preregister` block, the `{#if appSettings.access.voterApp}` block | exact |
| `apps/frontend/src/lib/dynamic-components/navigation/candidate/CandidateNav.svelte` → `…/navigation/contestant/ContestantNav.svelte` | M | component (dynamic) | request-response | itself: the `{:else}` `NavGroup` | exact |
| `apps/frontend/src/routes/candidate/register/+page.svelte` → `routes/contestant/register/+page.svelte` | M | component | request-response | itself: `title={appSettings.preRegistration?.enabled …}` and the `PreHeading` | exact |
| `routes/candidate/forgot-password/+page.svelte`, `routes/candidate/password-reset/+page.svelte` → `routes/contestant/…` | M | component | — | each: `<PreHeading>{t('dynamic.candidateAppName')}</PreHeading>` | exact |
| `routes/candidate/help/+page.svelte` → `routes/contestant/help/+page.svelte` | M | component | — | itself: the `subject:` template literal | exact |
| `routes/candidate/+layout.svelte` → `routes/contestant/+layout.svelte` | M | component (layout) | — | itself: the two `MaintenancePage`-style branches reading `t('candidateApp.notSupported.title')` and `t('dynamic.candidateAppNotAccessible.title')` | exact |
| `routes/candidate/preregister/+layout.server.ts` → `routes/contestant/preregister/+layout.server.ts` | M | middleware (server guard) | request-response | itself | exact |
| `routes/contestant/register/<server guard file>` (placement is the planner's; it must read the URL) | N | middleware (server guard) | request-response | `routes/candidate/preregister/+layout.server.ts` | exact |
| `routes/contestant/register/<guard decision helper>.ts` + `.test.ts` | N | utility + test | transform | `apps/frontend/src/routes/candidate/(protected)/candidateHome.helpers.ts` + `candidateHome.helpers.test.ts` (a pure helper beside its route, tested with no component loaded) | role-match |

### Plan 4 — Seeds, spec, docs (gate: E2E)

| New/Modified File (after 170) | N/M | Role | Data Flow | Closest Analog (today's path) | Match |
|---|---|---|---|---|---|
| `packages/dev-seed/src/templates/e2e/base.ts` | M | config (seed) | batch | itself: `BASE_APP_SETTINGS`, the `candidateApp: { questions: … }` member | exact |
| `packages/dev-seed/src/templates/e2e/perm/shared.ts` | M | config (seed) | batch | `BASE_APP_SETTINGS` in `e2e/base.ts` (the only dataset that carries the root today) | exact |
| `packages/dev-seed/src/templates/default.ts` | M | config (seed) | batch | same, plus its own `app_settings.fixed[0].settings` | exact |
| `packages/dev-seed/tests/templates/base-app-settings.test.ts` | M | test | transform | itself: "declares the base dataset top-level settings blocks" and the per-block `toEqual` cases | exact |
| `packages/dev-seed/tests/templates/<built-in templates settings>.test.ts` | N | test | transform | the registry case at the bottom of `base-app-settings.test.ts` (`BUILT_IN_TEMPLATES['e2e/base']`) | role-match |
| `tests/tests/setup/candidate/bank-auth-journey.setup.ts` → `tests/tests/setup/contestant/…` (+ its `.teardown.ts` comment) | M | config (E2E setup) | batch | itself: `appSettingsOverride: { preRegistration: { enabled: true } }` | exact |
| `tests/tests/setup/shared/setupFromTemplate.ts` | M (two comments) | utility | batch | itself: the `appSettingsOverride` TSDoc and the step-3b comment | exact |
| `tests/tests/specs/perm/perm-closed-project.spec.ts` | M | test (E2E) | request-response | itself, plus the in-spec re-seed in `tests/tests/specs/perm/perm-access-disable.spec.ts` | exact |
| `tests/tests/utils/testIds.ts` | M | config | — | itself: `candidate.login` (`email`, `submit`, `errorMessage`, `answersLockedInfo`) | exact |
| `tests/tests/specs/candidate/candidate-journey.spec.ts` (open-project one-liners; the planner may pick another login-visiting spec) | M | test (E2E) | request-response | itself | role-match |
| four docs pages under `apps/docs/src/routes/(content)/` (see § Docs) | M | docs | — | the "Adding a new setting" section of the developers' app-settings page | exact |

## Pattern Assignments

### `packages/app-shared/src/settings/<contestant app config>.ts` (utility, transform) — NEW

**Analog 1 — vocabulary shape:** `packages/data/src/objects/entities/base/entityTypes.ts`. D-10 says the mode vocabulary is declared "in the shape `ENTITY_TYPE` has". The whole file:

```typescript
export const ENTITY_TYPE = {
  /**
   * A candidate.
   */
  Candidate: 'candidate',
  // … Faction, Organization, Alliance, each with its own TSDoc
} as const;

export type EntityType = (typeof ENTITY_TYPE)[keyof typeof ENTITY_TYPE];

export function isEntityType(value: unknown): value is EntityType {
  return Object.values(ENTITY_TYPE).includes(value as EntityType);
}
```

Copy: one `as const` object with a TSDoc per member, the derived union type under the same base name, TSDoc on every export.

**Constraint from RESEARCH the analog does not show:** `app-shared` imports `@openvaa/data` **type-only** in every file. `dynamicSettings.type.ts` opens with:

```typescript
import type { Id } from '@openvaa/core';
import type { ENTITY_TYPE, EntityType } from '@openvaa/data';
import type { LocalizedString } from '../data/localized.type';
```

So the two vocabularies are literal tuples declared here, in canonical order (`candidate, organization`; `identity_provider, email, code`), and the served-type tuple is tied to `EntityType` with `satisfies`. No runtime import of `@openvaa/data`.

**Analog 2 — a pure exported function in this package:** `packages/app-shared/src/data/isEmoji.ts`.

```typescript
import { isPlainObject } from './utils/isPlainObject';
import type { Emoji } from './customData.type';

/**
 * Typeguard for `Emoji` objects.
 */
export function isEmoji(value: unknown): value is Emoji {
  return isPlainObject(value) && 'emoji' in value && typeof value.emoji === 'string';
}
```

Copy: value imports first, `import type` after; no `.js` extension on relative imports; one function per concern; TSDoc on each. `packages/app-shared/src/data/utils/isPlainObject` already exists if the accessors need it.

**What has no analog:** the accessors must be **total on raw provider output** (the root, each list and each row may be absent, and `{}` is a valid input), falling back member by member to `dynamicSettings.contestantApp`. The five accessors and their rules are the table in `171-RESEARCH.md` § *Accessors: make them total on raw provider output*, plus "does any served type allow `code`".

**Barrel:** add one line to `packages/app-shared/src/index.ts` beside `export * from './settings/dynamicSettings';`. The barrel is flat and alphabetical by path.

---

### `packages/app-shared/src/settings/<contestant app config>.test.ts` (test) — NEW

**Analog:** `packages/app-shared/src/data/isEmoji.test.ts` for the file shape:

```typescript
import { describe, expect, test } from 'vitest';
import { isEmoji } from './isEmoji';

describe('isEmoji', () => {
  test('should return true for valid emoji objects', () => {
    expect(isEmoji({ emoji: '🎃' })).toBe(true);
  });
```

One `describe` per accessor; the test sits beside its source. Cases are D-20's unit list: default on `{}`, a root without the member, a row for an unserved type ignored (D-07), the three name keys (D-16), "any registration" over an empty effective matrix.

---

### `packages/app-shared/src/settings/dynamicSettings.type.ts` and `dynamicSettings.ts` (model, config)

**Analog:** the existing root in each file. Type, today:

```typescript
  /**
   * Settings related to the Candidate App.
   */
  candidateApp: {
    /**
     * Settings related to the question view in the Candidate App.
     */
    questions: {
      /**
       * Whether to hide possible video content for questions in the Candidate App.
       */
      hideVideo: boolean;
```

Copy: a TSDoc block on the root and on every member; the two new members are **required** (not `?`), like `questions`. Delete the whole `preRegistration?: { enabled?: boolean }` member and its TSDoc ("Settings related to Candidate App pre-registration. …").

Defaults, today:

```typescript
  candidateApp: {
    questions: {
      hideHero: false,
      hideVideo: false
    }
  }
```

Add `entityTypes: ['candidate']` and `registrationModes: { candidate: [], organization: [] }` beside `questions` (D-06). The existing schema case "accepts the package's own shipped `dynamicSettings` as a representative full payload" must keep passing with these in place.

---

### `packages/app-shared/src/data/schemas/storedSettings.schema.ts` (model, transform)

**Analog:** the two members it changes, in `StoredSettingsSchema`:

```typescript
  candidateApp: z
    .strictObject({
      questions: z.strictObject({ hideVideo: z.boolean().optional(), hideHero: z.boolean().optional() }).optional()
    })
    .optional(),
  preRegistration: z.strictObject({ enabled: z.boolean().optional() }).optional(),
```

Copy: every member `.optional()`; every nested object its own `z.strictObject` ("Strictness is a PER-OBJECT setting and does not descend"). Delete the `preRegistration` line. The new members' shape is the probed skeleton in `171-RESEARCH.md` § *Schema: probed on this tree's zod* (array of enum, `.min(1)` for types, a transform that filters the vocabulary tuple by membership).

**Precedent for a module-level helper schema reused by several members:** `StoredNotificationSchema` and `CardContentSchema` at the top of the same file, each a `const` with a TSDoc block. The mode-list schema is declared the same way.

**Docblock to re-measure, not patch:** "This column is three levels deep at `settings` -> `notifications` -> `candidateApp`". `registrationModes` adds a strict object at the same depth under the renamed root.

---

### `packages/app-shared/src/data/schemas/storedSettings.schema.test.ts` (test)

**Analog:** its own cases. The per-level rejection idiom to copy for `registrationModes`:

```typescript
  it('LEVEL 2: rejects an unknown key inside `notifications`', () => {
    const result = StoredSettingsSchema.safeParse({ notifications: { bogusNotifications: 1 } });
    expect(result.success).toBe(false);
    expect(result.success === false && result.error.issues[0]?.message).toMatch(/Unrecognized key/);
    expect(result.success === false && result.error.issues[0]?.path).toEqual(['notifications']);
  });
```

The acceptance idiom, which prints the issues on failure:

```typescript
    expect(result.success === false ? result.error.issues : result.success).toBe(true);
    expect(result.success && result.data.matching?.minimumAnswers).toBe(1);
```

New cases are the nine rows of the probe table in RESEARCH; assert the **path** on each rejection (`['contestantApp', 'entityTypes', 0]` and so on) and the transformed value by `toEqual` on each acceptance. Update the file-header sentence that lists the rejection levels.

---

### `apps/frontend/src/lib/utils/settings.ts` (utility, transform)

**Analog:** `deepMerge` in `packages/dev-seed/src/templates/_helpers/buildMinimal.ts`. RESEARCH Verdict A condition 1 rules out delegating to `mergeSettings` (three reproduced failures).

```typescript
function deepMerge<TRow extends Record<string, unknown>>(
  base: TRow,
  overlay: Record<string, unknown> | undefined
): TRow {
  if (overlay == null) return JSON.parse(JSON.stringify(base)) as TRow;
  const out: Record<string, unknown> = JSON.parse(JSON.stringify(base));
  for (const key of Object.keys(overlay)) {
    const overlayVal = overlay[key];
    if (overlayVal === undefined) continue; // Strip undefined for JSONB safety.
    const baseVal = out[key];
    const overlayIsPlainObj = overlayVal != null && typeof overlayVal === 'object' && !Array.isArray(overlayVal);
    const baseIsPlainObj = baseVal != null && typeof baseVal === 'object' && !Array.isArray(baseVal);
    if (overlayIsPlainObj && baseIsPlainObj) {
      out[key] = deepMerge(baseVal as Record<string, unknown>, overlayVal as Record<string, unknown>);
    } else {
      out[key] = overlayVal;
    }
  }
  return out as TRow;
}
```

Copy: skip `undefined`; recurse only when **both** sides are plain objects; everything else replaces whole.
**Do not copy:** the `JSON.parse(JSON.stringify(base))` clone. The target may be a Svelte `$state` proxy and static settings may hold non-JSON values; use a shallow spread per merged level and share untouched subtrees by reference (the reference shape is in RESEARCH § *The merge rule, as a reference shape*).

**What stays from today's function** (signature, root-level nullish skip, no mutation of `target`):

```typescript
export function mergeAppSettings(
  target: StaticSettings | AppSettings,
  additional: AppSettings | DynamicSettings
): AppSettings {
  const nonNull = Object.fromEntries(Object.entries(additional).filter(([, v]) => v != null)) as
    AppSettings | DynamicSettings;
  // Pure spread (Pattern 8): never mutate `target`. …
  return { ...target, ...nonNull };
}
```

Rewrite the TSDoc ("NB! Settings are overwritten by root key unless the key is nullish." and the `TODO`) to state the new rule. `mergeInitialAppSettings` below it keeps its signature and body.

---

### `apps/frontend/src/lib/utils/settings.test.ts` (test) and `settings.svelte.test.ts` (new)

**Analog:** the file's own `describe('mergeAppSettings', …)`. The idiom for small representative objects and the purity assertion:

```typescript
    const target = { colors: { primary: 'red' }, locales: ['en'] } as unknown as StaticSettings;
    const targetSnapshot = JSON.parse(JSON.stringify(target));
    const additional = { matching: { algorithm: 'manhattan' } } as unknown as DynamicSettings;

    const result = mergeAppSettings(target, additional);

    expect(target).toEqual(targetSnapshot);
    expect(result).not.toBe(target);
```

One existing case changes meaning and must be rewritten, not kept: "overrides the corresponding target key when additional has a non-null value" passes today because the root is replaced; under the deep merge a stored `{ colors: { primary: 'blue' } }` keeps the target's other `colors` members. The file-header paragraph ("the merge is a shallow root-key merge that drops nullish values") is restated. New cases are the eight listed in RESEARCH under *Unit cases this implies*.

**The `$state`-proxy case** needs the Svelte transform, so it lives in a `.svelte.test.ts` file. Analog for a runes test with no live component tree: `apps/frontend/src/lib/contexts/app/appContext.spread.svelte.test.ts` (imports `flushSync` from `svelte`, mocks with `vi.hoisted`). For this case no mocks are needed: build a `$state` object holding an array, pass it as `target`, assert no throw.

---

### `apps/frontend/src/lib/contexts/app/appContext.svelte.ts` (provider, event-driven)

**Analog:** itself. The effect body to change:

```typescript
      if (data === this.#prevAppSettingsData) return;
      this.#prevAppSettingsData = data;
      …
      this.#appSettingsValue = mergeAppSettings(this.#appSettingsValue, data);
```

and the initializer that already shows the recompute-from-base form (RESEARCH Verdict A condition 2, a recommendation):

```typescript
  #appSettingsValue = $state<AppSettings>(mergeInitialAppSettings(staticSettings, dynamicSettings, page.data?.appSettingsData as DynamicSettings | Error | undefined));
```

Keep the `data === this.#prevAppSettingsData` guard and the early return on `Error` exactly as they are; the comment above the guard explains why. Restate the comment above `#appSettingsValue` ("NB! Settings are overwritten by root key." and the `TODO`).

---

### `apps/supabase/supabase/schema/106-app-settings.sql` (migration, request-response)

**Analog:** `project_open_for_voters` in `apps/supabase/supabase/schema/301-auth-functions.sql`, with its banner comment and its grant:

```sql
--------------------------------------------------------------------------------
-- project_open_for_voters: is this project open to the anonymous reader?
--
-- The project-level term of public visibility, carried by every `TO anon` SELECT policy in 302-rls.sql. …
--
-- Denies when the project does not exist: COALESCE over a primary-key probe returns false, never NULL.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.project_open_for_voters (p_project_id uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET
  search_path = '' AS $$
  SELECT COALESCE(
    (SELECT p.open_for_voters FROM public.projects p WHERE p.id = p_project_id),
    false
  );
$$;

-- The frontend adapter calls this function over PostgREST, as anon and as authenticated, to tell a closed project from an open project with no settings row, so the grant is declared here rather than inherited from default privileges. 30-closed-project.test.sql asserts both rights.
GRANT
EXECUTE ON FUNCTION public.project_open_for_voters (uuid) TO anon,
authenticated;
```

Copy: the dashed banner naming the function and what it answers; `LANGUAGE sql STABLE SECURITY DEFINER`; `SET search_path = ''` with schema-qualified names; the argument named `p_project_id`; a scalar subquery so every input yields exactly one row (the "no existence oracle" property); the explicit `GRANT … TO anon, authenticated` with a one-line comment saying who calls it and which test asserts the rights. The body for this phase is the verified skeleton in RESEARCH § *Body, verified read-only* (`RETURNS jsonb`).

**Comment style in the target file** (`106-app-settings.sql`): single-line `--` comments, each paragraph on one line.

**Header sentence in `301-auth-functions.sql` to extend:** "What stays in `public`: `user_can` (the Edge Functions call it over RPC) and `user_has_account_grant`, …; `project_open_for_voters` (the frontend calls it); and the two storage path helpers …".

**Naming:** the function name must not contain an app-level `candidate_app` form (170's naming gate); a name beginning `contestant_` sorts first in both censuses.

---

### `apps/supabase/supabase/tests/database/NN-<content name>.test.sql` (pgTAP) — NEW

**Analog:** `apps/supabase/supabase/tests/database/30-closed-project.test.sql`. Take the file number at run time (`36-entity-identity.test.sql` is the last today; Phase 172 adds one too).

Frame:

```sql
-- 30-closed-project.test.sql: a project that is not open for voters, measured where the estate had gaps
--
-- WHY EVERY ZERO BELOW IS NON-VACUOUS. …
--
-- Depends on: 00-helpers.test.sql (create_test_data, test_id, …, set_test_user, reset_role, test_seed_fixture_grants); schema/301-auth-functions.sql (…).
BEGIN;

SET
  search_path = public,
  extensions;

-- Reset pgTAP internal state from previous test files in same session
DROP TABLE IF EXISTS __tcache__;

SELECT
  plan (20);

SELECT
  create_test_data ();

SELECT
  test_seed_fixture_grants ();
```

and it ends `SELECT finish ();` then `ROLLBACK;`.

Execute-right assertions (Section 1):

```sql
SELECT
  ok (
    has_function_privilege(
      'anon',
      'public.project_open_for_voters(uuid)',
      'EXECUTE'
    ),
    'anon can EXECUTE project_open_for_voters'
  );
```

Calling as a role, and the missing-project probe (Section 2):

```sql
SELECT
  set_test_user ('anon');

SELECT
  is (
    project_open_for_voters (test_id ('project_b')),
    false,
    'project_open_for_voters answers false to anon for the closed project B'
  );

SELECT
  is (
    project_open_for_voters ('0badc0de-0000-4000-8000-000000000030'::uuid),
```

Writing fixture state as `postgres` mid-test, then switching back (Section 4):

```sql
SELECT
  reset_role ();

UPDATE projects
SET
  open_for_voters = false
WHERE
  id = test_id ('project_a');

SELECT
  set_test_user ('anon');
```

Copy: the header that says what is already pinned elsewhere and why each assertion is non-vacuous; `test_id ('project_a')` (open) and `test_id ('project_b')` (closed), each of which already has a settings row from `create_test_data ()`; one assertion per `SELECT`; a "Depends on" line. The assertion list is in RESEARCH § *pgTAP*. Do not add to `30-closed-project.test.sql` or `25-matrix-conformance.test.sql`.

---

### `apps/supabase/supabase/tests/database/07-rpc-security.test.sql` (pgTAP)

**Analog:** Section 8c, edited **by these strings** (the query, the `plan (39)` count and the section comment do not change):

```sql
    'project_open_for_voters,storage_path_can,storage_path_is_public,user_can,user_has_account_grant',
    'census: the SECURITY DEFINER functions in public that anon can execute are exactly the five allow-listed ones'
…
    'get_entity_basic_data,project_open_for_voters,storage_path_can,storage_path_is_public,user_can,user_has_account_grant',
    'census: the SECURITY DEFINER functions in public that authenticated can execute are the same five plus get_entity_basic_data'
```

The expected value is `string_agg(p.proname, ',' ORDER BY p.proname)`, so the new name goes where it sorts; both descriptions say six.

---

### `apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts` (service, request-response)

**Analog:** the zero-rows arm of `_getAppSettings`:

```typescript
    const { data, error } = await this.scopedFrom('app_settings').select('settings').maybeSingle();

    if (error) throw new Error(`getAppSettings: ${error.message}`);

    if (!data) {
      const { data: open, error: rpcError } = await this.supabase.rpc('project_open_for_voters', {
        p_project_id: this.projectId
      });
      if (rpcError) throw new Error(`getAppSettings: ${rpcError.message}`);
      if (open === true) return {};
      if (open === false) {
        // The whole `access` object, because the app context's `mergeAppSettings` replaces settings by root key: …
        // reason: `Partial<DynamicSettings>` is a shallow partial, so a partial `access` object does not satisfy it, although the value is merged over the shipped defaults.
        return { access: { ...dynamicSettings.access, voterApp: false } } as DPDataType['appSettings'];
      }
      throw new Error('getAppSettings: project_open_for_voters returned a non-boolean');
    }
```

Copy for the new call: `this.supabase.rpc('<name>', { p_project_id: this.projectId })` (the project-scoping gate's check 4 requires the `p_project_id` key); `throw new Error(\`getAppSettings: ${rpcError.message}\`)` on an RPC error; building the returned root over `dynamicSettings.<root>` by spread; the `// reason:` comment form for the unavoidable cast.

**Parse idiom to reuse on the function's answer** (after dropping `null` members), from the readable-row path just below:

```typescript
    const outcome = parseWithPartialPreserve<StoredSettings>(
      StoredSettingsSchema,
      data?.settings,
      { column: 'app_settings.settings' },
      SETTINGS_PARSE_FAILURE_MESSAGE
    );
    const stored: StoredSettings = outcome.value ?? {};
```

The `Json` the RPC returns reaches the schema through narrowing, never `as Json as unknown as …` (`scripts/assert-adapter-casts.mjs`). The six implementation requirements are RESEARCH § *The provider's zero-rows branch*. Rewrite the docstring's "Limitation:" paragraph and both "replaces settings by root key" comments.

---

### `…/dataProvider/supabaseDataProvider.test.ts` (test)

**Analog:** the zero-rows cases inside `describe('getAppSettings', …)`:

```typescript
    it('returns the voter app as inaccessible when zero settings rows come back and the project is not open for voters', async () => {
      mockSupabase._mockResponses['app_settings'] = { data: null, error: null };
      mockSupabase._mockRpcResponses['project_open_for_voters'] = { data: false, error: null };

      const result = (await provider.getAppSettings()) as DynamicSettingsTestNarrow;

      expect(result.access?.voterApp).toBe(false);
      // The whole `access` object is carried, because the app context merges settings by root key; …
      expect(result.access?.candidateApp).toBe(true);
      expect(mockSupabase.rpc).toHaveBeenCalledWith('project_open_for_voters', {
        p_project_id: '00000000-0000-0000-0000-000000000001'
      });
    });
```

Copy: `_mockResponses['app_settings']` for the table read, `_mockRpcResponses['<rpc name>']` per RPC, the `DynamicSettingsTestNarrow` cast, `toHaveBeenCalledWith` on the RPC arguments, and the error case form `await expect(provider.getAppSettings()).rejects.toThrow('getAppSettings: rpc-boom')`. This existing case must gain a mocked response for the new function, and its inline comment about root-key merging is restated.

---

### `scripts/assert-project-scoped-queries.mjs` (config, gate)

**Analog:** the `project_open_for_voters` entry and its docblock paragraph:

```javascript
 * `project_open_for_voters` returns only whether the project is open, for the id the adapter already
 * holds, and the adapter asks it only when the caller can read no `app_settings` row. It takes the
 * project as a required argument, so it is held to check 4.
…
const PROJECT_SCOPED_RPCS = {
  get_nominations: 'requires p_project_id',
  …
  project_open_for_voters: 'requires p_project_id',
```

Add one entry with the disposition `'requires p_project_id'` and one docblock paragraph in the same form (what it returns, when the adapter asks, why check 4 applies).

---

### `routes/candidate/preregister/+layout.server.ts` → `routes/contestant/preregister/+layout.server.ts`, and the new `register/` guard (middleware, request-response)

**Analog:** the existing guard, in full up to the redirect:

```typescript
import { log } from '@openvaa/app-shared';
import { redirect } from '@sveltejs/kit';
import { createDataProvider, createSupabaseAnonClient } from '$lib/api/dataProvider';
import { buildRoute } from '$lib/routes';
import type { DPDataType } from '$lib/api/base/dataTypes';

export async function load({ cookies, fetch, locals }) {
  const dataProvider = createDataProvider({ fetch, client: createSupabaseAnonClient({ fetch }) });

  const appSettings: DPDataType['appSettings'] = await dataProvider
    .getAppSettings()
    .catch((e): DPDataType['appSettings'] => {
      log.error(`[Candidate App preregister layout] Error reading app settings: ${e?.message ?? 'No error message'}`, {
        err: e
      });
      return {};
    });
  const preRegistrationEnabled = Boolean(appSettings.preRegistration?.enabled);

  if (!preRegistrationEnabled) {
    return redirect(
      303,
      buildRoute({
        route: 'CandAppLogin',
        locale: locals.currentLocale
      })
    );
  }
```

Copy for both guards: the explicitly anonymous client; the read through the DataProvider (a route server file may not touch Supabase directly, and an ESLint guard enforces it at this path); the logged, fail-closed `.catch` returning `{}`; `redirect(303, buildRoute({ route: '<login route key>', locale: locals.currentLocale }))`. Replace the boolean line with the accessor call on the **raw** `appSettings` (`candidate × identity_provider` here; "any served type allows `code`" for the register guard). Restate the two comments, which name `preRegistration.enabled` and narrate history.

**The new `register/` guard differs from the analog in one way the analog cannot show (RESEARCH Pitfall 1):** it must read the URL and leave the invitation leg of `register/password` reachable under every matrix. The page's own test for that leg is in `routes/candidate/register/password/+page.svelte`:

```typescript
  const registrationKey = page.url.searchParams.get('registrationKey') || '';
  // Invite flow: user has a session from auth callback verifyOtp, email is provided but no registrationKey
  const isInviteFlow = candCtx.isAuthenticated && email !== '' && registrationKey === '';
```

Also note `routes/candidate/register/+page.ts` sets `export const ssr = false;`, so the document response for the code-entry page is a 200 shell and the redirect is followed by the client router; `register/password` gets a real 303.

**Guard decision helper + test.** Analog for "a pure helper beside its route, unit-tested without loading the component": `apps/frontend/src/routes/candidate/(protected)/candidateHome.helpers.ts` and its `candidateHome.helpers.test.ts` (`import { describe, expect, it } from 'vitest';`, imports only the helper, a header stating the contract as a bullet list). Analog for driving a server `load` directly with a fake event, if the planner prefers that level: `apps/frontend/src/routes/admin/layout.server.test.ts` (`import { load as adminLoad } from './+layout.server';`, a `makeEvent(...)` factory, loads cast to an erased `LoadFn`).

---

### `routes/candidate/login/+page.svelte` → `routes/contestant/login/+page.svelte` (component)

**Analog:** itself. Context read, which already follows the destructuring rule and is kept:

```svelte
  const candCtx = getCandidateContext();
  const { appCustomization, darkMode, getRoute, t } = candCtx;
  // appSettings is a reactive accessor — read via candCtx.X, never destructure.
  const appSettings = $derived(candCtx.appSettings);
  const answersLocked = $derived(candCtx.answersLocked);
```

The three sites that change:

```svelte
  let isLoginShown = $derived(
    !!(email || showLogin || answersLocked || !appSettings.preRegistration?.enabled || status === 'error')
  );
```

```svelte
    {#if !answersLocked && appSettings.preRegistration?.enabled}
      <div class="divider">{t('common.or')}</div>
      <Button
        href={getRoute.current('CandAppPreregister')}
        …
        data-testid="login-preregister" />
    {/if}
```

```svelte
      <Button
        href={getRoute.current('CandAppRegister')}
        text={t('candidateApp.login.haveRegistrationCode')}
        data-testid="login-register-link" />
```

**Pattern for gating the code link** (unconditional today) is the sibling a few lines below it:

```svelte
      {#if appSettings.access.voterApp}
        <Button … data-testid="login-voter-app-link" />
      {/if}
```

Derive each cell once with `$derived(<accessor>(appSettings))` so the read stays inside a tracking scope; never read `appSettings.contestantApp.entityTypes` or `.registrationModes` directly. The heading read `t('dynamic.candidateAppName')` becomes the three-key form (see *Shared Patterns → The app's name*). Update the `@component` docblock's Settings list, which names `preRegistration.enabled`.

---

### `…/navigation/candidate/CandidateNav.svelte` → `…/navigation/contestant/ContestantNav.svelte` (component)

**Analog:** itself, the signed-out group:

```svelte
      {#if !candCtx.answersLocked}
        {#if appSettings.preRegistration?.enabled}
          <NavItem
            href={getRoute.current('CandAppPreregister')}
            icon="create"
            text={t('candidateApp.preregister.identification.start.title')} />
        {/if}
        <NavItem
          href={getRoute.current('CandAppRegister')}
          icon="check"
          text={appSettings.preRegistration?.enabled
            ? t('candidateApp.register.titleWithPreregistration')
            : t('candidateApp.register.title')} />
      {/if}
```

Both `preRegistration?.enabled` reads become the identity-provider cell; the second `NavItem` gains its own `{#if}` on "any served type allows `code`". The script block already has `const appSettings = $derived(candCtx.appSettings);`.

---

### The five name readers and the two embedding layouts (components)

All five read the leaf today; each takes the three-key form.

| File (today) | Today's read |
|---|---|
| `routes/candidate/login/+page.svelte` | `{showPasswordSetMessage ? t('candidateApp.setPassword.passwordSetSuccesfully') : t('dynamic.candidateAppName')}` |
| `routes/candidate/register/+page.svelte` | `<PreHeading class="text-primary text-2xl font-bold">{t('dynamic.candidateAppName')}</PreHeading>` |
| `routes/candidate/forgot-password/+page.svelte` | `<PreHeading>{t('dynamic.candidateAppName')}</PreHeading>` |
| `routes/candidate/password-reset/+page.svelte` | `<PreHeading>{t('dynamic.candidateAppName')}</PreHeading>` |
| `routes/candidate/help/+page.svelte` | `` subject: `${t('candidateApp.help.supportEmailSubject')}: ${t('dynamic.candidateAppName')}`, `` |

Two of these need a context read they do not have today. `forgot-password/+page.svelte` destructures only stable references (`const { getRoute, requestForgotPasswordEmail, t } = getCandidateContext();`); to derive the name key it must keep the context object and read `ctx.appSettings` inside `$derived`, as `register/+page.svelte` does:

```svelte
  const ctx = getCandidateContext();
  // appSettings is a reactive accessor — read via ctx.X, never destructure.
  const appSettings = $derived(ctx.appSettings);
```

`help/+page.svelte` reads `ctx.appSettings.admin.email` once at init on purpose (its comment says so); the mail subject is built in the same one-time block, so the planner decides whether the name key there is a one-time read or a `$derived`.

`routes/candidate/+layout.svelte` reads the **app** context, not the contestant context:

```svelte
  const ctx = getAppContext();
  // appSettings is a reactive accessor — read via ctx.X, never destructure.
  const appSettings = $derived(ctx.appSettings);
…
{#if !appSettings.dataAdapter.supportsCandidateApp}
  <… title={t('candidateApp.notSupported.title')} content={t('candidateApp.notSupported.content')} …/>
{:else if !appSettings.access.candidateApp}
  <… title={t('dynamic.candidateAppNotAccessible.title')} content={t('dynamic.candidateAppNotAccessible.content')} />
```

Each of those four `t()` calls gains the name as a parameter.

---

### Message catalogues, seven locales (config)

**Files (today → after 170):** `apps/frontend/messages/<locale>/dynamic.json`; `candidateApp.notSupported.json` → `contestantApp.notSupported.json`; `candidateApp.help.json` → `contestantApp.help.json`. Locales: `da, en, et, fi, fr, lb, sv`. No file is added, so `test('each locale has 47 message files', …)` in `translations.test.ts` is unaffected.

**Analog for a nested group replacing a leaf** — the neighbour in the same file, `apps/frontend/messages/en/dynamic.json`:

```json
    "candidateAppName": "Election Compass for Candidates",
    "candidateAppNotAccessible": {
      "content": "The Election Compass for Candidates has not been released yet. Please return to this address when it becomes available.",
      "title": "Sorry, the Election Compass for Candidates is not yet available"
    },
```

The name becomes a group with the keys `candidate`, `candidateAndOrganization`, `organization` (members are alphabetical in these files).

**Analog for a named parameter:** `dynamic.candidateAppPrivacy.registryStatement.content` carries `{appName}` and is called in `apps/frontend/src/lib/candidate/components/termsOfUse/TermsOfUse.svelte` as:

```typescript
    t('dynamic.candidateAppPrivacy.registryStatement.content', { appName: t('dynamic.appName') })
```

The five sentence keys to parameterise, with today's `en` text: `dynamic.candidateAppNotAccessible.{title,content}` (above); `candidateApp.notSupported.title` "Candidate Application Not Available" and `.content` "This Election Compass version does not support the Candidate Application."; `candidateApp.help.ingress` "Below are answers to the most common questions about the Election Compass for candidates. …". Use a parameter name other than `appName`, which already means the voter-facing product name. The per-locale terms and the inflection warning for `fi`, `et`, `da`, `lb` are in RESEARCH § *Terms per locale*.

After the catalogue edit: `yarn workspace @openvaa/frontend generate:translation-key-type`.

---

### `apps/frontend/src/lib/i18n/tests/translations.test.ts` (test, file-I/O)

**Analog:** its own top-level tests, which read the JSON files directly:

```typescript
test('all 7 locales have message directories', () => {
  expect(translationLocales).toEqual(['da', 'en', 'et', 'fi', 'fr', 'lb', 'sv']);
});
```

and the `lang.json` test, which reads one named group from a catalogue file with `JSON.parse(fs.readFileSync(path.join(messagesDir, baseLocale, 'lang.json'), 'utf8')).lang` and asserts a non-empty value per expected member. Copy that form for D-16: loop `translationLocales`, read `dynamic.json`, assert the three keys under the name group are non-empty strings.

---

### Seed templates: `e2e/base.ts`, `e2e/perm/shared.ts`, `default.ts` (config, batch)

**Analog:** `BASE_APP_SETTINGS` in `packages/dev-seed/src/templates/e2e/base.ts`, the only dataset carrying the root today:

```typescript
  notifications: {
    candidateApp: null,
    voterApp: null
  },
  candidateApp: {
    questions: {
      hideHero: false,
      hideVideo: false
    }
  }
  // `satisfies Json`, not `as const`: this object is written straight into the `app_settings.settings` JSONB column, whose type is the MUTABLE `Json`.
} satisfies Json;
```

Copy into all three: the **whole** root (`questions` with `hideHero` and `hideVideo`, `entityTypes`, `registrationModes` with **both** rows), written as plain mutable arrays under `satisfies Json` (never `as const`: "`as const` would make every nested array a readonly tuple, which `Json` rejects"), and never a literal `undefined` (JSONB drops it and the post-seed exact-equality assertion fails). Values per dataset are D-18.

**`MINIMAL_BASE_APP_SETTINGS`** (`e2e/perm/shared.ts`) ends today with:

```typescript
  notifications: { voterApp: { show: false }, candidateApp: { show: false } },
  analytics: { trackEvents: false }
} satisfies Json;
```

It gains the root; the 29 templates that derive from it inherit it with no edit (`perm-hide-hero`'s overlay `candidateApp: { questions: { hideHero: true } }` composes through `buildMinimal`'s `deepMerge`).

**`default.ts`**, `app_settings.fixed[0].settings`, holds `entities` and `results` only today. Its comment "The frontend's `mergeAppSettings` (…) shallow-merges by root key, so a value written here REPLACES the whole `results` object … we MUST mirror the full default shape" describes the old merge and is restated in the same edit.

---

### `packages/dev-seed/tests/templates/base-app-settings.test.ts` and the new built-in-templates test (test)

**Analog:** its own cases. The key-list pin (170 renames one entry; this phase adds none):

```typescript
  it('declares the base dataset top-level settings blocks', () => {
    expect(Object.keys(BASE_APP_SETTINGS).sort()).toEqual(
      ['access', 'candidateApp', 'elections', 'entities', 'entityDetails', 'header', 'headerStyle', 'matching', 'notifications', 'questions', 'results'].sort()
    );
  });
```

The per-block pin form to copy for the root's three members:

```typescript
  it('access block enables candidate/voter/admin apps, not under maintenance, answers unlocked', () => {
    expect(BASE_APP_SETTINGS.access).toEqual({
      candidateApp: true,
      voterApp: true,
      …
    });
  });
```

**New test over every built-in template** (RESEARCH Verdict B): the reach-into-the-registry idiom is the last `describe` of the same file:

```typescript
import { BASE_APP_SETTINGS, BUILT_IN_TEMPLATES } from '../../src';
…
    const registryFrag = (BUILT_IN_TEMPLATES['e2e/base'] as unknown as Record<string, unknown>).app_settings as
      FragmentView | undefined;
    const row = registryFrag?.fixed?.[0];
```

Loop `Object.entries(BUILT_IN_TEMPLATES)`, take `app_settings.fixed[0].settings`, and parse its contestant root through `StoredSettingsSchema` from `@openvaa/app-shared`. No dev-seed test imports that schema today, so check that `@openvaa/app-shared` is a dependency of `packages/dev-seed` before writing the import. The header states "contract: pure shape assertions. No Supabase imports."

---

### `tests/tests/setup/candidate/bank-auth-journey.setup.ts` → `tests/tests/setup/contestant/…` (E2E setup)

**Analog:** itself:

```typescript
  await setupFromTemplate('perm-bankauth-notloc', {
    appSettingsOverride: { preRegistration: { enabled: true } }
  });
```

becomes D-18's override (`{ contestantApp: { registrationModes: { candidate: ['identity_provider', 'email', 'code'] } } }`). The long comment above it ("Scoped preregistration enablement (EFLOW-10b): … reads `app_settings.settings.preRegistration.enabled` server-side …") and the two places in `tests/tests/setup/shared/setupFromTemplate.ts` that name `preRegistration.enabled` (the `appSettingsOverride` TSDoc and the comment above `if (options?.appSettingsOverride) {`) are restated as present-tense descriptions.

---

### `tests/tests/specs/perm/perm-closed-project.spec.ts` (E2E)

**Analog 1 — itself.** Frame and rigidity contract (header: "every assertion is HARD — no expect.soft, no try/catch wrapping expect(), no .catch fallbacks. Testid-only via `testIds` (`getByRole('heading')` permitted per the maintenance-page pattern)"):

```typescript
test.describe('perm-closed-project (162.1 D-05, D-16, D-17)', () => {
  test.describe.configure({ mode: 'serial' });

  test.afterAll(async () => {
    await new SupabaseAdminClient().ensureProject();
  });
```

Expected text is read from the catalogue, never copied:

```typescript
const MAINTENANCE_TITLE: string = JSON.parse(
  fs.readFileSync(path.join(TESTS_DIR, '../../apps/frontend/messages/en/dynamic.json'), 'utf8')
).dynamic.voterAppNotAccessible.title;
```

Copy that for the three app names. The existing login-page test to extend or sit beside:

```typescript
  test('anon can reach the candidate login and the admin login on a closed project', async ({ page }) => {
    await page.goto('/en/candidate/login');
    await expect(page.getByTestId(testIds.candidate.login.email)).toBeVisible();
    await expect(page.getByTestId(testIds.shared.errorMessage)).toBeHidden();
```

Prefer `buildRoute({ route: '<login route key>', locale: 'en' })` (used further down the same file) over the literal path, which 170 changes.

**Analog 2 — in-spec re-seed:** `tests/tests/specs/perm/perm-access-disable.spec.ts`:

```typescript
  let client: SupabaseAdminClient;

  test.beforeAll(() => {
    client = new SupabaseAdminClient();
  });
  …
  test('voterApp disabled: / + /elections show maintenance; /candidate available', async ({ page }) => {
    await client.updateAppSettings({
      access: { voterApp: false, candidateApp: true, underMaintenance: false }
    });
    await page.goto('/en');
```

Copy: one `updateAppSettings` at the top of each test stating the **whole** of what the test means (it is a merge: state both matrix rows and whole lists every time).
**Do not copy:** that file's `afterAll` restore. `setupFromTemplate` does an authoritative REPLACE, so this spec writes nothing back, and never writes `null` to unset a setting.

**Axe:** `assertAxeScan(page, route, testInfo, label)` from `tests/tests/utils/axeScan.ts`; the `route` argument is an `AxeRoute` with a `contentTestId` the helper waits for. Call sites to copy the argument shape from: `tests/tests/specs/a11y/candidate-a11y.spec.ts` (`await assertAxeScan(page, toScanEntry(entry, entry.name, false), testInfo, entry.name);`).

---

### `tests/tests/utils/testIds.ts` (config)

**Analog:** the `candidate.login` group:

```typescript
    login: {
      email: 'login-email',
      submit: 'login-submit',
      errorMessage: 'login-errorMessage',
      // testid on the <p> rendering t('candidateApp.login.answersLockedInfo') when answersLocked is true. …
      answersLockedInfo: 'login-answers-locked-info'
```

Add entries for the three ids the page already renders: `login-register-link`, `login-preregister`, `login-show`.

---

### Docs (four pages + agent docs)

| Page (today's path under `apps/docs/src/routes/(content)/`) | Anchor to edit |
|---|---|
| `developers-guide/configuration/app-settings/+page.md` | "**No row.** Nothing creates a settings row for a project. …"; "The merge (`mergeAppSettings` in …) replaces values **by top-level key**"; the settings table; `## Adding a new setting` (the house procedure this phase follows) |
| `publishers-guide/app-settings/+page.md` | "A stored setting replaces the whole top-level group it belongs to. …"; the settings table; the `0`-versus-omission note for `results.showFeedbackPopup` |
| `developers-guide/candidate-app/bank-authentication/+page.md` | every `preRegistration` mention |
| `developers-guide/candidate-app/pre-registration-and-invitation/+page.md` | every `preRegistration` mention |

Agent docs: the `project_open_for_voters(uuid)` rows in `.claude/skills/database/schema-reference.md` (function table) and `rls-policy-map.md` (helper table), and the census sentence in `SKILL.md`. 170 may move the two `candidate-app` docs directories; re-derive with `git grep -n -l preRegistration -- apps/docs`.

## Shared Patterns

### Reading a reactive context value (applies to every `.svelte` file in plan 3)

**Source:** `routes/candidate/login/+page.svelte`, `routes/candidate/register/+page.svelte`, `CandidateNav.svelte`.

```svelte
  const candCtx = getCandidateContext();
  const { getRoute, t } = candCtx;          // stable references: safe to destructure
  const appSettings = $derived(candCtx.appSettings);   // reactive accessor: never destructured
```

Every accessor call is wrapped in `$derived(...)` over `appSettings`, so it is re-evaluated when the settings change (sign-in swaps the closed-project payload for the stored row).

### The app's name (applies to the five readers and the five parameterised sentences)

**Source:** D-16 plus the `t(key, params)` wrapper in `apps/frontend/src/lib/i18n/wrapper.ts`. One derivation per file: name key from the accessor, then `` t(`dynamic.contestantAppName.${nameKey}`) ``, which typechecks as a three-member union once the catalogue holds the keys and `translationKey.ts` is regenerated. Sentences take the result as a parameter in the `{ <param>: t(...) }` form shown by `TermsOfUse.svelte`.

### Adding a dynamic setting (applies to plan 1 and the docs in plan 4)

**Source:** `apps/docs/…/developers-guide/configuration/app-settings/+page.md` § "Adding a new setting": type with TSDoc in `DynamicSettings` → default in `dynamicSettings.ts` → optional member in the strict `StoredSettingsSchema` → both docs tables.

### Fail-closed settings read on the server (applies to both guards)

**Source:** `routes/candidate/preregister/+layout.server.ts`. Anonymous client → `getAppSettings()` → `.catch` that logs with `log.error` and returns `{}` → accessor on the raw value → `redirect(303, buildRoute(...))`. The accessors being total on `{}` is what makes "provider failed" equal "mode off".

### Definer function in `public` (applies to the SQL, both censuses, the gate script and the agent docs)

**Source:** `project_open_for_voters` in `301-auth-functions.sql`. A new one moves five things together: the function with `search_path = ''`, its explicit grant, both census strings in `07-rpc-security.test.sql`, the `PROJECT_SCOPED_RPCS` disposition, and the `301` header sentence listing what stays in `public`.

### Comment form (applies to every file under `apps/`, `packages/`, `tests/`)

**Source:** `CLAUDE.md` § Comment Hygiene and `scripts/assert-comment-hygiene.mjs`. Each comment paragraph on one line (TypeScript, Svelte and SQL alike); present tense; no decision ids, plan numbers or "previously". Several analog excerpts above carry historical narrative or review ids (`REVIEW-ADP-06`, `157-16`, `EFLOW-10b`, "Pattern 8"); copy their structure, not that wording, and restate any such comment the edit touches.

### Schema regeneration order (applies to plan 2)

**Source:** RESEARCH § *Schema workflow*. Edit `schema/*.sql` → `yarn schema:regenerate` → `yarn db:reset` → `yarn db:types` (expect one new `Functions` entry) → pgTAP → `yarn db:lint:sql`.

## No Analog Found

| File | Role | Data Flow | Reason |
|---|---|---|---|
| The accessors' totality-on-partial-input rule in `<contestant app config>.ts` | utility | transform | No existing function in `@openvaa/app-shared` derives a value from settings with member-by-member fallback to the shipped defaults. Use RESEARCH § *Accessors* for the rules; the file shape still follows `entityTypes.ts` and `isEmoji.ts`. |
| The dedup-to-canonical-order transform in `StoredSettingsSchema` | model | transform | No schema under `packages/app-shared/src/data/schemas/` uses `.transform()` or `z.enum` today (`CardContentSchema`'s docblock explains why the others are plain strings). Use the probed skeleton in RESEARCH § *Schema: probed on this tree's zod*. |

Two partial gaps worth naming: no existing `+layout.server.ts` guard reads `url` to exempt one leg (the invitation exemption is new logic; only its surrounding shape has an analog), and no E2E spec asserts a login-page registration entry today, so the three test ids have no prior consumer.

## Metadata

**Analog search scope:** `packages/app-shared/src/`, `packages/data/src/objects/entities/base/`, `packages/dev-seed/{src/templates,tests/templates}/`, `apps/frontend/src/{lib/utils,lib/contexts/app,lib/api/adapters/supabase,lib/i18n,lib/dynamic-components/navigation,routes/candidate,routes/admin}/`, `apps/frontend/messages/en/`, `apps/supabase/supabase/{schema,tests/database}/`, `tests/tests/{specs,setup,utils}/`, `scripts/`, `apps/docs/`, `.claude/skills/database/`
**Files scanned:** 38 read in whole or in targeted sections; every named analog confirmed tracked with `git ls-files`
**Pattern extraction date:** 2026-10-05
**Re-check before planning:** the after-170 paths and route keys against Phase 170's summary; the two census strings if Phase 172 has executed first.
