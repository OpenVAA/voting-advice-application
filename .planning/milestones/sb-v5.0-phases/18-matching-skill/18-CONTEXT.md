# Phase 18: Matching Skill - Context

**Gathered:** 2026-03-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Create the domain-expert Claude Code skill for `@openvaa/matching` — the algorithm package that computes voter-candidate match scores. Replace the SKILL.md placeholder with actionable conventions, mathematical documentation, review checklist, and extension patterns. Create supporting reference files (algorithm-reference.md, extension-patterns.md). No code changes to the matching package itself.

</domain>

<decisions>
## Implementation Decisions

### Math documentation depth
- Include actual mathematical formulas inline (not just conceptual descriptions) — the matching package is math-heavy and Claude needs exact numbers for reviews
- Full derivation for CategoricalQuestion multi-dimensional model: explain geometric intuition for why N choices create N subdimensions, why max disagreement is 2/n, why binary is special case
- Document all three layers of the distance metric abstraction: kernel, sum, and subdimWeight for Manhattan, Euclidean, and Directional metrics
- Include known gaps from README's future developments section (ranked preference questions, Manhattan-directional hybrid, Mahalanobis) so Claude knows what's planned but not yet implemented

### Cross-skill boundaries
- Brief inline + cross-reference pattern for shared interfaces: state key MatchableQuestion and HasAnswers interface facts (normalizeValue, normalizedDimensions, answers record) inline for matching context, then point to data skill for full details
- Explain the relationship between matching's question classes (OrdinalQuestion, CategoricalQuestion in src/question/) and data package's question variants — matching's are standalone implementations for testing/direct use, data's are production implementations through DataRoot
- Inline @openvaa/core types: document COORDINATE range [-0.5, 0.5], COORDINATE.Extent = 1, MISSING_VALUE sentinel, isMissingValue() guard directly in the skill, with source file references to @openvaa/core
- Include a Cross-Package Interfaces section in SKILL.md mirroring the data skill's pattern

### Extension pattern scope
- Two core extension patterns: adding distance metrics and adding question types (matching side)
- Also include a guide for adding a new MatchingSpaceProjector (used for 2D/3D political maps)
- Skip missing value method extension — too niche
- Extension guides use abstract numbered steps with exact file paths (consistent with data skill pattern, no worked examples)
- Question type extension covers matching-side only, with explicit cross-reference to data skill's extension-patterns.md for the data-side implementation

### Review checklist focus
- Balance both mathematical correctness AND structural conventions equally
- Include edge case verification item: Claude should verify distance metrics produce consistent results for all-same answers, all-opposite answers, and single-question matching
- Include normalizedDimensions verification item: new question types must correctly report normalizedDimensions (drives MatchingSpace shape; wrong values cause silent scoring errors)
- Note that tests currently live in tests/ directory (not co-located), document current pattern in skill

### Claude's Discretion
- Exact line count of SKILL.md body (target ~130-180 lines, consistent with data skill)
- Ordering of conventions within SKILL.md
- Exact structure of algorithm-reference.md sections (by pipeline flow, concept, or component)
- Level of detail for each formula — some may need more explanation than others

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Matching package
- `packages/matching/README.md` — Package paradigm, process pipeline, future developments, quick start guide
- `packages/matching/src/algorithms/matchingAlgorithm.ts` — Core algorithm class (~6900 lines), match() method, options handling
- `packages/matching/src/distance/metric.ts` — Distance metric implementations (Manhattan, Euclidean, Directional), kernel/sum/subdimWeight abstraction
- `packages/matching/src/question/categoricalQuestion.ts` — CategoricalQuestion multi-dimensional model, N subdimensions
- `packages/matching/src/question/ordinalQuestion.ts` — OrdinalQuestion normalization
- `packages/matching/src/missingValue/impute.ts` — Missing value imputation methods (Neutral, RelativeMaximum)
- `packages/matching/src/space/matchingSpace.ts` — MatchingSpace construction from questions
- `packages/matching/src/match/match.ts` — Match object structure (distance, score, matchFraction)

### Core interfaces
- `packages/core/src/matching/matchableQuestion.type.ts` — MatchableQuestion interface (normalizeValue, normalizedDimensions)
- `packages/core/src/matching/hasAnswers.type.ts` — HasAnswers interface (answers record)
- `packages/core/src/matching/distance.type.ts` — COORDINATE, CoordinateOrMissing types

### Established skill patterns
- `.claude/skills/data/SKILL.md` — Reference pattern for SKILL.md structure, conventions format, review checklist, cross-package interfaces section
- `.claude/skills/data/extension-patterns.md` — Reference pattern for numbered-step extension guides with exact file paths
- `.claude/skills/BOUNDARIES.md` — Skill ownership boundaries (packages/matching/ -> matching skill)

### Phase research
- `.planning/phases/18-matching-skill/18-RESEARCH.md` — Detailed research on conventions, mathematical nuances, extension points, and file structure

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `.claude/skills/matching/SKILL.md` — Existing stub with well-crafted description from Phase 16. Body needs replacing; description and frontmatter should be preserved.
- `.claude/skills/data/SKILL.md` — Template for SKILL.md structure: conventions in numbered sub-bullet format, review checklist, key source locations, cross-package interfaces section
- `.claude/skills/data/extension-patterns.md` — Template for extension guide structure: numbered steps with exact file paths

### Established Patterns
- SKILL.md body ~130-180 lines with conventions, review checklist, key source locations, and cross-package interfaces
- Reference files for detailed content (~200-250 lines each)
- Conventions use numbered items with sub-bullets for readability
- Extension guides use numbered steps with exact relative file paths from package root

### Integration Points
- Matching skill triggers on `packages/matching/` file changes (glob in SKILL.md frontmatter)
- Cross-references data skill for question type details
- BOUNDARIES.md already maps packages/matching/ to matching skill ownership

</code_context>

<specifics>
## Specific Ideas

- The geometric intuition for CategoricalQuestion subdimensions should help Claude reason about new question types, not just document existing ones
- Edge case verification in the review checklist is particularly important because matching bugs at extremes (all-same, all-opposite answers) are silent failures
- The MatchingSpaceProjector extension pattern can be brief since the interface is simple, but it should explain the use case (2D/3D political maps)

</specifics>

<deferred>
## Deferred Ideas

- Refactor matching package test locations from separate tests/ directory to co-located *.test.ts pattern (consistent with data package) — queue as a separate task after skill creation
- Missing value method extension pattern — skipped as too niche for initial skill, could be added later if demand arises

</deferred>

---

*Phase: 18-matching-skill*
*Context gathered: 2026-03-16*
