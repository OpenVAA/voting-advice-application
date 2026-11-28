---
created: 2026-11-16T08:30:00.000Z
title: Cache the frontend's static folder at the CloudFront edge
area: infra
severity: minor
files:
  - infra/modules/frontend-service/edge.tf:93-113
  - apps/frontend/static/
  - infra/envs/staging/aws/README.md (Step 7 item 6, the edge-cache observation)
---

## Problem

The distribution caches only `/_app/immutable/*` (CachingOptimized; the origin sends
`public,max-age=31536000,immutable`, observed as a `Hit` on staging on 2026-11-13). Everything else
falls to the default behaviour, CachingDisabled, which is right for pages, form posts, `/api/*` and
`/_app/version.json`, but also sends every request for the files of `apps/frontend/static/` to the
ECS task: `fonts/` (Inter woff2 + `inter.css`, ~140 KB), `icons/`, `images/` (~2.1 MB) and
`favicon.png`. Their names carry no content hash, so they cannot be marked immutable.

Raised by the operator on 2026-11-16 while checking that static JS chunks are not refetched.

## Solution

TBD. Points to settle:

- Add ordered cache behaviours for the static paths (`/fonts/*`, `/icons/*`, `/images/*`,
  `/favicon.png`), GET/HEAD only, compressed, with a cache policy of a moderate TTL (e.g. a day), or
  CachingOptimized plus a `Cache-Control: public, max-age=<n>` the server sets for those paths
  (adapter-node's static handler; check what it sends today for non-immutable files).
- A change to one of these files then shows up only after the TTL, or after an invalidation by the
  pipeline's deploy; decide which, and whether the deploy role needs `cloudfront:CreateInvalidation`
  (it would need a Step-9-style bootstrap change and simulator case).
- Alternatively hash the file names (move them into the Vite asset graph) so they land under
  `/_app/immutable/` and need no new behaviour; weigh against templates that reference them by path.
- Extend the staging runbook's Step 7 item 6 with a `Hit` check for one static file, and the
  module's offline tests with the new behaviours.
- CloudFront allows 25 cache behaviours per distribution by default; four more is well inside it.
