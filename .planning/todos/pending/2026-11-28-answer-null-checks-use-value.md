---
created: 2026-11-28
title: Check answer values not Answer objects for missing
area: frontend
tags: [voter, frontend, bug]
keywords: [voter-answer, null-check, answer-value, weights, statistics]
source: "GitHub issue #828"
github_issues: [828]
files:
  - apps/frontend/src/lib/dynamic-components/entityDetails/EntityOpinions.svelte
  - apps/frontend/src/lib/components/questions/QuestionActions.svelte
  - apps/frontend/src/routes/(voters)/(located)/results/statistics/+page.svelte
  - apps/frontend/src/lib/dynamic-components/entityCard/EntityCard.svelte
---

# Check answer values not Answer objects for missing

## Origin

Converted from GitHub issue [#828 check: never check for voterAnswer == null because it might have just the weight](https://github.com/openvaa/voting-advice-application/issues/828) on 2026-11-28.

## Problem

An `Answer` may exist without a `value` (e.g. when only a weight or info is set, which voter-set weights would introduce). Code that tests `voterAnswer == null` treats such an answer as present. Known spots: `apps/frontend/src/lib/dynamic-components/entityDetails/EntityOpinions.svelte` (the voterAnswer/answer branches around lines 56-73), the usage example in `apps/frontend/src/lib/components/questions/QuestionActions.svelte`, and `apps/frontend/src/routes/(voters)/(located)/results/statistics/+page.svelte`, which builds `voterAnswer` as a template string of `.value` (so it is the string 'undefined', never null) and then checks `== null`.

## Solution

Grep for `[aA]nswer == null` / `!= null` / `!answer` across apps/frontend and packages and switch to `answer?.value == null` (or `isEmptyValue`/`MISSING_VALUE` helpers where appropriate). Fix the statistics page string coercion. Consider a lint rule or a shared `hasAnswerValue()` helper.
