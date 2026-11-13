# Phase 173: Multi-Entity Grants & Entity Selection - Context

**Gathered:** 2026-10-05
**Status:** Ready for planning

**Source of decisions:** `.planning/v2.16-DISCUSSION-POINTS.md` § *Phase 173 — Multi-Entity Grants &
Entity Selection* (plus § *Cross-phase picture*, X1–X3, and § *Additional notes*) — a shared checkbox
document covering Phases 170–179 that the operator filled in one pass (committed as `e4813bf65`,
"docs[planning]: v2.16 discussion points for phases 170-179, operator-filled"). Its rule: an unticked
decision accepts the `★ RECOMMENDED` option; a ticked box overrules the ★; `**EDIT:**`/`**NOTE:**` free
text beats every box.

In Phase 173's own 24 decisions the operator ticked **one box, an overrule of the ★**, and wrote no
EDIT or NOTE text inside the section:

1. **173-B5 → (b): a signed-in "nothing to edit — contact support" screen with the support block and
   Logout**, instead of the ★ "sign out and return to login with the reworded error". See D-11.

Choices made **outside** this section that change what this phase builds or the names it builds against:

2. **170-A5 → (b):** the auth pair moves to the neutral `api/auth/{callback,logout}`, the duplicate
   logout is merged, only `preregister` moves to `api/contestant/`. (Name map below.)
3. **171-A3 → (b):** the two settings live inside the existing root as `contestantApp.entityTypes` and
   `contestantApp.registrationModes`, not as root-level `contestant_app_entities`-style keys. This is how
   "served" is read (D-06, D-12) and it shapes the settings write in D-20.
4. **X1 → ★ (a), untouched:** the E2E base dataset stays candidate-only in 171 and **this phase widens
   it to both types with `organization: []`**, re-baselining whatever the "Candidate and party app" name
   changes. (D-20.)
5. **X3 → ★ (a), untouched:** `REQUIREMENTS.md`, `ROADMAP.md` and `PROJECT.md` are amended to the
   chosen options in one docs commit before Phase 170 is planned. That edit was in flight while this file
   was written, so this file **cites requirement ids and states the chosen decision itself** and does not
   quote requirement wording.
6. **174-A3 → (c):** an invitation carries a general grant spec `(scope, target_type, target_id, role)`
   or a child table of grants. 174 writes grants against the constraints this phase settles (D-02, D-05);
   downstream consumer, no change to this phase's work.
7. **178-B1 → ★ (a) + NOTE "bundle this in user data retrieval rpc":** the "password set" fact is to be
   returned by the user-data RPC this phase reshapes. This phase does not deliver the field; its RPC shape
   must leave room for it (D-03, obligation O-1).
8. **Additional note 1:** the whole `preregister` route becomes `register`, with an id-provider subroute.
   (Name map: the legacy registration route constants this phase's route plan passes through.)
9. **Additional note 3:** party and alliance selectors (Phase 177) use a reusable component rendering
   `EntityCard`s, perhaps in a compact variant. Screen H is also "a list of entity cards" (D-13).

Every other decision takes its ★ option as written, except where the ★ text assumed the 173-B5 ★
(sign-out), the 171-A3 ★ (root-level setting names) or a base dataset already serving both types. Those
places are rewritten **and flagged inline as "reconciled with <id> overrule"**. The full list is under
*Reconciliations* at the end of `<decisions>`.

<domain>
## Phase Boundary

One user can hold editor grants on several entities of either served type in a project, and chooses —
and can later change — which one they are editing. Requirements **ENT-01, ENT-02, ENT-03, GEN-02**, plus
**E2E-02 in part** and **E2E-03**. Depends on Phase 171 (served entity types) and Phase 172 (acceptance
off the entity). The phase carries the roadmap's **UI hint** (it adds screen H, the "nothing to edit"
screen and a navigation item).

It delivers, across schema, frontend and tests:

- two entity-neutral RPCs replacing `get_candidate_user_data` and its ambiguity raise;
- the selected entity encoded as a **route parameter** (`[entityType]/[entityId]`), with a user-level
  and an entity-level layout;
- screen **H** (entity selection) at the app root, a "switch entity" navigation item, and the signed-in
  **"nothing to edit" screen** for a user with no editable entity;
- a data writer, a user-data store and layouts that serve an organization as they serve a candidate,
  with per-entity persisted drafts;
- a multi-grant E2E user, a selection-and-switch spec, axe entries for the new screens, and the E2E base
  dataset widened to both entity types.

**Correction to the roadmap's premise (D-02).** Criterion 1 and `PROJECT.md` § "Known constraints to
lift" name `idx_grants_one_candidate_editor` as a one-candidate-per-user constraint. It is not: it is
unique on `target_id` — one **editor per candidate**. The constraint ENT-03 lifts is the RPC's
`ERR_ENTITY_IDENTITY_AMBIGUOUS` raise and the frontend's single-entity assumptions. The index is
**kept**.

**Not in this phase:** organization-specific pages — profile, questions, preview (Phase 175); the
context's hard-coded `ENTITY_TYPE.Candidate` question scope (Phase 175); removing the
`candidateNoNomination` sign-out (Phase 176); task state (Phase 176); the `identity-callback`
`.maybeSingle()` defect for a user with two candidate grants (Phase 179); the "password set" field
(Phase 178); invitations (Phase 174); several editors per candidate; remembering the last selection.

</domain>

<decisions>
## Implementation Decisions

Decision ids map one-to-one onto the discussion document's Phase 173 ids, given in parentheses.
24 decisions → D-01..D-24. Every decision below is locked; the planner does not re-open them. Only the
chosen option is stated; the non-chosen options are dead. Evidence in the discussion document cites
today's `candidate` names; this file uses today's names where it cites the tree and the *Name map* gives
the names expected after Phase 170.

### 0 — Factual baseline

- **D-01 (173-0.1):** Accept all 16 facts of 173-0 as the phase's factual baseline; they are restated
  under `<factual_baseline>`. Fact 1 contradicts the roadmap and `PROJECT.md`; facts 6, 8 and 14 are not
  in the roadmap and each changes a plan. The facts are a 2026-10-04 snapshot at HEAD `df0cec944`, taken
  **before** Phases 170, 171 and 172 run; the planner re-reads the tree.

### A — Schema and RPCs (ENT-03, GEN-02)

- **D-02 (173-A1) ⚠:** **Keep `idx_grants_one_candidate_editor`.** ENT-03 is met without touching it.
  It is the Phase 166 D-11 ruling ("one user per candidate"), it makes a second claim on a candidate
  fail loudly (Phase 174 leans on that), and it keeps "the editor" of a candidate unambiguous for the
  Admin-app terms-of-use rule (TOU-03 / TOU-F01). The record is corrected to name the RPC's raise as the
  constraint lifted: criterion 1 and `PROJECT.md`. Per X3 (a) that correction is part of the pre-170
  docs commit; **the planner verifies it landed and makes it if it did not.** The index's own schema
  comment ("…get_candidate_user_data raises on that when it is read") describes behaviour this phase
  deletes and is rewritten with it.
- **D-03 (173-A2) ⚠:** **Two RPCs.** (1) A **list**: every `(type, id)` the caller edits in the project,
  with the card fields — names, short name, image, colour, `confirmed`. (2) A **one-entity read**: the
  editable row for one `(type, id)`. The list is cheap enough to run on every protected request; it
  answers H, the single-grant skip and "is this selection still mine" **from the table**. The read
  returns only the selected entity. Both stay `SECURITY INVOKER` over `private.caller_entity_ids`, so
  the `07-rpc-security` definer census does not move. The ambiguity `RAISE` is deleted.
  **Obligation to Phase 178 (O-1, reconciled with the 178-B1 NOTE):** the user-level read must be able
  to carry a per-user scalar ("password set") without a second round trip. A plain `SETOF` of entity
  rows cannot — it returns zero rows for a user with no entity, which is exactly a user F may need to
  stop. *Judgement call, flagged:* shape the user-level RPC so a user-level field can be added without
  changing its cardinality (for example one row or object carrying an `entities` array), and keep the
  per-entity facts on the one-entity read. 178 owns the field and the definer helper that reads
  `auth.users`; this phase only keeps the door open.
- **D-04 (173-A3):** **Entity-neutral names:** `get_user_entities(p_project_id)` and
  `get_entity_user_data(p_project_id, p_entity_type, p_entity_id)`. The database's vocabulary is
  `entity`; "contestant" is the app's name and the database does not know the app.
  `get_candidate_user_data` is **deleted, not aliased**. With it goes its named exemption in Phase 170's
  search gate (`assert:no-candidate-app-names`, 170-A8 / 170-C2): **this phase deletes that exemption
  line.**
- **D-05 (173-A4):** "An entity I may edit" is **`role = 'editor'` at entity scope only**, as
  `private.caller_entity_ids` reads today. An entity-scope `admin` grant maps to the empty permission
  set, and a project admin is not the entity (Phase 166 D-07).
- **D-06 (173-A5):** **The list RPC returns `candidate` and `organization` grants only; the frontend
  then drops the types the project does not serve.** The app never serves factions or alliances, so SQL
  says so. The frontend filter reads the served-types accessor Phase 171 puts in `@openvaa/app-shared`
  (171-B2 (a)) over **`contestantApp.entityTypes`** — *reconciled with the 171-A3 overrule*: the ★ text
  says `contestant_app_entities`. It is a display filter, not authorisation: RLS is unchanged. The
  filter is applied **once**, where the list enters the frontend, so H, the single-entity skip, the
  stale-URL check (D-10) and the zero-entity condition (D-11) all see the same list.

### B — Selected-entity encoding (ENT-01, ENT-02)

- **D-07 (173-B1) ⚠:** **Route parameter:** `contestant/(protected)/[entityType]/[entityId]/…`. It is
  the only encoding in which "every page shows and saves the newly selected entity's data, never the
  previous one's" (criterion 3) is a property of the URL rather than of shared mutable state. Two tabs
  on two entities are independent; a stale selection is refused by the load; E2E addresses an entity by
  URL. Entity ids are not secret: a confirmed entity's id is already in voter URLs. **`getRoute` fills
  the two params from the current page, so call sites do not pass them.** Accepted costs: every
  protected route constant gains two params right after Phase 170 moved them; entity uuids appear in
  URLs; a link that names no entity (an email link, a `redirectTo` carried through login, a stored
  bookmark to a pre-173 path) needs a resolver — see *Claude's Discretion*.
- **D-08 (173-B2):** **The app root is H.** `contestant/` (today's `CandAppHome`) renders H; its server
  load redirects a single-entity user to `contestant/<type>/<id>`; home (screen I) is the entity root.
  Every existing link to the app root keeps working, the single-grant user never renders H
  (criterion 2), and "switch" is a plain link to the root, because a multi-entity user is never
  redirected away from it. H is therefore a **route**, not an entry in 172's gate list; the gate list
  holds F and G only. *Reconciled with the 173-B5 overrule:* the root has three outcomes, not two — see
  D-11.
- **D-09 (173-B3):** **The last selection is not remembered.** A multi-entity user lands on H after
  every sign-in. It is what `CAND-APP-PLAN.md` H says, it needs no storage, and a deep link still goes
  straight to its entity.
- **D-10 (173-B4):** **A URL naming an entity the user may not edit redirects to the app root** —
  revoked grant, typed id, unserved type, type/id mismatch alike. The root then resolves to H, to the
  user's single entity, or — *reconciled with the 173-B5 overrule* — to the "nothing to edit" screen
  when no editable entity is left. No information about whether the id exists leaks. The check is the
  list from D-03, read from the table, so a just-revoked grant takes effect before the token refreshes.
  The user is never signed out over a bad link.
- **D-11 (173-B5) ⚠ — OPERATOR OVERRULE of the ★ (ticked (b)): a signed-in "nothing to edit — contact
  support" screen with the support block and Logout.** A signed-in user with no editable entity is
  **not** signed out. Concretely:
  - **Condition.** The served-filtered entity list (D-06) is empty. Reached in v2.16 by: an emailed
    sign-in that proves no invitation (open sign-up is deferred, REG-F01); a claim that produced no
    grant (174-D6, the case 178 lists as "cannot be defined yet"); a last grant revoked mid-session; an
    organization editor in a candidates-only project (D-12); a user whose only editor grant is on an
    entity of **another project** — `hasAnyGrant` in `lib/auth/roles.ts` matches the token's grant
    shapes and is not project-scoped, so such a user passes the password-login gate.
  - **Content.** That there is nothing to edit; **which email the user is signed in with** (the reason
    the operator's option gives: "the user can see which email they used"); the contact-support block;
    Logout. No other navigation into the app's protected pages.
  - **Where it renders.** At the app root, as the third outcome of D-08: zero entities → this screen,
    one → redirect to that entity, several → H. Whether it is a view of the root page or a route of its
    own is the planner's / UI spec's (*Claude's Discretion*); it must not render H with an empty list
    (173-B5 (c) is dead: "an empty selection screen reads as a bug").
  - **Reusable.** Build the body as a component, not page-local markup: the operator's option notes
    "Phase 178 may want exactly this for the unproven-email case", and `CAND-APP-PLAN.md` CI2 asks for
    "an error message with the contact support block" in Phase 179.
  - **`userNoCandidate` is retired.** The sign-out branch `if (!candidate) return await
    handleError('userNoCandidate')` in the protected load goes; so do the `userNoCandidate` member of
    the login-error union and its map entry in `lib/candidate/utils/loginError.ts`, the
    `…error.userNoCandidate` message in all seven locales, the regenerated `translationKey.ts`, and its
    mention in the docs page `developers-guide/…/login-and-password-reset`. The ★'s "reworded for both
    types in seven locales" is dead: the screen's own strings replace it. The planner confirms by search
    that nothing else produces the code before deleting it.
  - **`userNotAuthorized` (`role !== 'candidate'`).** *Judgement call, flagged.* The protected load also
    signs out a user whose coarse role is not the contestant one. With the screen in place, a signed-in
    user without a contestant-shaped grant is, from where they sit, in the same position as a user with
    no editable entity. Recommended reading: the one condition "served-filtered list is empty" decides,
    the user sees the screen, and the role-based sign-out is removed from the protected load. The
    password-login entry gate (D-12) is **not** widened by this: a user with no contestant-shaped grant
    in their token is still refused at the login form. If the planner finds a reason to keep the
    `userNotAuthorized` sign-out (for example an admin-only session), it records it; it does not
    silently keep both.
  - **`loginFailed`** (the user-data read itself failed) is unchanged: sign out and return to login.
  - **Gate order.** F → email (179-B4) → G → **root: nothing-to-edit | H | redirect** → home → the
    per-page nomination gate (176-D1). The terms-of-use gate still comes first, as the ★ text had it
    ("the order is G, then this"): the gate list is decided on user-level data only (172-C2 (a)) and
    runs above entity resolution. *Flagged:* a user with nothing to edit is therefore asked to accept
    the terms before being told so. That is the mechanical carry-over of the ★'s order onto the
    overruled option; nothing in the filled document reverses it.
  - **Messages.** New strings in all seven locales (`da, en, et, fi, fr, lb, sv`) for the title, the
    body, the signed-in-as line and anything the support block does not already provide; reuse the
    existing `…common.contactSupport` and help-page support strings rather than restating them.
  - **Axe reach.** The screen is a new surface, so the standing rule applies: one scan entry per theme
    in the contestant a11y scan family (D-21).
  - **Tests.** A unit test over the root load's three-way branch (zero / one / several); an E2E case
    that reaches the screen, sees the signed-in email, and signs out through its Logout; the pgTAP
    "zero" list case (D-22).
- **D-12 (173-B6):** **The app-entry gate admits `(entity, editor)` for `candidate` and `organization`,
  statically.** `CANDIDATE_GRANTS` in `lib/auth/roles.ts` is renamed and gains the organization shape.
  It is an entry gate, not authorisation: whether the project serves the type is answered after sign-in
  by D-06, and an organization editor in a candidates-only project **lands on the "nothing to edit"
  screen** — *reconciled with the 173-B5 overrule*: under the ★ that user would have been signed out.
  The coarse `role: 'candidate'` literal in `BasicUserData` is renamed with it. The ★ text says "Phase
  170 rules on the name"; 170-A holds no decision on that literal or on `CANDIDATE_GRANTS`, so **this
  phase names both** unless the tree shows 170 already did (see *Ambiguities*). The constant's TSDoc
  ("…the Candidate App cannot load their user data") is rewritten to the new state.

### C — Screen H, switching and drafts

- **D-13 (173-C1):** **H uses `EntityCard` (`variant="list"`) with `action` set to the entity's home
  URL**, and the user's entities are provided to the `DataRoot` from the list RPC (they are not in it
  today — fact 11). A link action gives keyboard and screen-reader behaviour for free. Research confirms
  what `appSettings.results.cardContents` renders in this app and suppresses anything voter-specific; an
  **unconfirmed** entity must render too. *Noted against Additional note 3:* Phase 177's party and
  alliance selectors are to use a reusable component that renders `EntityCard`s, perhaps in a compact
  variant, and H is the same thing — a list of entity cards where each card is an action. Whether one
  card-list component serves both (built here, reused in 177) or H keeps its own list and 177 extracts
  is **left to the planner and the UI spec**; if a shared component is built here it must not bake in
  "navigate on click", because 177 selects rather than navigates.
- **D-14 (173-C2):** H shows **name, type label and image per card; candidates first, then
  organizations, each group alphabetical by the displayed name; a group heading only when both types are
  present.** Everything comes from the list RPC, and the order is deterministic for E2E. No nominations
  and no status on the card.
- **D-15 (173-C3):** "Switch entity" is **a navigation-menu item, shown only when the user has more than
  one entity, linking to H; the menu also names the selected entity.** Reachable from every page
  (ENT-02's "at any time"), absent for the single-entity majority. Nothing is added to the home screen
  (Phase 176 rebuilds it) or to the header.
- **D-16 (173-C4) ⚠:** **The persisted draft is keyed by entity** (`…editedAnswers-<type>-<id>`), **and
  the in-memory image edit is reset when the entity changes.** Each entity keeps its own draft,
  switching loses nothing, one entity's answers can never be saved to another, and two tabs on two
  entities are safe. The store is re-created or re-keyed when the route params change. Logout clears
  drafts as today — now for every entity key, not one.
- **D-17 (173-C5):** **One `userData` store for the selected entity**, initialised by the entity-level
  layout from the route's load; the **user-level data (user, entity list) sits beside it on the context
  as reactive accessors.** Pages keep reading `userData` as today, and a param change reruns the entity
  load, which re-initialises the store. New accessors follow the Context Destructuring Rule: read as
  `ctx.X`, never destructured. No per-entity store map.

### D — Data writer and types (GEN-02)

- **D-18 (173-D1) ⚠:** **One generic entity path.** `getEntityUserData({ type, id })`, and
  `updateAnswers` / `updateEntityProperties` / the upload helper dispatch on `target.type` through one
  `{ candidate: 'candidates', organization: 'organizations' }` map; any other type throws **by name**.
  The RPCs and `upsert_answers` are already typed by entity, so the writer becomes a pass-through. The
  user-data type's `.candidate` member becomes **`entity`, a union discriminated by `type`**; the
  remaining candidate-shaped member and method names on this path (fact 15) are renamed with it, to
  whatever Phase 170 left. All five candidate-only points of fact 5 are lifted, the storage path
  (`<project>/candidates/<id>/`) included.
- **D-19 (173-D2):** **The writer, the store and the layouts serve an organization; the existing pages
  render what is type-agnostic; no organization-specific page work.** Selecting an organization loads
  its row and shows its name on home. Criterion 4's "saving succeeds" is proven by writer and store unit
  tests plus **one adapter-level write against the local database**. The organization's profile,
  questions and preview are Phase 175's, and so is the context's hard-coded `ENTITY_TYPE.Candidate`
  question scope. No "coming soon" screen.

### E — Tests

- **D-20 (173-E1):** **A dedicated setup project over `e2e/base`:** one new user holding editor grants
  on **two base candidates that no other spec's user edits** and on **one base organization**, written
  by a generalised admin-client helper (`grantEntity(email, { entityType, externalId })`), with its own
  teardown. Two candidates prove "saves to the selected one, never the previous one" on pages that exist
  today; the organization proves the load. D-02 means the two candidates must not already have an
  editor; **which two are free is derived at run time against the suite's project**, not from a count
  in any document.
  *Reconciled with X1 (a):* the ★ text says "Depends on 171 declaring both types served in `e2e/base`".
  171 does not (171-E1 ★ keeps the base at `['candidate']`). **This phase widens the suite's base
  settings** to `contestantApp.entityTypes: ['candidate', 'organization']` with
  `contestantApp.registrationModes: { candidate: ['email', 'code'], organization: [] }`, and
  **re-baselines whatever the "Candidate and party app" name changes** in the existing specs (text
  assertions on the app name, the sentences 171-D3 parameterised on it, and the opt-in visual baselines
  if they render it). The login screen's registration entries do not change: no mode is added.
  *Reconciled with the 171-A3 overrule:* the settings live inside the `contestantApp` root, which a
  stored value **replaces whole**, so the widened value restates the whole root (`questions` included)
  unless 171 made that merge deep — the planner reads what 171 left. Whether
  `MINIMAL_BASE_APP_SETTINGS` (inherited by the perm templates) is widened with `BASE_APP_SETTINGS` or
  left candidate-only is the planner's call; it is recorded either way.
  The helper `forceRegister`'s acceptance-row default (172-D3) carries over to the new user, so it does
  not stop at G.
- **D-21 (173-E2):** **A stored session for the multi-grant user and one scan entry per theme on H**, in
  the contestant a11y scan family, using the same second-session mechanism 172-E3 adds (the two phases
  share it). *Reconciled with the 173-B5 overrule:* the "nothing to edit" screen is a second new surface
  and gets **its own entry per theme**. It needs a session whose served-filtered list is empty; the
  planner picks the mechanism (for example a user whose grant is removed after the session is stored —
  the list reads the table, so the screen is stable for the run — or a user with no claimable entity).
  The scan's reach must be shown by the scan's own marker, not assumed.
- **D-22 (173-E3):** **Rewrite `36-entity-identity`.** Delete the ambiguity `throws_ok`; add **list**
  cases (zero, one, several, mixed types, another project's grant excluded, `admin` role excluded,
  faction/alliance excluded) and **one-entity read** cases (own entity, someone else's refused, type/id
  mismatch returns no row); **keep the index pin** (D-02 keeps the index). The file already owns "which
  entity am I"; no second file.

### F — Plan shape and gate

- **D-23 (173-F1) ⚠:** **Five plans, each closing green.**
  1. **Schema:** the two RPCs, removal of the raise and of the old RPC, pgTAP, generated types and
     overrides.
  2. **Writer and types generalised (D-18), store keyed by entity (D-16), unit tests** — still serving
     one candidate through the old route tree.
  3. **Route tree:** the user-level and entity-level layouts, `[entityType]/[entityId]`, route constants
     and `getRoute` filling the params, the entry gate (D-12), stale-URL (D-10) and zero-entity (D-11)
     handling; every existing E2E fixture re-pointed.
  4. **H, the switch item, strings in seven locales.**
  5. **The multi-grant E2E setup and spec, the axe entries, docs and skills, closing gate.**
  Plan 3 is the only one that moves every protected URL, and it lands with the single-candidate suite as
  its regression net before any new behaviour is added.
  *Reconciled with the 173-B5 overrule:* the ★'s plan 3 "zero-grant handling" was a reworded sign-out;
  it is now a screen with strings in seven locales, which the ★ placed in plan 4. The rule the planner
  holds is that **no plan boundary leaves a signed-in user with no entity facing neither the old
  sign-out nor the new screen**: either the screen and its strings land in plan 3, or plan 3 keeps the
  existing sign-out and plan 4 replaces it together with H (both are outcomes of the same root load).
  The base-settings widening of D-20 and both axe entries of D-21 sit in plan 5.
- **D-24 (173-F2):** **Closing gate, in order:** `yarn lint:check` (schema-migration parity, and Phase
  170's name gate), `yarn db:types` with no diff left, `yarn db:lint:sql`, pgTAP, `yarn test:unit`,
  `yarn build`, the full E2E run through `tests/scripts/e2e-run.sh`, and **zero-hit greps for
  `get_candidate_user_data`, `ERR_ENTITY_IDENTITY_AMBIGUOUS` and the fixed draft key.** Each status is
  read from the command's own exit code, never through a pipe. The greps prove the old single-entity
  path is gone rather than bypassed; they exclude `.planning/`. The draft-key pattern is the key **as
  Phase 170 left it** (170-A2 renames the storage keys), read from the tree at plan time.
  *Reconciled with the 173-B5 overrule (recommended addition, flagged):* a fourth zero-hit grep for
  `userNoCandidate`, since D-11 retires it.

### Reconciliations

| # | ★ text that assumed something the operator overruled | Reconciled to | Overrule |
|---|---|---|---|
| R1 | 173-B5 ★ "sign out and return to login with the existing 'no entity' error, reworded for both types in seven locales" | Signed-in "nothing to edit" screen with support block and Logout; `userNoCandidate` code, map entry, message and docs mention retired; new screen strings in seven locales (D-11) | 173-B5 |
| R2 | 173-B2 ★: the root is H, or redirects a single-entity user (two outcomes) | Three outcomes at the root: zero → "nothing to edit", one → redirect, several → H (D-08, D-11) | 173-B5 |
| R3 | 173-B4 ★: redirect to the root "— H, or the user's single entity" | The root may also resolve to the "nothing to edit" screen after a last grant is revoked (D-10) | 173-B5 |
| R4 | 173-B6 ★: "an organization editor in a candidates-only project falls to 173-B5" (i.e. is signed out) | That user stays signed in and sees the "nothing to edit" screen (D-12) | 173-B5 |
| R5 | 173-B5 ★: "the order is G, then this [sign-out]"; cross-phase gate order "F → email → G → H → home" | F → email → G → root (nothing-to-edit \| H \| redirect) → home → per-page nomination gate; G still precedes (D-11, flagged) | 173-B5 |
| R6 | Cross-phase picture: "the `userNoCandidate` and `candidateNoNomination` sign-outs move below [the gates] in 172 and 173" | `userNoCandidate` does not move, it is removed; only `candidateNoNomination` moves into the entity-level load, until 176 removes it | 173-B5 |
| R7 | 173-E2 ★: one new stored session, one new scanned surface (H) | Two new surfaces; the "nothing to edit" screen gets its own entry per theme and a session that reaches it (D-21) | 173-B5 |
| R8 | 173-F1 ★ plan 3 "zero-grant handling" (a sign-out, no strings) | A screen with strings; lands with plan 3 or replaces the sign-out in plan 4, never a gap (D-23) | 173-B5 |
| R9 | 173-F2 ★: three zero-hit greps | A fourth, `userNoCandidate`, recommended (D-24, flagged) | 173-B5 |
| R10 | 173 "Cannot be defined yet": "the zero-grant screen may be superseded by 178's handling of an email that proves no invitation" | Inverted: the screen is built here as a reusable component and 178 reuses it for the unproven-email and no-grant-claim cases (D-11) | 173-B5 |
| R11 | 173-A5 ★ / 173-B6 (b): the setting is `contestant_app_entities` | Read through 171's accessor over `contestantApp.entityTypes` (D-06) | 171-A3 |
| R12 | 173-E1 ★: "Depends on 171 declaring both types served in `e2e/base`" | 171 does not; this phase widens the base to both types with `organization: []` and re-baselines the app-name change; the `contestantApp` root is restated whole (D-20) | X1 (a), 171-A3 |
| R13 | 173-A2 ★: a list RPC returning entity rows | Same two RPCs; the user-level one shaped to admit a per-user "password set" field later (D-03, O-1) | 178-B1 NOTE |
| R14 | 173-B6 ★: "Phase 170 rules on the name" of the `role: 'candidate'` literal | 170-A holds no such ruling; this phase names it, with `CANDIDATE_GRANTS` (D-12) | — (gap, not an overrule) |
| R15 | 173-A1 ★: "correct criterion 1 and `PROJECT.md`" as this phase's edit | Done by the X3 (a) docs commit before Phase 170; the planner verifies and completes it (D-02) | X3 (a) |

### Claude's Discretion

The filled document leaves these to the planner, the researcher or the UI spec:

- **The resolver for links that name no entity** (D-07): email links, a `redirectTo` carried through
  login, and paths of the pre-173 shape. The constraint is the outcome — a single-entity user reaches
  the same page under their entity, a multi-entity user reaches H — and that `redirectTo` still passes
  `safeRedirectTarget`.
- **The return shape of the user-level RPC** (D-03 / O-1), within "leaves room for a per-user field".
- **Whether the "nothing to edit" screen is a view of the root page or its own route** (D-11), and its
  layout and copy; the UI spec owns the visual contract for it and for H.
- **Whether one card-list component serves H and Phase 177's selectors** (D-13).
- **How the entity-level load obtains the entity list** for the D-10 check (parent data or its own
  call), provided the check reads the table and the load obeys the tracking invariant (O-4).
- **The mechanism for the zero-entity stored session** (D-21) and whether `MINIMAL_BASE_APP_SETTINGS`
  widens with the base (D-20).
- **Which plan carries the "nothing to edit" screen** (D-23), within the no-gap rule.
- **The names** of the renamed gate constant, the coarse role literal and the user-data members (D-12,
  D-18), consistent with what Phase 170 left.
- **`userNotAuthorized`** — the recommended reading is in D-11; the planner may keep the sign-out with a
  recorded reason.

</decisions>

<factual_baseline>
## Factual baseline (173-0, accepted under D-01; snapshot 2026-10-04 at HEAD `df0cec944`)

Paths abbreviate: `schema/` = `apps/supabase/supabase/schema/`, `lib/` and `routes/` =
`apps/frontend/src/lib/` and `apps/frontend/src/routes/`, `(protected)/` =
`routes/candidate/(protected)/`. Names are today's; Phase 170 renames the app-level ones.

1. **The index is one editor per candidate, not one candidate per user.**
   `idx_grants_one_candidate_editor` is `UNIQUE ON public.grants (target_id) WHERE scope = 'entity' AND
   target_type = 'candidate' AND role = 'editor'`. Its own comment: "Nothing at write time stops one user
   editing two candidates in one project; get_candidate_user_data raises on that when it is read."
   Chosen in Phase 166 (D-11, D-12). `PROJECT.md` lists it under "assume one entity per user per
   project", which it does not do. (`schema/300-auth-tables.sql`)
2. **A user holding the same grant twice is already impossible:**
   `grants_user_scope_target_role_key UNIQUE NULLS NOT DISTINCT (user_id, scope, target_type, target_id,
   role)`. Organizations admit any number of editors. (`schema/300-auth-tables.sql`)
3. **The RPC's raise is the real blocker.** `get_candidate_user_data(p_project_id, p_entity_type DEFAULT
   'candidate')` asks `private.caller_entity_ids` and raises `P0001` / `HINT =
   'ERR_ENTITY_IDENTITY_AMBIGUOUS'` when the caller holds more than one editor grant **of the asked
   type** in the project. One candidate plus one organization does not raise, but nothing ever asks for
   the organization (fact 5). `36-entity-identity.test.sql` pins the raise and the index by name.
   (`schema/503-entity-rpcs.sql`, `schema/301-auth-functions.sql`)
4. **`private.caller_entity_ids(p_project_id, p_entity_type)`** is `SECURITY DEFINER`, reads the
   **table** (a fresh grant counts before the token refreshes), `role = 'editor'` only, and probes the
   entity's project inline per type. The public RPC is `SECURITY INVOKER`, so the returned row still
   passes the caller's RLS — which reads the **claim** through `user_can`.
5. **The data writer is candidate-only at five points.** `_getCandidateUserData` passes `p_entity_type:
   'candidate'`, stamps `type: ENTITY_TYPE.Candidate` and loads nominations `.eq('candidate_id', …)`.
   `_setAnswers` throws `Unsupported entity type for setting answers` for anything else, although
   `upsert_answers` already writes `organizations`. `_updateEntityProperties` destructures only `target:
   { id }` and always updates `candidates`. `#uploadCandidateFile` writes under
   `<project>/candidates/<id>/`. `candidateUserDataState.save` hard-codes `type: ENTITY_TYPE.Candidate`.
   (`lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts`,
   `lib/contexts/candidate/candidateUserDataState.svelte.ts`)
6. **Not in the roadmap: an organization editor cannot sign in at all.** `CANDIDATE_GRANTS` is `[{ scope:
   'entity', role: 'editor', target_type: 'candidate' }]`. The login action passes it to `passwordLogin`
   as `allowedGrants`; `_getBasicUserData` derives `role: 'candidate' | 'admin' | null` from it; the
   protected load redirects with `userNotAuthorized` when `role !== 'candidate'`. (`lib/auth/roles.ts`,
   `routes/candidate/login/+page.server.ts`, `(protected)/+layout.server.ts`)
7. **Zero grants today:** the password login is refused by the gate above; a session that reaches the
   protected load without an entity is signed out and sent to login with `userNoCandidate`. No
   nomination → signed out with `candidateNoNomination`. (`(protected)/+layout.server.ts` `handleError`,
   `lib/candidate/utils/loginError.ts`)
8. **Not in the roadmap: unsaved answers are persisted under one fixed key.**
   `localStorageState('CandidateContext-candidateUserDataStore-editedAnswers', {})` — keyed by neither
   user nor entity. `#current` overlays those edits on whichever entity is loaded. Cleared by a
   successful `save()`, by `resetUnsaved()` and on logout; an edited image lives in memory only. After
   an entity switch, entity A's draft answers would overlay entity B and be saved to it.
   (`candidateUserDataState.svelte.ts` `#editedAnswersState`, `#current`; `candidateContext.svelte.ts`
   `#reset`)
9. **No "selected entity" exists anywhere.** The entity id flows from `userData.savedCandidateData.id`;
   the context's `selectedElections`, `selectedConstituencies` and the question chain are `$state`
   mirrors pushed by one `$effect` from `userData.current.nominations`. `userData` is a stable
   reference, safe to destructure; the mirrors are reactive accessors and must be read as `ctx.X`.
   (`lib/contexts/candidate/candidateContext.svelte.ts`)
10. **Routes.** Every protected route constant is built from `CANDIDATE_PROT` (`/candidate/(protected)`);
    `CandAppHome` is `/candidate`. The request hook gates by **route id** through `APP_GATES` and carries
    the requested path as `redirectTo`; it is a session gate, not a role gate. The protected tree is
    `+page` (home), `profile`, `questions`, `questions/[questionId]`, `preview`, `settings`.
    (`lib/routes/route.ts`, `lib/routes/appGates.ts`)
11. **`EntityCard` takes a `@openvaa/data` entity object** (`entity: MaybeWrappedEntityVariant`), so the
    entity must be in the `DataRoot`. Its default action links to the **voter** `ResultEntity` route; an
    `action` prop (URL, handler or `false`) overrides it. Variants are `'list' | 'details' | 'subcard'`.
    It reads `appSettings.results.cardContents` and tolerates a non-voter app. The protected layout
    provides `ud.nominations.entities` to the `DataRoot`, which the writer sets to `{}` — the user's own
    entity is **not** in the `DataRoot` today. (`lib/dynamic-components/entityCard/`)
12. **Token size.** `custom_access_token_hook` emits one four-key object per grant row with no cap, and
    `user_can` reads only the claim. A handful of entity grants adds a few hundred bytes; nothing needs
    to change at this phase's scale. (`schema/301-auth-functions.sql`)
13. **E2E builds a signed-in candidate with `forceRegister(candidateExternalId, email, password)`:**
    create user, look the id up in `candidates`, insert one `(entity, candidate, editor)` grant.
    Candidate-only and single-grant. `auth.setup.ts` stores one `storageState` for CA-AA-1. dev-seed
    templates declare no users and no grants. (`tests/tests/utils/supabaseAdminClient.ts`,
    `tests/tests/setup/shared/auth.setup.ts`)
14. **Not in the roadmap: `identity-callback` breaks for a multi-candidate user.**
    `findExistingCandidate` ends in `.maybeSingle()` and throws `ERR_CANDIDATE_LOOKUP_FAILED` "including
    when two granted candidates sit in this project". (`functions/identity-callback/candidateRecord.ts`)
    → Phase 179, see O-8.
15. **The frontend types are candidate-shaped:** `CandidateUserData { user, candidate, nominations }`,
    `LocalizedCandidateData`, `getCandidateUserData`, `savedCandidateData`, `reloadCandidateData`. The
    `p_entity_type = 'organization'` arm of the RPC exists and returns `name`; nothing calls it.
    (`lib/api/base/dataWriter.type.ts`)
16. **The four entity tables have independent primary keys** — "one uuid can name two entities" — so an
    entity is always named by type **and** id. (`schema/503-entity-rpcs.sql`, `get_entity_basic_data`
    comment)

### Cannot be defined yet — as the filled document resolves it

| Item (173 "Cannot be defined yet") | Status |
|---|---|
| How "served" is read (173-A5, 173-B6) | **Resolved:** 171's accessor in `@openvaa/app-shared` over `contestantApp.entityTypes` (171-A3 (b), 171-B2 (a)). Exact accessor name: read from the tree. |
| The exact route, constant and context names | **Resolved in principle** by 170-A (name map below); `get_candidate_user_data` is out of 170's rename (170-A8 (a)), `getCandidateContext` is in (170-A2 (a)). The `role: 'candidate'` literal has **no ruling** — this phase names it (D-12). |
| Whether H can be an entry in the gate list | **Resolved:** no. H is a route at the app root (D-08); 172's gate list holds F and G only. |
| The zero-grant screen may be superseded by 178 | **Resolved the other way:** built here (D-11), reused by 178. |
| Which two base candidates are free of editors | **Still open by design:** derived at run time against the suite's project (D-20). |

</factual_baseline>

<expected_tree>
## The tree this phase is planned against

**Expected at planning time — the planner must re-read the tree.** Phases 170, 171 and 172 have not run
as this file is written. The tables below are what their chosen options say; none of it is verified.

### Name map: today's names → Phase 170's names (chosen options of 170-A)

| Today | After Phase 170 | Decision |
|---|---|---|
| `$candidate`, `lib/candidate/` | `$contestant`, `lib/contestant/` | 170-A1 (a) |
| `lib/dynamic-components/navigation/candidate/`, `CandidateNav` | `…/navigation/contestant/`, `ContestantNav` | 170-A1 (a) |
| `getCandidateContext`, `initCandidateContext`, `CandidateContext*`, `lib/contexts/candidate/` and its files | `getContestantContext`, `initContestantContext`, `ContestantContext*`, `lib/contexts/contestant/` | 170-A2 (a) |
| local `candCtx` | `contestantCtx` | 170-A2 (a) |
| storage keys `CandidateContext-…` / `candidateContext-…` (incl. the fixed draft key of fact 8) | `contestantContext-…` — exact strings read from the tree | 170-A2 (a) |
| `candidateUserDataState`, `CandidateUserData` | `contestantUserDataState`, `ContestantUserData` | 170-A3 (a) |
| the members that name the entity (`.candidate`, and by extension `savedCandidateData` and the like) | **left for this phase** (D-18) | 170-A3 (a) |
| `CandApp*` route keys, `CANDIDATE`, `CANDIDATE_PROT`, `isCandidateRoute`, gate row | `ContestantApp*`, `CONTESTANT`, `CONTESTANT_PROT`, `isContestantRoute`, `name: 'Contestant App'` | 170-A4 (a) |
| `routes/candidate/…`, `/candidate/…` URLs | `routes/contestant/…`, `/contestant/…` | NAME-02 |
| `api/candidate/auth/{callback,logout}` | neutral `api/auth/{callback,logout}`, duplicate logout merged | **170-A5 (b), overrule** |
| `api/candidate/preregister` | `api/contestant/preregister` — and per Additional note 1 the whole `preregister` route becomes `register` with an id-provider subroute; which phase applies the note is not stated, so read the route constants from the tree | 170-A5 (b), note 1 |
| settings `access.candidateApp`, `notifications.candidateApp`, root `candidateApp`, `supportsCandidateApp`; customization `candidateAppFAQ`, `candPoster*` | `access.contestantApp`, `notifications.contestantApp`, root `contestantApp`, `supportsContestantApp`, `contestantAppFAQ`, `contestantPoster*` | 170-A6 (a) |
| message namespaces `candidateApp.*`, `dynamic.candidateApp*` (so `candidateApp.error.userNoCandidate`, `candidateApp.common.contactSupport`) | `contestantApp.*`, `dynamic.contestantApp*` | 170-A7 (a) |
| tests: `fixtures/candidate/`, `setup/candidate/`, `specs/candidate/`, projects `candidate-journey`, `candidate-a11y-scan`, `cold-entry-dataroot-candidate`, tag `@cand-session`, `candidate-…` test ids | `…/contestant/`, `contestant-journey`, `contestant-a11y-scan`, `cold-entry-dataroot-contestant`, `@contestant-session`, `contestant-…` | 170-A11 (a) |
| docs `developers-guide/candidate-app/` | `developers-guide/contestant-app/` | 170-A12 (a) |
| prose "Candidate App" | "Contestant App" | 170-A13 (a) |

**Names Phase 170 deliberately leaves:**

- **`get_candidate_user_data`** (170-A8 (a)) — one named exemption line in the standing gate
  `assert:no-candidate-app-names` (in `lint:check`, 170-C2 (a)), owned by this phase. **D-04 deletes the
  RPC and this phase deletes the exemption line.** The gate then holds every later phase to the new
  names.
- **`invite-candidate`** (170-A9 (a)) — the second exemption, owned by Phase 174. Not touched here.
- Entity-type names are not app names and stay: the `candidates` table, `ENTITY_TYPE.Candidate`,
  `CandidateCard`, `identity-callback/candidateRecord.ts`, voter-side `candidate`.
- **No ruling found** for `CANDIDATE_GRANTS`, the `role: 'candidate'` literal, `CandidateLoginError`,
  `getCandidateUserData`, `LocalizedCandidateData`. They are not in 170-C2's pattern list. This phase
  renames the ones on its path (D-12, D-18); it must not introduce a name the 170 gate rejects.

### Inherited from Phase 171

- **The served-types accessor:** pure functions in `@openvaa/app-shared` beside the settings types
  (171-B2 (a)), read in the frontend through `appSettings`. Phases 173 and 175 read it and **do not
  re-derive it** (171 cross-phase note).
- **Shape (171-A3 (b), overrule):** `contestantApp.entityTypes` (at least one of `candidate`,
  `organization`; default `['candidate']`) and `contestantApp.registrationModes` (a map from entity type
  to a list of modes). A stored `contestantApp` root replaces the shipped root whole unless 171 changed
  the merge.
- **E2E base (171-E1 ★, X1 (a)):** `['candidate']` with `candidate: ['email', 'code']`,
  `organization: []` — this phase widens the served types (D-20).
- The three app names under `dynamic.contestantAppName` (`candidate`, `organization`,
  `candidateAndOrganization`), chosen by the accessor (171-D2 (a)).

### Inherited from Phase 172

- **The user-level gate.** The terms-of-use gate (G) is an in-layout replacement in the protected
  layout (172-C1 (a)), decided on user-level data only, **above** the entity load (172-C2 (a)), as the
  single entry of an ordered gate list (172-C3 (a)), with its markup extracted into a component. **This
  phase creates the layout split** that decision anticipates: the user-level layout (session, user,
  acceptance, entity list, the gate list) and the entity-level layout below it.
- **Acceptance is off the entity.** Table `public.terms_of_use_acceptances` (172-A1 (a)); read
  separately by the writer and surfaced as `BasicUserData.termsOfUseAccepted` (172-B2 (a)); written by a
  dedicated `acceptTermsOfUse()` (172-B3 (a)).
- **`get_candidate_user_data` no longer returns `terms_of_use_accepted`**, and
  **`updateEntityProperties` is image-only** — which is what D-18 generalises.
- **E2E:** `forceRegister` inserts the acceptance row by default, with an opt-out (172-D3 (a)); a second
  stored session exists for the a11y scan (172-E3 (a)) — the mechanism D-21 shares.
- The `userNoCandidate` and `candidateNoNomination` sign-outs were moved below the gate by 172; this
  phase removes the first (D-11) and moves the second into the entity-level load (O-6).

</expected_tree>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### The phase's own contract
- `.planning/v2.16-DISCUSSION-POINTS.md` § *Phase 173* (facts, decisions, "Cannot be defined yet",
  cross-phase notes), § *Cross-phase picture* (contradictions, ordering and hand-overs, X1–X3), and
  § *Additional notes* — the filled decision document; the source of every D-entry.
- Same file, § *Phase 170* 170-A (the rename boundary), § *Phase 171* 171-A3 / 171-B2 / 171-E1,
  § *Phase 172* 172-B / 172-C / 172-D3 / 172-E3, § *Phase 174* 174-A3 and its cross-phase notes,
  § *Phase 178* 178-B1.
- `.planning/ROADMAP.md` § *v2.16* (standing rules, sequencing) and § *Phase 173* (goal, criteria 1–5).
- `.planning/REQUIREMENTS.md` — ENT-01, ENT-02, ENT-03, GEN-02, E2E-02, E2E-03, and § Standing rules.
  Being amended under X3 (a); cite ids.
- `CAND-APP-PLAN.md` (repo root) — screens G, H, I and the nomenclature.
- The CONTEXT.md files of Phases 170, 171 and 172, once written — they supersede the *expected tree*
  section above wherever they differ.

### Schema, RPCs and database tests
- `apps/supabase/supabase/schema/300-auth-tables.sql` — `CREATE TABLE public.grants`,
  `grants_user_scope_target_role_key`, `idx_grants_one_candidate_editor` and its comment (D-02).
- `apps/supabase/supabase/schema/301-auth-functions.sql` — `private.caller_entity_ids`,
  `custom_access_token_hook`, `user_can`.
- `apps/supabase/supabase/schema/503-entity-rpcs.sql` — `get_candidate_user_data` (the raise, the
  organization arm), `get_entity_basic_data`, `upsert_answers`.
- `apps/supabase/supabase/tests/database/36-entity-identity.test.sql` (D-22),
  `07-rpc-security.test.sql` (the definer census D-03 must not move), `21-*.test.sql` (also names the
  old RPC).
- `packages/supabase-types/src/{database.ts,database.overrides.ts}`, `RPC-NULLABILITY.md`,
  `scripts/assert-project-scoped-queries.mjs` — each names the old RPC.
- `.planning/phases/166-*/166-CONTEXT.md` D-07, D-11, D-12 — the grant model rulings D-02 and D-05 keep.
- `.claude/skills/database/{schema-reference,rls-policy-map}.md` — updated in plan 5.

### Frontend
- `apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts` and its test — the
  five candidate-only points (D-18); `apps/frontend/src/lib/api/base/{dataWriter.type.ts,
  universalDataWriter.ts}`.
- `apps/frontend/src/lib/contexts/candidate/{candidateContext.svelte.ts,
  candidateUserDataState.svelte.ts}` — the store, the fixed draft key, `#reset` (D-16, D-17).
- `apps/frontend/src/lib/auth/roles.ts` — `CANDIDATE_GRANTS`, `hasAnyGrant` (D-12).
- `apps/frontend/src/routes/candidate/(protected)/{+layout.server.ts,+layout.svelte,+page.svelte}` and
  `routes/candidate/login/+page.server.ts` — the load, `handleError`, the gate, the root page.
- `apps/frontend/src/lib/candidate/utils/loginError.ts` and
  `apps/frontend/messages/*/candidateApp.error.json` — `userNoCandidate` (D-11).
- `apps/frontend/src/routes/candidate/help/+page.svelte` (the support mailto and
  `…common.contactSupport`), `lib/candidate/components/logoutButton/` — parts the "nothing to edit"
  screen reuses.
- `apps/frontend/src/lib/routes/{route.ts,appGates.ts}` and the route builder — constants, `getRoute`,
  `CANDIDATE_GATE`, `redirectTo` (D-07).
- `apps/frontend/src/lib/dynamic-components/entityCard/EntityCard.{svelte,type.ts}` (D-13) and the
  navigation component under `lib/dynamic-components/navigation/candidate/` (D-15).
- `apps/frontend/src/routes/(voters)/(located)/layout.tracking.test.ts` — the read-recording `url` Proxy
  pattern, the model for guarding O-4.

### Tests and seeds
- `tests/tests/utils/supabaseAdminClient.ts` — `forceRegister`, `unregisterCandidate` (D-20).
- `tests/tests/setup/shared/auth.setup.ts`, `tests/playwright.config.ts` (`candidate-a11y-scan`, the
  `STORAGE_STATE` wiring comment, the perm-family ordering anchor), `tests/tests/specs/a11y/
  candidate-a11y.spec.ts`, `tests/tests/utils/axeScan.ts` (D-21).
- `packages/dev-seed/src/templates/e2e/base.ts` (`BASE_APP_SETTINGS`),
  `packages/dev-seed/src/templates/_helpers/buildMinimal.ts` (`MINIMAL_BASE_APP_SETTINGS`) (D-20).
- `tests/README.md` § Run; `tests/scripts/e2e-run.sh`.

### Standing project rules that bind this phase
- `CLAUDE.md` — § E2E Hard Rule, § Context Destructuring Rule, § Results Navigation Invariants (O-4),
  § Comment Hygiene; `.agents/code-review-checklist.md`.
- `.claude/skills/components/context-reactivity.md`; `Skill("components")`, `Skill("database")`,
  `Skill("spike-findings-voting-advice-application-gsd")` (the `getRoute` `$derived.by` finding and the
  results-redraw reference).

</canonical_refs>

<code_context>
## Existing Code Insights

Facts are the discussion document's 2026-10-04 snapshot. Spot-checked on this worktree while writing
this file, by content: the `idx_grants_one_candidate_editor` definition and its comment;
`ERR_ENTITY_IDENTITY_AMBIGUOUS` in `503-entity-rpcs.sql`; `CANDIDATE_GRANTS` and the non-project-scoped
`hasAnyGrant` in `lib/auth/roles.ts`; the three sign-out branches (`userNotAuthorized`,
`userNoCandidate`, `candidateNoNomination`) and `handleError` in `(protected)/+layout.server.ts`; the
`userNoCandidate` union member, map entry and seven message files; the draft key
`'CandidateContext-candidateUserDataStore-editedAnswers'`; `EntityCard`'s `variant?: 'list' | 'details'
| 'subcard'`; `forceRegister(candidateExternalId, email, password)`; the route constants built from
`CANDIDATE` / `CANDIDATE_PROT` with `CandAppHome: CANDIDATE`; the `contactSupport` button and support
mailto on the help page. The app root page lives **inside** the `(protected)` group today
(`(protected)/+page.svelte` served at `/candidate`), which is what lets D-08 and D-11 put H and the
"nothing to edit" screen behind the session gate without a new gate row.

### Reusable Assets
- `private.caller_entity_ids` — the definer helper both new RPCs sit on; reads the table.
- `upsert_answers` and the organization arm of the old RPC — the SQL side of GEN-02 largely exists.
- `EntityCard` with its `action` prop — H's card (D-13).
- The help page's support mailto, `…common.contactSupport` and `LogoutButton` — the "nothing to edit"
  screen's parts (D-11).
- 172's gate list, extracted gate component and second stored session.
- The shared axe scan core `tests/tests/utils/axeScan.ts`.
- `layout.tracking.test.ts`'s read-recording `url` Proxy — the guard pattern for O-4.

### Established Patterns
- **Contexts expose stable references and reactive accessors.** `userData` is stable; the new
  user-level accessors (user, entity list) are reactive and are read as `ctx.X` (D-17).
- **The request hook is a session gate by route id, not a role gate** (`appGates.ts`); role and entity
  decisions belong to the app's own layouts and actions. D-08, D-10 and D-11 keep that split.
- **Schema edits regenerate the single migration file**; `lint:check` asserts schema-migration parity
  (D-24).
- **Named-constraint refusals** (`idx_grants_one_candidate_editor`,
  `grants_user_scope_target_role_key`) are relied on by both `entityGrant.ts` copies; D-02 keeps them.
- **Populations are derived at run time**, never from a count in a planning document (D-20).

### Integration Points
- **RLS reads the token claim; the list RPC reads the table.** A grant written mid-session is listed at
  once but its entity row is readable only after the session refreshes (O-5); a revoked grant
  disappears from the list at once.
- **`DataRoot`:** the user's own entities must be provided to it for `EntityCard` (fact 11).
- **`passwordLogin(allowedGrants)`** and `_getBasicUserData`'s coarse role both read the gate constant
  (D-12).
- **Storage paths** carry the entity table name; the upload helper dispatches on type (D-18).
- **The perm E2E family shares one settings row**; the a11y scan must finish before the first perm
  setup replaces it (the ordering anchor in `playwright.config.ts`) — relevant to D-20 and D-21.

</code_context>

<specifics>
## Specific Ideas

- The operator's one overrule in this section, with the option's own words: "kinder, and the user can
  see which email they used. A new surface in seven locales with an axe entry; Phase 178 may want
  exactly this for the unproven-email case." The screen therefore shows the signed-in email and is
  built to be reused.
- `CAND-APP-PLAN.md` H: "If the user has grants for multiple entities, show this; else => I"; "Show a
  list of simple EntityCard for the user to select and mark that entity selected".
- Additional note 3 (operator): "In the party and alliance selectors, use a reusable component which
  renders the items using EntityCards (perhaps in a 'compact' variant if needed)" — see D-13.
- Additional note 2 (operator) is Phase 177's: entity election and constituency selectors filter by
  entity type against the election type, with the predicates centralised. Nothing to build here; do not
  add an entity-type predicate of this phase's own that 177 would have to reconcile — the served-types
  filter is 171's accessor.
- **Standing rules of the milestone** (`ROADMAP.md` § v2.16, inherited by this phase): the cardinal
  rule — no failing E2E test, no exemptions, a "did not run" counts as a failure — so E2E-03 is a
  closing criterion here; every user-facing string ships in all seven locales (`da, en, et, fi, fr, lb,
  sv`); every new or changed screen meets WCAG 2.1 AA and is reached by the axe scan; a criterion that
  says "user" or "entity" holds for candidates and for organizations unless it names one; nothing is
  deployed, so the schema, the settings shape, the routes and the renamed symbols change in place.
- **Roadmap success criteria for the phase**, with the chosen decisions applied:
  1. A user can hold editor grants on more than one entity in a project — two candidates, or a
     candidate and an organization — and sign in normally. The constraint lifted is the user-data RPC's
     ambiguity raise and the frontend's single-entity path; `idx_grants_one_candidate_editor` stays
     (D-02) (ENT-03).
  2. A user holding grants on several entities is shown H, one card per entity they may edit, and picks
     one; a user holding exactly one never sees it and lands on that entity's home (ENT-01).
  3. The user can switch entity at any time without signing out, and after the switch every page shows
     and saves the newly selected entity's data, never the previous one's (ENT-02).
  4. Selecting an organization loads that organization's own data, and saving for it succeeds as for a
     candidate; the writer no longer throws for a non-candidate entity (GEN-02). Proven at the writer,
     the store and the adapter (D-19), not through organization pages.
  5. An E2E spec covers a user with several grants choosing and switching entities, and the full E2E
     suite is green at close (E2E-02 in part, E2E-03).

</specifics>

<cross_phase>
## Cross-phase Notes and Obligations

- **O-1 → 178 (178-B1 NOTE).** The "password set" fact is to ride the user-data retrieval RPC. This
  phase does not deliver it; the user-level RPC's shape leaves room for it (D-03). F is the first gate
  and runs on user-level data, so the field belongs on the user-level read, not the one-entity read.
- **O-2 → 170.** Delete the `get_candidate_user_data` exemption line from `assert:no-candidate-app-names`
  (D-04). 170 should not hand-tune anything this phase replaces; every protected route constant and E2E
  URL moves a second time here, accepted by the sequencing and isolated as plan 3 (D-23).
- **O-3 ← 172, strictly in order.** 172 removes the terms-of-use field from the RPC and the writer
  before this phase reshapes both; 172's column-removal plan and this phase's schema plan touch the same
  function and the same generated types. **Schema edits are serial** across 171, 172, 173, 174, 175 and
  177: each regenerates the single migration file.
- **O-4 — tracking invariant.** The entity-level load reads `params`, so it reruns on an entity switch
  **by design**. It must **not** also read `url` tracked, or it reruns on every in-entity navigation and
  re-initialises the store — the `(located)` lesson (`CLAUDE.md` § Results Navigation Invariants). Any
  path or search read needed for a redirect target goes inside `untrack`. Guard it with a
  read-recording `url` Proxy test modelled on `layout.tracking.test.ts`. The same care applies to the
  user-level load.
- **O-5 → 174.** With D-02, claiming an invitation for a candidate that already has an editor fails on
  `idx_grants_one_candidate_editor`; 174 treats that as a **refusal**, not idempotent success. The list
  RPC reads the table, so a grant written by a claim is selectable without a token refresh — but RLS on
  the entity row reads the claim, so **the session is refreshed after a claim** before the entity read
  succeeds. 174-A3 (c) (general grant spec, overrule) writes against D-02 and D-05: only `(entity,
  editor)` grants on `candidate` or `organization` make an entity selectable here.
- **O-6 → 176.** The `candidateNoNomination` sign-out moves into the entity-level load here and is
  removed there. **The one-entity read must not assume a nomination exists.** Task state is per selected
  entity and hangs off the same entity-level store (D-17).
- **O-7 → 175.** Inherits a writer and a store that already serve organizations (D-19); it adds the
  pages, lifts the context's `ENTITY_TYPE.Candidate` question scope, and its E2E is where an
  organization save through the UI is first shown. Which writer method saves `name` and `short_name` is
  175's unless D-18's generalisation already covers it — record what was generalised in the summary.
- **O-8 → 179.** `findExistingCandidate`'s `.maybeSingle()` throws for a returning identity-provider
  user who holds two candidate grants (fact 14). 179 owns `identity-callback`; this phase files it as a
  **named input** (a todo or a line in the phase summary), not a fix.
- **O-9 → 177.** K's route prefix is the entity path of D-07; its writer is a generic-entity method on
  D-18's path; the card-list question of D-13 is shared.
- **O-10 → 178.** The gate order F → email → G → root → home holds; 178 prepends F to 172's list. The
  "nothing to edit" component (D-11) is what 178 shows a user whose email proved no invitation or whose
  claim produced no grant.
- **O-11 → 172-E2 / TOU-F01.** "Primary editor" is definite for candidates only while D-02 stands.
- **O-12 — E2E base.** The widened base (D-20) changes the app name in every base spec; the a11y scan
  and the perm family read the same settings row, so the widening lands before the scan entries are
  measured and the perm templates' inheritance is decided explicitly.
- **170 → every phase.** The stack is restarted once after the auth redirect allowlist changes;
  unrelated to this phase's work but a precondition of its E2E runs if 170 has just landed.

</cross_phase>

<deferred>
## Deferred Ideas

- **Remembering the last selected entity across sign-ins** (173-B3 (b)) — not built; a multi-entity user
  lands on H.
- **Nominations or status on the H cards** (173-C2 (b), (c)) — status is Phase 176's derived task state.
- **Several editors per candidate / a per-project one-candidate-per-user rule** (173-A1 (b), (c)) — the
  index stays.
- **Entity-scope roles other than `editor` making an entity selectable** (173-A4 (b)).
- **Filtering "served" in SQL** (173-A5 (b)) — a frontend display filter only.
- **Organization profile, questions and preview; the context's question-scope lift** — Phase 175.
- **Removing the `candidateNoNomination` sign-out; task state** — Phase 176.
- **The "password set" field on the user-data RPC** — Phase 178 (O-1).
- **`identity-callback` for a user with two candidate grants** — Phase 179 (O-8).
- **A dev-seed template that carries users and grants** (173-E1 (c)) — a feature, not a fixture.
- **Running the new selection spec three times in the closing gate** (173-F2 (b)) — not chosen; the
  cardinal rule still treats any intermittent failure of it as a defect.

### Ambiguities found while reconciling (for the operator or the planner)

- **173-B6 says "Phase 170 rules on the name" of the `role: 'candidate'` literal; 170-A contains no
  such decision**, and neither `CANDIDATE_GRANTS` nor the literal is in 170-C2's pattern list. Resolved
  here as "this phase names both" (D-12, R14).
- **`userNotAuthorized` under the 173-B5 overrule** is not addressed by the filled document. Recommended
  reading in D-11; flagged.
- **Terms of use before "nothing to edit"** (D-11, R5): the order is carried over from the ★ text, which
  was written for a sign-out.
- **Additional note 1** renames `preregister` to `register` without naming the phase that does it; the
  legacy route constants this phase's plan 3 passes through are read from the tree.
- **173-A2 ★ keeps both RPCs `SECURITY INVOKER`; the 178-B1 NOTE wants a fact that only a definer can
  read bundled into the same RPC.** Compatible only if 178 reads it through a private definer helper, as
  `caller_entity_ids` already is; recorded under O-1, not decided here.

</deferred>

---

*Phase: 173-multi-entity-grants-entity-selection*
*Context gathered: 2026-10-05 from the operator-filled `.planning/v2.16-DISCUSSION-POINTS.md`*
