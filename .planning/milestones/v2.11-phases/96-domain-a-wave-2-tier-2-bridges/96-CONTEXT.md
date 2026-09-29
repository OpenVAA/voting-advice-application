# Phase 96: Domain A Wave 2 — Tier-2 Bridges - Context

**Gathered:** 2026-06-04 (batch discussion — `v2.11-DISCUSSION-POINTS.md`)
**Status:** Ready for planning

<domain>
## Phase Boundary

The Tier-2 secondary bridges (`survey`, `trackingService`) and the two orchestrating contexts (`voterContext`, `candidateContext`) become rune-native factories that compose the Wave-1 Tier-1 contexts via `getXContext()` and expose their reactive accessors as getters — backed by a new `sessionStorageState` helper for `voterContext.firstQuestionId`.

**Depends on:** Phase 95 (consumes Tier-1 outputs). Independent of Domain B.
Requirements: **CTX-06, CTX-07**.
</domain>

<decisions>
## Implementation Decisions

### Session-storage helper (CTX-07)
- **D-01 (96-1 + K1):** Add **`sessionStorageState`** as a **thin sibling of `localStorageState`** sharing the same versioned-payload core (only the storage backend differs). Spike-scratch name `runeSessionStorage` is NOT used in shipped code.

### Plan structure
- **D-02 (96-2):** **Two plans:** (a) the secondary bridges — `survey` + `trackingService` + `sessionStorageState`; (b) the `voterContext` + `candidateContext` rune-native factories. Separates the low-risk helper/bridge work from the orchestration rewrite.

### Context factories (CTX-06, CTX-07)
- **D-03:** `survey` + `trackingService` drop all `fromStore`/`toStore` over appSettings / sessionId / userPreferences; values exposed via `.current` getters.
- **D-04:** `voterContext` + `candidateContext` are factories composing Tier-1 via `getXContext()`, exposing all 18+/30+ reactive accessors as getters. The **destructure-trap reproduces identically and is preserved** per the CLAUDE.md rule (consumers read `ctx.X`, never destructure reactive accessors).

### Naming (K1)
- **D-05:** Replacements keep original file + symbol names in place; no `rune…`/`…Native` suffixes survive.

### Claude's Discretion
- Internal factory composition order, as long as `getXContext()` resolution + getter exposure match the spike-007 shape.
</decisions>

<specifics>
## Specific Ideas
- Existing E2E suite stays green (DX-4 baseline = v2.10 close, no fresh pre-run).
</specifics>

<canonical_refs>
## Canonical References — MUST read before planning/implementing
- `Skill("spike-findings-voting-advice-application-gsd")`.
- Spikes: `007-context-orchestration-end-to-end`, `010-adjacent-store-bridges`.
- `.planning/v2.11-DECISIONS.md` (K1 + helper naming).
- `CLAUDE.md` → "Context Destructuring Rule (Svelte 5)".
- Phase 95 outputs (Tier-1 getters + `localStorageState`).
</canonical_refs>
