# Phase 98: Domain A Wave 4 — Cleanup - Context

**Gathered:** 2026-06-04 (batch discussion — `v2.11-DISCUSSION-POINTS.md`)
**Status:** Ready for planning

<domain>
## Phase Boundary

The legacy store-bridge scaffolding is fully removed — `persistedState.svelte.ts` + `StackedState.svelte.ts` deleted, `Readable<T>` dropped from the relevant `.type.ts` files, zero `svelte/store` imports remaining in `lib/contexts/**` or `routes/**` — guarded against reintroduction by an ESLint rule.

**Depends on:** Phase 97 (last callers removed mid-Wave-3). Independent of Domain B.
Requirements: **CLEAN-01, CLEAN-02**.
</domain>

<decisions>
## Implementation Decisions

### ESLint guard (CLEAN-02 — requirement marks it optional; user opted IN)
- **D-01 (98-1):** **Implement a custom ESLint rule** that fails the lint gate when a `svelte/store` import is reintroduced into a migrated context file. `yarn lint:check` must exit 0 on the cleaned tree.

### Guard scope
- **D-02 (98-2):** Enforce zero `svelte/store` imports **only in `lib/contexts/**` + `routes/**`** (matches the requirement scope; `matchStore` etc. are already rune-native and out of scope).
- **D-03 (98-2 follow-up):** A backlog todo is filed to **extend the guarantee app-wide** (`lib/components`, `lib/utils`, …) in a later milestone — see `.planning/todos/pending/`.

### K1 cleanup enforcement (milestone-wide back-compat removal)
- **D-04:** This phase is the enforcement point for **K1**: confirm **no temporary bridge/shim survives** and **no migration-era names** (`rune…`/`…Native`/`…2`) remain anywhere in the migrated tree — replacements occupy their original names. Delete `persistedState.svelte.ts` + `StackedState.svelte.ts`; drop `Readable<T>` from the relevant `.type.ts` files.

### Claude's Discretion
- Whether the ESLint rule is a small local plugin vs an inline `no-restricted-imports` config — as long as it fails the gate on reintroduction and is scoped to the migrated context files.
</decisions>

<specifics>
## Specific Ideas
- Repo-wide grep `svelte/store` across `lib/contexts/**` + `routes/**` must return zero matches as the acceptance check.
</specifics>

<canonical_refs>
## Canonical References — MUST read before planning/implementing
- `Skill("spike-findings-voting-advice-application-gsd")`.
- Spikes: `003`, `005`, `006`, `010` (deletion targets) + `009` (codemod → ESLint-rule graduation).
- `.planning/v2.11-DECISIONS.md` → K1.
- `.planning/REQUIREMENTS.md` → CLEAN-01 / CLEAN-02.
</canonical_refs>
