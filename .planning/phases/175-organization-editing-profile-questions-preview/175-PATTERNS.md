# Phase 175: Organization Editing — Profile, Questions & Preview - Pattern Map

**Mapped:** 2026-10-08
**Tree read at:** `d76a595e8` (branch `feat/entity-signup-multi-grant`)
**Files analyzed:** 62 new or modified files, in 14 groups
**Analogs found:** 60 / 62

**How analogs are cited.** By path plus a content anchor — a symbol name or a quoted line — never by a
line number. Excerpts are verbatim from the tree; long lines are shortened with `…` and nothing else is
changed. Frontend paths are relative to `apps/frontend/src/` unless they start with `apps/`; `schema/`
and `tests/database/` are relative to `apps/supabase/supabase/`; `ENTITY/` abbreviates
`routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/`. Every analog named
below is git-tracked (checked with `git ls-files`); none is a generated or mirrored copy. The two
generated files of this phase (`migrations/00001_initial_schema.sql`,
`packages/supabase-types/src/database.ts`) are regenerated, never hand-edited, and are not analogs.

**Read-only mapping.** No dev server, E2E run or database command was run. Whether an excerpt still
holds on the planning tree is checked by the planner against the anchor, not against this file.

## File Classification

Plan numbers follow `175-RESEARCH.md` § *Proposed plans and waves* (01 schema, 02 context and state,
03 profile page, 04 questions empty state and preview, 05 dataset/spec/scans, 06 close).

### Group A — schema and pgTAP (plan 01)

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `schema/102-entities.sql` (four trigger registrations) | migration | event-driven | the same file — the candidates registration, which already carries two protected columns | exact |
| `schema/301-auth-functions.sql` (`private.project_nominations_locked` body) | migration | request-response | the same function, body replaced | exact |
| `schema/100-tenancy.sql`, `schema/303-column-grants.sql`, `schema/302-rls.sql` (comment), `seed.sql` (comment) | migration | CRUD | in-place removal; no analog needed | n/a |
| `schema/011-validation-functions.sql` (+ `validate_entity_type_list`) | migration | event-driven | `public.validate_question_choices` in `schema/103-questions.sql` (shape) and `public.enforce_entity_immutability` in `schema/011-validation-functions.sql` (message style) | role-match |
| `schema/103-questions.sql` (two trigger registrations) | migration | event-driven | `CREATE TRIGGER validate_question_choices_before_insert_or_update` in the same file | exact |
| `schema/501-bulk-operations.sql` (table-aware skip) | migration | batch | the `skip_columns` loop of `_bulk_upsert_record` in the same file | exact |
| `tests/database/19-entity-immutability.test.sql` (+12 cells) | test | CRUD | the same file — "Section 2: the grid on organizations" | exact |
| `tests/database/23-nominations-write.test.sql` (lock re-pointed, own-insert pair, lock-source cells) | test | CRUD | the same file — the two `lock_nominations = true` / `= false` pairs | exact |
| `tests/database/15-`, `09-`, `05-`, `20-`, `22-`, `00-helpers` (displaced rows, comments, `plan (N)`) | test | CRUD | each file's own neighbouring assertion | exact |
| pgTAP cells for `validate_entity_type_list` and for `bulk_import` carrying `entity_type` | test | batch | `throws_like` cells of `tests/database/08-triggers.test.sql`; `bulk_import` calls in `09-column-restrictions.test.sql` | role-match |

### Group B — dev-seed (plans 01 and 05)

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `packages/dev-seed/src/template/permittedKeys.ts` (`DENIED_BY_TABLE`, `'lock_nominations'`) | config | transform | the same file | exact |
| `packages/dev-seed/tests/assertKnownRowProps.test.ts`, `…builtins.test.ts`, `src/template/permittedKeys.test.ts` | test | transform | the same files — 'DENIED ∪ EXCLUDED equals the RPC's skip_columns array, in BOTH directions' | exact |
| `packages/dev-seed/tests/fixtures/negctl-nominations-entity-type.ts` + `-camel.ts` (NEW; the two `negctl-questions-entity-type*` files are deleted) | test fixture | batch | `packages/dev-seed/tests/fixtures/negctl-questions-entity-type.ts` | exact |
| `packages/dev-seed/src/templates/e2e/perm/perm-organization-editing.ts` (NEW) | config (seed template) | batch | `packages/dev-seed/src/templates/e2e/perm/perm-org-matching.ts` (hand-authored, organizations with own answers and colours) | exact |
| `packages/dev-seed/src/templates/index.ts`, `src/cli/help.ts` (registration) | config | — | the `'perm-org-matching': permOrgMatchingTemplate` entry | exact |
| `packages/dev-seed/src/templates/e2e/perm/shared.ts`, `e2e/base.ts`, `default.ts`, `perm-hide-if-missing-answers.ts` (re-read against the widened schema) | config | — | `MINIMAL_BASE_APP_SETTINGS` in `shared.ts` | exact |

### Group C — app-shared settings (plan 02)

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `packages/app-shared/src/data/schemas/storedSettings.schema.ts` | model (zod schema) | transform | the `access` and `entities` strict objects of the same file | exact |
| `packages/app-shared/src/settings/dynamicSettings.type.ts`, `dynamicSettings.ts` | model / config | — | the `answersLocked` and `hideIfMissingAnswers` members of the same files | exact |
| `packages/app-shared/src/data/schemas/storedSettings.schema.test.ts` (new cases) | test | transform | the same file | exact |

### Group D — `Input` parts repair (plan 02, first task)

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `lib/components/input/Input.svelte` (drop `mainInputs`, hold the part with `bind:this`, call `part?.focus()`) | component | event-driven | `lib/contestant/components/passwordField/PasswordField.svelte` — `export function focus(): void` | role-match |
| `lib/components/input/parts/MultilingualTextPart.svelte`, `SelectMultiplePart.svelte`, `MultipleTextPart.svelte` + their `.type.ts` | component | event-driven | the same three parts; `PasswordField.svelte` for the exported method | role-match |
| `lib/components/input/Input.focusReturn.svelte.test.ts` (1/1/1 → 0; two multi-text kinds added) | test | event-driven | the same file | exact |
| `lib/components/input/Input.type.ts` + the colour kind in `Input.svelte` (plan 03; control per the UI spec) | component | request-response | `Input.svelte`'s inline `date` / `number` kinds (the README's "row of simple inputs") | role-match |

### Group E — writer and store (plan 02)

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `lib/api/base/dataWriter.type.ts` (`EditableEntityProps`, raw localized name on the entity user data) | model | CRUD | `EditableEntityProps` in the same file | exact |
| `lib/api/base/universalDataWriter.ts` (`updateEntityProperties` guard lifted) | service | CRUD | the same method | exact |
| `lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts` (closed property map, changed-only `UPDATE`, read-back parse, return type, raw name on `_getEntityUserData`) | service | CRUD | `ENTITY_TABLES` + `servedEntityType` + `_updateEntityProperties` in the same file | exact |
| `lib/api/adapters/supabase/dataWriter/supabaseDataWriter.test.ts`, `supabaseDataWriter.integration.test.ts` (new cases) | test | CRUD | the same files | exact |
| `lib/contexts/contestant/contestantUserDataState.svelte.ts` + `.type.ts` + `.svelte.test.ts` | store | CRUD | `setImage` / `resetImage` / `#unsavedProperties` / `save` in the same file | exact |

### Group F — contestant context (plan 02)

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `lib/contexts/contestant/contestantContext.svelte.ts` (`nominationsLocked`, type-aware scope, "loaded" fact, name clause, `page.params` annotation) | provider | event-driven | `#answersLocked` / `get answersLocked()`; `#selectedEntity`; `#profileComplete`; the rollup `$effect` — all in the same file | exact |
| `lib/contexts/contestant/contestantContext.type.ts` | model | — | the `answersLocked: boolean` member | exact |
| `lib/contexts/contestant/contestantContext.svelte.test.ts` (new cases; the 'RUNES-05' describe rewritten) | test | event-driven | the same file's harness (`appSettings: { access: { answersLocked: false } }`) | exact |
| `lib/contexts/utils/questionRollup.ts` (header sentence) + `questionRollup.test.ts` | utility | transform | the same files | exact |
| `lib/contexts/voter/nominationAndQuestionState.svelte.ts` (organization arm, if built — T-8) | store | transform | its own candidate arm: `if (entityType === ENTITY_TYPE.Candidate && hideIfMissing?.candidate)` | exact |

### Group G — pure helpers and the descriptor (plans 02 and 03)

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `lib/contestant/utils/<nameRule>.ts` (`isNameEditable`, `missingRequiredLocale`, the name normalizer) + `.test.ts` (NEW) | utility | transform | `lib/contestant/utils/userEntityDisplayName.ts` + `.test.ts` | exact |
| `lib/contestant/utils/<entityDescriptor>.ts` (NEW; name and shape at discretion) + `.test.ts` | utility (per-type data map) | transform | `ENTITY_TABLES` in `supabaseDataWriter.ts` (a closed `as const satisfies Record<ServedEntityType, …>` map); `lib/contestant/utils/contestantAppName.ts` (per-served-type copy) | role-match |
| `lib/utils/color/ensureColors.ts` (only if open question 3 is taken) + `ensureColors.test.ts` (NEW; no test exists in that directory) | utility | transform | `ensureColors` itself; test shape from `userEntityDisplayName.test.ts` | role-match |

### Group H — pages and components (plans 03 and 04)

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `ENTITY/profile/+page.svelte` | component (route page) | CRUD | the same file — the `locked` name `Input`s, `handleImageInputChange`, `handleSubmit` | exact |
| `ENTITY/questions/+layout.svelte` (three states) | component (layout) | request-response | the same file's `{#if …}{:else}`; `ENTITY/preview/+page.svelte` for the `Loading` / error / success triple | exact |
| `ENTITY/preview/+page.svelte` (`ensureColors` on the read; the omitted tab) | component (route page) | request-response | the same file's `loadEntity`; `UniversalDataProvider.ensureColors` in `lib/api/base/universalDataProvider.ts` | exact |
| `lib/dynamic-components/entityDetails/EntityDetails.svelte` + `.type.ts` (a prop that omits `children`) | component | request-response | the same file's `contentTabs` derivation | exact |
| `lib/dynamic-components/navigation/contestant/ContestantNav.svelte`; `ENTITY/+page.svelte` (home) | component | request-response | the `contestant-nav-questions` `NavItem`; 173's first-paint rule on the profile page | exact |
| `lib/contestant/components/logoutButton/LogoutButton.svelte`, `ENTITY/+page.svelte`, `ENTITY/profile/+page.svelte`, `ENTITY/questions/+page.svelte` (the five `hideIfMissingAnswers.candidate` reads) | component | request-response | each read in place | exact |
| component tests beside `EntityDetails.svelte` and the questions layout (NEW) | test | request-response | `lib/components/input/Input.focusReturn.svelte.test.ts` (a `.svelte.test.ts` mounting a real component) | role-match |

### Group I — copy (plans 03 and 04)

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `apps/frontend/messages/{da,en,et,fi,fr,lb,sv}/common.json`, `contestantApp.basicInfo.json`, `contestantApp.error.json`, `contestantApp.questions.json`, `contestantApp.home.json`, `contestantApp.help.json`, `dynamic.json` | config (i18n catalog) | — | `common.electionSymbol.{candidate,organization,…}` in `apps/frontend/messages/en/common.json` | exact |

### Group J — E2E harness (plan 05)

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `tests/tests/setup/perm/perm-organization-editing.setup.ts` (NEW) | test setup | batch | `tests/tests/setup/perm/perm-answers-locked.setup.ts` (seed + stored session) with `tests/tests/setup/contestant/entity-selection.setup.ts` (`registerAndStoreSession` + `entityGrants`) | exact (composite) |
| `tests/tests/setup/perm/perm-organization-editing.teardown.ts` (NEW) | test teardown | batch | `tests/tests/setup/perm/perm-answers-locked.teardown.ts` | exact |
| `tests/playwright.config.ts` (the trio; the chain edge) | config | — | the `data-setup-perm-answers-locked` / `data-teardown-perm-answers-locked` / `perm-answers-locked` trio | exact |
| `tests/tests/specs/perm/perm-organization-editing.spec.ts` (NEW; `specs/contestant/` is the alternative — the trio's `testDir` follows) | test (E2E spec) | CRUD | `tests/tests/specs/perm/perm-answers-locked.spec.ts` (`test.use({ storageState })` per `describe`); `perm-org-matching.spec.ts` (voter read of an organization; `updateAppSettings`) | role-match |
| `tests/tests/fixtures/contestant/contestantProfilePage.fixture.ts` (name fields, colour, locked state) | test fixture | CRUD | the same file; `tests/tests/fixtures/shared/multilingualTextFieldFixture.fixture.ts` | exact |
| `tests/tests/fixtures/contestant/perm-organization-editing.ts` (NEW; dataset constants and storage-state paths) | test fixture | — | `tests/tests/fixtures/contestant/contestant-entity-selection.ts`; `tests/tests/utils/testCredentials.ts` | role-match |
| the axe entries (in the new spec, not in `contestant-a11y-scan`) | test (a11y) | request-response | `ContestantAxeRoute`, `toScanEntry`, `declareScans` in `tests/tests/specs/a11y/contestant-a11y.spec.ts` | role-match |
| `scripts/assert-a11y-scan-wiring.mjs` (a third file under check 4a) | config (lint gate) | — | its own `['a11y-smoke.spec.ts', a11ySmokeSrc], ['contestant-a11y.spec.ts', contestantA11ySrc]` list | exact |
| `tests/tests/utils/testIds.ts` | config | — | the `profile: { submit: 'profile-submit', … }` block | exact |
| `tests/tests/specs/a11y/contestant-a11y.spec.ts` (its unscanned-surfaces table row) | test | — | the row "an organization's pages, and the open menu over them" | exact |

### Group K — phase drivers (plan 06)

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `.planning/phases/175-…/175-gates.sh` (NEW) | utility (gate driver) | batch | `.planning/phases/174-invitations-grants-defined-in-advance/174-gates.sh` | exact |
| `.planning/phases/175-…/175-e2e.sh` (NEW) | utility (E2E driver) | batch | `.planning/phases/174-invitations-grants-defined-in-advance/174-e2e.sh` | exact |
| `.planning/phases/175-…/175-verdict.mjs` (NEW) | utility (verdict) | batch | `…/174-verdict.mjs`; `.planning/phases/174.1-terms-of-use-gate-phone-width-focus/174.1-verdict.mjs` for a phase that reuses 174's run directories and `resolveRun` | exact |

### Group L — docs and skills (plan 06)

`apps/docs` settings and contestant-app pages, `apps/supabase/README.md`, `packages/dev-seed/README.md`,
`.claude/skills/database/schema-reference.md` and `rls-policy-map.md`, `CLAUDE.md` § *Context
Destructuring Rule* and `.claude/skills/components/context-reactivity.md` § 1b (the accessor list gains
`nominationsLocked`). In-place edits; no analog needed.

## Pattern Assignments

### A1 — `schema/102-entities.sql`: four registrations widened (migration, event-driven)

**Analog:** the same file. The candidates registration is the in-tree instance of a registration with
more than one protected column, in both lists:

```sql
-- Gates the confirmation flag and freezes the names of a confirmed candidate; the function is declared in 011-validation-functions.sql. The `UPDATE OF` list makes the trigger fire only when a statement sets one of these columns, so `upsert_answers`, which sets only the answers column, never enters it. The arguments name the two protected name columns.
CREATE TRIGGER enforce_entity_immutability
BEFORE UPDATE OF first_name,
last_name,
confirmed ON public.candidates FOR EACH ROW
EXECUTE FUNCTION public.enforce_entity_immutability ('first_name', 'last_name');
```

The three single-column registrations to widen (organizations, factions, alliances) are each:

```sql
CREATE TRIGGER enforce_entity_immutability
BEFORE UPDATE OF name,
confirmed ON public.organizations FOR EACH ROW
EXECUTE FUNCTION public.enforce_entity_immutability ('name');
```

**What to copy:** `short_name` joins **both** the `UPDATE OF` list and the argument list in all four.
The comment above each registration says "the argument names the protected name column" (singular, on
three of them) and is brought in line — as a description of the code as it is, with no history.
**Not changed:** the function body. Its comparison, for reference when writing cells
(`schema/011-validation-functions.sql`, `enforce_entity_immutability`, "Rule 2: the conditional freeze,
guarded on the OLD row's flag"):

```sql
      IF (v_old_row ->> v_col) IS DISTINCT FROM (v_new_row ->> v_col)
         AND NOT public.user_can('entity', NEW.id, 'entity.edit_immutable', v_entity_type) THEN
        RAISE EXCEPTION 'Entity name is immutable once confirmed: column %.%.% on row % cannot be changed (current: %, attempted: %); changing it requires the entity.edit_immutable permission',
```

---

### A2 — `schema/301-auth-functions.sql`: the lock helper's body (migration, request-response)

**Analog:** the function itself. Signature, `STABLE SECURITY DEFINER`, `search_path = ''` and the outer
`COALESCE(…, true)` stay; only the inner `SELECT` changes.

```sql
--------------------------------------------------------------------------------
-- project_nominations_locked: is this project's nomination editing locked?
--
-- The lock is row state rather than a member of the permission matrix, so it is a conjunct of the nomination policies and this function is the hop they call.
--
-- It returns true (locked) when the project row is not found, so a missing project never unlocks anything. project_open_for_voters denies with false because its sense is the other way round.
--
-- SECURITY DEFINER because public.projects has row-level security enabled, and an inline read would also ask whether the caller can see the project.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.project_nominations_locked (p_project_id uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET
  search_path = '' AS $$
  SELECT COALESCE(
    (SELECT p.lock_nominations FROM public.projects p WHERE p.id = p_project_id),
    true
  );
$$;
```

**Replacement body:** `175-RESEARCH.md` § *Code Examples → The lock helper's body* (the two-level
`COALESCE`, JSONB equality `#> '{access,nominationsLocked}' = 'true'::jsonb`, never `#>>`). The header
comment's second and fourth paragraphs change with it: "row state" becomes a stored setting, and the
`SECURITY DEFINER` reason now also covers `public.app_settings`.

---

### A3 — `validate_entity_type_list` and its two registrations (migration, event-driven)

**Analog for the function shape:** `public.validate_question_choices` in `schema/103-questions.sql` —
a `RETURNS TRIGGER` plpgsql function that returns `NEW` early for rows it does not govern, tests
`jsonb_typeof`, loops `jsonb_array_elements`, and raises one named sentence per rule:

```sql
CREATE OR REPLACE FUNCTION public.validate_question_choices () RETURNS TRIGGER AS $$
DECLARE
  p_choice JSONB;
  p_choice_count INTEGER;
BEGIN
  -- Only validate choice-type questions
  IF NEW.type NOT IN ('singleChoiceOrdinal', 'singleChoiceCategorical', 'multipleChoiceCategorical') THEN
    RETURN NEW;
  END IF;
  …
  -- Choices must be an array
  IF jsonb_typeof(NEW.choices) != 'array' THEN
    RAISE EXCEPTION 'Question choices must be a JSON array, got %', jsonb_typeof(NEW.choices);
  END IF;
  …
  FOR p_choice IN SELECT * FROM jsonb_array_elements(NEW.choices)
  LOOP
    IF jsonb_typeof(p_choice) != 'object' THEN
      RAISE EXCEPTION 'Each choice must be a JSON object';
    END IF;
```

**Analog for the message style** (name the table, the row and the offending value):
`enforce_entity_immutability` — `… %.% row % cannot change its confirmation flag (current: %, attempted: %)`
with `TG_TABLE_SCHEMA, TG_TABLE_NAME, NEW.id`. Newer functions in `011` declare
`LANGUAGE plpgsql SECURITY INVOKER` in the header line rather than a trailing `$$ LANGUAGE plpgsql;` —
follow the `011` form, since that is where the function goes.

**Analog for the registration** (`schema/103-questions.sql`):

```sql
CREATE TRIGGER validate_question_choices_before_insert_or_update
BEFORE INSERT OR UPDATE ON public.questions FOR EACH ROW
EXECUTE FUNCTION public.validate_question_choices ();
```

Two registrations, one on `public.question_categories` and one on `public.questions`. The proposed
function text is in `175-RESEARCH.md` § *Code Examples → Validating the type list*.

---

### A4 — `schema/501-bulk-operations.sql`: the table-aware skip (migration, batch)

**Analog:** `_bulk_upsert_record` in the same file.

```sql
  -- Columns to skip (managed by DB, not by import)
  skip_columns text[] := ARRAY[
    'id', 'created_at', 'updated_at', 'project_id', 'entity_type'
  ];
```

```sql
    -- Skip project_id (already added) and managed columns
    IF item_key = ANY(skip_columns) THEN
      CONTINUE;
    END IF;
```

**What to copy:** leave the array literal byte-shaped as it is and carve the exception out in the loop
(`175-RESEARCH.md` Pattern 3). The array is parsed by a regex in dev-seed's parity test (B2 below), so
its declaration form `skip_columns text[] := ARRAY[ … ]` is load-bearing. The comment in the
`CASE p_table_name` block states the coupling in the house form and is the model for the comment the
carve-out needs: "`RELATIONSHIP_REFS` in packages/dev-seed/src/template/permittedKeys.ts transcribes this
block, and a parity test in that package reads this SQL from disk, so the two must change together."

---

### A5 — `tests/database/19-entity-immutability.test.sql`: three cells per table for `short_name` (test)

**Analog:** the same file, "Section 2: the grid on organizations" (cells for `name`), and the candidates
section for a table with more than one protected column ('candidates cell 1 (last_name): the second
protected column on this table is refused too, so the rule is per column rather than per table').

The file's own contract, which the new cells obey:

```sql
--   cell 1  entity grantee, CONFIRMED row               -> refused, naming the column
--   cell 2  entity grantee, UNCONFIRMED row             -> ALLOWED, and the new value is read back
--   cell 3  entity.edit_immutable holder, CONFIRMED row -> allowed, and the new value is read back
--
-- Cell 1 alone is satisfied by a rule that simply denies the entity user, and cell 3 alone by a rule that denies nobody. Cell 2 is the only cell that observes the conditionality: …
```

The statements each organizations cell wraps (copy with `short_name` for `name`):

```sql
      $$UPDATE organizations SET name = '{"en":"Renamed"}'::jsonb WHERE id = '%s'$$,
      …
    'organizations cell 1: an entity grantee renaming a CONFIRMED entity is refused'
      $$UPDATE organizations SET name = '{"en":"Corrected"}'::jsonb WHERE id = '%s'$$,
    'organizations cell 3: a holder of entity.edit_immutable renames the CONFIRMED entity'
    'organizations cell 3: the administrator''s correction is what is stored'
      $$UPDATE organizations SET name = '{"en":"SignedUp"}'::jsonb WHERE id = '%s'$$,
    'organizations cell 2: the same grantee renaming the same row once it is UNCONFIRMED is allowed'
    'organizations cell 2: the value the grantee wrote to the unconfirmed row is what is stored'
```

**Order inside a section** (from the header): cells 1 and 3 on the confirmed row, then the owner
unconfirms the same row, cell 2, re-confirm. **Refusal instrument:** `pg_temp.capture_refusal (p_sql text)`
is already declared in the file. **Count:** `plan (70)` is explicit and moves with the new cells — a
stale count fails the file (`175-RESEARCH.md` P-12 lists all six counts that move).

---

### A6 — `tests/database/23-nominations-write.test.sql`: the lock re-pointed (test)

**Analog:** the same file's two pairs. The update pair (the `entity_update_nominations` cell):

```sql
UPDATE projects
SET
  lock_nominations = true
WHERE
  id = test_id ('project_a');

SELECT
  set_test_user (
    'authenticated',
    test_user_id ('candidate_a'),
    test_user_grants ('candidate_a')
  );

SELECT
  is (
    pg_temp.try_edit_nomination (
      test_id ('nomination_cand_a'),
      'attempted while locked'
    ),
    0,
    'with the project nomination lock ON, the owning entity user affects zero rows -- the `own, unless locked` cell of section 3.3'
  );
```

followed by the same block with `lock_nominations = false`, expecting `1`: 'with the lock OFF the same
statement affects one row -- the lock asserted in BOTH directions, so a policy that ignored the flag
entirely could not pass both halves'. The insert pair is `'G4-neg: guard 4 -- with the project nomination
lock ON the parent insert is refused; …'` (`throws_ok (…, '42501', NULL, …)`) and its `G4` allow.

**What to copy:** each `UPDATE projects SET lock_nominations = …` becomes a write of
`app_settings.settings` for `test_id ('project_a')`, made after `reset_role ()` exactly where the
`UPDATE projects` sits today; both directions stay. The third pair (the entity's **own** insert,
`entity_insert_nominations`) copies the G4 pair's `throws_ok` / allow shape.
**The no-row case** copies `tests/database/38-contestant-app-public-config.test.sql`:

```sql
DELETE FROM app_settings
WHERE
  project_id = test_id ('project_b');
```

`try_edit_nomination`'s own header warns "⚠ IT MUST NOT BE `SECURITY DEFINER`" — a new instrument for
the insert pair obeys the same rule.

---

### A7 — the displaced `short_name` rows and the `lock_nominations` rows (test)

No new pattern: each of the four rows in `175-RESEARCH.md` RQ-4 (a) keeps its statement and its
description and takes another granted, unfrozen column (`info`); each row of RQ-4 (b) is re-pointed or
removed as that table says. The population is derived at run time — register the trigger, run the
estate, and the red rows are the list.

---

### B1 — `packages/dev-seed/src/template/permittedKeys.ts` (config, transform)

**Analog:** the map itself.

```ts
export const DENIED_BY_TABLE = {
  nominations: ['entity_type'],
  question_categories: ['entity_type'],
  questions: ['entity_type']
} as const satisfies {
  [C in 'nominations' | 'question_categories' | 'questions']: ReadonlyArray<Extract<keyof TablesInsert<C>, string>>;
};
```

**What to copy:** the map shrinks to `nominations` alone and the `satisfies` clause's key union shrinks
with it. The TSDoc above it ("`entity_type` is denied on exactly the three tables that declare the
column…") is rewritten as a statement of the present rule. The `'lock_nominations'` entry in the
`projects` key list sits under a `satisfies … keyof TablesInsert<C>` clause, so it is removed in the same
commit as the regenerated types.

---

### B2 — `packages/dev-seed/tests/assertKnownRowProps.test.ts` (test, transform)

**Analog:** the same file.

```ts
  it('DENIED ∪ EXCLUDED equals the RPC’s skip_columns array, in BOTH directions', () => {
    // Parsed from the SQL read at run time — a future `skip_columns` addition cannot pass unnoticed, in either direction.
    const sql = readFileSync(SCHEMA_SQL, 'utf8');
    const match = sql.match(/skip_columns\s+text\[\]\s*:=\s*ARRAY\[([\s\S]*?)\]/);
    …
    // And the split is the specified one: exactly one honest deny entry.
    expect([...denied].sort()).toEqual(['entity_type']);
  });

  it('denies entity_type on exactly the three tables that declare the column', () => {
    expect(Object.keys(DENIED_BY_TABLE).sort()).toEqual(['nominations', 'question_categories', 'questions']);
  });
```

The first case keeps passing unchanged if A4 leaves the array as it is. The second becomes one table.
The two fixture imports (`negctlEntityTypeSnake`, `negctlEntityTypeCamel`) and the `['snake', …],
['camel', …]` table are re-pointed to the new fixture pair.

---

### B3 — `packages/dev-seed/tests/fixtures/negctl-nominations-entity-type.ts` + `-camel.ts` (test fixture)

**Analog:** `packages/dev-seed/tests/fixtures/negctl-questions-entity-type.ts`. Copy the whole file's
shape: an un-annotated default export, its own `externalIdPrefix`, every collection stated with
`{ count: 0 }`, one `fixed[]` row carrying the denied key, and the header's rules.

```ts
export default {
  seed: 42,
  externalIdPrefix: 'negctl144-',
  generateTranslationsForAllLocales: false,

  elections: { count: 0 },
  …
  questions: {
    count: 0,
    fixed: [
      {
        external_id: 'qu-1',
        …
        category: { external_id: 'negctl144-qc-1' },
        // ↓↓↓ THE DENIED KEY — a real column the RPC's skip_columns discards. ↓↓↓
        entity_type: 'candidate'
      }
    ]
  },
```

Header rules that carry over verbatim in meaning: "⚠ THE DEFAULT EXPORT MUST NOT CARRY A TYPE
ANNOTATION", "`external_id` VALUES BELOW ARE WRITTEN WITHOUT THE PREFIX, DELIBERATELY", relationship
references "name the FINAL prefixed value". The new pair takes a fresh prefix of its own; the old two
files are deleted, not edited ("BYTE-FROZEN at this exact path").

---

### B4 — `packages/dev-seed/src/templates/e2e/perm/perm-organization-editing.ts` (seed template, batch)

**Analog:** `packages/dev-seed/src/templates/e2e/perm/perm-org-matching.ts` — the hand-authored perm
template whose organizations carry own answers and colours. (`perm-answers-locked.ts` is built with
`buildMinimal`, which has no organization answers and no type-scoped questions, so it is the analog for
the setup, not for the template.)

**Imports and prefix:**

```ts
import { buildCandidate, buildElectionConstituencyNoms, LIKERT_5_EN, MINIMAL_BASE_APP_SETTINGS } from './shared';
import type { Template } from '../../../template/types';

const P = 'e2e-perm-orgmatch-';
```

**Top-level shape and an organization row:**

```ts
export const permOrgMatchingTemplate: Template = {
  seed: 42,
  externalIdPrefix: P,
  generateTranslationsForAllLocales: false,
  …
  organizations: {
    count: 0,
    fixed: [
      {
        external_id: 'or-1',
        name: { en: '[OR1] Party One (own answers)' },
        short_name: { en: 'OR1' },
        color: { normal: '#1f4ea0', dark: '#7aa3d6' },
        sort_order: 0,
        answersByExternalId: ORG1_OWN_ANSWERS
      },
```

**A question row** (the new template adds `entity_type: ['organization']` — an **array**, per P-11):

```ts
      {
        external_id: 'qu-opin-1',
        type: 'singleChoiceOrdinal',
        name: { en: '[QU1] Org-matching opinion 1.' },
        choices: LIKERT_5_EN,
        category: { external_id: `${P}qc-opin` },
        allow_open: false,
        required: true,
        sort_order: 0
      },
```

**Settings row** (spread the base, then restate the roots this dataset needs):

```ts
  app_settings: {
    count: 0,
    fixed: [
      {
        external_id: 'app-settings',
        settings: {
          ...MINIMAL_BASE_APP_SETTINGS,
          matching: {
            ...MINIMAL_BASE_APP_SETTINGS.matching,
            organizationMatching: 'impute'
          }
        }
      }
    ]
  }
};

export default permOrgMatchingTemplate;
```

**The unconfirmed-row idiom** comes from `packages/dev-seed/src/templates/e2e/base.ts`, the row
`test-e2e-base-or-sel` ("It is seeded unconfirmed, so voters see neither it nor its nomination…") —
`confirmed: false` stated on the row — and its bare organization nomination:

```ts
      {
        external_id: 'test-e2e-base-nom-reg-n-or-sel',
        organization: { external_id: 'test-e2e-base-or-sel' },
        election: { external_id: 'test-e2e-base-el-reg' },
        constituency: { external_id: 'test-e2e-base-co-reg-n' },
        election_round: 1
      },
```

**Constraints from the research that bind the copy:** the prefix must start with `e2e-perm-` and must
not be a string-prefix of, or prefixed by, `e2e-perm-orgmatch-` or any other teardown prefix (P-18;
`e2e-perm-organization-editing-` is safe); row `external_id`s are bare and nested references prefixed
(the analog's header: "Row external_ids bare; nested refs prefixed"); `contestantApp.entityTypes` is a
list and is stated whole; `entities.hideIfMissingAnswers` states `candidate: false` (T-8).
**Registration:** `packages/dev-seed/src/templates/index.ts` — the import
`import { permOrgMatchingTemplate } from './e2e/perm/perm-org-matching';`, the map entry
`'perm-org-matching': permOrgMatchingTemplate,` and the re-export at the foot; `src/cli/help.ts` holds a
hard-coded list of built-in names ("HARDCODED here rather than derived from BUILT_IN_TEMPLATES").

---

### C1 — `packages/app-shared`: two settings keys (model / config)

**Analog:** the members beside which each goes.

`data/schemas/storedSettings.schema.ts`:

```ts
      hideIfMissingAnswers: z.strictObject({ candidate: z.boolean().optional() }).optional(),
```

```ts
  access: z
    .strictObject({
      contestantApp: z.boolean().optional(),
      voterApp: z.boolean().optional(),
      adminApp: z.boolean().optional(),
      underMaintenance: z.boolean().optional(),
      answersLocked: z.boolean().optional()
    })
    .optional(),
```

`settings/dynamicSettings.type.ts`:

```ts
    /**
     * If `true`, candidates can no longer edit their answers.
     */
    answersLocked?: boolean;
```

```ts
    hideIfMissingAnswers: {
      /**
       * Whether to hide candidates with missing answers in the app.
       */
      [ENTITY_TYPE.Candidate]: boolean;
```

`settings/dynamicSettings.ts` (defaults): `answersLocked: false` under `access`; `hideIfMissingAnswers:
{ candidate: true }` under `entities`. The new keys: `nominationsLocked` (default `false`) and
`organization` (default `false`). Both schema objects are **strict** — a key missing from the schema is
rejected on read, which is the failure RQ-3 names. The type's doc comment "This is currently only
supported for candidates" is corrected with the widening.

---

### D1 — the `Input` parts repair (component, event-driven)

**Analog for the exported method:** `lib/contestant/components/passwordField/PasswordField.svelte`,
`export function focus(): void` — the in-tree component that exposes focus as an instance export
consumed through `bind:this`.

**What is replaced** (`lib/components/input/Input.svelte`):

```ts
  // `mainInputs` must be $state in Svelte 5 because `bind:this={mainInputs[i]}` mutates a property on it; a plain array triggers `binding_property_non_reactive`.
  const mainInputs: Array<HTMLElement> = $state([]);
```

…read by `mainInputs[0]?.focus();` and handed to three parts as `{mainInputs}`. In each part
(`parts/MultilingualTextPart.svelte` shown):

```svelte
            <!-- bind: keep — $state target for bind:this; mainInputs is $state([]) in the owning Input. -->
            <input
              type="text"
              id="{id}-{locale}"
              aria-labelledby="{id}-label {id}-label-{locale}"
              {placeholder}
              {disabled}
              {...concatClass(restProps ?? {}, inputClass)}
              bind:this={mainInputs[i]}
              onchange={(e) => onChange?.(e, locale)}
              value={getLocalizedValue(locale)} />
```

and in `parts/MultilingualTextPart.type.ts` the member whose doc begins "The owning `Input`'s
focus-target array, indexed by locale position." **Part conventions that stay** (`parts/README.md`):
parts are "implementation detail and are deliberately NOT re-exported from the package barrel"; "Each
part has a co-located `<Part>.type.ts` prop contract in the house style — a documentation block on every
member, with a default marker on every optional one."
**Proof:** `lib/components/input/Input.focusReturn.svelte.test.ts` — its focus-return group stays green
and its three "logs one" expectations become zero.

**A colour kind (plan 03)** follows the README's rule for single-element kinds: "`Input`'s two
single-element branches — the single-language textarea and the row of simple inputs — stay inline". It
is a new member of the `type` union in `Input.type.ts` (beside `type: 'date';` / `type: 'number';`) and
an inline branch, not a part that takes a shared array.

---

### E1 — `supabaseDataWriter.ts`: the closed property map and the changed-only update (service, CRUD)

**Analog:** `ENTITY_TABLES` and `servedEntityType` in the same file — the closed map with a named throw.

```ts
/**
 * The table that holds the rows of each entity type the application serves.
 *
 * The one place a served entity type is turned into a table name. …
 */
const ENTITY_TABLES = {
  candidate: 'candidates',
  organization: 'organizations'
} as const satisfies Record<ServedEntityType, string>;

/** A table an entity of a served type is stored in. */
type EntityTable = (typeof ENTITY_TABLES)[ServedEntityType];

/**
 * Narrow an entity type to one the application serves.
 * …
 * @throws Error naming the type when the application does not serve it.
 */
function servedEntityType(type: EntityType): ServedEntityType {
  const served = SERVED_ENTITY_TYPES.find((candidate) => candidate === type);
  if (!served) throw new Error(`Unsupported entity type: ${type}`);
```

**The method to widen** (`_updateEntityProperties`):

```ts
  protected async _updateEntityProperties({
    target: { type, id },
    properties: { image }
  }: SetPropertiesOptions): DWReturnType<LocalizedCandidateData> {
    const table = entityTableOf(type);
    const updateFields: Record<string, unknown> = {};

    // Handle image upload to Supabase Storage
    if (image !== undefined) {
      if (image === null) {
        updateFields.image = null;
      } else {
        …
          updateFields.image = {
            path: await this.#uploadEntityFile({ projectId: this.projectId, table, id, file: imageWithFile.file })
          };
        …
      }
    }

    // NOTHING TO WRITE: READ THE STORED IMAGE BACK rather than fabricating a return value. …
    const columns = 'image';
    const { data, error } =
      Object.keys(updateFields).length === 0
        ? await this.scopedFrom(table).select(columns).eq('id', id).single()
        : await this.scopedFrom(table).update(updateFields).eq('id', id).select(columns).single();
    if (error) throw new Error(`updateEntityProperties: ${error.message}`);
    // reason: the declared return type is wrong for BOTH branches. …
    return {
      image: imageOf(parseImageColumn(data.image, constants.PUBLIC_SUPABASE_URL, { column: `${table}.image`, id }))
    } as unknown as LocalizedCandidateData;
  }
```

**What to copy:** `updateFields` only for properties **present** in `properties` (the `!== undefined`
test is already the idiom); `this.scopedFrom(table)` for every query; one `.update(…).eq('id', id)
.select(columns).single()` with `columns` equal to what was written; the read-back parsed, as
`parseImageColumn` parses the image (import line: `import { answersOf, imageOf, parseAnswersColumn,
parseImageColumn } from '../utils/parseJsonbColumn';`). The trailing `as unknown as LocalizedCandidateData`
and its `// reason:` comment go with the corrected return type — `scripts/assert-adapter-casts.mjs`
fails a new triple cast under this directory.
**The two guards one level up and down that lift with it:**
`lib/api/base/universalDataWriter.ts` —

```ts
  updateEntityProperties(opts: SetPropertiesOptions): DWReturnType<LocalizedCandidateData> {
    if (!opts.properties.image?.file) throw new Error('An image file is required for updating entity properties');
    return this._updateEntityProperties(opts);
  }
```

and `lib/api/base/dataWriter.type.ts` — `export type EditableEntityProps = { image?: ImageWithFile; };`.
**The raw localized name:** `_getEntityUserData` maps the row through `toDataObject`, whose
`const STANDARD_LOCALIZED_FIELDS = ['name', 'short_name', 'info'];`
(`lib/api/adapters/supabase/utils/toDataObject.ts`) is why the page receives one locale's string; the
raw pair is carried beside it from the same RPC row (T-3).

---

### E2 — `contestantUserDataState.svelte.ts`: staged properties (store, CRUD)

**Analog:** the image members of the same class.

```ts
  #unsavedProperties = $derived<Array<keyof LocalizedEntityData>>(this.#editedImage ? ['image'] : []);

  #hasUnsaved = $derived(this.#unsavedQuestionIds.length > 0 || this.#unsavedProperties.length > 0);
```

```ts
  resetUnsaved = (): void => {
    this.resetAnswers();
    this.resetImage();
  };
  …
  setImage = (image: Image): void => {
    this.#editedImage = image;
  };

  resetImage = (): void => {
    this.#editedImage = undefined;
  };
```

`init` and `leaveEntity` both clear `#editedImage` — every new staged field is cleared in the same three
places (`init` on a key change, `leaveEntity`, `resetUnsaved`), and by the `$effect` that discards
unsaved data when `answersLocked` turns on.

**The save path to widen** (`save`):

```ts
    if (image) {
      const updated = await dataWriter.updateEntityProperties({
        ...updateArgs,
        properties: { image }
      });
      if (!updated) throw new Error('Failed to update image');
      // The property setter returns ONLY the saved `image` — NOT the whole entity. Merge it into the existing entity so `id` and the other static fields (and any just-merged answers) survive; …
      if (this.#isLoaded(key)) this.#updateEntityData({ ...this.#savedData.entity, image: updated.image });
    }
    // Reset only after a successful save. …
    if (this.#isLoaded(key)) {
      this.resetAnswers();
      this.resetImage();
    } else {
      // The saved entity is no longer the loaded one: its own stored draft is cleared, and the loaded entity's draft and image edit are left alone.
      draft?.answers.set({});
    }

    return { type: 'success' };
```

**The in-file precedent for "a refusal is a returned result, not a throw"** — the refused-name path
(P-3) copies this, not the `throw new Error('Failed to update image')` beside it:

```ts
      if (!updatedAnswers || updatedAnswers === UNVERIFIED_ANSWERS) return { type: 'failure' };
      // Merge the updated answers into the existing entity, preserving id + static fields.
      if (this.#isLoaded(key)) this.#mergeEntityAnswers(updatedAnswers);
```

**Rules that carry over:** merge the returned properties into the stored entity, never replace it;
guard every post-await write with `this.#isLoaded(key)`; `reloadEntityData` reads `#savedData` inside
`untrack` before its first await (a 173 fix this phase must not undo). `Input` constraints on the new
fields (RQ-7): stage `$state.snapshot(value)`, never the proxy `onChange` emits, and let the input read
the value back through `userData.current`.

---

### F1 — `contestantContext.svelte.ts`: the accessor, the scope, the name clause (provider)

**Analog for `nominationsLocked`:** `#answersLocked` and its getter, in the same class.

```ts
  // User data, authentication and answersLocked
  #answersLocked = $derived(!!this.#appSettings.access.answersLocked);
```

```ts
  get answersLocked() {
    return this.#answersLocked;
  }
```

and in `contestantContext.type.ts`:

```ts
    /**
     * Whether the answers can be edited.
     */
    answersLocked: boolean;
```

The type's doc line for a reactive accessor is the model for the new member's TSDoc: "A reactive
accessor derived from page data: read it as `contestantCtx.entities` inside the tracking scope and never
destructure it."

**Analog for reading the selected entity's type and `confirmed`:** `#selectedEntity` (derived from
`page.data.entities` and `page.params`; "right on the server and on first paint"). Its body is also
where the widened annotation the discretion item removes lives:

```ts
  #selectedEntity = $derived.by(() => {
    // The generated type of `page.params` lists only the params some route declares, so the two are read by name through a widened type and are `undefined` on a route that carries neither.
    const { entityType, entityId }: Record<string, string | undefined> = page.params;
```

**The scope to lift** (the rollup `$effect` in the constructor):

```ts
    $effect(() => {
      const dr = this.#dataRoot;
      const elections = this.#selectedElections;
      const constituencies = this.#selectedConstituencies;
      const entityType = ENTITY_TYPE.Candidate;
      // `dr` was read above, inside this effect's tracking scope, and is handed to the shared rollup BY VALUE — never as a `$derived` alias and never as a thunk. See `../utils/questionRollup` for why either shape goes stale on cold entry.
      const { … } = rollUpQuestionCategories({ dataRoot: dr, elections, constituencies, entityType });
      …
      const nextBlocks = nextOpinionCats
        .map((c) => c.getApplicableQuestions({ elections, constituencies, entityType }))
        .filter((b) => b.length > 0);
```

`entityType` comes from the **loaded** entity; with none loaded the effect produces empty lists — it
neither falls back to `ENTITY_TYPE.Candidate` nor runs unscoped (P-9). `dr` keeps being read inside the
effect and passed by value.

**The formula to extend** (D-14):

```ts
  #profileComplete = $derived(
    this.#unansweredRequiredInfoQuestions.length === 0 && this.#unansweredOpinionQuestions.length === 0
  );
```

**Field-order rule** from the class doc: "`#userData` is declared AFTER `#answersLocked` + `#locale`
because its getter-thunks read them" — a new private `$derived` that `#userData`'s thunks read is
declared above it.

**Test analog:** `contestantContext.svelte.test.ts` — the harness supplies
`appSettings: { access: { answersLocked: false } }`; the describe 'contestantContext — the user-level
accessors derived from page data' is the shape for an accessor case ('reflect the page data, and follow
it when a navigation replaces it'). The describe 'contestantContext questionBlocks — RUNES-05:
entityType passed to getApplicableQuestions' is **rewritten** for both types, not extended.

---

### G1 — pure helpers beside `lib/contestant/utils/` (utility, transform)

**Analog:** `lib/contestant/utils/userEntityDisplayName.ts` and its test.

```ts
import { Candidate, ENTITY_TYPE } from '@openvaa/data';
import type { CandidateData, DataRoot, OrganizationData } from '@openvaa/data';
import type { UserEntity } from '$lib/api/base/dataWriter.type';

/**
 * The entity data a `DataRoot` takes for one entity the signed-in user edits, as the user-level list holds it. Whether the entity is confirmed is left out: the data model has no such member.
 * @param entity - The listed entity.
 * @returns The data to provide to a `DataRoot`.
 */
export function userEntityData(entity: UserEntity): CandidateData | OrganizationData {
```

**What to copy:** named exports, no default; value imports then `import type` lines; one TSDoc block per
export with `@param` / `@returns`; a discriminated branch on `entity.type === ENTITY_TYPE.Candidate`;
`UserEntity` from `$lib/api/base/dataWriter.type` as the listed-entity type (it carries `confirmed`).
**Test shape** (`userEntityDisplayName.test.ts`): a header block comment saying what is proven, `import
{ describe, expect, it } from 'vitest';`, module-level typed constants per case
(`const CANDIDATE: UserEntity = { type: 'candidate', id: '1111…', firstName: 'Alice', lastName: 'Alpha',
confirmed: true };`).
The two functions' proposed signatures are in `175-RESEARCH.md` § *Code Examples → The lock rule and the
required-locale rule as pure functions*. Phase 179's CI1 form imports the same helpers (O-4), so they
live outside any page.

---

### G2 — the per-type descriptor (utility; role-match only)

**No file in the tree is a per-entity-type descriptor of UI fields.** The closest shapes:

- `ENTITY_TABLES` (E1 above): a closed `as const satisfies Record<ServedEntityType, …>` map, with the
  derived value type `(typeof ENTITY_TABLES)[ServedEntityType]`. The descriptor is the same construct
  with an object value per type.
- `lib/contestant/utils/contestantAppName.ts`: per-served-type copy selected in one module rather than
  in a page (read at planning time; not excerpted here).
- The copy keys the descriptor points at follow `common.electionSymbol.*` (I1 below).

**Bound by D-02:** it carries the identity fields, the image label, the differing copy keys and whether
a colour is offered — **not** a lock rule; and it replaces this inline branch of
`ENTITY/profile/+page.svelte` while keeping its first-paint behaviour:

```ts
  // The person-name fields are left out for an organization only, so that they are rendered, empty, before the user data is in the store, as on the server.
  const isOrganization = $derived(userData.current?.entity.type === 'organization');
```

Pattern 5 of the research gives the simpler source: choose the descriptor by
`contestantCtx.selectedEntity?.type`, which is known on the server.

---

### H1 — `ENTITY/profile/+page.svelte` (route page, CRUD)

**Analog:** the same file.

**Context reads** (the destructuring rule in practice — stable refs destructured, accessors read on the
context):

```ts
  const contestantCtx = getContestantContext();
  const { getRoute, t, userData } = contestantCtx;
  // appSettings/dataRoot are reactive accessors — read via contestantCtx.X, never destructure.
  const appSettings = $derived(contestantCtx.appSettings);
```

**A locked name input today** (its `locked` becomes the one rule of D-05/D-09; its test id keeps its
meaning for a candidate):

```svelte
        <Input
          type="text"
          label={t('common.firstName')}
          value={candidate?.firstName}
          onShadedBg
          locked
          data-testid="profile-first-name" />
```

**An editable property input wired to the store** (the model for name, short name and colour):

```svelte
      <Input
        type="image"
        label={t('common.candidatePortrait')}
        value={userData.current?.entity.image}
        onChange={handleImageInputChange}
        locked={contestantCtx.answersLocked}
        onShadedBg
        containerProps={{ 'data-testid': 'profile-image-upload' }} />
```

```ts
  function handleImageInputChange(value: unknown): void {
    if (!value) {
      userData.resetImage();
      return;
    }
    const image = value as ImageWithFile;
    userData.setImage(image);
  }
```

**The one save and its one failure surface** (the refused-name message is a second, named branch here,
not a replacement):

```ts
    const result = await userData.save().catch((e) => {
      log.error(`[Contestant app question page] Error saving userData: ${e?.message}`);
      return undefined;
    });
    if (result?.type !== 'success') {
      status = 'error';
      return;
    }
    status = 'success';
    goto(submitRouting.submitRoute);
```

```svelte
    {#if status === 'error'}
      <ErrorMessage inline message={t('contestantApp.error.saveFailed')} class="mb-lg mt-md" />
    {/if}
```

**The unsaved-changes guard** stays one:

```svelte
<PreventNavigation
  active={() => !bypassPreventNavigation && userData.hasUnsaved && !contestantCtx.answersLocked}
  onConfirm={handleNavigationConfirm} />
```

**One of the five `hideIfMissingAnswers` reads** (same expression shape in the other four; each takes the
selected entity's type key):

```svelte
        {#if contestantCtx.unansweredRequiredInfoQuestions?.length !== 0 || (appSettings.entities?.hideIfMissingAnswers?.candidate && contestantCtx.unansweredOpinionQuestions?.length !== 0)}
```

**After a save that changed a listed property, and after a refused name save** (P-7): the precedent is
`await invalidateAll()` in `lib/contestant/gates/TermsOfUseGate.svelte`.
**Left in place:** the nominations block (`data-testid="contestant-profile-nominations"`) — Phase 176
moves it. The component doc's "Shows the candidate's basic information" and its settings line are
corrected.

---

### H2 — `ENTITY/questions/+layout.svelte`: three states (layout)

**Analog:** the same file's two-state branch, and `ENTITY/preview/+page.svelte` for a
loading / error / success triple with the house components.

Today:

```svelte
{#if ctx.unansweredRequiredInfoQuestions.length === 0 && ctx.opinionQuestions.length > 0}
  {@render children?.()}
{:else}
  <MainContent title={t('error.noQuestions')}>
    {#snippet hero()}
      <figure role="presentation">
        <HeroEmoji emoji={t('dynamic.error.heroEmoji')} />
      </figure>
    {/snippet}

    {#snippet primaryActions()}
      <Button href={getRoute.current('ContestantAppEntityHome')} text={t('common.return')} variant="main" />
    {/snippet}
  </MainContent>
{/if}
```

The triple to copy (`ENTITY/preview/+page.svelte`):

```svelte
    {#if status === 'success' && entity}
      <EntityDetails {entity} />
    {:else if status === 'error'}
      <ErrorMessage inline message={t('contestantApp.preview.notFound')} />
    {:else}
      <Loading showLabel />
    {/if}
```

**What to copy:** `MainContent` with a `hero` snippet and a `primaryActions` return button is the neutral
page's frame (new title key, a non-error emoji); `Loading` for "not loaded"; the condition is a fact the
context exposes about a **loaded** entity (P-9), read as `ctx.X`. The redirect `$effect`
(`if (ctx.unansweredRequiredInfoQuestions.length) goto(getRoute.current('ContestantAppProfile'))`) is
Phase 176's to remove and stays here.

**The nav item** (`lib/dynamic-components/navigation/contestant/ContestantNav.svelte`):

```svelte
          href={getRoute.current('ContestantAppQuestions')}
          icon="opinion"
          text={t('contestantApp.questions.title')}
          disabled={contestantCtx.unansweredRequiredInfoQuestions?.length !== 0}
          data-testid="contestant-nav-questions">
```

Left out only for a *known* zero, by the same first-paint rule H1 keeps.

---

### H3 — `ENTITY/preview/+page.svelte` and `EntityDetails` (route page / component)

**Analog for the colour read:** `UniversalDataProvider.ensureColors`
(`lib/api/base/universalDataProvider.ts`) — the voter app's own application of the util to entity data:

```ts
  ensureColors<TData extends DataObjectData>(objects: Array<TData>): Array<TData> {
    return objects.map((o) => (o.color ? { ...o, color: ensureColors(o.color) } : o));
  }
```

with `import { ensureColors } from '$lib/utils/color/ensureColors';`. The preview's read it attaches to:

```ts
      const dataRoot = ctx.dataRoot;
      dataRoot.provideEntityData([translateLocalizedEntity(result, locale)]);
      entity = dataRoot.getEntity(result.type, result.id);
```

`ctx.dataRoot` is read at its point of use, past the await — keep that; no alias. The reload effect
depends on `loadedEntityKey` (type and id as one derived string) — a 173 fix; keep it.

**Analog for the omitted tab:** `EntityDetails.svelte`'s `contentTabs` derivation:

```ts
    let tabs: Array<EntityDetailsContent | ParentEntityDetailsContent> | undefined =
      appSettings.entityDetails.contents[nakedEntity.type as keyof AppSettings['entityDetails']['contents']];
    if (!tabs?.length)
      tabs = …
    return tabs.map((tab) => ({ id: tab, label: t(`entityDetails.tabs.${tab}`) }));
```

The filter applies to the **setting's** list (T-5: the shipped order is `['info', 'children',
'opinions']`), after the fallback and before the `map`. The prop is a new member of
`EntityDetailsProps` (`EntityDetails.type.ts`, today `entity: MaybeWrappedEntityVariant;` alone), with a
doc block and a default marker; the voter app passes nothing and renders as before. The component
already branches on the app once (`if (appType.current === 'voter')`), which is the alternative D-16
allows.

---

### I1 — message catalogs (config)

**Analog:** `apps/frontend/messages/en/common.json`:

```json
    "electionSymbol": {
      "alliance": "Election Symbol",
      "candidate": "Election Number",
      "faction": "Election Symbol",
      "organization": "Election Symbol"
```

**What to copy:** one object per differing sentence with a key per type, each locale writing each
sentence whole; the same key in all seven locale directories (`da, en, et, fi, fr, lb, sv`). One catalog
file per namespace — the contestant ones are `contestantApp.basicInfo.json`, `contestantApp.common.json`,
`contestantApp.error.json`, `contestantApp.questions.json`, `contestantApp.home.json`,
`contestantApp.help.json`, `contestantApp.preview.json`, plus `dynamic.json` and `common.json`. Two
wave-2 plans must not add keys to the same file (P-14).

---

### J1 — `tests/tests/setup/perm/perm-organization-editing.setup.ts` (test setup, batch)

**Analog (seed step and file frame):** `tests/tests/setup/perm/perm-answers-locked.setup.ts`.

```ts
import { expect, test as setup } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { TIMEOUTS } from '../../helpers';
…
import { TESTS_DIR } from '../../utils/testsDir';
import { setupFromTemplate } from '../shared/setupFromTemplate';

const PREFIX = 'e2e-perm-answers-locked-';
export const STORAGE_STATE_PATH = path.join(TESTS_DIR, '../playwright/.auth/perm-answers-locked.json');
```

```ts
setup('import perm-answers-locked dataset + mint candidate session', async ({ page }) => {
  // Contestant app data loading can be slow; mirror auth.setup.ts ceiling.
  setup.setTimeout(TIMEOUTS.testMax);

  // 1. Seed the dataset.
  await setupFromTemplate('perm-answers-locked', {
    extraTeardownPrefix: ['test-', 'e2e-perm-']
  });
```

**Analog (the session step):** `tests/tests/setup/contestant/entity-selection.setup.ts` — not the
answers-locked file's hand-rolled `forceRegister` + `waitForLoginForm`, which registers a candidate only.
The shared helper takes an organization grant:

```ts
import { registerAndStoreSession } from '../shared/registerAndStoreSession';
import type { EntityGrantTarget } from '../../utils/supabaseAdminClient';

const SELECTION_ORGANIZATION: EntityGrantTarget = {
  entityType: 'organization',
  externalId: TEST_SELECTION_ORGANIZATION_EXTERNAL_ID
};
```

```ts
  // Settled on the organization's home: with one entity to edit the user is sent straight to it.
  await registerAndStoreSession(page, {
    entityGrants: [SELECTION_ORGANIZATION],
    email: TEST_NO_ENTITY_EMAIL,
    password: TEST_CANDIDATE_PASSWORD,
    storageStatePath: NO_ENTITY_STORAGE_STATE,
    acceptTermsOfUse: true,
    settledTestId: testIds.contestant.home.statusMessage
  });
```

**What to copy:** one `setup(...)` that seeds, then one `registerAndStoreSession` call per identity
(three: the editor of each organization and of the candidate), each with its own storage-state file,
`acceptTermsOfUse: true` and `settledTestId: testIds.contestant.home.statusMessage`. `StoredSessionIdentity`
(`tests/tests/setup/shared/registerAndStoreSession.ts`) documents each field; the helper unregisters
first, so a rerun is idempotent. `externalId` in a grant is the **full prefixed** id
(`${PREFIX}or-…`). Its doc says "on the base dataset"; it writes through the same admin client and
project as a perm setup, but that a perm-seeded row resolves through it was **not run here** — the
planner confirms it by reading `forceRegisterUser` in `tests/tests/utils/supabaseAdminClient.ts`.

---

### J2 — `tests/tests/setup/perm/perm-organization-editing.teardown.ts` (test teardown)

**Analog:** `tests/tests/setup/perm/perm-answers-locked.teardown.ts`, whole file:

```ts
import { test as teardown } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { SupabaseAdminClient } from '../../utils/supabaseAdminClient';
import { TESTS_DIR } from '../../utils/testsDir';
import { runTeardownAsserted } from '../shared/assertTeardown';

const PREFIX = 'e2e-perm-answers-locked-';
const STORAGE_STATE_PATH = path.join(TESTS_DIR, '../playwright/.auth/perm-answers-locked.json');
// The auth.users row minted by the setup's forceRegister. runTeardown(PREFIX) deletes the seeded candidate row but NOT the auth user; …
const CANDIDATE_EMAIL = `${PREFIX}cand-1@test.openvaa.local`;

teardown('delete perm-answers-locked dataset', async () => {
  const client = new SupabaseAdminClient();
  await client.unregisterCandidate(CANDIDATE_EMAIL);
  await runTeardownAsserted(PREFIX, client);

  if (fs.existsSync(STORAGE_STATE_PATH)) fs.unlinkSync(STORAGE_STATE_PATH);
});
```

**What to copy:** `const PREFIX = '…'` as a plain top-level string literal — the config's guard parses
it with `/^\s*(?:export\s+)?const PREFIX(?:\s*:\s*string)?\s*=\s*['"]([^'"]+)['"]/m` and throws on a file
that calls `runTeardownAsserted(` without one. Unregister every user the setup registered (three), then
`runTeardownAsserted`, then delete every storage-state file.

---

### J3 — `tests/playwright.config.ts`: the trio (config)

**Analog:** the `perm-answers-locked` trio.

```ts
  // perm-answers-locked. Full 3-surface coverage. Setup mints a per-perm storage state via real forceRegister + UI login, consumed by the authenticated sub-tests in perm-answers-locked.spec.ts.
  {
    name: 'data-setup-perm-answers-locked',
    testMatch: /perm-answers-locked\.setup\.ts/,
    teardown: 'data-teardown-perm-answers-locked',
    dependencies: ['perm-localisation-positive']
  },
  {
    name: 'data-teardown-perm-answers-locked',
    testMatch: /perm-answers-locked\.teardown\.ts/,
    // reason: the accounting assertion in runTeardownAsserted is state-mutating — a retry always observes an already-cleared prefix (0/0/0) and passes, so CI's retries: 3 would mask exactly the partial-delete class the assertion exists to catch, while local retries: 0 would still red on the same defect.
    retries: 0
  },
  {
    name: 'perm-answers-locked',
    testDir: './tests/specs/perm',
    testMatch: /perm-answers-locked\.spec\.ts/,
    fullyParallel: false,
    use: { ...devices['Desktop Chrome'] },
    dependencies: ['data-setup-perm-answers-locked']
  },
```

**What to copy:** the three objects, with the setup's `dependencies` naming the **previous perm spec**
and the next link's setup re-pointed to depend on the new spec. Insertion constraints, each stated in
the config's own comments: every perm setup "chains off the previous perm spec"; the tail is
`voter-prefs-tracking` then `admin-access` (`data-setup-admin-auth` depends on `['voter-prefs-tracking']`);
`perm-closed-project` is terminal and its dependency list is computed and asserted
(`CLOSED_PROJECT_DEPENDENCIES`); the chain is also drawn in a comment diagram ("perm-localisation-positive
→ perm-answers-locked → perm-hide-hero … → voter-prefs-tracking (the tail; admin-access follows it)")
and in the file's closing docblock, both of which are updated. The new project must not become a
dependency of `contestant-a11y-scan`.

---

### J4 — the organization-editing spec (E2E spec, CRUD)

**Analog (session-per-describe frame):** `tests/tests/specs/perm/perm-answers-locked.spec.ts`.

```ts
import { expect, test } from '@playwright/test';
import path from 'path';
import { createContestantQuestionsOverviewPage } from '../../fixtures/contestant/contestantQuestionsOverviewPage.fixture';
import { testIds } from '../../utils/testIds';
import { TESTS_DIR } from '../../utils/testsDir';

const STORAGE_STATE_PATH = path.join(TESTS_DIR, '../playwright/.auth/perm-answers-locked.json');
…
test.describe('perm-answers-locked (surfaces 2 + 3 — authenticated)', () => {
  test.use({ storageState: STORAGE_STATE_PATH });
```

Its header states the contract every new assertion obeys: "Rigidity contract: every assertion is HARD —
no soft assertions, no try/catch around assertion calls, no `.catch` fallbacks on assertion-bearing
locators. Selector discipline: testid-driven only. No `t('...')` locale-text matching."
Reaching a question page: "The per-question URL is keyed on the INTERNAL question id, not the seed
external_id… Click through the overview instead" — `createContestantQuestionsOverviewPage(page)`,
`goToPage()`, `goToQuestion(/…/)`.

**Analog (the voter's view of an organization, and settings writes from a spec):**
`tests/tests/specs/perm/perm-org-matching.spec.ts` —
`import { expect, test } from '../../fixtures/voter/views';`,
`import { answerAndAdvanceToResults, walkUntilQuestionsIntro } from '../../fixtures/voter/voter-journey.fixture';`,
`test.describe.configure({ mode: 'serial' });`, tests taking `{ page, resultsPage, aboutPage }`, and
`await client.updateAppSettings({ matching: { organizationMatching: 'none' } });` (one member of a root —
the deep merge T-1 describes), restored in a hook:
`if (client) await client.updateAppSettings({ matching: { organizationMatching: 'impute' } });`.

**Analog (confirming an entity from a test, D-19):** the admin client's generic update, as
`tests/tests/fixtures/shared/invitationFlow.fixture.ts` uses it —
`await admin.update(table, entityId, { confirmed: false });` — with its ordering note: "The entity first:
confirming a nomination while the entity is still confirmed would publish both."

**Page objects first** (project memory: fixtures before specs). Extend, do not bypass:
`createContestantProfilePage` (`tests/tests/fixtures/contestant/contestantProfilePage.fixture.ts` — a
function fixture returning methods; test ids from `testIds`; its "General API principle: question
methods take the DISPLAYED label"); `createMultilingualTextField`
(`tests/tests/fixtures/shared/multilingualTextFieldFixture.fixture.ts` — scoped under a caller-supplied
parent locator, toggling `testIds.shared.multilingualToggle`); `createContestantPreviewPage`;
`createEntityDetails` (`tests/tests/fixtures/voter/entityDetails.fixture.ts`);
`minimalVoterResultsTest` (`tests/tests/fixtures/voter/minimalVoterResultsPage.fixture.ts`, which the
research says was not run against a hand-authored template). `expectStaticInfo`'s comment "lands on the
disabled `<input>` element itself" stops being true for an unconfirmed candidate (T-9) and is corrected.

---

### J5 — the axe entries (a11y test)

**Analog:** `tests/tests/specs/a11y/contestant-a11y.spec.ts` — the entry type, the adapter and the
two-theme declaration.

```ts
interface ContestantAxeRoute extends Omit<RawAxeRoute, 'settle'> {
  /**
   * REQUIRED — a testid this surface renders ONLY when a candidate session is live. …
   */
  postLoginTestId: string;
  /**
   * OPTIONAL navigation/interaction needed to REACH the scan target. Runs before the reach proof, which in turn runs before the `contentTestId` wait.
   */
  reach?: (page: Page) => Promise<void>;
}
```

```ts
function toScanEntry(entry: ContestantAxeRoute, label: string, dark: boolean): RawAxeRoute {
  return {
    name: entry.name,
    fixture: 'raw',
    routeId: entry.routeId,
    contentTestId: entry.contentTestId,
    settle: async (page) => {
      await entry.reach?.(page);
      await assertContestantReach(page, entry, label);
      await assertDarkThemeIfDark(page, dark);
    }
  };
}
```

```ts
function declareScans(entry: ContestantAxeRoute): void {
  test(`axe accessibility scan — ${entry.name}`, async ({ page }, testInfo) => {
    await page.goto(buildEntityLessRoute({ route: entry.routeId, locale: 'en' }));
    await assertAxeScan(page, toScanEntry(entry, entry.name, false), testInfo, entry.name);
  });

  // Dark twin. The anonymous describe scopes `colorScheme: 'dark'` to this one test without adding a title segment …
  test.describe(() => {
    test.use({ colorScheme: 'dark' });

    test(`axe accessibility scan — ${entry.name} (dark)`, async ({ page }, testInfo) => {
      const label = `${entry.name}-dark`;
      await page.goto(buildEntityLessRoute({ route: entry.routeId, locale: 'en' }));
      await assertAxeScan(page, toScanEntry(entry, label, true), testInfo, label);
    });
  });
}
```

and the session swap per table:

```ts
test.describe(() => {
  test.use({ storageState: MULTI_ENTITY_STORAGE_STATE });

  for (const entry of MULTI_ENTITY_AXE_ROUTES) {
    declareScans(entry);
  }
});
```

Imports: `import { assertAxeScan, assertDarkThemeApplied } from '../../utils/axeScan';`,
`import { buildEntityLessRoute, contestantHomeUrlRe, contestantUrlRe } from '../../utils/contestantEntityUrl';`,
`import type { RawAxeRoute } from '../../utils/axeScan';`.

**What to copy:** the scans go through `assertAxeScan` only, each with a reach marker an organization's
surface alone renders, light and dark. `toScanEntry`, `assertContestantReach` and `declareScans` are
module-private to that spec and one Playwright test file cannot import another, so the new spec either
restates them or the planner extracts them into a plain module under `tests/tests/utils/` (as
`registerAndStoreSession.ts` was extracted "so that every setup file that stores a session can import
it") — a planning choice. **Gate:** `scripts/assert-a11y-scan-wiring.mjs` check 4a lists two files
(`['a11y-smoke.spec.ts', a11ySmokeSrc], ['contestant-a11y.spec.ts', contestantA11ySrc]`) and fails a spec
that matches `/new AxeBuilder/` or `/\.withTags\(/`; the new scanning spec is added to that list. Its
check 3 pins `contestant-a11y-scan` before the perm chain, which is why these scans live in the new
project.

---

### K1 — `175-gates.sh` (gate driver, batch)

**Analog:** `.planning/phases/174-invitations-grants-defined-in-advance/174-gates.sh` — copy the file
and re-point `SELF`, `PD`, the run directory and the row list.

**The row runner — every status read directly, never through a pipe:**

```bash
run_gate() {
  local name="$1"
  shift
  N=$((N + 1))
  local log t0 t1 s
  log="$DIR/$(printf '%02d' "$N")-$name.log"
  t0=$(date +%s)
  echo "$SELF [$LABEL] $name: $*"
  "$@" > "$log" 2>&1
  s=$?
  t1=$(date +%s)
  printf '%s\t%s\t%s\n' "$name" "$s" "$((t1 - t0))" >> "$DIR/summary.tsv"
  echo "$SELF [$LABEL] $name: exit $s ($((t1 - t0))s)"
  if [ "$s" -ne 0 ]; then FAILED=1; fi
}
```

**Node selection (P-17):**

```bash
# Node: the pinned v24.21.0 when it is installed, else the newest version at or above 24.15 under nvm.
NVM_NODE_DIR="$HOME/.nvm/versions/node"
if [ -x "$NVM_NODE_DIR/v24.21.0/bin/node" ]; then
  export PATH="$NVM_NODE_DIR/v24.21.0/bin:$PATH"
```

**Clean-tree refusal:**

```bash
# Gates run on committed trees only.
DIRTY="$(git status --porcelain -- . ':(exclude).planning' | grep -v -x '?? CAND-APP-PLAN.md')"
```

**The fixed order of the database rows** (the header's paragraph "The order of the five database rows is
fixed: the reset, then the types on the freshly reset database, then pgTAP, then the SQL lint") and the
row dispatch:

```bash
    db-reset) run_gate db-reset yarn db:reset ;;
    types-regen) run_gate types-regen gate_types_regen ;;
    types-clean) run_gate types-clean gate_types_clean ;;
    pgtap) run_gate pgtap yarn workspace @openvaa/supabase test:db ;;
    sql-lint) run_gate sql-lint yarn db:lint:sql ;;
```

**Also copied as they stand:** `gate_types_regen` / `gate_types_clean` (a failed generation or a drift
puts the committed file back); the in-flight-E2E refusal before `db-reset` (a listener on
`FRONTEND_PORT`, or a `started` file younger than ten minutes with no `ended`); the label-holds-a-run
refusal ("evidence is never overwritten"); `on_exit` writing `done`; the `power.txt` block ending
"the host was suspended during this run: the run is VOID, not red"; the `--rows` subset mechanism.
**This phase adds one row** after `db-reset`: the writer integration test, run with
`CONTESTANT_WRITER_INTEGRATION_REQUIRED=1` (D-22). Whether the `auth-config` and `stack` rows (the
latter calls `174-stack-probe.sh`) carry over is the planner's call; a row that calls a 174 script names
its path under 174's directory.

---

### K2 — `175-e2e.sh` (E2E driver, batch)

**Analog:** `.planning/phases/174-invitations-grants-defined-in-advance/174-e2e.sh`. Its header is the
specification to copy step for step: (a) guards; (b) `docker builder prune -af` ("the build cache only —
never images, never volumes, never a Docker restart"); (c) the Docker VM free-space refusal; (d) the
port refusal; (e) `tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/174-e2e/<label> --no-db-reset
[--project ...]`; (f) `tests/scripts/e2e-evidence.mjs`; (g) `head`, `exit`, `playwright-exit`, power
window; (h) "fails when counts.failed, counts.flaky or counts.didNotRun is non-zero, when counts.total or
counts.passed is 0, or when a --require-project project did not run green". Options to keep:
`--project <name>` and repeatable `--require-project <name>` (the new project is required in the closing
run). Exit 8 is passed through and named VOID. The three isolated runs of the new spec go through
`tests/scripts/determinism-batch.sh` (void batch: exit 6). The driver refuses a dirty tree, so a
negative control calls `tests/scripts/e2e-run.sh` directly (D-22).

---

### K3 — `175-verdict.mjs` (verdict, batch)

**Analog:** `…/174-verdict.mjs` (`gates`, `e2e`, `greps`, `exemptions`, `hygiene` sub-commands); and
`.planning/phases/174.1-terms-of-use-gate-phone-width-focus/174.1-verdict.mjs` for a later phase that
reuses the earlier one's label resolution ("A <label> resolves as `resolveRun` in 174-verdict.mjs
resolves it").

**What to copy:** `resolveRun`, `assertNotStale` ("its recorded head is tree-equal to HEAD outside
.planning/"), `reportPower`, `finish`; the `gates` rule that a subset run is never read as the full set;
the `e2e` rule set, including VOID → prints VOID and exits 3; and the project-count comparison this
phase needs:

```
//               --same-projects-as: for every project of this run and of the other run, this run's byProject
//               total equals the other run's, a project absent from a run counting as 0 there.
//               --except <project>=<integer>: this run's total for it equals the other run's plus the integer.
//               --except <project>=+: this run's total for it is above the other run's.
```

The closing call holds `contestant-a11y-scan` at its baseline count (it does not move — the new scans are
in another project) and states the new project's own count as an `--except`. The `hygiene` scan's
patterns "are assembled from fragments, so this file never hits itself" — keep that construction.

## Shared Patterns

### Context reactivity (applies to every `.svelte` file and the context class in plans 02–04)

**Source:** `CLAUDE.md` § *Context Destructuring Rule*; in practice `ENTITY/profile/+page.svelte`:

```ts
  const contestantCtx = getContestantContext();
  const { getRoute, t, userData } = contestantCtx;
```

Stable references (`getRoute`, `t`, `userData`) are destructured; `appSettings`, `selectedEntity`,
`answersLocked`, `opinionQuestions`, `profileComplete` and the new `nominationsLocked` are read as
`contestantCtx.X` in the tracking scope; `contestantCtx.dataRoot.<prop>` is read at its point of use and
never bound to an alias. Load `Skill("components")` before editing a component.

### A user-caused refusal is a returned, named result (store, writer, profile page)

**Source:** `contestantUserDataState.svelte.ts`, `save` — `return { type: 'failure' }` positioned before
the merge and the resets; both callers branch on `result?.type !== 'success'`. The writer recognises the
trigger's refusal by its stable prefix `Entity name is immutable once confirmed: column ` (the function's
header: "Each refusal starts with a stable prefix, so `throws_like` can match it"), and the page shows
its own translated sentence, never the raised text (it carries the row id).

### A closed map with a named throw (writer property map, descriptor)

**Source:** `ENTITY_TABLES` / `servedEntityType` in `supabaseDataWriter.ts` — `as const satisfies
Record<ServedEntityType, …>`, a derived value type, and `throw new Error(\`Unsupported entity type:
${type}\`)` before any request.

### pgTAP: every deny has a paired allow (all pgTAP edits of plan 01)

**Source:** the header of `tests/database/19-entity-immutability.test.sql` ("A file of refusals alone
would pass just as well against a trigger that refused everything") and file 23's "the lock asserted in
BOTH directions, so a policy that ignored the flag entirely could not pass both halves". Session
switches: `reset_role ()` before a fixture write, then `set_test_user ('authenticated', test_user_id
('…'), test_user_grants ('…'))`; ids through `test_id ('…')`; an explicit `SELECT plan (N);` per file.

### Schema edits ride one generated migration (plan 01)

Edit `schema/*.sql`; `yarn schema:regenerate` in the same commit (the parity gate is a link of
`lint:check`); `yarn db:types` only on a freshly reset database and before pgTAP runs on it; the
`permittedKeys.ts` `'lock_nominations'` entry in the same commit as the regenerated types. Load
`Skill("database")` before editing.

### E2E discipline (plan 05)

Fixtures before specs; test ids only, through `tests/tests/utils/testIds.ts`; hard assertions; no
`try/catch` around an `expect`; settings writes through `SupabaseAdminClient.updateAppSettings`; one
project (`resolveE2eProjectId()` inside `setupFromTemplate`); every perm setup pre-clears
`extraTeardownPrefix: ['test-', 'e2e-perm-']`; every teardown is `retries: 0` with the stated reason.

### Comment hygiene (every file under `apps/`, `packages/`, `tests/`)

Comments describe the code as it is: no history, no decision ids, no plan numbers. Several analog
excerpts above carry older comments that cite decisions ("decision B3", "decision C4 NOTE 1") — copy the
code shape, not those references.

## No Analog Found

| File | Role | Data Flow | Reason |
|---|---|---|---|
| `lib/contestant/utils/<entityDescriptor>.ts` | utility (per-type UI descriptor) | transform | No module in the tree describes a page's fields per entity type; `ENTITY_TABLES` and `contestantAppName.ts` are shape precedents only (G2). Use D-02 and research Pattern 5. |
| the colour control inside `Input` | component | request-response | `Input` has no colour kind and the tree has no colour picker; `lib/utils/color/PreviewColorContrast.svelte` is a preview, not an input. The inline `date` / `number` kinds give the placement; the control itself is the UI spec's (which does not exist yet — research open question 8). |

Two further gaps the planner should know, neither a missing analog:

- **No test exists under `lib/utils/color/`.** `ensureColors.test.ts` takes its frame from
  `lib/contestant/utils/userEntityDisplayName.test.ts`.
- **No pgTAP file is dedicated to `bulk_import`.** It is called in `07-rpc-security.test.sql` (the
  census) and `09-column-restrictions.test.sql`; the cells for the carried `entity_type` go beside the
  latter's calls or in a new numbered file (next free: 40).

## Metadata

**Analog search scope:** `apps/supabase/supabase/schema/`, `apps/supabase/supabase/tests/database/`,
`packages/dev-seed/src/template/`, `packages/dev-seed/src/templates/`, `packages/dev-seed/tests/`,
`packages/app-shared/src/{settings,data/schemas}/`, `apps/frontend/src/lib/{components/input,
contexts/contestant,contexts/voter,api/base,api/adapters/supabase,contestant/utils,utils/color,
dynamic-components/entityDetails,dynamic-components/navigation}/`, the `ENTITY/` route tree,
`apps/frontend/messages/en/`, `tests/tests/{setup,fixtures,specs}/`, `tests/playwright.config.ts`,
`scripts/assert-a11y-scan-wiring.mjs`, `.planning/phases/174-*/` and `174.1-*/`.
**Files read for excerpts:** 38 (whole or by targeted section).
**Not read, named from the research only:** `lib/contestant/utils/contestantAppName.ts`,
`lib/contestant/gates/TermsOfUseGate.svelte`, `tests/tests/setup/shared/setupFromTemplate.ts`,
`tests/scripts/determinism-batch.sh`, `scripts/assert-adapter-casts.mjs`, the six non-English catalogs.
**Pattern extraction date:** 2026-10-08
