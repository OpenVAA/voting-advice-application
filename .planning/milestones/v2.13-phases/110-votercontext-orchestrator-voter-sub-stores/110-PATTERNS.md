# Phase 110: voterContext Orchestrator + Voter Sub-Stores - Pattern Map

**Mapped:** 2026-06-13
**Files analyzed:** 9 conversion targets (+ 3 dead-code projection factories flagged for SKIP)
**Analogs found:** 9 / 9 (all exact in-tree precedents from Phases 106–109)

---

## TL;DR for the planner (decisive findings)

1. **No consumer spreads `voterContext`.** `grep "{ ...voterContext }" / "...getVoterContext()"` → **zero hits**. The only spread *in the file* is voterContext consuming its parent: `voterContext.svelte.ts:488 ...appContext` (and `candidateContext:366` + `adminContext:98` also spread `...appContext` — already handled by Phase 109's own-enumerable AppContextProvider). **Consequence:** the converted `VoterContext` class may expose its members as **prototype getters** (the natural class-getter shape) — it does NOT need the Phase-109 own-enumerable discipline AppContextProvider required. This is the decisive divergence from the AppContextProvider analog and dramatically simplifies the conversion. (Confirmed precedent: `FilterContextProvider` header explicitly notes "Prototype getters are spread-safe here: the handles are NOT spread by any consumer.")

2. **BUT voterContext still spreads `...appContext` (L488).** The class must reproduce that spread. Since AppContextProvider is now a class instance with **own-enumerable** forwarded members (Phase 109), `Object.assign(this, appContext)` inside the constructor copies them correctly — mirror the `Object.assign(this, {...})` forwarding pattern at `appContext.svelte.ts:316-334`. Do NOT use a prototype-getter passthrough for the appContext members; `Object.assign` from the already-own-enumerable appContext instance is the clean idiom.

3. **Three `utils/*` projection factories are DEAD CODE — SKIP them.** `questionCategoryStore.svelte.ts`, `questionStore.svelte.ts`, `questionBlockStore.svelte.ts` (+ `extractInfoCategories`/`extractOpinionCategories`) have **zero live value-importers** (grep confirmed). They were INLINED into voterContext `$effect` blocks (L213-341) at Phase 61 (see voterContext comments L205-212). The ROADMAP names them as conversion targets, but converting dead code is wasted risk. **Recommendation:** SKIP conversion; optionally delete in a cleanup plan. Only `paramStore.svelte.ts` (L60/62 importers) is live.

4. **`answerStore` is NOT itself a version-bridge** — it is a thin wrapper over `localStorageState` (already a class, `PersistedStateImpl`, Phase 96). Its "version" mechanics live ENTIRELY in `persistedState.svelte.ts` (already converted). The spike-022 `#version`-must-not-spin caveat applies to the `localStorageState` `{version,data}` payload, which `answerStore` consumes unchanged. So answerStore conversion = trivial class wrapping 4 methods; the bridge is inherited, not re-implemented.

5. **`$effect` legality:** voterContext has 5 `$effect` blocks (L92, L129, L240, L280, L293) + 4 `$derived`/`$derived.by`. Per §20 + AppContextProvider precedent, ALL of these are **legal in the class constructor** because voterContext is constructed during component init (effect context). They move verbatim into the constructor body, AFTER the `$state`/handle fields they read are assigned (D1 field-init order).

---

## File Classification

| Target File | Role | Data Flow | Closest Analog | Match Quality | Est. Risk |
|-------------|------|-----------|----------------|---------------|-----------|
| `voter/voterContext.svelte.ts` (559 L) | context/orchestrator | event-driven + derived projection | `app/appContext.svelte.ts` (AppContextProvider) | exact (orchestrator) | HIGH |
| `voter/answerStore.svelte.ts` (55 L) | sub-store (persisted) | CRUD + localStorage | `utils/persistedState.svelte.ts` (PersistedStateImpl) + candidate persisted stores | exact | LOW |
| `voter/matchStore.svelte.ts` (156 L) | sub-store (derived projection) | transform (`$derived.by`) | `voter/filterStore` + dataContext `$derived` field | exact (same `{get value}` shape) | LOW-MED |
| `voter/nominationAndQuestionStore.svelte.ts` (131 L) | sub-store (derived projection) | transform (`$derived.by`) | `voter/matchStore` (sibling) | exact | LOW-MED |
| `voter/filters/filterStore.svelte.ts` (84 L) | sub-store (derived projection) | transform (`$derived.by`) | `voter/matchStore` (sibling) | exact | LOW |
| `utils/paramStore.svelte.ts` (19 L) | derived projection (LIVE) | transform (`$derived`) | self-shaped; FilterContextProvider `#filterGroup` field | exact | LOW |
| `utils/questionCategoryStore.svelte.ts` (63 L) | derived projection (**DEAD**) | transform | — | **SKIP** | — |
| `utils/questionStore.svelte.ts` (44 L) | derived projection (**DEAD**) | transform | — | **SKIP** | — |
| `utils/questionBlockStore.svelte.ts` (92 L) | derived projection (**DEAD**) | transform | — | **SKIP** | — |

---

## Pattern Assignments

### `voter/voterContext.svelte.ts` (orchestrator) — HIGH risk, plan-split candidate

**Analog:** `app/appContext.svelte.ts` (`AppContextProvider`, post-cbd3f0bd3 shape).

**Shape decision (KEY):** Unlike AppContextProvider, voterContext is **NOT spread by any consumer** → its OWN members are exposed as **prototype getters** (the natural class shape; CONVENTIONS §17 — "Groups A/B/D/G collapse to plain fields/getters"). The own-enumerable discipline is required ONLY for the inherited `...appContext` members, which arrive already own-enumerable from the AppContextProvider instance.

**Conversion recipe:**

1. **Class skeleton + factory wrappers** — mirror `appContext.svelte.ts:80, 438-451`:
```ts
export class VoterContextProvider implements VoterContext {
  // ... fields + constructor ...
}
export function getVoterContext(): VoterContext { /* hasContext guard, L25-28 verbatim */ }
export function initVoterContext(): VoterContext {
  if (hasContext(CONTEXT_KEY)) error(500, 'initVoterContext() called for a second time');
  return setContext<VoterContext>(CONTEXT_KEY, new VoterContextProvider());
}
```

2. **Inherited appContext spread** — replaces `...appContext` (L488). In the constructor, after pulling `const appContext = getAppContext()`:
```ts
Object.assign(this, appContext); // appContext members are already own-enumerable (Phase 109)
```
(Pattern: `appContext.svelte.ts:316-334`. Do NOT re-spread with object literal; the L42 destructure `const { reactiveAppSettings, reactiveLocale, reactiveDataRoot, startEvent, t } = appContext` stays as local consts used by the producers — these are stable refs per CLAUDE.md, safe to destructure.)

3. **`$state` mirror fields** (L73-74, L213-234) → private `#field = $state(...)` declarations; the wholesale-reassignment-stays-reactive win (§17) means consumer reads via `ctx.selectedElections` (prototype getter) stay live.

4. **`$derived` fields** (L50, L54, L194, L349, L362, L365, L376, L386-403, L439) → `$derived` **fields** (§17/§20) OR keep as constructor-local `const` if only read by other constructor code. Members exposed on the surface become prototype getters returning the private `$derived` field.

5. **`$effect` blocks** (L92, L129, L240, L280, L293) → move VERBATIM into constructor body, AFTER the `$state` + handle fields are assigned (D1 field-init order — `appContext.svelte.ts:354-369` precedent + TrackingServiceImpl). These are legal in-constructor because voterContext constructs at component init (§20 sanctioned exception, confirmed by AppContextProvider + FilterContextProvider).

6. **Sub-store producer instances** (`answers` L347, `_nominationsAndQuestions` L368, `_matches` L405, `_entityFilters` L414) → private fields created in constructor AFTER their getter-input deps exist (D1 order; the getter args `() => selectedElections` etc. close over `this`). Mirror `appContext.svelte.ts:301-306` producer-after-inputs ordering.

7. **`initFilterContext` call** (L465) + **`resetVoterData`** (L474) → `resetVoterData` becomes an **arrow-function field** (§18 — it IS destructured/passed; e.g. `onclick`). `initFilterContext(...)` is a constructor side-effect call.

8. **`sameRefs` helper** (L86-90) → private method or module-level function (not detached, not reactive → either is fine).

9. **Surface getters** (L491-557) → prototype `get`/`set` accessors (spread-safe here). Setters `firstQuestionId` (L518) and `selectedQuestionCategoryIds` (L555) stay as `set` accessors. `filterContext` getter delegates to `getFilterContext()` verbatim (L512).

**Member-shape summary for VoterContextProvider OWN members:**
| Member kind | Shape | Why |
|---|---|---|
| `selectedElections`, `selectedConstituencies`, `infoQuestions`, etc. (reactive accessors) | prototype `get` over private `#x = $state`/`$derived` | not spread → getters safe; §17 |
| `firstQuestionId`, `selectedQuestionCategoryIds` | prototype `get`+`set` | writable accessors, not spread |
| `resetVoterData` | arrow-function field | §18 detach-safe |
| `algorithm`, `answers` (stable) | plain field or getter | stable refs |
| inherited appContext members | own-enumerable via `Object.assign(this, appContext)` | reproduces L488 spread |

**Plan-split guidance:** 559 lines, ~25 surface members, 5 effects, 4 sub-store producers. Consider splitting: (a) sub-stores first (answerStore + the 3 derived sub-stores), (b) voterContext orchestrator class, (c) E2E gate. Sub-stores are independent and low-risk → convert first to de-risk the orchestrator.

---

### `voter/answerStore.svelte.ts` (persisted sub-store) — LOW risk

**Analog:** `utils/persistedState.svelte.ts` `PersistedStateImpl` (already a class) + the §18 arrow-field discipline.

**Conversion recipe:** wrap the 4 functions in a class; the persistence/version bridge is INHERITED from `localStorageState` (unchanged — `store = localStorageState('VoterContext-answerStore', ...)` stays, L15).

```ts
class AnswerStoreImpl implements AnswerStore {
  #store = localStorageState('VoterContext-answerStore', Object.freeze({}) as Frozen<Answers>);
  #startEvent: TrackingService['startEvent'];
  constructor(startEvent: TrackingService['startEvent']) { this.#startEvent = startEvent; }
  get answers() { return this.#store.current; }          // reactive read (L48-50)
  setAnswer = (questionId, value?) => { /* L17-35 body verbatim, this.#startEvent */ };  // §18 arrow
  deleteAnswer = (questionId) => this.setAnswer(questionId);  // §18 arrow
  reset = () => { /* L41-45 verbatim */ };                // §18 arrow
}
export function answerStore({ startEvent }): AnswerStore { return new AnswerStoreImpl(startEvent); }
```

**§18 critical:** `setAnswer`/`deleteAnswer`/`reset` MUST be arrow fields — they are destructured/passed by consumers and detach. (`answers` getter is read in-place, prototype getter fine.)

**Version-bridge caveat (spike 022):** answerStore does NOT own a `#version`. The `{version,data}` payload + expiry lives in `localStorageState`/`PersistedStateImpl` (already shipped, Phase 96). No re-implementation. The existing test (`answerStore.svelte.test.ts`) asserts the persisted versioned format (L57-60) — keep it green; it already wraps `answerStore(...)` in `$effect.root` so a class instance constructed there is fine.

---

### `voter/matchStore.svelte.ts` + `nominationAndQuestionStore.svelte.ts` + `filters/filterStore.svelte.ts` (derived-projection sub-stores) — LOW-MED risk

**Analog:** each other (identical `{ readonly value: T }` shape) + `FilterContextProvider`'s `#filterGroup` `$derived` field (`filterContext.svelte.ts`).

**Common shape today:** factory returns `{ get value() { return _value; } }` where `_value = $derived.by(...)`. All three take getter-args (`() => selectedElections`) that close over the producer.

**Conversion recipe (apply to all 3):**
```ts
class MatchStoreImpl {
  #value = $derived.by(() => { /* L45-144 body VERBATIM, args via this.#deps */ });
  constructor(deps: { answers; nominationsAndQuestions; algorithm; minAnswers; calcSubmatches; parentMatchingMethod }) { /* store deps */ }
  get value() { return this.#value; }
}
export function matchStore(deps) { return new MatchStoreImpl(deps); }
```
- `$derived.by` becomes a **`$derived` FIELD** (§20 — projection in `$derived`, never `$effect`).
- `get value()` prototype getter — these sub-stores are NOT spread (verified: only voterContext reads `.value`), so prototype getter is safe.
- **Factory signature byte-identical** (CONTEXT decision: "Sub-store factory signatures + exported surfaces byte-identical"). Keep the `export function matchStore({...})` wrapper returning the instance.
- Exported TYPES (`MatchTree` L156, `NominationAndQuestionTree` L127, `FilterTree` L84) stay as-is (re-exported from these modules; importers at `filterContext.type.ts`, `lib/utils/matches.ts`, etc. — do NOT change export names).

**`$derived.by` constructor caveat:** a `$derived` field initializer runs lazily on first read, so no effect-context issue at construction. Matches the `FilterContextProvider.#filterGroup` precedent.

---

### `utils/paramStore.svelte.ts` (LIVE derived projection) — LOW risk

**Analog:** self / FilterContextProvider `$derived` field.

**Conversion recipe:** same `{ get value }` → class pattern as the sub-stores above. `_value = $derived(parseParams(page)[param] ...)` → private `$derived` field; `get value()` prototype getter. Factory `export function paramStore(param)` returns instance. Live importers: `voterContext.svelte.ts:60,62` (`_electionId`, `_constituencyId`). Not spread → prototype getter safe.

---

### `utils/questionCategoryStore` / `questionStore` / `questionBlockStore` — **SKIP (dead code)**

Zero live value-importers (grep-confirmed). Inlined into voterContext `$effect` (L240-341) + candidateContext at Phase 61. Converting them is wasted risk against the SC-4 green gate. Only `questionBlockStore.type.ts` (the `QuestionBlocks`/`QuestionBlock` TYPES) is live (imported by voterContext L20 + the inlined `_selectedQuestionBlocks` shape L218-225). **Do not convert the `.svelte.ts` factories; leave the `.type.ts` untouched.** Optionally propose deletion in a follow-up cleanup, but out of scope for the green gate.

---

## Shared Patterns

### Class skeleton + factory wrappers (every file)
**Source:** `app/appContext.svelte.ts:80,438-451`; `filter/filterContext.svelte.ts` (FilterContextProvider).
Keep `initXxx`/`getXxx`/factory functions; `setContext(KEY, new Provider())`. Hasctx guards verbatim.

### §17 — reassigned `$state` field stays reactive as prototype getter
**Apply to:** all reactive surface members where NO consumer spreads the context.
voterContext, all sub-stores, paramStore qualify (none are spread). This is the simplification over Phase 109.

### §18 — arrow-function fields for detached methods
**Source:** `app/appContext.svelte.ts:376-435`; `utils/persistedState.svelte.ts:123-131`.
**Apply to:** `answerStore.{setAnswer,deleteAnswer,reset}`, `voterContext.resetVoterData`. NOT to read-only getters.

### §20 / D1 — init in field initializer or `$derived`; `$effect` only in constructor, after deps
**Source:** `app/appContext.svelte.ts:117 (field-init), 354-369 (constructor $effect), 301-306 (producer-after-inputs)`; TrackingServiceImpl (D1 constructor-install precedent).
**Apply to:** voterContext's 5 effects + 4 derived + 4 sub-store producers. Order: `$state`/handle fields → handle objects → producer instances → `$effect`s.

### §22 version-bridge — INHERITED, not re-implemented (answerStore)
**Source:** `utils/persistedState.svelte.ts` (`{version,data}` payload + `requireUserDataVersion` expiry); `data/dataContext.svelte.ts:53,68 (#version + untrack)`; `filter/filterContext.svelte.ts (#version)`.
**Apply to:** answerStore consumes `localStorageState` unchanged — its version mechanics are already class-shaped. spike-022 silent-spin caveat already mitigated upstream.

### Inherited-context spread reproduction (voterContext only)
**Source:** `app/appContext.svelte.ts:316-334` (`Object.assign(this, {...})`).
**Apply to:** `voterContext` L488 `...appContext` → `Object.assign(this, appContext)` in constructor (appContext members already own-enumerable from Phase 109).

---

## No Analog Found

None. Every target maps to a Phase 106–109 in-tree precedent.

---

## Metadata

**Analog search scope:** `apps/frontend/src/lib/contexts/{voter,app,filter,data,utils,candidate,admin}/`, `apps/frontend/src/routes/(voters)/`
**Files scanned:** voterContext + 8 sub-store/projection files + 3 analogs (appContext, persistedState, filterContext/dataContext headers) + consumer/spread grep across `lib` + `routes`
**Spread audit result:** `{ ...voterContext }` → 0 hits; `{ ...appContext }` → 3 (candidate/admin/voter, all parent-consumption, Phase-109-handled)
**Dead-code finding:** 3 of 4 `utils/*` projection factories have 0 live value-importers
**Pattern extraction date:** 2026-06-13
