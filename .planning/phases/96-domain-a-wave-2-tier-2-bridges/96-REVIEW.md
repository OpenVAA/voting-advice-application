---
phase: 96-domain-a-wave-2-tier-2-bridges
reviewed: 2026-06-04T00:00:00Z
depth: standard
files_reviewed: 10
files_reviewed_list:
  - apps/frontend/src/lib/contexts/utils/persistedState.svelte.ts
  - apps/frontend/src/lib/contexts/utils/persistedState.svelte.test.ts
  - apps/frontend/src/lib/contexts/app/survey.svelte.ts
  - apps/frontend/src/lib/contexts/app/survey.svelte.test.ts
  - apps/frontend/src/lib/contexts/app/tracking/trackingService.svelte.ts
  - apps/frontend/src/lib/contexts/app/tracking/trackingService.svelte.test.ts
  - apps/frontend/src/lib/contexts/app/appContext.svelte.ts
  - apps/frontend/src/lib/contexts/app/appContext.type.ts
  - apps/frontend/src/lib/contexts/voter/voterContext.svelte.ts
  - apps/frontend/src/lib/contexts/candidate/candidateContext.svelte.ts
findings:
  critical: 1
  warning: 3
  info: 2
  total: 6
status: issues_found
---

# Phase 96: Code Review Report

**Reviewed:** 2026-06-04T00:00:00Z
**Depth:** standard
**Files Reviewed:** 10
**Status:** issues_found

## Summary

This phase migrates the Tier-2 context bridges (survey, tracking, voter, candidate)
off the `fromStore` store-bridge pattern onto the rune-native `{ current }` handle
pattern, and introduces `sessionStorageState`/`localStorageState` rune-native
persisted-state helpers. The Context Destructuring Rule is respected throughout:
all reactive accessors remain exposed as getters (`get current()`, context
`get X()` accessors) and consumers read via `ctx.X` / `handle.current`; no reactive
value is destructured into a plain local binding. `$derived`/`$effect`/`untrack`
usage in the migrated producers is sound, and the appContext seam correctly
re-wraps the rune handles back to store-shaped exports for un-migrated consumers.

However, the migration of the tracking `sessionId` from `sessionStorageWritable`
to `sessionStorageState` introduces a **behavioral regression**: the new helper
persists ONLY on explicit `set`/`update`, whereas the old store persisted its
initial value synchronously on subscribe. Because nothing ever calls
`sessionId.set()`, the generated session UUID is now never written to
`sessionStorage` — silently breaking cross-reload analytics session correlation.
The remaining findings are reactivity-premise and robustness concerns.

The intentionally-deferred `fromStore(getRoute)` in candidateContext (Phase 97 /
CTX-08 boundary) was treated as out of scope and not flagged.

## Critical Issues

### CR-01: tracking `sessionId` default UUID is never persisted to sessionStorage (cross-reload session correlation broken)

**File:** `apps/frontend/src/lib/contexts/app/tracking/trackingService.svelte.ts:74`
(helper: `apps/frontend/src/lib/contexts/utils/persistedState.svelte.ts:112-129`)

**Issue:**
The session id is created with
`const sessionId = sessionStorageState('appContext-sessionId', getUUID());`
and is read-only thereafter — the producer never calls `sessionId.set()`, and the
appContext seam wraps it read-only (`toStore(() => tracking.sessionId.current)`,
`appContext.svelte.ts:178`).

`sessionStorageState`'s backing core (`storageState`, persistedState.svelte.ts:112)
persists the value to storage ONLY inside `set`/`update`:

```ts
const initial = getItemFromStorage<TValue>(type, key) ?? defaultValue;
let value = $state<TValue>(initial);   // initial default is NEVER written to storage
return {
  get current() { return value; },
  set(v) { value = v; saveItemToStorage(type, key, v); },   // only path that persists
  update(fn) { /* ... */ saveItemToStorage(type, key, value); }
};
```

The OLD `sessionStorageWritable` (storageWritable, persistedState.svelte.ts:146-163)
persisted the initial value synchronously via `store.subscribe((v) => saveItemToStorage(...))`,
which fires immediately on subscription. The test suite even documents this:
`persistedState.svelte.test.ts:117-130` ("subscribe callback fires synchronously
on creation, persisting the initial value immediately").

Consequence: with the old store, the first `getUUID()` was written to
`sessionStorage['appContext-sessionId']` and restored on every subsequent full
page load within the tab — giving a single stable `vaaSessionId` per browser
session. With `sessionStorageState`, the key is read on init but never written,
so every full reload / new tab regenerates a fresh UUID. All `track()` events
emit `vaaSessionId: sessionId.current` (line 145), so analytics can no longer
correlate events across reloads within a session — the entire reason the id was
in `sessionStorage` rather than a plain in-memory `$state`. The stale, never-written
`appContext-sessionId` key is also misleading to anyone inspecting storage.

Note: in-SPA client navigations are unaffected (the root `+layout.svelte`
`initAppContext()` instance survives), so this is silent — unit tests
(`trackingService.svelte.test.ts`) only assert `vaaSessionId` is *a* string, never
that it is *stable across a fresh producer instance*, and the `sessionStorageState`
round-trip test (`persistedState.svelte.test.ts:269-278`) only round-trips *after*
an explicit `set`, so the gap is not covered.

**Fix:** Persist the default on first creation so the session id survives a reload.
Either persist the initial value in the helper when it falls back to the default:

```ts
function storageState<TValue>(type, key, defaultValue) {
  const stored = getItemFromStorage<TValue>(type, key);
  const initial = stored ?? defaultValue;
  let value = $state<TValue>(initial);
  if (stored == null) saveItemToStorage(type, key, initial); // persist freshly-defaulted value
  // ...
}
```

(scope this to `sessionStorageState`/an opt-in flag if persisting every default is
undesirable for the localStorage callers), OR persist explicitly at the call site:

```ts
const sessionId = sessionStorageState('appContext-sessionId', getUUID());
// Persist the freshly-generated id so it survives a full reload (matches the
// old sessionStorageWritable subscribe-on-init persistence).
if (browser) sessionId.set(sessionId.current);
```

Add a regression test asserting a second `sessionStorageState(key, getUUID())`
reads back the FIRST instance's value without any intervening `set`.

## Warnings

### WR-01: `reactiveLocale.current` is a static snapshot — the "reactive getter" premise does not hold

**File:** `apps/frontend/src/lib/contexts/app/appContext.svelte.ts:283-287`
(root cause: `apps/frontend/src/lib/contexts/i18n/i18nContext.ts:21`)

**Issue:**
`reactiveLocale` is documented as a "rune-native read handle over the SAME locale
value the `locale` store wraps" with "reactive reads via `.current`":

```ts
const reactiveLocale = {
  get current() { return componentCtx.locale; }
};
```

But `componentCtx.locale` ultimately originates from the i18n context as a plain
snapshot taken once at init time: `i18nContext.ts:21` sets `locale: getLocale()`
(a value, not a getter). So `reactiveLocale.current` returns a frozen value; reading
it inside a `$derived`/`$effect` registers NO reactive dependency that can ever
re-fire. Voter/candidate contexts now route their locale reads through
`reactiveLocale.current` (`voterContext.svelte.ts:416`, `candidateContext.svelte.ts:61`).

This is NOT a regression — the prior `fromStore(toStore(() => componentCtx.locale))`
path was equally static for the same reason, and locale changes are URL-driven and
trigger a full SSR re-init / remount. But the migration's stated rationale
("reactive reads happen via `.current`") is inaccurate, which is a maintenance trap:
a future change that makes locale switchable WITHOUT remount would silently fail to
propagate through this handle.

**Fix:** Either make the i18n `locale` a getter so the chain is genuinely reactive
(`get locale() { return getLocale(); }` in `i18nContext.ts`, assuming `getLocale()`
reads a reactive source), or correct the comments on `reactiveLocale` to state that
the value is a per-load snapshot and locale changes require a remount.

### WR-02: `userPreferencesHandle` wraps `fromStore(userPreferences)` in a getter — double indirection with no reactive guarantee at the read site

**File:** `apps/frontend/src/lib/contexts/app/appContext.svelte.ts:158-163`

**Issue:**
```ts
const userPreferencesReactive = fromStore(userPreferences);
const userPreferencesHandle = {
  get current() { return userPreferencesReactive.current; }
};
```

`fromStore` returns a handle whose `.current` is `$state`-backed and is only kept in
sync while there is an active effect subscription. It is created here at context-init
(outside any `$effect`). It works in practice because `trackingService`'s
`shouldTrackValue` `$derived` reads `userPreferences.current` inside a tracking scope,
which establishes the subscription lazily. However, the seam also reads
`userPrefsReactive.current` from inside plain (non-reactive) `setTimeout` callbacks
(`startFeedbackPopupCountdown`/`startSurveyPopupCountdown`, lines 227/233/246). If
the only live subscriber (the `shouldTrack` derived) is ever torn down or never
evaluated, `fromStore`'s value can go stale and those callbacks read a snapshot.
This is fragile coupling between two unrelated consumers sharing one `fromStore`.

**Fix:** Read `userPreferences` state through a single explicit reactive accessor that
does not depend on an incidental subscriber, or document that the `shouldTrack` derived
is load-bearing for `userPreferencesReactive`'s freshness. At minimum add a comment at
lines 158-163 noting the shared-subscription dependency so a future refactor that
removes/guards the `shouldTrack` derived does not silently stale the popup callbacks.

### WR-03: `surveyLink` only replaces the FIRST `{sessionId}` placeholder

**File:** `apps/frontend/src/lib/contexts/app/survey.svelte.ts:24`

**Issue:**
```ts
linkTemplate.replace(/\{\s*sessionId\s*\}/, sessionId.current ?? '')
```
`String.prototype.replace` with a non-global regex replaces only the first match.
A configured `linkTemplate` containing `{sessionId}` more than once (e.g. in both a
path segment and a query param) leaves later occurrences un-substituted, producing a
malformed survey URL. This is pre-existing behavior carried over unchanged by the
migration, but it is a latent correctness bug in a config-driven, user-facing link.

**Fix:** Use a global regex so all placeholders are interpolated:
```ts
linkTemplate.replace(/\{\s*sessionId\s*\}/g, sessionId.current ?? '')
```

## Info

### IN-01: `getUUID()` is evaluated during SSR for `sessionStorageState('appContext-sessionId', …)`

**File:** `apps/frontend/src/lib/contexts/app/tracking/trackingService.svelte.ts:74`

**Issue:**
`sessionStorageState('appContext-sessionId', getUUID())` evaluates `getUUID()`
eagerly as the default-value argument on BOTH server and client render. Under SSR
the storage gate returns the (different) server-generated UUID, then the client
generates another. With CR-01 fixed (persisting the default), ensure the persisted
value is the CLIENT's id, not a server-rendered one, to avoid a hydration-time id
swap. This mirrors the pre-existing behavior and is SSR-safe today only because the
value is never serialized into SSR HTML — worth a confirming comment once CR-01 lands.

**Fix:** When applying the CR-01 persistence fix, gate the initial persist on
`browser` (as shown in the CR-01 snippet) so only the client id is stored.

### IN-02: `RuneTrackingService.sessionId` typed `ReactiveHandle<string>` is wider than the supplied handle

**File:** `apps/frontend/src/lib/contexts/app/tracking/trackingService.svelte.ts:29,74,158`

**Issue:**
`sessionId` is declared `ReactiveHandle<string>` (read-only) but the value assigned
is a full `PersistedState<string>` (`{ current; set; update }`). This is structurally
fine, but it also means the producer's own `set`/`update` capability on the session id
is hidden from the type — which is exactly what masks CR-01 (a caller cannot see that
`set` exists and must be invoked to persist). Narrowing the public surface is
reasonable, but the comment at lines 71-73 ("Persistent session id") overstates the
behavior given CR-01. Tighten the comment once CR-01 is resolved.

**Fix:** After fixing CR-01, update the line 71-73 comment to state explicitly where/
how the id is persisted (default written on init), so the read-only public type does
not mislead future maintainers into thinking persistence is automatic.

---

_Reviewed: 2026-06-04T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
