---
created: 2026-11-28
title: Order voter questions dynamically by uncertainty reduction
area: frontend
tags: [voter, admin, frontend, matching, app-shared, feat]
keywords: [question-ordering, entropy, information-gain, factor-analysis, adaptive]
source: "GitHub issue #631"
github_issues: [631]
files:
  - apps/frontend/src/lib/contexts/voter/nominationAndQuestionState.svelte.ts
  - apps/frontend/src/lib/contexts/voter/voterContext.svelte.ts
  - packages/app-shared/src/settings/dynamicSettings.type.ts
  - packages/matching/
  - apps/frontend/src/lib/routes/route.ts
---

# Order voter questions dynamically by uncertainty reduction

## Origin

Converted from GitHub issue [#631 Question selection and ordering based on most uncertainty](https://github.com/openvaa/voting-advice-application/issues/631) on 2026-11-28.

## Problem

Epic #631: busy voters should answer as few questions as needed. After each answer, choose the next question that resolves the most uncertainty (depends on prior answers, so static clustering is insufficient). Could extend to non-opinion questions that eliminate cohorts (party preference, excluded parties, gender/age). Proposed design (2025-01): factors computed per election from entity answers and stored in election custom data via an admin `computeFactors(electionIds?)` job; setting `questions.dynamicOrdering { enabled, config: { type: 'factor-based', numSuggestions } | { type: 'eliminate-choices', eliminationType: 'strict'|'relaxed' } }`; integrate into `VoterContext.selectedQuestionBlocks`; show N suggested next questions; stopping condition / reliability indicator; restrict to entities in the selected election and constituency; must run efficiently in the browser. Prototypes: github.com/MemeSlayer27/entropy_reducer, Ehdokaskartta matcher.service.ts.

## Solution

TBD — start with factor computation job (shared with #630 political map, and the unbuilt `AdminAppFactorAnalysis` route), then the setting and a selector in the voter context; Figma design exists.
