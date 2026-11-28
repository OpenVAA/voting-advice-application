---
created: 2026-11-28
title: Add generic educational game mode to Voter App
area: frontend
tags: [voter, frontend, app-shared, ui, feat]
keywords: [game-mode, education, target-party, settings, voter-nav]
source: "GitHub issue #707"
github_issues: [707]
files:
  - packages/app-shared/src/settings/dynamicSettings.type.ts
  - apps/frontend/src/lib/contexts/voter/voterContext.svelte.ts
  - apps/frontend/src/lib/dynamic-components/navigation/voter/VoterNav.svelte
  - apps/frontend/src/routes/(voters)/
  - apps/frontend/src/lib/routes/selectionOrder.ts
---

# Add generic educational game mode to Voter App

## Origin

Converted from GitHub issue [#707 feat: educational mode](https://github.com/openvaa/voting-advice-application/issues/707) on 2026-11-28.

## Problem

A simple game mode for classroom use, ideally generic for future games. Initial game: enabled by `DynamicSettings.gameMode.enabled`; a game-mode intro page linked from `VoterNav`; starting it auto-selects predefined election and constituency (selection disabled), randomly picks a party in the constituency as `target`, and tasks the user to answer so a candidate from `target` ranks first; a 'Game mode' header tag links back; on results, congratulate if target is first (or within a settings-specified margin), else show 'You got {target} to rank {targetRank}' with a button back to questions; ending the game returns to the front page, clears selections and deletes answers. An ad hoc version exists on branch `educational-nuorten-vaalikone-2025` (Strapi era); port its generic parts.

## Solution

Add settings in app-shared, a voter route for the intro page, game state in the voter context (sessionStorage), hooks into selection gating (`lib/routes`) and results; keep custom game variants pluggable.
