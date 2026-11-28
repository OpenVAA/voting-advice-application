---
created: 2026-11-28
title: Offer to delete answers of deselected question categories
area: frontend
tags: [voter, frontend, ui, contexts, feat]
keywords: [question-categories, answers, dialog, category-selection]
source: "GitHub issue #662"
github_issues: [662]
files:
  - apps/frontend/src/routes/(voters)/(located)/questions/+page.svelte
  - apps/frontend/src/lib/contexts/voter/answerState.svelte.ts
  - apps/frontend/src/lib/contexts/voter/matchState.svelte.ts
---

# Offer to delete answers of deselected question categories

## Origin

Converted from GitHub issue [#662 feat: delete Voter answers when deselecting question categories](https://github.com/openvaa/voting-advice-application/issues/662) on 2026-11-28.

## Problem

When `questions.questionsIntro.allowCategorySelection` is on and a voter who has already answered returns to the questions intro page and deselects categories, their answers to those categories remain in the answer store (`VoterContext-answerStore` in localStorage). They should be asked, in a dialog, whether to delete the answers to the deselected categories. Also check whether such answers still affect matching (matchState uses each election's `opinionQuestions`, not necessarily the selected blocks).

## Solution

On submit of the category selection, compute answered questions outside the selected categories; if any, show a confirm modal (delete / keep); delete via the answer state. Add unit and E2E coverage.
