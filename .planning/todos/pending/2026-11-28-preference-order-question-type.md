---
created: 2026-11-28
title: Implement preference-order (ranked) question type
area: frontend
tags: [voter, contestant, frontend, data, matching, ui, feat]
keywords: [preference-order, ranked-question, question-type, drag-reorder, matching-metric]
source: "GitHub issue #98"
github_issues: [98]
files:
  - packages/data/src/objects/questions/base/questionTypes.ts
  - packages/data/src/objects/questions/base/answer.type.ts
  - packages/data/src/objects/questions/variants/variants.ts
  - packages/matching/src
  - apps/supabase/supabase/schema/105-answers.sql
  - apps/frontend/src/lib/components/input/QuestionInput.svelte
  - apps/frontend/src/lib/components/input/Input.svelte
---

# Implement preference-order (ranked) question type

## Origin

Converted from GitHub issue [#98 Support Ranked Preference question and answer types](https://github.com/openvaa/voting-advice-application/issues/98) on 2026-11-28.

## Problem

VAAs sometimes ask respondents to rank options (e.g. order policy priorities). OpenVAA has no question type for this: `QUESTION_TYPE.PreferenceOrder` is stubbed out with `// TODO: Implement` in `packages/data/src/objects/questions/base/questionTypes.ts`, `answer.type.ts` (answer would be `Array<Id>`) and `variants/variants.ts`. Implementing it touches every layer: the `@openvaa/data` question class and its `MatchableQuestion` interface (how a ranking maps to matching dimensions), `@openvaa/matching` (a distance for rankings, e.g. pairwise/Kendall-style or positional), the DB question-type validation and `validate_answers_jsonb` in `apps/supabase`, the voter question page, and the Contestant App question editor (`Input`/`QuestionInput`). The existing ordered `select-multiple` input keeps selection order but has no way to reorder after selection (see the related todo on reorder controls).

## Solution

Define the answer shape and matching mapping first (data + matching packages, with unit tests), then DB validation, then a reorderable input shared with the ordered multiple-choice input (keyboard move up/down plus optional drag). Decide whether ranking is opinion (matchable) or info-only.
