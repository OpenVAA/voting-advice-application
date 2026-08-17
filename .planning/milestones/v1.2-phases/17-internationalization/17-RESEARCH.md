# Phase 17: Internationalization - Research

**Researched:** 2026-03-16
**Domain:** SvelteKit i18n migration from sveltekit-i18n to Paraglide JS with runtime override wrapper
**Confidence:** HIGH

## Summary

This research provides the planner with verified technical details for migrating OpenVAA's i18n from sveltekit-i18n v2.4.2 to Paraglide JS v2.15.0 (inlang) with a runtime override wrapper for backend `translationOverrides`.

Paraglide JS is a compiler-based i18n library that generates tree-shakable, type-safe message functions at build time. Each message compiles to a JavaScript function that calls `getLocale()` at runtime to select the correct locale string -- there is no runtime message dictionary, no JSON parsing, and no dynamic message loading. This means backend translation overrides (the ~30 keys in `dynamic.json`) cannot use Paraglide's message system directly. Instead, a thin wrapper function checks a runtime override store first and falls back to Paraglide's compiled `m["key"]()` functions.

The migration involves three distinct challenges: (1) converting 46 JSON translation files per locale from ICU-format strings to inlang's variant syntax (plurals, dates, selects), (2) converting 740 `$t('dot.notation.key', {payload})` call sites to the wrapper format, and (3) replacing SvelteKit routing hooks with Paraglide's `reroute` hook and `paraglideMiddleware`. Verified through hands-on compilation tests, Paraglide handles nested JSON structures correctly, preserving dot-notation keys as bracket-notation exports (`m["common.back"]()`).

**Primary recommendation:** Use Paraglide JS v2.15.0 with the default inlang message format plugin (v4), a thin runtime override wrapper using `intl-messageformat` for ICU parsing of override strings, and Paraglide's native SvelteKit integration (reroute hook + paraglideMiddleware).

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Evaluation result:** Migrate to Paraglide JS (inlang) with a runtime override wrapper for backend `translationOverrides`
- **Override wrapper:** Paraglide cannot inject translations at runtime. Solution: thin wrapper that checks a runtime override store first, falls back to Paraglide compiled messages. Only ~30 keys in `dynamic.json` are typically overridden.
- **TypeScript type safety:** Paraglide compiler generates type-safe message functions -- superior to current custom TranslationKey generator
- **ICU support:** Via Paraglide's inlang message format plugins. Runtime overrides use `intl-messageformat` for ICU parsing.
- **All translation keys migrated to Paraglide format** -- full adoption, no legacy key format preserved
- **Migration tolerance:** Big-bang replacement of all 740 call sites in one pass -- no dual-library period
- **File reorganization:** Required -- Paraglide uses its own message file format (inlang project structure)
- **Key format:** Current dot-notation keys migrated to Paraglide naming convention
- **Locale merge first:** Before migration, merge French and Luxembourgish from `deploy-luxemburg-vaa-2025` branch (5 to 7 locales)
- **Runtime translation loading:** Must preserve backend overrides. Drop DEFAULT_PAYLOAD_KEYS pattern. Hardcode terms in translations.
- **Locale routing:** Keep `[[lang=locale]]` URL pattern behavior (though implementation changes to Paraglide's reroute hook). Full page reload acceptable on locale change. Preserve soft locale matching.

### Claude's Discretion
- Whether `translate()`/`translateObject()` should be integrated into Paraglide or kept as separate utilities
- ICU runtime `parse()` function -- keep or simplify based on actual usage analysis
- Exact codemod strategy for converting 740 `$t()` call sites to Paraglide `m["key"]()` calls
- Override wrapper architecture details (store shape, ICU formatting for overrides, fallback chain)
- How Paraglide's inlang project structure maps to the current 56 JSON files x 7 locales
- Whether Paraglide's built-in SvelteKit reroute hook replaces all custom hooks.server.ts logic or just part of it

### Deferred Ideas (OUT OF SCOPE)
- Admin term replacement tool -- deferred to future milestone
- Database-driven translations (full Supabase-backed) -- deferred to Supabase migration
- Svelte 5 runes migration for i18n -- deferred to v1.3 content migration
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| I18N-01 | i18n alternatives evaluated against runtime translation loading pattern | Paraglide chosen per user decision; runtime override handled via wrapper pattern documented below |
| I18N-02 | If better alternative found, migrate all translation call sites | 740 `$t()` call sites become wrapper calls; mechanical transformation documented with examples |
| I18N-03 | Server hooks.ts cleaned of unnecessary i18n middleware | Paraglide's `paraglideMiddleware` and `reroute` hook replace most custom logic; candidate auth logic preserved |
| I18N-04 | ICU/intl message format variables migrated to new library format | ICU plurals/selects/dates must be converted to inlang variant syntax; date formatting via `datetime` registry; detailed conversion examples provided |
| I18N-05 | Language change in UI works (page reload acceptable) | Paraglide's `setLocale()` with default reload behavior; language switcher uses `localizeHref()` |
| I18N-06 | Routes without locale param support automatic language detection | Paraglide's strategy system with `url` + `cookie` + `baseLocale` handles detection; `extractLocaleFromHeader()` for Accept-Language |
| I18N-07 | API routes work correctly with locale parameter handling | Paraglide's `reroute` hook strips locale prefix transparently; API routes excluded via `isExcludedByRouteStrategy()` or route strategy config |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @inlang/paraglide-js | 2.15.0 | Compiler-based i18n: compile-time message functions, type-safe, tree-shakable | SvelteKit's official i18n recommendation; Svelte 5 native; actively maintained |
| @inlang/plugin-message-format | 4.x | Inlang message format plugin for JSON translation files | Default plugin; supports nested JSON, variants (plurals/selects), formatting (dates/numbers) |
| @inlang/plugin-m-function-matcher | 2.x | IDE support for m.xxx() function highlighting | Dev experience: highlights message functions in editor |
| intl-messageformat | 10.7.x | ICU message format parsing for runtime override strings | Already a dependency; needed ONLY for the runtime override wrapper to parse backend ICU strings |

### Removed
| Library | Version | Reason |
|---------|---------|--------|
| sveltekit-i18n | 2.4.2 | Replaced by Paraglide JS; unmaintained since 2023 |
| @sveltekit-i18n/base | * | Core dependency of sveltekit-i18n -- removed with it |
| @sveltekit-i18n/parser-icu | 1.0.8 | ICU parser for sveltekit-i18n -- Paraglide uses inlang format natively |

### Kept Unchanged
| Library/Utility | Purpose | Why Kept |
|-----------------|---------|----------|
| `translate()` / `translateObject()` | Pick correct locale from backend multi-locale objects | Independent of i18n library; only needs current locale value via `getLocale()` |
| `matchLocale()` | Soft locale matching (en-US -> en) | Library-agnostic utility; Paraglide has `extractLocaleFromHeader()` but custom soft matching still useful |
| `parseAcceptedLanguages()` | Accept-Language header parsing | Used alongside Paraglide's strategy system for custom Accept-Language logic |
| `intl-messageformat` | ICU runtime parsing for override strings | Retained for the runtime override wrapper only (not for Paraglide messages) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| intl-messageformat for overrides | Custom string interpolation | ICU syntax (plurals, dates) in overrides would break; intl-messageformat handles edge cases |
| Default inlang format | ICU message format plugin | ICU plugin exists but less documented; default format is actively maintained, well-tested |
| Multi-file pathPattern | Single file per locale | Single file simpler but loses organizational structure; multi-file with array pathPattern works |

**Installation:**
```bash
# Install Paraglide JS
yarn workspace @openvaa/frontend add @inlang/paraglide-js

# Remove old i18n libraries
yarn workspace @openvaa/frontend remove sveltekit-i18n @sveltekit-i18n/parser-icu

# Note: intl-messageformat stays (needed for runtime override wrapper)
# Note: @inlang/plugin-message-format and @inlang/plugin-m-function-matcher are CDN-loaded via settings.json, not npm installed
```

## Architecture Patterns

### Recommended Project Structure
```
apps/frontend/
  project.inlang/
    settings.json          # Paraglide project config (locales, plugins, pathPattern)
  messages/                # Translation files (inlang format)
    en/                    # One directory per locale
      common.json          # Nested JSON with inlang variant syntax
      results.json
      dynamic.json         # Keys that may be overridden at runtime
      ... (46 files)
    fi/
    sv/
    da/
    et/
    fr/                    # NEW: merged from deploy-luxemburg-vaa-2025
    lb/                    # NEW: merged from deploy-luxemburg-vaa-2025
  src/
    hooks.ts               # NEW: Paraglide reroute hook (NOT hooks.server.ts)
    hooks.server.ts        # Simplified: paraglideMiddleware + candidate auth only
    lib/
      paraglide/           # GENERATED by Paraglide compiler (gitignored)
        messages.js         # All message function exports
        runtime.js          # getLocale, setLocale, locales, etc.
        server.js           # paraglideMiddleware
        messages/           # Individual message function files (tree-shakable)
      i18n/
        index.ts            # Main exports: t wrapper, translate, translateObject, getLocale, setLocale
        overrides.ts        # Runtime override store and ICU parser for backend overrides
        wrapper.ts          # The t() wrapper: checks overrides -> falls back to Paraglide m["key"]()
        utils/
          matchLocale.ts    # Kept unchanged
          parseAcceptedLanguages.ts  # Kept unchanged
          canonize.ts       # Kept unchanged
          isLocale.ts       # Kept unchanged
        tests/
          translations.test.ts  # Updated for inlang format validation
          overrides.test.ts     # NEW: test override wrapper behavior
```

### Pattern 1: Paraglide Project Configuration
**What:** The `project.inlang/settings.json` configures locales, plugins, and message file locations
**When to use:** Project setup (one-time)
**Example:**
```json
{
  "baseLocale": "en",
  "locales": ["en", "fi", "sv", "da", "et", "fr", "lb"],
  "modules": [
    "https://cdn.jsdelivr.net/npm/@inlang/plugin-message-format@4/dist/index.js",
    "https://cdn.jsdelivr.net/npm/@inlang/plugin-m-function-matcher@2/dist/index.js"
  ],
  "plugin.inlang.messageFormat": {
    "pathPattern": [
      "./messages/{locale}/about.json",
      "./messages/{locale}/candidateApp.basicInfo.json",
      "./messages/{locale}/common.json",
      "./messages/{locale}/dynamic.json",
      "./messages/{locale}/results.json"
    ]
  }
}
```

**CRITICAL NOTE on pathPattern:** The wildcard pattern `./messages/{locale}/*.json` does NOT work. Each file must be listed explicitly in the pathPattern array. With 46 files, this array will be long but explicit. Alternatively, consolidate into fewer files per locale (e.g., one `messages/{locale}.json` per locale with nested structure).

**Decision point for planner:** Whether to keep 46 separate files (requires listing all in pathPattern array) or consolidate into fewer files. Recommendation: Keep the multi-file structure for human manageability but list all 46 files in pathPattern. The editTranslations tool can generate this list.

### Pattern 2: Vite Plugin Configuration
**What:** Paraglide's Vite plugin compiles messages on build/dev and generates the `src/lib/paraglide/` output
**When to use:** `vite.config.ts` setup
**Example:**
```typescript
// Source: Paraglide SvelteKit integration docs (verified)
import { sveltekit } from '@sveltejs/kit/vite';
import { paraglideVitePlugin } from '@inlang/paraglide-js/vite';
import tailwindcss from '@tailwindcss/vite';
import type { UserConfig } from 'vite';

const config: UserConfig = {
  plugins: [
    tailwindcss(),
    paraglideVitePlugin({
      project: './project.inlang',
      outdir: './src/lib/paraglide',
      strategy: ['url', 'cookie', 'baseLocale']
    }),
    sveltekit()
  ],
  resolve: {
    preserveSymlinks: true
  },
  server: {
    port: Number(process.env.FRONTEND_PORT)
  }
};

export default config;
```

### Pattern 3: SvelteKit Hooks Integration
**What:** Paraglide uses a `reroute` hook in `hooks.ts` (not `hooks.server.ts`) and `paraglideMiddleware` in `hooks.server.ts`
**When to use:** Routing setup

**hooks.ts** (NEW file):
```typescript
// Source: Paraglide SvelteKit docs (verified)
import type { Reroute } from '@sveltejs/kit';
import { deLocalizeUrl } from '$lib/paraglide/runtime';

export const reroute: Reroute = (request) => {
  return deLocalizeUrl(request.url).pathname;
};
```

**hooks.server.ts** (simplified):
```typescript
// Source: Paraglide SvelteKit docs + OpenVAA candidate auth logic
import { redirect } from '@sveltejs/kit';
import { API_ROOT } from '$lib/api/base/universalApiRoutes';
import { AUTH_TOKEN_KEY } from '$lib/auth';
import { paraglideMiddleware } from '$lib/paraglide/server';
import { getLocale } from '$lib/paraglide/runtime';
import { getTextDirection } from '$lib/paraglide/runtime';
import type { Handle, HandleServerError } from '@sveltejs/kit';

const NORMALIZED_API_ROOT = API_ROOT.replace(/^\/*/, '/');

const paraglideHandle: Handle = ({ event, resolve }) =>
  paraglideMiddleware(event.request, ({ request: localizedRequest, locale }) => {
    event.request = localizedRequest;
    return resolve(event, {
      transformPageChunk: ({ html }) => html.replace('%lang%', locale)
    });
  });

const candidateAuthHandle: Handle = async ({ event, resolve }) => {
  const { url, route, cookies } = event;
  const locale = getLocale();
  const pathname = url.pathname;

  // Skip non-route and API requests
  if (route?.id == null || pathname.startsWith(NORMALIZED_API_ROOT)) {
    return resolve(event);
  }

  // Handle candidate auth redirects
  if (pathname.includes('/candidate')) {
    const token = cookies.get(AUTH_TOKEN_KEY);
    if (token && pathname.endsWith('candidate/login')) {
      redirect(303, `/${locale}/candidate`);
    }
    if (!token && route.id.includes('(protected)')) {
      const cleanPath = pathname.replace(new RegExp(`^/${locale}`), '');
      redirect(303, `/${locale}/candidate/login?redirectTo=${cleanPath.substring(1)}`);
    }
  }

  return resolve(event);
};

export const handle: Handle = async ({ event, resolve }) => {
  // Paraglide handles locale detection and URL processing first
  return paraglideHandle({
    event,
    resolve: (event) => candidateAuthHandle({ event, resolve })
  });
};

export const handleError: HandleServerError = async ({ error }) => {
  console.error('Server error:', error);
  return { message: '500' };
};
```

**KEY CHANGE:** The `reroute` function MUST be in `src/hooks.ts`, NOT `src/hooks.server.ts`. This is a Paraglide requirement. The `[[lang=locale]]` route parameter pattern is REMOVED from all routes -- Paraglide's reroute hook handles locale prefix stripping transparently.

### Pattern 4: Runtime Override Wrapper Architecture
**What:** A thin wrapper that checks backend overrides before falling back to Paraglide compiled messages
**When to use:** All translation access points throughout the app

**overrides.ts** -- Override store:
```typescript
// Runtime override store for backend translationOverrides
import { IntlMessageFormat } from 'intl-messageformat';
import { getLocale } from '$lib/paraglide/runtime';

/** Map of locale -> flat key -> override string (ICU format) */
let overrideMap: Record<string, Record<string, string>> = {};

/**
 * Set overrides for a locale. Called from +layout.ts after loading appCustomization.
 */
export function setOverrides(locale: string, overrides: Record<string, unknown>): void {
  overrideMap[locale] = flattenObject(overrides);
}

/**
 * Get an override for a key, or undefined if no override exists.
 * Parses ICU format strings with intl-messageformat.
 */
export function getOverride(key: string, params?: Record<string, unknown>): string | undefined {
  const locale = getLocale();
  const overrides = overrideMap[locale];
  if (!overrides || !(key in overrides)) return undefined;

  const template = overrides[key];
  if (!params || Object.keys(params).length === 0) return template;

  try {
    return new IntlMessageFormat(template, locale).format(params) as string;
  } catch {
    return template;
  }
}

/** Flatten nested object to dot-notation keys */
function flattenObject(obj: Record<string, unknown>, prefix = ''): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'string') {
      result[fullKey] = value;
    } else if (typeof value === 'object' && value !== null) {
      Object.assign(result, flattenObject(value as Record<string, unknown>, fullKey));
    }
  }
  return result;
}
```

**wrapper.ts** -- The t() function:
```typescript
import * as messages from '$lib/paraglide/messages';
import { getLocale } from '$lib/paraglide/runtime';
import { getOverride } from './overrides';

type MessageKey = keyof typeof messages.m;

/**
 * Translation wrapper: checks runtime overrides first, then falls back to Paraglide.
 *
 * @param key - Dot-notation translation key (e.g., 'dynamic.appName')
 * @param params - Optional parameters for ICU interpolation
 * @returns Translated string
 */
export function t(key: string, params?: Record<string, unknown>): string {
  // 1. Check runtime overrides (from backend translationOverrides)
  const override = getOverride(key, params);
  if (override !== undefined) return override;

  // 2. Fall back to Paraglide compiled message
  const messageFn = messages.m[key as MessageKey];
  if (typeof messageFn === 'function') {
    try {
      return messageFn(params as any) as string;
    } catch {
      return key;
    }
  }

  // 3. Key not found -- return key as fallback
  return key;
}

/**
 * Non-reactive get() for use outside Svelte component context.
 * Same as t() since Paraglide functions are already non-reactive.
 */
t.get = t;
```

**Why this architecture works:**
- The override surface area is small (~30 keys in `dynamic.json`). Most call sites never hit the override path.
- `intl-messageformat` handles ICU syntax in override strings (plurals, dates, selects) -- the same library already used in the current codebase.
- Paraglide's type-safe `m["key"]()` provides the base translation. The wrapper adds a runtime layer on top.
- The `t()` function is NOT reactive (not a Svelte store). Paraglide messages are plain functions that call `getLocale()` each time. Reactivity comes from Svelte's rendering cycle, not from stores.

### Pattern 5: Translation Call Site Migration
**What:** Convert `$t('key', {payload})` to `t('key', {payload})` (nearly identical)
**When to use:** All 740 call sites across 147 files

**Migration steps:**
1. Replace import: `import { t } from '$lib/i18n'` stays the same (re-export from new wrapper)
2. Remove store subscription syntax: `$t(` becomes `t(` in Svelte templates (no longer a store)
3. In `.svelte` files: `{$t('key')}` becomes `{t('key')}` -- drop the `$` prefix

**Example:**
```svelte
<!-- BEFORE (sveltekit-i18n, store-based): -->
<h1>{$t('dynamic.appName')}</h1>
<p>{$t('results.candidate.numShown', { numShown: count })}</p>

<!-- AFTER (Paraglide wrapper, function-based): -->
<h1>{t('dynamic.appName')}</h1>
<p>{t('results.candidate.numShown', { numShown: count })}</p>
```

**IMPORTANT: Reactivity change.** Paraglide messages are NOT stores. They are plain functions that call `getLocale()` at invocation time. In Svelte 5, the template re-renders when state changes. Since locale changes trigger a page reload (acceptable per user decision), reactivity for locale switching is not needed within a single page lifecycle.

**Call site categories:**
- ~500 sites: `$t('key')` becomes `t('key')` -- simple `$` removal
- ~42 sites: `$t('key', {payload})` becomes `t('key', {payload})` -- simple `$` removal
- ~2 sites: `t.get('key')` becomes `t('key')` -- `t.get` is now just `t` (no store to unwrap)
- ~8 sites: `$t(assertTranslationKey(\`dynamic.${var}\`))` -- keep assertTranslationKey, drop `$`
- Context provider: `initI18nContext()` exports change from stores to functions

### Pattern 6: ICU to Inlang Variant Format Conversion
**What:** Convert ICU plural/select/date strings in translation JSON files to inlang's variant syntax
**When to use:** All translation files that contain ICU patterns

**Plural conversion:**
```json
// BEFORE (ICU in sveltekit-i18n):
{
  "numShown": "{numShown, plural, =0 {No candidates} =1 {1 candidate} other {# candidates}}"
}

// AFTER (inlang variant format):
{
  "numShown": [{
    "declarations": ["input numShown", "local numPlural = numShown: plural"],
    "selectors": ["numPlural"],
    "match": {
      "numPlural=zero": "No candidates",
      "numPlural=one": "{numShown} candidate",
      "numPlural=other": "{numShown} candidates"
    }
  }]
}
```

**NOTE:** ICU `=0` maps to `zero`, `=1` maps to `one`. The `#` symbol (ICU count placeholder) becomes `{numShown}` (explicit variable reference).

**Date conversion:**
```json
// BEFORE (ICU):
{
  "dateInfo": "The election date is {electionDate, date, ::yyyyMMdd}."
}

// AFTER (inlang variant with datetime formatter):
{
  "dateInfo": [{
    "declarations": [
      "input electionDate",
      "local formattedDate = electionDate: datetime year=numeric month=2-digit day=2-digit"
    ],
    "match": {
      "electionDate=*": "The election date is {formattedDate}."
    }
  }]
}
```

**Select conversion:**
```json
// BEFORE (ICU):
// Not currently used in OpenVAA translations -- no selects found

// AFTER (inlang variant):
// {
//   "greeting": [{
//     "declarations": ["input gender"],
//     "selectors": ["gender"],
//     "match": {
//       "gender=male": "He will respond shortly.",
//       "gender=female": "She will respond shortly.",
//       "gender=*": "They will respond shortly."
//     }
//   }]
// }
```

**ICU patterns found in current translations (verified by grep):**
- **Plurals:** ~20 messages across results, questions, entityList, feedback, candidateApp files
- **Dates:** 3 messages (dynamic.json `dateInfo`, privacy.json `consentDate` x2)
- **Selects:** 0 messages (none currently used)
- **Simple variables:** ~40 messages (simple `{variable}` interpolation -- no format change needed)

### Pattern 7: Route Structure Change
**What:** Remove `[[lang=locale]]` optional parameter from all routes; Paraglide handles locale prefix via reroute hook
**When to use:** During routing migration

**BEFORE:** Routes at `src/routes/[[lang=locale]]/...`
**AFTER:** Routes at `src/routes/...` (no locale parameter)

The `reroute` hook in `hooks.ts` transparently strips the locale prefix from URLs. A request to `/fi/about` is rerouted to `/about` internally. The `params.lang` parameter no longer exists -- use `getLocale()` instead.

**Impact on +layout.ts:**
```typescript
// BEFORE:
export async function load({ fetch, params: { lang } }) {
  if (!lang) throw new Error('No language provided');
  // ...
}

// AFTER:
import { getLocale } from '$lib/paraglide/runtime';

export async function load({ fetch }) {
  const lang = getLocale();
  // ...
}
```

### Anti-Patterns to Avoid
- **Do NOT use ICU syntax in inlang message format files** -- The default message format plugin does NOT parse ICU inline syntax like `{count, plural, one {# item} other {# items}}`. This was verified by compilation test: the ICU string is treated as a raw template with broken variable names. Use the variant array syntax instead.
- **Do NOT use wildcard `*.json` in pathPattern** -- Verified by test: `./messages/{locale}/*.json` compiles to zero messages. Each file must be listed explicitly in the pathPattern array.
- **Do NOT put `reroute` in hooks.server.ts** -- Paraglide requires it in `hooks.ts` (shared hooks file, not server-only).
- **Do NOT rely on `params.lang` after migration** -- Route parameters no longer contain the locale. Use `getLocale()` from Paraglide's runtime instead.
- **Do NOT call Paraglide message functions outside request context on the server** -- `getLocale()` requires AsyncLocalStorage context set by `paraglideMiddleware`. Outside a request, it throws.
- **Do NOT use `addMessages()` or `addTranslations()`** -- These are sveltekit-i18n/svelte-i18n APIs. Paraglide has no equivalent. Use the override wrapper instead.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Compile-time message functions | Custom message compiler | Paraglide compiler via Vite plugin | Handles tree-shaking, type generation, locale switching per message |
| Locale detection from URL/cookie/header | Custom detection logic | Paraglide's strategy system | Configurable priority chain, SSR-safe via AsyncLocalStorage |
| URL locale prefix handling | Custom reroute/redirect logic | `deLocalizeUrl()` / `localizeHref()` from Paraglide runtime | Handles all URL patterns, baseLocale has no prefix |
| Plural/ordinal resolution | Custom Intl.PluralRules wrapper | Paraglide's `registry.plural()` (auto-generated) | Compiled into each message function, locale-aware |
| Date/number formatting in messages | Custom formatters | Paraglide's `registry.datetime()` / `registry.number()` | Uses Intl.DateTimeFormat/NumberFormat, locale-aware |
| ICU parsing for runtime overrides | Custom parser | `intl-messageformat` (already installed) | Handles all ICU syntax, battle-tested (FormatJS) |

**Key insight:** Paraglide handles everything at compile time except runtime overrides. The only runtime i18n code needed is the thin override wrapper with `intl-messageformat` for parsing backend ICU strings.

## Common Pitfalls

### Pitfall 1: ICU Syntax in Inlang Message Files
**What goes wrong:** Messages using ICU inline syntax (`{count, plural, one {# item} other {# items}}`) compile to broken output. The compiler treats the entire ICU expression as a variable name, producing garbage like `${i?.["count, plural, one {# item"]}`.
**Why it happens:** The default inlang message format plugin does not parse ICU syntax. It uses its own variant syntax with declarations, selectors, and match objects.
**How to avoid:** Convert ALL ICU patterns to inlang variant syntax. Test compilation output for every converted message.
**Warning signs:** Variable names containing commas, spaces, or curly braces in compiled output.

### Pitfall 2: Route Parameter Removal Breaks Layout Loaders
**What goes wrong:** After removing `[[lang=locale]]` from routes, `params.lang` is `undefined` in layout `load` functions, breaking translation loading and data fetching.
**Why it happens:** Paraglide's reroute hook strips locale from URLs before they reach SvelteKit routes, so the locale parameter no longer exists.
**How to avoid:** Replace all `params.lang` with `getLocale()` from Paraglide's runtime. Audit every `+layout.ts`, `+page.ts`, and `+page.server.ts` that references `params.lang`.
**Warning signs:** `TypeError: Cannot read properties of undefined` or `No language provided` errors in layout loaders.

### Pitfall 3: Override Store Not Set Before First Render
**What goes wrong:** Backend translation overrides are not visible on initial page load because `setOverrides()` is called after the page starts rendering.
**Why it happens:** The `+layout.ts` load function fetches overrides asynchronously. If the page renders before overrides arrive, compiled defaults show.
**How to avoid:** Ensure `setOverrides()` is called in `+layout.ts` load function BEFORE the layout component renders. Since `load` runs before rendering, the override store is populated before any `t()` calls execute during SSR.
**Warning signs:** Flash of default translation before override appears.

### Pitfall 4: DEFAULT_PAYLOAD_KEYS Removal Incomplete
**What goes wrong:** After removing `{candidateSingular}`, `{partyPlural}` etc. from the default payload, translations still referencing these variables render raw `{candidatePlural}` text.
**Why it happens:** Not all translation files updated to hardcode the terms.
**How to avoid:** Grep all translation JSON files across all 7 locales for each DEFAULT_PAYLOAD_KEY. Replace every occurrence with locale-specific hardcoded terms. The `editTranslations` tool can help with bulk replacement.
**Warning signs:** Curly-brace variable names visible in rendered UI text.

### Pitfall 5: Locale Merge from Luxemburg Branch Path Mismatch
**What goes wrong:** The `deploy-luxemburg-vaa-2025` branch may use old monorepo paths. Direct git merge may fail or put files in wrong locations.
**Why it happens:** Branch may predate monorepo restructure or use different path conventions.
**How to avoid:** Cherry-pick or manually copy the fr/ and lb/ translation directories. Verify that translation keys match the current en/ baseline. Run translation consistency tests.
**Warning signs:** Missing translation keys in new locales causing fallback to English.

### Pitfall 6: assertTranslationKey Dynamic Keys
**What goes wrong:** Dynamic key construction like `$t(assertTranslationKey(\`lang.${locale}\`))` fails because Paraglide's type system expects literal keys.
**Why it happens:** Paraglide generates typed exports for known keys. Dynamic keys constructed at runtime cannot be type-checked.
**How to avoid:** The wrapper function `t()` accepts `string`, not just typed keys. Dynamic keys bypass Paraglide's type safety but still work at runtime. The override wrapper handles lookup by string key.
**Warning signs:** TypeScript errors on dynamic key expressions.

### Pitfall 7: Server-Side getLocale() Outside Request Context
**What goes wrong:** Calling `getLocale()` in module-level code, top-level scripts, or outside SvelteKit request handlers throws "No locale found."
**Why it happens:** Paraglide's server-side locale resolution uses AsyncLocalStorage set by `paraglideMiddleware`. Outside a request, there is no async context.
**How to avoid:** Only call `getLocale()` (and therefore `t()`) inside SvelteKit load functions, hooks, form actions, or Svelte component scripts. For module-level constants, use `baseLocale` from runtime instead.
**Warning signs:** "No locale found" errors during SSR.

## Code Examples

### Inlang Message Format -- Complete Translation File
```json
// messages/en/results.json (converted from ICU to inlang variant format)
// Source: Verified by compilation test
{
  "results": {
    "alliance": {
      "numShown": [{
        "declarations": ["input numShown", "local numPlural = numShown: plural"],
        "selectors": ["numPlural"],
        "match": {
          "numPlural=zero": "No alliances",
          "numPlural=one": "{numShown} alliance",
          "numPlural=other": "{numShown} alliances"
        }
      }]
    },
    "candidate": {
      "numShown": [{
        "declarations": ["input numShown", "local numPlural = numShown: plural"],
        "selectors": ["numPlural"],
        "match": {
          "numPlural=zero": "No candidates",
          "numPlural=one": "{numShown} candidate",
          "numPlural=other": "{numShown} candidates"
        }
      }]
    },
    "ingress": {
      "answerMinQuestions": "If you want to find the candidates and parties that agree with you the most, {questionsLink} first.",
      "questionsLinkText": [{
        "declarations": ["input numQuestions", "local numPlural = numQuestions: plural"],
        "selectors": ["numPlural"],
        "match": {
          "numPlural=one": "answer at least one question",
          "numPlural=other": "answer at least {numQuestions} questions"
        }
      }]
    },
    "selectElectionFirst": "Select an election first",
    "title": {
      "browse": "Browse candidates and parties",
      "results": "Results"
    }
  }
}
```

### Date Formatting in Messages
```json
// messages/en/dynamic.json (date formatting)
{
  "dynamic": {
    "info": {
      "dateInfo": [{
        "declarations": [
          "input electionDate",
          "local formattedDate = electionDate: datetime year=numeric month=2-digit day=2-digit"
        ],
        "match": {
          "electionDate=*": "The election date is {formattedDate}."
        }
      }]
    }
  }
}
```

### +layout.ts with Override Loading
```typescript
// Source: OpenVAA adaptation for Paraglide
import { dataProvider as dataProviderPromise } from '$lib/api/dataProvider';
import { getLocale } from '$lib/paraglide/runtime';
import { setOverrides } from '$lib/i18n/overrides';

export async function load({ fetch }) {
  const lang = getLocale();
  const dataProvider = await dataProviderPromise;
  dataProvider.init({ fetch });

  // Load app customization for translation overrides
  const appCustomizationData = dataProvider.getAppCustomization({ locale: lang }).catch((e) => e);
  const appCustomizationSync = await appCustomizationData;

  // Apply backend translation overrides
  if (appCustomizationSync && !(appCustomizationSync instanceof Error)) {
    const overrides = appCustomizationSync.translationOverrides;
    if (overrides) setOverrides(lang, overrides);
  }

  return {
    appCustomizationData,
    appSettingsData: dataProvider.getAppSettings().catch((e) => e),
    electionData: dataProvider.getElectionData({ locale: lang }).catch((e) => e),
    constituencyData: dataProvider.getConstituencyData({ locale: lang }).catch((e) => e)
  };
}
```

### i18nContext Update
```typescript
// Source: OpenVAA adaptation
import { error } from '@sveltejs/kit';
import { getContext, hasContext, setContext } from 'svelte';
import { t } from '$lib/i18n';
import { getLocale } from '$lib/paraglide/runtime';
import { translate } from '$lib/i18n';
import type { I18nContext } from './i18nContext.type';

const CONTEXT_KEY = Symbol();

export function getI18nContext() {
  if (!hasContext(CONTEXT_KEY)) error(500, 'GetI18nContext() called before initI18nContext()');
  return getContext<I18nContext>(CONTEXT_KEY);
}

export function initI18nContext(): I18nContext {
  if (hasContext(CONTEXT_KEY)) error(500, 'InitI18nContext() called for a second time');
  return setContext<I18nContext>(CONTEXT_KEY, {
    locale: { get: getLocale },  // Adapter: not a store anymore
    locales: { get: () => locales },  // From paraglide runtime
    t,
    translate
  });
}
```

## Discretionary Recommendations

### translate()/translateObject() -- Keep Separate
**Recommendation:** Keep as separate utilities, do not integrate into Paraglide.
**Rationale:** These functions pick the correct locale string from backend multi-locale objects `{en: "...", fi: "..."}`. This is fundamentally different from i18n library translation lookup. They only need `getLocale()` from Paraglide's runtime. Coupling them to Paraglide would add unnecessary dependency without benefit.

### ICU parse() Function -- Remove
**Recommendation:** Remove the exported `parse()` function from init.ts.
**Rationale:** The function is exported but never imported anywhere in the codebase (verified by grep). It wraps `IntlMessageFormat` for ad-hoc ICU parsing outside the translation system. Since no code uses it, removing it simplifies the module. `intl-messageformat` is still retained for the override wrapper.

### Codemod Strategy
**Recommendation:** Regex-based search-and-replace across all `.svelte` and `.ts` files:
1. `\$t\(` -> `t(` (drop store prefix in Svelte templates)
2. `t\.get\(` -> `t(` (2 sites in dataContext.ts)
3. Update imports: `import { t } from '$lib/i18n'` -- keep as is (re-export from wrapper)
4. Remove `locale` store subscriptions -- replace with `getLocale()` calls
5. Remove `locales` store subscriptions -- replace with `locales` const from runtime

### Message File Organization
**Recommendation:** Keep the multi-file structure (46 files per locale) but reorganize from `src/lib/i18n/translations/{locale}/` to `messages/{locale}/`.
**Rationale:** The file structure provides clear organization. The pathPattern array in settings.json must list all 46 files explicitly (no wildcard support), but this is a one-time config and the editTranslations tool can generate it.

**Alternative considered:** Single file per locale (`messages/{locale}.json`). Simpler config but a ~3000-line JSON file per locale is harder to manage, review, and merge. Multi-file is worth the pathPattern verbosity.

### DEFAULT_PAYLOAD_KEYS Removal Strategy
**Recommendation:** Use the `editTranslations` tool to bulk-replace across all 7 locales:
- `{candidateSingular}` -> locale-specific term (en: "candidate", fi: "ehdokas", etc.)
- `{candidatePlural}` -> locale-specific term (en: "candidates", fi: "ehdokkaat", etc.)
- `{partySingular}` -> locale-specific term (en: "party", fi: "puolue", etc.)
- `{partyPlural}` -> locale-specific term (en: "parties", fi: "puolueet", etc.)
- `{adminEmailLink}` -> hardcoded HTML link using `staticSettings.admin.email` value
- `{analyticsLink}` -> hardcoded per deployment or kept as explicit payload at call site

**Count (verified):** 71 occurrences across 35 translation files across 5 locales (will be 7 after fr/lb merge).

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| sveltekit-i18n with custom ICU parser | Paraglide JS compiler + override wrapper | Migration (this phase) | Type-safe, tree-shakable, smaller bundle |
| ICU inline syntax in JSON | Inlang variant syntax (declarations/selectors/match) | Migration (this phase) | More verbose but compiler-verified |
| Store-based `$t()` reactivity | Function-based `t()` calls | Migration (this phase) | Simpler model; page reload on locale change |
| `[[lang=locale]]` route parameter | Paraglide reroute hook + `getLocale()` | Migration (this phase) | Cleaner routes, no param matcher needed |
| DEFAULT_PAYLOAD_KEYS auto-injection | Hardcoded terms per locale | Migration (this phase) | Better polymorphic language support |
| `addTranslations()` for runtime overrides | Override wrapper with `intl-messageformat` | Migration (this phase) | Explicit, predictable override behavior |
| `setRoute('')` in layout load | Removed -- Paraglide has no route concept | Migration (this phase) | Cleaner layout load function |

**Deprecated/outdated:**
- sveltekit-i18n: Unmaintained since July 2023, seeking new maintainer
- `@sveltekit-i18n/parser-icu`: Specific to sveltekit-i18n, no longer needed
- `params/locale.ts` matcher: Replaced by Paraglide's reroute hook

## Open Questions

1. **pathPattern wildcard workaround**
   - What we know: `*.json` wildcard does not work in pathPattern. Explicit file listing required.
   - What's unclear: Whether a glob pattern or alternative plugin config exists
   - Recommendation: List all 46 files explicitly. Generate the list programmatically from the existing file structure.

2. **Paraglide Vite plugin ordering**
   - What we know: The migration guide shows `paraglideVitePlugin()` before `sveltekit()`. OpenVAA also has `tailwindcss()` first.
   - What's unclear: Whether Paraglide must come before or after tailwindcss in the plugin chain
   - Recommendation: Order as `tailwindcss()`, `paraglideVitePlugin()`, `sveltekit()`. Test at build time.

3. **Language switcher with page reload**
   - What we know: `setLocale('fi')` reloads by default. Links need `data-sveltekit-reload` or `localizeHref()`.
   - What's unclear: Whether the existing LanguageSelection component pattern works with `localizeHref()`
   - Recommendation: Implement during the routing/hooks task. Use `localizeHref(currentPath, { locale })` in language switcher links.

4. **Locale merge from luxemburg branch completeness**
   - What we know: Branch has fr/ and lb/ translations. Paths may differ from current repo.
   - What's unclear: Whether translation keys match current en/ baseline, whether ICU patterns are up to date
   - Recommendation: Manual copy, then run translation consistency tests to identify gaps. Fill missing keys before ICU conversion.

5. **Date formatting compatibility**
   - What we know: Paraglide uses `Intl.DateTimeFormat` via `registry.datetime()`. ICU date skeletons like `::yyyyMMdd` must be converted to explicit Intl options.
   - What's unclear: Whether `year=numeric month=2-digit day=2-digit` produces the same output as ICU `::yyyyMMdd` in all locales
   - Recommendation: Test date output for all 7 locales during implementation. The 3 date messages are in `dynamic.json` and `privacy.json`.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (via vitest.config.ts in apps/frontend) |
| Config file | `apps/frontend/vitest.config.ts` |
| Quick run command | `yarn workspace @openvaa/frontend test:unit` |
| Full suite command | `yarn test:unit` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| I18N-01 | Evaluation documented | manual-only | N/A (documentation deliverable) | N/A |
| I18N-02 | All call sites work with new library | unit + build | `yarn workspace @openvaa/frontend test:unit && yarn build --filter=@openvaa/frontend` | Partial -- translations.test.ts exists |
| I18N-03 | hooks.server.ts uses paraglideMiddleware | unit + manual | Manual review of hooks.server.ts and hooks.ts | No dedicated test |
| I18N-04 | Plurals/dates work in inlang format | unit | `yarn workspace @openvaa/frontend test:unit` | No -- Wave 0 gap |
| I18N-05 | Language switch works | e2e/manual | `yarn test:e2e` (existing voter-settings spec) | Partial |
| I18N-06 | Auto language detection | unit | `yarn workspace @openvaa/frontend test:unit` | Partial -- utils.test.ts |
| I18N-07 | API routes handle locale | e2e/manual | `yarn test:e2e` | Partial |

### Sampling Rate
- **Per task commit:** `yarn workspace @openvaa/frontend test:unit`
- **Per wave merge:** `yarn test:unit && yarn build --filter=@openvaa/frontend`
- **Phase gate:** Full unit suite + successful build before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `apps/frontend/src/lib/i18n/tests/translations.test.ts` -- update for new message file location (`messages/` instead of `translations/`) and inlang variant format validation
- [ ] Add override wrapper test: verify `setOverrides()` + `t()` returns override, falls back to Paraglide when no override
- [ ] Add ICU format test for override strings: verify plural, date patterns parse correctly via `intl-messageformat`
- [ ] Verify Paraglide compilation produces correct output: test that `yarn build` succeeds with all converted message files
- [ ] Add translation consistency test for fr/lb locales after merge (key parity with en/)

## Sources

### Primary (HIGH confidence)
- Paraglide JS v2.15.0 -- hands-on compilation tests performed locally, generated output inspected
- Paraglide JS official docs (https://inlang.com/m/gerre34r/library-inlang-paraglideJs) -- basics, variants, formatting, architecture, runtime, strategy, SvelteKit integration, file formats, message keys
- Svelte CLI Paraglide docs (https://svelte.dev/docs/cli/paraglide) -- SvelteKit addon setup
- Inlang message format plugin docs (https://inlang.com/m/reootnfj/plugin-inlang-messageFormat) -- pathPattern, variant syntax, nested keys
- Direct codebase analysis -- 740 `$t()` call sites across 147 files, 585 translation keys, 46 JSON files per locale, 71 DEFAULT_PAYLOAD_KEY usages

### Secondary (MEDIUM confidence)
- Paraglide 2.0 SvelteKit migration guide (https://dropanote.de/en/blog/20250506-paraglide-migration-2-0-sveltekit/) -- breaking changes, hooks setup, vite config
- Paraglide setup guide (https://dropanote.de/en/blog/20250625-paraglide-js-setup-guide/) -- practical setup examples
- intl-messageformat docs (https://formatjs.github.io/docs/intl-messageformat/) -- ICU parsing API for override wrapper

### Tertiary (LOW confidence)
- Paraglide `experimentalStaticLocale` -- observed in compiled output but not documented; appears always `undefined`
- pathPattern wildcard behavior -- only tested with 2 files; larger file counts untested

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- Paraglide v2.15.0 verified by local compilation tests; version confirmed via npx
- Architecture: HIGH -- Override wrapper pattern validated against compiled output structure; routing verified via docs
- Translation format: HIGH -- ICU to inlang conversion verified by compilation tests; plural, date, nested key patterns confirmed
- Pitfalls: HIGH -- ICU syntax failure verified firsthand; pathPattern wildcard failure verified firsthand
- Migration scope: HIGH -- 740 call sites counted, 585 keys counted, 46 files per locale confirmed

**Research date:** 2026-03-16
**Valid until:** 2026-04-16 (Paraglide is actively maintained, release cadence ~weekly)
