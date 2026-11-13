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
- 🚧 **v2.15 Trustworthy Foundations — Guards, Seed Data & CI Coverage** — Phases 137-169 (in progress; 165.1 and 166 added 2026-09-22 and 2026-09-24, 167-169 added 2026-10-01)
- 📋 **v2.16 Contestant App — Registration Modes & Multi-Entity Editing** — Phases 170-179 (planned)

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

### 🚧 v2.15 Trustworthy Foundations — Guards, Seed Data & CI Coverage (Phases 137-169) — IN PROGRESS

**Milestone goal:** Make every automated check in the repo one that can be developed against — closing
the coverage holes, blind assertions, untrustworthy test data, and missing CI gates that v2.14
surfaced but did not close. 39 requirements (VGATE 6 · UNIT 4 · CSCAN 4 · INTEG 6 · ASSERT 10 · TMPL 4
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

- **143, 146, 163, 164 are independent** and can run in any order against the rest. (163 and 164
  were 149 and 150; they were moved behind the review-remediation phases on 2026-08-28.)

- **152 → 164 is the pre-ship review-remediation run.** 152–160 discharge the 131 review comments
  left on PRs #863–#874; 161–162 discharge `PRE-SHIP-REFACTORING.md`. Within it: 152 and 153 are
  independent and safe first; 156 precedes 157 (the RPCs must exist before the adapter consumes
  them); 157 precedes 158 (routes cannot stop reaching through an adapter boundary that does not
  yet exist); 158 precedes 159; 160 goes last of the 152–160 run because it documents the tree the
  others leave behind. 161 needs 156; **162 needs 156 and 161 and is marked blocking ship by its
  own source document**. The full comment-to-phase mapping is
  `.planning/PRE-SHIP-REVIEW-TRIAGE.md`, which places all 131 with none unclassified.

**No milestone-close gate phase.** The close gates are distributed into the phases that own them —
INTEG-02's ≥16-run determinism campaign is the E2E close gate, VGATE-06's consecutive in-container
runs are the visual close gate. `/gsd-complete-milestone` performs the final combined sweep.

**UI hint: none.** v2.15 adds no visual surface. Phase 148's a11y work is structural cite-and-fix
(Phase 76 / Phase 80 precedent — no `/gsd-ui-phase`), and Phase 146's font change is a
delivery-origin swap whose visual consequence is re-proven by the baselines themselves.

- [x] **Phase 137: E2E Preflight Integrity — Assert the Served Application** - Replace the defeatable listener-identity check with a response-content assertion, enforced by the harness (INTEG-04/05/06)
- [x] **Phase 138: DEF-135-04 — `EPERM-07` Root Cause + Cardinal-Rule Waiver Discharge** - Name the root cause, prove the fix across ≥16 runs, discharge the waiver unrenewed (INTEG-01/02/03) (completed 2026-08-14)
- [x] **Phase 139: Single-Source Sweep Findings — Confirm or Withdraw** - Re-read F15/F16/F18/F19/F20 against live code; each independently confirmed or withdrawn before remediation is planned (ASSERT-01) (completed 2026-08-14)
- [x] **Phase 140: Blind-Matcher Remediation — Teardowns, Null-Matchers, Positive Controls** - F3's 27 unfailable row counts, F19's `toBeDefined()`-on-null sites, F9's missing positive control, F10's budget drift (ASSERT-02/03/05/06)
- [x] **Phase 141: Package Unit-Test Coverage + `test:unit` Invariant Guard** - Wire `matching` + `core`, decide the three Experimental packages, guard the class so the hole cannot reopen, and close F-140-01's teardown-prefix guard (UNIT-01/02/03/04, ASSERT-10) (completed 2026-08-18)
- [x] **Phase 142: Assertion Design — Wiring-Only Tests Assert Output** - Every finding surviving 139 asserts observable output or is withdrawn on the record (ASSERT-07) — **12 remediated, 0 withdrawn**, proven by **13 executed negative-control pairs** (11 under 139's pre-specified regression + 2 supplementary: one for F17, whose criterion-1 pair is `N/A — by construction` — a scoped, pre-predicted exception, **remediated not withdrawn** — and one for F15-A's Configuration 2, added at verification to close W-1); ledger `.planning/phases/142-assertion-design-wiring-only-tests-assert-output/142-NEGATIVE-CONTROL-LEDGER.md` (completed 2026-08-21)
- [x] **Phase 142.1: Provider `getIdTokenClaims` Duplication — Make A-07 Reach Production** - Collapse the duplicated decrypt→verify→claims path in `idura.ts`/`signicat.ts` onto the shared helper so the coded errors and lazy env parse reach `/api/oidc/token`, and replace the two `typeof … === 'function'` provider guards with output assertions (ASSERT-11) — Phase 142's P-2 — **8 pairs, both halves measured here, 0 cited, 0 withdrawn**; 8/8 OLD halves GREEN (blind), 8/8 NEW halves RED; ledger `.planning/phases/142.1-provider-getidtokenclaims-duplication-make-a-07-reach-produc/142.1-NEGATIVE-CONTROL-LEDGER.md` (completed 2026-08-22)
- [x] **Phase 143: `svelte/store` Guard — Prove the Reach, Close the Gaps, Correct the Record** - **CORRECTED 2026-08-22 by Phase 143 itself; the original wording was wrong when written.** It read *"Widen the ESLint guard from contexts/routes to all of `apps/frontend/src/**`, triage every pre-existing usage"*, describing construction work that had already landed. In fact `7c47b35b7` (*`refactor(115-02): widen svelte/store ESLint guard to src/**/*.{ts,svelte} (SWEEP-03)`*, 2026-06-13, Phase 115) widened the glob at the guard block's `files` key in `apps/frontend/eslint.config.mjs` — **nine days after** the todo asking for it was filed — and the triage surfaced **nothing**: the strict grep returns **0 real imports**. What ASSERT-08 actually left outstanding was its **proof clause** under the milestone's standing acceptance rule (`REQUIREMENTS.md:7-13`) — the guard had been observed *working*, never observed *blind*. The phase therefore proves the reach (**8 measured halves, 0 cited**; 4 sites × 2 extensions in a standing spec), closes two **measured** reach gaps the widening never covered (`.js`/`.mjs`/`.cjs` files, and dynamic `import('svelte/store')`), and corrects five records (ASSERT-08/09). *The phase directory slug keeps the original phrasing (`143-svelte-store-guard-app-wide-reach-fallout-triage`) because it is a stable identifier, not a claim.* **Delivered — 8 measured halves · 0 cited · 4 SC-1 sites × 2 extensions · 2 gaps closed · 16 exclusion entries before, 16 after, 0 additions**; 19 register rows, 0 borrowed observations, 0 cache replays; the guard spec went from **2 cases to 30**; ASSERT-09 discharged as a **measured zero** (`0 real imports` under `git grep -n "from 'svelte/store'" -- apps packages`, invariant across both phase HEADs). Six gates green at one HEAD, first attempt — `yarn test:unit` 167 files / 1709 tests, `TURBO_FORCE=true yarn lint:check` 0 errors, `yarn format:check`, `yarn build`, `yarn workspace @openvaa/frontend check` 2684 files / 0 errors / 0 warnings, and `yarn test:e2e` **135 passed · 0 failed · 0 skipped · 0 flaky · 0 "did not run"**. Residue filed as standing todos rather than closed: the `svelte/motion` ban (blocked by two live `tweened` call sites), the frontend lint script's `src/`-only scope, and the computed-specifier `import(n)` form no static rule can close; ledger `.planning/phases/143-svelte-store-guard-app-wide-reach-fallout-triage/143-NEGATIVE-CONTROL-LEDGER.md` (completed 2026-08-22)
- [x] **Phase 144: Seed-Template Strict Typing + Unknown-Prop Guard** - Per-collection row types + a runtime throw naming `external_id`/key/collection + `TemplateSchema.strict()` (TMPL-01/02, ASSERT-04)
- [x] **Phase 145: Default Seed Template Repair** - `yarn db:reset-with-data` yields parties and a candidates tab, with a standing regression guard (TMPL-03/04) (completed 2026-08-24)
- [x] **Phase 146: Visual Gate — Self-Hosted Inter, Height-Independent Sensitivity, Re-baseline** - One container re-baseline covering both the sensitivity mechanism and the font-egress removal (VGATE-01..06) (completed 2026-08-26)
- [x] **Phase 147: Candidate-App Scan Reach — Blocking Axe + Raw-Key Gate** - Candidate routes into the blocking axe family, raw-i18n-key gate extended to them, the raw-key CLASS closed on the candidate surfaces by the scan (CSCAN-01/02/03/04). **⚠ Description corrected 2026-08-27 by `147-05`: this previously read "two blind matchers fixed". They were NOT fixed — `candidate-journey.spec.ts:924` and `candidateProfilePage.fixture.ts:179` remain blind BY DESIGN, because criterion 3 says in terms that patching them does not satisfy it. See `147-NEGATIVE-CONTROL.md` § *Residue* A.** (completed 2026-08-27)
- [~] **Phase 148: Candidate-App A11y Remediation to Zero** - **ABSORBED INTO 147** on 2026-08-27: the pre-scan inventory measured **zero** violations, so there is no fallout to remediate (CSCAN-02 moved to 147)
- [x] **Phase 151: Ship v0.2 Akita — Review Stack & Commit-History Restructure** - Checklist + style-guide sweeps, comment hygiene, commit-history restructure, and a review-only PR stack off `origin/main` (see ROADMAP.md § Addendum 1)
- [x] **Phase 152: Comment & Naming Hygiene Sweep** - Line-break-free multiline comments, no historical narrative, no planning references, no encoded dashes, plus the file/symbol renames; `(voters)/+layout.svelte` is the reviewer's worked keep-vs-remove exemplar and defines the target style (19 review comments)
- [x] **Phase 153: Build & Tooling Config Correctness** - The mechanical plumbing defects: 8× missing `tsup` devDependency, `engine`→`engines`, `__dirname` in an ESM vitest config, the `bash -c` lint-staged shell-out, the workflow's missing `audit-skill-drift.sh`, and two committed build artifacts (17 review comments)
- [x] **Phase 154: dev-seed Determinism & Template Validation** - `faker.date.future()`/`recent()` are relative to *now*, so a fixed seed does not yield a fixed dataset across days — a direct breach of the package's written determinism contract; plus built-in template validation and the `external_id` requirement on `fixed` rows (6 review comments)
- [x] **Phase 155: Edge Function Hardening — env, JWT, provider identity** - Two real defects (base64url JWT segments decoded with `atob()`), every silent env default replaced by a throw, and the Signicat identity decision: find a pseudonym or hetu, or drop Signicat — birthdate-based matching is not unique (8 review comments)
- [x] **Phase 156: Supabase Schema Corrections — naming, constraints, grants** - `party`→`organization`, enums where bare strings are used, the missing `>= 1` constraint, `is_image` extraction, the self-editable `sort_order` and system-managed timestamp grants, RPC generalisation, hard-coded ports. Migrations and schemata may be rewritten together — no backwards compatibility is owed (18 review comments) (completed 2026-08-30)
- [x] **Phase 157: Adapter Boundary & Typing** - Validated typed JSONB replacing the typecasts, the extracted filter-value conversion, the missing `get_questions` RPC and election-round filtering, `withAuth` shim removal, `getLocalized` colocation — and the source test that keeps adapter specifics out of routes and components (14 review comments) (completed 2026-08-31; closed on the four operator rulings in `.planning/v2.15-OPERATOR-DECISIONS-2026-08-31.md` — the review classes it surfaced are carried by 157.1, 157.2 and 158, and none is charged to this phase)
- [x] **Phase 157.1: Fail-Loudly Parse Posture + Production Logging** - A parse failure at the adapter boundary becomes distinguishable from absence instead of degrading to an empty value that silently discards a whole JSONB column, across all five schemas; and `warn`/`error` stop being silenced in production, without which the posture is unobservable in the field (operator rulings D8 + D9, 2026-08-31)
- [x] **Phase 157.2: Per-Request Adapter Instancing** - Server-side adapter selectors stop being module singletons re-`init()`ed per request, proven by a concurrency test that fails on the singleton before it passes on the fix; closes the class behind cross-candidate data bleed and the mid-job `#supabase` rebind (operator ruling D11, 2026-08-31) (completed 2026-09-01, 9/9 plans; all six criteria answered by artefacts, the five-row negative-control ledger closed with all ten cells measured, and the closing gate green — E2E 150 passed / 0 failed / 0 did-not-run, exit 0)
- [x] **Phase 158: Routing & Auth Surface Harmonisation** - The largest bucket: login implemented three times, cookie names with no shared const, string-built routes bypassing `buildRoute`, and a `hooks.server.ts` `candidate` match that breaks on a subpath. Centralise the route locus, define `(protected)` there, enforce with tests (27 review comments). **⚠ Scope widened 2026-08-31 by operator ruling D10:** the admin-app outage folds in here — restore admin auth, gate `/admin` in `hooks.server.ts`, add the missing role checks on admin form actions, delete the dead `/api/auth/login` credential oracle, and land the first admin E2E coverage. **Its 9 existing plans predate the widening and need a re-plan pass.** (completed 2026-09-02, 17/17 plans after the additive re-plan; verified 13/13 ROADMAP success criteria, 7/7 REVIEW-RT requirements and 6/6 carried obligations OB-1..OB-6, `behavior_unverified: 0`, no gaps — each checked against the tree at `83578fb06` rather than restated from the seventeen SUMMARY files, with both new standing guards proven non-vacuous by planted violations. Closing gate green — E2E 153 passed / 0 failed / 0 flaky / 0 skipped / 0 did-not-run, exit 0, after a plain `db:reset` immediately before the suite. Two human-verification items accepted by the operator as tracked follow-up rather than blockers: the bank-auth OIDC round trip, unrun since the cookie rename and endpoint move — the guard is proven to fire, the handshake is not — and the pre-existing forgot-password PKCE `?code=` branch.)
- [x] **Phase 159: Component & Context Consolidation** - `$effect` sites that should be `$derived`, `MultipleTextInput` folded into `Input` with multilingual support, `EntityCardAction` replaced by a snippet, the two tracking-service layers collapsed, and the duplicated voter/candidate context block shared (14 review comments)
- [x] **Phase 160: Agent Docs & Skills Refresh** - The object-model additions, the missing extension-pattern steps (dev-seed templates, E2E filter coverage, skill self-check), and the two evidence-based evaluations the reviewer attached — progressive disclosure vs direct reading, and the 288-run ablation on persistent context files (8 review comments) (completed 2026-09-14)
- [x] **Phase 161: Project Scoping — `PROJECT_ID` Parameterisation** - A `PROJECT_ID` env defaulting to the default project, every query parameterised by it, and E2E creating its own project under a test project id — which removes the full local DB reset from the E2E prerequisites (`PRE-SHIP-REFACTORING.md` § item 1)
- [x] **Phase 162: Permissions & Auth Model Refactor** - The grants matrix: `grants` keyed `user_id × scope × target_id × role`; scopes global/account/project/entity; **two role levels, `admin` and `editor`**; read authority separated from write authority by permission member asked of one predicate, `user_can(scope, uuid, permission)`; the `is_child_nominee` predicate; per-project settings governing candidate self-edit and nomination approval; storage through the same helpers. **The document marks this blocking ship** (`PRE-SHIP-REFACTORING.md` § Permissions refactoring) (completed 2026-09-20)
- [x] **Phase 162.1: Permissions Follow-Up — Read-Cost Investigation & Closed-Project Voter Coverage** - Two residuals Phase 162 recorded openly: the authenticated entity-read at **4.47x** and the anon storage-bucket read at **6.4x**, both measured and neither shown to matter at real election scale — investigate, then fix/accept/monitor on evidence; and the one user-visible consequence of the new visibility gate, a project not open for voters returning the anon caller **zero** `app_settings` rows, which `.single()` turns into a **throw** and which **no seed or spec can currently reach** because every seeded project is open (completed 2026-09-19)
- [x] **Phase 163: CI Gates — SQL Lint/Format + Secrets & Vulnerability Scanning** - Invoke the `db:lint:sql` script that nothing runs, put SQL in the standard format gate, add secrets + vuln scanning (CIGATE-01/02/03) — **moved from 149** so the gates land on the post-remediation tree.
- [x] **Phase 164: `RETURNS TABLE` Nullability — Audit + Single Override Mechanism** - Enumerate every RPC's semantically-nullable columns and fix the lie with one mechanism, not scattered casts (CIGATE-04/05) — **moved from 150** for the same reason.
- [x] **Phase 165: Review-Stack Comment Remediation** - Collect every reviewer and GitHub Copilot comment on the twelve stacked ship PRs (#876-#887), triage each as a real defect, an artifact of reviewing one slice of the 12-way split in isolation, or already resolved, and fix every actionable one on `ship/v2.15-13-review-fixes`, stacked on `ship/v2.15-12-planning`, with the repo comment-hygiene rules applied to every changed file (completed 2026-09-29)
- [x] **Phase 165.1: Results Navigation Redraw** - Stop the voter results page from remounting and flickering on tab / entity / drawer navigation; reshape its routes to follow the layout and hoist the drawer(s) to one app-wide host. Grounded in spikes 031-034 (`spike/results-redraw`). (completed 2026-09-24)
- [x] **Phase 166: Retire `auth_user_id` — Entity Identity from Grants** - Drop `candidates.auth_user_id` / `organizations.auth_user_id`; the "which entity am I" lookups read the entity-scope grant instead, so the two Edge Functions write one link, not two, and published rows stop exposing auth user ids. (completed 2026-10-02)
- [x] **Phase 167: Origin/main Vestige Cleanup** - Discharge the code-side deferrals of the 261001-n8y vestige sweep: pin `safeGetSession` round trips with a test, drop `BACKEND_API_TOKEN` and resolve the old backend-URL pair, remove unused deps (audit baseline in step), port `OpenVAALogo.svelte` to runes, close the stale env.dir todo, delete `gate-evidence/`. (completed 2026-10-02)
- [x] **Phase 168: Docs-Site Rewrite — Strapi to Supabase** - Rewrite, merge or delete the ~30 docs pages still describing Strapi, and bring every other docs page up to date; restructure freely; research interludes untouched. (completed 2026-10-02)
- [x] **Phase 169: Dependency Bump to Latest Safe Versions** - Every dependency to its latest safe version, majors included, migrated and gate-green. (completed 2026-10-04)

## Phase Details

_v2.15 (Phases 137-164) below. Shipped milestones' details live in `.planning/milestones/`._

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

**Plans:** 7/7 plans complete

Plans:
**Wave 1**

- [x] 139-01-PLAN.md — Tracer: build the verdict apparatus (`139-VERDICTS.md` §§ 1-4, the named HYGIENE-LOOP / TWO-COLUMN / COLLATERAL rules, the 15-row enumeration and all fifteen record stubs) and prove it end to end on F20-4, then expand to F18 on the same `dev-seed` vehicle (wave 1)

**Wave 2** *(blocked on Wave 1 — injections are serialized; the hygiene gate is whole-tree and cannot attribute a dirty path to one of two concurrent injections)*

- [x] 139-02-PLAN.md — The `argument-condensation` vehicle: F16 and F20-6 (TRAP-2 — the message swap, not the throw removal), then F15-B and F15-C from one shared `Condenser.run()` injection (wave 2)

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 139-03-PLAN.md — F15-A (TRAP-1 — prove the audit's own regression un-injectable, run the recorded substitute, correct the audit's description of `:535-537`) and F20-5's two injections (wave 3)

**Wave 4** *(blocked on Wave 3 completion)*

- [x] 139-04-PLAN.md — The three F19 sites (TRAP-3 — two observed columns and the verbatim failure block, so a vacuous-but-red assertion is `confirmed` per D-02 rather than withdrawn by exit code) (wave 4)

**Wave 5** *(blocked on Wave 4 completion)*

- [x] 139-05-PLAN.md — F20-1, F20-2, F20-3 (two injections) and F17 (import-graph fact first, run as corroboration, D-06); completes all fifteen records (wave 5)

**Wave 6** *(blocked on Wave 5 completion)*

- [x] 139-06-PLAN.md — Synthesis: § 4 ordering audit and roll-up, § 7 scope limits, § 8 discarded-and-collateral (wave 6)

**Wave 7** *(blocked on Wave 6 completion)*

- [x] 139-07-PLAN.md — Criterion 4: § 6 withdrawals and propagation to all THREE targets (audit, `REQUIREMENTS.md:60`, ROADMAP Phase 142 criteria 2 and 3), the answer to the audit's `## Not assessed` prediction, and the phase-close gate (113 tests across 7 vehicles, zero source diff, zero markers) (wave 7)

**Shape note**: This phase ships **zero product code**. Every source-file modification is transient — injected, run and reverted inside the same task — so the plans' `files_modified` lists name only the durable writes (`139-VERDICTS.md` plus the criterion-4 record edits), and each plan carries a separate `transient_files_reverted` list so no reviewer misreads an injection target as phase output. The seven waves are strictly sequential by necessity rather than by dependency: two concurrent injections would each see the other's edit, and either agent's `git checkout --` could revert the other's live injection mid-run. Criterion 4's propagation has **three** targets, not the two the criterion's wording implies — ROADMAP Phase 142 enumerates the findings inline in criteria 2 and 3, so a withdrawal there is an in-sentence edit rather than a struck line.

### Phase 140: Blind-Matcher Remediation — Teardowns, Null-Matchers, Positive Controls

**Status**: Executed 2026-08-15/16, closed 2026-08-18 — 6 plans, fully serial. All five success criteria met. E2E gates 4/4 green (`140-GATES.md`): Gate 1 blocking default suite **135/135 cardinal-clean**, Gate 4 (`PLAYWRIGHT_BANK_AUTH=1 yarn test:e2e`, added for WR-03) **144/144**, both `0 failed / 0 flaky / 0 skipped`. UAT 7/7 pass. Verification initially 5/6 (2026-08-15) with the WR-03 duplicated-prefix race as the gap; closed by `700678a2d` (dedicated `e2e-bankauth-notloc-` namespace **and** a serial-chain edge) and re-verified **6/6** on 2026-08-18. Follow-up **F-140-01** — **RESOLVED 2026-08-18 (Phase 141), and its original wording was wrong when written.** It claimed no config-load prefix-uniqueness guard existed. In fact Phase 140 built one in the same phase: `abe1fabb0` landed the `TEARDOWN-PREFIX-UNIQUENESS GUARD` at `tests/playwright.config.ts:138-240`, hardened by `bdb759575` (named `fs.existsSync` precondition, IN-01) and `c15e444e8` (enumeration widened from `setup/` to the whole of `TESTS_DIR`, matching the runner's own unanchored `testMatch` scope, IN-02). The shipped guard checks prefix **containment** as well as equality — the real hazard, since `bulk_delete` matches `external_id LIKE '<prefix>%'` — plus an unparsed-declaration **completeness** check (WR-03) that fails a file which calls `runTeardownAsserted` but whose `const PREFIX` the guard cannot parse; it runs at **config load**, so every `playwright test` / `--list` invocation trips it. Prefix disjointness has therefore been enforced, not conventional, since 2026-08-15. What F-140-01 actually left outstanding was the **negative-control evidence** the milestone's standing acceptance rule demands: the guard was built but never observed failing. Phase 141 supplies it in `141-ASSERT10-LEDGER.md` — nine rows at HEAD `9b6d939a1`, every branch run red (equality, containment, completeness, out-of-`setup/` enumeration scope) and every must-not-fire case run green (clean baseline, the prefix-free legitimate exclusion, the empty-prefix edge), with the tree restored to an identical `Total: 143 tests in 94 files` and `tests/playwright.config.ts` byte-identical (D-15 makes it read-only to Phase 141, which corrects and evidences this record but builds nothing).

**Goal**: The assertions the sweep classed as mechanical-but-unfailable can fail, and the absence-only assertions have something proving they can still see presence.
**Depends on**: Phase 137
**Requirements**: ASSERT-02 (F3), ASSERT-03 (F19), ASSERT-05 (F9), ASSERT-06 (F10)
**Success Criteria** (what must be TRUE):

  1. **F3** — a teardown run where the delete matches nothing FAILS the `*.teardown.ts` assertion by name; the same scenario against the pre-change `toBeGreaterThanOrEqual(0)` form PASSES. Observed on a sample spanning the shared helper and the 27 call sites, so the 27th file is covered by construction rather than by 27 hand edits nobody re-checks.
  2. **F19** — removing the `request` / `client_assertion` value from each of the three fixtures makes the assertion itself fail naming the missing parameter (not a downstream `TypeError` from the following line), and passes under the old `toBeDefined()`. The two-run control is run at all three sites.
  3. **F9** — `perm-hide-category-tags` / `perm-hide-election-tags` FAIL when the tag element stops rendering *anywhere*: proven by removing the tag from the rendering path and observing the pair go red, where previously both stayed green. The positive control is seeded data, not a comment.
  4. **F10** — `voter-journey.spec.ts`'s stated `expect.soft` budget matches its real count (**136**, not 3), **or** a counted guard enforces the stated budget and fails when one more `expect.soft` is added — the addition is made and the failure observed before the guard is accepted. _(Corrected 2026-08-15 during Phase 140 planning: this criterion read **137** until now, and 137 was correct when the sweep measured it on 2026-08-11. Phase 138 then promoted one soft assertion to hard in this very file — `bea9fc97a`, `voter-journey.spec.ts:858` — taking the count 137 → 136. Verified at both commits: `bea9fc97a~1` → 137, `bea9fc97a` and HEAD → 136. The 2026-08-11 audit record and the completed-todo entry still say 137 and are **left as-is**; they were true when written. That this criterion went stale between Phase 138 and Phase 140 is the same drift class F10 exists to close, which is why the number is now pinned to a measurement rather than a quotation.)_
  5. Unit and E2E suites return to green after the edits, with the Phase-137 preflight satisfied on every run used as evidence.

**Plans**: 6/6 plans executed (fully serial — waves 1-6; see note below)

Plans:
**Wave 1**

- [x] 140-01-PLAN.md — TRACER: F19 null-blind matchers repaired at all three sites, two-run control run at each, `140-NEGATIVE-CONTROL.md` established (ASSERT-03)

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 140-02-PLAN.md — F10 counted `expect.soft` guard at config load + truthful `voter-journey.spec.ts` header, blindness half observed first (ASSERT-06)

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 140-03-PLAN.md — F9 seeded preconditions: complementary-tag template edits + observed blindness of the absence-only pair (ASSERT-05)

**Wave 4** *(blocked on Wave 3 completion)*

- [x] 140-04-PLAN.md — F9 positive controls in both perm specs (house form), catch half observed, `140-VALIDATION.md` reconciled (ASSERT-05)

**Wave 5** *(blocked on Wave 4 completion)*

- [x] 140-05-PLAN.md — F3 shared `assertTeardown` helper + exact-count probe + 27-site codemod (behaviour-preserving) + instrumented measurement (ASSERT-02)

**Wave 6** *(blocked on Wave 5 completion)*

- [x] 140-06-PLAN.md — F3 matcher adjudicated against the measured table, two-run control, phase gate (ASSERT-02, criterion 5)

_Wave note: the six plans are strictly serial. Every E2E-bearing plan contends for the same single dev
server on `:5173` and the same local Supabase database (`e2e-run.sh` spawns and owns its own server and
runs `db:reset`); plan 01 holds live `idura.ts` injections that forbid any concurrent Playwright command
(research Pitfall 7); plan 02 edits `playwright.config.ts`, which every run loads; and five of the six
append to the same `140-NEGATIVE-CONTROL.md`. The serial ordering is a property of the work, not an
unexploited parallelism._

### Phase 141: Package Unit-Test Coverage + `test:unit` Invariant Guard

**Goal**: No `packages/*` workspace's tests are invisible to CI, and the hole cannot reopen with the next package added — nor can the teardown-prefix hole Phase 140 identified but didn't close.
**Depends on**: Nothing
**Requirements**: UNIT-01, UNIT-02, UNIT-03, UNIT-04, ASSERT-10
**Success Criteria** (what must be TRUE):

  1. `yarn test:unit` lists `@openvaa/matching` and `@openvaa/core` among its executed tasks, and a deliberately failing assertion planted in each turns the command's exit code non-zero — observed for **both** packages, then reverted. (Before the change, the same plant leaves the command green: 18 test files run under no CI command.)
  2. Each of `@openvaa/llm`, `@openvaa/question-info` and `@openvaa/argument-condensation` either appears as an executed `test:unit` task **or** is named in a committed skip contract stating the blocker (e.g. requires a live API key) and what would unblock it. Cross-checking `npx turbo run test:unit --dry=json` against the set of workspaces containing test files leaves no package unaccounted for in either list.
  3. Wiring order is **evidenced, not asserted**: a per-package pass/fail record produced by actually running the tests exists and predates the commit that adds each `test:unit` script. UNIT-03 is a constraint on plan shape — plan 01 measures and records; later plans wire only what plan 01 recorded green; a red package is fixed or gets the documented skip, never a script that fails on someone else's schedule.
  4. A scratch `packages/<name>/` containing a test file and no `test:unit` script FAILS the CI guard with a message naming `<name>`; adding the script (or removing the test file) makes it pass. Both directions observed, following the Phase-136 orphaned-probe guard shape (`playwright.config.ts:34-48`), which is already proven to discriminate.
  5. **F-140-01 / ASSERT-10** — a config-load guard in `tests/playwright.config.ts` fails **by name** when two `*.teardown.ts` sites declare the same external-ID prefix, mirroring the ORPHAN-PROBE / SOFT-ASSERTION-BUDGET shape already proven in that file. Proven by injection: temporarily duplicating an existing prefix (e.g. pointing a scratch teardown at `e2e-bankauth-notloc-`) is caught by name before the change is reverted; the current disjoint set (`e2e-perm-notloc-`, `e2e-bankauth-notloc-`, and the other 26 teardown prefixes) passes clean. **Corrected 2026-08-18 (Phase 141 plan 05 gate), because this sentence read "closes the second half of the remedy Phase 140 recorded but did not build" and that was false when written:** Phase 140 *did* build the guard, in `abe1fabb0` (`tests/playwright.config.ts:138-240`), hardened by `bdb759575` (IN-01) and `c15e444e8` (IN-02, enumeration widened from `setup/` to the whole of `TESTS_DIR`). What F-140-01 genuinely left outstanding was the **negative-control evidence** the milestone's standing acceptance rule demands — the guard had never been observed failing. Phase 141 supplies exactly that and edits no byte of the guard (**D-15** makes the file read-only to this phase): `141-ASSERT10-LEDGER.md`, nine rows at HEAD `9b6d939a1`, every catch branch run red (equality B, containment C, completeness D, out-of-`setup/` enumeration scope F) and every must-not-fire case run green (clean baseline A, prefix-free legitimate exclusion E, empty-prefix edge G2, clean revert I at an identical `Total: 143 tests in 94 files`). See also `.planning/phases/140-blind-matcher-remediation-teardowns-null-matchers-positive-c/140-VERIFICATION.md` § Re-verification addendum and `STATE.md` Deferred Items.

**Plans**: 5/5 plans executed

Plans:
**Wave 1** *(no dependencies; the two workstreams touch disjoint files)*

- [x] 141-01-PLAN.md — UNIT-03 measurement record + the three blindness halves captured while the tree is still unwired (UNIT-03)
- [x] 141-04-PLAN.md — ASSERT-10 four-branch injection ledger against the ALREADY-SHIPPED guard, plus the ROADMAP/REQUIREMENTS/140-VERIFICATION corrections (ASSERT-10)

**Wave 2** *(blocked on 141-01 — UNIT-03's measure-before-wire ordering is structural)*

- [x] 141-02-PLAN.md — TRACER: `@openvaa/core` wired end-to-end and proven to turn `yarn test:unit` red, then the other four packages (UNIT-01, UNIT-02)

**Wave 3** *(blocked on 141-02 — the guard is `&&`-chained ahead of turbo, so it lands after wiring)*

- [x] 141-03-PLAN.md — `scripts/assert-unit-test-coverage.mjs`: Check 1 (has tests ⟹ declares `test:unit`) + Check 2 (declares ⟹ turbo executes), both proven RED by injection (UNIT-02, UNIT-04)

**Wave 4** *(blocked on 141-03 and 141-04)*

- [x] 141-05-PLAN.md — phase gate: build/unit/lint/census/git-order/evidence-completeness + full E2E under the cardinal rule (all five requirements)

**Shape note**: research measured the tree at HEAD `69d0a2d3c` and found **ASSERT-10's guard already ships** — `tests/playwright.config.ts:138-240`, landed by Phase 140 itself (`abe1fabb0`, hardened by `bdb759575`/`c15e444e8`). Per **D-15** that file is **read-only to this phase**: ASSERT-10 delivers the negative-control evidence Phase 140 never produced plus the correction of criterion 5's own provenance claim (and of `ROADMAP.md:387` and `REQUIREMENTS.md:63`), not construction. Two scope amendments also apply: **D-16** widens the UNIT-04 guard to scan `apps/*` as well as `packages/*` via one array constant, and **D-17** folds the UNIT-02 turbo cross-check into the same guard as a second assertion — knowingly forfeiting D-08's no-subprocess bootstrapping property, since the guard now shells `npx turbo … --dry=json` before turbo runs. The single highest-risk implementation detail is research **Pitfall 1**: `--dry=json` lists unwired workspaces too, as `"command": "<NONEXISTENT>"`, so the naive cross-check passes at HEAD before any work lands; plan 01 records that naive variant green on the unwired tree precisely so plan 03's discriminating variant can be shown to be doing the work.

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

**Plans**: 6/6 plans executed

**Outcome (ASSERT-07 evidence clause, matching `REQUIREMENTS.md:60` and the audit's § Remediation status):**
**12 remediated, 0 withdrawn**, proven by **13 executed negative-control pairs** — 11 driven by 139's
own pre-specified regression (one per finding), plus **2 supplementary pairs**: ledger row **5s**,
standing in for **F17**, whose criterion-1 pair reads `N/A — by construction`, and ledger row **1s**,
a second pair for **F15-A** added at verification to close **W-1**. Of the 13 pairs, **8** OLD halves
are cited from 139 § 5.N.4 and **5** were re-run in this phase (rows 1, 7, 9, 5s, 1s); every NEW half is
a measurement taken here. Ledger:
`.planning/phases/142-assertion-design-wiring-only-tests-assert-output/142-NEGATIVE-CONTROL-LEDGER.md`.

- **Criterion 1** is satisfied for eleven findings by measured pairs, and for the twelfth (**F17**) by a
  **scoped, pre-predicted, recorded exception** plus a supplementary measured pair. The exception is
  visible in all three propagation targets rather than rounded away — see the ledger's *Scoped
  exceptions* section and the F17 annotation in the audit.

- **Criterion 2** is satisfied, with its Configuration-block clause met by a **substitute** rather than
  by the mechanism 139 named. **A-04 rejected 139 § 5.1.6's literal target** — pairwise inequality across
  the file's three "Configuration" blocks — because those blocks use three *differently-named* questions
  and `question.name` is interpolated into the prompt, so the comparison **passes today for the wrong
  reason**: writing it would have shipped a new fake guard out of the phase whose purpose is removing
  them. The substitute is a **new same-name/varying-type fixture** (`questionTypes.test.ts:585-655`),
  whose T2 (`not.toBe`) and T3 (`toContain`) were both measured **red before D-01's product fix and
  green after**. After the **W-1** closure (ledger row 1s, `d1fc0f745`), **all three Configuration
  blocks carry assertions on the prompt the mocked provider received** — Configuration 1 at `:113`,
  Configuration 2 at `:239`/`:246`/`:318`, Configuration 3 at `:450-451` — so no ordinal test remains
  mock-in/mock-out. The condensation half of the criterion is met at `condenserStandalone.test.ts:154-160`
  and `condenseQuestions.test.ts` (three clusters), and the wall-clock `processingTimeMs > 0` assertion
  is **deleted**, not weakened (D-12's bounded sweep: one site found, one removed, zero others; the one
  surviving `processingTimeMs` reference is a `toBe(10)` **rename** assertion, explained inline).
  **Residue, named rather than implied:** D-01-iii — a 5-point and a 7-point ordinal share the
  `'singleChoiceOrdinal'` discriminant, so the *scale semantics* stay implicit in the prompt; what row
  1s adds is a guard on the choice labels that carry the distinction, not a closure of the underlying
  gap. D-01-i (the question's `info` text never reaches the prompt) and D-01-ii (no localised type
  label) remain open by design, as named scope exclusions with standing todos.

- **Criterion 3** is satisfied per finding, each with its own matcher and its own measured red:
  **F16** — `handleQuestion.test.ts:98` asserts the exact prefix `'Unsupported language: lol'` (stronger
  than the criterion's own `/language/i` wording) against a **non-empty `entities`** fixture, without
  which the call never reaches past the language check. **F17** — remediated by **rename** (D-04) to
  `EntityListWithControls.helpers.test.ts`, the contract it actually verifies; its criterion-1 pair is a
  **`N/A — by construction` scoped exception** (A-06), pre-predicted by 139 § 5.5.6 and independently
  forbidden by § 8.3 R-10, **remediated not withdrawn**, with a supplementary measured pair at ledger
  row 5s. That exception is deliberately left visible and **must not be rounded away**. **F18** —
  `default.test.ts:151-168` asserts the locale **block boundary** on two independent axes, with
  `blockSize` derived from the data rather than from `LOCALE_BLOCK_SIZE`. **F20**, all six:
  1 — `rejects.toMatchObject({ status: 400 })`; 2 — `toBe('{broken, plural, }')`, the exact ICU
  template; 3 — two **different** error codes, `ERR_JWKS_EMPTY` vs `ERR_JWK_KID_MISMATCH`, each red only
  under its own branch; 4 — exact column-string equality (the old `toContain('id')` substring-matched
  `external_id`); 5 — a derived length guard plus id membership; 6 — the exact invariant message,
  distinguished from the competing sibling invariant.

- **Criterion 4** is satisfied **vacuously and visibly**: the **withdrawal count is 0**, stated rather
  than implied. Phase 140 criterion 4 (`:350`) instructs that a *shrink* in ASSERT-07's scope be made
  visible rather than silent — **there is no shrink**, and that fact is now on the record in the audit,
  in `REQUIREMENTS.md` and here, instead of being left to inference. Nothing is struck in the audit,
  because 139 § 6's strike-rather-than-delete precedent applies only to withdrawals and there are none.

- **Criterion 5** is satisfied by **three consecutive green** root `yarn test:unit` runs under
  **parallel turbo load** (not per-package isolation), with the Phase-141 coverage guard reporting
  0 violations on both checks in all three and a cache bypass in every run.

**Three product changes were required** — the phase could not stay test-only. D-01 (question type +
choice labels reach the info-generation prompt), D-02/A-02 (three endpoints stop swallowing their own
4xx), A-07 (the auth failure-code split), plus a fourth from an operator-approved scope expansion at
`142-04`'s checkpoint (a lazily-parsed env var, so a malformed JWKS is catchable rather than an
uncatchable import-time crash). **A-10's "capture as a todo, do not fix" was explicitly superseded** by
the same checkpoint; its todo is closed, not left open.

**One gap-closure pass ran after verification (2026-08-21).** `142-VERIFICATION.md` returned
`human_needed` on a single finding, **W-1**: Configuration 2 of `questionTypes.test.ts` carried no
assertion on the composed prompt, so three of F15-A's eleven blind sites were still blind and the
Outcome block above addressed criteria 1/4/5 only. The operator directed both halves be closed — the
assertion added (`d1fc0f745`, ledger row **1s**, both negative-control halves measured, **no product
change**) and the record corrected (criteria 2 and 3 stated above; counts reconciled to **13 pairs**
across ledger, audit, `REQUIREMENTS.md` and here). Recorded as a reopening rather than folded silently
into the phase's own narrative.

Plans (executed **strictly sequentially**, one wave each — D-06/D-07/G2; file numbers follow D-17's *area* partitioning, `wave` gives the running order **3 → 2 → 5 → 1 → 4 → 6** per A-08):

- [x] 142-03-PLAN.md *(wave 1)* — `dev-seed`: write the 12-row negative-control ledger before any injection, then F20-4 (tracer — the thinnest complete pass through the inverted HYGIENE-LOOP) and F18's locale-block boundary
- [x] 142-02-PLAN.md *(wave 2)* — `argument-condensation`: F15-B + F15-C (one shared `condenser.ts:205` injection, two vehicle runs), E9's deletion and the bounded D-12 sweep, F16's exact rejection prefix, F20-6's exact invariant message
- [x] 142-05-PLAN.md *(wave 3)* — `apps/frontend` other + `packages/data`: F17's D-04 rename plus A-06's `N/A — by construction` row and supplementary pair, F20-2's exact ICU template, F20-5's derived count and id membership
- [x] 142-01-PLAN.md *(wave 4, **non-autonomous**)* — `question-info`: OLD half re-run pre-fix, checkpoint, D-01's minimal product fix (question type + choice labels reach the prompt), the A-04 new fixture, D-03's repoint, D-05's `:388`
- [x] 142-04-PLAN.md *(wave 5, **non-autonomous**)* — `apps/frontend` auth: OLD halves re-run pre-fix, checkpoint, three product changes (D-02's status contract, A-02's token sibling, A-07's error-code split), then F20-1's **inverted** injection A and F20-3's two injections
- [x] 142-06-PLAN.md *(wave 6)* — ledger completion, D-14's 3× root unit gate under parallel load, D-16 + A-05's two E2E gates under the cardinal rule, D-18's three-target propagation, D-19/A-10 todo reconciliation

**Shape note**: the negative-control **columns invert** relative to Phase 139 — there a green under injection was the finding, here a **RED is the success signal** — which is stated at the top of every injection task because an executor pattern-matching on 139's record would otherwise revert a correct remediation. Three amendments change the work materially: **A-02/A-03** (D-02's named `throw error(400, …)` fix is a runtime no-op since `error()` throws unconditionally, so the fix is a catch-arm re-throw — and post-fix F20-1's negative control *inverts*, NEW half using injection A, not B); **A-04** (139 § 5.1.6's stated F15-A target passes today for the wrong reason and must NOT be written — a new fixture holding question text constant and varying only `type` is required instead); and **A-06/A-07** (F17 has no available NEW half by construction of D-04's chosen branch, so its row reads `N/A — by construction` as a scoped, pre-predicted exception to criterion 1 plus a supplementary pair; and F20-3 needs a two-code error split as a *third* product change). Expected withdrawal count: **0**.

### Phase 142.1: Provider `getIdTokenClaims` Duplication — Make A-07 Reach Production

**Goal**: The discriminating auth-failure codes Phase 142 built actually reach the endpoint production calls, and the tests pinning that path assert output rather than existence.

**Depends on**: Phase 142 (A-07 built the coded helper this delegates to; its `142-04`/`142-06` records and the ledger's P-2 entry are the source of scope)

**Requirements**: ASSERT-11

**Provenance**: Phase 142's **P-2**, surfaced by `142-04` Task 3 and widened at `142-06`. Phase 142's own criterion was met — D-11 E6 asks that F20-3's two *tests* differ observably, and they do, against the helper they exercise — but the operational benefit stops at the helper. Full record: `.planning/todos/pending/provider-getidtokenclaims-duplication.md`.

**Success Criteria** (what must be TRUE):

  1. `/api/oidc/token/+server.ts:26`'s call reaches the **shared** `getIdTokenClaims.ts` logic — the duplicated copies at `providers/idura.ts:114` and `providers/signicat.ts:77` either delegate to it or are replaced by a common extracted path. An empty JWK set and a kid mismatch are distinguishable **on the production path**, not only in the helper's own tests.
  2. The provider path inherits the helper's **lazy env parse**: a malformed `IDENTITY_PROVIDER_DECRYPTION_JWKS` surfaces as a coded, catchable error rather than an uncatchable import-time `SyntaxError`. The provider copies do not have this property today.
  3. `providers/idura.test.ts:90-91` and `providers/signicat.test.ts:54-55` no longer assert `typeof provider.getIdTokenClaims === 'function'` under a title claiming the method is implemented. They assert the claims a provider returns for a known synthetic token, and the discriminating error code for each failure branch. The same treatment is applied to any sibling guard of the same shape on `getAuthorizeUrl` / `exchangeCodeForToken`, or the residue is named.
  4. Each strengthened assertion carries a **freshly measured negative-control pair** — both halves. Nothing is citable from Phase 139: the 2026-08-11 sweep never enumerated these two files, so there is no recorded OLD half to cite and no pre-specified injection to reuse.
  5. Error messages remain leak-safe under the A-07 bar: opaque failure-class identifiers, no JWKS contents, no configured kids, no issuer or audience echoed to an unauthenticated caller.
  6. The bank-auth E2E projects pass — this phase changes the path they exercise. Under the cardinal rule, with `PLAYWRIGHT_BANK_AUTH=1` and the prerequisites Phase 142 recorded (`SUPABASE_ANON_KEY` exported, identity-callback Edge Function served, `FRONTEND_PORT` per the runbook).

**Plans**: 3/3 plans executed, **strictly sequentially**, one wave each (D-28 — the shape is locked, and the OLD halves only exist on the pre-collapse tree):

  - `142.1-01-PLAN.md` — open the ledger with all 8 rows written **before** the first injection, then measure every OLD half on the untouched pre-collapse tree
  - `142.1-02-PLAN.md` — the collapse, the helper deletion and the strengthened tests landed **together**, then measure every NEW half
  - `142.1-03-PLAN.md` — the five static gates and the three E2E runs, the two doc corrections, the residue filed as standing todos, and the record propagated

Plans:
**Wave 1**

- [x] 142.1-01-PLAN.md *(wave 1)* — open `142.1-NEGATIVE-CONTROL-LEDGER.md` with **all 8 rows written before the first injection** (D-19), then measure **every OLD half** on the untouched tree (D-17 steps 1-2); all eight `typeof` guards observed GREEN (blind)

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 142.1-02-PLAN.md *(wave 2, **non-autonomous**)* — operator checkpoint, then the collapse (D-06/D-07), the repoint + helper deletion (D-02/D-02a/D-02b), the endpoint logging (D-09/A-07), the strengthened tests (D-11…D-16, D-23/A-06) and A-05's lint fix — landed **together**, collapse first — then **every NEW half** (D-17 steps 4-5)

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 142.1-03-PLAN.md *(wave 3)* — D-27's four static gates **+ A-04's fifth** (`yarn workspace @openvaa/frontend check`), D-25's three E2E runs 1× each under the cardinal rule, A-08's doc corrections, residue naming (D-03, D-05, D-02c) and D-29's reconciliation

**Closing note (2026-08-22)** — the counts, derived once in the ledger's § Final counts and repeated here
only so the three propagation targets **agree**: **8 pairs · 8 OLD halves measured in this phase · 8 NEW
halves measured in this phase · 0 cited · 0 withdrawn**; **8 of 8** OLD halves observed GREEN (blind) and
**8 of 8** NEW halves observed RED naming their own strengthened assertion; 11 collateral reds observed,
**0 credited**. Gates: five static (`test:unit` 167 files / 1670 tests, `lint:check`, `format:check`,
`build`, and `yarn workspace @openvaa/frontend check` 2684 files 0/0 — the fifth an **addition** to
D-27's four, since neither lint nor build typechecks `apps/frontend/src`) and three E2E runs 1× each
under the cardinal rule (`yarn test:e2e` **135 passed**, `bank-auth-journey` **115 passed**, `bank-auth`
**8 passed**, zero "did not run"). Residue **named, not closed**: D-03 (the Edge Function's fourth copy),
D-05 (the missing negative tests, repointed rather than duplicated) and D-02c (the preregister route's
absent unit test) are standing todos. The same figures appear in `.planning/REQUIREMENTS.md` ASSERT-11
and in `.planning/audits/2026-08-11-fake-guard-sweep.md` § Post-sweep addendum — *three targets that
disagree are worse than one that is silent, because each looks authoritative.*

**Shape note**: Half 2 is worth doing **even if half 1 is deferred** — the wiring-only provider guards are why the duplication drifted undetected in the first place, and strengthening them makes any future divergence loud. Note the ordering hazard this inherits from Phase 142: strengthening the provider tests **before** collapsing the duplication will red them against the uncoded copies, which is the correct diagnosis rather than a regression. Sequence deliberately and record which tree each measurement was taken against.

### Phase 143: `svelte/store` Guard — Prove the Reach, Close the Gaps, Correct the Record

**Status**: Criteria **rewritten in place 2026-08-22 by `143-02`**, as the phase's own D-12 work. The originals are reproduced below rather than deleted — silent overwriting is what produces records that disagree — and each replacement is shown to be **harder** to satisfy than the criterion it replaces. (Three are quoted verbatim; SC-3's is paraphrased for the reason stated at that entry.) **Criteria were added, never softened:** the count goes from 4 to 9, and no escape hatch present in an original survives into its replacement.

**Goal**: The lint guard that claims the frontend is store-free actually covers the frontend — and is *proven* to, rather than merely asserted to.
**Depends on**: Nothing
**Requirements**: ASSERT-08, ASSERT-09
**Success Criteria** (what must be TRUE):

  1. **SC-1 (rewritten).** A `svelte/store` import injected into each of `lib/components`, `lib/utils`, `lib/dynamic-components` and `lib/candidate/components` **FAILS `yarn lint:check`** naming the file and the rule; **and** the same four injections **PASS** under the pre-115 scope **reconstructed** per D-02, with the restore proven byte-identical. **8 measured halves, 0 cited.**
     - *Before:* "…the same four injections PASS under the pre-change guard scope (`lib/contexts/**` + `routes/**` only) — the two-run control at four representative sites."
     - *Harder in three specific ways.* (a) The original presumed a pre-change scope still **existed** to run against; it has not since `7c47b35b7` (2026-06-13), so the original was **unsatisfiable as written**. (b) The rewrite adds a reconstruction step **and** a four-assertion restore proof (tracked diff · working-tree status · untracked-fixture `find` · blob hash) that the original never asked for. (c) It forbids **citing** any half from an earlier record, where the original was silent — every half must be measured in this phase, on this machine, with its own log path and HEAD.
  2. **SC-2 (rewritten).** Every OLD half and the complete pre-existing-usage inventory are recorded in `143-NEGATIVE-CONTROL-LEDGER.md` on the **untouched tree**, in a **commit that precedes** the commit changing the config. The ordering is a property of the commit graph, not an assertion made inside one commit.
     - *Before:* "Widening is run against the untouched tree **first** and the complete list of pre-existing violations is recorded before any is changed…"
     - *This one **cannot be satisfied literally**: there is no widening left to run.* `7c47b35b7` performed it in Phase 115, nine days after the todo asking for it was filed.
     - *Harder in two ways.* The original was satisfiable by an **unverifiable claim** — a sentence asserting "we ran it first". The rewrite is checkable by `git log` alone by any reader who was not present, and it **names the artifact** that must hold the record.
  3. **SC-3 (rewritten).** Every hit from **both** greps carries a per-file disposition (D-09, D-09a); the exclusion list ends the phase at its **re-measured** size of **16 entries, 0 additions** (D-11, D-11a); no site is silenced by broadening it.
     - *Before:* "Every recorded pre-existing usage has a per-site disposition… No site is silenced by broadening the guard's own exclusion list; the exclusion list ends the phase no larger than it started" — **followed by a disjunctive escape hatch that permitted additions outright, provided each one was justified.** That clause is paraphrased rather than quoted here **on purpose**: the phase's own acceptance check greps this section for its literal text, so reproducing it would make a correction indistinguishable from a non-correction. The clause is quoted verbatim, once, in `143-CONTEXT.md`'s decision record.
     - *Harder in two ways.* (a) The **escape hatch is removed** — no addition is justified, because none is made. (b) The size must be **stated from a re-measurement**, not merely bounded: stating it wrongly does not satisfy it. (The re-measurement already caught three off-by-one errors in the locked baseline, amended at source in `f28da99d3`.)
  4. **SC-4 (unchanged).** `yarn lint:check` is clean app-wide and `apps/frontend/src/**` contains no unexplained `svelte/store` import, verified by grep independently of the lint rule — with command, path argument, HEAD and verbatim output recorded (D-10).
  5. **SC-5 (added).** The two **measured** reach gaps are closed and each closure is proven by **its own standing probe**: a `.js` file under `src/` importing `svelte/store` fails the gate (D-05), and `await import('svelte/store')` fails the gate (D-06). Standing tests, not one-time measurements. The glob widening's fallout is **re-measured**, not assumed.
  6. **SC-6 (added).** The guard is proven at **four directories × two extensions** by a standing spec (D-04) — 24 matrix assertions — not at one probe path.
  7. **SC-7 (added).** All **five** record targets are corrected, each naming `7c47b35b7` at the site (D-12, D-12a), each stating the false claim rather than deleting it, and each rewritten success criterion shown to be harder than the one it replaces.
  8. **SC-8 (added).** All six gates green (D-14), under D-15's prereq, each with command, exit code, counts and log path in the ledger's gate section.
  9. **SC-9 (added, from D-06a).** The inherited `TSEnumDeclaration` ban **survives** the `no-restricted-syntax` edit, proven by a **standing** matrix case. Its own two-run control is run here too: the case is observed **RED** against the naive single-entry patch before it is observed **GREEN** against the shipped two-entry one — because a case that has only ever passed is indistinguishable from one that cannot fail.

**Plans**: 3 plans, fully serial — waves 1 / 2 / 3 (D-03). Wave 2 is the only wave that writes product bytes.

Plans:

- [x] 143-01-PLAN.md — Open `143-NEGATIVE-CONTROL-LEDGER.md` with all 19 rows before the first injection; measure every OLD (blind) half on the untouched tree; take the pre-existing-usage inventory, the out-of-scope measurements and the re-measured exclusion-list count
- [x] 143-02-PLAN.md — Land the config change (widened glob + two-entry `no-restricted-syntax`), rewrite the guard spec as a 4×2 matrix with both gap probes and the enum regression case, run SC-9's two-run control, measure every NEW (catching) half, and correct four record targets
- [x] 143-03-PLAN.md — Six gates under the E2E prereq, ledger completion with counts derived once, `REQUIREMENTS.md` evidence clauses, checkbox flips **after** the gates, and two residue todos

### Phase 144: Seed-Template Strict Typing + Unknown-Prop Guard

**Goal**: A template row that declares something the pipeline does not read is impossible to author and impossible to run.
**Depends on**: Nothing
**Requirements**: TMPL-01, TMPL-02, ASSERT-04 (F13)
**Success Criteria** (what must be TRUE):

  1. **Re-scoped 2026-08-23 per D-01 — the original exemplar was overtaken by a commit and is no longer illegal (see the note below).** `_constituencies: { external_id: [...] }` on an **`elections`** row (primary exemplar) and `_elections` on a **`candidates`** row (secondary) are each a **TypeScript error at authoring time**, naming the row type (`ElectionsFixedRow` / `CandidatesFixedRow`); deleting the offending property typechecks. The identical row is first confirmed to typecheck cleanly under the pre-change types — the two-run control kept in full. ⚠ **The roadmap's original exemplar, `_elections` on a `questions` row, is NOT illegal and must not be re-introduced as one.** It has been a first-class, resolved feature since `4aeae0ace` (*``feat(data): promote `required` to first-class Question field + wire consumers``*, 2026-06-01) — a subject that does not mention dev-seed at all, which is exactly why the citation must also say what the commit did to *this* file: it factored the `_elections` sentinel resolver `electionResolve` out of the `question_categories` block and called it for **both** tables, one day after the motivating todo was filed. `questions._elections` therefore **stays legal, and a test asserts that it stays legal** — ledger row `L`, the phase's must-NOT-fire control, which checks both that it compiles under the new types and that `planLinks` emits exactly one entry for it.
  2. Seeding a template carrying an unknown row property **throws**, and the message names the row's `external_id`, the offending key, and the collection. The same seed run before the change completes successfully and silently drops the key — observed both ways, including for a template loaded via `--template ./custom.ts`, the path that bypasses the built-in template imports.
  3. `TemplateSchema` is `.strict()` — **and `perEntityFragment` is too**, without which the nested blindness survives. **Corpus corrected 2026-08-23 from the audit's "six" to the census re-derived in `144-05` and recorded in the ledger's § Final counts: 4 blind + 3 already-failable + 3 unfailable-by-construction = 10 sites in this shape.** The number this criterion turns on is the **4 blind** sites, each of which FAILS when its field is removed from the schema declaration and PASSES when it is present — both directions observed per site (ledger rows `Z1-NEW` … `Z4-NEW`). The **3 already-failable** sites are re-measured and explicitly **not** claimed as repairs by this phase (row `AF`), and the **3 unfailable-by-construction** sites are recorded as such rather than counted as wins (row `NA`). That the blind four could not fail was the whole of F13.
  4. The set of `(collection, sentinel)` pairs the type system permits is **derived from what `linkJoinTables` actually resolves**, not maintained in parallel with it: adding a sentinel to the types without handling it in the pipeline fails a test.
  5. **`default`, `e2e/base` and every `e2e/perm/*` template** typecheck and seed under the new types. (**Template list corrected 2026-08-23.** The original list named a template file that has not existed since Phase 93: `d783e81fc`, 2026-06-03, moved it under `e2e/base` and retired the old `e2e.ts` alongside it. The retired identifier is deliberately not repeated here — it is quoted in full, with that commit's verbatim subject, in `144-NEGATIVE-CONTROL-LEDGER.md` § Record targets under **R-1**, so the stale name survives exactly once, in the record that explains why it is stale.) The fallout is an **empty table shipped as a discharge, not a blank section**: 30 built-in templates surveyed, 1,481 emitted rows, 11,125 key occurrences classified, **0** unknown keys, measured both before the change (ledger row `F`) and after it (row `NC`), with each command verbatim on the ledger's face. And the E2E suite is green on the `e2e/base` dataset: **135 passed / 0 failed / 0 flaky / 0 skipped / 0 did-not-run**, after `yarn db:reset` and against exactly one fresh dev server this phase started and stopped.

**Plans**: **7 plans, all 7 executed** — waves 1 / 2 / 3 / 4 / 5 / 6, with `144-03 ∥ 144-05` the only parallel pair (disjoint file sets). Wave 1 writes **zero product bytes**: the milestone's standing acceptance rule (`REQUIREMENTS.md:7-13`), made a commit-graph property by Phase 143's SC-2, requires every OLD (blind) half measured on the untouched tree in a commit that precedes the first behaviour change — which is why this phase leads with the ledger rather than with a tracer slice.

Plans:

- [x] 144-01-PLAN.md — Open `144-NEGATIVE-CONTROL-LEDGER.md` with all 37 rows before the first measurement; measure every OLD (blind) half on the untouched tree; take the criterion-5 fallout survey and the pre-existing tsconfig-error inventory; commit the three negative-control fixtures
- [x] 144-02-PLAN.md — Land the four-source derived declaration (`permittedKeys.ts`, `linkSentinels.ts`), move the two non-column consts out of `bulkImport`, rewire `Template` to twelve named per-collection row types, widen `packages/dev-seed/tsconfig.json` and fix the errors that surfaces
- [x] 144-03-PLAN.md — Make `linkJoinTables` iterate `LINK_SENTINELS` through a pure `planLinks`, proven behaviour-preserving by a golden capture; make `attachSentinels` consume the same key set, closing two latent defects; land the hand-enumerated derivation spec
- [x] 144-04-PLAN.md — Land Pass 0 `assertKnownRowProps` on the pre-deletion `data`, plus the deny-list (`entity_type` only) and the documented non-throwing exclusion table; re-run the built-in classification first as the standing must-NOT-fire control
- [x] 144-05-PLAN.md — `.strict()` on `TemplateSchema` **and** `perEntityFragment`; validate built-in templates in `resolveTemplate`; re-derive the ASSERT-04 corpus to 4 + 1 + 1 and correct the false doc comment (R-6)
- [x] 144-06-PLAN.md — Wire `turbo run typecheck` into the root `lint:check` chain and into CI as its own named step; land the type-only `@ts-expect-error` fixture and run the gated two-run control
- [x] 144-07-PLAN.md — Seven gates green at one HEAD (E2E last, under `db:reset` + one fresh dev server); the empty-with-discharge fallout table; ledger completion with counts derived once; six record corrections; checkbox flips **after** the gates; residue todos

**Co-location rationale (ASSERT-04 here rather than in the assertion phases)**: F13 (`TemplateSchema` is not `.strict()`) is the Zod-layer statement of exactly the invariant TMPL-01 states in the type system and TMPL-02 states at runtime — three layers, one rule, one `packages/dev-seed` surface. Sequencing them into separate phases means tightening the same schema twice and paying the same fallout twice (the six "accepts field X" tests, plus whatever in-tree templates currently declare unread fields), with the second phase inheriting a half-tightened surface and an ambiguous baseline. The todo behind TMPL-01/02 already names `TemplateSchema`'s permissiveness as part of the same defect class ("loose typing + permissive runtime stripping = silent data-loss bugs"), and the sweep's own note on F13 — "budget for fallout" — is the same budget TMPL-01/02 must carry. One phase, one fallout budget.

### Phase 145: Default Seed Template Repair

**Goal**: A developer's first run (`yarn db:reset-with-data`) produces a dataset that demonstrates the product rather than an empty results page.
**Depends on**: Phase 144 (strict per-collection typing is the mechanism most likely to surface the constant-naming drift the breakage is suspected to rest on; running the repair on loose types repeats that diagnosis by hand) — ⚠ **the suspicion in this dependency rationale is itself disproved** (criterion 3): the breakage rested on an RLS-predicate asymmetry, not on naming. The dependency still earned its keep, but for a different reason than predicted: Phase 144's strict row types are what row `T1` measures the `external_id` rename against, so the rename passes the strict types on its own literals rather than around them.
**Requirements**: TMPL-03, TMPL-04
**Success Criteria** (what must be TRUE):

  1. After `yarn db:reset-with-data`, the voter results page renders a **non-empty** parties/organizations list and shows the **candidates tab** — both verified in the running app, on both sides of the fix in the same session, so the before/after is measured rather than remembered. ✅ **Discharged**, and the starting state corrected in place:
     - ⚠ **Corrected (D-01) — this criterion used to record BOTH clauses as absent pre-fix. Measured here, they were not.** The **parties list was already passing at phase start**: 8 organization cards rendered on the *pre-fix* template (ledger row `A2-PRE`, screenshot `app-before-parties.png`, header `8 parties in constituency Pirkanmaa`). Symptom 1 had been closed by `49a23512e` (2026-06-15, *"fix(119-02): reconcile default.ts docstrings + defensive hideIfMissingAnswers (UNBLK-03)"*) — **nine days after** the originating todo was filed, and long before this phase opened. This is the third consecutive phase (143, 144, 145) whose roadmap premise was overtaken by a commit, which is why the correction is a task rather than a footnote.
     - **The candidates tab was the genuinely failing half.** Pre-fix tab set, verbatim from the run log: `["Parties","Alliances"]` — no candidates tab at all, the count clause failing `Expected: 3 · Received: 2` (`A1-RED`, `app-before-tabs.png`). Post-fix: `["Candidates","Parties","Alliances"]` with **48** candidate cards (`A1-GREEN`, `app-after-tabs.png`).
     - **Both clauses are kept as assertions and both were measured on both sides.** `A2-POST` re-observed the identical **8** party cards after the fix, so the parties clause is pinned to the parties surface rather than coupled to the fix — a must-NOT-fire row that held.
     - ⚠ **The candidates half took TWO fixes, not one.** `eab07013f` (`145-04`) added `terms_of_use_accepted` and restored anon visibility, but the after half **VOIDED twice** until `9f12a6c94` (`145-04.1`) closed a second, independent latent defect: the synthetic answer emitter drew `number` answers 0–100 regardless of the range each question declares, leaving **294 of 327** candidate answers outside the declared `[0, 10]`, so `normalizeCoordinate` threw and the voter layout hung on `Loading…`. It was latent precisely *because* anon had previously seen zero candidates, so no candidate number answer had ever been normalized. **Any reading of this phase as "one key did all the work" is wrong** — that framing is true of the RLS defect only.
  2. A standing regression check (dev-seed unit assertion or E2E) FAILS against the pre-fix `default.ts` and PASSES against the repaired one, so "0 parties, no candidates tab" cannot silently return. The failing run against the old template is recorded. ✅ **Discharged, in two tiers and two directions.** The integration guard reads the seeded database as a genuinely-**anon** client — the first check in this repository that does — and was observed failing at `2e5262d4a` with `anon-visible candidate nominations: expected 0 to be greater than 0`, then passing at `eab07013f`, against an instrument proven byte-identical across the two halves by blob hash rather than by recollection (`P1-RED` / `P1-GREEN`). A second pair proves it asserts the **RLS boundary** and not one column's presence: with `published: false` injected *alongside* `terms_of_use_accepted`, the unchanged guard still reds while `Test 28` — the column *is* present — passes in the very same run (`P2-RED` / `P2-GREEN`). The cheap pure-I/O tier catches the same defect with no live database in 3 ms (`U1-RED` / `U1-GREEN`), and its cross-template sibling `U2` held green at both HEADs, so `e2e/base`'s two deliberately-unaccepted rows were not "fixed" away. Both role controls passed inside every red run, so no half is vacuous.
  3. The root cause is **named**, with the evidence, rather than the symptom being fixed by trial. ✅ **Discharged.** ⚠ **All three root causes this criterion originally suggested are corrected in place — each one disproved by a measurement, not by an argument:**
     - *organizations/nominations not seeded* — **disproved**: the pre-fix template seeds **8** organizations and **377** nominations, read back by query (ledger row `S1`) and visible in the running app as 8 party cards (`A2-PRE`).
     - *`app_settings.results.sections` missing an entity type* — **disproved**: the seeded results sections **do** contain the `candidate` entity type. The tab was missing because `get_nominations` drops entity-less rows, so an RLS-invisible entity type presents as a **MISSING tab** rather than as an empty list — the anon key set was `["alliance","organization"]` with `candidate` absent entirely, not `candidate: 0` (`D1-ANON-PRE`).
     - *the constant-naming drift* — **disproved**: the constants were measured **already consistent** UPPER_SNAKE in both templates (D-05 / M-12). What genuinely diverged was the `external_id` idiom, and only in **two** typecodes — that is TMPL-04's corrected scope and `145-06`'s subject, not this criterion's answer.
     - **The cause actually named:** an **RLS-predicate asymmetry that the seed pipeline's `PUBLISHABLE_TABLES` auto-default silently fails to cover.** The auto-default stamps `published = true`, but anon SELECT on `candidates` is a three-clause predicate — `published = true AND terms_of_use_accepted IS NOT NULL AND terms_of_use_accepted < now()` — so every seeded candidate satisfied **1 of 3** and was invisible to the role the voter app actually uses. A `dev-seed` defect, **not** a schema or RLS defect: the policy is correct and `e2e/base` satisfies it. Held in `145-NEGATIVE-CONTROL-LEDGER.md` § Root cause, named (criterion 3), resting on the four same-session diagnostics `D1-ANON-PRE` / `D2-SVC-PRE` / `D3-COL-PRE` / `D4-CTRL-PRE`, and carried into the repository itself as the rewritten `PUBLISHABLE_TABLES` rationale block.
  4. `default.ts`'s constants follow the `e2e/base` conventions with any deliberate divergence documented, and the file typechecks under Phase 144's strict row types with no `any` or cast escapes. ✅ **Discharged at the scope measurement narrowed it to.** The *constants* were already consistent (see criterion 3); the divergence was in the **`external_id` idiom**, and only in **two** typecodes of seven hand-authored collections — 5 constituency and 8 organization identifiers, which now carry the typecodes their own generators emit, read from `ConstituenciesGenerator.ts:65` and `OrganizationsGenerator.ts:47` rather than chosen. **52** occurrences of the retired families (36 organization + 16 constituency) went to **0** across the whole package, code and prose alike, with zero references outside it. The rename shipped atomically with `ALLIANCE_MEMBERSHIP` — the one lookup in the package that keys by identifier *value* — so no tree ever existed in which alliances seeded with zero members. Row `T1`: `TURBO_FORCE=true npx turbo run typecheck` exit **0** with `cache bypass, force executing` (an execution, not a replay), and `default.ts` carries **0** `as unknown as`, **0** `@ts-ignore`/`@ts-expect-error` and **0** occurrences of the word `any` at all. The four deliberate divergences from `e2e/base` are written in `default.ts`'s own `## external_id idiom` header block, quoting no retired value. The rename's one durability risk — `external_id` is a durable upsert key — is a **measured** fact, not an inference: the strand was produced on purpose (16 organizations / 10 constituencies, split 8+8 and 5+5) and then shown fully cleared by the prefix-keyed teardown, 0 rows of *either* idiom (`S1`…`S4`).

**Plans**: 9/9 plans executed (01 ledger + blind halves · 02 tracer: the anon guard, RED · 03 app-level probe + criterion-1 before half · 04 the fix + pair-1 GREEN · 04.1 the latent number-range defect · 05 criterion-1 after half + pair-2 discrimination · 06 `external_id` rename · 07 strand proof · 08 record corrections + the standing seven gates)

**Evidence:** `.planning/phases/145-default-seed-template-repair/145-NEGATIVE-CONTROL-LEDGER.md` — **30 rows · 0 placeholder cells · 0 borrowed observations · 0 cache replays admitted as evidence · 4 measured pairs · 3 must-NOT-fire rows (all held) · 1 deferred row (`CI1`, runner half unobserved)**. All seven standing gates green at one HEAD `8372d0dff`, the cardinal E2E gate last and after a database reset: **135 passed · 0 failed · 0 flaky · 0 skipped · 0 did-not-run**.

**Unplanned insertion (wave 4.1)**

- [x] 145-04.1-PLAN.md — The latent number-range defect: the synthetic answer emitter drew `number` answers 0–100 regardless of the question's declared range, putting 294/327 candidate answers outside `[0, 10]` and hanging the voter results layout. Latent until `145-04` made candidates anon-visible at all (wave 4.1)

**Wave 1**

- [x] 145-01-PLAN.md — Negative-control ledger (30 rows) + the blindness half + the four criterion-3 diagnostic rows, on the untouched tree (wave 1)

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 145-02-PLAN.md — TRACER: the anon-client regression guard end to end (CI key export → anon client → role control → `get_nominations`), observed RED, plus the pure-I/O tier (wave 2)

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 145-03-PLAN.md — `defaultTemplateResults.probe.spec.ts` under `_probes` + criterion 1's before half: candidates tab absent, parties list already populated (wave 3)

**Wave 4** *(blocked on Wave 3 completion)*

- [x] 145-04-PLAN.md — The fix: `terms_of_use_accepted` on every seeded candidate, plus the `PUBLISHABLE_TABLES` comment correction; pair 1 closes GREEN (wave 4)

**Wave 5** *(blocked on Wave 4 completion)*

- [x] 145-05-PLAN.md — Criterion 1's after half + pair 2: the guard reds on column-present-but-anon-invisible candidates, restored and proven (wave 5)

**Wave 6** *(blocked on Wave 5 completion)*

- [x] 145-06-PLAN.md — TMPL-04: adopt the generator typecodes for the two diverging collections + document the deliberate divergence from `e2e/base` (wave 6)

**Wave 7** *(blocked on Wave 6 completion)*

- [x] 145-07-PLAN.md — Four-step strand proof that the rename cannot orphan rows, plus the post-rename app-level regression check (wave 7)

**Wave 8** *(blocked on Wave 7 completion)*

- [x] 145-08-PLAN.md — The standing seven gates at one HEAD (E2E last), record corrections to ROADMAP/REQUIREMENTS/todo, and the ledger close (wave 8)

### Phase 146: Visual Gate — Self-Hosted Inter, Height-Independent Sensitivity, Re-baseline

**Goal**: The visual job is a component-level guard on **every** baseline, and it needs nothing from the public internet to say so.
**Depends on**: Phase 137
**Requirements**: VGATE-01, VGATE-02, VGATE-03, VGATE-04, VGATE-05, VGATE-06
**Success Criteria** (what must be TRUE):

  1. Per-baseline **run-to-run noise is measured** in `mcr.microsoft.com/playwright:v1.58.2-noble`, `--platform linux/amd64` (repeat captures per baseline, count recorded) and the numbers are committed, so the threshold can be re-derived rather than re-guessed. The chosen mechanism — absolute `maxDiffPixels` cap vs bounded/element-scoped capture — is justified in writing against those measurements, not picked first and rationalised after.
  2. The v2.14-measured regression (`MatchScore.svelte:30`, `text-lg` → `text-2xl`) **FAILS `voter-results-desktop`** under the new mechanism — the 1280×3684 baseline that previously passed it — and still fails `voter-results-mobile`. The same injection is re-run against the old configuration in the same container to re-observe the miss: the blindness half of the control. ⚠ **Magnitudes CORRECTED 2026-08-26 by `146-09`:** the criterion read *"~19,500 diff px … at 0.41% of budget"*. Against current baselines the same provably-identical injection measures **4,783 px desktop / 4,835 px mobile** — **10.1 % / 29.9 %** of the respective old ratio budgets — and *0.41 %* was a units error for the ratio 0.414 (19,500 of a 47,155 px budget is **41.4 %**). **The old configuration was blind on BOTH voter baselines, not only the tall one**; mobile's historic red was carried by tie-permutation churn, not by the gate's sensitivity. A sharper indictment than the phase originally claimed.
  3. Growing a captured page's height does not raise that baseline's own tolerance: the same absolute injected damage fails on both a short and a deliberately lengthened capture of the same route.
  4. The `e2e-visual` project completes **green in-container with egress to `fonts.googleapis.com` blocked**, and a production build's network trace shows zero requests to any third-party font host. The block is applied to the runner, not simulated by a stubbed fetch.
  5. Baselines are re-captured in the CI-matching container with the dev server bound `--host 0.0.0.0` (never on a developer Mac) and the full visual project passes across **≥3 consecutive runs** there; the run-4 anomaly carried at v2.14 close (1 unexplained failure in 5 clean runs) is either explained or re-observed and recorded rather than assumed gone.

**Plans**: 9/9 plans executed, strictly serial (waves 1–9, one plan per wave)

**Ordering note — ledger-first, overriding tracer-first.** Plans 01–03 write **zero product bytes**. The milestone's standing acceptance rule (`REQUIREMENTS.md:9-13`) and criterion 2's *"re-run against the old configuration … to re-observe the miss"* both require the blindness half to be measured on the untouched tree, in a commit that precedes the one that changes behaviour — which a tracer slice would make impossible. `146-04` is the first product byte. No wave is parallel: research established that the cap and the font both feed the same re-baseline, and the font delta must be measured against the cap already in force, or *"did the pixels move?"* and *"did the verdict move?"* are confounded.

Plans:

- [x] 146-01-PLAN.md — `tests/scripts/tcp-forward.mjs` + `visual-container.sh`, and both ledgers opened with 29 rows and 40 matrix cells pre-written (wave 1, zero product bytes)
- [x] 146-02-PLAN.md — Host stack up; D-14 identical-path mount verified by observation; D-11 egress block proven live at curl and Chromium level (wave 2, zero product bytes)
- [x] 146-03-PLAN.md — The blindness half re-observed (`B1-OLD`/`B2-OLD`), the 40-cell noise matrix measured, and the cap derived in the open (wave 3, zero product bytes) — **complete**. Tasks 2–3 were re-run on 2026-08-26 after `53002b6a9` + `dbb704bd4` fixed the tie-order churn the first matrix had measured; the re-measured matrix reads **0 in all 40 cells** and D-05 completes via its floor branch at **`cap = 200`**. One run voided by a recurrence of the run-4-shaped `voter-journey.fixture.ts:336` timeout (**OPEN** — second sighting, relevant to criterion 5 / D-16) and replaced.
- [x] 146-04-PLAN.md — The cap lands in `playwright.config.ts`; the catch half (`C1-NEW`/`C2-NEW`); the D-06 height-independence control (wave 4)
- [x] 146-05-PLAN.md — Self-hosted Inter: 4 woff2 + `inter.css` + `OFL.txt` + provenance README, the `font.url` default, and the `guardThirdPartyFonts` request guard (wave 5)
- [x] 146-06-PLAN.md — The variable→static font-delta measurement (no `-u`, before the re-baseline), and the bogus-path control that closes the `settleFonts` blindness (wave 6) — **complete**. The delta is **0 px** on both `candidate-preview` baselines (research’s falsification criterion, not met), so D-09 A’s neutrality claim survives measurement; the voter pair’s 11,615 / 11,601 px is the stale tie permutation, not the font. `146-05`’s 856 px reading is corrected: it decodes to one 48×48 portrait tile. A 404 `font.url` now fails **by name** while `settleFonts` passes — N-2 closed in both directions.
- [x] 146-07-PLAN.md — Re-baseline with `--update-snapshots=all` behind the egress block, `G0-CLEAN`, the D-16 anomaly attempts, and the production-build request trace (wave 7) — **complete**. All four baselines re-captured with the two font hosts blackholed (the `curl` control failed first, `exit=7`) and behind a two-part pre-write gate (`guardThirdPartyFonts` green ×48; `document.fonts.size = 4`); dimensions unchanged; `G0-CLEAN` green from a **non-updating** run with `git status --short tests/tests/specs/visual/` empty afterwards. The re-baseline absorbs the **stale tie permutation**, **not** a font change — N-1 resolved in the negative in `146-06`. ⚠ **D-16 was RE-SCOPED, not executed:** the run-4 anomaly is root-caused (dropped SYNs on the container egress, fixed in `4066c2f41` + `351981b4f`) and the HMR hypothesis it was chartered around is falsified, so the three rows became a regression check on the landed fix — 33 dropped SYNs, 33 absorbed, 0 given up, worst request 3,036 ms against an 8,000 ms bound, with a paired host-direct control. `PT1-PRODTRACE` records 477 requests across exactly **two** hosts and **zero third-party font requests observed**. Added on operator direction: the voter captures are now **byte-stable** (12/12 runs, both interaction paths sampled) after a test-only focus-convergence fix; the product's NAVA11Y-02 focus reset was left alone.
- [x] 146-08-PLAN.md — The gates: egress-blocked green run, 5 strict + 1 CI-literal determinism runs, preflight-untouched and compared-not-re-recorded proofs, full suite (wave 8) — **complete**. **VGATE-04:** the `curl` control failed first (`exit=7`, 4 s before the suite, same container, proven by timestamp) and the full visual project then ran **7/7 green, exit 0** behind both font hosts blackholed at the runner by `--add-host`; `guardThirdPartyFonts` green ×4 with `/fonts/inter.css` **present and 200**. **VGATE-06:** five consecutive runs at `--workers=1 --retries=0` (stricter than CI's 3) plus one at CI's **literal** invocation (`CI=true`, `--grep "@visual"`, no `--project=`, `workers` 1 / `retries` 3 read back from `results.json`) — **6/6 green, 42/42 tests, 0 unexpected, 0 flaky, 0 retries consumed**. Run 4's +23 s excursion was **diagnosed, not annotated**: decomposed from its own trace to context teardown (15,501 ms vs 1,175 ms) with `re-dialled=0` ruling out the SYN defect. ⚠ The sweep saw **0 dropped SYNs in ≈1,134 connections** (vs `146-07`'s 33/2,239), so it is **no new evidence** about the absorb path. Structural rows hold: `PF1-UNTOUCHED` (phase-range `git diff` exit 0 **and** both blobs equal to `146-01`'s restoration values) and `SS1-EMPTY` (visual specs porcelain-clean, four baseline blobs unmoved, no `--update-snapshots` in any of the eight runs). Cardinal gate **135 passed / 0 failed / 0 skipped / 0 flaky / 0 did-not-run**; the count was re-derived and the move from the recorded 134 traced to **Phase 138**, not to this phase. Register closed: **29 rows, 0 placeholder cells**. ⚠ Carried to `146-09`: **VGATE-05's woff2 criterion (2 of 4 fetched is correct browser behaviour) and its 307/303 route-scope caveat are wrong as written**, and so is this plan's own bare-`pending` placeholder check.
- [x] 146-09-PLAN.md — Records last, after the gates were green (wave 9) — **complete**. The plan chartered **five** stale claims and **three** todos; the phase had falsified more than that, so **thirteen** record corrections are written to `146-NEGATIVE-CONTROL.md` § *Record corrections* and **seven** todos are filed under `.planning/todos/pending/2026-08-26-146-*.md`. The four D-18 items and the fifth — `settleFonts`' docblock claim, which was **never true at any point in the function's life** and is named explicitly as a **premise** correction, not a decision change — are corrected in `tests/README.md`, `.github/workflows/main.yaml` and `visual-regression.spec.ts`'s two docblocks, comment lines only, `settleFonts`' body byte-identical. Eight further corrections come from execution: **N-1 resolved in the NEGATIVE** (the variable→static font delta is **0 px**, not the 856 an intermediate session read — that decoded to one 48×48 portrait tile and masking took it to 0, so **D-09 A's neutrality claim survives measurement**); **the old configuration was blind on BOTH voter baselines**; **D-16 obsolete and re-scoped**; **VGATE-05's two wrong criteria**; **`146-08`'s own over-broad `\bpending\b` check**; **D-146-DEF-1 refuted** (the seed is deterministic — the real variance was a 291×17 focus-state band scoring **0 px** at `threshold: 0.2`, fixed test-only in `2df2d0b28`); and **VGATE-01's own magnitudes**. All six VGATE requirements ticked, with VGATE-01/04/05's wording corrected **before** their status was decided.

**Delivered.** An **absolute `maxDiffPixels` cap of 200**, combined with the existing ratio budget by `Math.min` so the tighter of the two always binds — chosen from a **40-cell measured noise matrix** that reads **0 in all 40 cells**, with D-05 completing via its floor branch and the derivation committed as a comment in `tests/playwright.config.ts` rather than left in a plan. The standing acceptance rule is discharged in **four halves, all measured inside this phase** on a tree that still carried the old configuration: `B1-OLD`/`B2-OLD` (the blindness — the injection passing at 10.1 % and 29.9 % of the old budgets) → `C1-NEW`/`C2-NEW` (the catch — **23.9× / 24.2×** the cap), with the injected blob proven byte-identical across both halves. Height-independence is settled by `H0-GROWTH`/`H1-SHORT`/`H2-LONG`: +2,000 px of inert filler grows the ratio budget **+54.2 % for zero content**, and a calibrated 59,507 px damage flips **FAIL → pass** under ratio-only while staying FAIL under the cap. Inter is now **self-hosted** — four woff2 files, `inter.css`, `OFL.txt` and a provenance README under `apps/frontend/static/fonts/`, with the `font.url` default in `staticSettings.ts` and a permanent in-spec `guardThirdPartyFonts`; the **measured font delta is 0 px** on both `candidate-preview` baselines, so the re-baseline absorbs the stale tie permutation and **not** a font change. The gates: the `curl` control failing first at `exit=7` and the visual project **7/7 green** behind both font hosts blackholed at the runner; **six** determinism runs — five stricter than CI at `--workers=1 --retries=0`, one at CI's literal invocation — **6/6 green, 42/42 tests, 0 unexpected, 0 flaky, 0 retries consumed**; and the cardinal suite at **135 passed / 0 failed / 0 skipped / 0 flaky / 0 did-not-run**. The register closed at **29 rows, 0 placeholder cells**.

**⚠ D-16 was RE-SCOPED, not executed — and its two limits stand unsoftened.** The *run-4 anomaly* is no longer unexplained: the container's outbound TCP SYN to `host.docker.internal` is intermittently dropped and then waits out Linux's exponential retransmission backoff (**35,634–68,369 ms** on the connect leg), because `tcp-forward.mjs` dialled once with no deadline. Fixed in `4066c2f41` + `351981b4f`; the Vite-HMR hypothesis D-16 was chartered around is **falsified**, so `146-07` converted the three rows into a regression check on the landed fix. **(1) The original end-to-end symptom was NEVER reproduced post-fix** — the chain from *"the stall is bounded to ≤ 4 s"* to *"the fixture no longer fails"* is **mechanical, not demonstrated**. **(2) CI is a different environment that does not use this relay at all, and none of this local evidence transfers to it** — `D17-CI` reproduced CI's **invocation**, never CI's **environment**, and no run in this phase was taken on a GitHub runner. The v2.14 linkage itself remains **INFERRED**: the old record never captured which test failed. ⚠ And `146-08`'s six runs are **no new evidence about the SYN fix** — they logged **0 dropped SYNs in ≈1,134 connections**, so the absorb path was never exercised. Recorded as *"did not recur"*, never as *"gone"*.

**Known remaining — the boundary of this phase's headline.** *Self-hosted Inter covers the **VAA frontend**, not the repository.* `apps/docs/src/app.html:9-11` still carries its own hardcoded `<link>` to `fonts.googleapis.com`, out of scope by D-13, threat `T-146-06` disposition **accept**, todo filed. `cloud.umami.is` analytics references remain in the production build — not a font host, outside criterion 4 as written, `analytics.trackEvents` is `false`, threat `T-146-07` disposition **accept**. Also filed rather than absorbed: the 15 dead `font-medium`/`font-semibold` classes (a type-scale design decision, D-09); `CLAUDE.md`'s stale ESM/CommonJS claim (N-7); `e2e/base`'s `externalIdPrefix: ''` portrait-rotation fragility; Docker Desktop's unfixed container-egress SYN drops, whose rate **moves** (0.786 % → 1.47 % → 0 %) and which still expose any non-relayed container path; and `selectElection.ts`'s non-deterministic landing election, which `2df2d0b28` stabilised at the **capture** but not at the **walk**. Seven todos, all under `.planning/todos/pending/2026-08-26-146-*.md`.

**Single-phase rationale**: VGATE-01/02/03 and VGATE-04/05 both require baselines to be re-captured in the CI-matching container, and the re-baseline is the expensive step. Landing them together costs one; landing them apart costs two and leaves an intermediate state whose baselines match neither the old nor the final rendering. VGATE-06 *is* that single re-baseline plus its consecutive-run proof, so it belongs to the same phase by construction. Both source todos state this pairing explicitly.

### Phase 147: Candidate-App Scan Reach — Blocking Axe + Raw-Key Gate

**Goal**: The scanners reach the candidate app, the raw-i18n-key guarantee becomes true for the application as a whole rather than for voter surfaces only, and the candidate routes join the blocking axe family.
**Depends on**: Phase 137
**Requirements**: CSCAN-01, CSCAN-02, CSCAN-03, CSCAN-04

> **⚠ RE-SCOPED 2026-08-27 — criteria rewritten against measurement.** The pre-planning scout
> (`147-SCOUT-INVENTORY.md`, commit `315d6d721`) ran the real axe scan this entry was written to
> produce: the same WCAG 2.1 AA configuration the voter gate uses, both themes, 3 runs per theme,
> **42 scans over 7 candidate surfaces → 0 violation rules, 0 violation nodes, 0 run-to-run
> variance**, with five negative controls proving the scan is live rather than vacuous. That result
> falsified four of the five original criteria and emptied **Phase 148** entirely, so 148 is
> **absorbed here** and CSCAN-02 moves with it. The superseded text is preserved below.

**Success Criteria** (what must be TRUE):

  1. The axe route family reaches the candidate `(protected)` routes in both themes, proven by content that exists only post-login appearing in the scan's own output — not by the fixture reporting success. The scanned route list is recorded. **The `auth-setup` fixture already works; the deliverable is the `PLAYWRIGHT_VISUAL` ungating and the project-dependency ordering it forces, not a new fixture.**
  2. The candidate routes are wired into the **blocking** axe family and report **zero** violations across both themes. Because the pre-scan inventory was already zero, a passing gate proves nothing on its own: **re-introducing a defect must make the gate FAIL naming the rule and selector**, and that control is the criterion's evidence — not the green.
  3. Injecting a catalog miss at `candidateApp.questions.editAnswer` and at `common.required` makes the candidate scan FAIL naming the raw key — and the same injection PASSES today at `candidate-journey.spec.ts:924` (`toHaveText(/edit/i)`) and `candidateProfilePage.fixture.ts:179` (`expect.soft(...).toContainText(/required/i)`). The two-run control is run at both named sites. Patching those two matchers in place does **not** satisfy this: the route-family extension is the fix.
  4. The REAL-04 overstatement recorded at v2.14 close is retired in the record as a **wording** correction. The 598 figure was never voter-only: `loadCatalogKeys()` already flattens every `*.json`, and the union decomposes as **161 `candidateApp` + 121 `adminApp` + 316 voter/shared = 598**. Nothing is recomputed; the claim is corrected to say what it always counted.
  5. `assertNoRawI18nKeys` reports independently of the axe assertion, so raw-key coverage is not hostage to an a11y failure. **This is a reporting property, not an execution one** — the two already run in order (`a11y-smoke.spec.ts:471` before `:473`); what they share is a single `test()` body.
  6. The candidate scan configuration is identical in strictness to the voter app's (same rule set, both themes, comparable route depth); any divergence is recorded with its reason.
  7. Full E2E suite green with the candidate scans blocking, to the project's determinism standard, with the Phase-137 preflight satisfied on each run.

**Plans**: 5 plans, strictly serial (waves 1–5, one plan per wave)

**Ordering note — controls first, then the mechanism, then bytes, then gates, then records.** Because the pre-planning scout measured the candidate surfaces at **0 violations across 42 scans**, a green gate is the least informative possible result: it is exactly what a gate pointed at nothing would produce. So `147-01` takes both blindness halves on the untouched tree and writes **zero surviving bytes**; `147-02` settles the two deferred mechanism questions by measurement and also writes zero surviving bytes; `147-03` is the phase's first product/test byte. No wave is parallel — every plan runs the E2E suite against one shared database and one dev server, so two plans cannot be in flight at once regardless of file overlap.

Plans:

- [x] 147-01-PLAN.md — Register opened at 13 rows; both blindness halves measured on the untouched tree (`RK1-OLD`/`RK2-OLD` — the two named matchers pass with their keys rendering raw; `AX1-OLD` — the full suite green with a real WCAG violation live on seven candidate surfaces) (wave 1, zero surviving bytes)
- [x] 147-02-PLAN.md — The two deferred mechanisms measured and decided in `147-ORDERING.md`: the project-ordering wiring (derivation validated against the real run's phase assignment, four-plus wirings scored against the `app_settings` REPLACE and the `test-` pre-clear) and criterion 5's reporting mechanism, costed from measured durations (wave 2, zero surviving bytes)
- [x] 147-03-PLAN.md — The extension: one shared scan core both halves import, the seven-entry candidate route table in its own spec with all three measured hazards designed out, the wiring from Decision (A), and the four in-code records corrected (wave 3)
- [x] 147-04-PLAN.md — The catch halves (`AX1-NEW` naming rule and selector; `RK1-NEW`/`RK2-NEW` naming the key while the two matchers pass in the same run), then the gates: full suite plus three consecutive determinism runs and the phase-wide integrity proofs (wave 4)
- [x] 147-05-PLAN.md — Records last, after the gates were green: the REAL-04 wording retirement, the drifted citations in three files, CSCAN-01..04 ticked against register rows, and the unscanned states filed as todos rather than absorbed (wave 5)

**Hazards the plan inherits** (measured by the scout, not assumed):

  - Ungating `auth-setup` from `PLAYWRIGHT_VISUAL` and adding it to `a11y-smoke`'s dependencies **moves `a11y-smoke` into a later Playwright phase**, adjacent to the perm chain's `app_settings` singleton REPLACE — the hazard `playwright.config.ts:496-518` documents having been got wrong twice. Per the standing scout-first rule, the ordering mechanism is deferred to research rather than locked at planning.
  - `candidate-preview-container` is a **fake settle**: it resolves while `<Loading>` is still inside it. Anchor on the rendered `EntityDetails`.
  - The nav drawer **cannot be opened by a bare click** (documented SSR→hydration race, `navMenu.fixture.ts:66-79`); go through `createNavMenu().openMobileNav()`.
  - The 72 `incomplete` `color-contrast` nodes on `.uc-first` button labels are **not** a candidate finding — voter-home produces 3 and voter-elections 1 at zero violations. Standing posture applies to both halves.
  - Cost of the extension, measured: **+14 tests, ≈+22 s**. One importer repo-wide (`a11y-smoke.spec.ts:69`); lint needs no change. **Ten records go stale** — enumerated with line numbers in the scout inventory.

<details>
<summary>Superseded criteria and split rationale (pre-2026-08-27)</summary>

The original entry split this work across Phases 147 and 148 on the rationale that
`assertNoRawI18nKeys` rides inside `assertAxeScan`, so extending `AXE_ROUTES` would land both
assertions at once, and that since the candidate surfaces had never been axe-scanned *"that single
commit would very likely land the suite red, which the cardinal rule forbids"*.

**Measured false.** It lands green. Phase 148's remediation scope is empty, and 147's split has no
red to prevent. The original criterion 4 also asserted a *"voter-only 598"* key-union figure that
required recomputation to include the candidate catalog; the 598 already included it. The original
criterion 2 treated the scanner decoupling as an execution-order fix; it is a reporting concern.

Phase 148's surviving contribution — the re-introduce-a-defect control proving the gate is what
turned green — is preserved as criterion 2 above.

</details>

### Phase 151: Ship v0.2 Akita — Review Stack & Commit-History Restructure

**Status**: Executed 2026-08-16 → 2026-08-18 — 19 plans, 17 waves. **Operator-approved at phase close
on 2026-08-18, on reproduction rather than on reading.** All seven success criteria discharged, each
mapped to a re-runnable command in `151-DISPOSITION.md` § Criterion evidence map. Twelve slices, twelve
PRs (#863–#874) with #860 as the umbrella entry point; the stack reconstructs the branch **byte for
byte** (`changed files: 0`, both trees `b606ed169`, closing slice-11 commit `14afb2d80`). Full E2E
suite **135 passed / 0 failed / 0 skipped / 0 did-not-run** after a fix at source rather than a waiver.
**Four gate-massages were available and all four were declined.** Open follow-ups, all post-merge:
**F-89** (fix named), F-81, F-86, two `gsd-tools` defects, the dev-seed locality guard, and F-21
option (a) with F-29 riding its migration. The backup worktree at `fe91f3099` is retained **for the
duration of the review**, which outlasts this phase — do not remove it.

**Goal:** Take the v0.2 "Akita" body of work from its reiterative development history to a
reviewable, shippable state: sweep the whole diff against the Code Review Checklist and the Code
Style Guide, bring in-file comments to hygiene (self-explanatory code first; no references to
planning artifacts or historical changes beyond a short "see phase N" where imperative), restructure
the commit history into reviewable groupings, and produce a review-only stack of PRs off
`origin/main`.

Source: `ROADMAP.md` § "Addendum 1: Shipping v0.2 Akita" (repo root, not this file).

**Requirements**: none mapped — the seven success criteria below serve as the requirement set, and
each plan's `requirements` field cites the criteria it serves (`criterion-1` … `criterion-7`).
**Depends on:** Phase 164 (renumbered from Phase 150 on 2026-08-28). Recorded for the history:
Phase 151 in fact executed and closed **ahead of** that phase, which remains unstarted.

**Success Criteria** (what must be TRUE):

  1. Every condition in `/.agents/code-review-checklist.md` is addressed across the v0.2 diff, with
     each item's disposition recorded (met / fixed / deliberately deferred + why) rather than assumed.

  2. The diff adheres to the Code Style Guide
     (`docs/src/routes/(content)/developers-guide/contributing/code-style-guide/+page.md`).

  3. Comment hygiene holds: no in-file comment narrates changes for the reviewer or points at
     planning artifacts or codebase history, except short pointers of the form "see phase 55 /
     spike 66". Any `[PR review]`-tagged comments are removed before the stack is opened.

  4. The commit history is restructured so that: all planning items are one commit; all other
     documentation is one commit; all tests are one commit; feature/fix commits touching the same
     files or features are squashed such that the PR contains no fixes of itself — only the final
     outcome; purely-formatting changes are collected into one commit as far as possible; and every
     commit containing migrations or other database changes carries a `[db]` tag.

  5. The original reiterative history survives in a backup worktree for the duration of the review.
  6. A review-only PR stack exists — first PR targeting `origin/main`, the rest stacked on each
     other — split so that PRs touching the same files are minimised and each PR holds changes of a
     similar nature. Individual PRs need not build or pass tests; only the whole matters.

  7. The stack's final state is byte-identical to the original branch's final state, demonstrated,
     so the stack need not be merged.

**Notes:**

  - Continuation branch `feat-v02-akita-continued` was created at `315b9795e` so a parallel session
     can continue feature work while this review/ship work proceeds.

  - Milestone/phase boundaries are a starting point for the PR split, but merge or split them where
     a reviewer would otherwise read changes that a later commit undoes, or a partial version of a
     feature that was later reworked.

**Plans:** 19/19 plans complete
throwaway refs before any sweep, slice or PR exists. Slice work is serialised bottom-up per D-07.

Plans:
**Wave 1**

- [x] 151-01-PLAN.md — TRACER: end-to-end stack pipeline proof on throwaway refs (wave 1)

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 151-02-PLAN.md — Wave-0 verification and report tooling: taxonomy, hygiene grep, overlap matrix (wave 2)
- [x] 151-03-PLAN.md — Backup worktree pin (criterion 5) and lint/format/unit/hygiene baselines (wave 2)
- [x] 151-04-PLAN.md — Re-measure every gate's reach, slice anatomy, and the pre-seeded findings (wave 2)

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 151-05-PLAN.md — Slice partition, stack manifest, and the split's human-verify checkpoint (wave 3)

**Wave 4** *(blocked on Wave 3 completion)*

- [x] 151-06-PLAN.md — Merge-target integration commit, disposition scaffold, E2E escape hatch (wave 4)

**Wave 5** *(blocked on Wave 4 completion)*

- [x] 151-07-PLAN.md — Comment hygiene stage 1: the codemod (wave 5)

**Wave 6** *(blocked on Wave 5 completion)*

- [x] 151-08-PLAN.md — Comment hygiene stage 2: agent residue and the hygiene report (wave 6)

**Wave 7** *(blocked on Wave 6 completion)*

- [x] 151-09-PLAN.md — Sweep and cut slices 01a, 01b, 02 (wave 7)

**Wave 8** *(blocked on Wave 7 completion)*

- [x] 151-10-PLAN.md — Open the stack: publish consent, PR #860 decision, PRs 01a and 01b (wave 8)

**Wave 9** *(blocked on Wave 8 completion)*

- [x] 151-11-PLAN.md — Sweep and cut slice 03, the database slice; open PR 02 (wave 9)

**Wave 10** *(blocked on Wave 9 completion)*

- [x] 151-12-PLAN.md — Sweep and cut slice 04, dev-seed; open PR 03 (wave 10)

**Wave 11** *(blocked on Wave 10 completion)*

- [x] 151-13-PLAN.md — Sweep and cut slice 05, the E2E suite; open PR 04 (wave 11)

**Wave 12** *(blocked on Wave 11 completion)*

- [x] 151-14-PLAN.md — Sweep and cut slice 06, the frontend library; open PR 05 (wave 12)

**Wave 13** *(blocked on Wave 12 completion)*

- [x] 151-15-PLAN.md — Sweep and cut slices 07 and 08, routes and messages; open PRs 06 and 07 (wave 13)

**Wave 14** *(blocked on Wave 13 completion)*

- [x] 151-16-PLAN.md — Sweep and cut slices 09 and 10, docs and root config; open PRs 08 and 09 (wave 14)

**Wave 15** *(blocked on Wave 14 completion)*

- [x] 151-17-PLAN.md — Slice 11, the planning slice, plus its secret scan; open PR 10 (wave 15)

**Wave 16** *(blocked on Wave 15 completion)*

- [x] 151-18-PLAN.md — Byte-identity proof, commit taxonomy, the D-24 suite gate, PR 11, PR #860 (wave 16)

**Wave 17** *(blocked on Wave 16 completion)*

- [x] 151-19-PLAN.md — Codify the ship procedure as a skill (D-25) and finalise every record (wave 17)

### Phase 152: Comment & Naming Hygiene Sweep

**Corrected 2026-08-28** against the measured tree (`.planning/v2.15-DISCUSSION-POINTS.md` § 0, facts 7, 8, 9): the planning-reference class is **817 comment lines**, not the 19 reviewed sites → criterion 2 restated against the real corpus; "encoded dashes" is **one** `\u2013` **JavaScript unicode escape** at `EntityCardAction.svelte:12` — not the character `–`, and not an HTML entity — so it is one instance, not a class (zero HTML entities exist repo-wide) → Goal restated; the fixture is spelled `quatenaryChoices` and the reviewer's `quartenaryChoices` is also not a word → criterion 3 renames to `quaternaryChoices`.

**Goal**: A reader of any file in this repo meets comments that explain the code in front of them, and nothing else — no forced line breaks, no history, no planning references. The "encoded dash" is a single instance, not a class: zero HTML entities exist repo-wide and the one escape (the literal six characters `\u2013` in the JSDoc at `EntityCardAction.svelte:12` — `\u2013 default: The contents to wrap.`) becomes the character itself, with the escape-in-comment pattern added to the criterion-1 scan so the class cannot open.
**Depends on**: Nothing (safe to run first; touches comments and names only)
**Requirements**: REVIEW-HYG-01..04
**Source**: 19 review comments across PRs #865, #866, #869, #870 — enumerated in `.planning/PRE-SHIP-REVIEW-TRIAGE.md`
**Success Criteria** (what must be TRUE):

  1. A repo-wide scan for forced line breaks inside multiline comment spans returns **zero** hits across `packages/**`, `apps/**` and `tests/**`, and the scan is committed as a script so the class cannot silently reopen.
  2. Every comment carrying historical narrative, a planning-artifact path, a phase or plan number, or a decision id is either rewritten to describe current behaviour or deleted. **Measured, that class is 817 comment lines** (packages 336 · apps 219 · tests 223, over a 34,063-line comment corpus) — not the 19 reviewed sites; size the sweep against 817. `apps/frontend/src/routes/(voters)/+layout.svelte` matches the reviewer's line-by-line disposition **exactly**: the prose at :36 and :59 gone, :92 reduced to one line justifying `onMount`, :109 removed, and :116 **kept** — the reviewer marked that one as earning its place.
  3. The renames land with no dangling references: `SettingsOverlay.svelte.ts` → `settingsOverlay.svelte.ts` (and its test), `EntityListWithControls.helpers.ts` → `helpers.ts`, and the fixture rename `quatenaryChoices` → **`quaternaryChoices`** at `packages/data/src/objects/questions/variants/multipleChoiceCategoricalQuestion.test.ts:11` (the reviewer asked for `quartenaryChoices`, which is also not a word — the correct spelling is *quaternary*, consistent with `binaryChoices` at `:17`). `yarn build`, `yarn test:unit` and `yarn lint:check` are green after each.
  4. A repo-wide UK/US spelling audit of **symbol names** is performed and recorded; any UK variant found is changed to US. The audit output is committed even when the answer is "none found", so the next reader does not repeat it.
  5. No comment is edited in a way that changes program behaviour: the codemod runs dry-run first, and a residue pass confirms every match it declined to touch was non-comment-shaped (a `console.warn`, a test title, an ESLint `message:`). Phase 151 measured 126 such lines — treat that as the expected order of magnitude, not as zero.

**Plans**: 15/15 plans executed

- [x] 152-01-PLAN.md
- [x] 152-02-PLAN.md
- [x] 152-03-PLAN.md
- [x] 152-04-PLAN.md
- [x] 152-05-PLAN.md
- [x] 152-06-PLAN.md
- [x] 152-07-PLAN.md
- [x] 152-08-PLAN.md
- [x] 152-09-PLAN.md
- [x] 152-10-PLAN.md
- [x] 152-11-PLAN.md
- [x] 152-12-PLAN.md
- [x] 152-13-PLAN.md
- [x] 152-14-PLAN.md
- [x] 152-15-PLAN.md

### Phase 153: Build & Tooling Config Correctness

**Corrected 2026-08-28** against the measured tree (`.planning/v2.15-DISCUSSION-POINTS.md` § 0, facts 4, 5, 6): `.claude/scripts/audit-skill-drift.sh` **exists** and is called at `main.yaml:34` → criterion 5's "add or remove" half is already discharged and is restated as the observation; **three** `tsbuildinfo` files are tracked, not one → criterion 6 widened to the measured set; and a **new** finding — `.lintstagedrc.json:2`'s glob fuses `mjssvelte`, so `.svelte` and `.mjs` are never linted or formatted on commit → added as criterion 8, alongside criterion 4 on the same two lines.

**Goal**: Every build- and tooling-level assertion the repo makes about itself is true, and the ones that were never true are fixed rather than documented.
**Depends on**: Nothing
**Requirements**: REVIEW-CFG-01..08
**Source**: 17 review comments across PRs #865, #866, #873 (chiefly Copilot) — enumerated in the triage
**Success Criteria** (what must be TRUE):

  1. All eight workspaces whose `build` script invokes `tsup` declare `tsup` in their own `devDependencies` — measured **8/8 missing** (`packages/{app-shared,argument-condensation,core,data,filters,llm,matching,question-info}`), so every one of the eight needs the declaration added. Proven by a guard that fails when a workspace invokes a binary it does not declare — not by inspection.
  2. `engine` is corrected to `engines` in the root and frontend `package.json`, and the constraint is observed to actually bind (an out-of-range Node is rejected) rather than assumed.
  3. `apps/frontend/vitest.config.ts` no longer references `__dirname` at any of its **11 measured sites** (`:18,22,25,26,27,28,32,36,40,44,48` — the roadmap previously said "9" while listing ten, and both undercounted; `grep -c __dirname` returns **11**): the package is `type: module` (`apps/frontend/package.json:59`), where it does not exist. Vitest config loading is exercised to prove it.
  4. `.lintstagedrc.json` invokes its commands directly rather than through `bash -c`, so it works where bash is absent.
  5. **The script already exists** — `.claude/scripts/audit-skill-drift.sh` is present and `.github/workflows/main.yaml:34` calls it, so the "added or removed" half of this criterion is already discharged on evidence. What remains is the observation: the `main.yaml` step is observed **running green against the existing script** on a real workflow run, so the call is proven live rather than assumed.
  6. **All three tracked `tsbuildinfo` files** — `apps/docs/tsconfig.tsbuildinfo`, `apps/frontend/tsconfig.tsbuildinfo` and `packages/supabase-types/tsconfig.tsbuildinfo` (the roadmap previously named only the last) — plus `supabase/.branches/_current_branch` are removed from version control, and `*.tsbuildinfo` is ignored globally so the class cannot reopen in a fourth workspace.
  7. `packages/shared-config/README.md` stops advertising a `^1.0.0` that does not exist, and `packages/supabase-types/src/index.ts` uses the repo's TS-internal import convention (no `.js` specifiers) consistent with `packages/README.md`.
  8. `.lintstagedrc.json:2`'s glob no longer fuses two extensions into one alternative: `*.{…,mjssvelte,…}` becomes `…,mjs,svelte,…`, so `.svelte` and `.mjs` files are linted and formatted on commit. Today they match nothing, meaning **the repo's largest file type has never been covered by pre-commit** — proven by staging a deliberately mis-formatted `.svelte` file, observing the hook pass on the current glob and reject it after. Found this session while verifying criterion 4 on the same two lines; not one of the 131 review comments. The one-off formatting churn this uncovers lands as its own commit so the gate starts from clean.

**Plans**: 11/11 plans executed

- [x] 153-01-PLAN.md
- [x] 153-02-PLAN.md
- [x] 153-03-PLAN.md
- [x] 153-04-PLAN.md
- [x] 153-05-PLAN.md
- [x] 153-06-PLAN.md
- [x] 153-07-PLAN.md
- [x] 153-08-PLAN.md
- [x] 153-09-PLAN.md
- [x] 153-10-PLAN.md
- [x] 153-11-PLAN.md

### Phase 154: dev-seed Determinism & Template Validation

**Corrected 2026-08-28** against the measured tree (`.planning/v2.15-DISCUSSION-POINTS.md` § 0, fact 11): the wall-clock drift is **exactly 2 sites, both confirmed live** — `generators/ElectionsGenerator.ts:58` (`faker.date.future`) and `emitters/answers.ts:91` (`faker.date.recent`) → criterion 1 now carries the measured file:line pair rather than bare function names.

**Corrected 2026-08-28 (second pass)** — **criteria 3 and 4 were already discharged by Phase 144** and the first correction pass missed it. Measured: `packages/dev-seed/src/cli/resolve-template.ts:84` already reads `return validateTemplate(builtIn);`, so built-in templates already traverse the same validation as filesystem ones (criterion 3); and `assertFixedRowsCarryExternalId` at `packages/dev-seed/src/template/schema.ts:194`, called unconditionally from `validateTemplate` at `:227`, already throws `template.<slot>.fixed[<i>].external_id: Expected a non-empty string` on any `fixed[]` row lacking a non-empty `external_id` (criterion 4). **Neither criterion is deleted** — a criterion retired on evidence must be visibly retired — but what remains for each is **confirmation plus the negative control**, not implementation.

**Goal**: The determinism contract dev-seed states in writing is true: the same seed yields the same dataset today, tomorrow and next year.
**Depends on**: Nothing
**Requirements**: REVIEW-SEED-01..04
**Source**: 6 review comments on PR #867 (Copilot) — enumerated in the triage
**Success Criteria** (what must be TRUE):

  1. Both measured wall-clock sites — `faker.date.future({ years: 1 })` at `packages/dev-seed/src/generators/ElectionsGenerator.ts:58` and `faker.date.recent()` at `packages/dev-seed/src/emitters/answers.ts:91`, and **there are exactly two** — are replaced by generation from a **fixed reference window**, so `election_date` and date-question answers no longer drift with wall-clock time.
  2. The determinism breach is proven to have been real before it is proven fixed: the same seed is run against a faked system clock set months apart and the outputs are observed to **differ** on the current code, then to be **identical** after the fix. A guard asserting cross-time stability is committed.
  3. **Already satisfied on the code, as of Phase 144 (D-07).** `resolveTemplate()` runs built-in templates through `validateTemplate()` — measured at `packages/dev-seed/src/cli/resolve-template.ts:84` (`return validateTemplate(builtIn);`), so built-ins and filesystem templates already behave identically and the gap the module docstring and the seed CLI both claim is closed **is** closed. **What remains** is confirmation, not implementation: a test asserting that a built-in template with an unknown key is rejected by the same `.strict()` path a filesystem template hits, so the equivalence cannot silently regress.
  4. **Already satisfied on the code, as of Phase 144.** `fixed` rows require `external_id`: `assertFixedRowsCarryExternalId` (`packages/dev-seed/src/template/schema.ts:194`, called from `validateTemplate` at `:227`) throws on any `fixed[]` row whose `external_id` is absent or empty, so the schema already rejects the row instead of emitting `"${prefix}undefined"`. **What remains** is the negative control the criterion asks for: a test showing the *pre-144* schema accepting the bad row and the current one rejecting it, committed so the guard is proven live rather than assumed.

**Plans**: 4/4 plans executed

- [x] 154-01-PLAN.md
- [x] 154-02-PLAN.md
- [x] 154-03-PLAN.md
- [x] 154-04-PLAN.md

### Phase 155: Edge Function Hardening — env, JWT, provider identity

**Corrected 2026-08-28** against the measured tree (`.planning/v2.15-DISCUSSION-POINTS.md` § 0, facts 12, 13, 14): the `atob` JWT decode is **one site per function** (`invite-candidate/index.ts:81`, `send-email/index.ts:111`), not two; the env defaults number **7**, the three named line numbers had drifted (`:168/:196/:341` → the measured **`:169/:197/:361`**) and a **seventh, unnamed** site exists at `invite-candidate/index.ts:131`; and **criterion 4 is already satisfied** — Phase 142.1 rekeyed Signicat onto `sub`, so the birthdate-matching defect it exists to close is gone.

**Goal**: No Edge Function decodes a JWT incorrectly, silently substitutes a default for missing configuration, or matches an identity on a field that is not unique.
**Depends on**: Nothing
**Requirements**: REVIEW-EDGE-01..05 (05 added 2026-08-28 by operator decision O1 — the `aud`/`iss` fail-open)
**Source**: 8 review comments on PR #866 — enumerated in the triage
**Success Criteria** (what must be TRUE):

  1. Both measured `atob` sites — `invite-candidate/index.ts:81` and `send-email/index.ts:111`, **one per function, not two** — decode JWT segments as **base64url**, not base64. A token containing `-`/`_` or lacking padding is exercised and observed to fail on the current code and succeed after — the defect is demonstrated, not asserted.
  2. Every `??`/`||` env default in the Edge Functions is removed in favour of a throw naming the missing variable. Measured, that is **7 sites, not 3**: `identity-callback/index.ts:169` (default provider), `:197` and `:361` — the roadmap previously cited `:168/:196/:341`, which had drifted — plus `send-email/index.ts:210,211,234` and, **unnamed until now, `invite-candidate/index.ts:131`** (`SITE_URL || SUPABASE_URL`, a silent wrong-host default). A repo-wide search for hard-coded ports and localhost URLs is performed and its results dispositioned.
  3. The `send-email` template substitution accepts `{{ varname }}` with surrounding spaces, matched by test.
  5. **Added by operator decision, 2026-08-28.** The `aud` / `iss` claim checks **fail closed**. The defect filed from Phase 142.1 is that both fail *open* when their env var is unset — the same class as criterion 2 (a missing variable silently weakens security), but it escapes criterion 2's `??`/`||` guard because the weakening is an unset-variable branch rather than a defaulting operator. A token with a wrong `aud` and a wrong `iss` is exercised against an unset-env configuration and observed **rejected**, not accepted. This is the highest-severity item in the phase and it is in the files the phase already opens.
  4. **Already satisfied on the code, as of Phase 142.1** — `identity-callback/claimConfig.ts:43-47` keys Signicat on `sub` (`identityMatchProp: 'sub'`) with `birthdate` demoted to an extracted claim, and the file's own docstring at `:38-40` records that the change was made *because* birthdate collides. Birthdate-based matching is already gone; the "or remove Signicat support" branch is moot and no code change is expected. **What remains** is the unverified premise: current Signicat documentation is checked to confirm `sub` is a stable per-person pseudonym (not per-session or per-client), and the finding is recorded on the record with a citation.

**Plans**: 6/6 plans executed

- [x] 155-01-PLAN.md
- [x] 155-02-PLAN.md
- [x] 155-03-PLAN.md
- [x] 155-04-PLAN.md
- [x] 155-05-PLAN.md
- [x] 155-06-PLAN.md

### Phase 156: Supabase Schema Corrections — naming, constraints, grants

**Goal**: The schema says what it means: the names are right, the constraints exist, and no role can edit a column it has no business editing.
**Depends on**: Phase 155 (shares the Edge Function surface); independent of 162, which rewrites the auth model separately
**Requirements**: REVIEW-DB-01..08
**Source**: 18 review comments on PR #866 — enumerated in the triage
**Success Criteria** (what must be TRUE):

  1. `party` is renamed to `organization` throughout enums, schema, **migrations** and dev-seed templates. Migrations and schemata are rewritten together — no backwards compatibility is owed — and `yarn db:reset-with-data` is observed working end to end afterwards.
  2. The auth-table role prefixes use an enum matching `user_role_type` rather than free strings, and `301-auth-functions.sql` uses enums in place of string comparison.
  3. `104-nominations.sql` carries the missing `>= 1` constraint, proven by an insert that the constraint rejects.
  4. The image validation at `011-validation-functions.sql:165` is extracted into an `is_image` utility with its own pgTAP coverage.
  5. `303-column-grants.sql` no longer grants `authenticated` the ability to edit `sort_order`, `created_at` or `updated_at`. A PostgREST-shaped attempt to tamper with each is observed to fail.
  6. `503-entity-rpcs.sql:147` covers **all** entities carrying answers, organizations included; `504-admin-rpcs.sql:12` is either renamed to `merge_question_custom_data` or generalised to other tables, with the choice recorded.
  7. The `name` / `short_name` conflict at `102-entities.sql:27` is resolved: the field conflicting with first/last-name-derived names is removed, `short_name` retained as the generated-initials override.
  8. The remaining record items are dispositioned rather than silently dropped: benchmark results moved to the Supabase README with the scripts archived behind a named commit, `lint-schema.mjs` evaluated for expression as pgTAP tests, the `config.toml` hard-coded ports resolved from env or documented as a caveat, the id-JSONB foreign-key linkage question answered against the three-option election-filter requirement, and the feedback IP-address encryption investigated.

**Plans**: 10/10 plans executed

- [x] 156-01-PLAN.md
- [x] 156-02-PLAN.md
- [x] 156-03-PLAN.md
- [x] 156-04-PLAN.md
- [x] 156-05-PLAN.md
- [x] 156-06-PLAN.md
- [x] 156-07-PLAN.md
- [x] 156-08-PLAN.md
- [x] 156-09-PLAN.md
- [x] 156-10-PLAN.md

### Phase 157: Adapter Boundary & Typing

**Corrected 2026-08-28** against the measured tree (`.planning/v2.15-DISCUSSION-POINTS.md` § 0, fact 18): lower-case **`withAuth` does not exist anywhere in the repo** (zero grep hits) → criterion 4 restated against the real shim, the ignored `currentPassword` / `authToken` params documented at `supabaseDataWriter.ts:82-84`. Left unrestated, a planner searches for `withAuth`, finds nothing, and marks the criterion vacuously met.

**Corrected 2026-08-28 (second pass)** — **the first pass restated criterion 4 too narrowly and wrote half the work out of the phase.** `grep -rn 'WithAuth'` (capital W) returns **41 references across 6 files**, including the exported type at `apps/frontend/src/lib/api/base/dataWriter.type.ts:345`. Criterion 4 says the shim is removed *"along with the interface shape that required it"* — **that interface shape is the `WithAuth` type**, and it is the larger half of the criterion. Both halves are restored below. Also corrected against § 0 fact 19: two of the four cast anchors in criterion 1 had drifted (`:60` is a `typeof` guard, `:361` is a comment line), and the file's path was cited without its `dataProvider/` directory segment (fact 32).

**Goal**: Data crossing the Supabase boundary is validated into its type rather than cast into it, and nothing outside the adapter knows Supabase exists.
**Depends on**: Phase 156 (RPC changes land there)
**Requirements**: REVIEW-ADP-01..06
**Source**: 14 review comments on PR #869 — enumerated in the triage
**Success Criteria** (what must be TRUE):

  1. Typed JSONB columns — `settings` first, then every other — are **validated** on read, and the typecasts at `apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts` **`:56`**, `:92`, **`:368-378`** and `:511` are gone. (The roadmap previously named `:60` and `:361`; measured, `:60` is a `typeof settings.notifications === 'object'` **guard** and `:361` is a comment line — deleting either would remove a runtime check rather than a cast. The real anchors are the `as Record<string, unknown>` at `:56` and the `as`-cast block at `:368-378`. Note the `dataProvider/` directory segment in the path, omitted until now.) A grep for casts on adapter reads returns empty.
  2. The filter-value conversion at `:245` (same file, `apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts`) is extracted into a named helper, extended to cover election-round filtering, with the RPC updated to match. Measured, `:245` is correct.
  3. A `get_questions` RPC returns categories and their questions together and supports filtering by election, constituency and election round, replacing the client-side assembly at `:499` (`_getQuestionData`, same file — measured, `:499` is correct).
  4. The auth-compatibility shim is removed **along with the interface shape that required it** — and this criterion has **two halves**, both in scope:

     **(a) The ignored parameters.** There is no symbol named lower-case `withAuth`; that half of the shim is the pair of ignored `currentPassword` / `authToken` parameters on `_setPassword`, labelled "WithAuth compatibility shims -- ignored by Supabase" at `supabaseDataWriter.ts:82-84`. Both are deleted from `_setPassword` and from the `UniversalDataWriter` abstract signature, after confirming neither name is read anywhere else.

     **(b) The interface shape — the `WithAuth` type.** `grep -rn 'WithAuth'` (capital W) returns **41 references across 6 files**: the type is defined at `apps/frontend/src/lib/api/base/dataWriter.type.ts:345` and consumed at `:79`, `:115`, `:120`, `:126`, `:132`, `:158`, `:334`, `:336`, `:338`, `:340`, `:402`, `:404`, `:406`, `:411`, `:415`, `:421` and `:423`, plus `universalDataWriter.ts`, `supabaseDataWriter.ts`, `authContext.svelte.ts`, `authContext.type.ts` and `adminContext.svelte.ts`. **This is the "interface shape that required it" the criterion names, and it is the larger half of the work** — an earlier correction pass restated criterion 4 against (a) alone, which removed (b) from the phase. `WithAuth` and every option type composed from it (`SetAnswersOptions`, `SetPropertiesOptions`, `SetQuestionOptions`, `GetCandidateUserDataOptions`, the seven admin-job option types: `GetActiveJobsOptions`, `GetPastJobsOptions`, `StartJobOptions`, `GetJobProgressOptions`, `AbortJobOptions`, `AbortAllJobsOptions`, `InsertJobResultOptions`) are removed or re-expressed without an auth-token field, since the Supabase adapter authenticates from the session and never reads one. `grep -rin 'withauth'` returns **zero** afterwards.

     The abstract-interface members flagged at `supabaseDataWriter.ts:381` are removed from both implementation and interface.

  5. `getLocalized` and its test are colocated with `packages/app-shared/src/data/localized.type.ts` and use those types; `authConfig.ts` is split so providers are not interdependent.
  6. **A source test fails when adapter specifics appear outside their allowed loci** — routes, components and lib are clean, and the allowed list is explicit rather than implied. `logDebugError` is renamed and reworked into structured, pino/OTL-conformant output. Measured scope: **47 imports · 85 call sites · 140 matching lines across 53 files**, defined at `apps/frontend/src/lib/utils/logger.ts:8` (the roadmap and § 0 previously carried a single ambiguous "82", which matched none of those counts).

**Plans**: 18/18 plans executed

**Closed 2026-08-31.** All six criteria measured green by the `157-18` gate; full E2E suite green
twice (`1f5f3247c` pre-fix, `5ef212902` post-fix — 150 passed / 0 failed / 0 skipped / 0 flaky,
exit 0); build 14/14 · lint 0 · format 0 · unit 25/25 · `svelte-check` 2697 files 0 errors ·
pgTAP 379/379. The code review of the phase's 74 changed source files returned 15 blockers; the
six needing no ruling were fixed in-phase with proven RED→GREEN round trips (`157-REVIEW-FIXES.md`),
and the remaining four classes were ruled by the operator on 2026-08-31
(`.planning/v2.15-OPERATOR-DECISIONS-2026-08-31.md`). **None of the four is charged to this
phase:** the degrade-to-empty class and the production-logger silence go to the new Phase 157.1,
the adapter-singleton concurrency class to the new Phase 157.2, and the admin-app outage — which
dates to `c3e948a84`, not to 157-11 — folds into Phase 158.

### Phase 157.1: Fail-Loudly Parse Posture + Production Logging

**Added 2026-08-31** by operator rulings D8 + D9 (`.planning/v2.15-OPERATOR-DECISIONS-2026-08-31.md`).
Not a review-comment phase: it exists because the Phase 157 review found a defect **class** in
157's own new code that widening the schemas did not retire.

**Goal**: A malformed JSONB column is distinguishable from an absent one at the adapter boundary,
and the resulting signal actually reaches production.
**Depends on**: Phase 157 (the adapter boundary and its schemas must exist before their failure
posture can be changed)
**Requirements**: Operator rulings D8, D9
**Source**: Phase 157 code review, lots A/B/C — `157-REVIEW.md`, `157-REVIEW-FIXES.md`
**Success Criteria** (what must be TRUE):

  1. A failed `safeParse` at the adapter boundary no longer degrades to an empty value. Across all
     **five** schemas and their call sites (`_getAppSettings`, `parseAnswersColumn`, `sendEmail`,
     and the two write-path sites below), the caller can distinguish *absent* from *malformed*.
     A negative control proves it: a column containing one unacceptable field is observed to
     surface as a failure rather than as an empty result, and the same input is observed to
     produce the old silent empty on the pre-phase code.
  2. `_setAnswers` can no longer return `{}` after a **successful** RPC write. The measured defect
     — `{}` passes the `if (!updatedAnswers) throw` guard, `resetAnswers()` clears the edit buffer,
     and the candidate's just-entered answers vanish while the UI reports `{ type: 'success' }` —
     is reproduced as a failing test first, then closed.
  3. One unrecognised key in `app_settings.settings` no longer discards every dynamic setting.
     `access.underMaintenance` and `access.answersLocked` survive an unknown sibling key.
  4. **The test that specifies the defect is inverted, not deleted.**
     `supabaseDataProvider.test.ts:248-270` currently puts a valid `access: { candidateApp: true }`
     in its fixture and asserts `expect(result).toEqual({})`. After this phase it asserts the
     surviving value. A deletion does not satisfy this criterion.
  5. `warn` and `error` are no longer silenced in production. `hooks.server.ts:15` and
     `hooks.client.ts:7` stop setting the level to `'silent'` unless `DEV || PUBLIC_DEBUG`, and
     `logger.ts`'s early return on silent no longer swallows them. Every "degrades with one
     warning" comment in the adapter layer is observed to be TRUE in a production-mode build —
     measured, not asserted. (A durable structured sink is explicitly **out of scope** per D9; it
     is queued to the backlog.)
  6. The class cannot silently reopen: a test fails when a schema at the adapter boundary is
     written in the degrade-to-empty shape this phase removes.

> **Correction, 2026-08-31 (planning):** criterion 1 and the phase-list entry above both say *five*
> schemas. `157.1-CONTEXT.md` § A1 resolves to **six** — the sixth is `StoredImageSchema`
> (`parseJsonbColumn.ts:55`), which has the identical shape and ten downstream call sites, measured as
> fact 1. **The "five" wording is stale; the phase delivers six.** Do not let a checker regress it.

**Plans**: 8 plans

Plans:
**Wave 1**

- [ ] 157.1-01-PLAN.md — Wave 0: spec scaffolds for the three MISSING Wave-0 files, plus the seven-row negative-control register
- [ ] 157.1-02-PLAN.md — Production logging: the `PUBLIC_LOG_LEVEL` resolver, both entry points, the three deploy-surface files, and the PostHog backlog item (D9's first source-changing plan)

**Wave 2** *(blocked on Wave 1 completion)*

- [ ] 157.1-03-PLAN.md — `ParseOutcome` core: the three-state type, the generalised partial-preserve helper, and the `issue.keys` closure of the A2 top-level-key hole

**Wave 3** *(blocked on Wave 2 completion)*

- [ ] 157.1-04-PLAN.md — Parse sites 1-2 onto the outcome, the two named accessors, all fourteen call sites, and the util spec's two defect-specifying cases inverted

**Wave 4** *(blocked on Wave 3 completion)*

- [ ] 157.1-05-PLAN.md — Parse sites 3-6: customization, settings and the email send result; the provider's defect-specifying case inverted and renamed

**Wave 5** *(blocked on Wave 4 completion)*

- [ ] 157.1-06-PLAN.md — The maintenance fail-safe, and the answers write path that can no longer report success on an unverified read-back

**Wave 6** *(blocked on Wave 5 completion)*

- [ ] 157.1-07-PLAN.md — The parse-posture ESLint guard (five measured selectors) and its lock-in self-test, with the flat-config REPLACE trap measured in both directions

**Wave 7** *(blocked on Wave 6 completion)*

- [ ] 157.1-08-PLAN.md — Over-disclosure audit, criterion 5's production-mode observation (blocking human checkpoint), and the full closing gate

### Phase 157.2: Per-Request Adapter Instancing

**Added 2026-08-31** by operator ruling D11 (`.planning/v2.15-OPERATOR-DECISIONS-2026-08-31.md`).
Architectural. Two of its three instances predate v2.15; Phase 157 added the third.

**Goal**: Two concurrent server requests cannot be served each other's adapter state — and a test
proves it by failing on the singleton.
**Depends on**: Phase 157.1 (the parse contract settles before the same call sites are re-scoped)
**Requirements**: Operator ruling D11
**Source**: Phase 157 code review, lot C — `157-REVIEW.md`
**Success Criteria** (what must be TRUE):

  1. Server-side adapter selectors are no longer module singletons re-`init()`ed per request with
     an `await` before use. Each request holds its own adapter instance.
  2. **A concurrency test fails on the singleton before it passes on the fix.** This is the
     phase's central deliverable — the negative control, not the patch. Without the failing run
     recorded, the criterion is not met.
  3. `candidate/(protected)/+layout.server.ts:30→33→44` no longer permits concurrent candidates to
     be served each other's data.
  4. `condenseArguments.ts:44` no longer rebinds a shared `#supabase` mid-job, so a concurrent
     admin request cannot make the first job's writes execute under the second admin's JWT.
  5. The third instance introduced by Phase 157 is closed by the same mechanism, not separately.
  6. The class cannot reopen: a test fails when a new server-side selector is added as a module
     singleton.

**Plans**: 9/9 plans executed (7 waves) — **PHASE COMPLETE 2026-09-01**

Plans:
**Wave 1**

- [x] 157.2-01-PLAN.md — Wave 0: the negative-control register and the three missing spec loci

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 157.2-02-PLAN.md — Record the contamination, then land the client sources and the four factories

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 157.2-03-PLAN.md — The isomorphic root layout and the six universal-load sites
- [x] 157.2-04-PLAN.md — The server-side sites, the deliberate anon exception, and the `/api/auth/login` deletion
- [x] 157.2-05-PLAN.md — The browser sites: the shared writer helper and its nineteen consumers

**Wave 4** *(blocked on Wave 3 completion)*

- [x] 157.2-06-PLAN.md — Job-owned writers for the two long-running admin features

**Wave 5** *(blocked on Wave 4 completion)*

- [x] 157.2-07-PLAN.md — Retire all eight module-scope singletons and the transitional re-exports

**Wave 6** *(blocked on Wave 5 completion)*

- [x] 157.2-08-PLAN.md — Remove `init()`, delete the fallback branch, sweep the breadcrumbs

**Wave 7** *(blocked on Wave 6 completion)*

- [x] 157.2-09-PLAN.md — The D1 guard spread into three blocks, its lock-in self-test, and the closing gate

### Phase 158: Routing & Auth Surface Harmonisation

**Corrected 2026-08-28** against the measured tree (`.planning/v2.15-DISCUSSION-POINTS.md` § 0, facts 21, 23): **`lib/routes` does not exist** — the current routes locus is `apps/frontend/src/lib/utils/route/{buildRoute.ts,route.ts}`, so `lib/routes` is a destination this phase *creates*, not a directory it moves into → criteria 3, 4 and 5 restated.

**AMENDED 2026-09-01 (fourth pass) — LINE NUMBERS FOR `hooks.server.ts` ARE NOW BANNED IN THIS PHASE.** Decision C1(a) (`158-DISCUSSION-POINTS-ADDENDUM.md`) and carried obligation OB-4 (`158-CARRIED-OBLIGATIONS.md`) both require it, and the fourth drift has now happened: re-measured at HEAD `bea81d1a8`, `const { url, route } = event;` is at `:80`, `pathname.includes('/candidate')` at `:90`, `route.id.includes('(protected)')` at `:95`, and the two hand-built redirects criterion 3 sweeps at `:93` and `:97`. **Cause: Phase 157.1's `PUBLIC_LOG_LEVEL` work (`e65ac3b84`, `553d71a5b`) landed above them**, after Phase 157's logger import had already moved them once. Full drift history: `:59/:69/:74` → `:66/:76/:81` → `:80/:90/:95` in eight days. **Every plan, task and acceptance criterion in this phase anchors on the EXPRESSION, never on a number.** All numbers in the preambles below and in criterion 4 are retained as the historical record and are NOT current guidance.

**Corrected 2026-08-28 (second pass)** — **the first pass replaced a right line number with a wrong one, in two places.** Fact 23 as originally written claimed `hooks.server.ts:68` and asserted "roadmap said `:69`". Re-measured against `apps/frontend/src/hooks.server.ts` (unchanged since `0a7939aff`): **`:69` is `if (pathname.includes('/candidate')) {`** — `:68` is the comment line above it — the `(protected)` check on `route.id` is at **`:74`** (not `:72`), and `route` enters scope at **`:59`** (`const { url, route } = event;`, not `:66`). **The roadmap's original `:69` was correct**; the correction pass made this entry worse than it was before. All three anchors restored below.

**Goal**: There is one login path, one place route strings are defined, and one place cookie names are declared — and a test fails when a fourth appears.
**Scope widened 2026-08-31** by operator ruling D10 (`.planning/v2.15-OPERATOR-DECISIONS-2026-08-31.md`): the admin-app outage found by the Phase 157 review folds in here, because it is this phase's surface — one login path, one route locus, one cookie locus. **The 9 existing plans predate the widening and need a re-plan pass** before execution. Criteria 8-11 below are the widening.

**Depends on**: Phase 157.2 (per-request adapter instancing is the mechanism that makes the admin server branch see the forwarded session — 158 consumes that fix and proves it), transitively 157.1 and Phase 157 (the adapter boundary must exist before routes can stop reaching through it)
**Requirements**: REVIEW-RT-01..07, operator ruling D10
**Source**: 27 review comments on PR #870 — the largest single bucket; enumerated in the triage. Criteria 8-11 come from the Phase 157 review, lot C.
**Success Criteria** (what must be TRUE):

  1. The admin, candidate and generic-API login paths are collapsed onto shared logic. If the generic `/api` login route is left unused by the collapse, it is deleted rather than kept.
  2. Every cookie the app writes is named from a single const module (`lib/cookies` or equivalent), and a test fails when two cookie names collide or a literal is used at a write site. Measured scope: **4 names** (`id_token`, `oidc_state`, `oidc_nonce`, `oidc_code_verifier`) across **5 files / 17 call sites** — `api/oidc/authorize/+server.ts` 2 · `api/oidc/callback/+server.ts` 9 · `api/oidc/token/+server.ts` 2 · `candidate/preregister/+layout.server.ts` 2 · `api/candidate/preregister/+server.ts` 2 (§ 0 previously said 18).
  3. Route strings are built with `buildRoute` — including the OIDC callback return route at `+server.ts:30` and the candidate auth callback at `:31` — and route definitions live in one centralised locus. That locus is **`$lib/routes/`, which this phase creates**: today the routes code lives at `lib/utils/route/{buildRoute.ts,route.ts}` and **`lib/routes` does not exist**, so the criterion is a move plus an import codemod, not an edit in place.
  4. The `(protected)` pattern is defined in that same new `$lib/routes/` locus, and the line carrying **`pathname.includes('/candidate')`** (anchor on that expression, never on a number — see the 2026-09-01 amendment above; it has drifted four times) no longer matches `candidate` via `pathname.includes('/candidate')` in a way that misfires when the app is served from a subpath. `route` is already destructured into scope by `const { url, route } = event;` and `route.id` is already used for the `route.id.includes('(protected)')` check a few lines below — cite both by expression. Consistency between the pattern, the route tree and the hook is enforced by test.
  5. The permissions mapping at `admin/login/+page.server.ts:43` is extracted to a shared auth utility; `loginRedirectTarget.ts` moves into the new `$lib/routes/` locus alongside the relocated `buildRoute.ts` and `route.ts`; the candidate auth callback and logout move under the generic `/api` routes so admin can reuse them.
  6. `candidate/(protected)/+page.svelte:38` is rewritten so each prop takes a default once and cases specify only overrides, with the badge set defined up front and the `if` blocks referencing precomputed props only.
  7. The test-only element at `candidate/(protected)/profile/+page.svelte:281` is removed — the test id moves to the parent and the test uses a child selector. Theme-colour defaults are removed at `+layout.svelte:215`, and the maintenance title renders per the reviewer's markup at `:212`.

  8. **The admin app works again.** `_getBasicUserData` authorizes off `supabase.auth.getSession()` while `supabaseAdapter.ts:41-44` builds a plain `createClient` on the server branch whose `getSession()` reads its own storage and never the forwarded cookies — so every server-side `getUserData` resolves `undefined`. After this phase, all six `/api/admin/jobs/*` routes serve a genuine admin instead of returning **403**, and `admin/(protected)/+layout.ts` — a **universal** load with no `ssr = false` anywhere under `routes/admin/` — no longer bounces an authenticated admin to login on direct entry or refresh. It currently fails **closed**: an outage, not an authorization hole. **This is not charged to Phase 157** — the pairing dates to `c3e948a84`, and 157-11 removed an argument already documented as inert.

  9. **The admin surface is gated and role-checked.** `hooks.server.ts` gates `/admin`, not only `/candidate`; and the admin form actions carry a role check rather than a bare session check.

  10. **`/api/auth/login` is deleted.** It is a dead, unauthenticated credential endpoint with zero callers whose 403-vs-400 split confirms valid passwords — a login oracle. Criterion 1 already says an unused generic `/api` login route is deleted rather than kept; the oracle is why the disposition is not optional.

  11. **The admin app has E2E coverage for the first time.** Zero specs touch it today, which is why two green full-suite runs said nothing about criterion 8's outage. At minimum one spec enters an admin route as an authenticated admin, exercises an `/api/admin/jobs/*` route, and **survives a page refresh** — the refresh is the half the universal-load defect breaks.

**Scope widened again 2026-09-01** by the Phase 157.2 code review (`.planning/phases/157.2-per-request-adapter-instancing/157.2-REVIEW.md`, findings WR-05 and CR-02). Criteria 12-13 are that widening; both are logged with full context in that phase's `deferred-items.md`. **Note that criterion 8 is now PARTLY DELIVERED ahead of this phase**: the review's CR-01 fix (`889b7d6ad`) made all six `/api/admin/jobs/**` routes authorize on a verified identity via `locals.safeGetSession()`, and `_getBasicUserData` now performs the verifying `getUser()` round-trip before reading any claim. **That claim was CORRECTED 2026-09-02 under OB-6:** the universal-load half — the direct-entry/refresh bounce under `routes/admin/` — was re-measured end to end at this phase's own HEAD `5f122efd5` and **did not reproduce** (`.planning/phases/158-routing-auth-surface-harmonisation/158-ADMIN-BASELINE.md`, **ARM: GREEN** — an authenticated admin gets 200 on direct entry, 200 on refresh, 200 on a nested protected route and 200 on both jobs endpoints, while the unauthenticated arm still fails closed at 307 and **401**, the 401 rather than the 403 that criterion 8's text and OB-6's wording both predict because CR-01's `requireVerifiedAdmin` reserves 403 for an authenticated non-admin), so criterion 8 owes no code change and its remaining debt is the durable regression spec criterion 11 delivers in `158-16`.

  12. **A long-running admin job no longer holds the initiating request's credentials.** The job resolves the verified session once at start and builds its own client from those tokens with `persistSession: false` and `autoRefreshToken: false`, so it never attempts a cookie write on an already-committed response and never depends on the request's `fetch` outliving the response. **Criterion 11 is a prerequisite, not a parallel task** — this change cannot be made safely without a gate that exercises the admin LLM write path, which is exactly what no suite covers today. Phase 157.2 landed only the `// reason:` markers naming the coupling and this remedy (`c89448481`); the mechanism change is untouched. This does NOT settle decision B4's open question of what a job *should* do when the initiating admin's session expires mid-run — it removes the crash mode and leaves the authority question open.

  13. **No server load serializes a refresh token into the HTML payload.** `admin/+layout.server.ts:8-9` and `candidate/+layout.server.ts:8-9` each still return the whole `Session` — `access_token`, `refresh_token`, `expires_at`, full `user` — into the hydration payload of every authenticated page. Phase 157.2's CR-02 fix (`e019007de`) removed this from the ROOT load, where nothing read it; these two are read by `authContext.svelte.ts:26` and by `auth/getUserData.ts`'s `parent`-based pre-check — both of which need only existence, not the token — so narrowing them to a projection is a behavioural change this phase owns. **A test asserting that no server load returns a `refresh_token`-bearing field is the durable half** — without it a fourth load reintroduces the class.

**Plans**: 17/17 plans executed — **re-planned 2026-09-01 (ADDITIVE pass)**. The original nine are KEPT per decision B1(a); eight new plans cover criteria 8-13 and the carried obligations, and three of the nine were amended surgically. Wave graph: `1: 01,04,08` → `2: 02,05,07` → `3: 03` → `4: 06` → `5: 10,11,12,13,14` → `6: 15` → `7: 16` → `8: 17` → `9: 09` (gate).

Plans:

- [x] 158-01-PLAN.md — the routes locus, the route-id predicates and the hook's first rewrite (criteria 3-5)
- [x] 158-02-PLAN.md — the route-pattern consistency guard and its three negative controls (criterion 4)
- [x] 158-03-PLAN.md — the cookie const module and its chained literal guard (criterion 2)
- [x] 158-04-PLAN.md — the candidate home prop rewrite and the test-only-markup removals (criteria 6-7)
- [x] 158-05-PLAN.md — the shared password-login helper and the one admin role declaration (criteria 1, 5). **Amended:** the generic login route was deleted upstream, so its decision checkpoint became a verification (OB-2)
- [x] 158-06-PLAN.md — the candidate auth callback and logout move under the generic API prefix (criteria 3, 5)
- [x] 158-07-PLAN.md — the OIDC callback's redirects through the route builder (criterion 3)
- [x] 158-08-PLAN.md — the phase's record deliverables: the move proposal, the register, the triage dispositions, the login-route measurement. **Amended:** that measurement is now an absence check with a positive control (OB-2)
- [x] 158-10-PLAN.md — re-measure the admin path at HEAD, branch on the arm, verify the login route's absence, and correct this entry's criterion-8 amendment (criteria 8, 10; OB-6, OB-2, B3(a))
- [x] 158-11-PLAN.md — one table-driven route-id gate covering `/candidate` and `/admin` (criterion 9a)
- [x] 158-12-PLAN.md — the admin form actions' own role gate, one shared admin-identity decision, and the swallowed-error measurement (criterion 9b; OB-5 deliverable 1)
- [x] 158-13-PLAN.md — narrow both subtree session loads to a projection, plus the chained guard that stops a fourth (criterion 13)
- [x] 158-14-PLAN.md — the two serialised admin feature loads get their own server load (OB-1, option a+)
- [x] 158-15-PLAN.md — the fail-loudly response seam, the job-identifier guard and the census (OB-5 deliverables 2-4)
- [x] 158-16-PLAN.md — the first admin E2E coverage: identity, project wiring, and one spec carrying the reload, the jobs call, the payload observation and the job-write gate (criterion 11)
- [x] 158-17-PLAN.md — the admin job's own credential, resolved once at start (criterion 12)
- [x] 158-09-PLAN.md — the phase gate, amended: wave 9, all thirteen criteria traced, and the eight-step gate order with the reset immediately before the suite

### Phase 159: Component & Context Consolidation

**Corrected 2026-08-28** against the measured tree (`.planning/v2.15-DISCUSSION-POINTS.md` § 0, fact 24): criterion 1's "every other `$effect` … audited" is a **census, not a spot check** — concentration is low, the heaviest single file holds 5 → the criterion now names the number so the phase is sized against it.

**Corrected 2026-08-28 (second pass)** — **the census number was overstated ~2.3× and had already propagated here.** Re-measured: `grep -rn '\$effect(' apps/frontend/src` returns **92**, in **54** files (83 files contain some `$effect` token, including `$effect.root`-only files — the two counts are different and must not be swapped), `'\$effect\.root('` returns **38**, giving **130** distinct effect sites for a full census. `'\$derived('` returns **207** — the likely transcription source of the "211" the first pass recorded. The qualitative claim (heaviest file holds 5) reproduces exactly, so the same tree was measured and only the total was wrong. Criterion 1 now carries 92 / 130.

**Corrected 2026-09-02 (third pass)** — **five of the seven figures the second pass recorded do not reproduce, and only one of them was the number anyone had noticed.** Measured at this phase's base commit `7503a4a70` and again at `9afc10226`: `grep -rn '$effect(' apps/frontend/src | wc -l` returns **91**, not 92 — Phase 158 removed one effect from `apps/frontend/src/routes/(voters)/+layout.svelte`. In the same measurement `'$effect\.root('` returns **40** (not 38) in **16** files (not 14), **85** files carry some `$effect` token (not 83), and `'$derived('` returns **220** (not 207). Only the file count for `$effect(` itself — **54** — reproduces. The full census is therefore **131**, not 130. Criterion 1 is amended in place above rather than by addendum, because `159-03` asserts the literal strings `92`, `54`, `83`, `38` and `207` and would have failed on four of the five even after the single number everyone had spotted was fixed. Amended under operator decision, 2026-09-02.

**Goal**: A component exists because it earns its own file, and reactive state is derived where it can be derived rather than pushed by an effect.
**Depends on**: Phase 158 (routes settle first)
**Requirements**: REVIEW-CMP-01..06
**Source**: 14 review comments on PR #869 + one PRE-SHIP item — enumerated in the triage
**Success Criteria** (what must be TRUE):

  1. The `$effect` calls at `PasswordSetter.svelte:55` are converted to `$derived` where the value is a pure function of its inputs, and **every other `$effect` in the frontend is audited against the same test** with the disposition recorded per site — a census, not a spot fix. Measured at the phase's own base commit `7503a4a70`, that census is **91 `$effect(` sites** across `apps/frontend/src`, in **54** files — or **131 including the 40 `$effect.root(` sites**, which live in 16 files; 85 files contain some `$effect` token — not the 211 an earlier correction pass recorded, which was a transcription of the `$derived(` count (**220**). The recorded artifact is a committed table (file:line · pure-function-of-inputs? · disposition), and the count is stated here so the phase is neither planned as a handful of sites nor sized against a phantom 211. **The census population is a moving target within this phase's own execution** — waves 1–2 convert and delete effect sites — so the census generated in `159-03` asserts classifier-total **equals the criterion's own grep re-run at generation time**, and records that live value alongside this base-commit baseline; a frozen literal is the proxy, the classifier-equals-grep equality is the invariant.
  2. `MultipleTextInput` is folded into `Input` (or its input part extracted and imported, with the same extraction applied to the other complex types), and multilingual support lands at the same time so each text item behaves like a normal multilingual text item.
  3. `EntityCardAction` is replaced by a snippet — it is a pre-snippet-era workaround — and the separate component is deleted.
  4. The two tracking-service layers are collapsed to one type and implementation; members used only internally (`sessionId` among them) are removed from the consumer-facing interface rather than merely documented as internal.
  5. `reactiveHandle.type.ts` moves to `contexts/utils`; the duplicated block at `candidateContext.svelte.ts:355` and its `voterContext` twin is extracted to a shared utility; the helper at `voterContext.svelte.ts:37` moves to the bottom of the file or into utils.
  6. `Alert.svelte:117` uses the closest available semantic class (e.g. `top-sm`) rather than an ad-hoc value, and `MainContent` plus the other route-root components move under a `$layouts/main` barrel behind a new alias (`PRE-SHIP-REFACTORING.md` § item 2).

**Plans**: 11/11 plans executed

- [x] 159-01-PLAN.md
- [x] 159-02-PLAN.md
- [x] 159-03-PLAN.md
- [x] 159-04-PLAN.md
- [x] 159-05-PLAN.md
- [x] 159-06-PLAN.md
- [x] 159-07-PLAN.md
- [x] 159-08-PLAN.md
- [x] 159-09-PLAN.md
- [x] 159-10-PLAN.md
- [x] 159-11-PLAN.md

### Phase 160: Agent Docs & Skills Refresh

**Goal**: The agent-facing documentation is accurate, its extension patterns are complete, and its structure is chosen on evidence rather than on fashion.
**Depends on**: Phases 152–159 (the docs describe the post-remediation tree)
**Requirements**: REVIEW-DOC-01, REVIEW-DOC-02, REVIEW-DOC-03, REVIEW-DOC-04
**Source**: 8 review comments on PR #874 — enumerated in the triage
**Success Criteria** (what must be TRUE):

  1. `.claude/skills/data/object-model.md` gains the three additions the reviewer specified: one constituency per election; non-contradictory constituency selection across elections sharing a group or nested constituencies; child-implies-parent selection; and the party-list pattern as an `OrganizationNomination` with `CandidateNomination` children.
  2. The extension patterns gain their missing steps — checking dev-seed templates on a schema change, adding E2E coverage for a new filter (in the full voter journey where applicable), and a note that the skill itself must be re-checked afterwards because skills contain listings.
  3. The progressive-disclosure question is **answered with a measurement, not an opinion**: the cited finding is that disclosure only pays once the corpus exceeds what the agent can navigate by direct reading. This repo's skill corpus is measured against that threshold and the skills are restructured or left alone on the result, with the number recorded.
  4. `CLAUDE.md` is evaluated against the cited 288-run ablation finding no measurable correctness gain from persistent context files. Whatever is decided, the decision and its reasoning are recorded — including "keep as is" — so the next reader inherits the argument rather than the file.

**Plans**: 8/9 plans executed

- [x] 160-01-PLAN.md
- [x] 160-02-PLAN.md
- [x] 160-03-PLAN.md
- [x] 160-04-PLAN.md
- [x] 160-05-PLAN.md
- [x] 160-06-PLAN.md
- [x] 160-07-PLAN.md
- [x] 160-08-PLAN.md
- [x] 160-09-PLAN.md

### Phase 161: Project Scoping — `PROJECT_ID` Parameterisation

**Corrected 2026-08-28** against the measured tree (`.planning/v2.15-DISCUSSION-POINTS.md` § 0, fact 27): **no `PROJECT_ID` env exists today** — the default project id is hardcoded as `DEFAULT_SEED_PROJECT_ID` at `apps/supabase/supabase/functions/identity-callback/index.ts:31`, which is this phase's real starting point → criterion 1 now names it. Note the ordering with Phase 155 criterion 2: 155 makes `identity-callback:197` **throw** on a missing `DEFAULT_PROJECT_ID`, so 161's parameterisation arrives at a call site that already fails loudly rather than one that silently seeds.

**Goal**: Every query names the project it is for, and an E2E run creates its own project instead of requiring the whole local database to be reset.
**Depends on**: Phase 156 (schema settles first)
**Requirements**: PRESHIP-01
**Source**: `PRE-SHIP-REFACTORING.md` § item 1
**Success Criteria** (what must be TRUE):

  1. A `PROJECT_ID` environment variable exists — **it does not today** — and defaults to the default project id, documented in `.env.example`. The value it replaces is the hardcoded `const DEFAULT_SEED_PROJECT_ID = '00000000-…-0001'` at `identity-callback/index.ts:31`; that constant is the starting point, and it no longer supplies a silent fallback once the variable exists.
  2. Every query that is project-scoped is parameterised by it — the adapter carries **31 `project_id` references** today as the baseline to convert. A query missing the parameter is caught by a guard rather than by a reviewer.
  3. E2E creates its own project under a dedicated test project id, and **`yarn test:e2e` no longer requires `yarn db:reset` as a precondition** — proven by running the suite green twice in a row without an intervening reset, which is the whole point of the item.
  4. The E2E prerequisite documentation in `CLAUDE.md` and `tests/README.md` is updated to match, and a grep for the retired "reset the DB first" instruction returns nothing.

**Plans**: 19/19 plans executed (16/19 executed; 161-17, 161-18 and 161-19 planned 2026-09-07 against the FOURTH re-verification, which moved all three of the third report's `missing:` items into `gaps_closed` and put two NEW blocking findings in their place, both independently reproduced end to end). The fourth re-verification confirms 161-15 and 161-16 genuinely closed the access-punctuator family BY CONSTRUCTION and that the verifier could not defeat it — but a fresh `161-REVIEW.md` written at the same HEAD found two BLOCKER-grade gaps one axis over. CR-01, the CORPUS axis: `INVOKE_RE`'s two computed cells are dispositioned `reported-by COMPUTED_ACCESS_RE`, a matcher `checkOutsideSource` never calls, so an Edge Function invocation reached through a computed key is UNCOUNTED at the one address the invocation check was unanchored to reach. CR-02, the RECEIVER-DEPTH axis: `CLIENT_BINDING_RE`'s trailing lookahead excludes any following member access, so `const fns = this.supabase.functions;` then `fns.invoke(…)` defeats the guard inside its own strictest corpus, and the matrix could not surface it because that matcher's link list is the hand-written list the matrix exists to eliminate. 161-17 and 161-18 close both directly rather than restating them as residuals, and 161-19 re-runs the verifier's own two injections against what lands. The phase does not close on the plan count alone; a fifth re-verification is what closes it. The second re-verification (`161-VERIFICATION.md`, 2026-09-05T20:35Z) re-measured all five items the first re-verification named as genuinely closed by 161-10 … 161-13, and criteria 1, 3 and 4 stay ACHIEVED — but a code review run after those four landed found a seventh guard blind spot of the identical class, reproduced independently: every matcher hard-codes a literal `.` as the access operator, so `this.supabase?.from('elections')` is uncounted by ACCESS_RE, SCHEMA_HOP_RE, BOUNDARY_ACCESS_RE and COMPUTED_ACCESS_RE alike. 161-14 closes it. Historical note on the earlier round: the re-verification (`161-VERIFICATION.md`, 2026-09-05T19:10Z) re-measured 161-09's four fixes as genuinely closed and re-graded criteria 1, 3 and 4 ACHIEVED, but criterion 2 stays PARTIALLY ACHIEVED and blocking on two findings a code review made after 161-09 closed, at the same HEAD: an unscoped, error-swallowing candidate lookup in `identity-callback` (CR-01), and three further guard blind spots — `.schema(…).from(…)` chains, `.functions.invoke(…)` calls, and an enumeration bounded by the adapter directory — two of them live call sites today (CR-02 residual). Four gap-closure plans remediate exactly those, and 161-11 additionally scopes `resolve_email_variables`, which the planner found reading three project-scoped tables by user id alone — the disposition the guard would otherwise have had to record as unparameterised.
**Wave 1**

- [x] 161-01-PLAN.md
- [x] 161-02.1 (operator-approved follow-up; no PLAN.md — `161-02.1-SUMMARY.md`): `get_questions` gets the same required `p_project_id` as `get_nominations`, and `07-rpc-security` test 14 is scoped to its own fixture data
- [x] 161-10-PLAN.md — gap closure (CR-01): the `identity-callback` candidate lookup names its project and throws on a lookup failure instead of falling through to the insert branch
- [x] 161-11-PLAN.md — gap closure (CR-02 disposition): `resolve_email_variables` gains a required `p_project_id`, and `send-email` requires, refuses a mismatched, and forwards the project term

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 161-02-PLAN.md
- [x] 161-03-PLAN.md
- [x] 161-12-PLAN.md — gap closure (CR-02 blind spots 1 and 2): the guard gains a schema-hop prohibition and an Edge Function disposition map, each with a committed fixture pair

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 161-04-PLAN.md
- [x] 161-05-PLAN.md
- [x] 161-13-PLAN.md — gap closure (CR-02 blind spot 3): the guard's reach is widened past the adapter directory behind a checked boundary statement, plus the phase's closing full-suite run

**Wave 4** *(blocked on Wave 3 completion)*

- [x] 161-06-PLAN.md
- [x] 161-14-PLAN.md — gap closure (optional chaining): every matcher family reads both member-access operators, the binding rule tells an optional-chained access from an aliased client without losing the nullish-coalesced alias, and twelve new fixture shapes plus four raised exact counts make the closure measured rather than asserted

**Wave 5** *(blocked on Wave 4 completion)*

- [x] 161-07-PLAN.md

**Wave 6** *(blocked on Wave 5 completion)*

- [x] 161-08-PLAN.md

**Wave 7** *(blocked on Wave 6 completion)*

- [x] 161-09-PLAN.md — remediation: guard non-vacuity + evasions, E2E project-mismatch abort + doc repoint, `get_nominations` entity-join scoping, closing full-suite run

**Wave 8** *(blocked on Wave 7 completion)*

- [x] 161-15-PLAN.md — gap closure (the punctuator by position closure): the optional-CALL punctuator `?.(` is admitted at every call position, every access-operator position each matcher declares gains a committed fixture that only it can match, the two computed-punctuator cells the enumeration surfaced are closed, and the self-test asserts the per-family decomposition rather than a pooled total

**Wave 9** *(blocked on Wave 8 completion)*

- [x] 161-16-PLAN.md — gap closure (the enumeration as a verifiable artifact): every optional-punctuator position is enumerated from the declaration, mutated singly and required to break the self-test, with one measured exemption; every cell of each matcher's canonical call shape must carry a written disposition; and the module docblock's reach paragraph is corrected and bound to the assertions that measure it

**Wave 10** *(blocked on Wave 9 completion)*

- [x] 161-17-PLAN.md — gap closure (CR-01, the CORPUS axis): the Edge Function invocation surface is read in its computed spellings at BOTH addresses by two new matchers wired into the one check both corpus composers call, and a `reported-by` disposition can no longer name a matcher running over a narrower corpus than the matcher under test — both corpora derived from the guard's own call graph rather than a hand-authored table

**Wave 11** *(blocked on Wave 10 completion)*

- [x] 161-18-PLAN.md — gap closure (CR-02, the RECEIVER-DEPTH axis): `CLIENT_BINDING_RE` is promoted to read a binding of any node on the client's member chain, so a sub-object alias and a sub-object destructure are reported inside the guard's strictest corpus; the matrix gains the chain link it structurally could not see, and which punctuator cells belong to a lookahead is derived from the declaration's own spans

**Wave 12** *(blocked on Wave 11 completion)*

- [x] 161-19-PLAN.md — gap closure (`missing[2]`, the re-verification protocol): both of the fourth re-verification's end-to-end injections are re-run verbatim and each required to break the guard it previously left green, every negative control is asserted present by name, and the five repository gates are read unpiped at the closing HEAD

### Phase 162: Permissions & Auth Model Refactor

**Corrected 2026-08-28** against the measured tree (`.planning/v2.15-DISCUSSION-POINTS.md` § 0, facts 28, 29): criterion 2's read/write collapse is **confirmed present**, not hypothetical — `can_access_project` (`301-auth-functions.sql:103`) is the same predicate on both the SELECT policy at `302-rls.sql:84` and the UPDATE policy at `:88-89`; and **criterion 6 is already half-satisfied** — `400-storage.sql` already routes through `can_access_project` at 11 sites, so storage follows table access by construction and the deliverable is the paired assertion, not a new mechanism.

**Corrected 2026-09-17** against the tree at the phase's close, by `162-02` — run deliberately last so every fact below is measured rather than predicted. **The 2026-08-28 note above stands** as the record of the baseline it measured; this note does not withdraw it, it records what the phase then did about it. The decision set is closed: every ruling in `162-IMPLEMENTATION-BRIEF.md` § 11.9's resolution table is resolved, the checkpoint ratifications are in `162-CHECKPOINT-DECISIONS.md`, and **nothing is blocked on an operator answer**. **This note amends criteria 1, 2, 3, 4, 5 and 6**; criterion 7 stands as written and is discharged by `162-FLOW-CONFORMANCE.md`. What the phase built, and what each amendment below is written against: **two role levels** (`grant_role_type` = `admin`, `editor`); a **23-member** permission enum, never widened; **one authority predicate**, `user_can(grant_scope_type, uuid, grant_permission)`, with `can_access_project`, `has_role` and their shims deleted by `162-15` and `can_edit_project` never built at all; public read as `open_for_voters` conjoined with two confirmation states, the **ten** per-row publication columns and their **five** partial indexes (not the ten every earlier document claimed) deleted by `162-16`; **fifteen storage policies in and fifteen out**, now routing through `storage_path_can` → `user_can` over an eleven-segment path mapping; and a pgTAP estate of **1077 declared assertions across 28 files** — 1086 as the runner counts them, the difference being `00-helpers`' nine smoke tests. Policy census: **97 at the baseline** (80 table + 15 storage + 2 auth-tables) → **102 at the close** (85 + 15 + 2), counted as `CREATE POLICY` statements in `apps/supabase/supabase/schema/`.

**Goal**: Who may do what to which object is answered by one grants matrix and one set of predicates, rather than by scattered RLS policies that each re-derive the rule.
**Depends on**: Phases 156 and 161 (schema and project scoping settle first). **The source document marks this blocking ship.**
**Requirements**: PRESHIP-02
**Source**: `PRE-SHIP-REFACTORING.md` § Permissions refactoring + the PR #866 comments on `300-auth-tables.sql`, `301-auth-functions.sql` and `302-rls.sql`
**Success Criteria** (what must be TRUE):

  1. A `grants` table exists keyed `user_id × scope × target_id × role`, with scopes `global` / `account` / `project` / `entity` (alliance, faction, organization, candidate) and **two role levels, `admin` and `editor`**, carrying the documented rights: an `admin` does anything to the object and its descendants, and an `editor` has the rights the matrix grants it — editor management being a permission at project scope and its entity-scope equivalent, not a role of its own. ⚠ **Amended 2026-09-17 (D-02, ratified at `162-CHECKPOINT-DECISIONS.md` § 1 item S-1, option (A)):** this criterion named three levels. There is no third level: `grant_role_type` carries exactly these two members. The eight user types map onto grant rows in `162-SPEC.md` § 3 and the role × permission matrix is its § 5; neither is reproduced here.
  2. **Read authority is separated from write authority, and the separation is asked of one predicate rather than of two functions.** A candidate can read the project's elections and cannot edit them: `user_can(grant_scope_type, uuid, grant_permission)` is asked `project.read_structure` on the `projects` SELECT policy and `project.edit_project_settings` on its UPDATE twin. ⚠ **Amended 2026-09-17 (ratified at `162-CHECKPOINT-DECISIONS.md` § 1 item S-5, option (A)):** this criterion named `can_access_project` and `can_edit_project`. The first is **deleted** by `162-15`; the second was **never built**. A guard comparing the two is therefore unwritable, and F2(a)'s actual requirement — *fails if the two collapse back into one* — is re-expressed against the permission literal and made **permanent rather than plan-time**: **check 9001** in `apps/supabase/scripts/lint-schema.mjs`, run by `yarn db:lint:sql`, partitions every policy in the authority schemas by what its permission *reaches* and reddens when a table's read set and write set intersect. The collapse this criterion was written against was real, and it is ended. Anchored by content, not by line: every anchor this criterion carried points into a file the phase rewrote.
  3. The `is_child_nominee` predicate exists and is the single mechanism by which a parent controls a child, used wherever policy allows that control — reached **through** `user_can`'s named child-nominee branch rather than around it. ⚠ **Amended 2026-09-17:** the blast radius is narrower than the criterion implies, and the criterion is unchanged in substance. The predicate is **direct-parent-only, not transitive** (D-06 / D4(a): a recursive CTE inside a hundred policies is a performance hazard nothing asked for), it gates **`nomination.read`** and not `entity.read_answers` (ratified 162-04 Q2 = option (D)), so a parent reads its child's nomination and basic data and never that child's answers; and its measured signature takes **three** arguments, `(p_parent_type, p_parent_id, p_child_id)`, not the two named here.
  4. The per-project settings governing candidate self-edit and nomination changes (including parent-entity and child-entity approval routing, and invite-by-email) are implemented and each **surviving** branch is exercised by a test. ⚠ **Amended 2026-09-17 (D-01, `162-IMPLEMENTATION-BRIEF.md` § 10.1):** the middle self-edit branch — the suggested-changes store — and the tests of that branch are **removed**, on the operator's ruling of 2026-09-14: *"Yes — record it as my amendment."* There is no suggestions table and no suggestion member among the 23 permissions; a user who wants a change they cannot make messages an admin. The nomination-changes half is unaffected, and the phase's **blocking ship** mark is unchanged — the amendment removes one branch of one criterion, never the status.
  5. Read grants behave as documented, under one rule and only one: a row is public when the project is **open for voters** AND its nomination is **confirmed** AND every entity that nomination links carries `confirmed = true` — a conjunction that is **transitive through the nomination** — while any authenticated grantee reads the project's structure, and an entity grantee reads its own entity's answers and nominations plus a related entity's basic data through the child-nominee hop. ⚠ **Amended 2026-09-17 (D-11, D-11b):** the published/unpublished read model this criterion used to state is **superseded**, because the mechanism it named no longer exists — the ten per-row publication columns and their five partial indexes are deleted inside this phase by `162-16`, so after it there is **exactly one** way to ask whether a row is public.
  6. **All fifteen storage policies route through one mechanism rather than a parallel implementation, and a storage operation denied at the table level is observed denied at the storage level too — per verb**, by tests that fail if the two ever disagree (K2's per-verb amendment stands: read and write are separable observations, delivered by `162-17`). Fourteen policies route through `storage_path_can`, which delegates every authority decision to `user_can` over an eleven-segment path mapping; the fifteenth — the anonymous public-asset read — routes through `storage_path_is_public`, because an anon caller carries no `grants` claim and an authority-based allow there would deny every anon read and render the public application blank (D-27). ⚠ **Amended 2026-09-17 (D-03; the claim is withdrawn, not merely widened):** this criterion asserted in bold that the one-mechanism half was **already** satisfied. That rested on a `can_access_project` call-site count which was a raw grep total inflated by one mention in the file's own header comment block, and on ten line anchors of which **none of the ten** was correct. Measured at the baseline, 8 of the 15 policies routed through that predicate and 7 did not — six `candidate_*` policies re-deriving ownership inline through `EXISTS` sub-selects, plus the anon read — so the half was never true. Anchored by policy family rather than by line, per this roadmap's own Phase 164 precedent. **Storage census, measured 2026-09-17:** 15 policies / 14 routing through `storage_path_can` / 20 call sites / 1 non-caller (the anon read, through `storage_path_is_public`) / 0 `can_access_project` / 0 inline `EXISTS` sub-selects. The `candidate_*` family no longer exists under that name at all: the fifteen policies are now the `entity_*` / `project_*` pairs plus the two authenticated reads and the anon read.
  7. The level-1 permissions short of full are defined, and the candidate registration and nomination confirmation flows are checked against the matrix rather than assumed compatible with it.

**Scope note (not a criterion) — `elections.election_type` is repurposed.** The phase reuses the existing column to carry the **nomination shape** (`organization_only` / `candidate_only` / `organization_list`) and deletes its `'general'` / `'local'` meaning along with its historical traces, on the operator's free-text note at `162-IMPLEMENTATION-BRIEF.md` § 8.2, carried as `162-CONTEXT.md` **D-16** and implemented by **`162-07`**. It is recorded here rather than as a criterion because none of the seven implies it, and a reviewer checking the phase against this entry would otherwise meet an unexplained change to an existing column's meaning. The measured trace list lives in `162-CONTEXT.md`; it is not reproduced here.

**Plans**: 21/21 plans executed across 7 waves, plus 2 gap-closure plans (162-18, 162-19, added 2026-09-19 for criterion 7 after re-verification), per `.planning/phases/162-permissions-auth-model-refactor/162-PLAN-OUTLINE.md` (transcribed verbatim from `162-IMPLEMENTATION-BRIEF.md` § 5). All **19 of 19 are written**, and **18 of 19 are executed** as of 2026-09-17 — every row below is ticked exactly when its `162-XX-SUMMARY.md` is on disk, the single unticked row being `162-02` itself, the plan that wrote this line. § K of the discussion document was closed by operator ruling on 2026-08-29 (K1 one-rewrite-with-shims, shims deleted in-phase; K2 paired assertion **per-verb**, storage policies must honour the `verb` argument so read and write are separable; K3 typed enum-backed columns on `projects`; K4 level-1 defined in the phase SPEC as editor-minus-editor-management, then the flows checked). Full text: `.planning/v2.15-OPERATOR-DECISIONS-2026-08-29.md` § K. The source document marks it **blocking ship** and that mark stands; per decision D4 the phase is planned when the wave order reaches it, not ahead of Phase 153.

Plans:
**Wave 1**

- [x] 162-01-PLAN.md — write `162-SPEC.md`: the 23-permission matrix, the public-read rules including the entity-confirmation conjunct, the level-1 definition (K4's stated home), and the explicit amendments to criteria 1, 4 and 6
- [x] 162-02-PLAN.md — correct this entry and the PRESHIP-02 row against the measured facts; carry the operator's criterion-4 amendment. **Run last, after the other eighteen**, so every fact it records is measured rather than predicted. ⚠ The census this row used to carry as a target — 8 of 15 policies routing through `can_access_project`, 6 `candidate_*`, 10 call sites, 0 of 10 line anchors correct — is the **baseline** census and is now history: that predicate and that policy family no longer exist. The census the phase closed on is in criterion 6 above, re-measured at execution time
- [x] 162-02b-PLAN.md — the declarativity pass: merge 15 of the 25 column-adding `ALTER`s into their `CREATE TABLE` bodies, fold `00002`–`00008` into a regenerated `00001`, collapse the parity guard to a byte comparison. Gate is schema byte-identity, not a green suite
- [x] 162-03-PLAN.md — `grant_scope_type` / `grant_role_type` / `grant_permission` (23 members) and the `grants` table, keyed `UNIQUE NULLS NOT DISTINCT` because a plain `UNIQUE` enforces nothing for three of the four scopes — the hole `user_roles` carries today
- [x] 162-04-PLAN.md — `user_can` and `is_child_nominee`, plus **the phase's tracer slice**: one grant row → JWT claim → `user_can` → the `projects` SELECT policy → a paired pgTAP assertion, leaving its UPDATE twin on `can_access_project` so criterion 2's collapse is visible in the diff
- [x] 162-18-PLAN.md — gap closure (criterion 7, `162-VERIFICATION.md` 2026-09-19): tighten the `invite-candidate` and `send-email` flow gates so an ignored, shadowed or mis-bound `callerMayOnProject` answer reddens (controls G1–G5); re-derive the registration and bulk-send tables, the identity-callback section and the module census against `user_can` across all seven matrix columns; record the account-to-project reach CLOSED (F-4, WINDOWS 263) and 162-17's two missed invite nonconformances (F-5)

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 162-05-PLAN.md — `has_role` and `can_access_project` as thin shims over `user_can`, with the transitional window closed by construction: the shims dispatch on the presence of the `grants` claim and today's bodies move verbatim into `*_legacy_claim` functions, whose existence a pgTAP biconditional ties to the hook not yet emitting `grants` — so the fallback cannot outlive 162-06
- [x] 162-06-PLAN.md — B6(a)'s grant backfill re-expressed as an idempotent function called from the re-creation paths (no deployed database means the rows come from `seed.sql` and `create_test_data()`, not from transformation); the access-token hook emits `grants`; the claim consumers updated — **five modules, not four**: `send-email` was omitted from fact 11's census and is an authorisation gate, so the claim change would silently deny every admin bulk send (`162-CONTEXT.md` D-25)
- [x] 162-19-PLAN.md — gap closure (criterion 7): level-1 checked through the nomination- and entity-confirmation flows in `32-level1-confirmation-flow.test.sql` with applied-database controls; close out `162-FLOW-CONFORMANCE.md` (F-2, executable half re-measured, header, WR-04 cross-reference); correct the agent guidance that still prescribes the retired claim gate; phase gates, with the E2E state carried by a diff against the last green run

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 162-07-PLAN.md — `open_for_voters`, `lock_nominations`, the repurposed `election_type` and `entities.confirmed`, all declared in `CREATE TABLE` bodies. "Backfilled `true`" is restated as the set of values the four creation paths write, asserted both ways against a real `db:reset-with-data` and observed RED first
- [x] 162-07b-PLAN.md — `organization_id` moves from `candidates` to `factions`, closing RES-7 / T-144-11. Measured first: **zero** faction rows are emitted by `seed.sql`, by all 39 dev-seed templates or by the E2E suite, so `NOT NULL` costs nothing at seed time and exposes a generator defect rather than creating one. Chained behind 162-07 per D-26
- [x] 162-08-PLAN.md — the 13 anon SELECT policies re-expressed against `open_for_voters` + confirmed nominations + the linked entities' `confirmed`, written once in their end state with no `published` conjunct. Three live probes shaped it: an inline `EXISTS … FROM public.projects` returns **0 rows for every caller**, the entity/nomination pair written inline raises `infinite recursion detected in policy for relation "candidates"`, and `relforcerowsecurity` is false on all six tables — the invariant the `SECURITY DEFINER` bypass rests on

**Wave 4** *(blocked on Wave 3 completion)*

- [x] 162-09-PLAN.md — `accounts`, `projects`, `elections`, `constituency_groups`, `constituencies` and the two join tables → `user_can`. Surfaced the account-read gap: no account-read member distinct from `account.edit_settings`, so `accounts` SELECT gates on grant **existence** via `user_has_account_grant(uuid)` — a ratified named exception rather than a reproduction of the collapse criterion 2 ends
- [x] 162-10-PLAN.md — `organizations`, `candidates`, `factions`, `alliances` → `user_can`; the inline `auth_user_id = auth.uid()` re-derivations folded in and `is_candidate_self` dropped (A3(a)); D-21's entity-type generalisation carried. Closes the window `162-07b` opened, through the nomination hierarchy rather than by widening a role predicate
- [x] 162-11-PLAN.md — `questions`, `question_categories`, `app_settings`, `feedback`, `admin_jobs` → `user_can`; `app_settings` UPDATE on `project.edit_app_settings` and `projects` on `project.edit_project_settings` (§ 11.1). `admin_jobs` is the one table whose read and write permission sets intersect — recorded as check 9001's single ratified exemption, not hidden
- [x] 162-12-PLAN.md — `nominations`: admin policies converted; entity-user INSERT/UPDATE gated on `nomination.edit` + `NOT lock_nominations`; the `confirmed → false` transition on edit; `nomination.confirm` admin-only. Plus § 11.5's `nomination.create_parent` and its five guards, § 11.7's `UNIQUE NULLS NOT DISTINCT` constraint, § 11.8's faction-parent rule, and the `unconfirmed` → `confirmed` flip (D-11c)
- [x] 162-13-PLAN.md — Immutable-data enforcement **conditional on `confirmed`** (§ 8.7(a)): a trigger reading `OLD.confirmed`, not a `WITH CHECK`, because fact 27 measures `303-column-grants.sql` as a single global REVOKE/GRANT pair that cannot express a rule conditional on row state. `entity.confirm` gates writes to `confirmed` itself

**Wave 5** *(blocked on Wave 4 completion)*

- [x] 162-14-PLAN.md — All 15 storage policies through the shared mechanism — fifteen in, fifteen out — with the inline re-derivations folded in and the anon read routed through visibility rather than authority (D-27). The A4 note honoured: one public bucket per entity type, write access paired to the entity's own edit permission

**Wave 6** *(blocked on Wave 5 completion)*

- [x] 162-15-PLAN.md — Delete the shims; drop `user_roles`, `user_role_type`, `role_scope_type` (B1(a), K1), "drop" meaning absent from the declarative schema. `can_access_project` and `has_role` cease to exist here, which is why criterion 2's guard is re-expressed rather than written as worded. Lands the `test_user_roles()` replacement across the pgTAP estate
- [x] 162-16-PLAN.md — The publication-flag removal (§ 8.4(b), § 11.6): **10 columns and 5 partial indexes** — not the ten every earlier document claimed, the phase's fourth corrected census — out of the declarative schema, and the term out of every anon policy, `dev-seed`, `permittedKeys.ts`, `seed.sql`, the bulk-import column lists, the adapter selects and the E2E specs
- [x] 162-17-PLAN.md — Tests and evidence: the pgTAP estate widened across the matrix to **1077 declared assertions across 28 files** (1086 as the runner counts them); check 9001's structural non-collapse guard in `lint-schema.mjs`; the per-verb storage paired assertion; `162-NEGATIVE-CONTROL-LEDGER.md`; the criterion-7 flow check in `162-FLOW-CONFORMANCE.md`; and § 11.7's two-directional uniqueness pair

**Cross-cutting constraints:**

- The wave-4 gate is met in full (F5(a)): `yarn typecheck`, `yarn lint:check`, `yarn test:unit`, `yarn workspace @openvaa/supabase test:db`, `yarn db:lint:sql` and the complete E2E suite are green, with zero failed and zero did-not-run. Disk headroom in `tests/e2e-runs/` is checked before the suite is started, because an ENOSPC part-way through voids the run rather than failing it.

### Phase 162.1: Permissions Follow-Up — Read-Cost Investigation & Closed-Project Voter Coverage

**Filed 2026-09-18 by operator instruction**, immediately after Phase 162 closed, from two residuals that
phase recorded openly rather than hid. Both are **measured, not suspected** — every figure below was taken
against the applied database, and the dead ends are recorded so they are not re-walked.

**Goal**: Find out what the grant model's read cost actually is at election scale and whether it needs
fixing, and make the one user-visible consequence of the new visibility gate reachable by a test.

**Depends on**: Phase 162
**Requirements**: PERMFU-01, PERMFU-02, PERMFU-03, PERMFU-04, PERMFU-05, PERMFU-06, PERMFU-07, PERMFU-08, PERMFU-09, PERMFU-10

> **Scope settled 2026-09-18 after spikes 025–030** (`.planning/spikes/GRANT-MODEL-READ-COST-REPORT.md`) and
> recorded in `162.1-CONTEXT.md`: Item 1(a) = reorder the five authenticated policy quals to variant B;
> Item 1(b) = accepted; Item 2 = voter app shows the existing maintenance page; **added**: adapter
> auto-pagination (spike 030) and the storage-cleanup fix + answer-photo cleanup (spike 029, policy C1+).
> Already landed outside the plans: `max_rows = 50000` and anon `statement_timeout = 8s` (`e035ce1ba`).

---

#### Item 1 — The two read-cost residuals: investigate before deciding

Phase 162 left two quantified regressions open. Neither has been shown to matter in practice; neither has
been shown not to.

**(a) Authenticated entity-read, 4.47x.** Measured on 5000 candidates + 5000 confirmed nominations,
`SET LOCAL ROLE`, 8 runs, min, row counts checked as sets. **Decomposed at D-36**: the public assembly
alone 39.7 ms; the three `user_can` disjuncts alone 44.1 ms; both together 85.8 ms, against a 19.9 ms
pre-phase denominator. **The residue is the converted authority mechanism plus window 267's nomination
reach — NOT the visibility composition.** No arrangement of the composition removes it; that was already
tried and reverted (D-35 -> D-36). The anon half, by contrast, **closes at 0.99x** because its four
policies are byte-identical to their pre-phase text.

**(b) Anon storage-bucket read, 6.4x** (4.890 ms -> ~31.2 ms, 162-14). Same cause — three non-inlinable
`SECURITY DEFINER` calls per row. **D-36's remedy is structurally unavailable here**: a storage policy's
identity is text path segments, not a typed column. **No application path exercises it today.**

**Dead ends already walked — do not repeat them:**

- A `SECURITY DEFINER` function **can never be inlined** by the PostgreSQL planner. "One definition"
  therefore always costs a nested call, and that call **is** the regression.
- A `SECURITY INVOKER` core with a thin `SECURITY DEFINER` wrapper was built and measured at **~5%**; the
  cores were not inlined. A `SET` clause on a SQL function also blocks inlining.
- Putting the logic inline **in the policy** is fast and **WRONG**: 0.44 ms returning **0 rows**, because
  `projects` has no anon policy. Measured twice independently (162-08, and again during the D-35
  investigation). Any proposal must carry a correctness column, not just a time.

**What is NOT known, and is the actual question:** whether any of this is reachable at real election
scale. **Suite duration was flat across all nineteen plans** — 627-651 s, a 4% spread — so neither
regression is detectable at E2E level, and the benchmarks used 5000 rows on a workstation at load 9-22.

**Success criteria (draft, to be firmed at planning):**

1. A cost model measured at **realistic election scale**, not 5000 synthetic rows, naming the largest
   plausible candidate/nomination counts and the p95 the voter app actually needs.
2. A verdict per residual — **fix, accept, or accept-with-a-monitor** — each resting on (1) rather than
   on preference. "Accept" is a legitimate outcome and must be recordable as one.
3. If fixed: the correctness proof is a **row-identity set comparison across all four entity types and
   both readers**, the instrument Phase 162 already used (`EXCEPT ALL` both directions, plus a truth-probe
   grid asking every id under its own and the wrong types). A time improvement without that proof is not
   acceptable — the fastest variant measured in this phase was the incorrect one.
4. Whatever lands leaves **162-17's eight-assembly guard green**, including both of its perturbations.

---

#### Item 2 — A closed project must be reachable by a test, and the voter app must survive it

**The behaviour, measured against the applied database 2026-09-18:**

```
scoped anon app_settings, project open_for_voters = true   -> 1 row
scoped anon app_settings, project open_for_voters = false  -> 0 rows
```

`elections` and `questions` likewise go to 0. This is **by design** — 162-08's ratified Q4/V-4 put
`app_settings` and the join tables inside the `project_open_for_voters` gate, and the operator was shown
this consequence when ratifying it.

**Why it is a defect today rather than a design note:** `supabaseDataProvider.ts:127` reads
`.scopedFrom('app_settings').select('settings').single()`, and line 131 **throws**
`getAppSettings: <message>`. Zero rows through `.single()` is a PostgREST error, so a closed project does
not render an empty application — **it throws.**

**Why nothing catches it:** both seeded projects carry `open_for_voters = true`
(`00000000-...-0001` and `00000000-...-00e2`), so **no pgTAP fixture and no E2E spec is ever in the closed
state.** The only assertion pinning the behaviour is a database assertion that says nothing about the
frontend. Recorded as `WINDOWS.md` 268 by 162-08 and never discharged.

**Success criteria (draft, to be firmed at planning):**

1. **A seed template with a project that is NOT open for voters**, so the state is reachable at all.
   The existing templates stay open; this is an addition, not a change to them.
2. **An E2E spec that visits the voter app against that project** and asserts what a voter sees. It must
   fail against today's tree — observe it **red first** — because today's tree throws.
3. **A decision on what the voter app SHOULD do**, made explicitly rather than by accident: a "not open
   yet" page, a redirect, or something else. This is a product question and the phase should surface it,
   not assume it.
4. The frontend handles zero rows **without throwing**, whatever (3) decides — most likely
   `maybeSingle()` plus an explicit branch, but the fix follows the decision.
5. **pgTAP coverage for the closed state** on `app_settings`, `elections` and `questions`, so the database
   half is pinned from both sides rather than only the open half.

---

**Plans:** 8 plans (one strict chain, waves 1-8: the plans share one local Supabase stack, one E2E port and the single migration file, and each ends with a full E2E run)

Plans:
**Wave 1**

- [x] 162.1-01-PLAN.md — Item 1(a)/(b): reorder the five `authenticated_select_*` quals to variant B, proved row-identical by spike 028 + fingerprint, structural order monitor (29), G8A/G8B replay, residual (b) acceptance comment, PERMFU-01..10 registered (D-01..D-04)

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 162.1-02-PLAN.md — Storage delete path: single-object `net.http_delete`, path/bucket whitelist, own-folder + still-referenced confinement, EXECUTE revoked from API roles, C1+/S2/orphan-residue comments, pgTAP 31, API-only `storage-cleanup` E2E (image case) red first (D-10, D-11, D-14, D-18, D-20)

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 162.1-03-PLAN.md — Storage folder enumeration on entity delete and answer-image cleanup, both red first in pgTAP and committed state; database skill docs (D-12, D-13, D-14)

**Wave 4** *(blocked on Wave 3 completion)*

- [x] 162.1-04-PLAN.md — Adapter auto-pagination: one `fetchAllRows` helper, `id` tie-breaker, option-(c) short-page guard, `dataAdapter.pageSize = 50000` (D-07, D-08, D-09)

**Wave 5** *(blocked on Wave 4 completion)*

- [x] 162.1-05-PLAN.md — dev-seed `perm-closed-project` template via an `openForVoters` slot and writer pass; teardown CLI reopens the project (D-06a, D-19)

**Wave 6** *(blocked on Wave 5 completion)*

- [x] 162.1-06-PLAN.md — dev-seed portraits under random UUID names; re-seed proof against the working cleanup (D-15)

**Wave 7** *(blocked on Wave 6 completion)*

- [x] 162.1-07-PLAN.md — Closed project in the frontend: `maybeSingle` + `project_open_for_voters` branch, root-layout validity fix, terminal E2E node red first (voter maintenance, both logins, candidate login, grant-holder preview) (D-05, D-06, D-06a, D-16, D-17)

**Wave 8** *(blocked on Wave 7 completion)*

- [x] 162.1-08-PLAN.md — Closed-state pgTAP (30) with open controls and negative controls, explicit GRANT on `project_open_for_voters`, corrected policy comment, WINDOWS 268 closed, final G8A/G8B replay and phase gates (D-06a, D-17)

### Phase 163: CI Gates — SQL Lint/Format + Secrets & Vulnerability Scanning

**Moved 2026-08-28** from Phase 149 so these gates are asserted against the post-remediation tree rather than one still carrying the 131 open review findings. Scope and criteria are unchanged.

**Corrected 2026-08-28** against the measured tree (`.planning/v2.15-DISCUSSION-POINTS.md` § 0, fact 33): the criteria's premises hold — no `db:lint:sql`, secret-scan or dependency-audit job exists in `.github/workflows/main.yaml`, and `format:check` runs at `main.yaml:64`. The one unstated fact: **prettier has no SQL parser configured** (`prettier.config.mjs` loads no SQL plugin), so criterion 2 cannot be met by wiring alone → criterion 2 now says the parser must be added first.

**Goal**: The checks that exist but nothing runs, and the checks that do not exist yet, all redden the build.
**Depends on**: Phase 156 — **operator decision 2026-08-28**. Correctness-wise 163 depends on nothing, but criterion 2 normalises SQL in a single formatting commit touching exactly the 27 `apps/supabase/supabase/schema/` + migration files Phase 156 rewrites in place under E1(a)/E2(a). Formatting first means the work is redone and the two commits interleave across the same files. Running after 156 transitively places 163 after 155 as well.
**Requirements**: CIGATE-01, CIGATE-02, CIGATE-03
**Success Criteria** (what must be TRUE):

  1. A deliberate sqlfluff violation pushed to a migration turns the GitHub Actions build **red on a job that names `db:lint:sql`**; reverting turns it green. Observed on a real branch run — the script already exists in `package.json` and no job invokes it, so the observed failing run is the entire deliverable, and local simulation does not substitute for it.
  2. `yarn format:check` fails on a mis-formatted `.sql` file and `yarn format` fixes it in place, consistent with how every other file type in this repo behaves. **Prettier cannot parse SQL out of the box and none is configured today** — `prettier.config.mjs` loads no SQL plugin, so `format:check` (`main.yaml:64`) silently skips every `.sql` file; a SQL parser is added and configured for the Postgres dialect as part of this criterion, not assumed present. the newly-covered SQL files are normalised in a single formatting commit so the gate starts from clean rather than from a backlog.
  3. A planted test secret matching the scanner's rules is **caught** and reddens the build; removing it clears the job. The plant is made on a throwaway branch and verified absent from merged history afterwards.
  4. The dependency-vulnerability job runs on every build, its current findings are recorded as an accepted baseline with severities, and it fails the build above the chosen severity threshold — demonstrated by pinning a known-vulnerable version and observing the red, then unpinning.

**Plans**: 9/9 plans executed

- [x] 163-01-PLAN.md
- [x] 163-02-PLAN.md
- [x] 163-03-PLAN.md
- [x] 163-04-PLAN.md
- [x] 163-05-PLAN.md
- [x] 163-06-PLAN.md
- [x] 163-07-PLAN.md
- [x] 163-08-PLAN.md
- [x] 163-09-PLAN.md

> **163-08 is `status: halted`, and the checkbox above records only that a SUMMARY exists.** Its
> [BLOCKING] re-application gate is green and criterion 2 is proven locally on two schema files, but
> the criterion-2 CI halves need pushes that are orchestrator-owned; evidence-ledger rows 9 and 10
> carry `**OWED — no run**`. 163-09 depends on 163-08 and is blocked until those rows carry run URLs.

### Phase 164: `RETURNS TABLE` Nullability — Audit + Single Override Mechanism

**Moved 2026-08-28** from Phase 150 so these gates are asserted against the post-remediation tree rather than one still carrying the 131 open review findings. Scope and criteria are unchanged.

**Corrected 2026-08-28** against the measured tree (`.planning/v2.15-DISCUSSION-POINTS.md` § 0, fact 31): the enumeration is **exactly three** `RETURNS TABLE` RPCs and the roadmap named only two — the third is `resolve_email_variables` (`502-email-helpers.sql:22`) → criterion 1's "at minimum" implied a longer list that does not exist, and now states the complete set.

**Goal**: A null-guard against an RPC column that really is null is not flagged as dead code, and the next consumer does not have to know a folk rule to write one.
**Depends on**: **Phase 157** (transitively Phase 156) — **corrected 2026-08-28 (second pass)**, and it **must not share an execution wave with Phase 163**. The original `Nothing` is measurably wrong on three counts. (1) Phase 156 rewrites the schema and renames `party`→`organization`, regenerating `packages/supabase-types` — and since the chosen remedy (D-M2a) *is* a generated-types override, that regeneration is precisely the reversion event criterion 4 exists to survive. (2) Phase 157 removes casts at `supabaseDataProvider.ts:56/:92/:368-378/:511` in the same file where this phase removes `:300`, and its "grep for casts on adapter reads returns empty" overlaps criterion 3's grep. (3) Criterion 4's regeneration-drift job and Phase 163's three CI jobs both edit `.github/workflows/main.yaml`.
**Requirements**: CIGATE-04, CIGATE-05
**Success Criteria** (what must be TRUE):

  1. **Every** `RETURNS TABLE` RPC in `apps/supabase/supabase/schema/**` is enumerated against its semantically-nullable output columns. Measured, that set is **exactly three, and it is complete** — `resolve_email_variables` (`502-email-helpers.sql:22`, which the roadmap did not name), `get_nominations` (`503-entity-rpcs.sql:11` — `parent_nomination_id` plus the four mutually-exclusive entity-id columns) and `get_candidate_user_data` (`503-entity-rpcs.sql:97`) — so "at minimum" does not imply a longer list waiting to be found. A remedy is chosen and recorded **per RPC**, including the ones where "no change needed" is the answer and why. The enumeration is derived from the schema files, so a future RPC is not missed by having been overlooked in prose.
  2. `parent_nomination_id` reads as `string | null` at the consumer, and a root nomination (where the value IS null) is exercised by a test that **fails if the null-guard is removed** — the guard is proven live, not merely un-flagged by the compiler.
  3. The remedy is **one documented mechanism** (a type-override layer or a restructured RPC), not per-site casts: the Phase-126 ad-hoc cast (`row.parent_nomination_id as string | null | undefined`) in `apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts` is removed — note the `dataProvider/` directory segment, omitted in earlier citations of this path — and a grep for ad-hoc nullability casts on RPC returns comes back empty. ⚠ **Line anchor corrected 2026-09-03:** every prior citation said `:300`; measured, the cast was at **`:360`**, and it has now been removed by `164-01`. The path is therefore given without a line number, because an anchor that was wrong in five places at once (this criterion, the plan's objective, its `must_haves.truths`, its `success_criteria`, and `164-CONTEXT.md` § D-M2) is worse than no anchor. Anchor this cast by its content, not by a line.
  4. Re-running `yarn db:types` does not silently revert the guarantee: regeneration is performed and the type-level nullability survives it, or a check fails loudly when it does not — proven by regenerating and observing the outcome, since silent reversion on the next schema change is the failure mode this requirement exists to prevent.

**Plans**: 5/5 plans executed

- [x] 164-01-PLAN.md
- [x] 164-02-PLAN.md
- [x] 164-03-PLAN.md
- [x] 164-04-PLAN.md
- [x] 164-05-PLAN.md

### Phase 165: Review-Stack Comment Remediation

**Goal**: Every comment left on the v2.15 review stack (PRs #876-#887) — the maintainer's inline comments and GitHub Copilot's — has a recorded disposition, and every actionable one is fixed on one branch stacked on the top of the stack, so the stack can merge with no open review thread.
**Depends on**: Phase 151's stack (PRs #876-#887) as published; Phases 152-164 (their fixes are already in the stack tip).
**Branch**: `ship/v2.15-13-review-fixes`, cut from `ship/v2.15-12-planning` (tree byte-identical to `integration/ship-12-squash` at cut time).
**Requirements**: none mapped (review-remediation phase, like 152-160)
**Success Criteria** (what must be TRUE):

  1. A disposition ledger lists **every** inline comment and every non-empty review body on #876-#887, each classified as `fix`, `split-artifact` (the defect exists only in an intermediate slice and the stack tip is already correct — verified at the tip, not assumed), `already-fixed` (cite the commit), or `deferred` (only where the maintainer said so, e.g. the adapter-selection entrypoint work on #880), with evidence per row.
  2. Every `fix` row is implemented at the stack tip, and each maintainer comment is addressed as written (renames, moves, inlined styles, removed prose, column documentation, schema cleanups).
  3. The comment-hygiene rules (the `ship-review-stack` codemod + `hygiene-grep-report.sh --assert-clean`, the maintainer's no-historical-narrative / no-excess-prose rule, and the code-review checklist) hold for **every file changed** on the branch.
  4. `yarn build`, `yarn lint:check`, `yarn format:check`, `yarn test:unit`, pgTAP and the full E2E suite all pass on the branch — zero failed, zero did-not-run.
  5. Each addressed thread on GitHub can be answered with a one-line reply pointing at the fixing commit, or at the ledger row for a split-artifact or deferred item.

**Plans**: 36/36 plans complete

Plans:
**Wave 1**
- [x] 165-01-PLAN.md — Phase instruments: per-changed-file hygiene gate, code-identity proof, fail-closed negative grep, E2E verdict, 78-row ledger skeleton + completeness check (wave 1)

**Wave 2** *(blocked on Wave 1 completion)*
- [x] 165-02-PLAN.md — No-code dispositions: 25 split-artifact, 1 already-fixed, 1 wont-fix proven at the tip; deferred adapter-selection todo (wave 2)
- [x] 165-03-PLAN.md — Schema hygiene: `302-rls.sql` (comment-only, code-identical) (wave 2)
- [x] 165-04-PLAN.md — pgTAP hygiene: 05, 07, 09, 29 (wave 2)
- [x] 165-05-PLAN.md — Experimental packages: flat condenser result, restored JSDoc examples, generateBoth coverage (wave 2)
- [x] 165-06-PLAN.md — Frontend-local grant types, supabase-types parity + boundary test, client-type alias (wave 2)
- [x] 165-07-PLAN.md — Hygiene pre-clean: `scripts/assert-project-scoped-queries.mjs` (wave 2)

**Wave 3** *(blocked on Wave 2 completion)*
- [x] 165-08-PLAN.md — Schema hygiene: `301-auth-functions.sql`, `303-column-grants.sql` (wave 3)
- [x] 165-09-PLAN.md — pgTAP hygiene: 12, 18, 28 (wave 3)
- [x] 165-10-PLAN.md — dev-seed message and comment fixes; perm teardown reopens the project in `finally` (wave 3)
- [x] 165-11-PLAN.md — `supabaseDataProvider` helpers moved to `supabase/utils` and the type file, guard registration (wave 3)
- [x] 165-20-PLAN.md — Planning-record corrections (163-VALIDATION, three todos) (wave 3)

**Wave 4** *(blocked on Wave 3 completion)*
- [x] 165-12-PLAN.md — Schema hygiene: `400-storage.sql`, `011-validation-functions.sql` (wave 4)
- [x] 165-13-PLAN.md — pgTAP hygiene: 10, 17, 22 (wave 4)
- [x] 165-14-PLAN.md — Root tooling: edge-env guard family, keygen usage, CI E2E keys (wave 4)
- [x] 165-15-PLAN.md — Contexts/utils: `sameRefs` move, pointer-cancel focus, spacing drift test, `logLevel` prose, writer-caching verdict (wave 4)

**Wave 5** *(blocked on Wave 4 completion)*
- [x] 165-16-PLAN.md — Schema hygiene: remaining function/utility files (wave 5)
- [x] 165-17-PLAN.md — pgTAP hygiene: 19, 20, 25 (wave 5)
- [x] 165-18-PLAN.md — dev-seed stops producing `is_generated` (wave 5)
- [x] 165-19-PLAN.md — App shell: per-token `safeGetSession` memo, `loadEnv` empty-shell fix, located-layout test mock (wave 5)
- [x] 165-22-PLAN.md — Docs: routing page `getRoute.current`; docs-site style blocks inlined (wave 5)

**Wave 6** *(blocked on Wave 5 completion)*
- [x] 165-21-PLAN.md — Table-file hygiene + column documentation for every table; migration clean end to end (wave 6)
- [x] 165-23-PLAN.md — send-email contract, string-only `getLocalized`, local-adapter filter parity (wave 6)

**Wave 7** *(blocked on Wave 6 completion)*
- [x] 165-24-PLAN.md — Interim cardinal gate over waves 2-6 (alone; full pgTAP + E2E) (wave 7)

**Wave 8** *(blocked on Wave 7 completion)*
- [x] 165-25-PLAN.md — Type-aware entity authorization (`user_can`, `entity_project_id`, `is_child_nominee`, `get_entity_basic_data`) + collision negative control (wave 8)

**Wave 9** *(blocked on Wave 8 completion)*
- [x] 165-26-PLAN.md — Typed `upsert_answers` + census of every id-taking function (wave 9)

**Wave 10** *(blocked on Wave 9 completion)*
- [x] 165-27-PLAN.md — `is_generated` removed everywhere; entity tables in `organizations`' column order (wave 10)

**Wave 11** *(blocked on Wave 10 completion)*
- [x] 165-28-PLAN.md — Feedback insert guard (`enforce_feedback_project`) + negative control (wave 11)

**Wave 12** *(blocked on Wave 11 completion)*
- [x] 165-29-PLAN.md — Password validation moved from app-shared to `lib/utils/password-validation` (wave 12)

**Wave 13** *(blocked on Wave 12 completion)*
- [x] 165-30-PLAN.md — `*-ftn` provider keyword rename + FTN config names; maintainer `.env` checkpoint (wave 13)

**Wave 14** *(blocked on Wave 13 completion)*
- [x] 165-31-PLAN.md — Style inlining A: `ImagePart` and input family, base components; compiled-class checker (wave 14)

**Wave 15** *(blocked on Wave 14 completion)*
- [x] 165-32-PLAN.md — `QuestionChoices` constants/cn/narrative; style inlining B: questions, ScoreGauge, Video (wave 15)

**Wave 16** *(blocked on Wave 15 completion)*
- [x] 165-33-PLAN.md — Style inlining C: Header, Banner, dynamic components, route pages; repo-wide style census (wave 16)

**Wave 17** *(blocked on Wave 16 completion)*
- [x] 165-34-PLAN.md — Branch-wide hygiene sweep: read coverage, allowlist review, second read, checklist (wave 17)

**Wave 18** *(blocked on Wave 17 completion)*
- [x] 165-35-PLAN.md — Final cardinal gate on the gated commit (wave 18)

**Wave 19** *(blocked on Wave 18 completion)*
- [x] 165-36-PLAN.md — Ledger completion, push, PR 13/13 and CI to green (no thread replies) (wave 19)

**Cross-cutting constraints:**
- Only comments and single-quoted literals changed: `code-identity.mjs --blank-sql-literals ship/v2.15-12-planning WORKTREE <file>` exits 0 for each file, and every changed literal is an assertion description.
- The targeted pgTAP run (`00-helpers` plus the three files) reports `Result: PASS` with the same `Tests=` total as before the rewrite.
- Every changed file is hygiene-clean.

### Phase 165.1: Results Navigation Redraw

**Added 2026-09-22** (as Phase 165 on `feat/165-results-navigation-redraw`, PR #888; renumbered 165.1 on 2026-09-29 because Phase 165 on PR #889 already held the number) from spikes 031-034 (`.planning/spikes/031-*` … `034-*`, branch `spike/results-redraw`, worktree `../voting-advice-application-spike`). The spike branch carries a working prototype of every item behind a `lib/spike/` "redraw lab" toggle panel; this phase replaces it with production code and deletes the lab.

**Goal**: Navigating within the voter results — switching entity tabs, opening an entity, switching tabs inside it, closing it — never remounts or repaints what did not change, never moves the scroll position, and never paints the page above an open overlay.
**Depends on**: Nothing in v2.15 (frontend-only; touches no schema, adapter or CI surface). Must be merged onto `integration/ship-12-squash` after the session debugging that branch is done.
**Requirements**: RNAV-01, RNAV-02, RNAV-03, RNAV-04, RNAV-05, RNAV-06 — mapped one-to-one onto the six success criteria below and **registered by this phase** in `.planning/REQUIREMENTS.md` under decision D-22 (plan 165.1-08), together with the milestone-counter correction D-22 couples to it.
**Success Criteria** (what must be TRUE):

  1. **No results navigation remounts the results subtree.** Root cause (spike 031): `(located)/+layout.ts` untracks its params but reads `url.pathname` / `url.search` tracked for the `next=` redirect target, so the load reruns on every path change, re-streams question + nomination data, `(located)/+layout.svelte` sets `ready = false` and `<Loading/>` replaces the subtree. A unit test drives the load with a read-recording `url` and fails on any tracked read, with a positive control proving it catches the old read.
  2. **Scroll is preserved** on entity open, entity close and entity-tab switch (from a scrolled position, not only from the top), observed in the browser.
  3. **No document View Transition paints above an open modal.** Overlay open/close navigations run no document VT; any VT that runs while a modal dialog is open runs with every `view-transition-name` stripped. The header is covered by the backdrop from the first frame; a drawer-tab switch never shows the results page in front of the drawer.
  4. **Results routes follow the layout**: an `[electionTab]` level rendering that election's entity-type tabs, an `[entityTab]` level rendering the list + filters, and an `[entity]/[id]` nomination page that opens the overlay. Existing URLs keep working (or redirect), and the implied-default-tab case does not remount the list.
  5. **One app-wide drawer host** in the root layout serves the entity-details overlay AND the extended-question-info drawer: entity → entity navigation swaps content without reopening, closing animates out, and hosted content is safe against its opener unmounting (spike 034 found a close that hung the dialog). The mechanism (payload + context bridge vs. global shell + portal) is decided at discuss-phase.
  6. **The spike scaffolding is gone**: no `lib/spike/`, no `// SPIKE` call sites, no `/results-layered` tree; E2E voter results specs pass.

**Plans**: 9/9 plans executed

Plans:

- [x] 165.1-05.1-PLAN.md

**Wave 1**

- [x] 165.1-01-PLAN.md — Branch off `integration/ship-12-squash`, transport the phase documents and spike records, open the evidence doc, and take both baseline measurements (the cold-`/results` hazard, the D-09 emitter derivation) (wave 1)

**Wave 2** *(blocked on Wave 1)*

- [x] 165.1-02-PLAN.md — **TRACER**: one entity opens and closes end-to-end through the new app-wide drawer host, with the four validated fixes in production form, the two unit guards, and NC-1 (wave 2)

**Wave 3** *(blocked on Wave 2)*

- [x] 165.1-03-PLAN.md — The committed navigation-behaviour spec: scroll survival from a scrolled start, the two View-Transition invariants, node identity, plus its fixture and its own Playwright project (wave 3)

**Wave 4** *(blocked on Wave 3)*

- [x] 165.1-04-PLAN.md — Route split per D-08: statistics re-homed (D-25), the shared route builder, the entity-tab level, the innermost page, and the leaf guards pinned (wave 4)

**Wave 5** *(blocked on Wave 4)*

- [x] 165.1-05-PLAN.md — The extended question info served by the same host (D-13), exercised through it, and the two callerless per-route drawers deleted (wave 5)

**Wave 6** *(blocked on Wave 5)*

- [x] 165.1-06-PLAN.md — The standing scaffolding guard (D-20) and the remaining negative controls NC-2..NC-6, closing the evidence document (wave 6)

**Wave 7** *(blocked on Wave 6)*

- [x] 165.1-07-PLAN.md — Phase gate: every static gate forced at one head, the full E2E suite under the cardinal rule, the accessibility scan, and the visual run in the pinned container with its human judgement (wave 7)

**Wave 8** *(blocked on Wave 7)*

- [x] 165.1-08-PLAN.md — Register RNAV-01..06 with recounted counters (D-22), add the `results-redraw` skill domain (D-23), state the two invariants in `CLAUDE.md` (D-24), close the folded todo and record every residue (wave 8)

### Phase 166: Retire `auth_user_id` — Entity Identity from Grants

**Added 2026-09-24.** Phase 162 moved all authorisation onto `public.grants` and kept `auth_user_id` only as an identity link (discussion point B7(a), chosen for scope, not substance). No RLS policy, storage policy or token claim reads it any more; two readers and two writers remain.

**Goal**: The grant is the only link between an auth user and an entity. "Which entity am I" is answered from the entity-scope grant, the invite and identity-callback flows write one link instead of two, and no public row exposes an auth user id.
**Depends on**: PR #888 (Phase 165.1) merged onto the v2.15 review stack. Touches files in #877's slice (the supabase schema, Edge Functions and pgTAP), which Phase 165 (Review-Stack Comment Remediation, PR #889) also edited, so plan it against the stack tip after #889.
**Requirements**: AUTHID-01 … AUTHID-09 — registered at planning on 2026-10-01 in `.planning/REQUIREMENTS.md` § Entity Identity (Phase 166).
**Success Criteria** (draft, to be firmed at planning):

  1. **`get_candidate_user_data` resolves the caller's own entity from an `(entity, <type>, editor)` grant** held by `auth.uid()`, joined to the entity table and filtered by project — **not** through `user_can`, which is also true for project and account admins and would hand an admin an arbitrary candidate. `grants` is revoked from `authenticated`, so the lookup reads the table as `SECURITY DEFINER` (preferred: no dependence on token freshness) or parses the `grants` claim. More than one match in a project is an error, not `LIMIT 1`.
  2. **`identity-callback`'s `findExistingCandidate` looks up by grant**, and `createCandidate` no longer writes the column.
  3. **`invite-candidate` writes the grant only**; its step 7 and the rollback branch that exists because of it (162-REVIEW WR-07) are removed.
  4. **A decision on how many users one entity may have**, made explicitly: a partial unique index keeping one user per candidate (matches the 162 user-rights model, where Candidate is the only candidate-scope user type), or none (allows a future delegated editor, who would then be indistinguishable from the candidate). Organizations gain multi-editor support either way, which the single column could not represent.
  5. **The column is gone** from `candidates` and `organizations`, with its two indexes, its column-grant entries, `seed.sql`, the dev-seed allowed keys, the regenerated types, the pgTAP fixtures and negative checks (05, 09, 21 and others) and the E2E admin client (`forceRegister`, `sendEmail`, `unregisterCandidate`).
  6. **`anon` can no longer read any auth user id** — asserted by pgTAP, observed failing against today's tree first.
  7. **Every comment the phase touches passes the hygiene rules** — each comment it adds or changes is judged against [`CLAUDE.md` § Comment Hygiene](/CLAUDE.md#comment-hygiene): **no historical narrative** (what the code used to do, how a defect was found, which run or spike diagnosed it — the git history carries that), no planning reference beyond the bare `see phase N` / `see spike N` form, no explanation addressed to the reviewer, concise, and present only where the code cannot explain itself. In particular, no comment narrates the retirement of `auth_user_id`; the code reads as if the grant had always been the link.
  8. Gates: pgTAP, unit, the candidate and bank-auth E2E specs (bank-auth under its 3× determinism gate), then the full E2E suite under the cardinal rule.

**Plans**: 4/4 plans complete

Plans:
**Wave 1**
- [x] 166-01-PLAN.md — Make "which entity am I" come from the grant: the `private.caller_entity_ids` SECURITY DEFINER helper, `get_candidate_user_data` over it, the one-user-per-candidate partial unique index and the anon auth-user-id census (TODO-wrapped until the drop), while the link column still exists (wave 1)

**Wave 2** *(blocked on Wave 1 completion)*
- [x] 166-02-PLAN.md — Move every reader and writer outside the database onto the grant: `identity-callback` grant lookup with compensating delete, `invite-candidate` link step and its rollback arm removed, the E2E admin client and bank-auth specs off the column (wave 2)

**Wave 3** *(blocked on Wave 2 completion)*
- [x] 166-03-PLAN.md — Drop the column atomically with its indexes, comments, seed value, dev-seed keys, column map, regenerated migration and types and pgTAP fixtures; the census goes green and the vacuous guards go (wave 3)

**Wave 4** *(blocked on Wave 3 completion)*
- [x] 166-04-PLAN.md — Phase gate in D-20 order (static, unit, pgTAP, candidate E2E, bank-auth and bank-auth-journey 3x, full suite under the cardinal rule), the database skill and saved-answers todo updated, the two residues filed as todos (wave 4)

### Phase 167: Origin/main Vestige Cleanup

**Added 2026-10-01** from the origin/main-era vestige sweep (`.planning/quick/261001-n8y-remove-the-legacy-src-lib-i18n-translati/261001-n8y-VESTIGES.md`), which fixed the safe items and deferred the rest. This phase discharges the code-side deferrals; the docs pages go to Phase 168 and the dependency versions to Phase 169.

**Goal**: No origin/main-era vestige survives in code, tests, manifests or planning state, and the session-lookup cost of `safeGetSession` is pinned by a test.
**Depends on**: Phase 166.
**Requirements**: VEST-01 … VEST-09 — registered at planning on 2026-10-01 in `.planning/REQUIREMENTS.md` § Origin/main Vestige Cleanup (Phase 167).
**Success Criteria** (draft, to be firmed at planning):

  1. **`apps/frontend/src/lib/supabase/safeGetSession.ts` has a unit test asserting it makes no needless round trips** — the number of auth/DB calls per invocation (and across repeated calls in one request, if it caches) is asserted, not just the return value. If such a test already exists, cite it; otherwise add one and observe it fail against a deliberately chatty variant first.
  2. **`BACKEND_API_TOKEN` is gone** — the constant in `apps/frontend/src/lib/server/constants.ts` and its `''` entries in the 7 auth test mocks.
  3. **`PUBLIC_BROWSER_BACKEND_URL` / `PUBLIC_SERVER_BACKEND_URL` are resolved** — either the `/api/cache` route (`cachifyUrl`, `universalAdapter.test.ts`) is shown to still proxy a live backend and the pair is documented in `.env.example`, or the route and the pair are removed. Decide against the adapter todos (`2026-08-28-reintroduce-the-local-data-adapter.md`, `2026-09-27-adapter-selection-entrypoints.md`).
  4. **Unused dependencies removed** — the docs-app devDependencies and the LLM-package entries the sweep listed (`jsonrepair`, `dotenv`, `js-yaml` + `@types/js-yaml` in question-info, the docs-app ESLint duplicates after a per-workspace lint run), plus `@testing-library/jest-dom` and `eslint-plugin-svelte` in the frontend, with `security/audit-baseline.json` updated in the same commit so the CI audit check stays green. `@vitest/coverage-v8` is decided explicitly (keep with a reason, or remove).
  5. **`apps/docs/src/lib/components/openVAALogo/OpenVAALogo.svelte` uses Svelte 5 runes** — no `export let`, no `$$Props`; the VESTIGES sweep #14 returns zero.
  6. **Todo `2026-08-28-vite-envdir-root-would-fix-six-empty-constants.md` is checked against `svelte.config.js` `env.dir`** and closed if stale (or narrowed to what remains).
  7. **`.planning/quick/261001-n8y-*/gate-evidence/` is inspected for local keys or secrets, then deleted**, never committed. What was found (or that nothing was) is recorded in the phase summary without reproducing any value.
  8. Every linked todo the phase discharges is moved to `done/`. Every comment touched passes [`CLAUDE.md` § Comment Hygiene](/CLAUDE.md#comment-hygiene).
  9. Gates: typecheck, lint, unit, production build, `yarn audit:deps` (with the baseline change), then the full E2E suite under the cardinal rule.

**Plans**: 6/6 plans complete

Plans:
**Wave 1**
- [x] 167-01-PLAN.md — Strengthen `safeGetSession.test.ts` to pin every client round trip, each assertion observed failing against a deliberately chattier variant first (wave 1)

**Wave 2** *(blocked on Wave 1 completion)*
- [x] 167-02-PLAN.md — Remove the `/api/cache` proxy and every env, constant, helper, dependency and template mention only it read, `BACKEND_API_TOKEN` included, in one commit (wave 2)

**Wave 3** *(blocked on Wave 2 completion)*
- [x] 167-03-PLAN.md — Declare `js-yaml` (and its types) in `@openvaa/llm`, the package that imports it (wave 3)

**Wave 4** *(blocked on Wave 3 completion)*
- [x] 167-04-PLAN.md — Remove every unused dependency the phase owns, import `eslint-plugin-svelte` explicitly with lint output proven unchanged, prove lint rules still fire, and hand-edit the audit baseline for the `@testing-library/jest-dom` removal (wave 4)

**Wave 5** *(blocked on Wave 4 completion)*
- [x] 167-05-PLAN.md — Port the docs app's last two Svelte 4 components to runes and correct the stale env-loading comment in `apps/frontend/vite.config.ts` (wave 5)

**Wave 6** *(blocked on Wave 5 completion)*
- [x] 167-06-PLAN.md — Phase close: inspect and delete `gate-evidence/`, run the full gate set ending in one full E2E run, reconcile todos, VESTIGES rows and comment hygiene (wave 6)

### Phase 168: Docs-Site Rewrite — Strapi to Supabase

**Added 2026-10-01.** About 30 `apps/docs` pages still describe the Strapi backend (25 with the "legacy Strapi backend" banner); the full list is in 261001-n8y-VESTIGES.md § Deferred `apps/docs` pages. **Widened the same day (operator):** alongside the Supabase rewrite, every other docs page is checked and brought up to date. The research interludes (the `<ResearchQuote>` blocks, `apps/docs/src/lib/components/ResearchQuote.svelte`) are not edited.

**Goal**: Every page of the docs site describes the system that exists — Supabase backend, Edge Functions, the current i18n, dev-seed and env model, the current features and settings — with no Strapi-era page, banner or nav entry left, and its information architecture reorganised where the old structure no longer fits.
**Depends on**: Phase 167 (env and dependency decisions the pages must describe).
**Requirements**: DOCS-01 … DOCS-08 — registered at planning on 2026-10-01 in `.planning/REQUIREMENTS.md` § Docs Site (Phase 168).
**Success Criteria** (draft, to be firmed at planning):

  1. **Every page on the VESTIGES list is rewritten, merged or deleted** — page structure may change freely; `navigation.config.ts` drops the Strapi entries ("Strapi", "OpenVAA admin tools plugin for Strapi", "Localization in Strapi", "Registration Process in Strapi") and links the new structure. `about/roadmap`'s historical mention may stay.
  2. **Every other docs page is audited for staleness** — `about/`, `developers-guide/`, `publishers-guide/`, the generated component pages and the landing page — and each out-of-date claim is fixed. The audit records each page as current / updated / deleted. **Research interludes (`<ResearchQuote>` blocks and their content) are left byte-identical** — asserted by diffing them against the phase base.
  3. **The VESTIGES sweeps #1, #2, #5–#7, #9, #10 return no hit under `apps/docs`** other than recorded intentional ones.
  4. **Every factual claim is verified against the codebase** (commands, env names, file paths, flows) — no describing behaviour from memory.
  5. **Candidate-flow pages match the current flows**; the related todos (`password-reset-code-method.md`, `register-page-registrationkey-method.md`, `configurable-mock-data.md`) are cross-checked and updated or closed.
  6. **The broken docs scripts are dealt with** per `2026-08-28-broken-docs-script-references.md` (typedoc generation and the commented-out `getTypeDocLink`), or that todo is explicitly left open with a reason.
  7. Gates: docs build, docs lint/check, link check (no broken internal links).

**Plans**: 9/9 plans complete

Plans:
**Wave 1**
- [x] 168-01-PLAN.md — Build and prove the verification instruments before any page is rewritten: the extended link checker with `--check`, the ResearchQuote span gate, the claims and command checker, and the audit ledger opened with every base page (wave 1)

**Wave 1.1** *(blocked on 168-01 completion)*
- [x] 168-01.1-PLAN.md — Make docs lint real and part of the root gate, repair or delete the broken docs scripts, make the generator prune pages for deleted components, and remove the dependencies that lose their last consumer (wave 1.1)

**Wave 2** *(blocked on Wave 1 completion)*
- [x] 168-02-PLAN.md — Lay down the D-02 information architecture as a skeleton: moved pages, new pages, redirect stubs, the rewritten `navigation.config.ts` and every inbound reference repointed (wave 2)

**Wave 3** *(blocked on Wave 2 completion)*
- [x] 168-03-PLAN.md — Write the Backend (Supabase) section and the Seed data page against the post-166/167 code, with a script-verified claim ledger (wave 3)
- [x] 168-04-PLAN.md — Rewrite the getting-started and operations pages (Quick start, Architecture, Development, Configuration except App settings, Deployment, Troubleshooting) (wave 3)
- [x] 168-05-PLAN.md — Rewrite the Frontend and Localization sections for Svelte 5 runes, the Supabase data adapters and Paraglide i18n (wave 3)
- [x] 168-06-PLAN.md — Write the Candidate app section, the Admin app page and both app-settings pages from the code, documenting behaviour without changing it (wave 3)

**Wave 4** *(blocked on Wave 3 completion)*
- [x] 168-07-PLAN.md — Regenerate the generated pages with the pruning generator, document the pipeline, audit Contributing, About, the landing page and the Publishers' Guide without touching a research block, and fold every verdict into the ledger (wave 4)

**Wave 5** *(blocked on Wave 4 completion)*
- [x] 168-08-PLAN.md — Phase close (non-autonomous): the full gate set and sweeps, safe commands run with redacted evidence, one independent `gsd-doc-verifier` pass reconciled against the ledgers, the four todos settled and the residue filed (wave 5)

### Phase 169: Dependency Bump to Latest Safe Versions

**Added 2026-10-01.** The 261001-n8y sweep observed `yarn audit:deps` failing with 7 new high+ advisories that predate it — `brace-expansion` ×6 and `undici` ×1. Re-measured at planning (2026-10-01) the gate shows 9 NEW (`brace-expansion` ×6, `devalue` ×2, `undici` ×1). The `vitest`, `@vitest/browser`, `@sveltejs/kit`, `tar`, `shell-quote` and `@faker-js/faker` findings are accepted baseline rows, and every accepted row now has a fixed version published.

**Goal**: Every dependency in every workspace is on its latest safe version, new majors included, with the code migrated to any breaking changes and every gate green.
**Depends on**: Phases 167 and 168 (runs on the cleaned dependency set).
**Requirements**: DEPS-01 … DEPS-16 — registered at planning on 2026-10-01 in `.planning/REQUIREMENTS.md` § Dependency Bump (Phase 169).
**Success Criteria** (draft, to be firmed at planning):

  1. **Every direct dependency in root, `apps/*` and `packages/*` is at its latest version** unless a recorded reason holds it back (a known regression, an unreleased peer, the LocalStack-style pin rule). "Safe" is defined at planning (e.g. a minimum release age, no open advisory).
  2. **Majors are migrated, not suppressed** — each major bump lands with its code/config migration, grouped so a failing gate points at one upgrade.
  3. **`yarn audit:deps` passes**: every row with a published fix is fixed; `security/audit-baseline.json` keeps only no-fix or recorded-hold rows, each with a current note; todo `2026-09-03-dependabot-alert-list-is-stale-against-main.md` is updated and stays pending until v2.15 merges.
  4. Gates: typecheck, lint, svelte-check, unit, pgTAP, production builds (frontend and docs), then the full E2E suite under the cardinal rule.

**Plans**: 13/13 plans complete

Plans:
**Wave 1**
- [x] 169-01-PLAN.md — Group 0: confirm upstream phases and the D-02 roadmap amendment, the version/age table, the 7-day age gate, the audit-liveness re-key and the in-range lockfile refresh (wave 1)

**Wave 2** *(blocked on Wave 1 completion)*
- [x] 169-02-PLAN.md — Group 1, toolchain: Yarn 4.18, then Node 24 as one isolated commit with its own gate run, image build, E2E and observed CI run, then `@types/node` 24 and TypeScript 6 (wave 2)

**Wave 3** *(blocked on Wave 2 completion)*
- [x] 169-03-PLAN.md — Group 2, lint and format: `eslint-plugin-import-x`, `eslint-plugin-svelte` 3, FlatCompat removal, ESLint 10, and the formatter/sorter majors each with its own reformat commit (wave 3)

**Wave 4** *(blocked on Wave 3 completion)*
- [x] 169-04-PLAN.md — Group 4, test stack (run before group 3 because Vite 8 needs a Vitest that accepts it): one Vitest major with `test.projects`, jsdom 30 + dompurify 4, Playwright 1.63, DaisyUI/Tailwind minors (wave 4)

**Wave 5** *(blocked on Wave 4 completion)*
- [x] 169-05-PLAN.md — Group 3, build: inline restart plugin replacing `vite-plugin-restart`, Kit 2.70 with the 2.x-line adapters, then Vite 8 and vite-plugin-svelte 7 through the catalog (wave 5)

**Wave 6** *(blocked on Wave 5 completion)*
- [x] 169-06-PLAN.md — Group 5a: the Supabase CLI with its CI pins and regenerated types, then local Postgres 15 to 17 as its own commit, pgTAP and E2E after each (wave 6) — CLI 2.118.0 + pins + types done; **local Postgres 17 DEFERRED pending an operator ruling** (todo `2026-10-03-pg17-local-blocked-on-is-valid-choice-id-volatility.md`; blocks 169-13's PG17 gate)

**Wave 7** *(blocked on Wave 6 completion)*
- [x] 169-07-PLAN.md — Group 5b: supabase-js and `@supabase/ssr`, then the Deno Edge Function imports, with the auth gates, the full E2E suite and bank-auth 3x (wave 7)

**Wave 8** *(blocked on Wave 7 completion)*
- [x] 169-08-PLAN.md — Group 6: `@faker-js/faker` 10 with old-vs-new seed output diffed before the bump lands (wave 8)

**Wave 9** *(blocked on Wave 8 completion)*
- [x] 169-09-PLAN.md — Group 7: migrate `ai` and the `@ai-sdk/*` providers in `packages/llm` and remove the importer-less `openai` (wave 9)

**Wave 10** *(blocked on Wave 9 completion)*
- [x] 169-10-PLAN.md — Group 8: the remaining small majors one commit each, plus the completeness sweep for unassigned majors and consumer-less catalog entries (wave 10)

**Wave 11** *(blocked on Wave 10 completion)*
- [x] 169-11-PLAN.md — Group 9: GitHub Actions majors, the trufflehog patch and the Pages actions, observed through `ci-evidence/**` at job level (wave 11)

**Wave 12** *(blocked on Wave 11 completion)*
- [x] 169-12-PLAN.md — Group 10 (non-autonomous): SvelteKit 3 with adapter-node 6 and adapter-static 4 behind an operator checkpoint if they clear the 30-day rule, else a recorded hold (wave 12)

**Wave 13** *(blocked on Wave 12 completion)*
- [x] 169-13-PLAN.md — Group 11 and phase gate: audit baseline reconciled, moderate/low advisories listed, final version table, todos filed, then the full gate set and full E2E on PG17 on one HEAD (wave 13)

## Progress

**Active milestone: v2.15 Trustworthy Foundations — Guards, Seed Data & CI Coverage** — Phases 137-169 (35 phases incl. 142.1, 157.1, 157.2, 162.1 and 165.1; 148 absorbed into 147): 31 complete and 4 pending (166-169), all four planned on 2026-10-01 (166: 4 plans, 167: 6, 168: 9, 169: 13). Phase 165 — Review-Stack Comment Remediation maps no requirement; Phase 165.1 — Results Navigation Redraw is an addendum that registered RNAV-01..06. **152/152 requirements mapped** — the 39 original, the review-remediation set added 2026-08-28, PERMFU-01..10, RNAV-01..06, and AUTHID-01..09, VEST-01..09, DOCS-01..08 and DEPS-01..16 registered at planning for 166-169 (recounted with the scoped awk recorded in REQUIREMENTS.md's coverage note). Plan counts are set per phase by `/gsd-plan-phase`.
_(**Recounted 2026-09-29** when the two planning records were merged: the phase count is `ls .planning/phases | grep -v '^999' | wc -l` → 32, of which 31 hold a SUMMARY.md for every PLAN.md and Phase 166 holds no plan yet; the requirement count is the scoped awk over REQUIREMENTS.md's § Traceability recorded in its own coverage note → 110. Phase 165.1 was numbered 165 on its own branch (`feat/165-results-navigation-redraw`, PR #888) and renumbered when it was rebased onto `ship/v2.15-13-review-fixes` (PR #889), which had already used 165. The Phases 167-171 placeholders PR #888 had added — per-PR review fixes for #876-#887 — were dropped as superseded by Phase 165.)_

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 137. E2E Preflight Integrity — Assert the Served Application | 0/TBD | Not started | - |
| 138. DEF-135-04 — `EPERM-07` Root Cause + Waiver Discharge | 6/6 | Complete   | 2026-08-14 |
| 139. Single-Source Sweep Findings — Confirm or Withdraw | 7/7 | Complete    | 2026-08-14 |
| 140. Blind-Matcher Remediation — Teardowns, Null-Matchers, Positive Controls | 6/6 | Complete    | 2026-08-18 |
| 141. Package Unit-Test Coverage + `test:unit` Invariant Guard | 5/5 | Complete    | 2026-08-18 |
| 142. Assertion Design — Wiring-Only Tests Assert Output | 6/6 | Complete    | 2026-08-21 |
| 142.1 Provider `getIdTokenClaims` Duplication — Make A-07 Reach Production | 3/3 | In Progress|  |
| 143. `svelte/store` Guard — App-Wide Reach + Fallout Triage | 0/TBD | Not started | - |
| 144. Seed-Template Strict Typing + Unknown-Prop Guard | 7/7 | Complete    | 2026-08-23 |
| 145. Default Seed Template Repair | 9/9 | Complete    | 2026-08-24 |
| 146. Visual Gate — Self-Hosted Inter, Height-Independent Sensitivity, Re-baseline | 9/9 | Complete    | 2026-08-26 |
| 147. Candidate-App Scan Reach — Blocking Axe + Raw-Key Gate | 5/5 | Complete    | 2026-08-27 |
| 148. Candidate-App A11y Remediation to Zero | — | Absorbed into 147 | 2026-08-27 |
| 151. Ship v0.2 Akita — Review Stack & Commit-History Restructure | 19/19 | Complete    | 2026-08-18 |
| 152. Comment & Naming Hygiene Sweep | 15/15 | In Progress|  |
| 153. Build & Tooling Config Correctness | 11/11 | Complete|  |
| 154. dev-seed Determinism & Template Validation | 4/4 | In Progress|  |
| 155. Edge Function Hardening — env, JWT, provider identity | 6/6 | In Progress|  |
| 156. Supabase Schema Corrections — naming, constraints, grants | 10/10 | Complete    | 2026-08-30 |
| 157. Adapter Boundary & Typing | 0/TBD | Not started | - |
| 158. Routing & Auth Surface Harmonisation | 17/17 | Complete    | 2026-09-02 |
| 159. Component & Context Consolidation | 11/11 | Complete    | 2026-09-03 |
| 160. Agent Docs & Skills Refresh | 9/9 | Complete    | 2026-09-14 |
| 161. Project Scoping — `PROJECT_ID` Parameterisation | 19/19 | In Progress|  |
| 162. Permissions & Auth Model Refactor | 21/21 | Complete    | 2026-09-20 |
| 163. CI Gates — SQL Lint/Format + Secrets & Vulnerability Scanning _(was 149)_ | 9/9 | Complete    | 2026-09-04 |
| 164. `RETURNS TABLE` Nullability — Audit + Single Override Mechanism _(was 150)_ | 5/5 | Complete    | 2026-09-03 |
| 165. Review-Stack Comment Remediation | 36/36 | Complete    | 2026-09-29 |
| 165.1. Results Navigation Redraw | 9/9 | Complete    | 2026-09-24 |
| 166. Retire `auth_user_id` — Entity Identity from Grants | 4/4 | Complete    | 2026-10-02 |
| 167. Origin/main Vestige Cleanup | 6/6 | Complete    | 2026-10-02 |
| 168. Docs-Site Rewrite — Strapi to Supabase | 9/9 | Complete    | 2026-10-02 |
| 169. Dependency Bump to Latest Safe Versions | 13/13 | Complete    | 2026-10-04 |
| 170. Contestant App Rename — Symbols & Routes | 4/4 | Complete    | 2026-10-07 |
| 171. Project Settings — Served Entity Types & Registration-Mode Matrix | 4/4 | Complete    | 2026-10-07 |
| 172. Terms of Use per User and Project | 9/9 | Complete    | 2026-10-07 |
| 173. Multi-Entity Grants & Entity Selection | 13/13 | Complete    | 2026-10-09 |
| 174. Invitations — Grants Defined in Advance | 10/10 | Complete    | 2026-10-07 |
| 174.1. Terms-of-Use Gate — Phone Width & Focus (INSERTED) | 2/2 | Complete | 2026-10-08 |
| 175. Organization Editing — Profile, Questions & Preview | 13/13 | Complete    | 2026-10-09 |
| 176. Contestant Home, Task State & Nominations View | 19/19 | Complete    | 2026-10-10 |
| 177. Define Nominations | 21/21 | Complete; verified 2026-10-11 with no gap, 13 human-verification items accepted by the operator 2026-10-12 | 2026-10-12 |
| 177.1. Invitations — Entity Confirmation & Nominations Defined in Advance (INSERTED) | 8/8 | In Progress | - |
| 178. Sign-in, Email & Code Registration | 24/24 | In Progress | - |
| 179. Identity-Provider Registration & Coverage Close | 24/24 | In Progress | - |
| 179.1. Review Fixes — Access, Database Rules & Contestant App Behaviour (INSERTED) | 90/90 | Complete; verified 2026-11-11, WR16K UAT 7 passed and 4 deferred to backlog 999.2 to 999.4 | 2026-11-11 |
| 179.2. Admin App Account Flows — Landing, Set Password & Recovery (INSERTED) | 4/4 | Complete; verified 2026-11-12 after the review fixes, full run 729/729 | 2026-11-12 |
| 180. Edge Functions — Typecheck & Shared Modules | 3/3 | Complete; verified 2026-11-13, UAT 3 passed and 1 deferred (WR-01), full run 180-final-r2 729/729 | 2026-11-13 |

**Shipped milestones:**

| Milestone | Phases | Plans | Status | Shipped |
|-----------|--------|-------|--------|---------|
| v2.14 E2E Coverage Expansion + Svelte 5 Idiom Polish + svelte-check Zero | 118-136 | 101/101 | ✅ Shipped | 2026-08-12 |

## 📋 v2.16 Contestant App — Registration Modes & Multi-Entity Editing

**Phases 170-179 — planned.** Numbering continues from v2.15 (last phase 169) and does not reset.

_Two parser constraints shape this section. The heading above carries the version and the name only: the milestone name is read from it, so a status or a phase range appended to it would become part of the name. And the section sits after `## Progress` rather than before it: a milestone's window runs from its heading to the next milestone heading or the end of the file, and a window that contained the Progress table would count that table's v2.15 "Complete" rows as this milestone's completed phases._

**Milestone goal:** A candidate or an organization (party) user can register by any mode the project allows, land in one Contestant app that serves both entity types, and — when they hold grants on several entities — choose which one to edit. 47 requirements (NAME 3 · SET 3 · INV 5 · TOU 3 · REG 14 · ENT 3 · NOM 8 · TASK 1 · GEN 3 · FIX 1 · E2E 3) across 10 phases. `CAND-APP-PLAN.md` at the repo root defines the nomenclature and the screens A–L that the criteria below cite by letter.

**Standing rules — inherited by every phase below** (`REQUIREMENTS.md` § Standing rules). The cardinal rule: no failing E2E test, no exemptions, and a "did not run" counts as a failure — so E2E-03 is a closing criterion of every phase, whichever phase the traceability table names. Every user-facing string ships in all seven locales (`da, en, et, fi, fr, lb, sv`). Every new or changed screen meets WCAG 2.1 AA and is reached by the axe scan. A criterion that says "user" or "entity" holds for candidates and for organizations unless it names one. Nothing is deployed, so the schema, the settings shape, the routes and the renamed symbols change in place.

**Sequencing logic:**

- **170 first, always.** The rename precedes every feature phase, so that nothing new is written against a name about to change. It changes no behaviour — with one knowing exception, the merged logout handler (170-A5 (b)) — and closes on a full green E2E run.
- **171-174 are the groundwork, each ahead of the flows that read it.** The settings (171) come before anything that asks which entity types are served and which modes are allowed. Terms of use leave the entity (172) before one user may edit several entities (173). The grant constraints are settled (173) before the invitations that write grants (174).
- **173 carries its own flow.** Entity selection (H) lands with the multi-grant data layer rather than after it, because the selected-entity encoding shapes both the user-data read and every protected route: one decision, one phase.
- **175 before 176-177.** The home screen, the task state and the nomination screens are built once for both entity types, not for candidates and then retrofitted.
- **177.1 after 177 and before 178** (inserted 2026-10-07): it extends `create_invitations` with the nominations an invited entity gets, so it follows the phase that settles the nomination shape rules and the parent-nomination creation, and it precedes the registration flows that are built on invitations.
- **176 before 177, and both before registration.** A freshly registered entity has no nomination. It has to reach a home screen that treats that as a normal state (176) and offers a way to define one (177) before any registration flow ends there.
- **180 last** (added 2026-10-07): the Edge Function typecheck and the `_shared/` move touch every function, so they follow the last phase that edits one (179) and run on a quiet tree.
- **178 before 179.** The identity-provider success screen reuses 178's email-entry component, and a returning identity-provider user is sent to the emailed sign-in path that 178 builds.
- **179.1 and 179.2 after 179 and before 180** (inserted 2026-10-23 from `.planning/REVIEW-DECISIONS-166-179.md`): both edit Edge Functions (`account-access`, `identity-callback`) and the auth callback, so they come before 180's typecheck and `_shared/` move. 179.1 before 179.2: the confirm page of A3 changes the auth callback whose landing A2 then extends, and 179.2 reuses whatever 179.1 moves out of the entity tree (C5).
- **174.1 sits between 174 and 175** (inserted 2026-10-07): the terms-of-use gate is fixed at phone width before any phase adds a screen behind it. It depends on nothing 174 builds; it waits only so that a frontend change does not land in the middle of 174's evidence.
- **171 and 172 are independent of each other, and so are 174 and 175.** Everywhere else the numeric order is the dependency order.
- **Hand-overs settled in the discussion (2026-10-05).**
  - _Schema edits are serial._ 171, 172, 173, 174, 175, 176, 177 and 177.1 each edit `schema/*.sql` and regenerate the single migration file (176 was missing from this list until 2026-10-07: it adds the nominations RPC of 176-B2); where two are independent in content, whichever runs second regenerates. 172 → 173 run strictly in order.
  - _Gate order:_ F → email (179-B4) → G → H → home → the per-page nomination gate (176-D1). 172 builds the ordered gate list holding G only, 178 prepends F, 173 makes H a route at the app root.
  - _Names 170 leaves alone:_ `get_candidate_user_data` (deleted by 173 for entity-neutral names, 173-A3) and `invite-candidate` (deleted by 174, 174-C5); each of those phases removes its exemption from the 170 search gate.
  - _One nominations lock:_ the app setting `access.nominationsLocked`, moved out of `projects.lock_nominations` (175-B5 (b) + note, 177-B5 (b)). 175 introduces it and its frontend accessor; 176 and 177 reuse it.
  - _E2E base dataset (X1 (a)):_ candidate-only in 171; 173 widens it to both entity types, with `organization: []`, and re-baselines whatever the "Candidate and party app" name changes.
  - _Identity-provider registration never claims an invitation in v2.16 (X2 (a)):_ a person an admin seeded who registers through the provider becomes a duplicate that the admin resolves by hand. Phase 174 files the todo.
  - _Registration routes (operator note, 2026-10-05):_ the one surviving registration tree is `register/`, with the identity-provider flow as a subroute inside it; no `preregister/` route survives. Exact route names are settled in the Phase 178 plan.
- **No milestone-close gate phase.** E2E-03 binds every phase and is mapped to 179 for traceability only. E2E-01 and E2E-02 are mapped to 179 because it delivers the last registration mode and the last surface they name; the parts of them that earlier phases can deliver are criteria of those phases (173, 177, 178).

**Design questions — settled 2026-10-05** (`REQUIREMENTS.md` § Design questions; decision ids from `.planning/v2.16-DISCUSSION-POINTS.md`). The operator settled all four in one pass; each phase's CONTEXT.md is the full record.

- Settings shape — Phase 171 — JSON in `app_settings.settings`, deduplicated at parse, as `contestantApp.entityTypes` and `contestantApp.registrationModes` inside the existing `contestantApp` root (171-A1 ★, 171-A3 (b))
- Where per-user-and-project terms-of-use acceptance lives — Phase 172 — a dedicated table, `public.terms_of_use_acceptances` (172-A1 ★)
- Selected entity encoding — Phase 173 — a route parameter, `[entityType]/[entityId]` (173-B1 ★)
- Invitation mechanism — Phase 174 — a `public.invitations` table claimed through `claim_invitations` after an emailed-link sign-in, promising a general grant spec `(scope, target_type, target_id, role)` or a child table of grants per invitation (174-A1 ★, 174-A3 (c))
- When an entity's name is editable — Phase 175 — while the entity is unconfirmed, for every entity type and every name field; the nominations lock affects nominations only (operator decisions B1–B3 (a), 2026-10-07; GEN-03, Phase 175 criterion 4, and the same clause in REG-07 and Phase 179 criterion 2)

The identity-provider write is settled, not open: the user and the entity are created together at the callback, so the entity type is chosen in the mode selector before the provider's flow (REG-06, Phase 179).

**UI hint.** Phases 173 and 175-179 add or reshape screens and carry the hint. Phases 170, 171, 172 and 174 add no new visual surface: a rename, a setting-driven label and entry point, a re-pointed existing gate, and a schema-and-write-path phase.

- [x] **Phase 170: Contestant App Rename — Symbols & Routes** - Every `candidateApp`-type symbol becomes `contestantApp` and the routes move from `candidate/` to `contestant/` (the auth callback and logout to the neutral `api/auth/`), with no behaviour change beyond the merged duplicate logout, closing on a full green E2E run (NAME-01, NAME-02)
- [x] **Phase 171: Project Settings — Served Entity Types & Registration-Mode Matrix** - A project declares which entity types the app serves and which registration modes each may use; the app's name and the login screen's registration entry point obey the declaration (SET-01, SET-02, SET-03, NAME-03)
- [x] **Phase 172: Terms of Use per User and Project** - Acceptance is recorded per user and project and gated in the layout, and stops deciding which entities are public (TOU-01, TOU-02, TOU-03, REG-12)
- [x] **Phase 173: Multi-Entity Grants & Entity Selection** - One user may hold editor grants on several entities of either served type, chooses which to edit and can switch; the user-data read and the data writer serve every served type (ENT-01, ENT-02, ENT-03, GEN-02)
- [x] **Phase 174: Invitations — Grants Defined in Advance** - An admin seeds an entity with an email or a code and the grant its user will receive; claiming writes exactly that grant, duplicates are refused and a used code is kept (INV-01, INV-02, INV-03, INV-04, INV-05)
- [x] **Phase 174.1: Terms-of-Use Gate — Phone Width & Focus (INSERTED)** - The terms-of-use gate view fits a phone viewport with its checkbox reachable, focus lands on the page that replaces the gate, and one E2E check holds the gate at phone width (defect fix on the Phase 172 gate view, the surface of REG-12; completes no requirement)
- [x] **Phase 175: Organization Editing — Profile, Questions & Preview** - An organization user edits the profile, answers questions and previews the public appearance as a candidate can, with name and abbreviation as multilingual fields (GEN-01, GEN-03)
- [x] **Phase 176: Contestant Home, Task State & Nominations View** - Home lists the selected entity's tasks starting with "Define nomination", an entity without a nomination is no longer an error, nominations get their own view, and one derived state drives every Continue (NOM-01, NOM-02, NOM-07, TASK-01)
- [x] **Phase 177: Define Nominations** - The user picks election and constituency pairs as a voter does, sets a symbol and a parent party or alliance per pair, and the nominations are written on Continue (NOM-03, NOM-04, NOM-05, NOM-06, NOM-08)
- [x] **Phase 177.1: Invitations — Entity Confirmation & Nominations Defined in Advance (INSERTED)** - `create_invitations` takes a required `p_confirm_entity` and lets each invitation state its nominations under a `nominations` key, so an admin states whether the invited entity is confirmed and which nominations it gets; parent-nomination creation is one utility shared with self-nomination; the E2E journey drops its hiding wrapper (extends INV-01, INV-05; E2E-03) (completed 2026-10-18)
- [ ] **Phase 178: Sign-in, Email & Code Registration** - The login screen, the mode selector, the email and code modes, the "email sent" screen and the set-password gate, over shared autofill-ready components; the in-app password reset completes (REG-01, REG-02, REG-03, REG-09, REG-10, REG-11, REG-13, FIX-01)
- [ ] **Phase 179: Identity-Provider Registration & Coverage Close** - Registration with the identity provider for both entity types, with its success and error screens; with it every registration mode and every new surface has E2E coverage (REG-04, REG-05, REG-06, REG-07, REG-08, REG-14, E2E-01, E2E-02, E2E-03)
- [x] **Phase 179.1: Review Fixes — Access, Database Rules & Contestant App Behaviour (INSERTED)** - The review decisions of 2026-10-23 that change code in the database, the Edge Functions and the Contestant App: re-invitable claimed addresses, a confirm step before a mailed link signs in, write policies that read the `grants` table, the answers lock enforced on nominations, the constituency rule in `validate_nomination`, serialised identity-provider find-or-create, and the smaller items (REVIEW-DECISIONS A1, A3, A7, B2–B5, C4, C5, D1, D3–D5, E4, E5, plus the Phase 179 UAT gaps; records A5, A6, A8, B1, C1–C3, D2, E3, E6; no v2.16 requirement; E2E-03) (completed 2026-11-11)
- [x] **Phase 179.2: Admin App Account Flows — Landing, Set Password & Recovery (INSERTED)** - An invitee holding only admin grants lands in the Admin App, which has its own set-password gate, and global and account grant holders can recover their password; built from components shared with the Contestant App (REVIEW-DECISIONS A2, A4; no v2.16 requirement; E2E-03) (completed 2026-11-12)
- [x] **Phase 180: Edge Functions — Typecheck & Shared Modules** - The Edge Functions are type-checked by a pinned Deno in `yarn typecheck` without Deno reaching the repository's other TypeScript, and the byte-identical module copies become one `functions/_shared/` directory; built from spikes 037–040 (no v2.16 requirement; E2E-03) (completed 2026-11-13)

### Phase 170: Contestant App Rename — Symbols & Routes

**Goal**: The candidate app is the Contestant app everywhere in the code and in its URLs, with its behaviour unchanged, so that every later phase builds on the new names.
**Depends on**: Nothing (first phase of v2.16; starts from the v2.15 tree)
**Requirements**: NAME-01, NAME-02
**Success Criteria** (what must be TRUE):
  1. Every page of the app is served under `contestant/` — sign-in, registration, the protected pages — and its own API route (`preregister`) under `api/contestant/`. The auth callback and logout routes, which the Admin app shares, are served at the neutral `api/auth/{callback,logout}`, the duplicate logout handler merged into that one. No `candidate/` URL of the app resolves any longer. (amended 2026-10-05, 170-A5 (b))
  2. Every link that leaves the system targets the new routes: the sign-in and password-reset emails and the Edge Function redirects target `contestant/` URLs or the neutral `api/auth/callback`, and the auth redirect allowlist admits the neutral callback and no `candidate/` URL. The identity-provider return stays at `/api/oidc/callback`, which carries no app name; what changes is where the flow lands afterwards (`contestant/preregister/…`) and the `identity-callback` redirect (`/contestant`). The invitation link's target is renamed to `/contestant/complete-registration` and has no page yet; Phases 174 and 178 give it one or remove its source. (amended 2026-10-05, 170-A5 (b), 170-A10)
  3. No `candidateApp`-type name is left for later work to build on: a repository search for the old app-level identifiers, contexts, route constants, message namespaces and test fixtures finds none outside the planning record and two named exemptions — `get_candidate_user_data` (removed by Phase 173) and `invite-candidate` (removed by Phase 174) — and the docs site describes the `contestant/` routes and the neutral `api/auth/` endpoints. The app's default login poster is renamed to `hero-contestant.png` (operator, 2026-10-05).
  4. Nothing else changed, with one knowing exception: the two logout handlers, which are not identical, are merged into `api/auth/logout`. Every other user-facing text and behaviour is as it was before the rename, and the full E2E suite, the unit suites, the type and lint checks and the production build are green on the renamed tree (E2E-03). (amended 2026-10-05, 170-A5 (b))

**Discussion settled** (2026-10-05; full record in the phase's CONTEXT.md): where the rename stops. A name that says which app is renamed; `candidate` as an entity type is not. Renamed: the `$candidate` alias and `lib/candidate/` → `$contestant` and `lib/contestant/`, `CandidateNav` → `ContestantNav` (170-A1); the context, its directory, the `candCtx` locals and the storage keys (170-A2); `candidateUserDataState` / `CandidateUserData`, their entity-naming members left for Phase 173 (170-A3); the route constants to `ContestantApp*` (170-A4); every app-level stored settings and customization key (170-A6); the 17 message namespaces and the four `dynamic.candidateApp*` groups (170-A7); the test names, projects, tag and test ids (170-A11); the docs section (170-A12) and the prose phrase "Candidate App" (170-A13). API routes: the auth pair moves to the neutral `api/auth/{callback,logout}` with the duplicate logout merged, and only `preregister` moves to `api/contestant/` (170-A5 (b), overruling the ★). Left alone as named exemptions in the search gate: `get_candidate_user_data`, removed by Phase 173 (170-A8), and `invite-candidate`, removed by Phase 174 (170-A9); the invitation redirect is renamed to `/contestant/complete-registration` and left dangling for Phase 174 (170-A10). Mechanism: a scripted codemod over one ordered mapping table (170-B1), four plans each closing green (170-C1), and a standing `lint:check` script as the "search finds none" gate (170-C2).
**Plans:** 4/4 plans executed

Plans:
**Wave 1**
- [x] 170-01-PLAN.md — Tooling (codemod, mapping table, search gate in report mode, drivers, baseline) and the symbol rename with no URL change

**Wave 2** *(blocked on Wave 1 completion)*
- [x] 170-02-PLAN.md — URLs: the logout merge, route trees to contestant/, api/contestant/ and api/auth/, outbound links, the allowlist with its live probe, bank-auth once

**Wave 3** *(blocked on Wave 2 completion)*
- [x] 170-03-PLAN.md — Test naming: directories, files, projects, tag, test ids and baselines; the in-container visual run

**Wave 4** *(blocked on Wave 3 completion)*
- [x] 170-04-PLAN.md — Docs, prose, agent docs and SQL comments; the search gate wired into lint:check; the closing run with bank-auth 3×

### Phase 171: Project Settings — Served Entity Types & Registration-Mode Matrix

**Goal**: A project declares which entity types its Contestant app serves and how a user of each type may register, and the app already obeys both declarations where it can today — in what it calls itself and in what the login screen offers.
**Depends on**: Phase 170
**Requirements**: SET-01, SET-02, SET-03, NAME-03
**Success Criteria** (what must be TRUE):
  1. A project's settings name the entity types its Contestant app serves — `candidate`, `organization` or both — and the app names itself accordingly in all seven locales: "Candidate and party app", "Candidate app" or "Party app". Changing the setting changes the name, with no code change (SET-01, NAME-03).
  2. A project's settings state, for each served entity type, which of `identity_provider`, `email` and `code` may be used to register. One empty cell, an empty row and a wholly empty matrix are each accepted and read back as declared, and naming a type or a mode twice has the same effect as naming it once (SET-02).
  3. With no registration mode allowed for any served entity type, the login screen offers sign-in only and shows no registration entry point; with at least one allowed, the entry point is offered (SET-03). In this phase that means today's two entries, each gated on its own mode — the pre-registration entry on `candidate × identity_provider`, the registration-code entry on any served type allowing `code`. A project allowing only `email` has no on-screen entry until Phase 178 builds one: accepted residue. (amended 2026-10-05, 171-C1)
  4. A freshly seeded project (`yarn db:reset-with-data`) and every E2E dataset declare both settings explicitly, so that development data and the suite run against a known configuration, and the full E2E suite is green at close (E2E-03). The `default` template declares both types and every mode; the suite's base datasets declare `['candidate']` with `candidate: ['email', 'code']` and `organization: []`, and Phase 173 widens them to both types. (amended 2026-10-05, 171-E1, X1 (a))

**Discussion settled** (2026-10-05; full record in the phase's CONTEXT.md): _Settings shape_ — JSON inside `app_settings.settings`, typed by `DynamicSettings`, validated by `StoredSettingsSchema` and deduplicated at parse into canonical order (171-A1 ★, 171-A4). The two settings sit inside the existing root as `contestantApp.entityTypes` and `contestantApp.registrationModes` (171-A3 (b), overruling the ★); a stored `contestantApp` root replaces the shipped one whole, so every writer restates the whole root — `questions` included — or the merge becomes deep in this phase. The matrix is a map from entity type to a list of modes (171-A2). Unset, a project serves `['candidate']` with every registration row empty (171-A5); an empty served list is invalid (171-A7); a row for an unserved type is stored and ignored on read (171-A6). A narrow anon-callable `SECURITY DEFINER` function returns the Contestant app's public configuration for a project that is closed for voters (171-B1). The rules live as pure functions in `@openvaa/app-shared` (171-B2). `preRegistration.enabled` is removed; every reader asks the matrix for `candidate × identity_provider` (171-B3). Both legacy registration trees are guarded on the server by their mode (171-C2). The three names are the literal terms, as overridable defaults under `dynamic.contestantAppName` (171-D1, 171-D2).
**Plans:** 4/4 plans executed

Plans:
**Wave 1**
- [x] 171-01-PLAN.md — Model: the two settings in type, defaults and strict schema with dedup at parse, the accessors, the deep settings merge, and removal of the pre-registration switch from its readers and writer

**Wave 2** *(blocked on Wave 1 completion)*
- [x] 171-02-PLAN.md — Database read: the anon-callable `contestant_app_public_config` function, both censuses, the schema push, and the provider's closed-project branch

**Wave 3** *(blocked on Wave 2 completion)*
- [x] 171-03-PLAN.md — Frontend: three app names in seven locales with their readers and sentences, the gated login screen and navigation, and the registration-code guard

**Wave 4** *(blocked on Wave 3 completion)*
- [x] 171-04-PLAN.md — Seeds, E2E proof on the closed-project node, docs, and the closing gate run with the opt-in bank-auth projects

### Phase 172: Terms of Use per User and Project

**Goal**: Accepting the terms of use is something a user does once per project, recorded against the user rather than the candidate, and it no longer decides which entities voters can see.
**Depends on**: Phase 170
**Requirements**: TOU-01, TOU-02, TOU-03, REG-12
**Success Criteria** (what must be TRUE):
  1. A signed-in user who has not accepted the terms of use for the project is stopped at the acceptance screen (G) before any protected page, by the layout rather than by each page. After accepting they are not asked again in that project, including after signing out and in again (REG-12).
  2. The acceptance belongs to the user and the project: no entity carries a terms-of-use field any longer, and accepting in one project does not count in another (TOU-01).
  3. An entity whose editor has not accepted the terms of use is exactly as visible to voters as one whose editor has — its public data, its images and the RPC results are the same in both cases — because no RLS policy, storage policy or RPC conditions on acceptance (TOU-02).
  4. `.planning/todos/pending/` holds one todo for the Admin-app rule — an entity whose primary editor has not accepted the terms of use cannot be confirmed, or is confirmed with a warning — merged into an existing todo if one already covers it (TOU-03).
  5. The acceptance screen is reached by the axe scan, and the full E2E suite is green at close (E2E-03).

**Discussion settled** (2026-10-05; full record in the phase's CONTEXT.md): _Where per-user-and-project terms-of-use acceptance lives_ — a dedicated table, `public.terms_of_use_acceptances (user_id, project_id, accepted_at)`, primary key `(user_id, project_id)` (172-A1 ★), written by RLS self-insert (172-B1) and read separately from the entity read (172-B2). The gate stays an in-layout replacement (172-C1), is decided on user-level data above the entity load (172-C2), and is the first entry of an ordered gate list that Phases 178 and 173 extend (172-C3). Consequence of criterion 3, accepted: confirmed means public, registered or not, so an invited, never-signed-in entity with a confirmed nomination is visible to voters (172-D2); the two E2E candidates the conjunct hid today are seeded `confirmed: false` (172-D1, 172-D2).
**Standing todos in scope**: `2026-08-27-147-tou-gate-modal-unscanned.md`.
**Plans:** 9/9 plans executed

Plans:
**Wave 1**
- [x] 172-01-PLAN.md — Name reconciliation with Phase 170, phase gate helpers and green baseline; the `terms_of_use_acceptances` table, its RLS and grants, and its pgTAP file

**Wave 2** *(blocked on Wave 1 completion)*
- [x] 172-02-PLAN.md — E2E fixtures first: `forceRegister` records acceptance by default with an opt-out; the email-flow localisation spec records its own

**Wave 3** *(blocked on Wave 2 completion)*
- [x] 172-03-PLAN.md — The scoped ignore-duplicates upsert, the writer's acceptance read on `BasicUserData`, and `acceptTermsOfUse()` on writer and context

**Wave 4** *(blocked on Wave 3 completion)*
- [x] 172-04-PLAN.md — The gate above the entity load as an ordered gate list with an extracted view; stage-1 close (gates + full E2E, column still present)

**Wave 5** *(blocked on Wave 4 completion)*
- [x] 172-05-PLAN.md — The frontend loses the entity-level field: state store, entity types, `updateEntityProperties` image-only

**Wave 6** *(blocked on Wave 5 completion)*
- [x] 172-06-PLAN.md — TOU-02: the acceptance conjunct leaves the four visibility sites; the two E2E control rows seeded unconfirmed; pgTAP trio; templates stop stating the column

**Wave 7** *(blocked on Wave 6 completion)*
- [x] 172-07-PLAN.md — The column, its grant and the RPC column are dropped with every writer of them; inverse pgTAP census; stage-2 close

**Wave 8** *(blocked on Wave 7 completion)*
- [x] 172-08-PLAN.md — Second stored session and two axe scans of the acceptance view (light and dark); comment-only sweep of the E2E tree

**Wave 9** *(blocked on Wave 8 completion)*
- [x] 172-09-PLAN.md — Skill files and docs, the TOU-F01 todo, the axe todo closed, and the D-21 closing gate on one HEAD

### Phase 173: Multi-Entity Grants & Entity Selection

**Goal**: One user can hold editor grants on several entities of either served type in a project, and chooses — and can later change — which one they are editing.
**Depends on**: Phase 171, Phase 172 (the served entity types are declared, and acceptance no longer lives on the entity)
**Requirements**: ENT-01, ENT-02, ENT-03, GEN-02
**Success Criteria** (what must be TRUE):
  1. A user can hold editor grants on more than one entity in a project — two candidates, or a candidate and an organization — and sign in normally: the single-entity assumptions — the user-data RPC `get_candidate_user_data` raising `ERR_ENTITY_IDENTITY_AMBIGUOUS`, and the candidate-only sign-in gate in the frontend — no longer stand in the way. `idx_grants_one_candidate_editor` is kept: it limits a candidate to one editor, not a user to one candidate (ENT-03). (amended 2026-10-05, 173-A1)
  2. A user holding grants on several entities is shown the entity-selection screen (H), a list of entity cards with one card per entity they may edit, and picks one; a user holding exactly one grant never sees the screen and lands on that entity's home (ENT-01). A signed-in user with no editable entity is not signed out: they see a "nothing to edit — contact support" screen with the support block and Logout. (amended 2026-10-05, 173-B5 (b))
  3. The user can switch to another of their entities at any time without signing out, and after the switch every page shows and saves the newly selected entity's data, never the previous one's (ENT-02).
  4. Selecting an organization loads that organization's own data, and saving for it succeeds as it does for a candidate: the user-data read and the data writer serve every entity type the project's Contestant app serves, and the writer no longer throws for a non-candidate entity (GEN-02).
  5. An E2E spec covers a user with several grants choosing and switching entities, and the full E2E suite is green at close (E2E-02 in part, E2E-03). The multi-grant user lives on the suite's base dataset, which this phase widens to serve both entity types, with `organization: []`, re-baselining whatever the "Candidate and party app" name changes. (amended 2026-10-05, X1 (a), 173-E1)

**Discussion settled** (2026-10-05; full record in the phase's CONTEXT.md): _Selected entity encoding_ — a route parameter, `contestant/(protected)/[entityType]/[entityId]/…` (173-B1 ★); `contestant/` is H and redirects a single-entity user to their entity (173-B2); the selection is not remembered across sign-ins (173-B3), and a URL naming an entity the user may not edit redirects to the app root (173-B4). Two entity-neutral RPCs replace `get_candidate_user_data`, which is deleted: `get_user_entities` (the list) and `get_entity_user_data` (the one-entity read) (173-A2, 173-A3). `idx_grants_one_candidate_editor` is kept (173-A1). A signed-in user with no editable entity gets a "nothing to edit — contact support" screen (173-B5 (b), overruling the ★). The route move is isolated as its own plan (173-F1).
**Plans:** 13/13 plans executed

Plans:
**Wave 1**
- [x] 173-01-PLAN.md — Preflight: halt unless Phases 171 and 172 have executed, re-measure every assumed fact into 173-NAME-MAP.md, the three gate drivers, and a green baseline of the gate set and the full E2E suite

**Wave 2** *(blocked on Wave 1 completion)*
- [x] 173-02-PLAN.md — Schema [BLOCKING]: get_user_entities and get_entity_user_data replace get_candidate_user_data and its raise; migration, types and satellites regenerated; the adapter's interim reader; 36-entity-identity rewritten; nine pgTAP write-refusal cases across row update, upsert_answers and storage upload; the name-gate exemption deleted and its lookbehind amended; stage-1 close

**Wave 3** *(blocked on Wave 2 completion)*
- [x] 173-03-PLAN.md — Writer and types on one generic entity path; the entity union replaces the candidate member; the load applies the served filter once; the gated adapter-level integration test with an organization save and six refused writes

**Wave 4** *(blocked on Wave 3 completion)*
- [x] 173-04-PLAN.md — Drafts keyed by entity: handle swap on init, image reset, leaveEntity, logout sweep; stage 2 closes on typecheck, lint, unit and svelte-check, with its E2E proof at 173-05

**Wave 5** *(blocked on Wave 4 completion)*
- [x] 173-05-PLAN.md — Route prep with no URL change: three param matchers, the entry gate admits organization editors, admin-first coarse role, the role sign-out removed, the user-level context accessors; its full E2E run is also the boundary proof of 173-04

**Wave 6** *(blocked on Wave 5 completion)*
- [x] 173-06-PLAN.md — E2E harness prep: the tests' route builder refuses an unfilled param, one helper holds the contestant entity URL shape, every URL assertion re-pointed; closes on typecheck, lint, unit and the helpers' own tests, with its E2E proof at 173-07

**Wave 7** *(blocked on Wave 6 completion)*
- [x] 173-07-PLAN.md — The load split in place under a transitional (entity) route group: the sign-out helper, user-level and entity-level loads and layouts, a tracking guard on each, one rule for "home"; its full E2E run, compared per project with the baseline, is also the boundary proof of 173-06

**Wave 8** *(blocked on Wave 7 completion)*
- [x] 173-08-PLAN.md — The route-parameter move: [entityType=servedEntityType]/[entityId=uuid], the root's redirect and the entity-less resolver each with a tracking guard, the D-10 refusal, menu gating; stage-3 close

**Wave 9** *(blocked on Wave 8 completion)*
- [x] 173-09-PLAN.md — Parts: three additive EntityCard props, the ContactSupport and NothingToEdit components, eight strings in seven locales, the test ids; closes on typecheck, lint, unit, svelte-check and the docs links, with its E2E proof at 173-10

**Wave 10** *(blocked on Wave 9 completion)*
- [x] 173-10-PLAN.md — The root's three outcomes: screen H, the "nothing to edit" view, the retired userNoCandidate code, the menu's entity title and switch item; stage-4 close, whose full E2E run is also the boundary proof of 173-09

**Wave 11** *(blocked on Wave 10 completion)*
- [x] 173-11-PLAN.md — Seed side: e2e/base serves both entity types, the app name re-baselined, three dedicated unconfirmed rows for the selection spec

**Wave 12** *(blocked on Wave 11 completion)*
- [x] 173-12-PLAN.md — grantEntity, the multi-grant, zero-entity and logout identities with their setup project, page fixtures, and the selection-and-switch spec

**Wave 13** *(blocked on Wave 12 completion)*
- [x] 173-13-PLAN.md — Axe scans of H, the "nothing to edit" view and the multi-entity menu in both themes; docs and skills; todos for Phases 174 and 179; the D-24 closing gate on one tree

**UI hint**: yes

### Phase 174: Invitations — Grants Defined in Advance

**Goal**: An admin can attach an email or a registration code to an entity ahead of time, and the person who later proves that email or code receives exactly the grant the invitation defined — no more, and nobody else.
**Depends on**: Phase 173 (the grant constraints an invitation writes against)
**Requirements**: INV-01, INV-02, INV-03, INV-04, INV-05
**Success Criteria** (what must be TRUE):
  1. Through an admin-callable write path — no Admin-app screen is in scope — an admin seeds an invitation for a candidate or an organization with either an email or a registration code, stating the grant its user will receive; a caller without admin authority over the project is refused (INV-01).
  2. A duplicate invitation is refused, and the first is left unchanged: a second invitation in the project carrying the same email for the same grant target `(scope, target type, target id)`, whatever role it promises, or carrying a code the project already holds, whatever its target (INV-02). (amended 2026-10-06, 174-A3 (c), 174-B3)
  3. A user who proves the invitation's email or code ends up holding exactly the grants the invitation defines; a user who proves neither gets none of them, and an invitation cannot be claimed into another user's account (INV-03).
  4. A code that has been used is still on record: presenting it again is answered as already used, leading to password sign-in, rather than as an unknown code or an error, and it grants nothing a second time (INV-04).
  5. An entity seeded with a name and an email or a registration code is confirmed from the moment it is seeded; one seeded without either stays unconfirmed, and so invisible to voters, until an admin confirms it (INV-05).
  6. The full E2E suite is green at close (E2E-03), the existing invitation and registration specs included, re-pointed at the new model wherever it replaces the old path.

**Discussion settled** (2026-10-05; full record in the phase's CONTEXT.md): _Invitation mechanism_ — the recommendation on record is accepted: a `public.invitations` table, claimed by one `SECURITY DEFINER` function, `claim_invitations`, after a GoTrue emailed-link sign-in; no auth user and no grant exists until the claim (174-A1 ★, 174-D1). What an invitation promises is a general grant spec `(scope, target_type, target_id, role)`, or a child table of grants per invitation (174-A3 (c), overruling the ★); the plan picks between the two shapes, and because such an invitation can promise project or account authority, the seeding path must itself enforce who may promise which grant. A code is stored as a `sha256` hash, server-generated and returned once (174-B1, 174-B2); a used code is kept and answers `used`, leading to a server-side password sign-in (174-D4). Seeding is a SQL RPC, `create_invitations` (174-C1), targets an existing entity (174-C2), confirms a named target in the same transaction (174-C3) and sends no mail (174-C4). A sign-in link is issued only for an address with an open invitation or an existing grant, by one anon-callable Edge Function that always answers the same (174-D2), built with `auth.admin.generateLink` and carrying a `token_hash` to the app's callback (174-D7). `invite-candidate` is deleted (174-C5). This phase builds the model, both of its ends and the endpoints, and wires the claim plus a session refresh into the existing auth callback and login action; it builds no new screen — the screens that drive a claim are Phase 178 (174-A2).
**Todos to file in this phase**: identity-provider registration never claims an invitation, so a seeded person who registers through the provider becomes a duplicate the admin resolves by hand (X2 (a)); announcing invitations by mail (174-C4).
**Plans:** 10 plans

Plans:
**Wave 1**
- [x] 174-01-PLAN.md — Halt unless Phases 172 and 173 executed; name and fact map; five drivers with the hygiene verdict; green baseline

**Wave 2** *(blocked on Wave 1 completion)*
- [x] 174-02-PLAN.md — `public.invitations`, the authority map in its policies, the server-generated code and two ratified lists; then `create_invitations` and INV-05; pgTAP

**Wave 3** *(blocked on Wave 2 completion)*
- [x] 174-03-PLAN.md — Auth configuration: public sign-up off, confirmations on; per-worker edge policy; gate, E2E assertion, docs; one operator checkpoint for the function environment; default suite and both bank-auth projects (not autonomous)

**Wave 4** *(blocked on Wave 3 completion)*
- [x] 174-04-PLAN.md — Service-only helpers (code check, link eligibility, slot release, claimant look-up, throttle, completion witness); `claim_invitations` with `password_set`; pgTAP; census

**Wave 5** *(blocked on Wave 4 completion)*
- [x] 174-05-PLAN.md — Edge Function `account-access`: measured runtime facts, pure modules, link-issue order with slot release, three operations, seven-locale mail; live run of the contract

**Wave 6** *(blocked on Wave 5 completion)*
- [x] 174-06-PLAN.md — E2E fixtures first, then the server-contract spec with no screen; negatives asserted after a completion witness; invitation cleanup

**Wave 7** *(blocked on Wave 6 completion)*
- [x] 174-07-PLAN.md — Remove `invite-candidate`, its client contract, gate entries, name-gate exemption, docs and skill mentions; closes on gate rows

**Wave 8** *(blocked on Wave 7 completion)*
- [x] 174-08-PLAN.md — Wiring: four writer methods; session → claim → refresh → gates in the callback and both login actions; code-login helper; full run, also 174-07's boundary proof

**Wave 9** *(blocked on Wave 8 completion)*
- [x] 174-09-PLAN.md — Re-point the journey and the localisation spec at the mailed link; landing spec; remove the old E2E helper and the callback's `invite` arm

**Wave 10** *(blocked on Wave 9 completion)*
- [x] 174-10-PLAN.md — Docs with every residual by mechanism, skills, todos, obligations; closing gate on one tree

### Phase 174.1: Terms-of-Use Gate — Phone Width & Focus (INSERTED)

**Goal**: A user on a phone can accept the terms of use and enter the Contestant app, and a keyboard or screen-reader user is not left on the page body after accepting.
**Depends on**: Phase 172 (the gate view), Phase 174 (runs after it: 174 is a schema-and-write-path phase that touches none of these files, and 175 onward add screens behind this gate)
**Requirements**: none — a defect fix on the gate view, which is REG-12's surface (corrected 2026-10-08: this line named TOU-02, which is the removal of the acceptance condition from visibility rules and is not touched here). The phase completes no requirement; E2E-03 binds it as it binds every phase and is discharged at Phase 179
**Success Criteria** (what must be TRUE):
  1. At 320px and at 390px wide the terms-of-use gate view has no horizontal overflow, and its checkbox is inside the viewport and can be ticked; the cause of the measured 576px width is named, and fixed in the component that forces it. The registration page's use of the same form is checked for the same defect.
  2. After the user accepts and continues, keyboard focus is on the navigation target of the page that replaces the gate, in each of the three outcomes (the selection screen, the "nothing to edit" view, an entity page), not on `<body>`.
  3. One E2E check runs the gate at a phone width and fails on the overflow as it stood before the fix; it is part of the default suite.
  4. At 1280px nothing changes except that the consent sentence wraps inside its column where it is wider than the column (in English it is, by a fraction of a pixel, so it wraps to two lines and the content above it moves up by about 8px; in Finnish nothing moves). The full E2E suite is green at close (E2E-03). (amended 2026-10-07 by the operator, after the research measured that the fix — letting the consent label wrap — cannot leave the English 1280px view pixel-identical; the criterion read "The view at 1280px is unchanged")

**Inserted 2026-10-07** by operator decisions D1 (a) and D2 (a) (`.planning/v2.16-OPERATOR-DECISIONS-2026-10-07.md`): both defects, plus one E2E check of the gate at phone width, after Phase 174 and before Phase 175. Found by a browser probe in Phase 173 on the view Phase 172 built: at 390px the document is 483px wide and the checkbox's left edge is at x = −93, which scrolling cannot reach. The cause is not diagnosed. Source and measurements: `.planning/todos/pending/2026-10-06-173-terms-of-use-view-phone-overflow-and-focus.md`.
**UI hint**: yes — an existing screen at a new width; no new visual surface
**Plans:** 2 plans

Plans:

**Wave 1**
- [x] 174.1-01-PLAN.md — The phone-width check red on the unfixed tree, then the one-class label fix; the focus cases red, then the protected layout's focus request

**Wave 2** *(blocked on Wave 1 completion)*
- [x] 174.1-02-PLAN.md — Browser reads of the fixed tree (locales, widths, 1280px, both focus paths), the closing gate with one full default E2E run, todos

### Phase 175: Organization Editing — Profile, Questions & Preview

**Goal**: An organization user can do in the Contestant app what a candidate can: edit the organization's profile, answer its questions and preview how it appears to voters.
**Depends on**: Phase 171, Phase 173 (the project serves organizations, and the app loads and saves a selected entity of any served type)
**Requirements**: GEN-01, GEN-03
**Success Criteria** (what must be TRUE):
  1. An organization user signs in, lands on the organization's pages, and edits and saves its profile; the saved values are what a reload shows and what the voter app displays (GEN-01).
  2. The organization user answers the questions addressed to organizations, with the same editing, saving and progress behaviour a candidate has (GEN-01).
  3. The preview shows the organization as voters will see it — its own details and answers, presented as an organization rather than as a candidate (GEN-01).
  4. The organization's profile shows its name and its abbreviation (short name) as multilingual fields, one value per supported locale; they are editable while the organization is unconfirmed and answers are not locked (`access.answersLocked`), and read-only once it is confirmed, whatever the nominations lock says (GEN-03). The same rule holds for every entity type and every name field — first name, last name, name, short name — and the app applies it to a candidate's first and last name as it does to the organization's fields. An organization created through the identity provider is unconfirmed; an organization seeded as confirmed — which is what the seed writer and the docs do for a named entity invited by a code or an email, and from Phase 177.1 what the caller states on each call — has both fields locked for its user from the first sign-in, and only an admin changes them. The database freezes `short_name` on confirmation together with `name`, on all four entity tables, and `entity.edit_immutable` lets an admin correct either. (amended 2026-10-07, operator decisions B1 (a), B2 (a), B3 (a), settling the 175-B2 and 175-B3 notes; the clause read "editable while nominations are unlocked") (amended 2026-10-08, operator decisions C1 (a), C2 (a), C3 (a), F1 (a); the clauses read "they are editable while the organization is unconfirmed and read-only once it is confirmed" and "one seeded by a code or an email invitation is confirmed from seeding, so its user sees both fields locked from the first sign-in and only an admin changes them"; the candidate clause and "on all four entity tables" are new)
  5. The candidate journey is unchanged, and the full E2E suite, with organization-editing coverage added, is green at close (E2E-03).

**Discussion settled** (2026-10-05; full record in the phase's CONTEXT.md): one route tree and one page component per route, with a per-type descriptor module for what differs (175-A1). The organization profile has the name, the short name, a logo image, the info questions that apply to organizations, and a colour field; a colour is passed through the ensure-contrast util when it is read in (175-B1 (b) + note, overruling the ★). The nominations lock moves out of `projects.lock_nominations` into the app settings as `access.nominationsLocked`, promoted to a full column only if RPCs or indices need it; the database enforcement follows it there, and this phase adds the frontend accessor that 176 and 177 reuse (175-B5 (b) + note, 177-B5 (b)). The name is required in the project's default locale only (175-B6), and name edits are staged and saved with the image and the info answers (175-B7). An organization with no opinion questions gets no questions entry (175-C1). Entity-type-specific text gets one message key per type (175-E1). A schema change the roadmap did not list: `bulk_import` carries `entity_type` on the two question tables, so that the phase's own perm-style E2E dataset — its own template, setup and teardown on the suite's one project — can scope questions by type (175-F1). (amended 2026-10-08, operator decision C8 (a); the clause read "the phase's own perm-style E2E project")
**Settled 2026-10-07** (operator decisions B1 (a), B2 (a), B3 (a), `.planning/v2.16-OPERATOR-DECISIONS-2026-10-07.md`): 175-B2, 175-B3 and 175-B4 — a name is editable while the entity is unconfirmed, for both entity types. See criterion 4. The ten judgement calls (J1–J10) of the phase's CONTEXT.md were ruled on 2026-10-08, below. (amended 2026-10-08; the sentence read "The phase's CONTEXT.md carries ten judgement calls (J1–J10) marked for operator review.")
**Settled 2026-10-08** (`.planning/v2.16-OPERATOR-DECISIONS-2026-10-08.md`; every ruling here is the recommended option, none was overruled): B1 (a) — this phase moves the nominations lock and adds the `nominationsLocked` accessor, although none of its own screens reads it. B2 (a) — once the lock is an app setting, project editors may lock and unlock nominations as well as admins. B3 (a) — a project that does not exist is locked; a project with no app-settings row, or a row without the key, or any value other than `true`, is unlocked. B4 (a) — one lock: the column `projects.lock_nominations` is removed and the database enforces the setting. C1 (a) — a name is editable when the entity is unconfirmed and answers are not locked; the page keeps one Save button. C2 (a) — a candidate's first and last name inputs lock on `confirmed`, as the organization's do. C3 (a) — `short_name` is frozen on confirmation on all four entity tables: organizations, candidates, factions, alliances. C4 (a) — the E2E dataset holds two organizations: a confirmed one for answers, image and colour, and an unconfirmed one whose name is edited, then confirmed by the test, then read in the voter app. C5 (a) — the "name required" rule applies only while the name is editable. C6 (a) — the colour field is for organizations only; one colour, the dark-theme colour derived on read; not locked on confirmation, locked with answers like the logo; the preview shows the adjusted colour. C7 (a) — the page learns `confirmed` from the entity list, with no schema change; a save the database refuses after a mid-session confirmation is explained by the page. C8 (a) — the new E2E dataset is its own dataset on the suite's one project. F1 (a) — "confirmed from seeding" is reworded to "an organization seeded as confirmed": from Phase 177.1 the caller of `create_invitations` states it per call, and the seed writer and the docs pass "confirmed" for a named entity unless told otherwise. F2 (a) — Phase 177.1 stays after 177; a spec of this phase that invites an entity the dataset keeps hidden is built on `invitationFlow.whileHiddenFromVoters` and re-pointed there. G7 (a) — the four `ownership_invalid_mutation` warnings from `Input.svelte` on the contestant profile page are investigated before this phase is planned.
**Plans:** 13 plans in 11 waves (planned 2026-10-08; checked twice — 2 blockers and 10 warnings on the first pass, all revised; the file counts of plans 02, 03, 04, 06 and 08 accepted by the orchestrator)

Plans:

**Wave 1**
- [x] 175-01-PLAN.md — The phase's gate, E2E and verdict scripts with the checked baseline; the `Input` parts repair
- [x] 175-02-PLAN.md — Schema I: the nominations lock as the app setting `access.nominationsLocked`; `short_name` frozen on confirmation on four tables

**Wave 2** *(blocked on Wave 1 completion)*
- [x] 175-03-PLAN.md — Schema II: `entity_type` validated on the question tables and carried by `bulk_import`; dev-seed's deny map; the stored-colour check
- [x] 175-04-PLAN.md — All new copy in seven locales; the name rule, the required-locale helper and the per-type descriptor

**Wave 3** *(blocked on Wave 2 completion)*
- [x] 175-05-PLAN.md — The E2E dataset, its setup and teardown, three sessions and the spec's first tests; the first gate set and full run

**Wave 4** *(blocked on Wave 3 completion)*
- [x] 175-06-PLAN.md — `Input`: the required locale, `lang` on locale fields, programmatic associations, the colour kind

**Wave 5** *(blocked on Wave 4 completion)*
- [x] 175-07-PLAN.md — The writer and the store: raw names on the read, the changed-only update, the refused name, staged properties

**Wave 6** *(blocked on Wave 5 completion)*
- [x] 175-08-PLAN.md — Settings keys, the context (`nominationsLocked`, type scope, `questionsReady`), the voter filter's organization arm, the `ensureColors` reader

**Wave 7** *(blocked on Wave 6 completion)*
- [x] 175-09-PLAN.md — The profile page for both entity types and its three save outcomes

**Wave 8** *(blocked on Wave 7 completion)*
- [x] 175-10-PLAN.md — The questions layout, the neutral no-questions page, the menu and home

**Wave 9** *(blocked on Wave 8 completion)*
- [x] 175-11-PLAN.md — The preview for an organization

**Wave 10** *(blocked on Wave 9 completion)*
- [x] 175-12-PLAN.md — The rest of the spec: scan helpers, voter-side reads, nine scan entries, phone widths

**Wave 11** *(blocked on Wave 10 completion)*
- [x] 175-13-PLAN.md — Docs, skills, todos and the closing gate with three isolated runs

**Cross-cutting constraints** (from the plan check): no red E2E test is ever committed — a red control runs on an uncommitted tree through the wrapper; every schema commit carries `[db]`; the baseline commit is the committed file `175-BASE`; commits are made by pathspec. The 30 PROPOSED items of `175-UI-SPEC.md` (U-01 to U-30) are planned at their recommendation; U-05, U-12 and U-30 depart from context decisions D-14, D-05 and D-18 and, with the voter-side U-19, are isolated with a stated fallback.
**UI hint**: yes

### Phase 176: Contestant Home, Task State & Nominations View

**Goal**: The home screen tells the user of the selected entity exactly what is left to do, starting with its nomination; an entity with no nomination is a normal state rather than an error; and one shared state decides where every Continue leads.
**Depends on**: Phase 175 (so that the home screen and the task state are built once, for both entity types)
**Requirements**: NOM-01, NOM-02, NOM-07, TASK-01
**Success Criteria** (what must be TRUE):
  1. A user whose entity has no nomination reaches the home screen (I) without an error and sees "Define your nomination" as the first task, marked incomplete; once the entity has a nomination the task shows as complete, and the remaining tasks follow it as before (NOM-01). (amended 2026-10-10, operator decision F9 (a) of `.planning/v2.16-OPERATOR-DECISIONS-2026-10-09.md`: the label as built, after C5 (a); it read "Define nomination")
  2. The entity's nominations are shown in a dedicated nominations view (J) and no longer on the profile page; when they cannot be edited — nominations are locked (`access.nominationsLocked`) — the view shows a reusable note directing the user to support (NOM-02). (amended 2026-10-05, 175-B5 (b))
  3. While the entity has no nomination, the profile, the questions and the preview cannot be reached — neither from the home screen nor by entering their URL. The profile and the questions become available as soon as a nomination exists, and the questions do not wait for the profile's basic info; the preview becomes available once, in addition, both the basic info and the opinion questions are filled (NOM-07). (amended 2026-10-08, operator decision D2, EDIT: "No longer gate opinion questions on basic info as they don't depend on it. Both do, however, depend on nominations. Still keep the canonical order for next step at basic info first, and gate preview on both filled."; the clause read "and they become available as soon as a nomination exists")
  4. Every Continue button leads to the entity's next incomplete task — basic info before the opinion questions — and the home screen's task list and the Continue targets never disagree, because both read one derived state in the contestant context (TASK-01). "Every Continue" is the five buttons that choose a target: the home screen's main action, the profile's save, the questions list's start/continue, the question page's save and the nominations view's own; the nominations view's button is labelled Return where the user cannot add a nomination. (amended 2026-10-08, operator decisions D2 EDIT, D3 (a), D4 (a) + note; the order clause and the second sentence are new)
  5. The full E2E suite is green at close (E2E-03).

**Discussion settled** (2026-10-05; full record in the phase's CONTEXT.md): the one derived state is an ordered `tasks` list plus a `nextStep`, read through five accessors on the contestant context — `taskState`, `tasks`, `nextStep`, `previewOpen`, `nominations` — over a pure helper (176-A1, 176-A4; amended 2026-10-10 to the tree, operator decision F9 (a); it read "two accessors"); three tasks for both types — nomination, profile, opinion questions — with preview a destination, not a task (176-A2); "Define nomination" is complete with at least one nomination, confirmed or not (176-A3). J is its own page at `…/nominations` (176-B1), fed by one entity-scoped RPC that resolves the parent server-side (176-B2), and shows each nomination's confirmation state (176-B3). The NOM-07 gate is a route group whose server load redirects to home (176-D1, 176-D2). An entity with no nomination while nominations are locked keeps the task incomplete and sees the "not editable" note on J (176-F1).
**Settled 2026-10-08** (`.planning/v2.16-OPERATOR-DECISIONS-2026-10-08.md`; the recommended option unless marked): B1 (a) — Phase 175 moves the nominations lock and adds the accessor; this phase reads it. C5 (a) — the profile task's "name required" clause applies only while the name is editable. C8 (a) — the phase's E2E dataset is its own dataset on the suite's one project. D1 (a) — the new nominations function becomes the app's one nominations read. D2, operator's EDIT, beating both options — the opinion questions are no longer gated on basic info; the profile and the questions both depend on a nomination; the next step keeps the canonical order, basic info first; the preview is gated on both being filled (criterion 3). Inferred by the orchestrator, not the operator's words: the gates that remain — no nomination, and the preview needing both filled — are server redirects as option (a) had them, and research measures the freshness problem before the plan is fixed. D3 (a) — "every Continue" is the four buttons that choose a target today plus the nominations view's; the terms-of-use Continue and the Return buttons of the preview, settings and help are not among them. D4 (a) + NOTE — the nominations view's Continue is shown and leads to the entity's home when the entity has no nomination, and is relabelled Return if the user cannot add nominations. D5 (a) — in this phase the "not editable" note follows the nominations lock alone; Phase 177 widens it. D6 (a) — the note is used on the nominations view and in place of the four answers-locked warnings, not on the profile's locked-name section, where Phase 175's sentence stands. D7 (a) — a missing default-language name blocks neither the questions nor the preview. D8 (a) — four states of the new screens are scanned, each in both themes, the spec flipping the lock through the admin client between them. D9 (a) — the cause of the "Error formatting nomination" log line is found before the code that logs it is deleted, and the todo closes with the finding. D10 (a) — no entity-name cue is built on the answering pages; the todo stays open. D11 (a) — the place on home for the "email address not confirmed" reminder is left to Phase 179, which then edits the home screen this phase builds.
**Planning note**: the "Define nomination" task's Edit action opens the editor that Phase 177 delivers; in this phase the task leads to the nominations view, which renders no Edit action yet (176-B4). Later phases route their own Continue buttons through the same state.
**Standing todos in scope**: `2026-05-31-display-nominating-org-in-candidate-profile-nominations.md`.
**Plans:** 19 plans in 18 waves (planned 2026-10-09; checked three times — 1 blocker and 7 warnings on the first pass, 1 warning on the second, all revised). Execution starts only when Phase 175 is closed and verified; plan 01 refuses to build before that.

Plans:

**Wave 1**
- [x] 176-01-PLAN.md — The phase's drivers and baseline; the operator's rulings read; Phase 175's hand-over checked; the "Error formatting nomination" cause confirmed

**Wave 2** *(blocked on Wave 1 completion)*
- [x] 176-02-PLAN.md — The entity-scoped nominations RPC `get_entity_nominations`, pgTAP first
- [x] 176-03-PLAN.md — The pure task-state modules and their case tables

**Wave 3** *(blocked on Wave 2 completion)*
- [x] 176-04-PLAN.md — All new copy in seven locales; the descriptor's new members

**Wave 4** *(blocked on Wave 3 completion)*
- [x] 176-05-PLAN.md — The one nominations read: parse, type, writer and every reader

**Wave 5** *(blocked on Wave 4 completion)*
- [x] 176-06-PLAN.md — The no-nomination sign-out removed; the context's task state

**Wave 6** *(blocked on Wave 5 completion)*
- [x] 176-07-PLAN.md — The E2E dataset with nomination-less entities, its sessions, state steps and first tests; the first full gate set

**Wave 7** *(blocked on Wave 6 completion)*
- [x] 176-08-PLAN.md — The `(nominated)` route group and its server gate

**Wave 8** *(blocked on Wave 7 completion)*
- [x] 176-09-PLAN.md — The questions open without the profile: the layout loses its redirect and its render condition

**Wave 9** *(blocked on Wave 8 completion)*
- [x] 176-10-PLAN.md — The preview's own server gate

**Wave 10** *(blocked on Wave 9 completion)*
- [x] 176-11-PLAN.md — `NotEditableNote`; the four answers-locked warnings replaced

**Wave 11** *(blocked on Wave 10 completion)*
- [x] 176-12-PLAN.md — The nominations view

**Wave 12** *(blocked on Wave 11 completion)*
- [x] 176-13-PLAN.md — The nominations block leaves the profile

**Wave 13** *(blocked on Wave 12 completion)*
- [x] 176-14-PLAN.md — Home for an entity with no nomination

**Wave 14** *(blocked on Wave 13 completion)*
- [x] 176-15-PLAN.md — Home for an entity with a nomination, and the journey

**Wave 15** *(blocked on Wave 14 completion)*
- [x] 176-16-PLAN.md — The menu and the logout button over the task state

**Wave 16** *(blocked on Wave 15 completion)*
- [x] 176-17-PLAN.md — The profile's save, the questions list and the question page's save over the task state

**Wave 17** *(blocked on Wave 16 completion)*
- [x] 176-18-PLAN.md — Seven scan entries, phone widths, the wiring gate

**Wave 18** *(blocked on Wave 17 completion)*
- [x] 176-19-PLAN.md — Docs, skills, todos, hand-over and the closing gate

**Cross-cutting constraints** (from the plan check): no commit turns a committed E2E test red — a surface is held in the working tree through a green run of the uncommitted tree and committed together with its fixture and specs; a red control runs on an uncommitted tree through the wrapper; every schema commit carries `[db]`; commits are made by pathspec. The 21 PROPOSED items of `176-UI-SPEC.md` are planned at their recommendation; U-01, U-02 and U-08 depart from criterion 4's letter, D-06 and D-17, and the plan order departs from D-21 — all four are put to the operator as C1 to C4 of `.planning/v2.16-OPERATOR-DECISIONS-2026-10-09.md`, which plan 01 reads by a fixed rule before anything is built (a NOTE, two ticks or a tick without an executor-ready fallback halts the phase there).
**UI hint**: yes

### Phase 177: Define Nominations

**Goal**: The user defines the selected entity's nominations themselves: which elections and constituencies it stands in, under which symbol, and for which party or alliance.
**Depends on**: Phase 176
**Requirements**: NOM-03, NOM-04, NOM-05, NOM-06, NOM-08
**Success Criteria** (what must be TRUE):
  1. From "Define nomination" the user picks election and constituency pairs with the same selectors, and in the same order, that a voter meets — the `startFromConstituencyGroup` setting honoured — except that only elections whose election type admits the entity's type are offered. A single admissible election is never shown as a choice: the election step is shown only when more than one election is admissible; with one, only the constituency step is shown, and the selection is skipped entirely when that one election has one constituency (NOM-03). (amended 2026-10-05, 177-C2 (b), Additional note 2) (amended 2026-10-08, operator decision E6 (b), overruling the recommended option; the clause read "The selection step is skipped entirely when there is one election with one constituency; otherwise the election choice is offered")
  2. Each chosen pair is then shown as a card with an election-symbol input and, where the election type allows a parent for this entity's type, a selector of the project's parties or alliances. A candidate in an `organization_list` election cannot continue without a parent, which a listed party or "Other" satisfies; in an `organization_list_and_independents` election — a new election type, and the default — a candidate may instead choose "Independent / no party". An organization may choose any alliance in the project, with "None" selected by default. An entity for which no parent is allowed is not asked for one. The database refuses a nomination the election's shape forbids, whoever writes it (NOM-04). (amended 2026-10-05, 177-A3 (b) + note, 177-A4 (b) + note, 177-A6 (b))
  3. Choosing "Other" as the parent asks for free text and stores it in `customData.requestedParentOrganization` without linking a parent nomination; choosing a listed party or alliance links it (NOM-05).
  4. Continuing creates the new nominations and updates the changed ones at once, so the home task turns complete and the nominations view shows them, and Continue leads on to the next incomplete task. An edited nomination is no longer confirmed, and when nominations are locked (`access.nominationsLocked`) the change is refused and the view offers no Edit (NOM-06). (amended 2026-10-05, 177-B5 (b))
  5. After a nomination changes, the questions the entity is asked follow the new nominations: questions that now apply appear on the home screen as tasks to answer, questions that no longer apply are no longer asked, and the task state and every Continue target reflect the new set at once (NOM-08).
  6. An E2E spec covers nomination definition, the existing `startFromConstituencyGroup` regression spec (`perm-startfromcg.spec.ts`) is extended to the contestant side rather than paralleled, and the full E2E suite is green at close (E2E-02 in part, E2E-03).

**Discussion settled** (2026-10-05; full record in the phase's CONTEXT.md): the election symbol is opened to the entity user while nominations are unlocked (177-A1). The parent matrix is exposed as `Election.nominationShape` in `@openvaa/data` with one pure function for the allowed parent types (177-A2), and the shape rules are also enforced in `validate_nomination`; a new election type, `organization_list_and_independents`, is added and made the default, and allows parentless candidate nominations (177-A3 (b) + note, overruling the ★). "Independent / no party" is offered only for that new type; "Other" satisfies a required parent; for alliances "None" is the default selection (177-A4 (b) + note). The candidate's selector lists every confirmed organization (177-A5); the organization's lists every alliance in the project, with `entity_insert_parent_nominations` and the organization role extended so that an organization can create the alliance's nomination (177-A6 (b), overruling the ★). One `SECURITY INVOKER` RPC, `set_entity_nominations`, writes the whole set (177-B1); a `SECURITY DEFINER` RPC returns the parent options (177-B2); a pair can be removed through a new `entity_delete_nominations` policy (177-B4). "Locked" is the app setting `access.nominationsLocked` (177-B5 (b), 175-B5 note), and K is not editable when either lock is on (177-B6). The selection step is skipped when there is one election with one constituency (177-C2 (b), overruling the ★). One constituency per election for both entity types (177-C3). Each step is its own route, in a route group — `…/nominations/(edit)/elections` and so on — with the chosen ids in the URL search params (177-C4 + note). A new nomination is for the election's `current_round` (177-C5). The symbol is one optional plain-text field, capped at 50 characters (177-D1 + note).
**Settled 2026-10-08** (`.planning/v2.16-OPERATOR-DECISIONS-2026-10-08.md`; the recommended option unless marked): B1 (a), B4 (a) — the lock and its accessor come from Phase 175, as one source: the column is gone and the database enforces the setting. B2 (a), B3 (a) — project editors may lock and unlock; a missing project is locked, a missing settings row or key is unlocked. E1 (a) — the database refuses a parentless candidate row in an `organization_list` election unless it carries the "Other" text, and checks "has a parent or the text" at the end of the transaction; whether PostgreSQL's deferred triggers and the SQL linter accept this is a research item, not yet measured. E2 (a) — the election-type rule binds inserts and updates for every role; a faction is admitted where a candidate may have a parent, an alliance wherever an organization may stand; nothing re-checks existing nominations when an admin changes an election's type. E3, no box, NOTE "Change in all templates where it would not cause issues." — the default changes, and every seed template is re-typed to the new default wherever that causes no issue; a census decides which. E4 (a) + NOTE — parent creation is paired (a candidate creates a party's row, an organization an alliance's, never the other way round), the cap of 10 counts alliance rows too, and every alliance is listed, confirmed or not; the phase's research evaluates whether the cap of 10 is needed at all and comes back with a finding. E5 (a) — the user sets the symbol on its own nomination only; the 50-character cap and the trim are applied by the input and again by the write function, with no column constraint. E6 (b), overruling the recommended option — a single admissible election is never shown as a choice (criterion 1). E7 (a) — the editor's steps are in a route group: `…/nominations/elections`, `…/constituencies`, `…/details`, with no `edit` in the URL. E8 (a) — a changed constituency is a delete and an insert. E9 (a) — nothing is preselected in a candidate's party selector, in either list type. E10 (a) — the parent options also return the entity type and the image. E11 (a) + NOTE — the task and the view's Edit open the editor when nominations can be edited, and the task leads to the nominations view when they cannot; the operator's note narrows the first half: the task routes to the editor only when nominations are editable and the entity has none, otherwise to the view, where the user clicks Edit. E12 (a) — four situations no source describes (no admissible election; several nominations in one election; removing the only nomination where the selection step is skipped; a linked party that is no longer listed) get a proposed rule each in this phase's UI spec and come back to the operator there; planning of the screens waits on that round. E13 (a) — an editor URL opened while nominations are locked redirects to the nominations view, which shows the note. E14 (a) — the editor does not honour `elections.disallowSelection`: an entity always chooses the elections it stands in. E15 (a) — the one-constituency-per-election limit is stated in the Publishers' Guide. E16 (a) — the closing gate runs the new nominations spec three times in isolation, as Phases 175 and 176 do. F3 (a) — `set_entity_nominations` and Phase 177.1's `p_nominations` take one shape: a JSONB array of objects, one per nomination, with the same keys.
**Planning note** (operator's additional notes, 2026-10-05): the election and constituency selection differs from the voter's in one respect — it first filters the elections by the entity's type against each election's `election_type` — and still honours `startFromConstituencyGroup`; however that is computed, the predicates are centralised as far as possible. The party selector and the alliance selector are one reusable component that renders its items as `EntityCard`s, in a compact variant if needed.
**Todos to file in this phase**: organization multi-constituency selection, noting that it could be enabled for candidates too through a setting (177-C3 note); a check of the whole app for election-round conformity, which has not been tested (177-C5 note); an election-specific setting for the symbol type (177-D1 note); the cap of 10 unconfirmed parent nominations counting an organization's own nominations (177 cross-phase residue) — filed in the light of the research finding on whether the cap is needed at all (operator decision E4 note, 2026-10-08).
**Standing todos in scope**: `2026-08-28-preregister-election-constituency-selection-harmonisation.md`, `2026-09-24-data-model-vs-db-nomination-constraints.md`.
**Plans**: TBD
**UI hint**: yes

### Phase 177.1: Invitations — Entity Confirmation & Nominations Defined in Advance (INSERTED)

**Goal**: An admin who seeds an invitation says, in the same call, whether the invited entity is confirmed and which nominations it holds, so that inviting an entity never changes what voters see by side effect.
**Depends on**: Phase 174 (`create_invitations`, the invitation E2E fixtures), Phase 177 (the nomination shape rules, the parent matrix and the parent-nomination creation that self-nomination uses)
**Requirements**: none new — extends INV-01 and INV-05; E2E-03 as closing criterion
**Success Criteria** (what must be TRUE):
  1. `create_invitations` takes a required `p_confirm_entity`. The invited entity is confirmed only when the caller says so; no call confirms an entity implicitly, and a call that omits the parameter is refused.
  2. Each entity-scope invitation for a candidate or an organization may state its nominations under a `nominations` key, a JSONB array of objects, one per nomination, with the keys Phase 177's `set_entity_nominations` takes — an election id, a constituency id, an optional election symbol and the `parent` object — plus `confirmed` on every object, an optional `id` of the entity's nomination to update, an optional election round (the election's current round when absent) and the nomination's other writable columns. (amended 2026-10-08, operator decision F3 (a); the format clause is new. Inferred, not the operator's words: where this list names a field `set_entity_nominations` does not take from its caller — `confirmed`, the election round — the shared keys keep one name and the admin-only ones are added to them; the phase's planning confirms it against 177's shape.) The nominations are created or updated, never deleted, in the same transaction as the invitation, pass the same validation as any other nomination write, and a caller without the authority to write them is refused with nothing written. (amended 2026-10-18, Phase 177.1 decisions D-05, D-06, D-08 and fact 12; the clauses read "`create_invitations` takes an optional `p_nominations`" and "an optional parent entity id", and the round was not optional)
  3. A parent entity id is resolved to the parent's existing nomination in that election and constituency, and one is created when none exists. That resolve-or-create step is one utility function, and the self-nomination path of Phase 177 calls the same one; no second copy of the rule exists.
  4. The E2E journey invites its candidate through the extended call, with the entity's confirmed state and its nomination stated outright, and runs as the invitation model leaves an invited user. `invitationFlow.whileHiddenFromVoters` is removed, and no spec hides an entity by unconfirming rows around a seeding step.
  5. Every caller of `create_invitations` — the dev-seed writer (`SupabaseAdminClient.createInvitations`), the E2E admin client and fixture with every spec and setup that seeds through them, the frontend data writer's integration test, pgTAP and the docs — passes the new parameter; the seed writer and the docs pass "confirmed" for a named entity unless told otherwise; and the full E2E suite is green at close (E2E-03). (amended 2026-10-08, operator decision F1 (a); the seed-writer clause is new) (amended 2026-10-18, Phase 177.1 decision D-19 and fact 3; the caller list read "the dev-seed writer, the E2E admin client, pgTAP, the docs")

**Inserted 2026-10-07** at the operator's direction. Source: Phase 174 plan 09 found that `create_invitations` confirms the invited entity, so inviting the journey's "Unregistered Candidate AA", whose nomination the seed already confirms, would make that candidate public in the base dataset (measured in a rolled-back transaction: `anon` reads 0 rows before seeding and 1 after). 174-09 worked around it with a fixture wrapper that unconfirms the nominations, seeds, unconfirms the candidate and restores the nominations; the journey's invited candidate therefore runs unconfirmed, not in the state an invitation produces. Record: `174-09-SUMMARY.md`.

**Settled 2026-10-08** (`.planning/v2.16-OPERATOR-DECISIONS-2026-10-08.md`; every ruling here is the recommended option):
- F1 (a) — whether the invited entity is confirmed is the admin's choice on each call, through the required `p_confirm_entity`, and not a property of the mode. The seed writer and the docs pass "confirmed" for a named entity unless told otherwise, so what Phases 174, 175 and 179 were planned on stays the normal case. Operator decision B2 (a) of 2026-10-07 is reworded to "an organization seeded as confirmed" has its name locked from the first sign-in. Phase 174's type test and its pgTAP rows gain the parameter. (This was the "to settle" item on how `p_confirm_entity` sits with B1 (a) and B2 (a).)
- F2 (a) — the phase stays after Phase 177, the roadmap's order: it reuses 177's election-type rules and its create-the-parent's-nomination step. Until it lands, any spec of Phase 175 or 176 that invites an entity the dataset keeps hidden is built on the 174-09 wrapper, `invitationFlow.whileHiddenFromVoters`, and is re-pointed here. (This was the "to settle" item on Phase 175's specs.)
- F3 (a) — `p_nominations` is a JSONB array of objects, one per nomination, with the same keys as 177's `set_entity_nominations` takes: one shape for both nomination writes, and the form `bulk_import` and `create_invitations` already use. (This was the "to settle" item on the format.)

**To settle when the phase is discussed:**
- Inside F3 (a), left to the phase's planning: `create_invitations` takes a batch, so whether the nominations are a separate parameter or a key on each invitation.
- Whether an unconfirmed invited entity with a nomination can use the app at all: 174-09 expected, without running it, that a user whose only nomination is unconfirmed is signed out for having none, since no frontend caller reads unconfirmed nominations. Phase 176 removes the no-nomination sign-out, which may settle it.
- Whether the parent-nomination utility already exists after Phase 177 (its `set_entity_nominations` and the widened `entity_insert_parent_nominations` policy), or is extracted here.

**UI hint**: no — a schema, RPC and test-fixture phase
**Plans**: 8/8 plans complete
**Wave 1**
- [x] 177.1-01-PLAN.md — the phase's drivers (with the shared-stack refusals), the base commit, the baseline run and the context's facts re-read

**Wave 2** *(blocked on Wave 1 completion)*
- [x] 177.1-02-PLAN.md — the nomination object's validator, the array bound and the resolve-or-create-the-parent step as private INVOKER functions; `set_entity_nominations` re-pointed, file 43 untouched

**Wave 3** *(blocked on Wave 2 completion)*
- [x] 177.1-03-PLAN.md — the invitation's pgTAP committed red: file 39 on the new signature with D-21's scoping, file 47, the cross-project arm

**Wave 4** *(blocked on Wave 3 completion)*
- [x] 177.1-04-PLAN.md — `create_invitations (p_project_id, p_invitations, p_confirm_entity)` with the `nominations` key; the database rows green

**Wave 5** *(blocked on Wave 4 completion)*
- [x] 177.1-05-PLAN.md — every caller passes the confirmation: the seed writer (default `true`), the E2E helpers (required), every spec and setup, the integration test

**Wave 6** *(blocked on Wave 5 completion)*
- [x] 177.1-06-PLAN.md — the journey invites its candidate confirmed with an unconfirmed nomination; the hiding wrapper removed; the contract spec states `true` and `false`

**Wave 7** *(blocked on Wave 6 completion)*
- [x] 177.1-07-PLAN.md — the docs, INV-05, the roadmap's criteria 2 and 5, the todos and the database skill

**Wave 8** *(blocked on Wave 7 completion)*
- [x] 177.1-08-PLAN.md — the closing gate: the review, every gate row, one full run, the journey and the contract spec three times each

### Phase 178: Sign-in, Email & Code Registration

**Goal**: A user reaches a signed-in session through the new entry flow — signing in with email, or registering by email or by code — over shared components, with the set-password step enforced once, in the layout.
**Depends on**: Phase 171, Phase 174, Phase 176 (the matrix decides what is offered, invitations are what an email or a code is proven against, and the gates and the home screen are where a signed-in user lands)
**Requirements**: REG-01, REG-02, REG-03, REG-09, REG-10, REG-11, REG-13, FIX-01
**Success Criteria** (what must be TRUE):
  1. The login screen (A) offers "Sign in with email" and, only when some registration mode is allowed, "Register". Register opens the mode selector (C), which lists each allowed mode as an expandable option with one Continue button, or shows the single allowed mode directly (REG-01, REG-03).
  2. Registering by email, and choosing "I have not set a password yet" on the sign-in screen (B) — shown when the email mode or the identity-provider mode is allowed for any served type — both lead to the "email sent" screen (E): a rate-limited resend, a link to support, and the same response whether or not the address is valid, with no backend error surfaced. The emailed link signs the user in, and a user who arrives that way without a password must set one before any other page, enforced by the layout (F) (REG-02, REG-10, REG-11). (amended 2026-10-05, 179-B3)
  3. Entering a registration code leads, for a valid unused code, to entering and confirming an email (D1) and on to E; for a used code, to password sign-in (D2); and for anything else, to "We couldn't confirm your registration code." (REG-09).
  4. The sign-in, password and email-entry pieces are the same shared components on the sign-in, code-reuse, email-entry and set-password screens, browser autofill and password managers work on every one of their inputs, and a password-reset link requested from inside the app completes and signs the user in, in whichever browser or device it is opened (REG-13, FIX-01). (amended 2026-10-05, 178-F1)
  5. The email mode and the code mode each have an E2E spec that follows the real emailed verify redirect rather than a hand-built callback URL, and the full E2E suite is green at close (E2E-01 in part, E2E-03).

**Discussion settled** (2026-10-05; full record in the phase's CONTEXT.md): the phase builds screens over the endpoints Phase 174 delivers — the code check answering `valid`, `used` or `unknown`, the link request, the code sign-in and `claim_invitations` — and no server logic of its own. One route per screen, with the code and the entered address carried in the contestant context and never in the URL (178-A1). F is an in-layout view and comes first: F → G → H → page (178-A2). The server enforces the registration-mode matrix for registration (178-A4). _How the layout knows a password has not been set:_ the database answers, for `auth.uid()` only, whether a password is set, and that fact is bundled into the user-data retrieval RPC rather than served by a helper of its own (178-B1 ★ + note); every signed-in user without a password is asked, whatever brought them, and Phase 179 adds the one exemption (178-B2); after setting it the user stays signed in (178-B3). C is a radio group with one Continue (178-C2). Forgot-password requests its link through the same server endpoint as E (178-C5). The mail texts are per-locale templates stored with the Edge Function (178-E1). FIX-01 is met by no longer producing a PKCE code: the recovery link is issued by the server and carries a `token_hash` to the callback (178-F1). The shared components live in the app's own component library (178-D1).
**Planning note**: the legacy contents of the `register/` tree — the `checkRegistrationKey` and `register` writer contracts, `CheckRegistrationData`, and the `registrationKey`, `username` and `email` URL parameters — are removed here, and the mode selector C takes the `register` path; for the email and code modes exactly one path exists at close (178-G1). C lists the identity-provider mode when the matrix allows it, and until Phase 179 its Continue opens the existing identity-provider start (178-G2). **Operator note, 2026-10-05; exact route names settled in the Phase 178 plan:** the whole `preregister` route becomes `register`, with the identity-provider flow as a subroute inside it — so the surviving registration tree is `register/`, and no `preregister/` route outlives the milestone.
**Standing todos in scope**: `2026-09-02-forgot-password-pkce-code-not-exchanged.md`, `2026-06-07-hide-forgot-password-email-input-after-submitting.md`, `2026-09-15-refactor-candidate-and-entity-registration-flow-and-nominati.md`.
**Plans**: TBD
- [x] 178-01-PLAN.md
- [x] 178-02-PLAN.md
- [x] 178-03-PLAN.md
- [x] 178-04-PLAN.md
- [x] 178-05-PLAN.md
- [x] 178-06-PLAN.md
- [x] 178-07-PLAN.md
- [x] 178-08-PLAN.md
- [x] 178-09-PLAN.md
- [x] 178-10-PLAN.md
- [x] 178-11-PLAN.md
- [x] 178-12-PLAN.md
- [x] 178-13-PLAN.md
- [x] 178-14-PLAN.md
- [x] 178-15-PLAN.md
- [x] 178-16-PLAN.md
- [x] 178-17-PLAN.md
- [x] 178-18-PLAN.md
- [x] 178-19-PLAN.md
- [x] 178-20-PLAN.md
- [x] 178-21-PLAN.md
- [x] 178-22-PLAN.md
- [x] 178-23-PLAN.md
- [x] 178-24-PLAN.md

**UI hint**: yes

### Phase 179: Identity-Provider Registration & Coverage Close

**Goal**: A user can register a candidate or an organization with the identity provider, gives the email they will sign in with, and goes straight to editing; with this the three registration modes are complete and covered end to end.
**Depends on**: Phase 175, Phase 177, Phase 178 (organizations can be edited, a freshly registered entity can define its nomination, and the mode selector, the email-entry component and the emailed sign-in path exist)
**Requirements**: REG-04, REG-05, REG-06, REG-07, REG-08, REG-14, E2E-01, E2E-02, E2E-03
**Success Criteria** (what must be TRUE):
  1. A new user completes the identity provider's flow (CI), which creates the user and the entity together, arrives on the success screen (CI1), enters and confirms the email they will sign in with, and on Continue goes straight on to the terms of use and to editing, with no wait for an email confirmation and no set-password step. The address is recorded as pending and a confirmation link is sent to it; it becomes the sign-in identifier once that link is opened, and until then the user returns through the identity provider (REG-04). (amended 2026-10-05, 179-B1)
  2. When the project allows identity-provider registration for more than one entity type, the user chooses the type in the registration-mode selector (C) before the provider's flow, and the entity created is of that type; when it allows exactly one, the user is not asked. A user registering an organization enters its name and abbreviation (short name) on the success screen through multilingual inputs, which are saved to the already-created organization, and is told these can be edited later, until the organization is confirmed (REG-06, REG-07). A self-registered organization is created unconfirmed, with an empty name, and an admin confirms it (179-C1). A name is editable while the entity is unconfirmed, and the nominations lock affects nominations only — see Phase 175 criterion 4. (amended 2026-10-07, operator decision B1 (a); the clause read "unless nominations are locked")
  3. A user who has already registered and identifies again is told so, is asked to use their email to sign in next time, and continues without entering an email again; a user who identified before but never gave an email is asked for it before reaching the home screen (REG-05). Planned at J1 (2026-10-21, operator ruling 2026-10-21: plan at the ★/proposal; a different answer from the operator becomes a located revision): a pending address counts as given. The gate stops only a user with no address. A user whose address is pending gets CI1's pending variant once — the link is waiting, send again, use a different address — and a reminder on the home screen, and returns through the provider until the link is opened. "Use your email to sign in next time" is said only to a user whose address is confirmed (D-09; plans 179-14, 179-17, 179-18). This closes the open question recorded on 2026-10-05 (179-B1 ★ against 179-B4 ★).
  4. When identification fails the user sees the error screen (CI2) with the support block and a "Try again" action; the message says truthfully whether retrying can help, and a deliberate cancel is treated as a cancel rather than as a failure, in all seven locales (REG-08).
  5. The legacy registration flows are gone — the legacy `register/` contents since Phase 178, the legacy `preregister/` chain here: no `preregister/` URL resolves, no code, message catalogue entry or spec refers to the removed routes, constants or contracts, and the flow of screens A–K is the only registration path. The one registration tree is `register/`, with the identity-provider flow as a subroute inside it (operator note, 2026-10-05; exact route names settled in the Phase 178 plan) (REG-14). (amended 2026-10-05, 178-G1, Additional note 1)
  6. Each registration mode has an E2E spec that follows the real email verify redirect rather than hand-building the callback URL; organization registration, entity selection with several grants and nomination definition each have E2E coverage; and the full E2E suite is green at close, as at the close of every phase before it (E2E-01, E2E-02, E2E-03).

**Settled 2026-10-04 (operator)**: the identity-provider write is not deferred — `identity-callback` creates the user and the entity in one step, the entity type is chosen in the mode selector and carried through the provider round trip, and the organization's name and abbreviation are an update to the created entity. 
**Discussion settled** (2026-10-05; full record in the phase's CONTEXT.md): the chosen type travels in a short-lived httpOnly cookie set by the authorize endpoint after it has checked the type against the matrix (179-A1); the matrix is enforced in three places, with the Edge Function authoritative (179-A2). The callback route invokes `identity-callback`, establishes the session and redirects to CI1; the `id_token` cookie, `/api/oidc/token` and the `preregister` API route are deleted (179-A3). One identity holds at most one entity per type per project (179-A4). The typed address is pending until proved and never blocks editing (179-B1); an address that belongs to another account is refused with a specific message (179-B2); the emailed sign-in link is offered whenever the email mode or the identity-provider mode is allowed (179-B3); a layout gate ahead of G sends a user with no address, pending or proved, to CI1's email form, so the gate order is F (exempt here) → email → G → H (179-B4). A self-registered organization is created unconfirmed with an empty name, and its name is required in the project's default locale on CI1 (179-C1, 179-C2). CI2 distinguishes three classes — cancelled, may work on retry, will not work on retry — carried as a code from a closed set (179-D2, 179-D3). REG-14's removal is proved by a check in `lint:check` (179-E3). The identity-provider specs join the default suite (179-F1), and a gate script over test tags proves E2E-01 and E2E-02 (179-F3). The milestone audit runs separately, not inside this phase (179-G3). Identity-provider registration never claims an invitation in v2.16 (X2 (a)).
**Planning note**: the legacy `preregister/` chain is superseded by CI and CI1 here and by Phase 177's nomination editor; one registration path remains at close. **Operator note, 2026-10-05; exact route names settled in the Phase 178 plan:** the whole `preregister` route becomes `register`, with the identity-provider flow as a subroute inside it — so what is deleted here is the legacy chain and the `preregister` name, and the surviving registration tree is `register/`.
**Standing todos in scope**: `2026-09-21-surface-bank-identification-failure-to-the-user.md`, `2026-09-21-preregister-route-discards-email-and-nominations.md`, `2026-06-03-full-bank-authentication-flow-e2e-spec.md`, `2026-09-02-close-bank-auth-oidc-round-trip-window.md`.
**Plans**: 24/24 plans executed, 24 serial waves (planned 2026-10-21; the tracer is 179-14; rules in `179-EXECUTION-RULES.md`)
- [x] 179-01-PLAN.md — instruments: the precondition, the freeze check, the drivers, the baseline
- [x] 179-02-PLAN.md — Wave-0 probe of the email-change, passwordless and restore recipes (P1–P9)
- [x] 179-03-PLAN.md — schema: J3 claim exclusion, the confirmation slot, the caller-only taken fact (three appended migrations)
- [x] 179-04-PLAN.md — harness I: the mock issuer's selector, `email_change` links, one issuer
- [x] 179-05-PLAN.md — harness II: the identity-provider specs default-on (D-19)
- [x] 179-06-PLAN.md — CI2, the closed code set, every new string
- [x] 179-07-PLAN.md — C starts the provider's flow with the type; the type cookie
- [x] 179-08-PLAN.md — identity-callback pure modules: contract, matrix copy, placeholder
- [x] 179-09-PLAN.md — identity-callback pure modules: organization, own entity, metadata without claims, credential
- [x] 179-10-PLAN.md — account-access confirm-address operation and its mail
- [x] 179-11-PLAN.md — user-level address facts, F's address term, CI1's endpoint
- [x] 179-12-PLAN.md — CI1's view in every variant
- [x] 179-13-PLAN.md — identity-callback with the new contract (legacy body still accepted)
- [x] 179-14-PLAN.md — tracer: a candidate registers with the identity provider end to end
- [x] 179-15-PLAN.md — identity-callback closed to server callers (J4), strict contract (J5)
- [x] 179-16-PLAN.md — a party registers; C asks the type when two are allowed
- [x] 179-17-PLAN.md — returning users: proved, no address, removed grant
- [x] 179-18-PLAN.md — the pending address: CI1 V4, the home's reminder, settings
- [x] 179-19-PLAN.md — where the confirmation link lands; the race; sign-in by email
- [x] 179-20-PLAN.md — refusals end to end: forged type, switched-off mode, two candidates
- [x] 179-21-PLAN.md — REG-14: the legacy chain removed from the application and the suite
- [x] 179-22-PLAN.md — REG-14: the lint check and the docs
- [x] 179-23-PLAN.md — the coverage-tag census and the todos
- [x] 179-24-PLAN.md — the closing gate

**UI hint**: yes

## Backlog

All four items queued here at v2.14 close were consumed into v2.15's scope:

| v2.14-close backlog item | Consumed by |
|---|---|
| Visual-gate sensitivity floor (ratio dilutes with page height — measured) | VGATE-01/02/03 → Phase 146 |
| `fonts.googleapis.com` egress inside the blocking visual gate (D-136-05-2) | VGATE-04/05/06 → Phase 146 |
| Five packages outside `test:unit` (core, matching, llm, question-info, argument-condensation) | UNIT-01..04 → Phase 141 |
| Candidate-app axe + raw-i18n-key coverage (D-136-04-1) | CSCAN-01..04 → Phase 147 (148 absorbed 2026-08-27) |

Work deliberately **not** in v2.15 is tracked as **Future Requirements** in `.planning/REQUIREMENTS.md`
(product gaps · architecture · the next test-focused milestone) and as standing todos in
`.planning/todos/pending/`. Neither is backlog *queued for the next milestone* until
`/gsd-review-backlog` promotes it. Items deliberately queued for a future milestone are listed below.

### Phase 179.1: Review Fixes — Access, Database Rules & Contestant App Behaviour (INSERTED)

**Goal**: The code-changing review decisions of 2026-10-23 for Phases 166–179 are in the tree: an admin can invite an address again after its earlier invitation was claimed, a mailed link signs in only after a confirm click, revoking a grant stops writes at once, the answers lock holds for nominations in the database, the constituency rule covers every nomination write, a concurrent first identity-provider sign-in cannot create two candidates, and the smaller items are done or recorded
**Depends on**: Phase 179
**Requirements**: none — review fixes; E2E-03 binds it as it binds every phase
**Source**: `.planning/REVIEW-DECISIONS-166-179.md` (operator's answers, `d86333a85`); discussion in `.planning/v2.16-179.1-179.2-DISCUSSION-POINTS.md`
**Precondition**: planning starts only after `/gsd-verify-work 179` (E1), whose findings fold in as items (CONTEXT D-03)
**Success Criteria** (settled in `179.1-CONTEXT.md`, 2026-10-25):
  1. A1, A3, A7, B2, B3, B4, B5, C4, C5, D1, D3, D4, D5, E4 and E5 are each done as the decisions document and this phase's CONTEXT.md settle them, each with a test that fails without the change; B2 covers answers, profile and storage writes as well as nominations (D-14)
  2. A5, A6, A8, B1, C1, C2, C3, D2, E3 and E6 are recorded as decided (owned risks on the docs' auth / security page, todos filed: the hosted IP-budget measurement of A5, the selective answers-lock bypass of B2's note and the election-type rethink of C3's note), with no code change
  3. The full E2E suite, pgTAP and every gate are green on one tree at close

**Plans:** 90/90 plans complete (50 serial waves and plans 54-69; plans 33-40 close the UAT gaps G-179.1-5 to G-179.1-11, plans 41-42 close the verification's gap CR-01, plans 43-46 carry the operator's rulings of 2026-11-02 and the `Icon` defect, plans 47-50 close the re-verification's gaps CR-02 and WR-09 to WR-13, plans 54-55 carry the operator's rulings of 2026-11-04 on WR-16 and WR-17; plans 56-66 close the 18 gaps of the WR-16 UAT of 2026-11-06 (`179.1-WR16-UAT.md`), with the round's rules in plan 56; plans 67-69 close the re-verification's gap G-179.1-WR16-11C (CR-01) with WR-01 to WR-03 and IN-08 of the review of plans 56-66, with the round's rules in plan 67; plans 70-79 close the seven gaps of the WR16H UAT of 2026-11-08 (`179.1-WR16H-UAT.md`), with the round's rules in plan 70; plans 81-85 close the six gaps of the WR16I UAT of 2026-11-10 (`179.1-WR16I-UAT.md`), with the round's rules in plan 81; plans 86-90 close the eight gaps of the WR16J UAT of 2026-11-11 (`179.1-WR16J-UAT.md`), with the round's rules in plan 86; execution rules in `179.1-EXECUTION-RULES.md`)

Plans:
- [x] 179.1-80-PLAN.md

**Wave 1**
- [x] 179.1-01-PLAN.md — The instruments: drivers, base and baseline run, RLS cost "before", negative-control ledger (D-03, D-04, D-12)

**Wave 2** *(blocked on Wave 1 completion)*
- [x] 179.1-02-PLAN.md — A1: a claimed invitation no longer blocks a new one (partial unique index) (D-05)

**Wave 3** *(blocked on Wave 2 completion)*
- [x] 179.1-03-PLAN.md — B3 prerequisite and B5: `bulk_import` links constituencies before nominations; dev-seed links through it; settings validated (D-26, D-17)

**Wave 4** *(blocked on Wave 3 completion)*
- [x] 179.1-04-PLAN.md — B3 and D5: the constituency rule in `validate_nomination`, stated once; the error-order pin (D-18, D-22)

**Wave 5** *(blocked on Wave 4 completion)*
- [x] 179.1-05-PLAN.md — B2 database: `project_answers_locked` on entity-scope policies, storage and the two save functions (D-14, D-15, D-28)

**Wave 6** *(blocked on Wave 5 completion)*
- [x] 179.1-06-PLAN.md — B2 frontend: a lock refusal shows the not-editable note; the per-entity exemption todo (D-16)

**Wave 7** *(blocked on Wave 6 completion)*
- [x] 179.1-07-PLAN.md — A7: `user_can` reads the grants table; cost measured; claim rows rewritten (D-11, D-12, D-13)

**Wave 8** *(blocked on Wave 7 completion)*
- [x] 179.1-08-PLAN.md — B4 database: the locked identity find-or-create function (D-19)

**Wave 9** *(blocked on Wave 8 completion)*
- [x] 179.1-09-PLAN.md — B4 Edge and G-179-5: `identity-callback` calls it; smart name casing (D-19)

**Wave 10** *(blocked on Wave 9 completion)*
- [x] 179.1-10-PLAN.md — G-179-12: an invited address is refused as in use on CI1

**Wave 11** *(blocked on Wave 10 completion)*
- [x] 179.1-11-PLAN.md — A3: the confirm page `/auth/confirm`, signed-in rule, 7 locales, scans (D-06..D-09)

**Wave 12** *(blocked on Wave 11 completion)*
- [x] 179.1-12-PLAN.md — A3: the callback hands every mailed link to the confirm page; specs press Continue (D-08)

**Wave 13** *(blocked on Wave 12 completion)*
- [x] 179.1-13-PLAN.md — A3: the mails link to the confirm page; allowlists incl. hosted settings (D-08, D-27)

**Wave 14** *(blocked on Wave 13 completion)*
- [x] 179.1-14-PLAN.md — G-179-6: the already-registered banner (cookie set by the confirm action)

**Wave 15** *(blocked on Wave 14 completion)*
- [x] 179.1-15-PLAN.md — C4: no read failure signs the user out; the read-failure view (D-20, D-25)

**Wave 16** *(blocked on Wave 15 completion)*
- [x] 179.1-16-PLAN.md — C5: one settings page at the Contestant App's root (D-21)

**Wave 17** *(blocked on Wave 16 completion)*
- [x] 179.1-17-PLAN.md — G-179-1: CI2's support link inline; no icon on noRetry

**Wave 18** *(blocked on Wave 17 completion)*
- [x] 179.1-18-PLAN.md — G-179-14: Check your email view (address, inline support, Send again with its countdown)

**Wave 19** *(blocked on Wave 18 completion)*
- [x] 179.1-19-PLAN.md — G-179-2: `Radio`, the party wording, the registration hero

**Wave 20** *(blocked on Wave 19 completion)*
- [x] 179.1-20-PLAN.md — G-179-2: email and code fields on `Input`

**Wave 21** *(blocked on Wave 20 completion)*
- [x] 179.1-21-PLAN.md — G-179-16: both sign-in links in one component, forgot-password prefill, widths (D-29)

**Wave 22** *(blocked on Wave 21 completion)*
- [x] 179.1-22-PLAN.md — G-179-7, G-179-8: the home's task list, icons, Switch profile

**Wave 23** *(blocked on Wave 22 completion)*
- [x] 179.1-23-PLAN.md — G-179-13: closed menu items reveal their reason on click

**Wave 24** *(blocked on Wave 23 completion)*
- [x] 179.1-24-PLAN.md — G-179-9: nomination form order

**Wave 25** *(blocked on Wave 24 completion)*
- [x] 179.1-25-PLAN.md — G-179-10: nominations view after add, card Edit/Delete, Add

**Wave 26** *(blocked on Wave 25 completion)*
- [x] 179.1-26-PLAN.md — D3 and G-179-11: image removal; open answer before the answer (D-22)

**Wave 27** *(blocked on Wave 26 completion)*
- [x] 179.1-27-PLAN.md — G-179-15, E4, E5: `ui_locales`; key server bound and probed; void-run issuer stop (D-23)

**Wave 28** *(blocked on Wave 27 completion)*
- [x] 179.1-28-PLAN.md — D1, E5: templates removed; 404 title; app-shared declares core (D-22, D-23)

**Wave 29** *(blocked on Wave 28 completion)*
- [x] 179.1-29-PLAN.md — D4: docs redirect stubs prerendered to meta refresh (D-22)

**Wave 30** *(blocked on Wave 29 completion)*
- [x] 179.1-30-PLAN.md — Records and hygiene: docs risks, todos, TOU-F01, E3, eslint labels, WINDOWS rows (D-10, D-24, D-30)

**Wave 31** *(blocked on Wave 30 completion)*
- [x] 179.1-31-PLAN.md — E4 CI observation on the `ci-evidence/**` channel (operator decides the push) (D-23)

**Wave 32** *(blocked on Wave 31 completion)*
- [x] 179.1-32-PLAN.md — The close: review, component docs, native-speaker todo, every gate and one full run on one tree (D-04)

**Wave 33** *(blocked on Wave 32 completion; gap closure)*
- [x] 179.1-33-PLAN.md — G-179.1-6: Log out in the app header of both apps; the logout modal closes on navigation; the preview baselines regenerated

**Wave 34** *(blocked on Wave 33 completion; gap closure)*
- [x] 179.1-34-PLAN.md — G-179.1-7: the nomination editor's radios are the shared `Radio`, and can be seen

**Wave 35** *(blocked on Wave 34 completion; gap closure)*
- [x] 179.1-35-PLAN.md — G-179.1-5: the password is a kind of `Input`, and the sign-in form uses it

**Wave 36** *(blocked on Wave 35 completion; gap closure)*
- [x] 179.1-36-PLAN.md — G-179.1-5: the set-password form uses the kind, and takes the page's shading

**Wave 37** *(blocked on Wave 36 completion; gap closure)*
- [x] 179.1-37-PLAN.md — G-179.1-5: the admin login uses the kind; `PasswordField` deleted

**Wave 38** *(blocked on Wave 37 completion; gap closure)*
- [x] 179.1-38-PLAN.md — G-179.1-8: a Trash icon beside the portrait's or logo's thumbnail

**Wave 39** *(blocked on Wave 38 completion; gap closure)*
- [x] 179.1-39-PLAN.md — G-179.1-9: a disabled Button's icon takes the disabled colour; the callers that change reported

**Wave 40** *(blocked on Wave 39 completion; gap closure)*
- [x] 179.1-40-PLAN.md — G-179.1-10, G-179.1-11: the confirm page's background, the notice's margin; component docs, gates, the visual project and one full run on one tree

**Wave 41** *(blocked on Wave 40 completion; gap closure)*
- [x] 179.1-41-PLAN.md — CR-01: Log out with unsaved edits asks before anything is ended, a refusal ends nothing, and no count runs over an edit; the plan's close

**Wave 42** *(blocked on Wave 41 completion; gap closure)*
- [x] 179.1-42-PLAN.md — CR-01: the review's other findings recorded, the guide and component docs in step; gates, the ledger closed and one full run on one tree

**Wave 43** *(blocked on Wave 42 completion; gap closure)*
- [x] 179.1-43-PLAN.md — The two logout message keys in seven locales, before any screen reads them

**Wave 44** *(blocked on Wave 43 completion; gap closure)*
- [x] 179.1-44-PLAN.md — Ruling 1: Log out with unsaved edits opens the modal, whose count ends the session and discards them; one logout that always leaves after a successful sign-out (WR-04 to WR-08); the latest icon wins; the plan's close

**Wave 45** *(blocked on Wave 44 completion; gap closure)*
- [x] 179.1-45-PLAN.md — Ruling 2: a sign-out that fails is reported, and the page and the edits stay, in both apps; the plan's close

**Wave 46** *(blocked on Wave 45 completion; gap closure)*
- [x] 179.1-46-PLAN.md — The findings on record, the guide and component docs in step; gates, the ledger closed, one full run on one tree, and the operator's UAT list

**Wave 47** *(blocked on Wave 46 completion; gap closure)*
- [x] 179.1-47-PLAN.md — CR-02 and WR-09: a navigation with the logout modal open renders the next page, and a close the platform makes counts as Stay; the plan's close

**Wave 48** *(blocked on Wave 47 completion; gap closure)*
- [x] 179.1-48-PLAN.md — WR-10 and WR-12: the failure message goes when the session is gone, and the modal's dialog is described by what it says; every Log out test records every native dialog; the plan's close

**Wave 49** *(blocked on Wave 48 completion; gap closure)*
- [x] 179.1-49-PLAN.md — WR-11 and WR-13: the Admin App's failure message stands above the page, from its layout, and its Log out always leaves after a sign-out; the plan's close

**Wave 50** *(blocked on Wave 49 completion; gap closure)*
- [x] 179.1-50-PLAN.md — The findings on record, two truths true as written, the guide and component docs in step; gates, the ledger closed, one full run on one tree, and the operator's UAT list

**Wave 51** *(blocked on Wave 50 completion; gap closure)*
- [x] 179.1-51-PLAN.md — WR-10, WR-14 and WR-15: one shared entry-route rule withdraws the failure message, the login route gets a server load, the "email sent" screen leaves the gate's list; the plan's close

**Wave 52** *(blocked on Wave 51 completion; gap closure)*
- [x] 179.1-52-PLAN.md — The remaining entry routes' server loads with a guard, the Admin App's layout on the shared rule, and the proof in a production build; the plan's close

**Wave 53** *(blocked on Wave 52 completion; gap closure)*
- [x] 179.1-53-PLAN.md — The accepted risks and corrected records, the guide in step; gates, the ledger closed, one full run on one tree, and the operator's UAT list

**Wave 54** *(blocked on Wave 53 completion; gap closure)*
- [x] 179.1-54-PLAN.md — WR-16: the Admin App's protected load tells no session from a failed read, and a failed sign-out in either app ends on the existing error page in the reader's language, with no new load and a reload shown to clear the stale tab; red first in a production build and on a dev server; the plan's close

**Wave 55** *(blocked on Wave 54 completion; gap closure)*
- [x] 179.1-55-PLAN.md — WR-17 accepted on the record with the override on truth 16, the stale tab as AR-179.1-12, T-179.1-130 and T-179.1-134 restated, the docs in step; gates, the ledger closed, one full run on one tree, and the operator's UAT list

**Wave 56** *(blocked on Wave 55 completion; gap closure)*
- [x] 179.1-56-PLAN.md — the round's one copy checkpoint; the multi-selector separator, ICU exact matches, French `many`, a compiled-message guard, the plugin pinned; `error.403` in fr/lb (G-7D, G-5)

**Wave 57** *(blocked on Wave 56 completion; gap closure)*
- [x] 179.1-57-PLAN.md — Log out spins and is disabled while a sign-out runs, in both apps; a loading button is named once (G-15, G-7B)

**Wave 58** *(blocked on Wave 57 completion; gap closure)*
- [x] 179.1-58-PLAN.md — the logout modal over an unsaved edit is named by its warning; the failure alert's own title and one Close (G-7, G-7B)

**Wave 59** *(blocked on Wave 58 completion; gap closure)*
- [x] 179.1-59-PLAN.md — after a failure, a protected load asks whether a session is left: none goes to login, one shows the error page (G-1, G-3)

**Wave 60** *(blocked on Wave 59 completion; gap closure)*
- [x] 179.1-60-PLAN.md — a `SIGNED_OUT` listener sends a stale tab to login; stored drafts follow other tabs (G-3, G-11A)

**Wave 61** *(blocked on Wave 60 completion; gap closure)*
- [x] 179.1-61-PLAN.md — every browser sign-out removes the Contestant App's drafts, in both apps; nothing server-side does (G-11B)

**Wave 62** *(blocked on Wave 61 completion; gap closure)*
- [x] 179.1-62-PLAN.md — while a sign-out runs, the modal's ✕, Escape and a link's navigation wait for it (G-10)

**Wave 63** *(blocked on Wave 62 completion; gap closure)*
- [x] 179.1-63-PLAN.md — the count becomes a wall-clock deadline, also enforced by a cookie in `hooks.server.ts` (G-11C)

**Wave 64** *(blocked on Wave 63 completion; gap closure)*
- [x] 179.1-64-PLAN.md — the Admin App's login form action and email input; password field attributes and focus (G-4, G-7C, G-2, G-8B, G-8C)

**Wave 65** *(blocked on Wave 64 completion; gap closure)*
- [x] 179.1-65-PLAN.md — typed text at the body's size, app-wide; visual baselines regenerated (G-8A)

**Wave 66** *(blocked on Wave 65 completion; gap closure)*
- [x] 179.1-66-PLAN.md — IN-21's sentence reworded; the round on record; gates, production drive, ledger closed, `179.1-66-final`, the operator's UAT list (G-6)

**Wave 67** *(blocked on Wave 66 completion; gap closure)*
- [x] 179.1-67-PLAN.md — the server settles a logout deadline it acted on, so a sign-in after it keeps its session; plan 63's clearing truths pinned; the operator's ruling on WR-01 to WR-03 (G-11C, CR-01)

**Wave 68** *(blocked on Wave 67 completion; gap closure)*
- [x] 179.1-68-PLAN.md — the browser keeps the deadline as a cookie's expiry, only the tab that held the modal removes its count, every copy removed; the docs say Log out is browser-wide (WR-01, WR-03, IN-08, WR-02 as ruled)

**Wave 69** *(blocked on Wave 68 completion; gap closure)*
- [x] 179.1-69-PLAN.md — the round on record; gates, production drive, ledger closed, `179.1-69-final`, the operator's UAT list (G-11C)

**Wave 70** *(blocked on Wave 69 completion; gap closure)*
- [x] 179.1-70-PLAN.md — the round's rules, its one copy and decision checkpoint (C1-C9) and the approved-strings fixture; the About page's party-matching sentence for the default method; the Admin App's login in French and Luxembourgish (WR16H-11, WR16H-9)

**Wave 71** *(blocked on Wave 70 completion; gap closure)*
- [x] 179.1-71-PLAN.md — a Log out in either app withdraws every logout count before its request; every removal reaches the host's own domain; the auth guide's sentence corrected (WR16H-1 page half, WR16H-2)

**Wave 72** *(blocked on Wave 71 completion; gap closure)*
- [x] 179.1-72-PLAN.md — every server sign-in withdraws the logout count through one shared helper; `hooks.server.ts` untouched (WR16H-1)

**Wave 73** *(blocked on Wave 72 completion; gap closure)*
- [x] 179.1-73-PLAN.md — every server sign-out withdraws the logout count through the same helper; the guides say where a count is withdrawn (WR16H-1)

**Wave 74** *(blocked on Wave 73 completion; gap closure)*
- [x] 179.1-74-PLAN.md — the two approved sentences in seven locales; the Contestant App's login screen says why after the server's count sign-out, announced through the focused heading (WR16H-3)

**Wave 75** *(blocked on Wave 74 completion; gap closure)*
- [x] 179.1-75-PLAN.md — the Contestant App's login screen says why after a count's end in its own tab and a sign-out in another tab (WR16H-3)

**Wave 76** *(blocked on Wave 75 completion; gap closure)*
- [x] 179.1-76-PLAN.md — the Admin App's login page says why after a followed sign-out and the server's count sign-out (WR16H-3)

**Wave 77** *(blocked on Wave 76 completion; gap closure)*
- [x] 179.1-77-PLAN.md — the password toggle keeps keyboard focus and exposes `aria-pressed`; a Back held during a failed sign-out is replayed as a traversal (WR16H-5: WR-06, WR-04)

**Wave 78** *(blocked on Wave 77 completion; gap closure)*
- [x] 179.1-78-PLAN.md — traced first: the French password label on one line at 390 px and the Admin App's illustration clear of the logo at 320 px, fixed in the shared input row and header (WR16H-10)

**Wave 79** *(blocked on Wave 78 completion; gap closure)*
- [x] 179.1-79-PLAN.md — the round on record; gates, production drive, ledger closed, `179.1-79-final`, the operator's UAT list (all seven WR16H gaps)

**Wave 80** *(blocked on Wave 79 completion; gap closure; one checkpoint)*
- [x] 179.1-81-PLAN.md — the round's rules; the untranslated-catalogue guard compares each fr and lb string with an approved allowlist; the nine English values translated at the checkpoint (WR16I-4)

**Wave 81** *(blocked on Wave 80 completion; gap closure)*
- [x] 179.1-82-PLAN.md — the page's removal of the logout count tested at example.org and app.example.org, red with the Domain= loop removed; overImgBgColor documented as the top bar's colour (WR16I-7, WR16I-3)

**Wave 82** *(blocked on Wave 81 completion; gap closure)*
- [x] 179.1-83-PLAN.md — a Log out announces itself on a BroadcastChannel; a follower names the other tab only after an announcement within 5 s, otherwise no reason; no new copy (WR16I-1)

**Wave 83** *(blocked on Wave 82 completion; gap closure)*
- [x] 179.1-84-PLAN.md — `signOutToLogin` on one event withdraws the count after the outcome is known; the identity provider's callback withdraws after `verifyOtp` (WR16I-2, WR16I-5)

**Wave 84** *(blocked on Wave 83 completion; gap closure)*
- [x] 179.1-85-PLAN.md — the round on record; gates, production drive, ledger closed, the one full run `179.1-85-final` against `179.1-79-final`, the operator's UAT list (all six WR16I gaps)

**Wave 85** *(blocked on Wave 84 completion; gap closure)*
- [x] 179.1-86-PLAN.md — the round's rules; the accepted risks of plans 70 to 85 in the phase's log; the host removal tests on one shared body; the catalogue walk documented and taking a variant by its shape (WR16J-7, WR16J-5, WR16J-6)

**Wave 86** *(blocked on Wave 85 completion; gap closure; one checkpoint)*
- [x] 179.1-87-PLAN.md — the untranslated-catalogue guard compares every locale but en, alone and behind a locale tag; the da and sv English values translated and en's `Feedack` fixed at the checkpoint (WR16J-8)

**Wave 87** *(blocked on Wave 86 completion; gap closure)*
- [x] 179.1-88-PLAN.md — a Log out announces its start and its end; a follower names the other tab while a start is outstanding (30 s cap) or within 5 s of an end; the Admin App's sign-out of a non-administrator announced; "announcement" names the channel message alone (WR16J-1, WR16J-3, WR16J-4)

**Wave 88** *(blocked on Wave 87 completion; gap closure)*
- [x] 179.1-89-PLAN.md — the confirm page and the three gated sign-ins withdraw the logout count only once the outcome is known; a held session the confirm page cannot sign out ends on the error page; `T-179.1-223` (WR16J-2)

**Wave 89** *(blocked on Wave 88 completion; gap closure)*
- [x] 179.1-90-PLAN.md — the round on record and the WR16J disposition; gates, production drive, ledger closed, the one full run `179.1-90-final` against `179.1-85-final`, the operator's UAT list (all eight WR16J gaps)

**Cross-cutting constraints:**
- Each changed test was red without its change (D-04).

### Phase 179.2: Admin App Account Flows — Landing, Set Password & Recovery (INSERTED)

**Goal**: A user who holds only admin grants never meets the Contestant App: an invitee is sent to the Admin App, which asks for a password before any page when none is set, and a holder of a global or account grant can get a recovery mail; the screens and the gate mechanism are the Contestant App's own, shared rather than copied, so the Admin App runs the same flows over its own shorter list of user-task gates
**Depends on**: Phase 179.1
**Requirements**: none — review fixes (REVIEW-DECISIONS A2, A4); E2E-03 binds it
**Source**: `.planning/REVIEW-DECISIONS-166-179.md` A2 and A4 with the operator's notes; discussion in `.planning/v2.16-179.1-179.2-DISCUSSION-POINTS.md`
**Success Criteria** (settled in `179.2-CONTEXT.md`, 2026-10-25):
  1. An invited project or account admin who opens the mailed link lands in the Admin App, sets a password there if none is set, and never sees the Contestant App's gates or its empty entity list
  2. A holder of a global or account admin grant who asks for a recovery mail gets one and resets the password through the Admin App
  3. The set-password, email-sent and password-reset screens, and the ordered gate list, are shared components used by both apps; E2E specs cover both journeys, the fallback redirect and the mixed-grant user
  4. The CLAUDE.md Auth sentence (review E2) names both apps' set-password gates and the confirm page

**Plans**: 4/4 plans executed

Plans:
**Wave 1**
- [x] 179.2-01-PLAN.md — the shared gate runner and the Admin App's set-password gate (tracer); the six account components moved and the one merged Log out control

**Wave 2** *(blocked on Wave 1 completion)*
- [x] 179.2-02-PLAN.md — the `next` contract end to end (tracer); the Admin App's entry screens from shared screens and one entry-flow holder; recovery by `next`; refused Admin App links land on its login

**Wave 3** *(blocked on Wave 2 completion)*
- [x] 179.2-03-PLAN.md — recovery eligibility for global and account grant holders, migration 00021 (tracer); their recovery journeys

**Wave 4** *(blocked on Wave 3 completion)*
- [x] 179.2-04-PLAN.md — the Contestant App's fallback redirect (tracer); the mixed-grant user in both apps; the CLAUDE.md Auth sentence; every gate and the phase's one full run

**Wave 1**
- 179.2-01-PLAN.md

**Wave 2** *(blocked on Wave 1 completion)*
- 179.2-02-PLAN.md

**Wave 3** *(blocked on Wave 2 completion)*
- 179.2-03-PLAN.md

**Wave 4** *(blocked on Wave 3 completion)*
- 179.2-04-PLAN.md

**Cross-cutting constraints:** the rules in `179.2-EXECUTION-RULES.md`; each new test red without its change (D-02); within the phase, targeted E2E runs only, and plan 04's one full run judged against `179.1-90-final` with the summed deltas.

### Phase 180: Edge Functions — Typecheck & Shared Modules

**Goal**: The Supabase Edge Functions are under a typecheck that fails the build on a type error, Deno tooling flags nothing outside the functions directory, and each module that the functions share exists once.
**Depends on**: Phase 179 (last, so that no feature phase is editing a function while its modules move), and Phase 174 (the function set: `account-access`, `identity-callback`, `send-email`)
**Requirements**: none of v2.16's — a refactor added at the operator's direction; E2E-03 as closing criterion
**Success Criteria** (what must be TRUE):
  1. `yarn typecheck` — and so `yarn lint:check` and the CI type-check step — checks every non-test module under `apps/supabase/supabase/functions/` with a Deno pinned to an exact version as a devDependency of `@openvaa/supabase`. A type error planted in a function file turns it red, naming the error; the tree has no baseline type errors (measured 0 on Deno 2.9.6), and the `any` parameters whose stated reason was the missing check (the three `supabaseAdmin: any` in `identity-callback/index.ts`) are typed.
  2. Deno flags nothing outside the functions directory, on the command line or in an editor: the only Deno config is a scoped `functions/deno.json` with no import map, no `deno.json` exists at the repository root, and `deno.enable` is set nowhere. The recommended editor setting (`deno.enablePaths`) is documented.
  3. Each module with more than one copy or more than one consuming function exists once under `functions/_shared/` and is imported by relative path: `envConfig.ts` (3 byte-identical copies, 4 importers in 3 functions) and `placeholderAddress.ts` (2 differing copies, 3 importers in 2 functions), each with its test. `callerAuthority.ts` (1 copy, 1 consumer) stays in `send-email/`; `entityGrant.ts` no longer exists. The copy-drift check, whose subject no longer exists, is removed, and the moved modules' docblocks no longer say they are duplicated. (The byte-for-byte conformance test was already removed in `287a2b97d`.)
  4. Every function still bundles and answers on the restarted local stack, each bundle holds exactly the shared modules its entry point imports and no test file, and the deployed artefact is unaffected by the config file (the bundles are compared with and without it).
  5. One CI run is observed green with the Deno typecheck in it, the unit suites and every gate script pass, and the full E2E suite and both bank-auth projects are green at close (E2E-03).

**Added 2026-10-07** at the operator's direction, from a spike run separately in the `voting-advice-application-deno-spike` worktree (branch `spike/deno-edge-typecheck`, spikes 037–040, all VALIDATED; wrap-up commit `796e610a7`). The implementation blueprint is `.claude/skills/spike-findings-voting-advice-application-gsd/references/deno-edge-typecheck.md` **on that branch**, with three patch files and a scoped `deno.json` under the skill's `sources/` directory; none of it is on this branch yet, and bringing the skill reference and its sources over is this phase's first step.

**What the spike settled** (read from its reference; not re-measured here): a scoped, import-map-free `functions/deno.json` (`"lock": false`, test files excluded, `no-import-prefix` off); `deno` pinned at `2.9.6` in `apps/supabase/package.json` with the script `cd supabase/functions && deno check .`, picked up by the existing turbo `typecheck` task with no pipeline change; `_shared/` by plain relative imports, with no alias and no workspace package; five baseline type errors fixed in six lines. A root `deno.json` and `"deno.enable": true` each reproduce the earlier whole-repository flagging and are not to be used.

**To settle when the phase is planned:**
- **The spike was cut before Phase 174 finished.** Its base is 174-06, with four functions and ten module copies. On this branch `invite-candidate` is gone (174-07), `callerAuthority.test.ts` and `envConfig.test.ts` already sit in `send-email/`, and `account-access` has more modules than the spike saw. The three patches will not apply as cut: each change is re-derived from the reference's description, and every count in it (modules checked, type errors, copies, tests) is measured again on this tree. Two of the five baseline errors were in `invite-candidate/index.ts`.
- `jwtSegment.ts` is imported by nothing but its own test (the spike and 174-07 both found it): whether it survives.
- The `findExistingCandidate` cast is a placeholder in the spike, not a fix: the recursive `CandidateLookupFilter` type needs reshaping.
- Whether `deno lint` becomes a gate (five findings at spike time) and whether a `.vscode/settings.json` is committed or the setting is only documented.
- What the spike did not observe: any CI run, a hosted deploy, the functions served through the CLI's own serve path, VS Code itself (the language server was measured), and the pinned 2.9.6 against the runtime's embedded 2.1.4 beyond identical results on this code.
- Todos this phase closes: `2026-10-07-174-nothing-type-checks-the-edge-functions.md`, `2026-10-07-174-send-email-jwtsegment-has-no-importer.md`; and it gives Phase 174's one behaviour-unverified truth (the served function on a misconfigured deployment) a type-checked `index.ts`, though not a live run.

**UI hint**: no
**Plans**: 2/3 plans executed

Plans:
**Wave 1**
- [x] 180-01-PLAN.md — the spike reference and sources brought over with this branch's state, indexed and routed (tracer); the A1 amendment checked; the totals check, run checks and deltas table

**Wave 2** *(blocked on Wave 1 completion)*
- [x] 180-02-PLAN.md — all code: the pinned Deno, `deno.json` and `yarn typecheck` with the typed admin client (tracer); `_shared/`, the decoder deleted, the two-check guard, the prose and the editor docs; the planted controls; the D-26 checkpoint; one targeted `perm-closed-project` run

**Wave 3** *(blocked on Wave 2 completion)*
- [ ] 180-03-PLAN.md — the bundles with and without the config and the LSP probe (tracer); the CI evidence push on the operator's go; the reconciliation; the D-26 checkpoint; every gate and the phase's one full run

**Criteria amended 2026-11-12** from `180-DISCUSSION-POINTS.md` (decision A1, the operator's untouched return, so the ★ option): criteria 1 and 3 restated to the measured tree (0 baseline type errors; `entityGrant.ts` gone; `callerAuthority.ts` single-consumer; byte-for-byte test already removed in `287a2b97d`). See `180-CONTEXT.md` D-02.

### Phase 999.1: Command Paradigm — Centralised Command Registry for LLM + Human Invocation (BACKLOG)

**Goal:** [Captured for future planning] Move execution of all application actions into a centralised
command registry, so that every action can be invoked either by an LLM agent or by a human user
through one shared surface rather than being reachable only via bespoke UI event handlers.
**Requirements:** TBD
**Plans:** 0 plans

Plans:

- [ ] TBD (promote with /gsd-review-backlog when ready)

### Phase 999.2: Follow-up — Phase 179.1 deferred UAT follow-up: Test 12 (BACKLOG)

**Goal:** Resolve the UAT checkpoint deferred during Phase 179.1 verification
**Source phase:** 179.1
**Deferred at:** 2026-11-10 during /gsd-verify-work 179.1 session completion
**Follow-ups:**
- [ ] Test 12: Screen-reader pass (VoiceOver; NVDA and TalkBack where at hand): the login page after each of the three sign-outs (the sentence as the heading's description), the password toggle (stable name, aria-pressed, keyboard press), the logout modal, the failed sign-out's message, the loading button (deferred 2026-11-10)
- [ ] WR16K test 1: also truth 20 (the modal's name on open), the other-tab sentence and the confirm page's error page (deferred 2026-11-11)

### Phase 999.3: Follow-up — Phase 179.1 deferred UAT follow-up: Test 13 (BACKLOG)

**Goal:** Resolve the UAT checkpoint deferred during Phase 179.1 verification
**Source phase:** 179.1
**Deferred at:** 2026-11-10 during /gsd-verify-work 179.1 session completion
**Follow-ups:**
- [ ] Test 13: iOS Safari, Android and other engines: 16 px fields with no zoom on focus, the password field; the back gesture and Escape during a sign-out; a held Back during a failed sign-out in Safari, Firefox and on a phone; the French label and the Admin illustration on a real phone; the login sentences on a phone in dark mode; truth 12 in WebKit (double Log out press, the rejected login navigation's full-load fallback) (deferred 2026-11-10)
- [ ] WR16J C2: the other-tab sentence ("logged out in another tab or window") in real Safari, Firefox and on a real phone, with a real second tab; passed 2026-11-11 in Playwright Firefox, WebKit, iPhone 13 and Pixel 7 emulation (tests/e2e-runs/179.1-uat-wr16j/run-2) (deferred 2026-11-11)

### Phase 999.4: Follow-up — Phase 179.1 deferred UAT follow-up: Test 14 (BACKLOG)

**Goal:** Resolve the UAT checkpoint deferred during Phase 179.1 verification
**Source phase:** 179.1
**Deferred at:** 2026-11-10 during /gsd-verify-work 179.1 session completion
**Follow-ups:**
- [ ] Test 14: The logout count on real hardware: a closed browser, device clock skew, a frozen tab, a locked phone, a closed lid, Safari's cap on page-written cookies (T-179.1-166 accepted 2026-11-10 as a design limit) (deferred 2026-11-10)
- [ ] WR16J C7: a planted `Domain=<host>` copy of either logout-count cookie on a real apex deployment and at a subdomain of it, removed by the modal's Continue, with no copy of either name left in the browser's cookie store (deferred 2026-11-11)
