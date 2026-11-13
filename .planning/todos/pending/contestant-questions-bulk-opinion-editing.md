---
created: 2026-10-25T00:00:00.000Z
title: Edit all opinion answers at once in the contestant questions view
area: Contestant app
severity: minor
milestone: v2.18 (the milestone after v2.17 Full Deployment)
source: Operator request during Phase 179 UAT, 2026-10-25
files:
  - apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/(nominated)/questions
---

## The request

Enable editing of all opinions en masse in the `contestant/questions` view: the contestant changes the
answers to many opinion questions in one view, instead of opening each question on its own page.

## Scope

Planned for the milestone after the infrastructure milestone (v2.17, workstream `deployment`). Not part of
Phase 179 or its review-fix phases.
