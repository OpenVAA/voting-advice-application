# Phase 97: Domain A Wave 3 — getRoute + Consumer Codemod - Research

**Researched:** 2026-06-05
**Domain:** Svelte 5 rune migration — consumer-side mechanical codemod + `getRoute` producer rewrite + admin auth-context destructure/spread fixes
**Confidence:** HIGH (every shape is browser-verified by spikes 009 + 012; this research grounds it in the exact current production tree as of 2026-06-05)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01 (97-2):** Fix `AdminNav.svelte` (`isAuthenticated` destructure) + `adminContext.svelte.ts:97` (spread-of-context anti-pattern) as the **FIRST task of the phase, BEFORE running the codemod.** The codemod's destructure-trap audit pass then verifies the fix.
- **D-02 (97-1):** **Run the codemod → human-review the full diff → commit.** Do not auto-apply blind. The review is where regressions and any remaining destructure traps surface across the 280 sites.
- **D-03:** The codemod is idempotent + dry-run-by-default; it rewrites `$store.X` → `ctx.current.X` / local `$derived` aliases and migrates the `$getRoute(opts)` call sites to the rune-native `getRoute`.
- **D-04:** `getRoute` becomes a pure `$derived.by` reading `page.params` / `page.route` / `page.url` as **separate fields** (never `page` as a whole value inside a tracking scope — Pattern 3). The custom `afterNavigate` republish workaround AND the `writable<RouteBuilder>` store are removed.
- **D-05 (97-3):** **One commit for the mechanical codemod rewrite**, then **separate commits for each manual fix** (AdminNav, adminContext, any hand-edits the review surfaces). Clean revert boundary.
- **D-06 (97-4):** **Delete** `apps/frontend/scripts/spike-009-store-codemod.mjs` from the app tree once Wave 3 lands, but **archive a copy under `.planning/`** for provenance.
- **D-07:** No migration-era names introduced; `getRoute` keeps its name in place.

### Claude's Discretion
- Exact archive path under `.planning/` for the codemod script.
- Batching of the manual-fix review (single pass vs file-group passes) as long as D-02's review-before-commit holds.

### Deferred Ideas (OUT OF SCOPE)
- Deletion of `persistedState.svelte.ts` / `StackedState.svelte.ts`, dropping `Readable<T>` from `.type.ts`, removing the temporary `toStore`/Readable bridges on the exported context properties, and the ESLint guard — **all Wave 4 / Phase 98 (CLEAN-01/02).**
- `matchStore` / `nominationAndQuestionStore` (already rune-native — spike 004).
- Re-architecting the context paradigm.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| **CTX-08** | `getRoute` is rune-native — pure `$derived.by` reading `page.params`/`page.route`/`page.url` as separate fields; `afterNavigate` republish + `writable<RouteBuilder>` removed. | Current producer at `apps/frontend/src/lib/contexts/app/getRoute.svelte.ts:35-43` (the `writable + afterNavigate(set)` shape). Target shape is the validated Approach C from spike 012 README §"Production migration plan". Surgical, single-file producer change. See **§getRoute Producer Rewrite**. |
| **CONS-01** | All `$store.X` template auto-subscribe sites rewritten to `ctx.current.X` / `$derived` aliases via the idempotent dry-run codemod. | The codemod (`apps/frontend/scripts/spike-009-store-codemod.mjs`) is built + validated. **Current tree: 145 rewrites across 44 files** (drift from the spike's 146/45 — see **§Site-Count Verification**). The `appSettings`/`dataRoot` → `.current` rewrite has a **naming-resolution blocker** the plan MUST resolve (see **§Pitfall 1 — the `.current` resolution gap**). |
| **CONS-02** | All `$getRoute(opts)` call sites migrated to rune-native `getRoute`. | **The codemod does NOT yet cover this** — it only rewrites the 4 stores (`appSettings`/`dataRoot`/`darkMode`/`locale`). The plan MUST extend the codemod to add a `$getRoute(` pass OR migrate these sites in a separate mechanical step. **Current tree: 133 `$getRoute(` sites in 48 `.svelte` files** + **13 script-block `getRouteState.current(...)` sites** in 2 admin routes + candidateContext. See **§getRoute Consumer Migration**. |
| **CONS-03** | Destructure-trap audit fixes `AdminNav` `isAuthenticated` destructure + `adminContext.svelte.ts:97` spread-of-context anti-pattern; auth-context `$derived` accessors react correctly. | Both confirmed present in the current tree (line drift: AdminNav destructure is now **line 32**, not 33; adminContext spread is **lines 97-99**). Root cause + fix in **§AdminNav + adminContext Fix**. |
</phase_requirements>

## Summary

This is a **mechanical execution phase, not a design phase** — every shape is browser-verified (spike 009 for the codemod, spike 012 for `getRoute`). The research job is to (a) ground the spike findings in the **exact current tree** (counts have drifted; line numbers have drifted), and (b) surface the **one structural blocker the spikes did not fully resolve**: the codemod rewrites `$appSettings.X → appSettings.current.X` and `$dataRoot → dataRoot.current`, but in the current tree the exported context property `appSettings` is a `Writable<AppSettings>` store and `dataRoot` is a `Readable<DataRoot>` bridge — **neither exposes `.current`**. The rune handles live under *separate* names: `reactiveAppSettings` / `reactiveLocale` / `reactiveDataRoot`. So a naive `--apply` produces code that does not compile. The plan MUST reconcile the codemod target with the exported surface before applying (see **§Pitfall 1** — it is the highest-blast-radius decision in the phase).

`getRoute` (CTX-08) is a clean, surgical single-file producer rewrite to the spike-012 Approach-C shape, plus removal of the lingering `fromStore(getRoute)` in `candidateContext` and the two admin-route `fromStore(getRoute)` script blocks. The `AdminNav`/`adminContext` fix (CONS-03) is small but **must land FIRST** (D-01) because the spread-of-context in `adminContext.svelte.ts:97-99` is the *root cause* — fixing AdminNav's destructure alone does not restore reactivity.

**Primary recommendation:** Sequence the phase as: (1) AdminNav + adminContext spread fix [separate commits, D-05]; (2) `getRoute` producer rewrite + drop the 3 residual `fromStore(getRoute)` consumers [separate commit]; (3) **resolve the `.current` naming gap** by renaming the exported rune handles to occupy the consumer-facing names (`reactiveAppSettings`→`appSettings.current` surface, etc.) OR retargeting the codemod to `reactiveX.current` — decide via **§Pitfall 1 Decision**; (4) extend the codemod with a `$getRoute(` pass; (5) run codemod dry-run → `--apply` → human-review full diff → **one** mechanical commit (D-02/D-05); (6) delete the script from the app tree + archive under `.planning/` (D-06).

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| `getRoute` route-string building | Frontend Server (SSR) + Browser | — | `getRoute.svelte.ts` runs inside the SvelteKit component-init tree on both server and client; reads `$app/state.page` (universal). Pure derivation, no API/DB. |
| `$store.X` → `.current` consumer rewrite | Browser (component templates) | — | All 145 sites are `.svelte` template auto-subscribes — client-render concern. No server/API tier involved. |
| Admin auth-state reactivity (`isAuthenticated`) | Frontend Server (session) → Browser (nav render) | API/Backend (Supabase session cookie) | `isAuthenticated = $derived(!!page.data.session)` originates from the server `load` (`page.data.session`), consumed reactively in browser nav rendering. The bug is purely in the **client-side context wiring** (spread/destructure), NOT in the auth backend. |

## Standard Stack

This phase introduces **zero new packages**. It uses only the existing toolchain.

### Core
| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| Node.js `node:fs` / `node:path` | Node 22+ (repo baseline) | The pure-Node codemod (`globSync`, `readFileSync`, `writeFileSync`) — zero dependencies | Already in `apps/frontend/scripts/spike-009-store-codemod.mjs`; dependency-free by design (spike 009 requirement) |
| Svelte 5 runes | (repo's pinned Svelte 5) | `$derived.by` for the `getRoute` producer; `.current` getter reads in consumers | The migration target paradigm (spike-findings skill) |
| `$app/state` (`page`) | SvelteKit (repo's pinned) | Rune-native page signal — `page.params`/`page.route`/`page.url` per-field reads | Spike 012 Approach C reads this; NOT `$app/stores` (legacy store) |
| Vitest | repo's pinned | Frontend unit suite (`apps/frontend/vitest.config.ts`) | Existing — the per-task green gate |
| Playwright | repo's pinned (`tests/playwright.config.ts`) | E2E journey suite — the no-behavior-regression gate | Existing — DX-4 baseline is v2.10 (82 passed / 2 skipped) |

**Version verification:** No registry lookups needed — no packages are installed in this phase. `command -v node` confirms Node availability (used to run the codemod). See **§Package Legitimacy Audit** (trivially clean — no installs).

## Package Legitimacy Audit

> This phase installs **no external packages.** The codemod is pure-Node (`node:fs`, `node:path` only). No `npm install` / `yarn add` occurs.

| Package | Registry | Disposition |
|---------|----------|-------------|
| (none) | — | N/A — zero-install phase |

**Packages removed due to slopcheck [SLOP] verdict:** none.
**Packages flagged as suspicious [SUS]:** none.

## Architecture Patterns

### System Architecture / Migration Flow

```
                          PHASE 97 EXECUTION FLOW (sequenced — D-05 commit boundaries)

  ┌──────────────────────────────────────────────────────────────────────────────────┐
  │ STEP 1 (manual, FIRST — D-01) ── separate commits per file                         │
  │   adminContext.svelte.ts:97-99   { ...appContext, ...authContext, ... }            │
  │       └─► replace spread with explicit getters that delegate back to source ctx    │
  │           (so adminContext.isAuthenticated is a live getter, not a captured value) │
  │   AdminNav.svelte:32  const { isAuthenticated, t, getRoute } = getAdminContext()   │
  │       └─► read isAuthenticated via ctx.isAuthenticated (NOT destructured)          │
  └──────────────────────────────────────────────────────────────────────────────────┘
                                          │
                                          ▼
  ┌──────────────────────────────────────────────────────────────────────────────────┐
  │ STEP 2 (CTX-08, surgical) ── separate commit                                       │
  │   getRoute.svelte.ts:35-43   writable<RouteBuilder> + afterNavigate(set)           │
  │       └─► $derived.by over { params, route, url } = page  (spike-012 Approach C)   │
  │           return { get current(): RouteBuilder }                                   │
  │   DROP the 3 residual fromStore(getRoute) consumers:                               │
  │       candidateContext.svelte.ts:48 + admin/(protected)/+page.svelte:14            │
  │       + admin/login/+page.svelte:39  →  read getRoute.current(...) directly        │
  └──────────────────────────────────────────────────────────────────────────────────┘
                                          │
                                          ▼
  ┌──────────────────────────────────────────────────────────────────────────────────┐
  │ STEP 3 (RESOLVE THE .current GAP — see Pitfall 1)  ── separate commit              │
  │   appContext / dataContext exported props must expose `.current` so the codemod's  │
  │   `$appSettings → appSettings.current` / `$dataRoot → dataRoot.current` targets    │
  │   resolve. Today only reactiveAppSettings/reactiveLocale/reactiveDataRoot do.      │
  └──────────────────────────────────────────────────────────────────────────────────┘
                                          │
                                          ▼
  ┌──────────────────────────────────────────────────────────────────────────────────┐
  │ STEP 4 (extend codemod) + STEP 5 (run → review → ONE commit, D-02/D-05)            │
  │   extend spike-009 with a `$getRoute(` → `getRoute.current(` pass                  │
  │   node spike-009-store-codemod.mjs            (dry-run — verify counts)            │
  │   node spike-009-store-codemod.mjs --apply    (write)                              │
  │   ── HUMAN REVIEW FULL DIFF ──   then ONE mechanical commit                        │
  └──────────────────────────────────────────────────────────────────────────────────┘
                                          │
                                          ▼
  ┌──────────────────────────────────────────────────────────────────────────────────┐
  │ STEP 6 (D-06)  delete apps/frontend/scripts/spike-009-store-codemod.mjs            │
  │                archive a copy under .planning/ (discretion: path)                  │
  └──────────────────────────────────────────────────────────────────────────────────┘
```

### Pattern 1: `getRoute` rune-native producer (spike 012 Approach C — VALIDATED)
**What:** Replace `writable<RouteBuilder>` + `afterNavigate(set)` with pure `$derived.by` reading page fields individually.
**When to use:** The CTX-08 producer rewrite — exactly this file, exactly this shape.
**Example:**
```ts
// Source: spike 012 README §"Production migration plan" (browser-verified)
// Target for apps/frontend/src/lib/contexts/app/getRoute.svelte.ts
import { page } from '$app/state';
import { buildRoute } from '$lib/utils/route';
import type { RouteOptions } from '$lib/utils/route';

export type RouteBuilder = (options: RouteOptions) => string;

export function createGetRoute(): { readonly current: RouteBuilder } {
  const builder = $derived.by<RouteBuilder>(() => {
    const { params, route, url } = page; // per-field reads establish 3 fine-grained deps
    return (options) => buildRoute(options, { params, route, url });
  });
  return {
    get current() {
      return builder;
    }
  };
}
```
**Critical:** Keep the file-header comment documenting WHY `$derived.by` over per-field reads bypasses the `toStore` short-circuit trap (the page proxy's object reference is stable; per-field reads each form a dependency the nav-mutation invalidates). The signature changes from `Readable<RouteBuilder>` to `{ readonly current: RouteBuilder }`. No `svelte/store` import; no `afterNavigate`.

### Pattern 2: Explicit-getter delegation instead of spread (the adminContext fix)
**What:** `{ ...appContext, ...authContext }` invokes every source getter ONCE at spread time and captures the *value*, de-reactivating the chain. Replace with explicit getters that delegate back to the source context on every read.
**When to use:** `adminContext.svelte.ts:97-99`.
**Example:**
```ts
// Source: spike 009 README §"Bonus discovery"; CLAUDE.md Context Destructuring Rule
// adminContext de-reactivates authContext.isAuthenticated via spread today.
// Target: explicit getters delegate to authContext (live reads), NOT a value snapshot.
const adminContext: AdminContext = {
  ...appContext,          // ⚠ appContext spread carries its OWN getters; verify each
  // authContext getters delegated explicitly so $derived stays live:
  get isAuthenticated() { return authContext.isAuthenticated; },
  // ...repeat for every reactive accessor authContext exposes that admin consumers read
  get userData() { return _userData; },
  set userData(v) { _userData = v; },
  jobs,
  // ...the rest unchanged
};
```
**Note (verify in-plan):** The `...appContext` spread already exists in `voterContext`/`candidateContext` per Pitfall-4 ("spread-then-explicit-getter order") and is documented as preserved. The 95/96 summaries note the `...appContext` / `...appContext, ...authContext` spread-then-explicit-getter order is intentional there. The planner must inspect WHICH accessors authContext exposes as `$derived` (at minimum `isAuthenticated = $derived(!!page.data.session)` per `authContext.svelte.ts:25`) and add an explicit delegating getter for each — a blanket "delete the spread" is wrong; the spread of `appContext`'s already-getter-shaped surface is fine, the problem is specifically the `$derived` accessors on `authContext` being captured by value.

### Anti-Patterns to Avoid
- **Blind `--apply` before resolving the `.current` gap (Pitfall 1):** produces non-compiling code (`appSettings.current` where `appSettings` is a `Writable`).
- **Fixing AdminNav's destructure without fixing the adminContext spread:** the spread is the root cause; AdminNav-only fix leaves `adminContext.isAuthenticated` a captured boolean (spike 009 explicitly states this).
- **Reading `page` as a single value in `getRoute`'s tracking scope:** re-introduces the `toStore` short-circuit trap. Destructure `{ params, route, url } = page` (per-field).
- **Hard-coding the 146/134 counts in the plan:** they have drifted to 145/133 (+13 script-block sites). The plan must run the dry-run to get live counts.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| `$store.X` → `.current` rewrite across 44 files | Hand-edit each `.svelte` file | The existing `spike-009-store-codemod.mjs` (extend it, don't replace) | Idempotent, dry-run-default, false-positive-free regex already validated; ~1h vs ~3 days |
| `getRoute` rune shape | Invent a new reactivity pattern | spike-012 Approach C (verbatim from README) | Browser-verified across path/query-param/locale navs; Approach D (afterNavigate belt-and-suspenders) explicitly rejected as redundant |
| Destructure-trap discovery | Manual grep sweep | The codemod's Pass 2 (reactive-accessor audit) | Single source of truth synced to CLAUDE.md's accessor list |

**Key insight:** Everything in this phase already exists in validated form. The only genuinely new code is (a) the `$getRoute(` pass appended to the codemod, and (b) the `.current` naming-gap resolution (Pitfall 1). Resist re-deriving any rune shape — port the spike artifacts.

## Codemod Readiness (Research Question 1)

**Does `spike-009-store-codemod.mjs` cover BOTH rewrites?** — **NO. It covers only the `$store.X` store rewrite (4 stores), NOT `$getRoute(opts)`.**

Confirmed by reading the script (`apps/frontend/scripts/spike-009-store-codemod.mjs`):
- `STORE_REWRITES` (lines 39-44) = `appSettings`, `dataRoot`, `darkMode`, `locale` only. **`getRoute` is absent.**
- Pass 1 rewrites `$<store>` → `<store>.current` (regex `(?<![\w$_])\$<store>(?!\w)`).
- Pass 2 is a **lint/warn-only** destructure-trap audit (does NOT rewrite) against the 24-name `REACTIVE_ACCESSORS` set (lines 48-74).
- **Flags:** `--apply` (default = dry-run); `--files <glob>` (default `apps/frontend/src/**/*.svelte`). Idempotent (regex doesn't match `<store>.current`). Spike README + skill reference both confirm idempotency + zero false positives.

**In-header note coverage/limits** (script lines 148-167 + skill reference §"What to Avoid"):
1. Does NOT rewrite `<script>`-block store refs (`appSettings.subscribe(cb)`) — manual review.
2. Does NOT rewrite TS-side `$store.X` reads — `.svelte`-only glob.
3. Does NOT detect spread-of-context — manual audit (this is the adminContext root cause).
4. Destructure-trap detection is **direct-only** — does NOT flag intermediate aliases (`const ctx = getVoterContext(); const { X } = ctx;`).
5. **"Don't run `--apply` before the rune-context migrations land"** — and (this research adds) before the `.current` naming gap is resolved.

**Required extension for CONS-02:** add a third rewrite pass (or fold into Pass 1) for `$getRoute(` → `getRoute.current(`. The regex must match `$getRoute(` (open-paren guarantees it's a call), rewrite to `getRoute.current(`, and be idempotent (don't match `getRoute.current(`). This is a ~10-line addition mirroring the existing store-rewrite structure. The destructure-trap caveat from spike 012 applies: `getRoute` *itself* is a stable reference (safe to destructure); what must NOT be destructured is `getRoute.current`.

**Exact invocation commands:**
```bash
# dry-run (verify live counts BEFORE applying)
node apps/frontend/scripts/spike-009-store-codemod.mjs
# apply
node apps/frontend/scripts/spike-009-store-codemod.mjs --apply
# scoped
node apps/frontend/scripts/spike-009-store-codemod.mjs --files 'apps/frontend/src/routes/admin/**/*.svelte'
```

## Site-Count Verification (Research Question 2)

**Live grep counts against the current tree (2026-06-05) — DO NOT hard-code the stale spike numbers:**

| Metric | Spike/ROADMAP claim | **Current tree (2026-06-05)** | Drift |
|--------|--------------------|-------------------------------|-------|
| Files scanned (`.svelte`) | 179 | **213** | +34 (Domain B / phases 95-100 added routes) |
| `$store.X` rewrites total | 146 | **145** | −1 |
| Files changed | 45 | **44** | −1 |
| ↳ `$appSettings` | 103 | **101** | −2 |
| ↳ `$dataRoot` | 35 | **36** | +1 |
| ↳ `$darkMode` | 4 | **4** | 0 |
| ↳ `$locale` | 4 | **4** | 0 |
| Destructure traps flagged | 2 | **2** | 0 |
| `$getRoute(` sites (`.svelte`) | 134 | **133** (in 48 files; 0 in `runes-test`) | −1 |
| **Script-block `getRouteState.current(...)`** (NOT `$getRoute`) | (not counted by spike) | **13** (2 admin routes + candidateContext.svelte.ts) | new |

**Total consumer sites to migrate: 145 (`$store.X`) + 133 (`$getRoute(`) = 278** template sites, **plus 13** script-block `fromStore(getRoute)` sites that the codemod's `.svelte`-template regex will NOT catch (they use `getRouteState.current(...)`, not `$getRoute(...)`). The "280" headline ≈ 278 + the 2 destructure-trap fixes. **The plan must treat the 13 script-block sites + the `fromStore(getRoute)` in `candidateContext.svelte.ts` as a separate manual migration step** (they drop with the `getRoute` producer rewrite — Step 2).

**Reproduce the live counts in-plan (the plan must run these, not trust this snapshot):**
```bash
node apps/frontend/scripts/spike-009-store-codemod.mjs | tail -20           # $store.X counts
grep -rEo '\$getRoute\(' apps/frontend/src --include='*.svelte' | wc -l      # $getRoute( count
grep -rn 'getRouteState' apps/frontend/src --include='*.svelte' --include='*.svelte.ts'  # script-block sites
```

## getRoute Current Implementation (Research Question 3)

**File:** `apps/frontend/src/lib/contexts/app/getRoute.svelte.ts` (the whole file, 43 lines).

**Current shape (lines 35-43):**
```ts
export function createGetRoute(): Readable<RouteBuilder> {
  function buildFn(): RouteBuilder {
    const { params, route, url } = page;
    return (options: RouteOptions) => buildRoute(options, { params, route, url });
  }
  const store = writable<RouteBuilder>(buildFn());   // ← the writable<RouteBuilder> store (D-04: remove)
  afterNavigate(() => store.set(buildFn()));         // ← the afterNavigate republish workaround (D-04: remove)
  return store;
}
```
- **`page` import is `$app/state` (rune), line 3** — `import { page } from '$app/state';`. ✅ Confirmed: NOT `$app/stores` (legacy store). So the rewrite reads the rune `page` per-field — no import change needed for `page`.
- Imports to **remove**: `import { writable } from 'svelte/store'` (line 1), `import { afterNavigate } from '$app/navigation'` (line 2), `import type { Readable } from 'svelte/store'` (line 5).
- The file already destructures `{ params, route, url } = page` inside `buildFn` — the rewrite just lifts that into `$derived.by`.
- **Wiring:** `appContext.svelte.ts:50` calls `const getRoute = createGetRoute();` and exports it (line 309). `appContext.type.ts:65` types it `getRoute: Readable<RouteBuilder>` → change to `getRoute: { readonly current: RouteBuilder }`.

**Three residual consumers that read `getRoute` as a store (must change with the producer):**
1. `candidateContext.svelte.ts:48` — `const getRouteState = fromStore(getRoute);` + 6 `getRouteState.current(...)` call sites (lines 255, 267, 273, 306, 315). After: read `getRoute.current(...)` directly; **delete** the `import { fromStore } from 'svelte/store'` (line 5) — this removes candidateContext's LAST `svelte/store` import (completing CTX-07's deferred tail).
2. `routes/admin/(protected)/+page.svelte:14` — `const getRouteState = fromStore(getRoute);` + 4 `getRouteState.current(...)` sites (lines 22, 25, 31, 38).
3. `routes/admin/login/+page.svelte:39` — `const getRouteState = fromStore(getRoute);` + 1 `getRouteState.current(...)` site (line 139).

## getRoute Consumer Migration (Research Question — CONS-02 detail)

Two distinct consumer shapes for `getRoute`, requiring two mechanisms:

| Shape | Count | Files | Mechanism |
|-------|-------|-------|-----------|
| `$getRoute(opts)` template auto-subscribe | 133 (48 `.svelte` files) | voter/candidate nav, admin nav, page links throughout | **Extend the codemod** with a `$getRoute(` → `getRoute.current(` pass (CONS-02). Part of the ONE mechanical commit. |
| `fromStore(getRoute)` + `getRouteState.current(...)` script-block | 13 (2 admin routes + candidateContext) | `admin/(protected)/+page.svelte`, `admin/login/+page.svelte`, `candidateContext.svelte.ts` | **Manual** (codemod's `.svelte`-template regex won't catch these). Drop the `fromStore` line; rewrite `getRouteState.current(` → `getRoute.current(`. Bundle with Step 2 (the producer rewrite) as a separate commit. |

## AdminNav + adminContext Fix (Research Question 4 — CONS-03)

**Line numbers have drifted — verify in-plan; current (2026-06-05):**

**`adminContext.svelte.ts:97-99` (the root cause — spread-of-context):**
```ts
const adminContext: AdminContext = {
  ...appContext,    // line 98
  ...authContext,   // line 99  ← ⚠ invokes authContext.isAuthenticated ($derived) ONCE, captures the boolean
  get userData() { return _userData; },
  // ...
};
```
`authContext.isAuthenticated` is `$derived(!!page.data.session)` (`authContext.svelte.ts:25` per spike). Object spread reads it ONCE at adminContext-init time and stores the boolean — so `adminContext.isAuthenticated` is a static value, not a live getter. **This is why even a correct AdminNav read wouldn't react.** Fix: replace `...authContext` with explicit delegating getters for each reactive authContext accessor admin consumers read (`get isAuthenticated() { return authContext.isAuthenticated; }`, etc.). Keep `...appContext` (its surface is already getter-shaped — verify, per the 95/96 spread-then-explicit-getter precedent).

**`AdminNav.svelte:32` (the consumer-side symptom — destructure trap):**
```svelte
const { isAuthenticated, t, getRoute } = getAdminContext();   // line 32 (was :33 in the spike)
```
`isAuthenticated` is a reactive accessor (in the codemod's `REACTIVE_ACCESSORS` set + CLAUDE.md list) → destructuring captures the init-time value. Fix per CLAUDE.md Context Destructuring Rule: read via `ctx.isAuthenticated`:
```svelte
const ctx = getAdminContext();
const { t, getRoute } = ctx;                       // t, getRoute are stable refs — safe to destructure
const isAuthenticated = $derived(ctx.isAuthenticated);  // reactive accessor — read via ctx.X aliased through $derived
```
`{#if isAuthenticated}` (line 38) then tracks the `$derived`. **Note:** after Step 2, `getRoute` becomes `{ current }`, so the `$getRoute('...')` template calls in AdminNav (lines 41-44, 52) get rewritten to `getRoute.current('...')` by the codemod's CONS-02 pass.

**Ordering (D-01):** Both fixes land FIRST, as separate commits, BEFORE the codemod runs. The codemod's Pass-2 destructure-trap audit then **verifies** AdminNav no longer flags (it should drop from 2 traps to 1 — only the intentional `DestructureTrapConsumer.svelte` demo remains).

## Runtime State Inventory

> This is a code-only refactor (no datastores, no OS state, no secrets, no build artifacts beyond the codemod script). Inventory included for completeness per the rename/refactor trigger.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | **None** — verified: no localStorage/sessionStorage **keys** change in this phase. `getRoute`/`appSettings`/`dataRoot` are in-memory derivations; the persisted keys (`voterContext-firstQuestionId`, `appContext-sessionId`, candidate prereg ids) were settled in Phases 95/96 and are untouched here. | None |
| Live service config | **None** — verified: no n8n/Datadog/external-service config references the renamed symbols. Pure frontend code. | None |
| OS-registered state | **None** — verified: no Task Scheduler / pm2 / systemd registration references these symbols. | None |
| Secrets/env vars | **None** — verified: no env var or secret key references `getRoute`/`appSettings`/`dataRoot` by name. | None |
| Build artifacts | **The codemod script itself** (`apps/frontend/scripts/spike-009-store-codemod.mjs`) is deleted from the app tree (D-06) + archived under `.planning/`. No compiled/installed artifact carries an old name (no package rename). | Delete + archive the script (D-06); `git mv` or copy-then-`git rm`. |

**The canonical question — "after every file is updated, what runtime systems still have the old string cached?"** — Answer: **none.** This is a same-process, in-memory reactivity-shape refactor. The only "old string" risk is the symbol-name reconciliation in Pitfall 1, which is a compile-time (not runtime-cache) concern and is caught by `yarn build`.

## Common Pitfalls

### Pitfall 1: The `.current` resolution gap (HIGHEST RISK — blocks `--apply`)
**What goes wrong:** The codemod rewrites `$appSettings.X → appSettings.current.X` and `$dataRoot → dataRoot.current`. But in the current tree:
- `appContext` exports `appSettings: Writable<AppSettings>` (a store — **no `.current`**) and `appSettings = toStore(...)` (`appContext.svelte.ts:85`). The rune handle is exported under the **separate** name `reactiveAppSettings: { readonly current: AppSettings }` (`appContext.type.ts`, added in Phase 96-01).
- `dataContext` exports `dataRoot: Readable<DataRoot>` (the `createDataRootBridge` Readable — **no `.current`**) and the rune handle under `reactiveDataRoot: { readonly current: DataRoot; readonly instance: DataRoot }` (`dataContext.svelte.ts:99-109`).
- `locale` / `darkMode` are similarly store-shaped exports (`localeStore`/`darkModeStore`, `appContext.svelte.ts:301-303`); the rune locale handle is `reactiveLocale`.

So after `--apply`, `appSettings.current.X` references a `.current` that does not exist on the `Writable` → **TypeScript/build failure across ~145 sites.**

**Why it happens:** Phases 95/96 deliberately kept the legacy store on the *original* exported name (so un-migrated `$store.X` consumers compiled) and put the rune handle under a `reactive`-prefixed name. The 95-RESEARCH/PATTERNS explicitly state the codemod target is `<store>.current` on the *original* name — which means **the exported `appSettings`/`dataRoot`/`locale`/`darkMode` property must expose `.current` at codemod time.**

**How to avoid — the plan MUST choose one (PLANNER DECISION, see Open Question O-1):**
- **Option A (rename the handle onto the original name — K1-aligned):** In Step 3, make the exported `appSettings`/`dataRoot`/`locale`/`darkMode` properties expose `.current` by pointing the original name at the rune handle's shape — i.e. the codemod target `appSettings.current` resolves because `appSettings` now *is* (or also carries) the `{ current }` handle. This is the K1 end-state ("rune-native replacement takes over the original name") but bringing it forward partially into Wave 3. **Risk:** the same name must STILL satisfy the un-migrated `$store.X` consumers *until the codemod rewrites them in the same commit* — so the rename and the codemod `--apply` must be atomic, OR the property must transiently support both shapes.
- **Option B (retarget the codemod to `reactiveX.current`):** Change `STORE_REWRITES` so `$appSettings → reactiveAppSettings.current`, `$dataRoot → reactiveDataRoot.current`, `$locale → reactiveLocale.current`. **Downside:** leaves migration-era `reactive*` names in shipped consumers, which Phase 98 (K1) must then rename again — violates "no migration-era names survive" if not cleaned. **But** the consumers would point at a real, existing `.current` and compile immediately; Phase 98 can do the final `reactive*`→original rename as a pure mechanical sweep.
- **Recommended:** **Option A**, scoped tightly: in Step 3, give the exported `appSettings`/`dataRoot`/`locale`/`darkMode` a `.current` getter (additive — the store shape stays for the same-commit-rewritten consumers), then the codemod `--apply` + the property change land in coordinated commits so the tree never has a broken intermediate state. Validate with `yarn build --filter=@openvaa/frontend` (green) before committing. **The planner must verify against `dataRoot.current` / `appSettings.current` actually resolving post-Step-3 via a typecheck — this is the gating acceptance.**

**Warning signs:** `yarn build` / `yarn check` errors of the form "Property 'current' does not exist on type 'Writable<AppSettings>'" or "...on type 'Readable<DataRoot>'".

### Pitfall 2: AdminNav-only fix leaves the bug (spread is the root cause)
**What goes wrong:** Fixing `AdminNav.svelte:32`'s destructure without fixing `adminContext.svelte.ts:97-99`'s spread → `adminContext.isAuthenticated` is still a captured boolean; `ctx.isAuthenticated` reads the stale value.
**How to avoid:** Fix the spread FIRST (D-01), then AdminNav. Verify reactivity: login mid-session → admin nav switches from login-link to the authenticated nav group.
**Warning signs:** Admin nav shows the login link after a successful login (or vice-versa) until a hard refresh.

### Pitfall 3: `$getRoute(` pass false-positives / non-idempotency
**What goes wrong:** A naive `$getRoute` regex could match `$getRouteFoo(` or fail to be idempotent (re-matching `getRoute.current(`).
**How to avoid:** Mirror the existing store-rewrite guards: `(?<![\w$_])\$getRoute(?=\()` and verify it does NOT match `getRoute.current(` (no leading `$`). Run the codemod twice in dry-run — second run must report 0 `$getRoute` changes.
**Warning signs:** Dry-run #2 still lists `$getRoute` rewrites.

### Pitfall 4: Script-block `getRouteState.current(...)` sites silently missed
**What goes wrong:** The codemod's template-oriented regex won't touch the 13 `getRouteState.current(...)` script-block sites — they'll keep compiling (because `fromStore(getRoute)` still exists) but reference a now-deleted store shape after Step 2 → build break OR stale closure.
**How to avoid:** Migrate these 13 sites + the 3 `fromStore(getRoute)` lines MANUALLY in Step 2 (bundled with the producer rewrite). Grep `getRouteState` to confirm 0 remain.
**Warning signs:** `grep -rn 'getRouteState' apps/frontend/src` returns >0 after Step 2.

### Pitfall 5: Stable stores that MUST remain destructured (CLAUDE.md caveat)
**What goes wrong:** CLAUDE.md notes that `appSettings`/`dataRoot`/`getRoute` are consumed via `$appSettings.X` template auto-subscribe **and** that the `$` prefix only auto-subscribes top-level identifiers — so they "must remain destructured" for template auto-subscription. After migration to `.current`, the template no longer uses `$`, so the destructure of `appSettings`/`dataRoot`/`getRoute` themselves remains (they're stable references) — only the `$`-prefixed *reads* change. The codemod handles this correctly: it rewrites the **reads** (`$appSettings.X` → `appSettings.current.X`), NOT the destructure (`const { appSettings } = ctx` stays).
**How to avoid:** Confirm in review that the codemod did NOT touch `const { appSettings, ... } = ctx` lines — only the `$`-prefixed template reads. (The codemod's regex only matches `$<store>`, so destructures are inherently safe.)
**Warning signs:** A diff line removing `appSettings` from a `const { ... } = getXContext()` destructure (should never happen).

## Code Examples

### Extending the codemod for `$getRoute(` (CONS-02)
```js
// Source: mirrors apps/frontend/scripts/spike-009-store-codemod.mjs Pass 1 structure
// Add getRoute as a call-form rewrite (open-paren guard distinguishes the call from a bare ref).
// In STORE_REWRITES or a dedicated pass:
//   $getRoute(  →  getRoute.current(
const getRouteRe = /(?<![\w$_])\$getRoute(?=\()/g;   // matches `$getRoute(`, rejects `$getRouteFoo`, `_$getRoute`
changed = changed.replace(getRouteRe, 'getRoute.current');
// Idempotent: `getRoute.current(` has no leading `$`, so it never re-matches.
```

### The AdminNav reactive read (CLAUDE.md canonical pattern)
```svelte
<!-- Source: CLAUDE.md "Context Destructuring Rule" canonical pattern -->
<script lang="ts">
  const ctx = getAdminContext();
  const { t, getRoute } = ctx;                          // stable refs — destructure ok
  const isAuthenticated = $derived(ctx.isAuthenticated); // reactive accessor — read via ctx.X
</script>
{#if isAuthenticated}
  <NavItem href={getRoute.current('AdminAppHome')} ... />   <!-- $getRoute → getRoute.current (codemod) -->
{/if}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `getRoute` as `writable<RouteBuilder>` + `afterNavigate(set)` republish | Pure `$derived.by` over `page.params`/`page.route`/`page.url` per-field reads | Phase 97 (this phase) | Removes the `toStore` short-circuit workaround; no `svelte/store` import; fine-grained tracking handles every nav |
| Consumers read `$store.X` template auto-subscribe + `$getRoute(opts)` | `store.current.X` + `getRoute.current(opts)` rune reads | Phase 97 | All 278 template sites mechanically rewritten; Wave 4 then deletes the now-unused store bridges |
| `adminContext` `{ ...authContext }` spread (de-reactivates `$derived`) | Explicit delegating getters | Phase 97 | Admin auth-context accessors react correctly (fixes a real production bug) |

**Deprecated/outdated:**
- The spike's "146 / 134 / 45 / 179" numbers — drifted to 145 / 133 / 44 / 213. The plan must use live dry-run counts.
- AdminNav line 33 → now line 32; adminContext spread "line 97" → lines 97-99. Verify in-plan.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `authContext.isAuthenticated` is `$derived(!!page.data.session)` at `authContext.svelte.ts:25` | AdminNav + adminContext Fix | LOW — sourced from spike 009 README + skill; the planner must open `authContext.svelte.ts` to confirm the exact line/shape before writing the fix task. The *root cause* (spread de-reactivation) is independently confirmed by reading `adminContext.svelte.ts:97-99` directly in this session. |
| A2 | Option A (rename handle onto original name) is the K1-aligned recommended Pitfall-1 resolution | Pitfall 1 | MEDIUM — this is a genuine architectural fork (Option A vs B). Both compile; they differ in how much `reactive*`-rename work lands in Phase 97 vs 98. The planner/discuss-phase should confirm which split the user wants. Flagged as Open Question O-1. |
| A3 | The 13 script-block `getRouteState.current` sites + 3 `fromStore(getRoute)` lines are the complete set of non-template `getRoute` consumers | getRoute Consumer Migration | LOW — grep-verified this session (`grep -rn 'getRouteState'` = 13; `fromStore(getRoute)` in exactly candidateContext + 2 admin routes). Re-run the greps in-plan to confirm no drift. |

## Open Questions

1. **O-1 — Pitfall 1 resolution: Option A (rename handle onto original name now) vs Option B (retarget codemod to `reactiveX.current`)?**
   - What we know: Both produce compiling code. Option A front-loads the K1 rename into Phase 97 (atomic with the codemod commit); Option B leaves `reactive*` names in consumers for Phase 98 to sweep.
   - What's unclear: Whether the user wants the `reactiveAppSettings`→`appSettings` rename to land in Wave 3 (this phase) or Wave 4 (Phase 98). D-07 ("no migration-era names introduced") + K1 ("no migration-era names survive at milestone end") both point toward Option A, but K1's *enforcement* point is explicitly Phase 98 (D-04 of 98-CONTEXT).
   - Recommendation: **Option A, atomic.** Give the exported `appSettings`/`dataRoot`/`locale`/`darkMode` a `.current` getter (additive, alongside the surviving store shape for same-commit consumers), so the codemod target resolves and no `reactive*` name reaches shipped consumers. Phase 98 then only has to delete the (now-unused) store bridges. **Confirm with user via discuss-phase before planning if ambiguous.**

2. **O-2 — Does `appContext`'s `...componentCtx`/`...dataCtx`/`...tracking` spread (appContext.svelte.ts:290-292) have the same de-reactivation risk as the adminContext spread?**
   - What we know: appContext spreads several sub-contexts then overrides specific properties with store-wrapped versions (lines 296-309). The 96 summaries assert the spread-then-explicit-getter order is intentional and preserved.
   - What's unclear: Whether any `$derived` accessor on a spread sub-context is captured-by-value the way `authContext.isAuthenticated` is in adminContext.
   - Recommendation: The plan's destructure/spread audit (CONS-03) should grep for `$derived` accessors on every spread source context and confirm each is either re-exported as an explicit getter or genuinely static. Treat as a review checklist item, not a blocker.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js (`node`) | Running the codemod (`node:fs`/`node:path`, `globSync`) | ✓ (repo baseline, Node 22+) | repo-pinned | — |
| Yarn + Turborepo | `yarn build` / `yarn test:unit` / `yarn lint:check` gates | ✓ | repo-pinned | — |
| Playwright + local Supabase | E2E no-regression gate (`yarn test:e2e`) | ✓ (operator-run per DX-4) | repo-pinned | DX-4 trusts the v2.10 baseline; full E2E is the operator's end-of-phase step |

**Missing dependencies with no fallback:** none.
**Missing dependencies with fallback:** none — `globSync` requires Node 22+ (repo baseline satisfies this).

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Unit framework | Vitest (`apps/frontend/vitest.config.ts`), run via `turbo run test:unit` |
| E2E framework | Playwright (`tests/playwright.config.ts`), projects: `voter-journey`, `candidate-journey`, `bank-auth`, `a11y-smoke`, `visual-regression`, `performance`, `perm-*` |
| Lint/type gate | `yarn lint:check` (turbo lint + tests eslint + `typecheck:tests`); `yarn build --filter=@openvaa/frontend` for the frontend typecheck |
| Quick run command | `yarn workspace @openvaa/frontend test:unit` |
| Full suite command | `yarn test:unit` (all packages) + `yarn test:e2e` (operator) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | Coverage today |
|--------|----------|-----------|-------------------|----------------|
| CTX-08 | `getRoute.current(opts)` resolves correct URLs across path / query-param / locale nav | E2E (implicit) | `yarn test:e2e --project=voter-journey` (the `/elections → /constituencies → /questions` flow that the OLD bug broke — see `getRoute.svelte.ts:27-30` comment + `multi-election.spec.ts:173`) | ✅ voter-journey exercises the exact flow the `toStore` trap broke |
| CTX-08 | No `svelte/store` import in `getRoute.svelte.ts`; no `afterNavigate` | Static grep | `grep -c "svelte/store" apps/frontend/src/lib/contexts/app/getRoute.svelte.ts` → 0; `grep -c afterNavigate` → 0 | ✅ grep gate |
| CONS-01 | All `$store.X` rewritten; build green; no behavior change | Build + unit + E2E | `yarn build --filter=@openvaa/frontend` (green) + `yarn workspace @openvaa/frontend test:unit` + voter/candidate-journey E2E | ✅ build/unit automated; E2E operator-run |
| CONS-01 | Codemod idempotent (dry-run #2 = 0 changes) | Codemod self-check | `node apps/frontend/scripts/spike-009-store-codemod.mjs` (post-apply must report 0 rewrites) | ✅ scriptable |
| CONS-02 | All `$getRoute(` + 13 script-block sites migrated; 0 `getRouteState` remain | Static grep + build | `grep -rEc '\$getRoute\(' apps/frontend/src --include='*.svelte'` → 0; `grep -rn 'getRouteState' apps/frontend/src` → 0; build green | ✅ grep + build gate |
| CONS-03 | AdminNav destructure-trap removed (codemod Pass-2 flags drop 2→1); admin nav reacts to login | Codemod audit + **manual UAT** | `node spike-009-store-codemod.mjs` → "Total traps flagged: 1" (only the intentional `DestructureTrapConsumer` demo) | ⚠ **NO automated admin E2E** — see Gap below |

### Sampling Rate
- **Per task commit:** `yarn workspace @openvaa/frontend test:unit` + `yarn build --filter=@openvaa/frontend` (typecheck catches the Pitfall-1 `.current` resolution).
- **Per wave merge / phase gate:** Full `yarn test:unit` + operator-run `yarn test:e2e` (voter-journey + candidate-journey at minimum) green vs the v2.10 baseline (82 passed / 2 skipped — DX-4). Re-enable consideration of `perm-per-app-notifications` is Phase 101 / SUITE-01, NOT this phase.
- **Codemod-specific gate:** dry-run before `--apply`; dry-run again after `--apply` (must report 0 rewrites — proves idempotency); human review of the full diff (D-02) before the single mechanical commit.

### Wave 0 Gaps
- [ ] **No automated admin E2E spec exists.** `tests/tests/specs/` has voter + candidate + perm + a11y + visual + perf, but **no `admin/*.spec.ts`**. CONS-03's "admin auth-context `$derived` accessors react correctly" therefore has **no automated regression gate** — it must be verified via **manual UAT** (the CONTEXT.md "UI hint: yes" + 97-UAT.md): log into the admin app, confirm the nav switches from login-link to the authenticated nav group reactively (without a hard refresh), and that `AdminAppHome`/`Jobs`/`FactorAnalysis`/`QuestionInfo`/`ArgumentCondensation` links resolve. The plan should add a `checkpoint:human-verify` for this. (Writing a net-new admin E2E spec is out of scope unless the planner elects to add a minimal smoke — flag as discretion.)
- [ ] No new unit test files are strictly required (this is a mechanical rewrite + a producer shape change). The existing frontend unit suite (722 tests at Phase 96 close) is the regression net. **Optional:** a small unit test asserting `getRoute.current('Home')` builds the expected URL would lock CTX-08 — recommended but not blocking.
- [ ] Framework install: none — Vitest + Playwright already configured.

## Project Constraints (from CLAUDE.md)

The plan MUST comply with these CLAUDE.md directives (same authority as locked decisions):
- **Context Destructuring Rule (Svelte 5):** reactive accessors (incl. `isAuthenticated`) MUST be read via `ctx.X` (aliased through `$derived`), never destructured. Stable refs (`t`, `getRoute`, `appSettings`/`dataRoot` stores) may be destructured. **This is the canonical authority for the AdminNav fix.** The codemod's `REACTIVE_ACCESSORS` set MUST stay in sync with the CLAUDE.md list (and vice-versa) — if the plan adds an accessor, update both.
- **`$`-prefix auto-subscribe caveat:** only top-level identifiers auto-subscribe; stable stores (`appSettings`/`dataRoot`/`getRoute`) must remain destructured for template auto-subscription **until** the codemod rewrites their reads to `.current` — the destructure stays, only the `$`-read changes (Pitfall 5).
- **Svelte Warning-Accepted Format:** if any vite-plugin-svelte / compiler warning is intentionally accepted during the rewrite, use `// svelte-warning: accepted — <rationale>` immediately above the line. Prefer fixing at source.
- **TypeScript strict:** avoid `any`; the `getRoute` return type changes from `Readable<RouteBuilder>` to `{ readonly current: RouteBuilder }` — update `appContext.type.ts` accordingly.
- **Localization / a11y:** no user-facing strings change; WCAG AA must hold (admin nav remains keyboard/screen-reader operable — covered by the a11y-smoke E2E project for the voter app, and manual UAT for admin).
- **Code Review Checklist:** check `/.agents/code-review-checklist.md` before completing.

## Security Domain

> `security_enforcement` status not located in a config.json read this session; including a scoped assessment since admin **authentication** surfaces are touched.

### Applicable ASVS Categories
| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | indirect | Supabase cookie-based PKCE session (unchanged by this phase — the bug is client-side *reactivity*, not the auth mechanism) |
| V3 Session Management | indirect | `page.data.session` from the server `load` (unchanged) |
| V4 Access Control | **yes (behavioral)** | `isAuthenticated` gates the admin nav group. **The CONS-03 bug means the nav could show authenticated links to a logged-out user (or hide them from a logged-in one) until refresh** — a UX/access-display correctness issue. The fix RESTORES correct gating. No new access-control logic is introduced; route-level protection lives in `admin/(protected)/` server guards (untouched). |
| V5 Input Validation | no | No new inputs; `buildRoute` is a pure URL builder over typed `RouteOptions` (unchanged). |
| V6 Cryptography | no | None. |

### Known Threat Patterns for this stack
| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Stale `isAuthenticated` shows wrong nav state | Information Disclosure (minor) | The CONS-03 fix (live `$derived` delegation) — verify via manual admin UAT |
| Codemod false-positive rewriting an unrelated `$identifier` | Tampering (code-integrity) | Negative-lookbehind/lookahead regex guards (validated zero-FP in spike 009) + mandatory human diff review (D-02) before commit |

**Note:** The admin nav rendering the authenticated link group does NOT itself grant access — the `admin/(protected)/` routes are server-guarded independently. The bug is a display-correctness issue, not a privilege-escalation vector. Still, the fix is the correct outcome and must be UAT-verified.

## Sources

### Primary (HIGH confidence)
- `apps/frontend/scripts/spike-009-store-codemod.mjs` — the codemod (read in full this session; confirmed `getRoute` is NOT covered)
- `apps/frontend/src/lib/contexts/app/getRoute.svelte.ts` — current producer (the `writable + afterNavigate` shape, lines 35-43; `page` from `$app/state`)
- `apps/frontend/src/lib/contexts/admin/adminContext.svelte.ts:97-99` — the spread-of-context (read directly; line drift confirmed)
- `apps/frontend/src/lib/dynamic-components/navigation/admin/AdminNav.svelte:32` — the destructure trap (read directly; now line 32)
- `apps/frontend/src/lib/contexts/app/appContext.svelte.ts` + `appContext.type.ts` — confirmed `appSettings`=`Writable` store, rune handle under `reactiveAppSettings`
- `apps/frontend/src/lib/contexts/data/dataContext.svelte.ts:71-109` — confirmed `dataRoot`=`Readable` bridge, rune handle under `reactiveDataRoot`
- `apps/frontend/src/lib/contexts/candidate/candidateContext.svelte.ts:41-48,255-315` — the residual `fromStore(getRoute)` + 6 call sites
- `.planning/spikes/009-store-codemod-feasibility/README.md` + `.planning/spikes/012-getroute-rune/README.md` — VALIDATED spike findings
- `Skill("spike-findings-voting-advice-application-gsd")` + `references/consumer-migration-codemod.md` — codemod requirements + limitations
- Live grep/dry-run counts this session (145 rewrites / 44 files / 133 `$getRoute(` / 13 `getRouteState` / 2 traps)
- `.planning/phases/95-*/95-RESEARCH.md`, `95-PATTERNS.md`, `.planning/phases/96-*/96-01-SUMMARY.md`, `96-02-SUMMARY.md` — Wave 1/2 landed surfaces + the explicit Wave-3 codemod target mapping
- `.planning/v2.11-DECISIONS.md` (K1) + `.planning/phases/98-domain-a-wave-4-cleanup/98-CONTEXT.md` (where the `reactive*` rename + bridge deletion lands)
- `CLAUDE.md` → "Context Destructuring Rule (Svelte 5)"

### Secondary (MEDIUM confidence)
- `authContext.svelte.ts:25` `isAuthenticated = $derived(!!page.data.session)` — cited from spike 009 README + skill; NOT directly opened this session (A1).

## Metadata

**Confidence breakdown:**
- Codemod readiness + extension scope: **HIGH** — script read in full; `getRoute` gap confirmed; extension is a ~10-line mirror.
- Site counts: **HIGH** — live dry-run + grep this session (explicitly flagged as drifted from spike).
- `getRoute` producer rewrite: **HIGH** — spike-012 Approach C is browser-verified; current file read directly.
- AdminNav/adminContext fix: **HIGH** for the spread root cause (read directly); **MEDIUM** for the exact `authContext.svelte.ts:25` line (A1, cited not opened).
- Pitfall 1 (`.current` gap) + its resolution: **HIGH** that the gap exists (type-confirmed); **MEDIUM** on Option A vs B (genuine architectural fork — O-1, A2).
- Validation architecture: **HIGH** on the framework/commands; the admin-E2E gap is confirmed (no admin spec exists).

**Research date:** 2026-06-05
**Valid until:** 2026-06-19 (14 days — the tree is actively changing under parallel Domain B work; re-run the dry-run counts at plan time)

## RESEARCH COMPLETE
