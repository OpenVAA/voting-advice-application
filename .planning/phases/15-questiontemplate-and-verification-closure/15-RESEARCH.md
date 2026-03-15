# Phase 15: QuestionTemplate & Verification Closure - Research

**Researched:** 2026-03-15
**Domain:** TypeScript data model extension, benchmark verification, requirements traceability
**Confidence:** HIGH

## Summary

Phase 15 is a gap closure phase with three distinct objectives: (1) resolve DATA-01/DATA-02 by re-implementing the QuestionTemplate class in @openvaa/data that was created in Phase 9 Plan 03 (commit 206ada739) then deleted in commit 581c73612, (2) create a VERIFICATION.md for Phase 11 confirming benchmark scripts exist and produced results, and (3) mark LOAD-04 as complete in REQUIREMENTS.md since the answer storage decision document (11-DECISION.md) already exists.

The QuestionTemplate implementation is well-documented: the exact code was written, tested (6 passing tests), and verified before being removed. The git history preserves the complete implementation (type, class, tests, DataRoot integration, OBJECT_TYPE registration). Re-implementing is a matter of restoring the known-good code from commit 206ada739, not designing anything new.

The Phase 11 verification is purely documentary: all benchmark artifacts (pgbench scripts, k6 scripts, data generators, orchestration, results) exist on disk and the decision document (11-DECISION.md, 287 lines) is thorough. A VERIFICATION.md needs to confirm script presence, result file existence, and decision document completeness.

**Primary recommendation:** Restore QuestionTemplate from git history (commit 206ada739), write Phase 11 VERIFICATION.md by enumerating existing artifacts, and update REQUIREMENTS.md checkboxes.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DATA-01 | @openvaa/data extended with QuestionTemplate concept | Complete implementation exists in git history (commit 206ada739). 7 files: type, class, tests, objectTypes, dataRoot.type, dataRoot, internal.ts. Pattern follows existing DataObject extension pattern used by 20+ other object types. |
| DATA-02 | QuestionTemplate defines default properties, answer type, and configuration for creating questions | QuestionTemplateData interface defines `type: QuestionType`, `settings?: Record<string, unknown>`, `defaultChoices?: Array<AnyChoice>`. Class provides safe defaults (settings={}, defaultChoices=[]). 6 unit tests cover creation, defaults, accessors, DataRoot integration. |
| LOAD-04 | Answer storage decision documented with supporting benchmark data | 11-DECISION.md exists (287 lines, HIGH confidence JSONB recommendation). Contains p50/p95/p99 tables at 1K/5K/10K scale, concurrency scaling data, caching analysis, and clear reasoning. Only gap: REQUIREMENTS.md checkbox not updated. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @openvaa/data | workspace | Data model package where QuestionTemplate lives | Project's own data model package |
| vitest | ^2.1.8 | Unit testing for QuestionTemplate class | Already configured in monorepo workspace |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| git | system | Retrieve deleted QuestionTemplate code | `git show 206ada739` for exact source |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Re-implementing from scratch | Restoring from git history | Git history has the exact working code with 6 passing tests; no reason to rewrite |
| Deferring DATA-01/DATA-02 to v3+ | Re-implementing now | Requirements state "re-implement or defer"; re-implementing is a 3-minute task from git history |

## Architecture Patterns

### QuestionTemplate File Structure
```
packages/data/src/
  objects/questions/template/
    questionTemplate.type.ts   # QuestionTemplateData interface
    questionTemplate.ts        # QuestionTemplate class
    questionTemplate.test.ts   # 6 unit tests
  core/
    objectTypes.ts             # Add QuestionTemplate to OBJECT_TYPE + ObjectTypeMap
  root/
    dataRoot.type.ts           # Add questionTemplates to RootCollections
    dataRoot.ts                # Add getter, id getter, provideData method
  internal.ts                  # Add barrel exports
```

### Pattern: DataObject Extension
**What:** Adding a new first-class data object to @openvaa/data
**When to use:** When a database entity needs TypeScript representation in the data model
**Example:**
```typescript
// Source: git show 206ada739 (verified implementation)

// 1. Type interface
export interface QuestionTemplateData extends DataObjectData {
  type: QuestionType;
  settings?: Record<string, unknown> | null;
  defaultChoices?: Array<AnyChoice> | null;
}

// 2. Class
export class QuestionTemplate extends DataObject<QuestionTemplateData> {
  readonly objectType = OBJECT_TYPE.QuestionTemplate;
  get type(): QuestionType { return this.data.type; }
  get settings(): Record<string, unknown> { return this.data.settings ?? {}; }
  get defaultChoices(): Array<AnyChoice> { return this.data.defaultChoices ?? []; }
}

// 3. OBJECT_TYPE registration
QuestionTemplate: 'questionTemplate'  // in OBJECT_TYPE const
[OBJECT_TYPE.QuestionTemplate]: QuestionTemplate  // in ObjectTypeMap

// 4. RootCollections
questionTemplates: QuestionTemplate  // in RootCollections type

// 5. DataRoot methods
get questionTemplates(): Collection<QuestionTemplate> { ... }
getQuestionTemplate(id: Id): QuestionTemplate { ... }
provideQuestionTemplateData(data: ...): void { ... }

// 6. Barrel exports in internal.ts
export * from './objects/questions/template/questionTemplate.type';
export * from './objects/questions/template/questionTemplate';
```

### Pattern: Phase Verification Document
**What:** VERIFICATION.md that independently confirms phase artifacts and requirements
**When to use:** When a phase was completed but never formally verified
**Example structure:**
```markdown
# Phase 11: Load Testing Verification Report
- Enumerate each artifact file (exists/does not exist)
- Confirm benchmark result files contain valid data
- Confirm decision document addresses all criteria
- Map each requirement (LOAD-01 through LOAD-04) to evidence
```

### Anti-Patterns to Avoid
- **Re-designing QuestionTemplate:** The class was designed, implemented, tested, and verified. Do not alter the design. Restore the exact code.
- **Running benchmarks again:** Phase 11 verification is documentary. The benchmarks were run, results exist. Verification confirms existence, not re-execution.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| QuestionTemplate implementation | Writing from scratch | `git show 206ada739` | Exact working code with tests in git history |
| Verification checklist format | Custom format | Existing VERIFICATION.md format from other phases (e.g., 09-VERIFICATION.md) | Consistent format across phases |

**Key insight:** This phase is entirely about restoration and documentation, not new design or implementation.

## Common Pitfalls

### Pitfall 1: Modifying the restored QuestionTemplate
**What goes wrong:** Changing the implementation during restoration breaks consistency with the verified Phase 9 work.
**Why it happens:** Temptation to "improve" while touching the code.
**How to avoid:** Restore exactly from git commit 206ada739. Run tests. If all pass, done.
**Warning signs:** Any diff between restored code and git history that isn't whitespace.

### Pitfall 2: Forgetting import order in internal.ts
**What goes wrong:** Circular dependency issues from wrong export order in barrel file.
**Why it happens:** internal.ts has a specific loading order to avoid circular deps.
**How to avoid:** Add QuestionTemplate exports after line 61 (after questionTypes), exactly as the original implementation did.
**Warning signs:** Import errors or circular dependency warnings.

### Pitfall 3: Not updating all files for DataObject registration
**What goes wrong:** QuestionTemplate class exists but is not accessible via DataRoot.
**Why it happens:** Missing one of the 4 registration points (OBJECT_TYPE, ObjectTypeMap, RootCollections, DataRoot methods).
**How to avoid:** The implementation touches exactly 7 files. All 7 must be updated.
**Warning signs:** TypeScript compilation errors or missing collection accessors.

### Pitfall 4: Marking LOAD-04 complete without addressing the verification gap
**What goes wrong:** REQUIREMENTS.md says complete but there's no independent verification.
**Why it happens:** LOAD-04 was already listed as `requirements-completed` in 11-02-SUMMARY.md but the checkbox was never updated.
**How to avoid:** Create VERIFICATION.md first, then update REQUIREMENTS.md.
**Warning signs:** Complete checkboxes without corresponding VERIFICATION.md.

## Code Examples

### Exact files to restore from commit 206ada739

**File 1: questionTemplate.type.ts**
```typescript
// Source: git show 206ada739 -- packages/data/src/objects/questions/template/questionTemplate.type.ts
import type { AnyChoice, DataObjectData, QuestionType } from '../../../internal';

export interface QuestionTemplateData extends DataObjectData {
  type: QuestionType;
  settings?: Record<string, unknown> | null;
  defaultChoices?: Array<AnyChoice> | null;
}
```

**File 2: questionTemplate.ts**
```typescript
// Source: git show 206ada739 -- packages/data/src/objects/questions/template/questionTemplate.ts
export class QuestionTemplate extends DataObject<QuestionTemplateData> {
  readonly objectType = OBJECT_TYPE.QuestionTemplate;
  constructor({ data, root }: { data: QuestionTemplateData; root: DataRoot }) { super({ data, root }); }
  get type(): QuestionType { return this.data.type; }
  get settings(): Record<string, unknown> { return this.data.settings ?? {}; }
  get defaultChoices(): Array<AnyChoice> { return this.data.defaultChoices ?? []; }
}
```

**Modifications to existing files (from commit 206ada739):**
- objectTypes.ts: Add `QuestionTemplate: 'questionTemplate'` to OBJECT_TYPE, add to ObjectTypeMap
- dataRoot.type.ts: Add `questionTemplates: QuestionTemplate` to RootCollections
- dataRoot.ts: Add collection getter, id getter, provideQuestionTemplateData method
- internal.ts: Add 2 export lines after line 61

### Phase 11 Verification: Artifact inventory

```
apps/supabase/benchmarks/
  data/
    generate-shared-data.sql          # EXISTS
    generate-candidates-jsonb.sql     # EXISTS
    generate-candidates-relational.sql # EXISTS
  pgbench/
    voter-bulk-read-jsonb.sql         # EXISTS (LOAD-02)
    voter-bulk-read-relational.sql    # EXISTS (LOAD-02)
    candidate-write-jsonb.sql         # EXISTS (LOAD-03)
    candidate-write-relational.sql    # EXISTS (LOAD-03)
    candidate-full-save-jsonb.sql     # EXISTS
    candidate-full-save-relational.sql # EXISTS
    aggregation-jsonb.sql             # EXISTS
    aggregation-relational.sql        # EXISTS
    + 4 optimized relational variants  # EXISTS
  k6/
    config.js                         # EXISTS (LOAD-01)
    voter-bulk-read.js                # EXISTS (LOAD-01)
  scripts/
    run-benchmarks.sh                 # EXISTS (orchestration)
    swap-schema.sh                    # EXISTS
    parse-pgbench-log.py              # EXISTS
    run-concurrency-scaling.sh        # EXISTS
    run-optimization-benchmarks.sh    # EXISTS
    install-smart-jsonb-trigger.sql   # EXISTS
    restore-original-jsonb-trigger.sql # EXISTS
  results/
    36 JSON result files              # EXISTS
    concurrency/ directory            # EXISTS
    optimization/ directory           # EXISTS
  README.md                          # EXISTS

.planning/phases/11-load-testing/
  11-DECISION.md                     # EXISTS (287 lines, LOAD-04)
  11-01-SUMMARY.md                   # EXISTS (LOAD-01, LOAD-02, LOAD-03)
  11-02-SUMMARY.md                   # EXISTS (LOAD-04)
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| QuestionTemplate in @openvaa/data (commit 206ada739) | QuestionTemplate removed (commit 581c73612) | 2026-03-13 | DATA-01/DATA-02 unsatisfied, question_templates DB table exists without TypeScript counterpart |
| LOAD-04 marked pending in REQUIREMENTS.md | Decision document exists but checkbox not updated | 2026-03-14 | Documentation sync gap only |

**Context for the deletion:** Commit 581c73612 message says "QuestionTemplate should only exist as a database table, not as a TypeScript class." However, DATA-01 and DATA-02 explicitly require "@openvaa/data extended with QuestionTemplate concept" and the v2.0 milestone audit (89b8f5034) identified this as an unsatisfied requirement. The Phase 15 success criteria allow either re-implementation or explicit deferral to v3+.

## Open Questions

1. **Re-implement or defer to v3+?**
   - What we know: The implementation was working (6 tests, verified). It was deleted with the rationale that QuestionTemplate should only be a DB table. However, DATA-01/DATA-02 explicitly require a TypeScript class. The database `question_templates` table exists and `questions.template_id` references it.
   - What's unclear: Whether the project actually needs the TypeScript class before the frontend adapter is built (v3+).
   - Recommendation: Re-implement. The code exists in git, restoration is trivial (3 minutes of work), and it satisfies the requirements definitively. Deferring is also valid but requires updating REQUIREMENTS.md to move DATA-01/DATA-02 to v3+. The planner should present both options in the plan and let the implementation decide.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 2.1.8 |
| Config file | packages/data/vitest.config.ts (empty, workspace-based) |
| Quick run command | `cd packages/data && npx vitest run src/objects/questions/template/questionTemplate.test.ts -x --reporter=verbose` |
| Full suite command | `cd packages/data && npx vitest run --reporter=verbose` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DATA-01 | QuestionTemplate class in @openvaa/data | unit | `cd packages/data && npx vitest run src/objects/questions/template/questionTemplate.test.ts -x` | No (Wave 0 -- restore from git) |
| DATA-02 | QuestionTemplate defines type, settings, defaultChoices | unit | Same as DATA-01 (tests cover all properties) | No (Wave 0 -- restore from git) |
| LOAD-04 | Answer storage decision documented | manual | Review 11-DECISION.md for benchmark data and recommendation | N/A (document review) |

### Sampling Rate
- **Per task commit:** `cd packages/data && npx vitest run src/objects/questions/template/questionTemplate.test.ts -x --reporter=verbose`
- **Per wave merge:** `cd packages/data && npx vitest run --reporter=verbose`
- **Phase gate:** Full suite green before verify

### Wave 0 Gaps
- [ ] `packages/data/src/objects/questions/template/questionTemplate.test.ts` -- covers DATA-01, DATA-02 (restore from git)
- [ ] `packages/data/src/objects/questions/template/questionTemplate.type.ts` -- QuestionTemplateData interface (restore from git)
- [ ] `packages/data/src/objects/questions/template/questionTemplate.ts` -- QuestionTemplate class (restore from git)

## Sources

### Primary (HIGH confidence)
- Git commit 206ada739: Complete QuestionTemplate implementation (type, class, tests, DataRoot integration)
- Git commit 581c73612: QuestionTemplate removal with rationale
- Git commit 89b8f5034: v2.0 milestone audit identifying DATA-01/DATA-02 as unsatisfied
- Phase 9 VERIFICATION.md: Original verification passing 18/18 must-haves including QuestionTemplate
- Phase 11 artifacts on disk: 36+ benchmark result files, 14 pgbench scripts, 2 k6 scripts, orchestration
- 11-DECISION.md: 287-line answer storage decision document with benchmark tables

### Secondary (MEDIUM confidence)
- Phase 9 CONTEXT.md: Original QuestionTemplate design decisions
- Phase 11 SUMMARIES: Claims LOAD-01 through LOAD-04 complete

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All tools and libraries already in use in the project
- Architecture: HIGH - Exact implementation exists in git history, pattern used by 20+ objects
- Pitfalls: HIGH - Based on actual project history (code was deleted post-verification)

**Research date:** 2026-03-15
**Valid until:** 2026-04-15 (stable -- gap closure phase with no external dependencies)
