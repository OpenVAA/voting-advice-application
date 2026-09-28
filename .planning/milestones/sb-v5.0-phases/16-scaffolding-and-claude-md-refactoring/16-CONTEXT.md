# Phase 16: Scaffolding and CLAUDE.md Refactoring - Context

**Gathered:** 2026-03-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Establish the skill directory structure at `.claude/skills/`, create SKILL.md stubs with proper frontmatter and trigger globs for all planned skills, refactor CLAUDE.md from ~315 lines to ~150-200 lines by moving domain-specific content to skills, and create a boundary document mapping file paths and concept domains to skill owners. No skill content is written in this phase — that's Phases 17-20.

</domain>

<decisions>
## Implementation Decisions

### CLAUDE.md trimming strategy
- Keep cross-cutting content only: dev commands, monorepo structure overview, dependency flow, troubleshooting
- Docker/deployment sections stay in CLAUDE.md but trimmed to essentials
- Frontend (SvelteKit) section stays as condensed ~10 lines: routing structure and path aliases only, drop detailed directory listings
- Important Implementation Notes: keep universal rules (no secrets, WCAG, strict TS, code review checklist), move domain-specific notes (MISSING_VALUE, subdimensions, localization patterns) to their respective skills
- Move all package-specific architecture patterns (data model philosophy, matching paradigm, filter system, backend customization) to skills

### Skill directory scaffolding
- Create 6 skill directories: data, matching, filters, database (v5.0 scope) + architect, components (deferred)
- No LLM skill stub — too low priority/experimental
- Each skill gets a SKILL.md with proper frontmatter (name, description, trigger globs) and placeholder body saying "Content will be added in Phase X"
- No references/ subdirectories yet — created when content phases need them
- Descriptions should contain specific trigger phrases matching how developers naturally ask about each domain

### Boundary document design
- Lives at `.claude/skills/BOUNDARIES.md`
- Maps both directories and concept domains to skill owners (e.g., `packages/data/` -> data skill AND `MISSING_VALUE` -> data skill)
- Explicitly lists gray zones where skills overlap (e.g., `@openvaa/core` types) with designated primary owner
- Granularity: directory-level paths + concept-level domain terms

### Dual-backend handling
- Drop Strapi documentation entirely from skills — database skill is Supabase-only
- CLAUDE.md gets a one-liner legacy note (~3 lines): "Legacy Strapi backend at backend/vaa-strapi/. Being sunset after frontend adapter migration (v3.0). See its README for details."
- Database skill owns Supabase + Postgres-specific patterns (schema conventions, pgTAP, RLS) — not just apps/supabase/
- Docker orchestration stays in CLAUDE.md as cross-cutting infrastructure

### Claude's Discretion
- Exact line count of trimmed CLAUDE.md (target 150-200, exact count is flexible)
- Ordering of sections within trimmed CLAUDE.md
- Exact wording of skill description frontmatter (as long as it contains natural trigger phrases)
- Format and structure of BOUNDARIES.md table/sections

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Skill system
- `.planning/research/ARCHITECTURE.md` — Skill architecture decisions, directory layout, progressive disclosure model
- `.planning/research/FEATURES.md` — Skill feature requirements, description writing best practices
- `.planning/research/PITFALLS.md` — 13 pitfalls to avoid (context overload, stale paths, duplication, vague descriptions)
- `.planning/research/SUMMARY.md` — Executive summary of all research findings

### Current state
- `CLAUDE.md` — Current 315-line file to be refactored (the primary work artifact)
- `.agents/code-review-checklist.md` — Referenced by CLAUDE.md, stays as external reference

### Project context
- `.planning/REQUIREMENTS.md` — SCAF-01, SCAF-02, SCAF-03 requirements for this phase
- `.planning/PROJECT.md` — Key decisions section: skills are reference/knowledge type, description is most important factor, SKILL.md lean <500 lines

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- No existing skills or skill directories — clean starting point
- `.claude/settings.json` exists — skill directory will be a sibling

### Established Patterns
- Monorepo uses Yarn 4 workspaces with clear package boundaries
- Each package has its own README.md with package-specific documentation
- `.agents/code-review-checklist.md` is an existing external reference pattern

### Integration Points
- CLAUDE.md is auto-loaded by Claude Code for every conversation — trimming directly reduces context budget usage
- `.claude/skills/` is the standard project-scoped skill location per Claude Code docs
- Skills trigger via glob patterns matching file paths in the working directory

</code_context>

<specifics>
## Specific Ideas

- Research says description field is "the single most important factor for effectiveness" — stubs should have well-crafted descriptions even though body is placeholder
- Each skill description must contain specific trigger phrases matching natural developer queries (e.g., "how does matching work?", "add a new entity type")
- The boundary document should serve dual purpose: helps Claude route to correct skill AND helps human developers understand knowledge organization

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 16-scaffolding-and-claude-md-refactoring*
*Context gathered: 2026-03-15*
