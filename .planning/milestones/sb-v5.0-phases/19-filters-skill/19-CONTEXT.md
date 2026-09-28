# Phase 19: Filters Skill - Context

**Gathered:** 2026-03-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Create the domain-expert Claude Code skill for `@openvaa/filters` — the entity filtering package for Voting Advice Applications. Replace the SKILL.md placeholder with actionable conventions, review checklist, extension patterns, and cross-package interfaces section. Create extension-patterns.md reference file. Rename the local MISSING_VALUE constant to MISSING_FILTER_VALUE to eliminate confusion with @openvaa/core's MISSING_VALUE. No other code changes to the filters package.

</domain>

<decisions>
## Implementation Decisions

### SKILL.md density and structure
- Proportionally shorter than data/matching: target ~80-120 lines (the package is genuinely simpler — no math, single domain)
- Follow established structure: conventions as numbered imperative rules with sub-bullets, review checklist, key source locations, cross-package interfaces section
- Include a brief "Known gaps / planned changes" subsection (3-5 lines) noting the README's planned refactoring items (entityGetter simplification, locale handling)
- Description field: refine after content is written to match actual emphasis (Phase 20 precedent)

### filterType discriminant convention
- Prominent top-level convention: filters uses `filterType` discriminant (FILTER_TYPE const + FilterType union) instead of `instanceof`
- Reason: `instanceof` checks may break with packing/minimizing
- Add a deferred todo to investigate whether `instanceof` can be safely remediated in the future

### MISSING_FILTER_VALUE rename
- Rename the local `MISSING_VALUE` in `src/missingValue/missingValue.ts` to `MISSING_FILTER_VALUE`
- Update all imports across the filters package
- This eliminates the confusing name collision with `@openvaa/core`'s `MISSING_VALUE`
- Skill should document that filters has its own missing value sentinel, separate from core

### Reference file organization
- Single reference file: extension-patterns.md only
- No separate filter-hierarchy.md — the 6 concrete filters and 3 base classes are small enough to document inline in SKILL.md
- This is proportional to the package's complexity (data/matching needed more reference files due to larger domains)

### Cross-skill boundaries
- Follow data/matching pattern: Cross-Package Interfaces section in SKILL.md
- Key facts inline: FilterableQuestion union type, MaybeWrappedEntity pattern, entityGetter/hasAnswers usage
- Cross-reference data skill for full question type details and entity hierarchy
- Document that MISSING_FILTER_VALUE is separate from @openvaa/core's MISSING_VALUE — this is the key gotcha

### Extension pattern scope
- Two extension patterns in extension-patterns.md:
  1. Adding a new filter type (base class + concrete filter)
  2. Adding a question-type filter variant (new XxxQuestionFilter for a new data package question type)
- Question-type variant guide explicitly cross-references data skill's extension-patterns.md ("If also adding a new question type, see data skill first")
- Numbered steps with exact file paths, consistent with data/matching/database pattern

### Claude's Discretion
- Exact line count within the ~80-120 line target
- Ordering of conventions within SKILL.md
- Exact wording of review checklist items
- Level of detail for known gaps subsection

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Filters package
- `packages/filters/README.md` — Package overview, basic usage, To Do section with planned refactoring
- `packages/filters/src/filter/base/filter.ts` — Filter base class, value extraction, rules system, onChange events
- `packages/filters/src/filter/base/filter.type.ts` — FilterOptions, FilterableQuestion union, PropertyFilterOptions, QuestionFilterOptions
- `packages/filters/src/filter/base/filterTypes.ts` — FILTER_TYPE const object, FilterType union, FilterTypeMap
- `packages/filters/src/filter/enumerated/enumeratedFilter.ts` — EnumeratedFilter base (include/exclude rules, parseValues, sortValues)
- `packages/filters/src/filter/number/numberFilter.ts` — NumberFilter base (min/max/excludeMissing rules)
- `packages/filters/src/filter/text/textFilter.ts` — TextFilter base (text include/exclude, caseSensitive, locale)
- `packages/filters/src/group/filterGroup.ts` — FilterGroup AND/OR composition
- `packages/filters/src/filter/rules/rules.ts` — Rules utilities (copyRules, ruleIsActive, matchRules)
- `packages/filters/src/missingValue/missingValue.ts` — Local MISSING_VALUE (to be renamed MISSING_FILTER_VALUE)
- `packages/filters/src/filter/enumerated/choiceQuestionFilter.ts` — Concrete: choice question filter
- `packages/filters/src/filter/enumerated/objectFilter.ts` — Concrete: object property filter (e.g., party)
- `packages/filters/src/filter/text/textPropertyFilter.ts` — Concrete: text property filter
- `packages/filters/src/filter/text/textQuestionFilter.ts` — Concrete: text question filter
- `packages/filters/src/filter/number/numberQuestionFilter.ts` — Concrete: number question filter

### Core interfaces
- `packages/core/src/` — Entity, MaybeWrappedEntity, hasAnswers, getEntity (consumed by filters)
- `packages/data/src/` — Question types (ChoiceQuestion variants, NumberQuestion, TextQuestion, MultipleTextQuestion)

### Established skill patterns
- `.claude/skills/data/SKILL.md` — Reference pattern for SKILL.md structure, conventions format, cross-package interfaces section
- `.claude/skills/data/extension-patterns.md` — Reference pattern for numbered-step extension guides
- `.claude/skills/matching/SKILL.md` — Reference for single-domain skill with review checklist
- `.claude/skills/BOUNDARIES.md` — Skill ownership boundaries (packages/filters/ -> filters skill)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `.claude/skills/filters/SKILL.md` — Existing stub with well-crafted description from Phase 16. Body needs replacing; description to be refined after content written.
- `.claude/skills/data/SKILL.md` — Template for SKILL.md structure (~135 lines): conventions, review checklist, cross-package interfaces, key source locations
- `.claude/skills/data/extension-patterns.md` — Template for extension guide structure: numbered steps with exact file paths

### Established Patterns
- SKILL.md body varies by domain complexity: ~135 lines (data), ~156 lines (matching), ~294 lines (database)
- Conventions use numbered items with sub-bullets for readability
- Extension guides use numbered steps with exact relative file paths from package root
- Review checklist as dedicated section (not per-domain)
- filterType discriminant pattern mirrors data package's objectType pattern

### Integration Points
- Filters skill triggers on `packages/filters/` file changes (glob in SKILL.md frontmatter)
- Cross-references data skill for question type details and entity hierarchy
- BOUNDARIES.md already maps packages/filters/ to filters skill ownership
- Gray zone: "Entity filtering by answers" — filters owns filtering logic, data owns entity/answer types

</code_context>

<specifics>
## Specific Ideas

- Rename MISSING_VALUE to MISSING_FILTER_VALUE before writing the skill content — eliminates the gotcha at the source instead of just documenting it
- The filterType discriminant convention should note the packing/minimizing motivation, with a deferred todo to investigate if instanceof can be safely restored
- Known gaps subsection should reference the README's To Do items so Claude doesn't build on patterns that are slated for refactoring

</specifics>

<deferred>
## Deferred Ideas

- Investigate whether `instanceof` can be safely restored across the monorepo (affects both data and filters packages) — could be its own cleanup task
- Refactor entityGetter, built-in property/Question accessors into a single value getter callback (noted in filters README To Do)
- Add global locale changing to FilterGroup (noted in README To Do)
- Make canonical missing value `undefined` with isMissing utility (noted in README To Do — may be obsoleted by the MISSING_FILTER_VALUE rename)

</deferred>

---

*Phase: 19-filters-skill*
*Context gathered: 2026-03-16*
