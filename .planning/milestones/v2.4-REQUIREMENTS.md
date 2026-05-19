# Requirements: v2.4 Full Svelte 5 Rewrite

**Milestone:** v2.4
**Created:** 2026-03-27
**Status:** Active

## Goal

Complete the Svelte 5 migration by rewriting the context system from Svelte 4 stores to native runes ($state/$derived), migrating all remaining legacy files, globally enabling runes mode, and fixing all skipped E2E tests.

**Success criteria:** Zero imports from `svelte/store` in frontend app code, global runes mode enabled, all E2E tests passing (no skips).

---

## Requirements

### R1: Utility Store Rewrites

Replace the 3 custom store utilities that underpin all contexts with native Svelte 5 equivalents.

| ID | Requirement | Priority | Notes |
|----|------------|----------|-------|
| R1.1 | Replace `parsimoniusDerived` with native `$derived` | P1 | Used ~20 times across contexts |
| R1.2 | Replace `storageStore` with `$state` + localStorage wrapper | P1 | Used for persistent user preferences |
| R1.3 | Replace `stackedStore` with `$state`-based stack | P1 | Used for navigation/modal state |
| R1.4 | Remove all custom store utility files after migration | P1 | Clean up dead code |

**Acceptance:** No imports of custom store utilities remain. Unit tests pass.

### R2: Context Module Rewrites

Rewrite all 9 context modules from Svelte 4 store internals to $state/$derived.

| ID | Requirement | Priority | Notes |
|----|------------|----------|-------|
| R2.1 | Rewrite I18nContext to use $state/$derived | P1 | Leaf context, no downstream context deps |
| R2.2 | Rewrite LayoutContext to use $state/$derived | P1 | Leaf context; includes tweened progress |
| R2.3 | Rewrite AuthContext to use $state/$derived | P1 | Leaf context; SSR-safe required |
| R2.4 | Rewrite ComponentContext to use $state/$derived | P1 | Mid-level; consumed by App contexts |
| R2.5 | Rewrite DataContext with DataRoot version counter | P1 | Critical: DataRoot mutable-in-place needs version counter for $derived reactivity |
| R2.6 | Rewrite AppContext to use $state/$derived | P1 | Depends on Component + Data contexts |
| R2.7 | Rewrite VoterContext to use $state/$derived | P1 | ~20 derived stores; depends on App |
| R2.8 | Rewrite CandidateContext to use $state/$derived | P1 | Depends on App |
| R2.9 | Rewrite AdminContext to use $state/$derived | P1 | Depends on App |
| R2.10 | Preserve existing context API shape (getXxxContext/initXxxContext) | P1 | Minimize consumer-side changes |
| R2.11 | Rename .ts context files to .svelte.ts where runes are used | P1 | Required for $state/$derived in non-component files |
| R2.12 | Ensure SSR safety — no module-level $state that leaks across requests | P1 | Use setContext/getContext factory pattern |

**Acceptance:** All contexts use $state/$derived internally. No `writable()`, `derived()`, or `Readable<T>` imports from `svelte/store` in context files. SSR works correctly.

### R3: Consumer Component Updates

Update all components that consume contexts to use direct property access instead of store subscriptions.

| ID | Requirement | Priority | Notes |
|----|------------|----------|-------|
| R3.1 | Update all `$store` references to direct property access in components | P1 | ~141 consumer components |
| R3.2 | Remove `svelte/store` imports from consumer components | P1 | Mechanical cleanup |
| R3.3 | Update reactive declarations using context stores | P1 | `$: value = $store` -> `$derived` or direct access |

**Acceptance:** Zero `$store` syntax referencing context values. All components render correctly. Unit tests pass.

### R4: $app/stores Migration

Migrate from deprecated `$app/stores` to `$app/state`.

| ID | Requirement | Priority | Notes |
|----|------------|----------|-------|
| R4.1 | Replace all `$app/stores` `page` imports with `$app/state` page | P1 | 5-11 files affected |
| R4.2 | Replace all `$app/stores` `navigating` imports with `$app/state` | P1 | If used |
| R4.3 | Zero imports from `$app/stores` | P1 | Deprecated since SvelteKit 2.12 |

**Acceptance:** No imports from `$app/stores`. Fine-grained reactivity via `$app/state` confirmed working.

### R5: Legacy File Migration

Migrate all remaining Svelte 4 syntax files to Svelte 5 runes.

| ID | Requirement | Priority | Notes |
|----|------------|----------|-------|
| R5.1 | Migrate root +layout.svelte to runes ($props, $effect, {#snippet}) | P1 | Highest-risk file — initializes all contexts |
| R5.2 | Migrate admin route files to runes | P1 | ~10 files with `export let data` |
| R5.3 | Migrate shared layout components to runes | P1 | Files still using `<slot>`, `$:`, `export let` |
| R5.4 | Replace all `<slot>` with `{#snippet}`/`{@render}` in remaining files | P1 | Required for global runes |
| R5.5 | Replace all `$:` reactive declarations with `$derived`/`$effect` | P1 | Required for global runes |
| R5.6 | Replace all `export let` with `$props()` in remaining files | P1 | Required for global runes |

**Acceptance:** Zero Svelte 4 syntax in any .svelte file. All files compatible with global runes mode.

### R6: Global Runes Enablement

Enable runes mode globally and remove per-file opt-ins.

| ID | Requirement | Priority | Notes |
|----|------------|----------|-------|
| R6.1 | Enable runes via dynamicCompileOptions in svelte.config.js | P1 | Must exclude node_modules for third-party lib compat |
| R6.2 | Remove all `<svelte:options runes />` directives | P1 | ~151 per-file opt-ins |
| R6.3 | Verify third-party Svelte libraries work under global runes | P1 | svelte-visibility-change, others |
| R6.4 | Build succeeds with zero warnings related to runes mode | P1 | Clean build |

**Acceptance:** Global runes enabled. No per-file opt-ins. Build clean. All third-party libs working.

### R7: E2E Test Fixes

Fix all skipped E2E tests.

| ID | Requirement | Priority | Notes |
|----|------------|----------|-------|
| R7.1 | Fix pushState reactivity E2E tests (previously fixme'd) | P1 | 3 tests; likely fixed by $app/state migration |
| R7.2 | Fix remaining skipped E2E tests | P1 | 7 additional skipped tests |
| R7.3 | All E2E tests passing (zero skips) | P1 | Final validation |

**Acceptance:** `yarn test:e2e` passes with zero skipped tests.

---

## Non-Functional Requirements

| ID | Requirement | Priority |
|----|------------|----------|
| NF1 | No performance regressions — page load and interaction times maintained | P1 |
| NF2 | SSR continues to work correctly — no hydration mismatches | P1 |
| NF3 | No new TypeScript errors — strict mode maintained | P1 |
| NF4 | Unit tests pass throughout migration (no regressions) | P1 |

---

## Out of Scope

- Admin app feature development (only migrating existing admin routes to runes)
- Data adapter rewrites (Supabase adapter internals unchanged)
- Package-level changes (core, data, matching, filters packages unchanged)
- New component development
- Svelte 5 `createContext()` API (preserve existing setContext/getContext pattern for now)

---

## Constraints

- Migration must be bottom-up (utilities -> leaf contexts -> mid-level -> app contexts -> consumers -> global runes)
- Context API shape (getXxxContext/initXxxContext) must be preserved to minimize consumer changes
- DataRoot version counter pattern required for mutable-in-place reactivity bridging
- dynamicCompileOptions needed (not compilerOptions.runes: true) to exclude node_modules
- Root +layout.svelte is highest-risk and should be migrated last among layout files

---

## Dependencies

- Svelte 5.53.12+ (already installed)
- SvelteKit 2.55.0+ with $app/state (already installed)
- No external dependency additions required

---

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| R1.1 | Phase 49 | Complete |
| R1.2 | Phase 49 | Complete |
| R1.3 | Phase 49 | Complete |
| R1.4 | Phase 49 | Complete |
| R2.1 | Phase 50 | Complete |
| R2.2 | Phase 50 | Pending |
| R2.3 | Phase 50 | Pending |
| R2.4 | Phase 51 | Complete |
| R2.5 | Phase 51 | Complete |
| R2.6 | Phase 51 | Complete |
| R2.7 | Phase 52 | Pending |
| R2.8 | Phase 52 | Pending |
| R2.9 | Phase 52 | Pending |
| R2.10 | Phase 50-52 | Complete |
| R2.11 | Phase 50-52 | Complete |
| R2.12 | Phase 50-52 | Complete |
| R3.1 | Phase 50-52 | Complete |
| R3.2 | Phase 50-52 | Complete |
| R3.3 | Phase 50-52 | Complete |
| R4.1 | Phase 50 | Pending |
| R4.2 | Phase 50 | Pending |
| R4.3 | Phase 50 | Pending |
| R5.1 | Phase 53 | Complete |
| R5.2 | Phase 53 | Pending |
| R5.3 | Phase 53 | Complete |
| R5.4 | Phase 53 | Complete |
| R5.5 | Phase 53 | Complete |
| R5.6 | Phase 53 | Complete |
| R6.1 | Phase 54 | Complete |
| R6.2 | Phase 54 | Complete |
| R6.3 | Phase 54 | Complete |
| R6.4 | Phase 54 | Complete |
| R7.1 | Phase 55 | Complete |
| R7.2 | Phase 55 | Complete |
| R7.3 | Phase 55 | Partial (zero skips; 19 pre-existing failures unrelated to Svelte 5) |
| NF1 | All phases | Pending |
| NF2 | All phases | Pending |
| NF3 | All phases | Pending |
| NF4 | All phases | Pending |
