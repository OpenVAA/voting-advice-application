---
title: Pass DENO_CERT and DENO_TLS_CA_STORE through turbo's strict env mode
priority: medium
source: Phase 191 plan 06 deferred items (2026-11-24), nuorten-2027 workstream
---

`yarn lint:check` fails at `@openvaa/supabase#typecheck` on proxied hosts: turbo's strict env mode strips `DENO_CERT` and `DENO_TLS_CA_STORE`, so `deno check` can't verify the proxy certificate when fetching from the npm registry. Add both to `globalPassThroughEnv` in the root `turbo.json`; pass-through variables don't change cache keys. Done when `yarn lint:check` exits 0 on the cloud host without `TURBO_ENV_MODE=loose`. Details: `.planning/workstreams/nuorten-2027/phases/191-instance-overlay-upstream/deferred-items.md` § 2.
