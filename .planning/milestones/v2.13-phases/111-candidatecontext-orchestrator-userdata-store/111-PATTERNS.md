# Phase 111: candidateContext Orchestrator + UserData Store - Pattern Map

**Mapped:** 2026-06-13
**Files analyzed:** 2 conversion targets (candidateContext.svelte.ts, candidateUserDataStore.svelte.ts) + 3 satellites (2 `.type.ts` unchanged, 1 test unchanged, 1 barrel edited)
**Analogs found:** 2 / 2 (both exact — Phase 110 sibling + Group-F leaf classes)

---

## Critical Analysis (decisive for the planner)

### 1. Consumer / spread audit — RESULT: ZERO spreads → plain prototype getters

**Grep result (read-only audit):**
- `{ ...candidateContext }` / `...getCandidateContext()` → **zero hits**
- `...userData` / `...candidateUserDataStore` → **zero hits**

**Decision (CONVENTIONS §17, voterContext 110-PATTERNS §1 precedent):**
Both classes' OWN members may be plain **prototype get/set accessors** (the natural class shape). NEITHER needs the Phase-109 own-enumerable `Object.defineProperty` discipline that AppContextProvider/AuthContextProvider's `isAuthenticated` required. The own-enumerable concern applies ONLY to the **inherited** appContext+authContext members reproduced via `Object.assign`.

**candidateContext internal spreads to replace (exact lines):**
- `candidateContext.svelte.ts:366` → `...appContext`
- `candidateContext.svelte.ts:367` → `...authContext`

Both sources are own-enumerable class instances, so `Object.assign(this, this.#appContext)` + `Object.assign(this, this.#authContext)` reproduce them faithfully:
- **AppContextProvider** (Phase 109) — members own-enumerable via constructor `Object.assign(this, {...})` (`appContext.svelte.ts:316`); confirmed by voterContext which already does `Object.assign(this, this.#appContext)` (`voterContext.svelte.ts:377`).
- **AuthContextProvider** (Phase 107/CLASS-02) — `isAuthenticated` is an own-enumerable constructor-defined accessor (`authContext.svelte.ts:61-67`); the 4 DataWriter wrappers (`requestForgotPasswordEmail`, `resetPassword`, `logout`, `setPassword`) are **arrow-function fields** (`authContext.svelte.ts:77-101`) which are own-enumerable instance properties. `Object.assign` copies all five.

> Note: candidateContext currently destructures `const { logout: _logout } = authContext` (L43) and wraps it in its own `logout` (L252-255) that adds the post-logout `goto(...).then(_reset)`. Preserve this: keep a private handle `#authLogout = this.#authContext.logout` and define candidateContext's own `logout` arrow/method that calls it. After `Object.assign(this, this.#authContext)`, the inherited `logout` is overwritten by candidateContext's own `logout` member (declaration must come AFTER the assign, or be a prototype getter — prototype methods/getters are NOT clobbered by `Object.assign`, which only sets own-enumerable props, so a prototype-level `logout` is safest).

### 2. candidateContext anatomy (`candidateContext.svelte.ts`, 452 lines)

**Member inventory of the returned object (L365-450):**
- Inherited: `...appContext` (L366), `...authContext` (L367)
- Reactive accessors (get-only): `answersLocked`, `constituenciesSelectable`, `selectedConstituencies`, `selectedElections`, `electionsSelectable`, `infoQuestionCategories`, `infoQuestions`, `opinionQuestionCategories`, `opinionQuestions`, `profileComplete`, `questionBlocks`, `requiredInfoQuestions`, `unansweredOpinionQuestions`, `unansweredRequiredInfoQuestions`, `idTokenClaims`, `preregistrationElections`, `preregistrationNominations`
- Reactive get/set pairs (persisted/state-backed): `isPreregistered` (L391-396), `newUserEmail` (L398-403), `preregistrationElectionIds` (L428-433), `preregistrationConstituencyIds` (L434-439)
- Stable refs / objects: `userData` (composite store handle, L426)
- Methods: `preregister`, `checkRegistrationKey`, `register`, `logout`, `exchangeCodeForIdToken`, `clearIdToken`

**$state fields (push-based mirrors):** `selectedElections`/`selectedConstituencies` (L118-119); `_questionCategories`/`_infoQuestionCategories`/`_opinionQuestionCategories`/`_infoQuestions`/`_opinionQuestions`/`_questionBlocks` (L160-180); `newUserEmail` (L63).

**$derived count:** `answersLocked` (L53), `idTokenClaims` (L55), `electionsSelectable` (L69), `constituenciesSelectable` (L71); `$derived.by`: `preregistrationElections` (L79), `preregistrationNominations` (L87), `unansweredRequiredInfoQuestions` (L345), `unansweredOpinionQuestions` (L351); `requiredInfoQuestions` (L338), `profileComplete` (L357).

**$effect count: 3** — selectedElections mirror (L121), selectedConstituencies mirror (L136), question-chain mirror (L182). **Constructor-legal** (constructed at component init = effect context), exactly like voterContext's 5 effects (`voterContext.svelte.ts:383-557`).

**userData composite wiring (L57-61):** `candidateUserDataStore({ answersLocked: () => answersLocked, dataWriterPromise, locale: () => reactiveLocale.current })` — getter-thunk args. As a field initializer this must run AFTER `answersLocked` $derived and `reactiveLocale` handle are assigned (D1 order: stable refs → `answersLocked` → `userData`). Keep the thunks as `() => this.#answersLocked` / `() => this.#reactiveLocale.current`.

**Persisted fields + round-trips (imperative init, never `$effect` — spike 021/023):**
- `_isPreregistered = localStorageState('candidateContext-isPreregistered', false)` (L280) → exposed as `isPreregistered` get/set (L391-396)
- `_preregistrationElectionIds = sessionStorageState('candidateContext-preselectedElectionIds', new Array<Id>())` (L73) → `preregistrationElectionIds` get/set (L428-433)
- `_preregistrationConstituencyIds = sessionStorageState('candidateContext-preselectedConstituencyIds', {})` (L75) → `preregistrationConstituencyIds` get/set (L434-439)
- (No `firstQuestionId` in candidateContext — that field lives in voterContext L122. The ROADMAP/CONTEXT mention of `firstQuestionId` is carried by voterContext; candidateContext has no equivalent. Planner: do not invent one.)

All three become private class fields initialized at declaration (`#isPreregistered = localStorageState(...)`), with get/set accessors delegating to `.current`/`.set()` — identical to voterContext `#firstQuestionId` (L122 + getters L620-625). `PersistedState` is a plain class instance from `persistedState.svelte.ts` (`localStorageState`/`sessionStorageState` factories, L43/L64); `.current` read + `.set()`/`.update()` write — no `$effect` needed.

### 3. candidateUserDataStore anatomy (`candidateUserDataStore.svelte.ts`, 277 lines)

**The Group-C composite `$derived.by` merge (L54-75) — PRESERVE VERBATIM:** merges `savedData` ($state, L34) + `editedAnswers` (`_editedAnswersStore.current`, localStorage L37) + `editedImage` ($state, L43) + `editedTermsOfUseAccepted` ($state, L46) via the JSON round-trip clone. The JSON round-trip (NOT structuredClone) is load-bearing — Svelte 5 `$state` proxies can't be structurally cloned (comment L63-64). Becomes a private `#current = $derived.by(...)` field; exposed as `get current()` (currently L249-251).

**Other reactive members:** `_savedCandidateData = $derived` (L113), `_unsavedQuestionIds = $derived.by` (L115), `_unsavedProperties = $derived.by` (L120), `_hasUnsaved = $derived` (L127). `$effect` reacting to `answersLocked()` to clear unsaved (L49-51) — becomes constructor effect.

**Methods (12):** `init`, `reset`, `resetUnsaved`, `setAnswer`, `resetAnswer`, `resetAnswers`, `setImage`, `resetImage`, `setTermsOfUseAccepted`, `resetTermsOfUseAccepted`, `reloadCandidateData`, `save` + internal `updateCandidateData`/`mergeCandidateAnswers`. Several mutate $state/store and are called via context handle (`userData.reset()` in candidateContext `_reset` L330) — make them **arrow-function fields** (§18) so they survive being held as `userData.X`.

**Test coverage (`candidateUserDataStore.svelte.test.ts`, 191 lines, MUST stay green):** 4 `save()` tests (L82-190) asserting the answers-only vs properties-only merge paths preserve `candidate.id` + static fields (the `mergeCandidateAnswers`/`updateCandidateData` distinction, L94-107/L80-86). Test imports the FACTORY `candidateUserDataStore` (L3) and calls `store.init(...)` / `store.save()`. **Decision (CONVENTIONS §22, Store→State rename deferred to Phase 114):** keep the public factory export `candidateUserDataStore(...)` returning an instance (factory-wraps-`new`), so the test's import + call sites are byte-identical. If converting to a class `CandidateUserDataStore` (name clash with the TYPE `CandidateUserDataStore`!) — the type is the public surface; name the class e.g. `CandidateUserDataStoreImpl` and keep the factory `candidateUserDataStore` returning `new CandidateUserDataStoreImpl(...)`. This is the same type-name-clash landmine as the v2.13 D2 re-export clash (see recent commits).

### 4. Closest analogs

| Concern | Analog | Lines |
|---------|--------|-------|
| Orchestrator class on appContext+authContext base | **VoterContextProvider** (Phase 110 sibling) | `voterContext.svelte.ts` whole file |
| `Object.assign` inheritance from own-enumerable class | voterContext `Object.assign(this, this.#appContext)` | `voterContext.svelte.ts:377` |
| Inherited-member `readonly x!:` declarations + definite-assignment | voterContext appContext member block | `voterContext.svelte.ts:333-365` |
| Prototype getter for reactive accessor | voterContext surface getters | `voterContext.svelte.ts:593-661` |
| $derived/$effect/$state fields + producers in D1 order | voterContext field block + constructor | `voterContext.svelte.ts:88-324` + `366-574` |
| Arrow-field detached method | voterContext `resetVoterData` | `voterContext.svelte.ts:580-587` |
| @internal JSDoc + type-only barrel export | voterContext class doc + barrel | `voterContext.svelte.ts:42-73`, `voter/index.ts` (type-only `export type { VoterContextProvider }`) |
| Persisted field round-trip (no $effect) | voterContext `#firstQuestionId` | `voterContext.svelte.ts:122` + getters `620-625` |
| Own-enumerable accessor (only for inherited source verification) | authContext `isAuthenticated` | `authContext.svelte.ts:61-67` |
| Leaf-class arrow DataWriter wrappers | authContext wrappers | `authContext.svelte.ts:77-101` |
| Composite-store-as-class (Group C) | candidateUserDataStore itself → mirror voterContext sub-store class idiom | (this phase) |

### 5. Per-file size / risk estimate (plan splitting)

| File | Lines | Risk | Notes |
|------|-------|------|-------|
| `candidateUserDataStore.svelte.ts` | 277 | **Medium** | Self-contained Group-C composite; 1 existing test gates it; convert FIRST (candidateContext imports it L11). Type-name clash landmine. |
| `candidateContext.svelte.ts` | 452 | **High** | Orchestrator; 2 spread→Object.assign conversions; 3 $effects; userData composite wiring; D1 ordering; logout override. |
| `candidate/index.ts` | barrel | Low | Add type-only `export type { ... }` + `{ getCandidateContext, initCandidateContext }` per voterContext precedent. |
| `.type.ts` (both) | — | None | Unchanged — they are the public surface the classes `implements`. |

**Suggested plan split:** Plan 1 = candidateUserDataStore class + green test; Plan 2 = candidateContext orchestrator class + barrel; final Plan = E2E gate (SC-4). Roughly mirrors how 110 was split.

---

## File Classification

| File | Role | Data Flow | Closest Analog | Match Quality |
|------|------|-----------|----------------|---------------|
| `candidateContext.svelte.ts` | context provider (orchestrator) | event-driven / composite | `voterContext.svelte.ts` (VoterContextProvider) | exact |
| `candidateUserDataStore.svelte.ts` | composite store (Group C) | CRUD + local-persist + composite-merge | voterContext sub-store class idiom + persistedState class | role-match |
| `candidate/index.ts` | barrel | — | `voter/index.ts` | exact |

---

## Pattern Assignments

### `candidateContext.svelte.ts` → `class CandidateContextProvider implements CandidateContext`

**Analog:** `voterContext.svelte.ts` (VoterContextProvider).

**Inheritance — replace L366-367 spreads with constructor Object.assign** (analog `voterContext.svelte.ts:377`):
```typescript
#appContext = getAppContext();
#authContext = getAuthContext();
// stable refs as private fields (CLAUDE.md: these are stable, safe to hold)
#reactiveAppSettings = this.#appContext.reactiveAppSettings;
#reactiveLocale = this.#appContext.reactiveLocale;
#reactiveDataRoot = this.#appContext.reactiveDataRoot;
#getRoute = this.#appContext.getRoute;
#authLogout = this.#authContext.logout;
// ...
constructor() {
  Object.assign(this, this.#appContext);
  Object.assign(this, this.#authContext);
  // then the 3 $effects (see below)
}
```

**Inherited-member declarations** — copy the `readonly x!: AppContext['x']` block pattern from `voterContext.svelte.ts:333-365`, extended to cover BOTH `AppContext[...]` AND `AuthContext[...]` keys (`isAuthenticated`, `requestForgotPasswordEmail`, `resetPassword`, `setPassword`; NOT `logout` — candidateContext overrides it). `implements CandidateContext` (= `AppContext & AuthContext & {...}`, see `candidateContext.type.ts:9-10`) forces these to be declared.

**$state push-mirrors** — private fields, copy verbatim from current L118-180 (rename `_x` → `#x`).

**$derived field initializers (D1 order)** — `answersLocked` (L53), then `userData` (L57, reads `answersLocked`), then the rest. Lazy `$derived.by` bodies may reference later fields (CONVENTIONS §20; voterContext precedent L241-324).

**3 $effects in constructor** — copy verbatim from L121/L136/L182, swapping locals for `this.#x`. Analog: `voterContext.svelte.ts:383-557`.

**logout override** (preserve L252-255 behavior):
```typescript
get logout() {  // prototype getter survives Object.assign(this, authContext)
  return this.#logout;
}
#logout = async (): Promise<void> => {
  await this.#authLogout();
  return goto(this.#getRoute.current('CandAppLogin'), { invalidateAll: true }).then(this.#reset);
};
```
(Or declare `logout` arrow field assigned AFTER the constructor's `Object.assign` calls — but field initializers run BEFORE the constructor body, so `Object.assign` would clobber an arrow-field `logout`. Use a prototype getter delegating to a private arrow, as above. This is the load-bearing detail.)

**Persisted fields** — `#isPreregistered = localStorageState(...)`, `#preregistrationElectionIds = sessionStorageState(...)`, `#preregistrationConstituencyIds = sessionStorageState(...)` as declaration-init fields; get/set accessors delegate to `.current`/`.set()`. Analog `voterContext.svelte.ts:122,620-625`. Imperative — NO `$effect` init.

**Surface accessors** — prototype get/set, mirror current L368-449 ordering. Analog `voterContext.svelte.ts:593-661`.

**Factory wrappers byte-identical** — keep `getCandidateContext()` (L23-26) + `initCandidateContext()` returning `setContext(CONTEXT_KEY, new CandidateContextProvider())`. Analog `voterContext.svelte.ts:664-676`.

**Class JSDoc** — `@internal` test-seam doc + `@throws effect_orphan` per `voterContext.svelte.ts:42-73`.

---

### `candidateUserDataStore.svelte.ts` → composite store class (factory-wrapped)

**Analog:** persistedState class (`persistedState.svelte.ts`) + voterContext sub-store idiom; preserve own structure.

**Composite `$derived.by` merge** — convert L54-75 to a private `#current = $derived.by(...)` field VERBATIM (JSON round-trip clone is load-bearing, L63-64). Exposed `get current()`.

**$state backings** → private fields: `#savedData = $state(...)` (L34), `#editedImage = $state(...)` (L43), `#editedTermsOfUseAccepted = $state(...)` (L46), `#editedAnswersStore = localStorageState(...)` (L37).

**answersLocked $effect** (L49-51) → constructor effect (legal: constructed at component init via candidateContext field init).

**Methods → arrow fields** (§18) so `userData.reset()` / `userData.save()` etc. survive being held on the context. Bodies verbatim from L80-246.

**Public export** — keep factory `export function candidateUserDataStore(opts): CandidateUserDataStore { return new CandidateUserDataStoreImpl(opts); }` so test (`candidateUserDataStore.svelte.test.ts:3`) + candidateContext (L11) imports are byte-identical. **Avoid the type-name clash:** the TYPE `CandidateUserDataStore` is the public surface — name the class `CandidateUserDataStoreImpl` (or similar), NOT `CandidateUserDataStore`. (v2.13 D2 landmine.)

**Test gate** — `candidateUserDataStore.svelte.test.ts` 4 save() tests MUST stay green unchanged.

---

### `candidate/index.ts` (barrel)

**Analog:** `voter/index.ts`. If candidateContext becomes a class, add type-only class export to prevent direct construction (WR-01):
```typescript
export type { CandidateContextProvider } from './candidateContext.svelte';
export { getCandidateContext, initCandidateContext } from './candidateContext.svelte';
```
Current barrel does `export * from './candidateContext.svelte'` — narrow it like voter did (commit a3045494b precedent). Same for the store if class-exported.

---

## Shared Patterns

### Object.assign inheritance from own-enumerable context instances
**Source:** `voterContext.svelte.ts:377`; verified sources `appContext.svelte.ts:316`, `authContext.svelte.ts:61-101`
**Apply to:** candidateContext (two assigns: appContext + authContext)

### Persisted-field round-trip without $effect (spike 021/023)
**Source:** `voterContext.svelte.ts:122,620-625`; `persistedState.svelte.ts:43,64`
**Apply to:** candidateContext `isPreregistered` / `preregistration*Ids`; candidateUserDataStore `#editedAnswersStore`

### Arrow-function fields for detached methods (§18)
**Source:** `authContext.svelte.ts:77-101`, `voterContext.svelte.ts:580-587`
**Apply to:** candidateUserDataStore all 12 methods (held as `userData.X`); candidateContext methods passed/destructured

### @internal class + type-only barrel export (WR-01)
**Source:** `voterContext.svelte.ts:42-73`, `voter/index.ts`
**Apply to:** both new classes + `candidate/index.ts`

### Destructure-trap contract (load-bearing history — CLAUDE.md + candidateContext.svelte.ts:100-117)
**Origin:** v2.6 Phase 61 (`61-03-DIAGNOSIS.md`) — the `$derived` pull-chain capture bug. The push-based `$state` + `$effect` mirrors (selectedElections/questions, L118-233) are the FIX and must be preserved. Class prototype getters preserve the contract (reads via `ctx.X` re-invoke the getter in tracking scope). **Do not regress to destructured-capture or pull-chain.** Consumers read `ctx.X` directly.

---

## No Analog Found

None — both targets have an exact Phase-110 sibling precedent.

---

## Metadata

**Analog search scope:** `apps/frontend/src/lib/contexts/{candidate,voter,auth,app,utils}`
**Spread audit scope:** `apps/frontend/src/` (grep, zero hits)
**Pattern extraction date:** 2026-06-13
