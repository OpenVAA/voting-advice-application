---
phase: 172-terms-of-use-per-user-and-project
reviewed: 2026-10-22T19:57:01Z
depth: standard
files_reviewed: 73
files_reviewed_list:
  - apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.test.ts
  - apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts
  - apps/frontend/src/lib/api/adapters/supabase/supabaseAdapter.ts
  - apps/frontend/src/lib/api/adapters/supabase/supabaseAdapter.type.ts
  - apps/frontend/src/lib/api/base/dataWriter.type.ts
  - apps/frontend/src/lib/api/base/universalDataWriter.ts
  - apps/frontend/src/lib/contestant/gates/gates.test.ts
  - apps/frontend/src/lib/contestant/gates/gates.ts
  - apps/frontend/src/lib/contestant/gates/gateViews.ts
  - apps/frontend/src/lib/contestant/gates/TermsOfUseGate.svelte
  - apps/frontend/src/lib/contexts/contestant/contestantContext.svelte.ts
  - apps/frontend/src/lib/contexts/contestant/contestantContext.type.ts
  - apps/frontend/src/lib/contexts/contestant/contestantUserDataState.svelte.test.ts
  - apps/frontend/src/lib/contexts/contestant/contestantUserDataState.svelte.ts
  - apps/frontend/src/lib/contexts/contestant/contestantUserDataState.type.ts
  - apps/frontend/src/lib/server/admin/requireAdminIdentity.test.ts
  - apps/frontend/src/routes/api/admin/jobs/adminJobsAuthorization.test.ts
  - apps/frontend/src/routes/contestant/(protected)/+layout.server.ts
  - apps/frontend/src/routes/contestant/(protected)/+layout.svelte
  - apps/frontend/src/routes/contestant/(protected)/layout.server.test.ts
  - apps/frontend/src/routes/contestant/(protected)/termsOfUseLayout.svelte.test.ts
  - apps/supabase/scripts/lint-schema.mjs
  - apps/supabase/supabase/migrations/00001_initial_schema.sql
  - apps/supabase/supabase/schema/102-entities.sql
  - apps/supabase/supabase/schema/301-auth-functions.sql
  - apps/supabase/supabase/schema/302-rls.sql
  - apps/supabase/supabase/schema/303-column-grants.sql
  - apps/supabase/supabase/schema/304-terms-of-use-acceptances.sql
  - apps/supabase/supabase/schema/400-storage.sql
  - apps/supabase/supabase/schema/503-entity-rpcs.sql
  - apps/supabase/supabase/tests/database/00-helpers.test.sql
  - apps/supabase/supabase/tests/database/03-anon-read.test.sql
  - apps/supabase/supabase/tests/database/05-organization-admin.test.sql
  - apps/supabase/supabase/tests/database/07-rpc-security.test.sql
  - apps/supabase/supabase/tests/database/09-column-restrictions.test.sql
  - apps/supabase/supabase/tests/database/10-schema-migrations.test.sql
  - apps/supabase/supabase/tests/database/16-anon-visibility.test.sql
  - apps/supabase/supabase/tests/database/18-entity-policies.test.sql
  - apps/supabase/supabase/tests/database/20-storage-authority.test.sql
  - apps/supabase/supabase/tests/database/21-entity-organization.test.sql
  - apps/supabase/supabase/tests/database/25-matrix-conformance.test.sql
  - apps/supabase/supabase/tests/database/33-entity-type-collision.test.sql
  - apps/supabase/supabase/tests/database/37-terms-of-use-acceptances.test.sql
  - packages/dev-seed/src/supabaseAdminClient.ts
  - packages/dev-seed/src/template/permittedKeys.ts
  - packages/dev-seed/src/templates/defaults/candidates-override.ts
  - packages/dev-seed/src/templates/e2e/base.ts
  - packages/dev-seed/src/templates/e2e/perm/perm-localisation-positive.ts
  - packages/dev-seed/src/templates/e2e/perm/shared.ts
  - packages/dev-seed/tests/integration/default-template.integration.test.ts
  - packages/dev-seed/tests/templates/base.test.ts
  - packages/dev-seed/tests/templates/default.test.ts
  - packages/supabase-types/src/column-map.ts
  - packages/supabase-types/src/database.overrides.ts
  - scripts/assert-project-scoped-queries.mjs
  - tests/playwright.config.ts
  - tests/tests/fixtures/contestant/contestantTermsOfUsePage.fixture.ts
  - tests/tests/setup/admin/admin-access.teardown.ts
  - tests/tests/setup/admin/admin-auth.setup.ts
  - tests/tests/setup/contestant/contestant-journey.setup.ts
  - tests/tests/setup/perm/perm-closed-project.setup.ts
  - tests/tests/setup/shared/auth.setup.ts
  - tests/tests/setup/shared/base.teardown.ts
  - tests/tests/specs/a11y/contestant-a11y.spec.ts
  - tests/tests/specs/contestant/contestant-journey.spec.ts
  - tests/tests/specs/perm/perm-localisation-positive.spec.ts
  - tests/tests/specs/voter/voter-journey.spec.ts
  - tests/tests/utils/axeScan.ts
  - tests/tests/utils/contestantJourneyConstants.ts
  - tests/tests/utils/rawKeyScan.ts
  - tests/tests/utils/supabaseAdminClient.ts
  - tests/tests/utils/testCredentials.ts
  - tests/tests/utils/testIds.ts
findings:
  critical: 0
  warning: 4
  info: 3
  total: 7
status: issues_found
---

# Phase 172: Code Review Report

**Reviewed:** 2026-10-22T19:57:01Z
**Depth:** standard
**Files Reviewed:** 73
**Status:** issues_found

## Summary

This is a retroactive review at HEAD. It concentrates on what the phase's own commits (`(172-NN)`) introduced since `03b8a0524`: the `public.terms_of_use_acceptances` table and its access model, the `scopedFrom(...).upsert` member, `acceptTermsOfUse` and the acceptance read in `_getBasicUserData`, the gate list and `TermsOfUseGate`, removing the candidate visibility conjunct and the column, and the E2E and seed follow-through. Later phases have heavily rewritten many of the listed files (the entity-property writer, the user-data store, the layout loads), and code those phases introduced is out of scope here. Findings already in the 177.1 and 179 reviews are not repeated.

**Forgery: no path found.** `authenticated` holds INSERT on `project_id` only. `user_id` defaults to `auth.uid()` and `accepted_at` to `now()`. The INSERT policy checks `user_id = (SELECT auth.uid())`. No UPDATE or DELETE is granted, and `anon` holds nothing. So an API caller cannot record an acceptance for someone else, backdate one, or withdraw or rewrite one. Section 2 of pgTAP 37 asserts every one of these refusals by SQLSTATE. Only the service role can state `user_id`, and it is used in test tooling alone. The schema file and the migration block match byte for byte.

**Per-project scoping is correct.** The write supplies `project_id` through `scopedFrom`, and nothing else can supply it. The read applies the project filter, and RLS limits it to the caller's own rows. Since the primary key is `(user_id, project_id)`, an acceptance in one project never satisfies another project's gate.

**Bypass: acceptance is advisory by construction.** Nothing on the server requires an acceptance row (WR-01). The rest of the findings are an existence oracle and cross-tenant writes allowed by the project-blind INSERT policy (WR-04), a silent dead end when the acceptance read fails (WR-03), and the lack of any admin read path (WR-02).

## Narrative Findings (AI reviewer)

## Warnings

### WR-01: Terms-of-use acceptance is enforced only by the Contestant App's layout. No server-side write or publication path requires it

**File:** `apps/supabase/supabase/schema/304-terms-of-use-acceptances.sql:27`, `apps/frontend/src/routes/contestant/(protected)/+layout.server.ts:76-78`, `apps/supabase/supabase/tests/database/37-terms-of-use-acceptances.test.sql:697-777`
**Issue:** The only thing that consults acceptance is `firstNeededGate`, inside the protected layout's server load. The table's own header says so: "no policy and no function reads this table". Section 7 of pgTAP 37 also asserts that no policy or function body mentions `terms_of_use`. A signed-in editor who never accepted can therefore still do everything through PostgREST or the Storage API with the session cookie the app issued: `entity_update_own_candidates` (answers, profile fields, image), the nomination RPCs and image uploads all work without an acceptance row. The same holds for the non-layout endpoints under `/api/contestant/*`.

Before this phase, the candidate visibility conjunct was a server-side consequence of not accepting, since the row was not public. 172-06 removed it (TOU-02), so the content of an editor who never accepted is published as soon as the entity is confirmed. The terms are typically the consent to publish what the editor enters, and that consent is now neither a precondition of writing nor of publishing. It is only a UI screen, and any client bypasses it.

D-05 and D-13 accepted this property ("it unlocks nothing"), so this is not a regression against the plan. It is still the direct answer to "can acceptance be bypassed": yes, trivially, by any client that is not this SvelteKit layout. It should be a recorded, owned risk rather than an implicit one.
**Fix:** Either (a) enforce at the write boundary: add a RESTRICTIVE policy to the entity self-update policies (and the self-service nomination RPCs) that requires an acceptance row for the row's project:
```sql
CREATE POLICY "entity_update_requires_terms_candidates" ON public.candidates
  AS RESTRICTIVE FOR UPDATE TO authenticated
  USING (
    (SELECT user_can('project', project_id, 'project.update_entities'))  -- admins exempt
    OR EXISTS (
      SELECT 1 FROM public.terms_of_use_acceptances a
      WHERE a.user_id = (SELECT auth.uid()) AND a.project_id = candidates.project_id
    )
  );
```
(Update the pgTAP 37 census, which currently forbids any reader of the table.) Or (b) keep the design, record it explicitly as an accepted risk beside the TOU-F01 todo, and state in the table header that acceptance is a UI-only consent record with no server-side effect.

### WR-02: No role other than the accepting user can read an acceptance, so acceptance cannot be audited and TOU-03/TOU-F01 cannot be built on this table

**File:** `apps/supabase/supabase/schema/304-terms-of-use-acceptances.sql:29-67`
**Issue:** The table has exactly two policies, both of which answer `user_id = auth.uid()`. A project admin, an account admin and the root admin can therefore see nobody's acceptance. When acceptance was the column `candidates.terms_of_use_accepted`, a project admin could read it through `authenticated_select_candidates`'s project disjunct. That audit capability is gone, and nothing replaces it. The phase's own TOU-03 todo (D-17: "computable as `grants ⋈ terms_of_use_acceptances`") cannot be computed by any API role, because `grants` is revoked from every API role and this table returns only the caller's own rows. The `idx_terms_of_use_acceptances_project_id` index ("who has accepted here") serves a query no API caller can make. The pgTAP census in Section 7 would also fail any future definer function that reads the table, so the next phase is blocked by a test rather than by a design decision.
**Fix:** Add a project-scoped admin read, for example:
```sql
CREATE POLICY "admin_select_terms_of_use_acceptances" ON public.terms_of_use_acceptances FOR SELECT
  TO authenticated USING ((SELECT user_can('project', project_id, 'project.read_entities')));
```
Narrow the Section 7 census so that it allows this policy by name. If auditing is intentionally deferred, say so in the table header and in the TOU-F01 todo, because the current wording implies that the join is available.

### WR-03: A failed acceptance read is turned into "not accepted", which loops the user on the gate with no error

**File:** `apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts:553-563`, `apps/frontend/src/lib/contestant/gates/TermsOfUseGate.svelte:49-63`
**Issue:** `_getBasicUserData` logs an acceptance read error and returns `termsOfUseAccepted: null`, and `firstNeededGate` then shows the gate. The user ticks the box and presses Continue. `acceptTermsOfUse()` succeeds, because the upsert is `ON CONFLICT DO NOTHING` and succeeds whether or not a row already exists. `invalidateAll()` reruns the load, the read fails again, the gate is rendered again and `status` returns to `'idle'`. The user gets no message and no way forward. They stay on the terms screen however many times they accept, and every click writes nothing new. Any persistent read failure triggers this, for example a privilege regression on the table, a PostgREST schema-cache problem or a policy error. The code's own comment justifies the collapse as "harmless to repeat", but the repeat cannot end while the read keeps failing.

The handling is also inconsistent with the password fact read 4 lines below, which throws for the same class of failure precisely because "a fact that was not read is neither set nor not set".
**Fix:** Do not turn a failed read into a value. Either throw (the layout already signs out with `loginFailed` on a thrown `getBasicUserData`, as it does for the password fact):
```ts
if (acceptanceError)
  throw new Error(`getBasicUserData: could not read the terms-of-use acceptance: ${acceptanceError.message}`);
const termsOfUseAccepted = acceptance?.accepted_at ?? null;
```
or carry a distinct `'unknown'` state that the gate renders as an error. At minimum, `TermsOfUseGate` should set `status = 'error'` when the rerun load still returns `gate === 'termsOfUse'` after a successful accept.

### WR-04: The project-blind INSERT policy lets any signed-in user write rows into any tenant, and tells them which project ids exist

**File:** `apps/supabase/supabase/schema/304-terms-of-use-acceptances.sql:27,40-47`, `apps/supabase/supabase/tests/database/37-terms-of-use-acceptances.test.sql:552-576`
**Issue:** `WITH CHECK (user_id = auth.uid())` does not constrain `project_id`. Any authenticated identity can insert rows for projects it holds no grant in, including closed projects. That includes an identity-provider account, whose sign-up does not depend on an invitation. pgTAP 37 asserts both outcomes: the insert succeeds for project B, which the user has no grant in and which is not open, and fails with `23503` for an id that does not exist. That difference is a project-existence oracle across tenants. `projects` itself is readable only with `project.read_structure`, so the FK error discloses something RLS hides. Project ids are UUIDs, so practical enumeration is hard, which is why this is a warning rather than a blocker. The cross-tenant rows themselves land in other tenants' data: once WR-02 adds an admin reader, project B's admins see acceptance rows from users unrelated to B. A user can also "pre-accept" project B's terms through the API without ever being shown B's terms text, and then skip B's gate if B later invites them.
**Fix:** Constrain the INSERT to projects in which the caller holds a grant, through a private definer helper (grants are not readable by API roles):
```sql
CREATE POLICY "authenticated_insert_terms_of_use_acceptances" ON public.terms_of_use_acceptances
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND (SELECT private.caller_holds_grant_in_project(project_id))
  );
```
Make the helper return `false` rather than raise for an unknown project, so that "does not exist" and "not yours" give the same refusal. Then update Section 4 of pgTAP 37.

## Info

### IN-01: `TermsOfUseGate`'s Logout stays in its loading state if `logout()` rejects

**File:** `apps/frontend/src/lib/contestant/gates/TermsOfUseGate.svelte:65-69`
**Issue:** `handleLogout` sets `status = 'loading'`, which disables both buttons, then awaits `logout()` with no `try/finally`. `#authLogout` catches writer errors, but the context's `#logout` also awaits `goto(...)`, and a rejection there leaves both buttons disabled and produces an unhandled rejection. This is the same pattern as 179 IN-05 (`IdentityProviderGate`) and `SetPasswordGate`, here in the file this phase introduced.
**Fix:** `try { await logout(); } finally { status = 'idle'; }`, and apply the same fix to the sibling gates.

### IN-02: An `invalidateAll()` failure after a recorded acceptance is reported as "save failed"

**File:** `apps/frontend/src/lib/contestant/gates/TermsOfUseGate.svelte:52-62`
**Issue:** `acceptTermsOfUse()` and `invalidateAll()` share one `try`. If the acceptance is stored but the rerun rejects, the user sees `contestantApp.error.saveFailed`, although the save succeeded. A retry is harmless because of DO NOTHING, but the message is wrong and the log line ("Failed to record the terms-of-use acceptance") misattributes the cause.
**Fix:** Give the rerun its own `try` and its own message or log, or log it without setting `status = 'error'`.

### IN-03: The acceptance does not record which terms were accepted

**File:** `apps/supabase/supabase/schema/304-terms-of-use-acceptances.sql:3,12-17`
**Issue:** The row's presence is the whole acceptance (D-03). The terms text comes from per-project dynamic translations (`dynamic.contestantAppPrivacy.*`), which an admin can change at any time. A change to the terms therefore never asks anyone to accept again, and nothing records which text a stored acceptance referred to. This was an accepted decision. It is recorded here because, together with WR-02, it means the table cannot answer "did this editor agree to the terms now in force".
**Fix:** When TOU-F01 is planned, add a `terms_version` (or a content hash) column and make the gate predicate compare it with the project's current version.

---

_Reviewed: 2026-10-22T19:57:01Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
