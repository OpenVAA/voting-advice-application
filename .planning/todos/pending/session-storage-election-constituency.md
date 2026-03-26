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
