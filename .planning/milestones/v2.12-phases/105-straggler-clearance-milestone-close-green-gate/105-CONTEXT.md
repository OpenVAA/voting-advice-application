# Phase 105: Straggler Clearance + Milestone-Close Green Gate (SWEEP-01/02/03 + GATE-01) - Context

**Gathered:** 2026-06-09 (batch discussion — `v2.12-DISCUSSION-POINTS.md`)
**Status:** Ready for planning

<domain>
## Phase Boundary

Clear the last non-runes residue (the final real `svelte/store`, the stray `$:` debug line), widen the `svelte/store` ESLint guard to the whole frontend tree, and close the milestone on a fully green gate.

**Depends on:** Phases 102–104 (this is the milestone-close gate; GATE-01 can only assert green once the handle codemod + the rename have landed). Internally, **SWEEP-03 lands after SWEEP-01.**
**Requirements:** SWEEP-01, SWEEP-02, SWEEP-03, GATE-01. **Parallel-eligible:** No — final phase. Within the phase, SWEEP-01 ⊥ SWEEP-02 are independent; SWEEP-03 follows SWEEP-01; GATE-01 is terminal.
</domain>

<decisions>
## Implementation Decisions

### SWEEP-01 — `videoPreferences` conversion
- **D-01 (105-1 + cross-cutting K4):** Convert `videoPreferences` (`lib/components/video/component-stores.ts`) to a **plain `$state` rune module — in-memory only** (survives client-side/SPA navigation, **not** hard reloads), preserving the *current real* behavior. **No localStorage persistence added.** **Fix the two misleading docstrings** (`component-stores.ts:5` + `Video.svelte:13`): "persist across page loads" → "persist across page navigations (not hard reloads)".
  - *Rationale (user note):* the "page loads" wording was always meant to mean page *transitions*, not hard reloads; it does not need more persistence. Adding localStorage would be a silent behavior change in a pure-refactor milestone.
  - **🔒:** zero `svelte/store` imports remain anywhere in `apps/frontend/src/**` after this (test mocks excluded + documented).

### SWEEP-02 — stray `$:` removal
- **🔒:** remove the single `$: console.info('termsAccepted:', termsAccepted);` at `lib/candidate/components/termsOfUse/TermsOfUseForm.svelte:19` (confirmed the **only** `$:` reactive statement left frontend-wide). Zero `$:` remain after.

### SWEEP-03 — ESLint guard widening
- **D-02 (105-2):** Extend the `no-restricted-imports` `svelte/store` ban from `lib/contexts/**`+`routes/**` to the **whole `src/**` tree**, landed **after SWEEP-01** (so the widened guard does not flag pre-existing code). **Keep `svelte/store` test mocks excluded + documented** (e.g. the `cookieStore` mock + any `*.test.*` that legitimately imports for assertions).
  - **🔒 flat-config caveat (`eslint.config.mjs:77-79`):** flat config **REPLACES (does not merge)** the `no-restricted-imports` array for in-scope files — so the inherited deep-relative-`lib` `patterns` ban **must be re-included VERBATIM** in the widened block, or it silently drops.
  - **🔒 acceptance:** reintroducing a `svelte/store` import anywhere in the frontend fails lint; `yarn lint:check` exits 0 on the cleaned tree.

### GATE-01 — milestone-close green gate
- **D-03 (105-3 + cross-cutting K3):** Require a **3× determinism run** of the full E2E suite (now including the a11y-smoke) before declaring the gate green. Full unit + `typecheck` + `lint` all green. *(Plus: single E2E runs were already used as cheap mid-chain validation after Phases 103 + 104 — K3.)*

### Plan split
- **D-04 (105-4):** **Three plans** — (1) SWEEP-01 + SWEEP-02 independent fixes, (2) SWEEP-03 guard widening (after SWEEP-01), (3) GATE-01 terminal verification. Respects the SWEEP-01→SWEEP-03 ordering and isolates the close gate.

### Claude's Discretion
- Exact `$state` module shape for `videoPreferences` (single object rune vs per-field) as long as the `Video.svelte` consumer sites (`muted` / `textTracksHidden` / `transcriptVisible`) keep working and no `svelte/store` import remains.
- The precise glob + exclusion list for the widened guard, provided the verbatim deep-relative-`lib` pattern is preserved.
</decisions>

<specifics>
## Specific Ideas
- This phase proves the runes transition is **complete and regression-free** — it's the milestone contract.
- SWEEP-03's verbatim-pattern caveat is the single easy-to-miss footgun here (silent drop of the deep-relative-`lib` ban) — call it out in the plan.
- GATE-01 target: the v2.11 close shape (full E2E green + a11y-smoke 10/10) holds after the cleanup; 3× determinism confirms stability across the broad codemod + rename churn.
</specifics>

<canonical_refs>
## Canonical References — MUST read before planning/implementing
- `.planning/v2.12-DECISIONS.md` (K3 determinism, K4 video-prefs) + `REQUIREMENTS.md` SWEEP-01/02/03 + GATE-01.
- Current guard: `apps/frontend/eslint.config.mjs:74-102` (the v2.11 CLEAN-02 block + the flat-config-replace caveat comment) + `.planning/v2.11-DECISIONS.md` K1 (D-03 backlog = this widening).
- The in-tree persisted helper (`localStorageState`/`sessionStorageState`, `lib/contexts/utils/persistedState.svelte.ts`) — referenced only to confirm it is **not** used for `videoPreferences` (K4 declines persistence).
- `CLAUDE.md` → Svelte 5 conventions.
</canonical_refs>
