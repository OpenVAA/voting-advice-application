# Phase 176: Contestant Home, Task State & Nominations View - Pattern Map

**Mapped:** 2026-10-08
**Tree read at:** `d33eccbca` (branch `feat/entity-signup-multi-grant`); re-checked at `548fc75b9`, two Phase 175
commits later — of every file excerpted below only `tests/database/05-organization-admin.test.sql` changed
in between (three lines, outside TEST C).
**Files analyzed:** 65 new or modified files (or file sets), in 8 groups
**Analogs found:** 63 / 65 — 41 on today's tree alone, 22 whose best analog is something Phase 175 builds
(each with a fallback that exists today)

**How analogs are cited.** By path plus a content anchor — a symbol or a quoted line — never a line number.
Excerpts are verbatim from the tree; a long line is cut with `…` and nothing else is changed. Frontend paths
are relative to `apps/frontend/src/` unless they start with `apps/`; `schema/` and `tests/database/` are
relative to `apps/supabase/supabase/`; `ENTITY/` abbreviates
`routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/`; `PROT/` abbreviates
`routes/contestant/(protected)/`. Every analog named is git-tracked (`git ls-files --error-unmatch`); none is
a generated or mirrored copy.

**Where each analog was read.** Three marks:

- **[tree]** — opened in this checkout at `d33eccbca`.
- **[175-NN Tk]** — *not on the tree*: read in `.planning/phases/175-organization-editing-profile-questions-preview/175-NN-PLAN.md`, task k. Phase 175 is executing (wave 1 running; plans 01 and 02 partly landed). Each such fact is re-read from 175's SUMMARY before an anchor is fixed. A **fallback** on today's tree is given beside it.
- **[175-PATTERNS §X]** — already mapped by `175-PATTERNS.md`; the excerpt is not repeated here.

**Names of new symbols and files are placeholders** (`<taskState>`, `<group>`, `get_entity_nominations`,
`perm-no-nomination`) unless the context fixes them (`tasks`, `nextStep`, `ContestantAppNominations`,
`NotEditableNote`).

**Read-only mapping.** No dev server, E2E run, workspace gate or database command was run.

## File Classification

Plan numbers are `176-RESEARCH.md` § *Proposed plans and waves* (01 drivers, 02 schema, 03 helper, 04 read and
load, 05 context, 06 routes and gate, 07 note, 08 J/menu/profile, 09 home and every Continue, 10 dataset/spec/
scans, 11 close).

### Group A — schema and pgTAP (plan 02)

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `schema/503-entity-rpcs.sql` (+ the nominations function; the file's header list) | migration (RPC) | request-response | `public.get_entity_basic_data` (definer shell, `NULL` refusal, allow-list) + `public.get_entity_user_data` (signature, `private.caller_entity_ids` gate) + `public.get_user_entities` (`jsonb_agg` with `'[]'` fallback) — all in the same file [tree] | exact (composite) |
| `tests/database/42-<name>.test.sql` (NEW; 40 and 41 are 175-03's) | test | request-response | `tests/database/36-entity-identity.test.sql` (frame, `pg_temp` readers, key-set reader, refusals asserted twice) + `05-organization-admin.test.sql` § "Section 5c: TEST C" (the unconfirmed child under a parent's nomination) [tree] | exact (composite) |
| `tests/database/07-rpc-security.test.sql` (census string) | test | — | the same file, 'census: the SECURITY DEFINER functions in public that authenticated can execute…' [tree] | exact |
| `scripts/assert-project-scoped-queries.mjs` (`PROJECT_SCOPED_RPCS`) | config (lint gate) | — | its own `get_entity_user_data: 'requires p_project_id',` row [tree] | exact |
| `migrations/00001_initial_schema.sql`, `packages/supabase-types/src/database.ts` | generated | — | regenerated, never hand-edited [175-PATTERNS § Shared → *Schema edits ride one generated migration*] | n/a |

### Group B — the one nominations read (plan 04)

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `lib/api/adapters/supabase/utils/<entityNominations>.ts` + `.test.ts` (NEW) | utility (jsonb narrowing) | transform | `lib/api/adapters/supabase/utils/userEntities.ts` + `userEntities.test.ts` [tree] | exact |
| `lib/api/base/dataWriter.type.ts` (a nomination type of its own; `ContestantUserData<true>['nominations']` cut loose from `DPDataType`) | model | — | `ContestantUserData` and `UserEntity` in the same file [tree] | exact |
| `lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts` (`_getEntityUserData` on the RPC) | service | request-response | `_getUserEntities` in the same file [tree]; the file is edited first by [175-07 T1] | exact |
| `supabaseDataWriter.test.ts`, `supabaseDataWriter.integration.test.ts` | test | request-response | the same files — `describe('getEntityUserData for a candidate'`, 'loads nominations when loadNominations=true' [tree] | exact |
| `lib/api/base/universalDataWriter.ts`, `app.d.ts` (re-typed, no logic) | service / types | — | in place | n/a |
| `lib/contexts/contestant/contestantUserDataState.svelte.ts` + `.type.ts` + `.svelte.test.ts` (a getter for the saved nominations) | store | request-response | `#savedEntityData` / `get savedEntityData()` in the same file [tree]; edited first by [175-07 T2] and [175-08 T2] | exact |

### Group C — the task state (plans 03 and 05)

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `lib/contestant/tasks/<taskState>.ts` + `.test.ts` (NEW; replaces the home helper) | utility (pure) | transform | `ENTITY/contestantHome.helpers.ts` + `contestantHome.helpers.test.ts` [tree]; both edited first by [175-04 T1] and [175-10 T2] | exact |
| `lib/contestant/tasks/<unanswered>.ts` + `.test.ts` (NEW; the two "unanswered" filters, rune-free) | utility (pure) | transform | `lib/contexts/utils/questionRollup.ts` (a rune-free module both sides can import) + the bodies of `#unansweredRequiredInfoQuestions` / `#unansweredOpinionQuestions` in `contestantContext.svelte.ts` [tree] | role-match |
| `lib/contexts/contestant/contestantContext.svelte.ts` (`tasks`, `nextStep`, the preview fact, `profileComplete` from the tasks, empty lists with no election) | provider | event-driven | `#profileComplete`, `#answersLocked` + getter, `#user` / `#selectedEntity` (page-data-derived), the rollup `$effect` — same file [tree]; `nominationsLocked`, `questionsReady` and the type-aware scope arrive with [175-08 T2] | exact |
| `lib/contexts/contestant/contestantContext.type.ts` | model | — | the `answersLocked: boolean` member and the reactive-accessor doc line [175-PATTERNS § F1] | exact |
| `lib/contexts/contestant/contestantContext.svelte.test.ts` | test | event-driven | the same file's harness [175-PATTERNS § F1] | exact |
| `ENTITY/contestantHome.helpers.ts` + `.test.ts` (DELETED) | utility | — | n/a | n/a |

### Group D — the load, the routes and the gate (plans 04 and 06)

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `ENTITY/+layout.server.ts` (stage 4 removed; the question read skipped; docblock rewritten) | route (server load) | request-response | the same file [tree] | exact |
| `ENTITY/layout.server.test.ts` (the no-nomination describe rewritten; `NO_NOMINATION_ROUTE` out) | test | request-response | the same file [tree] | exact |
| `ENTITY/+layout.svelte` (`validity` on the flat list; `provideEntityData(snapshot.entities)` out) | component (layout) | request-response | the same file's `validity` derivation [tree] | exact |
| `ENTITY/(<group>)/+layout.server.ts` (NEW; "no nomination" for three pages) | route (server load, gate) | request-response | `PROT/[...page=contestantEntityPage]/+page.server.ts` (takes `params` and `parent` only; one `redirect(307, buildRoute(…))`) + stage 1 of `ENTITY/+layout.server.ts` [tree] | role-match |
| `ENTITY/(<group>)/layout.server.test.ts`, `layout.tracking.test.ts` (NEW) | test | request-response | `ENTITY/layout.server.test.ts`, `ENTITY/layout.tracking.test.ts`, `PROT/loadTracking.testUtils.ts` [tree] | exact |
| `ENTITY/(<group>)/preview/+page.server.ts` (NEW; "both filled") | route (page-level server load, gate) | request-response | `PROT/+page.server.ts` (a page-level load that awaits its parent, returns `{}` under a gate and redirects to `ContestantAppEntityHome`) [tree] | exact |
| `ENTITY/(<group>)/preview/page.server.test.ts`, `page.tracking.test.ts` (NEW) | test | request-response | `PROT/page.server.test.ts`, `PROT/page.tracking.test.ts` [tree] | exact |
| `lib/server/contestant/<previewInputs>.ts` + parity test (NEW; S1 or S2 of RESEARCH RQ-1 (b)) | service (server-only) | transform | `lib/server/contestant/signOutToLogin.ts` (form of a server-only contestant helper) + `routes/(voters)/(located)/+layout.ts` (`new DataRoot()` built inside a load) [tree] | partial — see *No Analog Found* |
| `lib/routes/route.ts` (four values gain the group; `ContestantAppNominations` added) | config | — | the `ContestantApp…` block of `ROUTE` [tree] | exact |
| `lib/routes/route.test.ts`, `tests/tests/utils/contestantEntityUrl.test.ts` (literal route ids) | test | — | in place | n/a |
| `params/contestantEntityPage.ts` + `.test.ts` | utility (matcher) | — | `SINGLE_SEGMENT_PAGES` and the accept-set doc in the same file [tree] | exact |
| `PROT/[...page=contestantEntityPage]/+page.server.ts` + `page.server.test.ts` | route | request-response | `SINGLE_SEGMENT_ROUTES` in the same file [tree] | exact |
| `ENTITY/(<group>)/questions/+layout.svelte` + `layout.svelte.test.ts` (redirect **and** render condition out) | component (layout) | request-response | the file as [175-10 T2] leaves it (three states); fallback: today's file [tree] and [175-PATTERNS § H2] | exact |
| `lib/contestant/utils/loginError.ts`, `lib/server/contestant/signOutToLogin.test.ts`, `scripts/fixtures/assert-no-candidate-app-names.input.ts` (re-read) | utility / test | — | in place [tree] | n/a |

### Group E — components, pages and copy (plans 07, 08, 09)

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `lib/contestant/components/notEditableNote/NotEditableNote.svelte`, `.type.ts`, `index.ts` (NEW) | component | request-response | `lib/contestant/components/nothingToEdit/` (a contestant component that composes `ContactSupport`, with a `children` snippet, a `.type.ts` and a barrel) + `lib/components/warning/Warning.svelte` (the root it wraps) [tree] | exact (composite) |
| `…/notEditableNote/NotEditableNote.svelte.test.ts` (NEW) | test | request-response | `lib/contestant/components/contactSupport/ContactSupport.svelte.test.ts` [tree] | exact |
| `lib/contestant/components/contactSupport/ContactSupport.svelte`, `.type.ts`, `.svelte.test.ts` (`iconPos`) | component | request-response | the `variant` prop of the same three files [tree] | exact |
| `lib/dynamic-components/navigation/contestant/ContestantNav.svelte` + `.svelte.test.ts` | component | request-response | the `contestant-nav-questions` item and the test's fake-context harness [tree]; both edited first by [175-10 T2] | exact |
| `lib/contestant/components/logoutButton/LogoutButton.svelte` + `.svelte.test.ts` | component | event-driven | `triggerLogout` and the test's `$state`-backed fake context [tree]; the component edited first by [175-10 T2] | exact |
| `ENTITY/+page.svelte` (home) | component (route page) | request-response | the same file [tree], as [175-10 T2] leaves it | exact |
| `ENTITY/nominations/+page.svelte` (NEW; J) | component (route page) | request-response | `NothingToEdit.svelte` (a `MainContent` page body with a `<dl>`/`<dd>`, `ContactSupport` and no form control) + `PROT/+page.svelte` (`pageStyles.push` under a condition) [tree] | role-match |
| `ENTITY/nominations/page.svelte.test.ts` (NEW) | test | request-response | `PROT/page.svelte.test.ts` (a route page mounted against a fake context) [tree]; `profile/page.svelte.test.ts` from [175-09 T2] | role-match |
| `ENTITY/(<group>)/profile/+page.svelte` + `page.svelte.test.ts` (block, `parseNomination`, `submitRouting`, the note) | component (route page) | CRUD | the file as [175-09 T2–T3] leave it; fallback: today's file [tree] and [175-PATTERNS § H1] | exact |
| `ENTITY/(<group>)/questions/+page.svelte` (the note; two Continue buttons) | component (route page) | request-response | the same file [tree]; edited first by [175-10 T2] | exact |
| `ENTITY/(<group>)/questions/[questionId]/+page.svelte` (the note; `submitRouting`) | component (route page) | CRUD | `getNextQuestionId`, `submitRouting` in the same file [tree] | exact |
| `lib/contestant/utils/entityDescriptor.ts` + `.test.ts` (four members added, one re-pointed) | utility (per-type map) | transform | the module [175-04 T2] creates; fallback: [175-PATTERNS § G2] | exact once 175-04 lands |
| `apps/frontend/messages/{da,en,et,fi,fr,lb,sv}/contestantApp.nominations.json` (NEW ×7), `contestantApp.common.json`, `contestantApp.home.json`, `contestantApp.basicInfo.json`, `contestantApp.error.json`, `common.json`; `lib/types/generated/translationKey.ts` | config (i18n catalogue) | — | `apps/frontend/messages/en/contestantApp.home.json` (a namespace file) + `contestantApp.questions.unansweredWarning` (a plural message) [tree]; per-type keys [175-PATTERNS § I1] | exact |

### Group F — E2E harness (plans 08, 09, 10)

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `packages/dev-seed/src/templates/e2e/perm/<perm-no-nomination>.ts` (NEW) | config (seed template) | batch | `perm-organization-editing.ts` from [175-05 T1] (hand-authored, both types served); fallback: `perm-org-matching.ts` [175-PATTERNS § B4] and the base rows `test-e2e-base-or-invitation` / `test-e2e-base-ca-invitation` [tree] | exact once 175-05 lands |
| `packages/dev-seed/src/templates/index.ts`, `src/cli/help.ts` | config | — | [175-PATTERNS § B4, *Registration*] | exact |
| `tests/tests/utils/<permNoNominationData>.ts` (NEW) | test fixture (constants) | — | `tests/tests/utils/permOrganizationEditingData.ts` from [175-05 T1]; fallback: `tests/tests/utils/testCredentials.ts` | exact once 175-05 lands |
| `tests/tests/setup/perm/<perm-no-nomination>.setup.ts`, `.teardown.ts` (NEW) | test setup / teardown | batch | [175-PATTERNS § J1, § J2]; the 175 pair from [175-05 T2] | exact |
| `tests/playwright.config.ts` (the trio; the chain edge) | config | — | [175-PATTERNS § J3]; the `perm-organization-editing` trio from [175-05 T2] | exact |
| `tests/tests/fixtures/contestant/<perm-no-nomination>.ts` (NEW; composition root) | test fixture | — | `tests/tests/fixtures/contestant/contestant-entity-selection.ts` [tree]; `fixtures/contestant/perm-organization-editing.ts` from [175-05 T2] | exact |
| `tests/tests/fixtures/contestant/contestantNominationsPage.fixture.ts` (NEW) | test fixture (page object) | request-response | `tests/tests/fixtures/contestant/contestantNothingToEditPage.fixture.ts` [tree] | exact |
| `tests/tests/fixtures/contestant/contestantHomePage.fixture.ts` (`expectTasks` by status) | test fixture | request-response | the same file [tree]; `contestantEntityHomePage.fixture.ts` from [175-05 T2] | exact |
| `tests/tests/fixtures/shared/navMenu.fixture.ts` (the closed-items step) | test fixture | request-response | `expectSwitchEntityItem` / `expectNoSwitchEntityItem` in the same file [tree]; edited first by [175-10 T1] | exact |
| `tests/tests/fixtures/contestant/contestantProfilePage.fixture.ts` (`expectStaticInfo` loses its `nomination` half) | test fixture | — | the same file [tree]; edited first by [175-09 T1] and [175-12 T3] | exact |
| `tests/tests/utils/testIds.ts` | config | — | the `contestant.nothingToEdit` block (ids with a comment saying what element carries each) [tree] | exact |
| `tests/tests/specs/perm/<perm-no-nomination>.spec.ts` (NEW) | test (E2E spec) | CRUD | [175-PATTERNS § J4]; `perm-access-disable.spec.ts` (a project-wide `access.*` flip with its restore); `specs/storage/storage-cleanup.spec.ts` (`bulkImport` from a spec); `fixtures/shared/invitationFlow.fixture.ts` (`admin.update('nominations', …, { confirmed })`) [tree] | role-match |
| `tests/tests/specs/contestant/contestant-journey.spec.ts` (every `expectTasks(` caller; step 12; step 19.5) | test (E2E spec) | — | the same file [tree] | exact |
| `tests/tests/specs/a11y/contestant-a11y.spec.ts` (`cand-nominations` added; `cand-profile` marker; `cand-home` reach) | test (a11y) | request-response | the `CONTESTANT_AXE_ROUTES` table [tree]; `declareScans` from `tests/tests/utils/contestantAxeScan.ts` [175-12 T1]; fallback [175-PATTERNS § J5] | exact |
| `scripts/assert-a11y-scan-wiring.mjs` (check 4a list gains the new spec) | config (lint gate) | — | its `['a11y-smoke.spec.ts', a11ySmokeSrc], …` list [tree]; as [175-12 T1] extends it | exact |
| `tests/tests/specs/perm/perm-answers-locked.spec.ts` (asserts the id on the questions list too) | test | — | its own `contestant-answers-locked-warning` assertions [tree] | exact |

### Group G — phase drivers (plans 01 and 11)

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `.planning/phases/176-…/176-gates.sh` (NEW) | utility (gate driver) | batch | `.planning/phases/175-organization-editing-profile-questions-preview/175-gates.sh` [tree, since `cfb0be608`] | exact |
| `.planning/phases/176-…/176-e2e.sh` (NEW) | utility (E2E driver) | batch | `…/175-e2e.sh` [tree] | exact |
| `.planning/phases/176-…/176-verdict.mjs` (NEW) | utility (verdict) | batch | `…/175-verdict.mjs` [tree] | exact |

### Group H — docs and skills (plan 11)

`apps/docs/src/routes/(content)/developers-guide/contestant-app/{entity-selection,login-and-password-reset,pre-registration-and-invitation}/+page.md`
and a new page for home, the task state and J beside them; `routes/contestant/README.md`;
`lib/contestant/components/README.md`; `.claude/skills/components/context-reactivity.md` § 1b and `CLAUDE.md`
§ *Context Destructuring Rule* (the accessor list gains `tasks` and `nextStep`);
`.claude/skills/database/schema-reference.md` and `rls-policy-map.md`. In-place edits; no analog needed.

## Pattern Assignments

### A1 — the nominations function in `schema/503-entity-rpcs.sql` (migration, request-response)

**Analog, three functions of the same file [tree].** Each gives one part; none gives all.

**The definer shell, the refusal and the grant block** — `public.get_entity_basic_data`:

```sql
CREATE OR REPLACE FUNCTION public.get_entity_basic_data (
  p_entity_type public.entity_type,
  p_entity_id uuid
) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER
SET
  search_path = '' AS $$
DECLARE
  result jsonb;
BEGIN
  IF p_entity_id IS NULL OR NOT public.user_can('entity', p_entity_id, 'nomination.read', p_entity_type) THEN
    RETURN NULL;
  END IF;
```

```sql
REVOKE
EXECUTE ON FUNCTION public.get_entity_basic_data (public.entity_type, uuid)
FROM
  PUBLIC,
  anon;

GRANT
EXECUTE ON FUNCTION public.get_entity_basic_data (public.entity_type, uuid) TO authenticated;
```

**The allow-list projection** — one `jsonb_build_object` naming every key, never `to_jsonb(row)`:

```sql
    WHEN 'organization' THEN
      SELECT jsonb_build_object(
          'entity_type', 'organization', 'id', o.id, 'project_id', o.project_id,
          'name', o.name, 'short_name', o.short_name, 'info', o.info, 'color', o.color, 'image', o.image,
          'sort_order', o.sort_order, 'subtype', o.subtype, 'confirmed', o.confirmed)
        INTO result
        FROM public.organizations o WHERE o.id = p_entity_id;
```

**The signature and the recommended gate** — `public.get_entity_user_data`: project, type and id, none with a
default, and "is it the caller's" asked of the grant table:

```sql
CREATE OR REPLACE FUNCTION public.get_entity_user_data (
  p_project_id uuid,
  p_entity_type public.entity_type,
  p_entity_id uuid
) RETURNS TABLE (
```

```sql
  WHERE p_entity_type = 'candidate'
    AND c.id = p_entity_id
    AND c.project_id = p_project_id
    AND c.id IN (SELECT private.caller_entity_ids (p_project_id, 'candidate'))
```

`private.caller_entity_ids` (`schema/301-auth-functions.sql`) reads `public.grants` for the caller's `editor`
rows and "reads the table rather than the caller's token, so a grant written after the token was issued
already counts". Whether the new function's gate is this or `user_can` is RESEARCH T-8 and decides two pgTAP
cells.

**"No nomination" is `[]`, a refusal is `NULL`** — `public.get_user_entities`:

```sql
        SELECT jsonb_agg(e.entity ORDER BY e.type_order, e.id)
        …
      ),
      '[]'::jsonb
```

**The parent's and the entity's joins** — `public.get_nominations`, same file: the four `LEFT JOIN`s keyed on
`n.candidate_id` / `n.organization_id` / `n.faction_id` / `n.alliance_id`, `COALESCE(o.name, f.name, a.name)`
for a name across entity tables, and `ORDER BY n.sort_order NULLS LAST, n.id`.

**What to copy:** the header-comment form — a rule line of dashes, the function's name and one sentence, then a
paragraph each for the gate, the naming by type and id, the projection ("an ALLOW-LIST, not `to_jsonb(row) -
<deny-list>`"), the refusal ("Returns NULL -- never raises --"), and why it is `SECURITY DEFINER`; the file's
own header list (`-- - get_entity_basic_data() - …`) gains a line. The proposed body is `176-RESEARCH.md`
§ *Code Examples → The nominations function*.

---

### A2 — `tests/database/42-<name>.test.sql` (test, request-response)

**Analog for the frame and the readers:** `tests/database/36-entity-identity.test.sql` [tree].

```sql
BEGIN;

SET
  search_path = public,
  extensions;

-- Reset pgTAP internal state from previous test files in same session
DROP TABLE IF EXISTS __tcache__;

SELECT
  plan (61);

SELECT
  create_test_data ();
```

A `pg_temp` reader per question the cells ask, so each cell is one `is (…)`:

```sql
-- How many rows public.get_entity_user_data returns to the caller for one entity.
CREATE FUNCTION pg_temp.read_count (
  p_project_id uuid,
  p_entity_type public.entity_type,
  p_entity_id uuid
) RETURNS bigint LANGUAGE sql AS $$
  SELECT count(*) FROM public.get_entity_user_data(p_project_id, p_entity_type, p_entity_id);
$$;
```

The key-set reader is `pg_temp.entry_keys` in the same file ("The sorted keys of the first listed entry of one
type", built on `jsonb_object_keys(e.entry) ORDER BY 1`) — the model for "the keys of one returned element are
exactly the allow-list" and "the keys of `parent`". Its rule for refusals: "Every refusal is asserted twice:
the call raises nothing, and it returns no row" — a `lives_ok (format($$SELECT * FROM public.…(%L, 'candidate',
%L)$$, …), '… raises nothing')` beside the value assertion. The file's header ends "Every impersonation passes
an empty grant array, so each claim is projected from the rows this file writes" and names
`test_seed_identity_grants` — the way to give a caller an `editor` row in `public.grants`, which is what
`caller_entity_ids` reads.

**Analog for the fixture and the paired opposite:** `05-organization-admin.test.sql` § "Section 5c: TEST C"
[tree] — an unconfirmed candidate inserted after `reset_role ()` under a parent's nomination:

```sql
INSERT INTO
  nominations (
    id,
    project_id,
    candidate_id,
    election_id,
    constituency_id,
    election_round,
    parent_nomination_id
  )
VALUES
  (
    'ffffffff-ffff-ffff-ffff-000000000102'::uuid,
    test_id ('project_a'),
    'ffffffff-ffff-ffff-ffff-000000000002'::uuid,
    test_id ('election_a'),
    test_id ('constituency_a'),
    1,
    test_id ('nomination_org_a')
  );
```

then the refusal through the table and the answer through the function, in one file, so the cell proves
something: 'TEST C: an organization-role caller CANNOT SELECT the row…' (a `count(*)` of `0`) followed by
'TEST C: the nominating parent reads the child''s BASIC data through get_entity_basic_data, and that
projection carries no answers' (`r ->> 'first_name' = 'Nora' AND NOT (r ? 'answers')`), and a **paired
opposite** under another caller ('…answers NULL to an entity grantee that is NOT this candidate''s nominating
parent'). The new file runs the hop the other way: the child reads, the parent's row is refused through the
tables, and the function resolves the parent's name.

**The anon cell:** `throws_ok (…, '42501', NULL, …)` as in `23-nominations-write.test.sql` [175-PATTERNS § A6].
Session switches, `test_id ('…')`, the explicit `plan (N)` and "every deny has a paired allow" are
[175-PATTERNS § Shared → *pgTAP*].

---

### A3 — the census, and the scoped-query registry (test / lint gate)

**`tests/database/07-rpc-security.test.sql` [tree]** — the `authenticated` list is one sorted string:

```sql
    'claim_invitations,contestant_app_public_config,get_entity_basic_data,project_open_for_voters,storage_path_can,storage_path_is_public,user_can,user_has_account_grant',
    'census: the SECURITY DEFINER functions in public that authenticated can execute are the same six plus claim_invitations and get_entity_basic_data'
```

The new name goes in alphabetically (after `get_entity_basic_data`) and the description names it. The `anon`
list above it is unchanged — that it stays unchanged is the cell proving `REVOKE … FROM PUBLIC, anon`. The
file is also edited by [175-03]; re-read the string.

**`scripts/assert-project-scoped-queries.mjs` [tree]** — this settles RESEARCH open question 11. Every RPC the
adapter calls needs a row, or the guard fails with "rpc '…' has no disposition in PROJECT_SCOPED_RPCS":

```js
const PROJECT_SCOPED_RPCS = {
  get_nominations: 'requires p_project_id',
  get_questions: 'requires p_project_id',
  get_user_entities: 'requires p_project_id',
  get_entity_user_data: 'requires p_project_id',
  claim_invitations: 'requires p_project_id',
```

`'requires p_project_id'` means "the call must pass a `p_project_id` key". The new function takes one, so it
gets that disposition, and the paragraph above the map gains a sentence for it in the form its neighbours have.

---

### B1 — `lib/api/adapters/supabase/utils/<entityNominations>.ts` + test (utility, transform)

**Analog:** `lib/api/adapters/supabase/utils/userEntities.ts` [tree] — whole file is the shape.

```ts
import { z } from 'zod';
import type { Json } from '@openvaa/supabase-types';

/** The members every entry of the list carries, whatever its type. The JSONB members are kept as JSON and parsed by whoever renders them. */
const sharedEntryMembers = {
  id: z.string().min(1),
  short_name: z.json(),
  image: z.json(),
  color: z.json(),
  confirmed: z.boolean()
};
```

```ts
export function parseUserEntities(raw: Json | undefined): Array<UserEntityEntry> {
  const result = UserEntitiesSchema.safeParse(raw);
  if (!result.success) {
    const issues = result.error.issues.map((issue) => issue.path.join('.') || '(root)');
    throw new Error(`The list of the user's entities did not match its schema at: ${issues.join(', ')}`);
  }
  return result.data.entities;
}
```

**What to copy:** a zod schema in the database's own column names; "Unknown members are dropped rather than
refused"; the entry type as `z.infer`; a parse function whose TSDoc says why a malformed answer throws ("a
failed read … answering with an empty list instead would tell a user who edits entities that they edit none")
and whose message "names the paths the schema refused and never a stored value". **What differs:** the new
answer is `NULL` (a refusal) or an array, so the function has three outcomes — refused, a list (possibly
empty), malformed (throws) — and RESEARCH P-2 needs the first two kept apart at the writer.
**Test shape** (`userEntities.test.ts`): module-level entry constants, a `SECRET` value that must not appear
in the message, cases 'returns the entries of a well-formed mixed answer in the order listed', 'returns an
empty list for an answer whose entities array is empty', 'drops members the schema does not know…'.
`scripts/assert-adapter-casts.mjs` fails a cast chain under this directory [175-PATTERNS § E1].

---

### B2 — `supabaseDataWriter.ts`: `_getEntityUserData` on the RPC (service, request-response)

**Analog:** `_getUserEntities` in the same file [tree] — an RPC that passes the adapter's project, a failed
read that throws, the answer narrowed by the parse function, then mapped and localized:

```ts
    const { data: listed, error } = await this.supabase.rpc('get_user_entities', {
      p_project_id: this.projectId
    });
    if (error) throw new Error(`Failed to list the user's entities: ${error.message}`);

    const effectiveLocale = locale ?? this.defaultLocale;
    // A malformed answer throws inside the narrowing, so it is a failed read and never an empty list.
    return parseUserEntities(listed).map((entry) => {
      const localized = localizeRow(entry, ['name', 'short_name'], effectiveLocale, this.defaultLocale);
```

`localizeRow(entry, ['name', 'short_name'], …)` followed by `typeof localized.name === 'string' ? … : …` is how
a jsonb name from an RPC becomes one locale's string — the election's, the constituency's and the parent's
names take the same path.

**What is replaced** (`_getEntityUserData`, the `if (loadNominations)` branch):

```ts
      const { data: nomData, error: nomError } = await this.scopedFrom('nominations')
        .select('election_id, constituency_id, election_round, election_symbol, parent_nomination_id, entity_type, id')
        .eq(`${type}_id`, entityRow.id);

      if (nomError) throw new Error(`Failed to load nominations: ${nomError.message}`);
```

…and its tail, `nominations = { nominations: nominationsList, entities: {} } as ContestantUserData<TNominations>['nominations'];`.
The method's existing rule for the entity row — "The read answers with no row, and no error, for an entity that
is not the caller's. That is a different fact from a failed read, so it resolves with no value rather than
rejecting" (`if (!entityRow) return undefined;`) — is the model for a `NULL` answer from the new function.
**Sequencing:** [175-07 T1] rewrites `_updateEntityProperties` and adds the stored names to this method's
read; this phase edits the same method afterwards.

**Type** (`lib/api/base/dataWriter.type.ts`): today

```ts
  nominations: TNominations extends true ? DPDataType['nominations'] : undefined;
```

The reference to `DPDataType['nominations']` is cut and replaced by a list of a contestant-side type declared
in this file with a TSDoc line per member, as `UserEntity` is (`export type UserEntity = | (UserEntityBase &
{ type: 'candidate'; firstName: string; lastName: string }) | …`). `DPDataType['nominations']` itself is not
edited (RESEARCH T-1).

**Tests:** `supabaseDataWriter.test.ts`, `describe('getEntityUserData for a candidate'` and its case 'loads
nominations when loadNominations=true'; `describe('project scoping'` for the `p_project_id` argument. The
integration file runs with `CONTESTANT_WRITER_INTEGRATION_REQUIRED=1` — the `integration` row of
`175-gates.sh` ("the gated writer integration test of the frontend, against the local stack").

---

### B3 — the store: a getter for the saved nominations (store)

**Analog:** `contestantUserDataState.svelte.ts` [tree]:

```ts
  #savedEntityData = $derived(this.#savedData?.entity);
```

```ts
  get savedEntityData(): LocalizedEntityData | undefined {
    return this.#savedEntityData;
  }
```

`#savedData` is `$state<ContestantUserData<true> | undefined>(undefined)`. The class doc gives the rule for the
form: reactive members "are prototype getters read in-place (this store is NOT spread by any consumer, so
prototype getters are safe)". The new getter is the same pair over `this.#savedData?.nominations`, with its
member documented in `contestantUserDataState.type.ts`. It exists so that the task state reads **saved** data
and not `current`, which is re-cloned on every draft edit (RESEARCH § *The nominations RPC*). [175-08 T2] may
add a comparable getter for an organization's stored names ("a read-only getter is added beside
`savedEntityData`, with TSDoc in the `.type.ts` and one unit case") — the same form, and a precedent to read
from its summary.

---

### C1 — `lib/contestant/tasks/<taskState>.ts` + test (utility, transform)

**Analog:** `ENTITY/contestantHome.helpers.ts` and its test [tree]. The header is the contract to keep:

```ts
 * CALLER CONTRACT, and it is load-bearing: the caller passes ALREADY-READ scalars. The candidate context's reactive accessors must be read INSIDE the calling tracking scope and their values handed over here. Passing the context object itself would move those getter reads out of the tracking scope and freeze the page on its initial empty snapshot.
 *
 * The parameter types are STRUCTURAL on purpose. This module imports nothing at all, so a spec that exercises it loads exactly the test runner plus this file, never the page component, the candidate context or the data model.
```

**Structural literal unions in place of imports** — the form that lets a server load import the module:

```ts
/** The route names this module asks its caller's route resolver to build. Structural for the same reason as the message keys above. */
export type ContestantHomeRouteName = 'ContestantAppPreview' | 'ContestantAppProfile' | 'ContestantAppQuestions';
```

RESEARCH has the helper return route **descriptors** (a key and params) rather than built strings; this union
is where the keys are declared, and it gains `ContestantAppNominations`, `ContestantAppQuestion` and
`ContestantAppEntityHome`.

**One documented input type, one doc line per member, and "not loaded" stated once:**

```ts
  /**
   * The length of the unanswered required-info question array, or `undefined` when that array is absent.
   *
   * NOT collapsed to zero. An absent array and an empty array select DIFFERENT cases below, …
   */
  missingInfoCount: number | undefined;
```

**Defaults-then-overrides, first match wins:**

```ts
  if (profileComplete) {
    return {
      ...defaults,
      title: t('contestantApp.home.ready'),
      …
      href: resolveRoute('ContestantAppPreview')
    };
  }

  if (missingInfoCount === 0 && missingOpinionCount !== 0) {
    return {
      ...defaults,
      …
      href: resolveRoute('ContestantAppQuestions')
    };
  }

  return defaults;
```

These two `href`s are the facts behind RESEARCH T-4 / UI-SPEC U-02: home's main action goes to the questions
**list**. **Badges as data** — `computeBadges` returns `{ profile, questions }`, each `{ text, disabled } |
undefined`; the new rows' badge (a count, or `!`) is the same idea, and the greyed `disabled` form goes
(UI-SPEC S1).

**Test shape** (`contestantHome.helpers.test.ts`): a header block listing "The contract asserted below, in
full"; stub collaborators that make an expected value name its source —

```ts
function t(key: string, params?: Record<string, unknown>): string {
  if (!params) return key;
  …
  return `${key}(${rendered})`;
}

function resolveRoute(route: string): string {
  return `/route/${route}`;
}
```

an `input(overrides)` builder that defaults what a case does not care about, and a typed case table
(`type NextActionCase = { title: string; input: …; expected: … }`, `const NEXT_ACTION_CASES: Array<…> = [`).
**After 175:** [175-10 T2] has `computeNextAction` "receive the explanation's key from its caller"; [175-04 T1]
re-points message keys in this file. The module this phase replaces is that later form. Where the copy
(title, explanation, tip, button texts) lives after the replacement is the planner's (CONTEXT D-05).

---

### C2 — the "unanswered" filters as a rune-free module (utility, transform)

**Analog for the module's form:** `lib/contexts/utils/questionRollup.ts` [tree] — "a plain, synchronous,
rune-free function with no module-level mutable state", whose header notes "The rune names are written without
their leading sigil throughout this header on purpose: an acceptance scan asserts this file contains no rune".
It declares minimal structural surfaces so a plain fixture satisfies them:

```ts
/** The minimal category surface the rollup reads. The real `QuestionCategory` satisfies it structurally, and so can a plain test fixture. */
export type RollupCategory = {
  readonly id: Id;
  readonly type: QuestionCategoryType;
  appliesTo(targets: QuestionRollupTargets): boolean;
  getApplicableQuestions(targets: QuestionRollupTargets): ReadonlyArray<RollupQuestion>;
};
```

**The logic to lift** — `contestantContext.svelte.ts` [tree]:

```ts
  #requiredInfoQuestions = $derived(
    this.#infoQuestions.filter((q) => {
      const customData = getCustomData(q);
      return q.required && !customData.locked;
    })
  );

  #unansweredRequiredInfoQuestions = $derived.by(() => {
    const savedData = this.#userData.savedEntityData;
    if (!savedData) return this.#requiredInfoQuestions;
    return this.#requiredInfoQuestions.filter((q) => isEmptyValue(savedData.answers?.[q.id]?.value));
  });
```

Note the `if (!savedData) return this.#requiredInfoQuestions;` branch: with no entity loaded "the unanswered
lists hold every question" (`LogoutButton`'s own comment). The lifted function keeps or states that rule.
`isEmptyValue` is from `@openvaa/data`, `getCustomData` from `@openvaa/app-shared`.

---

### C3 — `contestantContext.svelte.ts`: `tasks`, `nextStep`, the preview fact (provider)

**Analog, same file [tree]. The accessor pair** is [175-PATTERNS § F1] (`#answersLocked` / `get
answersLocked()`), not repeated. Three more shapes this phase needs:

**A value read from page data, right on the server** — the source the UI-SPEC's *First paint* prescribes for
"has a nomination", the greeting's entity and the entity's type:

```ts
  // The user-level data, beside the store that holds the entity being edited. All three derive from `page`, so they need no push from a layout, are right on the server and on first paint, and are empty on pages outside the protected tree, whose page data holds neither key.
  #user = $derived(page.data.user ?? undefined);

  #entities = $derived<ReadonlyArray<UserEntity>>(page.data.entities ?? NO_ENTITIES);
```

`page.data.contestantUserData` is what `ENTITY/+layout.server.ts` returns (`return { questionData,
contestantUserData: userData };`), typed in `app.d.ts`. `NO_ENTITIES` — "One frozen array, so the accessor
keeps its identity from one page without a list to the next" — is the form for an empty default.

**The formula this phase re-derives:**

```ts
  #profileComplete = $derived(
    this.#unansweredRequiredInfoQuestions.length === 0 && this.#unansweredOpinionQuestions.length === 0
  );
```

True for an entity with nothing loaded (RESEARCH P-4). [175-08 T2] adds a name clause as "a third conjunct";
this phase replaces the whole formula with "every task present is `complete`" (UI-SPEC U-21) and keeps the
accessor's name.

**The effect that must write empty lists with no election** — the rollup `$effect` in the constructor,
excerpted in [175-PATTERNS § F1]. [175-08 T2] already gives it one early return ("with no type the effect
writes empty lists and blocks and returns") and writes `questionsReady` "in the same block as the lists: true
when the run had a loaded entity's type and at least one selected election, false otherwise". This phase adds
the second early return, for "no selected election" (RESEARCH T-6), in that form.

**The two election effects that change with the type** (B2):

```ts
        this.#selectedElections = removeDuplicates(
          current.nominations.nominations.map((n) => dr.getElection(n.electionId))
        );
```

`current.nominations.nominations` becomes the flat list, here and in the constituency effect below it.

**Rules:** the class doc's field-order rule ("`#userData` is declared AFTER `#answersLocked` + `#locale`
because its getter-thunks read them") — a `$derived` that reads `#userData` or the lists is declared below
them; surface members are prototype getters ("NO consumer spreads `contestantContext`"); the helper is handed
values, never `this` and never the data root (`contexts/tests/noDataRootDerivedAlias.test.ts`, named by the
research, scans for the alias). The context does not import from `routes/`, which is why C1 moves.

---

### D1 — `ENTITY/+layout.server.ts`: the sign-out removed, the read skipped (server load)

**Analog:** the file itself [tree]. What goes:

```ts
  // Stage 4: the elections and constituencies the entity is nominated in.
  const { nominations } = userData.nominations;
  …
  if (!electionId.length || !constituencyId.length) return await signOutToLogin(locals, lang, 'candidateNoNomination');
```

What must not then run with an empty list (`convertFilterValue` throws on one):

```ts
  // Awaited, so that the load returns no promise for SvelteKit to stream.
  const questionData = await dataProvider.getQuestionData({ electionId, locale: lang }).catch((e) => e);
```

**What stays, and is the form of every decision in the file:** the parent first (`const parentData = await
parent(); if (parentData.gate !== null) return {};`); "No row and a failed read are different facts at the
writer, and different outcomes here" (`.then((value) => ({ failed: false as const, value })).catch(…)`, then
`if (read.failed) return await signOutToLogin(locals, lang, 'loginFailed');` and `if (!userData)
redirect(307, appRoot);`). A `NULL` answer from the new function is the second fact (RESEARCH P-2). The
docblock's numbered stages and its sentence "This is the one place that requires a nomination" are rewritten
as a description of the load as it is; the statement "It takes `fetch`, `locals`, `params` and `parent` from
the request event and nothing else" stays true.

**Test** (`ENTITY/layout.server.test.ts` [tree]): hoisted mocks —

```ts
const { createDataProvider, createDataWriter, getEntityUserData, getQuestionData } = vi.hoisted(() => ({
  …
}));

// Hoisted because `vi.mock`'s factory is lifted above every import and cannot close over an ordinary module-scope binding.
vi.mock('$lib/api/dataWriter', () => ({ createDataWriter }));
vi.mock('$lib/api/dataProvider', () => ({ createDataProvider }));
```

— an erased event type (`type FakeEvent = { fetch; locals; params; parent }`, `const runLoad = load as unknown
as LoadFn;`), `parentWith(entities)`, `GATED_PARENT`, `entityDataFor(entity, nominations = […])` (its default
and its `{ nominations, entities: [] }` shape change with the type), and `redirectOf(loading)` — "The redirect
a load throws, or `undefined` when it resolves". The describe '… — an entity with no nomination' and its case
'signs the user out with candidateNoNomination, and reads no questions' are rewritten; the header's item 6 and
`NO_NOMINATION_ROUTE` go. 'answers a failed question read with the error itself, and signs nobody out' is the
neighbour whose form the new case takes.

---

### D2 — `ENTITY/(<group>)/+layout.server.ts` + its two tests (gate, request-response)

**Analog:** `PROT/[...page=contestantEntityPage]/+page.server.ts` [tree] — the in-tree load that takes
`params` and `parent` and nothing else, decides, and redirects through `buildRoute`:

```ts
export async function load({ params, parent }) {
  const parentData = await parent();
  if (parentData.gate !== null) return {};
  const { entities } = parentData;

  const lang = getLocale();
  const appRoot = buildRoute({ route: 'ContestantAppHome', locale: lang });

  if (entities.length !== 1) redirect(307, appRoot);
```

Imports: `import { redirect } from '@sveltejs/kit';`, `import { getLocale } from '$lib/paraglide/runtime';`,
`import { buildRoute } from '$lib/routes';`. Its docblock is the form to write: what the load decides, in
numbered stages; "The load never signs anyone out"; and "The load takes `params` and `parent` from the request
event and nothing else. It reads the `page` param alone, and no `url` property and no `route`". The redirect
target for this gate is the **entity's** home — the call in D3's analog. The proposed body is `176-RESEARCH.md`
§ *Code Examples → The two loads*.

**Tests:** `ENTITY/layout.server.test.ts` (D1) for the server test; for the read-recording test,
`ENTITY/layout.tracking.test.ts` over `PROT/loadTracking.testUtils.ts` [tree]:

```ts
import { forbiddenRoute, recordingParams, recordingUrl } from '../../loadTracking.testUtils';
```

```ts
  const event = new Proxy(
    {
      fetch: vi.fn(),
      locals: { supabase: { auth: { signOut: vi.fn() } } },
      params,
      parent: async () => ({ gate: null, user: USER, entities: [CANDIDATE] }),
      route: forbiddenRoute(),
      untrack,
      url
    },
```

The file's header lists its "Correctness invariants, each one a distinct way this file could hand back a false
pass" — each instrument has a control case at the foot of the file, and "The subject must be the REAL load, run
to its end". Copy the invariants with the cases; the relative import path gains one `../` per directory level.

---

### D3 — `ENTITY/(<group>)/preview/+page.server.ts` + its two tests (leaf gate)

**Analog:** `PROT/+page.server.ts` [tree] — the Contestant App's one page-level server load under the
protected tree, and it already redirects to `ContestantAppEntityHome`:

```ts
export async function load({ parent }): Promise<{ view?: 'nothingToEdit' | 'select' }> {
  const parentData = await parent();
  if (parentData.gate !== null) return {};
  const { entities } = parentData;

  if (entities.length === 1) {
    const [{ type, id }] = entities;
    redirect(
      307,
      buildRoute({
        route: 'ContestantAppEntityHome',
        locale: getLocale(),
        entityType: type,
        entityId: id
      })
    );
  }
```

**Tests:** `PROT/page.server.test.ts` [tree] — "The fake locals carry a sign-out spy the load has no reason to
reach: every case asserts it was never called"; `GATED_PARENT`; `makeEvent(parent)`. And
`PROT/page.tracking.test.ts` for the read-recording twin. **What differs:** this load also reads data (S1 of
RESEARCH RQ-1 (b) needs `fetch` and `locals`), so its "takes … and nothing else" sentence lists four members
as `ENTITY/+layout.server.ts`'s does, and its provider is built as that load builds one — `const dataProvider
= createDataProvider({ fetch, locals });`, "This request's own provider instance, built over the same
cookie-bearing client".

---

### D4 — the route move: `route.ts`, the matcher, the resolver (config)

**`lib/routes/route.ts` [tree]:**

```ts
  ContestantAppPreview: `${CONTESTANT_ENTITY}/preview`,
  ContestantAppPrivacy: `${CONTESTANT}/privacy`,
  ContestantAppProfile: `${CONTESTANT_ENTITY}/profile`,
  ContestantAppQuestion: `${CONTESTANT_ENTITY}/questions/[questionId]`,
  ContestantAppQuestions: `${CONTESTANT_ENTITY}/questions`,
  …
  ContestantAppSettings: `${CONTESTANT_ENTITY}/settings`,
```

Four values gain the group's segment; `ContestantAppNominations: \`${CONTESTANT_ENTITY}/nominations\`` joins
without it, as `ContestantAppSettings` is. A member's doc comment has the form of `ContestantAppEntityHome`'s
("The home of the entity being edited. …"). The voter side shows a group constant held once and reused
(`${VOTER_LOCATED}/…`) — the model for a constant naming the gate group. `isProtectedRoute` is
`routeId.split('/').includes(PROTECTED_GROUP)`, so the new group must not be named `(protected)`.

**`lib/routes/routeConsistency.test.ts` [tree]** binds the move: "**C1.** Every addressable page directory
inside a protected group has at least one `ROUTE` entry that addresses it or something below it" and "**C2.**
Every `ROUTE` value carrying the group segment names a directory that exists on disk". The `git mv` of three
directories, the four values and the new key are one commit (RESEARCH P-11). `lib/routes/route.test.ts` holds
one literal — `'/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/profile'` in the
`isApiRoute` negative list — updated for truth.

**`params/contestantEntityPage.ts` [tree]:** `const SINGLE_SEGMENT_PAGES: ReadonlyArray<string> = ['profile',
'questions', 'preview', 'settings'];` and the bullet list in `match`'s doc ("Accept-set is exactly the entity
sub-paths the app has"). **Resolver:** the `SINGLE_SEGMENT_ROUTES` map (`['settings',
'ContestantAppSettings']`). `nominations` joins both lists, the doc's bullets, and the two tests' tables
(`['settings', true]` in `contestantEntityPage.test.ts`).

---

### D5 — `questions/+layout.svelte`: the redirect and the render condition leave together (layout)

**Today [tree]** the file holds both halves of the withdrawn rule:

```ts
  $effect(() => {
    if (ctx.unansweredRequiredInfoQuestions.length) {
      goto(getRoute.current('ContestantAppProfile'));
    }
  });
```

```svelte
{#if ctx.unansweredRequiredInfoQuestions.length === 0 && ctx.opinionQuestions.length > 0}
  {@render children?.()}
{:else}
```

**The file this phase edits is [175-10 T2]'s**: "Three states decided by `ctx.questionsReady` and
`ctx.opinionQuestions.length` … ready with some renders the children once no required info is unanswered and
`Loading` until then. The redirect effect requests the profile only when the data is ready, questions exist
and required info is unanswered." Both of those clauses go: ready with some renders the children, full stop.
Its component test, `questions/layout.svelte.test.ts` ("mounting the real layout with a fake context and a
marker child"), has the case "Loaded, opinion questions present, required info unanswered: the loading view,
and the redirect to the profile is requested" — rewritten to assert the children and no `goto`, not extended.
The `@component` docstring's line "Redirects to the basic info page if required basic info has not been filled
out" goes with the code. Fallback for the three-state shape: [175-PATTERNS § H2].

---

### D6 — the dead error codes (utility / test)

`lib/contestant/utils/loginError.ts` [tree]:

```ts
const CONTESTANT_LOGIN_ERROR: Record<ContestantLoginError, TranslationKey> = {
  candidateNoNomination: 'contestantApp.error.candidateNoNomination',
  loginFailed: 'error.loginFailed',
  nominationNoElection: 'contestantApp.error.nominationNoElection'
} as const;
```

and the union `'candidateNoNomination' | 'loginFailed' | 'nominationNoElection'`; both shrink to `loginFailed`.
`lib/server/contestant/signOutToLogin.test.ts` has `it.each([['loginFailed'], ['candidateNoNomination']] as
const)(`. The two catalogue keys are removed in seven locales in the task that owns the catalogues (E6).
[175-04 T1] rewords both messages in place first.

---

### E1 — `NotEditableNote` and its test (component)

**Analog for composing `ContactSupport` in a contestant component, with a co-located type and barrel:**
`lib/contestant/components/nothingToEdit/` [tree].

```ts
  import { ContactSupport } from '$contestant/components/contactSupport';
  import { LogoutButton } from '$contestant/components/logoutButton';
  import { MainContent } from '$layouts/main';
  import { getContestantContext } from '$lib/contexts/contestant';
  import type { NothingToEditProps } from './NothingToEdit.type';

  let { title, children }: NothingToEditProps = $props();
```

```ts
export type NothingToEditProps = {
  /**
   * The page title. @default t('contestantApp.nothingToEdit.title')
   */
  title?: string;
  /**
   * Replaces the default explanation, e.g. to give another reason the user has nothing to edit.
   */
  children?: Snippet;
};
```

```ts
export { default as NothingToEdit } from './NothingToEdit.svelte';
export * from './NothingToEdit.type';
```

The `@component` docstring's sections, in order: one sentence, `### Dynamic component` ("Accesses
`ContestantContext`."), `### Properties`, `### Accessibility` where there is something to say, `### Usage`
with a `tsx` block.

**Analog for the root it wraps:** `lib/components/warning/Warning.svelte` [tree] — rest props merged onto the
root with `concatClass`, so `data-testid`, `data-reason` and a class passed by the caller land on the note's
root:

```svelte
<div {...concatClass(restProps, 'flex items-start gap-6 text-warning')}>
  <div>
    <Icon name="warning" />
  </div>
  <div class="flex-grow text-left">
    {@render children?.()}
  </div>
</div>
```

`WarningProps` is `SvelteHTMLElements['div'] & { children?: Snippet }` — the base of the UI-SPEC's
`NotEditableNoteProps = WarningProps & { reason; children? }`. The note's proposed markup is UI-SPEC § S5.

**The four call sites it replaces** share one shape [tree] (home, `ENTITY/+page.svelte`):

```svelte
    {#if answersLocked}
      <Warning data-testid="contestant-answers-locked-warning">
        {t('contestantApp.common.editingNotAllowed')}
        {#if hiddenForMissingAnswers}
          {t('contestantApp.common.isHiddenBecauseMissing')}
        {/if}
      </Warning>
    {/if}
```

The questions list's (`questions/+page.svelte`) is the one with **no** test id: `<Warning>` directly under
`{#if contestantCtx.answersLocked}`, with the long inline condition on `hideIfMissingAnswers?.candidate` that
[175-10 T2] turns into the descriptor's key. The question page's is `<Warning
data-testid="contestant-answers-locked-warning">` with no second sentence; the same file's `errorMessage =
t('contestantApp.common.editingNotAllowed');` in `setAnswer` is an `ErrorMessage` and is left alone.

**Test analog:** `ContactSupport.svelte.test.ts` [tree] — a fake context through `vi.mock`, the real component
mounted, DOM assertions:

```ts
vi.mock('$lib/contexts/contestant', () => ({
  getContestantContext: () => ({
    t: (key: string) => key,
    getRoute: { current: (options: RouteOptions) => buildRoute(options, { params: {} }) },
    appSettings: { admin: { email: SUPPORT_EMAIL }, contestantApp: { entityTypes: ['candidate'] } }
  })
}));

vi.mock('$lib/contexts/component', () => ({
  getComponentContext: () => ({ t: (key: string) => key, darkMode: { current: false } })
}));

const { ContactSupport, SUPPORT_ANCHOR } = await import('.');
```

with `render(props)` (`mount` + `flushSync`, a `teardown` array emptied in `afterEach`), a snippet prop built
by `createRawSnippet(() => ({ render: () => '<p data-testid="lead-in">…</p>' }))`, order asserted with
`compareDocumentPosition(…) & Node.DOCUMENT_POSITION_FOLLOWING`, and 'merges the caller’s class and attributes
into its root'. The note's cases — one sentence per reason, the second sentence after it, exactly one
`[data-testid="contestant-contact-support"]`, the test id on the root — take those forms.

---

### E2 — `ContactSupport`: the `iconPos` prop (component)

**Analog:** the `variant` prop of the same component [tree] — declared with a default marker, destructured
with its default, forwarded to both buttons:

```ts
  /**
   * The variant of the button. @default 'prominent'
   */
  variant?: ButtonProps['variant'];
```

```ts
  let { children, action = 'help', variant = 'prominent', ...restProps }: ContactSupportProps = $props();
```

```svelte
    <Button
      href={helpLink}
      {variant}
      icon="help"
      text={t('contestantApp.common.contactSupport')}
      data-testid="contestant-contact-support" />
```

**What differs:** `iconPos` has no default of the block's own — it is "forwarded to both of the block's
buttons only when set" (UI-SPEC § S5), so the Help page and `NothingToEdit` render as today. The `@component`
docstring's `### Properties` list gains a line; the test gains a case in the form of 'links to the support
section of the Help page by default'.

---

### E3 — `ContestantNav`: a new item, closed items, the reason line (component)

**Analog:** the file itself [tree]. An item, inside `{#if contestantCtx.selectedEntity}`:

```svelte
        <NavItem
          href={getRoute.current('ContestantAppProfile')}
          icon="profile"
          text={t('contestantApp.basicInfo.title')}
          data-testid="contestant-nav-profile" />
```

The rule being replaced, and its greyed badge:

```svelte
          disabled={contestantCtx.unansweredRequiredInfoQuestions?.length !== 0}
          data-testid="contestant-nav-questions">
          {#if contestantCtx.unansweredRequiredInfoQuestions && … && contestantCtx.unansweredOpinionQuestions.length > 0}
            <InfoBadge
              text={String(contestantCtx.unansweredOpinionQuestions.length)}
              disabled={contestantCtx.unansweredRequiredInfoQuestions.length !== 0}
              classes="-left-8 -top-4" />
          {/if}
```

The preview item carries no `disabled` today. A value derived inside the tracking scope from accessors read on
the context is `entityTitle` (`const entityTitle = $derived.by(() => { const selected =
contestantCtx.selectedEntity; … })`) — the form for the menu's closed/reason derivation. The `@component`
docstring's `### What the menu shows` bullets are rewritten with the items. [175-10 T2] changes the questions
item first: "left out only when the data is ready and holds no opinion question; it is absent, not disabled".
**No in-tree precedent** for passing `role="link"`, `aria-describedby` and a dimming class through `NavItem`'s
rest props: the UI-SPEC § S3 table is the specification (its `[tree]` quote of `NavItem.svelte`,
`{...concatClass(restProps, classes)}`, was not re-read here).

**Test** (`ContestantNav.svelte.test.ts` [tree]): hoisted mutable state behind getters, so a case sets the
page before mounting —

```ts
const state = vi.hoisted(() => ({
  isAuthenticated: false,
  params: {} as Record<string, string>,
  selectedEntity: undefined as object | undefined,
  entities: [] as Array<object>
}));
```

— and routes built by the real `buildRoute` from `state.params` ("A link into the entity pages built without
the two entity params therefore throws here as it does in the app"). The fake context's fixed
`unansweredRequiredInfoQuestions: []`, `unansweredOpinionQuestions: []` are replaced by task-state members
behind getters. The describe '… — signed in on a page whose URL names an entity the user edits' asserts "the
five items are present in their order, each linking below that entity" — six after this phase.

---

### E4 — `LogoutButton`: the rule reads the task state (component)

**Analog:** `triggerLogout` in the file [tree]:

```ts
  async function triggerLogout() {
    // Data can be missing only from an entity that is loaded: without one, the unanswered lists hold every question.
    if (
      userData.savedEntityData &&
      !contestantCtx.answersLocked &&
      (contestantCtx.unansweredOpinionQuestions?.length !== 0 ||
        contestantCtx.unansweredRequiredInfoQuestions?.length !== 0)
    ) {
      timedModalRef?.openModal();
    } else {
      await logout();
    }
  }
```

The first conjunct stays (CONTEXT D-20, R10); the third becomes a read of `contestantCtx.tasks` (UI-SPEC § S8).
The modal's body — the two `{#if}` arms over the same two lists — is unchanged.
**Test** (`LogoutButton.svelte.test.ts` [tree]): the fake context's values are rune state behind getters —

```ts
const state = $state<{
  savedEntityData: { answers: Record<string, unknown> } | undefined;
  answersLocked: boolean;
  unansweredOpinionQuestions: Array<{ id: string }>;
  unansweredRequiredInfoQuestions: Array<{ id: string }>;
}>({ … });
```

— "as the real accessors are"; cases 'logs out at once and opens no modal, although every question counts as
unanswered', 'opens the modal and does not log out while a question is unanswered', 'logs out at once when
nothing is unanswered', 'logs out at once when answers are locked'. New cases: a blocked task, the nomination
alone, a profile lacking only its name — each "logs out at once". The file's `window.matchMedia` stub goes
with any test that imports the modal.

---

### E5 — the home page, J, and the five Continue sites (route pages)

**Home, `ENTITY/+page.svelte` [tree].** Context reads in the house form (`const { getRoute, t, userData } =
contestantCtx;`, accessors read on `contestantCtx`), then the three hard-coded buttons this phase turns into
rows:

```svelte
    <Button
      text={nextAction.buttonTextBasicInfo}
      icon="profile"
      iconPos="left"
      href={getRoute.current('ContestantAppProfile')}
      data-testid="contestant-home-profile">
      {#snippet badge()}
        {#if badges.profile}
          <InfoBadge text={badges.profile.text} disabled={badges.profile.disabled} />
        {/if}
      {/snippet}
    </Button>
```

and the main action with the logout button under it:

```svelte
  {#snippet primaryActions()}
    <div class="flex w-full flex-col items-center justify-center">
      <Button
        variant="main"
        text={nextAction.buttonTextPrimaryActions}
        icon="next"
        href={nextAction.href}
        data-testid="contestant-home-continue" />
      <LogoutButton variant="normal" icon={undefined} data-testid="contestant-home-logout" />
    </div>
  {/snippet}
```

The greeting's fallback the UI-SPEC rules out where page data holds the entity: `username: entityName || '?'`,
with `entityName` read from `userData.current?.entity`. [175-10 T2] leaves the page reading
`entityDescriptorOf(contestantCtx.selectedEntity?.type)` for the explanation key and the greeting's name. The
markup to build is UI-SPEC § S2.

**J, `ENTITY/nominations/+page.svelte` (NEW).** No in-tree page renders raw rows as cards; the parts:

- *Frame and a label–value pair that wraps* — `NothingToEdit.svelte` [tree]:

  ```svelte
      <dl class="my-lg text-center">
        <dt class="small-label">{t('contestantApp.nothingToEdit.signedInAs')}</dt>
        <dd
          class="font-bold [overflow-wrap:anywhere] hyphens-none"
          translate="no"
          data-testid="contestant-nothing-to-edit-email">
  ```

  and `ContactSupport` in a `MainContent` snippet (`<ContactSupport variant="main" />` in `primaryActions`; J
  puts the default form in the body).
- *A shaded background pushed for one state only* — `PROT/+page.svelte` [tree]:

  ```ts
    // The shaded background belongs to the selection view alone, so the overlay is pushed while that view is shown and reverted with it.
    $effect(() => {
      if (data.view === 'select') return pageStyles.push({ drawer: { background: 'bg-base-300' } });
    });
  ```

  (the profile page's unconditional form is `pageStyles.use({ drawer: { background: 'bg-base-200' } });`).
- *What it must not copy* — the profile block's `parseNomination`, whose `try` calls
  `contestantCtx.dataRoot.getElection(nomination.electionId)` and whose `catch` logs `Error formatting
  nomination` (RESEARCH RQ-4), and its `{@const { election, constituency, organization, electionSymbol,
  unconfirmed } = parseNomination(nomination)}` inside an `{#each}`.

The page test's analog is `PROT/page.svelte.test.ts` (a route page mounted against a fake context); read it
at planning — only its existence and role were confirmed here.

**The five sites [tree]:**

| Site | Anchor today |
|---|---|
| Home | `href={nextAction.href}` on `contestant-home-continue` |
| Profile | `let submitRouting = $derived.by(() => { if (allRequiredFilled && contestantCtx.unansweredOpinionQuestions.length && !contestantCtx.answersLocked) { return { submitRoute: getRoute.current('ContestantAppQuestions'), submitLabel: userData.hasUnsaved ? t('common.saveAndContinue') : t('common.continue') …`, read by `goto(submitRouting.submitRoute);` after the save; `allRequiredFilled` is computed over `userData.current` (the draft) |
| Questions list | the two `Button`s with `data-testid="contestant-questions-start"` and `"contestant-questions-continue"`, each `href={getRoute.current({ route: 'ContestantAppQuestion', questionId: … })}` |
| Question page | `getNextQuestionId` (below), `getIsLastUnanswered`, `submitRouting` with three arms — the next question, `ContestantAppEntityHome`, `ContestantAppQuestions` |
| J | new |

The landmine, verbatim from `questions/[questionId]/+page.svelte`:

```ts
   * `findIndex` returning -1 is the NORMAL state here, not an edge case: … The -1 fall-through (`[-1 + 1] === [0]`) makes "Save & continue" resume at the FIRST unanswered question — both after a normal save and when re-editing an already-answered question. Do not "fix" -1 to return undefined: that reroutes every save to the questions list.
   */
  function getNextQuestionId(question: AnyQuestionVariant): Id | undefined {
    const index = unansweredOpinionQuestions.findIndex((q) => q.id === question.id);
    return index < unansweredOpinionQuestions.length - 1 ? unansweredOpinionQuestions[index + 1]?.id : undefined;
  }
```

The save-then-navigate form both saving pages share (target read after a successful save; a failure chooses
none) is [175-PATTERNS § H1, *The one save and its one failure surface*]. The profile page is rewritten by
[175-09 T2–T3] before this phase touches it; its nominations block and `parseNomination` are "left in place"
there for this phase to remove.

---

### E6 — the catalogues (config)

**Analog for a new namespace file:** `apps/frontend/messages/en/contestantApp.home.json` [tree] — the file's
one top-level key is its own namespace:

```json
{
  "contestantApp.home": {
    "basicInfo": {
      "edit": "Edit your basic information",
      "enter": "Enter your basic information",
      "view": "View your basic information"
    },
```

`contestantApp.nominations.json` in each of the seven locale directories opens with `"contestantApp.nominations"`.
The home file's `basicInfo` / `questions` triples are the form of `nomination: { enter, view }`.
**Analog for a plural message** (`contestantApp.home.taskStatus.incompleteCount`):
`contestantApp.questions.unansweredWarning` in `messages/en/contestantApp.questions.json`, an array holding
`"declarations": ["input numUnansweredQuestions", "local numUnansweredQuestionsPlural = numUnansweredQuestions:
plural"]` — copy the whole entry's structure from the file. **Per-type keys:** [175-PATTERNS § I1].
`scripts/assert-i18n-catalog-namespaces.mjs` holds a floor for the `contestantApp.*` bucket and two keys that
must resolve; removing seven keys does not approach the floor (60). One task owns every key (UI-SPEC,
RESEARCH P-15), followed by `yarn workspace @openvaa/frontend generate:translation-key-type`.

---

### F1 — the dataset: template, data module, setup, teardown, config trio

All five are mapped by `175-PATTERNS.md` (§ B4, § J1, § J2, § J3) and built by [175-05 T1–T2] in the shape
this phase copies. Only what differs is stated here.

- **The template is hand-authored, not `buildMinimal`.** `perm-missing-nominations.ts` [tree] shows the
  helper's reach — `buildMinimal({ externalIdPrefix: P, elections: 2, candidates: 1, organizations: 1, …,
  nominationsInElectionIndices: [0] })` — it withholds an *election's* nominations, not an entity's. The
  in-tree rows of an entity **with no nomination** are in `packages/dev-seed/src/templates/e2e/base.ts`:
  `test-e2e-base-or-invitation` and `test-e2e-base-ca-invitation`, each under a comment that begins "…It is
  seeded unconfirmed and has no nomination, so it can never be public". Whether a template whose entities have
  no nomination row at all passes the pipeline is RESEARCH A6 — a dry run in dev-seed's unit suite, first task.
- **Both types served.** `MINIMAL_BASE_APP_SETTINGS` (`perm/shared.ts` [tree]) has `entityTypes:
  ['candidate']` under "The whole contestant app root" and `access: { contestantApp: true, voterApp: true,
  adminApp: true, underMaintenance: false, answersLocked: false }`. The template spreads the base and restates
  `contestantApp` with the list whole, as `perm-org-matching.ts` restates `matching` [175-PATTERNS § B4];
  `access.nominationsLocked` is a schema key only after [175-08 T1] (the `access` object is strict).
- **Prefix.** A plain top-level `const PREFIX = '…'` in the teardown, parsed by the config's guard; it must
  start with `e2e-perm-` and be neither a prefix of, nor prefixed by, any other teardown's — which after
  [175-05] includes `e2e-perm-organization-editing-`. RESEARCH P-13 checked `e2e-perm-no-nomination-` against
  today's set (`e2e-perm-no-allowopen-` shares its first eleven characters and is not a prefix of it).
- **Sessions.** One `registerAndStoreSession` call per identity with `entityGrants`, as
  `tests/tests/setup/contestant/entity-selection.setup.ts` does [175-PATTERNS § J1]. `settledTestId:
  testIds.contestant.home.statusMessage` still settles a no-nomination user: UI-SPEC § S2 keeps
  `contestant-home-status` on the real explanation, which H1 renders on the server.
- **The chain edge.** Today `data-setup-perm-analytics-tracking` has `dependencies: ['perm-org-matching']`;
  [175-05 T2] re-points it to `perm-organization-editing`. This phase's setup depends on whichever spec is
  then last before `data-setup-perm-analytics-tracking`, and that setup is re-pointed to the new spec. Read
  the config after 175 closes; the diagram comment and the closing docblock gain the link.

---

### F2 — fixtures (page objects and the composition root)

**`contestantNominationsPage.fixture.ts` (NEW) — analog:**
`tests/tests/fixtures/contestant/contestantNothingToEditPage.fixture.ts` [tree], whole file. Its header lists
the surface one step per line and ends with the rigidity contract; the body is a factory over a page:

```ts
export function createContestantNothingToEditPage(page: Page) {
  const container = page.getByTestId(testIds.contestant.nothingToEdit.container);

  return {
    /**
     * Navigate to the app root and wait for the view.
     */
    async open(): Promise<void> {
      await page.goto(buildRoute({ route: 'ContestantAppHome', locale: 'en' }));
      await this.expectShown();
    },
    …
    async expectSupportButton(): Promise<void> {
      await expect(container.getByTestId(testIds.contestant.common.contactSupport)).toBeVisible();
    },
```

```ts
export type ContestantNothingToEditPageFixture = ReturnType<typeof createContestantNothingToEditPage>;
```

Locators scoped under the page's container; ids from `testIds` only; `buildRoute` from
`tests/tests/utils/buildRoute`; URL assertions through `tests/tests/utils/contestantEntityUrl`. State is read
from the attributes UI-SPEC's *Locator Contract* puts on the page (`data-nominations-state`,
`data-nominations-locked`, `data-confirmed`, `data-action`), not from text.

**`contestantHomePage.fixture.ts` — the step that changes [tree]:**

```ts
export type ContestantHomeTask = 'profile' | 'opinions' | 'preview';
```

```ts
    async expectTasks(spec: {
      enabled: Array<ContestantHomeTask>;
      disabled: Array<ContestantHomeTask>;
    }): Promise<void> {
      for (const task of spec.enabled) {
        await expect.soft(page.getByTestId(TASK_TESTIDS[task])).toBeEnabled();
      }
```

`TASK_TESTIDS` maps `'opinions'` to `testIds.contestant.home.questions` and holds two raw literals
(`'contestant-home-profile'`, `'contestant-home-preview'`) that the UI-SPEC registers; `clickContinue` reads
the literal `'contestant-home-continue'`. The file's header states its soft-assertion count ("4 call sites") —
it is updated with the step. [175-05 T2] adds a **second** home fixture, `contestantEntityHomePage.fixture.ts`
(`open(entity)`, `expectLanded({ entityType })`); which of the two owns the task steps is the planner's.

**The composition root** — `tests/tests/fixtures/contestant/contestant-entity-selection.ts` [tree]: a header
listing `Surface:` and `Fixtures:`, `import { expect, test as base } from '@playwright/test';`, one `create…`
import per page fixture with its type, `SupabaseAdminClient` for an `adminClient` fixture, and an exported
interface for what the spec addresses (`export interface SelectionEntity { entityType: 'candidate' |
'organization'; id: string; name: string; }`).

**`navMenu.fixture.ts`** [tree]: an interface `NavMenuFixture` with a method per step (`openMobileNav`,
`expectNavMenuItems`, `expectEntityGroupTitle`, `expectSwitchEntityItem`, `expectNoSwitchEntityItem`,
`switchEntity`) and `createNavMenu(page)`. The closed-items step is declared on the interface and implemented
in that pair's form. **`testIds.ts`** [tree]: the `contestant.nothingToEdit` block — each id under a comment
saying which element carries it; the `profile.nominations` entry and the two-line comment above it leave.

---

### F3 — the spec (E2E)

The frame (session per `describe`, hard assertions, test ids only, fixtures before specs) is
[175-PATTERNS § J4]. Three more analogs on today's tree:

**A project-wide `access.*` flip and its restore** — `tests/tests/specs/perm/perm-access-disable.spec.ts`:

```ts
  test.afterAll(async () => {
    // Restore the seed's shipped base posture so the singleton is clean for any downstream perm node (the per-app-notifications node re-points here).
    if (client) {
      await client.updateAppSettings({
        access: { voterApp: false, contestantApp: true, underMaintenance: false }
      });
    }
  });
```

and, in a test, the flip followed by a full load (`await client.updateAppSettings({ access: { … } });` then
`await page.goto('/en');`). Here one key is sent — `{ access: { nominationsLocked: true } }` — and the
UI-SPEC asks for the restore in a `finally` before the next test reads the setting; `afterAll` is the
belt beside it.

**An insert from a spec through the inherited `bulkImport`** — `tests/tests/specs/storage/storage-cleanup.spec.ts`:

```ts
  await client.bulkImport({
    candidates: [
      { external_id: externalId, project_id: SCRATCH_PROJECT_ID, first_name: 'Storage', last_name: 'Cleanup' }
    ]
  });
```

(that spec states `project_id` because it writes to a scratch project; this one uses the suite's). The
nomination row's references are by `external_id`, in the template form — `candidate: { external_id: … },
election: { external_id: … }, constituency: { external_id: … }, election_round: 1` [175-PATTERNS § B4] — with
`confirmed: false` stated (RESEARCH RQ-3: the admin client stamps `confirmed = true` on a row that does not
state it).

**Confirming a nomination from a test** — `tests/tests/fixtures/shared/invitationFlow.fixture.ts`:
`const found = await admin.findData('nominations', { [nominationColumn]: { $eq: entityId } });` then
`await admin.update('nominations', nomination.id, { confirmed: … });`.

**Phone-width steps:** `pageGeometry.fixture.ts` from [175-12 T3] (`expectNoHorizontalOverflow()`,
`expectInside(inner, outer)`, `expectNoOverlap(a, b)`, `expectAtLeast(…)`). Fallback on today's tree: the poll
in `tests/tests/fixtures/contestant/contestantTermsOfUsePage.fixture.ts` — `.poll(() => page.evaluate(() =>
document.documentElement.scrollWidth - document.documentElement.clientWidth), {`.

---

### F4 — the journey spec: every `expectTasks(` caller (E2E)

Derived by search at `d33eccbca`: four callers, all in `tests/tests/specs/contestant/contestant-journey.spec.ts`,
inside these steps (cited by title):

| Step | Passes today | Must assert |
|---|---|---|
| '6. home: three tasks with profile-active' | `enabled: ['profile'], disabled: ['opinions', 'preview']` | nomination complete; profile and opinions open; preview closed |
| '11. home: three tasks profile-active (unchanged after re-login)' | the same | the same |
| '13. profile: portrait errors + valid upload + fill info except required + first + submit' (its closing assertion) | the same | the same |
| '19. walk remaining opinion questions → home shows completed + preview enabled' | `enabled: ['profile', 'opinions', 'preview'], disabled: []` | three complete tasks; preview open |

Also in that file: step '12. profile: static info + filtered questions partition + required badge' (its
`expectStaticInfo({ nomination })` half moves to J's fixture — the profile fixture's
`ProfileNominationExpectations` interface and the `toHaveValue` reads go with it); step '19.5. candidate
nav-menu logged-in item set (differs from logged-out)' (gains `contestant-nav-nominations`); steps '14. …
submit → questions overview' and '15. questions overview: intro message + clickStart → first opinion question'
keep asserting the list (UI-SPEC U-02); step '22. final logout: no dialog → /contestant/login' is D-20's
proof. **Re-derive the population by search when the plan runs** — the step titles themselves ("three tasks")
are rewritten with the assertions.

---

### F5 — the axe entries (a11y)

**The entry table [tree]** — `CONTESTANT_AXE_ROUTES` in `tests/tests/specs/a11y/contestant-a11y.spec.ts`:

```ts
    name: 'cand-profile',
    fixture: 'raw',
    routeId: 'ContestantAppProfile',
    contentTestId: testIds.contestant.profile.infoItem,
    postLoginTestId: testIds.contestant.profile.nominations
  },
```

`postLoginTestId` here is the block this phase removes (RESEARCH T-9); the replacement marker,
`contestant-profile-identity`, is registered by [175-05 T1]. `cand-home` is `routeId: 'ContestantAppHome',
contentTestId: testIds.contestant.home.statusMessage, postLoginTestId: testIds.contestant.home.logout`; an
entry with a `reach` step is `cand-questions`. `cand-nominations` joins this table with `routeId:
'ContestantAppNominations'` — `declareScans` opens `buildEntityLessRoute({ route: entry.routeId, locale: 'en'
})`, so D4's resolver entry must exist first.

**The helpers** (`ContestantAxeRoute`, `toScanEntry`, `declareScans`, the session-per-table `describe`) are
excerpted in [175-PATTERNS § J5] as module-private to that spec. [175-12 T1] moves them to
`tests/tests/utils/contestantAxeScan.ts` as named exports — "`export function toScanEntry` and `export
function declareScans`" — "Their bodies are moved, not rewritten". The new spec's six entries import from that
module; "An entry that must be somewhere the entity-less route does not lead navigates in its `reach`". A
`reach` "begins by setting the state through the state steps …, then reloads or navigates" [175-12 T3] — the
form for the lock-on entries.

**The wiring gate** — `scripts/assert-a11y-scan-wiring.mjs` [tree], "Check 4a: neither spec constructs its own
AxeBuilder / withTags", over the list `['a11y-smoke.spec.ts', a11ySmokeSrc], ['contestant-a11y.spec.ts',
contestantA11ySrc]`, each source read by `readSource(…)`. [175-12 T1] adds the module and its own spec; this
phase adds its spec in the same form. Check 3 ("`contestant-a11y-scan` named in data-setup-perm-1e1cg1co
dependencies") is why six of the seven entries live in the new project; the scan project's own
`dependencies: ['data-setup-base', 'auth-setup', 'data-setup-entity-selection']` must not gain the new setup.

---

### G1 — `176-gates.sh`, `176-e2e.sh`, `176-verdict.mjs` (drivers)

**Analog:** the three Phase 175 drivers, on the tree since `cfb0be608` [tree] — one phase newer than the 174
files that [175-PATTERNS § K1–K3] excerpt, and already carrying what that map called this phase's additions:

- `175-gates.sh` has the `integration` row — "the gated writer integration test of the frontend, against the
  local stack", dispatched as `integration) run_gate integration gate_integration ;;` — after the database
  rows (`db-reset`, `types-regen`, `types-clean`, `pgtap`, `sql-lint`), then `unit`, `check-frontend`, `build`,
  `format`, `docs-links`, `name-gate-self-test`.
- `175-verdict.mjs` has `e2e <label> [--allow-slice] [--same-projects-as <label-or-path> [--except
  <project>=<delta>]...] [--expect-project <name>]... [--expect-title-count <project>::<substring>=<n>]...`,
  plus `control` and `determinism <ledger-dir> --project <name> --runs <n>` sub-commands ([175-01 T1]).

**What to copy:** the files whole, re-pointing `SELF`, the phase directory and the run directory
(`tests/e2e-runs/176-e2e/<label>`). The closing `e2e` call states `--except contestant-a11y-scan=2` (22 → 24)
and expects the new project; the two determinism batches are the new spec and `contestant-journey`, three runs
each (CONTEXT D-22). The row runner, the Node selection, the clean-tree refusal, the fixed order of the
database rows, the power block and the VOID rule are [175-PATTERNS § K1–K3] and are not repeated.

## Shared Patterns

### Context reactivity (every `.svelte` file and the context class)

[175-PATTERNS § Shared → *Context reactivity*]. This phase adds `tasks`, `nextStep` and the preview fact to
the accessors read as `contestantCtx.X` and never destructured. Both are value-replacing (a fresh list and a
fresh object per recompute), so `const tasks = $derived(contestantCtx.tasks)` in a page is a safe read alias —
the home page's `const answersLocked = $derived(contestantCtx.answersLocked);` is the in-tree form. `dataRoot`
is never aliased. Load `Skill("components")` before editing a component.

### A contestant server load (the entity load, the group gate, the preview gate, the resolver)

**Source:** `ENTITY/+layout.server.ts`, `PROT/+page.server.ts`, `PROT/[...page=contestantEntityPage]/+page.server.ts`.

```ts
  const parentData = await parent();
  if (parentData.gate !== null) return {};
```

Then: params read by name and no others; no `url` property and no `route`; every target built by
`buildRoute({ route, locale: getLocale(), entityType, entityId })`; `redirect(307, …)`; nobody signed out over
a refusal; a docblock that lists the stages and ends with what the load takes from the event. Beside each
load: a `*.server.test.ts` with an erased `FakeEvent` type and a `*.tracking.test.ts` on
`PROT/loadTracking.testUtils.ts`, with a control case per instrument.

### A pure helper receives values (the task state, the "unanswered" filters, the server's inputs)

**Source:** the header of `ENTITY/contestantHome.helpers.ts` (C1) and of `lib/contexts/utils/questionRollup.ts`
(C2). No import that pulls in a component, a context or `$app/*`; structural parameter types; fresh return
objects; a colocated table-driven test whose stubs make an expected value name its source.

### A definer function answers `NULL`, and a refusal is not an empty list (schema, parser, writer, load)

**Source:** `get_entity_basic_data`'s header — "Returns NULL -- never raises -- when the caller lacks the
permission, when the type is NULL, or when the named table holds no row with that id, so the answer does not
distinguish 'does not exist' from 'not yours'" — and, three layers up, the writer's "That is a different fact
from a failed read, so it resolves with no value rather than rejecting" and the load's `if (!userData)
redirect(307, appRoot);`. `NULL` → not found; `[]` → no nomination; malformed → a thrown, failed read.

### A contestant component (the note, `ContactSupport`)

**Source:** `lib/contestant/components/nothingToEdit/` and `contactSupport/`. A directory per component:
`<Name>.svelte` with an `@component` docstring, `<Name>.type.ts` with a doc block and a default marker on
every optional member, `index.ts` re-exporting both, `<Name>.svelte.test.ts` mounting the real component
against a `vi.mock`ed context. Rest props reach the root through `concatClass`. Imports use `$contestant/…`
for the contestant library and `$lib/…` for the rest. After a change: the docstring, then `yarn workspace
@openvaa/docs generate:docs`.

### pgTAP, schema regeneration, E2E discipline, comment hygiene

[175-PATTERNS § Shared], unchanged: every deny has a paired allow; `yarn schema:regenerate` in the schema
commit and `yarn db:types` on a freshly reset database before pgTAP; fixtures before specs, test ids through
`tests/tests/utils/testIds.ts`, hard assertions, one project; comments describe the code as it is. Several
excerpts above carry requirement ids or phase references in their comments (`REVIEW-RT-04`, "see phase 159",
`CSCAN-02b`) — copy the code shape, not those references.

## No Analog Found

| File | Role | Data Flow | Reason |
|---|---|---|---|
| `lib/server/contestant/<previewInputs>.ts` and its parity test | service (server-only) | transform | No server code computes question applicability or "unanswered" today: it exists only in the context, over a browser-side data root. `routes/(voters)/(located)/+layout.ts` builds a `DataRoot` inside a load, but a universal one, for elections and constituencies, and was read here only as far as its `new DataRoot()` / `provideElectionData` / `provideConstituencyData` lines. Use RESEARCH RQ-1 (b) (S1 or S2) and Pattern 3. |
| `ENTITY/nominations/+page.svelte` — the card | component (route page) | request-response | No page in the tree renders raw rows as an `<article>` with a `<dl>`; `EntityCard` and `InfoItem` were checked and rejected by the UI-SPEC. `NothingToEdit`'s one `<dl>` and the conditional `pageStyles.push` are parts only. Use UI-SPEC § S4. |

Gaps inside files that do have an analog — none a missing file:

- **A route group whose only file is `+layout.server.ts`.** No directory under `apps/frontend/src/routes`
  holds a `+layout.server.ts` without a `+layout.svelte` beside it (checked by walk at `d33eccbca`). The shape
  rests on RESEARCH's scratch-app measurement and its assumption A1, not on an in-tree instance.
- **A disabled link that is announced.** No component passes `role="link"`, `aria-describedby` and a dimming
  class through `NavItem`'s rest props, and no markup in `lib/contestant` or `lib/dynamic-components/navigation`
  uses `aria-describedby` today. UI-SPEC § S3 is the specification (U-05).
- **Home's status rows.** No in-tree list renders a per-row status (`data-status`, an `sr-only` sentence inside
  a `Button`'s `badge` snippet, an `aria-hidden` badge). UI-SPEC § S1–S2 is the specification (U-04).
- **A template whose entities have no nomination row.** Only single rows of the base dataset; no whole
  template, and no perm template serves organizations before [175-05] (RESEARCH A6).

## Items the Planner Must Resolve

Re-reads forced by Phase 175 (each before an anchor is fixed):

1. **Every file 175 edits before this phase does** — `contestantContext.svelte.ts` and its type and test
   ([175-08 T2]); `supabaseDataWriter.ts` and the store ([175-07 T1–T2]); `contestantHome.helpers.ts`, the home
   page, `ContestantNav`, `LogoutButton`, the questions layout and list ([175-04 T1], [175-10 T2]); the profile
   page ([175-09]); `contestant-a11y.spec.ts`, `assert-a11y-scan-wiring.mjs`, `navMenu.fixture.ts`,
   `contestantProfilePage.fixture.ts`, `testIds.ts`, `playwright.config.ts` ([175-05], [175-10], [175-12]);
   `07-rpc-security.test.sql` ([175-03]). The excerpts above are of `d33eccbca` and are the *fallback* form.
2. **The names 175 fixes:** `nominationsLocked`, `questionsReady` and its definition, `entityDescriptorOf` and
   the descriptor's member list (this phase adds four and re-points `nominationsDescription`),
   `contestant-profile-identity`, `declareScans` / `toScanEntry`, `pageGeometry.fixture.ts`'s step names,
   `permOrganizationEditingData.ts`, `contestantEntityHomePage.fixture.ts`, the next free pgTAP number.
3. **The chain edge** in `tests/playwright.config.ts` after [175-05 T2] re-points
   `data-setup-perm-analytics-tracking`.

Open in the phase's own documents:

4. **The RPC's gate** — `private.caller_entity_ids` (recommended) or `user_can` (RESEARCH T-8). It decides the
   "parent's editor" and "project admin" pgTAP cells.
5. **S1 or S2** for the preview's server-side inputs; S2 makes the parity test a must-have (RESEARCH RQ-1 (b)).
6. **U-01, U-02, U-03** (the research's OQ-1 to OQ-3) and **U-08** depart from locked statements as written;
   the UI-SPEC is approved with their ★ options, and the helper's case table is written to them. Confirm that
   the operator's ruling is recorded before plan 03.
7. **First-paint inputs.** The UI-SPEC overrides the research's inputs table: "has a nomination", the
   greeting's entity and the entity's type come from `page.data.contestantUserData`, not the store. The
   store's saved-nominations getter (B3) is then needed only if something reads nominations outside page data
   — decide whether B3 is built at all.
8. **Which home fixture owns the task steps** — `contestantHomePage.fixture.ts` (today's) or
   `contestantEntityHomePage.fixture.ts` ([175-05 T2]).
9. **Where the home's copy lives** after the helper moves (CONTEXT D-05), and whether the helper returns route
   descriptors or the caller resolves them (RESEARCH § *The task state*).
10. **The group's name** — anything but `(protected)` (`isProtectedRoute` matches a whole segment).

Found by this mapping:

11. **`assert-project-scoped-queries.mjs` needs a row** for the new RPC (`'requires p_project_id'`); without
    one the lint chain fails. This closes RESEARCH open question 11.
12. **`PROT/+page.server.ts` is the in-tree page-level load** and already redirects to
    `ContestantAppEntityHome`; with `PROT/page.server.test.ts` and `PROT/page.tracking.test.ts` it is a closer
    analog for the preview's leaf load than the entity layout load the research cites.
13. **No in-tree server-only route group** (above): the first task that creates the group should run
    `svelte-kit sync` and the route-consistency test before anything is built on it.
14. **`entityDataFor` in `ENTITY/layout.server.test.ts`** and `ENTITY_DATA` in `ENTITY/layout.tracking.test.ts`
    hard-code the `{ nominations: { nominations: […], entities: [] } }` shape; both change with the type (B2),
    in the plan that changes the type, or the two files fail to typecheck.
15. **`ContestantNav.svelte.test.ts`'s fake context** supplies the two unanswered lists as fixed arrays; the
    closed-item cases need them — and the task state — behind getters, as `LogoutButton.svelte.test.ts` does
    with `$state`.
16. **Not read, named only:** `PROT/page.svelte.test.ts`, `PROT/page.tracking.test.ts`,
    `lib/dynamic-components/navigation/NavItem.svelte`, `lib/components/button/Button.svelte` (beyond one
    line), `tests/tests/setup/shared/setupFromTemplate.ts`, `tests/scripts/determinism-batch.sh`,
    `contexts/tests/noDataRootDerivedAlias.test.ts`, the six non-English catalogues, the three docs pages.

## Metadata

**Analog search scope:** `apps/supabase/supabase/schema/` (503, 301), `apps/supabase/supabase/tests/database/`
(05, 07, 36), `scripts/` (the `assert-*` guards), `apps/frontend/src/lib/{api/base,api/adapters/supabase,
contexts/contestant,contexts/utils,contestant/components,contestant/utils,server/contestant,routes,
dynamic-components/navigation/contestant,components/warning}/`, `apps/frontend/src/params/`, the whole
`routes/contestant/(protected)/` tree, `apps/frontend/messages/en/`, `tests/tests/{setup,fixtures,specs,utils}/`,
`tests/playwright.config.ts`, `packages/dev-seed/src/templates/e2e/`, `.planning/phases/175-*/` (PATTERNS, the
three drivers, plans 01, 03–05, 07–13).
**Files read for excerpts:** 44 on the tree (whole or by targeted section); 10 Phase 175 plans by task.
**Tree head:** `d33eccbca` for every excerpt; `548fc75b9` at the time of writing.
**Pattern extraction date:** 2026-10-08
