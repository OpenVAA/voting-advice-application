# Phase 103: `.current` Handle Codemod (HANDLE-02 + HANDLE-03) - Pattern Map

**Mapped:** 2026-06-09
**Files analyzed:** 3 work products (1 new script + ~5 declaration files + ~524 consumer sites)
**Analogs found:** 3 / 3 (every work product has a proven in-tree analog)

This phase is unusual: it has only **3 hand-authored surfaces** (the codemod script, the declaration-conform edits, the PoC-test retarget). The ~524 consumer sites are NOT hand-authored — their "pattern" is the codemod's input→output transformation, not a per-file analog. Classification and analog selection below reflect that.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `.planning/archive/phase-103-current-handle-codemod.mjs` (NEW) | utility / codemod | transform (batch regex rewrite) | `.planning/archive/spike-009-store-codemod.mjs` | exact (extend) |
| `lib/contexts/app/appContext.{svelte,type}.ts` (MODIFY) | provider | event-driven (context decl) | Phase-102 `_poc*` shapes (same file) + `adminContext.svelte.ts:112-117` | exact (PoC-proven) |
| `lib/contexts/app/tracking/trackingService.{svelte,type}.ts` (MODIFY) | provider | event-driven | `appContext` accessor pairs (B17/A8/A9) | role-match |
| `lib/contexts/data/dataContext.{svelte,type}.ts` (MODIFY) | provider | event-driven | read-only getter fold (A10/A11) | role-match |
| `lib/contexts/layout/layoutContext.{svelte,type}.ts` (MODIFY) | provider | event-driven | read-only getter fold (A12) | role-match |
| `lib/contexts/app/appContext.poc.svelte.test.ts` (MODIFY/retarget) | test | request-response | existing PoC test (retarget off `_poc*`) | exact |
| ~329 `*.svelte` + ~35 `lib/contexts/**/*.svelte.ts` consumer sites (MECHANICAL) | consumer | transform | codemod input→output (no per-file analog) | N/A |

## Pattern Assignments

### `.planning/archive/phase-103-current-handle-codemod.mjs` (utility, transform) — NEW

**Analog:** `.planning/archive/spike-009-store-codemod.mjs` (the proven, shipped-green Phase-97 codemod — 280 sites, pure-Node, dependency-free, idempotent two-pass).

**Extend it; do NOT rewrite from scratch.** Four structural pieces to copy verbatim and adapt:

**1. Config block + idempotency guard** (`spike-009` lines 44-80). The `STORE_REWRITES` array becomes the **named-handle allowlist** (the 18 A/B handles from the 102 decision record — NEVER a blanket `.current` regex). Idempotency comes from the rewrite target containing no token that re-matches: `handle.current` → `handle` (bare `handle` does not re-match `handle.current`). Replace the `$store` config with per-handle entries:
```js
// Phase-103 allowlist (from 102-DECISION-RECORD §A/§B). NOT a `.current` regex.
const READ_ONLY = ['locale','locales','darkMode','reactiveAppSettings','reactiveLocale',
  'surveyLink','sessionId','shouldTrack','dataRoot','reactiveDataRoot','routeTitle'];
const READ_WRITE = ['appSettings','appCustomization','appType','userPreferences',
  'sendTrackingEvent','openFeedbackModal'];   // getRoute handled by dedicated call-form pass
```

**2. The dedicated call-form pass** (`spike-009` lines 126-143 — the `$getRoute(` open-paren-guarded pass). This is the EXACT precedent for the `getRoute.current(opts)` → `getRoute(opts)` rewrite (LM/A6): a call form needs `(?=\()` lookahead, not the bare `(?!\w)` guard. Mirror this structure for `ctx.getRoute.current(` → `ctx.getRoute(`. Track in its own `getRouteHits` counter (lines 133, 211-213).

**3. The `m[2]` context-call capture for LM-2 disambiguation** (`spike-009` lines 155-171, `detectDestructureTraps`). The regex `/const\s*\{([\s\S]*?)\}\s*=\s*(get\w+Context)\s*\(/g` ALREADY captures `m[2]` = the context-function name. **This is the load-bearing hook for LM-2:** Pass 3 destructure rewrite must key on `m[2]` and EXCLUDE `getComponentContext` (its `darkMode`/`locale`/`locales` are already plain getters — rewriting them is the regression). Only rewrite when `m[2] ∈ {getAppContext, getVoterContext, getCandidateContext, getAdminContext}`.

**4. The `REACTIVE_ACCESSORS` source-of-truth set** (`spike-009` lines 52-80). Pass 4 (warn-only audit) reuses this. **EXTEND it** with the newly-folded reactive handles (per RESEARCH §Destructure-Trap Preservation): `darkMode, appSettings, appCustomization, appType, dataRoot, reactiveDataRoot, locale, locales, reactiveAppSettings, reactiveLocale, userPreferences, surveyLink, routeTitle, sessionId, shouldTrack`. Keep `getRoute`/`t` OFF the list (stable). CLAUDE.md's Context Destructuring Rule list MUST be updated in lockstep (single source of truth Phase-105 reads).

**New Pass 3 (destructure rewrite)** — not present in spike-009 (which only WARNED). Output form (from RESEARCH §Codemod passes):
```
const { darkMode, ...rest } = getAppContext();   →
  const ctx = getAppContext();
  const darkMode = $derived(ctx.darkMode);
  const { ...rest } = ctx;
```
Idempotency caution: output has no `const { x } = getXxxContext()` to re-match, but the rewrite must NOT double-introduce `const ctx`.

**New Pass 2 (write rewrite)** — 5 consumer write sites only:
```
handle.set(v)      →  handle = v       // /\b(<H>)\.set\(([^)]*)\)/g → '$1 = $2'
handle.update(fn)  →  handle = fn(handle)
```
**LM-7 constraint:** the 3 `userPreferences.update(...)` sites at `appContext.svelte.ts:244/254/261` are PRODUCER-INTERNAL on the local `PersistedState` handle — EXCLUDE `appContext.svelte.ts` local-handle lines from the write pass. There are ZERO external `userPreferences` writes.

**LM-1 glob scope:** UNLIKE spike-009 (which used `apps/frontend/src/**/*.svelte` at line 88), this codemod's `FILES_GLOB` MUST include `lib/contexts/**/*.svelte.ts` (~35 cross-context producer reads). Exclude `*.test.ts` / `*.poc.*` from `--apply`.

**Dry-run default + `--apply`** (`spike-009` lines 84-88, 224-227) — keep verbatim. Idempotency success criterion: `node <codemod> --apply && git diff --quiet`.

**Reference:** Phase-97 codemod precedent dir `.planning/milestones/v2.11-phases/97-domain-a-wave-3-getroute-consumer-codemod/` (97-CONTEXT.md = atomic-commit/additive-getter D-08/D-09; 97-PATTERNS.md).

---

### `lib/contexts/app/appContext.{svelte,type}.ts` (provider, event-driven) — Plan A declarations conform

**Analog 1 — Phase-102 PoC `_poc*` shapes (SAME file, already proven green on Svelte 5.53.12):**

`appContext.svelte.ts:355-366` — the three idiom shapes, already written and compiling:
```ts
get _pocDarkMode() {        // read-only fold → plain getter (A3)
  return componentCtx.darkMode;
},
get _pocAppType() {         // read-write → get/set accessor pair (B15)
  return appTypeValue;
},
set _pocAppType(v: AppType) {
  appTypeValue = v;
},
get _pocGetRoute() {        // derived fold → plain getter returning callable (A6)
  return getRoute.current;
}
```
**Plan A action:** FOLD these onto the canonical property names and DELETE the `_poc*` surfaces (both `.svelte.ts:355-366` and `.type.ts:138-150`). `_pocDarkMode` → `get darkMode()`; `_pocAppType` → `get appType()`/`set appType(v)`; `_pocGetRoute` → `get getRoute()`. The PoC is the literal template — the fold is rename + remove the old `{current}` handle object on the same key.

**Analog 2 — production accessor pair `adminContext.svelte.ts:112-117`** (raw `$state`-backed get/set, shipped green):
```ts
get userData() {
  return _userData;
},
set userData(v) {
  _userData = v;
}
```
Apply to B15 `appType`, and (read-only side) the delegating-getter form at `adminContext.svelte.ts:104-106` (`get isAuthenticated() { return authContext.isAuthenticated; }`) is the analog for cross-context read-only folds (A4/A5/A10).

**Analog 3 — PersistedState-backed accessor `candidateContext.svelte.ts:391-396`** (proven `get`→`_h.current` / `set`→`_h.set`):
```ts
get isPreregistered() {
  return _isPreregistered.current;
},
set isPreregistered(v) {
  _isPreregistered.set(v);
}
```
**This is the exact template for B16 `userPreferences`** — `get userPreferences()` → `_h.current`, `set userPreferences(v)` → `_h.set(v)`, where `_h` is the `PersistedState` handle from `utils/persistedState.svelte.ts:20-27` (KEPT; only the context-property exposure lifts).

**Type-file change (`appContext.type.ts:25-99`):** each `{ readonly current: T }` / `{ readonly current; set; update }` property collapses to its bare value type:
```ts
// BEFORE:                          // AFTER:
locale: { readonly current: string };        readonly locale: string;              // A1 read-only
appType: { readonly current: AppType;        appType: AppType;                      // B15 read-write
  set(v): void; update(fn): void };
```
Delete `_pocDarkMode`/`_pocAppType`/`_pocGetRoute` type members (`:146/148/150`).

**SSR-init invariant (B13 `appSettings` / B14 `appCustomization` — Spike 008):** the DB-override merge stays at `$state` init / the existing `$effect` reference-equality guard — do NOT move it into the new accessor. `appContext.svelte.ts:88-123` init logic untouched.

**Retained exceptions — do NOT touch:** `popupQueue` (`.type.ts:91`, E1), `reactiveDataRoot.instance` (E3), `topBarSettings` (E4, layoutContext), `candidateUserData` (E2). These keep their `{current}`/store shape; their `.current`/`.instance` reads are accepted residuals.

---

### `lib/contexts/{data,layout,app/tracking}/*.{svelte,type}.ts` (provider, event-driven) — Plan A

Same three accessor analogs as above, by class:
- `data/dataContext`: A10 `dataRoot` + A11 `reactiveDataRoot.current` fold to plain getters (analog: `adminContext:104-106` delegating getter). **E3 `.instance` retained.**
- `layout/layoutContext`: A12 `routeTitle` → plain getter (written internally by `setRouteTitle` $effect registrar). **E4 `topBarSettings` retained.**
- `app/tracking/trackingService`: A8 `sessionId` / A9 `shouldTrack` → plain getters; B17 `sendTrackingEvent` → get/set pair (shape `{current; set}`, no update — analog `adminContext:112-117`).

---

### `lib/contexts/app/appContext.poc.svelte.test.ts` (test) — Wave 0 retarget

**Analog:** the existing PoC test itself. Retarget assertions off `ctx._pocDarkMode`/`_pocAppType`/`_pocGetRoute` onto canonical `ctx.darkMode`/`ctx.appType`/`ctx.getRoute`. This is the ONLY unit proof of the round-trip — it must survive the fold (or fold into a canonical `appContext.svelte.test.ts`). EXCLUDED from `--apply`; hand-edit as a manual fix (separate commit per D-02).

---

## Shared Patterns

### Idempotent regex rewrite (no AST)
**Source:** `.planning/archive/spike-009-store-codemod.mjs`
**Apply to:** the entire codemod script.
Pure-Node `globSync` + per-target `RegExp` with negative-lookbehind/lookahead guards (lines 106-109). Idempotency = rewrite target contains no re-matching token. Dependency-free; matches the shipped Phase-97 precedent. AST (ts-morph) is NOT used — `m[2]` context-call capture (line 155) handles LM-2 disambiguation.

### Context-property accessor idiom
**Source:** `adminContext.svelte.ts:112-117` (raw `$state`), `candidateContext.svelte.ts:391-396` (PersistedState-backed), Phase-102 `appContext.svelte.ts:355-366` (PoC-proven)
**Apply to:** all Plan A declaration conforms.
Read-only → `get x() { return _val; }`. Read-write → `get x()` + `set x(v)` pair AT THE CONTEXT-PROPERTY LEVEL. PersistedState-backed → delegate `get`→`_h.current`, `set`→`_h.set`.

### Atomic conform+codemod commit (green at every boundary)
**Source:** `.planning/milestones/v2.11-phases/97-domain-a-wave-3-getroute-consumer-codemod/97-CONTEXT.md` (D-08/D-09)
**Apply to:** the single mechanical codemod commit (D-02).
A single TS key cannot be both `{current}` object AND flat getter (102 PoC empirical — forced `_poc*` names). So the declaration flip + consumer codemod for a handle MUST ride the SAME commit (Sequence 1). Before = old `{current}` + `.current` consumers (green); after = flat getters + `ctx.x` consumers (green). No red intermediate. Manual-fix commits (non-codemod-reachable cross-context `.svelte.ts` reads) land FIRST as separate commits.

### Destructure-trap preservation (LM-3)
**Source:** `adminContext.svelte.ts:100-106` (the AdminNav fix — `get isAuthenticated()` delegating getter, comment lines 100-103 document the exact bug), CLAUDE.md "Context Destructuring Rule"
**Apply to:** Pass 3 (destructure rewrite) + Pass 4 (audit) of the codemod.
Reactive accessors read via `$derived(ctx.X)`, NEVER destructured. `getRoute`/`t`/stable stores STAY destructured. Pass 4 `REACTIVE_ACCESSORS` audit must report 0 traps.

## No Analog Found

None. Every work product has a proven in-tree analog. The ~524 consumer sites have no per-file analog by design — they are mechanically transformed by the codemod (input→output is the spec).

## Metadata

**Analog search scope:** `.planning/archive/`, `apps/frontend/src/lib/contexts/{app,admin,candidate,data,layout}/`, `apps/frontend/src/lib/contexts/utils/`, `.planning/milestones/v2.11-phases/97-*/`
**Files scanned:** spike-009 codemod, persistedState, adminContext, candidateContext, appContext.{svelte,type}.ts, 102-DECISION-RECORD, 103-CONTEXT/RESEARCH
**Pattern extraction date:** 2026-06-09
