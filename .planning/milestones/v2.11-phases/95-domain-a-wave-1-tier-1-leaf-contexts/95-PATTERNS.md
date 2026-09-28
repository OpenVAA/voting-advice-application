# Phase 95: Domain A Wave 1 — Tier-1 Leaf Contexts - Pattern Map

**Mapped:** 2026-06-04
**Files analyzed:** 9 modified + 1 new symbol
**Analogs found:** 10 / 10 (every shape has a browser-verified `runes-test/` reference)

> This is a **port-and-rename** phase, not a design phase. Each modified production file has an exact `runes-test/**` analog that was browser-verified by spikes 001–010. The planner's job per file is: port the analog's rune internals into the **original file + symbol names** (K1), keep the exported store-shaped surface alive via a temporary bridge where consumers aren't yet migrated (Wave 3), and keep the unit + E2E suites green.
>
> **K1 naming constraint (NON-NEGOTIABLE):** the new helper ships as `localStorageState` — NOT `runeLocalStorage` (that is the spike-scratch name). All replacements keep their original file + symbol names; no `rune…`/`…Native` suffixes. The only genuinely new symbol is `localStorageState`.
>
> **Wave-1 boundary:** `StackedState.svelte.ts`, `persistedState.svelte.ts`'s `localStorageWritable`/`sessionStorageWritable`, and `Readable<T>` in `.type.ts` are NOT deleted here — that is Phase 98 (CLEAN-01). Consumers stay working via temp bridges.

## File Classification

| Modified/New File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `lib/contexts/utils/persistedState.svelte.ts` (+`localStorageState`) | persistence helper | file-I/O (localStorage) | `runes-test/contexts/runePersistedState.svelte.ts` | exact (rename only) |
| `lib/contexts/voter/answerStore.svelte.ts` | producer context | CRUD + persist | `runes-test/contexts/voterAnswerRuneStore.svelte.ts` | exact |
| `lib/contexts/candidate/candidateUserDataStore.svelte.ts` | producer context | CRUD + persist | `runes-test/contexts/candidateAnswerRuneStore.svelte.ts` + voter analog | exact |
| `lib/contexts/app/popup/popupStore.svelte.ts` | producer context | event-driven (queue) | `runes-test/popup-rune/popupRuneStore.svelte.ts` | exact |
| `lib/contexts/data/dataContext.svelte.ts` | producer context | reactive singleton | `runes-test/contexts/dataRootRuneContext.svelte.ts` | exact |
| `lib/contexts/app/appContext.svelte.ts` | producer context (consumer-facing bridge) | request-response (SSR merge) | `runes-test/ssr-hydration/appSettingsVariantB.svelte.ts` | role-match (subset; bridges kept) |
| `lib/utils/settings.ts` (`mergeAppSettings`) | util | transform | `appSettingsVariantB.svelte.ts:24-27` (`pureMerge`) | exact |
| `lib/contexts/utils/StackedState.svelte.ts` (+`SettingsOverlay`) | persistence helper / registry | event-driven (overlay registry) | `runes-test/layout-overlay/SettingsOverlay.svelte.ts` | exact (new file/symbol alongside) |
| `lib/contexts/layout/layoutContext.svelte.ts` | producer context (consumer-facing) | event-driven | `runes-test/layout-overlay/layoutSettingsRune.svelte.ts` | exact |

## Pattern Assignments

### `lib/contexts/utils/persistedState.svelte.ts` — ADD `localStorageState` (CTX-03 helper)

**Analog:** `runes-test/contexts/runePersistedState.svelte.ts` (the proven `runeLocalStorage` body — rename to `localStorageState` per D-02/K1)

**Current bridge core to replace at callsites** (`persistedState.svelte.ts:62-79`) — `$state → toStore → store.subscribe` 3-layer:
```typescript
function storageWritable<TValue>(type, key, defaultValue): Writable<TValue> {
  const stored = getItemFromStorage<TValue>(type, key);
  let value = $state<TValue>(stored ?? defaultValue);
  const store = toStore(() => value, (v) => { value = v; });
  store.subscribe((v) => saveItemToStorage(type, key, v));
  return store;
}
```

**Target rune shape** (port from `runePersistedState.svelte.ts:39-59`, returns `{ current, set, update }`):
```typescript
export function localStorageState<TValue>(key: string, defaultValue: TValue): { readonly current: TValue; set; update } {
  const initial = getItemFromStorage<TValue>('localStorage', key) ?? defaultValue;
  let value = $state<TValue>(initial);
  return {
    get current() { return value; },
    set(v) { value = v; saveItemToStorage('localStorage', key, v); },
    update(fn) { value = fn(value); saveItemToStorage('localStorage', key, value); }
  };
}
```

**CRITICAL — do NOT re-implement versioning.** The analog inlines `readVersioned`/`writeVersioned`; in production **REUSE the existing `getItemFromStorage`/`saveItemToStorage`/`getStorage`** helpers (`persistedState.svelte.ts:86-148`) which already do versioned `{version,data}` payload + `requireUserDataVersion` expiry + `browser` gate. Discretion (D): structure so Phase 96's `sessionStorageState` shares the versioned core (parametrize on `StorageType`).

**KEEP** `localStorageWritable` (`:29-31`) and `sessionStorageWritable` (`:43-45`) — `appContext.userPreferences` + survey/tracking still consume them; deletion is Phase 98.

---

### `lib/contexts/voter/answerStore.svelte.ts` (CTX-03 voter)

**Analog:** `runes-test/contexts/voterAnswerRuneStore.svelte.ts` (exact — but RE-ADD the `startEvent` tracking hook the spike intentionally omitted)

**Current 3-layer bridge** (`answerStore.svelte.ts:1,4,16-17,50-52`):
```typescript
import { fromStore } from 'svelte/store';
import { localStorageWritable } from '../utils/persistedState.svelte';
const store = localStorageWritable('VoterContext-answerStore', Object.freeze({}) as Frozen<Answers>);
const storeState = fromStore(store);
// ...
get answers() { return storeState.current; }
```

**Target** (port from `voterAnswerRuneStore.svelte.ts:18,31,58-60`):
```typescript
import { localStorageState } from '../utils/persistedState.svelte';   // drop fromStore import
const store = localStorageState('VoterContext-answerStore', Object.freeze({}) as Frozen<Answers>);
// ...
get answers() { return store.current; }
```
`store.update(...)`/`store.set(...)` map 1:1. **KEEP** the `JSON.parse(JSON.stringify(...))` clone (`:23`) + `deepFreeze` (L-4). **KEEP** production's `startEvent('answer'|'answer_delete'|'answer_resetAll', ...)` calls (`:26,29,45`) — the spike dropped them; production must retain. `svelte/store` import fully removable here.

**Wave 0:** no unit test exists; add `answerStore.svelte.test.ts` (set/delete/reset/persist round-trip).

---

### `lib/contexts/candidate/candidateUserDataStore.svelte.ts` (CTX-03 candidate)

**Analog:** `runes-test/contexts/candidateAnswerRuneStore.svelte.ts`

**Current 3-layer bridge** (`candidateUserDataStore.svelte.ts:2-3,38-42,57`):
```typescript
import { fromStore } from 'svelte/store';
import { localStorageWritable } from '../utils/persistedState.svelte';
const _editedAnswersStore = localStorageWritable('CandidateContext-candidateUserDataStore-editedAnswers', {} as LocalizedAnswers);
const editedAnswersState = fromStore(_editedAnswersStore);
// in _current $derived.by:  const editedAnswers = editedAnswersState.current;
```

**Target:** single `const _editedAnswersStore = localStorageState('CandidateContext-...-editedAnswers', {} as LocalizedAnswers);` Replace every `editedAnswersState.current` read (`:57`, `:117-120`, `:200`) with `_editedAnswersStore.current`; `.update(...)`/`.set(...)` (`:151-166`) map 1:1. **KEEP** the JSON clone (`:67`, L-4). The `$state` fields (`savedData`, `editedImage`, `editedTermsOfUseAccepted`) + `answersLocked` `$effect` (`:51-53`) are already rune — unchanged. Getter public surface (`.current`, `.hasUnsaved`) unchanged → no consumer bridge.

**Existing test:** `candidateUserDataStore.svelte.test.ts` (4 `save()` tests) MUST stay green — verify storage gating under vitest `browser=false` returns the default.

---

### `lib/contexts/app/popup/popupStore.svelte.ts` (CTX-05)

**Analog:** `runes-test/popup-rune/popupRuneStore.svelte.ts` (exact — `queue`/`firstItem`/`push`/`shift` already identical)

**Current** (`popupStore.svelte.ts:1,21-23`):
```typescript
import { toStore } from 'svelte/store';
const store = toStore(() => firstItem as PopupQueueItem | undefined);
return { push, shift, subscribe: store.subscribe };
```

**Target** (Pattern 1, `popupRuneStore.svelte.ts:45-51`): `return { push, shift, get current() { return firstItem; } };` — drop the `toStore` import.

**`popupStore.type.ts`** (`:1,8`): `Readable<PopupQueueItem | undefined> & {push,shift}` → `{ readonly current; push; shift }`.

**Consumer migration (in-plan, recommended O-3):** `routes/+layout.svelte:69` `const popupQueueState = fromStore(popupQueue);` → DELETE; `:230` `popupQueueState.current` → `popupQueue.current`. `appContext.svelte.ts:131,167,184` uses `popupQueue.push` — unchanged.

**Wave 0:** add a popupStore unit test (push/shift/current).

---

### `lib/contexts/data/dataContext.svelte.ts` (CTX-02)

**Analog:** `runes-test/contexts/dataRootRuneContext.svelte.ts` (current/instance split + version counter, no `writable`)

**Current `writable` bridge + workaround** (`dataContext.svelte.ts:4,49-64`):
```typescript
import { writable } from 'svelte/store';
const dataRootStore: Readable<DataRoot> = writable(dataRoot);   // :49 — drop internal justification
dataRoot.subscribe(() => { version++; (dataRootStore as {...}).set(dataRoot); });  // :52-55
const reactiveDataRoot = { get current() { void version; return dataRoot; } };     // :59-64
```

**Target** (Pattern 2 + 3, `dataRootRuneContext.svelte.ts:65-79`): drop the internal `get(dataRootStore)` infinite-loop justification; add the **`instance`** handle (`get instance() { return dataRoot; }` — no `version` read) alongside `current`. Use `untrack()` around any producer write-after-read in `provide*` effects.

**Wave-1 bridge obligation (KEEP):** `dataRoot` is read as `$dataRoot` in **23 files** (un-migrated until Wave 3) → KEEP a `dataRoot` Readable surface (the imperative `.set` from the `subscribe` callback, `:54`) until Wave 3. The `version++` stays. `reactiveDataRoot.current` is already consumed — preserve. `dataContext.type.ts:2` `import type { Readable }` stays (Phase 98); add `instance` to the `reactiveDataRoot` type if exposed.

---

### `lib/contexts/app/appContext.svelte.ts` (CTX-01) — heaviest internal change, most bridges kept

**Analog:** `runes-test/ssr-hydration/appSettingsVariantB.svelte.ts` (Pattern 7 — synchronous SSR-aware `$state` init)

**Current SSR-gap `$effect`** (`appContext.svelte.ts:74,93-100`) — merges DB override ONLY in `$effect` (client-only) → SSR flash:
```typescript
let appSettingsValue = $state<AppSettings>(mergeAppSettings(staticSettings, dynamicSettings));
let prevAppSettingsData: DynamicSettings | Error | undefined;
$effect(() => {
  const data = page.data?.appSettingsData as DynamicSettings | Error | undefined;
  if (data === prevAppSettingsData) return;          // ← reference-equality guard (L-3, load-bearing)
  prevAppSettingsData = data;
  if (!data || data instanceof Error) return;
  appSettingsValue = mergeAppSettings(appSettingsValue, data);
});
```

**Target — fold DB override into `$state` init** (port `appSettingsVariantB.svelte.ts:48-71`):
```typescript
const initialDbData = page.data?.appSettingsData as DynamicSettings | Error | undefined;
let initial = mergeAppSettings(staticSettings, dynamicSettings);
if (initialDbData && !(initialDbData instanceof Error)) initial = mergeAppSettings(initial, initialDbData);
let appSettingsValue = $state<AppSettings>(initial);
let prevAppSettingsData: DynamicSettings | Error | undefined = initialDbData;  // ← init guard to init-time value
$effect(() => { /* same guard; handles post-NAV changes only */ });
```
Apply the **identical** D-04 fix to `appCustomization` (`:102-118`, guard `prevAppCustomizationData`). **D-04 explicit check:** add an SSR/E2E assertion that server-rendered HTML carries the DB override (no post-hydration default→override flash); model on variantB's `effectFired`/`initialMergeIncludedDbOverride` instrumentation.

**Wave-1 bridge obligation (KEEP — ~60 consumers):** the exported `appSettings`/`appCustomization`/`appType`/`locale`/`locales`/`darkMode`/`getRoute`/`userPreferences`/`openFeedbackModal`/`popupQueue`/`surveyLink` are read via `$store.X` auto-subscribe + `fromStore` (un-migrated until Wave 3). KEEP the `toStore(...)` exported bridges (`:75-80,103-108,135-140`). Migrate only INTERNAL `$state` + SSR merge + pure `mergeAppSettings`.

**O-2 (keep `userPreferences` on `localStorageWritable`):** `:121` stays `localStorageWritable` — it's exported as `Writable` and consumed via `.update()` + `fromStore(userPreferences)` (`:157`); the Writable surface is load-bearing until Phase 98.

**L-5 spread-of-context:** do NOT introduce new spreads of reactive getters; keep explicit store-wrapped overrides AFTER the `...componentCtx`/`...dataCtx`/`...tracking` spreads (current order at `:212-235`).

---

### `lib/utils/settings.ts` — `mergeAppSettings` purity (CTX-01 / D-05)

**Analog:** `appSettingsVariantB.svelte.ts:24-27` (`pureMerge`)

**Current bug** (`settings.ts:16-19`) — mutates shared `staticSettings` module ref:
```typescript
const nonNull = Object.fromEntries(Object.entries(additional).filter(([, v]) => v != null)) as ...;
return Object.assign(target, nonNull);     // ← :19 MUTATES target
```
**Target:** `return { ...target, ...nonNull };` (Pattern 8). No `svelte/store` here; pure-function change only.

**Wave 0:** add `lib/utils/settings.test.ts` asserting `target` is not mutated.

---

### `lib/contexts/utils/StackedState.svelte.ts` + `lib/contexts/layout/layoutContext.svelte.ts` (CTX-04) — biggest plan, see O-1

**Analogs:** `runes-test/layout-overlay/SettingsOverlay.svelte.ts` (registry + `untrack`) + `layoutSettingsRune.svelte.ts` (`init/get` + `use*()` API)

**Registry shape to introduce** (port `SettingsOverlay.svelte.ts:62-113`, Pattern 5/6 + Pattern 3 `untrack`):
```typescript
export function settingsOverlay<TMerged, TOverlay>(base, merge): SettingsOverlayApi<...> {
  let slots = $state<Array<{id; overlay}>>([]);
  const current = $derived(slots.reduce((acc, s) => merge(acc, s.overlay), base));
  function push(overlay) {
    const id = ++nextId;
    untrack(() => { slots = [...slots, { id, overlay }]; });   // ← L-2: untrack the write-after-read
    let reverted = false;
    return () => { if (reverted) return; reverted = true; untrack(() => { slots = slots.filter(s => s.id !== id); }); };
  }
  function use(overlay) { $effect(() => push(overlay)); }      // ← $effect cleanup replaces onDestroy
  return { get current() { return current; }, push, use, get size() { return slots.length; } };
}
```
**Use `mergeSettings` from `@openvaa/app-shared`** (associative — L-6; do NOT swap a custom merge).

**layoutContext target** (port `layoutSettingsRune.svelte.ts:82-114`): replace the three `new StackedState(...)` (`layoutContext.svelte.ts:54-67`) with `settingsOverlay(...)`; replace `getLayoutContext(onDestroy)` index-revert (`:169-181`) with `use*()` declarative API. `layoutContext.type.ts:4,10,15,28` `StackedState<...>` → `SettingsOverlayApi<...>`.

**O-1 (planner decision):** 19 callsites of `getLayoutContext(onDestroy)` live in `routes/**` (OUTSIDE the Wave-3 `$store.X` codemod). Research recommends **option (a): migrate all 19 in-plan** (spike-intended end state) — read `.current` + call `use*()`. This makes CTX-04 the heaviest plan and possibly NOT parallel with the others (churns `Layout.svelte`/`Header.svelte`/`MainContent.svelte`). 19 callsites: `routes/Layout.svelte:40`, `Header.svelte:41`, `MainContent.svelte:53`, `(voters)/+layout`/`+page`/`about|info|privacy/+page`, `questions/+layout`, `questions/category/[categoryId]/+page`, `candidate/**` (`+layout`,`preview`,`profile`,`settings`,`questions/+layout`), `admin/+layout`, `admin/login/+page`, `Banner.svelte`, nav (`AdminNav`/`CandidateNav`/`VoterNav`/`NavItem`).

**DO NOT delete `StackedState.svelte.ts`** in Wave 1 (Phase 98). If registry replaces it in `layoutContext`, add equivalent `SettingsOverlay` registry tests (out-of-order mount/unmount + cleanup); else `StackedState.svelte.test.ts` 9 tests stay green untouched.

## Shared Patterns

### `untrack()` write-after-read (Pattern 3 / L-2)
**Source:** `runes-test/layout-overlay/SettingsOverlay.svelte.ts:86-96` + `runes-test/contexts/dataRootRuneContext.svelte.ts`
**Apply to:** CTX-02 (dataRoot version producer) + CTX-04 (overlay push/revert). `import { untrack } from 'svelte';` (permitted; only `svelte/store` is banned). Omitting it → `effect_update_depth_exceeded` AND silently breaks the global effect scheduler.

### Reactive getter exposure (Pattern 1)
**Source:** `runes-test/popup-rune/popupRuneStore.svelte.ts:45-51`
**Apply to:** popupStore `.current`, appSettings internal value, dataRoot `reactiveDataRoot.current`, `localStorageState.current`.

### Reference-equality guard (L-3, load-bearing)
**Source:** `appContext.svelte.ts:93-100` (preserve) — `if (data === prevAppSettingsData) return;`
**Apply to:** appContext appSettings + appCustomization `$effect`s. Init `prevData` to the init-time DB value (variantB pattern). Without it, every nav recreates `AppSettings` → cascades to `filterStore`/`FilterGroup` rebuild (Phase 64 regression).

### JSON-clone, never `structuredClone` (L-4)
**Source:** `answerStore.svelte.ts:23`, `candidateUserDataStore.svelte.ts:67`
**Apply to:** both answer stores. `$state` proxies are not structurally cloneable — KEEP `JSON.parse(JSON.stringify(...))`.

### Temporary store-shaped bridge on exported surface (the central Wave-1 constraint)
**Apply to:** appContext (`toStore` bridges on ~11 exported props) + dataContext (`dataRoot` Readable bridge). These stay until Wave 3 / Phase 97. Internals become pure runes; the EXPORTED property keeps a store shape.

### Destructure trap — PRESERVE, do NOT fix (L-7)
**Source:** CLAUDE.md "Context Destructuring Rule"
**Apply to:** all consumers — leave `ctx.X` via `$derived` reads as-is. Consumer migration is Wave 3.

## No Analog Found

None — every modified surface has a browser-verified `runes-test/**` reference. The only net-new code is the `localStorageState` symbol (renamed analog) and the kept exported store-shaped bridges (mechanical, not invented).

## Metadata

**Analog search scope:** `apps/frontend/src/routes/runes-test/{contexts,ssr-hydration,layout-overlay,popup-rune}/` + current `apps/frontend/src/lib/contexts/**` + `lib/utils/settings.ts`
**Files scanned:** 9 production + 6 reference impls (all read this session, no re-reads)
**Pattern extraction date:** 2026-06-04

## PATTERN MAPPING COMPLETE
