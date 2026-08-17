# Phase 20: Database Skill - Context

**Gathered:** 2026-03-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Create the domain-expert Claude Code skill for the Supabase backend — covering schema conventions, RLS/auth patterns, service patterns, and pgTAP testing. Replace the SKILL.md placeholder with actionable conventions, review checklist, and create supporting reference files (schema-reference.md, rls-policy-map.md). Also create extension-patterns.md with guides for adding tables, RLS policies, and pgTAP tests. No code changes to the Supabase backend itself.

</domain>

<decisions>
## Implementation Decisions

### SKILL.md density and structure
- ~300 lines with all 4 domains inline (schema, RLS/auth, services, pgTAP)
- Schema + RLS get deeper treatment; services + pgTAP get lighter coverage
- Dedicated review checklist section (not per-domain), matching data/matching skill pattern
- Description field: refine after content is written to match actual emphasis (don't preserve stub as-is)

### Reference file organization
- 2 reference files: schema-reference.md and rls-policy-map.md
- schema-reference.md: complete column listing for every table, plus triggers, indexes, and COLUMN_MAP/PROPERTY_MAP bridge explanation
- rls-policy-map.md: role-capability matrix format — what each role (anon, candidate, party, admin, super_admin) can do on each table

### Extension pattern scope
- 3 standalone guides in a single extension-patterns.md file: adding a new table, adding RLS policies, adding pgTAP tests
- Each guide is independent (can be followed on its own); the "adding a table" guide cross-references the other two for follow-up
- Numbered steps with exact file paths, consistent with data/matching pattern

### Cross-skill boundaries
- JSONB localization: inline the storage format convention (`{"en": "...", "fi": "..."}`), cross-reference data skill for TypeScript LocalizedValue type
- Localized views (elections_localized, questions_localized) removed from schema — client-side locale selection per v2.0 decision. get_localized() retained only for email helpers
- COLUMN_MAP/PROPERTY_MAP type bridge: documented in database skill (packages/supabase-types/ is database skill's territory per BOUNDARIES.md)
- Entity types: document entity_type enum and FK relationships only, cross-reference data skill for full entity hierarchy and semantics

### Claude's Discretion
- Exact line allocation per domain within the ~300 line target
- Ordering of conventions within SKILL.md
- Exact structure and grouping within schema-reference.md
- Level of detail for each review checklist item

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Database codebase
- `apps/supabase/supabase/schema/000-functions.sql` — Enums, utility functions (get_localized, validate_answer_value, validate_nomination)
- `apps/supabase/supabase/schema/001-tenancy.sql` through `017-email-helpers.sql` — Full schema definition (18 files)
- `apps/supabase/supabase/tests/database/` — 10 pgTAP test files, 204 tests
- `apps/supabase/supabase/functions/` — 3 Edge Functions (invite-candidate, signicat-callback, send-email)
- `apps/supabase/supabase/config.toml` — Supabase project configuration including auth hooks
- `packages/supabase-types/src/` — Generated Database types, COLUMN_MAP, PROPERTY_MAP

### Established skill patterns
- `.claude/skills/data/SKILL.md` — Reference pattern for SKILL.md structure (conventions, review checklist, cross-package interfaces)
- `.claude/skills/data/extension-patterns.md` — Reference pattern for numbered-step extension guides
- `.claude/skills/matching/SKILL.md` — Reference for math-heavy skill with review checklist
- `.claude/skills/BOUNDARIES.md` — Skill ownership boundaries

### Architecture decisions
- `.planning/phases/11-load-testing/11-DECISION.md` § Locale Strategy — Client-side locale selection decision (localized views removed)
- `.planning/research/ARCHITECTURE.md` — Skill architecture patterns, progressive disclosure model
- `.planning/research/FEATURES.md` — Skill feature requirements, description best practices

### Phase research
- `.planning/phases/20-database-skill/20-RESEARCH.md` — Comprehensive research on schema, RLS, services, pgTAP patterns

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `.claude/skills/database/SKILL.md` — Existing stub with description and frontmatter from Phase 16. Description to be refined after content written; frontmatter structure preserved.
- `.claude/skills/data/SKILL.md` — Template for conventions format (numbered imperative rules with sub-bullets), review checklist, cross-package interfaces section
- `.claude/skills/data/extension-patterns.md` — Template for extension guide structure (numbered steps with exact file paths)

### Established Patterns
- SKILL.md body targets vary: ~130-180 lines for data/matching, ~300 lines for database (4 domains)
- Conventions use numbered items with sub-bullets for readability
- Extension guides use numbered steps with exact relative file paths from package root
- Review checklist as dedicated section, not integrated into domain sections

### Integration Points
- Database skill triggers on `apps/supabase/` and `packages/supabase-types/` file changes (glob in SKILL.md frontmatter)
- Cross-references data skill for LocalizedValue type and entity hierarchy
- BOUNDARIES.md already maps directories and concepts to database skill ownership

</code_context>

<specifics>
## Specific Ideas

- Add a TODO for a test or type assertion that ensures DB enums (entity_type, question_type, category_type) stay in sync with the data package's TypeScript equivalents — drift between DB and TS enums is a real risk
- The localized views cleanup (done during context gathering) should be reflected in the skill content — document that get_localized() is email-only, not for API responses
- Automated checks for keeping skill contents up-to-date (see Deferred Ideas)

</specifics>

<deferred>
## Deferred Ideas

- Automated checks for keeping skill contents up-to-date when the underlying codebase changes — could be a git hook, CI check, or separate phase
- Edge Function extension guide — skipped for initial version, could be added if demand arises

</deferred>

---

*Phase: 20-database-skill*
*Context gathered: 2026-03-16*
