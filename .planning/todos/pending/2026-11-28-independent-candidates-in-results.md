---
created: 2026-11-28
title: Show independent candidates gracefully in voter results
area: frontend
tags: [voter, frontend, matching, ui, feat]
keywords: [independent-candidates, no-party, results, organizations-tab, nominations]
source: "GitHub issue #818"
github_issues: [818]
files:
  - packages/data/src/objects/election/nominationShape.ts
  - apps/frontend/src/routes/(voters)/(located)/results/
  - apps/frontend/src/lib/dynamic-components/entityCard/EntityCard.svelte
  - apps/frontend/src/lib/contexts/voter/matchState.svelte.ts
  - packages/app-shared/src/settings/dynamicSettings.type.ts
---

# Show independent candidates gracefully in voter results

## Origin

Converted from GitHub issue [#818 feat: independent candidates](https://github.com/openvaa/voting-advice-application/issues/818) on 2026-11-28.

## Problem

Candidates can be nominated without an organization (`NOMINATION_SHAPE.OrganizationListAndIndependents` in `packages/data/src/objects/election/nominationShape.ts`). The voter UI has no explicit handling for them: entity cards, details and filters assume a party, and the organizations tab of the results lists only organization nominations, so independents are invisible there.

## Solution

Audit candidate cards/details/filters for the no-parent case (no empty party tag, sensible filter value such as 'Independent'). Optionally (behind a setting) list independents in the organizations tab as pseudo-entries showing the candidate's own match, without computing a party match for them. Add seed data with an independent to the E2E templates and cover it.
