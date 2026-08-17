# Requirements: OpenVAA — v2.12 Runes-Native Cleanup

**Defined:** 2026-06-08
**Core Value:** A reliable, well-tested VAA framework that developers can confidently extend, customize, and deploy for real elections.

> Scope is **frontend-only** (`apps/frontend/src/**`); packages are untouched. The frontend is already ~99% runes-native after v2.4 + v2.11 (zero `export let` / `createEventDispatcher` / `on:` / `<slot>` / `$$Props`). This milestone finishes the transition: the `.current` handle-idiom decision + codemod, the rune-store "Store→State" rename, and the last straggler clearance.

## v1 Requirements

Requirements for this milestone. Each maps to a roadmap phase.

### Handle Idiom (HANDLE)

The `{ readonly current }` context handle is the v2.11 rune-handle pattern (40 declarations, ~524 `.current` read sites). It survives the context-boundary destructure trap (CLAUDE.md "Context Destructuring Rule"), so it is **not** vestigial — the spike decides the cleanest idiom per class before any codemod runs.

- [x] **HANDLE-01**: The 40 `{ readonly current }` context handles are classified read-only vs read-write, a single canonical runes-native idiom is chosen per class, and the choice is proven on a representative slice. Output: a decision record + a working proof-of-concept. _(Spike — gates HANDLE-02/03.)_
- [x] **HANDLE-02**: Every context handle conforms to the chosen idiom — read-only handles expose a plain reactive getter (read `ctx.x`, not `ctx.x.current`); read-write handles expose the chosen runes-native read/write surface (get/set accessor pair or equivalent), with no residual `svelte/store` shape. _(Exact per-handle transformation finalized by HANDLE-01; handles the spike deems must keep a handle shape are documented, not forced.)_
- [x] **HANDLE-03**: All consumer read/write sites for the migrated handles are converted to the chosen idiom via an idempotent codemod, the build is green at every commit boundary, and the CLAUDE.md destructure-trap contract is preserved (consumers read `ctx.X`, never destructure reactive accessors).

### Store → State Rename (RENAME)

The rune-native "Store" identifiers are now misnamed — there are no Svelte stores behind them anymore (227 "Store" occurrences frontend-wide).

- [ ] **RENAME-01**: All rune-native "Store" symbols are renamed to "State" — identifiers, file names, type names, and test names — covering `answerStore`→`answerState`, `editedAnswersStore`, `filterStore`, `popupStore`, `matchStore`, `candidateUserDataStore`, `questionBlockStore`, `questionCategoryStore`, `questionStore`, `nominationAndQuestionStore`, `paramStore`, and `pageDatumStore`. Verifiable by a grep gate: rune-context `*Store` identifiers → 0 (excluding the documented exclusions).
- [ ] **RENAME-02**: The server-side `jobStore` (`lib/server/admin/jobs/jobStore.ts` — a genuine in-memory data registry, not a Svelte rune) and the `cookieStore` test mock are explicitly excluded from the rename and documented as intentional exceptions.

### Straggler Clearance (SWEEP)

The last non-runes residue, plus the enforcement guard widening.

- [ ] **SWEEP-01**: The last real `svelte/store` usage (`videoPreferences` writable in `lib/components/video/component-stores.ts`) is converted to a rune; zero `svelte/store` imports remain anywhere in `apps/frontend/src/**` (test mocks excluded and documented).
- [ ] **SWEEP-02**: The stray `$: console.info(...)` Svelte-4 reactive statement in `TermsOfUseForm.svelte` is removed; zero `$:` reactive statements remain frontend-wide.
- [ ] **SWEEP-03**: The `svelte/store` ESLint guard is extended from `lib/contexts/**`+`routes/**` to the whole `apps/frontend/src/**` tree, so reintroducing a `svelte/store` import anywhere in the frontend fails lint.

### Milestone Gate (GATE)

- [ ] **GATE-01**: The milestone-close green gate passes — the full E2E suite (which now includes the a11y-smoke) + the full unit suite + `typecheck` + `lint` are all green after the cleanup lands.

## v2 Requirements

Deferred to a future release. Tracked but not in this roadmap.

### Related (not in scope this milestone)

- **CAND-STORE-01**: Investigate migrating the candidate answer store to a more robust architecture (`2026-03-28-investigate-migrating-candidate-answer-store`) — architectural, separate from the mechanical rename.

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Renaming the server-side `jobStore` | It's a genuine in-memory data registry, not a Svelte rune — "State" would be misleading |
| Renaming the `cookieStore` test mock | A `Map`-based mock mirroring the browser `cookieStore` Web API name; not a store |
| Any `packages/**` changes | Migration was frontend-only; packages are already on the canonical paradigm |
| Component-API refactors (`export let` → `$props`, `<slot>` → snippets, etc.) | Already complete (v2.4 + v2.11) — grep confirms zero occurrences |
| Forcing `.current` removal on read-write handles where the spike deems it infeasible | A documented spike outcome, not a failure — read-write handles may retain a handle/accessor shape |
| Behavioral / UX changes | Pure refactor — no user-facing behavior changes; the green gate is the contract |

## Traceability

Which phases cover which requirements. Populated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| HANDLE-01 | Phase 102 | Complete |
| HANDLE-02 | Phase 103 | Complete |
| HANDLE-03 | Phase 103 | Complete |
| RENAME-01 | Phase 104 | Pending |
| RENAME-02 | Phase 104 | Pending |
| SWEEP-01 | Phase 105 | Pending |
| SWEEP-02 | Phase 105 | Pending |
| SWEEP-03 | Phase 105 | Pending |
| GATE-01 | Phase 105 | Pending |

**Coverage:**

- v1 requirements: 9 total
- Mapped to phases: 9 (Phases 102-105)
- Unmapped: 0 ✓

---
*Requirements defined: 2026-06-08*
*Last updated: 2026-06-08 after roadmap creation — 9/9 requirements mapped 1:1 across Phases 102-105 (milestone v2.12 Runes-Native Cleanup)*
