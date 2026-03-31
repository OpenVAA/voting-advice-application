# Phase 55: E2E Test Fixes - Research

**Researched:** 2026-03-28
**Domain:** Playwright E2E tests / Svelte 5 reactivity validation
**Confidence:** HIGH

## Summary

This phase validates the complete Svelte 5 migration (Phases 50-54) by running the full E2E test suite and fixing any failures. The current codebase has **3 `test.fixme` calls** and **1 FIXME comment** (non-skipping) across 4 spec files. These represent known reactivity issues that the migration should resolve -- they were placed because the partially-migrated state had broken reactivity for specific patterns (tab switching in results layout, single-section display after settings reload, and showResultsLink visibility).

After Phases 50-54 complete, the contexts will use `$state`/`$derived` natively, `$app/stores` will be replaced with `$app/state`, and all consumer components will use direct property access. This should resolve the reactivity issues that caused these tests to be fixme'd. However, the migration may also introduce NEW regressions that this phase must catch and fix.

**Primary recommendation:** Run `yarn test:e2e` against the fully-migrated codebase. Remove all `test.fixme` markers and the FIXME comment, run the full suite, then diagnose and fix any failures. This phase is reactive -- the work depends entirely on what breaks.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
None -- user deferred all decisions to Claude. This phase is reactive:
1. Run `yarn test:e2e` against the fully-migrated codebase
2. Identify any failures or regressions
3. Trace each failure to the specific context rewrite or migration that caused it
4. Fix regressions while preserving the Svelte 5 rune patterns established in Phases 50-54
5. Verify all tests pass with zero skips and zero failures

If no tests fail (migration was clean), this phase completes immediately as validation-only.

### Claude's Discretion
All implementation decisions.

### Deferred Ideas (OUT OF SCOPE)
None.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| R7.1 | Fix pushState reactivity E2E tests (previously fixme'd) | See "Known Fixme'd Tests" section -- 3 tests are marked `test.fixme` related to settings/section reactivity. The voter-detail FIXME comment references tab switching (`$state` mutation in `handleEntityTabChange`). After Phase 52's VoterContext rewrite, these reactivity patterns will use native `$state`/`$derived` instead of Svelte stores, which should resolve the underlying issue. |
| R7.2 | Fix remaining skipped E2E tests | The "10 previously skipped tests" from the original roadmap no longer exist as distinct items. Current count: 3 `test.fixme` + 1 FIXME comment. The bank-auth `test.skip` is conditional and environment-dependent (not migration-related). Any new failures from Phases 50-54 will need diagnosis. |
| R7.3 | All E2E tests passing (zero skips) | Full suite command: `yarn test:e2e`. Must complete with 0 skipped, 0 failed. The bank-auth conditional skip is behind `PLAYWRIGHT_BANK_AUTH=1` env gate and does not run in default suite. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @playwright/test | 1.58.2 | E2E test framework | Already installed, all specs written against it |
| Svelte | 5.53.12 | Frontend framework (post-migration) | Target version for runes/reactivity |
| SvelteKit | 2.55.0 | App framework | Target version with `$app/state` |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| dotenv | 17.3.1 | Env loading for Playwright | Already used in playwright.config.ts |

**No new dependencies needed.** This phase operates entirely within the existing test infrastructure.

## Architecture Patterns

### E2E Test Infrastructure Structure
```
tests/
  playwright.config.ts          # Project config with dependency chains
  tests/
    fixtures/
      voter.fixture.ts          # answeredVoterPage fixture
      index.ts                  # Shared fixtures re-export
    setup/
      data.setup.ts             # Imports test dataset
      auth.setup.ts             # Logs in candidate
      re-auth.setup.ts          # Re-authenticates after mutation tests
      variant-*.setup.ts        # Variant dataset setups
    specs/
      voter/                    # 7 voter spec files
      candidate/                # 7 candidate spec files (1 bank-auth behind env gate)
      variants/                 # 4 variant spec files
      perf/                     # Performance budget (behind env gate)
      visual/                   # Visual regression (behind env gate)
    utils/
      testIds.ts                # Central test ID constants
      buildRoute.ts             # Route builder
      supabaseAdminClient.ts    # Direct DB manipulation
      voterNavigation.ts        # Navigation helpers
```

### Playwright Project Dependency Chain
The E2E suite uses a complex dependency pattern in `playwright.config.ts`:
- `data-setup` -> `auth-setup` -> `candidate-app` -> `candidate-app-mutation` -> `re-auth-setup` -> `candidate-app-settings` -> `candidate-app-password`
- `data-setup` -> `voter-app` (read-only specs)
- `data-setup` -> `voter-app-settings` -> `voter-app-popups` (serial, settings-mutating)
- After all default specs: variant chain (`data-setup-multi-election` -> `variant-multi-election` -> `variant-results-sections` -> `data-setup-constituency` -> `variant-constituency` -> `data-setup-startfromcg` -> `variant-startfromcg`)

**Critical:** Test failures cascade through dependencies. A failure in `data-setup` blocks ALL downstream tests. A failure in `candidate-app` blocks all candidate mutation/settings/password tests.

### Pattern: Fix-and-Verify Loop
```
1. Run full suite: yarn test:e2e
2. Collect failures (including "did not run" = cascade failures)
3. Identify root failures (earliest in dependency chain)
4. Trace root failure to specific context change
5. Fix in app code (NOT test code unless test assumptions changed)
6. Re-run affected project only: npx playwright test -c tests/playwright.config.ts --project=<name>
7. Repeat until clean, then full suite again
```

### Anti-Patterns to Avoid
- **Fixing tests instead of app code:** Most failures will be reactivity regressions in components/layouts, NOT test bugs. Fix the application code.
- **Changing test.fixme to test.skip:** The goal is zero skips. Remove fixme markers and make the tests pass.
- **Running full suite on every change:** Use `--project=<name>` to isolate. Full suite takes minutes; isolated projects take seconds.
- **Ignoring cascade failures:** "Did not run" tests ARE failures. Count them. Fix the root cause upstream.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Test data management | Custom DB seed scripts | Existing `data.setup.ts` and `SupabaseAdminClient` | Already handles all data lifecycle |
| Route building | Hardcoded URL strings | `buildRoute()` from `tests/tests/utils/buildRoute.ts` | Handles locale, route params consistently |
| Voter journey navigation | Manual click sequences | `voter.fixture.ts` `answeredVoterPage` | Handles intro/category dismissal, auto-advance timing |
| Settings mutation | Direct SQL | `SupabaseAdminClient.updateAppSettings()` | Already used by all settings-mutating specs |

## Known Fixme'd Tests

### Test 1: voter-detail -- party tab switching (FIXME comment, NOT skipped)
**File:** `tests/tests/specs/voter/voter-detail.spec.ts:115-155`
**Issue:** Tab switching between candidates and parties on results page. `handleEntityTabChange` mutates `activeEntityType` via `$state`, but the template re-render for the `voter-results-party-section` test-id div doesn't trigger.
**Root cause:** In the results `+layout.svelte`, `activeEntityType` is a `let` variable (Svelte 4 pattern). After Phase 52, this becomes a proper `$state` variable inside a context with reactive consumers. The tab-based section switching should propagate correctly.
**Post-migration expectation:** This test should pass without changes. If it doesn't, investigate whether `activeEntityType` reactivity is properly propagating through `$derived` chains.

### Test 2: results-sections -- candidates-only (test.fixme)
**File:** `tests/tests/specs/variants/results-sections.spec.ts:263-288`
**Issue:** When `results.sections` is set to `["candidate"]` via settings update + reload, the results page should show only candidates with no entity tabs. Currently fixme'd because the settings change doesn't propagate correctly after page reload.
**Root cause:** The `entityTypes` derived store in voterContext (`derived(appSettings, ...)`) needs to react to changed settings. After Phase 52's VoterContext rewrite, `entityTypes` will be a `$derived` that reads from `$state`-backed `appSettings`. Reload re-initializes the context with fresh settings from the server.
**Post-migration expectation:** Should pass. The `nominationAndQuestionStore` filters entity types based on `entityTypes`, and the results layout checks `Object.keys($matches[...]).length > 1` for tab visibility.

### Test 3: results-sections -- organizations-only (test.fixme)
**File:** `tests/tests/specs/variants/results-sections.spec.ts:290-315`
**Issue:** Same as Test 2 but with `sections: ["organization"]`. Identical root cause.

### Test 4: voter-settings -- showResultsLink hidden (test.fixme)
**File:** `tests/tests/specs/voter/voter-settings.spec.ts:486-504`
**Issue:** When `showResultsLink: false` is set, the results link in the question banner should be hidden. The `questions/+layout.svelte` reads `$appSettings.questions.showResultsLink` and conditionally shows/hides the link in `topBarSettings.push()`. After reload, the layout re-initializes with the new settings.
**Root cause:** The `topBarSettings.push()` call runs during component initialization, reading `$appSettings` at that point. If `appSettings` is a Svelte 4 store, the push happens once with the initial value. After Phase 52, `appSettings` is a `$state`-backed value, and the layout re-initializes correctly on page reload.
**Post-migration expectation:** Should pass after reload since the page re-creates the layout component with fresh settings.

### NOT a migration issue: bank-auth conditional skip
**File:** `tests/tests/specs/candidate/candidate-bank-auth.spec.ts:199`
**Pattern:** `test.skip(!createdUserId, 'Skipped: Edge Function keys not configured for full integration')`
**Note:** This is a legitimate environment-dependent conditional skip in a spec that's behind `PLAYWRIGHT_BANK_AUTH=1` env gate. It does NOT run in the default `yarn test:e2e` suite. Not relevant to this phase.

## Common Pitfalls

### Pitfall 1: Confusing test.fixme removal with test fixing
**What goes wrong:** Removing `test.fixme` markers before the underlying app code is fixed causes test failures.
**Why it happens:** `test.fixme` causes Playwright to skip the test. Removing it makes it run. If the app code hasn't been fixed by Phases 50-54, the test still fails.
**How to avoid:** First run the suite AS-IS (with fixme markers) to establish baseline. Then remove fixme markers and see which tests now pass vs fail. Only then fix remaining failures.
**Warning signs:** Tests that were fixme'd now fail with the same error described in the FIXME comment.

### Pitfall 2: Cascade failures masking root causes
**What goes wrong:** A single failure in `data-setup` causes 80+ tests to show as "did not run," making the actual problem hard to find.
**Why it happens:** Playwright's project dependency system skips all downstream projects when a dependency fails.
**How to avoid:** Always look at the FIRST failure in the dependency chain. Use `--project=data-setup` to isolate.
**Warning signs:** Large numbers of "did not run" tests. All tests in a project failing simultaneously.

### Pitfall 3: $state reactivity in layout components vs page components
**What goes wrong:** $state mutations in layout `+layout.svelte` files don't trigger re-renders in child `+page.svelte` files.
**Why it happens:** Svelte 5 reactivity boundaries work differently between layouts and pages. A `$state` variable in a layout that is read in the layout's own template works fine, but if the layout passes it to children via `{@render}` or context, the reactivity chain must be unbroken.
**How to avoid:** Ensure all reactive values that cross component boundaries are either: (a) passed via context (Phase 52 pattern), (b) passed as props (triggers re-render), or (c) use `$derived` in the consuming component. The results `+layout.svelte` uses local `$state` variables (`activeEntityType`, `activeMatches`, `entityTabs`) that are read directly in the same file's template -- this should work fine post-migration.
**Warning signs:** UI not updating when clicking tabs or changing settings, despite state change being logged.

### Pitfall 4: $app/stores vs $app/state semantics
**What goes wrong:** `$app/state` page is a raw object, not a store. Code that destructures `$page` via auto-subscription breaks.
**Why it happens:** Phase 50 migrates all `$app/stores` to `$app/state`. The `page` from `$app/state` is not a store and doesn't use `$` prefix for auto-subscription. The results layout currently does `import { page } from '$app/stores'` and uses `$page.route`, `$page.params`, etc.
**How to avoid:** After migration, verify that `page.route`, `page.params`, `page.url` (no `$` prefix) are used correctly in all layout and page files that the E2E tests exercise.
**Warning signs:** `$page is not a function` or `Cannot read properties of undefined (reading 'route')` errors in browser console during E2E tests.

### Pitfall 5: Timing changes in $effect vs $: reactive declarations
**What goes wrong:** Tests that depend on synchronous reactivity break because `$effect` runs asynchronously (after DOM update).
**Why it happens:** Svelte 4 `$:` reactive declarations run synchronously before the next DOM update. Svelte 5 `$effect` runs after the DOM update. Test assertions that relied on immediate reactivity may need to add `waitFor` or increase timeouts.
**How to avoid:** After fixing app code, if a test still fails on timing, add explicit waits (`page.waitForSelector`, `expect(...).toBeVisible({ timeout: N })`) rather than trying to make the app code synchronous.
**Warning signs:** Tests intermittently passing/failing. Assertions that pass with increased timeouts.

### Pitfall 6: Context initialization order after root layout migration
**What goes wrong:** Contexts that depend on other contexts fail to initialize because the root `+layout.svelte` initialization order changed in Phase 53.
**Why it happens:** Root layout migration to runes changes when contexts are initialized. If `$effect` is used for initialization (instead of synchronous init), downstream contexts may access uninitialized upstream contexts.
**How to avoid:** Context initialization must remain synchronous in component script setup, not inside `$effect`. Phase 50-52 patterns use `setContext`/`getContext` factory pattern with synchronous init.
**Warning signs:** `getXxxContext() called before initXxxContext()` errors during page load in E2E tests.

## Code Examples

### Removing test.fixme markers
```typescript
// BEFORE: Test is skipped
test.fixme('should show only candidates when sections is ["candidate"]', async () => {
  // test body
});

// AFTER: Test runs normally
test('should show only candidates when sections is ["candidate"]', async () => {
  // test body -- same
});
```

### Running isolated Playwright projects
```bash
# Run just the voter-app project
npx playwright test -c tests/playwright.config.ts --project=voter-app

# Run just the variant-results-sections project (requires data-setup chain)
npx playwright test -c tests/playwright.config.ts --project=variant-results-sections

# Run with specific spec file
npx playwright test -c tests/playwright.config.ts tests/tests/specs/voter/voter-detail.spec.ts

# Show trace viewer for debugging failures
npx playwright show-trace tests/playwright-results/<trace-file>
```

### Post-migration results layout reactivity pattern (expected)
```svelte
<!-- After Phases 50-52, the results layout will look like this: -->
<script lang="ts">
  // Contexts return reactive objects (no $ prefix needed)
  const { matches, elections, appSettings, ... } = getVoterContext();
  // $app/state instead of $app/stores
  import { page } from '$app/state';

  // Local state for tab management
  let activeEntityType = $state<EntityType | undefined>(undefined);

  // Derived from reactive context values (no $derived wrapper needed
  // for simple property access in the template)
  $effect(() => {
    if (activeElectionId) {
      // matches is reactive, reading it triggers updates
      entityTabs = Object.keys(matches[activeElectionId]).map(/*...*/);
    }
  });
</script>

<!-- Template reads reactive values directly -->
{#if Object.keys(matches[activeElectionId]).length > 1}
  <Tabs tabs={entityTabs} onChange={handleEntityTabChange} />
{/if}
```

### Debugging E2E failures with trace
```bash
# After a failure, traces are stored in tests/playwright-results/
# Open the trace viewer:
npx playwright show-trace tests/playwright-results/<test-name>-trace.zip

# Or view the HTML report:
npx playwright show-report tests/playwright-report
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `$app/stores` page | `$app/state` page | SvelteKit 2.12+ | Direct object access, no auto-subscription |
| `derived()` store | `$derived()` rune | Svelte 5 | Synchronous tracking, no store subscription |
| `writable()` store | `$state()` rune | Svelte 5 | Direct mutation, automatic tracking |
| `$:` reactive declarations | `$effect()` / `$derived()` | Svelte 5 | Async effects, explicit derivations |

## Open Questions

1. **Will Phases 50-54 resolve all fixme'd tests or introduce new failures?**
   - What we know: The 3 fixme'd tests + 1 FIXME comment all relate to reactivity patterns that Phases 50-54 rewrites. The root causes (store-based reactivity not propagating through settings updates or tab changes) should be resolved by native `$state`/`$derived`.
   - What's unclear: The migration may introduce NEW failures in tests that currently pass. The full 83-test suite has many reactivity-dependent assertions.
   - Recommendation: Run the full suite immediately after Phases 50-54 complete, BEFORE attempting any fixes. Capture the complete failure set.

2. **Are there timing-sensitive tests that may become flaky?**
   - What we know: `$effect` runs asynchronously vs `$:` synchronous. Tests with tight timing (auto-advance after click, dialog dismissal) may be affected.
   - What's unclear: Which specific tests are timing-sensitive enough to break.
   - Recommendation: If a test fails intermittently, increase timeout/add explicit wait rather than making app code synchronous.

3. **Does the results layout's local $state pattern survive the migration?**
   - What we know: The results `+layout.svelte` uses local `$state` variables for entity tab management. These are NOT context values -- they're local to the layout component. Phase 52 doesn't touch these.
   - What's unclear: Whether the FIXME comment's issue (tab switching not triggering re-renders) is caused by the local state or by the context's `matches` store not being reactive.
   - Recommendation: After Phase 52, test the party tab switching first. If it still fails, investigate whether `matches` is properly reactive when read from context (no `$` prefix needed post-migration).

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Playwright 1.58.2 |
| Config file | `tests/playwright.config.ts` |
| Quick run command | `npx playwright test -c tests/playwright.config.ts --project=voter-app` |
| Full suite command | `yarn test:e2e` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| R7.1 | Tab switching reactivity in results layout | e2e | `npx playwright test -c tests/playwright.config.ts tests/tests/specs/voter/voter-detail.spec.ts` | Yes (voter-detail.spec.ts:118) |
| R7.1 | Single-section display (candidates only) | e2e | `npx playwright test -c tests/playwright.config.ts --project=variant-results-sections` | Yes (results-sections.spec.ts:263) |
| R7.1 | Single-section display (organizations only) | e2e | `npx playwright test -c tests/playwright.config.ts --project=variant-results-sections` | Yes (results-sections.spec.ts:290) |
| R7.1 | showResultsLink hidden when false | e2e | `npx playwright test -c tests/playwright.config.ts --project=voter-app-settings` | Yes (voter-settings.spec.ts:486) |
| R7.2 | Any regressions from Phases 50-54 | e2e | `yarn test:e2e` | Yes (full suite) |
| R7.3 | Zero skips, zero failures in full suite | e2e | `yarn test:e2e` | Yes (full suite) |

### Sampling Rate
- **Per fix:** Run the affected project only via `--project=<name>`
- **After all fixes:** Full suite `yarn test:e2e`
- **Phase gate:** Full suite green with zero skips, zero failures

### Wave 0 Gaps
None -- existing test infrastructure covers all phase requirements. No new tests need to be written; all tests already exist but are fixme'd or have FIXME comments.

## Project Constraints (from CLAUDE.md)

- **TypeScript strict mode:** Avoid `any`, prefer explicit types
- **Test accessibility:** WCAG 2.1 AA compliant
- **No secrets in commits:** Never commit API keys, tokens, .env files
- **Code review checklist:** Follow `.agents/code-review-checklist.md`
- **Monorepo build:** Run `yarn build` after package changes; Turborepo handles caching
- **E2E requires Supabase:** `yarn dev` must be running before `yarn test:e2e`
- **MISSING_VALUE:** Use from `@openvaa/core` in matching contexts

## Sources

### Primary (HIGH confidence)
- Direct codebase inspection of all 4 affected spec files
- `tests/playwright.config.ts` -- full project dependency structure
- `apps/frontend/src/routes/(voters)/(located)/results/+layout.svelte` -- results layout reactivity patterns
- `apps/frontend/src/routes/(voters)/(located)/questions/+layout.svelte` -- showResultsLink pattern
- `apps/frontend/src/lib/contexts/voter/voterContext.ts` -- context store patterns
- Phase 50-52 CONTEXT.md files -- planned migration patterns

### Secondary (MEDIUM confidence)
- Commit history for voter-detail.spec.ts -- prior hydration bug fix (7bbf11bff) confirms pattern
- REQUIREMENTS.md R7.1-R7.3 requirements

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - No new libraries; existing infrastructure only
- Architecture: HIGH - Full codebase inspection of all relevant files
- Pitfalls: HIGH - Based on observed patterns from prior migration work (commit 7bbf11bff hydration fix) and Svelte 5 reactivity model
- Known tests: HIGH - Exact file/line locations identified for all 4 fixme'd/FIXME'd tests
- Post-migration behavior: MEDIUM - Cannot confirm resolution until Phases 50-54 complete; predictions based on planned migration patterns

**Research date:** 2026-03-28
**Valid until:** 2026-04-07 (valid until Phases 50-54 complete and codebase state is known)
