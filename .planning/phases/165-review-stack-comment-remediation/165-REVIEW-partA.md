---
phase: 165-review-stack-comment-remediation
reviewed: 2026-09-28T20:43:06Z
depth: standard
files_reviewed: 79
files_reviewed_list:
  - .github/workflows/main.yaml
  - apps/supabase/supabase/functions/identity-callback/claimConfig.test.ts
  - apps/supabase/supabase/functions/identity-callback/claimConfig.ts
  - apps/supabase/supabase/functions/identity-callback/entityGrant.test.ts
  - apps/supabase/supabase/functions/identity-callback/index.ts
  - apps/supabase/supabase/functions/invite-candidate/entityGrant.test.ts
  - apps/supabase/supabase/functions/invite-candidate/flowConformance.test.ts
  - apps/supabase/supabase/functions/invite-candidate/index.ts
  - apps/supabase/supabase/schema/011-validation-functions.sql
  - apps/supabase/supabase/schema/101-elections.sql
  - apps/supabase/supabase/schema/102-entities.sql
  - apps/supabase/supabase/schema/103-questions.sql
  - apps/supabase/supabase/schema/104-nominations.sql
  - apps/supabase/supabase/schema/107-feedback.sql
  - apps/supabase/supabase/schema/300-auth-tables.sql
  - apps/supabase/supabase/schema/301-auth-functions.sql
  - apps/supabase/supabase/schema/302-rls.sql
  - apps/supabase/supabase/schema/400-storage.sql
  - apps/supabase/supabase/schema/502-email-helpers.sql
  - apps/supabase/supabase/schema/503-entity-rpcs.sql
  - apps/supabase/supabase/tests/database/05-organization-admin.test.sql
  - apps/supabase/supabase/tests/database/07-rpc-security.test.sql
  - apps/supabase/supabase/tests/database/09-column-restrictions.test.sql
  - apps/supabase/supabase/tests/database/10-schema-migrations.test.sql
  - apps/supabase/supabase/tests/database/12-user-can.test.sql
  - apps/supabase/supabase/tests/database/17-project-structure-authority.test.sql
  - apps/supabase/supabase/tests/database/18-entity-policies.test.sql
  - apps/supabase/supabase/tests/database/19-entity-immutability.test.sql
  - apps/supabase/supabase/tests/database/20-storage-authority.test.sql
  - apps/supabase/supabase/tests/database/21-entity-organization.test.sql
  - apps/supabase/supabase/tests/database/22-content-policies.test.sql
  - apps/supabase/supabase/tests/database/24-legacy-removal.test.sql
  - apps/supabase/supabase/tests/database/25-matrix-conformance.test.sql
  - apps/supabase/supabase/tests/database/28-storage-table-parity.test.sql
  - apps/supabase/supabase/tests/database/29-authenticated-disjunct-order.test.sql
  - apps/supabase/supabase/tests/database/33-entity-type-collision.test.sql
  - apps/supabase/supabase/tests/database/34-feedback-project-guard.test.sql
  - packages/dev-seed/src/assertKnownRowProps.ts
  - packages/dev-seed/src/generators/AlliancesGenerator.ts
  - packages/dev-seed/src/generators/CandidatesGenerator.ts
  - packages/dev-seed/src/generators/ConstituenciesGenerator.ts
  - packages/dev-seed/src/generators/ConstituencyGroupsGenerator.ts
  - packages/dev-seed/src/generators/ElectionsGenerator.ts
  - packages/dev-seed/src/generators/FactionsGenerator.ts
  - packages/dev-seed/src/generators/OrganizationsGenerator.ts
  - packages/dev-seed/src/generators/QuestionCategoriesGenerator.ts
  - packages/dev-seed/src/generators/QuestionsGenerator.ts
  - packages/dev-seed/src/template/permittedKeys.ts
  - packages/dev-seed/src/templates/_helpers/buildMinimal.ts
  - packages/dev-seed/src/templates/default.ts
  - packages/dev-seed/src/templates/defaults/alliances-override.ts
  - packages/dev-seed/src/templates/defaults/candidates-override.ts
  - packages/dev-seed/src/templates/defaults/questions-override.ts
  - packages/dev-seed/src/templates/e2e/base.ts
  - packages/dev-seed/src/templates/e2e/perm/notLocated2e2cgShape.ts
  - packages/dev-seed/src/templates/e2e/perm/perm-2e-asymmetric.ts
  - packages/dev-seed/src/templates/e2e/perm/perm-2e-shared.ts
  - packages/dev-seed/src/templates/e2e/perm/perm-analytics-tracking.ts
  - packages/dev-seed/src/templates/e2e/perm/perm-disable-election-1co.ts
  - packages/dev-seed/src/templates/e2e/perm/perm-disable-election-2co.ts
  - packages/dev-seed/src/templates/e2e/perm/perm-disjoint-1co.ts
  - packages/dev-seed/src/templates/e2e/perm/perm-interactive-info.ts
  - packages/dev-seed/src/templates/e2e/perm/perm-localisation-positive.ts
  - packages/dev-seed/src/templates/e2e/perm/perm-org-matching.ts
  - packages/dev-seed/src/templates/e2e/perm/perm-question-video.ts
  - packages/dev-seed/src/templates/e2e/perm/perm-startfromcg.ts
  - packages/dev-seed/src/templates/e2e/perm/shared.ts
  - packages/dev-seed/tests/assertKnownRowProps.test.ts
  - packages/dev-seed/tests/edgeFunctionEnvGate.test.ts
  - packages/dev-seed/tests/fixtures/negctl-elections-sentinel.ts
  - packages/dev-seed/tests/fixtures/negctl-questions-answers.ts
  - packages/dev-seed/tests/fixtures/negctl-questions-entity-type-camel.ts
  - packages/dev-seed/tests/fixtures/negctl-questions-entity-type.ts
  - packages/dev-seed/tests/generators/QuestionCategoriesGenerator.test.ts
  - packages/dev-seed/tests/locales.test.ts
  - packages/dev-seed/tests/templates/default.test.ts
  - packages/supabase-types/src/column-map.ts
  - scripts/assert-edge-function-env.mjs
  - scripts/assert-project-scoped-queries.mjs
findings:
  critical: 0
  warning: 4
  info: 10
  total: 14
status: issues_found
---

# Phase 165: Code Review Report (Part A: backend, CI, scripts, dev-seed, supabase-types)

**Reviewed:** 2026-09-28T20:43:06Z
**Depth:** standard
**Files Reviewed:** 79
**Status:** issues_found

## Summary

Scope: the diff `ship/v2.15-12-planning...HEAD` for area A. That covers the typed-authority rework (`user_can` with `p_target_type`, the typed `private.entity_project_id` and `private.is_child_nominee`, and typed `get_entity_basic_data` and `upsert_answers`), the `enforce_feedback_project` trigger, the `is_generated` removal and the candidates column reorder, the identity-callback `*-ftn` rename with `resolveProviderConfig`, the CI workflow changes, the two guard scripts, the dev-seed cleanup and the two new pgTAP suites.

**Typed authority:** traced and correct. Every one of the 21 entity-scope `user_can` call sites passes a type:
- 16 in `302-rls.sql`
- 2 in `enforce_entity_immutability`
- 1 in `storage_path_can`
- 1 in `get_entity_basic_data`
- 1 in `caller_nominated_in_contest`

Details:
- Each type is the table's own type or the nominations row's generated `entity_type`.
- A NULL type denies at entity scope (301:470).
- `entity_project_id` returns NULL for a NULL type, and every call site treats NULL as a denial.
- Every SECURITY DEFINER function in scope pins `search_path = ''`.
- `left(TG_TABLE_NAME, -1)::public.entity_type` maps all four entity tables correctly and raises for any other table.
- `cleanup_grants_on_delete` and `resolve_email_variables` are also typed.
- No remaining type-blind hop was found. The only untyped id lookups left are the `n.candidate_id = p OR n.organization_id = p ...` disjunctions in `entity_has_confirmed_nomination` and `nomination_exists_in_contest`. Both are typed by an `n.entity_type = p_entity_type` conjunct, but no test pins that conjunct (WR-02).

**`upsert_answers`:** writes only the named table, and it raises on a NULL, faction or alliance type.

**`enforce_feedback_project`:**
- Correctly scoped to INSERT. An UPDATE guard would also fire on the foreign key's own `ON DELETE SET NULL` update, which is itself an UPDATE, and so break orphaning.
- 34 exercises that interaction.
- The guard has no bypass path for an API role.

**`is_generated` and column order:**
- No `is_generated` remains in the schema, the migration, supabase-types, `COLUMN_MAP` or any dev-seed template.
- `TABLE_COLUMNS` is type-checked against the generated types in both directions.
- `_bulk_upsert_record` builds its column list from JSON keys, so column order is irrelevant to bulk import.

**Guard scripts:**
- `assert-project-scoped-queries.mjs` passes locally (exit 0, 16 of 16 adapter sources guarded).
- The `assert-edge-function-env` family fix is real: `{ slash, blockC, template }` matched no key the classifier reads, so nothing was blanked. The new test would catch a revert.

No BLOCKER-level defect was proven. The warnings are gate and test weaknesses:
- a CI guard silently lost when the E2E run moved to the wrapper;
- two pgTAP assertions that cannot see the regression they were written for;
- a new, unmeasured load source in the CI E2E run.

## Warnings

### WR-01: CI E2E runs lost Playwright's `forbidOnly` guard, because the wrapper unsets `CI`

**File:** `.github/workflows/main.yaml:568`, `.github/workflows/main.yaml:662` (with `tests/scripts/e2e-run.sh:193` and `tests/playwright.config.ts:1233`)

**Issue:** Both E2E jobs now run `tests/scripts/e2e-run.sh`, and the wrapper runs `unset CI` before it invokes Playwright. The config reads `forbidOnly: !!process.env.CI`, so the flag is now `false` in CI.

Before this change, `yarn test:e2e` ran with `CI=true`, and a committed `test.only` / `test.describe.only` failed the run. Now such a run executes only the focused test and reports green, which is the exact gate bypass the cardinal E2E rule forbids.

The per-test timeout was already re-keyed to `GITHUB_ACTIONS` for this same reason (`tests/tests/helpers/timeouts.ts:19`), but `forbidOnly` was missed.

The `playwright/no-focused-test` ESLint rule in `yarn lint:check` still catches the common case. It is a separate job and can be bypassed with an eslint-disable, so this is lost defence in depth rather than an open hole.

**Fix:**
```ts
// tests/playwright.config.ts
const ON_CI = !!process.env.CI || process.env.GITHUB_ACTIONS === 'true';
// ...
forbidOnly: ON_CI,
```
Keep `retries`/`workers` on `process.env.CI` as they are, since the wrapper unsets it on purpose for those two.

### WR-02: 33-entity-type-collision never builds a same-project collision, so the `entity_type` conjunct in the two visibility/contest helpers is unpinned

**File:** `apps/supabase/supabase/schema/301-auth-functions.sql:354` and `:634`; `apps/supabase/supabase/tests/database/33-entity-type-collision.test.sql:58-101`

**Issue:** `entity_has_confirmed_nomination` and `nomination_exists_in_contest` match the id against all four FK columns with `OR`. Only `n.entity_type = p_entity_type` makes them type-correct.

Both collisions in 33 put the colliding candidate in project B. `entity_has_confirmed_nomination` also filters `n.project_id = p_project_id`, so with the conjunct deleted, every assertion in 33 (and in 16 and 23) still passes.

The live hazard is a same-project collision. A project admin chooses `id` on insert, as 33 §1 itself proves, so project A can hold a candidate that shares `org_a`'s id. If the conjunct regresses, `org_a`'s confirmed nomination publishes that candidate through `anon_select_candidates` with no nomination of its own. It would also make guard 3 of `entity_insert_parent_nominations` refuse on another type's nomination.

The file's header claims to keep "the two entities apart" across every hop, but these two hops are not exercised. `storage_path_can` and the nomination policies are not exercised under the collision either.

**Fix:** Add a same-project case to 33:
1. As postgres, insert a confirmed, ToU-accepted candidate in `project_a` with `id = test_id('org_a')` and no nomination.
2. Assert `private.entity_has_confirmed_nomination('candidate', test_id('org_a'), test_id('project_a'))` is `false`, paired with `('organization', ...)` being `true`.
3. Assert, as anon, that `SELECT count(*) FROM candidates WHERE id = test_id('org_a')` is 0.
4. Add a `nomination_exists_in_contest('candidate', test_id('org_a'), <org_a's contest>)` = false pair.

### WR-03: 18-entity-policies SELECT-family normaliser maps all four type literals to one placeholder, so a policy naming another table's type still passes

**File:** `apps/supabase/supabase/tests/database/18-entity-policies.test.sql:1311-1341`

**Issue:** The SELECT-family assertion replaces `'candidate'`, `'organization'`, `'faction'` and `'alliance'` with the same `ENT` token, whichever table the policy is on. Suppose `authenticated_select_candidates` passed `'organization'::public.entity_type` to `user_can` or to `entity_has_confirmed_nomination`, which is the exact type-confusion this change set exists to prevent. The four expressions would still normalise to one string, and the assertion would stay green.

The self-update family in the same file already does this correctly: it replaces only `left(tablename, -1)` with `OWN_TYPE` (lines 1473-1481), and its comment states that a foreign type must stay a distinct expression. The SELECT family needs the same treatment.

**Fix:** Replace only the policy's own type:
```sql
replace(
  replace(
    replace(COALESCE(qual, '-') || '~' || COALESCE(with_check, '-'),
            ' AND (terms_of_use_accepted IS NOT NULL) AND (terms_of_use_accepted < now())', ''),
    tablename || '.', 'TBL.'),
  '''' || left(tablename, -1) || '''::entity_type', '''OWN_TYPE''::entity_type'
) AS normalised
```
Add a companion assertion that no entity SELECT policy contains another table's type literal.

### WR-04: CI E2E now runs the whole-monorepo package watcher alongside the dev server (UNCONFIRMED impact)

**File:** `.github/workflows/main.yaml:568`, `.github/workflows/main.yaml:662` (via `tests/scripts/e2e-run.sh:307` and `package.json:9-10`)

**Issue:** The removed step started only `yarn workspace @openvaa/frontend dev`. The wrapper runs root `yarn dev`, which is:
1. `yarn db:start`
2. `yarn dev:clean`
3. `concurrently --kill-others-on-fail "turbo watch build --filter='./packages/*'" "vite dev"`

So every CI E2E run now also carries `turbo watch` over every package, on the 4-CPU runner, for the whole suite. Two effects follow:
- **Extra load.** It adds CPU contention to the runner whose timing failures D-14/D-15/D-16 addressed by raising budgets.
- **Mid-run failure modes.** A watcher rebuild or cache restore rewrites package `dist/` files that Vite resolves through `preserveSymlinks`, which can cause mid-run reloads (compare the project memory note on Vite HMR staleness). And `--kill-others-on-fail` kills the dev server if the watcher exits non-zero, which surfaces as a wall of unrelated failures.

Nothing in the CI evidence isolates this. The claim is unconfirmed, but its cost has not been measured either.

**Fix:** Give the wrapper a mode that starts only the frontend dev server, and use it in CI. The packages are already built by the preceding `yarn build` step, so nothing needs watching. For example, `E2E_DEV_CMD="yarn workspace @openvaa/frontend dev"` in the spawn line, defaulted to `yarn dev` locally. Alternatively, record a before/after CI wall-time comparison as evidence that the watcher costs nothing.

## Info

### IN-01: The comments overstate the trigger's reach: a privileged UPDATE can also null `project_id`

**File:** `apps/supabase/supabase/schema/107-feedback.sql:10`, `:109`

**Issue:** "A NULL project arises only through ON DELETE SET NULL" is true for the API roles, which have no feedback UPDATE policy. It is false for `service_role` and the owner, whose `UPDATE feedback SET project_id = NULL` the INSERT-only trigger does not see. The INSERT-only scope is correct, because a BEFORE UPDATE guard would also fire on the RI action's UPDATE. Only the wording is wrong.

**Fix:** "...so for the API roles a NULL project arises only through ON DELETE SET NULL; the service role and owner can still write one by UPDATE."

### IN-02: Key masking is inconsistent across jobs and largely cosmetic

**File:** `.github/workflows/main.yaml:404-416` vs `:540-558`, `:639-657`

**Issue:** The two E2E jobs `::add-mask::` the anon and service-role keys. `dev-seed-integration` exports the same values to `$GITHUB_ENV` without masking. These are the CLI's deterministic local-stack keys, so nothing secret leaks. Still, the comments ("never echoed") imply a guarantee that one job does not keep.

**Fix:** Mask in `dev-seed-integration` too, or state once that the values are the public local demo keys and drop the masking.

### IN-03: The duplicated key-writing step (16 identical lines in two jobs)

**File:** `.github/workflows/main.yaml:540-558`, `:639-657`

**Issue:** The script is copied byte-for-byte into both jobs. A fix to one, such as adding a new key or changing the placeholder test, will drift from the other.

**Fix:** Move it to a composite action or to `tests/scripts/ci-write-local-keys.sh` and call it from both jobs.

### IN-04: The `setup-cli` version is hard-coded six times, with nothing tying it to the `supabase` catalog version

**File:** `.github/workflows/main.yaml:196, 247, 362, 458, 510, 609`

**Issue:** D-16 pinned CI to the local CLI version, 2.83.0, which currently matches `node_modules/supabase`. A catalog bump updates local runs but not CI, which reintroduces the local/CI divergence the pin exists to remove. `supabase-types-drift` then compares output from two CLIs: the pinned one started the stack, and the workspace one generated the types.

**Fix:** Add an assertion, for example in `packages/dev-seed/tests/rpcNullabilityGate.test.ts`, that every `supabase/setup-cli` `version:` in the workflow equals the resolved `supabase` catalog version.

### IN-05: The Paraglide compile flags duplicate `vite.config.ts` by hand

**File:** `.github/workflows/main.yaml:384-386`

**Issue:** `--project ./project.inlang --outdir ./src/lib/paraglide --strategy url cookie baseLocale` is a transcription of `apps/frontend/vite.config.ts:21-25`. If the strategy changes in Vite, the CI-compiled output silently differs from what the app ships, and the gate measures the wrong artefact.

**Fix:** Expose the options from one module that both `vite.config.ts` and a small `paraglide:compile` script import, and call that script from CI.

### IN-06: A planning requirement id survives in a changed file

**File:** `.github/workflows/main.yaml:421`

**Issue:** The step name "Run dev-seed tests (incl. the NF-01 operation budget)" carries `NF-01`, a planning requirement id. D-04 applies the hygiene rules to every changed file, and this file changed.

**Fix:** Rename the step to "Run dev-seed tests (incl. the operation budget)".

### IN-07: The identity-callback 500 echoes the configured provider keyword to an unauthenticated caller

**File:** `apps/supabase/supabase/functions/identity-callback/index.ts:160`

**Issue:** The endpoint is `--no-verify-jwt`. The outer handler deliberately returns a fixed literal, so that nothing about the deployment's configuration reaches an unauthenticated caller (index.ts:382). The unknown-provider arm returns `Unknown identity provider type: ${providerType}`, which is the configured value itself. After the `*-ftn` rename, every deployment still configured with `signicat` or `idura` hits this arm on every login. The disclosure is low-value (a provider keyword), but it is inconsistent with the stated posture.

**Fix:** Log the value with `console.error` and return a fixed message such as `{ error: 'Identity provider is not configured' }`.

### IN-08: `PROVIDER_CONFIGS` is typed `Record<string, ...>`, so the keyword set has no type

**File:** `apps/supabase/supabase/functions/identity-callback/claimConfig.ts:36`

**Issue:** `PROVIDER_CONFIGS['signicat']` still type-checks as a `ProviderClaimConfig`. A stale keyword in code is therefore invisible to the compiler, and only `resolveProviderConfig` protects the runtime.

**Fix:**
```ts
export type ProviderKeyword = 'signicat-ftn' | 'idura-ftn';
export const PROVIDER_CONFIGS = { ... } as const satisfies Record<ProviderKeyword, ProviderClaimConfig>;
```

### IN-09: The optional `p_target_type` makes an untyped entity-scope RPC call compile

**File:** `apps/supabase/supabase/schema/301-auth-functions.sql:449` (surfaced as `p_target_type?` in `packages/supabase-types/src/database.ts`)

**Issue:** `DEFAULT NULL` keeps the project-scope callers working with three arguments. The cost is that a future TypeScript caller asking `p_scope: 'entity'` without a type compiles, and it is silently denied at runtime. That fails closed, so it is safe, but it is hard to diagnose. No current TypeScript caller asks at entity scope.

**Fix:** Add a typed helper next to `callerMayOnProject`, such as `callerMayOnEntity(type, id, permission)`, that makes the type mandatory, and route every future entity-scope RPC through it.

### IN-10: The skill reference is stale on file numbers and on two signatures

**File:** `.claude/skills/database/schema-reference.md:245-263`

**Issue:** This file changed in this diff and is in the required reading, so its errors mislead reviewers.
- The "file" column cites `012`, `014`, `016` and `017` for functions that live in `301-`, `400-`, `501-` and `502-*.sql`.
- It lists `grant_role_permissions(grant_role_type, grant_scope_type)`. The actual signature is `(grant_scope_type, grant_role_type, entity_type)`.
- It lists `resolve_email_variables(uuid[], text, text)`. The actual signature is `(uuid, uuid[], text, text)`.
- `entity_has_confirmed_nomination` and the other hops appear without their `private.` schema.

**Fix:** Correct the four points above.

---

_Reviewed: 2026-09-28T20:43:06Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
