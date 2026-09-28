# Phase 15: Scaffold and Build - Context

**Gathered:** 2026-03-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Replace the frontend build configuration with a fresh SvelteKit 2 + Svelte 5 scaffold. Existing source code (src/) is preserved untouched. Content migration (runes, snippets, event handlers) is deferred to v1.3. CSS architecture (Tailwind 4 CSS-first config, DaisyUI 5) is Phase 16. Dependency cleanup beyond scaffold-related packages is Phase 18. Docker/CI/E2E validation is Phase 19.

</domain>

<decisions>
## Implementation Decisions

### Scaffold strategy
- Generate fresh SvelteKit 2 + Svelte 5 scaffold via `npx sv create` in a temp directory
- Copy config files into apps/frontend/: svelte.config.js, vite.config.ts, tsconfig.json, app.html, app.d.ts
- Remove obsolete files: postcss.config.cjs, svelte-preprocess references
- Keep entire src/ directory untouched

### app.html handling
- Start from the fresh scaffold's app.html template
- Re-add custom elements: Google Fonts link for custom font, existing meta tags
- Account for `lang` attribute on `<html>` — currently set by i18n plugin for locale selection

### Dependency scope
- Phase 15 touches only scaffold-related deps: svelte (4->5), @sveltejs/kit, @sveltejs/vite-plugin-svelte, svelte-check
- Remove: svelte-preprocess, autoprefixer
- Add: whatever the fresh scaffold requires
- Leave all other deps for Phase 18 (Capacitor removal, ai package fix, broad bumps)

### vite-tsconfig-paths
- Try without vite-tsconfig-paths first — fresh SvelteKit + Vite may handle workspace resolution natively
- Add back if workspace @openvaa/* imports break

### Tailwind 4 with @config compat bridge
- Install Tailwind 4 with @tailwindcss/vite plugin (satisfies SCAF-03)
- Remove postcss.config.cjs and autoprefixer dep
- Use `@config './tailwind.config.mjs'` directive to keep existing JS config working temporarily
- Keep DaisyUI 4.12 — it works through the @config compat bridge
- Preserve entire safelist as-is through @config bridge
- Phase 16 does the full CSS-first migration, DaisyUI 5 upgrade, and removes tailwind.config.mjs

### CSS entry point
- Start fresh: new app.css with `@import 'tailwindcss'` and `@config` directive
- Re-add existing global styles only if build breaks or pages look wrong
- Visual regression checks deferred until after Phase 16

### Svelte 4 compatibility
- Leave Svelte 5 deprecation warnings visible (useful checklist for v1.3 content migration)
- Fix minimal compilation blockers (<5 files) with simplest Svelte 5-compatible equivalent
- Use existing `TODO[Svelte 5]` comment convention for any compat fixes
- If >5 files need fixing, stop and flag as risk for replanning

### Build verification
- Both `vite dev` and `vite build` (adapter-node) must succeed
- Vitest must still run (pre-existing test failures OK, config failures not OK)
- Preserve data/ folder copy step in build script
- Update turbo.json if scaffold changes require it
- Docker, CI, and E2E are Phase 19

### Claude's Discretion
- Verification depth for Svelte 4 compat (dev server check vs route rendering vs unit tests)
- Whether workspace import resolution needs explicit testing beyond dev server startup
- Exact vitest config adjustments for Svelte 5
- Whether vite-tsconfig-paths is needed (try without, judge results)

</decisions>

<specifics>
## Specific Ideas

- Locale `lang` attribute on `<html>` is managed by sveltekit-i18n plugin — new app.html must not break this
- Existing `TODO[Svelte 5]` comments in the codebase already flag items to consider after migration — use the same convention for any compat fixes in Phase 15
- Visual correctness is explicitly NOT a Phase 15 concern — minimal compat with visual regression checks deferred until after Phase 16

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `tailwind.config.mjs`: 273-line JS config with custom theme (spacing, fonts, colors, radii), DaisyUI themes (light/dark), safelist for dynamic color classes, staticSettings integration — preserved via @config bridge
- `adapter-node`: Already configured in current svelte.config.js — carry forward to new config
- Path aliases ($types, $voter, $candidate): Defined in kit.alias — must be preserved in new svelte.config.js

### Established Patterns
- Workspace packages (@openvaa/*) imported throughout frontend — Vite must resolve these
- TypeScript project references in tsconfig.json for IDE resolution — must be preserved
- Build script data/ folder copy for local adapter — preserve in package.json scripts
- `svelte-kit sync` runs before build and typecheck — standard SvelteKit pattern, will persist

### Integration Points
- `apps/frontend/svelte.config.js` — SvelteKit entry point, referenced by Vite plugin
- `apps/frontend/vite.config.ts` — Vite config, used by dev/build/test
- `apps/frontend/tsconfig.json` — Extends @openvaa/shared-config/ts and .svelte-kit/tsconfig.json
- `turbo.json` (root) — Turborepo pipeline references frontend build/dev/test scripts
- Docker compose mounts and env vars reference frontend (Phase 19 concern)

</code_context>

<deferred>
## Deferred Ideas

- **Shared-config optimization** — Review whether @openvaa/shared-config (prettier, lint, TS configs) can be simplified or eliminated. If vite-tsconfig-paths is no longer needed, shared-config may be the only consumer of certain patterns. Add to near-term todo.
- **tailwind-merge utility** — Current `concatClasses` paradigm for merging restProps and classes should be rewritten to use a tailwind-merge-enabled utility during v1.3 content migration.

</deferred>

---

*Phase: 15-scaffold-and-build*
*Context gathered: 2026-03-15*
