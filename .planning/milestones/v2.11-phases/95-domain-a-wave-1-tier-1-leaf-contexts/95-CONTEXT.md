# Phase 95: Domain A Wave 1 — Tier-1 Leaf Contexts - Context

**Gathered:** 2026-06-04 (batch discussion — `v2.11-DISCUSSION-POINTS.md`)
**Status:** Ready for planning

<domain>
## Phase Boundary

Every Tier-1 leaf context in `lib/contexts/**` — `appContext`, `dataContext`, the voter `answerStore` + candidate `candidateUserDataStore`, the layout-overlay registry, and `popupStore` — becomes pure idiomatic Svelte 5 runes (reactive values via getters, zero `svelte/store` import), and the real SSR `appSettings`-override gap is closed. Foundation for Waves 2–4. Independent of all of Domain B.

Requirements: **CTX-01, CTX-02, CTX-03, CTX-04, CTX-05**.
</domain>

<decisions>
## Implementation Decisions

### Plan structure
- **D-01 (95-1):** Split Wave 1 into **one plan per leaf context (~6 plans):** (a) `appContext` + SSR-gap fix, (b) `dataContext`, (c) answer stores + the shared persistence helper, (d) layout-overlay registry, (e) `popupStore`. Matches the spike inventory's "6 separate-PR-eligible" parallel migrations; the leaf contexts touch different files so plans are parallel-eligible within the phase.

### Persistent storage helper (CTX-03)
- **D-02 (95-2 + K1):** Introduce the shared helper as **`localStorageState<T>(key, default)`** — the spike-scratch name `runeLocalStorage` is NOT used in shipped code (no migration-era prefix per K1). It mirrors `localStorageWritable`'s versioned `{ version, data }` payload shape.
- **D-03 (95-2 + K1):** **No format-migration shim.** The payload format/key may change freely; stale old-format `localStorage` entries are ignored/overwritten. Dropping locally-cached voter answers on first post-migration load is acceptable. The three-layer `$state → localStorageWritable → fromStore` bridge is removed at both callsites.

### SSR appSettings override (CTX-01)
- **D-04 (95-3):** The DB-override merge moves to `$state` init (NOT `$effect`, which doesn't run on the server). **Add an explicit verification** that server-rendered HTML already carries the DB override — i.e. no post-hydration "default → override" flash. This is the real production bug spike 008 surfaced; `$effect` thereafter handles navigation-time updates only.
- **D-05:** `mergeAppSettings` becomes pure (`{ ...target, ...nonNull }`, no shared-ref mutation); the effective-settings merge stays reactive on `page.data.appSettingsData` behind the load-bearing reference-equality guard.

### dataContext (CTX-02)
- **D-06:** Drop the `writable(dataRoot)` bridge and the `get(dataRootStore)` infinite-loop workaround; expose a `current`/`instance` split with `untrack()` around the write-after-read; the version counter still propagates sequential `provideElectionData → … → provideNominationData` population to downstream `$derived`.

### Overlay registry (CTX-04) + popupStore (CTX-05)
- **D-07:** Token-keyed overlay registry + declarative `use*()` consumer API; `StackedState` and the `getLayoutContext(onDestroy)` index-revert plumbing are removed; `$effect` cleanup replaces `onDestroy`; robust to out-of-order mount/unmount. (Actual deletion of `StackedState.svelte.ts` lands in Phase 98.)
- **D-08:** `popupStore` becomes the queue-shaped Pattern-1 (a `get current()` getter; no `toStore(() => firstItem)` + `subscribe`).

### Naming (K1, milestone-wide)
- **D-09:** Rune-native replacements keep their **original file + symbol names** in place — no `rune…`/`…Native` suffixes. The only new symbol is `localStorageState` (neutral permanent name).

### Claude's Discretion
- Internal shape of `localStorageState` (as long as it's the versioned-payload core reused by `sessionStorageState` in Phase 96).
- File-level organization within each leaf migration.
</decisions>

<specifics>
## Specific Ideas
- The destructure-trap must keep reproducing (CLAUDE.md "Context Destructuring Rule") — do not "fix" it; consumers continue reading reactive accessors via `ctx.X`.
- Existing E2E suite must stay green with no behavior regression (DX-4: compared against the v2.10 close baseline, no fresh pre-run).
</specifics>

<canonical_refs>
## Canonical References — downstream agents MUST read before planning/implementing
- `Skill("spike-findings-voting-advice-application-gsd")` — proven patterns + non-negotiable constraints.
- Spikes: `001-appsettings-native-rune`, `002-dataroot-native-rune`, `003-voter-answer-store-rune`, `005-candidate-answer-store-rune`, `006-layout-overlay-rune`, `008-ssr-hydration-runes`, `010-adjacent-store-bridges` (under `.planning/spikes/`).
- `.planning/v2.11-DECISIONS.md` — milestone-wide cross-cutting decisions + K1.
- `CLAUDE.md` → "Context Destructuring Rule (Svelte 5)".
- `.planning/REQUIREMENTS.md` → binding design constraints blockquote.
</canonical_refs>
