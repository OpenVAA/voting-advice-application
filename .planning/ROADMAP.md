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
- 🚧 **v2.14 E2E Coverage Expansion + Svelte 5 Idiom Polish + svelte-check Zero** — Phases 118-134 (in progress)

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
- [x] **Phase 120: E2E Specs — Settings-Permutation Matrix** — EPERM-01..11 settings-driven branches exercised/asserted (alliance-presence sub-assertion of EPERM-03 lands with Phase 130). (completed 2026-06-16)
- [x] **Phase 121: E2E Specs — Flow Coverage** — EFLOW filters, comparison, category breakdown, navigation, locale/theme/preferences, nav menus, mobile (minus alliance EFLOW-02 and minus bank-auth EFLOW-10). (completed 2026-06-17)
- [ ] **Phase 122: E2E Specs — Bank-Auth Round-Trip** — EFLOW-10 full Signicat/Idura OIDC round-trip, deterministically.
- [x] **Phase 123: Svelte 5 Idiom Polish — Lifecycle & Reactive-State** — RUNES-01/02/05: onMount/onDestroy→$effect, reactive let→$state, 2 context bugs. (completed 2026-06-17)
- [x] **Phase 124: Svelte 5 Idiom Polish — Lock-in & Visual Verification** — RUNES-03/04: app-wide store ESLint guard + post-runes visual verification. (completed 2026-06-21)
- [x] **Phase 125: svelte-check → 0 — Trivial Tier** — TYPE-01/02/03: qs ambient types, admin-jobs cookies cluster, _spikes-017-019 scaffolding. (completed 2026-07-15)
- [x] **Phase 126: svelte-check → 0 — supabaseDataProvider** — TYPE-04: type supabaseDataProvider.ts against generated Supabase types (79 errors, 52% of baseline). (completed 2026-07-16)
- [x] **Phase 127: svelte-check → 0 — Adapter Layer & Contexts** — TYPE-05/06: supabaseDataWriter + adapter remainder + context-layer type errors. (completed 2026-07-16)
- [x] **Phase 128: svelte-check → 0 — Long-Tail, Tests & Docs** — TYPE-07/08/09: scattered long-tail mismatches, test/spike errors, docs a11y warning. (completed 2026-07-17)
- [x] **Phase 129: New-Feature Build — Question Inputs + Alliance Render + Nominations Fetch** — UNBLK-01/02/04/05/06: build MultipleText + multi-choice categorical + number-scale inputs, alliance render, /nominations fetch. (completed 2026-07-18)
- [x] **Phase 130: E2E Specs — New-Feature Coverage** — EQTYP-01/02/03 + EFLOW-02; plus the nominations-route assertion (UNBLK-04) and the EPERM-03 alliance-presence extension as criteria. (completed 2026-07-19)
- [x] **Phase 131: E2E Reliability Hardening — Deferred Flake/Race Triage** — HARDN-01: triage the ~6 deferred flake/race todos (after all specs exist). (completed 2026-07-22)
- [x] **Phase 132: Milestone-Close Green Gate + svelte-check Zero Flip** — HARDN-02 + TYPE-10: full-suite 3× green + svelte-check 0/0 absolute-gate flip.

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
- [x] 120-04-PLAN.md — NEW `perm-question-video` perm node (voter visibility matrix + candidate hideVideo) [EPERM-06]
- [x] 120-05-PLAN.md — NEW `perm-interactive-info` perm node (popup+expander+infoSections+per-type arguments) + customData.terms voter-journey extension [EPERM-07]
- [x] 120-06-PLAN.md — NEW `perm-org-matching` perm node (3-mode exact-score matrix + About disclosure) [EPERM-10]
- [x] 120-07-PLAN.md — EPERM-09 git mv rename + extend `perm-show-feedback-survey` (feedback+survey popup coordination) [EPERM-09]
- [x] 120-08-PLAN.md — EPERM-11 consolidate 2→1 `perm-access-disable` (voterApp/candidateApp/underMaintenance) [EPERM-11]

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

**Plans**: 8 plans
Plans:
**Wave 1**

- [x] 121-01-PLAN.md — EFLOW-01/04 voter-journey filter select-all/none + text×filter intersection + correct subMatch values (+ EFLOW-03/05 re-confirm)
- [x] 121-02-PLAN.md — EFLOW-06 in-flight fi→en→fi answer/selection-state-preserved slice (extend perm-localisation-positive)
- [x] 121-03-PLAN.md — EFLOW-09 candidate nav-menu logged-in/out (candidate-journey) + voter conditional-nav-item omission on EPERM-02 perms (D-02)
- [x] 121-04-PLAN.md — D-01 perm-analytics-tracking dev-seed template + registry + setup/teardown (EFLOW-08 arming)

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 121-05-PLAN.md — playwright.config: voter-dark-mode + voter-journey-mobile leaf projects + perm-analytics-tracking triad (voter-prefs-tracking)

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 121-06-PLAN.md — EFLOW-07 NEW voter-dark-mode spec (emulateMedia persist) + a11y-smoke dark-contrast scan
- [x] 121-07-PLAN.md — EFLOW-08 NEW voter-prefs-tracking spec (consent emit vs suppress + prefs round-trip)
- [x] 121-08-PLAN.md — EFLOW-11 NEW voter-journey-mobile spec + D-03 mobile sub-tests on perm-question-video + perm-interactive-info

**UI hint**: yes

#### Phase 122: E2E Specs — Bank-Auth Round-Trip

**Goal**: The full bank-auth (Signicat/Idura OIDC) round-trip from initiate to authenticated session runs deterministically as an E2E test.
**Depends on**: Phase 119 (fixtures/helpers + seed)
**Requirements**: EFLOW-10
**Success Criteria** (what must be TRUE):

  1. An E2E test drives the bank-auth flow from initiate through the OIDC exchange to an authenticated session, asserting the authenticated state.
  2. The test is deterministic — it passes 3× (fresh server, clean DB) without flakes, with the OIDC dependency stubbed/controlled rather than hitting a live IdP.

**Plans**: 5 plansPlans:
**Wave 1**

- [x] 122-01-PLAN.md — Wave 1: extract shared buildTestIdToken util (D-03) + fixed committed test key pair + candidate.preregister testIds

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 122-02-PLAN.md — Wave 2: retarget candidate-bank-auth.spec.ts to Idura-only sub-match + deterministic-green gate (D-02, no skip)
- [x] 122-03-PLAN.md — Wave 2: Option-B mock OIDC issuer (HTTPS, D-01) + bank-auth-journey project/webServer wiring + frontend IDP env+TLS runbook
- [x] 122-04-PLAN.md — Wave 2: candidate-preregister page-object + composition root + bank-auth-journey setup/teardown (perm-not-located-2e2cg reuse, D-04)

**Wave 3** *(blocked on Wave 2 completion)*

- [~] 122-05-PLAN.md — Wave 3: EFLOW-10b full-browser journey spec landed SINGLE-PASS GREEN (Task 2, commit daab88f06). Task 3 (3×-green determinism gate both specs + default-suite regression) is orchestrator-run — pending.

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

**Plans**: 4 plans
Plans:
**Wave 1**

- [x] 123-01-PLAN.md — Wave 0: pin svelte-check baseline (criterion 4) + create candidateContext.svelte.test.ts (Bug 1 RED test, confirm A2 seam)
- [x] 123-02-PLAN.md — Wave 1: RUNES-05 two bug fixes (entityType at :378; tri-state !== undefined guards) + Bug 2 Tests 5+6
- [x] 123-03-PLAN.md — Wave 1: RUNES-01 + RUNES-02 audit-and-document (per-site disposition record; reactive-let enumeration; optional borderline migration)

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 123-04-PLAN.md — Wave 2: D-03 acceptance gate (build + full unit + svelte-check <= baseline + one full E2E run)

**UI hint**: yes

#### Phase 124: Svelte 5 Idiom Polish — Lock-in & Visual Verification

**Goal**: The runes idiom is locked against regression and confirmed visually regression-free.
**Depends on**: Phase 123 (lock-in/verification follow the migration that produces the finished state)
**Requirements**: RUNES-03, RUNES-04
**Success Criteria** (what must be TRUE):

  1. The `svelte/store` ESLint guard is extended to the entire `apps/frontend/src/**` tree and reports zero violations (lock-in against regressions).
  2. A post-runes visual verification pass confirms no regressions in app-header styling, banner images, and post-login candidate navigation.

**Plans**: 2 plans
Plans:
**Wave 1**

- [x] 124-01-PLAN.md — RUNES-03: guard regression self-test (ESLint Node-API positive/negative control) + zero-violation lint assertion + traceability flip (met-via-Phase-115-SWEEP-03)

**Wave 2** *(blocked on Wave 1 — shared REQUIREMENTS.md edit; atomic-commit bisect isolation)*

- [ ] 124-02-PLAN.md — RUNES-04: manual visual-verification pass (app-header light/dark · banner · post-login candidate-nav) + 124-VISUAL-VERIFICATION.md + conditional surgical fix (D-05)

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

**Plans**: 4/4 plans executed

Wave 1:

- [x] 125-01-PLAN.md — TYPE-01: add @types/qs devDependency + fix the one predicted fallout cast at data/[collection]/+server.ts (qs cluster → 0)

Wave 2 *(after the Wave-1 `yarn add` settles node_modules; both plans have zero file overlap)*:

- [x] 125-02-PLAN.md — TYPE-02: drop the dead `cookies` arg from both the destructure and the getUserData call in all 6 admin-jobs routes (cookies cluster → 0)
- [x] 125-03-PLAN.md — TYPE-03: delete the leftover _spikes-017-019 scaffolding directory (spike cluster → 0; _spikes-020 untouched)

Wave 3:

- [x] 125-04-PLAN.md — D-04 full acceptance gate: build + unit + exact svelte-check accounting (151 → ≤133, three clusters at zero, no net-new) + one full E2E suite run (behavior-neutrality trust signal)

#### Phase 126: svelte-check → 0 — supabaseDataProvider

**Goal**: `supabaseDataProvider.ts` is typed against the generated Supabase types, clearing its 79 errors (52% of the baseline) without changing runtime behavior.
**Depends on**: Nothing (independent; the E2E suite is the behavior-neutral safety net)
**Requirements**: TYPE-04
**Success Criteria** (what must be TRUE):

  1. `supabaseDataProvider.ts` typechecks clean against the generated Supabase types — untyped `Json`/row shapes and possibly-null accesses are resolved (TYPE-04).
  2. No runtime behavior changes — the data-provider's outputs are unchanged, evidenced by the E2E suite staying green.
  3. The svelte-check baseline drops by ~79 errors.

**Plans**: 5/5 plans executed

Wave 1 *(disjoint files — parallel-safe; 02/04 assert delta-0 so ordering vs the regen is irrelevant)*:

- [x] 126-01-PLAN.md — D-01/D-02: regenerate the Supabase types (`yarn db:types`) so `get_nominations` is typed; atomic regen commit (measure 133 → 50)
- [x] 126-02-PLAN.md — D-05: generify `toDataObject` backward-compatibly (defaulted generic; writer sites compile unchanged; count delta-0)
- [x] 126-04-PLAN.md — D-07: delete the inert `declare module 'qs';` shim from `global.d.ts` (svelte-check output unchanged)

Wave 2:

- [x] 126-03-PLAN.md — D-03/D-04: type `_getNominationData` (RPC args 259/260 + dead-cast cleanup) and narrow the two TS2352 casts (374/549) properly — target file → 0, count → ~46

Wave 3:

- [x] 126-05-PLAN.md — D-06 full acceptance gate: build + unit + exact svelte-check accounting (133 → ~46, provider at 0, no net-new) + one full E2E suite run (behavior-neutrality trust signal)

#### Phase 127: svelte-check → 0 — Adapter Layer & Contexts

**Goal**: The rest of the Supabase adapter layer and the context-layer type errors are resolved.
**Depends on**: Phase 126 (shares the adapter typing surface; ordered after supabaseDataProvider to reuse its types)
**Requirements**: TYPE-05, TYPE-06
**Success Criteria** (what must be TRUE):

  1. `supabaseDataWriter.ts` and the remainder of the Supabase adapter layer typecheck clean (TYPE-05).
  2. The context-layer type errors are resolved — `adminContext.svelte.ts` (8), `candidateContext.svelte.ts` (6), `authContext.svelte.ts` (4) (TYPE-06).
  3. No behavior change; unit + E2E stay green.

**Plans**: 3/3 plans executed

Plans:
**Wave 1**

- [x] 127-01-PLAN.md — TYPE-06 / D-01: drop the dead Promise plumbing (retype prepareDataWriter param to sync UniversalDataWriter, rename dataWriterPromise bindings + candidateUserDataState field/factory + test fallout) — clears all 18 context errors [Wave 1]
- [x] 127-02-PLAN.md — TYPE-05 / D-02 + discretion: flip JobMessage interface→type alias (fixes both admin_jobs inserts) + supabaseDataWriter residuals (drop ['Row'], documented `as Json` cast) — writer + adminWriter → 0 [Wave 1]

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 127-03-PLAN.md — D-06 full acceptance gate: build + full unit + exact svelte-check 46→24/1 (5 target files at 0) + one full E2E suite run green (behavior-neutrality trust signal) [Wave 2, depends on 127-01, 127-02]

#### Phase 128: svelte-check → 0 — Long-Tail, Tests & Docs

**Goal**: The scattered long-tail type mismatches, the test/spike type errors, and the docs a11y warning are resolved.
**Depends on**: Nothing (independent; naturally lands near the end of the TYPE workstream)
**Requirements**: TYPE-07, TYPE-08, TYPE-09
**Success Criteria** (what must be TRUE):

  1. The long-tail of scattered 1-per-file route/util/component type mismatches (~25) is resolved (TYPE-07).
  2. The `.test.ts` / `.spike` type errors (~19) are resolved — fixed or dead scaffolding removed (TYPE-08).
  3. The `apps/docs` a11y svelte-check warning is resolved so monorepo svelte-check shows 0 warnings (TYPE-09).

**Plans**: 5/5 plans executed

Plans:
**Wave 1** *(parallel — disjoint file sets)*

- [x] 128-01-PLAN.md — TYPE-08 / D-04+D-05: adapter test-file type-truth (11 serverClient concrete-typing sites + thenable mock + register args + LocalizedAnswers) and delete `_spikes-020-class-conversion/` after a zero-importer gate [Wave 1]
- [x] 128-02-PLAN.md — TYPE-07 / D-01+D-02+D-03: concrete-type the candidate `+layout.server.ts` serverClient seam + widen `setPassword` type-truth + drop the dead confirm-password prop + reconcile the testIds catalogue [Wave 1]
- [x] 128-03-PLAN.md — TYPE-07: scattered singles — built-in View Transition lib types, FeedbackPopup `'default'` status, EntityInfo dead-branch literal, two QuestionHeading numeric `tabindex` [Wave 1]
- [x] 128-04-PLAN.md — TYPE-09 / D-06: fix both a11y warnings at source — `Term.svelte` noninteractive-tabindex + `apps/docs` static-element-interactions [Wave 1]

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 128-05-PLAN.md — D-07 full acceptance gate: build + unit + frontend svelte-check 0/0 + docs svelte-check 0/0 + one full green E2E run (fresh dev server on :5173, `yarn db:reset` first; 502-wedge remedy) [Wave 2, depends on 128-01..128-04]

#### Phase 129: New-Feature Build — Question Inputs + Alliance Render + Nominations Fetch

**Goal**: The coverage-unblocking product features are built — new question-input components render and persist, alliance entities render in voter results, and the `/nominations` route fetches its data. (Placed late per operator directive so the bulk of the milestone is not gated on new features.)
**Depends on**: Nothing hard (a build phase; placed deliberately late after the existing-feature and TYPE/RUNES work)
**Requirements**: UNBLK-01, UNBLK-02, UNBLK-04, UNBLK-05, UNBLK-06
**Success Criteria** (what must be TRUE):

  1. A voter and a candidate can enter, save, and reload answers for a MultipleText question via a real input component (UNBLK-01), and for a number-scale opinion question via a real input + matching dispatch + dev-seed authoring support (UNBLK-05).
  2. A multi-choice categorical opinion variant can be answered (voter + candidate), matched, and authored in dev-seed via its input component + matching dispatch (UNBLK-02).
  3. The `/nominations` route fetches question data so all-nominations entities render correctly (UNBLK-04).
  4. Alliance entities render in voter results as a card with a working member-orgs drawer (UNBLK-06).

**Plans**: 8/9 plans executed
Plans:

- [x] 129-09-PLAN.md

**Wave 1**

- [x] 129-01-PLAN.md — MultipleChoiceCategoricalQuestion matching trio (D-06) + isNumberQuestion guard (Wave 1)
- [x] 129-02-PLAN.md — customData min/max + count-constraint keys (D-02/D-07) + Supabase number min/max bridge (Wave 1)
- [x] 129-03-PLAN.md — /nominations loader questionData fetch parity (UNBLK-04, D-11) (Wave 1)

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 129-04-PLAN.md — NumberScaleInput slider + OpinionQuestionInput number branch + dual-marker display (D-03/D-04) (Wave 2)
- [x] 129-05-PLAN.md — MultipleTextInput row-list + QuestionInput dispatch (D-01/D-02) + i18n ×7 (Wave 2)

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 129-06-PLAN.md — QuestionChoices checkbox mode + validity surfacing + Save/Skip caller gates + auto-advance suppression (D-05/D-07) (Wave 3)
- [x] 129-07-PLAN.md — testIds registration + voter-journey walk slider/checkbox handling (D-14) (Wave 3)

**Wave 4** *(blocked on Wave 3 completion)*

- [x] 129-08-PLAN.md — e2e/base + default seed authoring (D-12/D-15/D-16), alliance sections fix (UNBLK-06), journey re-baselines + full-suite green gate (D-13/D-10) (Wave 4)

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

**Plans**: 6/6 plans executed
Plans:

**Wave 1**

- [x] 130-01-PLAN.md — Voter fixtures fixtures-first: value-parametrized `answerNumberScale` + `expectQuestionDisplay` multi-choice/number display support, proven by a new `@probe` smoke [EQTYP-01/02]
- [x] 130-02-PLAN.md — EQTYP-03 candidate leg: `fillMultipleTextQuestion` helper + fill-map wiring + preview round-trip of ≥2 multipleText values [EQTYP-03]

**Wave 2**

- [x] 130-03-PLAN.md — voter-journey assertion depth: 100%-match incorporation proof + new-type drawer displays + dedicated EQTYP-02 number-scale min/mid boundary test; dead commented nominations block removed [EQTYP-01/02]
- [x] 130-04-PLAN.md — NEW `voter-alliance.spec.ts` (member-orgs drawer + clickable in-card children + EPERM-03 presence rider + EPERM-04 tab-control rider, D-03) + NEW `voter-nominations.spec.ts` (D-01) with their leaf project entries [EFLOW-02]
- [x] 130-05-PLAN.md — candidate-journey EQTYP-01 type-specific multi-choice contract (D-07 min/max save gating) + D-02 categorical/boolean tightening [EQTYP-01]

**Wave 3**

- [x] 130-06-PLAN.md — D-05 determinism gate: full suite 3× green, fresh :5173 server + clean DB per run, zero failed / zero did-not-run, evidence captured [SC5]

**UI hint**: yes

#### Phase 131: E2E Reliability Hardening — Deferred Flake/Race Triage

**Goal**: The ~6 deferred "v2.11+ hardening" flake/race todos are each triaged against the current suite and either fixed (passing 3×) or closed-as-stale with documented rationale.
**Depends on**: Phase 121 (existing-feature flow specs) AND Phase 130 (new-feature specs) — triage runs after ALL specs exist so the suite is in its final shape before triage.
**Requirements**: HARDN-01
**Success Criteria** (what must be TRUE):

  1. Each of the ~6 deferred todos (party-drawer boundary, qspec cold-start race, popup-hydration deeplink, voter-feedback-persistence locator collision, not-located-redirect chain, candidate-settings notifications mount-lifecycle) is triaged against the current suite with a recorded disposition.
  2. Each is either fixed (passing 3× deterministically) or closed-as-stale with documented rationale (resolved by prior work / no longer reproducible).
  3. No deferred-flake todo is left in an undocumented "deferred" state.

**Plans**: 5/5 plans executed

Plans:
**Wave 1**

- [x] 131-01-PLAN.md — TRACER: prove the triage loop end-to-end (todos #5 not-located + #6 notifications, stale)

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 131-02-PLAN.md — FIX: harden navigateToFirstQuestion helper + 5-consumer regression (todo #7 perm-hide-election-tags)

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 131-03-PLAN.md — cold-deeplink resolver + voter-journey cluster (todos #2 qspec + #1 party-drawer, stale)

**Wave 4** *(blocked on Wave 3 completion)*

- [x] 131-04-PLAN.md — popup/feedback cluster + feedback parity-gap decision (todos #3 popup-hydration + #4 feedback-persistence)

**Wave 5** *(blocked on Wave 4 completion)*

- [x] 131-05-PLAN.md — closeout: terminal-disposition + no-new-skip + CI-clean gate + targeted 3× (Phase-132 hand-off)

#### Phase 132: Milestone-Close Green Gate + svelte-check Zero Flip

**Goal**: The full suite is green to the 3× determinism standard with every net-new v2.14 spec, svelte-check is 0/0, and the CI gate is flipped from "≤ 151 baseline" to "0 absolute".
**Depends on**: Phase 120, Phase 121, Phase 122 (existing-feature E2E specs), Phase 124 (RUNES complete), Phase 125, Phase 126, Phase 127, Phase 128 (all TYPE reqs cleared), Phase 130 (new-feature E2E specs), Phase 131 (flakes triaged)
**Requirements**: HARDN-02, TYPE-10
**Success Criteria** (what must be TRUE):

  1. The full E2E suite — including every net-new v2.14 spec — passes to the 3× determinism standard (fresh server, clean DB, no flakes) (HARDN-02).
  2. `apps/frontend` svelte-check passes with 0 errors / 0 warnings, and the CI gate is flipped from "≤ 151 baseline" to "0 absolute" (TYPE-10).
  3. Unit tests and lint are green, and the milestone-close anchor is recorded (matching the v2.10/v2.11/v2.13 close pattern).

**Plans**: 4/4 plans executed

- [x] 132-04-PLAN.md

**Wave 1**

- [x] 132-01-PLAN.md — TRACER: harden the :661 step-13.5 flake + prove candidate-journey isolated green (D-01/D-03, HARDN-02)
- [x] 132-02-PLAN.md — svelte-check 0-absolute gate: strict `check` script + blocking CI step + live 0/0 + close svelte-check-zero todo (D-08/D-09/D-13, TYPE-10)

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 132-03-PLAN.md — 3× full-suite gate + static gates + MILESTONE-CLOSE-ANCHOR + REQUIREMENTS/ROADMAP flips + flake todo FIXED (D-04..D-07/D-10/D-11/D-12/D-13, HARDN-02+TYPE-10)

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
| 118. E2E Coverage Audit + Coverage Plan | v2.14 | 4/4 | Complete    | 2026-07-15 |
| 119. E2E Fixtures & Helpers + Seed | v2.14 | 8/8 | Complete    | 2026-07-15 |
| 120. E2E Specs — Settings-Permutation Matrix | v2.14 | 8/8 | Complete   | 2026-06-16 |
| 121. E2E Specs — Flow Coverage | v2.14 | 8/8 | Complete    | 2026-06-17 |
| 122. E2E Specs — Bank-Auth Round-Trip | v2.14 | 5/5 | Complete    | 2026-06-17 |
| 123. Svelte 5 Idiom Polish — Lifecycle & Reactive-State | v2.14 | 4/4 | Complete    | 2026-06-17 |
| 124. Svelte 5 Idiom Polish — Lock-in & Visual Verification | v2.14 | 2/2 | Complete    | 2026-06-21 |
| 125. svelte-check → 0 — Trivial Tier | v2.14 | 4/4 | Complete    | 2026-07-15 |
| 126. svelte-check → 0 — supabaseDataProvider | v2.14 | 5/5 | Complete    | 2026-07-16 |
| 127. svelte-check → 0 — Adapter Layer & Contexts | v2.14 | 3/3 | Complete    | 2026-07-16 |
| 128. svelte-check → 0 — Long-Tail, Tests & Docs | v2.14 | 5/5 | Complete    | 2026-07-17 |
| 129. New-Feature Build — Question Inputs + Alliance Render + Nominations Fetch | v2.14 | 9/9 | Complete    | 2026-07-18 |
| 130. E2E Specs — New-Feature Coverage | v2.14 | 6/6 | Complete    | 2026-07-19 |
| 131. E2E Reliability Hardening — Deferred Flake/Race Triage | v2.14 | 5/5 | Complete    | 2026-07-22 |
| 132. Milestone-Close Green Gate + svelte-check Zero Flip | v2.14 | 4/4 | Complete    | 2026-07-23 |
| 133. Fix Phase 132 Code Review Gaps | v2.14 | 3/3 | Complete    | 2026-07-26 |
| 134. A11y Contrast + i18n Catalog + Boolean-Answer Defect Closure | v2.14 | 0/TBD | Not started | - |

### Phase 133: Fix Phase 132 code review gaps

**Goal:** Fix the issues raised in the Phase 132 code review. For the `navigateDirectlyToQuestions` issue: remove that function completely and make `advanceVoterFlow` deterministically check for each of the possible screens instead — trial whether that causes any issues (E2E suite is the gate).
**Requirements**: WR-01, IN-01, IN-02
**Depends on:** Phase 132
**Plans:** 3/3 plans complete

Plans:
**Wave 1**

- [x] 133-01-PLAN.md — WR-01 + IN-02: delete hard-nav fallback, rewrite advanceVoterFlow branches to deterministic continue (tracer, wave 1)

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 133-02-PLAN.md — IN-01: flip candidate-journey step-13.5 to a positive candidate-home assertion (wave 2)

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 133-03-PLAN.md — Full E2E suite 3× determinism gate (wave 3)

### Phase 134: A11y Contrast + i18n Catalog + Boolean-Answer Defect Closure

**Goal:** Close the three confirmed user-facing defects that `v2.14-MILESTONE-AUDIT.md` surfaced as carried tech debt, so v2.14 ships without a known WCAG 2.1 AA violation, without an untranslated key visible to users, and without a saved answer reading back as unanswered.

**Requirements**: FIX-01, FIX-02, FIX-03
**Depends on:** Phase 133
**Plans:** 8 plans

**Success criteria:**

1. **FIX-01 (a11y contrast).** No primary-content text inherits DaisyUI `.label`'s `color-mix(in oklab, currentcolor 60%, transparent)`, and settled axe scans return **0 color-contrast violations in both light and dark**. _(Corrected 2026-08-10 per D-01c — this criterion was written on a stale measurement, and the correction is itself a deliverable of Phase 134.)_ The app-side defect at `ElectionSelector.svelte:56` was **already closed by commit `0eb27c677` (2026-06-22)**; the "12/12 FAIL" state quoted here came from a debug document that pre-dates that commit, and re-measurement under a settled DOM returns 0 violations in both themes. The deliverable is therefore the *gate*, not the fix: (a) a settled-DOM regression gate that would actually have caught the original defect — a **required** data-driven content anchor on every scan route, so a route cannot be added without declaring what "loaded" means; (b) axe coverage of the results **filter drawer**, which no scan had ever reached; and (c) the dead-class cleanup at `NumericEntityFilter.svelte:85,98,113` (the numbers 84/97/112 in the original wording point at the enclosing `<label>` elements — and `text-label` matched no CSS rule at all, measuring `rgb(51,51,51)` at full opacity, so it was a dead class rather than a live violation). `EnumeratedEntityFilter.svelte:198` measures AA-clean. `ConstituencySelector` is unaffected **by the `.label` alpha mechanism** — that much of the original clause holds — but it is **not** exempt from change, and the original blanket "do not change" instruction was wrong: it carried a separate AA failure through the `.faded` / `opacity-30` utility, measured at 1.52:1 light and 1.46:1 dark on two nodes, fixed in this phase under D-17 Option A.
2. **FIX-02 (i18n runtime catalog).** **Seven** keys — not two — resolve to real text in all 7 locales, across **two** catalog files. _(Corrected 2026-08-10 per D-01c/D-08: this criterion originally scoped the fix to `selectExact` / `selectRange` in `questions.json` alone; a full key-set diff of both catalogs across all 7 locales found 7 keys rendering their own raw dotted path to users.)_ The keys are `questions.multiChoice.selectExact` and `questions.multiChoice.selectRange` in `apps/frontend/messages/{locale}/questions.json`, plus `components.accordionSelect.listboxAriaLabel` (a raw key announced as an `aria-label` — a WCAG defect, not a cosmetic one) and `components.multipleTextInput.{add,moveUp,moveDown,remove}` in `apps/frontend/messages/{locale}/components.json`. Both files are the **runtime Paraglide catalog** (registered at `project.inlang/settings.json:53`) — NOT `src/lib/i18n/translations/`, where all 7 already exist and which is the type-generation source, not the runtime one. Mirror the values already authored there. A cross-catalog **key-set parity check** lands as part of the deliverable so this defect class cannot recur silently, and the content assertion that Phase 130 step 18.5 deliberately withheld (`/2.*3/`) is restored so the fix is locked in.
3. **FIX-03 (boolean answer).** A saved boolean opinion answer of `false` renders as answered on the candidate questions overview. `apps/frontend/src/routes/candidate/(protected)/questions/+page.svelte:58` guards with the canonical emptiness predicate `isEmptyValue()` (imported from `@openvaa/data`) rather than a truthiness test. _(Corrected 2026-08-10 per D-12 — a deliberate, operator-approved deviation from this criterion as originally written, which prescribed an explicit null check: a null check would render a saved empty string or empty array as **answered** on the overview while `candidateContext.svelte.ts:233`'s completion gating, which already used `isEmptyValue()`, still counted it unanswered — trading one inconsistency for another.)_
4. Full E2E suite green to the 3× determinism standard; svelte-check stays 0/0; lint + prettier + `typecheck:tests` clean.

**Out of scope (carried, per audit §4.4/§4.5):** the `preview/+page.svelte:32` `dataRoot` alias-indirection warning and DEF-120-03-01 feedback rate-limit teardown.

Plans:

- [x] 134-01-PLAN.md — Typed a11y route contract (required `contentTestId`) + honest constituencies scan + the AA fix it exposes [wave 1]
- [x] 134-02-PLAN.md — Results filter-drawer axe coverage + `text-label` → `small-label` on the numeric filter [wave 2]
- [x] 134-03-PLAN.md — 7 missing i18n keys × 7 locales into the runtime Paraglide catalog, with a build-time render proof [wave 3]
- [x] 134-04-PLAN.md — Cross-catalog key-set parity check + negative control proving it fires [wave 4]
- [x] 134-05-PLAN.md — Boolean-answer guard via the canonical emptiness predicate + recorded repo-wide sweep [wave 4]
- [x] 134-06-PLAN.md — E2E locks: restored helper-text assertion, falsy-boolean round trip, accessible-name assertions [wave 5]
- [x] 134-07-PLAN.md — Bookkeeping corrections (ROADMAP / REQUIREMENTS / audit / CLAUDE.md) + the D-18 UAT review item [wave 5]
- [x] 134-08-PLAN.md — Verification gate: static gates clean + full E2E 3× determinism + requirement flips [wave 6]

### Phase 135: Close the Three Phase-134 Coverage Carry-Overs

**Goal:** Convert the three coverage limits Phase 134 recorded-but-did-not-close into real guards, so v2.14 ships without a known untested branch, without a theme-blind a11y gate, and without a load-dependent wall-clock assertion sitting in a blocking CI step.

**Requirements**: GUARD-01, GUARD-02, GUARD-03
**Depends on:** Phase 134
**Plans:** 4 plans

**Success criteria:**

1. **GUARD-01 (`selectExact` standing guard).** A seeded multi-choice question with an **equal min/max** exists in the `e2e/base` template, so `questions.multiChoice.selectExact` is rendered by the running app and asserted by the E2E suite. Phase 134 proved the string correct at build time (all 14 plural branches) but left it with no standing regression guard, because every seeded question carries a 2..3 window and therefore renders `selectRange`. The deliverable is a guard that FAILS if the key regresses — proven by negative control, not by assertion alone.
2. **GUARD-02 (dark-theme axe parity).** The four fixture-driven axe entries (`questions`, `results`, `voter-detail-drawer`, `results-filter-drawer`) scan in **dark as well as light**, matching the raw entries. Phase 134 deliberately deferred this on the grounds that it newly scans four never-measured surfaces with unbounded fallout — that fallout is now in scope. **Any violation surfaced is fixed in this phase**, per the same reasoning as Phase 134's D-07: a violation found by our own gate is ours to close, and the E2E cardinal rule forbids shipping the suite red. The theme-coverage note at `a11y-smoke.spec.ts:396-401` is removed once it is no longer true.
3. **GUARD-03 (dev-seed NF-01 determinism).** `packages/dev-seed`'s NF-01 seed-budget assertion no longer depends on machine load. Measured 2026-08-10: **fails at 23630ms / 11592ms under parallel load, passes at ~10143ms in isolation** against a 10000ms budget — a hard wall-clock assertion sitting beside its own threshold, inside the blocking `yarn test:unit` CI step. Resolve by asserting on **work done** (row counts / operation budget) rather than elapsed time, or by making the wall-clock a soft signal with a pathology-level threshold. **Explicitly NOT acceptable:** raising 10000 to a larger number — that preserves the flaky shape and only moves the goalposts.
4. Full E2E suite green to the 3× determinism standard; svelte-check stays 0/0; lint + prettier + `typecheck:tests` clean; root `yarn test:unit` exits 0 **under parallel load**, not only in isolation.

**Out of scope:** the `preview/+page.svelte:32` `dataRoot` alias-indirection warning and DEF-120-03-01 feedback rate-limit teardown (still carried); adding `format:check` to the milestone-close checklist (a process fix, not a code one).

Plans:

- [ ] 135-01-PLAN.md — Dark-theme axe parity for the four fixture-driven entries + any violation it surfaces [wave 1]
- [ ] 135-02-PLAN.md — Seeded equal-min/max multi-choice question + `selectExact` E2E standing guard [wave 2]
- [ ] 135-03-PLAN.md — dev-seed NF-01: replace the load-dependent wall-clock assertion [wave 2]
- [ ] 135-04-PLAN.md — Verification gate: full E2E 3× determinism + static gates + requirement flips [wave 3]
