---
created: 2026-11-28
title: Tell returning voters their saved answers are in use
area: frontend
tags: [voter, frontend, ui, contexts, feat]
keywords: [stored-answers, returning-voter, localstorage, resume, reset-answers, front-page]
source: "GitHub issue #370"
github_issues: [370]
files:
  - apps/frontend/src/routes/(voters)/+page.svelte
  - apps/frontend/src/lib/contexts/voter/answerState.svelte.ts
  - apps/frontend/src/lib/contexts/voter/countAnswers.ts
  - apps/frontend/src/lib/dynamic-components/navigation/voter/VoterNav.svelte
  - apps/frontend/src/lib/components/alert/Alert.svelte
---

# Tell returning voters their saved answers are in use

## Origin

Converted from GitHub issue [#370 feat: let the user know if their old answers are used](https://github.com/openvaa/voting-advice-application/issues/370) on 2026-11-28.

## Problem

The Voter App keeps the voter's answers in `localStorage` (`answerState.svelte.ts`, through `localStorageState` in `contexts/utils/persistedState.svelte.ts`). A voter who returns to the app silently gets their old answers: the front page shows only the Start button, and the only way to clear them is the 'Reset answers' item in `VoterNav`. The voter is never told answers exist, and is not offered a shortcut to the results.

## Solution

When the voter context holds answers on entry to the front page (or the intro), show a non-modal notice (existing `Alert`/`Notification` components) offering: go straight to results (if `matching.minimumAnswers` is met), continue answering, or delete the answers (`resetVoterData`). Add tracking events for each choice, translations in all locales, and an E2E step.
