---
created: 2026-11-28
title: Sync saved contestant data across open tabs
area: frontend
tags: [contestant, frontend, contexts, improvement]
keywords: [broadcast-channel, multiple-tabs, sync, user-data, save]
source: "GitHub issue #774"
github_issues: [774]
files:
  - apps/frontend/src/lib/auth/logoutAnnouncement.ts
  - apps/frontend/src/lib/contexts/contestant/entityUserDataState.svelte.ts
  - apps/frontend/src/lib/contexts/contestant/contestantContext.svelte.ts
  - apps/frontend/src/lib/contexts/utils/persistedState.svelte.ts
---

# Sync saved contestant data across open tabs

## Origin

Converted from GitHub issue [#774 feat: handle multiple open windows in the Candidate App](https://github.com/openvaa/voting-advice-application/issues/774) on 2026-11-28.

## Problem

If a contestant has the Contestant App open in several tabs, a save in one tab does not refresh the saved entity data (`userData.savedEntityData`) in the others, so another tab can show and later overwrite with stale data. What exists: logout is announced over a `BroadcastChannel` (`apps/frontend/src/lib/auth/logoutAnnouncement.ts`), and unsaved draft answers are in localStorage handles that already follow `storage` events from other tabs (`apps/frontend/src/lib/contexts/utils/persistedState.svelte.ts`). Sign-in is not broadcast.

## Solution

Add a small app-level broadcast helper (generalise the logout channel) and, on a successful save in `entityUserDataState.svelte.ts`, post `{ entityId, savedQuestionIds, savedProperties }`; receivers call `reloadEntityData()` without clearing their own unsaved edits, except for the saved ids. Guard against ping-pong (ignore own messages, debounce). Optionally broadcast sign-in so other tabs leave the login page.
