---
created: 2026-11-28
title: Expire stored user preferences after a set age
area: frontend
tags: [voter, contestant, frontend, contexts, improvement]
keywords: [user-preferences, consent-expiry, localstorage, feedback, survey, gdpr]
source: "GitHub issue #503"
github_issues: [503]
files:
  - apps/frontend/src/lib/contexts/app/userPreferences.type.ts
  - apps/frontend/src/lib/contexts/app/appContext.svelte.ts
  - apps/frontend/src/lib/contexts/utils/persistedState.svelte.ts
  - packages/app-shared/src/settings/dynamicSettings.type.ts
---

# Expire stored user preferences after a set age

## Origin

Converted from GitHub issue [#503 feat: consider expiring UserSettings after a given time](https://github.com/openvaa/voting-advice-application/issues/503) on 2026-11-28.

## Problem

User preferences — data-collection consent (`dataCollection`, `contestantDataConsent`), feedback and survey status — are kept in `localStorage` with the date they were given (`apps/frontend/src/lib/contexts/app/userPreferences.type.ts`). The dates are never used: a consent given years ago, or a dismissed feedback popup, lasts forever unless the operator bumps `appVersion.requireUserDataVersion`, which wipes everything. Consent in particular is usually expected to be re-asked after a period (commonly 6-12 months).

## Solution

Add settings for max age per preference group (consent, feedback, survey), check the stored date when reading in the app context, and reset only the expired member to its default. Unit-test with fake timers.
