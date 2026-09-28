---
phase: 20-database-skill
plan: 01
subsystem: database
tags: [supabase, postgresql, rls, jsonb, pgtap, edge-functions, skill]

# Dependency graph
requires:
  - phase: 16-skill-stubs
    provides: SKILL.md stub with frontmatter and auto-trigger description
  - phase: 17-data-skill
    provides: SKILL.md pattern for conventions format, review checklist, reference file pointers
provides:
  - Complete database SKILL.md with 4 domain sections (schema, RLS/auth, services, pgTAP)
  - 12-item review checklist for database changes
  - Cross-skill interfaces documenting JSONB/LocalizedValue and enum sync boundaries
  - Reference file pointers to schema-reference.md, rls-policy-map.md, extension-patterns.md
affects: [20-02-database-skill-references, frontend-adapter-migration]

# Tech tracking
tech-stack:
  added: []
  patterns: [database-skill-conventions, 4-domain-skill-structure]

key-files:
  created: []
  modified:
    - .claude/skills/database/SKILL.md

key-decisions:
  - "Refined description to mention key numbers (17 tables, 97 RLS policies, 204 pgTAP tests) and trigger paths (apps/supabase/, packages/supabase-types/)"
  - "Schema and RLS sections get deeper treatment (~70 and ~65 lines); services and pgTAP get lighter coverage (~50 and ~40 lines)"

patterns-established:
  - "4-domain SKILL.md structure: schema conventions, RLS/auth patterns, service patterns, pgTAP testing"
  - "Database review checklist: 12 items covering schema, RLS, indexes, triggers, testing, and bulk operations"

requirements-completed: [DB-01, DB-02, DB-03, DB-04, DB-05]

# Metrics
duration: 3min
completed: 2026-03-16
---

# Phase 20 Plan 01: Database Skill SKILL.md Summary

**294-line database skill covering schema conventions (JSONB localization, answer storage, 4 enums, external_id), RLS/auth patterns (5 roles, JWT hook, 5-policy pattern), service patterns (Edge Functions, bulk RPCs, storage), pgTAP testing (two-phase architecture, assertion patterns), and 12-item review checklist**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-16T17:35:00Z
- **Completed:** 2026-03-16T17:38:14Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- Replaced SKILL.md placeholder with complete 294-line body covering all 4 database domains
- Schema conventions section documents common column pattern, JSONB localization with get_localized() 3-tier fallback, answer storage validation, StoredImage structure, 4 enums, external_id system, nominations CHECK constraint, trigger conventions, and indexing strategy
- RLS/auth section documents 5 role types, JWT claims via Access Token Hook, user_roles isolation, 3 helper functions, standard 5-policy pattern, special table policies, scalar subquery optimization, and column-level restrictions
- 12-item review checklist catches real database issues: missing RLS, wrong JSONB format, missing triggers, wrong test patterns

## Task Commits

Each task was committed atomically:

1. **Task 1: Write SKILL.md with schema, RLS, service, and pgTAP conventions** - `735e89253` (feat)

**Plan metadata:** `73ac3e0bf` (docs: complete plan)

## Files Created/Modified
- `.claude/skills/database/SKILL.md` - Complete database skill with 4 domain sections, review checklist, source locations, cross-skill interfaces, and reference file pointers

## Decisions Made
- Refined the YAML frontmatter description to include key numbers (17 tables, 97 RLS policies, 204 pgTAP tests) and trigger paths while preserving the `name: database` field exactly
- Allocated ~70 lines to schema conventions and ~65 lines to RLS/auth (deeper treatment) versus ~50 lines for services and ~40 lines for pgTAP (lighter coverage), per user decision
- Kept all code examples under 5 lines, pointing to source files instead

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- SKILL.md body complete with reference file pointers to schema-reference.md, rls-policy-map.md, and extension-patterns.md
- Plan 02 creates these reference files, completing the database skill

## Self-Check: PASSED

- FOUND: .claude/skills/database/SKILL.md
- FOUND: commit 735e89253
- FOUND: 20-01-SUMMARY.md

---
*Phase: 20-database-skill*
*Completed: 2026-03-16*
