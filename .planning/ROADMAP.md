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
- 🚧 **v2.15 Trustworthy Foundations — Guards, Seed Data & CI Coverage** — Phases 137-151 (in progress)

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

### 🚧 v2.15 Trustworthy Foundations — Guards, Seed Data & CI Coverage (Phases 137-164) — IN PROGRESS

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

## Progress

**Active milestone: v2.15 Trustworthy Foundations — Guards, Seed Data & CI Coverage** — Phases 137-164 (29 phases incl. 142.1, 157.1 and 157.2; 148 absorbed into 147), 39/39 original requirements mapped plus the review-remediation set added 2026-08-28. Plan counts are set per phase by `/gsd-plan-phase`.

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

**Shipped milestones:**

| Milestone | Phases | Plans | Status | Shipped |
|-----------|--------|-------|--------|---------|
| v2.14 E2E Coverage Expansion + Svelte 5 Idiom Polish + svelte-check Zero | 118-136 | 101/101 | ✅ Shipped | 2026-08-12 |

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

### Phase 999.1: Command Paradigm — Centralised Command Registry for LLM + Human Invocation (BACKLOG)

**Goal:** [Captured for future planning] Move execution of all application actions into a centralised
command registry, so that every action can be invoked either by an LLM agent or by a human user
through one shared surface rather than being reachable only via bespoke UI event handlers.
**Requirements:** TBD
**Plans:** 0 plans

Plans:

- [ ] TBD (promote with /gsd-review-backlog when ready)
