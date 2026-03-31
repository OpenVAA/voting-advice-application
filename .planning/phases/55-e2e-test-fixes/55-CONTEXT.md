# Phase 55: E2E Test Fixes - Context

**Gathered:** 2026-03-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Validate that all E2E tests pass after the full Svelte 5 migration (Phases 50-54). Fix any regressions introduced by the context rewrites, legacy file migration, and global runes enablement. The "10 skipped tests" referenced in the roadmap are not currently present in spec files — they may emerge as regressions during migration or may already be resolved.

</domain>

<decisions>
## Implementation Decisions

### Claude's Full Discretion
User deferred all decisions to Claude. This phase is reactive — the work depends on what breaks:
1. Run `yarn test:e2e` against the fully-migrated codebase
2. Identify any failures or regressions
3. Trace each failure to the specific context rewrite or migration that caused it
4. Fix regressions while preserving the Svelte 5 rune patterns established in Phases 50-54
5. Verify all tests pass with zero skips and zero failures

If no tests fail (migration was clean), this phase completes immediately as validation-only.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### E2E test infrastructure
- `tests/playwright.config.ts` — Full Playwright config with project dependencies
- `tests/tests/specs/` — All E2E spec files (voter, candidate, variant suites)

### Context rewrites (potential regression sources)
- All context files rewritten in Phases 50-52
- Root +layout.svelte rewritten in Phase 53
- Global runes enabled in Phase 54

</canonical_refs>

<code_context>
## Existing Code Insights

### Current State
- Zero skipped/fixme'd tests in any spec file
- 50 E2E specs across voter, candidate, and variant suites
- Tests depend on correct reactivity for page navigation, form submission, auth flows
- Context rewrites change how reactivity propagates — most likely regression source

### Potential Failure Patterns
- Store subscriptions that drove test assertions now use direct $state access
- Async data loading via $effect instead of $: may change timing
- Root layout's data loading pattern change could affect initial page render
- VisibilityChange event handling change could affect tracking tests

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 55-e2e-test-fixes*
*Context gathered: 2026-03-28*
