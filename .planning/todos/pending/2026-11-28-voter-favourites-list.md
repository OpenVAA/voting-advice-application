---
created: 2026-11-28
title: Add voter favourites list for candidates and parties
area: frontend
tags: [voter, frontend, ui, contexts, feat]
keywords: [favourites, entity-card, local-storage, shortlist, results]
source: "GitHub issue #604"
github_issues: [604]
files:
  - apps/frontend/src/lib/dynamic-components/entityCard/
  - apps/frontend/src/lib/contexts/voter/voterContext.svelte.ts
  - apps/frontend/src/lib/dynamic-components/navigation/voter/VoterNav.svelte
  - apps/frontend/src/routes/(voters)/(located)/
  - packages/app-shared/src/settings/dynamicSettings.type.ts
---

# Add voter favourites list for candidates and parties

## Origin

Converted from GitHub issue [#604 feat: favourites list](https://github.com/openvaa/voting-advice-application/issues/604) on 2026-11-28.

## Problem

Voters cannot shortlist candidates or parties. Requested: an icon button on the entity card (and entity details) to add/remove an entity to a favourites list; the list opens from the voter navigation menu or a header icon button; favourites persist between sessions in `localStorage`. Figma has designs for the toggle button, not the list itself.

## Solution

Keep favourite ids in the voter context via `localStorageState` (`contexts/utils/persistedState.svelte.ts`, which already syncs across tabs), keyed per election/project. Add a toggle to `EntityCard`, a favourites page or drawer under `(voters)/(located)`, a nav item in `VoterNav`, and an optional setting to enable it. Handle ids that no longer resolve.
