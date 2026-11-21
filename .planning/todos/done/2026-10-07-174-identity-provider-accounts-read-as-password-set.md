---
created: 2026-10-07T12:53:29.000Z
title: An account created by identity-callback carries a generated password hash, so user_password_set reads true for a user who never chose a password
area: Auth / database
severity: major
source: Phase 174 (ruling OQ-5 / item 7 of 174-01-PLAN.md; 174-RESEARCH.md RQ-2 and Open Question 11; corrects 174-CONTEXT.md fact 19; filed by 174-10)
owner: Phase 178 and Phase 179
files:
  - apps/supabase/supabase/schema/506-invitation-rpcs.sql
  - apps/supabase/supabase/functions/identity-callback/index.ts
  - apps/frontend/src/routes/api/auth/callback/+server.ts
---

## Problem

`private.user_password_set(uuid)` is true when `auth.users.encrypted_password` is neither null nor empty. `claim_invitations` returns it as `password_set`, and the auth callback's `magiclink` arm uses it to tell a first-time user (sent to the set-password page) from a returning one (sent to the app).

The column is not a "the owner chose a password" signal. The auth service stores the hash of a generated password in three cases, as the function's own comment states: for an account created by a service-side `createUser`, for a new account created by a `magiclink` link, and when an `invite` token is verified. `identity-callback` creates its users with `auth.admin.createUser({ email, email_confirm: true, app_metadata })` and no password, and such a user reads `password_set: true`.

`174-CONTEXT.md` fact 19 says these users have no password; the research measured the opposite (private GoTrue `v2.197.0`). Not re-measured on the local stack by Phase 174.

Consequences:

- An identity-provider user who later opens a sign-in link is sent past the set-password page and holds a password nobody knows. Password sign-in is closed to them until they use password recovery.
- Phase 178's "password set" field on the user-level RPC (178-B1) is wrong for these users if it reads the same column.
- `account-access` avoids the case for its own users by creating them with `generateLink({ type: 'invite' })` and discarding the token, then minting a `magiclink`: an existing user's `magiclink` leaves the password unset.

## Solution

- Phase 178: do not derive "this user has chosen a password" from `encrypted_password` alone. Record the choice where it is made (the set-password and reset-password pages call `updateUser({ password })`), for example as a timestamp in `app_metadata` written by a definer function, and have `claim_invitations` and the user-level RPC read that.
- Phase 179: either create identity-provider users the way `account-access` does, so that the column is empty for them, or rely on the recorded choice above.
- Correct fact 19 wherever a later context document copies it.

## Update 2026-10-16 (Phase 178 close): the gate is built on the stored password; what is left is Phase 179's

**What Phase 178 did.** The set-password gate of the Contestant App's protected layout (plan 178-14) asks `passwordSet`, which `get_user_entities` answers through `private.caller_password_set()`, which reads the stored password hash (item J2 (a), read by the operator on 2026-10-11 and standing at its recommended option). `identity-callback` was not changed. So an account the function created still reads as having a password and is not shown the gate: probe row P3 measured an `identity-callback`-shaped account storing a password (`P3-IDP: set`). The authentication docs page lists this under "What this does not protect against".

**What is left, for Phase 179.** Whether an identity-provider account is made passwordless (or carries a marker the gate reads instead of the hash) is decided with the provider's rebuild, which also decides what an account without a chosen password is (REG-04, REG-05, REG-11's identity-provider clause).

## Resolution

**Closed 2026-10-22 by Phase 179** (plan 179-13's recipe, measured by probe row P5 of plan 179-02; moved by 179-23).

- **What was done.** `identity-callback` no longer calls `createUser`. It creates a new account the way `account-access` does: `auth.admin.generateLink({ type: 'invite' })` with the placeholder address, the token discarded, then `updateUserById` with the `app_metadata` and `email_confirm: true` on that placeholder (`0b6ab0cec`, `feat(179-13)`). Such an account stores no password hash, so `private.caller_password_set()` reads false for it. Probe row P5 measured it before the change was built (`P5: held`, `P5-CONFIRMED: yes` in `179-PROBE-FINDINGS.md`): the recipe and a magic-link sign-in leave the password unset, and the `createUser` control stores one.
- **The gate.** The set-password view asks for a password only once the account's address is proved (`addressState === 'proved'`), so an identity-provider account is not asked while it holds the placeholder.
- **Test.** The tracer `contestant-identity-provider.spec.ts` › `a new candidate identifies at the provider, … the mailed link proves the address` (`388c76328`, 179-14) ends on the set-password view once the mailed link proves the address; and `an identity that proved its address signs out, asks the sign-in screen for a link to it, and the mailed link leads to the view asking for a password and then to its home`.
