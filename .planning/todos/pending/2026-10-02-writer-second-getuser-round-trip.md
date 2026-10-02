---
created: 2026-10-02
title: The protected candidate layout makes a second, unmemoised getUser() round trip through SupabaseDataWriter._getBasicUserData
area: frontend
severity: follow-up
source: Phase 167 (origin/main vestige cleanup), 167-CONTEXT D-01 fact 3, filed per D-02
files:
  - apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts (`protected async _getBasicUserData`)
  - apps/frontend/src/routes/candidate/(protected)/+layout.server.ts (`locals.safeGetSession()`, then `dataWriter.getCandidateUserData`)
---

## Problem

The protected candidate layout load first calls `locals.safeGetSession()`, which verifies the
request's access token with one `getUser()` round trip and memoises the result for the request. It
then calls `dataWriter.getCandidateUserData({ loadNominations: true })`. That path reaches
`SupabaseDataWriter._getBasicUserData`, which calls `this.supabase.auth.getUser()` and then
`this.supabase.auth.getSession()` on its own, outside the memo. A single protected candidate request
therefore makes at least two `getUser()` round trips to Supabase Auth for the same token.

The second call is correct (it verifies before it reads the grant claim), only redundant: the
identity it re-verifies is the one `safeGetSession` has already verified for this request.

## Why it was not fixed in Phase 167

167-CONTEXT D-02: making `_getBasicUserData` reuse the identity `locals.safeGetSession` verified is an
auth-path change across the adapter boundary, and the adapter-selection todo is redesigning that
boundary. Phase 167 kept every auth path unchanged; it only pinned `safeGetSession`'s own round trips
(`apps/frontend/src/lib/supabase/safeGetSession.test.ts`, commit `096896f47`).

## What a fix needs

- Reuse the identity `safeGetSession` verified (for example by passing it into the writer, or by the
  writer reading the request's memo) instead of a second `getUser()`; never fall back to an
  unverified `getSession()` read.
- Its own negative controls: a variant that reads the grant claim from an unverified session must
  fail a test.
- A request-level test that pins the number of `getUser` calls per protected candidate request. No
  such test exists today, so nothing pins the current count of 2.
- An E2E walk of the candidate app (login, protected pages, logout) under the cardinal rule.

## Related

- `2026-09-27-adapter-selection-entrypoints.md`: the adapter-boundary redesign this change belongs
  with.
