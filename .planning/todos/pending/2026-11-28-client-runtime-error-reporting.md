---
created: 2026-11-28
title: Report client-side runtime errors to the server
area: frontend
tags: [voter, contestant, admin, frontend, improvement]
keywords: [error-logging, client-errors, handle-error, observability, unhandledrejection]
source: "GitHub issue #533"
github_issues: [533]
files:
  - apps/frontend/src/hooks.client.ts
  - apps/frontend/src/hooks.server.ts
  - apps/frontend/src/routes/api/usage/+server.ts
  - apps/frontend/src/lib/server/analytics/relay.ts
---

# Report client-side runtime errors to the server

## Origin

Converted from GitHub issue [#533 feat: runtime error logging](https://github.com/openvaa/voting-advice-application/issues/533) on 2026-11-28.

## Problem

Unexpected errors in the browser (CSR) are invisible to operators. `apps/frontend/src/hooks.client.ts` has no `handleError` export and nothing listens for `window.onerror`/`unhandledrejection`; only server errors reach the logs via `hooks.server.ts` `handleError`.

## Solution

Add a client `handleError` plus global listeners that post a minimal, privacy-safe record (route id, error name/message, user agent class, app version; no answers or addresses) to a first-party endpoint, rate-limited, which writes it through the server logger — or reuse the analytics relay (`/api/usage`, `lib/server/analytics`) as a dedicated event type. Decide whether consent is needed for a count-only model.
