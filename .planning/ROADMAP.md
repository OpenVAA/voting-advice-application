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
- ✅ **v2.13 Context-as-Class Migration** — Phases 106-117 (shipped 2026-06-13)
- 🚧 **v2.14 E2E Coverage Expansion + Svelte 5 Idiom Polish + svelte-check Zero** — Phases 118-132 (in progress)

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

<details>
<summary>✅ v2.13 Context-as-Class Migration (Phases 106-117) — SHIPPED 2026-06-13</summary>

**Goal:** Convert OpenVAA's remaining Svelte 5 reactive contexts in `apps/frontend/src/lib/contexts/` from the factory + `{ readonly current }` handle shape into idiomatic Svelte 5 **classes**, drop the `reactiveFoo`/`Foo` duplicate handles + the Phase-102 `_poc*` scaffolding, then finish the absorbed-from-v2.12 Store→State rename + straggler clearance + milestone-close green gate. Frontend-only. Final gate: **full E2E 95/95 to the 3× determinism standard** + unit (frontend 766 + dev-seed 450) + typecheck (0 net-new over the 151 baseline) + lint green; **15/15 v1 requirements satisfied**. Phase 117 (added mid-milestone) fixed a real `$derived(ctx.dataRoot)` cold-entry reactivity bug the gate surfaced.

- [x] Phase 106: Group F Helper Classes (4/4 plans) — completed 2026-06-12
- [x] Phase 107: Leaf Contexts + Proof Reconciliation (3/3 plans) — completed 2026-06-12
- [x] Phase 108: App-Layer Producer Contexts (3/3 plans) — completed 2026-06-12
- [x] Phase 109: appContext Orchestrator + Spread Fix + PoC Removal (3/3 plans) — completed 2026-06-12
- [x] Phase 110: voterContext Orchestrator + Voter Sub-Stores (4/4 plans) — completed 2026-06-13
- [x] Phase 111: candidateContext Orchestrator + UserData Store (3/3 plans) — completed 2026-06-13
- [x] Phase 112: adminContext + Job Stores (2/2 plans) — completed 2026-06-13
- [x] Phase 113: Handle Flatten + De-duplication (4/4 plans) — completed 2026-06-13
- [x] Phase 114: Store → State Rename (4/4 plans) — completed 2026-06-13
- [x] Phase 115: Straggler Clearance (2/2 plans) — completed 2026-06-13
- [x] Phase 116: Milestone-Close Green Gate (1/1 plan) — completed 2026-06-13 (E2E 95/95, 3× determinism)
- [x] Phase 117: dataRoot Cold-Entry Reactivity Fix (2/2 plans) — completed 2026-06-13

Full details: `.planning/milestones/v2.13-ROADMAP.md`

</details>

### 🚧 v2.14 E2E Coverage Expansion + Svelte 5 Idiom Polish + svelte-check Zero (In Progress)

**Milestone Goal:** Drive the Voter & Candidate E2E suites to comprehensive feature × settings coverage (Admin App excluded from feature/E2E scope), complete the Svelte 5 runes idiom polish, and clear `apps/frontend` svelte-check from 151 → 0 — holding the 3× determinism standard throughout. Phase numbering continues from v2.13 (last phase 117) → starts at **Phase 118** (no reset). 48 v1 requirements (EPERM 11 · EFLOW 11 · EQTYP 3 · UNBLK 6 · HARDN 2 · RUNES 5 · TYPE 10) across three largely-independent workstreams. The E2E workstream follows the operator-mandated **audit → fixtures-first → specs** ordering; the bulk of the milestone (E2E coverage of EXISTING features + Svelte-5 idiom polish + svelte-check→0) is deliberately **NOT gated on building new features** — all NEW-FEATURE product work and its dependent E2E are clustered at the END (Phases 129-130), just before the close gate.

**Workstreams & sequencing:**

- **E2E audit → fixtures → existing-feature specs (Phases 118-122)** — Phase 118 is the approval gate (audit + full coverage plan, no test code; plans the end-cluster specs up front), then fixtures-first (Phase 119, includes the UNBLK-03 default-seed tooling fix), then theme-grouped existing-feature spec builds (perms 120, flows 121, bank-auth 122).
- **RUNES idiom polish (Phases 123-124)** — independent of the E2E and TYPE workstreams.
- **svelte-check → 0 (Phases 125-128)** — independent; tiered trivial → supabaseDataProvider → adapter+contexts → long-tail+tests+docs.
- **New-feature cluster (Phases 129-130)** — moved out of the front per operator directive. Phase 129 BUILDS the new features (question inputs, alliance render, nominations fetch); Phase 130 lands their dependent E2E. The earlier phases never depend on these.
- **Reliability hardening + close (Phases 131-132)** — HARDN-01 flake triage (after ALL specs — existing + new-feature — exist so the suite is in final shape), then the milestone-close green gate + the svelte-check 0/0 absolute-gate flip.

- [x] **Phase 118: E2E Coverage Audit + Coverage Plan** — Approval-gate deliverable: per-requirement coverage map + full spec/seed/semantic-step/fixture plan (including the deferred-build end-cluster specs); no test code. **✅ APPROVED by operator 2026-06-14** (incl. post-Plan-04 note incorporation + EFLOW-10b bank-auth Option B).
- [x] **Phase 119: E2E Fixtures & Helpers + Seed** — Fixtures-first build for the existing-feature specs + the UNBLK-03 default-seed tooling fix + any e2e/base / perm-template seed-data changes. (all 8 plans complete; UAT closed 2026-06-16 via /gsd-verify-work 119 — 4 deferred probes verified green in isolation in Phase 120-01 per DEF-119-08-01; full suite 95/0/0)
- [ ] **Phase 120: E2E Specs — Settings-Permutation Matrix** — EPERM-01..11 settings-driven branches exercised/asserted (alliance-presence sub-assertion of EPERM-03 lands with Phase 130).
- [ ] **Phase 121: E2E Specs — Flow Coverage** — EFLOW filters, comparison, category breakdown, navigation, locale/theme/preferences, nav menus, mobile (minus alliance EFLOW-02 and minus bank-auth EFLOW-10).
- [ ] **Phase 122: E2E Specs — Bank-Auth Round-Trip** — EFLOW-10 full Signicat/Idura OIDC round-trip, deterministically.
- [ ] **Phase 123: Svelte 5 Idiom Polish — Lifecycle & Reactive-State** — RUNES-01/02/05: onMount/onDestroy→$effect, reactive let→$state, 2 context bugs.
- [ ] **Phase 124: Svelte 5 Idiom Polish — Lock-in & Visual Verification** — RUNES-03/04: app-wide store ESLint guard + post-runes visual verification.
- [ ] **Phase 125: svelte-check → 0 — Trivial Tier** — TYPE-01/02/03: qs ambient types, admin-jobs cookies cluster, _spikes-017-019 scaffolding.
- [ ] **Phase 126: svelte-check → 0 — supabaseDataProvider** — TYPE-04: type supabaseDataProvider.ts against generated Supabase types (79 errors, 52% of baseline).
- [ ] **Phase 127: svelte-check → 0 — Adapter Layer & Contexts** — TYPE-05/06: supabaseDataWriter + adapter remainder + context-layer type errors.
- [ ] **Phase 128: svelte-check → 0 — Long-Tail, Tests & Docs** — TYPE-07/08/09: scattered long-tail mismatches, test/spike errors, docs a11y warning.
- [ ] **Phase 129: New-Feature Build — Question Inputs + Alliance Render + Nominations Fetch** — UNBLK-01/02/04/05/06: build MultipleText + multi-choice categorical + number-scale inputs, alliance render, /nominations fetch.
- [ ] **Phase 130: E2E Specs — New-Feature Coverage** — EQTYP-01/02/03 + EFLOW-02; plus the nominations-route assertion (UNBLK-04) and the EPERM-03 alliance-presence extension as criteria.
- [ ] **Phase 131: E2E Reliability Hardening — Deferred Flake/Race Triage** — HARDN-01: triage the ~6 deferred flake/race todos (after all specs exist).
- [ ] **Phase 132: Milestone-Close Green Gate + svelte-check Zero Flip** — HARDN-02 + TYPE-10: full-suite 3× green + svelte-check 0/0 absolute-gate flip.

## Phase Details

#### Phase 118: E2E Coverage Audit + Coverage Plan

**Goal**: An approved, written coverage plan exists that maps every EPERM/EFLOW/EQTYP requirement to its actual current coverage and specifies exactly what gets built across the whole milestone — including the new-feature specs that are deferred-built in the end cluster (planned up front, built at the end). No E2E test code is written in this phase.
**Depends on**: Nothing (first v2.14 phase; the approval gate that shapes every downstream E2E phase)
**Requirements**: (none — structural deliverable; consumed-requirement closure happens in the spec phases per the operator-mandated audit-first ordering)
**Success Criteria** (what must be TRUE):

  1. A per-requirement coverage map exists classifying every EPERM-01..11, EFLOW-01..11, and EQTYP-01..03 as covered / partial / missing, resolving each per-requirement NOTE — confirming EPERM-01/03/08/11 and EFLOW-03/05 already covered, and pinning the extension scopes on EPERM-06/07/09 and EFLOW-01/04/08/09.
  2. An explicit list names every new spec file to add and every existing spec to extend (preferring extension of an existing perm over a new one where the NOTEs direct it), the `e2e/base` / perm-template seed-data changes each spec needs, every new spec & edit at the semantic-step level (behaviour, not selectors), and the new/edited fixtures & helpers.
  3. The plan explicitly marks EQTYP-01/02/03, EFLOW-02 (alliance card + member-orgs drawer), the nominations-route spec, and the EPERM-03 alliance-presence slice as **deferred-build → end cluster (Phases 129-130)** — planned now, built after the new features land.
  4. The plan is reviewed and approved before any fixture or spec code is written (the operator approval gate).

**Plans**: 4 plans
Plans:

- [x] 118-01-PLAN.md — Create the deliverable; ground the catalog inventory; audit + classify EPERM-01..11 (verify all); record the --likert-only removal finding (A1)
- [x] 118-02-PLAN.md — Audit + classify EFLOW-01..11 (incl. the EFLOW-10 Idura-only bank-auth retarget) and EQTYP-01..03 with deferred-build marking
- [x] 118-03-PLAN.md — Build list (new + extended specs at semantic-step depth with project wiring/seed/fixtures) + extension-scope pins (EPERM-06/07/09, EFLOW-01/04/08/09)
- [x] 118-04-PLAN.md — Deferred-build markers (EQTYP, EFLOW-02, nominations, EPERM-03 alliance slice → 129-130) + cross-cutting findings DONE; **operator approval gate CLOSED ✅ (approved 2026-06-14)** — operator notes incorporated (commit `f2d28e1e8`: video semantics, advanced interactive-info, survey/feedback split, org-matching exact scores, main-category placement decision, EFLOW-10b bank-auth full-journey Option B). Phase 119 unblocked.

#### Phase 119: E2E Fixtures & Helpers + Seed

**Goal**: The fixtures and helpers that the existing-feature specs depend on are built and self-tested before any spec consumes them (fixtures-first), and the default-seed tooling bug is fixed alongside the seed-data changes those specs need.
**Depends on**: Phase 118 (the approved fixtures/helpers/seed plan)
**Requirements**: UNBLK-03
**Success Criteria** (what must be TRUE):

  1. Every fixture/helper named in the approved plan (for the existing-feature spec phases 120-122) exists, typechecks (`yarn typecheck:tests`), and passes the locator guard (`no-restricted-locators`).
  2. Each new fixture is exercised by at least one smoke/probe so its preparatory steps and view manipulation are proven before specs rely on it.
  3. `yarn db:seed:default` produces a valid dataset — parties present, the candidates tab populated, naming consistent — verifiable in the running app (UNBLK-03).
  4. Any required `e2e/base` / perm-template seed-data changes are landed and the dev-seed unit suite stays green.

**Plans**: 8 plansPlans:
**Wave 1**

- [x] 119-01-PLAN.md — Remove --likert-only completely + delete the 4 dead voterNavigation helpers (dev-seed-green gate)
- [x] 119-02-PLAN.md — UNBLK-03: reconcile default.ts docstrings + defensive hideIfMissingAnswers, verified in the running app (SC3)
- [x] 119-05-PLAN.md — Production data-testid additions (Video, popups, arguments, infoSections, terms, filter toggle, About) + testIds registry

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 119-03-PLAN.md — Hand-author perm-question-video / perm-interactive-info / perm-org-matching + register (EPERM-06/07/10)
- [x] 119-06-PLAN.md — EPERM fixtures: expectVideo / expectInfoMode|Sections|Arguments / popupNotice / org-match + About readers

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 119-04-PLAN.md — Rename+extend show-feedback-survey, consolidate perm-access-disable, add e2e/base customData.terms + registry (EPERM-09/11/07)
- [x] 119-07-PLAN.md — EFLOW fixtures: entityFilters select-all/none, expectSubMatch, trackingIntercept, expectTheme (emulateMedia), nav readers

**Wave 4** *(blocked on Wave 3 completion)*

- [x] 119-08-PLAN.md — One smoke/probe per new fixture (SC2), run once against the running app

**UI hint**: no

#### Phase 120: E2E Specs — Settings-Permutation Matrix

**Goal**: The settings-driven branches not yet covered by the existing perm specs are exercised and asserted, with already-covered items confirmed and extension-scoped items extended per the NOTEs.
**Depends on**: Phase 119 (fixtures/helpers + seed)
**Requirements**: EPERM-01, EPERM-02, EPERM-03, EPERM-04, EPERM-05, EPERM-06, EPERM-07, EPERM-08, EPERM-09, EPERM-10, EPERM-11
**Success Criteria** (what must be TRUE):

  1. The question-flow path matrix (`questionsIntro × categoryIntros.show × allowSkip`), election/constituency sequencing (`disallowSelection`, `startFromConstituencyGroup`), `minimumAnswers` gating, and maintenance/app-access gating are each confirmed covered or extended to pass (EPERM-01/02/08/11).
  2. Results-display permutations (`sections[] × cardContents[type][]`), `entityDetails.contents[type][]` tabs per entity type, and missing-data markers (`showMissingElectionSymbol` / `showMissingAnswers` per type) are asserted (EPERM-03/04/05) — for the candidate/org bulk; the **alliance-presence sub-assertion of EPERM-03 is deferred** and lands with the Phase 130 alliance work.
  3. A dedicated candidate question-media video test plus the hideHero combination is covered, and `interactiveInfo.enabled` is exercised in full (popup modal vs static expander) (EPERM-06/07).
  4. The survey/feedback popup-coordination perm is extended (not duplicated) to verify placement, timing, no double-pop, and dismiss persistence, and `organizationMatching` disclosure text on the About page is asserted across none/answersOnly/impute (EPERM-09/10).
  5. Every EPERM spec passes 3× deterministically (fresh server, clean DB).

**Plans**: 8 plans
Plans:

**Part 1 — close Phase 119 (probe gate, D-01/D-03)**

- [x] 120-01-PLAN.md — Wire the committed `_probes` Playwright project + trace-first re-diagnosis of the 4 deferred probes in true isolation (CONDITION 1/2) [EPERM-06/07/09/10 de-risk]
- [x] 120-02-PLAN.md — Run `/gsd-verify-work 119` to formally close Phase 119 (UAT test #1) — the gate before Part 2

**Part 2 — author the EPERM specs**

- [x] 120-03-PLAN.md — EPERM-04/05 voter-journey extensions (candidate+org tab control, org-typed missing markers) + re-confirm EPERM-01/02/03/08 [EPERM-01/02/03/04/05/08]
- [ ] 120-04-PLAN.md — NEW `perm-question-video` perm node (voter visibility matrix + candidate hideVideo) [EPERM-06]
- [ ] 120-05-PLAN.md — NEW `perm-interactive-info` perm node (popup+expander+infoSections+per-type arguments) + customData.terms voter-journey extension [EPERM-07]
- [ ] 120-06-PLAN.md — NEW `perm-org-matching` perm node (3-mode exact-score matrix + About disclosure) [EPERM-10]
- [ ] 120-07-PLAN.md — EPERM-09 git mv rename + extend `perm-show-feedback-survey` (feedback+survey popup coordination) [EPERM-09]
- [ ] 120-08-PLAN.md — EPERM-11 consolidate 2→1 `perm-access-disable` (voterApp/candidateApp/underMaintenance) [EPERM-11]

**UI hint**: yes

#### Phase 121: E2E Specs — Flow Coverage

**Goal**: The voter and candidate end-to-end flow behaviours — entity filters, answer comparison, category breakdown, navigation, locale/theme/preference round-trips, nav menus, and a mobile interactive journey — are exercised and asserted (alliance and bank-auth flows are handled in their own phases).
**Depends on**: Phase 119 (fixtures/helpers + seed), Phase 120 (shares results-page fixtures; ordered after to avoid spec churn)
**Requirements**: EFLOW-01, EFLOW-03, EFLOW-04, EFLOW-05, EFLOW-06, EFLOW-07, EFLOW-08, EFLOW-09, EFLOW-11
**Success Criteria** (what must be TRUE):

  1. Voter-results entity filters are exercised within a journey covering multiple-filter intersection, categorical select-all/none, text search, and text-search × filter intersection (EFLOW-01).
  2. Voter-vs-entity answer comparison is asserted for all four cases (agree / disagree / voter-missing / entity-missing), and per-category subMatch breakdown asserts correct values (only voter-answered categories, correct scores) for one candidate in the voter flow (EFLOW-03/04).
  3. Skip / delete / back navigation and its answer-count + results-CTA impact, mid-session locale switching (fi → en → fi) with state preserved, and the dark-mode toggle persisted across reload are each covered (EFLOW-05/06/07).
  4. The user-preferences round-trip covers every persisted field, and tracking-event emission is asserted under consent / suppression-without-consent including correct payloads for both `track` and `startEvent` (EFLOW-08).
  5. Navigation-menu contents are asserted for both apps across the relevant settings permutations including candidate nav logged-in vs logged-out (EFLOW-09), an interactive voter journey runs at a mobile viewport (EFLOW-11), and all specs pass 3×.

**Plans**: TBD
**UI hint**: yes

#### Phase 122: E2E Specs — Bank-Auth Round-Trip

**Goal**: The full bank-auth (Signicat/Idura OIDC) round-trip from initiate to authenticated session runs deterministically as an E2E test.
**Depends on**: Phase 119 (fixtures/helpers + seed)
**Requirements**: EFLOW-10
**Success Criteria** (what must be TRUE):

  1. An E2E test drives the bank-auth flow from initiate through the OIDC exchange to an authenticated session, asserting the authenticated state.
  2. The test is deterministic — it passes 3× (fresh server, clean DB) without flakes, with the OIDC dependency stubbed/controlled rather than hitting a live IdP.

**Plans**: TBD
**UI hint**: no

#### Phase 123: Svelte 5 Idiom Polish — Lifecycle & Reactive-State

**Goal**: The behavior-neutral Svelte 5 idiom migrations are complete — `onMount`/`onDestroy`→`$effect` where semantically equivalent, reactive `let`→`$state`, and the two known context bugs fixed.
**Depends on**: Nothing (independent workstream; can run in parallel with the E2E and TYPE phases)
**Requirements**: RUNES-01, RUNES-02, RUNES-05
**Success Criteria** (what must be TRUE):

  1. `onMount`/`onDestroy` are migrated to `$effect` in the ~24 files where semantically equivalent, behavior-neutral and per-site verified; genuine lifecycle semantics are retained (out-of-scope cases left untouched).
  2. Reactive `let` declarations (locals mutated for reactive effect) are migrated to `$state` per-site, with non-reactive locals left as `let`.
  3. The two known context bugs are fixed — `candidateContext.questionBlocks` `getApplicableQuestions` now passes `entityType`, and `userData.save()` no longer silently skips `termsOfUseAccepted: null` — each verified by a targeted test or observable behaviour.
  4. The frontend builds, unit tests pass, and svelte-check shows no net-new errors over the working baseline.

**Plans**: TBD
**UI hint**: yes

#### Phase 124: Svelte 5 Idiom Polish — Lock-in & Visual Verification

**Goal**: The runes idiom is locked against regression and confirmed visually regression-free.
**Depends on**: Phase 123 (lock-in/verification follow the migration that produces the finished state)
**Requirements**: RUNES-03, RUNES-04
**Success Criteria** (what must be TRUE):

  1. The `svelte/store` ESLint guard is extended to the entire `apps/frontend/src/**` tree and reports zero violations (lock-in against regressions).
  2. A post-runes visual verification pass confirms no regressions in app-header styling, banner images, and post-login candidate navigation.

**Plans**: TBD
**UI hint**: yes

#### Phase 125: svelte-check → 0 — Trivial Tier

**Goal**: The quick, low-risk type-error clusters are cleared — `qs` ambient types, the admin-jobs `cookies` cluster, and the leftover spike scaffolding.
**Depends on**: Nothing (independent TYPE workstream; can run in parallel)
**Requirements**: TYPE-01, TYPE-02, TYPE-03
**Success Criteria** (what must be TRUE):

  1. The `qs` module ambient-declaration errors (8 × TS7016) are resolved via `@types/qs` or a `declare module` shim (TYPE-01).
  2. The admin-jobs `+server.ts` `cookies`/fetch-event type-drift cluster (6 errors) is resolved (TYPE-02).
  3. The `_spikes-017-019` leftover spike scaffolding (4 errors) is deleted (TYPE-03).
  4. The svelte-check error count drops by the corresponding ~18 errors with no behavior change.

**Plans**: TBD

#### Phase 126: svelte-check → 0 — supabaseDataProvider

**Goal**: `supabaseDataProvider.ts` is typed against the generated Supabase types, clearing its 79 errors (52% of the baseline) without changing runtime behavior.
**Depends on**: Nothing (independent; the E2E suite is the behavior-neutral safety net)
**Requirements**: TYPE-04
**Success Criteria** (what must be TRUE):

  1. `supabaseDataProvider.ts` typechecks clean against the generated Supabase types — untyped `Json`/row shapes and possibly-null accesses are resolved (TYPE-04).
  2. No runtime behavior changes — the data-provider's outputs are unchanged, evidenced by the E2E suite staying green.
  3. The svelte-check baseline drops by ~79 errors.

**Plans**: TBD

#### Phase 127: svelte-check → 0 — Adapter Layer & Contexts

**Goal**: The rest of the Supabase adapter layer and the context-layer type errors are resolved.
**Depends on**: Phase 126 (shares the adapter typing surface; ordered after supabaseDataProvider to reuse its types)
**Requirements**: TYPE-05, TYPE-06
**Success Criteria** (what must be TRUE):

  1. `supabaseDataWriter.ts` and the remainder of the Supabase adapter layer typecheck clean (TYPE-05).
  2. The context-layer type errors are resolved — `adminContext.svelte.ts` (8), `candidateContext.svelte.ts` (6), `authContext.svelte.ts` (4) (TYPE-06).
  3. No behavior change; unit + E2E stay green.

**Plans**: TBD

#### Phase 128: svelte-check → 0 — Long-Tail, Tests & Docs

**Goal**: The scattered long-tail type mismatches, the test/spike type errors, and the docs a11y warning are resolved.
**Depends on**: Nothing (independent; naturally lands near the end of the TYPE workstream)
**Requirements**: TYPE-07, TYPE-08, TYPE-09
**Success Criteria** (what must be TRUE):

  1. The long-tail of scattered 1-per-file route/util/component type mismatches (~25) is resolved (TYPE-07).
  2. The `.test.ts` / `.spike` type errors (~19) are resolved — fixed or dead scaffolding removed (TYPE-08).
  3. The `apps/docs` a11y svelte-check warning is resolved so monorepo svelte-check shows 0 warnings (TYPE-09).

**Plans**: TBD

#### Phase 129: New-Feature Build — Question Inputs + Alliance Render + Nominations Fetch

**Goal**: The coverage-unblocking product features are built — new question-input components render and persist, alliance entities render in voter results, and the `/nominations` route fetches its data. (Placed late per operator directive so the bulk of the milestone is not gated on new features.)
**Depends on**: Nothing hard (a build phase; placed deliberately late after the existing-feature and TYPE/RUNES work)
**Requirements**: UNBLK-01, UNBLK-02, UNBLK-04, UNBLK-05, UNBLK-06
**Success Criteria** (what must be TRUE):

  1. A voter and a candidate can enter, save, and reload answers for a MultipleText question via a real input component (UNBLK-01), and for a number-scale opinion question via a real input + matching dispatch + dev-seed authoring support (UNBLK-05).
  2. A multi-choice categorical opinion variant can be answered (voter + candidate), matched, and authored in dev-seed via its input component + matching dispatch (UNBLK-02).
  3. The `/nominations` route fetches question data so all-nominations entities render correctly (UNBLK-04).
  4. Alliance entities render in voter results as a card with a working member-orgs drawer (UNBLK-06).

**Plans**: TBD
**UI hint**: yes

#### Phase 130: E2E Specs — New-Feature Coverage

**Goal**: The new features built in Phase 129 are covered by E2E — the previously-blocked question-type variants and the alliance flow — plus the nominations-route assertion and the EPERM-03 alliance-presence extension. Fixtures-first within the phase: any new-feature-specific fixtures are built and proven before the specs consume them.
**Depends on**: Phase 129 (the features must exist), Phase 118 (the approved deferred-build plan), Phase 119 (the base fixtures these extend)
**Requirements**: EQTYP-01, EQTYP-02, EQTYP-03, EFLOW-02
**Success Criteria** (what must be TRUE):

  1. Multi-choice categorical opinion questions are covered for voter answering, candidate answering, and matching — and categorical + boolean opinion questions are confirmed covered for candidates per the NOTE (EQTYP-01); number-scale opinion questions are covered for answering and matching boundary behaviour using the UNBLK-05 input (EQTYP-02); text and MultipleText questions are covered for voter/candidate rendering and answer round-trip using the UNBLK-01 input (EQTYP-03).
  2. The alliance card + member-orgs drawer render and assert in voter results (EFLOW-02), and the EPERM-03 alliance-presence sub-assertion (alliance entities appear in `results.sections[]`) lands as a criterion here (the EPERM-03 REQ-ID itself maps to Phase 120 — no double-mapping).
  3. The `/nominations` route renders all-nominations entities correctly, asserted as an E2E criterion tied to the UNBLK-04 feature (the UNBLK-04 REQ-ID maps to Phase 129 — expressed here as a new assertion only).
  4. Any new-feature-specific fixtures are built, typecheck-clean, and proven by a smoke/probe before the specs rely on them (fixtures-first within the phase).
  5. All new-feature-coverage specs pass 3× deterministically (fresh server, clean DB).

**Plans**: TBD
**UI hint**: yes

#### Phase 131: E2E Reliability Hardening — Deferred Flake/Race Triage

**Goal**: The ~6 deferred "v2.11+ hardening" flake/race todos are each triaged against the current suite and either fixed (passing 3×) or closed-as-stale with documented rationale.
**Depends on**: Phase 121 (existing-feature flow specs) AND Phase 130 (new-feature specs) — triage runs after ALL specs exist so the suite is in its final shape before triage.
**Requirements**: HARDN-01
**Success Criteria** (what must be TRUE):

  1. Each of the ~6 deferred todos (party-drawer boundary, qspec cold-start race, popup-hydration deeplink, voter-feedback-persistence locator collision, not-located-redirect chain, candidate-settings notifications mount-lifecycle) is triaged against the current suite with a recorded disposition.
  2. Each is either fixed (passing 3× deterministically) or closed-as-stale with documented rationale (resolved by prior work / no longer reproducible).
  3. No deferred-flake todo is left in an undocumented "deferred" state.

**Plans**: TBD

#### Phase 132: Milestone-Close Green Gate + svelte-check Zero Flip

**Goal**: The full suite is green to the 3× determinism standard with every net-new v2.14 spec, svelte-check is 0/0, and the CI gate is flipped from "≤ 151 baseline" to "0 absolute".
**Depends on**: Phase 120, Phase 121, Phase 122 (existing-feature E2E specs), Phase 124 (RUNES complete), Phase 125, Phase 126, Phase 127, Phase 128 (all TYPE reqs cleared), Phase 130 (new-feature E2E specs), Phase 131 (flakes triaged)
**Requirements**: HARDN-02, TYPE-10
**Success Criteria** (what must be TRUE):

  1. The full E2E suite — including every net-new v2.14 spec — passes to the 3× determinism standard (fresh server, clean DB, no flakes) (HARDN-02).
  2. `apps/frontend` svelte-check passes with 0 errors / 0 warnings, and the CI gate is flipped from "≤ 151 baseline" to "0 absolute" (TYPE-10).
  3. Unit tests and lint are green, and the milestone-close anchor is recorded (matching the v2.10/v2.11/v2.13 close pattern).

**Plans**: TBD

## Progress

**Execution Order:**
The three workstreams are largely independent and may be planned/executed concurrently; only the explicit "Depends on" edges are hard.

- **Existing-feature E2E (118-122):** audit/approval gate (118) → fixtures-first + seed (119) → existing-feature specs (perms 120, flows 121, bank-auth 122). This is the bulk of the milestone and is **not** gated on any new-feature work.
- **RUNES idiom polish (123-124):** independent; runs in parallel with the E2E and TYPE workstreams.
- **svelte-check → 0 (125-128):** independent; tiered trivial → supabaseDataProvider → adapter+contexts → long-tail+tests+docs.
- **New-feature cluster (129-130):** the new features are built (129) and their dependent E2E lands (130) **late**, per operator directive — nothing in 118-128 depends on them.
- **Hardening (131):** after ALL specs exist (existing-feature 121 + new-feature 130) so the suite is in final shape before flake triage.
- **Close gate (132):** last — depends on every spec/type/runes phase + hardening.

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 118. E2E Coverage Audit + Coverage Plan | v2.14 | 3/4 | In progress | - |
| 119. E2E Fixtures & Helpers + Seed | v2.14 | 8/8 | Pending verify | - |
| 120. E2E Specs — Settings-Permutation Matrix | v2.14 | 3/8 | In Progress|  |
| 121. E2E Specs — Flow Coverage | v2.14 | 0/TBD | Not started | - |
| 122. E2E Specs — Bank-Auth Round-Trip | v2.14 | 0/TBD | Not started | - |
| 123. Svelte 5 Idiom Polish — Lifecycle & Reactive-State | v2.14 | 0/TBD | Not started | - |
| 124. Svelte 5 Idiom Polish — Lock-in & Visual Verification | v2.14 | 0/TBD | Not started | - |
| 125. svelte-check → 0 — Trivial Tier | v2.14 | 0/TBD | Not started | - |
| 126. svelte-check → 0 — supabaseDataProvider | v2.14 | 0/TBD | Not started | - |
| 127. svelte-check → 0 — Adapter Layer & Contexts | v2.14 | 0/TBD | Not started | - |
| 128. svelte-check → 0 — Long-Tail, Tests & Docs | v2.14 | 0/TBD | Not started | - |
| 129. New-Feature Build — Question Inputs + Alliance Render + Nominations Fetch | v2.14 | 0/TBD | Not started | - |
| 130. E2E Specs — New-Feature Coverage | v2.14 | 0/TBD | Not started | - |
| 131. E2E Reliability Hardening — Deferred Flake/Race Triage | v2.14 | 0/TBD | Not started | - |
| 132. Milestone-Close Green Gate + svelte-check Zero Flip | v2.14 | 0/TBD | Not started | - |
