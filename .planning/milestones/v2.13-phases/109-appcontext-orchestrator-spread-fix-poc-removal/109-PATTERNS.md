# Phase 109: appContext Orchestrator + Spread Fix + PoC Removal - Pattern Map

**Mapped:** 2026-06-13
**Files analyzed:** 4 modified, 1 deleted
**Analogs found:** 4 / 4 (all in-tree, Phases 106-108)

## Headline finding (decisive for the planner)

**appContext is spread by ALL THREE downstream orchestrators, which this phase does NOT touch.**

```
candidateContext.svelte.ts:366   ...appContext,   (also ...authContext at 367)
adminContext.svelte.ts:98        ...appContext,
voterContext.svelte.ts:488       ...appContext,
```

`{ ...appContext }` copies only **own-enumerable** properties. Svelte 5 compiles
class `$state`/`$derived` fields AND prototype `get` accessors to **non-own**
members, which object spread silently drops (spike finding A, CONTEXT-CLASS-PROOF;
re-verified in authContext/trackingService/componentContext headers).

Today `appContext` is a plain object literal returned from `initAppContext()` —
EVERY returned member is own-enumerable, so the three spreads currently capture
all of them (as snapshots, but the consumer surface shape is complete). The
class conversion MUST preserve that: **every member currently in the return
object (lines 296-323) must remain OWN-ENUMERABLE on the new class instance.**

Consequence: this is NOT the darkMode/filter case (prototype getters fine because
not spread). It is the dataContext/authContext/trackingService case — the most
spread-sensitive shape in the migration. Use the AuthContextProvider
constructor-`Object.defineProperty` mechanic + own-field/arrow-field handles.

The CONVENTIONS "Spread-of-context" anti-pattern fix (explicit getter forwarding
in the PARENT) applies to the INTERNAL `{ ...componentCtx }`/`{ ...dataCtx }`/
`{ ...tracking }` spreads that appContext itself performs (success criterion 1) —
NOT to how the orchestrators consume appContext (those stay as-is until 110-112).

## File Classification

| File | Role | Data Flow | Closest Analog | Match Quality |
|------|------|-----------|----------------|---------------|
| `apps/frontend/src/lib/contexts/app/appContext.svelte.ts` | provider (orchestrator) | event-driven / request-response | `auth/authContext.svelte.ts` + `component/componentContext.svelte.ts` | exact (orchestrator class + own-enumerable spread target) |
| `apps/frontend/src/lib/contexts/app/appContext.type.ts` | type | n/a | self (delete `_poc*` block only) | exact |
| `apps/frontend/src/lib/contexts/component/darkMode.svelte.ts` | provider (leaf) | primitive | self (remove `createDarkMode` factory) | exact |
| `apps/frontend/src/lib/contexts/app/appContext.poc.svelte.test.ts` | test | n/a | DELETE | n/a |
| `apps/frontend/src/lib/contexts/app/index.ts` | barrel | n/a | self (no change expected — `export *`) | exact |

## Pattern Assignments

### `appContext.svelte.ts` (orchestrator class conversion)

**Primary analog:** `auth/authContext.svelte.ts` (own-enumerable accessor mechanic, the spread-safe shape).
**Secondary analog:** `component/componentContext.svelte.ts` (composing leaf via `Object.assign(this, getX())` + private helper field + delegation getter).

The current `initAppContext()` (368 lines) becomes a `class AppContextProvider`
constructed inside `initAppContext()` via `setContext(KEY, new AppContextProvider())`.
Mirror the auth/component factory wrapper exactly:

```ts
export function getAppContext() {
  if (!hasContext(CONTEXT_KEY)) error(500, 'GetAppContext() called before initAppContext()');
  return getContext<AppContext>(CONTEXT_KEY);
}
export function initAppContext(): AppContext {
  if (hasContext(CONTEXT_KEY)) error(500, 'InitAppContext() called for a second time');
  return setContext<AppContext>(CONTEXT_KEY, new AppContextProvider());
}
```

**(1) Own-enumerable accessor for spread-consumed reactive members** — copy the AuthContextProvider mechanic (`authContext.svelte.ts:46-68`):

```ts
#isAuthenticated = $derived(!!page.data.session);
readonly isAuthenticated!: boolean;            // type only; getter installed in ctor
constructor() {
  const self = this;
  Object.defineProperty(this, 'isAuthenticated', {
    enumerable: true, configurable: true,
    get(): boolean { return self.#isAuthenticated; }   // own-enumerable + reactive
  });
}
```

Apply this shape to every member that the downstream `{ ...appContext }` spreads
must carry as own-enumerable: the `{ current }` handles (`locale`, `locales`,
`darkMode`, `appSettings`, `appCustomization`, `appType`, `reactiveAppSettings`,
`reactiveLocale`, `getRoute`, `surveyLink`, `userPreferences`, `openFeedbackModal`,
`popupQueue`) AND the spread-in members from componentCtx/dataCtx/tracking.

**(2) Composing-leaf pattern for the internal spreads** — copy ComponentContextProvider (`componentContext.svelte.ts:40-50`):

```ts
#darkMode = new DarkMode();              // private helper field
constructor() {
  Object.assign(this, getI18nContext()); // copy STABLE members as OWN props
}
get darkMode(): boolean { return this.#darkMode.current; }
```

For appContext: replace `{ ...componentCtx }` / `{ ...dataCtx }` / `{ ...tracking }`
(lines 297-299) with **explicit forwarding** of each member onto own instance
properties. Stable plain members (`t`, `translate` from componentCtx; plain fns)
copy via `Object.assign(this, ...)` in the constructor. Reactive members
(componentCtx `darkMode`, dataCtx handles, tracking `{ current, set }` handles)
forward as own-enumerable getters / held handle objects. This is the §17 / spike-A
"explicit getter forwarding, never instance spread" requirement — but landed as
OWN properties (defineProperty in ctor) because the result is itself spread downstream.

**(3) Arrow-function fields for detachable methods** — §18 + authContext arrow fields (`authContext.svelte.ts:77-101`). All the closure functions in the current factory that cross the boundary become arrow fields capturing `this`:
`sendFeedback`, `setDataConsent`, `setFeedbackStatus`, `setSurveyStatus`,
`startFeedbackPopupCountdown`, `startSurveyPopupCountdown` (these are destructured/
passed by consumers). Bodies preserved verbatim (lines 199-265).

**(4) SSR merge — PRESERVE VERBATIM (success criterion 3)** — the v2.11 synchronous-init merge (lines 87-90, 128-133) becomes field initializers, the `$effect` re-merge guards (lines 117-124, 148-155) become `$effect` in the CONSTRUCTOR (legal — appContext is constructed during component init, an effect context; confirmed by filterContext's `$effect`-in-constructor finding, CONTEXT-CLASS-PROOF "New production finding"). Per §20 do NOT move the SSR-correct INITIAL merge into `$effect`; it must stay a synchronous field initializer:

```ts
// field initializer (runs server + client) — preserve mergeInitialAppSettings call:
#appSettingsValue = $state<AppSettings>(
  mergeInitialAppSettings(staticSettings, dynamicSettings,
    page.data?.appSettingsData as DynamicSettings | Error | undefined));
// appCustomization initializer identical to lines 128-133
// the prev-ref-guarded $effect re-merge (lines 117-124) goes in the constructor
```

Keep `mergeAppSettings`/`mergeInitialAppSettings` imports and the `prevAppSettingsData`/
`prevAppCustomizationData` ref-equality guards (the Phase-64 over-fire fix) intact.

**(5) PoC removal** — delete the entire `_pocDarkMode`/`_pocAppType`/`_pocGetRoute`
block (lines 325-367) from the return/instance. Nothing references them
(grep confirmed only self-references remain).

### `appContext.type.ts` (delete `_poc*` block)

Delete lines 130-150 (the PoC comment block + the three `_poc*` type members:
`readonly _pocDarkMode: boolean`, `_pocAppType: AppType`, `readonly _pocGetRoute: RouteBuilder`).
Type-only change is explicitly allowed here (CONTEXT.md — byte-identity applies to
downstream consumers, not the appContext files). The `AppContext` union shape
(lines 19-128) and `AppType` (line 156) are unchanged. The instance must remain
structurally assignable to `AppContext` (own-enumerable members satisfy the type).

### `darkMode.svelte.ts` (remove back-compat factory)

Delete `createDarkMode()` (lines 43-56) and update the class JSDoc lines 18-21
(which reference the PoC test and "removed only at Phase 109"). Keep `class DarkMode`
(lines 23-41) intact — `componentContext` composes it via `new DarkMode()`.
After deletion, grep for `createDarkMode` must return zero non-test hits
(the only importer is the PoC test, deleted in the same phase).

### `appContext.poc.svelte.test.ts` (DELETE)

Delete the entire file (145 lines, 3 `it()` tests). It is the sole importer of
`createDarkMode` and the sole `_poc*` test artifact. Baseline `yarn vitest run
src/lib/contexts/` is 101/101; after deletion the new baseline is **101 − 3 = 98**
(CONTEXT.md note "minus the deleted PoC test file's count"; the proof doc cites an
85/85 older count — use the live count at execution time).

## Shared Patterns

### Own-enumerable accessor (the spread-safety primitive)
**Source:** `auth/authContext.svelte.ts:55-68` (constructor `Object.defineProperty`).
**Apply to:** every appContext member consumed via the three downstream `{ ...appContext }` spreads. This is the load-bearing discipline of the whole phase.

### Composing-leaf own-property copy + private helper field
**Source:** `component/componentContext.svelte.ts:40-50`.
**Apply to:** replacing appContext's internal `...componentCtx`/`...dataCtx`/`...tracking` spreads with explicit own-property forwarding.

### Handle-object instance fields + arrow-field methods (spread-sensitive producer)
**Source:** `app/tracking/trackingService.svelte.ts:33-54` (header documents the exact own-enumerable handle-object + arrow-field recipe for a `...spread`-consumed producer).
**Apply to:** appContext's `{ current, set }` handles (`appType`, `appSettings`, `appCustomization`, `openFeedbackModal`, `reactive*`) and its detachable methods.

### SSR synchronous-init merge, no `$effect` for initial value
**Source:** CONVENTIONS §7/§20 + current `appContext.svelte.ts:87-90,128-133` (the code to preserve).
**Apply to:** appSettings/appCustomization field initializers; `$effect` re-merge guards move into the constructor.

## No Analog Found

None. All four target shapes (orchestrator class, own-enumerable spread target,
composing leaf, SSR merge) have direct in-tree precedents from Phases 106-108.

## Metadata

**Analog search scope:** `apps/frontend/src/lib/contexts/{app,auth,component,data,filter,admin,voter,candidate}/`
**Files scanned:** appContext (svelte+type), darkMode, componentContext, authContext, trackingService, poc test, three orchestrator spread sites, app/index barrel.
**Pattern extraction date:** 2026-06-13
