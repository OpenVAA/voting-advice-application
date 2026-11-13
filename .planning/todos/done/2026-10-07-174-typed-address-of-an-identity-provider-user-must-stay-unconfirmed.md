---
created: 2026-10-07T12:53:29.000Z
title: An address a user types during identity-provider registration must be stored unconfirmed until proved - confirming it would let anyone claim another person's invitation
area: Auth / Edge Functions / security
severity: critical
source: Phase 174 (174-CONTEXT.md obligation O-8, decision D-14; 174-RESEARCH.md RQ-1; filed by 174-10)
owner: Phase 179
files:
  - apps/supabase/supabase/functions/identity-callback/index.ts
  - apps/supabase/supabase/schema/506-invitation-rpcs.sql
  - apps/frontend/src/routes/api/contestant/preregister/+server.ts
---

## Problem

`claim_invitations` trusts one thing: the caller's own confirmed address in `auth.users` (`email_confirmed_at` set). It cannot ask how the address came to be confirmed. The whole model is sound only while a confirmed address means "a link mailed to this address was opened" or "a service-side call vouched for it".

`identity-callback` is a service-side call that vouches: it creates its user with `email_confirm: true`. Today the address is a placeholder the function generates, which no invitation names, so nothing can be claimed with it. Phase 179 lets the user state a real address during registration. If that typed address is written to the user with `email_confirm: true` (or with any admin call that sets `email_confirmed_at`), then a person who proves a bank identity and types somebody else's address holds that address confirmed, and their next sign-in claims every open invitation addressed to it: another candidate's editor grant, or a project admin's.

The pgTAP file `39-invitations.test.sql` pins the database half ("nobody else": an unconfirmed address claims nothing). Nothing pins what `identity-callback` writes.

## Solution

- Store a typed address unconfirmed, and confirm it only by a link mailed to it and opened (179-B1).
- Add an assertion to `identity-callback`'s `flowConformance.test.ts` that the only `email_confirm: true` in the function is on the generated placeholder, so a later edit that confirms a caller-supplied address reddens the unit suite.
- Keep the placeholder path as it is until the pending-address flow exists.

## Resolution

**Closed 2026-10-22 by Phase 179** (plans 179-10 and 179-13; moved by 179-23).

- **What was done.** A typed address is never written to the account by a service call. The `confirm-address` operation of `account-access` (`7973f63c3`, `feat(179-10)`) issues an `email_change` link for it and mails it; the account's address becomes the typed one only when that link is opened, by the auth service's own verification. `account-access` writes no address. `identity-callback`'s one `email_confirm: true` is on the generated placeholder (`0b6ab0cec`, 179-13). The claim excludes identity-provider accounts altogether (J3, `b6776abe1`, 179-03), so even a proved address claims nothing through this path.
- **The conformance assertions this todo asked for.** `identity-callback/flowConformance.test.ts` asserts that `email_confirm` appears once, as `email_confirm: true`, in the one `updateUserById` call that follows the invite of the placeholder (179-13). `account-access/flowConformance.test.ts` asserts that no module of the function holds an admin update carrying an `email` key, an update of the user through the caller's own session, or any `email_confirm` (179-10). Both are in the unit suite.
