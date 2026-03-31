# Phase 54: Global Runes Enablement - Research

**Researched:** 2026-03-28
**Domain:** Svelte 5 compiler configuration, runes mode enablement, third-party library compatibility
**Confidence:** HIGH

## Summary

Phase 54 is a mechanical configuration and cleanup phase. The core work is: (1) add `dynamicCompileOptions` to `svelte.config.js` to enable runes mode for all project `.svelte` files while excluding `node_modules`, (2) remove all 151 `<svelte:options runes />` per-file directives, and (3) verify that the single third-party Svelte component library (`svelte-visibility-change`) works correctly under this configuration.

The `dynamicCompileOptions` function is a **vite-plugin-svelte feature** (not a Svelte compiler feature). In `svelte.config.js`, it goes under the `vitePlugin` key. It receives each file's path at compile time and returns partial compiler options. The pattern `if (!filename.includes('node_modules')) return { runes: true }` is the established community pattern for this exact use case.

**Primary recommendation:** Add `vitePlugin.dynamicCompileOptions` to `svelte.config.js` for build/dev, and `compilerOptions: { runes: true }` for `svelte-check` compatibility. Remove all 151 directives via bulk sed operation. Verify build, unit tests, and `svelte-check` all pass.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
No specific locked decisions -- user deferred all decisions to Claude. The approach is fully constrained by the requirements:
1. Add `dynamicCompileOptions` to svelte.config.js (must exclude node_modules for third-party lib compatibility)
2. Remove all 151 `<svelte:options runes />` directives via bulk operation
3. Verify `svelte-visibility-change` and any other third-party Svelte packages work under global runes
4. Build clean with zero runes-related warnings
5. All unit tests pass

### Claude's Discretion
Full discretion on all implementation details.

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| R6.1 | Enable runes via dynamicCompileOptions in svelte.config.js | `dynamicCompileOptions` goes under `vitePlugin` key; exact API documented; node_modules exclusion pattern verified |
| R6.2 | Remove all `<svelte:options runes />` directives | 151 files identified via grep; bulk sed removal is safe since global runes makes them redundant |
| R6.3 | Verify third-party Svelte libraries work under global runes | Only `svelte-visibility-change` v0.6.0 has `.svelte` files; it uses Svelte 3/4 syntax; `dynamicCompileOptions` exclusion prevents runes enforcement on it |
| R6.4 | Build succeeds with zero warnings related to runes mode | Build via `yarn build`, type-check via `yarn workspace @openvaa/frontend check`, unit tests via `yarn test:unit` |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| svelte | 5.53.12 | Compiler with runes support | Already installed; runes is the native reactivity model |
| @sveltejs/kit | 2.55.0 | Framework | Already installed |
| @sveltejs/vite-plugin-svelte | 6.2.1 | Vite plugin with `dynamicCompileOptions` | Already installed; provides the per-file runes configuration API |

### Third-Party Svelte Libraries
| Library | Version | Has .svelte Files | Runes Compatible | Notes |
|---------|---------|-------------------|-------------------|-------|
| svelte-visibility-change | 0.6.0 | Yes (1 component) | No (Svelte 3/4 syntax) | Must be excluded from global runes via dynamicCompileOptions |
| daisyui | (catalog) | No | N/A | CSS-only Tailwind plugin |
| @inlang/paraglide-js | 2.15.0 | No | N/A | JS-only i18n |
| @supabase/ssr | (catalog) | No | N/A | JS-only |

**No installation needed.** All required packages are already installed.

## Architecture Patterns

### Configuration Pattern: dynamicCompileOptions in svelte.config.js

The `dynamicCompileOptions` function belongs under the `vitePlugin` key in `svelte.config.js` (NOT at the config root). The `SvelteConfig` type defines this structure:

```typescript
// From @sveltejs/vite-plugin-svelte/src/public.d.ts
export interface SvelteConfig {
  compilerOptions?: Omit<CompileOptions, 'filename' | 'format' | 'generate'>;
  vitePlugin?: PluginOptions; // <-- dynamicCompileOptions goes HERE
}

export interface PluginOptions {
  dynamicCompileOptions?: (data: {
    filename: string;
    code: string;
    compileOptions: Partial<CompileOptions>;
  }) => Promise<Partial<CompileOptions> | void> | Partial<CompileOptions> | void;
}
```

**Exact configuration for svelte.config.js:**

```javascript
// Source: vite-plugin-svelte types + GitHub issue #9632 resolution
import adapter from '@sveltejs/adapter-node';
import path from 'path';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  compilerOptions: {
    runes: true  // For svelte-check and IDE (they don't read dynamicCompileOptions)
  },
  kit: {
    adapter: adapter({}),
    alias: {
      $types: path.resolve('./src/lib/types'),
      $voter: path.resolve('./src/lib/voter'),
      $candidate: path.resolve('./src/lib/candidate')
    },
    version: {
      pollInterval: 5 * 60 * 1000
    }
  },
  vitePlugin: {
    dynamicCompileOptions({ filename }) {
      if (!filename.includes('node_modules')) {
        return { runes: true };
      }
    }
  }
};

export default config;
```

### Why Both `compilerOptions.runes` AND `dynamicCompileOptions`

| Tool | Reads `compilerOptions` | Reads `dynamicCompileOptions` | Notes |
|------|------------------------|------------------------------|-------|
| Vite build (`sveltekit()`) | Yes | Yes (via `vitePlugin`) | `dynamicCompileOptions` overrides `compilerOptions` per-file |
| Vite dev server | Yes | Yes (via `vitePlugin`) | Same as build |
| vitest (`svelte()`) | Yes | Yes (reads svelte.config.js `vitePlugin`) | Auto-reads svelte.config.js |
| svelte-check | Yes | **NO** | Cannot use dynamic options |
| VS Code / IDE | Yes | **NO** | Cannot use dynamic options |

- `compilerOptions: { runes: true }` -- makes `svelte-check` and IDE enforce runes mode. This is safe because `svelte-check` excludes `node_modules` by default, so it won't try to check `svelte-visibility-change`.
- `vitePlugin.dynamicCompileOptions` -- makes Vite builds exclude `node_modules` from runes enforcement, which IS necessary because Vite DOES compile third-party `.svelte` files.

### Directive Removal Pattern

All 151 `<svelte:options runes />` directives are redundant once global runes is enabled. They can be removed with a single sed command:

```bash
# macOS sed (BSD)
find apps/frontend/src -name '*.svelte' -exec sed -i '' '/<svelte:options runes \/>/d' {} +

# Or GNU sed
find apps/frontend/src -name '*.svelte' -exec sed -i '/<svelte:options runes \/>/d' {} +
```

**Verification after removal:**
```bash
grep -r '<svelte:options runes' apps/frontend/src/ | wc -l
# Expected: 0
```

### Anti-Patterns to Avoid

- **Using `compilerOptions: { runes: true }` WITHOUT `dynamicCompileOptions`:** Vite will try to compile third-party Svelte components in runes mode, causing "Cannot use `export let` in runes mode" errors for `svelte-visibility-change`.
- **Putting `dynamicCompileOptions` at the config root:** It's a `PluginOptions` property, not a `SvelteConfig` root property. Placing it at root will throw: "Invalid options in svelte config. Move the following options into 'vitePlugin:{...}'".
- **Using `runes: undefined` for node_modules files:** Returning `undefined` or nothing (void) from `dynamicCompileOptions` preserves the default behavior, which is legacy mode for files without `<svelte:options runes />`. Returning `{ runes: undefined }` is equivalent to not returning anything. The correct pattern is to simply NOT return anything for node_modules files.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Per-file runes configuration | Custom Vite plugin | `dynamicCompileOptions` in vite-plugin-svelte | Built-in API, officially supported pattern |
| Bulk text removal | Custom script per file | `sed` one-liner or IDE find-and-replace | 151 identical lines, deterministic removal |
| Third-party lib compatibility | Patches or forks | node_modules exclusion in dynamicCompileOptions | Standard approach from Svelte maintainers |

## Common Pitfalls

### Pitfall 1: dynamicCompileOptions Placement
**What goes wrong:** `dynamicCompileOptions` is placed at the svelte.config.js root instead of under `vitePlugin`.
**Why it happens:** The FEATURES.md research document and some community examples show it at the root level, which is the vite.config.js inline syntax, not the svelte.config.js syntax.
**How to avoid:** Always place under `vitePlugin: { dynamicCompileOptions(...) }` in svelte.config.js.
**Warning signs:** Error: "Invalid options in svelte config. Move the following options into 'vitePlugin:{...}'"

### Pitfall 2: Missing compilerOptions.runes for svelte-check
**What goes wrong:** `svelte-check` (`yarn workspace @openvaa/frontend check`) doesn't know about runes mode because it can't read `dynamicCompileOptions`. After removing all `<svelte:options runes />` directives, `svelte-check` treats all files as legacy mode and may miss runes-specific type errors.
**Why it happens:** `svelte-check` only reads `compilerOptions` from svelte.config.js, not `dynamicCompileOptions`.
**How to avoid:** Add `compilerOptions: { runes: true }` alongside `vitePlugin.dynamicCompileOptions`. Since `svelte-check` excludes `node_modules` by default, this is safe.
**Warning signs:** `svelte-check` passing when it shouldn't (false negative), or not flagging legacy syntax.

### Pitfall 3: Incomplete Directive Removal
**What goes wrong:** Some `<svelte:options runes />` directives are missed, or removal introduces blank lines/formatting issues.
**Why it happens:** Different file formatting, or directives with slightly different whitespace.
**How to avoid:** Use `grep -r '<svelte:options' apps/frontend/src/` after removal to verify zero remaining directives. Run `prettier --check` to catch formatting issues.
**Warning signs:** `grep` returns non-zero count after removal.

### Pitfall 4: Vite Cache Stale After Config Change
**What goes wrong:** Build uses cached compilation results from before the runes config change.
**Why it happens:** Vite's dependency optimization cache in `node_modules/.vite` may be stale.
**How to avoid:** Delete `node_modules/.vite` after modifying svelte.config.js compiler options. Also clear Turborepo cache with `rm -rf .turbo/`.
**Warning signs:** Build succeeds but runtime behavior is wrong; or old warnings persist.

### Pitfall 5: svelte-visibility-change on:hidden Interop
**What goes wrong:** After Phase 53 migrates the root layout to runes mode, the `on:hidden` event syntax on the `svelte-visibility-change` component may not work.
**Why it happens:** In runes mode, `on:event` directive is deprecated and may not work for component events dispatched via `createEventDispatcher`.
**How to avoid:** Phase 53 is responsible for handling this migration (listed under Phase 53 Claude's Discretion). By Phase 54, this will already be resolved. Phase 54 should verify it works, not fix it.
**Warning signs:** Build warnings about `on:` usage; runtime: visibility change events not firing.

## Code Examples

### Example 1: Complete svelte.config.js After Phase 54

```javascript
// Source: Verified against @sveltejs/vite-plugin-svelte 6.2.1 types
import adapter from '@sveltejs/adapter-node';
import path from 'path';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  compilerOptions: {
    runes: true
  },
  kit: {
    adapter: adapter({}),
    alias: {
      $types: path.resolve('./src/lib/types'),
      $voter: path.resolve('./src/lib/voter'),
      $candidate: path.resolve('./src/lib/candidate')
    },
    version: {
      pollInterval: 5 * 60 * 1000
    }
  },
  vitePlugin: {
    dynamicCompileOptions({ filename }) {
      if (!filename.includes('node_modules')) {
        return { runes: true };
      }
    }
  }
};

export default config;
```

### Example 2: Bulk Directive Removal (macOS)

```bash
# Remove all <svelte:options runes /> lines
find apps/frontend/src -name '*.svelte' \
  -exec sed -i '' '/<svelte:options runes \/>/d' {} +

# Verify zero remaining
grep -rn '<svelte:options' apps/frontend/src/
# Should show ZERO results (no other svelte:options exist in the codebase)

# Fix formatting (remove double blank lines left by removal)
find apps/frontend/src -name '*.svelte' \
  -exec sed -i '' '/^$/N;/^\n$/d' {} +
```

### Example 3: Verification Commands

```bash
# 1. Build verification
yarn build

# 2. Type-check verification (uses compilerOptions.runes: true)
yarn workspace @openvaa/frontend check

# 3. Unit test verification
yarn test:unit

# 4. Directive removal verification
grep -r '<svelte:options runes' apps/frontend/src/ | wc -l
# Expected: 0

# 5. Check for runes-related warnings in build output
yarn workspace @openvaa/frontend build 2>&1 | grep -i 'runes\|legacy'
# Expected: no matches
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Per-file `<svelte:options runes />` | Global `dynamicCompileOptions` | Svelte 5.0 (Oct 2024) | Per-file opt-in no longer needed when global runes is enabled |
| `compilerOptions: { runes: true }` | `dynamicCompileOptions` with node_modules check | vite-plugin-svelte 4.0+ | Safe third-party library coexistence |
| `createEventDispatcher` + `on:event` | Callback props | Svelte 5.0 (Oct 2024) | Legacy syntax deprecated, still functional in legacy mode components |

## Open Questions

1. **Will `compilerOptions: { runes: true }` cause any issues with `svelte-check` processing?**
   - What we know: `svelte-check` excludes `node_modules` by default, so `svelte-visibility-change` won't be checked. For project files, runes mode is correct since all files will be runes-compatible after Phase 53.
   - What's unclear: Whether there are any edge cases where `svelte-check` might still try to process a `node_modules` Svelte file (e.g., via TypeScript project references).
   - Recommendation: Add the config, run `svelte-check`, and verify. If issues arise, remove `compilerOptions.runes` and rely solely on `dynamicCompileOptions` (accepting that `svelte-check` won't enforce runes mode).

2. **Double blank lines after directive removal**
   - What we know: When `<svelte:options runes />` is the first line of a file (followed by a blank line before `<script>`), removing it leaves a blank line at the top.
   - What's unclear: Whether Prettier's `format` command will clean this up automatically.
   - Recommendation: Run `yarn format` after removal to normalize formatting. If that's insufficient, use a targeted sed to collapse consecutive blank lines.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest (latest via catalog) |
| Config file | `apps/frontend/vitest.config.ts` |
| Quick run command | `yarn workspace @openvaa/frontend test:unit` |
| Full suite command | `yarn test:unit` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| R6.1 | Global runes enabled via dynamicCompileOptions | build smoke | `yarn build` | N/A (config verification, not test file) |
| R6.2 | Zero `<svelte:options runes />` directives remain | grep check | `grep -r '<svelte:options runes' apps/frontend/src/ \| wc -l` | N/A (grep verification) |
| R6.3 | Third-party libs work under global runes | build + unit | `yarn build && yarn test:unit` | Existing tests cover runtime behavior |
| R6.4 | Build succeeds with zero runes-related warnings | build smoke | `yarn build 2>&1 \| grep -ci 'runes'` | N/A (build output check) |

### Sampling Rate
- **Per task commit:** `yarn workspace @openvaa/frontend test:unit`
- **Per wave merge:** `yarn build && yarn test:unit`
- **Phase gate:** Full build green + zero grep matches for `<svelte:options runes` + `svelte-check` passes

### Wave 0 Gaps
None -- existing test infrastructure covers all phase requirements. No new test files needed. Verification is primarily through build success, grep checks, and existing unit tests.

## Sources

### Primary (HIGH confidence)
- `@sveltejs/vite-plugin-svelte` v6.2.1 type definitions (`src/public.d.ts`) -- `dynamicCompileOptions` API signature and `SvelteConfig` vs `PluginOptions` type hierarchy
- `@sveltejs/vite-plugin-svelte` source (`src/utils/options.js`) -- confirmed `vitePlugin` key is read and merged from svelte.config.js
- [Svelte Issue #9632](https://github.com/sveltejs/svelte/issues/9632) -- official resolution: use `dynamicCompileOptions` for mixed runes/legacy codebases
- [Svelte Issue #11523](https://github.com/sveltejs/svelte/issues/11523) -- resolved via documentation update; confirms `dynamicCompileOptions` is the intended mechanism
- [vite-plugin-svelte config docs](https://github.com/sveltejs/vite-plugin-svelte/blob/main/docs/config.md) -- `dynamicCompileOptions` documentation
- [sv check docs](https://svelte.dev/docs/cli/sv-check) -- confirms `node_modules` excluded by default

### Secondary (MEDIUM confidence)
- [Svelte 5 Migration Guide](https://svelte.dev/docs/svelte/v5-migration-guide) -- `on:event` deprecated but functional in legacy mode
- [Svelte Legacy on: Docs](https://svelte.dev/docs/svelte/legacy-on) -- `on:` directive not available in runes mode
- [svelte:options Docs](https://svelte.dev/docs/svelte/svelte-options) -- `runes={true|false}` attribute available for per-file control

### Tertiary (LOW confidence)
None -- all findings verified against primary sources.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all versions verified from installed `node_modules/*/package.json`
- Architecture: HIGH - `dynamicCompileOptions` API verified from vite-plugin-svelte type definitions and source code
- Pitfalls: HIGH - each pitfall sourced from official Svelte issues, type definitions, or codebase analysis

**Research date:** 2026-03-28
**Valid until:** 2026-04-28 (stable configuration -- unlikely to change in 30 days)
