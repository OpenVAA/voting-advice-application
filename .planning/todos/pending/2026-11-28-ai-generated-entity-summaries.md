---
created: 2026-11-28
title: Generate AI summaries of candidates and parties
area: frontend
tags: [voter, admin, frontend, llm, feat]
keywords: [llm, entity-summary, candidates, parties, manifesto]
source: "GitHub issue #626"
github_issues: [626]
files:
  - packages/llm/
  - apps/frontend/src/routes/admin/(protected)/
  - apps/frontend/src/lib/server/admin/jobs/
  - apps/frontend/src/lib/dynamic-components/entityCard/
  - packages/app-shared/src/settings/dynamicSettings.type.ts
---

# Generate AI summaries of candidates and parties

## Origin

Converted from GitHub issue [#626 AI-generated explanations summaries of candidates or parties](https://github.com/openvaa/voting-advice-application/issues/626) on 2026-11-28.

## Problem

Voters would like short summaries of candidates and parties in the results list without opening details. Sources: candidate answers and open answers, optional links (website, social media), voting history, party manifestos. Concerns from epic #626: avoid overlapping what match scores already show; whether entities must approve/edit summaries before display and what to show otherwise. A manifesto-summariser prototype was tested by the 2024-25 student team.

## Solution

Follow the question-info/argument-condensation pattern: a package or module using `@openvaa/llm`, an Admin App job to generate (precomputed, localized), storage in entity `custom_data`, display in `EntityCard`/entity details behind a setting. Decide approval flow with the Contestant App.
