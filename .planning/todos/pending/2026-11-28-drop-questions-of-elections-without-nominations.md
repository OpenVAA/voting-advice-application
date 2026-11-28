---
created: 2026-11-28
title: Drop questions of elections that have no nominations
area: frontend
tags: [voter, frontend, contexts, improvement]
keywords: [question-blocks, nominations-available, elections, opinion-questions, voter-context]
source: "GitHub issue #719"
github_issues: [719]
files:
  - apps/frontend/src/lib/contexts/voter/voterContext.svelte.ts
  - apps/frontend/src/lib/contexts/voter/nominationAndQuestionState.svelte.ts
  - apps/frontend/src/lib/contexts/utils/questionRollup.ts
  - apps/frontend/src/routes/(voters)/(located)/+layout.svelte
---

# Drop questions of elections that have no nominations

## Origin

Converted from GitHub issue [#719 feat: filter out `Question`s for `Election`s lacking `Nomination`s](https://github.com/openvaa/voting-advice-application/issues/719) on 2026-11-28.

## Problem

In the Voter App, `VoterContext` builds `opinionQuestions`, `infoQuestions` and `selectedQuestionBlocks` from every selected election and constituency (`rollUpQuestionCategories` and `QuestionCategory.getApplicableQuestions` in `voterContext.svelte.ts`). It also computes `nominationsAvailable` per selected election from the nomination-and-question tree, but the question chain never reads it. So when the voter has selected several elections and one of them has no nominations in the chosen constituency, the voter is still asked the questions that apply only to that election, although no result can come of them. The `(located)` layout only shows a modal about missing nominations.

## Solution

Pass the elections that have nominations (from `nominationsAvailable`, or from the nomination tree) into the question roll-up and the question-blocks effect, so questions whose `appliesTo` holds only for elections without nominations are filtered out. Mind the ordering: the nomination tree itself reads `opinionQuestions` (for `hideIfMissingAnswers`), so avoid a cycle, e.g. by computing election-level nomination presence from `dataRoot` directly, before the answer-based hiding. Also check `resultsAvailable` / minimum-answers counting and the `(located)` layout's nominations modal.
