# Phase 177: Define Nominations - Context

**Gathered:** 2026-10-07
**Status:** Ready for research; **planning of the screens waits on one more operator round.** The
fourteen judgement calls (J1–J14) and three of the seven open questions (Q2, Q5, Q7) were ruled by the
operator on 2026-10-08. **Four questions stay open — Q1, Q3, Q4 and Q6**: by the operator's ruling
(OD08-E12 (a)) this phase's UI spec proposes a rule for each and they come back to the operator
there. Until that round is answered the screens (plans 3 and 4) are not planned; the schema, the data
model and the write path can be researched and planned without it. Of the fourteen rulings, ten are
the reading this file had given; **four change what is built and are rewritten in place below**: J6
(OD08-E3, a NOTE: every template is re-typed to the new default where that causes no issue), J7
(OD08-E4 (a) with a NOTE: research evaluates whether the cap of 10 is needed), **J9 (OD08-E6 (b),
overruling the ★: a single admissible election is never shown as a choice)** and J14 (OD08-E11 (a)
with a NOTE: the task routes to the editor only when nominations are editable and the entity has
none). Also ruled: the closing gate runs the new spec three times in isolation (OD08-E16 (a)).
Phase 174 is complete; 174.1 is executed and verified and closes after one browser check; **175 and
176 have a CONTEXT each, their judgement calls ruled the same day, and neither is executed** —
everything said about them here is *as planned*, and the planner re-reads the tree and both CONTEXT
files before fixing any anchor. Code facts in this file were read at HEAD `f79393703`; which were
verified in the tree and which are taken from planning documents is stated per fact under
`<factual_baseline>`.

**Source of decisions, in order of authority**

0. `.planning/v2.16-OPERATOR-DECISIONS-2026-10-08.md` (committed as `3409f3e3d`; applied to this file
   on 2026-10-08). Its sections B and E rule on this phase, and F3 on the shape of the write's
   argument. The fill rule: no box ticked means the ★; a NOTE or EDIT beats every box. **B1–B4: the
   ★, (a). E1, E2, E5, E7–E10, E12–E16: the ★, (a). E3: no box, with a NOTE. E4: (a) with a NOTE.
   E6: (b), overruling the ★. E11: (a) with a NOTE. F3: the ★, (a).** Cited below as **OD08-E6**,
   **OD08-B1** and so on — the prefix keeps them apart from the 2026-10-07 decisions, which use the
   same ids.
1. `.planning/v2.16-OPERATOR-DECISIONS-2026-10-07.md` — returned with **no box ticked and no note**,
   so every ★ stands. What bears on this phase: **B1 (a)** — changing a name is gated on
   `!entity.confirmed` for every entity type, and **the nominations lock affects nominations only**;
   **D1 (a), D2 (a)** — a small Phase 174.1 runs between 174 and 175. Cited as **OD-B1, OD-D1, OD-D2**.
2. `.planning/v2.16-DISCUSSION-POINTS.md` § *Phase 177 — Define Nominations* (plus § *Cross-phase
   picture*, X1–X3, § *Additional notes* 2 and 3, and the notes of 175, 176, 178 and 179 that name
   177). Its rule: an unticked decision accepts the `★ RECOMMENDED` option; a ticked box overrules
   the ★; `**EDIT:**` / `**NOTE:**` free text beats every box.
3. `.planning/ROADMAP.md` § *Phase 177* and the v2.16 hand-over bullets; `.planning/REQUIREMENTS.md`
   (NOM-03, NOM-04, NOM-05, NOM-06, NOM-08, and the "Nominations locked" definition), both amended
   2026-10-05 to the filled document (X3 (a)).
4. `.planning/phases/175-organization-editing-profile-questions-preview/175-CONTEXT.md` and
   `.planning/phases/176-contestant-home-task-state-nominations-view/176-CONTEXT.md` — contexts, not
   executed phases. 175's J4, J5 and R6 bear on this phase and are ruled (J1–J3 below).

In Phase 177's own 27 decisions the operator **ticked eight boxes and wrote six NOTEs**:

1. **177-A3 → (b), ticked, overruling the ★**, plus `NOTE: add a organization_list_and_independents
   election type, making it the default. It allows parentless candidate nominations`. The shape rules
   are enforced in `validate_nomination`, and the enum gains a fourth member (D-04, J4–J6).
2. **177-A4 → (b), ticked, overruling the ★**, with the NOTE written on the option's own line:
   `NOTE: Only for the new type. "Other" satisfies required parent. For alliances, keep "None" the
   default option (i.e. selected by default).` (D-05, J12).
3. **177-A6 → (b), ticked, overruling the ★** — every alliance in the project is listed, and an
   organization can create the alliance's nomination (D-07, J7).
4. **177-B5 → (b), ticked, overruling the ★** — "a new app setting `access.nominationsLocked`"
   (D-12, J1–J3).
5. **177-C2 → (b), ticked, overruling the ★** — the selection step is skipped when there is one
   election with one constituency (D-16, J9).
6. **177-C3 → (a), ticked — the ★ itself**, plus `NOTE: Add to the todo that this could be enabled for
   candidates as well via a setting.` (D-17).
7. **177-C4 → (a), ticked — the ★ itself**, plus `NOTE: Perhaps /nominations/(edit)/elections etc. bc
   there will prob be no edit/ route?` (D-18, J10).
8. **177-D1 → (a), ticked — the ★ itself**, plus `NOTE: hike cap to 50 chars and add a todo for adding
   an election specific setting for symbol type.` (D-20, J8).
9. **177-C5 → no box (★ stands), NOTE on the ★ line:** `Add a todo for checking the whole app for
   election-round conformity. It hasn't been tested.` (D-19).

Choices and outcomes **outside** this section that change what this phase builds:

10. **Additional note 2** — "When showing the election and constituency selectors for the entity, the
    logic will have to differ in the end from that for voters in that it must first filter the
    elections based on the entity type wrt. election_type, this shouldn't prevent us from using
    startFromConstituencyGroup tho. Make sure that however the logic is computed, we centralise the
    predicates as much as possible" (D-28).
11. **Additional note 3** — "In the party and alliance selectors, use a reusable component which
    renders the items using EntityCards (perhaps in a 'compact' variant if needed)" (D-29, J13).
12. **175-B2 NOTE, settled by OD-B1 (a)** — "only show confirmed ones for parent nomination selection
    for candidates … lock_nominations will only affect nominations" (D-06, D-30).
13. **175-B5 → (b) + NOTE** — "Let's move it to app_settings away from project and promote to full
    column if needed for rpcs or indices." Read together with 177-B5 (b) it is one lock in one place
    (D-12, J3).
14. **Phase 173's outcome (executed)** — the selected entity is a route parameter, the writer
    dispatches on the entity's type, `EntityCard` with `headerOnly` and `showType` and `EntityList` are
    the reusable card list, and `forceRegisterUser` creates a test identity with entity grants.
15. **Phase 174's plan 03 (running)** — public sign-up is closed; a test identity is created through
    the admin client, never by sign-up.
16. **179-C1 ★ (planned)** — a self-registered organization is created unconfirmed, so it is absent
    from K's parent list until an admin confirms it (D-06).
17. **X1 → ★ (a), X3 → ★ (a), untouched** — the E2E base dataset serves both entity types since Phase
    173, and `REQUIREMENTS.md` and `ROADMAP.md` already carry the amended wording this file cites.

Every other decision takes its ★ option as written, except where the ★ assumed something a later
ruling or an executed phase has changed. Those places are rewritten **and flagged inline as
"reconciled with <id / phase>"**. The full list is under *Reconciliations* at the end of
`<decisions>`.

<domain>
## Phase Boundary

The user defines the selected entity's nominations themselves: which elections and constituencies it
stands in, under which symbol, and for which party or alliance. Requirements **NOM-03, NOM-04,
NOM-05, NOM-06, NOM-08**, plus **E2E-02** in part and **E2E-03** as closing criterion. Depends on
Phase 176 (home, the task state, the nominations view J); reads Phase 173 (the selected entity, the
generic writer) and Phase 175 (the nominations lock as an app setting, and its accessor). **The
roadmap gives this phase a UI hint** — it adds screens.

It delivers:

- **the nomination editor K**, in two steps: choosing the election and constituency pairs with the
  voter's selectors and the voter's ordering, filtered first to the elections whose type admits the
  entity's type; then one card per pair with an election-symbol input and, where the election's type
  allows a parent for this entity type, a party or alliance selector;
- **the election's nomination shape in the data model** — `Election.nominationShape` and one pure
  function for the allowed parent types — and **the same rules enforced in the database**, in
  `validate_nomination`, for every writer;
- **a fourth election type**, `organization_list_and_independents`, made the default, in which a
  candidate may be nominated without a parent;
- **the write path**: one `SECURITY INVOKER` RPC that applies the whole desired set in one transaction
  under the caller's own row-level security; `election_symbol` opened to the entity user; a DELETE
  policy for the entity's own nominations; the parent-creation policy and the organization role
  widened so an organization can create an alliance's nomination;
- **the parent-option read**: one `SECURITY DEFINER` RPC returning an allow-listed projection of the
  project's confirmed organizations and its alliances;
- **Edit on the nominations view J**; the "Define nomination" task leading straight to K only when
  nominations can be edited **and** the entity has none, and to J otherwise; and K's Continue routed
  through the task state;
- **the questions following the nominations** (NOM-08): after the write the question set, the task
  state and every Continue target reflect the new nominations at once;
- **the E2E coverage**: a nomination-definition spec on its own dataset, and
  `perm-startfromcg.spec.ts` extended to the contestant side.

**Not in this phase:** the home screen, the task state and the nominations view themselves (Phase
176); the move of the nominations lock into the app settings and its accessor (Phase 175 —
OD08-B1 (a)); anything about an entity's name, which is gated on `confirmed` and not on
the lock (OD-B1; Phase 175); registration (Phases 178 and 179) and the deletion of the legacy
`preregister` selection pages and the context's `preregistration*` members (Phase 179); several
constituencies per election for one entity (a todo, D-17); faction and alliance users; any Admin-app
screen, including the confirmation queue.

### Roadmap success criteria (ROADMAP.md § Phase 177, as amended 2026-10-05; criterion 1 amended 2026-10-08)

1. From "Define nomination" the user picks election and constituency pairs with the same selectors,
   and in the same order, that a voter meets — the `startFromConstituencyGroup` setting honoured —
   except that only elections whose election type admits the entity's type are offered. A single
   admissible election is never shown as a choice: the election step is shown only when more than one
   election is admissible; with one, only the constituency step is shown, and the selection is
   skipped entirely when that one election has one constituency (NOM-03).
2. Each chosen pair is then shown as a card with an election-symbol input and, where the election
   type allows a parent for this entity's type, a selector of the project's parties or alliances. A
   candidate in an `organization_list` election cannot continue without a parent, which a listed
   party or "Other" satisfies; in an `organization_list_and_independents` election — a new election
   type, and the default — a candidate may instead choose "Independent / no party". An organization
   may choose any alliance in the project, with "None" selected by default. An entity for which no
   parent is allowed is not asked for one. The database refuses a nomination the election's shape
   forbids, whoever writes it (NOM-04).
3. Choosing "Other" as the parent asks for free text and stores it in
   `customData.requestedParentOrganization` without linking a parent nomination; choosing a listed
   party or alliance links it (NOM-05).
4. Continuing creates the new nominations and updates the changed ones at once, so the home task
   turns complete and the nominations view shows them, and Continue leads on to the next incomplete
   task. An edited nomination is no longer confirmed, and when nominations are locked
   (`access.nominationsLocked`) the change is refused and the view offers no Edit (NOM-06).
5. After a nomination changes, the questions the entity is asked follow the new nominations:
   questions that now apply appear on the home screen as tasks to answer, questions that no longer
   apply are no longer asked, and the task state and every Continue target reflect the new set at once
   (NOM-08).
6. An E2E spec covers nomination definition, the existing `startFromConstituencyGroup` regression spec
   (`perm-startfromcg.spec.ts`) is extended to the contestant side rather than paralleled, and the
   full E2E suite is green at close (E2E-02 in part, E2E-03).

**"Nominations locked"** (`REQUIREMENTS.md`, definition above NOM-01) means the app setting
`access.nominationsLocked`, which sits beside `access.answersLocked`; "the database goes on enforcing
it".

### Standing rules (ROADMAP.md § v2.16, inherited by every phase)

- **Cardinal rule:** no failing E2E test, no exemptions, no "known flaky"; a "did not run" counts as a
  failure. E2E-03 is a closing criterion of this phase.
- **Localisation:** every user-facing string ships in all seven locales (`da, en, et, fi, fr, lb, sv`).
- **Accessibility:** every new or changed screen meets WCAG 2.1 AA and is reached by the axe scan, in
  the light and the dark theme.
- **Both entity types:** a criterion that says "user" or "entity" holds for candidates and for
  organizations unless it names one.
- **Nothing is deployed:** the schema, the enum, the settings shape, the routes and the symbols change
  in place; no compatibility shim, no migration of stored data.
- **Schema edits are serial.** This phase edits `schema/*.sql` and regenerates the single migration
  file **after Phase 175** — and after Phase 176, whose nominations RPC is a schema edit too (see
  *Contradictions*, item 7).
- **Comment hygiene** (`CLAUDE.md`): no historical narrative, no planning references, in any comment
  under `apps/`, `packages/` or `tests/`. Several voter route files this phase refactors carry
  comments that break the rule today; a comment this phase touches is brought in line.
- **Context reactivity** (`CLAUDE.md` § *Context Destructuring Rule*): `appSettings`, `dataRoot`,
  `locale`, `selectedEntity`, `selectedElections`, `selectedConstituencies`, `answersLocked`,
  `nominationsLocked`, `tasks`, `nextStep` and the question accessors are reactive accessors — read
  `ctx.X`, never destructure; never bind `dataRoot` to a read alias.
- **Results-navigation invariants** (`CLAUDE.md`): the voter `(located)` load must not read the URL
  tracked. Plan 3 edits voter route files beside it; the extraction must not move a tracked URL read
  into that load.

</domain>

<decisions>
## Implementation Decisions

Decision ids map onto the discussion document's Phase 177 ids, given in parentheses. 27 discussion
decisions → **D-01..D-27**, one to one; the two additional notes and the operator decision that bear
on this phase → **D-28..D-30**. **30 decisions.** Where a decision is security-relevant, **If wrong**
states what a defect or an attacker could do if it were implemented otherwise; the planner carries
every such line into the plan's threat model.

Names are those on the tree after Phases 170–173. Frontend paths are relative to `apps/frontend/src/`
unless they start with `apps/`; `schema/` and `tests/database/` are relative to
`apps/supabase/supabase/`. `ENTITY/` abbreviates
`routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/`. Screen letters are
those of `CAND-APP-PLAN.md`: J is the nominations view (Phase 176), K the editor (this phase).

### 0 — Factual baseline

- **D-01 (177-0.1):** Accept all 20 facts of 177-0 as the baseline; restated under
  `<factual_baseline>` **with the corrections Phases 170, 171 and 173 made to facts 13, 15, 16 and 19,
  what Phase 175 is planned to change in fact 5, and what this phase's own overruled decisions change
  in facts 9 and 12**. The facts are a 2026-10-04 snapshot at `df0cec944`; the planner re-reads the
  tree.

### A — What the user may define

- **D-02 (177-A1; its reach ruled by OD08-E5 (a)) ⚠:** **`election_symbol` is opened to the entity
  user, on its own nomination only, while nominations are unlocked.** The guard in
  `enforce_nomination_entity_columns` stops applying to `election_symbol` for a row whose entity the
  caller holds `nomination.edit` on, on both verbs; **it goes on applying to a placeholder parent
  row the caller inserts for a party or an alliance**, so a candidate cannot set a party's symbol.
  The other eight (`name`, `short_name`, `info`, `color`, `image`, `sort_order`, `subtype`,
  `external_id`) stay guarded. The edit unconfirms the row (the confirmation trigger, rule 2), so an
  admin still reviews every self-declared symbol before it is public. pgTAP
  `23-nominations-write.test.sql` gains the positive case and the locked case.
  *From the tree:* the INSERT branch is one `num_nonnulls (…)` over the nine columns; the UPDATE branch
  is thirteen `IS DISTINCT FROM` comparisons, the nine and the four entity foreign keys. Both raise
  `insufficient_privilege`, and both messages list the columns by name — the messages change with the
  rule. `election_symbol` is already inside the INSERT and the UPDATE column grants
  (`schema/303-column-grants.sql`, "the nine presentation and bookkeeping columns a project admin
  writes").
  **If wrong** (the symbol stays admin-only): K's input writes nowhere a reader shows and NOM-04 is
  met in spirit only. (The symbol opened without the unconfirm): a confirmed candidate changes the
  ballot number voters see with no review.
- **D-03 (177-A2) ⚠:** **The parent matrix is adopted and exposed as `Election.nominationShape` in
  `@openvaa/data`, with one pure function `allowedParentTypes(shape, entityType)`; the adapter maps
  the column.** One definition, unit-tested in the data package, read by step 1 (which elections are
  offered) and by step 2 (whether the selector shows and whether it is required). It covers the
  nomination part of the data-model todo (D-24).
  *Reconciled with 177-A3 NOTE:* the matrix has **four** rows, not three:

  | `election_type` | Candidate | Organization |
  |---|---|---|
  | `organization_list` | nominable; parent **required**: a listed party or "Other" | nominable; parent optional: a listed alliance, "Other" or "None" |
  | `organization_list_and_independents` (**new, the default**) | nominable; parent optional: a listed party, "Other" or "Independent / no party" | as `organization_list` |
  | `candidate_only` | nominable; **no parent asked** | not nominable: the election is not offered in step 1 |
  | `organization_only` | not nominable: the election is not offered in step 1 | nominable; parent optional: a listed alliance, "Other" or "None" |

  Factions are never offered as a parent (faction users are out of scope).
  *From the tree:* `packages/data/src/objects/election/election.ts` has no shape property; the adapter
  maps `date`, `round` and `subtype` in `_getElectionData`
  (`lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts`) beside the comment
  "`election_type` holds the nomination shape, which is a separate axis". `subtype` stays read from
  the `subtype` column only; the adapter test that pins that
  (`supabaseDataProvider.test.ts`, the cases naming `election_type`) is extended, not loosened.
  **Planner constraints:**
  - The function answers two questions the screens ask — is this entity type nominable in this shape,
    and which parent types may it name, required or optional — and step 1, step 2 and the task state
    all ask it, never re-derive it (D-28).
  - The data model, the frontend and the database trigger (D-04) state the same matrix three times in
    two languages. The comparison table of D-24 is where their agreement is written down, and a pgTAP
    grid and a data-package unit test each cover every cell.
- **D-04 (177-A3 → (b) + NOTE, overruling the ★; ruled further by OD08-E1 (a), E2 (a) and E3) ⚠:**
  **The shape rules are added to
  `validate_nomination`: the database refuses a nomination the election's shape forbids, for every
  writer. A new election type, `organization_list_and_independents`, is added and made the default.
  It allows parentless candidate nominations.**
  *From the tree:* `public.nomination_shape` (`schema/000-enums.sql`) has three members —
  `organization_only`, `candidate_only`, `organization_list`; `elections.election_type` is
  `public.nomination_shape NOT NULL DEFAULT 'organization_list'` (`schema/101-elections.sql`).
  `public.validate_nomination` (`schema/011-validation-functions.sql`) is `SECURITY DEFINER`, fires
  `BEFORE INSERT OR UPDATE` on `public.nominations`, checks tenancy "for every writer, admins and
  service_role included", and today returns early for a parentless non-faction row
  (`IF NEW.parent_nomination_id IS NULL THEN … RETURN NEW;`). It reads `public.elections` already,
  for the tenancy check, so reading the election's type needs no new privilege.
  **What "a parent is required" means in the database (OD08-E1 (a)):** in an `organization_list`
  election the trigger refuses a candidate row whose parent is NULL **unless** `custom_data` carries
  the `requestedParentOrganization` key ("Other" satisfies a required parent, D-05); and the "has a
  parent or the key" condition is checked **at the end of the transaction**, so the write RPC's
  three statements (own row → parent → repoint, D-08) pass and a lone parentless insert does not.
  The cell-level rules that need no deferral — this entity type is not nominable in this shape —
  stay in the row trigger. **Whether PostgreSQL's deferred triggers and the SQL linter accept this
  is a research item, not yet measured (RQ-4)**, and it is measured before the RPC is designed. If
  it cannot be built as ruled, that goes back to the operator; none of the three alternatives the
  operator did not choose (a placeholder "Other" text, the parent created first, "required" left to
  the write function and the screens) is taken up silently.
  **How far the rule reaches (OD08-E2 (a)):** (i) it binds INSERT and UPDATE, for every role, the
  service role included, as the tenancy check in the same function does; (ii) a **faction**
  nomination is admitted where a candidate may have a parent (`organization_list` and the new type),
  and an **alliance** nomination wherever an organization may stand; (iii) the rule is checked when a
  **nomination** is written, and **nothing re-checks existing nominations when an admin changes an
  election's type** — no trigger on `elections` is added.
  **What the ★ warned of, and it now applies:** "It binds admin imports and every E2E dataset too
  (all templates default to `organization_list`, and several seed parentless candidates), so the
  dataset fallout is unbounded until measured." *From the tree:* all 22 `election_type` lines under
  `packages/dev-seed/src/templates` say `'organization_list'` (`e2e/base.ts`, the perm templates,
  `_helpers/buildMinimal.ts`, `default.ts`), so **changing the column default re-types none of
  them**, while an election row that states no type takes the new default;
  dev-seed's `ElectionsGenerator` emits `candidate_only` for its synthetic elections because
  "NominationsGenerator's `count` branch emits one candidate-type nomination per candidate with no
  parent".
  **Planner constraints:**
  - **Measure the fallout first.** Before the rule is written, a read-only census over every template
    and every pgTAP fixture: which rows are a parentless candidate in an `organization_list` election,
    a candidate in an `organization_only` election, or an organization in a `candidate_only` one —
    and, for every seed template that states `organization_list`, whether re-typing it to the new
    default would cause an issue (RQ-1).
  - **The seed templates are re-typed to the new default wherever that causes no issue** (OD08-E3,
    the operator's NOTE: *"Change in all templates where it would not cause issues."*). This goes
    beyond the ★, which re-typed only the templates holding a party-less candidate. The census
    decides, template by template; a template that keeps `organization_list` does so as a named
    decision with its reason — for instance one whose spec needs the required-parent case, or whose
    asserted counts would change. A template the shape rule would refuse (a party-less candidate in
    `organization_list`) is re-typed in any case. The column default becomes
    `organization_list_and_independents`, and an organization in the new type is treated exactly as
    in `organization_list`.
  - *Inferred, not the operator's words:* "templates" is read as the seed templates under
    `packages/dev-seed/src/templates`. A **pgTAP fixture** is touched only where the census finds a
    row the rule refuses, and is then re-typed or given a parent as a named decision per file; a
    fixture that exists to prove a refusal keeps the type that produces it.
  - The enum member, the column default, `packages/supabase-types` (`yarn db:types`), the dev-seed
    election generator and every doc that lists the three flows (`schema/000-enums.sql`'s header and
    comment say "the three nomination flows"; `.claude/skills/database/*`; `apps/docs`) move together.
  - `08-triggers.test.sql` (sections "validate_nomination -- valid hierarchy accepted" and "-- invalid
    hierarchy rejected") gains the shape grid: every cell of the matrix, for an entity user, for an
    admin and for the service role, each refusal asserted with its message.
  - Each refusal is a named exception a client can tell apart (D-08's refusal research).
  **If wrong** (UI and RPC only — the ★): a direct PostgREST call writes a candidate nomination into
  an `organization_only` election or a parentless candidate into `organization_list`; it starts
  unconfirmed, so it reaches voters only if an admin confirms it without noticing.
- **D-05 (177-A4 → (b) + NOTE, overruling the ★; the candidate's default ruled by OD08-E9 (a)):** **"Independent / no party" is offered to
  candidates only in `organization_list_and_independents` elections. "Other" satisfies a required
  parent. For an organization's alliance parent, "None" is the default option, selected by default.**
  So: in `organization_list` a candidate picks a listed party or types one under "Other" — there is no
  "Independent" option; in the new type the candidate may also pick "Independent / no party"; an
  organization's selector offers the listed alliances, "Other" and "None", with "None" preselected.
  **A candidate's selector has nothing preselected, in either list type** (OD08-E9 (a)): the user
  always chooses, and nothing is inferred from an untouched field. "Independent / no party" and
  "None" are the same stored shape — a NULL parent without the `requestedParentOrganization` key
  (D-21).
  *Reconciled with 177-A4 (b)'s own text* ("contradicts NOM-04 'required for candidates in
  `organization_list` elections'"): with the NOTE there is no contradiction — the option exists only
  in the type where the parent is not required, and NOM-04 was amended to say so.
  *From the tree:* the database tells "independent" from "party not in the system" by one key —
  "A candidate nomination with a NULL parent is either independent or waiting for a party that is not
  in the system yet, and that key is the only difference" (`enforce_nomination_confirmation`, header).
- **D-06 (177-A5):** **The candidate's selector lists every confirmed organization in the project.
  When the chosen party has no nomination at that pair, one is created unconfirmed.** "The project's
  parties" read literally, and the path Phase 162 built for it. Unconfirmed organizations are not
  listed; their candidates use "Other".
  *Agrees with the 175-B2 NOTE and OD-B1* ("only show confirmed ones for parent nomination selection
  for candidates") *and with 179-C1 (planned):* a self-registered organization is unconfirmed, so it
  is absent from K's parent list until an admin confirms it. That resolves the discussion's "cannot be
  defined yet" item on this point.
  **If wrong** (unconfirmed organizations listed): any registered candidate reads the names of
  entities no admin has vouched for, and can attach itself to a party minted by anyone with a bank
  identity.
- **D-07 (177-A6 → (b), overruling the ★; ruled further by OD08-E4 (a) + NOTE) ⚠:** **The
  organization's selector lists every alliance in the project, confirmed or not. `entity_insert_parent_nominations` and the organization role are extended
  so that an organization can create the alliance's nomination** — symmetric with candidates. It
  widens the one policy that lets a caller write a row that is not its own ("guard 1 becomes two
  types") and adds `nomination.create_parent` to the organization role, with new pgTAP for each
  guard.
  *From the tree:* the policy's guard 1 is `organization_id IS NOT NULL`; guard 3 calls
  `private.nomination_exists_in_contest ('organization'::public.entity_type, organization_id, …)` with
  the type as a literal; guard 5 is `private.caller_nominated_in_contest (election_id,
  constituency_id, election_round, 'nomination.create_parent')`, which asks only whether the caller
  holds that permission on **some** entity nominated at the contest; the cap conjunct and the
  trigger's cap branch both count `organization_id IS NOT NULL` rows
  (`private.caller_unconfirmed_originated_count`). `grant_role_permissions`
  (`schema/301-auth-functions.sql`) gives the organization editor "the entity set minus
  nomination.create_parent (an organization has no parent to create)". The permission matrix is pinned
  by `tests/database/25-matrix-conformance.test.sql` (it has a `matrix row nomination.create_parent`
  assertion) and read by `apps/supabase/scripts/lint-schema.mjs`; Phase 174-02 moved "the two ratified
  security lists" by exactly the measured permissions, each with its reason — the same discipline
  applies here.
  **Planner constraints:**
  - **The cap of 10 counts the caller's unconfirmed originated alliance rows too** (OD08-E4 (a)) — and
    **whether the cap is needed at all is evaluated by this phase's research** (the operator's NOTE:
    *"Evaluate whether the cap of 10 is really needed."*; RQ-8). The research comes back with a
    finding for the operator. Until the operator rules on that finding the cap stays and is built as
    stated here; it is not removed or changed on the researcher's own conclusion.
  - **The row's type is paired with the caller's type** (OD08-E4 (a)): a candidate creates an *organization*
    nomination and an organization creates an *alliance* nomination — never the other two
    combinations. With the permission on both roles and guard 1 widened to two types, a guard 5 that
    asks only "holds `nomination.create_parent` on something nominated here" would let a candidate
    create an alliance's nomination and an organization create another party's.
  - Guard 3 is asked with the row's own type and id, not the literal `'organization'`.
  - Every guard keeps its own negative control in `23-nominations-write.test.sql`: "each guard is
    load-bearing: without any one of them an authenticated candidate could write rows into the public
    nomination table, and an over-permissive policy fails no read test" (the policy's own comment).
  - `validate_nomination` already refuses an alliance nomination with a parent and requires an
    organization's parent to be an alliance nomination; the three-statement order (own row → parent →
    repoint) is the same for an organization.
  **If wrong** (guards not paired, or one dropped): an entity editor writes unconfirmed rows for
  entities that are not theirs into the table voters read from, bounded only by the cap.
### B — Write path, lock and removal

- **D-08 (177-B1; shaped by OD08-E1 (a), E8 (a) and F3 (a)) ⚠:** **One `SECURITY INVOKER` RPC,
  `set_entity_nominations(p_entity_type, p_entity_id, p_nominations jsonb)`, applies the whole desired
  set in one transaction under the caller's own row-level security.** Inserts, changed-only updates,
  parent creation and deletions either all land or none do. The existing policies, column grants and
  triggers stay the only gate, and an INVOKER function does not touch the definer census. The writer
  gets one method.
  *Reconciled with Phase 173:* the writer is generic — it dispatches on `ENTITY_TABLES` and takes the
  entity's type and id — so the new method takes `{ type, id }` like `getEntityUserData` and
  `updateEntityProperties`, and has an abstract `_…` counterpart on `UniversalDataWriter`
  (`lib/api/base/universalDataWriter.ts`). The RPC's parameter order follows `upsert_answers
  (p_entity_type, p_entity_id, …)` in `schema/503-entity-rpcs.sql`.
  **Planner constraints:**
  - **The election round is decided in the database** (D-19): the RPC reads the election's
    `current_round`; it is not a client-supplied field.
  - **The order of statements for a party or alliance with no nomination at the pair** is fixed by the
    policy: the caller's own row first, with no parent; then the parent; then the repoint
    (`private.caller_nominated_in_contest`, header). Under D-04 the first of those statements is a
    parentless candidate, which an `organization_list` election now forbids — which is why the
    "has a parent or the 'Other' text" condition is checked at the end of the transaction
    (OD08-E1 (a), D-04). **RQ-4 is measured before this RPC is written.**
  - **A changed constituency is a DELETE and an INSERT** (OD08-E8 (a)). With one constituency per
    election (D-17), an existing nomination is matched to a desired one by entity, election and
    round. The foreign key then refuses the move while candidates are listed under the nomination,
    with the same clear message as removal (D-11); a nomination with none simply moves, unconfirmed.
    Nothing checks a parent row against its children on an in-place UPDATE, so the RPC never moves a
    row's election or constituency by UPDATE.
  - **`p_nominations` is a JSONB array of objects, one per nomination** (OD08-F3 (a)), and Phase
    177.1's `create_invitations (… p_nominations)` takes the same keys: one shape for both
    nomination writes. The key names are this phase's to choose and become 177.1's contract; an
    item that is not an object, and an argument that is not an array, are refused by index, as
    `create_invitations` does today.
  - The RPC writes `custom_data` by merging: other keys are preserved (D-21).
  - The exact text a refusal reaches the user with needs research (RQ-3): how PostgREST surfaces a
    policy refusal versus a trigger's named exception versus a foreign-key refusal, through an RPC.
  **If wrong** (statement-by-statement writes from the client): a failure between "own row inserted"
  and "repointed at the parent" leaves a parentless nomination that reads as an independent candidate.
  (A `SECURITY DEFINER` RPC): it re-implements every guard the policies hold and becomes the only gate.
- **D-09 (177-B2; projection ruled by OD08-E10 (a), listing by OD08-E4 (a)):** **A new `SECURITY
  DEFINER` RPC returns the parent options as an allow-listed projection — id, entity type, name,
  short name, colour, image, and for each pair whether a nomination exists — gated on the caller holding `nomination.edit` on an entity in that project.** It follows
  `get_entity_basic_data`: answers and custom data are never returned. The entity type and the image
  are in the projection so that the options render as `EntityCard`s with a logo (D-29); both are
  already "basic data" in `get_entity_basic_data`'s allow-list. The census grows by one name,
  deliberately.
  *From the tree:* an entity editor cannot read the project's parties otherwise —
  `authenticated_select_organizations` admits `project.read_entities`, the public assembly (project
  open, entity confirmed, a confirmed nomination) or the caller's own entity.
  `get_entity_basic_data`'s header gives the pattern: "The projection is an ALLOW-LIST, not
  `to_jsonb(row) - <deny-list>`"; "Returns NULL -- never raises"; "EXECUTE is authenticated only".
  *Reconciled with Phase 171:* the census string in `tests/database/07-rpc-security.test.sql` is now
  "the same six plus get_entity_basic_data" — seven names for `authenticated`, six for `anon`. This
  RPC adds one to the `authenticated` list and none to `anon`'s. Phase 176's nominations RPC (planned,
  176-B2) may have added another by then.
  **Planner constraints:**
  - The list is **confirmed organizations** (D-06) and **every alliance of the project, confirmed or
    not** (D-07; OD08-E4 (a)), of the caller's own project only, taken from the entity the
    caller edits and never from an argument the caller can point elsewhere.
  - "Whether a nomination exists" is asked at the election's current round (D-19).
  - `search_path = ''`, `REVOKE … FROM PUBLIC, anon`, `GRANT … TO authenticated`, as on every definer
    function in `schema/503-entity-rpcs.sql`.
  **If wrong** (a SELECT-policy disjunct instead): a policy returns every column, so each candidate
  could read every party's unpublished answers. (No gate on the caller's project): any signed-in user
  enumerates the parties of any project, open or not.
- **D-10 (177-B3):** **The confirmation trigger stays as it is; the write path skips rows whose values
  did not change.** Any real change — symbol, parent, the free-text request, a moved pair — unconfirms,
  and pressing Continue on an untouched card does not. The RPC compares before it updates.
  *From the tree:* rule 2 of `enforce_nomination_confirmation` sets `NEW.confirmed := false` on every
  UPDATE by an `authenticated` caller without `nomination.confirm`; it compares nothing, so a no-op
  UPDATE unconfirms too. The comparison is therefore load-bearing and gets its own pgTAP assertion:
  the RPC called with the stored values leaves `confirmed` and `updated_at` unchanged.
- **D-11 (177-B4) ⚠:** **`entity_delete_nominations` is added: the caller's own nomination, project
  unlocked, confirmed or not; K warns before removing a confirmed one.** "Unlocked means you manage
  your own nominations" for all three verbs. An organization whose nomination has candidates under it
  gets a clear "cannot be removed while candidates are listed under it" message from the foreign-key
  refusal.
  *From the tree:* `admin_delete_nominations` is the sole `FOR DELETE` policy on `public.nominations`;
  `parent_nomination_id` is `ON DELETE NO ACTION` — "the delete is refused while children remain".
  The new policy is `nomination.edit` on the row's entity (the coalesced foreign key and the generated
  `entity_type`, as `entity_update_nominations` writes it) `AND NOT private.project_nominations_locked
  (project_id)` — a fifth call site of that helper.
  **Planner constraints:**
  - A row the caller created for someone else (a placeholder parent) is not the caller's own and is
    not deletable by it; pgTAP pins that.
  - Whether `authenticated` holds the table-level DELETE privilege on `public.nominations` was not
    verified here (RQ-2); `schema/303-column-grants.sql` revokes and re-grants INSERT and UPDATE only.
  - In a project where step 1 is skipped (D-16) there is no place to deselect the only pair, so
    removal is not reachable there through K. **Open — Q4;** the UI spec proposes a rule and it
    comes back to the operator (OD08-E12 (a)).
  **If wrong** (no lock conjunct): a locked project's nominations are withdrawn with one PostgREST
  call. (No entity conjunct): any editor deletes any nomination.
- **D-12 (177-B5 → (b), overruling the ★; confirmed by OD08-B1 to B4 (a)) ⚠:** **"Locked" is the app
  setting `access.nominationsLocked`. K, the nominations view and the write path all answer to that
  one lock; the database enforces it.** A stale client that tries anyway gets the policy refusal,
  shown as the "nominations are locked" note.
  *Reconciled with the 175-B5 NOTE and `REQUIREMENTS.md` ("Nominations locked"):* the ticked option's
  own text says "Two sources then have to agree, and the database lock stays authoritative, so the
  setting can lie". **There is one source** (OD08-B4 (a)), as the NOTE says — "move it to app_settings
  **away from project**": the column goes and the database reads the setting.
  *Reconciled with OD-B1:* the ★ had "175's name fields all read" the same accessor. **They do not** —
  a name is gated on `confirmed`. The lock's only readers are J (Phase 176) and K and the write path
  (this phase).
  *As planned in 175-CONTEXT D-10 (not executed; ruled by OD08-B1 to B4 (a)):* the column
  `projects.lock_nominations` is removed; the body of `private.project_nominations_locked` reads
  `app_settings.settings #> '{access,nominationsLocked}'`; its callers in `schema/302-rls.sql` do not
  change; the contestant context exposes `nominationsLocked` beside `answersLocked`. The lock is a
  key inside `app_settings.settings`, written under `project.edit_app_settings`, **which project
  editors hold as well as admins** (OD08-B2 (a)): a project editor can reopen a closed nomination
  period, after which the entity write policies admit writes again. A project that does not exist is
  **locked**; a project with no `app_settings` row, or without the key, or with any value other than
  `true`, is **unlocked** (OD08-B3 (a)).
  **What this phase does with it:** it **reads** the accessor (`ctx.nominationsLocked`, never
  destructured) and **adds one call site** of the helper (D-11), which inherits both rules. It builds
  neither the setting nor the accessor: Phase 175 does (OD08-B1 (a)). The E2E "locked" case and the
  pgTAP fixtures set the lock by restating the whole `access` root.
  **If wrong** (the lock read in the frontend only): a locked project's nominations are written with
  one RPC call. (The setting kept beside the column): the two disagree and the screen says "locked"
  while the database accepts the write, or the reverse.
- **D-13 (177-B6):** **K is not editable when either lock is on — `access.nominationsLocked` or
  `access.answersLocked`; only the nominations lock is enforced in the database.** The home screen
  never offers a task that cannot be completed: a new nomination can add questions the user would then
  not be allowed to answer.
  *From the tree:* `#answersLocked = $derived(!!this.#appSettings.access.answersLocked)` in
  `lib/contexts/contestant/contestantContext.svelte.ts`; no file under `schema/` reads
  `answersLocked`. So with answers locked and nominations unlocked the screens offer no Edit and the
  database still accepts the write — stated, not closed.
  *Agrees with OD-B1:* the nominations lock affects nominations only; this decision adds the answers
  lock as a second condition on K's **screens**, which is what the ★ says.
  **J's note is widened here** (operator decision D5 (a) of 2026-10-08): Phase 176 shows the "not
  editable" note on J for the nominations lock alone; this phase, which adds editing, shows it under
  either lock and words the second reason.
  **A K step opened by URL while K is not editable redirects to J, which shows the note**
  (OD08-E13 (a)) — the treatment Phase 176 gives every other page a user may not open. No read-only
  state of the three step pages is built. *Inferred for the answers lock:* the ruling names the
  nominations lock; the redirect is applied whenever K is not editable, which under this decision
  includes the answers lock. The load that redirects reads no `url` property (D-18).
- **D-14 (177-B7):** **Answers to questions that no longer apply are kept in the entity's `answers`,
  not asked and not counted by the task state; they return if the nomination returns.** No write on a
  nomination change, and a mis-click costs nothing. Voters only see answers to questions that apply to
  the nomination they are viewing.
  **Planner constraint:** "not counted" is a property of the task state and of `profileComplete`,
  which read the applicable question set, not the stored keys. A unit test of the task-state helper
  holds an answer to a question outside the applicable set and asserts it changes nothing.

### C — Step 1: choosing the pairs

- **D-15 (177-C1) ⚠ — see D-28.** **The two selector components are reused, and the ordering decisions
  are extracted from the voter route files into one shared pure module that both apps call.** Which
  step is first, which elections follow a chosen constituency, and the single-group mode are decided
  in one place. `perm-startfromcg` then guards both apps, which is what the harmonisation todo asks
  for. The voter routes change only by calling the extracted functions.
  *From the tree:* the decisions live in four files today — the redirect tables in the doc comments
  and bodies of `routes/(voters)/elections/+page.ts` and `routes/(voters)/constituencies/+page.ts`;
  the `elections` derivation in `routes/(voters)/elections/+page.svelte` (elections filtered to those
  with an applicable constituency when `startFromConstituencyGroup` is set, a throw from
  `getApplicableConstituency` treated as applicable); `useSingleGroup` and the "most specific
  applicable constituency" prefill in `routes/(voters)/constituencies/+page.svelte`. Two pure helpers
  already exist beside the routes: `getImpliedElectionIds` and `getImpliedConstituencyIds` in
  `lib/routes/impliedParams.ts`. `ElectionSelector` and `ConstituencySelector`
  (`lib/components/electionSelector`, `lib/components/constituencySelector`) are presentational.
  **Planner constraints:**
  - The voter flow's behaviour does not change: the voter specs, including `perm-startfromcg` and the
    `variant-startfromcg` cases the route comments name, pass unchanged.
  - What the voter flow does that the contestant flow does not — the redirect to Questions, the
    `?next=` deferred target and its allow-list check, the voter URL params — stays in the voter
    routes; only the decisions move.
  - **The contestant side does not honour `elections.disallowSelection`** (OD08-E14 (a)): an entity
    always chooses the elections it stands in. `getImpliedElectionIds` reads that setting for the
    voter; the shared module must let the contestant caller leave it out, so that an entity is never
    put into every admissible election without being asked.
- **D-16 (177-C2 → (b), overruling the ★; then OD08-E6 (b), overruling that decision's ★ too):**
  **A single admissible election is never shown as a choice.** The elections are counted **after**
  the entity-type filter (Additional note 2; D-28). Then:

  | Admissible elections | Constituencies of that election | What step 1 shows |
  |---|---|---|
  | one | one | nothing — the selection is skipped and the user goes straight to the card |
  | one | several | **the constituency step only**; no election step |
  | several | any | the election step, then the constituency step where a choice remains |

  It is NOM-03's wording — "the election choice is offered whenever there is something to choose" —
  and what a voter gets: the voter's implication rule applied to the contestant.
  *What is not built (the ★ of OD08-E6, and this file's earlier reading):* an election step that
  renders for a single admissible election with that election preselected. ROADMAP criterion 1's
  "otherwise the election choice is offered" was amended on 2026-10-08.
  *Carried over from this file's reading, not ruled on:* in the several-elections row the
  constituency step is skipped only when every chosen election has a single constituency; and a skip
  is a redirect to the next step, so Back from the cards leaves K.
  *Reconciled with OD08-E14 (a):* the implication used here is "one admissible election", never
  `elections.disallowSelection` (D-15).
  *Reconciled with `CAND-APP-PLAN.md` screen K* ("except always allow election choice"): overruled
  twice — by 177-C2 (b) for the one-election, one-constituency case, and by OD08-E6 (b) for every
  single-admissible-election case.
  **Open:** where the selection is skipped there is no selector in which to deselect the only pair
  (Q4), and no admissible election at all is Q1.
- **D-17 (177-C3 → (a) + NOTE) ⚠:** **One constituency per election for both entity types in this
  phase; a todo is filed for organization multi-constituency selection, and the todo says it could be
  enabled for candidates as well through a setting.** "The same way a voter does" needs no new
  selector mode. An organization standing in many constituencies is seeded by the admin and can edit
  symbol and alliance per seeded pair in step 2. **The limitation is stated in the Publishers' Guide**
  (OD08-E15 (a)) — the admin who must do the seeding is its reader.
  *From the tree:* `ConstituencySelector`'s bound value is `selected?: { [electionId: Id]: Id | '' }`.
  **Consequence the planner designs for:** an admin-seeded organization may already hold several
  nominations in one election. Step 2 shows a card for each of them; step 1 cannot represent them.
  **Open — Q3;** the UI spec proposes a rule and it comes back to the operator (OD08-E12 (a)).
- **D-18 (177-C4 → (a) + NOTE; confirmed by OD08-E7 (a)):** **Separate routes under the nominations
  view, in a route group — the directories are `…/nominations/(edit)/elections`,
  `…/(edit)/constituencies`, `…/(edit)/details`, so the URLs are `…/nominations/elections`,
  `…/nominations/constituencies`, `…/nominations/details`, with no `edit` segment — and with the
  chosen ids in the URL search params, as the voter app carries them.** "As the voter app carries
  them" names the mechanism (search params), not the voter's param names. Reload and Back work, each
  step is addressable by E2E and the axe scan, and nothing is written until Continue on the cards.
  Existing nominations prefill the selection.
  *Reconciled with the Phase 173 outcome:* the prefix is settled — the steps sit under `ENTITY/`
  (`CONTESTANT_ENTITY` in `lib/routes/route.ts`), below Phase 176's `nominations` route (planned,
  176-B1), with route constants beside it.
  **Planner constraints:**
  - **The steps sit outside Phase 176's NOM-07 gate group** (planned, 176-D1): K must be reachable by
    an entity with no nomination.
  - The entity-level `+layout.server.ts` "reads the `entityType` and `entityId` route params and no
    other, no `url` property and no `route`", and a `layout.tracking.test.ts` beside it fails on a
    tracked read. The chosen ids are read in the **step's own page**, not in a layout load on the
    path.
  - A step opened without the ids it needs sends the user to the step that collects them, as the voter
    loads do.
- **D-19 (177-C5 + NOTE):** **A new nomination is for the election's `current_round`; the user is not
  asked.** It matches what an admin import writes for a running election. **A todo is filed for
  checking the whole app for election-round conformity — it has not been tested.**
  *From the tree:* `elections.current_round integer DEFAULT 1`; `nominations.election_round integer
  DEFAULT 1` with `nominations_election_round_check`; the adapter maps `current_round` to
  `Election.round` ("@defaultValue 1"); a parent and its child must share the round
  (`validate_nomination`: "Nomination election_round must match parent").

### D — Step 2: the cards

- **D-20 (177-D1 → (a) + NOTE; enforcement ruled by OD08-E5 (a)):** **One optional plain-text field
  per card, trimmed, capped at 50 characters, not per locale. The trim and the cap are applied by
  the input and again by the write RPC; no column constraint is added, so an admin import is not
  bound by the cap.** A todo is filed for an election-specific setting for the symbol
  type.** The column is `text`; symbols are usually numbers but not always.
  *Reconciled with the NOTE:* the ★ said 20 characters; the cap is 50.
  *From the tree:* a per-type label pattern exists — `common.electionSymbol.candidate` /
  `.organization` in `apps/frontend/messages/en/common.json`.
- **D-21 (177-D2):** **The "Other" text is a trimmed, non-empty string at
  `nominations.custom_data.requestedParentOrganization` on the entity's own nomination, with the
  parent left NULL; other `custom_data` keys are preserved; the key is removed when a listed parent is
  later chosen.** The exact shape the confirmation trigger and pgTAP already expect. The same key
  serves an organization's unlisted alliance.
  *From the tree:* rule 1 of `enforce_nomination_confirmation` refuses to confirm a row whose
  `custom_data ? 'requestedParentOrganization'` and reads it with `->>`; its message speaks of "a
  candidate who asked for a party", which is also what an admin will read for an organization that
  asked for an alliance. `custom_data` is in the entity user's INSERT and UPDATE grants. No file under
  `apps/frontend/src`, `packages/` or `tests/` mentions the key today.
  **Planner constraint:** "Independent / no party" and "None" are the same stored shape — a NULL
  parent **without** the key (D-05). The key's presence is the only thing that separates them from
  "Other", so removing it on those choices is as load-bearing as setting it on "Other".
- **D-22 (177-D3):** **An inline note on each card whose nomination is currently confirmed** says that
  editing it needs re-confirmation. The consequence is visible before Continue, without an extra step.
  *As planned in 176-B3:* J shows each nomination's state, "Pending confirmation" or "Confirmed", with
  a line that a pending nomination is not yet visible to voters. K's note and J's line say the same
  thing in the same words.

### E — Tests and todos

- **D-23 (177-E1):** **Contestant tests are added to `perm-startfromcg.spec.ts` on its existing
  dataset, with a signed-in contestant added through the admin client; and a new
  `contestant-nominations.spec.ts` runs on a dedicated perm dataset.** The new dataset holds an
  unnominated candidate, an unnominated organization, two elections of different shapes and a party
  without a nomination at one pair. It covers define, required parent, "Other", edit-unconfirms,
  removal and locked, without changing `e2e/base` counts other specs assert.
  *Reconciled with 177-A3, A4 and A6 as ticked:* the dataset also holds an election of the new type
  (for "Independent / no party"), an `organization_list` election (for the required parent), an
  alliance with no nomination at a pair (for the organization's parent creation), and a confirmed
  nomination to edit. The database refusals of D-04 are pgTAP's, not this spec's.
  *Reconciled with Phases 173 and 174-03:* the contestant is created with `forceRegisterUser(email,
  password, { entityGrants })` in `tests/tests/utils/supabaseAdminClient.ts`; public sign-up is
  closed. "Perm setups serve candidates alone" (`e2e/perm/shared.ts`: `entityTypes: ['candidate']`), so
  the new template restates the whole `contestantApp` root with `organization` served; the
  `perm-startfromcg` test needs a candidate only.
  *Reconciled with D-12:* the locked case sets `access.nominationsLocked`, restating the whole `access`
  root (a stored root replaces the shipped root whole).
  *Reconciled with 179-CONTEXT D-21 (planned):* the covering tests carry the tag
  `@nomination-definition`, which Phase 179's gate script looks for.
  *Reconciled with OD08-E6 (b) and OD08-E3:* the spec covers the three rows of D-16's table — in
  particular **one admissible election with several constituencies shows the constituency step and
  no election step**. Which of the dataset's elections state `organization_list` is deliberate (the
  required-parent case needs one); the `perm-startfromcg` template's two `organization_list`
  elections are among those the census of D-04 looks at.
  **Planner constraints:**
  - `perm-startfromcg.spec.ts` sets `elections.startFromConstituencyGroup` at run time in `beforeAll`
    and restores it in `afterAll`; its template seeds no identity that can sign in. The contestant
    tests are added to **that** file — "extended … rather than paralleled".
  - Every new or changed surface — the three step pages, the cards with each selector state, J with
    Edit, the locked state — gets an entry in `tests/tests/specs/a11y/contestant-a11y.spec.ts` in both
    themes, under the session that reaches it, and the verdict's `--except contestant-a11y-scan=<n>`
    moves with the count (173-13 SUMMARY).
  - The setup and teardown are their own Playwright project pair in the perm chain; external ids keep
    clear of the generators' namespaces
    (`2026-08-24-external-id-namespace-collision-con-prefix.md`).
- **D-24 (177-E2):** **The nomination part of `2026-09-24-data-model-vs-db-nomination-constraints.md`
  is done here and the todo is re-scoped to the remaining tables**: a comparison table for the
  nomination rules, data-package unit tests for those K relies on, and `nominationShape` (D-03).
  Elections, constituencies, entities and questions stay in the todo.
  *From the tree:* the data model checks "Either none or both parentNominationType and
  parentNominationId must be defined" in `packages/data/src/objects/nominations/base/nomination.ts`
  and knows nothing of the contest-match rule, the uniqueness key, the election shape or `confirmed`.
- **D-25 (177-E3):** **`2026-08-28-preregister-election-constituency-selection-harmonisation.md` is
  closed at this phase**, noting that the legacy `preregister` selection pages it names are deleted in
  Phase 179. D-15 and D-23 are its two asks.

### F — Plan shape and gate

- **D-26 (177-F1) ⚠:** **Five sequential plans.** (1) schema; (2) data model and adapter; (3) step 1;
  (4) step 2; (5) E2E, the two todos, the gate. Each leaves the suite green.
  *Reconciled with the ticked decisions — plan 1's content grows:* not only "symbol rule, delete
  policy, the two RPCs" but also **the enum member and the new default, the shape rules in
  `validate_nomination` with the fixture fallout (D-04), and the widened parent policy with the
  organization role (D-07)**, then pgTAP, the regenerated migration and the types. Plan 2:
  `nominationShape`, `allowedParentTypes`, the adapter mapping, the writer method, and whatever
  nomination read K needs beyond Phase 176's RPC, which is the app's one nominations read
  (176-CONTEXT D-09).
  **Order of work under OD08-E12 (a):** plans 3 and 4 are the screens, and they are not planned
  until the operator has answered the four open situations (Q1, Q3, Q4, Q6) in the UI spec's round.
  Plans 1 and 2 do not wait on it. Plan 3: the shared ordering module, the routes, the
  voter routes repointed. Plan 4: the cards and the parent selector component (D-29), Continue through
  the task state, Edit on J, the lock and the notices, seven locales. Plan 5: the template, the specs,
  the axe entries, the todos, the docs, the gate.
  The planner may split a plan that grows past one verifiable unit — plan 1 now carries five
  independent schema changes — but keeps the order and **one** migration regeneration.
- **D-27 (177-F2; widened by OD08-E16 (a)):** **Closing gate: `yarn lint:check`, `yarn test:unit`,
  pgTAP, `yarn db:lint:sql`, the production build, then one full wrapper E2E run, and the new
  `contestant-nominations.spec.ts` three times in isolation; each read by exit status.** The three
  isolated runs are the project's determinism check for a new spec, as Phases 175 and 176 run it.
  *Reconciled with the Phase 173–175 practice:* the phase carries its own driver scripts in the phase
  directory (`173-gates.sh`, `173-e2e.sh`, `173-verdict.mjs` are the pattern), records the power state
  for every run (a host suspend voids a run — operator decision C5), reads no gate through a pipe, and
  adds the writer integration test against the running stack, which no CI job runs. *The ★ as
  written* asked for no isolated repeats of the new spec; the operator added them.

### Additional notes and the operator decision

- **D-28 (Additional note 2):** **The contestant's election and constituency selection differs from
  the voter's in one respect: it first filters the elections by the entity's type against each
  election's `election_type`. That does not stop it honouring `startFromConstituencyGroup`. However
  the logic is computed, the predicates are centralised as far as possible.** The filter is
  `allowedParentTypes`' sibling question in the data package (D-03); the ordering is the shared module
  (D-15); step 1, step 2, the task state and the database rule all ask the same matrix.
- **D-29 (Additional note 3; data ruled by OD08-E10 (a)):** **The party selector and the alliance selector are one
  reusable component that renders its items as `EntityCard`s, in a compact variant if needed.**
  *From the tree:* `EntityCard` (`lib/dynamic-components/entityCard/`) takes an `@openvaa/data` entity
  object, an `action` (URL, handler or `false`), `variant?: 'list' | 'details' | 'subcard'`,
  `headerOnly` and `showType`; Phase 173 built the entity-selection list from it with `EntityList`.
  The item must therefore be an entity **in the data root**; `provideEntityData` "does not reset the
  entity collections" (173-13 SUMMARY). The parent-option RPC returns the entity type and the image
  for that purpose (D-09), and the options are provided to the data root as entities. "Other", "None" and "Independent / no party" are options of
  the same control that are not entities.
  **Planner constraint:** the control is a single-choice group with a keyboard model and names a
  screen reader announces (WCAG 2.1 AA) — a list of links is not one. The UI spec settles the
  compact variant. What the card shows for a linked party that is no longer among the options is
  **open — Q6**.
- **D-30 (OD-B1 (a)):** **The nominations lock affects nominations only; a name is gated on
  `confirmed`, not on the lock.** For this phase: K reads and writes no name field; the lock K obeys
  is not the rule the profile's name fields follow; and "confirmed" is what decides whether a party
  is listed as a parent (D-06). An **unconfirmed entity may define nominations** — nothing in the
  sources or the policies ties the write to the entity's own `confirmed` flag; such a nomination is
  not public until both are confirmed.

- **D-31 (OD08-E11 (a) + NOTE; OD08-D4 NOTE) — how the task and J lead to K.** **The "Define
  nomination" task, and `nextStep` with it, lead straight to K's first step only when nominations
  can be edited (neither lock on, D-13) and the entity has no nomination. In every other case the
  task leads to J: with nominations the user sees them first and clicks Edit there to open K; when
  nominations cannot be edited J shows the "not editable" note and no Edit.** The operator's NOTE:
  *"Only route to Edit when editable and empty. Otherwise first View then they click on Edit."* It
  narrows the ★, which sent the task to K whenever nominations were editable.
  *Inferred:* "empty" is read as "the entity has no nomination".
  **J's own button** follows from Phase 176's ruling (operator decision D4 (a) + NOTE, "Relabel to
  Return if user cannot add nominations"): with no nomination, J's button reads Return and leads to
  the entity's home where the user cannot add one. *Inferred for the other case:* where the user can
  add one, the button reads Continue and follows `nextStep`, which under this decision is K. Phase 176 ships it as Return in every no-nomination state, since it has no editor.

> **Count.** D-01..D-27 are the 27 discussion decisions, one to one; D-28, D-29 and D-30 are the two
> additional notes and OD-B1 (a); D-31 was added on 2026-10-08 for OD08-E11. **31 decisions.**

### Reconciliations

| # | What the discussion's ★ (or text) said | What is built instead | Reconciled with |
|---|---|---|---|
| R1 | 177-B5 ★: "`projects.lock_nominations` is the single lock" | The lock is the app setting `access.nominationsLocked` (D-12) | 177-B5 (b); 175-B5 (b) + NOTE; `REQUIREMENTS.md` "Nominations locked" |
| R2 | 177-B5 (b) text: "Two sources then have to agree … the setting can lie" | One source: the column goes and the database reads the setting (D-12) | 175-B5 NOTE; 175-CONTEXT D-10 and R6; OD08-B4 (a) |
| R3 | 177-B5 ★: the accessor is read by "K, the nominations view and 175's name fields" | Names do not read it; J and K do (D-12, D-30) | OD-B1 (a) |
| R4 | 177 header: "reads … 175 (the lock accessor GEN-03 uses)"; cross-phase "→ 175: GEN-03's 'editable unless nominations are locked' and 177-B5 must read the same accessor over `projects.lock_nominations`" | GEN-03 no longer uses a lock; the accessor is over the app setting (D-12) | OD-B1 (a); GEN-03 as amended 2026-10-07; 175-B5 NOTE |
| R5 | 177-A2: a three-row matrix | Four rows; the new type is the default (D-03) | 177-A3 NOTE |
| R6 | 177-A3 ★: "UI and RPC only … File the DB rule as a todo" | The rule is built in `validate_nomination`; no todo (D-04) | 177-A3 (b) |
| R7 | 177-A4 ★: "no 'independent' option where the parent is required"; (b)'s text: "contradicts NOM-04" | "Independent / no party" exists, only in the new type; no contradiction (D-05) | 177-A4 (b) + NOTE; NOM-04 as amended |
| R8 | 177-A6 ★: "Only alliances that already have a nomination at that pair … no policy change" | Every alliance; the policy and the role are widened (D-07) | 177-A6 (b) |
| R9 | 177-0 fact 9: "an organization cannot create an alliance parent nomination" | True today; this phase changes it (D-07) | 177-A6 (b) |
| R10 | 177-0 fact 12: `nomination_shape` has three members, "default the last" | Four members; the default is the new one (D-04) | 177-A3 NOTE |
| R11 | 177 cross-phase "→ Admin app: … with 177-A6(a) it also holds organizations asking for an alliance" | Under (b) the queue holds an organization only when it typed an alliance under "Other"; a listed alliance is linked, creating its nomination when missing (D-07, D-21) | 177-A6 (b) |
| R12 | 177-C2 ★: "The election step always renders, even with one election" | A single admissible election is never shown as a choice; the whole selection is skipped for one election with one constituency, counted after the entity-type filter (D-16) | 177-C2 (b); Additional note 2; OD08-E6 (b) |
| R13 | 177-C1 ★: the ordering is "decided in one place" for both apps | Plus one difference: the contestant side filters by entity type first (D-28) | Additional note 2 |
| R14 | 177-D1 ★: "capped at 20 characters" | 50 characters (D-20) | 177-D1 NOTE |
| R15 | 177-C4 ★: `…/nominations/edit/elections` and so on | A route group, `…/nominations/(edit)/elections`, with no `edit` in the URL (D-18) | 177-C4 NOTE; ROADMAP § Phase 177; OD08-E7 (a) |
| R16 | "Cannot be defined yet": the route prefix of K | Settled: under `ENTITY/`, the route parameter of Phase 173 (D-18) | 173-B1 ★; Phase 173 (executed) |
| R17 | "Cannot be defined yet": the writer's shape | Settled: a method taking the entity's type and id on the generic writer (D-08) | Phase 173 (executed) |
| R18 | "Cannot be defined yet": whether self-registered organizations appear in the parent list | Settled: they are unconfirmed, so absent (D-06) | 179-C1 ★ (planned); OD-B1 (a) |
| R19 | "Cannot be defined yet": where the lock accessor lives — "if 175 chooses otherwise, 177 follows 175" | Phase 175 builds it, as `ctx.nominationsLocked` (D-12) | 175-CONTEXT D-10; OD08-B1 (a) |
| R20 | 177-0 facts 13, 15, 16: `routes/candidate/…`, `candidateContext.svelte.ts`, `_getCandidateUserData` | `routes/contestant/…`, `contestantContext.svelte.ts`, `_getEntityUserData` selecting by `` `${type}_id` `` | Phases 170, 173 (executed) |
| R21 | 177-0 fact 19: the census "pinned to six names … the same five plus get_entity_basic_data" | Seven names for `authenticated` ("the same six plus get_entity_basic_data"), six for `anon` (D-09) | Phase 171 (executed) |
| R22 | 177-E1 ★: "a signed-in contestant added through the admin client"; a dataset of four things | `forceRegisterUser` with entity grants; the dataset also holds the new election type, an alliance without a nomination, a confirmed nomination; the template restates `contestantApp` and `access` (D-23) | Phases 173, 174-03; 177-A3, A4, A6 as ticked; D-12 |
| R23 | 177-F1 ★ plan 1: "symbol rule, delete policy, the two RPCs" | Plus the enum member and default, the shape rules and their fixture fallout, the widened parent policy and the organization role (D-26) | 177-A3 (b) + NOTE; 177-A6 (b) |
| R24 | 177 cross-phase "→ 176: … the read in fact 16 has to widen for that, and 177 plan 2 does it if 176 has not" | Phase 176 is planned to build an entity-scoped RPC with `confirmed`, `custom_data` and the parent resolved (176-B2 ★); this phase reads it and widens nothing; it is the app's one nominations read | 176-B2 ★ (planned); operator decision D1 (a) of 2026-10-08 |
| R25 | 177 cross-phase "Residue: the cap of 10 … does not bite under 177-C3(a)" | It can bite one user who edits several organizations, since the count is per user and not per entity; the todo says so | Phase 173 (multi-entity grants, executed) |
| R26 | The discussion places 177 after 176 with 174 → 175 before | Phase 174.1 runs between 174 and 175; K sits behind the gate it repairs | OD-D1 (a), OD-D2 (a) |
| R27 | `CAND-APP-PLAN.md` K: "except always allow election choice" | Overruled for every single-admissible-election case (D-16) | 177-C2 (b); OD08-E6 (b); NOM-03 as amended |
| R28 | ROADMAP criterion 1 (as it read): "otherwise the election choice is offered"; this file's J9 reading: a single admissible election shown preselected | The election step is shown only when more than one election is admissible (D-16) | OD08-E6 (b); ROADMAP criterion 1 as amended 2026-10-08 |
| R29 | This file's J6 reading: templates keep their stated type except those holding a party-less candidate | Every seed template is re-typed to the new default wherever that causes no issue; a census decides (D-04) | OD08-E3 NOTE |
| R30 | `CAND-APP-PLAN.md` I: "If editable Edit ⇒ K, else View ⇒ J"; this file's J14 reading | To K only when editable **and** the entity has no nomination; otherwise J, then Edit (D-31) | OD08-E11 (a) + NOTE |
| R31 | 177-F2 ★: one full E2E run, no isolated repeats | Plus the new spec three times in isolation (D-27) | OD08-E16 (a) |
| R32 | 177-0 "Expected from 176": two note components; a `blocked` questions task while required info is missing | One note component over the existing `ContactSupport`; the questions depend on a nomination only and the preview on both filled (`<expected_tree>`) | 176-CONTEXT D-07, D-12; operator decision D2 EDIT of 2026-10-08 |

### Judgement calls — all ruled 2026-10-08

Each was something this file had to interpret rather than read off a source. The operator ruled on all
fourteen in `.planning/v2.16-OPERATOR-DECISIONS-2026-10-08.md`. **None is open.** Ten rulings are the
reading this file had given; J6, J7, J9 and J14 are not, or carry a NOTE, and the decisions above are
rewritten for them. This list records each ruling and what was not chosen, so that nobody re-opens it.

- **J1 — Where the lock and its accessor come from (D-12). RULED: OD08-B1 (a).** Phase 175 moves the
  lock into `access.nominationsLocked`, re-points `private.project_nominations_locked` and exposes
  `ctx.nominationsLocked`; this phase reads the accessor and adds one policy call site. *Not chosen:*
  Phase 176 or this phase building it.
- **J2 — Who may lock and unlock, and the missing-row rule (D-12). RULED: OD08-B2 (a), OD08-B3 (a).**
  Project editors may lock and unlock as well as admins. A missing project is locked; a missing
  `app_settings` row or key, or any value other than `true`, is unlocked. *Not chosen:* a full
  column changeable by admins only; a trigger guarding the key; a missing row or key reading as
  locked.
- **J3 — One source, not two (D-12). RULED: OD08-B4 (a).** The column is removed and the database
  enforces the setting. *Not chosen:* the column staying, and staying authoritative.
- **J4 — What "the parent is required" means in the database (D-04, D-08). RULED: OD08-E1 (a).** A
  parentless candidate row in `organization_list` is refused unless it carries the "Other" text, and
  "has a parent or the text" is checked at the end of the transaction. Whether PostgreSQL's deferred
  triggers and the SQL linter accept this is a research item, not yet measured (RQ-4). *Not chosen:*
  a placeholder "Other" text removed at the repoint; letting the party's row be created first; the
  database enforcing only "this entity type may stand here".
- **J5 — How far the shape rule reaches (D-04). RULED: OD08-E2 (a).** Inserts and updates, every role;
  a faction where a candidate may have a parent, an alliance wherever an organization may stand;
  nothing re-checks existing nominations when an election's type changes. *Not chosen:* binding
  signed-in users only; never refusing faction and alliance rows; a rule refusing a type change that
  would leave nominations invalid.
- **J6 — What "making it the default" touches (D-03, D-04). RULED: OD08-E3 — no box, NOTE: "Change in
  all templates where it would not cause issues."** The column default changes, and every seed
  template is re-typed to the new default wherever that causes no issue; a census decides which
  (D-04). This goes beyond the reading this file had given (only the templates with a party-less
  candidate). An organization in the new type is treated exactly as in `organization_list`. *Not
  chosen:* keeping every type and giving the party-less candidates a party.
- **J7 — The widened parent policy: pairing, the cap, which alliances are listed (D-07, D-09). RULED:
  OD08-E4 (a), with the NOTE "Evaluate whether the cap of 10 is really needed."** Paired — a
  candidate creates a party's row, an organization an alliance's, never the other way round; the
  cap of 10 counts alliance rows too; every alliance is listed, confirmed or not. **The NOTE is a
  research item (RQ-8): it comes back with a finding, and the cap is built as stated until the
  operator rules on it.** *Not chosen:* no pairing; alliance rows outside the cap; only confirmed
  alliances listed.
- **J8 — How far the opened symbol reaches, and where its cap is enforced (D-02, D-20). RULED:
  OD08-E5 (a).** Own nomination only; the cap and the trim are applied by the input and again by the
  write RPC; no column constraint. *Not chosen:* removing the symbol from the guarded columns
  outright; a `CHECK` on the column.
- **J9 — What exactly is skipped, and when (D-16). RULED: OD08-E6 (b), overruling the ★ and the reading
  this file had given.** A single admissible election is never shown as a choice; only the
  constituency step is shown, and the whole selection is skipped when that election has one
  constituency. Elections are counted after the entity-type filter. *Not chosen:* the election step
  rendering with a single election preselected (the roadmap's former "otherwise").
- **J10 — The route group, and where the chosen ids are read (D-18). RULED: OD08-E7 (a).** A route
  group; the URLs carry no `edit` segment; each step's own page reads the chosen ids. *Not chosen:*
  a literal `edit/` segment.
- **J11 — What a "moved pair" is (D-08, D-10). RULED: OD08-E8 (a).** A changed constituency is a delete
  and an insert; the database refuses it while candidates are listed under the nomination. *Not
  chosen:* editing in place with a new trigger rule; editing in place and accepting the mismatch.
- **J12 — The candidate's default in the party selector (D-05, D-21). RULED: OD08-E9 (a).** Nothing is
  preselected for a candidate, in either list type; "None" stays preselected for an organization.
  *Not chosen:* "Independent / no party" preselected in the new type.
- **J13 — What the parent-option RPC returns (D-09, D-29). RULED: OD08-E10 (a).** The entity type and
  the image as well as id, name, short name and colour. *Not chosen:* the four fields only.
- **J14 — How the home task and J lead to K (D-31). RULED: OD08-E11 (a), with the NOTE "Only route to
  Edit when editable and empty. Otherwise first View then they click on Edit."** The task leads to
  K only when nominations can be edited and the entity has none; otherwise to J, where Edit opens K
  when nominations can be edited. *Not chosen:* the task always leading to J.

### Claude's Discretion

- The names, locations and exact signatures of the shared ordering module, the data-package function
  beside `allowedParentTypes`, the writer method, the parent-options RPC and the selector component.
- The route-constant names (beside `ContestantAppProfile` in `lib/routes/route.ts`) and the test ids
  (following `tests/tests/utils/testIds.ts`).
- What `set_entity_nominations` returns, and the key names inside each object of `p_nominations`,
  within D-08 and D-19 (the argument is an array of objects — OD08-F3 (a)).
- How K re-runs the entity-level load after the write (NOM-08), within the constraint under
  `<code_context>` § *Integration points*.
- The wording of the new strings and their message-key names; a string that differs by entity type
  gets one key per type, picked through Phase 175's descriptor (175-CONTEXT D-17).
- The control used for the parent selector and its compact card variant, within D-29 and the UI spec.
- Whether plan 1 of D-26 is one plan or split, within one migration regeneration.
- The warning shown before a confirmed nomination is removed (D-11): inline or a dialog.

</decisions>

<factual_baseline>
## Factual baseline (177-0, accepted under D-01)

The discussion's 20 facts, restated as they stand at `f79393703`. **[tree]** marks what was read in
the tree for this file; **[docs]** marks what is taken from the discussion document, a SUMMARY or
another CONTEXT and was not re-read. Anchors are symbols or quoted content, never line numbers.

1. **The database side of an entity user writing its own nominations exists (Phase 162); no frontend
   code calls it.** `entity_insert_nominations`, `entity_update_nominations` and
   `entity_insert_parent_nominations` in `schema/302-rls.sql`; the nominations block of
   `schema/303-column-grants.sql` ("nominations: restrict insertable AND updatable columns").
   **[tree]** The writer has no nomination write method: its methods are the auth calls,
   `_getUserEntities`, `_getEntityUserData`, `_setAnswers` and `_updateEntityProperties`. **[tree]**
2. **An entity user cannot delete a nomination.** `admin_delete_nominations` is the only `FOR DELETE`
   policy on the table. **[tree]**
3. **`election_symbol` is admin-only today.** `enforce_nomination_entity_columns`
   (`schema/011-validation-functions.sql`) raises `insufficient_privilege` unless the caller holds
   `project.edit_nominations` — "Only a holder of project.edit_nominations may set a nomination's
   name, short_name, info, color, image, sort_order, subtype, election_symbol or external_id". The
   column is `election_symbol text` (`schema/104-nominations.sql`). **[tree]**
4. **An edit unconfirms, and a no-op UPDATE does too.** Rule 2 of `enforce_nomination_confirmation`:
   on UPDATE by an `authenticated` caller without `nomination.confirm`, an attempt to turn the flag on
   is refused by name and "any other edit has the flag forced off"; nothing is compared. A project
   editor's edits unconfirm as well. **[tree]**
5. **The lock is `projects.lock_nominations` today, enforced on the two entity write policies and the
   parent policy, and absent from the frontend.** `private.project_nominations_locked`
   (`schema/301-auth-functions.sql`) is `SECURITY DEFINER`, reads the column, and "returns true
   (locked) when the project row is not found"; four call sites in `schema/302-rls.sql`
   (`entity_insert_nominations`, `entity_insert_parent_nominations`, the `USING` and the `WITH CHECK`
   of `entity_update_nominations`). **[tree]** Phase 175 is planned to move it to the app setting
   (175-CONTEXT D-10) — **[docs, not executed]**. `access.answersLocked` is a different, client-side
   lock. **[tree]**
6. **`customData.requestedParentOrganization` is a string on the nomination row.** The column's own
   comment names the key ("marks a candidate waiting for a party that is not in the system, and
   blocks confirmation"); rule 1 of the confirmation trigger refuses to confirm a row that carries it
   and reads it with `->>`. **[tree]** That `27-parent-nomination-queue.test.sql` inserts it as a JSON
   string is **[docs]** (the file exists, `plan (15)`). No match for the key under
   `apps/frontend/src`, `packages/` or `tests/`. **[tree, by grep]**
7. **The parent is a nomination, not an entity.** `parent_nomination_id` references
   `public.nominations` `ON DELETE NO ACTION`; `validate_nomination` requires an organization's parent
   to be an alliance nomination, a candidate's an organization or faction nomination, a faction's the
   nomination of its own organization, and the same election, constituency and round as the parent.
   **[tree]** The data model's `parentNomination` is **[docs]**.
8. **A candidate may create a missing parent party nomination; the write is three statements.** The
   policy's guards 1–5, the cap and the project agreement are as quoted under D-07; the order is
   stated in `private.caller_nominated_in_contest`'s header. **[tree]**
9. **An organization cannot create an alliance's nomination today.** "OrganizationEditor: the entity
   set minus nomination.create_parent (an organization has no parent to create)"; guard 1 is
   `organization_id IS NOT NULL`. **[tree]** D-07 changes both.
10. **The cap of 10 also counts an organization user's own nominations.**
    `private.caller_unconfirmed_originated_count` counts rows with `created_by` the caller,
    `organization_id IS NOT NULL` and `NOT confirmed`; the trigger's cap branch fires for any
    unconfirmed row with `organization_id` set inserted by an `authenticated` caller without
    `project.edit_nominations`, and its message speaks of "unconfirmed parent organization
    nominations". **[tree]** The count is per **user**, so one user editing several organizations
    shares one budget.
11. **An entity editor cannot read the list of the project's parties.**
    `authenticated_select_organizations` has three disjuncts: `project.read_entities`; the public
    assembly (project open, `confirmed`, `private.entity_has_confirmed_nomination`); the caller's own
    entity. **[tree]** That entity editors do not hold `project.read_entities`, and that alliances and
    other entities' nominations follow the same shape, is **[docs]**. `get_entity_basic_data` answers
    for one entity the caller holds `nomination.read` on and lists nothing. **[tree]**
12. **The election type exists only in the database, and nothing reads it.** The enum and the column
    as quoted under D-04; the adapter's comment as quoted under D-03; no match for `election_type`,
    `nominationShape` or `nomination_shape` under `packages/data/src` or `packages/app-shared/src`;
    `validate_nomination` does not read it. **[tree]** `election_type` is among dev-seed's permitted
    keys for `elections` (`packages/dev-seed/src/template/permittedKeys.ts`), and the generated type
    `nomination_shape` in `packages/supabase-types/src/database.ts` lists the three members. **[tree]**
13. **The voter ordering logic lives in four route files, not in the selectors.** As quoted under
    D-15. **[tree]** The legacy contestant pages
    `routes/contestant/preregister/(authenticated)/elections/+page.svelte` and
    `…/constituencies/+page.svelte` use the two components bound to the context's
    `preregistrationElectionIds` / `preregistrationConstituencyIds` (session storage) and none of the
    ordering. **[tree]**
14. **`ConstituencySelector` holds one constituency per election.** As quoted under D-17. **[tree]**
15. **The questions already follow the nominations, reactively.** The contestant context fills
    `#selectedElections` and `#selectedConstituencies` from
    `userData.current.nominations.nominations` in two `$effect`s and feeds them to the question
    rollup in a third, where `const entityType = ENTITY_TYPE.Candidate;` is still hard-coded (Phase
    175 lifts it, planned). **[tree]** That answers live in the entity's `answers` JSONB keyed by
    question id and nothing removes a key is **[docs]**.
16. **The writer's nomination read is narrow.** `_getEntityUserData` selects `'election_id,
    constituency_id, election_round, election_symbol, parent_nomination_id, entity_type, id'` by
    `` `${type}_id` ``, maps five of them, and drops `parent_nomination_id`; it reads neither
    `custom_data` nor `confirmed`. The rows are "intentionally NOT fed to
    DataRoot.provideNominationData — they carry no entity graph". **[tree]**
17. **`perm-startfromcg.spec.ts` and its dataset are voter-only.** Two serial tests; the setting is
    written in `beforeAll` through `client.updateAppSettings` and restored in `afterAll`; the template
    (`packages/dev-seed/src/templates/e2e/perm/perm-startfromcg.ts`) has two `organization_list`
    elections over two constituency groups. **[tree]** That the template seeds no identity able to
    sign in is **[docs]**.
18. **The data model knows two nomination rules.** The "none or both" parent check **[tree]**; a
    faction nomination needs a parent **[docs]**.
19. **A public `SECURITY DEFINER` function executable by `authenticated` trips a census.** The
    assertion in `tests/database/07-rpc-security.test.sql` now reads "the same six plus
    get_entity_basic_data" over the list `contestant_app_public_config, get_entity_basic_data,
    project_open_for_voters, storage_path_can, storage_path_is_public, user_can,
    user_has_account_grant`. **[tree]**
20. **`migrations/` is one generated file**, regenerated in the same commit as every schema edit
    (`yarn assert:schema-migration-parity`); `yarn db:types` follows any signature change. **[docs]**

### Further facts read for this file

- **The entity-level load still signs out an entity with no nomination** —
  `ENTITY/+layout.server.ts`, stage 4, `signOutToLogin(locals, lang, 'candidateNoNomination')` — and
  then reads the questions of the nominated elections (stage 5). Phase 176 removes the branch
  (planned). The load reads the two route params and nothing else, so **it does not rerun when a
  nomination changes**. **[tree]**
- **`reloadEntityData` does not reload nominations** — "This does not reload the `User` or
  `Nomination`s data, they must be included in the data passed to `init`"
  (`lib/contexts/contestant/contestantUserDataState.type.ts`). **[tree]**
- **`Election.round` exists** and is mapped from `current_round`. **[tree]**
- **The token carries the grants and row-level security reads the token** (todo
  `2026-10-06-173-refresh-the-session-after-a-claim.md`). This phase writes no grant, so no session
  refresh is needed for K. **[docs]**
- **`nominations_entity_parent_contest_key`** is unique over the four entity keys, the parent, the
  election, the constituency and the round, `NULLS NOT DISTINCT` — "A different parent makes a
  distinct nomination, such as one presidential candidate nominated by three parties". **[tree]**

### Questions the sources leave open — three ruled, four still open

Seven questions the sources did not decide. The operator ruled on three on 2026-10-08. **Four stay
open by the operator's own ruling (OD08-E12 (a)): this phase's UI spec proposes a rule for each, and
they come back to the operator there. Planning of the screens waits on that round.** None of the
four is to be settled silently, by the UI spec's author or by the planner.

- **Q1 — No admissible election. OPEN → UI spec, then the operator.** An organization in a project
  whose only elections are `candidate_only` (or the reverse) is offered nothing in step 1. What K, J
  and the "Define nomination" task show then is not in any source.
- **Q2 — K opened by URL while locked. RULED: OD08-E13 (a).** A deep link to a K step redirects to J,
  which shows the note (D-13). *Not chosen:* rendering the editor read-only.
- **Q3 — An entity with several nominations in one election. OPEN → UI spec, then the operator.**
  Admin-seeded organizations (D-17), and a candidate nominated by several parties at one contest
  (the uniqueness key allows it). Step 2 can show a card each; what step 1 preselects, and whether
  "the whole desired set" may hold more than one row per election when the user did not create
  them, is not stated.
- **Q4 — Removing the only nomination where the selection step is skipped. OPEN → UI spec, then the
  operator.** With one admissible election and one constituency there is no selector in which to
  deselect the pair (D-11, D-16).
- **Q5 — `elections.disallowSelection` on the contestant side. RULED: OD08-E14 (a).** Not honoured: an
  entity always chooses the elections it stands in (D-15). *Not chosen:* every admissible election
  implied.
- **Q6 — A linked party that is no longer listed. OPEN → UI spec, then the operator.** A party that
  was confirmed when the candidate linked it and is no longer among the options (unconfirmed again,
  or deleted): what the card shows.
- **Q7 — Where the docs state D-17's limitation. RULED: OD08-E15 (a).** The Publishers' Guide. *Not
  chosen:* the Contestant-app user docs.

### Research items — for the planner's researcher (read-only until the stack is free)

- **RQ-1.** The fallout census of D-04: every template and pgTAP fixture row that the shape rule
  would refuse, by file; and, for every seed template that states `organization_list`, whether
  re-typing it to `organization_list_and_independents` causes an issue — a spec that needs the
  required-parent case, an asserted count that moves — so that OD08-E3's NOTE can be applied
  template by template.
- **RQ-2.** Whether `authenticated` holds DELETE on `public.nominations` at the table level, and
  whether `25-matrix-conformance.test.sql`, `29-authenticated-disjunct-order.test.sql` and
  `lint-schema.mjs` need a new policy registered (D-11, D-07).
- **RQ-3.** How a refusal reaches the client through an INVOKER RPC — a policy refusal, a trigger's
  named exception, the cap message, the foreign-key refusal of D-11 — and what the page can tell
  apart (the discussion's last "cannot be defined yet" item).
- **RQ-4.** Whether PostgreSQL's constraint triggers can express the end-of-transaction check of
  OD08-E1 (a) for a `BEFORE` rule that today lives in `validate_nomination`, and what
  `yarn db:lint:sql` (plpgsql_check and the Splinter advisors) says about one. **Measured before the
  write RPC is designed.** A negative finding goes back to the operator.
- **RQ-5.** What Phase 176's RPC and task-state API turned out to be, once 176 is executed.
- **RQ-6.** How the entity-level load is re-run after the write so that the question data, the
  nominations and the task state change together, without breaking the load's "no `url` read"
  tracking test.
- **RQ-8.** **Whether the cap of 10 unconfirmed placeholder parent nominations is really needed**
  (OD08-E4 NOTE). What it protects against today (`private.caller_unconfirmed_originated_count`,
  the trigger's cap branch, the policy's cap conjunct), what the other guards of
  `entity_insert_parent_nominations` already prevent without it, what it costs — it counts per
  user, not per entity, and counts an organization's own nominations (fact 10) — and what removing
  or reshaping it would open. **The research returns a finding to the operator; it changes nothing
  by itself.**
- **RQ-7.** Whether an entity editor of a **closed** project reads the project's elections,
  constituency groups and constituencies in the Contestant app (`authenticated_select_elections`
  admits `project.read_structure`; that the entity roles hold it is **[docs]**).

</factual_baseline>

<expected_tree>
## The tree this phase is planned against

Phases 170–173 are executed. Phase 174 is complete. Phase 174.1 is executed and verified, and closes
after the browser check of its two remaining focus outcomes (operator decision A2 (b) of
2026-10-08). Phases 175 and 176 have not started. The "Inherited from Phase 174 … and 174.1"
subsection below is the 2026-10-07 snapshot, written while those phases were running: what it calls
*running* or *planned* is on the tree now and is re-read there. Anything else below marked *planned*
is read from a CONTEXT, a PLAN, the discussion document or the roadmap and must likewise be re-read
before an anchor is fixed.

### Name map (verified at `f79393703`)

| Thing | Where |
|---|---|
| Entity pages | `routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/` — `+layout.server.ts`, `+layout.svelte`, `+page.svelte` (home), `contestantHome.helpers.ts`, `profile/`, `questions/`, `preview/`, `settings/`. **No `nominations/` route yet** |
| Route constants | `lib/routes/route.ts` — `CONTESTANT_ENTITY`, `ContestantAppEntityHome`, `ContestantAppProfile`, `ContestantAppQuestions`, `ContestantAppPreview`; the legacy `ContestantAppPreregisterElection` / `…Constituency` |
| Contestant context | `lib/contexts/contestant/contestantContext.svelte.ts` (+ `.type.ts`); store in `contestantUserDataState.svelte.ts` (+ `.type.ts`) |
| Writer | `lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts`; base in `lib/api/base/universalDataWriter.ts`; types in `lib/api/base/dataWriter.type.ts` |
| Provider (elections mapping) | `lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts` `_getElectionData` |
| Voter selection | `routes/(voters)/elections/+page.ts`, `+page.svelte`; `routes/(voters)/constituencies/+page.ts`, `+page.svelte`; `lib/routes/impliedParams.ts` |
| Selectors | `lib/components/electionSelector/`, `lib/components/constituencySelector/` |
| Cards | `lib/dynamic-components/entityCard/`, `lib/dynamic-components/entityList/` |
| Election, nominations (model) | `packages/data/src/objects/election/election.ts` (+ `.type.ts`); `packages/data/src/objects/nominations/base/`, `…/variants/` |
| Enum, elections, nominations (schema) | `schema/000-enums.sql` `nomination_shape`; `schema/101-elections.sql`; `schema/104-nominations.sql` |
| Triggers | `schema/011-validation-functions.sql` — `validate_nomination`, `enforce_nomination_confirmation`, `enforce_nomination_entity_columns` |
| Helpers, roles | `schema/301-auth-functions.sql` — `grant_role_permissions`, `project_nominations_locked`, `nomination_exists_in_contest`, `caller_nominated_in_contest`, `caller_unconfirmed_originated_count` |
| Policies, grants | `schema/302-rls.sql` (the `nominations` block); `schema/303-column-grants.sql` |
| Entity RPCs | `schema/503-entity-rpcs.sql` — `get_nominations`, `get_entity_basic_data`, `get_user_entities`, `get_entity_user_data`, `upsert_answers` |
| pgTAP | `tests/database/08-triggers.test.sql`, `23-nominations-write.test.sql` (`plan (51)`), `27-parent-nomination-queue.test.sql`, `25-matrix-conformance.test.sql`, `07-rpc-security.test.sql`, `26-uniqueness-keys.test.sql` |
| E2E | `tests/tests/specs/perm/perm-startfromcg.spec.ts`; `tests/tests/setup/perm/`; `packages/dev-seed/src/templates/e2e/perm/` (`shared.ts`, `perm-startfromcg.ts`); `tests/tests/specs/a11y/contestant-a11y.spec.ts`; `tests/tests/utils/supabaseAdminClient.ts` |

### Inherited from Phase 173 (executed)

- The selected entity is the route parameter pair; `ctx.selectedEntity` names it; `userData.current`
  holds the loaded entity and its raw nominations.
- The writer serves candidates and organizations through `ENTITY_TABLES`; `servedEntityType()` throws
  for an unserved type.
- `EntityCard` with `headerOnly` and `showType`, and `EntityList`, are the reusable card list;
  `showType` reads `common.<type>.singular` for all four types; `provideEntityData` does not reset the
  entity collections; `pageStyles.push` exists (173-13 SUMMARY, § *What Later Phases Must Know*,
  "Phase 177 (selectors)").
- Every load on the entity path reads no `url` property, with a tracking test beside it.
- Test identities: `forceRegisterUser`, `grantEntity`, `revokeEntityGrant`. The base dataset serves
  both entity types; perm setups serve candidates alone; the multi-entity and no-entity sessions are
  read-only and are read before the perm chain.

### Inherited from Phase 174 (executing) and 174.1 (not started)

- **Executed:** `public.invitations`, `create_invitations`, which confirms a named target of any
  entity type (174-02). **Running:** public sign-up off (174-03). **Planned (04–10):** the claim, the
  `account-access` Edge Function, the removal of `invite-candidate`. This phase depends on none of
  them for its behaviour; it regenerates the migration after them.
- 174-02 is the model for a new write path: the authority written inline in one policy per command so
  the linter and the enforcement census read its permission literals; refusals asserted in pgTAP "with
  SQLSTATE and exact message, so a policy refusal, a privilege refusal and a constraint refusal are
  told apart"; a direct table write tested beside the function ("the direct insert is the case that
  isolates an INSERT policy"); the ratified security lists moved only by what the applied schema
  reports, each with its reason.
- 174.1 (planned): the terms-of-use gate fits a phone viewport. K is reached through that gate.

### Expected from Phase 175 (CONTEXT written, not executed; its judgement calls ruled 2026-10-08)

- `access.nominationsLocked` in the settings type, schema and defaults; `projects.lock_nominations`
  removed; `private.project_nominations_locked` reading the setting; `ctx.nominationsLocked` (175 D-10;
  OD08-B1 to B4 (a)).
- The context's question scope follows the selected entity's type (the hard-coded
  `ENTITY_TYPE.Candidate` lifted); a per-type descriptor module for labels and copy keys (175 D-02,
  175 D-17); an entity with no opinion questions is not offered the questions task (175 D-13).
- `entity_type` carried through `bulk_import` on the two question tables (175 D-18), so a dataset can
  address a question to one entity type — this phase's dataset may need it for NOM-08.
- `short_name` frozen on confirmation, on all four entity tables; nothing of that touches nominations.

### Expected from Phase 176 (CONTEXT written 2026-10-07, not executed; its judgement calls ruled 2026-10-08)

Read from `176-CONTEXT.md` as it stands after the operator decisions of 2026-10-08; the planner
re-reads it, and the tree once 176 is executed.

- **The task state** (176 D-02 to D-06): `ctx.tasks` — an ordered list of `{ id, status: 'complete' |
  'incomplete' | 'blocked', route, count? }` — and `ctx.nextStep`, over a pure helper that replaces
  `contestantHome.helpers.ts`. Three tasks: nomination, profile, opinion questions. "Define
  nomination" is complete with at least one nomination, confirmed or not. **`tasks` and `nextStep`
  are the contract this phase's Continue reads.**
- **What is open when** (176 D-03, D-07; operator decision D2 EDIT): the profile and the questions
  depend on a nomination and on nothing else — **the questions are not held back by missing basic
  info**; `nextStep` keeps basic info before the opinion questions; **the preview is closed until
  both are filled**. K's Continue therefore lands on the profile first for a fresh entity.
- **J** at `ENTITY/nominations` with a route constant (176 D-08), fed by **one entity-scoped RPC** that
  returns the entity's own nominations with `confirmed`, `custom_data` and the parent's type and name
  resolved server-side, **and is the app's one nominations read** (176 D-09; operator decision
  D1 (a)); each card shows its confirmation state; **no Edit action** — "Phase 177 adds Edit and the
  unlocked branch". J's no-nomination button reads Return and leads home (176 D-06); D-31 here
  changes it to Continue where the user can add a nomination.
- **One note component** in the contestant component library — a "not editable" note that takes a
  reason and embeds the existing `ContactSupport` block (176 D-12). In 176 it is shown on J for the
  nominations lock alone; this phase widens it to either lock (D-13). K's refusal note reuses it.
- **The NOM-07 gate**: a route group under `ENTITY/` holding profile, questions and preview, whose
  server load redirects to the entity's home (176 D-13, D-14). K and J are outside it.
- **The zero-nomination load**: the `candidateNoNomination` branch removed, the question read skipped
  when there is no nomination (176 D-16) — "NOM-08 needs the question load to re-run when
  nominations change, which 176-E1's branch already keys on".
- **A no-nomination perm template** (176 D-18), separate from this phase's dataset.
- **No place on home for the pending-address reminder**: that is Phase 179's (operator decision
  D11 (a)).

### Handed to later phases by this phase

- **177.1:** `set_entity_nominations`' argument shape — a JSONB array of objects — is the shape of
  `create_invitations`' `p_nominations`, with the same keys (OD08-F3 (a)); 177.1 reuses this phase's
  election-type rules and its create-the-parent's-nomination step, and stays after this phase
  (operator decision F2 (a)). Whether that step exists as one function after this phase, or is
  extracted there, is still open in the roadmap's 177.1 section.
- **178, 179:** every registration flow ends on home and follows `nextStep` — into K when nominations
  can be edited, since a freshly registered entity has none (D-31), and to J otherwise; an
  identity-provider registrant defines nominations in K after registration, which closes the
  "discards nominations" half of `2026-09-21-preregister-route-discards-email-and-nominations.md`.
- **179:** the legacy `preregister/(authenticated)/elections|constituencies` pages, their route
  constants and the context's `preregistration*` members are **left in place here** and deleted there;
  the `@nomination-definition` tag on this phase's tests.
- **Every later E2E dataset:** an election type that says what it allows, enforced on import.
- **Admin app (backlog):** the confirmation queue keys on `requestedParentOrganization`; it now also
  holds organizations that typed an alliance, and placeholder alliance nominations created by
  organizations.

</expected_tree>

<cross_phase>
## Cross-phase Notes and Obligations

- **O-1 — schema seriality.** One regeneration of the single migration file, after Phases 175 and 176.
  Five independent schema changes ride it (D-02, D-04, D-07, D-08 with D-09, D-11).
- **O-2 ← 175.** The accessor's name is `nominationsLocked`; Phase 175 builds it (OD08-B1 (a)).
- **O-3 ← 176.** The task-state API, J's route and RPC, the note component and the gate group are
  read from the tree, not from this file. This phase adds Edit to J, widens J's note to either lock
  (D-13), changes J's no-nomination button and what the nomination task leads to (D-31).
- **O-8 → the operator, through the UI spec.** Q1, Q3, Q4 and Q6 each get a proposed rule in this
  phase's UI spec and come back to the operator (OD08-E12 (a)). The screens are planned after that
  round. RQ-8's finding on the cap of 10 comes back to the operator as well (OD08-E4 NOTE).
- **O-4 → 179.** Nothing of the legacy `preregister` chain is deleted here.
- **O-5 — docs and skills.** `apps/docs` (the Contestant app, election types, and — in the
  Publishers' Guide, OD08-E15 (a) — the one-constituency limitation of D-17), `apps/supabase/README.md`, `.claude/skills/database/schema-reference.md` and
  `rls-policy-map.md` (the fourth election type, the shape rules, the widened parent policy, the
  DELETE policy, the organization role's new permission, the two RPCs), `.claude/skills/data/*`
  (`nominationShape`), and `packages/dev-seed/README.md` if templates must now state a compatible
  election type.
- **O-6 — pending todos that bear on this phase** (`.planning/todos/pending/`):

  | Todo | Bearing |
  |---|---|
  | `2026-08-28-preregister-election-constituency-selection-harmonisation.md` | Closed at this phase's close (D-25); `resolves_phase: 177` |
  | `2026-09-24-data-model-vs-db-nomination-constraints.md` | The nomination part is done here; the todo is re-scoped to the remaining tables (D-24) |
  | `2026-09-21-preregister-route-discards-email-and-nominations.md` | Phase 179; K is what its "nominations" half ends in |
  | `2026-09-15-refactor-candidate-and-entity-registration-flow-and-nominati.md` | Phase 178; "nomination selection to the Phase 162 model" is this phase's share |
  | `2026-05-31-display-nominating-org-in-candidate-profile-nominations.md` | Phase 176 (planned to close it); K's cards show the same parent |
  | `2026-10-06-173-nomination-format-error-logged-in-every-run.md` | Phase 176 owns it; "or the next plan that edits the nomination formatting" — K's cards format nominations too |
  | `2026-10-01-nominations-created-by-readable-by-anon.md` | `created_by` is what the cap counts; this phase makes entity users originate many more rows, so more auth user ids are readable through it |
  | `2026-10-02-app-settings-shallow-merge-and-no-admin-editor.md` | Why every writer of `access` restates the whole root (D-23); no Admin editor sets the lock |
  | `2026-10-06-172-admin-confirm-requires-editor-acceptance.md` | The other rule about confirming; not built here |
  | `2026-08-26-146-select-election-walk-path-nondeterministic.md` | A known nondeterminism in the E2E election-selection helper the new contestant tests may reuse |
  | `2026-05-16-extend-e2e-tests-to-cover-election-and-constituency-scoped-q.md` | Adjacent: NOM-08's E2E needs questions scoped by election or constituency |
  | `2026-08-24-external-id-namespace-collision-con-prefix.md`, `2026-09-18-verify-e2e-runs-and-teardowns-isolated-to-own-project.md` | Constraints on the new template and its teardown |
  | `2026-08-23-bulk-upsert-rpc-interpolates-column-identifiers.md` | `bulk_import` is the admin write path the shape rule now binds |
  | `2026-10-06-173-writer-integration-test-runs-in-no-ci-job.md` | The integration test gains the nomination method's cases and is run in the gate (D-27) |
  | `2026-10-06-173-nav-drawer-does-not-close-on-escape.md`, `2026-10-06-173-no-entity-name-on-answering-pages.md` | Met by any spec that drives the menu or the pages; not fixed here |
  | `2026-08-27-147-answers-locked-warning-unscanned.md`, `2026-08-27-147-prevent-navigation-modal-unscanned.md` | States K shares (locked; leaving with unsaved choices) that no axe scan reaches today |
  | `2026-10-06-native-speaker-review-profile-selection-strings.md`, `2026-10-05-native-speaker-review-contestant-app-names.md` | The precedent for the review todo this phase files |
  | `2026-10-06-172-full-suite-red-on-a-slow-dev-server-start.md`, `2026-10-07-e2e-wrapper-host-suspend-heartbeat.md` | A void run is read from the power log before a red run is believed (D-27) |

- **O-7 — todos this phase files** (ROADMAP § Phase 177, "Todos to file in this phase", plus one):
  1. organization multi-constituency selection, noting that it could be enabled for candidates too
     through a setting (177-C3 NOTE) — and that the cap of 10 must stop counting the caller's own
     entity before it is built;
  2. a check of the whole app for election-round conformity, which has not been tested (177-C5 NOTE);
  3. an election-specific setting for the symbol type (177-D1 NOTE);
  4. the cap of 10 unconfirmed parent nominations counts an organization's own nominations, per user
     (fact 10, R25) — filed in the light of RQ-8's finding on whether the cap is needed at all
     (OD08-E4 NOTE);
  5. the native-speaker review of this phase's constructed strings (operator decision C4 (a): the
     review does not hold the phase).

</cross_phase>

<canonical_refs>
## Canonical References

### The phase's own contract

- `.planning/v2.16-OPERATOR-DECISIONS-2026-10-08.md` § B (B1–B4), § E (E1–E16), F2, F3, and D1, D2,
  D4, D5 and D11 for what Phase 176 hands over.
- `.planning/v2.16-OPERATOR-DECISIONS-2026-10-07.md` § B (B1) and § D (D1, D2).
- `.planning/v2.16-DISCUSSION-POINTS.md` § *Phase 177 — Define Nominations*, § *Cross-phase picture*,
  § *Additional notes* (2, 3), 175-B2 and 175-B5 with their NOTEs, § *Phase 176* (A1–A4, B1–B4, C1,
  D1, E1, F1 and its cross-phase notes), 179's cross-phase note "→ 177".
- `.planning/ROADMAP.md` § *Phase 177* (criterion 1 amended 2026-10-08; "Settled 2026-10-08"),
  § *Phase 176*, § *Phase 177.1*, and the v2.16 hand-over bullets.
- `.planning/REQUIREMENTS.md` — NOM-03, NOM-04, NOM-05, NOM-06, NOM-08, the "Nominations locked"
  definition, E2E-02, E2E-03.
- `CAND-APP-PLAN.md` at the repo root — screens I, J, K and L.

### Upstream phases

- `.planning/phases/175-organization-editing-profile-questions-preview/175-CONTEXT.md` — D-10, J4,
  J5, R6 (ruled 2026-10-08), and the *Handed to later phases* list.
- `.planning/phases/176-contestant-home-task-state-nominations-view/176-CONTEXT.md` — D-02 to D-07,
  D-09, D-12, D-13, D-17; and its SUMMARYs once they exist.
- `.planning/phases/173-multi-entity-grants-entity-selection/` — `173-13-SUMMARY.md` § *What Later
  Phases Must Know*, `173-03-SUMMARY.md` (the integration test), `173-UI-SPEC.md` (the card list),
  `173-NAME-MAP.md`.
- `.planning/phases/174-invitations-grants-defined-in-advance/` — `174-CONTEXT.md` and
  `174-02-SUMMARY.md`, for how a new write path's policies, census and pgTAP are done.
- `.planning/phases/179-identity-provider-registration-coverage-close/179-CONTEXT.md` — D-10 (an
  unconfirmed organization is absent from K's parent list), D-21 (`@nomination-definition`).
- `.planning/phases/162-permissions-auth-model-refactor/162-IMPLEMENTATION-BRIEF.md` § 11.5 — the
  child-nominee parent creation this phase's write path stands on.

### Standing project rules and skills

- `CLAUDE.md` — § *Context Destructuring Rule*, § *Comment Hygiene*, § *E2E Hard Rule*, § *E2E
  preflight*, § *Results Navigation Invariants*.
- `Skill("database")` — `schema-reference.md`, `rls-policy-map.md`, the pgTAP conventions.
- `Skill("data")` — the nomination system, `Election`, smart defaults.
- `Skill("components")` — the runes-era component API, the axe gate, `context-reactivity.md`.
- `.agents/code-review-checklist.md`.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable assets

- **Selectors** — `ElectionSelector` (`elections`, bindable `selected: Array<Id>`, `onChange`) and
  `ConstituencySelector` (`elections`, `useSingleGroup`, bindable `selected` per election, readonly
  `selectionComplete`, `onShadedBg`).
- **Implication helpers** — `getImpliedElectionIds`, `getImpliedConstituencyIds`
  (`lib/routes/impliedParams.ts`), already pure and already shared by the two voter loads.
- **Card list** — `EntityCard` (`action`, `variant`, `headerOnly`, `showType`) and `EntityList`.
- **Inputs** — `Input` with `locked`, `required`, `label`; the per-type symbol label
  `common.electionSymbol.candidate` / `.organization`.
- **Save surface** — `PreventNavigation`, `SuccessMessage`, `ErrorMessage`, `Warning`.
- **Database helpers** — `private.nomination_exists_in_contest`, `private.caller_nominated_in_contest`,
  `private.entity_project_id`, `private.election_project_id`, `private.project_nominations_locked`.
- **pgTAP** — the per-guard negative controls of `23-nominations-write.test.sql`; the hierarchy
  sections of `08-triggers.test.sql`; the census of `07-rpc-security.test.sql`; the matrix rows of
  `25-matrix-conformance.test.sql`.
- **E2E** — `forceRegisterUser`, `grantEntity`; the perm setup and teardown pairs; the
  session-per-table shape of `contestant-a11y.spec.ts`; the phase driver scripts of 173 and 174.

### Established patterns

- A policy states its authority inline and calls a `SECURITY DEFINER` helper in `private` for anything
  that reads the table it guards — "the inline form raises `infinite recursion detected in policy for
  relation "nominations"`".
- A rule about a transition, or one that must tell an entity user from an admin, is a trigger; a
  column grant "cannot tell that caller from an admin".
- A definer function in `public` is an allow-list projection, pinned by census, with `search_path`
  pinned and EXECUTE revoked from `PUBLIC` and `anon`.
- A refusal the user can cause is a named, translated message, not the generic save failure.
- A context accessor is a `$derived` private field with a getter; consumers read `ctx.X` in their
  tracking scope.
- A new contestant surface gets an axe entry in both themes under the session that reaches it, with a
  reach marker.

### Integration points

- `validate_nomination` (the shape rules) and the enum it reads.
- `enforce_nomination_entity_columns` (the symbol), both branches and both messages.
- `entity_insert_parent_nominations` and `grant_role_permissions` (the alliance parent).
- The `nominations` policy block (the new DELETE policy) and the lock helper.
- `schema/503-entity-rpcs.sql` (the two RPCs).
- `Election` and its data type in `@openvaa/data`; `_getElectionData` in the provider.
- `UniversalDataWriter` and `SupabaseDataWriter` (the nomination method).
- The four voter route files and `lib/routes/impliedParams.ts` (the shared ordering module).
- Phase 176's J page, task-state helper and context accessors (Edit, the task's target, Continue).
- **After the write (NOM-08):** the entity-level server load must run again — it supplies both the
  nominations and the question data, it reads only the two route params, and `reloadEntityData` does
  not reload nominations. The context's three `$effect`s then move the question set on their own.
- `packages/dev-seed` — the election generator, the templates' election types, the new perm template.

</code_context>

<specifics>
## Specific Ideas

- **One matrix, asked everywhere.** Which elections are offered, whether a card shows a parent
  selector, whether that selector is required, and what the database refuses are the same four-row
  table. The data package owns the function, the trigger owns the enforcement, and a comparison table
  shows they agree (D-03, D-04, D-24).
- **The user always chooses the parent state for a candidate.** "Independent / no party", "Other" and
  a listed party are three explicit options; an empty selector is never read as independence.
- **Editing costs confirmation, and the user is told before Continue** — on the card (D-22) and, for
  removal, before the pair goes (D-11).
- **The operator's wider direction, recorded for the phases that own it:** organization
  multi-constituency selection, possibly for candidates too through a setting; an election-specific
  symbol type; an election-round conformity check across the app.

</specifics>

<deferred>
## Deferred Ideas

- Several constituencies per election for one entity — 177-C3 (b) and (c), not chosen; a todo (O-7).
- A digits-only or a multilingual symbol — 177-D1 (b) and (c), not chosen; the symbol-type setting is
  a todo.
- Deleting or separately listing answers to questions that no longer apply — 177-B7 (b) and (c), not
  chosen.
- A confirmation dialog on Continue — 177-D3 (b), not chosen.
- Changing the confirmation trigger to compare old and new values — 177-B3 (b), not chosen.
- The whole data-model-versus-database comparison — 177-E2 (b), not chosen; the remaining tables stay
  in the todo.
- Faction users, and factions as a parent option.
- An Admin-app confirmation queue, and an Admin-app control for the nominations lock.
- Deleting the legacy `preregister` selection pages — Phase 179.

### Ambiguities and contradictions found while reconciling

*This list is the record of what was found on 2026-10-07. Every item that ended in a judgement call
is ruled as of 2026-10-08 (see* Judgement calls*): item 5 by OD08-E6 (b), and ROADMAP criterion 1 was
amended to it; item 9 by OD08-E16 (a), three isolated runs; item 13 by OD08-B1 to B3 (a).*

1. **177-B5 (b), the ticked option's own text** — "Two sources then have to agree, and the database
   lock stays authoritative, so the setting can lie" — against the **175-B5 NOTE** — "Let's move it
   to app_settings away from project" — and `REQUIREMENTS.md` — "The lock moves there out of
   `projects.lock_nominations` … the database goes on enforcing it" (R2, J3).
2. **Discussion, § Cross-phase picture → Ordering:** "**One lock:** `projects.lock_nominations`
   (175-B2 ★). 175 introduces the frontend accessor; 177 reuses it for NOM-06" against
   `ROADMAP.md`'s hand-over bullet: "_One nominations lock:_ the app setting
   `access.nominationsLocked`, moved out of `projects.lock_nominations`" (R1).
3. **Discussion, § Phase 177 header and § 177 — Cross-phase notes:** "reads … 175 (the lock accessor
   GEN-03 uses)" and "**→ 175:** GEN-03's 'editable unless nominations are locked' and 177-B5 must
   read the same accessor over `projects.lock_nominations`" against **OD-B1 (a)** and GEN-03 as
   amended 2026-10-07: "the nominations lock affects nominations only" (R3, R4).
4. **177-A3 (b)** — "the database refuses a nomination the election's shape forbids, for every
   writer" — and **177-A4 NOTE** — "'Other' satisfies required parent" — against
   `schema/301-auth-functions.sql`, `private.caller_nominated_in_contest`: "a candidate first creates
   their own nomination with no parent (which `validate_nomination` admits), then the parent, then
   repoints" — and against **177-A5 ★**, which relies on that order (J4).
5. **`ROADMAP.md` § Phase 177, criterion 1** — "The selection step is skipped entirely when there is
   one election with one constituency; otherwise the election choice is offered" — against
   **`REQUIREMENTS.md` NOM-03** — "The election choice is offered whenever there is something to
   choose" — for a project with one admissible election and several constituencies (J9).
6. **`CAND-APP-PLAN.md`, screen K** — "Show the election and/or constituency selectors the same way
   as for voters (except always allow election choice)" — against **177-C2 (b)**, ticked (R27).
7. **`ROADMAP.md`, hand-over bullet** — "_Schema edits are serial._ 171, 172, 173, 174, 175 and 177
   each edit `schema/*.sql`" — against **176-B2 ★ (a)** and **176-H1 ★ (a)** — "One entity-scoped RPC
   returns the selected entity's own nominations …"; "Wave 1: (1) data — the nominations RPC of
   176-B2 … pgTAP and types". Phase 176 edits the schema too; 178-CONTEXT O-5 says the same of 178.
8. **Discussion, § 177 — Cross-phase notes:** "**→ Admin app (backlog):** … with 177-A6(a) it also
   holds organizations asking for an alliance" against **177-A6 (b)**, ticked (R11).
9. **177-F2 ★** — "then one full wrapper E2E run" with no isolated repeats — against **175-G2 ★** and
   **176-H2 ★**, which each add the new spec "three times in isolation". Not a contradiction between
   rulings; captured as written (D-27), and the operator may want the same determinism check here.
10. **`schema/000-enums.sql`** — "The members are exactly the three flows" — and **177-A2**'s
    three-row matrix against the **177-A3 NOTE**: a fourth member, the default (R5, R10).
11. **177-0 fact 19** — "a census pinned to six names … the same five plus get_entity_basic_data" —
    against the tree: "the same six plus get_entity_basic_data" (R21).
12. **177-B3 ★** counts "a moved pair" among edits, implying an UPDATE, against the tree: no rule
    checks a parent nomination against its children when it moves (J11).
13. **175-CONTEXT J4 and J5 were unconfirmed on 2026-10-07**, and this file depended on both. Both are
    ruled since (OD08-B1 (a), B2 (a), B3 (a)): J1 and J2 above.

</deferred>

---

*Phase: 177-define-nominations*
*Context gathered: 2026-10-07 from the filled v2.16 discussion points and the operator decisions of
2026-10-07; Phase 176 read from the discussion document and the roadmap, its CONTEXT not yet written*
*Operator decisions of 2026-10-08 applied 2026-10-08: J1–J14 and Q2, Q5, Q7 ruled; Q1, Q3, Q4 and Q6
sent to the UI spec; D-02, D-04, D-05, D-07 to D-09, D-12, D-13, D-15 to D-18, D-20, D-23, D-26,
D-27 and D-29 changed where a ruling fixed them, D-16 rewritten for E6 (b), D-31 added; the section
on Phase 176 re-read from its CONTEXT*
