---
title: Results URL refactor follow-ups (shorter IDs, multi-election/constituency, upstream voter routes)
priority: medium
created: 2026-04-24
context: Carried forward from Phase 62 (Results Page Consolidation) discuss-phase on 2026-04-24. Phase 62 ships the path-based /results/[electionId]/[[entityTypePlural]]/[[entityTypeSingular]]/[[id]] shape for the results subtree only. Three related items are explicitly deferred to keep Phase 62 focused.
---

# Results URL refactor follow-ups

Phase 62 migrated the voter `/results/` subtree to a path-based route shape with typed param matchers:

```
/results/[electionId]/[[entityTypePlural]]/[[entityTypeSingular]]/[[id]]
```

Three related items were explicitly flagged as out of Phase 62 scope and carried forward here.

## 1. Shorter IDs in URLs

Current IDs (election, candidate, organisation) are UUIDs or similarly long identifiers. Resulting URLs:

```
/results/a3bf4c1e-0d5a-4f2b-9e8c-1234567890ab/candidates/candidate/abc123de-...
```

**Problem:** Long, unshareable, no human signal, easy to truncate on copy-paste.

**Direction to explore:**
- Slug-style IDs (e.g., `elec-2026-national` instead of UUID) — requires a slug-generation step at data-provider level plus a reverse lookup.
- Short-hash IDs (e.g., base62-encoded int; 6-8 chars) — compact but opaque.
- Hybrid: election gets a slug, entities keep short-hash — mixed readability.

**Open questions:**
- Where does the ID ↔ slug mapping live? (data-provider cache, edge function, separate lookup table)
- Stability guarantees — if a candidate's name changes, does the slug change? (implies route redirects)
- Collision handling across elections.
- Migration for existing (potentially bookmarked) UUID URLs.

## 2. Multi-election / multi-constituency selection handling

Current voter-flow data model assumes a voter has **one active (election, constituency)** at a time. The Phase 62 URL carries only `electionId`; constituency is resolved from voter session for the list view, or inferable from the candidate's nomination for the drawer view.

**Scenarios not handled:**
- Voter participates in multiple elections simultaneously (e.g., local + national held on overlapping dates).
- Voter crosses constituency boundaries (e.g., moved recently; eligible in both).
- Voter browsing results across constituencies they're not eligible to vote in (exploratory / educational mode).

**Direction to explore:**
- Extended URL schema that carries `constituencyId` explicitly — maybe `/results/[electionId]/[constituencyId]/[[entityTypePlural]]/...`.
- Product decision: is multi-election simultaneous selection supported, or do we lock to one at a time?
- UX: if a voter is in 2 elections, do we present a top-level election picker distinct from the in-results election selector?

## 3. Extend URL-based election/constituency carrying to upstream voter routes

Phase 62 migrated only `/results/`. Other voter routes stay session-based for election/constituency resolution:

- `/questions` — voter question flow; currently resolves election + constituency from voter session
- `/questions/category` — category picker; same
- `/questions/[questionId]` — per-question page; same
- `/elections` — election selector; entry point to establishing the session
- `/candidates` (if exists) — similar

**Problem:** Deeplinks to `/questions/category` opened in a new window will lose the election + constituency context, mirroring the /results problem that Phase 62 fixed.

**Direction to explore:**
- Apply the same `[electionId]` path prefix to the full voter flow:
  ```
  /[electionId]/questions/category
  /[electionId]/results/[[entityTypePlural]]/[[entityTypeSingular]]/[[id]]
  ```
- Or maintain separate subtrees and only fix specific high-deeplink-value routes.
- Product decision: which voter URLs are expected to be shareable? (probably /results/* and individual /questions/[qid]; maybe /questions/category)
- Interaction with Phase 61 (QUESTION-03 category selection + QUESTION-04 candidate-questions testIds) — schedule to avoid double-migrating routes.

## 4. Address by nominationId, not entityId — drop id from search params

Surfaced during Phase 64 manual smoke (2026-04-28). The current results
drawer route is `/results/[entityTypePlural]/[entityTypeSingular]/[id]`
where `[id]` is the entity id, with `nominationId` carried as a search
param (`results/+layout.svelte:169`
`page.url.searchParams.get('nominationId')`). Two problems with this:

- **Wrong identifier semantics.** A candidate is one entity but can have
  multiple nominations (different elections / constituencies). The URL is
  trying to address a nomination but uses the entity id, then disambiguates
  with a side-channel search param. Addressing the nomination directly is
  the correct primary key for "this candidate-in-this-race".
- **Search-param drift.** Carrying `nominationId` (and the URL also
  carries `electionId` + `constituencyId`) means deeplinks have a tail of
  query string that the path already implies. Bookmarks and shares grow
  noisier than necessary.

**Direction to explore:**
- Switch to `/results/[entType]/[nominationId]` as the primary detail
  route. Server- or load-resolve nominationId → (entityId, electionId,
  constituencyId) so the rest of the page wiring keeps working.
- Drop `nominationId` from search params entirely. Audit
  `electionId` / `constituencyId` for the same — once the nomination
  pins the (election, constituency, entity) tuple, those query params
  are redundant for the drawer route.
- Coordinate with the cross-type edge case
  (`results/organizations/candidate/[id]` — see `results/+layout.svelte`
  routing comment at line 10) so the `[entType]` segment correctly
  identifies what the path-id refers to.
- Migration plan for any inbound bookmarks on the legacy entity-id +
  query-param shape (likely just a redirect resolver in the route's
  `+page.ts`).

**Open questions:**
- Where does the `[entType]` segment refer — the nomination's
  entity type or the originating list's plural? The current cross-type
  shape lets organizations link to candidate detail; the new shape needs
  to preserve that.
- Single nomination id is enough only when nominations are uniquely
  keyed app-wide. Confirm.
- Interaction with item 1 (shorter IDs) — apply the same shortening
  scheme to nomination ids.

## Related

- `.planning/todos/pending/session-storage-election-constituency.md` — partially addressed by Phase 62 (election now in URL for /results); broader session-storage question carries forward here.
- `.planning/todos/pending/frontend-project-id-scoping.md` — architecture multi-tenant prep; may interact with URL ID shortening if IDs become project-scoped.

## Acceptance

Success for the full follow-up (whether shipped as one milestone or split):

- URLs for every shareable voter route carry the necessary context (election, constituency if applicable) so new-window deeplinks work without session.
- IDs in URLs are short enough to share verbally / via SMS / in print materials.
- Multi-election/constituency selection is either explicitly supported in the UX or explicitly restricted with a clear product rationale.
