# Phase 21: Quality and Validation - Research

**Researched:** 2026-03-16
**Domain:** Claude Code skill quality validation, cross-cutting testing, content deduplication audit
**Confidence:** HIGH

## Summary

Phase 21 validates the 4 completed skills (data, matching, filters, database) plus the 2 deferred stubs (architect, components) and the trimmed CLAUDE.md. The phase has three distinct requirements: cross-cutting scenario testing (QUAL-01), triggering accuracy validation (QUAL-02), and content deduplication audit (QUAL-03). Unlike phases 16-20 which created files, this phase evaluates existing files and fixes any issues found.

The skills system is now fully built: 4 active SKILL.md files (data: 135 lines, matching: 156 lines, filters: 113 lines, database: 294 lines) with 7 reference files totaling 1,417 lines, plus 2 deferred stubs (architect: 16 lines, components: 17 lines), a BOUNDARIES.md (72 lines), and a CLAUDE.md trimmed to 200 lines. Cross-skill references already exist -- matching and filters skills reference the data skill for interface implementations, database skill references data skill for TypeScript localization types, and extension-patterns files cross-reference each other for multi-skill workflows.

The validation work is inherently manual. Claude Code does not provide automated tooling for testing skill triggering accuracy in the project context -- the skill-creator plugin offers eval tooling but is designed for action skills, not domain-knowledge skills embedded in a specific codebase. The most effective validation approach is: (1) design specific cross-cutting scenarios and manually verify that asking Claude about them activates the right combination of skills, (2) compile natural developer queries and test them against skill descriptions, and (3) perform a systematic textual audit of CLAUDE.md against all skill files to identify any content duplication.

**Primary recommendation:** Structure the phase as a single plan with three tasks mapping to the three requirements. The cross-cutting scenario testing (QUAL-01) and triggering accuracy validation (QUAL-02) should produce a documented test matrix with results. The deduplication audit (QUAL-03) should produce a checklist-based audit report. Any issues found during testing should be fixed inline as part of the same plan.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| QUAL-01 | All skills tested with cross-cutting scenarios (multi-skill active) | Research identifies 5 cross-cutting scenarios spanning 2-4 skills each, with expected skill activation patterns. The cross-reference links already exist in skill files. |
| QUAL-02 | Skill triggering accuracy validated against natural developer queries | Research provides 15+ natural developer queries mapped to expected skill activations, based on skill description analysis and the BOUNDARIES.md ownership map. |
| QUAL-03 | No CLAUDE.md/skill content duplication | Research performs preliminary audit identifying zero problematic duplications. Full audit methodology documented with grep-based verification commands. |
</phase_requirements>

## Standard Stack

### Core
| Technology | Version | Purpose | Why Standard |
|------------|---------|---------|--------------|
| Claude Code Skills | Current (2026) | Skill system being validated | The system under test |
| SKILL.md (YAML + Markdown) | Agent Skills Spec 1.0 | Skill definition format | All skills follow this format |
| Bash/grep | System | Deduplication audit commands | Text-based comparison of CLAUDE.md vs skill files |

No npm packages or build tools needed. This is a validation and documentation phase.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Manual testing | skill-creator plugin evals | Skill-creator is designed for action skills, not domain-knowledge reference skills; manual testing is more appropriate for our use case |
| Automated grep | Manual reading | Automated grep catches literal duplication; manual reading catches semantic duplication (same concept described differently) |

## Architecture Patterns

### Current Skill File Inventory

```
.claude/skills/
  BOUNDARIES.md              # 72 lines - directory/concept ownership map
  data/
    SKILL.md                 # 135 lines - data package expert
    object-model.md          # 152 lines - DataRoot hierarchy reference
    extension-patterns.md    # 166 lines - entity/question type guides
  matching/
    SKILL.md                 # 156 lines - matching package expert
    algorithm-reference.md   # 190 lines - distance metrics, pipeline
    extension-patterns.md    # 142 lines - metric/question/projector guides
  filters/
    SKILL.md                 # 113 lines - filters package expert
    extension-patterns.md    # 115 lines - filter type guides
  database/
    SKILL.md                 # 294 lines - database expert
    schema-reference.md      # 272 lines - table columns, triggers, indexes
    rls-policy-map.md        # 189 lines - role-capability matrix
    extension-patterns.md    # 191 lines - table/RLS/pgTAP guides
  architect/
    SKILL.md                 # 16 lines - deferred stub
  components/
    SKILL.md                 # 17 lines - deferred stub
```

### Pattern 1: Cross-Cutting Scenario Test Matrix

**What:** A structured matrix of scenarios that span multiple skills, documenting which skills should activate and what guidance each should provide.

**When to use:** QUAL-01 validation.

**Structure:**
```markdown
| Scenario | Skills Expected | Why Multiple | Verification |
|----------|----------------|--------------|--------------|
| Add a new question type | data + matching | Data owns the class; matching owns normalizeValue/normalizedDimensions | Both extension-patterns cross-reference each other |
```

### Pattern 2: Natural Query Triggering Test

**What:** A list of natural developer queries with expected skill activations based on description keyword matching.

**When to use:** QUAL-02 validation.

**Structure:**
```markdown
| Query | Expected Skill(s) | Trigger Words in Description | Result |
|-------|-------------------|------------------------------|--------|
| "How does matching work?" | matching | "matching algorithms", "distance metrics" | PASS/FAIL |
```

### Pattern 3: Deduplication Audit Checklist

**What:** Systematic comparison of CLAUDE.md content against all skill files to detect both literal and semantic duplication.

**When to use:** QUAL-03 validation.

**Method:**
1. For each section in CLAUDE.md, grep for key phrases in all SKILL.md files
2. For each convention/rule in CLAUDE.md, check if a skill also states it
3. For each concept in skills, check if CLAUDE.md also explains it beyond a brief mention
4. Document findings as: OK (no duplication), POINTER (CLAUDE.md mentions, skill details -- acceptable), or DUPLICATE (same content in both -- needs fixing)

### Anti-Patterns to Avoid

- **Testing only simple single-skill scenarios:** The value of QUAL-01 is specifically in cross-cutting cases. Simple "edit a file in packages/data/" tests are trivial.
- **Treating deferred stubs as needing content validation:** The architect and components stubs are placeholders. Only validate that their descriptions do not conflict with active skill descriptions.
- **Fixing triggering by making descriptions vague:** If a skill triggers too broadly, narrow it with more specific terms, not by removing useful trigger words.
- **Removing cross-references as "duplication":** When the matching skill says "the data skill documents how question classes implement this interface," that is a cross-reference, not duplication.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Skill triggering tests | Automated test harness | Manual scenario-based testing with documented results | No automated tooling exists for testing domain-knowledge skill triggering in-context; manual testing is the standard approach |
| Deduplication detection | Custom script comparing files | Targeted grep commands + manual review | Semantic duplication requires human judgment; grep catches the literal cases |
| Cross-cutting validation | Unit tests for skills | Structured test matrix with manual verification | Skills are documentation, not code; they cannot be unit-tested |

**Key insight:** This is a quality assurance phase for documentation/knowledge files, not software. The "tests" are structured manual reviews with documented findings, not automated test suites.

## Common Pitfalls

### Pitfall 1: Confusing Cross-References with Duplication
**What goes wrong:** The auditor flags every mention of a concept in multiple files as "duplication," including legitimate cross-references like "the data skill documents how entities implement HasAnswers."
**Why it happens:** Literal interpretation of "zero duplication" without understanding that cross-references are necessary for multi-skill navigation.
**How to avoid:** Define duplication precisely: same instructional content (rules, conventions, how-to steps) appearing in both CLAUDE.md and a skill file. Cross-references (one file pointing to another as the authority) are NOT duplication.
**Warning signs:** The audit flags 20+ "duplications" that are all cross-references.

### Pitfall 2: Only Testing Expected Activations
**What goes wrong:** Tests only check that the right skill activates. They don't check that wrong skills stay quiet. A vague description might cause a skill to activate for every request.
**Why it happens:** Natural bias toward positive testing.
**How to avoid:** Include negative test cases: queries that should NOT trigger each skill. Verify the skill stays quiet.
**Warning signs:** No negative test cases in the test matrix.

### Pitfall 3: Treating Description Overlap as a Problem
**What goes wrong:** Multiple skill descriptions mention related concepts (e.g., both data and matching mention "question types"). The auditor tries to make descriptions mutually exclusive, losing important trigger words.
**Why it happens:** Applying "single owner" boundary logic to descriptions, which serve a different purpose (discovery, not ownership).
**How to avoid:** Descriptions can overlap in vocabulary because the same query legitimately needs multiple skills. The BOUNDARIES.md handles ownership; descriptions handle discovery. Both skills activating for "add a new question type" is correct behavior.
**Warning signs:** Skill descriptions become so narrow they miss legitimate activations.

### Pitfall 4: Skipping Semantic Duplication
**What goes wrong:** Grep-based audit finds no literal duplication, but CLAUDE.md says "all user-facing strings must support multiple locales" and the data skill says "use translate() for all user-facing text" -- same instruction, different words.
**Why it happens:** Automated tools only find literal text matches.
**How to avoid:** After the grep scan, do a manual pass reading CLAUDE.md section by section and checking if any skill covers the same instructional ground.
**Warning signs:** Audit relies entirely on grep results without manual review.

## Code Examples

### Cross-Cutting Scenario Definitions

These are the key scenarios that test multi-skill activation:

**Scenario 1: "Add a new question type"**
- Touches: data (question class, objectType, typeGuards, internal.ts) + matching (normalizeValue, normalizedDimensions, distance behavior) + filters (question-type filter variant if filterable)
- Expected skills: data, matching, filters (if filterable)
- Cross-references: matching/extension-patterns.md line 63 says "also follow the data skill's extension-patterns.md"; filters/extension-patterns.md line 64 says "complete the data skill's extension-patterns.md first"
- Verification: both extension-patterns files guide a coherent end-to-end workflow

**Scenario 2: "Add a new database table with RLS"**
- Touches: database (schema, RLS policies, indexes, pgTAP tests) + potentially data (if TypeScript types needed in supabase-types)
- Expected skills: database (primary), data (if COLUMN_MAP/PROPERTY_MAP needs updating)
- Cross-references: database/extension-patterns.md has complete 3-guide walkthrough
- Verification: database skill provides complete guidance without needing other skills

**Scenario 3: "How does voter-candidate matching work?"**
- Touches: data (DataRoot, question types, HasAnswers interface) + matching (MatchingAlgorithm, distance metrics, MatchingSpace)
- Expected skills: matching (primary for algorithm), data (for data model context)
- Cross-references: matching SKILL.md lines 130-134 reference data skill for interface implementation
- Verification: matching skill explains the algorithm; data skill explains the data structures that feed it

**Scenario 4: "Filter candidates by party affiliation"**
- Touches: filters (ObjectFilter or EnumeratedFilter) + data (entity types, nominations linking candidates to organizations)
- Expected skills: filters (primary for filter logic), data (for entity/nomination model)
- Cross-references: filters SKILL.md lines 100-105 reference data skill for entity types
- Verification: filters skill explains filter creation; data skill explains the entity model

**Scenario 5: "Store localized content in the database"**
- Touches: database (JSONB locale-keyed storage, get_localized()) + data (LocalizedValue TypeScript type, translate())
- Expected skills: database (SQL storage), data (TypeScript type)
- Cross-references: database SKILL.md line 46 says "the data skill owns the TypeScript LocalizedValue type"; line 286 repeats this boundary
- Verification: clear ownership split -- database for SQL, data for TypeScript

### Natural Developer Query List

Queries for QUAL-02 validation:

| # | Query | Expected Skill(s) | Key Description Triggers |
|---|-------|--------------------|--------------------------|
| 1 | "How does matching work?" | matching | "matching algorithms", "distance metrics", "voter-candidate matching" |
| 2 | "Add a filter" | filters | "adding new filter types", "entity filtering" |
| 3 | "Write a pgTAP test" | database | "pgTAP tests", "writing...pgTAP tests" |
| 4 | "Add a new entity type" | data | "adding entity...types", "extending data models" |
| 5 | "Fix an RLS policy" | database | "RLS policies", "97 RLS policies" |
| 6 | "How do categorical questions affect matching?" | matching, data | matching: "categorical questions"; data: "question types" |
| 7 | "Add a column to the candidates table" | database | "working in apps/supabase/", "writing migrations" |
| 8 | "What is MISSING_VALUE?" | data | "MISSING_VALUE conventions" |
| 9 | "Add a new distance metric" | matching | "implementing distance metrics", "distance metrics" |
| 10 | "How does FilterGroup work?" | filters | "FilterGroup composition", "AND/OR logic" |
| 11 | "Review this data package PR" | data | "reviewing data package changes" |
| 12 | "How does the bulk import work?" | database | "bulk import/delete RPCs" |
| 13 | "Add a new question type to the data package" | data | "adding...question types", "extending data models" |
| 14 | "How does the JWT claims hook work?" | database | "JWT claims via Access Token Hook" |
| 15 | "What question types exist?" | data | "question types and their matching interfaces" |
| 16 | "How does the nomination system work?" | data | "nomination system" |

### Deduplication Audit Commands

```bash
# Check if CLAUDE.md concepts appear as instructional content in skills
# (looking for imperative rules, not cross-references)

# 1. Check CLAUDE.md implementation rules against skill conventions
grep -n "Never commit\|WCAG\|TypeScript strictly\|avoid.*any\|Localization" CLAUDE.md
grep -rn "Never commit\|WCAG\|TypeScript strictly\|avoid.*any" .claude/skills/*/SKILL.md

# 2. Check for duplicated build/test commands
grep -n "yarn build\|yarn test\|yarn dev" CLAUDE.md
grep -rn "yarn build\|yarn test\|yarn dev" .claude/skills/*/SKILL.md

# 3. Check for duplicated architecture descriptions
grep -n "Monorepo\|workspace\|Yarn 4\|SvelteKit\|Supabase" CLAUDE.md
grep -rn "Monorepo\|workspace\|Yarn 4\|SvelteKit\|Supabase" .claude/skills/*/SKILL.md

# 4. Check for routing patterns duplicated in skills
grep -n "lang=locale\|voters\|candidate" CLAUDE.md
grep -rn "lang=locale\|voters\|candidate" .claude/skills/*/SKILL.md

# 5. Verify CLAUDE.md line count is within target
wc -l CLAUDE.md
# Expected: ~150-200 lines (currently 200)
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| All knowledge in CLAUDE.md | Domain knowledge in skills, cross-cutting in CLAUDE.md | Phase 16 (2026-03-15) | CLAUDE.md reduced from 315 to 200 lines; domain knowledge loaded on-demand |
| No cross-package references | Skills cross-reference each other for multi-skill workflows | Phases 17-20 (2026-03-16) | Extension patterns guide users through multi-skill scenarios |
| No boundary definitions | BOUNDARIES.md maps files and concepts to skill owners | Phase 16 (2026-03-15) | Gray zones resolved with explicit primary owner |

## Open Questions

1. **Actual triggering behavior cannot be fully tested without a live Claude Code session**
   - What we know: Skill descriptions contain appropriate trigger phrases. Cross-references exist between skills.
   - What's unclear: Whether Claude's description-based auto-invocation actually loads the right skills for the documented scenarios. This can only be verified in a live session.
   - Recommendation: Document expected behavior. The planner should create tasks that include the test scenarios, but acknowledge that verification requires the user to test in actual Claude Code sessions. The plan should output a test matrix document that the user can verify.

2. **Whether deferred stub descriptions conflict with active skills**
   - What we know: The architect stub mentions "monorepo structure, cross-package dependency flow" which overlaps with concepts in active skills.
   - What's unclear: Whether the stub descriptions cause Claude to load the stubs unnecessarily (wasting context on placeholder content).
   - Recommendation: Review stub descriptions during QUAL-02. If they cause unnecessary loading, add `disable-model-invocation: true` to stubs until they have real content.

3. **Optimal response to found issues**
   - What we know: The phase must fix issues found, not just document them.
   - What's unclear: How many issues will be found and how complex fixes will be.
   - Recommendation: Plan for inline fixes. If cross-cutting testing reveals a missing cross-reference, add it. If deduplication audit finds duplication, remove it. Keep the plan flexible for fix scope.

## Validation Architecture

> This phase validates skills (documentation/knowledge files), not code. There are no automated tests to run. Validation is the phase's primary deliverable.

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Validation Method | Automated? |
|--------|----------|-----------|-------------------|------------|
| QUAL-01 | Cross-cutting scenarios activate correct skill combinations | Manual scenario testing | Document 5 scenarios with expected skill activations, verify cross-references exist in skill files | Partially -- cross-reference existence is verifiable via grep |
| QUAL-02 | Natural developer queries trigger correct skills | Manual query testing | Document 16+ queries with expected activations, verify description keywords match | Partially -- keyword presence verifiable via grep |
| QUAL-03 | Zero content duplication between CLAUDE.md and skills | Audit | Run grep commands comparing CLAUDE.md against all SKILL.md files, manual semantic review | Partially -- literal duplication detectable via grep, semantic duplication requires manual review |

### Quick Validation Commands
```bash
# Verify all skill files exist and are non-empty
ls -la .claude/skills/*/SKILL.md
wc -l .claude/skills/*/SKILL.md

# Verify BOUNDARIES.md exists
test -f .claude/skills/BOUNDARIES.md && echo "EXISTS" || echo "MISSING"

# Verify CLAUDE.md is within target line count
wc -l CLAUDE.md

# Verify cross-references between skills exist
grep -r "data skill" .claude/skills/matching/SKILL.md .claude/skills/filters/SKILL.md .claude/skills/database/SKILL.md
grep -r "matching skill" .claude/skills/data/SKILL.md

# Verify extension-patterns cross-reference each other
grep -r "data skill" .claude/skills/matching/extension-patterns.md .claude/skills/filters/extension-patterns.md
```

### Wave 0 Gaps
None -- no test infrastructure needed. Validation is manual audit + grep verification.

## Sources

### Primary (HIGH confidence)
- [Claude Code Skills Documentation](https://code.claude.com/docs/en/skills) -- Verified 2026-03-16. Skill triggering mechanism (description-based auto-invocation), context loading model (descriptions always in context, body loaded on demand), troubleshooting guidance ("Check the description includes keywords users would naturally say"), context budget (2% of window, 16K char fallback).
- All 6 SKILL.md files in `.claude/skills/` -- Direct analysis of descriptions, conventions, cross-references, and line counts.
- All 7 reference files in `.claude/skills/` -- Direct analysis of cross-references between skills.
- CLAUDE.md (200 lines) -- Direct analysis for duplication against skill files.
- BOUNDARIES.md (72 lines) -- Directory ownership, concept domains, gray zone resolution.
- `.planning/research/PITFALLS.md` -- Pitfalls 3 (duplication/contradiction), 6 (overlapping boundaries), 12 (testing only simple cases) directly inform this phase.
- `.planning/research/FEATURES.md` -- Skill quality metrics, cross-skill dependency map, feature tables inform test scenario design.

### Secondary (MEDIUM confidence)
- [Improving skill-creator: Test, measure, and refine Agent Skills](https://claude.com/blog/improving-skill-creator-test-measure-and-refine-agent-skills) -- Anthropic blog on skill testing methodology. Confirms description optimization for trigger accuracy, eval framework with test prompts, A/B testing approach.
- [Claude Code Skill Creator Guide](https://www.nathanonn.com/claude-code-skill-creator-guide/) -- Practical testing methods for skill triggering accuracy.

### Tertiary (LOW confidence)
- None. All findings verified against official docs or direct file analysis.

## Metadata

**Confidence breakdown:**
- Cross-cutting scenarios (QUAL-01): HIGH -- Scenarios derived from actual cross-reference links already present in skill files
- Triggering accuracy (QUAL-02): HIGH for description analysis, MEDIUM for actual triggering prediction -- behavior depends on Claude's internal skill selection which cannot be unit-tested
- Deduplication (QUAL-03): HIGH -- Preliminary audit already performed with grep and manual reading; no problematic duplications found
- Methodology: HIGH -- Manual validation is the standard approach for domain-knowledge skills per official docs

**Research date:** 2026-03-16
**Valid until:** 2026-04-16 (stable -- documentation validation methodology)
