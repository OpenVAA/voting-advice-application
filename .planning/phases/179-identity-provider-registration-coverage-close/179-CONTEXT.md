# Phase 179: Identity-Provider Registration & Coverage Close - Context

**Gathered:** 2026-10-06
**Status:** Ready for research, then planning — with **seven items marked ⚠ OPERATOR REVIEW** (J1–J7
under *Judgement calls*), **four research items** (RQ-1..RQ-4, RQ-1 blocking) and **three upstream
phases not yet executed** (175, 177, 178) whose output the planner must re-read before any anchor in
this file is used.

**Source of decisions:** `.planning/v2.16-DISCUSSION-POINTS.md` § *Phase 179 — Identity-Provider
Registration & Coverage Close* (plus § *Cross-phase picture*, X1–X3, the 178 section's cross-phase
notes and § *Additional notes*) — a shared checkbox document covering Phases 170–179 that the operator
filled in one pass. Its rule: an unticked decision accepts the `★ RECOMMENDED` option; a ticked box
overrules the ★; `**EDIT:**`/`**NOTE:**` free text beats every box.

In Phase 179's own 25 decisions the operator ticked **no box** and wrote **no EDIT or NOTE** (confirmed
by a search of the whole document for ticks and notes: none falls inside the section). Every decision
takes its ★ — rewritten where an executed or planned phase has since changed what the ★ assumed.

Choices made **outside** this section that bind this phase:

1. **X2 → ★ (a), untouched** — identity-provider registration never claims an invitation in v2.16; an
   admin resolves a duplicate by hand. D-06 and J3 make that true by mechanism, not by accident.
2. **175-B2 / 175-B3 NOTE — settled 2026-10-07 as stated (operator decisions B1–B3 (a),
   `.planning/v2.16-OPERATOR-DECISIONS-2026-10-07.md`); the fallback in D-10 is not needed.** Identity provider → candidate confirmed,
   organization **not** confirmed (its name is user-defined); code or email → both confirmed, as the
   normal case — from Phase 177.1 the admin states it on each call (`p_confirm_entity`), and the seed
   writer and the docs pass "confirmed" for a named entity unless told otherwise (operator decision
   F1 (a), 2026-10-08); name changes (first, last, short, name) gated on `!entity.confirmed` for all
   types; the nominations lock — the app setting `access.nominationsLocked`, which replaces
   `projects.lock_nominations` in Phase 175 (operator decisions B1 (a), B4 (a), 2026-10-08) —
   affects nominations only. This **agrees with 179-C1 ★** (D-10). The fallback, should the Phase 175
   discussion land elsewhere, is stated in D-10.
3. **Additional note 1** — the whole `preregister` route becomes `register`, with an identity-provider
   subroute inside it. Assigned by the orchestrator to Phases 178–179; exact names are settled in Phase
   178's plan. **This is an interpretation for the operator to confirm (J7).** This phase removes the
   legacy `preregister/` chain (REG-14).
4. **170-A5 → (b)** — the auth pair is at the neutral `api/auth/{callback,logout}`; the OIDC routes
   stayed at `api/oidc/{authorize,callback,token}`, and the legacy write is at
   `api/contestant/preregister`.
5. **171-A3 → (b)** — the matrix is `contestantApp.registrationModes`, read through the accessors of
   `packages/app-shared/src/settings/contestantAppConfig.ts`; `preRegistration.enabled` is gone.
6. **173-B5 → (b)** — a signed-in "nothing to edit — contact support" view exists (`NothingToEdit`).
7. **178-B1 ★ + NOTE** — the "password set" fact rides the user-data retrieval RPC. **Phase 174's
   research measured that it is true for every identity-provider user** (they carry a generated
   password hash), which breaks 179-B3 ★ as written. See D-08 and J2.
8. **X3 → ★ (a)** — `REQUIREMENTS.md` and `ROADMAP.md` were amended on 2026-10-05. Both carry an
   `⚠ UNRESOLVED` marker on REG-05 / criterion 3. **D-09 proposes the resolution (J1).**

<domain>
## Phase Boundary

A user can register a candidate or an organization with the identity provider, gives the email they
will sign in with, and goes straight to editing. With this the three registration modes are complete
and covered end to end, and the legacy `preregister/` chain is gone. Requirements **REG-04, REG-05,
REG-06, REG-07, REG-08, REG-14, E2E-01, E2E-02, E2E-03**. Depends on Phases 175, 177 and 178; reads
171's matrix, 172's gate G, 173's multi-entity grants and 174's auth configuration and mail path.
**UI hint: yes.**

It delivers:

- **the round trip** — the chosen entity type carried from selector C through the provider and back,
  checked against the registration-mode matrix in three places with `identity-callback` authoritative;
- **creation at the callback** — `/api/oidc/callback` invokes `identity-callback`, which creates the
  user and the entity (candidate or organization) together, and the callback establishes the session;
- **CI1** — the success screen: the email step (address recorded pending, confirmation mail sent), the
  organization's name and abbreviation, and the returning-user variants;
- **the email gate** — a layout gate between F and G for a user who has given no address;
- **CI2** — the error screen, with three honest classes of failure;
- **REG-14** — deletion of the whole legacy `preregister` inventory, and a check that keeps it gone;
- **coverage close** — the identity-provider specs in the default suite, a mock issuer that can mint
  several identities and failures, and a gate script proving E2E-01 and E2E-02.

**Not in this phase:** the mode selector C, the `EmailEntry` component, the emailed sign-in path and
screens A, B, D1, D2, E, F (Phase 178); organization profile editing (175); the nomination editor K
(177); claiming an invitation from an identity-provider account (X2 (a), todo); merging two accounts
(179-B2 (c), todo); a change-email screen for other users; nonce verification (D-17); the milestone
audit (D-24); any Admin-app screen.

### Roadmap success criteria (ROADMAP.md § Phase 179, as amended 2026-10-05)

1. A new user completes the identity provider's flow (CI), which creates the user and the entity
   together, arrives on the success screen (CI1), enters and confirms the email they will sign in with,
   and on Continue goes straight on to the terms of use and to editing, with no wait for an email
   confirmation and no set-password step. The address is recorded as pending and a confirmation link is
   sent to it; it becomes the sign-in identifier once that link is opened, and until then the user
   returns through the identity provider (REG-04).
2. When the project allows identity-provider registration for more than one entity type, the user
   chooses the type in the registration-mode selector (C) before the provider's flow, and the entity
   created is of that type; when it allows exactly one, the user is not asked. A user registering an
   organization enters its name and abbreviation on the success screen through multilingual inputs,
   which are saved to the already-created organization, and is told these can be edited later, until the
   organization is confirmed (REG-06, REG-07). A self-registered organization is created unconfirmed,
   with an empty name, and an admin confirms it. **Settled 2026-10-07 (operator decision B1 (a)):** a
   name is editable while the entity is unconfirmed; the nominations lock affects nominations only
   (D-10, D-12).
3. A user who has already registered and identifies again is told so, is asked to use their email to
   sign in next time, and continues without entering an email again; a user who identified before but
   never gave an email is asked for it before reaching the home screen (REG-05). **⚠ UNRESOLVED in the
   roadmap — resolved by D-09, pending operator review (J1).**
4. When identification fails the user sees the error screen (CI2) with the support block and a "Try
   again" action; the message says truthfully whether retrying can help, and a deliberate cancel is
   treated as a cancel rather than as a failure, in all seven locales (REG-08).
5. The legacy registration flows are gone — the legacy `register/` contents since Phase 178, the legacy
   `preregister/` chain here: no `preregister/` URL resolves, no code, message catalogue entry or spec
   refers to the removed routes, constants or contracts, and the flow of screens A–K is the only
   registration path. The one registration tree is `register/`, with the identity-provider flow as a
   subroute inside it (REG-14).
6. Each registration mode has an E2E spec that follows the real email verify redirect rather than
   hand-building the callback URL; organization registration, entity selection with several grants and
   nomination definition each have E2E coverage; and the full E2E suite is green at close (E2E-01,
   E2E-02, E2E-03).

### Standing rules (ROADMAP.md § v2.16, inherited by every phase)

- **Cardinal rule:** no failing E2E test, no exemptions, no "known flaky"; a "did not run" counts as a
  failure. **D-19 moves the two bank-auth projects into the default suite**, so from this phase on a
  broken round trip fails the gate every later change runs — and a plain `yarn test:e2e` against a
  hand-started server without the provider environment fails those specs rather than skipping them.
- **Localisation:** every user-facing string ships in all seven locales (`da, en, et, fi, fr, lb, sv`).
  A mail is a user-facing string: the confirmation mail of D-06 is seven-locale.
- **Accessibility:** every new or changed screen meets WCAG 2.1 AA and is reached by the axe scan —
  CI1 in each variant and for each entity type, CI2 in each class, the home reminder, and C's
  identity-provider option with the type choice.
- **Both entity types:** a criterion that says "user" or "entity" holds for candidates and for
  organizations unless it names one.
- **Nothing is deployed:** routes, the function's contract, cookies and settings change in place; no
  migration path for existing identity-provider users is owed.
- **Schema edits are serial.** The discussion did not list 179 among the phases that edit
  `schema/*.sql`. J3 and D-11 may each add one; if either does, 179 regenerates the single migration
  after 177, and types are generated on the freshly reset database before pgTAP.
- **Gates are read by exit status, never through a pipe.**

### Standing todos the roadmap puts in scope

`2026-09-21-surface-bank-identification-failure-to-the-user.md` (closed by D-14, D-15),
`2026-09-21-preregister-route-discards-email-and-nominations.md` (closed by D-04, D-06, D-18),
`2026-06-03-full-bank-authentication-flow-e2e-spec.md` (closed by D-20),
`2026-09-02-close-bank-auth-oidc-round-trip-window.md` (closed by D-19). Further todos: D-22.

</domain>

<decisions>
## Implementation Decisions

Decision ids map one-to-one onto the discussion document's Phase 179 ids, given in parentheses.
25 decisions → D-01..D-25. Each entry states the chosen option and, under **If wrong**, what an
attacker or a defect could do if it were implemented otherwise. Security is the centre of this phase:
the planner carries every "If wrong" line into the plan's threat model.

Names are those on the tree at `a020545b9` (after Phases 170–173; 174 executing). `F` is
`apps/frontend/src`, `S` is `apps/supabase/supabase`. Anything owned by Phases 175, 177 or 178 is
marked **expected at planning time**: the planner re-reads that phase's output.

### 0 — Factual baseline

- **D-01 (179-0.1):** Accept all 18 facts of 179-0 as the baseline; restated under
  `<factual_baseline>` **with the corrections Phases 170–174 made to facts 1, 4, 8, 11, 14, 15 and 17**
  (reconciled with Phase 170, 171, 173 and 174 outcomes). The facts are a 2026-10-04 snapshot at
  `df0cec944`; the planner re-reads the tree.

### A — The round trip

- **D-02 (179-A1) ⚠:** **The chosen entity type travels in a short-lived httpOnly cookie.**
  `POST /api/oidc/authorize` accepts an `entityType`, checks it against the matrix (D-03), and sets a
  new cookie beside `oidc_state` — one more entry in `F/lib/cookies/index.ts` (`COOKIE`), same
  attributes (`httpOnly`, `sameSite: 'lax'`, `path: '/'`, 600 s, `secure` as the others). The callback
  reads it, deletes it, and passes the value to `identity-callback`. The callback's
  "clear every cookie an authorization flow leaves behind" helper deletes it on every failure path, and
  authorize overwrites it on every start, so a value from an abandoned flow never survives into the
  next. `cookies.test.ts` (the exact-set pin) and `yarn assert:cookie-names` change with it. It works
  for both providers: Idura and Signicat both start at the authorize endpoint. No signature is added.
  **If wrong:** the cookie is forgeable by the browser's owner, by design — so anything that *trusts*
  it is wrong. A flow that created the entity from the cookie without the function's own matrix check
  would let anyone with a bank identity create an organization in a project that allows candidates
  only. A cookie that is not httpOnly, or not cleared, lets a script or a stale flow pick the type for
  the next person on a shared browser. Carrying the type in the redirect URI's path (option c) would
  need one registered URI per type; carrying it in `state` (option b) does not work for Signicat, which
  sends none. **Research RQ-2** confirms the cookie returns with the provider's redirect.

- **D-03 (179-A2) ⚠:** **The matrix is enforced in three places, and `identity-callback` is the
  authority.** (1) The function reads the project's stored `contestantApp` settings with its
  service-role client and refuses — creating nothing — a type for which `identity_provider` is not
  allowed, whatever the caller sent. An absent type is accepted only when exactly one served type
  allows `identity_provider`; an unknown value is refused. The rule it applies is the one
  `isRegistrationModeAllowed` / `getEffectiveRegistrationModes` apply in
  `packages/app-shared/src/settings/contestantAppConfig.ts`; the Deno function cannot import that
  module, so it carries its own copy **held equal by a conformance test** in the manner of
  `S/functions/identity-callback/flowConformance.test.ts`. A project whose settings cannot be read is a
  refusal, never a default. (2) The authorize endpoint refuses early, so nobody is sent to the bank for
  a closed mode. (3) The callback re-checks before invoking.
  **If wrong:** with the check in the frontend routes only, the function stays callable directly
  (fact 9, J4), and anyone holding a valid ID token for this relying party creates an organization — or
  a candidate — in a project that never opened the mode. With a copy of the rule that drifts from the
  frontend's, the login screen offers a mode the function refuses, or the reverse. A fail-open settings
  read turns an outage into open registration.

- **D-04 (179-A3) ⚠:** **The callback route creates.** `F/routes/api/oidc/callback/+server.ts`
  exchanges the code, verifies the token as today, invokes `identity-callback` with the token, the
  project and the type, verifies the returned sign-in token to establish the session cookie, and
  redirects into the signed-in app, where CI1 is shown (D-13). **Deleted:** the `id_token` cookie
  (`COOKIE.idToken`), `F/routes/api/oidc/token/+server.ts`, `F/routes/api/contestant/preregister/` and
  the writer methods that reach them (D-18). The ID token never rests in the browser, and the two
  failure channels of fact 10 become one (D-15). **Order inside the function, binding** (173 O-5): the
  entity and its grant are written **before** the sign-in link is generated, so the token the callback
  obtains already carries the grant; a second entity added for a returning identity (D-05) is in the
  new session's claim for the same reason. No session refresh is then needed after the callback.
  **Reconciled with Phase 174:** the function is brought in line with `account-access` — its project
  comes from the request, validated as a uuid (J5) — and the Edge runtime runs
  `policy = "per_worker"`, so a change to the function needs a runtime restart before a run trusts it.
  **If wrong:** keeping the token cookie (option b) leaves an identified, uncreated user on CI1 — the
  deferred write the 2026-10-04 ruling rejected — and leaves a bearer credential for the function in
  the browser, where an XSS-free but shared machine still hands it to the next user for its lifetime.
  Generating the link before the grant strands a new user on `NothingToEdit`.

- **D-05 (179-A4):** **At most one entity per type per project for one identity.** Choosing a type the
  identity has no entity of creates it and adds the grant; the user then meets the profile-selection
  screen (H — the app root's three-way decision, Phase 173). Choosing a type it already has lands on
  the existing entity with CI1's "already registered" text.
  **Reconciled with Phase 173 (todo
  `2026-10-06-173-identity-callback-lookup-throws-for-two-candidate-grants.md`, an input to this
  phase):** `findExistingCandidate` reads "the caller's candidate-editor grants in the project" and
  ends in `.maybeSingle()`, which throws once a user edits two candidates. Since Phase 173 a user can —
  an admin can grant an identity-provider user a second candidate. "The entity this identity
  registered" is therefore **not** "any entity of that type the user edits". The function must find the
  identity's *own* entity deterministically, per project and per type, and must never throw or create a
  duplicate because the user holds other grants. **J6** proposes the mechanism: the function records
  the entity it created, per project and type, in the user's `app_metadata` (admin-writable only), and
  a returning identity is matched on that record, confirmed against a live grant.
  **If wrong:** with "create whenever the lookup is ambiguous" a returning user gets a new candidate on
  every sign-in; with option (c) one bank identity creates unlimited organization rows — a storage and
  moderation flood behind a single strong identity. Matching "the identity's entity" on name or birth
  date is the account-collision defect the OIDC review found (closed in Phase 155 by keying on `sub`):
  two people with one name would share an entity.

### B — The email address (CI1)

- **D-06 (179-B1) ⚠:** **Pending until proved.** CI1 records the typed address as a *pending* change on
  the account and sends a confirmation link to it. The user goes straight on to G and to editing. The
  address becomes the account's sign-in identifier only when the link is opened; until then the user
  returns through the identity provider. The account's address is in exactly one of three states,
  which every later decision names: **none** (the placeholder, nothing pending), **pending** (the
  placeholder, a typed address awaiting proof) and **proved** (a real, confirmed address).
  **Reconciled with Phase 174 (binding, 174 O-8):** public sign-up is off and confirmations are on in
  `S/config.toml`; `claim_invitations` trusts only a confirmed address; the research measured that a
  signed-in `PUT /user { email }` stays pending under every configuration, and that with
  `double_confirm_changes = true` (still the committed value) the old address is mailed too — for these
  users the undeliverable placeholder, so the change could never complete. **No code path in this phase
  may call `admin.updateUserById` or `admin.createUser` with a typed address and `email_confirm: true`.**
  **Mechanism — preferred, subject to RQ-1:** a server route, acting for the signed-in user, issues the
  link with the admin `generateLink` for an email change to the new address and sends it through Phase
  174's seven-locale mail path, so GoTrue's single-locale template is not what the user receives and
  `double_confirm_changes` is left alone. **Fallback if RQ-1 refutes it:** the signed-in `PUT /user`
  with `double_confirm_changes = false` — a `config.toml` change with a stack restart, a line in the
  operator's hosted-project checklist beside 174's two, and a localised template to find. The route
  applies the same per-address throttle 174 built for link mails, and refuses any address in the
  placeholder domain.
  **The mail's text is a security control:** it says that opening the link attaches this address to an
  account registered through bank identification, and tells a recipient who did not register to ignore
  it.
  **If wrong:** an unverified address accepted as the identifier (option b) is at once a recovery route
  into a bank-verified account: a typo hands the account, and the confirmed entity in it, to whoever
  owns the mistyped mailbox; and a registrant who types another person's address before that person
  arrives takes any invitation later seeded for that address, because the claim sees a confirmed
  address on the registrant's account. **A residue remains even when pending** — a victim who opens a
  confirmation link for an account someone else registered proves their mailbox *for that account* —
  which is why J3 excludes identity-provider accounts from the claim altogether.

- **D-07 (179-B2):** **An address that already belongs to another account is refused with a specific
  message** — "this address is already in use; enter another, or sign in with it" — and the user stays
  on CI1. The caller is bank-identified and signed in, so the disclosure is narrow; the route is
  throttled so that it is not a bulk address oracle. Two accounts may hold the *same* pending address;
  the first to open its link owns it, and the second's link then fails — its landing says the address
  is taken and returns the user to the email form, never an error page.
  **If wrong:** the uniform answer of screen E here (option b) leaves the user believing an address is
  theirs that never receives a link; a merge (option c) is account linking with its own takeover cases
  and is filed as a todo, not built.

- **D-08 (179-B3) ⚠:** **The emailed sign-in link is offered whenever the email mode or the
  identity-provider mode is allowed for any served type** (REG-02 as amended; Phase 178 builds the
  condition — **expected at planning time**), and an identity-provider user's first sign-in by email
  leads to F, which sets the password.
  **Reconciled with Phase 174 (a correction to the discussion's assumption):** the discussion says "no
  password is set in the provider flow". The research measured otherwise: `admin.createUser` without a
  password stores a **generated** hash, so `encrypted_password` is set for every identity-provider user,
  the "password set" fact of 178-B1 reads *true* for them, F never fires, and such a user would sign in
  by link for ever with a password nobody knows. Two things follow, both **J2**: (i) the function must
  create users so that the stored fact is honest — preferably by a creation recipe that leaves the hash
  empty (RQ-3), otherwise by a server-written marker Phase 178's fact reads; (ii) F's exemption for the
  initial registration (REG-11, 178-B2) is decided on **state, not on the kind of session**: F is not
  needed while the account's address is *none* or *pending*, and applies once it is *proved*. Nothing
  distinguishes a provider session from an emailed-link session today (both are OTP verifications), and
  a state rule needs no such distinction and cannot be forged from the browser.
  **If wrong:** an exemption keyed on something the client can present — a query parameter, a
  non-httpOnly cookie, the arrival route — lets any link-created user skip F; an identity-provider user
  with a proved address and no known password depends on their mailbox alone for ever, and the
  "password set" fact lies for a whole class of users. Option (b), a password field on CI1, is a second
  place where passwords are set inside the flow REG-11 exempts.

- **D-09 (179-B4) — resolves the `⚠ UNRESOLVED` marker on REG-05 / criterion 3, pending operator
  review (J1):** **A layout gate between F and G.** Gate order: F (not needed here, D-08) → **email** →
  G → H → home. The gate is one more entry in `CONTESTANT_GATES`
  (`F/lib/contestant/gates/gates.ts`), ahead of `termsOfUse`, with its view in `gateViews.ts`.
  **The conflict:** 179-B1 ★ ends "a user who never clicks is, for REG-05, a user without an email";
  179-B4 ★ and 179-C3 ★ both let a user with a pending address pass. **Proposed resolution:** the two
  sentences answer different questions, and the three states of D-06 separate them.
  - *Does the gate stop the user?* Only in state **none**. A user in state **pending** has given an
    address and is not asked for it again — the gate is not needed — and sees a reminder on home with
    "send again" and "use a different address".
  - *What is the user told, and how do they return?* Only a user in state **proved** is told "use your
    email to sign in next time". A user in state **pending** is, for sign-in, still without an email:
    they are told the link is waiting and that until it is opened they return through the provider.
    B1's sentence is read in this sense, and in no other.
  **Proposed REG-05 wording:** "A returning identity-provider user is told they have already
  registered. One whose address is confirmed is asked to use their email to sign in next time; one
  whose address is still awaiting confirmation is reminded of the link, can have it sent again or enter
  a different address, and returns through the provider until it is opened. Neither enters an email
  again. A returning user who has given no address is asked for it before reaching the home screen."
  The facts the gate reads are server-side: the user's `email` (placeholder domain or not), the pending
  `new_email`, and `app_metadata.identity_provider`, from the verified user read the user-level load
  already makes — never from the session object (`yarn assert:no-session-in-loads`), never from the
  URL (173 O-4: the protected loads read no `url` property tracked, and each has a read-recording
  test). The placeholder domain is one constant shared with the function through a conformance test.
  **If wrong:** gating only on return from the provider (option b) lets a user who closes the tab on
  CI1 reach home with no address for ever; gating until proved (option c) is the confirmation REG-04
  rules out; treating *pending* as *none* asks a user for an address on every visit until they click,
  and each re-entry invalidates the link already in their mailbox.

### C — The created entity

- **D-10 (179-C1) ⚠:** **A self-registered organization is created unconfirmed, with an empty name; an
  admin confirms it. A candidate is created as today: confirmed, its name from the provider's claims.**
  The function gains an organization branch — a row in `organizations` for the project, `confirmed`
  false, no name — and an `(entity, organization, <id>, editor)` grant; the "entity type is named HERE
  and nowhere else" literal in `S/functions/identity-callback/index.ts` and `entityGrant.ts` becomes a
  parameter validated by D-03. The compensating delete the candidate branch performs when the grant
  write fails is repeated for the organization branch.
  **Agrees with the operator's 175-B2 / B3 note** (identity provider → candidate confirmed, organization
  not; names editable while `!entity.confirmed`). **Fallbacks, should the Phase 175 discussion land
  elsewhere:** (i) on 175-B2 ★ (the nominations lock freezes names; confirmation does not), nothing
  changes here but CI1's "can be edited later" sentence (D-12); (ii) if organizations were to be created
  confirmed, 179-C1 is re-opened before planning — a confirmed, self-named "party" is one nomination
  confirmation from public and its name would need an `entity.edit_immutable` exception.
  **If wrong:** confirmed at creation, anyone with a bank identity mints a vouched-for party visible to
  voters and selectable as a parent in K; the provider proves who the person is, never that they speak
  for a party. Unconfirmed, the row is invisible to voters (`confirmed` is the single visibility lever
  since Phase 172) and absent from K's parent list until an admin has looked.

- **D-11 (179-C2) ⚠:** **CI1 requires the organization's name in the project's default locale; the
  abbreviation and the other locales are optional.** A user whose self-registered organization has no
  name is returned to CI1's form by the same gate as D-09. An abandoned, unnamed organization stays
  unconfirmed and invisible, and is reused when the identity returns (D-05 bounds the rows to one per
  identity, so no cleanup job). The save goes through the writer's `updateEntityProperties`, which
  Phase 175 extends with `name` and `short_name` (**expected at planning time**; today
  `EditableEntityProps` holds `image` alone), and is permitted by `enforce_entity_immutability` because
  the row is unconfirmed.
  **Reconciled with Phase 173:** the gates are decided on the user-level read, before the entity list
  is read. "Has an unnamed organization of its own" is an entity fact. The planner chooses where it
  comes from — a key beside `entities` on `get_user_entities` (173 O-1 left room; a schema edit) or a
  reordering of the user-level load — and keeps the gate's rule narrow: only the organization this
  identity registered, so that a user who also holds a named candidate is not asked about an
  organization an admin granted them.
  **If wrong:** a nameless organization reaches home, the selection screen and admin lists, and every
  renderer must cope with an entity without a name; requiring all seven locales (option b) puts
  fourteen fields before the first edit.

- **D-12 (179-C3):** **CI1 has its variants as message keys in seven locales** — **four**, not three,
  after J1: *new* (the email form; for an organization also the name fields and the "can be edited
  later" sentence); *returning, address proved* ("you have already registered — use your email to sign
  in next time", Continue); *returning, address pending* ("already registered", the link is waiting,
  send again / use a different address, Continue); *returning, no address* ("already registered" plus
  the email form). The "can be edited later" sentence ends "until an administrator has confirmed your
  organization" — **settled 2026-10-07 by operator decision B1 (a)**; the other candidate ending,
  "unless nominations are locked" (175-B2 ★), is not used. The pending variant shows the address the user typed — to its own
  owner only, from the verified user read.
  **If wrong:** a returning user greeted as new re-enters an address they already proved; a user with a
  pending address told to "use your email next time" is locked out at B, since no link is issued for an
  address that is not yet the account's.

### D — The screens and the errors

- **D-13 (179-D1):** **CI1 is signed-in and takes part in the gate order; CI2 is public, beside C.**
  **Reconciled with Phases 172 and 173:** the gates are in-layout views (`GATE_VIEWS`,
  `TermsOfUseGate.svelte`), not routes, so "a page of its own that the layout gates route to" becomes
  **a gate view**: CI1 is the view of the D-09 gate, shown by the `(protected)` layout whatever
  protected URL was asked for. The callback redirects to `/contestant` (the app root, `ContestantAppHome`),
  and the layout shows CI1 first. The *returning, address proved* and *pending* variants are not
  "needed" by any stored fact — they are a one-time notice on arrival from the provider — so the
  callback leaves a short-lived httpOnly **arrival marker** cookie that the user-level server load
  reads and CI1's Continue clears. A query parameter is ruled out by 173 O-4. CI2 is a public route in
  the identity-provider subroute of `register/` (**names expected at planning time**, J7); its "Try
  again" returns to C with the identity-provider option open.
  **If wrong:** CI1 as a state of the public selector page (option b) sits outside the layout that runs
  the gates, so closing it skips the email step; an arrival signal the client can set makes the notice
  spoofable (harmless) but, if it also *satisfied* the email gate, skippable — the marker only ever
  adds a view, never removes one.

- **D-14 (179-D2):** **Three user-facing classes.** *Cancelled* (the provider's `access_denied` and its
  known cancel values) — calm text, no apology. *May work on retry* (`token_exchange_failed`,
  `missing_code`, `invalid_state`, a 5xx from the function, any unknown provider value) — apology and
  "try again". *Will not work on retry* (`invalid_token`, mode not allowed, configuration) — "this is a
  problem on our side; contact support". All three show the support block (the `contactSupport`
  component Phase 173 left) and the Try again action. Three texts × seven locales.
  **If wrong:** one retry text for everything tells a user to retry a misconfiguration, which the todo
  calls a regression in honesty; one text per code reveals which verification stage failed.

- **D-15 (179-D3):** **The failure reaches CI2 as a query parameter carrying a code from a closed
  set.** The callback maps whatever the provider sent to a code before redirecting, so no
  provider-chosen string reaches the URL or the DOM; CI2 renders the *may work on retry* text for any
  value it does not know and never echoes the parameter. It announces the message through the existing
  route announcer. **Reconciled with 179-D2 (an undercount in the ★):** the ★ says "the four existing
  codes keep their spellings and two are added". The four (`invalid_state`, `invalid_token`,
  `missing_code`, `token_exchange_failed`, in `OIDC_ERROR`) stay and `mode_not_allowed` and
  `registration_failed` are added — but once the provider's raw value may no longer pass through
  (`upstreamOidcError` forwards it today), the *cancelled* class and an unknown provider error each
  need a code too. The closed set therefore has **eight** members; the two extra spellings are the
  planner's. The function answers the callback with a coarse closed code of its own — never the caught
  message, which stays logged-only as today — so that a configuration failure can be told from an
  outage without turning the response into a verification oracle.
  **If wrong:** a raw provider string in the URL is reflected content an attacker can craft a link
  around; a flash cookie (option b) loses the message on reload and is not addressable by E2E or the
  axe scan.

### E — Hardening and deletion

- **D-16 (179-E1):** **Close the stale aud/iss todo with its evidence line; leave the "fourth verifier
  copy" todo open and untouched.** `2026-08-22-identity-callback-verifyjwt-fails-open-on-aud-iss.md` is
  fixed — `requireVerifyClaimBinding` in `S/functions/identity-callback/verifyConfig.ts` throws
  `ERR_AUDIENCE_UNCONFIGURED` / `ERR_ISSUER_UNCONFIGURED`. `2026-08-22-edge-function-fourth-idtoken-verifier-copy.md`
  stays: it is a cross-runtime sharing decision this phase does not need. See *Pre-existing OIDC
  defects* below for the full disposition.
  **If wrong:** a todo known to be false stays in the pending list and is re-investigated by every
  later reader; collapsing the Deno verifier into its frontend twin here would be an unreviewed
  security change inside a feature phase.

- **D-17 (179-E2):** **Token verification is not changed; the `nonce` stays unverified.**
  **Reconciled with the tree:** the ★ says "file a todo". It is already filed —
  `2026-10-02-oidc-callback-does-not-verify-nonce.md` (Phase 168). This phase files nothing new and
  **re-anchors that todo** to the rewritten callback, adding one sentence: after D-04 the callback
  turns a verified token directly into a session, so the nonce is the remaining replay control for
  Idura.
  **If wrong / what stays open:** the `state` binding blocks login CSRF, and the authorization code is
  single-use at the provider; a token replayed *to the callback* is not a path (the callback obtains
  the token itself). A token replayed *to the function* is — which is J4's reason.

- **D-18 (179-E3):** **Delete the whole inventory of fact 14, and add a check to `lint:check` that
  keeps it gone.** A new `assert:` script in the `lint:check` chain, modelled on
  `scripts/assert-no-candidate-app-names.mjs`, fails on any reference under `apps/`, `packages/` and
  `tests/` to the removed route constants, message namespaces, URL paths, writer and context members
  and the `id_token` cookie; simplest form, a zero-hit rule for the `preregist` stem with no allowlist
  beyond the script itself. The inventory, with today's names, is under `<factual_baseline>` fact 14;
  whatever Phase 178 already removed is found absent. Deleting the tree leaves `TermsOfUseForm` with
  one consumer (gate G) — remove whatever it carried for the second. The three docs pages are
  rewritten, not deleted (D-22).
  **If wrong:** a dead API route that still accepts an ID token is a live write path nobody tests; dead
  writer methods and fourteen catalogue files contradict criterion 5; a recorded `git grep` (option b)
  is true only on the day it was run.

### F — E2E and coverage

- **D-19 (179-F1) ⚠:** **The identity-provider specs are default-on.** `tests/scripts/e2e-run.sh`
  starts the dev server and the Edge Function with the test provider environment, the mock issuer is
  always spawned, the `PLAYWRIGHT_BANK_AUTH` conditionals leave `tests/playwright.config.ts`, and the
  CI job gets the same environment. The dev server trusts the mock's certificate through
  `NODE_EXTRA_CA_CERTS`, not `NODE_TLS_REJECT_UNAUTHORIZED=0`.
  **Reconciled with Phase 171 (a fact the ★ did not have):** the two opt-in projects **cannot share a
  run today** — one served function has one issuer, and `bank-auth` uses a synthetic token issued as
  `https://test-idp.example.com` while the journey's is minted by the mock at `https://127.0.0.1:9443`.
  Default-on therefore requires **one issuer for the whole suite**: the direct-call spec is re-pointed
  at tokens the mock issuer mints (or folded into D-20's scenarios), and under J4 it calls the function
  as the server does. The drivers `171-bankauth.sh` and `174-bankauth.sh` are the working models of the
  environment the wrapper must now provide itself. The journey stays at the tail of the perm chain (the
  `app_settings` singleton). The matrix the scenarios need — `identity_provider` for candidates and for
  organizations — is stated by their own setup, which replaces the whole row; widening the *base*
  dataset instead changes two dev-seed pins and the journey's login assertions (171), so it is avoided
  unless Phase 178's selector spec needs it.
  **If wrong:** opt-in (option b) is how the round trip went unrun from Phase 158 to now, and "full
  suite green" would exclude one of the three modes at every later close; default-on locally and
  excluded in CI (option c) makes the two environments disagree about what the suite is. **A hazard to
  close in the plan:** the test signing keys are committed; the plan states where the default local
  stack's function environment names them and adds a check that no non-test configuration does.

- **D-20 (179-F2):** **The mock issuer gains a per-test selector for identity and outcome, and the
  scenarios are specified** — the ★'s seven, plus one for J1: (1) new candidate, which also opens the
  confirmation link from the mail catcher through the real verify redirect and then signs in by email
  (E2E-01); (2) new organization, name fields saved to the entity and the row unconfirmed; (3)
  returning with a proved address; (4) returning with no address — the gate, on a direct protected URL;
  (5) cancel; (6) provider error; (7) a forged type the matrix forbids — the cookie is set by hand,
  CI2 shows `mode_not_allowed`, and **no row was written**; (8) returning with a pending address — not
  asked again, reminder with resend. The selector is a control on the mock (`tests/tests/support/mockOidcIssuer.ts`),
  which keeps binding loopback only. Unit tests in the function's directory cover what a browser
  cannot: the two-candidate-grant lookup (D-05), the settings-unreadable refusal (D-03), a direct call
  without the server's credential (J4).
  **If wrong:** with three scenarios (option b) REG-05 and the matrix refusal rest on unit tests of a
  file vitest reads only as text.

- **D-21 (179-F3):** **Tags and a gate script prove E2E-01 and E2E-02.** Tags on the covering tests —
  `@reg-idp`, `@reg-email`, `@reg-code`, `@org-registration`, `@entity-selection`,
  `@nomination-definition` — and a script that reads `playwright test --list` and fails when any tag has
  no test in the default run. The email and code tags land on Phase 178's specs, `@entity-selection` on
  Phase 173's (`contestant-entity-selection.spec.ts`), `@nomination-definition` on Phase 177's. The
  script is part of the closing gate (D-25), in the manner of the "a probe file must match a project"
  guard.
  **If wrong:** a table in VERIFICATION.md is unverified the day after it is written.

### G — Todos, plan shape and gate

- **D-22 (179-G1):** **Six todos are closed** — the four the roadmap lists, the stale aud/iss todo
  (D-16) and `2026-08-22-preregister-layout-server-has-no-unit-test.md`, whose file is deleted — each
  moved to done with a line naming the commit or spec that closes it; the Phase 168 docs note inside
  the "discards email" todo is honoured by rewriting that docs page. **Recommended additions found on
  the tree, flagged for the planner, each re-read before it is touched:**
  `2026-10-06-173-identity-callback-lookup-throws-for-two-candidate-grants.md` (closed by D-05);
  `2026-08-28-preregister-election-constituency-selection-harmonisation.md` (moot: its pages are
  deleted); `2026-08-22-bank-auth-journey-setup-header-contradicts-config.md` (its config block is
  rewritten by D-19); `2026-09-15-refactor-candidate-and-entity-registration-flow-and-nominati.md`
  (closed for method 1 here, for 2 and 3 in 178). **Todos to file:** `findUserByIdentityMatch` pages
  through every auth user on each sign-in; the Signicat PKCE verifier is written by the browser into a
  non-httpOnly cookie; account linking (179-B2 (c)). The X2 todo is Phase 174's to file (174 O-9) —
  confirm it exists.

- **D-23 (179-G2) ⚠:** **Six sequential plans, each leaving the suite green:** (1) the Edge Function —
  entity type, matrix check, organization creation, own-entity lookup, the link addressed to the
  account's current address, the coarse result code, unit and conformance tests; (2) the OIDC routes —
  authorize check and type cookie, the callback invoking the function, the error codes; (3) CI1 — the
  email route and mail, the organization fields, the variants, the gate; (4) CI2 and its texts; (5)
  REG-14 deletion, the `lint:check` script, the docs; (6) the harness default-on, the mock issuer, the
  scenarios, the coverage script, the gate. **Ordering constraint from the reconciliations:** plan 1
  changes the function's contract while the legacy `api/contestant/preregister` route is still its only
  caller, so plan 1 keeps the old body accepted (type absent → the single allowed type) until plan 2
  moves the caller; and since the bank-auth projects are still opt-in until plan 6, **plans 1–5 each
  run them through the driver, alone**, or the green point is unproved. If J3, J5 or D-11 adds a schema
  edit, it rides plan 1 or 3 with the regenerate-reset-types-pgTAP sequence.
  **If wrong:** the four-plan shape (option b) changes the function's contract and its only caller in
  one step with no green point between; plans 3 and 4 in parallel (option c) both write the same
  catalogues and constants file.

- **D-24 (179-G3):** **The phase gate is here; the milestone audit runs separately** through
  `/gsd-audit-milestone` before completion. The roadmap's "no gate phase" stands.

- **D-25 (179-G4):** **Closing gate, each step read by exit status:** `yarn lint:check` (which now
  holds the D-18 script, and keeps `assert:auth-signup-closed`, `assert:cookie-names`,
  `assert:edge-env-defaults`, `assert:i18n-catalog-namespaces` and `assert:a11y-scan-wiring` green),
  `yarn test:unit`, the Edge Function tests (`yarn workspace @openvaa/supabase test:unit`), pgTAP (types
  generated on the freshly reset database first, if the schema changed), the production build, the
  coverage script of D-21, then **one** full wrapper E2E run with the identity-provider specs in it.
  **Recommended additions, flagged:** a restart of the Edge runtime before the run (`per_worker`); a
  live probe that the served function refuses a direct anonymous call if J4 is accepted; and the
  hosted-project checklist line if `double_confirm_changes` changed.

### Reconciliations

| # | ★ text that assumed something since changed | Reconciled to | Cause |
|---|---|---|---|
| R1 | 179-B3 ★ / fact 4: "No password is set in the provider flow" | A generated hash is stored; the "password set" fact must be made honest and F's exemption is state-based (D-08, J2) | Phase 174 research |
| R2 | 179-B1 ★: "`double_confirm_changes` must not mail the placeholder (set it false, or issue the link with the admin `generateLink`)" | The admin-issued link through 174's seven-locale mail path is preferred; the config change is the fallback; `email_confirm: true` on a typed address is forbidden (D-06) | Phase 174 (O-8), standing rules |
| R3 | 179-B1 ★ "for REG-05, a user without an email" vs 179-B4 ★ / 179-C3 ★ | Three address states; the gate stops *none* only; "use your email next time" is told to *proved* only; four CI1 variants (D-09, D-12) | the document itself |
| R4 | 179-D1 ★: "CI1 is a signed-in page of its own that the layout gates route to" | A gate view in `CONTESTANT_GATES`, plus an httpOnly arrival marker for the one-time notice; no URL read (D-13) | Phases 172, 173 (O-4, O-10) |
| R5 | 179-A4 ★ and fact 2: a returning identity is found through its candidate-editor grant | The identity's own entity per project and type, never "any grant"; no throw on several (D-05, J6) | Phase 173 (O-8) |
| R6 | Fact 17 / "→ 170": the redirect is `${SITE_URL}/candidate` | `/contestant`, the app root's three-way decision; a user with two entities meets the selection screen | Phases 170, 173 |
| R7 | Facts 8 and "Cannot be defined yet": the only gate is `preRegistration.enabled` | The matrix accessors of `contestantAppConfig.ts`; the flag is gone (D-03) | Phase 171 |
| R8 | Fact 15: `enable_confirmations = false` | `[auth] enable_signup = false`, `[auth.email] enable_confirmations = true`; `double_confirm_changes = true` unchanged; Edge `policy = "per_worker"` | Phase 174 |
| R9 | 179-F1 ★: "the `PLAYWRIGHT_BANK_AUTH` gate is removed" | Also: one issuer for both specs, since the two projects cannot share a run today (D-19) | Phase 171 |
| R10 | 179-D3 ★: "two are added" | Four more codes, eight in all (D-15) | the document itself (179-D2) |
| R11 | 179-E2 ★: "file a todo" | Already filed 2026-10-02; re-anchored (D-17) | the tree |
| R12 | 179-C2 ★: "sent back to CI1's form by the same gate" | The gate reads user-level data; the organization fact needs a source (D-11) | Phase 173 (O-1) |
| R13 | 179-A3 ★ and fact 9: `project_id` honoured only when it equals the environment's | The project comes from the request, as 174 ruled for `account-access` (D-04, J5) | Phase 174 (OQ-8) |
| R14 | Fact 11 and the orchestrator's defect list: "error oracle", "birthdate collision" | Both closed or refuted in Phase 155 and still so on the tree; nothing to take on | the tree |
| R15 | Fact 14: names before the 170 rename; `register/**` (4 files) | `routes/contestant/…`, `ContestantAppPreregister*`; `register/` holds 7 files today and is Phase 178's | Phases 170, 171 |
| R16 | 179-C3 ★ / REG-07: "unless nominations are locked" | One sentence: "until an administrator has confirmed your organization" (D-12) | 175-B2 NOTE, settled 2026-10-07 by operator decision B1 (a) |

### Judgement calls

Marked ⚠ OPERATOR REVIEW where the filled document did not foresee the choice.

- **J1 — REG-05 (D-09):** the gate stops only a user who has given no address; a pending address is
  "given" for the gate and "not yet an email" for sign-in and for the text. Proposed wording in D-09.
- **J2 — the password fact and F (D-08):** make "password set" honest for identity-provider users
  (empty hash by recipe, else a server-written marker), and exempt F by address state, not by session.
  Touches Phase 178's fact; if 178 has built it on the raw column, 179 changes it.
- **J3 — identity-provider accounts never claim (X2 (a), D-06):** `claim_invitations` writes nothing
  for a caller whose `app_metadata` names an identity provider. Without it, X2 (a) stops being true the
  moment an address is proved — the claim wired into the auth callback and the login action would then
  match by email — and a registrant who gets a victim to open one confirmation link takes the victim's
  seeded entity. One predicate in Phase 174's function, a pgTAP case, a schema regeneration. The
  alternative is to accept X2 (b)'s behaviour and say so.
- **J4 — close `identity-callback` to server callers (D-03, D-17):** after D-04 the SvelteKit server is
  its only caller, so it can require the server's credential instead of answering the anon key. Today a
  stolen or replayed ID token, presented directly, returns a sign-in link for the victim's account, and
  every anonymous call pages through all auth users. The matrix check stays in the function regardless.
- **J5 — the function's project comes from the request (D-04):** in line with 174's ruling. The matrix
  of the *named* project is then what authorises; the provider configuration stays per deployment, so a
  person identified for this deployment can register in any of its projects that opened the mode. The
  alternative keeps the environment binding as a second lock on this one function.
- **J6 — how a returning identity's own entity is found (D-05):** a per-project, per-type record in
  `app_metadata`, confirmed against a live grant. When the record exists and the grant is gone — an
  admin removed it — the function **creates nothing** and the user lands on `NothingToEdit`; otherwise
  removing a grant would be undone by identifying again.
- **J7 — the route names (Additional note 1, D-13):** `contestant/register/` with an identity-provider
  subroute holding the start (inside C) and CI2; CI1 as a gate view. Phase 178's plan settles the
  names; the reading of the note itself is the orchestrator's and awaits confirmation.
- Not for the operator, flagged for the planner: the eight-member code set (D-15); the arrival marker
  (D-13); the source of the organization fact (D-11); the legacy body kept for one plan (D-23); the
  additional todos (D-22); `redirectUri` built by the server rather than taken from the client (below).

### Claude's Discretion

- The cookie names for the type and the arrival marker, and the two added error-code spellings.
- The body and response shapes of `identity-callback`, within "a closed coarse code, never a message".
- Whether the email step is a form action, an API route or a writer method — new auth calls go through
  the data writer where one fits; existing route-level calls are not migrated.
- The message namespace for CI1 and CI2 (`assert:i18n-catalog-namespaces` is the tripwire).
- How the mock issuer's selector is addressed, and whether the direct-call spec survives as a spec or
  as scenarios.
- Whether the authorize endpoint stops accepting a client-supplied `redirectUri` and builds it from its
  own origin and the route constant — recommended while the endpoint is open, not required.
- Whether the Signicat verifier moves to an httpOnly cookie while its only writer
  (`redirectToIdentityProvider` in the deleted `preregister/+page.svelte`) is being rehomed — free if
  taken then; otherwise the todo of D-22.

</decisions>

<factual_baseline>
## Factual baseline (179-0, accepted under D-01)

Spot-checked on the tree at `a020545b9` where marked ✔; everything else is the discussion's reading at
`df0cec944` and is re-read by the planner.

1. **The write happens three screens after the callback.** ✔ `F/routes/api/oidc/callback/+server.ts`
   sets `COOKIE.idToken` and redirects to `ContestantAppPreregister`; the function is invoked from
   `F/routes/api/contestant/preregister/+server.ts`.
2. **The function creates candidates only.** ✔ `S/functions/identity-callback/candidateRecord.ts`
   (`createCandidate`, `findExistingCandidate` ending in `.maybeSingle()`), `entityGrant.ts`, `index.ts`
   (body: `id_token`, optional `project_id`).
3. **The candidate is written `confirmed: true`**, so its name is frozen for the user. ✔
4. **The auth user is created on a placeholder address** — ✔ `` `${identityMatchValue}@bank-auth.placeholder` ``
   with `email_confirm: true`; `identityMatchProp` is `'sub'` for both providers
   (`claimConfig.ts`). **Corrected (174):** the user carries a generated password hash.
5. **A returning identity is found by paging `auth.admin.listUsers`** and comparing
   `app_metadata.identity_match_value`; the sign-in link is generated for the placeholder, ✔ so it stops
   resolving once the address is proved. It must be generated for the found user's current address.
6. **The legacy route discards the email and the nominations**, and its success copy claims a mail
   that is never sent.
7. **The providers bind the round trip differently.** ✔ Idura: `state` and `nonce` in httpOnly cookies,
   `state` compared; Signicat: no `state`, a PKCE verifier in a cookie the browser writes. The nonce
   cookie is deleted and never compared ("a future enhancement").
8. **The authorize endpoint checks nothing about who may register.** ✔ It takes a client-supplied
   `redirectUri` and `codeChallenge`. **Corrected (171):** the legacy layout's gate is the matrix, not
   `preRegistration.enabled`.
9. **The function is publicly callable**, served without JWT verification and reachable with the anon
   key. ✔ (its own comment; `config.toml` carries no per-function JWT setting)
10. **Failures are not surfaced.** ✔ The callback redirects to the legacy page with `?error=`; the page
    never reads it.
11. **aud/iss are bound** (`requireVerifyClaimBinding`) ✔, and **every catch arm returns an opaque
    string** ✔ ("Logged, NEVER returned"). The "fourth verifier copy" is still true.
12. **The bank-auth projects are opt-in** ✔ (`PLAYWRIGHT_BANK_AUTH` in `tests/playwright.config.ts`), and
    `tests/scripts/e2e-run.sh` names nothing of the provider environment ✔. **Added (171):** they
    cannot share a run with each other or with the default suite.
13. **The mock issuer mints one identity and no failure** (`tests/tests/support/mockOidcIssuer.ts`).
14. **REG-14's inventory, today's names.** ✔ where a path is given. Routes
    `F/routes/contestant/preregister/**` (9 files: the page and its `+page.ts`, the layout pair,
    `status/`, and `(authenticated)/` with its layout, `elections`, `constituencies`, `email`);
    `F/routes/api/contestant/preregister/` (`+server.ts`, `preregisterUpstreamStatus.test.ts`);
    `F/routes/api/oidc/token/+server.ts`; the route constants `ContestantAppPreregister`,
    `…IdentityProviderCallback`, `…Election`, `…Constituency`, `…Email`, `…Status` in
    `F/lib/routes/route.ts`; the writer methods `preregisterWithIdToken`, `_preregister`,
    `exchangeCodeForIdToken`, `clearIdToken`; the context members `preregister`,
    `preregistrationElectionIds`, `preregistrationConstituencyIds`, `preregistrationNominations`,
    `isPreregistered`, `idTokenClaims`; `PreregisteredNotification` and its generated docs page;
    `preregistrationError.ts`; `COOKIE.idToken`; the preregister catalogue × 7 locales; the
    `preregister-*` test ids and `login-preregister`; the page fixture, the journey spec's legs and the
    a11y scan's route list; the docs pages `registration`, `pre-registration-and-invitation`,
    `bank-authentication` under `apps/docs/src/routes/(content)/developers-guide/contestant-app/`.
    `register/**` and `checkRegistrationKey` are Phase 178's.
15. **Auth configuration.** ✔ **Corrected (174):** `[auth] enable_signup = false`;
    `[auth.email] enable_confirmations = true`, `double_confirm_changes = true`; Edge runtime
    `policy = "per_worker"`. There is no change-email screen.
16. **`organizations.name` is nullable and `confirmed` defaults to false**; an unconfirmed entity's
    name is editable by its own user.
17. **The redirect after sign-in** is ✔ `` `${redirectSiteUrl}/contestant` `` — the app root.
18. **No milestone-close gate phase** follows this one.

### Pre-existing OIDC defects on record — which this phase takes on

| Defect | State on the tree | Disposition |
|---|---|---|
| Deno verifier is a weaker copy: error oracle | closed (Phase 155) ✔ | none; kept closed by D-15's coarse code |
| Deno verifier: birth-date account collision | refuted — keyed on `sub` ✔ | none; D-05 must not reintroduce matching on a claim other than `sub` |
| aud / iss fail open on unset env | fixed ✔ | todo closed with evidence (D-16) |
| No drift guard between the two verifiers | open | stays filed (D-16) |
| Nonce never verified | open, filed | stays filed, re-anchored (D-17) |
| `findUserByIdentityMatch` pages every auth user | open | todo filed (D-22); J4 removes the anonymous trigger |
| Signicat PKCE verifier in a non-httpOnly cookie | open | todo filed (D-22), or taken while rehomed (discretion) |
| Grant write and compensating delete both fail | open, filed | stays filed; the organization branch repeats the pattern (D-10) |
| Function publicly callable | open, by design until now | J4 |

### Cannot be defined yet — as later facts resolve it

- **The hand-off from selector C** (how C passes the type to authorize; what "Try again" returns to) —
  **still open:** Phase 178's selector and route names.
- **How the matrix is read** — **resolved (171):** `contestantAppConfig.ts` accessors in the frontend;
  a conformance-tested copy in the function (D-03).
- **How the layout knows a user is in their initial registration** — **resolved in principle** by
  address state (D-08, J2); depends on Phase 178's fact.
- **The API of the email-entry component** — **still open:** Phase 178's `EmailEntry`.
- **Where the user lands after CI1** — **resolved (172, 173):** G as the next gate view, then the app
  root's three-way decision.
- **Whether a registrant can claim a seeded entity** — **resolved:** no (X2 (a)); J3 makes it hold.
- **GoTrue's behaviour for a pending email change on an admin-created user** — **partly resolved
  (174):** the user-initiated change stays pending; the admin-issued link is RQ-1.

### Research items — measured on the local stack before planning

- **RQ-1 (blocking).** For an admin-created, confirmed user on a placeholder address: which API issues
  an email-change link without mailing the old address (the admin `generateLink` change types against
  `PUT /user` with `double_confirm_changes` either way); whether it sets the pending address; which
  verification type and landing complete it; whether `email` then becomes the new address with
  `email_confirmed_at` set and the session survives; what the mail catcher receives and in which
  locale; what a second request does to the first link; what a change to an address another account
  holds answers (D-07).
- **RQ-2.** That the type cookie returns with the provider's redirect for both providers (a top-level
  GET with `sameSite: 'lax'`, as `oidc_state` does), and how the type relates to `state` / `nonce` —
  it is bound to the flow by sharing the jar and the lifetime, not cryptographically; say so.
- **RQ-3.** A creation recipe for identity-provider users that leaves `encrypted_password` empty (174
  measured `invite` then `magiclink` for real addresses; unmeasured for a placeholder with admin
  confirmation), and what Phase 178's fact then reads.
- **RQ-4.** Whether the SvelteKit server can call the function with a credential the anon key cannot
  present (J4), and what the default local stack's function environment is under `per_worker`.

</factual_baseline>

<expected_tree>
## The tree this phase is planned against

**Executed and verified here:** routes `/contestant/<type>/<id>/…` (`CONTESTANT_ENTITY`); the app
root's three-way decision; `CONTESTANT_GATES` holding `termsOfUse` alone; `NothingToEdit`,
`contactSupport`, `LogoutButton`; one editor per candidate (`idx_grants_one_candidate_editor`);
acceptance per user and project in `terms_of_use_acceptances`, written by the user in gate G and never
by the function; the matrix accessors; the base dataset serving both types.

**Executing (174) — re-read its summaries:** `account-access` and its mail path; `claim_invitations`
wired into `api/auth/callback` and the login action; `invite-candidate` deleted; the auth
configuration of fact 15.

**Expected at planning time — the planner must re-read the phase's output:**

- **Phase 178:** `EmailEntry`; the mode selector C, already listing the identity-provider mode; the
  emailed sign-in path and REG-02's widened condition; gate F prepended to `CONTESTANT_GATES`; the
  "password set" fact; `register/` rebuilt, its legacy contents and `checkRegistrationKey` gone; the
  rebuilt login screen's test ids and axe scans.
- **Phase 175:** `updateEntityProperties` saving `name` and `short_name`; the name-editability rule;
  the multilingual name inputs.
- **Phase 176:** home and its task state, and the removal of
  the `candidateNoNomination` sign-out — **without which a freshly registered candidate is signed
  out**; confirm before planning. **176 builds no place for the pending-address reminder:** this
  phase adds it to the home screen 176 built (operator decision D11 (a), 2026-10-08).
- **Phase 177:** the nomination editor K; a self-registered organization is absent from its parent
  list until confirmed.

</expected_tree>

<cross_phase>
## Cross-phase Notes and Obligations

- **← 178 / → 178:** F's exemption and the honest "password set" fact (J2). If 178 reads the raw
  column, this phase changes the function or the fact.
- **← 174:** never confirm a typed address without a mail round trip (D-06); the claim's exclusion
  (J3) edits 174's function; the per-address mail throttle is reused; a hosted project's checklist
  gains a line only under RQ-1's fallback.
- **← 173:** the entity and grant are written before the link is issued (D-04); the protected loads
  read no URL (D-13); the gate facts are user-level (D-09, D-11).
- **← 172:** the function writes no acceptance; G follows CI1.
- **← 171:** the two dev-seed pins and the journey's login assertions move only if the base dataset's
  modes are widened (D-19).
- **→ the milestone audit:** the coverage script of D-21 is its evidence for E2E-01 and E2E-02.
- **Docs:** the three developer-guide pages are rewritten in the deletion plan.

</cross_phase>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### The phase's own contract
- `.planning/ROADMAP.md` § Phase 179 — goal, criteria, settled record, the `⚠ UNRESOLVED` marker.
- `.planning/REQUIREMENTS.md` — REG-04..REG-08, REG-14, REG-02, REG-11, E2E-01..03.
- `.planning/v2.16-DISCUSSION-POINTS.md` § Phase 179, § Cross-phase picture (X2), § Additional notes.
- `CAND-APP-PLAN.md` (repo root) — screens C, CI, CI1, CI2. **Read-only; never edit, move or stage.**

### Upstream phases
- `.planning/phases/174-invitations-grants-defined-in-advance/174-CONTEXT.md` (O-8), `174-RESEARCH.md`
  (the four-configuration measurement table; the link recipes; OQ-11), `174-01-PLAN.md` § Rulings and
  deviations for operator review, `174-bankauth.sh`.
- `.planning/phases/173-multi-entity-grants-entity-selection/173-13-SUMMARY.md` and
  `173-NAME-MAP.md` § Obligations to later phases (O-1, O-4, O-5, O-8, O-10) — the file is very large;
  read that section only.
- `.planning/phases/171-project-settings-served-entity-types-registration-mode-matri/171-04-SUMMARY.md`
  § What later phases must know, § How the opt-in bank-auth projects were run; `171-bankauth.sh`.
- Phase 175, 177 and 178 CONTEXT and SUMMARY files, once they exist.

### Code
- `apps/supabase/supabase/functions/identity-callback/` — `index.ts`, `candidateRecord.ts`,
  `entityGrant.ts`, `claimConfig.ts`, `verifyConfig.ts`, `flowConformance.test.ts`.
- `apps/frontend/src/routes/api/oidc/{authorize,callback,token}/+server.ts`;
  `apps/frontend/src/lib/api/utils/auth/providers/`; `apps/frontend/src/lib/cookies/index.ts`.
- `apps/frontend/src/lib/contestant/gates/` (`gates.ts`, `gateViews.ts`);
  `apps/frontend/src/routes/contestant/(protected)/+layout.server.ts`.
- `packages/app-shared/src/settings/contestantAppConfig.ts`.
- `apps/supabase/supabase/config.toml` (`[auth]`, `[auth.email]`, `[edge_runtime]`).
- `tests/playwright.config.ts`, `tests/scripts/e2e-run.sh`, `tests/tests/support/mockOidcIssuer.ts`,
  `tests/tests/specs/contestant/contestant-bank-auth{,-journey}.spec.ts`,
  `tests/tests/setup/contestant/bank-auth-journey.{setup,teardown}.ts`.

### Standing project rules
- `CLAUDE.md` — the cardinal E2E rule, the preflight, comment hygiene, the context destructuring rule.
- `.agents/code-review-checklist.md`.
- `.planning/todos/pending/` — the files named in D-16, D-17 and D-22.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `flowConformance.test.ts` — the pattern for holding a Deno copy equal to a frontend rule (D-03, D-09).
- `CONTESTANT_GATES` / `firstNeededGate` — the order lives in one array; a gate is one entry and one view.
- `NothingToEdit`, `contactSupport`, `LogoutButton` — CI2's support block and J6's landing.
- `scripts/assert-no-candidate-app-names.mjs` — the model for D-18's script.
- `171-bankauth.sh`, `174-bankauth.sh` — the provider environment the wrapper must provide itself.
- Phase 174's mail path and per-address throttle — the confirmation mail's carrier.

### Established Patterns
- Flow cookies are httpOnly, `sameSite: 'lax'`, 600 s, set by authorize, deleted by the callback, and
  pinned as an exact set in `cookies.test.ts`.
- The function logs the cause and returns an opaque value; it never returns a caught message.
- A dataset's settings object is the whole stored row; a list is replaced, not merged.
- `index.ts` holds a remote import and the Deno global, so vitest cannot import it: testable logic
  lives in parameter-taking sibling modules beside their own specs.

### Integration Points
- `identity-callback` ← the callback route (new caller), and nothing else after D-04.
- The user-level server load ← the gate facts and the arrival marker.
- C's identity-provider option → `POST /api/oidc/authorize` with the type.
- The confirmation link → the neutral `api/auth/callback`, shared with the Admin app; the claim wired
  there by Phase 174 runs on it, which is where J3 bites.

</code_context>

<specifics>
## Specific Ideas

- The operator's brief words CI1 as: "It seems you've already registered earlier. Please, use your
  email to login next time." and "Enter the email address you want to use when you want to login again.
  We'll send an email there." D-06 makes the second sentence true; D-09 keeps the first for a proved
  address only.
- The brief's "Only now save the user and candidate" on CI1 is superseded by the 2026-10-04 ruling:
  the write is at the callback.
- The confirmation mail says what opening the link does and tells a stranger to ignore it.
- CI2 never promises what cannot happen: a cancel is not an apology, a misconfiguration is not "try
  again".

</specifics>

<deferred>
## Deferred Ideas

- Claiming an invitation from an identity-provider account, and linking two accounts (X2, 179-B2 (c)).
- Nonce verification; a shared or drift-guarded verifier; a direct identity lookup; an httpOnly PKCE
  verifier — each a filed todo.
- A change-email screen for every user.
- Re-validating a removed grant's entity (J6 lands the user on `NothingToEdit`; an admin tool is later).
- Organization multi-locale name requirements beyond the default locale.

### Ambiguities and contradictions found while reconciling

1. **Discussion line 2598 against lines 2618 and 2642** — 179-B1 ★ "a user who never clicks is, for
   REG-05, a user without an email" against 179-B4 ★ "a user with a pending address passes" and 179-C3 ★
   "'with an address' includes a pending one". → D-09, J1.
2. **Line 2664 against line 2658** — 179-D3 ★ counts six codes; 179-D2 ★'s classes need eight once no
   provider string may pass through. → D-15.
3. **Line 2610 ("No password is set in the provider flow")** — refuted by Phase 174's measurement. →
   D-08, J2.
4. **Lines 132–135 (X2 (a)) against line 136 (X2 (b): "falls out of 174-D1 ★ for free once 179-B1 ★
   confirms the address")** — with both ★ sets as written, the (b) behaviour happens although (a) was
   chosen. → J3.
5. **Line 2651 ("a signed-in page of its own that the layout gates route to")** — the gates are views,
   not routes. → D-13.
6. **Line 2679 ("file a todo")** — filed two days before the document was written. → D-17.

</deferred>

---

*Phase: 179-identity-provider-registration-coverage-close*
*Context gathered: 2026-10-06*
