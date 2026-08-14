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
- ✅ **v2.14 E2E Coverage Expansion + Svelte 5 Idiom Polish + svelte-check Zero** — Phases 118-136 (shipped 2026-08-12)
- 🚧 **v2.15 Trustworthy Foundations — Guards, Seed Data & CI Coverage** — Phases 137-150 (in progress)

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

<details>
<summary>✅ v2.14 E2E Coverage Expansion + Svelte 5 Idiom Polish + svelte-check Zero (Phases 118-136) — SHIPPED 2026-08-12</summary>

- [x] Phase 118: E2E Coverage Audit + Coverage Plan (4/4 plans) — completed 2026-07-15
- [x] Phase 119: E2E Fixtures & Helpers + Seed (8/8 plans) — completed 2026-07-15
- [x] Phase 120: E2E Specs — Settings-Permutation Matrix (8/8 plans) — completed 2026-06-16
- [x] Phase 121: E2E Specs — Flow Coverage (8/8 plans) — completed 2026-06-17
- [x] Phase 122: E2E Specs — Bank-Auth Round-Trip (5/5 plans) — completed 2026-06-17
- [x] Phase 123: Svelte 5 Idiom Polish — Lifecycle & Reactive-State (4/4 plans) — completed 2026-06-17
- [x] Phase 124: Svelte 5 Idiom Polish — Lock-in & Visual Verification (2/2 plans) — completed 2026-06-21
- [x] Phase 125: svelte-check → 0 — Trivial Tier (4/4 plans) — completed 2026-07-15
- [x] Phase 126: svelte-check → 0 — supabaseDataProvider (5/5 plans) — completed 2026-07-16
- [x] Phase 127: svelte-check → 0 — Adapter Layer & Contexts (3/3 plans) — completed 2026-07-16
- [x] Phase 128: svelte-check → 0 — Long-Tail, Tests & Docs (5/5 plans) — completed 2026-07-17
- [x] Phase 129: New-Feature Build — Question Inputs + Alliance Render + Nominations Fetch (9/9 plans) — completed 2026-07-18
- [x] Phase 130: E2E Specs — New-Feature Coverage (6/6 plans) — completed 2026-07-19
- [x] Phase 131: E2E Reliability Hardening — Deferred Flake/Race Triage (5/5 plans) — completed 2026-07-22
- [x] Phase 132: Milestone-Close Green Gate + svelte-check Zero Flip (4/4 plans) — completed 2026-07-23
- [x] Phase 133: Fix Phase 132 Code Review Gaps (3/3 plans) — completed 2026-07-26
- [x] Phase 134: A11y Contrast + i18n Catalog + Boolean-Answer Defect Closure (8/8 plans) — completed 2026-08-10
- [x] Phase 135: Close the Three Phase-134 Coverage Carry-Overs (4/4 plans) — completed 2026-08-11
- [x] Phase 136: Real Guards — Visual Regression Repair + Fake-Guard Remediation (6/6 plans) — completed 2026-08-12

**Closeout:** override_closeout — Phases 134/136 verified `human_needed` (D-18 native-speaker review,
operator-accepted; REAL-03 first CI run, not executable locally). DEF-135-04 closed under an explicit
waiver: `.planning/v2.14-CARDINAL-RULE-WAIVER.md`.

Full details: `.planning/milestones/v2.14-ROADMAP.md`

</details>

### 🚧 v2.15 Trustworthy Foundations — Guards, Seed Data & CI Coverage (Phases 137-150) — IN PROGRESS

**Milestone goal:** Make every automated check in the repo one that can be developed against — closing
the coverage holes, blind assertions, untrustworthy test data, and missing CI gates that v2.14
surfaced but did not close. 38 requirements (VGATE 6 · UNIT 4 · CSCAN 4 · INTEG 6 · ASSERT 9 · TMPL 4
· CIGATE 5) across 14 phases. Phase numbering continues from v2.14 (last phase 136) → **starts at
Phase 137** (no reset).

**Standing acceptance rule — inherited by every phase below.** Prove the guard fails before claiming
it guards. Every new or repaired check is run as a negative control **twice**: once against the old
assertion to demonstrate blindness, once against the new one to demonstrate the catch. A phase whose
success criteria can all be satisfied by a green suite, with no failure ever observed, is
mis-specified. Corollary for the visual gate: baselines are captured only in
`mcr.microsoft.com/playwright:v1.58.2-noble`, `--platform linux/amd64`, dev server bound
`--host 0.0.0.0` — **never on a developer Mac**.

**Sequencing logic:**

- **137 first, always.** Every later phase's E2E evidence is only as trustworthy as the assertion
  that the page under test came from this checkout. A false green from a foreign dev server is
  undetectable after the fact, so the served-app preflight lands before anything else is measured.

- **138 second.** The `EPERM-07` waiver is discharged early rather than at close, because an
  undiagnosed 1-in-8 intermittent contaminates every subsequent phase's "suite green" evidence. Its
  first plan lands forensic capture, so if it recurs during any later phase the occurrence is data
  rather than noise.

- **139 before 142.** The single-source findings are re-confirmed as their own small phase, so a
  withdrawal shrinks the remediation scope instead of being discovered mid-remediation.

- **141 before 142.** The AI-package tests that Phase 142 repairs must actually execute in CI, or
  the repair is unobserved.

- **144 before 145.** Strict per-collection row types are the mechanism most likely to expose the
  constant-naming drift the `default.ts` breakage is suspected to rest on.

- **147 before 148.** Extending the scanners to the candidate app produces an a11y violation
  inventory on never-measured surfaces; 148 exists so that fallout has somewhere to land instead of
  being absorbed silently or turning the suite red between phases.

- **143, 146, 149, 150 are independent** and can run in any order against the rest.

**No milestone-close gate phase.** The close gates are distributed into the phases that own them —
INTEG-02's ≥16-run determinism campaign is the E2E close gate, VGATE-06's consecutive in-container
runs are the visual close gate. `/gsd-complete-milestone` performs the final combined sweep.

**UI hint: none.** v2.15 adds no visual surface. Phase 148's a11y work is structural cite-and-fix
(Phase 76 / Phase 80 precedent — no `/gsd-ui-phase`), and Phase 146's font change is a
delivery-origin swap whose visual consequence is re-proven by the baselines themselves.

- [x] **Phase 137: E2E Preflight Integrity — Assert the Served Application** - Replace the defeatable listener-identity check with a response-content assertion, enforced by the harness (INTEG-04/05/06)
- [x] **Phase 138: DEF-135-04 — `EPERM-07` Root Cause + Cardinal-Rule Waiver Discharge** - Name the root cause, prove the fix across ≥16 runs, discharge the waiver unrenewed (INTEG-01/02/03) (completed 2026-08-14)
- [ ] **Phase 139: Single-Source Sweep Findings — Confirm or Withdraw** - Re-read F15/F16/F18/F19/F20 against live code; each independently confirmed or withdrawn before remediation is planned (ASSERT-01)
- [ ] **Phase 140: Blind-Matcher Remediation — Teardowns, Null-Matchers, Positive Controls** - F3's 27 unfailable row counts, F19's `toBeDefined()`-on-null sites, F9's missing positive control, F10's budget drift (ASSERT-02/03/05/06)
- [ ] **Phase 141: Package Unit-Test Coverage + `test:unit` Invariant Guard** - Wire `matching` + `core`, decide the three Experimental packages, then guard the class so the hole cannot reopen (UNIT-01/02/03/04)
- [ ] **Phase 142: Assertion Design — Wiring-Only Tests Assert Output** - Every finding surviving 139 asserts observable output or is withdrawn on the record (ASSERT-07)
- [ ] **Phase 143: `svelte/store` Guard — App-Wide Reach + Fallout Triage** - Widen the ESLint guard from contexts/routes to all of `apps/frontend/src/**`, triage every pre-existing usage (ASSERT-08/09)
- [ ] **Phase 144: Seed-Template Strict Typing + Unknown-Prop Guard** - Per-collection row types + a runtime throw naming `external_id`/key/collection + `TemplateSchema.strict()` (TMPL-01/02, ASSERT-04)
- [ ] **Phase 145: Default Seed Template Repair** - `yarn db:reset-with-data` yields parties and a candidates tab, with a standing regression guard (TMPL-03/04)
- [ ] **Phase 146: Visual Gate — Self-Hosted Inter, Height-Independent Sensitivity, Re-baseline** - One container re-baseline covering both the sensitivity mechanism and the font-egress removal (VGATE-01..06)
- [ ] **Phase 147: Candidate-App Scan Reach — Authenticated Fixture + Raw-Key Gate** - Authenticated scan fixture, raw-i18n-key gate on candidate routes, axe violation inventory (CSCAN-01/03/04)
- [ ] **Phase 148: Candidate-App A11y Remediation to Zero** - Fix everything 147's inventory found, then flip the candidate routes into the blocking axe family (CSCAN-02)
- [ ] **Phase 149: CI Gates — SQL Lint/Format + Secrets & Vulnerability Scanning** - Invoke the `db:lint:sql` script that nothing runs, put SQL in the standard format gate, add secrets + vuln scanning (CIGATE-01/02/03)
- [ ] **Phase 150: `RETURNS TABLE` Nullability — Audit + Single Override Mechanism** - Enumerate every RPC's semantically-nullable columns and fix the lie with one mechanism, not scattered casts (CIGATE-04/05)

## Phase Details

_v2.15 (Phases 137-150) below. Shipped milestones' details live in `.planning/milestones/`._

### Phase 137: E2E Preflight Integrity — Assert the Served Application

**Status**: Executed 2026-08-13 — 5 plans, 18 commits. Full suite green (134/134, 0 failed, 0 did-not-run, 648 s). Verification 3/4 ACHIEVED; criterion 3's **CI-runner half is unobserved** (Plan 05 Task 2 deferred — CI triggers only on push/PR to `main` and this branch is 2377 commits ahead of a stale `origin/main`). Open risk **T-137-11**. Discharge on the branch's first PR to `main`.

**Goal**: Every E2E run in this repo proves the page under test was served by this checkout, so no result in this milestone — or after it — can be a false green from a foreign server.
**Depends on**: Nothing (first v2.15 phase; sequenced first because every later phase's E2E evidence rests on it)
**Requirements**: INTEG-04, INTEG-05, INTEG-06
**Success Criteria** (what must be TRUE):

  1. With a **foreign dev server** occupying the target port — a real second Vite project answering 200, as measured on 2026-08-11 — the preflight FAILS and names the mismatch. The identical scenario is first run against the retired "listener is a `node` process" check and observed to PASS: the two-run negative control that demonstrates the old check's blindness before the new one's catch.
  2. With this repo's own dev server on the same port, the preflight passes and the suite proceeds — the check is not merely strict, it is correct.
  3. The preflight is **enforced by the harness**, not remembered by the operator: it runs from global setup or a project dependency, so omitting the manual runbook step still triggers it, and a run started against an unserved or wrong-app port aborts before the first spec executes rather than producing failures that read as app defects.
  4. `CLAUDE.md` and the E2E phase runbook state the response-content assertion; a grep for the retired "assert the listener is a node process" wording returns nothing, and `FRONTEND_PORT`'s role as the alternate-port escape hatch is documented alongside it.

**Plans**: 5 plans (01 preflight+globalSetup · 02 loadEnv+strictPort+CI-loop deletion · 03 two-run negative control · 04 live docs · 05 phase gate)

- [ ] 137-01-PLAN.md — Preflight module + `globalSetup` wiring: the three-clause served-app identity assertion and the unskippable enforcement point (wave 1)
- [ ] 137-02-PLAN.md — `loadEnv` so the root `.env` really sets the dev-server port (D-16), then `strictPort` (behind a decision checkpoint) + removal of both CI blind wait loops (wave 2)
- [ ] 137-03-PLAN.md — Two-run negative control against a staged foreign dev server; produces `137-NEGATIVE-CONTROL.md` (wave 2)
- [ ] 137-04-PLAN.md — Live-doc rewrite: `CLAUDE.md`, `tests/README.md`, `tests/IDURA-TEST-RUNBOOK.md` (wave 3)
- [ ] 137-05-PLAN.md — Phase gate: full-suite green under the cardinal rule + observed CI run on both jobs (wave 4)

### Phase 138: DEF-135-04 — `EPERM-07` Root Cause + Cardinal-Rule Waiver Discharge

**Goal**: The one standing waiver against the project's cardinal E2E rule is discharged by a **named root cause** and a proven fix — not by absence of reproduction.
**Depends on**: Phase 137 (a diagnosis run is only evidence if the app under test is provably this checkout)
**Requirements**: INTEG-01, INTEG-02, INTEG-03
**Success Criteria** (what must be TRUE):

  1. The failure is made to happen **on demand**: a written root cause names the mechanism (file:line, ordering, or contended resource), and a forcing harness — fault injection, timing skew, or a state precondition — reproduces the `EPERM-07` term-trigger failure deterministically at least once *before* any fix is written.
  2. Negative control pair recorded: with the forcing harness applied, the pre-fix code FAILS and the post-fix code PASSES. A fix accepted on "it stopped happening" does not satisfy this criterion.
  3. At least **16 consecutive full-suite runs** (2× the observed 1-in-8 rate) show zero `EPERM-07` failures, each run confirmed by Phase 137's served-app preflight.
  4. `.planning/v2.14-CARDINAL-RULE-WAIVER.md` is marked discharged with the diagnosis referenced; no successor waiver, no `test.skip`, no retry annotation, and no "could not reproduce" closure exists anywhere in the record. The cardinal rule is back in force unwaived.

**Plans:** 6/6 plans complete

Plans:
**Wave 1**

- [x] 138-01-PLAN.md — Forensic capture + the isolated hunt instrument: U-1 artifact recovery, then the tracer slice (console/network auto-fixture, video retention, `eperm07-term-trigger` LEAF spec + project) and the single-run wrapper that owns the dev-server log (wave 1)

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 138-02-PLAN.md — D-08 soft→hard heading promotion, the budget-lever forcing sweep with its non-degeneracy check, and Discriminator A (reduced-motion A/B, zero app change) (wave 2)

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 138-03-PLAN.md — Discriminator B (CDP amplification at the production budget), the contention variant, and the written named root cause — or the evidenced disproof ledger and the next hypothesis (wave 3)

**Wave 4** *(blocked on Wave 3 completion)*

- [x] 138-04-PLAN.md — D-06 fix-tier decision checkpoint, the authorised fix, and the criterion-2 negative-control pair; produces `138-NEGATIVE-CONTROL.md` (wave 4, autonomous: false)

**Wave 5** *(blocked on Wave 4 completion)*

- [x] 138-05-PLAN.md — The serial 16-run determinism batch with validity rules enforced in code; produces `138-DETERMINISM-LEDGER.md` (wave 5)

**Wave 6** *(blocked on Wave 5 completion)*

- [x] 138-06-PLAN.md — Record-integrity audit (F-1 fix, F-2 filed, F-3 statement) and the one-way waiver-discharge checkpoint + reconciliation of every live record (wave 6, autonomous: false)

**Shape note**: This is a **diagnosis phase, not an implementation phase**, and is deliberately not padded with adjacent work. Plan 01 lands forensic capture on the term-trigger path (trace/video/server-log retention) *before* the hunt, so the waiver's own condition 3 — "the next occurrence is data" — is honoured by every later v2.15 phase's suite runs rather than discarded. The phase is explicitly allowed to spend a plan on a hypothesis that gets disproved: a disproof is recorded and the next hypothesis pursued (the cold-start-Vite hypothesis is already eliminated). What it may not do is close on non-reproduction.

### Phase 139: Single-Source Sweep Findings — Confirm or Withdraw

**Goal**: Nobody plans remediation around a finding that has not survived contact with the live code.
**Depends on**: Nothing (deliberately early and small — a withdrawal here shrinks Phase 142 rather than being discovered mid-remediation)
**Requirements**: ASSERT-01
**Success Criteria** (what must be TRUE):

  1. Each of F15 (the `questionTypes.test.ts` sites plus `condenserStandalone.test.ts` / `condenseQuestions.test.ts`), F16, F18, F19 (3 sites) and all **six F20 rows** carries an independent verdict — **confirmed** or **withdrawn** — with the re-read `file:line` quoted from the current tree as evidence, not the audit's own quotation re-copied.
  2. At least one verdict is reached by **running** it, not by reading: the site is executed with the behaviour it claims to assert deliberately broken, and the observed pass/fail matches the verdict on paper. A finding that reads blind but fails correctly is withdrawn.
  3. For every confirmed finding, the realistic regression its current assertion cannot detect is named concretely — so Phase 142's negative control is pre-specified rather than invented at remediation time.
  4. Any withdrawn finding is struck from `.planning/audits/2026-08-11-fake-guard-sweep.md` with its reasoning, and ASSERT-07's scope in this ROADMAP and in `REQUIREMENTS.md` is edited down to match. The shrink is visible in the record, not silent.

**Plans:** 3/7 plans executed

Plans:
**Wave 1**

- [x] 139-01-PLAN.md — Tracer: build the verdict apparatus (`139-VERDICTS.md` §§ 1-4, the named HYGIENE-LOOP / TWO-COLUMN / COLLATERAL rules, the 15-row enumeration and all fifteen record stubs) and prove it end to end on F20-4, then expand to F18 on the same `dev-seed` vehicle (wave 1)

**Wave 2** *(blocked on Wave 1 — injections are serialized; the hygiene gate is whole-tree and cannot attribute a dirty path to one of two concurrent injections)*

- [x] 139-02-PLAN.md — The `argument-condensation` vehicle: F16 and F20-6 (TRAP-2 — the message swap, not the throw removal), then F15-B and F15-C from one shared `Condenser.run()` injection (wave 2)

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 139-03-PLAN.md — F15-A (TRAP-1 — prove the audit's own regression un-injectable, run the recorded substitute, correct the audit's description of `:535-537`) and F20-5's two injections (wave 3)

**Wave 4** *(blocked on Wave 3 completion)*

- [ ] 139-04-PLAN.md — The three F19 sites (TRAP-3 — two observed columns and the verbatim failure block, so a vacuous-but-red assertion is `confirmed` per D-02 rather than withdrawn by exit code) (wave 4)

**Wave 5** *(blocked on Wave 4 completion)*

- [ ] 139-05-PLAN.md — F20-1, F20-2, F20-3 (two injections) and F17 (import-graph fact first, run as corroboration, D-06); completes all fifteen records (wave 5)

**Wave 6** *(blocked on Wave 5 completion)*

- [ ] 139-06-PLAN.md — Synthesis: § 4 ordering audit and roll-up, § 7 scope limits, § 8 discarded-and-collateral (wave 6)

**Wave 7** *(blocked on Wave 6 completion)*

- [ ] 139-07-PLAN.md — Criterion 4: § 6 withdrawals and propagation to all THREE targets (audit, `REQUIREMENTS.md:60`, ROADMAP Phase 142 criteria 2 and 3), the answer to the audit's `## Not assessed` prediction, and the phase-close gate (113 tests across 7 vehicles, zero source diff, zero markers) (wave 7)

**Shape note**: This phase ships **zero product code**. Every source-file modification is transient — injected, run and reverted inside the same task — so the plans' `files_modified` lists name only the durable writes (`139-VERDICTS.md` plus the criterion-4 record edits), and each plan carries a separate `transient_files_reverted` list so no reviewer misreads an injection target as phase output. The seven waves are strictly sequential by necessity rather than by dependency: two concurrent injections would each see the other's edit, and either agent's `git checkout --` could revert the other's live injection mid-run. Criterion 4's propagation has **three** targets, not the two the criterion's wording implies — ROADMAP Phase 142 enumerates the findings inline in criteria 2 and 3, so a withdrawal there is an in-sentence edit rather than a struck line.

### Phase 140: Blind-Matcher Remediation — Teardowns, Null-Matchers, Positive Controls

**Goal**: The assertions the sweep classed as mechanical-but-unfailable can fail, and the absence-only assertions have something proving they can still see presence.
**Depends on**: Phase 137
**Requirements**: ASSERT-02 (F3), ASSERT-03 (F19), ASSERT-05 (F9), ASSERT-06 (F10)
**Success Criteria** (what must be TRUE):

  1. **F3** — a teardown run where the delete matches nothing FAILS the `*.teardown.ts` assertion by name; the same scenario against the pre-change `toBeGreaterThanOrEqual(0)` form PASSES. Observed on a sample spanning the shared helper and the 27 call sites, so the 27th file is covered by construction rather than by 27 hand edits nobody re-checks.
  2. **F19** — removing the `request` / `client_assertion` value from each of the three fixtures makes the assertion itself fail naming the missing parameter (not a downstream `TypeError` from the following line), and passes under the old `toBeDefined()`. The two-run control is run at all three sites.
  3. **F9** — `perm-hide-category-tags` / `perm-hide-election-tags` FAIL when the tag element stops rendering *anywhere*: proven by removing the tag from the rendering path and observing the pair go red, where previously both stayed green. The positive control is seeded data, not a comment.
  4. **F10** — `voter-journey.spec.ts`'s stated `expect.soft` budget matches its real count (137, not 3), **or** a counted guard enforces the stated budget and fails when one more `expect.soft` is added — the addition is made and the failure observed before the guard is accepted.
  5. Unit and E2E suites return to green after the edits, with the Phase-137 preflight satisfied on every run used as evidence.

**Plans**: TBD

### Phase 141: Package Unit-Test Coverage + `test:unit` Invariant Guard

**Goal**: No `packages/*` workspace's tests are invisible to CI, and the hole cannot reopen with the next package added.
**Depends on**: Nothing
**Requirements**: UNIT-01, UNIT-02, UNIT-03, UNIT-04
**Success Criteria** (what must be TRUE):

  1. `yarn test:unit` lists `@openvaa/matching` and `@openvaa/core` among its executed tasks, and a deliberately failing assertion planted in each turns the command's exit code non-zero — observed for **both** packages, then reverted. (Before the change, the same plant leaves the command green: 18 test files run under no CI command.)
  2. Each of `@openvaa/llm`, `@openvaa/question-info` and `@openvaa/argument-condensation` either appears as an executed `test:unit` task **or** is named in a committed skip contract stating the blocker (e.g. requires a live API key) and what would unblock it. Cross-checking `npx turbo run test:unit --dry=json` against the set of workspaces containing test files leaves no package unaccounted for in either list.
  3. Wiring order is **evidenced, not asserted**: a per-package pass/fail record produced by actually running the tests exists and predates the commit that adds each `test:unit` script. UNIT-03 is a constraint on plan shape — plan 01 measures and records; later plans wire only what plan 01 recorded green; a red package is fixed or gets the documented skip, never a script that fails on someone else's schedule.
  4. A scratch `packages/<name>/` containing a test file and no `test:unit` script FAILS the CI guard with a message naming `<name>`; adding the script (or removing the test file) makes it pass. Both directions observed, following the Phase-136 orphaned-probe guard shape (`playwright.config.ts:34-48`), which is already proven to discriminate.

**Plans**: TBD

### Phase 142: Assertion Design — Wiring-Only Tests Assert Output

**Goal**: Every sweep finding that survives Phase 139 asserts the behaviour its own title promises, or is withdrawn on the record with reasoning.
**Depends on**: Phase 139 (scope), Phase 141 (the AI-package tests this repairs must actually execute in CI, or the repair is unobserved)
**Requirements**: ASSERT-07
**Success Criteria** (what must be TRUE):

  1. For **every** finding confirmed by Phase 139, a negative control pair is run and recorded: the regression named in 139 is injected, the OLD assertion passes, the NEW assertion fails. No finding is marked done with only one half.
  2. **F15** — `questionTypes.test.ts`'s three "Configuration" blocks differ observably from one another (assertions on the prompt the mocked provider received), so an implementation that ignores question type fails at least one; `condenserStandalone.test.ts` and `condenseQuestions.test.ts` assert `result.arguments` content, so a `Condenser.run()` returning `{ arguments: [], llmMetrics }` fails. The wall-clock `processingTimeMs > 0` assertion on a fully-mocked run is removed rather than kept as decoration.
  3. **F16** asserts the language rejection specifically (non-empty `entities` plus a `/language/i` matcher), so deleting the language check fails the test. **F17** either exercises real reactivity or is renamed to the contract it verifies. **F18** asserts the locale block boundary, so generating all candidates in one locale fails. Each of the six **F20** sites carries a matcher as strong as its title (status code, exact ICU output, error code, exact column, length guard, message matcher).
  4. Any finding withdrawn rather than remediated carries its reasoning in the phase record and in the audit file — withdrawal is a documented outcome, not a silent omission.
  5. `yarn test:unit` (including the packages Phase 141 wired in) exits 0 after remediation, under parallel load rather than only in isolation.

**Plans**: TBD

### Phase 143: `svelte/store` Guard — App-Wide Reach + Fallout Triage

**Goal**: The lint guard that claims the frontend is store-free actually covers the frontend.
**Depends on**: Nothing
**Requirements**: ASSERT-08, ASSERT-09
**Success Criteria** (what must be TRUE):

  1. A `svelte/store` import injected into each of `lib/components`, `lib/utils`, `lib/dynamic-components` and `lib/candidate/components` FAILS `yarn lint:check` naming the file and the rule; the same four injections PASS under the pre-change guard scope (`lib/contexts/**` + `routes/**` only) — the two-run control at four representative sites.
  2. Widening is run against the untouched tree **first** and the complete list of pre-existing violations is recorded before any is changed, so the fallout size is known rather than discovered halfway through.
  3. Every recorded pre-existing usage has a per-site disposition — migrated to runes, or explicitly allowed with an inline `// reason:` per the project convention. No site is silenced by broadening the guard's own exclusion list; the exclusion list ends the phase no larger than it started, or each addition is justified.
  4. `yarn lint:check` is clean app-wide and `apps/frontend/src/**` contains no unexplained `svelte/store` import, verified by grep independently of the lint rule.

**Plans**: TBD

### Phase 144: Seed-Template Strict Typing + Unknown-Prop Guard

**Goal**: A template row that declares something the pipeline does not read is impossible to author and impossible to run.
**Depends on**: Nothing
**Requirements**: TMPL-01, TMPL-02, ASSERT-04 (F13)
**Success Criteria** (what must be TRUE):

  1. `_elections: { external_id: [...] }` on a `questions` row is a **TypeScript error at authoring time**, naming the row type; deleting it typechecks. The identical row is first confirmed to typecheck cleanly under the pre-change types — the two-run control on the exact defect that motivated this (the sentinel was accepted, dropped on the floor, and produced neither a type error nor a warning).
  2. Seeding a template carrying an unknown row property **throws**, and the message names the row's `external_id`, the offending key, and the collection. The same seed run before the change completes successfully and silently drops the key — observed both ways, including for a template loaded via `--template ./custom.ts`, the path that bypasses the built-in template imports.
  3. `TemplateSchema` is `.strict()`: each of the six "accepts field X" tests FAILS when its field is removed from the schema declaration and PASSES when it is present — both directions observed per field. That property was structurally impossible before, which is the whole of F13.
  4. The set of `(collection, sentinel)` pairs the type system permits is **derived from what `linkJoinTables` actually resolves**, not maintained in parallel with it: adding a sentinel to the types without handling it in the pipeline fails a test.
  5. `baseV1`, `default` and every `e2e/*` template typecheck and seed under the new types; any field they lose to the tightening is listed with the reason, and the E2E suite stays green on the `e2e/base` dataset.

**Plans**: TBD
**Co-location rationale (ASSERT-04 here rather than in the assertion phases)**: F13 (`TemplateSchema` is not `.strict()`) is the Zod-layer statement of exactly the invariant TMPL-01 states in the type system and TMPL-02 states at runtime — three layers, one rule, one `packages/dev-seed` surface. Sequencing them into separate phases means tightening the same schema twice and paying the same fallout twice (the six "accepts field X" tests, plus whatever in-tree templates currently declare unread fields), with the second phase inheriting a half-tightened surface and an ambiguous baseline. The todo behind TMPL-01/02 already names `TemplateSchema`'s permissiveness as part of the same defect class ("loose typing + permissive runtime stripping = silent data-loss bugs"), and the sweep's own note on F13 — "budget for fallout" — is the same budget TMPL-01/02 must carry. One phase, one fallout budget.

### Phase 145: Default Seed Template Repair

**Goal**: A developer's first run (`yarn db:reset-with-data`) produces a dataset that demonstrates the product rather than an empty results page.
**Depends on**: Phase 144 (strict per-collection typing is the mechanism most likely to surface the constant-naming drift the breakage is suspected to rest on; running the repair on loose types repeats that diagnosis by hand)
**Requirements**: TMPL-03, TMPL-04
**Success Criteria** (what must be TRUE):

  1. After `yarn db:reset-with-data`, the voter results page renders a **non-empty** parties/organizations list and shows the **candidates tab** — both verified in the running app, and both confirmed absent against the pre-fix template in the same session so the before/after is measured rather than remembered.
  2. A standing regression check (dev-seed unit assertion or E2E) FAILS against the pre-fix `default.ts` and PASSES against the repaired one, so "0 parties, no candidates tab" cannot silently return. The failing run against the old template is recorded.
  3. The root cause is **named** — organizations/nominations not seeded, `app_settings.results.sections` missing an entity type, or the constant-naming drift — with the evidence, rather than the symptom being fixed by trial.
  4. `default.ts`'s constants follow the `e2e/base` conventions with any deliberate divergence documented, and the file typechecks under Phase 144's strict row types with no `any` or cast escapes.

**Plans**: TBD

### Phase 146: Visual Gate — Self-Hosted Inter, Height-Independent Sensitivity, Re-baseline

**Goal**: The visual job is a component-level guard on **every** baseline, and it needs nothing from the public internet to say so.
**Depends on**: Phase 137
**Requirements**: VGATE-01, VGATE-02, VGATE-03, VGATE-04, VGATE-05, VGATE-06
**Success Criteria** (what must be TRUE):

  1. Per-baseline **run-to-run noise is measured** in `mcr.microsoft.com/playwright:v1.58.2-noble`, `--platform linux/amd64` (repeat captures per baseline, count recorded) and the numbers are committed, so the threshold can be re-derived rather than re-guessed. The chosen mechanism — absolute `maxDiffPixels` cap vs bounded/element-scoped capture — is justified in writing against those measurements, not picked first and rationalised after.
  2. The v2.14-measured regression (`MatchScore.svelte:30`, `text-lg` → `text-2xl`, ~19,500 diff px) **FAILS `voter-results-desktop`** under the new mechanism — the 1280×3684 baseline that previously passed it at 0.41% of budget — and still fails `voter-results-mobile`. The same injection is re-run against the old configuration in the same container to re-observe the miss: the blindness half of the control.
  3. Growing a captured page's height does not raise that baseline's own tolerance: the same absolute injected damage fails on both a short and a deliberately lengthened capture of the same route.
  4. The `e2e-visual` project completes **green in-container with egress to `fonts.googleapis.com` blocked**, and a production build's network trace shows zero requests to any third-party font host. The block is applied to the runner, not simulated by a stubbed fetch.
  5. Baselines are re-captured in the CI-matching container with the dev server bound `--host 0.0.0.0` (never on a developer Mac) and the full visual project passes across **≥3 consecutive runs** there; the run-4 anomaly carried at v2.14 close (1 unexplained failure in 5 clean runs) is either explained or re-observed and recorded rather than assumed gone.

**Plans**: TBD
**Single-phase rationale**: VGATE-01/02/03 and VGATE-04/05 both require baselines to be re-captured in the CI-matching container, and the re-baseline is the expensive step. Landing them together costs one; landing them apart costs two and leaves an intermediate state whose baselines match neither the old nor the final rendering. VGATE-06 *is* that single re-baseline plus its consecutive-run proof, so it belongs to the same phase by construction. Both source todos state this pairing explicitly.

### Phase 147: Candidate-App Scan Reach — Authenticated Fixture + Raw-Key Gate

**Goal**: The scanners reach the candidate app, and the raw-i18n-key guarantee becomes true for the application as a whole rather than for voter surfaces only.
**Depends on**: Phase 137
**Requirements**: CSCAN-01, CSCAN-03, CSCAN-04
**Success Criteria** (what must be TRUE):

  1. An authenticated scan fixture reaches the candidate `(protected)` route family: the scan visits the candidate app's principal routes (list recorded) in both themes, proven by content that exists only post-login appearing in the scan's own output — not by the fixture reporting success.
  2. `assertNoRawI18nKeys` runs on those routes **independently of whether the axe assertion passes**, so raw-key coverage is not hostage to a11y remediation and the phase can land green while Phase 148's fallout is still open.
  3. Injecting a catalog miss at `candidateApp.questions.*.editAnswer` and at `common.required` makes the candidate scan FAIL naming the raw key — and the same injection PASSES today at `candidate-journey.spec.ts:921` (`toHaveText(/edit/i)`) and `candidateProfilePage.fixture.ts:174` (`toContainText(/required/i)`). The two-run control is run at both named sites. Patching those two matchers in place does **not** satisfy this: the route-family extension is the fix.
  4. The REAL-04 overstatement recorded at v2.14 close is retired in the record: the claim reads as application-wide, and the key-union coverage figure is **recomputed** to include the candidate catalog rather than inherited from the voter-only 598.
  5. A committed inventory lists every axe violation the candidate routes produce, by rule, route, theme and selector — the measured input Phase 148 is sized against.

**Plans**: TBD
**Split rationale**: `assertNoRawI18nKeys` currently rides inside `assertAxeScan`, so extending `AXE_ROUTES` would land both assertions at once — and the candidate `(protected)` surfaces have never been axe-scanned, so that single commit would very likely land the suite red, which the cardinal rule forbids. Decoupling the scanners lets the raw-key gate go green immediately (its two blind sites are matcher defects, not a11y defects) while the a11y fallout gets a phase of its own to land in, sized against a real inventory rather than an assumption of zero.

### Phase 148: Candidate-App A11y Remediation to Zero

**Goal**: The candidate app passes the same a11y gate the voter app does, on surfaces that have never been measured.
**Depends on**: Phase 147
**Requirements**: CSCAN-02
**Success Criteria** (what must be TRUE):

  1. Every violation in Phase 147's inventory is closed **in the product** — not by narrowing the scan's rule set, route list, or theme coverage — or carries an explicitly recorded exception naming the rule, the surface, and why. The exception list is visible to the operator, not buried in a config.
  2. The candidate routes are wired into the **blocking** axe family and report **zero** violations across both themes; re-introducing one of the fixed defects makes the gate FAIL naming the rule and selector, proving the fix is what turned it green rather than the scan's configuration.
  3. The candidate app's scan configuration is identical in strictness to the voter app's (same rule set, both themes, comparable route depth); any divergence is recorded with its reason.
  4. Full E2E suite green with the candidate scans blocking, to the project's determinism standard, with the Phase-137 preflight satisfied on each run.

**Plans**: TBD
**Scope note**: This phase's size is **unknown at roadmap time by construction** — it is the first measurement of these surfaces. The operator has explicitly chosen to own the fallout in-milestone (Phase 135 GUARD-02 precedent: a violation found by our own gate is ours to close). Plan count is expected to grow after Phase 147's inventory lands; that is the intended shape, not a planning failure.

### Phase 149: CI Gates — SQL Lint/Format + Secrets & Vulnerability Scanning

**Goal**: The checks that exist but nothing runs, and the checks that do not exist yet, all redden the build.
**Depends on**: Nothing
**Requirements**: CIGATE-01, CIGATE-02, CIGATE-03
**Success Criteria** (what must be TRUE):

  1. A deliberate sqlfluff violation pushed to a migration turns the GitHub Actions build **red on a job that names `db:lint:sql`**; reverting turns it green. Observed on a real branch run — the script already exists in `package.json` and no job invokes it, so the observed failing run is the entire deliverable, and local simulation does not substitute for it.
  2. `yarn format:check` fails on a mis-formatted `.sql` file and `yarn format` fixes it in place, consistent with how every other file type in this repo behaves; the newly-covered SQL files are normalised in a single formatting commit so the gate starts from clean rather than from a backlog.
  3. A planted test secret matching the scanner's rules is **caught** and reddens the build; removing it clears the job. The plant is made on a throwaway branch and verified absent from merged history afterwards.
  4. The dependency-vulnerability job runs on every build, its current findings are recorded as an accepted baseline with severities, and it fails the build above the chosen severity threshold — demonstrated by pinning a known-vulnerable version and observing the red, then unpinning.

**Plans**: TBD

### Phase 150: `RETURNS TABLE` Nullability — Audit + Single Override Mechanism

**Goal**: A null-guard against an RPC column that really is null is not flagged as dead code, and the next consumer does not have to know a folk rule to write one.
**Depends on**: Nothing
**Requirements**: CIGATE-04, CIGATE-05
**Success Criteria** (what must be TRUE):

  1. **Every** `RETURNS TABLE` RPC in `apps/supabase/supabase/schema/**` is enumerated against its semantically-nullable output columns — at minimum `get_nominations` (`parent_nomination_id` plus the four mutually-exclusive entity-id columns) and `get_candidate_user_data` — with a remedy chosen and recorded **per RPC**, including the ones where "no change needed" is the answer and why. The enumeration is derived from the schema files, so a future RPC is not missed by having been overlooked in prose.
  2. `parent_nomination_id` reads as `string | null` at the consumer, and a root nomination (where the value IS null) is exercised by a test that **fails if the null-guard is removed** — the guard is proven live, not merely un-flagged by the compiler.
  3. The remedy is **one documented mechanism** (a type-override layer or a restructured RPC), not per-site casts: the Phase-126 ad-hoc cast in `supabaseDataProvider.ts` is removed, and a grep for ad-hoc nullability casts on RPC returns comes back empty.
  4. Re-running `yarn db:types` does not silently revert the guarantee: regeneration is performed and the type-level nullability survives it, or a check fails loudly when it does not — proven by regenerating and observing the outcome, since silent reversion on the next schema change is the failure mode this requirement exists to prevent.

**Plans**: TBD

## Progress

**Active milestone: v2.15 Trustworthy Foundations — Guards, Seed Data & CI Coverage** — Phases 137-150 (14 phases), 38/38 requirements mapped. Plan counts are set per phase by `/gsd-plan-phase`.

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 137. E2E Preflight Integrity — Assert the Served Application | 0/TBD | Not started | - |
| 138. DEF-135-04 — `EPERM-07` Root Cause + Waiver Discharge | 6/6 | Complete   | 2026-08-14 |
| 139. Single-Source Sweep Findings — Confirm or Withdraw | 3/7 | In Progress|  |
| 140. Blind-Matcher Remediation — Teardowns, Null-Matchers, Positive Controls | 0/TBD | Not started | - |
| 141. Package Unit-Test Coverage + `test:unit` Invariant Guard | 0/TBD | Not started | - |
| 142. Assertion Design — Wiring-Only Tests Assert Output | 0/TBD | Not started | - |
| 143. `svelte/store` Guard — App-Wide Reach + Fallout Triage | 0/TBD | Not started | - |
| 144. Seed-Template Strict Typing + Unknown-Prop Guard | 0/TBD | Not started | - |
| 145. Default Seed Template Repair | 0/TBD | Not started | - |
| 146. Visual Gate — Self-Hosted Inter, Height-Independent Sensitivity, Re-baseline | 0/TBD | Not started | - |
| 147. Candidate-App Scan Reach — Authenticated Fixture + Raw-Key Gate | 0/TBD | Not started | - |
| 148. Candidate-App A11y Remediation to Zero | 0/TBD | Not started | - |
| 149. CI Gates — SQL Lint/Format + Secrets & Vulnerability Scanning | 0/TBD | Not started | - |
| 150. `RETURNS TABLE` Nullability — Audit + Single Override Mechanism | 0/TBD | Not started | - |

**Shipped milestones:**

| Milestone | Phases | Plans | Status | Shipped |
|-----------|--------|-------|--------|---------|
| v2.14 E2E Coverage Expansion + Svelte 5 Idiom Polish + svelte-check Zero | 118-136 | 101/101 | ✅ Shipped | 2026-08-12 |

## Backlog

**Empty.** All four items queued here at v2.14 close are consumed into v2.15's scope:

| v2.14-close backlog item | Consumed by |
|---|---|
| Visual-gate sensitivity floor (ratio dilutes with page height — measured) | VGATE-01/02/03 → Phase 146 |
| `fonts.googleapis.com` egress inside the blocking visual gate (D-136-05-2) | VGATE-04/05/06 → Phase 146 |
| Five packages outside `test:unit` (core, matching, llm, question-info, argument-condensation) | UNIT-01..04 → Phase 141 |
| Candidate-app axe + raw-i18n-key coverage (D-136-04-1) | CSCAN-01..04 → Phases 147-148 |

Work deliberately **not** in v2.15 is tracked as **Future Requirements** in `.planning/REQUIREMENTS.md`
(product gaps · architecture · the next test-focused milestone) and as standing todos in
`.planning/todos/pending/`. Neither is backlog *queued for the next milestone* until
`/gsd-review-backlog` promotes it — this section stays empty until something is deliberately queued.
