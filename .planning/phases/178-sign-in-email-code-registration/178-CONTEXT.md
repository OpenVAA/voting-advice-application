# Phase 178: Sign-in, Email & Code Registration - Context

**Gathered:** 2026-10-06
**Status:** Ready for planning — with **six items marked ⚠ OPERATOR REVIEW** (J1–J6 under *Judgement
calls*) and **three upstream phases not yet closed** (174 executing; 175 and 176 not started — see
`<expected_tree>`). The planner re-reads the tree before fixing any anchor.

**Source of decisions:** `.planning/v2.16-DISCUSSION-POINTS.md` § *Phase 178 — Sign-in, Email & Code
Registration* (plus § *Cross-phase picture*, X1–X3, § *Additional notes*, and the cross-phase notes of
174 and 179) — a shared checkbox document covering Phases 170–179 that the operator filled in one pass
(committed as `e4813bf65`). Its rule: an unticked decision accepts the `★ RECOMMENDED` option; a ticked
box overrules the ★; `**EDIT:**`/`**NOTE:**` free text beats every box.

In Phase 178's own 24 decisions the operator ticked **one box and wrote one NOTE**, both on the same
decision:

1. **178-B1 → the ★ itself, ticked, plus `NOTE: But bundle this in user data retrieval rpc.`** The
   tick is on the recommended option, so it overrules nothing; the NOTE changes how the fact is served:
   not by a helper the layout calls on its own, but as part of the user-data retrieval. See D-06 and J1.

Choices and outcomes **outside** this section that change what this phase builds:

2. **Additional note 1** — *"Change the whole preregister route to register and an eg id-provider
   subroute within it for that."* The orchestrator assigned it to Phases 178–179 and `REQUIREMENTS.md`
   REG-14 and the roadmap were amended to it on 2026-10-05, with "exact route names settled in the
   Phase 178 plan". **This file's reading of the note is an interpretation for the operator to confirm**
   (D-19, D-20, J4).
3. **179-B3 ★ (amendment of REG-02, 2026-10-05)** — "I have not set a password yet" is shown when the
   email mode **or the identity-provider mode** is allowed for any served entity type (D-09).
4. **Phase 174's rulings, as planned** (174 is executing: plans 01–02 done, 03 at an operator
   checkpoint). They change this section's baseline in seven places: public sign-up is off and
   confirmations are on; the server contract is one Edge Function, `account-access`, with four writer
   methods; every mailed link is a `magiclink`; the 60-second resend interval and the seven-locale
   sign-in mail land in 174 (174 J4); accounts created by `identity-callback` carry a password hash;
   `toCallbackUrl` is handed to this phase; the registration-mode matrix is not consulted by 174's
   contract.
5. **Phase 173's outcome (executed)** — the gate list `$contestant/gates/gates`, the four-stage
   user-level load, the app root's three outcomes, `ContactSupport` and `NothingToEdit`.
6. **Phase 171's outcome (executed)** — the matrix accessors, the two guards, the login screen's test
   ids and four axe scans, the `access.answersLocked` hand-over (J5).
7. **170-A5 → (b)** — the auth pair is at the neutral `api/auth/{callback,logout}`, shared with the
   Admin app; only `preregister` is under `api/contestant/`.
8. **X3 → ★ (a)** — `REQUIREMENTS.md` and `ROADMAP.md` already carry the amended REG-02, REG-14 and
   FIX-01 wording. This file cites the amended text.

Every other decision takes its ★ option as written, except where the ★ assumed something an overrule,
an executed phase or a planned phase has since changed. Those places are rewritten **and flagged inline
as "reconciled with <id / phase>"**. The full list is under *Reconciliations* at the end of
`<decisions>`.

<domain>
## Phase Boundary

A user reaches a signed-in session through the new entry flow — signing in with email, or registering
by email or by code — over shared components, with the set-password step enforced once, in the layout.
Requirements **REG-01, REG-02, REG-03, REG-09, REG-10, REG-11, REG-13, FIX-01**, **REG-14 in part** (the
legacy `register/` contents go here, the `preregister/` chain in Phase 179), **E2E-01 in part**, and
**E2E-03** as closing criterion. Depends on Phase 171 (the matrix), Phase 174 (invitations and their
endpoints) and Phase 176 (the gates and the home screen). **The roadmap gives this phase a UI hint:**
screens A, B, C, D1, D2, E and F of `CAND-APP-PLAN.md`.

It delivers:

- **the screens** — A (login, two entries), B (sign in with email), C (registration-mode selector),
  D1 (enter and confirm an email), D2 (code reuse: password sign-in), E (email sent), and F (set a
  password, as a gate view of the protected layout);
- **the shared components** those screens are composed from (REG-13);
- **forgot-password and password-reset reshaped** onto the same "email sent" screen and the same server
  endpoint, which is what makes FIX-01 true;
- **the server additions the screens cannot work without** (reconciled — the discussion says "screens
  only"; see D-05, D-06, D-13, D-17, R6): a recovery operation and a recovery mail in the
  `account-access` function, the registration-mode matrix as a condition in the invitation functions,
  the "password set" fact on the user-data read, and the password length in the auth configuration;
- **the removal** of the legacy contents of `register/` with their writer contracts and URL parameters;
- **the E2E specs** for the email mode and the code mode that open the mailed link as received.

**Not in this phase:** identity-provider registration itself (CI, CI1, CI2), the entity-type choice
inside C's identity-provider option, the removal of `preregister/`, F's exemption for an initial
identity-provider registration, and the pending-address confirmation mail (all Phase 179); G (Phase
172, built), H (Phase 173, built), the home screen and task state (Phase 176); any Admin-app screen;
announcing invitations by mail (174 todo); a per-caller rate limit (174 residuals R-a..R-d).

### Roadmap success criteria (ROADMAP.md § Phase 178, as amended 2026-10-05)

1. The login screen (A) offers "Sign in with email" and, only when some registration mode is allowed,
   "Register". Register opens the mode selector (C), which lists each allowed mode as an expandable
   option with one Continue button, or shows the single allowed mode directly (REG-01, REG-03).
2. Registering by email, and choosing "I have not set a password yet" on the sign-in screen (B) — shown
   when the email mode or the identity-provider mode is allowed for any served type — both lead to the
   "email sent" screen (E): a rate-limited resend, a link to support, and the same response whether or
   not the address is valid, with no backend error surfaced. The emailed link signs the user in, and a
   user who arrives that way without a password must set one before any other page, enforced by the
   layout (F) (REG-02, REG-10, REG-11).
3. Entering a registration code leads, for a valid unused code, to entering and confirming an email
   (D1) and on to E; for a used code, to password sign-in (D2); and for anything else, to "We couldn't
   confirm your registration code." (REG-09).
4. The sign-in, password and email-entry pieces are the same shared components on the sign-in,
   code-reuse, email-entry and set-password screens, browser autofill and password managers work on
   every one of their inputs, and a password-reset link requested from inside the app completes and
   signs the user in, in whichever browser or device it is opened (REG-13, FIX-01).
5. The email mode and the code mode each have an E2E spec that follows the real emailed verify redirect
   rather than a hand-built callback URL, and the full E2E suite is green at close (E2E-01 in part,
   E2E-03).

**Standing todos the roadmap puts in scope:**
`2026-09-02-forgot-password-pkce-code-not-exchanged.md` (closes with D-18),
`2026-06-07-hide-forgot-password-email-input-after-submitting.md` (closes with D-13),
`2026-09-15-refactor-candidate-and-entity-registration-flow-and-nominati.md` (closed here for the email
and code methods; for the identity-provider method in Phase 179). Others this phase meets are listed
under `<cross_phase>` O-9.

### Standing rules (ROADMAP.md § v2.16, inherited by every phase)

- **Cardinal rule:** no failing E2E test, no exemptions, no "known flaky"; a "did not run" counts as a
  failure. E2E-03 is a closing criterion of this phase.
- **Localisation:** every user-facing string ships in all seven locales (`da, en, et, fi, fr, lb, sv`).
  **A mail is a user-facing string** (D-16).
- **Accessibility:** every new or changed screen meets WCAG 2.1 AA and is reached by the axe scan, in
  the light and the dark theme (D-22).
- **Both entity types:** a criterion that says "user" or "entity" holds for candidates and for
  organizations unless it names one.
- **Nothing is deployed:** the schema, the settings shape, the routes and the symbols change in place;
  no redirect from an old route, no compatibility shim, no migration of stored data.
- **Schema edits are serial.** This phase edits `schema/*.sql` (D-05, D-06) and regenerates the single
  migration file after whichever of 174, 175 and 177 ran before it.
- **Comment hygiene** (`CLAUDE.md`): no historical narrative, no planning references, in any comment
  under `apps/`, `packages/` or `tests/`.

</domain>

<decisions>
## Implementation Decisions

Decision ids map one-to-one onto the discussion document's Phase 178 ids, given in parentheses.
24 decisions → D-01..D-21. Where a decision is security-relevant, **If wrong** states what an attacker
or a defect could do if it were implemented otherwise; the planner carries every such line into the
plan's threat model.

Names are those on the tree after Phase 170. Frontend paths are relative to `apps/frontend/src/`
unless they start with `apps/`; `schema/` and `functions/` are relative to `apps/supabase/supabase/`.
Names of things Phase 174 has planned but not yet built are marked *(174, planned)*.

### 0 — Factual baseline

- **D-01 (178-0.1):** Accept all 19 facts of 178-0 as the baseline; restated under
  `<factual_baseline>` **with the corrections Phases 170, 171, 172 and 173 made and Phase 174 is
  planned to make to facts 1, 2, 3, 5, 9, 10, 12, 13, 15, 16 and 17**. The facts are a 2026-10-04
  snapshot at `df0cec944`; the planner re-reads the tree.

### A — Routes, gates and the server contract

- **D-02 (178-A1) ⚠:** **One route per screen. The code and the entered address travel between steps in
  the contestant context, never in the URL.** Under `routes/contestant/`:

  | Screen | Route | Notes |
  |---|---|---|
  | A | `login` | two entries, **no form**; both are links |
  | B | `login/email` | the sign-in form and its server action |
  | C | `register` | the mode selector; keeps the route key `ContestantAppRegister` |
  | D1 | `register/email` | reached only with a `valid` code held in the context |
  | D2 | `register/sign-in` | reached only with a `used` code held in the context; has a server action |
  | E | `email-sent` | serves C's email option, B's "I have not set a password yet", D1, D2's link request and forgot-password |
  | — | `forgot-password`, `password-reset` | keep their routes (D-12) |

  Route keys for the new routes are the planner's, in `lib/routes/route.ts`. *Reconciled with
  Additional note 1:* the names under `register/` must leave `register/identity-provider/…` free for
  Phase 179 (D-19, J4).
  **Planner constraints, each a security or correctness control:**
  - **The flow state is in-memory only** — a `$state` held by the contestant context instance. Not
    `localStorage`, not `sessionStorage`, not a cookie, not a search parameter, not SvelteKit `page.state`
    serialised into history. It is cleared when the flow ends (the link is requested, the sign-in
    succeeds) and on logout. It must be per context instance, never module scope: a module-level value
    in the SSR module graph is shared by every concurrent request.
  - **A reload or direct entry on D1, D2 or E has lost the value** and returns the user to the step
    that owns it: D1 and D2 → C; E → the screen it was reached from when known, else A. E never renders
    without knowing which wording to show.
  - **D2's code reaches the server in the form body** of its action (a hidden field filled from the
    context), never in the action's URL.
  - A's "Sign in with email" and "Register" are plain links, so the screen works before hydration. This
    ends the defect Phase 171 handed over: the collapsed-form button that is a native submit of the
    sign-in form until its handler is bound.
  - Phase 171's test ids (`testIds.contestant.login.registerLink`, `.preregister`, `.showLogin`,
    `testIds.contestant.register.code`) are held by six E2E tests and three journey assertions. A
    rebuilt screen keeps an id or moves its tests with it; none is left asserting a control that no
    longer exists.
  **If wrong** (a credential in the URL, as the legacy `?registrationKey=` does): the registration code
  — a bearer credential — sits in browser history, in the `Referer` of the next request and in server
  logs. (State in web storage): it outlives the tab on a shared computer.
- **D-03 (178-A2) ⚠:** **F is a gate view of the `(protected)` layout, rendered in place of the page,
  and it comes first: F → G → H → page. It has no route of its own.**
  *Reconciled with the Phase 172 and 173 outcomes — the mechanism exists and the "Cannot be defined
  yet" item is resolved:* the gates are an ordered, frozen list. F is **one entry prepended to
  `CONTESTANT_GATES`, one member added to `ContestantGateId`, and one view added to `GATE_VIEWS`**
  (`lib/contestant/gates/gates.ts`, `gateViews.ts`; the existing view is `TermsOfUseGate.svelte`). A
  predicate receives `BasicUserData` only, so the "password set" fact must be on that object (D-06).
  The user-level load (`routes/contestant/(protected)/+layout.server.ts`, stage 3) returns
  `{ gate, user }` for a gated user and reads neither the entity list nor an entity; no sign-out for a
  missing entity happens before the gates. H is the app root, already built.
  **Planner constraints:**
  - **Passing a gate is not a navigation.** After the password is set the layout's load must run again
    (`invalidateAll()` or an equivalent) so the next gate or the page is decided by the server on fresh
    data — never by a client-side flag that hides the view.
  - **Focus.** Phase 173 recorded that passing the terms gate leaves focus on `<body>`
    (todo `2026-10-06-173-terms-of-use-view-phone-overflow-and-focus.md`). With F in front of G,
    gate-to-gate is the normal first-time path. Focus is moved to the next view's heading in **one
    place, the layout**, for every gate — which fixes the recorded focus defect as a consequence. The
    390px overflow of the terms view is not this phase's screen; it stays with its todo unless the UI
    spec takes it.
  - The user-level load must still read no `url` property and no param beyond the two it reads for the
    dependency; `layout.tracking.test.ts` beside it fails otherwise (173 O-4).
  **If wrong** (F as a route with a redirect, option (b)): a guard that can be forgotten on one page, and
  a URL to get stuck on. **What the gate is and is not:** it is a server-decided view gate over every
  `(protected)` page. It is not a database control — a signed-in passwordless user can still call
  PostgREST with their token, exactly as a user who has not accepted the terms can. That is accepted:
  the session was obtained by proving the address, and no authority depends on having a password. What
  must not be possible is to **skip the gate from the browser** (see D-06) or to reach a `(protected)`
  page whose own load runs before the user-level load has decided the gates.
- **D-04 (178-A3):** **Extend the gate table so every entry-flow route redirects a signed-in user to
  the app root, as the login route does.** `CONTESTANT_GATE.whenAuthenticatedOnLogin` in
  `lib/routes/appGates.ts` knows one route today (`loginRoute`); it becomes a set covering A, B, C, D1,
  D2 and E. `forgot-password` and `password-reset` stay open to a signed-in user, because a recovery
  link arrives signed in. The redirect carries no parameter.
  *Reconciled with Additional note 1 / D-19:* the legacy `preregister/` tree is not added to the set in
  this phase — it has its own `(authenticated)` group and Phase 179 rebuilds it.
  **If wrong:** a signed-in user starts a second registration over their session and the claim writes
  another person's code onto the account that happens to be signed in on a shared computer.
- **D-05 (178-A4) — server-side matrix. ⚠ OPERATOR REVIEW (J3).** **Yes, for registration only. An
  invitation whose mode is not allowed for its target's entity type is treated as absent. A user who
  already holds a grant in the project can always ask for a sign-in link.** The roadmap records this as
  settled.
  *Reconciled with Phase 174 (planned) and the Phase 171 outcome:* 174's contract does not consult the
  matrix, and it keeps the target's entity type and the project reachable in its SQL functions so that
  this phase can add the condition (174 O-4). Phase 171's code says the opposite of this decision in a
  docblock — `packages/app-shared/src/settings/contestantAppConfig.ts`: "An invitation sent by an
  administrator is not a registration mode and needs no entry." **That sentence is corrected here.**
  What is settled by this file, as the judgement:
  - **The mapping:** an invitation bound to an **email** is the `email` mode; one bound to a **code**
    is the `code` mode. Each is judged against the matrix row of its **target's entity type**.
  - **A project-scope promise** (174 D-04: an invited project editor or admin) has no entity type and
    is **not judged by the matrix**: it is not a contestant registration.
  - **Where:** in the SQL functions behind `account-access` *(174, planned:
    `invitation_code_status`, `invitation_link_request`)* — the code check answers `unknown`, the link
    request does nothing. **And in `claim_invitations`**, which skips such a row: otherwise a returning
    user, who may always ask for a link, would claim a second, disallowed invitation through it. This
    third place is beyond the ★'s letter ("the code check and the link request"); the operator
    confirms.
  - **One reading of the matrix in SQL.** The effective matrix has defaults when unset
    (`getEffectiveRegistrationModes`). The SQL side must give the same answer for every stored shape,
    including "nothing stored"; a test pins the two against each other (RQ-6). A second, hand-written
    copy of the defaults that drifts is the failure this constraint exists to prevent.
  - The answers stay inside 174's closed sets: a disallowed mode is indistinguishable from an unknown
    code or an uninvited address, in status, body and timing.
  **If wrong** (the matrix as presentation only, option (b)): a mode an admin switched off stays open
  to anyone who holds an invitation and the endpoint's address.

### B — The set-password gate (REG-11)

- **D-06 (178-B1) ⚠ — ★ + NOTE. ⚠ OPERATOR REVIEW (J1).** **The database answers, for `auth.uid()`
  only, whether `auth.users.encrypted_password` is set; the answer is bundled into the user-data
  retrieval, not served by an RPC of its own.**
  *Reconciled with the NOTE, the Phase 173 outcome and Phase 174 (planned):*
  - **The helper already exists by the time this phase runs:** `private.user_password_set(p_user_id)`
    *(174, planned in `schema/506-invitation-rpcs.sql`)* — `SECURITY DEFINER`, not executable by any
    API role, true when the hash is neither null nor the empty string. `claim_invitations` already
    returns it as `password_set`. This phase adds no second helper.
  - **Where it rides:** as one key, `password_set`, on the object `public.get_user_entities` returns
    (`schema/503-entity-rpcs.sql`). Phase 173 left that function returning **one `jsonb` object with an
    `entities` array, one row even for a caller with no entity**, precisely so a per-user key can be
    added beside `entities` without changing signature or cardinality (173 O-1). The function is
    `SECURITY INVOKER`; the key is obtained through the private definer helper, called for `auth.uid()`
    and never for an argument the caller supplies.
  - **The seam the NOTE does not settle (the judgement):** the gates are decided in stage 3 of the
    user-level load on `getBasicUserData()`, which today calls no RPC (it reads the verified user, the
    token's grants and `terms_of_use_acceptances`), while `get_user_entities` is read in stage 4, *after*
    the gates — and the load's documented contract is that the list is not read for a gated user. So
    either `getBasicUserData` reads the user-level key from the RPC, or a new field on `BasicUserData`
    is filled by one call the load makes before stage 3 and reuses in stage 4. **This file chooses:
    `BasicUserData` gains `passwordSet`, filled inside `_getBasicUserData` from `get_user_entities`;
    how the list part of that answer is reused or re-read is the planner's.** The alternative the
    operator may prefer is a tiny dedicated RPC, which the NOTE reads as ruling out.
  - **A failed read is neither "set" nor "not set".** Reading it as "set" skips the gate; reading it as
    "not set" asks a user who has a password to choose a new one without proving the old. A failure
    signs the user out to the login page with `loginFailed`, as a failed `getBasicUserData` does.
  - The 07 census does not grow (no new public function). The pgTAP key-set assertion for
    `get_user_entities` (file 36) gains the key.
  **If wrong** (a `user_metadata` flag, option (b)): `user_metadata` is writable by the user, so the gate
  is skipped from the browser console. (`amr`, option (c)): it describes how this session began, so a
  user with a password who signs in by link is asked again. (A helper that takes a user id from the
  caller): it answers, for anyone's id, whether that account has a password.
  **Known limit of the fact itself — see D-07 and J2:** the column is true for every account created by
  a service-side `createUser` with a generated password, which includes every `identity-callback`
  account.
- **D-07 (178-B2) — rewritten. ⚠ OPERATOR REVIEW (J2).** **Every signed-in user whose account has no
  password is asked, whatever brought them.**
  *Reconciled with Phase 174's research (ruling OQ-5, research OQ-11) — the ★'s premise is false for
  identity-provider accounts:* the discussion assumed `identity-callback` users are created without a
  password (fact 13), so that a returning identity-provider user who signs in by emailed link would be
  asked on F, "which is what 'use your email to sign in next time' needs". **They carry the hash of a
  generated password**, so D-06's fact reads true for them and F is never shown — not on their initial
  registration (the exemption REG-11 wants, obtained by accident) and not when they later sign in by
  link (the case the ★ wanted to catch).
  **What this phase does:** it builds F on the column and changes nothing in `identity-callback`. A
  returning identity-provider user who signs in by link (D-09) reaches the app with no password of
  their own knowing; they can keep signing in by link, or choose a password through forgot-password
  (D-13). **What is handed to Phase 179 (O-3):** if such users should be asked on F, 179 creates them
  genuinely passwordless (the two-call recipe 174 measured) and then needs the explicit exemption
  marker the discussion foresaw; if not, nothing more is needed. The operator confirms which.
  The requirement text (REG-11: "arrived through an emailed sign-in link and has not set a password")
  is satisfied for everything 174's links create.
- **D-08 (178-B3):** **After the password is set on F the user stays signed in and the layout moves on
  to G.** The form carries the account's address in a read-only `username` field so a password manager
  can save the pair. The "password set, now sign in" state of the login page is removed.
  *Reconciled with Phase 174 (planned) and the Phase 171 and 173 outcomes:*
  - **The set-password page goes.** 174's callback sends a first-time user to
    `ContestantAppSetPassword` (`register/password`, the invitation leg that Phase 171's
    registration-code guard exempts) by the claim's `password_set`. In this phase **the callback's
    `magiclink` arm sends every user to the app root (or a validated `next`), and F decides.** The
    route key `ContestantAppSetPassword`, the page, `newUserEmail` in the contestant context and
    `showPasswordSetMessage` on the login page are deleted; the journey spec's re-login step goes.
    This also ends the defect Phase 171 handed over (the stale "password is now set" heading after a
    client-side logout).
  - **The "Cannot be defined yet" item is resolved:** a first-time user whose claim produced no
    contestant grant passes F and G and reaches the app root, which shows `NothingToEdit` with
    `ContactSupport` (173 O-10). 174's ruling 18 — "set a password, is sent to the login form and is
    refused there" — stops being true. *Residual, flagged:* that same user is still refused with 403 by
    `passwordLogin`'s grant-shape gate when they later sign in at B; the planner either words B's 403
    for it or files it.
  - `setPassword` rotates the access token; the comment in
    `supabaseDataWriter.ts` `_setPassword` describes the stale-token case and its remedy
    (`refreshSession()`). The planner measures whether the load that follows sees the new state (RQ-3).
  - The todo `2026-10-02-password-validator-username-never-passed.md` is cheap to close here: F has the
    address, and `PasswordSetter` renders `PasswordValidator` without it. Recommended, not required.
  **If wrong** (sign out and send to B, option (b)): the extra step users meet today, and a window in
  which a first-time user with no grant is refused by the login form with no explanation.

### C — The screens

- **D-09 (178-C1):** **B's "I have not set a password yet" is always enabled.** With a valid address in
  the field it requests a link (`requestSignInLink` *(174, planned)*) and goes to E, **whatever the
  address**. With an empty or malformed address it moves focus to the email field and shows "Enter your
  email address first" beside it, tied to the field.
  *Reconciled with the 179-B3 amendment of REG-02:* the button is shown when
  `isRegistrationModeAllowedForAnyType(appSettings, 'email')` **or** the same for `identity_provider`.
  **If wrong:** *an account-existence oracle on B.* The button must not look anything up before leaving
  for E; E must look the same for a known, unknown, uninvited and throttled address. The password form
  itself answers "wrong email or password" for an unknown address, a wrong password **and an account
  that has no password** — never a hint that the account exists and should use a link.
- **D-10 (178-C2) ⚠:** **A radio group.** Each allowed mode is a radio whose panel (the intro text, or
  the email or the code input) opens when it is chosen; nothing is chosen on arrival; one Continue in
  the main actions; order: identity provider, email, code. With exactly one allowed mode its panel is
  shown directly, with no radio. A mode is listed when the matrix allows it for at least one served
  entity type (`isRegistrationModeAllowedForAnyType`). The email and code modes never ask for an entity
  type. It is a new small component (D-14's library); radios in a `fieldset` with a `legend`, no custom
  ARIA.
  *Planner constraint, from 178-C4's reasoning:* Continue stays enabled and validates on press, moving
  focus to the first invalid control — the ★'s "enabled when the chosen panel is valid" would leave a
  keyboard or screen-reader user with a dead button and no reason. Flagged as a deviation from the ★'s
  letter in favour of the section's own rule (178-C4 (a) against (c), D-12).
  **Continue per mode:** identity provider → D-20; email → `requestSignInLink({ email, locale })`, then
  E; code → `checkInvitationCode({ code })` *(174, planned)*: `valid` → D1, `used` → D2, anything else
  (including a transport failure) → "We couldn't confirm your registration code." beside the field.
  **If wrong:** the code check is the one place the flow answers differently by design
  (`valid | used | unknown`, to the holder of a code). Any fourth answer — "expired", "wrong project",
  "mode disabled", a 500 shown as such — tells a guesser more than the letter's holder is entitled to.
- **D-11 (178-C3) — E's resend.**
  *Reconciled with Phase 174 J4 — the server half is not built here:* the 60-second minimum interval
  per address is the database's *(174, planned)*, and `request-link` answers
  `200 { "accepted": true }` **always**. **This phase adds the screen only:** a Resend button with a
  60-second countdown that starts on arrival and after every press, and a polite live-region
  announcement each time.
  - The countdown is cosmetic and says nothing about the server: it runs the same for every address.
    The screen shows **no** result of the request — not "sent", not "failed", not "too soon" — beyond
    the fixed text.
  - **The address shown on E is only what the user typed in this tab.** When E is reached from D2 ("I
    never set a password" for a used code) the link goes to the claimant's address, which the server
    never returns; E then shows no address at all.
  - *Reconciled with 174's residual R-c:* a new link may invalidate the unopened one before it (174-05
    measures it; the result is in `174-NAME-MAP.md` § *Measurements*). If it holds, E's text says to use
    the **newest** mail. The planner reads the measurement before the texts are written (RQ-9).
  **If wrong:** *an account-existence oracle on E* — a different text, delay, button state or announcement
  for an address that got a mail. Equally: an error surfaced from the backend (REG-10 forbids it).
- **D-12 (178-C4):** **D1 has two email fields, compared trimmed and case-insensitively.** A mismatch
  is reported under the second field when it loses focus and on submit; pasting is allowed in both;
  Continue stays enabled and validates on submit. Continue calls
  `requestSignInLink({ email, code, locale })` — the server binds the address to the code's row as its
  pending address (174 D-16) — then goes to E. The same component (`EmailEntry`) serves Phase 179's
  success screen, so its API takes no code and knows nothing of invitations.
- **D-13 (178-C5) — forgot-password.** **Forgot-password keeps its route, uses the shared email field,
  requests a recovery link from the same Edge Function as E, and then shows E with recovery wording.**
  The dead `?code` branch of `password-reset` and the `resetPassword` writer contract are removed; the
  password-reset page keeps its session branch only, with the read-only `username` field and
  `PasswordSetter` (D-15), and on success the user **stays signed in and goes to the app root**.
  *Reconciled with Phase 174 (planned) — "the same server endpoint" needs a new operation:* 174's
  `request-link` takes no purpose parameter (174-10: "a recovery request is a new operation of the same
  function"). **This phase adds one operation to `account-access`** and one writer method beside the
  four; `requestForgotPasswordEmail` is re-pointed at it or replaced by it, and
  `auth.resetPasswordForEmail` leaves the tree.
  **Planner constraints (each closes an oracle or a dead end):**
  - Same wire discipline as `request-link`: one answer for every address, returned before the work,
    the same per-address interval, the locale validated against the supported set, no caller-supplied
    text and **no caller-supplied redirect target**.
  - **Eligibility:** a recovery link goes to an address whose account holds a grant in the project. An
    address that has only an open invitation gets the ordinary sign-in link instead — it has no password
    to recover, and F will ask for one — so a first-time user who clicks "Forgot password" is not left
    waiting for nothing. Everything else gets nothing. All three are indistinguishable to the caller.
  - The callback's `recovery` arm runs the same session → claim → refresh sequence as the `magiclink`
    arm *(174, planned: `sessionAdmission.ts` `admitSession`)* before it redirects.
  - **`password-reset` and F change a password without asking for the current one**
    (`secure_password_change = false`), for any signed-in session. That is what a recovery needs, and
    it means a stolen session becomes a stolen account. Recorded as an accepted property; the planner
    states it in the threat model and does not widen it (no new route that sets a password).
  This closes `2026-06-07-hide-forgot-password-email-input-after-submitting.md` (the form is no longer
  on screen) and `password-reset-code-method.md` (the code branch is gone).
  **If wrong** (keep `resetPasswordForEmail`, option (b)): FIX-01 stays open, the mail stays GoTrue's
  English default, and the request goes around the function's gate and throttle, straight to an
  endpoint that answers differently for a registered address.

### D — Shared components (REG-13)

- **D-14 (178-D1):** **Into the app's own component library, `lib/contestant/components/`:**
  `EmailField`, `EmailEntry` (field plus confirmation), `PasswordSignIn` (password field, error,
  forgot-password link), `RegistrationCodeField`, `EmailSentPanel`, and the mode selector of D-10 —
  beside the existing `PasswordField`, `PasswordSetter` and `PasswordValidator`. Used by B, C, D1, D2,
  E, F, forgot-password and password-reset.
  *Reconciled with the Phase 173 outcome — `SupportBlock` is not built:* **`ContactSupport` exists**
  (`lib/contestant/components/contactSupport`; `action: 'help' | 'email'`, default `'help'`, linking to
  the Help page's `#support` through `SUPPORT_ANCHOR`), and the Help page already renders it with that
  anchor. E and every other screen use it as it is.
  Conventions are the library's (`Skill("components")`): props destructured from a co-located
  `.type.ts`, runes, snippets, `concatClass`, a unit test beside each component, and the *Context
  Destructuring Rule* of `CLAUDE.md` for every read of `appSettings` and the other reactive accessors.
- **D-15 (178-D2):** **Autofill tokens.**

  | Input | Attributes |
  |---|---|
  | Sign-in email (B) | `type="email" autocomplete="username"` |
  | Sign-in password (B, D2) | `autocomplete="current-password"` |
  | Set / reset password (F, password-reset) | a read-only `username` field with the account's address, then `new-password` twice |
  | Email entry (C, D1, forgot-password) | `type="email" autocomplete="email"` on both fields |
  | Registration code (C) | `type="text" autocomplete="off" autocapitalize="characters" spellcheck="false"` |

  Every input has a visible or programmatic label and a `name`. D2 has no address to show (D-11), so a
  manager fills it only from a prior save. The code field is not `one-time-code`. The code's display
  format is 174's (`XXXX-XXXX-XXXX`, Crockford base-32, case-insensitive, separators ignored); the field
  accepts it pasted with or without separators and does not reformat under the caret.

### E — Mail and password rules

- **D-16 (178-E1) ⚠ — the mail texts.** **Per-locale templates stored with the Edge Function; the
  request names the locale of the page the user is on; the link returns to that locale; a test asserts
  all seven exist for both mails.**
  *Reconciled with Phase 174 J4:* the **sign-in-link** mail in seven locales is built by 174. **This
  phase adds the reset-password mail**, in the same template store and under the same completeness
  test, and re-reads the sign-in mail's wording once F exists (it should not promise a page that no
  longer exists). The six non-English texts are constructed; the native-speaker review todo 174 files is
  extended, not duplicated.
  **If wrong** (text rendered in the app and passed to the function, option (b)): an anonymous endpoint
  that mails caller-written content from the deployment's address.
- **D-17 (178-E2) — the password rule.** **Keep the client rule; raise GoTrue's
  `minimum_password_length` to 8** in
  `apps/supabase/supabase/config.toml` `[auth]` (it is 6 on the tree; `password_requirements = ""`
  stays). The composition rules stay client-side.
  *Reconciled with Phase 174 (planned):* this is a second `[auth]` change after 174-03's, so it carries
  the same obligations — a stack restart, the repository gate 174-03 adds to `yarn lint:check` extended
  to assert the value, and a line in the docs that a hosted project's dashboard must be set to match,
  because the repository cannot enforce it. Every password the test estate and `identity-callback`
  generate must already be eight characters or longer (RQ-4).
  **If wrong** (left at 6): a direct call sets a password the UI would refuse.

### F — FIX-01

- **D-18 (178-F1) ⚠:** **Stop producing a PKCE code.** The recovery link is issued by
  the server (D-13) and carries a `token_hash` and `type=recovery` to `api/auth/callback`, whose
  `recovery` arm exists. FIX-01's wording is already amended to the outcome. The first E2E case for it
  opens the mailed link as received (D-21).
  **If wrong — completing on another device, both ways:** (PKCE, options (b) and (c)) the link fails in
  any browser but the one that asked, which is the defect. (`token_hash`, chosen) **the link is a bearer
  credential: whoever opens it first is signed in and can set the password.** That is the intended
  trade and the same one every mailed sign-in link makes; it is bounded by single use and by
  `otp_expiry`, both of which the planner asserts rather than assumes (RQ-1). A mail scanner that
  follows links with `GET` would spend the token before the user does (RQ-8); if the research finds
  that likely, a confirm-then-verify step is the remedy and is raised with the operator, not built
  silently.

### G — The legacy trees

- **D-19 (178-G1) ⚠ — what is removed here. ⚠ OPERATOR REVIEW (J4).** **This phase removes the legacy
  contents of `register/`:** `register/+page.svelte`, `register/+page.ts`, `register/password/`, the
  `checkRegistrationKey` and `register` writer contracts with `CheckRegistrationData`, and the
  `registrationKey`, `username` and `email` URL parameters. **C takes the `register` path.** For the
  email and code modes exactly one path exists at close.
  *Reconciled with Additional note 1 and the amended REG-14 — an interpretation:* the note says the
  whole `preregister` route becomes `register`, with an identity-provider subroute inside it. This file
  reads it as the **end state at the milestone's close**: one tree, `register/`, holding C at its root,
  D1 and D2 beside it, and `register/identity-provider/…` for the provider's flow. It splits the work
  so:
  - **178:** `register/` gets its final shape for everything but the provider's flow, and the name
    `register/identity-provider` is reserved (no route of this phase may take it or shadow it). The
    legacy `preregister/` tree, its `ContestantAppPreregister*` route keys and
    `api/contestant/preregister` are **not moved**: Phase 179 rebuilds that flow, and moving code one
    phase before it is rewritten would re-point two opt-in bank-auth projects for nothing.
  - **179:** builds the provider's flow at `register/identity-provider/…`, removes `preregister/`, and
    settles the fate of the API route.
  The alternative the operator may have meant — a pure rename of `preregister/` to
  `register/identity-provider/` already in this phase — is a mechanical change this plan can absorb;
  it is not chosen here because it buys nothing before 179 and puts the bank-auth specs at risk.
  *Reconciled with the Phase 171 outcome:* `register/+layout.server.ts`, `registrationCodeGuard.ts`
  (`isRegistrationCodeLeg`) and their tests guard the legacy code leg. They are rewritten for the new
  tree: `register` refuses (to the login route) when **no** registration mode is allowed
  (`isAnyRegistrationAllowed`), and D1 and D2 when the `code` mode is not allowed. The pre-registration
  guard is left as it is. Phase 171's guard tests observe a refusal by URL; the new routes need not
  keep `ssr = false`, and if they drop it those tests are rewritten, not deleted.
  **If wrong** (keep the legacy code page at another path, option (b)): the contract that returns an
  email and a first name for a code (`CheckRegistrationData`) stays reachable.
- **D-20 (178-G2):** **C lists the identity-provider mode when the matrix allows it, shows the current
  intro, and its Continue opens the existing `preregister/` start** (by the route key
  `ContestantAppPreregister`, so Phase 179 changes a destination). The login page's separate
  pre-registration button is removed.
  *Reconciled with the Phase 171 outcome:* the legacy entry is offered for **candidates only**
  (`isRegistrationModeAllowed(appSettings, 'candidate', 'identity_provider')` on today's login page,
  and `identity-callback` creates candidates only). Until 179, C lists the identity-provider option
  under **that** condition, not "for any served type": listing it for an organization-only matrix would
  send an organization's user into a flow that creates a candidate. Phase 179 widens it with the
  entity-type choice (REG-06).
  *Noted from 171:* `POST /api/contestant/preregister` is not itself gated by the mode; this phase
  does not change that endpoint (179 owns it).

### H — Verification and plan

- **D-21 (178-H1) — the E2E specs.** **New specs in `tests/tests/specs/contestant/`, each seeding its
  own invitation in a setup project through `create_invitations`** (which, this phase running after
  Phase 177.1, takes a required `p_confirm_entity` — operator decision F1 (a), 2026-10-08)**:** the
  **email** spec for a
  **candidate**, the **code** spec for an **organization**. Each drives the screens, opens the mailed
  link exactly as received, sets a password on F, passes G and reaches the entity's home. The code spec
  then enters the used code and signs in through D2. A third case covers forgot-password from inside
  the app (FIX-01). Each has a teardown that removes its user and its invitations, claimed ones
  included.
  *Reconciled with Phase 174 (planned) and the Phase 171 and 173 outcomes:*
  - "As received" is 174's rule: the helper replaces only scheme, host and port with the run's origin;
    path, locale segment, parameter names, token and type are asserted byte-identical.
  - **`toCallbackUrl` is deleted here** (174 ruling OQ-3 hands it over with one caller left, the
    journey's password-reset step) and joins the closing zero-hit searches (D-24).
  - **The matrix is now enforced on the server (D-05), so each spec's project must allow its mode for
    its entity type.** The base dataset's matrix is pinned by
    `built-in-templates-contestant-app.test.ts` and `base-app-settings.test.ts`; every perm setup
    replaces the settings row with a candidates-only one. The organization code spec either widens a
    pinned dataset (changing both pins in the same commit) or declares its own settings; the planner
    chooses and says why.
  - **The organization spec depends on Phases 175 and 176** for an organization's pages and the home.
    If either is not closed when this phase is planned, the spec's last assertion is the furthest
    screen that exists, stated in the plan as such — never a skipped step.
  - A negative case per oracle: an uninvited address and an invited one produce the same E (text,
    controls, timing bound) and only the invited one receives a mail — asserted after the function's
    work is known to be over (174's completion witness is a service-role field no screen sends).
  - Readers of the multi-entity and no-entity sessions run before the perm chain (173 O-12); the new
    specs do not consume those identities.
- **D-22 (178-H2) — axe reach.** **Scan A, B, C with each mode's panel open, D1, D2, E, F,
  forgot-password and password-reset, light and dark, through the shared `assertAxeScan`.** F is
  reached with a seeded passwordless session; D1, D2 and E by walking the flow.
  *Reconciled with the Phase 171 and 173 outcomes:* four scans of the old login states exist (sign-in
  only, code link, pre-registration collapsed, pre-registration expanded) and are the only scans
  outside `(protected)`; they are replaced by the new states, not left asserting a page that is gone.
  A new contestant surface gets an entry in `tests/tests/specs/a11y/contestant-a11y.spec.ts` in both
  themes under the session that reaches it, and the verdict's count for the scan project is updated in
  the same commit. C's "single mode shown directly" state and E's recovery wording are states too.
  A "passwordless session" must be one whose account really has an empty hash (174's two-call link
  recipe), not a `forceRegister` user.
- **D-23 (178-H3) ⚠ — plan shape.** **Five stages: (1) shared components with unit tests and messages
  in seven locales; (2) A, B, C and the gate-table change; (3) D1, D2, E, the recovery mail,
  forgot-password and FIX-01; (4) the "password set" fact, F in the layout, removal of the legacy
  `register/` contents and their contracts; (5) E2E specs, axe entries, docs, closing gate.**
  *Reconciled with the server additions (R6) and the 174 precedent:* the stages are the ★'s; **the file
  count is the planner's** (174 split four stages into ten files for the executor's context budget).
  Two orderings are fixed: **a server addition lands before the screen that calls it** — the recovery
  operation before stage 3's forgot-password, the matrix condition and `password_set` before the specs
  that depend on them — and **a removal lands only after its replacement works**. The schema edits
  (D-05, D-06) are one serial step with one migration regeneration.
- **D-24 (178-H4) — closing gate.** **The standard set, each status read from the command's own exit
  code, never through a pipe:** `yarn db:reset`, `yarn db:types` on the freshly reset database with no
  diff left, pgTAP, `yarn db:lint:sql`, schema-migration parity, the unit suites, `yarn lint:check`
  (which carries the app-name gate and 174's auth-configuration gate), `yarn format:check`, the type
  check, the production build, and **one full wrapper-driven E2E run**
  (`tests/scripts/e2e-run.sh --run-dir … --no-db-reset`) with zero failed and zero did-not-run, on a
  freshly started server.
  *Recommended additions, flagged:* (i) **the two opt-in bank-auth projects, each run alone**, because
  this phase changes the entry to the provider's flow (D-20), the gate table (D-04) and `[auth]`
  (D-17) — and 173's summary records they have not run since the login gate changed; (ii) zero-hit
  searches outside `.planning/` for `toCallbackUrl`, `checkRegistrationKey`, `CheckRegistrationData`,
  `registrationKey`, `newUserEmail`, `resetPasswordForEmail` and `ContestantAppSetPassword`, proving the
  old path is gone rather than bypassed; (iii) long gates run in the background and are polled (the
  executor watchdog). Option (b), three repeats of the new specs, is not chosen: an intermittent mail
  failure is a defect whether or not it is provoked.

### Reconciliations

| # | ★ text that assumed something since overruled or changed | Reconciled to | Cause |
|---|---|---|---|
| R1 | 178-B1 ★: "a `SECURITY DEFINER` helper … and the `(protected)` layout's server load reads it"; cross-phase "the one database addition here is 178-B1's helper" | A key on `get_user_entities`, through 174's existing private helper; `BasicUserData.passwordSet` (D-06) | the NOTE; Phase 173 O-1; Phase 174 OQ-5 |
| R2 | 178-B2 ★ and fact 13: identity-provider users have no password, so a returning one "is asked" | They carry a generated hash and are never asked; handed to 179 (D-07) | Phase 174 research OQ-11 |
| R3 | 178-B3 ★ / 174-A2: the set-password page `register/password` | Deleted; the callback lands on the app root and F decides (D-08) | 178-A2 ★ with Phase 174's callback |
| R4 | "Cannot be defined yet": what a user whose claim produced no grant sees | `NothingToEdit` at the app root, after F and G (D-08) | Phase 173 (173-B5 (b)) |
| R5 | 178-C3 ★: "the server enforces a minimum interval per address (60 seconds)" | Built by 174; this phase adds the countdown and the wording (D-11) | Phase 174 J4 |
| R6 | Cross-phase "← 174: this phase builds screens only" | Four server additions: the recovery operation and mail, the matrix condition, `password_set`, the password length (D-05, D-06, D-13, D-16, D-17) | 178-A4, 178-C5, 178-E2, 178-F1 themselves; 174-10 (no purpose parameter) |
| R7 | 178-C5 ★: "requests a recovery link through the same server endpoint as E" | A new operation of the same function, with an eligibility rule (D-13) | Phase 174 (planned) |
| R8 | 178-D1 ★: `SupportBlock`, and the help page "gains the `#support` anchor it lacks"; fact 10 | `ContactSupport` and `SUPPORT_ANCHOR` exist; nothing is built (D-14) | Phase 173 |
| R9 | 178-E1 ★: both mails are this phase's | The sign-in mail is 174's; the recovery mail is added here (D-16) | Phase 174 J4 |
| R10 | 178-A4 ★: "the functions must read the matrix in Phase 171's shape" | Kept; plus the mapping, the project-scope exemption, the claim, the corrected docblock and the SQL/TS parity test (D-05) | Phase 171 code; 174-A3 (c) |
| R11 | 178-G1 ★: "C takes the `register` path. `preregister/` stays untouched until 179" | Kept for this phase; `register/identity-provider` reserved as the end state (D-19) | Additional note 1; REG-14 as amended |
| R12 | 178-G2 ★: C lists the identity-provider mode "when the matrix allows it" | Until 179, when it is allowed **for candidates** (D-20) | Phase 171 (login page's condition) |
| R13 | 178-C1 ★ / REG-02: shown "when the email mode is allowed" | Email **or** identity-provider mode (D-09) | 179-B3; REG-02 as amended |
| R14 | 178-A2 ★: "like the terms gate" in a `layoutState` derived in the layout | One entry in `CONTESTANT_GATES`, one id, one view (D-03) | Phases 172, 173 |
| R15 | 178-H1 ★: "the code spec for an organization … reaches the home screen" | Needs the mode allowed for organizations under D-05 and Phases 175–176 closed (D-21) | 178-A4; X1 (a) |
| R16 | 178-H2 ★ / fact 16: none of these screens is scanned | Four login-state scans exist and are replaced (D-22) | Phase 171 |
| R17 | 178-H4 ★: the gate list | Types before pgTAP; the two name and configuration gates inside `lint:check`; bank-auth runs; zero-hit searches (D-24) | Phases 171, 173, 174 |
| R18 | 178-C2 ★: Continue "enabled when the chosen panel is valid" | Always enabled, validates on press (D-10) | 178-C4 ★'s own rule |
| R19 | Every anchor under `routes/candidate/`, `lib/candidate/`, `api/candidate/auth/`, `candidateApp.*` | `routes/contestant/`, `lib/contestant/`, `api/auth/`, `contestantApp.*` (name map) | Phase 170 |
| R20 | 178-F1 ★ "depends on 174-D7(a) being chosen"; "Cannot be defined yet": if 174-D2(b) or 174-D7(c) | Both took their ★; 178-C3, C5, E1 and F1 keep theirs | the filled document |

### Judgement calls

Marked ⚠ OPERATOR REVIEW where the filled document delegated or did not foresee the choice.

- **J1 — where "password set" rides (D-06):** a key on `get_user_entities`, surfaced as
  `BasicUserData.passwordSet`, with a failed read signing the user out — against a small dedicated RPC.
- **J2 — identity-provider accounts read "password set" (D-07):** F is built on the column and such
  users are never asked; whether Phase 179 makes them passwordless (and then needs the exemption
  marker) is left to 179.
- **J3 — the matrix on the server (D-05):** email row = `email` mode, code row = `code` mode, judged by
  the target's entity type; project-scope promises not judged; enforced in the code check, the link
  request **and the claim**.
- **J4 — the reading of Additional note 1 (D-19, D-20):** `register/` is the one tree at the milestone's
  close, with `register/identity-provider/…` reserved; `preregister/` is not moved in this phase.
- **J5 — `access.answersLocked` on the entry flow (not in the discussion; handed over by 171):**
  proposed: the present behaviour is kept — when answers are locked, A offers sign-in only with the
  locked notice and `register/**` refuses to the login route — and `answersLocked` becomes one more
  member of `contestant_app_public_config`, so an anonymous visitor of a closed project sees the stored
  value. The server contract is **not** conditioned on it (a returning user must be able to sign in by
  link). The operator may instead want registration open while answers are locked.
- **J6 — GoTrue's own mail endpoints (174 residual R-g, todo filed for this phase):** proposed: add the
  no-op send-email hook 174's research measured, so that `/otp` and `/recover` can no longer mail around
  the function's gate, throttle and texts — **after** RQ-5 confirms what it does to Phase 179's
  pending-address confirmation mail. The hook stops the mail, not the differing answer: with sign-up
  closed, `/otp` still tells a registered address from an unregistered one. That residual is stated in
  the docs and filed, not claimed closed.
- Not for the operator, flagged for the planner: Continue always enabled on C (D-10); the recovery
  eligibility rule (D-13); the B-side 403 for a user with no contestant grant (D-08); the
  candidates-only condition of C's provider option until 179 (D-20); the focus move in the layout
  (D-03).

### Claude's Discretion

- Route keys and file names of the new routes, within D-02 and the reserved name of D-19.
- The name of the recovery operation and of its writer method; whether `requestForgotPasswordEmail`
  survives as a name.
- How `_getBasicUserData` and stage 4 share one `get_user_entities` answer (D-06).
- The shape of the in-memory flow state in the contestant context, within D-02's constraints.
- The component split inside `EmailSentPanel` and the selector; the message key layout (existing
  namespaces `contestantApp.login`, `.register`, `.resetPassword`, `.setPassword` are reused or pruned;
  dead keys are removed in all seven locales).
- Whether the new entry-flow pages are server-rendered.
- How the passwordless session for the axe scan is seeded.

</decisions>

<factual_baseline>
## Factual baseline (178-0, accepted under D-01)

Snapshot of 2026-10-04 at `df0cec944`, **corrected to `a020545b9` (2026-10-06)** where Phases 170–173
changed a fact, and to the *planned* outcome of 174 where marked. Spot-checked on the tree for this
file: the gate list and both gate files, the user-level load and layout, the login page and its action,
the auth callback, `_getBasicUserData`, `get_user_entities`' signature, `appGates.ts`, the route map,
`ContactSupport.type.ts`, the Help page, `config.toml` `[auth]`, the function directory, the message
namespaces (`en`), the callers of `toCallbackUrl` and the pending todos. Not re-read: facts 14's client
half and 18.

1. **A and B are one page today:** `routes/contestant/login/+page.svelte` (`isLoginShown`,
   `handleShowLogin`) with its action in `login/+page.server.ts`. *(Corrected, 171:)* what it offers is
   read from the matrix accessors — `canPreregister` is
   `isRegistrationModeAllowed(appSettings, 'candidate', REGISTRATION_MODE.IdentityProvider)`,
   `canRegisterWithCode` is `isRegistrationModeAllowedForAnyType(appSettings, REGISTRATION_MODE.Code)` —
   and the heading is the app's name (`getContestantAppName`). A project allowing only `email` has no
   entry on it. It reads `contestantCtx.answersLocked`.
2. **Sign-in refuses a user with no entry grant:** `lib/auth/passwordLogin.ts` returns 400, 403 or 500;
   the shapes are `CONTESTANT_GRANTS` in `lib/auth/roles.ts`. *(174, planned:)* the claim and the
   refresh run before that gate, in one module.
3. **The legacy code page always fails:** `routes/contestant/register/+page.svelte`;
   `supabaseDataWriter.ts` `_checkRegistrationKey` throws; `CheckRegistrationData` in
   `lib/api/base/dataWriter.type.ts`. *(Corrected, 171:)* the tree is guarded by
   `register/+layout.server.ts` and `registrationCodeGuard.ts` (`isRegistrationCodeLeg`).
4. **Setting a first password ends in a second sign-in:** `register/password/+page.svelte` sets the
   password, stores `contestantCtx.newUserEmail` and goes to the login page, which shows
   `contestantApp.setPassword.passwordSetSuccesfully` as its heading.
5. **FIX-01:** the callback is `routes/api/auth/callback/+server.ts` *(corrected, 170)*; it reads
   `token_hash`, `type` and `next`, and a `code` falls through to `errorMessage=authError`.
   `_requestForgotPasswordEmail` calls `auth.resetPasswordForEmail` on the browser client. *(174,
   planned:)* the callback gains a `magiclink` arm with claim and refresh, and loses its `invite` arm.
6. **The PKCE verifier may be readable by the server client** (cookies). Unmeasured, and moot under
   D-18.
7. **`password-reset` has a dead branch:** it reads `?code`, and `_resetPassword` ignores the code and
   calls `updateUser`. Only the session branch (`isSessionFlow`) works.
8. **The forgot-password input stays on screen after success**, with no `autocomplete` and no visible
   label (`routes/contestant/forgot-password/+page.svelte`).
9. **Shared components:** `lib/contestant/components/` holds `passwordField`, `passwordSetter`,
   `passwordValidator`, `termsOfUse`, `preregisteredNotification` and *(corrected, 173)*
   `contactSupport`, `nothingToEdit`, `logoutButton`. There is no email field, email-with-confirmation
   or sign-in form component; the only email-plus-confirmation pair is inline in
   `preregister/(authenticated)/email/+page.svelte`.
10. *(Corrected, 173 — the fact is no longer true.)* **The support block exists**
    (`ContactSupport`), and the Help page carries the `support` anchor.
11. **The session gate knows one public route:** `appGateHandle` in `hooks.server.ts` over
    `CONTESTANT_GATE` in `lib/routes/appGates.ts` (`whenAuthenticatedOnLogin`,
    `whenUnauthenticatedInProtectedGroup`, which carries `redirectTo`).
12. *(Corrected, 172–173.)* **The gates are a list:** `lib/contestant/gates/gates.ts`
    (`CONTESTANT_GATES`, `firstNeededGate`, `ContestantGateId = 'termsOfUse'`), `gateViews.ts`
    (`GATE_VIEWS`), and the four-stage load in `routes/contestant/(protected)/+layout.server.ts`. No
    sign-out for a missing entity or nomination happens at this level.
13. **Nothing on the tree reads whether a password is set.** *(174, planned:)*
    `private.user_password_set` and `claim_invitations`' `password_set`. *(Corrected, 174 research:)*
    `identity-callback` users **carry a generated password hash**; a user created by 174's link recipe
    has an empty one until they choose a password.
14. **The client and the auth service disagree on the password rule:** the client requires 8 characters
    plus composition rules (`lib/utils/password-validation/passwordValidation.ts`); `config.toml` has
    `minimum_password_length = 6`, `password_requirements = ""` (verified).
15. **Auth mail:** no GoTrue template block is active. *(174, planned:)* the sign-in mail is sent by
    `account-access` in seven locales; the recovery mail is still GoTrue's English default until D-13.
16. *(Corrected, 171.)* **Four axe scans cover the old login states**; every other route outside
    `(protected)` is unscanned. The spec is `tests/tests/specs/a11y/contestant-a11y.spec.ts`.
17. **`toCallbackUrl`** (`tests/tests/fixtures/shared/emailBucket.fixture.ts`) is called by
    `contestant-journey.spec.ts` and `perm-localisation-positive.spec.ts` on the tree. *(174,
    planned:)* one caller remains, the journey's password-reset step.
18. `Expander`, `AccordionSelect` and native radios exist; none is a one-of-many panel selector.
19. Message namespaces `contestantApp.login`, `.register`, `.resetPassword`, `.setPassword`,
    `.preregister` and `.nothingToEdit` exist. "We couldn't confirm your registration code." and every
    E, D1, D2 and F-gate text are new.

**Found while reconciling, not in 178-0:**

20. **Public sign-up is closed and confirmations are on** on the tree: `[auth] enable_signup = false`,
    `[auth.email] enable_confirmations = true`; `secure_password_change = false`;
    `max_frequency = "1s"`; `otp_expiry = 3600`.
21. **`functions/` holds `identity-callback`, `invite-candidate` and `send-email`** at `a020545b9`:
    `account-access` and the four writer methods are not on the tree yet.
22. **`getBasicUserData` calls no RPC**; `get_user_entities(p_project_id)` is `SECURITY INVOKER` and
    returns `jsonb` (D-06).
23. **`redirectTo` and `next` are validated in one place:** `safeRedirectTarget`
    (`lib/routes/loginRedirectTarget.ts`), used by the login action and the callback.
24. `.planning/todos/pending/` also holds `password-reset-code-method.md`,
    `2026-10-02-password-validator-username-never-passed.md`,
    `2026-06-07-supabase-email-link-not-pointing-to-localhost-in-local-dev.md` and
    `2026-10-06-173-terms-of-use-view-phone-overflow-and-focus.md`.

### Cannot be defined yet — as the filled document and the later phases resolve it

| Item in the section | Status |
|---|---|
| Every server contract behind C, D1, D2 and E | **Resolved:** `account-access` (`check-code`, `request-link`, `code-sign-in`), `claim_invitations`; writer methods `checkInvitationCode`, `requestSignInLink`, `signInWithInvitationCode`, `claimInvitations`; helper `invitationCodeLogin` for D2's action. Planned by 174, not yet on the tree. |
| Which modes C can list, and how the matrix is read | **Resolved:** the accessors of `contestantAppConfig.ts`; `preRegistration.enabled` is gone. |
| The file F is added to | **Resolved:** the gate list (D-03). |
| How an identity-provider session is told apart from an emailed-link one | **Changed:** not needed by this phase — such accounts read "password set" (D-07). Phase 179's, if it makes them passwordless. |
| Whether a link-created user has an empty `encrypted_password` | **Resolved by 174's research:** yes, under its two-call recipe; `generateLink({ type: 'magiclink' })` alone for an unknown address does not. Re-measured in RQ-2. |
| Route constant and directory names | **Resolved:** the name map of Phase 170. |
| What a user whose claim produced no grant sees | **Resolved:** `NothingToEdit` (D-08). |

### Research items — measured on the local stack by the planner's researcher

Nothing below was measured for this file.

- **RQ-1 — the recovery link.** `auth.admin.generateLink({ type: 'recovery' })` for an account with a
  password, for a passwordless one and for an unknown address: is a user created; does a link built
  from `hashed_token` verify through `verifyOtp({ token_hash, type: 'recovery' })` on the server
  client; **does verifying change `encrypted_password`** (an `invite` token does); is the token single
  use; does it expire at `otp_expiry`; does issuing a recovery token invalidate an unopened sign-in
  token, and the reverse.
- **RQ-2 — the truth table of "password set"** for every account origin on this stack: 174's link
  recipe before and after the first sign-in, `forceRegister`, `identity-callback`, after
  `updateUser({ password })`, after a recovery verify.
- **RQ-3 — setting a password on a link session:** that `updateUser({ password })` succeeds without
  re-authentication under the committed configuration, what it does to the token and the cookies, and
  whether the user-level load that follows reads `password_set = true` without an explicit
  `refreshSession()`.
- **RQ-4 — `minimum_password_length = 8`:** which calls it binds (`updateUser`, admin `createUser`,
  sign-in with an existing shorter password), and that every password the test estate, dev-seed and
  `identity-callback` generate is long enough.
- **RQ-5 — a no-op send-email hook (J6):** what it does to `/otp`, `/recover`, admin `generateLink`,
  and an email change (Phase 179's pending-address mail, 179-B1); what `/otp` and `/recover` answer for
  an unknown address with sign-up closed.
- **RQ-6 — the matrix in SQL (D-05):** where the stored matrix is read from inside the invitation
  functions, for an open and a closed project, and a parity test against
  `getEffectiveRegistrationModes` for every stored shape including "nothing stored".
- **RQ-7 — password managers and autofill (D-15):** which of the table's promises can be asserted by a
  test (attributes) and which need a manual check in two browsers; the manual list goes into the plan's
  verification.
- **RQ-8 — link prefetch:** whether a `GET` that verifies a single-use token is spent by common mail
  scanners (desk research), and what the callback could do about it.
- **RQ-9 — 174's measurements this phase's texts depend on:** the re-issue result (R-c), and what the
  function observes of its caller — read from `174-NAME-MAP.md` § *Measurements* and § *The server
  contract for Phase 178* once 174-05 has run.
- **RQ-10 — the flow state under SSR (D-02):** that the context's value is per request on the server
  and survives client-side navigation between the steps, including the redirect-on-reload behaviour.
- **RQ-11 — B's answers:** that the password form's failure is the same in status, body and rough
  timing for an unknown address, a wrong password and a passwordless account.

</factual_baseline>

<expected_tree>
## The tree this phase is planned against

**Phases 170–173 are executed and were read on the tree at `a020545b9`. Phase 174 is executing (01–02
done, 03 at an operator checkpoint): everything stated about 174-03..10 is planned. Phases 175, 176
and 177 have not started; this phase depends on 176.** The planner re-reads the tree.

### Name map

| The discussion document says | The tree says |
|---|---|
| `routes/candidate/…`, `lib/candidate/components/` | `routes/contestant/…`, `lib/contestant/components/` (`$contestant`) |
| `routes/api/candidate/auth/callback/+server.ts` | `routes/api/auth/callback/+server.ts` (`AuthCallback`, `AuthLogout`) |
| `CANDIDATE_GRANTS`, `CANDIDATE_GATE` | `CONTESTANT_GRANTS`, `CONTESTANT_GATE` |
| `candidateApp.*` messages | `contestantApp.*` |
| `candidate-a11y.spec.ts`, `candidate-journey.spec.ts` | `contestant-a11y.spec.ts`, `contestant-journey.spec.ts` |
| `preRegistration.enabled` | `contestantApp.registrationModes` through the accessors |
| the `(protected)` layout's `layoutState` | `CONTESTANT_GATES` / `GATE_VIEWS`; routes under `/contestant/<type>/<id>/…` (`CONTESTANT_ENTITY`) |
| `SupportBlock` | `ContactSupport` |

### Inherited from Phase 171 (executed)
- `getServedEntityTypes`, `getEffectiveRegistrationModes`, `isRegistrationModeAllowed`,
  `isRegistrationModeAllowedForAnyType`, `isAnyRegistrationAllowed`, `REGISTRATION_MODE`
  (`packages/app-shared/src/settings/contestantAppConfig.ts`).
- `public.contestant_app_public_config(p_project_id)` — anon-readable; one more member is one more key
  in the function, one copied member in the provider and one key in the pgTAP key-set assertion (J5).
- The gate drivers `171-e2e.sh`, `171-gates.sh`, `171-bankauth.sh` as models; the two bank-auth
  projects cannot share a run.

### Inherited from Phases 172–173 (executed)
- The gate list holds the terms gate only; predicates receive `BasicUserData`.
- The app root has three outcomes: no entity → `NothingToEdit`; one → redirect to it; several → the
  profile-selection screen.
- `get_user_entities` returns one object; `LogoutButton` logs out at once when no entity is loaded.
- Open defects: the terms view overflows at 390px and leaves focus on `<body>`.

### Inherited from Phase 174 (planned)
- `account-access`: `check-code` → `{ status: valid | used | unknown }`; `request-link`
  (`email` and/or `code`, optional `locale`) → `{ accepted: true }` always; `code-sign-in` →
  `{ result: 'signed-in', … }` or `{ result: 'invalid-credentials' }`. No purpose parameter.
- Session → `claim_invitations` → `refreshSession()` → gates, in the callback, both login actions and
  `invitationCodeLogin`; the claim returns `password_set`.
- Every mailed link is a `magiclink` built from `SITE_URL`, a validated locale and the token; nothing
  from the request reaches the link.
- Residuals R-a..R-g; no per-caller limit.

### Expected from Phases 175–176 (not started)
- Organization pages (175) and the home with task state (176). "Reaches the home screen" in D-21 means
  whatever home exists when this phase is planned.

</expected_tree>

<cross_phase>
## Cross-phase Notes and Obligations

- **O-1 ← 174 (hard).** Session → claim → refresh → gates, in every entry point this phase adds or
  changes: the callback's `recovery` arm (D-13) and D2's action (through `invitationCodeLogin`). No new
  entry point establishes a session by another path.
- **O-2 ← 174.** `toCallbackUrl` and its zero-hit search (D-21, D-24); the `/otp` todo (J6); the
  re-issue fact for E (D-11); the no-grant invitee (D-08).
- **O-3 → 179.** (i) Identity-provider accounts read "password set" (D-07, J2). (ii) `EmailEntry` is
  CI1's component; its API knows nothing of invitations (D-12). (iii) C lists the provider's option for
  candidates only and opens the legacy start by route key; 179 adds the type choice and swaps the
  target (D-20). (iv) `register/identity-provider/…` is reserved; `preregister/`, its route keys and
  `api/contestant/preregister` are 179's to remove (D-19). (v) A returning identity-provider user is
  sent to B's "I have not set a password yet"; that works only if the address they typed is the
  account's sign-in address, which is 179-B1's decision, bounded by 174's rule that a claim trusts a
  confirmed address only. (vi) If J6's hook is adopted, GoTrue sends no mail of its own: 179's
  pending-address confirmation must be sent by a function.
- **O-4 → 171.** The docblock in `contestantAppConfig.ts` on invitations is corrected (D-05); docs that
  say an email-only project has no entry "in this release" are made true.
- **O-5 → 175 / 176 / 177 — schema seriality.** This phase edits `schema/503-entity-rpcs.sql` and
  `schema/506-invitation-rpcs.sql` and regenerates the single migration after whichever ran last.
- **O-6 → 173.** The focus move for gates lands in the layout (D-03); the todo's overflow half stays
  open.
- **O-7 — the stack restart.** `config.toml` `[auth]` changes (D-17, and J6's hook): every developer
  and every gate run restarts the stack once.
- **O-8 — docs.** The docs-site pages on registration, pre-registration, authentication and password
  reset, `routes/contestant/README.md`, `apps/supabase/README.md` and the deployment notes (dashboard
  settings that must match: password length, sign-up closed, the hook) are updated in the plan that
  removes the legacy contents. `CLAUDE.md` follows 174's precedent: the sentences this phase makes
  false are quoted with their replacements in the closing summary. Population by search, not by this
  list.
- **O-9 — todos.** Closed here: the three the roadmap names, plus `password-reset-code-method.md`
  (D-13). Re-checked and closed or re-filed: `2026-06-07-supabase-email-link-not-pointing-to-localhost-in-local-dev.md`
  (made moot by 174's `SITE_URL` ruling). Optional: `2026-10-02-password-validator-username-never-passed.md`
  (D-08). Not in scope: `2026-06-05-migrate-supabase-auth-code-from-routes-to-adapters.md` — new auth
  calls go through the data writer; existing route-level calls are not migrated. To file: the `/otp`
  response oracle that survives J6; the B-side 403 of D-08 if not handled.

</cross_phase>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### The phase's own contract
- `.planning/v2.16-DISCUSSION-POINTS.md` § *Phase 178* (24 decisions, 19 facts), § *Cross-phase picture*,
  § *Additional notes* (1), the cross-phase notes of 174 and 179.
- `.planning/ROADMAP.md` § v2.16 (standing rules) and § Phase 178; `.planning/REQUIREMENTS.md` — REG-01,
  REG-02, REG-03, REG-09, REG-10, REG-11, REG-13, REG-14, FIX-01, E2E-01, E2E-03.
- `CAND-APP-PLAN.md` — screens A, B, C, D1, D2, E, F and § *Common notes* (read-only).

### Upstream phases
- `.planning/phases/174-invitations-grants-defined-in-advance/174-CONTEXT.md` (D-10..D-16, J1–J4);
  `174-01-PLAN.md` § *Rulings and deviations for operator review* and residuals R-a..R-g;
  `174-05-PLAN.md` § *The wire contract this plan fixes*; `174-08-PLAN.md` § *Where each piece of the
  server contract lives*; `174-10-PLAN.md`; `174-RESEARCH.md` § RQ-2, RQ-4, RQ-7, OQ-11;
  `174-NAME-MAP.md` § *The server contract for Phase 178*, § *Measurements*, § *Obligations to later
  phases* (once written).
- `.planning/phases/173-multi-entity-grants-entity-selection/173-13-SUMMARY.md` § *What Later Phases
  Must Know*, § *Known Open Defects*; `173-NAME-MAP.md` § *Obligations to later phases* only.
- `.planning/phases/171-project-settings-served-entity-types-registration-mode-matri/171-04-SUMMARY.md`
  § *What Later Phases Must Know*; `171-02-SUMMARY.md` § *The `access.answersLocked` Hand-over to Phase
  178*; `deferred-items.md` (the stale heading).

### Frontend
- `routes/contestant/login/`, `register/`, `forgot-password/`, `password-reset/`, `help/`,
  `(protected)/+layout.server.ts`, `(protected)/+layout.svelte`, `(protected)/+page.svelte`.
- `routes/api/auth/callback/+server.ts`; `hooks.server.ts` (`appGateHandle`).
- `lib/contestant/gates/`; `lib/contestant/components/`; `lib/auth/` (`passwordLogin`, `roles`);
  `lib/routes/` (`route.ts`, `appGates.ts`, `loginRedirectTarget.ts`).
- `lib/api/base/dataWriter.type.ts` (`BasicUserData`, `CheckRegistrationData`),
  `lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts`.
- `lib/contexts/contestant/`; `apps/frontend/messages/{da,en,et,fi,fr,lb,sv}/contestantApp.*.json`.
- `packages/app-shared/src/settings/contestantAppConfig.ts`.

### Backend
- `schema/503-entity-rpcs.sql` (`get_user_entities`), `schema/506-invitation-rpcs.sql`,
  `schema/106-app-settings.sql`; `functions/account-access/` *(174, planned)*, `functions/send-email/`;
  `config.toml` `[auth]`, `[auth.email]`, `[auth.hook.*]`;
  `tests/database/07-rpc-security.test.sql`, `36-entity-identity.test.sql`.

### Tests
- `tests/tests/specs/contestant/`, `tests/tests/specs/a11y/contestant-a11y.spec.ts`,
  `tests/tests/fixtures/shared/emailBucket.fixture.ts`, `tests/tests/utils/supabaseAdminClient.ts`,
  `tests/playwright.config.ts`; `packages/dev-seed/src/templates/e2e/base.ts` and its two pins.

### Standing project rules and skills
- `CLAUDE.md` § E2E Hard Rule, § E2E preflight, § Comment Hygiene, § Context Destructuring Rule,
  § Results Navigation Invariants (the user-level load reads no `url` property tracked).
- `.agents/code-review-checklist.md`; `Skill("components")`; `Skill("database")`.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable assets, by screen (visual detail is the UI spec's)

| Screen | Compose from |
|---|---|
| A | `MainContent` with the `heading` snippet and `HeadingGroup`; the frontpage layout with the poster through `topBarSettings.use` and `pageStyles.use`, as today's login page; `getContestantAppName`; two `Button`s with `href` (`variant="main"` for the primary); the secondary links (help, voter app) and `Footer` as today |
| B | `EmailField` + `PasswordSignIn` (new, over `PasswordField`); `ErrorMessage inline`; `Button` with `loading`; the form-action pattern of `login/+page.server.ts` with `use:enhance` and the hidden `redirectTo` |
| C | the new radio-group selector; the identity-provider intro from the existing `contestantApp.preregister` texts; `EmailField`; `RegistrationCodeField`; one main `Button` |
| D1 | `EmailEntry` |
| D2 | `PasswordSignIn` without an address; a form action calling `invitationCodeLogin`; the "request a link" secondary action leading to E |
| E | `EmailSentPanel` (fixed texts, countdown, polite live region) + `ContactSupport` (default `action="help"`) |
| F | a gate view beside `TermsOfUseGate.svelte`; `PasswordSetter` + `PasswordValidator` with the read-only `username` field; `LogoutButton` so the user is never trapped |
| forgot-password / password-reset | `EmailField` → E; `PasswordSetter` as on F |

### Established patterns
- **A gate is one list entry, one id, one view**; the server decides, the layout renders.
- **No oracle:** one answer for "not yours", "not there" and "not allowed", in status, body and timing.
- **Auth calls go through the data writer**; a session is established on the request's own server
  client so the cookies ride that response.
- **Every redirect target is a route key through `buildRoute`**; a caller-supplied path goes through
  `safeRedirectTarget` first.
- **Reactive context accessors are read as `ctx.X`**, never destructured; `dataRoot` is never aliased.
- **A page's accepted states are each scanned by axe**, in both themes.

### Integration points
- `CONTESTANT_GATES` / `GATE_VIEWS` (F); `CONTESTANT_GATE` in `appGates.ts` (D-04); the callback's arms
  (D-08, D-13); `BasicUserData` and `_getBasicUserData` (D-06); the contestant context (flow state,
  removal of `newUserEmail`); `route.ts` (new keys, removal of `ContestantAppSetPassword`).

</code_context>

<specifics>
## Specific Ideas

- **The operator's words** (`CAND-APP-PLAN.md`): "Each step is its own view." · B: "add a button 'I have
  not set a password yet' which will trigger => E (if email entered)" · C: "list each as an expandable
  option with the Continue button in the main actions; If just one, show only that" · code errors: "We
  couldn't confirm your registration code." · D2: "It seems you have already registered. Enter your
  password to sign in." · E: "We've sent an email to the address you provided. Click on the link in it
  to sign in." / "If you can't find the email, check you spam folder and that you typed your email
  address correctly." / "If the problem persist contact support." / "Resend (with suitable rate limit)"
  / "Don't surface any error from the backend if the email is invalid." · F: "Control this and other
  such gates on the layout level" · "Make sure all inputs are typed accordingly and accept auto-fills
  and password-specific browser behaviours".
- **The threat list the plan's threat model must cover:**
  - *account-existence oracles* on A (none: it shows only the public matrix), B (D-09), C's email
    option and E (D-11), forgot-password (D-13), and through GoTrue's own endpoints (J6);
  - *the code answer* carrying more than `valid | used | unknown` (D-10), and D2 disclosing the
    claimant's address (D-11);
  - *the set-password gate being skippable* — a forgeable source (D-06), a client-side hide (D-03), a
    failed read taken as "set" (D-06), a `(protected)` page that loads before the gates;
  - *password reset completing on another device* — failing there (PKCE), or succeeding for whoever
    holds the link (D-18), and any signed-in session being able to set a password (D-13);
  - *open redirects* — `redirectTo` on B's and D2's actions and `next` on the callback go through
    `safeRedirectTarget` and nothing else; **no request to `account-access` carries a redirect target,
    a URL or a path**, because whatever it carried would be mailed from the deployment's address; the
    locale is validated against the supported set; the signed-in redirect of D-04 has no parameter;
  - *a credential in the URL, history or storage* (D-02);
  - *a second registration over a live session* (D-04);
  - *a mode switched off that stays open* (D-05);
  - *caller-written mail* (D-16).
- **Every screen's entry in the plan names its states** (idle, invalid, submitting, error; C per mode
  and single-mode; E per wording, with and without a shown address) — they are what the unit tests, the
  axe entries and the UI spec enumerate.

</specifics>

<deferred>
## Deferred Ideas

- **Identity-provider registration, the entity-type choice in C, the removal of `preregister/`, F's
  exemption marker** — Phase 179.
- **Making identity-provider accounts passwordless** — Phase 179, if J2 is answered that way.
- **A per-caller or gateway-level rate limit, a captcha** — 174's residuals and todo.
- **Mirroring the composition rules in GoTrue's `password_requirements`** (178-E2 (c)).
- **A confirm-then-verify step for mailed links** — only if RQ-8 calls for it, and then raised first.
- **A database-enforced "password set" or "terms accepted" condition on writes** — the gates are view
  gates (D-03).
- **Carrying a deep-link target through a mailed sign-in link** — a user sent to the login page from a
  protected URL who then asks for a link lands on the app root.
- **Repeating the new specs three times at close** (178-H4 (b)).
- **The 390px overflow of the terms view** — its own todo.

### Ambiguities and contradictions found while reconciling

Line numbers are those of `.planning/v2.16-DISCUSSION-POINTS.md` at `e4813bf65`, given for the
operator's review only; no decision above is anchored on them.

1. **Line 2332 (178-B1)** — the ticked box is the ★ itself, which the document's rule reads as an
   overrule of nothing; and its NOTE ("bundle this in user data retrieval rpc") contradicts the option's
   own text ("a helper … and the `(protected)` layout's server load reads it") and **line 2506** ("the
   one database addition here is 178-B1's 'password set' helper"). → D-06, J1.
2. **Line 2341 (178-B2 ★)** and **line 2276 (fact 13)** say identity-provider users have no password;
   174's research measured a generated hash. → D-07, J2.
3. **Line 2320 (178-A4 ★)** against **line 1498** (174: the matrix is not read) and Phase 171's executed
   docblock ("an invitation … is not a registration mode"). → D-05, J3.
4. **Line 2453 (178-G1 ★)** — "`preregister/` stays untouched until 179" — against **Additional note 1
   (line 2786)**, "change the whole preregister route to register". → D-19, J4.
5. **Line 2506** ("this phase builds screens only") against **lines 2390 and 2441** (a recovery link
   from the server endpoint), **2320** (server-side matrix) and **2429** (auth configuration). → R6.
6. **Line 2376 (178-C3 ★)** puts the 60-second interval here; 174 J4 took it. → D-11.
7. **Line 2402 (178-D1 ★)** and **line 2273 (fact 10)** build a `SupportBlock` and a `#support` anchor
   that Phase 173 has since built. → D-14.
8. **Line 2367 (178-C2 ★)**, Continue "enabled when the chosen panel is valid", against **line 2382
   (178-C4 ★)**, which rejects a disabled Continue for the same screen family. → D-10.
9. **Line 2459 (178-G2 ★)** lists the provider's option "when the matrix allows it"; the legacy flow it
   opens creates candidates only. → D-20.
10. **Line 2470 (178-H1 ★)** has the code spec register an organization and reach the home, while X1 (a)
    (**line 116**) leaves the base dataset at `organization: []` and Phases 175–176 are not built. →
    D-21.
11. **Line 2297 (178-A1 ★)** carries the code "in the contestant context, never in the URL", while D2
    signs in through a server action (174); the code is posted in the form body. → D-02.
12. **Not in the section at all:** `access.answersLocked` on the rebuilt entry flow, handed over by
    Phase 171. → J5.

</deferred>

---

*Phase: 178-sign-in-email-code-registration*
*Context gathered: 2026-10-06 from the operator-filled `.planning/v2.16-DISCUSSION-POINTS.md`, the
amended `ROADMAP.md` and `REQUIREMENTS.md`, `CAND-APP-PLAN.md`, the Phase 171 and 173 summaries, the
Phase 174 context and plans, and the tree at `a020545b9`*
