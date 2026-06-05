# Phase 98: Domain A Wave 4 — Cleanup - Research

**Researched:** 2026-06-05
**Domain:** Svelte 5 rune-migration cleanup — store-bridge removal + ESLint guard (frontend, SvelteKit)
**Confidence:** HIGH (all claims grounded in direct file reads / greps of the working tree)

## Summary

This is the final cleanup wave of the Domain A rune migration. The ROADMAP/CONTEXT framing ("delete 2 files + add an ESLint rule") **materially understates the actual worklist**. A grep of the working tree shows that the store seam is still live: 8 files in `lib/contexts/**` and 6 route consumers in `routes/**` still import from `svelte/store` (real imports, not comments), and the migrated context factories still **export store-shaped values** (`appSettingsExport = { ...toStore(...), get current() }`, `trackingSendEventStore`, `surveyLinkStore`, store-shaped `darkMode`/`locale`/`dataRoot`). Those exports are exactly the back-compat seam K1 mandates removing. Until the producer (context) side drops `toStore`/`fromStore` and the consumer (route) side drops `fromStore`/`get`, the acceptance grep cannot reach zero.

The good news: the heavy mechanical work (the 146 `$store.X` template rewrites + 134 `$getRoute` sites) already landed in Phase 97 via the codemod. What remains is a **bounded, deterministic seam-removal** across a known file set, plus deletion of two now-dead files, plus a `.type.ts` cleanup, plus the ESLint guard. `persistedState.svelte.ts` CANNOT be deleted wholesale (it still hosts the live `localStorageState`/`sessionStorageState` rune helpers used by 5 callsites) — only its legacy `*Writable` exports get removed. `StackedState.svelte.ts` and `dataCollectionStore.ts` ARE fully dead and deletable. The `runes-test/` spike directory (under `routes/**`, in scope per D-02) carries 2 real `svelte/store` imports and must be deleted (the spike `+layout.svelte` itself says "Delete this entire directory tree when the spike concludes").

For CLEAN-02 (D-01), the repo already uses `no-restricted-imports` with a `patterns`/`regex` shape in `@openvaa/shared-config`. The idiomatic, lowest-risk guard is a **scoped flat-config override block** in `apps/frontend/eslint.config.mjs` — no custom plugin authoring, no new dependency. This satisfies D-01 ("custom ESLint rule that fails the gate") via the discretion option explicitly offered in CONTEXT.md.

**Primary recommendation:** Plan this as (1) producer-side seam removal in the 8 context files, (2) consumer-side seam removal in the 6 route files, (3) delete dead files (`StackedState.svelte.ts` + tests, `dataCollectionStore.ts`, `runes-test/` tree, legacy `*Writable` exports), (4) `.type.ts` `Readable<T>` cleanup, (5) the scoped `no-restricted-imports` guard. Gate each step on `yarn build` + `yarn test:unit` + the acceptance grep; the guard is the last task so the green-tree invariant holds.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Reactive context state (appSettings, dataRoot, tracking, survey) | Frontend Server (SSR) + Client | — | Contexts are `$state`/`$derived` runes initialized in component-init; SSR-safe getter exposure. No store bridge needed. |
| Persistent local/session storage helpers | Client | — | `localStorageState`/`sessionStorageState` are `browser`-gated rune handles; SSR returns defaults. Keep. |
| Route-level consumption of context values | Frontend Server (SSR) + Client | — | Route `.svelte` files read `ctx.X.current` directly; no `fromStore`/`get` bridge. |
| Lint-time import ban | Build / tooling | — | ESLint flat-config override; runs in `yarn lint:check` (Turbo `lint` task + tests lint). |

## Standard Stack

No new runtime packages. This phase is deletion + config only. The relevant tooling is already installed.

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| eslint (flat config) | `catalog:` (workspace catalog) | Lint gate; hosts the `no-restricted-imports` guard | Already the project's linter; flat config in `eslint.config.mjs` `[VERIFIED: file read]` |
| `@openvaa/shared-config` | `workspace:*` | Shared flat-config base that the frontend config spreads (`...sharedConfig`) | Already contains a `no-restricted-imports` rule using the `patterns`/`regex` shape `[VERIFIED: packages/shared-config/eslint.config.mjs:144-154]` |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Scoped `no-restricted-imports` override block (recommended) | Custom svelte-eslint plugin rule | A custom plugin requires authoring a rule module + registering a plugin namespace + a test harness. `no-restricted-imports` with `paths: [{ name: 'svelte/store' }]` scoped via `files:` achieves identical enforcement with ~10 lines and zero new code to maintain. The skill (consumer-migration-codemod.md:171) notes "the same regex patterns can be wrapped as a custom svelte-eslint rule" but treats it as optional polish. **Recommend the override block.** |

**Installation:** None (no new packages).

## Package Legitimacy Audit

Not applicable — this phase installs zero external packages. (Deletion + ESLint flat-config edit only.)

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CLEAN-01 | `persistedState.svelte.ts` and `StackedState.svelte.ts` deleted; `Readable<T>` dropped from relevant `.type.ts` files; zero `svelte/store` imports remain in `lib/contexts/**` + `routes/**` | Full removal worklist enumerated below (Removal Worklist). NOTE the deviation: `persistedState.svelte.ts` is NOT deletable wholesale — it hosts live rune helpers; only its legacy `*Writable` exports + `svelte/store` import are removed. `StackedState.svelte.ts` + `dataCollectionStore.ts` ARE fully deletable. |
| CLEAN-02 | An ESLint guard prevents reintroducing `svelte/store` imports in migrated context files | Scoped `no-restricted-imports` override block in `apps/frontend/eslint.config.mjs` (Custom ESLint Rule section). Existing precedent at `shared-config/eslint.config.mjs:144`. |

## Removal Worklist (the full CLEAN-01 surface — grounded in greps)

### A. Real `svelte/store` imports in `lib/contexts/**` (8 files)

| File | Line | Import | Disposition |
|------|------|--------|-------------|
| `lib/contexts/app/appContext.svelte.ts` | 4 | `import { fromStore, toStore } from 'svelte/store'` | Remove. Replace store-shaped exports (`appSettingsExport`, `localeExport`, `darkModeExport`, `appType`, `surveyLinkStore`, `trackingSendEventStore`, `openFeedbackModal`, `userPreferences`) with pure `{ current, set?, update? }` rune handles. Drop `localStorageWritable` (line 17) → use `localStorageState`. Drop `fromStore(userPreferences)` (line 158). `[VERIFIED: file read]` |
| `lib/contexts/app/appContext.type.ts` | 1 | `import type { Readable, Writable } from 'svelte/store'` | Rewrite the `AppContext` type: `Readable<T> & { readonly current: T }` → a plain `{ readonly current: T }` getter handle; `Writable<T>` → handle with `set`/`update`. `[VERIFIED: appContext.type.ts:1,27-85]` |
| `lib/contexts/app/tracking/trackingService.type.ts` | 1 | `import type { Readable, Writable } from 'svelte/store'` | Same rewrite — `sendTrackingEvent: Writable<...>`, `sessionId: Readable<string>`, `shouldTrack: Readable<boolean>` → rune handle types. `[VERIFIED: trackingService.type.ts:1,39-47]` |
| `lib/contexts/utils/dataCollectionStore.ts` | 1, 5 | `import { derived } ...` + `import type { Readable } ...` | **DELETE THE FILE** — zero importers (grep confirmed dead). `[VERIFIED: zero importers]` |
| `lib/contexts/utils/persistedState.svelte.ts` | 2, 5 | `import { toStore } ...` + `import type { Writable } ...` | Remove `svelte/store` import + delete legacy exports `localStorageWritable` (29), `sessionStorageWritable` (43), and the private `storageWritable` (160). KEEP `localStorageState`/`sessionStorageState` + `storageState` core (live, 5 callsites). File survives, slimmed. `[VERIFIED: file read]` |
| `lib/contexts/utils/StackedState.svelte.ts` | 1, 2 | `import { toStore } ...` + `import type { Readable } ...` | **DELETE THE FILE** — only consumers are its own tests + comments in `SettingsOverlay.svelte.ts`. No production callsite. `[VERIFIED: grep]` |
| `lib/contexts/data/dataContext.svelte.ts` | 5 | `import type { Readable, Subscriber, Unsubscriber } from 'svelte/store'` | Remove the hand-rolled `createDataRootBridge` `Readable<DataRoot>` bridge (lines ~16-46, 71-114) marked "removed in Wave 3/4". Keep `reactiveDataRoot` rune handle. `[VERIFIED: dataContext.svelte.ts greps]` |
| `lib/contexts/data/dataContext.type.ts` | 2 | `import type { Readable } from 'svelte/store'` | Drop the `dataRoot: Readable<DataRoot> & { current }` member; keep `reactiveDataRoot`. `[VERIFIED: full file read]` |

### B. Real `svelte/store` imports in `routes/**` (6 production files + runes-test)

| File | Line | Usage | Disposition |
|------|------|-------|-------------|
| `routes/Header.svelte` | 17 | `fromStore(appSettingsStore)` + `fromStore(darkModeStore)` (lines 37-38) | After appContext exports pure `.current` handles, read `appSettings.current` / `darkMode.current` directly; drop `fromStore`. `[VERIFIED: Header.svelte:17,37-38]` |
| `routes/Banner.svelte` | 17 | `fromStore` over appType/getRoute/openFeedbackModal (37-39) | Same — direct `.current`. `[VERIFIED: Banner.svelte:17,37-39]` |
| `routes/+layout.svelte` | 20 | `fromStore(appSettingsStore)` + `fromStore(sendTrackingEventStore)` + `get(dataRootStore)` (69,74,134) | Replace `get(dataRootStore)` with the non-reactive `reactiveDataRoot.instance` handle (Spike 002 pattern — the `instance` handle is the documented replacement for the `get()` infinite-loop workaround). `[VERIFIED: +layout.svelte:20,69,74,115-134]` |
| `routes/candidate/(protected)/+layout.svelte` | 13 | `get(dataRoot)` (133) | Same — use `reactiveDataRoot.instance`. `[VERIFIED: file:13,113-133]` |
| `routes/admin/+layout.svelte` | 10 | `fromStore(appSettings)` (25) | Direct `.current`. `[VERIFIED: admin/+layout.svelte:10,25]` |
| `routes/admin/login/+page.svelte` | 17 | `fromStore(appSettings)` + `fromStore(darkMode)` (37-38) | Direct `.current`. `[VERIFIED: admin/login/+page.svelte:17,37-38]` |
| `routes/runes-test/**` (entire tree) | — | 2 real `svelte/store` imports + many migration-era scratch names (`appSettingsRuneContext`, `getRouteRuneStore`, `popupRuneStore`, `layoutSettingsRune`, `runes-test/.../SettingsOverlay`) | **DELETE THE ENTIRE `runes-test/` DIRECTORY.** Its own `+layout.svelte` header says "Delete this entire directory tree when the spike concludes." The skill (consumer-migration-codemod.md:25) calls it "deletable post-migration." It is under `routes/**` so it is in D-02 scope and WILL fail the acceptance grep / ESLint guard if left. `[VERIFIED: runes-test/+layout.svelte header + grep]` |

### C. `Readable<T>` in `.type.ts` files (CLEAN-01 explicit)

Three `.type.ts` files import `Readable`/`Writable`:
- `lib/contexts/app/appContext.type.ts:1` — `locale`/`locales`/`darkMode`/`surveyLink` are `Readable`; `appType`/`appCustomization`/`appSettings`/`userPreferences`/`openFeedbackModal` are `Writable`.
- `lib/contexts/app/tracking/trackingService.type.ts:1` — `sendTrackingEvent` (`Writable`), `sessionId`/`shouldTrack` (`Readable`).
- `lib/contexts/data/dataContext.type.ts:2` — `dataRoot: Readable<DataRoot> & { current }`.

Each `Readable<T>` becomes `{ readonly current: T }`; each `Writable<T>` becomes `{ readonly current: T; set(v): void; update(fn): void }` (or a narrower shape matching the rune handle the producer actually returns). `[VERIFIED: all three files read]`

### D. Comment-only / out-of-scope `svelte/store` matches (do NOT touch — informational)

These appeared in the raw grep but are comments or out of scope, and must NOT be counted as removal targets:
- `SettingsOverlay.svelte.ts:27`, `candidateContext.svelte.ts:47`, `persistedState.svelte.ts:150` — comment text mentioning `svelte/store`. The ESLint `no-restricted-imports` rule keys on actual `ImportDeclaration` nodes, so comments do not trip it. (A naive line-grep acceptance check WILL match these — see Validation Architecture for the import-only grep form.)
- `voterContext.svelte.ts:229`, `candidateContext.svelte.ts:14,73-280` — these reference `localStorageState`/`sessionStorageState` (rune helpers, KEPT) or comment text, not `svelte/store` imports. `[VERIFIED: grep — no `from 'svelte/store'` in those files]`

## Architecture Patterns

### System Architecture Diagram

```
                    ┌─────────────────────────────────────────┐
  page.data ───────▶│  Context factories (lib/contexts/**)     │
  (SSR load)        │  $state / $derived / $effect runes        │
                    │  expose { current, set?, update? } getters │
                    └───────────────┬─────────────────────────┘
                                    │  (NO toStore/fromStore seam)
                                    ▼
                    ┌─────────────────────────────────────────┐
  localStorage ────▶│  localStorageState / sessionStorageState  │  ◀── KEEP
  sessionStorage    │  (browser-gated rune handles)             │
                    └───────────────┬─────────────────────────┘
                                    ▼
                    ┌─────────────────────────────────────────┐
                    │  Route consumers (routes/**.svelte)       │
                    │  read ctx.X.current directly              │  ◀── drop fromStore/get
                    └───────────────┬─────────────────────────┘
                                    ▼
                    ┌─────────────────────────────────────────┐
                    │  ESLint no-restricted-imports override     │  ◀── CLEAN-02 guard
                    │  files: contexts/** + routes/**            │
                    │  bans `svelte/store` at lint time          │
                    └─────────────────────────────────────────┘

  DELETED: StackedState.svelte.ts, dataCollectionStore.ts, runes-test/ tree,
           persistedState *Writable exports, dataContext Readable bridge
```

### Pattern 1: DataRoot `instance` handle replaces `get(store)` in route effects

**What:** Route `$effect`s that need a non-reactive DataRoot read currently do `get(dataRootStore)` to avoid an infinite loop. The rune-native replacement is the `reactiveDataRoot.instance` getter (non-reactive, same object, no version dependency).
**When to use:** Any `get(dataRoot…)` callsite in `+layout.svelte` / protected layout.
**Example:**
```ts
// Source: spike-findings skill — references/reactive-contexts.md (Pattern 2, Spike 002)
// BEFORE: const dr = get(dataRootStore);          // bridge + svelte/store
// AFTER:  const dr = reactiveDataRoot.instance;    // pure rune, non-reactive read
```

### Pattern 2: Scoped `no-restricted-imports` flat-config override (CLEAN-02)

**What:** A flat-config object scoped via `files:` that bans the `svelte/store` import path.
**When to use:** The CLEAN-02 guard.
**Example:**
```js
// Source: shape verified against packages/shared-config/eslint.config.mjs:144-154
// Add as a new object in the `export default [ ... ]` array in
// apps/frontend/eslint.config.mjs, AFTER `...sharedConfig`.
{
  files: ['src/lib/contexts/**/*.{ts,svelte}', 'src/routes/**/*.{ts,svelte}'],
  rules: {
    'no-restricted-imports': [
      'error',
      {
        paths: [
          {
            name: 'svelte/store',
            message:
              'svelte/store is banned in migrated contexts/routes (v2.11 K1). Use $state/$derived rune handles exposing `current`. See .planning/v2.11-DECISIONS.md K1.'
          }
        ]
      }
    ]
  }
}
```
**Caveat — rule replacement vs merge:** flat config does NOT deep-merge an array-valued rule; the last matching config object for a file wins for that rule key. `shared-config` already sets `no-restricted-imports` (with the deep-relative-`lib` `patterns` ban). Because this override targets a NARROWER `files` glob and is placed AFTER `...sharedConfig`, ESLint applies BOTH config objects to in-scope files and the later object's `no-restricted-imports` value REPLACES the earlier one for those files. **Therefore the override must also re-include the inherited deep-relative `patterns` ban** (copy the `patterns` array from `shared-config/eslint.config.mjs:147-153` into the override's options) so contexts/routes don't silently lose that protection. Verify with a deliberate `import X from '../../lib/foo'` in a context file → should still error.

### Anti-Patterns to Avoid
- **Deleting `persistedState.svelte.ts` wholesale:** breaks 5 live callsites (`answerStore`, `candidateUserDataStore`, `voterContext`, `candidateContext`, `trackingService`). Only the `*Writable` exports go.
- **Line-grep as the only acceptance check:** matches comment lines (3 false positives). Use the import-only grep form (Validation Architecture).
- **Putting the ESLint guard task before the seam-removal tasks:** the guard would fail the gate on the still-present imports. Guard is the LAST task.
- **Forgetting `runes-test/`:** it's under `routes/**` → in D-02 scope → fails the grep/guard if left.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Banning an import path | A custom svelte-eslint plugin + rule module + test harness | `no-restricted-imports` with `paths`/`files` scoping | Built-in ESLint core rule; zero new code; precedent already in the repo. D-01's discretion explicitly permits the inline config. |
| Non-reactive DataRoot read in effects | `get(store)` (requires svelte/store) | `reactiveDataRoot.instance` getter | The rune-native handle is the documented Spike 002 replacement; avoids both the bridge and the infinite-loop trap. |
| Versioned localStorage persistence | Re-implementing `{ version, data }` payload | KEEP `localStorageState`/`sessionStorageState` | Already rune-native, browser-gated, tested. Not in scope to touch. |

**Key insight:** Almost the entire phase is *removal*, not construction. The one constructed artifact (the ESLint guard) has a built-in primitive and an in-repo precedent — hand-rolling a plugin would be strictly worse.

## Runtime State Inventory

> This is a structural deletion + lint-config phase. No stored data, services, OS state, or secrets are renamed. Categories below verified explicitly.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — `localStorage`/`sessionStorage` KEYS are unchanged (`VoterContext-answerStore`, `candidateContext-*`, `appContext-sessionId`, `appContext-userPreferences`). The helpers backing them (`localStorageState`/`sessionStorageState`) are KEPT, not renamed. K1 already states stale old-format payloads are ignored/overwritten — no migration needed. | None — verified by grep of `localStorageState`/`sessionStorageState` callsites; keys are string literals unchanged. |
| Live service config | None — no external service references the deleted symbols. | None — verified (deletions are frontend-internal TS/Svelte). |
| OS-registered state | None — no Task Scheduler / launchd / pm2 references. | None — verified (frontend code only). |
| Secrets/env vars | None — no env var or secret name references `persistedState`/`StackedState`/`svelte/store`. | None — verified. |
| Build artifacts | `.svelte-kit/` generated types may reference deleted `runes-test/` routes until `svelte-kit sync` re-runs. `yarn build` (which runs `svelte-kit sync`) regenerates them; `yarn dev:clean` wipes `.svelte-kit`. | Run `yarn build` (or `dev:clean`) after deleting `runes-test/` so generated route types drop the deleted routes. |

**Migration-era name audit (D-04 / K1):** CLEAN. Grep for `runeLocalStorage` / `runeSessionStorage` / `*Native` / `*2`-suffix symbols across `lib/contexts/**` + `routes/**` (excluding `runes-test/`) returns ZERO migration-era survivors. The shipped helpers already use the permanent names `localStorageState` / `sessionStorageState` (per K1 / CTX-03). The only `rune…`/`…Rune` names left live INSIDE `runes-test/` (e.g. `appSettingsRuneContext`, `getRouteRuneStore`, `popupRuneStore`, `layoutSettingsRune`) — and those vanish when the directory is deleted. `*2` matches in production (`q2`, `email2`, `ov2`, `css2`, `result2`, `v2.1`) are legitimate, not migration-era. `[VERIFIED: grep]`

## Common Pitfalls

### Pitfall 1: Treating "delete persistedState.svelte.ts" literally
**What goes wrong:** The build breaks — 5 live callsites import `localStorageState`/`sessionStorageState` from it.
**Why it happens:** The ROADMAP/skill production-landing-map (SKILL.md:178) says "(entire file)" because at spike-authoring time the file was pure legacy. Phase 95/96 then ADDED the rune helpers into the same file (per CTX-03). The file is now mixed.
**How to avoid:** Delete only the legacy `*Writable` exports + the `svelte/store` import. Keep `localStorageState`/`sessionStorageState`/`storageState`. Optionally rename the slimmed file (e.g. `persistentRuneState.svelte.ts`) — but that touches 7 importers and risks the K1 "clean name" question; **recommend keeping the filename** to minimize churn unless the planner wants a rename task (then update all importers + the `.test.ts`).
**Warning signs:** `yarn build` fails with "localStorageState is not exported".

### Pitfall 2: Stale unit tests referencing deleted symbols
**What goes wrong:** `yarn test:unit` fails after deletions.
**Why it happens:** `persistedState.svelte.test.ts` tests the legacy `localStorageWritable`/`sessionStorageWritable` (lines 68-144); `StackedState.svelte.test.ts` tests the whole deleted class; `SettingsOverlay.svelte.test.ts:5,112-127` imports `StackedState` as a reference oracle in one test.
**How to avoid:** As part of deletion: remove the legacy-`*Writable` test blocks from `persistedState.svelte.test.ts` (keep the `localStorageState`/`sessionStorageState` blocks); delete `StackedState.svelte.test.ts`; rewrite `SettingsOverlay.svelte.test.ts`'s "LIFO-equivalence vs legacy StackedState" test to drop the `StackedState` oracle (or inline the expected LIFO result).
**Warning signs:** vitest "Cannot find module './StackedState.svelte'".

### Pitfall 3: Flat-config rule replacement silently dropping the inherited `patterns` ban
**What goes wrong:** The deep-relative-`lib`-import ban from `shared-config` stops applying to contexts/routes once the override sets its own `no-restricted-imports`.
**Why it happens:** Flat config replaces (does not merge) a rule's options when a later config object re-declares the same rule key for a matching file.
**How to avoid:** Include BOTH `paths: [{ name: 'svelte/store', ... }]` AND the inherited `patterns: [{ regex: '^(\\.\\./){2,}lib(/|$)', ... }]` in the override's options.
**Warning signs:** `import X from '../../lib/foo'` in a context file no longer errors after the override lands.

### Pitfall 4: `runes-test/` deletion leaving dangling generated route types
**What goes wrong:** `svelte-check`/typecheck complains about missing `./$types` for deleted routes.
**Why it happens:** `.svelte-kit/types` is generated; it lags the source until `svelte-kit sync` re-runs.
**How to avoid:** Run `yarn build` (runs `svelte-kit sync`) after the deletion; the build task in `lint:check` (`turbo run lint`) depends on built packages anyway.
**Warning signs:** typecheck errors only in `.svelte-kit/`.

## Code Examples

### Acceptance grep (import-only, excludes comments)
```bash
# Source: derived from the live grep; the `from 'svelte/store'` form excludes
# the 3 comment-line false positives a bare `svelte/store` grep produces.
grep -rn "from 'svelte/store'" \
  apps/frontend/src/lib/contexts \
  apps/frontend/src/routes
# CLEAN-01 success = ZERO lines of output.
```

### Pure rune handle replacing a store-shaped export
```ts
// Source: appContext.svelte.ts current `appSettingsExport` (lines 298-303) minus the store spread
// BEFORE: const appSettingsExport = { ...appSettings /* toStore */, get current() { return appSettingsValue; } };
// AFTER:
const appSettingsExport = {
  get current() {
    return appSettingsValue;
  }
};
// Consumers already read `appSettings.current.X` (Phase 97 codemod), so dropping
// the `...toStore(...)` spread is non-breaking for migrated consumers; the only
// breakers are the `fromStore(appSettings)` route callsites migrated in this phase.
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `toStore`/`fromStore` seam bridging runes ↔ stores | Pure `{ current, set, update }` rune handles | v2.11 Waves 1-3 (Phases 95-97) | Wave 4 removes the now-redundant seam |
| `get(dataRootStore)` infinite-loop workaround | `reactiveDataRoot.instance` non-reactive getter | Spike 002 / Phase 95 | Route effects drop `get` + `svelte/store` |
| Pre-commit/CI grep for `$store.X` | ESLint `no-restricted-imports` guard | This phase (CLEAN-02) | Reintroduction fails the lint gate automatically |

**Deprecated/outdated:**
- `localStorageWritable` / `sessionStorageWritable` / `storageWritable`: superseded by `localStorageState`/`sessionStorageState`. Delete in this phase.
- `StackedState` class: superseded by `SettingsOverlay` token-keyed registry (CTX-04). Delete.
- `dataCollectionStore`: zero importers; dead. Delete.
- `runes-test/` route tree: spike scaffold; delete.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The slimmed `persistedState.svelte.ts` keeps its filename (no rename to a `…RuneState` name). | Pitfall 1 | LOW — pure naming; if the planner/user wants a rename for K1 "clean name" purity, add a rename task touching 7 importers + 1 test. The K1 constraint targets `rune…`/`…Native`/`…2` prefixes specifically; `persistedState` is not a migration-era name, so keeping it is K1-compliant. Flagged for planner discretion. |
| A2 | `routes/candidate/(protected)/+layout.svelte:111` comment "defensive v2.1 artifact with no remaining purpose" refers to a `get(dataRoot)` block that can be replaced by `reactiveDataRoot.instance` (same as `+layout.svelte`). | Removal Worklist B | LOW — the import is `get` from svelte/store at line 13; the replacement pattern is identical to the root layout. Verify the exact effect body during planning. |
| A3 | Deleting `runes-test/` is in-scope for this phase (not deferred). | Removal Worklist B | MEDIUM — CONTEXT.md does not explicitly name `runes-test/`, but D-02 scopes the guard to `routes/**` and the acceptance grep covers `routes/**`; leaving `runes-test/` makes the grep non-zero and the ESLint guard fail. The spike `+layout.svelte` self-documents deletion at spike-end. **Recommend the planner confirm with a one-line note**, but treating it as in-scope is the only internally-consistent reading. |

**Note:** A1-A3 are dispositions the planner should surface; none block planning. No external/compliance assumptions exist in this phase.

## Open Questions

1. **Rename the slimmed `persistedState.svelte.ts`?**
   - What we know: It keeps live rune helpers; `persistedState` is not a migration-era prefix.
   - What's unclear: Whether the user wants a "clean permanent name" rename for aesthetic K1 alignment.
   - Recommendation: Keep the filename (K1-compliant as-is); only rename if the planner adds an explicit task. Low value, 8-file churn.

2. **Should the ESLint guard also ban `svelte/store` in `lib/components/**` / `lib/utils/**` now?**
   - What we know: D-03 explicitly files a backlog todo to extend app-wide LATER; D-02 scopes THIS phase to `contexts/**` + `routes/**`.
   - What's unclear: Nothing — this is locked.
   - Recommendation: Scope strictly to `contexts/**` + `routes/**`. Do NOT widen (honors D-02/D-03).

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| eslint (flat config) | CLEAN-02 guard + `yarn lint:check` | ✓ | workspace `catalog:` | — |
| `@openvaa/shared-config` | flat-config base | ✓ | `workspace:*` | — |
| vitest | `yarn test:unit` (deletion regression) | ✓ | `catalog:` (`^3.2.4` coverage) | — |
| svelte-kit / vite | `yarn build` (regenerate route types post-`runes-test/` delete) | ✓ | (frontend deps) | — |

**Missing dependencies with no fallback:** None.
**Missing dependencies with fallback:** None.

## Validation Architecture

> Nyquist validation enabled (no `workflow.nyquist_validation: false` in config). Every CLEAN success criterion below is mechanically verifiable.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 3.x (unit) + ESLint flat config (lint gate) |
| Config file | `apps/frontend/vitest` via `vitest run`; `apps/frontend/eslint.config.mjs` (lint) |
| Quick run command | `yarn workspace @openvaa/frontend test:unit` |
| Full suite command | `yarn test:unit` (all packages) + `yarn lint:check` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CLEAN-01 | Zero `svelte/store` imports in `contexts/**` + `routes/**` | grep assertion | `! grep -rq "from 'svelte/store'" apps/frontend/src/lib/contexts apps/frontend/src/routes` (exit 0 = pass) | ✅ (shell) |
| CLEAN-01 | `StackedState.svelte.ts` + `dataCollectionStore.ts` + `runes-test/` deleted | path assertion | `! test -e apps/frontend/src/lib/contexts/utils/StackedState.svelte.ts && ! test -e apps/frontend/src/lib/contexts/utils/dataCollectionStore.ts && ! test -d apps/frontend/src/routes/runes-test` | ✅ (shell) |
| CLEAN-01 | Build + typecheck still pass after deletions | build | `yarn build` then `yarn workspace @openvaa/frontend typecheck` | ✅ |
| CLEAN-01 | Unit tests pass (legacy-helper test blocks removed) | unit | `yarn workspace @openvaa/frontend test:unit` | ✅ (existing `.test.ts` edited) |
| CLEAN-02 | `yarn lint:check` exits 0 on the cleaned tree | lint | `yarn lint:check` | ✅ |
| CLEAN-02 | A deliberately-reintroduced `import { writable } from 'svelte/store'` in a context file makes lint exit non-zero | lint negative test | Add the import to e.g. `appContext.svelte.ts` → `yarn workspace @openvaa/frontend lint` → expect exit ≠ 0 → revert | ✅ (manual/scripted) |

### Sampling Rate
- **Per task commit:** `yarn workspace @openvaa/frontend test:unit` + the import-only acceptance grep.
- **Per wave merge:** `yarn build` + `yarn workspace @openvaa/frontend typecheck` + `yarn lint:check`.
- **Phase gate:** Full `yarn test:unit` + `yarn lint:check` green; acceptance grep zero; guard negative-test demonstrated before `/gsd-verify-work`.

### Wave 0 Gaps
- [ ] No new test FILES needed — deletion regression is covered by editing existing `persistedState.svelte.test.ts` (drop legacy blocks) + deleting `StackedState.svelte.test.ts` + rewriting one `SettingsOverlay.svelte.test.ts` oracle test.
- [ ] The CLEAN-02 negative test (reintroduce → lint fails) is a one-shot manual/scripted verification, not a persisted test file. The planner MAY add a tiny CI smoke that greps the eslint config for the rule, but the rule's own behavior is the test.
- [ ] No framework install needed (vitest + eslint already present).

## Security Domain

> `security_enforcement` not configured `false`; included for completeness. This phase touches no auth/crypto/input-validation surface — it deletes dead code + adds a lint rule.

### Applicable ASVS Categories
| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | Admin/candidate auth flows untouched (only `fromStore` removal in their layout consumers — behavior-preserving). |
| V3 Session Management | no | `appContext-sessionId` `sessionStorage` key + helper unchanged. |
| V4 Access Control | no | No access-control logic changed. |
| V5 Input Validation | no | No input handling changed. |
| V6 Cryptography | no | None. |

### Known Threat Patterns for this stack
| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Behavior regression in auth-consuming layouts (admin/candidate) from `fromStore`→`.current` swap | Tampering (accidental) | Behavior-preserving swap (same reactive value, different read mechanism); covered by build/typecheck + existing E2E baseline (Phase 101 gate). The CONS-03 admin-auth-reactivity fix already landed in Phase 97 — do not regress it. |

## Sources

### Primary (HIGH confidence)
- Working-tree file reads + greps (2026-06-05): `persistedState.svelte.ts`, `StackedState.svelte.ts`, `appContext.svelte.ts`, `appContext.type.ts`, `trackingService.type.ts`, `dataContext.type.ts`, `dataCollectionStore.ts`, all 6 route consumers, both ESLint configs, `package.json` scripts.
- `.planning/phases/98-domain-a-wave-4-cleanup/98-CONTEXT.md` — locked decisions D-01..D-04.
- `.planning/v2.11-DECISIONS.md` — K1 binding constraint.
- `.planning/REQUIREMENTS.md` — CLEAN-01 / CLEAN-02 text.
- `Skill("spike-findings-voting-advice-application-gsd")` — SKILL.md production-landing-map + `references/consumer-migration-codemod.md` (codemod / ESLint-graduation, `runes-test/` deletable).

### Secondary (MEDIUM confidence)
- None — all claims grounded in primary file reads.

### Tertiary (LOW confidence)
- None.

## Metadata

**Confidence breakdown:**
- Removal worklist (CLEAN-01): HIGH — every file:line verified by direct grep/read of the working tree.
- ESLint guard (CLEAN-02): HIGH — in-repo `no-restricted-imports` precedent verified; flat-config replacement caveat is a documented ESLint behavior.
- Migration-era name audit (D-04): HIGH — grep returned zero survivors outside `runes-test/`.
- `runes-test/` deletion scope: MEDIUM — internally-consistent reading of D-02 + acceptance grep, but not named verbatim in CONTEXT.md (Assumption A3).

**Research date:** 2026-06-05
**Valid until:** 2026-06-12 (fast-moving — the working tree is actively edited; re-grep before executing if other Domain-A work lands first).

## RESEARCH COMPLETE
