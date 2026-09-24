---
created: "2026-09-18T09:00:00.000Z"
title: Document the Supabase API limits a deployment must set (max rows, anon statement timeout)
area: apps/docs (deployment guide), apps/supabase
severity: high
source: operator instruction 2026-09-18, following spike 026 findings F1/F2 (.planning/spikes/GRANT-MODEL-READ-COST-REPORT.md)
files:
  - apps/supabase/supabase/config.toml
  - apps/supabase/supabase/schema/001-role-settings.sql
  - apps/docs/src/routes/(content)/developers-guide/deployment/+page.md
  - render.example.yaml
related_phase: 162.1
---

# Document the Supabase API limits a hosted deployment must set

**When the documentation is rebuilt, the deployment guide must tell an operator to set two Supabase backend
values.** Both were changed locally on 2026-09-18, and **neither change reaches a hosted project on its own
the way code does.**

## 1. PostgREST max rows: set to at least 50000

- **Local:** `apps/supabase/supabase/config.toml` `[api] max_rows = 50000` (was 1000).
- **Hosted:** `config.toml` does **not** configure a Supabase Cloud project. The operator sets it in the
  dashboard: *Project Settings → Data API → Max rows* (default **1000**; the page has been called "API settings" in older dashboards).
- **Why it matters:** the frontend adapter reads each collection in one request. With the default 1000, any
  constituency over ~1000 nominations, and every whole-project read over 1000 rows, is **silently truncated**
  with HTTP 200 (spike 026 F1: 1000 of 1510 in a Helsinki-sized constituency). If adapter auto-pagination
  lands (spike 030), a low cap stops losing data but makes large reads much slower (39 pages × ~3 s at 1000),
  so the setting still matters.

## 2. anon statement_timeout: 8s

- **Everywhere:** `apps/supabase/supabase/schema/001-role-settings.sql` runs `ALTER ROLE anon SET
  statement_timeout = '8s'` (Supabase's default is 3 s) and ships in the single migration.
- **Caveat for hosted projects:** it takes effect only where that migration is applied. A project set up
  another way, or one whose role settings are later reset, keeps 3 s. Verify on a live project:
  `select rolname, rolconfig from pg_roles where rolname in ('anon','authenticated');` should show
  `statement_timeout=8s` for both.
- **Why it matters:** at municipal scale the anonymous whole-project nominations read costs ~3.2–3.5 s and
  failed with HTTP 500 `57014` at 3 s (spike 026 F2).

## Done when

- The deployment guide (`developers-guide/deployment`) has a "Supabase project settings" section naming both
  values, where to set them, and the verification query above.
- `render.example.yaml` or its surrounding docs point to that section.
