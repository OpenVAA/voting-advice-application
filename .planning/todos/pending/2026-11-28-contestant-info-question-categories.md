---
created: 2026-11-28
title: Group info questions by category in Contestant App
area: frontend
tags: [contestant, frontend, app-shared, ui, feat]
keywords: [info-questions, question-categories, profile-page, settings, contestant-app]
source: "GitHub issue #770"
github_issues: [770]
files:
  - apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/(nominated)/profile/+page.svelte
  - apps/frontend/src/lib/contexts/contestant/contestantContext.svelte.ts
  - packages/app-shared/src/settings/dynamicSettings.type.ts
  - packages/app-shared/src/settings/dynamicSettings.ts
---

# Group info questions by category in Contestant App

## Origin

Converted from GitHub issue [#770 feat: show Info question categories in the Candidate App](https://github.com/openvaa/voting-advice-application/issues/770) on 2026-11-28.

## Problem

In the Contestant App the profile page (`routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/(nominated)/profile/+page.svelte`) renders every unlocked info question in one flat list (`contestantCtx.infoQuestions`), ignoring the info question categories that exist in the data (`contestantCtx` also rolls up `infoQuestionCategories`). With many background questions this is a long undifferentiated form.

## Solution

Add an app setting, e.g. `entities.infoQuestions.categories: 'hidden' | 'on-same-page' | 'on-own-pages'` (or under the contestant app settings in `packages/app-shared/src/settings/dynamicSettings.type.ts`). `on-same-page`: render sections with category headings. `on-own-pages` (preferred by the issue): a stepper/sub-route per category with progress, reusing the questions-page pattern. Keep the locked-questions block and the save flow intact; add E2E coverage.
