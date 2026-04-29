---
title: Move electionId and constituencyId from search params to session storage
priority: high
source: Results page discussion (2026-03-23)
---

Remove `electionId` and `constituencyId` from URL search params in the voter app. Hold them in session storage instead. Currently these params clutter the URL and complicate routing (especially with the entity detail drawer approach). Session storage is the right home since these selections are per-session state, not shareable via URL.

**Files likely involved:**
- `apps/frontend/src/routes/(voters)/(located)/+layout.ts` — currently reads params from URL
- `apps/frontend/src/lib/utils/route/` — route building and param parsing
- Voter context — election/constituency selection state

---

## Resolution

**Closed 2026-04-29 — merged into `results-url-refactor-followups.md` item 5.**

v2.6 Phase 62 took the opposite direction from this todo's original proposal: rather than moving `electionId` + `constituencyId` *out* of URL params *into* session storage, the results subtree was migrated to a path-based shape (`/results/[electionId]/...`) precisely so deeplinks survive new-window navigation. The unresolved tension — what does "share a link" mean for results vs nominations — was relocated to `results-url-refactor-followups.md` item 5 where the URL strategy questions live.
