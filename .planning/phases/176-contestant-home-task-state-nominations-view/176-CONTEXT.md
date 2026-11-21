# Phase 176: Contestant Home, Task State & Nominations View - Context

**Gathered:** 2026-10-07
**Status:** Ready for planning. **The eleven judgement calls (J1–J11) were ruled by the operator on
2026-10-08 and none is open.** Nine took the reading this file had given. Two did not: **J3 was
replaced by the operator's own EDIT** — the opinion questions are no longer gated on basic info, and
the preview is gated on both being filled — which rewrites D-07 and changes D-02, D-13, D-14 and D-15;
and **J5 carries a NOTE** — J's button is relabelled Return where the user cannot add a nomination.
Both are rewritten in place below. Phase 174 is complete; Phase 174.1 is executed and verified and
closes after one browser check; **Phase 175 is captured as context and not planned** — see
`<expected_tree>`. This phase depends on 175, so everything it reads from 175 is "as planned"; 175's
own judgement calls were ruled the same day, and the lock's move and accessor are 175's (J1). The
planner re-reads the tree before fixing any anchor. Code
facts in this file were read at HEAD `f79393703`; which were verified in the tree and which are taken
from planning documents is stated per fact under `<factual_baseline>`.

**Source of decisions, in order of authority**

0. `.planning/v2.16-OPERATOR-DECISIONS-2026-10-08.md` (committed as `3409f3e3d`; applied to this file
   on 2026-10-08). Its section D rules on this phase's eleven judgement calls, and B1, C5 and C8 on
   what this phase reads from 175. The fill rule: no box ticked means the ★; a NOTE or EDIT beats
   every box. **D1, D3, D5–D11: the ★, (a). D2: no box, and an EDIT that beats both options. D4: (a)
   with a NOTE.** Cited below as **OD08-D2**, **OD08-B1** and so on — the prefix keeps them apart
   from the 2026-10-07 decisions, which use the same ids.
1. `.planning/v2.16-OPERATOR-DECISIONS-2026-10-07.md`. The operator returned it with **no box ticked
   and no note**, so every ★ stands. Two parts bear on this phase: **B1 (a)** — the nominations lock
   affects nominations only, and a name is editable while the entity is unconfirmed; **D1 (a) and
   D2 (a)** — a small Phase 174.1 (the terms-of-use gate at phone width, and focus after accepting)
   runs between 174 and 175. Cited below as **OD-B1, OD-D1, OD-D2**.
2. `.planning/v2.16-DISCUSSION-POINTS.md` § *Phase 176 — Contestant Home, Task State & Nominations
   View* (plus § *Cross-phase picture*, X1–X3, § *Additional notes*, and the cross-phase notes of 172,
   173, 175, 177, 178 and 179) — the shared checkbox document for Phases 170–179. Its rule: an
   unticked decision accepts the `★ RECOMMENDED` option; a ticked box overrules the ★;
   `**EDIT:**`/`**NOTE:**` free text beats every box.

**In Phase 176's own 22 decisions the operator ticked no box and wrote no note** in the discussion
document. Every decision took its ★ option there. **One of them, 176-A6 ★, has since been superseded**
by the operator's EDIT of 2026-10-08 (OD08-D2): the "required info before questions" rule it kept is
dropped (D-07).

Choices and outcomes **outside** this section that change what this phase builds:

1. **OD-B1 (a)** — the nominations lock no longer has anything to do with a name field. The "not
   editable" note this phase builds takes its reason per place it is used (D-12, J7).
2. **175-B5 → (b) + NOTE, and 177-B5 → (b), both ticked** — "nominations locked" is the app setting
   `access.nominationsLocked`, not `projects.lock_nominations`. ROADMAP criterion 2 and NOM-02 were
   amended to it on 2026-10-05. **Phase 175 builds the move and the frontend accessor** (OD08-B1 (a));
   this phase reads `ctx.nominationsLocked`.
3. **Phase 173's outcome (executed; verified with one human item that is Phase 175's scope)** — the
   selected entity is a route parameter, so every page of this phase sits under
   `[entityType=servedEntityType]/[entityId=uuid]/`; the gates are an ordered list decided on
   user-level data; the `candidateNoNomination` sign-out is stage 4 of the entity-level load and
   nowhere else; `ContactSupport`, `SUPPORT_ANCHOR` and the Help page's support section exist;
   `LogoutButton` logs out at once when no entity is loaded; a resolver route serves entity pages
   named without an entity. It changes this section's baseline facts 1, 4, 5, 7, 8, 10, 11, 12, 13,
   15, 18 and 19, and resolves two of its "cannot be defined yet" items.
4. **Phases 170 and 172 (executed)** — every app-level name is `contestant…`; the terms-of-use gate is
   a view in the gate list, not a `layoutState` branch.
5. **OD-D1 (a), OD-D2 (a)** — Phase 174.1 repairs the terms-of-use gate at phone width and moves focus
   to the page that replaces the gate. **This phase's home and nominations view sit behind that gate.**
6. **X1 → ★ (a), X3 → ★ (a), untouched** — the E2E base dataset serves both entity types since Phase
   173, and `REQUIREMENTS.md` and `ROADMAP.md` carry the amended wording. This file cites the amended
   text.
7. **177-B6 ★ (planned; Phase 177 has no context yet)** — the nomination editor K is not editable when
   *either* lock is on. In this phase the note follows the nominations lock alone, and 177 widens it
   (OD08-D5 (a); D-17).

Every decision takes its ★ option as written, except where the ★ assumed something a later ruling or
an executed phase has changed. Those places are rewritten **and flagged inline as "reconciled with
<id / phase>"**. The full list is under *Reconciliations* at the end of `<decisions>`.

<domain>
## Phase Boundary

The home screen tells the user of the selected entity what is left to do, starting with its
nomination; an entity with no nomination is a normal state and not an error; and one shared state
decides where every Continue leads. Requirements **NOM-01**, **NOM-02**, **NOM-07** and **TASK-01**,
plus **E2E-03** as closing criterion. Depends on Phase 175, so that the home screen and the task state
are built once, for both entity types. **The roadmap gives this phase a UI hint** — it adds a screen
(J) and reshapes the home.

It delivers:

- **the task state**: an ordered `tasks` list and a `nextStep`, two reactive accessors on the
  contestant context over a pure helper — three tasks for both entity types: nomination, profile,
  opinion questions;
- **the home screen (I)** rendered from that list, with "Define nomination" first;
- **an entity with no nomination loads**: the `candidateNoNomination` sign-out is removed, the
  question read is skipped for it, and the two dead error keys leave the map, the type and the seven
  catalogues;
- **the nominations view (J)** as its own page at `…/nominations`, showing each nomination's election,
  constituency, parent, election symbol and confirmation state, read through one entity-scoped RPC —
  and the nominations block removed from the profile page;
- **the reusable "not editable" note**, which directs the user to support, on J and in place of the
  four inline answers-locked warnings;
- **the NOM-07 gate**: the profile, the questions and the preview redirect to home on the server
  while the entity has no nomination; **the preview also stays closed until both the basic info and
  the opinion questions are filled**; and **the existing "required info before questions" rule is
  dropped** — the questions open as soon as a nomination exists (OD08-D2, the operator's EDIT);
- **every Continue and the logout button** reading the one state;
- **the E2E coverage**: a no-nomination dataset with a candidate user and an organization user, a
  spec over it, four new axe entries in both themes, and the journey spec adjusted.

**Not in this phase:** the nomination editor K, J's Edit action and the unlocked "you can edit"
branch (Phase 177 — J renders no Edit here); the questions following a changed nomination (NOM-08,
Phase 177); any registration flow (Phases 178, 179) and the pending-address reminder on home (Phase
179); the organization's pages themselves (Phase 175); an Admin-app screen to confirm a nomination or
to set the lock; the terms-of-use gate's phone-width defects (Phase 174.1); faction and alliance
users.

### Roadmap success criteria (ROADMAP.md § Phase 176, criterion 2 as amended 2026-10-05, criteria 3 and 4 as amended 2026-10-08)

1. A user whose entity has no nomination reaches the home screen (I) without an error and sees "Define
   nomination" as the first task, marked incomplete; once the entity has a nomination the task shows
   as complete, and the remaining tasks follow it as before (NOM-01).
2. The entity's nominations are shown in a dedicated nominations view (J) and no longer on the profile
   page; when they cannot be edited — nominations are locked (`access.nominationsLocked`) — the view
   shows a reusable note directing the user to support (NOM-02).
3. While the entity has no nomination, the profile, the questions and the preview cannot be reached —
   neither from the home screen nor by entering their URL. The profile and the questions become
   available as soon as a nomination exists, and the questions do not wait for the profile's basic
   info; the preview becomes available once, in addition, both the basic info and the opinion
   questions are filled (NOM-07).
4. Every Continue button leads to the entity's next incomplete task — basic info before the opinion
   questions — and the home screen's task list and the Continue targets never disagree, because both
   read one derived state in the contestant context (TASK-01). "Every Continue" is the five buttons
   that choose a target: the home screen's main action, the profile's save, the questions list's
   start/continue, the question page's save and the nominations view's own; the nominations view's
   button is labelled Return where the user cannot add a nomination.
5. The full E2E suite is green at close (E2E-03).

**Roadmap planning note:** the "Define nomination" task's Edit action opens the editor that Phase 177
delivers; in this phase the task leads to the nominations view, which renders no Edit action yet
(176-B4). Later phases route their own Continue buttons through the same state.

**"Nominations locked"** (`REQUIREMENTS.md`, definition above NOM-01, amended 2026-10-05) means the app
setting `access.nominationsLocked`, which sits beside `access.answersLocked`; the lock moves there out
of `projects.lock_nominations`, and the database goes on enforcing it. It is cited by NOM-02, NOM-06
and the criteria of this phase and of 177 — and, since OD-B1, by no name field.

### Standing rules (ROADMAP.md § v2.16, inherited by every phase)

- **Cardinal rule:** no failing E2E test, no exemptions, no "known flaky"; a "did not run" counts as a
  failure. E2E-03 is a closing criterion of this phase.
- **Localisation:** every user-facing string ships in all seven locales (`da, en, et, fi, fr, lb, sv`).
- **Accessibility:** every new or changed screen meets WCAG 2.1 AA and is reached by the axe scan, in
  the light and the dark theme (D-19).
- **Both entity types:** a criterion that says "user" or "entity" holds for candidates and for
  organizations unless it names one.
- **Nothing is deployed:** the schema, the routes and the symbols change in place; no compatibility
  shim, no redirect for an old URL, no migration of stored data.
- **Schema edits are serial.** This phase adds an RPC (D-09) and so regenerates the single migration
  file, **after Phase 175**. The roadmap's own list of schema-editing phases omits 176 (see
  *Ambiguities*, item 1).
- **Comment hygiene** (`CLAUDE.md`): no historical narrative, no planning references, nothing
  addressed to a reviewer, in any comment under `apps/`, `packages/` or `tests/`. The home page, its
  helper and the profile page carry comments this phase rewrites or deletes with the code.
- **Context reactivity** (`CLAUDE.md` § *Context Destructuring Rule*): the new `tasks` and `nextStep`
  are reactive accessors, as are `nominationsLocked`, `answersLocked`, `selectedEntity`,
  `opinionQuestions`, `unansweredRequiredInfoQuestions`, `profileComplete`, `appSettings` and
  `dataRoot` — read `ctx.X` inside the tracking scope, never destructure; never bind `dataRoot` to a
  read alias.

</domain>

<decisions>
## Implementation Decisions

Decision ids map onto the discussion document's Phase 176 ids, given in parentheses. 22 discussion
decisions → **D-01..D-22**, one each. Where a decision is security-relevant, **If wrong** states what
a defect or an attacker could do if it were implemented otherwise; the planner carries every such line
into the plan's threat model.

Names are those on the tree after Phases 170–173. Frontend paths are relative to `apps/frontend/src/`
unless they start with `apps/`; `schema/` and `tests/database/` are relative to
`apps/supabase/supabase/`. `ENTITY/` abbreviates
`routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/`.

### 0 — Factual baseline

- **D-01 (176-0.1):** Accept all 19 facts of 176-0 as the baseline; restated under
  `<factual_baseline>` **with the corrections Phases 170, 172 and 173 made to facts 1, 4, 5, 7, 8, 10,
  11, 12, 13, 15, 18 and 19, and the re-reading the lock's move gives fact 14**. The facts are a
  2026-10-04 snapshot at `df0cec944`; the planner re-reads the tree.

### A — The task state (TASK-01)

- **D-02 (176-A1) ⚠:** **One derived state: an ordered `tasks` list — each entry
  `{ id, status: 'complete' | 'incomplete' | 'blocked', route, count? }` — plus a `nextStep` naming
  the task and the route to go to.** The home screen renders the list and every Continue reads
  `nextStep`, so the two cannot disagree (criterion 4). `blocked` expresses "not reachable yet" — for
  a task that is: no nomination (NOM-07), and nothing else (D-07). The same state also answers
  whether the **preview** is open (D-03, D-13). No general step machine,
  and no second list kept by the home page.
- **D-03 (176-A2) ⚠:** **Three tasks for both entity types — nomination, profile, opinion questions —
  in that order. Preview is a destination shown on home, never a task with a status. A task with
  nothing in it (an entity with no opinion questions) is omitted.** Each task has a completion rule
  the data can answer; preview has none. **The order is the canonical order of `nextStep` — basic
  info before the opinion questions — and it is an order of suggestion, not of access:** the
  questions task is not `blocked` while the profile is incomplete (OD08-D2).
  **What the preview needs (OD08-D2: "gate preview on both filled"):** a nomination, no unanswered
  required info question and no unanswered opinion question. Until then it is closed — shown,
  disabled, on home and in the menu (D-15), and redirected on the server (D-13). How the state
  exposes "the preview is open" — a third accessor, a field beside `tasks`, or a function of them —
  is the planner's; it is one rule in the pure helper, read by home, the menu and the gate. The per-type difference reduces to labels and to which tasks
  have content.
  **Planner constraints:**
  - **"Blocked" comes before "omitted".** An entity with no nomination has no questions loaded (D-16),
    so "no opinion questions" is true of it for a different reason. 176-E1 ★ says which wins: the
    task state marks the profile and the questions `blocked` on "no nomination", not on "no
    questions". The omission rule applies only once the entity has a nomination. *Reconciled with
    175-C1 / 175-CONTEXT D-13 (as planned):* 175 hides the questions button and navigation item for a
    loaded entity with no opinion questions; this phase's state must not let that rule hide them for
    an entity that merely has no nomination yet (D-15 shows them, disabled).
  - "No opinion questions" must be a fact about a **loaded** entity (175-CONTEXT D-13's constraint):
    before the entity and its question data are in the store the lists are empty, and the task list
    must not flash a shorter shape.
  - **The profile task's completion rule is Phase 175's** (175-CONTEXT D-14, ruled by OD08-C5 (a)):
    no required info question unanswered and — for an organization whose name is still editable —
    a name in the project's default locale. A confirmed organization whose name lacks a
    default-locale entry is not incomplete for it.
  - **The name clause closes nothing** (OD08-D7 (a)): the preview's rule above counts required info
    questions and opinion questions, not the name. *Inferred, not the operator's words:* OD08-D2
    says "both filled" and OD08-D7 (a) says a missing default-language name blocks neither the
    questions nor the preview; read together, "basic info filled" for the preview's purpose means
    the required info questions are answered. An unconfirmed organization with no default-locale
    name therefore has an incomplete profile task and an open preview once its questions are done.
  - *Also inferred:* for an entity with no opinion questions (the task is omitted) the opinion half
    of "both filled" holds vacuously, so the preview opens on the required info alone.
  - Labels differ by entity type where a sentence differs; they come through the per-type descriptor
    Phase 175 plans (175-CONTEXT D-02, D-17), with one message key per type.
- **D-04 (176-A3):** **"Define nomination" is complete when the entity has at least one nomination,
  confirmed or not.** It is NOM-01's wording ("incomplete while the entity has no nomination"), and
  the only rule under which a self-registered user can go on to the profile and the questions before
  an admin acts. A nomination a user defines is unconfirmed by privilege: `confirmed` is absent from
  the INSERT column grant on `nominations` and defaults to `false`.
  **Planner constraint:** "has a nomination" is one predicate, shared by the task state, the gate
  (D-13) and the load's question-read branch (D-16). Today's test in the entity-level load is "at
  least one election id **and** at least one constituency id"; both columns are `NOT NULL` on
  `public.nominations`, so "at least one row" is the same fact.
- **D-05 (176-A4):** **Two accessors on the contestant context, `tasks` and `nextStep`, computed by a
  pure helper module that replaces `contestantHome.helpers.ts` and keeps a colocated unit test.**
  TASK-01 says "in the contestant context"; the pure helper keeps the table-driven test the current
  helpers have.
  *Reconciled with Phase 170:* the file is `ENTITY/contestantHome.helpers.ts` (`computeNextAction`,
  `computeBadges`) with `contestantHome.helpers.test.ts` beside it.
  **Planner constraints:**
  - The accessors are `$derived` private fields with getters, declared on `ContestantContext`
    (`lib/contexts/contestant/contestantContext.type.ts`), read as `ctx.tasks` / `ctx.nextStep` and
    never destructured.
  - **The helper keeps the current module's caller contract:** it receives already-read values, never
    the context object, and imports nothing that pulls in a component or the data model — which is
    also what lets a server load import it (D-13). The existing module's header states both rules.
  - The helper moves out of the route directory: the context, the gate's server load and the pages
    all import it, and a context does not import from `routes/`. Where it lives is discretion.
  - The home page's copy (title, explanation, tip, the three button texts) is in `computeNextAction`
    today. Whether the wording stays a home-page concern over the task state or moves into it is the
    planner's; the *target* (`href`) and the *statuses* come from the state alone.
  - An absent array and an empty array select different cases in today's helpers, on purpose (the
    module's doc: "NOT collapsed to zero"). The new helper states its rule for "not loaded yet" once.
- **D-06 (176-A5) ⚠:** **`nextStep` is the first incomplete task. When that task is the questions, its
  route is the first unanswered question, keeping today's resume-at-first-unanswered behaviour. When
  the task just saved is still incomplete, or when everything is complete, Continue goes home; on
  home, with everything complete, the primary action is Preview.** It reproduces what each Continue
  site does today from one rule, so the candidate journey spec needs no behavioural change.
  **Planner constraints:**
  - **The question page's `getNextQuestionId` rule is a documented landmine and must survive.** Its
    doc comment: `findIndex` returning -1 is the normal state after a save, and the -1 fall-through
    "makes 'Save & continue' resume at the FIRST unanswered question … Do not 'fix' -1 to return
    undefined: that reroutes every save to the questions list." Whatever the shared state exposes for
    "the next unanswered question" keeps that behaviour, including when an already-answered question
    is re-edited.
  - The sites, from the tree: home (`computeNextAction().href`); the profile page's `submitRouting`
    (questions when required info is filled, opinions are outstanding and answers are unlocked;
    otherwise the entity home); the questions list (`contestant-questions-start`,
    `contestant-questions-continue` → the first unanswered question); the question page's
    `submitRouting` (next unanswered question; the entity home when it was the last unanswered;
    otherwise the questions list). Labels (`common.saveAndContinue`, `common.continue`,
    `common.saveAndReturn`, `common.return`) follow the target as they do today.
  - **"Every Continue" is those four sites plus J's own** (OD08-D3 (a)). **Not** the terms-of-use
    gate's Continue: it is a gate view shown before any entity is read, passing it is not a
    navigation, and `nextStep` is a fact about one entity. **Not** the Return buttons of the preview
    (`returnButtonCallback`), the settings page and Help, which keep going to the entity's home.
  - **J's own button** (OD08-D4 (a) + NOTE "Relabel to Return if user cannot add nominations."): with
    nominations, J renders a Continue that reads `nextStep`. With none, the button is shown and
    leads to the entity's home — the rule above, "the task … is still incomplete … Continue goes
    home" — and **it is labelled Return (`common.return`), not Continue, because the user cannot add
    a nomination**. *Inferred:* in this phase no user can add a nomination (the editor arrives with
    Phase 177), so the no-nomination state of J always shows Return here; from Phase 177 on it shows
    Return only where nominations cannot be edited. The NOTE sits on the no-nomination case and is
    applied to that case only.
  - **The targets do not change with OD08-D2; what is reachable does.** `nextStep` still names the
    profile before the questions, so each site's target is what it is today. What changes is that a
    user may open the questions with required info missing. Any spec or fixture that asserts the
    questions entry disabled, or the redirect to the profile, while required info is missing changes
    with the rule; the planner finds them by search.
- **D-07 (176-A6 ★, superseded by OD08-D2 — the operator's EDIT):** **The opinion questions are no
  longer gated on basic info: they do not depend on it. The profile and the questions both depend on
  a nomination, and on nothing else. The canonical order of the next step stays basic info first.
  The preview is gated on both being filled.** The operator's words: *"No longer gate opinion
  questions on basic info as they don't depend on it. Both do, however, depend on nominations. Still
  keep the canonical order for next step at basic info first, and gate preview on both filled."*
  *What the ★ said, and is not built:* "the 'required info before questions' rule is kept, expressed
  as the questions task being `blocked` … and enforced with the same gate mechanism as NOM-07". No
  such block exists after this phase — not in the state, not on the server, not on the client.
  *From the tree — what is removed:* `ENTITY/questions/+layout.svelte` holds the client redirect
  (`$effect(() => { if (ctx.unansweredRequiredInfoQuestions.length) goto(…'ContestantAppProfile') })`);
  the home page and `ContestantNav` disable the questions entry on
  `unansweredRequiredInfoQuestions?.length !== 0`, and home disables Preview on the same test.
  **After this phase:** the redirect is deleted and not replaced; the questions entry is disabled
  only while the entity has no nomination; the preview entry is disabled until D-03's rule holds.
  **The todo `2026-05-13-allow-incomplete-profile-save-gate-opinion-questions.md`:** its "allow an
  incomplete profile save" half is on the tree already (`let canSubmit = $derived(status !==
  'loading')`). Its "gate opinion questions" half is what the EDIT withdraws. *Inferred:* the todo
  is closed at this phase's close with that stated — the gate was ruled out, not built.
  **How the gates that remain are enforced** — no nomination, for all three pages; and the preview
  needing both filled — is D-13. *This part is the orchestrator's inference, not the operator's
  words:* the EDIT names no mechanism, so the ★ of OD08-D2, option (a), applies as far as it still
  makes sense — the remaining gates are server redirects, and research measures the freshness
  problem before the plan is fixed (RQ-1).

### B — The nominations view (J)

- **D-08 (176-B1):** **J is its own page inside the protected group, at `…/nominations`, with a route
  constant beside the profile's.** NOM-02 calls it a dedicated view; it needs a URL for the task link
  and the axe scan; Phase 177's editor sits beside it (`…/nominations/(edit)/…`, 177-C4 as planned).
  *Reconciled with Phase 173 (173-B1 ★):* the path is `ENTITY/nominations/`, and the constant is built
  from `CONTESTANT_ENTITY` in `lib/routes/route.ts`, as `ContestantAppProfile` is.
  **Planner constraints:**
  - **J sits outside the NOM-07 gate** (D-13): it is where a user with no nomination is sent.
  - **The entity-less form of the URL.** `routes/contestant/(protected)/[...page=contestantEntityPage]/`
    resolves `/contestant/profile` and its siblings to the same page under the user's one entity. Its
    matcher (`params/contestantEntityPage.ts`, `SINGLE_SEGMENT_PAGES`) says of itself that its
    accept-set is "exactly the entity sub-paths the app has", and the resolver's
    `SINGLE_SEGMENT_ROUTES` map mirrors it. A new entity sub-path is added to both, with their tests,
    or the matcher's own statement stops being true.
  - A new load under `ENTITY/` reads no `url` property (173 obligation O-4; a read-recording
    `layout.tracking.test.ts` sits beside each existing load).
  - `ContestantNav` gains a nominations item (176-H1 plan 4), shown where the other entity items are —
    inside `{#if contestantCtx.selectedEntity}`.
- **D-09 (176-B2) ⚠:** **One entity-scoped RPC returns the selected entity's own nominations with
  `confirmed`, `custom_data` and the parent's entity type and name resolved server-side; J renders
  from that raw data without feeding the data root.** It serves both entity types, the parent name is
  resolved where the row is readable, and it keeps the entity layout's deliberate "no nomination
  graph" shape. It closes `2026-05-31-display-nominating-org-in-candidate-profile-nominations.md`,
  including its state field.
  *From the tree:* the writer's read is
  `.select('election_id, constituency_id, election_round, election_symbol, parent_nomination_id, entity_type, id')`
  on `nominations`, filtered `.eq(`${type}_id`, entityRow.id)` inside `_getEntityUserData`; it selects
  `parent_nomination_id` and drops it, and selects neither `confirmed` nor `custom_data`.
  *Reconciled with Phase 173:* the read already serves both served types — the `candidate_id`-only
  filter of fact 8 is gone. What is still missing is the parent, the state and `custom_data`.
  **Planner constraints:**
  - **The parent hop needs more than the caller's own row-level security.**
    `authenticated_select_nominations` admits a row on three grounds — `project.read_entities`, the
    public-visibility assembly, or `nomination.read` on the row's own entity — and the child-nominee
    hop runs parent → child. A child candidate therefore reads an unconfirmed parent's nomination and
    entity row on no ground. The precedent for returning a row the caller's own policy refuses is
    `public.get_entity_basic_data` (`schema/503-entity-rpcs.sql`): `SECURITY DEFINER`, `search_path`
    pinned, one `user_can` gate, an **allow-list** projection, and `NULL` — never a raise — for "not
    yours" and "does not exist" alike. RQ-2 measures what a child can read today.
  - **The parent projection is an allow-list**: the parent's entity type and its localized name (and
    short name if the card shows it) — nothing else of the parent, and nothing of any other entity.
  - **The gate is the caller's own authority over the entity named**, asked through the matrix and not
    re-derived; an entity the caller does not edit returns nothing, with the same answer whether it
    exists or not. The entity is named by type **and** id (the entity tables have independent primary
    keys).
  - It returns `custom_data` so that J can show the free text of
    `customData.requestedParentOrganization` once Phase 177 writes it (NOM-05). `created_by` is not
    returned (`2026-10-01-nominations-created-by-readable-by-anon.md`).
  - pgTAP covers: own nominations confirmed and unconfirmed; a parent the caller cannot read, resolved
    to its name; an entity the caller does not edit; both entity types; the anonymous role refused.
    `07-rpc-security.test.sql` holds a census of functions and gains the new one.
  - `packages/supabase-types` is regenerated (`yarn db:types`); the function's return nullability is
    declared through the project's one override mechanism if it returns a table.
  - **This RPC becomes the app's one nominations read** (OD08-D1 (a)): `_getEntityUserData` with
    `loadNominations: true` calls it, the entity-level load reads it once, the store holds the richer
    rows, and the task state, the gate, the question scope and J all read that one list. The type of
    the stored nominations (`DPDataType['nominations']`, `ContestantUserData<TNominations>`) changes
    everywhere it is used. The narrow table select is removed, not kept beside it.
  - The election and constituency names on a card are resolved on the data root today
    (`contestantCtx.dataRoot.getElection(…)`), which holds them "via question data". Whether the RPC
    resolves them too is the planner's. **The `Error formatting nomination` log line is diagnosed
    before the code that logs it is deleted** (OD08-D9 (a)): the plan names the identity and the page
    that produce it (three times per full run, the missing child an election), so that J, which
    resolves the same election names, does not inherit the cause unseen; the todo
    `2026-10-06-173-nomination-format-error-logged-in-every-run.md` closes with that finding (RQ-4).
  **If wrong** (the parent resolved by a second client query): the query returns nothing for a parent
  the caller cannot read, so the card silently shows no party. (A definer function with a `to_jsonb`
  projection or no gate): any signed-in user reads any entity's unconfirmed nominations, or a parent's
  unpublished columns.
- **D-10 (176-B3):** **Each card shows its state, "Pending confirmation" or "Confirmed", with one line
  explaining that a pending nomination is not yet visible to voters.** After Phase 177 a user's own
  nominations start unconfirmed and lose confirmation on edit (NOM-06); without the state they cannot
  tell why they are absent from the voter app.
  *From the tree:* the profile block renders a `common.state` field whose value is always
  `common.confirmed` in practice — `parseNomination` hard-codes `unconfirmed: false` and sets it
  `true` only in its `catch`. `common.pending` ("Pending") and `common.confirmed` exist.
- **D-11 (176-B4):** **J renders no Edit action in this phase. With nominations it shows the cards;
  with none it shows an empty state saying no nomination is defined yet, with the support link. Phase
  177 adds Edit and the unlocked branch.** Nothing ships that leads nowhere, and no registration flow
  can create a nomination-less user before Phase 178, so the gap is not reachable in practice.
  **Planner constraint:** no disabled Edit button and no placeholder route for K. The hook 177 needs
  is the page and the state, not markup.

### C — The reusable note

- **D-12 (176-C1) — rewritten in part; its reach ruled by OD08-D6 (a).** **A "not editable" note in the contestant component
  library (`lib/contestant/components/`) that takes a reason and embeds the support block. It replaces
  the four inline answers-locked warnings and is used on J.**
  *Reconciled with the Phase 173 outcome — the support block is not built here:* the ★ names "two
  small components", the first being "a support link block that points at the help page's new
  `#support` anchor". **That block exists**: `ContactSupport`
  (`lib/contestant/components/contactSupport`; `action: 'help' | 'email'`, default `'help'`, `variant`
  default `'prominent'`, an optional lead-in as `children`), `SUPPORT_ANCHOR` (`'support'`), and the
  Help page already renders `<ContactSupport action="email" id={SUPPORT_ANCHOR} …/>`. This phase
  builds **one** component, the note, over it. Phase 178's context has already reconciled the same
  way (178-CONTEXT D-14, R8).
  *Reconciled with OD-B1:* the ★ also uses the note "on the profile's immutable section". That section
  is locked because the entity is **confirmed**, not because nominations are locked, and Phase 175 as
  planned writes its own sentence there. **The note is not used on that section** (OD08-D6 (a)):
  175's sentence stands. If 175 has shipped the sentence when this phase is planned, the planner may
  render it through the note component with a third reason, as a refactor with no change of wording.
  *From the tree:* `contestantApp.common.editingNotAllowed` is rendered in a `<Warning>` on
  `ENTITY/+page.svelte`, `ENTITY/profile/+page.svelte`, `ENTITY/questions/+page.svelte` and
  `ENTITY/questions/[questionId]/+page.svelte` (which also assigns it to `errorMessage` in
  `setAnswer`). No link accompanies any of them.
  **Planner constraints:**
  - Three of the four warnings (home, profile, questions list) append
    `contestantApp.common.isHiddenBecauseMissing` under a condition of their own; the note keeps that
    second sentence expressible (a snippet or a prop).
  - `data-testid="contestant-answers-locked-warning"` is on the home, profile and question-page
    warnings (the questions list's has none) and is read by
    `tests/tests/specs/perm/perm-answers-locked.spec.ts`, `contestant-a11y.spec.ts` and
    `tests/tests/utils/testIds.ts`. The id keeps its meaning, or the three readers move with it.
  - Component conventions are the library's (`Skill("components")`): props from a co-located
    `.type.ts`, runes, snippets, `concatClass`, a unit test beside the component.
  - The note's reasons are message keys, one per reason, in seven locales — not an interpolated noun.

### D — The NOM-07 gate

- **D-13 (176-D1) ⚠:** **A route group inside the protected group holds the three pages — profile,
  questions, preview — and its server load redirects (307) when the task state's inputs say the page
  is closed: no nomination, for all three; and, for the preview alone, a required info question or
  an opinion question still unanswered (D-03, D-07). The questions are not closed on missing
  required info. The predicate is the same pure helper the context uses.**
  *Rewritten for OD08-D2:* the ★ had "required info missing for the questions and the preview". The
  operator's EDIT removes the questions from that clause and widens the preview's to "both filled".
  That both remaining gates are **server** redirects is the orchestrator's inference from option (a)
  of OD08-D2, not the operator's words (D-07). The redirect happens before any page
  renders, a deep link and a link click take the same path, and the server and the client decide from
  one function.
  *Reconciled with Phase 173 (173-B1 ★):* the group sits **under `ENTITY/`**, below the entity-level
  load (`ENTITY/+layout.server.ts`), whose data it reads. The "cannot be defined yet" item on how the
  selected entity reaches the gate's load is resolved: two route params.
  *Reconciled with Phases 172 and 173 — this is not a member of the gate list:* `CONTESTANT_GATES`
  (`lib/contestant/gates/gates.ts`) holds gates "decided on user-level data only", evaluated before
  any entity is read. The nomination gate needs the entity's data, so it is a per-page redirect below
  the entity, exactly as the roadmap's order has it: F → email → G → H → home → the per-page
  nomination gate. `ContestantGateId` does not grow here.
  **Planner constraints:**
  - A route group adds no URL segment, so `ContestantAppProfile`, `ContestantAppQuestions`,
    `ContestantAppQuestion` and `ContestantAppPreview` keep their paths; their **route ids** in
    `lib/routes/route.ts` gain the group's segment, and anything that matches on a route id
    (`isProtectedRoute`, the request hook's table, tests that name a route id) is re-read.
  - The entity-level load returns `{}` while a user-level gate is pending and redirects to the app
    root for an entity the user is not listed with. The group's load awaits its parent and must do
    nothing in the first case — a gated user is shown the gate at the URL they asked for.
  - **Freshness — measured before the plan is fixed (RQ-1).** The entity-level load reads
    `entityType` and `entityId` and nothing else, so it does not rerun on a navigation between the
    pages of one entity, and the store saves answers without invalidating any load. A gate that
    decides on its parent's data alone decides on the data of the entity's last load. *Nominations*
    change, in this phase, only by an admin's hand, so "as soon as a nomination exists" is read as
    "at the entity's next load", and Phase 177's write is what must invalidate it. *The preview's
    half is the hard one:* its inputs change when the user saves an answer in the browser, and the
    click that follows the last save may be the one that opens the preview — a gate reading stale
    parent data would refuse it. And "a required info question or an opinion question is
    unanswered" is computed today only in the context, from the data root's question rollup; no
    server code computes it. The planner must (a) make the gate's inputs fresh on the navigation
    that follows a save, and (b) give the server the same pure predicate with inputs it can
    compute. If RQ-1 finds that the preview's half cannot be made right on the server, that is
    brought back to the operator: it is not silently turned into a client-side redirect.
  - The group's load reads no `url` property (D-08's constraint), and has a read-recording test.
  - `settings` stays outside the group: NOM-07 names the profile, the questions and the preview.
  **If wrong** (a client-side `$effect` redirect): the page mounts and may render before the redirect,
  so the URL is reached, briefly, which criterion 3 forbids, and a View Transition can start on a page
  that is leaving. (A gate decided on something the client supplies): the three pages open for an
  entity with no nomination by editing a request.
- **D-14 (176-D2):** **A blocked URL sends the user to the entity's home.** Home shows the task list,
  which says what is missing and offers the way there; it is where every other refusal in the app
  lands. Not to J: the same gate also closes the preview while the basic info or the opinion
  questions are unfilled (D-13), where J is the wrong place.
  *Reconciled with Phase 173:* "home" is `ContestantAppEntityHome` for the entity in the URL, not the
  app root (`ContestantAppHome`), which is where an entity the user may not edit is sent.
- **D-15 (176-D3):** **The blocked entries are shown, disabled, on home and in the navigation menu.**
  The user sees what will open up, and the menu keeps one shape as the user progresses.
  *After OD08-D2:* the profile and the questions entries are disabled while the entity has no
  nomination and for no other reason — the questions entry is **no longer** disabled while required
  info is missing, which is the treatment it has on the tree today. The preview entry is disabled
  while the entity has no nomination or while either half of "both filled" is missing (D-03).
  **Planner constraint:** a disabled entry says why it is disabled to assistive technology as well as
  visually (WCAG 2.1 AA); the axe entry for home in the no-nomination state (D-19) scans it.

### E — Loading an entity with no nomination

- **D-16 (176-E1):** **When the entity has no nomination the entity-level load skips the question read
  and returns empty question data; the context then has no questions, and the task state marks the
  profile and the questions `blocked` on "no nomination", not on "no questions".** It matches NOM-07
  (those pages are unreachable anyway) and NOM-08 (the questions asked follow the nominations).
  *Reconciled with Phase 173:* the branch is **stage 4 of `ENTITY/+layout.server.ts`** —
  `if (!electionId.length || !constituencyId.length) return await signOutToLogin(locals, lang, 'candidateNoNomination');`
  — "the one place that requires a nomination: the entity read itself does not". This phase removes
  it. Stage 5 must not then run as written: `dataProvider.getQuestionData({ electionId, … })` with an
  empty array reaches `convertFilterValue`, which throws "an empty filter array requests nothing and
  cannot be answered; pass `undefined` to omit the filter instead".
  **Removed with the branch** (176-0 fact 19, as it stands after 173): `candidateNoNomination` and
  `nominationNoElection` from `CONTESTANT_LOGIN_ERROR` and `ContestantLoginError`
  (`lib/contestant/utils/loginError.ts`, which then holds `loginFailed` alone), and
  `contestantApp.error.candidateNoNomination` / `.nominationNoElection` from the seven catalogues.
  `nominationNoElection` is raised nowhere today.
  **Planner constraints:**
  - The entity layout (`ENTITY/+layout.svelte`) already accepts empty question data
    (`isValidResult(data.questionData, { allowEmpty: true })`) and an empty nominations list; it is
    re-read for anything that treats "no elections on the data root" as an error.
  - Tests that pin the old behaviour change with it: `ENTITY/layout.server.test.ts` (its case "An
    entity with no nomination is signed out with `candidateNoNomination`", and "reads no questions"
    stays true for a different reason); `lib/server/contestant/signOutToLogin.test.ts` (its `it.each`
    over `['loginFailed'], ['candidateNoNomination']`); the name-gate fixture
    `scripts/fixtures/assert-no-candidate-app-names.input.ts` (line `n21` holds both dead names as
    string literals — it is a fixture of names, not a reader of the map; re-read, not necessarily
    changed).
  - Three docs pages state the sign-out as current behaviour and are corrected:
    `apps/docs/src/routes/(content)/developers-guide/contestant-app/entity-selection/+page.md`,
    `…/login-and-password-reset/+page.md` and `…/pre-registration-and-invitation/+page.md` ("The
    candidate cannot use the Contestant App until they are nominated…").
  - The load's own docblock lists its five stages; it is rewritten to say what the load does now, with
    no account of what it used to do (comment hygiene).
  **If wrong** (every question in the project loaded unfiltered for a nomination-less entity): the
  user is asked questions that may not apply once a nomination exists, which NOM-08 rules out.

### F — Locks

- **D-17 (176-F1) ⚠:** **An entity with no nomination while nominations are locked: the task stays
  incomplete, leads to J, and J shows the "not editable" note with the support link. The other pages
  stay closed.** It is the requirements read together — the nomination policies refuse the insert, and
  NOM-07 keeps the rest closed — and the only way out for that user really is the admin. After Phase
  177 the same branch covers "locked" for users who have nominations.
  *Reconciled with 175-B5 (b) + NOTE and 177-B5 (b):* "locked" is `ctx.nominationsLocked`, derived
  from `appSettings.access.nominationsLocked`, **which is on no tree yet** (no match for
  `nominationsLocked` under `apps/`, `packages/` or `tests/`). **Phase 175 builds it** (OD08-B1 (a));
  this phase reads the accessor.
  **The four states of J in this phase**, from D-11, D-17 and criterion 2:

  | Nominations | Lock | J shows |
  |---|---|---|
  | some | off | the cards; no Edit, no note |
  | some | on | the cards and the "not editable" note |
  | none | off | the empty state with the support link (D-11) |
  | none | on | the "not editable" note with the support link (this decision) |

  **The note on J follows `nominationsLocked` alone in this phase** (OD08-D5 (a)).
  `access.answersLocked` does not bring it up; Phase 177, which adds editing, widens the condition
  to "either lock" and words the second reason.

### G — Verification

- **D-18 (176-G1):** **A new perm-style template with its own dataset: a candidate user and an
  organization user with no nomination. The spec asserts home (first task incomplete, the rest
  blocked), J's empty state, the three URLs redirecting, then inserts a nomination through the admin
  client and asserts that the pages open and the task is complete.** Isolated from the parallel
  chains, covering both entity types, and proving criterion 3's "become available as soon as a
  nomination exists".
  *Reconciled with the tree — "its own project" is its own dataset:* a perm setup seeds its template
  into the suite's **one** project (`setupFromTemplate` writes through `resolveE2eProjectId()`), in
  the serial perm chain, with its own external-id prefix and its own setup and teardown project pair.
  The preflight's served-project assertion (`CLAUDE.md` § *E2E preflight*) allows no second project on
  one dev server.
  *Reconciled with X1 (a) and the Phase 173 outcome:* perm setups serve candidates alone
  (`packages/dev-seed/src/templates/e2e/perm/shared.ts`: `entityTypes: ['candidate']`), so this
  template restates the whole `contestantApp` root with `organization` served. Both users are created
  with `forceRegisterUser(email, password, { entityGrants })`
  (`tests/tests/utils/supabaseAdminClient.ts`), which uses no public sign-up — closed since 174-03.
  **Planner constraints:**
  - **The spec also asserts the order OD08-D2 sets:** with a nomination and required info missing,
    the questions open (no redirect, the entry enabled) and the preview does not; with both filled,
    the preview opens.
  - **"As soon as a nomination exists" is observed after the entity's load runs again** (D-13): the
    spec's step after the admin insert is a navigation that reruns that load, and the assertion says
    so.
  - The nomination the spec inserts goes in with the service role, which the nominations lock does not
    bind; the row must satisfy `validate_nomination` for its election type and entity type as it
    stands when this phase runs (Phase 177 changes those rules later).
  - The organization half needs Phase 175's pages to exist; its "the pages open" assertion is the
    first time an organization passes from "no nomination" to the profile.
  - A reader of the read-only multi-entity and no-entity sessions runs before the perm chain (173-13
    SUMMARY). External ids keep clear of the generators' synthetic namespaces
    (`2026-08-24-external-id-namespace-collision-con-prefix.md`).
  - The fixtures change with the screens: `contestantHomePage.fixture.ts` `expectTasks` (three
    buttons today), `contestantProfilePage.fixture.ts` `expectStaticInfo` (its `nomination` half reads
    `testIds.contestant.profile.nominations`, `nomination-constituency`,
    `nomination-election-symbol`), a new nominations-page fixture, and `tests/tests/utils/testIds.ts`.
  - `contestant-journey.spec.ts` asserts "three tasks" in steps 6 and 11 and the nominations block on
    the profile in step 12 (election symbol `999`); those steps move to the new list and to J.
- **D-19 (176-G2; widened by OD08-D8 (a)):** **Four axe entries are added, each in both themes: J with
  nominations (lock off), J's empty state (no nomination, lock off), J in its "not editable" state
  (no nomination, lock on), and home in the no-nomination state. The existing home and profile
  entries stay.** Every new screen state is scanned, as the standing rule asks. One dataset cannot
  hold both lock states at once, so **the spec flips the lock through the admin client between
  them**, restating the whole `access` root each time.
  *Reconciled with 175-B5 (b):* the template sets the lock as `access.nominationsLocked`, restating
  the whole `access` root — a stored root replaces the shipped root whole
  (`2026-10-02-app-settings-shallow-merge-and-no-admin-editor.md`).
  *From the tree:* the spec is `tests/tests/specs/a11y/contestant-a11y.spec.ts`, one table of entries
  per stored session, each entry with a reach marker; the phase verdict's
  `--except contestant-a11y-scan=<n>` holds the scan count (22 after Phase 173; Phase 175 as planned
  adds its own) and moves with the new entries.
- **D-20 (176-G3):** **The savedAnswers-empty logout-modal todo is folded in narrowly: the logout
  button's "anything left?" test reads the task state; the todo is closed when the journey spec's
  final-logout step passes in the closing gate's three isolated runs. No separate investigation.** It
  removes the sixth private completeness rule, and the todo's own regression step is the proof.
  *Reconciled with Phase 173:* `triggerLogout` in
  `lib/contestant/components/logoutButton/LogoutButton.svelte` now opens the modal only when
  `userData.savedEntityData` is set, answers are unlocked and either unanswered list is non-empty — a
  user with no entity loaded is logged out at once (173 O-10). That first guard survives the rewiring:
  the button is rendered on pages whose URL names no entity (`NothingToEdit`).
  *From the tree:* the step is "22. final logout: no dialog → /contestant/login" in
  `tests/tests/specs/contestant/contestant-journey.spec.ts`.
  **Planner constraint:** a user whose only incomplete task is a nomination they cannot define here
  (no Edit until Phase 177; or locked) — does the modal warn them? The modal's two texts count info
  and opinion questions. The planner states the rule; the journey step's expectation does not change.

### H — Plan shape and closing gate

- **D-21 (176-H1) ⚠:** **Five plans in three waves.** Wave 1: (1) data — the nominations RPC of D-09,
  the zero-nomination load, removal of the error branch and its two dead keys, pgTAP and types; (2)
  the task state — helper, context accessors, unit tests. Wave 2: (3) home, every Continue and the
  logout button rewired to the state; (4) J, the note component, the block removed from the profile,
  the navigation item, the gate group. Wave 3: (5) template, spec, fixtures, axe entries, seven
  locales checked, closing gate. The read and the state are independent and both precede the screens;
  the rewiring and J touch different files; E2E runs once on the finished phase.
  *Reconciled with D-12:* plan 4 builds one note component, not two.
  *Reconciled with D-07, D-08 and D-13:* plan 4 also carries the resolver's two lists (D-08), the
  removal of the questions layout's client redirect (D-07) and the route ids that gain the group's
  segment (D-13). Plans 3 and 4 both edit `ENTITY/profile/+page.svelte` (its `submitRouting` in plan
  3, its nominations block in plan 4) and the home page — "touch different files" no longer holds as
  written, so the planner orders those two edits or moves one.
  *Reconciled with OD08-D2:* plan 2's helper carries the preview's rule (D-03) and no required-info
  block on the questions; plan 4 deletes the questions layout's client redirect without replacing
  it, and the gate group's load carries the preview's half (D-13).
  *The lock's move and its accessor are not in this phase's plans* — they are Phase 175's
  (OD08-B1 (a)).
  The planner may split a plan that grows past one verifiable unit, but keeps the wave order and one
  migration regeneration.
- **D-22 (176-H2):** **Closing gate: unit, type, lint and production build; pgTAP and
  `yarn db:lint:sql`; one full E2E run through `tests/scripts/e2e-run.sh`; the new no-nomination spec
  and the candidate journey spec three times each in isolation.** The journey spec is where a wrong
  Continue target shows, so it earns the determinism check together with the new spec; exit statuses
  are read directly, never through a pipe.
  *Reconciled with the Phase 173 and 174 practice:* the phase carries its own driver scripts in the
  phase directory (`173-gates.sh`, `173-e2e.sh`, `173-verdict.mjs` are the pattern), records the power
  state for every run (a host suspend voids a run — operator decision C5 (a);
  `2026-10-07-e2e-wrapper-host-suspend-heartbeat.md`), and runs the writer integration test against
  the running stack if D-09 changes the writer
  (`2026-10-06-173-writer-integration-test-runs-in-no-ci-job.md`). The E2E driver refuses a dirty
  tree, so a negative control goes through `tests/scripts/e2e-run.sh` directly.

### Reconciliations

| # | What the discussion's ★ (or text) said | What is built instead | Reconciled with |
|---|---|---|---|
| R1 | Every path and symbol under `candidate…` (`candidateHome.helpers.ts`, `CandidateNav`, `candidateApp.*`, `candidate-profile-nominations`, `candidate-journey.spec.ts`) | The `contestant…` names (`<expected_tree>` name map) | Phase 170 |
| R2 | Fact 1: the protected layout's server load calls `handleError('candidateNoNomination')` | Stage 4 of the **entity-level** load, through `signOutToLogin`; that is the branch removed (D-16) | Phase 173 (O-6) |
| R3 | 176-D1 ★: "a route group inside the protected group"; "cannot be defined yet": how the selected entity reaches the gate | The group sits under `ENTITY/`; the entity is two route params (D-13) | 173-B1 ★ |
| R4 | "Cannot be defined yet": where the nomination gate sits relative to F, G and H (`layoutState` or redirects) | G is an entry of `CONTESTANT_GATES` decided on user-level data; H is the app root; the nomination gate is a per-page redirect below the entity and not a member of the list (D-13) | Phases 172, 173 |
| R5 | 176-C1 ★: two components, the first a support link block pointing at "the help page's new `#support` anchor"; fact 13: neither exists | `ContactSupport`, `SUPPORT_ANCHOR` and the Help page's support section exist; one component, the note, is built (D-12) | Phase 173 (173-09, 173-10) |
| R6 | 176-C1 ★: the note is used "on the profile's immutable section" | That section is locked by `confirmed`, and Phase 175's own sentence stands there; the note is not used on it (D-12) | OD-B1 (a); 175-CONTEXT D-05, D-17; OD08-D6 (a) |
| R7 | Fact 14, 176-F1, cross-phase picture: the lock is `projects.lock_nominations` | The lock is the app setting `access.nominationsLocked` (D-17, D-19) | 175-B5 (b) + NOTE; 177-B5 (b); `REQUIREMENTS.md` |
| R8 | Fact 14, cross-phase note: "175-B5 adds a `nominationsLocked` accessor; this phase reads it" | Confirmed: Phase 175 builds the move and the accessor; this phase reads it (D-17) | 175-CONTEXT D-10; OD08-B1 (a) |
| R9 | Fact 8: the nominations query "filters `.eq('candidate_id', …)`, so it is candidate-only" | The filter is on `<type>_id` and serves both served types; the parent, the state and `custom_data` are what is missing (D-09) | Phase 173 (173-03) |
| R10 | Fact 15: the logout button opens the modal "when answers are unlocked and either unanswered count is non-zero" | It also requires a loaded entity (`userData.savedEntityData`); that guard is kept (D-20) | Phase 173 (O-10) |
| R11 | Fact 5: five Continue sites, the fifth being "the terms-of-use Continue flips `layoutState`" | The gate is a view decided before any entity is read; it is not routed through `nextStep` (J4) | Phases 172, 173 |
| R12 | Fact 10: "the protected layout does not call `provideNominationData`" | The same deliberate omission, now in `ENTITY/+layout.svelte` (D-09) | Phase 173 |
| R13 | Fact 19: the two dead keys beside `userNoCandidate` and the rest | The map holds three codes today and `loginFailed` alone after this phase (D-16) | Phase 173 (173-10) |
| R14 | 176-G1 ★: "a new perm-style template with its own project" | Its own dataset on the suite's one project, in the perm chain (D-18) | the tree (`setupFromTemplate`); `CLAUDE.md` § *E2E preflight* |
| R15 | 176-G1 ★: "a candidate user and an organization user" on a perm setup | Perm setups serve candidates alone; the template restates the `contestantApp` root; users through `forceRegisterUser` (D-18) | X1 (a); Phases 173, 174-03 |
| R16 | 176-A2 ★ and 175-C1 ★: a task, button or navigation item with no questions is omitted | Only for an entity that has a nomination; without one the entries are shown, disabled (D-03, D-15) | 176-E1 ★, 176-D3 ★ read together |
| R17 | 176-D2 ★: a blocked URL goes "to home" | To the entity's home, `ContestantAppEntityHome`, not the app root (D-14) | Phase 173 |
| R18 | 176-H1 ★ plan 4: "the two note components"; "the rewiring and J touch different files" | One component; plans 3 and 4 share the profile and home pages (D-21) | R5; the tree |
| R19 | ROADMAP hand-over: "171, 172, 173, 174, 175 and 177 each edit `schema/*.sql`" | 176 adds an RPC and regenerates the migration too (D-09, D-21) | 176-B2 ★; ROADMAP § Phase 176 "fed by one entity-scoped RPC" |
| R20 | Cross-phase note: "it assumes the terms-of-use gate still precedes every protected page" | Holds; and Phase 174.1 runs first, so the gate in front of home is the repaired one | Phase 172; OD-D1 (a), OD-D2 (a) |
| R21 | Cross-phase note: "switching entity re-runs the protected load" | Holds: both protected loads read the two entity params; neither reruns between the pages of one entity (D-13, J3) | Phase 173 (O-4) |
| R22 | 176-B1 ★: a new page with "a route constant beside the profile's" | Also an entry in the entity-less resolver's matcher and route map (D-08) | Phase 173 (173-08) |
| R23 | 176-A6 ★: "the 'required info before questions' rule is kept", as a `blocked` questions task behind the NOM-07 mechanism | The rule is dropped: the questions depend on a nomination only; the order of `nextStep` stays basic info first; the preview is gated on both filled (D-03, D-07) | OD08-D2, the operator's EDIT |
| R24 | 176-D1 ★: the gate redirects on "required info missing for questions and preview" | No such clause for the questions; for the preview the clause is "a required info question or an opinion question unanswered" (D-13) | OD08-D2; OD08-D7 (a) |
| R25 | 176-G2 ★: three axe entries, the template seeded locked | Four entries; the spec flips the lock between them (D-19) | OD08-D8 (a) |
| R26 | `CAND-APP-PLAN.md` J: "Continue ⇒ go to next step" | With no nomination the button leads home and is labelled Return where the user cannot add one (D-06) | OD08-D4 (a) + NOTE |

### Judgement calls — all ruled 2026-10-08

Each was something this file had to interpret rather than read off a source. The operator ruled on all
eleven in `.planning/v2.16-OPERATOR-DECISIONS-2026-10-08.md`. **None is open.** Nine rulings are the
reading this file had given; J3 and J5 are not, and the decisions above are rewritten for them. This
list records each ruling and what was not chosen, so that nobody re-opens it.

- **J1 — Who builds the lock's move and the `nominationsLocked` accessor (D-17, D-19, D-21). RULED:
  OD08-B1 (a).** Phase 175 moves the lock out of `projects.lock_nominations` into
  `access.nominationsLocked`, re-points `private.project_nominations_locked` and adds the accessor;
  this phase only **reads** `ctx.nominationsLocked`. Also ruled, and changing nothing this phase
  renders: project editors may lock and unlock nominations (OD08-B2 (a)); a missing project is
  locked, a missing settings row or key is unlocked (OD08-B3 (a)); there is one lock, the column is
  removed (OD08-B4 (a)). *Not chosen:* the move coming to this phase.
- **J2 — One nominations read or two (D-09). RULED: OD08-D1 (a).** The new RPC **becomes** the app's one
  nominations read. *Not chosen:* J calling the function itself while the narrow table select stays.
- **J3 — How the gates are enforced (D-07, D-13, D-18). RULED: OD08-D2 — no box ticked, and an EDIT
  that beats both options:** *"No longer gate opinion questions on basic info as they don't depend
  on it. Both do, however, depend on nominations. Still keep the canonical order for next step at
  basic info first, and gate preview on both filled."* The question this judgement call asked — how
  to enforce "required info before the questions" — no longer arises: that rule is dropped (D-07).
  *What survives the EDIT is a mechanism question the operator did not answer:* how the remaining
  gates (no nomination; the preview needing both filled) are enforced. **The orchestrator's
  inference, not the operator's words:** option (a), the ★, applies as far as it still makes sense
  — both are server redirects, and research measures the freshness problem before the plan is fixed
  (D-13, RQ-1). *Not built:* the server redirect for "required info missing" on the questions
  (option (a) as written), and the client-side redirect for it (option (b)).
- **J4 — Which buttons are "every Continue" (D-06). RULED: OD08-D3 (a).** The four sites that choose a
  target today — home's main action, the profile's save, the questions list's start/continue, the
  question page's save — plus J's own. Not the terms-of-use Continue; not the Return buttons of the
  preview, settings and help. *Not chosen:* every Continue or Return button under an entity.
- **J5 — J's own Continue with no nomination (D-06, D-11). RULED: OD08-D4 (a), with the NOTE "Relabel
  to Return if user cannot add nominations."** The button is shown and leads to the entity's home;
  where the user cannot add a nomination it is labelled Return. In this phase that is every
  no-nomination state of J (inferred — see D-06). *Not chosen:* no button at all.
- **J6 — Does `access.answersLocked` bring up the note on J (D-17)? RULED: OD08-D5 (a).** No: in this
  phase the note follows `nominationsLocked` alone; Phase 177 widens it. *Not chosen:* building
  "either lock" now.
- **J7 — The note and the profile's immutable section (D-12). RULED: OD08-D6 (a).** The note is used on
  J and in place of the four answers-locked warnings, and **not** on the profile's immutable
  section, where Phase 175's sentence stands. *Not chosen:* the ★ of 176-C1 to the letter.
- **J8 — The profile task's completion rule, and what a missing name closes (D-03). RULED: OD08-C5 (a)
  and OD08-D7 (a).** The profile task is complete when no required info question is unanswered and —
  for an organization whose name is still editable — the name has a default-locale entry. A missing
  default-language name closes neither the questions nor the preview. *Read together with OD08-D2:*
  nothing but a nomination closes the questions, and the preview's "both filled" counts required
  info questions and opinion questions (D-03; the reading is inferred and marked there). *Not
  chosen:* the name clause applying always; the name blocking the questions and the preview.
- **J9 — States to scan beyond 176-G2's three (D-18, D-19). RULED: OD08-D8 (a).** Four, each in both
  themes; the spec flips the lock through the admin client between them. *Not chosen:* exactly
  three, with the dataset seeded locked and the unlocked empty state never scanned.
- **J10 — The `Error formatting nomination` log line (D-09). RULED: OD08-D9 (a).** Its cause is found
  before the code that logs it is deleted, and the todo closes with the finding. *Not chosen:*
  letting it disappear with the code.
- **J11 — An entity-name cue on the answering pages. RULED: OD08-D10 (a).** Not built; the todo
  `2026-10-06-173-no-entity-name-on-answering-pages.md` stays open. Home goes on naming the entity
  only while something is left to do. *Not chosen:* home naming the entity in every state.

**Also ruled for this phase, outside the eleven: OD08-D11 (a).** The place on home for the "your email
address is not confirmed yet" reminder is left to Phase 179. This phase builds no slot for it and
scans none; 179 edits the home screen this phase builds.

### Claude's Discretion

- The helper module's name and location, the exact types of a task and of `nextStep`, and whether the
  home's copy is produced by the helper or by the page (D-05).
- The route group's name; the route key for J (expected `ContestantAppNominations`); new test ids
  following `tests/tests/utils/testIds.ts`. Existing ids keep their meaning:
  `contestant-home-profile`, `contestant-home-questions`, `contestant-home-preview`,
  `contestant-home-continue`, `contestant-home-status`, `contestant-nav-*`.
  `contestant-profile-nominations` is retired with the block.
- The RPC's name, whether it returns `jsonb` or a table, and its exact projection within D-09.
- The note component's name and props, within D-12; the wording of every new string and the
  message-key names; whether a card on J is built from `InputGroup` and locked `Input`s (as the
  profile block is) or from something else — the UI spec's.
- How a disabled task says why it is disabled (D-15).
- Whether `profileComplete` stays an accessor beside the task state (it drives the success message
  and the hero emoji today) or is derived from it.
- Removing the widened `page.params` annotation while in the context, if Phase 175 has not
  (`2026-10-06-173-widened-page-params-annotation-in-contestant-context.md`).

</decisions>

<factual_baseline>
## Factual baseline (176-0, accepted under D-01)

The discussion's 19 facts, restated as they stand at `f79393703`. **[tree]** marks what was read in the
tree for this file; **[docs]** marks what is taken from the discussion document or a SUMMARY and was
not re-read. Anchors are symbols or quoted content, never line numbers.

1. **Exactly one place makes "no nomination" an error, and it signs the user out.** Stage 4 of
   `ENTITY/+layout.server.ts`:
   `if (!electionId.length || !constituencyId.length) return await signOutToLogin(locals, lang, 'candidateNoNomination');`.
   The load's docblock: "This is the one place that requires a nomination: the entity read itself does
   not." **[tree]** Nothing in the user-data RPC, the context or `@openvaa/data` raises for it —
   **[docs]** (173 O-6 says the same of the read).
2. **Removing that branch alone makes the load throw.** Stage 5 calls
   `dataProvider.getQuestionData({ electionId, locale: lang })`, and `convertFilterValue`
   (`lib/api/adapters/supabase/utils/convertFilterValue.ts`) throws on an empty array. **[tree]**
3. **With no nomination the context yields no elections and no constituencies.** The first two
   `$effect`s of `ContestantContextProvider` build `#selectedElections` and `#selectedConstituencies`
   from `current.nominations.nominations`; `match` (`packages/data/src/utils/filter.ts`) returns
   `true` for an empty filter and `false` for a non-empty filter against an empty target. **[tree]**
4. **There is no task list as data.** `ENTITY/+page.svelte` renders three hard-coded buttons
   (`contestant-home-profile`, `-questions`, `-preview`) and one primary `contestant-home-continue`.
   `computeNextAction` picks one of three cases — profile complete → preview; required info done and
   opinions outstanding → questions; otherwise → profile — and `computeBadges` returns two counts.
   Both are pure, import nothing, and have `contestantHome.helpers.test.ts` beside them. The page
   greets a candidate by first name and an organization by its name. **[tree]**
5. **Each Continue site computes its own target.** As listed under D-06. **[tree]** The preview
   returns to the entity home (`returnButtonCallback`); the settings page links to Help and to the
   entity home. **[tree, by grep]** The terms-of-use Continue is `TermsOfUseGate.svelte`, a gate view;
   its handler was not read. **[docs]**
6. **The question page's next-question rule has a documented landmine.** `getNextQuestionId` in
   `ENTITY/questions/[questionId]/+page.svelte`, as quoted under D-06. **[tree]**
7. **The nominations block is on the profile page**: a `<section>` with
   `data-testid="contestant-profile-nominations"`, rendering each nomination as locked `Input`s
   (constituency, list, symbol, state) under the title `contestantApp.basicInfo.nominations.title`
   and the description `…nominations.description` ("These are the constituencies where you're
   nominated. If the election list or election symbol are missing, they will be automatically added
   later when candidate lists are confirmed."). **[tree]** The E2E profile fixture and `testIds.ts`
   address it. **[tree, by grep]**
8. **The block cannot show the parent or the confirmation state.** `parseNomination` returns
   `organization: undefined` and `unconfirmed: false`, and `{ unconfirmed: true }` from its `catch`,
   which logs `Error formatting nomination`. The writer's select and its `<type>_id` filter are as
   quoted under D-09. The symbol's label is `common.electionSymbol.candidate` for both types.
   **[tree]**
9. **A user can read its own nominations, confirmed or not, but not always its parent's.**
   `authenticated_select_nominations` has the three disjuncts quoted under D-09. **[tree]** That the
   child-nominee hop (`private.is_child_nominee`) runs parent → child only, so a child reads a parent
   through the public disjunct alone, is **[docs]** — consistent with the policy's own comment ("an
   organization reading its child candidate's nomination is admitted by user_can's child-nominee
   branch") and not measured (RQ-2).
10. **The entity's nominations are deliberately kept out of the data root.** `ENTITY/+layout.svelte`:
    "`provideNominationData` is not called: the entity's own nominations are raw partial data on
    `userData`, with no entity graph for the data root to match them to, so it would throw."
    `packages/data/src/root/dataRoot.ts` holds the message "No matching entity found for nomination."
    **[tree]**
11. **No per-route data gate exists.** (i) The request hook gates on session only — **[docs]**. (ii)
    The user-level load (`routes/contestant/(protected)/+layout.server.ts`) redirects 307 without a
    session and returns `{ gate, user }` for a gated user; the entity-level load redirects 307 to the
    app root for an entity the user is not listed with. (iii) The questions layout redirects on the
    client with `$effect` + `goto`. **[tree]**
12. **The navigation menu lists the entity's pages as hard-coded items** in
    `lib/dynamic-components/navigation/contestant/ContestantNav.svelte`: home, then — only where the
    URL names an entity the user edits — profile, questions (`disabled` while
    `unansweredRequiredInfoQuestions?.length !== 0`, with a count badge), preview, settings, and a
    switch item for a user with several entities. **[tree]**
13. *(Corrected, 173 — half of the fact is no longer true.)* **The support block exists; the note
    does not.** `ContactSupport` and `SUPPORT_ANCHOR` as described under D-12; `NothingToEdit` and the
    Help page render the block. **[tree]** The "editing is no longer possible" text is still an inline
    `<Warning>` on four pages, with no link. **[tree]**
14. **"Nominations locked" is not readable in the frontend today**, and is still a column:
    `lock_nominations boolean NOT NULL DEFAULT false` in `schema/100-tenancy.sql`, read by
    `private.project_nominations_locked` (which answers `true` for a missing project), called four
    times in `schema/302-rls.sql`. No match for `nominationsLocked` under `apps/`, `packages/` or
    `tests/`. **[tree]** The move to `access.nominationsLocked` is planned (175-CONTEXT D-10).
15. **The logout button has its own completeness rule** — `triggerLogout`, as described under D-20.
    **[tree]**
16. **The savedAnswers todo describes a symptom the suite no longer shows**; its step is step 22 of
    `contestant-journey.spec.ts`. The step's title is **[tree]**; that it has never been reproduced
    since is **[docs]**.
17. **No E2E identity lacks a nomination** — **[docs]**; `perm-missing-nominations` is a voter-side
    topology **[docs]**. The journey spec asserts "three tasks" in steps 6 and 11 and the nomination
    block in step 12. **[tree, by grep]**
18. *(Corrected, 172 and 173.)* **The gates are a list, and H is a route.** `CONTESTANT_GATES` holds
    `termsOfUse` alone; `firstNeededGate(user)` is asked in stage 3 of the user-level load; the
    protected layout renders `GATE_VIEWS[data.gate]` in place of the page; the app root
    (`routes/contestant/(protected)/+page.server.ts`) returns `{ view: 'nothingToEdit' }`, redirects
    to the one entity's home, or returns `{ view: 'select' }`. **[tree]** Phase 178 prepends F — as
    planned.
19. **Two dead strings sit beside the one this phase retires.** `CONTESTANT_LOGIN_ERROR` holds
    `candidateNoNomination`, `loginFailed` and `nominationNoElection`; `nominationNoElection` is
    raised nowhere (matches: the map, the type, the generated key type, the seven catalogues and one
    name-gate fixture line). **[tree]**

### Cannot be defined yet — as the filled document and the executed phases resolve it

- **How the selected entity reaches the gate group's server load and the nominations RPC** — resolved
  by 173: two route params; J and the gate group sit under `ENTITY/`.
- **Where the nomination gate sits relative to F, G and H** — resolved by 172 and 173 (R4).
- **The exact route constant and message namespace names** — resolved by 170: `ContestantApp…` route
  keys, `contestantApp.*` messages.
- **J's Edit action, the unlocked branch and what "editable" tests** — still Phase 177; this phase
  leaves the page and the state (D-11).
- **Whether the parent on a card can be the free text of `customData.requestedParentOrganization`** —
  still Phase 177 (NOM-05); the RPC returns `custom_data` so that J can show it once it exists.
- **New, from the reconciliation — both settled 2026-10-08:** the profile task's rule (D-03;
  OD08-C5 (a)) and who builds the lock accessor (Phase 175; OD08-B1 (a)).

### Research items — for the planner's researcher (read-only until the stack is free)

- **RQ-1.** For the gate (D-13): what a server load under `ENTITY/` can know about the preview's rule
  — "a required info question or an opinion question is unanswered" — which inputs the pure
  predicate needs, whether they can be computed from the entity-level load's `contestantUserData`
  and `questionData` without a data root, and what makes the gate's load run again with fresh
  answers after `userData.save()` (the store invalidates nothing today). Measured, not assumed,
  including a client-side navigation to the preview immediately after the save that fills the last
  missing answer. The questions need none of this any more: they are gated on a nomination only
  (OD08-D2). **The finding comes before the plan is fixed.**
- **RQ-2.** What a child candidate can read of an unconfirmed parent today — the parent's nomination
  row and the parent's entity row — through the tables and through `get_entity_basic_data`; and
  therefore which hop of D-09 needs a definer function.
- **RQ-3.** Whether `validate_nomination` and `enforce_nomination_entity_columns` admit the nomination
  D-18's spec inserts with the service role, for a candidate and for an organization, in the
  template's election type.
- **RQ-4.** Which identity and which page produce `Error formatting nomination … Child in collection
  elections with id … not found` (D-09; required by OD08-D9 (a)): a full run's dev-server log with source maps, or the
  nominations of each signing-in identity against the elections its question read returns.
- **RQ-5.** How a signed-in contestant of a closed project receives `access.*` in the browser
  (175-CONTEXT RQ-3) — the same answer serves `nominationsLocked`.
- **RQ-6.** Every reader of a route id that gains the group's segment (D-13): `lib/routes/`,
  `hooks.server.ts`, the tracking tests, `tests/tests/utils/contestantEntityUrl.ts`.

</factual_baseline>

<expected_tree>
## The tree this phase is planned against

Phases 170–173 are executed. Phase 174 is complete. Phase 174.1 is executed and verified, and closes
after the browser check of its two remaining focus outcomes (operator decision A2 (b) of 2026-10-08).
Phase 175 has not started. The "Inherited from Phase 174 … and 174.1" subsection below is the
2026-10-07 snapshot, written while those phases were running: what it calls *running* or *planned* is
on the tree now and is re-read there. Anything else below marked *planned* is read from a PLAN or a
CONTEXT and must likewise be re-read before an anchor is fixed.

### Name map (verified at `f79393703`)

| Thing | Where |
|---|---|
| Entity pages | `routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/` — `+layout.server.ts`, `+layout.svelte`, `+page.svelte` (home), `contestantHome.helpers.ts` (+ test), `profile/`, `questions/` (`+layout.svelte`, `+page.svelte`, `[questionId]/`), `preview/`, `settings/` |
| User-level load, app root, resolver | `routes/contestant/(protected)/+layout.server.ts`, `+page.server.ts`, `[...page=contestantEntityPage]/+page.server.ts`; matcher `params/contestantEntityPage.ts` |
| Route constants | `lib/routes/route.ts` — `CONTESTANT_ENTITY`, `ContestantAppEntityHome`, `ContestantAppHome` (the app root), `ContestantAppProfile`, `ContestantAppQuestions`, `ContestantAppQuestion`, `ContestantAppPreview`, `ContestantAppSettings`, `ContestantAppHelp` |
| Contestant context | `lib/contexts/contestant/contestantContext.svelte.ts` (+ `.type.ts`); store in `contestantUserDataState.svelte.ts` (+ `.type.ts`) |
| Writer | `lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts` (`_getEntityUserData`); types in `lib/api/base/dataWriter.type.ts` (`ContestantUserData<TNominations>`, `UserEntity`) |
| Navigation | `lib/dynamic-components/navigation/contestant/ContestantNav.svelte` |
| Gates | `lib/contestant/gates/gates.ts`, `gateViews.ts`, `TermsOfUseGate.svelte` |
| Contestant components | `lib/contestant/components/` — `contactSupport`, `logoutButton`, `nothingToEdit`, `passwordField`, `passwordSetter`, `passwordValidator`, `preregisteredNotification`, `termsOfUse` |
| Sign-out helper, error map | `lib/server/contestant/signOutToLogin.ts`; `lib/contestant/utils/loginError.ts` |
| Nominations table, policies, grants | `schema/104-nominations.sql`, `schema/302-rls.sql`, `schema/303-column-grants.sql` |
| Entity RPCs | `schema/503-entity-rpcs.sql` (`get_nominations`, `get_entity_basic_data`, `get_user_entities`, `get_entity_user_data`, `upsert_answers`) |
| Lock helper | `schema/301-auth-functions.sql` `private.project_nominations_locked` |

### Inherited from Phase 173 (executed; verified with one human item, which is Phase 175's scope)

- The user-level load returns `{ gate, user }` or `{ gate: null, user, entities }`; the entity-level
  load awaits it, returns `{}` while a gate is pending, and otherwise `{ questionData,
  contestantUserData }` with everything awaited (no streamed promise).
- Task state hangs off the entity-level store, "which holds nothing until its first `init` and is
  left by `leaveEntity()` when the entity layout is torn down" (173 O-6). **The store holds nothing
  on the server and on first paint**: a part is left out for a *known* state and never shown only for
  a known one (173-03) — the task list's first paint obeys the same rule.
- `ContestantUserData<true>` is `{ entity, nominations: { nominations, entities } }`; the store's
  `reloadEntityData` re-reads with `loadNominations: false`.
- `LogoutButton` logs out at once when no entity is loaded. The home's heading names the entity only
  while something is left to do.
- Neither protected load reads the URL tracked; each has a read-recording test.
- The base dataset serves both entity types; three unconfirmed base rows and two read-only sessions
  belong to the entity-selection spec; perm setups serve candidates alone.

### Inherited from Phase 174 (executing) and 174.1 (inserted, not started)

- **174, executed:** `public.invitations`, `create_invitations` (confirms a named target of any type).
  **Running:** 174-03, public sign-up off. **Planned (04–10):** `claim_invitations`, the
  `account-access` Edge Function, harness helpers that seed an invited candidate and organization.
  This phase depends on none of them for its behaviour. An invited entity need not have a nomination;
  after this phase such a user reaches home.
- **174.1, planned:** the terms-of-use gate fits a phone viewport, and focus lands on the page that
  replaces the gate — in each of three outcomes, one of them "an entity page", which after this phase
  is the task-list home.

### Expected from Phase 175 (context captured 2026-10-07, not planned — re-read before planning)

- **The organization's pages** — profile, questions, preview — and the type-aware question scope
  (`const entityType = ENTITY_TYPE.Candidate;` in the context's rollup `$effect` today). Without them
  the organization half of D-18 has nothing to open.
- **The per-type descriptor** for what differs between entity types (175 D-02), and per-type message
  keys (175 D-17).
- **The neutral no-questions page** and the omission of the questions entry for a loaded entity with
  no opinion questions (175 D-13) — which D-03 orders behind "blocked".
- **`profileComplete` with a name clause for an organization whose name is still editable** (175
  D-14, ruled by OD08-C5 (a)) — D-03.
- **`access.nominationsLocked`, enforced in the database, and `ctx.nominationsLocked`** (175 D-10,
  ruled by OD08-B1 to B4 (a)) — D-17.
- **The profile page's nominations block, left in place** for this phase to move.
- **The "immutable data" copy rewritten** to say names are locked because the entity is confirmed
  (175 D-17) — the section this phase's note is not used on (D-12).

### Handed to later phases by this phase

- **177:** `tasks` and `nextStep` are the contract. 177 adds Edit on J and the editor's routes beside
  it; its Continue reads `nextStep`. NOM-08 needs the entity-level load — and with it the question
  read and the gate's inputs — to run again when nominations change; this phase leaves the branch
  that keys on "has a nomination" (D-16) and whatever freshness mechanism RQ-1 and D-13 produce. The RPC of
  D-09 already returns `custom_data` and the parent, so 177's "plan 2 widens the read if 176 has not"
  is discharged.
- **178, 179:** every flow that ends in the app lands on home and follows `nextStep`; the removal of
  the `candidateNoNomination` sign-out is what lets a freshly registered entity stay signed in
  (179-CONTEXT: "without which a freshly registered candidate is signed out; confirm before
  planning"). `ContactSupport` is unchanged. **The pending-address reminder is Phase 179's**
  (OD08-D11 (a)): this phase builds no place for it and leaves home's `note` slot as it is; 179 edits
  the home screen this phase builds.
- **Every later E2E dataset:** a nomination-less entity is a valid seed.

</expected_tree>

<cross_phase>
## Cross-phase Notes and Obligations

- **O-1 — schema seriality.** One regeneration of the single migration file, after Phase 175's.
  Phase 178's context already counts this phase among the schema editors (its O-5).
- **O-2 ← 175.** This phase reads `ctx.nominationsLocked`, which Phase 175 builds (OD08-B1 (a)).
- **O-3 → 177.** The contract is the two accessors, J's page and the RPC's shape. 177's planner
  re-reads the RPC before deciding whether `set_entity_nominations` returns the same shape.
- **O-4 → 177.** The note's condition is `nominationsLocked` here (OD08-D5 (a)); 177-B6 widens it.
  J's no-nomination button reads Return here; 177 makes it Continue where the user can add a
  nomination (D-06). The task leads to J in this phase; what it leads to once the editor exists is
  177's (operator decision E11 (a) + NOTE).
- **O-5 → 178, 179.** A user whose claim or registration produced an entity without a nomination
  reaches home and is led to J. Until 177, J offers such a user the support link only (D-11).
- **O-6 — existing specs change in this phase:** `contestant-journey.spec.ts` steps 6, 11 and 12;
  `contestantHomePage.fixture.ts` `expectTasks`; `contestantProfilePage.fixture.ts`
  `expectStaticInfo`; `testIds.ts`; `perm-answers-locked.spec.ts` and `contestant-a11y.spec.ts` where
  they read `contestant-answers-locked-warning` (D-12).
- **O-7 — docs and skills.** The three docs pages named under D-16; a page for home, the task state
  and J under `apps/docs/src/routes/(content)/developers-guide/contestant-app/`;
  `routes/contestant/README.md` and `lib/contestant/components/README.md`;
  `.claude/skills/components/context-reactivity.md` (the accessor list gains `tasks` and `nextStep`)
  and `CLAUDE.md` § *Context Destructuring Rule* if its examples are a closed list;
  `.claude/skills/database/*` for the new RPC.
- **O-8 — pending todos that bear on this phase** (`.planning/todos/pending/`):

  | Todo | Bearing |
  |---|---|
  | `2026-05-31-display-nominating-org-in-candidate-profile-nominations.md` | In scope by the roadmap; closed by D-09 and D-10 |
  | `2026-05-13-allow-incomplete-profile-save-gate-opinion-questions.md` | Closed at this phase's close: its save half is on the tree, and its "gate opinion questions" half is withdrawn by OD08-D2 (D-07; the closing note is inferred) |
  | `2026-06-01-candidate-home-savedanswers-empty-logout-modal.md` | Closed by D-20 on the three isolated journey runs |
  | `2026-10-06-173-nomination-format-error-logged-in-every-run.md` | Owner named as this phase; diagnosed before the code is deleted, and closed with the finding (D-09; OD08-D9 (a)) |
  | `2026-10-06-173-no-entity-name-on-answering-pages.md` | Ruled: no cue is built; the todo stays open (OD08-D10 (a)) |
  | `2026-10-06-173-widened-page-params-annotation-in-contestant-context.md` | Closed here if 175 has not and plan 2 edits the context (discretion) |
  | `2026-10-06-173-writer-integration-test-runs-in-no-ci-job.md` | The test gains a nominations case (D-09; OD08-D1 (a)), and is run in the gate (D-22); the CI gap stays |
  | `2026-10-06-173-nav-drawer-does-not-close-on-escape.md` | Met by any spec that drives the menu, as D-18's does for the disabled items; not fixed here |
  | `2026-10-06-173-terms-of-use-view-phone-overflow-and-focus.md` | Phase 174.1 |
  | `2026-10-06-173-refresh-the-session-after-a-claim.md` | Phase 174; a nomination inserted by an admin needs no token refresh, a grant does |
  | `2026-10-02-app-settings-shallow-merge-and-no-admin-editor.md` | Why D-19's template restates the whole `access` root; no Admin editor exists to set the lock |
  | `2026-10-01-nominations-created-by-readable-by-anon.md` | The new RPC does not project `created_by` (D-09) |
  | `2026-09-24-data-model-vs-db-nomination-constraints.md` | Phase 177; J renders raw rows and builds no `Nomination` object |
  | `2026-09-15-refactor-candidate-and-entity-registration-flow-and-nominati.md` | Phase 178; this phase delivers its "no nomination is not an error" half |
  | `2026-09-21-preregister-route-discards-email-and-nominations.md` | Phases 177–179; the nomination-less landing it needs exists after this phase |
  | `2026-08-27-147-answers-locked-warning-unscanned.md` | The warning becomes the note (D-12); a scan of the note in its answers-locked use would close it, which D-19 does not require |
  | `2026-08-27-147-empty-answer-candidate-states-unscanned.md`, `2026-08-27-147-prevent-navigation-modal-unscanned.md`, `2026-08-27-147-candidate-error-paths-unscanned.md` | States of pages this phase edits that no scan reaches; unchanged |
  | `candidate-journey-135-intermittent.md` | The journey spec is run three times in isolation in the gate (D-22); a failure there is a blocker, not a flake |
  | `2026-10-06-native-speaker-review-profile-selection-strings.md`, `2026-10-05-native-speaker-review-contestant-app-names.md` | The precedent for the review todo this phase files |
  | `2026-08-24-external-id-namespace-collision-con-prefix.md`, `2026-09-18-verify-e2e-runs-and-teardowns-isolated-to-own-project.md` | Constraints on the new template and its teardown (D-18) |
  | `2026-10-06-172-full-suite-red-on-a-slow-dev-server-start.md`, `2026-10-07-e2e-wrapper-host-suspend-heartbeat.md` | A void run is read from the power log before a red run is believed (D-22) |
  | `2026-10-06-172-admin-confirm-requires-editor-acceptance.md` | The other rule about confirming; J only displays a nomination's state |

- **O-9 — todos this phase files:** the native-speaker review of its new strings (the six non-English
  locales are again constructed from each catalogue's existing terms; operator decision C4 (a) — the
  review does not hold the phase). Nothing new for the entity-name cue — the existing todo stays open
  (OD08-D10 (a)).

</cross_phase>

<canonical_refs>
## Canonical References

### The phase's own contract

- `.planning/v2.16-OPERATOR-DECISIONS-2026-10-08.md` § D (D1–D11), and B1, C5, C8.
- `.planning/v2.16-OPERATOR-DECISIONS-2026-10-07.md` § B (B1) and § D (D1, D2).
- `.planning/v2.16-DISCUSSION-POINTS.md` § *Phase 176*, § *Cross-phase picture*, 175-B5, 175-C1,
  177-B5, 177-B6, and the cross-phase notes of 172, 173, 175, 177, 178 and 179.
- `.planning/ROADMAP.md` § *Phase 176* (criterion 2 amended 2026-10-05; criteria 3 and 4 amended
  2026-10-08; "Settled 2026-10-08"), § *Phase 174.1*, § *Phase
  177*, and the v2.16 hand-over bullets.
- `.planning/REQUIREMENTS.md` — NOM-01, NOM-02, NOM-07, TASK-01, the "Nominations locked" definition,
  the standing rules.
- `CAND-APP-PLAN.md` at the repo root — screens I, J and L.

### Upstream phases

- `.planning/phases/175-organization-editing-profile-questions-preview/175-CONTEXT.md` — D-02, D-10,
  D-13, D-14, D-17 and its J4, J5, J7 (ruled 2026-10-08).
- `.planning/phases/173-multi-entity-grants-entity-selection/` — `173-NAME-MAP.md` § *Obligations to
  later phases* (O-4, O-6, O-10, O-12), `173-13-SUMMARY.md` § *What Later Phases Must Know*,
  `173-09-SUMMARY.md` and `173-10-SUMMARY.md` (`ContactSupport`, `NothingToEdit`, the app root),
  `173-VERIFICATION.md`, `deferred-items.md` item 3, `173-UI-SPEC.md`.
- `.planning/phases/172-terms-of-use-per-user-and-project/` — the gate list and its contract.
- `.planning/phases/178-sign-in-email-code-registration/178-CONTEXT.md` — D-14, R8, O-5, and
  `<expected_tree>` § *Expected from Phases 175–176*.
- `.planning/phases/179-identity-provider-registration-coverage-close/179-CONTEXT.md` — what it
  expects of home and of the removed sign-out.

### Standing project rules and skills

- `CLAUDE.md` — § *Context Destructuring Rule*, § *Comment Hygiene*, § *E2E Hard Rule*, § *E2E
  preflight*, § *Results Navigation Invariants* (the tracked-URL prohibition the contestant loads
  mirror), § *Svelte Warning-Accepted Format*.
- `Skill("components")` — the runes-era component API, `concatClass`, the axe gate,
  `context-reactivity.md`.
- `Skill("database")` — `schema-reference.md`, `rls-policy-map.md`, the pgTAP conventions, the
  nullability override mechanism.
- `Skill("data")` — nominations and why raw rows cannot be provided to the data root.
- `.agents/code-review-checklist.md`.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable assets

- **Support block** — `ContactSupport` with `SUPPORT_ANCHOR`; it "builds no route into the pages of an
  entity", so it renders anywhere.
- **Warning and success surfaces** — `Warning` (`$lib/components/warning`), `SuccessMessage`,
  `ErrorMessage`, `InfoBadge` (the count on a task), `HeroEmoji`.
- **Locked-field cards** — `InputGroup` with a title and locked `Input`s, as the profile's nominations
  block is built today.
- **Pure-helper pattern** — `contestantHome.helpers.ts`: structural parameter types, no imports,
  fresh objects, a table-driven test; and `entitySelection.helpers.ts` beside the app root.
- **Definer-RPC pattern** — `public.get_entity_basic_data`: one `user_can` gate, an allow-list
  projection, `NULL` for every refusal.
- **Server-load pattern** — `await parent()`, `if (parentData.gate !== null) return {};`,
  `redirect(307, buildRoute({ … }))`, params read by name, a `layout.tracking.test.ts` and a
  `layout.server.test.ts` beside the load; `loadTracking.testUtils.ts`.
- **E2E** — `forceRegisterUser`, `grantEntity`; `setupFromTemplate`; the perm setup and teardown
  pairs under `tests/tests/setup/perm/`; the session-per-table shape of `contestant-a11y.spec.ts`;
  `contestantEntityUrl.ts`; the phase driver scripts of 173 and 174.

### Established patterns

- A context accessor is a `$derived` private field with a getter, declared on the context's type;
  consumers read `ctx.X` in their tracking scope. The context's question lists are push-based
  `$state` mirrors written by one `$effect`, because a pull chain did not reach cross-module
  consumers — the class's own comment records the measurement.
- A helper called from a `$derived` receives already-read values, never the context object.
- A refusal of an entity the user may not edit is one redirect with one status and one target,
  whatever the reason; nobody is signed out over one.
- A gate decided on user-level data is an entry of `CONTESTANT_GATES`; anything that needs the entity
  is decided below the entity-level load.
- A new contestant surface gets an axe entry in both themes under the session that reaches it, with a
  reach marker.
- A stored settings root replaces the shipped root whole; every writer restates the root.

### Integration points

- Stage 4 and stage 5 of `ENTITY/+layout.server.ts` (D-16); `ENTITY/+layout.svelte`'s `validity`.
- `_getEntityUserData`'s nominations read and `ContestantUserData<TNominations>` (D-09).
- `ContestantContextProvider` — two new `$derived` accessors beside `#profileComplete`, and the type.
- `ENTITY/+page.svelte` and its helper (D-05); `submitRouting` on the profile and question pages; the
  two buttons of the questions list; `triggerLogout` (D-20).
- `ENTITY/profile/+page.svelte` — the "Immutable nominations" section and `parseNomination`, removed.
- `ENTITY/questions/+layout.svelte` — the client redirect, removed and not replaced (D-07).
- `ContestantNav.svelte` — a new item, and `disabled` from the task state.
- `lib/routes/route.ts`, `params/contestantEntityPage.ts`, the resolver's `SINGLE_SEGMENT_ROUTES`.
- `lib/contestant/utils/loginError.ts` and `messages/*/contestantApp.error.json`.
- `schema/503-entity-rpcs.sql` and a pgTAP file for the new function.

</code_context>

<specifics>
## Specific Ideas

- **Home is a list of things, each of which says its own state.** Three rows, in order, each
  complete, incomplete or not yet open — and one primary action that is always the first incomplete
  one. The copy that today explains the whole screen in one paragraph
  (`contestantApp.home.ingress.notDone`: "…enter some basic information about yourself as well as
  answer opinion statements…") names two tasks and a person; with three tasks and two entity types it
  is rewritten per type.
- **A user with no nomination is not at fault.** The home and J say what is missing and who can add
  it; they never use the vocabulary of an error. This is the screen a freshly registered user sees
  first from Phase 178 on.
- **The state of a nomination is the answer to "why am I not in the voter app?"** — the line under a
  pending card says so in those terms (D-10).
- **`CAND-APP-PLAN.md` on J:** "show the nominations block from current profile in an expanded form
  (remove from there)". "Expanded" is the UI spec's to interpret; the data that makes it possible is
  D-09's.

</specifics>

<deferred>
## Deferred Ideas

- J's Edit action, the unlocked branch, the editor K, and the questions following a changed
  nomination — Phase 177.
- A fourth task for the preview, completing on first visit — 176-A2 (b), not chosen.
- A general step machine — 176-A1 (c), not chosen.
- Loading the full nomination graph into the data root for J — 176-B2 (b), not chosen.
- Hiding blocked entries until they are reachable — 176-D3 (b), not chosen.
- Lifting the NOM-07 gate while nominations are locked — 176-F1 (b), not chosen.
- A generic note in the base component library — 176-C1 (c), not chosen.
- An Admin-app screen to confirm a nomination or to set the lock — out of scope for v2.16.
- The pending-address reminder on home — Phase 179.
- An entity-name cue on the answering pages — not built; the todo stays open (OD08-D10 (a)).
- A server or client gate that holds the opinion questions behind the profile's required info —
  176-A6 ★ and both options of OD08-D2, superseded by the operator's EDIT.

### Ambiguities and contradictions found while reconciling

*This list is the record of what was found on 2026-10-07. Every item that ended in a judgement call
is ruled as of 2026-10-08 (see* Judgement calls*). Items 10 and 14 describe the "required info before
questions" gate, which the operator's EDIT has since dropped (D-07); item 12's reminder is Phase
179's (OD08-D11 (a)).*

1. **`ROADMAP.md`, hand-overs:** "_Schema edits are serial._ 171, 172, 173, 174, 175 and 177 each edit
   `schema/*.sql` and regenerate the single migration file" — against **`ROADMAP.md` § Phase 176:** "J
   is its own page … fed by one entity-scoped RPC that resolves the parent server-side (176-B2)" and
   **176-H1 ★ plan 1:** "the nominations RPC of 176-B2 … pgTAP and types". 176 edits the schema too
   (R19).
2. **Discussion, § Cross-phase picture → Ordering:** "**One lock:** `projects.lock_nominations`
   (175-B2 ★). 175 introduces the frontend accessor; 177 reuses it for NOM-06", and **176-0 fact 14:**
   "`projects.lock_nominations` is enforced in the nomination policies only. Section 175-B5 adds a
   `nominationsLocked` accessor" — against **`REQUIREMENTS.md`:** "the app setting
   `access.nominationsLocked` … The lock moves there out of `projects.lock_nominations`" (R7).
3. **`ROADMAP.md`, hand-overs:** "175 introduces it and its frontend accessor; 176 and 177 reuse it" —
   against **`175-CONTEXT.md` J4:** "*Alternative:* since OD-B1 removed this phase's only reader, the
   move goes to Phase 176 … 176's CONTEXT would say so", marked ⚠ OPERATOR REVIEW and unconfirmed
   (J1). And **Discussion, § 176 — Cross-phase notes:** "If 175-B5 is overruled, this phase adds the
   accessor" — 175-B5 *was* overruled, to (b), but on where the lock lives, not on who adds the
   accessor.
4. **176-C1 ★:** "a support link block that points at the help page's new `#support` anchor" and
   **176-0 fact 13:** "Neither a note component nor a support block exists … has no `#support`
   anchor" — against the tree: `ContactSupport`, `SUPPORT_ANCHOR` and
   `<ContactSupport action="email" id={SUPPORT_ANCHOR} …/>` on the Help page (R5).
5. **176-C1 ★:** "The note … is used on J and on the profile's immutable section" — against **OD-B1
   (a):** "the nominations lock affects nominations only" and **`175-CONTEXT.md` D-05:** "A locked
   field shows its value, with a sentence saying the name is set and whom to ask for a correction"
   (R6, J7).
6. **175-C1 ★:** "The home button and the navigation item for questions are not shown for that entity"
   — against **176-D3 ★:** "Shown, disabled", for an entity that has no opinion questions *because* it
   has no nomination (176-E1 ★). 176-E1's own text settles the order: "`blocked` on 'no nomination',
   not on 'no questions'" (R16).
7. **176-A5 ★:** "it reproduces what each of the five sites does today (fact 5)", the fifth being
   "Protected layout: the terms-of-use Continue flips `layoutState`" — against Phases 172–173: the
   gate is decided before any entity is read, and "Passing a gate is not a navigation"
   (`173-13-SUMMARY.md`) (R11, J4).
8. **177-B6 ★:** "K is not editable when either lock is on" — against **`ROADMAP.md` § Phase 176,
   criterion 2:** "when they cannot be edited — nominations are locked (`access.nominationsLocked`)"
   (J6).
9. **176-G1 ★:** "A new perm-style template with its own project" — against the harness: every
   template is written to `resolveE2eProjectId()`, and the preflight aborts a run whose server serves
   another project (R14). `175-CONTEXT.md` J10 left the same phrase "not verified here"; it is
   verified here.
10. **176-D1 ★:** "its server load redirects (307) when … required info [is] missing for questions and
    preview. The predicate is the same pure helper the context uses" — against the tree: answers are
    saved in the browser with no load invalidated, the entity-level load does not rerun between the
    pages of one entity, and "required info missing" is computed only in the context from the data
    root (J3, RQ-1). Not a contradiction between documents; a ★ written before 173 fixed how the
    loads rerun.
11. **`CAND-APP-PLAN.md` screen I:** "If editable Edit ⇒ K, else View ⇒ J" — against **`ROADMAP.md`
    § Phase 176, planning note:** "in this phase the task leads to the nominations view". Staging,
    not conflict: the first branch arrives with Phase 177.
12. **`179-CONTEXT.md`, expected from Phase 176:** "home and its task state (where the pending-address
    reminder sits)" — no source of this phase mentions a reminder or a slot for one.
13. **`2026-10-06-173-nomination-format-error-logged-in-every-run.md`** lists `files:
    apps/frontend/src/lib/contestant`; the one place that logs the line is `parseNomination` in
    `ENTITY/profile/+page.svelte` (J10).
14. **`175-CONTEXT.md` `<expected_tree>`:** "176: … the profile page's nominations block, left in
    place" agrees with this file; its todo table gives
    `2026-05-13-allow-incomplete-profile-save-gate-opinion-questions.md` to Phase 176 "(fact 19)",
    which D-07 takes — closed with its gate half withdrawn (OD08-D2).

</deferred>

---

*Phase: 176-contestant-home-task-state-nominations-view*
*Context gathered: 2026-10-07 from the filled v2.16 discussion points and the operator decisions of
2026-10-07*
*Operator decisions of 2026-10-08 applied 2026-10-08: J1–J11 ruled; D-07 rewritten for the operator's
EDIT on D2, with D-02, D-03, D-06, D-09, D-12 to D-15, D-17, D-19 and D-21 changed where a ruling
fixed them*
