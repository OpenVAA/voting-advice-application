# Phase 174: Invitations — Grants Defined in Advance - Context

**Gathered:** 2026-10-06
**Status:** Ready for planning — with **four items marked ⚠ OPERATOR REVIEW** (J1–J4 under
*Judgement calls*) and **one blocking research item** (RQ-1) that can change the auth configuration.

**Source of decisions:** `.planning/v2.16-DISCUSSION-POINTS.md` § *Phase 174 — Invitations: Grants
Defined in Advance* (plus § *Cross-phase picture*, X1–X3, and § *Additional notes*) — a shared checkbox
document covering Phases 170–179 that the operator filled in one pass (committed as `e4813bf65`). Its
rule: an unticked decision accepts the `★ RECOMMENDED` option; a ticked box overrules the ★;
`**EDIT:**`/`**NOTE:**` free text beats every box.

In Phase 174's own 24 decisions the operator ticked **one box, an overrule of the ★**, and wrote no
EDIT or NOTE text inside the section:

1. **174-A3 → (c): "A general grant spec `(scope, target_type, target_id, role)`, or a child table of
   grants per invitation"**, instead of the ★ "one row promises one `(entity, <type>, <id>, editor)`
   grant". The option's own text carries the warning this file is built around: *"The seeding path must
   then re-implement 'who may grant what', which the matrix reserves to `project.manage_editors` and
   `account.manage_admins`."* See D-04 (shape), D-07 (duplicate rule), D-09 (authority).

Choices made **outside** this section that change what this phase builds or the names it builds against:

2. **170-A5 → (b)** — the auth pair is at the neutral `api/auth/{callback,logout}`; only `preregister`
   is under `api/contestant/`. The callback this phase wires the claim into is **shared with the Admin
   app** (D-14).
3. **171-A3 → (b)** — the settings are `contestantApp.entityTypes` and
   `contestantApp.registrationModes`. This phase's database functions do not read them (cross-phase
   note → 171 / 178).
4. **173-B5 → (b)** — a signed-in "nothing to edit — contact support" screen exists. It is where a user
   lands whose claim wrote no contestant grant (D-19).
5. **175-B2 / 175-B3 NOTE — not settled.** The operator's stated direction: identity provider →
   candidate confirmed, organization **not** confirmed; **code or email → candidate confirmed AND
   organization confirmed**; name changes (first, last, short, name) gated on `!entity.confirmed` for
   all types; `lock_nominations` affects nominations only. Bears on D-11 (INV-05).
6. **175-B5 → (b) + NOTE, 177-B5 → (b)** — the nominations lock moves to `app_settings`
   (`access.nominationsLocked`). No effect on this phase.
7. **178-B1 ★ + NOTE** — the "password set" fact rides the user-data retrieval RPC. It requires that a
   link-created user really has no password, which this phase's link issue decides (RQ-2).
8. **Additional note 1** — the `preregister` route becomes `register` with an identity-provider subroute
   (Phases 178–179). This phase adds no route.
9. **X2 → ★ (a), untouched** — identity-provider registration never claims an invitation in v2.16.
   **The roadmap assigns filing the todo to this phase** (obligation O-9).
10. **X3 → ★ (a)** — `REQUIREMENTS.md` and `ROADMAP.md` were amended on 2026-10-05. Both carry an
    `⚠ UNRESOLVED` marker on INV-02 / criterion 2. D-07 proposes the resolution.

Every other decision takes its ★ option as written, except where the ★ text assumed the 174-A3 ★ or a
fact Phases 170–173 have since changed. Those places are rewritten **and flagged inline as "reconciled
with <id> overrule" / "reconciled with Phase N outcome"**. The full list is under *Reconciliations* at
the end of `<decisions>`.

<domain>
## Phase Boundary

An admin can attach an email or a registration code to a grant ahead of time, and the person who later
proves that email or code receives exactly the grant the invitation defined — no more, and nobody else.
Requirements **INV-01, INV-02, INV-03, INV-04, INV-05**, plus **E2E-03** as closing criterion. Depends
on Phase 173 (the grant constraints an invitation writes against). The roadmap gives this phase **no UI
hint**: it adds no screen.

It delivers the model and **both of its ends**:

- **the model** — a `public.invitations` table whose rows each promise one grant in `public.grants`'
  own four columns, bound to an email or to the hash of a server-generated code;
- **seeding** — `create_invitations`, an admin-callable SQL RPC that enforces who may promise which
  grant, refuses duplicates, returns generated codes once and confirms a named entity target;
- **claiming** — `claim_invitations`, one `SECURITY DEFINER` function that writes the promised grants
  for the caller's own confirmed address, followed by a session refresh;
- **the server contract Phase 178's screens consume** — one anon-callable Edge Function offering
  `check code → valid | used | unknown`, `request link`, and `code sign-in`;
- **the wiring** — the claim plus the refresh in the existing auth callback and login action, so that
  the existing journey registers through a seeded invitation;
- **the removal** of `invite-candidate`, its client contract, its docs and its exemption in the app-name
  gate.

**Not in this phase:** every screen (A, B, C, D1, D2, E, F — Phase 178); any Admin-app screen
(roadmap criterion 1); the registration-mode matrix as a server-side condition (178-A4); the recovery
mail and FIX-01 (178-C5, 178-F1); the "password set" field (178-B1); identity-provider registration and
its pending address (Phase 179); announcing invitations by mail (todo, D-12); an organization inviting
its candidates (`entity.invite_children`, deferred).

### Roadmap success criteria (ROADMAP.md § Phase 174, as amended 2026-10-05)

1. Through an admin-callable write path — no Admin-app screen is in scope — an admin seeds an invitation
   for a candidate or an organization with either an email or a registration code, stating the grant its
   user will receive; a caller without admin authority over the project is refused (INV-01).
2. A second invitation with the same email, or the same code, for the same target is refused, and the
   first is left unchanged (INV-02). **⚠ UNRESOLVED in the roadmap — resolved by D-07, pending operator
   review (J2).**
3. A user who proves the invitation's email or code ends up holding exactly the grants the invitation
   defines; a user who proves neither gets none of them, and an invitation cannot be claimed into
   another user's account (INV-03).
4. A code that has been used is still on record: presenting it again is answered as already used,
   leading to password sign-in, rather than as an unknown code or an error, and it grants nothing a
   second time (INV-04).
5. An entity seeded with a name and an email or a registration code is confirmed from the moment it is
   seeded; one seeded without either stays unconfirmed, and so invisible to voters, until an admin
   confirms it (INV-05).
6. The full E2E suite is green at close (E2E-03), the existing invitation and registration specs
   included, re-pointed at the new model wherever it replaces the old path.

### Standing rules (ROADMAP.md § v2.16, inherited by every phase)

- **Cardinal rule:** no failing E2E test, no exemptions; a "did not run" counts as a failure. E2E-03 is
  a closing criterion of this phase.
- **Localisation:** every user-facing string ships in all seven locales (`da, en, et, fi, fr, lb, sv`).
  **A mail is a user-facing string** (D-20, J4).
- **Accessibility:** every new or changed screen meets WCAG 2.1 AA and is reached by the axe scan. This
  phase adds no screen; a changed redirect must not strand a scanned route.
- **Both entity types:** a criterion that says "user" or "entity" holds for candidates and for
  organizations unless it names one.
- **Nothing is deployed:** the schema, the settings shape, the routes and the symbols change in place.
- **Schema edits are serial.** 171, 172, 173, 174, 175 and 177 each edit `schema/*.sql` and regenerate
  the single migration file. 174 ∥ 175 are independent in content; whichever runs second regenerates.

</domain>

<decisions>
## Implementation Decisions

Decision ids map one-to-one onto the discussion document's Phase 174 ids, given in parentheses.
24 decisions → D-01..D-24. Each entry states the chosen option, and under **If wrong** what an attacker
or a defect could do if the decision were implemented otherwise. Security is the centre of this phase:
the planner carries every "If wrong" line into the plan's threat model.

Names are those on the tree after Phase 170 (see *Name map*). Paths under `schema/`, `functions/` and
`tests/database/` are relative to `apps/supabase/supabase/`.

### 0 — Factual baseline

- **D-01 (174-0.1):** Accept all 20 facts of 174-0 as the baseline; restated under
  `<factual_baseline>` **with the corrections Phases 170–173 made to facts 1, 2, 5, 6, 7, 12, 14, 15, 17
  and 18** (reconciled with Phase 170, 171, 172 and 173 outcomes). The facts are a 2026-10-04 snapshot
  at `df0cec944`; the planner re-reads the tree.

### A — Mechanism and scope

- **D-02 (174-A1) ⚠:** **A `public.invitations` table**, holding the promised grant plus an email or a
  code hash, claimed by one `SECURITY DEFINER` function after a GoTrue emailed-link sign-in. **No auth
  user and no grant exists until a link is requested and the claim runs.** One model serves the email
  and the code mode; duplicates are refused by table constraints, not by GoTrue's "already registered".
  **If wrong** (pre-creating users, option (c)): every invited address is an existing account, so
  GoTrue itself answers which addresses were invited; and a grant written at invite time is authority
  held by an identity nobody has proved.
- **D-03 (174-A2) ⚠:** **This phase reaches the frontend as far as the wiring, and no further.** It
  builds the table, the seeding path, the claim, the code check, the link-request and code-sign-in
  endpoint, and wires the claim plus a session refresh into the existing auth callback and the login
  action. **No new screen, no new route, no new message key for a screen.** The set-password page stays
  `contestant/register/password` until 178. `contestant-journey.spec.ts` registers through a seeded
  invitation at this phase's close.
  *Reconciled with the Phase 171 outcome:* the registration-code guard
  (`routes/contestant/register/registrationCodeGuard.ts`, `isRegistrationCodeLeg`) exempts "the
  set-password page reached with a session and no registration key", which is where every invitation
  lands. That exemption must still hold after this phase's callback change; the planner keeps the
  landing on that leg.
  **If wrong** (database only, option (b)): the claim path reaches Phase 178 untested, together with
  seven new screens, and criterion 6's "re-pointed at the new model" is met by nothing.
- **D-04 (174-A3) — OVERRULE → (c). ⚠ OPERATOR REVIEW (J1).** **An invitation row promises one grant,
  stated in `public.grants`' own four columns: `(scope, target_type, target_id, role)`.** The shape is
  the **single-row general spec**, not the child table. Settled here from the section's other decisions
  and the tree:
  - **The table mirrors `grants` column for column**, with the same types
    (`grant_scope_type`, `entity_type`, `uuid`, `grant_role_type`) and the same two CHECKs as
    `grants_entity_scope_target_type_check` and `grants_target_id_scope_check`. The claim is then one
    `INSERT INTO public.grants` of the row's four columns — nothing is derived, so "exactly the grants
    the invitation defines" (INV-03) is true by construction. The access-token hook already projects
    exactly these four keys.
  - **Every other ★ in the section assumes one row = one grant = one target**, and survives verbatim
    under the single-row shape: "a code names exactly one row" (174-B3), the row-level `claimed_by` /
    `claimed_at` (174-B4), the pending address "on the code's row" (174-D3), "each row is claimed or
    skipped by itself" (174-D6), "sets `confirmed = true` on its target" (174-C3), and the 174-A3 ★'s
    own "several grants for one person are several rows: every open row carrying the proven email is
    claimed in one call".
  - **The child table buys one thing, a single code that unlocks several grants**, which no v2.16
    requirement asks for (INV-01: "an entity with an email or a code"). It costs a partial-claim state
    split across two tables, a duplicate rule that no single index can express, and a rule for a parent
    left with no children when a target is deleted. Nothing is deployed, so adopting it later is an
    in-place change. Recorded under `<deferred>`.
  - **What the row may promise in v2.16** is fixed by the authority map of D-09, not by the columns.
  - Further fixed columns and constraints (each is a security control, not a convenience):
    `project_id uuid NOT NULL REFERENCES projects ON DELETE CASCADE`; a **project-scope promise names
    its own project** (`target_id = project_id`); an **entity-scope promise names an entity of that
    project** (checked through `private.entity_project_id` when the row is written **and again when it
    is claimed** — there is no foreign key); cleanup triggers on the four entity tables remove an
    invitation when its target goes, as `cleanup_grants_on_delete` does for grants.
  - **No API role may UPDATE a row.** A row's grant spec, address and code are immutable after insert;
    an admin changes an invitation by deleting an unclaimed one and creating another.
  **If wrong:** this is the decision that turns an invitation from "a candidate's editor grant" into "any
  authority in the instance". Without D-09 a project editor — who holds `project.edit_entities`, the
  ★'s only gate — seeds `(project, <own project>, admin)` for an address they control and promotes
  themselves. With an UPDATE path, an admin seeds a harmless row past the check and rewrites its spec
  afterwards. Without the claim-time project check, an entity deleted and re-imported under the same id
  in another project (ids are per table, not per project) hands its editor grant to the old invitee.

### B — The table

- **D-05 (174-B1) ⚠:** **`sha256` of the normalised code, hex, in `code_hash`. The plaintext is never
  stored and is returned once, by the seeding call.** PostgreSQL's built-in `sha256(bytea)` needs no
  extension (fact 20). `code_hash` is **not selectable by any API role**: admins never read it back; an
  admin who loses a code deletes the unclaimed invitation and seeds another.
  **If wrong** (plaintext): anyone who can read the table, a backup, a log line or a Studio session
  holds every unused registration credential of the project.
- **D-06 (174-B2):** **The server generates the code:** 12 characters from a 32-symbol alphabet without
  look-alikes (`0/O`, `1/I/L`), shown as `XXXX-XXXX-XXXX`, compared case-insensitively with separators
  and whitespace stripped. 60 bits. Normalisation is one SQL function used by the seeding call, the
  code check and the hash.
  *Planner constraints, flagged:* (i) **the randomness must be cryptographic and available without a
  new extension** — `pgcrypto` is not declared (fact 20) and `random()` is not acceptable;
  `gen_random_uuid()` is core. (ii) **`create_invitations` is `SECURITY INVOKER` (D-09), so the caller
  inserts as itself; a direct `INSERT` through PostgREST must not be able to plant a caller-chosen
  `code_hash`**, or the 60 bits are a convention. Close it (for example: no column `INSERT` grant on
  `code_hash` to `authenticated`, the hash filled by a trigger, the plaintext handed back to the RPC
  inside the transaction) or record why it is accepted.
  **If wrong** (admin-supplied or guessable codes): 174-D5's rate limit becomes the only defence, and it
  cannot see the client (D-18).
- **D-07 (174-B3) — rewritten; resolves INV-02 / criterion 2. ⚠ OPERATOR REVIEW (J2).**
  *Reconciled with the 174-A3 overrule:* the ★ words the rule per `(target_type, target_id, email)`,
  which names an entity. Under the general spec a **target** is the triple
  **`(scope, target_type, target_id)`**, read `NULLS NOT DISTINCT` as `grants` reads it. A duplicate is:
  - **Email:** a second row in the same project with the same normalised address **for the same
    target** — whatever its role. Enforced by one unique index over
    `(project_id, email, scope, target_type, target_id)`. The same address on **different** targets is
    allowed and is how one person is promised several grants. Emails are compared trimmed and
    lower-cased, and stored that way.
  - **Code:** a second row in the same project with the same `code_hash` — **whatever its target**. A
    code is looked up without a target, so it must resolve to one row. Enforced by a unique index over
    `(project_id, code_hash)`. Since the server generates codes (D-06), the RPC cannot produce this
    duplicate except by a 2⁻⁶⁰ collision, which it resolves by generating again; the index is what
    refuses a direct write. Criterion 2's "the same code … is refused, and the first is left unchanged"
    is asserted in pgTAP against the index.
  - **A claimed row still counts** in both rules: a used code is never reissued to someone else
    (INV-04), and an address is not promised the same target twice.
  - A row carries **exactly one** of `email` and `code_hash`. An email invitation and a code invitation
    for the same target may coexist, as may two codes for one target (two letters for one organization;
    for a candidate the second claim meets D-19).
  - **A batch is one transaction** (D-09): one duplicate refuses the whole batch and leaves every
    earlier row, in the table and in the batch, unchanged.
  - **Why the role is outside the key (the judgement):** INV-02 says "for the same target", and the
    only pair of roles that could share a target is project `editor` and `admin`, where the second is a
    superset. Including the role would mirror `grants_user_scope_target_role_key` instead. Either is a
    one-index choice; the operator confirms.
  - **Proposed wording for INV-02 and criterion 2** (the planner amends both and removes the
    `⚠ UNRESOLVED` marker once J2 is confirmed): *"A duplicate invitation is refused and the first is
    left unchanged: a second invitation in the project carrying the same email for the same grant target
    `(scope, target type, target id)`, or carrying a code the project already holds, whatever its
    target."*
  - *Known limit, flagged:* because a claimed row counts and cannot be deleted through the admin path
    (D-08), an admin who revokes a grant cannot re-invite the same address to the same target. Accepted
    for v2.16; the admin tooling that would lift it is out of scope.
  **If wrong** (code unique per target only): one code hash on two rows makes the code check ambiguous
  and lets a claim write two grants from one letter. (Code unique per instance, option (b)): one
  project's seeding fails because of another project's rows, which discloses them.
- **D-08 (174-B4):** **Nullable `expires_at`, no default. An unclaimed invitation is revoked by deleting
  it; a claimed one is kept and cannot be deleted through the admin path. `created_by`, `claimed_by` and
  `claimed_at` are recorded.** An expired unclaimed row is not claimable, and its code answers
  `unknown`.
  *Planner constraint, flagged (the ★ does not say what happens to `claimed_by` when the user is
  deleted):* **"claimed" is `claimed_at IS NOT NULL`, never `claimed_by IS NOT NULL`**, so that deleting
  the auth user cannot reopen an invitation; `claimed_by` and `created_by` go to `NULL` with their user.
  **If wrong:** an invitation that reopens when its claimant is deleted lets the next holder of the
  letter, or the next owner of the address, claim it — the replay INV-04 forbids.

### C — Seeding

- **D-09 (174-C1) ⚠ — rewritten. ⚠ OPERATOR REVIEW (J3).** **A SQL RPC,
  `create_invitations(p_project_id, p_invitations jsonb)`, `SECURITY INVOKER` over RLS policies on
  `invitations`; a batch is one transaction; it returns the created rows with each generated code in
  plaintext, once.** It needs no service role, and the E2E client, dev-seed and a later Admin app call
  the same function.
  *Reconciled with the 174-A3 overrule:* the ★'s single gate, `project.edit_entities`, is the right
  permission for an entity editor's grant and for nothing else. **The authority rule is a deny-by-default
  map, encoded once in SQL and enforced where the row is written — in the `INSERT` policy's
  `WITH CHECK`, not only in the RPC body — so a direct PostgREST insert meets the same rule:**

  | The row promises | The caller must hold | And |
  |---|---|---|
  | `(entity, <any of the four types>, id, editor)` | `project.edit_entities` on `project_id` | the entity belongs to `project_id` |
  | `(project, —, project_id, editor)` | `project.manage_editors` on `project_id` | `target_id = project_id` |
  | `(project, —, project_id, admin)` | `account.manage_admins` on the project's account | `target_id = project_id` |
  | `(account, …)`, `(global, …)` | **refused for every caller** | an invitation is project-scoped; no project owns an account or the instance |
  | `(entity, …, admin)`, and any shape `grant_role_permissions` maps to the empty set | **refused for every caller** | a promise of a grant that confers nothing |

  - Each permission is asked through `user_can`, the one predicate; no second copy of the matrix is
    written. The map names **which permission governs which promise**, which the matrix itself does not
    say — that mapping is the "re-implementation" the option text warns of, and it is asserted row by
    row in pgTAP, including the row "a project editor promising `(project, admin)` or
    `(project, editor)` is refused".
  - **Why project `admin` asks `account.manage_admins` (the judgement):** `rls-policy-map.md` gives
    `project.manage_editors` to project admins and `account.manage_admins` to account admins and root
    only. A project admin minting another project admin would be a peer-level grant the matrix does not
    hand them.
  - **The narrower alternative the operator may prefer:** accept only the first row in v2.16 and refuse
    project-scope promises until an Admin-app flow can claim them. Nothing in v2.16 drives a
    non-entity claim through a screen (D-14); the general shape would then be storage only. This file
    recommends the full map, because the roadmap states "the seeding path must itself enforce who may
    promise which grant" and a rule that exists is safer than a refusal someone later lifts without one.
  - `SELECT` on `invitations` is for callers who may seed in the project, **never** for entity editors or
    `anon`, and never includes `code_hash` (D-05). `DELETE` is for unclaimed rows only (D-08), under the
    same map. The table holds invitees' addresses: it is personal data, and its policies are tested as
    such.
  - `service_role` bypasses RLS as it does for every admin write, so the rule must not be an
    unconditional raise in the RPC body that the E2E helper (D-22) then cannot pass.
  **If wrong:** *a project editor seeding their own promotion* is the headline case — see D-04. Two
  quieter ones: an authority check only in the RPC body is bypassed by inserting into the table directly;
  and a caller of project A naming an entity of project B as the target obtains an editor grant across
  the tenant boundary unless the row's project and the target's project are compared.
  *Residual, recorded:* `user_can` reads the token claim, so a caller whose grant was revoked can still
  seed for up to `jwt_expiry`; and a promise outlives its seeder's authority, since the claim does not
  re-check `created_by`. Both are visible to an admin through the `SELECT` policy; claim-time
  re-validation of the seeder is under `<deferred>`.
- **D-10 (174-C2):** **The seeding call does not create the entity.** An entity-scope invitation targets
  an existing entity, named by id or by `external_id` within the project; entities are created by the
  existing paths (`bulk_import`, admin insert). Seeding a new entity with an invitation is two calls.
  *Reconciled with the 174-A3 overrule:* `external_id` resolution applies to entity-scope items only.
  **If wrong:** a function that also creates entities needs each entity type's column set and becomes a
  second, less-tested `bulk_import` with its own authority surface.
- **D-11 (174-C3) — INV-05.** **Creating an invitation sets `confirmed = true` on its target, in the
  same transaction, when the target is an entity that has a name** — candidate: first and last name;
  the other types: a non-empty localized `name`. The caller must hold `entity.confirm`, which the
  existing `enforce_entity_immutability` trigger enforces on the `UPDATE` for the `authenticated` role.
  An invitation for a nameless entity is accepted and leaves it unconfirmed. Deleting the invitation
  does not unconfirm.
  *Reconciled with the 174-A3 overrule:* a project-scope promise has no entity and confirms nothing.
  *Reconciled with the 175-B2 / 175-B3 NOTE (not settled):* the operator's direction — "code or email →
  cand confirmed; org confirmed" and "gate changing the name … on `!entity.confirmed` for all types" —
  **agrees with this decision for both entity types**: the admin vouches by inviting, and the invited
  user cannot rename what was vouched for. Under that direction the cross-phase worry "auto-confirmed
  organizations are not renamable until 175-B2 lands" stops being a gap and becomes the intended
  behaviour. **What would change if the 175 discussion lands elsewhere:** (a) if it lands on the 175-B2
  ★ (the nominations lock, not confirmation, freezes an organization's name), nothing here changes —
  only who may rename a confirmed organization; (b) if it decides an invited organization is **not**
  confirmed, this decision narrows to candidates: one type test in `create_invitations` and its pgTAP
  rows. No other decision in this file depends on it.
  *Accepted consequence, from Phase 172 D-13 ("confirmed means public, registered or not"):* an invited,
  never-signed-in entity with a confirmed nomination is public once the project opens. Stated on
  purpose; this phase adds no "has an editor" condition anywhere.
  **If wrong** (confirm at claim, option (b)): the claim function would exercise `entity.confirm` on
  behalf of a user who does not hold it — a definer function widening its caller's authority.
- **D-12 (174-C4):** **Seeding sends nothing.** The invitee opens the app and asks for a sign-in link
  (REG-10, REG-02). **Announcing invitations by mail is filed as a todo** (obligation O-10) beside the
  Admin-app screens. A link mailed at seed time would be dead in an hour (`otp_expiry = 3600`).
  **If wrong:** a seeding call that mails turns the admin write path into a way to send mail from the
  deployment's address to arbitrary recipients.
- **D-13 (174-C5):** **Delete `invite-candidate`** with its tests, the `_preregister` /
  `preregisterWithApiToken` contract and its docs. **`send-email` keeps its behaviour.** The anon-facing
  operations of section D live in **one new Edge Function**.
  *Reconciled with the Phase 170 outcome:* this phase **deletes the `invite-candidate` line of `EXEMPT`
  in `scripts/assert-no-candidate-app-names.mjs`** (a link of `yarn lint:check`), corrects the entry
  count the file states in its docblock and above the list, and edits the gate's fixture lines that name
  the function **in place, deleting none** (`scripts/fixtures/assert-no-candidate-app-names.input.ts`:
  the `// @as …/invite-candidate/index.ts` directive and the lines invoking and importing it; a deleted
  line shifts every later expectation; `--self-test` must pass). The invitation redirect that dangles
  at `/contestant/complete-registration` disappears with its source.
  *Reconciled with the tree (the ★'s "leave `send-email` unchanged" cannot hold to the letter):*
  `send-email/flowConformance.test.ts` asserts that `callerAuthority.ts` is byte-identical with
  `invite-candidate/callerAuthority.ts`; `scripts/assert-edge-env-defaults.mjs` holds the duplicated
  sibling modules byte-identical; `scripts/assert-project-scoped-queries.mjs`
  (`PROJECT_SCOPED_EDGE_FUNCTIONS`) and `packages/dev-seed/tests/projectScopingGate.test.ts` name the
  three function directories; comments in `send-email/` and `identity-callback/` cite the copies in
  `invite-candidate/`. Each is re-pointed in the plan that deletes the function, and the new function
  gets its entry in each gate. The population is derived at run time
  (`git grep -n -F "invite-candidate" -- ':!.planning'`), never from this list.
  **If wrong** (leave it until 179): a dead, service-role function that pre-creates users stays
  deployable for five phases, contradicting D-02.

### D — Claiming

- **D-14 (174-D1) ⚠:** **An explicit call. `claim_invitations(p_project_id)` is `SECURITY DEFINER`,
  executable by `authenticated` only, takes no email and no user argument, and reads both from
  `auth.uid()`.** It is idempotent, and all matching rows are claimed in one transaction. The auth
  callback and the password sign-in action call it and then refresh the session.
  - **The claim trusts only a confirmed address:** it reads `email` and `email_confirmed_at` from
    `auth.users` for `auth.uid()` — **the table, not the token's `email` claim**, which can be stale —
    and matches nothing when the address is unconfirmed.
  - **It matches** open rows of `p_project_id` (unclaimed, unexpired) whose `email` equals the caller's
    normalised address, plus code rows whose **pending address** equals it (D-16).
  - **It writes** one `public.grants` row per claimed invitation, copying the four columns, and stamps
    `claimed_by` / `claimed_at`. Nothing else: it confirms nothing, creates nothing, and returns only
    the specs it claimed and skipped — never an address or a code.
  - **HARD REQUIREMENT — reconciled with the Phase 173 outcome (173-RESEARCH § R-1.2, row 8).** The
    discussion document says a claimed grant is "selectable without a token refresh". **It is not.**
    Phase 173's list RPC is `SECURITY INVOKER` over RLS, so a grant written after the token was issued
    is **not listed and its entity row is not readable** until the token is reissued. Therefore, in
    every entry point: **establish the session → `claim_invitations` → refresh the session → only then
    evaluate any grant gate or load any entity.** The login action's entry gate (`passwordLogin`'s
    `hasAnyGrant` arm) must read the **refreshed** token, or a first-time invitee is signed out with
    403 (fact 7).
  - *Reconciled with the 170-A5 (b) overrule and the 174-A3 overrule:* the callback is the neutral
    `api/auth/callback`, shared with the Admin app, and `passwordLogin` serves both login actions. The
    Contestant entry points are required. **If project-scope promises are accepted (J3), the Admin
    login action is wired too**, or an invited project editor is refused at the Admin app's entry gate
    with their grant unclaimed. Which module holds the call is the planner's; the order above is not.
  - The 07 census grows by one name for `authenticated` (fact 15).
  **If wrong:** *an invitation claimed into the wrong account* — a function that accepted an address or
  a user id could be pointed at anyone's invitation. *Claiming another person's invitation by typing
  their address* — see RQ-1: the whole phase rests on `email_confirmed_at` meaning "this person opened a
  mail sent to this address", and the committed auth configuration does not obviously guarantee that.
- **D-15 (174-D2) ⚠:** **A gate. One anon-callable Edge Function takes an address and always answers the
  same.** It issues a sign-in link only when the address (i) has an open invitation in the project, or
  (ii) belongs to a user who already holds a grant in it, or (iii) was just bound to a valid code
  (D-16). Otherwise it does nothing. The auth user is created at that moment, not before. "Register by
  email" means "claim an invitation by email" (REG-10 against REG-F01).
  - *Reconciled with the 174-A3 overrule:* "holds a grant in the project" covers entity grants on the
    project's entities **and** project-scope grants on it; `resolve_email_variables`
    (`schema/502-email-helpers.sql`) is the existing notion of "a user of this project".
  - **"Always answers the same" includes time.** Issuing a link and sending a mail takes measurably
    longer than doing nothing. The response must not wait on the work that only happens for an eligible
    address.
  - **The function throttles itself** (D-20): a minimum interval per address, and a cap per caller.
  **If wrong** (no gate, option (b)): the deployment mails any address a visitor types and accumulates
  grant-less accounts. (GoTrue refuses uninvited addresses, option (c)): the refusal is visible, so
  invited addresses can be enumerated. Even with the gate, a distinguishable status, body **or latency**
  is the same oracle.
- **D-16 (174-D3) ⚠:** **The pending address.** On D1 the server writes the entered address onto the
  code's row as its pending address and issues the link through D-15's gate. The claim consumes a code
  row whose pending address equals the caller's confirmed address. Until then the code stays unused, and
  a later D1 entry replaces the pending address. Nothing secret travels in the link, and the click works
  on any device.
  *Accepted, as the ★ states:* a second person who knows the code can redirect it until someone
  confirms — a code is a bearer credential, and whoever holds it can claim it anyway.
  *Planner constraint:* a valid code lets its holder make the system mail an arbitrary typed address, so
  D1's write counts against the same throttle as D-15.
  **If wrong** (the code in the link, option (b)): the credential sits in mail, browser history and
  server logs. (Consume at D1, option (d)): a typing mistake burns the code and hands the invitation to
  whoever owns the mistyped address.
- **D-17 (174-D4) ⚠:** **The code check returns one of `valid`, `used`, `unknown` and nothing else.**
  `used` means claimed (D-08's definition). For D2, the Edge Function takes the code and a password,
  resolves the claimant, signs in with GoTrue server-side and hands the session to the SvelteKit action;
  **every failure is the one "wrong password" answer.** A user who claimed but never set a password
  asks, from D2, for a sign-in link to the account's address, **which is never shown or returned**. The
  legacy `CheckRegistrationData` contract (`email`, `firstName`, `lastName` for a key, fact 14) must not
  survive in any form.
  **If wrong:** *the used-code answer as an account-existence oracle* — it tells the holder of a code
  that an account exists for it. That is acceptable only because the holder already has the letter, and
  only while the answer carries nothing else: a masked address (option (c)), a name, or a different
  answer for "no password set" would each disclose more. *Password guessing:* code sign-in is a password
  check keyed by a code instead of an address, so it needs its own attempt limit (D-18) — GoTrue's
  per-IP limit either does not see the real client or is shared by every user of the function (RQ-5).
- **D-18 (174-D5):** **Rely on the 60-bit codes, and add an attempt limit.** Entropy is the defence; the
  limit caps the noise.
  *Reconciled with the tree — the ★'s "built like the feedback limit" does not transfer as written:*
  `private.feedback_client_ip` (`schema/107-feedback.sql`) reads the PostgREST request's headers. The
  code check is reached through the Edge Function (D-13), and code sign-in through a SvelteKit action
  (D-17), so the peer PostgREST sees is the function, and the peer the function sees may be the
  frontend server. The frontend holds no secret with which to vouch for a forwarded address (fact 13).
  **The planner fixes the call topology first**, then keys the limits on what is actually observable:
  a per-code limit where a row exists (a `used` code under password attempts — the case a lockout fits,
  which the ★ rejected only for unknown codes), and a coarse per-caller limit for unknown codes.
  **If wrong** (a limit keyed on a client-supplied header): the attacker chooses their own bucket.
- **D-19 (174-D6):** **Each row is claimed or skipped by itself**, and the function returns what it
  claimed and what it skipped. One bad row cannot lock a user out of their other entities.
  *Reconciled with the Phase 173 outcome (173 D-02: `idx_grants_one_candidate_editor` is kept):* this
  was "written to hold either way"; the way is now known. Two collisions are distinguished **by
  constraint name**:
  - `idx_grants_one_candidate_editor` — **another user already edits this candidate: a refusal.** The
    row stays unclaimed, is reported as skipped, and stays visible to an admin. Not idempotent success.
  - `grants_user_scope_target_role_key` — **the caller already holds exactly this grant:** the promise
    is fulfilled; the row is marked claimed and no second grant is written.
  *Consequence, flagged for Phase 178:* a code whose only row is skipped stays `valid`, so its holder can
  walk C → D1 → E → the link and arrive holding nothing. They land on Phase 173's "nothing to edit"
  screen (173-B5 (b)); 178 lists this as "cannot be defined yet".
  **If wrong** (all or nothing): one stale invitation blocks every claim for that address — a way for
  anyone who can seed to lock a user out.
- **D-20 (174-D7) ⚠:** **The Edge Function obtains the token with `auth.admin.generateLink`, builds a
  link to the app's auth callback carrying `token_hash` and `type`, and sends the mail itself over SMTP
  as `send-email` does.** The link works on any device and bypasses no gate.
  *Reconciled with D-03 — the ★'s "the existing callback handles it unchanged" is not literally true:*
  the callback gains the claim and the refresh (D-14), and its arms must send a **first-time** user to
  the set-password page and a returning one home. Today only `type=invite` reaches
  `ContestantAppSetPassword`; `email` / `signup` go to `next` or home. Which `type` `generateLink`
  issues for a new and for an existing address is RQ-2 / RQ-4, and it fixes the arms.
  *Reconciled with the standing rules and 178-C3 / 178-E1 — ⚠ OPERATOR REVIEW (J4):* the ★ leaves the
  resend throttle to 178-C3 and the mail's wording to 178-E1. **Both land here**, because an
  anonymous mail-sending endpoint cannot close a phase unthrottled, and a mail is a user-facing string
  under the seven-locale rule: (i) the server-side minimum interval per address (60 seconds, 178-C3 ★
  (a)) — 178 adds only the countdown; (ii) the **sign-in-link** mail in seven locales, as per-locale
  templates stored with the function (178-E1 ★ (a)), the request naming the page's locale, validated
  against the supported locales, and the link returning to that locale — 178 adds the recovery mail.
  The caller never supplies mail text.
  **If wrong** (browser PKCE, option (c)): the link fails on any device but the one that asked, and it
  calls GoTrue directly, around D-15's gate. (Caller-supplied text): anyone can mail arbitrary content
  from the deployment's address.

### E — Verification and plan

- **D-21 (174-E1):** **One new pgTAP file for the model**, asserting each success criterion as
  behaviour, plus an explicit edit to the 07 census.
  *Reconciled with the 174-A3 overrule and the Phase 173 outcome — the matrix is larger than the ★'s:*
  - **INV-01 / authority (D-09):** every row of the map, as an allowed and a refused caller — entity
    editor promise by project editor (allowed) and by entity editor / `anon` (refused); project editor
    promise by project admin (allowed) and **by project editor (refused: the self-promotion case)**;
    project admin promise by account admin (allowed) and by project admin (refused); account, global and
    empty-permission shapes (refused for a root admin too); a target in another project (refused);
    **a direct table `INSERT` meets the same refusals as the RPC**; no `UPDATE` for any API role.
  - **INV-02 (D-07):** same email + same target refused with the first row byte-unchanged; same email +
    other target allowed; same `code_hash` refused whatever the target; a batch with one duplicate
    writes nothing; a claimed row still blocks.
  - **INV-03 (D-14):** the caller's grants after the claim are exactly the before-set plus the promised
    rows; an unconfirmed address claims nothing; a second user with another address claims nothing; a
    code row is claimed only by the pending address; expired rows are not claimed; a second call is a
    no-op.
  - **INV-04 (D-08, D-17):** a claimed code answers `used` and grants nothing twice; **deleting the
    claimant does not reopen it**; a claimed row cannot be deleted through the admin path.
  - **INV-05 (D-11):** named candidate and named organization confirmed on seeding; nameless left
    unconfirmed; a project-scope promise confirms nothing.
  - **D-19:** the candidate-editor collision is skipped and leaves the row open; the already-held grant
    marks the row claimed; the caller's other rows are claimed in the same call.
  - **Exposure:** `anon` and entity editors read no row; no API role reads `code_hash`; the service-only
    functions are not executable by `anon` or `authenticated` (the census is the tripwire: Supabase's
    default privileges make a new `public` function executable by both).
  The file number is read from the tree: Phase 171 took 38 and left 37 free; 172 and 173 run first.
- **D-22 (174-E2):** **`forceRegister` keeps creating a user and a grant directly** — it is a fixture
  shortcut, not the flow under test. **`sendEmail` is replaced** by a helper that seeds an email
  invitation through `create_invitations` and requests the link through D-15's endpoint; the two specs
  that use it (`contestant-journey.spec.ts`, `perm-localisation-positive.spec.ts`) open the emailed link
  **exactly as received**, and `toCallbackUrl` is deleted. `seed.sql` and the dev-seed default template
  gain no invitation.
  *Reconciled with the Phase 172 outcome (expected at planning time):* `forceRegister` inserts the
  terms-of-use acceptance row by default with an opt-out (172 D-14), and the
  `terms_of_use_accepted: null` resets in `unregisterCandidate` and `deleteAllTestUsers` are gone. The
  new helper inserts no acceptance row, so the journey still meets gate G. **New for this phase:** the
  two cleanup helpers must also remove the test user's invitations, claimed ones included, through the
  service role, or a re-run meets "already claimed".
  **If wrong** (every helper through invitations): every setup depends on mail delivery — a failure mode
  unrelated to what most specs test, in a suite where an intermittent failure is a defect.
- **D-23 (174-E3) ⚠:** **Four plans, each ending on something testable; the schema lands before anything
  calls it.**
  1. **The table and seeding:** table, constraints, indexes, cleanup triggers, RLS with the authority
     map (D-09), column grants, `create_invitations`, auto-confirm (D-11), pgTAP, types regenerated.
  2. **Claiming in SQL:** `claim_invitations`, the code check, the pending-address binding, the
     link-eligibility read, the attempt limit, pgTAP, the 07 census, types regenerated — **and whatever
     auth-configuration change RQ-1 requires, with its fallout.**
  3. **The Edge Function** (code check, link request, code sign-in; throttle; seven-locale sign-in mail)
     **and the removal of `invite-candidate`** with every gate, test and comment that names it (D-13).
  4. **Wiring and close:** the callback and the login action (D-14), the E2E helper and specs (D-22),
     docs and skill files, the two todos (O-9, O-10), the INV-02 wording (D-07), the closing gate.
  *Reconciled with RQ-1:* **the plan that makes `claim_invitations` executable must not close while a
  confirmed address can be obtained without a mail round-trip.**
- **D-24 (174-E4):** **The standard set, each status read from the command's own exit code, never
  through a pipe:** `yarn db:reset`, `yarn db:types` with no diff left, pgTAP, `yarn db:lint:sql`,
  schema-migration parity, the unit suites, `yarn lint:check`, the production build, and one full
  wrapper-driven E2E run (`tests/scripts/e2e-run.sh`) with zero failed and zero did-not-run.
  *Reconciled with the Phase 171 outcome:* **the types are generated on the freshly reset database,
  before pgTAP** (171-04's corrected gate order); `yarn lint:check` now carries the app-name gate.
  *Recommended additions, flagged:* (i) zero-hit greps outside `.planning/` for `invite-candidate`,
  `inviteUserByEmail`, `preregisterWithApiToken`, `toCallbackUrl` and `complete-registration`, proving
  the old path is gone rather than bypassed (the Phase 173 D-24 precedent); (ii) **if `config.toml`
  `[auth]` changes under RQ-1, the two opt-in bank-auth projects are run** as Phase 171 ran them — each
  alone — because `identity-callback` creates users and the legacy `preregister` route verifies an OTP.

### Reconciliations

| # | ★ text that assumed something since overruled or changed | Reconciled to | Cause |
|---|---|---|---|
| R1 | 174-A3 ★: one row promises `(entity, <type>, <id>, editor)` | One row promises `(scope, target_type, target_id, role)`, mirroring `grants`; single-row shape, not the child table (D-04) | 174-A3 (c) |
| R2 | 174-B3 ★: email unique per `(target_type, target_id, email)` | Unique per `(project_id, email, scope, target_type, target_id)`; code unique per project whatever its target; proposed INV-02 wording (D-07) | 174-A3 (c) |
| R3 | 174-C1 ★: one gate, `user_can('project', project_id, 'project.edit_entities')` | A deny-by-default authority map, one row per promise shape, enforced in the `INSERT` policy (D-09) | 174-A3 (c) |
| R4 | 174-C2 ★: "an invitation targets an existing entity" | Entity-scope items only; a project-scope promise names its project (D-10, D-04) | 174-A3 (c) |
| R5 | 174-C3 ★: "sets `confirmed = true` on its target" | Only when the target is an entity; a project-scope promise confirms nothing (D-11) | 174-A3 (c) |
| R6 | 174-D1 ★: "the auth callback and the password sign-in action call it" (one app) | The callback is neutral and shared; the Admin login action is wired too if project-scope promises are accepted (D-14) | 170-A5 (b), 174-A3 (c) |
| R7 | 174-D2 ★: "a user who already holds a grant in it" | Entity grants on the project's entities and project-scope grants on it (D-15) | 174-A3 (c) |
| R8 | 174 cross-phase → 173: "`claim_invitations` writes `(entity, <type>, editor)` rows" | Writes the row's four columns; only `(entity, candidate\|organization, editor)` grants make an entity selectable in the app (173 D-05, D-06) | 174-A3 (c) |
| R9 | 174-E1 ★: five named assertions | The matrix of D-21, authority map and direct-insert refusals included | 174-A3 (c) |
| R10 | 173 cross-phase → 174 (and 173-CONTEXT O-5): a claimed grant "is selectable without a token refresh" | False: not listed and not readable until the token is reissued. Claim → refresh → gates, as a hard requirement (D-14) | Phase 173 (173-RESEARCH R-1.2 row 8) |
| R11 | 174-D6 ★ and "Cannot be defined yet": "written to hold either way" | The index is kept: a second editor for a candidate is a refusal; an already-held grant is fulfilled (D-19) | Phase 173 (D-02) |
| R12 | Facts 1, 2, 14, 18 and every anchor under `routes/candidate/`, `api/candidate/auth/` | `routes/contestant/…`, the neutral `api/auth/callback`, `ContestantAppSetPassword`, `/contestant/complete-registration` (name map) | Phase 170 |
| R13 | 174-C5 ★ / "Cannot be defined yet": whether `invite-candidate` was renamed | Not renamed; exempted by name in the app-name gate. This phase deletes the function **and** the exemption line, and edits the fixture in place (D-13) | Phase 170 |
| R14 | 174-C5 ★: "Leave `send-email` unchanged" | Behaviour unchanged; its conformance test, the byte-identity gate, two project-scoping gates and the cross-referencing comments are re-pointed (D-13) | the tree |
| R15 | 174-A2 ★: "the set-password page stays `register/password`" | It stays, on the invitation leg that Phase 171's registration-code guard exempts (D-03) | Phase 171 |
| R16 | Fact 15: five definer functions for `anon`, six for `authenticated` | Six and seven at `03b8a0524` (`contestant_app_public_config`); re-read after 172 and 173 (baseline) | Phase 171 |
| R17 | 174-E2 ★ and "Cannot be defined yet": the terms-of-use reset in `unregisterCandidate` / `deleteAllTestUsers` | Gone with the column; `forceRegister` inserts the acceptance row by default. The helpers gain invitation cleanup (D-22) | Phase 172 (expected) |
| R18 | 174-E4 ★: the gate order | Types on the freshly reset database before pgTAP; the app-name gate inside `lint:check` (D-24) | Phase 171 |
| R19 | 174-D7 ★: "the existing callback handles it unchanged" | The callback gains the claim, the refresh and a first-time / returning distinction (D-20, D-14) | 174-A2 ★, the tree |
| R20 | 174-D2 ★ / 174-D7 ★: the throttle is 178-C3's, the mail text 178-E1's | Server-side throttle and the seven-locale sign-in mail land here; 178 adds the countdown and the recovery mail (D-20) | standing rules |
| R21 | 174-D5 ★: a per-client limit "built like the feedback limit" | The limiter cannot see the client behind the Edge Function; topology first, per-code limit where a row exists (D-18) | the tree |
| R22 | 174-C3 ★ and Cross-phase "174 ∥ 175: auto-confirmed organizations are not renamable until 175-B2 lands" | Under the operator's stated direction that is the intended behaviour; the fallbacks are stated (D-11) | 175-B2 / B3 NOTE (unsettled) |
| R23 | 174-D1 ★: "an email counts as proven only when `email_confirmed_at` is set" | Kept, and made conditional on RQ-1: the committed configuration may set it without proof (D-14) | the tree (fact 12) |

### Judgement calls

Marked ⚠ OPERATOR REVIEW where the filled document delegated or did not foresee the choice.

- **J1 — the shape (D-04):** single-row general spec, not the child table. The roadmap says "the plan
  picks between the two shapes"; this file picks, with reasons, so that sections B–D need no rewrite.
- **J2 — the duplicate rule (D-07):** target = `(scope, target_type, target_id)`; email unique per
  target within the project, the role outside the key; code unique per project. Resolves the
  `⚠ UNRESOLVED` marker on INV-02 and criterion 2.
- **J3 — which promises are accepted in v2.16 (D-09):** the full map (entity editor, project editor,
  project admin; account and global refused), or entity editor only.
- **J4 — scope moved from 178 to 174 (D-20):** the server-side resend throttle and the seven-locale
  sign-in mail.
- Not for the operator, flagged for the planner: the `claimed_at` definition of "claimed" (D-08); the
  direct-insert `code_hash` closure (D-06); the two constraint names of D-19; the closing-gate greps and
  the conditional bank-auth run (D-24); the 178-A4 seam (O-4).

### Claude's Discretion

- The Edge Function's **name** — neutral, not entity-typed, and nothing the app-name gate rejects — and
  whether its operations are sub-paths or one discriminated body.
- The **names and signatures** of the SQL helpers behind the function, and which are `private` and which
  are `public` but executable by `service_role` only (PostgREST exposes `public`; the census is the
  tripwire).
- The return shapes of `create_invitations` and `claim_invitations`, within "codes once, never an
  address or a code from the claim".
- How the randomness of D-06 is obtained and how the direct-insert hole is closed.
- Which module holds the claim-and-refresh call (D-14), and whether the refresh is skipped when nothing
  was claimed.
- Whether the E2E seeding helper calls the RPC as an admin user or through the service role (D-22).
- The `SELECT` permission on `invitations` (the seeding permission of the row's shape is the floor).
- Whether `request link` already takes a purpose parameter for 178's recovery mail (O-3).

</decisions>

<factual_baseline>
## Factual baseline (174-0, accepted under D-01)

Snapshot of 2026-10-04 at `df0cec944`, **corrected to `03b8a0524` (2026-10-06)** where Phases 170 and
171 changed a fact, and to the *expected* outcome of 172 and 173 where marked. Schema files were read
with `git show HEAD:` at `03b8a0524`, because Phase 172 was editing the working tree; frontend, test and
script files were read from the working tree on 2026-10-06.

1. **`invite-candidate` pre-creates the user and writes the grant at invite time.** It inserts a
   `candidates` row, calls `auth.admin.inviteUserByEmail` and writes the `(entity, candidate, editor)`
   grant. Candidate-only; gated on `project.edit_entities` through `callerMayOnProject`
   (`functions/invite-candidate/index.ts`, `entityGrant.ts` `writeEntityGrant`).
2. **Its redirect targets a route that does not exist:** `` `${siteUrl}/contestant/complete-registration` ``
   *(corrected: renamed by Phase 170, still dangling).*
3. **It has no caller.** Its only invoker is `supabaseDataWriter._preregister`
   (`functions.invoke('invite-candidate', …)`), reached only through `preregisterWithApiToken`, which
   nothing in `routes/`, `lib/` or `tests/` calls outside its own unit test. The E2E suite's
   `SupabaseAdminClient.sendEmail` calls `auth.admin.inviteUserByEmail` and inserts the grant itself.
4. **There is no invitation model:** no `invitations` table, no email or code column on an entity table.
5. **`grants` cannot be written by any API role** (`REVOKE ALL … FROM authenticated, anon, public`;
   policies for `supabase_auth_admin` SELECT and `service_role` only). The target is polymorphic with no
   foreign key; `cleanup_grants_on_delete` triggers on six tables remove a grant when its target goes.
   `grants_user_scope_target_role_key` is `UNIQUE NULLS NOT DISTINCT (user_id, scope, target_type,
   target_id, role)`. `idx_grants_one_candidate_editor` allows one editor per candidate **and is kept**
   *(Phase 173 D-02)*.
6. **A grant reaches the JWT only when a token is issued.** `custom_access_token_hook` projects
   `public.grants` into the `grants` claim with exactly the keys `scope`, `target_type`, `target_id`,
   `role`; `user_can` reads the claim, not the table; `jwt_expiry = 3600`. *(Phase 173 adds: the two
   user-data RPCs are `SECURITY INVOKER`, so an unrefreshed grant is neither listed nor readable.)*
7. **A user who signs in before their grant exists is thrown out.** `passwordLogin`
   (`apps/frontend/src/lib/auth/passwordLogin.ts`) signs out a session whose token matches none of the
   allowed grant shapes (403, `grantNotAllowed`); the shapes are `CANDIDATE_GRANTS` in
   `lib/auth/roles.ts` at `03b8a0524` — candidate editors only. *(Expected after 173: renamed, and
   widened to organization editors; a user with no editable entity sees the "nothing to edit" screen
   instead of the `userNoCandidate` sign-out.)*
8. **`confirmed` does not publish by itself.** It defaults to `false` on all four entity tables; an
   entity is public only when the project is open, `confirmed` is true and it has a confirmed
   nomination. *(Phase 172 removes the terms-of-use conjunct for candidates.)*
9. **Confirming freezes the name for the entity's own user.** `enforce_entity_immutability` is
   `BEFORE UPDATE`, binds `authenticated` only: changing `confirmed` needs `entity.confirm`; on a
   confirmed row the name columns need `entity.edit_immutable`. Project admin and project editor hold
   both; entity editors hold neither.
10. **`bulk_import` has no slot for invitations or users** (`SECURITY INVOKER`, requires `external_id`
    and `project_id` on every item, returns counts). `@openvaa/dev-seed` writes through it and creates
    no auth user and no grant.
11. **`send-email` cannot reach an invitee:** it takes `recipient_user_ids`, and
    `resolve_email_variables` returns only users who already hold a grant in the project. It sends
    through `nodemailer` with `SMTP_HOST`, `SMTP_PORT`, `SMTP_FROM`.
12. **Auth configuration** (`config.toml`): `[auth] enable_signup = true`;
    `[auth.email] enable_signup = true`, **`enable_confirmations = false`**, `max_frequency = "1s"`,
    `otp_expiry = 3600`; `[auth.rate_limit] email_sent = 2`, `sign_in_sign_ups = 30`,
    `token_verifications = 30`; `minimum_password_length = 6`; `site_url = "http://127.0.0.1:5173"`. No
    `[auth.email.template.*]` block is active; no `[functions.*]` block exists.
    `additional_redirect_urls` admits `http://localhost:5173/api/auth/callback` and
    `http://localhost:5173/*/api/auth/callback` *(corrected: Phase 170)*.
13. **The frontend holds no service-role key.** Anything that reads `auth.users` or writes `grants` runs
    in SQL (`SECURITY DEFINER`) or in an Edge Function.
14. **`checkRegistrationKey` throws, and its contract discloses.** `CheckRegistrationData` returns
    `email`, `firstName`, `lastName` for a key; `routes/contestant/register/+page.svelte` forwards them
    in the URL. The contract shape must not survive (it is removed with `register/` in 178; this phase
    must not build on it).
15. **A new public definer function trips the census.** `07-rpc-security.test.sql` § 8c pins the
    `SECURITY DEFINER` functions in `public` executable by `anon` (six at `03b8a0524`:
    `contestant_app_public_config, project_open_for_voters, storage_path_can, storage_path_is_public,
    user_can, user_has_account_grant`) and by `authenticated` (the same plus `get_entity_basic_data`),
    filtered by `has_function_privilege`. *(Corrected: Phase 171 added one name.)*
16. **A per-client rate limit exists as a precedent:** `private.feedback_rate_limits`, keyed on the
    address `private.feedback_client_ip` derives from **PostgREST's request headers**, with
    `private.deployment_settings.behind_cloudflare` deciding which header is trusted (D-18).
17. **The E2E admin client builds registrations by hand** (`tests/tests/utils/supabaseAdminClient.ts`):
    `forceRegister`, `sendEmail`, `unregisterCandidate`, `deleteAllTestUsers`. Two specs turn the
    emailed verify link into a hand-built callback URL with `toCallbackUrl`
    (`fixtures/shared/emailBucket.fixture.ts`): `specs/contestant/contestant-journey.spec.ts` (twice:
    registration and reset) and `specs/perm/perm-localisation-positive.spec.ts`. *(Phase 172 changes the
    first, third and fourth helpers; at reading the terms-of-use resets were still in the working tree.)*
18. **The auth callback verifies a `token_hash` and nothing else**
    (`apps/frontend/src/routes/api/auth/callback/+server.ts`, `GET`). `type=invite` redirects to
    `ContestantAppSetPassword` with the email in the query string; `email` / `signup` go to a validated
    `next` or `ContestantAppHome`. It never claims and never refreshes.
19. **`identity-callback` creates its users already email-confirmed, with no password**
    (`auth.admin.createUser({ email_confirm: true, … })` on an identity-derived placeholder address).
20. **No hashing extension is declared.** The only `CREATE EXTENSION` is `pg_net`; `sha256(bytea)` is
    built in.

**Found while reconciling, not in 174-0:**

21. **The permission matrix reserves grant administration to three permissions that no policy enforces**
    (`.claude/skills/database/rls-policy-map.md`): `account.manage_admins` (root, account admin),
    `project.manage_editors` (those plus project admin) and `entity.invite_children` (those plus project
    editor and organization editor). A project editor holds `project.edit_entities` and
    `entity.confirm` and **not** `project.manage_editors`. `grant_role_permissions` maps `entity+admin`,
    `global+editor` and `account+editor` to the empty set.
22. **Phase 171's settings code already says an invitation is not a registration mode:**
    `packages/app-shared/src/settings/contestantAppConfig.ts` — "An invitation sent by an administrator
    is not a registration mode and needs no entry." (O-4.)
23. **`invite-candidate` is cross-referenced by gates and sibling functions** (D-13's list).

### Cannot be defined yet — as the filled document and the executed phases resolve it

| Item in the section | Status |
|---|---|
| Whether a second invitation for one candidate can ever be claimed | **Resolved:** no; the index is kept (D-19). |
| The exact route and symbol names; whether `invite-candidate` was renamed | **Resolved:** name map; not renamed, exempted, deleted here (D-13). |
| The terms-of-use reset in `unregisterCandidate` and `deleteAllTestUsers` | **Resolved by Phase 172's design**, expected at planning time (D-22). |
| Whether `admin.generateLink` creates a user with a generated password | **Open — RQ-2.** |
| Whether GoTrue's per-IP limits count the Edge Function as one client | **Open — RQ-5.** |
| The non-PKCE `/verify` redirect and the `token_hash` link type | **Open — RQ-3, RQ-4.** |

### Research items — measured on the local stack before the link shape is fixed

Nothing below was measured for this file. Where an expectation is stated it comes from reading GoTrue's
documentation or from recollection of its source, and is **unconfirmed**.

- **RQ-1 — BLOCKING. Can a confirmed address be obtained without a mail round-trip under the committed
  configuration?** Measure, with the anon key against the local stack: (i) a public
  `auth.signUp({ email, password })` for an address that has an open invitation — does the user come
  back with `email_confirmed_at` set (`enable_confirmations = false` is documented as auto-confirm)?
  (ii) a signed-in `auth.updateUser({ email })` to such an address — is the change applied at once?
  (iii) what `signUp` answers for an address that already has an account (an existence oracle that would
  undo D-15). **If any holds, `claim_invitations` as specified lets a stranger claim another person's
  invitation by typing their address.** The remedy is then part of this phase: the auth configuration
  changes (confirmations on, public sign-up off, or both) in plan 2, with its fallout measured on
  `forceRegister`, the forgot-password page, the legacy `register/` and `preregister/` trees and
  `identity-callback`. The discussion document does not foresee this; it is this file's finding from
  fact 12 against 174-D1.
- **RQ-2 — `admin.generateLink` for an address with no account.** Does it create the user; with which
  link `type` (`magiclink`, `signup`, `invite`); and is `auth.users.encrypted_password` empty
  afterwards? This decides whether D-15 must create the user explicitly first, and what "no password
  set" looks like for 178-B1. Measure each candidate type, and for each whether verifying the link sets
  `email_confirmed_at`.
- **RQ-3 — the non-PKCE `/verify` redirect.** Does it return the session in the URL fragment, as
  174-D7's grounding says? It is the reason the default mail is rejected.
- **RQ-4 — the `token_hash` link.** Does a link built from `generateLink`'s `hashed_token` verify through
  `verifyOtp({ token_hash, type })` on the server client under the type issued, for a new and for an
  existing user; which callback arm does each type reach; is the token single-use; does it expire at
  `otp_expiry`?
- **RQ-5 — rate limits.** Does GoTrue's per-IP limit (`sign_in_sign_ups`, `token_verifications`) count
  the Edge Function's server-side sign-in as one client, and does `email_sent = 2` per hour bind mail
  the function sends over SMTP itself (expected not, since GoTrue sends nothing)?
- **RQ-6 — the call topology** (D-18): which peer address the Edge Function and PostgREST each observe
  when the browser calls the function directly and when a SvelteKit action does; whether an Edge
  Function with no `[functions.<name>]` block accepts a call carrying only the anon key.
- **RQ-7 — the refresh** (D-14): that `refreshSession()` on the per-request server client reissues the
  token through the hook and writes the cookies on the same response, in the callback (a redirect) and
  in the login action.

</factual_baseline>

<expected_tree>
## The tree this phase is planned against

**Phases 170 and 171 are executed and were read on the tree. Phase 172 is executing and Phase 173 is
planned: everything stated about them is expected at planning time — the planner must re-read the
tree.**

### Name map (stated once; verified at `03b8a0524` unless marked)

| The discussion document says | The tree says |
|---|---|
| `routes/candidate/…`, `/candidate/…` | `routes/contestant/…`, `/contestant/…` |
| `routes/api/candidate/auth/callback/+server.ts` | `routes/api/auth/callback/+server.ts`; route keys `AuthCallback`, `AuthLogout` |
| `CandAppSetPassword`, `CandAppHome`, `CandAppLogin` | `ContestantAppSetPassword`, `ContestantAppHome`, `ContestantAppLogin` |
| `routes/candidate/register/password` | `routes/contestant/register/password` |
| `/candidate/complete-registration` | `/contestant/complete-registration` (no page) |
| `specs/candidate/candidate-journey.spec.ts` | `specs/contestant/contestant-journey.spec.ts` |
| `getCandidateContext`, `$candidate` | `getContestantContext`, `$contestant` |
| `invite-candidate` | **unchanged** — exempt in `scripts/assert-no-candidate-app-names.mjs` until this phase |
| `CANDIDATE_GRANTS` | unchanged at `03b8a0524`; **expected** renamed and widened by Phase 173 |
| `get_candidate_user_data` | **expected** replaced by `get_user_entities` and `get_entity_user_data` (Phase 173) |
| `candidates.terms_of_use_accepted` | **expected** replaced by `public.terms_of_use_acceptances` (Phase 172) |
| `(protected)/…` routes | **expected** under `[entityType]/[entityId]` with a user-level and an entity-level layout (Phase 173) |

Entity-type names are not app names and stay: `candidates`, `organizations`, `ENTITY_TYPE.Candidate`.

### Inherited from Phase 171 (executed)

- Accessors in `packages/app-shared/src/settings/contestantAppConfig.ts`: `getServedEntityTypes`,
  `getEffectiveRegistrationModes`, `isRegistrationModeAllowed`, `isRegistrationModeAllowedForAnyType`.
- The registration-code guard covers the code leg only (`isRegistrationCodeLeg`); the invitation leg of
  `register/password` is exempt (D-03).
- `public.contestant_app_public_config(p_project_id)` — anon-readable, in both censuses.
- The gate drivers `171-e2e.sh`, `171-gates.sh`, `171-bankauth.sh` are reusable as models. A template's
  settings object is the whole stored row.

### Inherited from Phase 172 (expected)

- `public.terms_of_use_acceptances (user_id, project_id, accepted_at)`, cascading with the user and the
  project. An invitation carries no terms-of-use state; a claimed user meets gate G like any other.
- `forceRegister` records acceptance by default, with an opt-out; `unregisterCandidate` and
  `deleteAllTestUsers` no longer reset a column.
- An ordered gate list in the protected layout, holding G.

### Inherited from Phase 173 (expected)

- `idx_grants_one_candidate_editor` kept (D-19).
- The user-level list RPC and the one-entity read are `SECURITY INVOKER`: **table ∩ RLS-readable**
  (D-14's hard requirement).
- The "nothing to edit" screen for a signed-in user with no editable entity (D-19, O-5).
- An app-entry gate admitting candidate and organization editors.

</expected_tree>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### The phase's own contract
- `.planning/v2.16-DISCUSSION-POINTS.md` § *Phase 174* — the 24 decisions and the 20 facts; § *Cross-phase
  picture* (X2); the cross-phase notes of 171, 172, 173, 178 and 179.
- `.planning/ROADMAP.md` § v2.16 (standing rules, hand-overs) and § Phase 174 (criteria, the
  `⚠ UNRESOLVED` marker, the two todos).
- `.planning/REQUIREMENTS.md` — INV-01..INV-05 (INV-02 carries the marker), REG-09, REG-10, REG-F01.
- `CAND-APP-PLAN.md` § *User invitations and ToU column*, and screens C, D1, D2, E.
- `.planning/phases/162-permissions-auth-model-refactor/162-USER-RIGHTS.md` — the sign-up scenarios and
  the atomic rights the invitation model implements.

### Upstream phases
- `.planning/phases/170-contestant-app-rename-symbols-routes/170-04-SUMMARY.md` § *What Later Phases and
  Every Developer Need to Know*.
- `.planning/phases/171-project-settings-served-entity-types-registration-mode-matri/171-04-SUMMARY.md`
  § *What Later Phases Must Know*.
- `.planning/phases/172-terms-of-use-per-user-and-project/172-CONTEXT.md` — D-02, D-13, D-14.
- `.planning/phases/173-multi-entity-grants-entity-selection/173-CONTEXT.md` — D-02, D-05, D-06, D-11,
  `<cross_phase>` O-5 and O-10; `173-RESEARCH.md` § R-1.1, § R-1.2 (rows 8 and 9), § R-1.5.

### Schema, functions and database tests
- `schema/300-auth-tables.sql` — `grants`, its two CHECKs, both uniqueness rules,
  `cleanup_grants_on_delete`.
- `schema/301-auth-functions.sql` — `custom_access_token_hook`, `grant_role_permissions`, `user_can`,
  `private.entity_project_id`, `private.caller_entity_ids`.
- `schema/011-validation-functions.sql` — `enforce_entity_immutability`.
- `schema/107-feedback.sql` — the rate-limit precedent. `schema/502-email-helpers.sql` —
  `resolve_email_variables`. `schema/501-bulk-operations.sql` — `external_id` resolution.
- `functions/invite-candidate/` (deleted here), `functions/send-email/` (SMTP pattern, gates),
  `functions/identity-callback/` (`generateLink` use).
- `tests/database/07-rpc-security.test.sql` § 8c; `19-entity-immutability.test.sql`;
  `25-matrix-conformance.test.sql`; `36-entity-identity.test.sql`.
- `config.toml` `[auth]`, `[auth.email]`, `[auth.rate_limit]`.
- `.claude/skills/database/SKILL.md`, `rls-policy-map.md`, `schema-reference.md` — `Skill("database")`.

### Frontend and tests
- `apps/frontend/src/routes/api/auth/callback/+server.ts`; `apps/frontend/src/lib/auth/passwordLogin.ts`,
  `roles.ts`; `routes/contestant/login/+page.server.ts`, `routes/admin/login/+page.server.ts`.
- `apps/frontend/src/lib/api/base/dataWriter.type.ts`, `universalDataWriter.ts`,
  `adapters/supabase/dataWriter/supabaseDataWriter.ts` (`_preregister`, `_checkRegistrationKey`).
- `tests/tests/utils/supabaseAdminClient.ts`; `tests/tests/fixtures/shared/emailBucket.fixture.ts`;
  `tests/tests/specs/contestant/contestant-journey.spec.ts`;
  `tests/tests/specs/perm/perm-localisation-positive.spec.ts`;
  `tests/tests/utils/contestantJourneyConstants.ts`.

### Gates this phase edits
- `scripts/assert-no-candidate-app-names.mjs` and `scripts/fixtures/assert-no-candidate-app-names.*`.
- `scripts/assert-edge-env-defaults.mjs`, `scripts/assert-project-scoped-queries.mjs`,
  `packages/dev-seed/tests/projectScopingGate.test.ts`.

### Standing project rules that bind this phase
- `CLAUDE.md` § E2E Hard Rule, § E2E preflight, § Comment Hygiene; its § Backend lines naming the three
  Edge Functions and the pre-registration path are made true in the plan that deletes the function.
- `.agents/code-review-checklist.md`.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`public.grants`' column set and CHECKs** — the invitation's grant spec copies them (D-04).
- **`user_can` and `private.entity_project_id`** — the authority map asks the first and scopes with the
  second (D-09).
- **`cleanup_grants_on_delete`** — one function, trigger arguments naming scope and type; the shape of
  the invitation cleanup.
- **`send-email`** — SMTP through `nodemailer`, the env-config and conformance-test pattern for an Edge
  Function.
- **`private.feedback_rate_limits`** — the windowed-counter table shape (not its client-address
  derivation, D-18).
- **`contestant_app_public_config`** — the pattern for an anon-callable definer function that returns a
  closed set of keys and joins both censuses on purpose.
- **Phase 173's "nothing to edit" component** — where a claim that wrote no contestant grant ends.

### Established Patterns
- **Authority is decided in policies through `user_can`; no second copy of the matrix.**
- **Definer helpers that need no RPC exposure live in `private`**; anything in `public` is a PostgREST
  endpoint and is executable by `anon` and `authenticated` unless revoked.
- **No oracle:** "not yours", "wrong project" and "does not exist" give the same answer
  (`get_entity_basic_data`, Phase 173's RPCs). The code check and the link request follow it.
- **Edge Functions duplicate shared modules byte for byte, gated by a script.**
- **Schema edits regenerate the single migration file**; `yarn db:types` leaves no diff.

### Integration Points
- The auth callback and both login actions: session → claim → refresh → gates (D-14).
- `DataWriter`: `preregisterWithApiToken` leaves; new calls for the function's operations go through the
  data writer, not route-level client calls.
- The E2E mail fixture: the link is opened as received.

</code_context>

<specifics>
## Specific Ideas

- **The operator's words** (`CAND-APP-PLAN.md`): "How to handle user invitations so that we can define
  their grants in advance?" · "The invitations should hold either the code or the email for matching
  (and prevent duplicates)" · "I'd like to save the code for users who have used it so that when they
  enter it, they'll be asked for their password instead."
- **The server contract Phase 178 consumes** (named in the section's cross-phase note): `check code →
  valid | used | unknown`, `request link`, `code sign-in`, `claim_invitations`. Phase 178 builds no
  server logic of its own.
- **Code format:** `XXXX-XXXX-XXXX`, 32-symbol alphabet without `0/O` and `1/I/L`.
- **Every anon-facing answer is from a closed set**, identical in status, body and timing across the
  cases an attacker would want to tell apart.
- **The threat list the plan's threat model must cover:** claiming another person's invitation by typing
  their address (D-14, RQ-1); code enumeration and brute force (D-05, D-06, D-18); a project editor
  seeding their own promotion (D-04, D-09); replay of a used code (D-08, D-17); an invitation claimed
  into the wrong account (D-14); the used-code answer as an account-existence oracle (D-17); invited
  addresses enumerated through the link request or through GoTrue itself (D-15, RQ-1 (iii)); mail sent
  to arbitrary addresses (D-12, D-16, D-20); cross-project targets (D-04, D-09).

</specifics>

<cross_phase>
## Cross-phase Notes and Obligations

- **O-1 ← 173 (hard).** Claim → refresh → gates (D-14). The discussion document's "selectable without a
  token refresh" is superseded by 173-RESEARCH § R-1.2 row 8.
- **O-2 → 170.** Delete the `invite-candidate` exemption line and edit the gate's fixture in place
  (D-13). If Phase 173 re-pointed its fixture line at `invite-candidate` as the exempt name beside an
  app-level name (173-RESEARCH § R-1.5), that line is edited again here.
- **O-3 → 178.** The endpoints exist and pass their own tests at this phase's close. 178 adds screens,
  the countdown, the recovery mail and FIX-01 through the same function (178-C5, 178-F1), and the
  "password set" field on Phase 173's user-level RPC (178-B1 NOTE) — which is correct only if a
  link-created user has no password (RQ-2). If 174-D2 or 174-D7 had been overruled, 178-C3, 178-C5,
  178-E1 and 178-F1 would lose their ★; they were not.
- **O-4 → 171 / 178 (seam, with a contradiction to settle in 178).** The registration-mode matrix is not
  read by this phase's functions. 178-A4 ★ has the code check and the link request treat an invitation
  whose mode is not allowed for its target's entity type as absent; Phase 171's executed code says an
  administrator's invitation is not a registration mode. This phase keeps the target's entity type and
  the project reachable in both functions so 178 can add the condition; a project-scope promise has no
  entity type for the matrix to judge.
- **O-5 → 173 / 178.** A user whose claim wrote nothing they can edit — every row skipped, or a
  project-scope grant only — is signed in and sees "nothing to edit" (D-19).
- **O-6 → 172.** INV-05 plus "confirmed means public" publishes an invited, never-signed-in entity once
  its nomination is confirmed (D-11). The E2E helper that replaces `sendEmail` records no acceptance.
- **O-7 → 175.** D-11 agrees with the operator's stated direction for 175-B2 / B3; its two fallbacks are
  stated there. If this phase runs before 175, a confirmed organization's `name` is frozen for its user
  and `short_name` is not — the pre-existing trigger, unchanged here.
- **O-8 → 179 (security).** The claim trusts only a confirmed address. An identity-provider user's typed
  address must be stored **unconfirmed** until proved (179-B1 ★): `email_confirm: true` on a typed
  address (fact 19's call) would let anyone claim another person's invitation by typing their address.
- **O-9 — todo to file here (X2 (a); the roadmap assigns it to this phase).** Identity-provider
  registration never claims an invitation in v2.16: a person an admin seeded who registers through the
  provider becomes a duplicate the admin resolves by hand. A new file in `.planning/todos/pending/`.
- **O-10 — todo to file here (174-C4).** Announcing invitations by mail, beside the Admin-app screens.
- **O-11 — schema seriality.** This phase regenerates the migration after 173; if 175 runs first, after
  175.
- **O-12 — docs and skills.** `apps/docs` pages on `invite-candidate`, pre-registration, registration,
  email, Edge Functions and authentication; `apps/supabase/README.md`; `.env.example`; `CLAUDE.md`;
  `.claude/skills/database/*` — updated in the plan that removes the old path. Population by grep.
- **O-13 — the stack restart.** A change to `config.toml` `[auth]` (RQ-1) is read when the stack starts;
  every developer and every gate run restarts it once, as after Phase 170.

</cross_phase>

<deferred>
## Deferred Ideas

- **The child table of grants per invitation** (174-A3 (c), second shape) — one code unlocking several
  grants. Not built (D-04).
- **Account- and global-scope promises** — refused for every caller (D-09).
- **An Admin-app flow that claims a project-scope invitation**, and any Admin-app screen for seeding.
- **An organization inviting its candidates** (`entity.invite_children`, 162-USER-RIGHTS § 2.1).
- **Claim-time re-validation of the seeder's authority**, and re-inviting an address whose grant was
  revoked (D-07, D-09 residuals).
- **Announcing invitations by mail** (174-C4 (b), (c)) — todo O-10.
- **Identity-provider registration claiming an invitation** (X2 (b), (c)) — todo O-9.
- **`revoked_at` and a mandatory default expiry** (174-B4 (b), (c)); **admin-supplied codes**
  (174-B2 (b), (c)); **HMAC code storage** (174-B1 (c)).
- **The registration-mode matrix as a server-side condition** — Phase 178 (O-4).
- **The recovery mail, FIX-01, the screens, the "password set" field** — Phase 178.
- **Running the E2E suite three times at close** (174-E4 (b)) — not chosen; an intermittent failure of
  the mail path is still a defect.

### Ambiguities and contradictions found while reconciling

Line numbers are those of `.planning/v2.16-DISCUSSION-POINTS.md` at `e4813bf65`, given for the
operator's review only; no decision above is anchored on them.

1. **Line 1316 (174-A3 (c))** names two shapes in one option. → J1.
2. **Line 1340 (174-B3 ★)** defines a duplicate per `(target_type, target_id, email)`; with line 1316
   that no longer names a target (`REQUIREMENTS.md` INV-02, roadmap criterion 2). → J2.
3. **Line 1358 (174-C1 ★)** gates seeding on `project.edit_entities` alone; line 1316 itself says that
   is insufficient. → J3.
4. **Line 1400 (174-D1)** "an email counts as proven only when `email_confirmed_at` is set" against
   **line 1275 (fact 12)** `enable_signup = true`, `enable_confirmations = false`. → RQ-1.
5. **Line 1233 (173's cross-phase note → 174)** says a claimed grant "is selectable without a token
   refresh"; 173-RESEARCH § R-1.2 row 8 measured the opposite. (Lines 98–99 of the cross-phase picture
   say only that the session refreshes after a claim, which stands.) → D-14.
6. **Line 1433 (174-D5 ★)** a per-client limit "built like the feedback limit" against **line 1390
   (174-C5 ★)** and **line 1427 (174-D4 ★)**, which put an Edge Function and a SvelteKit action between
   the client and the limiter. → D-18, RQ-6.
7. **Line 1449 (174-D7 ★)** "the existing callback handles it unchanged" against **line 1306
   (174-A2 ★)** "wires the claim plus a session refresh into the existing auth callback". → D-20.
8. **Lines 1410 and 1449** leave the throttle to 178-C3 and the mail text to 178-E1, while line 1306
   has the endpoint working at this phase's close. → J4.
9. **Line 1390 (174-C5 ★)** "leave `send-email` unchanged" against the tree. → D-13.
10. **Line 1346 (174-B4 ★)** records `claimed_by` without saying what deleting that user does. → D-08.
11. **Line 1374 (174-C3 ★)** against the unsettled NOTE at **lines 1584–1588**. → D-11.
12. **Line 1402 (174-D1 ★)** names one sign-in action; the callback is shared with the Admin app
    (line 228) and a project-scope promise is claimed nowhere else. → D-14.
13. **Line 1427 (174-D4 ★)** with **line 1441 (174-D6 ★)**: a code whose claim is skipped stays `valid`
    indefinitely. → D-19.
14. **Line 1498** (the matrix is not read here) with **line 2320 (178-A4 ★)** and Phase 171's executed
    statement that an invitation is not a registration mode. → O-4.
15. **Line 1332 (174-B2 ★)** server-generated codes with **line 1283 (fact 20)** (no `pgcrypto`) and
    **line 1358** (`SECURITY INVOKER`, so the caller can insert directly). → D-06.
16. **In a neighbouring file:** `172-CONTEXT.md`'s header cites this overrule as "174-A1 → (c)"; the
    ticked box is 174-A3 (line 1316). Its content is right.

</deferred>

---

*Phase: 174-invitations-grants-defined-in-advance*
*Context gathered: 2026-10-06 from the operator-filled `.planning/v2.16-DISCUSSION-POINTS.md`, the
amended `ROADMAP.md` and `REQUIREMENTS.md`, the Phase 170 and 171 summaries, the Phase 172 and 173
contexts, and the tree at `03b8a0524`*
