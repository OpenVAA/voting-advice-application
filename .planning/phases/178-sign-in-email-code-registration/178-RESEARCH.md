# Phase 178: Sign-in, Email & Code Registration - Research

**Researched:** 2026-10-11
**Domain:** SvelteKit 2 entry flow (Svelte 5 runes) over a Supabase Auth (GoTrue) backend: mailed `token_hash` links, an Edge Function contract, SQL eligibility functions, in-layout gates, E2E over real mail
**Confidence:** HIGH for the tree as it stands (read this session at `b8fc8ac12`); MEDIUM for the auth service's behaviour (measured by Phase 174's research on the same GoTrue version, and read from its source this session, not re-run); LOW for the six research items that need a write to the local stack, which this session was forbidden to make

<user_constraints>
## User Constraints (from CONTEXT.md)

Copied verbatim from `178-CONTEXT.md` (gathered 2026-10-06, last edited by `c46ad8f92`): its `## Implementation Decisions` up to `### Claude's Discretion`, that subsection, and its `## Deferred Ideas`. Nothing between this paragraph and `</user_constraints>` is this researcher's wording. Where the tree has since moved, the correction is in § *The tree as it stands* and § *Grounding the judgement calls*, never here.

### Locked Decisions

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

### Deferred Ideas (OUT OF SCOPE)

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

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description (REQUIREMENTS.md) | Research support |
|----|-------------------------------|------------------|
| REG-01 | The login screen offers "Sign in with email" and, when any registration mode is allowed, "Register" (A). | § *The tree as it stands* rows T1, T6; § *Pattern 2* (A is two links, B owns the form); `isAnyRegistrationAllowed` exists; the helper re-point of § *The E2E estate that drives the entry pages* is the cost |
| REG-02 | When the email mode or the identity-provider mode is allowed for any served type, "I have not set a password yet" asks for a sign-in email (B). | `isRegistrationModeAllowedForAnyType` exists; `requestSignInLink` exists and already serves a returning user who holds a grant (§ *RQ status* RQ-9); § *Pitfall 6* (the oracle on B) |
| REG-03 | The mode selector lists each allowed mode as an expandable option with one Continue, or shows the single allowed mode directly (C). | § *Pattern 4* (radio group, only the chosen panel in the DOM); § *Grounding the judgement calls* J4 (route names); D-20's candidates-only condition |
| REG-09 | Register with a code: valid → enter and confirm an email; used → password sign-in; anything else → "We couldn't confirm your registration code." (C, D1, D2). | `checkInvitationCode`, `invitationCodeLogin` (no caller yet) and `signInWithInvitationCode` exist; § *Pattern 3* (flow state in the context, the `newUserEmail` precedent); § *Code Examples* D2's action |
| REG-10 | Register by email, sent a sign-in link; E offers a rate-limited resend, links to support, never surfaces a backend error (E). | The 60-second slot and the uniform answer are built (174); § *Pitfall 4* (the countdown races the server's slot); § *Pitfall 5* (a later link kills the earlier one, across both link kinds) |
| REG-11 | A user who arrived by emailed link and has no password must set one, enforced at layout level (F). | § *Grounding* J1 and J2; § *Pattern 1* (one gate entry, one id, one view; the focus move is already built); § *Pitfall 1* (the helper is not callable from an invoker function, and is defined after the file that needs it) |
| REG-13 | Shared sign-in, password and email-entry components, with the type and autocomplete hints autofill and password managers need. | § *RQ status* RQ-7; § *Pitfall 8* (`PasswordSetter` is its own `<form>`, both fields are `name="password"`, the submit button is outside it); § *Don't Hand-Roll* |
| FIX-01 | A password-reset link requested from inside the app completes and signs the user in, in whichever browser or device it is opened. | § *RQ status* RQ-1 (recovery and magiclink are one token family in GoTrue; verifying neither touches the password); § *Pattern 5* (a new operation of `account-access`); § *Pitfall 5* |

Also carried, in part, by the context: **REG-14** (the legacy `register/` contents go here), **E2E-01** (email and code specs), **E2E-03** (closing criterion).
</phase_requirements>

## How to read this file

- **Tags.** `[VERIFIED: <path> "<anchor>"]` means the file was opened this session and the quoted text is in it. `[MEASURED: <command>]` means a command was run this session and its output is what the claim rests on. `[CITED: <source>]` means the claim is taken from that source and was not re-run here; the auth service's source code is cited and not verified, because it was read through a fetch that quoted it. `[ASSUMED]` is training knowledge.
- **UNCONFIRMED** marks every behavioural or root-cause claim that was not observed by running something this session, whatever its source. A claim cited from Phase 174's measurements is `[CITED]` and UNCONFIRMED on this tree.
- **Code is cited by content anchor**, a path and a quoted string or symbol, never by line number.
- **What was run this session:** read-only `psql` against the local database (password states, function rights, stored matrices, invitation counts), `docker ps` (image versions), `git grep`, the GSD seams. **What was not run:** any E2E spec, any unit suite, any call that writes to the local database or the auth service, any stack restart. Other agents were running E2E and editing `tests/` in this worktree, and the host rules forbade all of it.
- Frontend paths are relative to `apps/frontend/src/` unless they start with `apps/`; `schema/`, `functions/` and `tests/database/` are relative to `apps/supabase/supabase/`.

## Summary

The context was written before Phases 174, 174.1, 175 and 176 closed. Everything it marked *(174, planned)* is on the tree and matches its description: the `account-access` function with three operations, the four writer methods, `admitSession`, `invitationCodeLogin` (still without a caller), `claim_invitations` returning `password_set`, and a callback whose `magiclink` arm sends a passwordless user to the set-password page. Two things the context expected this phase to build are already built: the callback claims and refreshes before **every** arm, the `recovery` arm included, and the protected layout already moves focus when one view replaces another without a navigation (Phase 174.1), so F inherits the focus move with no code of its own.

Four findings change the size or the shape of the plan and are not in the context. **(1) The server-side matrix (D-05) turns most of the existing invitation test estate red unless the fixtures move with it.** The shipped default matrix allows no mode at all; the pgTAP fixture projects store no matrix; and the base E2E dataset allows nothing for organizations while `invitation-contract.spec.ts` invites an organization by code and by email. Factions and alliances have no matrix row at all, and the claim's skip reasons are a closed set in a zod schema, so a new reason would fail every affected sign-in. **(2) D-06 cannot be implemented as written:** `private.user_password_set` is executable by no API role, so the `SECURITY INVOKER` function `get_user_entities` cannot call it, and it is defined in a schema file that is concatenated after the one that would call it. A zero-argument definer wrapper for `auth.uid()` solves both. **(3) In GoTrue a `magiclink` token and a `recovery` token are the same token family:** one storage column, one verify handler, each verifiable as the other, and a later one of either kind replaces an unopened earlier one of either kind. The `type` in a mailed link is therefore a landing hint and not a control, and the recovery operation must share the sign-in operation's per-address slot. **(4) The sign-in helper that every stored session in the suite goes through waits for an email field on the page a protected URL redirects to.** That page becomes A, which has no field, so the A/B split and the helper's re-point are one green step or the whole suite is red.

Six research items the context handed to this researcher (RQ-1 residue, RQ-2, RQ-3, RQ-4, RQ-5, RQ-11) need a user created, a link minted or the stack restarted. They could not be run here and are specified below as one probe script for the plan's first wave.

**Primary recommendation:** plan it as the context's five stages with a measuring wave in front and the schema as one serial step behind it; land B as a new route and re-point every sign-in helper to it **before** A loses its form; put the matrix condition on open candidate and organization invitations only, filtered out rather than reported as skipped, with the pgTAP and E2E fixtures given a matrix in the same commit; and treat the mailed link's `type` as a landing hint everywhere.

## The tree as it stands (the context's `<expected_tree>`, re-read)

Head `b8fc8ac12`. Phases 170 to 176 and 174.1 are executed; Phase 177 is planned (21 plans, no summary on disk) and not executed; Phase 177.1's directory is empty and its discussion document (`.planning/v2.16-177.1-180-DISCUSSION-POINTS.md`, committed as `0d2a6ed24` during this session, no box ticked) is unanswered. Three commits landed while this research ran (`0d2a6ed24`, `1f765a6db`, `0eda37dbe`); they change the E2E wrapper, `tests/README.md` and planning files, and no file a finding below rests on ([MEASURED: `git diff --stat b8fc8ac12..HEAD`]).

| # | The context says | The tree says | Evidence |
|---|---|---|---|
| T1 | A and B are one page; `canPreregister`, `canRegisterWithCode` | Unchanged. The page also reads `contestantCtx.newUserEmail` and shows `contestantApp.setPassword.passwordSetSuccesfully` as its heading | [VERIFIED: `routes/contestant/login/+page.svelte` "let isLoginShown = $derived("] |
| T2 | `account-access`, the four writer methods *(174, planned)* | Built. Operations are a closed union; one private method invokes the function | [VERIFIED: `lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts` "operation: 'check-code' \| 'request-link' \| 'code-sign-in'"] |
| T3 | `invitationCodeLogin` *(174, planned)* for D2's action | Built, tested, **no caller** | [VERIFIED: `lib/auth/invitationCodeLogin.ts` "export async function invitationCodeLogin("]; [CITED: `174-NAME-MAP.md` § *Obligations to later phases* "**`invitationCodeLogin` has no caller.**"] |
| T4 | The callback gains a `magiclink` arm and loses `invite` *(174, planned)*; the `recovery` arm must be made to claim (D-13) | Built, **and the claim already runs before every arm**: `claimAndRefresh` is called ahead of the `switch`. `signup` and `email` arms remain | [VERIFIED: `routes/api/auth/callback/+server.ts` "const claim = await claimAndRefresh({ locals, fetch });" followed by "switch (type) {"] |
| T5 | F needs a focus move "in one place, the layout" (D-03); the terms view overflows at 390px | **Both done by Phase 174.1.** The layout requests the move whenever the rendered view changes without a navigation | [VERIFIED: `routes/contestant/(protected)/+layout.svelte` "cancelPendingFocus = focusNavigationTarget();"]; test `gateFocus.svelte.test.ts`; E2E project `contestant-terms-gate-phone` in `tests/playwright.config.ts` |
| T6 | Four axe scans of the old login states are in `contestant-a11y.spec.ts` (D-22, fact 16) | **They are in `tests/tests/specs/perm/perm-closed-project.spec.ts`**, through a local `loginScan` helper and the raw `assertAxeScan`: `contestant-login-sign-in-only`, `contestant-login-code`, `contestant-login-preregistration-collapsed`, `contestant-login-preregistration-expanded` | [VERIFIED: that file "function loginScan(name: string, contentTestId: string): RawAxeRoute"] |
| T7 | `private.user_password_set(p_user_id)` exists and `get_user_entities` obtains the key "through the private definer helper" (D-06) | The helper exists, **no API role may execute it**, and it lives in `506-invitation-rpcs.sql`, after `503-entity-rpcs.sql` | [MEASURED: `has_function_privilege('authenticated','private.user_password_set(uuid)','EXECUTE')` → `f`; the same for `anon` and `service_role` → `f`]; [VERIFIED: `schema/506-invitation-rpcs.sql` "CREATE OR REPLACE FUNCTION private.user_password_set (p_user_id uuid)"] |
| T8 | When answers are locked "`register/**` refuses to the login route" is "the present behaviour" (J5) | **Inexact twice.** The register layout renders a "registration locked" message with a Return button; it does not redirect. And the login page hides only the identity-provider button when locked: the registration-code link stays | [VERIFIED: `routes/contestant/register/+layout.svelte` "{#if contestantCtx.answersLocked}" … "t('contestantApp.error.registrationLocked')"]; [VERIFIED: login page "{#if !answersLocked && canPreregister}" against "{#if canRegisterWithCode}"] |
| T9 | A failed or spent link lands on the login page "with `errorMessage=authError`" | It does, **and the page shows nothing for it**: the page's error map holds one key | [VERIFIED: `lib/contestant/utils/loginError.ts` "export type ContestantLoginError = 'loginFailed';"]; the callback redirects with `errorMessage: 'authError'` |
| T10 | `requestForgotPasswordEmail`, `resetPassword`, `setPassword` are contestant-context wrappers | They are members of `AuthContext`, which the **Admin App's context forwards too** (no Admin route calls the first two) | [VERIFIED: `lib/contexts/auth/authContext.type.ts` "requestForgotPasswordEmail: (opts: { email: string })"]; `git grep` over `routes/` finds callers under `routes/contestant/` only |
| T11 | `PasswordSetter` + a read-only `username` field (D-08, D-15) | `PasswordSetter` renders its own `<form>`; both `PasswordField`s inside it are `name="password"`; every consumer's submit `Button` is outside that form and uses `onclick`; `PasswordValidator` is rendered without `username` | [VERIFIED: `lib/contestant/components/passwordSetter/PasswordSetter.svelte` "<form class=\"m-0 flex w-full flex-col flex-nowrap items-center\" {...restProps}>"]; [VERIFIED: `passwordField/PasswordField.svelte` "name=\"password\""] |
| T12 | `toCallbackUrl` has two callers | One caller, the journey's reset step, plus a line in `tests/README.md` | [MEASURED: `git grep -l toCallbackUrl -- apps packages tests scripts .claude`] |
| T13 | The base dataset is candidates-only | The base dataset serves **both** types, `candidate: ['email', 'code'], organization: []`; the perm family's shared settings serve candidates only with the same matrix | [VERIFIED: `packages/dev-seed/src/templates/e2e/base.ts` "entityTypes: ['candidate', 'organization']"]; [VERIFIED: `packages/dev-seed/src/templates/e2e/perm/shared.ts` "entityTypes: ['candidate']"] |
| T14 | pgTAP `36`, `07`; "the 07 census does not grow" | 42 files and 1957 assertions on the tree; Phase 177 adds files 43 and 44 and edits 07, 08, 12, 15, 23, 25 and 42. A new file of this phase is 45 | [CITED: `.claude/skills/database/SKILL.md` "1957 pgTAP assertions in 42 files"]; § *Phase 177 overlap* |
| T15 | The home and task state "whatever exists" (D-21) | Built (176): `ContestantAppEntityHome`, the `(nominated)` group, `ContestantAppNominations` outside it; the app root redirects a one-entity user to the entity home and shows `NothingToEdit` to a user with none | [VERIFIED: `lib/routes/route.ts` "export const CONTESTANT_NOMINATED"]; [VERIFIED: `routes/contestant/(protected)/+page.server.ts` "return { view: entities.length === 0 ? 'nothingToEdit' : 'select' };"] |
| T16 | `minimum_password_length = 6`; sign-up closed; confirmations on | Unchanged, and the gate that pins the auth keys is `scripts/assert-auth-signup-closed.mjs`, a link of `yarn lint:check`, with a `--self-test` | [VERIFIED: `apps/supabase/supabase/config.toml` "minimum_password_length = 6"] |
| T17 | — | The local stack runs `gotrue:v2.197.0`, the version Phase 174's research measured; PostgreSQL 17.6; Supabase CLI 2.118.0; edge runtime v1.76.2 | [MEASURED: `docker ps --format '{{.Names}} {{.Image}}'`; `yarn supabase --version`] |

Two more facts the plan needs and the context does not state:

- **The login-page flow state has a precedent to copy.** `newUserEmail` is a private `$state` field of the context class with a prototype getter and setter, cleared in `#reset`, which the logout wrapper calls. D-02's flow state is the same shape in the same file, and `newUserEmail` is what it replaces. [VERIFIED: `lib/contexts/contestant/contestantContext.svelte.ts` "#newUserEmail = $state<string | undefined>(undefined);"]
- **`getBasicUserData` has callers outside the Contestant App:** `lib/auth/getUserData.ts` (behind `requireAdminIdentity`, which gates every `/api/admin/jobs/**` request, progress polling included) and two Admin pages. Whatever is added inside `_getBasicUserData` is paid on each of them. [MEASURED: `git grep -n getBasicUserData -- apps/frontend/src ':!*.test.ts'`]

## Architectural Responsibility Map

| Capability | Primary tier | Secondary tier | Rationale |
|------------|--------------|----------------|-----------|
| Which entry controls are offered (A, B's link button, C's modes) | Frontend server (SSR load of settings) | Browser (the same accessors over `appSettings`) | The matrix is a stored setting; the accessors of `contestantAppConfig.ts` are the one reading on the TypeScript side |
| Whether a mode is honoured for an invitation | Database (SQL functions behind `account-access` and `claim_invitations`) | — | D-05: a switch that only hides a control leaves the endpoint open |
| Password sign-in (B), code sign-in (D2) | Frontend server (form actions) | API (`account-access` `code-sign-in` for D2) | Only the request's own server client can put the session cookies on the response |
| Link requests (C email, B's button, D1, D2's link, forgot-password, E's resend) | API (Edge Function), called from the browser through the data writer | Database (eligibility, slot, binding) | The answer is uniform and returned before the work, so the caller's tier does not matter; no redirect target, URL or text travels with the request |
| The mailed link's landing | Frontend server (`api/auth/callback`) | — | Verify, claim, refresh, land; the route decides nothing about grants |
| "Must set a password" (F), terms (G) | Frontend server (the protected layout's load decides) | Browser (renders the view the load named) | A gate decided by the server on fresh data cannot be skipped by a client flag |
| "Password set" as a fact | Database (`auth.users.encrypted_password`, read for `auth.uid()` only) | — | The one source a user cannot forge without actually setting a password |
| Flow state between steps (the code, the typed address, E's wording) | Browser (per-instance `$state` in the contestant context) | — | D-02: never the URL, storage or history |
| Mail texts | API (templates stored with the function) | — | D-16: the caller chooses a locale from a closed set and nothing else |
| The resend countdown | Browser | Database (the real limit) | Cosmetic by decision; it says nothing about the server |

## Standard Stack

No package is added by this phase. Everything below is installed and in use.

### Core

| Library | Version | Purpose | Provenance |
|---------|---------|---------|------------|
| `@sveltejs/kit` | 2.70.3 | Routes, form actions, `use:enhance`, `invalidateAll` | [MEASURED: `node_modules/@sveltejs/kit/package.json`] |
| `svelte` | 5.57.1 | Runes, snippets | [MEASURED: `node_modules/svelte/package.json`] |
| `@supabase/ssr` | 0.12.7 | The request's server client and the browser client over shared, non-httpOnly cookies | [MEASURED: `node_modules/@supabase/ssr/package.json`]; [VERIFIED: `lib/supabase/server.ts` "httpOnly: false, path: '/'"] |
| `@supabase/supabase-js` | 2.117.2 | Auth and RPC calls; the function pins the same version | [VERIFIED: `functions/account-access/index.ts` "import { createClient } from 'npm:@supabase/supabase-js@2.117.2';"] |
| GoTrue (auth service) | v2.197.0 | `generate_link`, `/verify`, password grant, `PUT /user` | [MEASURED: `docker ps`] |
| `zod` | catalog | Narrowing of every function and RPC answer | [VERIFIED: `lib/api/adapters/supabase/utils/invitationAccess.ts`] |
| `nodemailer` | 10.0.11 | The function's SMTP transport | [VERIFIED: `functions/account-access/index.ts` "import nodemailer from 'npm:nodemailer@10.0.11';"] |

### Supporting

| Library | Version | Purpose | When to use |
|---------|---------|---------|-------------|
| `@playwright/test` | 1.63.0 | E2E; `page.clock` for the resend countdown | [MEASURED: `node_modules/@playwright/test/package.json`]. No spec uses `page.clock` yet ([MEASURED: `git grep -n "page.clock" -- tests` → nothing]); that `page.clock` exists in this version is [ASSUMED] |
| `@axe-core/playwright` | ^4.11.3 | Only through the shared `assertAxeScan` | Never constructed in a spec: `scripts/assert-a11y-scan-wiring.mjs` fails it |
| vitest | catalog | Frontend, functions, dev-seed, app-shared and harness unit suites | — |
| pgTAP | with the stack | Database assertions | — |

### Alternatives considered

| Instead of | Could use | Why not |
|------------|-----------|---------|
| A new operation of `account-access` for recovery | `auth.resetPasswordForEmail` | Locked out by D-13 and D-18: it is the PKCE path FIX-01 is about |
| `generateLink({ type: 'recovery' })` | `generateLink({ type: 'magiclink' })` and a link built with `type=recovery` | Equivalent at verification (§ RQ-1). Use the `recovery` type: it is the documented one, and it answers 404 for an address with no account, which is a free second check of the eligibility rule |
| A dedicated "password set" RPC | A key on `get_user_entities` | The operator's NOTE reads as ruling the RPC out (J1) |

**Installation:** none.

## Package Legitimacy Audit

Not applicable: this phase installs no external package. **Packages removed due to [SLOP] verdict:** none. **Packages flagged as suspicious [SUS]:** none.

## Grounding the judgement calls (J1 to J6)

None of the six has been answered: the operator-decision files of 2026-10-07, 2026-10-08 and 2026-10-09 hold no ruling on them ([MEASURED: `grep -n "178"` over the three files finds one mention, G1 of 2026-10-08, on the per-caller limit, left at its recommended option (a): "Leave the limits as the filed todo"]). Each is grounded here on the tree and comes back to the operator in § *Open Questions*.

### J1 — where "password set" rides (D-06)

What the tree adds to the context's reading:

1. **The helper cannot be called from `get_user_entities` as it stands.** `get_user_entities` is `SECURITY INVOKER` ([VERIFIED: `schema/503-entity-rpcs.sql` "RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER"]) and runs as `authenticated`, which holds no EXECUTE on `private.user_password_set` (T7). The pattern the same function already uses for its one definer call is a private definer function that answers for the caller only: `private.caller_entity_ids`, which the blanket grant in `301-auth-functions.sql` opens to the API roles ([VERIFIED: that file "EXECUTE ON ALL FUNCTIONS IN SCHEMA private TO anon,"], and its own comment: "The statement reaches only the functions defined before it").
2. **File order.** `get_user_entities` is a `LANGUAGE sql` function, whose body is checked when it is created, and the migration is the schema files concatenated in numeric order. A function in `503` cannot name one first defined in `506`. UNCONFIRMED by a run; it follows from `check_function_bodies` being on by default [ASSUMED].
3. **The parser already tolerates the key.** `parseUserEntities` reads `entities` and ignores every other top-level member, and a unit test already feeds it `password_set: true` ([MEASURED: `git grep -n password_set` → `lib/api/adapters/supabase/utils/userEntities.test.ts` "parseUserEntities({ entities: [{ ...candidateEntry, added_later: 1 }], password_set: true })"]).
4. **Cost of filling it inside `_getBasicUserData`.** That method has Admin callers (see above). An unconditional `rpc('get_user_entities')` inside it adds one round trip to every admin job poll, and the contestant layout's load then calls the same RPC twice for an ungated user (stage 2 and stage 4).

**Prescription (within D-06, for the planner):**

- Add a zero-argument definer function `private.caller_password_set()` returning `private.user_password_set((SELECT auth.uid()))`, with EXECUTE granted to `authenticated` only. It takes no argument, so it can answer for no one but the caller, which is D-06's "never for an argument the caller supplies". Place it, and move `private.user_password_set` with it, into a file that precedes `503` (`301-auth-functions.sql`, after the blanket grant, with its own explicit grant and revoke). `claim_invitations` keeps calling `private.user_password_set` unchanged.
- `get_user_entities` gains `'password_set', private.caller_password_set()` beside `'entities'`. Its signature, cardinality and security mode do not change, and the census of `07-rpc-security.test.sql` does not grow (the new function is in `private`).
- Make the fact **required by the gate's type, optional for everyone else**: the gate list's predicates take `BasicUserData & { passwordSet: boolean }`, and `getBasicUserData` fills the member only when asked (an option the protected layout's load passes). A caller that did not ask cannot call `firstNeededGate` (it does not typecheck), and no Admin caller pays the round trip. When asked and the read fails, `_getBasicUserData` throws, and the load's existing `catch` signs the user out with `loginFailed`, which is D-06's "a failed read is neither".
- The two RPC calls of an ungated load are accepted, or shared by passing the first answer on; measure before optimising. The load reruns only when the selected entity changes and on `invalidateAll`.

### J2 — identity-provider accounts read "password set" (D-07)

- `identity-callback` creates its user with `admin.createUser` and no password, then mints a `magiclink` for the placeholder address ([VERIFIED: `functions/identity-callback/index.ts` "await supabaseAdmin.auth.admin.createUser({" and "await supabaseAdmin.auth.admin.generateLink({"]). That such a user carries a generated hash is [CITED: `174-RESEARCH.md` § RQ-2, the row "`admin.createUser({ email, email_confirm: true })` (the `identity-callback` shape) | yes | — | **set** | yes"], measured on a private GoTrue v2.197.0, the version the local stack runs. UNCONFIRMED on this stack. The local database held two users during this session, both with a 60-character hash and none empty ([MEASURED: `SELECT length(encrypted_password), count(*) FROM auth.users GROUP BY 1` → `60|2`]), which says nothing about identity-provider accounts.
- The pending todo `2026-10-07-174-identity-provider-accounts-read-as-password-set.md` proposes the opposite of D-07: record the choice where it is made, "for example as a timestamp in `app_metadata` written by a definer function". **That alternative reopens the hole D-06 closes.** A marker written by a function the signed-in user may call can be written without setting a password, from the browser console. Only a writer the user cannot reach (a service-role call that both sets the password and writes the marker) would be unforgeable, and that is a new server operation. The column is forgeable only by actually setting a password. D-07 stands on the tree.
- **One related arm should close here.** Verifying a token as `signup` or as `email` for an invited passwordless user stores a generated password ([CITED: GoTrue v2.197.0 source, `internal/api/verify.go`: `signupVerify` holds "if !user.HasPassword() && user.InvitedAt != nil {" followed by "password, err := password.Generate(64, 10, 0, false, true)"]), after which the column reads true for someone who chose nothing and F is skipped. The callback still has both arms (T4). Nothing in the product issues either type. The pending todo `2026-10-07-174-callback-keeps-signup-and-email-arms.md` is owned by this phase: refuse both as `invite` is refused, unless Phase 179's discussion claims one.

### J3 — the matrix on the server (D-05)

Five facts the context does not hold, each of which the plan must absorb:

1. **The shipped default allows nothing.** `dynamicSettings.contestantApp` is `entityTypes: ['candidate']` with `registrationModes: { candidate: [], organization: [] }` ([VERIFIED: `packages/app-shared/src/settings/dynamicSettings.ts` "registrationModes: {" … "candidate: []," … "organization: []"]). Under D-05 a project that stores no matrix honours no entity invitation.
2. **The pgTAP fixtures store no matrix.** `create_test_data` writes `'{"theme":"light"}'` and `'{"theme":"dark"}'` as the two settings rows ([VERIFIED: `tests/database/00-helpers.test.sql` "(test_id('app_settings_a'), test_id('project_a'), '{\"theme\":\"light\"}'::jsonb),"]). `39-invitations.test.sql` names `claim_invitations`, `invitation_link_request` or `invitation_code_status` 98 times ([MEASURED: `grep -c`]) across its Sections 9 to 20. Without a matrix for its projects, most of those rows flip. Give file 39 a permissive matrix in its own setup; do not edit the shared helper, which every other file reads.
3. **The base E2E dataset allows nothing for organizations, and the contract spec invites one.** `invitation-contract.spec.ts` seeds a code invitation and four email invitations for the reserved organization row ([VERIFIED: that file "const codeInvitation = await flow.seedCodeInvitation('organization');" and "await flow.seedEmailInvitation('organization', address);"]), in a project whose matrix is `organization: []` (T13). About seven of its fifteen tests change their answer, counted from their seeding lines and titles and not from a run.
4. **Factions and alliances have no row to be judged by.** The matrix has rows for `candidate` and `organization` only (`SERVED_ENTITY_TYPES`), and Phase 174 built invitations for all four entity types, with pgTAP rows that claim a faction's and an alliance's. "Judged against the matrix row of its target's entity type" has no answer for them.
5. **The claim's skip reasons are a closed set on the frontend.** [VERIFIED: `lib/api/adapters/supabase/utils/invitationAccess.ts` "reason: z.enum(['candidate_has_editor', 'target_not_in_project'])"]. A third reason makes `parseInvitationClaim` throw, the callback's `magiclink` arm reads a thrown claim as failed, signs the user out and lands them on the login page with `authError`, which shows nothing (T9).

And one site D-05 does not list: `invitation_code_claimant_email`, behind `code-sign-in`, also finds a row by its code.

**Prescription (within D-05; the first two bullets go back to the operator as part of J3):**

- **Judge open rows only.** A claimed invitation is a finished registration. Its code keeps answering `used`, its claimant keeps being mailed a link and keeps signing in through D2, whatever the matrix says now. This is D-05's own second sentence ("a user who already holds a grant in the project can always ask for a sign-in link") applied to the code path, and it removes `invitation_code_claimant_email` from the question.
- **Judge `candidate` and `organization` targets only.** Project-scope promises (as D-05 says), and faction and alliance targets, are not judged: the Contestant App serves neither type and the matrix cannot name them.
- **A disallowed open row is absent, not skipped.** Filter it in the `WHERE` of the claim's loop and of the eligibility query. It is then in neither `claimed` nor `skipped`, the zod schema is untouched, and the answer is the one an unknown code or an uninvited address gets, as D-05 requires.
- **One reader, with a pure core.** `private.registration_mode_allowed_in(p_settings jsonb, p_entity_type text, p_mode text)` (IMMUTABLE, no table read) holds the rule; `private.registration_mode_allowed(p_project_id, p_entity_type, p_mode)` reads the project's settings row and calls it. Only definer functions call either, so no API role needs EXECUTE. The rule, transcribed from `getEffectiveRegistrationModes` ([VERIFIED: `packages/app-shared/src/settings/contestantAppConfig.ts` "export function getEffectiveRegistrationModes("]): the served types are the members of `('candidate','organization')` the stored `contestantApp.entityTypes` array lists, or `('candidate')` when it lists none or is not an array; the mode is allowed when the type is served, the stored `contestantApp.registrationModes` is a JSON object, its member for the type is an array, and the array holds the mode. No settings row reads as "not allowed". Where the matrix is stored is `app_settings.settings #> '{contestantApp,registrationModes}'`, the path `contestant_app_public_config` already reads ([VERIFIED: `schema/106-app-settings.sql` "'registrationModes', v.settings #> '{contestantApp,registrationModes}'"]). A closed project is no obstacle: the reader is called from definer functions.
- **The parity test (RQ-6).** The pure core makes it cheap without a database round trip from TypeScript: the pgTAP file holds the truth table as literal rows `(settings json, entity type, mode, expected)`, pgTAP asserts the SQL function against it, and a vitest in `packages/dev-seed/tests` (where the repository's other text-reading cross-artifact gates live, `projectScopingGate.test.ts` among them) parses the same rows out of the `.sql` file and asserts `isRegistrationModeAllowed` returns the same `expected` for each. One table, two readers, no hand-written second copy of the defaults. The table must include: nothing stored; `contestantApp: null`; `entityTypes` not an array, empty, holding only an unknown member, holding a type twice; `registrationModes` not an object; a row for an unserved type; a row that is not an array; an unknown mode.
- **The seeding call is not conditioned.** `create_invitations` keeps accepting an invitation whose mode is off (it may be switched on later). The Publishers' Guide sentence that an invitation works whatever the modes are, and the `contestantAppConfig.ts` docblock sentence "An invitation sent by an administrator is not a registration mode and needs no entry.", are corrected (O-4).

### J4 — the reading of Additional note 1 (D-19, D-20)

- The legacy tree on disk is `routes/contestant/register/{+layout.server.ts, +layout.svelte, +page.svelte, +page.ts, layout.server.test.ts, registrationCodeGuard.ts, registrationCodeGuard.test.ts, password/+page.svelte}` and `routes/contestant/preregister/**` with `routes/api/contestant/preregister/` ([MEASURED: `find routes/contestant routes/api -type f`]).
- The bank-auth journey enters the provider's flow by URL, not through the login page ([VERIFIED: `tests/tests/specs/contestant/contestant-bank-auth-journey.spec.ts` "await page.goto('/en/contestant/preregister');"]), so replacing the login page's pre-registration button with C's option (D-20) does not move that spec.
- Proposed route ids, all static siblings, none of which shadows `register/identity-provider`: `/contestant/login` (A), `/contestant/login/email` (B), `/contestant/register` (C), `/contestant/register/email` (D1), `/contestant/register/sign-in` (D2), `/contestant/email-sent` (E). `routeConsistency.test.ts` compares the `ROUTE` map with the route tree on disk, so each key and its directory land in one commit ([VERIFIED: `lib/routes/route.ts` "This constant and the directory move together or the route 404s."]).
- Phase 177's closing plan records, for this phase and 179, "that the legacy `preregister` selection pages, their route constants and the context's `preregistration*` members are in place" ([MEASURED: `grep -n "178" 177-21-PLAN.md`, the line beginning "**For Phases 178 and 179**"]). 177 does not move them either.

The context's reading holds on the tree. Nothing found argues for the pure rename.

### J5 — `access.answersLocked` on the entry flow

- The context's description of "the present behaviour" is inexact (T8). What is there: the login page shows the locked notice (`contestantApp.login.answersLockedInfo`, test id `login-answers-locked-info`, asserted by `perm-answers-locked.spec.ts`), hides the identity-provider button, **still shows the registration-code link**, and the register tree answers a visitor with a "registration locked" message and a Return button.
- `contestant_app_public_config` returns exactly three values ([VERIFIED: `schema/106-app-settings.sql` "Returns one object with exactly three values"]), so an anonymous visitor of a **closed** project reads `answersLocked` as its default, `false`, whatever is stored. Adding it is one key in the function, one copied member in the provider (`supabaseDataProvider.ts` "Place the three values `contestant_app_public_config` answers at their storage paths"), the key-set assertion of `38-contestant-app-public-config.test.sql`, the sentence in `301-auth-functions.sql` that says "three fixed settings values", and the pin in `perm-closed-project.spec.ts`.
- If the register tree refuses by redirect, `contestantApp.error.registrationLocked` loses its only caller and is removed in seven locales, or A shows it.

### J6 — GoTrue's own mail endpoints

- **What a send-email hook does:** "The Send Email Hook replaces Supabase's built-in email sending." [CITED: https://supabase.com/docs/guides/auth/auth-hooks/send-email-hook]. Its `email_action_type` values include `signup`, `invite`, `magiclink`, `recovery`, `email_change`, `email` and `reauthentication` [CITED: same page]. So it also stops the email-change confirmation Phase 179's pending address depends on. That is no conflict in practice: a mail is a user-facing string and must ship in seven locales (the roadmap's standing rule), which GoTrue's own English mail cannot, so 179 has to send its own mail whether or not the hook exists.
- **`generate_link` and `/verify` keep working under a no-op hook:** [CITED: `174-RESEARCH.md` § *Open Questions for the Operator* "A no-op send-email hook stops every GoTrue-originated mail while `generate_link` and `/verify` keep working `[MEASURED: private stack]`"]. UNCONFIRMED on this stack.
- **How it is configured locally:** `[auth.hook.send_email]` with `enabled` and `uri`; the URI may be a Postgres function, `pg-functions://<database>/<schema>/<function-name>` [CITED: https://supabase.com/docs/guides/local-development/cli/config]. The tree already configures one hook that way ([VERIFIED: `apps/supabase/supabase/config.toml` "uri = \"pg-functions://postgres/public/custom_access_token_hook\""]). A no-op is therefore one SQL function taking and returning `jsonb`, executable by `supabase_auth_admin` only, no secret and no network hop.
- **What it does not do:** it stops the mail, not the answer. `POST /otp` answers 422 for an unregistered address and 200 for a registered one ([CITED: `174-RESEARCH.md` § RQ-1, row (c′)]). Whether the registered answer changes under the hook is not measured (RQ-5).
- **Cost:** a schema edit, a second `[auth]`-family change with its stack restart, an extension of `scripts/assert-auth-signup-closed.mjs` and its self-test, a dashboard obligation for a hosted project, and a constraint on Phase 179.

## Status of the research items (RQ-1 to RQ-11)

"Not run" below means the item needs a user created, a link minted, a password set or the stack restarted, none of which this session was allowed to do. Each such item is a row of the first wave's probe (§ *Validation Architecture*, Wave 0), modelled on `174-fn-probe.mjs` and `174-stack-probe.sh` in Phase 174's directory.

| Item | Status | What is known, and from where |
|------|--------|-------------------------------|
| **RQ-1** the recovery link | **Mostly answered by citation and source; residue not run** | (a) `generateLink({ type: 'recovery' })` for an unknown address: 404 `user_not_found`, no user created. For a known confirmed user: ok. [CITED: `174-RESEARCH.md` § RQ-1 and § RQ-2, private GoTrue v2.197.0]. (b) A `recovery` token verifies as `recovery`, as `magiclink` and as `email`; a `magiclink` token verifies as `recovery` too. [CITED: `174-RESEARCH.md` § RQ-4, the table's rows "`magiclink` (known confirmed user)" and "`recovery` (known confirmed user)"]. The source says why: [CITED: GoTrue v2.197.0 source, `internal/api/verify.go`: "case mail.RecoveryVerification, mail.MagicLinkVerification:" followed by "user, err = models.FindUserByOneTimeToken(conn, params.TokenHash, models.RecoveryToken)"]. (c) Verifying does not change the password: `recoverVerify` calls `user.Recover(tx)`, `user.Confirm(tx)` and audit logging, and `Recover` updates `recovery_token` only [CITED: GoTrue v2.197.0 source, `internal/models/user.go`: "if err := tx.UpdateOnly(u, \"recovery_token\"); err != nil {"]. (d) Single use and expiry at `otp_expiry`: [CITED: `174-RESEARCH.md` § RQ-4, "the second presentation of a verified token answers 403 `otp_expired`"; "with `GOTRUE_MAILER_OTP_EXP=2`, a token presented after four seconds answered 403"]. (e) **Cross-invalidation:** both kinds are stored as the one `RecoveryToken`, and `Recover` ends with "return ClearAllOneTimeTokensForUser(tx, u.ID)", so a later link of either kind replaces an unopened earlier one of either kind, and opening one clears the other. Same-kind re-issue is measured on the local stack [CITED: `174-NAME-MAP.md` row E6]; the cross-kind case is read from source only. **All of RQ-1 is UNCONFIRMED on this tree; (c) and (e) have never been measured anywhere.** |
| **RQ-2** the truth table of "password set" | **Not run** | Known by citation: the two-call recipe (`invite`, then `magiclink`) leaves `encrypted_password = ''` before and after the first sign-in, until `PUT /user { password }`; `admin.createUser` without a password stores a hash; an `invite`, `signup` or `email` verification of an invited passwordless user stores one. [CITED: `174-RESEARCH.md` § RQ-2]. pgTAP already pins the SQL half: "password_set is false for a user whose encrypted_password is the empty string" and "…true for a user whose encrypted_password holds a hash" ([VERIFIED: `tests/database/39-invitations.test.sql` § "Section 14: password_set"]). Not known: after a recovery verify (expected unchanged, RQ-1 (c)). |
| **RQ-3** setting a password on a link session | **Not run; structurally low risk** | `password_set` is read from `auth.users` at request time, not from the token, so the load after F does not depend on a token rotation. The browser client and the server client share the same cookies ([VERIFIED: `lib/supabase/server.ts` "event.cookies.set(name, value, { ...options, httpOnly: false, path: '/' });"]). `PUT /user { password }` succeeds on a link session [CITED: `174-RESEARCH.md` § RQ-2 step 4]. The terms gate already does the same sequence, a browser write then `invalidateAll()` ([VERIFIED: `lib/contestant/gates/TermsOfUseGate.svelte` "await invalidateAll();"]). Whether `updateUser` rotates the access token is stated by a comment in `_setPassword` and contradicted by nothing read here: UNCONFIRMED. The legacy set-password page distrusts this very step ("The session from verifyOtp may not reliably persist through client-side navigation to the protected route") and the reset page leaves by a full page load (`window.location.href`), so the probe and the first E2E spec must show it. |
| **RQ-4** `minimum_password_length = 8` | **Census done; binding not run** | No password literal shorter than eight characters reaches the auth service from the test estate, dev-seed, the functions or the seed: the only short literals are in mocked unit tests and in pgTAP's direct `crypt('testpass', …)` inserts, which bypass the auth service ([MEASURED: a `git grep -P` for password-like assignments of one to seven characters over `tests`, `packages/dev-seed`, `apps/supabase/supabase` and `apps/frontend/src`]). The E2E passwords are `'Password1!'`, `'OldPass!Word123'` and `'NewPass!Word456'` ([MEASURED: `git grep` → `tests/tests/utils/testCredentials.ts` "export const TEST_CANDIDATE_PASSWORD = 'Password1!';", `contestantJourneyConstants.ts` "export const PASSWORD_1 = 'OldPass!Word123';" and "export const PASSWORD_2 = 'NewPass!Word456';"]). `identity-callback` passes no password. Which calls the setting binds (`PUT /user`, admin `createUser` with a password, a sign-in with an existing shorter password) is [ASSUMED]: the first two are refused, the third still signs in. |
| **RQ-5** a no-op send-email hook | **Desk only** | See J6. Not run: `/otp` and `/recover` for a registered and an unregistered address under the hook, and an email change under it. |
| **RQ-6** the matrix in SQL | **Answered** | See J3: the storage path, the rule, the closed-project question, and the parity test's design. |
| **RQ-7** password managers and autofill | **Answered (desk)** | Assertable by a test: every `type`, `name`, `autocomplete`, `autocapitalize`, `spellcheck`, `readonly` attribute of D-15, a programmatic label on each input, unique ids, one `<form>` per process, a real submit event. Not assertable: that a manager offers to save or fill. The Chromium guidance the attributes follow: "Use autocomplete attributes"; "Use hidden fields for implicit information" (a change-password form carries a hidden or read-only username); "Make sure form submission is clear" (after a fetch submission, navigate or remove the form); "Group related fields in a single form" (do not combine sign-in and registration) [CITED: https://www.chromium.org/developers/design-documents/create-amazing-password-forms/]. Manual list for the plan's verification, in Chrome and in Firefox or Safari: B offers the saved pair; F and the reset page offer to save the address with the new password; D2 fills from a prior save; C's code field is never offered a password or a one-time code. See § *Pitfall 8*. |
| **RQ-8** link prefetch | **Answered (desk): a real risk, not built against here** | Supabase names it as a cause of `otp_expired`: "these automated prefetching services can consume the OTP token by accessing the link before the legitimate user does" [CITED: https://supabase.com/docs/guides/troubleshooting/otp-verification-failures-token-has-expired-or-otp_expired-errors-5ee4d0.md]. Reports cluster on institutional mail domains [CITED: https://github.com/orgs/supabase/discussions/41618]. The callback verifies on `GET`, so a scanner that follows the link spends it. The remedies are a page that redeems on a button press, or a typed code; a landing page that auto-submits is no remedy. The context defers this ("only if RQ-8 calls for it, and then raised first"); it is raised in § *Open Questions*. Until then T9 matters more than before: a spent link must at least say so. |
| **RQ-9** 174's measurements | **Answered** | Re-issue: a later link makes the earlier unopened one stop working [CITED: `174-NAME-MAP.md` row E6], so E says to use the newest mail. The function observes nothing of its caller it can key on [CITED: row E7]. `request-link` answers in 4 to 9 ms whatever the address [CITED: row E11]. `request-link` without a code already mails a user who holds a grant in the project ([VERIFIED: `schema/506-invitation-rpcs.sql`, `invitation_link_request`, "OR EXISTS (" … "FROM auth.users u" … "g.scope = 'project' AND g.target_id = p_project_id"]), which is what B's "I have not set a password yet" needs for a returning user. A change to the function or to `config.toml` needs `yarn db:stop` and `yarn db:start` before it is observed [CITED: row E8]. |
| **RQ-10** the flow state under SSR | **Answered by structure; not run** | The context is built in a component (`initContestantContext()` in `routes/contestant/+layout.svelte`) and held by Svelte context, so on the server it is per render, and the precedent field is per instance (above). It survives client-side navigation because that layout stays mounted across `/contestant/**`. It is lost on any full document load, including the click of a plain link before hydration, which is D-02's "returns the user to the step that owns it". A unit test on the context class and one E2E reload on D1 and on E show it. |
| **RQ-11** B's answers | **Status and body answered; timing not run** | Every sign-in error is one outcome: [VERIFIED: `lib/auth/passwordLogin.ts` "return { ok: false, status: 400, reason: 'invalidCredentials' };"], and the page maps 400 to one text. A password sign-in against an empty hash answers 400 `invalid_credentials` for any input [CITED: `174-RESEARCH.md` § RQ-2 step 4]. Timing across the three cases is the auth service's own and unmeasured; whatever the probe finds, the same endpoint is reachable directly with the anon key, so a difference is a residual of the service, to be stated and not claimed closed. A 403 is reached only with a correct password and so tells a guesser nothing about existence. |

## Phase 177 overlap (planned, executing while this phase is planned)

Derived from the `files_modified` frontmatter of the 21 plans ([MEASURED: an `awk` over `177-*-PLAN.md`]). Re-derive it at plan time: the plans may be revised.

| File both phases touch | 177 plans | What 178 does to it |
|---|---|---|
| `apps/supabase/supabase/schema/503-entity-rpcs.sql` | 06, 07 | adds the `password_set` key to `get_user_entities` |
| `apps/supabase/supabase/schema/301-auth-functions.sql` | 05, 07 | receives `private.caller_password_set` (and the relocated helper), if placed there |
| `apps/supabase/supabase/migrations/00001_initial_schema.sql` | 02 to 07 | regenerated once, after 177's last schema plan |
| `packages/supabase-types/src/database.ts` | 02 to 07 | regenerated |
| `apps/supabase/supabase/tests/database/07-rpc-security.test.sql` | 06 | read only if a census moves (it should not) |
| `apps/frontend/src/lib/api/base/dataWriter.type.ts`, `universalDataWriter.ts` | 09 | removes `checkRegistrationKey`, `register`, `CheckRegistrationData`, `resetPassword`; adds the recovery method and `passwordSet` |
| `apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts`, `.test.ts`, `.integration.test.ts` | 09 | the same, in the adapter |
| `apps/frontend/src/lib/contexts/contestant/contestantContext.svelte.ts`, `.type.ts`, `.svelte.test.ts` | 15, 19 | adds the flow state; removes `newUserEmail`, `checkRegistrationKey`, `register` |
| `apps/frontend/src/lib/routes/route.ts` | 15 | adds the entry-flow keys; removes `ContestantAppSetPassword` |
| `apps/frontend/src/lib/types/generated/translationKey.ts` | 12 | regenerated (`yarn workspace @openvaa/frontend generate:translation-key-type`) |
| `apps/frontend/messages/*/contestantApp.common.json` | 12 | only if a new key goes there; prefer the phase's own namespaces |
| `tests/playwright.config.ts` | 10 | new projects for the new specs |
| `tests/tests/utils/testIds.ts` | 11 | new and removed ids |
| `tests/tests/specs/a11y/contestant-a11y.spec.ts` | 19 | F's scan entry |
| `scripts/assert-a11y-scan-wiring.mjs` | 10 | only if a new spec file declares scans (its check 4a lists the files that may) |
| `scripts/assert-project-scoped-queries.mjs` | 09 | only if a new invocation site is added; the recovery operation should go through the existing private method so none is |
| `packages/dev-seed/src/templates/e2e/base.ts` | 02 | only if the base matrix is widened (J3, D-21) |
| `packages/dev-seed/tests/templates/built-in-templates-contestant-app.test.ts` | 10 | the matrix pin, if the base matrix is widened |
| `apps/frontend/src/routes/contestant/README.md`, `apps/supabase/README.md` | 21 | docs (O-8) |
| `.claude/skills/components/SKILL.md`, `context-reactivity.md`, `.claude/skills/database/*` | 21 | `context-reactivity.md` names `newUserEmail`; the database skill's counts move |
| `apps/docs/src/routes/(content)/developers-guide/` | 21 | registration, login and password reset, email, contexts pages |

Not touched by 177 and owned here: everything under `routes/contestant/login/`, `register/`, `forgot-password/`, `password-reset/`, `routes/api/auth/callback/`, `lib/auth/`, `lib/contestant/gates/`, `lib/contestant/components/` (177 edits `notEditableNote` only), `lib/routes/appGates.ts`, `hooks.server.ts`, `schema/506-invitation-rpcs.sql`, `schema/106-app-settings.sql`, `functions/account-access/`, `apps/supabase/supabase/config.toml`, `39-invitations.test.sql`, `36-entity-identity.test.sql`, `38-contestant-app-public-config.test.sql`.

**What 177 changes that 178's specs meet:** after 177 the home's first task leads into the nomination editor when nominations can be edited and the entity has none, and to the nominations view otherwise ([CITED: ROADMAP.md § Phase 177, E11 with the operator's NOTE]). A registration spec that ends "on the entity's home" asserts the home, not what the task opens. 177 also retypes the seed templates' elections to the new default election type (177-02), which moves nothing in this phase's flows.

**Ordering consequence.** The schema step of this phase runs after 177's plans 02 to 07 are on the tree (and after 177.1, which edits `506-invitation-rpcs.sql`). Every frontend plan of this phase that touches a shared file above is written against the file as 177 leaves it; a plan written earlier names its edit by content anchor so that it survives 177's edits.

## Phase 177.1 dependency (not yet discussed)

Phase 177.1 changes `create_invitations`' signature (a required `p_confirm_entity`, an optional `p_nominations`) and removes `invitationFlow.whileHiddenFromVoters`. Its unfilled discussion document proposes that `inviteByEmail` and the fixture's seeding steps take the confirmation as a required argument, and that `invitation-contract.spec.ts` changes two expectations ([VERIFIED: `.planning/v2.16-177.1-180-DISCUSSION-POINTS.md` § 177.1-D3 and § 177.1-D4; unanswered by the operator, so it may change]).

| In this phase's E2E plan | Depends on | How to stay independent of which form lands first |
|---|---|---|
| Seeding the email spec's candidate invitation and the code spec's organization invitation | `create_invitations`' signature, through `SupabaseAdminClient.createInvitations` (`packages/dev-seed/src/supabaseAdminClient.ts`) and the fixture steps `seedEmailInvitation`, `seedCodeInvitation` (`tests/tests/fixtures/shared/invitationFlow.fixture.ts`) | Seed only through those fixture steps, never through a direct RPC call. Then the 177.1 form is one argument at each call |
| Whether the invited entity is public while the spec runs | 177.1's removal of `whileHiddenFromVoters` | Invite entities that have **no nomination**, as the contract spec's two reserved rows do: seeding confirms the entity and nothing becomes public. The specs then need the wrapper under neither form |
| The journey's registration step (`contestant-journey.spec.ts`) | Both phases rewrite it: 177.1 its seeding step, this phase everything from the mailed link to the home | Order 177.1 first (the roadmap's order, and D-21's premise); this phase then edits a step 177.1 has already re-pointed |
| `invitation-contract.spec.ts` | 177.1 changes two expectations; this phase changes the project's matrix or the rows it invites (J3) | The same order |
| `39-invitations.test.sql` | 177.1 adds the parameter to its rows; this phase adds the matrix to its setup and a section for the condition | Serial, 177.1 first |

If the operator runs this phase before 177.1, nothing above blocks: the fixture steps exist in today's form, and the journey still uses the wrapper.

## The E2E estate that drives the entry pages

Every file below drives the login, register, pre-registration, forgot-password or set/reset-password pages by test id, route key or URL ([MEASURED: two `git grep` passes over `tests/`]). Populations are re-derived at plan time.

**The sign-in form is driven from seven places, each with its own copy of the steps:**

| File | What it does | After the A/B split |
|---|---|---|
| `tests/tests/setup/shared/registerAndStoreSession.ts` | Opens the app root, waits for `login-email` on the page the redirect lands on (`waitForLoginForm`), fills, submits, waits for the URL to leave `/login/` | **Breaks:** the redirect lands on A, which has no field. Every stored session of the suite goes through it. Under investigation by another session right now (its wait for the URL; reverted to the default by `3a80c5506` on the operator's ruling F1 (b) of 2026-10-09): **re-read it at plan time** |
| `tests/tests/setup/perm/perm-answers-locked.setup.ts`, `perm-disable-allow-open.setup.ts`, `perm-hide-hero.setup.ts`, `perm-question-video.setup.ts` | Each holds its own `waitForLoginForm` and the same four lines | Break the same way |
| `tests/tests/fixtures/contestant/contestantLoginPage.fixture.ts` | The page object: `goToPage`, `enterEmail`, `submit`, `login`, `getSubmitButton`, `expectErrorMessage`; composed into five fixture files | `goToPage` opens `ContestantAppLogin` and waits for the field: breaks |
| `tests/tests/specs/contestant/contestant-journey.spec.ts` | Inline sign-in steps; asserts `login.registerLink` visible and `login.preregister` hidden; the set-password page; the "password is now set" re-login; the reset step through `toCallbackUrl` | Rewritten from the mailed link onward |
| `tests/tests/specs/perm/perm-closed-project.spec.ts` | Inline sign-in; the four login-state scans; `showLogin`, `registerLink`, `preregister`, `register.code`; "a signed-in user reaches the set-password page without a registration key under an empty matrix"; refusals observed by URL | Its matrix cases are this phase's states: rewritten, and the natural home of the E2E half of D-05 (it already rewrites the matrix per test) |
| `tests/tests/fixtures/contestant/contestant-entity-selection.ts` | Asserts `login.email` visible after a sign-out | One assertion |
| `tests/tests/specs/perm/perm-access-disable.spec.ts` | `login.email` visible or hidden under the access switches | Three assertions; which screen it opens decides |

Also touching the entry pages: `perm-answers-locked.spec.ts` (`login.answersLockedInfo`, J5), `contestantLogoutButton.fixture.ts` (`toHaveURL(/\/contestant\/login/)`, which B's path also matches), `contestantForgotPasswordPage.fixture.ts`, `contestantPasswordSetter.fixture.ts` (`password.submit`, the shared `set-password-submit` id of the reset and register pages), `contestantPreregisterPage.fixture.ts` (unchanged by this phase), `tests/tests/utils/contestantAxeScan.ts` (`CONTESTANT_LOGIN_URL = /\/contestant\/login(\/|$|\?|#)/`, which matches B as well), `tests/tests/fixtures/shared/emailBucket.fixture.ts` (`toCallbackUrl`), `tests/tests/utils/mailedLink.ts` (`SIGN_IN_LINK_TYPE = 'magiclink'`: the recovery link needs a twin or a parameter), `tests/tests/utils/supabaseAdminClient.ts` (a `resetPasswordForEmail` reference to remove), and the Admin App's `adminLoginPage.fixture.ts` and `admin-auth.setup.ts`, which use `testIds.contestant.password.field` because the Admin login page renders the same `PasswordField`.

**Prescription.** Consolidate before rewriting: one page object for B, used by `registerAndStoreSession`, the four perm setups and the specs, so that the screen's rewrite touches one file. Then land B as a **new route beside the unchanged login page**, re-point the page object to B's route key, close that plan on a green full run, and only then take the form off A. The removal lands after its replacement works (D-23), and no commit exists on which the suite's stored sessions cannot be made. The plan that does this is written as the operator's standing rule asks: audit, then fixtures, then specs.

## Architecture Patterns

### System architecture diagram

```
                          anonymous visitor
                                 |
                 +---------------v----------------+
                 |  A  /contestant/login          |  two links, no form
                 +------+------------------+------+
        "Sign in with   |                  |  "Register" (only when
         email"         |                  |   isAnyRegistrationAllowed)
                 +------v------+    +------v---------------------------+
                 | B login/    |    | C register  (radio per allowed   |
                 |   email     |    |   mode; one Continue)            |
                 +--+-------+--+    +--+----------+----------------+---+
   form action      |       |  "no     | identity  | email          | code
   passwordLogin    |       |  password| provider  |                |
   (claim, refresh, |       |  yet"    v           |         checkInvitationCode
    gate)           |       |     legacy           |          valid | used | else
                    |       |     preregister/     |            |      |     '-> error beside
                    |       |     (179 rebuilds)   |            v      v          the field
                    |       |                      |          D1     D2 register/sign-in
                    |       |                      |     register/   | form action
                    |       |                      |       email     | invitationCodeLogin
                    |       +----------+-----------+------+   |      | (claim, refresh, gate)
                    |                  | requestSignInLink|   |      |
                    |                  v  / recovery op   v   v      |   "I never set
                    |          +-------------------------------+     |    a password"
                    |          | account-access (Edge Function)|<----+---- request-link
                    |          | answers { accepted } first,   |     |     with the code
                    |          | then: eligibility + slot (SQL)|     |
                    |          | -> matrix condition (D-05)    |     |
                    |          | -> create passwordless user   |     |
                    |          | -> mint token -> SMTP mail    |     |
                    |          +---------------+---------------+     |
                    |                          | (nothing shown)     |
                    |               +----------v-----------+         |
                    |               | E  /contestant/      |         |
                    |               |    email-sent        |         |
                    |               | wording by origin,   |         |
                    |               | countdown, resend,   |         |
                    |               | ContactSupport       |         |
                    |               +----------------------+         |
                    |                                                |
                    |      mailed link  <SITE_URL>/<locale>/api/auth/callback
                    |                   ?token_hash=…&type=magiclink | recovery
                    |                          |                     |
                    |               +----------v-----------+         |
                    |               | callback: verifyOtp, |         |
                    |               | claim, refresh, land |         |
                    |               +---+--------------+---+         |
                    |     type=magiclink|              |type=recovery|
                    v                   v              v             v
          +--------------------------------+   +------------------+
          | (protected) layout load        |   | password-reset   |
          | session -> user (+passwordSet) |   | (session only)   |
          | -> first needed gate           |   | set, stay signed |
          +---+--------+--------+----------+   | in, app root     |
              |F       |G       |none          +---------+--------+
       set-password  terms    app root                   |
       gate view     gate     -> NothingToEdit           |
       (new)         view     -> entity home <-----------+
                              -> entity selection
```

Reading it: a request for a link never returns anything but "accepted"; the only places the server answers differently by design are the code check (three words) and the two sign-in forms (one failure). Every arrow into the protected layout passes the same load, so F cannot be reached around.

### Recommended project structure

```
apps/frontend/src/
├── routes/contestant/
│   ├── login/+page.svelte                 # A: two links, the locked notice, the error for a spent link
│   ├── login/email/                       # B: +page.svelte, +page.server.ts (the moved action)
│   ├── register/+layout.server.ts         # refuses when no mode is allowed; D1 and D2 when `code` is not
│   ├── register/+page.svelte              # C
│   ├── register/email/+page.svelte        # D1
│   ├── register/sign-in/                  # D2: +page.svelte, +page.server.ts (invitationCodeLogin)
│   ├── email-sent/+page.svelte            # E
│   ├── forgot-password/+page.svelte       # EmailField -> recovery request -> E
│   ├── password-reset/                    # session branch only; a server load in place of the client goto
│   └── (protected)/+layout.server.ts      # asks for passwordSet; gates unchanged in shape
├── lib/contestant/
│   ├── gates/gates.ts, gateViews.ts, SetPasswordGate.svelte
│   └── components/{emailField,emailEntry,passwordSignIn,registrationCodeField,emailSentPanel,registrationModeSelector}/
├── lib/contexts/contestant/               # the entry-flow state, in place of newUserEmail
├── lib/routes/{route.ts,appGates.ts}      # new keys; whenAuthenticatedOnLogin over a set
└── routes/api/auth/callback/+server.ts    # magiclink -> landing; refused types as a set
apps/supabase/supabase/
├── schema/{106,301 or 503,506}-*.sql      # one serial step, one migration regeneration
├── functions/account-access/              # the recovery operation, its eligibility call, its seven mails
└── config.toml                            # minimum_password_length; the hook, if J6 is adopted
```

### Pattern 1: a gate is one list entry, one id, one view; the server decides

**What:** F is `{ id: 'setPassword', isNeeded }` prepended to `CONTESTANT_GATES`, a member added to `ContestantGateId`, and a view added to `GATE_VIEWS`. The record is keyed by the id type, so an id without a view does not typecheck. The layout's focus move is already there and keys on the id changing.
**When:** every "must do this before any protected page" rule. Never a route with a redirect.
**Existing values, verbatim:** [VERIFIED: `lib/contestant/gates/gates.ts` "export type ContestantGateId = 'termsOfUse';"]; [VERIFIED: `lib/contestant/gates/gateViews.ts` "termsOfUse: TermsOfUseGate"]. The id `'setPassword'` below is this document's proposal, not a value on the tree.
**Example:**

```typescript
// Source: lib/contestant/gates/gates.ts on the tree, with the proposed entry in front.
export type ContestantGateId = 'setPassword' | 'termsOfUse';

export const CONTESTANT_GATES: ReadonlyArray<ContestantGate> = Object.freeze([
  Object.freeze({
    id: 'setPassword',
    // Only an answer of `false` asks: the load cannot reach this predicate without the fact.
    isNeeded: (user: GateUserData) => user.passwordSet === false
  }),
  Object.freeze({
    id: 'termsOfUse',
    isNeeded: (user: GateUserData) => user.termsOfUseAccepted == null
  })
]);
```

Passing F is `setPassword` in the browser, then `await invalidateAll()`, exactly as `TermsOfUseGate.svelte` does for the terms. The view carries a `LogoutButton` so the user is never trapped.

### Pattern 2: land the replacement beside the old screen, then remove

**What:** B is created as a new route with its own action; the helpers are re-pointed; the suite is shown green; then A loses its form. The same order applies to the recovery mail (operation, then forgot-password, then the removal of `resetPasswordForEmail`) and to F (gate and callback change in one plan, then the deletion of `register/password`).
**Why here:** § *The E2E estate*. One coupling is hard: **the callback's `magiclink` arm may stop sending a passwordless user to the set-password page only in the commit that adds F**, and the journey spec is re-pointed in that commit. Between the two, a first-time user would land in the app with no password and nothing asking for one.

### Pattern 3: flow state as a private rune field of the context class

**What:** one private `$state` field holding a discriminated union, a getter, explicit transition methods, and a clear in `#reset`. Modelled on `#newUserEmail`.
**When:** the code between C and D1/D2, and what E needs to word itself and to resend.
**Shape (proposal):**

```typescript
// Per context instance. Never module scope: the SSR module graph is shared by every request.
type EntryFlow =
  | { step: 'code'; code: string; status: 'valid' | 'used' }
  | { step: 'emailSent'; origin: 'email' | 'signIn' | 'codeEmail' | 'codeUsed' | 'recovery'; email?: string; code?: string };

#entryFlow = $state<EntryFlow | undefined>(undefined);
```

`status` reuses the two non-failing members of the code check's vocabulary ([VERIFIED: `lib/api/base/dataWriter.type.ts` "export type InvitationCodeStatus = 'valid' | 'used' | 'unknown';"]). The `origin` members are this document's proposal.
E keeps what a resend needs, which for the two code origins is the code itself, so "cleared when the flow ends" has to mean "when the user leaves E, signs in or logs out", not "when the link is requested". The planner states that reading in the plan; it is the only one under which D-11's resend works for D1 and D2.

### Pattern 4: the mode selector renders only the chosen panel

**What:** native radios in a `fieldset` with a `legend`; the panel of the chosen mode is the only one in the DOM (`{#if}`), inside its own `<form method="POST">`.
**Why:** autofill and validation act on what is in the DOM. Three panels in one form would let a browser offer an address in the code panel's sibling and would mix two processes in one form, which the Chromium guidance warns against. With exactly one allowed mode there is no radio and the same panel component is rendered directly, so "single mode" is a state of one component, not a second screen.

### Pattern 5: a recovery request is a second caller of the same link-issue pipeline

**What:** a new operation in the closed set of `contract.ts`, parsed like `request-link` minus `code`; a SQL eligibility function that returns the address **and which mail it gets**; the same slot key as `invitation_link_request`; the same `issueSignInLink` pipeline with the token type, the link builder's `type` and the template chosen by that answer.
**Existing closed set, verbatim:** [VERIFIED: `functions/account-access/contract.ts` "export type AccountAccessRequest = CheckCodeRequest | RequestLinkRequest | CodeSignInRequest;"], operations `'check-code'`, `'request-link'`, `'code-sign-in'`.
**Why the slot must be shared:** the two link kinds are one token family (RQ-1 (e)). With separate slots, a sign-in request and a recovery request for one address inside a minute would each be honoured and the second mail would silently kill the first.
**What the function already gives for free:** the answer before the work (`EdgeRuntime.waitUntil`), the two deployment checks, the release of the slot when no mail was handed over, the witness for tests, the locale resolution against the seven, the link built from `SITE_URL` alone. `flowConformance.test.ts` pins twelve properties of `index.ts` by reading its source ([CITED: `174-NAME-MAP.md` § *Measurements*, plan 174-05, "against twelve mutations of `index.ts`"]); the new operation must leave every one of them true and adds its own (the recovery arm creates no user: an address with no account gets no recovery mail).

### Anti-patterns to avoid

- **A "password chosen" marker the signed-in user can write.** It makes F skippable from the console (J2).
- **A new skip reason in the claim's answer.** It fails the frontend's schema and signs affected users out (J3).
- **A second hand-written copy of the matrix defaults in SQL.** Share one truth table (J3).
- **Reading the mailed link's `type` as proof of anything.** A holder of a sign-in link can present it as `recovery` and land on the reset page, and the reverse. Nothing may be granted or skipped because of the type.
- **A gate predicate that reads an absent fact as "set".** Make the fact required by the predicate's type (J1).
- **A credential form submitted by script with no `method`.** Before hydration the browser's own submit is a GET, and the password is in the URL (§ *Pitfall 8*).
- **Looking anything up on B before leaving for E**, or wording E by what the server did.
- **A redirect target, a URL, a path or any text in a request to `account-access`.**
- **Destructuring `appSettings`, `answersLocked` or the new flow accessor** from the context (the *Context Destructuring Rule*).
- **Reading `url` or a third param in the protected layout's load.** `layout.tracking.test.ts` beside it fails on it.

## Don't Hand-Roll

| Problem | Don't build | Use instead | Why |
|---------|-------------|-------------|-----|
| The mailed link | A URL assembled in the handler | `callbackUrl` / `buildSignInLink` in `functions/account-access/signInLink.ts`, given a `type` | Origin validation, the locale segment and the exact parameter set are tested there |
| Mail locale | A switch on the request's string | `resolveMailLocale`, `SIGN_IN_MAIL_LOCALES` in `mailTemplates.ts` | The closed set and the fallback; the completeness test iterates it |
| The per-address interval | A timestamp column or a client check | `private.invitation_throttle_take` with the existing `link:` key | One slot per address across both link kinds |
| Session admission after any sign-in | Claim and refresh inline | `admitSession`, `passwordLogin`, `invitationCodeLogin` in `lib/auth/` | The order session, claim, refresh, gate is tested red under mutants. The callback holds a second copy of the claim-and-refresh pair (todo `2026-10-07-174-the-claim-and-refresh-pair-exists-twice.md`); adding D2's action is the moment the todo names for extracting it |
| Redirect targets | String concatenation | `buildRoute` with a route key; `safeRedirectTarget` for `redirectTo` and `next` | The one producer and the one validator |
| Matrix reads in TypeScript | A property walk | `isAnyRegistrationAllowed`, `isRegistrationModeAllowed`, `isRegistrationModeAllowedForAnyType` | Defaults, unserved types, malformed rows |
| Password rules | A regex on the page | `PasswordValidator` / `validatePasswordDetails` | The one client rule; give it the address (todo `2026-10-02-password-validator-username-never-passed.md`) |
| Email validity on B, C, D1 | A regex | The input's own constraint validation (`type="email"`, `checkValidity()`) plus the trimmed, case-insensitive comparison of D-12 | The server's own check is only "3 to 320 characters holding `@`" ([VERIFIED: `contract.ts` "isStringOfLength(value, EMAIL_MIN_LENGTH, EMAIL_MAX_LENGTH) && value.includes('@')"]); the browser's is the stricter of the two and needs no code |
| Focus after a gate is passed | A focus call in the gate view | Nothing: the layout does it | Built and tested (T5) |
| The support block | A new component | `ContactSupport` (`action` `'help'` by default) | Built (173) |
| Opening a mailed link in a spec | A hand-built callback URL | `assertSignInLinkShape`, `toRunOrigin` in `tests/tests/utils/mailedLink.ts`, extended to the recovery type | "As received": only scheme, host and port are replaced |
| "No mail was sent" in a spec | A wait | The witness (`invitation_link_witness_open`, the `witness` field, the poll) | The background work is known to be over before the catcher is read |
| Axe scans | `new AxeBuilder` | `assertAxeScan` for signed-out screens (the `loginScan` shape), `declareScans` of `contestantAxeScan.ts` for F | `assert-a11y-scan-wiring.mjs` fails anything else |
| A seeded invitation in a spec | A direct RPC call | The `invitationFlow` seeding steps | One place for 177.1 to change |

**Key insight:** almost every server-side piece of this phase is a second caller of something Phase 174 built and tested under mutation. The new code is the eligibility rule, the matrix reader, seven mail texts and the screens.

## Runtime State Inventory

The phase removes routes, contracts and a mail path, so the question "what still holds the old thing after every file is updated" applies.

| Category | Items found | Action required |
|----------|-------------|-----------------|
| Stored data | None that names a removed symbol. `app_settings.settings` holds the matrix D-05 starts to enforce: the local `default` project stores every mode for both types, the E2E project stores whatever the last spec wrote ([MEASURED: `SELECT project_id, settings #> '{contestantApp,registrationModes}' FROM public.app_settings` → three rows, one of them with no settings members]). `public.invitations` held no row during the session | No data migration (nothing is deployed). The seed templates and the pgTAP fixtures gain matrices where they invite (J3): a code edit |
| Live service config | The auth service reads `config.toml` at stack start: `minimum_password_length` (D-17) and, if adopted, `[auth.hook.send_email]` (J6). The edge runtime serves the function's source as of its start under `per_worker` | One `yarn db:stop` and `yarn db:start` after each such change, by every developer and before every gate run that follows. A hosted project's dashboard must be set to match; the repository cannot do it |
| OS-registered state | None — nothing in the phase is registered with the OS (verified by the absence of any service, scheduler or launch file among the files the phase touches) | None |
| Secrets and env vars | None renamed. The recovery operation uses the function's existing `SITE_URL`, `SMTP_*`, `SUPABASE_*` | None. `assert:edge-function-env` and `assert:env-pair-registry` stay as they are if no variable is added |
| Build artifacts | `apps/frontend/src/lib/paraglide/**` (compiled messages) and `src/lib/types/generated/translationKey.ts` after keys are added or removed; `packages/supabase-types/src/database.ts` and the single migration after the schema step; `.svelte-kit` route types after routes are added or deleted; the generated component listing in the docs site | Regenerate each with its own command in the commit that changes its source (`generate:translation-key-type`, `yarn db:types`, `yarn schema:regenerate`, `yarn workspace @openvaa/docs generate:docs`) |

Browser-held state worth naming: a password manager's saved entry for the old login URL keeps working, because B's form keeps the same field semantics on a new path of the same origin; nothing can or need be migrated.

## Common Pitfalls

### Pitfall 1: the "password set" helper is not reachable where D-06 puts it
**What goes wrong:** `get_user_entities` gains a call to `private.user_password_set` and either the migration fails to apply or every signed-in call answers `permission denied for function user_password_set`, which the layout reads as a failed list and signs everyone out.
**Why:** no API role may execute the helper (T7), and it is defined two files later.
**How to avoid:** the zero-argument wrapper of J1, defined before `503`, granted to `authenticated`.
**Warning signs:** `yarn db:reset` fails naming the function; or every protected page bounces to the login page with `loginFailed` after the schema step.

### Pitfall 2: the matrix condition turns the invitation estate red
**What goes wrong:** pgTAP file 39 and `invitation-contract.spec.ts` fail in dozens of rows that have nothing to do with the change's intent.
**Why:** the default matrix allows nothing and the fixtures store none; the base dataset allows nothing for organizations (J3).
**How to avoid:** the fixture matrices land in the commit that adds the condition, and the new assertions (a mode switched off reads as absent, in status, body and effect) are added beside them. Decide the base dataset's organization row deliberately (D-21 leaves it to the planner): widening it to `['email', 'code']` keeps the contract spec's rows meaningful and lets the organization code spec run on the base dataset, at the price of the two pins (`base-app-settings.test.ts`, `built-in-templates-contestant-app.test.ts`) and of whatever the perm templates are pinned equal to.
**Warning signs:** `check-code` answering `unknown` for a code just seeded; a witness reading `not-sent` for an invited address.

### Pitfall 3: the suite's stored sessions die with the form on A
**What goes wrong:** one failed setup and every dependent project "did not run", which the cardinal rule counts as failures.
**Why:** § *The E2E estate*.
**How to avoid:** Pattern 2. And wait on a positive sign of the landed page (a test id of the home or of a gate view) rather than on the URL having left `/login/`: B's path contains `login` too, so the helper's present regular expression still works, but the investigation in flight is about exactly this wait.
**Warning signs:** `Login form did not appear after 3 attempts.`

### Pitfall 4: the countdown ends before the server's slot does
**What goes wrong:** the user presses Resend the moment it is enabled and no mail comes; the screen, by decision, says nothing.
**Why:** `request-link` answers before its work, and the slot is taken in that work, after the answer. A client countdown of exactly 60 seconds that starts when the answer arrives can end a few milliseconds before the 60-second slot does. UNCONFIRMED by a run; it follows from the order in `linkIssue.ts` (the eligibility call that takes the slot is inside `attempt`, which runs under `EdgeRuntime.waitUntil` after the response).
**How to avoid:** enable Resend a margin after the server's interval (65 seconds, or 60 shown and a short tail), stated in the plan as a deviation from D-11's letter in favour of its purpose. In E2E, never wait it out: advance the page's clock for the countdown and give the server slot back with the admin client's `releaseLinkSlot`.
**Warning signs:** an E2E resend case that passes alone and fails under load.

### Pitfall 5: one token family, two mails
**What goes wrong:** a user asks for a sign-in link, then for a password reset, and opens the first mail: "link invalid". Or opens the reset mail, and the unopened sign-in mail is dead.
**Why:** RQ-1 (e). It also holds for the identity-provider flow, whose function mints a `magiclink` on every sign-in.
**How to avoid:** one slot per address across both operations; both mails say that only the newest mail's link works; A shows a message for a spent or expired link (T9) with a way to ask again.
**Warning signs:** `otp_expired` on a link that was never opened.

### Pitfall 6: an oracle by accident
**What goes wrong:** E, B or forgot-password behaves differently for an address the server knows.
**Where it creeps in:** awaiting the request before navigating and showing a spinner whose length depends on the answer (it does not today: 4 to 9 ms for every address, but a thrown transport error is different from a 200); disabling Resend by what the last request "did"; an `aria-live` text that differs; B's link button validating against anything but the field's own syntax; a recovery operation that answers 404 because `generateLink` did.
**How to avoid:** the screen navigates on the request's settlement whatever it was, success or throw, and words itself from the origin alone. The negative E2E cases of D-21 assert identical text and controls for an invited and an uninvited address and read the mail catcher only after the witness.

### Pitfall 7: the default-suite server serves another project than the function expects
**What goes wrong:** the new operation works by hand and finds nothing in E2E.
**Why:** the function takes its project from the request, never from its environment, and the project-scoping gate requires the term at the one invocation site ([VERIFIED: `supabaseDataWriter.ts` "body: { ...fields, operation, project_id: this.projectId }"]). A second invocation site would be a second place to forget it.
**How to avoid:** widen the private method's operation union; add no new `functions.invoke`.

### Pitfall 8: the password forms as they are do not meet D-15
**What goes wrong:** a manager does not offer to save on F, or saves a password without an address; before hydration a submit puts a credential in the URL.
**Why:** T11. `PasswordSetter` is itself the `<form>`, has no username field, names both inputs `password`, and its consumers submit by an `onclick` on a button outside the form. A form with no `method` submits by GET.
**How to avoid:** the read-only `username` input goes **inside** `PasswordSetter`'s form (a new prop carrying the address, also handed to `PasswordValidator`); the confirmation field gets its own `name`; the submit control is inside the form or tied to it by the `form` attribute and the page handles `onsubmit`; every credential or address form submitted by script carries `method="POST"` and keeps its submit control disabled until the component has mounted. `PasswordSetter` has three consumers today (settings, reset, the legacy set-password page), and `PasswordField` is also the Admin login's password input, so the change is made once and read on all of them.
**Warning signs:** a URL with `?password=` in a trace; an axe finding for a field without a label on F.

### Pitfall 9: a change that is not served
**What goes wrong:** a fix to the function or to `config.toml` is judged against the old one.
**Why:** both are read when the stack starts [CITED: `174-NAME-MAP.md` rows E8 and O-13].
**How to avoid:** `yarn db:stop` then `yarn db:start` after each, and the gate driver's stack row before any verdict.

### Pitfall 10: three phases, one migration file
**What goes wrong:** a regenerated migration silently drops a neighbour's edit, or `assert:schema-migration-parity` goes red on a rebase.
**Why:** 177, 177.1 and this phase each edit `schema/*.sql` and regenerate `00001_initial_schema.sql`.
**How to avoid:** one schema plan in this phase, executed after the other two phases' schema plans are on the tree, with every edit named by content anchor; regenerate once, at its end.

### Pitfall 11: removing `resetPassword` and `requestForgotPasswordEmail` reaches the Admin context
**What goes wrong:** the frontend type check fails in `adminContext.svelte.ts`, or a wrapper is left forwarding a method that no longer exists.
**Why:** T10.
**How to avoid:** change `AuthContext` and both contexts that forward it in one commit, with `authContext.svelte.test.ts`.

### Pitfall 12: message keys with a second owner
**What goes wrong:** pruning `contestantApp.register` removes `contestantApp.register.passwordValidation.*`, which `PasswordValidator` renders on F, on the reset page and in settings.
**How to avoid:** derive each namespace's dead keys by search for the full key, not by namespace; move `passwordValidation` if `register` is to be emptied. `assert:i18n-catalog-namespaces` and `lib/i18n/tests/translations.test.ts` hold the seven locales to one key set.

## Code Examples

### D2's form action (the first caller of `invitationCodeLogin`)

```typescript
// Source: the login action on the tree (routes/contestant/login/+page.server.ts) and
// 174-NAME-MAP.md § "Obligations to later phases", the row on invitationCodeLogin.
import { fail, redirect } from '@sveltejs/kit';
import { createDataWriter } from '$lib/api/dataWriter';
import { CONTESTANT_GRANTS, invitationCodeLogin } from '$lib/auth';
import { buildRoute } from '$lib/routes';

export const actions = {
  default: async ({ request, locals, fetch }) => {
    const data = await request.formData();
    const writer = createDataWriter({ fetch, locals });
    const outcome = await invitationCodeLogin({
      context: {
        auth: locals.supabase.auth,
        getSession: locals.safeGetSession,
        claimInvitations: () => writer.claimInvitations(),
        signInWithInvitationCode: async (c) => (await writer.signInWithInvitationCode(c)).type === 'success'
      },
      // The code arrives in the body, from a hidden field the page fills from the context.
      code: data.get('code') as string,
      password: data.get('password') as string,
      allowedGrants: CONTESTANT_GRANTS,
      logLabel: 'Contestant code sign-in'
    });
    if (!outcome.ok) return fail(outcome.status);
    return redirect(303, buildRoute({ route: 'ContestantAppHome', locale: locals.currentLocale }));
  }
};
```

`invitationCodeLogin` returns 400 for every refusal ([VERIFIED: `lib/auth/invitationCodeLogin.ts` "return { ok: false, status: 400, reason: 'invalidCredentials' };"]) and whatever `admitSession` returns after it (403 `grantNotAllowed`, 500 `noSession`).

### The "password set" fact for the caller only

```sql
-- Defined before 503-entity-rpcs.sql. No argument: it can answer for nobody but the caller.
CREATE OR REPLACE FUNCTION private.caller_password_set () RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET
  search_path = '' AS $$
  SELECT private.user_password_set((SELECT auth.uid()));
$$;

REVOKE EXECUTE ON FUNCTION private.caller_password_set () FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.caller_password_set () TO authenticated;

-- In get_user_entities, beside 'entities':
--   'password_set', private.caller_password_set()
```

The function names `private.caller_password_set` and the key `password_set` on this RPC are proposals; `private.user_password_set (p_user_id uuid)` is on the tree.

### The matrix rule with a pure core

```sql
-- IMMUTABLE and table-free, so a truth table can be asserted against it directly.
CREATE OR REPLACE FUNCTION private.registration_mode_allowed_in (p_settings jsonb, p_entity_type text, p_mode text)
RETURNS boolean LANGUAGE sql IMMUTABLE
SET
  search_path = '' AS $$
  SELECT COALESCE(
    (
      -- Served: the declared members of the vocabulary, or 'candidate' alone when none is declared.
      CASE
        WHEN jsonb_typeof(p_settings #> '{contestantApp,entityTypes}') = 'array'
             AND ((p_settings #> '{contestantApp,entityTypes}') ? 'candidate'
               OR (p_settings #> '{contestantApp,entityTypes}') ? 'organization')
          THEN (p_settings #> '{contestantApp,entityTypes}') ? p_entity_type
        ELSE p_entity_type = 'candidate'
      END
    )
    AND p_entity_type IN ('candidate', 'organization')
    AND p_mode IN ('identity_provider', 'email', 'code')
    AND jsonb_typeof(p_settings #> '{contestantApp,registrationModes}') = 'object'
    AND jsonb_typeof(p_settings #> ARRAY['contestantApp', 'registrationModes', p_entity_type]) = 'array'
    AND (p_settings #> ARRAY['contestantApp', 'registrationModes', p_entity_type]) ? p_mode,
    false
  );
$$;
```

The mode literals are the tree's ([VERIFIED: `packages/app-shared/src/settings/contestantAppConfig.ts` "IdentityProvider: 'identity_provider'", "Email: 'email'", "Code: 'code'"]), as are the two served types ("export const SERVED_ENTITY_TYPES = ['candidate', 'organization'] as const"). The sketch is a transcription to be proved by the truth table, not a tested function: it has not been run.

### The condition in the code check, on open rows only

```sql
-- invitation_code_status: a claimed row answers `used` whatever the matrix says now.
SELECT CASE
  WHEN i.claimed_at IS NOT NULL THEN 'used'
  WHEN i.expires_at IS NOT NULL AND i.expires_at <= now() THEN 'unknown'
  WHEN i.scope = 'entity'
       AND i.target_type IN ('candidate', 'organization')
       AND NOT private.registration_mode_allowed(i.project_id, i.target_type::text, 'code') THEN 'unknown'
  ELSE 'valid'
END
```

A row's mode needs no column: [VERIFIED: `schema/305-invitations.sql` "CONSTRAINT invitations_binding_check CHECK (num_nonnulls (email, code_hash) = 1),"], so a row with an `email` is the `email` mode and a row with a `code_hash` is the `code` mode.

### The session gate over a set of entry routes

```typescript
// lib/routes/appGates.ts: the row names every route a signed-in caller is bounced from.
// hooks.server.ts then tests membership instead of equality with one route id.
entryRoutes: Object.freeze([
  'ContestantAppLogin', 'ContestantAppLoginEmail', 'ContestantAppRegister',
  'ContestantAppRegisterEmail', 'ContestantAppRegisterSignIn', 'ContestantAppEmailSent'
] satisfies ReadonlyArray<Route>)
```

`'ContestantAppLogin'` and `'ContestantAppRegister'` are keys on the tree ([VERIFIED: `lib/routes/route.ts` "ContestantAppLogin: `${CONTESTANT}/login`," and "ContestantAppRegister: `${CONTESTANT}/register`,"]); the other four keys and the member name `entryRoutes` are proposals. `forgot-password` and `password-reset` stay out of the set (D-04). The Admin row holds its one login route.

## State of the Art

| Old approach | Current approach | When changed | Impact |
|--------------|------------------|--------------|--------|
| The auth service's own recovery mail with a PKCE `code` (`resetPasswordForEmail`) | A server-issued `token_hash` link to the app's own callback | Phase 174 for sign-in links; this phase for recovery | The link completes in any browser; the mail is the deployment's own, in seven locales |
| Set a first password on a page, then sign in again | An in-layout gate; the user stays signed in | this phase | One fewer step, and no window in which a user with no grant is refused without explanation |
| The matrix decides what the login page shows | The matrix also decides what the server honours | this phase (D-05) | A mode switched off is closed, not hidden |
| A registration key in the URL | A code typed into a field and carried in memory | this phase | The credential is in no history, `Referer` or log |

**Deprecated on the tree after this phase:** `ContestantAppSetPassword`, `register/password`, `checkRegistrationKey`, `register`, `CheckRegistrationData`, `resetPassword`, `newUserEmail`, `toCallbackUrl`, the `registrationKey`, `username` and `email` URL parameters, `registrationCodeGuard.ts`.

## Assumptions Log

| # | Claim | Section | Risk if wrong |
|---|-------|---------|---------------|
| A1 | Verifying a `recovery` token does not change `encrypted_password`, on the running stack | RQ-1 (c) | F would be skipped for a passwordless user who used forgot-password; the eligibility rule sends such a user a sign-in link instead, which bounds it, but the probe must show it |
| A2 | A recovery link and a sign-in link invalidate each other, both when issued and when opened | RQ-1 (e), Pattern 5, Pitfall 5 | If they do not, the shared slot is merely conservative; if they do and the slot is not shared, mails die silently |
| A3 | `PUT /user { password }` on a link session keeps the session usable and the next server load reads `password_set = true` with no `refreshSession()` | RQ-3 | F loops or signs the user out after setting the password; the remedy is the `refreshSession()` the `_setPassword` comment names, or a full page load as the reset page does today |
| A4 | A `LANGUAGE sql` function cannot be created naming a function defined in a later schema file | J1 | If it can, the relocation is unnecessary but harmless |
| A5 | `minimum_password_length` binds `PUT /user` and admin `createUser` with a password, and does not stop a sign-in with an existing shorter one | RQ-4 | A fixture user with a short password would fail to be created; none was found |
| A6 | A no-op send-email hook leaves `generate_link` and `/verify` working on this stack, and stops the email-change mail | J6, RQ-5 | The function's mails would stop, or 179's pending-address mail would be sent in English by the auth service |
| A7 | `page.clock` is available in Playwright 1.63.0 and can drive a Svelte interval | Validation Architecture | The resend case waits a real minute, or the countdown is made injectable |
| A8 | The countdown can end before the server's slot | Pitfall 4 | If not, the margin is harmless |
| A9 | The password sign-in's timing does not tell an unknown address from a wrong password | RQ-11 | A residual of the auth service, reachable directly with the anon key whatever the screen does; stated in the docs |
| A10 | About seven of the contract spec's fifteen tests change under D-05 with the base matrix as it is | J3 | Counted from the spec's seeding lines and test titles, not from a run; the true count is whatever the first run shows |
| A11 | Phase 177.1 lands with the fixture-level form its unfilled discussion document proposes | Phase 177.1 dependency | The seeding steps' signature differs; still one place to change |

## Open Questions

### For the operator

1. **J1 — where "password set" rides.**
   - (a) A key on `get_user_entities` through a new zero-argument private definer function, surfaced as a fact the gates require and other callers of `getBasicUserData` do not pay for. **Recommended.** It honours the NOTE; the context's letter ("through the private definer helper") cannot be implemented (T7).
   - (b) The same key, filled unconditionally inside `_getBasicUserData`: every Admin job poll makes one more database round trip.
   - (c) A small dedicated RPC: the census of `07-rpc-security.test.sql` grows by one, and the NOTE reads as ruling it out.
2. **J2 — identity-provider accounts.**
   - (a) Build F on the column, change nothing in `identity-callback`, hand the question to Phase 179; and refuse the callback's `signup` and `email` link types here, which close the last path that stores a password nobody chose. **Recommended.**
   - (b) Record the user's choice in a marker instead (the pending todo's proposal): forgeable unless a new service-role operation writes it.
3. **J3 — the matrix on the server.** Four rulings inside the settled "yes":
   - Open rows only (a claimed code keeps answering `used`; D2 and a returning user's link are untouched), or every row. **Recommended: open rows only.**
   - Faction and alliance targets: not judged (the matrix has no row for them), or always refused. **Recommended: not judged**, as project-scope promises are not.
   - A disallowed row at the claim: absent from the answer, or reported as skipped with a new reason. **Recommended: absent**; a new reason needs a schema change on the frontend and tells the caller why.
   - The base E2E dataset's organization row: widened to `['email', 'code']`, or left empty with the contract spec re-pointed and the organization code spec given its own settings. **Recommended: widened.** It reverses X1 (a) of the discussion document for the base dataset, which is why it is asked.
4. **J4 — the route reading.** `register/` is the one tree at the milestone's close, `register/identity-provider` reserved, `preregister/` not moved here. **Recommended as the context has it**; nothing on the tree argues otherwise. Proposed names: `login/email`, `register/email`, `register/sign-in`, `email-sent`.
5. **J5 — answers locked.**
   - (a) A offers sign-in only with the locked notice; `register/**` refuses by redirect to A; the stored value joins `contestant_app_public_config`; the server contract is not conditioned. **Recommended.** Note that this is a small change of today's behaviour, not a preservation of it (T8): today the code link stays visible and the register tree shows a message.
   - (b) Registration stays open while answers are locked.
   - (c) As (a) without the public-config member: an anonymous visitor of a closed project is offered registration while answers are locked.
6. **J6 — the no-op send-email hook.**
   - (a) Adopt here, as its own late plan, after the probe shows what it does (RQ-5). **Recommended**: after this phase the application needs no mail from the auth service, and Phase 179 must send its own localised mail in any case.
   - (b) Leave it to Phase 179, which owns the one mail the hook interacts with.
   - (c) Do not adopt; the auth service's own `/otp` and `/recover` mails stay a documented residual.
   Under every option the `/otp` answer still tells a registered address from an unregistered one; that residual is filed, not closed.
7. **RQ-8 — mail scanners that follow links.** A scanner's `GET` spends the token and the user meets "link invalid" (which today shows no message at all, T9).
   - (a) Keep verify-on-open in this phase; show a clear message on A for a spent or expired link, with the way to ask again; file the confirm-then-verify page as a todo. **Recommended**: it is what the context decided to raise rather than build, and the message is needed anyway.
   - (b) Add a confirmation page now: the mailed link opens a page with one button, and only the button verifies. It changes the link's landing, the E2E link helpers and Phase 174's contract spec.
8. **A first-time user with no contestant grant at B (D-08's residual).** After this phase such a user reaches "nothing to edit" through a mailed link, and is refused with 403 when signing in with the password they then set.
   - (a) Word B's 403 for it and file the inconsistency. **Recommended** for this phase.
   - (b) Let the contestant sign-in admit a user with no contestant grant to the app root, as the mailed link already does. It changes what `passwordLogin`'s grant gate means for the Contestant App and is best decided with the Admin App's gate (todo `2026-10-07-174-admin-grants-admit-no-project-editor.md`).

### For the planner (no operator needed)

9. **Where a visitor bounced from a protected URL lands.** The hook sends them to `ContestantAppLogin` with `redirectTo`. Either A forwards a `redirectTo` to B's link (A stays the entry for everyone; recommended, since a new user following a deep link needs Register), or the row's unauthenticated redirect names B. In both cases only B's action validates the value.
10. **When the flow state is cleared** (Pattern 3): on leaving E, on sign-in and on logout.
11. **The resend margin** (Pitfall 4).
12. **Whether `password-reset` gets a server load** to refuse a visitor with no session, in place of the client-side `goto` it has now. Recommended: yes; it removes a flash of the form for a signed-out visitor.
13. **Whether the claim-and-refresh pair is extracted** when D2's action is added (the todo's own suggestion). Recommended: yes, in the plan that touches the callback.

## Environment Availability

| Dependency | Required by | Available | Version | Fallback |
|------------|-------------|-----------|---------|----------|
| Node | everything | yes | v24.21.0 (after the `PATH` export) | — |
| Yarn | everything | yes | 4.18.1 | — |
| Docker with the local Supabase stack | schema, function, E2E, probes | yes, running | `postgres:17.6.1.171`, `gotrue:v2.197.0`, `edge-runtime:v1.76.2` | — |
| Supabase CLI | `db:reset`, `db:types`, restarts | yes | 2.118.0 | — |
| `psql` | read-only checks, pgTAP | yes | — | `docker exec` |
| Mail catcher on port 54324 | the mailed-link specs, the probes | part of the stack | — | — |
| Playwright with its browsers | E2E | installed | 1.63.0 | — |
| A second, unrelated Supabase stack on the host (`next-supabase-skimle2`) | nothing | present | — | A Docker restart would kill it: use `docker builder prune -af` first when disk runs short (project memory) |

**Missing dependencies with no fallback:** none.
**Missing dependencies with fallback:** none.
**Host conditions the executor must respect:** the stack is restarted by this phase (config and function changes), which no other session may be relying on at that moment; the wrapper's void-run rule and the watchdog rule for long gates apply (run long gates in the background and poll).

## Validation Architecture

`workflow.nyquist_validation` is absent from `.planning/config.json`, so validation is enabled.

### Test framework

| Property | Value |
|----------|-------|
| Unit and component | vitest, per workspace: `apps/frontend/vitest.config.ts`, `apps/supabase` (the functions' pure modules), `packages/dev-seed`, `packages/app-shared`, and `tests/vitest.config.ts` (the harness's own helpers) |
| Database | pgTAP, `apps/supabase/supabase/tests/database/*.test.sql`, on a freshly reset database |
| End to end | Playwright through `tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/<name> --no-db-reset` |
| Quick run (frontend) | `yarn workspace @openvaa/frontend test:unit` |
| Quick run (functions) | `yarn workspace @openvaa/supabase test:unit` |
| Quick run (harness helpers) | `yarn test:unit:tests` |
| Full unit | `yarn test:unit` |
| Static gates | `yarn lint:check` (carries `assert:auth-signup-closed`, `assert:a11y-scan-wiring`, `assert:i18n-catalog-namespaces`, `assert:schema-migration-parity`, `assert:project-scoped-queries`, `assert:no-candidate-app-names`, `assert:comment-hygiene`, the edge-function gates), `yarn format:check`, `yarn workspace @openvaa/frontend check`, `yarn build` |
| Gate driver model | `.planning/phases/176-contestant-home-task-state-nominations-view/176-gates.sh`, `176-e2e.sh`, `176-verdict.mjs`: one row per gate, each status read from the command's own exit code, never through a pipe |

### Wave 0: what must be measured before anything is built

One probe script in the phase directory, modelled on `174-fn-probe.mjs`, run against the local stack under `caffeinate`, creating and deleting its own users under an address prefix of its own, its lines recorded in the phase's name map. It writes to the auth service, so it is the executor's, not this researcher's.

| Row | Question | Decides |
|-----|----------|---------|
| P1 | RQ-1: for a user with a password and for a passwordless one, `generateLink({ type: 'recovery' })`, verify as `recovery`: session? `encrypted_password` before and after? second presentation refused? | A1; whether a passwordless grant-holder may be sent a recovery link at all |
| P2 | RQ-1 (e): issue sign-in then recovery, verify the first; issue recovery then sign-in, verify the first; open one, verify the other | A2; the shared slot; both mails' wording |
| P3 | RQ-2: the truth table through `private.user_password_set`, for the two-call recipe before and after the first verify, `forceRegisterUser`, an `identity-callback`-shaped `createUser`, after `PUT /user { password }`, after a recovery verify | The states F meets; how the axe scan's passwordless session is seeded |
| P4 | RQ-3: on a link session held in a browser context, `updateUser({ password })`, then a server request with the cookies as they are: does `get_user_entities` (or today's claim) read `password_set = true`? did the access token change? | A3; whether `_setPassword` needs `refreshSession()` |
| P5 | RQ-4: with `minimum_password_length = 8` and one restart: `PUT /user` with seven and with eight characters; admin `createUser` with seven; a sign-in with an existing seven-character password | A5; the docs line |
| P6 | RQ-5 (only if J6 (a)): with a no-op hook and one restart: `generate_link`, `/verify`, `POST /otp` and `POST /recover` for a registered and an unregistered address (status, and the mail catcher), an email change | A6; what is filed as the residual |
| P7 | RQ-11: thirty password sign-ins each for an unknown address, a wrong password and a passwordless account, through B's action once it exists: status, body, the spread of the timings | A9; the residual's wording |

P5 and P6 each change `config.toml` and restart the stack, so they are run in the plan that makes the change, not ahead of it.

### Phase requirements → test map

| Req | Behaviour | Type | Command | Exists? |
|-----|-----------|------|---------|---------|
| REG-01 | A shows two entries; Register only when a mode is allowed; both are links that work before hydration | component + E2E | `yarn workspace @openvaa/frontend test:unit -- src/routes/contestant/login`; the rewritten matrix cases of `perm-closed-project.spec.ts` | no — Wave 0 (page test); the spec exists and is rewritten |
| REG-01 | A signed-in user is bounced from every entry route | unit | `… test:unit -- src/lib/routes/appGates.test.ts src/lib/routes/routeConsistency.test.ts` | exist; extended |
| REG-02 | The link button is shown under the email or the identity-provider mode; with an address it requests and leaves for E whatever the answer; without one it reports beside the field | component + E2E | `… test:unit -- src/routes/contestant/login/email` | no — Wave 0 |
| REG-03 | C lists the allowed modes, opens one panel, validates on Continue; one mode is shown directly | component + E2E + axe | `… test:unit -- src/lib/contestant/components/registrationModeSelector` | no — Wave 0 |
| REG-09 | `valid` → D1, `used` → D2, anything else (a thrown check included) → the one text | component + E2E | the code spec (new) | no — Wave 0 |
| REG-09 | D2's action: one failure for every refusal; the code only in the body | unit | `… test:unit -- src/routes/contestant/register/sign-in` | no — Wave 0; `invitationCodeLogin.test.ts` exists |
| REG-09, D-05 | A mode switched off reads as absent at the code check, the link request and the claim, for open candidate and organization rows only | pgTAP | `39-invitations.test.sql` (fixture matrix + a new section) | exists; extended |
| D-05, RQ-6 | SQL and TypeScript give one answer for every stored shape | pgTAP + vitest | new `45-registration-mode-matrix.test.sql`; new `packages/dev-seed/tests/registrationModeMatrixParity.test.ts` | no — Wave 0 |
| REG-10 | E: wording by origin, no address for the used-code origin, countdown, polite announcement, no result shown | component | `… test:unit -- src/lib/contestant/components/emailSentPanel` | no — Wave 0 |
| REG-10 | An invited and an uninvited address get the same screen; only the invited one a mail (after the witness) | E2E | the email spec (new) | no — Wave 0 |
| REG-11 | The gate list asks F first; a user without the fact cannot be evaluated (type); a failed read signs out | unit | `… test:unit -- src/lib/contestant/gates/gates.test.ts "src/routes/contestant/(protected)/layout.server.test.ts"` | exist; extended |
| REG-11 | `get_user_entities` carries `password_set` for the caller and for nobody else; anon is refused | pgTAP | `36-entity-identity.test.sql` | exists; extended |
| REG-11 | A link-created user sets a password on F, passes G and reaches the home without a second sign-in | E2E | the email spec; the journey | new / rewritten |
| REG-11 | The callback lands every `magiclink` user on the root; `invite`, `signup`, `email` are refused unverified | unit | `… test:unit -- src/routes/api/auth/callback/server.test.ts` | exists; rewritten |
| REG-13 | Every attribute of D-15 on every input; one form per process; a real submit; the address reaches the validator | component | the six new component tests; `PasswordSetter.svelte.test.ts` | partly; extended |
| REG-13 | Managers offer to save and fill | manual | the list under RQ-7, two browsers | manual-only: no test can drive a password manager |
| FIX-01 | The recovery operation: closed-set parse, uniform answer before the work, the shared slot, no user created, seven mails | unit | `yarn workspace @openvaa/supabase test:unit` (`contract`, `flowConformance`, `mailTemplates`, `linkIssue`) | exist; extended |
| FIX-01 | The eligibility rule: a grant-holder gets recovery, an invitation-only address a sign-in link, anyone else nothing | pgTAP | `39-invitations.test.sql`, a new section | extended |
| FIX-01 | The mailed recovery link, opened as received in a context that never asked for it, lands on the reset page signed in; the new password signs in | E2E | the forgot-password case (new); the journey's reset step without `toCallbackUrl` | new / rewritten |
| D-17 | The length is 8 in `config.toml` | gate | `node scripts/assert-auth-signup-closed.mjs` and its `--self-test` | exists; extended |
| D-22 | A, B, C per panel and single-mode, D1, D2, E per wording, F, forgot-password, password-reset, light and dark | E2E axe | the scan entries | four old entries replaced |
| REG-14 (part) | The removed names are gone | search | zero hits outside `.planning/` for `toCallbackUrl`, `checkRegistrationKey`, `CheckRegistrationData`, `registrationKey`, `newUserEmail`, `resetPasswordForEmail`, `ContestantAppSetPassword` | — |
| E2E-03 | The full suite | E2E | one wrapper run, zero failed, zero did not run | — |

### Sampling rate

- **Per task commit:** the workspace's own unit run for the files touched, plus `yarn workspace @openvaa/frontend check` when a route or a type moved.
- **Per plan close:** the gate driver's rows for what the plan touched; a full wrapper-driven E2E run for every plan that changes a screen, a helper, the callback, the schema or the function.
- **Phase gate:** the full row set on one tree (reset, types with no diff, pgTAP, SQL lint, parity, unit, lint, format, type check, build), one full E2E run on a freshly started server, the two opt-in bank-auth projects each alone (the entry to their flow, the gate table and `[auth]` all change), and the zero-hit searches.

### Wave 0 gaps

- [ ] The probe script and its recorded rows P1 to P4 (P5 to P7 in their plans)
- [ ] `tests/database/45-registration-mode-matrix.test.sql` — the truth table (number 45 assumes Phase 177's 43 and 44 are on the tree)
- [ ] `packages/dev-seed/tests/registrationModeMatrixParity.test.ts` — the same table against the TypeScript accessor
- [ ] A matrix in the setup of `39-invitations.test.sql`, and in the E2E datasets that invite (J3)
- [ ] One page object for B, and `registerAndStoreSession` plus the four perm setups re-pointed to it
- [ ] `mailedLink.ts` able to assert a recovery link's shape (and its own test in `tests/tests/utils/`)
- [ ] Fixture steps for the new screens (A, B, C, D1, D2, E, F) before any spec that uses them
- [ ] A seeded passwordless session for F's scan, made by the two-call recipe and not by `forceRegisterUser`
- [ ] The phase's own gate driver, verdict script and baseline, after the model of Phase 176's

## Security Domain

`security_enforcement` is not set to `false`, so this section applies.

### Applicable ASVS categories

| ASVS category | Applies | Standard control on this tree |
|---------------|---------|-------------------------------|
| V2 Authentication | yes | The auth service's password grant and one-time `token_hash` links; one failure answer per sign-in form; `minimum_password_length` raised to the client's rule; the client composition rules in `PasswordValidator`; no credential in a URL; a per-code look-up budget and a per-address mail interval in SQL |
| V3 Session management | yes | `@supabase/ssr` cookies written by the request's own server client; session, claim, refresh, then gates at every entry point; a failed claim on a sign-in link drops the session |
| V4 Access control | yes | Row-level security and `user_can` in the database; the gates are view gates decided by the server load; the matrix condition in definer functions |
| V5 Input validation | yes | `parseAccountAccessRequest` (closed operations, bounded fields); zod narrowing of every answer; `safeRedirectTarget`; the locale against a closed set |
| V6 Cryptography | yes, none hand-rolled | Tokens, hashes and password storage are the auth service's; code hashing is `private.invitation_code_hash` |
| V7 Errors and logging | yes | `describeFailure` logs a name and a code only; no address, code, token or password in a log line |
| V13 API | yes | One anonymous endpoint, answer returned before the work, nothing caller-written in a mail |

### Known threat patterns for this stack

| Pattern | STRIDE | Standard mitigation |
|---------|--------|---------------------|
| Account-existence oracle on B, E, forgot-password | Information disclosure | One answer in status, body, timing and wording; the screen never reflects the outcome; negative E2E cases after a witness |
| The same oracle through the auth service's own `/otp` and password endpoints | Information disclosure | Not closed by this phase: the hook stops the mail only (J6); stated in the docs and filed |
| Code enumeration; a fourth answer from the code check | Information disclosure | 60-bit codes; exactly `valid`, `used`, `unknown`; a switched-off mode is `unknown` |
| The set-password gate skipped | Elevation of privilege | The fact from `auth.users` for `auth.uid()` only; required by the predicate's type; a failed read signs out; the layout's load runs before any protected page's |
| A password stored that nobody chose, making the gate read "set" | Spoofing | Refuse `invite`, `signup` and `email` link types at the callback (J2) |
| A mailed link opened by someone else | Spoofing | Accepted for every mailed link: single use, expiry, HTTPS, the newest-only rule. Recorded, with RQ-8 |
| A mailed link spent by a scanner | Denial of service | Not mitigated here (Open Question 7); a clear message and a new request |
| A third party invalidating a user's unopened link | Denial of service | Bounded to once a minute per address by the slot; shared across both link kinds |
| A stolen session becoming a stolen account (`secure_password_change = false`) | Elevation of privilege | Accepted property of F and the reset page (D-13); no new route that sets a password |
| Open redirect through `redirectTo` or `next` | Tampering | `safeRedirectTarget` and nothing else; no target in any function request |
| A credential in the URL, history, `Referer` or storage | Information disclosure | Flow state in memory; the code in a form body; `method="POST"` on every form submitted by script |
| A second registration over a live session | Tampering | Every entry route bounces a signed-in caller, with no parameter |
| A mode switched off that stays open | Elevation of privilege | The matrix condition in SQL, in the three places an open invitation is read |
| Caller-written mail from the deployment's address | Spoofing | Templates stored with the function; a locale from a closed set is the only choice |
| Cross-request state on the server | Information disclosure | No module-level mutable binding: the gate list and the gate table are frozen; the flow state is per context instance |

## Project Constraints (from CLAUDE.md)

- **E2E hard rule:** no failing E2E test, no "known flaky", a "did not run" is a failure, a void run (wrapper exit 8, `VOID-host-suspend.txt`) is no evidence and is repeated under a new run directory.
- **E2E runs go through the wrapper** `tests/scripts/e2e-run.sh --run-dir … --no-db-reset`; the preflight cannot be skipped; a plain `yarn dev` serves the default project, not the one the suite seeds.
- **Comment hygiene** in `apps/`, `packages/`, `tests/`: no historical narrative, no planning references beyond `see phase N`, nothing addressed to a reviewer, concise.
- **Context Destructuring Rule:** never destructure a reactive accessor; never alias `dataRoot`.
- **Results-navigation invariants** are the voter side's; the analogous rule here is the protected layout's tracked-read test.
- **Svelte warnings** accepted only with `// svelte-warning: accepted — <rationale>`, and sparingly.
- **WCAG 2.1 AA** on every new or changed screen; **every user-facing string in every locale**, mails included.
- **Strict TypeScript**, no `any`; exported symbols carry TSDoc.
- **After a schema change:** `yarn db:types`, `yarn db:lint:sql` against a running stack.
- **Never commit secrets**; no executor reads a secret-bearing file or prints a container's environment.
- **The code review checklist** `.agents/code-review-checklist.md` on every change.
- **Skills:** `Skill("components")` for every `.svelte` file under `lib/contestant/components` and every context read; `Skill("database")` for the schema, the function and pgTAP.
- **Nothing is deployed:** PostgreSQL 17, Node 24, no compatibility shim, no redirect from an old route.

## Sources

### Primary (HIGH confidence): the tree at `b8fc8ac12`, read this session
- `apps/frontend/src/routes/contestant/{login,register,forgot-password,password-reset}/**`, `(protected)/+layout.server.ts`, `(protected)/+layout.svelte`, `(protected)/+page.server.ts`, `+layout.svelte`, `+layout.server.ts`
- `apps/frontend/src/routes/api/auth/callback/+server.ts`; `apps/frontend/src/hooks.server.ts`
- `apps/frontend/src/lib/auth/{sessionAdmission,passwordLogin,invitationCodeLogin}.ts`; `lib/contestant/gates/*`; `lib/routes/{route,appGates,loginRedirectTarget}.ts`
- `apps/frontend/src/lib/api/base/dataWriter.type.ts`; `lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts`; `utils/{invitationAccess,userEntities}.ts`
- `apps/frontend/src/lib/contexts/{auth,contestant}/*`; `lib/contestant/components/{passwordField,passwordSetter,passwordValidator,contactSupport}/*`; `lib/contestant/utils/loginError.ts`; `lib/supabase/{server,browser}.ts`
- `apps/supabase/supabase/schema/{106-app-settings,301-auth-functions,305-invitations,503-entity-rpcs,506-invitation-rpcs}.sql`; `functions/account-access/{index,contract,linkIssue,signInLink,mailTemplates}.ts`; `functions/identity-callback/index.ts`; `config.toml`; `tests/database/{00-helpers,36,39}` (searched)
- `packages/app-shared/src/settings/{contestantAppConfig,dynamicSettings}.ts`; `packages/dev-seed/src/templates/e2e/{base,perm/shared}.ts`
- `tests/tests/setup/shared/registerAndStoreSession.ts`; `tests/tests/specs/perm/perm-closed-project.spec.ts`; `tests/tests/specs/contestant/invitation-contract.spec.ts` (searched); `tests/tests/fixtures/shared/invitationFlow.fixture.ts` (outline); `tests/tests/utils/{testIds,mailedLink,contestantAxeScan}.ts`; `tests/playwright.config.ts` (project list); `scripts/assert-a11y-scan-wiring.mjs`, `scripts/assert-auth-signup-closed.mjs`
- Read-only database queries and `docker ps` on the running local stack

### Primary (HIGH confidence): the planning record
- `178-CONTEXT.md` (whole); `ROADMAP.md` § Phases 177, 177.1, 178, 179; `REQUIREMENTS.md`; `STATE.md` frontmatter (it names Phase 178 nowhere)
- `174-NAME-MAP.md` § *The server contract for Phase 178*, § *Obligations to later phases*, § *For the operator*, § *Measurements* (plan 174-05); `174-RESEARCH.md` § RQ-1 to RQ-7
- The 21 plans of Phase 177 (frontmatter); `177-21-PLAN.md` (hand-over lines)
- `.planning/v2.16-OPERATOR-DECISIONS-2026-10-07.md`, `-10-08.md`, `-10-09.md`; `.planning/v2.16-177.1-180-DISCUSSION-POINTS.md` (`0d2a6ed24`, unanswered)
- Pending todos named in the text

### Secondary (MEDIUM confidence)
- GoTrue v2.197.0 source, `internal/api/verify.go` and `internal/models/user.go` (https://github.com/supabase/auth, tag `v2.197.0`), read through a fetch that quoted the relevant lines
- https://supabase.com/docs/guides/auth/auth-hooks/send-email-hook
- https://supabase.com/docs/guides/local-development/cli/config
- https://supabase.com/docs/guides/troubleshooting/otp-verification-failures-token-has-expired-or-otp_expired-errors-5ee4d0.md
- https://www.chromium.org/developers/design-documents/create-amazing-password-forms/

### Tertiary (LOW confidence)
- https://github.com/orgs/supabase/discussions/41618 (reports of scanners spending links; community)
- A web search summary of scanner mitigations (confirmation page, typed code); not relied on for any prescription

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — nothing is added; versions read from `node_modules` and `docker ps`.
- The tree and the overlap with Phases 177 and 177.1: HIGH for 177 (frontmatter read); MEDIUM for 177.1 (an unfilled discussion document).
- Architecture: HIGH for the frontend patterns (each has a precedent on the tree); MEDIUM for the recovery operation and the matrix reader (designed here, not run).
- The auth service's behaviour: MEDIUM — measured by Phase 174's research on the same version and read from source; not re-run.
- Pitfalls: HIGH for 1, 2, 3, 8, 11, 12 (each rests on something read or measured this session); MEDIUM for 4 and 5 (reasoned from source).

**Research date:** 2026-10-11
**Valid until:** the first of: Phase 177's execution reaching a file in § *Phase 177 overlap*; Phase 177.1's discussion being filled; the sign-in helper's investigation closing; a bump of the Supabase CLI (which moves the GoTrue version every measurement here is tied to). Otherwise seven days: the tree is moving daily.
