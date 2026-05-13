/**
 * Module-scoped Svelte context key for the NavGroup ↔ NavItem auto-detect bridge
 * (Phase 80 D-03).
 *
 * - **Provider:** `NavGroup.svelte` calls `setContext(NAV_GROUP_CONTEXT_KEY, true)`
 *   at script top-level so the marker is in place BEFORE child NavItems render.
 * - **Consumer:** `NavItem.svelte` calls `getContext(NAV_GROUP_CONTEXT_KEY) === true`
 *   at script top-level to decide whether to render the wrapping
 *   `<div role="listitem">`. NavItems used outside a NavGroup (e.g.,
 *   `VoterNav` / `CandidateNav` / `AdminNav` orphan close-buttons) render bare to
 *   avoid the axe `aria-required-parent` violation; no per-consumer prop drilling
 *   is required.
 *
 * Typed as `unique symbol` (RESEARCH §Pattern 2) for stronger compile-time
 * narrowing than the bare `Symbol()` precedent at `filterContext.svelte.ts:8`.
 * The `'nav-group'` description is debug-only metadata (visible in DevTools).
 */
export const NAV_GROUP_CONTEXT_KEY: unique symbol = Symbol('nav-group');
