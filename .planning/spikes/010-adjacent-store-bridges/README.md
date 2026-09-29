---
spike: 010
name: adjacent-store-bridges
type: standard
validates: "Given the 6 already-spiked migration targets (001-006), when the full apps/frontend/src/lib/contexts/** tree is grep'd for svelte/store imports, then (a) every additional bridge site is enumerated with file path + store-usage shape + migration recommendation, (b) one representative bridge (popupStore) is built as a rune-native variant proving Spike 001's value-replace pattern generalizes to push/shift queue-shaped stores, (c) a migration order is produced that respects dependency chains (Tier 1: leaf contexts; Tier 2: consumers of Tier 1)"
verdict: VALIDATED
related: [001, 002, 003, 005, 006]
tags: [svelte5, runes, inventory, popup, darkmode, locale, migration]
---

# Spike 010 — Adjacent Store Bridges (inventory + representative spike)

## What This Validates

Spikes 001-006 covered the **primary** migration targets (appSettings,
dataRoot, voter+candidate answer stores, persistedState, StackedState). But
`apps/frontend/src/lib/contexts/**` has more `svelte/store` imports beyond
those — secondary bridges that consume the primary ones and add their own
shape (e.g. `getRoute`, `survey`, `trackingService`, `popupStore`).

This spike (a) enumerates ALL remaining bridge sites with migration shape,
(b) proves one representative case (popupStore) works end-to-end as a
rune-native variant, (c) produces a migration order that respects dependencies.

## Inventory

Grep `apps/frontend/src/lib/contexts/**` for `from 'svelte/store'` yields
**18 files**, grouped by tier:

### Tier 1 — Leaf contexts (already spiked or new in this spike)

| File | Bridge mechanism | Spike | Migration shape |
|------|------------------|-------|-----------------|
| `app/appContext.svelte.ts` | `toStore(() => $state)` for appType, appSettings, appCustomization, darkMode, locale, idTokenClaims | 001 + 008 | Drop `toStore` for each, expose `get current()`. Adopt Spike 008's synchronous-init pattern for appSettings. |
| `data/dataContext.svelte.ts` | `writable(dataRoot)` + `get(dataRootStore)` workaround | 002 | Drop `writable`, expose split `{ current, instance }` handles. |
| `voter/answerStore.svelte.ts` | `localStorageWritable + fromStore` | 003 | Replace with `runeLocalStorage` + getter. |
| `candidate/candidateUserDataStore.svelte.ts` | `localStorageWritable + fromStore` for edited answers | 005 | Same swap. |
| `utils/persistedState.svelte.ts` (delete) | exports `localStorageWritable` / `sessionStorageWritable` | 003+005 | File becomes deletable once Tier 1 + Tier 2 callers migrate. |
| `utils/StackedState.svelte.ts` (delete) | `implements Readable<T>` + `toStore()` | 006 | Replaced by `settingsOverlay`; file becomes deletable. |
| `app/popup/popupStore.svelte.ts` | `toStore(() => firstItem)` + `subscribe` getter | 010 (this) | Drop `toStore`, expose `get current()`. ~5-line diff. |

### Tier 2 — Secondary bridges (consume Tier 1; migrate AFTER Tier 1 lands)

| File | Bridge mechanism | Migration shape |
|------|------------------|-----------------|
| `app/getRoute.svelte.ts` | `writable(routeFn)` + custom `afterNavigate` workaround (lines 18-30 explain why `derived(toStore(() => page), …)` was rejected) | Migrate cautiously — file documents the `toStore` short-circuit it was working around. Once appSettings + page are rune-native, this should simplify to `$derived(buildRoute(page, locale))` |
| `app/survey.svelte.ts` | `fromStore(appSettings) + fromStore(sessionId)` + `toStore(() => linkValue)` | Drop both `fromStore` calls (once Tier 1 done). Drop `toStore` return — return `{ get current() { return linkValue; } }` |
| `app/tracking/trackingService.svelte.ts` | `fromStore(appSettings) + fromStore(userPreferences) + fromStore(sessionId)` + `toStore(...)` for sendTrackingEvent + shouldTrack | Drop all `fromStore` (Tier 1 dependencies become rune-native). Drop `toStore` wrappers; expose `.current` getters. |
| `voter/voterContext.svelte.ts` | `fromStore(appSettings) + fromStore(locale)` + `sessionStorageWritable('voterContext-firstQuestionId') + fromStore(...)` | Drop both `fromStore` calls. Use `runeSessionStorage` (sibling of `runeLocalStorage` from Spike 003 — needs adding) for firstQuestionId. |
| `candidate/candidateContext.svelte.ts` | `fromStore(appSettings) + fromStore(locale) + fromStore(getRoute)` | Drop all `fromStore` calls once Tier 1 + `getRoute.svelte.ts` migrate. **NB: destructure-trap risk per Spike 007** — consumers of candidateContext must not destructure reactive accessors. |
| `utils/dataCollectionStore.ts` | Accepts `Readable<DataRoot>` + `Readable<Array<Id>>` and returns `Readable<Array<TObject>>` | Update signature to accept rune-context handles and return `{ get current() }`. |

### Tier 3 — Type files (delete or update after Tier 1+2)

| File | Status |
|------|--------|
| `app/appContext.type.ts` | Type imports `Readable<T>` — delete those once context exposes `.current` instead of subscribe. |
| `app/popup/popupStore.type.ts` | `PopupStore = Readable<PopupQueueItem | undefined> & { push, shift }` — change to plain interface. |
| `app/tracking/trackingService.type.ts` | Similar — drop `Readable<T>` aliases. |
| `data/dataContext.type.ts` | Drop `Readable<DataRoot>`. |

### Outside `lib/contexts/`

| File | Issue |
|------|-------|
| `routes/+layout.svelte:69` | `const popupQueueState = fromStore(popupQueue)` — drops once popupStore migrates (Tier 1). Template at line 230 becomes `{#if popupQueue.current}`. |
| `lib/components/video/component-stores.ts` | Standalone — investigate during Tier 2 phase. |
| `lib/dynamic-components/entityList/EntityListWithControls.svelte` | Consumer site — likely picked up by Spike 009 codemod. |

## Representative spike — popupStore

**Production today** (`apps/frontend/src/lib/contexts/app/popup/popupStore.svelte.ts`):

```ts
import { toStore } from 'svelte/store';
export function popupStore(): PopupStore {
  let queue = $state<Array<PopupQueueItem>>([]);
  const firstItem = $derived(queue[0]);
  function push(item) { queue = [...queue, item]; }
  function shift() { queue = queue.slice(1); }
  const store = toStore(() => firstItem as PopupQueueItem | undefined);
  return { push, shift, subscribe: store.subscribe };
}
```

**Rune-native variant** (`apps/frontend/src/routes/runes-test/popup-rune/popupRuneStore.svelte.ts`):

```ts
// zero svelte/store imports
export function popupRuneStore(): PopupRuneStore {
  let queue = $state<Array<PopupQueueItem>>([]);
  const firstItem = $derived(queue[0]);
  function push(item) { queue = [...queue, item]; }
  function shift() { queue = queue.slice(1); }
  return {
    push, shift,
    get current() { return firstItem; }
  };
}
```

**Verified in browser** at `/runes-test/popup-rune`:

| Action sequence | popup.current | queue depth | queue contents |
|-----------------|---------------|-------------|----------------|
| push("Survey")  | {name:"Survey"} | 1 | ["Survey"] |
| push("Feedback") + push("Onboarding") | {name:"Survey"} | 3 | ["Survey","Feedback","Onboarding"] |
| shift() | {name:"Feedback"} | 2 | ["Feedback","Onboarding"] |
| shift() again | {name:"Onboarding"} | 1 | ["Onboarding"] |

Both consumer patterns (template direct `{popup.current}` and `.ts $derived(popup.current)` alias) stay in sync.

**Consumer migration** (`apps/frontend/src/routes/+layout.svelte:69+230`):

```diff
- const popupQueueState = fromStore(popupQueue);
- {#if popupQueueState.current}
+ // (delete the fromStore line)
+ {#if popupQueue.current}
```

## Migration Order

To respect dependencies, migrate in waves:

```
Wave 1 (parallel):
  ┌─ Spike 001 → app/appContext.svelte.ts (with Spike 008's SSR-aware pattern)
  ├─ Spike 002 → data/dataContext.svelte.ts
  ├─ Spike 003 → voter/answerStore.svelte.ts
  ├─ Spike 005 → candidate/candidateUserDataStore.svelte.ts (the 7-line edited-answers diff)
  ├─ Spike 006 → utils/StackedState → settingsOverlay + layout/layoutContext
  └─ Spike 010 → app/popup/popupStore.svelte.ts (this spike)

Wave 2 (after Wave 1):
  ┌─ app/survey.svelte.ts          (consumer of appSettings + sessionId)
  ├─ app/tracking/trackingService  (consumer of appSettings + userPreferences)
  ├─ voter/voterContext            (consumer of appSettings + locale + sessionStorageWritable)
  └─ candidate/candidateContext    (consumer of appSettings + locale + getRoute)

Wave 3 (after Wave 2):
  ├─ app/getRoute.svelte.ts        (own custom workaround — needs care)
  ├─ utils/dataCollectionStore.ts  (generic Readable<T> consumer)
  └─ Run Spike 009 codemod on all consumer .svelte files (146 sites)

Wave 4 (cleanup):
  ├─ Delete utils/persistedState.svelte.ts (zero callers)
  ├─ Delete utils/StackedState.svelte.ts (zero callers)
  ├─ Drop `Readable<T>` imports from *.type.ts files
  └─ Spike 009 codemod's destructure-trap audit pass — fix AdminNav + audit context spreads
```

## Investigation Trail

- **2026-05-22** — Grep for `from 'svelte/store'` in `apps/frontend/src/lib/contexts/`
  returned 18 files. Categorized each by store-usage shape and dependency
  relation. Selected `popupStore` as the representative for the secondary-bridge
  pattern (small, isolated, similar to Spike 001 value-replace but with the
  added `push`/`shift` mutator API).
- **2026-05-22** — Built `popupRuneStore` + demo page at `/runes-test/popup-rune`.
  Browser verification clean — push/shift/current reactivity works as
  expected; no console errors. Confirmed `find` ref staleness can cause
  click failures across navigation — workaround is to re-`find` after navigate,
  or invoke `.click()` via `javascript_tool` directly.

## Results

**Verdict:** VALIDATED ✓

**Findings:**

1. **18 files in `lib/contexts/`** currently import from `svelte/store`. Spikes
   001-006 cover ~7 of them; this spike enumerates the remaining ~11.
2. **Secondary-bridge pattern (popupStore) confirmed** — drops `toStore`, exposes
   `get current()`, push/shift/current all reactive end-to-end.
3. **Migration is wave-orderable** — Wave 1 (leaf contexts) can run in parallel
   per Phase #007 spike infra; Waves 2-4 depend on Wave 1.
4. **`app/getRoute.svelte.ts` deserves separate scrutiny** — its file header
   (lines 18-30) documents a `toStore` short-circuit workaround. Migrating
   it without understanding that workaround risks regression.

**Signal for the real migration:**

- The roadmap should include phases for **Wave 2** files (survey, trackingService,
  voterContext, candidateContext, getRoute) AFTER the appSettings/dataRoot
  migration lands. They're not strictly blockers for Wave 1 but their full
  cleanup requires Wave 1 to be done first.
- `app/getRoute.svelte.ts` should be its own phase or carry a callout —
  the file's own internal documentation reveals a Svelte-5 `toStore`
  short-circuit issue that the migration must either solve or document.
- The `runeLocalStorage` helper from Spike 003 needs a `runeSessionStorage`
  sibling for `voterContext`'s `firstQuestionId` use case.

## Source Files

- `apps/frontend/src/routes/runes-test/popup-rune/popupRuneStore.svelte.ts`
- `apps/frontend/src/routes/runes-test/popup-rune/+page.svelte`
