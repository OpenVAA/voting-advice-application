# Migration Inventory & Order (4 Waves)

Complete inventory of `svelte/store` bridges in
`apps/frontend/src/lib/contexts/**` (18 files) and the dependency-respecting
order to migrate them. Also covers the secondary-bridge pattern (popupStore)
that generalizes [[reactive-contexts]] Pattern 1 to queue-shaped stores.

## Requirements

- **Wave ordering must respect dependency direction** — Tier 2 contexts
  consume Tier 1 outputs (`fromStore(appSettings)`, `fromStore(locale)`,
  `fromStore(getRoute)`, etc.), so Wave 1 ships first.
- **Each leaf-context migration is independent** within Wave 1 — they can
  ship in parallel PRs.
- **`runeLocalStorage` (Spike 003) needs a `runeSessionStorage` sibling** —
  required by `voterContext`'s `firstQuestionId` session-storage use case.
  Add this in Wave 2's prep step.
- **`app/getRoute.svelte.ts` deserves separate scrutiny** — its file header
  documents a `toStore` short-circuit workaround. Migrating without
  understanding the workaround risks regression.
- **popupStore migration follows the value-replace pattern** ([[reactive-contexts]]
  Pattern 1) generalized to push/shift queue stores.

## How to Build It

### Inventory — 18 files importing from `svelte/store`

#### Tier 1 — Leaf contexts (each independently spiked)

| File | Bridge mechanism | Spike | Reference |
|------|------------------|-------|-----------|
| `app/appContext.svelte.ts` | `toStore(() => $state)` for appType, appSettings, appCustomization, darkMode, locale, idTokenClaims | 001 + 008 | [[reactive-contexts]] Pattern 1 (SSR-aware) |
| `data/dataContext.svelte.ts` | `writable(dataRoot)` + `get(dataRootStore)` workaround | 002 | [[reactive-contexts]] Pattern 2 |
| `voter/answerStore.svelte.ts` | `localStorageWritable + fromStore` | 003 | [[persistent-rune-stores]] |
| `candidate/candidateUserDataStore.svelte.ts` | `localStorageWritable + fromStore` for edited answers | 005 | [[persistent-rune-stores]] |
| `app/popup/popupStore.svelte.ts` | `toStore(() => firstItem)` + `subscribe` getter | 010 | this file (below) |
| `utils/persistedState.svelte.ts` | (deletable after 003+005 land) | 003+005 | [[persistent-rune-stores]] |
| `utils/StackedState.svelte.ts` | (deletable after 006 lands) | 006 | [[layout-overlay-registry]] |

#### Tier 2 — Secondary bridges (consume Tier 1)

| File | Bridge mechanism | Migration shape |
|------|------------------|-----------------|
| `app/getRoute.svelte.ts` | `writable(routeFn)` + custom `afterNavigate` workaround | Read file header — documents the `toStore` short-circuit. Once appSettings + page are rune-native, simplify to `$derived(buildRoute(page, locale))` |
| `app/survey.svelte.ts` | `fromStore(appSettings) + fromStore(sessionId)` + `toStore(() => linkValue)` | Drop both `fromStore`s once Tier 1 done; drop `toStore` return; expose `{ get current() { return linkValue; } }` |
| `app/tracking/trackingService.svelte.ts` | `fromStore(appSettings) + fromStore(userPreferences) + fromStore(sessionId)` + `toStore(...)` | Drop all `fromStore`; drop `toStore` wrappers; expose `.current` getters |
| `voter/voterContext.svelte.ts` | `fromStore(appSettings) + fromStore(locale)` + `sessionStorageWritable('voterContext-firstQuestionId') + fromStore(...)` | See [[context-orchestration]]. Add `runeSessionStorage` for `firstQuestionId` |
| `candidate/candidateContext.svelte.ts` | `fromStore(appSettings) + fromStore(locale) + fromStore(getRoute)` | See [[context-orchestration]] (same factory shape applies) |
| `utils/dataCollectionStore.ts` | Accepts `Readable<DataRoot>` + `Readable<Array<Id>>`, returns `Readable<Array<TObject>>` | Update signature to accept rune-context handles and return `{ get current() }` |

#### Tier 3 — Type files (delete or update last)

| File | Status |
|------|--------|
| `app/appContext.type.ts` | Drop `Readable<T>` imports once context exposes `.current` |
| `app/popup/popupStore.type.ts` | Change `PopupStore = Readable<...> & { push, shift }` to a plain interface |
| `app/tracking/trackingService.type.ts` | Drop `Readable<T>` aliases |
| `data/dataContext.type.ts` | Drop `Readable<DataRoot>` |

#### Outside `lib/contexts/`

| File | Issue |
|------|-------|
| `routes/+layout.svelte:69` | `const popupQueueState = fromStore(popupQueue)` — line 230 becomes `{#if popupQueue.current}` after popupStore migration |
| `lib/components/video/component-stores.ts` | Standalone — investigate during Tier 2 phase |
| `lib/dynamic-components/entityList/EntityListWithControls.svelte` | Consumer site — picked up by [[consumer-migration-codemod]] |

### 4-wave migration order

```
Wave 1 (parallel — all Tier 1 leaf contexts):
  ┌─ app/appContext.svelte.ts       ([[reactive-contexts]] Pattern 1, SSR-aware)
  ├─ data/dataContext.svelte.ts     ([[reactive-contexts]] Pattern 2)
  ├─ voter/answerStore.svelte.ts    ([[persistent-rune-stores]])
  ├─ candidate/candidateUserDataStore.svelte.ts  (7-line edited-answers diff)
  ├─ utils/StackedState → settingsOverlay + layout/layoutContext  ([[layout-overlay-registry]])
  └─ app/popup/popupStore.svelte.ts                              (this file)

Wave 2 (Tier 2 — consumes Wave 1):
  ┌─ Add `runeSessionStorage` sibling of `runeLocalStorage`
  ├─ app/survey.svelte.ts           (consumer of appSettings + sessionId)
  ├─ app/tracking/trackingService   (consumer of appSettings + userPreferences)
  ├─ voter/voterContext             (consumer of appSettings + locale + sessionStorageWritable)
  └─ candidate/candidateContext     (consumer of appSettings + locale + getRoute)

Wave 3 (post-Tier 2 + consumer migration):
  ├─ app/getRoute.svelte.ts         (own custom workaround — needs care)
  ├─ utils/dataCollectionStore.ts   (generic Readable<T> consumer)
  └─ Run [[consumer-migration-codemod]] on all 179 .svelte files (146 sites)

Wave 4 (cleanup):
  ├─ Delete utils/persistedState.svelte.ts (zero callers)
  ├─ Delete utils/StackedState.svelte.ts   (zero callers)
  ├─ Drop `Readable<T>` imports from *.type.ts files
  ├─ Fix AdminNav + audit context spreads ([[consumer-migration-codemod]] Pass 2 finding)
  └─ Optional: graduate the codemod into a custom ESLint rule
```

### popupStore representative pattern

The migration shape generalizes [[reactive-contexts]] Pattern 1
(value-replace context) to push/shift queue stores.

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

**Migration shape** (verified in Spike 010 at `/runes-test/popup-rune`):

```ts
// zero svelte/store imports

export function popupStore(): PopupStore {
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

**Consumer migration** (`apps/frontend/src/routes/+layout.svelte:69+230`):

```diff
- const popupQueueState = fromStore(popupQueue);
- {#if popupQueueState.current}
+ // (delete the fromStore line entirely)
+ {#if popupQueue.current}
```

Verified push/shift/current sequence in the browser:

| Action | popup.current | queue depth |
|--------|---------------|-------------|
| push("Survey") | {name:"Survey"} | 1 |
| push("Feedback") + push("Onboarding") | {name:"Survey"} | 3 |
| shift() | {name:"Feedback"} | 2 |
| shift() again | {name:"Onboarding"} | 1 |

## What to Avoid

1. **Don't ship Wave 2 before Wave 1.** Tier 2 contexts use
   `fromStore(appSettings)`, `fromStore(locale)`, `fromStore(getRoute)`. If
   the upstream isn't rune-native yet, the migration removes a working
   bridge with nothing to replace it.

2. **Don't migrate `app/getRoute.svelte.ts` without reading its file header
   (lines 18-30).** The author documents a Svelte-5 `toStore` short-circuit
   they were working around. The migration must either solve the original
   problem or document why it no longer applies.

3. **Don't forget the `runeSessionStorage` sibling.** `voterContext` uses
   `sessionStorageWritable('voterContext-firstQuestionId')`. The Spike 003
   `runeLocalStorage` helper covers localStorage only; Wave 2 needs the
   session counterpart before voterContext can fully migrate.

4. **Don't delete `persistedState.svelte.ts` or `StackedState.svelte.ts`
   before Wave 3 completes.** Their last callers are mid-Wave-2 / Wave-3.
   Premature deletion breaks builds.

5. **Don't run [[consumer-migration-codemod]] with `--apply` during Wave 1.**
   The script rewrites consumers to `appSettings.current.X` — that
   property doesn't exist until Wave 1 ships. Run the codemod in Wave 3,
   after every store handle exposes `.current`.

## Constraints

- **18 files in `lib/contexts/`** import from `svelte/store` as of May 2026.
  Spikes 001-006 cover ~7 of them; Spike 010 enumerates the remaining ~11.
- **`runeSessionStorage` is a new addition required for Wave 2** — its
  signature mirrors `runeLocalStorage` but reads/writes
  `sessionStorage` instead. Add it to `utils/runePersistedState.svelte.ts`
  alongside the existing helper.
- **Wave 1 leaf migrations are non-blocking on each other** — different
  files, different reviewers, can ship as 6 separate PRs. Don't combine
  unless a reviewer asks.
- **The `find` action on the rune-test pages can stale across navigation**
  during browser-driven verification. Re-`find` after each navigate, or
  invoke `.click()` via `javascript_tool` directly. (Pure browser-automation
  hygiene, not a migration concern.)

## Related

- [[reactive-contexts]] — Wave 1 leaf-context patterns (appSettings, dataRoot)
- [[persistent-rune-stores]] — Wave 1 answer-store patterns + `runeLocalStorage`
- [[layout-overlay-registry]] — Wave 1 StackedState replacement
- [[context-orchestration]] — Wave 2 voterContext / candidateContext shape
- [[consumer-migration-codemod]] — Wave 3 mechanical consumer rewrite
- [[matching-integration]] — zero-diff (already rune-native)

## Origin

Synthesized from spike: 010

Source files available in:
- `sources/010-adjacent-store-bridges/popupRuneStore.svelte.ts` — representative spike
- `sources/010-adjacent-store-bridges/page.svelte` — browser-verified demo harness
- `sources/010-adjacent-store-bridges/README.md` — full Tier 1/2/3 inventory + investigation trail
