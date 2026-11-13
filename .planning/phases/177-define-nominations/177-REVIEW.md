---
phase: 177-define-nominations
reviewed: 2026-10-22T20:01:37Z
depth: standard
files_reviewed: 143
files_reviewed_list:
  - apps/docs/src/lib/navigation.config.ts
  - apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.test.ts
  - apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts
  - apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.integration.test.ts
  - apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.test.ts
  - apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts
  - apps/frontend/src/lib/api/adapters/supabase/utils/entityNominations.test.ts
  - apps/frontend/src/lib/api/adapters/supabase/utils/entityNominations.ts
  - apps/frontend/src/lib/api/adapters/supabase/utils/nominationParentOptions.test.ts
  - apps/frontend/src/lib/api/adapters/supabase/utils/nominationParentOptions.ts
  - apps/frontend/src/lib/api/adapters/supabase/utils/setEntityNominationsAnswer.test.ts
  - apps/frontend/src/lib/api/adapters/supabase/utils/setEntityNominationsAnswer.ts
  - apps/frontend/src/lib/api/base/dataWriter.type.ts
  - apps/frontend/src/lib/api/base/universalDataWriter.ts
  - apps/frontend/src/lib/components/constituencySelector/ConstituencySelector.svelte
  - apps/frontend/src/lib/components/constituencySelector/ConstituencySelector.type.ts
  - apps/frontend/src/lib/components/electionSelector/ElectionSelector.svelte
  - apps/frontend/src/lib/contestant/components/notEditableNote/NotEditableNote.svelte
  - apps/frontend/src/lib/contestant/components/notEditableNote/NotEditableNote.svelte.test.ts
  - apps/frontend/src/lib/contestant/components/notEditableNote/NotEditableNote.type.ts
  - apps/frontend/src/lib/contestant/nominations/editorFacts.test.ts
  - apps/frontend/src/lib/contestant/nominations/editorFacts.ts
  - apps/frontend/src/lib/contestant/nominations/index.ts
  - apps/frontend/src/lib/contestant/nominations/nominationDraft.test.ts
  - apps/frontend/src/lib/contestant/nominations/nominationDraft.ts
  - apps/frontend/src/lib/contestant/tasks/taskState.test.ts
  - apps/frontend/src/lib/contestant/tasks/taskState.ts
  - apps/frontend/src/lib/contestant/utils/entityDescriptor.test.ts
  - apps/frontend/src/lib/contestant/utils/entityDescriptor.ts
  - apps/frontend/src/lib/contexts/contestant/contestantContext.svelte.test.ts
  - apps/frontend/src/lib/contexts/contestant/contestantContext.svelte.ts
  - apps/frontend/src/lib/contexts/contestant/contestantContext.type.ts
  - apps/frontend/src/lib/contexts/contestant/contestantUserDataState.svelte.test.ts
  - apps/frontend/src/lib/contexts/contestant/contestantUserDataState.svelte.ts
  - apps/frontend/src/lib/dynamic-components/entitySelector/EntitySelector.svelte
  - apps/frontend/src/lib/dynamic-components/entitySelector/EntitySelector.svelte.test.ts
  - apps/frontend/src/lib/dynamic-components/entitySelector/EntitySelector.type.ts
  - apps/frontend/src/lib/dynamic-components/entitySelector/index.ts
  - apps/frontend/src/lib/routes/impliedParams.test.ts
  - apps/frontend/src/lib/routes/impliedParams.ts
  - apps/frontend/src/lib/routes/index.ts
  - apps/frontend/src/lib/routes/route.ts
  - apps/frontend/src/lib/routes/selectionOrder.test.ts
  - apps/frontend/src/lib/routes/selectionOrder.ts
  - apps/frontend/src/routes/(voters)/constituencies/+page.svelte
  - apps/frontend/src/routes/(voters)/constituencies/+page.ts
  - apps/frontend/src/routes/(voters)/elections/+page.svelte
  - apps/frontend/src/routes/(voters)/elections/+page.ts
  - apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/(nominated)/preview/+page.server.ts
  - apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/+page.svelte
  - apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/nominations/(edit)/+layout.ts
  - apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/nominations/(edit)/constituencies/+page.svelte
  - apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/nominations/(edit)/constituencies/+page.ts
  - apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/nominations/(edit)/constituencies/page.svelte.test.ts
  - apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/nominations/(edit)/details/+page.svelte
  - apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/nominations/(edit)/details/+page.ts
  - apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/nominations/(edit)/details/afterSave.svelte.test.ts
  - apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/nominations/(edit)/details/AfterSaveContestant.svelte
  - apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/nominations/(edit)/details/AfterSaveRoot.svelte
  - apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/nominations/(edit)/details/page.svelte.test.ts
  - apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/nominations/(edit)/elections/+page.svelte
  - apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/nominations/(edit)/elections/+page.ts
  - apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/nominations/(edit)/layout.tracking.test.ts
  - apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/nominations/(edit)/stepLoads.test.ts
  - apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/nominations/(edit)/stepSelection.ts
  - apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/nominations/+layout.ts
  - apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/nominations/+page.svelte
  - apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/nominations/layout.test.ts
  - apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/nominations/nominationFacts.ts
  - apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/nominations/page.svelte.test.ts
  - apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/page.svelte.test.ts
  - apps/frontend/src/routes/contestant/(protected)/+page.svelte
  - apps/supabase/supabase/migrations/00001_initial_schema.sql
  - apps/supabase/supabase/schema/000-enums.sql
  - apps/supabase/supabase/schema/011-validation-functions.sql
  - apps/supabase/supabase/schema/101-elections.sql
  - apps/supabase/supabase/schema/104-nominations.sql
  - apps/supabase/supabase/schema/301-auth-functions.sql
  - apps/supabase/supabase/schema/302-rls.sql
  - apps/supabase/supabase/schema/303-column-grants.sql
  - apps/supabase/supabase/schema/503-entity-rpcs.sql
  - apps/supabase/supabase/tests/database/07-rpc-security.test.sql
  - apps/supabase/supabase/tests/database/08-triggers.test.sql
  - apps/supabase/supabase/tests/database/12-user-can.test.sql
  - apps/supabase/supabase/tests/database/15-visibility-flags.test.sql
  - apps/supabase/supabase/tests/database/23-nominations-write.test.sql
  - apps/supabase/supabase/tests/database/25-matrix-conformance.test.sql
  - apps/supabase/supabase/tests/database/42-entity-nominations.test.sql
  - apps/supabase/supabase/tests/database/43-set-entity-nominations.test.sql
  - apps/supabase/supabase/tests/database/44-nomination-parent-options.test.sql
  - packages/data/src/index.ts
  - packages/data/src/internal.ts
  - packages/data/src/objects/election/election.test.ts
  - packages/data/src/objects/election/election.ts
  - packages/data/src/objects/election/election.type.ts
  - packages/data/src/objects/election/nominationShape.test.ts
  - packages/data/src/objects/election/nominationShape.ts
  - packages/data/src/root/dataRoot.ts
  - packages/dev-seed/src/generators/ElectionsGenerator.ts
  - packages/dev-seed/src/templates/_helpers/buildMinimal.ts
  - packages/dev-seed/src/templates/default.ts
  - packages/dev-seed/src/templates/e2e/base.ts
  - packages/dev-seed/src/templates/e2e/perm/notLocated2e2cgShape.ts
  - packages/dev-seed/src/templates/e2e/perm/perm-2e-asymmetric.ts
  - packages/dev-seed/src/templates/e2e/perm/perm-2e-shared.ts
  - packages/dev-seed/src/templates/e2e/perm/perm-analytics-tracking.ts
  - packages/dev-seed/src/templates/e2e/perm/perm-contestant-nominations.ts
  - packages/dev-seed/src/templates/e2e/perm/perm-disable-election-1co.ts
  - packages/dev-seed/src/templates/e2e/perm/perm-disable-election-2co.ts
  - packages/dev-seed/src/templates/e2e/perm/perm-disjoint-1co.ts
  - packages/dev-seed/src/templates/e2e/perm/perm-interactive-info.ts
  - packages/dev-seed/src/templates/e2e/perm/perm-no-nomination.ts
  - packages/dev-seed/src/templates/e2e/perm/perm-org-matching.ts
  - packages/dev-seed/src/templates/e2e/perm/perm-organization-editing.ts
  - packages/dev-seed/src/templates/e2e/perm/perm-question-video.ts
  - packages/dev-seed/src/templates/e2e/perm/perm-startfromcg.ts
  - packages/dev-seed/src/templates/index.ts
  - packages/dev-seed/tests/nominationShapeCensus.builtins.test.ts
  - packages/dev-seed/tests/templates/built-in-templates-contestant-app.test.ts
  - scripts/assert-a11y-scan-wiring.mjs
  - scripts/assert-i18n-catalog-namespaces.mjs
  - scripts/assert-project-scoped-queries.mjs
  - tests/playwright.config.ts
  - tests/tests/fixtures/contestant/contestantEntityHomePage.fixture.ts
  - tests/tests/fixtures/contestant/contestantNominationEditor.fixture.ts
  - tests/tests/fixtures/contestant/contestantNominationsPage.fixture.ts
  - tests/tests/fixtures/contestant/contestantQuestionsOverviewPage.fixture.ts
  - tests/tests/fixtures/contestant/notEditableNote.fixture.ts
  - tests/tests/fixtures/contestant/perm-contestant-nominations.ts
  - tests/tests/fixtures/contestant/perm-no-nomination.ts
  - tests/tests/fixtures/contestant/perm-startfromcg.ts
  - tests/tests/setup/perm/perm-contestant-nominations.setup.ts
  - tests/tests/setup/perm/perm-contestant-nominations.teardown.ts
  - tests/tests/setup/perm/perm-no-nomination.teardown.ts
  - tests/tests/setup/perm/perm-startfromcg.setup.ts
  - tests/tests/setup/perm/perm-startfromcg.teardown.ts
  - tests/tests/specs/a11y/contestant-a11y.spec.ts
  - tests/tests/specs/perm/contestant-nominations.spec.ts
  - tests/tests/specs/perm/perm-no-nomination.spec.ts
  - tests/tests/specs/perm/perm-startfromcg.spec.ts
  - tests/tests/utils/permContestantNominationsData.ts
  - tests/tests/utils/permStartFromCgData.ts
  - tests/tests/utils/testIds.ts
findings:
  critical: 1
  warning: 2
  info: 7
  total: 10
status: issues_found
---

# Phase 177: Code Review Report

**Reviewed:** 2026-10-22T20:01:37Z
**Depth:** standard
**Files Reviewed:** 143
**Status:** issues_found

## Summary

This is a retroactive review of Phase 177, the phase that lets entities define their own nominations. It reviews the code as it is at HEAD and concentrates on what the phase's `(177-NN)` commits introduced (`git diff dfc982db6`, 103 commits). Findings already recorded in `177.1-REVIEW.md` and `179-REVIEW.md` are not repeated here.

**Coverage.** Not every file got the same depth of reading:

- **Read in full:** the database layer, the frontend write and read path, and the editor. The database layer covers:
  - `set_entity_nominations`, `get_entity_nominations`, `get_nomination_parent_options` and the three private helpers (503);
  - `nomination_shape_rule`, `validate_nomination`, `validate_nomination_parent_required`, the cap branch of `enforce_nomination_confirmation` and the symbol rule of `enforce_nomination_entity_columns` (011);
  - the widened `entity_insert_parent_nominations` policy and the new `entity_delete_nominations` policy (302);
  - `nomination_id_in_contest`, `caller_nominated_in_contest` and the organization editor's matrix row (301);
  - the new constraint trigger (104).

  The frontend write and read path is the writer methods, their three parsers, and the context's `setEntityNominations` and `getNominationParentOptions`. The editor is `editorFacts`, `nominationDraft`, `stepSelection`, the three step loads and pages, the guard layout, the nominations view, `EntitySelector`, the shared `selectionOrder` module and the two voter loads it took over. Schema-to-migration parity was checked line by line for the five schema files the phase touched; no drift was found.
- **Scanned for test reliability only:** the test, fixture, setup and spec files, the dev-seed templates and the three `scripts/*.mjs` files, plus a comment-hygiene grep. None of the phase's commits added a planning reference under `apps/`, `packages/` or `tests/`. The residue found in those directories predates the phase or was already reported (179 IN-04).

**What holds up:**

- **Authority.** `set_entity_nominations` is SECURITY INVOKER and asks `user_can(... 'nomination.edit' ...)` before it reads anything. The child-nominee branch of `user_can` is literal to `nomination.read`, so an organization's editor cannot write the nominations of a candidate listed under it.
- **The two reads.** Both are gated on the caller's own editor grant, and both build their projections from allow-lists.
- **Parent creation.** Creating a parent's nomination is paired by type in the policy, so a candidate cannot create an alliance's row and an organization cannot create another organization's. The symbol rule cannot be used through a placeholder parent row.
- **Concurrent parents.** Two calls that create the same parent's nomination are settled by the uniqueness key.
- **Refusals on hidden rows.** A shortfall in an RLS-filtered UPDATE or DELETE is turned into a 42501, so a refusal is never reported as a save.
- **Svelte 5 context rules.** No reactive accessor is destructured and `dataRoot` is never aliased. Every page reads `contestantCtx.X` inside its tracking scope, and the `(located)`-style tracking test guards the editor's loads against reading the URL.

**What needs fixing:**

- **One blocker: the write takes the whole set and does not check what it was computed from.** An editor whose cards are stale silently deletes, or reverts, nominations that someone else created or moved in the meantime, confirmed ones included.
- **Two warnings:**
  - Neither the function nor `validate_nomination` checks that a nomination's constituency belongs to its election.
  - Which nominations are "in reach" is computed twice, once in SQL and once in TypeScript, and the two answers differ on a NULL round. No test holds the two election-type matrices equal.

## Critical Issues

### CR-01: The whole-set write has no concurrency check, so a stale editor silently deletes or reverts other writers' nominations

**File:**
- `apps/supabase/supabase/schema/503-entity-rpcs.sql:899-918`, `:1009-1022`, `:958-962`
- `apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/nominations/(edit)/details/+page.svelte:175-188`, `:488-510`

**Issue:** The function's set semantics are "a nomination in reach that the set does not name is deleted" (line 801). The function reads the reach afresh at call time (lines 899-918) and deletes everything in it that the argument leaves out (lines 1009-1022). The client builds its argument from `cards`, which were built once, from the nominations as they stood when the page loaded (`buildCardsAnew`). Nothing is re-read before the write: the page's own header says "Nothing is read again before a write". The call carries nothing that would let the function notice the difference. Two concrete outcomes follow.

1. **A nomination created meanwhile is deleted.** An administrator adds and confirms a nomination for the candidate in election E2 while the candidate has the details step open with a card for E1. The candidate changes the E1 symbol and presses Save. The set names only E1's id, so the function deletes the confirmed E2 nomination, and the call returns `deleted: 1`. The page takes the `saved` branch (lines 506-509) and leads on. It never compares the counts with what it expected, and `notStoredOutcome`'s `sameNominations` check runs only on a failed save. The same happens with the user's own second tab.
2. **A move made meanwhile is reverted.** An administrator moves the nomination from constituency C1 to C2. The stale card still states C1 with the same `id`, so line 959 sees `C2 <> C1` and treats the write as a move back. The function deletes the administrator's row and inserts a new unconfirmed one at C1. The administrator's change is lost, and the nomination drops out of the voter app until it is confirmed again.

Both outcomes are silent data loss of rows the caller did not touch. Confirmed nominations are included, so voters stop seeing a candidate.

**Fix:** Make the write conditional on the reach the client computed from. The function should take the reach the client saw and refuse when it differs, and the page should map that refusal to its existing `changed` outcome, which already rebuilds the cards:

```sql
-- New parameter: the stored rows the client built its set from, as {id: constituency_id}.
CREATE OR REPLACE FUNCTION public.set_entity_nominations (
  p_entity_type public.entity_type,
  p_entity_id uuid,
  p_nominations jsonb,
  p_expected_reach jsonb   -- e.g. {"<id>": "<constituency_id>", ...}
) ...
  -- after v_reach is read:
  IF (SELECT jsonb_object_agg(k, v ->> 'constituency_id') FROM jsonb_each(v_reach) AS r (k, v))
     IS DISTINCT FROM COALESCE(p_expected_reach, '{}'::jsonb) THEN
    RAISE EXCEPTION 'set_entity_nominations: the nominations have changed since they were read'
      USING ERRCODE = '40001';
  END IF;
```

On the client, `_setEntityNominations` sends `builtOn` as `p_expected_reach` and maps `40001` to `{ type: 'refused', reason: 'changed' }`. `notStoredOutcome` then already does the right thing. A lighter alternative is to compare the returned `deleted` count with the number of removed and moved cards before navigating on, but that only detects the loss after it has happened.

## Warnings

### WR-01: A nomination's constituency is never checked to belong to its election, and `set_entity_nominations` accepts any constituency of the project

**File:**
- `apps/supabase/supabase/schema/011-validation-functions.sql:323-336`
- `apps/supabase/supabase/schema/503-entity-rpcs.sql:965-971`, `:1045-1055`

**Issue:** `validate_nomination` checks only that the election and the constituency each belong to the row's project. Nothing in the schema checks that the constituency belongs to one of the election's constituency groups: neither a trigger nor a policy reads `election_constituency_groups` or `constituency_group_constituencies` for a nomination. `set_entity_nominations` is the phase's new entity-facing write API, and its header promises that "the whole argument is validated before anything is written". It checks the election (line 965) but takes `constituency_id` on trust. Any self-registered candidate or organization editor can therefore call it directly with `{election_id: E, constituency_id: C}`, where C is a constituency of another election, and store the nomination. A move to such a constituency (line 959) is accepted the same way.

- The editor never offers such a pair, so the UI cannot produce one.
- The row is unconfirmed, but an administrator who confirms it publishes a nomination in a contest the voter app never shows. Its card in the editor names a constituency that the selection steps cannot reach.
- `43-set-entity-nominations.test.sql` has no case for this.

Direct table INSERTs through `entity_insert_nominations` had the same gap before this phase. The new RPC is the path the application now offers, and its contract claims full validation.

**Fix:** Check membership in `validate_nomination`, so that every writer is bound, and pin the check in pgTAP:

```sql
IF NOT EXISTS (
  SELECT 1
  FROM public.election_constituency_groups ecg
  JOIN public.constituency_group_constituencies cgc ON cgc.constituency_group_id = ecg.constituency_group_id
  WHERE ecg.election_id = NEW.election_id AND cgc.constituency_id = NEW.constituency_id
) THEN
  RAISE EXCEPTION 'Nomination constituency % is not a constituency of election %', NEW.constituency_id, NEW.election_id
    USING ERRCODE = 'check_violation';
END IF;
```

Run the census over the built-in templates before landing this, because some seeds may hold such rows. If the check cannot go into the trigger, put it in `set_entity_nominations` next to the election read at line 965.

### WR-02: The reach is computed twice, in SQL and in TypeScript, and the two disagree on a NULL round, with no test holding the two shape matrices equal

**File:**
- `apps/supabase/supabase/schema/503-entity-rpcs.sql:917-918`
- `apps/frontend/src/lib/contestant/nominations/editorFacts.ts:105-117`
- `apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts:363`
- `packages/data/src/objects/election/election.ts:57-59`

**Issue:** The function deletes every row in its reach that the set does not name, so client and server must agree exactly on what the reach is. They compute it independently, and they disagree in two ways.

- **The round.** The server compares `n.election_round IS NOT DISTINCT FROM e.current_round` on the raw nullable columns. Both columns are nullable with `DEFAULT 1`, so a NULL is stored whenever a writer states one explicitly, for example through an import. The client first normalizes both sides to 1: `row.election_round ?? 1` in `entityNominationOf`, and `this.data.round ?? 1` in `Election.round`. A nomination at round 1 in an election whose `current_round` is NULL, or the reverse, is therefore in reach for the client and out of reach for the server. The client sends its `id`, and the server refuses every save of that entity: "names an id that is no nomination of the entity this function may write". The editor then shows only the generic `saveFailed` message, permanently.
- **The election-type matrix.** It is written twice, in `public.nomination_shape_rule` and in `isNominableInShape`. `nominationShape.test.ts` tests only the TypeScript side, and `08-triggers.test.sql` tests only the SQL side. Nothing fails when the two drift. If the server ever admits a cell the client does not, the client leaves those nominations out of its set, and the server deletes them. That is the dangerous direction, and it would be silent.

**Fix:**
- Make the comparisons agree. Either make both columns `NOT NULL DEFAULT 1` (preferred), or compare `COALESCE(n.election_round, 1) = COALESCE(e.current_round, 1)` in the reach query, in `parent_nomination_resolved`'s callers and in `nomination_exists_in_contest`.
- Add a parity test: generate the 4×4 grid from `NOMINATION_SHAPE` × `ENTITY_TYPE` in TypeScript, and assert it in pgTAP against `nomination_shape_rule`, or in an integration test against the running database.
- CR-01's expected-reach parameter would also turn any remaining disagreement into a visible `changed` refusal instead of a deletion.

## Info

### IN-01: `set_entity_nominations` resets the caller's constraint mode to DEFERRED unconditionally

**File:** `apps/supabase/supabase/schema/503-entity-rpcs.sql:1151-1152`

**Issue:** The function ends with `SET CONSTRAINTS ... IMMEDIATE; SET CONSTRAINTS ... DEFERRED;`. A caller that runs the function inside a transaction where it has set the constraint `IMMEDIATE`, for example an admin script or a pgTAP test, gets its mode silently switched to `DEFERRED` for the rest of the transaction.

**Fix:** Document the side effect in the header. It would be better to read the mode first and restore it, but PostgreSQL exposes no getter for the mode. The practical fix is to state in the header that the function leaves the constraint deferred.

### IN-02: `get_nomination_parent_options` accepts an unbounded `p_contests`

**File:** `apps/supabase/supabase/schema/503-entity-rpcs.sql:405-421`, `:425-460`

**Issue:** The writer bounds its array at 1000 through `nomination_list_checked` "to limit the work one call can ask". The read takes any number of contests and evaluates `nomination_exists_in_contest` once per option and contest. Any entity editor can ask for options × N lookups in a single call. The only limit on that is the role's statement timeout.

**Fix:** Refuse an array longer than the writer's bound by returning NULL, as the function already does for a malformed array, or state the same 1000 cap.

### IN-03: The answers lock is not enforced on nominations server-side

**File:**
- `apps/frontend/src/lib/contestant/nominations/editorFacts.ts:17-22`
- `apps/supabase/supabase/schema/302-rls.sql` (`entity_delete_nominations`, `entity_update_nominations`)

**Issue:** `nominationsEditableOf` treats `access.answersLocked` as closing the editor. The database enforces only `access.nominationsLocked`. A direct `set_entity_nominations` call, or a DELETE through the new `entity_delete_nominations` policy, still works while answers are locked. It can unconfirm or delete the caller's own confirmed nominations while the VAA is live. The effect is limited to the caller's own entity.

**Fix:** Either document that only `nominationsLocked` is a server-side lock, or add `NOT private.project_answers_locked(project_id)` to the entity nomination policies, mirroring `project_nominations_locked`.

### IN-04: `desiredParentOf` names the parent's type as `parentRule.types[0]`, not the chosen option's type

**File:** `apps/frontend/src/lib/contestant/nominations/nominationDraft.ts:469`

**Issue:** `return { kind: 'entity', entityType: card.parentRule.types[0], entityId: card.parentChoice }` ignores the `entityType` that the chosen `ParentOption` carries. This is correct today only because `allowedParentTypes` never returns more than one type for a served entity. If a rule ever lists two types, the parent's type would be sent wrong.

**Fix:** Resolve the chosen option, for example through `parentChoicesOf` or a lookup over the listed entities, and send its `entityType`.

### IN-05: The three RPC-answer parsers are copies of one another

**File:**
- `apps/frontend/src/lib/api/adapters/supabase/utils/entityNominations.ts:45-53`
- `nominationParentOptions.ts:43-51`
- `setEntityNominationsAnswer.ts:28-35`

**Issue:** All three do the same `safeParse`, map each issue's path to a string, and throw `The answer of <rpc> did not match its schema at: ...`. The checklist asks for no repeated code.

**Fix:** Extract `parseRpcAnswer(schema, raw, rpcName)` and let the two nullable readers wrap it with `raw === null ? null : ...`.

### IN-06: The details step swallows lookup errors into a loading state that never ends

**File:** `apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/nominations/(edit)/details/+page.svelte:256-267`, `:277-298`

**Issue:** `listed` and `views` catch every exception from `dataRoot.getEntity`, `getElection` and `getConstituency`, and return `undefined`. `editorState` then stays `'loading'`: the main button keeps its loading form, and the page shows `<Loading />` with no error and nothing logged. One card whose constituency, or one option whose entity, the data root does not hold is enough to wedge the editor with nothing to diagnose it.

**Fix:** Log inside both catches, as `readParentOptions` does. Also treat a failed lookup as `'error'` once the options have been read, so the page shows its error message instead of spinning.

### IN-07: A `requestedParentOrganization` key with any value, JSON null included, satisfies the parent-required rule

**File:** `apps/supabase/supabase/schema/011-validation-functions.sql:466`, `:506`

**Issue:** `validate_nomination_parent_required` accepts `custom_data ? 'requestedParentOrganization'`, so it tests only that the key exists. `set_entity_nominations` validates the name as non-blank, but the `authenticated` column grant on `custom_data` lets a candidate's editor UPDATE its own row directly to `{"requestedParentOrganization": null}` in an `organization_list` election. That passes the deferred constraint. The row cannot be confirmed (rule 1), so nothing is published. The admin queue then holds a "requested party" with no name.

**Fix:** Require a non-blank string in both places: `jsonb_typeof(custom_data -> 'requestedParentOrganization') = 'string' AND btrim(custom_data ->> 'requestedParentOrganization') <> ''`.

---

_Reviewed: 2026-10-22T20:01:37Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
