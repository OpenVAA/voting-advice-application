---
created: 2026-10-22T14:00:00.000Z
title: "ACCEPTED RESIDUAL: a signed-in account's own address change at the auth service answers email_exists for an address another account holds, outside any throttle of ours"
area: Auth / security / accepted residual
severity: minor
status: accepted-residual
source: Phase 179 (measured by plan 179-10; operator decision 2026-10-22 recorded in 179-CARRIED-ITEMS.md; filed by 179-23)
owner: unassigned (revisit only on the trigger below)
files:
  - apps/supabase/supabase/functions/account-access/addressConfirmation.ts
  - apps/supabase/supabase/config.toml
  - infra/modules/supabase/hosted-settings.json
---

## Not an open defect

**The operator accepted this as a residual risk on 2026-10-22.** It is filed so that it is revisited when the platform changes, not so that it is fixed now.

## What was measured (plan 179-10)

A signed-in account can call the auth service's own `PUT /auth/v1/user` with a new `email`. When another account already holds that address, the service answers `422 email_exists`. It answered so even after `429 over_email_send_rate_limit` on fresh addresses. So any signed-in account has an existence check for addresses that is outside the throttle of `address_confirmation_request`. The check is not unthrottled: hosted Supabase applies its own IP-based limit to `/auth/v1/user` (see below).

What still holds:

- **No takeover.** A direct update never completes. Its tokens go to the no-op mail hook, so nothing is ever mailed for it. `account-access` writes no address.
- **The operation's guarantee.** The `confirm-address` operation still takes the caller's slot and the address's slot before it answers `in-use` (decision D-07 and threat T-179-102 hold for the operation itself).
- **An account is needed first**, made by an invitation or by the identity provider.

## Why it is accepted, not fixed

- Hosted Supabase runs no auth hook before a user's own email change. The hooks are before-user-created, custom access token, send SMS or email, MFA verification attempt and password verification attempt.
- "Secure email change" changes only who receives the link.
- The API gateway cannot be configured on hosted projects, so a rule on `PUT /auth/v1/user` carrying `email` cannot be deployed there.
- Hosted applies a configurable IP-based limit on `/auth/v1/user`, 30 requests per 5 minutes by default. It can be lowered in the project's auth rate limits.

The developer docs state the residual in one sentence each: the bank-authentication page, the edge-functions page's address-confirmation section, and the database skill (179-22).

## Revisit when

- Supabase adds a before-user-updated hook, or a switch that turns off a user's own email change. With either, refuse a user-initiated `email` change for every contestant account and keep `confirm-address` as the only route.
- Or this deployment moves to a self-hosted gateway, where a rule on `PUT /auth/v1/user` with an `email` key can be enforced.

Related: `2026-10-07-174-auth-service-otp-endpoint-tells-registered-addresses.md` (the auth service's own `POST /otp`, another of its endpoints that answers differently for a registered address).
