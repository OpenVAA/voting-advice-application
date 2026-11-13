---
created: 2026-10-22T14:00:00.000Z
title: A user who registered with the identity provider and has no proved address cannot sign in at all while answers are locked
area: Contestant app / auth / answers lock
severity: minor
source: Phase 179 (item U-13 of 179-UI-SPEC.md, built at its recommended option (a); the residual recorded in 179-18-SUMMARY.md; filed by 179-23)
owner: unassigned
files:
  - apps/frontend/src/routes/api/oidc/authorize/+server.ts (every type answers 403 `mode_not_allowed` while answers are locked)
  - apps/frontend/src/routes/contestant/register/+page.svelte (the provider's start sits inside the registration screen)
  - apps/frontend/messages/en/contestantApp.home.json (`emailPending`: "Until you do, sign in with Bank ID.")
  - apps/frontend/messages/en/contestantApp.identityProvider.json
---

## Problem

The identity provider can be started from one place only: the registration screen's provider panel, which posts to `/api/oidc/authorize`. There is no "Sign in with Bank ID" on the sign-in screen (U-13 (a)). The authorize endpoint refuses every type while answers are locked. That is right for registration, but it also stops sign-in.

So a person whose account was made by the identity provider and whose address is not proved has no way in while answers are locked. This covers state *none*, where no address was given, and state *pending*, where the address's link was not opened.

- The emailed sign-in link needs a proved address. A pending one is not the account's address yet, and the placeholder receives no mail.
- Password sign-in needs a password, and the set-password view is reached only once the address is proved.
- The provider's start is refused.

The strings tell such a user to "sign in with Bank ID" until they open the link (`contestantApp.home.emailPending`, `contestantApp.settings.emailPendingInfo`, the success view's `emailIntro`). While answers are locked, that sentence cannot be followed. Viewing an entity while answers are locked is read-only, so the loss is access to one's own profile and to the pending address's Send again, not lost edits.

A user in state *proved* is not affected: the emailed link and the password both work.

## Solution

U-13's other option (b), as `179-UI-SPEC.md` tables it:

- a "Sign in with Bank ID" button on the sign-in screen;
- a start that names no type;
- a sign-in-only intent in `identity-callback`, which finds an existing account and never creates one, and which the answers lock does not refuse;
- the button's accessibility scan and its strings in seven locales.

A smaller step would let the authorize endpoint pass a returning identity while answers are locked and have the function refuse only the create branch. That needs the type-less start too, because the endpoint cannot tell a returning identity before the provider's round trip.
