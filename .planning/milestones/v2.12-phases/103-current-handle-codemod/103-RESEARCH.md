# Phase 103: `.current` Handle Codemod (HANDLE-02 + HANDLE-03) - Research

**Researched:** 2026-06-09
**Domain:** Svelte 5 runes context-handle idiom conformance + idempotent consumer codemod (frontend-only)
**Confidence:** HIGH — scope is fully pinned by the Phase 102 decision record + PoC; the codemod technique is a shipped, green precedent (Phase 97); all counts re-verified against the live tree on 2026-06-09.

## Summary

This phase has zero open research questions about *what* to do — the Phase 102 decision record is the authoritative, user-approved per-handle scope (a named-handle allowlist, NOT a `.current` regex), and the Phase 102 PoC empirically proved all three target idioms (read-only fold, get/set accessor pair, derived fold) compile green on the installed Svelte 5.53.12. The research that *was* needed: (1) confirm the live counts so the planner can write zero-residual assertions, (2) surface the one non-obvious finding from the 102 PoC that reshapes the codemod, and (3) map the exact green-at-every-commit sequence.

**The reshaping finding (from the 102 PoC SUMMARY):** the codemod is NOT just a `handle.current` → `handle` rewrite. The canonical handles are **also destructured** by consumers (`const { darkMode, appType } = getAppContext()`). Folding a handle's context property to a getter while a consumer destructures it trips the CLAUDE.md destructure trap (getter invoked once at destructure time → stale snapshot). So the codemod has **two rewrite passes per handle**: (A) rewrite `ctx.x.current` → `ctx.x` reads, AND (B) rewrite `const { x } = getXxxContext()` destructures → `const x = $derived(ctx.x)` (or direct `ctx.x` reads). This is the single most important fact for the planner — it's why the conform step and the codemod must land atomically per handle, mirroring Phase 97's additive-getter atomic-commit.

**Primary recommendation:** Follow D-04's two-plan split. **Plan A (declarations conform):** lift each migrated handle from a `{ readonly current; set?; update? }` object property to a context-property-level getter (read-only) or get/set accessor pair (read-write) on the `setContext(...)` return object — using the Phase-97 additive-getter atomic-landing so the tree never goes red. **Plan B (consumer codemod):** extend the archived `spike-009-store-codemod.mjs` with a per-handle `.current`-read rewrite pass + a destructure-rewrite pass scoped to the named allowlist, auto-apply in ONE mechanical commit (D-01/D-02), gated by `yarn build` (frontend) + `yarn lint:check` + a single full E2E pass (K3), separate commits for each manual fix.

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **🔒 HANDLE-02 (idiom conformance):** read-only handles expose a plain reactive getter (`ctx.x`); read-write handles expose a get/set accessor pair **at the context-property level** (`ctx.x` read, `ctx.x = v` write — R1). Target = **zero `.current`** on both classes, EXCEPT the spike-documented retained exceptions (E1–E4). The exact per-handle transformation list IS the Phase 102 decision record — this phase does not re-decide it.
- **D-01 (DEVIATION):** Auto-apply the codemod and commit, gated by `typecheck` + `lint` + full E2E — NO pre-commit blocking human review. The DX-5 diff review is satisfied post-apply at the per-phase PR. Run a single E2E pass as cheap validation right after the codemod lands (K3 mid-chain validation).
- **🔒 HANDLE-03:** codemod is idempotent (re-run = no-op); build green at EVERY commit boundary (additive-getter / atomic-rewrite techniques allowed, mirroring v2.11 Phase 97).
- **D-02:** ONE commit for the mechanical codemod rewrite + SEPARATE commits for each manual fix. Clean revert boundary.
- **D-03:** Archive the codemod script under `.planning/` (single-use, kept for provenance). Phase 105 ESLint guard (SWEEP-03) takes over ongoing protection.
- **D-04:** TWO plans — (a) conform the handle DECLARATIONS to the chosen idiom; (b) codemod the ~423 consumer sites. Small risky surface-change separated from the large mechanical sweep; each independently green-able.
- **🔒 destructure-trap invariant:** consumers read reactive accessors via `ctx.X`, never destructure them. Verifiable against the CLAUDE.md "Context Destructuring Rule" patterns; existing E2E stays green.

### Claude's Discretion

- Exact archive path under `.planning/` for the codemod script (Phase 97 precedent: `.planning/archive/spike-009-store-codemod.mjs` — already exists; suggest `.planning/archive/phase-103-current-handle-codemod.mjs`).
- Whether the additive-getter bridge technique is needed per handle to preserve green-at-every-commit (decided by the Phase 102 PoC findings — the PoC confirms it is the safe default).

### Deferred Ideas (OUT OF SCOPE)

- Renaming the server-side `jobStore` / `cookieStore` test mock (K2).
- Any `packages/**` changes (frontend-only — K1).
- Component-API refactors (`export let`→`$props`, `<slot>`→snippets) — already complete.
- Forcing `.current` removal where the spike deems it infeasible (E1–E4 retained exceptions — R1).
- Behavioral / UX changes — pure refactor; the green gate is the contract.
- The `openFeedbackModal` "Refactor when Cand App is refactored" TODO (B18) — the idiom fold applies, but the broader refactor is out of milestone.

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| HANDLE-02 | Every migratable context handle conforms to the chosen idiom (read-only → plain getter; read-write → get/set pair); no residual `svelte/store` shape; spike-exempted handles documented. | Plan A (declarations conform). Per-handle catalog in §"Per-Handle Transformation Catalog"; conform mechanics in §"Plan A: Declarations Conform"; retained exceptions E1–E4 enumerated. |
| HANDLE-03 | All consumer read/write sites converted via an idempotent codemod; build green at every commit boundary; CLAUDE.md destructure-trap contract preserved. | Plan B (codemod). Idempotency mechanism + green-sequence in §"Codemod Mechanism"; destructure-trap preservation in §"Destructure-Trap Preservation"; validation in §"Validation Architecture". |

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Context-handle declaration shape | Frontend Server + Client (SvelteKit context factories `lib/contexts/**/*.svelte.ts`) | — | Contexts are created in component-init (`setContext`) and read in both SSR and CSR; the handle declaration is the single source of truth for both. |
| `.current` consumer reads (templates + script) | Client / Frontend Server (`*.svelte` files) | Frontend (`lib/contexts/**/*.svelte.ts` cross-context reads) | Reads happen in component templates (CSR/SSR render) and inside downstream context producers that consume appContext handles. |
| Reactive-accessor destructure-trap contract | Client (`*.svelte` consumer files) | — | The trap manifests only where a reactive getter is destructured at component init; pure render-tier concern. |
| Write surface (set/update) | Client (3 root `+layout.svelte` + 1 `+layout.svelte` ref-wiring) + Frontend (producer-internal `userPreferences.update`) | — | Writes are localized: `appType.set` in the 3 app-root layouts, `sendTrackingEvent.set`/`openFeedbackModal.set` in the root layout, `userPreferences.update` inside the appContext producer. |

## Codebase Reality (verified 2026-06-09)

> All counts via `grep`/Node AST scan over `apps/frontend/src/**`. The Phase-102 decision-record figure of "~423 real context-handle reads" reconciles with the live tree below (`.current` reads of migrated handles = 428 raw, minus test files and the appContext.type.ts/PoC self-references ≈ 423 production reads).

### Per-handle inventory — `.current` reads + destructure sites

| # | Handle | Class | `.current` reads | Destructure sites | Notes |
|---|--------|-------|------------------|-------------------|-------|
| A1 | `locale` | read-only → getter | 7 | 10 | Some destructures are from ComponentContext (`getComponentContext()`) where `locale` is ALREADY a plain getter — see landmine §LM-2. |
| A2 | `locales` | read-only → getter | 2 | 3 | |
| A3 | `darkMode` | read-only → getter | 9 | 7 | **appContext** `darkMode` is `{current}`; **ComponentContext** `darkMode` is ALREADY a plain `boolean` getter — DO NOT rewrite ComponentContext consumers (LM-2). |
| A4 | `reactiveAppSettings` | read-only → getter | 10 | 0 | Read-only mirror over the same `$state` as `appSettings`. Pure `.current` reads, mostly in downstream contexts. |
| A5 | `reactiveLocale` | read-only → getter | 2 | 0 | Read-only mirror. |
| A6 | `getRoute` | read-only fold → callable getter | 154 | 32 | **Highest-leverage.** `ctx.getRoute.current(opts)` → `ctx.getRoute(opts)`. Destructuring `getRoute` is SAFE (stable callable per CLAUDE.md) — destructure sites do NOT need rewriting, only the `.current` call-form does. |
| A7 | `surveyLink` | read-only → getter | 2 | 1 | `ReactiveHandle<T>` alias. |
| A8 | `sessionId` | read-only → getter | 3 | 0 | From `TrackingService`. |
| A9 | `shouldTrack` | read-only → getter | 4 | 0 | From `TrackingService`. |
| A10 | `dataRoot` | read-only → getter | 36 | 11 | Mutation-in-place singleton; writes go via `reactiveDataRoot.instance` (E3). |
| A11 | `reactiveDataRoot.current` | read-only fold (split handle) | 21 (`.current`) | 5 | **Split:** the 21 `.current` reads fold to a getter; the **8 `.instance` reads are E3 — DO NOT touch.** |
| A12 | `routeTitle` | read-only → getter | 2 | 0 | Written internally by `setRouteTitle(...)` ($effect-scoped registrar). |
| B13 | `appSettings` | read-write → get/set | 113 | 25 | **2nd highest-leverage.** ZERO consumer `.set`/`.update` writes (verified) — "writable but never written normally". SSR-init invariant (Spike 008): DB-override merge stays at `$state` init, NOT in an accessor/$effect. |
| B14 | `appCustomization` | read-write → get/set | 13 | 5 | ZERO consumer writes. Same SSR-init invariant as B13. |
| B15 | `appType` | read-write → get/set | 9 | 9 | **3 write sites** (`appType.set('voter'/'candidate'/'admin')` in the 3 root `+layout.svelte`) → `ctx.appType = '...'`. PoC-proven shape (`_pocAppType`). |
| B16 | `userPreferences` | read-write → get/set | 11 | 3 | **3 `.update(fn)` sites are ALL inside the producer** (`appContext.svelte.ts:244/254/261`), operating on the local `PersistedState` handle BEFORE the context object exists — they can STAY on the local handle (Open Item A4). PersistedState helper kept. |
| B17 | `sendTrackingEvent` | read-write → get/set | 1 | 0 | **1 write** (`sendTrackingEvent.set(umamiRef.trackEvent)` in `routes/+layout.svelte:149`) → `ctx.sendTrackingEvent = ...`. Shape `{current; set}` (no update). |
| B18 | `openFeedbackModal` | read-write → get/set | 6 | 1 | **1 write** (`openFeedbackModal.set(...)` in `routes/+layout.svelte:201`) → `ctx.openFeedbackModal = ...`. Shape `{current; set}` (no update). |

**Totals (migrated handles):** ~428 `.current` reads, ~128 destructure sites (of which `getRoute`'s 32 are SAFE and need no rewrite; many `darkMode`/`locale` destructures are ComponentContext, also no rewrite — see LM-2). **Real write surface: 5 sites** (`appType.set` ×3, `sendTrackingEvent.set` ×1, `openFeedbackModal.set` ×1) + 3 producer-internal `userPreferences.update` that stay put.

### Retained exceptions (E1–E4) — codemod MUST NOT touch

| # | Handle | Reason | `.current`/access sites |
|---|--------|--------|--------------------------|
| E1 | `popupQueue` (`PopupStore`) | Write surface is domain queue methods (`push`/`shift`), not value assignment. `set(v)` semantically meaningless for a queue. | 4 `.current` head-reads (accepted residual). Open Item A3: optional `get head()` alias for literal-zero. |
| E2 | `candidateUserData` (`CandidateUserDataStore`) | `.current` is a composite `$derived` (saved ∪ unsaved) over a multi-method semantic write surface (`setAnswer`/`save`/…); no single `set(v)`. | Reads stay `.current` or via existing candidateContext getters. |
| E3 | `reactiveDataRoot.instance` | `.instance` is the deliberately NON-reactive write path so producer `$effect`s mutate inside `untrack()` without `effect_update_depth_exceeded`. A single get/set pair cannot encode two reactivity modes. | **8 `.instance` reads** — handle object retained; only the 21 `.current` reads fold (A11). |
| E4 | `topBarSettings` (`SettingsOverlayApi`) | `.current` is a `$derived` mount-order merge of a token-keyed overlay registry; write surface is `$effect`-scoped registrars (`use`/`push`). No value `set(v)`. | 17–19 `.current` reads (accepted residual). `routeTitle` value it feeds folds separately (A12). |

### False positives — MUST be excluded (these are NOT context handles)

`Tween<number>.current` (svelte/motion, Progress bar, `layoutContext.type.ts:78`), `password.current` (form refs), `event.current` (DOM refs), `this.current` (~28 `bind:this` refs), `row.current` (iteration locals), `updated.current` (`$app/state` SvelteKit built-in). A blanket `.current` regex would break these. **The codemod is a named-handle allowlist, period.**

## Codemod Mechanism

### Proven precedent: `spike-009-store-codemod.mjs`

Archived at `.planning/archive/spike-009-store-codemod.mjs` (also in `.claude/skills/spike-findings-voting-advice-application-gsd/sources/009-store-codemod-feasibility/`). It is a **pure-Node, dependency-free, two-pass** script using `node:fs` `globSync` + per-target regex with negative-lookbehind/lookahead guards. It shipped green in Phase 97 (280 sites). [VERIFIED: read of archived script + 97-CONTEXT.md + consumer-migration-codemod.md]

**Why regex, not AST (ts-morph/jscodeshift):** the proven approach is regex-based and dependency-free. The rewrites here are simple, line-local, and the allowlist is small. AST tooling (ts-morph) would give more precision for distinguishing context-source (LM-2) but adds a dependency and was NOT used in the proven Phase-97 precedent. **Recommendation: extend the proven regex codemod**, and handle the context-source disambiguation (LM-2) by *targeting the `.current` suffix form* (`handle.current` → `handle`), which is naturally absent on the already-folded ComponentContext getters — so the regex self-excludes them. The destructure-rewrite pass needs care (see LM-2).

### Idempotency guarantee [VERIFIED: spike-009 script + consumer-migration-codemod.md]

Idempotency comes from the rewrite target containing no token that re-matches:
- **`.current`-read pass:** `handle.current` → `handle`. The output `handle` (bare) does NOT match `handle.current` on re-run. **No-op on second run.**
- **Write pass:** `handle.set(v)` → `handle = v`; `handle.update(fn)` → `handle = fn(handle)`. Output `handle = ...` contains no `.set(`/`.update(` → no re-match.
- **Destructure pass:** `const { x } = getXxxContext()` → `const ctx = getXxxContext(); const x = $derived(ctx.x)`. The output has no `const { x } = getXxxContext()` form → no re-match. (Care: re-running must not double-introduce a `const ctx`.)

The phase **success criterion (idempotency) is verified by: run codemod with `--apply`, commit; run again; `git diff` must be empty.**

### The green-at-every-commit sequence (additive-getter atomic-landing)

The Phase-97 precedent (D-08/D-09) is the exact model. The problem: a handle's declaration cannot simultaneously be the old `{ readonly current }` object AND the new flat getter under the SAME property key (a single TS property key is one or the other — confirmed empirically in the 102 PoC, which had to use `_poc*` names). So you cannot "add the new shape, codemod, then remove the old shape" on the same key in three commits without a red intermediate.

**Two viable green sequences — recommend Sequence 1 (atomic per-handle), matching Phase 97 D-09:**

**Sequence 1 — atomic conform+codemod (RECOMMENDED, matches Phase 97):**
1. **Plan A commit(s) — manual fixes FIRST** for any consumer that would break under the fold but is NOT codemod-reachable (e.g. cross-context `.svelte.ts` reads if the codemod is `.svelte`-only — see LM-1). Each manual fix is its own commit (D-02). The tree stays green because the handle declarations are unchanged at this point.
2. **Plan B single atomic commit:** in ONE commit — (a) flip the handle DECLARATIONS in the producer (`{current}` object → context-property getter/accessor pair), AND (b) run the codemod `--apply` rewriting all consumer `.current` reads + destructures + the 5 writes. Before = old `{current}` + `.current` consumers (green); after = flat getters + `ctx.x` consumers (green). No red intermediate — the "before" and "after" are both internally consistent, exactly like Phase 97 folded the getRoute producer rewrite into the codemod commit.

This means **Plan A and Plan B are NOT "declarations green, then consumers green" as two independent green commits** — rather Plan A delivers the *risky manual-fix commits* (and the codemod *script* authoring), and the actual declaration-flip lands ATOMICALLY with the codemod apply in Plan B. The D-04 split is about *risk separation and reviewability*, not about a green boundary between declaration-flip and consumer-rewrite. **The planner must encode this: the declaration change and the consumer codemod for a given handle ride in the same commit.**

**Sequence 2 — additive-bridge (fallback, more commits):** expose the new flat getter under the canonical name AND keep a deprecated `.current`-returning shape transiently (impossible on one key — would require a temporary `reactiveX`-style alias, which K1 forbids shipping). **Rejected** for the same reason Phase 97 rejected Option B: it ships migration-era names. Sequence 1 is the clean path.

> **Discretion call (CONTEXT.md):** "Whether the additive-getter bridge is needed per handle" — the 102 PoC answer is: a per-key additive bridge is impossible (one TS key = one shape), so the atomic same-commit flip (Sequence 1) is the mechanism. The "additive" part survives only in the sense that the codemod commit is atomic before/after-green.

### Codemod passes (extend spike-009)

```
PASS 1 — read rewrite (per allowlisted handle H):
    ctx.<H>.current        →  ctx.<H>          (read-only A1–A12 + read-side of B13–B18)
    <H>.current            →  <H>              (destructured-local read form — but see PASS 3 ordering)
  Regex per handle: /\b(<H>)\.current\b/g  → '$1'
  getRoute special: ctx.getRoute.current(   →  ctx.getRoute(   (call form)

PASS 2 — write rewrite (read-write B15/B17/B18 consumer sites only — 5 total):
    <H>.set(v)             →  <H> = v
    <H>.update(fn)         →  <H> = fn(<H>)    (only if any consumer .update survives; B16's are producer-internal, EXCLUDED)
  Regex: /\b(<H>)\.set\(([^)]*)\)/g → '$1 = $2'   (set), with update variant

PASS 3 — destructure rewrite (handles that are DESTRUCTURED and folded — A1/A2/A3*/A10/A11/B13/B14/B15/B16; *A3 only when from getAppContext):
    const { <H>, ...rest } = getXxxContext();   →
      const ctx = getXxxContext();
      const <H> = $derived(ctx.<H>);   // reactive accessors
      const { ...rest } = ctx;          // stable members stay destructured
  CAUTION: getRoute, t, stable stores stay destructured (CLAUDE.md). Only the FOLDED reactive handles move to $derived(ctx.X).

PASS 4 — destructure-trap AUDIT (warn-only, from spike-009 Pass 2):
    flag any const { <reactive-accessor> } = getXxxContext() left in the tree.
```

**Scope:** the codemod must process BOTH `.svelte` files (~329 reads) AND the `lib/contexts/**/*.svelte.ts` cross-context producer files (~35 reads) — UNLIKE Phase 97 which was `.svelte`-only. See LM-1. Exclude `*.test.ts` and `*.poc.svelte.test.ts` from auto-apply (handle manually or update test expectations as manual fixes).

## Per-Handle Transformation Catalog

> Input → output rewrites, consumed directly by the planner. Source = Phase 102 decision record §A/§B.

### Read-only (A1–A12) — `ctx.x.current` → `ctx.x`
For each of `locale`, `locales`, `darkMode` (appContext only), `reactiveAppSettings`, `reactiveLocale`, `getRoute` (call form), `surveyLink`, `sessionId`, `shouldTrack`, `dataRoot`, `reactiveDataRoot` (`.current` only), `routeTitle`:
- **Declaration (Plan A):** producer object `const x = { get current() { return _val; } }` → context-property getter `get x() { return _val; }` on the `setContext` return.
- **Read site (Plan B):** `ctx.x.current` → `ctx.x`; `getRoute.current(opts)` → `getRoute(opts)`.
- **Destructure site (Plan B):** `const { x } = getXxxContext()` → `const x = $derived(ctx.x)` (reactive) — EXCEPT `getRoute` (stable callable, destructure stays).

### Read-write (B13–B18) — `ctx.x.current` → `ctx.x` (read); `ctx.x.set(v)`/`.update(fn)` → `ctx.x = v`/`ctx.x = fn(ctx.x)` (write)
- **Declaration (Plan A):** producer `{ get current(){...}; set(v){...}; update(fn){...} }` → `get x() {...}` + `set x(v) {...}` accessor pair on the `setContext` return (PoC-proven `_pocAppType` shape; production-proven `adminContext.svelte.ts:112-117` + `candidateContext.svelte.ts:391-396`).
- **Special care:**
  - **B13 `appSettings` / B14 `appCustomization`:** ZERO consumer writes — only the read fold + destructure rewrite apply. **SSR-init invariant:** the DB-override merge MUST stay at `$state` init / the existing `$effect` reference-equality guard — do NOT move it into the new accessor. (Spike 008; appContext.svelte.ts:88–123 init logic untouched.)
  - **B15 `appType`:** 3 writes `appType.set('voter'|'candidate'|'admin')` in the 3 root `+layout.svelte` → `ctx.appType = '...'` (or `appType = '...'` if destructured — but appType is a write target, keep it via `ctx.appType =`).
  - **B16 `userPreferences`:** the 3 `.update(fn)` sites are **producer-internal** (`appContext.svelte.ts:244/254/261`) on the LOCAL `PersistedState` handle, which still exposes `.update` — they STAY AS-IS (Open Item A4 default). The PersistedState helper is kept; only the context-property *exposure* lifts to `get/set`. The `set userPreferences(v)` delegates to `_h.set`, `get` to `_h.current`.
  - **B17 `sendTrackingEvent` / B18 `openFeedbackModal`:** shape `{current; set}` (no `update`). 1 write each in `routes/+layout.svelte` → `ctx.x = v`.

### Retained (E1–E4) — NOT codemodded
`popupQueue`, `candidateUserData`, `reactiveDataRoot.instance`, `topBarSettings` — excluded from the allowlist. Their `.current`/`.instance` reads are accepted residuals. The planner should add a **zero-residual assertion that ALLOWS these** (i.e. grep for migrated-handle `.current`, NOT all `.current`).

## Plan A: Declarations Conform

**File:** `apps/frontend/src/lib/contexts/app/appContext.svelte.ts` (the bulk), plus `app/tracking/trackingService.svelte.ts` (B17, A8, A9), `data/dataContext.svelte.ts` (A10, A11 fold), `layout/layoutContext.svelte.ts` (A12 `routeTitle`).

**Mechanic:** today the producer builds local handle objects (`const appType = { get current()..., set()..., update()... }`) then spreads/assigns them into `setContext({ ..., appType, ... })`. The conform replaces each such property in the return object with an accessor:
```ts
// BEFORE (in setContext({...})):
appType,                                   // a { current, set, update } object
// AFTER:
get appType() { return appTypeValue; },
set appType(v: AppType) { appTypeValue = v; },
```
For read-only: `get darkMode() { return componentCtx.darkMode; }` (the `_pocDarkMode` shape already proven). The `appContext.type.ts` type changes from `appType: { readonly current; set; update }` to `appType: AppType` (read-write) / `readonly darkMode: boolean` (read-only).

**Remove the `_poc*` surfaces** (`_pocDarkMode`/`_pocAppType`/`_pocGetRoute` in both `.svelte.ts` and `.type.ts`) — they were the 102 scaffolding; Phase 103 folds the canonical names and deletes the PoC duplicates.

**Atomicity:** per Sequence 1, the declaration flip for each handle rides in the SAME commit as that handle's consumer codemod. In practice the cleanest shape is: one atomic commit flips ALL declarations + runs the full codemod (the mechanical codemod commit, D-02), preceded by standalone manual-fix commits for anything not codemod-reachable.

## Site Discovery & Zero-Residual Assertions

**Working-count baseline (run before codemod):**
```bash
# Per migrated handle, count .current reads (the codemod target):
for h in locale locales darkMode reactiveAppSettings reactiveLocale getRoute surveyLink \
         sessionId shouldTrack dataRoot reactiveDataRoot routeTitle appSettings \
         appCustomization appType userPreferences sendTrackingEvent openFeedbackModal; do
  printf "%-22s " "$h"
  grep -rnE "\b${h}\.current\b" apps/frontend/src --include="*.svelte" --include="*.ts" \
    | grep -v "\.d\.ts" | grep -v "\.test\.ts" | grep -v appContext.type.ts | wc -l
done
```

**Post-codemod zero-residual assertion (per handle — the success-criterion check):**
```bash
# Must be 0 for every migrated handle EXCEPT reactiveDataRoot (.instance allowed) and the E1–E4 retained:
grep -rnE "\b(locale|locales|darkMode|reactiveAppSettings|reactiveLocale|getRoute|surveyLink|sessionId|shouldTrack|dataRoot|routeTitle|appSettings|appCustomization|appType|userPreferences|sendTrackingEvent|openFeedbackModal)\.current\b" \
  apps/frontend/src --include="*.svelte" --include="*.ts" | grep -v "\.d\.ts" | grep -v "\.test\."
# Expect: empty (zero residual on the folded handles).
# reactiveDataRoot.instance (8 sites) and popupQueue/candidateUserData/topBarSettings .current are ALLOWED residuals.
```

**Idempotency assertion:**
```bash
node .planning/archive/phase-103-current-handle-codemod.mjs --apply   # 2nd run
git diff --quiet || echo "NOT IDEMPOTENT"   # must produce no diff
```

## Destructure-Trap Preservation

**The regression class (LM-3):** the `AdminNav.svelte` bug from Phase 97 — `const { isAuthenticated } = getAdminContext()` captures the initial `$derived` snapshot, so auth-state changes don't re-render the nav. Folding a handle to a getter and leaving a `const { x } = getXxxContext()` destructure reproduces this exact bug for `x`. AdminNav itself is already fixed (verified: it now uses `const ctx = getAdminContext(); const isAuthenticated = $derived(ctx.isAuthenticated)`).

**Verification (static, no runtime needed):**
```bash
# 1. No folded reactive handle is left destructured out of a context:
grep -rnE "const\s*\{[^}]*\b(darkMode|appSettings|appCustomization|appType|dataRoot|reactiveDataRoot|locale|locales|reactiveAppSettings|reactiveLocale|userPreferences)\b[^}]*\}\s*=\s*get\w+Context" \
  apps/frontend/src --include="*.svelte" --include="*.ts"
# Expect: empty after Pass 3 (these reactive handles must be read via ctx.X / $derived(ctx.X)).
# NOTE: darkMode/locale/locales destructured from getComponentContext() are SAFE (already plain getters) — see LM-2; exclude those.

# 2. spike-009 Pass-4 audit pass (the REACTIVE_ACCESSORS warn list from CLAUDE.md) must report 0 traps.
```

**The destructure-trap audit pass (spike-009 Pass 2 / new Pass 4) is the automated guard.** Its `REACTIVE_ACCESSORS` set must be EXTENDED to include the newly-folded handles that are reactive accessors: `darkMode`, `appSettings`, `appCustomization`, `appType`, `dataRoot`, `reactiveDataRoot`, `locale`, `locales`, `reactiveAppSettings`, `reactiveLocale`, `userPreferences`, `surveyLink`, `routeTitle`, `sessionId`, `shouldTrack`. (`getRoute`, `t` stay OFF the list — stable.) **CLAUDE.md's Context Destructuring Rule list MUST be updated in lockstep** (it's the single source of truth; Phase 105's ESLint guard reads from it).

## Validation Architecture

> Nyquist validation is ENABLED (config.json `workflow.nyquist_validation` absent → treated as enabled). This section is required.

### Test Framework
| Property | Value |
|----------|-------|
| Unit framework | Vitest (`vitest run`), config `apps/frontend/vitest.config.ts` + `vite.config.ts`. Runes specs use `.svelte.test.ts`. |
| Typecheck | `svelte-check` via `yarn workspace @openvaa/frontend check` (NOTE: pre-existing 147-error baseline — see LM-4; binding gate is `vite build` exit 0, not `check` exit 0). |
| Lint | `yarn lint:check` (turbo eslint + tests eslint + `typecheck:tests`). |
| E2E framework | Playwright, config `tests/playwright.config.ts`, specs `tests/tests/specs/**` (29 spec files: 22 perm, 2 candidate, 1 voter, 2 visual, 1 a11y, 1 perf). Requires `yarn dev` + seeded DB. |
| Build (binding green gate) | `yarn build --filter=@openvaa/frontend` (exit 0 = green commit boundary, the atomic-landing gate). |

### Phase Requirements → Test Map
| Req | Behavior | Test Type | Automated Command | Exists? |
|-----|----------|-----------|-------------------|---------|
| HANDLE-02 | Declarations conform; build green | build + typecheck-delta | `yarn build --filter=@openvaa/frontend` (exit 0); `yarn workspace @openvaa/frontend check` (no NEW errors vs baseline) | ✅ |
| HANDLE-02 | PoC idiom round-trips still pass after fold | unit | `yarn workspace @openvaa/frontend test:unit --run appContext` (extend/retarget `appContext.poc.svelte.test.ts` onto canonical names) | ⚠️ Wave 0 — retarget PoC test off `_poc*` |
| HANDLE-03 | Idempotency (re-run = no-op) | scripted | `node <codemod> --apply && git diff --quiet` | ✅ (script) |
| HANDLE-03 | Zero residual `.current` per migrated handle | grep | zero-residual assertion (§above) | ✅ |
| HANDLE-03 | Green at every commit boundary | build | `yarn build --filter=@openvaa/frontend` at each commit | ✅ |
| HANDLE-03 | Destructure-trap intact | grep + audit pass | destructure grep (§above) + codemod Pass-4 audit = 0 traps | ✅ |
| HANDLE-03 | Existing E2E green (auth-gated nav + voter flow) | e2e | `yarn test:e2e` (single full pass — K3) | ✅ |

### Sampling Rate (Nyquist)
- **Per task commit (cheap):** `yarn build --filter=@openvaa/frontend` (exit 0) + targeted grep for the handles touched in that commit. Unit: `yarn workspace @openvaa/frontend test:unit --run appContext` when appContext touched.
- **Per the mechanical codemod commit (D-02):** build green + idempotency check + full zero-residual assertion + destructure-trap grep + Pass-4 audit = 0.
- **Mid-chain (K3, right after the codemod lands):** ONE full E2E pass — `yarn db:reset && yarn dev` (wait healthy) `&& yarn test:e2e`. Prioritize: `voter/voter-journey.spec.ts` (voter question/results reactivity — the write-surface + appSettings/dataRoot fold), `candidate/candidate-journey.spec.ts` + `candidate-bank-auth.spec.ts` (auth-gated nav — AdminNav-class regression), `a11y/a11y-smoke.spec.ts`. The 22 `perm-*` specs exercise appSettings-driven feature flags (high-leverage for the B13 fold).
- **Phase gate (deferred to GATE-01 / Phase 105):** 3× determinism full-suite run (K3) — NOT required at Phase 103 close; the single mid-chain pass is the Phase-103 obligation.

### Minimum-sufficient check set (no redundancy)
1. `yarn build --filter=@openvaa/frontend` → exit 0 (every commit) — catches type/shape breaks.
2. Zero-residual grep (post-codemod) — proves criterion 1 (conformance).
3. Idempotency `git diff --quiet` after 2nd `--apply` — proves criterion 2.
4. Destructure grep + Pass-4 audit = 0 — proves criterion 4 (trap intact).
5. Single full E2E pass (K3) — proves criterion 4 (E2E green) + catches reactivity regressions the static checks can't (auth nav, voter results).

`yarn lint:check` runs alongside (D-01 gate) but is secondary to build for the green boundary.

### Wave 0 Gaps
- [ ] **Retarget `apps/frontend/src/lib/contexts/app/appContext.poc.svelte.test.ts`** off `_pocDarkMode`/`_pocAppType`/`_pocGetRoute` onto the canonical folded names (`ctx.darkMode`/`ctx.appType`/`ctx.getRoute`) — or delete it and fold its assertions into a canonical `appContext.svelte.test.ts`. The PoC test is the only unit proof of the round-trip; it must survive the fold.
- [ ] **Author the codemod script** (extend `spike-009-store-codemod.mjs`) with the per-handle allowlist + Pass 3 destructure rewrite + extended `REACTIVE_ACCESSORS`. (Plan A or early Plan B deliverable.)
- [ ] No new framework install needed — Vitest + Playwright + svelte-check all present.

## Common Pitfalls / Landmines

### LM-1: Codemod scope must include `lib/contexts/**/*.svelte.ts`, not just `.svelte`
**What goes wrong:** the Phase-97 codemod restricted to `.svelte` files. ~35 of the `.current` reads of migrated handles live in `lib/contexts/{voter,candidate,data,app}/*.svelte.ts` — downstream context producers reading appContext handles via `.current`. If the codemod is `.svelte`-only, the declaration flip breaks these and the build goes red.
**How to avoid:** glob `apps/frontend/src/**/*.{svelte,svelte.ts}` (or add `lib/contexts/**/*.svelte.ts`), EXCLUDING `*.test.ts`/`*.poc.*`. These cross-context reads must land in the same atomic commit as the declaration flip.

### LM-2: `darkMode`/`locale`/`locales` are dual-sourced (appContext `{current}` vs ComponentContext plain getter)
**What goes wrong:** `ComponentContext.darkMode` is ALREADY a plain `boolean` getter (`componentContext.svelte.ts:25`); consumers reading `const { darkMode } = getComponentContext()` are CORRECT and must NOT be rewritten. Only `getAppContext()`'s `darkMode.current` reads fold. A naive `darkMode.current` → `darkMode` regex is self-safe for READS (ComponentContext consumers have no `.current` to match), but the DESTRUCTURE pass (Pass 3) would wrongly rewrite `const { darkMode } = getComponentContext()`.
**How to avoid:** Pass 3 destructure rewrite must key on the CONTEXT FUNCTION (`getAppContext`/`getVoterContext`/`getCandidateContext`/`getAdminContext`), NOT `getComponentContext`. Exclude `getComponentContext()` destructures from the rewrite. Verify by inspecting the matched context call (spike-009 already captures `m[2]` = the context-call name).

### LM-3: AdminNav-class destructure regression on auth-gated surfaces
**What goes wrong:** folding `isAuthenticated`/`appSettings`/`appType` and leaving a destructure captures a stale snapshot → auth state doesn't drive nav re-render. This is the exact production bug Phase 97 surfaced.
**How to avoid:** Pass 3 rewrites destructures to `$derived(ctx.X)`; Pass 4 audit must report 0 traps; the candidate/admin E2E specs (K3) verify auth nav still reacts. The UI hint in CONTEXT.md targets exactly this — verify auth state drives nav rendering post-fix.

### LM-4: svelte-check has a pre-existing 147-error baseline — don't use `check` exit 0 as the green gate
**What goes wrong:** `yarn workspace @openvaa/frontend check` reports 148 errors (147 pre-existing infra: missing `qs` decls, supabase test-config drift, viewTransition lib types, etc.). It will NEVER exit 0. Using it as the pass/fail gate blocks forever.
**How to avoid:** the binding green gate is `yarn build --filter=@openvaa/frontend` (exit 0), per the 102 PoC precedent. Use `check` only for a NET-NEW-error delta (the fold must introduce zero new errors), not absolute exit 0.

### LM-5: HMR staleness during E2E debug
**What goes wrong:** Vite HMR serves stale SSR/large modules mid-debug; a context-shape change may appear to fail E2E when the served module is stale. [VERIFIED: project memory `project_e2e_hmr_staleness_restart.md`]
**How to avoid:** restart the dev server (`yarn dev`) before trusting any E2E result during the codemod debug; the K3 pass should run against a fresh server + `yarn db:reset`.

### LM-6: Codemod-collision constraint with Phase 104
**What goes wrong:** Phase 104 (Store→State rename) touches many of the same frontend files. If Phase 103 leaves the tree in a half-migrated state, 104's rename codemod collides. [CITED: CONTEXT.md depends-on + DX-1]
**How to avoid:** Phase 103 MUST fully complete (green, zero-residual, committed) before 104 starts — enforced by the serial chain (DX-1, no worktrees). Not a Phase-103 implementation concern beyond "finish clean."

### LM-7: B16 `userPreferences.update` is producer-internal — don't rewrite it to a context-property write
**What goes wrong:** the 3 `userPreferences.update(fn)` sites are in `appContext.svelte.ts` operating on the LOCAL `PersistedState` handle before/independent of the context object. Rewriting them to `ctx.userPreferences = fn(...)` would reference a `ctx` that doesn't exist there and lose the persist-through.
**How to avoid:** the codemod allowlist for the write pass targets CONSUMER write sites only. The producer-internal `userPreferences.update` stays on the local handle (Open Item A4 default). Scope the write regex to exclude `appContext.svelte.ts` lines that operate on the local `userPreferences` const, OR simply note there are ZERO external `userPreferences` writes to rewrite.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `{ readonly current; set; update }` handle objects on context | Context-property getters / get-set accessor pairs (zero `.current`) | v2.12 (this phase) | Consumers read `ctx.x`, write `ctx.x = v` — runes-native, no nested handle. |
| Phase-97 `.svelte`-only consumer codemod | `.svelte` + `lib/contexts/**/*.svelte.ts` codemod | This phase (LM-1) | Cross-context producer reads must be in scope. |
| `_poc*` PoC scaffolding surfaces (Phase 102) | Folded canonical names; `_poc*` deleted | This phase | The PoC proved the shapes; this phase makes them canonical. |

**Deprecated/outdated after this phase:**
- The `{ readonly current }` handle shape on all A/B handles (E1–E4 excepted).
- The `_pocDarkMode`/`_pocAppType`/`_pocGetRoute` surfaces in `appContext.{svelte,type}.ts`.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The `userPreferences.update` producer-internal sites can stay on the local handle (Open Item A4 default) | Catalog B16 / LM-7 | Low — if the context-property exposure breaks the local `.update`, fall back to retaining an `update` method on the accessor; documented alternative. |
| A2 | A single atomic conform+codemod commit (Sequence 1) stays green before/after, matching Phase 97 D-09 | Codemod Mechanism | Low — directly mirrors the shipped Phase-97 green precedent; 102 PoC confirms the per-key-one-shape constraint that forces this. |
| A3 | The `~423` production read count reconciles with the 428 raw `.current` reads of migrated handles minus tests/type-self-refs | Codebase Reality | Low — exact count is a planning estimate; the binding gate is the zero-residual grep, not the count. |
| A4 | Extending the regex spike-009 codemod (not switching to ts-morph AST) is sufficient given LM-2 disambiguation by context-call name | Codemod Mechanism | Medium — if context-source disambiguation proves error-prone in Pass 3, the planner may prefer a ts-morph pass for the destructure rewrite. The read/write passes are safely regex. |

## Open Questions

1. **Codemod test-file handling** — Should `appContext.poc.svelte.test.ts` + `trackingService.svelte.test.ts` + `survey.svelte.test.ts` (which contain `.current`/`.set` of migrated handles) be auto-codemodded or hand-edited?
   - What we know: they reference the migrated handles directly; auto-rewriting them risks invalidating intentional test assertions.
   - Recommendation: EXCLUDE `*.test.ts` from `--apply`; update test expectations as manual fixes (D-02 separate commits). The PoC test is a Wave-0 retarget.

2. **`popupQueue` `get head()` alias (Open Item A3)** — accept the 4 `.current` head-reads as residual, or add a `get head()` alias for literal-zero `.current`?
   - Recommendation: accept residual (decision-record default); it's a documented retained exception, not a failure.

## Sources

### Primary (HIGH confidence)
- `.planning/phases/102-handle-idiom-spike/102-DECISION-RECORD.md` — authoritative per-handle allowlist (A1–A12, B13–B18, E1–E4), false-positive exclusions, count reconciliation. [VERIFIED: read]
- `.planning/phases/102-handle-idiom-spike/102-02-SUMMARY.md` — the PoC finding that canonical handles are DESTRUCTURED (the codemod-reshaping fact); proven idiom shapes. [VERIFIED: read]
- `.planning/archive/spike-009-store-codemod.mjs` — the proven idempotent two-pass regex codemod. [VERIFIED: read]
- `.planning/milestones/v2.11-phases/97-domain-a-wave-3-getroute-consumer-codemod/97-CONTEXT.md` — atomic-commit/additive-getter technique (D-08/D-09), dry-run-by-default. [VERIFIED: read]
- `.claude/skills/spike-findings-voting-advice-application-gsd/references/consumer-migration-codemod.md` — codemod requirements, idempotency rationale, REACTIVE_ACCESSORS source-of-truth, limitations. [VERIFIED: read]
- Live tree greps + Node AST scan over `apps/frontend/src/**` (2026-06-09) — all per-handle counts, write sites, file-type split, E3 `.instance` count. [VERIFIED: tool]
- `apps/frontend/src/lib/contexts/app/appContext.{svelte,type}.ts`, `utils/persistedState.svelte.ts`, `component/componentContext.svelte.ts` — handle construction, PersistedState helper, dual-source darkMode. [VERIFIED: read]

### Secondary (MEDIUM confidence)
- `.planning/v2.12-DECISIONS.md` (R1, R2, K1, K3, DX-1) — cross-cutting locks. [VERIFIED: read]
- `CLAUDE.md` "Context Destructuring Rule" — the destructure-trap contract + reactive-accessor list. [VERIFIED: read]
- Project memory `project_e2e_hmr_staleness_restart.md` (LM-5). [CITED]

## Metadata

**Confidence breakdown:**
- Per-handle scope/catalog: HIGH — locked by an approved decision record + live-tree re-verification.
- Codemod mechanism / green sequence: HIGH — direct Phase-97 shipped precedent + 102 PoC empirical confirmation.
- Validation architecture: HIGH — all frameworks present; baseline established (DX-4).
- Destructure-trap preservation: HIGH — automated audit pass + grep + E2E triple-covers it.

**Research date:** 2026-06-09
**Valid until:** ~2026-06-23 (stable; scope frozen by the 102 decision record — only invalidated if the tree changes materially before Phase 103 executes, which the serial chain prevents).
