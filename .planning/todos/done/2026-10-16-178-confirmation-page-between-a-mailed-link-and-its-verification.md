---
created: 2026-10-16T00:00:00.000Z
title: A mail scanner that follows links can spend a sign-in or recovery link before its addressee opens it - consider a confirmation page between the link and its verification
area: apps/frontend - auth
severity: minor
source: Phase 178 (plan 178-23; item U-30 of 178-UI-SPEC.md, built at (a); 178-RESEARCH.md RQ-8 and open question 7)
files:
  - apps/frontend/src/routes/api/auth/callback/+server.ts
  - apps/supabase/supabase/functions/account-access/signInLink.ts
---

## Problem

The callback verifies a mailed token on the `GET` that opens the link, and the token works once. A mail scanner that follows links (common on institutional mail domains) can open the link first: it spends the token, and the addressee's own click lands on the login screen with the `authError` notice. Measured on the local stack: a spent token and a superseded one are both answered `403 otp_expired` (probe rows P1 and P2), so the service's answer cannot say which happened. Not measured: any real scanner.

Evidence the research cited: Supabase names prefetching services as a cause of `otp_expired` ("these automated prefetching services can consume the OTP token by accessing the link before the legitimate user does", supabase.com troubleshooting guide on `otp_expired`), and community reports cluster on institutional mail domains (github.com/orgs/supabase/discussions/41618).

The residual is documented as open in `developers-guide/backend/authentication` § Known residuals.

## What to do

- Decide with the operator whether to build a confirmation page: the mailed link opens a page with one button, and only the button's `POST` verifies the token. A scanner that issues only `GET`s then spends nothing.
- If built: the link's path changes in `signInLink.ts` and the mails; the callback keeps its order (verify, claim, refresh, land) behind the `POST`; the E2E specs that open a mailed link press the button; the "email sent" screen's wording stays true.

## What to look for

- A scanner that executes scripts or submits forms defeats a confirmation page; check the reports for which kinds dominate before building.
- A typed code instead of a link is the other remedy the research names; it changes every mail and screen of the flow.

## Resolution

**Closed 2026-10-29** — built by Phase 179.1, plans 179.1-11 to 179.1-13 (folded into the phase, CONTEXT § Folded Todos; decisions D-06 to D-08):

- **The confirm page.** `/<locale>/auth/confirm` (`apps/frontend/src/routes/auth/confirm/+page.server.ts` and `+page.svelte`, `ROUTE.AuthConfirm`) belongs to neither app. Its load reads the link's `token_hash`, `type` and `next` into a form and verifies nothing, so a `GET` spends no token; the token is spent only when Continue posts the form, whose action calls `verifyMailedLink` (`apps/frontend/src/lib/server/auth/mailedLink.ts`): verify, claim, refresh, land, in that order. A browser that is already signed in is told that continuing signs that account out, and is offered Cancel (plan 11).
- **The callback hands every token link to the page** (plan 12): `/api/auth/callback` verifies nothing and answers a link that names it with a 303 to the confirm page carrying the same parameters; every E2E spec that opens a mailed link presses Continue through `openMailedLink` (`tests/tests/utils/mailedLink.ts`).
- **The mails link to the page** (plan 13): `LINK_PATH = '/auth/confirm'` in `apps/supabase/supabase/functions/account-access/signInLink.ts`; the local and hosted redirect allowlists admit `/auth/confirm` and `/*/auth/confirm` only (`apps/supabase/supabase/config.toml`, `infra/modules/supabase/hosted-settings.json`).
- **The residual is recorded on the docs page**, `developers-guide/backend/authentication` § Known residuals: a scanner that runs the page's script and submits its form can still spend a link. No real scanner was measured, before or after (the "What to look for" item above stays unanswered).
