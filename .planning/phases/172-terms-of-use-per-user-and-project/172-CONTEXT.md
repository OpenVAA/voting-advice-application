# Phase 172: Terms of Use per User and Project - Context

**Gathered:** 2026-10-05
**Status:** Ready for planning

**Source of decisions:** `.planning/v2.16-DISCUSSION-POINTS.md` § *Phase 172 — Terms of Use per User
and Project* (and § *Cross-phase picture*) — a shared checkbox document covering Phases 170–179 that
the operator filled in one pass (commit `e4813bf65`). Its rule: an unticked decision accepts the
`★ RECOMMENDED` option; a ticked box overrules the ★; `**EDIT:**`/`**NOTE:**` free text beats every
box.

**In Phase 172's 21 decisions the operator ticked no box and wrote no EDIT or NOTE text.** Every
decision takes its ★ option. What changes the ★ text is what the operator decided in *other* phases:

1. **170-A5 → (b):** the auth pair moves to the neutral `api/auth/{callback,logout}`, the duplicate
   logout is merged, and only `preregister` moves to `api/contestant/`.
2. **171-A1 → (b):** the two new settings sit inside the existing root, as
   `contestantApp.entityTypes` and `contestantApp.registrationModes`.
3. **173-B5 → (b):** a signed-in user with no editable entity gets a "nothing to edit — contact
   support" screen with the support block and Logout, not a sign-out.
4. **174-A1 → (c):** an invitation carries a general grant spec `(scope, target_type, target_id,
   role)` or a child table of grants.
5. **175-B2 / 175-B3 NOTE:** to be discussed when 175 is reached. Intended: identity provider →
   candidate confirmed, organization **not** confirmed; code or email → both confirmed; name changes
   gated on `!entity.confirmed` for all types; `lock_nominations` affects nominations only.
6. **175-B5 → (b) + NOTE:** the nominations lock moves to `app_settings`.
7. **178-B1 ★ + NOTE:** the "password set" fact is bundled into the user-data retrieval RPC.
8. **Additional notes (end of the document):** (1) the whole `preregister` route becomes `register`,
   with an identity-provider subroute; (2) the entity election/constituency selectors filter by
   entity type, predicates centralised; (3) party/alliance selectors use a reusable EntityCard
   component.
9. **X1, X2, X3 untouched → ★ (a) each.** X3 (a) means `REQUIREMENTS.md`, `ROADMAP.md` and
   `PROJECT.md` are amended to the chosen options in one docs commit. This file therefore cites
   requirement ids and states the decision itself; it does not quote requirement wording.

Places where a ★ text assumed something another phase's filled answer changes are rewritten and
**flagged inline as "reconciled with …"**. The full list is under *Reconciliations* at the end of
`<decisions>`.

<domain>
## Phase Boundary

Accepting the terms of use becomes something a **user** does once per **project**. It is recorded
in a new table keyed on user and project, gated once in the protected layout (screen G of
`CAND-APP-PLAN.md`), and it stops deciding which entities voters can see. The column
`candidates.terms_of_use_accepted` and every condition on it are removed.

**Requirements:** TOU-01, TOU-02, TOU-03, REG-12, with E2E-03 as the closing criterion.
**Depends on:** Phase 170. Independent of Phase 171 in content, serial with it in schema edits.

**Success criteria** (from `.planning/ROADMAP.md` § *Phase 172*, restated, not quoted):

1. A signed-in user who has not accepted for the project is stopped at G before any protected page,
   by the layout and not by each page. After accepting they are not asked again in that project,
   including after signing out and in again (REG-12).
2. Acceptance belongs to the user and the project. No entity carries a terms-of-use field, and
   accepting in one project does not count in another (TOU-01).
3. An entity whose editor has not accepted is exactly as visible to voters as one whose editor has:
   public data, images and RPC results are the same, because no RLS policy, storage policy or RPC
   conditions on acceptance (TOU-02).
4. `.planning/todos/pending/` holds one todo for the Admin-app rule (an entity whose primary editor
   has not accepted cannot be confirmed, or is confirmed with a warning) (TOU-03).
5. The acceptance screen is reached by the axe scan, and the full E2E suite is green at close
   (E2E-03).

**Standing todo in scope:** `.planning/todos/pending/2026-08-27-147-tou-gate-modal-unscanned.md`.

**Standing rules inherited from `.planning/ROADMAP.md` § v2.16:**

- The cardinal rule: no failing E2E test, no exemptions, and "did not run" counts as a failure.
  E2E-03 closes every phase.
- Every user-facing string ships in all seven locales (`da, en, et, fi, fr, lb, sv`).
- Every new or changed screen meets WCAG 2.1 AA and is reached by the axe scan.
- A criterion that says "user" or "entity" holds for candidates and for organizations unless it
  names one.
- Nothing is deployed, so the schema, the settings shape, the routes and the renamed symbols change
  in place. No back-compat, no data migration for stored rows.
- UI hint: this phase adds no new visual surface. It re-points an existing gate.

**Not in this phase:**

- Screen H, the user-level / entity-level layout split, the "nothing to edit" screen and the
  reshaped user-data RPCs (Phase 173).
- Removing the `candidateNoNomination` sign-out (Phase 176). It stays here, moved below the gate.
- The set-password gate F (Phase 178) and the "no email yet" gate (Phase 179).
- Deleting the legacy preregister tree and its terms-of-use checkbox (Phase 179).
- The Admin-app confirmation rule itself (future, TOU-F01). This phase files the todo only.
- Any replacement visibility rule. `confirmed` plus a confirmed nomination plus an open project is
  the whole rule for every entity type after this phase.

</domain>

<name_map>
## Name map: the tree as Phase 170 leaves it

The discussion document's evidence, and the fact table below, cite today's `candidate` names. The
plan is written against the post-170 tree. This is the one place the mapping is stated. Where the
planner is unsure of a post-170 name, the authority is the ordered mapping table that Phase 170's
codemod keeps in its phase directory (170-B1 (a)), and the anchor to use is content, not a name.

| Today | After Phase 170 | Ruling |
|---|---|---|
| `apps/frontend/src/routes/candidate/…` | `apps/frontend/src/routes/contestant/…` | NAME-02 |
| `routes/candidate/(protected)/+layout.svelte`, `+layout.server.ts`, `termsOfUseLayout.svelte.test.ts` | the same three files under `routes/contestant/(protected)/` | NAME-02 |
| `ROUTE` keys `CandApp*` (`CandAppLogin`, `CandAppHome`), `CANDIDATE`, `CANDIDATE_PROT`, `isCandidateRoute` | `ContestantApp*`, `CONTESTANT`, `CONTESTANT_PROT`, `isContestantRoute` | 170-A4 (a) |
| `getCandidateContext`, `CandidateContext*`, local `candCtx`, `lib/contexts/candidate/` | `getContestantContext`, `ContestantContext*`, `contestantCtx`, `lib/contexts/contestant/` | 170-A2 (a) |
| `candidateUserDataState.svelte.ts`, `CandidateUserData` | `contestantUserDataState.svelte.ts`, `ContestantUserData`. The members that name the entity (`.candidate`) stay until 173 | 170-A3 (a) |
| `$candidate`, `lib/candidate/` (holds `components/termsOfUse/TermsOfUseForm.svelte`) | `$contestant`, `lib/contestant/` | 170-A1 (a) |
| message namespaces `candidateApp.*` (`candidateApp.error.saveFailed`) | `contestantApp.*` | 170-A7 (a) |
| `dynamic.candidateAppPrivacy.consent.*` | `dynamic.contestantAppPrivacy.consent.*` | 170-A7 (a) |
| `api/candidate/auth/{callback,logout}` and the second `api/auth/logout` | `api/auth/{callback,logout}`, one merged logout handler | **170-A5 (b), operator overrule** |
| `api/candidate/preregister` | `api/contestant/preregister` | 170-A5 (b) |
| `tests/tests/fixtures/candidate/`, `setup/candidate/`, `specs/candidate/`, `specs/a11y/candidate-a11y.spec.ts`, `utils/candidateJourneyConstants.ts` | `…/contestant/…`, `contestant-a11y.spec.ts`, `contestantJourneyConstants.ts` | 170-A11 (a) |
| Playwright projects `candidate-journey`, `candidate-a11y-scan`; tag `@cand-session` | `contestant-journey`, `contestant-a11y-scan`; `@contestant-session` | 170-A11 (a) |
| test ids `candidate-…` | `contestant-…`. `terms-of-use-submit` and `tou-save-error` carry no app prefix and are unchanged | 170-A11 (a) |
| docs section `developers-guide/candidate-app/` | `developers-guide/contestant-app/` | 170-A12 (a) |

**Names Phase 170 deliberately leaves, which this phase meets:**

- **`get_candidate_user_data`** keeps its name (170-A8 (a)). It is a named exemption in the
  `assert:no-candidate-app-names` gate, and Phase 173 deletes the function and the exemption line.
  This phase edits the function's return shape and does **not** rename it or touch the exemption.
- **`invite-candidate`** keeps its name (170-A9 (a)), owned by Phase 174. Not touched here.
- **Entity words are not app names.** The `candidates` table, `ENTITY_TYPE.Candidate`,
  `LocalizedCandidateData`, `unregisterCandidate`, `forceRegister` and the E2E external ids
  (`test-e2e-base-ca-aa-…`) name the entity type and are outside the rename.
- **The gate in 170-C2 runs in `lint:check`.** New code in this phase uses the new names or the gate
  fails.

**Unsettled name (reconciled with Additional note 1):** the legacy preregister tree is
`routes/contestant/preregister/` after 170. The operator's note renames the whole route to
`register` with an identity-provider subroute and assigns no phase to that. The one file this phase
cares about there is identified by content: the page that imports `TermsOfUseForm` and declares
`let termsAccepted = $state(false)`. D-11 leaves it alone wherever it sits.

</name_map>

<decisions>
## Implementation Decisions

Decision ids map one-to-one onto the discussion document's Phase 172 ids, given in parentheses.
21 decisions → D-01..D-21. Every decision below is locked; the planner does not re-open them. Only
the chosen option is stated. ⚠ marks the six the document tagged DECIDE.

### 0 — Factual baseline

- **D-01 (172-0.1):** Accept all 17 facts of 172-0 as the phase's factual baseline. They are
  restated in *Factual baseline* below. Facts 6, 9, 10, 15 and 16 are not in the roadmap and each
  changes a plan. The numbers are a snapshot at HEAD `df0cec944`; the planner re-derives every
  population at run time and never bends code to a count.

### A — Where acceptance lives

- **D-02 (172-A1) ⚠:** **A dedicated table.**
  `public.terms_of_use_acceptances (user_id → auth.users ON DELETE CASCADE, project_id → projects
  ON DELETE CASCADE, accepted_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY (user_id,
  project_id))`. It is the only shape that is project-scoped by constraint and that the Admin-app
  rule (TOU-03) can join against. Deleting the user or the project removes the row. User metadata
  and app metadata are dead options.
- **D-03 (172-A2):** **The value is `accepted_at timestamptz`, stamped by the database.** No
  version column, no boolean. The row's presence is the acceptance. The server clock replaces the
  client's `new Date().toJSON()` (fact 7).
- **D-04 (172-A3):** **No user path to withdraw.** `authenticated` gets INSERT and SELECT on its own
  rows and no UPDATE or DELETE. The row goes when the user or the project is deleted; a service-role
  caller can remove it.

### B — Write and read mechanism

- **D-05 (172-B1) ⚠:** **RLS self-insert, no definer function.**
  - INSERT policy `WITH CHECK (user_id = (SELECT auth.uid()))`.
  - A column-level INSERT grant on `project_id` only, with `user_id DEFAULT auth.uid()` and
    `accepted_at DEFAULT now()`, so the caller can state neither who nor when.
  - SELECT policy on the caller's own rows. `anon` gets nothing.
  - The write is an idempotent upsert (`ON CONFLICT DO NOTHING`).
  - The `07-rpc-security` census does not move, because no function is added.
  - *Research item:* confirm that the PostgREST upsert the Supabase client issues (ignore-duplicates
    form) succeeds under a column-level INSERT grant on `project_id` alone. If it does not, the
    fallback is a plain insert that treats the unique-violation as success. That choice stays inside
    this decision; a definer RPC does not come back.
  - *Accepted property:* the policy checks who, not which project. A user can record acceptance for
    a project they hold no grant in. It unlocks nothing, since every protected read is still
    grant-scoped.
- **D-06 (172-B2):** **A separate read of the table by the data writer, surfaced on the `user` part
  of the user data.** `BasicUserData` (in `lib/api/base/dataWriter.type.ts`) gains
  `termsOfUseAccepted: string | null`, filled for this adapter's project (`this.projectId`) by the
  Supabase writer's `_getBasicUserData`. It is independent of the entity read and of which entity is
  selected. It is not a column of the user-data RPC and not a JWT claim.
  **Flagged, reconciled with the 178-B1 NOTE:** the operator's note there bundles the "password set"
  fact into the user-data retrieval RPC. This decision was left at its ★, so the acceptance stays a
  table read. The two are compatible as long as this phase exposes acceptance as a field of the
  user-level data object the layout load returns, so that 178 adds its fact beside it whatever the
  source. See *Ambiguities*.
- **D-07 (172-B3):** **A dedicated `acceptTermsOfUse()` on the data writer, called from the gate.**
  - Remove `termsOfUseAccepted` from `updateEntityProperties`, `SetPropertiesOptions`,
    `LocalizedCandidateData` and the user-data state store (`#editedTermsOfUseAccepted`,
    `setTermsOfUseAccepted`, `resetTermsOfUseAccepted`, and its share of `unsavedProperties`).
  - Acceptance stops riding the composite `save()`, so an unverified answers read-back can no longer
    block it. `updateEntityProperties` becomes image-only. Its "Either an image file or a value for
    termsOfUseAccepted is required" guard is reworded to match.
  - The five state-store tests about the tri-state value are deleted with the member.
  - `termsOfUseLayout.svelte.test.ts` is rewritten against the new call and keeps its
    failure-is-shown assertion (`tou-save-error`).

### C — The gate (screen G, REG-12)

- **D-08 (172-C1) ⚠:** **Keep the in-layout replacement.** The protected layout renders the
  acceptance view instead of `children`. It is not a route and not a modal. The requested URL
  survives, so after accepting the user is where they were going: no redirect, no `next=` parameter,
  no loop guard. Extract the markup into a component so the layout body reads as a list of gates.
  The buttons and test ids stay: Continue (`data-testid="terms-of-use-submit"`, disabled until the
  box is ticked) and Logout.
- **D-09 (172-C2):** **The gate sits above the entity load.** It is decided on user-level data only,
  and the entity load's errors cannot pre-empt it.
  - The server load returns the acceptance alongside the session check.
  - The `userNoCandidate` and `candidateNoNomination` sign-outs are evaluated only after the gate
    passes. Both stay in this phase, moved below the gate.
  - **Reconciled with the 173-B5 (b) overrule:** the `userNoCandidate` sign-out is temporary.
    Phase 173 replaces it with a signed-in "nothing to edit — contact support" screen. So this phase
    moves the sign-out and does nothing else to it: no rewording, no new locale strings, no test
    that pins "sign out" as the intended end state. The below-gate entity check must be one
    identifiable step that 173 can swap from "sign out and redirect" to "render a view".
  - **Judgement call:** a user with no editable entity is still shown G first. The ★ text of 173-B5
    (a) said so; that option was overruled, but the order it stated is the cross-phase gate order,
    which the overrule does not change. See *Ambiguities*.
  - **Mechanism left to the planner, with two constraints.** The sign-outs live in
    `+layout.server.ts` (`handleError`), so the server load must not reach them for a user without
    an acceptance row. And after `acceptTermsOfUse()` succeeds the load must run again so the entity
    check and the entity data follow. The layout's present `termsSubmitted` flag, which flips the
    view locally without a reload, cannot be the whole mechanism any longer.
- **D-10 (172-C3):** **An ordered gate list in the protected layout, holding one entry (terms of
  use) at this phase's close.** Each entry is "needed?" plus a view; the first needed one renders.
  - **Reconciled with 173-B2 ★ (a) and the cross-phase gate order:** the ★ text said 173 "appends
    entity selection (if 173 keeps H in-layout)". 173 does not: H is a route at the app root. The
    list never holds H.
  - What the list will hold, in order: F (178 prepends, 178-A2 ★ (a)), the "no email yet" gate
    (179-B4 ★ (a), between F and G), then G. The full order is **F → email → G → H → home → the
    per-page nomination gate (176-D1)**. Build the list so an entry can be inserted before G without
    re-plumbing.
- **D-11 (172-C4):** **Leave the legacy preregister email page as it is.** Its checkbox writes
  nothing, so it cannot disagree with the new table; the user meets the real gate after signing in.
  Phase 179 deletes the tree. `TermsOfUseForm` therefore keeps its `bind:termsAccepted` contract.
  (Path reconciled with Additional note 1: see the name map.)

### D — Removing the visibility conjunct (TOU-02)

- **D-12 (172-D1) ⚠:** **`test-e2e-base-ca-aa-hidden` stays hidden by being seeded
  `confirmed: false`.** Every count in `voter-journey.spec.ts` stays, and the suite keeps an in-repo
  control for "an unconfirmed candidate with a confirmed nomination is not shown". Research confirms
  that a fixed row's explicit `confirmed` beats the `CONFIRMABLE_TABLES` default. Spot-checked: the
  default is applied under `if (isConfirmable && !('confirmed' in stripped))` in
  `packages/dev-seed/src/supabaseAdminClient.ts`, so an explicit value is kept.
- **D-13 (172-D2) ⚠:** **Confirmed means public, registered or not.** Nothing replaces the
  conjunct. `test-e2e-base-ca-aa-unregistered` is seeded `confirmed: false` until its spec registers
  it.
  - `contestant-journey` then needs either the registration helper to confirm the row, or counts
    adjusted for after-registration visibility. **Research measures which.** The measure is whether
    any spec asserts that candidate's voter-side visibility after it registers, and in which
    scheduling phase relative to `voter-journey`. Today the row turns public when the journey
    accepts the terms.
  - **Reconciled with the 175-B2 / 175-B3 NOTE:** the operator's intended confirmation rules
    (code or email → confirmed; identity provider → candidate confirmed, organization not) make
    `confirmed` the single entity-side visibility lever, and they will produce seeded,
    never-signed-in entities that are confirmed and public. That is this decision's accepted
    consequence, stated on purpose. This phase adds no "has an editor" or "has signed in" condition
    anywhere, and does not change who sets `confirmed`.
- **D-14 (172-D3):** **`forceRegister` inserts the acceptance row by default, with an opt-out for
  the specs that must meet the gate.** One place, so `auth.setup`, the perm setups and
  `perm-closed-project.setup.ts` keep landing on home.
  - Every `terms_of_use_accepted:` line in the dev-seed templates is deleted with the column.
  - The `terms_of_use_accepted: null` resets in `unregisterCandidate` and its sibling cleanup
    vanish, because the acceptance row cascades with the auth user.
  - The explicit set in `perm-closed-project.setup.ts` after `forceRegister` goes too.
  - Registrations that do not go through `forceRegister` (the email flow in the journey spec) get no
    row, so the journey still meets G.
- **D-15 (172-D4):** **pgTAP: delete, strip, and add one file and one census.**
  - Delete the acceptance-conditioned cases (fact 13). Drop the clause from the policy-text guards
    in `05`, `18` and `25` that hold the eight entity policies identical.
  - Add one new file for the table. It asserts: self-insert succeeds; a forged `user_id` is refused;
    another user's row is unreadable; `anon` is refused; a row for project A does not exist for
    project B (criterion 2).
  - Add one inverse census: no policy qual and no function body in `public` or `private` contains
    `terms_of_use`.
  - Add one behavioural trio for criterion 3: an anon-visible candidate row, its storage object and
    its `get_nominations` row, for a candidate whose editor has **no** acceptance row.
  - Deleted cases are not rewritten as positive mirrors.

### E — Todos

- **D-16 (172-E1):** **The TOU-03 todo is a new standalone file in `.planning/todos/pending/`.**
  Nothing existing covers it, and the one adjacent todo
  (`2026-09-15-refactor-candidate-and-entity-registration-flow-and-nominati.md`) is closed by Phase
  178, which would take the item down with it.
- **D-17 (172-E2):** **The todo defines "primary editor has not accepted" as: no holder of an
  editor grant on the entity has an acceptance row for the project.** Computable as
  `grants ⋈ terms_of_use_acceptances`, with no new column. It equals "the editor" for a candidate
  while 173-A1 ★ (a) keeps one editor per candidate. The todo records that "primary" is undefined in
  the schema and that this is the proposed reading. It names TOU-F01 as the future requirement.
- **D-18 (172-E3):** **Close the axe-scan todo with a second stored session.** A user with no
  acceptance row; one scan entry per theme that settles on `terms-of-use-submit`; same scan core
  (`tests/tests/utils/axeScan.ts`) and same project as the other contestant scans. The identity is
  registered with the D-14 opt-out and never accepts, so the state is stable across the run. The
  todo is closed with the corrected lever recorded: the todo's own proposal (log in as
  `test-e2e-base-ca-aa-hidden`) no longer works, because acceptance left the candidate, and the
  surface is an in-layout view, not a modal.

### F — Residue

- **D-19 (172-F1):** **Update the agent-facing docs and the docs site in this phase.**
  `.claude/skills/database/{schema-reference,rls-policy-map}.md` and the two `apps/docs` pages
  (`backend/authentication`, and the registration page under the post-170
  `developers-guide/contestant-app/`). Both describe the conjunct as a visibility rule today.

### G — Plan shape and gate

- **D-20 (172-G1) ⚠:** **Expand, then contract: three plans, each closing green.**
  1. *Expand.* The table, its RLS and grants, the pgTAP file, regenerated types, the writer's
     `acceptTermsOfUse` and the read, the gate moved above the entity load and made a gate list,
     unit tests, the E2E helper default. The column still exists and is ignored.
  2. *Contract.* Remove the column, the four conjuncts, the column grant and the RPC column; the
     templates, `permittedKeys`, the two negative-control rows; the pgTAP deletions and the census;
     the frontend type removal.
  3. *Close.* The axe-scan entry and second session, docs and skills, the two todos, the closing
     gate.
  The cardinal rule holds at every plan boundary, and a failure in plan 2 is attributable to the
  removal alone.
- **D-21 (172-G2):** **The closing gate, in order:** `yarn lint:check` (schema-migration parity),
  `yarn db:types` with no diff left, `yarn db:lint:sql`, pgTAP, `yarn test:unit`, `yarn build`, the
  full E2E run through `tests/scripts/e2e-run.sh`, and a zero-hit census
  `git grep terms_of_use_accepted -- ':!.planning'`. Each status is read from the command's own exit
  code, never through a pipe. The census is what proves criterion 2's "no entity carries a
  terms-of-use field". One E2E run, not two.

### Reconciliations

| # | ★ text or assumption in the 172 section | Reconciled to | Driven by |
|---|---|---|---|
| R1 | 172-C2 ★ and cross-note → 176: both sign-outs "are evaluated after the gate passes", treated as lasting | `userNoCandidate` is moved below the gate and otherwise untouched; 173 replaces it with a signed-in screen. Only `candidateNoNomination` lasts until 176 (D-09) | 173-B5 → (b), operator overrule |
| R2 | 172-C3 ★: "173 appends entity selection (if 173 keeps H in-layout)" | H is a route at the app root and never a list entry. The list gets F, then the email gate, ahead of G (D-10) | 173-B2 ★ (a); 178-A2 ★ (a); 179-B4 ★ (a) |
| R3 | "Cannot be defined yet": the gate's final position depends on 173-B1 | 173-B1 ★ (a): route parameter. In 173 the layout splits into a user-level and an entity-level one, and the gate lives in the user-level one. 172 builds it in `contestant/(protected)/+layout.*` on user-level data only, so the split is a move (D-09) | 173-B1 ★ (a) |
| R4 | "Cannot be defined yet": whether the gate list is F's mechanism | It is. F is an in-layout view rendered first, fed by the layout's server load (D-10) | 178-A2 ★ (a) |
| R5 | 172-B2 ★ rejected (b) because it "ties a per-user fact to a per-entity RPC" | Unchanged, but the acceptance is exposed as a field of the user-level data the load returns, so the "password set" fact joins it from whatever source 178 uses (D-06) | 178-B1 NOTE |
| R6 | 172-D2 ★: an unregistered confirmed candidate becomes public; cross-note → 174 on INV-05 | Unchanged and reaffirmed. `confirmed` is the one entity-side lever; no replacement condition (D-13) | 175-B2 / 175-B3 NOTE |
| R7 | 172-C4 ★ and fact 9 name `preregister/(authenticated)/email` | Identified by content; the path is whatever the tree holds when the plan runs (D-11) | Additional note 1 |
| R8 | "Cannot be defined yet": the exact names depend on 170 | Resolved in the name map. The auth pair is at neutral `api/auth/…`; the gate's Logout goes through the context's `logout` and needs no change here | 170-A5 → (b), operator overrule; 170-A1..A13 ★ |
| R9 | "Cannot be defined yet": whether `identity-callback` may pre-write an acceptance | It does not. An identity-provider user accepts in the app; after 179 deletes the legacy page, G is the only acceptance point. No service-role write path is built here | 179 cross-note → 172 |
| R10 | 172-E2 ★: "equals the editor for a candidate while 173-A1 keeps one editor per candidate" | Holds: 173-A1 ★ (a) keeps `idx_grants_one_candidate_editor`. The general grant spec of 174 changes who may be granted what, not this join (D-17) | 173-A1 ★ (a); 174-A1 → (c) |

Overrules with **no effect on this phase's decisions**, recorded so the planner does not look for
one: 171-A1 → (b) (settings shape; this phase reads no setting), 175-B5 → (b) (the lock's home),
Additional notes 2 and 3 (selectors), X1 and X2.

### Ambiguities (flagged, with the reading taken)

- **Per-user facts: table read or RPC.** 172-B2 ★ keeps acceptance out of the user-data RPC; the
  178-B1 NOTE puts the "password set" fact into "user data retrieval rpc". Reading taken: D-06 as
  written, with R5. If the operator wants one source for both user-level facts, that is a change to
  D-06 and must be said before plan 1.
- **A user with no entity and no acceptance.** The order "G, then the no-entity outcome" was stated
  only in the overruled 173-B5 (a). Reading taken: G first (D-09).
- **The second-session identity.** 172-E3 does not say which entity the never-accepting user edits.
  See *Claude's Discretion*.

### Claude's Discretion

- Which schema file holds the new table and its policies (a new numbered file, or
  `300-auth-tables.sql` / `302-rls.sql`), as long as schema-migration parity holds.
- The name and location of the extracted gate component and the shape of a gate-list entry.
- The reload mechanism after acceptance (D-09), within the two stated constraints.
- The exact form of the `forceRegister` opt-out (D-14).
- Which seeded candidate the never-accepting scan user edits (D-18). Constraints: not CA-AA-1
  (`auth-setup` holds its one editor grant, and `idx_grants_one_candidate_editor` allows one), and
  not the unregistered row the journey registers. `test-e2e-base-ca-aa-hidden` is the natural
  choice and keeps the todo's identity, but the gate renders before any entity loads, so the choice
  only has to be stable.
- How the second stored session is wired into the Playwright graph (D-18), given the measured
  wiring comment on `auth-setup` and the `contestant-a11y-scan` project. It must be a mechanism
  173-E2 can reuse for the multi-grant user.

</decisions>

<factual_baseline>
## Factual baseline (172-0, accepted under D-01; snapshot at HEAD `df0cec944`, today's names)

1. **Acceptance is on the candidate.** One column, `candidates.terms_of_use_accepted timestamptz`,
   nullable (`schema/102-entities.sql` `CREATE TABLE public.candidates`). No other entity table has
   it. No per-user-per-project table exists: the only table keyed on `auth.users` is
   `public.grants`, one row per grant, with no project column, revoked from every API role
   (`schema/300-auth-tables.sql`).
2. **Four conditioning sites, all candidate-only.** (i) `anon_select_candidates`; (ii) the public
   disjunct of `authenticated_select_candidates` (both `schema/302-rls.sql`); (iii) the candidate
   arm of `private.nomination_entities_confirmed` (`schema/301-auth-functions.sql`); (iv) the
   `CASE WHEN p_type = 'candidates'` string in the storage path-visibility helper
   (`schema/400-storage.sql`). Each is `terms_of_use_accepted IS NOT NULL AND terms_of_use_accepted
   < now()`, conjoined to `project_open_for_voters` + `confirmed` +
   `entity_has_confirmed_nomination`. With the conjunct removed the candidate policies are
   token-for-token the organization, faction and alliance ones.
3. **Nothing replaces the conjunct.** The three remaining conjuncts already hold for every other
   entity type.
4. **Other schema mentions.** The column is in the candidates self-edit UPDATE column grant
   (`schema/303-column-grants.sql`). `get_candidate_user_data` returns it (`RETURNS TABLE …
   terms_of_use_accepted timestamptz`, `NULL::timestamptz` in the organization arm), and
   `get_entity_basic_data`'s comment lists it as withheld (`schema/503-entity-rpcs.sql`).
5. **The gate is not a modal and not a route.** `(protected)/+layout.svelte` computes `layoutState`
   (`'loading' | 'error' | 'terms' | 'ready'`) and in `'terms'` renders `<MainContent>` with
   `TermsOfUseForm` in place of `children`. The URL does not change.
6. **The gate renders only after the entity loaded.** `layoutState` is `'terms'` only when
   `validity.state === 'resolved'`, which needs the candidate and the nominations. Before that,
   `+layout.server.ts` signs the user out through `handleError` and redirects with `userNoCandidate`
   or `candidateNoNomination`.
7. **How it saves.** `handleSubmit` calls `userData.setTermsOfUseAccepted(new Date().toJSON())` (a
   client clock), then the composite `userData.save()`, which writes answers first and returns
   `{ type: 'failure' }` before the property write if the answers read-back is unverified. The
   property write is `SupabaseDataWriter._updateEntityProperties`, a PostgREST `update` on
   `candidates`. `termsOfUseLayout.svelte.test.ts` pins the failure branch.
8. **Frontend surface carrying the field.** `LocalizedCandidateData.termsOfUseAccepted`,
   `SetPropertiesOptions.properties.termsOfUseAccepted`, `UniversalDataWriter.updateEntityProperties`
   ("Either an image file or a value for termsOfUseAccepted is required"), the user-data state store
   (`#editedTermsOfUseAccepted`, `setTermsOfUseAccepted`, `resetTermsOfUseAccepted`,
   `unsavedProperties`) and its tests (Tests 5, 6 and three more), `supabaseDataWriter.test.ts`.
9. **A second consumer of `TermsOfUseForm`.** The legacy `preregister/(authenticated)/email/
   +page.svelte` binds `termsAccepted` to enable its Continue button and writes nothing.
10. **Two seeded candidates are hidden from voters only by the conjunct.** `e2e/base` sets the
    column on every candidate except `test-e2e-base-ca-aa-hidden` and
    `test-e2e-base-ca-aa-unregistered`. Both have a confirmed nomination in CO-Reg-N
    (`…nom-reg-n-ca-aa-hidden`, `…nom-reg-n-ca-aa-unregistered`), and `bulkImport` defaults
    `confirmed = true`. `voter-journey.spec.ts` asserts the hidden candidate is absent and that
    Party AA shows 5 members. The template holds seven `nom-reg-n-ca-aa-*` rows, so the spec's
    "Party AA has 6 nominal members; 1 hidden" comment undercounts: two are hidden.
11. **dev-seed.** `permittedKeys.ts` lists the key for `candidates`.
    `templates/defaults/candidates-override.ts` stamps it on every default-template candidate "so
    the Candidates tab does not disappear". `e2e/base.ts`, `perm/shared.ts`,
    `perm/perm-localisation-positive.ts` state it. Unit tests: `tests/templates/base.test.ts` (two
    "has NO terms_of_use_accepted" cases), `tests/templates/default.test.ts` (Tests 28, 29), and a
    comment in `tests/integration/default-template.integration.test.ts`.
12. **E2E.** `unregisterCandidate` and the `deleteAllTestUsers`-style cleanup both null the column
    on the candidates the user edits. `perm-closed-project.setup.ts` sets it after `forceRegister`.
    `candidateTermsOfUsePage.fixture.ts` drives the form. `candidate-journey.spec.ts` expects the
    form after registration. `testCredentials.ts` picks CA-AA-1 because it carries the column.
13. **pgTAP.** `00-helpers` (fixture insert), `03-anon-read` (NULL / future / past branches),
    `16-anon-visibility` ("the terms-of-use conjunct, flipped alone"), `05`, `18`, `25` (policy-text
    guards), `10-schema-migrations` (column exists, type, nullable, self-update, cross-candidate
    update), `20-storage-authority`, `07-rpc-security`, `33-entity-type-collision`.
14. **Types and docs.** `packages/supabase-types/src/database.ts` (generated),
    `database.overrides.ts`, `column-map.ts`, `RPC-NULLABILITY.md`; `apps/docs`
    (`backend/authentication`, `candidate-app/registration`);
    `.claude/skills/database/{schema-reference,rls-policy-map}.md`. The document counted 43 files
    for `git grep -c terms_of_use_accepted -- ':!.planning'`.
15. **The axe todo's lever disappears.** It proposes logging the scan in as
    `test-e2e-base-ca-aa-hidden`. With acceptance on the user, the unscanned state is reached by a
    user with no acceptance row, whichever entity they edit. `candidate-a11y-scan` takes one
    `storageState` for the project.
16. **No existing todo covers TOU-03.** "Primary editor" is not a schema concept: a candidate has at
    most one editor (`idx_grants_one_candidate_editor`), an organization any number, and no grant is
    marked primary.
17. **The UI hint holds if the gate stays an in-layout view.** The strings exist in all seven
    locales (`dynamic.candidateAppPrivacy.consent.*`, `candidateApp.error.saveFailed`).

</factual_baseline>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.** Paths are today's; apply the
name map.

### The phase's own contract
- `.planning/v2.16-DISCUSSION-POINTS.md` § *Phase 172* and § *Cross-phase picture* — the filled
  decision document; the source of every D-entry. Also § *Phase 170* (170-A, the rename rulings),
  173-A1..A3, 173-B1, 173-B2, 173-B5, 173-E2, 178-A2, 178-B1 and 179-B4, which this file reconciles
  against.
- `.planning/ROADMAP.md` § *Phase 172* and § *v2.16* (standing rules, sequencing).
  `.planning/REQUIREMENTS.md` for TOU-01, TOU-02, TOU-03, REG-12, E2E-03, by id. Both are being
  amended under X3 (a); read them at plan time.
- `CAND-APP-PLAN.md` (repo root) — screens A–L; G is this phase's screen.
- `.planning/todos/pending/2026-08-27-147-tou-gate-modal-unscanned.md` — closed by D-18.
- Phase 170's codemod mapping table in `.planning/phases/170-contestant-app-rename-symbols-routes/`
  once it exists — the authority for any post-170 name.

### Schema
- `apps/supabase/supabase/schema/102-entities.sql` — `CREATE TABLE public.candidates` (the column).
- `apps/supabase/supabase/schema/300-auth-tables.sql` — `public.grants`,
  `idx_grants_one_candidate_editor`; the model for a user-keyed table.
- `apps/supabase/supabase/schema/301-auth-functions.sql` — `private.nomination_entities_confirmed`.
- `apps/supabase/supabase/schema/302-rls.sql` — `anon_select_candidates`,
  `authenticated_select_candidates`.
- `apps/supabase/supabase/schema/303-column-grants.sql` — the candidates self-edit column grant.
- `apps/supabase/supabase/schema/400-storage.sql` — the `CASE WHEN p_type = 'candidates'` string.
- `apps/supabase/supabase/schema/503-entity-rpcs.sql` — `get_candidate_user_data`,
  `get_entity_basic_data`'s allow-list comment.
- `apps/supabase/supabase/migrations/00001_initial_schema.sql` — the single generated migration.
- `apps/supabase/supabase/tests/database/*.test.sql` — the files in fact 13.
- `packages/supabase-types/src/{database.ts,database.overrides.ts,column-map.ts}`,
  `RPC-NULLABILITY.md`.

### Frontend
- `apps/frontend/src/routes/candidate/(protected)/+layout.svelte` — `layoutState`, `handleSubmit`,
  `validity`, `termsSubmitted`.
- `apps/frontend/src/routes/candidate/(protected)/+layout.server.ts` — `load`, `handleError`.
- `apps/frontend/src/routes/candidate/(protected)/termsOfUseLayout.svelte.test.ts`.
- `apps/frontend/src/lib/candidate/components/termsOfUse/TermsOfUseForm.svelte`.
- `apps/frontend/src/lib/api/base/dataWriter.type.ts` — `BasicUserData`, `LocalizedCandidateData`,
  `SetPropertiesOptions`. `apps/frontend/src/lib/api/base/universalDataWriter.ts` —
  `updateEntityProperties`.
- `apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts` —
  `_getBasicUserData`, `_getCandidateUserData`, `_updateEntityProperties`; and its test.
- `apps/frontend/src/lib/contexts/candidate/candidateUserDataState.svelte.ts` and its tests.

### Seed and E2E
- `packages/dev-seed/src/templates/e2e/base.ts` — the two rows and their `nom-reg-n-ca-aa-*`
  nominations; `packages/dev-seed/src/supabaseAdminClient.ts` — `CONFIRMABLE_TABLES`;
  `permittedKeys.ts`; `templates/defaults/candidates-override.ts`; the tests in fact 11.
- `tests/tests/utils/supabaseAdminClient.ts` — `forceRegister`, `unregisterCandidate`,
  `deleteAllTestUsers`. `tests/tests/setup/perm/perm-closed-project.setup.ts`.
- `tests/tests/specs/voter/voter-journey.spec.ts` — "Party AA has 6 nominal members; 1 hidden", the
  `toHaveCount(5)` member assertion, `hiddenCandidate`.
- `tests/tests/specs/candidate/candidate-journey.spec.ts`,
  `tests/tests/fixtures/candidate/candidateTermsOfUsePage.fixture.ts`,
  `tests/tests/utils/testCredentials.ts`, `tests/tests/utils/candidateJourneyConstants.ts`.
- `tests/playwright.config.ts` — `auth-setup`, `candidate-a11y-scan`, `STORAGE_STATE` and the
  wiring comment above them. `tests/tests/specs/a11y/candidate-a11y.spec.ts`,
  `tests/tests/utils/axeScan.ts`. `scripts/assert-a11y-scan-wiring.mjs` pins the project and the
  spec file name.

### Docs
- `apps/docs` `backend/authentication` and the registration page of the contestant-app section.
- `.claude/skills/database/{schema-reference,rls-policy-map}.md`.

### Standing project rules that bind this phase
- `CLAUDE.md` (E2E hard rule and preflight, Comment Hygiene, Context Destructuring Rule) and
  `.agents/code-review-checklist.md`.
- Never read a gate's status through a pipe. Content anchors, never line numbers.
- E2E through `tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/<name> --no-db-reset`.
  `tests/e2e-runs/` is not deleted.
- After a schema change: regenerate the migration, `yarn db:types`, `yarn db:lint:sql`.
- The local stack must have been restarted once after Phase 170's allowlist change.

</canonical_refs>

<code_context>
## Existing Code Insights

Figures are the discussion document's snapshot at HEAD `df0cec944`. The facts the reconciliations
rely on were spot-checked on this worktree while writing this file, before Phase 170 has run:

- `routes/candidate/(protected)/+layout.server.ts` signs out in `handleError` for `loginFailed`,
  `userNotAuthorized`, `userNoCandidate` and `candidateNoNomination`, all before any gate (fact 6).
- `+layout.svelte` holds `layoutState`, `termsSubmitted`, `handleSubmit` calling
  `userData.setTermsOfUseAccepted(new Date().toJSON())`, and takes `logout` from the context.
- `TermsOfUseForm` has exactly two consumers: the protected layout and
  `routes/candidate/preregister/(authenticated)/email/+page.svelte` (fact 9).
- `BasicUserData` is `{ id, email, username, role?, …settings }` with `UserRole = 'candidate' |
  'admin'`; `_getCandidateUserData` calls `_getBasicUserData` first, then
  `.rpc('get_candidate_user_data', …)`.
- `routes/api/` holds `auth/logout` and `candidate/{auth,preregister}` (the 170-A5 starting state).
- The schema has the conjunct at the four sites of fact 2, and the column at the sites of fact 4.
- `contestant-a11y-scan`'s predecessor takes `storageState: STORAGE_STATE` and depends on
  `data-setup-base` and `auth-setup`.
- `forceRegister(candidateExternalId, email, password)` is used by 15 files under `tests/tests`.
- **Drift:** `git grep -c terms_of_use_accepted -- ':!.planning'` returns 44 files on this
  worktree, against the document's 43. The closing census (D-21) is zero hits, so the starting
  count does not matter, but the planner derives the file list itself.

### Reusable Assets
- `TermsOfUseForm` and the existing strings in seven locales — the view needs no new copy.
- `tests/tests/utils/axeScan.ts` — the shared scan core for D-18.
- The pgTAP policy-text guards in `05`, `18`, `25` — after the clause is dropped they prove the
  eight entity policies identical without a special case.
- `scripts/assert-a11y-scan-wiring.mjs` — already pins the scan project; extend it if the second
  session adds a project or a setup.

### Established Patterns
- **Schema source in `schema/*.sql`, one generated migration.** Parity is asserted in `lint:check`.
- **Column-level grants plus RLS** for self-edit (`303-column-grants.sql`); D-05 follows it for
  INSERT.
- **A census in pgTAP** for "nothing in the schema does X" (`07-rpc-security`); D-15's inverse
  census follows it.
- **Each request holds its own writer over the cookie-bearing client** (`createDataWriter({ fetch,
  locals })`); the acceptance read and write go through it.
- **Context reads:** `logout`, `t` and `userData` are stable references and may be destructured;
  reactive accessors may not (`CLAUDE.md` § Context Destructuring Rule).

### Integration Points
- **The user-data RPC.** This phase removes one return column from `get_candidate_user_data`;
  Phase 173 deletes and replaces the function.
- **The protected layout.** Phases 173, 176, 178 and 179 each change it after this one. The gate
  list and the "user-level data first, entity second" order are what they build on.
- **The E2E admin client.** `forceRegister`'s default is inherited by whatever replaces it in
  174 / 178.
- **The single migration file**, shared with 171.

</code_context>

<specifics>
## Specific Ideas

- The operator wrote nothing in this section. The intent, in the document's words: acceptance
  "stops deciding which entities are public", and "confirmed means public, registered or not".
- `CAND-APP-PLAN.md`: "Each step is its own view" and "Control this and other such gates on the
  layout level". The in-layout view with a gate list is the chosen reading of both.
- The gate's layout body should read as a list of gates, not as nested branches: the order
  F → email → G is to be stated by the list, not implied by nesting.
- Plan 1 must leave the old column in place and ignored. That is what makes plan 2's failures
  attributable to the removal.

</specifics>

<cross_phase>
## Cross-phase Notes (obligations)

- **172 → 173, strictly in order.** `get_candidate_user_data` loses `terms_of_use_accepted` here;
  173 reshapes the same RPC and the same generated types. Plan 2 here and 173's schema plan are
  never executed in parallel or out of order. 173 also inherits an image-only
  `updateEntityProperties`, which simplifies its generalisation (173-D1).
- **Gate order: F → email → G → H → home → the per-page nomination gate.** This phase builds the
  list holding G only. 178 prepends F. 179 adds the email gate between F and G. 173 makes H a route
  at the app root and creates the user-level / entity-level layout split, moving the gate into the
  user-level layout. The gates render before the entity loads.
- **The two sign-outs.** `userNoCandidate` moves below the gate here and is replaced by a signed-in
  screen in 173 (173-B5 (b)). `candidateNoNomination` moves below the gate here and is removed in
  176.
- **Schema edits are serial with 171.** The two phases are independent in content, but each edits
  `schema/*.sql` and regenerates the single migration file. Whichever executes second regenerates
  it on top of the other's schema, and reruns `yarn db:types`. The same holds between this phase's
  plan 1 and plan 2 if 171 lands between them.
- **Second stored session for the axe scan.** D-18 and 173-E2 share one mechanism. Build it here so
  173 adds a second identity (the multi-grant user) without re-plumbing the Playwright graph.
- **→ 174.** INV-05 confirms an entity seeded with a name and an email or code. With TOU-02 that
  makes an invited, never-signed-in entity public as soon as its nomination is confirmed (D-13).
  An invitation carries no terms-of-use state; a claimed user meets G like any other.
- **→ 174 / 178.** The `forceRegister` default (D-14) carries over to whatever replaces it when
  invitations change how test users are created.
- **→ 175.** The terms-of-use property leaves the entity before 175, so its staged-properties list
  is `image`, `name`, `shortName`.
- **→ 176.** It assumes the gate still precedes every protected page, so home is never rendered to
  a user who has not accepted.
- **→ 178.** It prepends F to this phase's list and adds the "password set" fact to the user-level
  data (R5).
- **→ 179.** Deleting the legacy preregister tree removes the last second consumer of
  `TermsOfUseForm`; G becomes the only acceptance point for identity-provider users.
- **Admin app (future, TOU-F01).** D-17's definition and 173-A1's index decision together fix what
  "primary editor" can mean.
- **170 → 172.** The `assert:no-candidate-app-names` gate runs in `lint:check`. This phase leaves
  the `get_candidate_user_data` exemption line alone.

</cross_phase>

<deferred>
## Deferred Ideas

- **The Admin-app confirmation rule** (cannot confirm, or confirm with a warning, when no editor has
  accepted) — future, TOU-F01. Todo filed by D-16 / D-17.
- **A terms version and re-prompting on a revision** — rejected for now (D-03). Nothing produces or
  compares a version today.
- **A user path to withdraw acceptance** — rejected (D-04).
- **Removing the legacy preregister checkbox** — Phase 179 (D-11).
- **The "nothing to edit" screen** — Phase 173 (R1).
- **A replacement visibility condition for never-registered entities** — rejected (D-13). If the
  175 discussion of the confirmation rules changes who is confirmed when, it changes `confirmed`,
  not this phase.
- **One RPC for all user-level facts** — open only if the operator resolves the D-06 ambiguity that
  way.

</deferred>

---

*Phase: 172-terms-of-use-per-user-and-project*
*Context gathered: 2026-10-05*
