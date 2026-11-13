# Phase 171: Project Settings — Served Entity Types & Registration-Mode Matrix - Research

**Researched:** 2026-10-05
**Domain:** settings model (`@openvaa/app-shared` + zod), the frontend settings merge, one anon-callable Postgres function, SvelteKit route guards, Paraglide message catalogues, dev-seed templates and the Playwright perm chain
**Confidence:** HIGH for everything measured on the tree (merge audit, schema probe, SQL probe, gate inventory); MEDIUM for the six non-English app names (constructed, not reviewed by native speakers)
**Tree read:** HEAD `c74eb65ae`, branch `feat/entity-signup-multi-grant`, i.e. the tree **before Phase 170**. Every anchor below is a path plus a symbol or quoted content, never a line number, because Phase 170 rewrites most of the cited files before this phase executes. Where a name differs after 170 both are given as `today → after 170`.

**How to read the provenance tags.** `[VERIFIED: …]` = read or measured in this session (the path names the source of truth; the quote beside it is verbatim). `[CITED: …]` = taken from a decision or doc. `[ASSUMED]` = not verified; listed again in the Assumptions Log. Line ranges are deliberately omitted from in-repo citations for the reason above; the quoted content is the anchor.

<user_constraints>
## User Constraints (from CONTEXT.md)

Copied verbatim from `171-CONTEXT.md` (`<decisions>` and `<deferred>`); the only edit is that `###` headings inside the copied text are demoted to `####` so they nest here. The name map the decisions refer to is in `171-CONTEXT.md` § *Name map (stated once)*.

### Locked Decisions

Decision IDs map one-to-one onto the discussion document's Phase 171 IDs, given in parentheses.
22 decisions → D-01..D-22. Every decision is locked; only the chosen option is stated. ⚠ marks the
document's own "changes the shape of the work" flag.

#### 0 — Factual baseline

- **D-01 (171-0.1):** Accept all 16 facts of 171-0 as the phase's baseline. They are restated in
  *Factual baseline* below. Facts 3, 4, 7, 8, 9 and 10 are not in the roadmap. Two refinements found
  while spot-checking for the reconciliations are recorded beside facts 2 and 11; they refine the
  facts and do not contradict the decisions.

#### A — Storage and shape

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

#### B — Reading the settings

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

#### C — The login screen (SET-03)

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

#### D — The app's name (NAME-03)

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

#### E — Seeding, verification and plan shape

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

#### Reconciliations with the 171-A3 overrule

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

### Deferred Ideas (OUT OF SCOPE)

- The single Register button and the mode selector — Phase 178.
- Server-side refusal of a registration whose mode is not allowed — Phases 174 and 179.
- Honouring `organization × identity_provider` — Phase 179.
- A settings-editing screen, and whether these two settings should be admin-only — Admin app, not in
  this milestone.
- A database constraint over the settings JSON (171-A1 (b)) — rejected for this phase.
- Hiding the identity-provider entry when the server is not configured (171-C3 (b)) — rejected.
- Widening the E2E base dataset to organizations — Phase 173 (X1 (a)).
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description (as amended 2026-10-05) | Research support |
|----|-------------------------------------|------------------|
| SET-01 | A project declares which entity types the Contestant app serves (`contestantApp.entityTypes` over `candidate`, `organization`); a type named twice counts once | § Settings model (schema probe: repeats collapse, canonical order, empty list rejected); § D-09 function (the value reaches the anon login screen of a closed project); § Seeding |
| SET-02 | Per served type, which of `identity_provider`, `email`, `code` may be used to register (`contestantApp.registrationModes`); any cell, row or the whole matrix may be empty; a mode named twice counts once | § Settings model (all seven decision cases probed on this tree's zod); § Verdict A (lists replaced whole under both merges); § Accessors |
| SET-03 | With no mode allowed for any served type the login screen offers sign-in only | § Login screen and navigation; § Pitfall 1 (the invitation landing must not be guarded by a mode); § D-09 (holds in a closed project only through the new function) |
| NAME-03 | The UI names the app "Candidate and party app", "Candidate app" or "Party app" by served types, in seven locales | § The app's name (five readers and three sentence groups, measured; existing per-locale terms extracted from the catalogues) |
| E2E-03 (closing criterion) | Full E2E suite green at close | § E2E perm chain; § Validation Architecture; § Verification commands |

**Wording check against the amended planning record (concurrency note).** `REQUIREMENTS.md` SET-01/SET-02/SET-03/NAME-03 and `ROADMAP.md` § Phase 171 were re-read at HEAD `c74eb65ae` and agree with 171-CONTEXT.md, with **one residual difference**: the roadmap's "Discussion settled" paragraph still states the D-04 remedy as an either/or ("every writer restates the whole root … **or** the merge becomes deep in this phase"), whereas CONTEXT D-04 settles **both** (deep merge *and* restated roots). CONTEXT wins; this research confirms it (§ Verdict A).
</phase_requirements>

## Summary

The phase is small in new code and wide in touch points. The model work (type, defaults, strict zod schema with a dedup-to-canonical-order transform, five pure accessors) is mechanical and was prototyped on this tree's zod 4.6.5: every decision case in D-03, D-05, D-07 and D-08 behaves as CONTEXT says. The database work is one `LANGUAGE sql STABLE SECURITY DEFINER` function whose body was run read-only against the live local database and returns the three raw values, the same all-null object for a project with no row and for an id that names no project, and never `contestantApp.questions`.

Both judgement calls CONTEXT flagged are **confirmed, with conditions the plan must carry**. (a) A **full** deep merge is safe: across all 31 built-in templates (17 distinct settings payloads) and the five in-spec overlays, a deep merge changes the effective value of only four paths, and none changes behaviour. But the deep merge **must not delegate to `mergeSettings`**: measured on this tree, that function throws when a stored object meets a shipped `null` default (`notifications.voterApp`, which every perm dataset stores as an object), erases a default when the source carries a nested `undefined`, and throws `DataCloneError` on the Svelte `$state` proxy that `appContext`'s re-merge passes as its target. (b) Root-level rejection of a bad list value is acceptable; it is fail-closed, reported, and independent of the `access` root.

Three findings are not in CONTEXT and change plan content. **First**, the `register/password` page is the landing page of *every invitation* (the auth callback's `invite` case redirects to it), so D-13's guard "over the `register/` tree" would break admin invitations under the shipped default (empty matrix) and the identity-provider flow in any project that does not also allow `code`; both existing E2E datasets allow `code`, so the suite would stay green over the defect. **Second**, no existing axe scan reaches the login page (the candidate scan covers `(protected)` only and says so), so the standing "reached by the axe scan" rule needs a scan added by this phase. **Third**, the perm chain no longer inherits settings: `setupFromTemplate` does an authoritative REPLACE with an exact-equality assertion, so the new spec owes nothing to the next setup and every template's settings object *is* the whole stored row.

**Primary recommendation:** plan the four plans of D-21 as written, with plan 1 writing `mergeAppSettings` as its own recursive merge (not a call to `mergeSettings`) and making the accessors total on raw provider output; plan 2 adding the function beside its table plus five gate edits; plan 3 scoping the `code` guard to the registration-code leg only; plan 4 hosting the closed-project assertions on the existing terminal Playwright node.

## Project Constraints (from CLAUDE.md)

These bind the plan with the same authority as locked decisions.

- **Cardinal E2E rule.** No task completes while any E2E test fails; no "known flaky"; a "did not run" counts as a failure. Prefer the whole suite as the interim signal.
- **E2E runs go through the wrapper:** `tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/<name> --no-db-reset`. It starts Supabase and one fresh dev server scoped to the project the suite seeds. A plain `yarn dev` serves the default project and the preflight aborts a run against it.
- **Do not clear the database while an E2E run is in flight**; the suite owns its own project.
- **Comment hygiene** for every comment added or changed under `apps/`, `packages/`, `tests/`: describe the code as it is; no historical narrative; no planning references beyond `see phase N`; nothing addressed to the reviewer; concise. The gate `yarn assert:comment-hygiene` also rejects a hard-wrapped comment paragraph (write each comment paragraph on one line) and a literal `\uXXXX` escape inside a comment. [VERIFIED: `scripts/assert-comment-hygiene.mjs` header, "Rule 2 (D-A4) — the forced-line-break predicate"]
- **Context Destructuring Rule.** `appSettings` is a reactive accessor: read `ctx.appSettings` inside the tracking scope (`$derived(ctx.appSettings)` is the pattern the login page already uses), never destructure it.
- **Strict TypeScript**: no `any`; exported symbols carry TSDoc.
- **Localization**: every user-facing string in all supported locales; this milestone's standing rule names seven (`da, en, et, fi, fr, lb, sv`).
- **WCAG 2.1 AA**; every new or changed screen is reached by the axe scan.
- **Canonical package paradigm** for `packages/*`: flat top-level barrel (`packages/app-shared/src/index.ts`), no `.js` extension on TS-internal relative imports. `@openvaa/app-shared` is ESM-only.
- **Runtime resolution needs built packages**: the frontend imports `@openvaa/app-shared` from `dist`, so `yarn build` (or the `yarn dev` watcher) must run after a package edit before frontend typecheck, unit tests or E2E see it.
- **After a schema change**: `yarn db:types`, then `yarn db:lint:sql` (lints the *applied* database, so it needs the running, reset stack).
- **Never commit `.env` files or secrets.**
- **Svelte warnings**: fix at source; accept only with `// svelte-warning: accepted — <rationale>` immediately above the line.
- **Code review checklist**: `.agents/code-review-checklist.md` applies to every change.
- **Never read a gate's exit status through a pipe** (operator standing rule; D-22 restates it).

## Architectural Responsibility Map

| Capability | Primary tier | Secondary tier | Rationale |
|------------|--------------|----------------|-----------|
| Declaring served types and the mode matrix | Database / Storage (`app_settings.settings` JSON) | — | D-02: JSON in the existing column, no CHECK, no trigger, no new column |
| Typing, defaulting, validating, deduplicating | Shared package (`@openvaa/app-shared`: type, defaults, `StoredSettingsSchema`) | — | The one place the three consumers (frontend, dev-seed, server routes) import from; dedup happens at parse (D-05) |
| The rules (served types, effective matrix, "any registration", name key, per-cell) | Shared package (pure functions) | SQL / Deno restate the one-line membership test in later phases | D-10 |
| Reading the configuration for an anonymous visitor of a closed project | Database (one `SECURITY DEFINER` function) | Frontend adapter (`SupabaseDataProvider._getAppSettings`, zero-rows branch) | RLS refuses the row to anon while the project is closed; the adapter is the only caller |
| Merging stored settings over shipped defaults | Frontend (`apps/frontend/src/lib/utils/settings.ts`, `appContext.svelte.ts`) | Frontend server (the four voter loaders call the same function) | D-04 |
| Showing or hiding the two registration entries | Browser / client (login page, contestant nav) reading `ctx.appSettings` | — | D-12; SSR renders the same values because the root load runs on the server too |
| Refusing a direct URL to a registration route whose mode is off | Frontend server (`+layout.server.ts` / `+page.server.ts` under the two route trees) | — | D-13; a client-only gate would leave the URL reachable |
| The app's shown name | Browser / client via `t()` over the `dynamic` message namespace | Database (`app_settings.customization.translationOverrides` may override the three keys) | D-15, D-16 |
| Declaring both settings in dev data and E2E data | Shared package (`@openvaa/dev-seed` templates) | Database (`seed.sql` stays `'{}'`) | D-18, D-19 |

## Verdict A — D-04: a FULL deep merge is confirmed, with three conditions on how it is written

**Conclusion: full deep merge (not scoped to the `contestantApp` root, not restate-only). Lists and scalars are replaced whole. The fallback in D-04 is not needed.** The seeds restate the whole root as well, as D-04 already says.

### The callers (re-derive with `git grep -n -E "mergeAppSettings|mergeInitialAppSettings" -- apps/frontend/src`)

| Call site | Target | Source | Notes |
|-----------|--------|--------|-------|
| `appContext.svelte.ts`, field initializer `#appSettingsValue = $state<AppSettings>(mergeInitialAppSettings(staticSettings, dynamicSettings, page.data?.appSettingsData …))` | `staticSettings` ∪ `dynamicSettings` | the loader payload | runs on server and client |
| `appContext.svelte.ts`, the `$effect` holding `this.#appSettingsValue = mergeAppSettings(this.#appSettingsValue, data)` | **the previous effective value, a deep `$state` proxy** | the new loader payload | guarded by `data === this.#prevAppSettingsData`; fires on `invalidateAll` (sign-in, sign-out) |
| `routes/(voters)/(located)/+layout.ts` | `staticSettings` **only** | `await appSettingsData` (may be an `Error`) | passes the result to `getImpliedElectionIds` |
| `routes/(voters)/constituencies/+page.ts` | `staticSettings` only | same | reads `appSettings.elections?.startFromConstituencyGroup` |
| `routes/(voters)/elections/+page.ts` | `staticSettings` only | same | same |
| `routes/(voters)/nominations/+layout.ts` | `staticSettings` only | same | reads `appSettings.entities.showAllNominations` unguarded |

`mergeSettings` (the existing deep merge) has two production callers, both in `apps/frontend/src/lib/contexts/layout/layoutContext.svelte.ts` (layout overlays), and no settings caller. [VERIFIED: `git grep -n mergeSettings -- apps packages`]

### The measurement

A throwaway script (session scratchpad, not in the repo) computed, for the settings object of every entry in `BUILT_IN_TEMPLATES` and for each in-spec overlay applied with the database's merge semantics, the effective settings under today's replace-by-root and under a deep merge, over both targets (`static ∪ dynamic` and `static` only), and diffed them. Result: **31 templates, 17 distinct payloads; `default`, `e2e/base` and the `'{}'` row are identical under both merges; the voter-loader target is identical for every payload; and the `static ∪ dynamic` target differs on exactly these paths:** [VERIFIED: script output, this session]

| Path | Replace-by-root | Deep | Where | Behavioural effect |
|------|-----------------|------|-------|--------------------|
| `entityDetails.contents.alliance` | `undefined` | `["info","children"]` | every payload derived from `MINIMAL_BASE_APP_SETTINGS` | none: `EntityDetails.svelte` falls back to exactly `['info', 'children']` when the entry is missing ("`if (!tabs?.length) tabs = nakedEntity.type === 'alliance' ? ['info', 'children'] : …`") |
| `results.cardContents.alliance` | `undefined` | `["children"]` | same | none in these datasets: `results.sections` is a list (`['candidate','organization']`, replaced whole) and no perm template seeds an alliance |
| `questions.interactiveInfo` | `undefined` | `{"enabled":false}` | same, except `perm-interactive-info` | none: both falsy |
| `candidateApp.questions.hideVideo` → `contestantApp.…` | `undefined` | `false` | `perm-hide-hero` | none: both falsy |
| `candidateApp.questions.hideHero` → `contestantApp.…` | `undefined` | `false` | `perm-question-video` after its in-spec `updateAppSettings({ candidateApp: { questions: { hideVideo: true } } })` | none: both falsy |

In-spec overlays checked: `perm-startfromcg` (`elections.startFromConstituencyGroup`), `perm-question-video`, `perm-show-feedback-survey` (`survey.showIn`, a list), `perm-access-disable` (`access`), the bank-auth override. No spec or setup sets a root expecting a shipped sibling to vanish. Re-derive the overlay population with `git grep -n -E "updateAppSettings\(|appSettingsOverride" -- tests/tests`.

### Root by root: does anything rely on replace-whole to REMOVE a shipped member?

| Root | Shipped members a stored object could "remove" by omission | Reliance found |
|------|-----------------------------------------------------------|----------------|
| `results` | `showFeedbackPopup: 180`, `showSurveyPopup: 500`, `cardContents.alliance` | None. Every template states both popups (`0` in the minimal base, `180`/`500` in base and default). **Semantic change to document:** omission no longer switches the feedback popup off; `0` does (`startFeedbackPopupCountdown`: "`if (delay <= 0) return;`") |
| `entityDetails` | `contents.alliance`, the per-type rows of `showMissingElectionSymbol` / `showMissingAnswers` | None; every template states both rows; alliance contents are inert (above) |
| `questions` | `categoryIntros`, `interactiveInfo`, `showResultsLink` | None; the minimal base states `categoryIntros` and `showResultsLink` |
| `analytics` (a **static** root the stored schema admits) | shipped static value is `{ trackEvents: false }` with no `platform` | Nothing to remove. Deep is strictly safer: a stored `{ trackEvents: true }` no longer discards a build-time `platform` |
| `notifications` | both shipped as `null` | None, but see condition 1 below |
| `access` | all five members shipped | None. No template stores a partial `access`; in-spec writes go through the database's deep merge, so the stored root stays whole |
| `elections` | `startFromConstituencyGroup` ships `undefined` | n/a |
| `header`, `headerStyle`, `entities`, `matching` | — | None (stated in full, or the root is absent) |
| `survey` | no shipped default | n/a; an absent root still means no survey |
| `candidateApp` → `contestantApp` | `questions` | This is the hazard D-04 removes |

### The three conditions

**1. Do not delegate to `mergeSettings`. Write the recursive merge in `settings.ts`.** Three failures, each reproduced on this tree: [VERIFIED: node probes against `packages/app-shared/dist`, this session]

| Probe | Result |
|-------|--------|
| `mergeSettings({ notifications: { voterApp: null } }, { notifications: { voterApp: { show: false } } })` | `TypeError: Cannot set properties of null (setting 'show')`. The shipped defaults are `notifications: { candidateApp: null, voterApp: null }` and the minimal base stores `{ voterApp: { show: false }, candidateApp: { show: false } }`, so this would throw on every perm dataset |
| `mergeSettings({ candidateApp: { questions: {…} } }, { candidateApp: { questions: undefined, entityTypes: undefined } })` | returns `candidateApp: {}`: a nested `undefined` in the source erases the default |
| `mergeSettings(<Svelte 5 $state proxy holding an array>, { access: { voterApp: false } })` | `DataCloneError: [object Array] could not be cloned` (`structuredClone` rejects a proxy). The `$effect` re-merge passes exactly such a proxy as its target (Svelte 5.57.1) |

The rule the new `mergeAppSettings` must implement:

- root level: skip a source member whose value is `null` or `undefined` (kept from today);
- nested: skip `undefined`; let `null` replace (the schema admits `null` only at `notifications.*`, where it means "no notification");
- recurse **only when both sides are plain objects**; in every other pairing (array, scalar, `null`, or a missing target) the source value replaces the target value whole;
- never mutate `target`; return fresh objects along the merged paths and share untouched subtrees by reference; no `structuredClone`;
- tolerate a source with no own enumerable members (an `Error` reaches the voter loaders through `.catch((e) => e)` and merges as nothing, as today).

`deepMerge` in `packages/dev-seed/src/templates/_helpers/buildMinimal.ts` is the house example of this exact shape (it skips `undefined`, recurses only on plain-object pairs, replaces arrays).

**2. Change the `$effect` re-merge to recompute from the base, not to accumulate.** `mergeAppSettings(this.#appSettingsValue, data)` keeps whatever the previous payload set and the new one omits. Under replace-by-root that staleness is per root; under a deep merge it becomes per member, and D-09 makes the two payloads of one session differ on purpose: an anonymous visitor of a closed project receives `access: { …, voterApp: false }`, and after sign-in the same context receives the stored row, which need not state `access.voterApp`. Use `mergeInitialAppSettings(staticSettings, dynamicSettings, data)` in the effect, keep the `data === this.#prevAppSettingsData` guard and the early return on `Error` as they are. This also keeps the proxy out of the merge target. *Recommendation, not a locked decision; if the planner declines it, condition 1's "no `structuredClone`" still has to hold and a unit test must cover a closed-then-signed-in sequence.*

**3. Correct every statement of the old rule in the same plan** (a comment describes the code as it is). Re-derive with:

```bash
git grep -n -i -E "root key|by top-level key|shallow|replaces the whole|whole .?access.? object" -- apps packages tests ':!tests/e2e-runs'
```

Today that finds, among unrelated hits: the TSDoc and `TODO` of `mergeAppSettings`; the header of `settings.test.ts` ("a shallow root-key merge"); the comment above `#appSettingsValue` in `appContext.svelte.ts` ("NB! Settings are overwritten by root key." plus the `TODO`); two comments in `supabaseDataProvider.ts` and one in its test ("The whole `access` object, because …"); the TSDoc of `mergeSettings` ("a separate, SHALLOW merge"); the comment in `packages/dev-seed/src/templates/default.ts` ("shallow-merges by root key … REPLACES the whole `results` object"); the developers' docs page ("replaces values **by top-level key**"); **and the publishers' docs page**, which CONTEXT fact 16 does not list: "A stored setting replaces the whole top-level group it belongs to." [VERIFIED: grep output, this session]

### Noticed, not this phase's to fix

The four voter loaders merge `staticSettings` with the stored row and **not** with `dynamicSettings`, so on a stored `'{}'` (the default project after `yarn db:reset`) `appSettings.entities` is `undefined` and `(voters)/nominations/+layout.ts` throws on `appSettings.entities.showAllNominations`. The `default` template's own comment records it ("route loaders that merge `staticSettings` + `appSettingsData` end up with `entities === undefined` and throw"). The deep merge neither fixes nor worsens it. The planner may file it; it is out of scope here.

## Verdict B — D-05: root-level rejection is acceptable; member-level tolerance is not needed

`parseWithPartialPreserve` drops "the path's first element" for any issue with a non-empty path, so one bad value in either list drops the stored `contestantApp` root. What reads that root, and what each reader then sees:

| Reader | Sees after the drop | Direction |
|--------|---------------------|-----------|
| `routes/…/(protected)/questions/[questionId]/+page.svelte` (`hideVideo`, `hideHero`; the only readers today, `git grep -n -E "appSettings\.(candidate|contestant)App" -- apps/frontend/src`) | shipped `false`/`false`: hero and video shown | cosmetic |
| served types (the D-10 accessor) | `['candidate']`: the app names itself "Candidate app" | fail-closed |
| the matrix | every row empty: sign-in only, both route guards refuse | fail-closed |
| `access.contestantApp` | **unaffected**: it lives under the `access` root, which is preserved independently | — |

Why this is acceptable: (i) it is the granularity every other root already has, so no reader has to learn a second rule; (ii) the failure is reported once at `error` level with the offending path (`contestantApp.entityTypes.0`, `contestantApp.registrationModes.candidate.0`, measured below) and never the value; (iii) admin invitations are not a registration mode and keep working (D-06), provided Pitfall 1 is handled; (iv) member-level tolerance would need either `.catch()` on the two members, which swallows the issue so nothing is reported, or a hand-written pre-parse, which is a second validation path for two members of one object; (v) nothing is deployed, and the only writers are templates and hand-written SQL.

**Two things the plan should add because of this verdict.** A unit test that pins the root-level drop (a stored root with one bad mode and `questions.hideHero: true` reads back with the shipped `questions` and both shipped lists, and one failure record naming the path). And a dev-seed unit test that parses the `contestantApp` member of every built-in template's settings through the schema: templates are not validated against `StoredSettingsSchema` anywhere today (`git grep -n StoredSettingsSchema -- packages/dev-seed` finds nothing), so a typo in a template would otherwise surface only as a silently defaulted login screen in an E2E run.

## Settings model (plan 1)

### Schema: probed on this tree's zod

A skeleton of the two members was run against every decision case with zod 4.6.5 (the version `packages/app-shared` resolves): [VERIFIED: node probe, this session]

| Input (`contestantApp` member) | Outcome |
|--------------------------------|---------|
| `entityTypes: ['organization','candidate','candidate']`, `registrationModes: { candidate: ['code','email','code'], organization: [] }` | OK → `["candidate","organization"]`, `{ candidate: ["email","code"], organization: [] }` |
| `registrationModes: {}` (wholly empty matrix) | OK → `{}` |
| `registrationModes: { candidate: [] }` (one empty row) | OK → as declared |
| `entityTypes: ['candidate']`, `registrationModes: { organization: ['email'] }` (row for an unserved type) | OK → stored as declared (D-07: ignored on read by the accessor) |
| `entityTypes: []` | FAIL `too_small` at `contestantApp.entityTypes` |
| `entityTypes: ['faction']` | FAIL `invalid_value` at `contestantApp.entityTypes.0` |
| `registrationModes: { candidate: ['sms'] }` | FAIL `invalid_value` at `contestantApp.registrationModes.candidate.0` |
| `registrationModes: { faction: ['email'] }` | FAIL `unrecognized_keys` at `contestantApp.registrationModes` |
| a member set to `null` | FAIL `invalid_type` (this is why the D-09 branch must drop null members before parsing) |

```typescript
// Shape that produced the table above. The vocabulary values are the ones D-05 and D-16 fix; names are the planner's.
const SERVED_TYPES = ['candidate', 'organization'] as const;
const MODES = ['identity_provider', 'email', 'code'] as const;
const modeList = z.array(z.enum(MODES)).transform((list) => MODES.filter((mode) => list.includes(mode)));

contestantApp: z
  .strictObject({
    questions: z.strictObject({ hideVideo: z.boolean().optional(), hideHero: z.boolean().optional() }).optional(),
    entityTypes: z
      .array(z.enum(SERVED_TYPES))
      .min(1)
      .transform((list) => SERVED_TYPES.filter((type) => list.includes(type)))
      .optional(),
    registrationModes: z.strictObject({ candidate: modeList.optional(), organization: modeList.optional() }).optional()
  })
  .optional();
```

Things the schema edit drags with it:

- `registrationModes` is a second nested `z.strictObject`, so by the file's own rule ("Strict at EVERY level … `storedSettings.schema.test.ts` holds one rejection case per level") it needs its own unknown-key rejection case.
- The existing case "accepts the package's own shipped `dynamicSettings` as a representative full payload" (`StoredSettingsSchema.safeParse(dynamicSettings)`) must keep passing with the new defaults in place; it does with the skeleton above.
- Removing `preRegistration` from the strict schema makes a row that still carries it report `unrecognized_keys` and lose **only that key** (an empty-path `unrecognized_keys` issue drops just the named top-level members). The only writer is the bank-auth setup's override (D-21's ordering constraint).
- The schema's docblock quotes the nesting depth with the old root name ("three levels deep at `settings` -> `notifications` -> `candidateApp`"); Phase 170 renames it, and this phase adds a fourth-level object under `contestantApp`, so the sentence is re-measured rather than patched.
- `app-shared` imports `@openvaa/data` **type-only** in every file today (`git grep -n "from '@openvaa/data'" -- packages/app-shared/src`). Keep it that way: declare the two vocabularies as literal tuples in `app-shared` and tie the served-type tuple to `EntityType` with `satisfies`, so no runtime dependency on `@openvaa/data` enters the schema module.

### Defaults and type

`dynamicSettings.contestantApp` gains `entityTypes: ['candidate']` and `registrationModes: { candidate: [], organization: [] }` beside `questions` (D-06). Today's object, for the diff: [VERIFIED: `packages/app-shared/src/settings/dynamicSettings.ts` § `candidateApp`]

```typescript
  candidateApp: {
    questions: {
      hideHero: false,
      hideVideo: false
    }
  }
```

In `DynamicSettings` the two members are required (so `appSettings.contestantApp.entityTypes` needs no guard after the merge); `preRegistration` is deleted from the type.

### Accessors: make them total on raw provider output

D-10 names five questions. One design point decides whether the server guards need extra code: the two route guards read `dataProvider.getAppSettings()` **directly**, and that value is the stored deep partial, not the merged settings (see `preregister/+layout.server.ts`: "`Boolean(appSettings.preRegistration?.enabled)`" on the raw result, with `{}` substituted on error). So write the accessors against an input in which the root, each list and each row may be absent, and fall back member by member to the shipped defaults inside the accessor. Then the merged `ctx.appSettings`, the raw provider output and `{}` all work, and "provider failed" resolves to the default (no mode, redirect) with no second code path.

| Accessor (name is the planner's) | Returns | Rule |
|----------------------------------|---------|------|
| served types | `Array<'candidate' \| 'organization'>` in canonical order, never empty | stored list or `['candidate']` |
| effective matrix | rows for served types only | D-07 |
| is mode M allowed for type T | boolean | T is served and M is in T's row |
| is any registration allowed | boolean | some served row is non-empty |
| name key | `'candidate' \| 'organization' \| 'candidateAndOrganization'` | D-16 |

The login page and nav also need "does any served type allow `code`", which is the per-cell question over the served types; expose it rather than have two components spell the loop.

## The anon-callable function (plan 2, D-09)

### What sibling phases need from it: nothing more

- **172** (terms of use): its acceptance row is per user and signed-in; 172-CONTEXT states "`anon` gets nothing" and "The `07-rpc-security` census does not move, because no function is added." [VERIFIED: `.planning/phases/172-terms-of-use-per-user-and-project/172-CONTEXT.md`]
- **173**: "the `07-rpc-security` definer census does not move." [VERIFIED: 173-CONTEXT.md]
- **175 / 177** (`access.nominationsLocked`): read by signed-in grant holders, who read the whole row through `authenticated_select_app_settings`. No anon need. [CITED: 171-CONTEXT.md D-09]
- **178** (login screen): needs the served types and the matrix, which are the three values.

So the member set is exactly D-09's three. **One gap to put before the operator, not to close silently:** the anonymous login page also reads `access.answersLocked` (through `#answersLocked = $derived(!!this.#appSettings.access.answersLocked)` in the contestant context) to hide the pre-registration entry, to show the "answers locked" notice, and, in the nav, to hide both registration items. In a closed project that stays at its shipped `false` after this phase, exactly as `access.underMaintenance` does. D-09 says "exactly three values" and names only `underMaintenance` as still not honoured; the rewritten docstring must name `answersLocked` too, and the `jsonb` return shape leaves room to add it later without a seventh census entry. See Open Questions.

### Body, verified read-only

Run as an ad hoc `SELECT` inside `BEGIN READ ONLY … ROLLBACK` against the local database (PostgreSQL 17.6), with literals standing in for stored rows: [VERIFIED: psql output, this session; the `CREATE FUNCTION` itself was not executed]

| Stored `settings` | Returned |
|-------------------|----------|
| no row / `{}` / an id that names no project | `{"access": {"contestantApp": null}, "contestantApp": {"entityTypes": null, "registrationModes": null}}` |
| `access.contestantApp: false`, `questions.hideHero: true`, both lists declared with repeats | `{"access": {"contestantApp": false}, "contestantApp": {"entityTypes": ["organization","candidate","candidate"], "registrationModes": {"candidate": ["code","email"], "organization": []}}}` (raw, un-deduplicated, no `questions`) |

```sql
-- Skeleton. Member names mirror the storage paths, so the provider needs no key mapping and a later member is added at its own path.
CREATE OR REPLACE FUNCTION public.contestant_app_public_config (p_project_id uuid) RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER
SET
  search_path = '' AS $$
  SELECT jsonb_build_object(
    'access', jsonb_build_object('contestantApp', v.settings #> '{access,contestantApp}'),
    'contestantApp', jsonb_build_object(
      'entityTypes', v.settings #> '{contestantApp,entityTypes}',
      'registrationModes', v.settings #> '{contestantApp,registrationModes}'
    )
  )
  FROM (SELECT (SELECT s.settings FROM public.app_settings s WHERE s.project_id = p_project_id) AS settings) v;
$$;

GRANT
EXECUTE ON FUNCTION public.contestant_app_public_config (uuid) TO anon,
authenticated;
```

Conventions it follows, each from the tree: `SECURITY DEFINER` with `search_path = ''` and schema-qualified names ("New SECURITY DEFINER functions use schema-qualified calls and set `search_path = ''`", `.claude/skills/database/SKILL.md`); the explicit grant to both API roles "declared here rather than inherited from default privileges" (the comment under `project_open_for_voters`); one row for every input, so a missing project and a project with no settings are indistinguishable (the property `30-closed-project.test.sql` asserts for the precedent: "the function is no existence oracle"). `authenticated` needs the right too: a signed-in caller holding no grant, or whose token predates their grant, reads zero rows and takes the same branch (`30-closed-project.test.sql`: "a signed-in caller with no grants reads no app_settings of the closed project B").

**Where it lives.** Recommended: `apps/supabase/supabase/schema/106-app-settings.sql`, beside the table it reads (a `LANGUAGE sql` body needs the table to exist, and 106 is the table's file; Phase 172 does not touch 106). The header comment of `301-auth-functions.sql` enumerates what stays in `public` ("What stays in `public`: `user_can` … `project_open_for_voters` (the frontend calls it); and the two storage path helpers …"), so that sentence gains the new function wherever the function lives.

**Why `jsonb` and not `RETURNS TABLE`** (beyond D-09's own reason): `scripts/assert-rpc-return-nullability.mjs` harvests every `RETURNS TABLE` function and requires a hand-written disposition row per output column in `packages/supabase-types/RPC-NULLABILITY.md`. A `jsonb` return is outside that gate. [VERIFIED: the script's header, "Check 1 … every harvested column also has a hand-written disposition row"]

### Gates and files this one function touches

| What | Edit | Evidence |
|------|------|----------|
| anon census | the expected string `'project_open_for_voters,storage_path_can,storage_path_is_public,user_can,user_has_account_grant'` gains the new name **in `proname` sort order**, and the description "…are exactly the five allow-listed ones" says six | [VERIFIED: `apps/supabase/supabase/tests/database/07-rpc-security.test.sql`, Section 8c] |
| authenticated census | `'get_entity_basic_data,project_open_for_voters,storage_path_can,storage_path_is_public,user_can,user_has_account_grant'` likewise; "the same five plus get_entity_basic_data" says six | same |
| `07`'s `plan (39)` | unchanged: the two assertions change their expected text, their count does not | same file |
| project-scoping gate | add the function to `PROJECT_SCOPED_RPCS` with the disposition `'requires p_project_id'`, and call it with a `p_project_id` key | [VERIFIED: `scripts/assert-project-scoped-queries.mjs` § `PROJECT_SCOPED_RPCS`: "`project_open_for_voters: 'requires p_project_id',`"; Check 4: "An rpc dispositioned `requires p_project_id` must be called with a `p_project_id` key"] |
| adapter-cast gate | the `Json` the RPC returns must reach the schema through narrowing, never through `as Json as unknown as …` or `as Partial<DynamicSettings>` | [VERIFIED: `scripts/assert-adapter-casts.mjs` header, Checks 1 and 2] |
| generated migration | `yarn schema:regenerate`, reviewed as a diff in the same commit as the `schema/` edit | [VERIFIED: `scripts/assert-schema-migration-parity.mjs` header, "D-17 — THE REVIEW OBLIGATION"] |
| generated types | `yarn db:types` after a reset; expect one new entry under `Functions` with `Returns: Json` | [VERIFIED: `packages/supabase-types/package.json` § `generate`] |
| agent docs and docs site | the function table in `.claude/skills/database/schema-reference.md`, the helper table in `rls-policy-map.md`, the census sentence in `SKILL.md`; `apps/docs/…/developers-guide/configuration/app-settings/+page.md` ("**No row.** … for a closed project it returns the default `access` settings with `voterApp` set to `false`") | `git grep -n project_open_for_voters -- .claude/skills apps/docs` |

`yarn db:lint:sql` is unaffected in kind: `supabase db lint` runs plpgsql_check (a `LANGUAGE sql` function is outside it) and check 9001 in `lint-schema.mjs` partitions **policies**; no policy reaches the new function.

### The provider's zero-rows branch

`_getAppSettings` today, when no row is readable: asks `project_open_for_voters`; `true` → `{}`; `false` → `{ access: { ...dynamicSettings.access, voterApp: false } }`. After this phase the `false` arm also calls the new function and returns `access` and `contestantApp` built over the shipped defaults. Requirements on the implementation:

1. **Drop `null` members before the parse.** The function returns `null` where unset and the schema's members are `.optional()`, not `.nullable()` (probed: `invalid_type`). Parsing the raw object would emit one `error` record per closed-project request.
2. **Parse through `parseWithPartialPreserve(StoredSettingsSchema, …)`** so dedup, canonical order and rejection happen where they happen for a readable row. Granularity is then per root: a bad list drops `contestantApp` and keeps `access.contestantApp`.
3. **`voterApp: false` must survive**: spread the parsed `access` *under* it, not over it.
4. **Never copy `contestantApp.questions` from the function** (it does not return it).
5. **Error posture:** follow the existing arm: an RPC error throws `getAppSettings: <message>`. The root load already catches (`.catch((e) => e)`), and the `preregister` guard already degrades a thrown read to `{}` and redirects.
6. The docstring's "Limitation" paragraph is rewritten to say what is honoured (`access.contestantApp`, the served types, the matrix) and what is not (`access.underMaintenance`, `access.answersLocked`, everything else).

The provider's unit file already has the harness for this (`mockSupabase._mockRpcResponses[…]`) and five cases on this branch (`describe('getAppSettings')` in `supabaseDataProvider.test.ts`); the case "returns the voter app as inaccessible when zero settings rows come back and the project is not open for voters" must gain a mocked response for the new function or it will throw.

**Server or client?** Both, with no extra code. The root `+layout.ts` is a universal load: it runs on the server for the first render and in the browser on client navigations and invalidations, each time through the same adapter, whose `this.projectId` comes from `PUBLIC_PROJECT_ID`. The `preregister` and `register` server guards build their own anonymous client (`createDataProvider({ fetch, client: createSupabaseAnonClient({ fetch }) })`) and reach the same branch.

### pgTAP

Put the behaviour in a **new file** (do not add to `30-closed-project.test.sql`, whose `plan (20)` and sections other files reference, nor to `25-matrix-conformance.test.sql`, "whose failing assertion numbers are recorded positionally"). Choose the number when the plan runs (`ls apps/supabase/supabase/tests/database | tail -3`; Phase 172 also adds one file) and name it for its content. Fixture facts it can lean on: `create_test_data()` makes project A open and project B closed and gives each a settings row (`'{"theme":"light"}'` / `'{"theme":"dark"}'`); writes inside the test's transaction are done as `postgres` after `reset_role ()`. [VERIFIED: `apps/supabase/supabase/tests/database/00-helpers.test.sql` § "===== App settings ====="]

Assertions that are non-vacuous: both `has_function_privilege` rights; anon reads the three declared values of closed project B after the test writes them; the same call on open project A; B's row deleted → the all-null object; a random uuid → the same all-null object; a stored `contestantApp.questions` and an unrelated root are **absent** from the answer; `authenticated` with no grants gets the same answer as anon. `anon_select_app_settings` is untouched, so `16-anon-visibility` Section 5, `30-closed-project` and cell 5 of `22-content-policies` are the regression net and need no edit.

## Login screen, navigation and the two guards (plan 3)

### Readers of `preRegistration.enabled` (re-derive: `git grep -n preRegistration -- apps packages tests ':!tests/e2e-runs'`)

| File (today → after 170) | Occurrences | Becomes |
|--------------------------|-------------|---------|
| `routes/candidate/login/+page.svelte` → `routes/contestant/…` | `isLoginShown` ("`!appSettings.preRegistration?.enabled`"); the button block ("`{#if !answersLocked && appSettings.preRegistration?.enabled}`"); the `@component` docblock's Settings list | the `candidate × identity_provider` cell |
| `dynamic-components/navigation/candidate/CandidateNav.svelte` → `…/contestant/ContestantNav.svelte` | the pre-registration item; the register item's text | the cell; the register item itself gains a "some served type allows `code`" condition |
| `routes/candidate/register/+page.svelte` | the `MainContent` title | the cell |
| `routes/candidate/preregister/+layout.server.ts` | the guard and its comment | the cell, through the accessor |
| `packages/app-shared/src/settings/dynamicSettings.type.ts`, `…/schemas/storedSettings.schema.ts` | type member and schema member | deleted |
| `tests/tests/setup/candidate/bank-auth-journey.setup.ts` (+ comment in its teardown), `tests/tests/setup/shared/setupFromTemplate.ts` (two comments) | the override and prose | the D-18 override; comments restated |
| four docs pages | see § Docs | rewritten |

Today's two entries, for the diff: the code link `data-testid="login-register-link"` is rendered unconditionally; the pre-registration button `data-testid="login-preregister"` is inside the block quoted above; `data-testid="login-show"` is the collapsed-form button. None of the three is in `tests/tests/utils/testIds.ts` and no spec reads them (`git grep -n -E "login-(register-link|preregister|show)" -- tests/tests` finds nothing), so the new spec adds them to `testIds`.

### Pitfall 1 belongs here: scope the `code` guard to the registration-code leg

See § Common Pitfalls, Pitfall 1. The guard D-13 asks for on the `register/` tree must leave the invitation leg of `register/password` reachable under every matrix.

### Guard mechanics

`preregister/+layout.server.ts` is the pattern: an anonymous client, `getAppSettings()` with a logged, fail-closed catch, a `303` to the login route built with `buildRoute`. The `register/` tree has no server file today. Route server files may not touch Supabase directly (the comment in the `preregister` guard: "this route does not touch Supabase itself (REVIEW-ADP-06) … which the ESLint guard now enforces at this path"), so the new guard goes through the DataProvider as well.

**`ssr = false` changes how the refusal is delivered on one page.** `register/+page.ts` sets `export const ssr = false`. For such a page SvelteKit 2.70.3 answers the document request with a shell and runs no load on that request: "renders an empty 'shell' page if SSR is turned off … As a result, the load functions and rendering only occur client-side", and the shell is built "without running load functions". [VERIFIED: `node_modules/@sveltejs/kit/src/runtime/server/page/index.js`, the `if (ssr === false && …)` branch] A server `load` under `register/` is therefore still executed on the server, but in answer to the client's data request, and its `redirect` is followed by the client router. The guard holds (the page never renders with data), but the document response for `…/register` is a 200 shell, not a 303. Two consequences: the E2E assertion waits for the login URL instead of expecting a redirect status, and `register/password` (no `ssr` option, so server-rendered) does get a real 303.

## The app's name (plan 3, NAME-03)

### Mechanism

- Messages live in `apps/frontend/messages/<locale>/<namespace>.json`; each file's single top-level key is its namespace; `apps/frontend/project.inlang/settings.json` lists the files Paraglide compiles (`"locales": ["en", "fi", "sv", "da", "et", "fr", "lb"]`, `baseLocale` `en`).
- `t(key, params)` (`apps/frontend/src/lib/i18n/wrapper.ts`) checks runtime overrides first (`translationOverrides` from `app_settings.customization`, flattened to dotted keys by `setOverrides`), then the compiled Paraglide message.
- `key` is typed by the generated union in `apps/frontend/src/lib/types/generated/translationKey.ts`; regenerate with `yarn workspace @openvaa/frontend generate:translation-key-type`. A template literal over the three-member name key (`` `dynamic.contestantAppName.${nameKey}` ``) typechecks as a union of three members once the catalogue holds them.
- Parameters use the inlang simple-variable form, e.g. the existing `"…{appName} - Candidate Information System…"` passed as `t('…registryStatement.content', { appName: t('dynamic.appName') })`.

Two standing unit tests already do most of D-16's "all three keys in all seven locales": `apps/frontend/src/lib/i18n/tests/translations.test.ts` asserts that every locale has the same message keys as `en` ("`'%s' has same message keys as 'en'`") and that "the generated TranslationKey union matches the base-locale message keys". A dedicated test naming the three keys is still worth its four lines, because those two would also pass if all seven locales dropped a key together.

**Consequence for deployments:** `dynamic.contestantAppName` stops being a leaf, so an override stored at the old key resolves to a key no reader asks for and is silently ignored. Nothing is deployed; the publishers' page should say that the three keys are what to override.

### Every surface that prints the name (re-derive: `git grep -n -E "(candidate|contestant)AppName" -- apps packages tests ':!tests/e2e-runs' ':!apps/frontend/messages'`)

| Reader (today's path) | How |
|-----------------------|-----|
| `routes/candidate/login/+page.svelte` | the `<h1>` (unless the "password set" message replaces it) |
| `routes/candidate/forgot-password/+page.svelte` | `PreHeading` |
| `routes/candidate/password-reset/+page.svelte` | `PreHeading` |
| `routes/candidate/register/+page.svelte` | `PreHeading` |
| `routes/candidate/help/+page.svelte` | the mail subject: `` `${t('candidateApp.help.supportEmailSubject')}: ${t('dynamic.candidateAppName')}` `` |

Sentences that embed the old name in their own text (measured in `en`: `grep -rn -i -E "candidate app|candidate application|compass for candidates" apps/frontend/messages/en/` returns exactly these): `dynamic.candidateAppNotAccessible.{title,content}`, `candidateApp.notSupported.{title,content}`, `candidateApp.help.ingress`. That matches D-17's list. The first two groups are rendered by `routes/candidate/+layout.svelte`, which reads the **app** context (`getAppContext()`), so the name key is derived there from `ctx.appSettings`, not from the contestant context.

Not in D-17 and not proposed: the document `<title>` on every contestant page is `{title} – {t('dynamic.appName')}` (`MainContent.svelte`, `SingleCardContent.svelte`), i.e. the voter-facing product name ("Election Compass"), which is not one of the three terms and is not derived from served types.

### No assertion or baseline pins the old phrase

`git grep -n -i -E "Election Compass for Candidates|candidateAppName" -- tests/tests` returns nothing, and the four visual baselines are `candidate-preview-{desktop,mobile}.png` and `voter-results-{desktop,mobile}.png`, none of which is one of the five readers. So D-15's "every E2E assertion and visual baseline that pins the old phrase is re-baselined" has an **empty population on today's tree**; the plan should state the command and its expected empty result rather than schedule a re-baseline. [VERIFIED: grep and `find tests -name "*.png" -path "*__screenshots__*"`, this session]

### Terms per locale

Each catalogue already has a term for "the candidate application" (in `candidateApp.notSupported.title`) and for candidate / party (`common.candidate`, `common.organization`). The middle column is read from the catalogues; the two outer columns are constructed from it. [VERIFIED for the middle column and the nouns: catalogue read, this session. ASSUMED for the constructed forms: A1]

| Locale | Candidate and party app | Candidate app (existing term) | Party app |
|--------|-------------------------|-------------------------------|-----------|
| en | Candidate and party app | Candidate app ("Candidate Application") | Party app |
| fi | Ehdokkaiden ja puolueiden sovellus | Ehdokkaiden sovellus | Puolueiden sovellus |
| sv | Kandidat- och partiappen | Kandidatappen | Partiappen |
| da | Kandidat- og partimodul | Kandidatmodul | Partimodul |
| et | Kandidaatide ja erakondade rakendus | Kandidaatide rakendus | Erakondade rakendus |
| fr | Application candidat·es et partis | Application candidat·es | Application partis |
| lb | Kandidat*innen- a Parteien-Applikatioun | Kandidat*inne-Applikatioun | Parteien-Applikatioun |

The English terms are the operator's literal strings (D-15). For the embedding sentences, the inflection-free construction D-17 asks for is the name in subject position or after a colon: today's Finnish and Estonian sentences inflect it ("Ehdokkaiden vaalikone**tta** ei ole vielä julkaistu", "Kandidaatide valimiskompass**i** ei ole veel avaldatud") and Danish and Luxembourgish attach an article ("Valgtest**en** for kandidater", "**De** Wal-Kompass"), so a bare `{name}` dropped into the existing sentences would be ungrammatical in four of the seven locales.

## Seeding and the datasets (plan 4, D-18, D-19)

| Place | Today | After this phase | Written how |
|-------|-------|------------------|-------------|
| `apps/supabase/supabase/seed.sql`, "Default app_settings for the default project" | `'{}'::jsonb` | unchanged (D-19) | SQL insert, `ON CONFLICT (project_id) DO NOTHING` |
| `packages/dev-seed/src/templates/default.ts`, `app_settings.fixed[0].settings` | `entities` and `results` only | gains the whole `contestantApp` root: `questions` (`hideHero`, `hideVideo`), both types, all three modes for both | Writer Pass-5 → `updateAppSettings` → `merge_jsonb_column` into the bootstrap row (a **merge**, not a replace) |
| `BASE_APP_SETTINGS` (`packages/dev-seed/src/templates/e2e/base.ts`) | carries the root with `questions` only | adds `entityTypes: ['candidate']`, `registrationModes: { candidate: ['email', 'code'], organization: [] }` | merge, then `setupFromTemplate`'s REPLACE |
| `MINIMAL_BASE_APP_SETTINGS` (`…/e2e/perm/shared.ts`) | no such root | gains the whole root with the same two declarations | same |
| every other perm template | spreads or `buildMinimal`-merges the minimal base | inherits the root with no edit; `perm-hide-hero`'s overlay `{ …App: { questions: { hideHero: true } } }` composes through `buildMinimal`'s `deepMerge` | same |
| bank-auth setup's `appSettingsOverride` | `{ preRegistration: { enabled: true } }` | `{ contestantApp: { registrationModes: { candidate: ['identity_provider', 'email', 'code'] } } }` | `merge_jsonb_column` after the REPLACE |

Facts behind the table:

- 29 of the 31 built-in templates derive their settings from the minimal base (all but `default` and `e2e/base`), which is why one edit there satisfies "every E2E dataset declares both settings". Prove it with a unit test over `BUILT_IN_TEMPLATES` rather than by reading 29 files (the Verdict B test doubles as this one). [VERIFIED: audit script, this session: "templates: 31, distinct settings payloads: 17"]
- The database merge behind every `updateAppSettings` call is `jsonb_recursive_merge`: two objects merge per key, "`ELSE p_patch`" for everything else, so a list in the patch replaces the stored list whole and a map merges row by row. [VERIFIED: `apps/supabase/supabase/schema/900-test-helpers.sql` § `jsonb_recursive_merge`] The bank-auth override therefore leaves `entityTypes`, `questions` and the `organization` row in place and replaces the `candidate` row.
- `packages/dev-seed/tests/templates/base-app-settings.test.ts` pins the top-level key list with `'candidateApp'` in it ("`expect(Object.keys(BASE_APP_SETTINGS).sort()).toEqual([ 'access', 'candidateApp', 'elections', … ])`"). Phase 170 renames that entry; this phase adds no top-level key and adds a pin on the root's members (D-18).
- The seed-time resolver `resolveAppSettingsExternalIds` walks only `results.cardContents.*`, so the new root passes through it untouched. [VERIFIED: `packages/dev-seed/src/resolveAppSettingsExternalIds.ts` docblock, "Currently handled paths"]
- The local database as found: three projects, all open; the default project and one other hold `{}`; the E2E project (`…0000000000e2`) holds a minimal-base payload with no contestant root and no `preRegistration`. No stored row needs migrating. [VERIFIED: read-only psql query, this session]

**A consequence of D-18 worth one line in the plan's notes:** the `default` template declares `identity_provider` for candidates, so after `yarn db:reset-with-data` a developer's local login screen shows the pre-registration button and collapses the sign-in form behind "Log in" (that is what `isLoginShown` does when the cell is on), and the button fails closed at the authorize step because a default `.env` configures no provider (D-14). This is the decision as written, not a defect.

Comments that state the old model and sit in files this plan edits: the `SetupFromTemplateOptions.appSettingsOverride` TSDoc and the step-3b comment in `setupFromTemplate.ts` (both name `preRegistration.enabled`), the long comment above the override in `bank-auth-journey.setup.ts`, and the note in its teardown.

## How the E2E perm chain writes `app_settings` (the open research item)

**Settled: every setup ends with an authoritative REPLACE; nothing is inherited from the previous template.** `setupFromTemplate` (`tests/tests/setup/shared/setupFromTemplate.ts`) runs, in order: prefix teardowns; pipeline and `Writer.write` (whose Pass-5 merges the template's settings into the row); then "3. Authoritative app_settings REPLACE + EXACT post-seed assertion" (`client.replaceAppSettings(…)` followed by `expect(persisted).toEqual(…)`); then, if given, `appSettingsOverride` through `client.updateAppSettings` (a merge). `replaceAppSettings` is a plain `update({ settings })`: "any key NOT present in `settings` is DROPPED from the persisted row". [VERIFIED: both files read this session]

Consequences for this phase:

1. **The new spec's teardown restores nothing.** The next setup to run replaces the row with its own template's settings. This is the rule the bank-auth teardown already states: "Nothing is written back to the shared `app_settings` singleton here … every `setupFromTemplate` call does a full authoritative REPLACE".
2. **A template's settings object is the entire stored row**, checked by exact equality. Criterion 4 is therefore a property of the template literals, and a stray key fails at setup time.
3. **In-spec mutations are merges**, so a re-seed inside the spec must state the whole of what it means: both rows of the matrix each time (a row it omits keeps whatever the previous test wrote), and lists whole.
4. **Do not "restore" with `null`.** `perm-startfromcg`'s `afterAll` writes `startFromConstituencyGroup: null`, which the strict schema rejects (the `elections` root is then dropped and reported until the next setup replaces the row). It is harmless there only because of point 1; do not copy the pattern.
5. Two comments on the tree still describe the superseded model: the notifications comment in `MINIMAL_BASE_APP_SETTINGS` ("app_settings is applied via merge_jsonb_column (deep merge) … BLEEDS into every downstream perm") and CONTEXT fact 11's "by deep merge". The planner need not fix the first unless the plan touches that comment.

### Where the new assertions run

The perm family is one linear chain anchored after the journey leaves, with `admin-access` and (opt-in) `bank-auth-journey` hanging off its tail (`dependencies: ['voter-prefs-tracking']`), and `perm-closed-project` as a **terminal node** whose dependency list is derived from every leaf (`CLOSED_PROJECT_DEPENDENCIES`). [VERIFIED: `tests/playwright.config.ts`]

Closing the E2E project anywhere but on the terminal node is unsafe: several base leaves sit outside the perm chain and may still be running, and "Closing the one project the dev server serves blanks every concurrent voter spec". So the assertions D-20 lists split by project state:

| State | Host | Why |
|-------|------|-----|
| **closed project**: empty matrix → no entry; a mode on → its entry; the three names | new tests in `tests/tests/specs/perm/perm-closed-project.spec.ts`, re-seeding with `updateAppSettings` inside the spec | the only node where the project is closed; nothing runs after it; its `afterAll`, its teardown and the next run's global setup already reopen the project |
| **open project**: the settings read through the ordinary readable row | a base-dataset spec that already visits the login page (new one-line assertions), **or** a new perm chain node | the terminal node cannot host it: the project is closed for that whole node |

Recommended shape, the cheapest that still covers both branches of `_getAppSettings`: put the full matrix-and-name table on the terminal node (the closed project is the hard case and the one criteria 1 and 3 depend on D-09 for), and cover the open-project branch with **new** one-line assertions on the base dataset, in a spec that already opens the login page (find one with `git grep -n -l -E "CandAppLogin|ContestantAppLogin|/(candidate|contestant)/login" -- tests/tests/specs`): the registration-code link is visible, the pre-registration button is absent (`candidate: ['email', 'code']`), the heading reads "Candidate app". The opt-in bank-auth journey then proves the `identity_provider` cell on an open project. No spec asserts any of this today. A separate perm node for the open state (template + setup + teardown + three project entries + a unique teardown prefix, which a config-load guard enforces) is the alternative if the planner wants the whole table twice; D-20 says "one perm-style spec", and "Where the new E2E spec sits in the perm chain" is Claude's discretion.

Constraints that apply whichever is chosen: the terminal spec is `test.describe.configure({ mode: 'serial' })` and its header states a rigidity contract ("every assertion is HARD — no expect.soft … Testid-only via `testIds` (`getByRole('heading')` permitted per the maintenance-page pattern)"); the seeded candidate there is force-registered and can sign in; `SOFT_ASSERTION_BUDGETS` applies only to the voter journey; a new `*.teardown.ts` must declare a `const PREFIX` that is neither equal to nor a prefix of another's ("TEARDOWN-PREFIX-UNIQUENESS GUARD"); `tests/README.md` documents the project graph and is updated when a node is added.

### The axe scan does not reach the login page today

`tests/tests/specs/a11y/candidate-a11y.spec.ts` scans `(protected)` routes only and records the hole itself: "Candidate routes OUTSIDE the `(protected)` family — also unscanned. Eleven of them, none needing authentication: `login`, `help`, `privacy`, `forgot-password`, `password-reset`, `register`, `register/password`, `preregister` …". The standing rule and D-20 ("The new screen states are reached by the axe scan") therefore need a scan this phase adds. `assertAxeScan(page, route, testInfo, label)` is exported from `tests/tests/utils/axeScan.ts` and can be called from any spec; it also runs the raw-i18n-key check, which would catch a name key missing from a catalogue. `scripts/assert-a11y-scan-wiring.mjs` constrains only the two `a11y/` specs (no private `AxeBuilder`, no `.withTags(`), so a call from the new spec does not trip it. Scan at least: sign-in only; code link shown; pre-registration shown with the form collapsed.

## Schema workflow, and being order-independent with Phase 172

| Step | Command | Reads | Note |
|------|---------|-------|------|
| edit | `apps/supabase/supabase/schema/*.sql` | — | hand-edited, concern-ordered view |
| regenerate the migration | `yarn schema:regenerate` (= `node scripts/assert-schema-migration-parity.mjs --write`) | the schema directory | the migration is `cat schema/*.sql`, byte for byte; never hand-edit `migrations/00001_initial_schema.sql`; there must be exactly one `.sql` file there |
| check parity | `yarn assert:schema-migration-parity` (a link of `lint:check`) | both | prints a census (today: "26 schema file(s) -> 6372 line(s) … generated copy is current") |
| apply | `yarn db:reset` | the migration | `supabase/config.toml` sets `schema_paths = []`, so only the migration is applied. **Destroys local data and the E2E project's rows**; the next E2E run's global setup recreates the project |
| types | `yarn db:types` | the **live** database | regenerates `packages/supabase-types/src/database.ts` only; `database.overrides.ts` is hand-maintained |
| lint | `yarn db:lint:sql` | the live database | needs the reset stack |
| pgTAP | `yarn workspace @openvaa/supabase test:db` (= `supabase test db`) | the live database | every file is `BEGIN … ROLLBACK` |

[VERIFIED: root `package.json` scripts; `scripts/assert-schema-migration-parity.mjs` header; `apps/supabase/package.json`; parity gate run this session, exit 0]

What makes a 171 plan safe whether it runs before or after 172 (both run serially in one working tree, so there is no textual merge; the hazards are stale generated files and a stale database):

1. Make the schema edit, then **regenerate** the migration as the last schema step. Never append to the migration by hand, and re-run the regeneration if anything in `schema/` changes afterwards.
2. `yarn db:reset` **before** `db:types`, pgTAP and `db:lint:sql`. All three read the applied database; run against a database that predates the edit they report on the old schema and look green.
3. After `yarn db:types`, read `git diff --stat packages/supabase-types/`. The expected diff is one new `Functions` entry. Any other change means the tree and the database disagree (for example 172's edits are in `schema/` but were not applied, or the reverse): stop and reset, do not commit the drift.
4. Edit the two census assertions **by their quoted strings**, not by position. Neither 172 nor 173 moves either census, so the strings quoted in § Gates are what both orders will find; if they differ, re-derive the expected list from the query the assertion itself runs.
5. Take the new pgTAP file's number at run time; 172 adds a file too. Name both by content.
6. `yarn db:reset` on this host touches a stack other work may be using; do not run it while an E2E run is in flight (CLAUDE.md), and never restart Docker (a second, unrelated Supabase stack runs here).

## Standard Stack

No new dependency. Everything is already in the workspace. Versions are the ones resolved on this tree. [VERIFIED: `node -e "require('<pkg>/package.json').version"` and CLI `--version`, this session]

### Core

| Library / tool | Version | Purpose in this phase | Why |
|----------------|---------|-----------------------|-----|
| zod | 4.6.5 | `StoredSettingsSchema`: two `z.array(z.enum(…))` members with a transform | the schema file's existing library; behaviour probed on this version |
| Svelte | 5.57.1 | login page, nav, layouts | runes forced on; `$state` proxies are why `structuredClone` is unusable in the merge |
| @sveltejs/kit | 2.70.3 | `+layout.server.ts` guards, universal root load | the `ssr = false` shell behaviour is version-read |
| @inlang/paraglide-js (via `project.inlang`) | as installed | message catalogues, `t()` | existing i18n stack |
| PostgreSQL (local Supabase) | 17.6 | the definer function | `config.toml` `major_version = 17` |
| Supabase CLI | 2.118.0 | `db reset`, `test db`, `gen types`, `db lint` | workspace devDependency |
| pgTAP | as shipped with the stack | function tests, census | existing estate |
| Vitest | 5.0.2 | unit tests in `app-shared`, `dev-seed`, frontend | existing |
| Playwright | 1.63.0 | E2E | existing |

### Alternatives considered

| Instead of | Could use | Why not |
|------------|-----------|---------|
| own recursive merge in `settings.ts` | `mergeSettings` from `@openvaa/app-shared` | three measured failures (Verdict A, condition 1) |
| `RETURNS jsonb` | `RETURNS TABLE (…)` | pulls the function into the RPC-nullability gate and needs a second function for any later member |
| a new perm chain node for every state | tests on the terminal closed-project node | closing the project is only safe on the terminal node |
| member-level `.catch()` in the schema | root-level drop | `.catch()` swallows the issue, so nothing is reported (Verdict B) |

**Installation:** none.

## Package Legitimacy Audit

This phase installs no external package, so there is nothing to audit.

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

## Architecture Patterns

### System architecture (data flow)

```
                     writers                                    readers
  ┌──────────────────────────────────────┐
  │ dev-seed templates  (default, base,  │   merge_jsonb_column        ┌────────────────────────────┐
  │ minimal base → 29 perm templates)    ├────────────────────────────►│ app_settings.settings JSON │
  │ E2E: replaceAppSettings (REPLACE),   │   or plain UPDATE (REPLACE) │  contestantApp.entityTypes │
  │      updateAppSettings (merge)       │                             │  contestantApp.registrat…  │
  └──────────────────────────────────────┘                             └──────┬──────────────┬──────┘
                                                                              │              │
                                        row readable (project open, or        │              │ row NOT readable
                                        signed-in grant holder)               │              │ (anon / no grant, project closed)
                                                                              ▼              ▼
                                                  SELECT settings via scopedFrom     rpc project_open_for_voters → false
                                                                              │              │
                                                                              │              ▼
                                                                              │   rpc <public config fn>(p_project_id)
                                                                              │   → { access.contestantApp, contestantApp.{entityTypes,registrationModes} } raw, null if unset
                                                                              │              │  drop nulls
                                                                              ▼              ▼
                                                        parseWithPartialPreserve(StoredSettingsSchema)
                                                        (dedup → canonical order; bad value drops its ROOT, reported once)
                                                                              │              │
                                                                              │              ▼
                                                                              │   built over shipped defaults; access.voterApp forced false
                                                                              ▼              ▼
                                                 DPDataType['appSettings']  (a deep partial)
                                   ┌──────────────────────────┬───────────────────────────────────┐
                                   ▼                          ▼                                   ▼
                    root +layout.ts (universal)   preregister / register server guards   four voter loaders
                    → page.data.appSettingsData   (anon client; raw partial)             (static ∪ stored)
                                   │                          │
                                   ▼                          ▼
                    appContext: mergeAppSettings (DEEP)   accessor on the raw partial
                    static ∪ dynamic ∪ payload            → redirect 303 to login when the mode is off
                                   │
                                   ▼
                    accessors in @openvaa/app-shared (served types · effective matrix · cell · any · name key)
                                   │
              ┌────────────────────┼─────────────────────────┬──────────────────────────┐
              ▼                    ▼                         ▼                          ▼
        login page            contestant nav         name readers (5)          embedding sentences (3 groups)
   (two entries, isLoginShown)  (two items)     t(`dynamic.…Name.${key}`)      t(key, { <name param> })
```

### Recommended file layout (new and touched; names after Phase 170)

```
packages/app-shared/src/
├── settings/
│   ├── dynamicSettings.type.ts        # two members in; preRegistration out
│   ├── dynamicSettings.ts             # shipped defaults
│   ├── <contestant app config>.ts     # vocabularies + pure accessors (new), with its .test.ts
│   └── README.md
├── data/schemas/storedSettings.schema.ts (+ .test.ts)
└── index.ts                           # flat barrel: export the new module

apps/supabase/supabase/
├── schema/106-app-settings.sql        # the function + its grant
├── schema/301-auth-functions.sql      # one sentence of the header comment
├── migrations/00001_initial_schema.sql   # regenerated
└── tests/database/NN-<content name>.test.sql (new), 07-rpc-security.test.sql (two strings)

apps/frontend/src/
├── lib/utils/settings.ts (+ .test.ts)                 # deep merge
├── lib/contexts/app/appContext.svelte.ts              # comment; re-merge from base
├── lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts (+ .test.ts)
├── routes/contestant/login/+page.svelte, register/…, preregister/+layout.server.ts, +layout.svelte, help, forgot-password, password-reset
├── lib/dynamic-components/navigation/contestant/…
├── lib/types/generated/translationKey.ts              # regenerated
└── messages/<7 locales>/dynamic.json, contestantApp.notSupported.json, contestantApp.help.json

packages/dev-seed/  src/templates/{default.ts, e2e/base.ts, e2e/perm/shared.ts}; tests/templates/…
tests/tests/        setup/contestant/bank-auth-journey.setup.ts, setup/shared/setupFromTemplate.ts (comments),
                    specs/perm/perm-closed-project.spec.ts, utils/testIds.ts
scripts/assert-project-scoped-queries.mjs   # one disposition entry
apps/docs/…         four pages + the publishers' merge sentence;  .claude/skills/database/*  # function tables
```

### Pattern: adding a dynamic setting (the house procedure)

The developers' docs page states it and it is what this phase does twice: "1. Add the type and its documentation to `DynamicSettings` … 2. Add the default to `dynamicSettings.ts` … 3. Add the key to `StoredSettingsSchema` … as an optional member. The schema is strict, so a stored value that carries a key the schema does not know loses the whole top-level setting that contains it." Then both docs tables. [VERIFIED: `apps/docs/src/routes/(content)/developers-guide/configuration/app-settings/+page.md` § "Adding a new setting"]

### Anti-patterns to avoid

- **Reading the two raw keys from a component or a guard.** Everything goes through the accessors (D-10); `contestantApp.entityTypes` is also the third thing on the tree called "entity types".
- **Destructuring `appSettings` from a context**, or deriving the name key once at init.
- **Testing position in a list.** Order is canonical only after the parse; readers test membership.
- **Hand-editing the generated migration, `database.ts` or `translationKey.ts`.**
- **A census edit by line number or count** instead of by the quoted string.
- **A `null` written to "unset" a setting** in a spec.

## Don't Hand-Roll

| Problem | Don't build | Use instead | Why |
|---------|-------------|-------------|-----|
| validating and normalising the two lists | ad hoc `Array.isArray` + `Set` in the provider or accessor | the transform inside `StoredSettingsSchema` | one place for dedup, order and rejection (D-02, D-05) |
| tolerating a malformed stored value | try/catch around a parse | `parseWithPartialPreserve` | three-state outcome, one failure record, never the value |
| reading a project-scoped table | `this.supabase.from('app_settings')` | `this.scopedFrom('app_settings')` | the project-scoping gate forbids the raw shape |
| re-seeding settings in a spec | SQL from the spec | `SupabaseAdminClient.updateAppSettings` / `replaceAppSettings` | the two primitives every perm spec uses |
| closing and reopening the E2E project | toggling `open_for_voters` in a new spec | the terminal node and its three reopen layers | ordering guard already exists |
| an axe gate | a private `AxeBuilder` | `assertAxeScan` | strictness parity, raw-key check |
| the name's three variants | string concatenation of "candidate" and "party" words | three catalogue keys per locale (D-16) | word order and conjunction differ by language |
| a second deep merge utility | — | one function in `settings.ts`, modelled on `buildMinimal`'s `deepMerge` | `mergeSettings` is unsuitable; do not add a third |

**Key insight:** almost every piece of this phase has a standing gate next to it (strict schema, census, project-scoping guard, cast guard, parity guard, catalogue parity test, teardown-prefix guard). The work is to move each gate deliberately, not to route around it.

## Runtime State Inventory

The phase removes one stored key and changes the shape of a stored root, so the question "what still holds the old shape after the code changes" applies.

| Category | Items found | Action required |
|----------|-------------|-----------------|
| Stored data | Local database, three projects: none stores `preRegistration`; none stores a contestant root (verified by read-only query). A row that did carry `preRegistration` would be read with that key dropped and one `error` record per read | none; the bank-auth override is the only writer and changes in this phase |
| Live service config | None. Identity-provider configuration is environment, unchanged (D-14). No auth allowlist change in this phase | none |
| OS-registered state | None — nothing in this phase registers with the OS | none |
| Secrets / env vars | None renamed or added. `PUBLIC_PROJECT_ID` scoping is used as it is | none |
| Build artifacts / generated files | `packages/app-shared/dist` (stale until rebuilt: the frontend resolves the package from `dist`); `apps/frontend/src/lib/types/generated/translationKey.ts`; `apps/frontend/src/lib/paraglide/**` (rebuilt by Vite); `apps/supabase/supabase/migrations/00001_initial_schema.sql`; `packages/supabase-types/src/database.ts`; the applied local schema (stale until `yarn db:reset`); a running dev server (restart after catalogue or package changes before trusting an E2E result) | rebuild / regenerate / reset as listed in § Schema workflow and § Verification |

## Common Pitfalls

### Pitfall 1: guarding the whole `register/` tree on `code` breaks invitations

**What goes wrong:** D-13 lists the tree as "`+layout.svelte`, `+page.svelte`, `+page.ts`, `password/`" and asks for a guard on "any served type allows `code`". But `register/password` is where **every invitation lands**: the auth callback's `invite` case is "`throw redirect(303, buildRoute({ route: 'CandAppSetPassword', locale, email: user?.email ?? '' }))`" and `CandAppSetPassword` is "`${CANDIDATE}/register/password`". The page itself distinguishes the two legs: "`const isInviteFlow = candCtx.isAuthenticated && email !== '' && registrationKey === '';`". [VERIFIED: `routes/api/candidate/auth/callback/+server.ts`; `lib/routes/route.ts`; `routes/candidate/register/password/+page.svelte`]
**Why it matters:** under the shipped default (every row empty, D-06) and in any project that allows `identity_provider` or `email` without `code`, an invited user would be redirected to login before setting a password. D-06 says invitations "are not a registration mode and keep working".
**Why the suite would not notice:** the base and minimal datasets both declare `code` (D-18), and the bank-auth override includes it.
**How to avoid:** guard the registration-code leg only: the code-entry page, and `register/password` when a `registrationKey` is present. The invitation leg (no `registrationKey`) is never guarded by a mode; if it is reached without a session the page already sends the visitor to the code-entry page, which the guard then refuses. Add one test with an empty matrix that an invited user still reaches the password form (unit-level on the guard's decision function is enough; an E2E leg on the terminal node is better).
**Warning signs:** a guard placed in `register/+layout.server.ts` that does not read the URL.

### Pitfall 2: `mergeSettings` looks like the deep merge to reuse and is not

Covered in Verdict A. Warning signs: `TypeError: Cannot set properties of null (setting 'show')` on any perm dataset; `DataCloneError` in the browser console after sign-in; a setting silently reverting to `undefined`.

### Pitfall 3: the function returns `null`, the schema rejects `null`

Parsing the function's answer unfiltered fails on every closed-project request and logs an `error` record each time. Drop null members first (probed).

### Pitfall 4: gates that read the applied database look green on a stale one

`yarn db:types`, `yarn db:lint:sql` and pgTAP all read the live local database. Without `yarn db:reset` after `yarn schema:regenerate` they pass against the old schema, the new pgTAP file fails with "function … does not exist", or `db:types` produces no diff and the frontend call does not typecheck.

### Pitfall 5: a stale `dist` or a stale dev server

The frontend imports `@openvaa/app-shared` from `dist`. After plan 1, `yarn build` before frontend typecheck and unit tests, or they report missing exports. The E2E wrapper starts its own dev server each run, which is what makes its result trustworthy; do not point the suite at a long-lived `yarn dev`.

### Pitfall 6: the schema goes strict before the bank-auth setup stops writing `preRegistration`

Between plan 1 and plan 4 the opt-in bank-auth setup writes a key the schema no longer knows; the key is dropped and reported, the pre-registration guard redirects, and the journey fails at its first step. The default suite does not run that setup, so default runs between the plans stay meaningful. D-21 allows moving the override into plan 1; that removes the window.

### Pitfall 7: hard-wrapped comments fail `lint:check`

`assert:comment-hygiene` rejects a comment paragraph broken across lines. Write each paragraph of a comment on a single line, in TypeScript, Svelte and SQL alike, and add no narrative ("previously…", phase or decision ids).

### Pitfall 8: the Phase 170 naming gate

After 170, `lint:check` runs `assert:no-candidate-app-names` (170 D-18). New symbols, message keys, test ids, file names and the SQL function name must not contain an app-level `candidateApp` / `CandApp` / `candidate_app`-style name. Entity-typed words are fine: the vocabulary value `'candidate'`, the name key `candidate`, the matrix row `candidate`.

### Pitfall 9: reading an exit status through a pipe

Every gate below is read by its own exit status. `cmd | tail` reports `tail`'s.

## Code Examples

### The merge rule, as a reference shape

```typescript
// Source: the rule in Verdict A; modelled on `deepMerge` in packages/dev-seed/src/templates/_helpers/buildMinimal.ts.
// Not the implementation to paste: types and TSDoc are the executor's. It shows the five decisions the unit tests must pin.
function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}

function mergeDeep(target: Record<string, unknown>, source: Record<string, unknown>, isRoot: boolean): Record<string, unknown> {
  const result: Record<string, unknown> = { ...target }; // never mutates `target`; untouched subtrees are shared
  for (const [key, value] of Object.entries(source)) {
    if (value === undefined) continue; // skipped at every depth
    if (isRoot && value === null) continue; // the root-level nullish skip `mergeAppSettings` has today
    const existing = result[key];
    result[key] = isPlainObject(value) && isPlainObject(existing) ? mergeDeep(existing, value, false) : value; // arrays, scalars and null replace whole
  }
  return result;
}
```

Unit cases this implies (frontend, `settings.test.ts`): a stored `contestantApp` without `questions` keeps the shipped `questions`; a stored list replaces the shipped list; a stored `{ show: false }` over a shipped `null` notification does not throw and wins; a nested `undefined` does not erase a default; a nested `null` replaces; `target` is unchanged; the stored value `{}` returns the base; a target that is a `$state` proxy merges without throwing (a `.svelte.test.ts` file, since runes need the Svelte transform).

### The census assertions as they stand (edit by these strings)

```sql
-- Source: apps/supabase/supabase/tests/database/07-rpc-security.test.sql, Section 8c
    'project_open_for_voters,storage_path_can,storage_path_is_public,user_can,user_has_account_grant',
    'census: the SECURITY DEFINER functions in public that anon can execute are exactly the five allow-listed ones'
-- …
    'get_entity_basic_data,project_open_for_voters,storage_path_can,storage_path_is_public,user_can,user_has_account_grant',
    'census: the SECURITY DEFINER functions in public that authenticated can execute are the same five plus get_entity_basic_data'
```

The expected value is `string_agg(p.proname, ',' ORDER BY p.proname)`, so the new name goes where it sorts (a name beginning `contestant_` sorts first in both).

### The precedent function (shape and grant to copy)

```sql
-- Source: apps/supabase/supabase/schema/301-auth-functions.sql
CREATE OR REPLACE FUNCTION public.project_open_for_voters (p_project_id uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET
  search_path = '' AS $$
  SELECT COALESCE(
    (SELECT p.open_for_voters FROM public.projects p WHERE p.id = p_project_id),
    false
  );
$$;

GRANT
EXECUTE ON FUNCTION public.project_open_for_voters (uuid) TO anon,
authenticated;
```

### The guard to mirror

```typescript
// Source: apps/frontend/src/routes/candidate/preregister/+layout.server.ts (today's tree)
const dataProvider = createDataProvider({ fetch, client: createSupabaseAnonClient({ fetch }) });
const appSettings: DPDataType['appSettings'] = await dataProvider
  .getAppSettings()
  .catch((e): DPDataType['appSettings'] => {
    log.error(`[Candidate App preregister layout] Error reading app settings: ${e?.message ?? 'No error message'}`, {
      err: e
    });
    return {};
  });
const preRegistrationEnabled = Boolean(appSettings.preRegistration?.enabled);
```

After this phase the last line asks the accessor for the `candidate × identity_provider` cell of the raw `appSettings`.

## State of the Art

| Old approach | Current approach | When changed | Impact |
|--------------|------------------|--------------|--------|
| perm setups inherit settings by deep merge | each `setupFromTemplate` REPLACEs the row and asserts exact equality | before this milestone (the helper's own comment calls it the "ROOT-CAUSE FIX (perm-* singleton-merge contamination)") | no restore step; a template is the whole row |
| a numbered migration per change | one generated migration, byte-identical to `cat schema/*.sql` | phase 162 | regenerate, never append |
| `preRegistration.enabled` boolean | the `candidate × identity_provider` cell | this phase | one fewer setting for 179 to delete |
| settings merged by root key | deep merge, lists whole | this phase | "store every member of a group you change" stops being a rule; "omit to disable" stops working for optional members |

**Deprecated / removed by this phase:** `DynamicSettings.preRegistration`; the leaf message `dynamic.contestantAppName`.

## Assumptions Log

| # | Claim | Section | Risk if wrong |
|---|-------|---------|---------------|
| A1 | The constructed app names in `fi, sv, da, et, fr, lb` (and the inflection-free rewrites of the three sentence groups) are natural to a native speaker | The app's name | Wrong wording ships in six locales. Precedent on this project: constructed non-English strings were recorded as a human-review item (phase 134). Suggest the same here |
| A2 | With `ssr = false`, the client's data request executes the server `load` under `register/` and the client router follows its redirect | Guard mechanics | The code-entry page would render before being refused. The shell-without-load half is source-verified; the client half is standard SvelteKit behaviour, confirmed by the E2E assertion the plan adds |
| A3 | Phase 170 lands the names in CONTEXT's name map (`ContestantNav`, `$lib/contestant`, `routes/contestant`, `api/contestant/preregister`, `ContestantApp*` route keys) | all file paths "after 170" | Paths in tasks are off by a name; the planner confirms against 170's summary, as CONTEXT already requires |
| A4 | The two bank-auth projects need different Edge Function issuer values, as recorded in the operator's notes of 2026-09-09; `tests/IDURA-TEST-RUNBOOK.md` may or may not have been corrected since | Verification commands | The opt-in run fails for an environment reason and reads like a product defect |
| A5 | Running `yarn db:reset` at execution time is acceptable to whoever else shares the local stack | Schema workflow | Another agent's in-flight E2E run is destroyed |

## Open Questions

1. **Should the guard on `register/password` exempt the invitation leg?** (Pitfall 1.)
   - What we know: D-13 names the whole tree; D-06 says invitations keep working; the two collide on `register/password` under the default settings.
   - Recommendation: scope the `code` guard to the registration-code leg. This reads D-13's own purpose ("a direct URL is refused exactly when the link is hidden": the link is the code link) and breaks nothing. It narrows a locked decision's literal text, so the planner should state it in the plan and the operator should see it.

2. **`access.answersLocked` on the anonymous login page of a closed project.**
   - What we know: the login page and nav use it to hide registration entries and to show the locked notice; anon cannot read it in a closed project, before or after this phase; D-09 fixes the function at three values.
   - Recommendation: keep three values; name `answersLocked` in the rewritten docstring beside `underMaintenance`; record it for 178, which rebuilds the login screen and can extend the `jsonb` object.

3. **Recompute-from-base in the app context's re-merge** (Verdict A, condition 2).
   - What we know: it is a behaviour change outside D-04's text; it removes member-level staleness across sign-in and keeps the proxy out of the merge.
   - Recommendation: do it in plan 1 with a unit test; it is small and the deep merge is what makes it matter.

4. **One spec or two hosts for the E2E assertions.**
   - Recommendation: the terminal node for the matrix and name table; one-line assertions on the base dataset for the open branch (§ Where the new assertions run).

5. **How `0` and omission are documented for the feedback popup.** Under the deep merge, omitting `results.showFeedbackPopup` yields the shipped 180 seconds; `0` disables it. The publishers' page should say so where it rewrites the merge sentence.

## Environment Availability

| Dependency | Required by | Available | Version | Fallback |
|------------|-------------|-----------|---------|----------|
| Node | everything | ✓ | 24.14.1 | — |
| Yarn | workspaces | ✓ | 4.18.1 | — |
| Docker + local Supabase stack | pgTAP, `db:types`, `db:lint:sql`, E2E | ✓ (container `supabase_db_openvaa-local` healthy; `127.0.0.1:54322` accepting connections) | PostgreSQL 17.6 | none |
| Supabase CLI | reset, test, types, lint | ✓ | 2.118.0 | — |
| psql | ad hoc read-only checks | ✓ | 17.6 | — |
| Playwright | E2E | ✓ | 1.63.0 | — |
| Identity-callback Edge Function served + mock issuer env | the opt-in bank-auth projects only (D-22) | not running by default | — | none; follow `tests/IDURA-TEST-RUNBOOK.md` |
| GitHub Actions run on this branch | — | not applicable to this phase's criteria | — | — |
| Knowledge graph (graphify) | research only | ✗ (disabled) | — | not needed |

**Missing dependencies with no fallback:** none for the default gates. The bank-auth run needs the runbook's manual setup.

## Validation Architecture

`workflow.nyquist_validation` is absent from `.planning/config.json`, so this section applies.

### Test framework

| Property | Value |
|----------|-------|
| Unit | Vitest 5.0.2 per workspace (`packages/app-shared`, `packages/dev-seed`, `apps/frontend`) |
| Database | pgTAP through `supabase test db`, files in `apps/supabase/supabase/tests/database/` |
| E2E | Playwright 1.63.0, `tests/playwright.config.ts`, run through `tests/scripts/e2e-run.sh` |
| Quick run (one package) | `yarn workspace @openvaa/app-shared test:unit` (measured: 9 files, 92 tests, about 1.1 s) |
| Quick run (one frontend file) | `cd apps/frontend && npx vitest run src/lib/utils/settings.test.ts` (measured: about 1.5 s) |
| Full unit | `yarn test:unit` |
| Full E2E | `tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/<name> --no-db-reset` |

### Phase requirements → test map

| Req | Behaviour | Type | Command | Exists? |
|-----|-----------|------|---------|---------|
| SET-01 | repeats collapse; canonical order; empty list and unknown type rejected with their paths | unit | `yarn workspace @openvaa/app-shared test:unit` | ❌ new cases in `storedSettings.schema.test.ts` |
| SET-01 | served-types accessor; default `['candidate']`; total on `{}` and on a root without the member | unit | same | ❌ new accessor test file |
| SET-02 | empty cell / empty row / empty matrix accepted and read back; repeats collapse; unknown mode and unknown row rejected; row for an unserved type stored and ignored on read | unit | same | ❌ |
| SET-02 | a stored list replaces the shipped list; a stored root without `questions` keeps the shipped `questions`; `{}` | unit | `cd apps/frontend && npx vitest run src/lib/utils/settings.test.ts` | ⚠ file exists; cases are new and its header changes |
| SET-02 | one bad value drops the stored root, keeps `access`, one failure record | unit | `cd apps/frontend && npx vitest run src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.test.ts` | ⚠ file exists; new cases |
| SET-01/02 | the function: closed project, open project, no row, missing project, anon and authenticated rights, nothing but the three values | pgTAP | `yarn workspace @openvaa/supabase test:db` | ❌ new file |
| SET-01/02 | both censuses name six | pgTAP | same | ⚠ `07-rpc-security.test.sql`, two strings |
| SET-01/02 | zero-rows branch: nulls dropped, values parsed, `voterApp: false` kept, defaults under | unit | provider test file | ⚠ new cases; one existing case needs a mocked response |
| SET-03 | empty matrix → sign-in only, form not collapsed, neither entry; `code` on → code link; `identity_provider` on → button and collapsed form; in a closed project | E2E | `tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/<name> --no-db-reset --project perm-closed-project` (pulls the whole suite; it is the terminal node) | ⚠ spec exists; new tests; new `testIds` entries |
| SET-03 | direct URL refused when the mode is off; invitation leg of `register/password` reachable under an empty matrix | unit on the guard's decision + E2E | frontend unit file beside the guard; same E2E run | ❌ |
| SET-03 | the bank-auth journey still passes with the cell-based gate | E2E (opt-in) | the wrapper with `PLAYWRIGHT_BANK_AUTH=1` and the runbook's environment | ⚠ spec exists; setup override changes |
| NAME-03 | name-key accessor: three states | unit | `app-shared` | ❌ |
| NAME-03 | three keys present in seven locales; union regenerated | unit | `cd apps/frontend && npx vitest run src/lib/i18n/tests/translations.test.ts` | ⚠ parity tests exist; add the named-key case |
| NAME-03 | the login heading for each of the three served-type states, changed by re-seeding only | E2E | same E2E run | ❌ new tests |
| criterion 4 | every built-in template declares both settings, canonical and schema-valid; base key list pinned | unit | `yarn workspace @openvaa/dev-seed test:unit` | ⚠ `base-app-settings.test.ts` exists; new test over `BUILT_IN_TEMPLATES` |
| a11y rule | axe on the three login states | E2E | same E2E run (`assertAxeScan`) | ❌ |
| E2E-03 | full suite green | E2E | the wrapper, no `--project` | ✅ |

### Sampling rate

- **Per task commit:** the touched workspace's unit suite (seconds), read by exit status.
- **Per plan:** `yarn test:unit`; for plan 2 also `yarn db:reset`, `yarn workspace @openvaa/supabase test:db`, `yarn db:lint:sql`, `yarn db:types` with an inspected diff; for plan 3 `yarn workspace @openvaa/frontend check`.
- **Phase gate (D-22):** the list under § Verification commands, then one full E2E run plus the opt-in bank-auth projects. Zero failed and zero did-not-run.

### Wave 0 gaps

- [ ] `packages/app-shared/src/settings/<accessors>.test.ts` — SET-01, SET-02, NAME-03
- [ ] new cases in `storedSettings.schema.test.ts`, including the per-level unknown-key rejection for `registrationModes`
- [ ] new cases in `apps/frontend/src/lib/utils/settings.test.ts`; a `.svelte.test.ts` case for a `$state`-proxy target
- [ ] `apps/supabase/supabase/tests/database/NN-<name>.test.sql`
- [ ] a dev-seed test over `BUILT_IN_TEMPLATES`
- [ ] `testIds` entries for the two entries and the collapsed-form button; new tests in `perm-closed-project.spec.ts`
- [ ] a guard-decision unit test covering the invitation exemption

### Verification commands that work here

Each is read by its own exit status.

```bash
yarn build                                              # after any packages/* edit; frontend resolves dist
yarn test:unit                                          # runs assert:unit-coverage first
yarn lint:check                                         # turbo lint, eslint tests, both typechecks (svelte-check for the frontend), and the assert:* chain
yarn workspace @openvaa/frontend check                  # svelte-check with --fail-on-warnings
yarn schema:regenerate && yarn assert:schema-migration-parity
yarn db:reset                                           # applies the regenerated migration; needs Docker; never mid-E2E-run
yarn workspace @openvaa/supabase test:db                # pgTAP
yarn db:lint:sql
yarn db:types && git diff --stat packages/supabase-types/
yarn workspace @openvaa/frontend generate:translation-key-type
yarn workspace @openvaa/frontend build                  # the production build; green typecheck and unit tests do not prove it
yarn format:check
tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/<name> --no-db-reset
```

Wrapper facts: it spawns and owns its dev server on `FRONTEND_PORT` (default 5273 there), refuses a port that is already taken, scopes the server to the E2E project (`00000000-0000-0000-0000-0000000000e2`), and distinguishes its outcomes by exit code (0 green, 1 Playwright failures, 3 database preparation, 4 readiness, 5 dev server, 6 no confirmed preflight, 130 interrupted). The opt-in projects are gated by `PLAYWRIGHT_BANK_AUTH`, read from the environment the wrapper inherits; `tests/README.md` shows the direct form (`PLAYWRIGHT_BANK_AUTH=1 SUPABASE_SERVICE_ROLE_KEY=… SUPABASE_ANON_KEY=… yarn test:e2e --project=bank-auth`), and `tests/IDURA-TEST-RUNBOOK.md` §§ "Deterministic E2E run" and "Full-browser journey" give the Edge Function and dev-server environment each project needs. `lint:check` membership, for reference: "`turbo run lint && eslint tests && yarn typecheck:tests && yarn typecheck && yarn assert:i18n-catalog-namespaces && yarn assert:a11y-scan-wiring && yarn assert:comment-hygiene && … && yarn assert:schema-migration-parity && yarn assert:adapter-casts && … && yarn assert:rpc-nullability && yarn assert:project-scoped-queries && …`" plus, after Phase 170, its naming gate.

## Security Domain

`security_enforcement` is absent from the config, so it is treated as enabled.

### Applicable ASVS categories

| ASVS category | Applies | Standard control here |
|---------------|---------|-----------------------|
| V2 Authentication | no change | the phase gates which registration *entries* are offered; it changes no credential flow. Server-side enforcement of the matrix is Phases 174 and 179 |
| V3 Session management | no | — |
| V4 Access control | **yes** | one new anon-executable `SECURITY DEFINER` function: pinned by both censuses; `search_path = ''`; returns an allow-list of three paths, never the row; `anon_select_app_settings` is not widened. Two server-side route guards so a hidden link is not a reachable URL |
| V5 Input validation | **yes** | `StoredSettingsSchema` (strict at every level, enum vocabularies, minimum one served type); the function's raw output is parsed by the same schema before use |
| V6 Cryptography | no | — |
| V7 Error handling and logging | yes | a parse failure is reported once with paths and refused key names, never the stored value (`reportParseFailure`) |

### Threat patterns for this change

| Pattern | STRIDE | Mitigation |
|---------|--------|------------|
| the definer function used as a cross-tenant reader | Information disclosure | it returns three configuration values that the project's own login page shows to any visitor; nothing else is addressable through it. A pgTAP assertion pins that `questions` and unrelated roots are absent |
| the function as a project-existence oracle | Information disclosure | one all-null answer for "no such project", "no settings row" and "nothing declared" (probed) |
| mutable `search_path` on a definer function | Elevation of privilege | `SET search_path = ''`, schema-qualified names (house rule) |
| an editor stores arbitrary JSON at the two paths and it is served to anon | Tampering / disclosure | accepted: the writer needs `project.edit_app_settings` on that project and can only publish what they chose to store; the reader validates and drops anything outside the vocabulary |
| client-side gating bypassed by typing the URL | Elevation of privilege | the two server guards (D-13). They gate *entry screens*, not registration itself, until 174 / 179 |
| fail-open on a malformed setting | Tampering | a bad value drops the root to defaults: no registration entry, Candidate-only name |
| the guard closes the invitation landing | Denial of service | Pitfall 1 |

## Sources

### Primary (HIGH confidence): the tree, read or executed this session

- `packages/app-shared/src/{settings/dynamicSettings.ts,settings/dynamicSettings.type.ts,data/schemas/storedSettings.schema.ts,utils/mergeSettings.ts,index.ts}`
- `apps/frontend/src/lib/utils/settings.ts` and its test; `lib/contexts/app/appContext.svelte.ts`; `lib/api/adapters/supabase/{dataProvider/supabaseDataProvider.ts,utils/parseOutcome.ts}`; `lib/i18n/{wrapper.ts,overrides.ts,tests/translations.test.ts}`; `lib/routes/route.ts`
- `apps/frontend/src/routes/{+layout.ts,candidate/+layout.svelte,candidate/login/+page.svelte,candidate/register/**,candidate/preregister/+layout.server.ts,api/candidate/auth/callback/+server.ts}` and the four voter loaders
- `apps/frontend/messages/<7 locales>/{dynamic.json,candidateApp.notSupported.json,candidateApp.help.json,common.json}`; `apps/frontend/project.inlang/settings.json`
- `apps/supabase/supabase/schema/{000-enums,106-app-settings,301-auth-functions,302-rls,503-entity-rpcs,900-test-helpers}.sql`; `apps/supabase/supabase/tests/database/{00-helpers,07-rpc-security,30-closed-project}.test.sql`; `apps/supabase/supabase/seed.sql`; `apps/supabase/scripts/lint-schema.mjs`; `apps/supabase/package.json`
- `packages/dev-seed/src/{templates/default.ts,templates/e2e/base.ts,templates/e2e/perm/shared.ts,templates/e2e/perm/perm-closed-project.ts,templates/_helpers/buildMinimal.ts,supabaseAdminClient.ts,resolveAppSettingsExternalIds.ts}`; `tests/templates/base-app-settings.test.ts`
- `tests/{playwright.config.ts,scripts/e2e-run.sh,README.md}`; `tests/tests/{setup/shared/setupFromTemplate.ts,setup/candidate/bank-auth-journey.{setup,teardown}.ts,setup/perm/perm-closed-project.setup.ts,specs/perm/*.spec.ts,specs/a11y/candidate-a11y.spec.ts,utils/testIds.ts}`
- `scripts/assert-{project-scoped-queries,schema-migration-parity,rpc-return-nullability,adapter-casts,a11y-scan-wiring,comment-hygiene}.mjs`; root `package.json`
- `node_modules/@sveltejs/kit/src/runtime/server/page/index.js` (2.70.3)
- `.claude/skills/database/{SKILL.md,extension-patterns.md}`, `.claude/skills/components/SKILL.md`
- Measurements: the replace-versus-deep merge audit over `BUILT_IN_TEMPLATES`; node probes of `mergeSettings` (null default, nested `undefined`, Svelte proxy); a zod 4.6.5 probe of the schema skeleton; read-only psql probes of the function body, the anon census and the stored rows; `assert-project-scoped-queries`, `assert-adapter-casts` and `assert-schema-migration-parity` runs (all exit 0); the `app-shared` unit suite and one frontend unit file

### Secondary (MEDIUM confidence)

- `171-CONTEXT.md`, `170-CONTEXT.md`, `172-CONTEXT.md`, `173-CONTEXT.md`, `ROADMAP.md` § Phase 171, `REQUIREMENTS.md` (decisions and the after-170 names; not yet true of the tree)

### Tertiary (LOW confidence)

- The operator's standing notes on running the bank-auth projects (A4)
- The constructed non-English app names (A1)

No web source was needed: every question was about this repository or an installed dependency whose source is on disk.

## Metadata

**Confidence breakdown:**
- Settings model and schema: HIGH — probed on the installed zod; the three-places rule is documented on the tree
- Merge verdict: HIGH — measured over every built-in dataset and reproduced failures of the alternative
- Database function and gates: HIGH — body run read-only; each gate's rule read from its source; the `CREATE FUNCTION` itself not executed
- E2E chain behaviour: HIGH — read from the helper and the config; not run (running the suite was out of bounds for this research)
- Route guards: MEDIUM-HIGH — the invitation collision is read from three files; the client half of the `ssr = false` behaviour is A2
- App names in six locales: MEDIUM — grounded in each catalogue's existing term, constructed, unreviewed

**What could not be measured:** nothing was blocked by the environment. The local Postgres was up and was queried read-only. By instruction, no E2E run, no `yarn dev`, no `yarn db:reset` and no DDL were executed, so the function's creation, the census after it and every E2E claim are derived from source, not observed.

**Research date:** 2026-10-05
**Valid until:** Phase 170 lands (re-check the after-170 names against its summary), and in any case about 30 days; the census strings and the gate lists should be re-read at plan time if Phase 172 has executed first.
