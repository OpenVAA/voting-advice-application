---
created: 2026-11-28
title: Allow per-election results.cardContents settings
area: frontend
tags: [voter, frontend, app-shared, feat]
keywords: [card-contents, results, election-specific, entity-card, settings]
source: "GitHub issue #729"
github_issues: [729]
files:
  - packages/app-shared/src/settings/dynamicSettings.type.ts
  - packages/app-shared/src/data/schemas/storedSettings.schema.ts
  - apps/frontend/src/lib/contexts/voter/voterContext.svelte.ts
  - apps/frontend/src/lib/dynamic-components/entityCard
---

# Allow per-election results.cardContents settings

## Origin

Converted from GitHub issue [#729 feat: specify `results.cardContents` settings for each `Election`](https://github.com/openvaa/voting-advice-application/issues/729) on 2026-11-28.

## Problem

`results.cardContents` (app settings) decides what an entity card shows in the results list, per entity type: `submatches` and answers to specific questions (`QuestionInCardContent`). In a multi-election VAA the right contents can differ by election, e.g. a question that applies only to one election shown on the card. Today one setting applies to every election.

## Solution

Allow an optional per-election override, e.g. `results.cardContents` accepting `{ default: {...}, byElection: { [electionId]: {...} } }` or an `elections` map, resolved by `currentResultsElection` in the voter context. Update `DynamicSettings` type, `StoredSettingsSchema`, the EntityCard consumers and `#calcSubmatches` in `voterContext.svelte.ts`. Alternatively, as a minimal step, drop question card contents whose question does not apply to the current election.
