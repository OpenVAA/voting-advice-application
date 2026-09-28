# Phase 96: Domain A Wave 2 — Tier-2 Bridges - Research

**Researched:** 2026-06-04
**Domain:** Svelte 5 runes migration — Tier-2 secondary bridges (`survey`, `trackingService`) + orchestrating contexts (`voterContext`, `candidateContext`) + a `sessionStorageState` persistence helper
**Confidence:** HIGH (port-and-rename phase; every target file read this session, every shape has a browser-verified spike analog and a shipped Wave-1 precedent)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01 (96-1 + K1):** Add **`sessionStorageState`** as a **thin sibling of `localStorageState`** sharing the same versioned-payload core (only the storage backend differs). Spike-scratch name `runeSessionStorage` is NOT used in shipped code.
- **D-02 (96-2):** **Two plans:** (a) the secondary bridges — `survey` + `trackingService` + `sessionStorageState`; (b) the `voterContext` + `candidateContext` rune-native factories. Separates the low-risk helper/bridge work from the orchestration rewrite.
- **D-03:** `survey` + `trackingService` drop all `fromStore`/`toStore` over appSettings / sessionId / userPreferences; values exposed via `.current` getters.
- **D-04:** `voterContext` + `candidateContext` are factories composing Tier-1 via `getXContext()`, exposing all 18+/30+ reactive accessors as getters. The **destructure-trap reproduces identically and is preserved** per the CLAUDE.md rule (consumers read `ctx.X`, never destructure reactive accessors).
- **D-05 (K1):** Replacements keep original file + symbol names in place; no `rune…`/`…Native` suffixes survive.

### Claude's Discretion
- Internal factory composition order, as long as `getXContext()` resolution + getter exposure match the spike-007 shape.
- Internal shape of `sessionStorageState` provided it reuses the existing versioned-payload core.

### Deferred Ideas (OUT OF SCOPE)
- `getRoute` migration → Phase 97 (Wave 3, CTX-08). `voterContext`/`candidateContext` continue consuming `getRoute` via `fromStore(getRoute)` until then.
- The 146 `$store.X` consumer-codemod rewrite → Phase 97 (Wave 3).
- Deletion of `localStorageWritable` / `sessionStorageWritable` / `persistedState.svelte.ts` / `StackedState.svelte.ts` and dropping `Readable<T>` from `*.type.ts` → Phase 98 (Wave 4).
- `matchStore` / `nominationAndQuestionStore` — already rune-native (spike 004), zero work.
- Re-architecting the context paradigm; Domain B (View Transitions, Phases 99–100).
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| **CTX-06** | `survey` + `trackingService` secondary bridges are pure runes (no `fromStore`/`toStore` over appSettings / sessionId / userPreferences). | §Standard Stack (survey/trackingService migration delta), §Architecture Pattern 1 (`.current` getter exposure), §Common Pitfall 1 (the exported-surface bridge obligation — survey/tracking OUTPUTS are still consumed as `$store`). |
| **CTX-07** | `voterContext` + `candidateContext` are rune-native factories composing Tier-1 via `getXContext()` exposing 18+/30+ reactive accessors as getters; a `sessionStorageState` sibling backs `voterContext.firstQuestionId`; destructure-trap reproduces identically and is preserved. | §Standard Stack (`sessionStorageState` one-liner), §Architecture Pattern 2 (factory `fromStore` → `getXContext().current` deletion delta), §Architecture Pattern 3 (destructure-trap preservation), §Common Pitfall 2/3/4. |
</phase_requirements>

## Summary

This is a **port-and-rename migration phase, not a design phase.** Wave 1 (Phase 95) already shipped every Tier-1 leaf context as rune-native and — crucially — already shipped the `localStorageState` helper backed by a **`StorageType`-parametrized private core** (`storageState(type, key, default)` in `persistedState.svelte.ts:91`). That means CTX-07's new `sessionStorageState` helper is a **one-line export** (`return storageState('sessionStorage', key, defaultValue)`) — the versioned-payload core, `browser` gate, and expiry logic are already in place and were explicitly shaped for this reuse (95-03-SUMMARY "ready for Phase 96's `sessionStorageState` to share").

The four migration targets divide cleanly along the D-02 plan boundary. **Plan A (low-risk helpers/bridges):** add `sessionStorageState`; make `survey.svelte.ts` (24 lines) and `trackingService.svelte.ts` (132 lines) drop their `fromStore`/`toStore` over `appSettings`/`sessionId`/`userPreferences` and expose `.current` getters. **Plan B (orchestration rewrite):** `voterContext.svelte.ts` (565 lines) and `candidateContext.svelte.ts` (459 lines) drop `fromStore(appSettings)` / `fromStore(locale)` / `fromStore(getRoute)` and the `sessionStorageWritable(...) + fromStore(...)` two-layer bridges, reading instead through the Tier-1 contexts' `.current` getters and the new `sessionStorageState`.

**The single most important non-obvious finding:** unlike Wave 1's `appContext`/`dataContext` (which had to keep ~11 `toStore` *exported* bridges alive for ~60 un-migrated consumers), the **voter/candidate context public surfaces are ALREADY value/getter-shaped** — `voterContext.type.ts` and `candidateContext.type.ts` import nothing from `svelte/store` (`firstQuestionId: Id | null`, not `Readable<...>`). So the contexts themselves need NO consumer bridge. **However, `survey` and `trackingService` DO need a bridge**: their *return values* (`surveyLink → Readable<string|undefined>`, `trackingService.{sendTrackingEvent: Writable, sessionId: Readable, shouldTrack: Readable}`) are consumed via `$surveyLink` (SurveyButton, VoterNav), `sendTrackingEventStore.set(...)` + `$store` (`routes/+layout.svelte`), and the `appContext` spread surface — and those consumers are NOT migrated until Wave 3. So CTX-06's internals go pure-rune while the **exported shape stays store-compatible via a thin `toStore` bridge at the appContext seam** (or kept on the producer's return type until Phase 98).

**Primary recommendation:** Execute as two plans per D-02. Plan A: add `sessionStorageState` (1-liner), then migrate `survey` + `trackingService` internals to `.current` getters while preserving their *exported* store-shaped surface via a `toStore` bridge (the survey/tracking type files still declare `Readable`/`Writable` and consumers still use `$store` — that's Wave-3/Phase-98 territory). Plan B: mechanically rewrite the two orchestrators per the spike-007 factory shape — drop `fromStore`, read `appContext.appSettings`/`locale`/`getRoute` through their now-`.current` getters, swap `sessionStorageWritable(...) + fromStore(...)` for `sessionStorageState(...)`. Preserve the destructure-trap (do NOT fix it), keep the `untrack()` seed-guard, keep all push-based `$state` + `$effect` mirrors verbatim. No new public symbols except `sessionStorageState`.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Session-scoped persistence (`firstQuestionId`) | Frontend Client (browser `sessionStorage`) | — | `sessionStorageState` gated on `browser`; SSR returns default. Pure client persistence, no server involvement. |
| Survey-link composition | Frontend Client (rune `$derived`) | — | `survey` derives a string from `appSettings.survey.linkTemplate` + `sessionId`; pure client-side reactive composition. |
| Analytics event collection/dispatch | Frontend Client | — | `trackingService` collects events, gates on `browser && consent`; dispatch via Umami handler injected client-side. No server tier. |
| Voter context orchestration (elections, questions, matches, filters) | Frontend Client | — | Composes Tier-1 `appContext`/`dataContext`/`answerStore` + matching/filter stores; all reactive, browser-only. |
| Candidate context orchestration (user data, preregistration, questions) | Frontend Client | API (via `dataWriter` promise for register/preregister) | Reactive composition is client; auth-bound DB writes delegate to `dataWriter` (out of this phase's rune scope — already Promise-shaped). |

**No tier misassignment risk:** every target is a client-tier reactive factory. The only cross-tier touch (candidate `dataWriter` register/preregister) is already Promise-based and out of the rune-migration scope.

## Standard Stack

### Core (already present — no installs)
| Library / Symbol | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Svelte 5 runes (`$state`, `$derived`, `$derived.by`, `$effect`) | shipped in repo | Reactive primitives replacing `svelte/store` bridges | The binding milestone constraint — `svelte/store` is banned in migrated contexts [CITED: REQUIREMENTS.md binding-constraints blockquote] |
| `untrack` from `svelte` | shipped | Isolate write-after-read in `$effect`-scoped helpers | Permitted (only `svelte/store` is banned); already used in `voterContext.svelte.ts:290` seed-guard [VERIFIED: codebase grep] |
| `getContext`/`setContext`/`hasContext` from `svelte` | shipped | Context plumbing for the orchestrators | Existing pattern in both contexts [VERIFIED: codebase] |
| `page` from `$app/state` | SvelteKit 2 | Reactive route/params reads inside `$derived.by` | Already used; Pattern-3 fine-grained reads are Wave-3 concern (getRoute) [VERIFIED: codebase] |
| `localStorageState` / `storageState` core | shipped Phase 95 | Versioned-payload persistence; `sessionStorageState` reuses it | Core is already `StorageType`-parametrized for this exact reuse [VERIFIED: persistedState.svelte.ts:91; CITED: 95-03-SUMMARY] |

### The `sessionStorageState` addition (CTX-07 helper)

The private core already supports `sessionStorage`. The new public symbol is a thin sibling of `localStorageState` (`persistedState.svelte.ts:75`):

```ts
// apps/frontend/src/lib/contexts/utils/persistedState.svelte.ts — ADD
/**
 * Create a rune-native state handle persisted in `sessionStorage`. Sibling of
 * `localStorageState`; shares the StorageType-parametrized versioned-payload core.
 * sessionStorage payloads are NOT version-wrapped (see getItemFromStorage: the
 * version/expiry branch is localStorage-only) — `set`/`update` write the raw value.
 */
export function sessionStorageState<TValue>(key: string, defaultValue: TValue): PersistedState<TValue> {
  return storageState('sessionStorage', key, defaultValue);
}
```

[VERIFIED: persistedState.svelte.ts:91-108 `storageState` already branches `type`; `getItemFromStorage:162` and `saveItemToStorage:189` already special-case `localStorage` vs `sessionStorage`]

**No installs.** This phase adds zero dependencies.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Reusing `storageState` core for `sessionStorageState` | Inlining a fresh session helper (the spike's `runeSessionStorage` did inline `readVersioned`/`writeVersioned`) | REJECTED by D-01 + 95-03 precedent — the core is already parametrized; inlining would duplicate the `browser` gate and diverge from `localStorageState`. |
| `toStore` bridge on survey/tracking *exported* surface | Migrating SurveyButton/VoterNav/+layout consumers now | REJECTED — consumer migration is Wave 3 (Phase 97 codemod). Migrating them here violates the wave ordering and the D-02 plan split. |

## Package Legitimacy Audit

> Not applicable — this phase installs **zero** external packages. All symbols (`$state`, `$derived`, `$effect`, `untrack`, `getContext`, `page`) are first-party Svelte 5 / SvelteKit primitives already in the repo, and `sessionStorageState` is a new local symbol in an existing file. No registry, no slopcheck surface.

## Architecture Patterns

### System Architecture Diagram

```
                  Tier-1 (Phase 95, rune-native, .current getters)
   ┌──────────────┐   ┌──────────────┐   ┌──────────────────────┐
   │  appContext  │   │  dataContext │   │ answerStore /        │
   │ .appSettings │   │ .reactive    │   │ candidateUserData    │
   │ .locale      │   │  DataRoot    │   │ (localStorageState)  │
   │ .getRoute    │   │  .current/   │   └──────────────────────┘
   │ (still       │   │  .instance   │
   │  toStore-    │   └──────┬───────┘
   │  bridged*)   │          │
   └──────┬───────┘          │
          │  getAppContext() │ getDataRootContext()
          ▼                  ▼
   ════════════════ THIS PHASE (Wave 2 / Tier 2) ════════════════
                                                          ┌──────────────────────┐
   PLAN A (helpers + bridges)                             │ sessionStorageState  │ NEW
   ┌──────────────────┐      ┌───────────────────────┐    │ (sibling of          │
   │  survey.svelte   │      │ trackingService.svelte│    │  localStorageState;  │
   │  reads appSettings│      │ reads appSettings +   │    │  reuses storageState │
   │  + sessionId via │      │ userPreferences +     │    │  core)               │
   │  .current        │      │ sessionId via .current│    └──────────┬───────────┘
   │  → derives link  │      │ → shouldTrack/track   │               │
   └────────┬─────────┘      └───────────┬───────────┘               │
            │ toStore bridge at appContext seam (EXPORTED surface     │
            │ stays Readable/Writable until Wave 3/Phase 98)          │
            ▼                            ▼                            │
   $surveyLink (SurveyButton,    sendTrackingEvent.set() +            │
   VoterNav)  [un-migrated]      $store (routes/+layout) [un-migrated]│
                                                                      │
   PLAN B (orchestration rewrite)                                     │
   ┌────────────────────────────┐   ┌──────────────────────────────┐ │
   │ voterContext (565 ln)      │   │ candidateContext (459 ln)    │ │
   │ drop fromStore(appSettings)│   │ drop fromStore(appSettings)  │ │
   │ drop fromStore(locale)     │   │ drop fromStore(locale)       │ │
   │ sessionStorageWritable+    │◄──┤ drop fromStore(getRoute)*    │ │
   │  fromStore → sessionStorage │   │ keep sessionStorageWritable  │ │
   │  State (firstQuestionId)   │   │  for preregistration ids**   │ │
   │ 18+ getters preserved      │   │ 30+ getters preserved        │ │
   └────────────┬───────────────┘   └──────────────┬───────────────┘ │
                │                                   │                 │
                └─────── consumers read ctx.X ──────┴── DESTRUCTURE ──┘
                         (destructure-trap PRESERVED — Wave 3 codemod audits)

   * getRoute migration is Phase 97 (CTX-08) — contexts keep fromStore(getRoute) this phase.
  ** candidateContext preregistration sessionStorageWritable usage: see Open Question Q1.
```

### Recommended Project Structure (files touched — no new dirs)
```
apps/frontend/src/lib/contexts/
├── utils/persistedState.svelte.ts        # ADD sessionStorageState (1-liner) + test
├── app/survey.svelte.ts                   # drop fromStore/toStore; .current internals
├── app/tracking/trackingService.svelte.ts # drop fromStore/toStore; .current internals
├── voter/voterContext.svelte.ts           # drop fromStore(appSettings|locale); sessionStorageState
└── candidate/candidateContext.svelte.ts   # drop fromStore(appSettings|locale); keep getRoute bridge
```

### Pattern 1: `.current` getter exposure (survey + trackingService internals — CTX-06)
**What:** Read upstream reactive values inside `$derived`/`$derived.by` via the Tier-1 `.current` getters instead of `fromStore(store).current`. Expose own derived values via `{ get current() }` (or, where the EXPORTED surface must stay store-shaped, via a `toStore` bridge — see Pitfall 1).
**When to use:** Both secondary bridges.
**Example (survey delta):**
```ts
// apps/frontend/src/lib/contexts/app/survey.svelte.ts (current → migration shape)
// BEFORE (survey.svelte.ts:1,15-16,23):
//   import { fromStore, toStore } from 'svelte/store';
//   const appSettingsReactive = fromStore(appSettings);
//   const sessionIdReactive = fromStore(sessionId);
//   ... return toStore(() => linkValue);
//
// AFTER — the inputs `appSettings`/`sessionId` are now rune-context handles with
// `.current` getters (Tier-1 / trackingService). Read them directly; expose via getter.
// NB: if SurveyButton/VoterNav still read `$surveyLink`, keep a toStore bridge at the
// appContext seam (Pitfall 1). The PRODUCER drops fromStore; the SEAM keeps the shape.
```
[CITED: migration-inventory-and-order.md §Tier-2 survey row; VERIFIED: survey.svelte.ts read this session]

### Pattern 2: Orchestrator factory — `fromStore` → `getXContext().current` (CTX-07)
**What:** The orchestrator pulls upstream contexts via `getAppContext()` / `getDataRootContext()`, reads their `.current` getters inside `$derived.by`, and exposes every `$state`/`$derived` field as a `get foo()` accessor.
**When to use:** `voterContext` + `candidateContext`.
**Migration delta (verbatim from the read source):**
- `voterContext.svelte.ts:5,46-47`: delete `import { fromStore } from 'svelte/store'`; replace `const appSettingsState = fromStore(appSettings)` / `const localeState = fromStore(locale)` with reads of `appSettings.current` / `locale.current` (the Tier-1 getters). All `appSettingsState.current.X` → `appSettings.current.X` (≈10 sites: `:56,99,368,371,399,403,409`), `localeState.current` → `locale.current` (`:423`).
- `voterContext.svelte.ts:17,241-242`: replace `sessionStorageWritable('voterContext-firstQuestionId', null) + fromStore(...)` with `const _firstQuestionId = sessionStorageState('voterContext-firstQuestionId', null as Id | null)`. Reads `firstQuestionIdState.current` → `_firstQuestionId.current` (`:300,522`); writes `_firstQuestionId.set(...)` map 1:1 (`:482,525`).
- `candidateContext.svelte.ts:5,47-49`: delete `fromStore`; replace `fromStore(appSettings)`/`fromStore(locale)` reads with `.current`. **KEEP `fromStore(getRoute)`** (getRoute migrates Phase 97 — see Open Question Q2 for whether a temporary local bridge is needed once `svelte/store` import is dropped).
**Example (spike-007 verified factory shape):**
```ts
// Source: context-orchestration.md (spike 007, browser-verified cascade)
export function initVoterContext(): VoterContext {
  const appSettings = getAppContext().appSettings;   // Tier-1 .current getter (post-Wave-1)
  const dataRoot = getDataRootContext();             // .current / .instance split
  const _firstQuestionId = sessionStorageState('voterContext-firstQuestionId', null as Id | null);
  const _opinionQuestions = $derived.by(() => { /* reads appSettings.current.X, dr.current */ });
  return setContext(CONTEXT_KEY, {
    get opinionQuestions() { return _opinionQuestions; },   // reactive accessor — read via ctx.X
    get firstQuestionId() { return _firstQuestionId.current; },
    set firstQuestionId(v) { _firstQuestionId.set(v); }
    // ... 18+/30+ accessors
  });
}
```
[CITED: context-orchestration.md; VERIFIED: voterContext.svelte.ts + candidateContext.svelte.ts read this session]

### Pattern 3: Destructure-trap PRESERVATION (CTX-07 / D-04 / L-7)
**What:** The rune-native contexts reproduce the CLAUDE.md "Context Destructuring Rule" identically. Reactive accessors (`selectedElections`, `opinionQuestions`, `matches`, `profileComplete`, `firstQuestionId`, …) MUST be read via `ctx.X` (inside a `$derived` alias); stable refs (`t`, `getRoute`, `answers`, mutators) may be destructured.
**When to use:** Do NOT change any consumer this phase. Leave the trap in place. Spike 007 proved it reproduces identically in the rune-native version; the Wave-3 codemod audits it.
**Anti-pattern (do NOT do):** "fixing" the destructure trap, or adding a new spread-of-context. The existing `...appContext` / `...authContext` spreads in the orchestrators (`voterContext.svelte.ts:494`, `candidateContext.svelte.ts:374-375`) are pre-existing and re-snapshot getters at spread time — see Pitfall 4.
[CITED: CLAUDE.md Context Destructuring Rule; context-orchestration.md "What to Avoid" #1; CONTEXT.md D-04]

### Anti-Patterns to Avoid
- **`$effect` for persistence in survey/tracking/`sessionStorageState`:** write imperatively from `set`/`update`. `$effect` doesn't run in non-component factory contexts and doesn't run on the server. [CITED: persistent-rune-stores.md "What to Avoid" #1]
- **Reading `page` as a single value in a tracking scope:** the getRoute `toStore` short-circuit trap. Not relevant this phase (getRoute stays bridged), but don't introduce new `page` whole-value reads. [CITED: SKILL.md spike 012]
- **`structuredClone` of `$state` proxies:** N/A this phase (answer stores already migrated), but the rule stands. [CITED: persistent-rune-stores.md L-4]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| sessionStorage persistence with versioned payload + browser gate | A fresh `runeSessionStorage` with inline `readVersioned`/`writeVersioned` | `sessionStorageState` = `storageState('sessionStorage', …)` over the EXISTING core | The core (`persistedState.svelte.ts:91`) already does the `browser` gate + JSON round-trip + type branch; duplicating it diverges from `localStorageState` and re-introduces bugs Phase 95 closed [VERIFIED: persistedState.svelte.ts] |
| Bridging a rune value to `$store` consumers | Manual `subscribe`/notify plumbing | `toStore(() => value)` at the appContext seam (temporary, deleted Phase 98) | `toStore` is the sanctioned temporary bridge per the Wave-1 precedent (appContext keeps 9 of them) [VERIFIED: appContext.svelte.ts:236-254; CITED: 95-PATTERNS "Temporary store-shaped bridge"] |
| Question-chain / matching / filter derivations | Rewriting the `$effect` mirrors or `$derived.by` chains | KEEP them verbatim | They are already rune-native and behavior-locked (Phase 61/64/88 regressions encoded in the comments). This phase only swaps the `fromStore` *inputs*, not the derivation bodies [VERIFIED: voterContext.svelte.ts:78-347] |

**Key insight:** The risky logic (election/constituency selection, question blocks, matching, filter init, preregistration) is ALREADY rune-native and was hardened across Phases 61/64/88. Phase 96 is a **surface swap at the input boundary** — drop `fromStore`, read `.current`. Touching the derivation internals is out of scope and regression-prone.

## Runtime State Inventory

> This is a code-only rune refactor. No data migration, no service reconfiguration. Categories below verified explicitly.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | **localStorage/sessionStorage keys unchanged** — `voterContext-firstQuestionId` (session), `candidateContext-preselectedElectionIds`/`-preselectedConstituencyIds` (session), `candidateContext-isPreregistered` (local), `appContext-sessionId` (session). `sessionStorageState` reads/writes the SAME keys with the SAME raw (non-versioned) session payload shape. | None — keys + payload shape preserved (the session branch is not version-wrapped: `saveItemToStorage:195`). Per D-03/K1 a stale localStorage payload is tolerable, but session keys are unchanged anyway. |
| Live service config | None — no external service (n8n, Datadog, etc.) references these symbols. | None — verified: targets are frontend `lib/contexts/**` files only. |
| OS-registered state | None. | None. |
| Secrets/env vars | None — no env var names reference these contexts. | None. |
| Build artifacts | None — TypeScript source only; no compiled package egg-info or binary carries these names. | None — `apps/frontend` builds fresh via Vite. |

**The canonical question — "after every file is updated, what runtime systems still have the old string cached?":** Nothing. Storage keys are unchanged; the only behavioral change is the in-memory bridge shape. No re-registration, no migration.

## Common Pitfalls

### Pitfall 1: Dropping `toStore` from survey/tracking breaks `$store` consumers (CTX-06)
**What goes wrong:** Naively deleting `toStore(() => linkValue)` from `survey.svelte.ts` and `toStore(...)` from `trackingService` breaks `$surveyLink` in `SurveyButton.svelte:53` + `VoterNav.svelte:103`, and `sendTrackingEventStore.set(...)` / `$store` reads in `routes/+layout.svelte:54,74,155`. These consumers are NOT migrated until Wave 3 (Phase 97 codemod).
**Why it happens:** The binding constraint bans `svelte/store` in *migrated contexts*, but the *exported surface* must stay store-shaped until consumers migrate — exactly the Wave-1 precedent where appContext kept 9 `toStore` bridges.
**How to avoid:** Make the PRODUCER internals pure-rune (drop `fromStore` over inputs, expose `.current`), but keep the EXPORTED surface store-compatible. Two viable seams: (a) keep the `toStore(() => …)` on the producer's return (minimal-diff: producer still imports `toStore` — acceptable as a Wave-2 *temporary bridge* deleted Phase 98, BUT note this technically retains a `svelte/store` import in the file — see Open Question Q3), or (b) move the `toStore` wrap up to the `appContext` seam (`appContext.svelte.ts:148-150,254`) so the producer file is fully `svelte/store`-free and appContext owns the bridge (consistent with appContext already owning 9 bridges). **Recommendation: option (b)** — keeps CTX-06's literal "no `fromStore`/`toStore` in survey/trackingService" wording satisfied AND honors the Wave-1 bridge-ownership pattern. The survey/tracking `.type.ts` files keep `Readable`/`Writable` until Phase 98.
**Warning signs:** `yarn check` errors on `$surveyLink` / `sendTrackingEvent.set`; E2E survey-button or analytics specs failing.

### Pitfall 2: `sessionStorageState` SSR returns default → `firstQuestionId` null on server (CTX-07)
**What goes wrong:** `sessionStorage` is browser-only; `getStorage('sessionStorage')` returns `null` on the server (`persistedState.svelte.ts:202-203`), so `firstQuestionId` initializes to `null` during SSR.
**Why it happens:** This is correct and matches the legacy `sessionStorageWritable` behavior (same `browser` gate). The question-block `$effect` reading `firstQuestionIdState.current` (`voterContext.svelte.ts:300`) already tolerates a null first id (`if (firstId)` guard).
**How to avoid:** No action — preserve the `browser`-gate semantics by reusing the core. Verify the `if (firstId)` guard path in the block-ordering `$effect` is untouched.
**Warning signs:** Hydration mismatch warning on `/questions` if the block ordering were made to depend on a server-vs-client-divergent value — but the existing guard prevents this.

### Pitfall 3: Reactive data populates POST-hydration via `$effect` — E2E timing (CTX-07)
**What goes wrong:** The orchestrators' `selectedElections`/question-chain `$state` mirrors are written by `$effect`s that run only after the protected layout populates `dataRoot` + `userData` post-hydration. Tests (or consumers) that read context accessors synchronously at mount see empty arrays.
**Why it happens:** Documented root cause of the Phase 61 destructure bug (`candidateContext.svelte.ts:107-124`). `$effect` is client-only and runs after hydration; this is by design.
**How to avoid:** Don't change the `$effect` mirror pattern. For any new unit test of the contexts, drive the cascade and assert AFTER an effect flush (spike-007 used the seeded `default` template + button-click cascade). Prefer E2E for end-to-end cascade assertions; unit-test `sessionStorageState` + survey-link derivation in isolation.
**Warning signs:** Flaky "expected 18 questions, got 0" assertions; consumers rendering empty until first interaction.

### Pitfall 4: Pre-existing context spreads re-snapshot getters (CTX-07 / L-5)
**What goes wrong:** `voterContext.svelte.ts:494` (`...appContext`) and `candidateContext.svelte.ts:374-375` (`...appContext, ...authContext`) spread the upstream context. Object spread invokes each getter ONCE at spread time, de-reactivating any plain-value props (the spike-009 anti-pattern).
**Why it happens:** Spread snapshots. The contexts work today because the spread props that matter are themselves re-declared as getters AFTER the spread (e.g. `appSettings`, `locale` are overridden as store-wrapped versions in appContext's own return; the orchestrators re-declare their reactive accessors as getters after the spread).
**How to avoid:** Do NOT introduce NEW spreads, and do NOT remove the explicit getter re-declarations that follow the spread. This is a known, tolerated, pre-existing pattern — fixing it (AdminNav + adminContext) is Phase 98 (Wave 4), not this phase. Keep the spread + explicit-getter order exactly as-is. [CITED: 95-PATTERNS L-5; consumer-migration-codemod.md spike 009]
**Warning signs:** A reactive accessor that previously updated stops updating after you "cleaned up" a spread — revert.

## Code Examples

### `sessionStorageState` (CTX-07 helper — the one new symbol)
```ts
// Source: persistedState.svelte.ts:75 (localStorageState sibling) + 91 (shared core)
export function sessionStorageState<TValue>(key: string, defaultValue: TValue): PersistedState<TValue> {
  return storageState('sessionStorage', key, defaultValue);
}
// storageState already: reads via getItemFromStorage('sessionStorage', key) (raw, non-versioned),
// writes via saveItemToStorage('sessionStorage', key, v) (undefined→null), browser-gated.
```

### voterContext `firstQuestionId` swap (CTX-07)
```ts
// Source: voterContext.svelte.ts:17,241-242,300,482,521-526 (verified this session)
// BEFORE:
import { sessionStorageWritable } from '../utils/persistedState.svelte';
const _firstQuestionId = sessionStorageWritable('voterContext-firstQuestionId', null as Id | null);
const firstQuestionIdState = fromStore(_firstQuestionId);
// reads: firstQuestionIdState.current   writes: _firstQuestionId.set(v)
// AFTER:
import { sessionStorageState } from '../utils/persistedState.svelte';
const _firstQuestionId = sessionStorageState('voterContext-firstQuestionId', null as Id | null);
// reads: _firstQuestionId.current        writes: _firstQuestionId.set(v)  (1:1)
// getter/setter on context (:521-526) become get→_firstQuestionId.current / set→_firstQuestionId.set(v)
```

### appSettings input read (both contexts, CTX-07)
```ts
// Source: voterContext.svelte.ts:46,56 (verified)
// BEFORE: const appSettingsState = fromStore(appSettings);
//         ... !appSettingsState.current.elections?.disallowSelection ...
// AFTER:  (appSettings is now appContext's .current-getter handle post-Wave-1)
//         ... !appSettings.current.elections?.disallowSelection ...
// Apply across all appSettingsState.current.X sites (:56,99,368,371,399,403,409) and localeState (:423).
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `$state → sessionStorageWritable → fromStore` 3-layer for `firstQuestionId` | `sessionStorageState(...)` single handle | This phase (CTX-07) | One symbol, no `fromStore`, `.current`/`.set`/`.update` |
| `fromStore(appSettings)` / `fromStore(locale)` in orchestrators | Read Tier-1 `.current` getters directly | This phase (CTX-07) | Zero `svelte/store` in voter/candidate contexts |
| `fromStore(appSettings) + toStore(linkValue)` in survey/tracking | `.current` reads; bridge owned at appContext seam | This phase (CTX-06) | Producer files `svelte/store`-free (recommended seam) |
| `localStorageWritable`/`sessionStorageWritable` (`toStore`+`subscribe`) | KEPT this phase; DELETED Phase 98 | Wave 4 | Still consumed by `userPreferences`, candidate preregistration ids, tracking sessionId |

**Deprecated/outdated but RETAINED until later waves:**
- `sessionStorageWritable` — still used by `candidateContext` preregistration ids + `trackingService.sessionId` (`appContext-sessionId`). Whether candidate preregistration ids migrate to `sessionStorageState` THIS phase or stay on `sessionStorageWritable` is Open Question Q1.
- `getRoute` `fromStore` — stays bridged; migrates Phase 97 (CTX-08).

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The recommended bridge seam for survey/tracking is the appContext seam (option b), making producer files fully `svelte/store`-free | Pitfall 1 | If planner prefers option (a) (producer keeps `toStore`), CTX-06's "no `toStore` in survey/trackingService" wording is violated. LOW risk — both are valid bridges; this is a discretion call the planner should lock. |
| A2 | candidateContext preregistration `sessionStorageWritable` (`:75-84`) may stay on the legacy helper this phase (only `firstQuestionId` is named in CTX-07) | Open Q1 / State of the Art | If it must also move to `sessionStorageState` now, Plan B is slightly larger. LOW — CTX-07 only names `firstQuestionId`; the others are not regressions if left until Phase 98. |
| A3 | candidateContext can drop the `svelte/store` import even while keeping `fromStore(getRoute)` — i.e. getRoute is read some other way, OR `fromStore(getRoute)` is the one tolerated remaining bridge | Open Q2 | If `fromStore(getRoute)` must stay, the file still imports `fromStore` and is NOT fully `svelte/store`-free until Phase 97 — acceptable per wave ordering but the planner must state it explicitly. MEDIUM — affects CTX-06/07 "zero import" claim for candidateContext specifically. |

## Open Questions

1. **Does candidateContext preregistration session-state migrate to `sessionStorageState` this phase?**
   - What we know: CTX-07 explicitly names only `voterContext.firstQuestionId`. `candidateContext.svelte.ts:75-84` also uses `sessionStorageWritable` for `preselectedElectionIds`/`preselectedConstituencyIds`, plus `localStorageWritable` for `isPreregistered` (`:287`).
   - What's unclear: Whether "candidateContext is a rune-native factory with zero `svelte/store`" (CTX-07) requires migrating these too, or whether they ride the legacy helper until Phase 98.
   - Recommendation: **Migrate them in Plan B** if the goal is a fully `svelte/store`-free candidateContext file (they're the same `sessionStorageState`/`localStorageState` swap, 1:1). If scope-minimizing, leave them — but then `candidateContext` is NOT `svelte/store`-free this phase. Planner should lock this; migrating is low-risk and advances the K1 end-state.

2. **getRoute in candidateContext — how to read it without `fromStore` before Phase 97?**
   - What we know: `candidateContext.svelte.ts:48,261,273,279,313,322` use `getRouteState = fromStore(getRoute)` then `getRouteState.current(...)`. getRoute migrates to rune-native Phase 97 (CTX-08, deferred).
   - What's unclear: Can candidateContext drop `import { fromStore }` while getRoute is still a store? Until getRoute is rune-native, `fromStore(getRoute)` is the only way to read it reactively.
   - Recommendation: **Keep `fromStore(getRoute)` (and the `svelte/store` import) in candidateContext this phase** as the one tolerated Wave-2 bridge; document it as a Phase-97 follow-up. The spike inventory explicitly orders getRoute AFTER the Tier-2 contexts (Wave 3). This means candidateContext is "rune-native except the getRoute input" this phase — verify the planner phrases CTX-07 acceptance accordingly (drop `fromStore(appSettings)`/`fromStore(locale)`, keep `fromStore(getRoute)`).

3. **Survey/tracking bridge ownership — producer `toStore` vs appContext seam?**
   - What we know: SurveyButton/VoterNav/+layout consume the store-shaped surface until Wave 3.
   - Recommendation: appContext seam (Pitfall 1 option b) to satisfy CTX-06's literal "no `toStore` in survey/trackingService" — but confirm with the planner; it's a clean discretion call.

## Environment Availability

> No external runtime dependencies. The phase touches frontend TypeScript only. `yarn`, `vitest`, and `playwright` are the existing toolchain (CLAUDE.md). No new tools, services, or ports.

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Svelte 5 / SvelteKit 2 | runes + `$app/state` | ✓ | repo-pinned | — |
| vitest | unit tests | ✓ | repo-pinned | — |
| Playwright | E2E green-gate | ✓ | repo-pinned | — |

## Validation Architecture

> nyquist_validation is enabled (no `false` in config). Section included.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest (unit) + Playwright (E2E) |
| Config file | `apps/frontend/vitest.config.ts` / `tests/playwright.config.ts` |
| Quick run command | `yarn workspace @openvaa/frontend test:unit --run` |
| Full suite command | `yarn test:unit` then `yarn test:e2e` (E2E = no-behavior-regression gate vs v2.10 baseline, DX-4) |
| Phase gate | Full unit suite green + `yarn check` no NEW errors vs Phase-95 close baseline (150 errors / 29 warnings pre-existing) + existing E2E green |

### Success-Criterion → Validation Map
| Success Criterion (from phase goal) | Requirement | Validation Type | Automated Command / Assertion | File Exists? |
|------|------|------|------|------|
| `survey` + `trackingService` have zero `svelte/store` *input* bridges (`fromStore`/`toStore` over appSettings/sessionId/userPreferences); values exposed via `.current` | CTX-06 | source assertion (grep) + unit | `grep -c "fromStore" survey.svelte.ts trackingService.svelte.ts` → 0 (input side); survey-link derivation unit test | ❌ Wave 0 (survey/tracking unit tests) |
| `sessionStorageState` sibling exists, reuses the versioned core, backs `voterContext.firstQuestionId` | CTX-07 | unit (RED→GREEN) | `grep -c "export function sessionStorageState" persistedState.svelte.ts` → 1; round-trip + browser-gate unit test in `persistedState.svelte.test.ts` | ❌ Wave 0 (add session cases) |
| `voterContext` + `candidateContext` drop `fromStore(appSettings)`/`fromStore(locale)`; expose 18+/30+ reactive accessors as getters | CTX-07 | source assertion (grep) | `grep -c "fromStore(appSettings\|fromStore(locale" voterContext.svelte.ts candidateContext.svelte.ts` → 0; getter count unchanged | ✅ (grep) |
| Destructure-trap reproduces identically and is preserved (consumers read `ctx.X`) | CTX-07 / D-04 | E2E (existing) + no-change assertion | Existing voter/candidate journey E2E stays green; NO consumer file modified (Wave 3) | ✅ (E2E) |
| Existing E2E stays green (no behavior regression) | DX-4 | E2E full suite | `yarn test:e2e` matches v2.10 baseline (82 passed / 2 skipped) | ✅ (E2E) |

### Sampling Rate
- **Per task commit:** `yarn workspace @openvaa/frontend test:unit --run` (~30–90s)
- **Per plan/wave merge:** `yarn test:unit` + `yarn check` (NEW-error diff vs Phase-95 baseline)
- **Phase gate:** full unit green + existing E2E green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `persistedState.svelte.test.ts` — ADD `sessionStorageState` cases (default fallback, set/update round-trip, browser-gate SSR→default, raw non-versioned session payload). Extends the existing file (already has `localStorageState` cases). Covers CTX-07 helper.
- [ ] `survey.svelte.test.ts` (NEW) — survey-link derivation: `linkTemplate` + `sessionId` interpolation, `undefined` when unconfigured. Covers CTX-06 survey in isolation (no `$effect`/cascade needed).
- [ ] `trackingService.svelte.test.ts` (NEW, optional) — `shouldTrack` gating (`browser && trackEvents && consent==='granted'`) as a pure derivation; `startEvent`/`submitAllEvents` queue behavior. Covers CTX-06 tracking.
- [ ] voterContext/candidateContext: NO new unit test required — the cascade is `$effect`-post-hydration (Pitfall 3); rely on existing E2E for end-to-end. (If a unit smoke is wanted, drive the spike-007 seeded cascade and assert after effect flush.)

*Existing infrastructure covers consumer behavior (E2E). The grep source-assertions are the primary automated gate for the "zero `svelte/store`" criteria.*

## Security Domain

> `security_enforcement` not disabled in config — section included. This phase is a client-side reactive refactor with no new attack surface.

### Applicable ASVS Categories
| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | candidateContext delegates auth to existing `authContext`/`dataWriter` — unchanged |
| V3 Session Management | no | session id (`appContext-sessionId`) generation unchanged; only the in-memory bridge shape changes |
| V4 Access Control | no | no access-control logic touched |
| V5 Input Validation | partial | `sessionStorageState` reads untrusted `sessionStorage` JSON — reuses the existing `getItemFromStorage` try/catch + (for localStorage) version gate; session payloads are raw JSON-parsed with try/catch (`persistedState.svelte.ts:156-160`). No new validation surface vs legacy `sessionStorageWritable`. |
| V6 Cryptography | no | none |

### Known Threat Patterns for this stack
| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Untrusted `sessionStorage`/`localStorage` payload deserialized into app state | Tampering | Existing `try/catch` parse + `browser` gate + (localStorage) version expiry — reused, not re-implemented (Phase 95 precedent T-95-03-02 accepted: stale payload → default). [VERIFIED: persistedState.svelte.ts:156-180] |
| XSS via survey link template interpolation | Injection | `surveyLink` only `.replace`s `{sessionId}` into an admin-configured `linkTemplate` from settings; rendered as `href`. No change from current behavior. Out of scope (pre-existing). |

**No new security controls required** — the migration preserves every gate and parse path of the legacy helpers.

## Sources

### Primary (HIGH confidence)
- `apps/frontend/src/lib/contexts/utils/persistedState.svelte.ts` (read full) — `storageState` core already `StorageType`-parametrized; `getItemFromStorage`/`saveItemToStorage` session vs local branches.
- `apps/frontend/src/lib/contexts/app/survey.svelte.ts` (read full, 24 ln) — `fromStore`×2 + `toStore` return.
- `apps/frontend/src/lib/contexts/app/tracking/trackingService.svelte.ts` (read full, 132 ln) — `fromStore`×3 + `toStore`×2; `sessionStorageWritable('appContext-sessionId')`.
- `apps/frontend/src/lib/contexts/voter/voterContext.svelte.ts` (read full, 565 ln) — `fromStore(appSettings|locale)`, `sessionStorageWritable+fromStore` firstQuestionId, 18+ getters, push-`$state` mirrors, `untrack` seed-guard, `...appContext` spread.
- `apps/frontend/src/lib/contexts/candidate/candidateContext.svelte.ts` (read full, 459 ln) — `fromStore(appSettings|locale|getRoute)`, preregistration `sessionStorageWritable`×2 + `localStorageWritable`, 30+ getters, `...appContext,...authContext` spread.
- `apps/frontend/src/lib/contexts/app/appContext.svelte.ts:120-257` — the bridge seam (`tracking`, `surveyLink: survey`, 9 `toStore` exports).
- `apps/frontend/src/lib/contexts/app/tracking/trackingService.type.ts` (read full) — exported `Readable`/`Writable` surface (Wave-3/98 deletion).
- `.claude/skills/spike-findings-voting-advice-application-gsd/SKILL.md` + `references/{context-orchestration,migration-inventory-and-order,persistent-rune-stores}.md` — spike 007/010 blueprints, factory shape, bridge ownership, destructure-trap reproduction.
- `.planning/REQUIREMENTS.md` (binding constraints blockquote; CTX-06/07 lines 23-24).
- `.planning/v2.11-DECISIONS.md` (K1 naming; 96-1/96-2).
- `.planning/phases/95-domain-a-wave-1-tier-1-leaf-contexts/95-03-SUMMARY.md` + `95-01-SUMMARY.md` + `95-PATTERNS.md` + `95-VALIDATION.md` — shipped Wave-1 state, the parametrized core, bridge precedent, validation format.
- `CLAUDE.md` — Context Destructuring Rule, Svelte warning-accepted format.

### Secondary (MEDIUM confidence)
- Grep over `apps/frontend/src` for consumers of `surveyLink`/`shouldTrack`/`sendTrackingEvent`/`sessionStorageWritable` — established the bridge obligation surface (SurveyButton, VoterNav, `routes/+layout.svelte`).

### Tertiary (LOW confidence)
- None — every claim is grounded in a file read or a spike reference this session.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — `sessionStorageState` is a verified 1-liner over an existing parametrized core; zero installs.
- Architecture: HIGH — spike-007 factory shape is browser-verified; all four target files read in full this session; deltas are line-cited.
- Pitfalls: HIGH — the bridge obligation (Pitfall 1) and destructure-trap (Pitfall 4) are confirmed against actual consumer grep + the Wave-1 precedent.
- Open Questions: MEDIUM — Q1 (candidate preregistration scope) and Q2 (getRoute bridge) are genuine planner discretion calls, not knowledge gaps.

**Research date:** 2026-06-04
**Valid until:** 2026-07-04 (stable — internal refactor against a frozen spike blueprint; only invalidated if Phase 95's shipped helper shape changes)
