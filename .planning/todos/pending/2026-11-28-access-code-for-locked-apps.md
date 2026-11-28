---
created: 2026-11-28
title: Add access code to preview locked apps
area: frontend
tags: [voter, contestant, frontend, supabase, app-shared, feat]
keywords: [access-key, preview, locked-app, cookie, access-settings, access-code, maintenance, bypass]
source: "GitHub issue #698"
github_issues: [698, 817]
files:
  - packages/app-shared/src/settings/dynamicSettings.type.ts
  - apps/frontend/src/hooks.server.ts
  - apps/frontend/src/routes/(voters)/
  - apps/frontend/src/routes/contestant/+layout.server.ts
  - apps/frontend/src/lib/routes/
---

# Add access code to preview locked apps

## Origin

Converted from GitHub issue [#698 feat: an access key to allow access to Voter or Candidate App](https://github.com/openvaa/voting-advice-application/issues/698) on 2026-11-28.

## Problem

`DynamicSettings.access.voterApp` / `candidateApp` lock an app entirely; there is no way for staff, journalists or testers to preview a locked app before launch. Requested: an access code that unlocks the Voter App and the Contestant App even when locked.

## Solution

Do the access check server-side (outer +layout.server.ts / hooks) instead of only in universal layouts; store the code in the backend (e.g. project/app_settings readable only server-side, or an env secret); allow entering it on the locked screen or via a query param / separate route; on success set an httpOnly cookie. Need not be highly secure, but keep the code out of public settings.

## From GitHub issue #817 (2026-11-28)

[#817 feat: add a code with which to bypass locked Candidate and Voter Apps](https://github.com/openvaa/voting-advice-application/issues/817)

**Add preview code to bypass locked apps**

When `access.voterApp` / `access.contestantApp` is `false` (or `access.underMaintenance` is `true`) nobody outside can see the app, which makes pre-launch review by the publisher, partners or journalists hard: they need an admin account or a separate deployment. See `packages/app-shared/src/settings/dynamicSettings.type.ts` (`access`) and the gates in `apps/frontend/src/routes/+layout.svelte` and `apps/frontend/src/lib/routes/`.

*Approach:* Store a (hashed) preview code per project in the backend (app settings or a dedicated column, readable only by admins). Accept it on the locked screen or via a dedicated route/query param, verify server-side, and set a short-lived signed cookie (or sessionStorage flag for the client gate) that lets the gates pass. Never expose the code in public app settings. Decide whether admins/project editors bypass automatically.
