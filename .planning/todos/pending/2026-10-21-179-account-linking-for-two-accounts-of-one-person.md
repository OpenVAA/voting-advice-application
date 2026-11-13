---
created: 2026-10-22T14:00:00.000Z
title: One person can hold two contestant accounts, one from the identity provider and one by email, and nothing links or merges them
area: Auth / contestant app / product decision
severity: minor
source: Phase 179 (decision D-07, option (c) of item 179-B2, recorded as not built; filed by 179-23)
owner: unassigned
files:
  - apps/supabase/supabase/functions/identity-callback/index.ts
  - apps/supabase/supabase/functions/account-access/addressConfirmation.ts
  - apps/supabase/supabase/schema/506-invitation-rpcs.sql (`claim_invitations`)
  - apps/frontend/src/lib/server/contestant/identityProviderRegistration.ts
---

## Problem

The two ways into the Contestant App now make two kinds of account, and one person can hold one of each.

- **An identity-provider account** is created by `identity-callback` on a placeholder address. Its owner may later prove an address of their own through the `confirm-address` operation and the mailed `email_change` link.
- **An email account** is created by `account-access` when an invitation is asked for or claimed by a link or a code.

When the address a person types on the identity provider's success view already belongs to another account, the view refuses it with "this address is already in use; enter another, or sign in with it" (decision D-07). The person keeps two accounts:

- one through the bank, with a placeholder or a different address;
- one through the email, with its own grants.

Each account edits only its own entities. Nothing tells either account that the other exists. An administrator who wants one account per person has to move the grants by hand.

Decision D-07 chose the refusal (option (a)) over a merge (option (c)). A merge is account linking. It has takeover cases of its own: proving control of both accounts, choosing which login survives, moving grants and the `registered_entities` record, and handling the second account's open invitations, which J3 keeps unclaimable for the identity-provider account. Those cases need a decision of their own, which the phase did not make.

## Solution

TBD, a product decision first:

- Whether the product wants one account per person at all, or accepts two logins with separate entities.
- If it wants linking, the proof it requires. The likely shape is a signed-in identity-provider account that also opens a link mailed to the email account's address, and then an atomic, service-side move of the grants and the record.
- How an administrator sees and resolves a pair that is not linked.

Related: `2026-10-07-174-identity-provider-registration-never-claims-an-invitation.md` (X2: an identity-provider registration does not meet a seeded entity).
