# Requirements: OpenVAA — v2.13 Context-as-Class Migration

**Defined:** 2026-06-12
**Core Value:** A reliable, well-tested VAA framework that developers can confidently extend, customize, and deploy for real elections.

> Scope is **frontend-only** (`apps/frontend/src/**`); packages untouched. This milestone converts OpenVAA's
> remaining Svelte 5 reactive contexts from the factory + `{ readonly current }` handle shape into idiomatic
> **Svelte 5 classes** (`$state`/`$derived` fields, arrow-or-bound methods), per the context-as-class decision
> LOCKED 2026-06-12 (spikes 017–023 + `CONTEXT-MEMBER-AUDIT.md` + `CONTEXT-CLASS-PROOF.md`; CONVENTIONS §17–22).
> It supersedes the attempted v2.12 handle-idiom approach. **3 contexts are already converted as proof**
> (`dataContext`, `filterContext`, `darkMode`) — the migration template. The milestone then folds in v2.12's
> still-valid Store→State rename + straggler clearance + green gate **at its end**, per the user's sequencing.

## Decisions carried from the spike lock (non-negotiable constraints)

- **DataRoot/FilterGroup stay classes, NOT `svelte/store`** — stores considered + rejected (`.svelte.ts`
  consumers would need a `fromStore` re-bridge + a redundant second observable; `set(sameRef)` reinvites the
  Phase-64 `safe_not_equal` over-fire).

- **The destructure trap survives the class conversion unchanged** (spike 019/020) — the CLAUDE.md "Context
  Destructuring Rule" stays in force; consumers read `ctx.X`, never destructure reactive accessors. Flattening
  to public fields *raises* trap exposure, so the audit pass (spike-009 codemod PASS 4) is mandatory.

- **Methods become arrow-function fields when detachable** (`const { m } = ctx`) — a regular method loses
  `this` on detach (spike 020 Group E).

- **Initial values come from synchronous field initializers / `$derived` fields, never `$effect`** — `$effect`
  never runs during SSR (spike 023; `effect_orphan` throws if a class calls `$effect` in its constructor at
  module/factory scope). Preserves the v2.11 SSR-correct appSettings merge.

- **Version-bridge encapsulation (Group C) is MORE load-bearing as a class** — a class private `#version`
  loop self-perpetuates *without* tripping Svelte's synchronous `effect_update_depth_exceeded` guard (spike
  022; 017 threw, the class silently spins). Keep `setX`/`untrack` discipline.

- **`{ ...dataCtx }` spread-of-context is broken for class instances** — spreading a class instance copies
  only own-enumerable props and silently drops prototype getters / `$state` accessors. Re-expose via explicit
  getter forwarding (CONVENTIONS anti-pattern).

## v1 Requirements

Requirements for this milestone. Each maps to a roadmap phase.

### Context-as-Class Conversion (CLASS)

Convert each context factory in `apps/frontend/src/lib/contexts/` into a Svelte 5 class, in the audit's
lowest-blast-radius-first order (Group F helpers → leaf contexts → app producers → orchestrators). Per the
proof template, a conversion may temporarily retain back-compat handles to keep consumers byte-identical; the
flatten (FLATTEN) sweep removes them.

- [x] **CLASS-01**: The already-class-shaped helper factories — `PopupStore` (`app/popup/popupStore`),
  `VideoController` (layout `video`), `SettingsOverlay` (`utils/SettingsOverlay`), and `persistedState`
  (`utils/persistedState`, underlying `userPreferences`/`answers`) — are formalized as real Svelte 5 classes
  with `$state`/`$derived` fields + arrow/bound methods. Build + unit + svelte-check stay green.

- [x] **CLASS-02**: The leaf contexts `authContext` and `componentContext` are converted to classes, and the
  three already-landed proof conversions (`darkMode`, `dataContext`, `filterContext`) are reconciled to the
  final class idiom (consistent field/method shape, no spike-era residue). Build + unit + svelte-check green.

- [x] **CLASS-03**: The app-layer producer contexts `getRoute`, `survey` (`surveyLink`), `trackingService`,
  and `popupStore` are converted to classes (`$derived` fields for projections, arrow methods for detachable
  callbacks), preserving the spike-012 per-field `page` read for `getRoute`. Build + unit + svelte-check green.

- [x] **CLASS-04**: The `appContext` orchestrator is converted to a class — including the `{ ...dataCtx }` /
  `{ ...componentCtx }` spread-of-context fix (explicit getter forwarding) and **removal of the Phase-102
  `_poc*` scaffolding** (`_pocDarkMode`/`_pocAppType`/`_pocGetRoute` surfaces + the `_poc*` PoC test objects).
  Build + unit + svelte-check green; SSR-correct appSettings/appCustomization merge preserved.

- [x] **CLASS-05**: The `voterContext` orchestrator and its voter sub-stores (`answerStore`, `matchStore`,
  `nominationAndQuestionStore`, `filters/filterStore`, and the `utils/*Store` derived projections —
  `paramStore`/`questionBlockStore`/`questionCategoryStore`/`questionStore`) are converted to classes. All
  reactive accessors and the destructure-trap contract preserved; build + unit + E2E (voter app) green.

- [x] **CLASS-06**: The `candidateContext` orchestrator and `candidateUserDataStore` (Group-C composite
  bridge) are converted to classes. All reactive accessors preserved; build + unit + E2E (candidate app) green.

- [x] **CLASS-07**: The `adminContext` and `jobStores` contexts are converted to classes, preserving the
  v2.11 explicit auth-forwarding fix (no `{ ...authContext }` spread regression). Build + unit + svelte-check
  green.

### Handle Flatten + De-duplication (FLATTEN)

Once contexts are classes, a reactive `$state`/`$derived` **field** is read directly as `instance.x` — the
`{ current }` handle and the `reactiveFoo` mirror are redundant.

- [ ] **FLATTEN-01**: All `reactiveFoo`/`Foo` duplicate handle pairs are collapsed to a single reactive class
  field — `reactiveDataRoot`+`dataRoot` → `dataRoot`, `reactiveAppSettings`+`appSettings` → `appSettings`,
  `reactiveLocale`+`locale` → `locale`, and the `{ current, instance }` dataRoot split (spike 017) → a single
  reactive `dataRoot` field. Consumers read the canonical name; a grep gate confirms zero `reactive*` duplicate
  handles remain.

- [ ] **FLATTEN-02**: All consumer `.current` reads on migrated handles are flattened to bare class-field reads
  via an idempotent codemod (re-running is a no-op), the back-compat handles are removed from the producers,
  the build is green at every commit boundary, and the CLAUDE.md destructure-trap contract is preserved
  (consumers read `ctx.X`, never destructure reactive accessors — verified by the spike-009 audit pass).

### Store → State Rename (RENAME) — *absorbed from v2.12, end-loaded*

The rune-native "Store" identifiers are misnamed — there are no Svelte stores behind them (now classes).

- [ ] **RENAME-01**: All rune-native `*Store` symbols are renamed to `*State` — identifiers, file names, type
  names, and test names — covering `answerStore`→`answerState`, `editedAnswersStore`, `filterStore`,
  `popupStore`, `matchStore`, `candidateUserDataStore`, `questionBlockStore`, `questionCategoryStore`,
  `questionStore`, `nominationAndQuestionStore`, `paramStore`, and `pageDatumStore`. A grep gate confirms zero
  remaining rune-context `*Store` identifiers (excluding the documented exclusions).

- [ ] **RENAME-02**: The server-side `jobStore` (`lib/server/admin/jobs/jobStore.ts` — a genuine in-memory
  data registry, not a Svelte rune) and the `cookieStore` test mock are explicitly excluded from the rename and
  documented as intentional exceptions. (The client `admin/jobStores` context is in scope; the server
  `jobStore` is not.)

### Straggler Clearance (SWEEP) — *absorbed from v2.12, end-loaded*

- [ ] **SWEEP-01**: The last real `svelte/store` usage (`videoPreferences` writable in
  `lib/components/video/component-stores.ts`) is converted to a rune; zero `svelte/store` imports remain
  anywhere in `apps/frontend/src/**` (test mocks excluded and documented).

- [ ] **SWEEP-02**: The stray `$: console.info(...)` Svelte-4 reactive statement in `TermsOfUseForm.svelte` is
  removed; zero `$:` reactive statements remain frontend-wide.

- [ ] **SWEEP-03**: The `svelte/store` ESLint guard is extended from `lib/contexts/**`+`routes/**` to the whole
  `apps/frontend/src/**` tree, so reintroducing a `svelte/store` import anywhere in the frontend fails lint.

### Milestone Gate (GATE)

- [ ] **GATE-01**: The milestone-close green gate passes — the full E2E suite (which now includes the
  a11y-smoke) + the full unit suite + `typecheck` + `lint` are all green after the migration lands.

## v2 Requirements

Deferred to a future release. Tracked but not in this roadmap.

- **CAND-STORE-01**: Investigate migrating the candidate answer store to a more robust architecture
  (`2026-03-28-investigate-migrating-candidate-answer-store`) — architectural, separate from the mechanical
  class conversion + rename.

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Converting DataRoot/FilterGroup themselves to `svelte/store` | Decision LOCKED — they stay classes; stores were considered and rejected (re-bridge cost + `safe_not_equal` over-fire) |
| Renaming the server-side `jobStore` | A genuine in-memory data registry, not a Svelte rune — "State" would mislead |
| Renaming the `cookieStore` test mock | A `Map`-based mock mirroring the browser `cookieStore` Web API name; not a store |
| Any `packages/**` changes | Migration is frontend-only; packages are already on the canonical paradigm |
| Retiring the destructure-trap discipline | Spike 019/020 prove it survives the class move — the CLAUDE.md rule stays in force, not removed |
| Component-API refactors (`export let`→`$props`, `<slot>`→snippets) | Already complete (v2.4 + v2.11) — grep confirms zero occurrences |
| Candidate answer-store architectural rework (CAND-STORE-01) | Deferred to a future matching/candidate-focused milestone |
| Behavioral / UX changes | Pure refactor — no user-facing behavior changes; the green gate is the contract |

## Traceability

Which phases cover which requirements. Populated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| CLASS-01 | Phase 106 | Complete |
| CLASS-02 | Phase 107 | Complete |
| CLASS-03 | Phase 108 | Complete |
| CLASS-04 | Phase 109 | Complete |
| CLASS-05 | Phase 110 | Complete |
| CLASS-06 | Phase 111 | Complete |
| CLASS-07 | Phase 112 | Complete |
| FLATTEN-01 | Phase 113 | Pending |
| FLATTEN-02 | Phase 113 | Pending |
| RENAME-01 | Phase 114 | Pending |
| RENAME-02 | Phase 114 | Pending |
| SWEEP-01 | Phase 115 | Pending |
| SWEEP-02 | Phase 115 | Pending |
| SWEEP-03 | Phase 115 | Pending |
| GATE-01 | Phase 116 | Pending |

**Coverage:**

- v1 requirements: 15 total
- Mapped to phases: 15 ✓
- Unmapped: 0 ✓

---
*Requirements defined: 2026-06-12*
*Last updated: 2026-06-12 after v2.13 roadmap creation (15/15 requirements mapped to Phases 106-116; 0 unmapped)*
