# Phase 16: CSS Architecture - Context

**Gathered:** 2026-03-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Migrate the frontend styling from the Phase 15 compatibility bridge (Tailwind 4 + JS config + DaisyUI 4 pre-built CSS) to a native Tailwind 4 CSS-first configuration with DaisyUI 5. Remove all Phase 15 compat artifacts. The JS tailwind.config.mjs is deleted entirely. No new user-facing features or component content migration (runes, snippets) — purely CSS infrastructure.

</domain>

<decisions>
## Implementation Decisions

### Dynamic color system
- Hardcode current default colors directly in CSS as custom properties (hex values from current staticSettings.ts)
- Prepare for future runtime configurability — colors should be CSS custom properties that can be overridden at runtime (future: dynamicSettings from admin)
- Preserve existing color aliases exactly: info=accent, success=primary, warning=error (zero visual change)
- staticSettings.colors type stays in TypeScript but the build pipeline stops consuming it for CSS generation

### DaisyUI 5 migration
- Use `@plugin "daisyui"` directive (native TW4 integration, not pre-built CSS imports)
- Comprehensive class name audit across all 22+ component files — update every renamed DaisyUI 5 class in one pass
- Update all direct OKLCH variable references throughout the codebase to DaisyUI 5 names (--p → --color-primary, --b1 → --color-base-100, etc.) — complete migration, no bridge aliases
- Fix all TW3 opacity patterns (bg-opacity, text-opacity, !bg-opacity-30) across all files — convert to TW4 syntax (e.g., bg-white/30)

### Theme config structure
- Preserve all existing custom token names exactly (spacing-xs/sm/md/lg/xl/xxl, rounded-sm/md/lg, text-md, duration-sm, etc.) — zero risk of breaking component classes
- Preserve restrictive approach: only project-defined tokens available (no TW4 defaults for spacing, border-radius, line-height, font-weight, font-size) — enforces design system consistency
- Replace custom `h-screen`/`min-h-screen` overrides (triple-fallback) with TW4's built-in `h-dvh`/`min-h-dvh` utilities — audit and update component usages
- Fix `match-w-xl` custom screen to use rem-based value in a TW4-compatible way (keep rem for accessibility, suppress the CSS warning)

### Compat layer cleanup
- Delete `tailwind.config.mjs` entirely — full CSS-first, all theme tokens in @theme directives
- Delete `tailwind.config.tw4-compat.mjs` wrapper
- Remove pre-built DaisyUI CSS imports (`daisyui/dist/styled.css`, `daisyui/dist/unstyled.css`)
- Remove manual OKLCH theme blocks from app.css (DaisyUI 5 @plugin handles this)
- Fix @apply duplications (circled/list-circled, small-label/tag, small-label/divider) using CSS selector grouping
- Update or remove `tailwind-theme.css` @reference file — update all 22 scoped style blocks as needed
- Resolve ALL `TODO[Phase 16]` and `TODO[Tailwind 4]` comments in the codebase

### Claude's Discretion
- Custom non-DaisyUI variables (--line-color, --progress-color, --progress-label-color): keep as custom CSS vars or map to DaisyUI names — pick what makes maintenance easiest
- @reference strategy for scoped style blocks: update all 22 paths or find a single-reference approach — pick the cleanest TW4-compatible path
- Exact DaisyUI 5 theme configuration syntax for light/dark themes with the custom color overrides

</decisions>

<specifics>
## Specific Ideas

- Colors should be runtime-overridable CSS custom properties — future direction is admin-configurable colors via dynamicSettings, so the CSS architecture should make this easy (just override the custom properties)
- The current aliasing pattern (info=accent, success=primary, warning=error) must be preserved exactly — these are intentional design decisions, not bugs
- Phase 15's `@source inline()` pattern for safelisting dynamic color classes should be carried forward

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `tailwind.config.mjs` (273 lines): All custom theme values to migrate — spacing, fonts, colors, radii, transitions, screen extensions. Source of truth for @theme migration.
- `staticSettings.ts`: Current color hex values for both light/dark themes (9 colors per theme). Will be hardcoded into CSS.
- `app.css` (376 lines): Current compat layer with DaisyUI imports, manual OKLCH theme blocks, @source inline safelists, base/component/utility layers. Starting point for the CSS-first rewrite.
- `tailwind-theme.css`: @reference target for scoped style blocks. 22 components depend on it.

### Established Patterns
- `@source inline()` for safelisting dynamic color classes (replaces TW3 safelist)
- `@reference` in scoped `<style>` blocks for @apply resolution (22 files)
- DaisyUI semantic colors used as utility classes throughout (bg-primary, text-secondary, fill-accent, etc.)
- Color type in `global.d.ts` defines all supported color names — must stay in sync with CSS
- `!bg-opacity-30` TW3 pattern in Video.svelte (6 occurrences) — needs TW4 conversion

### Integration Points
- `packages/app-shared/src/settings/staticSettings.ts` — color source of truth (will be decoupled from CSS build)
- `apps/frontend/src/lib/types/global.d.ts` — Color type union must match available CSS colors
- `apps/frontend/src/lib/components/color/` — color utilities that reference DaisyUI color names
- `apps/frontend/package.json` — DaisyUI version bump (4 → 5), possible tailwind config dep removals

</code_context>

<deferred>
## Deferred Ideas

- **Runtime color configuration** — Moving colors from staticSettings to dynamicSettings so admins can change colors while the app is running. Phase 16 prepares the CSS architecture for this, but the actual admin UI and dynamicSettings integration is a future milestone.
- **tailwind-merge utility** — Rewriting the `concatClasses` paradigm to use tailwind-merge. Deferred to v1.3 content migration.

</deferred>

---

*Phase: 16-css-architecture*
*Context gathered: 2026-03-15*
