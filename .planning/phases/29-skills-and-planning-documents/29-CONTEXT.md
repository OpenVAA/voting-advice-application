# Phase 29: Skills and Planning Documents - Context

**Gathered:** 2026-03-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Integrate Claude Skills and merge planning artifacts from the parallel branch (feat-gsd-supabase-migration) into this branch. Purely additive content — no application code changes. Skills cover data, matching, filters, and database domains. Planning documents include Key Decisions, deferred items, RETROSPECTIVE.md, and milestone archives.

</domain>

<decisions>
## Implementation Decisions

### Skills integration (SKIL-01)
- **D-01:** Copy all 15 skills files from parallel branch `.claude/skills/` to this branch
- **D-02:** Quick-fix glaring errors in the 4 in-scope skills (data, matching, filters, database): update `frontend/` path references to `apps/frontend/`, fix any Svelte 4 pattern references that no longer apply
- **D-03:** Architect and components skills are copied as-is without path fixes — they're deferred (SKILL-A, SKILL-C) and will be rewritten when those skills are actually developed
- **D-04:** BOUNDARIES.md copied as-is (domain-level guidance, not path-dependent)

### Code review checklist (SKIL-02)
- **D-05:** Add Supabase-era checklist items: RLS policy patterns, pgTAP test conventions, adapter mixin patterns, Edge Function conventions
- **D-06:** Remove all Strapi-specific items (there are none currently, but any Strapi assumptions in existing items should be neutralized)
- **D-07:** Keep existing items that are technology-agnostic (OWASP, accessibility, code style, documentation)

### Key Decisions merge (PLAN-01)
- **D-08:** Append all 15 parallel branch decisions to the Key Decisions table in PROJECT.md
- **D-09:** Decisions retain their original milestone tags (v2.0, v3.0, v5.0) — these refer to the parallel branch milestones, not this branch's v2.0

### Deferred items consolidation (PLAN-02)
- **D-10:** Merge deferred items from both branches into the Future requirements section of PROJECT.md
- **D-11:** Deduplicate entries that appear on both branches (e.g., architect/components skills)

### RETROSPECTIVE.md merge (PLAN-03)
- **D-12:** Merge parallel branch retrospective entries (v2.0 Supabase, v3.0 Frontend Adapter, v1.0 E2E) into this branch's RETROSPECTIVE.md
- **D-13:** This branch's existing entries (v1.0-v1.4) remain untouched; parallel branch entries are appended in a clearly labeled section

### Milestone archive numbering (PLAN-04)
- **D-14:** Parallel branch milestones renamed with `sb-` prefix to avoid collision: `sb-v2.0`, `sb-v3.0`, `sb-v5.0` (sb = supabase-branch)
- **D-15:** Archive files copied as: `sb-v2.0-ROADMAP.md`, `sb-v2.0-REQUIREMENTS.md`, etc.
- **D-16:** The v5.0-phases subdirectory from parallel branch copied as `sb-v5.0-phases/`
- **D-17:** Parallel branch's v1.0-ROADMAP.md is NOT copied — this branch already has v1.0 archives and they diverged; the parallel branch v1.0 E2E retrospective entry is captured via PLAN-03

### Claude's Discretion
- Exact ordering of merged retrospective entries (chronological vs by-branch)
- Wording of new code review checklist items
- Whether to add a "Source branch" annotation to merged Key Decisions
- File organization within `.claude/skills/` (preserve parallel branch structure)

</decisions>

<specifics>
## Specific Ideas

- Skills should have "quick fixes" only — fix wrong paths and framework references, not deep rewrites
- Code review checklist: add Supabase items, remove Strapi items, keep everything technology-agnostic as-is
- Milestone archives use `sb-` prefix to distinguish parallel branch history from this branch's history

</specifics>

<canonical_refs>
## Canonical References

### Skills source (parallel branch)
- `git show feat-gsd-supabase-migration:.claude/skills/BOUNDARIES.md` — Skills scope and boundaries
- `git show feat-gsd-supabase-migration:.claude/skills/data/SKILL.md` — Data package skill
- `git show feat-gsd-supabase-migration:.claude/skills/database/SKILL.md` — Database skill with schema reference
- `git show feat-gsd-supabase-migration:.claude/skills/matching/SKILL.md` — Matching algorithm skill
- `git show feat-gsd-supabase-migration:.claude/skills/filters/SKILL.md` — Filters skill

### Planning sources (parallel branch)
- `git show feat-gsd-supabase-migration:.planning/PROJECT.md` — Key Decisions table (15 entries) and Future requirements
- `git show feat-gsd-supabase-migration:.planning/RETROSPECTIVE.md` — 3 milestone retrospectives + cross-milestone trends
- `git show feat-gsd-supabase-migration:.planning/milestones/` — Archive files (v1.0, v2.0, v3.0, v5.0)

### Current branch targets
- `.planning/PROJECT.md` — Key Decisions table to merge into, Future requirements to consolidate
- `.planning/RETROSPECTIVE.md` — Retrospective entries to merge into
- `.planning/milestones/` — Archive directory for renamed parallel branch milestones
- `.agents/code-review-checklist.md` — Checklist to update (20 items currently)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- No application code changes in this phase — all assets are documentation/skills files

### Established Patterns
- `.planning/milestones/` uses `{version}-{TYPE}.md` naming (e.g., `v1.0-ROADMAP.md`)
- `.agents/code-review-checklist.md` uses checkbox format with external reference links
- RETROSPECTIVE.md uses per-milestone sections with What Was Built / What Worked / What Was Inefficient / Patterns Established / Key Lessons structure

### Integration Points
- Skills files will be read by Claude Code during development sessions
- Code review checklist is referenced from CLAUDE.md
- Key Decisions table informs future phase planning
- Milestone archives are historical reference only

</code_context>

<deferred>
## Deferred Ideas

- Deep rewrite of architect/components skills for Svelte 5 — deferred to SKILL-A/SKILL-C milestones
- Skills drift CI check (mentioned in parallel branch decisions as pending) — not in scope for this phase
- Updating skills after each subsequent v2.0 phase changes the codebase — skills will naturally evolve

</deferred>

---

*Phase: 29-skills-and-planning-documents*
*Context gathered: 2026-03-22*
