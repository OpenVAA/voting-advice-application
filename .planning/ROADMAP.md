# Roadmap: OpenVAA Framework Evolution

## Milestones

- ✅ **v1.0 E2E Testing Framework** — Phases 1-7 (partially shipped)
- ✅ **v2.0 Supabase Migration** — Phases 8-15 (shipped 2026-03-15)
- 🚧 **v5.0 Claude Skills** — Phases 16-21 (in progress)

## Phases

<details>
<summary>✅ v1.0 E2E Testing Framework (Phases 1-7)</summary>

- [x] Phase 1: Infrastructure Foundation (10/11 plans)
- [ ] Phase 2: Candidate App Coverage (0/4 plans)
- [ ] Phase 3: Voter App Core Journey (3/4 plans)
- [x] Phase 4: Voter App Settings and Edge Cases (5/5 plans) — 2026-03-09
- [x] Phase 5: Configuration Variants (3/3 plans) — 2026-03-09
- [ ] Phase 6: CI Integration and Test Organization (0/2 plans)
- [ ] Phase 7: Advanced Test Capabilities (1/2 plans)

</details>

<details>
<summary>✅ v2.0 Supabase Migration (Phases 8-15) — SHIPPED 2026-03-15</summary>

- [x] Phase 8: Infrastructure Setup (3/3 plans) — 2026-03-12
- [x] Phase 9: Schema and Data Model (3/3 plans) — 2026-03-13
- [x] Phase 10: Authentication and Roles (5/5 plans) — 2026-03-13
- [x] Phase 11: Load Testing (2/2 plans) — 2026-03-14
- [x] Phase 12: Services (3/3 plans) — 2026-03-14
- [x] Phase 13: Quality Assurance (3/3 plans) — 2026-03-15
- [x] Phase 14: Service & Auth Bug Fixes (1/1 plan) — 2026-03-15
- [x] Phase 15: QuestionTemplate & Verification Closure (manual) — 2026-03-15

</details>

### v5.0 Claude Skills (In Progress)

**Milestone Goal:** Build domain-expert Claude Code skills that deeply understand and assist with each major area of the OpenVAA framework.

- [x] **Phase 16: Scaffolding and CLAUDE.md Refactoring** - Establish skill directory structure, define boundaries, trim CLAUDE.md (completed 2026-03-15)
- [x] **Phase 17: Data Skill** - Domain-expert skill for @openvaa/data package (completed 2026-03-16)
- [ ] **Phase 18: Matching Skill** - Domain-expert skill for @openvaa/matching package
- [ ] **Phase 19: Filters Skill** - Domain-expert skill for @openvaa/filters package
- [ ] **Phase 20: Database Skill** - Domain-expert skill for Supabase backend
- [ ] **Phase 21: Quality and Validation** - Cross-cutting testing and deduplication audit

## Phase Details

### Phase 16: Scaffolding and CLAUDE.md Refactoring
**Goal**: Developers have a clean skill directory structure and a lean CLAUDE.md that delegates domain knowledge to skills
**Depends on**: Nothing (first phase of v5.0)
**Requirements**: SCAF-01, SCAF-02, SCAF-03
**Success Criteria** (what must be TRUE):
  1. `.claude/skills/` directory exists with subdirectories for each planned skill (data, matching, filters, database)
  2. CLAUDE.md is under 200 lines with domain-specific content moved out and replaced by references to skills
  3. A boundary document exists that maps every file path and concept domain to exactly one skill owner
  4. No domain-specific conventions (data model patterns, matching algorithm details, filter system internals, schema details) remain in CLAUDE.md
**Plans**: 2 plans

Plans:
- [ ] 16-01-PLAN.md — Create skill directories with SKILL.md stubs and boundary document
- [ ] 16-02-PLAN.md — Refactor CLAUDE.md to remove domain-specific content

### Phase 17: Data Skill
**Goal**: Claude automatically loads deep @openvaa/data expertise when developers work on the data package
**Depends on**: Phase 16
**Requirements**: DATA-01, DATA-02, DATA-03, DATA-04, DATA-05
**Success Criteria** (what must be TRUE):
  1. A SKILL.md exists with a description that triggers automatically when Claude detects work in `packages/data/`
  2. Data model conventions are documented as actionable rules (DataRoot hierarchy, smart defaults, MISSING_VALUE usage, internal.ts barrel pattern)
  3. Extension patterns exist that guide Claude through adding new entity types and question types step-by-step
  4. A review checklist exists that Claude applies when reviewing data package changes (instanceof avoidance, circular dep prevention, barrel exports)
  5. Reference files contain type hierarchy diagrams and relationship maps that Claude can load on demand
**Plans**: 2 plans

Plans:
- [ ] 17-01-PLAN.md — Write SKILL.md with conventions, review checklist, and source locations
- [ ] 17-02-PLAN.md — Create object-model.md and extension-patterns.md reference files

### Phase 18: Matching Skill
**Goal**: Claude automatically loads deep @openvaa/matching expertise when developers work on the matching package
**Depends on**: Phase 16
**Requirements**: MATC-01, MATC-02, MATC-03, MATC-04, MATC-05
**Success Criteria** (what must be TRUE):
  1. A SKILL.md exists with a description that triggers automatically when Claude detects work in `packages/matching/`
  2. Algorithm conventions are documented as actionable rules (distance metrics, normalization to 0-100%, subdimension handling)
  3. Extension patterns exist that guide Claude through adding new matching algorithms or distance metrics
  4. Mathematical nuances are documented (CategoricalQuestion multi-dimensional model, weight compensation, projection to lower dimensions)
  5. Reference files contain matching paradigm diagrams and Match object structure
**Plans**: 2 plans

Plans:
- [ ] 18-01-PLAN.md — Write SKILL.md with conventions, mathematical nuances, and review checklist
- [ ] 18-02-PLAN.md — Create algorithm-reference.md and extension-patterns.md reference files

### Phase 19: Filters Skill
**Goal**: Claude automatically loads deep @openvaa/filters expertise when developers work on the filters package
**Depends on**: Phase 17
**Requirements**: FILT-01, FILT-02, FILT-03, FILT-04
**Success Criteria** (what must be TRUE):
  1. A SKILL.md exists with a description that triggers automatically when Claude detects work in `packages/filters/`
  2. Filter system conventions are documented (3 filter categories, extension pattern, relationship to data model entities)
  3. Extension patterns exist that guide Claude through adding new filter types
  4. A review checklist exists that Claude applies when reviewing filter package changes
**Plans**: TBD

Plans:
- [ ] 19-01: TBD

### Phase 20: Database Skill
**Goal**: Claude automatically loads deep Supabase/database expertise when developers work on the backend
**Depends on**: Phase 16
**Requirements**: DB-01, DB-02, DB-03, DB-04, DB-05, DB-06
**Success Criteria** (what must be TRUE):
  1. A SKILL.md exists with a description that triggers automatically when Claude detects work in `apps/supabase/`
  2. Schema conventions are documented (17 tables, JSONB patterns, enums, localization with get_localized())
  3. RLS and auth patterns are documented (79 policies, 5 role types, JWT claims, Access Token Hook)
  4. Service patterns are documented (bulk import/delete RPCs, Edge Functions, storage buckets)
  5. pgTAP testing conventions are documented (helpers, tenant isolation patterns, test structure)
**Plans**: 2 plans

Plans:
- [ ] 20-01-PLAN.md — Write SKILL.md with schema, RLS, service, and pgTAP conventions
- [ ] 20-02-PLAN.md — Create schema-reference.md and rls-policy-map.md reference files

### Phase 21: Quality and Validation
**Goal**: All skills work correctly together and no content is duplicated between CLAUDE.md and skills
**Depends on**: Phase 17, Phase 18, Phase 19, Phase 20
**Requirements**: QUAL-01, QUAL-02, QUAL-03
**Success Criteria** (what must be TRUE):
  1. Cross-cutting scenarios (e.g., "add a new question type" which touches data + matching + filters) activate the correct combination of skills
  2. Natural developer queries (e.g., "how does matching work?", "add a filter", "write a pgTAP test") trigger the correct skill with high accuracy
  3. Zero content duplication exists between CLAUDE.md and any skill file -- verified by manual audit
**Plans**: TBD

Plans:
- [ ] 21-01: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 16 → 17 → 18 → 19 → 20 → 21
(Phases 17, 18, 20 can execute in parallel after 16; Phase 19 depends on 17; Phase 21 depends on all)

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Infrastructure Foundation | v1.0 | 10/11 | Gap closure | - |
| 2. Candidate App Coverage | v1.0 | 0/4 | Planned | - |
| 3. Voter App Core Journey | v1.0 | 3/4 | In Progress | - |
| 4. Voter App Settings and Edge Cases | v1.0 | 5/5 | Complete | 2026-03-09 |
| 5. Configuration Variants | v1.0 | 3/3 | Complete | 2026-03-09 |
| 6. CI Integration and Test Organization | v1.0 | 0/2 | Not started | - |
| 7. Advanced Test Capabilities | v1.0 | 1/2 | In Progress | - |
| 8. Infrastructure Setup | v2.0 | 3/3 | Complete | 2026-03-12 |
| 9. Schema and Data Model | v2.0 | 3/3 | Complete | 2026-03-13 |
| 10. Authentication and Roles | v2.0 | 5/5 | Complete | 2026-03-13 |
| 11. Load Testing | v2.0 | 2/2 | Complete | 2026-03-14 |
| 12. Services | v2.0 | 3/3 | Complete | 2026-03-14 |
| 13. Quality Assurance | v2.0 | 3/3 | Complete | 2026-03-15 |
| 14. Service & Auth Bug Fixes | v2.0 | 1/1 | Complete | 2026-03-15 |
| 15. QuestionTemplate & Verification Closure | v2.0 | Complete | Complete | 2026-03-15 |
| 16. Scaffolding and CLAUDE.md Refactoring | 2/2 | Complete    | 2026-03-15 | - |
| 17. Data Skill | 2/2 | Complete    | 2026-03-16 | - |
| 18. Matching Skill | v5.0 | 0/2 | Planned | - |
| 19. Filters Skill | v5.0 | 0/TBD | Not started | - |
| 20. Database Skill | v5.0 | 0/2 | Planned | - |
| 21. Quality and Validation | v5.0 | 0/TBD | Not started | - |

---

*Full phase details for v1.0 and v2.0 archived in `.planning/milestones/`*
