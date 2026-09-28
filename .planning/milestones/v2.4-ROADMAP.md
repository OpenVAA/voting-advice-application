# Roadmap: v2.4 Full Svelte 5 Rewrite

## Overview

Complete the Svelte 5 migration by rewriting the entire context system from Svelte 4 stores to native runes ($state/$derived), migrating all remaining legacy files to runes syntax, globally enabling runes mode, and fixing all skipped E2E tests. The migration proceeds bottom-up: utility stores first, then contexts in dependency order (leaf -> mid-level -> app-specific), each with atomic consumer updates, then legacy files, global runes enablement, and finally E2E validation.

## Phases

**Phase Numbering:**
- Continues from v2.3 (last phase: 48)
- Integer phases (49, 50, ...): Planned milestone work
- Decimal phases (50.1, 50.2): Urgent insertions (marked with INSERTED)

- [x] **Phase 49: Core Infrastructure** - Replace 3 custom store utilities with Svelte 5 rune equivalents (completed 2026-03-27)
- [ ] **Phase 50: Leaf Context Rewrite** - Rewrite I18n, Layout, Auth contexts + $app/state migration + consumer updates
- [x] **Phase 51: Mid-Level Context Rewrite** - Rewrite Component, Data (with version counter), App contexts + consumer updates (completed 2026-03-28)
- [ ] **Phase 52: App Context Rewrite** - Rewrite Voter, Candidate, Admin contexts + all remaining consumer updates
- [x] **Phase 53: Legacy File Migration** - Migrate root layout, admin routes, and shared layout components to runes (completed 2026-03-28)
- [x] **Phase 54: Global Runes Enablement** - Enable runes globally via dynamicCompileOptions, remove 151 per-file opt-ins (completed 2026-03-28)
- [x] **Phase 55: E2E Test Fixes** - Fix all skipped E2E tests and validate full migration (completed 2026-03-28)

## Phase Details

### Phase 49: Core Infrastructure
**Goal**: The 3 custom store utilities that underpin all contexts are replaced with Svelte 5 equivalents, establishing the foundation for all context rewrites
**Depends on**: Nothing (first phase of v2.4)
**Requirements**: R1.1, R1.2, R1.3, R1.4
**Success Criteria** (what must be TRUE):
  1. `parsimoniusDerived` utility is removed and all its usages documented for replacement with native `$derived` during context rewrites
  2. `storageStore` (localStorage/sessionStorage) is replaced with a `$state` + `$effect` persistence utility that correctly round-trips data (write on change, read on init)
  3. `stackedStore` is replaced with a `$state`-based StackedState class that preserves push/pop/revert semantics
  4. No imports of the old custom store utility files remain in the codebase
  5. Build succeeds and all unit tests pass
**Plans:** 2/2 plans complete
Plans:
- [x] 49-01-PLAN.md — Create new rune-based utility files (persistedState, StackedState, memoizedDerived) with tests
- [x] 49-02-PLAN.md — Migrate all consumers to new utilities and delete old files

### Phase 50: Leaf Context Rewrite
**Goal**: The 3 leaf contexts (I18n, Layout, Auth) use native $state/$derived internally, $app/stores is fully migrated to $app/state, and all components consuming these contexts are updated
**Depends on**: Phase 49
**Requirements**: R2.1, R2.2, R2.3, R2.10, R2.11, R2.12, R4.1, R4.2, R4.3, R3.1 (partial), R3.2 (partial), R3.3 (partial)
**Success Criteria** (what must be TRUE):
  1. I18nContext, LayoutContext, and AuthContext use `$state`/`$derived` internally with zero `svelte/store` imports
  2. All context files using runes are renamed from `.ts` to `.svelte.ts`
  3. All `$app/stores` imports are replaced with `$app/state` across the entire codebase (zero `$app/stores` imports remain)
  4. All components consuming I18n, Layout, or Auth context use direct property access (no `$store` syntax for these contexts)
  5. SSR works correctly with no hydration mismatches for these contexts
  6. Build succeeds and all unit tests pass
**Plans:** 2/3 plans executed
Plans:
- [x] 50-01-PLAN.md — Rewrite I18nContext to plain values + update all $locale/$locales consumer components
- [ ] 50-02-PLAN.md — Rewrite AuthContext to $derived + migrate all $app/stores to $app/state
- [x] 50-03-PLAN.md — Rewrite LayoutContext to $state/Tween + update Layout consumers (incl. Header/Banner runes conversion)

### Phase 51: Mid-Level Context Rewrite
**Goal**: Component, Data, and App contexts use native $state/$derived, with DataRoot reactivity bridged via version counter, and all components consuming these contexts are updated
**Depends on**: Phase 50
**Requirements**: R2.4, R2.5, R2.6, R2.10, R2.11, R2.12, R3.1 (partial), R3.2 (partial), R3.3 (partial)
**Success Criteria** (what must be TRUE):
  1. ComponentContext, DataContext, and AppContext use `$state`/`$derived` internally with zero `svelte/store` imports
  2. DataRoot mutable-in-place updates trigger `$derived` re-evaluation via version counter pattern (elections, questions, candidates update correctly after data load)
  3. AppContext correctly derives app settings, user preferences, popup queue, and survey link from $state-based dependencies
  4. All components consuming Component, Data, or App context use direct property access (no `$store` syntax for these contexts)
  5. Build succeeds and all unit tests pass
**Plans:** 2/2 plans complete
Plans:
- [x] 51-01-PLAN.md — Rewrite ComponentContext, darkMode, DataContext to $state/$derived + update 5 consumer components
- [x] 51-02-PLAN.md — Rewrite AppContext + sub-modules (tracking, survey, popup) with toStore() bridges for Phase 52 compat

### Phase 52: App Context Rewrite
**Goal**: Voter, Candidate, and Admin contexts use native $state/$derived, and zero $store context references remain anywhere in the codebase
**Depends on**: Phase 51
**Requirements**: R2.7, R2.8, R2.9, R2.10, R2.11, R2.12, R3.1 (remaining), R3.2 (remaining), R3.3 (remaining)
**Success Criteria** (what must be TRUE):
  1. VoterContext, CandidateContext, and AdminContext use `$state`/`$derived` internally with zero `svelte/store` imports
  2. VoterContext matching, filtering, question blocks, and answer persistence all work correctly with rune-based reactivity
  3. CandidateContext auth state, data writer methods, and pre-registration flow work correctly
  4. Zero `$store` syntax referencing context values remains anywhere in the codebase
  5. Zero `svelte/store` imports remain in any frontend context or component file (excluding node_modules)
  6. Build succeeds and all unit tests pass
**Plans:** 2/3 plans executed
Plans:
- [x] 52-01-PLAN.md — Rewrite all sub-modules, shared utils, and 3 main contexts from svelte/store to $state/$derived
- [x] 52-02-PLAN.md — Update all 46 voter + candidate consumer files to direct property access
- [ ] 52-03-PLAN.md — Update 14 admin consumers, delete memoizedDerived, grep sweep validation + build/test

### Phase 53: Legacy File Migration
**Goal**: All remaining Svelte 4 syntax files are migrated to runes, making every .svelte file in the codebase runes-compatible
**Depends on**: Phase 52
**Requirements**: R5.1, R5.2, R5.3, R5.4, R5.5, R5.6
**Success Criteria** (what must be TRUE):
  1. Root `+layout.svelte` uses `$props()`, `$derived`/`$effect`, `{@render children()}` with no Svelte 4 syntax
  2. All admin route files use `$props()` instead of `export let data` and runes for reactivity
  3. All shared layout components (Header, Banner, MaintenancePage, error page) use runes syntax
  4. Zero `<slot>`, `$:`, `export let`, `on:event`, or `<svelte:component>` syntax remains in any `.svelte` file
  5. Build succeeds and all unit tests pass
**Plans:** 3/3 plans complete
Plans:
- [x] 53-01-PLAN.md — Migrate shared layout components (Header, Banner, MaintenancePage, +error, PreviewColorContrast) to runes
- [x] 53-02-PLAN.md — Migrate all 10 admin route files to runes (mechanical bulk conversion)
- [x] 53-03-PLAN.md — Full runes rewrite of root +layout.svelte + whole-codebase zero-legacy verification
**UI hint**: yes

### Phase 54: Global Runes Enablement
**Goal**: Runes mode is enabled globally for all project files, all per-file opt-ins are removed, and the codebase enforces runes-only going forward
**Depends on**: Phase 53
**Requirements**: R6.1, R6.2, R6.3, R6.4
**Success Criteria** (what must be TRUE):
  1. `dynamicCompileOptions` in svelte.config.js enables runes for all non-node_modules files
  2. Zero `<svelte:options runes />` directives remain in the codebase (all 151 removed)
  3. Third-party Svelte libraries (svelte-visibility-change, etc.) work correctly under global runes
  4. Build succeeds with zero runes-related warnings
  5. All unit tests pass
**Plans:** 1/1 plans complete
Plans:
- [x] 54-01-PLAN.md — Enable global runes in svelte.config.js and remove all 151 per-file directives

### Phase 55: E2E Test Fixes
**Goal**: All previously fixme'd E2E tests pass and the full suite validates the complete Svelte 5 migration
**Depends on**: Phase 54
**Requirements**: R7.1, R7.2, R7.3
**Success Criteria** (what must be TRUE):
  1. The 3 test.fixme'd and 1 FIXME-commented E2E tests pass
  2. Any regressions from Phases 50-54 are fixed
  3. `yarn test:e2e` completes with zero skipped tests and zero failures
  4. No performance regressions observable in E2E test execution times
**Plans:** 2/2 plans complete
Plans:
- [x] 55-01-PLAN.md — Remove fixme markers, diagnose and fix all E2E test failures
- [x] 55-02-PLAN.md — Full E2E suite validation gate

## Progress

**Execution Order:**
Phases execute in numeric order: 49 -> 50 -> 51 -> 52 -> 53 -> 54 -> 55

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 49. Core Infrastructure | 2/2 | Complete    | 2026-03-27 |
| 50. Leaf Context Rewrite | 2/3 | In Progress|  |
| 51. Mid-Level Context Rewrite | 2/2 | Complete   | 2026-03-28 |
| 52. App Context Rewrite | 2/3 | In Progress|  |
| 53. Legacy File Migration | 3/3 | Complete   | 2026-03-28 |
| 54. Global Runes Enablement | 1/1 | Complete   | 2026-03-28 |
| 55. E2E Test Fixes | 2/2 | Complete   | 2026-03-28 |
