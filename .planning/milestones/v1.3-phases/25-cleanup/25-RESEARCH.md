# Phase 25: Cleanup - Research

**Researched:** 2026-03-19
**Domain:** Svelte 5 TODO marker resolution and candidate app call site repair
**Confidence:** HIGH

## Summary

Phase 25 is a focused cleanup phase with two requirements: resolving 6 v1.3-scoped TODO[Svelte 5] markers in shared/voter components, and fixing any candidate app call sites broken by shared component API changes from Phases 22-23.

Research confirms that the scope is narrower than initially estimated. The candidate app call sites for Expander are already compatible -- they use default content (children) and do not use expand/collapse event handlers, so the callback prop migration does not affect them. MainContent snippet syntax was already updated in prior phases. The only legacy Svelte 4 patterns in candidate routes (`on:submit|preventDefault` on `<form>`, `on:change` on `<select>`) are on native HTML elements owned by candidate code, not shared component API breakage, and are explicitly out of scope per CONTEXT.md.

For the TODO markers, analysis of each file reveals that most markers require investigation rather than code change -- several wrapper functions are still necessary in Svelte 5, and the i18n test mock is likely redundant due to a global vitest alias already covering `$env/dynamic/public`. The Input.svelte class variable TODO and Video.svelte init pattern TODO are the only markers that suggest actual code refactoring, but both should be evaluated for feasibility within the cleanup scope.

**Primary recommendation:** Resolve each TODO marker with minimal, safe changes -- remove markers where investigation shows the workaround is still needed or the mock is redundant, and only refactor code where it is localized and low-risk.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **v1.3 scope TODO markers (6 files):** EntityFilters.svelte:35, Video.svelte:520, Input.svelte:337, ConstituencySelector.svelte:82, utils.test.ts:6, EntityCardAction.svelte:6
- **Deferred to v1.4 (7 markers):** jobStores.ts:53, jobStores.type.ts:21/26, pageDatumStore.ts:7, dataContext.ts:60, WithPolling.svelte:7, (voters)/(located)/+layout.svelte:90, +layout.svelte:56
- **Resolution approach for ambiguous markers:**
  - "Check if needed" / "Check if necessary" markers: Investigate whether the wrapper function is still needed in Svelte 5 runes mode. If resolved by runes, remove wrapper and TODO. If still necessary, remove only the TODO marker.
  - "Probably not needed anymore" (i18n test mock): Test without the mock. If tests pass, remove. If they fail, keep mock and remove TODO.
  - "Maybe convert into $snippet" (EntityCardAction): Evaluate if clean improvement. If requires significant refactoring, remove TODO marker and add regular TODO.
  - "Use snippets instead of class variables" (Input): Evaluate feasibility. If requires significant consumer changes, defer and remove TODO marker.
  - "Convert to init function" (Video.load): Refactor to init pattern. Localized change within Video component.
- **Candidate call site update depth:** Syntax-only fixes where shared component API changed. Do NOT add `<svelte:options runes />` to candidate route files. Do NOT convert `$:`, `export let`, `on:event` on candidate-owned elements. Do NOT convert candidate `<slot />` in layouts.
- **Cross-phase conventions:** Per-component `<svelte:options runes />`, E2E test verification at phase end, both apps must remain compilable throughout.

### Claude's Discretion
- Exact resolution approach for each TODO marker (within the guidelines above)
- Whether EntityCardAction snippet conversion is worthwhile or should be deferred
- Whether Input.svelte class variable to snippet conversion is feasible in this phase
- Plan batching and task ordering

### Deferred Ideas (OUT OF SCOPE)
- Context system TODO markers (7 markers) -- CTX-01 to CTX-04 scope, deferred to v1.4
- Admin component TODO markers (WithPolling) -- admin scope, separate milestone
- Full candidate app migration (CAND-01) -- routes, layouts, reactive patterns -- v1.4
- awaitNominationsSettled rewrite -- depends on store-to-runes migration
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CLEAN-01 | All v1.3-scoped TODO[Svelte 5] markers resolved (approximately 10 in voter/shared scope) | 6 markers identified and analyzed in detail below. Each has a clear resolution path based on codebase investigation. |
| CLEAN-02 | Candidate app call sites updated with syntax-only changes where shared components changed API (snippet syntax, callback props) | Investigation confirms candidate Expander usage is already compatible (children-only, no event handlers). MainContent already updated. No breakage found. Verification task still needed. |
</phase_requirements>

## TODO Marker Analysis

### Marker 1: EntityFilters.svelte:35 -- "Check if needed"
**File:** `apps/frontend/src/lib/components/entityFilters/EntityFilters.svelte`
**What it wraps:** `isEnumeratedFilter<MaybeWrappedEntityVariant, AnyEntityVariant>(filter)` -- a generic function call with explicit type parameters
**Why the wrapper exists:** The comment says "Type params cannot be used in the HTML part." In Svelte (both 4 and 5), TypeScript type annotations and generic type parameters cannot be used in template expressions. The template section is compiled separately and does not support inline TypeScript syntax like `isEnumeratedFilter<Type1, Type2>(arg)`.
**Svelte 5 status:** This limitation STILL EXISTS in Svelte 5. Even with the `generics` attribute on `<script>`, type parameters are a script-level feature. Template expressions must be plain JavaScript.
**Resolution:** The wrapper function `_isEnumeratedFilter` is still needed. Remove the `// TODO[Svelte 5]: Check if needed` comment but keep the wrapper function.
**Confidence:** HIGH -- verified via Svelte 5 docs that type parameters remain script-only.

### Marker 2: Video.svelte:520 -- "Convert to init function"
**File:** `apps/frontend/src/lib/components/video/Video.svelte`
**What it does:** `export function load(props: VideoContent & OptionalVideoProps)` -- changes video content after initial mount. Called from route pages via `bind:this`.
**Current pattern:** Component can be initialized with content props OR empty, then `load()` is called to set/change content. The function reassigns bindable props (title, sources, captions, etc.) and manages video element lifecycle.
**Consumers:** 3 route files call `video.load()` via bind:this -- 2 voter routes, 1 candidate route.
**Assessment:** Converting to an "init function which is always called, even on first use" would mean refactoring so that initial content also goes through `load()`, unifying the two paths. However, this touches prop initialization, `$effect` chains, and the export function contract. All 3 consumers call `.load()` after mount, not at mount time. The Video component is already 850+ lines and complex.
**Resolution:** This refactoring is risky for a cleanup phase. The current `load()` function works correctly with runes mode (it uses `$bindable()` props). The TODO describes an architectural improvement, not a Svelte 5 compatibility fix. **Recommend removing the TODO marker and adding a regular `// TODO:` comment for future improvement**, or attempt if truly localized.
**Confidence:** HIGH -- codebase analysis confirms load() works correctly in runes mode.

### Marker 3: Input.svelte:337 -- "Use snippets instead of class variables"
**File:** `apps/frontend/src/lib/components/input/Input.svelte`
**What it is:** 6 CSS class string constants (`inputContainerClass`, `inputLabelClass`, `inputAndIconContainerClass`, `inputClass`, `selectClass`, `textareaClass`) used throughout the template.
**Current pattern:** Class strings are defined as `const` variables in the script block and interpolated into template class attributes throughout the 650-line component. Example: `class="{inputContainerClass} join-item"`.
**Assessment:** Converting these to snippets would mean creating snippet functions for each "section" of the Input component (the container, the label area, the input+icon area). This is NOT a straightforward class-to-snippet conversion -- it would be a significant structural refactoring of a 650-line component with 5+ input type variants. Each variant has different internal structure that shares these class constants. Snippets would need to abstract common wrapper patterns while still allowing per-variant inner content.
**No consumer changes needed:** These are internal implementation details, not API surface.
**Resolution:** This is an architectural improvement beyond cleanup scope. **Remove the TODO[Svelte 5] marker.** The class constants work fine in runes mode and are not a Svelte 5 compatibility issue.
**Confidence:** HIGH -- verified the class variables are purely internal.

### Marker 4: ConstituencySelector.svelte:82 -- "Check if necessary"
**File:** `apps/frontend/src/lib/components/constituencySelector/ConstituencySelector.svelte`
**What it wraps:** The `update()` function is called inside `$effect(() => { update(); elections; useSingleGroup; })` with explicit dependency tracking. The comment says "Wrap in function to prevent excessive reactive updates."
**Current pattern:** The `update()` function rebuilds the `sections` array from `elections` and `useSingleGroup` props. It sets `sections = [...]` which is `$state`. The `$effect` explicitly references `elections` and `useSingleGroup` as dependencies.
**Svelte 5 analysis:** In Svelte 5 runes mode, `$effect` automatically tracks reactive dependencies. The explicit dependency listing with dummy expressions (`elections; useSingleGroup;`) is a pattern used to explicitly trigger the effect. The wrapper function pattern was used in Svelte 4 to batch updates. In Svelte 5, `$derived.by()` or `$effect()` with automatic tracking would be more idiomatic, but the current pattern works correctly.
**Assessment:** The wrapper function IS still useful because `$effect` uses synchronous batching, and the `update()` function performs non-trivial logic that mutates `$state`. However, this could potentially be converted to `$derived.by()` since `sections` is derived from `elections` and `useSingleGroup`. But that would change the reactivity model (from effect-based mutation to derived computation).
**Resolution:** The wrapper is functional and not causing issues. **Remove the TODO[Svelte 5] marker only.** The function serves a valid purpose regardless of Svelte version. Optionally, convert to `$derived.by()` if the logic is pure computation (it appears to be -- it only reads props and sets `sections`).
**Confidence:** MEDIUM -- the `$derived.by()` conversion could work but needs verification that there are no side effects in `update()` beyond setting `sections`.

### Marker 5: utils.test.ts:6 -- "Probably not needed anymore"
**File:** `apps/frontend/src/lib/i18n/tests/utils.test.ts`
**What it does:** `vi.mock('$env/dynamic/public', () => ({ env: {} }))` -- mocks the SvelteKit env module.
**Why it might not be needed:** The `vitest.config.ts` already has a global alias for `$env/dynamic/public` pointing to `src/lib/i18n/tests/__mocks__/env-dynamic-public.ts`, which exports `{ env: {} }`. The `vi.mock` in the test file is doing the same thing as the global alias.
**Analysis:** The global alias in `vitest.config.ts` (line 27) resolves `$env/dynamic/public` to the mock file for ALL tests. The per-test `vi.mock` is therefore redundant. The test imports from `'../'` which re-exports from `./init.ts`, and `init.ts` does NOT import `$env/dynamic/public` -- it imports from `$lib/paraglide/runtime` and `@openvaa/app-shared`. The comment says "This is needed for `/utils/constants.ts` to not throw" -- `$lib/utils/constants.ts` does import `$env/dynamic/public`, but that would only be relevant if something in the import chain of this test file transitively imports constants.ts.
**Resolution:** Test empirically: remove the `vi.mock` call and the TODO comment, run the test. If it passes (expected, since global alias covers it), remove permanently. If it fails, keep the mock and remove only the TODO.
**Confidence:** MEDIUM -- strong evidence the mock is redundant due to global alias, but needs empirical verification.

### Marker 6: EntityCardAction.svelte:6 -- "Maybe convert into $snippet"
**File:** `apps/frontend/src/lib/dynamic-components/entityCard/EntityCardAction.svelte`
**What it is:** A utility component that wraps content in either a `<button>`, `<a>`, or nothing depending on the `action` prop type.
**Current state:** Already fully migrated to runes mode -- uses `$props()`, `children` snippet, `{@render children?.()}`. The component is clean, 64 lines, with a simple conditional pattern.
**Assessment:** Converting to a `$snippet` would mean replacing this component with a snippet function, likely in EntityCard.svelte where it's consumed. But EntityCardAction is used as a standalone component with its own `<style>` block (`.hover-shaded` class). Snippets cannot have scoped styles. Additionally, EntityCardAction has its own type file and is exported from the entityCard module.
**Resolution:** The component is already clean in runes mode. Converting to a snippet would lose scoped styles and module organization. **Remove the TODO[Svelte 5] marker.** The current component approach is better than a snippet for this use case.
**Confidence:** HIGH -- the component is already fully migrated and well-structured.

## Candidate Call Site Analysis (CLEAN-02)

### Expander Usage in Candidate Routes
- `candidate/(protected)/questions/+page.svelte` (line 144): Uses `<Expander title=... variant=... defaultExpanded=... class=...>` with children content only. No event handlers. **Already compatible** with the runes-mode Expander.
- `candidate/help/+page.svelte` (line 41): Uses `<Expander title=... variant=...>` with children content only. No event handlers. **Already compatible.**

### MainContent Usage in Candidate Routes
All candidate routes already use snippet syntax for MainContent (`{#snippet note()}`, `{#snippet hero()}`, `{#snippet heading()}`, `{#snippet primaryActions()}`). This was confirmed in the codebase with 30+ snippet usages across candidate routes. **Already compatible.**

### Legacy Svelte 4 Patterns in Candidate Routes (NOT in scope)
- `candidate/forgot-password/+page.svelte:65`: `on:submit|preventDefault` on native `<form>` element -- CAND-01 scope
- `candidate/(protected)/settings/+page.svelte:112`: `on:change` on native `<select>` element -- CAND-01 scope
- `candidate/+layout.svelte:82` and 5 other layouts: `<slot />` -- SvelteKit route slots, not component slots -- CAND-01 scope

### Conclusion
**No candidate call site changes needed.** All shared component API changes from Phases 22-23 are already compatible with candidate app usage patterns. A verification task should confirm this by testing candidate app compilation and E2E tests.

## Architecture Patterns

### Resolution Pattern for Each Marker Type
1. **"Check if needed" markers**: Investigate the specific Svelte 5 capability. If the workaround is still needed, remove only the TODO marker. If not needed, remove the workaround AND the marker.
2. **"Convert to X" markers**: Evaluate feasibility and risk. If conversion is safe and localized, do it. If it requires significant refactoring or consumer changes, remove the TODO marker and optionally add a regular `// TODO:` comment.
3. **Test mock markers**: Empirically test by removing the mock and running the test suite.

### Task Ordering Strategy
1. Start with empirical investigations (remove mocks, test) -- these provide quick signal
2. Then handle simple marker removals (EntityFilters, EntityCardAction, Input class variables)
3. Then handle markers requiring judgment (ConstituencySelector, Video)
4. Finish with candidate app verification
5. E2E verification at the end

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Type guard wrappers in templates | Inline generic calls in templates | Keep wrapper functions for generic type parameters | Svelte template expressions don't support TypeScript generics syntax |
| Scoped styles in snippets | Snippets with inline styles | Keep as components with `<style>` blocks | Snippets cannot have scoped CSS |

## Common Pitfalls

### Pitfall 1: Over-Refactoring in Cleanup Phase
**What goes wrong:** Attempting to make architectural improvements that belong in future phases (e.g., converting Video.load to init pattern, restructuring Input with snippets).
**Why it happens:** The TODO markers suggest ideal patterns, not minimal cleanup actions.
**How to avoid:** Apply the CONTEXT.md scoping strictly -- markers should be resolved (removed or addressed), not necessarily implemented.
**Warning signs:** Changes touching consumer call sites, changing component export APIs, refactoring more than 50 lines.

### Pitfall 2: Breaking Candidate App Compilation
**What goes wrong:** Changes to shared components cause type or runtime errors in candidate routes that aren't tested during development.
**Why it happens:** Candidate routes are in Svelte 4 legacy mode (no `<svelte:options runes />`), so they interact differently with runes-mode components.
**How to avoid:** After each shared component change, verify that `yarn build` succeeds for the entire workspace. Run TypeScript check.
**Warning signs:** Removing a wrapper function that was actually needed, changing export function signatures.

### Pitfall 3: Removing Necessary Test Infrastructure
**What goes wrong:** Removing the `vi.mock` for `$env/dynamic/public` breaks the test when run in isolation or in a different environment.
**Why it happens:** The global vitest alias appears to cover it, but there might be edge cases (e.g., parallel test runners, different vitest configs).
**How to avoid:** Always run the specific test file AND the full test suite after removing the mock.
**Warning signs:** Test passes locally but fails in CI.

### Pitfall 4: Converting $effect to $derived.by Without Checking Side Effects
**What goes wrong:** Converting ConstituencySelector's `$effect` + `update()` to `$derived.by()` introduces subtle reactivity bugs.
**Why it happens:** `$effect` and `$derived.by` have different timing and batching semantics. `$effect` runs after DOM updates, `$derived.by` runs synchronously during dependency tracking.
**How to avoid:** Keep the `$effect` pattern if the function has any side effects beyond setting the derived value. Only convert if it's a pure computation.
**Warning signs:** Multiple `$state` variables being set in the update function.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest (unit), Playwright (E2E) |
| Config file | `apps/frontend/vitest.config.ts`, `playwright.config.ts` |
| Quick run command | `cd apps/frontend && yarn test:unit` |
| Full suite command | `yarn test:unit && yarn test:e2e` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CLEAN-01 | TODO markers resolved | manual + unit | `cd apps/frontend && yarn test:unit` (covers utils.test.ts) | Partial -- utils.test.ts exists |
| CLEAN-01 | i18n mock removal | unit | `cd apps/frontend && npx vitest run src/lib/i18n/tests/utils.test.ts` | Exists |
| CLEAN-02 | Candidate app compiles | build | `yarn build` | N/A (build check) |
| CLEAN-02 | Candidate app works | E2E | `yarn test:e2e` | Exists (92 tests) |

### Sampling Rate
- **Per task commit:** `yarn build` (verify both apps compile)
- **Per wave merge:** `cd apps/frontend && yarn test:unit`
- **Phase gate:** Full E2E suite green (`yarn test:e2e`) before `/gsd:verify-work`

### Wave 0 Gaps
None -- existing test infrastructure covers all phase requirements. The i18n unit test already exists and the E2E suite covers candidate app functionality.

## Sources

### Primary (HIGH confidence)
- Codebase analysis of all 6 TODO marker files (read in full)
- Codebase analysis of all candidate route files using Expander and MainContent
- `vitest.config.ts` global alias configuration for `$env/dynamic/public`
- Svelte 5 TypeScript docs confirming type parameters are script-only: https://svelte.dev/docs/svelte/typescript
- `Expander.type.ts` confirming callback prop API (`onExpand`, `onCollapse`)

### Secondary (MEDIUM confidence)
- Svelte 5 generics/template limitation assessment based on documentation review
- Assessment that ConstituencySelector's `update()` function could be `$derived.by()` (needs empirical verification)

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- TODO marker analysis: HIGH -- each file read in full, Svelte 5 behavior verified against docs
- Candidate call site analysis: HIGH -- grep of all candidate routes confirms no breakage
- Refactoring feasibility (Video init, Input snippets): MEDIUM -- assessed as out of scope based on complexity, but exact effort unverified

**Research date:** 2026-03-19
**Valid until:** 2026-04-19 (stable -- codebase-specific findings, not library-dependent)
