# Phase 96: Domain A Wave 2 — Tier-2 Bridges - Pattern Map

**Mapped:** 2026-06-04
**Files analyzed:** 5 (1 add-to + 4 modify) plus 1 seam-modify (appContext) + test files
**Analogs found:** 5 / 5 (all strong; every target file has a shipped Wave-1 precedent or in-file sibling)

> **Port-and-rename phase.** Every "new" pattern is an in-repo sibling. The analogs are the
> SAME files being modified (their pre-migration shape) plus the Wave-1 `localStorageState`
> sibling and the appContext bridge seam. Excerpts below are the load-bearing lines.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `contexts/utils/persistedState.svelte.ts` (ADD `sessionStorageState`) | utility (persistence) | file-I/O (sessionStorage) | `localStorageState` + `storageState` core, **same file** `:75,91` | exact (sibling export) |
| `contexts/app/survey.svelte.ts` (MODIFY) | provider (derived value) | transform / request-response | itself pre-migration + Pattern-1 `.current` reads | exact |
| `contexts/app/tracking/trackingService.svelte.ts` (MODIFY) | service | event-driven | itself pre-migration; survey for `.current` shape | exact |
| `contexts/voter/voterContext.svelte.ts` (MODIFY) | provider (orchestrator factory) | event-driven / CRUD | itself pre-migration; `localStorageState` swap precedent | exact |
| `contexts/candidate/candidateContext.svelte.ts` (MODIFY) | provider (orchestrator factory) | event-driven / CRUD | `voterContext` (sibling orchestrator) + itself pre-migration | exact |
| `contexts/app/appContext.svelte.ts` (MODIFY — seam, optional per Q3) | provider (bridge seam) | request-response | `:148-150,233-256` existing `toStore` bridges | exact |
| `persistedState.svelte.test.ts` (ADD session cases) | test | — | existing `localStorageState` cases in same file | exact |
| `survey.svelte.test.ts` / `trackingService.svelte.test.ts` (NEW) | test | — | sibling context unit tests | role-match |

## Critical Delta Found During Mapping — READ BEFORE PLANNING

**The research's Pattern-2 premise is partly inaccurate for THIS phase.** Research §Architecture
Pattern 2 says voter/candidate read `appSettings.current` / `locale.current` as "Tier-1 `.current`
getters (post-Wave-1)". But the shipped appContext (`appContext.svelte.ts:85`) **still exports
`appSettings` as `toStore(() => appSettingsValue, ...)` — a `Readable`, NOT a `.current` getter**.
There is no `reactiveAppSettings` accessor; grep for `appSettings.current` / `reactiveAppSettings`
in appContext returns nothing. `locale` is similarly `toStore`-shaped (`localeStore` at `:239`).

The ONLY Tier-1 input already exposed as a `.current` rune-getter is `reactiveDataRoot`
(consumed today as `reactiveDataRoot.current` in `voterContext.svelte.ts:56,98` — no `fromStore`).

**Implication for the planner (lock this — it is the central scope decision):**
- Either (i) keep `fromStore(appSettings)` / `fromStore(locale)` in the orchestrators this phase
  (then CTX-07's literal "drop `fromStore(appSettings)`/`fromStore(locale)`" is NOT met until
  appContext also exposes `.current` getters — appContext change becomes in-scope), OR
- (ii) add `.current`-shaped getters to appContext for `appSettings`/`locale` in THIS phase so
  the orchestrators can read them runed (a small, additive appContext change — the `toStore`
  exports stay for un-migrated consumers; a parallel `get appSettings()`-style accessor is added).

Research Open Q2 already flags `fromStore(getRoute)` must STAY (getRoute is Phase 97). The same
`fromStore`-still-needed reality applies to `appSettings`/`locale` unless appContext is touched.
**Spike-007's `getAppContext().appSettings` being a `.current` getter is a FUTURE-state assumption,
not the shipped Wave-1 state.** Resolve before writing Plan B actions.

## Pattern Assignments

### `contexts/utils/persistedState.svelte.ts` — ADD `sessionStorageState` (CTX-07)

**Analog:** `localStorageState` (`:75-77`) + private `storageState` core (`:91-108`), same file.

**Sibling export to copy verbatim** (mirror `localStorageState:75`):
```ts
export function sessionStorageState<TValue>(key: string, defaultValue: TValue): PersistedState<TValue> {
  return storageState('sessionStorage', key, defaultValue);
}
```
The core already branches `type` (`storageState:91`), and `getItemFromStorage:162` /
`saveItemToStorage:189` / `getStorage:202` already special-case `sessionStorage` (raw,
non-versioned payload; `undefined→null` on save; `browser` gate returns `null` on SSR).
**No core changes.** Reuse `PersistedState<TValue>` interface (`:52-59`): `{ current, set, update }`.

**Session vs local payload contract (Pitfall 2, verified):** session reads are NOT version-wrapped
(`getItemFromStorage:176-178` `else` branch returns `savedValue as TValue`); SSR returns default
(`getStorage:202-203`). This matches legacy `sessionStorageWritable` semantics exactly.

---

### `contexts/app/survey.svelte.ts` (provider, transform) — CTX-06

**Analog:** itself, pre-migration (24 lines, read in full).

**BEFORE (`:1,15-16,18-23`):**
```ts
import { fromStore, toStore } from 'svelte/store';
const appSettingsReactive = fromStore(appSettings);
const sessionIdReactive = fromStore(sessionId);
const linkValue = $derived.by(() => {
  const linkTemplate = appSettingsReactive.current.survey?.linkTemplate;
  return linkTemplate ? linkTemplate.replace(/\{\s*sessionId\s*\}/, sessionIdReactive.current ?? '') : undefined;
});
return toStore(() => linkValue);
```

**Migration:** drop `fromStore` over the inputs; read inputs via `.current` getters (inputs become
rune handles — `sessionId` from trackingService's `.current`, `appSettings` per the appContext-seam
decision above). Keep the `$derived.by` body verbatim. **Producer must NOT keep `toStore`** to
satisfy CTX-06's literal "no `toStore` in survey/trackingService" — move the store-shaped wrap to
the appContext seam (Pitfall 1 option (b); see appContext seam below). `survey.type` keeps
`Readable<string|undefined>` until Phase 98.

---

### `contexts/app/tracking/trackingService.svelte.ts` (service, event-driven) — CTX-06

**Analog:** itself, pre-migration (132 lines, read in full).

**`fromStore`/`toStore` sites to migrate** (`:1,46-62`):
```ts
const sessionId = sessionStorageWritable('appContext-sessionId', getUUID());      // :43 — see note
const sendTrackingEvent = toStore(() => sendTrackingEventValue, (v) => {...});    // :46-51
const appSettingsReactive = fromStore(appSettings);                               // :53
const userPrefsReactive = fromStore(userPreferences);                             // :54
const shouldTrackValue = $derived(browser && appSettingsReactive.current... );    // :55-59
const shouldTrack = toStore(() => shouldTrackValue);                              // :60
const sessionIdReactive = fromStore(sessionId);                                   // :62
```
**Migration:** drop `fromStore(appSettings)`/`fromStore(userPreferences)`/`fromStore(sessionId)`;
read `.current` directly. Keep `shouldTrackValue` `$derived` body, the queue functions
(`startEvent`/`submitAllEvents`/`track`), and `sessionIdReactive.current` read (`:112`) verbatim —
only the read shape changes. **Exported surface** (`sendTrackingEvent: Writable`, `sessionId`/
`shouldTrack: Readable` per `trackingService.type.ts:39,43,47`) stays store-shaped via the
appContext seam. **Note:** `sessionId` uses legacy `sessionStorageWritable('appContext-sessionId')`
— research/State-of-the-Art keeps `sessionStorageWritable` for sessionId until Phase 98; do not
force it to `sessionStorageState` (it must remain a `Readable` for consumers). Decide via Q1/Q3.

---

### `contexts/voter/voterContext.svelte.ts` (orchestrator factory, event-driven) — CTX-07

**Analog:** itself, pre-migration (565 lines, read in full). Factory shape = `initVoterContext()`.

**Input bridges to drop (`:5,46-47`):**
```ts
import { fromStore } from 'svelte/store';            // delete (pending appSettings/locale .current — see Delta)
const appSettingsState = fromStore(appSettings);     // → read appSettings.current (or keep, per Delta)
const localeState = fromStore(locale);               // → locale.current
```
Apply across `appSettingsState.current.X` sites: `:56,99,368,371,399,403,409`; `localeState.current`
at `:423`. **Body of every `$derived`/`$effect`/`$derived.by` stays verbatim** (Don't-Hand-Roll:
these encode Phase 61/64/88 regressions).

**`firstQuestionId` 3-layer → `sessionStorageState` swap (`:17,241-242,300,482,521-526`):**
```ts
// BEFORE
import { sessionStorageWritable } from '../utils/persistedState.svelte';
const _firstQuestionId = sessionStorageWritable('voterContext-firstQuestionId', null as Id | null);
const firstQuestionIdState = fromStore(_firstQuestionId);   // read firstQuestionIdState.current
// AFTER (1:1)
import { sessionStorageState } from '../utils/persistedState.svelte';
const _firstQuestionId = sessionStorageState('voterContext-firstQuestionId', null as Id | null);
// reads firstQuestionIdState.current → _firstQuestionId.current  (:300, :522)
// writes _firstQuestionId.set(v) unchanged  (:482, :525)
```

**Preserve verbatim:** `untrack` seed-guard (`:290`), push-`$state`+`$effect` mirrors
(`:78-162,246-347`), the `...appContext` spread followed by explicit getter re-declarations
(`:494` then `:497-563`) — Pitfall 4, do NOT touch.

**Getter exposure shape to keep (reactive accessors, read via `ctx.X`):** `:497-563` — every
`get selectedElections()`, `get opinionQuestions()`, `get matches()`, `get firstQuestionId()` /
`set firstQuestionId(v)`, etc. Destructure-trap PRESERVED (D-04 / CLAUDE.md rule).

---

### `contexts/candidate/candidateContext.svelte.ts` (orchestrator factory, event-driven / CRUD) — CTX-07

**Analog:** `voterContext.svelte.ts` (sibling orchestrator, identical factory shape) + itself
pre-migration (459 lines; lines 1-90 read in full this session).

**Input bridges (`:5,40-49`):**
```ts
import { fromStore } from 'svelte/store';
const { appSettings, getRoute, locale, reactiveDataRoot } = appContext;
const appSettingsState = fromStore(appSettings);   // → .current (or keep, per Delta)
const getRouteState = fromStore(getRoute);          // KEEP — getRoute is Phase 97 (Open Q2)
const localeState = fromStore(locale);              // → .current (or keep, per Delta)
```
Drop `fromStore(appSettings)`/`fromStore(locale)` per the Delta resolution; **KEEP
`fromStore(getRoute)`** → the `svelte/store` import stays this phase. State that explicitly in
CTX-07 acceptance: "candidate context is rune-native except the getRoute input (Phase 97)".

**Preregistration session-state (Open Q1, `:75-84,287`):**
```ts
const _preregistrationElectionIds = sessionStorageWritable('candidateContext-preselectedElectionIds', new Array<Id>());
const preregistrationElectionIdsState = fromStore(_preregistrationElectionIds);
const _preregistrationConstituencyIds = sessionStorageWritable<{...}>('candidateContext-preselectedConstituencyIds', {});
// + localStorageWritable('candidateContext-isPreregistered') at :287
```
**Planner decision (Q1):** migrate these to `sessionStorageState`/`localStorageState` (1:1, same
swap as voter `firstQuestionId`) for a fully `svelte/store`-free file, OR leave on legacy helpers
until Phase 98. Recommendation: migrate (low-risk, advances K1) — but only `firstQuestionId` is
strictly named by CTX-07. Spread + explicit-getter order at `:374-375` (`...appContext,...authContext`)
PRESERVED (Pitfall 4).

---

### `contexts/app/appContext.svelte.ts` (bridge seam — MODIFY, Pitfall 1 option (b))

**Analog:** existing bridges in the same file — `tracking = trackingService(...)` (`:148`),
`survey = surveyLink({appSettings, sessionId: tracking.sessionId})` (`:150`), the return spread
`...tracking` + `surveyLink: survey` + `userPreferences` (`:233-256`), and the 9 `toStore(() => …)`
exports (`appSettings:85`, `appCustomization:123`, `openFeedbackModal:156`).

**Seam obligation:** survey/tracking producers go pure-rune; this seam owns the store-shaped wrap
for un-migrated consumers (`$surveyLink` in SurveyButton/VoterNav; `sendTrackingEvent.set` + `$store`
in `routes/+layout.svelte`). Wrap with `toStore(() => producerValue.current)` here, mirroring
`:123-128`. This is the same bridge-ownership pattern Wave-1 used (appContext already owns 9).

**If the Delta is resolved via option (ii):** ADD `.current`-shaped accessors for
`appSettings`/`locale` to this return so orchestrators can read runed inputs while the existing
`toStore` exports stay for un-migrated consumers.

---

### Test files

**`persistedState.svelte.test.ts` (ADD session cases):** analog = existing `localStorageState`
cases in the same file. Add: default fallback, set/update round-trip, browser-gate SSR→default,
raw non-versioned session payload (assert NO `{version,data}` wrapper).

**`survey.svelte.test.ts` (NEW):** pure derivation test — `linkTemplate` + `sessionId`
interpolation, `undefined` when `survey?.linkTemplate` unset. No `$effect`/cascade needed
(Pitfall 3). **`trackingService.svelte.test.ts` (NEW, optional):** `shouldTrack` gating
(`browser && trackEvents && consent==='granted'`) + queue behavior.

## Shared Patterns

### `.current` rune handle exposure (the migration's core move)
**Source:** `persistedState.svelte.ts:52-59,95-107` (`PersistedState` + `storageState`).
**Apply to:** survey, trackingService inputs; voter/candidate `firstQuestionId` + (Q1) prereg ids.
```ts
get current() { return value; },          // reactive read — tracks $state
set(v) { value = v; saveItemToStorage(...); }   // imperative persist, NOT $effect
```

### Temporary store-shaped bridge (Wave-2/98 throwaway)
**Source:** `appContext.svelte.ts:85-90,123-128` (`toStore(() => value, (v)=>{...})`).
**Apply to:** the appContext seam for survey/tracking exported surfaces. Deleted Phase 98.

### Destructure-trap preservation (CLAUDE.md Context Destructuring Rule)
**Source:** `voterContext.svelte.ts:497-563` getters; `:494` spread-then-getter order.
**Apply to:** both orchestrators — reactive accessors as `get X()`, read via `ctx.X`; do NOT fix.

### Push-`$state` + `$effect` mirror + ref-equality short-circuit
**Source:** `voterContext.svelte.ts:78-162` (`sameRefs` guard), `:246-347` (question chain).
**Apply to:** KEEP verbatim — behavior-locked (Phase 61/64/88). Only swap `fromStore` inputs.

## No Analog Found

None. Every target file is an in-place modification of an existing file with a shipped Wave-1
sibling (`localStorageState`) or a direct cross-file twin (`voterContext` ↔ `candidateContext`).

## Metadata

**Analog search scope:** `apps/frontend/src/lib/contexts/{utils,app,app/tracking,voter,candidate}/`
**Files scanned (read):** persistedState.svelte.ts (full), survey.svelte.ts (full),
trackingService.svelte.ts (full), voterContext.svelte.ts (full), candidateContext.svelte.ts (1-90),
appContext.svelte.ts (80-260); greps over `.type.ts` surfaces.
**Pattern extraction date:** 2026-06-04
