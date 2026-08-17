# Phase 16: Scaffolding and CLAUDE.md Refactoring - Research

**Researched:** 2026-03-15
**Domain:** Claude Code skills directory scaffolding, CLAUDE.md refactoring, skill boundary documentation
**Confidence:** HIGH

## Summary

Phase 16 is a documentation-only phase that creates the skill directory structure, refactors CLAUDE.md from ~315 lines to ~150-200 lines, and defines skill boundaries. No skill content is written -- only SKILL.md stubs with frontmatter and placeholder bodies. The primary technical domain is Claude Code's skills system (SKILL.md format, frontmatter fields, directory layout) and the editorial work of identifying which CLAUDE.md content is cross-cutting (stays) vs domain-specific (moves to skills in later phases).

The official Claude Code documentation at code.claude.com/docs/en/skills confirms: skills live in `.claude/skills/<name>/SKILL.md`, support YAML frontmatter with `name` and `description` fields, and are auto-discovered at session start. Only name+description load into context initially (2% of context window budget, ~16K chars fallback). Full SKILL.md body loads on-demand when Claude determines relevance. The official best practices page confirms: "CLAUDE.md is loaded every session, so only include things that apply broadly. For domain knowledge or workflows that are only relevant sometimes, use skills instead."

**Primary recommendation:** Create 6 skill directory stubs with well-crafted descriptions containing natural trigger phrases, refactor CLAUDE.md by removing domain-specific content (data model philosophy, matching paradigm, backend customization, frontend data flow details) while keeping cross-cutting infrastructure (dev commands, monorepo overview, dependency flow, Docker, troubleshooting), and create a BOUNDARIES.md that maps directories and concept domains to skill owners.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- CLAUDE.md trimming strategy: Keep cross-cutting content only (dev commands, monorepo structure overview, dependency flow, troubleshooting). Docker/deployment stay but trimmed. Frontend section condensed to ~10 lines (routing + path aliases). Keep universal implementation notes (no secrets, WCAG, strict TS, code review checklist). Move domain-specific notes (MISSING_VALUE, subdimensions, localization patterns) to respective skills. Move all package-specific architecture patterns to skills.
- Skill directory scaffolding: Create 6 skill directories (data, matching, filters, database for v5.0 scope + architect, components as deferred). No LLM skill stub. Each gets SKILL.md with frontmatter and placeholder body. No references/ subdirectories yet. Descriptions must contain specific trigger phrases.
- Boundary document design: Lives at `.claude/skills/BOUNDARIES.md`. Maps directories AND concept domains to owners. Explicitly lists gray zones with designated primary owner. Granularity: directory-level + concept-level.
- Dual-backend handling: Drop Strapi documentation entirely from skills. CLAUDE.md gets ~3 line legacy note. Database skill owns Supabase + Postgres patterns. Docker orchestration stays in CLAUDE.md.

### Claude's Discretion
- Exact line count of trimmed CLAUDE.md (target 150-200)
- Ordering of sections within trimmed CLAUDE.md
- Exact wording of skill description frontmatter (must contain natural trigger phrases)
- Format and structure of BOUNDARIES.md table/sections

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SCAF-01 | Skill directory structure created at `.claude/skills/` with subdirectories per skill | Official docs confirm `.claude/skills/<name>/SKILL.md` format. Frontmatter fields documented. 6 directories to create (data, matching, filters, database, architect, components). |
| SCAF-02 | CLAUDE.md refactored to move domain-specific content into skills (target ~150 lines) | Line-by-line analysis identifies ~130 lines of domain-specific content to remove (lines 113-150 Key Architectural Patterns, lines 199-226 Backend section, portions of Frontend section, domain-specific Implementation Notes). Cross-cutting content (~170 lines) stays. |
| SCAF-03 | Skill boundary definitions documented (which skill owns which files/concepts) | Boundary map covers 6 skills with directory ownership, concept domains, and gray zone resolution. BOUNDARIES.md format and structure researched. |
</phase_requirements>

## Standard Stack

### Core
| Technology | Version | Purpose | Why Standard |
|------------|---------|---------|--------------|
| SKILL.md (YAML + Markdown) | Agent Skills Spec 1.0 | Skill definition files | Required format per Claude Code docs; YAML frontmatter + Markdown body |
| Claude Code Skills API | Current (2026) | Runtime discovery, loading, progressive disclosure | Built into Claude Code; handles auto-invocation from descriptions |

### Supporting
| Technology | Version | Purpose | When to Use |
|------------|---------|---------|-------------|
| `${CLAUDE_SKILL_DIR}` | Built-in | Portable path reference to skill directory | When referencing bundled files from SKILL.md |

No npm packages, build tools, or runtime dependencies needed. Skills are plain Markdown files.

## Architecture Patterns

### Recommended Directory Structure
```
.claude/
  settings.json          # Existing (unchanged)
  skills/
    BOUNDARIES.md        # NEW: skill ownership map
    data/
      SKILL.md           # Stub with frontmatter + placeholder
    matching/
      SKILL.md           # Stub with frontmatter + placeholder
    filters/
      SKILL.md           # Stub with frontmatter + placeholder
    database/
      SKILL.md           # Stub with frontmatter + placeholder
    architect/
      SKILL.md           # Stub (deferred content)
    components/
      SKILL.md           # Stub (deferred content)
```

### Pattern 1: SKILL.md Stub with Frontmatter

**What:** Each stub has proper YAML frontmatter (name, description) and a placeholder body indicating which phase will populate it.

**When to use:** All 6 skills in this phase.

**Source:** Official Claude Code docs at code.claude.com/docs/en/skills

**Key constraints from official docs:**
- `name`: Lowercase letters, numbers, hyphens only. Max 64 characters. Becomes `/slash-command`.
- `description`: Recommended. Max 1024 characters. Claude uses this for auto-invocation. Third person voice.
- SKILL.md body: Keep under 500 lines. Detailed reference material goes in separate files.
- No `references/` subdirectories needed in stubs (created when content phases populate them).

**Example:**
```yaml
---
name: data
description: "Domain expert for the @openvaa/data package -- the universal data model for Voting Advice Applications. Understands the DataRoot/DataObject hierarchy, entity variants (Candidate, Organization, Alliance, Faction), question types and their matching interfaces, nomination system, smart defaults, and MISSING_VALUE conventions. Activate when working in packages/data/, extending data models, adding entity or question types, reviewing data package changes, or understanding how VAA data objects connect to matching and filters."
---

# @openvaa/data Package Expert

> Content will be added in Phase 17 (Data Skill).
> This stub exists to establish the skill directory structure and description triggers.

## Placeholder

This skill will cover:
- DataRoot/DataObject hierarchy and object model
- Entity and question type systems
- Extension patterns for new types
- Coding conventions (internal.ts barrel, smart defaults, type guards)
- Review checklist for data package changes
```

### Pattern 2: CLAUDE.md Section-by-Section Trimming Analysis

**What:** Systematic identification of which CLAUDE.md sections stay (cross-cutting) vs move (domain-specific).

**When to use:** The CLAUDE.md refactoring task.

**Current CLAUDE.md analysis (315 lines):**

| Section | Lines | Verdict | Reasoning |
|---------|-------|---------|-----------|
| Header + Overview | 1-7 | **KEEP** (trim) | Cross-cutting project overview. Update to mention Supabase. |
| Development Commands | 8-67 | **KEEP** | Build/test/lint commands are cross-cutting. Cannot be inferred from code. |
| Architecture > Monorepo Structure | 69-96 | **KEEP** (trim) | Overview of workspaces is cross-cutting. Remove per-package descriptions. |
| Architecture > Module Resolution | 98-110 | **KEEP** | Dependency flow + how to add interdependencies. Cross-cutting. |
| Key Architectural Patterns > Data Model | 113-119 | **MOVE to data skill** | Domain-specific data model conventions. |
| Key Architectural Patterns > Matching | 121-129 | **MOVE to matching skill** | Domain-specific matching paradigm. |
| Key Architectural Patterns > Instance Checks | 130-131 | **MOVE to data/matching skills** | Domain-specific pitfall. |
| Key Architectural Patterns > Frontend Data Flow | 133-139 | **MOVE to architect skill** | Frontend internals. Keep routing-only summary. |
| Key Architectural Patterns > Backend Customization | 140-146 | **REPLACE** | Strapi-specific. Replace with 3-line Strapi legacy note. |
| Key Architectural Patterns > Settings | 148-150 | **KEEP** (condense) | Cross-cutting. Condense to 2 lines. |
| Docker Development | 152-168 | **KEEP** (trim) | Cross-cutting infrastructure. Trim mock data details. |
| Frontend (SvelteKit) | 169-197 | **TRIM to ~10 lines** | Keep routing + path aliases only. Drop directory listings, build details. |
| Backend (Strapi) | 199-226 | **REPLACE** | Replace entire section with 3-line legacy note. |
| Common Workflows | 228-273 | **KEEP** (trim) | Cross-cutting. Remove matching debug subsection (domain-specific). |
| Important Implementation Notes | 275-282 | **SPLIT** | Keep universal rules (secrets, WCAG, TS, code review). Move domain notes (MISSING_VALUE, subdimensions, localization) to skills. |
| Deployment | 284-293 | **KEEP** (condense) | Cross-cutting. Condense to 3 lines. |
| Troubleshooting | 295-305 | **KEEP** | Cross-cutting. Essential for every session. |
| Roadmap | 307-311 | **KEEP** (update) | Cross-cutting. Update to current milestone state. |
| Code Review | 313-315 | **KEEP** | Cross-cutting reference. |

**Estimated result:** ~155-175 lines after trimming. Within the 150-200 target.

### Pattern 3: Boundary Document Structure

**What:** BOUNDARIES.md maps file paths and concept domains to exactly one skill owner, with explicit gray zone resolution.

**When to use:** Creating the boundary document.

**Example structure:**
```markdown
# Skill Boundaries

## Directory Ownership

| Directory | Primary Skill | Notes |
|-----------|--------------|-------|
| packages/data/ | data | All source, tests, types |
| packages/matching/ | matching | All source, tests, types |
| packages/filters/ | filters | All source, tests, types |
| packages/core/ | data | Primary owner; matching and filters reference core interfaces |
| apps/supabase/ | database | Schema, migrations, RLS, Edge Functions, tests |
| packages/supabase-types/ | database | Generated types + COLUMN_MAP/PROPERTY_MAP |
| frontend/ | architect | Deferred; architect covers routing, contexts, API layer |
| frontend/src/lib/components/ | components | Deferred; component library patterns |
| backend/vaa-strapi/ | (none - legacy) | Being sunset; see CLAUDE.md legacy note |

## Concept Domains

| Concept | Primary Skill | Also Referenced By |
|---------|--------------|-------------------|
| MISSING_VALUE | data | matching (how it handles missing) |
| DataRoot hierarchy | data | -- |
| MatchingAlgorithm | matching | -- |
| Distance metrics | matching | -- |
| SubMatch / subdimensions | matching | data (question normalizedDimensions) |
| Filter types | filters | -- |
| FilterGroup | filters | -- |
| RLS policies | database | -- |
| pgTAP tests | database | -- |
| Entity variants | data | filters (filtered entities), matching (matched entities) |
| Question types | data | matching (MatchableQuestion interface) |

## Gray Zones

| Area | Contenders | Primary Owner | Resolution |
|------|-----------|---------------|------------|
| @openvaa/core interfaces | data, matching, filters | data | Core defines interfaces consumed by all; data owns because it implements them |
| MatchableQuestion interface | data, matching | data | Implemented by question classes in data; matching consumes it |
| Entity filtering by answers | data, filters | filters | Filters use data entities but own the filtering logic |
| Frontend contexts | architect, components | architect | Contexts are architecture; components consume them |
```

### Anti-Patterns to Avoid

- **Creating references/ subdirectories in stubs:** Per context decisions, no references/ dirs until content phases need them.
- **Writing actual skill content:** Phase 16 creates stubs only. Content is Phases 17-20.
- **Leaving domain-specific content in CLAUDE.md:** The whole point of the refactoring is to move this out.
- **Vague skill descriptions:** "Helps with data" will never trigger correctly. Must include specific package names, file paths, concept terms, and action phrases.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Skill file format | Custom YAML/MD format | Standard SKILL.md with YAML frontmatter | Agent Skills spec 1.0; Claude Code parses this natively |
| Skill validation | Custom linter | `skills-ref validate` (optional) | Standard tooling exists |
| Auto-discovery logic | Custom trigger system | Claude Code's description-based discovery | Built-in; 2% context budget for descriptions |
| Skill directory structure | Nested per-package skills | Flat `.claude/skills/` at repo root | Universal availability; root-level means all skills available regardless of working directory |

## Common Pitfalls

### Pitfall 1: Description Too Vague for Auto-Discovery
**What goes wrong:** Descriptions like "data package help" or "matching knowledge" don't contain enough trigger phrases. Claude fails to load the skill when working on relevant code.
**Why it happens:** Authors write concise descriptions that miss how developers naturally phrase tasks.
**How to avoid:** Include package names (`@openvaa/data`), directory paths (`packages/data/`), concept nouns (DataRoot, entity variants, question types), and action verbs (extending, reviewing, adding, debugging).
**Warning signs:** Asking "what skills are available?" shows vague descriptions; skill doesn't activate when editing files in its domain.

### Pitfall 2: CLAUDE.md Not Actually Trimmed
**What goes wrong:** Domain-specific content is left in CLAUDE.md "for now" because it seems useful. When skills are later created with the same content, duplication wastes context and may create contradictions.
**Why it happens:** Fear of losing information. The data model philosophy and matching paradigm sections feel important.
**How to avoid:** Content moves to skills, not deletes. The information is preserved -- just relocated. Add a brief pointer in CLAUDE.md: "Domain-specific patterns in `.claude/skills/`" to reassure.
**Warning signs:** CLAUDE.md stays above 200 lines after "refactoring."

### Pitfall 3: Overlapping Skill Boundaries
**What goes wrong:** Two skills both claim ownership of the same concept (e.g., both data and matching claim `MISSING_VALUE`). When both activate, Claude gets conflicting guidance.
**Why it happens:** Concepts genuinely span packages. `MISSING_VALUE` is defined in core, used in data objects, and handled by matching algorithms.
**How to avoid:** BOUNDARIES.md designates a single primary owner. Cross-references use identical language. Primary owner explains the concept; secondary references summarize in 2-3 lines and point to the primary.
**Warning signs:** Two skill descriptions mention the same concept without clear ownership hierarchy.

### Pitfall 4: Strapi Content Leaking Into Skills
**What goes wrong:** Database skill or CLAUDE.md retains Strapi-specific patterns that are being sunset.
**Why it happens:** The codebase currently has both Strapi and Supabase. Strapi is still in use for the frontend adapter.
**How to avoid:** Per context decision: drop Strapi documentation from skills entirely. Database skill is Supabase-only. CLAUDE.md gets a ~3-line legacy note pointing to the Strapi README.
**Warning signs:** Skills reference `@openvaa/strapi`, `backend/vaa-strapi/`, or Strapi-specific patterns.

### Pitfall 5: Database Skill Scope Too Narrow
**What goes wrong:** Database skill is scoped to `apps/supabase/` only, missing `packages/supabase-types/` and the broader Postgres/RLS/pgTAP domain.
**Why it happens:** Directory-based thinking rather than domain-based.
**How to avoid:** Per context decision: database skill owns Supabase + Postgres-specific patterns (schema conventions, pgTAP, RLS), not just the `apps/supabase/` directory. Include `packages/supabase-types/` in its ownership.
**Warning signs:** BOUNDARIES.md doesn't list `packages/supabase-types/` under the database skill.

## Code Examples

### SKILL.md Frontmatter Format
```yaml
# Source: code.claude.com/docs/en/skills (verified 2026-03-15)
---
name: data
description: "Domain expert for the @openvaa/data package..."
---

# Skill content here (Markdown)
```

### Trimmed CLAUDE.md Structure (Target)
```markdown
# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.
Domain-specific package knowledge is in `.claude/skills/`.

## Overview

OpenVAA is a framework for building Voting Advice Applications (VAAs).
Monorepo with SvelteKit frontend, Supabase backend, and shared packages
for matching algorithms, filters, and data management.

> Legacy Strapi backend at backend/vaa-strapi/. Being sunset after
> frontend adapter migration (v3.0). See its README for details.

## Development Commands
[~45 lines: setup, building, testing, linting, workspace commands -- unchanged]

## Architecture
[~25 lines: monorepo structure as brief list, module resolution, dependency flow]

## Settings
[~2 lines: StaticSettings vs DynamicSettings one-liner]

## Docker Development
[~12 lines: services list, port conflicts, env vars, mock data basics]

## Frontend (SvelteKit)
[~10 lines: routing structure, path aliases only]

## Common Workflows
[~20 lines: starting features, running tests, translations, module fixes -- no matching debug]

## Implementation Rules
[~6 lines: no secrets, WCAG, strict TS, code review checklist -- universal only]

## Deployment
[~3 lines: containerized, see docs/README.md]

## Troubleshooting
[~10 lines: unchanged]

## Roadmap
[~3 lines: updated to current milestone]

## Code Review
[~2 lines: unchanged reference to checklist]
```

**Estimated total: ~155-170 lines**

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|-----------------|--------------|--------|
| `.claude/commands/` | `.claude/skills/` | 2026 (commands merged into skills) | Skills add frontmatter, supporting files, auto-discovery. Commands still work but skills recommended. |
| Domain knowledge in CLAUDE.md | Domain knowledge in skills | Official best practice | "For domain knowledge that is only relevant sometimes, use skills instead." Reduces context pressure. |
| Manual skill invocation only | Description-based auto-discovery | Claude Code skills system | Description triggers auto-loading; most important field for effectiveness |

**Deprecated/outdated:**
- `.claude/commands/` directory: Still works but merged into skills. Skills are recommended going forward.
- `user-invocable` frontmatter field name was confirmed in current docs (not renamed).

## Open Questions

1. **Exact description wording effectiveness**
   - What we know: Description is "the single most important factor." Must contain trigger phrases, package names, paths, action verbs. Third person voice. Max 1024 chars.
   - What's unclear: Optimal phrasing cannot be validated until skills exist and are tested in real conversations.
   - Recommendation: Write best-effort descriptions in stubs. Refine during content phases (17-20) and testing phase (21).

2. **Whether `disable-model-invocation` should be set for stub skills**
   - What we know: Stub skills have placeholder bodies with no useful content. Auto-loading a placeholder wastes context.
   - What's unclear: Whether Claude is smart enough to recognize a placeholder and not waste tokens.
   - Recommendation: Do NOT set `disable-model-invocation: true` on stubs. Per context decisions, all skills are knowledge skills that should auto-trigger. The placeholder body is small (~10 lines) and the cost of loading it is negligible. Setting the flag now would require remembering to remove it in content phases.

3. **Database skill name: "database" vs "supabase"**
   - What we know: Context decision says "database" skill. The skill owns Supabase + Postgres patterns.
   - What's unclear: Whether "database" or "supabase" triggers better for developers working on this codebase.
   - Recommendation: Use "database" as it is more general and matches the context decision. The description will contain "Supabase" as a trigger word.

## Validation Architecture

> Validation is not applicable for this phase. Phase 16 creates only Markdown files (SKILL.md stubs, refactored CLAUDE.md, BOUNDARIES.md). There is no code to test, no test framework to configure, and no automated validation commands.

### Manual Validation Criteria

| Req ID | Behavior | Validation Method | How to Check |
|--------|----------|-------------------|-------------|
| SCAF-01 | `.claude/skills/` exists with 6 subdirectories, each containing SKILL.md | Manual filesystem check | `ls .claude/skills/*/SKILL.md` returns 6 files |
| SCAF-02 | CLAUDE.md under 200 lines, no domain-specific content | Manual line count + content review | `wc -l CLAUDE.md` and grep for removed patterns |
| SCAF-03 | BOUNDARIES.md exists mapping paths and concepts to skills | Manual document review | File exists at `.claude/skills/BOUNDARIES.md` with directory and concept tables |

### Quick Validation Commands
```bash
# SCAF-01: Verify skill directories
ls -la .claude/skills/*/SKILL.md

# SCAF-02: Verify CLAUDE.md line count
wc -l CLAUDE.md

# SCAF-02: Verify domain content removed
grep -c "Data Model Philosophy\|Matching Algorithm Paradigm\|Backend Customization" CLAUDE.md
# Expected: 0

# SCAF-03: Verify boundaries document
test -f .claude/skills/BOUNDARIES.md && echo "EXISTS" || echo "MISSING"
```

## Sources

### Primary (HIGH confidence)
- [Claude Code Skills Documentation](https://code.claude.com/docs/en/skills) -- Verified 2026-03-15. SKILL.md format, frontmatter fields (name max 64 chars, description max 1024 chars, all optional fields), directory structure, auto-discovery mechanism, progressive disclosure (2% context budget), troubleshooting.
- [Claude Code Best Practices](https://code.claude.com/docs/en/best-practices) -- Verified 2026-03-15. CLAUDE.md guidance: "only include things that apply broadly," "for domain knowledge use skills instead," keep concise, prune regularly. Include/exclude table.
- CLAUDE.md (current file, 315 lines) -- Direct analysis of content to refactor
- `.planning/research/ARCHITECTURE.md` -- Skill architecture decisions, directory layout, 6-skill structure
- `.planning/research/FEATURES.md` -- Per-skill feature analysis, description writing patterns
- `.planning/research/PITFALLS.md` -- 13 pitfalls to avoid during skill creation
- `.planning/research/SUMMARY.md` -- Executive summary of all research findings

### Secondary (MEDIUM confidence)
- `.planning/research/STACK.md` -- Stack analysis, frontmatter field reference, subagent integration patterns

### Tertiary (LOW confidence)
- None. All findings verified against official docs.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- Official Claude Code docs verified 2026-03-15
- Architecture: HIGH -- Directory structure confirmed by official docs; trimming analysis based on direct CLAUDE.md reading
- Pitfalls: HIGH -- Drawn from official docs warnings and prior project research
- Skill descriptions: MEDIUM -- Wording effectiveness cannot be validated until runtime

**Research date:** 2026-03-15
**Valid until:** 2026-04-15 (stable -- Markdown file operations)
