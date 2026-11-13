---
created: 2026-10-06T19:00:27.000Z
title: Refresh the session after a claim, before the first read or write (obligation to Phase 174)
area: Contestant app / auth
severity: major
source: Phase 173 (173-CONTEXT.md obligation O-5; measured by 173-02, name map item 13; filed by 173-13)
owner: Phase 174
files:
  - apps/supabase/supabase/tests/database/36-entity-identity.test.sql
  - apps/supabase/supabase/schema/300-auth-tables.sql
  - apps/frontend/src/routes/contestant/(protected)/+layout.server.ts
  - apps/frontend/src/routes/contestant/(protected)/+page.server.ts
  - apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts
---

## Problem

The access token carries the user's grants, and row-level security reads the token. `get_user_entities` and `get_entity_user_data` find the caller's entities from the `grants` table, but read the entity rows under the caller's row-level security. A grant written after the token was issued is therefore served in full only once the token refreshes. Phase 173 has no flow that writes a grant for a signed-in user; Phase 174's claim is the first.

## The three cases, pinned in `36-entity-identity.test.sql`

1. **The entity is not publicly visible** (unconfirmed, or the project is closed): it is neither listed nor readable until the refresh. At the app root the user sees the entities the old token serves, or the "nothing to edit" view; the claimed entity's URL redirects to the root.
2. **The entity is publicly visible** (confirmed, nominated, open project): it is listed and readable at once, because every authenticated caller may read it, and **every write is refused**: an `UPDATE` affects no row, `upsert_answers` raises `Entity not found or access denied`, an upload is refused. The user reaches the editor and the first save fails.
3. **A grant was removed** while the token still carries it: the entity stops being listed at once.

In every case the list and the one-entity read agree, so the root and the entity-level load do not loop (name map item 45).

## What Phase 174 does

- Refresh the session (`supabase.auth.refreshSession()` on the request's own client, so the new cookies are set on the response) immediately after the claim writes the grant and before the redirect to the app root or the entity.
- Treat a claim on a candidate that already has an editor as a refusal: the insert fails on `idx_grants_one_candidate_editor`.
- Add an E2E case that saves an answer on the claimed entity in the same session, on a confirmed entity: case 2 is the one a missing refresh turns into a failed save rather than a missing card.
- Do not change either database function without re-running file 36: the root's redirect and the entity-level load's redirect rely on their agreement.
