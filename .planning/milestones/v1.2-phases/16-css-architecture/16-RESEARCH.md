# Phase 16: CSS Architecture - Research

**Researched:** 2026-03-15
**Domain:** Tailwind CSS 4 CSS-first configuration + DaisyUI 5 migration
**Confidence:** HIGH

## Summary

This phase migrates the frontend styling from the Phase 15 compatibility bridge (Tailwind 4 + JS config + DaisyUI 4 pre-built CSS) to a fully native Tailwind 4 CSS-first configuration with DaisyUI 5. The JS `tailwind.config.mjs` is deleted entirely, all theme tokens move to `@theme` directives in CSS, DaisyUI upgrades from v4 to v5 with its `@plugin "daisyui"` native integration, and all OKLCH variable references throughout the codebase are updated from DaisyUI 4's short names (`--p`, `--s`, `--b1`, etc.) to DaisyUI 5's descriptive names (`--color-primary`, `--color-secondary`, `--color-base-100`, etc.).

The codebase has 22 components with `@reference` to `tailwind-theme.css`, 15+ TODO comments marking Phase 16 and Tailwind 4 work items, 6 occurrences of the removed `!bg-opacity-30` pattern, multiple direct OKLCH variable references in component templates and styles, and several DaisyUI 4 class names that are renamed or removed in v5. The migration is primarily a search-and-replace operation with careful attention to the OKLCH variable rename mapping and DaisyUI class name changes.

**Primary recommendation:** Upgrade DaisyUI to v5 (`daisyui@^5`), rewrite `app.css` to use `@plugin "daisyui"` + `@plugin "daisyui/theme"` for custom light/dark themes with hex color values, migrate all theme tokens from JS to `@theme` directives with namespace clearing (`--radius-*: initial;` etc.), and do a comprehensive find-and-replace pass for OKLCH variable renames and class name changes.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Hardcode current default colors directly in CSS as custom properties (hex values from current staticSettings.ts)
- Prepare for future runtime configurability -- colors should be CSS custom properties that can be overridden at runtime
- Preserve existing color aliases exactly: info=accent, success=primary, warning=error (zero visual change)
- staticSettings.colors type stays in TypeScript but the build pipeline stops consuming it for CSS generation
- Use `@plugin "daisyui"` directive (native TW4 integration, not pre-built CSS imports)
- Comprehensive class name audit across all 22+ component files -- update every renamed DaisyUI 5 class in one pass
- Update all direct OKLCH variable references throughout the codebase to DaisyUI 5 names (--p to --color-primary, --b1 to --color-base-100, etc.) -- complete migration, no bridge aliases
- Fix all TW3 opacity patterns (bg-opacity, text-opacity, !bg-opacity-30) across all files -- convert to TW4 syntax
- Preserve all existing custom token names exactly (spacing-xs/sm/md/lg/xl/xxl, rounded-sm/md/lg, text-md, etc.)
- Preserve restrictive approach: only project-defined tokens available (no TW4 defaults for spacing, border-radius, line-height, font-weight, font-size)
- Replace custom h-screen/min-h-screen overrides with TW4's built-in h-dvh/min-h-dvh
- Fix match-w-xl custom screen to use rem-based value in TW4-compatible way
- Delete tailwind.config.mjs entirely
- Delete tailwind.config.tw4-compat.mjs wrapper
- Remove pre-built DaisyUI CSS imports
- Remove manual OKLCH theme blocks from app.css
- Fix @apply duplications using CSS selector grouping
- Update or remove tailwind-theme.css @reference file
- Resolve ALL TODO[Phase 16] and TODO[Tailwind 4] comments

### Claude's Discretion
- Custom non-DaisyUI variables (--line-color, --progress-color, --progress-label-color): keep as custom CSS vars or map to DaisyUI names -- pick what makes maintenance easiest
- @reference strategy for scoped style blocks: update all 22 paths or find a single-reference approach -- pick the cleanest TW4-compatible path
- Exact DaisyUI 5 theme configuration syntax for light/dark themes with the custom color overrides

### Deferred Ideas (OUT OF SCOPE)
- Runtime color configuration -- Moving colors from staticSettings to dynamicSettings so admins can change colors while the app is running
- tailwind-merge utility -- Rewriting the concatClasses paradigm to use tailwind-merge (deferred to v1.3)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CSS-01 | Tailwind CSS 4 with CSS-first @theme configuration replaces JS config | @theme directive with namespace clearing (--spacing-*: initial, --radius-*: initial, etc.) replaces tailwind.config.mjs; all tokens documented with exact CSS syntax |
| CSS-02 | DaisyUI 5 integrated with updated class names across all templates | Complete DaisyUI 4-to-5 class rename mapping documented; affected files identified via grep |
| CSS-03 | Custom theme (spacing, fonts, colors, radii) migrated from JS to CSS @theme directives | Exact @theme variable naming (--spacing-*, --radius-*, --text-*, --leading-*, --font-weight-*, --font-*) documented with project-specific values |
| CSS-04 | Dynamic color system (staticSettings) works with CSS-first Tailwind 4 | DaisyUI 5 @plugin "daisyui/theme" supports hex values directly; colors become CSS custom properties overridable at runtime |
| CSS-05 | DaisyUI OKLCH variable renames applied (no silent color failures) | Complete old-to-new variable mapping documented; all codebase references identified for find-and-replace |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| tailwindcss | ^4.2.1 | CSS framework | Already installed; CSS-first config is the v4 paradigm |
| @tailwindcss/vite | ^4.2.1 | Vite integration | Already installed; replaces PostCSS pipeline |
| daisyui | ^5.5 | Component library | Upgrade from ^4.12; native TW4 support via @plugin |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| prettier-plugin-tailwindcss | ^0.6.9 | Class sorting | Already installed; no changes needed |

### Removals
| Library | Reason |
|---------|--------|
| tailwind.config.mjs | Replaced by @theme directives in app.css |
| tailwind.config.tw4-compat.mjs | Compat wrapper no longer needed |

**Installation:**
```bash
yarn workspace @openvaa/frontend add daisyui@^5
```

No other package changes needed. Tailwind 4 and @tailwindcss/vite are already at ^4.2.1.

## Architecture Patterns

### Target app.css Structure
```css
@import "tailwindcss";

/* DaisyUI 5 native integration */
@plugin "daisyui" {
  themes: false;  /* Disable built-in themes; use custom below */
  logs: false;
}

/* Custom light theme */
@plugin "daisyui/theme" {
  name: "light";
  default: true;
  color-scheme: light;
  --color-primary: #2546a8;
  --color-primary-content: #ffffff;
  --color-secondary: #666666;
  --color-secondary-content: #ffffff;
  --color-accent: #0a716b;
  --color-accent-content: #ffffff;
  --color-neutral: #333333;
  --color-neutral-content: #ffffff;
  --color-base-100: #ffffff;
  --color-base-200: #e8f5f6;
  --color-base-300: #d1ebee;
  --color-base-content: #333333;
  --color-info: #0a716b;         /* = accent */
  --color-info-content: #ffffff;
  --color-success: #2546a8;      /* = primary */
  --color-success-content: #ffffff;
  --color-warning: #a82525;      /* = error */
  --color-warning-content: #ffffff;
  --color-error: #a82525;        /* = warning */
  --color-error-content: #ffffff;
  --radius-box: 0.25rem;
  --radius-field: 0.5rem;
  --radius-selector: 0.5rem;
  --border: 0px;
}

/* Custom dark theme */
@plugin "daisyui/theme" {
  name: "dark";
  prefersdark: true;
  color-scheme: dark;
  --color-primary: #6887e3;
  /* ... dark colors ... */
  --radius-box: 0.25rem;
  --radius-field: 0.5rem;
  --radius-selector: 0.5rem;
  --border: 0px;
}

/* Custom theme tokens -- replaces tailwind.config.mjs theme object */
@theme {
  /* Clear TW4 defaults for restrictive design system */
  --radius-*: initial;
  --spacing-*: initial;
  --text-*: initial;
  --leading-*: initial;
  --font-weight-*: initial;
  --font-*: initial;
  --transition-duration-*: initial;

  /* Border radius */
  --radius-none: 0px;
  --radius-sm: 0.125rem;
  --radius-DEFAULT: 0.125rem;
  --radius-md: 0.25rem;
  --radius-lg: 0.5rem;
  --radius-full: 9999px;

  /* Spacing (all custom named tokens) */
  --spacing-px: 1px;
  --spacing-0: 0px;
  --spacing-2: 0.125rem;
  --spacing-4: 0.25rem;
  --spacing-xs: 0.25rem;
  /* ... etc ... */

  /* Font sizes with associated line-heights */
  --text-xs: 0.71875rem;
  --text-xs--line-height: 1.21;
  --text-md: 0.9375rem;
  --text-md--line-height: 1.35;
  /* ... etc ... */

  /* Custom non-DaisyUI CSS variables per theme */
  /* These stay as regular CSS vars, not @theme tokens */
}
```

### @reference Strategy for Scoped Styles

**Recommendation (Claude's Discretion):** Update `tailwind-theme.css` to reference `app.css` directly instead of importing Tailwind and the compat config separately. Since DaisyUI 5 registers its colors natively via `@plugin`, the manual `@theme` color registration block is no longer needed in the reference file.

The new `tailwind-theme.css` becomes:
```css
@reference "../app.css";
```

This single line replaces the entire current file (17 lines of @import + @config + @theme color registrations). All 22 component files continue to use `@reference "../../../tailwind-theme.css"` with no path changes needed.

**Rationale:** Using `@reference "app.css"` makes the reference file a pure passthrough. DaisyUI 5's `@plugin` handles color registration, and `@theme` handles custom tokens -- both are in `app.css`. The `@reference` directive is designed exactly for this purpose: loading the full stylesheet for `@apply` resolution without duplicating CSS output.

### Custom Non-DaisyUI Variables

**Recommendation (Claude's Discretion):** Keep `--line-color`, `--progress-color`, and `--progress-label-color` as plain CSS custom properties defined in the theme blocks (inside `@plugin "daisyui/theme"` or in a separate `:root` / `[data-theme]` block). They are not DaisyUI semantic colors and serve component-specific purposes. Mapping them to DaisyUI names would conflate concerns.

These should be defined alongside the DaisyUI theme or in a `:root`/`[data-theme]` block after the theme plugins:
```css
:root,
[data-theme="light"] {
  --line-color: #d9d9d9;
  --progress-color: var(--color-neutral);
  --progress-label-color: var(--color-neutral);
}
[data-theme="dark"] {
  --line-color: #262626;
  --progress-color: var(--color-neutral);
  --progress-label-color: var(--color-neutral);
}
```

Note: `--progress-color` and `--progress-label-color` currently use `oklch(var(--n))` -- these should be updated to use `var(--color-neutral)` since DaisyUI 5 provides the full color value in `--color-neutral` (not just OKLCH components).

### Anti-Patterns to Avoid
- **Mixing @config and @theme:** Do not keep the JS config alongside @theme directives. TW4 CSS takes precedence, creating confusion.
- **Bridge aliases for old OKLCH vars:** Do not create `--p: ...` aliases to maintain backward compatibility. Clean migration is safer than maintaining two systems.
- **Using @apply with DaisyUI component classes:** DaisyUI 5 uses native CSS nesting; `@apply btn` or `@apply menu-active` will not work. Only use @apply with Tailwind utility classes.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| DaisyUI color registration | Manual @theme color vars | `@plugin "daisyui"` | DaisyUI 5 handles this natively; manual registration was Phase 15 workaround |
| Theme light/dark switching | Manual `[data-theme]` CSS blocks | `@plugin "daisyui/theme"` | DaisyUI 5 generates proper data-theme selectors |
| OKLCH color conversion | Converting hex to oklch manually | Hex values in `@plugin "daisyui/theme"` | DaisyUI 5 accepts any color format directly |
| Dynamic viewport height | Triple-fallback `fixedScreenHeight` | TW4 built-in `h-dvh`, `min-h-dvh` | TW4 has native dvh support since v3.4 |
| Safelist | JS safelist array | `@source inline()` | Already done in Phase 15; keep this pattern |

**Key insight:** Phase 15's manual OKLCH theme blocks, DaisyUI pre-built CSS imports, and @theme color registrations were all workarounds for DaisyUI 4's incompatibility with TW4. DaisyUI 5 eliminates ALL of these -- its `@plugin` directive handles everything natively.

## Common Pitfalls

### Pitfall 1: Silent Color Failures from OKLCH Variable Renames
**What goes wrong:** DaisyUI 5 renames `--p` to `--color-primary`, `--b1` to `--color-base-100`, etc. Any code using `oklch(var(--p))` will silently render as black/transparent because `--p` is no longer set.
**Why it happens:** DaisyUI 5 no longer sets the short variable names. The values are only available via the new `--color-*` names.
**How to avoid:** Comprehensive grep for ALL old variable patterns before and after migration. The complete mapping is documented below in Code Examples.
**Warning signs:** Colors appearing as black, transparent, or wrong hue in the UI.

### Pitfall 2: DaisyUI 5 Color Format Change
**What goes wrong:** In DaisyUI 4, `oklch(var(--p))` worked because `--p` contained `L C H` components (e.g., `43.26% 0.162 265.69`). In DaisyUI 5, `--color-primary` contains the COMPLETE color value (e.g., `oklch(43.26% 0.162 265.69)`). Writing `oklch(var(--color-primary))` would double-wrap: `oklch(oklch(...))`.
**Why it happens:** DaisyUI 5 stores full color values, not just OKLCH components.
**How to avoid:** Replace `oklch(var(--p))` with `var(--color-primary)`, NOT `oklch(var(--color-primary))`.
**Warning signs:** CSS parsing errors, colors not rendering.

### Pitfall 3: @apply with DaisyUI Component Classes
**What goes wrong:** `@apply btn`, `@apply menu-active`, etc. fail in DaisyUI 5 because component styles use native CSS nesting, which @apply cannot extract.
**Why it happens:** DaisyUI 5 moved from PostCSS-based class generation to native CSS.
**How to avoid:** Only use @apply with Tailwind utility classes (bg-primary, text-sm, etc.). Use DaisyUI classes directly in HTML templates.
**Warning signs:** Build errors from @apply directives. Note: the current codebase does NOT @apply any DaisyUI component classes (verified by grep), so this is informational only.

### Pitfall 4: Namespace Override Forgetting Defaults
**What goes wrong:** Using `--spacing-*: initial;` removes ALL TW4 default spacing utilities. If any component uses a default spacing class (like `p-4`), it breaks.
**Why it happens:** The project's restrictive design system intentionally provides only custom tokens, but there may be unintended use of default utilities.
**How to avoid:** The current JS config already replaces defaults (not extends), so this is the same behavior. Verify the exact custom token names match what the old config provided.
**Warning signs:** Missing utility class warnings during build.

### Pitfall 5: DaisyUI Class Renames Breaking Components
**What goes wrong:** Classes like `form-control`, `label-text`, `input-bordered`, `select-bordered`, `textarea-bordered` are removed in DaisyUI 5.
**Why it happens:** DaisyUI 5 restructured form controls -- inputs/selects now have borders by default, `form-control` replaced by `fieldset`.
**How to avoid:** Audit all DaisyUI class usage before migration. The admin pages (`question-info`, `argument-condensation`) use the most affected classes.
**Warning signs:** Unstyled form elements, missing label formatting.

### Pitfall 6: --rounded-box, --rounded-btn, --rounded-badge Renamed
**What goes wrong:** These DaisyUI 4 CSS variables are renamed in v5: `--rounded-box` to `--radius-box`, `--rounded-btn` to `--radius-field`, `--rounded-badge` to `--radius-selector`.
**Why it happens:** DaisyUI 5 standardized its CSS variable naming.
**How to avoid:** Update all theme configuration to use new names. The Alert.svelte component directly references `var(--rounded-box)` in a class string -- this must be updated to `var(--radius-box)`.
**Warning signs:** Default border radius instead of custom values.

### Pitfall 7: --animation-btn, --animation-input, --btn-focus-scale Removed
**What goes wrong:** These DaisyUI 4 CSS variables are completely removed in v5, not renamed.
**Why it happens:** DaisyUI 5 simplified its animation system.
**How to avoid:** Remove these from theme configuration. The project sets `--animation-btn: var(--duration-sm)` and `--btn-focus-scale: 0.95` -- these have no DaisyUI 5 equivalent and should simply be dropped.
**Warning signs:** No visual impact (DaisyUI 5 handles these internally).

## Code Examples

### Complete OKLCH Variable Rename Mapping (DaisyUI 4 to 5)

```
OLD (DaisyUI 4)           NEW (DaisyUI 5)                  USAGE CHANGE
--p                       --color-primary                  oklch(var(--p))     -> var(--color-primary)
--pc                      --color-primary-content          oklch(var(--pc))    -> var(--color-primary-content)
--s                       --color-secondary                oklch(var(--s))     -> var(--color-secondary)
--sc                      --color-secondary-content        oklch(var(--sc))    -> var(--color-secondary-content)
--a                       --color-accent                   oklch(var(--a))     -> var(--color-accent)
--ac                      --color-accent-content           oklch(var(--ac))    -> var(--color-accent-content)
--n                       --color-neutral                  oklch(var(--n))     -> var(--color-neutral)
--nc                      --color-neutral-content          oklch(var(--nc))    -> var(--color-neutral-content)
--b1                      --color-base-100                 oklch(var(--b1))    -> var(--color-base-100)
--b2                      --color-base-200                 oklch(var(--b2))    -> var(--color-base-200)
--b3                      --color-base-300                 oklch(var(--b3))    -> var(--color-base-300)
--bc                      --color-base-content             oklch(var(--bc))    -> var(--color-base-content)
--in                      --color-info                     oklch(var(--in))    -> var(--color-info)
--inc                     --color-info-content             oklch(var(--inc))   -> var(--color-info-content)
--su                      --color-success                  oklch(var(--su))    -> var(--color-success)
--suc                     --color-success-content          oklch(var(--suc))   -> var(--color-success-content)
--wa                      --color-warning                  oklch(var(--wa))    -> var(--color-warning)
--wac                     --color-warning-content          oklch(var(--wac))   -> var(--color-warning-content)
--er                      --color-error                    oklch(var(--er))    -> var(--color-error)
--erc                     --color-error-content            oklch(var(--erc))   -> var(--color-error-content)
--fallback-b1             (removed)                        Remove fallback pattern
--fallback-bc             (removed)                        Remove fallback pattern

DaisyUI config variables:
--rounded-box             --radius-box
--rounded-btn             --radius-field
--rounded-badge           --radius-selector
--animation-btn           (removed)
--animation-input         (removed)
--btn-focus-scale          (removed)
--border-btn              --border
--tab-border              --border
--tab-radius              --radius-field
```

### DaisyUI 5 Class Name Changes Affecting This Codebase

```
OLD (DaisyUI 4)           NEW (DaisyUI 5)               AFFECTED FILES
form-control              (removed; use fieldset)        question-info, argument-condensation, LanguageSelector
label-text                (removed; use label)           question-info, argument-condensation, TermsOfUseForm,
                                                         ElectionSelector, EnumeratedEntityFilter
label-text-alt            (removed)                      question-info
input-bordered            (removed; border is default)   question-info, TextEntityFilter, PreviewColorContrast
select-bordered           (removed; border is default)   question-info, argument-condensation
textarea-bordered         (removed; border is default)   question-info, Feedback
```

Note: Classes used in the main voter/candidate app components (btn, card, checkbox, drawer, divider, select, input, textarea, radio, toggle, alert) are NOT renamed in DaisyUI 5 -- only the modifiers listed above changed.

### TW3 Opacity Pattern Migration

```svelte
<!-- OLD: TW3 bg-opacity pattern (Video.svelte, 6 occurrences) -->
class="rounded-full !bg-opacity-30 active:bg-white"

<!-- NEW: TW4 slash opacity syntax -->
class="rounded-full bg-white/30 active:bg-white"
```

Note: The `!bg-opacity-30` class was used on Button components with `color="white"`. In TW4, opacity is applied via the slash syntax. Since these buttons have a white background with 30% opacity, the correct migration is `bg-white/30`.

### @theme Font Size with Line Height

```css
/* Source: Tailwind CSS 4 docs */
@theme {
  --text-xs: 0.71875rem;        /* 11.5/16 */
  --text-xs--line-height: 1.21;
  --text-sm: 0.8125rem;         /* 13/16 */
  --text-sm--line-height: 1.35;
  --text-md: 0.9375rem;         /* 15/16 */
  --text-md--line-height: 1.35;
  --text-base: 0.9375rem;       /* 15/16, same as md */
  --text-base--line-height: 1.35;
  --text-lg: 1.0625rem;         /* 17/16 */
  --text-lg--line-height: 1.21;
  --text-xl: 1.25rem;           /* 20/16 */
  --text-xl--line-height: 1.21;
  --text-2xl: 1.4375rem;        /* 23/16 */
  --text-2xl--line-height: 1.21;
  --text-3xl: 1.75rem;          /* 28/16 */
  --text-3xl--line-height: 1.21;
}
```

### @theme Complete Spacing Migration

```css
@theme {
  --spacing-*: initial;  /* Clear all TW4 defaults */

  --spacing-px: 1px;
  --spacing-0: 0px;
  --spacing-2: 0.125rem;
  --spacing-4: 0.25rem;
  --spacing-xs: 0.25rem;
  --spacing-6: 0.375rem;
  --spacing-8: 0.5rem;
  --spacing-sm: 0.5rem;
  --spacing-10: 0.625rem;
  --spacing-md: 0.625rem;
  --spacing-12: 0.75rem;
  --spacing-14: 0.875rem;
  --spacing-16: 1rem;
  --spacing-18: 1.125rem;
  --spacing-20: 1.25rem;
  --spacing-lg: 1.25rem;
  --spacing-24: 1.5rem;
  --spacing-32: 2rem;
  --spacing-40: 2.5rem;
  --spacing-xl: 2.5rem;
  --spacing-44: 2.75rem;
  --spacing-48: 3rem;
  --spacing-60: 3.75rem;
  --spacing-xxl: 3.75rem;
  --spacing-100: 6.25rem;

  /* Safe area spacing */
  --spacing-safel: env(safe-area-inset-left, 0px);
  --spacing-safer: env(safe-area-inset-right, 0px);
  --spacing-safet: env(safe-area-inset-top, 0px);
  --spacing-safeb: env(safe-area-inset-bottom, 0px);
  --spacing-safemdl: calc(env(safe-area-inset-left, 0px) + 0.625rem);
  --spacing-safemdr: calc(env(safe-area-inset-right, 0px) + 0.625rem);
  --spacing-safemdt: calc(env(safe-area-inset-top, 0px) + 0.625rem);
  --spacing-safemdb: calc(env(safe-area-inset-bottom, 0px) + 0.625rem);
  --spacing-safelgl: calc(env(safe-area-inset-left, 0px) + 1.25rem);
  --spacing-safelgr: calc(env(safe-area-inset-right, 0px) + 1.25rem);
  --spacing-safelgt: calc(env(safe-area-inset-top, 0px) + 1.25rem);
  --spacing-safelgb: calc(env(safe-area-inset-bottom, 0px) + 1.25rem);
  --spacing-safenavt: calc(env(safe-area-inset-top, 0px) + 1rem);
  --spacing-touch: 2.75rem;
}
```

### @theme Border Radius Migration

```css
@theme {
  --radius-*: initial;  /* Clear TW4 defaults */

  --radius-none: 0px;
  --radius-sm: 0.125rem;        /* Tab */
  --radius-DEFAULT: 0.125rem;
  --radius-md: 0.25rem;         /* Card */
  --radius-lg: 0.5rem;          /* Button, input, speech bubble */
  --radius-full: 9999px;
}
```

### @theme Border Width, Line Height, Font Weight, Font Family

```css
@theme {
  /* Border width */
  --border-width-*: initial;
  /* Note: TW4 uses --border-width-* namespace -- verify exact naming */
  /* The project may need @utility or plain CSS for custom border widths */

  /* Line height */
  --leading-*: initial;
  --leading-none: 1;
  --leading-sm: 1.21;
  --leading-md: 1.35;
  --leading-lg: 1.65;

  /* Font weight */
  --font-weight-*: initial;
  --font-weight-normal: 400;
  --font-weight-bold: 700;

  /* Font family */
  --font-*: initial;
  --font-base: "Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
  --font-emoji: "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";

  /* Transition duration */
  --transition-duration-*: initial;
  /* Note: TW4 uses --duration-* for transition durations -- verify exact naming */
}
```

### match-w-xl Screen Fix

```css
@theme {
  /* Custom screen breakpoint */
  --breakpoint-xs: 320px;
  /* match-w-xl uses rem-based media query for accessibility */
  /* TW4 requires px values for --breakpoint-*; use @custom-variant instead */
}

/* Use @custom-variant for rem-based media query */
@custom-variant match-w-xl (@media screen and (min-width: 36rem));
```

### h-screen / min-h-screen to h-dvh / min-h-dvh

Files to update:
```
app.html:        min-h-screen  ->  min-h-dvh
app.css (.drawer): min-h-screen  ->  min-h-dvh
+layout.svelte:  h-screen      ->  h-dvh  (2 occurrences)
Layout.svelte:   max-h-screen  ->  max-h-dvh
error.html:      h-screen      ->  h-dvh
```

## State of the Art

| Old Approach (Phase 15) | Current Approach (Phase 16) | Impact |
|------------------------|-----------------------------|--------|
| `@config "tailwind.config.mjs"` | `@theme { ... }` directives | Full CSS-first, no JS dependency |
| DaisyUI 4 pre-built CSS imports | `@plugin "daisyui"` | Native TW4 integration |
| Manual OKLCH theme blocks | `@plugin "daisyui/theme"` | DaisyUI handles theme generation |
| Manual `@theme` color registration | DaisyUI 5 auto-registration | Colors automatically available as utilities |
| `oklch(var(--p))` | `var(--color-primary)` | Simpler, more readable |
| `!bg-opacity-30` | `bg-white/30` | TW4 native opacity syntax |
| Triple-fallback `fixedScreenHeight` | `h-dvh` / `min-h-dvh` | Built-in since TW 3.4 |
| `--rounded-box`, `--rounded-btn` | `--radius-box`, `--radius-field` | DaisyUI 5 naming convention |

**Deprecated/outdated:**
- `--p`, `--s`, `--a`, `--n`, `--b1-3`, `--bc`, `--in`, `--su`, `--wa`, `--er` (and content variants): Replaced by `--color-*` names
- `--rounded-box/btn/badge`: Replaced by `--radius-box/field/selector`
- `--animation-btn`, `--animation-input`, `--btn-focus-scale`: Removed entirely
- `bg-opacity-*`, `text-opacity-*`: Replaced by slash syntax (`bg-white/30`)
- `form-control`, `label-text`, `input-bordered`, `select-bordered`, `textarea-bordered`: Removed in DaisyUI 5

## Affected Files Inventory

### Files to DELETE
1. `apps/frontend/tailwind.config.mjs` (273 lines)
2. `apps/frontend/tailwind.config.tw4-compat.mjs` (18 lines)

### Files to REWRITE
3. `apps/frontend/src/app.css` (376 lines) -- complete rewrite to CSS-first

### Files to SIMPLIFY
4. `apps/frontend/src/tailwind-theme.css` (42 lines) -- reduce to single @reference line

### Files with OKLCH Variable References (MUST UPDATE)
5. `apps/frontend/src/routes/[[lang=locale]]/Banner.svelte` -- `oklch(var(--p))`
6. `apps/frontend/src/routes/[[lang=locale]]/(voters)/(located)/results/statistics/+page.svelte` -- `oklch(var(--n))`
7. `apps/frontend/src/lib/components/questions/QuestionChoices.svelte` -- `var(--b1)`, `var(--b2)`, `oklch(var(--b1))`, `oklch(var(--line-bg))`
8. `apps/frontend/src/lib/components/scoreGauge/ScoreGauge.svelte` -- `oklch(var(--n))`, `oklch(var(--b3))`
9. `apps/frontend/src/lib/components/scoreGauge/ScoreGauge.type.ts` -- doc comment `oklch(var(--n))`
10. `apps/frontend/src/lib/components/input/Input.svelte` -- `oklch(var(--b1))`, `oklch(var(--b3))`

### Files with TW3 Opacity Patterns (MUST UPDATE)
11. `apps/frontend/src/lib/components/video/Video.svelte` -- 6x `!bg-opacity-30`

### Files with @apply TODO Comments (MUST RESOLVE)
12. `apps/frontend/src/lib/components/button/Button.svelte` -- text-opacity TODO
13. `apps/frontend/src/lib/components/questions/QuestionChoices.svelte` -- small-label duplication
14. `apps/frontend/src/lib/components/video/Video.svelte` -- small-info duplication

### Files with DaisyUI 4 Removed Classes (MUST UPDATE)
15. `apps/frontend/src/routes/[[lang=locale]]/admin/(protected)/question-info/+page.svelte` -- form-control, label-text, input-bordered, select-bordered, textarea-bordered, label-text-alt
16. `apps/frontend/src/routes/[[lang=locale]]/admin/(protected)/argument-condensation/+page.svelte` -- label-text, select-bordered
17. `apps/frontend/src/lib/dynamic-components/feedback/Feedback.svelte` -- textarea-bordered
18. `apps/frontend/src/lib/candidate/components/termsOfUse/TermsOfUseForm.svelte` -- label-text
19. `apps/frontend/src/lib/admin/components/languageFeatures/LanguageSelector.svelte` -- form-control
20. `apps/frontend/src/lib/components/entityFilters/text/TextEntityFilter.svelte` -- input-bordered
21. `apps/frontend/src/lib/components/electionSelector/ElectionSelector.svelte` -- label-text
22. `apps/frontend/src/lib/components/entityFilters/enumerated/EnumeratedEntityFilter.svelte` -- label-text
23. `apps/frontend/src/lib/utils/color/PreviewColorContrast.svelte` -- input-bordered

### Files with h-screen / min-h-screen (MUST UPDATE)
24. `apps/frontend/src/app.html` -- min-h-screen
25. `apps/frontend/src/app.css` -- min-h-screen (.drawer)
26. `apps/frontend/src/routes/[[lang=locale]]/+layout.svelte` -- h-screen (2x)
27. `apps/frontend/src/routes/[[lang=locale]]/Layout.svelte` -- max-h-screen
28. `apps/frontend/src/error.html` -- h-screen

### Files with DaisyUI Config Variable References (MUST UPDATE)
29. `apps/frontend/src/lib/components/alert/Alert.svelte` -- `var(--rounded-box)`

### Files with match-w-xl (NO PATH CHANGE, but definition moves)
30-34. 5 files use `match-w-xl:` class prefix -- definition moves from JS config to @custom-variant

## Open Questions

1. **TW4 border-width namespace**
   - What we know: TW4 uses `--border-width-*` but the exact naming for custom border widths needs verification during implementation
   - What's unclear: Whether custom border widths like `border-md`, `border-lg`, `border-xl` require `--border-width-*` or a different namespace
   - Recommendation: Try `--border-width-md: 1px;` etc. during implementation; if it does not work, use `@utility` directive

2. **TW4 transition-duration namespace**
   - What we know: TW4 has `--transition-duration-*` theme variables
   - What's unclear: The exact namespace name (`--transition-duration-*` vs `--duration-*`)
   - Recommendation: Check TW4 docs during implementation; the project uses `duration-sm`, `duration-md` etc.

3. **DaisyUI 5 @plugin "daisyui/theme" extra variables**
   - What we know: DaisyUI 5 accepts custom CSS variables inside `@plugin "daisyui/theme"` blocks
   - What's unclear: Whether custom non-DaisyUI variables (like `--line-color`) can be defined inside the theme plugin block or must be separate
   - Recommendation: Define them separately in `:root`/`[data-theme]` blocks for clarity

## Sources

### Primary (HIGH confidence)
- [Tailwind CSS Functions and Directives](https://tailwindcss.com/docs/functions-and-directives) - @reference, @theme, @plugin, @source, @config syntax
- [Tailwind CSS Theme Variables](https://tailwindcss.com/docs/theme) - @theme namespaces, --*: initial; override pattern, @theme inline
- [Tailwind CSS Font Size](https://tailwindcss.com/docs/font-size) - --text-*--line-height combined variable pattern
- [DaisyUI 5 Upgrade Guide](https://daisyui.com/docs/upgrade/) - Complete class rename list, breaking changes
- [DaisyUI 5 Release Notes](https://daisyui.com/docs/v5/) - OKLCH variable rename mapping
- [DaisyUI 5 Config](https://daisyui.com/docs/config/) - @plugin "daisyui" and @plugin "daisyui/theme" syntax
- [DaisyUI 5 Colors](https://daisyui.com/docs/colors/) - CSS variable names, color-mix() for opacity
- [DaisyUI 5 Utilities](https://daisyui.com/docs/utilities/) - --radius-box, --radius-field, --radius-selector, --border, --size-field, --size-selector
- [DaisyUI 5 Themes](https://daisyui.com/docs/themes/) - Custom theme definition, data-theme attribute, hex color support

### Secondary (MEDIUM confidence)
- [DaisyUI 5 LogRocket Overview](https://blog.logrocket.com/daisyui-5-whats-new/) - Feature overview and color format confirmation
- [DaisyUI @apply Discussion](https://github.com/saadeghi/daisyui/discussions/3361) - @apply limitations with DaisyUI 5 component classes
- [DaisyUI npm](https://www.npmjs.com/package/daisyui) - Latest version 5.5.19

### Tertiary (LOW confidence)
- TW4 border-width namespace exact naming - needs implementation-time verification
- TW4 transition-duration namespace exact naming - needs implementation-time verification

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - DaisyUI 5 and TW4 are stable releases; versions verified via npm
- Architecture: HIGH - @theme, @plugin, @reference directives verified via official TW4 and DaisyUI 5 docs
- OKLCH variable mapping: HIGH - complete mapping verified via DaisyUI 5 release notes and upgrade guide
- Class name renames: HIGH - verified via official DaisyUI 5 upgrade guide
- Pitfalls: HIGH - identified from official docs and codebase grep analysis
- TW4 namespace details (border-width, duration): MEDIUM - verified general pattern, exact naming needs implementation check

**Research date:** 2026-03-15
**Valid until:** 2026-04-15 (stable libraries, unlikely to change)
