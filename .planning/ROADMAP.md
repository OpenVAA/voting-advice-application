# Roadmap: OpenVAA

## Milestones

- ✅ **v2.5 Dev Data Seeding Toolkit** — Phases 56-59 (shipped 2026-04-24)
- ✅ **v2.6 Svelte 5 Migration Cleanup** — Phases 60-64 (shipped 2026-04-28)
- ✅ **v2.7 Svelte 5 Polish + Supabase-Adapter Loose Ends** — Phases 65-68 (shipped 2026-05-08)
- ✅ **v2.8 Alliance Card + Frontend Hygiene Sweep** — Phases 69-72 (shipped 2026-05-10)
- ✅ **v2.9 E2E Coverage + Suite Determinism** — Phases 73-78 (shipped 2026-05-12)
- ✅ **v2.10 Test Reliability + A11y Compliance + All-Green Suite** — Phases 79-94 (shipped 2026-06-04)
- ✅ **v2.11 Svelte 5 Runes Migration + View Transitions** — Phases 95-101 (shipped 2026-06-07)
- 🚧 **v2.12 Runes-Native Cleanup** — Phases 102-105 (in progress)

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

### 🚧 v2.12 Runes-Native Cleanup (In Progress)

**Milestone Goal:** Finish the Svelte 5 runes transition — spike-decide and apply the cleanest native idiom for the 40 `{ readonly current }` context handles (and codemod the ~524 `.current` read sites), rename the now-misleading rune-store "Store" symbols to "State", clear the last non-runes stragglers (the final `svelte/store`, the stray `$:` debug line, the app-wide ESLint guard), and prove the whole thing green. Frontend-only scope (`apps/frontend/src/**`); packages untouched.

**Granularity:** fine. **Phases:** 4 (102-105). **Coverage:** 9/9 requirements mapped 1:1. Backed by the `spike-findings-voting-advice-application-gsd` skill (16 browser-verified spikes from the v2.4 + v2.11 migrations — proven patterns + the CLAUDE.md destructure-trap contract).

**Sequencing (mostly a single chain — heavy codemod-collision constraints force serialization):**

- **Phase 102 (HANDLE spike) is FIRST and GATES the handle codemod.** It classifies the 40 handles read-only vs read-write and picks the canonical idiom per class — the codemod scope in Phase 103 is finalized only after this lands.
- **Phase 103 (`.current` codemod) and Phase 104 (Store→State rename) MUST be serialized**, not run in parallel — both are large mechanical rewrites that touch many of the same frontend files and would collide. Phase 103 → Phase 104.
- **Phase 105 (straggler clearance + green gate) runs LAST.** Internally SWEEP-03 (widen the ESLint guard) must land AFTER SWEEP-01 (convert the last `svelte/store`), and GATE-01 is the terminal milestone-close verification — depends on everything before it.

**Parallel-execution map (for autonomy):** This milestone is effectively a serial chain — 102 → 103 → 104 → 105 — because of the spike-gate (102 → 103) and the two codemod-collision constraints (103 ⊥ 104 file overlap; 105's gate depends on all). RENAME and SWEEP are *logically* independent of the HANDLE workstream, but RENAME-01 collides with HANDLE-03 on shared files, so it is scheduled after 103 rather than alongside it. The only safe intra-milestone parallelism is *within* a phase (e.g. independent SWEEP-01/SWEEP-02 fixes in Phase 105 before the SWEEP-03 guard + GATE-01 close).

- [ ] **Phase 102: Handle-Idiom Spike (HANDLE-01)** (2 plans) - classify the 40 `{ readonly current }` handles read-only vs read-write, pick the canonical runes-native idiom per class, prove it on a representative slice; output a decision record + working PoC that gates Phase 103
- [ ] **Phase 103: `.current` Handle Codemod (HANDLE-02 + HANDLE-03)** - conform every handle to the chosen idiom + idempotent codemod across the ~524 consumer read/write sites, green at every commit boundary, destructure-trap contract preserved
- [ ] **Phase 104: Store → State Rename (RENAME-01 + RENAME-02)** - rename all rune-native `*Store` symbols/files/types/tests to `*State`; document the `jobStore` + `cookieStore` exclusions as intentional exceptions
- [ ] **Phase 105: Straggler Clearance + Milestone-Close Green Gate (SWEEP-01/02/03 + GATE-01)** - convert the last `svelte/store` to a rune, remove the stray `$:` debug line, widen the ESLint guard app-wide, then prove full E2E (incl. a11y-smoke) + unit + typecheck + lint all green

## Phase Details

### Phase 102: Handle-Idiom Spike (HANDLE-01)

**Goal**: A decision is locked for how the 40 `{ readonly current }` context handles become idiomatic Svelte 5 runes — classified read-only vs read-write, one canonical idiom chosen per class, proven on a representative slice — so the codemod in Phase 103 can run with a finalized, evidence-backed scope.
**Depends on**: Nothing (first phase of the milestone). This is the spike-first gate the user explicitly chose; it GATES Phase 103.
**Parallel-eligible**: No — must complete before any handle codemod work begins.
**Requirements**: HANDLE-01
**Success Criteria** (what must be TRUE):

  1. All 40 `{ readonly current }` context handles are enumerated and classified read-only vs read-write, with the per-handle classification captured in a decision record.
  2. A single canonical runes-native idiom is chosen for each class — read-only handles get a plain reactive getter (`ctx.x`, not `ctx.x.current`); read-write handles get the chosen runes-native read/write surface (get/set accessor pair or equivalent) — and any handles the spike deems must keep a handle shape are documented with rationale rather than forced.
  3. The chosen idiom is proven on a representative slice (at least one read-only and one read-write handle) with a working proof-of-concept that builds green and preserves the CLAUDE.md destructure-trap contract.
  4. The decision record finalizes the exact per-handle transformation scope that Phase 103's codemod will apply (which handles change, which keep a handle shape).

**Plans**: 2 plans

Plans:
- [ ] 102-01-PLAN.md — Decision record: enumerate + classify all `{ readonly current }` context handles (read-only / read-write / retained-exception) with per-handle target shape + retained-exception rationale = the finalized Phase-103 codemod scope (DX-5 human-review gate)
- [ ] 102-02-PLAN.md — Working PoC proving the idiom on a representative appContext slice (read-only `darkMode` fold + read-write `appType` get/set accessor pair + `getRoute` fold), green build + destructure-trap contract preserved

### Phase 103: `.current` Handle Codemod (HANDLE-02 + HANDLE-03)

**Goal**: Every migratable context handle conforms to the idiom chosen in Phase 102, and every consumer read/write site (~524 `.current` sites) is mechanically converted via an idempotent codemod — with the build green at every commit boundary and the destructure-trap contract intact.
**Depends on**: Phase 102 (the spike finalizes which handles change and to what shape; the codemod scope only exists once the decision record lands). Must complete before Phase 104 (codemod-collision constraint).
**Parallel-eligible**: No — strictly after Phase 102, and MUST NOT run concurrently with Phase 104 (both touch many of the same frontend files).
**Requirements**: HANDLE-02, HANDLE-03
**Success Criteria** (what must be TRUE):

  1. Every context handle the spike marked for migration conforms to the chosen idiom — read-only handles expose a plain reactive getter (consumers read `ctx.x`, not `ctx.x.current`); read-write handles expose the chosen runes-native read/write surface — with no residual `svelte/store` shape, and any spike-exempted handles documented as retaining a handle shape.
  2. All consumer read/write sites for the migrated handles are converted to the chosen idiom via an idempotent codemod (re-running it is a no-op).
  3. The build is green at every commit boundary (no red build mid-migration).
  4. The CLAUDE.md destructure-trap contract is preserved — consumers read reactive accessors via `ctx.X`, never destructure them — verifiable against the "Context Destructuring Rule" patterns; the existing E2E suite stays green.

**Plans**: TBD
**UI hint**: yes

### Phase 104: Store → State Rename (RENAME-01 + RENAME-02)

**Goal**: Every rune-native "Store" symbol is renamed to "State" — identifiers, file names, type names, and test names — so the naming no longer implies a Svelte store that does not exist, while the two genuine non-rune exceptions are explicitly excluded and documented.
**Depends on**: Phase 103 (RENAME-01 collides with the HANDLE-03 codemod on many of the same frontend files; serializing after the handle codemod avoids a merge/collision hazard).
**Parallel-eligible**: No — MUST NOT run concurrently with Phase 103 (shared-file collision). Logically independent of the HANDLE workstream's *intent*, but file-level overlap forces this ordering.
**Requirements**: RENAME-01, RENAME-02
**Success Criteria** (what must be TRUE):

  1. All rune-native `*Store` symbols are renamed to `*State` across identifiers, file names, type names, and test names — covering `answerStore`→`answerState`, `editedAnswersStore`, `filterStore`, `popupStore`, `matchStore`, `candidateUserDataStore`, `questionBlockStore`, `questionCategoryStore`, `questionStore`, `nominationAndQuestionStore`, `paramStore`, and `pageDatumStore`.
  2. A grep gate confirms zero remaining rune-context `*Store` identifiers (excluding the documented exclusions).
  3. The server-side `jobStore` (`lib/server/admin/jobs/jobStore.ts` — a genuine in-memory data registry) and the `cookieStore` test mock are explicitly left untouched and documented as intentional exceptions.
  4. The build, typecheck, and test suites stay green after the rename (no broken imports / stale references).

**Plans**: TBD

### Phase 105: Straggler Clearance + Milestone-Close Green Gate (SWEEP-01/02/03 + GATE-01)

**Goal**: The last non-runes residue is cleared (the final real `svelte/store`, the stray `$:` debug line), the `svelte/store` ESLint guard is widened to the whole frontend tree, and the milestone closes on a fully green gate — proving the runes transition is complete and regression-free.
**Depends on**: Phases 102-104 (this is the milestone-close gate; GATE-01 can only assert green once the handle codemod and the rename have landed). Internally, SWEEP-03 lands after SWEEP-01.
**Parallel-eligible**: No — final phase, runs last. Within the phase, SWEEP-01 and SWEEP-02 are independent fixes; SWEEP-03 (guard widening) must follow SWEEP-01; GATE-01 is the terminal verification.
**Requirements**: SWEEP-01, SWEEP-02, SWEEP-03, GATE-01
**Success Criteria** (what must be TRUE):

  1. The last real `svelte/store` usage (`videoPreferences` writable in `lib/components/video/component-stores.ts`) is converted to a rune; zero `svelte/store` imports remain anywhere in `apps/frontend/src/**` (test mocks excluded and documented).
  2. The stray `$: console.info(...)` reactive statement in `TermsOfUseForm.svelte` is removed; zero `$:` reactive statements remain frontend-wide.
  3. The `svelte/store` ESLint guard is extended from `lib/contexts/**`+`routes/**` to the whole `apps/frontend/src/**` tree, and reintroducing a `svelte/store` import anywhere in the frontend fails lint (`yarn lint:check` exits 0 on the cleaned tree) — landed after SWEEP-01 so the widened guard does not flag pre-existing code.
  4. The milestone-close green gate passes: the full E2E suite (now including the a11y-smoke) + the full unit suite + `typecheck` + `lint` are all green.

**Plans**: TBD

## Progress

**Execution Order:**
A single serial chain: 102 → 103 → 104 → 105. The spike (102) gates the handle codemod (103); the rename (104) is serialized after the codemod (103) to avoid a same-file collision; the straggler clearance + green gate (105) runs last and depends on everything before it. The only safe parallelism is *within* a phase (e.g. independent SWEEP-01/SWEEP-02 fixes before the SWEEP-03 guard + GATE-01 close in Phase 105).

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 102. Handle-Idiom Spike | v2.12 | 0/TBD | Not started | - |
| 103. `.current` Handle Codemod | v2.12 | 0/TBD | Not started | - |
| 104. Store → State Rename | v2.12 | 0/TBD | Not started | - |
| 105. Straggler Clearance + Green Gate | v2.12 | 0/TBD | Not started | - |

See `.planning/MILESTONES.md` for cumulative history and `.planning/milestones/` for per-milestone roadmaps + requirements + audits.
