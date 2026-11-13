---
created: 2026-10-07T12:53:29.000Z
title: A first-time invitee who ends with no contestant grant sets a password and is then refused by the login form
area: Contestant app / auth
severity: major
source: Phase 174 (ruling 18 of 174-01-PLAN.md; name map facts X3 and X4; seen once by 174-09 under a negative control; filed by 174-10)
owner: Phase 178
files:
  - apps/frontend/src/routes/api/auth/callback/+server.ts
  - apps/frontend/src/lib/auth/sessionAdmission.ts
  - apps/frontend/src/lib/auth/passwordLogin.ts
  - apps/frontend/src/routes/contestant/(protected)/+page.server.ts
---

## Problem

The callback sends a user who has no password to the set-password page, whatever their claim wrote. After setting the password the user is taken to the login form, and the login action's gate admits only a token that carries a contestant grant (`CONTESTANT_GRANTS`: an editor of a candidate or an organization). So a first-time invitee whose claim wrote nothing they can edit there is signed out again with `403 grantNotAllowed`:

- every row of theirs was skipped (`candidate_has_editor`, `target_not_in_project`), or
- they were promised a project role only.

The "nothing to edit" view, which is what obligation O-5 intends for this user, is reached only by a user who already holds a session when they reach the app root: a returning user sent there by the callback, or a user whose grant was removed. The E2E project `invitation-landing` asserts that path for a returning user promised a project role.

**Observed once, not on the tree:** in 174-09's negative control with `claim_invitations` replaced by a function that claims nothing, the journey's user opened the link, set a password, and was refused at the login form (step 5). No test asserts the case, and nothing on the tree produces it for an entity invitation whose claim succeeds. The project-role variant for a first-time user was not run: the landing spec's users all have a password already.

## Solution

For Phase 178, which builds the screens around the set-password step:

- After a first password is set, land the user from the session they already hold instead of sending them through the login form, so the app root decides and shows "nothing to edit" where that is the truth.
- Or have the login gate admit a signed-in user with no contestant grant to the app root, where the root load already answers them. This changes `passwordLogin` for every user, so decide it together with the Admin App's gate (see the todo on `ADMIN_GRANTS`).
- Add the E2E case: a first-time invitee promised a project role only, from the mailed link through the set-password page to wherever they are meant to land.

## Update 2026-10-16 (Phase 178 close): the mailed link no longer goes through the login form; the two ways in still differ

**What Phase 178 did.**

- The first bullet of the solution is built: the callback lands every user of a sign-in link in the Contestant App, and the set-password gate is a view of the protected layout (plan 178-14). Saving the password reruns the loads on the session the user holds, so the app root decides, and a user with nothing to edit there is shown the "nothing to edit" view instead of being refused at a login form.
- The password sign-in still gates on `CONTESTANT_GRANTS`, but the sign-in screen and the code sign-in now say why (item U-13 (a), read by the operator on 2026-10-11 and standing at its recommended option): a `403` shows the "nothing to edit" words (`contestantApp.login.noProfile`), not a generic failure.

**What is left.**

- The two ways in still differ for the same user: a mailed link lands them on "nothing to edit", signed in; a password sign-in refuses them with that sentence and leaves them signed out. Deciding whether the password sign-in should admit such a user to the app root belongs with the Admin App's gate (see the todo on `ADMIN_GRANTS`); for whoever plans that.
- No browser case walks a first-time user promised a project role only from the mailed link through the set-password view to "nothing to edit" (plan 178-22 kept its passwordless session from saving a password). For Phase 179's coverage close, or the plan that next touches the gate.

## Update 2026-11-12 (Phase 179.2): an admin-only first-time invitee lands in the Admin App

**What Phase 179.2 did.**

- An invitee promised only an admin grant (at global, account or project scope) now lands in the Admin App, whichever app the link was asked from:
  - asked from the Admin App's login or forgot-password page, the mailed link carries `next=/admin` and lands there directly;
  - asked from the Contestant App, the link names no app and lands in the Contestant App, whose protected server load sends a session that `isAdminOnly` reads as admin-only to the Admin home before it reads anything. The Admin App's own set-password gate then asks for the password.
- E2E: `admin-account-flows.spec.ts` › "an invited project admin who asks for a link on the Contestant App's forgot-password page is sent to the Admin App and sets a password there".

**What is unchanged.**

- The password sign-in of the Contestant App still gates on `CONTESTANT_GRANTS`, so the two ways in still differ for a user promised a project editor role only (D-05 keeps project editors out of `ADMIN_GRANTS`): a mailed link lands them on "nothing to edit", signed in; a password sign-in refuses them with that sentence.
- No browser case walks a first-time user promised a project editor role only through the set-password view to "nothing to edit".
