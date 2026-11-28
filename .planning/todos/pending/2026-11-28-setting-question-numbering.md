---
created: 2026-11-28
title: Add a setting to hide question numbering
area: frontend
tags: [voter, frontend, app-shared, improvement]
keywords: [question-numbering, question-heading, settings, category-tag]
source: "GitHub issue #539"
github_issues: [539]
files:
  - apps/frontend/src/lib/dynamic-components/questionHeading/QuestionHeading.svelte
  - packages/app-shared/src/settings/dynamicSettings.type.ts
  - packages/app-shared/src/settings/dynamicSettings.ts
  - packages/app-shared/src/data/schemas/storedSettings.schema.ts
---

# Add a setting to hide question numbering

## Origin

Converted from GitHub issue [#539 feat: add setting for showing index of question within the category on the questions route](https://github.com/openvaa/voting-advice-application/issues/539) on 2026-11-28.

## Problem

`QuestionHeading` (`apps/frontend/src/lib/dynamic-components/questionHeading/QuestionHeading.svelte`) always shows the question's position (`n/total` within the category, or overall when categories are hidden). Operators cannot turn this off.

## Solution

Add e.g. `questions.showQuestionNumbers: boolean` (default `true`) to `DynamicSettings`, the stored settings schema and docs, and read it in `QuestionHeading`.
