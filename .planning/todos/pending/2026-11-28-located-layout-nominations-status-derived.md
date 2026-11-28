---
created: 2026-11-28
title: Replace debounced nominations-available check with derived state
area: frontend
tags: [voter, frontend, contexts, improvement]
keywords: [nominations-available, located-layout, debounce, race, svelte-5]
source: "GitHub issue #815"
github_issues: [815]
files:
  - apps/frontend/src/routes/(voters)/(located)/+layout.svelte
  - apps/frontend/src/lib/contexts/voter/voterContext.svelte.ts
---

# Replace debounced nominations-available check with derived state

## Origin

Converted from GitHub issue [#815 refactor[Svelte 5]: available nominations check](https://github.com/openvaa/voting-advice-application/issues/815) on 2026-11-28.

## Problem

`apps/frontend/src/routes/(voters)/(located)/+layout.svelte` decides whether to open the 'no nominations' modal by calling `awaitNominationsSettled()`, which creates a detached `$effect.root`, watches `voterCtx.nominationsAvailable`, debounces 100 ms and falls back to a safety timeout. It exists because after `dataRoot.provideNominationData` the voter context's `$derived`/`$effect` chain (selectedElections -> nominationsAndQuestions -> nominationsAvailable) has not propagated yet. Timing-based settling is fragile and slows the first paint of the results.

## Solution

Make the status a pure function of inputs available synchronously after `dataRoot.update(...)`: e.g. compute it directly from `dataRoot` + selected election/constituency ids in the layout, or expose a `$derived` `nominationStatus` on the voter context that the layout reads (with `tick()` after the update if needed), removing the timers. Keep the `modalShownForKey` reopen guard. Verify with the voter E2E specs (cold entry, constituency switch).
