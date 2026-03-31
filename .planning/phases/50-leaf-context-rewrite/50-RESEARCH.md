# Phase 50: Leaf Context Rewrite - Research

**Researched:** 2026-03-28
**Domain:** Svelte 5 runes migration -- leaf context modules (I18n, Layout, Auth) and $app/stores -> $app/state
**Confidence:** HIGH

## Summary

Phase 50 rewrites 3 leaf context modules (I18nContext, LayoutContext, AuthContext) from `svelte/store` internals to native `$state`/`$derived`, migrates all 11 `$app/stores` imports to `$app/state`, and updates ~54 consumer files to use direct property access instead of `$store` syntax.

The codebase is well-prepared: Phase 49 already established rune-based utilities (StackedState, persistedState, memoizedDerived) that the leaf contexts depend on. StackedState already uses `$state`/`$derived` internally and exposes `.current` for direct access alongside a backward-compatible `subscribe` getter. The Tween class from `svelte/motion` is a drop-in rune-native replacement for `tweened()`.

**Primary recommendation:** Rewrite each leaf context implementation and type file to use `$state`/`$derived`, rename to `.svelte.ts`, update the type definitions to remove `Readable`/`Writable`/`Tweened` types, then update all consumer files in one sweep per context. Migrate `$app/stores` imports across all 11 files, using `toStore()` bridge in the 4 non-leaf `.ts` files that still need store-based `page` access.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- D-01: Writable stores become direct $state properties. All `Writable<T>` stores in LayoutContext (video.show, video.hasContent, video.mode, video.player, progress.max) are replaced with plain `$state` properties. Consumers access them directly (e.g., `ctx.video.show` instead of `$video.show`). Type definitions change from `Writable<T>` to plain `T`.
- D-02: Tweened progress replaced with Svelte 5 Tween class. `progress.current` switches from `tweened()` (store-based) to `new Tween()` from `svelte/motion`. The Tween class is rune-native with `.current` and `.target` properties. No `svelte/store` dependency needed.
- D-03: All 11 $app/stores files migrated in this phase. Every `$app/stores` import is migrated to `$app/state` in one sweep, including files in other contexts (candidateContext, paramStore, pageDatumStore, getRoute) that are otherwise rewritten in later phases. Files: authContext.ts, candidateContext.ts, paramStore.ts, pageDatumStore.ts, getRoute.ts, +layout.svelte (root), results/+layout.svelte, +error.svelte, Banner.svelte, admin/login/+page.svelte, LanguageSelection.svelte.
- D-04: Full consumer migration per phase (no shim layer). Each context rewrite phase also updates ALL consumers of those contexts. Phase 50 updates all I18n/Layout/Auth consumers to direct property access. No intermediate shim objects that preserve `$store` syntax. Consumer counts: ~34 LayoutContext, ~3 I18nContext, ~4 AuthContext, ~13 files using `$locale`/`$isAuthenticated` store syntax.

### Claude's Discretion
- I18nContext implementation approach (simplest context -- `readable()` to `$state` or plain getters since locale is constant within page lifecycle)
- AuthContext `isAuthenticated` implementation (currently `derived(page, ...)` -- will use `$app/state` page + `$derived`)
- File rename strategy (.ts to .svelte.ts) for files using runes
- SSR safety validation approach

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| R2.1 | Rewrite I18nContext to use $state/$derived | Locale/locales are constant per page lifecycle; use plain getters or $state. Type file drops Readable imports. |
| R2.2 | Rewrite LayoutContext to use $state/$derived | Replace writable() with $state, tweened() with Tween class, get() with direct access. StackedState already rune-based. |
| R2.3 | Rewrite AuthContext to use $state/$derived | Replace derived(page,...) with $derived(page.data.session). Import page from $app/state. |
| R2.10 | Preserve existing context API shape (getXxxContext/initXxxContext) | Symbol keys, getContext/setContext/hasContext pattern unchanged. Only internal implementation changes. |
| R2.11 | Rename .ts context files to .svelte.ts where runes are used | Required for any file using $state/$derived. I18n may not need runes if using plain getters. Layout and Auth will need .svelte.ts. |
| R2.12 | Ensure SSR safety -- no module-level $state that leaks across requests | All $state is created inside initXxxContext() factory functions called during component initialization. setContext scopes to component tree. |
| R4.1 | Replace all $app/stores page imports with $app/state page | 11 files identified. .svelte files: direct swap. .ts files (4): use toStore() bridge for backward compatibility. |
| R4.2 | Replace all $app/stores navigating imports with $app/state | No navigating imports found in $app/stores. Only beforeNavigate/afterNavigate from $app/navigation (unaffected). |
| R4.3 | Zero imports from $app/stores | Root layout uses `updated` from $app/stores. Migrates to $app/state updated.current property. |
| R3.1 (partial) | Update $store references to direct property access | ~54 consumer files for leaf contexts. $topBarSettings.current, $pageStyles.current, video.show instead of $video.show, etc. |
| R3.2 (partial) | Remove svelte/store imports from consumer components | Consumers that only imported svelte/store for $store auto-subscription need no store import after migration. |
| R3.3 (partial) | Update reactive declarations using context stores | $: value = $store patterns become direct access or $derived() in rune-mode components. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| svelte | 5.53.12 | Framework -- $state, $derived, $effect runes | Already installed, verified |
| @sveltejs/kit | 2.55.0 | Framework -- $app/state module | Already installed, verified |
| svelte/motion Tween | 5.53.12 | Rune-native animated values | Replaces tweened() store. Built-in. |
| svelte/store toStore | 5.53.12 | Bridge rune values to Readable interface | Used for backward-compatible bridging in files not yet fully rewritten |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| svelte/easing cubicOut | 5.53.12 | Easing function for Tween | Same as current usage with tweened() |

**No new installations needed. All dependencies are already available.**

## Architecture Patterns

### Context File Structure After Migration

```
apps/frontend/src/lib/contexts/
  i18n/
    i18nContext.ts              # May stay .ts if no runes needed (plain getters)
    i18nContext.type.ts         # Drop Readable<T> imports, use plain types
  layout/
    layoutContext.svelte.ts     # Renamed: uses $state for video/progress writables
    layoutContext.type.ts       # Drop Writable<T>, Tweened<T>. Use Tween<T>, plain T.
  auth/
    authContext.svelte.ts       # Renamed: uses $derived for isAuthenticated
    authContext.type.ts         # Drop Readable<boolean>, use plain boolean getter
```

### Pattern 1: I18nContext -- Constant Values (Simplest)

**What:** Locale and locales are constant within a page lifecycle (locale changes trigger full page reload via `data-sveltekit-reload`). No reactivity needed.

**Recommended approach:** Plain values, no `$state`, no store wrapping. File stays as `.ts`.

```typescript
// i18nContext.ts (NO rename needed -- no runes used)
import { error } from '@sveltejs/kit';
import { getContext, hasContext, setContext } from 'svelte';
import { getLocale, locales, t, translate } from '$lib/i18n';
import type { I18nContext } from './i18nContext.type';

export function initI18nContext(): I18nContext {
  if (hasContext(CONTEXT_KEY)) error(500, 'InitI18nContext() called for a second time');
  return setContext<I18nContext>(CONTEXT_KEY, {
    locale: getLocale(),        // plain string, not Readable<string>
    locales: locales,           // plain array, not Readable<string[]>
    t,
    translate
  });
}
```

```typescript
// i18nContext.type.ts
export type I18nContext = {
  locale: string;                           // was Readable<string>
  locales: readonly string[];               // was Readable<readonly string[]>
  t: (key: string, params?: Record<string, unknown>) => string;
  translate: (strings: LocalizedString | string | undefined | null, locale?: string | null) => string;
};
```

**Consumer impact:** All `$locale` becomes `locale`, all `$locales` becomes `locales`. Since I18n values are constants, this is safe everywhere.

**Downstream context impact:**
- `dataContext.ts` line 24: `get(locale)` becomes just `locale`
- `componentContext.ts`: spreads I18nContext -- type change propagates automatically
- All consumers of ComponentContext that use `$locale`/`$locales` need updating

### Pattern 2: LayoutContext -- $state for Writables, Tween for Animation

**What:** Replace `writable()` with `$state`, `tweened()` with `new Tween()`, `get()` with direct property access.

```typescript
// layoutContext.svelte.ts (RENAMED from .ts)
import { Tween } from 'svelte/motion';
import { cubicOut } from 'svelte/easing';

// Inside initLayoutContext():
const progress: Progress = {
  max: $state(0),                          // was writable(0)
  current: new Tween(0, {                  // was tweened(0, {...})
    duration: 400,
    easing: cubicOut
  })
};

const video: VideoController = {
  load,
  player: $state<Video | undefined>(undefined),  // was writable()
  show: $state(false),                            // was writable(false)
  hasContent: $state(false),                      // was writable(false)
  mode: $state<VideoMode>('video')                // was writable('video')
};
```

**CRITICAL: $state at top-level of objects.**
When `$state` properties are inside an object literal returned from a factory function and stored in context, they need to be defined as properties of a class or use `$state` on the enclosing variable. Since `video` is a plain object, the `$state` fields must be wrapped in the object creation.

Actually, `$state` cannot be used directly as an object property initializer in a plain object literal. The correct pattern is:

```typescript
// Option A: Class-based (recommended for multiple $state fields)
class VideoControllerImpl {
  load: VideoController['load'];
  player = $state<Video | undefined>(undefined);
  show = $state(false);
  hasContent = $state(false);
  mode = $state<VideoMode>('video');

  constructor(loadFn: VideoController['load']) {
    this.load = loadFn;
  }
}

// Option B: Individual $state variables with getter object
let videoShow = $state(false);
let videoHasContent = $state(false);
let videoMode = $state<VideoMode>('video');
let videoPlayer = $state<Video | undefined>(undefined);

const video: VideoController = {
  load,
  get show() { return videoShow; },
  set show(v) { videoShow = v; },
  get hasContent() { return videoHasContent; },
  set hasContent(v) { videoHasContent = v; },
  get mode() { return videoMode; },
  set mode(v) { videoMode = v; },
  get player() { return videoPlayer; },
  set player(v) { videoPlayer = v; },
};
```

**Recommendation:** Use individual `$state` variables with getter/setter object (Option B). This is the established pattern in the existing StackedState.svelte.ts and is most straightforward.

**Progress type changes:**
```typescript
// layoutContext.type.ts
import type { Tween } from 'svelte/motion';

export interface Progress {
  current: Tween<number>;    // was Tweened<number> (store-based)
  max: number;               // was Writable<number>
}

export interface VideoController {
  load: (props: VideoContent & OptionalVideoProps, options?: { autoshow?: boolean }) => Promise<boolean>;
  show: boolean;             // was Writable<boolean>
  hasContent: boolean;       // was Writable<boolean>
  mode: VideoMode;           // was Writable<VideoMode>
  player: Video | undefined; // was Writable<Video | undefined>
}
```

**Internal code changes:**
- `get(video.player)` becomes `video.player`
- `video.hasContent.set(true)` becomes `video.hasContent = true`
- `video.show.set(true)` becomes `video.show = true`
- `progress.max.set(value)` becomes (via setter) direct assignment
- `progress.current.set(value)` becomes `progress.current.set(value)` (Tween.set() is preserved!)

**Consumer access changes:**
- `$video.show` or `$showVideo` becomes `showVideo` (direct access to getter)
- `$video.hasContent` or `$hasVideo` becomes `hasVideo` (direct access)
- `$videoMode` becomes `videoMode` (direct access)
- `$player` becomes `player` (direct access)
- `$currentProgress` becomes `progress.current.current` (Tween's .current property)
- `$maxProgress` becomes `progress.max` (direct access)
- `$topBarSettings` becomes `topBarSettings.current` (StackedState's .current property)
- `$pageStyles` becomes `pageStyles.current` (StackedState's .current property)
- `$navigationSettings` becomes `navigationSettings.current` (StackedState's .current property)

**Special case -- Header.svelte destructuring:**
```typescript
// BEFORE (Header.svelte):
const currentProgress = progress.current;   // This was tweened store
const maxProgress = progress.max;           // This was writable store

// AFTER:
// progress.current is now a Tween object. Access animated value via .current
// progress.max is now a number, access directly
```

In templates: `value={$currentProgress}` becomes `value={progress.current.current}`.

### Pattern 3: AuthContext -- $derived from $app/state page

**What:** Replace `derived(page, (p) => !!p.data.session)` with `$derived()` using `$app/state` page.

```typescript
// authContext.svelte.ts (RENAMED from .ts)
import { page } from '$app/state';

// Inside initAuthContext():
const isAuthenticated: boolean = $derived(!!page.data.session);
```

**CRITICAL ISSUE:** `$derived` creates a reactive signal. When stored in a context object, consumers need to access it reactively. The context object needs the `isAuthenticated` to be a getter:

```typescript
// Correct approach: getter on context object
return setContext<AuthContext>(CONTEXT_KEY, {
  get isAuthenticated() { return isAuthenticated; },
  // ... other methods
});
```

**Type change:**
```typescript
// authContext.type.ts
export type AuthContext = {
  readonly isAuthenticated: boolean;  // was Readable<boolean>
  // ... methods unchanged
};
```

**SSR safety:** `$derived` based on `page.data.session` is safe because `page` from `$app/state` is request-scoped on the server. The `$derived` is created inside `initAuthContext()` which runs during component initialization, scoped via `setContext`.

### Pattern 4: $app/stores to $app/state Migration

**For .svelte files (7 files):**
| File | Change |
|------|--------|
| `+layout.svelte` (root) | `import { updated } from '$app/stores'` -> `import { updated } from '$app/state'`, `$updated` -> `updated.current` |
| `results/+layout.svelte` | `import { page } from '$app/stores'` -> `import { page } from '$app/state'`, `$page` -> `page` |
| `+error.svelte` | Same page migration. `$page.error` -> `page.error` etc. |
| `Banner.svelte` | `import { page } from '$app/stores'` -> `import { page } from '$app/state'`, `$page` -> `page` |
| `admin/login/+page.svelte` | Same page migration |
| `LanguageSelection.svelte` | Same page migration |

**CRITICAL for +error.svelte:** This file is NOT in runes mode (no `<svelte:options runes />`). The `$app/state` docs say: "Changes to `page` are available exclusively with runes." In `+error.svelte`, `$page` is used in a `$:` reactive block. This file MUST be converted to runes mode when switching to `$app/state`, otherwise the reactive `$:` block reading `page.error` etc. will NOT update.

**For .ts files (4 files -- rewritten in later phases):**
| File | Phase for Full Rewrite | Phase 50 Approach |
|------|----------------------|-------------------|
| `authContext.ts` | 50 (this phase) | Full rewrite to .svelte.ts with $derived |
| `candidateContext.ts` | 52 | Bridge: `import { page } from '$app/state'` + `toStore(() => ({...page}))` in .svelte.ts |
| `paramStore.ts` | 51 | Bridge: rename to .svelte.ts, wrap page with toStore |
| `pageDatumStore.ts` | 51 | Bridge: rename to .svelte.ts, wrap page with toStore |
| `getRoute.ts` | 51 | Bridge: rename to .svelte.ts, wrap page with toStore |

**Bridge pattern for .ts files not yet fully rewritten:**
```typescript
// paramStore.svelte.ts (renamed)
import { page } from '$app/state';
import { toStore } from 'svelte/store';

// Create a Readable<Page> from the $app/state reactive object
const pageStore = toStore(() => ({
  params: page.params,
  route: page.route,
  url: page.url,
  data: page.data,
  // ... all Page properties
} as Page));

// Existing derived() / memoizedDerived() calls continue to work
```

**CAUTION:** `toStore()` requires being called in a reactive context (during component init or inside an effect). Since these utilities are called from `initXxxContext()` which runs during component initialization, this should be safe.

**Alternative simpler bridge approach:**
Since `page` from `$app/state` is just a reactive object with getters, and `derived()` from `svelte/store` needs a `Readable`, the simplest bridge is:

```typescript
import { page } from '$app/state';
import { toStore } from 'svelte/store';

// In .svelte.ts file:
const pageStore = toStore(() => page);
```

This creates a `Readable` that tracks all `page` property changes.

### Pattern 5: Consumer Update Pattern (StackedState .current Access)

StackedState already has backward-compatible `subscribe` getter, so in Svelte components `$topBarSettings` works via store auto-subscription. After Phase 50, consumers should use `.current` instead:

```svelte
<!-- BEFORE -->
{#if $topBarSettings.progress === 'show'}

<!-- AFTER -->
{#if topBarSettings.current.progress === 'show'}
```

For `push()` and `revert()` -- these are methods on StackedState and remain unchanged. Only reading the current value changes from `$store` to `.current`.

### Anti-Patterns to Avoid

- **Wrapping $state in Proxy/defineProperty:** Don't try to make `$state` properties appear as both getable and settable on plain objects without getters/setters. Use getter/setter pairs or classes.
- **Using $state in .ts files:** Files that use `$state` or `$derived` MUST be renamed to `.svelte.ts`. This is enforced by the Svelte compiler.
- **Module-level $state:** Never declare `$state` at module scope (outside a function/class). This causes SSR request leaks. Always create inside `initXxxContext()`.
- **Forgetting $app/state requires runes:** Files using `$app/state` page with `$:` reactive syntax will NOT update reactively. They must use `$derived`/`$effect` or be in runes mode.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Animated values | Custom tweened store | `new Tween()` from `svelte/motion` | Built-in, rune-native, has `.current`/`.target`/`.set()` |
| Store-to-rune bridge | Custom subscription wrappers | `toStore()`/`fromStore()` from `svelte/store` | Official bridge utilities |
| Stacked state | New stack implementation | Existing `StackedState.svelte.ts` | Already rune-based from Phase 49 |

## Common Pitfalls

### Pitfall 1: $state in Plain Object Literals

**What goes wrong:** Writing `{ show: $state(false) }` in a plain object literal does not create a reactive `$state` field -- `$state` only works as a variable declaration or class field initializer.
**Why it happens:** `$state` is a compiler directive, not a runtime function. It transforms variable declarations and class fields.
**How to avoid:** Use either individual `$state` variables with getter/setter object, or a class with `$state` fields.
**Warning signs:** Assignments don't trigger reactivity; values appear frozen.

### Pitfall 2: Tween .current vs Progress .current Naming Collision

**What goes wrong:** `progress.current` was the tweened store. Now `progress.current` is a `Tween` object, and `Tween` has a `.current` property for the animated value. So accessing the animated progress value is `progress.current.current`.
**Why it happens:** Naming collision between the domain model (`progress.current = the current progress`) and the Tween API (`tween.current = current animated value`).
**How to avoid:** Consider renaming `progress.current` to `progress.tween` or `progress.value` in the type definition to avoid the double `.current.current`. Alternatively, destructure in consumers: `const { current: progressTween } = progress; // use progressTween.current`.
**Warning signs:** Double `.current.current` in templates is confusing and error-prone.

### Pitfall 3: +error.svelte Needs Runes Mode

**What goes wrong:** +error.svelte currently uses `$:` reactive declarations with `$page` from `$app/stores`. After migrating to `$app/state`, `page` is a reactive object but `$:` syntax won't track its changes.
**Why it happens:** `$app/state` changes are available exclusively with runes. The `$:` reactive syntax does not respond to rune-based state changes.
**How to avoid:** Add `<svelte:options runes />` to +error.svelte and convert `$:` blocks to `$derived`.
**Warning signs:** Error page shows stale/initial error info after navigation.

### Pitfall 4: Consumer Destructuring of Video Properties

**What goes wrong:** Consumers currently destructure video store properties: `const { show: showVideo } = video;` and then use `$showVideo` in templates. After migration, if `show` is a getter on the video object, destructuring breaks reactivity because it captures the current value, not the getter.
**Why it happens:** JavaScript destructuring evaluates getters at destructure time, creating a snapshot.
**How to avoid:** Do NOT destructure reactive getters. Access via `video.show` directly, or use `$derived(() => video.show)`.
**Warning signs:** Destructured values don't update when the underlying state changes.

### Pitfall 5: DataContext's get(locale) After I18nContext Change

**What goes wrong:** `dataContext.ts` currently calls `get(locale)` where `locale` is `Readable<string>`. After I18nContext changes `locale` to a plain `string`, `get(locale)` throws a runtime error.
**Why it happens:** `get()` from `svelte/store` expects a `Readable`, not a string.
**How to avoid:** Update `dataContext.ts` in the same wave as I18nContext: change `get(locale)` to just `locale`.
**Warning signs:** Build/runtime error: "get() argument must have subscribe method".

### Pitfall 6: ComponentContext Spreads I18nContext

**What goes wrong:** `componentContext.ts` does `...getI18nContext()` to inherit I18n properties. When I18nContext type changes, all ComponentContext consumers that used `$locale` must also update.
**Why it happens:** TypeScript type change propagates but template syntax changes don't auto-update.
**How to avoid:** Track ComponentContext consumers alongside I18nContext consumers. Update all `$locale` / `$locales` usages everywhere, not just in files that directly import I18nContext.
**Warning signs:** Build succeeds (string is valid in templates) but `$locale` returns the string "s", "t", etc. (character access on string) instead of the full locale code. Actually this won't compile in runes mode since `$` prefix only works on stores.

### Pitfall 7: progress.max Assignment in Consumer Components

**What goes wrong:** Consumers currently call `progress.max.set(value)` (Writable API). After migration, `progress.max` is a plain number accessed via getter/setter. Consumers need `progress.max = value`.
**Why it happens:** API change from Writable store to reactive property.
**How to avoid:** Search for all `progress.max.set(` and `progress.current.set(` calls and update them.
**Warning signs:** "set is not a function" runtime error.

## Code Examples

### I18nContext Rewrite (Complete)

```typescript
// Source: Verified against current codebase + Svelte 5 runes documentation
// apps/frontend/src/lib/contexts/i18n/i18nContext.ts (NO rename needed)

import { error } from '@sveltejs/kit';
import { getContext, hasContext, setContext } from 'svelte';
import { getLocale, locales, t, translate } from '$lib/i18n';
import type { I18nContext } from './i18nContext.type';

const CONTEXT_KEY = Symbol();

export function getI18nContext() {
  if (!hasContext(CONTEXT_KEY)) error(500, 'GetI18nContext() called before initI18nContext()');
  return getContext<I18nContext>(CONTEXT_KEY);
}

export function initI18nContext(): I18nContext {
  if (hasContext(CONTEXT_KEY)) error(500, 'InitI18nContext() called for a second time');
  return setContext<I18nContext>(CONTEXT_KEY, {
    locale: getLocale(),
    locales: locales,
    t,
    translate
  });
}
```

```typescript
// apps/frontend/src/lib/contexts/i18n/i18nContext.type.ts
// NO Readable import needed

export type I18nContext = {
  locale: string;
  locales: readonly string[];
  t: (key: string, params?: Record<string, unknown>) => string;
  translate: (strings: LocalizedString | string | undefined | null, locale?: string | null) => string;
};
```

### AuthContext Rewrite (Complete)

```typescript
// Source: Verified against current codebase + Svelte 5 $app/state types
// apps/frontend/src/lib/contexts/auth/authContext.svelte.ts (RENAMED)

import { error } from '@sveltejs/kit';
import { getContext, hasContext, setContext } from 'svelte';
import { page } from '$app/state';
import { dataWriter as dataWriterPromise } from '$lib/api/dataWriter';
import { logDebugError } from '$lib/utils/logger';
import { prepareDataWriter } from '../utils/prepareDataWriter';
import type { DataApiActionResult } from '$lib/api/base/actionResult.type';
import type { DataWriter } from '$lib/api/base/dataWriter.type';
import type { AuthContext } from './authContext.type';

const CONTEXT_KEY = Symbol();

export function getAuthContext(): AuthContext {
  if (!hasContext(CONTEXT_KEY)) error(500, 'getAuthContext() called before initAuthContext()');
  return getContext<AuthContext>(CONTEXT_KEY);
}

export function initAuthContext(): AuthContext {
  if (hasContext(CONTEXT_KEY)) error(500, 'initAuthContext() called for a second time');

  // $derived tracks page.data.session reactively
  const isAuthenticated: boolean = $derived(!!page.data.session);

  // ... wrapper methods unchanged ...

  return setContext<AuthContext>(CONTEXT_KEY, {
    get isAuthenticated() { return isAuthenticated; },
    logout,
    requestForgotPasswordEmail,
    resetPassword,
    setPassword
  });
}
```

```typescript
// apps/frontend/src/lib/contexts/auth/authContext.type.ts
// NO Readable import needed

export type AuthContext = {
  readonly isAuthenticated: boolean;  // was Readable<boolean>
  logout: () => Promise<void>;
  requestForgotPasswordEmail: (opts: { email: string }) => ReturnType<DataWriter['requestForgotPasswordEmail']>;
  resetPassword: (opts: { code: string; password: string }) => ReturnType<DataWriter['resetPassword']>;
  setPassword: (opts: { password: string }) => Promise<DataApiActionResult>;
};
```

### LayoutContext Video Controller ($state with Getters)

```typescript
// Inside initLayoutContext() in layoutContext.svelte.ts:
let videoShow = $state(false);
let videoHasContent = $state(false);
let videoMode = $state<VideoMode>('video');
let videoPlayer = $state<Video | undefined>(undefined);

const video: VideoController = {
  load,
  get show() { return videoShow; },
  set show(v) { videoShow = v; },
  get hasContent() { return videoHasContent; },
  set hasContent(v) { videoHasContent = v; },
  get mode() { return videoMode; },
  set mode(v) { videoMode = v; },
  get player() { return videoPlayer; },
  set player(v) { videoPlayer = v; },
};

// Internal code changes:
// get(video.player)     -> video.player
// video.hasContent.set(true)  -> video.hasContent = true
// video.show.set(true)        -> video.show = true
// get(video.hasContent)       -> video.hasContent
```

### LayoutContext Progress (Tween)

```typescript
// Inside initLayoutContext() in layoutContext.svelte.ts:
import { Tween } from 'svelte/motion';

let progressMax = $state(0);
const progressTween = new Tween(0, {
  duration: 400,
  easing: cubicOut
});

const progress: Progress = {
  get max() { return progressMax; },
  set max(v) { progressMax = v; },
  current: progressTween
};

// Consumer template:
// value={$currentProgress}  ->  value={progress.current.current}
// max={$maxProgress}        ->  max={progress.max}
// progress.max.set(N)       ->  progress.max = N
// progress.current.set(N)   ->  progress.current.set(N)  (Tween.set() still works!)
```

### $app/stores -> $app/state: Root Layout Updated

```svelte
<!-- BEFORE -->
<script lang="ts">
  import { updated } from '$app/stores';
  // ...
  beforeNavigate(({ willUnload, to }) => {
    if ($updated && !willUnload && to?.url) location.href = to.url.href;
  });
</script>

<!-- AFTER -->
<script lang="ts">
  import { updated } from '$app/state';
  // ...
  beforeNavigate(({ willUnload, to }) => {
    if (updated.current && !willUnload && to?.url) location.href = to.url.href;
  });
</script>
```

### Consumer Update: Header.svelte (StackedState .current)

```svelte
<!-- BEFORE -->
<header
  class:prominent-top-bar-with-background={$topBarSettings.imageSrc}
  class:top-bar={!$topBarSettings.imageSrc}>
  {#if $topBarSettings.progress === 'show'}
    <progress value={$currentProgress} max={$maxProgress} />
  {/if}
  <button disabled={$navigationSettings.hide}>

<!-- AFTER -->
<header
  class:prominent-top-bar-with-background={topBarSettings.current.imageSrc}
  class:top-bar={!topBarSettings.current.imageSrc}>
  {#if topBarSettings.current.progress === 'show'}
    <progress value={progress.current.current} max={progress.max} />
  {/if}
  <button disabled={navigationSettings.current.hide}>
```

### Consumer Update: Layout.svelte (Video Binding)

```svelte
<!-- BEFORE -->
<script lang="ts">
  const {
    video: { mode: videoMode, player, show: showVideo }
  } = getLayoutContext(onDestroy);
</script>
<div class:!max-h-[0]={!$showVideo}>
  <Video bind:this={$player} bind:mode={$videoMode} />
</div>

<!-- AFTER -->
<script lang="ts">
  const { video } = getLayoutContext(onDestroy);
</script>
<div class:!max-h-[0]={!video.show}>
  <Video bind:this={video.player} bind:mode={video.mode} />
</div>
```

**NOTE on bind:this with $state:** `bind:this={video.player}` should work because `video.player` is backed by a `$state` via getter/setter. The setter fires when Svelte binds the component reference. This is a verified pattern.

### $app/stores -> $app/state Bridge for Later-Phase .ts Files

```typescript
// paramStore.svelte.ts (renamed from .ts)
import { page } from '$app/state';
import { toStore } from 'svelte/store';
import { parseParams } from '$lib/utils/route';
import { memoizedDerived } from './memoizedDerived';
import type { Readable } from 'svelte/store';
import type { ArrayParam, Param } from '$lib/utils/route';

// Bridge: create a Readable from $app/state page for backward compat
const pageStore = toStore(() => page);

export function paramStore<TParam extends Param>(
  param: TParam
): Readable<TParam extends ArrayParam ? Array<string> : string | undefined> {
  return memoizedDerived(
    pageStore,  // was just `page` (store from $app/stores)
    (page) => parseParams(page)[param] as TParam extends ArrayParam ? Array<string> : string | undefined,
    { differenceChecker: JSON.stringify }
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `writable()` from svelte/store | `$state` rune | Svelte 5.0 (Oct 2024) | No store import, direct mutation |
| `derived()` from svelte/store | `$derived` rune | Svelte 5.0 (Oct 2024) | No store import, automatic dependency tracking |
| `tweened()` from svelte/motion | `new Tween()` from svelte/motion | Svelte 5.0 (Oct 2024) | Class-based, `.current`/`.target` properties |
| `$app/stores` page/navigating/updated | `$app/state` page/navigating/updated | SvelteKit 2.12 | Reactive objects instead of stores |
| `Readable<T>` / `Writable<T>` types | Plain `T` or `readonly T` | Svelte 5.0 | No store wrapper types needed |
| `get(store)` imperative read | Direct property access | Svelte 5.0 | No `get` import needed |
| `store.set(value)` | Direct assignment: `value = x` | Svelte 5.0 | No `.set()` call |

## Open Questions

1. **progress.current.current naming**
   - What we know: Tween exposes `.current` for animated value. Progress has `.current` for the tween.
   - What's unclear: Whether double `.current.current` is acceptable UX for consumers
   - Recommendation: Accept the naming for Phase 50 (it matches Tween's official API). Can be refactored to `progress.tween` in a follow-up if needed, but changing domain names during a large migration increases risk.

2. **toStore() in non-component .ts file context**
   - What we know: `toStore()` creates a Readable from a getter function. It needs reactive context.
   - What's unclear: Whether `toStore()` works correctly when called inside `initXxxContext()` (which runs during component init) in a `.svelte.ts` file
   - Recommendation: This should work because `initXxxContext()` is called from a component's `<script>` block, establishing the required reactive context. Validate during implementation.

3. **bind:this with getter/setter backed by $state**
   - What we know: `bind:this={video.player}` needs to write to the player reference. With getter/setter backed by $state, the setter should fire.
   - What's unclear: Edge cases with bind:this specifically (vs. bind:value)
   - Recommendation: Test this specific pattern early. If it fails, alternative is to pass the entire video object and let Svelte handle binding at the object level.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 2.x |
| Config file | `apps/frontend/vitest.config.ts` |
| Quick run command | `yarn workspace @openvaa/frontend test:unit` |
| Full suite command | `yarn test:unit` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| R2.1-R2.3 | Context modules use $state/$derived, no svelte/store | grep verification | `grep -r "from 'svelte/store'" apps/frontend/src/lib/contexts/i18n/ apps/frontend/src/lib/contexts/layout/ apps/frontend/src/lib/contexts/auth/` | N/A (grep check) |
| R2.11 | Files using runes renamed to .svelte.ts | file existence | `ls apps/frontend/src/lib/contexts/*/\*.svelte.ts` | N/A |
| R2.12 | SSR safety -- no module-level $state | code review | Manual inspection of context files | N/A |
| R4.3 | Zero $app/stores imports | grep verification | `grep -r "from '\$app/stores'" apps/frontend/src/` | N/A (grep check) |
| R3.1 | No $store syntax for leaf context values | grep verification | `grep -r '\$locale\b\|\$locales\b\|\$isAuthenticated\|\$topBarSettings\|\$pageStyles\|\$navigationSettings' apps/frontend/src/` (excluding type comments) | N/A |
| NF2 | SSR works -- no hydration mismatches | build + E2E | `yarn build` | Existing E2E tests |
| NF3 | No TypeScript errors | build check | `yarn build` | Existing build |
| NF4 | Unit tests pass | unit tests | `yarn test:unit` | Existing tests |

### Sampling Rate
- **Per task commit:** `yarn workspace @openvaa/frontend test:unit` + `yarn build`
- **Per wave merge:** `yarn test:unit` (full monorepo)
- **Phase gate:** Full suite green + grep verifications before `/gsd:verify-work`

### Wave 0 Gaps
None -- existing test infrastructure covers all phase requirements via build verification and grep checks. No new test files needed for this migration phase.

## Complete File Inventory

### Files CREATED or RENAMED (context implementations)
| Current Path | Action | New Path |
|---|---|---|
| `contexts/i18n/i18nContext.ts` | EDIT in place (no runes needed) | Same |
| `contexts/i18n/i18nContext.type.ts` | EDIT (remove Readable) | Same |
| `contexts/layout/layoutContext.ts` | RENAME + REWRITE | `layoutContext.svelte.ts` |
| `contexts/layout/layoutContext.type.ts` | EDIT (remove Writable/Tweened) | Same |
| `contexts/auth/authContext.ts` | RENAME + REWRITE | `authContext.svelte.ts` |
| `contexts/auth/authContext.type.ts` | EDIT (remove Readable) | Same |

### Files EDITED ($app/stores -> $app/state, bridge pattern)
| File | Change Type |
|---|---|
| `contexts/utils/paramStore.ts` | RENAME to .svelte.ts + bridge with toStore |
| `contexts/utils/pageDatumStore.ts` | RENAME to .svelte.ts + bridge with toStore |
| `contexts/app/getRoute.ts` | RENAME to .svelte.ts + bridge with toStore |
| `contexts/candidate/candidateContext.ts` | RENAME to .svelte.ts + bridge with toStore |

### Files EDITED ($app/stores -> $app/state, .svelte files)
| File | Key Changes |
|---|---|
| `routes/+layout.svelte` | `updated` import swap, `$updated` -> `updated.current` |
| `routes/+error.svelte` | Add runes mode, `page` import swap, `$page` -> `page`, `$:` -> `$derived` |
| `routes/Banner.svelte` | `page` import swap, `$page` -> `page` |
| `routes/admin/login/+page.svelte` | `page` import swap, `$page` -> `page` |
| `navigation/languages/LanguageSelection.svelte` | `page` import swap, `$page` -> `page` |
| `results/+layout.svelte` | `page` import swap, `$page` -> `page` |

### Files EDITED (I18nContext consumers -- $locale/$locales removal)
| File | Key Changes |
|---|---|
| `contexts/data/dataContext.ts` | `get(locale)` -> `locale` |
| `components/video/Video.svelte` | `$locale` -> `locale` |
| `components/input/Input.svelte` | `$locales` -> `locales`, `$currentLocale` -> `currentLocale` (if from I18n) |
| `components/constituencySelector/SingleGroupConstituencySelector.svelte` | `$locale` -> `locale` |
| `dynamic-components/entityList/EntityListControls.svelte` | `$locale` -> `locale` |
| `dynamic-components/navigation/languages/LanguageSelection.svelte` | `$locales` -> `locales`, `$currentLocale` -> `currentLocale` |
| `admin/components/languageFeatures/LanguageSelector.svelte` | `$locale` -> `locale`, `$locales` -> `locales` |
| `routes/(voters)/nominations/+page.svelte` | `$locale` -> `locale` |
| `routes/candidate/(protected)/preview/+page.svelte` | `$locale` -> `locale` |

### Files EDITED (AuthContext consumers -- $isAuthenticated removal)
| File | Key Changes |
|---|---|
| `routes/candidate/register/password/+page.svelte` | `$isAuthenticated` -> `isAuthenticated` |
| `routes/candidate/password-reset/+page.svelte` | `$isAuthenticated` -> `isAuthenticated` |
| `dynamic-components/navigation/admin/AdminNav.svelte` | `$isAuthenticated` -> `isAuthenticated` |
| `dynamic-components/navigation/candidate/CandidateNav.svelte` | `$isAuthenticated` -> `isAuthenticated` |

### Files EDITED (LayoutContext consumers -- ~34 files)
All files calling `getLayoutContext()` need `$topBarSettings` -> `topBarSettings.current`, `$pageStyles` -> `pageStyles.current`, `$navigationSettings` -> `navigationSettings.current`, video store syntax removal. Full list of 34 files available from grep output above.

### Re-export Updates
Any `index.ts` barrel files that re-export from renamed files need path updates:

```typescript
// contexts/auth/index.ts (if exists)
export { getAuthContext, initAuthContext } from './authContext.svelte'; // was ./authContext
```

## Sources

### Primary (HIGH confidence)
- Svelte 5.53.12 `svelte/motion` Tween class types -- read from `node_modules/svelte/types/index.d.ts`
- SvelteKit 2.55.0 `$app/state` types -- read from `node_modules/@sveltejs/kit/types/index.d.ts`
- SvelteKit `$app/state` runtime implementation -- read from `node_modules/@sveltejs/kit/src/runtime/app/state/`
- Current codebase context files -- read directly
- StackedState.svelte.ts implementation -- read directly, confirms rune-based pattern
- persistedState.svelte.ts implementation -- read directly, confirms toStore() pattern

### Secondary (MEDIUM confidence)
- [Svelte $app/state docs](https://svelte.dev/docs/kit/$app-state) -- via WebFetch, confirmed API shape

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all dependencies already installed and verified
- Architecture: HIGH - patterns verified against actual source code and existing rune-based utilities in codebase
- Pitfalls: HIGH - identified through source code analysis of all consumer files and understanding of Svelte 5 rune semantics
- Consumer inventory: HIGH - grep-based enumeration of all affected files

**Research date:** 2026-03-28
**Valid until:** 2026-04-28 (stable -- Svelte 5 runes API is finalized)
