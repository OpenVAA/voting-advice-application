---
created: "2026-03-28T09:38:22.149Z"
title: Generalize candidate app to a party app as well
area: ui
files: []
---

## Problem

The candidate app (`apps/frontend/src/routes/candidate/`) is currently designed exclusively for individual candidates. Parties/organizations also need a similar interface to manage their profile, answer questions, and preview their representation in voter results. The existing candidate app architecture (contexts, routes, components) should be generalized to support both candidate and party/organization entities.

## Solution

TBD — Potential approaches:
- Refactor candidate routes and contexts to be entity-type agnostic (candidate vs organization)
- Share common components (question answering, profile editing, preview) with entity-type-specific configuration
- Extend CandidateContext (or create a parallel PartyContext) that uses the same data patterns
- Consider route structure: `/candidate/` and `/party/` as separate route groups sharing components, or a unified `/app/` route with entity type switching

## Resolution

**Closed 2026-10-09** at the close of Phase 175 (plan 175-13; context decision D-03), which was the last of three phases that did it.

- **What was done.** The app at `/contestant` serves candidates and organizations. Phase 171 gave it its settings (`contestantApp.entityTypes`, the registration modes, the app's name by type); Phase 173 put every entity page under `/contestant/<entityType>/<entityId>`, with the selection screen and the writer and store serving both types; Phase 175 made the profile, the questions pages and the preview serve an organization: its name and short name by locale, its logo and colour, the questions addressed to organizations, and a preview that presents it as a party.
- **The approach taken**, of those this todo lists: entity-type-agnostic routes and contexts, with one descriptor per entity type (`entityDescriptorOf` in `apps/frontend/src/lib/contestant/utils/entityDescriptor.ts`) for everything that differs. One route tree and one context; no parallel party app.
- **Evidence.** The E2E project `perm-organization-editing` (`tests/tests/specs/perm/perm-organization-editing.spec.ts`), 46 tests: an organization's editor signs in and lands on its pages, edits and saves the profile, answers the questions addressed to organizations, previews the party, and a voter reads every saved value. Green in the phase's closing full run `175-13-final` (268 passed in 110 projects, head `4c930217c`) and three times in isolation. The database's part is pgTAP files 19, 23, 40 and 41 (the estate: 41 files, 1888 assertions).
- **Not part of this todo and still open:** an organization registering itself (Phase 179), the nominations view and the task state (Phases 176 and 177), and `2026-03-28-investigate-migrating-candidate-answer-store.md`, which D-03 left untouched.
