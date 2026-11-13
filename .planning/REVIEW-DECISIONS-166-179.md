# Review decisions, phases 166–179

Written 2026-10-23 at branch `feat/entity-signup-multi-grant`, 362b2e536, after review-fix batches A–D
(each batch closed with full E2E 613/613 and 22/22 gates). Everything else the reviews found is fixed
or shown not to be real; what is left here needs your call.

**How to use this:** each item has one option marked ★ RECOMMENDED. Leave every box unticked to accept
the recommendation. Tick a different option only to overrule it, and add a note on the `Note:` line
if you want something in between. Item ids (e.g. 174 WR-04) point at the phase's `REVIEW.md`.

---

## A. Access and security

### A1. Re-inviting an address whose invitation was claimed (174 WR-04)

A claimed invitation keeps blocking a new invitation for the same address and target forever: the
unique index covers claimed rows, the delete policy refuses them, and deleting the user keeps
`claimed_at`. So an admin who removes someone's grant, or deletes their account, can never invite that
address to the same candidate or project again, and an account admin cannot promote a claimed
project editor to project admin. Only a service-role delete helps, which is exactly what the E2E
harness had to do. Fixing it reverses D-07/D-08 of phase 174.

- [ ] ★ RECOMMENDED: limit the unique index to open rows (`claimed_at IS NULL`); claimed rows stay as history
- [ ] Let the delete policy remove a claimed row whose grant is gone or whose claimant is deleted
- [ ] Keep as is (D-07/D-08) and document the service-role remedy

Note:

### A2. Invited admins land in the Contestant App (174 IN-03)

The mailed link carries no destination, so a project-admin or account-admin invitee lands in the
Contestant App, meets its set-password and terms gates, and then sees an empty entity list with no
pointer to the Admin App. They do need the set-password step somewhere, which today exists only in
the Contestant App.

- [ ] ★ RECOMMENDED: keep the set-password gate where it is, then send a user who holds only admin grants on to the Admin App
- [x] Send admin claimants straight to the Admin App and build a set-password step there
- [ ] Keep as is

Note: Make all possible parts reusable. We'll want the admin app to function the same way as the contestant app on these accounts. It will have its own shorter list user task gates.

### A3. Confirm click before a mailed link signs in (178 WR-03)

The mailed link signs the browser in on a plain GET. That allows login CSRF (an attacker mails their
own link to a victim, who ends up signed in as the attacker, replacing their session), and corporate
mail scanners and link previews that open links first spend the single-use token, so the real click
fails. A "Continue" page that verifies on POST fixes both, at the cost of one click per link, new text
in 7 languages, and a rule for a browser already signed in to another account. D-18 of 178 said to
raise it with you.

- [ ] ★ RECOMMENDED: add the confirm page (scanners spending links is a real problem for organisations' mail)
- [ ] Keep the one-click link and record login CSRF and scanners as accepted risks

Note:

### A4. Password recovery for global and account-grant holders (178 IN-04)

The recovery mail goes only to holders of a project or entity grant in the named project. An
administrator who holds only a global or account grant is answered "accepted" and gets nothing, with
no other recovery path in the product.

- [ ] ★ RECOMMENDED: document the operator procedure (service-role password reset); these users are few and trusted
- [x] Give global and account-grant holders their own recovery eligibility

Note: Make the contestant app components as reusable as possible when implementing this.

### A5. Shared per-IP sign-in budget (174 IN-04 / 178 IN-05)

Code sign-ins call the auth service from the Edge runtime's address, so on a hosted project all of
them probably share one per-IP `sign_in_sign_ups` budget (30 per 5 minutes locally). A few people
holding used codes could exhaust it with wrong passwords and lock code sign-in out for everyone.
This is not measured on a hosted project.

- [ ] ★ RECOMMENDED: measure on the hosted project first; if confirmed, forward the client IP through a header the auth service trusts
- [ ] Raise the `sign_in_sign_ups` limit instead
- [ ] Document it as a residual risk and do nothing

Note:

### A6. The 20-mails-per-address-per-day cap can block the owner

Batch A capped sign-in and recovery mails at 20 per address per day across all projects. Someone who
deliberately uses up an address's 20 also blocks its owner from getting a mailed link until the next
day; signing in with a password still works. The docs say so.

- [ ] ★ RECOMMENDED: keep the cap as it is
- [ ] Also key the cap on the requester (IP), so a flood from one source does not block the owner
- [ ] Raise or remove the cap

Note:

### A7. Grant revocation takes effect at token refresh (173 IN-01)

Lists and entity reads come from the `grants` table, but writes are authorised by the JWT `grants`
claim. When a grant is removed while the user has the entity open, saves keep working until the
access token refreshes (up to its lifetime, 1 hour by default). pgTAP pins this as the design.

- [ ] ★ RECOMMENDED: accept and document it
- [ ] Make the revoking path also revoke the user's sessions
- [x] Make the write policies read the `grants` table, like the read path

Note:

### A8. Terms acceptance in projects where the user holds no grant (172 WR-04)

Any signed-in user may insert an acceptance row for any project id, and the answer tells them
whether that project exists. Limiting the insert to projects where the user already holds a grant
closes that, but then nobody could accept a project's terms before being invited to it. Project ids
are not secret (they appear in the public configuration). D-05 accepted the current behaviour.

- [ ] ★ RECOMMENDED: keep as is (D-05)
- [ ] Limit the insert to projects where the caller holds a grant

Note:

---

## B. Rules the database does not enforce

### B1. Terms of use are enforced only by the app's layout (172 WR-01)

Only the Contestant App's protected layout checks acceptance. With the session cookie, any other
client can write answers, profile fields, images and nominations without ever accepting, and since
172-06 removed the visibility condition (TOU-02), that content is published as soon as the entity is
confirmed. The terms are typically the consent to publish, so that consent is now only a screen.
D-05 and D-13 accepted this.

- [ ] ★ RECOMMENDED: publish an entity's content only once its editor has accepted (restore a server-side visibility condition; reverses TOU-02)
- [ ] Also refuse writes without acceptance
- [x] Keep as is and record it as an owned risk

Note: The reason is that we may prefill a profile and invite and editor to make optional changes. The TOU touches on data the editor inserts, not data in general.

### B2. The answers lock does not stop nomination writes (177 IN-03)

The editor treats "answers locked" as closing the nominations editor, but the database enforces only
the nominations lock. A direct call can still change, unconfirm or delete the caller's own
nominations while the VAA is live with answers locked.

- [x] ★ RECOMMENDED: add the answers-lock check to the entity nomination policies and to `set_entity_nominations`
- [ ] Document that only the nominations lock is enforced server-side

Note: We'll still want the project editors to be able to edit nominations even when answers are locked. Also add a todo for selective bypassing of answers locked by editors for single entities.

### B3. The constituency rule covers only the save function (177 WR-01)

Batch B made `set_entity_nominations` refuse a new or moved nomination outside its election's
constituencies. A nomination inserted straight into the table through the entity insert policy skips
that check. Moving it into `validate_nomination` would cover every path, but the dev-seed writer
must then link elections to constituency groups before it inserts nominations.

- [ ] ★ RECOMMENDED: move the check into `validate_nomination` and reorder the dev-seed writer
- [ ] Keep it in the save function only and document the gap

Note:

### B4. Two candidates from a concurrent first login (166 WR-02)

Two simultaneous identity-provider callbacks for a new identity (a double submit, a retry) can each
create a candidate. Every later sign-in of that user then fails permanently until an operator
deletes one by hand. D-12 deferred a database constraint.

- [ ] ★ RECOMMENDED: serialise find-or-create per identity (an advisory lock in a service-role RPC)
- [ ] Self-heal: after creating, re-check and delete this request's duplicate
- [ ] Keep deferred (D-12)

Note:

### B5. App and database read a mistyped registration setting differently (171 WR-01)

The frontend rejects the whole `contestantApp` settings object if one member is invalid, while SQL
and the Edge Functions read the parts they need. So one typo can hide registration in the app while
the database still allows it, or the reverse. Each fix the review offered reverses something
recorded: filtering bad values (D-05/D-08) silently ignores typos, and a write-time database check
(rejected in 171-A1 (b)) needs a second copy of the schema in SQL.

- [ ] ★ RECOMMENDED: validate settings with the shared app-shared schema when the Admin App saves them, so a typo is refused where it is made; leave the database as is
- [ ] Filter invalid values on both sides the same way
- [ ] Add a database check on `app_settings` writes
- [ ] Leave it

Note:

---

## C. Product behaviour

### C1. Admins reading terms acceptances (172 WR-02)

Only the accepting user can read their acceptance row, so nobody can audit who agreed. Letting
project admins read them would be a new reader of personal data, beyond D-04/D-05 and the pgTAP 37
census. This is the core of the planned TOU-F01 audit feature.

- [ ] ★ RECOMMENDED: decide it when TOU-F01 is planned, together with C2
- [ ] Add a project-admin read policy now

Note:

### C2. Which terms version was accepted (172 IN-03)

An acceptance row records only that the user accepted, not which text. Admins can change the terms
text at any time, and nobody is asked to accept again (D-03).

- [ ] ★ RECOMMENDED: add a terms version or content hash, compared by the gate, as part of TOU-F01
- [ ] Add it now
- [ ] Never; presence of the row is enough

Note:

### C3. Organizations without candidates are hidden from voters (175 WR-01)

Under the shipped default `hideIfMissingAnswers.candidate: true`, the voter filter drops every
organization with no visible candidate, including organizations that never had one, whatever the
organization itself answered. The organization is not told, because its own hidden-check reads the
organization key, which defaults to false. Phase 175 let organizations fill in their own answers, so
this undoes that for party-only setups.

- [ ] ★ RECOMMENDED: judge an organization without candidate nominations by its own answers only; hide it under the candidate key only when it had candidates and all were filtered out
- [ ] Keep the filter but tell the organization it is hidden
- [x] Keep as is

Note: Add a major todo for rethinking different election types and their effects on these hiding behaviours among others. The current behaviour is okay in openlist elections with forced candidate choice (the Finnish model for instance).

### C4. A malformed nominations answer signs the user out (176 IN-02)

If one nomination element fails the schema, the entity load signs the user out with "login failed".
A single-entity user is sent straight back to that entity after signing in, so they are signed out
again on every attempt. It is defensive (the schema mirrors the column rules), but it is a loop.
Changing it reverses D-11 of phase 173 for this case.

- [ ] ★ RECOMMENDED: show the entity layout's error view and keep the user signed in
- [ ] Keep signing out (D-11)

Note:

### C5. Account settings for users with no entity (173 IN-03)

Settings (password change, pending-address resend, replacing the address) are mounted only under an
entity URL. A user whose grants were all removed, or who is still waiting for one, sees only support
and logout, and cannot change their password or fix their address. D-11 says that view offers no
other navigation; batch B only documented it.

- [ ] ★ RECOMMENDED: serve settings outside the entity tree for users with zero or several entities and link to it from the "nothing to edit" view
- [ ] Keep as documented

Note:

---

## D. Smaller items

### D1. Single-mode access templates (170 IN-05)

`perm-disable-contestant-app` and `perm-disable-voter-app` are now documented as seed CLI
conveniences with no in-tree user; `perm-access-disable` covers both.

- [ ] ★ RECOMMENDED: remove the two templates
- [ ] Keep them

Note:

### D2. "Partly saved" message on the profile page (175 WR-04)

Batch C fixed the retry (a partly successful save no longer re-uploads the logo). The page still says
"save failed" when part of the save was stored.

- [ ] ★ RECOMMENDED: no further change; the retry now completes the save
- [ ] Add a distinct "partly saved" result and message

Note:

### D3. Removing an image (175 WR-03)

An entity cannot remove its logo or portrait; the adapter's dead branch for it was removed.

- [ ] ★ RECOMMENDED: support `image: null` (a small, contained change)
- [ ] Not needed

Note:

### D4. Docs redirect stubs (168 IN-05)

The 26 old-URL redirect stubs redirect only in the browser; crawlers and non-JS clients get the 404
fallback. Batch D documented this.

- [ ] ★ RECOMMENDED: prerender the stubs so they build to meta-refresh pages
- [ ] Keep the documented client-side redirects

Note:

### D5. Order of nomination error messages (177.1 IN-01)

An object with two faults now reports the shape fault first. It is intended and documented, but no
test pins it.

- [ ] ★ RECOMMENDED: add one pgTAP assertion that pins the order
- [ ] Leave it

Note:

---

## E. Phase 179 leftovers

### E1. Phase 179 hands-on testing

Only you can do this: run `/gsd-verify-work 179`. It covers the rendered look of the new sign-in
screens and the selector panel; a native-speaker check of the new translations, including the
Swedish "Registrera dig"; and the "Use another email address" option, which cannot be undone once
clicked (the flag is never reset).

- [ ] ★ RECOMMENDED: run the UAT, and make "Use another email address" reversible if it feels wrong in use
- [ ] Skip the UAT

Note:

### E2. Proposed Auth sentence for CLAUDE.md

An executor proposed adding to CLAUDE.md § Backend that the set-password gate needs a confirmed
address, and that an identity-provider account is first asked for an address. It was not applied.

- [ ] ★ RECOMMENDED: apply it
- [ ] Don't

Note:

### E3. `[db]` tag on b1f981564

The 179 CR-01 migration commit is titled `fix(179-review):`; the review checklist asks for `fix[db]`.

- [ ] ★ RECOMMENDED: add the tag when the branch is split into pull requests
- [ ] Ignore

Note:

### E4. Test key server on port 8777

During an E2E run the mock provider's key server listens on every network interface, not just this
machine. It serves only the committed test public key.

- [ ] ★ RECOMMENDED: bind it to loopback, provided the Docker edge runtime still reaches it; otherwise accept it
- [ ] Accept as is

Note:

### E5. Small 179 cleanups

- [ ] ★ RECOMMENDED: do all of these
  - retire `.planning/WINDOWS.md` rows 217, 220, 221 and 222 (their round-trip tests are green)
  - make the not-found page's `<title>` say 404 instead of "500"
  - have the E2E wrapper stop the mock identity provider after a void run
  - remove the Phase 157/158 labels in `eslint.config.mjs` (in the ship-time codemod)
  - declare `@openvaa/core` in `@openvaa/app-shared` (an undeclared type import)
  - regenerate the docs page for `NothingToEdit`, which no longer matches its component
- [ ] Do only these: (list)

Note:

### E6. About 95 verification calls per E2E run

A full run spends about 95 `POST /auth/v1/verify` calls. The local stack does not enforce the
30-per-5-minutes verification limit, but a CI or hosted stack that does would fail the run.

- [ ] ★ RECOMMENDED: leave it until the suite first runs against a stack that enforces the limit, then pace or split the identity-provider specs
- [ ] Reduce it now

Note:
