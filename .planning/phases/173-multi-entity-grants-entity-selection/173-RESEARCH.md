# Phase 173: Multi-Entity Grants & Entity Selection - Research

**Researched:** 2026-10-06
**Domain:** Supabase schema and RPCs (grant model), SvelteKit 2 route tree and server-load dependency tracking, Svelte 5 context and store generalisation, Playwright E2E fixtures
**Confidence:** HIGH for the tree as it stands and for the SvelteKit and PostgreSQL mechanics (each measured this session); MEDIUM for everything Phases 171 and 172 will have changed by the time this phase's plans run (read from their plans, not from a tree)

<user_constraints>
## User Constraints (from CONTEXT.md)

Copied from `173-CONTEXT.md` (`<decisions>` and `<deferred>`). The text is verbatim; the only change is that the sub-headings inside each part sit one level deeper so they nest under the three headings below. Where a decision cites a name as it stood before Phase 170, the *Name map* in `173-CONTEXT.md` and the measured names in this file apply.

### Locked Decisions

Decision ids map one-to-one onto the discussion document's Phase 173 ids, given in parentheses.
24 decisions → D-01..D-24. Every decision below is locked; the planner does not re-open them. Only the
chosen option is stated; the non-chosen options are dead. Evidence in the discussion document cites
today's `candidate` names; this file uses today's names where it cites the tree and the *Name map* gives
the names expected after Phase 170.

#### 0 — Factual baseline

- **D-01 (173-0.1):** Accept all 16 facts of 173-0 as the phase's factual baseline; they are restated
  under `<factual_baseline>`. Fact 1 contradicts the roadmap and `PROJECT.md`; facts 6, 8 and 14 are not
  in the roadmap and each changes a plan. The facts are a 2026-10-04 snapshot at HEAD `df0cec944`, taken
  **before** Phases 170, 171 and 172 run; the planner re-reads the tree.

#### A — Schema and RPCs (ENT-03, GEN-02)

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

#### B — Selected-entity encoding (ENT-01, ENT-02)

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

#### C — Screen H, switching and drafts

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

#### D — Data writer and types (GEN-02)

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

#### E — Tests

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

#### F — Plan shape and gate

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

#### Reconciliations

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

### Deferred Ideas (OUT OF SCOPE)

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

#### Ambiguities found while reconciling (for the operator or the planner)

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
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description (as REQUIREMENTS.md states it) | Research support |
|----|-------------|------------------|
| ENT-01 | A user holding grants on several entities chooses which one to edit from a list of entity cards; a user holding one grant skips the screen (H). | R-3 (the root's three outcomes), R-4 (`EntityList` already takes a per-card `action`; what `EntityCard` renders in this app and what must be suppressed), R-2 (route shape) |
| ENT-02 | The user can switch the selected entity later without signing out. | R-2 (selection is the URL; the entity-level load reruns on a param change and on nothing else), R-4 (switch item, per-entity drafts, focus and announce) |
| ENT-03 | One user can hold editor grants on more than one entity in a project; the single-entity assumptions in the user-data RPC (its `ERR_ENTITY_IDENTITY_AMBIGUOUS` raise) and in the frontend are lifted. `idx_grants_one_candidate_editor` stays. | R-1 (two RPCs, proven in a throwaway database; every census, gate and artifact the swap moves), R-5 (frontend single-entity assumptions as commands) |
| GEN-02 | The data writer and the user-data RPC work for every entity type the Contestant app serves, not only candidates. | R-1 (the organization arm of both RPCs), R-5 (the five candidate-only points and the one map that replaces them), R-6 (how "saving succeeds for an organization" is proven without organization pages) |

E2E-02 (in part) and E2E-03 are closing criteria: R-6 and *Validation Architecture*.
</phase_requirements>

## How to read this file

**Which tree each fact describes.** Phase 170 has executed. Phase 171 was executing while this file was written (its plan 01 landed two commits during the session). Phase 172 has not started. Each fact carries one of these marks:

| Mark | Meaning |
|---|---|
| `[VERIFIED: tree]` | Read with `Read`/`git grep` this session on the working tree at `b88b7f4c9` (Phase 170 closed, nothing of 171 or 172 applied). Quotes are verbatim. |
| `[VERIFIED: tree @a4b408eb7]` | Read from commit `a4b408eb7` (171-01 Task 2, in flight). Phase 171 may still amend it. |
| `[VERIFIED: kit source]` | Read from the installed `node_modules/@sveltejs/kit` (version 2.70.3) this session. |
| `[VERIFIED: throwaway PG]` | Run this session against a private PostgreSQL 17.6 (Homebrew `initdb`, port 54398, in the session scratchpad) holding the repository's own `00001_initial_schema.sql` at `b88b7f4c9` behind stubbed `auth`/`storage` schemas. It was stopped and deleted afterwards. The shared stack was not written to. |
| `[ASSUMED: PLAN 171-0N]` / `[ASSUMED: PLAN 172-0N]` | Read from that plan's text. It describes the tree this phase will meet, and nothing has verified it. **The planner's first task re-measures every one of these.** |
| `[ASSUMED]` | Reasoning or training knowledge, not checked this session. |

**Anchors.** No line numbers. Every in-repo value is cited as file path plus symbol or a verbatim quote, findable with `git grep -F`. Every population is a command to re-run; a number beside it is a snapshot from 2026-10-06 and is never a target.

**Shell.** Every command block starts with `export PATH="$HOME/.nvm/versions/node/v24.21.0/bin:$PATH"`. `git grep -E` on this host does not understand `\b`; use `git grep -P`. In `zsh`, `echo ====` fails (`=` expansion); use another separator.

**What was run.** Read-only `git grep`, `Read`, `node -e` over the name gate's own regular expressions, and the throwaway PostgreSQL above. No `git add`/`commit`/`checkout`/`stash`, no E2E run, no `yarn dev`, no `yarn db:*`, no write to the shared stack, no file written inside the repository.

## Summary

The database side is small and was proven end to end this session. Two `LANGUAGE sql STABLE SECURITY INVOKER` functions replace `get_candidate_user_data`: `get_user_entities(p_project_id)` returning **one `jsonb` object** `{ "entities": [...] }`, and `get_entity_user_data(p_project_id, p_entity_type, p_entity_id)` returning at most one row. Both sit on the existing `private.caller_entity_ids`. Run against the repository's own schema, they left the `07-rpc-security` definer census unchanged, returned exactly one row with an empty array for a user with no grant (which is what lets Phase 178 add a per-user field without changing cardinality), excluded `admin`-role and faction grants, and — the property the route design depends on — **listed an entity exactly when the one-entity read returns it**, in both stale-token directions.

The frontend side is larger than the roadmap suggests, and three facts found on the tree shape the plans. **(1)** `entityType` and `entityId` are already members of `ROUTE_PARAMS` and are used by no route, and `getRoute` already carries every route param of the current page into every link it builds, so "call sites do not pass them" holds with no builder change — but a link to an entity route built from a page that has no entity in its URL (the app root, Help, Privacy) **throws** `Missing parameter 'entityType'`, and `ContestantNav` renders exactly such links on those pages for a signed-in user. **(2)** The literal path `/contestant/candidate/…` is **reported by Phase 170's name gate** as an old `/candidate` URL (measured with the gate's own expression), so the route shape D-07 locks cannot be written down in a test, a comment or a docs page until the gate's lookbehind admits `contestant`. **(3)** A reusable card list already exists: `EntityList` takes `cards: Array<EntityCardProps>`, and each card's `action` is a URL, a handler or `false` — so one component serves H (links) and Phase 177's selectors (handlers) without baking in navigation. What is missing is on `EntityCard`: on H it would throw `DataNotFoundError`, because `results.cardContents.candidate` names a question in the E2E base dataset and the app root has no question data.

Two existing behaviours need to be known before planning rather than discovered during it. `userNoCandidate` is unreachable today: the writer throws on zero rows, so a user with no entity leaves as `loginFailed`. And `provideEntityData` **resets** all four entity collections, so the entities H shows must be provided by H itself, not by a layout above it.

**Primary recommendation:** Build it as D-23's five plans, with the user-level server load deliberately reading `params.entityType` and `params.entityId` (and no `url` property) so the entity list is fresh at every point a redirect is decided; keep `ContestantAppHome` as the app root and add one new route key for the entity home; resolve entity-less paths through one matcher-guarded rest route inside `(protected)`; use the existing `EntityList`; and amend the name gate's `/candidate URL` lookbehind in the route plan, with a fixture line, as a recorded pattern change.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Which entities the caller edits | Database (`private.caller_entity_ids`, table read) | — | Grants live in `public.grants`, revoked from every API role; only a definer helper can read them, and it already exists |
| Entity row visibility and write authority | Database (RLS over the JWT `grants` claim through `user_can`) | — | Unchanged by this phase; both new RPCs are `SECURITY INVOKER` so RLS still decides |
| Served-types filter | Frontend server (user-level load) | `@openvaa/app-shared` accessor | D-06: a display filter applied once where the list enters the frontend; the accessor is Phase 171's |
| Session gate | Frontend server (`hooks.server.ts` `appGateHandle`) | — | Decided by route id; inserting route segments changes no rule in it |
| User-level gates (terms of use) | Frontend server (user-level `+layout.server.ts`) | Browser (gate view) | Phase 172's ordered list; runs before any entity is read |
| Root outcome (nothing to edit / redirect / H) | Frontend server (root `+page.server.ts`) | Browser (the two views) | A redirect must be decided on the server; the views are plain pages |
| Selected entity | Browser URL (route params) → Frontend server (entity-level `+layout.server.ts`) | — | D-07: the selection is a property of the URL |
| Entity data, drafts, save | Browser (contestant context, user-data store) | API adapter (`SupabaseDataWriter`) | Drafts are `localStorage`; saves go through the writer with the caller's session |
| Image and answer file upload | Storage (path-based policies) | API adapter | `storage_path_can` already maps `candidates` and `organizations` path segments |

## Standard Stack

No package is added, removed or upgraded by this phase. The work uses what the tree holds.

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@sveltejs/kit` | 2.70.3 `[VERIFIED: kit source — node_modules/@sveltejs/kit/package.json]` | Route tree, param matchers, server loads, `redirect` | Already the app framework; its dependency tracking is the mechanism R-2 relies on |
| `svelte` | 5.57.1 `[VERIFIED: tree — node_modules/svelte/package.json]` | Runes-based context and store | Runes forced on for the whole app |
| PostgreSQL | 17.6 (local stack image `supabase/postgres:17.6.1.171`) `[VERIFIED: docker ps this session]` | Functions, RLS | Project ruling: migrations target PG17 |
| `zod` (through `@openvaa/app-shared` and the adapter's `utils/`) | as installed | Validating the `jsonb` answer of `get_user_entities` | `assert:adapter-casts` forbids asserting `Json` into an application shape |
| Playwright, `@axe-core/playwright`, Vitest, pgTAP | as installed | The four test layers | Existing harness; see *Validation Architecture* |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `get_user_entities` returning one `jsonb` object | `RETURNS SETOF`/`TABLE` of entity rows | Dead by D-03: zero rows for a user with no entity leaves nowhere to put Phase 178's per-user field |
| A matcher-guarded rest route as the entity-less resolver | Re-pointing every test and accepting 404 for entity-less paths | Loses "a `redirectTo` carried through login still lands" and forces every single-entity spec to look an entity id up; see R-2 |
| The existing `EntityList` | A new card-list component | Nothing to gain: `EntityList` already takes per-card `action` |

**Installation:** none.

## Package Legitimacy Audit

This phase installs no external package, so there is nothing to audit.

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

## Focus Areas

The seven questions the orchestrator asked, in its order. The standard sections further down (*Architecture Patterns*, *Don't Hand-Roll*, *Common Pitfalls*, *Code Examples*) summarise and cross-reference these.

---

## R-1 — Schema and RPCs (173-A)

### R-1.1 The grant model as it stands

**The table.** `apps/supabase/supabase/schema/300-auth-tables.sql`, `CREATE TABLE public.grants` `[VERIFIED: tree]`:

- `CONSTRAINT grants_user_scope_target_role_key UNIQUE NULLS NOT DISTINCT (user_id, scope, target_type, target_id, role)` — one user cannot hold the same grant twice.
- `CREATE UNIQUE INDEX idx_grants_one_candidate_editor ON public.grants (target_id) WHERE scope = 'entity' AND target_type = 'candidate' AND role = 'editor';` — one editor per candidate. **Kept (D-02).**
- The comment above that index, which this phase must rewrite because its last clause describes behaviour being deleted: *"A candidate has at most one editor, because a candidate-scope user is the candidate. Organizations admit several editors, and an `admin`-role entity grant is outside the index. Nothing at write time stops one user editing two candidates in one project; get_candidate_user_data raises on that when it is read. A second user's editor grant on a candidate is refused naming this index, while an exact duplicate grant is refused naming grants_user_scope_target_role_key, which is checked first."*

**Where `ERR_ENTITY_IDENTITY_AMBIGUOUS` is raised.** One site in SQL, `apps/supabase/supabase/schema/503-entity-rpcs.sql`, inside `public.get_candidate_user_data` `[VERIFIED: tree]`:

```sql
  v_entity_ids := ARRAY (SELECT private.caller_entity_ids (p_project_id, p_entity_type));
  IF cardinality(v_entity_ids) > 1 THEN
    RAISE EXCEPTION 'the caller holds an editor grant on more than one % in this project', p_entity_type
      USING ERRCODE = 'P0001', HINT = 'ERR_ENTITY_IDENTITY_AMBIGUOUS';
  END IF;
```

Every other occurrence is a test or prose. Population: `git grep -n -F "ERR_ENTITY_IDENTITY_AMBIGUOUS" -- ':!.planning'` (2026-10-06: the schema file, the generated migration, `36-entity-identity.test.sql`, `.claude/skills/database/SKILL.md`, the docs page `developers-guide/backend/authentication/+page.md`).

**How the token carries grants.** `public.custom_access_token_hook` in `301-auth-functions.sql` emits one object per `public.grants` row of the user, with exactly the keys `scope`, `target_type`, `target_id`, `role`, into the `grants` claim, with no cap and no project filter `[VERIFIED: tree — "jsonb_build_object('scope', g.scope::text, 'target_type', g.target_type::text, 'target_id', g.target_id, 'role', g.role::text)"]`. It runs on token issue and refresh; `jwt_expiry = 3600` in `apps/supabase/supabase/config.toml` `[VERIFIED: tree]`.

**What reads the claim and what reads the table.**

| Reader | Reads | Anchor |
|---|---|---|
| Every RLS policy, through `public.user_can` | the **claim** only — `grants_claim := (SELECT auth.jwt() -> 'grants');` | `301-auth-functions.sql`, `user_can` `[VERIFIED: tree]` |
| `authenticated_select_candidates` / `authenticated_select_organizations` (entity disjunct) | the claim: `user_can ('entity', id, 'entity.read_answers', '<type>'::public.entity_type)` | `302-rls.sql` `[VERIFIED: tree]` |
| `entity_update_own_candidates` / `entity_update_own_organizations` | the claim: `user_can ('entity', id, 'entity.edit_answers', '<type>'::public.entity_type)` | `302-rls.sql` `[VERIFIED: tree]` |
| Storage policies, through `storage_path_can` | the claim, with the path's type segment mapped `'candidates' → 'candidate'`, `'organizations' → 'organization'` | `400-storage.sql` `[VERIFIED: tree]` |
| `private.caller_entity_ids(p_project_id, p_entity_type)` | the **table** — `FROM public.grants g WHERE g.user_id = (SELECT auth.uid()) AND g.scope = 'entity' AND g.role = 'editor' AND g.target_type = p_entity_type` plus an inline per-type project probe; `SECURITY DEFINER`, `search_path = ''` | `301-auth-functions.sql` `[VERIFIED: tree]` |
| The frontend's app-entry gate and coarse role | the claim, decoded in `readGrants` | `apps/frontend/src/lib/auth/roles.ts` `[VERIFIED: tree]` |

So an entity is in the caller's world when **both** hold: the table says the caller edits it (the helper) and the claim lets the caller read its row (RLS). The two can disagree for up to an hour after a grant is written or removed. R-1.2 measures what the new functions do in each direction.

**The organization side already exists in SQL.** `entity_update_own_organizations` is the same shape as the candidate policy; the organizations column grant allows `name, short_name, info, color, image, subtype, custom_data, answers, confirmed` (`303-column-grants.sql`); `upsert_answers` writes `public.organizations` for `p_entity_type = 'organization'` `[VERIFIED: tree]`. Nothing in SQL has to change for an organization editor to save.

### R-1.2 The two functions — shape, and what they were measured to do

**Recommended definitions** (both ran as written against the repository's schema `[VERIFIED: throwaway PG]`; they already omit `terms_of_use_accepted`, which `[ASSUMED: PLAN 172-07]` removes from the old function before this phase starts):

```sql
-- get_user_entities: every entity the caller edits in ONE project, as ONE object.
CREATE OR REPLACE FUNCTION public.get_user_entities (p_project_id uuid) RETURNS jsonb
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = '' AS $$
  SELECT jsonb_build_object(
    'entities',
    COALESCE(
      (
        SELECT jsonb_agg(e.entity ORDER BY e.type_order, e.id)
        FROM (
          SELECT 1 AS type_order, c.id,
                 jsonb_build_object('entity_type', 'candidate', 'id', c.id,
                                    'first_name', c.first_name, 'last_name', c.last_name,
                                    'short_name', c.short_name, 'image', c.image, 'color', c.color,
                                    'confirmed', c.confirmed) AS entity
          FROM public.candidates c
          WHERE c.project_id = p_project_id
            AND c.id IN (SELECT private.caller_entity_ids (p_project_id, 'candidate'))
          UNION ALL
          SELECT 2, o.id,
                 jsonb_build_object('entity_type', 'organization', 'id', o.id, 'name', o.name,
                                    'short_name', o.short_name, 'image', o.image, 'color', o.color,
                                    'confirmed', o.confirmed)
          FROM public.organizations o
          WHERE o.project_id = p_project_id
            AND o.id IN (SELECT private.caller_entity_ids (p_project_id, 'organization'))
        ) e
      ),
      '[]'::jsonb
    )
  );
$$;

REVOKE EXECUTE ON FUNCTION public.get_user_entities (uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_user_entities (uuid) TO authenticated;

-- get_entity_user_data: the editable row of ONE entity, or no row.
CREATE OR REPLACE FUNCTION public.get_entity_user_data (
  p_project_id uuid,
  p_entity_type public.entity_type,
  p_entity_id uuid
) RETURNS TABLE (
  id uuid, project_id uuid, name jsonb, short_name jsonb, info jsonb, color jsonb, image jsonb,
  sort_order integer, subtype text, custom_data jsonb, answers jsonb, first_name text, last_name text
) LANGUAGE sql STABLE SECURITY INVOKER SET search_path = '' AS $$
  SELECT c.id, c.project_id, NULL::jsonb, c.short_name, c.info, c.color, c.image, c.sort_order,
         c.subtype, c.custom_data, c.answers, c.first_name, c.last_name
  FROM public.candidates c
  WHERE p_entity_type = 'candidate' AND c.id = p_entity_id AND c.project_id = p_project_id
    AND c.id IN (SELECT private.caller_entity_ids (p_project_id, 'candidate'))
  UNION ALL
  SELECT o.id, o.project_id, o.name, o.short_name, o.info, o.color, o.image, o.sort_order,
         o.subtype, o.custom_data, o.answers, NULL::text, NULL::text
  FROM public.organizations o
  WHERE p_entity_type = 'organization' AND o.id = p_entity_id AND o.project_id = p_project_id
    AND o.id IN (SELECT private.caller_entity_ids (p_project_id, 'organization'));
$$;

REVOKE EXECUTE ON FUNCTION public.get_entity_user_data (uuid, public.entity_type, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_entity_user_data (uuid, public.entity_type, uuid) TO authenticated;
```

Design points, each a decision the SQL already makes:

- **No parameter carries a `DEFAULT`.** The old function defaulted `p_entity_type` to `'candidate'`; `21-entity-organization.test.sql` pins "without a project raises undefined_function, so p_project_id carries no DEFAULT" and the same assertion now belongs on both new functions.
- **`LANGUAGE sql`, not `plpgsql`.** There is no branch left once the raise is gone. A `sql` function is outside `plpgsql_check`, so `supabase db lint` has nothing to say about it.
- **The list carries only `candidate` and `organization` (D-06).** Factions and alliances have no arm.
- **Order.** `ORDER BY type_order, id` makes the array deterministic. D-14's display order (alphabetical by the displayed name, per locale) is the frontend's.
- **`REVOKE … FROM PUBLIC, anon`** follows `get_entity_basic_data`. The old function only granted to `authenticated` and relied on the hook-free default; state the revoke so `anon` is refused by privilege rather than by an empty result.
- **No row, never a raise**, for "not yours", "wrong type for this id", "another project" and "does not exist" alike — the same no-oracle rule `get_entity_basic_data` documents, and what D-10 needs.

**Measured behaviour** `[VERIFIED: throwaway PG]`. Fixture: project A with candidates C1, C2, C3 and organization O1; project B with candidate C4 and an organization sharing C1's uuid; user U1 holding editor grants on C1, C2, O1, C4, an `admin`-role grant on C3 and an editor grant on a faction; user U0 holding nothing. Claims were projected from the table exactly as the hook does, then altered where a row says so.

| # | Case | `get_user_entities` | `get_entity_user_data` |
|---|---|---|---|
| 1 | U0, no grants | **1 row**: `{"entities": []}` | — |
| 2 | U1, project A, claim matches table | `candidate:c1, candidate:c2, organization:01` | own candidate: 1 row; own organization: 1 row with its `name` |
| 3 | U1, project B | `candidate:c4` | C4 asked under project A: 0 rows |
| 4 | `admin`-role grant on C3 | not listed | 0 rows |
| 5 | faction editor grant | not listed | type `faction`: 0 rows |
| 6 | type/id mismatch (`organization` + C1's uuid, which names an organization in project B) | — | 0 rows |
| 7 | nonexistent id | — | 0 rows |
| 8 | **Grant in the table, not yet in the claim** (written after the token was issued) | **not listed** | **0 rows** |
| 9 | **Grant removed from the table, still in the claim** | **not listed** | **0 rows** — while a direct `SELECT` on `candidates` still returns the row to that token |
| 10 | `anon` | `permission denied for function get_user_entities` | — |
| 11 | Definer census of `07-rpc-security` (`public`, `prosecdef`, executable by `authenticated`), before and after creating both functions | identical: `get_entity_basic_data,project_open_for_voters,storage_path_can,storage_path_is_public,user_can,user_has_account_grant` | |

Rows 8 and 9 are the ones the route design leans on:

- **The list and the read always agree.** Both are "table ∩ RLS-readable", so an entity the root redirects to is an entity the entity-level load can read. That is what makes the root's single-entity redirect loop-free (R-3).
- **A revoked grant disappears at once** (row 9), as D-10 requires. Row 9 also records a residual that is not this phase's: until the token refreshes, the revoked user can still read and write the entity row through PostgREST directly, because RLS reads the claim. Phase 174's O-5 ("the session is refreshed after a claim") covers the other direction, row 8.
- **CONTEXT.md's "*Integration Points*" sentence** — "a grant written mid-session is listed at once but its entity row is readable only after the session refreshes" — is **not** what an `INVOKER` list does: row 8 shows it is *not listed* until the refresh. Listing it would need a `LEFT JOIN` from the helper's ids, which yields a card with no name and a redirect target the read refuses. Do not build that; record the difference for Phase 174.

### R-1.3 Room for Phase 178's "password set" (O-1)

Adding a per-user scalar later is one private definer helper plus one key in `jsonb_build_object`; the public function's signature, return type and cardinality do not change. Demonstrated `[VERIFIED: throwaway PG]` with `private.caller_password_set()` reading `auth.users.encrypted_password` for `auth.uid()`: a user with no entity got `{"entities": [], "password_set": true}`, and the public definer census was still the six names above. Two things Phase 178 must carry, recorded here so this phase does not close the door:

- The helper lives in `private`, not `public`, so no census in `07-rpc-security` moves; the "ten policy-only helpers" assertion there names its members and is untouched by an eleventh private function.
- `301-auth-functions.sql` ends its private section with `GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA private TO anon, authenticated, service_role;` and notes *"The statement reaches only the functions defined before it."* A private helper defined in a later file states its own `GRANT EXECUTE … TO authenticated`.
- **This phase's obligation is only the return shape**: one object, with the per-entity facts kept off the top level so a new top-level key cannot collide.

### R-1.4 Everything the swap moves

Re-derive with `git grep -n -e get_candidate_user_data -- ':!.planning'` (2026-10-06: 51 lines in 17 files, the generated migration included).

| What | File and anchor | What changes | Mark |
|---|---|---|---|
| The function and its header | `schema/503-entity-rpcs.sql` — the file header line `-- - get_candidate_user_data() - …` and the block from `-- get_candidate_user_data: the caller's own entity of one type, in ONE project` to its `GRANT` | deleted; the two functions of R-1.2 added, with header comments in present tense | `[VERIFIED: tree]` |
| The helper's comment | `schema/301-auth-functions.sql` — "get_candidate_user_data calls it to answer \"which entity am I\"" and the function-list line `private.caller_entity_ids(uuid, entity_type)` | reworded to name the two callers | `[VERIFIED: tree]` |
| The index comment | `schema/300-auth-tables.sql` — quoted in R-1.1 | last clause rewritten (D-02) | `[VERIFIED: tree]` |
| The generated migration | `apps/supabase/supabase/migrations/00001_initial_schema.sql` | **regenerated** with `yarn schema:regenerate`, never hand-edited; `yarn assert:schema-migration-parity` is a link of `lint:check` | `[VERIFIED: tree — package.json]` |
| Definer censuses | `tests/database/07-rpc-security.test.sql`, Section 8c | **do not move** (both functions are `INVOKER`). Phase 171 changes the anon census from five to six and the authenticated one with it `[ASSUMED: PLAN 171-02]`; this phase asserts they are unchanged from whatever 171 left | `[VERIFIED: throwaway PG]` row 11 |
| "Which entity am I" | `tests/database/36-entity-identity.test.sql` — `plan (20)`, the sections "Who the caller is", "Catalog", "One editor per candidate", the helper `test_seed_identity_grants` from `00-helpers.test.sql` | rewritten per D-22; the two index assertions (`'duplicate key value violates unique constraint "idx_grants_one_candidate_editor"'` and `'idx_grants_one_candidate_editor is a unique partial index on grants'`) stay; the catalog assertion `'get_candidate_user_data runs with the caller''s rights'` becomes one per new function; `plan (N)` recounted | `[VERIFIED: tree]` |
| Output-shape pins | `tests/database/21-entity-organization.test.sql` — `'get_candidate_user_data declares 14 output columns'`, `'get_candidate_user_data returns no organization output column'`, Section 8 "get_candidate_user_data answers for ONE project, named by the caller", and the `undefined_function` assertion | re-pointed to `get_entity_user_data` (13 columns once 172-07 has removed one `[ASSUMED: PLAN 172-07]`); the no-`DEFAULT` assertion added for `get_user_entities` | `[VERIFIED: tree]` |
| Generated types | `packages/supabase-types/src/database.ts` | **regenerated** with `yarn db:types` against a database reset after the regenerated migration; `get_user_entities` appears with `Returns: Json` | `[VERIFIED: tree]` / `[ASSUMED]` for the generated shape |
| Nullability override | `packages/supabase-types/src/database.overrides.ts` — the member keyed `get_candidate_user_data`, a `WithReturns<…, Nullable<…>>` naming the columns `first_name`, `last_name`, `subtype`, `sort_order` and `terms_of_use_accepted` | renamed to `get_entity_user_data`; the column list is whatever 172-07 left minus nothing new. `get_user_entities` returns `jsonb`, is **not** a `RETURNS TABLE` function and gets no entry | `[VERIFIED: tree]` |
| Nullability artifact | `packages/supabase-types/RPC-NULLABILITY.md` — the DERIVED region line naming `get_candidate_user_data  (RETURNS TABLE …)`, the bullet `get_candidate_user_data.first_name — …`, and section `## 3. \`get_candidate_user_data\` — 14 columns, 5 overridden, 9 no-change` | DERIVED region regenerated with `node scripts/assert-rpc-return-nullability.mjs --write` (which "MERGES, IT DOES NOT CLOBBER"); the hand-written section and bullet rewritten by hand — check 1b of the gate fails until each harvested column has a disposition row | `[VERIFIED: tree]` |
| Project-scoping guard | `scripts/assert-project-scoped-queries.mjs` — `PROJECT_SCOPED_RPCS`, the entry `get_candidate_user_data: 'requires p_project_id',` | replaced by `get_user_entities: 'requires p_project_id'` and `get_entity_user_data: 'requires p_project_id'`; check 4 then requires a `p_project_id` key at both call sites | `[VERIFIED: tree]` |
| Schema lint | `apps/supabase/scripts/lint-schema.mjs` (checks 0013, 0001, 9001) | **nothing moves**: no table, foreign key or policy is added. Run it anyway; it reads the applied database | `[VERIFIED: tree]` |
| `supabase db lint` | `plpgsql_check` over `public` | one `plpgsql` function leaves, two `sql` functions arrive; nothing to add | `[ASSUMED]` that `plpgsql_check` skips `sql` functions |
| The frontend caller | `apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts` — `.rpc('get_candidate_user_data', { p_project_id: this.projectId, p_entity_type: 'candidate' })` — and `supabaseDataWriter.test.ts` (`'calls get_candidate_user_data RPC and returns structured data'` and the "project scoping" block) | must switch **in the schema plan**, because the regenerated types no longer declare the old function and the frontend would not typecheck. See R-1.6 | `[VERIFIED: tree]` |
| Skills | `.claude/skills/database/SKILL.md` — Auth Patterns § 9 ("Which entity am I") and the change-log paragraph; `.claude/skills/database/schema-reference.md` — the `idx_grants_one_candidate_editor` paragraph and the two function-table rows | rewritten (plan 5 per D-23, or with the schema plan) | `[VERIFIED: tree]` |
| Docs | `apps/docs/src/routes/(content)/developers-guide/backend/authentication/+page.md` — the three bullets starting "`public.get_candidate_user_data(p_project_id, p_entity_type)` returns…", "If the caller holds editor grants on more than one entity…", and "The Contestant App loads its candidate through…" | rewritten | `[VERIFIED: tree]` |

### R-1.5 The gate exemption this phase deletes — and what it drags with it

`scripts/assert-no-candidate-app-names.mjs` `[VERIFIED: tree]`:

```js
/** The exemption list. Exactly two entries; each is masked before matching. */
const EXEMPT = [
  /get_candidate_user_data/g, // the user-data RPC — see phase 173
  /invite-candidate/g // the invitation Edge Function — see phase 174
];
```

Delete the first entry. Three consequences that are easy to miss:

1. **The comment and the header say "two".** `"Exactly two entries"` above the list and `"EXEMPTIONS: exactly two names"` in the file's docblock become "one".
2. **The gate's own fixture names the function twice**, and D-24's zero-hit grep excludes only `.planning/`. `scripts/fixtures/assert-no-candidate-app-names.input.ts` holds `const e02 = rpc('get_candidate_user_data') && data.candidateUserData;` (a POSITIVE line: an app-level name beside an exempt name) and `const n10 = rpc('get_candidate_user_data');` (a NEGATIVE line). The sibling `.expected.ts.violations` lists findings as `path:line: name`, so **edit both lines in place and delete neither** — a deleted line shifts every later expectation. `e02` keeps its finding if the exempt name beside it becomes `invite-candidate`; `n10` becomes any other non-reported form. `node scripts/assert-no-candidate-app-names.mjs --self-test` must still pass.
3. **No pattern of the gate matches the snake-case name.** The patterns are case-sensitive camel-case forms (`/candidateUserData/`, `/CandidateUserData/`); none matches `get_candidate_user_data`. Removing the mask therefore reports nothing new — the exemption was declarative. What enforces the name's absence is D-24's grep, not the gate.

The same fixture holds `const n21 = 'userNoCandidate' ?? 'candidateNoNomination';`, which the recommended fourth grep of D-24 would hit. Edit it in place in the plan that retires `userNoCandidate`.

### R-1.6 What the adapter does with the two functions

- **`get_user_entities`** returns `Json`. Narrow it with a zod schema in the adapter's `utils/` (the pattern every other JSON read uses) and never with a cast: `scripts/assert-adapter-casts.mjs` fails on `as Json as unknown as`, and Phase 171 sets the same rule for its own `jsonb` function `[ASSUMED: PLAN 171-02, PROH-171-07]`. A malformed answer is a failed read (`loginFailed`), not an empty list — an empty list would send a user with entities to the "nothing to edit" screen.
- **`get_entity_user_data`** is called with `.maybeSingle()`. Zero rows then arrive as `data: null` with no error, which is "not yours" (D-10: redirect to the root). The current code uses `.single()` and treats zero rows as an error `[VERIFIED: tree — "if (error || !entityRow) throw new Error(\`Failed to load candidate data: …"]`.
- **Keep the defence-in-depth project comparison** the current reader makes (`if (entityRow.project_id !== this.projectId) throw …`), with its message reworded for an entity.
- **The interim shim in the schema plan.** Plan 1 deletes the old function while the route tree and the writer's public shape are still single-candidate. The smallest change that keeps behaviour identical: `_getContestantUserData` asks `get_user_entities`, keeps the `candidate` entries, throws unless there is exactly one, then reads it with `get_entity_user_data`. Zero and several both throw, which the protected load already turns into `loginFailed` — exactly what the missing row and the raise produce today.

---

## R-2 — Selected-entity encoding (173-B1: `[entityType]/[entityId]`)

### R-2.1 What the route builder and the hook already do

- **`entityType` and `entityId` are already route params and nothing uses them.** `apps/frontend/src/lib/routes/params.ts`: `export const ROUTE_PARAMS = ['categoryId', 'electionTab', 'entity', 'entityId', 'entityTab', 'entityType', 'id', 'jobId', 'questionId'] as const;` `[VERIFIED: tree]`. The dynamic route directories on the tree use `questionId`, `categoryId`, `electionTab`, `entityTab`, `entity`, `id`, `jobId`, `collection` only (`find apps/frontend/src/routes -type d -name '*\[*'`). The one textual hit for the pair is a stale usage example in `EntityCard.svelte`'s docstring.
- **`getRoute` already fills them.** `apps/frontend/src/lib/contexts/app/getRoute.svelte.ts` builds with `buildRoute(options, { params, route, url })` from `page`, and `buildRoute` merges `filterPersistent(parseParams(current))`, which keeps every key for which `isRouteParam(key)` is true `[VERIFIED: tree]`. On a page under `[entityType]/[entityId]`, every `getRoute.current('ContestantAppProfile')` therefore resolves with the current entity, and no call site changes. D-07's "call sites do not pass them" needs no builder work.
- **The other side of that coin: off an entity page it throws.** SvelteKit's `resolve_route` throws `Missing parameter '<name>' in route <id>` for a required param with no value `[VERIFIED: kit source — src/utils/routing.js, resolve_route]`. `ContestantNav.svelte` renders `getRoute.current('ContestantAppProfile')`, `…Questions`, `…Preview`, `…Settings` whenever `contestantCtx.isAuthenticated`, and it is mounted by `routes/contestant/+layout.svelte` on **every** contestant page — the root, Help, Privacy, password reset `[VERIFIED: tree]`. After the move those four links must be rendered only when the URL carries an entity. See P-1.
- **Server code passes no `current`.** `buildRoute({ route, locale })` in a load or an action has no page to read from, so an entity route built on the server must pass both params explicitly.
- **The request hook needs no new rule.** `appGateHandle` in `hooks.server.ts` decides from `route.id` with `resolveAppGate`, `isProtectedRoute` (whole-segment match on `(protected)`) and `isApiRoute` `[VERIFIED: tree]`. `/contestant/(protected)/[entityType=…]/[entityId=…]/profile` is still a contestant route and still protected. `CONTESTANT_GATE.whenAuthenticatedOnLogin` targets `ContestantAppHome`, which stays the root.
- **`redirectTo` survives the new shape.** `loginRedirectTargetOf(url)` emits the de-localized path; `safeRedirectTarget` accepts `^[A-Za-z0-9\-_~]+(?:\/[A-Za-z0-9\-_~]+)*\/?(?:\?[A-Za-z0-9\-_~.=&%[\]]*)?$`, and a uuid is made of those characters `[VERIFIED: tree — loginRedirectTarget.ts]`. `contestant/candidate/<uuid>/questions/<uuid>` passes.
- **Paraglide has no per-route pattern.** No `urlPatterns` is configured (`git grep -n -i urlPatterns -- apps/frontend` prints nothing); the strategy is the default locale prefix. Nothing in Paraglide changes when a segment is inserted `[VERIFIED: tree]`.

### R-2.2 The route tree to build

```
apps/frontend/src/routes/contestant/
├── +layout.server.ts                  unchanged (session projection; an ANCHOR of assert-no-session-in-loads)
├── +layout.svelte                     unchanged (initContestantContext, ContestantNav)
├── login/ help/ privacy/ …            unchanged
└── (protected)/
    ├── +layout.server.ts              USER LEVEL  session → user → gates → entity list
    ├── +layout.svelte                 USER LEVEL  gate view (172) | children
    ├── +page.server.ts                ROOT        nothing-to-edit | redirect | H
    ├── +page.svelte                   ROOT        the two views
    ├── [...page=<matcher>]/+page.server.ts        entity-less resolver (R-2.6)
    └── [entityType=<matcher>]/[entityId=<matcher>]/
        ├── +layout.server.ts          ENTITY LEVEL  not-mine check → entity read → nomination check → questions
        ├── +layout.svelte             ENTITY LEVEL  today's data-apply effect (setDataRoot + userData.init)
        ├── +page.svelte               home (screen I) — moved from (protected)/+page.svelte
        ├── contestantHome.helpers.ts (+ test)       moved with it
        ├── profile/+page.svelte       moved
        ├── questions/+layout.svelte, +page.svelte, [questionId]/+page.svelte   moved
        ├── preview/+page.svelte       moved
        └── settings/+page.svelte      moved
```

Population of what moves: `find "apps/frontend/src/routes/contestant/(protected)" -type f | sort` (2026-10-06: 12 files; Phase 172 adds `layout.server.test.ts` and rewrites `termsOfUseLayout.svelte.test.ts` `[ASSUMED: PLAN 172-04]`).

### R-2.3 Which load runs where, in what order, and when it reruns

**How SvelteKit decides** `[VERIFIED: kit source — src/runtime/server/page/load_data.js, src/runtime/client/client.js]`. A server load receives `url`, `params`, `route` and `parent` wrapped so that reads are recorded: any property read on `url` sets `uses.url`; `url.searchParams.get(k)` adds `k` to `uses.search_params`; a read of `params.<k>` adds `k` to `uses.params`; `await parent()` sets `uses.parent`; a read on `route` sets `uses.route`. Reads inside the load's `untrack(fn)` are not recorded. On a client-side navigation a server node is reloaded when it is a node the previous page did not have, or when `has_changed` is true:

```js
if (uses.parent && parent_changed) return true;
if (uses.route && route_changed) return true;
if (uses.url && url_changed) return true;
for (const tracked_params of uses.search_params) { if (search_params_changed.has(tracked_params)) return true; }
for (const param of uses.params) { if (params[param] !== current.params[param]) return true; }
```

`url_changed` is true on **every** navigation to a different path or query. That is the whole hazard of O-4: one tracked `url` read and the load reruns on every click.

**What the current load uses.** `(protected)/+layout.server.ts` reads `fetch` and `locals` only — no `url`, no `params`, no `parent` `[VERIFIED: tree]`. Today it therefore runs once per full page load and on `invalidateAll()`, and never on an in-app navigation. Phase 172 keeps that and adds the app's first bare `invalidateAll()` after acceptance `[ASSUMED: PLAN 172-04]`.

**The loads to build, with what each may read.**

| Load | Reads (tracked) | Must not read | Does, in order | Reruns when |
|---|---|---|---|---|
| **User level** `(protected)/+layout.server.ts` | `params.entityType`, `params.entityId` — **deliberately** | any `url` property; `route`; any other param | 1 session (`locals.safeGetSession()`; none → 307 login, as today) → 2 `getBasicUserData()` (fails → `loginFailed` sign-out) → 3 `firstNeededGate(user)`; a gate → `return { gate, user }` and stop `[ASSUMED: PLAN 172-04]` → 4 `getUserEntities()`, filtered once with `getServedEntityTypes(appSettings)` (fails → `loginFailed`) → `return { gate: null, user, entities }` | full load; `invalidateAll()`; **the selected entity changes, including root ↔ entity** |
| **Root** `(protected)/+page.server.ts` | `parent()` | `url`, `params` | `const { gate, entities } = await parent()`; gate → `return {}`; 0 → nothing to edit; 1 → `redirect(307, <that entity's home>)`; several → H | every navigation *to* the root (a leaf node is new each time); when the parent reruns |
| **Entity level** `[entityType]/[entityId]/+layout.server.ts` | `params.entityType`, `params.entityId`, `parent()` | any `url` property; `route`; `params.questionId` | `await parent()`; gate → `return {}`; `(type, id)` not in `entities` → `redirect(307, root)`; `getEntityUserData({ type, id })` → no row → `redirect(307, root)`, read error → `loginFailed`; no election or constituency among the nominations → `candidateNoNomination` sign-out (O-6); `getQuestionData` → return | the selected entity changes; the parent reruns; `invalidateAll()`. **Not** on `profile → questions → questions/<id>` |
| **Resolver** `[...page]/+page.server.ts` | `params.page`, `parent()` | `url` | gate → `return {}`… see R-2.6 | each visit |

**Why the user-level load reads the two params on purpose.** Without it, the list is fetched once per full page load and every later decision is made on a stale copy. The failure is not cosmetic: a single-entity user whose grant is revoked would have a root that still says "one entity" and redirects to it, and an entity-level load whose table-backed read says "not yours" and redirects to the root — a redirect loop. With the two params tracked, `has_changed` reruns the user-level load whenever the selected entity changes (including `undefined ↔ value` between the root and an entity), `parent_invalid` propagates to the children that called `parent()`, and both redirect decisions are made on the same fresh list. The cost is one `auth.getUser()` round trip, one acceptance read and one RPC per entity switch, and nothing on in-entity navigation, because `questionId` is not read.

**Order between the levels.** Children that call `await parent()` wait for it; SvelteKit otherwise runs all loads of a request concurrently. Both child loads must `await parent()` **before** any read of their own, so that for a gated user the entity is never read — the property Phase 172's `layout.server.test.ts` asserts on the single load today (`expect(…getContestantUserData…).not.toHaveBeenCalled()`) and which this phase must re-prove on the split loads.

**The gate must cost the user nothing (PROH-172-03).** With a gate pending, the root load returns no redirect and the entity-level load makes no not-mine check. The layout replaces `children` with the gate view at whatever URL the user asked for; after acceptance `invalidateAll()` reruns all three loads at that URL.

### R-2.4 The guard tests for O-4

Model: `apps/frontend/src/routes/(voters)/(located)/layout.tracking.test.ts` `[VERIFIED: tree]`. It drives the real `load` with a `recordingUrl(href)` — a `Proxy` over a `URL` that pushes every property name read while an `untracked` counter is zero — plus the matching `untrack`, asserts `trackedReads` is `[]`, and ends with a **negative control**: a local load-shaped function that does read `url.pathname` tracked, proving the Proxy records and the counter suppresses. Three things differ for this phase:

1. **These are server loads.** Import `load` from `./+layout.server`, and mock `$lib/api/dataWriter` and `$lib/api/dataProvider` with the hoisted `vi.mock` pair that `routes/admin/(protected)/layout.server.test.ts` uses.
2. **Record `params` too.** Pass `params` as a recording `Proxy` and assert the exact set: `['entityType', 'entityId']` for the entity-level and the user-level load, `[]` for the root, and specifically **not** `questionId`. Pass `route` as a Proxy that fails on any read.
3. **Keep one negative control per instrument** (one for the `url` Proxy, one for the `params` Proxy), each over a local function, not the real load.

Suggested files: `(protected)/layout.tracking.test.ts` and `(protected)/[entityType=…]/[entityId=…]/layout.tracking.test.ts`. A case per URL shape: the entity home, `profile`, `questions`, `questions/<id>`, each with and without a query string.

### R-2.5 Param matchers

- **A matcher is a synchronous predicate with no access to settings.** `src/params/<name>.ts` exports `match(param: string): boolean`; the tree's two, `etSg.ts` and `etPl.ts`, are "Strict boolean-OR allowlist — no regex, no glob, no user-supplied predicate", and a failed match is SvelteKit's 404 `[VERIFIED: tree]`. So the matcher can check the **vocabulary**, not what this project serves.
- **`entityType`:** accept exactly the members of `SERVED_ENTITY_TYPES` — `['candidate', 'organization']` `[VERIFIED: tree @a4b408eb7 — packages/app-shared/src/settings/contestantAppConfig.ts]`. Do **not** reuse `etSg`: it accepts `alliance`. "This project does not serve organizations" is a per-project fact and is decided in the load (redirect to the root, D-10), because the user-level list is already filtered to served types and an unserved-type entity is simply not in it.
- **`entityId`:** a canonical uuid. Without it a malformed id reaches `p_entity_id uuid` and PostgREST answers 400, which the load would have to tell apart from a real failure.
- **Outcome by case.** Vocabulary-foreign type (`/contestant/faction/…`) or malformed id → 404 (a malformed URL, not "an entity you may not edit"). Well-formed type and id the user does not edit, an unserved type, a type/id mismatch, a revoked grant → 307 to the root, indistinguishable from one another (D-10).
- **The matcher is also what keeps two-segment garbage out.** Without it, `/contestant/questions/<id>` (the pre-173 shape) would match `[entityType]/[entityId]` with `entityType = 'questions'`.
- **Each matcher gets a unit test**, as `etSg.test.ts` and `etPl.test.ts` do. The matcher file name is the matcher name (`\w+`).

### R-2.6 The entity-less resolver (Claude's discretion in D-07)

**Who produces a protected URL with no entity in it.** Measured on the tree:

| Producer | Today | After the move |
|---|---|---|
| `hooks.server.ts` `redirectTo` | the path the visitor asked for | unchanged: it is whatever URL was requested, so it names an entity if the request did |
| `routes/api/auth/callback/+server.ts` | `recovery` → `ContestantAppResetPassword`; `invite` → `ContestantAppSetPassword`; `email`/`signup` → validated `next` or `ContestantAppHome` | all targets are outside the entity tree or the root — no change |
| `contestant/login/+page.server.ts` | `redirectTo` or `ContestantAppHome` | no change |
| In-app links (`getRoute`) | — | carry the entity from the page |
| **The E2E suite** | `page.goto('/en/contestant/profile')`, `…/questions`, `…/preview` and the tests' own `buildRoute` | **the only real producer**: command E-5 in R-2.8 (32 lines) |
| A person's bookmark or a link in an old email | — | none exists; nothing is deployed |

**Recommendation: one rest route inside `(protected)`, guarded by a matcher.** `(protected)/[...page=<matcher>]/+page.server.ts`, where the matcher accepts exactly the entity sub-paths the app has (`profile`, `questions`, `questions/<one segment>`, `preview`, `settings`) and the load does: gate → return; exactly one entity → `redirect(307, /contestant/<type>/<id>/<page>)`; otherwise → `redirect(307, root)`. Reasons:

- It delivers the outcome D-07's discretion clause states: a single-entity user reaches the same page under their entity, a multi-entity user reaches H.
- It sits in `(protected)`, so an unauthenticated request is still bounced to login by the hook with `redirectTo=contestant/profile`, and after sign-in the resolver finishes the job. The journey spec's step "Navigate directly to /contestant/profile while unauthenticated — protected layout redirects back to /contestant/login" keeps passing unchanged.
- It lets every single-entity spec keep its entity-less `page.goto`. Only URL **assertions** need re-pointing (R-6.3).
- The matcher keeps it from turning every unknown `/contestant/*` path into a login bounce: an unknown path still 404s.

Mechanics, verified: a rest segment may carry a matcher (`/^\[\.\.\.(\w+)(?:=(\w+))?\]$/` in `parse_route_id`); the matcher receives the remaining path joined with `/`, and `''` when the rest is empty — *"We need to allow the matcher to run so that it can decide if this optional rest param should be allowed to match"* `[VERIFIED: kit source — src/utils/routing.js, exec]`. The matcher must return `false` for `''`, or the resolver would compete for `/contestant` itself. Static and matcher-constrained routes sort ahead of a rest route, so `/contestant/candidate/<uuid>/profile` never reaches it `[ASSUMED]` for the exact sort order — the unit test for the route tree is `routeConsistency.test.ts`, and an E2E case covers it.

`routeConsistency.test.ts` check **C1** requires every addressable page directory inside a protected group to have a `ROUTE` entry that addresses it `[VERIFIED: tree]`. The resolver directory therefore needs a `ROUTE` key, as does the entity home.

### R-2.7 Route keys

`route.ts` today `[VERIFIED: tree]`: `ContestantAppHome: CONTESTANT` (the root, `/contestant`), and five keys built on `CONTESTANT_PROT`: `ContestantAppPreview`, `ContestantAppProfile`, `ContestantAppQuestion`, `ContestantAppQuestions`, `ContestantAppSettings`.

**Recommendation.** Keep `ContestantAppHome` as the root and add a key for the entity home (suggested `ContestantAppEntityHome`), rather than moving `ContestantAppHome` onto the entity and adding a key for the root. Every reference to `ContestantAppHome` falls into one of two groups (`git grep -n -P "ContestantAppHome\b" -- apps packages tests ':!apps/docs'`):

| Group | Sites (2026-10-06) | Wants |
|---|---|---|
| Outside the entity tree — no entity in the URL, or server code | `appGates.ts` (`whenAuthenticatedOnLogin`), `api/auth/callback/+server.ts` (twice), `contestant/login/+page.server.ts`, `help/+page.svelte`, `privacy/+page.svelte`, `password-reset/+page.svelte`, `preregister/+layout.svelte` (twice), `register/+layout.svelte`, five E2E setups, the a11y spec, `appGates.test.ts`, `buildRoute.redirects.test.ts`, `routeConsistency.test.ts` | the **root** — a multi-entity user belongs on H; a single-entity user is redirected on |
| Inside the entity tree | `ContestantNav.svelte` (home item), `profile/+page.svelte` (three), `questions/+layout.svelte`, `questions/+page.svelte`, `questions/[questionId]/+page.svelte`, `settings/+page.svelte`, `preview/+page.svelte` | the **entity home** — sending these to the root would drop a multi-entity user on H every time they press "return" |
| Either | `lib/layouts/main/Banner.svelte` (the default return-button callback) | the entity home when the URL has an entity, else the root |

The first group is the larger and holds every server-side and test-side site, none of which can fill the params. Keeping its key means it does not change at all. The second group changes key. For the third, and for the nav's home item, expose one reactive accessor on the contestant context (suggested `homeRoute`: the entity home when `page.params` carries an entity, else the root), read as `ctx.homeRoute`.

The five entity keys keep their names and gain the two segments: `` `${CONTESTANT_PROT}/[entityType=<m>]/[entityId=<m>]/profile` `` and so on. A `CONTESTANT_ENTITY` prefix constant beside `CONTESTANT_PROT` keeps the pattern in one place.

### R-2.8 Enumerations — every surface that changes when the segments are inserted

The commands, to copy as they stand (they are in a code block so that no table escaping gets into a regular expression):

```bash
# E-1  route keys and every reference to them                                   (2026-10-06: 81 lines)
git grep -n -P "ContestantApp(Home|Preview|Profile|Question|Questions|Settings)\b" -- apps packages tests ':!apps/docs'
# E-2  the protected prefix constant
git grep -n -F "CONTESTANT_PROT" -- apps/frontend/src tests
# E-3  files under the protected group                                          (12 files)
find "apps/frontend/src/routes/contestant/(protected)" -type f | sort
# E-4  redirects in the app's server code
git grep -n -E "redirect\(" -- apps/frontend/src/routes/contestant apps/frontend/src/routes/api/auth apps/frontend/src/hooks.server.ts
# E-5  E2E gotos that name a protected page with no entity                      (32 lines, comments included)
git grep -n -P "contestant/(profile|questions|preview|settings)" -- tests/tests
# E-6  E2E gotos of the app root                                                (8 lines)
git grep -n -P "goto\(['\"\`]/en/contestant['\"\`]\)" -- tests/tests
# E-7  E2E assertions on a URL shape                                            (23 lines, then 3)
git grep -n -E "toHaveURL|waitForURL" -- tests/tests | grep -i contestant
git grep -n -F "PER_QUESTION_URL_RE" -- tests/tests
# E-8  callers of the tests' own route builder                                  (21 files)
git grep -l -E "buildRoute\(" -- tests
# E-9  the same builder asked for an entity route
git grep -n -P "ContestantApp(Preview|Profile|Question|Questions|Settings)\b" -- tests
# E-10 docs that name the group or a moved file                                 (11 lines)
git grep -n -F "(protected)" -- apps/docs/src ':!*generated*'
# E-11 source comments that name a moved path
git grep -n -F "contestant/(protected)/" -- apps tests ':!apps/docs'
```

| Surface | What changes | Command |
|---|---|---|
| Route keys | five keys gain two segments; one key added for the entity home, one for the resolver; `ContestantAppHome` unchanged | E-1, E-2 |
| The route tree | six page files, one layout file and one helper pair move under the entity segments; the load splits | E-3 |
| Server redirects | the root's single-entity redirect and the entity-level refusals are new; the existing ones do not change target | E-4 |
| App gates | `apps/frontend/src/lib/routes/appGates.ts` — **no row changes**; `appGates.test.ts` uses `ROUTE.ContestantAppProfile` as "a protected candidate page", which stays protected | — |
| `hooks.server.ts` | **no rule changes** (R-2.1) | — |
| Paraglide | **nothing changes** (R-2.1) | — |
| Server-load census gate | `scripts/assert-no-session-in-loads.mjs` — `CORPUS_FLOOR = 10` (adding loads passes) and `ANCHOR_FILES`, one of which is `path.join('contestant', '+layout.server.ts')` — **do not move or rename that file** | — |
| Route-tree consistency | `apps/frontend/src/lib/routes/routeConsistency.test.ts` — C1 (new page directories need `ROUTE` entries), C2 (every protected `ROUTE` value names a directory that exists) | — |
| E2E navigation | entity-less `goto`s keep working through the resolver; root `goto`s keep working through the redirect | E-5, E-6 |
| E2E URL assertions | every assertion on a protected path's shape is re-pointed (R-6.3) | E-7 |
| The tests' route builder | `tests/tests/utils/buildRoute.ts` maps `ROUTE[route]` segment by segment and **passes a `[param]` segment through as a literal** | E-8, E-9 |
| Docs | hand-written pages that name the group or link a moved file; then `yarn workspace @openvaa/docs generate:docs` (route map, component pages) and `yarn workspace @openvaa/docs validate:links` | E-10 |
| Source comments | comments that cite `contestant/(protected)/<page>` | E-11 |

### R-2.9 The name gate reports the route shape D-07 locks

Run this session with the gate's own `'/candidate URL'`, `'candidate/ URL (slashless)'` and percent-encoded expressions, copied from `scripts/assert-no-candidate-app-names.mjs` `[VERIFIED: tree, node -e]`. Each line below is one sample string and what the gate said of it:

```text
REPORTED  /candidate URL             await page.goto("/en/contestant/candidate/3f2a/profile")
REPORTED  /candidate URL             toHaveURL(/\/contestant\/candidate\/[0-9a-f-]+\/profile/)
REPORTED  /candidate URL             The entity home is `contestant/candidate/<id>`.            (a docs sentence)
REPORTED  candidate/ URL (slashless) const p = "candidate/abc123/profile"
clean                                toHaveURL(/\/contestant\/(?:candidate|organization)\/[0-9a-f-]{36}\/profile/)
clean                                `/contestant/${type}/${id}`
clean                                redirectTo=contestant%2Fcandidate%2Fabc
clean                                routes/contestant/(protected)/[entityType]/[entityId]/+layout.server.ts
clean                                { candidate: "candidates", organization: "organizations" }
```

The cause: the expression's lookbehind lists the words after which `/candidate` is an entity-typed form (`candidates|organizations|alliances|variants|[Vv]oter|party|user|proj|entity|faction|results|candidate|fixtures|setup|specs|generated`), and `contestant` is not among them — when the gate was written, no entity type followed `contestant/`.

**Recommendation:** in the route plan, add `contestant` to that lookbehind and one NEGATIVE fixture line (for example `'/contestant/candidate/123/profile'`), run `--self-test`, and list it in the summary as a pattern change for the operator's eye. `/contestant/candidate/…` cannot be an old app URL (the old app lived at `/candidate/…`), so the change admits nothing the gate was built to catch. The alternative — never writing the literal — fails at the first docs page that has to describe the URL, and at every unit test that passes an href to a load.

---

## R-3 — The app root's three outcomes (173-B2..B6, with the 173-B5 (b) overrule)

### R-3.1 What stands today

`(protected)/+layout.server.ts`, in order `[VERIFIED: tree]`: no session → `redirect(307, ContestantAppLogin)`; `getContestantUserData({ loadNominations: true })` caught to `undefined` → `handleError('loginFailed')`; `if (role !== 'candidate') return await handleError('userNotAuthorized');`; `if (!candidate) return await handleError('userNoCandidate');`; no election or constituency id → `handleError('candidateNoNomination')`; then `getQuestionData`. `handleError` signs out with `locals.supabase.auth.signOut({ scope: 'local' })` and redirects to login with `errorMessage`.

Two of those four branches cannot fire through the Supabase writer:

- **`userNoCandidate` is unreachable.** `_getContestantUserData` ends its RPC call in `.single()` and throws `Failed to load candidate data` when there is no row, so the load's `.catch` yields `undefined` and the user leaves as `loginFailed`. When it does not throw, `candidate` is always set. `[VERIFIED: tree]`. Phase 172's plan states the same (*"a user with no entity never reaches `userNoCandidate` or `userNotAuthorized`"*) `[ASSUMED: PLAN 172-04, deviation 1]`.
- **`userNotAuthorized` is reachable only in the stale-token window**: the table holds a candidate-editor grant, so the read returns a row, while the token does not carry it yet, so the coarse role is not `'candidate'`. A signed-in user with no such grant at all — an admin opening `/contestant`, say — gets no row and leaves as `loginFailed` like everyone else.

So the outcome a zero-entity user actually gets today is the `loginFailed` sign-out, and what a multi-entity user gets is the same (the RPC raises). Retiring `userNoCandidate` removes dead code; the D-24 grep for it is safe.

### R-3.2 Where each outcome lives

| Entities (served-filtered) | Outcome | Where | Notes |
|---|---|---|---|
| gate pending | the gate view, at the URL asked for | user-level `+layout.svelte` (Phase 172's `GATE_VIEWS`) | the root load returns `{}` and decides nothing |
| 0 | the "nothing to edit" view | root `+page.svelte`, rendering a component | recommended as **a view of the root page, not a route of its own**: no extra route key, no extra redirect, and D-10's "redirect to the root" lands on it directly |
| 1 | `redirect(307, <entity home>)` | root `+page.server.ts` | built with `buildRoute({ route: <entity home key>, locale, entityType, entityId })` — server code passes both params explicitly |
| several | H | root `+page.svelte` | never an empty list (173-B5 (c) is dead) |

**The "nothing to edit" body as a component** (D-11 asks for reuse by 178 and 179). Its parts all exist:

- The signed-in email: `data.user.email` from the user-level load (`BasicUserData.email`, set from `user.email` in `_getBasicUserData`) `[VERIFIED: tree]`.
- The support block: the Help page builds `getEmailUrl({ subject, to: ctx.appSettings.admin.email })` and renders a `Button` with `t('contestantApp.common.contactSupport')` and `data-testid="contestant-help-contact-support"` `[VERIFIED: tree]`. Extract that pair into one component and use it in both places; `CAND-APP-PLAN.md` asks for a "Reusable block linking to help#support" on screens E, CI2 and J as well. Phase 171 changes how the subject is derived (`getContestantAppName({ appSettings, t })`) `[ASSUMED: PLAN 171-03]` — read the Help page as 171 left it.
- Logout: `LogoutButton` from `$lib/contestant/components/logoutButton` `[VERIFIED: tree]`. It opens a "questions left" modal when `contestantCtx.unansweredOpinionQuestions` or `unansweredRequiredInfoQuestions` is non-empty, and those are derived from the user-data store — see P-6 for why the store must be emptied when the user leaves an entity.
- Page frame: `MainContent` with a `title`, which gives the `<h1>`, the route announcement and the post-navigation focus target for free (R-4.5).

Suggested homes, to keep the three libraries' dependency rule (`.claude/skills/components/SKILL.md`): both new components read the contestant context and so belong under `apps/frontend/src/lib/contestant/components/`, each with a co-located `*.type.ts` when it has props, an `index.ts` barrel and an `@component` docstring.

### R-3.3 What replaces the two sign-outs

- **`userNoCandidate`:** removed everywhere. Population: `git grep -n -F "userNoCandidate" -- ':!.planning'` — 2026-10-06: the load, `lib/contestant/utils/loginError.ts` (the union member and the map entry), seven `messages/*/contestantApp.error.json`, the generated `lib/types/generated/translationKey.ts`, one docs page (`contestant-app/login-and-password-reset/+page.md`) and the name gate's fixture line `n21`. Regenerate the key type with `yarn workspace @openvaa/frontend generate:translation-key-type`.
- **`userNotAuthorized` (`role !== 'candidate'`):** follow D-11's recommended reading and remove the check from the contestant load; the served-filtered list decides. Research found no reason to keep it: once the list is read from the table, a signed-in admin with no editable entity is in exactly the zero-entity position. The **admin** side keeps its own `userNotAuthorized` (`routes/admin/(protected)/+layout.ts`, `lib/admin/utils/loginError.ts`) `[VERIFIED: tree]`; do not touch it. The contestant union keeps the `userNotAuthorized` member only if something still produces it — re-derive with `git grep -n -F "userNotAuthorized" -- apps/frontend/src/routes/contestant apps/frontend/src/lib/contestant`.
- **`loginFailed`:** unchanged — the user-level read failed, or the entity read failed with an error other than "no row".
- **`candidateNoNomination`:** moves into the entity-level load unchanged (O-6). Its message is candidate-worded and stays so; Phase 176 removes it.

### R-3.4 The no-gap rule between plans

Because the real zero-entity outcome today is `loginFailed`, the cleanest reading of D-23 is that **plans 1 to 3 change no outcome**:

| Plan | Zero entities | Several entities |
|---|---|---|
| 1 (schema + adapter shim, R-1.6) | writer throws → `loginFailed` sign-out (as today) | writer throws → `loginFailed` sign-out (as the raise produced) |
| 2 (writer and store generalised) | same | same |
| 3 (route tree) | root load → `loginFailed` sign-out | root load → `loginFailed` sign-out |
| 4 (H, the "nothing to edit" view, strings) | the view | H |

Plan 3 is then a pure move with the single-candidate suite as its net, as D-23 wants, and plan 4 replaces both interim sign-outs in one change to one load. No plan boundary leaves a zero-entity user without an outcome. The alternative D-23 allows — the screen and its strings in plan 3 — works too but puts seven locales of new copy into the plan that also moves every URL.

### R-3.5 The gate order with what Phase 172 builds

F → email → G → **root** → home, as: user-level load (session → user → `firstNeededGate(user)` over `CONTESTANT_GATES`, which holds `termsOfUse` only after 172 and to which 178 prepends F `[ASSUMED: PLAN 172-04]`) → root load → entity-level load. H is a route, not a gate entry (D-08). A user with nothing to edit is asked to accept the terms first — the flagged carry-over in D-11; the load order above produces exactly that and needs no special case.

### R-3.6 The app-entry gate (D-12)

`apps/frontend/src/lib/auth/roles.ts`: `export const CANDIDATE_GRANTS = [{ scope: 'entity', role: 'editor', target_type: 'candidate' }] as const satisfies ReadonlyArray<GrantShape>;` `[VERIFIED: tree]`. Rename it and add the organization shape. Population: `git grep -n -F "CANDIDATE_GRANTS" -- apps tests packages` (2026-10-06: `roles.ts`, the login action, the writer, `passwordLogin.test.ts`, `requireAdminIdentity.test.ts`). Tests that pin the old content and must change with it, all in `apps/frontend/src/lib/auth/passwordLogin.test.ts`: `expect([...CANDIDATE_GRANTS]).toEqual([{ scope: 'entity', role: 'editor', target_type: 'candidate' }])`, and the loop asserting that an entity editor of another `target_type` is refused — `organization` now passes, `faction` and `alliance` still do not.

The coarse literal: `export type UserRole = 'candidate' | 'admin';` in `dataWriter.type.ts` and `let role: 'candidate' | 'admin' | null = null;` in `_getBasicUserData` `[VERIFIED: tree]`. The gate's fixture already holds `type UserRole = 'candidate' | 'admin';` as a NEGATIVE line, so neither the old nor a new literal is a gate finding. Suggested: `CONTESTANT_GRANTS` and `'contestant'`. See *Open Questions for the Operator*, O-Q2, for a pre-existing defect the widened constant makes wider.

---

## R-4 — Screen H and switching (173-C)

### R-4.1 `EntityCard` as it exists

`apps/frontend/src/lib/dynamic-components/entityCard/EntityCard.svelte` and `.type.ts` `[VERIFIED: tree]`:

- Props: `entity: MaybeWrappedEntityVariant` (a `@openvaa/data` object, so the entity must be in the `DataRoot`), `action?: CardAction` (`string | ((e: MouseEvent) => void) | false`), `variant?: 'list' | 'details' | 'subcard'`, `maxSubcards`, `showElection`, `children`.
- **The action.** A string renders `<a href={action} data-sveltekit-noscroll data-testid="entity-card-action">` around the whole card; a function renders a `<button>`; `false`, `null` or `''` renders the card bare. The default (`action ?? getRoute.current({ route: 'ResultEntity', … })`) is evaluated only when `action` is nullish, so a supplied action never touches the voter route.
- **`variant="details"` is not clickable** (`cardAction(variant === 'details' || parsed.subcards?.length ? false : parsed.action, …)`), so D-13's `variant="list"` is the right one.
- **What it renders in this app**, for `variant="list"`: avatar, title (`<h3>` with `nakedEntity.name`), a subtitle row (parent-nomination tag, election symbol, election and constituency — all from a nomination wrapper, absent for a naked entity), a match score (absent without a match), sub-matches (absent), sub-cards (only for a nomination wrapper), and **"featured questions and answers"**.
- **The featured questions throw on H.** For a candidate or an organization and any variant but `details`, the card calls `getCardQuestions({ type, appSettings, dataRoot: ctx.dataRoot })`, which maps every `{ question: <id> }` entry of `appSettings.results.cardContents[type]` through `dataRoot.getQuestion(id)` — and `DataRoot.getQuestion` throws `DataNotFoundError` when the question is not provided (`packages/data/src/root/dataRoot.ts`, `getChild`). The E2E base dataset has such an entry: `candidate: ['submatches', { question: { externalId: 'test-e2e-base-qu-info-text' } }]` (`packages/dev-seed/src/templates/e2e/base.ts`, `BASE_APP_SETTINGS.results.cardContents`). The app root loads no question data — questions are loaded by the entity-level load, per election. **As it stands, `EntityCard` on H crashes for a candidate in the E2E base dataset.**
- **It renders no type label.** D-14 asks for "name, type label and image per card".

**So `EntityCard` needs two additive, default-off options** (the UI spec owns their final form; Additional note 3 already anticipates "a 'compact' variant"):

1. A way to render the header only — no featured questions, no sub-matches, no sub-cards — so nothing voter-specific or question-dependent is read. Either a fourth `variant` value or a boolean prop; whichever is chosen must skip the `getCardQuestions` call, not merely hide its output.
2. A way to put the type label in the subtitle row, so that `aria-describedby="{baseId}_subtitle"` picks it up. `children` renders at the foot of the `<article>` and is outside the described-by relation.

An **unconfirmed** entity renders: nothing in the card reads `confirmed` `[VERIFIED: tree]`. The labels exist in all catalogues: `common.candidate.singular` ("candidate"), `common.organization.singular` ("party") `[VERIFIED: tree — messages/en/common.json]`.

### R-4.2 One card-list component for H and for Phase 177 — it already exists

`apps/frontend/src/lib/dynamic-components/entityList/EntityList.svelte` takes `cards: Array<EntityCardProps>` and renders `<EntityCard {...item} />` for each, inside `<div data-testid="entity-list">` `[VERIFIED: tree]`. Because every card carries its own `action`, the list bakes in neither navigation nor selection: H passes each card a URL string, and Phase 177's party and alliance selectors pass a handler. **Use `EntityList` for H; build no new list component.** Its pagination (`itemsPerPage = 50`) never engages for a handful of cards. What Phase 177 will need beyond it — a selected state on a card — is 177's to add and is not baked in or out by anything H does.

D-14's layout on top of it: one `EntityList` per type, candidates first, each sorted by the displayed name; a group heading (`<h2>`) only when both types are present. Sort with a locale-aware comparison on the same string the card shows.

### R-4.3 Getting the user's entities into the `DataRoot`

- `DataRoot.provideEntityData(data)` **resets** all four entity collections: *"Existing data will be reset, along with any dependent collections."* `[VERIFIED: tree — packages/data/src/root/dataRoot.ts]`. The entity-level layout's effect calls `dr.provideEntityData(snapshot.entities)` with the writer's `entities: {}`, and the preview page calls it with the one candidate. So **anything a layout above H provides is wiped the first time the user enters an entity**, and is not provided again when they come back to H, because the user-level layout's data has not changed.
- Therefore **H provides its own entities**, in its own effect, through `setDataRoot((dr) => dr.update(() => dr.provideEntityData([...])))` — the encapsulated, untracked write path the protected layout already uses and explains `[VERIFIED: tree — the comment beginning "IMPORTANT: mutate the DataRoot via `setDataRoot(updater)`"]`.
- The preview page is the precedent for the whole pattern: `dataRoot.provideEntityData([translateLocalizedCandidate(result, locale)]); entity = dataRoot.getCandidate(result.id);` `[VERIFIED: tree]`. For H use the generic getter `DataRoot.getEntity(type, id)`, which exists `[VERIFIED: tree]`.
- **Shape per type.** A `Candidate` needs `firstName` and `lastName`; an `Organization` needs `name` (`packages/data/src/objects/entities/variants/*.type.ts`) `[VERIFIED: tree]`. The list RPC returns `first_name`/`last_name` for candidates and the localized `name` for organizations; localize with the existing `toDataObject` and `parseImageColumn` utilities the writer already uses.
- **Reading back.** Per the context rule, read `ctx.dataRoot.getEntity(…)` directly inside the consuming `$derived.by`, never through an alias. Effects do not run during SSR and run after the first client render, so the derived must tolerate "not provided yet" (catch `DataNotFoundError` and render nothing or `<Loading />`), exactly as the protected pages tolerate `userData.current` being `undefined` on first paint.

### R-4.4 The switch item and the selected entity's name (D-15)

`ContestantNav.svelte` today renders, for `contestantCtx.isAuthenticated`, one `NavGroup` of five entity items and one of Help and Privacy `[VERIFIED: tree]`. After this phase:

- The five entity items render only when the URL carries an entity (P-1). On the root, Help and Privacy a signed-in user sees Home (the root), Help, Privacy.
- "Switch entity" is one more `NavItem` with `href` = the root, rendered only when the user-level list has more than one entry. It is a plain link: a multi-entity user is never redirected away from the root.
- "The menu also names the selected entity": `NavGroup` has an optional `title?: string` `[VERIFIED: tree — NavGroup.type.ts]`. Using it for the entity group names the entity without adding a menu item.
- **A regression anchor to respect.** `contestant-journey.spec.ts` asserts the exact ordered item list of the logged-in menu (`CONTESTANT_NAV_LOGGED_IN`, via `navMenu.expectNavMenuItems`) for a single-entity user on the home page `[VERIFIED: tree]`. A group title is not an item; a switch item shown only for several entities is absent there. Check what `expectNavMenuItems` counts before adding anything that renders for a single-entity user.
- **Where the nav gets the list.** The nav is mounted by `contestant/+layout.svelte`, above the `(protected)` group, so it cannot read the user-level load's data as a prop. Expose it on the context. The context already derives from page data in exactly this way: `#idTokenClaims = $derived(page.data.claims ?? undefined);` `[VERIFIED: tree — contestantContext.svelte.ts]`. `entities` and `user` can be the same kind of accessor over `page.data`, which needs no push from a layout and is empty on pages outside `(protected)`. New accessors are reactive: read as `contestantCtx.entities`, never destructured.

### R-4.5 Focus and announcement on a switch (WCAG 2.1 AA)

All of it is already in the root layout and needs only that the new screens use the standard frame `[VERIFIED: tree]`:

- `routes/+layout.svelte` calls `focusNavigationTarget()` in `afterNavigate`. It moves focus to the page's `[data-focus-on-nav]` element, or to its first `<h1>`, waiting up to `FOCUS_TARGET_WAIT_MS` for it to render and standing down if the user moves focus first (`lib/utils/focusNavigationTarget.ts`).
- The same layout holds `<div aria-live="polite" aria-atomic="true" class="sr-only" id="route-announcer">`, and `MainContent` registers its `title` with it.
- So: **H and the "nothing to edit" view must be `MainContent` pages with a `title`.** Picking a card is a link navigation; the entity home's `MainContent title={nextAction.title}` is announced and focused. For that announcement to say *which* entity, the home page's `username: userData.current?.candidate.firstName || '?'` must become the entity's display name for both types — it is on D-18's path anyway.
- Each card is an `<a>` around an `<article aria-labelledby aria-describedby>`: keyboard and screen-reader operation for free, as D-13 says. A group heading must be a real heading one level below the page title.
- The logout modal is a modal `<dialog>`. The View Transitions invariant in `CLAUDE.md` (no named document transition while a modal is open) is enforced globally by `lib/utils/viewTransition.ts`; H adds no `view-transition-name`.

### R-4.6 Unsaved drafts on a switch (173-C4)

**How drafts are kept today** `[VERIFIED: tree — contestantUserDataState.svelte.ts]`:

- One persisted handle, created once in a field initializer: `localStorageState('ContestantContext-contestantUserDataStore-editedAnswers', {} as LocalizedAnswers)`. The store itself is created once, by a field initializer of the context, which `contestant/+layout.svelte` constructs once per page session.
- `#current` overlays those edits on whichever entity is in `#savedData`: `answers: { ...answers, ...editedAnswers }`.
- An edited image is `$state` only (`#editedImage`).
- Cleared by a successful `save()`, by `resetUnsaved()`, by `reset()` (called from the context's `#reset` after logout), and by the constructor's effect `if (this.#answersLocked()) this.resetUnsaved();`.
- `PersistedStateImpl` takes a **fixed** key at construction and has no `remove`; when nothing valid is stored it **writes the default under the key at construction** (`if (stored === null) saveItemToStorage(type, key, defaultValue);`) `[VERIFIED: tree — persistedState.svelte.ts]`.

**A second mechanism already discards drafts on navigation, and D-16 does not mention it.** The profile page and the question editor mount `PreventNavigation` with `active={() => !bypassPreventNavigation && userData.hasUnsaved && …}` and `onConfirm={handleNavigationConfirm}`, and `handleNavigationConfirm` is `userData.resetUnsaved()` `[VERIFIED: tree]`. So leaving either editing page by a link — to H, or anywhere — asks "unsaved changes?" and, on confirm, **throws the draft away**. A draft therefore outlives a page only through a reload or a closed tab. That is precisely the path by which entity A's draft would overlay entity B today: reload on A, open B.

What this means for D-16:

- **Key the persisted handle by entity** — `…-<type>-<id>` — and swap the handle when the store is initialised for a different entity. Because the handle's key is fixed at construction, "re-keying" is constructing a new handle; hold it in `$state.raw` so `#current` and the unsaved derivations follow the swap.
- **Reset `#editedImage` on that swap** (D-16).
- **"Switching loses nothing" is true of the store, not of the two editing pages.** Their existing prompt still discards on a confirmed navigation, as it does for every navigation today. Leave that prompt alone; record the nuance in the plan so the E2E spec is written around a reload, not around a nav click from the editor.
- **Logout clears every entity's draft.** That needs a prefix sweep of `localStorage`, which the persisted-state module does not offer today. Add one small function there rather than reaching for `localStorage` in the store.
- **Leaving an entity for H must empty the saved data without touching the draft.** Today's only emptying method, `reset()`, also clears the draft. A separate method is needed, called from the entity-level layout's teardown — see P-6.
- **The `answersLocked` effect must depend on the active handle**, or a draft stored for entity B before the lock is still overlaid when B is opened after it — see P-7.
- **D-24's zero-hit grep for the fixed key** is `git grep -n -F "ContestantContext-contestantUserDataStore-editedAnswers" -- ':!.planning'` (2026-10-06: one hit, the store). If the per-entity key keeps that string as its prefix the grep can never be empty. Give the new key a different stem; the other three keys of the context are already lower-case `contestantContext-…` `[VERIFIED: tree]`.
- Two tabs on two entities are independent once the key carries the entity. Two tabs on the **same** entity behave as they do today (no cross-tab sync); out of scope.

---

## R-5 — Writer and store generalisation (173-D)

### R-5.1 Every place the frontend assumes a candidate — as commands

The commands, to copy as they stand:

```bash
# G-1  the user-data type's `candidate` member and every read of it            (2026-10-06: 29 lines)
git grep -n -P "\.candidate\b" -- apps/frontend/src/routes/contestant apps/frontend/src/lib/contexts/contestant ':!*.test.ts'
# G-2  candidate-named members and methods on the path
git grep -n -P "savedCandidateData|reloadCandidateData|LocalizedCandidateData|[uU]pdateCandidateData|[mM]ergeCandidateAnswers|uploadCandidateFile|translateLocalizedCandidate" -- apps/frontend/src tests
# G-3  the reader method                                                        (8 files)
git grep -l -F "getContestantUserData" -- apps tests packages
# G-4  the table chosen per type
git grep -n -F "scopedFrom('candidates')" -- apps/frontend/src
git grep -n -F ".eq('candidate_id'" -- apps/frontend/src/lib/api/adapters/supabase/dataWriter
# G-5  hard-coded type stamps on the path
git grep -n -F "ENTITY_TYPE.Candidate" -- apps/frontend/src/lib/api/adapters/supabase/dataWriter apps/frontend/src/lib/contexts/contestant ':!*.test.ts'
# G-6  the storage path and the parse-report column labels
git grep -n -E "/candidates/|'candidates\.(answers|image)'" -- apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts
# G-7  the entry gate
git grep -n -F "CANDIDATE_GRANTS" -- apps tests packages
# G-8  the coarse role literal
git grep -n -F "'candidate' | 'admin'" -- apps/frontend/src
git grep -n -P "role (=|===|!==) 'candidate'" -- apps/frontend/src
# G-9  the one reader of `user` on the entity data
git grep -n -P "(current|savedData|userData|ud)\??\.user\b" -- apps/frontend/src ':!*.test.ts'
```

| # | Assumption | Where (2026-10-06) | Command |
|---|---|---|---|
| 1 | The user-data type's `candidate` member and every read of it | the store, the protected load and layout, the home page (`userData.current?.candidate.firstName`), the profile page (six), the question editor (three) | G-1 |
| 2 | Candidate-named members and methods | the store and its type, the context (twice), the preview page, the questions page, the writer, the base writer, `dataWriter.type.ts`, `lib/api/utils/translateLocalizedCandidate.ts` | G-2 |
| 3 | The reader method and its options | the writer and its test, the concurrency test, `dataWriter.type.ts`, `universalDataWriter.ts`, the store and its test, the protected load | G-3 |
| 4 | Writer methods that refuse or ignore the type | in `supabaseDataWriter.ts`: ``if (type !== ENTITY_TYPE.Candidate) throw new Error(`Unsupported entity type for setting answers: ${type}`);`` in `_setAnswers`; `_updateEntityProperties({ target: { id }, … })`, where the type is not even destructured `[VERIFIED: tree]` | G-5 |
| 5 | The table chosen per type | `this.scopedFrom('candidates')` twice in `_updateEntityProperties`; the nominations read `.eq('candidate_id', entityRow.id)` | G-4 |
| 6 | Storage upload path | `` const storagePath = `${projectId}/candidates/${id}/${crypto.randomUUID()}.${ext}`; `` in `#uploadCandidateFile` `[VERIFIED: tree]` | G-6 |
| 7 | Hard-coded type stamps | the writer (the entity stamp, the nomination stamp, the `_setAnswers` guard), the store's `save()` (`type: ENTITY_TYPE.Candidate`), and the context's question-scope effect | G-5 |
| 8 | Column labels in parse reports | `column: 'candidates.answers'`, `column: 'candidates.image'` in the writer | G-6 |
| 9 | The entry gate and the coarse role | R-3.6 | G-7, G-8 |
| 10 | Messages addressed to a candidate on the path | `messages/*/contestantApp.error.json` (`userNoCandidate` goes; `candidateNoNomination` stays for Phase 176) | R-3.3 |

Phase 172 changes rows 1, 2 and 4 before this phase starts: it removes `termsOfUseAccepted` from `LocalizedCandidateData`, from the store (`#editedTermsOfUseAccepted`, its setter and reset, its share of `unsavedProperties`) and from `EditableEntityProps`, and makes `updateEntityProperties` image-only `[ASSUMED: PLAN 172-05]`. Re-run every command on the tree 172 leaves.

### R-5.2 The stopping line (D-18, D-19)

- **In:** rows 1 to 9 except one item of row 7.
- **Out, for Phase 175:** `const entityType = ENTITY_TYPE.Candidate;` inside the context's third `$effect` (the question roll-up handed to `rollUpQuestionCategories`) `[VERIFIED: tree — contestantContext.svelte.ts]`. For an organization the questions pages therefore still show candidate-scoped questions; D-19 accepts that and forbids a "coming soon" screen.
- **Out, for Phase 175:** the profile page's first-name and last-name fields, the preview page's `Candidate` typing and `getCandidate`, and the `entities.hideIfMissingAnswers.candidate` setting read on home and in `LogoutButton`. They are organization-specific page work. This phase only has to make them **not throw** for an organization: a member read that was `userData.current?.candidate.firstName` becomes a read on the union and must compile for both arms.
- **In, because it is one line and criterion 4 names it:** the home page's greeting name, from the entity's display name for either type.

### R-5.3 The one map and the one path

`{ candidate: 'candidates', organization: 'organizations' }` serves three things at once: the table handed to `scopedFrom`, the storage path segment (which `storage_path_can` maps back with `WHEN 'candidates' THEN 'candidate'` / `WHEN 'organizations' THEN 'organization'` `[VERIFIED: tree — 400-storage.sql]`), and the nominations foreign-key column (`candidate_id` / `organization_id`). Any other type throws by name (D-18).

Three constraints on how it is written:

- **`scopedFrom` with a non-literal argument is allowed by the scoping guard.** `scripts/assert-project-scoped-queries.mjs` forbids a bare `this.supabase.from(<scoped table>)` and a `from(`/`rpc(` with a non-literal argument **on the raw client**; it names "a union-typed dynamic table argument" as one of the shapes the inverted predicate exists to cover, and `scopedFrom` always applies the project filter `[VERIFIED: tree — the script's docblock]`. `this.scopedFrom(TABLE[type])` does not trip it.
- **TypeScript may refuse a union-typed builder.** `scopedFrom<'candidates' | 'organizations'>` yields `ScopedTableAccess` over a union of tables; whether `.update({ image }).eq('id', id).select('image').single()` typechecks on it was not tested `[ASSUMED]`. If it does not, write the two-arm `switch` inside one private method — still one path, and the guard still sees only `scopedFrom`.
- **`upsert_answers` is already typed by entity** (`p_entity_type: type`), so `_setAnswers` loses only its guard and its upload path.

### R-5.4 Names (Claude's discretion; none is a gate finding)

| Today | Suggested | Note |
|---|---|---|
| `ContestantUserData.candidate` | `.entity`, a union discriminated by `type` | D-18 fixes the member name |
| `LocalizedCandidateData` | keep it as the candidate arm; add `LocalizedOrganizationData`; the union `LocalizedEntityData` | `CandidateData` and `OrganizationData` exist in `@openvaa/data` |
| `getContestantUserData(opts)` | `getEntityUserData({ type, id, loadNominations, locale })` | D-18 |
| — | `getUserEntities()` | new, user level |
| `savedCandidateData`, `reloadCandidateData` | `savedEntityData`, `reloadEntityData` | two readers of the first in the context, one each in the questions and preview pages |
| `#uploadCandidateFile` | `#uploadEntityFile` | |
| `translateLocalizedCandidate` | generalise or add the organization sibling | used by the preview page only |
| `CANDIDATE_GRANTS`, `UserRole`'s `'candidate'` | `CONTESTANT_GRANTS`, `'contestant'` | D-12 |

`user` on the entity data: `settings/+page.svelte` reads `userData.current?.user.email` — the only reader (command G-9 in R-5.1). The entity read re-fetches the user today (`_getContestantUserData` begins with `await this._getBasicUserData()`), which after the split is a second `auth.getUser()` round trip per entity load. Either keep it for shape stability or move that one reader to the user-level accessor; the planner records which.

---

## R-6 — Tests (173-E)

### R-6.1 Widening the base dataset (X1 (a), D-20)

- **Where the settings live.** `BASE_APP_SETTINGS` is declared in `packages/dev-seed/src/templates/e2e/base.ts`. `MINIMAL_BASE_APP_SETTINGS` is declared in `packages/dev-seed/src/templates/e2e/perm/shared.ts` (`export const MINIMAL_BASE_APP_SETTINGS = {`) and only imported and applied by `_helpers/buildMinimal.ts`, the file CONTEXT.md's reference list names `[VERIFIED: tree]`.
- **What 171 leaves there.** Both carry the whole `contestantApp` root with `entityTypes: ['candidate']` and `registrationModes: { candidate: ['email', 'code'], organization: [] }`, and `mergeAppSettings` merges plain objects recursively `[ASSUMED: PLAN 171-01, 171-04]`. So the widening is one list: `entityTypes: ['candidate', 'organization']`. State the whole root anyway, as 171's templates do.
- **What pins the old value.** `packages/dev-seed/tests/templates/base-app-settings.test.ts` `[VERIFIED: tree]` and `packages/dev-seed/tests/templates/built-in-templates-contestant-app.test.ts` `[ASSUMED: PLAN 171-04 — "the E2E base datasets declare ['candidate'] …"]`.
- **What the name change re-baselines.** With both types served the app calls itself "Candidate and party app" (`dynamic.contestantAppName.candidateAndOrganization`) `[ASSUMED: PLAN 171-03]`. Re-derive on the tree 171 leaves: `git grep -n -i -E "Candidate app|Party app|Candidate and party app|contestantAppName" -- tests packages/dev-seed/tests`. Expected hits: the login-heading assertion 171 adds for the open base project ("the base dataset's login screen shows … the heading \"Candidate app\"") `[ASSUMED: PLAN 171-04]`, and `perm-closed-project.spec.ts`, which sets its own settings and should not change. The five sentences 171 parameterises on the name are checked by string where a spec reads them. The two opt-in visual baselines are of the preview page; whether the name is in them is a pixel question — run `PLAYWRIGHT_VISUAL=1` once after the widening.
- **`MINIMAL_BASE_APP_SETTINGS`.** Recommendation: leave it candidate-only. The perm family tests voter-side settings and five candidate sessions; none needs an organization, and leaving it keeps one dataset family proving the single-type name. Record the choice, as D-20 asks.
- **Ordering.** `data-setup-perm-1e1cg1co` depends on `voter-journey`, `contestant-journey`, `eperm07-term-trigger` and `contestant-a11y-scan` so that the perm family, which **replaces** the shared `app_settings` row, starts only after every base leaf that hard-asserts settings-dependent UI `[VERIFIED: tree — the comment "=== voter permutations chains ==="]`. The new selection spec asserts served-type-dependent UI (H shows an organization), so **its project must be added to that dependency list**.

### R-6.2 Which base candidates are free, and why "free" is not enough

- **Who registers against the base dataset today.** `git grep -h -o -E "test-e2e-base-(ca|or)[a-z0-9-]*" -- tests/tests | sort | uniq -c` — 2026-10-06: `test-e2e-base-ca-aa-1` (the stored session), `test-e2e-base-ca-aa-unregistered` (the journey). Phase 172 adds `test-e2e-base-ca-aa-hidden` `[ASSUMED: PLAN 172-08]`. The base holds some thirty candidates and five organizations (`or-aa`, `or-ab`, `or-ba`, `or-bb`, `or-c`): `grep -o -E "test-e2e-base-(ca|or)[a-z0-9-]*" packages/dev-seed/src/templates/e2e/base.ts | sort -u`.
- **At run time, against the suite's project**, a candidate is free when no editor grant names it: with the admin client, `grants` filtered to `scope = 'entity'`, `target_type = 'candidate'`, `role = 'editor'` and the candidate's id. The `grantEntity` helper should make that check and fail by name; if it does not, the insert fails anyway, naming `idx_grants_one_candidate_editor` — D-02 doing its job.
- **The real constraint is what the spec writes, not who else edits.** The selection spec has to save an answer to prove "saves to the selected one, never the previous one". The base dataset is shared, **in parallel**, with `voter-journey` and five other voter projects, which assert match rankings and card contents. A save to a candidate voters can see changes what those specs read. The one contestant spec that writes today, the journey, writes only to `test-e2e-base-ca-aa-unregistered`, which voters cannot see (`[ASSUMED: PLAN 172-06]` seeds it and `…-hidden` `confirmed: false`, and the visibility rule becomes project open, confirmed, confirmed nomination).
- **Recommendation — see O-Q1:** add two candidates and one organization to `e2e/base.ts` **for this spec**, each `confirmed: false`, each with one nomination. They are base candidates no other user edits (D-20), invisible to every voter spec (so every count in `voter-journey` holds, as 172 argues for its two control rows), and trivially "free". `packages/dev-seed/tests/templates/base.test.ts` pins the dataset's totals and changes with them. The alternative — two existing visible candidates, with writes restricted to something no voter spec reads — cannot be shown safe by a grep.
- **Each of the three needs a nomination.** The entity-level load still signs out with `candidateNoNomination` when the entity has none (until Phase 176), and the question data is loaded per election.

### R-6.3 What the route move does to the existing specs

With the resolver of R-2.6, an entity-less `page.goto` by a single-entity user still lands. What breaks is everything that **asserts** a URL shape, because `/contestant/profile` becomes `/contestant/candidate/<uuid>/profile`:

- `tests/tests/specs/contestant/contestant-journey.spec.ts`: `PER_QUESTION_URL_RE = /\/contestant\/questions\/[^/?]+/`, `toHaveURL(/\/contestant\/profile/)` (three), `/\/contestant\/questions/`, `/\/contestant\/questions\/[^/]+/` (five), `/\/contestant\/questions(\?|$|#)/`, the home settle `waitForURL(/\/contestant\/?(?:\?|#|$)/)`, and the post-registration dispatcher that compares the stripped path with `'/contestant/login'` and `'/contestant'`.
- `tests/tests/fixtures/contestant/contestantProfilePage.fixture.ts`: `toHaveURL(/\/contestant(?!\/profile)/)`.
- `tests/tests/specs/a11y/contestant-a11y.spec.ts`: `waitForURL(/\/contestant\/questions\/[^/?#]+/)`.
- `tests/tests/specs/perm/perm-localisation-positive.spec.ts`: `waitForURL(/\/contestant\/questions(\/?$|\?)/)`.
- Unaffected: assertions on `/contestant/login`, and `perm-question-video.spec.ts`'s `/\/questions\/[^/]+(\?|$)/`.

Put the entity segment in **one** tests-side helper (a regular-expression fragment and a path builder) and re-point each assertion to it, so the next change to the shape is one edit. Write the fragment as an alternation, `(?:candidate|organization)`, which the name gate does not report (R-2.9).

`tests/tests/utils/buildRoute.ts` needs care on its own: it emits a literal `[entityType=…]` segment for any `ROUTE` value that has one, silently. Make it throw on an unfilled param segment, and give it an optional params argument for the new spec. Its callers that name an entity route (`git grep -n -P "ContestantApp(Preview|Profile|Question|Questions|Settings)\b" -- tests`): the a11y spec's six `routeId` entries, the two visual-regression `goto`s, and the cold-entry spec. Each either switches to the entity-less path (resolved by the app) or passes an entity.

### R-6.4 The multi-grant user, its fixture and its spec

- **The helper.** `forceRegister(candidateExternalId, email, password)` in `tests/tests/utils/supabaseAdminClient.ts` creates the user, looks the candidate up by `external_id` and `project_id`, inserts one `(entity, candidate, editor)` grant, and rolls the user back on failure `[VERIFIED: tree]`. Phase 172 adds an options argument with `acceptTermsOfUse` (default true) and a public `acceptTermsOfUse(email)` `[ASSUMED: PLAN 172-02]`. D-20's `grantEntity(email, { entityType, externalId })` is the second half of `forceRegister` lifted out: look up `candidates` or `organizations` by `external_id` in the client's project, insert the grant. Give it the same no-orphan discipline. `unregisterCandidate(email)` already deletes all of a user's grants and the user, for any grant shape.
- **The session helper.** Phase 172 moves the body of `auth.setup.ts` into one module-level helper (suggested `registerAndStoreSession(page, identity)`, with `externalId`, `email`, `password`, `storageStatePath`, `acceptTermsOfUse`, optional `settledTestId`) `[ASSUMED: PLAN 172-08]`. Two things to check on the tree 172 leaves: it takes **one** `externalId`, so a multi-grant identity needs a hook for extra grants between registration and login; and it lives **inside a setup file**, which another setup file cannot import (Playwright refuses a test file importing a test file `[ASSUMED]`). D-20 locks "a dedicated setup project … with its own teardown", so the helper has to move to a plain module both setups import.
- **Project graph, honouring D-20.** `data-setup-entity-selection` (depends on `data-setup-base`; `teardown: data-teardown-entity-selection`) writes the stored sessions; the spec project depends on it; `contestant-a11y-scan` gains it as a dependency for the two new scan entries; `data-setup-perm-1e1cg1co` gains the spec project (R-6.1). `scripts/assert-a11y-scan-wiring.mjs` pins the scan projects' edges `[VERIFIED: tree — it is link 6 of lint:check]`; read its four checks before adding the dependency.
- **A stored session must never be signed out.** `signOut({ scope: 'local' })` ends the session, and every project that loaded that `storageState` shares the session. Today three projects share `STORAGE_STATE` concurrently and none signs out. The E2E case that reaches the "nothing to edit" view and "signs out through its Logout" (D-11), and any switch case that ends in logout, must sign in **fresh through the login form** with its own session, not use the stored one the axe scan reads.
- **What the spec proves, on pages that exist.** (1) The multi-grant user lands on H and sees three cards, candidates before the organization. (2) Picking candidate A lands on A's home, whose heading names A. (3) Edit an answer on A, **reload** (the draft persists under A's key), open the same question on B: B shows its own value and no unsaved state. (4) Back on A the draft is still there; save; with the admin client, A's row changed and B's did not. (5) The switch item is in the menu and leads to H; picking the organization lands on a home naming it. (6) A URL naming an entity the user does not edit lands on H; a single-entity user (the existing stored session) asking for the root never renders H. Step 3 goes through a reload because a nav click from the editor triggers the existing discard prompt (R-4.6).
- **The zero-entity user** (D-21's mechanism). The login form refuses a token with no contestant-shaped grant (D-12 keeps that), so the session cannot be made grantless from the start. Register with one **organization** grant (no uniqueness to respect), sign in, store the session, then delete the grant. The list reads the table, so the view is stable for the whole run; the token still carries the old claim, which changes nothing the view reads. A token refresh re-mints the claim without the grant and the session stays valid.

### R-6.5 The axe scans (D-21)

`tests/tests/specs/a11y/contestant-a11y.spec.ts` holds a table of entries — `name`, `fixture: 'raw'`, `routeId`, `contentTestId`, `postLoginTestId`, optional `reach` — and emits a light and a dark scan per entry through `toScanEntry` and `assertAxeScan`, with a reach proof that the settled URL is inside `/contestant`, is not the login route, and shows the entry's post-login marker `[VERIFIED: tree]`. Phase 172 hoists the loop body into one function and adds a `test.describe` whose first statement is `test.use({ storageState: TERMS_PENDING_STORAGE_STATE })`, with the path declared once in `testCredentials.ts` `[ASSUMED: PLAN 172-08]`. This phase adds two more such `describe`s:

| Entry | Session | `routeId` | Content anchor | Marker (proves the surface) |
|---|---|---|---|---|
| H | multi-grant | the root (`ContestantAppHome`) | a card (`entity-card`) | an element only H renders (give H's list a test id of its own) |
| nothing to edit | zero-entity | the root | the signed-in-as line | the view's Logout or support button |

Neither entry can use the home markers the other entries use, for the reason 172 gives for its gate entry: the view replaces the page at that URL. The existing `cand-home` entry keeps working — the stored single-entity session asks for the root and is redirected to its entity home.

### R-6.6 pgTAP (D-22) and unit tests

- **`36-entity-identity.test.sql`.** Keep "What anon can read", the fixture and its five users, "Catalog" (re-pointed to the two functions: both `SECURITY INVOKER`; the helper still private, definer, `search_path` empty, executable by `authenticated`) and "One editor per candidate". Replace "Who the caller is" with the cases of R-1.2's table — it is D-22's list case for case, and rows 8 and 9 are the "from the table, not the token" assertions the file already has in spirit (*"The claim is built while U1 holds one candidate-editor grant in project A; the second grant is written afterwards and the claim is not rebuilt"*). Delete the `throws_ok` on the hint. Recount `plan (N)`.
- **One addition worth making:** assert the return shape for a user with no grant is one row whose `entities` is an empty array — that is O-1's promise to Phase 178, and a test is what keeps it.
- **Unit tests for the loads** (drive each `load` with a fake event, as `routes/admin/layout.server.test.ts` and `routes/admin/(protected)/layout.server.test.ts` do): user level — no session, read failure, gate pending (list not read), list returned filtered; root — gate pending returns no redirect, zero, one (the redirect target), several; entity level — gate pending (entity not read), not in the list → root, no row → root, read error → `loginFailed`, no nomination → `candidateNoNomination`, organization happy path; resolver — one entity → the entity path, several → root; plus the two tracking guards of R-2.4 and the matcher tests of R-2.5.
- **Store tests** (`contestantUserDataState.svelte.test.ts` exists): a draft made for A is absent after `init` for B and present again after `init` for A; the image edit is gone after the swap; `save()` for an organization calls `updateAnswers` with `type: 'organization'`; logout removes every entity's key; leaving an entity keeps the draft.
- **Writer tests** (`supabaseDataWriter.test.ts` exists, fully mocked): the list is narrowed and filtered; `getEntityUserData` for an organization stamps `type: 'organization'`, reads nominations by `organization_id`; `_setAnswers` for an organization uploads under `<project>/organizations/<id>/`; an unsupported type throws naming it.
- **"One adapter-level write against the local database" (D-19).** The frontend has no test that reaches a real database: every adapter test mocks the client `[VERIFIED: tree]`. The one precedent for a live test is `packages/dev-seed/tests/integration/default-template.integration.test.ts`, gated with `describe.skipIf(!process.env.SUPABASE_URL)` and guarded against skipping silently in the job meant to run it `[VERIFIED: tree]`. Recommendation: one frontend integration test in that mould — create a user and an organization-editor grant with the service role, sign in with a real client, construct the real `SupabaseDataWriter`, call `updateAnswers` for the organization, read the row back, clean up — with the closing gate showing it **ran** rather than skipped. It writes to rows it creates in the default project, not to the E2E suite's. See O-Q3.

---

## R-7 — Hazards, verification commands, and coexistence with Phases 171 and 172

### R-7.1 Verification commands that work on this host

Each status is read from the command's own exit code, never through a pipe. Long ones (`lint:check`, the root `test:unit`, `build`, the E2E run) are started in the background and polled; a foreground gate over about eight minutes trips the executor's watchdog. Phases 170 to 172 each ship a `<phase>-gates.sh` / `<phase>-e2e.sh` pair that records one status per row under `tests/e2e-runs/`; copy that shape rather than inventing one.

```bash
export PATH="$HOME/.nvm/versions/node/v24.21.0/bin:$PATH"

# Schema (in this order; the lints and the type generator read the APPLIED database)
yarn schema:regenerate                       # rewrites migrations/00001_initial_schema.sql from schema/*.sql
yarn assert:schema-migration-parity
yarn db:reset                                # only when no other run is using the stack
yarn db:types && git status --porcelain packages/supabase-types   # must print nothing after the commit
node scripts/assert-rpc-return-nullability.mjs --write            # DERIVED region only; never in CI
yarn assert:rpc-nullability
yarn assert:project-scoped-queries
yarn db:lint:sql
yarn workspace @openvaa/supabase test:db     # pgTAP

# Name gate
node scripts/assert-no-candidate-app-names.mjs
node scripts/assert-no-candidate-app-names.mjs --self-test

# Frontend, targeted
yarn workspace @openvaa/frontend vitest run layout.server.test layout.tracking contestantUserDataState supabaseDataWriter
yarn workspace @openvaa/frontend typecheck
yarn workspace @openvaa/frontend generate:translation-key-type

# Docs
yarn workspace @openvaa/docs generate:docs
yarn workspace @openvaa/docs validate:links

# Closing gate, D-24 order
yarn lint:check
yarn db:types            # no diff left
yarn db:lint:sql
yarn workspace @openvaa/supabase test:db
yarn test:unit
yarn build
tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/<name> --no-db-reset

# D-24's zero-hit greps: each must exit 1 and print nothing
git grep -n -F "get_candidate_user_data" -- ':!.planning' ':!CAND-APP-PLAN.md'
git grep -n -F "ERR_ENTITY_IDENTITY_AMBIGUOUS" -- ':!.planning'
git grep -n -F "ContestantContext-contestantUserDataStore-editedAnswers" -- ':!.planning'
git grep -n -F "userNoCandidate" -- ':!.planning'
```

The first grep excludes `CAND-APP-PLAN.md` for the reason Phase 172 gives for its own: the operator's brief sits untracked at the repository root and is never edited. It does not name the function today (`grep -c get_candidate_user_data CAND-APP-PLAN.md` is 0), and `git grep` does not read untracked files; the exclusion is belt and braces.

### R-7.2 Coexistence with the regenerate-don't-merge rules

- **One migration file, regenerated by whoever edits `schema/` last.** Phases 171 and 172 both forbid hand edits to `00001_initial_schema.sql` and to `packages/supabase-types/src/database.ts` and never run `supabase db push` `[ASSUMED: PLAN 171-02, PROH-171-06]`. This phase edits `300-auth-tables.sql` (a comment), `301-auth-functions.sql` (a comment) and `503-entity-rpcs.sql`, then regenerates. It writes no new schema file.
- **172 → 173 strictly in order (O-3).** 172-07 edits the same function this phase deletes (removing `terms_of_use_accepted` from both arms and from the override) `[ASSUMED: PLAN 172-07]`. If this phase's schema plan were written against today's tree it would carry the column back in. The schema plan's first task re-reads `503-entity-rpcs.sql`.
- **New pgTAP file numbers are taken.** 172 takes `37-terms-of-use-acceptances`, 171 takes `38-contestant-app-public-config` `[ASSUMED: PLAN 171-02, 172-01]`. This phase adds no file (D-22: `36` already owns the question).
- **Censuses other phases move.** `07-rpc-security` Section 8c is edited by 171. `36`'s "What anon can read" section enumerates foreign keys to `auth.users` that anon can select; 172's new table has such a key but grants anon nothing, so it should not move — confirm on the tree.
- **`lint-schema.mjs`** gains two allow-list entries from 172 for its table's policies `[ASSUMED: PLAN 172-01]`; this phase adds none.
- **The shared stack.** `yarn db:reset` wipes the suite's project and every other session's data, and a reset during an E2E run destroys the run. Take the reset at a moment the plan controls, once per schema change.
- **A second Supabase stack runs on this host** and must not be restarted; and a Vite dev server was seen on port 5199 belonging to another session (170-04 summary). `e2e-run.sh` starts its own server.

### R-7.3 Hazards

Collected under *Common Pitfalls* below, P-1 to P-18.

---

## Project Constraints (from CLAUDE.md)

These bind the plans with the same force as a locked decision.

| Directive | What it means for this phase |
|---|---|
| **E2E Hard Rule (cardinal).** No task completes while any E2E test fails; a "did not run" is a failure; no flaky exemptions, no retry-until-green. | Every plan that touches routes, loads or fixtures closes on a full run through `tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/<name> --no-db-reset`. A cascade from a setup project counts. |
| **E2E preflight.** The wrapper starts Supabase and one fresh dev server scoped to the suite's project; a plain `yarn dev` serves the default project. | Never point the suite at a server started by hand. Do not clear the database while a run is in flight. |
| **Context Destructuring Rule.** Never destructure a reactive accessor; never bind `dataRoot` to a `$derived` alias. | The new `entities`, `user`, selected-entity and home-route accessors are reactive: read `contestantCtx.X`. H reads `ctx.dataRoot.getEntity(…)` inside its own `$derived.by`. `userData` stays a stable reference. |
| **Results Navigation Invariants.** A load must not read the URL tracked; no named document View Transition while a modal is open. | O-4: no `url` read in the user-level, root or entity-level load; guard with a recording-Proxy test (R-2.4). H adds no `view-transition-name`. |
| **Comment Hygiene.** A comment describes the code as it is; no history, no planning references beyond `see phase N`, nothing addressed to a reviewer. | Rewrite, do not annotate: the index comment, the helper comment, the layout docblocks, the test docblocks. Gated in part by `assert:comment-hygiene`. |
| **Svelte warning-accepted format.** `// svelte-warning: accepted — <rationale>` directly above the line. | If a `state_referenced_locally` or similar appears in the store's handle swap, fix it at source first. |
| **Localization.** Every user-facing string in all supported locales. | Seven catalogues (`da, en, et, fi, fr, lb, sv`) for H, the "nothing to edit" view and the switch item; `yarn workspace @openvaa/frontend generate:translation-key-type` afterwards. |
| **Accessibility.** WCAG 2.1 AA; the axe scan is a gate. | Two new scan entries per theme (R-6.5); a violation is fixed at source, never excluded. |
| **TypeScript strictly.** No `any`; explicit types; TSDoc on exported symbols. | The entity union is discriminated by `type`; the list is narrowed with zod, never cast. |
| **Never read a gate's status through a pipe.** | D-24 restates it. |
| **`CLAUDE.md` / `.claude/` are agent docs.** They describe the tree. | `CLAUDE.md` § *Frontend* names `apps/frontend/src/routes/contestant/(protected)/` as "protected routes"; that stays true. `.claude/skills/database/*` and `.claude/skills/components/context-reactivity.md` (its accessor list) change with the code. |
| **Code review checklist** (`.agents/code-review-checklist.md`). | Check before each plan closes. |

Project skills consulted: `database` (the grant model, the migration-regeneration rule, the pgTAP conventions), `components` (the three libraries' dependency rule, `@component` docstrings, `concatClass`, the context rule), `spike-findings-voting-advice-application-gsd` (the results-redraw reference behind O-4).

## Architecture Patterns

### System Architecture Diagram

```
 browser request  /contestant/…
        │
        ▼
 hooks.server.ts  appGateHandle ── route id is under (protected) and no session ──► 303 login?redirectTo=<path>
        │ session
        ▼
 (protected)/+layout.server.ts ............................................ USER LEVEL
   getBasicUserData ── fails ──► sign out, 307 login (loginFailed)
        │
   firstNeededGate(user) ── a gate ──► { gate, user } ──► layout renders the gate view AT THIS URL
        │ none                                              (accept → invalidateAll → everything below reruns)
   get_user_entities  ─►  zod  ─►  keep served types  ─►  { gate: null, user, entities }
        │
        ├── URL is the root ─────────────► (protected)/+page.server.ts ............ ROOT
        │                                     0 entities ─► "nothing to edit" view (email, support, Logout)
        │                                     1 entity   ─► 307 /contestant/<type>/<id>
        │                                     several    ─► H  (EntityList; each card links to an entity home)
        │
        ├── URL is /<page> with no entity ─► (protected)/[...page]/+page.server.ts . RESOLVER
        │                                     1 entity ─► 307 /contestant/<type>/<id>/<page>
        │                                     else     ─► 307 root
        │
        └── URL is /<type>/<id>/… ────────► [entityType]/[entityId]/+layout.server.ts . ENTITY LEVEL
                                              (type, id) not in entities ─► 307 root
                                              get_entity_user_data ── no row ─► 307 root
                                                                   ── error ─► sign out (loginFailed)
                                              nominations ── none ─► sign out (candidateNoNomination)
                                              getQuestionData ─► { questionData, contestantUserData }
                                                     │
                                                     ▼
                                    [entityType]/[entityId]/+layout.svelte
                                      setDataRoot(provide questions, entities)
                                      userData.init(entity data)  ─► draft handle keyed by <type>-<id>
                                                     │
                                                     ▼
                                    home · profile · questions · preview · settings
                                      save ─► SupabaseDataWriter ─► upsert_answers / scopedFrom(<table>) / storage
                                                                     (RLS decides, from the token's claim)
```

### Recommended Project Structure

See R-2.2 for the route tree. New and changed files outside it:

```
apps/frontend/src/params/
├── <entity type matcher>.ts (+ test)        'candidate' | 'organization'
├── <uuid matcher>.ts (+ test)
└── <entity-less page matcher>.ts (+ test)
apps/frontend/src/lib/contestant/components/
├── <nothing to edit>/                       the reusable body (D-11)
└── <contact support>/                       the block the Help page and the view share
apps/frontend/src/lib/api/adapters/supabase/utils/
└── <user entities schema>.ts                zod narrowing of get_user_entities
tests/tests/setup/…                          the dedicated setup and teardown (D-20)
tests/tests/specs/contestant/…               the selection-and-switch spec
tests/tests/utils/…                          the entity URL helper; grantEntity on the admin client
```

### Pattern 1: A load reads only the params it means to depend on
**What:** read `params.entityType` and `params.entityId`, call `await parent()` first, never touch `url` or `route`.
**When to use:** the user-level and the entity-level server loads.
**Example:** *Code Examples*, "The three loads".

### Pattern 2: The root decides, the entity checks, both from one fresh list
**What:** the user-level load owns the list; the root page load and the entity-level load both take it from `await parent()`.
**When to use:** any redirect that depends on what the user may edit. Never decide a redirect from a list a child fetched for itself while the parent holds another.

### Pattern 3: Per-card action as data
**What:** `EntityList` with `cards: Array<EntityCardProps>`, each carrying its own `action`.
**When to use:** H now (URL strings); Phase 177's selectors later (handlers).

### Pattern 4: Provide to the `DataRoot` where you consume
**What:** the component that renders entity objects provides them itself through `setDataRoot`, then reads `ctx.dataRoot.getEntity(…)` in its own derived.
**When to use:** H. The precedent is the preview page.

### Pattern 5: Present, not absent — every "not yours" is the same redirect
**What:** not in the list, no row, unserved type, mismatch → one `redirect(307, root)`; never a sign-out, never a distinguishing status.
**When to use:** the entity-level load (D-10).

### Anti-Patterns to Avoid
- **Reading `url` for anything in these loads**, including inside a helper the load calls. If a path is ever needed for a redirect target, read it inside `untrack`.
- **Passing `params` whole to a helper.** Each key the helper reads becomes a dependency; pass the two values.
- **A `LEFT JOIN` from the helper's ids in the list function.** It lists entities the read then refuses (R-1.2 row 8).
- **Building an entity route on a page with no entity in its URL.** It throws; gate the link on the selected entity.
- **Providing H's entities from a layout.** `provideEntityData` resets; the entity-level layout wipes them.
- **Calling `userData.reset()` to leave an entity.** It clears the draft D-16 says to keep.
- **Signing out in a spec that uses a stored session.**
- **Hand-editing the generated migration or the generated types.**

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| "Which entities do I edit" | a second query over `grants`, or a read of the token's claim | `private.caller_entity_ids` under both new functions | `grants` is revoked from every API role; the claim is up to an hour stale |
| The served-types rule | a membership test on `contestantApp.entityTypes` | `getServedEntityTypes(settings)` from `@openvaa/app-shared` | PROH-171-02: no reader outside the accessor module reads the two keys; the accessor is total on `{}` and never empty |
| A list of selectable entity cards | a new list component | `EntityList` + `EntityCard` with per-card `action` | exists, and serves 177 unchanged |
| Getting an entity object for a card | constructing `Candidate`/`Organization` by hand | `setDataRoot` + `provideEntityData` + `DataRoot.getEntity(type, id)` | the preview page's pattern; keeps the single source of truth |
| Route strings | template literals for in-app links | `getRoute.current(…)` in components, `buildRoute({ route, locale, entityType, entityId })` on the server | the builder already carries the entity params; `routeConsistency.test.ts` guards the map |
| Validating a post-login target | a new allowlist | `safeRedirectTarget` | the entity path already passes it |
| Narrowing a `jsonb` RPC answer | `as Json as unknown as X` | a zod schema in the adapter's `utils/` | `assert:adapter-casts` fails the cast |
| Focus and announcement after navigation | per-page focus code | `MainContent` with a `title` | the root layout's `afterNavigate` and `#route-announcer` do the rest |
| Persisted drafts | raw `localStorage` calls in the store | `localStorageState` (versioned, SSR-gated), plus one prefix-sweep function added beside it | version expiry and the browser gate live there |
| A second stored session | a new login walk | Phase 172's register-and-store-session helper | one helper, one login path |
| A project-scoped table read | `this.supabase.from('organizations')` | `this.scopedFrom(<table>)` | the scoping guard fails the bare form |
| The migration | editing `00001_initial_schema.sql` | `yarn schema:regenerate` | parity is a link of `lint:check` |

**Key insight:** almost nothing in this phase is new machinery. The organization arm exists in SQL, in RLS, in the column grants, in storage and in `upsert_answers`; the route params exist in the builder; the card list exists. The work is removing five candidate-only shortcuts and one raise, and moving a tree — so the risk is in what the move disturbs, not in what is built.

## Runtime State Inventory

The phase renames a database function, moves a route tree and re-keys a browser-storage entry, so the question "what still holds the old thing after every file is updated" has answers.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | `public.grants` rows are unchanged in shape and meaning. The **applied local database** keeps `get_candidate_user_data` until it is reset. | `yarn db:reset` after `yarn schema:regenerate` and before `yarn db:types`, `yarn db:lint:sql` and pgTAP — all three read the applied database, not the files. No data migration: nothing is deployed. |
| Live service config | None. The auth redirect allowlist names `api/auth/callback`, which does not move; no dashboard-held setting names a protected route. Verified by reading the redirect producers (R-2.6). | none |
| OS-registered state | None — verified: no scheduled task, service unit or process manager entry names a route or the function. | none |
| Secrets/env vars | None — no variable names a route, the function or the storage key. | none |
| Build artifacts | `apps/frontend/.svelte-kit/types` holds generated `$types` for the moved routes; `packages/supabase-types/src/database.ts` is generated; the docs site's generated route map and component pages; Playwright's stored sessions under `tests/playwright/.auth/` (they include `localStorage`, so they carry the old draft key until rewritten by the setup); the Turbo cache. | `svelte-kit sync` (run by `typecheck`/`build`), `yarn db:types`, `yarn workspace @openvaa/docs generate:docs`; the stored sessions are rewritten by every run's setup. Restart any hand-started dev server after moving route files — Vite's HMR has served stale modules in this repository before. |
| Browser storage | The fixed draft key in any developer's browser is orphaned by the re-key. | none (nothing deployed; Phase 170 took the same position for its four keys). |

## Common Pitfalls

### P-1: A link to an entity route, built on a page with no entity, throws
**What goes wrong:** `Missing parameter 'entityType' in route /contestant/(protected)/[entityType=…]/…` during render, on the root, Help, Privacy and password reset, for any signed-in user.
**Why it happens:** `resolve_route` throws for a missing required param; `ContestantNav` builds four entity links whenever `isAuthenticated`, and it is mounted above every contestant page. `Banner.svelte`'s default return callback and the Help and Privacy pages' "home" buttons build the home link the same way.
**How to avoid:** one reactive "selected entity" accessor on the context (from `page.params`), and entity items rendered only when it is set; one "home route" accessor for the home link (R-2.7).
**Warning signs:** a 500 on `/contestant/help` while signed in; an axe scan of H that never reaches its marker.

### P-2: The name gate reports `/contestant/candidate/…`
**What goes wrong:** `yarn lint:check` fails at link 8 on a test, a comment or a docs page that writes the entity URL with a literal type.
**How to avoid:** R-2.9 — amend the lookbehind with a fixture line in the route plan; until then write the alternation `(?:candidate|organization)` or interpolate.
**Warning signs:** a finding named `/candidate URL` or `candidate/ URL (slashless)`.

### P-3: One tracked `url` read, or one extra `params` key, and the entity reloads on every click
**What goes wrong:** the entity-level load reruns on every in-entity navigation, the layout's effect re-runs `userData.init`, and the page shows `<Loading />` between questions — the `(located)` defect, in the contestant app.
**Why it happens:** `uses.url` is set by any property read on `url`; `uses.params` by each key read, including through a helper that receives `params`; `uses.route` by `route.id`.
**How to avoid:** R-2.4's guard tests, with the negative controls.
**Warning signs:** the questions walk in `contestant-journey` slows or flakes at the per-question step; a network panel showing `__data.json` on every question.

### P-4: A redirect loop between the root and an entity
**What goes wrong:** the root says "one entity" and redirects; the entity-level load says "not yours" and redirects back.
**Why it happens:** the two decisions read different things — a list cached since the page first loaded, and a fresh table-backed read.
**How to avoid:** the user-level load tracks the two entity params so it reruns on every root ↔ entity transition (R-2.3); the list function lists only what the read returns (R-1.2). Add a unit test in which the grant disappears between two loads.
**Warning signs:** `ERR_TOO_MANY_REDIRECTS` after a grant is removed in a test.

### P-5: `provideEntityData` resets every entity collection
**What goes wrong:** H renders no cards, or throws `DataNotFoundError`, after the user has visited an entity and come back.
**How to avoid:** H provides its own entities when it mounts and when the list changes (R-4.3).

### P-6: The store still holds the last entity on H
**What goes wrong:** on H or the "nothing to edit" view, `LogoutButton` opens the "questions left" modal about the entity the user just left; `help/+page.svelte`'s `userData.current ? … : …` reads a stale entity.
**Why it happens:** the store is created once per page session and `init` only ever overwrites.
**How to avoid:** a store method that drops the saved data and the image edit but keeps the persisted draft, called when the entity-level layout is torn down. `reset()` stays the logout path. Once the store is empty off an entity, the Help and Privacy pages' `userData.current ? <home> : <login>` test reads "signed out" for a signed-in user; key those two buttons on `isAuthenticated` instead.

### P-7: Drafts and the answers lock
**What goes wrong:** a draft stored for entity B before the lock is overlaid on B's saved answers when B is opened after it.
**Why it happens:** the constructor's effect runs when `answersLocked` changes, not when the active entity does.
**How to avoid:** read the active draft handle inside that effect, so it reruns on a swap. Also: a new handle writes `{}` under its key when it is constructed, so every visited entity leaves a key — the logout sweep is by prefix, not by a list of known ids.

### P-8: `EntityCard` on H reads questions that are not loaded
**What goes wrong:** `DataNotFoundError` from `dataRoot.getQuestion`, for every candidate card, in any project whose `results.cardContents.candidate` names a question — the E2E base dataset is one.
**How to avoid:** the header-only option of R-4.1, which must skip the lookup.

### P-9: Splitting the load can undo Phase 172's gate guarantees
**What goes wrong:** a gated user's entity is read anyway, or a gated single-entity user is redirected before seeing the gate, or a gated user with a stale entity URL is bounced to the root.
**Why it happens:** SvelteKit runs sibling and child loads concurrently unless they await the parent.
**How to avoid:** every child load starts with `const { gate, … } = await parent(); if (gate) return {};`. Re-prove "the entity read is not called for a gated user" on the entity-level load, and add "the root returns no redirect while gated".

### P-10: Stored sessions are shared sessions
**What goes wrong:** a spec signs out and every later scan under the same `storageState` lands on the login page — a cascade of did-not-runs.
**How to avoid:** sign-out cases sign in fresh; the two new stored sessions are read-only for the run (R-6.4). Add the new spec project to `data-setup-perm-1e1cg1co`'s dependencies, or a perm setup replaces the settings row under it.

### P-11: The base dataset is shared with the voter specs, in parallel
**What goes wrong:** the selection spec saves an answer to a visible candidate while `voter-journey` is asserting rankings.
**How to avoid:** O-Q1 — dedicated unconfirmed rows.

### P-12: The tests' route builder passes a param segment through as text
**What goes wrong:** `buildRoute({ route: 'ContestantAppProfile', locale: 'en' })` returns `en/contestant/[entityType=…]/[entityId=…]/profile`, the app answers 404, and the failure reads as a missing page.
**How to avoid:** make the builder throw on an unfilled param (R-6.3).

### P-13: Schema ordering and generated artifacts
**What goes wrong:** the dropped terms column reappears in the new function; `db:types` shows a diff at the gate; the name gate's self-test fails on shifted line numbers.
**How to avoid:** re-read `503-entity-rpcs.sql` as 172 left it; reset before generating; edit the gate's fixture lines in place (R-1.5).

### P-14: The widened entry gate and the coarse role
**What goes wrong:** an administrator who is also an organization editor is refused by the Admin App.
**Why it happens:** `_getBasicUserData` tests the contestant shapes first — *"The candidate arm is tested first"* — and `requireAdminIdentity` and the admin protected layout test `role !== 'admin'`. Today that locks out an admin who also edits a candidate; D-12 extends it to organization editors.
**How to avoid:** O-Q2.

### P-15: Two structural gates watch the route tree
**What goes wrong:** `yarn test:unit` fails in `routeConsistency.test.ts` (C1: a protected page directory with no `ROUTE` entry), or `lint:check` fails in `assert:no-session-in-loads` (an anchor file missing, or a load returning the session binding).
**How to avoid:** a `ROUTE` key for the entity home and for the resolver; leave `contestant/+layout.server.ts` where it is; the new loads destructure `{ session }` for their own check and return none of it.

### P-16: A zero-row read and a failed read are different things
**What goes wrong:** with `.single()`, "not yours" arrives as an error and signs the user out; with a list that swallows a parse failure into `[]`, a user with entities is told there is nothing to edit.
**How to avoid:** `.maybeSingle()` for the one-entity read; a failed or malformed list is `loginFailed`.

### P-17: The draft-key grep can never be empty if the new key keeps the old stem
**How to avoid:** a different stem (R-4.6).

### P-18: Seven locales, one generated type, one parity test
**What goes wrong:** a key present in `en` only fails `apps/frontend/src/lib/i18n/tests/translations.test.ts`; a removed key still in `translationKey.ts` fails `typecheck`.
**How to avoid:** add and remove in all seven files in one commit; regenerate the key type; non-English copy is constructed and gets the same native-speaker review todo Phase 171 files for its names.

## Code Examples

Sketches, not final code. Every identifier in them is either on the tree, in a 171/172 plan (marked), or a name this phase introduces (marked `NEW`).

### The three loads

```ts
// (protected)/+layout.server.ts — USER LEVEL
// On the tree: createDataWriter, createDataProvider, getLocale, buildRoute, redirect, log.
// [ASSUMED: PLAN 172-04] firstNeededGate from $lib/contestant/gates/gates.
// [VERIFIED: tree @a4b408eb7] getServedEntityTypes from @openvaa/app-shared.
// NEW: dataWriter.getUserEntities().
export async function load({ fetch, locals, params }) {
  const lang = getLocale();
  const { session } = await locals.safeGetSession();
  if (!session) return redirect(307, buildRoute({ route: 'ContestantAppLogin', locale: lang }));

  // Read on purpose: this load reruns when the selected entity changes, and on nothing else.
  void params.entityType;
  void params.entityId;

  const dataWriter = createDataWriter({ fetch, locals });
  const user = await dataWriter.getBasicUserData().catch(() => undefined);
  // `signOutWith` stands for the load's existing `handleError`: sign out locally, then 307 to login with the code.
  if (!user) return await signOutWith('loginFailed');

  const gate = firstNeededGate(user);
  if (gate !== null) return { gate, user };

  const [all, settings] = await Promise.all([
    dataWriter.getUserEntities().catch(() => undefined),
    createDataProvider({ fetch, locals }).getAppSettings({ locale: lang }).catch(() => ({}))
  ]);
  if (!all) return await signOutWith('loginFailed');
  const served = getServedEntityTypes(settings);
  return { gate: null, user, entities: all.filter((entity) => served.includes(entity.type)) };
}
```

```ts
// (protected)/+page.server.ts — ROOT (the shape after plan 4)
export async function load({ parent }) {
  const data = await parent();
  if (data.gate !== null) return {};
  const { entities } = data;
  if (entities.length === 1) {
    const [{ type, id }] = entities;
    redirect(307, buildRoute({ route: 'ContestantAppEntityHome' /* NEW */, locale: getLocale(), entityType: type, entityId: id }));
  }
  return { view: entities.length === 0 ? ('nothingToEdit' as const) : ('select' as const) };
}
```

```ts
// [entityType=…]/[entityId=…]/+layout.server.ts — ENTITY LEVEL
export async function load({ fetch, locals, params, parent }) {
  const data = await parent();                       // first: a gated user's entity is never read
  if (data.gate !== null) return {};
  const { entityType, entityId } = params;           // the only two keys read
  const lang = getLocale();
  const root = buildRoute({ route: 'ContestantAppHome', locale: lang });
  if (!data.entities.some((e) => e.type === entityType && e.id === entityId)) redirect(307, root);

  const dataWriter = createDataWriter({ fetch, locals });
  const read = await dataWriter
    .getEntityUserData({ type: entityType, id: entityId, loadNominations: true })   // NEW
    .then((value) => ({ ok: true as const, value }))
    .catch(() => ({ ok: false as const }));
  if (!read.ok) return await signOutWith('loginFailed');
  if (!read.value) redirect(307, root);              // no row: not yours any more
  // …nomination check (candidateNoNomination), getQuestionData, return — as the load does today
}
```

`redirect` throws, so a `redirect(…)` inside a `try` or after a `.catch` on the same promise must not be swallowed; keep the redirects outside the caught expressions, as above.

### Matchers

```ts
// src/params/<entity type matcher>.ts — in the form of etSg.ts
export function match(param: string): param is 'candidate' | 'organization' {
  return param === 'candidate' || param === 'organization';
}
```

The uuid matcher and the entity-less page matcher are the two places a regular expression is the honest tool; `etSg.ts`'s docstring says "no regex" of an allowlist of words, not of a format check. The page matcher returns `false` for `''`.

### The tracking guard

```ts
// Modelled on (voters)/(located)/layout.tracking.test.ts; `recordingUrl` is that file's helper.
it.each(['/contestant/candidate/<uuid>', '/contestant/candidate/<uuid>/questions/<uuid>?x=1'])(
  'reads no url property and only the two entity params (%s)',
  async (path) => {
    const { url, trackedReads, untrack } = recordingUrl(`http://localhost${path}`);
    const paramReads: Array<string> = [];
    const params = new Proxy({ entityType: 'candidate', entityId: ID, questionId: QID }, {
      get: (target, key) => { if (typeof key === 'string') paramReads.push(key); return Reflect.get(target, key); }
    });
    await load({ fetch, locals, params, parent, url, untrack, route: forbidden() } as never);
    expect(trackedReads).toEqual([]);
    expect(new Set(paramReads)).toEqual(new Set(['entityType', 'entityId']));
  }
);
```

(The literal paths in that sketch are what P-2 is about.)

### The two functions

R-1.2, as run.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| "Which entity am I" answered by one function that raises on two | A list and a one-entity read; the selection is the URL | this phase | The frontend, not the database, holds "which one" |
| The whole protected tree behind one load that runs once | A user-level and an entity-level load with declared dependencies | this phase (Phase 172 prepares it with the gate list and the named entity step) | Reruns become part of the design and need guard tests |
| One draft key | One key per entity | this phase | Logout sweeps by prefix |
| `userNoCandidate` / `userNotAuthorized` sign-outs | A signed-in "nothing to edit" view | this phase (operator overrule 173-B5 (b)) | Reused by Phases 178 and 179 |

**Deprecated/outdated:**
- `get_candidate_user_data` and `ERR_ENTITY_IDENTITY_AMBIGUOUS`: deleted, not aliased (D-04).
- The gate exemption for that function: deleted with it.
- `userNoCandidate`: retired (it was already unreachable).

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Phase 172 leaves the protected load as five stages with `firstNeededGate(user)`, a named entity-step function, and the two return shapes `{ gate, user }` / `{ gate: null, user, … }` | R-2.3, R-3.5, *Code Examples* | The split starts from a different load; the user-level skeleton changes |
| A2 | Phase 172 removes `terms_of_use_accepted` from the function, the override and the frontend types before this phase starts | R-1.2, R-1.4, R-5.1 | The new function's column list and the override's member list are off by one |
| A3 | Phase 172's session helper takes one `externalId` and lives inside `auth.setup.ts` | R-6.4 | The multi-grant setup needs less (or more) plumbing than described |
| A4 | Phase 171 makes `mergeAppSettings` deep and its templates state the whole `contestantApp` root with `entityTypes: ['candidate']` | R-6.1 | The widening must restate more than one list |
| A5 | Phase 171 names the three app names as planned, and adds a base-dataset heading assertion reading "Candidate app" | R-6.1 | The re-baseline population differs; re-derive with the command given |
| A6 | Phase 171's accessor module keeps the exports read at `a4b408eb7` | R-2.5, *Code Examples* | Import names change |
| A7 | `plpgsql_check` (`supabase db lint`) does not analyse `LANGUAGE sql` functions | R-1.2, R-1.4 | A lint finding to fix in the schema plan; low cost |
| A8 | A static or matcher-constrained route always wins over a rest route for the same path | R-2.6 | The resolver would shadow an entity route; an E2E case and `routeConsistency` would show it at once |
| A9 | `scopedFrom` called with a union of two table names typechecks through `update(…).select(…).single()` | R-5.3 | Fall back to a two-arm `switch`; no design change |
| A10 | Playwright refuses a setup file importing another setup file | R-6.4 | The helper could stay where 172 put it |
| A11 | The generated type of `get_user_entities` is `Returns: Json` | R-1.4, R-1.6 | The zod narrowing is needed either way |
| A12 | 172's new table does not move `36`'s "What anon can read" census | R-7.2 | One expected-value edit, in 172's phase not this one |
| A13 | The two opt-in visual baselines do not render the app's name | R-6.1 | Two baseline images to regenerate after the widening |

Every `[ASSUMED: PLAN …]` mark in the body is one of A1 to A6. They are assumptions about a tree that does not exist yet, not about facts that could have been checked: the plan's first task (a name-and-state resolution like `171-NAME-MAP.md` and 172's `172-NAMES.md`) turns each into a measurement.

## Open Questions (RESOLVED)

1. **Does the definer census move, and can the user-level read carry a per-user field later?**
   Resolved by experiment: no census moves; one object with an `entities` array returns exactly one row for a user with no entity, and a private definer helper adds a key without changing signature or cardinality (R-1.2, R-1.3).

2. **Does a list read through RLS still "read the table" for D-10?**
   Resolved by experiment: yes for revocation (immediate), and for a new grant it lists only once the token carries it — which is the only behaviour that keeps the root's redirect loop-free (R-1.2 rows 8 and 9). CONTEXT.md's "listed at once" is not achievable with an `INVOKER` list and should not be chased.

3. **Does `getRoute` need work to "fill the two params from the current page"?**
   Resolved: no. Both names are already route params and the builder already carries every route param of the current page (R-2.1). What needs work is the opposite case, P-1.

4. **Is the "nothing to edit" view a route or a view of the root?**
   Resolved as a recommendation within Claude's discretion: a view of the root page (R-3.2).

5. **Can one card-list component serve H and Phase 177?**
   Resolved: `EntityList` already does (R-4.2). `EntityCard` needs a header-only option and a type-label slot (R-4.1).

6. **How does the entity-level load get the list for the D-10 check?**
   Resolved: from `await parent()`, with the user-level load tracking the two entity params so the list is fresh whenever the check runs (R-2.3).

7. **Which plan carries the "nothing to edit" view?**
   Resolved as a recommendation: plan 4, with plans 1 to 3 preserving today's real outcome (`loginFailed`) for both the zero and the several case (R-3.4).

8. **Is there a reason to keep the `userNotAuthorized` sign-out in the contestant load?**
   Resolved: none found (R-3.3). The admin side's is separate and stays.

9. **What resolves a protected link that names no entity?**
   Resolved as a recommendation: one matcher-guarded rest route in `(protected)` (R-2.6).

10. **Does the widened `MINIMAL_BASE_APP_SETTINGS` follow the base?**
    Resolved as a recommendation: no; leave the perm family candidate-only and record it (R-6.1).

11. **What is the zero-entity session's mechanism?**
    Resolved: register with one organization grant, store the session, delete the grant (R-6.4).

## Open Questions for the Operator

1. **O-Q1 — Two dedicated, unconfirmed candidates and one organization in `e2e/base` for the selection spec?**
   - What we know: D-20 says "two base candidates that no other spec's user edits" and "one base organization", derived at run time. The spec must save an answer. The base dataset is read in parallel by the voter specs, which assert rankings and card contents; the only contestant spec that writes today writes to a candidate voters cannot see.
   - What's unclear: whether adding three rows to the base dataset is within D-20, which describes choosing among existing rows.
   - Recommendation: add them, `confirmed: false`, one nomination each. They are base rows nobody else edits, and they make the spec's writes invisible to every other project. If the answer is no, the planner must name two existing candidates and show, per voter spec, that what the selection spec writes is never read — which a search cannot prove.

2. **O-Q2 — The coarse role, once the entry gate admits organization editors.**
   - What we know: `_getBasicUserData` reports `'candidate'` whenever the token has a contestant-shaped grant, before it looks for an admin grant; the Admin App refuses anything but `'admin'`. An administrator who also edits an entity is locked out of the Admin App today (candidates) and more often after D-12 (organizations). After D-11, nothing in the Contestant App reads the role.
   - What's unclear: whether the lock-out is intended.
   - Recommendation: test the admin shapes first, so an admin grant is never masked, and pin it with a unit test. It is a one-line reorder inside the function D-12 already edits. If the operator prefers to leave behaviour alone, record it as a known defect for the Admin App.

3. **O-Q3 — What counts as "one adapter-level write against the local database" (D-19)?**
   - What we know: the frontend has no test that reaches a database; every adapter test is mocked. The only live-database unit test in the repository is dev-seed's, gated on `SUPABASE_URL` and run by a dedicated CI job.
   - What's unclear: whether a new gated frontend integration test is wanted, or whether a pgTAP case (an organization editor's `upsert_answers` and image update under RLS) plus the mocked writer tests is enough.
   - Recommendation: the gated frontend test, shown to have run in the closing gate. It is the only option in which the real writer class meets the real database. No CI job runs it; say so in the summary.

4. **O-Q4 — Amending Phase 170's name gate.**
   - What we know: the gate reports the literal `/contestant/candidate/…` (R-2.9), and Phase 170 recorded as a prohibition that the gate is not to be made green by a loosened pattern.
   - Recommendation: admit `contestant` in the one lookbehind, with a fixture line, as a declared change. The form it admits could not have been an old app URL.

5. **O-Q5 — D-16's "switching loses nothing" beside the existing discard prompt.**
   - What we know: the two editing pages already discard the draft on any confirmed navigation (R-4.6).
   - Recommendation: leave the prompt as it is; D-16 then holds for the store (per-entity drafts survive a reload and a switch from any page without the prompt) and the spec proves it through a reload.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node (via nvm) | every `yarn` command | ✓ | v24.21.0 at `$HOME/.nvm/versions/node/v24.21.0/bin` | — (the shell's default `node` is below the engines floor; prefix `PATH`) |
| Local Supabase stack | `db:reset`, `db:types`, `db:lint:sql`, pgTAP, E2E | ✓ running (`supabase_db_openvaa-local`, PostgreSQL 17.6.1.171) | — | — |
| Homebrew PostgreSQL 17 (`initdb`, `pg_ctl`, `psql`) | a private database for DDL experiments | ✓ `/usr/local/opt/postgresql@17/bin` | 17.6 | — |
| Docker | the stack; the opt-in visual container | ✓ | — | — |
| Playwright browsers | E2E | not probed this session (no E2E run was allowed) | — | `yarn playwright install` |

**Notes for a throwaway database** (it took three attempts): the scratchpad path is too long for a Unix socket — start with `-c unix_socket_directories=''` and connect over TCP; stub roles `anon`, `authenticated`, `service_role`, `supabase_auth_admin`, schemas `auth` (`users`, `uid()`, `jwt()`), `storage` (`buckets`, `objects`, `foldername()`) and `extensions`; replace the `CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;` statement; and set `ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES/FUNCTIONS … TO anon, authenticated, service_role` **after** creating the schema, or `authenticated` has no table privilege and every `INVOKER` function fails with `permission denied`.

**Missing dependencies with no fallback:** none.
**Missing dependencies with fallback:** none.

## Validation Architecture

`workflow.nyquist_validation` is absent from `.planning/config.json`, so this section applies.

### Test Framework
| Property | Value |
|----------|-------|
| Frameworks | Vitest (frontend, packages), pgTAP (`supabase test db`), Playwright with `@axe-core/playwright` |
| Config files | `apps/frontend/vitest.config.ts`, `apps/supabase/supabase/tests/database/*.test.sql`, `tests/playwright.config.ts` |
| Quick run command | `yarn workspace @openvaa/frontend vitest run <file filter>`; `yarn workspace @openvaa/supabase test:db` |
| Full suite command | `yarn test:unit`; `tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/<name> --no-db-reset` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ENT-03 | A user with two candidate grants, or a candidate and an organization, is listed with both; no raise | pgTAP | `yarn workspace @openvaa/supabase test:db` | ✅ `36-entity-identity.test.sql` — rewritten |
| ENT-03 | Zero grants return one row with an empty array; `admin` role, faction, other project excluded | pgTAP | same | ✅ same file, new cases |
| ENT-03 | The index still refuses a second editor on a candidate | pgTAP | same | ✅ same file, kept |
| GEN-02 | The one-entity read returns an organization's row; someone else's and a mismatch return no row | pgTAP | same | ✅ same file, new cases |
| GEN-02 | Output shape and no-`DEFAULT` pins on the new functions | pgTAP | same | ✅ `21-entity-organization.test.sql` — re-pointed |
| ENT-03 | The definer census is unchanged | pgTAP | same | ✅ `07-rpc-security.test.sql` — untouched, must stay green |
| GEN-02 | The writer reads, saves answers, uploads and updates the image for an organization; an unsupported type throws by name | unit | `yarn workspace @openvaa/frontend vitest run supabaseDataWriter` | ✅ file exists; cases new |
| GEN-02 | The real writer saves an organization's answers against the local database | integration | `SUPABASE_URL=… yarn workspace @openvaa/frontend vitest run <integration file>` | ❌ Wave 0 (pending O-Q3) |
| ENT-02 | A draft for A is absent for B and back for A; the image edit resets; logout clears every key; leaving keeps the draft | unit | `yarn workspace @openvaa/frontend vitest run contestantUserDataState` | ✅ file exists; cases new |
| ENT-01 | The root load: gate pending, zero, one (redirect target), several | unit | `yarn workspace @openvaa/frontend vitest run page.server.test` | ❌ Wave 0 |
| ENT-02 | The entity-level load: gate pending, not in list, no row, read error, no nomination, organization | unit | `yarn workspace @openvaa/frontend vitest run layout.server.test` | ❌ Wave 0 (172 creates the file for the single load) |
| ENT-02 | Neither load reads `url`; each reads exactly the two entity params | unit | `yarn workspace @openvaa/frontend vitest run layout.tracking` | ❌ Wave 0 |
| ENT-01 | The matchers accept the vocabulary and a uuid and nothing else | unit | `yarn workspace @openvaa/frontend vitest run params` | ❌ Wave 0 |
| ENT-01 | The route map and the tree agree | unit | `yarn workspace @openvaa/frontend vitest run routeConsistency` | ✅ |
| ENT-01, ENT-02 | A multi-grant user sees H, picks, switches; saves land on the selected entity only; a foreign entity URL lands on H; a single-entity user never sees H | E2E | the wrapper, full suite | ❌ Wave 0 |
| ENT-01 | The zero-entity view shows the signed-in email and its Logout signs out | E2E | the wrapper | ❌ Wave 0 |
| ENT-01 | H and the zero-entity view pass axe in both themes | E2E (axe) | the wrapper | ✅ `contestant-a11y.spec.ts` — new entries |
| E2E-03 | Every existing spec still passes on the moved routes | E2E | the wrapper | ✅ |

### Sampling Rate
- **Per task commit:** the targeted Vitest filter for the files touched, plus `yarn workspace @openvaa/frontend typecheck`; for schema tasks, pgTAP.
- **Per plan close:** the phase's gate set and one full E2E run (D-23: "each closing green").
- **Phase gate:** D-24's sequence on one HEAD, then the four zero-hit greps.

### Wave 0 Gaps
- [ ] A name-and-state resolution file (as `171-NAME-MAP.md`), re-measuring every `[ASSUMED: PLAN …]` fact on the tree 171 and 172 leave, with a baseline gate set and E2E run recorded before any source edit
- [ ] The phase's gate and E2E drivers, in the shape of `172-gates.sh` / `172-e2e.sh`
- [ ] `(protected)/page.server.test.ts` — the root load
- [ ] `(protected)/layout.tracking.test.ts` and the entity-level twin — O-4
- [ ] Entity-level `layout.server.test.ts`
- [ ] Matcher tests under `apps/frontend/src/params/`
- [ ] The tests-side entity URL helper and the param-aware, throwing `buildRoute`
- [ ] `grantEntity` on the E2E admin client
- [ ] The dedicated setup and teardown, the two stored-session paths in `testCredentials.ts`
- [ ] The selection-and-switch spec
- [ ] The frontend integration test of O-Q3, if the operator wants it

## Security Domain

`security_enforcement` is not set to `false` in the configuration, so this section applies.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no (unchanged) | Supabase Auth; the entry gate is an app gate, not authentication |
| V3 Session Management | yes | no session object in any load's return (`assert:no-session-in-loads`); `signOut({ scope: 'local' })` through the existing `handleError` shape |
| V4 Access Control | **yes — the centre of the phase** | RLS over `user_can` decides every read and write; the route's entity id is never trusted: the list (table) and the one-entity read (table ∩ RLS) decide; one indistinguishable redirect for every refusal |
| V5 Input Validation | yes | param matchers for the two route params and the resolver's rest; zod for the list function's `jsonb`; `safeRedirectTarget` for `redirectTo` |
| V6 Cryptography | no | — |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Insecure direct object reference through `[entityId]` | Elevation of privilege | The entity-level load refuses anything not in the caller's list; the read function returns no row; RLS refuses the write regardless of the UI |
| Existence oracle on entity ids | Information disclosure | Not in list, no row, unserved type and type/id mismatch all give the same 307 to the root; the read function never raises |
| Cross-entity write through a shared draft | Tampering | The draft handle is keyed by `<type>-<id>` and swapped on `init`; `save()` takes its target from the loaded entity, not from the URL |
| Open redirect through the resolver or `redirectTo` | Spoofing | The resolver's target is built from a matcher-validated sub-path and an entity from the caller's own list; `redirectTo` passes `safeRedirectTarget` |
| A revoked editor acting on a stale token | Elevation of privilege | Residual, pre-existing and out of scope: RLS reads the claim for up to `jwt_expiry` (R-1.2 row 9). The list and the read stop serving the entity at once, so the app stops offering it |
| The entry gate widened to organization editors | Elevation of privilege | It is an app-entry gate; the database policies are authoritative, and an organization editor's rights are already in the matrix |
| A gate bypassed by splitting the load | Elevation of privilege | Every child load awaits the parent and returns early while a gate is pending (P-9), with a unit test |
| `anon` calling the new functions | Information disclosure | `REVOKE … FROM PUBLIC, anon`; measured refusal (R-1.2 row 10) |

## Sources

### Primary (HIGH confidence)
- The working tree at `b88b7f4c9` (and `a4b408eb7` for Phase 171's accessor module) — every file named in the body, read this session.
- `node_modules/@sveltejs/kit` 2.70.3 — `src/utils/routing.js` (`resolve_route`, `parse_route_id`, `exec`), `src/runtime/server/page/load_data.js` (server-load tracking, `untrack`), `src/runtime/client/client.js` (`has_changed`, the invalid-server-node selection).
- A private PostgreSQL 17.6 holding the repository's migration — the two functions and the eleven measured cases of R-1.2, and the O-1 demonstration of R-1.3.
- The name gate's own expressions, run in `node -e` over nine sample strings (R-2.9).

### Secondary (MEDIUM confidence)
- `.planning/phases/171-*/171-0{1..4}-PLAN.md`, `171-NAME-MAP.md`, `171-CONTEXT.md`; `.planning/phases/172-*/172-0{1..9}-PLAN.md` — what those phases will leave.
- `.planning/phases/170-*/170-04-SUMMARY.md` — what Phase 170 renamed and left.

### Tertiary (LOW confidence)
- A7 to A13 in the *Assumptions Log*.

No web search or external documentation lookup was needed: every external behaviour this phase depends on is SvelteKit's or PostgreSQL's, and both were read or run at the installed versions. The knowledge graph is disabled for this project (`gsd-tools graphify status`), so no graph context was used.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new dependency; versions read from the installed packages.
- Schema and RPCs: HIGH — run against the repository's schema; the only open item is the column Phase 172 removes first.
- Route architecture: HIGH for the mechanics (read from the installed framework and the tree); MEDIUM for the starting shape of the load, which Phase 172 rewrites before this phase.
- Pitfalls: HIGH — P-1, P-2, P-5, P-8, P-12 and P-14 are each a measured property of the tree, not a prediction.
- Tests: MEDIUM — the fixture plan depends on what 172's helper looks like and on O-Q1.

**Research date:** 2026-10-06
**Valid until:** the close of Phase 172. This file describes a tree two phases will change; its `[VERIFIED: tree]` facts about `503-entity-rpcs.sql`, the protected load and layout, the writer, the user-data store, `auth.setup.ts`, the a11y spec and the two dev-seed settings objects must be re-read once 171 and 172 have executed.
