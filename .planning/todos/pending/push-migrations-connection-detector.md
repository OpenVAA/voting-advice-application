---
title: push-migrations.sh always reports push_connection=unknown with Supabase CLI 2.118.0
priority: low
source: Phase 184 verification (2026-11-12); deployment workstream deferred-items.md
---

`infra/scripts/push-migrations.sh` greps the dry run's output for `Resolved DNS` (direct) and `Using connection
pooler` (pooler), and CLI 2.118.0 prints neither, so every push in phase 184 (throwaway and staging) reported
`push_connection=unknown`. No gate reads the line, so nothing failed, but which connection path the CLI took is
UNCONFIRMED. Fix the detector against the current CLI's debug output (or drop the line), and add a test of the
three outcomes. Details: `.planning/workstreams/deployment/phases/184-hosted-supabase-measurement-and-conformance-probe/deferred-items.md`.
