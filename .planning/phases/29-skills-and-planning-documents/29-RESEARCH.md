# Phase 29: Skills and Planning Documents — Research

**Completed:** 2026-03-22
**Researcher:** Claude (opus)

## Research Question

What do I need to know to PLAN this phase well? This phase integrates Claude Skills files and planning documents from the parallel branch (feat-gsd-supabase-migration) into this branch (feat-gsd-roadmap). Purely additive — no application code changes.

## Source Inventory

### Skills Files (15 files total on parallel branch)

**Top-level:**
- `.claude/skills/BOUNDARIES.md` — Domain ownership map (directories, concepts, gray zones)

**Data skill (3 files):**
- `.claude/skills/data/SKILL.md` — DataRoot hierarchy, conventions (10 items), reviewing checklist (8 items), key locations, cross-package interfaces
- `.claude/skills/data/extension-patterns.md` — Step-by-step guides for adding entity/question types
- `.claude/skills/data/object-model.md` — Class diagrams and DataRoot collection types

**Database skill (4 files):**
- `.claude/skills/database/SKILL.md` — 17-table schema, 9 conventions, RLS patterns (8 items), service patterns (5 items), pgTAP conventions (7 items), reviewing checklist (12 items)
- `.claude/skills/database/extension-patterns.md` — Guides for adding tables, RLS, pgTAP tests
- `.claude/skills/database/rls-policy-map.md` — Role-capability matrix
- `.claude/skills/database/schema-reference.md` — Complete table column listings

**Matching skill (3 files):**
- `.claude/skills/matching/SKILL.md` — MatchingAlgorithm, distance metrics, conventions (8 items), mathematical nuances, reviewing checklist (8 items)
- `.claude/skills/matching/algorithm-reference.md` — Distance metric internals, MatchingSpace mechanics
- `.claude/skills/matching/extension-patterns.md` — Guides for adding metrics, question types, projectors

**Filters skill (2 files):**
- `.claude/skills/filters/SKILL.md` — Filter hierarchy, conventions (8 items), reviewing checklist (6 items)
- `.claude/skills/filters/extension-patterns.md` — Guides for adding filter types

**Deferred stubs (2 files):**
- `.claude/skills/architect/SKILL.md` — Stub with trigger description only
- `.claude/skills/components/SKILL.md` — Stub with trigger description only

### Path Fix Analysis

**In-scope skills (data, matching, filters, database):** Zero `frontend/` or `backend/` path references. No path fixes needed for the 4 active skills or their support files (extension-patterns.md, object-model.md, algorithm-reference.md, schema-reference.md, rls-policy-map.md).

**BOUNDARIES.md:** Contains 4 `frontend/` references (lines 15-18) and 1 `backend/vaa-strapi/` reference (line 21). Per CONTEXT.md D-04, copied as-is — domain-level guidance, not path-dependent for the in-scope skills.

**Deferred stubs (architect, components):** No path references in stub content. The `description` field in architect mentions "Monorepo structure" and components mentions "Svelte 4 component conventions". Per CONTEXT.md D-03, copied as-is without fixes.

**Svelte 4 references:** Only in BOUNDARIES.md concept domain table: "Svelte 4 component conventions" (line 58). Part of the components skill domain (deferred). No Svelte 4 references in the 4 in-scope skills.

**Conclusion:** The "quick-fix" scope from D-02 turns out to require zero path fixes — the in-scope skills already use correct paths (`packages/data/`, `packages/matching/`, `packages/filters/`, `apps/supabase/`). The plans should note this finding but still verify during execution.

### Planning Documents (Parallel Branch)

**PROJECT.md Key Decisions table:** 15 entries to merge:
1. JSONB answer storage over relational (v2.0)
2. JSONB localization with get_localized() (v2.0)
3. Custom Access Token Hook for JWT roles (v2.0)
4. 79 per-operation RLS policies (v2.0)
5. Remove question_templates table (v2.0)
6. external_id for bulk import/export (v2.0)
7. Edge Functions for auth flows (v2.0)
8. Test IDs over text selectors (v1.0) — **NOTE: already in this branch's table**
9. Inline skills over subagent skills (v5.0)
10. Defer architect/components/LLM skills (v5.0)
11. Skill drift CI check (v5.0) — Pending status
12. Supabase adapter mixin pattern (v3.0)
13. Cookie-based sessions over JWT tokens (v3.0)
14. Keep jose and qs packages (v3.0)
15. Docker Compose as production test tool (v3.0)

**Deduplication note:** "Test IDs over text selectors" appears on BOTH branches. This branch's copy has rationale "More resilient to content/i18n changes, 53+ testIds across voter/candidate" with outcome "Good". The parallel branch has "More resilient to content/i18n changes" with "Good (v1.0)". Only 14 new entries need adding.

**Future requirements to merge from parallel branch PROJECT.md Out of Scope:**
- Admin app UI — deferred to separate milestone (matches ADMIN-01/02/03 already in REQUIREMENTS.md)
- WithAuth interface refactoring — revisit in v4.0 Svelte 5 (matches WAUTH-01)
- GraphQL via pg_graphql — no current frontend need (already in this branch's REQUIREMENTS.md Out of Scope)
- Supabase Realtime — no current use case (already in this branch's REQUIREMENTS.md Out of Scope)
- Schema-per-tenant isolation — already in this branch's REQUIREMENTS.md Out of Scope

**Deferred items from parallel branch not yet in this branch's Future requirements:**
- Skill drift CI check (pending from v5.0)
- Merge app_settings and app_customization tables (SETT-01 — already in REQUIREMENTS.md)

### RETROSPECTIVE.md

**This branch has:** v1.0, v1.1, v1.2, v1.3, v1.4 (5 entries) + Cross-Milestone Trends

**Parallel branch has:** v2.0 Supabase, v3.0 Frontend Adapter, v1.0 E2E (3 entries) + Cross-Milestone Trends

**Overlap:** Both branches have v1.0 entries, but they're different:
- This branch: "v1.0 — E2E Testing Framework" (Shipped 2026-03-12, 147 commits, 31 plans)
- Parallel branch: "v1.0 — E2E Testing Framework" (Shipped 2026-03-22, 7 phases, 31 plans)
- Content differs significantly (different shipping dates, different lessons, different "What Worked" items)
- This branch's v1.0 is the canonical one (more detailed, shipped earlier on this branch)

**Merge strategy:** Append parallel branch's v2.0 and v3.0 entries. Do NOT append v1.0 from parallel branch — it's a duplicate with divergent data. Add the parallel branch's Cross-Milestone Trends as a note.

### Milestone Archives

**This branch has:** v1.0, v1.1, v1.2, v1.3, v1.4 archives in `.planning/milestones/`

**Parallel branch has:**
- `v1.0-ROADMAP.md` — NOT copied (D-17: this branch already has v1.0, they diverged)
- `v2.0-MILESTONE-AUDIT.md`, `v2.0-REQUIREMENTS.md`, `v2.0-ROADMAP.md` — renamed to `sb-v2.0-*`
- `v3.0-REQUIREMENTS.md`, `v3.0-ROADMAP.md` — renamed to `sb-v3.0-*`
- `v5.0-REQUIREMENTS.md`, `v5.0-ROADMAP.md` — renamed to `sb-v5.0-*`
- `v5.0-phases/` directory (6 subdirectories, ~51 files) — renamed to `sb-v5.0-phases/`

**File count:** 7 top-level milestone files + 51 phase files = 58 files to copy with `sb-` prefix renaming

### Code Review Checklist

**Current state:** 16 checklist items, all technology-agnostic. No Strapi-specific items.

**Items to add (from CONTEXT.md D-05):**
- RLS policy patterns (when modifying database schema)
- pgTAP test conventions (when modifying database functions/triggers)
- Adapter mixin patterns (when modifying Supabase adapters)
- Edge Function conventions (when modifying Edge Functions)

**Items to neutralize (D-06):** No Strapi-specific items found — the checklist is already technology-agnostic.

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Key Decisions deduplication missed | Low | Low | Grep both tables before merge, skip exact duplicates |
| Retrospective v1.0 conflict | Medium | Low | Skip parallel branch v1.0, keep this branch's version |
| Milestone archive naming collision | Low | Medium | `sb-` prefix per D-14 prevents all collisions |
| Skills path references outdated | Already mitigated | N/A | Research confirmed zero path fixes needed for in-scope skills |
| BOUNDARIES.md outdated paths | Known | Low | Copied as-is per D-04; paths will be fixed when architect/components skills are developed |

## Validation Architecture

### Dimension 1: Skills File Presence
- All 15 files from parallel branch exist in `.claude/skills/`
- Directory structure matches: BOUNDARIES.md + 6 subdirectories

### Dimension 2: Skills Content Integrity
- In-scope skills (data, matching, filters, database) have zero `frontend/` path references
- YAML frontmatter `targets` fields point to valid directories on this branch
- Cross-references between skills (e.g., "the data skill documents...") are consistent

### Dimension 3: Code Review Checklist
- Supabase-era items present (RLS, pgTAP, adapter mixin, Edge Function)
- No Strapi-specific items
- Technology-agnostic items preserved unchanged

### Dimension 4: Key Decisions Merge
- 14 new entries appended (not 15 — "Test IDs over text selectors" deduplicated)
- Original milestone tags preserved (v2.0, v3.0, v5.0)
- Table format consistent with existing entries

### Dimension 5: Deferred Items Consolidation
- All parallel branch deferred items present in Future requirements
- No duplicates between branches
- Existing items from this branch unchanged

### Dimension 6: RETROSPECTIVE.md Merge
- v2.0 and v3.0 entries from parallel branch appended
- This branch's v1.0-v1.4 entries untouched
- Clear section label for parallel branch entries

### Dimension 7: Milestone Archives
- Files renamed with `sb-` prefix
- v1.0-ROADMAP.md NOT copied
- `sb-v5.0-phases/` directory structure preserved

## RESEARCH COMPLETE

Research identified all source material, deduplication requirements, and validation dimensions. Ready for planning.
