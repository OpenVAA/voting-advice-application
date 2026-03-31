# Phase 54: Global Runes Enablement - Context

**Gathered:** 2026-03-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Enable runes mode globally for all project .svelte files via `dynamicCompileOptions` in svelte.config.js, remove all 151 `<svelte:options runes />` per-file directives, and verify third-party Svelte libraries work correctly under global runes mode.

</domain>

<decisions>
## Implementation Decisions

### Claude's Full Discretion
User deferred all decisions to Claude. This phase is mechanical:
1. Add `dynamicCompileOptions` to svelte.config.js (must exclude node_modules for third-party lib compatibility)
2. Remove all 151 `<svelte:options runes />` directives via bulk operation
3. Verify `svelte-visibility-change` and any other third-party Svelte packages work under global runes
4. Build clean with zero runes-related warnings
5. All unit tests pass

No gray areas — approach is fully constrained by the requirements.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Configuration
- `apps/frontend/svelte.config.js` — Current config (no runes settings yet)

### Third-party Svelte libraries
- `apps/frontend/package.json` — Lists all dependencies including Svelte component libraries
- `apps/frontend/src/routes/+layout.svelte` — Uses `svelte-visibility-change` (dynamic import)

### Directive removal targets
- 151 files with `<svelte:options runes />` across `apps/frontend/src/` (full list available via grep)

</canonical_refs>

<code_context>
## Existing Code Insights

### Current State
- svelte.config.js has no `compilerOptions` or `dynamicCompileOptions` — runes are per-file opt-in only
- 151 .svelte files have `<svelte:options runes />` directive
- After Phase 53, all 16 previously non-runes files will also be runes-compatible
- `svelte-visibility-change` is the primary third-party Svelte component library to verify

### Integration Points
- svelte.config.js is the single config point for global runes enablement
- `dynamicCompileOptions` allows per-file runes decisions (needed to exclude node_modules)

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

*Phase: 54-global-runes-enablement*
*Context gathered: 2026-03-28*
