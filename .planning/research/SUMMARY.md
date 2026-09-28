# Research Summary: Svelte 5 Context System Rewrite

**Domain:** Frontend state management migration (Svelte stores -> Svelte 5 runes)
**Researched:** 2026-03-27
**Overall confidence:** HIGH

## Executive Summary

The OpenVAA frontend context system consists of 9 contexts across 40 TypeScript files, consuming 51 imports from `svelte/store`. These contexts form a hierarchical tree: I18n -> Component -> Data -> App -> Voter/Candidate/Admin, initialized in layout files and consumed by 141 Svelte components. The entire system must be rewritten from Svelte 4 store patterns (`writable`, `derived`, `Readable<T>`, `$store` subscriptions) to Svelte 5 runes (`$state`, `$derived`, direct property access).

The migration is well-scoped and low-risk because: (1) the existing context API shape (`getXxxContext()` / `initXxxContext()`) can be preserved while changing only the internal implementation; (2) the consumer-side change is almost entirely mechanical (remove `$` prefix from store references); (3) Svelte 5.53.12 and SvelteKit 2.55.0 provide all required features (`$app/state` since 2.12, `createContext` since 5.40).

Three custom store utilities (`parsimoniusDerived`, `storageStore`, `stackedStore`) serve as the foundation layer. `parsimoniusDerived` alone is used ~20 times and can be replaced entirely by native `$derived`. The `$app/stores` `page` dependency (5 files) moves to `$app/state`, which provides fine-grained reactivity that should resolve the pushState reactivity bug causing 3 skipped E2E tests. Sixteen legacy-mode files (root layout + admin app + shared layout components) must also be migrated to runes before global runes enablement.

## Key Findings

**Stack:** Svelte 5.53.12 + SvelteKit 2.55.0 -- all required APIs available. No dependency changes needed.
**Architecture:** 9 contexts, 40 store files, 141 consumers, 16 legacy files, 3 custom store utilities to replace.
**Critical pitfall:** DataRoot's mutable-in-place pattern with imperative `subscribe()` callback conflicts with Svelte 5 signal equality. Requires explicit version counter pattern.

## Implications for Roadmap

Based on research, suggested phase structure:

1. **Core Infrastructure** - Rewrite utility stores (parsimoniusDerived, storageStore, stackedStore)
   - Addresses: Foundation layer that all contexts depend on
   - Avoids: Cascading rewrites from bottom-up dependency changes

2. **Leaf Contexts** - I18nContext, LayoutContext, AuthContext
   - Addresses: Independent contexts with no downstream context consumers
   - Avoids: Blocking on mid-level dependencies

3. **Mid-Level Contexts** - ComponentContext, DataContext, AppContext
   - Addresses: The core context inheritance chain
   - Avoids: DataRoot reactivity pitfall (addressed with version counter)

4. **App Contexts** - VoterContext, CandidateContext, AdminContext
   - Addresses: App-specific derived state (matching, filtering, question blocks)
   - Avoids: Premature consumer updates before contexts stabilize

5. **Consumer Updates + Legacy Migration** - 141 components + 16 legacy files
   - Addresses: `$store` -> direct access, `$:` -> `$derived`/`$effect`
   - Avoids: Migration fatigue by batching mechanical changes

6. **Global Runes Enablement** - Remove per-file opt-ins, enable in svelte.config.js
   - Addresses: Codebase consistency
   - Avoids: Mixing legacy and runes mode

7. **E2E Test Fixes** - Fix 3 fixme'd E2E tests
   - Addresses: pushState reactivity, results-sections settings changes
   - Avoids: Premature test fixes before reactivity system is stable

**Phase ordering rationale:**
- Bottom-up dependency order: utilities before contexts, contexts before consumers
- Leaf contexts before mid-level avoids rework -- AppContext depends on Component + Data
- Consumer updates batched after all contexts are stable to avoid repeated changes
- Global runes enablement last because it requires ALL files to be runes-compatible
- E2E fixes last because they validate the entire migration

**Research flags for phases:**
- Phase 3 (DataContext): The DataRoot version counter pattern needs validation -- DataRoot fires update callbacks on internal mutations, and the version counter approach must correctly trigger `$derived` re-evaluation
- Phase 5 (Consumers): 141 files is a large batch. May need sub-batching by app section (voter components, candidate components, shared components)
- Phase 6 (Global runes): Risk of hidden legacy patterns in admin app files that were not caught

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Svelte 5.53.12 / SvelteKit 2.55.0 verified in lockfile, all required APIs confirmed |
| Features | HIGH | Scope is well-defined: rewrite contexts, migrate legacy files, enable runes |
| Architecture | HIGH | Full codebase analysis of all 40 context files and their dependencies |
| Pitfalls | HIGH | DataRoot special case and $app/stores -> $app/state implications understood from code |

## Gaps to Address

- **Tweened store in LayoutContext:** The `tweened()` motion store for progress bar may need special handling. Svelte 5 still supports motion stores, but integration with `$state`-based context needs testing.
- **`$effect` timing in root layout:** The current `$: {}` block in root layout handles async data loading. The `$effect` replacement needs careful handling of the loading/ready/error state machine.
- **Admin app scope:** The 10 admin files use `export let data` (Svelte 4 syntax). They need both runes migration AND context consumption updates simultaneously.
