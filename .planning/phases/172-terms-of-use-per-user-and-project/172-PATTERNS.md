# Phase 172: Terms of Use per User and Project - Pattern Map

**Mapped:** 2026-10-05
**Files analyzed:** 46 new or modified files (11 new, 35 modified), plus generated files listed separately
**Analogs found:** 44 / 46

**Tree read:** branch `feat/entity-signup-multi-grant`, **before Phase 170**. Every analog is cited by
today's path plus a symbol or a verbatim quote, never by line number. Where Phase 170 moves the file, the
post-170 path follows in brackets `[…]`, per the name map in `172-CONTEXT.md`. Find any anchor with
`git grep -F '<quote>'` at plan time.

**Tracked-source gate:** all analog paths named below were checked with `git ls-files` and are tracked.
None is a gitignored mirror.

**Excerpts are copies of today's code.** Some carry comments that would fail Comment Hygiene if copied
verbatim (historical narrative, plan ids). Copy the code shape, not those comments.

## File Classification

### New files

| New file (post-170 path) | Role | Data flow | Closest analog (today's path) | Match |
|---|---|---|---|---|
| `apps/supabase/supabase/schema/3xx-terms-of-use.sql` (name is discretion) | migration (schema source) | CRUD | `apps/supabase/supabase/schema/300-auth-tables.sql` | role-match (user-keyed table, revoke, RLS; no self-row policy exists yet) |
| `apps/supabase/supabase/tests/database/NN-terms-of-use-acceptances.test.sql` | test (pgTAP) | CRUD | `…/tests/database/09-column-restrictions.test.sql` (privilege refusals) + `07-rpc-security.test.sql` (census) + `16-anon-visibility.test.sql` (catalogue census over `pg_policies` / `pg_get_functiondef`) | exact (composite) |
| `apps/frontend/src/lib/contestant/gates/gates.ts` | utility (ordered predicate table) | transform | `apps/frontend/src/lib/routes/appGates.ts` | role-match (an ordered, frozen gate table whose rows are data) |
| `apps/frontend/src/lib/contestant/gates/gates.test.ts` | test (unit) | transform | `apps/frontend/src/lib/routes/appGates.test.ts` | role-match |
| `apps/frontend/src/lib/contestant/components/termsOfUse/TermsOfUseGate.svelte` | component | request-response | the `{:else if layoutState === 'terms'}` block of `apps/frontend/src/routes/candidate/(protected)/+layout.svelte`; sibling `lib/candidate/components/termsOfUse/TermsOfUseForm.svelte` for the component conventions | exact (extraction of existing markup) |
| `…/termsOfUse/TermsOfUseGate.type.ts` | model (props type) | — | `apps/frontend/src/lib/candidate/components/termsOfUse/TermsOfUseForm.type.ts` | exact |
| `apps/frontend/src/routes/contestant/(protected)/layout.server.test.ts` | test (unit, server load) | request-response | `apps/frontend/src/routes/admin/layout.server.test.ts` (drives a `load` directly) + `apps/frontend/src/routes/admin/(protected)/layout.server.test.ts` (`vi.hoisted` + `vi.mock` of the module the load imports) | role-match |
| `.planning/todos/pending/<date>-172-admin-confirm-requires-editor-acceptance.md` (name is discretion) | config (planning todo) | — | `.planning/todos/pending/2026-08-27-147-tou-gate-modal-unscanned.md` (frontmatter shape) | exact |

### Modified files — plan 1 (expand)

| Modified file (today → post-170) | Role | Data flow | Closest analog | Match |
|---|---|---|---|---|
| `apps/supabase/scripts/lint-schema.mjs` | config (gate allow-list) | — | itself: `REACHES_NEITHER_ALLOW`, the `['public', 'grants', 'auth_admin_read_grants']` entry | exact |
| `scripts/assert-project-scoped-queries.mjs` | config (gate list) | — | itself: `PROJECT_SCOPED_TABLES` | exact |
| `apps/frontend/src/lib/api/adapters/supabase/supabaseAdapter.type.ts` | model (types) | CRUD | itself: `ProjectScopedTable`, `ScopedTableAccess['insert']` | exact |
| `apps/frontend/src/lib/api/adapters/supabase/supabaseAdapter.ts` | service (adapter mixin) | CRUD | itself: `scopedFrom`, the `insert:` member and the `writes` cast | exact |
| `apps/frontend/src/lib/api/base/dataWriter.type.ts` | model (types) | request-response | itself: `BasicUserData`; the `setPassword` member of `DataWriter` | exact |
| `apps/frontend/src/lib/api/base/universalDataWriter.ts` | service (abstract base) | request-response | itself: `setPassword` / `_setPassword` pair | exact |
| `apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts` | service (adapter) | CRUD | itself: `_getBasicUserData`, the `scopedFrom('nominations')` read in `_getCandidateUserData`, `_setPassword` | exact |
| `…/dataWriter/supabaseDataWriter.test.ts` | test (unit) | CRUD | itself: `createChain`, `mockVerifiedSession`, `describe('getBasicUserData')`, `describe('project scoping')` | exact |
| `apps/frontend/src/lib/contexts/candidate/candidateContext.svelte.ts` [`contexts/contestant/contestantContext.svelte.ts`] | provider (context) | request-response | `apps/frontend/src/lib/contexts/auth/authContext.svelte.ts`: `setPassword = async (…) =>` arrow field; in-file `clearIdToken` | exact |
| `apps/frontend/src/lib/contexts/candidate/candidateContext.type.ts` [`contexts/contestant/contestantContext.type.ts`] | model (types) | — | itself: the `logout: () => Promise<void>;` member | exact |
| `apps/frontend/src/routes/candidate/(protected)/+layout.server.ts` [`routes/contestant/(protected)/…`] | route (server load) | request-response | itself: `load`, `handleError` | exact (reorder) |
| `apps/frontend/src/routes/candidate/(protected)/+layout.svelte` [`routes/contestant/(protected)/…`] | component (route layout) | request-response | itself: `validity`, `layoutState`, the data-applying `$effect` | exact (shrink) |
| `apps/frontend/src/routes/candidate/(protected)/termsOfUseLayout.svelte.test.ts` [`routes/contestant/(protected)/…`] | test (unit, mounted component) | request-response | itself: fake context via `vi.mock`, `render`, `acceptAndSubmit` | exact (rewrite against the new call) |
| `apps/frontend/src/lib/candidate/components/termsOfUse/index.ts` [`lib/contestant/…`] | config (barrel) | — | itself | exact |
| `tests/tests/utils/supabaseAdminClient.ts` | utility (E2E admin client) | CRUD | itself: `forceRegister`, `forceRegisterAdmin` (grant insert inside the compensating `try`) | exact |
| `tests/tests/specs/perm/perm-localisation-positive.spec.ts` | test (E2E) | request-response | itself: the `client.sendEmail({` step | exact (one call added, docblock corrected) |

### Modified files — plan 2 (contract)

| Modified file | Role | Data flow | Closest analog | Match |
|---|---|---|---|---|
| `apps/supabase/supabase/schema/102-entities.sql`, `301-auth-functions.sql`, `302-rls.sql`, `303-column-grants.sql`, `400-storage.sql`, `503-entity-rpcs.sql` | migration | CRUD | the organization / faction / alliance arms beside each candidate arm in the same file | exact (make the candidate arm read like its siblings) |
| `apps/supabase/supabase/tests/database/{00-helpers,03,05,07,09,10,16,18,20,21,25,33}*.test.sql` | test (pgTAP) | CRUD | each file itself (see RESEARCH § *pgTAP impact*) | exact (deletions) |
| `packages/supabase-types/src/{database.overrides.ts,column-map.ts}`, `RPC-NULLABILITY.md` | model / config | — | each file itself | exact (deletions) |
| `apps/frontend/src/lib/api/base/dataWriter.type.ts` (`LocalizedCandidateData`, `EditableEntityProps`), `universalDataWriter.ts` (`updateEntityProperties` guard), `supabaseDataWriter.ts` (`_getCandidateUserData`, `_updateEntityProperties`) | model / service | CRUD | each itself | exact (deletions) |
| `apps/frontend/src/lib/contexts/candidate/candidateUserDataState.svelte.ts`, `.type.ts`, `.svelte.test.ts` [`contexts/contestant/contestantUserDataState.*`] | store | CRUD | itself: the `image` half of every `termsOfUseAccepted` site | exact (deletions) |
| `packages/dev-seed/src/templates/e2e/base.ts` | config (seed template) | batch | itself: the `test-e2e-base-ca-aa-hidden` and `…-unregistered` rows | exact |
| `packages/dev-seed/src/template/permittedKeys.ts`, `templates/defaults/candidates-override.ts`, `templates/e2e/perm/shared.ts`, `templates/e2e/perm/perm-localisation-positive.ts`, `src/supabaseAdminClient.ts` (comments) | config | batch | each itself | exact (deletions) |
| `packages/dev-seed/tests/templates/base.test.ts`, `default.test.ts`, `tests/integration/default-template.integration.test.ts` | test (unit) | — | `base.test.ts`: the two `'… has NO terms_of_use_accepted …'` cases | exact (rewrite to `confirmed: false`) |
| `tests/tests/utils/supabaseAdminClient.ts` (`unregisterCandidate` step 3, `deleteAllTestUsers` `'reset-terms-of-use'`), `tests/tests/setup/perm/perm-closed-project.setup.ts` | utility / test setup | CRUD | each itself | exact (deletions, same commit as the column) |
| `tests/tests/specs/voter/voter-journey.spec.ts`, `tests/tests/utils/testCredentials.ts`, `tests/tests/utils/candidateJourneyConstants.ts` [`contestantJourneyConstants.ts`] | test (comments only) | — | each itself | exact |

### Modified files — plan 3 (close)

| Modified file | Role | Data flow | Closest analog | Match |
|---|---|---|---|---|
| `tests/tests/utils/testCredentials.ts` | config (E2E identities) | — | `tests/tests/utils/adminCredentials.ts`: `ADMIN_STORAGE_STATE` declared once | role-match |
| `tests/tests/setup/shared/auth.setup.ts` | test (Playwright setup) | request-response | itself: `setup('register + authenticate as base candidate', …)` | exact |
| `tests/tests/setup/shared/base.teardown.ts` | test (Playwright teardown) | CRUD | itself: `await client.unregisterCandidate(TEST_CANDIDATE_EMAIL);` | exact |
| `tests/tests/specs/a11y/candidate-a11y.spec.ts` [`contestant-a11y.spec.ts`] | test (E2E axe) | request-response | itself: `CANDIDATE_AXE_ROUTES`, `toScanEntry`, the `for (const entry of …)` runner with its dark twin | exact |
| `tests/playwright.config.ts` | config | — | itself: the `ADMIN_STORAGE_STATE` re-export and the comment at the `@cand-session` split | exact (comment only, see the finding below) |
| `.claude/skills/database/{schema-reference,rls-policy-map}.md`, `apps/docs/…/backend/authentication/+page.md`, `apps/docs/…/candidate-app/registration/+page.md` [`contestant-app/…`] | docs | — | each itself | exact |
| `.planning/todos/pending/2026-08-27-147-tou-gate-modal-unscanned.md` | config (planning todo, closed) | — | itself | exact |

### Generated, never hand-edited

`apps/supabase/supabase/migrations/00001_initial_schema.sql` (`yarn schema:regenerate`),
`packages/supabase-types/src/database.ts` (`yarn db:types`), the derived region of `RPC-NULLABILITY.md`
(`--write`), the `apps/docs` generated component pages (`yarn workspace @openvaa/docs generate:docs`).

---

## Pattern Assignments

### `apps/supabase/supabase/schema/3xx-terms-of-use.sql` (migration, CRUD)

**Analog:** `apps/supabase/supabase/schema/300-auth-tables.sql` — the only other table keyed on
`auth.users`. Copy its file shape; the self-row policies and the column-level INSERT grant have no analog and
come from RESEARCH § *R-1* (measured).

**File header and dependency block** (top of the analog):
```sql
-- The grant model: `public.grants`, its constraints, its indexes, its RLS and the access-token hook's schema access.
--
-- Depends on:
-- - 100-tenancy.sql (accounts, projects)
-- - 000-enums.sql (grant_scope_type, grant_role_type, entity_type)
```

**User-keyed column with cascade** (inside `CREATE TABLE public.grants`):
```sql
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  ...
  created_at timestamptz NOT NULL DEFAULT now(),
```

**Index declared beside its table, with the reason for what is and is not indexed** (anchor
`CREATE INDEX idx_grants_scope_target`):
```sql
-- The reverse lookup, who holds a grant on this target, which editor administration needs and the UNIQUE cannot serve because it leads with user_id. No index on user_id alone: the UNIQUE leads with it, which covers the foreign key for lint-schema.mjs's unindexed-foreign-key advisor, and a second index would cost every write.
CREATE INDEX idx_grants_scope_target ON public.grants (scope, target_type, target_id);
```
The same reasoning applies here: the primary key leads with `user_id`, so only `project_id` needs
`idx_terms_of_use_acceptances_project_id` (RESEARCH H-6).

**RLS enable, then the revoke that undoes the default ACL** (anchors `ALTER TABLE public.grants ENABLE ROW
LEVEL SECURITY;` and `REVOKE ALL ON TABLE public.grants`):
```sql
ALTER TABLE public.grants ENABLE ROW LEVEL SECURITY;
...
-- Prevent regular users from accessing grants directly: a new table in the public schema is exposed through PostgREST by default, and these rows say who may do what to whom across every account and project in the instance.
REVOKE ALL ON TABLE public.grants
FROM
  authenticated,
  anon,
  public;
```
For the new table the revoke comes **before** the two grants (RESEARCH H-4), then
`GRANT SELECT … TO authenticated` and `GRANT INSERT (project_id) … TO authenticated`.

**Policy statement form** (anchor `CREATE POLICY "auth_admin_read_grants"`): quoted policy name, explicit
`TO <role>`. Names to use: `authenticated_select_terms_of_use_acceptances`,
`authenticated_insert_terms_of_use_acceptances`.

**Column-grant comment convention** — `apps/supabase/supabase/schema/303-column-grants.sql`, file header:
```sql
-- Approach: REVOKE table-level UPDATE, then GRANT UPDATE only on allowed columns.
-- (Column-level REVOKE is ineffective when table-level UPDATE exists.)
```
The new file states the same rule for INSERT, and says why the table has two policies instead of the
checklist's five (D-04, D-05), in present tense.

**Formatting:** the schema files are Prettier-formatted SQL (`REVOKE … FROM` and `GRANT SELECT` broken over
lines as above). Write in that shape, or run the repo formatter, before `yarn schema:regenerate`.

---

### `apps/supabase/supabase/tests/database/NN-terms-of-use-acceptances.test.sql` (test, pgTAP)

**Analog 1 — file frame and privilege refusals:** `apps/supabase/supabase/tests/database/09-column-restrictions.test.sql`.

**Frame** (top and bottom of the analog):
```sql
-- Depends on: 00-helpers.test.sql (set_test_user, create_test_data, test_id, etc.), 303-column-grants.sql (column-level REVOKE/GRANT) and 011-validation-functions.sql (enforce_entity_immutability).
BEGIN;

SET
  search_path = public,
  extensions;

-- Reset pgTAP internal state from previous test files
DROP TABLE IF EXISTS __tcache__;

SELECT
  plan (32);

-- Create test fixture data
SELECT
  create_test_data ();
...
SELECT
  reset_role ();

SELECT
  *
FROM
  finish ();

ROLLBACK;
```

**Impersonation** (anchor `-- Section 1: Candidate cannot UPDATE protected columns on own record`):
```sql
SELECT
  set_test_user (
    'authenticated',
    test_user_id ('candidate_a'),
    test_user_grants ('candidate_a')
  );
```
`set_test_user` sets `request.jwt.claim.sub`, so `auth.uid()` resolves for the new policies.

**A refusal at the privilege layer** (anchor `'Candidate cannot update external_id on own record'`) — the
form for "a forged `user_id` is refused", "a forged `accepted_at` is refused", UPDATE, DELETE and `anon`:
```sql
SELECT
  throws_ok (
    format(
      $$UPDATE candidates SET external_id = 'hijacked-by-candidate' WHERE id = '%s'$$,
      test_id ('candidate_a')
    ),
    '42501',
    NULL,
    'Candidate cannot update external_id on own record'
  );
```
RESEARCH R-1 measured `42501` for each of these on the new table; it is a privilege refusal, not a silent
no-op.

**Project A / project B fixture** — `apps/supabase/supabase/tests/database/00-helpers.test.sql`,
`create_test_data`: `(test_id('project_a'), …, 'Project A', true)` and `(test_id('project_b'), …,
'Project B', false)`. Criterion 2's "a row for A does not exist for B" uses this pair. `candidate_a` +
`nomination_cand_a` (confirmed, project A) is the anon-visible candidate for the behavioural trio.

**Analog 2 — a census over the catalogue:** `apps/supabase/supabase/tests/database/07-rpc-security.test.sql`,
anchor `-- Section 8c: the SECURITY DEFINER surface PostgREST publishes`:
```sql
SELECT
  is (
    (
      SELECT
        string_agg(
          p.proname,
          ','
          ORDER BY
            p.proname
        )
      FROM
        pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE
        n.nspname = 'public'
        AND p.prosecdef
        AND p.prorettype <> 'trigger'::regtype
        AND p.proname NOT LIKE 'test\_%'
        AND has_function_privilege('anon', p.oid, 'EXECUTE')
    ),
    'project_open_for_voters,storage_path_can,storage_path_is_public,user_can,user_has_account_grant',
    'census: the SECURITY DEFINER functions in public that anon can execute are exactly the five allow-listed ones'
  );
```
Copy three things from it: the `'census: …'` description prefix, the `p.proname NOT LIKE 'test\_%'`
exclusion (the helpers `00-helpers.test.sql` installs must not be judged), and the comparison of a
`string_agg` of offending names against the expected value, so a failure **names** the offender. For the
inverse census the expected value is `NULL` / empty over `n.nspname IN ('public', 'private')`.

**Analog 3 — reading policy text and function bodies from the catalogue:**
`apps/supabase/supabase/tests/database/16-anon-visibility.test.sql`, the assertion whose description begins
`'all FOUR anon entity SELECT policies name BOTH public-visibility helpers directly …'`. It reads `qual`
from `pg_policies` and bodies through `pg_get_functiondef(p.oid) LIKE '%…%'`, and **pins the population as
well as the pass count** ("populations pinned, so a clean answer cannot come from an empty instrument").
The inverse census must do the same: assert the number of policies and functions examined is non-zero in
the same expectation.

**Analog 4 — the storage leg of the trio:** `apps/supabase/supabase/tests/database/20-storage-authority.test.sql`,
the `INSERT INTO storage.objects (id, bucket_id, name) VALUES (gen_random_uuid(), 'public-assets',
'%s/candidates/%s/….jpg')` fixtures and its anon read of `storage.objects`. Reuse that path shape.

**File number:** next free at run time (highest today is `36`), with a content-bearing name.

---

### `apps/supabase/scripts/lint-schema.mjs` (config, gate allow-list)

**Analog:** itself, `REACHES_NEITHER_ALLOW` under the header `// LIST 4 — policies that legitimately ask no
authority question at all.`

```js
// Each entry is [schema, table, policy].
const REACHES_NEITHER_ALLOW = [
  ...
  // Granted TO `supabase_auth_admin` only — the Access Token Hook's own read of the table it projects. A system role, not a user; the user authority model cannot be asked of it.
  ['public', 'grants', 'auth_admin_read_grants'],
  // Granted TO `service_role` only, which bypasses row-level security by definition. The Edge Functions write grants through it; gating it on a permission literal would be decoration.
  ['public', 'grants', 'service_role_manage_grants']
```
Two entries, one comment above each (or one above the pair, as the join-table entries do), in this
`[schema, table, policy]` tuple shape. The file's own rule, above the lists: "do not add one without
writing why". The reason is in RESEARCH H-1.

---

### `scripts/assert-project-scoped-queries.mjs` + `supabaseAdapter.type.ts` (config / model)

**Analog:** the two mirrored lists themselves. `PROJECT_SCOPED_TABLES` is alphabetical:
```js
const PROJECT_SCOPED_TABLES = [
  'admin_jobs',
  ...
  'question_categories',
  'questions'
];
```
and `ProjectScopedTable` in `apps/frontend/src/lib/api/adapters/supabase/supabaseAdapter.type.ts` is the
same list as a union, ending `| 'question_categories' | 'questions';`. Add `'terms_of_use_acceptances'`
last in both (alphabetical order holds). The `scoped` helper's comment in `supabaseAdapter.ts` says "the
UNION of all thirteen scoped tables"; that count goes to fourteen and the comment must follow.

---

### `apps/frontend/src/lib/api/adapters/supabase/supabaseAdapter.ts` — `upsert` on `scopedFrom` (service, CRUD)

**Analog:** the existing `insert` member, in three places.

**Type** (`ScopedTableAccess` in `supabaseAdapter.type.ts`):
```ts
  /** Insert one row, with this adapter's project id supplied. */
  insert: (values: Omit<TablesInsert<TTable>, 'project_id'>) => ReturnType<QueryBuilderFor<TTable>['insert']>;
```

**The write cast** (inside `scopedFrom`, anchor `const writes = builder as unknown as {`):
```ts
      // reason: the second and last cast, for the same generic-union reason as `scoped` above. `insert` and `update` type their payload as a conditional over `TTable`, which does not resolve while `TTable` is still a type parameter, so a payload assembled here cannot be shown to match it. The cast names only the two write calls and preserves both their return types, so the caller still sees the real builder for the real table.
      const writes = builder as unknown as {
        insert: (values: Record<string, unknown>) => ReturnType<ScopedTableAccess<TTable>['insert']>;
        update: (values: Record<string, unknown>) => ReturnType<ScopedTableAccess<TTable>['update']>;
      };
```

**The member** (the returned object):
```ts
        insert: (values) => writes.insert({ ...values, project_id: projectId }),
```
An `upsert` member is one more line in each of the three, supplying `project_id` like `insert` and always
passing `{ ignoreDuplicates: true }` (RESEARCH P-1: the default upsert is refused with `42501`). The cast
comment says "names only the two write calls", the docstring above `scopedFrom` says "@returns The four
operations", and `ScopedTableAccess`'s docstring says "the same four operations": all three counts change.
Re-run `packages/dev-seed/tests/projectScopingGate.test.ts`.

---

### `apps/frontend/src/lib/api/base/dataWriter.type.ts` + `universalDataWriter.ts` — `acceptTermsOfUse` (model / service)

**Analog:** the `setPassword` triple — interface member, public method, abstract method.

**Interface member** (`DataWriter` in `dataWriter.type.ts`):
```ts
  /**
   * Change a user’s password. Authorisation comes from the caller’s active session, not from a supplied current password.
   * @param password - The new password.
   * @returns A `Promise` resolving to an `DataApiActionResult` object or a `Response` containing one.
   */
  setPassword: (opts: { password: string }) => DWReturnType<DataApiActionResult, TType>;
```

**Public method and abstract** (`UniversalDataWriter`):
```ts
  setPassword(opts: { password: string }): DWReturnType<DataApiActionResult> {
    return this._setPassword(opts);
  }
  ...
  protected abstract _setPassword(opts: { password: string }): DWReturnType<DataApiActionResult>;
```
`acceptTermsOfUse()` takes no argument and returns `DWReturnType<DataApiActionResult>`.

**`BasicUserData`** (the type to extend, today):
```ts
export interface BasicUserData extends WithUserSettings {
  id: Id;
  email: string;
  username: string;
  role?: UserRole | null;
}
```
Add `termsOfUseAccepted: string | null` with a TSDoc line.

**Plan 2, the guard to reword** (`UniversalDataWriter.updateEntityProperties`):
```ts
    if (!opts.properties.image?.file && opts.properties.termsOfUseAccepted === undefined)
      throw new Error(
        'Either an image file or a value for termsOfUseAccepted is required for updating entity properties'
      );
```

---

### `apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts` (service, CRUD)

**Analog for the read:** the project-scoped read already in `_getCandidateUserData`:
```ts
      const { data: nomData, error: nomError } = await this.scopedFrom('nominations')
        .select('election_id, constituency_id, election_round, election_symbol, parent_nomination_id, entity_type, id')
        .eq('candidate_id', entityRow.id);

      if (nomError) throw new Error(`Failed to load nominations: ${nomError.message}`);
```
The acceptance read goes in `_getBasicUserData`, after the role is known and before the `return {`:
```ts
    return {
      id: user.id,
      email: user.email ?? '',
      username: user.email ?? '',
      role,
      settings: { language }
    };
```
`.maybeSingle()` is used elsewhere in this adapter family
(`apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts`), so it is an
established call, not a new one.

**Analog for the write:** `_setPassword` — one call, throw on `error`, return the success literal:
```ts
  protected async _setPassword({ password }: { password: string }) {
    const { error } = await this.supabase.auth.updateUser({ password });
    if (error) throw new Error(error.message);
    ...
    return { type: 'success' as const };
  }
```
Error-message convention in the PostgREST methods is `<method>: ${error.message}` (anchors
`` `setAnswers: ${error.message}` ``, `` `updateEntityProperties: ${error.message}` ``).

**Comment to correct in plan 2** (`_setPassword`): "…RLS returns no row and the terms-of-use UPDATE that
follows fails with a 406 "Cannot coerce"." There is no such UPDATE after this phase.

**Plan 2 removals:** `termsOfUseAccepted: entityRow.terms_of_use_accepted ?? null,` in
`_getCandidateUserData` (must leave in the commit that removes the RPC column); in
`_updateEntityProperties` the `updateFields.terms_of_use_accepted` arm,
`const columns = 'terms_of_use_accepted, image';` and the returned `termsOfUseAccepted`.

---

### `…/dataWriter/supabaseDataWriter.test.ts` (test, unit)

**Analog:** itself. Three anchors.

**The recording chain** (`createChain`) has no `maybeSingle` and no `upsert` member today:
```ts
  const chain = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockImplementation(settle),
    then: undefined as unknown as PromiseLike<unknown>['then']
  };
```
Add both, in the same shape (`maybeSingle: vi.fn().mockImplementation(settle)`,
`upsert: vi.fn().mockReturnThis()`), or every `getBasicUserData` case throws `…maybeSingle is not a
function`.

**Session stub and a `getBasicUserData` case** (`mockVerifiedSession`, `describe('getBasicUserData')`):
```ts
      mockVerifiedSession(mockSupabase, {
        user: { id: 'user-1', email: 'cand@test.com', user_metadata: { language: 'fi' } },
        grants: [{ scope: 'entity', target_type: 'candidate', target_id: 'uuid1', role: 'editor' }]
      });

      const result = await writer.getBasicUserData();
```
Per-table answers are configured with `mockSupabase._mockResponses['<table>'] = { data, error }`.

**Scoping assertions** (`describe('project scoping')`, helpers `eqCallsFor` and `tablesReached`):
```ts
      const calls = eqCallsFor(mockSupabase, 'nominations');
      expect(calls).toContainEqual(['project_id', PROJECT_ID]);
      expect(calls).toContainEqual(['candidate_id', 'cand-1']);
      expect(tablesReached(mockSupabase)).toEqual(['nominations']);
```
Use `eqCallsFor(mockSupabase, 'terms_of_use_acceptances')` to prove the read carries the project filter,
and `chain.upsert.mock.calls` to pin `{ ignoreDuplicates: true }`.

**Existing assertion this phase breaks (not in RESEARCH):** the case `'filters the nominations read by
project as well as by candidate'` asserts `tablesReached(mockSupabase)` **equals** `['nominations']` after
`getCandidateUserData`. Once `_getBasicUserData` reads the acceptance table, that list becomes
`['terms_of_use_acceptances', 'nominations']`. The helper's own docstring explains why it is an exact
comparison ("an extra round-trip is observable only as an extra table reached"), so update the expected
list, do not loosen it to membership. `candidateRow(…)` in the same block carries
`terms_of_use_accepted: null`, which goes in plan 2.

---

### `candidateContext.svelte.ts` [`contestantContext.svelte.ts`] — `acceptTermsOfUse` wrapper (provider)

**Analog:** `apps/frontend/src/lib/contexts/auth/authContext.svelte.ts`, the wrapper block headed
`// Wrappers for DataWriter methods (arrow fields — survive detach)`:
```ts
  setPassword = async (opts: { password: string }): Promise<DataApiActionResult> => {
    const dw = prepareDataWriter();
    return dw.setPassword({ password: opts.password });
  };
```
and, already in the candidate context, the same idiom:
```ts
  clearIdToken = async (): Promise<void> => {
    const dw = prepareDataWriter();
    await dw.clearIdToken().catch((e) => {
      log.error(`Error logging out: ${e?.message ?? '-'}`);
    });
  };
```
An arrow **field** is the right form here. The `logout` landmine in this file (class JSDoc, "an arrow-FIELD
`logout` would be CLOBBERED by `Object.assign(this, this.#authContext)`") applies only to names the auth
context also carries; `acceptTermsOfUse` is not one. Let the wrapper **reject** on failure (do not `.catch`
and log as `clearIdToken` does): the gate needs the failure to show `tou-save-error`.

Declare the member in the context's type file beside `logout: () => Promise<void>;`.

---

### `apps/frontend/src/lib/contestant/gates/gates.ts` + `gates.test.ts` (utility, transform)

**Analog:** `apps/frontend/src/lib/routes/appGates.ts` — the tree's one ordered gate table. Copy its
properties, not its content.

**The module docstring states the contract** ("Written as rows of one table, the per-application knowledge
is DATA … and the handler is a loop with no application name in it."; "**The table is immutable.**
`APP_GATES`, every row and every descriptor are frozen. The table is module-level state shared by every
concurrent request in the SSR module graph").

**A row type with a TSDoc line per member, and a frozen row:**
```ts
export type AppGate = {
  /** A human name, used only in diagnostics — a failure that names the application beats one that names an index. */
  readonly name: string;
  /**
   * Whether a route id belongs to this application.
   *
   * @param routeId - A SvelteKit route id, e.g. `event.route.id`.
   * @returns `true` when the id is this application's root or sits below it.
   */
  readonly isRoute: (routeId: string) => boolean;
  ...
};

const CANDIDATE_GATE: AppGate = Object.freeze({
  name: 'Candidate App',
  isRoute: isCandidateRoute,
  ...
});
```
The gate list is imported by the **server** load, so it is shared module state under SSR for the same
reason: freeze the array and each entry, and keep the module free of any mutable binding and of any Svelte
import (the server module cannot hold components; the layout maps the entry id to a view).

**Test analog:** `apps/frontend/src/lib/routes/appGates.test.ts` — its docstring lists what the table could
get wrong, then asserts each: "**The table is ordered and the first match wins.** Asserted by fixing the
order and comparing the RESOLVED ROW'S IDENTITY against the row at the expected index" and "**The table is
frozen.** … asserted, including that a write throws". `gates.test.ts` takes the same two (order, frozen)
plus the predicate (`termsOfUseAccepted == null` → needed; a timestamp → not needed).

---

### `TermsOfUseGate.svelte` + `.type.ts` + barrel (component)

**Analog for the markup:** the `'terms'` branch of
`apps/frontend/src/routes/candidate/(protected)/+layout.svelte`, which moves as it is:
```svelte
  <MainContent title={t('dynamic.candidateAppPrivacy.consent.title')}>
    {#snippet hero()}
      <figure role="presentation">
        <HeroEmoji emoji={t('dynamic.candidateAppPrivacy.consent.heroEmoji')} />
      </figure>
    {/snippet}
    <TermsOfUseForm bind:termsAccepted={termsAcceptedLocal} />
    {#if status === 'error'}
      <div role="alert" data-testid="tou-save-error" class="text-error my-md text-center">
        {t('candidateApp.error.saveFailed')}
      </div>
    {/if}
    {#snippet primaryActions()}
      <Button
        text={t('common.continue')}
        variant="main"
        disabled={!termsAcceptedLocal}
        loading={status === 'loading'}
        onclick={handleSubmit}
        data-testid="terms-of-use-submit" />
      <Button color="warning" text={t('common.logout')} loading={status === 'loading'} onclick={handleCancel} />
    {/snippet}
  </MainContent>
```
Post-170 the keys are `dynamic.contestantAppPrivacy.consent.*` and `contestantApp.error.saveFailed`.

**Analog for the submit handler** (same file, `handleSubmit` / `handleCancel`): keep the
`status = 'loading'` → `try` → `status = 'error'` + `log.error(…, { err: error })` shape and
`let status = $state<ActionStatus>('idle');`. Replace the body's two store calls with
`await acceptTermsOfUse()` then `await invalidateAll()` (RESEARCH P-9: await it). `termsSubmitted` does not
move into the component.

**Analog for component conventions:** `apps/frontend/src/lib/candidate/components/termsOfUse/TermsOfUseForm.svelte`
[`lib/contestant/components/termsOfUse/…`].

Docstring block:
```svelte
<!--
@component Show the terms of use along with a checkbox for accepting them.

### Dynamic component

Accesses `CandidateContext`.

### Properties

- `termsAccepted`: Bindable: Whether the terms are accepted. Default: `false`
- Any valid attributes of a `<section>` element

### Usage
…
-->
```
Props and context read:
```svelte
  let { termsAccepted = $bindable(false), ...restProps }: TermsOfUseFormProps = $props();
  ...
  const { t } = getComponentContext();
```
Props type file (`TermsOfUseForm.type.ts`):
```ts
import type { SvelteHTMLElements } from 'svelte/elements';

export type TermsOfUseFormProps = SvelteHTMLElements['section'] & {
  /**
   * Bindable: Whether the terms are accepted. @default false
   */
  termsAccepted?: boolean;
};
```
Barrel (`index.ts`):
```ts
export { default as TermsOfUse } from './TermsOfUse.svelte';
export { default as TermsOfUseForm } from './TermsOfUseForm.svelte';
export * from './TermsOfUseForm.type';
```
The gate reads the app context (`getCandidateContext()` [`getContestantContext()`]) for `t`, `logout` and
`acceptTermsOfUse`; all three are stable references and may be destructured, as the layout does today:
`const { setDataRoot, logout, t, userData } = getCandidateContext();`.

---

### `(protected)/+layout.server.ts` (route, server load)

**Analog:** itself. What stays, in order.

**Imports and the request-scoped writer:**
```ts
import { log } from '@openvaa/app-shared';
import { redirect } from '@sveltejs/kit';
import { createDataProvider } from '$lib/api/dataProvider';
import { createDataWriter } from '$lib/api/dataWriter';
import { getLocale } from '$lib/paraglide/runtime';
import { buildRoute } from '$lib/routes';
...
export async function load({ fetch, locals }) {
  const lang = getLocale();
  const dataWriter = createDataWriter({ fetch, locals });
```

**Stage 1, session:**
```ts
  const { session } = await locals.safeGetSession();
  if (!session)
    return redirect(
      307,
      buildRoute({
        route: 'CandAppLogin',
        locale: lang
      })
    );
```

**The catch-to-undefined idiom, to reuse for stage 2 with `getBasicUserData()`:**
```ts
  const userData = await dataWriter.getCandidateUserData({ loadNominations: true }).catch((e) => {
    log.error(`Error fetching user data: ${e?.message ?? 'No error message'}`, { err: e });
    return undefined;
  });
  if (!userData) return await handleError('loginFailed');
```

**Stage 4, the block that becomes one identifiable entity step below the gate** (everything from the
`getCandidateUserData` call through `if (!electionId.length || !constituencyId.length) return await
handleError('candidateNoNomination');`), unchanged in content:
```ts
  if (role !== 'candidate') return await handleError('userNotAuthorized');
  if (!candidate) return await handleError('userNoCandidate');
```

**`handleError`, unchanged:**
```ts
  async function handleError(error: CandidateLoginError): Promise<void> {
    await locals.supabase.auth
      .signOut({ scope: 'local' })
      .catch((e: Error) => log.error(`[Candidate App protected layout] Error logging out: ${e?.message ?? '-'}`));
    redirect(
      307,
      buildRoute({
        route: 'CandAppLogin',
        locale: lang,
        errorMessage: error
      })
    );
  }
```

**Typing consequence to plan for:** the load's return today is `{ questionData, candidateUserData }` (or
`void` through `handleError`). Adding `return { user, gate }` makes `LayoutData` a union, and
`data.candidateUserData` / `data.questionData` in the layout no longer exist on every arm. Either return
one shape with optional members, or narrow on `data.gate` first. Child pages under `(protected)` that read
`data.candidateUserData` through `LayoutData` inherit the same union; check them with
`yarn workspace @openvaa/frontend typecheck`.

---

### `(protected)/+layout.svelte` (component, route layout)

**Analog:** itself. The entity half stays verbatim: `validity` (`$derived.by`), the data-applying `$effect`
with `setDataRoot((dr) => { dr.update(() => { … }) })` and `untrack(() => userData.init(snapshot.userData))`,
and the error-logging `$effect`.

**What changes in `layoutState`** (today):
```ts
  const layoutState = $derived<'loading' | 'error' | 'terms' | 'ready'>(
    validity.state === 'error' ? 'error' : !validity.candidate.termsOfUseAccepted && !termsSubmitted ? 'terms' : 'ready'
  );
```
The `'terms'` member, `termsAcceptedLocal`, `termsSubmitted`, `handleSubmit` and `handleCancel` leave.

**`validity` must not run for a gated load.** Today it returns `{ state: 'error' }` when
`data.candidateUserData` is absent, and the second `$effect` then logs
`'Error loading protected-layout data'`. A gated load has no entity data by design, so guard both on
`data.gate` or the gate renders with an error logged behind it.

**Props and data access** (today): `let { data, children }: { data: LayoutData; children: Snippet } =
$props();` — read `data.<x>` inside `$derived`, do not destructure `data`.

**Branch shape to keep** (today's template tail):
```svelte
{#if layoutState === 'error'}
  <ErrorMessage class="bg-base-300" />
{:else if layoutState === 'loading'}
  <Loading />
...
{:else}
  {@render children?.()}
{/if}
```

---

### `(protected)/layout.server.test.ts` — NEW (test, server load)

**Analog 1 — driving a `load` directly with a fake event:** `apps/frontend/src/routes/admin/layout.server.test.ts`.
```ts
import { describe, expect, it } from 'vitest';
import { load as adminLoad } from './+layout.server';
...
type FakeEvent = { locals: { safeGetSession: () => Promise<{ session: unknown; user: unknown }> } };
type LoadFn = (event: FakeEvent) => Promise<{ session: unknown }>;
...
function makeEvent(result: { session: unknown; user: unknown }) {
  return { locals: { safeGetSession: async () => result } };
}
...
const LOADS: Array<[string, LoadFn]> = [
  ['routes/admin/+layout.server.ts', adminLoad as unknown as LoadFn],
```
Take: the erased `FakeEvent` / `LoadFn` pair with the `as unknown as LoadFn` cast, and `makeEvent`
building a fresh object per call. The fake `locals` here also needs `supabase.auth.signOut` (for
`handleError`).

**Analog 2 — replacing a module the load imports:**
`apps/frontend/src/routes/admin/(protected)/layout.server.test.ts`.
```ts
const { STORAGE_KEY } = vi.hoisted(() => ({ STORAGE_KEY: 'sb-testproject-auth-token' }));

vi.mock('$lib/api/dataProvider', () => ({ SUPABASE_COOKIE_PREFIX: STORAGE_KEY }));
```
Its comment gives the rule: "Hoisted because `vi.mock`'s factory is lifted above every import and cannot
close over an ordinary module-scope binding." Use the same pair to replace `$lib/api/dataWriter`
(`createDataWriter` → a fake exposing spied `getBasicUserData` and `getCandidateUserData`) and
`$lib/api/dataProvider` (`createDataProvider`).

**No analog for one part:** no existing test drives a load that calls `redirect(…)` or `getLocale()`.
`redirect` throws a `Redirect` object, so the "entity step reached" case asserts on a rejection (or on the
spy having been called), not on a returned value. The assertion that carries D-09 is
`expect(getCandidateUserData).not.toHaveBeenCalled()` for a user without an acceptance.

---

### `(protected)/termsOfUseLayout.svelte.test.ts` — rewritten (test, mounted component)

**Analog:** itself. Keep the harness, replace the fake context's members and the two cases.

**Fake context** (today; `userData.setTermsOfUseAccepted` / `save` are replaced by `acceptTermsOfUse`):
```ts
vi.mock('$lib/contexts/candidate/candidateContext.svelte', () => ({
  getCandidateContext: () => ({
    t: (key: string) => key,
    setDataRoot: () => undefined,
    logout: async () => undefined,
    userData: { init: () => undefined, … }
  })
}));

vi.mock('$lib/contexts/component', () => ({
  getComponentContext: () => ({ t: (key: string) => key, darkMode: false })
}));

vi.mock('$lib/contexts/layout', () => ({
  getLayoutContext: () => ({ video: { hasContent: false }, setRouteTitle: () => undefined })
}));
```
Post-170 the mocked module is `$lib/contexts/contestant/contestantContext.svelte` and the getter
`getContestantContext`.

**The `matchMedia` stub** (`if (typeof window.matchMedia !== 'function') { Object.defineProperty(window,
'matchMedia', …) }`) stays: the layout still reaches `Header.svelte` through `$layouts/main`.

**Mount and drive:**
```ts
const ProtectedLayout = (await import('./+layout.svelte')).default;
...
  const component = mount(ProtectedLayout, {
    target,
    props: { data: layoutData() as never, children: undefined as never }
  });
  flushSync();
```
```ts
  checkbox!.checked = true;
  checkbox!.dispatchEvent(new Event('change', { bubbles: true }));
  checkbox!.dispatchEvent(new Event('input', { bubbles: true }));
  flushSync();
  ...
  submit!.click();
  await Promise.resolve();
  await Promise.resolve();
  flushSync();
```
`layoutData()` becomes the gated shape (`{ user: {…, termsOfUseAccepted: null}, gate: 'termsOfUse' }`).

**The assertion D-07 keeps:**
```ts
    const alert = target.querySelector('[data-testid="tou-save-error"]');
    expect(alert, 'a failure return must surface the save-failed message').not.toBeNull();
    expect(alert?.textContent?.trim()).toBe('candidateApp.error.saveFailed');
    expect(target.querySelector('[data-testid="terms-of-use-submit"]')).not.toBeNull();
```
**`invalidateAll`:** the vitest alias stub `apps/frontend/src/lib/i18n/tests/__mocks__/app-navigation.ts`
already exports `export async function invalidateAll() {}`; override it with
`vi.mock('$app/navigation', …)` to spy. The success case can no longer assert the form unmounts (the stub
does not rerun a load); it asserts the spy was called and no alert is shown.

The file's docblock is historical narrative ("REGRESSION INTRODUCED BY THIS PHASE…", plan ids); a rewritten
file replaces it with a description of what the test holds now.

---

### `tests/tests/utils/supabaseAdminClient.ts` — `forceRegister` default + helper (utility, CRUD)

**Analog:** `forceRegister` itself and its sibling `forceRegisterAdmin`. The new insert goes **inside the
existing `try`**, so the compensating rollback covers it.

```ts
    try {
      ...
      // 3. Write the candidate-editor grant. …
      const { error: grantError } = await this.client.from('grants').insert({
        user_id: user.id,
        scope: 'entity',
        target_type: 'candidate',
        target_id: candidate.id,
        role: 'editor'
      });
      if (grantError) throw new Error(`forceRegister: insert grant failed: ${grantError.message}`);
    } catch (mutationErr) {
      // reason: compensating rollback on partial failure prevents orphan auth users that cascade as "User already exists" errors across subsequent test runs. …
      await this.client.auth.admin.deleteUser(user.id).then(
        () => {},
        (rollbackErr) => {
          console.error('[forceRegister] rollback (auth.admin.deleteUser) failed:', rollbackErr);
        }
      );
      throw mutationErr;
    }
```
Conventions to copy: numbered step comments (`// 1.`, `// 2.`, `// 3.`), error text
`` `<method>: <step> failed: ${error.message}` ``, `this.projectId` for the project (as in
`forceRegisterAdmin`'s `target_id: this.projectId`), and a TSDoc block with `@param` / `@throws` on every
public method.

**Signature today:** `async forceRegister(candidateExternalId: string, email: string, password: string):
Promise<void>`. A fourth, optional options argument keeps all existing call sites compiling.

**The public acceptance helper (RESEARCH P-6)** follows the shape of the small lookup methods in this file,
e.g. `candidateIdsForUser`:
```ts
  async candidateIdsForUser(userId: string): Promise<Array<string>> {
    const { data: grants, error: grantError } = await this.client
      .from('grants')
      ...
    if (grantError) throw new Error(`candidateIdsForUser: ${grantError.message}`);
```

**Plan 2 removals in this file:** step 3 of `unregisterCandidate`
(`.update({ terms_of_use_accepted: null })`, with `candidateIdsForUser` no longer needed there and the
steps renumbered), the same reset in `deleteAllTestUsers` (step label `'reset-terms-of-use'`), and the
sentences in three docblocks that describe the reset: `unregisterCandidate`'s summary line,
`deleteAllTestUsers`'s summary, and `forceRegisterAdmin`'s "its terms-of-use reset finds no candidate and
resets nothing".

---

### `tests/tests/utils/testCredentials.ts` — second identity and session path (config)

**Analog:** `tests/tests/utils/adminCredentials.ts`, the one place a second stored session is declared.
```ts
import path from 'path';
import { TESTS_DIR } from './testsDir';
...
/**
 * Where the admin session the setup project mints is stored.
 *
 * DECLARED HERE, ONCE, and re-exported by `playwright.config.ts` as `ADMIN_STORAGE_STATE` — the setup that WRITES it and the project that READS it must name the same file, …
 *
 * DISTINCT from the candidate `../playwright/.auth/user.json` on purpose. The identities are different, their role claims are different, and a shared file would let whichever setup ran last decide who the other project's spec was.
 */
export const ADMIN_STORAGE_STATE = path.join(TESTS_DIR, '../playwright/.auth/admin.json');
```
Existing identity constants in `testCredentials.ts`, to mirror:
```ts
export const TEST_CANDIDATE_EXTERNAL_ID = 'test-e2e-base-ca-aa-1';

/** Email minted for the registered base candidate (perm-* naming convention). */
export const TEST_CANDIDATE_EMAIL = `${TEST_CANDIDATE_EXTERNAL_ID}@test.openvaa.local`;
```
Plan 2 also corrects this file's docblock sentence "it carries `terms_of_use_accepted` (so the post-login
ToU gate does not intercept)".

---

### `tests/tests/setup/shared/auth.setup.ts` — second setup test (Playwright setup)

**Analog:** the existing `setup('register + authenticate as base candidate', …)` in the same file.
```ts
  const client = new SupabaseAdminClient();
  await client.unregisterCandidate(TEST_CANDIDATE_EMAIL);
  await client.forceRegister(TEST_CANDIDATE_EXTERNAL_ID, TEST_CANDIDATE_EMAIL, TEST_CANDIDATE_PASSWORD);
  ...
  const candidateHome = buildRoute({ route: 'CandAppHome', locale: 'en' });
  await waitForLoginForm(page, candidateHome, testIds.candidate.login.email);

  await page.getByTestId(testIds.candidate.login.email).fill(TEST_CANDIDATE_EMAIL);
  await page.getByTestId(testIds.candidate.password.field).fill(TEST_CANDIDATE_PASSWORD);
  await page.getByTestId(testIds.candidate.login.submit).click();

  // Wait for navigation away from the login page
  await expect(page).not.toHaveURL(/.*login.*/);

  // Save authenticated state for downstream tests
  await page.context().storageState({ path: authFile });
```
Reuse `waitForLoginForm` (module-level, so the setup body stays free of conditionals for
`playwright/no-conditional-in-test`) and `fs.mkdirSync(authDir, { recursive: true })`. The second test adds
a wait for `testIds.candidate.terms.submit` before saving (RESEARCH R-4). `unregisterCandidate` before
`forceRegister` is what makes re-runs idempotent; keep it for the second identity.

This file spells its own session path (`const authFile = path.join(currentDir,
'../../../playwright/.auth/user.json');`). The second path must come from `testCredentials.ts`, not a
second local literal.

**Teardown analog:** `tests/tests/setup/shared/base.teardown.ts`:
```ts
  // Runs BEFORE the row wipe so the candidate row is still present to unlink.
  await client.unregisterCandidate(TEST_CANDIDATE_EMAIL);
  await runTeardownAsserted(PREFIX, client);
```
One more `unregisterCandidate` line for the second identity. The comment's reason ("so the candidate row is
still present to unlink") is about the terms-of-use reset and stops being true in plan 2; reword it then.

---

### `tests/tests/specs/a11y/candidate-a11y.spec.ts` [`contestant-a11y.spec.ts`] — gate scans (E2E axe)

**Analog:** the file's own entry table and runner.

**An entry** (`CANDIDATE_AXE_ROUTES`):
```ts
  {
    // Anchor on the home status message, NOT on the page frame: …
    // Marker: the logout button, which the app renders only for a live session.
    name: 'cand-home',
    fixture: 'raw',
    routeId: 'CandAppHome',
    contentTestId: testIds.candidate.home.statusMessage,
    postLoginTestId: testIds.candidate.home.logout
  },
```
The gate entry uses `contentTestId: testIds.candidate.terms.checkbox` and
`postLoginTestId: testIds.candidate.terms.submit` (RESEARCH R-4: the home logout is not rendered on G).

**The runner, with its dark twin:**
```ts
for (const entry of CANDIDATE_AXE_ROUTES) {
  test(`axe accessibility scan — ${entry.name}`, async ({ page }, testInfo) => {
    await page.goto(buildRoute({ route: entry.routeId, locale: 'en' }));
    await assertAxeScan(page, toScanEntry(entry, entry.name, false), testInfo, entry.name);
  });

  test.describe(() => {
    test.use({ colorScheme: 'dark' });

    test(`axe accessibility scan — ${entry.name} (dark)`, async ({ page }, testInfo) => {
      const label = `${entry.name}-dark`;
      await page.goto(buildRoute({ route: entry.routeId, locale: 'en' }));
      await assertAxeScan(page, toScanEntry(entry, label, true), testInfo, label);
    });
  });
}
```
Entries never supply `settle`; `toScanEntry` composes it from `reach` + `assertCandidateReach` +
`assertDarkThemeIfDark`, "so neither proof can be forgotten on a new entry". Route the gate entry through
`toScanEntry` too. The gate scans sit in a `test.describe(() => { test.use({ storageState: <second path> });
… })` that wraps the same two-test shape; keep the gate entry in its own table (or tag it) so the main loop,
which runs under the project-level session, does not also emit it.

**Docblock rows to edit:** the known-gaps table row beginning `| terms-of-use gate modal
(`(protected)/+layout.svelte`) | CA-AA-1 carries `terms_of_use_accepted` | …` is removed in plan 3 (it also
carries the string D-21's census counts).

---

### `packages/dev-seed/src/templates/e2e/base.ts` — the two rows (config, seed)

**Analog:** the rows themselves.
```ts
      {
        external_id: 'test-e2e-base-ca-aa-hidden',
        first_name: 'Hidden',
        last_name: 'Candidate AA',
        // terms_of_use_accepted DELIBERATELY absent
        sort_order: 1,
        organization: { external_id: 'test-e2e-base-or-aa' },
        answersByExternalId: withInfoAnswers(GENERIC)
```
The comment line is replaced by `confirmed: false,`. The unregistered row carries
`// terms_of_use_accepted DELIBERATELY absent — registration must trigger the ToU gate` and
`// answersByExternalId DELIBERATELY absent (unregistered → no answers)`; the first becomes
`confirmed: false,`, the second stays. No built-in template sets `confirmed` on a candidate today, so there
is no in-repo row to copy the key from; `permittedKeys.ts` already lists `'confirmed'` for `candidates`.

**Test analog:** `packages/dev-seed/tests/templates/base.test.ts`,
`describe('baseTemplate — registration + hierarchy invariants')`:
```ts
  it('test-e2e-base-ca-aa-hidden has NO terms_of_use_accepted (candidate-level hidden)', () => {
    const c = fixedOf('candidates').find((r) => r.external_id === 'test-e2e-base-ca-aa-hidden') as
      { terms_of_use_accepted?: string } | undefined;
    expect(c).toBeDefined();
    expect(c?.terms_of_use_accepted).toBeUndefined();
  });
```
Same `fixedOf('candidates').find(…)` shape, asserting `c?.confirmed` is `false`.

---

### `.planning/todos/pending/<new>.md` — the TOU-03 todo (planning)

**Analog:** `.planning/todos/pending/2026-08-27-147-tou-gate-modal-unscanned.md`, frontmatter:
```markdown
---
created: 2026-08-27T16:00:00.000Z
title: The candidate ToU gate modal is reachable but unscanned — and the dataset to reach it already ships
area: E2E / a11y
severity: minor
source: Phase 147 (147-SCOUT-INVENTORY.md § 6 "Reachable-but-not-scanned states"; filed by 147-05)
files:
  - apps/frontend/src/routes/candidate/(protected)/+layout.svelte
  - tests/tests/specs/a11y/candidate-a11y.spec.ts
  - packages/dev-seed/src/templates/e2e/base.ts
resolves_phase: 172
---

## The gap
```
File name convention in the directory: `<YYYY-MM-DD>-<phase>-<kebab-slug>.md`. The new todo names
`TOU-F01` (the Validation map checks `grep -l "TOU-F01" .planning/todos/pending/*.md` returns exactly one
file) and has no `resolves_phase`.

---

## Shared Patterns

### Project scoping of every adapter read and write
**Source:** `apps/frontend/src/lib/api/adapters/supabase/supabaseAdapter.ts`, `scopedFrom`
**Apply to:** the acceptance read and write in `supabaseDataWriter.ts`
```ts
    /**
     * The project-scoped entry point to a table.
     *
     * Every read and write against a table carrying a `project_id` foreign key to `public.projects` goes through here. Reads, updates and deletes get the project filter appended; inserts get the project column supplied, because an insert carries no filter. …
     */
    scopedFrom<TTable extends ProjectScopedTable>(table: TTable): ScopedTableAccess<TTable> {
```
A bare `this.supabase.from('terms_of_use_acceptances')` in an adapter source fails
`yarn assert:project-scoped-queries`.

### Request-scoped writer in server loads
**Source:** `apps/frontend/src/routes/candidate/(protected)/+layout.server.ts`
**Apply to:** the reordered protected load
```ts
  // A writer this request alone holds, over the cookie-bearing client `hooks.server.ts` built for this request, …
  const dataWriter = createDataWriter({ fetch, locals });
```

### Browser-side writer call from a context
**Source:** `apps/frontend/src/lib/contexts/auth/authContext.svelte.ts`
**Apply to:** `acceptTermsOfUse` on the contestant context
```ts
    const dw = prepareDataWriter();
    return dw.setPassword({ password: opts.password });
```
"Each body builds its own writer with `prepareDataWriter()` for the one call it makes; authorisation is
carried by the Supabase session cookie."

### Error handling
- **Adapter methods throw** `new Error('<method>: ' + error.message)`; `DataApiActionResult` success is the
  literal `{ type: 'success' as const }` (`supabaseDataWriter.ts`, `_login`, `_setPassword`).
- **Server loads catch to `undefined` and log** with `log.error(msg, { err: e })` from `@openvaa/app-shared`
  (protected `+layout.server.ts`).
- **Component submit handlers** keep `status` as `ActionStatus` and show the failure in a `role="alert"`
  element (protected `+layout.svelte`, `handleSubmit`).
- **E2E admin-client methods throw** `` `<method>: <step> failed: ${error.message}` `` and roll back the
  auth user on a partial failure (`forceRegister`).

### pgTAP file frame
**Source:** `apps/supabase/supabase/tests/database/09-column-restrictions.test.sql`
**Apply to:** the new pgTAP file. `BEGIN; SET search_path = public, extensions; DROP TABLE IF EXISTS
__tcache__; SELECT plan (N); SELECT create_test_data (); … SELECT * FROM finish (); ROLLBACK;` with
`set_test_user (…)` / `reset_role ()` around each impersonated block.

### One declaration per stored-session path
**Source:** `tests/tests/utils/adminCredentials.ts` (`ADMIN_STORAGE_STATE`) and the comment above its
re-export in `tests/playwright.config.ts`
**Apply to:** the second contestant session. The setup that writes the file and the spec that reads it
import one constant.

### Component conventions
**Source:** `apps/frontend/src/lib/candidate/components/termsOfUse/` [`lib/contestant/components/termsOfUse/`]
**Apply to:** `TermsOfUseGate`. `<!-- @component … ### Properties … ### Usage -->` docstring, co-located
`*.type.ts`, barrel entry in `index.ts`, `getComponentContext()` for `t` in presentational parts, then
`yarn workspace @openvaa/docs generate:docs`.

### Comment Hygiene on everything touched
**Source:** `CLAUDE.md` § *Comment Hygiene*
**Apply to:** every file above. Several analogs carry comments that fail it today (`157.1-06`,
"decision B4(a)", "162-17's ratified allow-lists", "REGRESSION INTRODUCED BY THIS PHASE"). Do not copy
them into new code, and where this phase rewrites a block (the layout's `handleSubmit`, the layout test's
docblock, the pgTAP comments about "five conjuncts"), the replacement describes the code as it is.

## Findings the planner should carry (not in RESEARCH.md)

1. **`supabaseDataWriter.test.ts` has an exact table-list assertion this phase breaks.**
   `'filters the nominations read by project as well as by candidate'` expects
   `tablesReached(mockSupabase)` to equal `['nominations']`; the acceptance read adds
   `'terms_of_use_acceptances'` ahead of it. The mock chain also lacks `maybeSingle` and `upsert`.
   Both belong to plan 1, in the task that changes `_getBasicUserData`.
2. **The Playwright config argues against the wiring RESEARCH recommends.** The comment above the
   `@cand-session` split in `tests/playwright.config.ts` says: "a `test.use({ storageState })` inside the
   spec would have to spell the session path a third time, which `STORAGE_STATE`'s own declaration comment
   above rules out." The objection is to a re-spelled path, and it falls away when the second path is
   declared once in `testCredentials.ts` and imported by both the setup and the spec. No spec in the tree
   uses `test.use({ storageState })` today, so the describe-scoped form is new here; the in-repo
   precedents are a project per session (`ADMIN_STORAGE_STATE`) and a tag split (`grep` / `grepInvert` on
   `@cand-session`). If the describe-scoped form is chosen, state why in the spec and leave that config
   comment true.
3. **The load's return type becomes a union.** See the `+layout.server.ts` section. Child pages typed
   against `LayoutData` are affected.
4. **`validity` logs an error for a gated load unless guarded.** See the `+layout.svelte` section.
5. **A closer server-load test analog exists than the one RESEARCH names.**
   `apps/frontend/src/routes/admin/(protected)/layout.server.test.ts` shows the `vi.hoisted` + `vi.mock`
   pair for a module a load imports; `routes/admin/layout.server.test.ts` only fakes `locals`.

## No Analog Found

| File | Role | Data flow | Reason |
|---|---|---|---|
| The two self-row policies and the column-level INSERT grant inside `3xx-terms-of-use.sql` | migration | CRUD | No policy in `public` or `storage` uses `auth.uid()` today (RESEARCH H-1: 0 of 102), and `303-column-grants.sql` holds UPDATE grants only. Use the measured SQL in RESEARCH § *R-1* |
| The `invalidateAll()` rerun in `TermsOfUseGate.svelte` | component | request-response | No bare `invalidateAll()` call exists in `apps/frontend/src`; the tree only uses `goto(…, { invalidateAll: true })` (`candidateContext.svelte.ts`, `#logout`, `exchangeCodeForIdToken`). Use RESEARCH § *R-5* |

Partial gaps, noted in their sections: a server-load unit test that meets `redirect(…)`; a
`test.use({ storageState })` inside a spec; a seed row that states `confirmed`.

## Metadata

**Analog search scope:** `apps/supabase/supabase/schema/`, `apps/supabase/supabase/tests/database/`,
`apps/supabase/scripts/`, `scripts/`, `apps/frontend/src/lib/{api,contexts,candidate,routes}/`,
`apps/frontend/src/routes/{candidate,admin}/`, `tests/tests/{utils,setup,specs/a11y}/`,
`tests/playwright.config.ts`, `packages/dev-seed/{src/templates,tests/templates}/`,
`.planning/todos/pending/`
**Files read or excerpted:** 34
**Pattern extraction date:** 2026-10-05
**Valid until:** Phase 170 executes (every today-path above moves as bracketed), and Phase 171 for
`301-auth-functions.sql`, `07-rpc-security.test.sql` and the generated files.
