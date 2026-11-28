---
created: 2026-11-28
title: Render Contestant App preview within a nomination
area: frontend
tags: [contestant, frontend, ui, feat]
keywords: [preview, nomination, election-symbol, contestant-app, entity-details]
source: "GitHub issue #819"
github_issues: [819]
files:
  - apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/(nominated)/preview/+page.svelte
  - apps/frontend/src/lib/contexts/contestant/contestantContext.svelte.ts
  - apps/frontend/src/lib/dynamic-components/entityDetails/
---

# Render Contestant App preview within a nomination

## Origin

Converted from GitHub issue [#819 feat: simulate nomination in Candidate App preview](https://github.com/openvaa/voting-advice-application/issues/819) on 2026-11-28.

## Problem

The Contestant App preview (`apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/(nominated)/preview/+page.svelte`) shows `EntityDetails` for the bare entity. Voters see the entity as a nomination (with election symbol, parent party and constituency-specific info), so the preview does not show what voters will see. An entity with several nominations cannot choose which one to preview.

## Solution

Load the entity's nominations (the context already knows them for the nominations pages), wrap the entity as its nomination for display, and add a selector when there are several. Avoid polluting the shared dataRoot with unconfirmed data that the voter app could later read (or clear it on leave).
