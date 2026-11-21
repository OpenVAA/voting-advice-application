# Phase 175: Organization Editing — Profile, Questions & Preview - Context

**Gathered:** 2026-10-07
**Status:** Ready for planning. **The ten judgement calls (J1–J10) were ruled by the operator on
2026-10-08 and none is open**; every one took the reading this file had given, and the decisions
they touch are rewritten in place. Two things come before planning: the investigation of four Svelte
warnings on the profile page (OD08-G7 (a); see RQ-7), and three quick tasks the orchestrator runs
(OD08-G2, G4, G6 — none is this phase's work). Phase 174 is complete; Phase 174.1 is executed and
verified and closes after one browser check (OD08-A2 (b)) — see `<expected_tree>`. The planner
re-reads the tree before fixing any anchor. Code facts in this file were read at HEAD `ba8f0a948`;
which ones were verified in the tree and which are taken from planning documents is stated per fact
under `<factual_baseline>`.

**Source of decisions, in order of authority**

0. `.planning/v2.16-OPERATOR-DECISIONS-2026-10-08.md` (committed as `3409f3e3d`; applied to this file
   on 2026-10-08). Its sections B, C and F rule on this phase. The operator ticked no box and wrote
   no note in any of them, so every ★ stands: **B1 (a), B2 (a), B3 (a), B4 (a), C1 (a) … C8 (a),
   F1 (a), F2 (a)**, and **G7 (a)** from section G. Cited below as **OD08-B1**, **OD08-C3** and so on
   — the prefix keeps them apart from the 2026-10-07 decisions, whose section B uses the same ids.
1. `.planning/v2.16-OPERATOR-DECISIONS-2026-10-07.md` § B (committed as `c226f4196`). The operator
   returned it with **no box ticked and no note**, so every ★ stands: **B1 (a), B2 (a), B3 (a)**. They
   settle what the discussion document left open at 175-B2, 175-B3 and 175-B4 and **supersede any ★
   there that says otherwise**. Cited below as **OD-B1, OD-B2, OD-B3**.
2. `.planning/v2.16-DISCUSSION-POINTS.md` § *Phase 175 — Organization Editing: Profile, Questions &
   Preview* (plus § *Cross-phase picture*, X1–X3, § *Additional notes*, and the cross-phase notes of
   173, 174, 176, 177 and 179) — the shared checkbox document for Phases 170–179. Its rule: an unticked
   decision accepts the `★ RECOMMENDED` option; a ticked box overrules the ★; `**EDIT:**`/`**NOTE:**`
   free text beats every box.

In Phase 175's own 20 decisions the operator **ticked two boxes and wrote four NOTEs**:

1. **175-B1 → (b), ticked, overruling the ★**, plus `NOTE: When reading the colors in, we'll call use
   the ensure contrast util to fix them.` The organization profile has a colour field (D-04, J8).
2. **175-B2 → no box, NOTE:** *"Let's discuss this when reaching the phase. We'll prob want orgs
   unconfirmed if created via identity provider (or later open reg) - and only show confirmed ones for
   parent nomination selection for candidates. Behaviour to support: identity provider -> cand
   confirmed; org not confirmed because name is user-defined · code or email -> cand confirmed; org
   confirmed; · gate changing the name (incl. first, last, short) on !entity.confirmed for all types ·
   lock_nominations will only affect nominations"*. **Settled 2026-10-07 by OD-B1 (a):** that direction
   is the final rule (D-05).
3. **175-B3 → no box, `NOTE: See above.`** — the same rule covers candidates (D-07, J2).
4. **175-B5 → (b), ticked, overruling the ★**, plus `NOTE: Let's move it to app_settings away from
   project and promote to full column if needed for rpcs or indices.` The nominations lock becomes the
   app setting `access.nominationsLocked` (D-10, J4, J5).

Choices and outcomes **outside** this section that change what this phase builds:

5. **OD-B2 (a), reworded by OD08-F1 (a)** — an organization seeded as confirmed has `name` and
   `short_name` locked for its user from the first sign-in; only an admin changes them. Intended
   (D-06). Seeding as confirmed is what `create_invitations` does today for a named target, and what
   the seed writer and the docs go on doing once Phase 177.1 makes it the caller's statement per call.
6. **OD-B3 (a)** — `short_name` freezes on confirmation together with `name`, enforced in the database
   trigger; `entity.edit_immutable` still lets an admin correct either (D-08, J3).
7. **177-B5 → (b), ticked** — "a new app setting `access.nominationsLocked`"; read together with the
   175-B5 NOTE it is one lock in one place, not two sources (D-10).
8. **Phase 173's outcome (executed, verified with one human item that is this phase's scope)** — the
   writer, the store, the layouts, the preview page and the home greeting already serve an
   organization; the selected entity is a route parameter; `updateEntityProperties` is the method for
   the name columns. It changes this section's baseline facts 1, 2, 9, 10, 11, 13, 16 and 18.
9. **Phase 174's INV-05 (executed in plan 174-02, SUMMARY present)** — `create_invitations` confirms a
   named target of any of the four entity types in the same transaction. It agrees with OD-B2. Phase
   177.1, which stays after 177 (OD08-F2 (a)), replaces that with a required `p_confirm_entity`.
10. **179-C1 ★ (planned, Phase 179 not started)** — a self-registered organization is created
    unconfirmed with an empty name. It is the organization whose user edits `name` and `short_name`.
11. **X1 → ★ (a), X3 → ★ (a), untouched** — the E2E base dataset serves both entity types since Phase
    173; `REQUIREMENTS.md` and `ROADMAP.md` carry the amended wording, and GEN-03, REG-07 and Phase 175
    criterion 4 were **amended again on 2026-10-07** to OD-B1..B3 (commit `ba8f0a948`). This file cites
    the amended text and treats the rule as settled.
12. **Operator decisions D1 (a) and D2 (a)** — a small phase, **174.1** (the terms-of-use screen: the
    phone-width overflow and the focus-after-accept defect, plus one phone-width E2E check of the gate),
    is inserted between 174 and 175. **This phase adds screens behind that gate.**

Every other decision takes its ★ option as written, except where the ★ assumed something a later
ruling or an executed phase has changed. Those places are rewritten **and flagged inline as
"reconciled with <id / phase>"**. The full list is under *Reconciliations* at the end of
`<decisions>`.

<domain>
## Phase Boundary

An organization user can do in the Contestant app what a candidate can: edit the organization's
profile, answer its questions and preview how it appears to voters. Requirements **GEN-01** and
**GEN-03**, plus **E2E-03** as closing criterion. Depends on Phase 171 (the project declares which
entity types the app serves) and Phase 173 (the app loads and saves a selected entity of any served
type). **The roadmap gives this phase a UI hint** — it adds and reshapes screens.

It delivers:

- **the organization's profile** on the existing profile route: name and short name as multilingual
  fields, a logo image, a colour, and the info questions that apply to organizations;
- **the name rule, for every entity type** — a name field is editable only while the entity is
  unconfirmed (and, in the page, while answers are not locked) — in the page and in the database,
  where `short_name` joins the protected name columns on all four entity tables;
- **the questions pages for an organization**: the context's question scope follows the selected
  entity's type, and an entity with no opinion questions meets a neutral page, not an error;
- **the preview for an organization**: its own info and opinions, without the `children` tab;
- **the nominations lock moved** out of `projects.lock_nominations` into the app setting
  `access.nominationsLocked`, enforced in the database from there, with a `nominationsLocked` accessor
  on the contestant context that Phases 176 and 177 read;
- **`entity_type` carried through `bulk_import`** on the two question tables, so a seed can address a
  question to one entity type;
- **entity-type-specific copy** in seven locales, one message key per type where a sentence differs;
- **the E2E coverage**: an organization-editing spec on its own dataset (two organizations, one
  confirmed and one not), and axe scans of the
  organization surfaces — which discharges Phase 173's one open human-verification item.

**Not in this phase:** the home screen's task list, the task state and the nominations view J (Phase
176 — the profile page's nominations block stays where it is here); the nomination editor K (Phase
177); registration of an organization and the CI1 name form (Phase 179, which reuses this phase's
writer columns and multilingual name inputs); any Admin-app screen, including one for confirming an
entity or correcting a confirmed name; faction and alliance users; the terms-of-use gate's phone-width
defects (Phase 174.1).

### Roadmap success criteria (ROADMAP.md § Phase 175, criterion 4 as amended 2026-10-07 and 2026-10-08)

1. An organization user signs in, lands on the organization's pages, and edits and saves its profile;
   the saved values are what a reload shows and what the voter app displays (GEN-01).
2. The organization user answers the questions addressed to organizations, with the same editing,
   saving and progress behaviour a candidate has (GEN-01).
3. The preview shows the organization as voters will see it — its own details and answers, presented
   as an organization rather than as a candidate (GEN-01).
4. The organization's profile shows its name and its abbreviation (short name) as multilingual fields,
   one value per supported locale; they are editable while the organization is unconfirmed and answers
   are not locked (`access.answersLocked`), and read-only once it is confirmed, whatever the
   nominations lock says (GEN-03). The same rule holds for every entity type and every name field —
   first name, last name, name, short name — and the app applies it to a candidate's first and last
   name as it does to the organization's fields. An organization created through the identity provider
   is unconfirmed; an organization seeded as confirmed — which is what the seed writer and the docs do
   for a named entity invited by a code or an email, and from Phase 177.1 what the caller states on
   each call — has both fields locked for its user from the first sign-in, and only an admin changes
   them. The database freezes `short_name` on confirmation together with `name`, on all four entity
   tables, and `entity.edit_immutable` lets an admin correct either.
5. The candidate journey is unchanged, and the full E2E suite, with organization-editing coverage
   added, is green at close (E2E-03).

**"Nominations locked"** (`REQUIREMENTS.md`, definition above NOM-01, amended 2026-10-05 and
2026-10-07) means the app setting `access.nominationsLocked`. It is cited by NOM-02, NOM-06 and the
phase criteria of 176 and 177 — **no longer by GEN-03**.

### Standing rules (ROADMAP.md § v2.16, inherited by every phase)

- **Cardinal rule:** no failing E2E test, no exemptions, no "known flaky"; a "did not run" counts as a
  failure. E2E-03 is a closing criterion of this phase.
- **Localisation:** every user-facing string ships in all seven locales (`da, en, et, fi, fr, lb, sv`).
- **Accessibility:** every new or changed screen meets WCAG 2.1 AA and is reached by the axe scan, in
  the light and the dark theme (D-20).
- **Both entity types:** a criterion that says "user" or "entity" holds for candidates and for
  organizations unless it names one.
- **Nothing is deployed:** the schema, the settings shape, the routes and the symbols change in place;
  no compatibility shim, no migration of stored data.
- **Schema edits are serial.** This phase edits `schema/*.sql` (D-08, D-10, D-18) and regenerates the
  single migration file **after Phase 174**, which is executing now.
- **Comment hygiene** (`CLAUDE.md`): no historical narrative, no planning references, in any comment
  under `apps/`, `packages/` or `tests/`.
- **Context reactivity** (`CLAUDE.md` § *Context Destructuring Rule*): `appSettings`, `dataRoot`,
  `locale`, `selectedEntity`, `answersLocked`, `opinionQuestions`, `profileComplete` and the new
  `nominationsLocked` are reactive accessors — read `ctx.X`, never destructure; never bind `dataRoot`
  to a read alias.

</domain>

<decisions>
## Implementation Decisions

Decision ids map onto the discussion document's Phase 175 ids and the operator-decision ids, given in
parentheses. 20 discussion decisions and 3 operator decisions → **D-01..D-22**. Where a decision is
security-relevant, **If wrong** states what a defect or an attacker could do if it were implemented
otherwise; the planner carries every such line into the plan's threat model.

Names are those on the tree after Phases 170–173. Frontend paths are relative to `apps/frontend/src/`
unless they start with `apps/`; `schema/` and `tests/database/` are relative to
`apps/supabase/supabase/`. `ENTITY/` abbreviates
`routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/`.

### 0 — Factual baseline

- **D-01 (175-0.1):** Accept all 19 facts of 175-0 as the baseline; restated under
  `<factual_baseline>` **with the corrections Phases 170, 172 and 173 made to facts 1, 2, 9, 10, 11,
  13, 16, 17 and 18, and the re-reading OD-B1..B3 give facts 4 and 5**. The facts are a 2026-10-04
  snapshot at `df0cec944`; the planner re-reads the tree.

### A — Structure and scope

- **D-02 (175-A1) ⚠:** **One route tree and one page component per route. A small per-type descriptor
  module names what differs between the entity types, and each page reads it by the selected entity's
  type.** What the descriptor carries: the identity (name) fields and how each is edited, the image
  label, the copy keys that differ (D-17), and whether a colour field is offered (D-04). The
  differences are data, not layout; Phases 176 and 177 then build each new screen once, and a third
  served type would be one more descriptor. No `{#if type === 'organization'}` scattered over the
  pages, no component per type behind a route.
  *Reconciled with OD-B1:* the descriptor does **not** carry a per-type lock rule. The lock on a name
  field is one rule for every type — the entity's `confirmed` flag (D-05) — so it lives in one place
  outside the descriptor.
  *Reconciled with the Phase 173 outcome:* the profile page already leaves the person-name fields out
  for an organization through an inline `isOrganization` derived (`ENTITY/profile/+page.svelte`). That
  inline branch is what the descriptor replaces. **Keep 173's first-paint rule** when replacing it: the
  store holds nothing on the server and on first paint, so a part is left out for a *known*
  organization and never shown only for a *known* candidate — the candidate's name inputs must be in
  the server-rendered markup (173-03, commit `43385c089`; guarded by the `perm-answers-locked` spec).
- **D-03 (175-A2):** **`2026-03-28-generalize-candidate-app-to-party-app.md` is closed at this phase's
  close** — it is this phase's goal. **`2026-03-28-investigate-migrating-candidate-answer-store.md` is
  left untouched and out of scope**: an open-ended investigation with no acceptance criterion, citing
  two files that no longer exist.

### B — The organization profile

- **D-04 (175-B1 → (b) + NOTE, overruling the ★; shape ruled by OD08-C6 (a)) ⚠.** **The organization
  profile has: name, short name, a logo image, a colour field, and the info questions that apply to
  organizations.** **The colour field is for organizations only. The user picks one colour, stored as
  `normal`; the dark-theme colour is derived on read. The field does not lock on confirmation; it
  locks with answers, like the logo. The preview shows the adjusted colour.** `info` and `subtype`
  stay admin-set. The colour a party chooses is not policed per value by the WCAG
  gate: **when a colour is read in, it is passed through the ensure-contrast util.**
  *Reconciled with the tree:* that util exists — `ensureColors` in `lib/utils/color/ensureColors.ts`
  (over `adjustContrast`), which fits a `{ normal, dark }` pair to the light and dark `base-300`
  backgrounds and derives `dark` from `normal` when absent. It is already applied to every entity,
  nomination and question-category object by `UniversalDataProvider.ensureColors`
  (`lib/api/base/universalDataProvider.ts`), so **the voter app already reads a stored colour through
  it**. The path it does not cover is the Contestant app's own read: the preview provides the writer's
  row to the data root directly (`ENTITY/preview/+page.svelte` `loadEntity`). The planner routes that
  read through the same util.
  **Planner constraints:**
  - The stored value is what the user chose; the adjustment happens on read, never on write.
  - `Input` has no colour type today (`lib/components/input/Input.type.ts`); the field is a new input
    or a new `Input` type, with a label, a text alternative and keyboard operation (WCAG 2.1 AA), and
    is scanned by axe (D-20).
  - `organizations.color` is inside the editor's column grant already (`schema/303-column-grants.sql`).
  - The image is a **logo**: the label is a per-type key (D-17), not `common.candidatePortrait`. The
    upload path is already built from the entity's table (`#uploadEntityFile` in
    `supabaseDataWriter.ts`).
- **D-05 (175-B2 NOTE, settled by OD-B1 (a)) ⚠ — rewritten; the ★ is superseded.** **A name field —
  first name, last name, name, short name — is editable only while the entity is unconfirmed, for
  every entity type. The nominations lock affects nominations only. How an entity comes to be
  confirmed: identity provider → a candidate is confirmed, an organization is not; a named entity
  seeded with a code or an email → confirmed, as the normal case.** In the page a name field is also
  read-only while `access.answersLocked` is on (D-09).
  *Reconciled with OD08-F1 (a):* "code or email → both are confirmed" is not a property of the mode.
  Today `create_invitations` confirms a named target itself; from Phase 177.1 the admin states it on
  each call (`p_confirm_entity`), and the seed writer and the docs pass "confirmed" for a named entity
  unless told otherwise. This phase's rule reads the entity's `confirmed` flag and nothing about how
  it was set, so nothing built here changes when 177.1 lands.
  *Reconciled with OD-B1:* the ★ (175-B2 (a)) had the trigger freeze an organization's names when the
  project's nominations are locked "and no longer when the row is confirmed". **That is not built.**
  The existing rule of `public.enforce_entity_immutability` — rule 2, "the conditional freeze, guarded
  on the OLD row's flag" — **stays exactly as it is**; this phase only widens the columns it protects
  (D-08). No nominations-lock condition enters the trigger.
  **What this phase builds for it:**
  - **In the page:** the organization's `name` and `short_name` are multilingual inputs, rendered
    `locked` when the entity is confirmed and editable when it is not. A locked field shows its value,
    with a sentence saying the name is set and whom to ask for a correction (copy, D-17).
  - **In the database:** nothing new for `name`; `short_name` per D-08.
  - **Where the page reads `confirmed`:** from `ctx.selectedEntity.confirmed`, the entity list of the
    user-level load; **no schema change** (OD08-C7 (a)). `get_entity_user_data` does not return the
    flag and is not widened. The list is read when the user-level load runs, so an admin's
    confirmation during a session is seen only when that load next runs; until then the fields look
    editable, and the constraint below is what covers the gap.
  **Planner constraints:**
  - **The page's lock is presentation; the trigger is the control.** A client that believes the entity
    is unconfirmed after an admin has confirmed it sends the save and is refused with
    `Entity name is immutable once confirmed: …`. The page shows that as a specific, translated message
    and reloads the entity, not as the generic `contestantApp.error.saveFailed`.
  - **A save sends only the properties the user changed.** The property update is one `UPDATE`
    statement; a statement that carries an unchanged-but-present name is compared by the trigger with
    `IS DISTINCT FROM` and passes, but a statement that carries a *changed* name for a confirmed row
    fails whole — image and colour with it. Staging (D-12) therefore never stages a name the user did
    not edit.
  - The trigger binds the `authenticated` role only; a service-role write (seeding, bulk import, the
    Edge Functions) is not bound by it. That is existing behaviour and is not changed here.
  **If wrong** (the ★: the lock, not confirmation, freezes the name): an organization an admin vouched
  for by seeding it with a code or an email could rename itself after it was confirmed and published.
  (Client-side only): the rule is skipped with one PostgREST call.
- **D-06 (OD-B2 (a), reworded by OD08-F1 (a)):** **An organization seeded as confirmed has `name` and
  `short_name` as locked fields for its user from the first sign-in. Only an admin changes them.
  Intended** — the admin who seeds the organization sets its name, which is how candidate names
  already work.
  *Reconciled with OD08-F1 (a):* the sentence used to read "an organization seeded by code or email is
  confirmed from seeding". Whether an invited entity is confirmed becomes the admin's choice on each
  call in Phase 177.1 (a required `p_confirm_entity`); the seed writer and the docs pass "confirmed"
  for a named entity unless told otherwise, so the locked state stays the normal case this phase
  designs for. An invited organization an admin chose to leave unconfirmed is simply an unconfirmed
  organization: its name fields are editable, by the one rule of D-05.
  *Agrees with Phase 174 as executed:* `create_invitations` (`schema/506-invitation-rpcs.sql`) sets
  `confirmed = true` on a named target in the same transaction, for all four entity types (174-02
  SUMMARY). This phase changes nothing in it; Phase 177.1 does, after Phase 177 (OD08-F2 (a)).
  **Consequence the planner designs for:** for most organization users in a project that seeds its
  parties, the two name fields are **read-only from the start**. The page must make sense in that
  state — it is the common case, not an edge case — and the editable state is reached by a
  self-registered organization (Phase 179) or by an organization granted without an invitation.
- **D-07 (175-B3 NOTE "See above", settled by OD-B1 (a); its reach in the app ruled by OD08-C2 (a)) —
  rewritten; the ★ is superseded.** **A candidate's `first_name` and `last_name` follow the same rule,
  in the app as in the database: the two inputs are shown locked when the candidate is confirmed and
  are editable when it is not.**
  *Reconciled with OD-B1:* the ★ (175-B3 (a)) kept candidate names "always shown locked in the app".
  The rule is now one rule for every type. The database already implements it for candidates: the
  trigger is registered on `public.candidates` with `('first_name', 'last_name')`, both columns are in
  the candidate's UPDATE grant, and its own comment says "on an unconfirmed row the entity user may
  still set their own name, which the sign-up flow needs".
  **What is built for it (OD08-C2 (a)):** the profile page's two person-name inputs, which are `locked`
  unconditionally today, take their lock from `confirmed` like the organization's; the writer's
  editable properties gain `firstName` and `lastName` for a candidate (D-12). Every candidate the
  product creates today is confirmed (identity provider, or a named invitation), so **no existing
  candidate sees a change** and criterion 5 holds; the editable state is reached by a candidate
  granted without an invitation — and, once Phase 177.1 lands, by one an admin invites unconfirmed.
- **D-08 (OD-B3 (a); its reach ruled by OD08-C3 (a)).** **`short_name` freezes on confirmation
  together with the name columns, enforced in the trigger, on all four entity tables —
  `organizations`, `candidates`, `factions` and `alliances`; `entity.edit_immutable` still lets an
  admin correct either.**
  *From the tree:* the trigger function names no column — the protected columns arrive per
  registration in `TG_ARGV`. The organizations registration in `schema/102-entities.sql` is
  `BEFORE UPDATE OF name, confirmed ON public.organizations … EXECUTE FUNCTION
  public.enforce_entity_immutability ('name')`. The change is in the **registrations, all four of
  them** (`schema/102-entities.sql`): in each, `short_name` joins **both** the `UPDATE OF` list and
  the argument list. The function body does not change.
  **Planner constraints:**
  - **Both lists.** `tests/database/19-entity-immutability.test.sql` opens by naming the silent
    failure: a trigger "carrying an `UPDATE OF` list that omits the col…" simply does not fire. An
    argument without its `UPDATE OF` entry protects nothing.
  - `19-entity-immutability.test.sql` asserts three cells per protected column per table (entity user
    on a confirmed row → refused; the same user on an unconfirmed row → allowed; a holder of
    `entity.edit_immutable` on a confirmed row → allowed and read back). `short_name` gets the same
    three cells on each of the four tables.
  - Existing assertions that an entity user may update `short_name` must be re-read against the
    fixture's `confirmed` state — at least `tests/database/05-organization-admin.test.sql`
    ("organization_admin can UPDATE short_name on own organization"). Whether its fixture row is
    confirmed was **not checked here**.
  - The comment blocks in `schema/303-column-grants.sql` ("`confirmed` and `name` are allowed and
    guarded by `enforce_entity_immutability()`") and in `schema/011-validation-functions.sql` are
    brought in line; `.claude/skills/database/*` likewise.
  **If wrong** (today's behaviour): a confirmed party changes the abbreviation voters see without an
  admin knowing. (Organizations only): a confirmed candidate, faction or alliance has its short name
  changed by its editor through a direct API call, with no admin knowing.
- **D-09 (175-B4) — the ★ is superseded; what is left of it is ruled by OD08-C1 (a).** **A name field
  is editable when the entity is unconfirmed and `access.answersLocked` is off. The page has one Save
  button and one rule for "can I edit here".**
  *Reconciled with OD-B1 and the 2026-10-07 amendment of GEN-03 ("…which … supersede 175-B4 ★"):* the
  ★ made the name fields "read-only when either lock is on", the two locks being `answersLocked` and
  the nominations lock. **The nominations lock no longer plays any part.**
  **What that means on the page (OD08-C1 (a)):** with `answersLocked` on, the profile page renders no Save and the store discards
  unsaved edits (today's behaviour), so the name fields are read-only in that state too. The name fields get no save
  button and no unsaved-changes guard of their own. `answersLocked`
  is client-side only (no SQL reads it), so the database goes on allowing an unconfirmed entity's name
  write while it is on — as it allows every answer write.
- **D-10 (175-B5 → (b) + NOTE; 177-B5 → (b); confirmed by OD08-B1 (a), B2 (a), B3 (a), B4 (a)) ⚠.**
  **The nominations lock
  moves out of `projects.lock_nominations` into the app settings as `access.nominationsLocked`, beside
  `access.answersLocked`. It is promoted to a full column only if RPCs or indices need it. The database
  goes on enforcing it, reading it from there. The contestant context exposes it as a
  `nominationsLocked` accessor beside `answersLocked`; Phases 176 (the "not editable" note on J) and
  177 (NOM-06, K) read that one accessor.**
  *Reconciled with OD-B1:* the ★ and the option the operator ticked were both written when this
  phase's own name fields were the accessor's first reader. **They no longer read it** (D-05). The
  move and the accessor stay in this phase: **OD08-B1 (a)** rules it, as the roadmap's hand-over says
  ("175 introduces it and its frontend accessor; 176 and 177 reuse it"). This phase builds and proves
  something none of its own screens uses — by pgTAP and a context unit test.
  *Reconciled with 177-B5 (b)'s own text* ("Two sources then have to agree, and the database lock
  stays authoritative, so the setting can lie"): there is **one** source, ruled by **OD08-B4 (a)**.
  The column goes; nothing is kept in step.
  **Who may set it (OD08-B2 (a)):** `app_settings` is written under `project.edit_app_settings`, which
  project editors hold as well as admins, so **a project editor may lock and unlock nominations**. No
  full column on `app_settings` and no guarding trigger is built. The schema's comment above
  `admin_update_app_settings` ("Settings permissions split along whether a policy reads the value")
  stops being true of this one key and is corrected with the move.
  **What moves, from the tree:**
  - `schema/100-tenancy.sql` — the column `lock_nominations boolean NOT NULL DEFAULT false` and its
    comment are removed.
  - `schema/301-auth-functions.sql` — `private.project_nominations_locked(p_project_id)` is the one
    hop the policies call (`SECURITY DEFINER`, `search_path = ''`, "returns true (locked) when the
    project row is not found, so a missing project never unlocks anything"). **Its body is what
    changes**: it reads `app_settings.settings #> '{access,nominationsLocked}'` for the project. Its
    four callers in `schema/302-rls.sql` — `entity_insert_nominations`,
    `entity_insert_parent_nominations` and the `USING` and `WITH CHECK` of `entity_update_nominations`
    — keep calling it and do not change. That is the reading of "promote to full column if needed for
    rpcs or indices" this file takes: a policy conjunct through a definer function needs neither.
  - `schema/303-column-grants.sql` — `lock_nominations` leaves the `projects` UPDATE grant and the
    comment above it.
  - `apps/supabase/supabase/seed.sql` and `tests/database/00-helpers.test.sql` — comments that say the
    column is deliberately absent.
  - pgTAP — `09-column-restrictions.test.sql`, `15-visibility-flags.test.sql` and
    `23-nominations-write.test.sql` set or assert the column; `07-rpc-security.test.sql` lists the
    function in its census (the name stays). `23` is the file that proves the lock binds the entity
    user and not the admin; it is re-pointed to the setting, with both directions kept.
  - `packages/dev-seed/src/template/permittedKeys.ts` lists `'lock_nominations'` among the `projects`
    keys.
  - `packages/app-shared` — `access` in `settings/dynamicSettings.type.ts` and
    `settings/dynamicSettings.ts` (default `false`), and the `access` object of
    `data/schemas/storedSettings.schema.ts`, which is strict and rejects an unknown key.
  - `packages/supabase-types` regenerated (`yarn db:types`); `CLAUDE.md`-adjacent docs and
    `.claude/skills/database/*` wherever they describe the column.
  **Planner constraints:**
  - **Fail closed on what cannot be read, default open on what is not set** (OD08-B3 (a)): a project that does
    not exist stays locked; a project with no `app_settings` row, or a row without the key, is
    **unlocked** — the shipped default, and what the column's `DEFAULT false` gave. Anything that is
    not the JSON boolean `true` is unlocked. pgTAP pins each case.
  - **A stored root replaces the shipped root whole.** A project that stores
    `access: { nominationsLocked: true }` alone drops every other `access` default
    (`mergeAppSettings`; todo `2026-10-02-app-settings-shallow-merge-and-no-admin-editor.md`). Every
    template and test that sets the lock restates the whole `access` root, as `e2e/base.ts` does for
    `contestantApp`.
  - The accessor is `$derived` from `appSettings` exactly as `#answersLocked` is in
    `lib/contexts/contestant/contestantContext.svelte.ts`, is added to the context's type, and is a
    reactive accessor under the destructuring rule.
  - The anonymous reader of a closed project sees three stored values only
    (`contestant_app_public_config`); no anonymous screen needs this one, so that function does not
    grow here.
  **If wrong** (the lock read in the frontend only): a locked project's nominations are written with
  one PostgREST call. (The setting kept beside the column): the two disagree and the screen says
  "locked" while the database accepts the write, or the reverse.
- **D-11 (175-B6):** **The name is required in the project's default locale; other locales are
  optional. The short name is optional in every locale.** The default-locale entry is the one the
  display fallback always reaches, so no voter sees an empty name; a missing short name falls back to
  the name in the data model.
  *From the tree:* `Input` has no per-locale required rule — `showRequired` is
  `!!required && isEmptyValue(value)`, a badge when the whole value is empty. The default-locale rule
  is new validation. Phase 179's CI1 form applies the same rule to the same two fields (179-C2), so it
  is built once, where both phases can use it.
  *Reconciled with OD-B1 and OD08-C5 (a):* the rule binds only while the fields are editable. A
  confirmed organization whose name has no default-locale entry — an admin can seed one, since the
  database asks for a non-empty name in any locale — shows no "required" badge and is not told its
  profile is incomplete: its user cannot fix the name.
- **D-12 (175-B7):** **The store's staged properties are extended and saved by the same `save()` call
  and the same Save button as the image and the info answers** — one unsaved-changes guard
  (`PreventNavigation`) and one failure surface.
  *Reconciled with Phase 172 and Phase 173:* the terms-of-use property left the entity in 172, and 173
  left the store staging **`image` alone** (`setImage` / `resetImage` in
  `contestantUserDataState.svelte.ts`; `EditableEntityProps = { image?: ImageWithFile }` in
  `lib/api/base/dataWriter.type.ts`). **`updateEntityProperties` is the method** (173-03 SUMMARY § *For
  Phase 175*): it already takes the table from the target's type and runs one scoped update, but can
  write nothing except the image. This phase widens `EditableEntityProps`, the `updateFields` it
  builds, the read-back column list (`'image'` today) and the declared return type
  (`LocalizedCandidateData`, wrong for both arms, as the adapter's own `// reason:` comment says).
  *Reconciled with D-04 and D-07:* the staged list is **`image`, `name`, `shortName`, `color`** for an
  organization (the discussion's list plus the colour of 175-B1 (b)), and **`image`, `firstName`,
  `lastName`** for a candidate (D-07).
  **Planner constraints:**
  - **Which property may be written for which type is a closed map in the writer**, beside
    `ENTITY_TABLES`; a property that does not belong to the target's type throws by name and is never
    sent. The column grant is the database's side of the same list.
  - 173 did not measure whether row-level security and the column guard let an organization editor
    update `name` and `short_name` (its SUMMARY says so). The schema says they do
    (`entity_update_own_organizations`; the organizations column grant). The integration test
    `supabaseDataWriter.integration.test.ts` gains the cases: an unconfirmed organization's names are
    saved; a confirmed organization's are refused by the trigger's message.
  - The store's `$effect` that discards unsaved edits when `answersLocked` turns on resets the new
    staged properties with the image.
  - The TSDoc on the store's image members still says "the `Candidate`'s image"
    (`contestantUserDataState.type.ts`; 173-04 SUMMARY) and is corrected with the widening.
  **If wrong** (a writer that sends whatever the page hands it): the page becomes the only thing
  between a user and `subtype`, `info` or `custom_data`, which are inside the column grant and which
  D-04 leaves admin-set.

### C — Questions and completeness

- **D-13 (175-C1):** **An entity with no opinion questions is not offered the questions task: the home
  button and the navigation item are not shown for it, and a deep link shows a neutral "there are no
  questions for you to answer" page.** A project may address every opinion question to candidates;
  that is a valid configuration, not a failure. Phase 176 turns this into "the task is omitted".
  *From the tree:* `ENTITY/questions/+layout.svelte` renders its `{:else}` branch — title
  `error.noQuestions`, the error hero emoji — when `ctx.opinionQuestions.length` is zero; the nav item
  is `contestant-nav-questions` in `lib/dynamic-components/navigation/contestant/ContestantNav.svelte`.
  **Planner constraints:** the same `{:else}` branch is also what renders for an instant before the
  layout's redirect to the profile when required info is missing (Phase 176 removes that redirect —
  the questions no longer wait for basic info, operator decision D2 EDIT of 2026-10-08); the neutral
  page is for the zero-questions case only. And "zero questions" must be a fact about a **loaded** entity: before the
  entity and its question data are in the store the list is empty, and neither the neutral page nor a
  missing nav item may flash for an entity that does have questions.
- **D-14 (175-C2; the name clause ruled by OD08-C5 (a)).** **One formula for both types — no
  unanswered required info question and no unanswered opinion question — plus, for an organization
  whose name is still editable, a name in the project's default locale.** The name clause is left out
  when the name is not editable, so the user is never given a task they cannot do. "Complete"
  otherwise keeps meaning "nothing is left that would hide or impair the public profile".
  *From the tree:* `#profileComplete` in the contestant context is the two-term conjunction and names
  no type; the name clause is this phase's addition.
- **D-15 (175-C3):** **`entities.hideIfMissingAnswers` gains an `organization` key, default `false`,
  in the setting type, the stored-settings schema and the defaults; the five UI reads take the key of
  the selected entity's type.**
  *From the tree:* the schema is `z.strictObject({ candidate: … })`
  (`packages/app-shared/src/data/schemas/storedSettings.schema.ts`); the five reads of `.candidate`
  are in `lib/contestant/components/logoutButton/LogoutButton.svelte`, `ENTITY/+page.svelte`,
  `ENTITY/profile/+page.svelte` and `ENTITY/questions/+page.svelte` (two). The voter context applies
  whatever keys the object holds (`lib/contexts/voter/nominationAndQuestionState.svelte.ts`), so the
  warning and the behaviour stay in step for both types. Templates that set the object
  (`e2e/base.ts`, `e2e/perm/shared.ts`, `default.ts`, `perm-hide-if-missing-answers.ts`) are re-read
  against the widened schema.

### D — Preview

- **D-16 (175-D1):** **The preview shows the organization's own info and opinions tabs; the `children`
  tab is left out in the Contestant app.** Criterion 3 asks for "its own details and answers", and it
  needs only the organization's own row. The preview tip already says the published version may differ.
  *Reconciled with the Phase 173 outcome:* the three candidate-only calls the discussion counted are
  already gone — `ENTITY/preview/+page.svelte` uses `translateLocalizedEntity`,
  `dataRoot.getEntity(result.type, result.id)` and `AnyEntityVariant`. What is left for this phase:
  the `children` tab (`EntityDetails.svelte` gives an organization
  `['info', 'opinions', 'children']` by default and fills `children` from `voterContext?.matches`,
  which does not exist in this app), the colour read (D-04), and the component's own doc line ("the
  candidate's own profile").
  **Planner constraints:** the tab is left out by what the Contestant app passes or provides, not by
  a change to what the voter app renders. The data root must not be handed the full nomination graph
  to make the tab work — the Contestant app deliberately does not load it. The preview page's visual
  baselines are a candidate's (173-13 SUMMARY); the opt-in `visual-regression` project is not widened
  here unless the UI spec asks.

### E — Copy

- **D-17 (175-E1) ⚠:** **Neutral strings stay single. A string that must differ gets one key per type
  (`….candidate` / `….organization`), picked by the selected entity's type through the descriptor of
  D-02.** Each locale writes each sentence whole, so Finnish and Estonian inflection is correct, and
  the `TranslationKey` type checks that both variants exist in all seven locales. No interpolated
  noun, no second namespace.
  *From the tree:* the pattern exists — `common.electionSymbol.candidate` / `.organization` in
  `apps/frontend/messages/en/common.json`. The strings that name a candidate or a person today
  (`apps/frontend/messages/en/`): `common.candidatePortrait` ("Portrait");
  `dynamic.contestantAppBasicInfo.immutableData.title` / `.ingress` / `.emptyPlaceholder` ("Personal
  Information", "…when the candidate lists are confirmed…", "Based on candidate list");
  `contestantApp.basicInfo.nominations.description`; `contestantApp.home.ingress.notDone` ("…about
  yourself…"); `contestantApp.help.title` ("Candidate Support"); `contestantApp.error.candidateNoNomination`
  and `.nominationNoElection`. The planner derives the full list at planning time from the catalogue,
  not from this sentence.
  *Reconciled with OD-B1 / D-05:* the "immutable data" copy now has to say the true thing for both
  types — names are set by the administrator or the identity provider and are locked **because the
  entity is confirmed**, not because of candidate lists. New strings: the locked-name explanation, the
  refused-save message, the neutral no-questions page (D-13), the field labels (name, short name,
  logo, colour) and the default-locale requirement (D-11).
  *Reconciled with Phase 170 and 171:* the namespaces are `contestantApp.*` and
  `dynamic.contestantAppBasicInfo.*`; `dynamic.*` strings are overridable per project, so a renamed
  `dynamic` key is a customization-key change (nothing is deployed). 171 left "texts that address the
  reader as a candidate" to this phase (171-D1 ★). The greeting on home already picks the name by type
  (`ENTITY/+page.svelte`: "A candidate is greeted by first name, an organization by its name").
  **Constructed non-English strings:** the six non-English locales will again be constructed from each
  catalogue's existing terms. A native-speaker review todo is filed, as Phases 171 and 173 did
  (operator decision C4 (a): the review does not hold the phase).

### F — Verification

- **D-18 (175-F1) ⚠:** **A new perm-style template with its own dataset — an organization with an
  editor, and questions scoped by entity type — and a new organization-editing spec over it.** Edits
  to an organization's name and answers then cannot disturb the voter specs that read `e2e/base`, and
  the template can hold the type-scoped questions criterion 2 needs. **It requires a schema change the
  roadmap now lists:** `bulk_import` stops skipping `entity_type` on `question_categories` and
  `questions`, and dev-seed stops denying it there.
  *From the tree:* `schema/501-bulk-operations.sql` skips `'entity_type'` for every table (its
  `skip_columns` array: `'id', 'created_at', 'updated_at', 'project_id', 'entity_type'`);
  `packages/dev-seed/src/template/permittedKeys.ts` `DENIED_BY_TABLE` denies it on `nominations`,
  `question_categories` and `questions`. **`nominations.entity_type` stays skipped and denied** — only
  the two question tables change. The column is "JSON array of the `entity_type` values … null or
  empty means all" (`schema/103-questions.sql`), and `Question.entityType` intersects the category's
  filter with its own (`packages/data/src/objects/questions/base/question.ts`).
  *Reconciled with X1 (a) and the Phase 173 outcome:* `e2e/base` now serves both entity types and one
  base organization has an editor — the multi-entity user of `data-setup-entity-selection`, whose
  session is **read-only for the run**. This phase does not edit through that user. **Perm setups
  serve candidates alone** (`e2e/perm/shared.ts`: `entityTypes: ['candidate']`), so the new template
  restates the whole `contestantApp` root with `organization` served.
  *Reconciled with OD-B1; ruled by OD08-C4 (a):* the dataset holds **two organizations** — one
  unconfirmed (its name fields editable) and one confirmed, with a confirmed nomination (its name
  fields locked, and public).
  *"Its own dataset" (OD08-C8 (a)):* the template is seeded into the suite's **one** project, with its
  own setup and teardown pair in the serial perm chain, as every existing perm setup is
  (`setupFromTemplate` writes through `resolveE2eProjectId()` — read in the tree for 176-CONTEXT). It
  is not a separate database project: the preflight allows no second project on one dev server.
  **Planner constraints:**
  - **If a spec of this phase invites an entity the dataset keeps hidden**, it is built on the 174-09
    wrapper `invitationFlow.whileHiddenFromVoters` and is re-pointed in Phase 177.1, which stays after
    Phase 177 (OD08-F2 (a)). As captured, this phase creates its organization users through the admin
    client and invites nobody.
  - The organization user is created with `forceRegisterUser(email, password, { entityGrants })` in
    `tests/tests/utils/supabaseAdminClient.ts`, which exists for "an identity whose first grant is an
    organization"; public sign-up is closed since 174-03, and this helper does not use it.
  - A value `bulk_import` now carries is a value it must not carry blindly: what validates the
    `entity_type` array on the two tables (a constraint, a trigger, or nothing today) is read before
    the skip is lifted, and an invalid member is refused by name, not stored.
  - The setup and teardown are their own Playwright project pair in the perm chain; a reader of the
    read-only multi-entity and no-entity sessions runs before the perm chain (173-13 SUMMARY).
  - The template's external ids keep clear of the generators' synthetic namespaces (todo
    `2026-08-24-external-id-namespace-collision-con-prefix.md`).
- **D-19 (175-F2; sequence ruled by OD08-C4 (a)).** **The spec, after saving, opens the voter app's
  detail of that organization and asserts what it saved — for every field, the two names included.** A database read proves the write, not that voters see it;
  the in-app preview reads the user's own row, visible to them whether or not the public can see it.
  *Reconciled with OD-B1:* the ★ asserted "the new name and one changed answer" on one organization.
  A name can be saved only while the organization is unconfirmed, and an unconfirmed organization is
  not public. **The assertion is therefore sequenced over the two organizations of D-18:**
  - **the confirmed organization:** the spec edits its image or colour, an info answer and an opinion
    answer, asserts its name fields are locked, and asserts the saved values on the voter app's detail
    page;
  - **the unconfirmed organization:** the spec edits its name and short name, saves, and asserts them
    after a reload and in the preview; the test then confirms the organization with the service role
    (standing in for the admin), and asserts the saved name on the voter app's detail page and that
    the fields are now locked.
- **D-20 (175-F3):** **Axe scans are added for the organization profile — once with the translations
  collapsed, once expanded — and for the organization preview, each in both themes**, with reach
  proven by an organization-only marker, as the spec does per entry. The remaining candidate surfaces
  are not rescanned as an organization: their markup is identical.
  *Reconciled with OD-B1, D-04 and D-13:* the profile has two more states that render differently and
  are scanned: **name fields locked (confirmed)** versus editable, and the **colour field**. The
  neutral no-questions page is a new surface and is scanned.
  *From the tree:* the spec is `tests/tests/specs/a11y/contestant-a11y.spec.ts`, with one table of
  entries per stored session; its own table of unscanned surfaces lists "an organization's pages, and
  the open menu over them". The toggle that expands the translations carries
  `data-testid="multilingual-toggle"` (`Input.svelte`). The phase verdict's
  `--except contestant-a11y-scan=<n>` holds the scan count (173-13 SUMMARY) and moves with the new
  entries.

### G — Plan shape and closing gate

- **D-21 (175-G1) ⚠:** **Five plans in three waves.** Wave 1: (1) schema; (2) context and state.
  Wave 2: (3) the profile page; (4) the questions empty state and the organization preview. Wave 3:
  (5) template, spec, axe entries and the closing gate. The schema and the context are independent of
  each other and both precede the pages; the E2E plan runs once against the finished surfaces.
  *Reconciled with OD-B1..B3 and D-10 — plan 1's content changes:* not "the lock rule of 175-B2" but
  **`short_name` in the trigger registrations (D-08), the nominations lock moved to the app setting
  (D-10), `entity_type` through `bulk_import` (D-18), pgTAP, the regenerated migration and types**.
  Plan 1 covers `short_name` on **all four** trigger registrations (D-08).
  Plan 2: the type-aware question scope, the widened staged properties and writer columns (D-12,
  the candidate's two name columns among them), the
  `nominationsLocked` accessor (D-10), the `organization` settings key (D-15), the name clause of
  `profileComplete` (D-14). Plan 3: the descriptor, the multilingual name fields with the `confirmed`
  lock, the colour field, the copy in seven locales.
  The planner may split a plan that grows past one verifiable unit — plan 1 now carries three
  independent schema changes — but keeps the wave order and one migration regeneration.
- **D-22 (175-G2):** **Closing gate: unit, type, lint and production build; pgTAP and
  `yarn db:lint:sql`; one full E2E run through `tests/scripts/e2e-run.sh`; and the new organization
  spec three times in isolation.** The full run is the cardinal rule; the three isolated runs are the
  project's determinism check for a new spec; exit statuses are read directly, never through a pipe.
  *Reconciled with the Phase 173 and 174 practice:* the phase carries its own driver scripts in the
  phase directory (`173-gates.sh`, `173-e2e.sh`, `173-verdict.mjs` are the pattern), records the power
  state for every run (a host suspend voids a run — operator decision C5), and the gate adds the
  **writer integration test** against the running stack, which no CI job runs
  (`2026-10-06-173-writer-integration-test-runs-in-no-ci-job.md`). The E2E driver refuses a dirty
  tree, so a negative control goes through `tests/scripts/e2e-run.sh` directly.

### Reconciliations

| # | What the discussion's ★ (or text) said | What is built instead | Reconciled with |
|---|---|---|---|
| R1 | 175-B2 ★: the trigger freezes an organization's `name` and `short_name` when the project's nominations are locked, "and no longer when the row is confirmed" | The confirmed-freeze stays; no lock condition enters the trigger; `short_name` joins the protected columns (D-05, D-08) | OD-B1 (a), OD-B3 (a) |
| R2 | 175-B3 ★: candidate names "always shown locked in the app" | Same rule as organizations: locked when confirmed, editable when not, in the app too (D-07) | OD-B1 (a); 175-B3 NOTE; OD08-C2 (a) |
| R3 | 175-B4 ★: name fields read-only "when either lock is on" (answers lock or nominations lock) | The nominations lock plays no part; the answers-lock half is kept, ruled by OD08-C1 (a) (D-09) | OD-B1 (a); GEN-03 as amended 2026-10-07 |
| R4 | 175-B5 ★ (a): `lock_nominations` fetched with the user-data read | The lock is the app setting `access.nominationsLocked`; the column is removed; the definer helper reads the setting (D-10) | 175-B5 (b) + NOTE; 177-B5 (b) |
| R5 | 175-B5, 177-B5: this phase's name fields are the accessor's first reader | No surface of this phase reads the accessor; it is built here for 176 and 177 (D-10) | OD-B1 (a); OD08-B1 (a) |
| R6 | 177-B5 (b) text: "Two sources then have to agree … the setting can lie" | One source: the column goes (D-10) | 175-B5 NOTE; `REQUIREMENTS.md` "Nominations locked"; OD08-B4 (a) |
| R7 | 175-0 facts 4 and 5: the confirmed-freeze "collides" with INV-05 and REG-07 | Not a collision: a seeded organization is meant to be locked (D-06); a self-registered one is unconfirmed (179-C1) | OD-B2 (a); Phase 174-02 (executed); 179-C1 (planned) |
| R8 | 175 cross-phase note: "175-B2(a) removes the confirmed-freeze on an organization's name" | Nothing is removed (D-05) | OD-B1 (a) |
| R9 | Cross-phase picture: "One lock: `projects.lock_nominations` (175-B2 ★)" | One lock: `access.nominationsLocked` (D-10) | 175-B5 (b) + NOTE |
| R10 | 175-B7 ★: staged list `image`, `name`, `shortName`; "the property writer gains two columns" | Plus `color` (D-04), plus `firstName` / `lastName` for a candidate (OD08-C2 (a)); the method is `updateEntityProperties` (D-12) | 175-B1 (b); OD-B1; Phase 173 |
| R11 | 175-F2 ★: assert "the new name and one changed answer" in the voter app | A name is saved only while unconfirmed, and unconfirmed is not public; the assertion is sequenced over two organizations (D-19) | OD-B1 (a); OD08-C4 (a) |
| R12 | 175-F1 ★: "one organization with an editor" | The dataset holds the organization in both states, unconfirmed and confirmed, as two organizations (D-18) | OD-B1 (a), OD-B2 (a); OD08-C4 (a) |
| R13 | 175-F3 ★: profile collapsed and expanded, and the preview | Plus the locked-name state, the colour field and the neutral no-questions page (D-20) | OD-B1; 175-B1 (b); 175-C1 |
| R14 | 175-G1 ★ plan 1: "the lock rule of 175-B2" | `short_name` in the trigger registrations, the lock moved to the setting, `entity_type` through `bulk_import` (D-21) | OD-B1..B3; 175-B5 (b) |
| R15 | 175-D1 / fact 13: the preview is candidate-only in three places | Already lifted by 173; the `children` tab, the colour read and a doc line remain (D-16) | Phase 173 (executed) |
| R16 | 175-A1: the descriptor names "the identity fields" per type | It names the fields, not their lock rule, which is one rule for all types (D-02) | OD-B1 (a) |
| R17 | 175-B6 / 175-C2: the name is "a new required field" | Required only while editable; a confirmed organization without a default-locale name is not told it is incomplete (D-11, D-14) | OD-B1 (a), OD-B2 (a); OD08-C5 (a) |
| R18 | 175-E1 / fact 16: the list of candidate-naming strings, under `candidateApp.*` | The namespaces are `contestantApp.*` and `dynamic.contestantAppBasicInfo.*`; the greeting is already per type; the "immutable data" copy changes meaning (D-17) | Phases 170, 173; OD-B1 |
| R19 | 175-F1: "no dataset has an organization user"; `forceRegister` writes a candidate grant only | `e2e/base` serves both types and has a read-only organization editor; `forceRegisterUser` and `grantEntity` exist (D-18) | X1 (a); Phase 173 |
| R20 | "Cannot be defined yet" — the selected entity's shape, the writer method, the key names, the app's name, what `identity-callback` writes | All resolved: `userData.current.entity` discriminated by `type`; `updateEntityProperties`; `contestantApp.*`; NAME-03 delivered by 171; unconfirmed per 179-C1 (see `<factual_baseline>`) | Phases 170, 171, 173; 179-C1 |
| R21 | The discussion places 175 directly after 174 | Phase 174.1 runs between them; this phase's screens sit behind the gate it repairs | Operator decisions D1 (a), D2 (a) |
| R22 | OD-B2 (a): "an organization seeded by code or email is confirmed from seeding" | "An organization seeded as confirmed": per call from Phase 177.1, with "confirmed" the seed writer's and the docs' default for a named entity (D-05, D-06) | OD08-F1 (a) |
| R23 | 175-F1 ★: a perm-style template "with its own project" | Its own dataset on the suite's one project (D-18) | OD08-C8 (a); the tree, as read for 176-CONTEXT |

### Judgement calls — all ruled 2026-10-08

Each was something this file had to interpret rather than read off a source. The operator ruled on all
ten in `.planning/v2.16-OPERATOR-DECISIONS-2026-10-08.md`, ticking no box and writing no note, so each
ruling is the recommended option — which in every case is the reading this file had given. **None is
open.** The decisions above state the outcome where it applies; this list records the ruling and the
alternative that was not chosen, so that nobody re-opens it.

- **J1 — `answersLocked` and the name fields (D-09). RULED: OD08-C1 (a).** A name field is editable
  when the entity is unconfirmed **and** `access.answersLocked` is off; the page keeps one Save
  button. *Not chosen:* the name following `confirmed` alone, with its own save button and
  unsaved-changes guard on a page that is otherwise read-only.
- **J2 — A candidate's name inputs in the app (D-07). RULED: OD08-C2 (a).** Yes: the two inputs lock on
  `confirmed`, as the organization's do, and the writer can save `first_name` / `last_name` for an
  unconfirmed candidate. *Not chosen:* candidate names staying locked in the app with the database
  rule standing alone.
- **J3 — Which tables get `short_name` in the trigger (D-08). RULED: OD08-C3 (a).** All four —
  `organizations`, `candidates`, `factions`, `alliances`. More pgTAP rows, nothing visible in the app.
  *Not chosen:* organizations only.
- **J4 — The lock move stays in this phase although nothing here reads it (D-10). RULED: OD08-B1 (a).**
  Phase 175 builds the schema change, the setting and the accessor, proven by pgTAP and a context
  unit test; 176 and 177 only read the value. *Not chosen:* moving the work to Phase 176 or 177.
- **J5 — Who controls the lock once it is an app setting, and the missing-row rule (D-10). RULED:
  OD08-B2 (a) and OD08-B3 (a).** Project editors may lock and unlock nominations as well as admins;
  nothing is built to prevent it. A project that does not exist is locked; a project with no
  `app_settings` row, or a row without the key, or any value other than `true`, is unlocked. *Not
  chosen:* a full column on `app_settings` changeable by admins only; a trigger guarding the one key;
  a missing row or key reading as locked.
- **J6 — How criterion 1's "what the voter app displays" is shown for a name (D-18, D-19). RULED:
  OD08-C4 (a).** Two organizations: a confirmed one for answers, image and colour; an unconfirmed one
  whose name is edited, then confirmed by the test, then read in the voter app. The steps are under
  D-19. *Not chosen:* a voter-side check for answers only.
- **J7 — `profileComplete` and the required rule for a confirmed organization whose name has no
  default-locale entry (D-11, D-14). RULED: OD08-C5 (a).** The name clause of `profileComplete` and
  the "required" badge apply only while the name is editable. *Not chosen:* the clause applying
  always. Phase 176's profile-task rule follows this ruling (176-CONTEXT J8).
- **J8 — The shape and reach of the colour field (D-04). RULED: OD08-C6 (a).** Organizations only; one
  colour, stored as `normal`, the dark-theme colour derived on read by `ensureColors`; not locked on
  confirmation, locked with answers like the logo; the preview shows the adjusted colour. *Not
  chosen:* two pickers; the colour offered to candidates; the colour locked on confirmation.
- **J9 — Where the page learns that the entity is confirmed (D-05). RULED: OD08-C7 (a).** From the
  entity list (`ctx.selectedEntity.confirmed`); no schema change. If an admin confirms the entity
  mid-session the name fields still look editable until that list is next read; the save is refused
  by the database and the page explains why (D-05's constraint). *Not chosen:* adding `confirmed` to
  `get_entity_user_data`.
- **J10 — "Own project" in 175-F1 ★ (D-18). RULED: OD08-C8 (a).** Its own dataset on the suite's one
  project, with its own setup and teardown — how every existing perm setup works, verified in the
  tree for 176-CONTEXT (R14 there). *Not chosen:* a genuinely separate project, which the preflight
  does not allow on one dev server.

### Claude's Discretion

- The descriptor module's name, location and exact shape, and how a page reads it.
- The route keys stay (`ContestantAppProfile`, `ContestantAppQuestions`, `ContestantAppPreview`); new
  test ids follow `tests/tests/utils/testIds.ts`. Existing ids (`profile-first-name`,
  `profile-last-name`, `profile-image-upload`, `profile-submit`, `contestant-profile-info-item`) keep
  their meaning for a candidate.
- The colour input's control, within D-04 and the UI spec.
- How the `children` tab is left out (a prop on `EntityDetails`, or the contents the app passes).
- The exact wording of the new strings, within D-17; the message-key names.
- How the default-locale requirement is expressed (an `Input` prop or a page-level check), provided
  Phase 179's CI1 form can use the same thing.
- Whether plan 1 of D-21 is one plan or split, within one migration regeneration.
- Removing the widened `page.params` annotation while editing the context
  (`2026-10-06-173-widened-page-params-annotation-in-contestant-context.md`) — expected, since plan 2
  edits that file.

</decisions>

<factual_baseline>
## Factual baseline (175-0, accepted under D-01)

The discussion's 19 facts, restated as they stand at `ba8f0a948`. **[tree]** marks what was read in
the tree for this file; **[docs]** marks what is taken from the discussion document or a SUMMARY and
was not re-read. Anchors are symbols or quoted content, never line numbers.

1. **Nothing in the app read an organization on 2026-10-04; most of it does now.** Phase 173 made the
   writer dispatch on `ENTITY_TABLES = { candidate, organization }` (`servedEntityType()` throws for an
   unserved type), keyed the store's drafts by type and id, and put the selected entity in the route
   (`ENTITY/`). **[tree]** **What is still candidate-only: the context's question scope** —
   `const entityType = ENTITY_TYPE.Candidate;` inside the rollup `$effect` of
   `lib/contexts/contestant/contestantContext.svelte.ts`, used for both `rollUpQuestionCategories` and
   `getApplicableQuestions`. **[tree]** This phase lifts it (173 O-7).
2. **The backend serves organizations on every path this phase needs.** The user-data RPC is now
   `public.get_entity_user_data(p_project_id, p_entity_type, p_entity_id)`, `SECURITY INVOKER`, with a
   candidate arm and an organization arm; it returns `name`, `short_name`, `info`, `color`, `image`,
   `sort_order`, `subtype`, `custom_data`, `answers`, `first_name`, `last_name` — **not `confirmed`**.
   **[tree]** `upsert_answers` has a `WHEN 'organization'` arm, and the storage authority helper maps
   the `organizations` path segment. **[tree, by grep]**
3. **`organizations.name` and `organizations.short_name` are localized JSONB, and an organization
   editor may update both.** The organizations UPDATE grant is `name, short_name, info, color, image,
   subtype, custom_data, answers, confirmed`. **[tree]** `entity_update_own_organizations` exists in
   `schema/302-rls.sql` **[tree, by grep]**; that it asks `entity.edit_answers` and that the
   organization editor holds it is **[docs]**. 173 did not measure the write end to end.
4. **The database freezes a confirmed entity's name, and that is now the intended rule (OD-B1).**
   `public.enforce_entity_immutability()` (`schema/011-validation-functions.sql`): rule 1, the
   confirmation gate — a change to `confirmed` in either direction needs `entity.confirm`; rule 2,
   "the conditional freeze, guarded on the OLD row's flag" — on an already-confirmed row a change to
   any column named in `TG_ARGV` by an `authenticated` caller without `entity.edit_immutable` raises
   `Entity name is immutable once confirmed: column … on row … cannot be changed …; changing it
   requires the entity.edit_immutable permission`. Both rules bind the effective `authenticated` role
   only. Registered four times in `schema/102-entities.sql`: organizations, factions and alliances
   with `('name')`, candidates with `('first_name', 'last_name')`. **`short_name` is in no
   registration.** All four tables have a `short_name jsonb` column. **[tree]**
5. **Who is confirmed.** `create_invitations` confirms a named target of any entity type when the
   invitation is created (174-02, executed) **[tree: the four `UPDATE … SET confirmed = true` arms in
   `schema/506-invitation-rpcs.sql`]**. `identity-callback` writes a candidate `confirmed: true`
   (`functions/identity-callback/candidateRecord.ts`, "WHY THE ROW IS WRITTEN CONFIRMED") **[tree]**
   and has no organization branch yet; Phase 179 adds one that writes the organization unconfirmed
   with an empty name (179-C1, **planned**).
6. **The nominations lock is `projects.lock_nominations` today, enforced on nominations only, and no
   frontend file reads it.** Column in `schema/100-tenancy.sql`; `private.project_nominations_locked`
   in `schema/301-auth-functions.sql`; four call sites in `schema/302-rls.sql`
   (`entity_insert_nominations`, `entity_insert_parent_nominations`, `entity_update_nominations` ×2);
   no match for `lock_nominations` or `nominationsLocked` under `apps/frontend/src`. **[tree]** A
   signed-in grant holder reads the project's `app_settings` row through
   `authenticated_select_app_settings` (`user_can('project', project_id, 'project.read_structure')`,
   or the project is open) **[tree]**; that an entity editor holds `project.read_structure` is
   **[docs]**, consistent with the organization-editor permission row in
   `schema/301-auth-functions.sql`.
7. **`answersLocked` is a different lock and is client-side only.** `#answersLocked =
   $derived(!!this.#appSettings.access.answersLocked)` in the contestant context; `answersLocked?:
   boolean` under `access` in `dynamicSettings.type.ts` and in the strict `access` object of
   `storedSettings.schema.ts`; no file under `apps/supabase/supabase/schema/` mentions it. **[tree]**
8. **A multilingual input exists.** `Input` accepts `type="text-multilingual"` and
   `"textarea-multilingual"` (`const multilingual = $derived(type.endsWith('-multilingual'))`), shows
   the other locales behind a button with `data-testid="multilingual-toggle"`, and renders the fields
   through `parts/MultilingualTextPart.svelte`; `showRequired` is whole-value, not per locale.
   **[tree]** That it emits a `LocalizedString` and takes one field per entry of the `locales` context
   is **[docs]**. `QuestionInput` takes `disableMultilingual`. **[tree]**
9. **The profile page (`ENTITY/profile/+page.svelte`).** Hard-coded: `firstName` and `lastName` as
   `locked` `Input`s inside `{#if !isOrganization}`; the image `Input type="image"` labelled
   `common.candidatePortrait`; the nominations block (`data-testid="contestant-profile-nominations"`,
   which Phase 176 moves out). From data: locked info questions (`getCustomData(q).locked`) and
   editable ones through `QuestionInput`. One Save (`profile-submit`), rendered only when
   `!answersLocked`; `PreventNavigation` watches `userData.hasUnsaved`. An organization opening it
   today sees no name field at all. **[tree]**
10. **The store stages the image and the answers, nothing else.** `setImage` / `resetImage`;
    `save()` calls `dataWriter.updateEntityProperties` and merges the returned image into the entity;
    an `$effect` resets unsaved data when `answersLocked` turns on.
    `EditableEntityProps = { image?: ImageWithFile }`. **[tree]**
11. **The upload path is built from the entity's table** (`#uploadEntityFile({ projectId, table, id,
    file })` in `supabaseDataWriter.ts`). **[tree]**
12. **Questions can be addressed to an entity type in the model, but no seed can say so.** As quoted
    under D-18. **[tree]** No template sets `entity_type` — **[docs]**.
13. **The preview is generic except for the `children` tab.** As quoted under D-16. **[tree]**
14. **`profileComplete` names no entity type**, and the questions layout renders an error page for an
    entity with no opinion questions. As quoted under D-13 and D-14. **[tree]**
15. **`hideIfMissingAnswers` knows candidates only.** As quoted under D-15. **[tree]**
16. **Most copy is entity-neutral; about a dozen strings name a candidate or a person.** As listed
    under D-17 **[tree: `apps/frontend/messages/en/`]**; the other six locales were not read.
17. **The settings page is entity-neutral** (the user's email and the password setter) — **[docs]**;
    its component doc still says "the candidate's user settings" **[tree]**.
18. **Test identities.** `forceRegisterUser`, `grantEntity`, `revokeEntityGrant` exist in
    `tests/tests/utils/supabaseAdminClient.ts`; the multi-entity user of
    `data-setup-entity-selection` holds two base candidates and one base organization; the specs are
    `tests/tests/specs/contestant/contestant-journey.spec.ts` and
    `contestant-entity-selection.spec.ts`; the axe spec is `contestant-a11y.spec.ts`. **[tree]** That
    the organization's home is the only organization page a browser has rendered, and that no
    organization save has gone through the UI, is Phase 173's verification finding. **[docs]**
19. **The "allow incomplete profile save" todo is mostly on the tree** — `canSubmit` is
    `status !== 'loading'`, and the questions layout redirects to the profile while required info is
    missing **[tree]**; the rest of it is Phase 176's.

### Cannot be defined yet — as the filled document and the executed phases resolve it

- **The shape the pages read the selected entity from** — resolved by 173: `userData.current.entity`,
  a union discriminated by `type`; `ctx.selectedEntity` for the listed entity (type, id, `confirmed`).
- **Which writer method saves `name` and `short_name`** — resolved by 173: `updateEntityProperties`,
  widened here (D-12).
- **The final key names for the per-type copy** — resolved by 170: `contestantApp.*`,
  `dynamic.contestantAppBasicInfo.*`.
- **Whether the app's own name varies by served types** — resolved by 171 (NAME-03 delivered;
  `lib/contestant/utils/contestantAppName.ts`).
- **Whether `identity-callback` writes an organization confirmed** — settled: unconfirmed (179-C1,
  OD-B1).

### Research items — for the planner's researcher (read-only until the stack is free)

- **RQ-1.** Whether an organization editor's update of `name`, `short_name` and `color` passes
  row-level security and the column grant on an unconfirmed row, and is refused by the trigger on a
  confirmed one — measured through the writer (173 left it unmeasured).
- **RQ-2.** What validates `question_categories.entity_type` and `questions.entity_type` today, and
  what `bulk_import` must check once it carries the key (D-18).
- **RQ-3.** How a signed-in contestant of a **closed** project receives the full app settings in the
  browser — that `access.answersLocked`, and so `access.nominationsLocked`, reaches the contestant
  context after sign-in and not only the three public values (D-10).
- **RQ-4.** Which existing pgTAP rows update `short_name` as an entity user on a confirmed fixture row
  (D-08), and which rows set `projects.lock_nominations` (D-10) — derived by search at planning time.
- **RQ-5.** How the page obtains the project's default locale for D-11 (the adapters hold
  `this.defaultLocale`; what the context exposes was not read).
- **RQ-6.** *Answered (OD08-C8 (a); read in the tree for 176-CONTEXT):* a perm setup seeds its template
  into the suite's one project through `setupFromTemplate` and `resolveE2eProjectId()`. The planner
  still reads `tests/tests/setup/perm/` and `tests/playwright.config.ts` for the mechanism it copies.
- **RQ-7.** The finding of the investigation into four `ownership_invalid_mutation` warnings from
  `Input.svelte`, logged when the contestant profile page rendered (a dev-server log of Phase 174.1).
  It is run before this phase is planned (OD08-G7 (a)), by another agent; the planner reads its
  result before plan 3, which reworks that page and adds an input type, and does not build on the
  component while the cause is unknown.

</factual_baseline>

<expected_tree>
## The tree this phase is planned against

Phases 170–173 are executed. Phase 174 is complete (all ten plans; verified and accepted). Phase 174.1
is executed and verified, and closes after the browser check of its two remaining focus outcomes
(OD08-A2 (b)). The two "Inherited from Phase 174 / 174.1" subsections below are the 2026-10-07
snapshot, written while those phases were still running: what they call *running* or *planned* is on
the tree now, and is re-read there before an anchor is fixed. Anything else below marked *planned* is
read from a PLAN or a CONTEXT and must likewise be re-read.

### Name map (verified at `ba8f0a948`)

| Thing | Where |
|---|---|
| Entity pages | `routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/` — `+layout.server.ts`, `+layout.svelte`, `+page.svelte` (home), `profile/`, `questions/` (`+layout.svelte`, `+page.svelte`, `[questionId]/`), `preview/`, `settings/` |
| Route constants | `lib/routes/route.ts` — `CONTESTANT_ENTITY`, `ContestantAppEntityHome`, `ContestantAppProfile`, `ContestantAppQuestions`, `ContestantAppPreview` |
| Contestant context | `lib/contexts/contestant/contestantContext.svelte.ts` (+ `.type.ts`); store in `contestantUserDataState.svelte.ts` (+ `.type.ts`) |
| Writer | `lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts`; types in `lib/api/base/dataWriter.type.ts` (`UserEntity`, `EditableEntityProps`, `SetPropertiesOptions`) |
| Navigation | `lib/dynamic-components/navigation/contestant/ContestantNav.svelte` |
| Gates | `lib/contestant/gates/gates.ts`, `gateViews.ts`, `TermsOfUseGate.svelte` |
| Served types | `getServedEntityTypes` in `packages/app-shared/src/settings/contestantAppConfig.ts` |
| Entity tables and trigger registrations | `schema/102-entities.sql` |
| Trigger function | `schema/011-validation-functions.sql` `enforce_entity_immutability` |
| Lock helper and policies | `schema/301-auth-functions.sql`, `schema/302-rls.sql` |
| Entity RPCs | `schema/503-entity-rpcs.sql` (`get_user_entities`, `get_entity_user_data`, `upsert_answers`) |
| Bulk import | `schema/501-bulk-operations.sql` |

### Inherited from Phase 173 (executed; verified with one human item)

- The writer and the store serve organizations; an organization save is proven **at the adapter
  level** (`supabaseDataWriter.integration.test.ts`, 7 cases) and the organization's **home and menu**
  in a browser. `173-VERIFICATION.md`'s one human-verification item — "Open an organization editor's
  profile, questions, preview and settings pages in a browser, and save an answer through the UI" —
  **is this phase's scope**, and D-18..D-20 are what discharge it.
- Three root-cause fixes in 173-03 that this phase's edits must not undo: `reloadEntityData` must not
  read the saved data tracked before its first await; the preview's reload effect depends on the
  loaded entity's type and id as one derived string; name fields are rendered unless the entity is a
  known organization (D-02).
- Every load on the path reads no `url` property (`layout.tracking.test.ts` beside each); a new
  `+page.ts` or `+layout.ts` under `ENTITY/` obeys the same rule.
- `get_user_entities` returns one object with an `entities` array; each entry carries `confirmed`.
- `EntityCard` with `headerOnly` and `showType`, and `EntityList`, are the reusable card list.

### Inherited from Phase 174 (executing)

- **Executed (SUMMARY present):** 174-01; 174-02 — `public.invitations`, `create_invitations`
  (confirms a named target of any type), pgTAP file `39-invitations.test.sql`.
- **Running now:** 174-03 — public sign-up off and email confirmations on (operator decision A1 (a)).
- **Planned (04–10):** `claim_invitations`, the `account-access` Edge Function, the removal of
  `invite-candidate`, harness helpers that seed an invited candidate and organization, the docs. This
  phase depends on none of them for its own behaviour; it **regenerates the migration after them**.
  If a 174 helper for seeding an invited organization exists by then, the confirmed organization of
  D-18 may be created through it, which exercises OD-B2 end to end.

### Inherited from Phase 174.1 (inserted, not started)

- The terms-of-use gate fits a phone viewport and focus lands on the page that replaces the gate.
  Every organization page of this phase is reached through that gate. This phase adds no phone-width
  E2E project of its own beyond what the UI spec asks.

### Handed to later phases by this phase

- **176:** the `nominationsLocked` accessor; the per-type descriptor for labels; the "no opinion
  questions → no questions entry" rule, which becomes "the task is omitted"; the profile page's
  nominations block, left in place.
- **177:** the accessor for NOM-06 and K; a self-registered organization is absent from K's parent
  list until confirmed.
- **179:** `updateEntityProperties` saving `name` and `short_name`; the multilingual name inputs and
  the default-locale requirement; the sentence "until an administrator has confirmed your
  organization" for CI1 (179 D-12, already on that reading).
- **Every later E2E dataset:** `entity_type` on the two question tables through `bulk_import`.

</expected_tree>

<cross_phase>
## Cross-phase Notes and Obligations

- **O-1 — schema seriality.** One regeneration of the single migration file, after Phase 174's last
  schema plan. Three independent schema changes ride it (D-08, D-10, D-18).
- **O-2 → 176, 177.** The accessor's name is `nominationsLocked` on the contestant context. This phase
  builds the move and the accessor (OD08-B1 (a)); 176 and 177 read it.
- **O-3 → 174 (docs).** 174-10 (planned) writes the invitation docs, including "seeding and what it
  confirms". After this phase the same docs must say that a confirmed entity's `short_name` is frozen
  too. Whichever runs second corrects the sentence.
- **O-4 → 179.** The property map of D-12 is what CI1's save goes through; the name inputs and the
  default-locale check of D-11 are built where CI1 can import them.
- **O-5 — Phase 173's human-verification item** closes with this phase's E2E evidence; the phase
  summary says so by name.
- **O-6 — docs and skills.** `apps/docs` pages on the Contestant app and on app settings,
  `apps/supabase/README.md`, `.claude/skills/database/schema-reference.md` and `rls-policy-map.md`
  (the lock, the trigger's columns), `.claude/skills/data/*` if `entity_type` seeding is described,
  and `packages/dev-seed/README.md` (the key is no longer denied on the question tables).
- **O-7 — pending todos that bear on this phase** (`.planning/todos/pending/`):

  | Todo | Bearing |
  |---|---|
  | `2026-03-28-generalize-candidate-app-to-party-app.md` | Closed at this phase's close (D-03) |
  | `2026-03-28-investigate-migrating-candidate-answer-store.md` | Out of scope, left untouched (D-03) |
  | `2026-10-06-173-widened-page-params-annotation-in-contestant-context.md` | Closed here if plan 2 removes it (discretion) |
  | `2026-10-06-173-writer-integration-test-runs-in-no-ci-job.md` | The test gains cases here and is run in the gate (D-12, D-22); the CI gap stays |
  | `2026-10-06-173-no-entity-name-on-answering-pages.md` | An operator decision, Phase 176 if a cue is wanted; this phase's pages do not add one |
  | `2026-10-06-173-nomination-format-error-logged-in-every-run.md` | Raised by the profile page's `parseNomination`; Phase 176 owns it. An organization's profile runs the same code |
  | `2026-10-06-173-terms-of-use-view-phone-overflow-and-focus.md` | Phase 174.1 |
  | `2026-10-06-173-nav-drawer-does-not-close-on-escape.md` | Met by any spec that drives the menu; not fixed here |
  | `2026-10-02-app-settings-shallow-merge-and-no-admin-editor.md` | Why every writer of `access` restates the whole root (D-10); no Admin editor exists to set the lock |
  | `2026-10-06-172-admin-confirm-requires-editor-acceptance.md` | The other rule about confirming an entity (TOU-F01); not built here |
  | `2026-05-13-allow-incomplete-profile-save-gate-opinion-questions.md` | Phase 176 (fact 19) |
  | `2026-05-31-display-nominating-org-in-candidate-profile-nominations.md` | Phase 176 |
  | `2026-06-01-candidate-home-savedanswers-empty-logout-modal.md` | Phase 176 |
  | `2026-08-27-147-answers-locked-warning-unscanned.md`, `2026-08-27-147-empty-answer-candidate-states-unscanned.md`, `2026-08-27-147-prevent-navigation-modal-unscanned.md` | States of the pages this phase edits that no axe scan reaches; the new dataset could reach them, but D-20 does not require it |
  | `2026-10-06-native-speaker-review-profile-selection-strings.md`, `2026-10-05-native-speaker-review-contestant-app-names.md` | The precedent for the review todo this phase files (D-17) |
  | `2026-08-24-external-id-namespace-collision-con-prefix.md`, `2026-09-18-verify-e2e-runs-and-teardowns-isolated-to-own-project.md` | Constraints on the new template and its teardown (D-18) |
  | `2026-05-16-extend-e2e-tests-to-cover-election-and-constituency-scoped-q.md` | Adjacent: question scoping in E2E data; type scoping lands here |
  | `2026-10-06-172-full-suite-red-on-a-slow-dev-server-start.md` | A void run is read from the power log before a red run is believed (D-22) |

- **O-8 — todos this phase files:** the native-speaker review of its new strings; and "a project editor
  can lock and unlock nominations" as a recorded consequence for the Admin-app work (OD08-B2 (a)).
- **O-9 ← 177.1.** `create_invitations` gains a required `p_confirm_entity` there, after Phase 177
  (OD08-F1 (a), F2 (a)). Nothing in this phase calls `create_invitations` as captured; a spec that
  comes to do so is among the callers 177.1 re-points.

</cross_phase>

<canonical_refs>
## Canonical References

### The phase's own contract

- `.planning/v2.16-OPERATOR-DECISIONS-2026-10-08.md` § B (B1–B4), § C (C1–C8), § F (F1, F2) and G7.
- `.planning/v2.16-OPERATOR-DECISIONS-2026-10-07.md` § B (B1–B3) and § D (D1, D2).
- `.planning/v2.16-DISCUSSION-POINTS.md` § *Phase 175*, § *Cross-phase picture*, 177-B5, 179-C1.
- `.planning/ROADMAP.md` § *Phase 175* (criterion 4 amended 2026-10-07 and 2026-10-08; "Settled
  2026-10-08"), § *Phase 174.1*, § *Phase 177.1*, and the v2.16 hand-over bullets.
- `.planning/REQUIREMENTS.md` — GEN-01, GEN-03 (amended 2026-10-07 and 2026-10-08) and REG-07
  (amended 2026-10-07), INV-05, the
  "Nominations locked" definition, the standing rules.
- `CAND-APP-PLAN.md` at the repo root — nomenclature and the screens A–L.

### Upstream phases

- `.planning/phases/173-multi-entity-grants-entity-selection/` — `173-VERIFICATION.md` (the human
  item), `173-03-SUMMARY.md` § *For Phase 175*, `173-13-SUMMARY.md` § *What Later Phases Must Know*,
  `173-NAME-MAP.md` § *Obligations to later phases*, `173-UI-SPEC.md`, `173-CONTEXT.md` O-7.
- `.planning/phases/174-invitations-grants-defined-in-advance/` — `174-CONTEXT.md` D-11 and O-7,
  `174-02-SUMMARY.md` (INV-05 as implemented).
- `.planning/phases/179-identity-provider-registration-coverage-close/179-CONTEXT.md` — D-10, D-11,
  D-12 (what 179 expects from this phase).
- `.planning/phases/171-project-settings-served-entity-types-registration-mode-matri/171-02-SUMMARY.md`
  — what an anonymous reader of a closed project can see of the settings.

### Standing project rules and skills

- `CLAUDE.md` — § *Context Destructuring Rule*, § *Comment Hygiene*, § *E2E Hard Rule*, § *E2E
  preflight*, § *Svelte Warning-Accepted Format*.
- `Skill("components")` — the runes-era component API, `concatClass`, the axe gate,
  `context-reactivity.md`.
- `Skill("database")` — `schema-reference.md`, `rls-policy-map.md`, the pgTAP conventions.
- `Skill("data")` — entity variants, `Question.entityType`, `Colors`.
- `.agents/code-review-checklist.md`.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable assets

- **Multilingual text input** — `Input type="text-multilingual"` with `locked`, `required`, `label`,
  `onChange`, `onShadedBg`; used for info questions through `QuestionInput`.
- **Locked-field presentation** — the `locked` prop of `Input`, as the candidate's name fields and the
  locked info questions use it today, with `InputGroup`.
- **Colour utilities** — `lib/utils/color/ensureColors.ts`, `adjustContrast.ts`,
  `PreviewColorContrast.svelte`.
- **Preview** — `EntityDetails` (`lib/dynamic-components/entityDetails/`), which already renders an
  organization.
- **Save surface** — `userData.save()`, `PreventNavigation`, `SuccessMessage`, `ErrorMessage`,
  `Warning` (`contestant-answers-locked-warning`).
- **Per-type copy precedent** — `common.electionSymbol.candidate` / `.organization`;
  `common.<type>.singular`.
- **E2E** — `forceRegisterUser`, `grantEntity`; the session-per-table shape of
  `contestant-a11y.spec.ts`; the perm setup and teardown pairs under `tests/tests/setup/perm/`; the
  phase driver scripts of 173 and 174.
- **pgTAP** — the three-cell grid of `19-entity-immutability.test.sql`; the lock assertions of
  `23-nominations-write.test.sql`.

### Established patterns

- A context accessor is a `$derived` private field with a getter, declared on the context's type;
  consumers read `ctx.X` in their tracking scope.
- A stored settings root replaces the shipped root whole; every writer restates the root.
- A refusal the user can cause is a named, translated message, not the generic save failure.
- A trigger's protection is `UPDATE OF` list plus `TG_ARGV`; the pgTAP file pins both.
- A new contestant surface gets an axe entry in both themes under the session that reaches it, with a
  reach marker.

### Integration points

- The context's rollup `$effect` (question scope by the selected entity's type).
- `EditableEntityProps` → `SetPropertiesOptions` → `_updateEntityProperties` → the store's `save()`.
- The four trigger registrations; the definer helper `private.project_nominations_locked`.
- `skip_columns` in `bulk_import` and `DENIED_BY_TABLE` in dev-seed.
- The `access` and `entities.hideIfMissingAnswers` members of the settings type, schema and defaults.
- `ContestantNav` and the home page's task buttons (D-13).

</code_context>

<specifics>
## Specific Ideas

- **The common case is the locked one.** Most organization users in a seeded project open a profile
  whose name and short name are already set and locked (D-06). The UI spec treats that as the primary
  state: the names read as a statement of who the organization is, with one line on how to get them
  corrected, and the editable work — logo, colour, info questions — follows.
- **One rule, said once to the user.** "Your name is set" is one sentence for both types; what
  differs is who set it (the administrator, or the identity provider), which is per-type copy.
- **The preview is the proof of the colour.** The user picks a colour and sees it, contrast-adjusted,
  where voters will.
- **The operator's wider direction, recorded for the phases that own it:** only confirmed
  organizations are offered as a parent in the nomination selection for candidates (175-B2 NOTE;
  Phase 177), and a later open registration would create organizations unconfirmed too (REG-F01,
  deferred).

</specifics>

<deferred>
## Deferred Ideas

- An Admin-app screen to confirm an entity, to correct a confirmed name, or to set the nominations
  lock — out of scope for v2.16 (`REQUIREMENTS.md` § Out of Scope); the rules are enforced and the
  screens are not built.
- A suggestion store for changes to immutable data — ruled out in Phase 162; users message the admin.
- Faction and alliance users in the Contestant app.
- The answer-store investigation (D-03).
- Loading the organization's candidates into the preview (`children` tab) — 175-D1 (b), not chosen.
- Rescanning all seven candidate surfaces as an organization — 175-F3 (b), not chosen.
- A deep merge of stored settings — the standing todo; this phase restates roots instead.

### Ambiguities and contradictions found while reconciling

*This list is the record of what was found on 2026-10-07. Items 2, 6, 8, 9 and 10 each ended in a
judgement call (J4, J6, J5, J3 and J1); all five were ruled on 2026-10-08 and are no longer open —
see* Judgement calls. *Item 1's stale roadmap line has since been replaced.*

1. **`ROADMAP.md` § Phase 175 still carries, below the amended criterion 4:** "**Still to discuss when
   the phase is reached** (operator, 2026-10-05): 175-B2, 175-B3 and 175-B4 — when a name is editable,
   for both entity types. See criterion 4." Criterion 4 and GEN-03 say the rule is settled
   (2026-10-07). The line is stale.
2. **`ROADMAP.md` § Phase 175 "Discussion settled"** says the nominations lock moves and "this phase
   adds the frontend accessor that 176 and 177 reuse", while criterion 4 says the name fields are
   read-only "whatever the nominations lock says". Not a contradiction, but no criterion of this
   phase now observes the lock (J4).
3. **Discussion, § Cross-phase picture → Ordering:** "**One lock:** `projects.lock_nominations`
   (175-B2 ★)" against `REQUIREMENTS.md`: "the app setting `access.nominationsLocked` … The lock moves
   there out of `projects.lock_nominations`" (R9).
4. **Discussion, § 175 — Cross-phase notes:** "175-B2(a) removes the confirmed-freeze on an
   organization's name. Without it, INV-05's auto-confirmed organizations and REG-07's post-callback
   name entry both hit `Entity name is immutable once confirmed`" against OD-B1 / OD-B2: the freeze
   stays and the seeded organization is meant to hit it (R7, R8).
5. **Discussion, § Cross-phase picture → Requirement wording:** "GEN-03 (175-B4 makes the name
   read-only under either lock)" against GEN-03 as amended: "which … supersede 175-B4 ★" (R3, J1).
6. **Criterion 1** ("the saved values are what a reload shows and what the voter app displays") and
   **175-F2 ★** ("asserts the new name and one changed answer") against **OD-B1**: a name is saved
   only while the organization is unconfirmed, and an unconfirmed organization is not public (J6).
7. **177-B5 (b), the ticked option's own text:** "Two sources then have to agree, and the database
   lock stays authoritative, so the setting can lie" against the **175-B5 NOTE:** "move it to
   app_settings away from project" — one source (R6).
8. **`schema/302-rls.sql`, above `admin_update_app_settings`:** "Settings permissions split along
   whether a policy reads the value: `project.edit_project_settings` governs `projects` and is
   admin-only, while this permission governs `app_settings` and project editors hold it too" against
   D-10: a policy will read an `app_settings` value (J5).
9. **OD-B3's wording** names organizations ("Today the database freezes an organization's `name` …
   Under B1 (a) both freeze") while its reason says "one rule for every name field" and OD-B1 "for
   every entity type" — the reach across the four tables is J3.
10. **OD-B1 and `access.answersLocked`:** neither the operator decisions nor the amended GEN-03
    mention it; 175-B4 was the only decision that did, and it is superseded (J1).
11. **`173-VERIFICATION.md`** cites the question scope by line (`contestantContext.svelte.ts:311`);
    the content anchor is `const entityType = ENTITY_TYPE.Candidate;` and is what this file uses.

</deferred>

---

*Phase: 175-organization-editing-profile-questions-preview*
*Context gathered: 2026-10-07 from the filled v2.16 discussion points and the operator decisions of
2026-10-07*
*Operator decisions of 2026-10-08 applied 2026-10-08: J1–J10 ruled, and D-04 to D-11, D-14, D-18 and
D-19 rewritten where a ruling fixed them*
