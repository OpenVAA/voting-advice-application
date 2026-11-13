---
created: 2026-10-07T12:53:29.000Z
title: claim_invitations has no in-database guard on the auth service's sign-up setting - on a hosted project the dashboard switch is the only control
area: Auth / database / deployment
severity: critical
source: Phase 174 (item 1 and residual R-f of 174-01-PLAN.md; 174-RESEARCH.md RQ-1; filed by 174-10)
owner: the operator of any hosted project
files:
  - apps/supabase/supabase/schema/506-invitation-rpcs.sql
  - apps/supabase/supabase/config.toml
  - scripts/assert-auth-signup-closed.mjs
  - apps/docs/src/routes/(content)/developers-guide/deployment/+page.md
---

## Problem

`claim_invitations` writes the promised grants for the caller's own confirmed address. The database sees that `auth.users.email_confirmed_at` is set and cannot see how it came to be set. Where a visitor can create an account for an address without opening a mail sent to it, that visitor claims the address's invitations.

The research measured both routes on a private GoTrue `v2.197.0` configured as the local stack then was:

- With email confirmation off, a public `POST /signup` with any address and a password of the caller's choosing returned a session and a user whose address was confirmed, with no mail sent.
- With confirmation on and sign-up open, an attacker who signs up first with the victim's address leaves an unconfirmed account carrying the attacker's password; the victim's later click on any mailed link confirms that account, and the attacker's password then signs in.

Closing public sign-up closes both, and confirmation stays on as the second lock. The repository holds that for the LOCAL stack only: `config.toml`, `yarn assert:auth-signup-closed`, the E2E project `auth-service-contract`, and the gate row `stack`.

On a hosted project nothing in the repository applies:

- The two switches are set by hand in the project's dashboard. Their names as the docs give them ("Allow new users to sign up", "Confirm email") come from the phase's plan and were never checked against a hosted dashboard.
- `account-access` refuses to issue links when the served `/auth/v1/settings` does not say `disable_signup: true` and `mailer_autoconfirm: false`. That stops the legitimate flow and logs the reason. It does not stop an attacker, who signs up directly and calls `claim_invitations` over the REST API without touching the function.
- `claim_invitations` itself asks nothing about the deployment.

## Solution

- Before a hosted project holds its first invitation: set the two switches, then read `GET <project url>/auth/v1/settings` with the anon key and confirm `"disable_signup": true` and `"mailer_autoconfirm": false`. The deployment page states this.
- Consider a guard the database can hold: `claim_invitations` cannot read the auth service's configuration, but it could refuse unless a row of `private.deployment_settings` records that an operator has confirmed the setting, which makes a forgotten step fail closed instead of open. Weigh it against the false assurance of a flag that can be set without the switch being off.
- Consider a scheduled check that reads the served settings and alerts, since a switch can be flipped back in the dashboard at any time.
