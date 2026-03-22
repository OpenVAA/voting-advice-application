---
plan: 39-01
status: complete
started: 2026-03-22
completed: 2026-03-22
---

# Plan 39-01: Update GitHub Actions CI Workflow — Summary

## Result

CI workflow updated to Supabase-only architecture with 5 jobs (was 3).

## What Changed

| Job | Change |
|-----|--------|
| skill-drift-check | NEW — audits skill freshness against target directories |
| frontend-and-shared-module-validation | No changes (already correct) |
| supabase-tests | NEW — runs pgTAP tests conditionally when apps/supabase/** changes |
| e2e-tests | UPDATED — Docker Compose replaced with supabase CLI + vite dev |
| e2e-visual-perf | UPDATED — Docker Compose replaced with supabase CLI + vite dev |

## Key Files

### Created
- `.claude/scripts/audit-skill-drift.sh` — Skill drift detection script

### Modified
- `.github/workflows/main.yaml` — CI workflow (5 jobs, Supabase CLI, Node 22.22.1, Yarn 4.13)

## Deviations

None — implemented as planned.
