---
created: 2026-03-21T12:48:42.166Z
title: Fix candidate-app-mutation E2E tests (SES email infrastructure)
area: testing
files:
  - tests/tests/specs/candidate/candidate-registration.spec.ts
  - tests/tests/specs/candidate/candidate-profile.spec.ts
---

## Problem

3 candidate-app-mutation E2E tests fail because the SES email delivery in Docker LocalStack isn't working. The `registrationLink` extracted from the email is `undefined`, causing `page.goto(registrationLink)` to fail with `url: expected string, got undefined`.

Affected tests:
- `candidate-registration.spec.ts:73` — "should complete registration via email link"
- `candidate-registration.spec.ts:133` — "should complete forgot-password and reset flow via SES email"
- `candidate-profile.spec.ts:59` — "should register the fresh candidate via email link"

This is pre-existing since at least v1.3 (confirmed by reverting all Phase 27 changes and re-running — same failure). The tests depend on:
1. Strapi sending a registration email via SES (LocalStack)
2. The test reading the email from LocalStack's SES endpoint
3. Extracting the registration link from the email body

The email either isn't being sent or the LocalStack SES retrieval is failing.

Priority: critical tech debt — blocks full green CI (48 tests don't run because they depend on the auth-setup that these tests are part of).

## Solution

Investigate the LocalStack SES email flow:
1. Check if Strapi is configured to send emails via LocalStack SES (`MAIL_*` env vars in Docker)
2. Verify LocalStack SES endpoint is receiving emails (curl `http://localhost:4566/_aws/ses/`)
3. Check the test helper that extracts registration links from SES — it may need updating for newer LocalStack API
4. Consider adding a direct Strapi API fallback for registration (bypass email) as a test resilience measure

## Resolution

**Resolved:** 2026-03-21
**Actual root cause:** NOT SES email infrastructure. SES was confirmed fully operational in Phase 28 Plan 02. The actual issue was a Vite dev-mode streaming bug: after form-action login redirects, the protected layout's data loading hung for newly registered users. Fixed in Phase 28 Plan 03 by replacing `page.reload()` with API-based ToU acceptance + cookie domain transfer + fresh navigation, and by caching auth cookies to avoid Strapi's auth rate limiter.
