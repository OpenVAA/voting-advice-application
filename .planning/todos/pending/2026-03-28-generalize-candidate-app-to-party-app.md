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
