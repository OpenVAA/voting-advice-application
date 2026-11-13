# Phase 174: Invitations — Grants Defined in Advance - Research

**Researched:** 2026-10-06
**Domain:** Supabase Auth (GoTrue v2.197.0) link issue and verification; PostgreSQL 17 row-level security and `SECURITY DEFINER` design; Deno Edge Functions; SvelteKit server-side session handling
**Confidence:** HIGH for everything measured (the auth behaviour, the SQL prototype, the gates it moves); MEDIUM for the Edge-runtime topology (RQ-6), which could not be measured without touching the shared stack

<user_constraints>
## User Constraints (from CONTEXT.md)

Copied verbatim from `174-CONTEXT.md` (the scratchpad copy named in the brief; the same file is committed as `.planning/phases/174-invitations-grants-defined-in-advance/174-CONTEXT.md`). J1–J4 are treated as the working decisions.

### Locked Decisions

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

### Deferred Ideas (OUT OF SCOPE)

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
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description (REQUIREMENTS.md) | Research Support |
|----|-------------------------------|------------------|
| INV-01 | An admin can seed an entity with an email or a registration code, defining in advance the grant its user will receive. | § R-1 (table, `create_invitations`, the authority map written inline in three policies; 17 caller × promise cases run on a private PostgreSQL 17.6); § R-2 (the two ratified lists the map moves) |
| INV-02 | A duplicate invitation — the same email or the same code for the same target — is refused. ⚠ UNRESOLVED marker. | § R-1.3 (two partial unique indexes, one `NULLS NOT DISTINCT`; refusals and "first row unchanged" measured; a batch writes nothing); D-07's wording is implementable as written |
| INV-03 | Claiming an invitation writes exactly the grants it defines, and only for the user who proved the email or the code. | § RQ-1 (**the committed auth configuration lets a stranger obtain a confirmed address with no mail** — measured; the remedy and its fallout); § R-1.6 (`claim_invitations`, measured end to end with real GoTrue tokens); § RQ-7 (the refresh) |
| INV-04 | A used code is retained, so that entering it again leads to password sign-in rather than to an error. | § R-1.7 (`valid \| used \| unknown`; `used` survives deletion of the claimant; a claimed row is not deletable through the admin path; per-code attempt limit measured) |
| INV-05 | An entity seeded with a name and an email or a registration code is confirmed automatically; an entity seeded without either stays unconfirmed. | § R-1.5 (the `UPDATE` runs as the caller under `enforce_entity_immutability`; named candidate and organization confirmed, nameless ones not — measured) |
</phase_requirements>

## How to read this file

Every claim carries one of these tags. They refine the three provenance classes of the research contract; the mapping is given so the planner can apply its own rules.

| Tag | Meaning | Contract class |
|---|---|---|
| `[MEASURED: private stack]` | Run this session against a throwaway stack that was created for this research and removed afterwards: PostgreSQL 17.6 from the local Supabase image `public.ecr.aws/supabase/postgres:17.6.1.171`, GoTrue `public.ecr.aws/supabase/gotrue:v2.197.0` (the tag the running `supabase_auth_openvaa-local` container uses) with its environment mirrored from that container, and Mailpit `v1.30.2`, on a private Docker network and ports 55432 / 59999 / 58025. The repository's `00001_initial_schema.sql` and `seed.sql` at `03b8a0524` were loaded behind stubbed `storage.buckets` / `storage.objects`. | VERIFIED |
| `[MEASURED: tree @rev]` | Read or executed read-only on the working tree or with `git show <rev>:<path>`. Schema files were read at `03b8a0524`; the pgTAP files that were executed were extracted at `0a06627ba`. **`HEAD` moved three times during the session** (`03b8a0524` → `0a06627ba` → `c1153ae1b` → `f91825883`) because Phase 172 is executing. | VERIFIED |
| `[MEASURED: docker inspect]` | Read-only `docker inspect` of a running local container, 2026-10-06. | VERIFIED |
| `[READ: 172/173 plan]` | Stated by a plan of a phase that has not finished executing. Expected, not observed. | ASSUMED |
| `[CITED: url]` | Official documentation fetched this session. | CITED |
| `[ASSUMED]` | Not verified this session. Listed in the Assumptions Log. | ASSUMED |

Anchors are a path plus a symbol or quoted content, never a line number. Populations are given as commands. The scratch evidence (scripts and raw outputs) is in the session scratchpad under `r174/`: `rq1-{A,B,C,D}.out`, `rq2-D.out`, `rq3-*.out`, `rq4.out`, `rq5.out`, `ssr.out`, `proto.sql`, `proto-B.sql`, `proto-test.sql`, `proto-test-B.out`, `lint-A.out`, `lint-B.out`, `tap/*.out`.

**What was run and what was not.** Read-only `git grep` / `git show` / file reads; `docker inspect` of running containers; one read-only `SELECT` batch against the shared database (2026-10-06T00:21Z); the repository's `lint-schema.mjs` and pgTAP files pointed at the **private** database. No request was made to the shared auth service, no `yarn db:*`, no `yarn dev`, no E2E run, no write to the shared stack, no `git add` / `commit` / `checkout` / `stash`, no file written inside the repository. The three private containers, their anonymous volumes and the `r174net` network were removed at the end (`docker ps -a` and `docker network ls` show none; the thirteen `supabase_*` containers were still running).

## Summary

**The blocking question (RQ-1) has a definite answer: yes, the claim as specified is forgeable under the committed configuration.** On a GoTrue configured exactly as the local stack is, a public `POST /signup` with an arbitrary address and a password of the caller's choosing returned a session and a user whose `email_confirmed_at` was set, with zero mail sent. That caller then holds exactly what `claim_invitations` trusts. Turning confirmations on does **not** close it by itself: an attacker who signs up first with the victim's address leaves an unconfirmed account carrying the attacker's password, the victim's later click on the emailed link confirms that same account, and the attacker's password still signs in — measured. The one switch that closes both is `[auth] enable_signup = false`: with it, public sign-up and OTP user creation are refused, and a user row comes into being only through the service role. No application code calls `auth.signUp` or `auth.signInWithOtp`, so nothing in the product depends on public sign-up. Email change is not a way round it: under every configuration measured, a signed-in `PUT /user { email }` left the address pending until the new address clicked.

**Link issue and verification work as the decisions assume, with two corrections that change the plan.** (1) `generateLink({ type: 'magiclink' })` for an unknown address silently becomes a `signup` link and gives the new user a **generated password**; `admin.createUser` without a password does the same; and verifying an `invite` token sets a temporary one. The only issue path that leaves `encrypted_password` empty — which Phase 178's "password set" fact needs — is two calls: `invite` to create the user, then `magiclink` to mint the token that is mailed. (2) Every link the function issues is therefore of type `magiclink`, so the callback can no longer tell a first-time user from a returning one by `type`; it needs another signal.

**The SQL design was prototyped and run.** One table mirroring `grants`' four columns, two partial unique indexes, the authority map written inline in one policy per command, a server-generated code that an API caller can neither choose nor read back, and a definer `claim_invitations` that separates "already held" from "candidate already has an editor" by constraint name. Ninety-eight probe statements behaved as D-04..D-19 require. It moves exactly two existing pgTAP assertions and two ratified lists in `lint-schema.mjs`, all of which are security surfaces that need a stated reason.

**Primary recommendation:** In plan 2, set `[auth] enable_signup = false` and `[auth.email] enable_confirmations = true`, add a gate on both and a fail-closed check of GoTrue's `/settings` in the new Edge Function, and keep the claim predicate "the caller's own `auth.users` row has `email_confirmed_at` set". Issue every link with the two-call recipe, verify it with `type=magiclink`, and decide the callback's landing from the account's real password state, not from the link type.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| What an invitation promises; duplicates; who may promise what | Database (`public.invitations`, constraints, RLS) | — | The rule must hold for a direct PostgREST write as well as for the RPC (D-09) |
| Seeding | Database (`create_invitations`, `SECURITY INVOKER`) | E2E admin client / dev-seed client call it | No service role needed; one function for every caller (D-09) |
| Proof of an address | Auth service (GoTrue `/verify`) | Database reads `auth.users.email_confirmed_at` | Only GoTrue can say a token mailed to an address was presented |
| Whether an unproven address can become confirmed | Auth service **configuration** | Repository gate + Edge Function self-check | A SQL function cannot see GoTrue's settings; the configuration is the control (RQ-1) |
| Claim | Database (`claim_invitations`, `SECURITY DEFINER`) | Frontend server calls it, then refreshes | `grants` is not writable by any API role; `auth.users` is not readable by one |
| Code check, link request, code sign-in | Edge Function (anon-callable, service role inside) | Database helpers executable by `service_role` only | Needs `auth.admin.generateLink`, SMTP and a uniform answer; the frontend holds no service key (fact 13) |
| Sending the sign-in mail | Edge Function over SMTP | — | GoTrue's own mail carries a non-PKCE link whose session lands in the URL fragment (RQ-3) |
| Session, cookies, redirect | Frontend server (`api/auth/callback`, the two login actions) | — | Only the per-request server client writes the cookies (measured, RQ-7) |
| Throttles and attempt limits | Database (`private` table, definer function) | — | The only place every caller's requests meet; a header-keyed limit lets the caller pick the bucket (D-18) |

## Standard Stack

No package is added. Everything this phase needs is already pinned in the tree.

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| GoTrue (Supabase Auth) | `v2.197.0` | Link issue (`/admin/generate_link`), verification (`/verify`), sessions | The tag the running local container uses `[MEASURED: docker inspect]` |
| PostgreSQL | 17.6 (`supabase/postgres:17.6.1.171`) | Table, constraints, RLS, functions | `[MEASURED: docker inspect]`; `NULLS NOT DISTINCT` on a partial unique index and a `CHECK` calling an `IMMUTABLE` function both ran `[MEASURED: private stack]` |
| `@supabase/ssr` | 0.12.7 | Per-request server client; cookie writes | `[MEASURED: tree]` `yarn.lock`; refresh behaviour measured |
| `@supabase/supabase-js` | 2.117.2 | `verifyOtp`, `refreshSession`, `rpc`, `functions.invoke` | `[MEASURED: tree]` `yarn.lock` |
| `npm:@supabase/supabase-js@2.117.2`, `npm:nodemailer@10.0.11` | as imported by `functions/send-email/index.ts` | Service-role client and SMTP inside the new Edge Function | Already imported by an existing function with these exact specifiers `[MEASURED: tree @03b8a0524]`; use the same two, add none |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `sha256(bytea)` (core) for the code hash | `extensions.digest` from `pgcrypto` | `pgcrypto` 1.3 **is** installed in the `extensions` schema of the shared database and of a fresh Supabase image `[MEASURED: shared DB 2026-10-06T00:21Z; private stack]`, but the schema declares only `pg_net` (`git grep -n -i "create extension" -- apps/supabase/supabase/schema`). Depending on an extension the image happens to ship is a hidden dependency; the core function needs none. |
| `gen_random_uuid()` (core, `pg_catalog`) for randomness | `extensions.gen_random_bytes` | Same argument. Twelve bytes of one v4 uuid, skipping the two bytes that carry the version and variant bits, give 60 unbiased bits `[MEASURED: private stack]`. |
| One policy per command with the map inline | A `private` helper called by the policies | The helper form fails `lint-schema.mjs` check 9001 on all three policies and hides two newly enforced permissions from the pgTAP enforcement census (§ R-2). |

**Installation:** none.

## Package Legitimacy Audit

No external package is installed by this phase. The two `npm:` specifiers the new Edge Function imports are the ones `functions/send-email/index.ts` already imports, at the same pinned versions; the planner copies those import lines and adds no other.

**Packages removed due to [SLOP] verdict:** none. **Packages flagged as suspicious [SUS]:** none.

## RQ-1 — Can a confirmed address be obtained without a mail round-trip? (BLOCKING)

### What the local stack is configured as

`config.toml` at `03b8a0524` `[MEASURED: tree]`: `[auth] enable_signup = true`; `[auth.email] enable_signup = true`, `double_confirm_changes = true`, `enable_confirmations = false`, `max_frequency = "1s"`, `otp_expiry = 3600`. The running auth container's environment, which is what GoTrue actually reads `[MEASURED: docker inspect]`: `GOTRUE_DISABLE_SIGNUP=false`, `GOTRUE_MAILER_AUTOCONFIRM=true`, `GOTRUE_MAILER_SECURE_EMAIL_CHANGE_ENABLED=true`, `GOTRUE_EXTERNAL_EMAIL_ENABLED=true`, `GOTRUE_EXTERNAL_ANONYMOUS_USERS_ENABLED=false`, `GOTRUE_SMTP_MAX_FREQUENCY=1s`, `GOTRUE_RATE_LIMIT_EMAIL_SENT=360000` (not the `2` of `config.toml`), and **no `GOTRUE_RATE_LIMIT_HEADER`**.

### The four measurements, under four configurations `[MEASURED: private stack]`

A = as the local stack. B = confirmations on. C = public sign-up off. D = both.

| Probe (anon key unless stated) | A (local today) | B (`AUTOCONFIRM=false`) | C (`DISABLE_SIGNUP=true`) | D (both) |
|---|---|---|---|---|
| (a) `POST /signup` unknown address + password | **200, session returned, `email_confirmed_at` set, 0 mails** | 200, no session, unconfirmed, 1 mail | 422 `signup_disabled` | 422 `signup_disabled` |
| (a′) `POST /signup` for an address that has an account | 422 `user_already_exists` | 422 `user_already_exists` | 422 `signup_disabled` | 422 `signup_disabled` |
| (b) signed-in `PUT /user { email }` | **pending** (`email_change` set, `new_email` in the reply, mail to old and new) | pending | pending | pending |
| (b′) the same with `SECURE_EMAIL_CHANGE_ENABLED=false` | — | — | pending (mail to the new address only) | pending |
| (c) `POST /otp { create_user: true }` unknown | user created, **confirmed at once**, no session, 1 mail | user created, unconfirmed, 1 mail | 422 `signup_disabled` | 422 `signup_disabled` |
| (c′) `POST /otp { create_user: false }` unknown / known | 422 `otp_disabled` / 200 + mail | same | 422 `otp_disabled` / not measured | 422 `otp_disabled` / 200 + mail |
| (d) service `generate_link` `magiclink`, unknown | **becomes `verification_type: signup`**; user created unconfirmed **with a generated password** | same | same | same |
| (d) `invite`, unknown | user created unconfirmed, `encrypted_password = ''`, `invited_at` set | same | same | same |
| (d) `signup` (password supplied), unknown | unconfirmed, password set | same | same | same |
| (d) `recovery`, unknown | 404 `user_not_found` | same | same | same |
| (d) known **confirmed** user: `magiclink` / `invite` / `signup` / `recovery` | ok / 422 `email_exists` / 422 `email_exists` / ok | — | — | ok / 422 `email_exists` / — / ok |
| service `admin.createUser` without `email_confirm` | — | — | unconfirmed | unconfirmed |

`generate_link` never sent a mail in any configuration (0 messages in the catcher). The session a public sign-up returns in A carries `amr: [{ method: "password" }]`.

**The pre-hijack sequence** (public sign-up of the victim's address with the attacker's password; then the service issues a link for that address; the victim opens it; the attacker signs in with the password) `[MEASURED: private stack]`:

| | A | B | D |
|---|---|---|---|
| attacker's sign-up | 200 + session | 200, unconfirmed account created | 422 `signup_disabled` |
| link issued for the address | `magiclink` for the attacker's account | `magiclink` (and `invite`) for the attacker's unconfirmed account | a new account is created by the service |
| the victim's click | confirms nothing new | **confirms the attacker's account** | confirms the service-created account |
| attacker's password sign-in afterwards | **200, session** | **200, session** | 400 `invalid_credentials` |

### What makes "this session has proven control of this address by a mail round-trip" true and unforgeable

`auth.users.email_confirmed_at IS NOT NULL` for `auth.uid()` means exactly that **if and only if** no unauthenticated caller can bring a user row into existence. Then a row is created only by the service role (the new Edge Function, `identity-callback`, the E2E `forceRegister`), a row created by `generate_link` is unconfirmed until its token is verified, a row created with `email_confirm: true` is one the service vouches for, and a changed address stays pending until the new address clicks. The configuration that gives this is:

- **`[auth] enable_signup = false`** (`GOTRUE_DISABLE_SIGNUP=true`) — necessary and, on the measurements above, sufficient.
- **`[auth.email] enable_confirmations = true`** (`GOTRUE_MAILER_AUTOCONFIRM=false`) — on these measurements it changes nothing once sign-up is off (no row of column C differs from D). It is recommended as the second lock: if sign-up is ever re-enabled, autoconfirm is what turns the mistake into an immediate forgery, and it costs nothing here because every service-side `createUser` in the tree passes `email_confirm: true`.

The code-side predicate stays as D-14 states it, with one addition that is free: the claim reads `email` and `email_confirmed_at` from `auth.users` for `auth.uid()` and matches nothing when either is null.

### The remedies compared

| Remedy | Closes direct forgery (a) | Closes pre-hijack | Breaks |
|---|---|---|---|
| Confirmations on only | yes | **no** `[MEASURED]` | nothing in the tree |
| Public sign-up off only | yes | yes | nothing in the tree |
| **Both (recommended)** | yes | yes | nothing in the tree |
| A predicate on the session's AMR instead (`auth.mfa_amr_claims` for the token's `session_id` holds `otp`) | yes | **no** — the victim's own `otp` session claims into the pre-registered account, and the grant gate reads grants, not AMR | the claim on **password** sign-in (D-14 requires the login action to claim), so a returning user would need a mail round-trip for every new invitation |
| `[auth.email] enable_signup = false` (`GOTRUE_EXTERNAL_EMAIL_ENABLED=false`) | yes | yes | **password sign-in** (422 `email_provider_disabled`), `/recover` (400) `[MEASURED]` — not usable |

AMR facts, for the record `[MEASURED: private stack]`: every email-link verification (`invite`, `signup`, `magiclink`, `recovery`) yields `amr: [otp]`; a password grant yields `[password]`; the claim survives a refresh and is stored per session in `auth.mfa_amr_claims`.

### Fallout of the recommended configuration, as commands

```bash
# 1. No product or test code signs up publicly or asks GoTrue for an OTP. Expect zero lines.
git grep -n -P '\bauth\s*\.\s*(signUp|signInWithOtp|signInAnonymously|signInWithOAuth|signInWithIdToken)\b' -- ':!.planning' ':!*.md' ':!apps/docs' ':!.claude'

# 2. Every service-side user creation vouches for the address. Expect three sites, each with email_confirm: true.
git grep -n -A4 'auth\.admin\.createUser' -- tests/tests/utils/supabaseAdminClient.ts apps/supabase/supabase/functions/identity-callback/index.ts

# 3. What still talks to GoTrue with the anon key: password sign-in, password reset, set password, the two verifyOtp sites.
git grep -n -P '\bauth\s*\.\s*(signInWithPassword|resetPasswordForEmail|updateUser|verifyOtp)\b' -- apps/frontend/src tests ':!*.test.ts'

# 4. After the stack restart, the container must show the new values (read-only).
docker inspect supabase_auth_openvaa-local --format '{{range .Config.Env}}{{println .}}{{end}}' | grep -E '^GOTRUE_(DISABLE_SIGNUP|MAILER_AUTOCONFIRM)='
#    expected: GOTRUE_DISABLE_SIGNUP=true and GOTRUE_MAILER_AUTOCONFIRM=false

# 5. The same fact from the served API, which is what the Edge Function's self-check reads.
curl -s "$PUBLIC_SUPABASE_URL/auth/v1/settings" -H "apikey: $PUBLIC_SUPABASE_ANON_KEY" | jq '{disable_signup, mailer_autoconfirm}'
```

Each consumer under D `[MEASURED: private stack]` unless marked:

| Consumer | Under D |
|---|---|
| E2E `forceRegister` / `forceRegisterAdmin` (`admin.createUser({ email, password, email_confirm: true })`) | creates a confirmed user; password sign-in 200 |
| Email-flow specs' password reset (`resetPasswordForEmail` → `/recover`) | 200 for a known and for an unknown address; recovery token verifies |
| Admin-app and Contestant-app password sign-in | 200 |
| `identity-callback` (`admin.createUser({ email_confirm: true })` on `<sub>@bank-auth.placeholder`, then `generateLink({ type: 'magiclink' })`, then `verifyOtp`) | createUser 200 and confirmed; `magiclink` for a known confirmed user 200; verify 200 |
| The legacy `sendEmail` helper (`admin.inviteUserByEmail`) | still works (it is an admin call) — it is removed by D-22, not broken by the configuration |
| `[auth.rate_limit] email_sent = 2` | does not bind the function's own SMTP mail: `generate_link` sends nothing, and 35 consecutive calls for one user all returned 200 |

Two things the configuration does **not** change, both pre-existing:

- **GoTrue itself distinguishes registered from unregistered addresses**: `POST /otp` answers 200 (and mails GoTrue's own English "Your sign-in link" mail, with a non-PKCE link) for a registered address and 422 for an unregistered one, in every configuration measured. D-15's gate governs this phase's endpoint; it cannot govern GoTrue's. Under D-02 the leak is "this address has an account", not "this address was invited". See Open Questions for the Operator (OQ-6).
- **A deployment's hosted settings live in the dashboard, not in `config.toml`.** `[ASSUMED]` A hosted project must have "Allow new users to sign up" off and "Confirm email" on; nothing in the repository can set that. Hence the function's self-check below.

### Recommendation

1. Plan 2 sets both keys in `config.toml`. The stack reads them at start: one `yarn db:stop` + `yarn db:start` per developer and per gate run (CONTEXT O-13).
2. A repository gate asserts both keys (a vitest next to the existing gates, or a `scripts/assert-*.mjs` link of `yarn lint:check`), so a later edit cannot reopen the hole silently.
3. The new Edge Function, before it issues any link, reads `GET {SUPABASE_URL}/auth/v1/settings` once per worker and **refuses to issue** unless `disable_signup === true && mailer_autoconfirm === false`. Both keys are in that response `[MEASURED: private stack]`. A misconfigured deployment then fails loudly at the first sign-in request, in E2E as in production.
4. One E2E assertion in the default run: an anon `POST /auth/v1/signup` answers 422 `signup_disabled`. It is the only check that observes the running service.
5. D-23's rule stands and is now concrete: **the plan that grants `EXECUTE` on `claim_invitations` to `authenticated` must not close while command 4 above shows `GOTRUE_DISABLE_SIGNUP=false`.**

## RQ-2 — `admin.generateLink` for an address with no account

`[MEASURED: private stack]`, identical in all four configurations:

| Call | User created? | `verification_type` returned | `encrypted_password` afterwards | Confirmed before verify? |
|---|---|---|---|---|
| `magiclink` | yes | **`signup`** | **set** (60-char hash of a generated password) | no |
| `invite` | yes | `invite` | **empty string** | no |
| `signup` (needs `password`) | yes | `signup` | set | no |
| `recovery` | no — 404 `user_not_found` | — | — | — |
| `admin.createUser({ email })` (no password) | yes | — | **set** | no |
| `admin.createUser({ email, email_confirm: true })` (the `identity-callback` shape) | yes | — | **set** | yes |

Verifying changes the picture again: a token verified as `invite` (or as `signup` / `email` while the user is invited and passwordless) **sets a temporary password** — `encrypted_password` went from empty to set. Verifying a `magiclink` token leaves it untouched.

**The recipe that leaves a link-created user with no password** (run twice, verified as `magiclink` and as `email`):

1. `generateLink({ type: 'invite', email })` — creates the user with an empty password. Discard the token. For a user who already exists and is confirmed it answers 422 `email_exists`: ignore that one error code.
2. `generateLink({ type: 'magiclink', email })` — the user now exists, so the type stays `magiclink`. Mail this `hashed_token`.
3. The callback verifies with `type: 'magiclink'`. Result: `email_confirmed_at` set, `encrypted_password` still `''`, `amr: [otp]`.
4. `PUT /user { password }` on that session sets the password (200). A user who never does stays at `''` across further links, and a password sign-in against an empty hash answers 400 `invalid_credentials` for any input.

Consequences:

- **D-15 must create the user explicitly first** (step 1). A single `magiclink` call gives the new user a password nobody knows, and Phase 178's "password set" fact would read true for someone who never set one.
- **CONTEXT fact 19 is wrong in one clause**: `identity-callback`'s users are created confirmed, but **not** "with no password" — their `encrypted_password` is a hash of a generated password. A "password set" signal read from that column is true for every bank-auth user. Phase 178 / 179 must not treat the column as the signal for them (cross-phase note, O-3 / O-8).
- The signal is a property of GoTrue `v2.197.0`'s behaviour, measured, not documented. If Phase 178 wants something a GoTrue upgrade cannot move, the set-password action must record the fact itself.

## RQ-3 — the non-PKCE `/verify` redirect

`[MEASURED: private stack]` `GET /verify?token=<hashed_token>&type=invite&redirect_to=http://localhost:5173/api/auth/callback` answered **303** to `http://localhost:5173/api/auth/callback` with **no query parameters** and a **fragment** carrying `access_token, expires_at, expires_in, refresh_token, sb, token_type, type`. The grounding of 174-D7 is confirmed: a server route cannot see the fragment, so GoTrue's default mail cannot complete at the callback. A `redirect_to` outside the allow-list was replaced by `site_url`. The `action_link`'s `token` parameter is the `hashed_token`.

## RQ-4 — the `token_hash` link

`[MEASURED: private stack]` `POST /verify { type, token_hash }`, which is what `verifyOtp({ token_hash, type })` sends:

| Token issued as | verify as `invite` | `signup` | `magiclink` | `email` | `recovery` |
|---|---|---|---|---|---|
| `invite` (new address) | 200 | 200 | 403 | 200 | 403 |
| `signup` (a `magiclink` request for a new address) | 200 | 200 | 403 | 200 | 403 |
| `magiclink` (known confirmed user) | 403 | 403 | 200 | 200 | 200 |
| `recovery` (known confirmed user) | 403 | 403 | 200 | 200 | 200 |
| `magiclink` (invited, not yet confirmed — the recipe) | — | — | 200 | 200 | — |

- Every success is a session with `amr: [otp]` and sets `email_confirmed_at`. Every failure is 403 `otp_expired` ("Email link is invalid or has expired").
- **Single use:** the second presentation of a verified token answers 403 `otp_expired`.
- **Expiry:** with `GOTRUE_MAILER_OTP_EXP=2`, a token presented after four seconds answered 403 `otp_expired`; the committed value is 3600.
- **Re-issue:** issuing a second token of the same family replaces the first (an earlier `invite` token answered 403 after a later `invite` was issued). A later request therefore invalidates an earlier unopened mail of the same kind.
- **Which callback arm:** with the recipe the mailed token is always `magiclink`. The callback at `c1153ae1b` has arms for `recovery`, `invite`, and `email` / `signup`; `magiclink` falls to `default` → `ContestantAppHome`. So the callback needs a `magiclink` arm, and **the type no longer says whether the user is new** (D-20's "first-time → set-password, returning → home" cannot be decided from it). See OQ-5.

## RQ-5 — rate limits

`[MEASURED: private stack]`

- **With the environment the local container has (no `GOTRUE_RATE_LIMIT_HEADER`) GoTrue applies no per-address limit at all**: 40 wrong-password sign-ins all answered 400, 35 bad `/verify` calls all 403. Local E2E therefore neither proves nor disproves anything about the per-IP limits.
- With `GOTRUE_RATE_LIMIT_HEADER=X-Forwarded-For`: after 30 or 31 password attempts under one header value (three runs) every further one answered 429 `over_request_rate_limit`; a different header value was a fresh bucket; **a request with no such header was not limited**. `/verify`: 30, then 429.
- `GOTRUE_SECURITY_SB_FORWARDED_FOR_ENABLED=true` makes a request's `Sb-Forwarded-For` header replace the bucket key — **with the anon key as well as with the service key**. Whether a hosted project has it on is not observable from here.
- `/admin/generate_link`: never limited, and sends no mail, so `email_sent` does not bind the function's SMTP mail (the expectation in CONTEXT RQ-5 holds).
- GoTrue's own mail endpoints carry a per-user minimum interval (`max_frequency`, `over_email_send_rate_limit`); it does not apply to `generate_link`.

**What a server-side throttle must therefore do.** A password sign-in made by the Edge Function reaches GoTrue from the function, so on a deployment with a rate-limit header every code sign-in shares one bucket, and on the local stack there is no bucket. Neither is a control. The limits belong in the database, keyed on things an attacker cannot choose: the **address** for link requests (60 s minimum interval, J4) and the **code row** for password attempts (D-18). Both were prototyped (§ R-1.7): the second request for one address inside 60 s returned "do not send"; the eleventh password attempt against one used code inside 15 minutes was answered as an unknown code is.

## RQ-6 — the call topology (partly unresolved)

Not measured: it needs a request to the shared Edge runtime, which this run may not make. What is known:

- `[MEASURED: tree]` `config.toml` has no `[functions.*]` block, and `[edge_runtime] policy = "oneshot"`.
- `[CITED: https://supabase.com/docs/guides/functions/function-configuration]` "By default, Edge Functions require a valid JWT in the authorization header." Whether the anon key satisfies it is not stated there. `[ASSUMED]` It does (the legacy anon key is a JWT signed by the project); the existing bank-auth driver sidesteps the question by serving `identity-callback` with `--no-verify-jwt` (`171-bankauth.sh`), so the suite has never shown it.
- `[MEASURED: docker inspect]` The Edge runtime container's environment is fixed when the stack starts and holds `PUBLIC_PROJECT_ID=00000000-0000-0000-0000-000000000001`, while the E2E wrapper serves the frontend for project `00000000-0000-0000-0000-0000000000e2` (`tests/scripts/e2e-run.sh`, `E2E_PROJECT_ID_DEFAULT`). **A function that takes its project from its own environment, as `identity-callback` does, would look for invitations in the wrong project in the default E2E run.** The new function must take `project_id` from the request and be dispositioned `'requires a project term'` in `PROJECT_SCOPED_EDGE_FUNCTIONS`.
- `[ASSUMED]` Peer addresses: a browser calling the function directly is seen through the gateway's forwarded headers; a SvelteKit action calling it is seen as the frontend server. The frontend holds no secret with which to vouch for a forwarded address (fact 13).

**Recommendation.** Do not key any limit on a header. Take `check code` and `request link` straight from the data writer (browser or server, either is fine because the answer is uniform and the limits are in SQL); take `code sign-in` from a SvelteKit action, because only the server client can write the session cookies. Wave 0 of plan 3 answers the two open facts with one request each against the local function.

## RQ-7 — the refresh

`[MEASURED: private stack]` with the repository's own `@supabase/ssr` 0.12.7 and `@supabase/supabase-js` 2.117.2, a `createServerClient` whose `cookies.getAll` / `setAll` recorded every write, against the private GoTrue with the access-token hook enabled:

| Step, all on one client (one request) | Observed |
|---|---|
| `verifyOtp({ token_hash, type: 'magiclink' })` | session; token's `grants` = `[]`; two cookie writes |
| a grant row is written for that user | — |
| `getSession()` | **still the old token**, `grants` = `[]` |
| `refreshSession()` | no error; the returned token carries the new grant; `getSession()` now returns it; **one cookie write, already done when the call resolves** (checked with no wait) |
| `getUser()` | verifies the new token |
| a new client reading only those cookies (the next request) | `grants` carries the new grant |
| `signInWithPassword`, a second grant written, `refreshSession()` | the token gains the grant; one cookie write; `amr` stays `[password]` |
| a second `refreshSession()` immediately after | no error (`refresh_token_reuse_interval = 10`) |

- **How the hook builds the claim** `[MEASURED: tree @03b8a0524]` `301-auth-functions.sql`, `custom_access_token_hook`: it sets `claims.grants` to the `jsonb_agg` of `public.grants` rows for `(p_event->>'user_id')::uuid`, each with exactly the keys `'scope'`, `'target_type'`, `'target_id'`, `'role'`. It runs on every issue, a refresh included.
- **How `passwordLogin` reads the token** `[MEASURED: tree @c1153ae1b]` `apps/frontend/src/lib/auth/passwordLogin.ts`: after `signIn` it calls `context.getSession()` and tests `hasAnyGrant(readGrants(session.access_token), allowedGrants)`, signing out with `{ ok: false, status: 403, reason: 'grantNotAllowed' }` otherwise. `context.getSession` is `locals.safeGetSession`.
- **`safeGetSession` sees the refreshed token** `[MEASURED: tree @c1153ae1b]` `apps/frontend/src/lib/supabase/safeGetSession.ts`: it calls `supabase.auth.getSession()` on every call and memoises the verification **per access token**, so a token replaced by `refreshSession()` is read and verified afresh. No change to it is needed.

**The order, in every entry point:** establish the session → `claim_invitations` → `refreshSession()` → only then read the session for a grant gate or load an entity. Skipping the refresh when the claim returned nothing claimed is safe, because the token was issued a moment earlier by the same request and already projects every existing grant.

## R-1 — Schema design (prototyped and run)

Everything in this section ran on the private PostgreSQL 17.6 holding the repository's migration at `03b8a0524` `[MEASURED: private stack]`. The full text is `r174/proto.sql` with `r174/proto-B.sql` applied over it; the case list and its output are `r174/proto-test.sql` and `r174/proto-test-B.out`. Names are provisional and the planner's.

### R-1.1 The model it writes against `[MEASURED: tree @03b8a0524]`

`300-auth-tables.sql`, `public.grants`: columns `scope grant_scope_type NOT NULL`, `target_type entity_type`, `target_id uuid`, `role grant_role_type NOT NULL`; constraints `grants_user_scope_target_role_key UNIQUE NULLS NOT DISTINCT (user_id, scope, target_type, target_id, role)`, `grants_entity_scope_target_type_check CHECK ((target_type IS NOT NULL) = (scope = 'entity'))`, `grants_target_id_scope_check CHECK ((target_id IS NULL) = (scope = 'global'))`; `CREATE UNIQUE INDEX idx_grants_one_candidate_editor ON public.grants (target_id) WHERE scope = 'entity' AND target_type = 'candidate' AND role = 'editor'`; `REVOKE ALL ON TABLE public.grants FROM authenticated, anon, public`. Enums in `000-enums.sql`: `grant_scope_type AS ENUM('global', 'account', 'project', 'entity')`, `grant_role_type AS ENUM('admin', 'editor')`, `entity_type AS ENUM('candidate', 'organization', 'faction', 'alliance')`.

`301-auth-functions.sql`, `grant_role_permissions`: `project.edit_entities` and `entity.confirm` are held by `(global, admin)`, `(account, admin)`, `(project, admin)` and `(project, editor)`; `project.manage_editors` by the first three; `account.manage_admins` by the first two. The fall-through arm, in its own words, covers "global+editor, account+editor and entity+admin: the empty set". `project.read_entities` has the same four holders as `project.edit_entities`.

### R-1.2 The table

```sql
CREATE TABLE public.invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  scope public.grant_scope_type NOT NULL,
  target_type public.entity_type,
  target_id uuid,
  role public.grant_role_type NOT NULL,
  email text,
  code_hash text,
  pending_email text,
  pending_email_at timestamptz,
  expires_at timestamptz,
  created_by uuid DEFAULT auth.uid() REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  claimed_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  claimed_at timestamptz,
  CONSTRAINT invitations_entity_scope_target_type_check CHECK ((target_type IS NOT NULL) = (scope = 'entity')),
  CONSTRAINT invitations_target_id_scope_check CHECK ((target_id IS NULL) = (scope = 'global')),
  CONSTRAINT invitations_scope_check CHECK (scope IN ('project', 'entity')),
  CONSTRAINT invitations_project_target_check CHECK (scope <> 'project' OR target_id = project_id),
  CONSTRAINT invitations_role_confers_check CHECK (cardinality(public.grant_role_permissions (scope, role, target_type)) > 0),
  CONSTRAINT invitations_binding_check CHECK (num_nonnulls(email, code_hash) = 1),
  CONSTRAINT invitations_email_normalised_check CHECK (email = lower(btrim(email)) AND email <> ''),
  CONSTRAINT invitations_code_hash_format_check CHECK (code_hash ~ '^[0-9a-f]{64}$'),
  CONSTRAINT invitations_pending_email_check CHECK (
    pending_email IS NULL OR (code_hash IS NOT NULL AND pending_email = lower(btrim(pending_email)) AND pending_email <> '')
  ),
  CONSTRAINT invitations_claimed_by_needs_claimed_at_check CHECK (claimed_by IS NULL OR claimed_at IS NOT NULL)
);
```

- The first two CHECKs are `grants`' own, renamed. The next three are the "refused for every caller" rows of D-09 made structural: they bind `service_role` too, which bypasses row-level security. Measured: the service role seeding `(account, …)` → `23514 invitations_scope_check`.
- `invitations_role_confers_check` calls an `IMMUTABLE` function; PostgreSQL accepted it. It is checked when a row is written, not when the matrix later changes.
- "Claimed" is `claimed_at IS NOT NULL` (D-08). Both user columns are `ON DELETE SET NULL`. Measured: after deleting the claimant the row reads `claimed_by = NULL`, `claimed_at` set, status `used`, and neither a link request nor a second user's claim reopens it.
- GoTrue stores addresses lower-cased (`Mixed.Case-…@R174.Test` was stored as `mixed.case-…@r174.test`), so `lower(btrim(…))` on both sides matches `[MEASURED: private stack]`.
- Indexes: `idx_invitations_project_id`, `idx_invitations_scope_target (scope, target_type, target_id)` for the cleanup triggers, `idx_invitations_created_by`, `idx_invitations_claimed_by`. With these, `lint-schema.mjs` check 0001 reports no unindexed foreign key on the table (the three warnings it does print exist at `03b8a0524` without the prototype).
- Cleanup: one `SECURITY DEFINER` trigger function, `AFTER DELETE` on the four entity tables with the entity type as argument, deleting rows with that `(scope = 'entity', target_type, target_id)`. Measured: deleting a candidate removed its invitation. A project delete cascades through the foreign key.

### R-1.3 Duplicates (D-07, INV-02)

```sql
CREATE UNIQUE INDEX invitations_email_target_key ON public.invitations (project_id, email, scope, target_type, target_id)
  NULLS NOT DISTINCT WHERE email IS NOT NULL;
CREATE UNIQUE INDEX invitations_code_hash_key ON public.invitations (project_id, code_hash) WHERE code_hash IS NOT NULL;
```

Both were accepted by PostgreSQL 17.6, the first combining `NULLS NOT DISTINCT` with a partial predicate. Measured:

| Case | Result |
|---|---|
| same email, same target, again (address typed in another case) | `23505 invitations_email_target_key`; the first row still one row, `created_at` unchanged |
| same email, another target | written |
| a batch of two whose second item is a duplicate | `23505`; **zero** rows of the batch written |
| project scope, same email, same project, the **other role** | `23505 invitations_email_target_key` — the role is outside the key, and `NULLS NOT DISTINCT` is what makes the null `target_type` collide |
| a second row carrying an existing `code_hash`, another target (service role) | `23505 invitations_code_hash_key` |
| `email` and `code_hash` on one row | `23514 invitations_binding_check` |

D-07's proposed wording for INV-02 and criterion 2 is therefore implementable exactly as written.

### R-1.4 The code: storage, generation, and the direct-insert hole (D-05, D-06)

- **Normalise:** `translate(regexp_replace(upper(coalesce(p_code, '')), '[^0-9A-Z]', '', 'g'), 'OIL', '011')`. **Hash:** `encode(sha256(convert_to(<normalised>, 'UTF8')), 'hex')`. One function each, used by the trigger, the status check and the binding. Measured: a code typed lower-case with spaces in place of hyphens answered `valid`.
- **Generate:** twelve symbols, each `get_byte(uuid_send(gen_random_uuid()), i) & 31` for `i` in `0,1,2,3,4,5,9,10,11,12,13,14` (bytes 6 and 8 carry the uuid's version and variant bits). 20,000 generated codes were all distinct, and over 64,000 samples each of the 32 symbols appeared between 1,911 and 2,088 times.
- **⚠ D-06's alphabet does not exist as stated.** "32 symbols without look-alikes (`0/O`, `1/I/L`)": the digits and letters minus `0, O, 1, I, L` are **31** symbols. Thirty-two symbols and no ambiguity is Crockford's alphabet, `0123456789ABCDEFGHJKMNPQRSTVWXYZ` (no `I, L, O, U`), with `O → 0` and `I, L → 1` folded on input — which is what the prototype uses, and it gives exactly 60 bits with an unbiased mask. Thirty-one symbols would need rejection sampling and give 59.4 bits. See OQ-2.
- **The hole is closed by column privileges plus a trigger**, measured:

| A project editor's direct `INSERT` through the table | Result |
|---|---|
| naming `code_hash` | `42501 permission denied for table invitations` |
| naming `claimed_at`, `claimed_by` or `pending_email` | `42501` |
| with no `email` (asking for a code row) | written; the `BEFORE INSERT` trigger generated the code and its hash; **the plaintext is returned to nobody**, so the row is dead weight an admin can delete |

`authenticated` is granted `INSERT (project_id, scope, target_type, target_id, role, email, expires_at)` and nothing else. The trigger (a `SECURITY INVOKER` function; a trigger may set columns the caller holds no privilege on) generates the code when `email` is null, sets `code_hash`, and hands the plaintext to `create_invitations` through a transaction-local setting (`set_config('…', v_code, true)`), which the RPC reads and clears straight after each `INSERT`. A direct PostgREST insert is its own transaction, so it has no later statement in which to read the setting. `create_invitations` stays `SECURITY INVOKER` as D-09 requires.

### R-1.5 Row-level security, the authority map, and INV-05

```sql
CREATE POLICY "admin_insert_invitations" ON public.invitations FOR INSERT TO authenticated WITH CHECK (
  (scope = 'entity' AND role = 'editor'
     AND (SELECT private.entity_project_id (target_type, target_id)) = project_id
     AND (SELECT user_can ('project', project_id, 'project.edit_entities')))
  OR (scope = 'project' AND role = 'editor' AND target_id = project_id
     AND (SELECT user_can ('project', project_id, 'project.manage_editors')))
  OR (scope = 'project' AND role = 'admin' AND target_id = project_id
     AND (SELECT user_can ('account', private.project_account_id (project_id), 'account.manage_admins')))
);
```

`SELECT` has the same three arms with `project.read_entities` in the first (same four holders, and a read member distinct from the write member). `DELETE` is `claimed_at IS NULL AND (` the `INSERT` expression `)`. There is no `UPDATE` policy and no `UPDATE` privilege. `private.project_account_id (uuid)` is a new two-line `SECURITY DEFINER` helper, so the account lookup does not depend on the caller's read access to `projects`. `SELECT` is granted on every column except `code_hash`, `pending_email` and `pending_email_at`. Everything is revoked from `PUBLIC` and `anon`.

Measured, through `create_invitations` and identically through a direct insert where marked:

| Caller | Promise | Result |
|---|---|---|
| project editor | `(entity, candidate, c1, editor)` by email | written |
| project editor | `(entity, organization, o1, editor)` by code | written; code matches `XXXX-XXXX-XXXX` |
| project editor | `(project, editor)` — **the self-promotion case** | `42501` row-level security (also on a direct insert of `(project, admin)`) |
| project editor | `(project, admin)` | `42501` |
| project admin | `(project, editor)` | written |
| project admin | `(project, admin)` — peer level | `42501` |
| account admin | `(project, admin)` | written |
| root admin | `(account, …)`, `(global, …)`, `(entity, candidate, admin)` | `42501` |
| root admin | `(project, editor)` naming **another** project as `target_id` | `42501` |
| project editor | a candidate of project B, seeded into project A | `42501` |
| project editor of A | seeding into project B | `42501` |
| entity editor | their own candidate | `42501` |
| `anon` | the RPC | `42501 permission denied for function` |
| service role | `(entity, candidate, editor)` by code | written |
| service role | `(account, …)` | `23514 invitations_scope_check` |
| project admin | any `UPDATE` | `42501 permission denied` |
| project admin | `SELECT code_hash`, `SELECT pending_email`, `SELECT *` | `42501 permission denied` |
| `anon` | `SELECT` | `42501` |
| entity editor / project editor / project admin / account admin | `SELECT id` | 0 rows / entity promises only / + project-editor promises / all shapes |

**Why the map is inline and not in a helper.** A helper form (`private.caller_may_promise(…)` called by the three policies) produced identical outcomes, and then failed `lint-schema.mjs` check 9001 three times: "policy admin_…_invitations … reaches neither a permission literal nor a named mechanism helper" `[MEASURED: r174/lint-A.out]`. The inline form names the permission literals in `pg_policies`, which is where that check and the pgTAP enforcement census both look.

**Why not one policy per shape.** Three permissive `INSERT` policies would each name exactly one permission, which makes each a "discriminating policy" for `25-matrix-conformance.test.sql` Section 3. That section ranks a member's discriminating policies by the first of `'entity'::grant_scope_type`, `'project'::…`, `'account'::…` found in the policy text; a policy containing `scope = 'entity'` beside `'project.edit_entities'` would rank first for that member and the assertion "delegation: every member with a discriminating policy is asked at the scope the grid probed it at" would report `project.edit_entities expected project` as missing `[MEASURED: tree @0a06627ba, by reading the query; not run in that shape]`. One policy per command, naming three members, is not discriminating and leaves Section 3 alone.

**INV-05.** `create_invitations` runs, per entity-scope item, `UPDATE public.<table> SET confirmed = true WHERE id = … AND project_id = … AND NOT confirmed AND <has a name>`. For a candidate "has a name" is `btrim(first_name) <> '' AND btrim(last_name) <> ''` (both columns are `text NOT NULL`, so a nameless candidate is one with empty strings); for the other three types it is "the localized `name` is an object with at least one non-blank value". The statement runs as the caller, so `enforce_entity_immutability` asks `entity.confirm`, which every holder of `project.edit_entities` also holds; the service role is not bound by the trigger (`current_user <> 'authenticated'`). Measured: the named candidate and the named organization read `confirmed = true` after the call; the nameless candidate, the nameless organization and a candidate nobody invited read `false`; a project-scope promise touched nothing.

### R-1.6 `create_invitations` and `claim_invitations`

`create_invitations(p_project_id uuid, p_invitations jsonb) RETURNS jsonb`, `SECURITY INVOKER`, `search_path = ''`. Items: `{ scope? = 'entity', role? = 'editor', target_type, target_id | external_id, email?, expires_at? }`; `external_id` is resolved under the caller's own row-level security inside `p_project_id` only; an unknown one raises and aborts the batch. Returns one object per item with `id`, the four spec columns, `email`, and `code` (plaintext, formatted, or null). `EXECUTE` for `authenticated` and `service_role`; revoked from `PUBLIC` and `anon`. Being `SECURITY INVOKER`, it is **not** in the definer census. Returning `jsonb` rather than `RETURNS TABLE` keeps it out of `assert-rpc-return-nullability.mjs`, which harvests only `RETURNS TABLE` functions.

`claim_invitations(p_project_id uuid) RETURNS jsonb`, `SECURITY DEFINER`, `search_path = ''`, `EXECUTE` for `authenticated` only. The skeleton that ran:

```sql
SELECT lower(btrim(u.email)) INTO v_email FROM auth.users u
WHERE u.id = (SELECT auth.uid()) AND u.email_confirmed_at IS NOT NULL AND NULLIF(btrim(u.email), '') IS NOT NULL;
-- no confirmed address: return {"claimed": [], "skipped": []}
FOR v_row IN SELECT i.* FROM public.invitations i
  WHERE i.project_id = p_project_id AND i.claimed_at IS NULL
    AND (i.expires_at IS NULL OR i.expires_at > now())
    AND (i.email = v_email OR (i.code_hash IS NOT NULL AND i.pending_email = v_email))
  ORDER BY i.created_at, i.id FOR UPDATE
LOOP
  -- (1) no foreign key holds the target: re-ask that it is still an entity of this project
  IF v_row.scope = 'entity' AND private.entity_project_id(v_row.target_type, v_row.target_id) IS DISTINCT FROM v_row.project_id THEN
    -- skipped, reason 'target_not_in_project'
  END IF;
  BEGIN
    INSERT INTO public.grants (user_id, scope, target_type, target_id, role) VALUES (v_uid, v_row.scope, v_row.target_type, v_row.target_id, v_row.role);
  EXCEPTION WHEN unique_violation THEN
    GET STACKED DIAGNOSTICS v_constraint = CONSTRAINT_NAME;
    IF v_constraint = 'grants_user_scope_target_role_key' THEN NULL;                 -- already held: fulfilled, mark claimed
    ELSIF v_constraint = 'idx_grants_one_candidate_editor' THEN /* skipped, reason 'candidate_has_editor' */ CONTINUE;
    ELSE RAISE; END IF;
  END;
  UPDATE public.invitations SET claimed_by = v_uid, claimed_at = now(), pending_email = NULL, pending_email_at = NULL WHERE id = v_row.id;
END LOOP;
```

- **What it never trusts:** an address or a user id from the caller (it takes neither), and the token's `email` claim (it reads the table). `p_project_id` only chooses which of the caller's own invitations to look at.
- Measured:

| Case | Result |
|---|---|
| `anon` | `42501 permission denied for function` |
| a confirmed stranger with another address | `{"claimed": [], "skipped": []}`; no grant |
| the invited address, **not confirmed** | `{"claimed": [], "skipped": []}`; no grant |
| the invited, confirmed address (candidate and organization by email) | both claimed; the user's grants are exactly those two |
| the same call again; the same call for another project | nothing claimed |
| a code row before an address is bound | nothing claimed |
| a code row after binding: the earlier-bound address / the currently bound address | nothing / claimed |
| after the claim: status; a link request with the used code and another address; that other user's claim | `used`; do not send; nothing |
| three rows for one address — a candidate another user already edits, a free candidate, an organization | two claimed, one skipped with `reason: candidate_has_editor`; the skipped row's `claimed_at` still null |
| an invitation for the grant its user **already holds** on a candidate (both unique rules are violated) | claimed; **the constraint named is `grants_user_scope_target_role_key`**, so it is read as fulfilled; one grant on that candidate afterwards |
| an expired row | not claimed; its address is not eligible for a link |
| a row whose candidate was moved to another project by the owner | skipped, `reason: target_not_in_project` |
| the whole flow with real GoTrue tokens: seeded → link issued by the two-call recipe → claim attempted before the link is opened → link verified → claim → refresh | nothing before; one grant claimed after; the refreshed token's `grants` claim carries it; `encrypted_password` still `''` |

### R-1.7 The helpers behind the Edge Function

`supabase-js` in an Edge Function reaches only schemas PostgREST exposes, so these live in `public` with `EXECUTE` revoked from `PUBLIC`, `anon` and `authenticated` and granted to `service_role` — the arrangement `resolve_email_variables` already uses in `502-email-helpers.sql`. Measured: `authenticated` and `anon` calling any of them → `42501`.

| Function (provisional name) | Answers | Notes |
|---|---|---|
| `invitation_code_status(p_project_id, p_code) → text` | `valid`, `used` or `unknown` | `used` is `claimed_at IS NOT NULL`; an expired unclaimed row and a code of another project are `unknown` |
| `invitation_link_request(p_project_id, p_email, p_code DEFAULT NULL) → boolean` | "send a link" or "do nothing" | With a code: binds the address onto a valid code row (a later call replaces it) and is eligible if a row was bound. Without: eligible when the address has an open invitation in the project, or belongs to a confirmed user holding a project-scope grant on it or an entity grant on one of its entities. Then takes the per-address 60-second slot. A root admin with no grant in the project is not eligible (measured). |
| `invitation_code_claimant_email(p_project_id, p_code) → text` | the claimant's address for a used code, else null | Counts the call against the code row: ten per fifteen minutes, then null, which the function answers as it answers a wrong password |
| `private.invitation_throttle_take(p_key, p_max, p_window) → boolean` | within budget? | The `private.feedback_rate_limits` shape: one row per key, advisory lock, window reset. Revoked from the API roles. |

Not prototyped, needed by D-17: the path "a user who claimed but never set a password asks, from D2, for a link to the account's address". It needs the claimant's address inside the function only — `invitation_code_claimant_email` already gives it — and must count against the per-address slot, not only the per-code one.

**The answer the anonymous caller sees must not depend on any of this** (D-15). The slot is taken only for an address a mail would go to, so an attacker cannot fill the throttle table with junk keys, and the response never reports whether it was taken.

## R-2 — Every census, lint check, guard and generated artifact the phase moves

Measured by pointing the repository's own tools at the private database with the prototype applied, unless marked.

| Surface | Where | Moves? | How it was measured |
|---|---|---|---|
| Definer census, `authenticated` | `07-rpc-security.test.sql`, Section 8c, the second `is(…)` | **Yes: gains `claim_invitations`** (seven names → eight; the description string says "the same six plus get_entity_basic_data") | ran the file: `not ok 20`, `have: claim_invitations,contestant_app_public_config,get_entity_basic_data,…` |
| Definer census, `anon` | same section, the first `is(…)` | No | same run: ok |
| Enforcement census | `25-matrix-conformance.test.sql`, Section 1, `m17_unenforced_ratified` | **Yes: `project.manage_editors` and `account.manage_admins` leave the list** (six → four) and its comment ("grant administration; public.grants carries no user-facing policy at all") needs rewording | ran the file: `not ok 3`, "Unexpected records: (project.manage_editors) (account.manage_admins)"; the other 40 assertions pass |
| Discriminating-policy assertion | same file, Section 3 | No, with one policy per command | reading + the green run |
| `lint-schema.mjs` 9001, read/write separation | `apps/supabase/scripts/lint-schema.mjs`, `SAME_PERMISSION_ALLOW` | **Yes: two entries**, `['public', 'invitations', 'project.manage_editors']` and `['public', 'invitations', 'account.manage_admins']` | ran the script: "read and write permission sets intersect on 'account.manage_admins'" and "… 'project.manage_editors'"; exit 1 |
| `lint-schema.mjs` 9001, mechanism reach | same file, `MECHANISM_HELPERS` / `REACHES_NEITHER_ALLOW` | No, with the inline map | same run: no `reaches_neither` row |
| `lint-schema.mjs` 9001 census line | same | Counts rise by three policies and one table; the line is printed, not pinned | "policies examined: 105, tables partitioned: 20 … row-level-security tables in public+storage: 21" at `03b8a0524` + prototype |
| `lint-schema.mjs` 0013 (RLS enabled), 0001 (FK indexes) | same | No | same run; the throttle table is in `private`, which 0013 does not scan |
| The ten policy-only helpers | `07-rpc-security.test.sql`, the `'10/0/10'` assertion | No — it names its ten functions | ran: ok |
| `29-authenticated-disjunct-order`, `18-entity-policies`, `19-entity-immutability`, `10-schema-migrations` and the rest | — | No | ran every file at `0a06627ba`: all green except the two above |
| Storage files 06, 20, 28, 31 | — | **Not measured**: they fail on the private stack's stubbed storage schema, for a reason that is not this phase | — |
| `37-terms-of-use-acceptances` | — | Not measured: the private database holds the migration of `03b8a0524`, which predates that table | — |
| RPC nullability gate | `scripts/assert-rpc-return-nullability.mjs`, `packages/supabase-types/RPC-NULLABILITY.md` | No, while no new function is `RETURNS TABLE` | read: it harvests `RETURNS TABLE` only |
| Generated types | `packages/supabase-types/src/database.ts` | Yes: the `invitations` table and every new `public` function | `yarn db:types` after `yarn db:reset` |
| Schema-migration parity | `scripts/assert-schema-migration-parity.mjs` | Yes: regenerate with `--write` | read |
| Project-scoping guard | `scripts/assert-project-scoped-queries.mjs`, `PROJECT_SCOPED_EDGE_FUNCTIONS`; `packages/dev-seed/tests/projectScopingGate.test.ts` (the loop over `['invite-candidate', 'identity-callback', 'send-email']`); `scripts/fixtures/project-scoped-queries/{clean,violation}.fixture.ts` | Yes: the deleted function's entry goes, the new one is added as `'requires a project term'` (§ RQ-6), every new adapter `.rpc(` and `functions.invoke(` carries a project term | read |
| Edge duplicated-module gate | `scripts/assert-edge-env-defaults.mjs`, `DUPLICATED_MODULES = ['envConfig.ts', 'jwtSegment.ts', 'callerAuthority.ts']` | **Yes: after the deletion `jwtSegment.ts` and `callerAuthority.ts` each exist once, and the gate fails with "expected at least two copies"** | read: `if (copies.length < 2)` |
| App-name gate | `scripts/assert-no-candidate-app-names.mjs`, `EXEMPT`; its fixture | Yes (§ R-3) | read |
| Edge env registry | `scripts/assert-edge-function-env.mjs`, `scripts/assert-env-pair-registry.mjs`, `.env.example`, `functions/.env.example` | Yes if the new function reads a variable no function reads today | read |
| Skill and docs counts | `.claude/skills/database/*` (tables, policies, functions, assertion totals) | Yes | O-12 |

Commands for the planner to re-derive each population at plan time:

```bash
# The two assertions and the two lists (content anchors)
git grep -n -F "same six plus get_entity_basic_data" -- apps/supabase/supabase/tests/database/07-rpc-security.test.sql
git grep -n -F "m17_unenforced_ratified" -- apps/supabase/supabase/tests/database/25-matrix-conformance.test.sql
git grep -n -E "SAME_PERMISSION_ALLOW|MECHANISM_HELPERS|REACHES_NEITHER_ALLOW" -- apps/supabase/scripts/lint-schema.mjs
# The free numbers: 304 and 37 are Phase 172's, 38 is Phase 171's; Phase 173's plans add no numbered file
git ls-tree --name-only HEAD apps/supabase/supabase/schema/ apps/supabase/supabase/tests/database/ | sed 's#.*/##' | sort
```

`[READ: 172 plan]` `304-terms-of-use-acceptances.sql` holds its own table; since policies for a table must follow it in filename order, the invitation table, its triggers, privileges and policies belong in one new `3xx` file after it, and the RPCs in a new `5xx` file. `SAME_PERMISSION_ALLOW` and `m17_unenforced_ratified` are described in the tree as ratified security surfaces ("Every entry was approved individually, with the reason written beside it"): each edit carries its reason in the file, and see OQ-9.

## R-3 — Removing `invite-candidate` (D-13)

**Population** (never from this list — derive it): `git grep -c -F "invite-candidate" -- ':!.planning'` gave 34 files at `f91825883`.

| Group | Files | What to do |
|---|---|---|
| The function | `functions/invite-candidate/` — 10 files: `index.ts`, `callerAuthority.ts` + test, `entityGrant.ts` + test, `envConfig.ts` + test, `flowConformance.test.ts`, `jwtSegment.ts` + test | delete |
| Its client contract | `apps/frontend/src/lib/api/base/dataWriter.type.ts` (`preregisterWithApiToken`), `universalDataWriter.ts` (`preregisterWithApiToken`, `_preregister`), `adapters/supabase/dataWriter/supabaseDataWriter.ts` (`_preregister`, `functions.invoke('invite-candidate', …)`) and its test (five `preregisterWithApiToken` hits), the `158-MEDIUM` comment in `apps/frontend/eslint.config.mjs` that cites `SupabaseDataWriter._preregister` | delete the method pair and its tests; reword the comment |
| Sibling functions | `send-email/flowConformance.test.ts` — the test `'shares ONE gate module with invite-candidate, byte for byte'` reads `../invite-candidate/callerAuthority.ts`; comments in `send-email/{callerAuthority,envConfig,jwtSegment,index}.ts`, `send-email/jwtSegment.test.ts`, `identity-callback/{entityGrant,envConfig}.ts` | delete or re-point the test (there is no second copy to compare); reword the comments. `send-email`'s behaviour does not change. |
| Duplicated-module gate | `scripts/assert-edge-env-defaults.mjs` | `DUPLICATED_MODULES` shrinks to the modules that still have two copies. If the new function carries `envConfig.ts`, that file is again a triplicate (identity-callback, send-email, new) and stays; `jwtSegment.ts` and `callerAuthority.ts` leave the list, or the gate fails. Its docblock names `invite-candidate` twice. |
| Project-scoping gates | `scripts/assert-project-scoped-queries.mjs` (`PROJECT_SCOPED_EDGE_FUNCTIONS`), `packages/dev-seed/tests/projectScopingGate.test.ts`, `scripts/fixtures/project-scoped-queries/{clean,violation}.fixture.ts` | swap the entry and the fixture names |
| App-name gate | `scripts/assert-no-candidate-app-names.mjs`: the `EXEMPT` entry `/invite-candidate/g, // the invitation Edge Function — see phase 174`, the docblock's "EXEMPTIONS: exactly three entries" and the comment "Exactly three entries" above the list | delete the entry; correct both counts to whatever Phase 173 left (`[READ: 173 plan]` it deletes the `get_candidate_user_data` entry, so the list would go to one) |
| Its fixture | `scripts/fixtures/assert-no-candidate-app-names.input.ts`: the directive `// @as apps/supabase/supabase/functions/invite-candidate/index.ts`, `functions.invoke('invite-candidate')`, `import n12 from '../invite-candidate/callerAuthority.ts'` | edit in place, delete no line (a deleted line shifts every later expectation); then `node scripts/assert-no-candidate-app-names.mjs --self-test` |
| Docs | `apps/docs/src/routes/(content)/developers-guide/backend/{authentication,edge-functions,email,intro}/+page.md`, `…/contestant-app/{pre-registration-and-invitation,registration}/+page.md`, `apps/supabase/README.md`, `.env.example`, `CLAUDE.md` (two hits), `.claude/skills/database/SKILL.md` (nine hits) | rewrite; `yarn workspace @openvaa/docs validate:links --check` |
| E2E | `tests/tests/utils/supabaseAdminClient.ts` (`sendEmail`, six `inviteUserByEmail` hits), `tests/tests/utils/contestantJourneyConstants.ts`, the two specs, `tests/tests/setup/perm/perm-localisation-positive.teardown.ts` | § R-5 |

The closing zero-hit greps of D-24 (i), as commands that work here:

```bash
git grep -n -F "invite-candidate" -- ':!.planning'
git grep -n -F "inviteUserByEmail" -- ':!.planning'
git grep -n -F "preregisterWithApiToken" -- ':!.planning'
git grep -n -F "complete-registration" -- ':!.planning'
```

**`toCallbackUrl` cannot be on that list.** `contestant-journey.spec.ts` uses it twice: step 3 (registration) and step 8, `'8. forgot-password: send reset email + follow link + set PASSWORD_2'`, which drives the app's own forgot-password page, receives **GoTrue's** recovery mail, and needs the rewrite because that mail's link is the non-PKCE `/verify` link of RQ-3. The recovery mail moves into the function in Phase 178 (FIX-01, 178-C5). Until then the helper has one legitimate caller. See OQ-3.

## R-4 — The seeding path, the server contract, and the mail

**Seeding (174-C).** `create_invitations` is the one write path (D-09). The E2E client and the dev-seed client both hold the service role and call `rpc('create_invitations', { p_project_id, p_invitations })`; the argument keys must be the SQL parameter names (the database skill's note on `resolve_email_variables` applies). `bulk_import` is not extended (D-10). `seed.sql` and the default template gain no invitation (D-22). A later template field for invitations would be a list handed to the same RPC after `bulk_import`, since the targets must exist first.

**The contract Phase 178 consumes**, and where each piece lives:

| Operation | Lives in | Called from | Returns |
|---|---|---|---|
| `check code` | Edge Function → `invitation_code_status` | data writer (`functions.invoke`) | `valid` \| `used` \| `unknown` |
| `request link` (address, optional code, locale) | Edge Function → `invitation_link_request`, then the two `generateLink` calls and SMTP | data writer | always the same body and status |
| `code sign-in` (code, password) | Edge Function → `invitation_code_claimant_email`, then a GoTrue password grant | a SvelteKit action, which puts the returned session on its own response | a session, or the one "wrong password" answer |
| `claim_invitations` | SQL RPC | data writer (`rpc`), from the callback and the login actions, followed by `refreshSession()` | `{ claimed, skipped }` |

- **The adapter pattern** `[MEASURED: tree @c1153ae1b]`: `apps/frontend/src/lib/api/dataWriter.ts` `createDataWriter(source)` returns a fresh `SupabaseDataWriter` over the request's own client on the server; public methods are declared in `base/dataWriter.type.ts` and implemented as `_`-prefixed methods in the adapter. The callback and both login files are on `ADAPTER_BOUNDARY_ALLOWLIST` in `apps/frontend/eslint.config.mjs` (they may touch `locals.supabase`); `apps/frontend/src/lib/auth/passwordLogin.ts` is not, and takes a structural `PasswordLoginContext` precisely to stay free of the backend's types. So the claim and the refresh enter `passwordLogin` as two more members of that context, supplied by the login actions, and the gate reads the session after them.
- **`code sign-in` hand-off** `[ASSUMED]`: the action receives `{ access_token, refresh_token }` from the function and calls `auth.setSession(…)` on the request's client, which should write the cookies through the same `setAll` path measured for `verifyOtp` and `refreshSession`. Not measured. The tokens cross one server-to-server hop; they must never be logged.
- **The function's project term**: from the request body, validated as a uuid (§ RQ-6).

**How mail works today** `[MEASURED: tree @03b8a0524]`: `functions/send-email/index.ts` builds a `nodemailer` transport from `requireEnv('SMTP_HOST' | 'SMTP_PORT' | 'SMTP_FROM')` and sends caller-supplied templates rendered by `templateVars.ts`; it reaches only users who already hold a grant (`resolve_email_variables`). GoTrue's own mails use its built-in English templates; `config.toml` has no active `[auth.email.template.*]` block. There is no localized mail anywhere in the tree.

**The sign-in mail in seven locales (J4).** The locales are the seven message directories: `ls apps/frontend/messages` → `da en et fi fr lb sv`. An Edge Function is its own deployment unit and cannot import a workspace package, so the templates are a pure module inside the function directory (subject, HTML and text per locale, one `{{link}}` placeholder each), with a unit test asserting that its locale set equals the directory listing of `apps/frontend/messages` and that every template contains the placeholder exactly once. The request names a locale; the function validates it against that set and falls back to the default; the link is `{SITE_URL}/{locale}/api/auth/callback?token_hash=…&type=magiclink` (the callback reads the locale Paraglide resolved for the request, and `additional_redirect_urls` is irrelevant because GoTrue redirects nothing). The caller supplies no text. Give the mail a subject GoTrue never uses — GoTrue's own are "Your sign-in link" and "Reset your password" `[MEASURED: private stack]` — so a spec waiting for the function's mail cannot be satisfied by GoTrue's.

**Uniform timing.** `[CITED: https://supabase.com/docs/guides/functions/background-tasks]` `EdgeRuntime.waitUntil(promise)` "Won't block the request, runs in background"; locally "instances are terminated automatically after a request is completed. This will prevent background tasks from running to completion", and the remedy is `[edge_runtime] policy = "per_worker"`. `config.toml` has `policy = "oneshot"`. So answering first and sending afterwards needs a second `config.toml` change, restarted together with RQ-1's. See OQ-7.

## R-5 — Tests

**pgTAP (D-21).** One new file, numbered after the tree's highest (37 and 38 are taken). The prototype's case list (`r174/proto-test.sql`, sections A–J) is the matrix of D-21 already written as statements with their expected outcomes; it translates to `throws_ok` (with the SQLSTATE and, for constraint violations, the constraint name), `lives_ok` + `is`, and `results_eq`. Plus the two edits of § R-2. The suite's conventions (`create_test_data()`, `set_test_user(role, id, grants)`, `reset_role()`) are in the database skill; a file that writes its own grant rows passes `'[]'::jsonb` as the third argument.

**Unit.** The function's pure modules (locale validation and fallback, template completeness, the request parser, the uniform-response builder, the `/settings` self-check's decision) — each needs a sibling `.test.ts` and must import no remote specifier and no `Deno.` global, or `assert-edge-env-defaults.mjs` check 3 fails. `passwordLogin.test.ts`: the order sign-in → claim → refresh → gate, and that a first-time invitee whose token gains its grant only after the refresh is admitted. A callback test for the `magiclink` arm. `supabaseDataWriter.test.ts` loses its `preregisterWithApiToken` cases and gains the new methods'.

**E2E (criterion 6).** The mail helper already exists: `tests/tests/fixtures/shared/emailBucket.fixture.ts`, `createEmailBucket(page, recipient)` with `expectEmail`, `getEmail`, `getLinksInEmail`, polling the catcher's REST API at `INBUCKET_URL ?? 'http://localhost:54324'`.

| File | Change |
|---|---|
| `tests/tests/utils/supabaseAdminClient.ts` | `sendEmail` is replaced by a helper that seeds an email invitation through `create_invitations` and asks the function for the link. `forceRegister` stays. `unregisterCandidate` and `deleteAllTestUsers` also delete the address's invitations — rows where `email` or `pending_email` is the address, or `claimed_by` is the user, claimed ones included — before deleting the user, or a re-run meets a claimed row (deleting the user alone nulls `claimed_by` and leaves `claimed_at`). |
| `tests/tests/specs/contestant/contestant-journey.spec.ts` | step 3 seeds and requests; step 4 opens the mailed link; step 8 keeps its rewrite until Phase 178 (OQ-3) |
| `tests/tests/specs/perm/perm-localisation-positive.spec.ts` and its teardown | same swap; its "self-heal" `unregisterCandidate` call now also clears a leftover invitation |
| `tests/tests/utils/contestantJourneyConstants.ts` | `REGISTRATION_EMAIL_SUBJECT_REGEX` is `/invite|invited|registration|confirm|signup|welcome|verify/i`, which GoTrue's "Your sign-in link" does not match and the new mail's subject must be chosen against; make it the new mail's exact subject |
| new | one assertion that an anon `POST /auth/v1/signup` answers 422 `signup_disabled` (§ RQ-1) |
| unchanged, re-run | every setup that calls `forceRegister`; the bank-auth projects, each alone, because `config.toml` `[auth]` changes (D-24 (ii)) |

Two environment facts the mailed link meets for the first time:

- **The link's origin is the function's `SITE_URL`**, `http://127.0.0.1:5173` in `.env.example`, while Playwright's `baseURL` is `http://localhost:${FRONTEND_PORT}` (`tests/playwright.config.ts`) and `toCallbackUrl` deliberately builds `http://localhost:<port>`. Cookies are per host, and `[ASSUMED]` the dev server may not answer on `127.0.0.1` at all (`vite.config.ts` sets no `server.host`; `CLAUDE.md` says the server "binds `[::1]:<port>`"). An alternate `FRONTEND_PORT` is not reflected in the function's environment either. See OQ-4.
- **SMTP from the Edge runtime to the mail catcher has never been exercised by the suite**: `git grep -n -F "send-email" -- tests` returns nothing. On this host the running Edge container has `SMTP_HOST=inbucket`, `SMTP_PORT=2500` `[MEASURED: docker inspect]`, while the catcher is Mailpit, aliased `inbucket`, exposing `1025` `[MEASURED: docker inspect]`, and `.env.example` says `SMTP_PORT=1025`. The local function environment on this host is stale. See OQ-10.

## R-6 — Hazards and the verification commands that work here

Start every block with `export PATH="$HOME/.nvm/versions/node/v24.21.0/bin:$PATH"`. Read each status from the command itself, never through a pipe. Background anything that can run past eight minutes and poll it.

```bash
# Schema workflow, in this order (171-04's corrected order)
node scripts/assert-schema-migration-parity.mjs --write     # regenerate the single migration from schema/*.sql
node scripts/assert-schema-migration-parity.mjs             # parity, exit status
yarn db:reset                                               # applies the migration + seed.sql
yarn db:types && git diff --exit-code -- packages/supabase-types/src/database.ts   # after staging the intended regeneration
yarn workspace @openvaa/supabase test:db                    # pgTAP
yarn db:lint:sql                                            # supabase db lint + lint-schema.mjs, against the APPLIED database

# Gates this phase touches
yarn assert:edge-env-defaults
yarn assert:project-scoped-queries
yarn assert:no-candidate-app-names && node scripts/assert-no-candidate-app-names.mjs --self-test
yarn assert:rpc-nullability
yarn assert:env-pair-registry
yarn workspace @openvaa/supabase test:unit                  # the functions' vitest files
yarn workspace @openvaa/frontend test:unit
yarn lint:check
yarn build

# One E2E run
tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/<name>

# Auth configuration, read-only, after the restart
docker inspect supabase_auth_openvaa-local --format '{{range .Config.Env}}{{println .}}{{end}}' | grep -E '^GOTRUE_(DISABLE_SIGNUP|MAILER_AUTOCONFIRM)='
docker inspect supabase_edge_runtime_openvaa-local --format '{{range .Config.Env}}{{println .}}{{end}}' | grep -E '^(SMTP_HOST|SMTP_PORT|SITE_URL)='
```

Hazards (each is also a pitfall below): `HEAD` moves under any command that reads it while an executor is committing; `yarn db:reset` destroys the E2E project's rows and must not run while an E2E run is in flight; `config.toml` `[auth]` and `[edge_runtime]` are read only when the stack starts; the functions' environment is read only when the stack starts; a foreground turbo gate can outlast the subagent watchdog.

## Project Constraints (from CLAUDE.md)

- **E2E hard rule:** a failing or did-not-run E2E test blocks completion; no flaky exemption. E2E-03 closes this phase.
- **E2E preflight:** every run proves the served app is this checkout and serves the project the suite seeds; the wrapper `tests/scripts/e2e-run.sh` starts Supabase and the dev server with `PUBLIC_PROJECT_ID` set to the suite's project. A plain `yarn dev` serves the default project.
- **`db:*` scripts touch only the database; `dev:*` drive the full stack.** After a schema change: `yarn db:types`, then `yarn db:lint:sql`, which lints the **applied** database and needs a running stack.
- **Comment hygiene** under `apps/`, `packages/`, `tests/`: no historical narrative, no planning references beyond `see phase N`, nothing addressed to the reviewer, concise. Gated by `yarn assert:comment-hygiene` inside `lint:check`.
- **TypeScript strictly:** no `any`; exported symbols carry TSDoc.
- **Localization:** every user-facing string in all supported locales. A mail is one.
- **Accessibility:** WCAG 2.1 AA; this phase adds no screen, and a changed redirect must not strand a scanned route.
- **Never commit secrets.** `.env` files are not read by tools in this workspace; variable names come from `.env.example`.
- **Context destructuring rule and results-navigation invariants:** not touched by this phase (no component, no `(located)` load).
- **`PUBLIC_PROJECT_ID` has no fallback**; the Edge runtime resolves it from the process environment of the shell that starts the stack.
- **Code review checklist:** `.agents/code-review-checklist.md` for every change.
- **Skills:** `Skill("database")` for `apps/supabase`; `Skill("components")` for the adapter and context rules.

## Architecture Patterns

### System Architecture Diagram

```
 ADMIN (project editor / project admin / account admin, or the service role)
   │  create_invitations(project, [{target, email | code}])            SECURITY INVOKER
   ▼
 ┌──────────────────────────── PostgreSQL ────────────────────────────────────────────┐
 │  INSERT policy = the authority map ──► public.invitations ◄── BEFORE INSERT trigger │
 │  (direct PostgREST insert meets the same policy)        (generates code, sets hash) │
 │  UPDATE <entity> SET confirmed = true  (as the caller; entity.confirm asked)        │
 └─────────────────────────────────────────────────────────────────────────────────────┘
   returns the rows; a generated code in plaintext, once

 INVITEE (anonymous)
   │ check code ─────────────► Edge Function ──► invitation_code_status ──► valid | used | unknown
   │ request link(address[, code], locale)
   ▼
 Edge Function ──► /auth/v1/settings: sign-up off AND confirmations on?  ── no ──► refuse to issue
   │ always answers the same; the rest happens after the answer
   ▼
 invitation_link_request(project, address[, code]) ──► eligible AND slot free?  ── no ──► nothing
   │ yes
   ▼
 GoTrue admin: generateLink(invite)  [creates a passwordless, unconfirmed user; 422 email_exists ignored]
               generateLink(magiclink) ──► hashed_token
   ▼
 SMTP: localized mail, link = SITE_URL/<locale>/api/auth/callback?token_hash=…&type=magiclink

 INVITEE opens the link (any device)
   ▼
 api/auth/callback ──► verifyOtp(token_hash, magiclink) ──► session (address now confirmed)
                   ──► claim_invitations(project)  ──► grants rows; {claimed, skipped}
                   ──► refreshSession()            ──► token re-issued through the access-token hook
                   ──► first time? ──► set-password page   │   returning ──► app root
                                                            ▼
                                      app root: one entity / several / nothing to edit (Phase 173)

 RETURNING USER: login action ──► signInWithPassword ──► claim ──► refresh ──► grant gate ──► app
 USED CODE:      action ──► Edge Function ──► invitation_code_claimant_email (attempt counted)
                          ──► GoTrue password grant ──► session ──► action sets cookies
```

### Recommended Project Structure

```
apps/supabase/supabase/
├── schema/3xx-invitations.sql          # table, constraints, indexes, triggers, privileges, the three policies
├── schema/5xx-invitation-rpcs.sql      # create_invitations, claim_invitations, the service-only helpers, the throttle
├── functions/<neutral-name>/           # index.ts + pure modules with tests + envConfig.ts (byte-identical copy)
└── tests/database/NN-invitations.test.sql
apps/frontend/src/
├── lib/api/base/dataWriter.type.ts     # − preregisterWithApiToken; + the four new operations
├── lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts
├── lib/auth/passwordLogin.ts           # claim and refresh enter through the context
└── routes/api/auth/callback/+server.ts # magiclink arm; claim; refresh; landing
tests/tests/utils/supabaseAdminClient.ts
```

### Pattern 1: The map is the policy
**What:** one policy per command whose expression is the three allowed shapes OR-ed together, each arm naming its permission literal.
**When to use:** whenever a policy must be visible to `lint-schema.mjs` 9001 and to the enforcement census, both of which read `pg_policies` text.

### Pattern 2: Server-only columns through a trigger, not a privilege
**What:** the API role holds `INSERT` on the columns it may choose; a `BEFORE INSERT` trigger fills the rest; a transaction-local setting returns a generated secret to the calling RPC.
**When to use:** when an `SECURITY INVOKER` RPC must write a value its caller must not be able to choose.

### Pattern 3: Session, claim, refresh, then gates
**What:** `verifyOtp` or `signInWithPassword` → `claim_invitations` → `refreshSession()` (when something was claimed) → `safeGetSession()` → the grant gate and the loads.
**When to use:** every entry point that can sign in an invitee.

### Pattern 4: Create passwordless, then mint
**What:** `generateLink('invite')` to create, `generateLink('magiclink')` to mint, verify as `magiclink`.
**When to use:** whenever a link must be mailed to an address that may have no account.

### Anti-Patterns to Avoid
- **Trusting `email_confirmed_at` while public sign-up is on:** it is set with no proof (RQ-1).
- **A single `generateLink('magiclink')` for a possibly new address:** the user gets a password nobody chose.
- **Deciding first-time versus returning from the link `type`:** every mailed link is `magiclink`.
- **Reading a grant gate before the refresh:** the token predates the grant; a first-time invitee is signed out with 403.
- **Authority only in the RPC body, or only in a helper:** a direct insert bypasses the first; the linter and the census cannot see the second.
- **A limit keyed on a request header:** the caller picks the bucket, and locally GoTrue applies none.
- **Taking the function's project from its environment:** the default E2E run serves another project than the Edge runtime was started with.
- **Returning anything from the anonymous endpoint that varies with eligibility**, body, status or time.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| One-time sign-in token, its expiry and single use | a token table | `auth.admin.generateLink` + `verifyOtp({ token_hash, type })` | single use, expiry at `otp_expiry` and replacement on re-issue all measured |
| Proof of an address | a confirmation flag of our own | `auth.users.email_confirmed_at`, under the configuration of RQ-1 | GoTrue sets it on verification and nowhere else once sign-up is off |
| Which permission a role holds | a second matrix | `user_can` | one predicate; the census asserts it |
| Password check for code sign-in | comparing hashes in SQL | GoTrue's password grant, called by the function | the hash format and the empty-password case are GoTrue's |
| Code hashing and randomness | `pgcrypto`, `random()` | core `sha256(bytea)` and `gen_random_uuid()` | no extension dependency; `random()` is not cryptographic |
| Reading mail in E2E | a new client | `createEmailBucket` in `emailBucket.fixture.ts` | already polls the catcher |
| Counting attempts | a new limiter | the `private.feedback_rate_limits` shape (key, count, window, advisory lock) | exists, tested (`35-feedback-rate-limit-key.test.sql`) — but not its header-derived key |

**Key insight:** every hand-rolled piece here would be a second copy of something GoTrue or the grant model already owns, and each second copy is a place where "exactly the grant the invitation defined, and nobody else" can stop being true.

## Runtime State Inventory

This phase removes a function, changes two service configurations and adds a table, so the question "what still holds the old state after every file is edited" applies.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None in the repository's seeds: `seed.sql` and the default template create no invitation and no invited user. Local databases may hold `auth.users` rows created by earlier E2E runs through `inviteUserByEmail`; `yarn db:reset` clears them. | none beyond the reset the schema change needs anyway |
| Live service config | **GoTrue reads `config.toml` `[auth]` only at start**; the running container has `GOTRUE_DISABLE_SIGNUP=false`, `GOTRUE_MAILER_AUTOCONFIRM=true`. **The Edge runtime reads `[edge_runtime]` and the functions' environment only at start.** A hosted project's auth settings are in its dashboard. | `yarn db:stop` + `yarn db:start` once per developer and per gate run; deployment documentation for the hosted settings; the function's self-check |
| OS-registered state | None — `git grep -l -i -E 'launchd\|systemd\|pm2 \|crontab' -- ':!.planning' ':!*.md' ':!yarn.lock'` returned no file at `f91825883`, and nothing in this phase registers with the OS | none |
| Secrets and env vars | The functions' local environment file is untracked and unreadable here. The running container shows `SMTP_PORT=2500` against `.env.example`'s `1025`, and `SITE_URL=http://127.0.0.1:5173`. `SITE_URL` was documented for "identity-callback and invite-candidate"; the new function inherits it and is the first whose mailed link a browser opens. No variable is renamed. | each developer checks `yarn check:env-local` and the two values (OQ-4, OQ-10); `.env.example` comments that name `invite-candidate` are reworded |
| Build artifacts | A deployed `invite-candidate` function stays deployed on any hosted project until it is deleted there (`supabase functions delete invite-candidate`); deleting the directory does not undeploy it. Nothing is deployed today (project memory, 2026-10-04). `packages/supabase-types/src/database.ts` is regenerated. | a line in the deployment docs; `yarn db:types` |

## Common Pitfalls

### Pitfall 1: Closing the phase with a forgeable claim
**What goes wrong:** `claim_invitations` is executable while public sign-up is on.
**Why it happens:** the configuration change needs a stack restart, and a gate run on a stack started before the edit still shows the old values.
**How to avoid:** the read-only `docker inspect` command of § R-6 in the closing gate; the E2E `signup_disabled` assertion; the function's self-check.
**Warning signs:** `GOTRUE_DISABLE_SIGNUP=false` in the container; the function refusing to issue links.

### Pitfall 2: The first-time invitee is signed out
**What goes wrong:** 403 `grantNotAllowed`, or the "nothing to edit" screen, straight after a successful claim.
**Why it happens:** the gate read the token issued before the grant existed.
**How to avoid:** Pattern 3; a unit test of `passwordLogin` whose fake session gains its grant only after `refreshSession`.
**Warning signs:** the claim returns a non-empty `claimed` and the next read lists no entity.

### Pitfall 3: A password nobody set
**What goes wrong:** Phase 178 reads "password set" as true for a user who never set one.
**Why it happens:** `generateLink('magiclink')` for a new address, `admin.createUser` without a password, and verification of an `invite` token each write a generated hash.
**How to avoid:** Pattern 4, and verify as `magiclink`.
**Warning signs:** `encrypted_password <> ''` on a user who has only clicked a link.

### Pitfall 4: The gates redden on a correct change
**What goes wrong:** `07` assertion 20, `25` assertion 3 and `lint-schema.mjs` 9001 fail.
**Why it happens:** they pin the definer surface, the unenforced-permission list and read/write separation, and this phase legitimately moves all three.
**How to avoid:** edit each with its reason in the same plan as the schema; never by widening a list without one.
**Warning signs:** "Unexpected records: (project.manage_editors) (account.manage_admins)"; "read and write permission sets intersect".

### Pitfall 5: The duplicated-module gate after the deletion
**What goes wrong:** `yarn assert:edge-env-defaults` fails with "expected at least two copies of 'jwtSegment.ts'".
**Why it happens:** two of the three shared modules lose their second copy when `invite-candidate` goes.
**How to avoid:** shrink `DUPLICATED_MODULES` in the deleting plan; give the new function a byte-identical `envConfig.ts`.

### Pitfall 6: The mailed link opens nothing, or opens a session the test then loses
**What goes wrong:** connection refused at `127.0.0.1`, or a signed-in page on one host and a signed-out one on the other.
**Why it happens:** the link's origin is the function's `SITE_URL`; the browser's is Playwright's `baseURL`.
**How to avoid:** settle OQ-4 before the spec is written; measure `curl -sI` against both hosts while the wrapper's server is up.

### Pitfall 7: The mail never arrives
**What goes wrong:** `expectEmail` times out.
**Why it happens:** a stale `SMTP_PORT`; or the function answered and its background send was cut off under `policy = "oneshot"`.
**How to avoid:** Wave 0 of plan 3 sends one mail from the function and reads it from the catcher before anything else is built on it.

### Pitfall 8: The wrong project
**What goes wrong:** the function finds no invitation in an E2E run that seeded one.
**Why it happens:** it read `PUBLIC_PROJECT_ID` from an environment fixed at stack start.
**How to avoid:** the project term comes from the request.

### Pitfall 9: A re-run meets a claimed invitation
**What goes wrong:** the journey's second run cannot seed (duplicate) or cannot claim.
**Why it happens:** deleting the test user leaves the row with `claimed_at` set, by design.
**How to avoid:** the two cleanup helpers delete the address's invitations through the service role.

### Pitfall 10: An oracle by accident
**What goes wrong:** an eligible address answers later, or with another status, than an ineligible one; or the function relays GoTrue's `email_exists`.
**How to avoid:** one response object built before any branching; errors from GoTrue and SMTP go to the log only.

## Code Examples

### The issue step inside the Edge Function

```typescript
// Source: measured on GoTrue v2.197.0 this session (r174/rq3.mjs, part "recipe").
// Step 1 creates a passwordless user when none exists; the only error it may swallow is the one that says a confirmed user exists.
const created = await admin.auth.admin.generateLink({ type: 'invite', email });
if (created.error && created.error.code !== 'email_exists') throw created.error;
// Step 2 mints the token that is mailed. The user exists now, so the type stays magiclink.
const minted = await admin.auth.admin.generateLink({ type: 'magiclink', email });
if (minted.error) throw minted.error;
const link = `${siteUrl}/${locale}/api/auth/callback?token_hash=${minted.data.properties.hashed_token}&type=magiclink`;
```

`error.code` values are GoTrue's `error_code`, measured: `email_exists`, `user_not_found`, `signup_disabled`, `otp_expired`, `invalid_credentials`, `over_request_rate_limit`, `over_email_send_rate_limit`, `email_provider_disabled`, `otp_disabled`, `user_already_exists`, `email_not_confirmed`. `[ASSUMED]` that `supabase-js` 2.117.2 surfaces `error_code` as `error.code`.

### The callback's sequence

```typescript
// Source: measured with @supabase/ssr 0.12.7 this session (r174/ssr.mjs); names of the writer methods are the planner's.
const { error } = await locals.supabase.auth.verifyOtp({ token_hash, type });   // type === 'magiclink' for an invitation link
if (!error) {
  const { claimed } = await writer.claimInvitations();        // rpc('claim_invitations', { p_project_id })
  if (claimed.length > 0) await locals.supabase.auth.refreshSession();   // cookies are written when this resolves
  // only now: safeGetSession(), the landing decision, the redirect
}
```

### The self-check

```typescript
// Source: GET /settings on GoTrue v2.197.0 returns both keys (measured).
const settings = await (await fetch(`${supabaseUrl}/auth/v1/settings`, { headers: { apikey: anonKey } })).json();
const safe = settings.disable_signup === true && settings.mailer_autoconfirm === false;
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `auth.admin.inviteUserByEmail` at seed time; the grant written with it | a promise row; the user and the grant come into being at claim | this phase | no account for an address nobody has proved; GoTrue cannot be asked which addresses were invited |
| GoTrue's default mail (`/verify?token=…&redirect_to=…`) rewritten by tests into a callback URL | the function mails a `token_hash` link to the callback | this phase (recovery mail: Phase 178) | works on any device; the session never appears in a URL fragment |
| Public sign-up on, autoconfirm on | sign-up off, confirmations on | this phase | `email_confirmed_at` means a mail round-trip or a service-side voucher |

**Deprecated/outdated:**
- `invite-candidate`, `preregisterWithApiToken`, `_preregister`: removed here.
- `CheckRegistrationData` (`email`, `firstName`, `lastName` for a key): not built on; removed with `register/` in Phase 178.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The Supabase CLI maps `[auth] enable_signup = false` to `GOTRUE_DISABLE_SIGNUP=true` and `[auth.email] enable_confirmations = true` to `GOTRUE_MAILER_AUTOCONFIRM=false`. Only the current direction was observed (`true` ↔ `false`, `false` ↔ `true`). | RQ-1 | The edit would not take effect; caught by the `docker inspect` command and by the function's self-check |
| A2 | A hosted Supabase project exposes the same two switches in its dashboard, and they are not set by `config.toml` | RQ-1 | A deployment could run with sign-up on; the self-check refuses to issue links there |
| A3 | The Edge runtime accepts a call carrying only the anon key when no `[functions.<name>]` block exists | RQ-6 | The function would need `verify_jwt = false`; one request in Wave 0 settles it |
| A4 | Under `policy = "oneshot"` a `waitUntil` task is cut off locally, and under `per_worker` it completes | R-4 | Mail would not arrive in E2E, or the config change is unnecessary |
| A5 | `auth.setSession` on the `@supabase/ssr` server client writes the cookies as `verifyOtp` and `refreshSession` were measured to | R-4 | Code sign-in could not hand its session to the action; affects Phase 178's D2, testable here by one unit-level measurement |
| A6 | The dev server does not answer on `127.0.0.1` (from `CLAUDE.md`'s "binds `[::1]:<port>`" and Vite's default host) | R-5 | If it does, OQ-4 reduces to a cookie-host question only |
| A7 | `supabase-js` surfaces GoTrue's `error_code` as `error.code` | Code Examples | The `email_exists` test would need `error.message` or the status instead |
| A8 | Phase 172 leaves `forceRegister` recording acceptance by default and removes the terms-of-use resets from the two cleanup helpers; Phase 173 renames `CANDIDATE_GRANTS` to `CONTESTANT_GRANTS`, adds `grantEntity`, `get_user_entities`, `get_entity_user_data` and the `NothingToEdit` view, and deletes the app-name gate's `get_candidate_user_data` exemption | R-3, R-5 | Anchors in those files differ at plan time; the planner re-reads the tree |
| A9 | The function directory can hold a pure templates module and its test without tripping any gate other than check 3 of `assert-edge-env-defaults.mjs` | R-5 | A further gate entry is needed |
| A10 | The hosted platform configures a GoTrue rate-limit header, so a function's server-side password grants share one bucket there | RQ-5 | None for the design, which relies on neither |
| A11 | Storage-related pgTAP files (06, 20, 28, 31) are unaffected by a table that has no storage policy | R-2 | A further assertion moves; the real suite run in plan 1 shows it |

## Open Questions (RESOLVED)

1. **RQ-1 — can a confirmed address be obtained without a mail round-trip?** Yes, by public sign-up; no, by email change. Remedy: sign-up off (necessary and sufficient on the measurements), confirmations on (second lock). Fallout: none in code. § RQ-1.
2. **RQ-2 — what does `generateLink` create?** A user in every case but `recovery`; passwordless only with `invite`. § RQ-2.
3. **RQ-3 — the non-PKCE redirect.** The session is in the URL fragment. § RQ-3.
4. **RQ-4 — the `token_hash` link.** Verifies under the issued type and under `email`; single use; expires at `otp_expiry`; re-issue replaces. § RQ-4.
5. **RQ-5 — rate limits.** None locally; per header value where configured; never on `generate_link`; `email_sent` does not bind the function's mail. § RQ-5.
6. **RQ-7 — the refresh.** `refreshSession()` re-issues through the hook and has written the cookie when it resolves; `safeGetSession` reads the new token. § RQ-7.
7. **Is `pgcrypto` available?** It is installed by the image, not declared by the schema; the design uses neither it nor any other extension. § Standard Stack.
8. **Which constraint is named when both unique rules are violated?** `grants_user_scope_target_role_key`. § R-1.6.
9. **Does the design pass the repository's own schema linter and pgTAP suite?** Yes, with two list entries and two assertion edits, all enumerated. § R-2.

## Open Questions for the Operator

1. **OQ-1 — the auth configuration (RQ-1).**
   - What we know: the claim is forgeable today; `enable_signup = false` closes it; `enable_confirmations = true` adds a second lock at no measured cost.
   - What is unclear: only whether the operator accepts both switches and the hosted-dashboard obligation that goes with them.
   - Recommendation: both, plus the gate, the E2E assertion and the function's self-check. Without at least the first, plan 2 must not make `claim_invitations` executable.

2. **OQ-2 — the code alphabet (D-06).**
   - What we know: 32 symbols with `0, O, 1, I, L` all removed is impossible (31 remain).
   - Recommendation: Crockford's 32 symbols, folding `O → 0` and `I, L → 1` on input: exactly 60 bits, an unbiased mask, and a mistyped look-alike still resolves.

3. **OQ-3 — `toCallbackUrl` (D-22, D-24).**
   - What we know: the journey's password-reset step still needs it until the recovery mail moves into the function in Phase 178.
   - Recommendation: keep the helper for that one step, delete its two registration uses, and drop `toCallbackUrl` from this phase's zero-hit greps. Phase 178 deletes it.

4. **OQ-4 — the origin of the mailed link (D-22: "exactly as received").**
   - What we know: the function's origin is `SITE_URL` (`http://127.0.0.1:5173` in `.env.example`); the suite's is `http://localhost:${FRONTEND_PORT}`; a caller-supplied origin would let anyone mail a login token aimed at their own site.
   - Recommendation: the origin stays a function variable; `.env.example` and local environments use `http://localhost:5173`; the E2E helper may replace **only the origin** of the received link with the run's `baseURL`, leaving path and query byte-identical, so an alternate `FRONTEND_PORT` works. If "exactly as received" must hold to the byte, an alternate port is unsupported for the two mail specs.

5. **OQ-5 — first-time or returning, in the callback (D-20).**
   - What we know: the link type cannot say; the account's real state can (`encrypted_password = ''` under the recipe); Phase 178 plans to carry "password set" on Phase 173's user-data RPC.
   - Recommendation: `claim_invitations` returns a third key, `password_set`, read from the same private helper Phase 178 will reuse; the callback sends `password_set = false` to the set-password page. It is the caller's own fact, costs no extra round trip and adds no census name. The alternative is to pull 178-B1's field forward.

6. **OQ-6 — GoTrue's own endpoints.**
   - What we know: `POST /otp` with the anon key tells a registered address from an unregistered one and mails GoTrue's English magic-link mail to a registered one, around this phase's gate and throttle. A no-op send-email hook stops every GoTrue-originated mail while `generate_link` and `/verify` keep working `[MEASURED: private stack]`; `GOTRUE_EXTERNAL_EMAIL_MAGIC_LINK_ENABLED=false` does not remove the difference in answers.
   - Recommendation: accept for this phase, recorded as a residual, because the forgot-password page still depends on GoTrue's recovery mail. Phase 178, which moves that mail into the function, is where a send-email hook can switch GoTrue's own mail off.

7. **OQ-7 — answering before sending (D-15).**
   - What we know: the documented way is `EdgeRuntime.waitUntil`, which locally needs `[edge_runtime] policy = "per_worker"` (function code changes then need a restart to be picked up).
   - Recommendation: `per_worker`, changed in the same restart as the auth keys, after Wave 0 confirms the behaviour on `edge-runtime v1.76.2`. The fallback is to send before answering and accept a timing difference, which D-15 forbids.

8. **OQ-8 — where the function's project comes from.**
   - What we know: the default E2E run serves a project the Edge runtime was not started for.
   - Recommendation: the request names it (`'requires a project term'`). Project ids are public, and every answer is uniform.

9. **OQ-9 — two ratified lists.**
   - What we know: `SAME_PERMISSION_ALLOW` gains two entries and `m17_unenforced_ratified` loses two members; both lists state that entries are approved individually.
   - Recommendation: approve both, with the reason "whoever may promise a grant may read the promises; the matrix names no separate read member for grant administration" and "the invitation policies now read them". The alternative for the first is to give project-scope promises no `SELECT` policy at all for non-service callers.

10. **OQ-10 — this host's function environment.**
    - What we know: the running Edge container has `SMTP_PORT=2500`; Mailpit listens on 1025.
    - Recommendation: correct the local file to `.env.example`'s value and restart before plan 3; `yarn check:env-local` afterwards.

11. **OQ-11 — for Phases 178 and 179, no action here.** `identity-callback` users carry a generated password hash (CONTEXT fact 19 says otherwise), so `encrypted_password` is not a "password set" signal for them.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Docker with the local Supabase stack | everything | ✓ (13 `supabase_*` containers running) | — | — |
| GoTrue image | link issue and verification | ✓ | `v2.197.0` | — |
| PostgreSQL | schema, pgTAP | ✓ | 17.6 (`17.6.1.171`) | — |
| Mail catcher | E2E mail | ✓ Mailpit `v1.30.2`, alias `inbucket`, SMTP 1025, REST on host 54324 | — | — |
| Edge runtime | the new function | ✓ `v1.76.2`, `policy = "oneshot"` | — | `per_worker` (OQ-7) |
| Node | scripts, tests | ✓ | v24.21.0 via nvm | — |
| Homebrew PostgreSQL client (`psql`) | `lint-schema.mjs` | ✓ `/usr/local/opt/postgresql@17/bin` | 17 | — |
| SMTP from the Edge runtime to the catcher | the sign-in mail | ✗ on this host as configured (`SMTP_PORT=2500`) | — | correct the local environment (OQ-10) |
| Public sign-up off | INV-03 | ✗ (`GOTRUE_DISABLE_SIGNUP=false`) | — | none — plan 2 changes it |

**Missing dependencies with no fallback:** the auth configuration (changed by this phase); the local SMTP port (an operator action on an untracked file).

**Missing dependencies with fallback:** none.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | pgTAP through `supabase test db`; vitest for `apps/supabase` (functions), `apps/frontend` and `packages/*`; Playwright through `tests/scripts/e2e-run.sh` |
| Config file | `apps/supabase/supabase/tests/database/`; per-workspace vitest configs; `tests/playwright.config.ts` |
| Quick run command | `yarn workspace @openvaa/supabase test:db` (after `yarn db:reset`) |
| Full suite command | `yarn test:unit`, then `tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/<name>` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| INV-01 | each row of the authority map, allowed and refused, through the RPC and through a direct insert; no `UPDATE` | pgTAP | `yarn workspace @openvaa/supabase test:db` | ❌ Wave 0 (new file) |
| INV-02 | both duplicate rules; the first row unchanged; a batch writes nothing; a claimed row still blocks | pgTAP | same | ❌ Wave 0 |
| INV-03 | grants after the claim = before + promised; unconfirmed, stranger, expired, moved target claim nothing; second call is a no-op | pgTAP | same | ❌ Wave 0 |
| INV-03 | public sign-up is refused by the running auth service | E2E | `tests/scripts/e2e-run.sh …` | ❌ Wave 0 |
| INV-03 | sign-in → claim → refresh → gate, in that order | unit | `yarn workspace @openvaa/frontend test:unit` | ✅ `passwordLogin.test.ts` (extend) |
| INV-03 | registration through a seeded invitation, link opened from the mail | E2E | wrapper | ✅ `contestant-journey.spec.ts`, `perm-localisation-positive.spec.ts` (re-point) |
| INV-04 | `used` after the claim, after the claimant is deleted; no second grant; a claimed row is not deletable by an admin | pgTAP | `test:db` | ❌ Wave 0 |
| INV-05 | named candidate and organization confirmed at seeding; nameless not; project-scope confirms nothing | pgTAP | `test:db` | ❌ Wave 0 |
| D-15, D-20 | uniform response; locale validation; seven complete templates; the self-check's decision | unit | `yarn workspace @openvaa/supabase test:unit` | ❌ Wave 0 |
| exposure | censuses; service-only functions not executable by API roles; no API role reads `code_hash` | pgTAP | `test:db` | ✅ `07-rpc-security.test.sql` (edit) + new file |
| removal | the four zero-hit greps | gate | § R-3 commands | — |

### Sampling Rate
- **Per task commit:** the workspace's unit suite, or `test:db` for a schema task.
- **Per wave merge:** `yarn lint:check`, `yarn test:unit`, the schema workflow of § R-6.
- **Phase gate:** the full set of D-24 with one wrapper-driven E2E run, zero failed and zero did-not-run, and the two bank-auth projects each alone.

### Wave 0 Gaps
- [ ] `apps/supabase/supabase/tests/database/NN-invitations.test.sql` — INV-01..INV-05, D-19, exposure
- [ ] the function's pure modules and their `.test.ts` files
- [ ] one request to the local function with only the anon key (A3), one mail sent from it and read from the catcher (A4, OQ-10), `curl -sI` on both loopback hosts while the wrapper's server is up (A6)
- [ ] one measurement that `auth.setSession` writes the cookies on the server client (A5)
- [ ] a full pgTAP run on the real stack with the new schema, to see the storage files this research could not run (A11)

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | GoTrue one-time tokens (single use, 3600 s); password grant for code sign-in; public sign-up off, confirmations on; per-code attempt limit |
| V3 Session Management | yes | cookie session through `@supabase/ssr`; refresh after the claim so the token carries current authority; no session in a URL fragment |
| V4 Access Control | yes | the authority map in the `INSERT` / `SELECT` / `DELETE` policies through `user_can`; `claim_invitations` reads identity from `auth.uid()` only; cross-project target checked when written and when claimed; no `UPDATE` for any API role |
| V5 Input Validation | yes | CHECK constraints on shape, scope, binding and normalisation; uuid and locale validation in the function; the caller supplies no mail text and no origin |
| V6 Cryptography | yes | core `sha256` over a 60-bit server-generated code from `gen_random_uuid()`; never hand-rolled; the plaintext is returned once and stored nowhere |
| V7 Errors and Logging | yes | one response for every anonymous outcome; GoTrue and SMTP errors to the log only; no address, code or token in a log line |
| V11 Business Logic | yes | throttle per address; a batch is one transaction; each row claimed or skipped by itself |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation | Evidence |
|---------|--------|---------------------|----------|
| Claiming another person's invitation by signing up with their address | Spoofing / Elevation | public sign-up off; the claim reads `email_confirmed_at` from `auth.users` | RQ-1, measured both ways |
| Pre-registering the victim's address, then using the password after they confirm | Spoofing | public sign-up off (confirmations alone do not help) | pre-hijack table |
| Changing one's own address to the victim's | Spoofing | GoTrue keeps the change pending until the new address clicks | probe (b), four configurations |
| A project editor promising themselves project authority | Elevation | the map in the `INSERT` policy; same refusal on a direct insert | R-1.5 |
| Rewriting a harmless invitation after the check | Tampering | no `UPDATE` privilege or policy | R-1.5 |
| Planting a chosen code hash | Tampering | no `INSERT` privilege on `code_hash`; trigger generates | R-1.4 |
| Cross-project target | Elevation | `entity_project_id = project_id` when written and when claimed; `target_id = project_id` CHECK | R-1.5, R-1.6 |
| Replaying a used code; reopening by deleting the claimant | Elevation | `claimed_at` defines "claimed"; unique `code_hash` per project; `ON DELETE SET NULL` | R-1.6 |
| Guessing codes; guessing a password through a code | Spoofing | 60 bits; ten attempts per used code per fifteen minutes | R-1.4, R-1.7 |
| Enumerating invited addresses through the link request | Information disclosure | one response, sent before the work; slot taken only for eligible addresses | R-1.7, OQ-7 |
| Enumerating registered addresses through GoTrue's `/otp` | Information disclosure | **not mitigated by this phase** | OQ-6 |
| The used-code answer as an account oracle | Information disclosure | three fixed answers and nothing else; the claimant's address never leaves the function | R-1.7 |
| Mailing arbitrary addresses or content | Abuse | seeding sends nothing; a link only for an eligible address or a valid code's bound address, throttled; fixed templates; origin from configuration | R-4 |
| A login token aimed at an attacker's site | Spoofing | the link's origin is never caller-supplied | OQ-4 |
| A deployment running with sign-up on | Elevation | the function's self-check refuses to issue links; gate on `config.toml` | RQ-1 recommendation |
| A stale token after a grant is revoked seeding for up to `jwt_expiry` | Elevation | accepted residual (CONTEXT D-09) | — |

## Sources

### Primary (HIGH confidence)
- A private GoTrue `v2.197.0` + PostgreSQL 17.6 + Mailpit stack, created and removed this session — every row tagged `[MEASURED: private stack]`.
- The working tree at `03b8a0524` / `0a06627ba` / `c1153ae1b`: `schema/000-enums.sql`, `300-auth-tables.sql`, `301-auth-functions.sql`, `302-rls.sql`, `303-column-grants.sql`, `011-validation-functions.sql`, `102-entities.sql`, `107-feedback.sql`, `502-email-helpers.sql`; `config.toml`; `tests/database/07-rpc-security.test.sql`, `25-matrix-conformance.test.sql`; `apps/supabase/scripts/lint-schema.mjs`; `scripts/assert-*.mjs`; `functions/*`; `apps/frontend/src/routes/api/auth/callback/+server.ts`, `lib/auth/passwordLogin.ts`, `lib/auth/roles.ts`, `lib/supabase/safeGetSession.ts`, `lib/supabase/server.ts`, `hooks.server.ts`, `eslint.config.mjs`; `tests/tests/utils/supabaseAdminClient.ts`, `fixtures/shared/emailBucket.fixture.ts`, `specs/contestant/contestant-journey.spec.ts`; `tests/scripts/e2e-run.sh`.
- `docker inspect` of `supabase_auth_openvaa-local`, `supabase_edge_runtime_openvaa-local`, `supabase_inbucket_openvaa-local`, `supabase_db_openvaa-local`, 2026-10-06.
- `.claude/skills/database/SKILL.md`.

### Secondary (MEDIUM confidence)
- https://supabase.com/docs/guides/functions/background-tasks — `EdgeRuntime.waitUntil`, the local `per_worker` policy.
- https://supabase.com/docs/guides/functions/function-configuration — JWT verification default.
- Phase 172 and 173 plans and `173-RESEARCH.md` — expected state of the tree.

### Tertiary (LOW confidence)
- Hosted-platform behaviour (dashboard switches, rate-limit header, forwarded headers) — assumed, listed in the Assumptions Log.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — nothing new; versions read from the running containers and the lockfile.
- Auth behaviour (RQ-1..RQ-5, RQ-7): HIGH — measured on the pinned GoTrue under four configurations.
- Schema design: HIGH — prototyped, run, and checked against the repository's own linter and pgTAP files (storage files excepted).
- Edge runtime topology and background sending (RQ-6, OQ-7): MEDIUM — documentation and inspection, not measurement.
- E2E environment (link origin, SMTP port): MEDIUM — inspected, not exercised.

**Research date:** 2026-10-06
**Valid until:** the auth measurements hold for GoTrue `v2.197.0`; re-measure on any bump of the Supabase CLI. The tree anchors are stale as soon as Phases 172 and 173 finish — the planner re-reads them.
