---
created: 2026-11-28
title: Validate env and layer static settings overrides
area: frontend
tags: [frontend, app-shared, tooling, improvement]
keywords: [env-variables, static-settings, dynamic-settings, zod, configuration]
source: "GitHub issue #788"
github_issues: [788]
files:
  - apps/frontend/src/lib/utils/constants.ts
  - apps/frontend/src/lib/server/constants.ts
  - packages/app-shared/src/settings/staticSettings.ts
  - packages/app-shared/src/settings/staticSettings.type.ts
  - packages/app-shared/src/settings/dynamicSettings.ts
  - .env.example
---

# Validate env and layer static settings overrides

## Origin

Converted from GitHub issue [#788 refactor: env variables, settings and other configuration](https://github.com/openvaa/voting-advice-application/issues/788) on 2026-11-28.

## Problem

Configuration lives in three places: the root `.env` (read through `apps/frontend/src/lib/utils/constants.ts` and `apps/frontend/src/lib/server/constants.ts` as raw strings with `?? ''` defaults, no schema), `StaticSettings` hard-coded in `packages/app-shared/src/settings/staticSettings.ts` (customising an instance means editing the file and rebuilding), and `DynamicSettings` defaults merged with the DB `app_settings`. There is no validation of env values at startup and no way to override a static setting from the environment, which makes deploying several instances from one image awkward.

## Solution

Define a zod schema for public and private env and validate once at server start (fail loudly naming the variable). Introduce a layered merge for static settings: defaults <- env-derived overrides <- instance custom file, with a `Private<T, locus>` type so server-only values never reach the client. Coordinate with the app-settings deep-merge todo for the dynamic side. Optional: faster Docker rebuilds when only env/settings change.
