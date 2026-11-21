---
created: 2026-10-07T12:53:29.000Z
title: Identity-provider registration never claims an invitation, so an invited person who registers through the provider becomes a duplicate
area: Contestant app / auth / Edge Functions
severity: major
source: Phase 174 (174-CONTEXT.md X2 (a), obligation O-9; the roadmap assigns the todo to Phase 174; filed by 174-10)
owner: Phase 179
files:
  - apps/supabase/supabase/functions/identity-callback/index.ts
  - apps/supabase/supabase/functions/identity-callback/ownEntity.ts
  - apps/frontend/src/routes/api/oidc/callback/+server.ts
  - apps/supabase/supabase/schema/506-invitation-rpcs.sql (`claim_invitations`: `raw_app_meta_data ->> 'identity_provider' IS NULL`)
---

## Problem

In v2.16 the two ways of becoming a candidate's user do not meet.

- An invitation is claimed by `claim_invitations`, which matches the caller's own confirmed address in `auth.users` against `invitations.email` (or a code row bound to that address).
- `identity-callback` creates its user with a placeholder address (`createUser({ email: placeholderEmail, email_confirm: true, … })`), finds the user's candidate through the user's own `(entity, candidate, editor)` grant, and creates a NEW candidate with a new grant when there is none. The server route that calls it, `/api/contestant/preregister`, establishes the session with `verifyOtp` and calls no claim.

So a person an administrator seeded (a candidate row plus an invitation for their address) who registers through the identity provider gets a second, unlinked candidate. The seeded candidate keeps its open invitation and has no editor; the new one has the user. Nothing detects the pair. An administrator resolves the duplicate by hand: delete one candidate, move the nomination, and delete or leave the invitation.

The claim would not help even if the route called it: the placeholder address is not the invited address.

## Solution

For Phase 179, which owns identity-provider registration and its pending address:

- Decide how an identity is matched to a seeded entity: by an address the user proves (see the companion todo on storing a typed address unconfirmed, obligation O-8), by a code the user presents, or by an administrator.
- Once the user holds a confirmed address that an invitation names, call `claimInvitations()` and refresh the session in the preregister route, in the order every other entry point follows (session, claim, refresh, then gates): `apps/frontend/src/lib/auth/sessionAdmission.ts` is the shared sequence.
- Until then, state the limitation where an administrator will read it. The developers' docs state it under "What this does not do" on the invitation page.

## Update 2026-10-22 — the "never" is now mechanical; this stays open as the X2 residual (Phase 179)

Phase 179 took X2's option (a): an identity-provider registration matches no seeded entity. It made that hold by construction rather than by accident.

- **J3, in the database.** `claim_invitations` reads the caller's address only when the account's `raw_app_meta_data ->> 'identity_provider'` is null (`apps/supabase/supabase/schema/506-invitation-rpcs.sql`; migration `00002_claim_excludes_identity_provider_accounts.sql`; commit `b6776abe1`, `feat[db](179-03)`, with its red pgTAP assertions in `24406c469`). An identity-provider account claims nothing, even after it has proved an address that an invitation names. That proof is now possible: the identity provider's success view takes the address and mails an `email_change` link for it.
- **The rest of the problem is unchanged.** A person who was seeded by an administrator and invited, and who registers through the identity provider, still gets an entity of their own, unlinked to the seeded one. The seeded entity keeps its open invitation.
- **Re-anchored.** The route this todo named, `/api/contestant/preregister`, is deleted (179-21). The function is now called by the OIDC callback, `apps/frontend/src/routes/api/oidc/callback/+server.ts`, through `register(…)`. The function finds the identity's own entity through `resolveOwnEntity` (`identity-callback/ownEntity.ts`); `findExistingCandidate` is gone. The developers' docs state the limitation on the invitation page (`/developers-guide/contestant-app/pre-registration-and-invitation`), under the claim bullet and the closing section "Registration with a bank identity".
- **What would close it.** A decision on how an identity is matched to a seeded entity: a code the person presents, an administrator, or an address they prove together with a claim from an identity-provider account. The last is a change to J3, and it reopens the takeover question that 2026-10-07-174-typed-address-of-an-identity-provider-user-must-stay-unconfirmed.md (now in done/) closed. Account linking is filed separately as 2026-10-21-179-account-linking-for-two-accounts-of-one-person.md.
