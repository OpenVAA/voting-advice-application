---
created: 2026-11-28
title: Centralise next-route logic of the voter question flow
area: frontend
tags: [voter, frontend, improvement]
keywords: [routing, question-flow, category-intros, next-route, navigation]
source: "GitHub issue #755"
github_issues: [755]
files:
  - apps/frontend/src/lib/routes/selectionOrder.ts
  - apps/frontend/src/routes/(voters)/(located)/questions/+layout.svelte
  - apps/frontend/src/routes/(voters)/(located)/questions/+page.svelte
  - apps/frontend/src/routes/(voters)/(located)/questions/category/[categoryId]/+page.svelte
---

# Centralise next-route logic of the voter question flow

## Origin

Converted from GitHub issue [#755 feat/refactor: handle basic route flow centrally](https://github.com/openvaa/voting-advice-application/issues/755) on 2026-11-28.

## Problem

Election and constituency step order is already decided centrally (`apps/frontend/src/lib/routes/selectionOrder.ts`), but the question flow is not: whether the next step is a `QuestionCategory` intro or a `Question`, and what follows the last question, is decided separately in the questions layout, the questions intro page and the category intro page, each reading `questions.categoryIntros.show`/`allowSkip` itself. Changes to the flow must be made in several places.

## Solution

Add a pure helper in `$lib/routes` (e.g. `nextQuestionStep({ blocks, current, appSettings })` returning a route spec) next to `selectionOrder.ts`, used by all three pages; cover with unit tests. Optionally consider redirects in layouts for the category intro bypass.
