# Roadmap: OpenVAA

## Milestones

- ✅ **v2.5 Dev Data Seeding Toolkit** — Phases 56-59 (shipped 2026-04-24)
- ✅ **v2.6 Svelte 5 Migration Cleanup** — Phases 60-64 (shipped 2026-04-28)
- ✅ **v2.7 Svelte 5 Polish + Supabase-Adapter Loose Ends** — Phases 65-68 (shipped 2026-05-08)
- ✅ **v2.8 Alliance Card + Frontend Hygiene Sweep** — Phases 69-72 (shipped 2026-05-10)
- ✅ **v2.9 E2E Coverage + Suite Determinism** — Phases 73-78 (shipped 2026-05-12)
- ✅ **v2.10 Test Reliability + A11y Compliance + All-Green Suite** — Phases 79-94 (shipped 2026-06-04)
- ✅ **v2.11 Svelte 5 Runes Migration + View Transitions** — Phases 95-101 (shipped 2026-06-07)
- ⊘ **v2.12 Runes-Native Cleanup** — Phases 102-105 (SUPERSEDED 2026-06-12 by v2.13)
- 🚧 **v2.13 Context-as-Class Migration** — Phases 106+ (in progress)

See `.planning/MILESTONES.md` for cumulative history and `.planning/milestones/` for archived roadmaps + requirements.

## Phases

<details>
<summary>✅ v2.5 Dev Data Seeding Toolkit (Phases 56-59) — SHIPPED 2026-04-24</summary>

- [x] Phase 56: Generator Foundations & Plumbing (10/10 plans) — completed 2026-04-23
- [x] Phase 57: Latent-Factor Answer Model (7/7 plans) — completed 2026-04-23
- [x] Phase 58: Templates, CLI & Default Dataset (10/10 plans) — completed 2026-04-23
- [x] Phase 59: E2E Fixture Migration (7/7 plans) — completed 2026-04-24

Full details: `.planning/milestones/v2.5-ROADMAP.md`

</details>

<details>
<summary>✅ v2.6 Svelte 5 Migration Cleanup (Phases 60-64) — SHIPPED 2026-04-28</summary>

- [x] Phase 60: Layout Runes Migration & Hydration Fix (5/5 plans) — completed 2026-04-24
- [x] Phase 61: Voter-App Question Flow (3/3 plans) — completed 2026-04-25
- [x] Phase 62: Results Page Consolidation (3/3 plans) — completed 2026-04-26
- [x] Phase 63: E2E Template Extension & Greening (3/3 plans) — completed 2026-04-27
- [x] Phase 64: Voter Results Reactivity Completion (Phase 62-bis) (4/4 plans) — completed 2026-04-28

Full details: `.planning/milestones/v2.6-ROADMAP.md`

</details>

<details>
<summary>✅ v2.7 Svelte 5 Polish + Supabase-Adapter Loose Ends (Phases 65-68) — SHIPPED 2026-05-08</summary>

- [x] Phase 65: Svelte 5 Audit Sweeps (3/3 plans) — completed 2026-04-29
- [x] Phase 66: Adapter Type Cleanup (1/1 plan) — completed 2026-04-29
- [x] Phase 67: Default Seed Alliances (2/2 plans) — completed 2026-04-30
- [x] Phase 68: Dev-Tooling Trio (3/3 plans) — completed 2026-05-08 _(95 pre-existing frontend lint errors deferred per Option C)_

Full details: `.planning/milestones/v2.7-ROADMAP.md`
Audit: `.planning/milestones/v2.7-MILESTONE-AUDIT.md` (status: tech_debt — 8/8 reqs wired; 3 documented deferrals)

</details>

<details>
<summary>✅ v2.8 Alliance Card + Frontend Hygiene Sweep (Phases 69-72) — SHIPPED 2026-05-10</summary>

- [x] Phase 69: Alliance Card Lane A (2/2 plans) — completed 2026-05-09
- [x] Phase 70: Svelte 5 / SSR / a11y Warning Sweep + bind-rationale Cleanup (5/5 plans) — completed 2026-05-09
- [x] Phase 71: Frontend Strict-Typing Cleanup (3/3 plans) — completed 2026-05-09
- [x] Phase 72: Package Hygiene Trio (3/3 plans) — completed 2026-05-09

Full details: `.planning/milestones/v2.8-ROADMAP.md`
Audit: `.planning/milestones/v2.8-MILESTONE-AUDIT.md`

</details>

<details>
<summary>✅ v2.9 E2E Coverage + Suite Determinism (Phases 73-78) — SHIPPED 2026-05-12</summary>

- [x] Phase 73: Determinism Baseline (6/6 plans) — completed 2026-05-11
- [x] Phase 74: High-Leverage E2E Coverage (7/7 plans) — completed 2026-05-11
- [x] Phase 75: Question-Rendering Specs (3/3 plans) — completed 2026-05-12 _(GREEN-WITH-DEFERRAL; multi-choice deferred)_
- [x] Phase 76: Profile + A11y (4/4 plans) — completed 2026-05-12 _(GREEN-WITH-DEFERRAL; PRODUCT-GAP cells + axe cite-and-fix routed to v2.10)_
- [x] Phase 77: Settings Matrix + Question-Customization Gap-Fills (5/5 plans) — completed 2026-05-12 _(GREEN-WITH-DEFERRAL; 4 PRODUCT-GAP follow-ups; cold-start gate deferred)_
- [x] Phase 78: Cleanup Hygiene Phase (7/7 plans) — completed 2026-05-12 _(GREEN-WITH-DEFERRAL; CLEAN-05 inherited candidate-profile race routed to v2.10; constants regen DEFERRED)_

Full details: `.planning/milestones/v2.9-ROADMAP.md`
Audit: `.planning/milestones/v2.9-MILESTONE-AUDIT.md` (status: tech_debt — 24/24 reqs satisfied; 12 PASS + 12 PASS-WITH-DEFERRAL; 8 v2.10+ candidate todos filed)

</details>

<details>
<summary>✅ v2.10 Test Reliability + A11y Compliance + All-Green Suite (Phases 79-94) — SHIPPED 2026-06-04</summary>

**Goal:** Restore Playwright parity-regen capability + reach WCAG 2.1 AA on the axe-baselined routes + drive the E2E suite to all-green, then audit / refactor / reorganise the entire E2E catalog into a clean, typechecked, deterministically-green suite. Final suite: **82 passed / 2 skipped** (human-verified 2026-06-04).

- [x] Phase 79: Determinism Recovery (Cascading-Race Fix + Constants Regen) (4/4 plans) — completed 2026-05-13 _(passed-with-deferral)_
- [x] Phase 80: A11Y Axe Cite-and-Fix (1/1 plan) — completed 2026-05-13
- [x] Phase 81: A11Y-01 PRODUCT-GAP Cells — Email + URL Format (1/1 plan) — completed 2026-05-13
- [x] Phase 82: A11Y-01 PRODUCT-GAP Cell — Required-Empty (1/1 plan) — completed 2026-05-13
- [x] Phase 83: Test Reliability Follow-ups (Image-Upload Cascade + Voter-App Flakes) (1/1 plan) — completed 2026-05-13
- [x] Phase 84: Imgproxy Decoupling (2/2 plans) — completed 2026-05-14
- [x] Phase 85: Variant-Project Cascade RCA & Fix (4/4 plans) — completed 2026-05-14
- [x] Phase 86: Voter-App FAILURE-CLASS Cleanup (4/4 plans) — completed 2026-05-14
- [x] Phase 86.1: Pre-Phase-87 Convergence Sweep (3/3 plans) — completed 2026-05-19 _(INSERTED)_
- [x] Phase 86.2: E2E Suite Refactor Pass (3/3 plans) — completed 2026-05-20 _(INSERTED)_
- [x] Phase 86.3: Implement Skipped Tests (5/5 plans) — completed 2026-05-21 _(INSERTED)_
- [x] Phase 87: v2.10 All-Green Milestone-Close Anchor (1/1 plan) — completed 2026-05-21 _(PASSED-WITH-DEFERRAL)_
- [x] Phase 88: E2E Test Catalog Audit + Forward-Looking Baseline (4/4 plans) — completed 2026-05-28
- [x] Phase 89: Continuing Test Refactoring — New Candidate Journey (5/5 plans) — completed 2026-05-29
- [x] Phase 90: TIR5 Permutations — Missing-Nominations + Localisation (3/3 plans) — completed 2026-05-30 _(Stage-A i18n reversed → v2.11 i18n Stage-B)_
- [x] Phase 91: TIR6 Perm + Edit Test Additions + Visual/Perf/A11y/Bank-Auth (5/5 plans) — completed 2026-05-31
- [x] Phase 92: E2E Test Infrastructure Hardening (typecheck:tests + locator guard) (5/5 plans) — completed 2026-06-01
- [x] Phase 93: Clean Up & Reorganise E2E Tests, Fixtures, Setup, Seed (6/6 plans) — completed 2026-06-03
- [x] Phase 94: Final E2E Suite Polish — De-planning + README Triage (8/8 plans) — completed 2026-06-04

Full details: `.planning/milestones/v2.10-ROADMAP.md`
Audit: `.planning/milestones/v2.10-MILESTONE-AUDIT.md` (status: tech_debt — no blockers; 13/16 formal reqs satisfied + 3 partial documentary; final suite 82 passed / 2 skipped)

</details>

<details>
<summary>✅ v2.11 Svelte 5 Runes Migration + View Transitions (Phases 95-101) — SHIPPED 2026-06-07</summary>

**Goal:** Retire every remaining legacy `svelte/store` bridge in the frontend for idiomatic Svelte 5 runes (Domain A — 4 waves: contexts → bridges → consumer codemod → cleanup), ship the View Transitions cross-fade + WCAG 2.1 AA navigation-a11y that closes the perceived "redraw on Q→Q" (Domain B — 2 waves), then re-enable the 2 quarantined `perm-per-app-notifications` E2E tests and prove the full suite stays green vs the v2.10 baseline. Final gate: **84 passed / 0 skipped** + full unit green + a11y-smoke 10/10 + 3× determinism.

- [x] Phase 95: Domain A Wave 1 — Tier-1 Leaf Contexts (5/5 plans) — completed 2026-06-04
- [x] Phase 96: Domain A Wave 2 — Tier-2 Bridges (2/2 plans) — completed 2026-06-04
- [x] Phase 97: Domain A Wave 3 — getRoute + Consumer Codemod (2/2 plans) — completed 2026-06-05
- [x] Phase 98: Domain A Wave 4 — Cleanup (4/4 plans) — completed 2026-06-05
- [x] Phase 99: Domain B Wave A — View Transitions + Navigation a11y (4/4 plans) — completed 2026-06-04
- [x] Phase 100: Domain B Wave B — Questions Layout Restructure (2/2 plans) — completed 2026-06-04
- [x] Phase 101: Suite Re-enable + Milestone-Close Green Gate (3/3 plans) — completed 2026-06-06

Full details: `.planning/milestones/v2.11-ROADMAP.md`
Audit: `.planning/milestones/v2.11-MILESTONE-AUDIT.md` (status: tech_debt — no blockers; 22/22 reqs + 18/18 integration seams + 3/3 flows; final suite 84/0 + a11y-smoke 10/10)

</details>

<details>
<summary>⊘ v2.12 Runes-Native Cleanup (Phases 102-105) — SUPERSEDED 2026-06-12 by v2.13</summary>

**Superseded mid-flight by v2.13 Context-as-Class Migration.** Phase 102 (Handle-Idiom Spike) locked a
get/set-accessor + plain-getter idiom for the 40 `{ readonly current }` handles; Phase 103 began the
`.current` codemod (1/2 plans). The follow-on spike line (017–023) + `CONTEXT-MEMBER-AUDIT.md` then proved
the deeper move — **context-as-class** — and LOCKED it 2026-06-12. The class field subsumes the handle
idiom, so Phase 103 was abandoned and the migration restarted as v2.13; the Store→State rename (104) +
straggler clearance + green gate (105) carried forward.

- [x] Phase 102: Handle-Idiom Spike (2/2 plans) — completed 2026-06-09 _(decision superseded)_
- [~] Phase 103: `.current` Handle Codemod (1/2 plans) — abandoned _(codemod authored, never applied)_
- [ ] Phase 104: Store → State Rename — not started → **v2.13**
- [ ] Phase 105: Straggler Clearance + Green Gate — not started → **v2.13**

Full record: `.planning/milestones/v2.12-ROADMAP.md` · `.planning/milestones/v2.12-MILESTONE-AUDIT.md` · `.planning/milestones/v2.12-phases/`

</details>

### 🚧 v2.13 Context-as-Class Migration (Phases 106-116) — IN PROGRESS

**Milestone goal:** Convert OpenVAA's remaining Svelte 5 reactive contexts in `apps/frontend/src/lib/contexts/` from the factory + `{ readonly current }` handle shape into idiomatic Svelte 5 **classes** (`$state`/`$derived` fields, arrow-function methods), flatten consumer reads to bare class fields + drop the `reactiveFoo`/`Foo` duplicates, then finish the absorbed-from-v2.12 Store→State rename + straggler clearance + milestone-close green gate. Frontend-only scope (`apps/frontend/src/**`); packages untouched. Backed by spikes 017–023 + `CONTEXT-MEMBER-AUDIT.md` + `CONTEXT-CLASS-PROOF.md` + CONVENTIONS §17–22; decision **LOCKED 2026-06-12**. Three contexts (`dataContext`, `filterContext`, `darkMode`) are already converted & green as the migration template.

**Phase numbering:** continues from v2.12 (last phase 105); starts at **Phase 106** (no reset). The archived v2.12 phases (102–105) live under `.planning/milestones/v2.12-phases/`.

**Sequencing notes (derived from CONTEXT-MEMBER-AUDIT.md Part 3 §4 + the user's end-loading instruction):**

1. **Low-blast-radius-first conversion order (the audit's mandate):** Group F helper classes (CLASS-01) → leaf contexts auth/component + reconcile the 3 landed proofs (CLASS-02) → app-layer producers getRoute/survey/tracking/popupStore (CLASS-03) → orchestrators.
2. **Orchestrator dependency chain:** `appContext` (CLASS-04) composes `componentContext` + `dataContext`, so it comes AFTER CLASS-02/03. The Tier-1 orchestrators `voterContext` (CLASS-05), `candidateContext` (CLASS-06), `adminContext` (CLASS-07) all compose `appContext`, so they come AFTER CLASS-04.
3. **CLASS-05/06/07 are sibling orchestrators, parallel-eligible.** Each converts a distinct context directory (`voter/`, `candidate/`, `admin/`) and — per the proof template — retains back-compat handles so consumers stay byte-identical (the flatten comes later in Phase 113). Consumer-file overlap is therefore low for the conversion itself; producer-file overlap is nil. They may run in parallel. Serialize only if a planner finds a shared producer file edited by more than one.
4. **FLATTEN comes AFTER all CLASS conversions** — a bare class field is only readable as `instance.x` once the producer is a class. **FLATTEN-02 is the large mechanical codemod (~524 `.current` sites) and MUST run alone** — never concurrently with any other large mechanical rewrite (the same collision lesson that sank v2.12).
5. **RENAME / SWEEP / GATE are END-LOADED** (these were v2.12 Phases 104/105). RENAME touches the same `*Store` files as the class conversions + flatten, so it comes AFTER them. Within SWEEP, SWEEP-03 (widen the ESLint guard app-wide) lands AFTER SWEEP-01 (convert the last `svelte/store`) so the widened guard does not flag pre-existing code. GATE-01 is the terminal milestone-close verification — depends on everything.

**Non-negotiable technical constraints (spike lock):** DataRoot/FilterGroup stay classes (not `svelte/store`). The destructure trap survives the class move (spikes 019/020) — the CLAUDE.md "Context Destructuring Rule" stays in force, and flattening to public fields RAISES trap exposure, so the spike-009 audit pass is mandatory in the flatten phase. Detachable methods (`const { m } = ctx`) become arrow-function fields (spike 020 Group E). Initial values come from synchronous field initializers / `$derived` fields, never `$effect` (spike 023 — SSR + `effect_orphan`). The Group-C class private `#version` loop silently spins without tripping the sync depth guard (spike 022) — keep `setX`/`untrack` encapsulation. The `{ ...dataCtx }` spread-of-context drops prototype getters on class instances — appContext (CLASS-04) must use explicit getter forwarding.

**Parallel-execution map:**

```
106 ─→ 107 ─┐
       108 ─┴─→ 109 ─→ ┌─ 110 ─┐
106 ─→ 108 ─┘          ├─ 111 ─┼─→ 113 ─→ 114 ─→ 115 ─→ 116
                       └─ 112 ─┘
```

- **106 → 107 / 108:** CLASS-01 (Group F helpers) must land first; CLASS-02 and CLASS-03 both consume those helpers (componentContext reads darkMode; appContext producers use PopupStore/persistedState). 107 and 108 are independent of each other and may run in parallel after 106.
- **109 (CLASS-04 appContext)** depends on BOTH 107 and 108 (it composes componentContext + the app producers).
- **110 / 111 / 112 (CLASS-05/06/07)** all depend on 109 and are mutually parallel-eligible.
- **113 (FLATTEN)** depends on all of 110/111/112 — runs ALONE (FLATTEN-02 is the big codemod).
- **114 (RENAME) → 115 (SWEEP) → 116 (GATE)** are a strict serial tail.

**Phase checklist:**

- [x] **Phase 106: Group F Helper Classes** — formalize the already-class-shaped helper factories (PopupStore, VideoController, SettingsOverlay, persistedState) as real Svelte 5 classes (completed 2026-06-12)
- [x] **Phase 107: Leaf Contexts + Proof Reconciliation** — convert authContext + componentContext to classes; reconcile darkMode/dataContext/filterContext to the final idiom (completed 2026-06-12)
- [ ] **Phase 108: App-Layer Producer Contexts** — convert getRoute, survey, trackingService, popupStore to classes
- [ ] **Phase 109: appContext Orchestrator + Spread Fix + PoC Removal** — convert appContext to a class; explicit getter forwarding; remove the Phase-102 `_poc*` scaffolding
- [ ] **Phase 110: voterContext Orchestrator + Voter Sub-Stores** — convert voterContext + answer/match/nomination/filter/utils sub-stores to classes
- [ ] **Phase 111: candidateContext Orchestrator + UserData Store** — convert candidateContext + candidateUserDataStore to classes
- [ ] **Phase 112: adminContext + Job Stores** — convert adminContext + jobStores to classes; preserve the v2.11 explicit auth-forwarding fix
- [ ] **Phase 113: Handle Flatten + De-duplication** — drop `reactiveFoo`/`Foo` duplicates; codemod `.current` reads to bare class fields; remove back-compat handles
- [ ] **Phase 114: Store → State Rename** — rename all rune-native `*Store` symbols/files/types/tests to `*State`; document the jobStore + cookieStore exclusions
- [ ] **Phase 115: Straggler Clearance** — convert the last `svelte/store` (videoPreferences); remove the stray `$:` debug line; widen the ESLint guard app-wide
- [ ] **Phase 116: Milestone-Close Green Gate** — full E2E (incl. a11y-smoke) + unit + typecheck + lint all green

## Phase Details

### Phase 106: Group F Helper Classes

**Goal**: The already-class-shaped helper factories are real Svelte 5 classes, establishing the lowest-blast-radius foundation the rest of the migration builds on.
**Depends on**: Nothing (first phase of the milestone)
**Parallel-eligible**: No (foundation; 107 + 108 depend on it)
**Requirements**: CLASS-01
**Success Criteria** (what must be TRUE):

  1. `PopupStore` (`app/popup/popupStore`), `VideoController` (layout `video`), `SettingsOverlay` (`utils/SettingsOverlay`), and `persistedState` (`utils/persistedState`, underlying `userPreferences`/`answers`) are each a Svelte 5 `class` with `$state`/`$derived` fields and arrow/bound methods — no factory-closure return objects.
  2. Persistence in the `persistedState` class is imperative (never `$effect`), so the class constructs outside any effect context (SSR/factory-safe) per spike 021/023.
  3. Detachable methods on these helpers are arrow-function fields, surviving `const { m } = instance` detach (spike 020 Group E).
  4. `yarn build` (client + SSR) + `yarn vitest run src/lib/contexts/` + `yarn svelte-check` are all green with zero new errors; consumers of these helpers are byte-identical.

**Plans**: 4 plans (all Wave 1, parallel — disjoint files)

  - [x] 106-01-PLAN.md — popupStore() → class PopupStore (queue $state + $derived head + arrow push/shift)
  - [x] 106-02-PLAN.md — settingsOverlay() → class SettingsOverlay (preserve untrack + associative-merge registry verbatim)
  - [x] 106-03-PLAN.md — persistedState handle → class (imperative arrow set/update, never $effect; versioned payload + D-03 no-shim + CR-01 init-persist)
  - [x] 106-04-PLAN.md — extract VideoController from layoutContext into class VideoController (+ new regression test; initLayoutContext() orchestrator-class conversion deferred, recorded for the checker)

### Phase 107: Leaf Contexts + Proof Reconciliation

**Goal**: The leaf contexts `authContext` and `componentContext` are classes, and the three already-landed proof conversions are reconciled to one consistent final class idiom.
**Depends on**: Phase 106 (componentContext composes the darkMode helper class)
**Parallel-eligible**: Yes (with Phase 108)
**Requirements**: CLASS-02
**Success Criteria** (what must be TRUE):

  1. `authContext` is a class — `isAuthenticated` is a `$derived` field (read off `page.data.session`); the four DataWriter wrappers (`logout`/`requestForgotPasswordEmail`/`resetPassword`/`setPassword`) are arrow-function fields (they are detached by consumers).
  2. `componentContext` is a class exposing the i18n surface + a `get darkMode()` that reads the `DarkMode` helper class — no `{ current }` handle re-export.
  3. `darkMode`, `dataContext`, and `filterContext` are reconciled to the final idiom — consistent field/method shape, no spike-era residue (e.g. the `reactiveDataRoot.instance` back-compat read is documented as intentional-until-flatten, not orphaned).
  4. `yarn build` (client + SSR) + `yarn vitest run src/lib/contexts/` + `yarn svelte-check` are all green with zero new errors; consumers untouched.

**Plans**: 3 plans (all Wave 1 — disjoint files, fully parallel)

- [x] 107-01-PLAN.md — convert authContext to class AuthContextProvider ($derived isAuthenticated + arrow-field DataWriter wrappers) + headless test
- [x] 107-02-PLAN.md — convert componentContext to class (own-property i18n surface + get darkMode() over composed DarkMode class); export DarkMode, keep createDarkMode back-compat for the Phase-109 PoC + headless test
- [x] 107-03-PLAN.md — reconcile dataContext + filterContext doc-comments to the §17/§18/§20/§22 final idiom (intentional-until-Phase-113 note on reactiveDataRoot.instance); executable code byte-identical

### Phase 108: App-Layer Producer Contexts

**Goal**: The app-layer producer contexts that feed `appContext` are classes, so the orchestrator can compose them in the next phase.
**Depends on**: Phase 106 (popupStore uses the PopupStore helper class)
**Parallel-eligible**: Yes (with Phase 107)
**Requirements**: CLASS-03
**Success Criteria** (what must be TRUE):

  1. `getRoute`, `survey` (`surveyLink`), `trackingService`, and `popupStore` are each a Svelte 5 class — projections are `$derived` fields, detachable callbacks are arrow-function fields.
  2. `getRoute` preserves the spike-012 per-field `page` read (`$derived.by` over individual `$app/state.page` fields) — it does NOT read the page proxy as a single object (which would short-circuit reactivity).
  3. No `$effect` is used for initial-value derivation in these producers (synchronous field initializers / `$derived` fields only — spike 023); `survey`'s `$derived.by` over `appSettings.current` + `sessionId.current` recomputes reactively.
  4. `yarn build` (client + SSR) + `yarn vitest run src/lib/contexts/` + `yarn svelte-check` are all green with zero new errors; consumers byte-identical.

**Plans**: 3 plans (Wave 1: 108-01 + 108-02 parallel, disjoint files; Wave 2: 108-03 gate, depends on 01+02)

- [x] 108-01-PLAN.md — convert getRoute + survey (surveyLink) to classes (direct-access; spike-012 per-field page read preserved)
- [x] 108-02-PLAN.md — convert trackingService to a class (spread-consumed; own-enumerable handle members + arrow-field methods + spread-safety test)
- [ ] 108-03-PLAN.md — verify/formalize popupStore class + run the phase gate (build + vitest contexts + svelte-check zero-new-errors)

### Phase 109: appContext Orchestrator + Spread Fix + PoC Removal

**Goal**: The `appContext` orchestrator is a class that composes the converted leaf + producer contexts via explicit getter forwarding, with the Phase-102 PoC scaffolding removed.
**Depends on**: Phase 107 + Phase 108 (composes componentContext + the app producers)
**Parallel-eligible**: No (single orchestrator; gates 110/111/112)
**Requirements**: CLASS-04
**Success Criteria** (what must be TRUE):

  1. `appContext` is a class; the `{ ...dataCtx }` / `{ ...componentCtx }` instance-spread is replaced with **explicit getter forwarding** (spreading a class instance silently drops prototype getters / `$state` accessors — spike finding A in CONTEXT-CLASS-PROOF).
  2. The Phase-102 `_poc*` scaffolding is gone — `_pocDarkMode`/`_pocAppType`/`_pocGetRoute` surfaces removed AND the `_poc*` PoC test objects deleted; a grep confirms zero `_poc` references remain in contexts.
  3. The SSR-correct `appSettings`/`appCustomization` merge is preserved — effective settings are derived at `$state` field init / via a `$derived` field (never `$effect`), so server-rendered HTML reflects the DB-override merge with no post-hydration flash (spike 008/023; the v2.11 fix holds).
  4. `yarn build` (client + SSR) + `yarn vitest run src/lib/contexts/` + `yarn svelte-check` are all green with zero new errors; downstream consumers of `appContext` surfaces are unbroken.

**Plans**: TBD

### Phase 110: voterContext Orchestrator + Voter Sub-Stores

**Goal**: The `voterContext` orchestrator and its voter sub-stores are classes, with every reactive accessor and the destructure-trap contract preserved, and the voter app green.
**Depends on**: Phase 109 (voterContext composes appContext Tier-1 getters)
**Parallel-eligible**: Yes (with Phase 111 + Phase 112)
**Requirements**: CLASS-05
**Success Criteria** (what must be TRUE):

  1. `voterContext` is a class, and its sub-stores `answerStore`, `matchStore`, `nominationAndQuestionStore`, `filters/filterStore`, and the `utils/*` derived projections (`paramStore`/`questionBlockStore`/`questionCategoryStore`/`questionStore`) are classes.
  2. Every reactive accessor (`selectedElections`, `selectedConstituencies`, `opinionQuestions`, `infoQuestions`, `matches`, `resultsAvailable`, `nominationsAvailable`, etc.) stays reactive when read via `ctx.X`; the destructure-trap contract is preserved (consumers do NOT destructure reactive accessors).
  3. The `answerStore` Group-C version-bridge (localStorageState, frozen payload) keeps its `setX`/`untrack` encapsulation; its `#version` private `$state` does not silently spin (spike 022).
  4. `yarn build` + `yarn vitest run` + the voter-app E2E suite (incl. a11y-smoke) are green — the voter app behaves identically.

**Plans**: TBD
**UI hint**: yes

### Phase 111: candidateContext Orchestrator + UserData Store

**Goal**: The `candidateContext` orchestrator and `candidateUserDataStore` composite bridge are classes, with all reactive accessors preserved and the candidate app green.
**Depends on**: Phase 109 (candidateContext composes appContext Tier-1 getters)
**Parallel-eligible**: Yes (with Phase 110 + Phase 112)
**Requirements**: CLASS-06
**Success Criteria** (what must be TRUE):

  1. `candidateContext` is a class, and `candidateUserDataStore` (the Group-C composite of `savedData` + `edited*`) is a class with its `$derived.by` composite merge preserved.
  2. Every reactive accessor (`answersLocked`, `profileComplete`, `selectedElections`, `opinionQuestions`, `questionBlocks`, `requiredInfoQuestions`, `unanswered*`, `idTokenClaims`, `isPreregistered`, `preregistration*`, etc.) stays reactive when read via `ctx.X`; the destructure-trap contract is preserved.
  3. Persisted fields (`isPreregistered`, `preregistration*Ids`, `firstQuestionId`) round-trip through their `localStorageState`/`sessionStorageState` class without `$effect`-driven init (spike 021/023).
  4. `yarn build` + `yarn vitest run` + the candidate-app E2E suite (incl. a11y-smoke) are green — the candidate app behaves identically.

**Plans**: TBD
**UI hint**: yes

### Phase 112: adminContext + Job Stores

**Goal**: The `adminContext` and client `jobStores` contexts are classes, preserving the v2.11 explicit auth-forwarding fix.
**Depends on**: Phase 109 (adminContext composes appContext + delegates authContext)
**Parallel-eligible**: Yes (with Phase 110 + Phase 111)
**Requirements**: CLASS-07
**Success Criteria** (what must be TRUE):

  1. `adminContext` is a class, and the client `admin/jobStores` context (the `$state` Map registry + its `$derived` projections) is a class.
  2. The v2.11 explicit auth-forwarding fix is preserved — `isAuthenticated` is a getter that re-reads the live `authContext.isAuthenticated` `$derived`, and the four auth functions are direct reference forwards; there is NO `{ ...authContext }` spread regression (which would drop the reactive getter and re-introduce the AdminNav production bug).
  3. The `appContext` composition uses explicit getter forwarding consistent with Phase 109 (no instance-spread of the class).
  4. `yarn build` + `yarn vitest run src/lib/contexts/` + `yarn svelte-check` are all green with zero new errors; the admin surface is unbroken.

**Plans**: TBD

### Phase 113: Handle Flatten + De-duplication

**Goal**: With every context now a class, the redundant `{ current }` handles and `reactiveFoo` mirrors are gone — consumers read bare class fields, and the destructure-trap contract is verified intact.
**Depends on**: Phase 110 + Phase 111 + Phase 112 (the flatten only makes sense once all producers are classes)
**Parallel-eligible**: No — **runs alone**; FLATTEN-02 is the large mechanical codemod (~524 `.current` sites) and must NOT run concurrently with any other large rewrite (the v2.12 collision lesson)
**Requirements**: FLATTEN-01, FLATTEN-02
**Success Criteria** (what must be TRUE):

  1. Every `reactiveFoo`/`Foo` duplicate handle pair is collapsed to a single reactive class field — `reactiveDataRoot`+`dataRoot` → `dataRoot`, `reactiveAppSettings`+`appSettings` → `appSettings`, `reactiveLocale`+`locale` → `locale`, and the spike-017 `{ current, instance }` dataRoot split → a single reactive `dataRoot` field. A grep gate confirms zero `reactive*` duplicate handles remain.
  2. All consumer `.current` reads on migrated handles are flattened to bare class-field reads via an idempotent codemod (re-running is a no-op), and the back-compat handles are removed from the producers.
  3. The build is green at every commit boundary (no red build at any step of the codemod), and the CLAUDE.md destructure-trap contract is preserved — consumers read `ctx.X`, never destructure reactive accessors — verified by the spike-009 audit pass (PASS 4).
  4. `yarn build` (client + SSR) + `yarn vitest run` + `yarn svelte-check` are green; the full E2E suite (incl. a11y-smoke) regresses cleanly.

**Plans**: TBD

### Phase 114: Store → State Rename

**Goal**: The rune-native `*Store` identifiers are renamed to `*State` — there are no Svelte stores behind them — with the genuine exceptions documented.
**Depends on**: Phase 113 (rename touches the same `*Store` files the class conversion + flatten just rewrote)
**Parallel-eligible**: No (serial tail; mechanical rename touching many files)
**Requirements**: RENAME-01, RENAME-02
**Success Criteria** (what must be TRUE):

  1. Every rune-native `*Store` symbol is renamed to `*State` — identifiers, file names, type names, and test names — covering `answerStore`→`answerState`, `editedAnswersStore`, `filterStore`, `popupStore`, `matchStore`, `candidateUserDataStore`, `questionBlockStore`, `questionCategoryStore`, `questionStore`, `nominationAndQuestionStore`, `paramStore`, and `pageDatumStore`.
  2. A grep gate confirms zero remaining rune-context `*Store` identifiers (excluding the documented exclusions).
  3. The server-side `jobStore` (`lib/server/admin/jobs/jobStore.ts`) and the `cookieStore` test mock are explicitly excluded and documented as intentional exceptions; the client `admin/jobStores` context IS renamed.
  4. `yarn build` + `yarn vitest run` + `yarn svelte-check` are green; the rename is purely mechanical (no behavior change).

**Plans**: TBD

### Phase 115: Straggler Clearance

**Goal**: The last real `svelte/store` usage and the stray Svelte-4 reactive statement are gone, and the `svelte/store` ESLint guard covers the whole frontend tree.
**Depends on**: Phase 114 (clears the renamed tree before widening the guard)
**Parallel-eligible**: No (serial tail); within the phase, SWEEP-03 (widen guard) must land AFTER SWEEP-01 (convert the last `svelte/store`)
**Requirements**: SWEEP-01, SWEEP-02, SWEEP-03
**Success Criteria** (what must be TRUE):

  1. The `videoPreferences` writable in `lib/components/video/component-stores.ts` is converted to a rune; zero `svelte/store` imports remain anywhere in `apps/frontend/src/**` (test mocks excluded and documented).
  2. The stray `$: console.info(...)` Svelte-4 reactive statement in `TermsOfUseForm.svelte` is removed; zero `$:` reactive statements remain frontend-wide.
  3. The `svelte/store` ESLint guard is extended from `lib/contexts/**`+`routes/**` to the whole `apps/frontend/src/**` tree, so reintroducing a `svelte/store` import anywhere in the frontend fails lint — and the existing tree passes lint under the widened guard (because SWEEP-01 landed first).
  4. `yarn lint:check` + `yarn build` + `yarn vitest run` are green.

**Plans**: TBD

### Phase 116: Milestone-Close Green Gate

**Goal**: The full milestone-close green gate passes, proving the context-as-class migration landed without regression.
**Depends on**: Everything (Phases 106-115)
**Parallel-eligible**: No (terminal verification)
**Requirements**: GATE-01
**Success Criteria** (what must be TRUE):

  1. The full E2E suite — which now includes the a11y-smoke — passes green after the migration lands.
  2. The full unit suite passes green.
  3. `typecheck` and `lint` both pass green (the widened `svelte/store` guard included).
  4. The result is recorded as the milestone-close anchor; no `svelte/store` import remains in `apps/frontend/src/**` (test mocks excepted), every context is a class, and zero `reactiveFoo` duplicate handles or rune-context `*Store` identifiers remain.

**Plans**: TBD

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 106. Group F Helper Classes | 4/4 | Complete   | 2026-06-12 |
| 107. Leaf Contexts + Proof Reconciliation | 3/3 | Complete   | 2026-06-12 |
| 108. App-Layer Producer Contexts | 2/3 | In Progress|  |
| 109. appContext Orchestrator + Spread Fix + PoC Removal | 0/TBD | Not started | - |
| 110. voterContext Orchestrator + Voter Sub-Stores | 0/TBD | Not started | - |
| 111. candidateContext Orchestrator + UserData Store | 0/TBD | Not started | - |
| 112. adminContext + Job Stores | 0/TBD | Not started | - |
| 113. Handle Flatten + De-duplication | 0/TBD | Not started | - |
| 114. Store → State Rename | 0/TBD | Not started | - |
| 115. Straggler Clearance | 0/TBD | Not started | - |
| 116. Milestone-Close Green Gate | 0/TBD | Not started | - |
