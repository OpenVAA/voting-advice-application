---
created: "2026-03-28T09:38:22.149Z"
title: Investigate migrating candidate answer store to something more robust
area: ui
files:
  - apps/frontend/src/lib/contexts/candidate/candidateUserDataStore.ts
  - apps/frontend/src/lib/contexts/candidate/candidateUserDataStore.svelte.ts
---

## Problem

The current candidate answer store (`candidateUserDataStore`) manages candidate answers in a client-side store pattern that may not be robust enough for production use. Potential concerns include data persistence reliability, conflict resolution when multiple sessions edit answers, and the overall architecture of how candidate answers flow between client and server.

## Solution

TBD — Investigate:
- Current pain points with the answer store (data loss scenarios, race conditions, stale state)
- Whether answers should be persisted more aggressively to the backend (optimistic updates with server reconciliation)
- Alternative state management approaches (server-first with local cache, form-based submission, real-time sync)
- How the store interacts with Supabase writes and whether the adapter layer handles conflicts gracefully
