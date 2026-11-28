---
created: 2026-11-28
title: Track category selection and category skipping
area: frontend
tags: [voter, frontend, improvement]
keywords: [analytics, tracking-events, category-selection, category-skip, questions]
source: "GitHub issue #545"
github_issues: [545]
files:
  - apps/frontend/src/routes/(voters)/(located)/questions/+page.svelte
  - apps/frontend/src/routes/(voters)/(located)/questions/category/[categoryId]/+page.svelte
  - apps/frontend/src/lib/contexts/app/tracking
---

# Track category selection and category skipping

## Origin

Converted from GitHub issue [#545 feat: add event tracking to category selection and skipping](https://github.com/openvaa/voting-advice-application/issues/545) on 2026-11-28.

## Problem

The voter questions flow tracks per-question navigation (`question_next`, `question_skip` in `questions/+layout.svelte`) but not the category-level choices: selecting categories on the questions intro page and skipping a whole category on the category intro page send no analytics events.

## Solution

Add events such as `questions_categoriesSelected` (selected ids/count) on submit and `questionCategory_skip` (category id) on the skip button, register them in the tracking event types, and respect the analytics allow/deny list.
