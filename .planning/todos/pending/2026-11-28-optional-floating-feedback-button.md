---
created: 2026-11-28
title: Add optional floating feedback button
area: frontend
tags: [voter, contestant, frontend, app-shared, ui, feat]
keywords: [feedback, floating-button, survey, settings, fab]
source: "GitHub issue #603"
github_issues: [603]
files:
  - packages/app-shared/src/settings/dynamicSettings.type.ts
  - apps/frontend/src/lib/dynamic-components/feedback/
  - apps/frontend/src/lib/dynamic-components/survey/
  - apps/frontend/src/lib/layouts/
---

# Add optional floating feedback button

## Origin

Converted from GitHub issue [#603 feat: floating feedback button](https://github.com/openvaa/voting-advice-application/issues/603) on 2026-11-28.

## Problem

Voters and contestants can open the feedback form only from the header icon (`DynamicSettings.header.showFeedback`) or a timed results popup. Some deployments want a more visible, persistent entry point: a floating button (icon or text, e.g. a side tab 'Feedback') shown on every page. Issue #603 also asked whether the survey link (`DynamicSettings.survey`) should be offered the same way. Low priority.

## Solution

Add a setting (e.g. `feedback.showFloatingButton` or a new `survey.showIn` / feedback placement option) and a fixed-position button in the voter and contestant layouts that opens the existing feedback modal; consider the same for the survey link. Mind WCAG (focus order, not covering content on mobile) and the drawer/modal host.
