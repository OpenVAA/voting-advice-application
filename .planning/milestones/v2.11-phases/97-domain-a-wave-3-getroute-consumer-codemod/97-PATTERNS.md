# Phase 97: Domain A Wave 3 — getRoute + Consumer Codemod - Pattern Map

**Mapped:** 2026-06-05
**Files analyzed:** 8 surfaces (1 producer rewrite, 2 context-export changes, 1 type-def, 2 manual consumer fixes, 1 codemod-tooling extension, 3 script-block manual-migration sites)
**Analogs found:** 8 / 8 (all precedents in-tree from Phases 95/96)

This is a mechanical refactor. Every target shape has a shipped in-tree precedent. The job below is to point each new/modified file at its exact analog with line-anchored excerpts so the planner writes deep, concrete tasks.

## File Classification

| Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---------------|------|-----------|----------------|---------------|
| `apps/frontend/src/lib/contexts/app/getRoute.svelte.ts` | producer | transform (rune-derived) | `dataContext.svelte.ts:92-107` `reactiveDataRoot` + `appContext.svelte.ts:278-287` `reactiveAppSettings` | exact (shape) |
| `apps/frontend/src/lib/contexts/app/appContext.type.ts:65` | type-def | — | the `reactiveAppSettings`/`reactiveDataRoot` type entries (`{ readonly current }`) | exact |
| `apps/frontend/src/lib/contexts/app/appContext.svelte.ts` (additive `.current` on `appSettings`/`locale`/`darkMode`) | producer | transform | `appContext.svelte.ts:278-287` (`reactiveAppSettings`/`reactiveLocale` `{ get current }`) | exact |
| `apps/frontend/src/lib/contexts/data/dataContext.svelte.ts` (additive `.current` on `dataRoot`) | producer | transform | `dataContext.svelte.ts:99-107` (`reactiveDataRoot.current`) | exact |
| `apps/frontend/src/lib/contexts/admin/adminContext.svelte.ts:97-99` | producer (context) | event-driven (auth state) | `authContext.svelte.ts:64-72` (explicit `get isAuthenticated()` delegation) | exact (root-cause fix) |
| `apps/frontend/src/lib/dynamic-components/navigation/admin/AdminNav.svelte:32` | consumer | request-response (nav render) | CLAUDE.md canonical (`results/+layout.svelte:61-79`); in-tree `questions/+layout.svelte:25-26` | exact (CLAUDE.md rule) |
| `apps/frontend/scripts/spike-009-store-codemod.mjs` | codemod-tooling | batch transform | its own Pass-1 (`spike-009...mjs:88-118`, `STORE_REWRITES:39-44`) | self (extend, don't replace) |
| `candidateContext.svelte.ts` + 2 admin `+page.svelte` (13 `getRouteState.current` sites) | consumer | request-response (goto/href) | `getRoute.current(...)` direct read (post-Step-2 producer) | role-match (manual) |

---

## Pattern Assignments

### 1. `getRoute.svelte.ts` — producer rewrite (CTX-08, producer / transform)

**Analog:** `dataContext.svelte.ts:99-107` (`reactiveDataRoot`) and `appContext.svelte.ts:278-287` (`reactiveAppSettings`) — both ship the `{ get current() {…} }` rune-handle shape this rewrite must adopt.

**Current shape to REMOVE** (`getRoute.svelte.ts:1-5, 35-43`):
```ts
import { writable } from 'svelte/store';          // ← remove
import { afterNavigate } from '$app/navigation';  // ← remove
import { page } from '$app/state';                // ← KEEP (already the rune signal)
import { buildRoute } from '$lib/utils/route';
import type { Readable } from 'svelte/store';      // ← remove

export function createGetRoute(): Readable<RouteBuilder> {
  function buildFn(): RouteBuilder {
    const { params, route, url } = page;
    return (options: RouteOptions) => buildRoute(options, { params, route, url });
  }
  const store = writable<RouteBuilder>(buildFn());   // D-04: remove
  afterNavigate(() => store.set(buildFn()));         // D-04: remove
  return store;
}
```

**Target shape** (spike-012 Approach C — RESEARCH §Pattern 1; mirrors `reactiveDataRoot`'s `get current`):
```ts
export function createGetRoute(): { readonly current: RouteBuilder } {
  const builder = $derived.by<RouteBuilder>(() => {
    const { params, route, url } = page;   // per-field reads = 3 fine-grained deps (NEVER read `page` whole)
    return (options: RouteOptions) => buildRoute(options, { params, route, url });
  });
  return {
    get current() {
      return builder;
    }
  };
}
```

**Critical:** Preserve a file-header comment explaining WHY `$derived.by` over per-field `page` reads avoids the `toStore` short-circuit (the existing header lines 18-33 already document the old trap — rewrite it to document the new shape, do not delete the rationale). Grep gates (RESEARCH §Test Map): `grep -c "svelte/store" …getRoute.svelte.ts` → 0; `grep -c afterNavigate …` → 0.

---

### 2. `appContext.type.ts:65` — type-def change

**Analog:** the `reactiveAppSettings: { readonly current: AppSettings }` type entry already declared in this same file (referenced at `appContext.type.ts:51-59` comments).

**Current** (`appContext.type.ts:65`):
```ts
getRoute: Readable<RouteBuilder>;
```
**Target:**
```ts
getRoute: { readonly current: RouteBuilder };
```
`RouteBuilder` import already present (`appContext.type.ts:6`). Wiring is unchanged: `appContext.svelte.ts:50` `const getRoute = createGetRoute();` and export at `appContext.svelte.ts:309`.

---

### 3. Additive `.current` on original store names (D-08 / Option A) — producer / transform

**Analog (the load-bearing precedent):** `appContext.svelte.ts:274-287`. Phase 96 already added `reactiveAppSettings`/`reactiveLocale` as `{ get current }` getters reading the SAME `$state` the `toStore`-wrapped originals wrap (single source of truth, additive). Option A reuses that exact getter body but exposes `.current` on the ORIGINAL exported names (`appSettings`/`locale`/`darkMode`/`dataRoot`) so the codemod target `appSettings.current.X` resolves.

**Precedent excerpt** (`appContext.svelte.ts:278-287`):
```ts
const reactiveAppSettings = {
  get current() {
    return appSettingsValue;   // same $state the `appSettings` toStore (line 85) wraps
  }
};
const reactiveLocale = {
  get current() {
    return componentCtx.locale;
  }
};
```

**`dataContext` precedent** (`dataContext.svelte.ts:99-107`) — the canonical `current`/`instance` split:
```ts
const reactiveDataRoot = {
  get current() {
    void version;        // reads $state version → reactive
    return dataRoot;
  },
  get instance() {
    return dataRoot;     // non-reactive escape hatch for producers
  }
};
```

**Pitfall-1 / Option A constraint (RESEARCH §Pitfall 1):** the original exported `appSettings`/`dataRoot`/`locale`/`darkMode` are `toStore(...)` (`appContext.svelte.ts:54-56,85`) / `createDataRootBridge` (`dataContext.svelte.ts:73`) — `Writable`/`Readable`, no `.current`. The store shape MUST survive for same-commit-rewritten consumers, so the `.current` getter is **additive** (a property must carry BOTH the store-callable shape AND a `.current` getter), and the property change must land **atomic with the codemod `--apply` commit** so the tree never compiles broken. Gating acceptance: `yarn build --filter=@openvaa/frontend` green with `appSettings.current` / `dataRoot.current` resolving (RESEARCH §Pitfall 1).

---

### 4. `adminContext.svelte.ts:97-99` — spread→explicit-getter fix (CONS-03, root cause)

**Analog:** `authContext.svelte.ts:64-72` — the source context that already exposes `isAuthenticated` as an explicit delegating getter over a `$derived`. The fix re-exposes the SAME getter shape on `adminContext` instead of value-capturing it via spread.

**Root cause** (`adminContext.svelte.ts:97-99`):
```ts
const adminContext: AdminContext = {
  ...appContext,    // line 98 — surface is already getter-shaped; verify, keep
  ...authContext,   // line 99 — ⚠ spread invokes `get isAuthenticated()` ONCE, captures the boolean
```

**Source `$derived` being captured** (`authContext.svelte.ts:25, 64-67`):
```ts
const isAuthenticated: boolean = $derived(!!page.data.session);   // line 25 (A1 CONFIRMED this session)
// …
return setContext<AuthContext>(CONTEXT_KEY, {
  get isAuthenticated() { return isAuthenticated; },   // live getter — the spread flattens this to a value
  logout, requestForgotPasswordEmail, resetPassword, setPassword
});
```

**Fix (explicit delegating getters — RESEARCH §Pattern 2):**
```ts
const adminContext: AdminContext = {
  ...appContext,                 // keep (getter-shaped surface, per 95/96 spread-then-getter precedent)
  // Replace `...authContext` with explicit delegation for EACH reactive accessor admin consumers read:
  get isAuthenticated() { return authContext.isAuthenticated; },
  logout: authContext.logout,    // stable fns: forward directly (or keep individually)
  requestForgotPasswordEmail: authContext.requestForgotPasswordEmail,
  resetPassword: authContext.resetPassword,
  setPassword: authContext.setPassword,
  get userData() { return _userData; },
  set userData(v) { _userData = v; },
  jobs, updateQuestion, getActiveJobs, getPastJobs, startJob,
  getJobProgress, abortJob, abortAllJobs, insertJobResult
};
```
**Planner note (O-2):** `authContext` exposes only ONE `$derived` accessor (`isAuthenticated`); the rest (`logout`/etc.) are stable fns safe to forward. Audit `...appContext` for any `$derived` accessor captured by value (RESEARCH O-2 — treat as review checklist, not blocker). Lands FIRST, separate commit (D-01/D-05), BEFORE codemod.

---

### 5. `AdminNav.svelte:32` — destructure-trap fix (CONS-03 symptom)

**Analog:** CLAUDE.md "Context Destructuring Rule" canonical (`results/+layout.svelte:61-79`); in-tree applied form at `candidate/(protected)/questions/+layout.svelte:25-26` (`const ctx = getCandidateContext(); const { getRoute, t } = ctx;`).

**Current trap** (`AdminNav.svelte:32`):
```svelte
const { isAuthenticated, t, getRoute } = getAdminContext();   // isAuthenticated is reactive → captured at init
```

**Fix** (CLAUDE.md canonical pattern):
```svelte
const ctx = getAdminContext();
const { t, getRoute } = ctx;                            // stable refs — destructure ok
const isAuthenticated = $derived(ctx.isAuthenticated);  // reactive accessor — read via ctx.X aliased through $derived
```
`{#if isAuthenticated}` (AdminNav line 38) then tracks the `$derived`. The 6 `$getRoute('…')` template calls (AdminNav lines 41-44,46,52) get rewritten to `getRoute.current('…')` by the codemod's CONS-02 pass (since `getRoute` becomes `{ current }` after Step 2). Lands FIRST, separate commit (D-01). Post-fix, the codemod Pass-2 audit must drop traps 2→1 (only the intentional `DestructureTrapConsumer.svelte` demo remains).

---

### 6. `spike-009-store-codemod.mjs` — codemod extension for `$getRoute(` (CONS-02, codemod-tooling)

**Analog:** the script's own Pass-1 structure. Mirror `STORE_REWRITES` + the Pass-1 regex.

**`STORE_REWRITES` array** (`spike-009-store-codemod.mjs:39-44`):
```js
const STORE_REWRITES = [
  { store: 'appSettings', handle: 'appSettings', accessor: 'current' },
  { store: 'dataRoot', handle: 'dataRoot', accessor: 'current' },
  { store: 'darkMode', handle: 'darkMode', accessor: 'current' },
  { store: 'locale', handle: 'locale', accessor: 'current' }
];
```

**Pass-1 rewrite regex to mirror** (`spike-009-store-codemod.mjs:100-117`):
```js
const pattern = new RegExp(`(?<![\\w$_])\\$${store}(?!\\w)`, 'g');
changed = changed.replace(pattern, (match, offset) => { /* …record hit… */ return `${handle}.${accessor}`; });
```
The store form uses `(?!\w)` (bare-or-property). `$getRoute` is ALWAYS a call, so it needs a distinct open-paren guard — add a dedicated pass (RESEARCH §Code Examples; Pitfall 3):
```js
// New pass — `$getRoute(` → `getRoute.current(`
const getRouteRe = /(?<![\w$_])\$getRoute(?=\()/g;   // matches `$getRoute(`, rejects `$getRouteFoo`, `_$getRoute`
changed = changed.replace(getRouteRe, 'getRoute.current');
// Idempotent: `getRoute.current(` has no leading `$` → never re-matches (verify: dry-run #2 = 0 changes)
```
**Do NOT** add `getRoute` to `STORE_REWRITES` (its `(?!\w)` guard would mis-handle the call form). Keep the summary/`byStore` counter wiring consistent. After Wave 3 lands: delete the script from the app tree, archive under `.planning/` (D-06).

---

### 7. The 13 script-block `getRouteState.current(...)` manual sites (CONS-02 manual tail)

**Analog:** direct `getRoute.current(...)` read against the rewritten producer (Step 2). The codemod's `.svelte`-template regex will NOT catch these — manual migration bundled with the producer rewrite commit (Pitfall 4).

**`candidateContext.svelte.ts`** — `fromStore(getRoute)` + 6 call sites:
```ts
import { fromStore } from 'svelte/store';                                 // line 5 — DELETE (last svelte/store import here → completes CTX-07 tail)
const { getRoute, reactiveAppSettings, reactiveLocale, reactiveDataRoot } = appContext;  // line 41
const getRouteState = fromStore(getRoute);                                // line 48 — DELETE
// call sites 255,267,273,306,315: getRouteState.current(…) → getRoute.current(…)
return goto(getRouteState.current('CandAppLogin'), { invalidateAll: true }).then(_reset);  // :255
```

**`routes/admin/(protected)/+page.svelte`** (lines 8,14,22,25,31,38):
```svelte
import { fromStore } from 'svelte/store';     // :8 — DELETE
const { t, getRoute } = getAppContext();      // :13 — getRoute stays destructured (stable ref)
const getRouteState = fromStore(getRoute);    // :14 — DELETE
// :22,25,31,38  getRouteState.current('…') → getRoute.current('…')
```

**`routes/admin/login/+page.svelte`** (lines 17,36-39,139):
```svelte
import { fromStore } from 'svelte/store';                         // :17 — DELETE
const { appSettings, darkMode, getRoute, t } = getAdminContext(); // :36
const appSettingsState = fromStore(appSettings);                  // :37 — note: appSettings/darkMode fromStore also drop once .current lands (D-08)
const darkModeState = fromStore(darkMode);                        // :38
const getRouteState = fromStore(getRoute);                        // :39 — DELETE
// :139  goto(getRouteState.current('Home'), …) → goto(getRoute.current('Home'), …)
```
Verification gate: `grep -rn 'getRouteState' apps/frontend/src` → 0 after Step 2 (Pitfall 4).

---

## Shared Patterns

### Rune-handle `{ get current }` shape (single source of truth, additive)
**Source:** `dataContext.svelte.ts:99-107`, `appContext.svelte.ts:278-287`.
**Apply to:** `getRoute` producer (§1), the additive `.current` getters (§3).
Every rune handle in this codebase reads the SAME underlying `$state`/`$derived` the legacy store wraps — never a second source. The getter is additive next to the surviving store export so same-commit-unmigrated consumers still compile.

### Explicit-getter delegation over spread (de-reactivation fix)
**Source:** `authContext.svelte.ts:64-72`.
**Apply to:** `adminContext` (§4); audit any spread that flattens a `$derived` accessor.
`{ ...ctx }` invokes every getter ONCE and captures values. Reactive accessors MUST be re-exposed as `get X() { return src.X; }`.

### Context Destructuring Rule (CLAUDE.md authority)
**Source:** CLAUDE.md "Context Destructuring Rule (Svelte 5)"; `results/+layout.svelte:61-79`.
**Apply to:** AdminNav (§5) and any consumer the review surfaces. Reactive accessors (`isAuthenticated`, the 22-name `REACTIVE_ACCESSORS` set at `spike-009...mjs:48-74`) → `$derived(ctx.X)`. Stable refs (`t`, `getRoute`, store-shaped `appSettings`/`dataRoot`) → destructure ok. The codemod's `REACTIVE_ACCESSORS` set MUST stay in sync with the CLAUDE.md list.

### Codemod regex guards (false-positive-free, idempotent)
**Source:** `spike-009...mjs:100-101`.
**Apply to:** the new `$getRoute(` pass (§6). Negative-lookbehind `(?<![\w$_])` + a trailing guard (`(?!\w)` for bare/prop forms; `(?=\()` for the call form). Idempotency proven by dry-run #2 reporting 0 changes.

## No Analog Found

None. Every modified surface has a shipped Phase 95/96 in-tree precedent.

## Metadata

**Analog search scope:** `apps/frontend/src/lib/contexts/{app,data,admin,auth,candidate}`, `apps/frontend/src/lib/dynamic-components/navigation/admin`, `apps/frontend/scripts`, `apps/frontend/src/routes/admin`.
**Files read this session:** `getRoute.svelte.ts` (full), `spike-009-store-codemod.mjs` (full), `dataContext.svelte.ts:60-110`, `adminContext.svelte.ts:80-119`, `AdminNav.svelte:1-57`, `appContext.svelte.ts:270-314`, `authContext.svelte.ts:60-73`, `appContext.type.ts` (grep), `candidateContext.svelte.ts` (grep), 2 admin `+page.svelte` (grep).
**Verified this session:** A1 (`authContext.svelte.ts:25` = `$derived(!!page.data.session)`) — CONFIRMED. adminContext spread at lines 97-99 — CONFIRMED. AdminNav destructure at line 32 — CONFIRMED.
**Pattern extraction date:** 2026-06-05
