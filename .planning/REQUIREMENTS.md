# Requirements: OpenVAA Claude Skills

**Defined:** 2026-03-15
**Core Value:** A reliable, well-tested VAA framework that developers can confidently extend, customize, and deploy for real elections.

## v5.0 Requirements

Requirements for Claude Code domain-expert skills. Each maps to roadmap phases.

### Scaffolding

- [ ] **SCAF-01**: Skill directory structure created at `.claude/skills/` with subdirectories per skill
- [ ] **SCAF-02**: CLAUDE.md refactored to move domain-specific content into skills (target ~150 lines)
- [ ] **SCAF-03**: Skill boundary definitions documented (which skill owns which files/concepts)

### Data Skill

- [ ] **DATA-01**: SKILL.md with description that auto-triggers on @openvaa/data work
- [ ] **DATA-02**: Data model conventions documented (DataRoot, DataObject hierarchy, smart defaults, MISSING_VALUE)
- [ ] **DATA-03**: Extension patterns for adding new entity types and question types
- [ ] **DATA-04**: Review checklist for data package changes (internal.ts barrel, instanceof avoidance, circular deps)
- [ ] **DATA-05**: Reference files for type hierarchies and relationship diagrams

### Matching Skill

- [ ] **MATC-01**: SKILL.md with description that auto-triggers on @openvaa/matching work
- [ ] **MATC-02**: Algorithm conventions documented (distance metrics, normalization, subdimensions)
- [ ] **MATC-03**: Extension patterns for adding new matching algorithms or distance metrics
- [ ] **MATC-04**: Mathematical nuances documented (CategoricalQuestion multi-dimensional model, weight compensation)
- [ ] **MATC-05**: Reference files for matching paradigm and Match object structure

### Filters Skill

- [ ] **FILT-01**: SKILL.md with description that auto-triggers on @openvaa/filters work
- [ ] **FILT-02**: Filter system conventions documented (3 filter categories, extension pattern)
- [ ] **FILT-03**: Extension patterns for adding new filter types
- [ ] **FILT-04**: Review checklist for filter package changes

### Database Skill

- [ ] **DB-01**: SKILL.md with description that auto-triggers on Supabase/database work
- [ ] **DB-02**: Schema conventions documented (17 tables, JSONB patterns, enums, localization)
- [ ] **DB-03**: RLS and auth patterns documented (79 policies, role types, JWT claims, Access Token Hook)
- [ ] **DB-04**: Service patterns documented (bulk import/delete RPCs, Edge Functions, storage)
- [ ] **DB-05**: pgTAP testing conventions documented (helpers, tenant isolation, test patterns)
- [ ] **DB-06**: Reference files for schema diagram and RLS policy map

### Quality

- [ ] **QUAL-01**: All skills tested with cross-cutting scenarios (multi-skill active)
- [ ] **QUAL-02**: Skill triggering accuracy validated against natural developer queries
- [ ] **QUAL-03**: No CLAUDE.md/skill content duplication

## Future Requirements

### Deferred Skills (post v4.0 Svelte 5 Migration)

- **ARCH-01**: Architect skill — whole app + monorepo knowledge, frontend internals
- **COMP-01**: Components skill — frontend component library patterns
- **LLM-01**: LLM skill — @openvaa/llm package patterns

## Out of Scope

| Feature | Reason |
|---------|--------|
| Architect skill | Needs all other skills first + post-Svelte 5 architecture |
| Components skill | Deferred until Svelte 5 migration completes |
| LLM skill | Deferred — lowest priority package |
| Skill CI validation | Over-engineering for initial version |
| Subagent/forked skills | Research confirms inline skills are correct for domain knowledge |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| SCAF-01 | — | Pending |
| SCAF-02 | — | Pending |
| SCAF-03 | — | Pending |
| DATA-01 | — | Pending |
| DATA-02 | — | Pending |
| DATA-03 | — | Pending |
| DATA-04 | — | Pending |
| DATA-05 | — | Pending |
| MATC-01 | — | Pending |
| MATC-02 | — | Pending |
| MATC-03 | — | Pending |
| MATC-04 | — | Pending |
| MATC-05 | — | Pending |
| FILT-01 | — | Pending |
| FILT-02 | — | Pending |
| FILT-03 | — | Pending |
| FILT-04 | — | Pending |
| DB-01 | — | Pending |
| DB-02 | — | Pending |
| DB-03 | — | Pending |
| DB-04 | — | Pending |
| DB-05 | — | Pending |
| DB-06 | — | Pending |
| QUAL-01 | — | Pending |
| QUAL-02 | — | Pending |
| QUAL-03 | — | Pending |

**Coverage:**
- v5.0 requirements: 26 total
- Mapped to phases: 0
- Unmapped: 26 ⚠️

---
*Requirements defined: 2026-03-15*
*Last updated: 2026-03-15 after initial definition*
