---
created: 2026-10-07T12:53:29.000Z
title: toCallbackUrl has one caller left and defaults to a link type the callback refuses - it leaves with the recovery mail
area: tests / E2E
severity: minor
source: Phase 174 (ruling OQ-3 / item 13 of 174-01-PLAN.md; 174-09-SUMMARY.md § toCallbackUrl; name map row J4; filed by 174-10)
owner: Phase 178
files:
  - tests/tests/fixtures/shared/emailBucket.fixture.ts
  - tests/tests/specs/contestant/contestant-journey.spec.ts
  - apps/frontend/src/routes/api/auth/callback/+server.ts
---

## Problem

`toCallbackUrl(verifyLink, callbackPath)` in the E2E mail fixture turns the auth service's own `/auth/v1/verify?…` link into a hand-built callback URL. The sign-in mail of an invitation needs no such step: its link is already the callback URL, and the specs open it with `assertSignInLinkShape` and `toRunOrigin`.

- One caller remains: the journey's password-reset step, because the recovery mail is still the auth service's own (`git grep -n -F "toCallbackUrl(" -- . ':!.planning'` lists the declaration, one docblock line and that call).
- Its default for a verify link that carries no `type` is `invite` (`url.searchParams.get('type') ?? 'invite'`). The callback refuses `type=invite` without verifying it. The auth service's recovery link always carries `type=recovery`, so the default is never taken today; a future caller that relied on it would be sent to the login page with the auth error.
- The phase's closing search for the helper (D-24) was dropped for this reason and handed on.

## Solution

When Phase 178 moves the recovery mail into `account-access`, the recovery link is a callback URL like the sign-in link. Then:

- re-point the journey's reset step at `assertSignInLinkShape` / `toRunOrigin` (or their recovery twins);
- delete `toCallbackUrl` and its docblock line, and add `git grep -n -F "toCallbackUrl" -- . ':!.planning'` printing nothing to that phase's closing searches;
- until then, change the default to throw on a link with no `type` instead of naming a refused one, if the helper is touched for any other reason.

## Resolution

**Closed 2026-10-16 by Phase 178** (plans 178-19 and 178-23). The recovery mail is the `account-access` function's, so its link is already the callback URL. The journey's password-reset step and `contestant-password-recovery.spec.ts` read it with `invitationFlow.recoveryLinkToOpen(address)`, which asserts its shape and moves it to the run's origin. `toCallbackUrl` is gone: plan 178-23's closing search (`git grep -n -F toCallbackUrl -- . ':!.planning'`) prints nothing.
