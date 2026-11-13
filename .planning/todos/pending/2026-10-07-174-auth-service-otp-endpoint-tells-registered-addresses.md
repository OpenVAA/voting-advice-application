---
created: 2026-10-07T12:53:29.000Z
title: The auth service's own POST /otp answers differently for a registered address and mails its own link, around the invitation gate and throttle
area: Auth / email
severity: major
source: Phase 174 (ruling OQ-6, residual R-g of 174-01-PLAN.md; 174-RESEARCH.md RQ-1 (iii) and Open Question 6; filed by 174-10)
owner: Phase 178
files:
  - apps/supabase/supabase/config.toml
  - apps/supabase/supabase/functions/account-access/index.ts
  - apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts
---

## Problem

`account-access` answers every link request alike and limits mail to one per address per minute. The auth service has an endpoint of its own that does neither, and any holder of the anon key can call it directly:

- `POST /auth/v1/otp` answers `200` for an address that has an account, and mails that address the auth service's own English sign-in mail, with a link that is not the callback link of this application.
- It answers `422` for an address that has no account.

So the difference in status tells a registered address from an unregistered one, and the mail goes out without passing `invitation_link_request` or its 60-second slot. What is disclosed is that an address has an account, not that it was invited.

**How this is known.** Measured by the phase's research on a private GoTrue `v2.197.0` configured as the local stack is, "in every configuration measured"; `GOTRUE_EXTERNAL_EMAIL_MAGIC_LINK_ENABLED=false` did not remove the difference in answers. On this repository's local stack the unregistered half is observed by every gate run (`174-stack-probe.sh`: `POST /otp` with `create_user` answers `422 signup_disabled`). The registered half was not re-measured on the local stack by Phase 174.

## Solution

For Phase 178, which moves the recovery mail into `account-access`:

- The research measured that a send-email hook that sends nothing stops every mail the auth service originates while `generate_link` and `/verify` keep working. Once the forgot-password page no longer depends on the auth service's own recovery mail, configure such a hook (`[auth.hook.send_email]`) so that the auth service mails nothing itself.
- That removes the mail. Whether it also removes the difference in the status of `POST /otp` is not established: measure it, and if the difference remains, state it as a residual of the hosted auth service.
- A hosted project needs the same hook configured in its dashboard; add it to the deployment page's auth settings.

## Update 2026-10-16 (Phase 178 close): the mail is stopped; the answer still tells

**Measured (probe row P6, plan 178-20, local stack, the no-op mail hook enabled and the stack restarted):** the auth service's own one-time-code request with `create_user: false` answers `200` for an address that has an account and `422` with `otp_disabled` for one that has none (`P6-OTP: distinguishes`); five seconds later the mail catcher holds no mail for either address. So the hook (`public.send_email_hook`, `[auth.hook.send_email]`) closes the second half of the problem, the auth service's own mail around the invitation gate and throttle, and not the first: the endpoint still tells a registered address from an unregistered one.

**Documented as open** in `developers-guide/backend/authentication` § Known residuals, with the measurement, and never claimed closed. A hosted project was not measured.

**What is left.** The answer is the auth service's, reachable with the anon key whatever the application does. A remedy is outside the repository: a gateway rule in front of `/auth/v1/otp`, or an auth-service version that answers alike. For whoever owns the deployment.
