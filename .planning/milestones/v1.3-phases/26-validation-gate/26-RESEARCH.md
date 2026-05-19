# Phase 26: Validation Gate - Research

**Researched:** 2026-03-19
**Domain:** Svelte 5 migration validation (E2E testing, type checking, legacy pattern audit)
**Confidence:** HIGH

## Summary

Phase 26 is a pure validation phase with three requirements: E2E test pass (VAL-01), type-check pass (VAL-02), and legacy pattern audit (VAL-03). Research confirms the codebase is nearly clean but has concrete issues to fix.

**Current state verified by running tools:**
- **svelte-check:** 11 TypeScript errors exist, all in voter route files (3 files). Zero errors in shared/dynamic components or out-of-scope files.
- **Legacy pattern audit:** 1 commented-out `$:` in `HeroEmoji.svelte`. Documentation comments in dynamic-components contain `on:event` and `slot=` examples in JSDoc `<!-- @component -->` blocks (non-executing code).
- **E2E tests:** 84 spec-level `test()` calls across 16 spec files (voter + candidate + variants), plus setup/teardown fixtures. The "92" count likely includes serial sub-tests or was from a previous baseline. Must be verified by running the full suite.

**Primary recommendation:** Run the legacy pattern audit first (fast, mostly clean), then fix the 11 TypeScript errors, then run the full E2E suite against Docker. Fix any E2E failures inline as migration regressions.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Do NOT flip `compilerOptions.runes: true` globally in svelte.config.js -- candidate routes, admin components, and context files still use Svelte 4 patterns and would break
- Keep per-component `<svelte:options runes />` directives on all migrated files -- they serve as documentation and are harmless
- Global runes switch deferred to v1.4 after candidate + context migration is complete
- Run `svelte-check` and ensure zero TypeScript errors in voter app routes and shared components
- Svelte compiler warnings (deprecations, accessibility) are informational but non-blocking for v1.3
- Add a TODO for future milestone: enable `--compiler-warnings treat-as-errors` strict mode once all code is migrated
- **Audit boundary in scope:** `apps/frontend/src/routes/(voters)/`, `apps/frontend/src/lib/components/`, `apps/frontend/src/lib/dynamic-components/`
- **Audit boundary out of scope:** `apps/frontend/src/routes/candidate/`, `apps/frontend/src/lib/candidate/`, `apps/frontend/src/lib/admin/`, `apps/frontend/src/lib/contexts/`, `apps/frontend/src/routes/+layout.svelte` (root layout)
- Legacy patterns to check: `$:` (ALL occurrences -- including comments/strings), `on:event` directives (not native `onclick`), `<slot`, `$$restProps`, `$$slots`, `$$Props`, `createEventDispatcher`
- Any legacy pattern found in an in-scope file is a regression from Phases 22-25 and MUST be fixed
- Assume Docker stack (`yarn dev`) is already running -- plan does not manage Docker lifecycle
- E2E failures are migration regressions and must be fixed inline
- All 92 E2E tests must pass (test files in `tests/tests/specs/`)
- Run with standard Playwright config at `tests/playwright.config.ts`

### Claude's Discretion
- How to batch E2E test execution (all at once vs. by spec file)
- Exact svelte-check command flags
- Order of validation steps (audit -> type check -> E2E, or different)
- How to diagnose and fix any failures found

### Deferred Ideas (OUT OF SCOPE)
- Global `compilerOptions.runes: true` -- flip after v1.4 candidate + context migration
- Strict compiler warnings mode -- enable `--compiler-warnings treat-as-errors` after all code is migrated
- Candidate app E2E regression -- candidate tests should pass but any failures from shared component API changes were addressed in Phase 25
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| VAL-01 | All 92 E2E tests pass after migration | Playwright config analyzed, test structure understood. 16 spec files across voter/candidate/variant suites. Docker stack must be running. Run via `npx playwright test -c tests/playwright.config.ts` from project root. |
| VAL-02 | TypeScript check passes with zero errors in voter app and shared components | svelte-check v4.4.5 run reveals 11 errors in 3 voter route files. All are `'X' is possibly 'undefined'` narrowing issues. Zero errors in shared/dynamic components. Fix patterns documented below. |
| VAL-03 | Zero legacy Svelte 4 patterns in voter app routes and shared components | Audit confirms near-clean state: 1 commented-out `$:` in HeroEmoji.svelte, several `on:event`/`slot=` in documentation comments in dynamic-components. Zero executing legacy code found. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| svelte-check | 4.4.5 | Svelte + TypeScript diagnostics | Official Svelte type checking tool |
| @playwright/test | 1.58.2 | E2E testing | Already configured in project |
| svelte | 5.53.12 | Framework | Migration target |
| typescript | 5.8.3 | Type system | Project standard |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| grep/ripgrep | system | Legacy pattern audit | Fast text search across files |

No new packages required. All tools already installed.

## Architecture Patterns

### Validation Execution Order

**Recommended: Audit -> Type Check -> E2E**

1. **Legacy Pattern Audit (VAL-03)** -- fastest, mostly mechanical grep. If clean (expected), move on. If findings exist, fix them first since they may cause type/runtime errors.
2. **Type Check (VAL-02)** -- run `svelte-check`, fix errors. This catches compile-time issues before runtime E2E testing.
3. **E2E Tests (VAL-01)** -- slowest, requires Docker stack. Run last so any fixes from steps 1-2 are already in place.

### Svelte-Check Command

```bash
cd apps/frontend && npx svelte-check --threshold error
```

Key flags:
- `--threshold error` -- only report errors, not warnings (warnings are non-blocking per user decision)
- `--workspace` defaults to cwd (apps/frontend) which is correct
- `--output machine` -- useful for parsing results programmatically
- Do NOT use `--compiler-warnings treat-as-errors` (deferred to post-v1.4)

**Note:** `svelte-check` cannot be scoped to specific subdirectories. It checks the entire workspace. However, research confirms all 11 current errors are within the in-scope voter routes. If errors appear in out-of-scope files (candidate routes, contexts), they should be documented but are NOT blockers for VAL-02.

### E2E Test Command

```bash
npx playwright test -c tests/playwright.config.ts
```

Configuration details:
- `testDir`: `tests/tests/specs/` (via `TESTS_DIR` constant)
- `workers`: 4 (local), 1 (CI)
- `retries`: 0 (local), 3 (CI)
- `timeout`: 30s per test
- `fullyParallel`: true (except settings-mutating specs)
- `baseURL`: `http://localhost:5173`

**Project execution order** (enforced by Playwright dependencies):
1. `data-setup` -- imports test dataset via Admin Tools API
2. `auth-setup` -- logs in as candidate (depends on data-setup)
3. `candidate-app` + `voter-app` -- run in parallel (auth/questions + read-only voter specs)
4. `candidate-app-mutation` -- depends on candidate-app
5. `candidate-app-settings` -> `voter-app-settings` -> `voter-app-popups` -- sequential, settings-mutating
6. Variant projects (multi-election, results-sections, constituency, startfromcg) -- sequential with own data setup/teardown

**Batching recommendation:** Run all at once. The Playwright config handles ordering via project dependencies. Running individual spec files would skip the data-setup/auth-setup fixtures and fail.

### Legacy Pattern Audit Commands

```bash
# All patterns checked from project root against in-scope directories

# $: (ALL occurrences including comments/strings)
grep -rn '\$:' apps/frontend/src/routes/\(voters\)/ --include="*.svelte"
grep -rn '\$:' apps/frontend/src/lib/components/ --include="*.svelte"
grep -rn '\$:' apps/frontend/src/lib/dynamic-components/ --include="*.svelte"

# on:event directives (not native onclick)
grep -rn ' on:[a-z]' apps/frontend/src/routes/\(voters\)/ --include="*.svelte"
grep -rn ' on:[a-z]' apps/frontend/src/lib/components/ --include="*.svelte"
grep -rn ' on:[a-z]' apps/frontend/src/lib/dynamic-components/ --include="*.svelte"

# <slot elements
grep -rn '<slot' apps/frontend/src/routes/\(voters\)/ --include="*.svelte"
grep -rn '<slot' apps/frontend/src/lib/components/ --include="*.svelte"
grep -rn '<slot' apps/frontend/src/lib/dynamic-components/ --include="*.svelte"

# $$restProps, $$slots, $$Props, createEventDispatcher
grep -rn '$$restProps\|$$slots\|$$Props\|createEventDispatcher' apps/frontend/src/routes/\(voters\)/ --include="*.svelte"
grep -rn '$$restProps\|$$slots\|$$Props\|createEventDispatcher' apps/frontend/src/lib/components/ --include="*.svelte"
grep -rn '$$restProps\|$$slots\|$$Props\|createEventDispatcher' apps/frontend/src/lib/dynamic-components/ --include="*.svelte"
```

Also check `.ts` files (type files, utility files) in the same directories:
```bash
grep -rn '\$:\|$$restProps\|$$slots\|$$Props\|createEventDispatcher' apps/frontend/src/routes/\(voters\)/ --include="*.ts"
grep -rn '\$:\|$$restProps\|$$slots\|$$Props\|createEventDispatcher' apps/frontend/src/lib/components/ --include="*.ts"
grep -rn '\$:\|$$restProps\|$$slots\|$$Props\|createEventDispatcher' apps/frontend/src/lib/dynamic-components/ --include="*.ts"
```

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Type checking | Custom TypeScript script | `svelte-check --threshold error` | Handles Svelte component types, snippets, runes |
| Pattern scanning | Regex engine | grep/ripgrep with known pattern list | Well-tested, fast, handles edge cases |
| E2E test orchestration | Custom runner | Playwright project dependencies | Already configured with setup/teardown, ordering |

**Key insight:** This phase is entirely about running existing tools and fixing what they find. No new infrastructure is needed.

## Common Pitfalls

### Pitfall 1: Running E2E Without Docker Stack
**What goes wrong:** All tests fail with connection errors
**Why it happens:** E2E tests need frontend (5173), strapi (1337), postgres (5432), localstack (4566)
**How to avoid:** Verify Docker stack is up before running. The plan assumes `yarn dev` is already running.
**Warning signs:** `ECONNREFUSED` or timeout errors in first test

### Pitfall 2: Svelte-Check Scope Confusion
**What goes wrong:** Errors in out-of-scope files (candidate routes, contexts) treated as blockers
**Why it happens:** `svelte-check` checks entire workspace, cannot be scoped to subdirectories
**How to avoid:** Only count errors in voter routes (`(voters)/`), shared components (`lib/components/`), and dynamic components (`lib/dynamic-components/`). Errors elsewhere are informational.
**Warning signs:** Error paths containing `candidate/`, `admin/`, `contexts/`

### Pitfall 3: False Positives in Documentation Comments
**What goes wrong:** Audit flags `on:event` or `slot=` in JSDoc `<!-- @component -->` blocks
**Why it happens:** The CONTEXT says check `$:` "ALL occurrences including comments/strings" but for other patterns specifies "directives" which implies executing code
**How to avoid:** For `$:`, flag ALL occurrences (including comments). For `on:event`, `<slot`, `$$restProps` etc., only flag occurrences in executing code, not in documentation comment blocks. Document any comment-only findings separately.
**Warning signs:** Matches inside `<!-- ... -->` blocks or fenced code blocks

### Pitfall 4: TypeScript Narrowing After Runes Migration
**What goes wrong:** `$derived` values that can be `undefined` are used without null checks
**Why it happens:** Runes migration changes reactive variables from always-defined `$:` assignments to `$derived()` which preserves `undefined` in union types
**How to avoid:** Add null guards, optional chaining, or non-null assertions where the value is guaranteed by runtime control flow
**Warning signs:** `'X' is possibly 'undefined'` errors on derived state variables

### Pitfall 5: Playwright Data Setup Failures
**What goes wrong:** Setup fixture fails, all downstream tests skip
**Why it happens:** Stale data in database, LocalStack not ready, Strapi admin not accessible
**How to avoid:** Ensure clean Docker stack. The data-setup project cleans existing test data first.
**Warning signs:** `data-setup` project fails, all subsequent projects show "skipped"

## Code Examples

### Fixing "possibly undefined" TypeScript errors

The 11 errors all follow the same pattern: a `$derived` variable that can be `undefined` is used without narrowing.

**Pattern 1: Guard clause (preferred for functions)**
```typescript
// Before (error: 'question' is possibly undefined)
function handleDelete() {
  answers.deleteAnswer(question.id);
}

// After
function handleDelete() {
  if (!question) return;
  answers.deleteAnswer(question.id);
}
```

**Pattern 2: Non-null assertion (when guaranteed by control flow)**
```svelte
<!-- Before (error: 'question' is possibly undefined in template) -->
<QuestionHeading {question} />

<!-- After (when parent {#if question} guard exists) -->
<QuestionHeading question={question!} />
```

**Pattern 3: Optional chaining (for property access)**
```svelte
<!-- Before -->
{activeElection.getApplicableConstituency($constituencies)?.name}

<!-- After -->
{activeElection?.getApplicableConstituency($constituencies)?.name}
```

### Removing commented-out legacy code

```svelte
<!-- Before: HeroEmoji.svelte line 34 -->
// $: if (emoji != null && emoji !== '') {

<!-- After: remove the entire commented-out block -->
```

### Adding TODO for future strict mode

```typescript
// TODO[v1.4]: Enable --compiler-warnings treat-as-errors after all code migrated
```

## Current Error Inventory

### svelte-check Errors (11 total, 3 files)

**File 1: `src/routes/(voters)/(located)/questions/[questionId]/+page.svelte`** (9 errors)
| Line | Error | Fix Strategy |
|------|-------|-------------|
| 103 | `'question' is possibly 'undefined'` | Add null guard in `onMount` callback |
| 104 | `'question' is possibly 'undefined'` | Same guard as line 103 |
| 181 | `Type 'AnyQuestionVariant \| undefined' not assignable` | Non-null assertion or guard in template |
| 205 | Same as 181 | Same pattern |
| 206 | `'question' is possibly 'undefined'` | Optional chaining or guard |
| 211 | `'question' is possibly 'undefined'` | Optional chaining or guard |
| 213 | `'questionBlock' is possibly 'undefined'` + `'question'` | Guard both variables |
| 216 | `'questionBlock' is possibly 'undefined'` | Optional chaining |

**File 2: `src/routes/(voters)/(located)/questions/category/[categoryId]/+page.svelte`** (1 error)
| Line | Error | Fix Strategy |
|------|-------|-------------|
| 104 | `Type 'QuestionCategory \| undefined' not assignable` | Non-null assertion or guard |

**File 3: `src/routes/(voters)/(located)/results/+page.svelte`** (1 error)
| Line | Error | Fix Strategy |
|------|-------|-------------|
| 294 | `'activeElection' is possibly 'undefined'` | Optional chaining (already inside conditional block) |

### Legacy Pattern Findings

| Pattern | Voter Routes | Shared Components | Dynamic Components | Total |
|---------|-------------|-------------------|-------------------|-------|
| `$:` (code) | 0 | 0 | 0 | 0 |
| `$:` (comments) | 0 | 1 (HeroEmoji) | 0 | 1 |
| `on:event` (code) | 0 | 0 | 0 | 0 |
| `on:event` (docs) | 0 | 0 | 8 (JSDoc blocks) | 8 |
| `<slot` | 0 | 0 | 0 | 0 |
| `slot=` (docs) | 0 | 0 | 2 (JSDoc blocks) | 2 |
| `$$restProps` | 0 | 0 | 0 | 0 |
| `$$slots` | 0 | 0 | 0 | 0 |
| `$$Props` | 0 | 0 | 0 | 0 |
| `createEventDispatcher` | 0 | 0 | 0 | 0 |

**Verdict:** Zero legacy patterns in executing code. One commented-out `$:` (must be removed per CONTEXT). Documentation comment examples should be updated to use Svelte 5 syntax but are non-blocking.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `$:` reactive statements | `$derived` / `$derived.by` / `$effect` | Svelte 5 | Migration complete in voter routes |
| `on:event` directives | `onclick` / callback props | Svelte 5 | Migration complete |
| `<slot>` / `<slot name="x">` | `{@render children()}` / snippet props | Svelte 5 | Migration complete |
| `export let` | `$props()` | Svelte 5 | Migration complete |
| `$$restProps` | Destructured `...rest` from `$props()` | Svelte 5 | Migration complete |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Playwright 1.58.2 + svelte-check 4.4.5 |
| Config file | `tests/playwright.config.ts` (E2E), `apps/frontend/tsconfig.json` (types) |
| Quick run command | `cd apps/frontend && npx svelte-check --threshold error` |
| Full suite command | `npx playwright test -c tests/playwright.config.ts` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| VAL-01 | All E2E tests pass | e2e | `npx playwright test -c tests/playwright.config.ts` | Yes (16 spec files) |
| VAL-02 | Zero TypeScript errors | static analysis | `cd apps/frontend && npx svelte-check --threshold error` | Yes (svelte-check installed) |
| VAL-03 | Zero legacy patterns | audit script | `grep -rn` commands (see Architecture Patterns) | N/A (grep) |

### Sampling Rate
- **Per task commit:** `cd apps/frontend && npx svelte-check --threshold error` (after type fixes)
- **Per wave merge:** Full E2E suite
- **Phase gate:** All three validation requirements green before `/gsd:verify-work`

### Wave 0 Gaps
None -- existing test infrastructure covers all phase requirements. No new test files or frameworks needed.

## Open Questions

1. **Exact E2E test count**
   - What we know: 84 `test()` calls across 16 spec files in voter/candidate/variants directories
   - What's unclear: The CONTEXT references "92 tests" -- the discrepancy may be from serial sub-tests, visual/perf tests, or a count from a previous baseline
   - Recommendation: Run the full suite and verify pass count. The exact number is less important than "all tests pass."

2. **Documentation comment examples**
   - What we know: 8 `on:event` and 2 `slot=` occurrences in JSDoc `<!-- @component -->` blocks in dynamic-components
   - What's unclear: Whether the CONTEXT's "ALL occurrences including comments/strings" instruction for `$:` extends to `on:event` patterns too
   - Recommendation: Fix the 1 `$:` comment (clearly required). For documentation examples, update them to Svelte 5 syntax as a best-practice cleanup, but prioritize below type errors and E2E.

## Sources

### Primary (HIGH confidence)
- `tests/playwright.config.ts` -- Playwright configuration, project dependencies, test structure
- `apps/frontend/svelte.config.js` -- Svelte compiler config (no global runes)
- `apps/frontend/tsconfig.json` -- TypeScript configuration
- Live `svelte-check` run on codebase -- 11 errors in 3 files, all in voter routes
- Live grep audit on codebase -- 1 commented `$:`, zero executing legacy patterns

### Secondary (MEDIUM confidence)
- `.planning/phases/26-validation-gate/26-CONTEXT.md` -- User decisions and audit boundaries

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all tools already installed, versions verified from catalog
- Architecture: HIGH -- validation commands tested live, results documented
- Pitfalls: HIGH -- based on actual codebase state, not hypothetical issues

**Research date:** 2026-03-19
**Valid until:** 2026-04-02 (14 days -- codebase may change if other work proceeds)
