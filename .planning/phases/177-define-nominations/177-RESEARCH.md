# Phase 177: Define Nominations - Research

**Researched:** 2026-10-10
**Domain:** PostgreSQL row-level security and deferred triggers (Supabase, PG 17.6); SvelteKit 2 loads and invalidation; Svelte 5 contexts; dev-seed templates; Playwright perm datasets
**Confidence:** HIGH for what was run or read in the tree; MEDIUM where a claim rests on documentation alone; every claim that was not observed by running something is marked UNCONFIRMED where it is made
**Tree read at:** `3a80c5506` (branch `feat/entity-signup-multi-grant`). Another agent was committing during the session; the planner re-reads every anchor.

**How to read the evidence tags.**
`[VERIFIED: run — …]` = observed by running something in this session; the command or script is named.
`[VERIFIED: read — path "anchor"]` = read in the tree in this session; the anchor is a quoted string or a symbol, never a line number.
`[CITED: url]` = taken from official documentation fetched in this session.
`[ASSUMED]` = not verified in this session; listed again in *Assumptions Log*.
**UNCONFIRMED** marks a behavioural or root-cause claim that was read but not run.

**What was run, and where.** (1) A scratch PostgreSQL **17.6** cluster (Homebrew binary, the same version as the Supabase image's `PostgreSQL 17.6`), started in the session scratchpad on port 55432 and stopped afterwards — for RQ-4 and the facts beside it. It held a reduced model of `nominations` and `elections`, **not the project schema**. (2) Read-only `psql` catalogue queries against the applied local database at `127.0.0.1:54322`. (3) `runPipeline` of `@openvaa/dev-seed` over all 33 built-in templates, with no database (RQ-1). (4) A `DataRoot` script (T-6). (5) `svelte/compiler` 5.57.1 over markup snippets (F4). **Not run:** the E2E suite, pgTAP, `yarn db:*`, the dev server, `yarn db:lint:sql`, any browser.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

`177-CONTEXT.md` § *Implementation Decisions* is about 700 lines. **Copied below, verbatim, is the bold decision statement of each of its 31 decisions.** Each decision's *From the tree*, *Planner constraints* and *If wrong* paragraphs are **not** copied; they stay binding where they stand, and the planner reads `177-CONTEXT.md` itself. Where this research found the tree to differ from a *From the tree* paragraph, it says so under *Research Items Answered*.

### Locked Decisions

**0 — Factual baseline**
- **D-01:** Accept all 20 facts of 177-0 as the baseline; restated under `<factual_baseline>` **with the corrections Phases 170, 171 and 173 made to facts 13, 15, 16 and 19, what Phase 175 is planned to change in fact 5, and what this phase's own overruled decisions change in facts 9 and 12**.

**A — What the user may define**
- **D-02 ⚠:** **`election_symbol` is opened to the entity user, on its own nomination only, while nominations are unlocked.** […] **it goes on applying to a placeholder parent row the caller inserts for a party or an alliance**, so a candidate cannot set a party's symbol.
- **D-03 ⚠:** **The parent matrix is adopted and exposed as `Election.nominationShape` in `@openvaa/data`, with one pure function `allowedParentTypes(shape, entityType)`; the adapter maps the column.**

  | `election_type` | Candidate | Organization |
  |---|---|---|
  | `organization_list` | nominable; parent **required**: a listed party or "Other" | nominable; parent optional: a listed alliance, "Other" or "None" |
  | `organization_list_and_independents` (**new, the default**) | nominable; parent optional: a listed party, "Other" or "Independent / no party" | as `organization_list` |
  | `candidate_only` | nominable; **no parent asked** | not nominable: the election is not offered in step 1 |
  | `organization_only` | not nominable: the election is not offered in step 1 | nominable; parent optional: a listed alliance, "Other" or "None" |

- **D-04 ⚠:** **The shape rules are added to `validate_nomination`: the database refuses a nomination the election's shape forbids, for every writer. A new election type, `organization_list_and_independents`, is added and made the default. It allows parentless candidate nominations.** OD08-E1 (a): in an `organization_list` election the trigger refuses a candidate row whose parent is NULL **unless** `custom_data` carries the `requestedParentOrganization` key; and the "has a parent or the key" condition is checked **at the end of the transaction**. OD08-E2 (a): (i) it binds INSERT and UPDATE, for every role, the service role included; (ii) a **faction** nomination is admitted where a candidate may have a parent (`organization_list` and the new type), and an **alliance** nomination wherever an organization may stand; (iii) **nothing re-checks existing nominations when an admin changes an election's type**. OD08-E3: **The seed templates are re-typed to the new default wherever that causes no issue**.
- **D-05:** **"Independent / no party" is offered to candidates only in `organization_list_and_independents` elections. "Other" satisfies a required parent. For an organization's alliance parent, "None" is the default option, selected by default.** **A candidate's selector has nothing preselected, in either list type** (OD08-E9 (a)).
- **D-06:** **The candidate's selector lists every confirmed organization in the project. When the chosen party has no nomination at that pair, one is created unconfirmed.**
- **D-07 ⚠:** **The organization's selector lists every alliance in the project, confirmed or not. `entity_insert_parent_nominations` and the organization role are extended so that an organization can create the alliance's nomination**. **The cap of 10 counts the caller's unconfirmed originated alliance rows too** (OD08-E4 (a)) — and **whether the cap is needed at all is evaluated by this phase's research**. **The row's type is paired with the caller's type** (OD08-E4 (a)).

**B — Write path, lock and removal**
- **D-08 ⚠:** **One `SECURITY INVOKER` RPC, `set_entity_nominations(p_entity_type, p_entity_id, p_nominations jsonb)`, applies the whole desired set in one transaction under the caller's own row-level security.** **The election round is decided in the database** (D-19). **A changed constituency is a DELETE and an INSERT** (OD08-E8 (a)). **`p_nominations` is a JSONB array of objects, one per nomination** (OD08-F3 (a)).
- **D-09:** **A new `SECURITY DEFINER` RPC returns the parent options as an allow-listed projection — id, entity type, name, short name, colour, image, and for each pair whether a nomination exists — gated on the caller holding `nomination.edit` on an entity in that project.**
- **D-10:** **The confirmation trigger stays as it is; the write path skips rows whose values did not change.**
- **D-11 ⚠:** **`entity_delete_nominations` is added: the caller's own nomination, project unlocked, confirmed or not; K warns before removing a confirmed one.**
- **D-12 ⚠:** **"Locked" is the app setting `access.nominationsLocked`. K, the nominations view and the write path all answer to that one lock; the database enforces it.**
- **D-13:** **K is not editable when either lock is on — `access.nominationsLocked` or `access.answersLocked`; only the nominations lock is enforced in the database.** **A K step opened by URL while K is not editable redirects to J, which shows the note** (OD08-E13 (a)).
- **D-14:** **Answers to questions that no longer apply are kept in the entity's `answers`, not asked and not counted by the task state; they return if the nomination returns.**

**C — Step 1: choosing the pairs**
- **D-15 ⚠:** **The two selector components are reused, and the ordering decisions are extracted from the voter route files into one shared pure module that both apps call.** **The contestant side does not honour `elections.disallowSelection`** (OD08-E14 (a)).
- **D-16:** **A single admissible election is never shown as a choice.**

  | Admissible elections | Constituencies of that election | What step 1 shows |
  |---|---|---|
  | one | one | nothing — the selection is skipped and the user goes straight to the card |
  | one | several | **the constituency step only**; no election step |
  | several | any | the election step, then the constituency step where a choice remains |

- **D-17 ⚠:** **One constituency per election for both entity types in this phase; a todo is filed for organization multi-constituency selection, and the todo says it could be enabled for candidates as well through a setting.** **The limitation is stated in the Publishers' Guide** (OD08-E15 (a)).
- **D-18:** **Separate routes under the nominations view, in a route group — the directories are `…/nominations/(edit)/elections`, `…/(edit)/constituencies`, `…/(edit)/details`, so the URLs are `…/nominations/elections`, `…/nominations/constituencies`, `…/nominations/details`, with no `edit` segment — and with the chosen ids in the URL search params, as the voter app carries them.**
- **D-19:** **A new nomination is for the election's `current_round`; the user is not asked.** **A todo is filed for checking the whole app for election-round conformity — it has not been tested.**

**D — Step 2: the cards**
- **D-20:** **One optional plain-text field per card, trimmed, capped at 50 characters, not per locale. The trim and the cap are applied by the input and again by the write RPC; no column constraint is added, so an admin import is not bound by the cap.**
- **D-21:** **The "Other" text is a trimmed, non-empty string at `nominations.custom_data.requestedParentOrganization` on the entity's own nomination, with the parent left NULL; other `custom_data` keys are preserved; the key is removed when a listed parent is later chosen.**
- **D-22:** **An inline note on each card whose nomination is currently confirmed** says that editing it needs re-confirmation.

**E — Tests and todos**
- **D-23:** **Contestant tests are added to `perm-startfromcg.spec.ts` on its existing dataset, with a signed-in contestant added through the admin client; and a new `contestant-nominations.spec.ts` runs on a dedicated perm dataset.**
- **D-24:** **The nomination part of `2026-09-24-data-model-vs-db-nomination-constraints.md` is done here and the todo is re-scoped to the remaining tables**.
- **D-25:** **`2026-08-28-preregister-election-constituency-selection-harmonisation.md` is closed at this phase**.

**F — Plan shape and gate**
- **D-26 ⚠:** **Five sequential plans.** (1) schema; (2) data model and adapter; (3) step 1; (4) step 2; (5) E2E, the two todos, the gate. The planner may split a plan that grows past one verifiable unit […] but keeps the order and **one** migration regeneration.
- **D-27:** **Closing gate: `yarn lint:check`, `yarn test:unit`, pgTAP, `yarn db:lint:sql`, the production build, then one full wrapper E2E run, and the new `contestant-nominations.spec.ts` three times in isolation; each read by exit status.**

**Additional notes and the operator decision**
- **D-28:** **The contestant's election and constituency selection differs from the voter's in one respect: it first filters the elections by the entity's type against each election's `election_type`. That does not stop it honouring `startFromConstituencyGroup`. However the logic is computed, the predicates are centralised as far as possible.**
- **D-29:** **The party selector and the alliance selector are one reusable component that renders its items as `EntityCard`s, in a compact variant if needed.**
- **D-30:** **The nominations lock affects nominations only; a name is gated on `confirmed`, not on the lock.**
- **D-31:** **The "Define nomination" task, and `nextStep` with it, lead straight to K's first step only when nominations can be edited (neither lock on, D-13) and the entity has no nomination. In every other case the task leads to J: with nominations the user sees them first and clicks Edit there to open K; when nominations cannot be edited J shows the "not editable" note and no Edit.**

**Locked after CONTEXT.md was written — the operator's rounds of 2026-10-09 and 2026-10-10**
- **`177-UI-SPEC.md`, U-01 to U-31: every item at its ★ option**, the departures U-08, U-13 and U-31 accepted as written (its *Checker Sign-Off*, "The operator's round, read on 2026-10-10"). The four open questions Q1, Q3, Q4, Q6 of the context are thereby ruled (U-01 to U-04). The screens may be planned.
- **The schema, the data model and the write path are bound by** U-02 (rows carry `id` when they describe an existing row; several rows of one election only where each has an `id`; at most one new row per election, none in an election where a row of the entity stays), U-03 (an existing in-reach row the set leaves out is deleted; an empty array is a valid set), U-04 (an object can say "leave this row's parent as it is"), U-05 (only rows at their election's current round in an election whose type admits the entity's type are touched), U-16 (the "Other" name: trimmed, non-empty, at most 100 characters, refused otherwise), U-21 (two refusals told apart by name: candidates listed under a nomination, and the limit on nominations waiting for confirmation), U-31 (`get_entity_nominations` returns the parent's entity id; `EntityNominationParent` carries it).
- **The UI-SPEC's one edit:** no numeric spacing class in the new markup; `gap-md` / `mt-md` where J writes `gap-12` / `mt-12`, and J's classes change with K's.
- **Section F of `.planning/v2.16-OPERATOR-DECISIONS-2026-10-09.md`, read 2026-10-10:** F4 (a) — `role="list"` on the home's task list (`<ol>`) and the nominations list (`<ul>`), no VoiceOver check. F6 (a) — Phase 177 owns the todo "the user-data store rewrites its current value with an equal copy under the answers lock". F8 (a) — the preview is served when its gate cannot read the elections or constituencies; the behaviour stays, the preview's docstring and its docs page are corrected. F2 (a) and F7 (a) — nothing for this phase (no task-state member for the note's sentence; no database refusal of answers for an entity with no nomination).

### Claude's Discretion

- The names, locations and exact signatures of the shared ordering module, the data-package function beside `allowedParentTypes`, the writer method, the parent-options RPC and the selector component.
- The route-constant names (beside `ContestantAppProfile` in `lib/routes/route.ts`) and the test ids (following `tests/tests/utils/testIds.ts`).
- What `set_entity_nominations` returns, and the key names inside each object of `p_nominations`, within D-08 and D-19 (the argument is an array of objects — OD08-F3 (a)).
- How K re-runs the entity-level load after the write (NOM-08), within the constraint under `<code_context>` § *Integration points*.
- The wording of the new strings and their message-key names; a string that differs by entity type gets one key per type, picked through Phase 175's descriptor (175-CONTEXT D-17).
- The control used for the parent selector and its compact card variant, within D-29 and the UI spec.
- Whether plan 1 of D-26 is one plan or split, within one migration regeneration.
- The warning shown before a confirmed nomination is removed (D-11): inline or a dialog. *(Settled since by U-06 ★: inline.)*

### Deferred Ideas (OUT OF SCOPE)

- Several constituencies per election for one entity — 177-C3 (b) and (c), not chosen; a todo (O-7).
- A digits-only or a multilingual symbol — 177-D1 (b) and (c), not chosen; the symbol-type setting is a todo.
- Deleting or separately listing answers to questions that no longer apply — 177-B7 (b) and (c), not chosen.
- A confirmation dialog on Continue — 177-D3 (b), not chosen.
- Changing the confirmation trigger to compare old and new values — 177-B3 (b), not chosen.
- The whole data-model-versus-database comparison — 177-E2 (b), not chosen; the remaining tables stay in the todo.
- Faction users, and factions as a parent option.
- An Admin-app confirmation queue, and an Admin-app control for the nominations lock.
- Deleting the legacy `preregister` selection pages — Phase 179.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description (REQUIREMENTS.md) | Research Support |
|----|-------------------------------|------------------|
| NOM-03 | Pick election and constituency pairs the way a voter does, `startFromConstituencyGroup` honoured; only elections whose type admits the entity's type are offered | The voter's decisions are in two universal loads that build a temporary `DataRoot` from `await parent()` — the pattern the editor's loads reuse (*Pattern 4*); N-2 settled (the context's data root is empty in the server render); `Election.nominationShape` needs one mapped column the adapter already selects (*Pattern 1*); T-9 and N-1 for the two selectors |
| NOM-04 | Symbol and parent per pair; parent required for candidates in `organization_list`; shape rules enforced in `validate_nomination` for every writer | RQ-4 **measured positive** (deferred constraint trigger); RQ-1 census (six seeded rows in three templates, no pgTAP fixture); the matrix as one SQL function beside one TS function (*Pattern 2*); `NEW.entity_type` is NULL in a BEFORE trigger (*Pitfall 3*) |
| NOM-05 | "Other" stores free text in `customData.requestedParentOrganization`, no parent linked | The key's presence satisfies the deferred rule (measured, T5); the write merges `custom_data`; `get_entity_nominations` already returns `custom_data` |
| NOM-06 | Created or updated on Continue; refused when locked; an edit unconfirms | RQ-2 (`authenticated` holds DELETE); RQ-3 (what each refusal looks like at the client); **a locked UPDATE or DELETE is a silent zero-row statement, not an error** (*Pitfall 1*); `INSERT … RETURNING` fails on the placeholder parent (*Pitfall 2*) |
| NOM-08 | After a nomination changes the questions asked follow at once | RQ-6: `invalidateAll()` reruns the entity-level load without changing it; the entity layout's effect then gives the new data to both lists (*Pattern 5*) |
</phase_requirements>

## Summary

Every research item of the context (RQ-1 to RQ-8) and the two the previous phases left (T-6, T-11) is answered below; five of the seven "could not establish" items of the UI spec are settled (N-1, N-2, N-3, N-4, N-7), and two stay open because they need a browser (N-5, N-6).

**The end-of-transaction check of OD08-E1 (a) is expressible.** On PostgreSQL 17.6 a `CREATE CONSTRAINT TRIGGER … AFTER INSERT OR UPDATE … DEFERRABLE INITIALLY DEFERRED` with a `WHEN` clause did exactly what the ruling asks: a lone party-less candidate insert in an `organization_list` election returns and then fails at COMMIT with nothing stored; the three-statement order (own row → parent → repoint) commits; the "Other" key satisfies it; the service role is bound; a row deleted before the check is skipped. `supabase db lint` cannot object to the trigger function, because the installed CLI's lint query excludes every function that returns `trigger`. **Nothing goes back to the operator on RQ-4.** Three consequences follow that the context does not state and the plans must carry: the deferred rule is **invisible inside a transaction that never commits** — every pgTAP file is one — so the write function forces it before it returns (`SET CONSTRAINTS … IMMEDIATE`, measured to work inside a `SECURITY INVOKER` function) and pgTAP asserts it the same way; the trigger function must **re-read the row**, because the queued event carries the tuple as first written; and the row rule that needs no deferral stays in the BEFORE trigger.

**Two properties of row-level security shape the write function more than any decision does.** A `DELETE` or an `UPDATE` that a policy's `USING` clause refuses is not an error: it affects zero rows. Under the nominations lock a save that only changes a symbol would therefore return success having written nothing, unless the function counts rows and raises. And the caller cannot read the placeholder parent it has just inserted, so `INSERT … RETURNING id` on it fails with 42501 (measured); the function needs one small `SECURITY DEFINER` lookup in `private` to learn the parent nomination's id.

**The census is small.** Of 33 seed templates, three hold a row the rule refuses — six rows, all party-less candidates in `organization_list` elections (`e2e/base` 4, `perm-organization-editing` 1, `perm-no-nomination` 1). No template states any type but `organization_list`, nothing in the application reads the type before this phase, and no pgTAP fixture states a type at all, so every template can be re-typed to the new default without touching a count; only the new dataset keeps one `organization_list` election.

**Primary recommendation:** build the shape rule as two triggers over one SQL statement of the matrix (a row rule in `validate_nomination`, a deferred constraint trigger for "has a parent or the text"), have `set_entity_nominations` count the rows of every `UPDATE` and `DELETE` and force the deferred rule before returning, and rerun the entity-level load with `invalidateAll()` after every save and after every refusal.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Which entity type may stand in which election; whether a parent is required | Database (triggers on `nominations`) | Data package (`allowedParentTypes`) for what the screens offer | OD08-E2 (a): binds every writer, the service role included; the screens only decide what to show |
| Who may write which nomination row; the lock | Database (RLS policies, column grants, triggers) | — | D-08: "The existing policies, column grants and triggers stay the only gate" |
| Applying a desired set as one unit | Database (`set_entity_nominations`, `SECURITY INVOKER`) | Frontend writer (one method, maps refusals to results) | One transaction; no authority of its own |
| The parent options | Database (`SECURITY DEFINER` RPC, allow-list) | Frontend adapter (parse, translate, hand to the data root) | The caller's own policies refuse those rows |
| The election round of a new nomination | Database (the RPC reads `elections.current_round`) | — | D-19: not a client field |
| Which step of the editor is shown; the skip | Frontend load (universal, from the root load's data) | Shared pure module in `$lib` | The voter's decisions are made the same way, in loads |
| Whether the editor is served at all | Frontend load (guard) | Database (the real gate) | D-13: the answers lock is enforced on the screens only |
| The selection before Continue | Browser (URL search params) | — | D-18 |
| The draft: symbol, parent choice, "Other", removed state | Browser (page state) | — | UI-SPEC: nothing is written before Continue |
| What the questions, the task state and J show after a save | Frontend server load (entity level, rerun) | Browser (context effects) | NOM-08; the load supplies nominations and question data together |
| Seed data conformity | dev-seed templates | Database (refuses on import) | OD08-E3 |

## Research Items Answered

### RQ-1 — The fallout census (D-04, OD08-E3) and T-11, N-7

**Seed templates.** All 33 entries of `BUILT_IN_TEMPLATES` were run through `runPipeline` (with `BUILT_IN_OVERRIDES` where one exists) and every emitted nomination row was classified against the four-row matrix. `[VERIFIED: run — scratchpad census.mts over packages/dev-seed/src/templates/index.ts and pipeline.ts]`

| Finding | Evidence |
|---|---|
| Every election of every template states a type, and it is `organization_list` in all of them | census column `elections=`; no `(unstated)` |
| **Rows the "parent required" rule refuses: 6, in 3 templates** | `e2e/base`: `test-e2e-base-nom-reg-n-ca-independent`, `test-e2e-base-nom-reg-n-ca-sel-a`, `test-e2e-base-nom-reg-n-ca-sel-b`, `test-e2e-base-nom-mun-nw-ca-independent`; `perm-organization-editing`: `e2e-perm-organization-editing-nom-ca-unconfirmed`; `perm-no-nomination`: `e2e-perm-no-nomination-nom-ca-nominated` |
| Rows a cell rule refuses (a candidate in `organization_only`, an organization or alliance in `candidate_only`): **0** | census column `refused-cell=0` on every line |
| The other 30 templates hold candidates with a parent and party-level rows without one | e.g. `perm-startfromcg`: `organization_list/organization/no-parent` 14, `organization_list/candidate/parent` 14 |
| `default`: 327 candidate rows, all with a parent | census; the applied local database agrees: `organization_list | candidate | f | 327` `[VERIFIED: run — read-only psql]` |

**Does re-typing cause an issue?** No application code reads the type today: the only files under `apps/`, `packages/`, `tests/`, `scripts/` and `.claude/skills/` that name a shape value are the schema and its migration, `15-visibility-flags.test.sql`, `supabaseDataProvider.test.ts`, the generated types, `packages/dev-seed/README.md`, `ElectionsGenerator.ts`, and the files under `packages/dev-seed/src/templates/` that state a type (`_helpers/buildMinimal.ts`, `default.ts`, `e2e/base.ts`, `e2e/perm/notLocated2e2cgShape.ts` and the perm templates that do not go through the helper), and `.claude/skills/database/schema-reference.md`. `[VERIFIED: run — grep -rln over those trees for the four value names]` The list is a population: the planner derives it again by the same search. So before this phase a re-typed template behaves identically, and after it the type changes one thing: what a **candidate's** card on K offers (an "Independent / no party" option, and no required parent).

**Recommendation, template by template (OD08-E3):**

| Template(s) | Disposition | Reason |
|---|---|---|
| `e2e/base`, `perm-organization-editing`, `perm-no-nomination` | **re-typed** to `organization_list_and_independents` | they hold a row the rule refuses; giving those candidates a party instead would change what voters and counts see |
| the other 30, `_helpers/buildMinimal.ts`, `notLocated2e2cgShape.ts` | **re-typed** | "wherever that causes no issue": nothing observable changes, and no existing spec reaches K with a candidate of these datasets |
| the new `contestant-nominations` dataset | one election states `organization_list` (the required-parent case), one the new type | D-23 |
| `ElectionsGenerator` (`election_type: 'candidate_only'`) | **the planner's named decision**; recommended: emit the new default | with `candidate_only` a template that pairs synthetic elections with `fixed[]` party nominations is now refused by the cell rule; the new default admits everything the generators and `fixed[]` rows can express. No built-in template is affected either way (`refused-cell=0`) |

**`perm-no-nomination` must be re-typed whatever else is decided (T-11, N-7).** Besides its seeded row, its fixture step `setNominationState` writes a party-less candidate nomination through `bulk_import` at run time. `[VERIFIED: read — tests/tests/fixtures/contestant/perm-no-nomination.ts "await admin.bulkImport({ nominations: ["]` Under `organization_list` that import would fail at the commit of its own call. On the new type, the unnominated candidate's card on K offers "Independent / no party", the dataset's one confirmed party `or-none` (with the not-nominated hint) and "Other". `[VERIFIED: read — perm-no-nomination.ts header "All three entities take the seed's confirmed default"]`

**pgTAP fixtures.** No file under `tests/database/` and neither `900-test-helpers.sql` nor `seed.sql` states an `election_type` on a fixture election; every fixture election takes the column default, which becomes the new type. `[VERIFIED: run — grep over tests/database, schema/900-test-helpers.sql, seed.sql]` The new default admits a candidate with or without a parent, an organization, an alliance and a faction, so **no fixture row is refused**. And the deferred half of the rule never fires in a pgTAP file at all (*Pitfall 4*). What does change:

- `15-visibility-flags.test.sql` pins the enum: `'The nomination-shape enum has exactly the three ratified members and no fourth'`, compared "as a sorted array rather than as a count, so a FOURTH member reddens naming itself". It moves to four members in the same commit as the enum. `[VERIFIED: read]`
- `08-triggers.test.sql` gains the grid; a fixture election that must prove a refusal states its type.

**Other writers of `public.nominations` at run time**, all through the service role and all bound by the rule: `bulk_import` (the dev-seed writer, the E2E admin client), `invitationFlow.fixture.ts` (`admin.update('nominations', nomination.id, { confirmed: … })`), and `supabaseDataWriter.integration.test.ts`, whose election is inserted without a type and whose candidate row has a parent. No Edge Function and no server route writes a nomination. `[VERIFIED: run — grep for from('nominations') and INSERT INTO … nominations over apps/frontend/src, the functions directory, the schema and seed.sql]`

### RQ-2 — DELETE privilege, and what the gates need registered

- **`authenticated` holds table-level DELETE on `public.nominations`** in the applied database (with REFERENCES, SELECT, TRIGGER, TRUNCATE; INSERT and UPDATE are column-level). `[VERIFIED: run — read-only psql over information_schema.role_table_grants]` `303-column-grants.sql` revokes and re-grants INSERT and UPDATE only. No grant is needed for the new policy. `[VERIFIED: read — "REVOKE INSERT ON public.nominations" and the UPDATE pair]`
- **`lint-schema.mjs` check 9001** derives everything from the catalogue and needs no registration: a policy that names a permission literal "reaches". The new DELETE policy names `nomination.edit`; the nominations table's read set (`project.read_entities`, `nomination.read`) and write set stay disjoint. `[VERIFIED: read — SQL_PERMISSION_SEPARATION, CTEs polmem, sets, c1, c3]` UNCONFIRMED until `yarn db:lint:sql` runs on the changed schema.
- **`25-matrix-conformance.test.sql`**: its row `'matrix row nomination.create_parent'` is `'TTTTfffTff'`, probed at `ARRAY['nomination.create_parent', 'entity', 'alliance_a', 'alliance']`. An organization editor's new cell is an *own* cell and the probe target is an alliance, so **the string does not change and the new cell is measured by nothing** unless a probe is added. `[VERIFIED: read]`
- **`29-authenticated-disjunct-order.test.sql`** is about the order of SELECT disjuncts; no SELECT policy changes.
- **`07-rpc-security.test.sql`**: the census for `authenticated` is now **nine** names — `'claim_invitations,contestant_app_public_config,get_entity_basic_data,get_entity_nominations,project_open_for_voters,storage_path_can,storage_path_is_public,user_can,user_has_account_grant'` — and the applied database agrees. The context's "seven" is two phases old. The parent-options RPC makes it ten; `anon`'s six do not move. `[VERIFIED: read + run — read-only psql over pg_proc]`
- **Further files that state the organization role's permissions**, to move with `grant_role_permissions`: `12-user-can.test.sql` (nine sites naming `nomination.create_parent`), `23-nominations-write.test.sql` (its `PERM:` case uses an organization editor as the caller that lacks the permission — it needs another such caller), `.claude/skills/database/rls-policy-map.md` (the matrix row), `apps/docs/…/developers-guide/backend/authentication/+page.md` (the role table). `[VERIFIED: run — grep for create_parent]` A population, derived again at plan time.
- **`scripts/assert-project-scoped-queries.mjs`** refuses an `rpc(` with no entry in `PROJECT_SCOPED_RPCS`; both new RPCs need a written disposition (`upsert_answers` is entered as `'scoped-by-identity: entity type + entity id + RLS'`, `get_entity_nominations` as `'requires p_project_id'`). `[VERIFIED: read]`

### RQ-3 — How a refusal reaches the client through the write function

supabase-js hands back PostgREST's body as `error` with `code`, `message`, `details`, `hint`; the HTTP status is not what the writer reads. `[CITED: docs.postgrest.org/en/stable/references/errors.html]` The writer's precedent is `isNameRefusal`: `error.code === RAISED_EXCEPTION_CODE && error.message.startsWith(NAME_REFUSAL_PREFIX)`, returned as a result member (`{ type: 'nameRefused' }`), every other failure thrown. `[VERIFIED: read — supabaseDataWriter.ts]`

| What refuses | `code` | `message` | Status (PostgREST) | Can the page name it? |
|---|---|---|---|---|
| An INSERT a policy's `WITH CHECK` refuses (the lock among them) | `42501` | `new row violates row-level security policy for table "nominations"` | 403 | No — the policy and the conjunct are not named |
| **An UPDATE or DELETE a policy's `USING` refuses (the lock among them)** | — | **no error: zero rows** | 200 | **Not unless the function counts rows and raises** (*Pitfall 1*) |
| `enforce_nomination_entity_columns` | `42501` (`insufficient_privilege`) | starts `Only a holder of project.edit_nominations may …` | 403 | by prefix; a defect if the app meets it |
| The cap branch of `enforce_nomination_confirmation` | `P0001` | starts `A caller may originate at most 10 unconfirmed parent organization nominations` (this phase rewords it for alliances) | 400 | **yes — code and prefix** |
| Rules 1 and 2 of the same trigger | `P0001` | names the nomination | 400 | not needed |
| `validate_nomination`, tenancy | `23514` | `Nomination election % does not belong to …` | 400 | not needed |
| `validate_nomination`, hierarchy | `P0001` | e.g. `Faction nominations must have a parent organization nomination` | 400 | not needed |
| **A removed or moved nomination with candidates under it** | `23503` | `update or delete on table "nominations" violates foreign key constraint "nominations_parent_nomination_id_fkey" on table "nominations"` | 409 | **yes — code and the constraint's name** |
| The uniqueness key (two candidates creating one party's placeholder at once) | `23505` | names `nominations_entity_parent_contest_key` | 409 | no; a retry succeeds |
| The new shape refusals | this phase's to choose | this phase's to choose | 400 | by code and prefix if wanted |
| A malformed argument | `22023` in `create_invitations`' form, naming the index | — | 400 | no; a defect if the app meets it |

Evidence: the 42501 text, the 23503 text with `CONSTRAINT NAME: nominations_parent_nomination_id_fkey`, and a 23514 raised by a deferred trigger were produced on the scratch cluster `[VERIFIED: run — rq4-run.sql T4, T8, T1]`; the constraint exists under that name in the applied database with `confdeltype = a` (NO ACTION) `[VERIFIED: run — read-only psql over pg_constraint]`; the trigger messages and codes are read from `011-validation-functions.sql` `[VERIFIED: read]`; the status column is the documentation's `[CITED: docs.postgrest.org — "23503 | 409", "23505 | 409", "42501 | if authenticated 403, else 401", "P0001 | 400", "other | 400"]`. **Not run:** any of these through PostgREST against the project's schema — UNCONFIRMED until the writer integration test asserts them.

**Recommendation.** The two refusals U-21 names are told apart as the name refusal is today: a constant for the SQLSTATE and a constant for the message's start (the cap) or the constraint's name (the foreign key), each pinned in pgTAP with `throws_ok` / `throws_like` and asserted through the real API in `supabaseDataWriter.integration.test.ts`. The writer returns a result — for example `{ type: 'saved', … } | { type: 'refused'; reason: 'hasCandidates' | 'tooManyPending' }` — and throws on everything else, which the page shows as `failed`. The lock and a changed list need nothing of the refusal's shape, as S9 of the UI spec intends, **provided** the function turns a zero-row statement into an error.

### RQ-4 — Is the end-of-transaction check expressible? **Yes.**

Measured on PostgreSQL 17.6 with a reduced `nominations` / `elections` pair, row-level security shaped like the project's (the caller reads its own candidate rows, may insert an organization row and cannot read it), a `SECURITY DEFINER` BEFORE trigger for the cell rule and this constraint trigger `[VERIFIED: run — scratchpad rq4-setup.sql, rq4-run.sql, rq4-run2.sql]`:

```sql
CREATE CONSTRAINT TRIGGER nominations_parent_required
AFTER INSERT OR UPDATE ON public.nominations
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
WHEN (NEW.candidate_id IS NOT NULL AND NEW.parent_nomination_id IS NULL)
EXECUTE FUNCTION public.validate_nomination_parent_required ();
```

| # | Measured | Outcome |
|---|---|---|
| T1 | A lone party-less candidate insert in `organization_list`, as `authenticated` | `INSERT 0 1`, then `COMMIT` fails `23514` with `CONSTRAINT NAME: nominations_parent_required`; 0 rows stored |
| T2 | Own row → parent → repoint in one transaction, inside a `SECURITY INVOKER` function | commits; the check fired once (for the INSERT event), re-read the row and found the parent |
| T3 | `SET CONSTRAINTS public.nominations_parent_required IMMEDIATE` inside that function (`search_path = ''`) | raises **inside the call** for a lone party-less row; passes after the three statements; `… DEFERRED` restores the mode |
| T3b | The same function without forcing, in a transaction that is rolled back | returns; **nothing is ever raised** |
| T5 | The "Other" key; the new type; a candidate in `organization_only` | passes; passes; refused at once by the BEFORE trigger |
| T6 | An UPDATE that unlinks the parent; then the row deleted before the check | refused when forced; skipped (the re-read finds no row) |
| T7 | `service_role` with `BYPASSRLS` | bound: fails at COMMIT |
| T9 | A row inserted with its parent already set | no event is queued (the `WHEN` clause) |
| U1 | `EXECUTE 'INSERT …; SET CONSTRAINTS ALL IMMEDIATE'` inside an exception block — the shape of pgTAP's `throws_ok` | caught as `23514`; afterwards the mode is deferred again |
| U2 | `SET CONSTRAINTS ALL IMMEDIATE` inside a savepoint, then `ROLLBACK TO` | the mode reverts to deferred |
| U3 | The mode left IMMEDIATE, then the three-statement function | **fails at its first statement** |

Supporting documentation: "Constraint triggers must be `AFTER ROW` triggers on plain tables"; "A pending deferred-trigger firing can also be forced to happen immediately by using `SET CONSTRAINTS`"; "for constraint triggers, evaluation of the `WHEN` condition is not deferred, but occurs immediately after the row update operation is performed. If the condition does not evaluate to true then the trigger is not queued for deferred execution." `[CITED: postgresql.org/docs/17/sql-createtrigger.html]`

**What the SQL linter says.** `supabase db lint` passes each function to `plpgsql_check_function` through a query that ends `WHERE l.lanname = 'plpgsql' AND p.prorettype <> 2279 AND n.nspname = $1::text;`, and `2279::regtype` is `trigger`. So **no trigger function is linted** — not the new one, and not `validate_nomination` today. `[VERIFIED: run — strings over node_modules/@supabase/cli-darwin-arm64/bin/supabase (CLI 2.118.0); read-only psql "select 2279::regtype"]` `plpgsql_check` 2.8 is available in the Supabase image and not installed (the CLI creates it for the run). `[VERIFIED: run — pg_available_extensions]` The linter **will** read `set_entity_nominations`; what it says about a `SET CONSTRAINTS` statement inside it was not run — UNCONFIRMED, and the first thing the schema plan measures. The two Splinter-derived checks of `lint-schema.mjs` (RLS disabled; unindexed foreign keys) and check 9001 read tables, constraints of type `f` and policies; a constraint trigger adds a `pg_constraint` row of type `t`, which none of them selects. `[VERIFIED: read — lint-schema.mjs "WHERE c.contype = 'f'"; run — the scratch catalogue shows contype t]`

**Design facts that follow, each measured:**

1. **The function re-reads the row.** The queued INSERT event carries the tuple as inserted (`queued_parent=<NULL>` in every notice), so a function that judged `NEW` would refuse the three-statement order.
2. **The write function forces the rule before it returns**, and puts the mode back: `SET CONSTRAINTS public.<name> IMMEDIATE; SET CONSTRAINTS public.<name> DEFERRED;`. Then the refusal is raised inside the call, a pgTAP assertion of the function sees it, and the function does not depend on how PostgREST reports a failure at COMMIT.
3. **A statement that leaves the mode IMMEDIATE breaks every later three-statement write in that transaction** (U3). pgTAP assertions force and restore, or force inside `throws_ok`, whose rolled-back subtransaction restores the mode by itself (U1, U2).
4. **The project has no constraint trigger today** `[VERIFIED: run — read-only psql over pg_trigger where tgconstraint <> 0: no row in public]`; this is the first, and the database skill's trigger conventions gain it.
5. **A direct PostgREST insert of a lone party-less row** is refused at the request's own COMMIT. That PostgREST returns such a failure as an ordinary error body is `[ASSUMED]` and is one pgTAP-independent case for the integration test.
6. **OD08-E2 (iii) has a consequence.** After an administrator changes an election's type, any later UPDATE of a row that the new type forbids — confirming it, for instance — is refused, because the rule is asked when a nomination is written. That is what the ruling says; it is named here so that nobody meets it as a surprise.

### RQ-5 — What Phase 176 built

`176-19-SUMMARY.md` § *For Phase 177* is accurate against the tree where this research re-read it: `TaskRoute` is a closed union of six routes `[VERIFIED: read — taskState.ts "export type TaskRoute"]`; `hasNomination` is true for any non-empty list; `get_entity_nominations (p_project_id, p_entity_type, p_entity_id)` returns `id`, `election_id`, `election_name`, `constituency_id`, `constituency_name`, `election_round`, `election_symbol`, `confirmed`, `custom_data` and `parent` (`entity_type`, `name`, `short_name` — **no id**, T-1) `[VERIFIED: read — 503-entity-rpcs.sql "'parent', CASE WHEN p.id IS NULL THEN NULL ELSE jsonb_build_object("]`; `42-entity-nominations.test.sql` (`plan (69)`) pins the parent's keys through `pg_temp.parent_keys`, so U-31 changes that assertion.

### RQ-6 — How the entity-level load is rerun

**`invalidateAll()`.** It "Causes all `load` and `query` functions belonging to the currently active page to re-run. Returns a `Promise` that resolves when the page is subsequently updated." `[CITED: svelte.dev/docs/kit/$app-navigation; VERIFIED: read — @sveltejs/kit 2.70.3 src/runtime/client/client.js "export function invalidateAll()"]`

- **The load does not change, so its tracking test does not either.** `layout.tracking.test.ts` asserts the event members taken are exactly `['fetch', 'locals', 'params', 'parent']`; a `depends()` key would add a member and redden it. `[VERIFIED: read]`
- **Both lists follow by themselves.** The entity layout's effect reruns when its `data` changes and calls `dr.provideQuestionData(…)` and `userData.init(snapshot.userData)`; `init` on the same entity keeps the answer draft and the staged properties and replaces the saved data, nominations included. `contestantCtx.nominations` is `page.data.contestantUserData?.nominations`. `[VERIFIED: read — ENTITY/+layout.svelte; contestantUserDataState.svelte.ts "init = (data"; contestantContext.svelte.ts "#nominations = $derived"]`
- **A rerun that redirects navigates.** In `_invalidate`, `if (navigation_result.type === 'redirect') { return _goto(new URL(navigation_result.location, current.url).href, { replaceState: true }, …` `[VERIFIED: read — the same client.js]` So after a refused save, `invalidateAll()` reruns the root load (fresh settings), then the editor's guard, and a lock found there takes the user to J with no further code — U-21's first row.
- **The promise resolves after `root.$set(…)`; the context's effects have not necessarily run.** The page awaits `tick()` before it reads `contestantCtx.taskState`, and falls back to the entity's home while `taskState.known` is false. UNCONFIRMED: that one `tick()` suffices was read from the effect chain, not run; a component test of the real page, layout, provider and store pins it (the method `176-19` used for the store defect).
- `PreventNavigation` asks on any navigation while the draft is dirty; the page sets its bypass **before** `invalidateAll()` on both paths, or the redirect to J opens a confirm (*Pitfall 8*).

That the page stays mounted through `invalidateAll()` with no `<Loading />` frame is UNCONFIRMED (read: the root layout's and the entity layout's states are `$derived` over data that stays valid; not run).

### RQ-7 — A closed project's structure in the Contestant app

An entity editor reads the elections, constituency groups and constituencies of its project whether or not the project is open: the three `authenticated_select_*` policies admit `user_can ('project', project_id, 'project.read_structure')`, both entity rows of `grant_role_permissions` hold `'project.read_structure'`, and `user_can`'s "NAMED BRANCH 1, the project-read branch" extends an entity grant to its project for exactly that permission. `[VERIFIED: read — 302-rls.sql, 301-auth-functions.sql]` Not run against a closed project in this session — UNCONFIRMED; `30-closed-project.test.sql` is where it is pinned if it is not already.

### RQ-8 — Is the cap of 10 needed? **A finding for the operator; nothing is changed by it.**

**What it protects, and what the other guards already do.** `entity_insert_parent_nominations` is the one policy that lets a caller write a row that is not its own. Without the cap, guards 1 to 5 still hold: the row is unconfirmed, so no voter sees it; the caller must hold a nomination **at that contest**; and guard 3 admits a placeholder only where the party has **no** nomination at that contest, so the whole project can never hold more than one placeholder per party per contest, whoever writes them. `[VERIFIED: read — 302-rls.sql, the policy and its comment]` The cap is therefore not what bounds the table and not what protects voters.

**What only the cap does.** It bounds one user's share. A caller's own nomination can be moved to another contest of the project by a direct UPDATE (`election_id` and `constituency_id` are in the UPDATE column grant, and the update policy checks only that the election is in the project) `[VERIFIED: read — 303-column-grants.sql, entity_update_nominations]`, so one signed-in editor can walk its nomination from contest to contest and leave a placeholder for every party at each — parties × contests rows — where the cap stops it at ten until an administrator acts. Each such row lands on the administrator's queue, and from this phase on it also appears on that party's own nominations view as a pending nomination its editor did not make, which that editor cannot remove while a candidate is listed under it (D-11's foreign-key refusal). UNCONFIRMED as an attack: derived from the policies, not run.

**What it costs.** `private.caller_unconfirmed_originated_count` counts `created_by` the caller, `organization_id IS NOT NULL`, `NOT confirmed`, and the trigger's cap branch fires for any such insert — so it counts, and can refuse, **an organization editor's own nominations** (fact 10), per user and not per entity. From this phase on an organization's editor creates those rows through K, and with OD08-E4 (a) its alliance placeholders count as well. A changed constituency (a delete and an insert) leaves the old placeholder behind, still counted, and not deletable by the user who made it.

**Options for the operator** (the cap is built as OD08-E4 (a) states until one is ruled):

| | Option | Effect |
|---|---|---|
| (a) | As ruled: 10, per user, counting organization and alliance rows the caller originated, its own included | An editor of several parties, or of one party standing in many elections, can be refused its **own** eleventh nomination |
| (b) ★ recommended | Keep the cap at 10 and stop counting rows of an entity the caller edits (the count and the trigger's branch both ask `nomination.edit` on the row's entity) | The cap bounds placeholders only — what its own comment says it is for; closes todo O-7 item 4 instead of filing it |
| (c) | Remove the cap (the policy conjunct, the trigger branch, the helper) | One user can create parties × contests placeholders; `created_by` loses its only reader |
| (d) | Count per entity instead of per user | Fixes the several-parties case and not the many-elections one |

### T-6 / N-3 — Does `provideEntityData` reset the data root's entity collections? **No. It is an upsert by id.**

`provideData` does `this.children[collection] ??= new Map()` and `collObject.set(obj.id, obj)` for each object, and returns early on an empty array; no provide method clears anything. `[VERIFIED: read — packages/data/src/root/dataRoot.ts "protected provideData"]` Run: after `provideEntityData([candidate c1, organizations o1, o2])` and then `provideEntityData([organization o1 renamed, alliance a1])` the root holds 1 candidate, 2 organizations, 1 alliance; `o2` is still there; `o1` is a **new object** with the new name; `provideEntityData([])` changes nothing. `[VERIFIED: run — scratchpad t6.mts over packages/data/src/index.ts]`

So of the three statements T-6 lists, the 173-13 summary is right, and the `DataRoot` docstrings ("Existing data will be reset, along with any dependent collections") and the selection page's comment are wrong. For S7: giving the parent options to the data root removes nothing another page relies on; **an option that is no longer listed stays in the root from an earlier provide**, so the selector's options are the ids of the RPC's answer, each resolved in the root — never "every organization the root holds"; and an entity's object identity changes when it is provided again.

### N-1 — Does `ElectionSelector`'s label wrap? **No.**

Its label is `class="label gap-sm cursor-pointer justify-start !p-0"` `[VERIFIED: read — ElectionSelector.svelte]` and DaisyUI 5.7.46 declares `.label{white-space:nowrap;…display:inline-flex}` `[VERIFIED: run — grep over node_modules/daisyui/components/label.css]`. Phase 174.1 measured that label as computed `nowrap` and fitting only because the dataset's names are short ("widest 226.2 px"). `[VERIFIED: read — .planning/todos/pending/2026-10-07-174.1-daisyui-label-nowrap-is-a-latent-overflow-in-other-label-users.md; not re-measured]` With the long election name U-27 puts into the dataset the page will widen; **U-30's fix (`whitespace-normal` on the label) is planned as built**, and the phone-width check is its verification. Where a label wraps beside a checkbox the box is centred on the lines unless the label also takes `!items-start` (the same todo).

### N-2 — Does the contestant data root hold the elections in the server render? **No.**

The root layout gives them to the data root inside an `$effect` (`dr.provideElectionData(snapshot.electionData); dr.provideConstituencyData(snapshot.constituencyData);`), and effects do not run on the server; the voter's election page reads `voterCtx.dataRoot.elections` and guards its body with `{#if elections.length}`. `[VERIFIED: read — routes/+layout.svelte; (voters)/elections/+page.svelte]` Not run in a server render — UNCONFIRMED, but the mechanism leaves no other reading. So the steps keep the loading state the UI spec gives them. What **is** on the server is the root load's own data — `appSettingsData`, `electionData`, `constituencyData` — which a universal load reads through `await parent()`; that is how the editor's loads decide and how J's states reach the server-rendered markup (*Pattern 4*).

### N-4, N-5, N-6, N-7

- **N-4:** RQ-3, RQ-4, RQ-6 and RQ-8 above.
- **N-5** (a long party name inside `EntityCard`'s header grid at 320 px): **open** — needs a browser; the phone-width check of U-27 measures it.
- **N-6** (axe and contrast inside an `aria-hidden` card): **open**, and it changes nothing the contract asks.
- **N-7:** settled by RQ-1 — `perm-no-nomination` ends on the new type.

### F4, F6, F8 — what the inherited items touch

- **F4.** The two lists are the home's `<ol class="mt-lg w-full list-none pl-0" …>` and J's `<ul class="mt-lg gap-lg flex list-none flex-col self-stretch pl-0" data-testid="contestant-nominations-list">`. `[VERIFIED: read]` **`role="list"` on a `<ul>` or an `<ol>` raises no Svelte warning** on svelte 5.57.1 — `compile()` returned `[]` for both — so no accepted-warning comment is needed, and the todo's statement that it "trips Svelte's `a11y_no_redundant_roles` warning" is wrong on this version. `[VERIFIED: run — svelte/compiler in apps/frontend]` ESLint was not run on it — UNCONFIRMED. K's cards list is a `list-none` `<ul>` too and takes the role for the same reason.
- **F6.** The store's effect writes `draft?.answers.set({})` and `this.#staged = {}` on every run while answers are locked. `[VERIFIED: read — contestantUserDataState.svelte.ts "React to `answersLocked` to clear edited data"]` The fix the todo gives: guard both writes, and a store-level case that `current` keeps its identity after `init` under the lock with nothing staged or drafted. This phase's rerun of the entity load calls `init` again under the same effect, which is why the store is on its path.
- **F8.** The sentence to correct is in `(nominated)/preview/+page.server.ts`: "Without an answer nothing is redirected, so the entity layout's own error view is shown and not hidden behind a redirect." When `isPreviewOpen` answers `undefined` because the election or constituency read failed, the entity layout's data is still valid and the preview is served. `[VERIFIED: read — previewGate.ts "@returns … `undefined` when no answer can be given"]` The docs page is `apps/docs/src/routes/(content)/developers-guide/contestant-app/home-and-tasks/+page.md` (the paragraph beginning "The preview's rule is in the page's own load").
- **The spacing edit.** J carries three numeric classes, not two: `<dl class="mt-12 flex flex-col gap-12">` and `<p class="small-info mt-12" data-testid="nomination-pending-note">`. `[VERIFIED: run — grep over the contestant routes]` All three change.

## Project Constraints (from CLAUDE.md)

- **Failing E2E is a cardinal failure**; no "known flaky"; a "did not run" counts as a failure; a void run (wrapper exit 8, `VOID-host-suspend.txt`) is not evidence. The full run is `tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/<name> --no-db-reset`.
- **Comment hygiene** under `apps/`, `packages/`, `tests/`: no historical narrative, no planning references beyond `see phase N`, nothing addressed to a reviewer, concise. Every touched comment is brought in line — the four voter route files this phase refactors carry comments that break the rule today.
- **Context Destructuring Rule:** never destructure a reactive accessor; never bind `dataRoot` to a read alias; read `ctx.dataRoot.<prop>` in the consuming scope.
- **Results-navigation invariants:** no document View Transition with names while a modal is open (this phase adds no `<dialog>` and no `view-transition-name`); the voter `(located)` load must not read the URL tracked — the extraction of D-15 must not move a tracked read into it.
- **Svelte warnings** are fixed at source or annotated `svelte-warning: accepted — …`; `yarn workspace @openvaa/frontend check` runs `svelte-check … --fail-on-warnings`.
- **TypeScript strictly**; every user-facing string in all seven locales; WCAG 2.1 AA with the axe scan; the code review checklist (`.agents/code-review-checklist.md`).
- **After a schema change:** `yarn schema:regenerate` in the same commit (the single generated migration, held by `yarn assert:schema-migration-parity`), then `yarn db:types`, then `yarn db:lint:sql` against the applied database.
- **Nothing is deployed:** PostgreSQL 17, Node 24 floor, no compatibility shim.
- Shell for every node or yarn command: `export PATH="$HOME/.nvm/versions/node/v24.21.0/bin:$PATH"`.

## Standard Stack

This phase installs **no package**. Everything is on the tree.

### Core (resolved on the tree, 2026-10-10)
| Library | Version | Purpose here |
|---------|---------|--------------|
| PostgreSQL (Supabase image) | 17.6 | triggers, policies, the two RPCs `[VERIFIED: run — select version()]` |
| Supabase CLI | 2.118.0 | `db reset`, `test db`, `db lint`, type generation `[VERIFIED: run — node_modules/supabase/package.json]` |
| `@supabase/supabase-js` | 2.117.2 | `rpc()`; `error.code` / `error.message` |
| `@sveltejs/kit` | 2.70.3 | universal loads, `invalidateAll()`, redirects |
| `svelte` | 5.57.1 | runes; `tick()` |
| `zod` | 4.6.5 | parsing the two RPC answers at the adapter boundary (`assert:adapter-casts`) |
| `vitest` | 5.0.2 | unit, component and the writer integration test |
| `@playwright/test` | 1.63.0 | the perm chain and the new spec |
| pgTAP (image) | 1.3.3 | `supabase test db` |
| `plpgsql_check` (image) | 2.8 | `supabase db lint` |

`[VERIFIED: run — node -p over each package.json; pg_available_extensions]`

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| A deferred constraint trigger | the three alternatives OD08-E1 lists as not chosen | Not taken up: the ruling's own option is measured to work |
| `invalidateAll()` | `depends('…')` on the entity load and `invalidate('…')` | Reruns less, but adds an event member the tracking test forbids, and does not re-read the settings a refusal needs |
| Universal loads for the editor's guard and facts | `+layout.server.ts` with a per-request provider, as `previewGate.ts` | The server form re-reads elections and settings on every request and needs a request per step; the universal form reuses the root load's data, as the voter's loads do |

## Package Legitimacy Audit

No external package is installed by this phase. **Packages removed due to [SLOP] verdict:** none. **Packages flagged [SUS]:** none.

## Architecture Patterns

### System Architecture Diagram

```
 user ──► home task / J's Edit / J3's button ──────────────────────────────┐
                                                                            ▼
            ┌──────────────── the editor's entry (…/nominations/elections) ─┐
            │ nominations/+layout.ts   facts for J and the guard:           │
            │   root load data (await parent) ─► temp DataRoot ─►           │
            │   admissible elections (nominationShape × entity type)        │
            │ (edit)/+layout.ts        the guard:                           │
            │   not editable ──► redirect J        no admissible ──► redirect J
            │ step +page.ts            ordering module:                      │
            │   which step?  skip = redirect      ids from url.searchParams │
            └───────┬──────────────────┬──────────────────────┬─────────────┘
                    ▼                  ▼                      ▼
              elections step ─► constituencies step ─► details step (cards)
              (ElectionSelector)  (ConstituencySelector)   │      ▲
                    ids travel in the URL only             │      │ parent options
                                                           │      │ get_…_parent_options (DEFINER, allow-list)
                                                           │      │ ─► provideEntityData ─► EntitySelector
                                          Continue ────────┘
                                             │
                                             ▼
        writer.setEntityNominations ─► rpc set_entity_nominations (INVOKER, one transaction)
             │                               │  deletes ─► updates (changed only) ─► inserts
             │                               │  own row ─► private id lookup ─► parent insert ─► repoint
             │                               │  every UPDATE / DELETE: row count checked
             │                               │  SET CONSTRAINTS … IMMEDIATE  (the deferred shape rule)
             │                               ▼
             │                 policies · column grants · BEFORE triggers · constraint trigger
             ▼
     saved ──────────────► invalidateAll() ─► root, user and entity loads rerun
     refused (named) ──┐        │                  │
     thrown ───────────┤        │                  ├─► page.data.contestantUserData.nominations ─► J, task state
                       ▼        │                  └─► entity layout effect ─► userData.init + provideQuestionData
        message region │        │                                          ─► question lists ─► tasks
                       └────────┴─► guard reruns: a lock found ─► redirect J (the note)
                                    saved: tick ─► taskState ─► goto(next step | home)
```

### Recommended Project Structure

```
apps/supabase/supabase/schema/
  000-enums.sql                 # the fourth member; header and comment
  011-validation-functions.sql  # the matrix as one SQL function; the row rule; the deferred rule's function;
                                # enforce_nomination_entity_columns (symbol); the cap branch (alliances)
  101-elections.sql             # the column default
  104-nominations.sql           # CREATE CONSTRAINT TRIGGER
  301-auth-functions.sql        # the organization role; caller_nominated_in_contest (paired);
                                # the count helper (alliances); the parent-id lookup (before the blanket GRANT)
  302-rls.sql                   # the parent policy widened; entity_delete_nominations
  503-entity-rpcs.sql           # get_entity_nominations (parent.entity_id); the two new RPCs
packages/data/src/objects/election/   # nominationShape; allowedParentTypes and its sibling; tests beside them
apps/frontend/src/
  lib/routes/                   # the shared ordering module beside impliedParams.ts; three route constants
  lib/contestant/tasks/         # the editor's route in TaskRoute; the editable input; the sixth target function
  lib/dynamic-components/entitySelector/
  lib/api/…                     # writer method + abstract counterpart; parse modules for the two answers
  routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/nominations/
    +layout.ts                  # facts shared by J and the guard
    +page.svelte                # J: Edit, six states
    (edit)/+layout.ts           # the guard, with a tracking test beside it
    (edit)/elections|constituencies|details/+page.ts, +page.svelte
packages/dev-seed/src/templates/      # every template re-typed; the new perm template
tests/tests/…                         # the new spec, fixture, setup/teardown pair; perm-startfromcg extended
```

### Pattern 1: The shape reaches the data model through one mapped column

**What:** `_getElectionData` selects `'*, election_constituency_groups(constituency_group_id)'`, so `row.election_type` is already fetched; the mapping gains one member beside `round: row.current_round ?? undefined`. `[VERIFIED: read — supabaseDataProvider.ts]` The getter follows the data skill's smart-default rule (`get prop() { return this.data.prop ?? defaultValue; }`) with the database's new default, so the server-side local adapter's static elections need no change. The existing adapter cases that pin "`subtype` is read from the `subtype` column only" are extended, not loosened (D-03).

### Pattern 2: One SQL statement of the matrix, asked by both triggers and the write function

**What:** an `IMMUTABLE` SQL function in `011-validation-functions.sql` that reads no table — the form `public.grant_role_permissions` has ("Reads no table, so it is IMMUTABLE and not SECURITY DEFINER. search_path is pinned anyway") `[VERIFIED: read — 301-auth-functions.sql]` — answering "may this entity type stand in this shape" and "must it have a parent". The row rule in `validate_nomination`, the deferred function and the write function's reach (U-05) all call it. The matrix is then stated once in SQL and once in TypeScript, and D-24's comparison table and the two grids (pgTAP, data-package unit test) hold them together.
**Why not `private`:** the `private` schema is first created in `107-feedback.sql`, after file 011. `[VERIFIED: run — grep "CREATE SCHEMA"]` A non-definer function that reads nothing is not counted by the definer census.

### Pattern 3: The write function under the caller's own rights

Measured constraints the body obeys (*Pitfalls 1, 2, 4*); the shape is a proposal `[ASSUMED]`:

1. Refuse a malformed argument by index with SQLSTATE `22023`, as `create_invitations` does (`'create_invitations: p_invitations[%] must be a JSON object'`). `[VERIFIED: read — 506-invitation-rpcs.sql]`
2. Read the entity's rows in reach under the caller's rights: current round, and a type the matrix admits (U-05). No `FOR UPDATE`: under the lock the update policy hides the rows from a locking read.
3. Delete first (rows the set leaves out; the old row of a move), then update the kept rows whose values differ (D-10), then insert. A delete with candidates under the row raises `23503` at that statement.
4. For a listed parent: resolve its nomination's id through a `SECURITY DEFINER` lookup in `private`; when there is none, insert the placeholder (the caller's own row at that contest already exists, which guard 5 needs) and resolve again; then repoint.
5. After every `UPDATE` and `DELETE`: `GET DIAGNOSTICS` / `IF NOT FOUND` and raise. `upsert_answers` does it: `RAISE EXCEPTION 'Entity not found or access denied: %'`. `[VERIFIED: read — 503-entity-rpcs.sql]`
6. `SET CONSTRAINTS public.<name> IMMEDIATE; SET CONSTRAINTS public.<name> DEFERRED;`
7. `RETURNS jsonb` — counts of what was written — which keeps the function out of `assert:rpc-nullability`'s `RETURNS TABLE` map and lets pgTAP assert D-10's skip.

### Pattern 4: The editor's loads are the voter's loads

**What:** `(voters)/elections/+page.ts` and `(voters)/constituencies/+page.ts` are universal loads that take `{ appSettingsData, constituencyData, electionData } = await parent()`, merge the settings (`mergeAppSettings(staticSettings, await appSettingsData)`), build `new DataRoot()` from the two data sets, decide, and `redirect(307, buildRoute(…))`. `[VERIFIED: read]` The editor's facts load, its guard and its step loads do the same over the admissible elections. A universal load "will also return data from parent `+layout.server.js` files that are not 'shadowed'", so `await parent()` also carries the entity-level load's `contestantUserData`; and universal loads "run on the server during SSR" and "run again during hydration". `[CITED: svelte.dev/docs/kit/load]`
**Consequences:** J's six states are in the server-rendered markup (the load ran on the server); no extra database read is made; on a navigation inside the app the guard decides on the browser's copy of the settings, which is acceptable because the database is the gate and every refusal ends in `invalidateAll()`.
**Constraints:** the guard reads `params` and `parent` alone and gets a read-recording test (`loadTracking.testUtils`: `recordingUrl`, `recordingParams`, `forbiddenRoute`); the chosen ids are read in each step's own `+page.ts`, which reruns on every step by design; `buildRoute` passes a param that is neither a route param nor a persistent search param through as a search param when the caller names it, as the voter's loads pass `next` (`Params = NamedParams & Record<string, string | Array<string>>`). `[VERIFIED: read — lib/routes/params.ts]`

### Pattern 5: After the write

```ts
// Sketch; the functions named exist, the handler does not. [ASSUMED]
bypass = true;                                  // before anything that can navigate
const result = await writer.setEntityNominations({ target, nominations });
await invalidateAll();                          // root, user, entity, guard and page loads; a redirect is followed
if (result.type === 'refused') { /* still here: no lock was found; show the named message, keep the draft */ return; }
await tick();                                   // the entity layout's and the context's effects
const state = contestantCtx.taskState;          // a reactive accessor, read here and not captured
await goto(getRoute.current(state.known ? nominationsSaveTarget(state).route : { route: 'ContestantAppEntityHome' }));
```

### Anti-Patterns to Avoid

- **Judging `NEW` in the deferred function.** It is the row as first written; re-read by id.
- **`INSERT … RETURNING` on a row the caller cannot read.** 42501 (measured).
- **An UPDATE or DELETE whose row count nobody reads.** Under the lock it is a silent success.
- **`NEW.entity_type` in a BEFORE trigger.** NULL; derive the type from the four foreign keys, as `validate_nomination` does.
- **Listing "every organization of the data root" as the options.** The root keeps what was ever provided.
- **Reading the URL in the guard**, or moving a tracked URL read into the voter's `(located)` load.
- **`depends()` on the entity-level load.** Its tracking test names the four event members it may take.
- **A page-level `{#if type === 'organization'}`.** One page per route, one descriptor per type.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| End-of-transaction row rule | a flag column, a session variable, a "pending" state | `CREATE CONSTRAINT TRIGGER … DEFERRABLE INITIALLY DEFERRED` + `SET CONSTRAINTS` | built into PostgreSQL; measured |
| "Is this party nominated here" inside a policy or the RPC | an inline sub-select on `nominations` | `private.nomination_exists_in_contest`, and one sibling returning the id | the inline form "raises `infinite recursion detected in policy for relation "nominations"`" |
| Who the caller edits | a second read of grants | `private.caller_entity_ids`, `user_can` | the matrix is asked, never re-derived |
| Rerunning the load | a context method that re-fetches and patches two lists | `invalidateAll()` | the layout's effect already feeds both lists |
| Which step comes first | a contestant copy of the voter's tables | the shared module, extended with a filter argument | D-15, D-28 |
| Telling a refusal apart | parsing free text | SQLSTATE + a pinned prefix or constraint name, as `isNameRefusal` | pinned on both sides by tests |
| A radio group's keyboard model | custom key handlers | native `<input type="radio">` sharing a `name` | arrow keys, one tab stop and `required` come with it |
| Parsing an RPC's JSON | `as` casts | a zod schema in `adapters/supabase/utils/`, as `entityNominations.ts` | `assert:adapter-casts` |

**Key insight:** almost every rule this phase needs already has one home in the tree — a policy, a trigger, a helper, a pure function of the task state. The phase's risk is a second statement of one of them, not a missing mechanism.

## Runtime State Inventory

Not a rename or a migration, but the enum, a column default and every template's election type change, so the categories are answered.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | The local database's Default Project: 1 election typed `organization_list`, 377 nominations, every candidate under a party `[VERIFIED: run — read-only psql]` | None beyond the `yarn db:reset` the schema change already needs; nothing is deployed |
| Live service config | None — the lock and `startFromConstituencyGroup` are rows the specs write and restore | None |
| OS-registered state | None | None |
| Secrets / env vars | None | None |
| Build artifacts | `packages/supabase-types/src/database.ts` (the enum, the two new RPCs, the changed read); `apps/supabase/supabase/migrations/00001_initial_schema.sql`; the generated translation-key type; the generated component docs | `yarn db:types`; `yarn schema:regenerate`; `yarn workspace @openvaa/frontend generate:translation-key-type`; `yarn workspace @openvaa/docs generate:docs` |

## Common Pitfalls

### Pitfall 1: The lock refuses an UPDATE and a DELETE silently
**What goes wrong:** a save that changes a symbol, or removes a nomination, in a locked project returns success and writes nothing.
**Why it happens:** `entity_update_nominations` carries the lock in `USING`, and the new delete policy will too; a row `USING` hides is simply not a target. The project's own pgTAP convention names it: "Negative (silent no-op RLS): `lives_ok` … then `is((SELECT actual), expected, 'no effect')`". `[VERIFIED: read — database skill, pgTAP conventions; 302-rls.sql]`
**How to avoid:** count rows after every UPDATE and DELETE in the function and raise; pgTAP: lock on, the function called with a changed symbol only → raises, row unchanged; with a removal only → raises, row still there.
**Warning signs:** the E2E "stale browser" case passes for a new nomination and fails for an edited one.

### Pitfall 2: The caller cannot read the parent it creates
**What goes wrong:** `INSERT … RETURNING id` on the placeholder fails with `new row violates row-level security policy`; a `SELECT` for its id returns nothing.
**Why it happens:** `authenticated_select_nominations` admits `nomination.read` on the row's **own** entity; `23-nominations-write.test.sql` says of the created parent "The entity user cannot yet SEE the row it just created". `[VERIFIED: read; run — rq4-run.sql T4]`
**How to avoid:** a `SECURITY DEFINER` function in `private`, defined in `301-auth-functions.sql` **above** the `GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA private` ("The statement reaches only the functions defined before it"), returning one nomination id for an entity at a contest. It needs a stated tie-break: a party can hold several nominations at one contest under different alliances (the uniqueness key includes the parent).

### Pitfall 3: A generated column is NULL in a BEFORE trigger
**What goes wrong:** `enforce_nomination_entity_columns` asks `user_can('entity', …, 'nomination.edit', NEW.entity_type)` and gets a NULL type, which denies — the symbol stays closed for everyone.
**Why it happens:** measured — `BEFORE INSERT: NEW.kind=<NULL>`, `BEFORE UPDATE: NEW.kind=<NULL>`, `AFTER …: NEW.kind=a`. `[VERIFIED: run — scratchpad gen.sql on 17.6]`
**How to avoid:** derive the type from the four foreign keys with the `CASE` that `validate_nomination` opens with.

### Pitfall 4: A deferred rule does not exist inside pgTAP
**What goes wrong:** the refusal is never asserted, or an assertion of it passes for the wrong reason; a fixture that should be refused is silently accepted.
**Why it happens:** every file under `tests/database/` ends in `ROLLBACK;` (none is missing one) and never commits. `[VERIFIED: run — grep -L "^ROLLBACK;"]`
**How to avoid:** assert through the function (which forces the rule) or with `SET CONSTRAINTS ALL IMMEDIATE` inside the asserted statement; assert once that a lone party-less insert **followed by** the forcing statement raises, and that the three-statement order followed by it does not. Never leave the mode IMMEDIATE.

### Pitfall 5: The matrix probe does not see the organization's new permission
**What goes wrong:** `nomination.create_parent` is added to the organization role and `25-matrix-conformance` stays green without measuring it — or the `PERM:` case of file 23 goes red because its "caller without the permission" was an organization editor.
**How to avoid:** a probe at the caller's own organization; another identity for `PERM:`; the nine sites of `12-user-can.test.sql` re-read.

### Pitfall 6: Pairing by "holds the permission on something nominated here"
**What goes wrong:** with the permission on both roles and guard 1 widened, a candidate creates an alliance's row or an organization another party's (D-07's own warning).
**How to avoid:** `private.caller_nominated_in_contest` is asked for a **type** — a candidate for an organization row, an organization for an alliance row — and guard 3 with the row's own type and id; each pairing has its negative control in file 23. Whether a faction's editor may still create its organization's row is not ruled (*Open Questions* 2).

### Pitfall 7: The cap's two homes
**What goes wrong:** the count helper is widened to alliances and the trigger's branch (`AND NEW.organization_id IS NOT NULL`) is not, so the policy refuses with 42501 where the named message was promised — or the reverse.
**How to avoid:** the helper, the trigger branch and its message change together; `23`'s `CAP:` section covers an alliance row at the boundary.

### Pitfall 8: `PreventNavigation` meets the automatic redirect
**What goes wrong:** after a refused save under a new lock, `invalidateAll()` follows the guard's redirect to J and the browser's confirm opens over it.
**How to avoid:** the bypass is set before `invalidateAll()` on the success path and on the lock path; an E2E step asserts no dialog was raised.

### Pitfall 9: An option that is no longer listed is still in the data root
**What goes wrong:** a party unconfirmed since the last visit is offered, because the selector listed the root's organizations.
**How to avoid:** options are the ids of the RPC's answer (T-6).

### Pitfall 10: `perm-no-nomination`'s state step writes what the rule refuses
**How to avoid:** re-type the template in the same commit as the rule; the six `expectButton('return')` call sites the UI spec names are re-read against the new type.

### Pitfall 11: A move leaves a placeholder behind
**What goes wrong:** a candidate changes constituency twice with a party that is nominated in neither; two unconfirmed party rows stay, counted against the cap and listed on the party's own J.
**Why it happens:** a changed constituency is a delete and an insert (OD08-E8); the old parent row is not the caller's and D-11 forbids its deletion by the caller.
**How to avoid:** not avoidable within the locked decisions; it is stated in the cap todo and bears on RQ-8.

### Pitfall 12: Two users create the same placeholder at once
**What goes wrong:** both pass guard 3; the second insert fails `23505` on `nominations_entity_parent_contest_key` and the whole save is refused as `failed`.
**How to avoid:** accept it (a retry links the now-existing row) or catch `unique_violation` in the function and resolve again; either is a named decision.

## Code Examples

### The deferred rule on the project's table — a sketch

The semantics were measured on a reduced table; the names of the table, its triggers and its columns are the tree's (`104-nominations.sql`), and the enum's existing members are `'organization_only'`, `'candidate_only'`, `'organization_list'` (`000-enums.sql`). The new member's name is the context's. The function and trigger names are suggestions `[ASSUMED]`.

```sql
-- 011-validation-functions.sql
CREATE OR REPLACE FUNCTION public.validate_nomination_parent_required () RETURNS TRIGGER SECURITY DEFINER
SET
  search_path = '' AS $$
DECLARE
  v_row public.nominations%ROWTYPE;
  v_shape public.nomination_shape;
BEGIN
  -- The row as it stands now: the queued event carries it as first written.
  SELECT n.* INTO v_row FROM public.nominations n WHERE n.id = NEW.id;
  IF NOT FOUND OR v_row.candidate_id IS NULL OR v_row.parent_nomination_id IS NOT NULL THEN
    RETURN NULL;
  END IF;
  IF v_row.custom_data IS NOT NULL AND v_row.custom_data ? 'requestedParentOrganization' THEN
    RETURN NULL;
  END IF;
  SELECT e.election_type INTO v_shape FROM public.elections e WHERE e.id = v_row.election_id;
  IF v_shape = 'organization_list' THEN
    RAISE EXCEPTION '<a stable, pinned start>: nomination % …', v_row.id
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 104-nominations.sql
CREATE CONSTRAINT TRIGGER nominations_parent_required
AFTER INSERT OR UPDATE ON public.nominations
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
WHEN (NEW.candidate_id IS NOT NULL AND NEW.parent_nomination_id IS NULL)
EXECUTE FUNCTION public.validate_nomination_parent_required ();
```

The shape test belongs to the matrix function of *Pattern 2* rather than to the literal above.

### Forcing it, in the write function and in pgTAP

```sql
-- at the end of set_entity_nominations (measured inside a SECURITY INVOKER function with search_path = '')
SET CONSTRAINTS public.nominations_parent_required IMMEDIATE;
SET CONSTRAINTS public.nominations_parent_required DEFERRED;
```

```sql
-- pgTAP: the forcing statement inside the asserted string; the rolled-back subtransaction restores the mode
SELECT
  throws_ok (
    $$INSERT INTO public.nominations (…) VALUES (…); SET CONSTRAINTS ALL IMMEDIATE$$,
    '23514',
    NULL,
    'a lone party-less candidate row in an organization_list election is refused at the end of the transaction'
  );
```

That `throws_ok` accepts two statements in one string was measured with its mechanism (`EXECUTE` inside an exception block), not with pgTAP itself — UNCONFIRMED.

### The symbol guard's INSERT branch — the shape of the change

```sql
-- Derived, because the generated entity_type is NULL here.
v_type := CASE
  WHEN NEW.candidate_id IS NOT NULL THEN 'candidate'::public.entity_type
  WHEN NEW.organization_id IS NOT NULL THEN 'organization'::public.entity_type
  WHEN NEW.faction_id IS NOT NULL THEN 'faction'::public.entity_type
  WHEN NEW.alliance_id IS NOT NULL THEN 'alliance'::public.entity_type
END;
v_own := public.user_can('entity', COALESCE(NEW.candidate_id, NEW.organization_id, NEW.faction_id, NEW.alliance_id), 'nomination.edit', v_type);
-- eight columns stay bound for everyone the function binds; the ninth only where the row is not the caller's own
```

A placeholder parent is not the caller's own (`user_can` is false for it), so D-02's "goes on applying" holds without a second rule.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `goto(url, { invalidateAll: true })` | `invalidateAll()` (or `refreshAll()`) before `goto` | the documentation now marks the `goto` option deprecated: "Use `refreshAll` instead" `[CITED: svelte.dev/docs/kit/$app-navigation]` | The context already calls `goto(…, { invalidateAll: true })` in five places; new code calls the function, which kit 2.70.3 exports undeprecated `[VERIFIED: read — types/index.d.ts "export function invalidateAll(): Promise<void>;"]` |
| Deferred triggers run as the role active at COMMIT | Under PostgreSQL 18 they run as the role active when the event was queued `[ASSUMED]` | PG 18 | None here: the deferred function is `SECURITY DEFINER` and its rule reads no role |

**Deprecated/outdated in the planning record:** "seven names" in the definer census (nine); "`role="list"` trips `a11y_no_redundant_roles`" (it does not on 5.57.1); `DataRoot`'s "Existing data will be reset" docstrings (nothing is reset).

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | PostgREST reports a failure raised at the request's COMMIT as an ordinary error body | RQ-4, fact 5 | A direct table write of a lone party-less row would be refused with an opaque 500; the app's path is unaffected because the function forces the rule |
| A2 | `plpgsql_check` raises no warning on `SET CONSTRAINTS` inside the write function | RQ-4 | `yarn db:lint:sql --fail-on warning` goes red; the forcing moves to a small helper or the function is restructured. Measured first in the schema plan |
| A3 | One `await tick()` after `invalidateAll()` is enough for `taskState` to be current | RQ-6, Pattern 5 | Continue leads home instead of to the next task; the fallback is correct but one page short. A component test pins it |
| A4 | `invalidateAll()` leaves K mounted with no `<Loading />` frame | RQ-6 | A flash before the navigation; cosmetic on the success path, visible on a refusal that keeps the draft |
| A5 | pgTAP's `throws_ok` accepts a two-statement string | Code Examples | The assertion is written as a `DO` block or through a helper function instead |
| A6 | The shape of `p_nominations` and of the function's answer proposed in Pattern 3 | Pattern 3 | None: Claude's discretion; it becomes 177.1's contract once chosen |
| A7 | An entity editor of a closed project reads its structure (read from the policies, not run) | RQ-7 | The editor's steps render no election in a closed project; one pgTAP case settles it |
| A8 | ESLint raises nothing on `role="list"` on a `<ul>` / `<ol>` | F4 | A lint row goes red; the rule is accepted with a comment in the project's form |
| A9 | Under PostgreSQL 18 a deferred trigger runs as the queueing role | State of the Art | None for this phase |
| A10 | Re-typing `ElectionsGenerator`'s synthetic elections to the new default breaks no dev-seed test | RQ-1 | A unit test of the generator pins the old value; found at the first `yarn test:unit` |
| A11 | The walk across contests that RQ-8 describes is possible as written | RQ-8 | The finding overstates what the cap prevents; the cost side of the finding stands regardless |

## Open Questions

1. **The cap of 10 (RQ-8) — the operator's.** Options (a) to (d) above; (b) recommended. Built as (a) until ruled.
2. **A faction's editor and the paired guard.** OD08-E4 (a) names two pairings and "never the other two combinations". Today a faction editor holds `nomination.create_parent` and the policy lets it create its organization's row. Whether that third pairing stays is not ruled. *Recommendation:* keep it (a faction's parent is an organization nomination), stated in the policy's comment and held by its own pgTAP pair; faction users are out of scope either way.
3. **Which of a party's nominations is linked** when it holds several at one contest (under different alliances). *Recommendation:* the one with no parent first, then the oldest; stated in the lookup's comment and pinned.
4. **A symbol longer than 50 characters at the function.** "Applied … again by the write RPC" does not say refuse or cut. *Recommendation:* refuse with `22023` naming the index, as the "Other" name is refused (U-16); the input's `maxlength` means a user never meets it.
5. **The order of the plans.** D-26 puts the E2E dataset last. Phases 175 and 176 built the dataset and the fixtures before the screens, under the operator's standing instruction and with the operator's acceptance afterwards (decisions E6 and C4 of 2026-10-09). The same order here is a departure from D-26's letter that the planner states and puts to the operator, or adopts under the standing instruction.
6. **What the parent-options RPC is asked.** "For each pair whether a nomination exists" can be answered for every contest of the project (large for a party nominated in hundreds of constituencies) or for the pairs the caller names. *Recommendation:* the pairs are an argument.
7. **The two simultaneous placeholder inserts** (Pitfall 12): accept the retry, or catch in the function.
8. **The editor's loads: universal or server.** *Recommendation:* universal (*Pattern 4*); it is a departure from the letter of S3's "as `(nominated)/+layout.server.ts`" and not from what S3 requires.
9. **Still open because they need a browser:** N-5, N-6; A3, A4; the phone-width checks; the keyboard and screen-reader read.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node | everything | ✓ | 24.21.0 (floor 24.15.0) | — |
| Yarn | everything | ✓ | 4.18.1 | — |
| Docker | the local stack | ✓ | 29.7.2 | — |
| Local Supabase stack | pgTAP, lint, types, E2E, integration test | ✓ (up; shared with another session on 2026-10-10) | PostgreSQL 17.6 | — |
| Supabase CLI | reset, test, lint, types | ✓ | 2.118.0 | — |
| `psql` | `lint-schema.mjs`, measurements | ✓ | 17.6 | — |
| `plpgsql_check`, pgTAP | lint, tests | ✓ in the image | 2.8, 1.3.3 | — |
| Playwright browsers | E2E | not probed | — | `yarn playwright install` |
| A second PostgreSQL 17 | scratch measurements only | ✓ Homebrew 17.6 | — | not needed by the plans |

**Missing dependencies with no fallback:** none found.
**To note:** the host runs more than one session; the gate driver records the power state and reads a void run from the wrapper's marker (D-27). Disk: 189 Gi free on the Mac volume; the Docker VM's disk was not measured.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Frameworks | vitest 5.0.2 (packages and frontend, unit and component); pgTAP 1.3.3 through `supabase test db`; Playwright 1.63.0 through the wrapper |
| Config | each workspace's `vitest.config.*`; `tests/playwright.config.ts` (the perm chain's project pairs); `apps/supabase/supabase/tests/database/` |
| Quick run | `yarn workspace @openvaa/data test:unit` · `yarn workspace @openvaa/frontend vitest run <file>` · `yarn workspace @openvaa/dev-seed test:unit` |
| Full suite | `yarn test:unit` · `yarn db:reset && yarn workspace @openvaa/supabase test:db` · `tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/<name> --no-db-reset` |
| Phase gate | the rows of `176-gates.sh`, carried into this phase's own driver: typecheck, lint, db-reset, types-regen, pgtap, sql-lint, integration, unit, check-frontend, build, format, docs-links; then one full E2E run; then the new spec three times in isolation — every status read directly, never through a pipe |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| NOM-03 | the matrix: nominable, parent types, required — every cell | unit | `yarn workspace @openvaa/data test:unit` | ❌ Wave 0 (beside `election.test.ts`) |
| NOM-03 | the adapter maps the shape; `subtype` still from its own column | unit | `yarn workspace @openvaa/frontend vitest run supabaseDataProvider` | ✅ extended |
| NOM-03 | which step is shown, with and without `startFromConstituencyGroup`; the skip; `disallowSelection` not read | unit | `yarn workspace @openvaa/frontend vitest run <ordering module>` | ❌ Wave 0 |
| NOM-03 | the voter's two loads behave as before | unit + E2E | the existing voter specs, `perm-startfromcg` included, unchanged | ✅ |
| NOM-03 | the guard reads `params` and `parent` alone | unit | a `layout.tracking.test.ts` beside it | ❌ Wave 0 |
| NOM-03 | the three rows of D-16's table; the contestant side of `startFromConstituencyGroup` | E2E | `contestant-nominations.spec.ts`; `perm-startfromcg.spec.ts` (`@nomination-definition`) | ❌ / ✅ extended |
| NOM-04 | the shape grid: every cell × entity user, admin, service role, each refusal by code and message | pgTAP | `08-triggers.test.sql` | ✅ extended |
| NOM-04 | the deferred rule: lone row refused, three statements pass, the key satisfies, forced and restored | pgTAP | `08-triggers.test.sql` | ✅ extended |
| NOM-04 | the symbol: own row yes, placeholder no, locked no, the edit unconfirms | pgTAP | `23-nominations-write.test.sql` | ✅ extended |
| NOM-04 | the widened parent policy: each guard and each pairing with its negative control; the cap over alliance rows | pgTAP | `23-nominations-write.test.sql`, `25-matrix-conformance.test.sql`, `12-user-can.test.sql` | ✅ extended |
| NOM-04 | the selector: a named radio group, one tab stop, arrows, required, "Other" does not move focus | component | `EntitySelector` test | ❌ Wave 0 |
| NOM-04 | the parent options: allow-list keys, who is listed, NULL for every other caller; the census at ten | pgTAP | a new file; `07-rpc-security.test.sql` | ❌ Wave 0 / ✅ |
| NOM-05 | "Other": the key written, no parent, other keys kept, the key removed on a listed choice | pgTAP + integration | the write function's file; `supabaseDataWriter.integration.test.ts` | ❌ Wave 0 / ✅ extended |
| NOM-06 | one transaction: a refusal stores nothing; unchanged rows keep `confirmed` and `updated_at`; a zero-row statement raises | pgTAP | the write function's file | ❌ Wave 0 |
| NOM-06 | the delete policy: own row, unlocked, not a placeholder; the foreign-key refusal by name | pgTAP | `23-nominations-write.test.sql` | ✅ extended |
| NOM-06 | the named refusals as the client sees them (`code`, message start) | integration | `yarn workspace @openvaa/frontend vitest run supabaseDataWriter.integration` (the gate's row) | ✅ extended |
| NOM-06 | the task's target; J's six states; Edit; the note under either lock | unit + component + E2E | `taskState.test.ts`, J's `page.svelte.test.ts`, the new spec | ✅ extended / ❌ |
| NOM-08 | an answer outside the applicable set changes nothing (D-14) | unit | `taskState.test.ts` | ✅ extended |
| NOM-08 | after a save, with no full load: home, J, the counts and every Continue follow | component + E2E | the details page's component test; the new spec | ❌ Wave 0 |
| F6 | `current` keeps its identity under the lock with nothing to clear | unit | `contestantUserDataState.svelte.test.ts` | ✅ extended |
| RQ-1 | every built-in template seeds on the new rule | pipeline + E2E | the census as a dev-seed test; every setup project of the full run | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** the quick run of the workspace touched; for a schema task `yarn db:reset`, the changed pgTAP file, `yarn db:lint:sql`.
- **Per wave merge:** `yarn test:unit`, the whole pgTAP suite on a reset database, `yarn workspace @openvaa/frontend check`.
- **Per surface plan:** one full wrapper E2E run, as Phases 175 and 176 closed each.
- **Phase gate:** the gate rows, one full run, and the new spec three times in isolation, before `/gsd-verify-work`.

### Wave 0 Gaps
- [ ] **Measure first:** `yarn db:lint:sql` on a schema that holds the constraint trigger and a function with `SET CONSTRAINTS` (A2) — before the write function is written in full.
- [ ] The census of RQ-1 as a committed dev-seed test (every built-in template through `runPipeline`, zero refused rows), so a later template cannot seed a refused row unnoticed.
- [ ] `packages/data` — the matrix's unit grid.
- [ ] pgTAP — one file for `set_entity_nominations`, one for the parent options (next free ordinals 43, 44; the planner re-reads the tree).
- [ ] The shared ordering module's unit test; the guard's tracking test.
- [ ] `EntitySelector`'s component test; the details page's component test over the real layout, provider and store (A3).
- [ ] The new perm template, its setup / teardown project pair, its fixture module and `contestantNominationEditor.fixture.ts`; the spec's entry in `scripts/assert-a11y-scan-wiring.mjs`.
- [ ] `PROJECT_SCOPED_RPCS` entries for the two RPCs.
- [ ] The phase's own gate driver and verdict script (the 176 pair is the pattern).

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no (unchanged) | — |
| V3 Session Management | no | the write changes no grant, so no token refresh |
| V4 Access Control | **yes** | RLS policies asking `user_can`; column grants; triggers; `SECURITY DEFINER` functions with `search_path = ''`, EXECUTE revoked from `PUBLIC` and `anon`; the definer census |
| V5 Input Validation | **yes** | the function validates its JSON by index (`22023`); zod at the adapter; ids from the URL matched against held data; a typed name rendered as text |
| V6 Cryptography | no | — |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| The parent policy admits rows that are not the caller's; a dropped or unpaired guard | Elevation of privilege, Tampering | one negative control per guard and per pairing in file 23; the cap |
| A locked project written through a silent zero-row statement taken for success | Tampering, Repudiation | row counts in the function; pgTAP under the lock |
| The definer RPC returns more than basic data, or another project's entities | Information disclosure | an allow-list built key by key; the gate through `private.caller_entity_ids`; NULL, never a raise; the census |
| The id lookup in `private` tells whether an entity is nominated at a contest | Information disclosure | not exposed by PostgREST; guard 3 already answers the same question by refusing |
| A nomination moved into another project's contest | Tampering | `validate_nomination`'s tenancy check and the policies' project agreement, both unchanged |
| Flooding the confirmation queue and other parties' views with placeholders | Denial of service | the cap (RQ-8) |
| A confirmed symbol changed without review | Tampering | rule 2 of `enforce_nomination_confirmation` unconfirms every edit by an entity user |
| A typed party name carrying markup | XSS | rendered as text; trimmed and capped at 100 in the function |
| A crafted URL naming another election or constituency | Tampering | the ids are matched against held data and decide nothing the database does not re-check |
| `created_by` readable by anonymous readers, and now written far more often | Information disclosure | open as todo `2026-10-01-nominations-created-by-readable-by-anon.md`; this phase widens its reach and says so |

## Sources

### Primary (HIGH confidence) — the tree, and what was run
- `apps/supabase/supabase/schema/` — `000-enums.sql`, `011-validation-functions.sql`, `104-nominations.sql`, `301-auth-functions.sql`, `302-rls.sql` (the `nominations` block), `303-column-grants.sql`, `503-entity-rpcs.sql`, `506-invitation-rpcs.sql`
- `apps/supabase/supabase/tests/database/` — files 07, 08, 12, 15, 23, 25, 42 (anchors as quoted)
- `apps/supabase/scripts/lint-schema.mjs`; `scripts/assert-project-scoped-queries.mjs`, `assert-rpc-return-nullability.mjs`
- `apps/frontend/src` — the entity-level load, layout and tracking test; `(nominated)` gate; `previewGate.ts`; the contestant context and store; `taskState.ts`; the data writer and provider; the voter's four selection files; `lib/routes/params.ts`, `impliedParams.ts`; `ElectionSelector.svelte`; `EntityCard.svelte`; the root layout and load
- `packages/data/src/root/dataRoot.ts`; `packages/dev-seed/src/pipeline.ts`, `templates/index.ts`, `generators/NominationsGenerator.ts`
- `node_modules/@sveltejs/kit` 2.70.3 `src/runtime/client/client.js`; the Supabase CLI 2.118.0 binary's lint query; `node_modules/daisyui/components/label.css`
- Scratch PostgreSQL 17.6: `rq4-setup.sql`, `rq4-run.sql`, `rq4-run2.sql`, `gen.sql`. Scripts: `census.mts`, `t6.mts`. Read-only catalogue queries on `127.0.0.1:54322`. All in the session scratchpad, not in the repository.

### Secondary (MEDIUM confidence) — official documentation, fetched 2026-10-10
- https://docs.postgrest.org/en/stable/references/errors.html — the error body and the SQLSTATE-to-status table
- https://www.postgresql.org/docs/17/sql-createtrigger.html — constraint triggers, the `WHEN` clause
- https://svelte.dev/docs/kit/load — `parent()` in universal and server loads; universal loads in SSR and hydration
- https://svelte.dev/docs/kit/$app-navigation — `invalidateAll`

The research seam named Context7 for three of the four questions; no Context7 tool was available in this session, so the official pages were fetched directly. The seam rates a fetched page LOW by itself; each claim taken from one is either confirmed by a run or a read above, or listed under *Assumptions Log*.

### Tertiary (LOW confidence)
- None used.

## Metadata

**Confidence breakdown:**
- The database rules and the write path: HIGH for the mechanisms (measured on 17.6 and read in the schema); MEDIUM for their behaviour through PostgREST against the project's schema, which nothing ran
- The census: HIGH (every template through the real pipeline)
- The frontend flow: MEDIUM — the mechanisms are read from the tree and from the installed kit; no server render and no browser was run
- Pitfalls: HIGH where measured (1 to 4, 9), MEDIUM where derived

**Research date:** 2026-10-10
**Valid until:** the tree moves under it — the branch was being committed to during the session. Re-read every anchor at plan time; the measurements on PostgreSQL 17.6 hold for as long as the image does.
