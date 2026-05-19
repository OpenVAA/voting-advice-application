# Phase 21: Migration Cleanup - Research

**Researched:** 2026-03-18
**Domain:** TypeScript error resolution, dead code removal (SvelteKit/Paraglide migration artifacts)
**Confidence:** HIGH

## Summary

Phase 21 addresses two discrete requirements: removing dead code from the i18n migration (CLEAN-01) and fixing migration-introduced TypeScript errors in non-Strapi workspaces (CLEAN-02). Research confirms both are well-scoped, low-risk tasks.

CLEAN-01 targets a single block of dead code in `dataContext.ts` (lines 53-69) where `paramStore('lang')` references a route parameter `'lang'` that was removed during the Phase 17 Paraglide migration. The `Param` type no longer includes `'lang'`, so this code both causes TypeScript errors and silently produces `locale: undefined` on mount. Removal is safe because language switching now uses full page reloads via `data-sveltekit-reload`, which repopulates the DataRoot entirely.

CLEAN-02 targets migration-introduced TypeScript errors detectable by `svelte-check`. Current state: 84 total errors across the frontend, of which 9 are clearly migration-introduced (from Phases 17 and 19). The remaining 75 are pre-existing (implicit `any` parameters, store typing issues from the original codebase). The requirement scopes to migration-introduced errors only, meaning exactly 9 errors across 7 files need fixing.

**Primary recommendation:** Handle as a single plan with two tasks -- dead code removal first, then TypeScript error fixes, verified by `yarn build` and `svelte-check` error count.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CLEAN-01 | Dead code from i18n migration removed (paramStore('lang') block in dataContext.ts) | Lines 53-69 of dataContext.ts identified. paramStore('lang') references removed `Param` type. Safe to remove entire subscribe block, unsubscribers array, and dead import. See Architecture Patterns section. |
| CLEAN-02 | Migration-introduced TypeScript errors in non-Strapi workspaces resolved | 9 migration-introduced errors across 7 files identified and categorized. All non-Strapi package workspaces already pass `tsc --noEmit`. Only frontend `svelte-check` errors remain. See Error Inventory section. |
</phase_requirements>

## Standard Stack

No new libraries needed. This phase only modifies existing code.

### Core (already in project)
| Library | Version | Purpose | Relevance |
|---------|---------|---------|-----------|
| svelte | 5.x (catalog) | UI framework | Source of `Stores`/`StoresValues` unexported type issue |
| @inlang/paraglide-js | (project dep) | i18n runtime | Generated `localizeHref` and `locales` types |
| svelte-check | 4.4.5 | TypeScript checking for Svelte files | Verification tool for CLEAN-02 |

### Verification Commands
```bash
yarn build                    # Must pass (CLEAN-01 + CLEAN-02 success criterion)
cd apps/frontend && npx svelte-check  # Migration errors must be resolved
```

## Architecture Patterns

### CLEAN-01: Dead Code Removal in dataContext.ts

**Current state (lines 45-69):**
```typescript
// TODO[Svelte 5][i18n]: remove when possible
const unsubscribers = new Array<() => unknown>();

// Re-notify subscribers when the DataRoot's contents change
unsubscribers.push(dataRoot.subscribe(() => forceSetDataRoot(get(store))));

// Recreate `dataRoot` when the locale changes, because all data need to be provided again
paramStore('lang').subscribe((value) => {  // <-- 'lang' is not a valid Param
  if (dataRoot.locale === value) return;
  // ... creates new DataRoot with locale from removed route param
});
```

**Why it's dead:** Phase 17 migrated i18n from sveltekit-i18n (which used a `[[lang=locale]]` route parameter) to Paraglide (which uses URL-prefix-based localization). The `ROUTE_PARAMS` constant in `params.ts` no longer includes `'lang'` -- it only has `['categoryId', 'entityId', 'entityType', 'jobId', 'questionId']`. Therefore `paramStore('lang')` always returns `undefined`, making the entire subscribe block dead code.

**What to remove:**
1. The `paramStore('lang')` import on line 6
2. The `unsubscribers` array declaration (line 48)
3. The `unsubscribers.push(dataRoot.subscribe(...))` wrapping (line 51 -- keep the subscribe, just call it directly)
4. The entire `paramStore('lang').subscribe(...)` block (lines 53-69)
5. The `TODO[Svelte 5][i18n]` comment (line 47)

**After cleanup, the DataRoot subscription should be direct:**
```typescript
// Re-notify subscribers when the DataRoot's contents change
dataRoot.subscribe(() => forceSetDataRoot(get(store)));
```

**Safety rationale:** Language switching now triggers a full page reload via `data-sveltekit-reload` attribute on language links (visible in `LanguageSelection.svelte`). This causes the entire SvelteKit page lifecycle to restart, creating a fresh `DataRoot` with the correct locale from `getLocale()` in `initDataContext()`. No runtime locale-change handling is needed within a page lifecycle.

### CLEAN-02: Migration-Introduced TypeScript Error Inventory

**Total svelte-check errors:** 84
**Migration-introduced:** 9 errors across 7 files
**Pre-existing (out of scope):** 75 errors

#### Migration Error 1: `dataContext.ts` (2 errors) -- RESOLVED BY CLEAN-01
- Line 54: `Argument of type '"lang"' is not assignable to parameter of type 'Param'`
- Line 64: `Type 'string | string[] | undefined' is not assignable to type 'string | undefined'`
- **Fix:** These disappear when the dead code block is removed per CLEAN-01.

#### Migration Error 2: `parsimoniusDerived.ts` (2 errors)
- Line 3: `Module '"svelte/store"' declares 'Stores' locally, but it is not exported`
- Line 3: `Module '"svelte/store"' declares 'StoresValues' locally, but it is not exported`
- **Root cause:** Svelte 5 moved `Stores` and `StoresValues` to internal (non-exported) types. They appear in `svelte/types/index.d.ts` but without `export` keyword -- they are used only for the `derived()` function signature.
- **Fix:** Define equivalent local types inline. The types are simple:
```typescript
type Stores = Readable<any> | [Readable<any>, ...Array<Readable<any>>] | Array<Readable<any>>;
type StoresValues<T> = T extends Readable<infer U> ? U : { [K in keyof T]: T[K] extends Readable<infer U> ? U : never };
```

#### Migration Error 3: `wrapper.ts` (1 error)
- Line 22: Type cast `(m as MessageModule)` fails because Paraglide's generated messages module has nested namespace exports (e.g., `m.m.*`) that don't match the flat `Record<string, (params?) => string>` shape.
- **Fix:** Use double assertion via `unknown`: `(m as unknown as MessageModule)`. This is explicitly noted as acceptable in the audit ("functionally harmless at runtime") because the runtime access pattern `m[key]` only accesses top-level message functions, never the nested namespace.

#### Migration Error 4: `i18nContext.ts` (1 error)
- Line 28: `Type 'Readable<readonly ["en", "fi", ...]>' is not assignable to type 'Readable<string[]>'` -- the `readonly` tuple from Paraglide's `locales` constant can't be assigned to a mutable `string[]`.
- **Fix:** Change the `I18nContext` type definition to use `Readable<readonly string[]>` instead of `Readable<Array<string>>`, OR wrap the locales with a spread `readable([...locales])` to create a mutable copy.

#### Migration Error 5: `buildRoute.ts` (2 errors)
- Line 57: `resolveRoute` receives `[string, Partial<Record<string, string>>]` but expects specific route pattern unions.
- Line 61: `localizeHref` second arg `{ locale: string }` doesn't match the generated runtime's `{ locale?: "en" | "fi" | ... }` union type.
- **Fix for line 57:** Cast `routeId` to `string` before passing to `resolveRoute` (this is a SvelteKit-generated type that's overly strict for dynamic route building).
- **Fix for line 61:** The `locale` property in `RouteOptions` type should be typed as the Paraglide locale union type instead of plain `string`. However, since the `localizeHref` from `@inlang/paraglide-js` actually accepts `locale?: string | undefined` in its published types, this may be a discrepancy with the generated runtime types. The simplest fix is to cast `locale as any` in the call, or import and use the `Locale` type from Paraglide if available.

#### Migration Error 6: `LanguageSelection.svelte` (1 error)
- Line 36: `Type 'string' is not assignable to type '"en" | "fi" | "sv" | ...` -- iterating `$locales` (typed as `string[]` from `I18nContext`) and passing to `localizeHref({ locale: loc })`.
- **Fix:** This resolves naturally once `i18nContext.ts` types are fixed (Error 4). If `locales` is typed as `readonly string[]` from Paraglide, the iteration variable `loc` will be `string`, which matches `localizeHref`'s parameter. Alternatively, add `as Locale` cast.

### Pre-Existing Error Categories (OUT OF SCOPE)

For reference, the 75 pre-existing errors fall into these categories:
- **Implicit `any` parameters** (~30 errors): Missing type annotations in store callbacks (voterContext.ts, matchStore.ts, filterStore.ts, etc.)
- **`unknown` type access** (~15 errors): Properties accessed on `unknown` typed DataRoot store values
- **Component type mismatches** (~10 errors): Svelte 4 `PopupComponent` / `SvelteComponent` constructor types vs Svelte 5 isomorphic components
- **Event handler type mismatches** (~8 errors): `(() => void) | undefined` not assignable to `(e: PointerEvent) => void`
- **Miscellaneous** (~12 errors): `SubmitFunction` signature changes, autocomplete attribute types, `ClassValue` vs `string`, etc.

These are all deferred to v1.3 (Svelte 5 content migration).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Stores/StoresValues types | Attempting to re-export from Svelte internals | Copy the type definitions inline | They are stable, simple types that Svelte chose not to export |
| Locale type union | Creating a manual union of locale strings | Use Paraglide's generated type or `string` with assertion | Keeps types in sync with Paraglide config |

## Common Pitfalls

### Pitfall 1: Removing Too Much from dataContext.ts
**What goes wrong:** Accidentally removing the `dataRoot.subscribe(...)` call along with the dead code, breaking DataRoot reactivity.
**Why it happens:** The subscription on line 51 is wrapped in `unsubscribers.push()` which IS part of the dead code infrastructure, but the subscribe call itself is NOT dead.
**How to avoid:** Keep the `dataRoot.subscribe(() => forceSetDataRoot(get(store)))` call. Only remove the `unsubscribers` wrapping around it.
**Warning signs:** DataRoot changes not propagating to UI after the fix.

### Pitfall 2: Breaking paramStore Usage Elsewhere
**What goes wrong:** Assuming `paramStore` itself is dead code and removing the utility.
**Why it happens:** dataContext.ts is the only file using `paramStore('lang')`, but `paramStore` is actively used in `voterContext.ts` for `electionId` and `constituencyId`.
**How to avoid:** Only remove the import of `paramStore` from `dataContext.ts`, not the utility itself.

### Pitfall 3: Over-Fixing Pre-Existing Errors
**What goes wrong:** Scope creep into fixing all 84 errors when only 9 are in scope.
**Why it happens:** Once in the error-fixing mindset, it's tempting to fix "just a few more."
**How to avoid:** Define the exact file list before starting. Count errors before and after. The target is reducing migration-introduced errors to 0, not total errors to 0.

### Pitfall 4: parsimoniusDerived Type Change Breaking derived() Calls
**What goes wrong:** The locally-defined `Stores`/`StoresValues` types don't match Svelte's internal expectations, causing `derived()` to reject the input.
**Why it happens:** Subtle type differences between the local definition and Svelte's internal one.
**How to avoid:** Copy the exact type definitions from Svelte's `types/index.d.ts` (verified in this research). The types are:
```typescript
type Stores = Readable<any> | [Readable<any>, ...Array<Readable<any>>] | Array<Readable<any>>;
type StoresValues<T> = T extends Readable<infer U> ? U : { [K in keyof T]: T[K] extends Readable<infer U> ? U : never };
```

## Code Examples

### CLEAN-01: dataContext.ts After Cleanup

```typescript
// Source: Current codebase analysis
import { DataRoot } from '@openvaa/data';
import { error } from '@sveltejs/kit';
import { getContext, hasContext, setContext } from 'svelte';
import { get } from 'svelte/store';
import { getI18nContext } from '../i18n';
// NOTE: paramStore import REMOVED
import type { Readable, Subscriber, Unsubscriber, Writable } from 'svelte/store';
import type { DataContext } from './dataContext.type';

const CONTEXT_KEY = Symbol();

export function getDataContext(): DataContext {
  if (!hasContext(CONTEXT_KEY)) error(500, 'getDataContext() called before initDataContext()');
  return getContext<DataContext>(CONTEXT_KEY);
}

export function initDataContext(): DataContext {
  if (hasContext(CONTEXT_KEY)) error(500, 'initDataContext() called for a second time');
  const { locale, t } = getI18nContext();

  const dataRoot = new DataRoot({ locale: get(locale) });

  function setFormatters(root: DataRoot): void {
    root.setFormatter('booleanAnswer', ({ value }) => t(value ? 'common.answer.yes' : 'common.answer.no'));
    root.setFormatter('missingAnswer', () => t('common.missingAnswer'));
  }
  setFormatters(dataRoot);

  const store = alwaysNotifyStore<DataRoot>(dataRoot);

  function forceSetDataRoot(value: DataRoot): void {
    store.set(value);
  }

  // Re-notify subscribers when the DataRoot's contents change
  dataRoot.subscribe(() => forceSetDataRoot(get(store)));

  const dataRootStore: Readable<DataRoot> = { subscribe: store.subscribe };

  return setContext<DataContext>(CONTEXT_KEY, { dataRoot: dataRootStore });
}

// alwaysNotifyStore function remains unchanged
```

### CLEAN-02: parsimoniusDerived.ts Fix

```typescript
// Source: Svelte 5 types/index.d.ts (internal type definitions)
import { derived, get, writable } from 'svelte/store';
import { browser } from '$app/environment';
import type { Readable } from 'svelte/store';

// Svelte 5 does not export these types from 'svelte/store', so we define them locally.
// Definitions match Svelte's internal types exactly.
type Stores = Readable<any> | [Readable<any>, ...Array<Readable<any>>] | Array<Readable<any>>;
type StoresValues<T> = T extends Readable<infer U>
  ? U
  : { [K in keyof T]: T[K] extends Readable<infer U> ? U : never };

export function parsimoniusDerived<TInput extends Stores, TOutput>(
  // ... rest unchanged
```

### CLEAN-02: wrapper.ts Fix

```typescript
// Source: Current codebase + audit recommendation
const messageFn = (m as unknown as MessageModule)[key];
```

### CLEAN-02: i18nContext.ts Fix

```typescript
// Source: Current codebase analysis
// In i18nContext.type.ts, change:
locales: Readable<readonly string[]>;  // was Readable<Array<string>>
```

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest (unit), Playwright (e2e) |
| Config file | `apps/frontend/vite.config.ts` (vitest), `playwright.config.ts` (e2e) |
| Quick run command | `yarn build` |
| Full suite command | `yarn build && cd apps/frontend && npx svelte-check` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CLEAN-01 | paramStore('lang') dead code removed | build + manual code review | `yarn build` | N/A (build verification) |
| CLEAN-02 | Migration TS errors resolved | svelte-check | `cd apps/frontend && npx svelte-check 2>&1 \| grep -c ERROR` | N/A (tool verification) |

### Sampling Rate
- **Per task commit:** `yarn build`
- **Per wave merge:** `yarn build && cd apps/frontend && npx svelte-check`
- **Phase gate:** Build passes + migration-introduced error count drops from 9 to 0

### Wave 0 Gaps
None -- existing build infrastructure covers all phase requirements. No new test files needed.

## Open Questions

1. **Exact pre-existing error count baseline**
   - What we know: Current total is 84 errors. Migration-introduced count is 9.
   - What's unclear: Whether the audit's "117 errors" count has already been partially reduced (now 84), or if a different svelte-check version was used.
   - Recommendation: Record the error count before and after fixes. Target: 84 - 9 = 75 remaining errors (all pre-existing). If the count differs slightly, verify each remaining error is genuinely pre-existing.

2. **buildRoute.ts `resolveRoute` fix approach**
   - What we know: The `resolveRoute` function from SvelteKit expects a specific route pattern union but receives a generic `string`.
   - What's unclear: Whether this error existed before the migration (it depends on SvelteKit-generated types, which changed between versions).
   - Recommendation: Treat as migration-introduced since it appeared in the Phase 19 audit. Fix with `as string` cast on the route argument.

## Sources

### Primary (HIGH confidence)
- Direct codebase analysis of `dataContext.ts`, `parsimoniusDerived.ts`, `wrapper.ts`, `i18nContext.ts`, `buildRoute.ts`, `LanguageSelection.svelte`
- `svelte-check` output (84 errors, 13 warnings, 47 files with problems)
- Svelte 5 `types/index.d.ts` -- confirmed `Stores`/`StoresValues` are internal types
- `@inlang/paraglide-js` `localize-href.d.ts` -- confirmed `locale?: string | undefined` parameter type
- `params.ts` -- confirmed `ROUTE_PARAMS` does not include `'lang'`

### Secondary (MEDIUM confidence)
- `.planning/v1.2-MILESTONE-AUDIT.md` -- audit classification of migration-introduced vs pre-existing errors
- Phase 17/19 decision log in STATE.md

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - no new libraries, only existing code changes
- Architecture: HIGH - direct analysis of current codebase, exact line numbers identified
- Pitfalls: HIGH - based on actual code structure analysis, not speculation

**Research date:** 2026-03-18
**Valid until:** 2026-04-18 (stable -- no external dependencies changing)
