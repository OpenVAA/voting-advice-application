# Phase 113: Handle Flatten + De-duplication - Research

**Researched:** 2026-06-13
**Domain:** Svelte 5 runes context refactor — duplicate-handle collapse + idempotent consumer codemod (frontend-only)
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
All implementation choices are at Claude's discretion — pure infrastructure/refactor phase. Decisions are constrained by the ROADMAP success criteria and the established project contracts:

- **Destructure-trap contract (NON-NEGOTIABLE):** Consumers read `ctx.X` for reactive accessors, never destructure them. See CLAUDE.md "Context Destructuring Rule (Svelte 5)". The spike-009 audit (PASS 4) must pass after the flatten.
- **Green at every commit boundary:** The codemod must not leave a red build at any step. Stage the work so each commit independently builds.
- **Idempotent codemod:** The `.current` → bare-field flatten must be re-runnable as a no-op.
- **Runs alone:** FLATTEN-02 is a ~524-site mechanical rewrite — must NOT run concurrently with any other large rewrite (v2.12 collision lesson).

### Claude's Discretion
All implementation choices (codemod mechanism, commit staging) at Claude's discretion within the contracts above.

### Deferred Ideas (OUT OF SCOPE)
- The `*Store` → `*State` rename (Phase 114).
- Straggler `svelte/store` clearance (Phase 115).
- Milestone-close green gate (Phase 116).
- Any handle NOT in the FLATTEN-01 enumerated list (`getRoute`, `appCustomization`, `appType`, `darkMode`, `userPreferences`, `surveyLink`, `openFeedbackModal`, `userData`, `topBarSettings`, `overlay`, `store`, sub-store handles) stays `{ current }` — DO NOT flatten unrelated `.current` reads.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| FLATTEN-01 | Collapse `reactiveFoo`/`Foo` duplicate handle pairs to a single reactive class field — `reactiveDataRoot`+`dataRoot` → `dataRoot`, `reactiveAppSettings`+`appSettings` → `appSettings`, `reactiveLocale`+`locale` → `locale`, and the `{ current, instance }` dataRoot split → a single reactive `dataRoot` field. Grep gate confirms zero `reactive*` duplicate handles. | Exact producer declaration sites enumerated (`## Producer Handle Inventory`); grep gate command (`## Verification Architecture`). The `instance` member has exactly ONE production producer-write consumer (`candidate/(protected)/+layout.svelte:135`) that must move to `setDataRoot`. |
| FLATTEN-02 | All consumer `.current` reads on migrated handles flattened to bare class-field reads via an idempotent codemod (re-running is a no-op), back-compat handles removed from producers, build green at every commit boundary, CLAUDE.md destructure-trap contract preserved (verified by spike-009 audit). | Consumer `.current` inventory by handle + directory (`## Consumer .current Inventory`); idempotent codemod design (`## Recommended Codemod`); destructure-trap escalation finding (`## CRITICAL: appSettings/dataRoot/locale Become Reactive Accessors`). |
</phase_requirements>

## Summary

Phases 106–112 converted every frontend context factory into a Svelte 5 class. During that conversion each context **temporarily retained back-compat handles** so consumers stayed byte-identical: a writable `{ current, set, update }` handle (`appSettings`), read-only mirror handles (`reactiveAppSettings`, `reactiveLocale`, `reactiveDataRoot`), and the spike-017 `{ current, instance }` split on `dataRoot`. Phase 113 removes the redundancy: the `reactive*` mirrors and the `instance` member collapse away, and the ~189 in-scope consumer `.current` reads (NOT the ~524 milestone-level figure — see below) flatten to bare class-field reads.

The single hardest correctness issue is **NOT mechanical**: when `appSettings` / `dataRoot` / `locale` stop being stable `{ current }` handle objects and become bare reactive fields, they cross the line from "stable reference (safe to destructure)" to "reactive accessor (MUST NOT destructure)." CLAUDE.md line 318 currently lists all three as *safe-to-destructure stable references* — that classification is **inverted** by the flatten. 17 production `const { appSettings, ... } = getAppContext()` destructure sites become live destructure-traps, CLAUDE.md must be updated, and the spike-009 audit's `REACTIVE_ACCESSORS` set must gain three names. This is the load-bearing work the phase exists to get right.

**Primary recommendation:** Ship FLATTEN in two sub-phases run ALONE (no concurrent large rewrite). (A) Producer-side collapse: delete `reactive*` mirrors + the `instance` member, reroute the one `.instance` producer-write to `setDataRoot`, fix the spread test's `EXPECTED_KEYS`, update CLAUDE.md + the audit accessor set. (B) Consumer-side codemod: extend the existing pure-Node `spike-009-store-codemod.mjs` (already in the repo's spike sources, Node 22 `globSync`-ready) to do the INVERSE rewrite (`<handle>.current` → bare `<handle>`) restricted to the 3 in-scope handles, plus a destructure-trap repair pass, dry-run-by-default and idempotent. Commit per producer + per consumer-directory batch so the build is green at every boundary; gate each boundary with `yarn build` + `yarn svelte-check` (151 baseline) + `yarn vitest run` (759).

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Context handle declarations (`reactive*`, `{ current, instance }`) | Frontend / `lib/contexts/**` producers | — | The redundant handles live only in the context classes; collapsing them is producer-tier work. |
| `.current` consumer reads | Frontend / `.svelte` components + route `+page`/`+layout` | `lib/contexts/**` (orchestrators read upstream `.current`) | Reads are spread across components/routes; the codemod operates on the consumer tier. |
| Producer-write path (`dataRoot` mutation) | Frontend / route `+layout.svelte` `$effect` | `dataContext` (`setDataRoot` writer) | The one `.instance` write must reroute to the already-shipped `setDataRoot` arrow field. |
| Destructure-trap contract | Frontend convention (CLAUDE.md) + lint/audit | spike-009 codemod PASS 4 | The contract is a documented project convention enforced by the audit pass. |

## Standard Stack

This is a refactor phase — **no new packages**. The tooling is the repo's existing dev stack.

### Core
| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| Node `node:fs` `globSync` + `node:fs`/`node:path` | Node v22.4.0 [VERIFIED: `node --version`] | Pure-dependency-free codemod runtime | The existing `spike-009-store-codemod.mjs` already uses `globSync` from `node:fs` (Node 22+). Zero install. [CITED: .claude/skills/.../consumer-migration-codemod.md] |
| `svelte-check` | repo catalog version | Type/reactivity gate; 151-error baseline | Phase 110–112 gate metric — "zero new errors" is the contract. [VERIFIED: 110-04-SUMMARY.md] |
| `vitest run` (frontend) | repo catalog | Unit gate (759 tests) | Phase 110 gate metric. [VERIFIED: 110-04-SUMMARY.md] |
| `vite build` via `turbo run build` | repo catalog | Build gate (14/14 turbo tasks) | Phase 110 gate metric. [VERIFIED: 110-04-SUMMARY.md] |
| Playwright (`voter-journey`, `candidate`, `a11y-smoke`) | repo catalog | E2E regression gate | Phase 110/111 gate metric. [VERIFIED: 110-04-SUMMARY.md] |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Extending pure-Node `spike-009-store-codemod.mjs` | `ts-morph` / `jscodeshift` | AST tools handle `.svelte` poorly (Svelte template ≠ JS AST; `.svelte` needs `svelte/compiler` parse, not babel/ts AST). The existing regex codemod already round-trips `.svelte` correctly with negative-lookbehind guards and is idempotent by construction. Adding an AST dependency for a 3-handle rename is over-engineering. **Use the existing Node script, extended.** |
| `ripgrep + sed` one-liner | — | Fails the idempotency + zero-false-positive bar: sed can't do the negative-lookbehind/lookahead the regex codemod already has (`$$store`, `_$store`, `storeFoo` rejection), and can't run the destructure-trap audit pass. Use only as a verification grep, not the rewrite mechanism. |

**Installation:** None. No `package.json` changes. Codemod lives at `apps/frontend/scripts/` (next to the existing spike codemod convention).

## Package Legitimacy Audit

> Not applicable — this phase installs **zero external packages**. All tooling is the repo's existing dev stack (Node built-ins, svelte-check, vitest, vite/turbo, Playwright). No registry verification required.

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

## Producer Handle Inventory

> The exact `reactive*` / `{ current, instance }` declaration sites to collapse (FLATTEN-01). All references `apps/frontend/src/lib/contexts/`. [VERIFIED: grep of the current tree, 2026-06-13]

### In-scope handles and their producers

| Handle | Canonical name after flatten | Producer (owner) | Type-decl site | Notes |
|--------|------------------------------|------------------|----------------|-------|
| `appSettings` (writable `{ current, set, update }`) | `appSettings` (KEEP — canonical) | `app/appContext.svelte.ts` | `appContext.type.ts:55-59` | Internal writes use the private `#appSettingsValue` `$state`, NOT `appSettings.set()`. Producers (`trackingService`, `surveyLink`) consume it as `ReactiveHandle<AppSettings>`. |
| `reactiveAppSettings` (`{ current }` mirror) | → **DELETE** (read same `#appSettingsValue`) | `app/appContext.svelte.ts:172,265-269` | `appContext.type.ts:60-65` | Read-only mirror over the SAME `$state`. Redundant. |
| `locale` (`{ current }`) | `locale` (KEEP — canonical) | `app/appContext.svelte.ts:174,275-279` | `appContext.type.ts:25` | Reads `#componentCtx.locale`. |
| `reactiveLocale` (`{ current }` mirror) | → **DELETE** | `app/appContext.svelte.ts:173,270-274` | `appContext.type.ts:66-70` | Mirror over the SAME `#componentCtx.locale`. |
| `dataRoot` (`{ current }`) | `dataRoot` (KEEP — canonical) | `data/dataContext.svelte.ts:57,76-81` | `dataContext.type.ts` | Reactive read (`void self.#version`). |
| `reactiveDataRoot` (`{ current, instance }` split) | → **DELETE both members** | `data/dataContext.svelte.ts:58,82-97` | `dataContext.type.ts:16` | `current` duplicates `dataRoot.current`; `instance` is the non-reactive producer-write handle — see migration note below. |

### Downstream re-declarations / forwardings (must also be removed)

| File | Lines | What |
|------|-------|------|
| `app/appContext.svelte.ts` | 172-173, 188, 265-274, 323 | `reactiveAppSettings`/`reactiveLocale`/`reactiveDataRoot` declarations, constructor installs, and the `Object.assign` forwarding of `reactiveDataRoot`. |
| `app/appContext.type.ts` | 60-70 | `reactiveAppSettings` + `reactiveLocale` type members. |
| `data/dataContext.type.ts` | 16 | `reactiveDataRoot: { readonly current; readonly instance }` type member. |
| `voter/voterContext.svelte.ts` | 152-154, 337-338, 348 | Private `#reactiveAppSettings`/`#reactiveLocale`/`#reactiveDataRoot` fields + inherited `readonly reactive*!` decls. The getter-thunks at 170/187/200-205/249/261/264/276/280/286/384-385/421/457 read `this.#reactiveX.current` and must reroute to the canonical handle/field. |
| `candidate/candidateContext.svelte.ts` | 97-99, 240-241, 251 | Same pattern: private `#reactiveX` + inherited decls; getter-thunks at 108/117/126/128/141-142/312/329/346 reroute. |
| `admin/adminContext.svelte.ts` | 81-82, 92 | Inherited `readonly reactiveAppSettings!`/`reactiveLocale!`/`reactiveDataRoot!` decls. |
| `app/appContext.spread.svelte.test.ts` | 45, 137-138, 155 | `EXPECTED_KEYS` + the mock handle set assert on the `reactive*` names — must drop them or the spread test fails after the collapse. |

### The one non-mechanical producer-write migration (`instance` member)

`reactiveDataRoot.instance` (the non-reactive read used by producer-`$effect` write paths) has **exactly one production consumer**:

- `apps/frontend/src/routes/candidate/(protected)/+layout.svelte:135` — `const dr = reactiveDataRoot.instance; dr.update(() => { dr.provideQuestionData(...); ... }); userData.init(...)` inside an `untrack(() => {...})` block in a `$effect`.

**Migration:** the `dataContext` already ships `setDataRoot = (updater) => untrack(() => updater(this.#dataRoot))` (an arrow-field writer that internalizes `untrack`). The root `+layout.svelte` already uses it (`setDataRoot((dr) => {...})` at line 123). Convert the candidate-protected layout's `untrack(() => { const dr = reactiveDataRoot.instance; dr.update(...) ...})` to `setDataRoot((dr) => { dr.update(...) })` — BUT note `userData.init(snapshot.userData)` currently sits inside the same `untrack` block; preserve its untracked semantics (either keep it in a wrapping `untrack`, or confirm `setDataRoot`'s internal `untrack` covers the closure). [CITED: dataContext.svelte.ts:106-108, candidate/(protected)/+layout.svelte:107-148]

The `+layout.svelte:114` comment ("former `reactiveDataRoot.instance` + hand-written `untrack`") confirms the root layout already completed this migration; the candidate-protected layout is the straggler.

## Consumer `.current` Inventory

> [VERIFIED: grep of `apps/frontend/src`, `.svelte`+`.ts`, 2026-06-13]

### In-scope handle `.current` read counts (the actual flatten target)

| Handle | `.current` reads | Status |
|--------|------------------|--------|
| `appSettings.current` | 112 | IN SCOPE → bare `appSettings` |
| `dataRoot.current` | 35 | IN SCOPE → bare `dataRoot` |
| `reactiveAppSettings.current` | 10 | IN SCOPE → first reroute to canonical, then bare |
| `reactiveDataRoot.current` | 21 | IN SCOPE → reroute to `dataRoot`, then bare |
| `locale.current` | 9 | IN SCOPE → bare `locale` |
| `reactiveLocale.current` | 2 | IN SCOPE → reroute to `locale`, then bare |
| **In-scope total** | **~189** | |

### Reconciling the "~524" figure

The ROADMAP/CONTEXT "~524-site" figure is a **milestone-level** estimate, NOT the FLATTEN-01 in-scope count. The frontend has **606 total `.current` reads**; the FLATTEN-01 list names only `appSettings`/`dataRoot`/`locale`(+mirrors) = ~189. The largest single OUT-OF-SCOPE handle is `getRoute.current` (**151 reads**) — explicitly NOT in the FLATTEN-01 enumeration; it stays `{ current }`. Other OUT-OF-SCOPE `.current` handles to NOT touch: `userData` (19), `topBarSettings` (19), `overlay` (19), `store` (16), `userPreferences` (14), `appCustomization` (13), `appType` (10), `darkMode` (8), `openFeedbackModal` (6), plus sub-store/local handles. **The codemod MUST be restricted to the 3 in-scope handle names** or it will corrupt out-of-scope reads.

> **Plan note:** treat the ROADMAP "~524" as a budget ceiling, not a target. The real edit count is ~189 reads across the directories below. Document this reconciliation in the plan so the verify-work step doesn't fail a "524 sites changed" expectation.

### In-scope reads by directory (codemod batch boundaries)

- `appSettings.current` (112): spread across `routes/**` (voters, candidate, admin trees), `lib/dynamic-components/**` (entityDetails×3, dataConsent×2, survey, questionHeading, navigation, feedback, entityCard), `lib/contexts/app/**` (orchestrator-internal), `lib/components/notification`, `lib/candidate/components/logoutButton`.
- `dataRoot.current` (35): `routes/**` (voters: nominations×2, info, elections, constituencies, results, questions×3; candidate: preregister, questions, profile, preview, protected-layout), `lib/dynamic-components/**` (questionHeading, entityDetails, entityCard), `lib/components/**` (electionSelector, constituencySelector).
- `locale.current` (9): `lib/dynamic-components/entityList×2`, `routes/candidate/(protected)/preview`, `routes/(voters)/nominations`, `lib/contexts/app`.
- `reactive*.current` (33): mostly `lib/contexts/{voter,candidate,data}` orchestrator-internal + `routes/admin/(protected)/{question-info,argument-condensation}` (reactiveDataRoot×4).

## Architecture Patterns

### Flatten Pattern (producer-side)

A read-only `{ current }` mirror over a backing `$state`/`$derived` collapses by **deleting the mirror and renaming the backing's public exposure to a bare reactive getter**. After collapse the field is read as `ctx.appSettings` (not `ctx.appSettings.current`).

```typescript
// BEFORE (Phase 106-112 back-compat shape)
this.appSettings = { get current() { return self.#appSettingsValue; }, set(v){...}, update(fn){...} };
this.reactiveAppSettings = { get current() { return self.#appSettingsValue; } };  // redundant mirror

// AFTER (Phase 113 flatten) — single reactive getter, spread-safe via getter forwarding
get appSettings(): AppSettings { return this.#appSettingsValue; }
// (writers, if any remain in the public type, become explicit methods e.g. setAppSettings())
```

**Spread-safety caveat (CONVENTIONS anti-pattern, REQUIREMENTS line 36-38):** `appContext` re-exposes `dataContext`/`componentContext` via `{ ...ctx }`. Spreading a class instance copies only own-enumerable props and **silently drops prototype getters**. The current `{ current }` handles are OWN-ENUMERABLE value fields precisely to survive the spread. If you convert to a prototype `get appSettings()`, the spread breaks. **Two valid options:**
1. Keep the field as an own-enumerable reactive value (assign in constructor) — but a plain value loses reactivity.
2. Keep explicit getter-forwarding in `appContext` (the pattern CLASS-04 already established: `Object.assign(this, { dataRoot: this.#dataCtx.dataRoot, ... })` becomes per-getter forwarding). The `appContext.spread.svelte.test.ts` is the guard — run it.

> **Plan must decide:** whether the flattened `appSettings`/`dataRoot`/`locale` stay own-enumerable handle objects with `.current` (collapse ONLY the `reactive*` duplicates, keep `.current`) OR become true bare fields (full `.current` removal). The ROADMAP success criteria #2 says "consumer `.current` reads flattened to **bare class-field reads**" — i.e., the FULL removal. This requires solving the spread-safety problem above for `appContext`'s forwarded `dataRoot`. Verify with `appContext.spread.svelte.test.ts` at every step.

### Idempotent Inverse Codemod (consumer-side)

The existing `spike-009-store-codemod.mjs` does `$store.X → handle.current.X`. Phase 113 needs the **inverse**: `handle.current → handle` for exactly 3 handles. The same idempotency property holds in reverse: a regex `\b(appSettings|dataRoot|locale)\.current\b` → `$1` is a no-op on re-run (after the first pass there is no `.current` to match). Reuse the file structure, swap `STORE_REWRITES` for `HANDLE_FLATTENS`, keep dry-run-by-default + `--apply`.

```js
// PASS 1 — flatten: <handle>.current → <handle>  (3 in-scope handles ONLY)
const HANDLE_FLATTENS = ['appSettings', 'dataRoot', 'locale'];
const re = new RegExp(`(?<![\\w$.])\\b(${HANDLE_FLATTENS.join('|')})\\.current\\b`, 'g');
// negative lookbehind on `.` rejects `foo.appSettings.current` (member-of-something-else)
content = content.replace(re, '$1');
```

### Anti-Patterns to Avoid
- **Flattening `getRoute.current` (151 sites) or any OUT-OF-SCOPE `.current`.** The codemod's handle allowlist is the guard. A broad `\w+\.current` regex is forbidden.
- **Naive `appSettings.current → appSettings` WITHOUT fixing destructure sites.** 17 sites destructure `appSettings`/`dataRoot`/`locale` from a context (`const { appSettings } = getAppContext()`). After the flatten those are live destructure-traps. See the CRITICAL section below.
- **Prototype getters that break the `{ ...appContext }` spread.** Guard with `appContext.spread.svelte.test.ts`.
- **Running the codemod concurrently with Phase 114 RENAME.** v2.12 collision lesson — FLATTEN runs ALONE.

## CRITICAL: appSettings/dataRoot/locale Become Reactive Accessors

> This is the load-bearing correctness finding of the phase. [VERIFIED: grep + CLAUDE.md line 318/346 + REQUIREMENTS line 20-22]

**Today** `appSettings`/`dataRoot`/`locale` are STABLE `{ current }` handle objects. CLAUDE.md line 318 explicitly lists them as **"Stable references … These can be safely destructured"** — and that is correct *today* because destructuring the handle captures a stable object whose inner `get current()` re-reads live state.

**After the flatten** they become bare reactive `$state`/`$derived` fields. Destructuring `const { appSettings } = getAppContext()` now captures the *value* once at init and never updates — a classic destructure-trap. REQUIREMENTS line 20-22 names this exactly: *"Flattening to public fields raises trap exposure, so the audit pass (spike-009 codemod PASS 4) is mandatory."*

**Concrete remediation work the plan MUST include:**

1. **Convert 17 destructure sites** (`const { appSettings, ... } = getAppContext()` reading the flattened handle) to `const ctx = getAppContext(); ... ctx.appSettings`. [VERIFIED: 17 `const {…appSettings…} = get*Context()` sites; e.g. `dynamic-components/dataConsent/DataConsent.svelte:42`, `entityDetails/EntityInfo.svelte:43`, `entityDetails/EntityOpinions.svelte:31`, `feedback/Feedback.svelte:79`]. The same sweep applies to any `dataRoot`/`locale` destructures from a context.
2. **Update CLAUDE.md "Context Destructuring Rule":** MOVE `appSettings`/`dataRoot`/`locale` from the "Stable references (safe to destructure)" list (line 318) to the "Reactive accessors (MUST read via `ctx.X`)" list (line 320). Update the line-346 caveat (the `$store.X` auto-subscribe note) since these are no longer stores. This is a mandatory contract edit — REQUIREMENTS treats CLAUDE.md destructure rule as a locked decision.
3. **Add the 3 names to the spike-009 `REACTIVE_ACCESSORS` set** (codemod PASS 2) so the audit flags any future re-introduction. [CITED: consumer-migration-codemod.md "accessor set MUST stay in sync with CLAUDE.md"]
4. **Re-run the spike-009 PASS 4 audit** after the flatten — zero traps expected.

> Without step 1+2 the build stays green but the app silently breaks at runtime (settings won't update on navigation) — exactly the Phase-61 destructure-trap class of bug (CLAUDE.md "Diagnostic origin"). This is the bug the audit exists to catch.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| `.current` → bare-field rewrite | A fresh bespoke codemod / manual editing of 189 sites | Extend `spike-009-store-codemod.mjs` (already in repo, idempotent, dry-run, `.svelte`-scoped, negative-lookbehind-guarded) | Manual editing of 189 sites is error-prone; the existing script's guards (`$$`, `_$`, suffix rejection) and idempotency are already proven. |
| Destructure-trap detection | A new AST scanner | The spike-009 PASS 2 audit (regex over `const {…} = get*Context(`) with the accessor set | Already written; just add 3 names to `REACTIVE_ACCESSORS`. |
| `untrack` producer-write path | Hand-written `untrack(() => dr.update(...))` | `setDataRoot((dr) => {...})` (ships in `dataContext`, internalizes `untrack`) | The arrow-field writer survives detach and is the canonical post-spike-017 idiom; root layout already uses it. |
| dataRoot reactivity bridge | Re-deriving the version counter | Keep the `#version` `$state` + `dataRoot.subscribe` bridge VERBATIM (§22) | REQUIREMENTS: "this version-bridge is KEPT verbatim — it does NOT simplify away." Removing it breaks DataRoot reactivity. |

**Key insight:** Every piece of machinery this phase needs (idempotent codemod, audit pass, `setDataRoot` writer, version-bridge) already exists from the spikes/Phase 106-112. Phase 113 is assembly + removal, not invention.

## Runtime State Inventory

> This is a frontend code refactor — no databases, services, OS registrations, secrets, or build artifacts carry the handle names. Verified explicitly:

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — `reactive*`/`{ current, instance }` are in-memory Svelte class fields, never persisted. Verified by grep: no DB/localStorage/sessionStorage key references the handle names. | none |
| Live service config | None — no external service config references `reactiveDataRoot`/`reactiveAppSettings`/`reactiveLocale`. | none |
| OS-registered state | None — no Task Scheduler / pm2 / systemd references. | none |
| Secrets/env vars | None — no env var or secret key references the handle names. | none |
| Build artifacts | `apps/frontend/build/` (vite output) regenerates from source; `.svelte-kit/` regenerates on `svelte-kit sync`. No stale artifact carries the old handle shape after `yarn build`. Spike test files (`_spikes-017-019/`, `_spikes-020-class-conversion/`) reference `.instance`/`reactive*` in test bodies but are git-tracked test fixtures, NOT production — verify whether they should be deleted/updated (they document the original design and may be intentionally frozen). | Confirm spike-test disposition with the plan; otherwise none. |

## Common Pitfalls

### Pitfall 1: Codemod over-reaches to out-of-scope `.current` handles
**What goes wrong:** A broad `\w+\.current` regex rewrites `getRoute.current` (151 sites), `userData.current`, `appCustomization.current`, etc. — all OUT of scope — silently corrupting them to bare names that don't exist as fields.
**Why it happens:** The FLATTEN-01 list is narrow (3 handles) but `.current` is repo-wide (606 reads).
**How to avoid:** Hard-allowlist exactly `['appSettings','dataRoot','locale']` in the codemod. Add a post-run grep gate confirming `getRoute.current` count is unchanged (151).
**Warning signs:** svelte-check error count jumps far above 151; `getRoute.current` count drops.

### Pitfall 2: Green build, silently broken runtime (destructure-trap)
**What goes wrong:** Flattened `appSettings` is destructured (`const { appSettings } = getAppContext()`); reads capture init value; settings stop updating on navigation. Build + svelte-check + unit all stay green; only E2E / manual smoke catches it.
**Why it happens:** Destructuring a reactive field is type-valid; the reactivity loss is runtime-only.
**How to avoid:** Run the spike-009 PASS 2 audit (with the 3 new accessor names) and fix all 17 destructure sites BEFORE removing the `.current` accessor. Run the voter + candidate E2E (which exercise live navigation-driven settings merges).
**Warning signs:** Audit pass flags `const { appSettings } = …`; manual smoke shows stale settings after navigation (Phase-64 "filter badge disappears on drawer open" class).

### Pitfall 3: Spread-of-context drops the flattened field
**What goes wrong:** Converting `appSettings` to a prototype `get appSettings()` makes `{ ...appContext }` silently drop it (own-enumerable-only spread) → downstream voter/candidate/admin contexts lose `appSettings`.
**Why it happens:** Spike-020/CONVENTIONS documented anti-pattern; `appContext` forwards `dataContext` via spread/`Object.assign`.
**How to avoid:** Keep explicit per-key getter-forwarding in `appContext` (CLASS-04 precedent). `appContext.spread.svelte.test.ts` is the guard — its `EXPECTED_KEYS` must be updated (drop `reactive*`) AND still assert `appSettings`/`dataRoot`/`locale` survive.
**Warning signs:** `appContext.spread.svelte.test.ts` fails; downstream context reads `undefined` for a forwarded field.

### Pitfall 4: Red build at a mid-flatten commit boundary
**What goes wrong:** Removing the `reactive*` producer handle before the orchestrator getter-thunks that read `this.#reactiveX.current` are rerouted → compile error mid-sequence.
**Why it happens:** voterContext/candidateContext private `#reactiveX` fields and their ~20 getter-thunks depend on the producer handle.
**How to avoid:** Stage so each commit is internally consistent: (a) reroute orchestrator `#reactiveX.current` reads to the canonical handle FIRST (handle still exists), (b) THEN delete the `reactive*` producer handle. Run `yarn svelte-check` (151) + `yarn build` at each commit.
**Warning signs:** svelte-check errors > 151 at a boundary; `yarn build` non-14/14.

## Code Examples

### Producer-write migration (the one non-mechanical edit)
```svelte
<!-- Source: routes/candidate/(protected)/+layout.svelte:123-148 (target shape) -->
<!-- BEFORE -->
untrack(() => {
  const dr = reactiveDataRoot.instance;
  dr.update(() => { dr.provideQuestionData(...); dr.provideEntityData(...); });
  userData.init(snapshot.userData);
});
<!-- AFTER — setDataRoot internalizes untrack for the dr mutation -->
setDataRoot((dr) => {
  dr.update(() => { dr.provideQuestionData(...); dr.provideEntityData(...); });
});
untrack(() => userData.init(snapshot.userData)); // preserve userData.init untracked semantics
```

### Idempotent flatten regex (codemod PASS 1)
```js
// Source: extend .claude/skills/.../sources/009-store-codemod-feasibility/spike-009-store-codemod.mjs
const HANDLE_FLATTENS = ['appSettings', 'dataRoot', 'locale'];      // 3 in-scope ONLY
const re = new RegExp(`(?<![\\w$.])\\b(${HANDLE_FLATTENS.join('|')})\\.current\\b`, 'g');
content = content.replace(re, '$1');   // idempotent: no `.current` left after pass 1
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `{ current }` handle objects (back-compat during class conversion) | Bare reactive class fields read as `ctx.X` | Phase 113 (this) | Removes 4 redundant handle declarations + the `instance` split; ~189 consumer reads simplified. |
| `reactiveDataRoot.instance` + hand-written `untrack` producer write | `setDataRoot((dr) => …)` arrow-field writer | Spike 017/022, landed root-layout in 106-112 | Single encapsulated write path; candidate-protected layout is the last straggler. |
| CLAUDE.md: `appSettings`/`dataRoot`/`locale` = "stable, safe to destructure" | Same names = "reactive accessor, MUST read via `ctx.X`" | Phase 113 (this) | Contract edit; destructure sites must be repaired. |

**Deprecated/outdated after this phase:**
- `reactiveAppSettings`, `reactiveLocale`, `reactiveDataRoot` handles — deleted.
- `reactiveDataRoot.instance` member — deleted (write path moved to `setDataRoot`).
- The `ReactiveHandle<AppSettings>` producer-input contract for `trackingService`/`surveyLink` — re-evaluate: if `appSettings` becomes a bare field, these producers' `{ readonly current }` input type must change OR `appContext` must wrap the field back into a handle at the producer boundary. (Plan decision point.)

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The "~524" ROADMAP figure is a milestone-level estimate; the true FLATTEN-01 in-scope count is ~189. | Consumer Inventory | If a stricter "524 sites" gate exists, verify-work could flag under-count. Mitigated by documenting reconciliation in the plan. |
| A2 | `setDataRoot`'s internal `untrack` is sufficient for the candidate-protected-layout migration; `userData.init` may need its own `untrack`. | Producer-write migration | If `userData.init` triggers a tracked re-notification outside `setDataRoot`'s closure, an `effect_update_depth_exceeded` could appear. Mitigated by wrapping `userData.init` in its own `untrack` (shown in example). |
| A3 | The `_spikes-017-019` / `_spikes-020` test files are frozen design fixtures, not files to update during the flatten. | Runtime State Inventory | If they're live regression tests, deleting the `instance`/`reactive*` shape could fail them. Mitigated by confirming disposition in the plan (they test the spike-era proposed shape, likely independent of production handles). |
| A4 | Flattening to bare fields requires solving spread-safety in `appContext` (getter-forwarding), since `{ ...appContext }` drops prototype getters. | Architecture Patterns | If a value-field approach is chosen instead, reactivity could be lost. Mitigated by the `appContext.spread.svelte.test.ts` guard. |

## Open Questions (RESOLVED)

1. **Full `.current` removal vs. reactive-mirror-only collapse?**
   - **RESOLVED: full-bare as the target, staged FLATTEN-01 (producer collapse, green) then FLATTEN-02 (consumer codemod, green)** — implemented by the 4-plan staging (113-02 producer collapse → 113-04 bare conversion + consumer codemod).
   - What we know: SC #2 says "bare class-field reads"; that's full removal. SC #1 lists only the `reactive*` duplicates + the `instance` split for FLATTEN-01.
   - What's unclear: whether `appSettings`/`dataRoot`/`locale` should retain `.current` (collapse only the duplicates) or go fully bare. Full-bare requires the spread-safety + producer-input-contract rework.
   - Recommendation: Plan should treat full-bare as the target (per SC #2) but stage it so the `reactive*`-deletion + producer-write migration (FLATTEN-01) lands and is green FIRST, then the `.current` codemod (FLATTEN-02) as a second, independently-green sub-phase. If full-bare's spread/producer rework proves large, the `.current`-retain fallback still satisfies SC #1's grep gate (zero `reactive*`).

2. **`ReactiveHandle<AppSettings>` producer-input contract.**
   - **RESOLVED: keep producers' handle-input contract unchanged; wrap the field at the appContext call site (per 113-04 Task 1) — only the consumer-facing surface goes bare.**
   - What we know: `trackingService`/`surveyLink` take `appSettings: ReactiveHandle<AppSettings>` and read `.current`.
   - What's unclear: whether to change those producers to take a getter/`() => AppSettings`, or keep wrapping the field in a handle at the `appContext` call site.
   - Recommendation: Keep the producers' handle-input contract unchanged (wrap the field at the boundary) to minimize blast radius; only the consumer-facing surface goes bare.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node `node:fs` `globSync` | codemod | ✓ | v22.4.0 | — (Node 22 ships it) |
| svelte-check | gate | ✓ | repo catalog | — |
| vitest | gate | ✓ | repo catalog | — |
| Playwright | E2E gate | ✓ | repo catalog | requires `yarn dev` + seed running |
| Local Supabase | E2E seed | ✓ (dev stack) | — | — |

**Missing dependencies with no fallback:** none.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest (unit, frontend) + Playwright (E2E) + svelte-check (type/reactivity) |
| Config file | `apps/frontend/vitest` (catalog) ; `tests/playwright.config.ts` |
| Quick run command | `cd apps/frontend && yarn svelte-check` (expect 151) |
| Full suite command | `yarn build` (14/14) + `cd apps/frontend && yarn vitest run` (759) + `yarn test:e2e --project=voter-journey --project=candidate --project=a11y-smoke` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FLATTEN-01 | Zero `reactive*` duplicate handles remain | grep gate | `grep -rn "reactiveDataRoot\|reactiveAppSettings\|reactiveLocale" apps/frontend/src --include='*.ts' --include='*.svelte'` → expect 0 (excluding spike-test fixtures) | ✅ (grep) |
| FLATTEN-01 | Spread-of-context still carries flattened fields | unit | `cd apps/frontend && yarn vitest run appContext.spread` | ✅ (`appContext.spread.svelte.test.ts` — update `EXPECTED_KEYS`) |
| FLATTEN-02 | Codemod idempotent (re-run = no-op) | smoke | `node apps/frontend/scripts/<flatten-codemod>.mjs` twice → 2nd run reports 0 changes | ❌ Wave 0 (write codemod) |
| FLATTEN-02 | Destructure-trap contract preserved | audit | spike-009 PASS 2 with `appSettings`/`dataRoot`/`locale` added → 0 traps | ✅ (extend `REACTIVE_ACCESSORS`) |
| FLATTEN-02 | Build green at every commit | gate | `yarn build` + `yarn svelte-check` (151) + `yarn vitest run` per commit | ✅ |
| FLATTEN-02 | No behavioral regression | E2E | `yarn test:e2e --project=voter-journey --project=candidate --project=a11y-smoke` | ✅ |

### Sampling Rate
- **Per task commit:** `cd apps/frontend && yarn svelte-check` (151 baseline) + `yarn build` (14/14).
- **Per producer/consumer batch merge:** `yarn vitest run` (759) + `appContext.spread` test.
- **Phase gate:** full E2E (voter-journey + candidate + a11y-smoke) green, with a **dev-server restart before the run** (mandatory — Phase 113 rewrites large context modules; stale-HMR false-green is a documented threat, project memory `e2e_hmr_staleness_restart`).

### Wave 0 Gaps
- [ ] `apps/frontend/scripts/<flatten-codemod>.mjs` — the inverse `.current → bare` codemod (extend spike-009). Covers FLATTEN-02.
- [ ] Extend spike-009 `REACTIVE_ACCESSORS` with `appSettings`, `dataRoot`, `locale` (PASS 2 audit). Covers FLATTEN-02 destructure-trap gate.
- [ ] Update `appContext.spread.svelte.test.ts` `EXPECTED_KEYS` (drop `reactiveAppSettings`/`reactiveLocale`/`reactiveDataRoot`). Covers FLATTEN-01.

## Security Domain

> `security_enforcement` not explicitly disabled in config — included for completeness. This is a pure internal-refactor phase with **no** new auth, input, crypto, network, or data-access surface.

### Applicable ASVS Categories
| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | No auth code touched. (NB: `isAuthenticated` is a separate reactive accessor already in CLAUDE.md's trap list — NOT in FLATTEN-01 scope; do not touch.) |
| V3 Session Management | no | Untouched. |
| V4 Access Control | no | Untouched. |
| V5 Input Validation | no | No new inputs. |
| V6 Cryptography | no | None. |

### Known Threat Patterns for this refactor
| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Codemod over-reach corrupting unrelated reads | Tampering (self-inflicted) | Hard handle-allowlist + post-run grep gate on `getRoute.current` (=151 unchanged) |
| Silent reactivity loss (destructure-trap) | Denial of correctness | spike-009 PASS 4 audit + E2E navigation smoke |

## Sources

### Primary (HIGH confidence)
- `apps/frontend/src/lib/contexts/app/appContext.svelte.ts` + `.type.ts` — producer handle declarations + spread test (read).
- `apps/frontend/src/lib/contexts/data/dataContext.svelte.ts` + `.type.ts` — `dataRoot`/`reactiveDataRoot`/`instance`/`setDataRoot` (read).
- `apps/frontend/src/lib/contexts/{voter,candidate,admin}/*Context.svelte.ts` — `#reactiveX` private fields + inherited decls + getter-thunks (grep).
- `apps/frontend/src/routes/candidate/(protected)/+layout.svelte` + `routes/+layout.svelte` — `.instance` vs `setDataRoot` write paths (read).
- `apps/frontend/src/lib/contexts/app/appContext.spread.svelte.test.ts` — `EXPECTED_KEYS` guard (read).
- `CLAUDE.md` "Context Destructuring Rule (Svelte 5)" lines 318/320/346 — the contract to edit (read).
- `.planning/REQUIREMENTS.md` lines 20-22, FLATTEN-01/02 — scope (read).
- `.planning/phases/110-…/110-04-SUMMARY.md` — gate metrics (build 14/14, unit 759, svelte-check 151, E2E seed chain) (read).
- `.claude/skills/spike-findings-voting-advice-application-gsd/sources/009-store-codemod-feasibility/spike-009-store-codemod.mjs` — codemod to extend (read).
- Grep counts of `apps/frontend/src` — `.current` inventory by handle + directory (executed).

### Secondary (MEDIUM confidence)
- `.claude/skills/.../references/consumer-migration-codemod.md` + `reactive-contexts.md` — spike-009 design + spike-017 split rationale.

### Tertiary (LOW confidence)
- None — all claims grounded in repo grep or read files.

## Metadata

**Confidence breakdown:**
- Producer handle inventory: HIGH — every site grepped + key files read.
- Consumer `.current` inventory: HIGH — exact counts from grep; directory breakdown verified.
- Codemod mechanism: HIGH — existing script read; idempotency property verified by construction; Node 22 `globSync` confirmed.
- Destructure-trap escalation: HIGH — CLAUDE.md classification + 17 destructure sites grepped; matches REQUIREMENTS line 20-22 verbatim.
- "~524" reconciliation: MEDIUM — inferred from 606 total vs 189 in-scope; getRoute (151) is the gap driver (A1).

**Research date:** 2026-06-13
**Valid until:** 2026-07-13 (stable internal refactor; only invalidated by intervening edits to `lib/contexts/**`).
