# Phase 172: Terms of Use per User and Project - Research

**Researched:** 2026-10-05
**Domain:** Supabase schema (table, RLS, column grants, pgTAP) · SvelteKit 2 / Svelte 5 protected-layout gate · Playwright E2E fixtures and the axe scan
**Confidence:** HIGH (every open research item was settled by measurement or by reading the source of truth; what could not be measured is listed under *Assumptions Log*)

**Tree read:** HEAD `44baab7a9`, branch `feat/entity-signup-multi-grant`, **before Phase 170**. Names below are
today's; the post-170 name follows in brackets where it differs, per the name map in `172-CONTEXT.md`.

**Anchor convention.** Per the standing content-anchor rule, no line numbers are cited. Every in-repo value is
cited as file path + symbol + a verbatim quote, so it can be found with `git grep -F` after Phase 170 moves it.
Every population is a command to re-run, with today's result beside it as a snapshot only.

**What was run to produce this file.** Read-only `SELECT`s and the read-only `apps/supabase/scripts/lint-schema.mjs`
against the running local stack (`supabase_db_openvaa-local`, PostgreSQL 17.6). The D-05 experiment needed DDL, so
it ran against a **private throwaway PostgreSQL 17.6** (Homebrew `initdb`, port 54399, in the session scratchpad)
with a throwaway container of the stack's own PostgREST image (`public.ecr.aws/supabase/postgrest:v16.3`); both
were removed afterwards. The shared stack was not written to, not restarted and not reseeded. No E2E run, no
`yarn dev`, no `yarn db:reset`. Nothing was committed (the orchestrator forbade `git add` / `git commit`).

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

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

### Deferred Ideas (OUT OF SCOPE)

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
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description (by id; wording in `.planning/REQUIREMENTS.md`) | Research support |
|----|-------------|------------------|
| TOU-01 | Acceptance is recorded per user and project, not on the candidate | § *R-1* (the table, grants and policies, measured end to end through PostgREST 16.3), § *Schema workflow*, § *Census* (every site of the column), § *Hidden gates* (five standing gates a new table trips) |
| TOU-02 | Acceptance no longer affects public visibility: every RLS, storage and RPC condition removed | § *R-3* (exactly two seeded rows change, measured over all 31 built-in templates; no count changes), § *Census* § schema (the four conjunct sites), § *pgTAP impact* (twelve files, two of them found only by count) |
| TOU-03 | A backlog todo records the Admin-app rule | § *Todos* (no existing todo covers it: 4 pending todos mention terms of use, none the rule; D-16 / D-17 give the file's content) |
| REG-12 | A user who has not accepted is asked before proceeding, enforced at layout level (G) | § *R-5* (what runs in what order today, the recommended order, the rerun mechanism), § *Gate list*, § *R-4* (the second stored session for the axe scan) |
| E2E-03 (closing criterion) | Full E2E suite green at close | § *Verification commands*, § *Validation Architecture*; baseline: last full run `tests/e2e-runs/169-e2e/169-nodemailer-pin`, 171 passed / 0 failed / 0 did-not-run, 4.7 min |
</phase_requirements>

## Summary

The phase is well specified and every item CONTEXT.md left to research has an answer. **D-05 holds as written:**
the ignore-duplicates upsert that `@supabase/postgrest-js` 2.117.2 issues succeeds under a column-level
`INSERT (project_id)` grant, first time and on repeat, through PostgREST 16.3 on PostgreSQL 17.6; a forged
`user_id` or `accepted_at` is refused with `42501`; `anon` is refused; the fallback (plain insert, `23505` as
success) also behaves as described. **D-13 needs neither of its two contingencies:** across all 31 built-in
dev-seed templates exactly two candidate rows lack the column, both in `e2e/base`, and with both seeded
`confirmed: false` the voter-visible set of `e2e/base` is the same before and after the phase at every point of
the run. No spec asserts the unregistered candidate's voter-side visibility after it registers, so no count
moves and the registration helper does not need to confirm the row.

Research found **eight things CONTEXT.md does not name, each of which fails a gate or a spec if the plan omits
it**: (1) `lint-schema.mjs` check 9001 reports the two new policies as `reaches_neither` (an ERROR) unless two
reasoned entries are added to its `REACHES_NEITHER_ALLOW` list; (2) `assert-project-scoped-queries.mjs` and the
`ProjectScopedTable` union must both gain the table, and `scopedFrom` has no `upsert`; (3) the supabase-js
**default** upsert (`merge-duplicates`) is refused with `42501` under the D-05 grant, so `ignoreDuplicates: true`
is mandatory; (4) the default ACL gives `anon` and `authenticated` ALL on a new public table, so D-04 / D-05
need an explicit `REVOKE ALL` first; (5) two pgTAP assertions depend on the column by **count** and contain no
`terms_of_use` string, so a grep census misses them (`09-column-restrictions`: 11 → 10; `21-entity-organization`:
14 → 13); (6) `perm-localisation-positive.spec.ts` registers through the email flow and relies on the seeded
column to skip the gate, so D-14's `forceRegister` default does not cover it; (7) `unregisterCandidate`,
`deleteAllTestUsers` and `perm-closed-project.setup.ts` write the column through PostgREST and will hard-fail
every setup the moment the column is dropped, so they leave in the same commit as the column; (8) the
`userNoCandidate` and `userNotAuthorized` sign-outs in the protected server load are unreachable today — a user
with no entity is signed out as `loginFailed`, because `_getCandidateUserData` throws on zero rows — so "move the
sign-outs below the gate" means moving the whole `getCandidateUserData` call below it.

**Primary recommendation:** build plan 1 fixtures-first (table → types → E2E helper default → writer → gate),
decide the gate in `+layout.server.ts` from `getBasicUserData()` alone before any entity read, rerun the load
with `invalidateAll()` after `acceptTermsOfUse()`, and treat the pgTAP run — not the grep census — as the
instrument that finds the remaining count-based dependents in plan 2.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| The acceptance record (who, which project, when) | Database / Storage | — | A row keyed `(user_id, project_id)`; the database supplies `user_id` and `accepted_at` by `DEFAULT`, so neither can be stated by the caller (D-03, D-05) |
| Who may write or read an acceptance | Database / Storage | — | RLS self-row policies plus a column-level INSERT grant. No definer function, no JWT claim (D-05) |
| Reading acceptance for the gate | Frontend Server (SSR) | API / Backend (PostgREST through the Supabase adapter) | The protected `+layout.server.ts` calls the request-scoped data writer over the cookie-bearing client (D-06, D-09) |
| Deciding which gate applies, and that it precedes the entity load | Frontend Server (SSR) | Browser / Client | The decision must be made before `getCandidateUserData` runs, which only the server load can guarantee; the browser only renders the chosen view (D-09, D-10) |
| The gate view and its submit | Browser / Client | API / Backend | In-layout replacement of `children`; the write is one PostgREST insert from the browser client (D-07, D-08) |
| Which entities voters can see | Database / Storage | — | `anon_select_candidates`, `authenticated_select_candidates`, `private.nomination_entities_confirmed`, `storage_path_is_public` — four sites, all in the schema (TOU-02) |
| Provisioning test identities and their acceptance | Test harness (service-role admin client) | — | `forceRegister` writes the row with the service role, which bypasses RLS and keeps table privileges after the `REVOKE` (D-14) |

## Disagreements between the planning record and CONTEXT.md

CONTEXT.md wins in each case; recorded so the planner does not plan against the other wording.

| Where | Wording there | CONTEXT.md | Effect |
|---|---|---|---|
| `.planning/ROADMAP.md` § Phase 172, *Discussion settled* | the gate list is one "that Phases 178 and 173 extend (172-C3)" | D-10 / R2: the list never holds H. 178 prepends F, 179 inserts the email gate; 173 makes H a route and moves the list into the user-level layout | Build the list so an entry can be inserted **before** G. Do not build an "append H" seam |
| `.planning/ROADMAP.md` criterion 4 and `REQUIREMENTS.md` TOU-03 | the todo is "merged into an existing todo if one already covers it" | D-16: a new standalone file | Not a real conflict: none covers it (see § *Todos*). File a standalone todo |
| `REQUIREMENTS.md` TOU-01 | "not on the candidate" | D-02..D-07 | Consistent. Criterion 2's "no entity carries a terms-of-use field" is proven by D-21's zero-hit census |

`REQUIREMENTS.md` and the v2.16 part of `ROADMAP.md` were being amended by another agent while this file was
written; re-read both at plan time.

## Research items, answered

### R-1 — D-05: the ignore-duplicates upsert under a column-level INSERT grant — **works** `[VERIFIED: measured]`

**Setup (private instance, torn down).** PostgreSQL 17.6; roles `anon`, `authenticated`, `service_role`
(`BYPASSRLS`), `authenticator` (`NOINHERIT`) as on the live stack; the live stack's default ACL reproduced
(`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role`);
`auth.uid()` copied verbatim from the live stack's `pg_get_functiondef`. PostgREST image
`public.ecr.aws/supabase/postgrest:v16.3` (response header `Server: postgrest/16.3`; the live stack's
`supabase_rest_openvaa-local` reports `PostgREST 16.3`). Client: the repo's own
`node_modules/@supabase/postgrest-js` 2.117.2 (`@supabase/supabase-js` 2.117.2).

**The table as probed** (D-02 / D-03 / D-05 shape; policy names in the probe were placeholders):

```sql
CREATE TABLE public.terms_of_use_acceptances (
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users (id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  accepted_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, project_id)
);
CREATE INDEX idx_terms_of_use_acceptances_project_id ON public.terms_of_use_acceptances (project_id);
ALTER TABLE public.terms_of_use_acceptances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "…select…" ON public.terms_of_use_acceptances FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
CREATE POLICY "…insert…" ON public.terms_of_use_acceptances FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));
REVOKE ALL ON TABLE public.terms_of_use_acceptances FROM anon, authenticated, public;
GRANT SELECT ON TABLE public.terms_of_use_acceptances TO authenticated;
GRANT INSERT (project_id) ON TABLE public.terms_of_use_acceptances TO authenticated;
```

Resulting ACL, read back: table `{postgres=arwdDxtm/postgres,service_role=arwdDxtm/postgres,authenticated=r/postgres}`;
column `project_id` `{authenticated=a/postgres}`; `user_id` and `accepted_at` no column ACL.

**Results through PostgREST** (request as sent by postgrest-js, response as received):

| # | Call | Wire form | Result |
|---|---|---|---|
| A1 | `.upsert({ project_id }, { ignoreDuplicates: true })`, first time | `POST /terms_of_use_acceptances` · `Prefer: resolution=ignore-duplicates` · body `{"project_id":"…"}` | **201**, no error |
| A2 | the same, repeated | same | **201**, no error, no second row |
| A3 | `+ onConflict: 'user_id,project_id'`, repeated | `POST …?on_conflict=user_id%2Cproject_id` | **201**, no error |
| A4 | `+ .select('project_id, accepted_at')`, new project | `Prefer: resolution=ignore-duplicates, return=representation` | **201**, one row, `accepted_at` stamped by the database |
| A5 | the same, repeated | same | **201**, `data: []` (a duplicate returns no row — do not `.single()` this) |
| **A6** | `.upsert({ project_id })` **with default options** | `Prefer: resolution=merge-duplicates` | **403 `42501` permission denied for table** |
| B1 | `.insert({ project_id })`, repeated (the fallback form) | `POST`, no `Prefer` | **409 `23505`** `duplicate key value violates unique constraint "terms_of_use_acceptances_pkey"` |
| C1 | `.insert({ project_id, user_id: <another user> })` | — | **403 `42501`** |
| C2 | `.upsert({ project_id, accepted_at: '2000-01-01…' }, { ignoreDuplicates: true })` | — | **403 `42501`** |
| D1 | own row, `.select('accepted_at').eq('project_id', A).maybeSingle()` | `GET …?select=accepted_at&project_id=eq.…` | 200, the row |
| D2 / D3 | another user, same query / all rows | — | 200, `null` / `[]` |
| E1 / E2 | anon select / anon insert | — | **401 `42501`** |
| F1 / F2 | update own row / delete own row | `PATCH` / `DELETE` | **403 `42501`** (D-04) |

SQL PostgREST generated for A1 (from the server log, `log_statement = all`), which is why the grant suffices —
the INSERT column list is the body's keys and nothing else:

```sql
WITH pgrst_source AS (INSERT INTO "public"."terms_of_use_acceptances"("project_id") SELECT "pgrst_body"."project_id"
FROM (SELECT $1 AS json_data) pgrst_payload, LATERAL (SELECT "project_id" FROM json_to_record(pgrst_payload.json_data)
AS _("project_id" uuid) ) pgrst_body  ON CONFLICT("project_id", "user_id") DO NOTHING RETURNING 1) SELECT …
```

and for A6: `… ON CONFLICT("project_id", "user_id") DO UPDATE SET "project_id" = EXCLUDED."project_id" …`, which
needs UPDATE privilege and is why it is refused.

The same statements were also run as SQL under `SET LOCAL ROLE authenticated` with a `request.jwt.claims` sub:
plain insert `INSERT 0 1`; `ON CONFLICT DO NOTHING` with and without a conflict target `INSERT 0 0` on a
duplicate; `RETURNING` works; forged `user_id` / `accepted_at`, UPDATE, DELETE and anon each
`ERROR: permission denied for table terms_of_use_acceptances`.

**What this fixes for the plan:**

1. **Use the ignore-duplicates upsert; the fallback is not needed.** D-05's fallback was conditional on failure,
   and it did not fail.
2. **`ignoreDuplicates: true` is mandatory.** The default upsert is refused (A6). A writer unit test must pin
   the option, because the failure appears only on a repeat and only against a real database.
3. **A forged column is refused by the column privilege, not by RLS.** The pgTAP assertion for "a forged
   `user_id` is refused" is `throws_ok(…, '42501', …)`, not a silent-no-op pattern.
4. **`REVOKE ALL` before the grants is load-bearing** — see § *Hidden gates* H-4.
5. **`scopedFrom` has no `upsert`** — see § *Hidden gates* H-2 for the two ways through.

### R-2 — D-12: a fixed row's explicit `confirmed` beats the default — **confirmed**

`[VERIFIED: packages/dev-seed/src/supabaseAdminClient.ts, bulkImport]` — verbatim:

```ts
const CONFIRMABLE_TABLES = new Set(['organizations', 'candidates', 'factions', 'alliances', 'nominations']);
…
if (isConfirmable && !('confirmed' in stripped)) {
  stripped.confirmed = true;
}
```

`confirmed` is a permitted key for `candidates` `[VERIFIED: packages/dev-seed/src/template/permittedKeys.ts —
the `candidates:` list contains `'confirmed',` and `'terms_of_use_accepted',`]`. **No built-in template sets
`confirmed` on any candidate today** `[VERIFIED: measured — the census script below reports `explicitConfirmed: []`
for all 31 templates]`, so the two edited rows will be the first; `packages/dev-seed/tests/templates/base.test.ts`
holds two "has NO terms_of_use_accepted" cases that become "is seeded `confirmed: false`" cases.

### R-3 — D-13: which seeded rows change visibility, and what depends on them `[VERIFIED: measured]`

**Population, by command** (re-run at plan time; it imports `BUILT_IN_TEMPLATES` and prints every template
that has a fixed candidate row lacking the key, an explicit `confirmed`, or synthetic candidates):

```bash
cd packages/dev-seed && ../../node_modules/.bin/tsx -e "import('./src/templates/index.ts').then(({ BUILT_IN_TEMPLATES }) => { for (const [name, tpl] of Object.entries(BUILT_IN_TEMPLATES)) { const frag = (tpl as any).candidates ?? {}; const fixed = frag.fixed ?? []; const missing = fixed.filter((c: any) => !('terms_of_use_accepted' in c)).map((c: any) => c.external_id); const explicit = fixed.filter((c: any) => 'confirmed' in c).map((c: any) => c.external_id); if (missing.length || explicit.length || (frag.count ?? 0) > 0) console.log(name, 'fixed', fixed.length, 'count', frag.count ?? 0, 'withoutKey', JSON.stringify(missing), 'explicitConfirmed', JSON.stringify(explicit)); } console.log('templates', Object.keys(BUILT_IN_TEMPLATES).length); })"
```

Output at HEAD `44baab7a9` (exit 0):

```
default fixed 0 count 327 withoutKey [] explicitConfirmed []
e2e/base fixed 30 count 0 withoutKey ["test-e2e-base-ca-aa-hidden","test-e2e-base-ca-aa-unregistered"] explicitConfirmed []
templates 31
```

31 built-in templates. **Exactly two rows lack the key, both in `e2e/base`:**

| Row | `confirmed` | Nominations | Hidden today by |
|---|---|---|---|
| `test-e2e-base-ca-aa-hidden` | default `true` | `test-e2e-base-nom-reg-n-ca-aa-hidden` (default confirmed), parent `…nom-reg-n-or-aa` | the conjunct alone |
| `test-e2e-base-ca-aa-unregistered` | default `true` | `test-e2e-base-nom-reg-n-ca-aa-unregistered` (default confirmed), parent `…nom-reg-n-or-aa` | the conjunct alone |

- **`default` template:** 327 synthetic candidates, 0 fixed; its `candidates` override stamps the column on every
  row it emits `[VERIFIED: packages/dev-seed/src/templates/defaults/candidates-override.ts — the row literal
  ends `terms_of_use_accepted: '2025-01-01T00:00:00.000Z'`]`. **No row changes visibility.** Tests 28 and 29 of
  `tests/templates/default.test.ts` and the override's three-point comment go with the key.
- **All 29 perm / settings templates:** every fixed candidate carries the key (`buildCandidate` in
  `templates/e2e/perm/shared.ts` and the literal in `perm-localisation-positive.ts`). **No row changes
  visibility.**
- **`apps/supabase/supabase/seed.sql`:** the live default project holds one candidate ("Test Candidate",
  `confirmed = t`, column NULL) and **zero nominations in any project** `[VERIFIED: read-only SELECT on the
  running stack]`, so it is not public before or after.
- **A custom template using `candidates.count > 0`** (synthetic rows, no override) produces confirmed,
  nominated candidates without the column. Those are invisible to voters today and **become visible** after
  TOU-02. That is the intended direction (it removes the trap the override's comment describes) and affects no
  built-in template.

**What depends on the two rows.** CO-Reg-N holds 15 candidate nominations, 7 of them under Party AA. Today 13
and 5 are visible.

| Assertion (`tests/tests/specs/voter/voter-journey.spec.ts`, verbatim) | Today | After D-12 + D-13 |
|---|---|---|
| `await expect.soft(partyAA.getByTestId(testIds.voter.results.cardSubcard)).toHaveCount(5);` | 7 − 2 = 5 | 7 − 2 = 5 |
| `partyAA.getByRole('button', { name: /Show all 5/i })` (three uses) | 5 | 5 |
| `await expect.soft(cards).toHaveCount(13);` | 15 − 2 = 13 | 15 − 2 = 13 |
| `await expect.soft(hiddenCandidates).toHaveCount(0, { timeout: TIMEOUTS.element });` | hidden | hidden |

No count changes, so `SOFT_ASSERTION_BUDGETS` (`'specs/voter/voter-journey.spec.ts': 136`) is untouched as long
as only comments are edited. **Three comments in that spec are wrong or about to be** and should be corrected in
plan 2 (Comment Hygiene: a comment describes the code as it is): `"Party AA has 6 nominal members; 1 hidden
(test-ca-aa-hidden via terms_of_use_accepted absent) → 5 visible."` (it is 7 nominal, 2 hidden);
`"Expect to see 14 candidates minus the one who is hidden"` (15 minus 2); `"(termsOfUseAccepted=false)"`.

**Scheduling.** Playwright puts a project in the first phase in which all its dependencies have finished, and
runs phases one after another `[VERIFIED: node_modules/playwright/lib/runner/index.js, createPhasesTask —
`if (projectsThatShouldFinishFirst.find((p) => !processed.has(p))) continue;`]`. So:

| Phase | Projects that touch the two rows |
|---|---|
| 1 | `data-setup-base` (seeds them) |
| 2 | `voter-journey` (the four assertions above), `auth-setup`, `data-setup-candidate-journey`, the other voter leaves |
| 3 | `candidate-journey` [`contestant-journey`] (registers the unregistered row and accepts G), `candidate-a11y-scan`, `cold-entry-dataroot-candidate` |

`voter-journey` therefore finishes before the unregistered candidate registers. **Today** that candidate turns
public in phase 3 when the journey accepts the terms; nothing in phase 3 or later asserts voter-side counts on
`e2e/base` (the perm family reseeds its own datasets). **After the phase** it never turns public, because
nothing confirms it. The dataset becomes more stable, not less.

**Does any spec assert that candidate's voter-side visibility after registration? No.**
`git grep -n -i -E "Unregistered|aa-unregistered" -- tests/tests/specs tests/tests/fixtures tests/tests/setup`
returns only `candidate-journey.spec.ts`, its fixture defaults and its setup / teardown; the journey itself
never leaves the candidate app (its steps 1–22 navigate only under `/candidate/…`).

**Verdict on D-13's open choice: neither.** The registration helper does not need to confirm the row and no
count is adjusted. The journey does not need the row confirmed either: the candidate reads its own row through
the third disjunct of `authenticated_select_candidates` (`user_can('entity', id, 'entity.read_answers',
'candidate'::public.entity_type)`) and its own nomination through `nomination.read`, both independent of
`confirmed` `[VERIFIED: apps/supabase/supabase/schema/302-rls.sql]`; the frontend reads `confirmed` nowhere
(`git grep -n -w confirmed -- apps/frontend/src` finds no entity-flag read). One residue is assumed, not
measured — A1 in the *Assumptions Log* (the portrait of an unconfirmed candidate in the journey's preview step).

**The gap in D-14 this measurement exposed.** `tests/tests/specs/perm/perm-localisation-positive.spec.ts`
registers with `client.sendEmail(…)` (the email flow, not `forceRegister`) and then goes straight to
`/en/candidate/profile`. Its own docblock says why that works today: `"Candidate login: seeded candidate has ToU
pre-accepted but NO auth.users row"`. After plan 1 that user has no acceptance row and meets G, and
`candidateProfilePage.expectQuestionsVisible(…)` fails. See pitfall P-6 for the fix.

### R-4 — D-18: the second stored session for the axe scan

**How the wiring stands** `[VERIFIED: tests/playwright.config.ts]`:

- `export const STORAGE_STATE = path.join(TESTS_DIR, '../playwright/.auth/user.json');`
- project `auth-setup`: `testMatch: /[\\/]auth\.setup\.ts$/`, `dependencies: ['data-setup-base']`. One test,
  `setup('register + authenticate as base candidate', …)` in `tests/tests/setup/shared/auth.setup.ts`, which
  calls `unregisterCandidate` then `forceRegister(TEST_CANDIDATE_EXTERNAL_ID, …)`, logs in through the real
  form and writes the file.
- project `candidate-a11y-scan` [`contestant-a11y-scan`]: `testMatch: /candidate-a11y\.spec\.ts/`,
  `use: { ...devices['Desktop Chrome'], storageState: STORAGE_STATE }`,
  `dependencies: ['data-setup-base', 'auth-setup']`. It is also named in
  `data-setup-perm-1e1cg1co`'s `dependencies`, so the scan finishes before the perm family replaces the
  `app_settings` singleton.
- `tests/playwright/` is gitignored (`tests/.gitignore`: `playwright*/`), so session files are run artefacts.
- An existing precedent for a second session constant: `ADMIN_STORAGE_STATE` is declared in
  `tests/tests/utils/adminCredentials.ts` and re-exported from the config, "which is also what
  `admin-auth.setup.ts` writes through, so the project that reads the file and the setup that writes it" share
  one declaration.

**What pins it** `[VERIFIED: scripts/assert-a11y-scan-wiring.mjs]`: check 1 requires, inside the project's own
block, `testMatch` for the spec file **and** the text `storageState: STORAGE_STATE` (regex
`/storageState:\s*STORAGE_STATE/`); check 3 requires the project name in `data-setup-perm-1e1cg1co`'s
dependencies; check 4a forbids a spec-local `AxeBuilder`. So the project-level `storageState` must stay as it is.

**Least invasive wiring (recommended):**

1. **Writer:** a second `setup(…)` test in the same `auth.setup.ts`, so it rides the existing `auth-setup`
   project and its phase (2), with no new project and no new dependency edge. It registers the never-accepting
   identity with the D-14 opt-out, logs in through the form, waits for `terms-of-use-submit` to be visible
   (the first test's `expect(page).not.toHaveURL(/.*login.*/)` alone would pass on a half-loaded page), and
   writes a second file. `[CITED: playwright.dev/docs/auth — a setup file with several `setup(…)` tests, each
   writing its own `storageState` file]`
2. **Reader:** inside `candidate-a11y.spec.ts`, a `test.describe` block with
   `test.use({ storageState: <second file> })` holding the two gate scans (light, and a nested
   `test.use({ colorScheme: 'dark' })` twin, the idiom the file already uses). `[CITED: playwright.dev/docs/auth
   — "specify `storageState` for each test file or test group, instead of setting it in the config"]` The
   project-level default stays, so the wiring guard stays green with **no change to the guard**.
3. **Constant:** declare the second path and the identity beside `TEST_CANDIDATE_*` in
   `tests/tests/utils/testCredentials.ts` (the `ADMIN_STORAGE_STATE` precedent), so 173-E2 adds a third
   identity by adding a row, not by re-plumbing. Making `auth.setup.ts` iterate a small table of
   `{ externalId, email, storageStatePath, acceptTermsOfUse, settledTestId }` is what makes the mechanism
   reusable for the multi-grant user.
4. **Cleanup:** `tests/tests/setup/shared/base.teardown.ts` unregisters `TEST_CANDIDATE_EMAIL` before the row
   wipe; the second identity needs the same line, or its `auth.users` row outlives the dataset and the next
   run's `forceRegister` fails with "User already exists" (the setup's own `unregisterCandidate` first makes it
   self-healing, as it does for the first identity).

**The scan entry.** `assertCandidateReach` needs a `postLoginTestId` "this surface renders ONLY when a candidate
session is live". On G the home logout (`candidate-home-logout`) is **not** rendered — it lives in
`(protected)/+page.svelte`, which G replaces — so the existing home marker cannot be reused. Use
`testIds.candidate.terms.submit` (`'terms-of-use-submit'`, rendered only by the protected layout) and
`testIds.candidate.terms.checkbox` (`'terms-checkbox'`) as the anchor / marker pair
`[VERIFIED: tests/tests/utils/testIds.ts — `terms: { checkbox: 'terms-checkbox', … submit: 'terms-of-use-submit' }`]`.
`routeId` is the home route (`'CandAppHome'` [`'ContestantAppHome'`]); G renders at any protected URL.

**Identity.** `test-e2e-base-ca-aa-hidden` fits every constraint: it is not CA-AA-1 (whose one editor grant
`auth-setup` holds; `idx_grants_one_candidate_editor` admits one), not the row the journey registers, and under
D-12 it is `confirmed: false`, so granting it an editor in phase 2, in parallel with `voter-journey`, cannot
change what voters see. The gate renders before any entity loads, so its being unconfirmed is irrelevant.

**Expected test-count delta** (snapshot arithmetic, re-derive): `auth-setup` 1 → 2, `candidate-a11y-scan`
14 → 16; suite 171 → 174 if nothing else changes.

### R-5 — D-09: what runs in what order today, and the order to build

**Today, for a request to a protected candidate page** `[VERIFIED: by reading each file named]`:

1. `apps/frontend/src/hooks.server.ts`, `appGateHandle`: resolves the app gate by route id; **no session** on a
   `(protected)` route → redirect to the login route with `redirectTo`. A session passes; this is "a session
   gate, not a role gate".
2. `routes/+layout.server.ts` (Supabase cookies) → `routes/+layout.ts` (builds the client; awaits app
   customization, then app settings, elections and constituencies).
3. `routes/candidate/+layout.server.ts` → `{ session: { userId, expiresAt } | null }`.
4. `routes/candidate/(protected)/+layout.server.ts`, `load`:
   1. `locals.safeGetSession()`; no session → `redirect(307, …'CandAppLogin')`.
   2. `dataWriter.getCandidateUserData({ loadNominations: true })`, which runs `_getBasicUserData()`
      (`auth.getUser()`, `auth.getSession()`, `readGrants` → `role`), then
      `.rpc('get_candidate_user_data', …).single()`, then the nominations read. Any throw is caught and becomes
      `undefined` → `handleError('loginFailed')`.
   3. `if (role !== 'candidate') return await handleError('userNotAuthorized');`
   4. `if (!candidate) return await handleError('userNoCandidate');`
   5. no election or constituency id among the nominations → `handleError('candidateNoNomination')`.
   6. `dataProvider.getQuestionData(…)`; return `{ questionData, candidateUserData: userData }`.
   `handleError` signs out (`locals.supabase.auth.signOut({ scope: 'local' })`) and redirects to login with
   `errorMessage`.
5. `routes/candidate/(protected)/+layout.svelte`: `validity` (`'error'` unless question data, candidate and
   nominations are all present) → `layoutState` → `'terms'` only when
   `!validity.candidate.termsOfUseAccepted && !termsSubmitted`. An `$effect` has already written the question
   and entity data into the `DataRoot` and called `userData.init(…)` by the time the form shows.

**Two facts about step 4 that change how D-09 is read:**

- **`userNoCandidate` and `userNotAuthorized` are unreachable as wired.** `_getCandidateUserData` throws on a
  missing row — `if (error || !entityRow) throw new Error(`Failed to load candidate data: ${error?.message ??
  'no data'}`);` after `.single()` — so a user with no editor grant in the project leaves at step 4.2 as
  **`loginFailed`**, never reaching 4.3 or 4.4. `[VERIFIED: supabaseDataWriter.ts, `_getCandidateUserData`]`
  "Move the two sign-outs below the gate" therefore means **move the whole `getCandidateUserData` call below
  the gate**, with its `loginFailed` outcome. Otherwise a user with no entity is still signed out before G,
  against D-09's judgement call.
- **Password login already refuses a user without a candidate grant** (`passwordLogin({ …, allowedGrants:
  CANDIDATE_GRANTS, … })` in `routes/candidate/login/+page.server.ts`; that file's docblock says the shared
  helper "owns the sign-in, the session read-back, the claims decode and the grant-shape gate" — the helper
  itself was not read), so the no-entity case reaches the
  protected layout only through a session established elsewhere (the auth callback, or a grant deleted after
  sign-in). No E2E spec depends on any of the four error codes
  (`git grep -n -E "candidateNoNomination|userNoCandidate|userNotAuthorized" -- tests/tests` → no hits).

**The order to build** (one server load, three stages):

| Stage | Runs | Outcome when it fails or applies |
|---|---|---|
| 1. Session | `locals.safeGetSession()` | no session → `redirect(307, login)` (unchanged) |
| 2. User-level data | `dataWriter.getBasicUserData()` — now carrying `termsOfUseAccepted` (D-06) | throws (`'No active session'`: the token did not verify) → `handleError('loginFailed')`. This is the only sign-out above the gate, and it is a user-level one |
| 3. Gate list | the first needed entry of the ordered list, decided on stage-2 data only | needed → **return** `{ user, gate }` with **no entity data**; stages 4–5 do not run |
| 4. Entity step — **one identifiable function** | `getCandidateUserData`, then the role, entity and nomination checks | today: sign out and redirect (`loginFailed` / `userNotAuthorized` / `userNoCandidate` / `candidateNoNomination`). 173 swaps this one step to "render a view"; 176 removes the nomination arm |
| 5. Question data | `dataProvider.getQuestionData(…)` | unchanged |

**Rerun after acceptance.** Use `invalidateAll()` from `$app/navigation` after `acceptTermsOfUse()` resolves:
"Causes all `load` and `query` functions belonging to the currently active page to re-run. Returns a `Promise`
that resolves when the page is subsequently updated." `[VERIFIED: node_modules/@sveltejs/kit (2.70.3)
types/index.d.ts]` The gate keeps its loading state until that promise resolves; when it does, `data` carries
the entity payload and the list has no needed entry. It is the idiom the tree already uses
(`goto(…, { invalidateAll: true })` in the context's `logout`, `exchangeCodeForIdToken`, `preregister`); there
is no bare `invalidateAll()` and no `depends(…)` anywhere in `apps/frontend/src` today
(`git grep -n -E "invalidateAll\(|invalidate\(|depends\(" -- apps/frontend/src ':!*.test.ts'` → only the test
stub). A narrower `depends('…')` + `invalidate('…')` pair is available on a server load in this SvelteKit
version and would spare the root load's four reads; it is not worth a new idiom for an action that happens once
per user per project.

**Cost to name in the plan.** `_getCandidateUserData` calls `_getBasicUserData()` itself, so after the change an
accepted user's protected load runs it twice (two `auth.getUser()` round trips and two acceptance reads). Either
accept that until 173 reshapes the call, or let the entity read take the already-fetched user. See *Open
Questions* Q-2.

### R-6 — Todos (TOU-03, D-16..D-18)

`grep -l -i -E "terms.of.use|terms_of_use|TOU-" .planning/todos/pending/*.md` → four files:
`2026-08-27-147-empty-answer-candidate-states-unscanned.md`, `2026-08-27-147-tou-gate-modal-unscanned.md`,
`2026-08-28-fold-migrations-for-byte-parity.md`, `2026-09-03-datawriter-row-erasure-absorbs-rpc-nullability.md`.
None is about confirming an entity whose editor has not accepted, so fact 16 holds and D-16's standalone file
is correct. `.planning/todos/pending/` holds 187 files.

`2026-08-27-147-tou-gate-modal-unscanned.md` carries `resolves_phase: 172`. Three of its statements are false
after this phase and D-18 requires the closing note to say so: the surface is an in-layout view, not a "modal";
its lever ("log a scan entry in as `test-e2e-base-ca-aa-hidden`") no longer works by itself, because acceptance
left the candidate; and its line citations are stale. The known-gaps table in `candidate-a11y.spec.ts`
(`"terms-of-use gate modal (`(protected)/+layout.svelte`) | CA-AA-1 carries `terms_of_use_accepted` | …"`) loses
that row in plan 3, and loses its `terms_of_use_accepted` string for D-21's census.

## Hidden gates — standing checks the new table and the removals trip

Each is a gate in `yarn lint:check`, `yarn db:lint:sql`, pgTAP or the unit suite. None is named in CONTEXT.md.

### H-1 — `lint-schema.mjs` check 9001: the two policies are `reaches_neither` (ERROR)

`[VERIFIED: apps/supabase/scripts/lint-schema.mjs, SQL_PERMISSION_SEPARATION]` The check reports a policy that
names no `grant_permission` member and reaches no function in `MECHANISM_HELPERS`, unless it is listed in
`REACHES_NEITHER_ALLOW`. The helper reach is computed over functions in `public` and `private` only
(`WHERE n.nspname IN ('public', 'private') AND p.prokind = 'f'`), and `auth.uid` is in neither. Checked
read-only against the live catalogue: no function in `public` / `private` matches the text
`(user_id = ( SELECT auth.uid() AS uid))` (0 rows), and **no policy in `public` or `storage` mentions
`auth.uid()` today** (0 of 102) — these will be the first two self-row policies in the estate.

**Required:** two entries in `REACHES_NEITHER_ALLOW`, in its existing shape (`['public', 'grants',
'auth_admin_read_grants']`), each with its reason written beside it. The file says of these lists: "THESE THREE
LISTS ARE A SECURITY SURFACE … An entry added later without a stated reason is the form in which a gate is
quietly widened until it guards nothing". The reason to write: acceptance is a statement a user makes about
themself, so the only question the policy can ask is identity; the grant model has no permission for it (D-05:
no definer function, and the accepted property that the policy does not check the project).

`identical_predicate` (the read policy equal to a write policy) does **not** fire: it compares `qual`, and an
INSERT policy has no `qual`. Baseline today: `0 error(s), 3 warning(s)`, census `policies examined: 102, tables
partitioned: 19, permission members: 23 (row-level-security tables in public+storage: 29)`; expect 104 policies.
Not executed against the new table (it would need DDL on the shared stack) — derived from the script's SQL.

### H-2 — `assert-project-scoped-queries.mjs` and `ProjectScopedTable`

`[VERIFIED: scripts/assert-project-scoped-queries.mjs; apps/frontend/src/lib/api/adapters/supabase/supabaseAdapter.type.ts]`
The table carries a `project_id` foreign key to `public.projects`, so:

- it joins `const PROJECT_SCOPED_TABLES = [ 'admin_jobs', 'alliances', 'app_settings', 'candidates',
  'constituencies', 'constituency_groups', 'elections', 'factions', 'feedback', 'nominations', 'organizations',
  'question_categories', 'questions' ];` and the mirror union `export type ProjectScopedTable = | 'admin_jobs' |
  … | 'questions';` ("A table joins this union when it gains that foreign key."). A table literal in neither of
  the script's two lists is a hard failure (check 2), and a bare `this.supabase.from('<scoped table>')` in an
  adapter source is a violation (check 1);
- every read and write goes through `this.scopedFrom('terms_of_use_acceptances')`, which is also what D-06
  wants ("filled for this adapter's project (`this.projectId`)"): `select` gets `.eq('project_id', projectId)`
  appended and `insert` gets `project_id` supplied.

**`scopedFrom` offers `select`, `insert`, `update`, `delete` and no `upsert`**
(`export type ScopedTableAccess<TTable …> = { select: …; insert: …; update: …; delete: …; }`), and no adapter
source calls `.upsert(` today. Two ways to stay inside D-05:

| | How | Cost |
|---|---|---|
| (a) **recommended** | add an `upsert` member to `ScopedTableAccess` / `scopedFrom` that supplies `project_id` like `insert` and always passes `{ ignoreDuplicates: true }` | one more cast site in `scopedFrom`, of the same kind as the existing `writes` cast; `packages/dev-seed/tests/projectScopingGate.test.ts` is the spec to re-run |
| (b) | `scopedFrom(…).insert({})` and treat `error.code === '23505'` as success | no helper change; a repeat produces an HTTP 409 in the browser's network log. Measured (B1) |

(a) is D-05's stated form and R-1 showed its precondition holds. `insert({})` type-checks in (b) because
`user_id` and `accepted_at` have defaults and `project_id` is omitted from the helper's parameter
(`Omit<TablesInsert<TTable>, 'project_id'>`).

### H-3 — `assert-rpc-return-nullability.mjs` (plan 2)

`[VERIFIED: scripts/assert-rpc-return-nullability.mjs; packages/supabase-types/src/database.overrides.ts]`
Removing `terms_of_use_accepted` from `get_candidate_user_data`'s `RETURNS TABLE` requires, in the same commit:
the override `Nullable<'get_candidate_user_data', 'first_name' | 'last_name' | 'subtype' | 'sort_order' |
'terms_of_use_accepted'>` loses its last member (check 5: an override naming a column the schema no longer
declares is red); `packages/supabase-types/RPC-NULLABILITY.md` loses the column from its derived region
(`--write` regenerates it) **and** its hand-written disposition row (check 1b); and
`packages/supabase-types/src/column-map.ts` loses `terms_of_use_accepted: 'termsOfUseAccepted',`.

### H-4 — the default ACL

`[VERIFIED: read-only `pg_default_acl` on the running stack]` New tables in `public` get
`anon=arwdDxtm`, `authenticated=arwdDxtm`, `service_role=arwdDxtm`. Without `REVOKE ALL ON TABLE … FROM anon,
authenticated, public` first, the column-level INSERT grant constrains nothing ("Column-level REVOKE is
ineffective when table-level UPDATE exists", `303-column-grants.sql`), `authenticated` keeps UPDATE and DELETE
privilege, and `anon` holds SELECT. The precedent is `REVOKE ALL ON TABLE public.grants FROM authenticated, anon,
public;` in `300-auth-tables.sql`. `service_role` keeps its privileges through the revoke (measured), which
`forceRegister` relies on.

`36-entity-identity.test.sql` censuses "Every column of a foreign key to auth.users, on a table where anon holds
SELECT on that column and either row-level security is off or a SELECT policy names anon or PUBLIC" and allows
only `ARRAY['public.nominations.created_by']`. The new `user_id` stays out of it only if `anon` holds no SELECT
**and** no policy names `anon` — both true under D-05. `16-anon-visibility.test.sql` pins the number of public
anon SELECT policies at `13`; a policy `TO anon` on the new table would redden it.

### H-5 — count-based pgTAP dependents a `terms_of_use` grep does not find (plan 2)

| File | Assertion (verbatim description) | Change |
|---|---|---|
| `09-column-restrictions.test.sql` | `'authenticated holds UPDATE on exactly 11 columns of candidates'` | 11 → 10 when the column leaves the grant in `303-column-grants.sql` |
| `21-entity-organization.test.sql` | `'get_candidate_user_data declares 14 output columns'` | 14 → 13 when the RPC column goes |

There may be more of this kind; they were found by reading exact-number expectations, not by an exhaustive
method. **The pgTAP run after the contract is the instrument** — plan for it to find stragglers.

### H-6 — the unindexed-foreign-key advisor (WARNING, non-fatal)

The primary key leads with `user_id`, which covers that foreign key; `project_id` is covered by no index, so
`lint-schema.mjs` check 0001 would report a fourth warning beside today's three. `lint:all` runs the script
without `--strict`, so it does not fail the gate, but the checklist asks for it ("New tables have B-tree indexes
on `project_id` and any FK columns") and the TOU-F01 join reads by project. Add
`idx_terms_of_use_acceptances_project_id`. `200-indexes.sql` precedes any 3xx file in concatenation order, so
if the table is declared in a 3xx file its index goes beside it (as `idx_grants_scope_target` does in
`300-auth-tables.sql`).

## Schema workflow in this repo

`[VERIFIED: scripts/assert-schema-migration-parity.mjs; apps/supabase/supabase/config.toml; root package.json;
.claude/skills/database/SKILL.md]`

- **Source:** `apps/supabase/supabase/schema/*.sql`, 26 files today, numbered by concern (`0xx` types and
  functions, `1xx` content tables, `200` indexes, `3xx` auth and RLS, `400` storage, `5xx` RPCs, `900` test
  helpers). `config.toml` sets `[db.migrations] schema_paths = []`, so the CLI never reads this directory.
- **Generated copy:** `apps/supabase/supabase/migrations/00001_initial_schema.sql`, byte-identical to
  `cat schema/*.sql` in filename order. `yarn schema:regenerate`
  (= `node scripts/assert-schema-migration-parity.mjs --write`) writes it; `yarn assert:schema-migration-parity`
  (in `lint:check`) fails on one differing byte **and on a second `.sql` file under `migrations/`**. Never
  hand-edit it. The script's own obligation (D-17 there): read the regenerated diff in the same commit.
- **Apply:** `yarn db:reset` (`supabase db reset`: the one migration, then `seed.sql`). A schema edit is not
  live until this runs; it destroys local data.
- **Types:** `yarn db:types` = `supabase gen types typescript --local --workdir ../../apps/supabase >
  src/database.ts && prettier --write src/database.ts`, read **from the running database**, so it must follow
  the reset. CI diffs the result against the committed file.
- **Lint:** `yarn db:lint:sql` = `supabase db lint --schema public --fail-on warning` + `node
  scripts/lint-schema.mjs`. Both read the applied database (default `127.0.0.1:54322`).
- **pgTAP:** `yarn workspace @openvaa/supabase test:db` (`supabase test db`). 36 files in
  `apps/supabase/supabase/tests/database/` (`00-helpers` plus 35 planned files; planned assertions sum to 1326:
  `grep -h -o -E "plan\s*\(\s*[0-9]+\s*\)" *.sql | grep -o -E "[0-9]+" | paste -sd+ - | bc`). Each file:
  `BEGIN; SET search_path = public, extensions; DROP TABLE IF EXISTS __tcache__; SELECT plan(N); SELECT
  create_test_data(); … SELECT * FROM finish(); ROLLBACK;`. Impersonation is `set_test_user('authenticated',
  test_user_id('candidate_a'), test_user_grants('candidate_a'))`, which sets `request.jwt.claim.sub`, so
  `auth.uid()` resolves for the new policies. Fixture: project A open, project B not — the pair criterion 2's
  "A does not count in B" assertion needs.
- **Conventions that bind the new table:** `(SELECT auth.uid())` scalar-subquery form; an explicit `TO
  authenticated` on every policy; policy names `{role}_{operation}_{table}`, so
  `authenticated_select_terms_of_use_acceptances` and `authenticated_insert_terms_of_use_acceptances`; index
  names `idx_{table}_{column}`; a commit that changes the database carries the `[db]` tag
  (`.agents/code-review-checklist.md`).
- **The skill is stale in places.** `.claude/skills/database/SKILL.md` describes "264 planned pgTAP assertions
  across 10 planned test files" and "Migrations … (3 files)" in its body while its own frontmatter says 102
  policies and a 1086-assertion estate; `schema-reference.md` opens "Complete column listing for all 17 tables".
  Measured today: 19 public tables, 102 policies (87 public + 15 storage), 36 pgTAP files. D-19 updates the two
  reference files; correct the counts it touches, do not propagate the old ones.

**Where to put the table (discretion).** A new file that sorts after `100-tenancy.sql` (it references
`public.projects`) works; so does `300-auth-tables.sql`, whose header is "The grant model" and whose `grants`
table is the only other one keyed on `auth.users`. Recommendation: a **new `3xx` file of its own** holding the
table, its index, `ENABLE ROW LEVEL SECURITY`, both policies and the revoke / grants together, so the whole
departure from the grant model reads in one place and neither `302-rls.sql` nor `303-column-grants.sql` — both
of which Phase 171 or 173 may also edit — is touched in plan 1. Parity holds for any choice, because the
migration is regenerated. (A new file raises the parity guard's census from 26 files; its floors are minimums.)

### Being order-independent of Phase 171

171 and this phase overlap in files, not in content. 171's D-09 adds a function to `301-auth-functions.sql` and
grows the anon-definer census in `07-rpc-security.test.sql`; this phase edits `nomination_entities_confirmed`
in the same schema file and one fixture `UPDATE` in the same test file. Shared generated or edited files:
`migrations/00001_initial_schema.sql`, `packages/supabase-types/src/database.ts`,
`packages/dev-seed/src/templates/e2e/base.ts`, `templates/e2e/perm/shared.ts`, the two skill reference files.

A plan is order-independent if it obeys these rules:

1. **Start from parity.** First step of every schema plan: `yarn assert:schema-migration-parity` exits 0 on the
   starting tree. A red here means the other phase landed a schema edit without regenerating — stop and report.
2. **Never merge the generated files.** On any conflict in `00001_initial_schema.sql` or `database.ts`, take
   either side and regenerate: `yarn schema:regenerate`, `yarn db:reset`, `yarn db:types`. Resolve conflicts in
   `schema/*.sql` by hand; they are small and in different functions.
3. **Regenerate last, and read the diff.** After all `schema/` edits of the plan: regenerate, then confirm the
   migration diff contains this plan's hunks and no others (`git diff --stat`, then the hunks).
4. **State pgTAP `plan(N)` changes as deltas**, computed at run time ("this file loses k assertions"), never as
   absolute numbers. Today's values (`03`: 59, `05`: 22, `07`: 39, `09`: 32, `10`: 90, `16`: 52, `18`: 60,
   `20`: 46, `21`: 21, `25`: 41, `33`: 48) are snapshots; 171 moves `07`.
5. **Pick the new pgTAP file's number at run time** (next free; today the highest is `36`) and give it a
   content-bearing name, so a file 171 adds with the same number does not collide by name.
6. **Do not assert estate-wide totals** this phase does not own (policy count, table count, definer census).
   The one census this phase adds is its own (D-15).
7. **The same rules apply between plan 1 and plan 2** if 171 lands between them.
8. **172 → 173 stays strictly ordered** (CONTEXT.md): plan 2 here removes the RPC column 173 then reshapes.

## Census — every site, as re-runnable commands

```bash
# The whole population (D-21 closes on the first being empty)
git grep -n  "terms_of_use_accepted" -- ':!.planning'            # today: 159 lines in 44 files
git grep -l -i -E "terms_of_use|termsOfUse" -- ':!.planning'     # today: 75 files (includes the UI component family, which stays)
```

`termsOfUseAccepted` survives the phase as the new `BasicUserData` field (D-06); the components `TermsOfUse` /
`TermsOfUseForm`, the message group `dynamic.candidateAppPrivacy.otherTermsOfUse.*` and the test ids stay. D-21's
census is on the snake-case column name only.

| Area | Command | Sites today (anchor: symbol or quote) |
|---|---|---|
| **Schema — the column** | `git grep -n terms_of_use -- apps/supabase/supabase/schema` | `102-entities.sql` `CREATE TABLE public.candidates` (`terms_of_use_accepted timestamptz,` and the comment above it) |
| **Schema — the four conjuncts** | same | `302-rls.sql` `"anon_select_candidates"` and the public disjunct of `"authenticated_select_candidates"` (plus the two comments that describe "five conjuncts" and the terms-of-use rule); `301-auth-functions.sql` `private.nomination_entities_confirmed`, candidate arm (plus its header comment: "Anon-readable means the entity policy's own predicate, terms of use included … written in two places"); `400-storage.sql` `public.storage_path_is_public`, the `CASE WHEN p_type = 'candidates' THEN 'AND e.terms_of_use_accepted IS NOT NULL AND e.terms_of_use_accepted < now()'` string and the comment "the terms-of-use guards where the table has them" |
| **Schema — grant and RPC** | same | `303-column-grants.sql`: the candidates `GRANT UPDATE (…, terms_of_use_accepted, confirmed)` and the "Allowed columns" comment; `503-entity-rpcs.sql`: `get_candidate_user_data` `RETURNS TABLE (… terms_of_use_accepted timestamptz, …)`, `c.terms_of_use_accepted` in the candidate arm, `NULL::timestamptz` in the organization arm, and `get_entity_basic_data`'s "Withheld today: answers, terms_of_use_accepted, …" comment |
| **Storage policies** | `git grep -n terms_of_use -- apps/supabase/supabase/schema/400-storage.sql` | none in a policy; the one site is the helper above, reached by `anon_select_public_assets` |
| **Edge Functions, `seed.sql`, `900-test-helpers.sql`** | `git grep -n -i terms_of_use -- apps/supabase/supabase/functions apps/supabase/supabase/seed.sql` | none |
| **Generated migration** | `git grep -c terms_of_use_accepted -- apps/supabase/supabase/migrations` | 13 lines; regenerated, never edited |
| **Generated types and their satellites** | `git grep -n terms_of_use -- packages/supabase-types` | `src/database.ts` (candidates Row / Insert / Update; `get_candidate_user_data` Returns), `src/database.overrides.ts`, `src/column-map.ts`, `RPC-NULLABILITY.md` (three places) |
| **pgTAP** | `grep -n -i "terms_of_use\|terms of use\|terms-of-use" apps/supabase/supabase/tests/database/*.sql` | see § *pgTAP impact* |
| **Data writer** | `git grep -n -i termsOfUse -- apps/frontend/src/lib/api` | `base/dataWriter.type.ts` (`LocalizedCandidateData`, `EditableEntityProps`), `base/universalDataWriter.ts` (`updateEntityProperties` and its guard message "Either an image file or a value for termsOfUseAccepted is required for updating entity properties"), `adapters/supabase/dataWriter/supabaseDataWriter.ts` (`_getCandidateUserData`: `termsOfUseAccepted: entityRow.terms_of_use_accepted ?? null`; `_updateEntityProperties`: the `updateFields.terms_of_use_accepted` write, `const columns = 'terms_of_use_accepted, image';`, the returned `termsOfUseAccepted`; the comment in `_setPassword` about "the terms-of-use UPDATE that follows"), and `supabaseDataWriter.test.ts` (17 lines) |
| **Context and user-data store** | `git grep -n -i termsOfUse -- apps/frontend/src/lib/contexts` | `candidate/candidateUserDataState.svelte.ts` [`contestant/contestantUserDataState.svelte.ts`]: `#editedTermsOfUseAccepted`, `setTermsOfUseAccepted`, `resetTermsOfUseAccepted`, its arm of `#unsavedProperties`, its read in `current` and in `save()`; `…State.type.ts` (the two members); `…State.svelte.test.ts` (Tests 3, 5, 6, 7, 9, 10 and the mock writer) |
| **Protected layout** | `git grep -n -i -E "termsOfUse\|layoutState\|termsSubmitted" -- 'apps/frontend/src/routes/candidate/(protected)'` | `+layout.svelte` (`layoutState`, `termsAcceptedLocal`, `termsSubmitted`, `handleSubmit`, `validity`), `+layout.server.ts` (`load`, `handleError`), `termsOfUseLayout.svelte.test.ts` |
| **`TermsOfUseForm` and consumers** | `git grep -n -E "TermsOfUseForm\|TermsOfUse\b" -- apps/frontend/src` | the component family in `lib/candidate/components/termsOfUse/` [`lib/contestant/…`]; consumers: the protected layout and `routes/candidate/preregister/(authenticated)/email/+page.svelte` (`let termsAccepted = $state(false);` — left alone, D-11); `TermsOfUse` alone is also used by `routes/candidate/privacy/+page.svelte` |
| **`getBasicUserData` callers** (they all gain the read, D-06) | `git grep -n -E "getBasicUserData" -- apps/frontend/src ':!*.test.ts'` | `lib/auth/getUserData.ts`, `lib/server/admin/requireAdminIdentity.ts` (through `getUserData`), `routes/admin/(protected)/argument-condensation/+page.server.ts`, `routes/admin/(protected)/question-info/+page.server.ts`, and `_getCandidateUserData` |
| **dev-seed** | `git grep -n terms_of_use -- packages/dev-seed` | `src/template/permittedKeys.ts` (`candidates` list), `src/templates/defaults/candidates-override.ts` (the key and a three-point comment), `src/templates/e2e/base.ts` (28 stamped rows, 2 "DELIBERATELY absent" comments, the section comment), `src/templates/e2e/perm/shared.ts` (`buildCandidate`), `src/templates/e2e/perm/perm-localisation-positive.ts`, `src/supabaseAdminClient.ts` (two ⚠ comment blocks above `CONFIRMABLE_TABLES` that describe the conjunct), `tests/templates/base.test.ts`, `tests/templates/default.test.ts`, `tests/integration/default-template.integration.test.ts` |
| **E2E helpers** | `git grep -n -E "forceRegister\(\|unregisterCandidate\(\|terms_of_use" -- tests/tests ':!tests/e2e-runs'` | `utils/supabaseAdminClient.ts`: `forceRegister`, `unregisterCandidate` (step 3 reset), `deleteAllTestUsers` (the `'reset-terms-of-use'` step); `forceRegister` call sites: `setup/shared/auth.setup.ts` and the `perm-answers-locked`, `perm-closed-project`, `perm-disable-allow-open`, `perm-hide-hero`, `perm-question-video` setups; `setup/perm/perm-closed-project.setup.ts` (the explicit `client.update('candidates', …, { terms_of_use_accepted: … })`) |
| **E2E specs and fixtures** | `git grep -n -i -E "terms_of_use\|termsOfUse\|terms-of-use\|\.terms\." -- tests/tests` | `fixtures/candidate/candidateTermsOfUsePage.fixture.ts`, `fixtures/candidate/candidate-journey.ts`, `fixtures/candidate/perm-l10n.ts` (already exposes `candidateTermsOfUsePage`), `fixtures/candidate/candidatePreregisterPage.fixture.ts`, `specs/candidate/candidate-journey.spec.ts` (step 5 and the "no re-acceptance" expectations in steps 8 and 9), `specs/perm/perm-localisation-positive.spec.ts`, `specs/voter/voter-journey.spec.ts` (two comments), `specs/a11y/candidate-a11y.spec.ts` (the known-gaps row), `utils/testCredentials.ts` and `utils/candidateJourneyConstants.ts` (comments), `utils/testIds.ts` |
| **Docs** | `git grep -n -i -E "terms_of_use\|terms of use" -- apps/docs/src/routes/'(content)'/developers-guide/backend apps/docs/src/routes/'(content)'/developers-guide/candidate-app` | `backend/authentication/+page.md` ("A candidate must also have accepted the terms of use." and the column-grant paragraph), `candidate-app/registration/+page.md` [`contestant-app/…`] ("Accepting saves the time of acceptance in the candidate row's `terms_of_use_accepted` column."); the generated component pages follow `yarn workspace @openvaa/docs generate:docs` |
| **Skills** | `git grep -n terms_of_use -- .claude/skills` | `database/rls-policy-map.md` (§ *The eight entity SELECT assemblies*: "`candidates` alone carries two further conjuncts …"; § *Column-level restrictions*: the candidates row), `database/schema-reference.md` (`- terms_of_use_accepted: timestamptz`). Both also need the new table, its two policies and the corrected counts |
| **Messages** | `for l in da en et fi fr lb sv; do …; done` (see *Sources*) | all seven locales carry `dynamic.candidateAppPrivacy.consent.{acceptLabel,heroEmoji,ingress,title}` and `candidateApp.error.saveFailed`. **No new copy is needed** |

### pgTAP impact (D-15), file by file

`grep -n -i "terms_of_use\|terms of use\|terms-of-use" apps/supabase/supabase/tests/database/*.sql`

| File | What is there | Plan-2 action |
|---|---|---|
| `00-helpers.test.sql` | `create_test_data`: `INSERT INTO candidates (id, project_id, first_name, last_name, terms_of_use_accepted, confirmed) VALUES` and the comment above it | drop the column from the fixture insert |
| `03-anon-read.test.sql` | the NULL / future / past trio at the end of section 1 and two ephemeral candidates | delete the three cases and their fixtures; plan −3 |
| `05-organization-admin.test.sql` | the SELECT-predicate parity guard that strips `' AND (terms_of_use_accepted IS NOT NULL) AND (terms_of_use_accepted < now())'` and a companion pinning the stripped term to exactly two policies; two `get_entity_basic_data` projection checks naming the key | drop the strip; the companion ("carried by EXACTLY the two candidates SELECT policies") is deleted or inverted to zero; the projection check keeps passing (the key is simply absent) but its text should stop naming a column that no longer exists |
| `07-rpc-security.test.sql` | a fixture `UPDATE candidates SET confirmed = true, terms_of_use_accepted = now() - interval '1 day'` | drop the second assignment. 171 edits this file too |
| `09-column-restrictions.test.sql` | **no string hit** — `'authenticated holds UPDATE on exactly 11 columns of candidates'` | 11 → 10 (H-5) |
| `10-schema-migrations.test.sql` | column exists / is timestamptz / is nullable; candidate_a updates own; cannot update candidate_b's (7 assertions around 18 hits) | delete the block; plan −7 (re-count) |
| `16-anon-visibility.test.sql` | fixture insert; "every conjunct true … and terms of use accepted in the past"; "the terms-of-use conjunct, flipped alone"; the biconditional comment | drop the column from the fixture, reword the all-true case, delete the flipped-alone case |
| `18-entity-policies.test.sql` | the SELECT-family normaliser strips the same term; a companion pins it to "exactly TWO of the EIGHT entity SELECT policies" | drop the strip; delete or invert the companion |
| `20-storage-authority.test.sql` | case 13 (ALLOW, "All four conjuncts hold"), case 19 ("DENY, terms-of-use conjunct flipped alone") with its `UPDATE … SET terms_of_use_accepted = NULL` and the restoring update | reword 13; delete 19 and both updates |
| `21-entity-organization.test.sql` | **no string hit** — `'get_candidate_user_data declares 14 output columns'` | 14 → 13 (H-5) |
| `25-matrix-conformance.test.sql` | § 5 normaliser strips the term; `'eight-assembly guard, ABSOLUTE: both candidates assemblies carry the two terms-of-use terms'` (expects 2) | drop the strip; delete the absolute assertion. After this the eight assemblies are compared with no special case, which is the stronger guard |
| `33-entity-type-collision.test.sql` | a fixture candidate insert naming the column | drop the column from the insert |

D-15 adds: one new file for the table; one inverse census; one behavioural trio. For the trio, note
`nomination_cand_a` / `candidate_a` in project A already form an anon-visible candidate with a confirmed
nomination, and the fixture writes no acceptance row for anyone, so the "editor has no acceptance row" premise
holds by construction — assert it explicitly anyway (`SELECT count(*) = 0 FROM terms_of_use_acceptances`) so the
case cannot pass vacuously if a later fixture adds rows.

## Gate list (D-08, D-10) — the shape to build

**Constraints from the tree and the skills:**

- `(protected)` has a `+layout.server.ts` and no `+layout.ts`, so the load's return value reaches the layout as
  `data` unchanged, and it is serialised into the page. It already contains `user: BasicUserData`; adding
  `termsOfUseAccepted` to it discloses nothing new (`scripts/assert-no-session-in-loads.mjs` forbids returning
  the session binding, not user data).
- A server module cannot hold Svelte components, and the "needed?" decision must be made on the server
  (stage 3 of R-5). So an entry has two halves: a **predicate** in a plain `.ts` module both sides import, and a
  **view** the layout maps the entry's id to.
- Context rules (`CLAUDE.md` § Context Destructuring Rule; `.claude/skills/components/context-reactivity.md`):
  `t`, `logout`, `userData`, `setDataRoot` and a new arrow-field wrapper such as `acceptTermsOfUse` are stable
  references and may be destructured, as the layout does today
  (`const { setDataRoot, logout, t, userData } = getCandidateContext();`). Do not destructure `data`; read
  `data.<x>` inside `$derived`. Mutate the `DataRoot` only through `setDataRoot(updater)`, as the existing
  `$effect` does and explains.
- Component conventions (`Skill("components")`): a component under `lib/candidate/components/…`
  [`lib/contestant/components/…`] needs an `@component` docstring, a co-located `*.type.ts`, an `index.ts`
  barrel entry, and `yarn workspace @openvaa/docs generate:docs` re-run with its diff read.

**Recommended shape** (names are proposals — `[ASSUMED]`, discretion per CONTEXT.md):

```ts
// lib/contestant/gates/gates.ts — plain module, imported by the server load and the layout.
// Order is the contract: F (phase 178) and the email gate (phase 179) are inserted before this entry.
export const CONTESTANT_GATES = [
  { id: 'termsOfUse', isNeeded: (user: BasicUserData) => user.termsOfUseAccepted == null }
] as const;

export function firstNeededGate(user: BasicUserData) {
  return CONTESTANT_GATES.find((gate) => gate.isNeeded(user))?.id;
}
```

```ts
// (protected)/+layout.server.ts — stages 2 to 4 of R-5
const user = await dataWriter.getBasicUserData().catch(/* log */ () => undefined);
if (!user) return await handleError('loginFailed');

const gate = firstNeededGate(user);
if (gate) return { user, gate };            // user-level data only; the entity is not read

return await loadEntity({ user, … });        // the ONE step phase 173 swaps from sign-out to a view
```

```svelte
<!-- (protected)/+layout.svelte — the body reads as a list of gates, then the entity states -->
{#if data.gate === 'termsOfUse'}
  <TermsOfUseGate onAccepted={invalidateAll} />
{:else if layoutState === 'error'}
  <ErrorMessage class="bg-base-300" />
{:else}
  {@render children?.()}
{/if}
```

- With one entry an `{#if}` per gate id is the readable form; when 178 adds F, a `Record<GateId, Component>`
  lookup (`{@const View = GATE_VIEWS[data.gate]} <View … />`) keeps the body one line per concern. Either
  satisfies "an entry can be inserted before G without re-plumbing", because the order lives in
  `CONTESTANT_GATES` and nowhere else.
- The extracted view keeps the markup that is in the layout today: `MainContent` titled
  `t('dynamic.candidateAppPrivacy.consent.title')` [`dynamic.contestantAppPrivacy…`], the `HeroEmoji` figure,
  `<TermsOfUseForm bind:termsAccepted={…} />`, the `role="alert"` `data-testid="tou-save-error"` message with
  `t('candidateApp.error.saveFailed')` [`contestantApp.error.saveFailed`], Continue
  (`data-testid="terms-of-use-submit"`, `disabled` until ticked) and Logout. D-08 fixes the buttons and ids.
- `validity`, `layoutState` and the data-applying `$effect` stay as they are for the entity half; `layoutState`
  loses its `'terms'` member and `termsSubmitted` / `termsAcceptedLocal` / `handleSubmit` leave the layout.
- **After the change the gate renders with no entity data loaded** — `userData.init(…)` has not run and no
  question data is in the `DataRoot`. The chrome around it tolerates that: `CandidateNav` and `LogoutButton`
  read the context with optional chaining, and `#unansweredOpinionQuestions` returns `#opinionQuestions` when
  `savedCandidateData` is undefined. One visible consequence: the **header** logout on G signs out directly,
  where today (data loaded, an unregistered candidate with no answers) it opens the "unanswered questions"
  modal. That is a behaviour change on G itself; it is the more accurate behaviour and no spec exercises it,
  but it should be a stated outcome, not a surprise (A2).

**Unit tests this shape needs:**

- `termsOfUseLayout.svelte.test.ts` (rewritten, D-07): the fake context exposes `acceptTermsOfUse`; a rejected
  call shows `tou-save-error` and leaves `terms-of-use-submit` mounted; a resolved call invokes
  `invalidateAll` (spy through `vi.mock('$app/navigation', …)`; the default alias is the stub at
  `src/lib/i18n/tests/__mocks__/app-navigation.ts`, which already exports `invalidateAll`).
- A **new** server-load test, on the precedent of `routes/admin/layout.server.test.ts` (which drives a server
  `load` directly): with no acceptance the load returns the gate and **never calls** `getCandidateUserData`;
  with acceptance and no entity it reaches the entity step's outcome. This is the only test that can hold
  D-09's "the entity load's errors cannot pre-empt the gate".
- `gates.ts`: order and predicate.

## Project Constraints (from CLAUDE.md)

Directives that bind this phase's plans, extracted from `./CLAUDE.md` and `.agents/code-review-checklist.md`:

- **E2E hard rule.** No task proceeds or completes while any E2E test fails; no "known flaky"; "did not run"
  counts as a failure. Prefer the whole suite as the signal.
- **Run E2E through the wrapper:** `tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/<name> --no-db-reset`. It
  starts Supabase and its own dev server on the project the suite seeds; a plain `yarn dev` serves the default
  project. Nothing may be listening on the frontend port. Do not delete `tests/e2e-runs/`.
- **After a schema change:** regenerate the migration, `yarn db:types`, `yarn db:lint:sql`.
- **Comment Hygiene:** a comment describes the code as it is now; no historical narrative ("previously…",
  "was changed to…"); no planning references beyond a bare `see phase N`; no `D-NN` ids or `.planning/` paths
  in code. This phase deletes many comments that narrate the conjunct; their replacements must not say what
  used to be there. `yarn assert:comment-hygiene` runs in `lint:check`.
- **Context Destructuring Rule:** never destructure a reactive accessor; never alias `dataRoot`.
- **TypeScript strictly:** no `any`; explicit types; TSDoc on exported symbols.
- **Localisation:** every user-facing string in all seven locales. This phase adds none.
- **Accessibility:** WCAG 2.1 AA; the gate must be reached by the axe scan (criterion 5).
- **Canonical package paradigm, module resolution:** `yarn build` before running dependents; no new package.
- **Code-review checklist, Supabase part:** RLS on new tables; `(SELECT auth.uid())`; explicit `TO <role>`;
  B-tree indexes on `project_id` and FK columns; pgTAP transaction-boundary pattern; **every commit with a
  database change carries a `[db]` tag**. The checklist also asks for "at least the standard 5-policy pattern";
  this table deliberately has two (D-04, D-05) and its schema comment must say why.
- **Never commit sensitive data.** (The session's secret-read guard also blocks reading `.env`; plans must not
  ask an executor to print it.)
- **Never read a gate's status through a pipe** (standing rule, CONTEXT.md and project memory).

## Standard Stack

No library is added. The phase uses what is installed.

### Core (installed, verified in `node_modules` this session)

| Library | Version | Purpose here | Why standard |
|---------|---------|--------------|--------------|
| `@supabase/supabase-js` / `@supabase/postgrest-js` | 2.117.2 | the acceptance read and upsert through the adapter | the project's only data-access client |
| `@sveltejs/kit` | 2.70.3 | server `load`, `invalidateAll()` | project framework |
| `svelte` | 5.57.1 | runes, snippets, the gate view | project framework |
| PostgREST | 16.3 (image `public.ecr.aws/supabase/postgrest:v16.3`) | the wire the upsert crosses | the local stack's own |
| PostgreSQL | 17.6 | table, RLS, column grants | `config.toml` `major_version = 17` |
| Supabase CLI | 2.118.0 (`node_modules/.bin/supabase`) | `db reset`, `test db`, `db lint`, `gen types` | project tooling |
| `@playwright/test` | 1.63.0 | E2E, `storageState`, the axe scan projects | project tooling |
| `vitest` | 5.0.2 | unit tests | project tooling |
| `svelte-check` | 4.7.6 | `yarn workspace @openvaa/frontend typecheck` / `check` | project tooling |
| `turbo` | 2.11.4 | `build`, `typecheck`, `lint`, `test:unit` orchestration | project tooling |

### Alternatives Considered

| Instead of | Could use | Tradeoff |
|------------|-----------|----------|
| `invalidateAll()` | `depends('…')` on the protected server load + `invalidate('…')` | narrower rerun (spares the root load's four reads) at the price of the tree's first `depends`; not worth it for a once-per-user action |
| `upsert` on `scopedFrom` | plain `insert` + `23505` as success | no helper change, but an HTTP 409 on a repeat; D-05 conditions this form on the upsert failing, and it did not |

**Installation:** none.

## Package Legitimacy Audit

Not applicable: this phase installs no external package. **Packages removed due to [SLOP] verdict:** none.
**Packages flagged as suspicious [SUS]:** none.

## Architecture Patterns

### System Architecture Diagram

```
 Browser                          SvelteKit server                         Supabase
 ───────                          ────────────────                         ────────
 GET /contestant/<protected>
        │
        ▼
                           hooks.server.ts appGateHandle
                           session? ── no ──► 307 login (redirectTo)
                                  │ yes
                                  ▼
                           (protected)/+layout.server.ts load
                           1 safeGetSession ── none ──► 307 login
                           2 getBasicUserData ───────────────────────────► auth.getUser (verify)
                                  │                    ◄── own row or none ── terms_of_use_acceptances
                                  │  throws ──► sign out, 307 login            (RLS: user_id = auth.uid(),
                                  ▼                                             filter: project_id)
                           3 first needed gate?
                              ├─ yes ─► return { user, gate }      (entity is NOT read)
                              └─ no ──► 4 entity step ───────────────────► get_candidate_user_data, nominations
                                           ├─ no entity / no nomination ─► sign out, 307 login  (173 / 176 change this)
                                           └─ ok ─► 5 getQuestionData ───► get_questions
        ◄──────── data ───────────┘
 (protected)/+layout.svelte
   data.gate ─► gate view (TermsOfUseForm, Continue, Logout)
      │ tick + Continue
      ▼
   acceptTermsOfUse() ───────────────────────────────────────────────────► POST terms_of_use_acceptances
      │                                                                     Prefer: resolution=ignore-duplicates
      │                                                                     body {project_id}; user_id, accepted_at by DEFAULT
      ├─ error ─► role="alert" tou-save-error, form stays
      └─ ok ───► invalidateAll() ─► load reruns ─► no gate ─► children render at the URL first requested

 Voter side (unchanged path, one conjunct fewer)
 anon SELECT candidates / nominations / storage object ──► project open ∧ confirmed ∧ confirmed nomination
```

### Recommended Project Structure

Post-170 paths; today's are under `candidate/`.

```
apps/supabase/supabase/schema/
└── 3xx-terms-of-use.sql                     # NEW (discretion): table, index, RLS, policies, revoke/grants, in one file
apps/supabase/supabase/tests/database/
└── NN-terms-of-use-acceptances.test.sql     # NEW: self-insert, forged refused, cross-user, anon, A≠B, census, trio
apps/supabase/scripts/lint-schema.mjs        # REACHES_NEITHER_ALLOW: two reasoned entries
scripts/assert-project-scoped-queries.mjs    # PROJECT_SCOPED_TABLES: one entry
apps/frontend/src/lib/
├── api/adapters/supabase/supabaseAdapter{,.type}.ts      # ProjectScopedTable (+ upsert on scopedFrom, option a)
├── api/base/dataWriter.type.ts                           # BasicUserData.termsOfUseAccepted; acceptTermsOfUse
├── api/base/universalDataWriter.ts                       # acceptTermsOfUse(); _acceptTermsOfUse abstract
├── api/adapters/supabase/dataWriter/supabaseDataWriter.ts
├── contexts/contestant/contestantContext.svelte.ts       # acceptTermsOfUse arrow-field wrapper
└── contestant/
    ├── gates/gates.ts                                    # NEW: the ordered list
    └── components/termsOfUse/TermsOfUseGate.svelte (+ .type.ts, index.ts)   # NEW: the extracted view
apps/frontend/src/routes/contestant/(protected)/
├── +layout.server.ts                        # stages 1–5
├── +layout.svelte                           # gate list, then entity states
├── layout.server.test.ts                    # NEW
└── termsOfUseLayout.svelte.test.ts          # rewritten
tests/tests/
├── utils/supabaseAdminClient.ts             # forceRegister default + opt-out; a public acceptance helper
├── utils/testCredentials.ts                 # the second identity and its session path
├── setup/shared/auth.setup.ts               # second setup test
├── setup/shared/base.teardown.ts            # unregister the second identity
└── specs/a11y/contestant-a11y.spec.ts       # the gate scans, describe-scoped storageState
```

### Pattern 1: self-row table outside the grant model

**What:** a table whose only authority question is "is this row mine". Two policies `TO authenticated`, keyed
on `(SELECT auth.uid())`; identity and time supplied by column defaults; a column-level INSERT grant so the
caller can state neither.
**When to use:** only for a statement a user makes about themself. Everything else in this schema goes through
`user_can`.
**Example:** the SQL in R-1, measured. `[VERIFIED: measured]`

### Pattern 2: context wrapper for a writer call

**What:** an arrow-field on the context that builds a browser writer and calls it, so the layout holds a stable,
destructurable function.
**Example** (the existing idiom, `apps/frontend/src/lib/contexts/auth/authContext.svelte.ts`):

```ts
setPassword = async (opts: { password: string }): Promise<DataApiActionResult> => {
  const dw = prepareDataWriter();
  return dw.setPassword({ password: opts.password });
};
```

### Pattern 3: describe-scoped stored session

```ts
// Source: playwright.dev/docs/auth ("Multiple signed in roles")
test.describe(() => {
  test.use({ storageState: 'playwright/.auth/user.json' });
  // …
});
```

### Anti-Patterns to Avoid

- **Deciding the gate in the layout component from entity data.** That is today's defect (fact 6): the entity
  load's failures pre-empt the gate.
- **Flipping a local flag to pass the gate.** `termsSubmitted` advances the view without the entity ever being
  loaded once the gate precedes the entity load. The load must run again (D-09).
- **A default `.upsert(…)`.** Refused with `42501` (A6).
- **`.single()` on the upsert's returned rows.** A duplicate returns `[]` (A5).
- **A policy `TO anon`, or a missing `REVOKE`.** Both put an auth user id column in reach of `anon` and redden
  `36-entity-identity` and `16-anon-visibility`.
- **A definer function "for convenience".** D-05 excludes it, and it would move the `07-rpc-security` census.
- **Hand-editing `00001_initial_schema.sql` or `database.ts`.**
- **Bending an assertion to a count.** Re-derive the population; fix the cause.

## Don't Hand-Roll

| Problem | Don't build | Use instead | Why |
|---------|-------------|-------------|-----|
| "Who is accepting, and when" | client-supplied `user_id` or a client timestamp | `DEFAULT auth.uid()`, `DEFAULT now()` + the column grant | the caller cannot forge either; replaces `new Date().toJSON()` (fact 7) |
| Idempotent write | select-then-insert | `ON CONFLICT DO NOTHING` through `ignoreDuplicates: true` | race-free, one round trip, measured |
| Scoping the read to this project | a hand-written `.eq('project_id', …)` | `this.scopedFrom(…)` | the scoping guard forbids the bare form |
| Rerunning the load | a hand-rolled refetch of user data into the store | `invalidateAll()` | the server load is the single place the gate order is enforced |
| A second signed-in identity in E2E | a minted token or a hand-written cookie file | a real form login in `auth.setup.ts` + `storageState` | "synthetic tokens fail server-side `safeGetSession()` JWT validation" (the setup's own docblock) |
| The axe gate | a spec-local `AxeBuilder` | `assertAxeScan` from `tests/tests/utils/axeScan.ts` | the wiring guard forbids the former |
| Cleaning up acceptance rows | a delete in every teardown | `ON DELETE CASCADE` from `auth.users` and `projects` | `unregisterCandidate` deletes the user; the row goes with it (D-14) |

**Key insight:** every piece of this phase has an existing mechanism in the repo; the work is re-pointing, and
the risk is in the gates that watch the estate, not in the code written.

## Runtime State Inventory

The phase moves a fact from a column to a table, so the question "what still holds the old shape after every
file is updated" applies.

| Category | Items found | Action required |
|----------|-------------|------------------|
| Stored data | The applied local database carries `candidates.terms_of_use_accepted` until `yarn db:reset`. Live stack now: 3 projects, 1 candidate (`seed.sql`'s "Test Candidate", column NULL), 0 nominations, 2 auth users `[VERIFIED: read-only SELECT]`. Nothing is deployed, so no stored acceptance is migrated (standing rule) | `yarn db:reset` after each schema plan. A developer's locally registered candidate meets G once after the reset |
| Live service config | None. No external service holds this value; the auth redirect allowlist is not touched | None — verified by `git grep -n -i terms_of_use -- apps/supabase/supabase/config.toml apps/supabase/supabase/functions` (no hits) |
| OS-registered state | None | None — nothing registers this string with the OS |
| Secrets / env vars | None. No variable names the column or the gate | None |
| Build artifacts / generated files | `migrations/00001_initial_schema.sql`; `packages/supabase-types/src/database.ts`; `RPC-NULLABILITY.md` derived region; `apps/docs` generated component pages; `apps/frontend/src/lib/types/generated/translationKey.ts` (unaffected: no key changes); `tests/playwright/.auth/*.json` (gitignored, rewritten each run; a **stale second-session file from an earlier run is overwritten by `auth-setup` before the scan reads it**, since the scan depends on that project); the Vite / `.svelte-kit` cache of a running dev server | regenerate each by its command; restart the dev server (the E2E wrapper starts a fresh one) |

## Common Pitfalls

### P-1: the default upsert is refused
**What goes wrong:** `.upsert({ … })` without options sends `resolution=merge-duplicates` → `DO UPDATE` → `42501`.
**Why:** `authenticated` has no UPDATE privilege on the table, by design (D-04).
**How to avoid:** always `{ ignoreDuplicates: true }`; pin it in the writer's unit test.
**Warning signs:** acceptance works the first time and fails on a retry or a second tab.

### P-2: the gate is switched before the fixtures
**What goes wrong:** the moment the layout reads the table, every `forceRegister`-ed identity (the 14 scans,
`cold-entry-dataroot-candidate`, five perm setups) lands on G.
**How to avoid:** inside plan 1 the order is table → `db:reset` → types → **`forceRegister` default** → writer →
gate. The helper default is harmless while the gate still reads the column.
**Warning signs:** `candidate-a11y-scan` reach proofs fail naming `candidate-home-logout`.

### P-3: the column is dropped while the E2E helpers still write it
**What goes wrong:** `unregisterCandidate` step 3 and `deleteAllTestUsers` run
`.update({ terms_of_use_accepted: null })`; `perm-closed-project.setup.ts` runs `client.update('candidates', …,
{ terms_of_use_accepted: '2025-01-01T00:00:00.000Z' })`. Against a schema without the column PostgREST rejects
the request and the helper throws — in **every** setup that calls `unregisterCandidate` first.
**How to avoid:** these three leave in the same commit as the column (plan 2), together with every template
line and the `permittedKeys.ts` entry. (Whether `bulk_import` itself rejects a row that still states the key
was not checked; do not rely on it either way.)
**Warning signs:** `auth-setup` red with a "column … does not exist" / schema-cache message; everything after it
"did not run".

### P-4: a sign-out still sits above the gate
**What goes wrong:** only the two named `handleError` calls are moved; `getCandidateUserData` stays above the
gate and a user with no entity still leaves as `loginFailed`.
**How to avoid:** the gate decision uses `getBasicUserData()`; the entity read is below it (R-5). The new
server-load test asserts `getCandidateUserData` was not called.

### P-5: `lint:check` green, `db:lint:sql` red
**What goes wrong:** the parity guard passes, but check 9001 reports two `reaches_neither` errors.
**How to avoid:** H-1. And run `db:lint:sql` only after `db:reset`, or it lints the previous schema and passes.

### P-6: the localisation spec meets the gate
**What goes wrong:** `perm-localisation-positive.spec.ts` registers through `sendEmail`, gets no row, and stops
at G.
**How to avoid:** give the admin client one public helper that records an acceptance for a user in the client's
project; `forceRegister` calls it by default (D-14), and this spec calls it after `sendEmail` (the invited
`auth.users` row exists as soon as `inviteUserByEmail` returns). Rewrite the spec's docblock sentences that
explain the old mechanism. The alternative — walking G with the `candidateTermsOfUsePage` fixture the spec's
fixture set already exposes — also works, but changes what the spec claims ("login lands on the candidate home
directly").

### P-7: counts in pgTAP that a grep cannot see
See H-5. Budget a pgTAP iteration in plan 2.

### P-8: the D-15 census matches the table's own name
**What goes wrong:** "no function body in `public` or `private` contains `terms_of_use`" also matches
`terms_of_use_acceptances`. It is true today (D-05 adds no function) but goes red the day the Admin rule
(TOU-F01) joins the table from a function.
**How to avoid:** keep it as specified, and say in the assertion's description what a future legitimate
reference must do (narrow the pattern to the retired column name, or exempt by function name).

### P-9: `invalidateAll()` is not awaited, or the test never resolves it
**What goes wrong:** the button leaves its loading state before the new data arrives, or the unit test asserts
before the microtasks settle.
**How to avoid:** `await` it inside the submit handler; in the test, resolve the spy and flush as the existing
test does (`await Promise.resolve(); … flushSync();`).

### P-10: comments that narrate the removal
**What goes wrong:** "the terms-of-use conjunct was removed in …" fails Comment Hygiene.
**How to avoid:** rewrite the policy and helper comments to state the rule as it now is (three conjuncts; the
same for every entity type).

### P-11: stale dev server
A long-running Vite server serves stale SSR modules after edits of this size (project memory). The wrapper
spawns its own server and refuses a foreign listener; do not point the suite at a server started earlier.

### P-12: long gates in the foreground
Turbo gates and the E2E run can exceed a subagent's watchdog (project memory). Run them in the background and
poll; read the exit status from the command itself.

## Code Examples

### The table, its policies and grants
The block in R-1 is the measured form. Policy names to use: `authenticated_select_terms_of_use_acceptances`,
`authenticated_insert_terms_of_use_acceptances` (naming convention; the probe used placeholders, and a name
does not affect behaviour).

### The read and the write in the Supabase writer (shape only; new method names `[ASSUMED]`)

```ts
// In _getBasicUserData, after the verified user and role are known:
const { data: acceptance, error: acceptanceError } = await this.scopedFrom('terms_of_use_acceptances')
  .select('accepted_at')
  .maybeSingle();
// RLS returns the caller's own row; scopedFrom adds this adapter's project; the primary key makes it at most one.

// The write, option (a) of H-2:
const { error } = await this.scopedFrom('terms_of_use_acceptances').upsert({});   // helper adds project_id and ignoreDuplicates
if (error) throw new Error(`acceptTermsOfUse: ${error.message}`);
return { type: 'success' as const };
```

Measured equivalents: the read is D1, the write A1 / A2.

### `forceRegister` with the default and the opt-out (shape only)

```ts
async forceRegister(candidateExternalId: string, email: string, password: string,
                    options: { acceptTermsOfUse?: boolean } = {}): Promise<void> {
  // … create the user, write the grant (unchanged) …
  // inside the same try, so the existing compensating deleteUser also covers this step:
  if (options.acceptTermsOfUse !== false) {
    const { error } = await this.client.from('terms_of_use_acceptances')
      .insert({ user_id: user.id, project_id: this.projectId });
    if (error) throw new Error(`forceRegister: insert terms-of-use acceptance failed: ${error.message}`);
  }
}
```

The service role bypasses RLS and keeps ALL on the table after the `REVOKE` (`service_role=arwdDxtm`, measured).

## State of the Art

| Old approach | Current approach | When changed | Impact |
|--------------|------------------|--------------|--------|
| Acceptance as a column on the candidate, doubling as a visibility conjunct | Acceptance as a `(user, project)` row; visibility is `confirmed` + a confirmed nomination + an open project for every entity type | this phase | organizations and multi-entity users can accept; the Admin rule becomes a join |
| Client clock (`new Date().toJSON()`) | `DEFAULT now()` | this phase | the timestamp is the server's |
| Acceptance rides the composite `save()` | a dedicated `acceptTermsOfUse()` | this phase | an unverified answers read-back can no longer block it |

**Deprecated / outdated:** the dev-seed caution "THIS DEFAULT IS NOT SUFFICIENT FOR `candidates`" above
`CONFIRMABLE_TABLES`, and the `candidates-override.ts` comment "so the Candidates tab does not disappear" —
both describe the conjunct and go with it.

## Assumptions Log

| # | Claim | Section | Risk if wrong |
|---|-------|---------|---------------|
| A1 | The journey's preview step still shows the portrait of a candidate seeded `confirmed: false`. Basis: image URLs are built as `…/storage/v1/object/public/public-assets/<path>` on a `public = true` bucket, and the fixture asserts only that an `<img>` is visible. Not measured (needs an E2E run on the changed seed) | R-3 | `candidate-journey` step 21 fails; the remedy is the other branch of D-13 (the registration helper confirms the row), which then needs the phase-3 timing checked again |
| A2 | Rendering G with no entity data loaded leaves the header, the nav drawer and the header logout working (derived from reading `CandidateNav`, `LogoutButton` and the context's `$derived` chain) | Gate list | a runtime error or an axe finding on G; caught by the gate scan and the journey |
| A3 | No further count-based pgTAP assertion depends on the column or the RPC shape beyond the two in H-5 | H-5 | plan 2's pgTAP run is red on an unlisted file; cost is an iteration, not a redesign |
| A4 | Check 9001 behaves on the new policies as its SQL reads (two `reaches_neither` findings, no `identical_predicate`). Not executed against the table | H-1 | either an unneeded exemption (harmless but a widened list) or a third finding; `yarn db:lint:sql` after plan 1's reset settles it |
| A5 | The suite total moves 171 → 174 (one setup test, two scans) | R-4 | none; a planning aid only |
| A6 | Phase 171 adds no pgTAP file numbered `37` and no second edit to the functions this phase touches | Schema workflow | a rename or a small manual merge |
| A7 | Names proposed for new symbols and files (`CONTESTANT_GATES`, `firstNeededGate`, `TermsOfUseGate`, `acceptTermsOfUse` on the context, the `3xx` file) | Gate list, structure | none; all are discretion |
| A8 | An acceptance-read error in `_getBasicUserData` should not turn into an outage for the Admin app's `getBasicUserData` callers | Open Questions | see Q-2 |

## Open Questions (RESOLVED)

All four are resolved by the plans; each carries its resolution line.

1. **Q-1 — the write through `scopedFrom`: add `upsert`, or use `insert` + `23505`?**
   - What we know: both are measured; the helper has no `upsert`; D-05 names the upsert and conditions the
     fallback on failure.
   - What's unclear: whether widening a guarded helper is in proportion for one call site.
   - Recommendation: add `upsert` (option a). If the planner prefers (b), say so in the plan as a choice inside
     D-05, not as the fallback.
   - **RESOLVED (172-03, task 1; inside D-05):** option (a). `scopedFrom` gains an `upsert` member that
     supplies `project_id` and always sends ignore-duplicates; the `insert` + `23505` fallback is not used.

2. **Q-2 — `getBasicUserData` now costs one more read for every caller, and runs twice per protected load.**
   - What we know: four non-contestant call sites (Admin identity, two Admin page actions, `getUserData`); the
     entity read calls it again internally.
   - What's unclear: whether a failed acceptance read should throw (fails closed everywhere, including Admin)
     or log and yield `null` (the gate shows; the upsert is idempotent, so re-accepting is harmless).
   - Recommendation: log at `error` and yield `null`; accept the double call until 173 reshapes the entity
     read. D-06 fixes where the field is filled, so this is the only freedom left.
   - **RESOLVED (172-03, task 2; inside D-06):** a failed acceptance read is logged at error and yields
     `null`; it does not throw. The extra read per caller and the double call per protected load are accepted
     until Phase 173, and both are listed for the operator in 172-03's deviations.

3. **Q-3 — which plan removes the store members (D-07)?**
   - What we know: D-20 puts "the frontend type removal" in plan 2; after plan 1 the layout no longer calls
     `setTermsOfUseAccepted`. `_getCandidateUserData`'s read of `entityRow.terms_of_use_accepted` **must** go in
     the commit that removes the RPC column, because the generated types change under it.
   - Recommendation: plan 1 stops using the members; plan 2 deletes them with the column, the five store tests
     and the `updateEntityProperties` guard rewording, so plan 2's diff is "the removal alone".
   - **RESOLVED (172-04, then 172-05; D-07, D-20):** 172-04 (stage 1) stops using the store members; 172-05
     (stage 2) deletes them, together with the store tests about the field, the guard rewording and the
     writer's read of the column from the RPC row. That read leaves ahead of the RPC column, which is safe:
     the column itself is dropped in 172-07.

4. **Q-4 — the D-06 ambiguity (table read vs. the user-data RPC, against the 178-B1 note).** Inherited from
   CONTEXT.md, not resolved by research. D-06 stands unless the operator says otherwise before plan 1.
   - **RESOLVED (locked decision D-06; 172-03):** acceptance stays a table read, exposed as
     `BasicUserData.termsOfUseAccepted` and returned on the user-level object of the protected load, so Phase
     178's "password set" fact sits beside it whatever its source. It is recorded for the operator as a
     review point in 172-03's deviations; it is not open.

## Environment Availability

| Dependency | Required by | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node | everything | ✓ | v24.14.1 | — |
| Yarn | everything | ✓ | 4.18.1 | — |
| Docker + local Supabase stack `openvaa-local` | `db:reset`, `db:types`, `db:lint:sql`, pgTAP, E2E | ✓ | 13 containers up; Postgres 17.6; PostgREST 16.3 | — |
| Supabase CLI | schema workflow | ✓ | 2.118.0 (`node_modules/.bin/supabase`; not on `PATH` — call through `yarn workspace @openvaa/supabase …`) | — |
| `psql` | `lint-schema.mjs` shells out to it | ✓ | 17.6 (Homebrew) | — |
| Playwright + browsers | E2E | ✓ | 1.63.0 (last full run 2026-10-04 green) | — |
| Free frontend port | the E2E wrapper | ✓ | nothing listening on 5173 or 5273 at research time | the wrapper defaults to 5273 and refuses a foreign listener |
| Host disk | E2E artefacts | ✓ | 224 GiB free on `/` (the Docker VM's own disk was not measured) | project memory: `docker builder prune -af` first if a run dies with ENOSPC |

**Missing dependencies with no fallback:** none.
**Missing dependencies with fallback:** none.

**Not measurable in this session:** anything that needs the changed schema applied (pgTAP on the new table,
check 9001 on the new policies, the E2E suite on the reseeded base dataset). Those are the first runs of plan 1
and plan 2.

## Validation Architecture

`workflow.nyquist_validation` is absent from `.planning/config.json`, so this section applies.

### Test Framework

| Property | Value |
|----------|-------|
| Frameworks | vitest 5.0.2 (unit, jsdom for Svelte); pgTAP through `supabase test db`; Playwright 1.63.0 (E2E + axe) |
| Config files | `apps/frontend/vitest.config.ts`, `packages/dev-seed` vitest config, `tests/playwright.config.ts` |
| Quick run commands | `yarn workspace @openvaa/frontend test:unit` · `yarn workspace @openvaa/dev-seed test:unit` · `yarn workspace @openvaa/supabase test:db` |
| Full suite commands | `yarn test:unit` · `tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/<name> --no-db-reset` |

### Phase Requirements → Test Map

| Req ID | Behaviour | Test type | Automated command | File exists? |
|--------|----------|-----------|-------------------|-------------|
| TOU-01 | own-row insert succeeds; forged `user_id` → `42501`; another user's row unreadable; anon refused; a row for A is absent for B | pgTAP | `yarn workspace @openvaa/supabase test:db` | ❌ Wave 0 — new `NN-terms-of-use-acceptances.test.sql` |
| TOU-01 | the writer upserts with `ignoreDuplicates` and reads through `scopedFrom`; `BasicUserData.termsOfUseAccepted` is filled | unit | `yarn workspace @openvaa/frontend test:unit` | ⚠ `supabaseDataWriter.test.ts` exists; cases are new, and its `getBasicUserData` stub client must answer a table read |
| TOU-01 | no entity carries the field | census | `git grep terms_of_use_accepted -- ':!.planning'` → no output, exit 1 | n/a (D-21) |
| TOU-01 | the scoping and separation gates accept the table | gate | `yarn assert:project-scoped-queries` · `yarn db:lint:sql` | ✅ gates exist; their lists gain entries |
| TOU-02 | no policy qual, no function body mentions it | pgTAP census | `yarn workspace @openvaa/supabase test:db` | ❌ Wave 0 — in the new file |
| TOU-02 | an anon-visible candidate, its storage object and its `get_nominations` row, with no acceptance row for its editor | pgTAP | same | ❌ Wave 0 — in the new file |
| TOU-02 | the eight entity SELECT assemblies are identical with no special case | pgTAP | same | ✅ `05`, `18`, `25` (strip removed) |
| TOU-02 | voter-side counts on `e2e/base` unchanged | E2E | the full run; `voter-journey` | ✅ |
| TOU-02 | the two rows are seeded `confirmed: false`; no template states the key | unit | `yarn workspace @openvaa/dev-seed test:unit` | ✅ `tests/templates/base.test.ts`, `default.test.ts` (cases rewritten) |
| TOU-03 | one todo for the Admin rule exists and names TOU-F01 | file check | `grep -l "TOU-F01" .planning/todos/pending/*.md` → exactly one file | ❌ created in plan 3 |
| REG-12 | without acceptance the load returns the gate and does not read the entity; with it, the entity step runs | unit | `yarn workspace @openvaa/frontend test:unit` | ❌ Wave 0 — new `layout.server.test.ts` |
| REG-12 | a failed accept shows `tou-save-error` and keeps the form; a successful one reruns the load | unit | same | ✅ `termsOfUseLayout.svelte.test.ts` (rewritten) |
| REG-12 | gate order and predicate | unit | same | ❌ Wave 0 — `gates.test.ts` |
| REG-12 | a newly registered user meets G, accepts, lands on home; is not asked again after sign-out, password reset and sign-in | E2E | the full run; `candidate-journey` steps 5, 8, 9 | ✅ (steps exist and already assert "no re-acceptance") |
| Criterion 5 | G passes axe in both themes | E2E | the full run; `candidate-a11y-scan` | ❌ Wave 0 — two entries + the second session |
| E2E-03 | whole suite green, zero did-not-run | E2E | `tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/<name> --no-db-reset` | ✅ |

### Sampling Rate

- **Per task commit:** the workspace-level quick command for what the task touched (frontend unit ≈ seconds;
  pgTAP after a reset).
- **Per plan (D-20: each closes green):** `yarn lint:check`, `yarn db:types` with no diff, `yarn db:lint:sql`,
  pgTAP, `yarn test:unit`, `yarn build`, one full E2E run.
- **Phase gate:** D-21's list in order, plus the zero-hit census.

### Wave 0 Gaps

- [ ] `apps/supabase/supabase/tests/database/NN-terms-of-use-acceptances.test.sql` — TOU-01 behaviour, TOU-02
      census and trio
- [ ] `apps/frontend/src/routes/contestant/(protected)/layout.server.test.ts` — REG-12 ordering
- [ ] a unit test beside the gate list module — order and predicate
- [ ] new cases in `supabaseDataWriter.test.ts` — `acceptTermsOfUse`, the acceptance read, and its
      `getBasicUserData` stub
- [ ] `tests/tests/utils/testCredentials.ts` + `setup/shared/auth.setup.ts` — the second identity and session
- [ ] two entries in the contestant a11y spec, describe-scoped to the second session
- [ ] framework install: none

### Verification commands that work here

Exit statuses read from the command itself — no pipe, no `| tail`, no `| grep`.

| Gate | Command | Notes |
|---|---|---|
| Lint + typecheck + all `assert:*` | `yarn lint:check` | a chain: `turbo run lint && eslint tests && yarn typecheck:tests && yarn typecheck && …` through `assert:edge-function-env`. Includes schema-migration parity, the scoping guard, RPC nullability, comment hygiene, the a11y wiring guard and, after Phase 170, `assert:no-candidate-app-names` |
| Frontend svelte-check | `yarn workspace @openvaa/frontend typecheck` (or `check` for `--fail-on-warnings`) | part of `yarn typecheck` |
| Regenerate the migration | `yarn schema:regenerate` | then read the diff |
| Parity only | `yarn assert:schema-migration-parity` | read-only |
| Apply the schema | `yarn db:reset` | destroys local data; other agents share this stack |
| Types | `yarn db:types` then `git diff --exit-code -- packages/supabase-types/src/database.ts` | CI's own drift check |
| Schema lint | `yarn db:lint:sql` | needs the applied database; baseline `0 error(s), 3 warning(s)` |
| pgTAP | `yarn workspace @openvaa/supabase test:db` | after the reset |
| Unit | `yarn test:unit` | `assert:unit-coverage` then `turbo run test:unit` |
| Production build | `yarn build` | catches what typecheck and unit tests miss after file moves |
| Docs regeneration | `yarn workspace @openvaa/docs generate:docs` then `yarn workspace @openvaa/docs validate:links` | after adding the gate component |
| E2E | `tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/<name> --no-db-reset` | exit 0 green; 1 failures; 3 db prep; 4 readiness; 5 dev server or occupied port; 6 preflight; 7 preflight literals drifted; 130 interrupted. Evidence in `<run-dir>/summary.json` (`counts.failed`, `counts.didNotRun` must both be 0) |
| Closing census | `git grep terms_of_use_accepted -- ':!.planning'` | "clean" is **exit status 1 with no output** (`git grep` exits 1 when nothing matches); state that in the plan so a 1 is not read as a failure |

## Security Domain

`security_enforcement` is absent from `.planning/config.json`, so this section applies.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard control |
|---------------|---------|-----------------|
| V2 Authentication | no (unchanged) | Supabase Auth; the gate sits behind an already verified session |
| V3 Session Management | no (unchanged) | cookie sessions, `safeGetSession()` (verify, then read). The gate adds no session state |
| V4 Access Control | **yes** | RLS self-row policies + a column-level INSERT grant on the new table; removal of a visibility conjunct on four sites; the pgTAP file proves each cell |
| V5 Input Validation | yes, minimal | the only caller-supplied value is `project_id`, typed `uuid` and bound by a foreign key; the adapter supplies it from validated configuration (`resolveProjectId`) |
| V6 Cryptography | no | none used |
| V8 Data Protection / privacy | yes | a consent record: server-stamped time, not client-stated; removed with the user or the project by cascade; not readable by `anon` or by another user |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard mitigation |
|---------|--------|---------------------|
| Recording acceptance on behalf of another user (forged `user_id`) | Spoofing | no INSERT privilege on `user_id` (measured `42501`), `DEFAULT auth.uid()`, and `WITH CHECK (user_id = (SELECT auth.uid()))` behind it |
| Back- or forward-dating acceptance | Tampering / Repudiation | no INSERT privilege on `accepted_at` (measured `42501`), `DEFAULT now()`; no UPDATE at all (D-04) |
| Withdrawing or altering a consent record | Repudiation | no UPDATE or DELETE privilege for `authenticated` (measured `42501`) |
| Reading who accepted (auth user ids) anonymously | Information disclosure | `REVOKE ALL … FROM anon, public`; no policy `TO anon`; guarded by the `36-entity-identity` census |
| Reading another user's acceptance | Information disclosure | SELECT policy on own rows (measured: `null` / `[]`) |
| Accepting for a project one has no grant in | Elevation of privilege (apparent) | accepted property (D-05): it unlocks nothing, every protected read stays grant-scoped; bounded by the foreign key to existing projects |
| Bypassing the gate by reaching a protected page directly | Elevation of privilege | the decision is in the server load of the layout every protected page sits under, before the entity is read; note it gates the **UI**, not the data API — a signed-in editor can still call PostgREST for their own entity without accepting, exactly as today |
| A stale token after a password change (`auth.uid()` NULL) | Denial of service (self) | fails closed: NULL `user_id` violates NOT NULL and the check; the user sees `tou-save-error` and can retry. The writer's `_setPassword` comment records the same hazard for the old UPDATE |
| Visibility widening by TOU-02 | Information disclosure (intended) | a decided consequence (D-13): a confirmed entity with a confirmed nomination in an open project is public whether or not anyone has signed in. `confirmed` is the lever; who sets it is Phase 174 / 175's subject |
| A widened exemption list in the schema linter | Tampering (of a guard) | two entries only, each with its written reason (H-1) |

## Sources

### Primary (HIGH confidence)

- **Measured this session:** PostgREST 16.3 + PostgreSQL 17.6 + postgrest-js 2.117.2 probe of the D-05 table
  (private instance, removed); the dev-seed template census over `BUILT_IN_TEMPLATES` (scratch `tsx` script);
  read-only catalogue queries on the running stack (`pg_default_acl`, `pg_policies`, `pg_proc`, table ACLs,
  row counts); `node apps/supabase/scripts/lint-schema.mjs` and `node scripts/assert-schema-migration-parity.mjs`
  baselines.
- **Read this session (source of truth for each cited value):** `apps/supabase/supabase/schema/`
  `102-entities.sql`, `300-auth-tables.sql`, `301-auth-functions.sql`, `302-rls.sql`, `303-column-grants.sql`,
  `400-storage.sql`, `503-entity-rpcs.sql`; `apps/supabase/scripts/lint-schema.mjs`;
  `scripts/assert-schema-migration-parity.mjs`, `assert-project-scoped-queries.mjs`,
  `assert-a11y-scan-wiring.mjs`, `assert-rpc-return-nullability.mjs` (header); the frontend files named in
  R-5 and the census; `tests/playwright.config.ts`, `tests/tests/setup/shared/{auth.setup,base.setup,base.teardown}.ts`,
  `tests/tests/utils/{supabaseAdminClient,testCredentials,testIds}.ts`,
  `tests/tests/specs/{a11y/candidate-a11y,candidate/candidate-journey,voter/voter-journey,perm/perm-localisation-positive}.spec.ts`,
  `tests/scripts/e2e-run.sh`; `packages/dev-seed/src/{supabaseAdminClient.ts,template/permittedKeys.ts,templates/…}`;
  `node_modules/playwright/lib/runner/index.js` (`createPhasesTask`);
  `node_modules/@sveltejs/kit/types/index.d.ts` (`invalidateAll`, `ServerLoadEvent`).
- `.claude/skills/database/{SKILL,extension-patterns,rls-policy-map,schema-reference}.md`,
  `.claude/skills/components/SKILL.md`, `CLAUDE.md`, `.agents/code-review-checklist.md`.
- `tests/e2e-runs/169-e2e/169-nodemailer-pin/summary.json` — the last full run.

### Secondary (MEDIUM confidence)

- [Playwright — Authentication](https://playwright.dev/docs/auth): several `setup(…)` tests writing different
  `storageState` files; `test.use({ storageState })` per file or per `describe`.

### Tertiary (LOW confidence)

- None relied on. (A summarised fetch of the SvelteKit `load` documentation contradicted the installed types on
  whether a server load may call `depends`; the installed types were used and the fetch discarded.)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new package; versions read from `node_modules` and the running containers.
- D-05 mechanism: HIGH — measured end to end on the stack's own PostgREST image and client.
- D-13 visibility: HIGH — measured over all built-in templates and read against the spec's assertions and
  Playwright's phase assignment; one residue assumed (A1).
- Gate order and structure: HIGH for what runs today (read); MEDIUM for the recommended shape (not built).
- Hidden gates: HIGH for H-2..H-6 (read or measured); MEDIUM for H-1 (derived from the SQL, not executed).
- pgTAP impact: MEDIUM — string-based sites are complete; count-based ones are found by inspection (A3).

**Research date:** 2026-10-05
**Valid until:** the execution of Phase 170 for every name, and of Phase 171 for `07-rpc-security.test.sql`,
`301-auth-functions.sql` and the generated files; otherwise about 30 days. Re-derive every population at plan
time.
