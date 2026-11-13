---
created: 2026-10-07T12:53:29.000Z
title: The claim-and-refresh pair exists twice, in admitSession and in the auth callback
area: apps/frontend - auth
severity: minor
source: Phase 174 (174-08-SUMMARY.md § Observations for the operator; filed by 174-10)
files:
  - apps/frontend/src/lib/auth/sessionAdmission.ts
  - apps/frontend/src/routes/api/auth/callback/+server.ts
---

## Problem

"Claim the user's invitations, and refresh the session when a grant was written" is written twice, about twelve lines each, with a small `messageOf` helper beside each copy:

- `admitSession` in `sessionAdmission.ts`, used by both login actions and by `invitationCodeLogin`;
- `claimAndRefresh` in the auth callback.

The two differ on purpose in what follows the pair (a grant gate in one, a landing by link type in the other) and in what a failed claim does. They do not differ in the pair itself: the same call, the same condition for the refresh (`claimed.length > 0`), the same two log lines for a refresh that returns an error and one that throws. The order session, claim, refresh, gates is the property the whole model's entry depends on, and it is held in two places that can drift: a change to the refresh condition in one would leave the other admitting or landing users on a token that does not list their grant.

The plan specified the callback inline, and its verify command read `refreshSession` in that file, which is why it was not shared when it was written.

## Solution

- Extract one function in `$lib/auth` that takes the request's `claimInvitations` and `refreshSession` and returns the claim's answer or `undefined`, with the logging label as an argument; have `admitSession` and the callback both call it.
- Keep the two tests that pin the order on each caller (`sessionAdmission.test.ts`: "admits a first-time invitee whose token carries no grant until the refresh"; the callback's `server.test.ts`: "verifies, claims on the request client, refreshes and only then redirects when a grant was claimed"), and move the refresh-failure cases to the shared function's own test.
- A natural moment is when the branch is restructured for review, or when Phase 178 adds the form action that calls `invitationCodeLogin`.

## Resolution

**Closed 2026-10-16 by Phase 178** (plan 178-15). The pair is one function, `claimAndRefresh({ context, logLabel })` in `apps/frontend/src/lib/auth/sessionAdmission.ts`; `admitSession` and the auth callback both call it. It takes a context rather than `(locals, fetch)` because of the adapter-boundary lint. Pinned by the `claimAndRefresh` cases of `sessionAdmission.test.ts`, beside `admits a first-time invitee whose token carries no grant until the refresh`, and by the callback's `server.test.ts`.
