---
created: 2026-10-07T12:53:29.000Z
title: A later sign-in link makes the earlier unopened one stop working - the "email sent" screen must expect it, and a third party can use it once a minute
area: Contestant app / auth
severity: major
source: Phase 174 (residual R-c of 174-01-PLAN.md; measured by 174-05, row E6 of 174-NAME-MAP.md; filed by 174-10)
owner: Phase 178
files:
  - apps/supabase/supabase/functions/account-access/index.ts
  - apps/supabase/supabase/schema/506-invitation-rpcs.sql
---

## Problem

Measured on the local stack (Supabase CLI `v2.118.0`): two `magiclink` tokens issued in a row for one confirmed address through `POST /auth/v1/admin/generate_link`; verifying the FIRST afterwards answers `403 otp_expired`, and verifying the SECOND then answers `200` with a session. The auth service keeps one such token per user. A hosted project's auth service was not measured.

Two consequences for the screens Phase 178 builds:

- **Only the newest mail works.** A user who asks twice and opens the first mail meets the callback's auth error. The "email sent" screen's wording and its "send again" control must say so.
- **A third party can invalidate a link the user has not opened yet.** Anyone who knows the address can ask for a link to it; the request is answered like any other, the user gets a second mail, and the first link is dead. The 60-second slot per address is what bounds this to once a minute. Nothing else stands in the way, because no limit uses the caller's identity (see the todo on the per-caller limit).

## Solution

- The "email sent" screen says that only the most recent mail's link works, and its resend control waits out the 60 seconds the server enforces whatever the screen does.
- The callback's error page for an expired or replaced link offers "send a new link" rather than only the login form.
- If the once-a-minute invalidation matters for a deployment, the remedy is the same as for the per-caller limit: an identity for the caller at the gateway, or a captcha on the request form.
- Re-measure on a hosted project before relying on the local result in either direction.

## Resolution

**Closed 2026-10-16 by Phase 178** (plans 178-06, 178-10 and 178-13). Both mails say that only the newest link works (`mailTemplates.ts`, pinned by `the sign-in mail reads as written` and `the recovery mail reads as written` in `mailTemplates.test.ts`), and so does the "email sent" screen (`contestantApp.emailSent.newest`). Its "Send again" waits 65 seconds from the request's settlement, past the server's 60-second slot. The sign-in request and the recovery request share one slot per address (`recovery_link_request`), so a later link of either kind stops an earlier unopened one of either kind, as the mails say.

What stays as it was, documented and not built: a mailed link that no longer works lands on the login screen with the `authError` notice, which says the link could not be used, and the user asks again from the sign-in screen; no "send a new link" button stands on the callback's error landing. The third party's once-a-minute invalidation is listed in `developers-guide/backend/authentication` § What this does not protect against, and a hosted project was not measured.
