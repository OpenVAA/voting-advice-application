# Phase 108: App-Layer Producer Contexts - Pattern Map

**Mapped:** 2026-06-13
**Files analyzed:** 4 conversion targets (+ 3 test files that must stay green, + appContext byte-identity boundary)
**Analogs found:** 4 / 4 (all in-repo, freshly converted in Phase 106/107)

## File Classification

| Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---------------|------|-----------|----------------|---------------|
| `contexts/app/getRoute.svelte.ts` | provider (rune handle factory) | transform (page → RouteBuilder) | `contexts/auth/authContext.svelte.ts` (`$derived` field idiom) + its own spike-012 body | role-match (consumed by **direct access**, not spread) |
| `contexts/app/survey.svelte.ts` | provider (rune handle factory) | transform (appSettings+sessionId → link) | `contexts/app/popup/popupStore.svelte.ts` (class + factory wrapper) | role-match (consumed by **direct access**) |
| `contexts/app/tracking/trackingService.svelte.ts` | service | event-driven (analytics events) | `contexts/auth/authContext.svelte.ts` (class, arrow-field methods, `$derived` field) | role-match (consumed by **spread** `...tracking` — spread-safety gate applies) |
| `contexts/app/popup/popupStore.svelte.ts` | store | pub-sub (queue) | already converted — `class PopupStore` exists; only formalize/verify factory wrapper | exact (self) |

**Consumption audit (decisive — drives spread-safety obligation):** In `appContext.svelte.ts` `setContext` literal (lines 296-322):
- `getRoute` → assigned as own key `getRoute` (line 313) → **DIRECT access, NOT spread** → no own-enumerable accessor obligation.
- `popupQueue` → own key `popupQueue` (line 315) → **DIRECT access** → no spread obligation.
- `survey` → own key `surveyLink: survey` (line 322) → **DIRECT access** → no spread obligation.
- `tracking` → `...tracking` (line 299) → **SPREAD-CONSUMED** → its rune-handle members (`sendTrackingEvent`/`sessionId`/`shouldTrack`) and plain methods MUST survive spread.

This is the single most load-bearing fact for planning: only `trackingService` is spread-consumed, and it already exposes its reactive members as **object-literal `{ get current() {...} }` handles** (own-enumerable, spread-safe by construction). A class conversion of `trackingService` must preserve that — either keep returning own-enumerable `{ current }` handle objects, or use the constructor-assigned own-accessor mechanic from `AuthContextProvider`.

## Pattern Assignments

### `contexts/app/tracking/trackingService.svelte.ts` (service, event-driven) — SPREAD-CONSUMED

**Analog:** `contexts/auth/authContext.svelte.ts` (class shape, arrow-field methods, spread-safety) + retain own structure.

**Class + spread-safe `$derived` member** (authContext lines 46-68): private `$derived` backing field + constructor-installed own-enumerable accessor. Apply to any reactive member that ends up on the spread surface. NOTE the current producer already solves spread-safety differently: its `shouldTrack`/`sessionId`/`sendTrackingEvent` are plain object-literal `{ get current() }` handles (trackingService lines 77-95), which are already own-enumerable values. The simplest byte-identical conversion keeps these as fields holding handle objects.

**Arrow-function fields for detachable methods** (§18 — authContext lines 77-101 + popupStore lines 23-29):
```typescript
logout = async (): Promise<void> => { /* captures this */ };
```
The tracking methods `startPageview` / `startEvent` / `track` / `submitAllEvents` / `resetAllEvents` are returned in the literal (lines 155-164) and `...tracking`-spread into the context, then some are destructured by consumers (`tracking.startEvent` is called at line 249). Methods that survive detach MUST be arrow-function fields.

**Internal mutable (non-rune) state** stays as private fields, not `$state`: `pageviewEvent` / `unsubmittedEvents` (lines 54-65) are plain mutable bookkeeping, NOT reactive — convert to `#pageviewEvent` / `#unsubmittedEvents` private fields (do NOT wrap in `$state`).

**`$derived` field for `shouldTrack`** (lines 86-90): reads `appSettings.current` + `userPreferences.current` — keep as a `$derived` reading the injected `.current` handles. No `$effect`.

**Session id**: `sessionStorageState('appContext-sessionId', getUUID())` (line 74) returns a rune handle — keep as-is; do not re-wrap.

**Existing test** `trackingService.svelte.test.ts` constructs via the `trackingService({...})` factory call — preserve the exported factory function signature (a `function trackingService(...)` returning the instance, mirroring `popupStore()` wrapping `new PopupStore()`).

---

### `contexts/app/popup/popupStore.svelte.ts` (store, pub-sub) — ALREADY CONVERTED

**Analog:** itself (canonical Phase 106 exemplar). The class + factory wrapper pattern here is the template for the other three:
```typescript
class PopupStore implements PopupStoreApi {
  #queue = $state<Array<PopupQueueItem>>([]);   // reassigned wholesale (§17)
  #current = $derived(this.#queue[0]);
  push = (item) => { this.#queue = [...this.#queue, item]; };  // arrow field (§18)
  shift = () => { this.#queue = this.#queue.slice(1); };
  get current() { return this.#current; }        // prototype getter — SAFE (direct access)
}
export function popupStore(): PopupStoreApi { return new PopupStore(); }
```
Phase 108 action here: **verify only** — confirm the factory wrapper `popupStore()` is the formalized surface and nothing more is required. Prototype `get current()` is safe because `popupQueue` is direct-access (not spread).

---

### `contexts/app/getRoute.svelte.ts` (provider, transform) — DIRECT ACCESS

**Analog:** `popupStore.svelte.ts` class+factory wrapper for the SHAPE; **own existing body MUST be preserved verbatim** for the spike-012 mechanic.

**CRITICAL — preserve spike-012 per-field page read** (getRoute lines 41-44):
```typescript
const builder = $derived.by<RouteBuilder>(() => {
  const { params, route, url } = page;   // 3 fine-grained deps — NEVER read `page` whole
  return (options) => buildRoute(options, { params, route, url });
});
```
As a class field this becomes `#builder = $derived.by(() => { const { params, route, url } = page; ... })`. The destructure-of-three-fields-inside-the-callback is load-bearing (header lines 18-38) — do not read `page` as a single object in the tracking scope.

**Return shape:** `{ readonly current: RouteBuilder }` — keep byte-identical. `get current()` prototype getter is SAFE (direct access at appContext line 313). Factory `createGetRoute()` MUST stay called from component-init context (header lines 11-16).

---

### `contexts/app/survey.svelte.ts` (provider, transform) — DIRECT ACCESS

**Analog:** `popupStore.svelte.ts` class+factory wrapper for SHAPE; own `$derived.by` body preserved.

**`$derived.by` over injected `.current` handles** (survey lines 22-25):
```typescript
const linkValue = $derived.by(() => {
  const linkTemplate = appSettings.current.survey?.linkTemplate;
  return linkTemplate ? linkTemplate.replace(/\{\s*sessionId\s*\}/, sessionId.current ?? '') : undefined;
});
```
As a class field: `#linkValue = $derived.by(...)` reading the constructor-injected `appSettings`/`sessionId` handles. Return/expose `{ readonly current }` — prototype `get current()` SAFE (direct access at appContext line 322). Factory `surveyLink({ appSettings, sessionId })` signature preserved (test `survey.svelte.test.ts` calls it directly).

---

## Shared Patterns

### Class + factory-wrapper export idiom
**Source:** `contexts/app/popup/popupStore.svelte.ts:19-41`
**Apply to:** all 4 producers — declare `class X`, export a `function factoryName(...): XApi { return new X(...); }` so the appContext call sites and tests stay byte-identical.

### Arrow-function fields for detachable callbacks (§18 / spike 020)
**Source:** `authContext.svelte.ts:77-101`, `popupStore.svelte.ts:23-29`
**Apply to:** any method that is destructured or passed as a handler — `trackingService` methods, popup `push`/`shift`.

### Spread-safety: own-enumerable accessor (§D / Phase 107 gate)
**Source:** `authContext.svelte.ts:46-68` (constructor `Object.defineProperty` own getter) and `componentContext.svelte.ts:42-45` (`Object.assign(this, ...)` for stable values)
**Apply to:** ONLY `trackingService` (the sole spread-consumed producer). `getRoute`/`survey`/`popupStore` are direct-access and may use plain prototype `get current()`. Note trackingService's current `{ get current() }` literal handles are already own-enumerable — preserving them satisfies the gate without the defineProperty dance.

### No `$effect` for initial-value derivation (spike 023)
**Source:** `authContext.svelte.ts:49` (synchronous `$derived`), all producers
**Apply to:** all 4 — use synchronous field initializers / `$derived` / `$derived.by` fields only.

### Back-compat handles stay until Phase 113
**Source:** CONTEXT.md decisions; appContext consumption is byte-identical
**Apply to:** all 4 — keep `{ readonly current }` handle return shapes; do NOT flatten. Do NOT touch `appContext.svelte.ts` `_poc*` surfaces (Phase 109/113 scope).

## No Analog Found

None — every producer has an in-repo Phase 106/107 analog.

## Metadata

**Analog search scope:** `apps/frontend/src/lib/contexts/{app,auth,component}/`
**Files scanned:** getRoute, survey, trackingService(+type), popupStore(+type), authContext, componentContext, appContext, survey/popup/tracking tests, index barrels
**Pattern extraction date:** 2026-06-13
