# Phase 179: Identity-Provider Registration & Coverage Close - Research

**Researched:** 2026-10-21
**Domain:** Supabase Auth (GoTrue v2.197.0) admin link issue and email-change verification; Deno Edge
Functions (`identity-callback`, `account-access`); SvelteKit server routes, gate views and cookies; the
declarative-schema / frozen-baseline migration model; Playwright default-suite wiring of an OIDC mock issuer
**Confidence:** MEDIUM overall. HIGH on the tree (every anchor below was read this session), MEDIUM on the
GoTrue behaviour (read from the auth service's source at the tag the stack runs, **not run**: the local stack
was down for the whole session and starting it was outside this session's permission), LOW where marked
`[ASSUMED]`.

**How to read the marks.** `[VERIFIED: path:lines]` = read this session, quoted beside the claim.
`[CITED: …]` = read from documentation or upstream source this session. `[MEASURED]` = a command run this
session, output quoted. `[ASSUMED]` = not verified; needs confirmation. Paths are relative to the repository
root unless they start with `F/` (`apps/frontend/src/`) or `S/` (`apps/supabase/supabase/`). GoTrue source is
`github.com/supabase/auth` at tag `v2.197.0`, cloned shallow into the session scratchpad and read there.

<user_constraints>
## User Constraints (from CONTEXT.md)

`179-CONTEXT.md` was written on 2026-10-06, before Phases 175, 177, 177.1 and 178 executed. Its decisions are
copied below verbatim; where the tree has moved since, this research says so in its own sections and never
edits the decision text. **J1–J7 are still ⚠ OPERATOR REVIEW**: no operator record after 2026-10-06 rules on
any of them (searched: `.planning/v2.16-OPERATOR-DECISIONS-2026-10-0{7,8,9}.md`, `-10-16.md`, `STATE.md`). The
approved `179-UI-SPEC.md` (2026-10-21) is written at each J's proposed option and at the ★ of each of its own
proposals U-01..U-24; none of those carries an operator tick either.

### Locked Decisions (verbatim, `179-CONTEXT.md` § `<decisions>`)

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

### Claude's Discretion (verbatim)

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

### Deferred Ideas (OUT OF SCOPE) (verbatim)

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
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description (`.planning/REQUIREMENTS.md`) | Research support |
|----|-------------------------------------------|------------------|
| REG-04 | Register with the identity provider; user and entity created together; CI1 takes the sign-in email, recorded pending, a confirmation link sent; no wait, no set-password step | § RQ-3 (passwordless creation recipe), § RQ-1 (the email-change recipe and its pitfalls), § Pattern 3 (address states), § Pattern 5 (the confirmation operation), Pitfalls 1–6 |
| REG-05 | Returning user told so; asked to sign in by email next time; never re-asked; a user with no email asked before home (⚠ UNRESOLVED marker → D-09 / J1) | § Pattern 3 (address states and the gate predicate), § Pattern 2 (the function's coarse result: `created` / `found`), § Pattern 4 (the arrival marker) |
| REG-06 | Type chosen in C before the provider when several types allow it; carried through | § RQ-2 (the type cookie returns), § Pattern 1 (the round trip), § Pattern 6 (the matrix copy in Deno against the 32-row truth table) |
| REG-07 | Organization's name and abbreviation on CI1, saved to the created organization, "editable until confirmed" | § Pattern 7 (the own-organization fact from `get_user_entities` + the J6 record; no schema edit needed), Pitfall 13 (answers lock, U-08) |
| REG-08 | CI2 with support block and Try again; honest retry text; cancel separate | § Pattern 2 (the function can tell `configuration` from `unavailable`), § Pattern 8 (the closed code set: recommend nine codes) |
| REG-14 | `preregister/` chain removed; one tree `register/` with the IdP flow inside | § Runtime State Inventory, § REG-14 inventory (the census and its traps), Pitfall 15 |
| E2E-01 | Each mode has a spec following the real email verify redirect | § Pattern 9 (mock issuer selector), `tests/tests/utils/mailedLink.ts` must learn `email_change` (Pitfall 9) |
| E2E-02 | Organization registration, entity selection with several grants, nomination definition covered | § Validation Architecture (the tag census: `@nomination-definition` exists on 17 tests; the other five tags exist nowhere yet) |
| E2E-03 | Full suite green at close | § D-19 mechanics (Pitfalls 10–12), § Validation Architecture |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- **E2E hard rule (cardinal):** no task proceeds or closes while any E2E test fails; no "known flaky"; a "did not
  run" is a failure; a run the wrapper marks VOID (exit 8, `VOID-host-suspend.txt`) is not evidence and is made
  again under a new `--run-dir`. Prefer full-suite runs through `tests/scripts/e2e-run.sh`.
- **E2E preflight** in global setup asserts the served app is this checkout and is scoped to the suite's project
  (`PUBLIC_PROJECT_ID`); there is no skip. `FRONTEND_PORT` (default 5273 in the wrapper) is the escape hatch.
- **Comment hygiene:** comments describe the code as it is; no history, no `.planning/` paths, no `D-NN`/plan
  ids (only bare `see phase N`), nothing addressed to the reviewer. Gated in part by `yarn assert:comment-hygiene`.
- **Context destructuring rule (Svelte 5):** never destructure a reactive accessor (`appSettings`, `answersLocked`,
  `user`, `selectedEntity`, `locale`, …); never alias `dataRoot` through `$derived`.
- **Results-navigation invariants:** no named View Transition while a modal is open; the `(located)` load reads
  no URL tracked. This phase adds no `view-transition-name` and no `<dialog>` (UI-SPEC § View Transitions).
- **Protected loads read no `url` property tracked** (173 O-4): each has a read-recording test
  (`F/routes/contestant/(protected)/layout.tracking.test.ts`). Cookies are not a tracked dependency, so the
  arrival marker read from a cookie keeps that test green.
- **`PUBLIC_PROJECT_ID` has no fallback**; the adapter throws when it is unset.
- **Localisation:** every user-facing string in all seven locales (`da en et fi fr lb sv`); a mail is a string.
- **WCAG 2.1 AA**, every new screen in the axe scans (light and dark twins).
- **TypeScript strictly; no `any`.** Exported symbols carry TSDoc.
- **Code review checklist** `.agents/code-review-checklist.md` applies.
- **Schema work** follows `Skill("database")` — see the hard constraint below; after a schema change
  `yarn db:types` and `yarn db:lint:sql` (needs a running stack).
- **Never commit `.env` files or keys.** Do not touch or stage the operator's untracked `CAND-APP-PLAN.md`.
- **Gates are read by exit status, never through a pipe** (`CLAUDE.md`, memory
  `project_verify_gate_exit_status_not_piped`).

## Summary

The phase is less a feature than a re-wiring of a security boundary. On the tree today the identity provider's
ID token rests in an `id_token` cookie between the OIDC callback and a legacy `preregister` API route, which
calls `identity-callback` with the anon key; the function creates a **confirmed** candidate and an auth user
on a placeholder address with a **generated password hash**, and finds a returning identity by paging every
auth user. Phase 179 moves creation to the callback, adds an organization branch and a server-enforced
matrix check, records a typed address as a *pending email change* that only a mailed link can complete, and
deletes the legacy chain. Every one of those touches GoTrue behaviour that the repository has never exercised
for placeholder users, and the one research item marked blocking (RQ-1) could not be run: **the local
`openvaa-local` stack was not running** (`docker ps` listed only an unrelated `next-supabase-skimle2` stack on
port 54331; `127.0.0.1:54321` did not answer) `[MEASURED]`, and starting it was outside this session's
permission. RQ-1 and RQ-3 are therefore answered from GoTrue's own source at the tag the stack runs, and the
answers are concrete enough to plan on, with a Wave-0 probe to confirm them before plan 3 builds the email step.

The source reading produced three findings that change the plan. **(1)** With the committed
`double_confirm_changes = true`, an admin `generateLink({ type: 'email_change_new' })` alone does **not**
complete: the first verification of the new-address token only records a "single confirmation" and changes
nothing; supabase-js then reports success with a null session, so the auth callback would silently land a user
on the app root with the address still pending. A three-call recipe (generate `email_change_current`, generate
`email_change_new`, verify the *current* token server-side, mail only the new link) completes on the user's
single click without mailing the placeholder and without touching `config.toml` — D-06's preferred mechanism
survives, but only in that shape. **(2)** The `hashed_token` that `generateLink` returns for `email_change_new`
is computed over the *current* address and is **not** the stored token; only the `token` inside `action_link`
verifies. **(3)** `admin.updateUserById(id, { email })` sets the address **without** clearing
`email_confirmed_at`, so for an already-confirmed placeholder user it makes a typed address read as confirmed
even without `email_confirm: true` — the conformance test D-06 implies must forbid any `email` key in an admin
update, not just `email_confirm: true`. RQ-3 has a clean answer: create through `generateLink({ type: 'invite' })`
(GoTrue stores `encrypted_password = ''`), set `app_metadata` with `updateUserById`, and sign in with a
`magiclink` — `account-access` already uses this recipe; `admin.createUser` without a password always generates
one (`admin.go:459-464`).

Two structural constraints outrank the feature work. **The schema model is mid-transition:** this branch's
guard is still in pre-freeze mode (one generated migration, `yarn schema:regenerate`), but the baseline was
frozen on the deployment branch at `12c98aa5c` with a manifest whose sha256 is exactly this tree's
`00001_initial_schema.sql`. Any regeneration of `00001` here would collide with that freeze on merge, so 179's
schema edits (J3's claim exclusion; a confirmation-mail slot RPC) must be **appended** migrations — which this
tree's guard rejects until the freeze commit is merged in. **D-19's default-on wiring** must make
`tests/scripts/e2e-run.sh` serve `identity-callback` with the mock issuer's environment, which on this CLI
means `supabase functions serve --env-file`, which replaces the edge-runtime container for every function and
needs a stack restart to undo — on a stack shared with the `-infra` worktree.

**Primary recommendation:** Before any 179 code, merge the deployment branch's freeze (`12c98aa5c` and its
followers) into this branch and run a Wave-0 probe plan that measures the email-change recipe, the
passwordless-creation recipe and the D-19 serve/restore cycle on the local stack; then follow D-23's six-plan
order with J4 moved to plan 2 and the J2 pieces (creation recipe + address-state gate predicate) landing
together.

## Architectural Responsibility Map

| Capability | Primary tier | Secondary tier | Rationale |
|------------|-------------|----------------|-----------|
| Verifying the ID token, matrix authority, creating user + entity + grant, finding the identity's own entity | Edge Function `identity-callback` (service role) | — | Only the function holds the service role; D-03 makes it the authority |
| Code exchange, `state`/PKCE binding, type cookie, mapping failures to a closed code, establishing the session cookie | SvelteKit server route `/api/oidc/callback` | `/api/oidc/authorize` (early refusal, type cookie) | The browser never holds the ID token (D-04); the server owns httpOnly cookies |
| Proving a typed address (email-change link issue + mail) | Edge Function (`account-access`, new authenticated operation) | SvelteKit form action on CI1 | `generateLink` needs the service role, which no frontend code reads (`.env.example:54-66`) |
| Completing the proof | GoTrue `/verify` via `F/routes/api/auth/callback/+server.ts` | — | The neutral callback already verifies every mailed link |
| Claim exclusion for IdP accounts (J3) | Database (`claim_invitations`) | — | The claim is the only trust point; a frontend guard is bypassable |
| Address state, arrival marker, own-unnamed-organization fact | SvelteKit server (`getBasicUserData` + protected layout load) | Database (`get_user_entities` already returns organizations with `name`) | Gates decide on user-level data only (`F/lib/contestant/gates/gates.ts` contract 2) |
| CI1, CI2, C's type choice, home reminder, settings pending section | Browser (Svelte gate view / pages) | SvelteKit server (form actions, page load for CI2's class) | Presentation; CI2's class decided in its own `+page.server.ts` |
| REG-14 removal check | Repo gate (`lint:check` script) | — | A recorded grep is true only on the day it was run (D-18) |
| Coverage proof (E2E-01/02) | Repo gate (tag census over `playwright test --list`) | — | D-21 |
| Mock identities and outcomes | Test harness (mock issuer, Playwright) | — | Test-only, loopback-only |

## HARD CONSTRAINT — how a schema change is made on this tree

**State of this branch (HEAD `978267b47`) `[VERIFIED: scripts/assert-schema-migration-parity.mjs:1-30, 690-720]`:
pre-freeze mode.**

- `S/schema/*.sql` (29 files) is the hand-edited source; `config.toml` has `schema_paths = []`
  (`S/config.toml:70`), so the CLI never reads it.
- `S/migrations/` holds exactly one file, `00001_initial_schema.sql`, which must be byte-identical to
  `cat S/schema/*.sql` in filename order. `yarn schema:regenerate` (`node scripts/assert-schema-migration-parity.mjs --write`)
  writes it; `yarn assert:schema-migration-parity` (a link of `yarn lint:check`) fails on a byte difference and
  on **a second `.sql` file** ("SECOND MIGRATION FILE … the invariant allows exactly one").
- The frozen-mode checker exists here only as a self-tested function over fixtures; no manifest exists on this
  tree (`ls S/migrations` → `00001_initial_schema.sql` only) `[MEASURED]`.

**State of the deployment branch `feat/deployment-terraform-supabase` (worktree `-infra`):** the baseline was
**frozen** by `12c98aa5c` ("feat[db]: freeze the baseline 00001_initial_schema.sql behind a manifest", parent
`81e6a3f22`). Its `S/migrations.manifest.json` reads `[VERIFIED: git show feat/deployment-terraform-supabase:apps/supabase/supabase/migrations.manifest.json]`:

```json
{ "baseline": { "name": "initial_schema", "file": "00001_initial_schema.sql",
    "commit": "81e6a3f225061563939b935e898b9a4965807d22" },
  "migrations": [ { "file": "00001_initial_schema.sql",
      "sha256": "79bed444da347985daf22d44bccb451c00db2d67236ccd11fa9c2c7fae354ed8" } ] }
```

and this tree's file hashes to the same value: `shasum -a 256 S/migrations/00001_initial_schema.sql` →
`79bed444da347985daf22d44bccb451c00db2d67236ccd11fa9c2c7fae354ed8` `[MEASURED]`. `git diff --stat HEAD
feat/deployment-terraform-supabase -- S/schema S/migrations` is empty; the deployment branch is 22 commits
ahead of the merge base `2a2a67aa4`, this branch 4 (all `.planning/`) `[MEASURED]`. The freeze is **not on this
branch** (`git merge-base --is-ancestor 12c98aa5c HEAD` → not an ancestor) `[MEASURED]`.

**The frozen model, as the deployment branch's guard states it** `[VERIFIED: git show feat/deployment-terraform-supabase:scripts/assert-schema-migration-parity.mjs, header and refuseWrite()]`:
"A schema change is one commit, in three steps: 1. Edit the file under `apps/supabase/supabase/schema/` that
holds the object. 2. Write the same change as a new migration, `apps/supabase/supabase/migrations/<next>_<name>.sql`
… (lower-case letters, digits and underscores). 3. Add its line, with its sha256 (`shasum -a 256 <file>`), to
the end of `migrations.manifest.json`. Then run `yarn check:schema-equivalence`." Versions are five digits,
counting up from `00001` with no gap; a listed migration's bytes may never change (`file-hash` rule → "EDITED
FROZEN MIGRATION"); `yarn schema:regenerate` refuses. `yarn check:schema-equivalence`
(`bash apps/supabase/scripts/check-schema-equivalence.sh`) builds one database from `schema/` and one from the
migrations on two isolated instances (`openvaa-iso-eq-m`, `openvaa-iso-eq-s`, ports 55400–55509), needs Docker,
takes about a minute, and is **not** in `lint:check` (181-17 evidence: "EQUAL … (62 s)"). The freeze-readiness
record also ran a comment search, `grep -n 'SQL editor' S/schema/*.sql` → no hit, which stays a review item.

**Constraint for the planner (binding):**

1. **Never regenerate or hand-edit `00001_initial_schema.sql` in this phase.** Its bytes are the frozen
   baseline's; a 179 change folded into it would make the merge with the deployment branch fail the
   `file-hash` rule.
2. **179's schema changes are appended migrations** (`00002_<name>.sql`, `00003_…`), each in one commit with the
   `schema/` edit and its manifest line, each followed by `yarn check:schema-equivalence`, `yarn db:reset`,
   `yarn db:types` on the freshly reset database, pgTAP and `yarn db:lint:sql`.
3. **That is only possible after the freeze commit is on this branch.** On this tree's pre-freeze guard, a
   second migration file fails `lint:check`. So the first plan that edits the schema must be preceded by the
   merge of `feat/deployment-terraform-supabase` (at least through `12c98aa5c` and `58cf7a564`, which rewrites
   the database skill and `apps/supabase/README.md` for the frozen model). This is a cross-session decision
   (deployment ROADMAP: "The single migration is frozen at a commit agreed with the v2.16 session") —
   **Open Question 1**, blocking for whichever plan carries the first schema edit.
4. The plan must state its mode check at run time: the presence of `S/migrations.manifest.json` decides which
   procedure applies; a plan that finds the manifest absent at its schema step stops and reports.
5. Schema edits this phase is likely to need (each an appended migration): **J3** (`claim_invitations` writes
   nothing for an `app_metadata.identity_provider` caller) and **a confirmation-mail slot RPC** for the address
   step (the per-address throttle is `private.invitation_throttle_take`, which no API role can execute;
   `S/schema/506-invitation-rpcs.sql:889-893`, key `'link:' || p_project_id::text || ':' || encode(sha256(convert_to(lower(btrim(v_candidate)), 'UTF8')), 'hex')`,
   max `1`, window `interval '60 seconds'`). D-11 needs **no** schema edit (Pattern 7). If the planner prefers
   a service-role SQL wrapper of `private.registration_mode_allowed` over D-03's Deno copy, that is a third —
   but D-03 locks the Deno copy.

**Phase 182 (analytics relay) touch points** `[VERIFIED: F/lib/analytics/pageviewRoutes.ts:1-5, 79-83]`:
`PAGEVIEW_ROUTES` must list every page route ("a unit test walks the route tree and fails until it is"). It
lists `[ROUTE.ContestantAppPreregister]`, `'/contestant/preregister/(authenticated)/constituencies'`,
`'/contestant/preregister/(authenticated)/elections'`, `'/contestant/preregister/(authenticated)/email'`,
`[ROUTE.ContestantAppPreregisterStatus]`, each `NO_PARAMS`. They leave in the commit that deletes the routes;
CI2's route joins with `NO_PARAMS` in the commit that adds it. G's `TrackingOptOut` (Phase 182) is untouched.

## Research Items — Answers

### RQ-1 (blocking): issuing and completing the email change for a placeholder user

**Not measured** — the stack was down. Everything below is read from GoTrue `v2.197.0` source; the tag is the
one 174 recorded for the running `supabase_auth_openvaa-local` container `[CITED: 174-RESEARCH.md:578, 620]`,
and the image `public.ecr.aws/supabase/gotrue:v2.197.0` is present locally `[MEASURED: docker images]`. The
committed auth configuration it runs under `[VERIFIED: S/config.toml:211, 253, 256, 264]`: `[auth] enable_signup = false`,
`[auth.email] double_confirm_changes = true`, `enable_confirmations = true`, `otp_expiry = 3600`; and the
no-op Send Email hook (`uri = "pg-functions://postgres/public/send_email_hook"`, `S/config.toml:321`).

**What `generateLink` does for the two email-change types** `[CITED: internal/api/mail.go, adminGenerateLink, case mail.EmailChangeCurrentVerification, mail.EmailChangeNewVerification]`:
- `email_change_current` is refused unless secure email change is on ("Enable secure email change to generate
  link for current email"); it is on here.
- Both validate `new_email`, then `models.IsDuplicatedEmail(...)` → **422 `email_exists`** when another account
  holds the address (as `email` or in an identity). A *pending* `email_change` of another account is **not**
  a duplicate, so two accounts may hold the same pending address (D-07's premise holds).
- Both set `user.EmailChange = params.NewEmail`, `EmailChangeSentAt = now`, **`EmailChangeConfirmStatus = zeroConfirmation`**,
  then `EmailChangeTokenCurrent = hashedToken` (current) or `EmailChangeTokenNew = crypto.GenerateTokenHash(params.NewEmail, otp)` (new);
  the `UpdateOnly` writes both token columns, so a token set by an earlier call survives the later one; each
  non-empty token gets a one-time-token row (`CreateOneTimeToken` first clears that type's row for the user).
- **`generateLink` sends no mail** — no mailer send call in `adminGenerateLink`; the hook is never reached.
- The response's `hashed_token` is `crypto.GenerateTokenHash(params.Email, otp)` — over the **current** address —
  so for `email_change_new` it is **not** the stored token. The `action_link` carries the stored one:
  `GetEmailActionLink` uses `user.EmailChangeTokenNew` for `email_change_new` and `type=email_change` in the
  link `[CITED: internal/mailer/templatemailer/templatemailer.go:374-430]`.

**What verification does** `[CITED: internal/api/verify.go:229-300 (verifyPost), 546-640 (emailChangeVerify), 641-700 (verifyTokenHash)]`:
- `token_hash` + `type=email_change` finds the user by either token (`FindUserByOneTimeToken(..., EmailChangeTokenCurrent, EmailChangeTokenNew)`);
  expiry is `email_change_sent_at` + `otp_expiry`.
- When `!Autoconfirm && SecureEmailChangeEnabled && EmailChangeConfirmStatus == zeroConfirmation && email != ""`
  (all true here — the placeholder is a non-empty address), the call **only** sets the status to single
  confirmation, clears the token it matched, and returns `nil, nil`; `verifyPost` then answers **200
  `{"msg":"Confirmation link accepted. Please proceed to confirm link sent to the other email","code":"200"}`
  with no session**. Nothing about the address changes.
- Otherwise (status already single) it updates the email identity, then `ConfirmEmailChange`: `email =
  email_change`, both tokens and `email_change` cleared, all one-time tokens of the user cleared, and
  `Confirm()` only if not yet confirmed (`internal/models/user.go:564-600`) — so **`email_confirmed_at` keeps
  the placeholder's timestamp**. A session is issued (`issueRefreshToken`).
- `ConfirmEmailChange` writes `users.email`, which has the partial unique index `users_email_partial_key`
  `(email) where (is_sso_user = false)` `[CITED: migrations/20221215195500_modify_users_email_unique_index.up.sql:21]`.
  No duplicate check precedes it in `emailChangeVerify`, so the **second** of two accounts pending the same
  address fails on that index and the handler returns **500 "Error confirm email"** — not a distinguishable
  code `[CITED: verify.go:623-625]`.

**The answer to RQ-1 — recipe that keeps D-06's preferred mechanism** (to be confirmed by probe rows P1–P6):

1. As the service role: `generateLink({ type: 'email_change_current', email: <placeholder>, newEmail: <typed> })`
   → keep `properties.hashed_token` (= the stored current token) or the `token` of its `action_link`.
2. `generateLink({ type: 'email_change_new', email: <placeholder>, newEmail: <typed> })` → keep the **`token`
   parameter of `properties.action_link`** (never `hashed_token`). Status is now zero, both tokens stored.
3. `POST /auth/v1/verify { type: 'email_change', token_hash: <current token> }` from the function (anon key,
   no session): answers the single-confirmation 200, issues no session, clears the current token. The
   placeholder is never mailed.
4. Mail `<SITE_URL>/<locale>/api/auth/callback?token_hash=<new token>&type=email_change` through
   `account-access`'s transport and a third template.
5. The user's click: `F/routes/api/auth/callback/+server.ts` verifies `type=email_change` (not in
   `REFUSED_TYPES`, `const REFUSED_TYPES: ReadonlySet<string> = new Set(['invite', 'signup', 'email']);`
   `[VERIFIED: F/routes/api/auth/callback/+server.ts:12]`), gets a session for the account, runs
   `claimAndRefresh`, and its default arm redirects to `ContestantAppHome` — which is U-15 (a)'s landing.

Consequences: **a resend must repeat all three calls** (a lone `email_change_new` after the current token was
consumed resets the status to zero and the next click again only "single-confirms"); each resend invalidates
the previous new-address link (its one-time token is replaced), which matches the mail's "only the newest link
works"; and the link lives `otp_expiry` = 3600 s from the last request.

**Fallback (D-06's), if P1 refutes the recipe:** `double_confirm_changes = false` + stack restart. Then step 2
alone completes on one click. Cost beyond D-06's list: `scripts/assert-hosted-settings-parity.mjs` classifies
every `[auth.email]` key against `infra/modules/supabase/hosted-settings.json` (deployment workstream), so the
change also edits that file on the other workstream's ground.

**What the mail catcher receives:** nothing from GoTrue (no mail on `generateLink`; the hook is a no-op);
exactly one mail from `account-access`, in the locale the request names, resolved against
`SIGN_IN_MAIL_LOCALES = ['da', 'en', 'et', 'fi', 'fr', 'lb', 'sv']` `[VERIFIED: S/functions/account-access/mailTemplates.ts:10]`.

**Address held by another account (D-07):** at issue time, step 1 or 2 answers 422 `email_exists` → the
operation answers its "in use" result. At click time (the race of two pending accounts), the second click gets
a 500 from `/verify` that the callback cannot tell from any other failure. U-16 (a)'s distinct landing
therefore needs the app to ask, after a failed `email_change` verification, whether the current session's own
pending address is now another account's — see Open Question 6; without it U-16 degrades to (b).

**Does the session survive?** The email change itself revokes nothing in the code read (`ConfirmEmailChange`
touches no session) `[CITED: models/user.go:564-610]`; whether existing refresh tokens survive is
`[ASSUMED]` true — probe row P7.

### RQ-2: the type cookie returns with the provider's redirect, for both providers

- The cookie is set by the server on `POST /api/oidc/authorize`, which C calls with a same-origin `fetch`; the
  response's `Set-Cookie` lands in the browser's jar. The existing `oidc_state` / `oidc_nonce` cookies use
  exactly the attributes D-02 names: `httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 600`
  `[VERIFIED: F/routes/api/oidc/authorize/+server.ts:28-43]`.
- Both providers return by a **top-level GET** to `/api/oidc/callback` with the code in the query: Idura's
  request sets `response_mode: 'query'` (`F/lib/api/utils/auth/providers/idura.ts:84`), and Signicat's
  authorize URL names no `response_mode`, so the code flow's default query mode applies
  (`signicat.ts`, `getAuthorizeUrl`) `[VERIFIED]`. `SameSite=Lax` cookies accompany top-level GET navigations
  across sites, which is why `oidc_state` (Idura) and `oidc_code_verifier` (Signicat) already work
  `[CITED: RFC 6265bis / browser behaviour; ASSUMED for Signicat in practice — the bank-auth journey proves only Idura, through the mock]`.
- `secure: true` on a cookie for `http://127.0.0.1:5273` / `http://localhost`: browsers treat loopback as a
  potentially trustworthy origin, so the existing flow cookies are set in E2E today (journey green at 178-24)
  `[CITED: 178-24-SUMMARY.md § Task 3]`.
- **Binding:** the type is bound to the flow only by sharing the jar and the 600 s lifetime with `oidc_state`;
  nothing cryptographic ties it to the code. That is acceptable precisely because D-03 makes the function
  authoritative — the cookie only *selects*, it never *authorises*. Say so in the threat register.
- **What cannot be measured here:** the Signicat leg. The mock issuer implements Idura's JAR flow only
  (`tests/tests/support/mockOidcIssuer.ts:10-13` — authorize decodes the JAR's `state` and `redirect_uri`).
  Signicat remains `[ASSUMED]` by the same cookie mechanics as `oidc_code_verifier`.

### RQ-3: an identity-provider user without a password hash

- `admin.createUser` **always** stores a hash: `if (params.Password == nil || *params.Password == "") && params.PasswordHash == "" { password, err := password.Generate(64, 10, 0, false, true) … params.Password = &password }`
  `[CITED: internal/api/admin.go:459-464]`. This is why 174 measured `password_set = true` for these users.
- `generateLink({ type: 'invite', email })` for a new address creates the user through `signupNewUser` with no
  password; `models.NewUser` leaves `passwordHash := ""` when the password is empty
  `[CITED: internal/api/mail.go case mail.InviteVerification; internal/models/user.go:110-135]`. An existing
  **confirmed** user gets 422 `email_exists`; an existing unconfirmed one is reused.
- `generateLink({ type: 'magiclink' })` for an **existing** user takes the recovery branch and creates nothing;
  verifying it confirms an unconfirmed user and sets no password (`recoverVerify`, `verify.go:378-385`). For a
  **non-existing** address it creates a user **with a generated password** (`params.Password, err = password.Generate(64, 10, 1, false, true)`)
  `[CITED: mail.go, case mail.MagicLinkVerification]` — see Pitfall 4.
- `account-access` already uses invite-then-magiclink for its own users: `generateLink({ type: 'invite', email: recipient })`
  then `generateLink({ type: 'magiclink', email: recipient })` `[VERIFIED: S/functions/account-access/index.ts:152-163]`.
- `private.user_password_set` reads `NULLIF(u.encrypted_password, '') IS NOT NULL` `[VERIFIED: S/schema/301-auth-functions.sql:837]`,
  so an empty string reads **false**.

**Recipe for the function (new identity):** `generateLink({ type: 'invite', email: <placeholder>, data: { given_name, family_name } })`
→ `admin.updateUserById(id, { app_metadata: { identity_provider, identity_match_prop, identity_match_value, …claims, registered_entities }, email_confirm: true })`
(the placeholder only — D-06 permits confirming the placeholder) → entity + grant → `generateLink({ type: 'magiclink', email: <the user's CURRENT address> })`
→ return the `token` of its `action_link`. Idempotent on a retry: a half-created user is unconfirmed, so the
next `invite` reuses it.

**What Phase 178's fact then reads:** `passwordSet: false` for every new IdP user, through
`get_user_entities.password_set` → `parseCallerPasswordSet` (`F/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts:544-548`).
Today's F predicate is `isNeeded: (user: BasicUserData) => user.passwordSet === false`
`[VERIFIED: F/lib/contestant/gates/gates.ts:42]`, so **F would appear on CI1's arrival** unless the predicate
gains the address-state term in the same commit (D-08 (ii), J2) — Pitfall 3. 178's H2 (a) explicitly left this
to 179 ("F rests on the stored password … Whether they should be is left to Phase 179";
`.planning/v2.16-OPERATOR-DECISIONS-2026-10-09.md`, H2).

### RQ-4: a credential the anon key cannot present; the default local function environment

- **No server-side credential exists today.** "Nothing under `apps/frontend/src` reads [the service-role
  key]; only local tooling and the test harness do" `[VERIFIED: .env.example:54-66]`; a search of
  `F/` outside tests found no reader `[MEASURED]`. The function is served `verify_jwt = false`
  (`S/config.toml:428-432`), and the deployment workstream's closing check requires it to behave the same
  hosted (`.planning/workstreams/deployment/ROADMAP.md`, operator request 2026-10-20).
- **Recommended mechanism `[ASSUMED design]`:** a dedicated shared secret, e.g. `IDENTITY_CALLBACK_SERVER_SECRET`,
  read by the frontend server from `$env/dynamic/private` and by the function through `requireEnv` (so an
  unset value refuses, never opens), sent as a request header and compared in constant time. Not the
  service-role key: handing that to the frontend server breaks a stated rule for one call. The cost to plan:
  `.env.example` (root) and `S/functions/.env.example` gain it; `scripts/assert-edge-function-env.mjs` picks
  it up automatically because it derives the required set from `requireEnv` calls; the env-pair registry is
  not involved (not a `PUBLIC_` twin); the hosted function secrets gain a line for the operator's checklist
  (the deployment workstream's Terraform does not manage function secrets on either branch — no
  `identity-callback` reference under `infra/` `[MEASURED: git grep on feat/deployment-terraform-supabase]`).
- **J4 must not land before the caller moves:** the legacy caller invokes with `locals.supabase` (anon) —
  `F/routes/api/contestant/preregister/+server.ts:15` — and so does the `bank-auth` spec's direct POST.
  J4 rides plan 2 with the new callback, not plan 1 (Pitfall 8).
- **Default local function environment:** the edge runtime reads `S/functions/.env` (untracked; not opened
  this session), not the root `.env` (`S/functions/.env.example` header). `[edge_runtime.secrets]` with
  `env(...)` delivers a value only when it is exported into the starting shell (todo
  `2026-08-28-edge-runtime-secrets-local-wiring.md`). The operator's restored container carried
  `IDENTITY_PROVIDER_ISSUER` = `https://openvaa.test.idura.broker` — a real Idura test tenant, not the mock
  `[CITED: 178-24-SUMMARY.md § Task 3, "the restored container's issuer"]`. **So the default local stack's
  `identity-callback` does not trust the mock issuer**, and the suite cannot rely on it (D-19 mechanics below).
- **`per_worker`:** `policy = "per_worker"` `[VERIFIED: S/config.toml:417]`; a worker keeps no module state
  between requests that the code may rely on, and a function edit is trusted only after the runtime is
  restarted (D-04; 178's drivers restart via `yarn db:stop` / `yarn db:start`).

### Can `identity-callback` report "created" vs "found", and "outage" vs "configuration"?

**Yes to both, with small changes** `[VERIFIED: S/functions/identity-callback/index.ts]`:
- created/found: the function already distinguishes them — `isNewUser` (`:266, :295`) and the
  `existingCandidate` branch (`:299-314`) — and returns `is_new_user`. A coarse `result: 'created' | 'found'`
  is a rename.
- configuration: every unset variable throws `ERR_ENV_UNCONFIGURED` from `requireEnv`
  (`envConfig.ts:23-33`), an unset audience/issuer throws `ERR_AUDIENCE_UNCONFIGURED` / `ERR_ISSUER_UNCONFIGURED`
  (`verifyConfig.ts:27-43`), and an unknown provider type already has its own 500 arm (`index.ts:157-165`).
  Today all but the last collapse into the catch-all `{ error: 'Internal server error' }` (`:390-397`); the
  catch can classify by `code` before answering.
- outage: admin API failures throw plain errors ("Failed to list users", "Failed to create auth user", the
  `ERR_CANDIDATE_*` / `ERR_GRANT_WRITE_FAILED` codes) → `unavailable`.
- token: decryption failure and `jwtVerify` failure already answer 401 (`:208-239`) → `invalid_token`. A
  decryption failure caused by a wrong key set is also configuration, but both land in the *will not work on
  retry* class, so the distinction does not matter for CI2.

So D-15's eight codes are one short: recommend a **ninth**, e.g. `configuration_error` → `noRetry`, beside
`registration_failed` → `retry` (the UI-SPEC's ⚠ row allows either).

### UI-SPEC "What reading could not establish" N-1..N-9

| # | Disposition |
|---|-------------|
| N-1 | Answered from source (RQ-1 above); **the landing is the callback's default arm only for the three-call recipe**; the address-taken landing is a 500 the callback cannot classify (Open Question 6). Probe rows P1–P6. |
| N-2 | Answered: yes, by the invite recipe (RQ-3). U-14's rewording is then needed (a proved IdP user meets F). |
| N-3 | Answered for Idura by mechanism and the green journey; Signicat `[ASSUMED]` (RQ-2). |
| N-4 | Answered: yes for created/found and configuration/outage (above). |
| N-5 | Not established. Back-forward cache restoration after a cross-origin navigation is browser behaviour; plan a `pageshow` handler (`event.persisted`) and assert it only in a unit test of the handler. `[ASSUMED]` |
| N-6 | `Input`'s per-locale control ids were not traced this session. Keep U-09 (a): focus the first control inside the name field's container. |
| N-7 | `apps/docs` still describes the legacy flow (`developers-guide/contestant-app/pre-registration-and-invitation/+page.md`, `bank-authentication/+page.md`) — rewritten by D-18/D-22 anyway; no administrator "list" procedure was found in the code paths read. |
| N-8 | Constructed at execution; native-review todo. |
| N-9 | Not measurable without a run. Mitigation in Pattern 9: identities are minted per test by cookie, cost is one OIDC round trip (~1–2 s locally) per identity `[ASSUMED]`. |

## Standard Stack

No new external package. Everything below is already in the tree.

### Core

| Library / service | Version (tree) | Purpose | Note |
|-------------------|----------------|---------|------|
| GoTrue (Supabase Auth) | `v2.197.0` image, CLI `2.118.0` | `generateLink`, `/verify`, admin user API | `supabase --version` → `2.118.0` `[MEASURED]`; tag `[CITED: 174-RESEARCH.md:620]` |
| `npm:@supabase/supabase-js` (Deno) | `2.117.2` | function's admin client | `S/functions/identity-callback/index.ts:27` `[VERIFIED]` |
| `npm:jose` (Deno) | `6.2.12` | JWE decrypt, JWT verify | `index.ts:28` `[VERIFIED]` |
| `npm:nodemailer` (Deno) | `10.0.11` | `account-access` SMTP transport | `S/functions/account-access/index.ts:21` `[VERIFIED]` |
| `@supabase/supabase-js` / `@supabase/ssr` (frontend) | catalog `^2.117.2` / `^0.12.7` | server client, `verifyOtp`, `functions.invoke` | `.yarnrc.yml:47-49` `[VERIFIED]` |
| Playwright | `1.63.0` | E2E | `npx playwright --version` `[MEASURED]` |
| Node | `v24.21.0` | runtime | `[MEASURED]` |

### Alternatives considered

| Instead of | Could use | Tradeoff |
|------------|-----------|----------|
| Three-call email-change recipe | `double_confirm_changes = false` | One call, but a `config.toml` change, a restart of every developer stack, a hosted checklist line and a `hosted-settings.json` edit on the deployment workstream's ground |
| Shared-secret header (J4) | Service-role key in the frontend server | No new variable, but breaks the stated rule that no frontend code reads it |
| `generateLink invite` creation | `createUser` + a server-written "password chosen" marker | Keeps `createUser`, but a new SQL write path and a fact that 178's gate does not read (178 H2 (b) was "not a located change") |

## Package Legitimacy Audit

No external package is installed by this phase. **Packages removed due to [SLOP]:** none. **Flagged [SUS]:** none.

## Architecture Patterns

### System architecture diagram

```
 Browser (C: register/)                       SvelteKit server                         Supabase
 ─────────────────────                        ────────────────                         ────────
 choose mode=identity_provider
 (+ type if several allowed)  ──POST /api/oidc/authorize {entityType, codeChallenge?}──▶ matrix check (frontend copy)
                                                │ refuse → {error} → C navigates to CI2 (mode_not_allowed)
                                                │ ok → Set-Cookie oidc_state, oidc_nonce, <type cookie> (httpOnly, lax, 600 s)
                              ◀── {authorizeUrl} ┘
 window.location = provider ──────────▶ Identity provider (Idura JAR / Signicat PKCE; mock in E2E)
                               ◀── 302 /api/oidc/callback?code&state   or   ?error=access_denied
 GET /api/oidc/callback ─────────────────▶ state/PKCE binding ─fail─▶ clear flow cookies ─▶ 303 CI2?error=<closed code>
                                          exchange code → ID token, verify claims
                                          read+delete type cookie; re-check matrix
                                          invoke identity-callback {id_token, project_id, entity_type}
                                            + server secret header (J4) ───────────────▶ identity-callback (service role)
                                                                                         ├ verify token (aud/iss bound)
                                                                                         ├ matrix of the named project (Deno copy)
                                                                                         ├ find user by sub; new → invite recipe
                                                                                         ├ own entity via app_metadata record + live grant
                                                                                         ├ create entity + grant (org: unconfirmed, no name)
                                                                                         ├ magiclink for the user's CURRENT address
                                          ◀── {result: created|found|no_entity|mode_not_allowed|invalid_token|configuration|unavailable, token}
                                          verifyOtp(magiclink) → session cookies
                                          Set-Cookie <arrival marker> (created|existing)
                              ◀── 303 /contestant (app root) ─┘
 protected layout load: session → getBasicUserData (addressState, pendingEmail, marker, ownUnnamedOrg, passwordSet)
   → firstNeededGate: setPassword (only when proved) → identityProvider (CI1) → termsOfUse (G) → app root decision (H/home)
 CI1 Continue (form action) ──▶ updateEntityProperties(name, short_name) for the own org
                            ──▶ functions.invoke('account-access', {operation: confirm-address, project_id, email, locale}) with user JWT
                                                                                    ─▶ account-access: verify caller JWT; IdP account? placeholder domain refused;
                                                                                       per-caller + per-address slot (RPC); generateLink current+new; verify current;
                                                                                       mail new link (7 locales) ─────▶ Mailpit / SMTP
                            ◀── {result: sent|in_use|refused} ; clear marker; invalidateAll → G → home
 Mailbox: click link ──▶ GET /<locale>/api/auth/callback?token_hash&type=email_change ─▶ verifyOtp(email_change) → email := typed
                                          claimAndRefresh (J3: claims nothing for an IdP account) → 303 app root
```

### Recommended file touch map (component responsibilities)

| Concern | Files |
|---------|-------|
| Function: contract, matrix copy, org branch, own-entity record, coarse result, J4, J5 | `S/functions/identity-callback/index.ts`; new pure modules beside it (e.g. `requestContract.ts`, `registrationMatrix.ts`, `organizationRecord.ts`, `ownEntity.ts`, `result.ts`); `candidateRecord.ts` (lookup rewritten); `flowConformance.test.ts` (new assertions); `envReadSites.test.ts` |
| Address step | `S/functions/account-access/{contract,index,linkIssue,signInLink,mailTemplates}.ts` (+ tests); `LINK_TYPES` gains `email_change` |
| Schema | appended migrations for J3 and the slot RPC; `S/schema/506-invitation-rpcs.sql`; pgTAP `39-invitations.test.sql` (J3 case) and a new file for the slot RPC |
| OIDC routes | `F/routes/api/oidc/authorize/+server.ts`, `F/routes/api/oidc/callback/+server.ts`; `F/lib/contestant/utils/oidcError.ts`; `F/lib/cookies/index.ts` + `cookies.test.ts` |
| Gate CI1 | `F/lib/contestant/gates/{gates.ts,gateViews.ts,IdentityProviderGate.svelte}`; `F/lib/api/base/dataWriter.type.ts` (`BasicUserData`); `supabaseDataWriter.ts` (`_getBasicUserData`); `F/routes/contestant/(protected)/+layout.server.ts` (+ tests incl. `layout.tracking.test.ts`) |
| CI2 | `F/routes/contestant/register/identity-provider/error/{+page.server.ts,+page.svelte}`; `F/lib/routes/route.ts`; `F/lib/routes/appGates.ts` (`entryRoutes`) + test; `PAGEVIEW_ROUTES` |
| C | `F/routes/contestant/register/+page.svelte`, `F/lib/contestant/utils/registrationOffer.ts` |
| REG-14 | the inventory below; new `scripts/assert-no-preregister.mjs` (name the planner's) in `lint:check` |
| Harness | `tests/scripts/e2e-run.sh`, `tests/playwright.config.ts`, `tests/tests/support/mockOidcIssuer.ts`, `tests/tests/utils/mailedLink.ts`, specs, fixtures, `testIds.ts`, `scripts/assert-a11y-scan-wiring.mjs` (check 4a list), `.github/workflows/main.yaml` (E2E job) |

### Pattern 1: the round trip with a type cookie

**What:** `POST /api/oidc/authorize` accepts `{ entityType, codeChallenge? }`, builds `redirectUri` from its own
origin and the route constant (discretion; recommended), refuses a type the matrix forbids (JSON error → C
navigates to CI2 with `mode_not_allowed`), and sets the type cookie with the flow cookies' attributes. The
callback reads and deletes it, re-checks, and passes it on. `clearFlowCookies` deletes it on every failure path.

The cookie map today `[VERIFIED: F/lib/cookies/index.ts:14-19]`:

```ts
export const COOKIE = deepFreeze({
  idToken: 'id_token',
  oidcState: 'oidc_state',
  oidcNonce: 'oidc_nonce',
  oidcCodeVerifier: 'oidc_code_verifier'
} as const);
```

After this phase: `idToken` removed; two added (spellings are the planner's, e.g. `oidcEntityType` and
`identityProviderArrival` `[ASSUMED names]`). `cookies.test.ts` pins the exact set; `yarn assert:cookie-names`
forbids literal names at operation sites.

### Pattern 2: the function's request and result contract

**Request** (J5 — project from the request, as `account-access` does; `contract.ts:66` holds the uuid pattern
`const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;` `[VERIFIED]`):
`{ id_token: string, project_id: uuid, entity_type?: 'candidate' | 'organization' }` + the server-secret header.
**Result:** one closed coarse code and, on success, the sign-in token; never a caught message. Recommended set
`[ASSUMED spellings]`: `created`, `found`, `no_entity` (J6: record present, grant gone → nothing created),
`mode_not_allowed`, `invalid_token`, `configuration`, `unavailable`. Keep the "Logged, NEVER returned" rule and
the field-only logging of `jwtVerify` failures (`index.ts:226-234`).

**Plan-1 compatibility (D-23):** while the legacy route is the only caller, an absent `entity_type` means "the
single served type that allows `identity_provider`", an absent `project_id` keeps today's environment value,
and the legacy response fields (`session.action_link`) stay until plan 2.

`assert-project-scoped-queries.mjs` holds the function's written disposition
`'identity-callback': 'scoped-by-deployment: PUBLIC_PROJECT_ID'` `[VERIFIED: scripts/assert-project-scoped-queries.mjs:285]`;
under J5 it becomes `'requires a project term'`, and check 7 then requires a `projectId`/`project_id` key in the
invocation's argument text. `S/functions/.env.example` stops listing `PUBLIC_PROJECT_ID` for this function only
if no function still reads it (`account-access` reads none; `send-email` — check before editing).

### Pattern 3: the address state, server-side

Derived in `_getBasicUserData` from the **verified** `getUser()` result (already the first call there,
`supabaseDataWriter.ts:502-506`), never from the session object (`yarn assert:no-session-in-loads`):

```ts
// Derived from the verified user; the placeholder domain is one constant held equal to the function's.
const isProviderAccount = typeof user.app_metadata?.identity_provider === 'string';
const onPlaceholder = (user.email ?? '').endsWith(`@${PLACEHOLDER_EMAIL_DOMAIN}`);
const addressState: AddressState = !isProviderAccount || !onPlaceholder ? 'proved' : user.new_email ? 'pending' : 'none';
// `email` and `username` carry no placeholder; `pendingEmail` only in state 'pending'.
```

`new_email` is GoTrue's JSON name for the pending change: `EmailChange string \`json:"new_email,omitempty" db:"email_change"\``
`[CITED: internal/models/user.go:51]`. The placeholder is built today as
`` const placeholderEmail = `${identityMatchValue}@bank-auth.placeholder`; `` `[VERIFIED: S/functions/identity-callback/index.ts:271]`;
the domain becomes one constant in each runtime held equal by a conformance test (D-09).

Gate list after the phase (ids today: `export type ContestantGateId = 'setPassword' | 'termsOfUse';`
`[VERIFIED: F/lib/contestant/gates/gates.ts:18]`):

```ts
// setPassword: exactly false AND the address is proved (J2, D-08 (ii)).
isNeeded: (user) => user.passwordSet === false && user.addressState === 'proved'
// identityProvider (CI1), between setPassword and termsOfUse:
isNeeded: (user) =>
  user.addressState === 'none' ||
  user.ownOrganizationUnnamed === true /* false while answers are locked, U-08 (a) */ ||
  (user.identityProviderArrival === 'existing' && user.addressState !== 'none')
```

The last disjunct is the one-time notice (V4/V5); the marker only ever adds CI1 (D-13).

### Pattern 4: the arrival marker

A short-lived httpOnly cookie set by the callback (`created` or `existing`), read by the protected layout's
server load through `cookies.get` (not a tracked dependency, so `layout.tracking.test.ts` stays green), cleared
by CI1's Continue (a form action that deletes it and the client calls `invalidateAll()`). It never removes a
gate: a forged `created` only shows the 👍 hero.

### Pattern 5: the address-confirmation operation

A new operation of `account-access` (it already owns the transport, templates, link builder, the redirect
admission check and `describeFailure` logging), **authenticated by the caller's JWT** (unlike its anonymous
operations): `admin.auth.getUser(jwt)`; refuse unless `app_metadata.identity_provider` is set and the account's
`email` is on the placeholder domain; refuse a typed address on the placeholder domain; take a **per-caller**
and a **per-address** slot through a new service-role RPC (the per-address slot shares the link slot's key so a
sign-in, recovery and confirmation mail to one address are limited together); then the three-call recipe
(RQ-1); then mail. Answers: `sent`, `in_use` (the 422 `email_exists`), `refused` (anything else — the UI's
failed-save sentence). This operation is the one place an answer depends on whether an address exists (D-07);
its docblock and the contract test must say so, because the module's own header says no answer does
(`contract.ts:6`).

`buildSignInLink` accepts only `export const LINK_TYPES = ['magiclink', 'recovery'] as const;`
`[VERIFIED: S/functions/account-access/signInLink.ts:16]`; it gains `email_change`.

### Pattern 6: the matrix copy in Deno, held to the 32-row truth table

The SQL rule `private.registration_mode_allowed_in` `[VERIFIED: S/schema/301-auth-functions.sql:890-911]`
serves `candidate` alone when the stored entity-type list is unusable, requires an object matrix and an array
row, and is held equal to the TypeScript accessor by `S/tests/database/45-registration-mode-matrix.test.sql`
(32 `MATRIX` rows, "THE FORM IS FIXED") read as text by `packages/dev-seed/tests/registrationModeMatrixParity.test.ts`.
The Deno copy (D-03) is asserted against **the same 32 rows** by a vitest in the function's directory — a third
reader of one table, not a second table. The function reads the stored `app_settings.settings` of the named
project with its service-role client; a failed or empty read refuses (D-03: never a default).

### Pattern 7: the own organization and its name (no schema edit)

`get_user_entities(p_project_id)` already returns each organization the caller edits with `'name', o.name`
and `'confirmed', o.confirmed` `[VERIFIED: S/schema/503-entity-rpcs.sql:186-216]`, and `_getBasicUserData`
already calls it for `password_set` (`supabaseDataWriter.ts:544-548`). With J6's record
(`app_metadata.registered_entities[<project>].organization = <id>`, written by the function through
`updateUserById`, which merges `app_metadata` at the **top level only** —
`for key, value := range updates { … u.AppMetaData[key] = value }` `[CITED: internal/models/user.go:245-258]`,
so the nested record is read, modified and written whole), the load computes `ownOrganizationUnnamed` from the
listed entity with that id. A user who also holds an admin-granted organization is never asked about it.

### Pattern 8: CI2's closed code set

Today `OIDC_ERROR` = `invalidState: 'invalid_state'`, `invalidToken: 'invalid_token'`, `missingCode: 'missing_code'`,
`tokenExchangeFailed: 'token_exchange_failed'`, plus `upstreamOidcError(value)` passing the provider's raw value
`[VERIFIED: F/lib/contestant/utils/oidcError.ts:19-33]`. After: the four kept, plus `mode_not_allowed`,
`registration_failed`, a cancel code, an unknown-provider-error code and (recommended) a configuration code;
`upstreamOidcError` deleted. The mapping lives in one module imported by the callback and CI2's
`+page.server.ts`; CI2 returns the **class** only. Note the module's header: "the bank authentication runbook
tells an operator to read the query parameter and names three of these spellings verbatim" — update
`tests/IDURA-TEST-RUNBOOK.md` with the codes.

### Pattern 9: the mock issuer's per-test selector

The mock decodes the JAR and 302s back with `code=test-code` (`mockOidcIssuer.ts:117-136`) and mints one fixed
identity (`IDURA_CLAIMS.sub = 'test-bank-auth-journey-sub-001'`, `:38-46`) `[VERIFIED]`. Recommended
`[ASSUMED design]`: the test sets a cookie for the mock's origin in its own browser context
(`context.addCookies`) naming an identity and an outcome; the authorize endpoint reads it and either 302s
with `?error=access_denied&state=…` (cancel), `?error=<other>` (provider error), or a **unique** code that it
maps in memory to the scenario; the token endpoint, called server-to-server without the browser's cookie,
looks the code up (fail/succeed/wrong key). Browser contexts are per test, so parallel workers cannot
cross-select. Note cookies are per host, not per port: the app on `127.0.0.1:5273` also receives the
mock's cookie — harmless, but name it so `cookies.test.ts` is not confused (it pins names the app sets).

### Anti-patterns to avoid

- **Trusting the type cookie** anywhere but as a selector re-checked by the function.
- **`admin.updateUserById(id, { email })`** for a typed address — even without `email_confirm` (Pitfall 1).
- **`hashed_token` from an `email_change_new` link** (Pitfall 2).
- **Generating a magic link for the placeholder of a proved user** (Pitfall 4).
- **Reading the session object in a load** for the address state (`assert:no-session-in-loads`).
- **A gate predicate on the URL or a query parameter** (173 O-4).
- **Echoing CI2's parameter** into text, attribute or title.

## Don't Hand-Roll

| Problem | Don't build | Use instead | Why |
|---------|-------------|-------------|-----|
| Proving an address | A token table or a custom confirm endpoint | GoTrue `generateLink` email-change + `/verify` | One-time tokens, expiry, the unique index on `email` and the session issue are GoTrue's |
| Passwordless user creation | Writing `auth.users.encrypted_password` in SQL | `generateLink({ type: 'invite' })` | The account-access recipe; no definer write into `auth` |
| Matrix rule in Deno | A fresh reading of the settings | A copy asserted against `45-registration-mode-matrix.test.sql`'s 32 rows | Three readers, one truth table |
| Mail transport, templates, locale resolution, link building | A second mailer | `account-access`'s `sendMail`, `template(...)`, `resolveMailLocale`, `buildSignInLink` | Completeness test already holds 7 locales × parts |
| Address throttle | A new counter table | `private.invitation_throttle_take` via a service-role RPC | Shares the link slot; cleanup trigger exists |
| Opening mailed links in E2E | String surgery in specs | `tests/tests/utils/mailedLink.ts` (extend with `email_change`) | Origin rewrite and shape checks exist |
| Stack-key hygiene in drivers | Raw `yarn db:start > log` | `yarn db:start 2>&1 | node tests/scripts/withhold-stack-keys.mjs`, status from `PIPESTATUS[0]` | Todo `2026-10-08-bank-auth-driver-copy-must-filter-the-db-start-output.md` |
| Trusting the mock's TLS | `NODE_TLS_REJECT_UNAUTHORIZED=0` | `NODE_EXTRA_CA_CERTS=tests/tests/support/mock-oidc-cert.pem` | Measured below |

**`NODE_EXTRA_CA_CERTS` works with the committed cert** `[MEASURED]`: the cert is self-signed with
`CA:TRUE` (`openssl x509 … -ext basicConstraints` → `CA:TRUE`, SAN `IP Address:127.0.0.1, DNS:localhost`,
valid to 2036-06-14). A Node 24.21.0 `fetch` to an HTTPS server using it: without the variable
`error: DEPTH_ZERO_SELF_SIGNED_CERT exit 1`; with `NODE_EXTRA_CA_CERTS=<cert>` `fetched: ok exit 0`.

## REG-14 inventory — the census and its traps

`git grep -l -i preregist -- apps packages tests scripts` → 78 files `[MEASURED]`. Beyond fact 14's list
(re-confirmed by UI-SPEC T-20), the census found references a zero-hit rule would trip on:

| File | Reference | Disposition |
|------|-----------|-------------|
| `packages/app-shared/src/data/schemas/storedSettings.schema.test.ts:122-132` | a test that a stored `preRegistration` key is **rejected** | Keep — it guards the removal. A case-insensitive `preregist` rule hits it; exempt it by name or make the rule case-sensitive and symbol-specific |
| `scripts/assert-no-candidate-app-names.mjs:85-143` + its fixtures | that gate's own patterns (`Candidate(Login|Preregistration)Error`, `…Preregister)Page`) | Keep; exempt as another gate's vocabulary |
| `apps/frontend/eslint.config.mjs:37` | `'src/routes/api/contestant/preregister/+server.ts'` | Remove with the route |
| `F/lib/supabase/anon.ts:11`, `F/lib/api/dataProvider.ts:10` | comments naming the preregister layout as the anon client's caller | Rewrite — `registrationGuard.ts` is now the caller; the client stays |
| `F/lib/supabase/universal.ts:36`, `F/routes/+layout.server.ts:36`, `F/routes/(voters)/(located)/+layout.server.ts:19` | comments | Rewrite |
| `F/lib/utils/constants.ts:8` | comment | Rewrite |
| `tests/tests/utils/privacyAllowlists.ts:48` | `'contestantContext-isPreregistered'` | Remove with the context member |
| `F/lib/_guards/eslint-adapter-boundary-guard.test.ts` | the route in the boundary allowlist | Update with the allowlist |
| `apps/docs/.../frontend/components/generated`, `routing/generated` | generated pages | Regenerate (`yarn workspace @openvaa/docs generate:docs`) |
| `.claude/skills/components/context-reactivity.md`, spike-findings skill | skill text | 178's PL-25 kept the spike record unedited; the D-18 script scans `apps/`, `packages/`, `tests/` only |

## Runtime State Inventory

| Category | Items found | Action |
|----------|-------------|--------|
| Stored data | Local `auth.users` rows created by the legacy flow on `*@bank-auth.placeholder` carry a generated hash and no `registered_entities` record; local candidates created confirmed by the legacy function. "Nothing is deployed" (operator ruling 2026-10-04): no migration owed. E2E teardowns sweep `e2e-bankauth-` prefixes (`playwright.config.ts:310`). | None in code; the E2E setups must sweep the new scenario identities by prefix (sub-derived placeholder addresses) |
| Live service config | The operator's untracked `S/functions/.env` names a real Idura test tenant (`https://openvaa.test.idura.broker`) `[CITED: 178-24-SUMMARY.md]`; hosted projects: none deployed. | D-19: the wrapper must not depend on it (Pitfall 10); docs/runbook tell developers what the default local function env must hold |
| OS-registered state | None — no launchd/systemd/scheduler entries reference the names `[ASSUMED: none searched beyond the repo]` | None |
| Secrets / env vars | New: the J4 server secret (root `.env`, `S/functions/.env`, hosted function secrets). Possibly dropped: `PUBLIC_PROJECT_ID` and `SITE_URL` from `identity-callback`'s required set after J5/D-04 (the callback verifies the token itself, so the magic link's `redirectTo` is unused). `scripts/assert-edge-function-env.mjs` derives the set from `requireEnv` calls, so it follows automatically. | Code edit + template edits + operator checklist line |
| Build artifacts | `F/lib/types/generated/translationKey.ts` (regenerate after catalogue edits); `apps/frontend/messages/*/contestantApp.preregister.json` × 7 and its line in `project.inlang/settings.json`; Paraglide output `F/lib/paraglide/**` (build output); docs generated pages | Regenerate; delete the catalogue files and the inlang line in the same task |

## Common Pitfalls

### Pitfall 1: an admin email update confirms the typed address implicitly
**What goes wrong:** `admin.updateUserById(id, { email: typed })` sets `users.email` and leaves
`email_confirmed_at` as it was — already set for a placeholder user — so the typed address reads as confirmed and
`claim_invitations` trusts it. **Why:** `SetEmail` writes only the `email` column; `Confirm` runs only for
`email_confirm` `[CITED: internal/models/user.go:398-401; internal/api/admin.go:255-259, 305]`. **Avoid:** never
pass `email` to an admin update for these users; the function's and `account-access`'s `flowConformance.test.ts`
assert that no `updateUserById(` call in either carries an `email` key and that the only `email_confirm: true`
is on the placeholder (todo `2026-10-07-174-typed-address-…` asks for the second half). **Warning sign:** a
pgTAP/unit case where a typed address claims an invitation.

### Pitfall 2: the wrong token for the new address
`generateLink` returns `hashed_token = GenerateTokenHash(<current email>, otp)`; the stored new-address token is
`GenerateTokenHash(<new email>, otp)`. Use the `token` parameter of `action_link` (as the legacy route already
does for the magic link: `actionUrl.searchParams.get('token')`, `F/routes/api/contestant/preregister/+server.ts:44-46`).
**Warning sign:** every confirmation click answers "Email link is invalid or has expired".

### Pitfall 3: F fires on CI1's arrival
The invite recipe makes `passwordSet` false; today's predicate `user.passwordSet === false` would put F before
CI1 and break REG-04's "no set-password step". The recipe and the predicate's address-state term land in one
commit, with `BasicUserData.addressState`. The legacy bank-auth journey (opt-in, run by the driver after each
plan per D-23) is the first thing that would show it.

### Pitfall 4: a magic link for a placeholder nobody owns any more
After the address is proved, `users.email` is the real address; `generateLink({ type: 'magiclink', email: <placeholder> })`
then finds no user and **creates a new one with a generated password** (`mail.go`, magiclink → signup branch).
The returning identity would be signed into a stray empty account. Generate for `(await admin.getUserById(id)).email`.
**Warning sign:** a returning proved user lands on CI1 V1 or `NothingToEdit`.

### Pitfall 5: the single-confirmation "success"
Under `double_confirm_changes = true` a lone new-address verification answers 200 with no session; supabase-js
`verifyOtp` then resolves without an error and with a null session `[ASSUMED: supabase-js maps the 200 body to data with null session — probe P2]`.
The callback's default arm would redirect as if the change were complete. Use the three-call recipe, and make
the callback treat a verified `email_change` with no session as a failure.

### Pitfall 6: the resend that silently stops working
Generating `email_change_new` again resets the confirmation status to zero; with the current token already
consumed, the next click only single-confirms. Every resend repeats generate-current, generate-new,
verify-current.

### Pitfall 7: a per-address throttle is not a bulk-oracle bound
D-07 discloses "in use" behind "the throttle", but a per-address slot (1 per 60 s) does not stop one caller
trying many addresses. Add a per-caller counter (by user id) in the same RPC — the model is the code look-up's
`'code:' || p_project_id::text || ':' || v_hash, 10, interval '15 minutes'` `[VERIFIED: S/schema/506-invitation-rpcs.sql:1025]`.

### Pitfall 8: J4 before the caller moves
A server-secret check in plan 1 breaks the legacy caller (anon) and the `bank-auth` direct-call spec at once,
with no green point. J4 lands in plan 2 with the new callback and the re-pointed spec.

### Pitfall 9: the harness only knows two link types
`tests/tests/utils/mailedLink.ts` accepts `export type MailedLinkType = 'magiclink' | 'recovery';`
`[VERIFIED: tests/tests/utils/mailedLink.ts:17]` and refuses any other; E2E-01's IdP scenario needs `email_change`.

### Pitfall 10: default-on depends on a file the suite does not own
`S/functions/.env` is a developer file; the operator's names a real tenant. D-19's "the wrapper starts … the Edge
Function with the test provider environment" therefore means the wrapper serves `identity-callback` itself, as
`178-bankauth.sh` does: `supabase functions serve identity-callback --no-verify-jwt --env-file <generated>`
**replaces the edge-runtime container for every function** (the driver copies `SMTP_HOST/PORT/FROM` from the
template so `account-access` keeps mailing), readiness must read the issuer back by name
(`docker exec supabase_edge_runtime_openvaa-local printenv IDENTITY_PROVIDER_ISSUER`), and stopping the serve
**removes** the container, so the drivers restore with `yarn db:stop` then `yarn db:start`
`[VERIFIED: 178-bankauth.sh header, run_project(), restore_stack()]`. Plan the wrapper's teardown restore, its
cost per run, its exit codes, and the hazard that the stack is shared with the `-infra` worktree (memory
`project_infra_and_gsd_share_local_supabase_stack`). The JWKS for the function is served over plain HTTP on
port 8777 to `host.docker.internal` (the container cannot reach the host's `127.0.0.1:9443` or trust its cert).
**Open Question 3** asks whether `yarn db:start` alone recreates the edge runtime after a serve ends.

### Pitfall 11: one issuer for the whole suite
`bank-auth` uses `DEFAULT_TOKEN_OPTS.issuer` (`https://test-idp.example.com`) and the journey the mock's
`https://127.0.0.1:9443`; one served function has one issuer (`178-bankauth.sh` header). Re-point the direct-call
spec at tokens the mock mints (or fold it into D-20's scenarios) before removing the `PLAYWRIGHT_BANK_AUTH`
conditionals (`tests/playwright.config.ts:273-329, 1627-1633`).

### Pitfall 12: the journey sits at the tail of the perm chain
`data-setup-bank-auth-journey` depends on the chain's last project (`app_settings` singleton safety,
`playwright.config.ts:289-311`). New scenario projects that write the matrix must join the same tail; widening
the base dataset's matrix instead moves two dev-seed pins and the journey's login assertions (D-19).

### Pitfall 13: the name gate under the answers lock
`nameState` locks names while answers are locked (operator C1 (a)); a gate that demands a name the user cannot
type holds them for ever. U-08 (a): the name disjunct reads false while locked — which needs `answersLocked`
on the user-level path: the protected load reads `appSettings` only in stage 4 today
(`F/routes/contestant/(protected)/+layout.server.ts:65-80`), so either move the settings read before the gates
or carry the lock on `BasicUserData`.

### Pitfall 14: J3 must land before an address can be proved
Once the email-change path works, a proved IdP account is claimed for by the auth callback's
`claimAndRefresh` on the `email_change` arm itself. J3's predicate (in `claim_invitations`' address read,
`S/schema/506-invitation-rpcs.sql:1163-1170`) must be in the schema no later than the plan that ships the
confirmation operation.

### Pitfall 15: a zero-hit rule that trips on its guardians
See the REG-14 census: the stored-settings rejection test and the app-name gate's own patterns. Decide the
exemption list in the plan, not at execution.

### Pitfall 16: PII in the access token (pre-existing, flagged)
`identity-callback` spreads the extracted claims into `app_metadata` (`index.ts:278-283`); for Idura those are
`extractClaims: ['birthdate', 'hetu']` `[VERIFIED: S/functions/identity-callback/claimConfig.ts:50]`.
`app_metadata` is part of the access-token claims, and `custom_access_token_hook` only adds `grants`
(`S/schema/301-auth-functions.sql:54-75`); the Supabase auth cookies are written `httpOnly: false`
(`F/lib/supabase/universal.ts:36`). So a Finnish personal identity code sits in a script-readable token. Not
introduced here and not in D-01..D-25; adding `registered_entities` to `app_metadata` widens the token
further. Recommend a todo (or an operator question) rather than a silent change.

## Code Examples

### The callback's success path (skeleton)

```ts
// F/routes/api/oidc/callback/+server.ts (after D-04). Names marked [ASSUMED] are suggestions.
const entityType = cookies.get(COOKIE.oidcEntityType /* [ASSUMED name] */);
cookies.delete(COOKIE.oidcEntityType, { path: '/' });
const { data, error: fnError } = await locals.supabase.functions.invoke('identity-callback', {
  body: { id_token: idToken, project_id: projectId, entity_type: entityType },
  headers: { 'x-identity-callback-secret': serverSecret /* [ASSUMED header and variable] */ }
});
// Map fnError's status / data.result to one closed code; never forward a message.
const { error: verifyError } = await locals.supabase.auth.verifyOtp({ token_hash: data.token, type: 'magiclink' });
cookies.set(COOKIE.identityProviderArrival /* [ASSUMED] */, data.result === 'created' ? 'created' : 'existing', {
  httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 600
});
throw redirect(303, buildRoute({ route: 'ContestantAppHome', locale }));
```

### The three-call confirmation (skeleton, inside the function)

```ts
// account-access, the authenticated confirmation operation. `admin` is the service-role client.
const current = await admin.auth.admin.generateLink({ type: 'email_change_current', email: placeholder, newEmail: typed });
const next = await admin.auth.admin.generateLink({ type: 'email_change_new', email: placeholder, newEmail: typed });
// 422 email_exists on either → the "in use" answer.
const newToken = new URL(next.data.properties.action_link).searchParams.get('token'); // NOT hashed_token
await fetch(`${supabaseUrl}/auth/v1/verify`, {
  method: 'POST', headers: { apikey: anonKey, 'Content-Type': 'application/json' },
  body: JSON.stringify({ type: 'email_change', token_hash: current.data.properties.hashed_token })
}); // expect 200 single-confirmation, no session
// buildSignInLink({ siteUrl, locale, tokenHash: newToken, type: 'email_change' }) → mail
```

## State of the Art

| Old approach (tree today) | Current approach (this phase) | Impact |
|---------------------------|-------------------------------|--------|
| ID token in an `id_token` cookie, creation three screens later | Creation at the callback; token never in the browser | Deletes `/api/oidc/token`, `api/contestant/preregister`, `COOKIE.idToken` |
| `createUser` with a generated hash | `invite` → `updateUserById` → `magiclink` | `password_set` honest; F gated on address state |
| Returning identity matched by "any candidate grant" (`maybeSingle()` throws on two) | `app_metadata` record per project and type, confirmed by a live grant | Closes `2026-10-06-173-…-two-candidate-grants` |
| Project from `PUBLIC_PROJECT_ID` | Project from the request, uuid-validated | `assert-project-scoped-queries` disposition changes |
| `NODE_TLS_REJECT_UNAUTHORIZED=0` in the journey's subshell | `NODE_EXTRA_CA_CERTS` | Measured working |
| Bank-auth projects opt-in | Default-on | Every later full run exercises the round trip |
| Single generated migration (this tree) | Frozen baseline + appended migrations (deployment branch) | See the hard constraint |

## Todo dispositions

| Todo (`.planning/todos/pending/`) | Disposition |
|-----------------------------------|-------------|
| `2026-09-21-surface-bank-identification-failure-to-the-user.md` | Close (D-14, D-15) |
| `2026-09-21-preregister-route-discards-email-and-nominations.md` | Close (D-04, D-06, D-18); honour its docs note |
| `2026-06-03-full-bank-authentication-flow-e2e-spec.md` | Close (D-20) |
| `2026-09-02-close-bank-auth-oidc-round-trip-window.md` | Close (D-19) |
| `2026-08-22-identity-callback-verifyjwt-fails-open-on-aud-iss.md` | Close with evidence: `requireVerifyClaimBinding` throws both codes (`verifyConfig.ts:27-43`) (D-16) |
| `2026-08-22-preregister-layout-server-has-no-unit-test.md` | Close — its file is deleted (D-22) |
| `2026-10-06-173-identity-callback-lookup-throws-for-two-candidate-grants.md` | Close (D-05, J6) |
| `2026-10-07-174-identity-provider-accounts-read-as-password-set.md` | Close by the RQ-3 recipe + Pattern 3 (J2) |
| `2026-10-07-174-typed-address-of-an-identity-provider-user-must-stay-unconfirmed.md` | Close by D-06 + Pitfall 1's conformance assertions |
| `2026-10-07-174-identity-provider-registration-never-claims-an-invitation.md` | **Keep open**, re-anchored: X2 (a) makes it a by-design residual; J3 makes the "never" mechanical |
| `2026-08-22-bank-auth-journey-setup-header-contradicts-config.md` | Close (the config block is rewritten by D-19) |
| `2026-10-08-bank-auth-driver-copy-must-filter-the-db-start-output.md` | Close in 179's driver copy (filter + `PIPESTATUS`) |
| `2026-08-28-edge-runtime-secrets-local-wiring.md` | Update: J5 removes `PUBLIC_PROJECT_ID` from the function; D-19's serve mechanism sidesteps `[edge_runtime.secrets]` |
| `2026-10-02-oidc-callback-does-not-verify-nonce.md` | Keep open, re-anchor (D-17) |
| `2026-08-22-edge-function-fourth-idtoken-verifier-copy.md` | Keep open, untouched (D-16) |
| `2026-10-01-identity-callback-compensating-delete-failure.md` | Keep open; the organization branch repeats the pattern (D-10) |
| `getidtokenclaims-negative-tests.md` | Keep open (verification unchanged, D-17) |
| `2026-10-07-174-hosted-project-auth-settings-allowlist-and-function-variables.md` | Update with the J4 secret line |
| `2026-09-03-159-identity-provider-default-remove-request.md` | Out of scope (blocked on 157.1) |
| `2026-08-28-preregister-election-constituency-selection-harmonisation.md`, `2026-09-15-refactor-candidate-and-entity-registration-flow-and-nominati.md` | **Not found in `pending/`** `[MEASURED: ls pending]` — already moved; nothing to do |
| To file (D-22) | `findUserByIdentityMatch` pages every user; Signicat PKCE verifier non-httpOnly (unless taken); account linking (179-B2 (c)); **new:** PII claims in `app_metadata` (Pitfall 16); native review of the constructed strings |

## Assumptions Log

| # | Claim | Section | Risk if wrong |
|---|-------|---------|---------------|
| A1 | The three-call email-change recipe completes on one click without mailing the placeholder (read from source, not run) | RQ-1 | Plan 3's core mechanism; fallback is `double_confirm_changes = false` with its restart and hosted-parity edits |
| A2 | supabase-js `verifyOtp` resolves without error and with a null session on the single-confirmation 200 | Pitfall 5 | The callback mis-lands users; guard anyway |
| A3 | A user's existing sessions survive an email change | RQ-1 | A user on CI1's tab is signed out when they click the link elsewhere |
| A4 | The invite → updateUserById → magiclink recipe leaves `encrypted_password` empty for a placeholder (source + account-access precedent for real addresses) | RQ-3 | F semantics; J2 |
| A5 | Signicat returns to the callback by a top-level GET so the lax type cookie arrives | RQ-2 | Signicat registrations would lose the type; the function would refuse an absent type when several are allowed |
| A6 | A shared-secret header is acceptable for J4 (operator design choice) | RQ-4 | A different credential changes envs and checklists |
| A7 | The mock-issuer cookie selector design (per-context cookie, code→scenario map) | Pattern 9 | Parallel tests cross-select identities |
| A8 | `yarn db:start` alone may or may not recreate the edge runtime after a `functions serve` ends | Pitfall 10 | Each wrapper run may need a full stop/start |
| A9 | Cookie and code spellings, header and variable names | Patterns 1, 2, 8 | Cosmetic |
| A10 | GoTrue tag of the running stack is still `v2.197.0` under CLI `2.118.0` | RQ-1 | Source read against the wrong version |

## Open Questions

1. **(Blocking for the first schema plan) Merge the frozen baseline in first?** What we know: the baseline is
   frozen on `feat/deployment-terraform-supabase` at exactly this tree's `00001` bytes; this tree's guard forbids a
   second migration. Unclear: whether the operator wants the deployment branch merged into
   `feat/entity-signup-multi-grant` now (A-01) or after 179. Recommendation: merge before 179's first schema
   commit; otherwise 179's schema edits make the two branches' baselines diverge.
2. **(Blocking for plan 3) RQ-1's recipe on the real stack.** Recommendation: Wave-0 probe rows P1–P7 before plan 3.
3. **D-19's serve cycle.** Unclear: whether `yarn db:start` after a `functions serve` recreates the edge runtime
   (cheaper than stop/start), how long each wrapper run's restore takes, and how the shared `-infra` stack is
   protected. Recommendation: measure in Wave 0 (P8), then decide whether the wrapper restores on every run.
4. **J1–J7** (operator) — all written here at the context's proposals; J2, J3, J4, J6 change server code.
5. **The ninth error code** (configuration vs outage) — recommend adding it.
6. **U-16 (a)'s address-taken landing** needs the callback, after a failed `email_change` verification, to ask
   whether the signed-in caller's own pending address is now held by another account (a `SECURITY DEFINER`
   RPC answering for `auth.uid()` only; a further schema edit). Without a session no such answer exists.
   Recommendation: either build that RPC or rule U-16 (b) for the race case — the common case (address already
   taken at entry) is answered at issue time by `email_exists`.
7. **Pitfall 16 (PII in the token)** — file a todo or raise with the operator.

## Environment Availability

| Dependency | Required by | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Docker | stack, isolated equivalence instances | ✓ | Server 29.7.2 `[MEASURED]` | — |
| Local Supabase stack `openvaa-local` | Wave-0 probes, gates, E2E | **✗ not running** (no container; 54321/54322/54324 free) `[MEASURED]` | — | Start with `yarn db:start` under the standing authorisation (memory `project_182_standing_stack_authorisation`); mind the shared `-infra` session |
| Supabase CLI | stack, `functions serve` | ✓ | 2.118.0 `[MEASURED]` | — |
| GoTrue image | auth | ✓ | `gotrue:v2.197.0` present `[MEASURED]` | — |
| Node | everything | ✓ | v24.21.0 `[MEASURED]` | — |
| Playwright | E2E | ✓ | 1.63.0 `[MEASURED]` | — |
| python3 | the drivers' JWKS server (port 8777) | ✓ | 3.9.16 `[MEASURED]` | Node static server |
| openssl | cert check | ✓ | system | — |
| Deno CLI | — (Phase 180 adds it) | ✗ | — | vitest over pure modules, as today |
| Ports 5273, 8777, 9443, 5173 | wrapper, JWKS, mock issuer | free `[MEASURED]` | — | — |
| Unrelated stack `next-supabase-skimle2` (port 54331) | — | running | — | **Never touch it** (memory `project_gsd_e2e_disk_sinks`) |
| GitHub Actions on this branch | CI observation of D-19 | ✗ (CI triggers on `main` only) | — | `ci-evidence/**` channel (memory) |

## Validation Architecture

`workflow.nyquist_validation` is absent from `.planning/config.json`, so validation is enabled.

### Test framework

| Property | Value |
|----------|-------|
| Unit and component | vitest per workspace: `apps/frontend`, `apps/supabase` (the functions' pure modules; `index.ts` cannot be imported — keep logic in parameter-taking siblings), `packages/dev-seed`, `packages/app-shared`, `tests/vitest.config.ts` |
| Database | pgTAP, `S/tests/database/*.test.sql`, on a freshly reset database |
| End to end | Playwright through `tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/<name> --no-db-reset` |
| Quick run (frontend) | `yarn workspace @openvaa/frontend test:unit` |
| Quick run (functions) | `yarn workspace @openvaa/supabase test:unit` |
| Full unit | `yarn test:unit` (needs the stack running: memory `project_unit_gate_needs_running_stack`) |
| Static gates | `yarn lint:check` (carries `assert:schema-migration-parity`, `assert:cookie-names`, `assert:no-session-in-loads`, `assert:project-scoped-queries`, `assert:edge-function-env`, `assert:edge-env-defaults`, `assert:auth-signup-closed`, `assert:i18n-catalog-namespaces`, `assert:a11y-scan-wiring`, `assert:comment-hygiene`, `assert:no-candidate-app-names`, `assert:hosted-settings-parity`, …) |
| Schema equivalence (frozen mode) | `yarn check:schema-equivalence` (Docker; not in `lint:check`) |
| Driver models | `.planning/phases/178-sign-in-email-code-registration/{178-gates.sh,178-e2e.sh,178-verdict.mjs,178-bankauth.sh,178-stack-probe.sh}` |

### Wave 0: measured before anything is built

One probe script in the phase directory (model: `178-probe.mjs`), run against the local stack under
`caffeinate`, every user and row under a `rq179_` prefix, removed at the end, its output recorded:

| Row | Question | Decides |
|-----|----------|---------|
| P1 | Placeholder user (created as today): generate current + new, verify current (status, body, session?), verify new (session? `email`, `email_change`, `email_confirmed_at` before/after), Mailpit count | A1, plan 3's mechanism |
| P2 | Same with the new link alone: does the click only single-confirm; what does supabase-js `verifyOtp` return | Pitfall 5, A2 |
| P3 | A second triple: is the first new link refused (status, code) | Resend semantics, the mail's copy |
| P4 | `newEmail` held by another account → 422 `email_exists`?; two placeholders pending one address: first click ok, second click status/code | D-07, U-16 |
| P5 | Invite → `updateUserById(app_metadata, email_confirm)` → magiclink verify: `private.user_password_set` false?; `createUser` control → true | A4, J2 |
| P6 | `hashed_token` vs the `action_link` token for `email_change_new`: which verifies | Pitfall 2 |
| P7 | An access/refresh token issued before the change: still valid after it | A3 |
| P8 | `supabase functions serve identity-callback --env-file <generated>` then stop: does `yarn db:start` alone bring the edge runtime back; time of a full stop/start | D-19 wrapper design (A8) |

P8 replaces the shared stack's edge runtime; run it only in a window the operator confirms free.

### Phase requirements → test map

| Req | Behaviour | Type | Command | Exists? |
|-----|-----------|------|---------|---------|
| REG-04 | Function: new identity → invite recipe, entity + grant before the link, link for the current address | unit | `yarn workspace @openvaa/supabase test:unit` (new modules beside `identity-callback/index.ts`) | ❌ Wave 0 |
| REG-04 | Confirmation operation: auth required, placeholder refused, slot, three calls, one mail per locale, `in_use` | unit | same; `account-access/{contract,linkIssue,mailTemplates,flowConformance}.test.ts` | partly; extended |
| REG-04 | No `email` key in any admin update; the only `email_confirm: true` is the placeholder's | unit | `flowConformance.test.ts` in both functions | ❌ |
| REG-04 | New candidate end to end: C → mock → CI1 → G → home; then the mailed confirmation link via `mailedLink.ts`; then sign-in by email; F appears once proved | E2E | the IdP spec, scenario 1 (`@reg-idp`) | ❌ |
| REG-05 | Gate predicate over address states and marker (V1–V6 table) | unit | `F/lib/contestant/gates/gates.test.ts`; `(protected)/layout.server.test.ts`; `layout.tracking.test.ts` stays green | exist; extended |
| REG-05 | Returning proved / pending / none; the gate on a direct protected URL | E2E | scenarios 3, 4, 8 | ❌ |
| REG-06 | Authorize refuses a forbidden type; cookie set with flow attributes; callback re-checks; function refuses and writes nothing | unit + E2E | `F/routes/api/oidc/*` tests (new `server.test.ts`); function matrix test over the 32 rows; scenario 7 asserts no row written | ❌ |
| REG-06 | Deno matrix copy equals SQL and TS on every row | unit | new vitest reading `45-registration-mode-matrix.test.sql` | ❌ |
| REG-07 | Org created unconfirmed, nameless; names saved through `updateEntityProperties`; default-locale name required | unit + E2E | function org-branch test; CI1 component test; scenario 2 (`@org-registration`) | ❌ |
| REG-08 | Code → class table; unknown → retry; never echoed | unit + E2E + axe | CI2 `page.server.test.ts`; scenarios 5, 6; entry scans 1–3 | ❌ |
| REG-14 | No `preregist` reference outside the exemptions | gate | the new `assert:` script in `lint:check`, with `--self-test` | ❌ |
| J3 | An IdP caller claims nothing even with a confirmed matching address | pgTAP | `39-invitations.test.sql` new case | extended |
| E2E-01 | Every mode follows a real mailed link | E2E + gate | tags `@reg-idp`, `@reg-email`, `@reg-code`; coverage script | tags ❌ (only `@nomination-definition` exists: 17 tests in `contestant-nominations.spec.ts` and `perm-startfromcg.spec.ts` `[MEASURED]`) |
| E2E-02 | Org registration, entity selection, nomination definition covered | gate | coverage script over `npx playwright test -c tests/playwright.config.ts --list --grep-invert @probe` | ❌ |
| E2E-03 | Full suite, IdP specs included, green | E2E | one wrapper run through `179-e2e.sh` | — |

### Gate set for `179-gates.sh` (178's seventeen rows, plus)

| Row | Command | Why |
|-----|---------|-----|
| equivalence | `yarn check:schema-equivalence` | Frozen mode: `schema/` vs migrations (only once the freeze is merged) |
| coverage-tags | the D-21 script | E2E-01/02 |
| preregister-gone-self-test | the D-18 script's `--self-test` | the gate fires |
| test-keys-scope | a check that no non-test configuration names the committed test keys (D-19 hazard) | security |
| fn-closed | live probe: anonymous direct call to the served function is refused (J4) | D-25 addition |

Order the database rows as 178 does: reset → types on the fresh database → pgTAP → SQL lint → integration.

### Sampling rate

- **Per task commit:** the workspace's quick unit command for the files touched; `yarn lint:check` when a gate
  script, catalogue or route changes.
- **Per plan close:** `179-gates.sh <label>` then one full wrapper run through `179-e2e.sh`; until plan 6 also
  the bank-auth projects through a 179 copy of `178-bankauth.sh` (D-23), with the `db:start` output filtered.
- **Phase gate:** D-25's sequence on one head, then one full wrapper run with the IdP specs in the default suite.

### Wave 0 gaps

- [ ] `179-probe.mjs` (rows P1–P8) and its evidence file
- [ ] `179-gates.sh`, `179-e2e.sh`, `179-verdict.mjs`, `179-bankauth.sh` (until plan 6), `179-stack-probe.sh`
- [ ] Baseline runs on the unchanged tree: gates, full suite, both bank-auth projects
- [ ] `tests/tests/utils/mailedLink.ts` accepts `email_change`
- [ ] The mock issuer's selector (Pattern 9) — needed by every IdP scenario

## Security Domain

`security_enforcement` is not set in `.planning/config.json` (absent = enabled).

### Applicable ASVS categories

| ASVS category | Applies | Standard control |
|---------------|---------|------------------|
| V2 Authentication | yes | GoTrue sessions only via `verifyOtp`; ID token verified with bound `aud`/`iss`; `state`/PKCE binding; nonce still unverified (D-17, filed) |
| V3 Session management | yes | httpOnly flow cookies (600 s), arrival marker httpOnly; flow cookies cleared on every failure |
| V4 Access control | yes | Matrix authority in the function; J3 in `claim_invitations`; J4 server credential; J6 no re-creation after a grant is removed |
| V5 Input validation | yes | uuid project, closed entity-type set, closed error-code set, never echo CI2's parameter, placeholder domain refused as a typed address |
| V6 Cryptography | yes | No hand-rolled crypto; constant-time secret compare (`crypto.subtle`/`timingSafeEqual` equivalent in Deno) |
| V7 Errors and logging | yes | "Logged, NEVER returned"; fields not error objects (the `payload` of a jose claim error carries the whole token, `index.ts:226-234`) |
| V8 Data protection | yes | Placeholder never rendered; pending address shown to its owner only; Pitfall 16 (PII in the token) |

### Known threat patterns for this stack

| Pattern | STRIDE | Standard mitigation |
|---------|--------|---------------------|
| Forged type cookie | Tampering / EoP | Function re-checks the named project's stored matrix; refuses unknown/absent-with-several |
| Replayed ID token to the function | Spoofing | J4 server credential; the callback obtains tokens itself |
| Typed address becomes an identifier without proof | Spoofing | Email change only through GoTrue's link; no admin `email` update (Pitfall 1) |
| Bulk address oracle via "in use" | Information disclosure | Per-caller + per-address throttle (Pitfall 7) |
| Victim opens a registrant's confirmation link | Spoofing | Mail text as a security control (impersonal); J3 excludes IdP accounts from the claim |
| Reflected content via CI2 | Tampering | Closed code set mapped server-side; class only to the page |
| Duplicate entities per identity | DoS / integrity | J6 record per project and type, live-grant check |
| Login CSRF | Spoofing | `state` (Idura), PKCE verifier cookie (Signicat) — unchanged |
| Test keys in a non-test configuration | EoP | Gate row `test-keys-scope` |

## Sources

### Primary (HIGH — read this session)

- Tree files cited inline with paths and lines (function sources, schema, routes, gates, cookies, tests, drivers,
  config, workflows).
- `git show feat/deployment-terraform-supabase:` — the frozen guard, manifest, database skill diff.
- `.planning/workstreams/deployment/phases/181-deployability-and-migration-model/evidence/181-17-freeze-readiness.md`.
- `178-24-SUMMARY.md`, `178-RESEARCH.md` § Validation Architecture, `174-RESEARCH.md` (GoTrue tag, the
  configuration measurements), operator decisions 2026-10-07/08/09/16.

### Secondary (MEDIUM — upstream source, not run)

- `github.com/supabase/auth` at `v2.197.0`: `internal/api/mail.go` (`adminGenerateLink`),
  `internal/api/verify.go` (`verifyPost`, `emailChangeVerify`, `verifyTokenHash`), `internal/api/admin.go`
  (`adminUserCreate`, `adminUserUpdate`), `internal/models/user.go` (`NewUser`, `SetEmail`,
  `ConfirmEmailChange`, `UpdateAppMetaData`, JSON `new_email`), `internal/models/one_time_token.go`
  (`CreateOneTimeToken`), `internal/mailer/templatemailer/templatemailer.go` (`GetEmailActionLink`),
  `migrations/20221215195500_modify_users_email_unique_index.up.sql`.

### Tertiary (LOW)

- Browser SameSite behaviour for Signicat's return (not exercised by any test here).

## Metadata

**Confidence breakdown:**
- Schema model and constraints: HIGH — read on both branches, hashes compared.
- GoTrue behaviour (RQ-1, RQ-3): MEDIUM — source at the running tag, unexecuted; Wave-0 probe required.
- Architecture and file map: HIGH — every anchor read on HEAD `978267b47`.
- D-19 harness mechanics: MEDIUM — from the working drivers; the wrapper integration and restore cost unmeasured.
- Pitfalls: HIGH for 1–4, 7–15 (source or tree); MEDIUM for 5, 6 (source); flagged for 16.

**Research date:** 2026-10-21
**Valid until:** 2026-11-04 (fast-moving: the freeze merge and the 175/177/178 follow-ups can move anchors)
