# Phase 177: Define Nominations - Pattern Map

**Mapped:** 2026-10-10
**Tree read at:** `a0f8babe8` (branch `feat/entity-signup-multi-grant`). Another agent commits to this worktree; the planner re-reads every anchor.
**Files analyzed:** 78 new or modified files (or file sets), in 9 groups
**Analogs found:** 74 / 78 — four have no close analog and are listed under *No Analog Found*

**How analogs are cited.** By path plus a content anchor — a symbol or a quoted line — **never a line number**. Excerpts are verbatim from the tree; a long line is cut with `…` and nothing else is changed. Frontend paths are relative to `apps/frontend/src/` unless they start with `apps/`; `schema/` and `tests/database/` are relative to `apps/supabase/supabase/`; `ENTITY/` abbreviates `routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/`; `P176/` abbreviates `.planning/phases/176-contestant-home-task-state-nominations-view/`. Every analog named was checked with `git ls-files -- <path>` and is tracked; none is a generated or mirrored copy.

**Names of new symbols and files are placeholders** (`<ordering module>`, `get_<…>_parent_options`, `contestant-nominations`, ordinals 43/44) unless CONTEXT fixes them (`set_entity_nominations`, `Election.nominationShape`, `allowedParentTypes`, `entity_delete_nominations`, `EntitySelector`, `contestant-nominations.spec.ts`, the three `(edit)/` directories).

**Three facts found while mapping that the planner should carry** (each is anchored below):

1. `upsert_answers` — the parameter-order precedent CONTEXT D-08 names — has **no `SET search_path`** (`RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER AS $$`). The two INVOKER functions beside it that do pin it are `get_user_entities` and `get_entity_user_data` (`LANGUAGE sql STABLE SECURITY INVOKER` / `SET search_path = ''`). RESEARCH measured `SET CONSTRAINTS` inside an INVOKER function *with* `search_path = ''`; copy the header shape from `get_user_entities`, the body shape from `upsert_answers`.
2. The profile page **already** calls `invalidateAll()` after a save and then asks the task state for its target (`rereadEntityList`, `profileSaveTarget(contestantCtx.taskState)`), and it does **not** `await tick()` between the two on the success path. That is the nearest thing to RESEARCH *Pattern 5* on the tree, and RESEARCH assumption A3 (one `tick()` suffices) is not something the profile page proves.
3. The cap message is pinned by a `throws_like` on its exact words in `23-nominations-write.test.sql` (`'%at most 10 unconfirmed parent organization nominations%'`). Rewording the message for alliances (RESEARCH RQ-3) moves that assertion and the writer's new prefix constant together.

---

## File Classification

### Group A — schema (plan 1)

| New/Modified File | Role | Data Flow | Closest Analog | Match |
|---|---|---|---|---|
| `schema/000-enums.sql` (4th member, header, comment) | migration | — | itself, `CREATE TYPE public.nomination_shape AS ENUM(` | exact |
| `schema/101-elections.sql` (column default) | migration | — | itself, `election_type public.nomination_shape NOT NULL DEFAULT 'organization_list'` | exact |
| `schema/011-validation-functions.sql` — matrix function (new) | migration / utility | transform | `public.grant_role_permissions` in `schema/301-auth-functions.sql` | exact (IMMUTABLE, reads no table) |
| `schema/011-validation-functions.sql` — row rule in `validate_nomination` | migration / trigger | event-driven | `validate_nomination` itself (the tenancy block) | exact |
| `schema/011-validation-functions.sql` — deferred function (new) | migration / trigger | event-driven | `validate_nomination` (definer header) | role-match; **no constraint trigger exists** |
| `schema/011-validation-functions.sql` — `enforce_nomination_entity_columns` (symbol) | migration / trigger | event-driven | itself + the `CASE` `validate_nomination` opens with | exact |
| `schema/011-validation-functions.sql` — cap branch of `enforce_nomination_confirmation` | migration / trigger | event-driven | itself | exact |
| `schema/104-nominations.sql` — `CREATE CONSTRAINT TRIGGER` | migration | event-driven | the four `CREATE TRIGGER` statements in the same file | role-match |
| `schema/301-auth-functions.sql` — organization role, paired `caller_nominated_in_contest`, count helper, parent-id lookup (new) | migration / utility | request-response | `private.nomination_exists_in_contest`, `private.caller_nominated_in_contest` | exact |
| `schema/302-rls.sql` — `entity_insert_parent_nominations` widened | migration / policy | CRUD | itself | exact |
| `schema/302-rls.sql` — `entity_delete_nominations` (new) | migration / policy | CRUD | `entity_update_nominations` (its `USING`) + `admin_delete_nominations` | exact |
| `schema/503-entity-rpcs.sql` — `get_entity_nominations` gains `parent.entity_id` | migration / RPC | request-response | itself | exact |
| `schema/503-entity-rpcs.sql` — `set_entity_nominations` (new, INVOKER) | migration / RPC | CRUD, batch | `upsert_answers` (body) + `get_user_entities` (header) + `create_invitations` in `schema/506-invitation-rpcs.sql` (argument refusals by index) | role-match, composed |
| `schema/503-entity-rpcs.sql` — parent-options RPC (new, DEFINER) | migration / RPC | request-response | `get_entity_nominations` (gate, allow-list, NULL) + `get_entity_basic_data` (which keys are basic data) | exact |
| `apps/supabase/supabase/migrations/00001_initial_schema.sql`, `packages/supabase-types/src/database.ts` | generated | — | `yarn schema:regenerate`, `yarn db:types` (never hand-edited) | — |
| `scripts/assert-project-scoped-queries.mjs` (`PROJECT_SCOPED_RPCS`) | config / lint gate | — | its own entries `upsert_answers`, `get_entity_nominations` | exact |

### Group B — pgTAP (plan 1)

| New/Modified File | Role | Data Flow | Closest Analog | Match |
|---|---|---|---|---|
| `tests/database/43-<set-entity-nominations>.test.sql` (new) | test | CRUD | `23-nominations-write.test.sql` (row-count instrument, twins) + `42-entity-nominations.test.sql` (file frame) | exact |
| `tests/database/44-<parent-options>.test.sql` (new) | test | request-response | `42-entity-nominations.test.sql` | exact |
| `08-triggers.test.sql` (shape grid, deferred rule) | test | event-driven | its "Section 5/6: validate_nomination" blocks | exact |
| `23-nominations-write.test.sql` (symbol, pairing, alliance cap, delete policy, new `PERM:` caller) | test | CRUD | its `G1`/`G1-neg`/`CAP:`/`PERM:` sections | exact |
| `42-entity-nominations.test.sql` (`pg_temp.parent_keys` assertion) | test | request-response | itself | exact |
| `07-rpc-security.test.sql` (census 9 → 10), `15-visibility-flags.test.sql` (enum 3 → 4), `25-matrix-conformance.test.sql` (own-organization probe), `12-user-can.test.sql` (nine `create_parent` sites) | test | — | each file's own assertion | exact |

### Group C — data model and adapter (plan 2)

| New/Modified File | Role | Data Flow | Closest Analog | Match |
|---|---|---|---|---|
| `packages/data/src/objects/election/election.type.ts`, `election.ts` (`nominationShape`) | model | — | `round` in both files | exact |
| `packages/data/src/objects/election/<nominationShape>.ts` + test (new; `allowedParentTypes` and its sibling) | utility | transform | `lib/contestant/tasks/taskState.ts` (pure, import-free, literal unions) for form; `packages/data/src/internal.ts` for export | role-match |
| `packages/data/src/internal.ts` (export line) | config | — | `export * from './objects/election/election';` | exact |
| `lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts` + `.test.ts` | service | request-response | `_getElectionData`, `round: row.current_round ?? undefined` | exact |
| `lib/api/adapters/supabase/utils/entityNominations.ts` + test (`entity_id` in `ParentSchema`) | utility | transform | itself | exact |
| `lib/api/adapters/supabase/utils/<parentOptions>.ts` + test (new) | utility | transform | `entityNominations.ts` | exact |
| `lib/api/adapters/supabase/utils/<setEntityNominationsResult>.ts` + test (new, if the RPC's jsonb answer is read) | utility | transform | `entityNominations.ts` | exact |
| `lib/api/base/dataWriter.type.ts` (`EntityNominationParent.entityId`, option + result types) | model | — | `UpdateEntityPropertiesResult`, `WithTargetEntity` | exact |
| `lib/api/base/universalDataWriter.ts` (public method + abstract `_…`) | service | request-response | `updateEntityProperties` / `_updateEntityProperties` | exact |
| `lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts` (two methods, refusal predicates) | service | CRUD | `_setAnswers` (the `rpc` call), `isNameRefusal`, `_getEntityUserData` (the RPC read) | exact |
| `supabaseDataWriter.integration.test.ts` (named refusals through the real API) | test | CRUD | its `"an editor's writes of its own entity's names and colour"` describe | exact |

### Group D — step 1: ordering, routes, loads (plan 3)

| New/Modified File | Role | Data Flow | Closest Analog | Match |
|---|---|---|---|---|
| `lib/routes/<ordering module>.ts` + test (new) | utility | transform | `lib/routes/impliedParams.ts` | exact |
| `lib/routes/index.ts`, `lib/routes/route.ts` (three constants) | config | — | `ContestantAppNominations: \`${CONTESTANT_ENTITY}/nominations\`` | exact |
| `routes/(voters)/elections/+page.ts`, `+page.svelte`; `routes/(voters)/constituencies/+page.ts`, `+page.svelte` (repointed) | route load / page | request-response | themselves | exact |
| `ENTITY/nominations/+layout.ts` (new; facts for J and the guard) | route load (universal) | request-response | `routes/(voters)/elections/+page.ts` (temp `DataRoot` from `await parent()`) | role-match (a page load, not a layout load) |
| `ENTITY/nominations/(edit)/+layout.ts` (new; the guard) | route load / gate | request-response | `ENTITY/(nominated)/+layout.server.ts` | role-match (server → universal) |
| `ENTITY/nominations/(edit)/layout.tracking.test.ts` (new) | test | — | `ENTITY/(nominated)/layout.tracking.test.ts` | exact |
| `ENTITY/nominations/(edit)/{elections,constituencies,details}/+page.ts` (new) | route load | request-response | `routes/(voters)/elections/+page.ts`, `constituencies/+page.ts` | exact |
| `ENTITY/nominations/(edit)/elections/+page.svelte` (new) | page | request-response | `routes/(voters)/elections/+page.svelte` | exact |
| `ENTITY/nominations/(edit)/constituencies/+page.svelte` (new) | page | request-response | `routes/(voters)/constituencies/+page.svelte` | exact |

### Group E — step 2: cards, selector, J, task state, copy (plan 4)

| New/Modified File | Role | Data Flow | Closest Analog | Match |
|---|---|---|---|---|
| `ENTITY/nominations/(edit)/details/+page.svelte` (new) | page | CRUD | `ENTITY/(nominated)/profile/+page.svelte` (save surface) + `ENTITY/nominations/+page.svelte` (card markup) | role-match, composed |
| `ENTITY/nominations/(edit)/details/page.svelte.test.ts` (new) | test | — | `ENTITY/nominations/page.svelte.test.ts` | exact |
| `lib/dynamic-components/entitySelector/` (`EntitySelector.svelte`, `.type.ts`, `index.ts`, test) (new) | component | event-driven | `lib/components/questions/QuestionChoices.svelte` (native radio group) + `routes/contestant/(protected)/+page.svelte` (`EntityCard` props) + `lib/dynamic-components/entityList/` (directory shape) | partial |
| `ENTITY/nominations/+page.svelte` + `page.svelte.test.ts` (Edit, six states, requested parent, `gap-md`/`mt-md`) | page | request-response | itself | exact |
| `lib/contestant/tasks/taskState.ts` + `.test.ts` (entry in `TaskRoute`, editable input, sixth target fn, `nominationsViewTarget` second argument) | utility | transform | itself — `questionSaveTarget(state, facts)` | exact |
| `lib/contexts/contestant/contestantContext.svelte.ts` (hands "editable" to `taskStateOf`) | provider | — | its `#taskState = $derived.by(` | exact |
| `lib/contestant/utils/entityDescriptor.ts` + test (13 members) | utility / config | — | itself — `nominationsDescription`, `nominationParentLabel` | exact |
| `lib/contestant/components/notEditableNote/` (third `reason`) | component | — | itself — `REASON_MESSAGE` | exact |
| `lib/components/electionSelector/ElectionSelector.svelte` (`whitespace-normal`) | component | — | itself | exact |
| `ENTITY/+page.svelte` (`role="list"` on the `<ol>`) | page | — | itself | exact |
| `lib/contexts/contestant/contestantUserDataState.svelte.ts` + test (F6 guard) | store | — | its `React to \`answersLocked\`` effect | exact |
| `ENTITY/(nominated)/preview/+page.server.ts` docstring (F8) | route load | — | itself | exact |
| `apps/frontend/messages/<7 locales>/contestantApp.nominations.json`, `contestantApp.common.json` | config | — | the same files | exact |

### Group F — dev-seed (plans 1 and 5)

| New/Modified File | Role | Data Flow | Closest Analog | Match |
|---|---|---|---|---|
| every template under `packages/dev-seed/src/templates/` that states `election_type`; `_helpers/buildMinimal.ts`; `generators/ElectionsGenerator.ts` | config | — | themselves | exact |
| `packages/dev-seed/src/templates/e2e/perm/<contestant-nominations>.ts` (new) | config | — | `packages/dev-seed/src/templates/e2e/perm/perm-no-nomination.ts` | exact |
| `packages/dev-seed/src/templates/index.ts` (import, registry entry, re-export) | config | — | its three `permNoNominationTemplate` lines | exact |
| `packages/dev-seed/tests/<census>.test.ts` (new; RQ-1 as a standing test) | test | batch | `packages/dev-seed/tests/assertKnownRowProps.builtins.test.ts` | exact |
| `packages/dev-seed/tests/templates/built-in-templates-contestant-app.test.ts` (new family row) | test | — | its `'perm-no-nomination': {` row | exact |

### Group G — E2E harness (plan 5; fixtures first)

| New/Modified File | Role | Data Flow | Closest Analog | Match |
|---|---|---|---|---|
| `tests/tests/utils/<contestantNominationsData>.ts` (new) | utility | — | `tests/tests/utils/permNoNominationData.ts` | exact |
| `tests/tests/fixtures/contestant/<contestant-nominations>.ts` (new; composition root + state steps) | test fixture | — | `tests/tests/fixtures/contestant/perm-no-nomination.ts` | exact |
| `tests/tests/fixtures/contestant/contestantNominationEditor.fixture.ts` (new) | test fixture | — | `tests/tests/fixtures/contestant/contestantNominationsPage.fixture.ts` | exact |
| `tests/tests/setup/perm/<contestant-nominations>.setup.ts`, `.teardown.ts` (new) | test setup | batch | `perm-no-nomination.setup.ts`, `.teardown.ts` | exact |
| `tests/playwright.config.ts` (project trio, chain re-link) | config | — | its `data-setup-perm-no-nomination` trio | exact |
| `tests/tests/specs/perm/contestant-nominations.spec.ts` (new) | test | — | `tests/tests/specs/perm/perm-no-nomination.spec.ts` | exact |
| `tests/tests/specs/perm/perm-startfromcg.spec.ts` + its setup/teardown (contestant tests, a signed-in candidate) | test | — | itself + `perm-no-nomination.setup.ts` (`registerAndStoreSession`) | exact |
| `tests/tests/specs/perm/perm-no-nomination.spec.ts` (J3 call sites, scan entry) | test | — | itself | exact |
| `tests/tests/specs/a11y/contestant-a11y.spec.ts` (`cand-nominations`) | test | — | itself | exact |
| `tests/tests/utils/testIds.ts` | config | — | its `contestant.nominations` block | exact |
| `contestantNominationsPage.fixture.ts`, `notEditableNote.fixture.ts`, `contestantHomePage.fixture.ts` | test fixture | — | themselves | exact |
| `scripts/assert-a11y-scan-wiring.mjs` (new spec in the list) | lint gate | — | its `NO_NOMINATION_SPEC` lines | exact |

### Group H — phase drivers

| New/Modified File | Role | Data Flow | Closest Analog | Match |
|---|---|---|---|---|
| `.planning/phases/177-define-nominations/177-gates.sh` | driver | batch | `P176/176-gates.sh` | exact |
| `.planning/phases/177-define-nominations/177-e2e.sh` | driver | batch | `P176/176-e2e.sh` | exact |
| `.planning/phases/177-define-nominations/177-verdict.mjs` (+ `177-BASE`) | driver | batch | `P176/176-verdict.mjs` (+ `P176/176-BASE`) | exact |

### Group I — docs, skills, todos

| New/Modified File | Role | Closest Analog |
|---|---|---|
| `.claude/skills/database/schema-reference.md`, `rls-policy-map.md`; `.claude/skills/data/object-model.md` | docs | the same files — the `nomination_shape` rows, the `nomination.create_parent` matrix row |
| `apps/docs/src/routes/(content)/developers-guide/contestant-app/home-and-tasks/+page.md` (F8 paragraph, the editor); `…/developers-guide/backend/authentication/+page.md` (role table); a Publishers' Guide page (D-17's limitation) | docs | `home-and-tasks/+page.md` — the paragraph beginning "The preview's rule is in the page's own load" |
| `packages/dev-seed/README.md`, `apps/supabase/README.md` | docs | themselves |
| `.planning/todos/pending/2026-08-28-preregister-election-constituency-selection-harmonisation.md` (closed), `2026-09-24-data-model-vs-db-nomination-constraints.md` (re-scoped), `2026-10-09-176-user-data-store-rewrites-current-on-every-run-of-the-answers-lock-effect.md` (closed by F6), `2026-10-09-176-rules-and-helpers-written-twice.md` (item 2), and the five todos CONTEXT O-7 files | planning | the todo files themselves |

---

## Pattern Assignments

### A1 — the matrix as one SQL function (`schema/011-validation-functions.sql`)

**Analog:** `public.grant_role_permissions` in `schema/301-auth-functions.sql`. It is the one function on the tree that states a table of rules, reads no table and is asked by everything else.

**Header and form** (anchor `-- grant_role_permissions: the role x permission matrix, encoded once`):
```sql
-- Reads no table, so it is IMMUTABLE and not SECURITY DEFINER. search_path is pinned anyway, because the enum types it names are resolved at call time.
CREATE OR REPLACE FUNCTION public.grant_role_permissions (
  p_scope public.grant_scope_type,
  p_role public.grant_role_type,
  p_target_type public.entity_type
) RETURNS public.grant_permission[] LANGUAGE sql IMMUTABLE
SET
  search_path = '' AS $$
  SELECT CASE
    -- Root: every verb.
    WHEN (p_scope, p_role) = ('global', 'admin') THEN ARRAY[
```
Copy: `LANGUAGE sql IMMUTABLE`, pinned `search_path`, a `SELECT CASE WHEN (a, b) = (…)` over a row-value pair. The new function takes `(public.nomination_shape, public.entity_type)`.

**Placement constraint** (RESEARCH *Pattern 2*): file 011 is applied before the `private` schema exists, so the function lives in `public`; a non-definer function is not counted by the census in `07-rpc-security.test.sql`.

---

### A2 — the row rule in `validate_nomination` and the deferred function

**Analog:** `public.validate_nomination` itself (`schema/011-validation-functions.sql`).

**Derive the type — never read `NEW.entity_type` in a BEFORE trigger** (anchor `-- Derive entity_type from the FK columns`):
```sql
  p_child_type := CASE
    WHEN NEW.candidate_id IS NOT NULL THEN 'candidate'::public.entity_type
    WHEN NEW.organization_id IS NOT NULL THEN 'organization'::public.entity_type
    WHEN NEW.faction_id IS NOT NULL THEN 'faction'::public.entity_type
    WHEN NEW.alliance_id IS NOT NULL THEN 'alliance'::public.entity_type
  END;
```

**Where the cell rule goes, and its refusal form** — the tenancy block already reads `public.elections` for every writer (anchor `-- Tenancy: the nomination's election and constituency must belong to the nomination's own project.`):
```sql
  IF NOT EXISTS (
    SELECT 1 FROM public.elections e WHERE e.id = NEW.election_id AND e.project_id = NEW.project_id
  ) THEN
    RAISE EXCEPTION 'Nomination election % does not belong to the nomination''s project %', NEW.election_id, NEW.project_id
      USING ERRCODE = 'check_violation';
  END IF;
```
Copy: a message with a stable start, `USING ERRCODE = 'check_violation'`. The cell rule sits **before** the early return that today admits every parentless row (anchor `IF NEW.parent_nomination_id IS NULL THEN` … `RETURN NEW;`), or it never sees a parentless candidate.

**Definer header for the deferred function** (anchor `CREATE OR REPLACE FUNCTION public.validate_nomination () RETURNS TRIGGER SECURITY DEFINER`):
```sql
CREATE OR REPLACE FUNCTION public.validate_nomination () RETURNS TRIGGER SECURITY DEFINER
SET
  search_path = '' AS $$
DECLARE
```
and its footer `$$ LANGUAGE plpgsql;`. The body of the deferred function is RESEARCH § *Code Examples* ("The deferred rule on the project's table — a sketch"): **re-read the row by `NEW.id`**, return NULL when it is gone or has a parent or carries `requestedParentOrganization`, then ask the matrix function of A1.

**The "Other" key test, as written twice already** (anchor `-- Rule 1: the free-text branch can never be confirmed, on either verb.`):
```sql
     AND NEW.custom_data IS NOT NULL
     AND NEW.custom_data ? 'requestedParentOrganization' THEN
```

---

### A3 — `CREATE CONSTRAINT TRIGGER` in `schema/104-nominations.sql`

**Analog (registration form only):** the four `CREATE TRIGGER` statements at the foot of the table definition.
```sql
CREATE TRIGGER validate_nomination_before_insert_or_update
BEFORE INSERT OR UPDATE ON public.nominations FOR EACH ROW
EXECUTE FUNCTION public.validate_nomination ();

-- Holds the presentation and bookkeeping columns and the entity foreign keys unset or unchanged for a caller without `project.edit_nominations`. 303-column-grants.sql cannot tell that caller from an admin; this trigger can.
CREATE TRIGGER enforce_nomination_columns_before_insert_or_update
```
Copy: one comment line above saying what the trigger holds and why it is a trigger. The statement itself is RESEARCH RQ-4's measured one (`AFTER INSERT OR UPDATE … DEFERRABLE INITIALLY DEFERRED FOR EACH ROW WHEN (NEW.candidate_id IS NOT NULL AND NEW.parent_nomination_id IS NULL)`). See *No Analog Found* #1.

---

### A4 — `enforce_nomination_entity_columns`: the symbol opened on the caller's own row

**Analog:** the function itself.

**The INSERT branch to split** (anchor `IF TG_OP = 'INSERT' AND num_nonnulls(`):
```sql
  IF TG_OP = 'INSERT' AND num_nonnulls(
       NEW.name, NEW.short_name, NEW.info, NEW.color, NEW.image,
       NEW.sort_order, NEW.subtype, NEW.election_symbol, NEW.external_id
     ) > 0 THEN
    RAISE EXCEPTION 'Only a holder of project.edit_nominations may set a nomination''s name, short_name, info, color, image, sort_order, subtype, election_symbol or external_id'
      USING ERRCODE = 'insufficient_privilege';
  END IF;
```
**The UPDATE branch** is thirteen `IS DISTINCT FROM` lines (anchor `OR NEW.election_symbol IS DISTINCT FROM OLD.election_symbol`), message `'Only a holder of project.edit_nominations may change a nomination''s presentation columns, external_id or entity'`. Both messages name the columns and change with the rule; the header comment's "the nine presentation and bookkeeping columns" changes with them, and so does the matching sentence in `schema/303-column-grants.sql` (anchor `the nine presentation and bookkeeping columns a project admin writes`).

**The "own row" question** is asked the way the policies ask it (A6), with the type derived as in A2 — RESEARCH *Pitfall 3*. The function is `SECURITY INVOKER` and must stay so (its own comment: "a SECURITY DEFINER body reports the owner as current_user, and the role test would never match").

---

### A5 — helpers in `schema/301-auth-functions.sql`

**Analog for the parent-id lookup (new):** `private.nomination_exists_in_contest` — same arguments, same match, returning an id instead of a boolean.
```sql
CREATE OR REPLACE FUNCTION private.nomination_exists_in_contest (
  p_entity_type public.entity_type,
  p_entity_id uuid,
  p_election_id uuid,
  p_constituency_id uuid,
  p_election_round integer
) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET
  search_path = '' AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.nominations n
    WHERE n.entity_type = p_entity_type
      AND (
        n.candidate_id = p_entity_id
        OR n.organization_id = p_entity_id
        OR n.faction_id = p_entity_id
        OR n.alliance_id = p_entity_id
      )
      AND n.election_id = p_election_id
      AND n.constituency_id = p_constituency_id
      AND n.election_round IS NOT DISTINCT FROM p_election_round
  );
$$;
```
Copy: the header comment form (`-- <name>: <the question it answers>` then why definer, what it returns on no row), `IS NOT DISTINCT FROM` on the nullable round. The new function needs a stated tie-break (RESEARCH *Open Questions* 3).

**Placement is load-bearing** (anchor `-- Policies and SECURITY INVOKER functions evaluate as the querying role`): "The statement reaches only the functions defined before it." A new `private` function goes **above** `GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA private TO anon, authenticated, service_role;`.

**The guard-5 helper to pair by type:**
```sql
CREATE OR REPLACE FUNCTION private.caller_nominated_in_contest (
  p_election_id uuid,
  p_constituency_id uuid,
  p_election_round integer,
  p_permission public.grant_permission
) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
…
      AND public.user_can(
            'entity',
            COALESCE(n.candidate_id, n.organization_id, n.faction_id, n.alliance_id),
            p_permission,
            n.entity_type
          )
```
It asks "some entity nominated here"; D-07 needs it asked for a *type* (a fifth argument, or a `n.entity_type = …` conjunct). Its header's sentence "a candidate first creates their own nomination with no parent (which `validate_nomination` admits)" goes stale under D-04 and is rewritten.

**The count helper to widen:**
```sql
  SELECT count(*)::integer
  FROM public.nominations n
  WHERE n.created_by IS NOT DISTINCT FROM (SELECT auth.uid())
    AND n.organization_id IS NOT NULL
    AND NOT n.confirmed;
```
It changes together with the trigger's branch (anchor `AND NEW.organization_id IS NOT NULL` inside `enforce_nomination_confirmation`) and its message (anchor `'A caller may originate at most 10 unconfirmed parent organization nominations; this caller already holds %.`) — RESEARCH *Pitfall 7*.

**The organization role:** `grant_role_permissions`' organization-editor arm; CONTEXT quotes its comment "the entity set minus nomination.create_parent (an organization has no parent to create)". The literal list form is the one excerpted in A1.

---

### A6 — policies in `schema/302-rls.sql`

**Analog for `entity_delete_nominations`:** the `USING` clause of `entity_update_nominations`, verbatim, under `FOR DELETE`.
```sql
CREATE POLICY "entity_update_nominations" ON public.nominations
FOR UPDATE
  TO authenticated USING (
    (
      SELECT
        user_can (
          'entity',
          COALESCE(
            candidate_id,
            organization_id,
            faction_id,
            alliance_id
          ),
          'nomination.edit',
          entity_type
        )
    )
    AND NOT (
      SELECT
        private.project_nominations_locked (project_id)
    )
  )
```
and the statement form of the one existing delete policy:
```sql
-- Admin delete: `project.edit_nominations` at project scope.
CREATE POLICY "admin_delete_nominations" ON public.nominations FOR DELETE TO authenticated USING (
```
Copy: a comment above naming each conjunct and the pgTAP file that asserts it (anchor `23-nominations-write.test.sql asserts each conjunct in both directions`); the lock read through the definer helper, never inline.

**The parent policy to widen** (anchor `CREATE POLICY "entity_insert_parent_nominations"`):
```sql
  CHECK (
    organization_id IS NOT NULL
    AND NOT confirmed
    AND NOT (
      SELECT
        private.nomination_exists_in_contest (
          'organization'::public.entity_type,
          organization_id,
          election_id,
          constituency_id,
          election_round
        )
    )
```
Guard 1 becomes two types; guard 3 is asked with the row's own `entity_type` and its coalesced id (the form the "Project agreement" conjunct of the same policy already uses: `private.entity_project_id (entity_type, COALESCE(organization_id, candidate_id, faction_id, alliance_id))`); guard 5 is paired. The comment block above the policy numbers its guards (`-- - Guard 1:` … `-- - Cap:` … `-- - Project agreement:`) and is rewritten guard by guard.

---

### A7 — the RPCs in `schema/503-entity-rpcs.sql`

#### `get_entity_nominations` gains `parent.entity_id`

**Anchor:** `'parent', CASE WHEN p.id IS NULL THEN NULL ELSE jsonb_build_object(`
```sql
          'parent', CASE WHEN p.id IS NULL THEN NULL ELSE jsonb_build_object(
            'entity_type', p.entity_type,
            'name', COALESCE(po.name, pf.name, pa.name),
            'short_name', COALESCE(po.short_name, pf.short_name, pa.short_name)) END)
```
One key more, `COALESCE(p.organization_id, p.faction_id, p.alliance_id)`. The header's sentence "an object of exactly `entity_type`, `name` and `short_name`" and the assertion over `pg_temp.parent_keys` in `42-entity-nominations.test.sql` move with it.

#### The parent-options RPC (DEFINER)

**Analog:** `get_entity_nominations` — gate, NULL-never-raise, key-by-key projection, `COALESCE(…, '[]'::jsonb)`, grants.

**Gate** (anchor `IF p_project_id IS NULL OR p_entity_type IS NULL OR p_entity_id IS NULL`):
```sql
) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER
SET
  search_path = '' AS $$
BEGIN
  IF p_project_id IS NULL OR p_entity_type IS NULL OR p_entity_id IS NULL
     OR (
       p_entity_type IN ('candidate', 'organization')
       AND p_entity_id IN (SELECT private.caller_entity_ids(p_project_id, p_entity_type))
     ) IS NOT TRUE THEN
    RETURN NULL;
  END IF;
```
This is the form that takes the project "from the entity the caller edits and never from an argument the caller can point elsewhere" (D-09): the project argument only ever selects among the caller's own grants.

**Grants** (anchor `REVOKE` / `EXECUTE ON FUNCTION public.get_entity_nominations`):
```sql
REVOKE
EXECUTE ON FUNCTION public.get_entity_nominations (uuid, public.entity_type, uuid)
FROM
  PUBLIC,
  anon;

GRANT
EXECUTE ON FUNCTION public.get_entity_nominations (uuid, public.entity_type, uuid) TO authenticated;
```

**Which keys are "basic data"** — `get_entity_basic_data`'s organization arm:
```sql
      SELECT jsonb_build_object(
          'entity_type', 'organization', 'id', o.id, 'project_id', o.project_id,
          'name', o.name, 'short_name', o.short_name, 'info', o.info, 'color', o.color, 'image', o.image,
          'sort_order', o.sort_order, 'subtype', o.subtype, 'confirmed', o.confirmed)
```
D-09's allow-list is a subset: id, entity type, name, short name, colour, image, plus the per-pair "nominated here" answers.

**Header comment paragraphs to mirror**, each a paragraph of `get_entity_nominations`' header: what it returns and in what order; the gate and why `user_can` is not asked; that no parameter carries a DEFAULT; "The projection is an ALLOW-LIST built key by key" with the withheld columns named; "Returns NULL -- never raises --"; why DEFINER.

#### `set_entity_nominations` (INVOKER)

**Header shape — an INVOKER function that pins `search_path`** (`get_user_entities`):
```sql
CREATE OR REPLACE FUNCTION public.get_user_entities (p_project_id uuid) RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER
SET
  search_path = '' AS $$
```
**Parameter order and the zero-row raise** (`upsert_answers`):
```sql
CREATE OR REPLACE FUNCTION public.upsert_answers (
  p_entity_type public.entity_type,
  p_entity_id uuid,
  p_answers jsonb,
  p_overwrite boolean DEFAULT false
) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER AS $$
…
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Entity not found or access denied: %', p_entity_id;
  END IF;
```
`upsert_answers` pins no `search_path` and carries `GRANT EXECUTE … TO authenticated` with no `REVOKE`; the new function follows `get_user_entities` on both (pinned path, `REVOKE … FROM PUBLIC, anon`, `GRANT … TO authenticated`). Every table and function name in the body is then schema-qualified.

**Argument refusals by index** (`create_invitations`, `schema/506-invitation-rpcs.sql`, anchor `'create_invitations: p_invitations must be a JSON array'`):
```sql
  IF p_invitations IS NULL OR jsonb_typeof(p_invitations) <> 'array' THEN
    RAISE EXCEPTION 'create_invitations: p_invitations must be a JSON array'
      USING ERRCODE = '22023';
…
  FOR v_item, v_ordinality IN
    … FROM jsonb_array_elements(p_invitations) WITH ORDINALITY AS t (item, ordinality)
  LOOP
    IF jsonb_typeof(v_item) <> 'object' THEN
      RAISE EXCEPTION 'create_invitations: p_invitations[%] must be a JSON object', v_index
        USING ERRCODE = '22023';
```
Copy: `<function name>: p_nominations[<index>] <what is wrong>`, SQLSTATE `22023`. U-16's "Other" name (trimmed, non-empty, ≤ 100) and the symbol's cap (RESEARCH *Open Questions* 4) are refused in this form.

**Row count after a statement, as pgTAP's own instrument does it** (`23-nominations-write.test.sql`, `pg_temp.try_edit_nomination`):
```sql
  UPDATE public.nominations
  SET custom_data = jsonb_build_object('note', p_note)
  WHERE id = p_id;
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  RETURN v_rows;
```
The body order and the forcing statement are RESEARCH *Pattern 3* and § "Forcing it, in the write function and in pgTAP".

---

### A8 — `scripts/assert-project-scoped-queries.mjs`

**Anchor:** `get_entity_nominations: 'requires p_project_id',`
```js
  get_entity_user_data: 'requires p_project_id',
  get_entity_nominations: 'requires p_project_id',
  claim_invitations: 'requires p_project_id',
  upsert_answers: 'scoped-by-identity: entity type + entity id + RLS',
```
One entry per new RPC, each with a comment block above the map in the form of the `get_entity_nominations` one (anchor `` * `get_entity_nominations` returns the nominations of one entity the caller edits in one project,``).

---

### B1 — new pgTAP files (`43-…`, `44-…`)

**Analog:** `tests/database/42-entity-nominations.test.sql`.

**Frame** (first lines and last lines of the file):
```sql
-- 42-entity-nominations.test.sql: an entity's own nominations, with the parent each stands under resolved
--
-- `get_entity_nominations` answers the editor of one candidate or organization …
--
-- Every impersonation passes an empty grant array, so each claim is projected from the rows this file writes.
--
-- Depends on: 00-helpers.test.sql (set_test_user, reset_role, create_test_data, test_id, test_user_id, test_seed_identity_grants).
BEGIN;

SET
  search_path = public,
  extensions;

-- Reset pgTAP internal state from previous test files in same session
DROP TABLE IF EXISTS __tcache__;

SELECT
  plan (69);

SELECT
  create_test_data ();
```
```sql
SELECT
  *
FROM
  finish ();

ROLLBACK;
```
**Fixture ids of the file's own** (anchor `'42424242-4242-4242-4242-0000000000b1'`): one id range per file — `43434343-…`, `44444444-…` — "that no fixture, seed or sibling test file uses" (`23-…`'s header).

**The catalogue assertion** (anchor `-- The function in the catalogue`):
```sql
        SELECT
          p.prosecdef
          AND 'search_path=""' = ANY (p.proconfig)
          AND p.provolatile = 's'
          AND p.pronargdefaults = 0
          AND p.prorettype = 'jsonb'::regtype
        FROM
          pg_proc p
          JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE
          n.nspname = 'public'
          AND p.proname = 'get_entity_nominations'
          AND pg_get_function_identity_arguments(p.oid) = 'p_project_id uuid, p_entity_type entity_type, p_entity_id uuid'
```
For `set_entity_nominations` the first conjunct is `NOT p.prosecdef` and volatility is `'v'`. The privilege twin follows it (anchor `'authenticated may execute get_entity_nominations and anon may not'`).

**Answer helpers in `pg_temp`** (anchors `CREATE FUNCTION pg_temp.answer (`, `pg_temp.element_keys (`, `pg_temp.parent_keys (`) — the key-set assertion that pins an allow-list:
```sql
  SELECT string_agg(DISTINCT k.keys, ' | ')
  FROM (
    SELECT (SELECT string_agg(j.key, ',' ORDER BY j.key) FROM jsonb_object_keys(e.element) AS j (key)) AS keys
    FROM jsonb_array_elements(public.get_entity_nominations(p_project_id, p_entity_type, p_entity_id)) AS e (element)
  ) k;
```
**Impersonation** (anchor `-- A candidate's editor, in the open project`):
```sql
SELECT
  set_test_user (
    'authenticated',
    test_user_id ('candidate_a'),
    '[]'::jsonb
  );
```
`23-…` passes `test_user_grants ('candidate_a')` instead; a file states which in its header. `reset_role ();` closes every impersonated section.

**The anon-by-privilege tail** (anchor `'anon is refused get_entity_nominations by privilege'`): `set_test_user ('anon')` then `throws_ok (format($$SELECT public.…$$, …), '42501', NULL, '…')`.

**For the write function's file, from `23-nominations-write.test.sql`:**
- every assertion has a twin; a guard is proven by a negative control that differs in one thing (its header, "Every assertion in this file therefore has a TWIN");
- a row an entity user just created is read back **as the owner** (anchor `-- Read as the OWNER. The entity user cannot yet SEE the row it just created`):
  ```sql
  SELECT
    reset_role ();
  …
      SELECT
        confirmed::text || '/' || COALESCE(created_by::text, 'NULL')
      FROM
        nominations
      WHERE
        organization_id = '12121212-1212-1212-1212-000000000001'::uuid
        AND election_round = 3
  ```
- a silent zero-row statement is asserted through an INVOKER instrument that returns the row count (`pg_temp.try_edit_nomination`, and its warning "⚠ IT MUST NOT BE `SECURITY DEFINER`");
- the deferred rule never fires by itself in a file that ends `ROLLBACK;` — assert through the function, or with `SET CONSTRAINTS ALL IMMEDIATE` inside the asserted string (RESEARCH *Pitfall 4*; that `throws_ok` takes a two-statement string is RESEARCH assumption A5, unmeasured).

---

### B2 — `08-triggers.test.sql`: the shape grid

**Analog:** its "Section 5" and "Section 6" blocks.
```sql
-- =====================================================================
-- Section 6: validate_nomination -- invalid hierarchy rejected
-- =====================================================================
-- Alliance with parent -> throws 'cannot have a parent'
SELECT
  throws_ok (
    format(
      $$INSERT INTO nominations (id, project_id, alliance_id, election_id, constituency_id, election_round, parent_nomination_id)
      VALUES (gen_random_uuid(), '%s', '%s', '%s', '%s', 1, '%s')$$,
      test_id ('project_a'),
      test_id ('alliance_a'),
      test_id ('election_a'),
      test_id ('constituency_a'),
      test_id ('nomination_org_a')
    ),
    NULL,
    'Alliance nominations cannot have a parent',
    'Alliance nomination with parent rejected'
  );
```
Copy: one `lives_ok` per admitted cell (the Section 5 form), one `throws_ok` per refused cell with the message as third argument. A fixture election that must prove a refusal **states its type** — no pgTAP fixture states one today, so every fixture election takes the new default. The grid runs for an entity user, an admin and the service role (D-04).

---

### B3 — `23-nominations-write.test.sql`: symbol, pairing, cap, delete

**Section-label convention** — every block opens with a short tag and a sentence (anchors `-- G1:`, `-- G4:`, `-- OWN:`, `-- G5:`, `-- PROJ:`, `-- ORIG:`, `-- CAP:`, `-- PERM:`, `-- D1:`, `-- REQ:`), and each assertion's description repeats the tag: `'G1-neg: guard 1 -- a CANDIDATE-type row is refused through the parent policy; the hole is organization-shaped'`.

**A guard's positive and its negative control** — the `G1` / `G1-neg` pair excerpted under B1; the negative is `throws_ok (…, '42501', NULL, '<tag>-neg: …')`.

**The cap at its boundary** (anchor `-- CAP: nine parent nominations already originated by this caller`):
```sql
-- Normalise first. The guard assertions above legitimately originated parents of their own, …
UPDATE nominations
SET
  created_by = NULL
WHERE
  created_by = test_user_id ('candidate_a');
…
FROM
  generate_series(1, 9) AS i;
…
SELECT
  throws_like (
    format(
      $$INSERT INTO nominations (project_id, organization_id, election_id, constituency_id, election_round)
      VALUES ('%s', '12121212-1212-1212-1212-000000000009'::uuid, '%s', '%s', 3)$$,
      …
    ),
    '%at most 10 unconfirmed parent organization nominations%',
    'CAP: the next one is REFUSED with a message naming the ruled cap value …'
  );
```
The cap rows are inserted **last** ("the ordering is load-bearing: the cap is enforced by a BEFORE INSERT trigger, which runs AHEAD of the row-level check clause"). The alliance boundary case repeats the block with `alliance_id`; the `throws_like` pattern changes with the reworded message.

**`PERM:`** (anchor `-- PERM: \`nomination.create_parent\` is SEPARATELY REVOCABLE`) uses an organization editor as the caller *without* the permission. D-07 gives it the permission, so the section needs another such caller (RESEARCH *Pitfall 5*).

**`plan (64)`** at the head of the file moves with the count.

---

### B4 — the four pinned assertions

| File | Anchor | Change |
|---|---|---|
| `07-rpc-security.test.sql` | `'claim_invitations,contestant_app_public_config,get_entity_basic_data,get_entity_nominations,project_open_for_voters,storage_path_can,storage_path_is_public,user_can,user_has_account_grant',` and its description `'census: the SECURITY DEFINER functions in public that authenticated can execute are the same six plus …'` | the parent-options RPC is inserted in sorted position; the description names it; `anon`'s list does not move |
| `15-visibility-flags.test.sql` | `'The nomination-shape enum has exactly the three ratified members and no fourth'` over `ARRAY['candidate_only', 'organization_list', 'organization_only']::text[]` | a sorted array of four, in the same commit as the enum |
| `25-matrix-conformance.test.sql` | `ARRAY['nomination.create_parent', 'entity', 'alliance_a', 'alliance']];` and `'matrix row nomination.create_parent'` | the string does not change (RESEARCH RQ-2); a probe at the caller's **own** organization is added or the new cell is measured by nothing |
| `12-user-can.test.sql` | every site naming `nomination.create_parent` (a population; `grep -n "nomination.create_parent"`) | re-read against the organization role |

---

### C1 — `Election.nominationShape` (`packages/data/src/objects/election/`)

**Analog:** `round`, in both files.

`election.type.ts`:
```ts
  /**
   * The optional current round of the election if it has multiple rounds. Defaults to 1.
   */
  round?: number | null;
```
`election.ts`:
```ts
   * The optional current round of the election if it has multiple rounds. @defaultValue 1
   */
  get round(): number {
    return this.data.round ?? 1;
  }
```
Copy: an optional, nullable data member; a getter that applies the smart default (`@defaultValue`), here the database's new default. The matrix function and its sibling are a new file beside it (C2), exported through `packages/data/src/internal.ts` next to `export * from './objects/election/election';`. Test style: `packages/data/src/objects/election/election.test.ts` (`getTestDataRoot()`, flat `test(...)` cases); the grid is one case per cell.

**Package rule:** no `.js` extension on TS-internal relative imports; everything imports from `'../../internal'` (the first line of `election.ts`).

### C2 — the matrix in TypeScript (`allowedParentTypes` and its sibling)

**Analog for form:** `lib/contestant/tasks/taskState.ts` — a pure module of literal unions and functions that return fresh values, with a header saying who may import it and where "not known" is decided. See *Shared Patterns → A pure helper receives values*. No exact analog exists in `packages/data` for a standalone rule function over an enum-like union; `ENTITY_TYPE` (imported in `election.ts` from `'../../internal'`) is the existing const-object-as-enum in the package, and the shape's four names should be declared the same way so that the adapter, the pages and the tests name them from one place.

---

### C3 — the adapter maps the column (`supabaseDataProvider.ts`)

**Anchor:** `round: row.current_round ?? undefined,`
```ts
        date: row.election_date ? String(row.election_date) : undefined,
        round: row.current_round ?? undefined,
        // `subtype` is read from the `subtype` column only. `election_type` holds the nomination shape, which is a separate axis.
        subtype: row.subtype ?? undefined,
```
One member more, from `row.election_type`. The comment above `subtype` stays true and stays; the cases in `supabaseDataProvider.test.ts` that name `election_type` are extended, not loosened (D-03).

---

### C4 — parse modules for the two RPC answers

**Analog:** `lib/api/adapters/supabase/utils/entityNominations.ts` (whole file, 53 lines).

**Imports and schema:**
```ts
import { Constants } from '@openvaa/supabase-types';
import { z } from 'zod';
import type { Json } from '@openvaa/supabase-types';

/** The entity a nomination is nominated under: its type and its two names. The names are kept as JSON and localized by whoever maps the row. */
const ParentSchema = z.object({
  entity_type: z.enum(Constants.public.Enums.entity_type),
  name: z.json(),
  short_name: z.json()
});
```
**The three-outcome narrowing** (anchor `export function parseEntityNominations(raw: Json | undefined)`):
```ts
export function parseEntityNominations(raw: Json | undefined): Array<EntityNominationRow> | null {
  if (raw === null) return null;
  const result = EntityNominationsSchema.safeParse(raw);
  if (!result.success) {
    const issues = result.error.issues.map((issue) => issue.path.join('.') || '(root)');
    throw new Error(`The answer of get_entity_nominations did not match its schema at: ${issues.join(', ')}`);
  }
  return result.data;
}
```
Copy: database column names in the schema; `null` is a refused read and never an empty list; a mismatch throws naming schema paths and never a stored value; "Unknown members are dropped rather than refused". `ParentSchema` gains `entity_id: z.string().min(1)`; its test (`entityNominations.test.ts`) gains the case.

---

### C5 — the writer methods

**Analog:** `supabaseDataWriter.ts` — `_setAnswers` for the RPC call, `isNameRefusal` for a refusal told apart, `_getEntityUserData` for a jsonb RPC read.

**A refusal the page can name** (anchors `const NAME_REFUSAL_PREFIX`, `const RAISED_EXCEPTION_CODE`, `function isNameRefusal(`):
```ts
/**
 * How the database's refusal of a changed name begins. The text is raised by `public.enforce_entity_immutability` in `apps/supabase/supabase/schema/011-validation-functions.sql`, …
 */
const NAME_REFUSAL_PREFIX = 'Entity name is immutable once confirmed: column ';

/**
 * The SQLSTATE of an exception a database function raises without naming a code, which is how the refusal of a changed name is raised.
 */
const RAISED_EXCEPTION_CODE = 'P0001';
…
function isNameRefusal(error: { code?: string; message: string }): boolean {
  return error.code === RAISED_EXCEPTION_CODE && error.message.startsWith(NAME_REFUSAL_PREFIX);
}
```
and its use (anchor `if (isNameRefusal(error)) return { type: 'nameRefused' };`):
```ts
    if (error) {
      // The refusal is a result the caller shows in its own words. The raised text names the row and both values, and is not returned.
      if (isNameRefusal(error)) return { type: 'nameRefused' };
      throw new Error(`updateEntityProperties: ${error.message}`);
    }
```
Two predicates of the same form for U-21: the cap (`P0001` + the message's start) and "candidates listed under it" (`23503` + the constraint name `nominations_parent_nomination_id_fkey`, RESEARCH RQ-3). Each constant's docstring names the schema file and function that raises it.

**The result type** (`lib/api/base/dataWriter.type.ts`, anchor `export type UpdateEntityPropertiesResult`):
```ts
/**
 * What `updateEntityProperties` resolves to, discriminated by `type`.
 * - `saved`: …
 * - `nameRefused`: the backend refused the write because it changes a name of an entity that has been confirmed. Nothing of the call was stored.
 */
export type UpdateEntityPropertiesResult =
  | { type: 'saved'; properties: SavedEntityProps; localizedNames: Partial<LocalizedEntityNames> }
  | { type: 'nameRefused' };
```
**The options type** takes the target as `WithTargetEntity` (`target: { type: EntityType; id: Id }`), as `SetAnswersOptions = WithTargetEntity & WithAnswerData` does.

**The RPC call** (`_setAnswers`, anchor `await this.supabase.rpc('upsert_answers', {`):
```ts
    const { data, error } = await this.supabase.rpc('upsert_answers', {
      p_entity_type: type,
      p_entity_id: id,
      // reason: processedAnswers is jsonb-safe at runtime …
      p_answers: processedAnswers as Json,
      p_overwrite: overwrite
    });
    if (error) throw new Error(`setAnswers: ${error.message}`);
```
**A jsonb read narrowed at the boundary** (`_getEntityUserData`, anchor `const rows = parseEntityNominations(listed);`):
```ts
      const { data: listed, error: nominationsError } = await this.supabase.rpc('get_entity_nominations', {
        p_project_id: this.projectId,
        p_entity_type: served,
        p_entity_id: entityRow.id
      });
      if (nominationsError) throw new Error(`Failed to load nominations: ${nominationsError.message}`);

      // A malformed answer throws inside the narrowing, so it is a failed read and never an empty list.
      const rows = parseEntityNominations(listed);
```
`EntityNominationParent` (anchor `export type EntityNominationParent = {`) gains the parent's entity id (U-31); `entityNominationOf` in the writer maps it.

**The base class** (`lib/api/base/universalDataWriter.ts`):
```ts
  updateEntityProperties(opts: SetPropertiesOptions): DWReturnType<UpdateEntityPropertiesResult> {
    …
    return this._updateEntityProperties(opts);
  }
…
  protected abstract _updateEntityProperties(opts: SetPropertiesOptions): DWReturnType<UpdateEntityPropertiesResult>;
```
A public method that validates its own arguments, then a `protected abstract _…` counterpart; the `DataWriter` interface in `dataWriter.type.ts` gains the member with a TSDoc `@returns` in the form of `updateEntityProperties`'.

### C6 — the writer integration test

**Analog:** `supabaseDataWriter.integration.test.ts`, the describe `"an editor's writes of its own entity's names and colour"`, whose cases end `expect(refused).toEqual({ type: 'nameRefused' });`. Gating is the file's own (`describe.skipIf(!hasSupabase)`, and the throw under `CONTESTANT_WRITER_INTEGRATION_REQUIRED === '1'`); the gate driver's `integration` row is what runs it.

---

### D1 — the shared ordering module (`lib/routes/`)

**Analog:** `lib/routes/impliedParams.ts` (whole file).
```ts
import type { Id } from '@openvaa/core';
import type { DataRoot } from '@openvaa/data';

export function getImpliedElectionIds({
  appSettings,
  dataRoot,
  selectedConstituencyIds
}: {
  appSettings: AppSettings;
  dataRoot: DataRoot;
  selectedConstituencyIds?: Array<Id>;
}): Array<Id> | undefined {
  let elections = dataRoot.elections;
  …
  if (selectedConstituencyIds?.length) {
    const constituencies = selectedConstituencyIds.map((id) => dataRoot.getConstituency(id));
    elections = elections.filter((e) => {
      try {
        return !!e.getApplicableConstituency(constituencies);
      } catch {
        return true;
      }
    });
  }
  // Elections can be implied if there is only one election or if the app settings disallow selection
  if (elections.length === 1 || appSettings.elections?.disallowSelection) return elections.map((e) => e.id);
  return undefined;
}
```
Copy: one options object, a `DataRoot` handed in (never a context), `Array<Id> | undefined` for "cannot be implied". **What the module must add:** an elections filter argument (the admissible set, D-28) and a way for the contestant caller to leave `disallowSelection` out (OD08-E14) — the last `if` above is where the two apps part.

**The decisions to extract, and where each lives today:**

| Decision | File | Anchor |
|---|---|---|
| redirect table, elections first | `routes/(voters)/elections/+page.ts` | the doc-comment table; `if (constituencyId && impliedElectionId) _redirect('Questions', nextForward);` |
| redirect table, constituencies | `routes/(voters)/constituencies/+page.ts` | `if (appSettings.elections?.startFromConstituencyGroup) return;` … `if (!electionId) _redirect('Elections', nextForward);` |
| elections held in the chosen constituency (a throw counts as held) | `routes/(voters)/elections/+page.svelte` | `let elections = $derived.by(() => {` … `return !!e.getApplicableConstituency(voterCtx.selectedConstituencies);` — the same `try`/`catch` as in `getImpliedElectionIds` |
| single-group mode | `routes/(voters)/constituencies/+page.svelte` | `const useSingleGroup = $derived.by(() => {` |
| most-specific-constituency prefill | `routes/(voters)/constituencies/+page.svelte` | `const best = matches.reduce((a, b) => {` |

**What stays in the voter files:** `?next=` handling (anchors `const nextSearch = url.searchParams.get('next');`, `isVoterAppPath(decoded)`), the redirect to `Questions`, the voter param names. Several comments in these four files break the comment-hygiene rule today (e.g. `// (Symmetry with \`(located)/+layout.ts:60-67\` …`, `variant-startfromcg.spec.ts:145`, "The previous implementation delegated to …"); every comment the extraction touches is brought in line.

**Barrel:** `lib/routes/index.ts` re-exports it, as `getImpliedElectionIds` is imported from `'$lib/routes'`.

---

### D2 — the editor's loads

**Analog for a universal load that decides from the root load's data:** `routes/(voters)/elections/+page.ts`.
```ts
import { staticSettings } from '@openvaa/app-shared';
import { DataRoot } from '@openvaa/data';
import { redirect } from '@sveltejs/kit';
import { buildRoute, getImpliedElectionIds, parseParams } from '$lib/routes';
import { mergeAppSettings } from '$lib/utils/settings';
import type { Route } from '$lib/routes';

export async function load({ parent, params, route, url }) {
  const { appSettingsData, constituencyData, electionData } = await parent();
  const appSettings = mergeAppSettings(staticSettings, await appSettingsData);

  // Create a temporary data root we use for implication
  const dataRoot = new DataRoot();
  dataRoot.provideElectionData(await electionData);
  dataRoot.provideConstituencyData(await constituencyData);
  …
  function _redirect(target: Route, extraParams?: Record<string, string | Array<string> | undefined>): never {
    redirect(307, buildRoute({ route: target, ...(extraParams ?? {}) }, { params, route, url }));
  }
}
```
This is the form of the three step `+page.ts` loads (they may read `url`; the chosen ids are theirs to read). Their redirects pass the editor's own search params as extra params, as `nextForward` is passed here — `Params = NamedParams & Record<string, string | Array<string>>` in `lib/routes/params.ts`; `nominationElectionId` / `nominationConstituencyId` are **not** added to `PERSISTENT_SEARCH_PARAMS` (anchor `export const PERSISTENT_SEARCH_PARAMS = ['constituencyId', 'electionId'] as const;`).

**Analog for the guard and the facts load (which may not read `url`):** `ENTITY/(nominated)/+layout.server.ts` (whole body).
```ts
import { redirect } from '@sveltejs/kit';
import { hasNomination } from '$lib/contestant/tasks';
import { getLocale } from '$lib/paraglide/runtime';
import { buildRoute } from '$lib/routes';

export async function load({ params, parent }) {
  const parentData = await parent();
  if (parentData.gate !== null) return {};

  const nominations = parentData.contestantUserData?.nominations;
  if (!nominations) return {};

  if (!hasNomination(nominations))
    redirect(
      307,
      buildRoute({
        route: 'ContestantAppEntityHome',
        locale: getLocale(),
        entityType: params.entityType,
        entityId: params.entityId
      })
    );

  return {};
}
```
Copy: destructure `params` and `parent` **only**; decide nothing while `parentData.gate !== null`; build the target with `buildRoute` from a route key, `getLocale()` and the two entity params — never the second-argument form `{ params, route, url }` the voter loads use, which takes `route` and `url` from the event. The docstring form is this file's: a numbered list of what the load decides, in order, then a paragraph on which event members it takes and why.

**Composition:** the facts load and the guard are this gate's skeleton with the voter load's temporary `DataRoot` inside. RESEARCH recommends universal loads (*Open Questions* 8); a universal load has no `locals` and its `parent()` also carries the server loads' data. That combination — a universal *layout* load on a contestant path — does not exist on the tree; see *No Analog Found* #3.

### D3 — the guard's tracking test

**Analog:** `ENTITY/(nominated)/layout.tracking.test.ts` (whole file).

**Imports and instruments:**
```ts
import { describe, expect, it, vi } from 'vitest';
import { load } from './+layout.server';
import { forbiddenRoute, recordingParams, recordingUrl } from '../../../loadTracking.testUtils';
import type { Untrack } from '../../../loadTracking.testUtils';
```
(`loadTracking.testUtils.ts` lives at `routes/contestant/(protected)/`; from `nominations/(edit)/` the relative path is one level deeper.)

**The event Proxy** (anchor `function recordingEvent(`):
```ts
  const event = new Proxy(
    {
      fetch: vi.fn(),
      locals: { supabase: { auth: { signOut: vi.fn() } } },
      params,
      parent: async () => ({
        gate: null,
        user: USER,
        entities: [CANDIDATE],
        questionData: QUESTION_DATA,
        contestantUserData: { entity: { type: 'candidate', id: CANDIDATE_ID }, nominations }
      }),
      route: forbiddenRoute(),
      untrack,
      url
    },
    {
      get(target, prop) {
        if (typeof prop === 'string') eventReads.push(prop);
        return Reflect.get(target, prop, target);
      }
    }
  );
```
**The assertions that matter:**
```ts
      expect(trackedReads, 'a tracked url read makes SvelteKit rerun this load on every navigation').toEqual([]);
      …
      expect(
        [...new Set(eventReads)].sort(),
        'the load takes params and parent from the event and nothing else'
      ).toEqual(['params', 'parent']);
```
Copy all three parts: an `it.each` over every address of the group (here the three steps, with and without the editor's search params), both outcomes of the load run to their end (served; `rejects.toMatchObject({ status: 307, location: … })`), and the **three negative controls** at the foot, one per instrument, each over a local load-shaped function and none importing the real `load`. The `parent` fake additionally resolves `appSettingsData`, `electionData` and `constituencyData`.

The entity-level `ENTITY/layout.tracking.test.ts` pins `['fetch', 'locals', 'params', 'parent']` for the entity load; this phase must leave it green (no `depends()`).

---

### D4 — the election and constituency step pages

**Analog:** `routes/(voters)/elections/+page.svelte`.
```svelte
  const voterCtx = getVoterContext();
  const { getRoute, t } = voterCtx;
  // appSettings/dataRoot are reactive accessors — read via voterCtx.X, never destructure.
  const appSettings = $derived(voterCtx.appSettings);
  …
  let selected: Array<Id> = $state([]);
  …
  let canSubmit = $derived(selected?.length > 0);

  async function handleSubmit(): Promise<void> {
    if (!canSubmit) return;
    const electionId = Array.from(selected);
    …
    await goto(
      appSettings.elections?.startFromConstituencyGroup
        ? getRoute.current({ route: 'Questions', electionId, ...nextForward })
        : getRoute.current({ route: 'Constituencies', electionId, constituencyId: undefined, ...nextForward })
    );
  }
```
```svelte
  {#if elections.length}
    …
    <ElectionSelector {elections} bind:selected data-testid="voter-elections-list" />
  {/if}

  {#snippet primaryActions()}
    <Button
      onclick={handleSubmit}
      disabled={!canSubmit}
      variant="main"
      icon="next"
      text={t('common.continue')}
      data-testid="voter-elections-continue" />
  {/snippet}
```
Copy: `async` + awaited `goto`; the list guarded by `{#if elections.length}` (the data root is empty in the server render — RESEARCH N-2 — so UI-SPEC's `<Loading />` goes in the `{:else}`). **Do not copy** the prefill effect `selected = (voterCtx.selectedElections.length ? voterCtx.selectedElections : elections).map((e) => e.id);` — U-17: an entity with no row starts with nothing checked. The hero snippet is not rendered (S4: "no hero").

**Constituencies:** `routes/(voters)/constituencies/+page.svelte` — `let selected = $state<{ [electionId: Id]: Id }>({});`, `let selectionComplete = $state(false);` bound to `ConstituencySelector`, and the dedupe on submit (`Array.from(new Set(Object.values(selected).filter((id) => id)))`). The `dataRoot` comment in that file states the alias rule the contestant page obeys with `contestantCtx.dataRoot.<prop>`.

**`ElectionSelector`'s single-option form is never rendered here** (S3/S4): its effect `if (elections.length === 1 && !selected.length) { selected = [elections[0].id]; …` and `disabled={elections.length === 1}` are why. The U-30 fix lands on its label, anchor `class="label gap-sm cursor-pointer justify-start !p-0"`.

**Route constants** (`lib/routes/route.ts`): beside
```ts
  ContestantAppNominations: `${CONTESTANT_ENTITY}/nominations`,
```
with the route-group directory in the string, as `CONTESTANT_NOMINATED = \`${CONTESTANT_ENTITY}/(nominated)\`` does for its group.

---

### E1 — the details page (`(edit)/details/+page.svelte`)

**Analog for the save surface:** `ENTITY/(nominated)/profile/+page.svelte`.

**Imports that carry over:**
```ts
  import { tick } from 'svelte';
  import { goto, invalidateAll } from '$app/navigation';
  import { MainContent } from '$layouts/main';
  import { Button } from '$lib/components/button';
  import { ErrorMessage } from '$lib/components/errorMessage';
  import PreventNavigation from '$lib/components/preventNavigation/PreventNavigation.svelte';
  import { hasNomination, profileSaveTarget, taskStateOf, unansweredQuestionsOf } from '$lib/contestant/tasks';
  import { entityDescriptorOf } from '$lib/contestant/utils/entityDescriptor';
  import { getContestantContext } from '$lib/contexts/contestant';
  import { getLayoutContext } from '$lib/contexts/layout';
```
**The handler** (anchor `async function handleSubmit(): Promise<void> {`):
```ts
    status = 'loading';
    saveMessage = undefined;
    // A rejection's message can hold the backend's own text, so it is logged and never shown.
    const result = await userData.save().catch((e) => {
      log.error(`[Contestant app profile page] Error saving userData: ${e?.message}`);
      return undefined;
    });
    if (result?.type === 'success') {
      if (result.listedPropertySaved) await rereadEntityList();
      status = 'success';
      // The target is asked only now, of the state the save and the list's re-read left.
      goto(getRoute.current(profileSaveTarget(contestantCtx.taskState).route));
      return;
    }
    if (result?.type === 'nameRefused') {
      nameRefusedFor = contestantCtx.selectedEntity?.id;
      saveMessage = { outcome: 'name-refused', text: t(descriptor.nameRefusedMessage) };
      await rereadEntityList();
      status = 'idle';
    } else {
      saveMessage = { outcome: 'failed', text: t('contestantApp.error.saveFailed') };
      status = 'error';
    }
    // The button was disabled while the save ran, which can cost it its focus.
    await tick();
    actions?.querySelector<HTMLElement>('[data-testid="profile-submit"]')?.focus();
```
```ts
  async function rereadEntityList(): Promise<void> {
    await invalidateAll().catch((e) => {
      log.error(`[Contestant app profile page] Error reading the page data again: ${e?.message}`);
    });
  }
```
Copy: the thrown error logged and never shown; a named refusal as a result branch with its own `outcome`; `invalidateAll()` wrapped so a failed re-read is not a failed save; the target asked **after** the re-read, of `contestantCtx.taskState` read at that moment; focus put back on the button after a refusal. **What K adds** (RESEARCH *Pattern 5*, *Pitfall 8*): `invalidateAll()` after **every** outcome, the bypass set **before** it, `await tick()` before the target is read, and the entity's home as the fallback while `taskState.known` is false.

**The bypass** (anchors `let bypassPreventNavigation = $state(false);`, `function handleCancel(): void {`):
```svelte
<PreventNavigation
  active={() => !bypassPreventNavigation && userData.hasUnsaved && !contestantCtx.answersLocked}
```
```ts
  function handleCancel(): void {
    bypassPreventNavigation = true;
    userData.resetUnsaved();
    goto(getRoute.current('ContestantAppEntityHome')).then(() => (bypassPreventNavigation = false));
  }
```
**The label's prospective state** (anchor `const prospectiveTarget = $derived.by(() => {`) — the block `2026-10-09-176-rules-and-helpers-written-twice.md` item 2 is about; S8 says K "needs 'has a nomination' alone and must not become a third copy".

**The message region and the buttons** (anchor `data-testid="profile-save-message"`):
```svelte
    <!-- The message of a save that stayed on the page. The region is always rendered, so that a message put into it is announced. -->
    <div role="alert" data-testid="profile-save-message" data-outcome={saveMessage?.outcome}>
      {#if saveMessage}
        <ErrorMessage inline message={saveMessage.text} class="mb-lg mt-md" />
      {/if}
    </div>

    <div class="grid w-full justify-items-center" bind:this={actions}>
      …
        <Button
          text={submitLabel}
          onclick={handleSubmit}
          disabled={!canSubmit}
          loading={status === 'loading'}
          loadingText={t('common.saving')}
          type="submit"
          data-testid="profile-submit"
          variant="main"
          icon="next" />
```
**Analog for the card markup:** J (E3) — the `row` snippet, the `<ul>`/`<li>`/`<article aria-labelledby>` list, the `pageStyles.push` effect. A K card is J's card with fields added (UI-SPEC *Spacing Scale*).

**The draft editor itself — per-card kept/new/removed state, the U-20 validation pass and focus-to-first-error — has no analog;** see *No Analog Found* #4.

### E2 — `EntitySelector` (`lib/dynamic-components/entitySelector/`)

**Directory shape:** `lib/dynamic-components/entityList/` — `EntityList.svelte`, `EntityList.type.ts`, `index.ts`:
```ts
export { default as EntityList } from './EntityList.svelte';
export * from './EntityList.type';
```
```ts
import type { SvelteHTMLElements } from 'svelte/elements';
import type { EntityCardProps } from '$lib/dynamic-components/entityCard';

export type EntityListProps = SvelteHTMLElements['div'] & {
  /**
   * The properties for the `EntityCard`s to show.
   */
  cards: Array<EntityCardProps>;
```
Props are `SvelteHTMLElements['fieldset'] & {…}` here, each with a TSDoc line; rest props spread through `concatClass(restProps, '…')` (`import { concatClass } from '$lib/utils/components';`); `t` from `getComponentContext()` (`import { getComponentContext } from '$lib/contexts/component';`), as `EntityList.svelte` does.

**A native radio group** — `lib/components/questions/QuestionChoices.svelte`:
```svelte
<fieldset
  …
  data-testid="question-choices"
  {...concatClass(restProps, fieldsetClass)}>
  <!-- Add a label for screen readers -->
  <legend class="sr-only">{text}</legend>
```
```svelte
        <!-- bind: keep — … two-way DOM radio group bind:group={selected}, selected is $state. … -->
        <input
          type="radio"
          class={cn(
            'radio-primary radio border-lg bg-base-100 relative h-32 w-32 …',
            …
          )}
          name="questionChoices-{question.id}"
          …
          value={id}
          data-testid="question-choice"
          bind:this={inputs[id]}
          bind:group={selected}
```
Copy: `<fieldset>` + `<legend>`, `radio radio-primary`, one shared `name`, `bind:group`, and the `<!-- bind: keep — … -->` comment the project writes above a `bind:`. **Do not copy** its `onclick`/`onkeyup` handlers or `use:onKeyboardFocusOut` — S7 wants the native keyboard model alone (RESEARCH *Don't Hand-Roll*). The group name comes from `getUUID()` (`ElectionSelector.svelte`: `const groupName = getUUID();`).

**An entity rendered compactly** — `routes/contestant/(protected)/+page.svelte` builds `EntityCardProps` from the data root:
```ts
            entity: contestantCtx.dataRoot.getEntity(type, id),
            …
            headerOnly: true,
            showType: true,
```
and provides the entities first (anchor `setDataRoot((dr) => dr.update(() => dr.provideEntityData(entities.map(userEntityData))));`). S7 uses `variant="subcard" headerOnly action={false}` with no `showType`. **Two things the selection page's docstring gets wrong for this phase** (RESEARCH T-6): `provideEntityData` is an upsert and resets nothing, so (a) the sentence "the entity layout resets the root's entity collections" is not a rule to rely on, and (b) the selector's options are **the ids of the RPC's answer, each resolved in the root** — never "every organization the root holds".

**Component test:** `lib/components/questions/QuestionChoices.svelte.test.ts` and `lib/contestant/components/notEditableNote/NotEditableNote.svelte.test.ts` for a mounted component with a mocked context; the mount frame is E3's.

After the component lands: the `@component` docstring, `yarn workspace @openvaa/docs generate:docs`, and the re-check list at the end of `.claude/skills/components/SKILL.md`.

### E3 — J (`ENTITY/nominations/+page.svelte`) and its test

**Analog:** the page itself. What is on it today and what changes:

| Anchor | Change |
|---|---|
| `const locked = $derived(contestantCtx.nominationsLocked);` | the note is shown under either lock (D-13); "editable" is one predicate, not written out on the page |
| `<NotEditableNote reason="nominationsLocked" data-testid="contestant-nominations-locked-note" />` | the reason follows which lock is on; the test id stays |
| `data-nominations-locked={locked ? 'true' : 'false'}>` | plus `data-nominations-editable` |
| `<p class="text-center">{t(descriptor.nominationsDescription)}</p>` | `nominationsDescriptionEditable` in J1 |
| `<ul class="mt-lg gap-lg flex list-none flex-col self-stretch pl-0" data-testid="contestant-nominations-list">` | `role="list"` (F4) |
| `<dl class="mt-12 flex flex-col gap-12">` and `<p class="small-info mt-12" data-testid="nomination-pending-note">` | `mt-md` / `gap-md` — **three** numeric classes, not two (RESEARCH F4) |
| `{#if nomination.parent}` … `'nomination-parent'` | plus the requested-parent row (U-10) read from `customData` |
| `<p class="text-center" data-testid="contestant-nominations-empty">{t(descriptor.nominationsEmpty)}</p>` | `data-empty="define\|locked\|noElection"`, three sentences |
| `{#if !locked}` `<ContactSupport class="mt-lg" />` | only in J5 |
| `const target = $derived(nominationsViewTarget(contestantCtx.taskState));` | a second argument (S2) |
| `data-action={target.continues ? 'continue' : 'return'} />` | gains `define`; the Edit `Button` under it in J1 |

**The row snippet, reused by K's cards:**
```svelte
{#snippet row(label: string, value: string | undefined, testId: string)}
  <div>
    <dt class="small-info uc-first">{label}</dt>
    <dd class="mt-xs [overflow-wrap:anywhere]" data-testid={testId}>{value}</dd>
  </div>
{/snippet}
```
**The shaded page while cards are listed:**
```ts
  $effect(() => {
    if (viewState === 'listed') return pageStyles.push({ drawer: { background: 'bg-base-200' } });
  });
```
The page's `@component` docstring ("Nothing on the page can be edited", "### Settings — `access.nominationsLocked` … The answers lock does not show it") is rewritten with the page.

**Test analog:** `ENTITY/nominations/page.svelte.test.ts`.
```ts
/** Everything the page reads from the contestant context. */
type Box = {
  selectedEntity: UserEntity | undefined;
  nominations: ReadonlyArray<EntityNomination> | undefined;
  nominationsLocked: boolean;
  answersLocked: boolean;
  taskState: TaskState;
};
…
let box = $state.raw<Box>(EMPTY_BOX);
…
const context = {
  t: (key: string) => key,
  getRoute: { current: (options: RouteOptions) => { … return `/route/${route}${questionId ? `/${questionId}` : ''}`; } },
  appSettings: { admin: { email: 'support@example.org' } },
  get dataRoot(): never {
    throw new Error('the page read the data root');
  },
  get nominations() {
    return box.nominations;
  },
  …
};

vi.mock('$lib/contexts/contestant', () => ({ getContestantContext: () => context }));
vi.mock('$lib/contexts/component', () => ({ … }));
vi.mock('$lib/contexts/layout', () => ({ … }));
…
const Page = (await import('./+page.svelte')).default;
```
Copy: one raw state box behind getters ("as the real accessors are"); task states built with the real `taskStateOf`; messages are their keys and a route is its name; the `matchMedia` stub; the dynamic import after the mocks; a numbered header saying what the file holds. For J the page will read page data for the two facts, so `$app/state` joins the mocks. For the **details page's** test RESEARCH asks for the real page, layout, provider and store (A3) — that is the method of `176-19` (see `P176/176-19-SUMMARY.md`), not this fake context.

### E4 — `taskState.ts`

**Analog:** itself. Four anchored changes.

1. `export type TaskRoute =` — a closed union of six `{ route: '…' }` members; the editor's entry is the seventh.
2. Rule 2 of `taskStateOf` (anchor `// 2. No nomination. This is decided before any question input is read`):
   ```ts
       tasks: [
         { id: 'nomination', status: 'incomplete', route: { route: 'ContestantAppNominations' } },
         …
       nextStep: { task: 'nomination', route: { route: 'ContestantAppNominations' } },
   ```
   Both routes become the entry when a new `TaskStateInput` member says nominations are editable. Each member of `TaskStateInput` has a one-line TSDoc saying what the caller has already read.
3. The sixth function follows `profileSaveTarget`:
   ```ts
   export function profileSaveTarget(state: TaskState): ContinueTarget {
     const next = state.nextStep;
     if (next?.task === 'questions') return { route: copyOf(next.route), continues: true };
     return { route: { route: 'ContestantAppEntityHome' }, continues: false };
   }
   ```
4. `nominationsViewTarget` takes a fact from J the way `questionSaveTarget` takes one from its page:
   ```ts
   /** What a question page read before it saved an answer. */
   export type QuestionSaveFacts = {
     /** Whether the question had no saved answer before the save. … */
     wasUnanswered: boolean;
   };
   …
   export function questionSaveTarget(state: TaskState, facts: QuestionSaveFacts): ContinueTarget {
   ```
   and today:
   ```ts
   export function nominationsViewTarget(state: TaskState): ContinueTarget | undefined {
     if (!state.known) return undefined;
     const next = state.nextStep;
     if (!next || next.task === 'nomination') return { route: { route: 'ContestantAppEntityHome' }, continues: false };
     return { route: copyOf(next.route), continues: true };
   }
   ```
**Module contract** (its header): "the module imports nothing"; "every function is pure and returns fresh objects" (`copyOf`); "'Not known' is stated in `taskStateOf` alone". `taskLabelKey` is untouched (OD09-C5). The context hands the new input over inside `#taskState = $derived.by(() => {` in `contestantContext.svelte.ts`, whose own comment is the rule: "Every input is read here, in this derived's own scope, and handed over as a value." D-14's unit case (an answer outside the applicable set changes nothing) goes into `taskState.test.ts`.

**Every reader of `TaskRoute`** is a population to re-derive (`grep -rln "ContestantAppNominations" apps/frontend/src tests/tests`): today the context test, `LogoutButton.svelte.test.ts`, `ContestantNav.svelte` and its test, the home's `page.svelte.test.ts`, and `routes/contestant/(protected)/[...page=contestantEntityPage]/+page.server.ts`.

### E5 — `entityDescriptor.ts`

**Analog:** itself. A member is three edits: the type (with a TSDoc line), the candidate object, the organization object.
```ts
  /** The key of the sentence above the entity's nominations. */
  nominationsDescription: TranslationKey;
  /** The key of the sentence the nominations view shows in place of the nominations while the entity has none: what is missing and whom to ask. */
  nominationsEmpty: TranslationKey;
```
```ts
    nominationsDescription: 'contestantApp.nominations.description.candidate',
    nominationsEmpty: 'contestantApp.nominations.empty.candidate',
    nominationParentLabel: 'common.electionList',
    electionSymbolLabel: 'common.electionSymbol.candidate',
```
`} as const satisfies Record<ServedEntityType, EntityDescriptor>;` makes a missing member a type error. The thirteen members and their keys are UI-SPEC *Shared premises*. `entityDescriptor.test.ts` is extended.

### E6 — `NotEditableNote`

`NotEditableNote.type.ts`, anchor `reason: 'answersLocked' | 'nominationsLocked';` — a third literal. `NotEditableNote.svelte`:
```ts
  const REASON_MESSAGE: Record<NotEditableNoteProps['reason'], TranslationKey> = {
    answersLocked: 'contestantApp.common.editingNotAllowed',
    nominationsLocked: 'contestantApp.common.nominationsNotEditable'
  };
```
The `Record` over the union makes the missing entry a type error; the `@component` docstring's `reason` list gains the value; `<Warning {...restProps} data-reason={reason}>` already publishes it for the fixture.

### E7 — the small inherited edits

| File | Anchor | Change |
|---|---|---|
| `ENTITY/+page.svelte` | `<ol class="mt-lg w-full list-none pl-0"` | `role="list"` (F4); no accepted-warning comment is needed on svelte 5.57.1 (RESEARCH F4) |
| `contestantUserDataState.svelte.ts` | `// React to \`answersLocked\` to clear edited data` … `draft?.answers.set({});` / `this.#staged = {};` | guard both writes (F6); a case in `contestantUserDataState.svelte.test.ts` that `current` keeps its identity |
| `ENTITY/(nominated)/preview/+page.server.ts` | `Without an answer nothing is redirected, so the entity layout's own error view is shown and not hidden behind a redirect.` | docstring corrected (F8); behaviour unchanged |
| `ElectionSelector.svelte` | `class="label gap-sm cursor-pointer justify-start !p-0"` | `whitespace-normal` (U-30) |

### E8 — the catalogues

`apps/frontend/messages/<locale>/contestantApp.nominations.json` and `contestantApp.common.json`, seven locales (`da, en, et, fi, fr, lb, sv`), the same key set and placeholder set in each; 55 keys (UI-SPEC *New messages*); then `yarn workspace @openvaa/frontend generate:translation-key-type`. **One task owns every new key** (UI-SPEC).

---

### F1 — the new perm template

**Analog:** `packages/dev-seed/src/templates/e2e/perm/perm-no-nomination.ts` (whole file).

**Header:** topology in one line; "What each row is for" as a bullet per row; "Settings:"; "Prefix discipline:".
```ts
import { LIKERT_5_EN, MINIMAL_BASE_APP_SETTINGS } from './shared';
import type { Template } from '../../../template/types';

const P = 'e2e-perm-no-nomination-';

export const permNoNominationTemplate: Template = {
  seed: 42,
  externalIdPrefix: P,
  generateTranslationsForAllLocales: false,

  elections: {
    count: 0,
    fixed: [
      {
        external_id: 'el-1',
        name: { en: '[EL-1] Nomination Election', fi: '[EL-1] Ehdokasasetteluvaalit' },
        short_name: { en: 'EL-1' },
        election_type: 'organization_list',
        …
        current_round: 1,
        constituency_groups: [{ external_id: `${P}cg-1` }]
      }
```
**Both entity types served — the `contestantApp` root restated whole:**
```ts
        settings: {
          ...MINIMAL_BASE_APP_SETTINGS,
          contestantApp: {
            questions: {
              hideHero: false,
              hideVideo: false
            },
            entityTypes: ['candidate', 'organization'],
            registrationModes: {
              candidate: ['email', 'code'],
              organization: []
            }
          }
        }
```
**A nomination row:**
```ts
  // The one seeded nomination, under no parent. It does not state `entity_type`: the column is generated from the entity reference.
  nominations: {
    count: 0,
    fixed: [
      {
        external_id: 'nom-ca-nominated',
        election_symbol: '7',
        candidate: { external_id: `${P}ca-nominated` },
        election: { external_id: `${P}el-1` },
        constituency: { external_id: `${P}co-1` },
        election_round: 1
      }
```
Copy: bare row external ids, prefixed nested references, semantic hyphenated slugs ("which no generator emits"), `count: 0` on every collection, `alliances: { count: 0 }` replaced by fixed rows here. The new dataset's content is D-23 + U-27 (a long election name; logos or passing colours on parties and alliances; one `organization_list` election, one of the new type; an alliance with no nomination at a pair; a confirmed nomination; for NOM-08, questions scoped by election or constituency).

**Registration, three lines in `packages/dev-seed/src/templates/index.ts`:** `import { permNoNominationTemplate } from './e2e/perm/perm-no-nomination';`, `'perm-no-nomination': permNoNominationTemplate,` with a comment above it, `export { permNoNominationTemplate } from './e2e/perm/perm-no-nomination';`. **And one row** in `packages/dev-seed/tests/templates/built-in-templates-contestant-app.test.ts` (anchors `'perm-no-nomination': {`, `name === 'perm-no-nomination'`, `.filter((family) => family === 'perm-no-nomination')`).

**This template itself is re-typed** (`election_type: 'organization_list'` → the new default) in the same commit as the rule, whatever else is decided: its fixture's `setNominationState` writes a party-less candidate through `bulk_import` (RESEARCH RQ-1, *Pitfall 10*).

### F2 — re-typing and the census test

**Population, derived at plan time:** `grep -rn "election_type" packages/dev-seed/src` — every template that states a type, `_helpers/buildMinimal.ts` (`election_type: 'organization_list',`), `generators/ElectionsGenerator.ts` (`election_type: 'candidate_only',`).

**Census-test analog:** `packages/dev-seed/tests/assertKnownRowProps.builtins.test.ts`.
```ts
import { describe, expect, it } from 'vitest';
import { assertKnownRowProps } from '../src/assertKnownRowProps';
import { fanOutLocales } from '../src/locales';
import { runPipeline } from '../src/pipeline';
…
import { BUILT_IN_OVERRIDES, BUILT_IN_TEMPLATES } from '../src/templates';
```
Copy from its header: "**It iterates the REGISTRY, never a list of names**" (`Object.keys(BUILT_IN_TEMPLATES)`), a floor assertion so an empty registry cannot pass vacuously, and a failure line that carries template name, collection, the row's `external_id` and the offence (`describeOffense`). The classifier is the four-row matrix; the expected count of refused rows is zero.

---

### G1 — data module, fixture module, setup and teardown

**Data module analog:** `tests/tests/utils/permNoNominationData.ts`.
```ts
import path from 'path';
import { TEST_CANDIDATE_PASSWORD } from './testCredentials';
import { TESTS_DIR } from './testsDir';
import type { EntityGrantTarget } from './supabaseAdminClient';
…
/** The `external_id` prefix of every row of the dataset, and the prefix its teardown deletes. */
export const NO_NOMINATION_PREFIX = 'e2e-perm-no-nomination-';
…
export const UNNOMINATED_CANDIDATE_GRANT: EntityGrantTarget = Object.freeze({
  entityType: 'candidate',
  externalId: UNNOMINATED_CANDIDATE_EXTERNAL_ID
});

/** Email of the unnominated candidate's editor. */
export const UNNOMINATED_CANDIDATE_EDITOR_EMAIL = `${UNNOMINATED_CANDIDATE_EXTERNAL_ID}@test.openvaa.local`;
```
Copy: literals that repeat the template ("so that a change to the template cannot make this module throw at import"), one `…_GRANT`, `…_EDITOR_EMAIL` and `…_STORAGE_STATE` (`'../playwright/.auth/<dataset>-<who>.json'`) per editor, the SECURITY note on the addresses.

**Fixture-module analog:** `tests/tests/fixtures/contestant/perm-no-nomination.ts`.
- The `@file` header: "Composition root for …", "Surface:", the paragraph on state steps ("each writes with the service role, past the rules that bind an entity's own editor, and writes only what it is given"), "the step after a state step is a full page load", and the **Rigidity contract** line.
- `export const test = base.extend<…Fixtures>({ contestantNominationsPage: async ({ page }, use) => { await use(createContestantNominationsPage(page, new SupabaseAdminClient())); }, … });` and `export { expect };`
- `…PagesOf(page)` for a scan entry's `reach`, which is handed a page alone.
- A state step:
  ```ts
  export async function setNominationState(entity: EntityGrantTarget, state: NominationState): Promise<void> {
    const step = 'setNominationState';
    …
    const admin = new SupabaseAdminClient();
    const entityId = await admin.entityId(entity);

    const found = await admin.findData('nominations', { [nominationColumn]: { $eq: entityId } });
    if (found.type !== 'success') throw new Error(`${step}: reading the nominations failed: ${found.cause}`);
    …
    await admin.bulkImport({
      nominations: [
        {
          external_id: nomination.externalId,
          project_id: projectId,
          [entity.entityType]: { external_id: entity.externalId },
          election: { external_id: ELECTION_EXTERNAL_ID },
          constituency: { external_id: CONSTITUENCY_EXTERNAL_ID },
          election_round: NOMINATION_ELECTION_ROUND,
          election_symbol: nomination.electionSymbol,
          confirmed
        }
      ]
    });
  }
  ```
- One key of a settings root (UI-SPEC T-2):
  ```ts
  export async function setNominationsLocked(on: boolean): Promise<void> {
    await new SupabaseAdminClient().updateAppSettings({ access: { nominationsLocked: on } });
  }
  ```
  The new module's state steps are UI-SPEC *Fixtures*, last row: an entity's nominations; either lock; an election's type (J5); whether a party is confirmed (U-04); a second nomination in one election (U-02). A step that writes a nomination is bound by the shape rule (the service role included), so a written row must be one its election admits.

**Page-fixture analog (for `contestantNominationEditor.fixture.ts`):** `tests/tests/fixtures/contestant/contestantNominationsPage.fixture.ts` — the `@file` header with a **Surface** list of one line per step (`open(entity) — load the view under the entity.` …), `export function create…(page: Page, admin: SupabaseAdminClient) { return { async open(entity: EntityGrantTarget): Promise<void> { … } }; }` and `export type …Fixture = ReturnType<typeof create…>;`. State is read from `data-*` attributes; a name is read as text.

**Setup analog:** `tests/tests/setup/perm/perm-no-nomination.setup.ts`.
```ts
    await setupFromTemplate('perm-no-nomination', {
      extraTeardownPrefix: ['test-', 'e2e-perm-']
    });

    await inFreshContext(browser, baseURL, (page) =>
      registerAndStoreSession(page, {
        entityGrants: [UNNOMINATED_CANDIDATE_GRANT],
        email: UNNOMINATED_CANDIDATE_EDITOR_EMAIL,
        password: NO_NOMINATION_PASSWORD,
        storageStatePath: UNNOMINATED_CANDIDATE_STORAGE_STATE,
        acceptTermsOfUse: true,
        settledTestId: testIds.contestant.home.statusMessage
      })
    );
```
Copy: `setup.setTimeout(TIMEOUTS.testMax)`, one fresh browser context per registration (`inFreshContext`), the header's "What it leaves behind". `perm-startfromcg.setup.ts` is today three lines of `setupFromTemplate`; it gains one `registerAndStoreSession` in this form and its teardown one `unregisterCandidate`.

**Teardown analog:** `perm-no-nomination.teardown.ts`.
```ts
// A plain string literal: the Playwright configuration reads it from this file's text to check that no two teardowns own overlapping prefixes.
const PREFIX = 'e2e-perm-no-nomination-';

teardown('delete perm-no-nomination dataset', async () => {
  expect(PREFIX, 'the prefix deleted here is the one the dataset is seeded under').toBe(NO_NOMINATION_PREFIX);

  const client = new SupabaseAdminClient();
  await client.unregisterCandidate(UNNOMINATED_CANDIDATE_EDITOR_EMAIL);
  …
  await runTeardownAsserted(PREFIX, client);

  for (const storageStatePath of [ … ]) {
    if (fs.existsSync(storageStatePath)) fs.unlinkSync(storageStatePath);
  }
});
```
**Something new for the teardown to account for:** K writes nominations with **no external id** (the entity user cannot set one — `enforce_nomination_entity_columns`), and placeholder parent rows likewise, so the prefix does not name them. The four entity foreign keys of `schema/104-nominations.sql` are `ON DELETE CASCADE` (anchor `candidate_id uuid REFERENCES public.candidates (id) ON DELETE CASCADE,`), so deleting the dataset's entities takes such rows with them — but `parent_nomination_id` is `ON DELETE NO ACTION`, so a party's cascade is refused while a candidate's nomination still points at the party's row, and the order in which the teardown deletes the entity tables then matters. How `runTeardownAsserted`'s accounting reads rows it did not delete by prefix was not read here (see *Items the Planner Must Resolve* 6).

### G2 — `tests/playwright.config.ts`

**Analog:** the `perm-no-nomination` trio.
```ts
  {
    name: 'data-setup-perm-no-nomination',
    testMatch: /perm-no-nomination\.setup\.ts/,
    teardown: 'data-teardown-perm-no-nomination',
    dependencies: ['perm-organization-editing']
  },
  {
    name: 'data-teardown-perm-no-nomination',
    testMatch: /perm-no-nomination\.teardown\.ts/,
    // reason: the accounting assertion in runTeardownAsserted is state-mutating — a retry always observes an already-cleared prefix (0/0/0) and passes, …
    retries: 0
  },
  {
    name: 'perm-no-nomination',
    testDir: './tests/specs/perm',
    testMatch: /perm-no-nomination\.spec\.ts/,
    fullyParallel: false,
    use: { ...devices['Desktop Chrome'] },
    dependencies: ['data-setup-perm-no-nomination']
  },
```
The chain is strictly serial over one settings row: the next link is `data-setup-perm-analytics-tracking` with `dependencies: ['perm-no-nomination']`. Inserting the new trio means its setup depends on the previous **spec** project and the following setup is re-pointed at the new spec project; the chain comment (anchor `→ perm-organization-editing → perm-no-nomination → voter-prefs-tracking`) and the one-paragraph project comment above the trio are written with it. No `storageState` on the project: the spec selects a session per describe.

### G3 — the specs

**Analog for `contestant-nominations.spec.ts`:** `tests/tests/specs/perm/perm-no-nomination.spec.ts`.
- `@file` header paragraphs: what the spec covers and on which dataset; **Sessions**; **Order and state** ("no test depends on a test before it. Every test begins with a state step…"); **Titles carry the prefix of the surface they are about**; **Scans**; **Widths**; **Rigidity contract**.
- A session per describe: `test.use({ storageState: UNNOMINATED_CANDIDATE_STORAGE_STATE });`
- A test body in fixture steps only:
  ```ts
      await setNominationState(UNNOMINATED_CANDIDATE_GRANT, 'none');
      await contestantEntityHomePage.open();
      await contestantEntityHomePage.expectLanded(UNNOMINATED_CANDIDATE_GRANT);
  ```
- Scan entries (anchor `const LOCKED_SCANS: ReadonlyArray<ContestantAxeRoute> = [`):
  ```ts
    {
      // The view of a candidate with no nomination while nominations are locked: …
      // Anchor on the empty sentence; marker: the note, which the view renders only while nominations are locked.
      name: 'no-nomination-nominations-locked',
      fixture: 'raw',
      routeId: 'ContestantAppNominations',
      contentTestId: testIds.contestant.nominations.empty,
      postLoginTestId: testIds.contestant.nominations.lockedNote,
      reach: async (page) => {
        const { contestantNominationsPage } = noNominationPagesOf(page);
        await setNominationState(UNNOMINATED_CANDIDATE_GRANT, 'none');
        await setNominationsLocked(true);
        // A full page load: the lock is a setting, read when a page is loaded.
        await contestantNominationsPage.open(UNNOMINATED_CANDIDATE_GRANT);
        …
      }
    },
  ```
  declared with `for (const entry of …) { declareScans(entry); }` under a describe whose `test.afterEach(async () => { await setNominationsLocked(false); });` puts the project's one settings row back. Eight entries, sixteen scans (UI-SPEC *Axe Scan Entries*).
- Phone widths: `const PHONE_VIEWPORTS = [{ width: 320, height: 568 }, { width: 390, height: 844 }];` and `for (const viewport of PHONE_VIEWPORTS) { test.describe(\`…: at ${viewport.width}px wide\`, …`, measured through `fixtures/shared/pageGeometry.fixture.ts`.
- The tag `@nomination-definition` on the covering tests (D-23; Phase 179's gate looks for it).

**`perm-startfromcg.spec.ts` extended, not paralleled.** Its frame stays:
```ts
test.describe('perm-startfromcg', () => {
  test.describe.configure({ mode: 'serial' });
  …
  test.beforeAll(async () => {
    client = new SupabaseAdminClient();
    const findResult = await client.findData('constituencyGroups', {
      externalId: { $eq: 'e2e-perm-startfromcg-cg-2' }
    });
    …
    await client.updateAppSettings({
      elections: { startFromConstituencyGroup: cgDocumentId }
    });
  });

  test.afterAll(async () => {
    if (client) {
      await client.updateAppSettings({
        elections: { startFromConstituencyGroup: priorStartFromCg ?? null }
      });
    }
  });
```
The file imports `test` from `@playwright/test` and holds raw locators (`page.getByTestId(testIds.voter.elections.list)`); the contestant tests speak in the editor fixture, so the file's `test` becomes a fixture-extended one or the contestant block takes its fixtures from a composition root — a named decision. The voter cases' assertions do not change (D-15). Its header's `Prefix: 'test-perm-startfromcg-'` (setup) disagrees with the id the spec reads (`'e2e-perm-startfromcg-cg-2'`); re-read before anything is anchored on it.

**Existing tests that change** are populations (UI-SPEC *Locator Contract*): `grep -n "expectButton('return')" tests/tests/specs/perm/perm-no-nomination.spec.ts`; the `NO_NOMINATION_SENTENCE` constant and the `no-nomination-nominations-empty` entry; `cand-nominations` in `tests/tests/specs/a11y/contestant-a11y.spec.ts`, whose reach today asserts `toHaveAttribute('data-action', 'return'` and gains `data-nominations-editable="true"`.

### G4 — `testIds.ts` and the wiring gate

`tests/tests/utils/testIds.ts`, the `contestant.nominations` block — one line per id with a comment above naming the state attributes it carries:
```ts
      // The nominations page. Carries data-nominations-state="listed" | "empty" and data-nominations-locked="true" | "false".
      page: 'contestant-nominations',
      …
      // The page's one main button. Carries data-action="continue" | "return".
      continue: 'contestant-nominations-continue'
```
The additions are verbatim in UI-SPEC *Locator Contract* (`contestant.nominations.edit`, `.requestedParent`; `contestant.nominationEditor.*`; `shared.entitySelector.*`). `scripts/assert-a11y-scan-wiring.mjs`: beside `const NO_NOMINATION_SPEC = path.resolve(REPO_ROOT, 'tests', 'tests', 'specs', 'perm', 'perm-no-nomination.spec.ts');` and `{ label: 'specs/perm/perm-no-nomination.spec.ts', src: noNominationSrc, gate: null },`.

---

### H1 — `177-gates.sh`, `177-e2e.sh`, `177-verdict.mjs`

**Analogs:** `P176/176-gates.sh`, `P176/176-e2e.sh`, `P176/176-verdict.mjs` — copied and re-labelled, as 176's were from 174's. What each fixes, by its own header:

**`176-gates.sh`** — "one row per gate, each status read directly". Fourteen rows in a fixed order (`typecheck`, `lint`, `db-reset`, `types-regen`, `types-clean`, `pgtap`, `sql-lint`, `integration`, `unit`, `check-frontend`, `build`, `format`, `docs-links`, `name-gate-self-test`), every one with `TURBO_FORCE=true`. Rules to keep word for word:
- "Every row runs as `cmd > "$DIR/NN-name.log" 2>&1; s=$?` -- never through a pipe -- and `name<TAB>status<TAB>seconds` is appended to summary.tsv. Every row runs even after a red one."
- "The order of the database rows is fixed: the reset, then the types on the freshly reset database, then pgTAP, then the SQL lint, then the integration test." (`yarn db:types` after pgTAP picks up the helpers pgTAP's first file commits into `public`.)
- "Never in the foreground: start it in the background and poll the marker" (`done`).
- Refusals with exit 2: a dirty tree outside `.planning/` other than the untracked `CAND-APP-PLAN.md`; a label that already holds a run (`<label>-r2`); with `db-reset` selected, "an E2E run in flight, which the reset would destroy".
- `power.txt` — `pmset -g batt` at the start and the end and the host's Sleep entries inside the window.
- Output under `tests/e2e-runs/176-gates/<label>/` → `tests/e2e-runs/177-gates/<label>/`.

**This phase's schema plan needs the database rows early and often**; the `--rows` subset form is how (`bash PD/177-gates.sh <label> --rows db-reset,types-regen,types-clean,pgtap,sql-lint`). `db-reset` destroys the E2E project's rows — **another agent shares this stack**; the driver's in-flight refusal is what protects its run.

**`176-e2e.sh`** — one wrapper run and its cardinal-rule verdict: `docker builder prune -af` first; refuses under 13.8 GiB in the Docker VM; refuses a held `FRONTEND_PORT`; runs `tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/176-e2e/<label> --no-db-reset [--project …]`; "Only the wrapper makes a run VOID" (status 8, `VOID-host-suspend.txt`); `--require-project <name>` repeatable; "It never deletes anything under tests/e2e-runs/."

**`176-verdict.mjs`** — subcommands `dir`, `gates`, `e2e`, `control`, `determinism`, `scope`, `hygiene`. The ones this phase leans on:
- `e2e <label> --same-projects-as <label-or-path> --except <project>=<delta>` — the new spec's project is an `--except <project>=+`-style expectation, `contestant-a11y-scan` stays equal, `perm-no-nomination` and `perm-startfromcg` move by their measured deltas;
- `--expect-title-count <project>::<substring>=<n>` — the sixteen new scans;
- `determinism <ledger-dir> --project <name> --runs <n>` — D-27's three isolated runs, made with `tests/scripts/determinism-batch.sh --runs 3 --project <new spec's project> --ledger-dir tests/e2e-runs/177-determinism/<label>` (the form `P176/176-19-PLAN.md` uses);
- `scope` — refuses a changed path under `REFUSED_PATHS` (Edge Functions, auth configuration, hooks, auth API routes); the constant is re-read for this phase's footprint, which touches none of them;
- constants to re-point: `ALL_ROWS`, `ROOTS` (`tests/e2e-runs/176-…/`), `BASE_FILE = path.join(PHASE_DIR, '176-BASE')`, `OPERATOR_FILE = 'CAND-APP-PLAN.md'`.

---

## Shared Patterns

### Context reactivity (every `.svelte` file this phase writes)
**Source:** `ENTITY/nominations/+page.svelte`
```ts
  // nominations, nominationsLocked, taskState and selectedEntity are reactive accessors: read via contestantCtx.X inside the tracking scope, never destructured.
  const contestantCtx = getContestantContext();
  const { getRoute, t } = contestantCtx;
  const { pageStyles } = getLayoutContext();
  …
  const descriptor = $derived(entityDescriptorOf(contestantCtx.selectedEntity?.type));
```
Stable refs (`t`, `getRoute`, `userData`) are destructured; everything else is read as `contestantCtx.X`. `dataRoot` is never bound to an alias: the selectors' `elections` and the selector's options are derived from `contestantCtx.dataRoot.<prop>` in the consuming scope. Script sections are separated by the `////////////////////////////////////////////////////////////////////` banner with a `// Get contexts`-style title.

### One page per route, one descriptor per type
**Source:** `lib/contestant/utils/entityDescriptor.ts` — "Everything that differs between the pages of two entity types. A page reads the members and never the type." No `{#if type === 'organization'}` and no ternary on the type in a page; a string that differs gets one key per type.

### A contestant load on the entity path reads no `url` and no `route`
**Source:** `ENTITY/(nominated)/+layout.server.ts` and its `layout.tracking.test.ts` (D2, D3). Applies to the facts load and the guard; the three step `+page.ts` loads are the only ones that read `url`. The entity-level load is not changed (no `depends()`); `invalidateAll()` is what reruns it.

### A pure helper receives values
**Source:** `lib/contestant/tasks/taskState.ts` header — "CALLER CONTRACT: every function takes values the caller has already read … this module is never given the context or the data root. Every function is pure and returns fresh objects." Applies to the ordering module (a `DataRoot` and settings handed in, as `impliedParams.ts`), the data package's matrix functions, the sixth target function and the "editable" / "admissible" predicates — each asked through one function, never written out on a page.

### A definer function answers `NULL`; a refusal is not an empty list
**Source:** `get_entity_nominations` (schema) → `parseEntityNominations` (`if (raw === null) return null;`) → `_getEntityUserData` (`if (rows === null) return undefined;`). Applies to the parent-options RPC, its parse module and the writer method: a refused read must reach the details page as "the options cannot be read" (`data-editor-state="error"`), never as "no party is listed".

### Row-level security refuses UPDATE and DELETE silently
**Source:** `23-nominations-write.test.sql`, `pg_temp.try_edit_nomination` and its `GET DIAGNOSTICS v_rows = ROW_COUNT;`; `upsert_answers`' `IF NOT FOUND THEN RAISE EXCEPTION`. Applies to every `UPDATE` and `DELETE` in `set_entity_nominations` and to every pgTAP assertion of the lock on those verbs (`lives_ok` then the unchanged value, or the function raising).

### Schema edits, regeneration, comments
- One regeneration of `apps/supabase/supabase/migrations/00001_initial_schema.sql` (`yarn schema:regenerate`) in the same commit as the schema edit; then `yarn db:types`; then `yarn db:lint:sql` on the applied database — the first thing measured is `SET CONSTRAINTS` inside the write function (RESEARCH A2).
- SQL comments describe the rule as it is now, in the form of the headers excerpted above: `-- <name>: <what it answers>`, then why it is a trigger / definer / invoker, then what it returns on no row, then which pgTAP file pins it.
- Several pgTAP headers and voter route comments on the tree carry historical narrative and plan ids (`23-…`'s "162-12 gives …", "⚠ THE ORDINAL IS FROM THE RATIFIED REGISTRY"; `08-…`'s "This block used to INSERT …"). They are analogs for **structure**, not for comment style: new and touched comments follow `CLAUDE.md` § *Comment Hygiene* (no history, no planning references beyond `see phase N`).

### E2E discipline
**Source:** `tests/tests/fixtures/contestant/perm-no-nomination.ts` and the spec header. No locator in a spec body; every test writes the state it reads; a setting flipped is restored in a `finally` / `afterEach` and followed by a full page load; hard assertions only; the full run is `177-e2e.sh` (never `yarn test:e2e` against a hand-started server), judged by `177-verdict.mjs`, with a void run decided by the wrapper's marker alone.

---

## No Analog Found

| # | File / construct | Role | Data Flow | Reason | What to use instead |
|---|---|---|---|---|---|
| 1 | `CREATE CONSTRAINT TRIGGER … DEFERRABLE INITIALLY DEFERRED` in `schema/104-nominations.sql`, and `SET CONSTRAINTS … IMMEDIATE` inside a function | migration | event-driven | The project has no constraint trigger and no `SET CONSTRAINTS` anywhere (RESEARCH RQ-4, design fact 4) | RESEARCH § *RQ-4* (the measured statement and table T1–U3) and § *Code Examples*; the registration comment form is A3's; the database skill's trigger conventions gain it |
| 2 | A radio group whose options are `EntityCard`s under an `aria-hidden` wrapper with a row-covering `<label>` (`EntitySelector`) | component | event-driven | `QuestionChoices` is the only native radio group and is a horizontal scale with custom handlers; `EntityList` renders links | UI-SPEC § *S7* (the markup contract); E2 for the three partial analogs |
| 3 | A universal **layout** load on a contestant path (`nominations/+layout.ts`, `(edit)/+layout.ts`) | route load | request-response | Every contestant load on the entity path is a `+layout.server.ts` / `+page.server.ts`; the universal loads that build a temporary `DataRoot` are voter **page** loads that read `url` | D2: the gate's skeleton (`params` + `parent` only, `buildRoute` with `getLocale()`) around the voter load's `DataRoot` block; RESEARCH *Pattern 4*. Whether `getLocale()` behaves in a universal load on both sides is unread here |
| 4 | The details page's draft model — per-card kept / new / removed / moved state, the validation pass on submit, focus to the first control in error, rebuild-on-`changed` | page logic | CRUD | The profile keeps its draft in the user-data store and validates per field; no page holds a list of independently removable draft items | UI-SPEC § *S6*, *S8*, *S9*; extract the draft arithmetic ("something to write", the label, the desired set sent to the writer) into a pure module beside the page, tested as `taskState.test.ts` tests its module |

---

## Items the Planner Must Resolve

1. **`search_path` on the INVOKER write function.** `upsert_answers` pins none; `get_user_entities` and `get_entity_user_data` pin `''`; RESEARCH measured the forcing statement with `''`. Recommended: pin it, and schema-qualify every name in the body.
2. **How guard 5 is paired.** A fifth argument to `private.caller_nominated_in_contest`, or a second helper. Either changes a function `23-…`'s `G5:` section calls by its present signature; the faction pairing is RESEARCH *Open Questions* 2.
3. **The parent-id lookup's tie-break** (a party with several nominations at one contest under different alliances) — RESEARCH *Open Questions* 3 — stated in the function's header and pinned in pgTAP.
4. **The reworded cap message** moves three things together: the trigger's `RAISE`, `23-…`'s `throws_like` pattern, and the writer's new prefix constant.
5. **Universal or server loads for the editor** (RESEARCH *Open Questions* 8) decides whether D3's test imports `./+layout` or `./+layout.server`, and whether *No Analog Found* #3 applies at all.
6. **Rows the application writes have no external id.** Three teardowns delete by prefix (`runTeardownAsserted`). The new spec — and `perm-startfromcg` and `perm-no-nomination` once they save through K — leave nominations and placeholder parents no prefix names. They go with their entity (`ON DELETE CASCADE`), unless a child nomination still points at a parent (`parent_nomination_id … ON DELETE NO ACTION`). Read `tests/tests/setup/shared/assertTeardown.ts` and `bulk_delete`'s table order, then settle: a state step that clears an entity's nominations with the service role at the end of each test, or nothing beyond the cascade.
7. **`perm-startfromcg.spec.ts`'s frame.** It imports `test` from `@playwright/test` and holds raw locators; the contestant tests need fixtures. Extend the file's `test`, or give the contestant describe its own composition root in the same file.
8. **The details page's component test over the real layout, provider and store** (RESEARCH A3) has `176-19`'s store-defect test as its method; read `P176/176-19-SUMMARY.md` § *For Phase 177* for the harness before the plan names files.
9. **Order of the plans.** D-26 puts the dataset last; Phases 175 and 176 built dataset and fixtures before the screens (RESEARCH *Open Questions* 5; the operator's standing instruction "E2E: audit → plan → approve → build-fixtures-first"). The pattern map follows the files, not the order.

---

## Metadata

**Analog search scope:** `apps/supabase/supabase/schema/`, `apps/supabase/supabase/tests/database/`, `apps/frontend/src/lib/{api,routes,contestant,contexts,components,dynamic-components}/`, `apps/frontend/src/routes/{(voters),contestant}/`, `packages/data/src/objects/election/`, `packages/dev-seed/{src/templates,src/generators,tests}/`, `tests/tests/{fixtures,setup,specs,utils}/`, `tests/playwright.config.ts`, `scripts/`, `.planning/phases/176-contestant-home-task-state-nominations-view/`
**Files read for excerpts:** 52 (each once; large files by non-overlapping ranges located with `grep -n`)
**Not read:** `P176/176-19-SUMMARY.md` (cited by RESEARCH and UI-SPEC; the planner reads it), `177-VALIDATION.md`, the bodies of `176-gates.sh` / `176-e2e.sh` / `176-verdict.mjs` beyond their headers and symbol lists, `EntityCard.svelte`, `ConstituencySelector.svelte`, `Input.svelte` beyond its label and rest-prop lines
**Nothing was run** against the database, the dev server or the E2E suite; no source file was modified.
**Pattern extraction date:** 2026-10-10
