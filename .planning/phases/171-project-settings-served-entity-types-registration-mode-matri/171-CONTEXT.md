# Phase 171: Project Settings — Served Entity Types & Registration-Mode Matrix - Context

**Gathered:** 2026-10-05
**Status:** Ready for planning

**Source of decisions:** `.planning/v2.16-DISCUSSION-POINTS.md` § *Phase 171* — a shared checkbox
document covering Phases 170–179 that the operator filled in one pass (committed as `e4813bf65`,
"docs[planning]: v2.16 discussion points for phases 170-179, operator-filled"). Its rule: an unticked
decision accepts the `★ RECOMMENDED` option; a ticked box overrules the ★; `**EDIT:**`/`**NOTE:**`
free text beats every box. In Phase 171's 22 decisions (the baseline 171-0.1 plus 21) the operator
ticked **one box, an overrule of the ★**, and wrote **no EDIT or NOTE text** in this section:

1. **171-A3 → (b): the two settings live inside the existing root, as `contestantApp.entityTypes`
   and `contestantApp.registrationModes`** — instead of the ★ "two root-level keys
   `contestantAppEntities` and `registrationModes`". See D-04.

Overrules and notes **elsewhere in the document** that touch this phase:

- **170-A5 → (b):** the auth pair moves to neutral `api/auth/{callback,logout}` (duplicate logout
  merged) and only `preregister` moves to `api/contestant/`. Affects the API path the
  pre-registration flow calls; no decision here changes.
- **175-B5 → (b) with NOTE, and 177-B5 → (b):** the nominations lock moves off `projects` to an app
  setting, `access.nominationsLocked`. It lands in 175/177, not here, but it will sit in the same
  JSON, behind the same merge and beside the same anon-readable read this phase builds. See D-09 and
  *Cross-phase notes*.
- **Additional note 1 (end of the document):** "Change the whole preregister route to register and
  an e.g. id-provider subroute within it." No phase is named. See D-12, D-13 and *Ambiguities*.
- **X1 → ★ (a):** the E2E base dataset stays candidate-only in this phase; Phase 173 widens it. See D-18.
- **X3 → ★ (a):** `REQUIREMENTS.md`, `ROADMAP.md` and `PROJECT.md` are amended in one docs commit
  to the chosen options. That amendment may be in flight while this file is read, so this file
  cites requirement ids and states each decision itself. It does not quote requirement wording.

Every other decision takes its ★ option as written, except where the ★ text assumed root-level keys.
Those places are rewritten **and flagged inline as "reconciled with the 171-A3 overrule"**. The full
list is under *Reconciliations* at the end of `<decisions>`.

<domain>
## Phase Boundary

A project declares which entity types its Contestant app serves and, for each served type, which of
`identity_provider`, `email` and `code` may be used to register. The app obeys both declarations
where it can today: in the name it gives itself, and in which registration entries the login screen
and the navigation show. Fixed by `.planning/ROADMAP.md` § *Phase 171*. Requirements: SET-01, SET-02,
SET-03, NAME-03, with E2E-03 as a closing criterion. Depends on Phase 170.

**Roadmap success criteria (restated, not quoted, because of X3):**

1. The settings name the served entity types (`candidate`, `organization` or both) and the app names
   itself accordingly in all seven locales: "Candidate and party app", "Candidate app" or
   "Party app". Changing the setting changes the name with no code change (SET-01, NAME-03).
2. The settings state, per served type, which registration modes are allowed. One empty cell, an
   empty row and a wholly empty matrix are each accepted and read back as declared. Naming a type or
   a mode twice equals naming it once (SET-02).
3. With no mode allowed for any served type the login screen offers sign-in only and shows no
   registration entry; with at least one allowed, the entry is offered (SET-03).
4. A freshly seeded project (`yarn db:reset-with-data`) and every E2E dataset declare both settings
   explicitly, and the full E2E suite is green at close (E2E-03).

**The roadmap's "Discussion must settle" items are settled:** list-valued JSON in `app_settings`,
deduplicated at parse (D-02); `preRegistration.enabled` is removed (D-11).

**Corrections to the roadmap's premises (from the accepted baseline, D-01):**

- Anon cannot read a closed project's `app_settings`, and a closed project is the normal state while
  contestants register. Criteria 1 and 3 hold in that state only because of D-09.
- The login screen has two registration entries today, one of them ungated, and no entry for the
  email mode. Criterion 3 is met by gating the two that exist (D-12); the email-only case has no
  on-screen entry until Phase 178.
- Today's app name is a branded phrase, not one of the three terms (D-15).
- No screen edits settings. "Changing the setting" is demonstrated by re-seeding (D-20).

**Not in this phase:** server-side enforcement of the matrix (174, 179); the single Register button
and the mode selector (178); honouring `organization × identity_provider` (179); any settings-editing
screen; widening the E2E base dataset to organizations (173); the nominations lock as an app setting
(175, 177); texts that address the reader as a candidate (175).

### Name map (stated once)

The plan is written against the tree **as Phase 170 leaves it**. The discussion document's evidence,
and every spot-check in this file, was read on today's tree. Left column is what the planner uses.

| After Phase 170 (plan against this) | Today's tree (evidence cites this) |
|---|---|
| settings root `contestantApp` (holds `questions`) | `candidateApp` |
| `access.contestantApp` | `access.candidateApp` |
| `notifications.contestantApp` | `notifications.candidateApp` |
| `routes/contestant/…` | `routes/candidate/…` |
| message namespaces `contestantApp.*` | `candidateApp.*` |
| `dynamic.contestantAppName`, `dynamic.contestantAppNotAccessible.*` | `dynamic.candidateAppName`, `dynamic.candidateAppNotAccessible.*` |
| route constants `ContestantAppRegister`, `ContestantAppPreregister*` | `CandAppRegister`, `CandAppPreregister*` |
| `ContestantNav` (assumed; confirm in 170's output) | `CandidateNav.svelte` |
| API: `api/auth/{callback,logout}`, `api/contestant/preregister` (170-A5 (b)) | `api/candidate/…` |
| `$lib/contestant/…` (assumed; confirm in 170's output) | `$lib/candidate/…`, alias `$candidate` |

Names 170 deliberately leaves: `get_candidate_user_data` (173 removes it) and the `invite-candidate`
Edge Function (174 removes it). Neither is touched here. Phase 170's `lint:check` gate holds every
later phase to the new names, so this phase introduces no `candidate`-named symbol for the app.

</domain>

<decisions>
## Implementation Decisions

Decision IDs map one-to-one onto the discussion document's Phase 171 IDs, given in parentheses.
22 decisions → D-01..D-22. Every decision is locked; only the chosen option is stated. ⚠ marks the
document's own "changes the shape of the work" flag.

### 0 — Factual baseline

- **D-01 (171-0.1):** Accept all 16 facts of 171-0 as the phase's baseline. They are restated in
  *Factual baseline* below. Facts 3, 4, 7, 8, 9 and 10 are not in the roadmap. Two refinements found
  while spot-checking for the reconciliations are recorded beside facts 2 and 11; they refine the
  facts and do not contradict the decisions.

### A — Storage and shape

- **D-02 (171-A1) ⚠:** **JSON inside `app_settings.settings`**, typed by `DynamicSettings` and
  validated by `StoredSettingsSchema`. **Deduplication happens at parse** (D-05) and every reader
  tests membership, never position. No CHECK, no trigger, no column on `projects`, no new table.
  Project editors can change it (`project.edit_app_settings`). Server-side readers in later phases
  (SQL in 174, Deno in 179) read the JSON by membership, which repeats cannot affect.
  *Reconciled with the 171-A3 overrule:* the JSON paths those readers use are
  `settings #> '{contestantApp,entityTypes}'` and `settings #> '{contestantApp,registrationModes,<type>}'`,
  not root keys.
- **D-03 (171-A2):** **The matrix is a map from entity type to a list of modes:**
  `{ candidate: ['email', 'code'], organization: [] }`. An empty cell, an empty row and an empty
  matrix are distinct, storable values. Under both merges in play (the database's
  `jsonb_recursive_merge` and, after D-04, the frontend's) a list is replaced whole and never
  unioned, so a write cannot inherit a mode from what was stored before. *Reconciled with the
  171-A3 overrule:* under a deep merge the **map** merges per key, so a stored
  `{ candidate: [...] }` keeps whatever `organization` row lies beneath it. With the D-06 default
  (every row empty) that inheritance is harmless on the read side; on the write side it is why
  D-18's datasets state both rows.
- **D-04 (171-A3) — OPERATOR OVERRULE of the ★ (ticked (b)): the two settings sit inside the
  existing root, as `contestantApp.entityTypes` and `contestantApp.registrationModes`**, beside
  `contestantApp.questions`. The option's own text names the cost: the frontend's `mergeAppSettings`
  replaces a stored root whole, so a stored `contestantApp` that omits `questions` makes the question
  page throw. Either every writer restates the whole root, or the merge becomes deep in this phase.
  **Settled here: the merge becomes deep in this phase, and the seeds restate the whole root as
  well.** Concretely:
  - `mergeAppSettings` in `apps/frontend/src/lib/utils/settings.ts` stops replacing by root key and
    merges plain objects recursively, arrays and scalars replaced whole. The deep merge already
    exists: `mergeSettings` in `packages/app-shared/src/utils/mergeSettings.ts`, whose docstring
    names `mergeAppSettings` as the "separate, SHALLOW merge". The root-level "skip nullish" filter
    of `mergeAppSettings` is kept.
  - Every dataset that writes the `contestantApp` root writes all three members (D-18), so the
    stored row is complete on its own and does not depend on the merge.
  - `_getAppSettings`'s closed-project branch builds its `contestantApp` and `access` values over
    the shipped defaults (D-09), as it does for `access` today.

  **This is a judgement call, not a mechanical consequence of the tick.** Why deep and not
  restate-only: (i) the option the operator ticked offers exactly these two remedies; (ii) three of
  the four datasets do not carry the root today (see *Factual baseline*, fact 11 refinement), and
  the E2E harness writes settings two ways, a full replace and a deep merge, so "every writer
  restates" has to hold for each of them and for hand-written SQL; (iii) the failure is a thrown
  exception on a protected page, not a wrong default; (iv) `mergeAppSettings` carries its own
  `TODO: Handle merging so that empty objects do not overwrite defaults`; (v) 175-B5 / 177-B5 put
  `access.nominationsLocked` into the `access` root, which has the same hazard; (vi) nothing is
  deployed, so the settings shape changes in place.
  **The planner's research must confirm before the plan locks it:** that no root, static or
  dynamic, relies on replace-whole to *remove* a shipped member (candidates to check: `results`
  with its `cardContents` and `sections`, `entityDetails`, `analytics` including the static
  `platform`, `notifications`), across the five voter-side callers of `mergeAppSettings`
  (`(voters)/(located)/+layout.ts`, `constituencies/+page.ts`, `elections/+page.ts`,
  `nominations/+layout.ts`, `appContext.svelte.ts`) and the perm specs that depend on a setting
  being absent. **Fallback if research finds such a root:** scope the deep merge to the
  `contestantApp` root only and keep replace-by-root elsewhere; the seeds' restatement already
  covers that case. Either way the statement of the merge rule in the developers' docs page and the
  comments in `packages/dev-seed/src/templates/default.ts` and in `_getAppSettings` that describe a
  shallow merge are corrected in the same plan, because a comment describes the code as it is.
  **Naming caution:** `contestantApp.entityTypes` is a second thing called "entity types" beside the
  root `entities` settings and the app context's own entity-type derivation. Readers go through the
  D-09 accessor, never the raw key.
- **D-05 (171-A4):** **Lists are `z.array(z.enum(…))` followed by a transform that removes repeats
  and puts the values in canonical order.** Canonical order is the order of the vocabulary:
  `candidate, organization` for types and `identity_provider, email, code` for modes. A value
  outside the enum (`faction`, `alliance`, a misspelt mode) fails the parse, is reported with its
  path, and the default applies. Unknown values are not filtered out one by one, and the stored row
  is never rewritten. "Named twice equals named once" is therefore an equality test.
  *Reconciled with the 171-A3 overrule, and a judgement call:* the ★ said a bad value "rejects that
  one setting". `parseWithPartialPreserve`
  (`apps/frontend/src/lib/api/adapters/supabase/utils/parseOutcome.ts`) preserves **top-level**
  members only: an issue at any depth drops "the path's first element". With both settings inside
  `contestantApp`, one bad value in either list drops the whole stored `contestantApp` root, the
  other list and a stored `questions` included, and the shipped defaults apply to all three. That is
  the fail-closed direction (D-06: Candidate app, sign-in only) and is how every other nested member
  already behaves, so it is accepted as the default reading. Research confirms it is acceptable; if
  it is not, the alternative is to make the two members individually fault-tolerant inside the
  schema while still reporting the rejected path. A unit test pins whichever is chosen.
- **D-06 (171-A5) ⚠:** **Defaults when a project declares nothing: serves `['candidate']`; every
  registration row empty.** An undeclared project is the Candidate app with sign-in only. Admin-sent
  invitations are not a registration mode and keep working. *Reconciled with the 171-A3 overrule:*
  the defaults are members of the shipped `contestantApp` root in
  `packages/app-shared/src/settings/dynamicSettings.ts`:
  `entityTypes: ['candidate']`, `registrationModes: { candidate: [], organization: [] }`, beside
  `questions`. Both rows are present in the default so that the D-09 accessor never meets a missing
  row for a vocabulary type.
- **D-07 (171-A6):** **A mode listed for a type the project does not serve is accepted and stored,
  and ignored when reading.** The *effective* matrix has rows for served types only. The declaration
  reads back as written, and switching a type off and on does not lose its row. The rule lives in
  one accessor (D-10).
- **D-08 (171-A7):** **An empty list of served entity types is invalid.** The schema requires at
  least one type. An empty list fails the
  parse, is reported, and the default applies, with the D-05 granularity. There are three app names,
  not four; `access.contestantApp: false` remains the one way to close the app.

### B — Reading the settings

- **D-09 (171-B1) ⚠:** **A narrow anon-callable `SECURITY DEFINER` function returns the Contestant
  app's public configuration for a project, and `_getAppSettings`'s zero-rows branch merges it in.**
  It exposes exactly three values: `access.contestantApp`, the served types and the registration
  matrix. Precedent: `project_open_for_voters` in
  `apps/supabase/supabase/schema/301-auth-functions.sql`. Consequences the plan must carry:
  - The anon census in `apps/supabase/supabase/tests/database/07-rpc-security.test.sql` grows from
    five to six ("…are exactly the five allow-listed ones"), and the authenticated census beside it
    ("the same five plus get_entity_basic_data") grows with it.
  - `anon_select_app_settings` is **not** widened. `30-closed-project.test.sql` and cell 5 of
    `22-content-policies.test.sql` keep passing unchanged.
  - The `preregister` server guard reads through the anonymous client's `getAppSettings`, so it is
    fixed by the same branch with no code of its own.
  - *Reconciled with the 171-A3 overrule:* the function reads
    `settings -> 'access' -> 'contestantApp'`, `settings #> '{contestantApp,entityTypes}'` and
    `settings #> '{contestantApp,registrationModes}'`, and returns them **raw and unvalidated**
    (null where unset). The provider places them at the same nested paths and runs the result
    through `StoredSettingsSchema`, so dedup, canonical order and rejection happen in one place
    (D-02, D-05). The zero-rows branch returns
    `access: { ...dynamicSettings.access, voterApp: false, contestantApp: <stored or default> }` and
    `contestantApp: { ...dynamicSettings.contestantApp, entityTypes, registrationModes }` with unset
    members left to the default. It never returns `contestantApp.questions` from storage.
  - **Return shape:** one `jsonb` object, not fixed columns, so that a later phase can add a member
    without a second anon function and a seventh census entry. The exact member names are the
    planner's. Research checks first whether 172 (acceptance screen), 178 (login screen) or the
    `access.nominationsLocked` setting of 175-B5 / 177-B5 needs anon-readable state in a closed
    project; a signed-in grant holder already reads the whole row through
    `authenticated_select_app_settings`, so the expected answer for the lock is no.
  - The docstring of `_getAppSettings` states the closed-project limitation; it is rewritten to
    describe what is and is not honoured after this change (`access.underMaintenance` still is not).
- **D-10 (171-B2):** **The rules live as pure functions in `@openvaa/app-shared`, beside the
  settings types, with unit tests.** Four derivations: the served types; the effective matrix
  (D-07); "is any registration allowed"; and "which name key" (D-16). Plus the per-cell question
  "is mode M allowed for served type T". The frontend calls them on `appSettings`; dev-seed and the
  server routes import the same functions. The Deno functions and SQL cannot import them and restate
  the one-line membership test. *Reconciled with the 171-A3 overrule:* the functions take the
  settings (or the `contestantApp` root) and read `contestantApp.entityTypes` and
  `contestantApp.registrationModes`; no caller reads those two keys directly. The mode vocabulary
  (`identity_provider`, `email`, `code`) is new and is declared once here, in the shape
  `ENTITY_TYPE` has in `@openvaa/data`; the served-type vocabulary is the two-member subset
  `candidate`, `organization` of `ENTITY_TYPE`. Context rule: `appSettings` is a reactive accessor,
  so components read `ctx.appSettings` inside the tracking scope and never destructure it.
- **D-11 (171-B3):** **`preRegistration.enabled` is removed** from `DynamicSettings`, from
  `StoredSettingsSchema`, from the docs and from the E2E override. Every reader asks the matrix for
  `candidate × identity_provider` through the D-10 accessor. Readers today (fact 6): the login page
  twice (`isLoginShown`, the pre-registration button), the nav twice, `register/+page.svelte`
  (title), `preregister/+layout.server.ts`. No alias, no second condition. Because the schema is
  strict, a row still carrying `preRegistration` after this change has that top-level key dropped
  and reported, so the bank-auth override must change in the same phase (D-21 orders it).

### C — The login screen (SET-03)

- **D-12 (171-C1) ⚠:** **Gate today's two entries, each on its own mode.** The pre-registration
  button (`data-testid="login-preregister"`) and its nav item show when `candidate ×
  identity_provider` is in the effective matrix. The registration-code link
  (`data-testid="login-register-link"`) and its nav item show when any served type allows `code`.
  With an empty effective matrix neither is shown and the sign-in form is not collapsed.
  `isLoginShown` follows the identity-provider cell where it followed `preRegistration.enabled`.
  **Accepted residue:** a project allowing only `email` has no on-screen entry until Phase 178,
  because none exists to gate (fact 8). The single Register button and the mode selector are 178's.
  *Additional note 1:* the gates are keyed on modes through the accessor, not on route names, so
  they survive a later rename of the `preregister` tree unchanged.
- **D-13 (171-C2):** **Both registration route trees are guarded on the server by their mode**, so a
  direct URL is refused exactly when the link is hidden. `preregister/+layout.server.ts` already
  redirects to login; its condition becomes the `candidate × identity_provider` cell. The
  `register/` tree (`+layout.svelte`, `+page.svelte`, `+page.ts`, `password/`) gets the equivalent
  guard on "any served type allows `code`". Phase 178 inherits guards to move. *Additional note 1:*
  if Phase 170 or a later phase has already folded `preregister` into `register` with an
  identity-provider subroute by the time this phase is planned, the two guards attach to the
  corresponding subtrees; the rule (one guard per mode) does not change. See *Ambiguities*.
- **D-14 (171-C3):** **The setting alone decides what is offered.** An `identity_provider` cell with
  an unconfigured provider fails closed at the authorize step, as it does today
  (`requireConfigured.ts`, `authorize-fail-closed.test.ts`). No server-computed "configured" flag,
  no start-up check. The publishers' docs for the setting state that the environment must be set.

### D — The app's name (NAME-03)

- **D-15 (171-D1) ⚠:** **The three literal terms are the shipped defaults: "Candidate and party
  app", "Candidate app", "Party app", translated in all seven locales** (`da, en, et, fi, fr, lb,
  sv`). A deployment that wants a branded name overrides them. The default login heading changes
  from "Election Compass for Candidates" to "Candidate app"; every E2E assertion and visual baseline
  that pins the old phrase is re-baselined in this phase.
- **D-16 (171-D2):** **Three keys under `dynamic.contestantAppName`: `candidate`, `organization`,
  `candidateAndOrganization`.** The D-10 accessor returns which key applies: `['candidate']` →
  `candidate`, `['organization']` → `organization`, both → `candidateAndOrganization`. The keys stay
  in the `dynamic` namespace, the one deployments override through `translationOverrides`.
  `dynamic.contestantAppName` stops being a leaf message, so every reader and the generated
  `translationKey.ts` change. A unit test asserts all three keys exist in all seven locales.
- **D-17 (171-D3):** **The name follows in the five readers and in the sentences that embed it.**
  Readers: the login `<h1>`, the `PreHeading` on forgot-password, password-reset and register, and
  the help page's mail subject. Sentences rewritten to take the name as a parameter, in a form that
  needs no inflection in any of the seven locales: `dynamic.contestantAppNotAccessible.{title,content}`,
  `contestantApp.notSupported.{title,content}`, `contestantApp.help.ingress`. Texts that address the
  reader as a candidate are Phase 175's.

### E — Seeding, verification and plan shape

- **D-18 (171-E1), with X1 → (a):** **What each dataset declares** (criterion 4).
  - The `default` template (`packages/dev-seed/src/templates/default.ts`, what
    `yarn db:reset-with-data` loads): both types, every mode for both.
  - `BASE_APP_SETTINGS` (`packages/dev-seed/src/templates/e2e/base.ts`) and
    `MINIMAL_BASE_APP_SETTINGS` (`packages/dev-seed/src/templates/e2e/perm/shared.ts`): types
    `['candidate']`, `candidate: ['email', 'code']`, `organization: []`. This keeps today's login
    screen: the code link shows, the sign-in form is not collapsed.
  - The bank-auth setup's override (`tests/tests/setup/candidate/bank-auth-journey.setup.ts`,
    `appSettingsOverride`) states the full candidate row with `identity_provider` added, because a
    list is replaced, not merged.
  - Later phases widen the base as they deliver: 173 widens the types (X1 (a)), 179 the modes.
  - *Reconciled with the 171-A3 overrule:* each declaration is nested under `contestantApp`, and
    **each of the three templates writes the whole root** — `questions` (with `hideHero` and
    `hideVideo`), `entityTypes` and `registrationModes`. Today only `BASE_APP_SETTINGS` carries the
    root; `MINIMAL_BASE_APP_SETTINGS` and the `default` template do not, so both gain it.
    `packages/dev-seed/tests/templates/base-app-settings.test.ts` pins the list of top-level keys;
    under this shape that list does **not** grow (the ★ would have added two root keys), so the test
    additionally pins the members of `contestantApp`. The bank-auth override becomes
    `{ contestantApp: { registrationModes: { candidate: ['identity_provider', 'email', 'code'] } } }`,
    written through `merge_jsonb_column`, which leaves the stored root's other members in place.
    `perm-hide-hero`'s overlay `{ contestantApp: { questions: { hideHero: true } } }` composes over
    the minimal base by deep merge and needs no change beyond 170's rename.
- **D-19 (171-E2):** **`seed.sql` keeps `'{}'` for the default project.** The shipped defaults apply
  there, which is the standing exercise of the unset path; `yarn db:reset-with-data` declares both
  settings through the `default` template. *Reconciled with the 171-A3 overrule:* with the root
  nested, `'{}'` is safe only because the default root is complete (D-06) and the merge is deep
  (D-04); a unit test covers the stored-value-is-`{}` case and the stored-root-without-`questions`
  case.
- **D-20 (171-E3):** **Verification, one test per criterion at the cheapest level that proves it.**
  - *Unit* (`@openvaa/app-shared`): the schema and the accessors — repeats, one empty cell, an
    empty row, an empty matrix, an unknown value, a row for an unserved type, an empty served list,
    the three name keys; and the seven-locale key-presence test (D-16).
  - *Unit* (frontend): `mergeAppSettings` after D-04 — a stored `contestantApp` without `questions`
    keeps the default `questions`; a stored list replaces the default list.
  - *pgTAP:* the D-09 function — values for a closed project, for an open one, for a project with
    no settings row, anon and authenticated execution, and the two census counts.
  - *E2E:* one perm-style spec that re-seeds the settings and asserts the login screen with an empty
    matrix, with a mode allowed, **in a closed project**, and the app's name for each of the three
    served-type states. Re-seeding is what proves "changing the setting changes the name, with no
    code change" (fact 14). The new screen states are reached by the axe scan (standing rule).
- **D-21 (171-E4) ⚠:** **Four plans.**
  1. *Model* — the type, the shipped defaults, the schema with its dedup transform, the accessors
     and their unit tests; `preRegistration` removed from the type and the schema. *Reconciled with
     the 171-A3 overrule:* the deep `mergeAppSettings` (D-04) and its unit tests belong here, with
     the research audit of the other roots as this plan's precondition.
  2. *Database read* — the D-09 function, its grants, both census assertions, pgTAP, the regenerated
     migration and types, and the provider's zero-rows branch.
  3. *Frontend* — the three names in seven locales and their readers and embedding sentences; the
     login screen, the navigation and the two route guards.
  4. *Seeds, spec, docs and the closing run* — the three templates, the pinned key test, the
     bank-auth override, the E2E spec, the four docs pages.

  Each plan has one kind of gate (unit, pgTAP, component, E2E). **Ordering constraint the ★ text
  only implied:** plan 1 removes `preRegistration` from the strict schema while the bank-auth setup
  still writes it until plan 4. The default suite does not run that setup, but the phase is not
  closed, and no intermediate E2E run including the bank-auth projects is trusted, until plan 4 has
  landed. If the planner prefers, the override change moves into plan 1; the four-plan shape stays.
- **D-22 (171-E5):** **The closing run:** the unit suites, `yarn lint:check` (exit status read
  directly, never through a pipe), pgTAP, `yarn db:lint:sql`, the production build, and one
  `tests/scripts/e2e-run.sh` run of the default suite **plus the opt-in bank-auth projects**
  (`PLAYWRIGHT_BANK_AUTH=1`), because the bank-auth setup is the one place that switches on the
  identity-provider entry and it changes in this phase. A "did not run" counts as a failure.

### Reconciliations with the 171-A3 overrule

Every place where a ★ option's text assumed root-level keys, and what it became.

| Decision | The ★ text assumed | Now | Kind |
|---|---|---|---|
| D-04 (171-A3) | — (the overrule itself) | The frontend merge becomes deep in this phase; seeds restate the whole root too | **Judgement call — research confirms** (root-by-root audit; fallback: deep merge for `contestantApp` only) |
| D-02 (171-A1) | Server-side readers test root keys | JSON paths under `contestantApp` | Mechanical |
| D-03 (171-A2) | "a list is replaced, never unioned" under the DB merge | Same for lists; the map now also merges per key on the frontend | Mechanical |
| D-05 (171-A4) | A bad value "rejects that one setting" | The top-level member is `contestantApp`: one bad value drops the stored root, `questions` and the sibling list included | **Judgement call — research confirms** (alternative: member-level tolerance in the schema) |
| D-06 (171-A5) | Two root defaults | Two members of the shipped `contestantApp` root, both rows present | Mechanical |
| D-09 (171-B1) | The function's three values merged in as root keys | Raw nested values, placed at nested paths, parsed by the one schema; zero-rows branch builds the root over the defaults; return type `jsonb` | Mechanical for the paths; the `jsonb` return shape is a judgement call tied to the section's own open item |
| D-10 (171-B2) | Accessors read two root keys | Accessors read the `contestantApp` root; no direct reader of the raw keys | Mechanical |
| D-18 (171-E1) | Templates add two root keys; the pinned key list grows | Templates write the whole `contestantApp` root; two templates gain the root; the key-list test pins nested members instead | Mechanical |
| D-19 (171-E2) | `'{}'` exercises two root defaults | `'{}'` exercises the nested defaults through the deep merge | Mechanical |
| D-21 (171-E4) | Plan 1 has no merge work | Plan 1 carries the merge change and its audit | Mechanical |

Reconciliations with overrules in **other** phases: none changes a decision here. 170-A5 (b) changes
one API path the pre-registration flow calls (name map). 175-B5 / 177-B5 make this phase's merge and
anon read a dependency of a later setting (D-04 reason (v), D-09). Additional note 1 may move the
trees D-12 and D-13 attach to (*Ambiguities*).

### Claude's Discretion

- The names of the accessors, of the mode vocabulary constant and of the D-09 function and its
  `jsonb` members.
- Whether the deep `mergeAppSettings` delegates to `mergeSettings` or is written beside it, provided
  the nullish-skip at root level and "never mutate `target`" both hold.
- The exact inflection-free wording of the D-17 sentences in each locale.
- Where the new E2E spec sits in the perm chain and which template it re-seeds from.
- The wording of the docs pages.

</decisions>

<factual_baseline>
## Factual baseline (171-0, accepted under D-01; read at HEAD `df0cec944`, names are today's)

| # | Fact | Anchor |
|---|---|---|
| 1 | `app_settings` is one row per project with `settings jsonb NOT NULL DEFAULT '{}'::jsonb`. No CHECK or trigger reads the JSON: "The app layer is responsible for parsing/validating the settings structure." | `apps/supabase/supabase/schema/106-app-settings.sql` |
| 2 | A setting exists in three places or it is dropped: the type `DynamicSettings`, the shipped defaults `dynamicSettings`, and the strict zod `StoredSettingsSchema` with every member optional. The provider parses with `parseWithPartialPreserve`; an unknown key is removed and reported and the default applies. **Refinement:** the helper preserves *top-level* members; an issue at any depth drops the whole top-level member (→ D-05). | `packages/app-shared/src/settings/dynamicSettings.type.ts` · `dynamicSettings.ts` · `packages/app-shared/src/data/schemas/storedSettings.schema.ts` · `supabaseDataProvider.ts` `_getAppSettings` · `…/supabase/utils/parseOutcome.ts` |
| 3 | The two merges differ. The frontend's `mergeAppSettings` is `{ ...target, ...nonNull }`: a stored root replaces the shipped root whole. The database's `jsonb_recursive_merge` (behind `merge_jsonb_column`) merges objects recursively, "the patch value wins" for arrays and scalars. The question page reads `appSettings.candidateApp.questions.hideVideo` unguarded, so a stored root without `questions` throws there (→ D-04). **Confirmed on the tree.** A deep `mergeSettings` already exists in `@openvaa/app-shared`. | `apps/frontend/src/lib/utils/settings.ts` · `apps/supabase/supabase/schema/900-test-helpers.sql` · `routes/candidate/(protected)/questions/[questionId]/+page.svelte` · `packages/app-shared/src/utils/mergeSettings.ts` |
| 4 | The login screen cannot read a closed project's settings. `anon_select_app_settings` is `USING (project_open_for_voters(project_id))` and `projects.open_for_voters` defaults to `false`. On zero rows `_getAppSettings` returns the shipped `access` defaults with `voterApp: false`; its docstring states the limitation. A closed project is the normal case for this app's login screen (→ D-09). | `schema/302-rls.sql` · `schema/100-tenancy.sql` · `_getAppSettings` docstring |
| 5 | The precedent for typed columns is `projects`, which anon cannot read at all and the frontend never reads. "The editor keeps the app's face (app_settings); the admin keeps the project's shape (projects)": `project.edit_app_settings` is held by project editors, `project.edit_project_settings` by admins. | `schema/302-rls.sql` · `schema/301-auth-functions.sql` |
| 6 | `preRegistration.enabled` is optional with no shipped default and has six readers: the login page twice, `CandidateNav` twice, `register/+page.svelte`, `preregister/+layout.server.ts` (anonymous client, so fact 4 applies). Also the schema entry, `bank-auth-journey.setup.ts` and four docs pages. No dev-seed template sets it. | `git grep preRegistration` |
| 7 | Two registration entries today, one ungated. The pre-registration button (`login-preregister`) is gated on `preRegistration.enabled`. The "I have a registration code" link (`login-register-link`) is always shown, and the nav shows its register item whenever answers are unlocked. | `routes/candidate/login/+page.svelte` · `CandidateNav.svelte` |
| 8 | The code entry leads nowhere today and the email mode has no on-screen entry. `_checkRegistrationKey` throws "checkRegistrationKey is not supported by the Supabase adapter. Use invite-based registration." | `supabaseDataWriter.ts` `_checkRegistrationKey` |
| 9 | The identity-provider flow creates candidates only (`createCandidate`). `organization × identity_provider` can be declared here and cannot be honoured before Phase 179. | `apps/supabase/supabase/functions/identity-callback/candidateRecord.ts` |
| 10 | Today's name is a branded phrase: `dynamic.candidateAppName` is "Election Compass for Candidates" (and equivalents in all seven locales). Five readers; the name is also written into `dynamic.candidateAppNotAccessible.{title,content}`, `candidateApp.notSupported.{title,content}`, `candidateApp.help.ingress`. `dynamic` is the namespace deployments override. | `apps/frontend/messages/*/dynamic.json` · `git grep candidateAppName` |
| 11 | Four places hold settings: `seed.sql` (`'{}'`), the `default` template's `app_settings.fixed[0].settings`, `BASE_APP_SETTINGS`, `MINIMAL_BASE_APP_SETTINGS`. `base-app-settings.test.ts` pins the exact top-level key list. The perm family shares one settings row. **Refinements:** (i) only `BASE_APP_SETTINGS` carries the `candidateApp` root today; the minimal base and the `default` template do not. (ii) The document says the perm chain writes "by deep merge", so a template inherits what the previous one wrote. Comments on the tree say `setupFromTemplate` now does "an authoritative REPLACE of `app_settings.settings` before its own overlay" (`replaceAppSettings`), with `appSettingsOverride` then applied through `merge_jsonb_column`. Research re-verifies which holds; D-18 is safe under both because every template states the whole root. | `packages/dev-seed/src/templates/default.ts` · `e2e/base.ts` · `e2e/perm/shared.ts` · `packages/dev-seed/tests/templates/base-app-settings.test.ts` · `tests/tests/setup/shared/setupFromTemplate.ts` · `packages/dev-seed/src/supabaseAdminClient.ts` |
| 12 | The database enum `entity_type` has four members; the settings type already imports `ENTITY_TYPE` from `@openvaa/data`. No registration-mode vocabulary exists (`registration_mode` / `registrationMode`: zero hits). | `schema/000-enums.sql` · `dynamicSettings.type.ts` |
| 13 | Identity-provider configuration is environment, not settings. `getActiveProvider()` switches on `PUBLIC_IDENTITY_PROVIDER_TYPE`; secrets are server-only; a missing value fails closed at the authorize step. The anon login page cannot see whether the server is configured. | `apps/frontend/src/lib/api/utils/auth/providers/` · `.env.example` |
| 14 | No screen edits settings. Rows are written by dev-seed, by the E2E admin client (`updateAppSettings` → `merge_jsonb_column`) or by SQL. | `git grep app_settings -- apps/frontend/src` |
| 15 | A new anon-callable definer function trips a census: "the SECURITY DEFINER functions in public that anon can execute are exactly the five allow-listed ones". `project_open_for_voters` is one and is the precedent. | `apps/supabase/supabase/tests/database/07-rpc-security.test.sql` |
| 16 | Two docs pages list every setting by name and default, and two more describe `preRegistration.enabled`. The developers' page also states the merge rule ("replaces values **by top-level key**"), which D-04 changes. | `apps/docs/…/developers-guide/configuration/app-settings/+page.md` · `…/publishers-guide/app-settings/+page.md` · `…/candidate-app/bank-authentication` · `…/pre-registration-and-invitation` |

</factual_baseline>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### The phase's own contract
- `.planning/v2.16-DISCUSSION-POINTS.md` § *Phase 171* (and § *Cross-phase picture*, X1–X3, and
  § *Additional notes*) — the source of every decision here.
- `.planning/ROADMAP.md` § *Phase 171* and the v2.16 "Standing rules" paragraph.
- `.planning/REQUIREMENTS.md` — SET-01, SET-02, SET-03, NAME-03, E2E-03 (ids only; the wording may
  be mid-amendment under X3).
- `CAND-APP-PLAN.md` (repo root) — the operator's source for the three app names.
- Phase 170's CONTEXT and summary, once written — the authoritative name map.

### Settings model
- `packages/app-shared/src/settings/dynamicSettings.type.ts`, `dynamicSettings.ts`
- `packages/app-shared/src/data/schemas/storedSettings.schema.ts` and its test
- `packages/app-shared/src/utils/mergeSettings.ts` — the existing deep merge
- `apps/frontend/src/lib/utils/settings.ts` — `mergeAppSettings`, `mergeInitialAppSettings`
- `apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts` — `_getAppSettings`
- `apps/frontend/src/lib/api/adapters/supabase/utils/parseOutcome.ts` — `parseWithPartialPreserve`

### Database
- `apps/supabase/supabase/schema/106-app-settings.sql`, `301-auth-functions.sql`
  (`project_open_for_voters`), `302-rls.sql` (`anon_select_app_settings`), `900-test-helpers.sql`
- `apps/supabase/supabase/tests/database/07-rpc-security.test.sql`, `30-closed-project.test.sql`,
  `22-content-policies.test.sql`
- `.claude/skills/database/` — `Skill("database")` for the schema, RLS map and pgTAP conventions

### Seeds and E2E
- `packages/dev-seed/src/templates/default.ts`, `e2e/base.ts`, `e2e/perm/shared.ts`
- `packages/dev-seed/tests/templates/base-app-settings.test.ts`
- `tests/tests/setup/shared/setupFromTemplate.ts`, `tests/tests/setup/candidate/bank-auth-journey.setup.ts`
- `tests/README.md` § Run

### Standing project rules that bind this phase
- `CLAUDE.md` — E2E hard rule, comment hygiene, the context destructuring rule
- `.agents/code-review-checklist.md`
- `.claude/skills/components/` — `Skill("components")` for the login screen and nav edits

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `mergeSettings` (`@openvaa/app-shared`): the deep merge D-04 needs; arrays replaced via
  `structuredClone`, plain objects recursed.
- `project_open_for_voters`: the pattern for a narrow anon-callable definer function, its grants and
  its census entry.
- `ENTITY_TYPE` (`@openvaa/data`): the shape the mode vocabulary copies.
- `replaceAppSettings` / `updateAppSettings` on the dev-seed admin client: the two ways the new spec
  can re-seed settings.
- The `access: { ...dynamicSettings.access, voterApp: false }` line in `_getAppSettings`: the
  precedent for building a root over the shipped defaults in the closed-project branch.

### Established Patterns
- A setting is added in three places (fact 2) and documented in two docs pages (fact 16).
- The schema is strict per object; strictness does not descend, so each new nested object is its own
  `z.strictObject`, with a rejection test per level.
- All user-facing strings ship in seven locales under `apps/frontend/messages/<locale>/`.
- Schema changes are made in `apps/supabase/supabase/schema/*.sql`; the single migration file
  `apps/supabase/supabase/migrations/00001_initial_schema.sql` is regenerated, then `yarn db:types`
  and `yarn db:lint:sql`.

### Integration Points
- `routes/contestant/login/+page.svelte` (`isLoginShown`, the two entries), the contestant nav, the
  `register/` and `preregister/` trees and `preregister/+layout.server.ts`.
- The five readers of the name key and the three embedding sentences (D-17).
- `apps/frontend/src/lib/contexts/app/appContext.svelte.ts` — where the loaded settings are merged;
  it guards on the `data` reference, which the deep merge must not defeat.

</code_context>

<specifics>
## Specific Ideas

- The operator's names for the two settings were `contestant_app_entities` and
  `registration_modes`; the chosen keys are `contestantApp.entityTypes` and
  `contestantApp.registrationModes`.
- The three app names are literal: "Candidate and party app", "Candidate app", "Party app".
- "Whichever is chosen must deduplicate" (operator, 2026-10-04) — met at parse, proved by an
  equality unit test.

### Cannot be defined yet (from the section; status after the fill)

- **Server-side enforcement of the matrix** — still open; belongs to 174 (claim function) and 179
  (`identity-callback`). This phase delivers the declaration and the read. Note for those phases:
  174's overrule to a general grant spec does not change how the mode is read.
- **The email mode's entry point** — still open; Phase 178's screens A and C.
- **`organization × identity_provider`** — declarable here, honoured in 179.
- **Who may change these settings** — still open; a project editor can, and no settings screen is in
  this milestone.
- **The exact return shape of the D-09 function** — narrowed, not closed: a `jsonb` object, and
  research checks 172, 178 and `access.nominationsLocked` (175-B5 / 177-B5) for further
  anon-readable needs before the plan fixes its members.

### Open for research (raised by the reconciliations)

- The root-by-root audit behind the deep merge (D-04), with its fallback.
- Root-level versus member-level rejection of a bad list value (D-05).
- Whether the perm chain's settings writes replace or deep-merge today (fact 11 refinement), and so
  whether the new spec's teardown must restore the base values or must write nothing back, as the
  bank-auth teardown's comment argues.
- The command that regenerates the single migration file.

### Ambiguities found in the filled document

- **Additional note 1 names no phase** ("Change the whole preregister route to register and an e.g.
  id-provider subroute within it"). It conflicts with the 170 cross-phase note that the legacy
  `register/` and `preregister/` trees move to `contestant/` in 170 and are deleted in 178 / 179,
  and with 178-G1. D-12 and D-13 are written to be indifferent to it; the planner reads the tree as
  170 leaves it.
- **The decision count differs inside the document:** the section's own fill status says 21
  decisions, the closing table says 22. Both are right; the table counts 171-0.1.
- **Who widens the E2E base:** X1 (a) says Phase 173 widens it; the 171 → 179 cross-phase note says
  179 widens it. Read together: 173 widens the served types, 179 the modes.

</specifics>

<cross_phase>
## Cross-phase Notes (obligations)

- **170 → 171:** this phase assumes 170 renamed the settings root, `access.contestantApp`, the
  message namespaces and `dynamic.contestantAppName` (170-A6 (a), 170-A7 (a), both ★). The stack is
  restarted once after 170's allowlist change, or auth redirects to the new callback are refused.
- **Serial schema rule:** 171, 172, 173, 174, 175 and 177 each edit `schema/*.sql` and regenerate
  the single migration file. **171 ∥ 172 are independent in content; whichever executes second
  regenerates the file and the types on top of the first.**
- **171 → 173, 175:** "which entity types does this app serve" is the D-10 accessor. The
  entity-selection screen and the organization pages read it and do not re-derive it. 173 widens the
  base dataset to both types with `organization: []` and re-baselines the name (X1 (a)).
- **171 → 175, 177:** `access.nominationsLocked` (175-B5 / 177-B5 overrules) is added to the
  `access` root those phases; it relies on this phase's deep merge and, if it must be readable by
  anon in a closed project, extends the D-09 function instead of adding a second one.
- **171 → 177 (additional note 2):** the centralised predicates for filtering elections by entity
  type belong beside this phase's accessors in `@openvaa/app-shared`; nothing is built for them here.
- **171 → 178:** the two gated entries (D-12) and the two guards (D-13) are replaced by the single
  Register entry and the mode selector, which read the same accessor. 178 closes the email-only
  residue.
- **171 → 179:** `preRegistration.enabled` is gone, so REG-14 has one less setting to delete. 179
  widens the base dataset's modes when it delivers organization registration.
- **E2E:** the perm chain shares one settings row; every perm template inherits explicit values from
  `MINIMAL_BASE_APP_SETTINGS`, and the new spec leaves the row in a state the next setup can rely on
  (see the open research item on replace versus merge).

### Standing rules (ROADMAP § v2.16, inherited)

- No failing E2E test, no exemptions; a "did not run" counts as a failure. E2E-03 is a closing
  criterion of this phase.
- Every user-facing string ships in all seven locales (`da, en, et, fi, fr, lb, sv`).
- Every new or changed screen meets WCAG 2.1 AA and is reached by the axe scan.
- A criterion that says "user" or "entity" holds for candidates and for organizations unless it
  names one.
- Nothing is deployed, so the schema, the settings shape, the routes and the renamed symbols change
  in place. No alias, no back-compat shim.
- Phase 170's naming gate runs in `lint:check` and binds this phase.

</cross_phase>

<deferred>
## Deferred Ideas

- The single Register button and the mode selector — Phase 178.
- Server-side refusal of a registration whose mode is not allowed — Phases 174 and 179.
- Honouring `organization × identity_provider` — Phase 179.
- A settings-editing screen, and whether these two settings should be admin-only — Admin app, not in
  this milestone.
- A database constraint over the settings JSON (171-A1 (b)) — rejected for this phase.
- Hiding the identity-provider entry when the server is not configured (171-C3 (b)) — rejected.
- Widening the E2E base dataset to organizations — Phase 173 (X1 (a)).

</deferred>

---

*Phase: 171-project-settings-served-entity-types-registration-mode-matri*
*Context gathered: 2026-10-05*
