---
title: Conformance probe has no check of the storage buckets' policies
priority: medium
source: Phase 184 verification (2026-11-12); deployment workstream deferred-items.md (operator deferred it 2026-11-11)
---

`infra/scripts/probe-hosted.mjs` checks that each bucket is served (`storage.buckets`) but no check reads the
`storage.objects` policies the migration creates. In 184-19 the probe passed all 22 checks after a bucket fault's
revert while the seven `private-assets` policies were missing; only the drift check saw it. (That the dashboard's
bucket delete dropped them is UNCONFIRMED.) Add a `storage.policies` catalog check comparing the served policy
names per bucket with the migration's, with a fault step that removes one, and an offline unit test. Details:
`.planning/workstreams/deployment/phases/184-hosted-supabase-measurement-and-conformance-probe/deferred-items.md`.
