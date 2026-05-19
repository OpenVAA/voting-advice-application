---
phase: 84-imgproxy-decoupling-decouple-non-image-tests-from-imgproxy-i
plan: 01
subsystem: testing
tags:
  - playwright
  - parity-script
  - imgproxy
  - cascade-decouple
  - dependency-graph
  - determinism
  - test-reliability

# Dependency graph
requires:
  - phase: 83-test-reliability-follow-ups-image-upload-cascade-voter-app-f
    provides: v2.10 milestone-close anchor (SHA d6bfeebdb0…) — absorbed and replaced by Phase 84; DETERM-07b party-drawer hydration-guard promotion (now a Phase 84 run-2 flake graduate routed to Phase 86)
  - phase: 79-determinism-recovery-cascading-race-fix-constants-regen
    provides: regen-constants.mjs canonical helper (reportPath re-pointed at Phase 84 run-3); IMGPROXY_TIED_TITLES const D-09 binding contract (re-negotiated 14 → 3 by this phase)
  - phase: 73-determinism-baseline
    provides: original D-09 IMGPROXY_TIED_TITLES list of 14 imgproxy-tied tests; cascade taxonomy; data-race-pool semantics
  - phase: 63-e2e-template-extension-greening
    provides: post-v2.6/diff.md original 14 imgproxy-tied enumeration (binding source for D-09)
provides:
  - DETERM-08 closed — re-auth-setup Playwright dependency repointed from candidate-app-mutation → candidate-app in tests/playwright.config.ts; cascade-break verified empirically across 3-run gate
  - Phase 73 D-09 renegotiation — IMGPROXY_TIED_TITLES const shrunk 14 → 3 (only image-intrinsic CAND-03/CAND-12 tests remain)
  - DATA_RACE pool shrunk 15 → 3 (-12) — 12 non-image-intrinsic tests promoted to PASS_LOCKED via structural decoupling
  - PASS_LOCKED grew 94 → 106 (+12 net additions: 2 candidate-app-password + 8 candidate-app-settings + 2 dual-project re-auth.setup.ts)
  - v2.10 All-Green Suite anchor regenerated — SHA 04ddfdd85cfbcd6505626eb8fb50f3e6f35c11e5385df1f4c8695b22ed0655aa (Run-1 == Run-3)
  - Rule 1 deviation landed (file-scoped re-auth in candidate-settings.spec.ts beforeAll) — addresses Alpha refresh-token revocation discovered post-DETERM-08
affects:
  - v2.10 All-Green Suite anchor binding for Phases 85+ parity gates
  - Phase 73 D-09 IMGPROXY_TIED_TITLES contract (the list of "this test may flake from imgproxy")
  - Phase 86 voter-app FAILURE-CLASS cleanup (party-drawer flake routed forward)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Cascade-decouple via Playwright project-dependency repoint (re-auth-setup → upstream non-image project)"
    - "File-scoped re-auth in spec beforeAll as minimal-blast-radius fix for shared-fixture refresh-token revocation"
    - "Almost-strict 3-run gate accepted on grounds that the divergent cell is pre-existing PASS_LOCKED-graduate, not phase-scope"

key-files:
  created:
    - .planning/phases/84-imgproxy-decoupling-decouple-non-image-tests-from-imgproxy-i/post-fix/smoke.json
    - .planning/phases/84-imgproxy-decoupling-decouple-non-image-tests-from-imgproxy-i/post-fix/smoke-output.txt
    - .planning/phases/84-imgproxy-decoupling-decouple-non-image-tests-from-imgproxy-i/post-fix/run-1.json
    - .planning/phases/84-imgproxy-decoupling-decouple-non-image-tests-from-imgproxy-i/post-fix/run-2.json
    - .planning/phases/84-imgproxy-decoupling-decouple-non-image-tests-from-imgproxy-i/post-fix/run-3.json
    - .planning/phases/84-imgproxy-decoupling-decouple-non-image-tests-from-imgproxy-i/post-fix/run-1.sha256
    - .planning/phases/84-imgproxy-decoupling-decouple-non-image-tests-from-imgproxy-i/post-fix/run-2.sha256
    - .planning/phases/84-imgproxy-decoupling-decouple-non-image-tests-from-imgproxy-i/post-fix/run-3.sha256
    - .planning/phases/84-imgproxy-decoupling-decouple-non-image-tests-from-imgproxy-i/post-fix/sha256.txt
    - .planning/phases/84-imgproxy-decoupling-decouple-non-image-tests-from-imgproxy-i/post-fix/regen-output.txt
  modified:
    - tests/playwright.config.ts
    - tests/tests/specs/candidate/candidate-settings.spec.ts
    - tests/scripts/diff-playwright-reports.ts
    - .planning/phases/79-determinism-recovery-cascading-race-fix-constants-regen/post-fix/regen-constants.mjs
    - .planning/phases/79-determinism-recovery-cascading-race-fix-constants-regen/post-fix/regen-output.txt

key-decisions:
  - "DETERM-08 closed via structural Playwright project-dependency repoint (commit 93050e4fb). The re-auth-setup project now depends on candidate-app (non-imgproxy-loading) instead of candidate-app-mutation (imgproxy-loading). Empirical verification per 84-RCA-FINDINGS.md §Capture Results: zero `/storage/v1/*` requests across all non-mutation candidate-app cold-start navigation paths."
  - "Phase 73 D-09 IMGPROXY_TIED_TITLES const RE-NEGOTIATED 14 → 3. Only image-intrinsic CAND-03/CAND-12 tests remain pool-bound (these 3 actually fetch portrait paths during cold-start). The 11 SETTINGS + 2 PASSWORD + dual-project re-auth tests were never image-tied; their previous DATA_RACE classification was purely Playwright-cascade artifact."
  - "Rule 1 deviation (commit 86e94d3d1): file-scoped re-auth in tests/specs/candidate/candidate-settings.spec.ts beforeAll. Root cause: Alpha refresh-token revoked by candidate-registration.spec.ts setPassword (second describe block — research-agent missed this assumption). Alternatives rejected: full dep-graph redesign (out-of-scope, breaks all phases); ToU-setup project (overkill for one test); reordering candidate-registration (mutates project-shape globally). File-scoped re-auth is the minimal change that doesn't expand Phase 84 scope."
  - "DETERM-09 ladder HALTED at Plan 01. The cheapest-first rung (DETERM-08 alone) achieved the mission goal (DATA_RACE 15 → 3). Plan 02 (DETERM-09 contingent fallback) NOT TRIGGERED — `auto_complete: not_executed` for orchestrator handling."
  - "Almost-strict 3-run gate ACCEPTED: Run-1 and Run-3 are SHA-identical (04ddfdd85…); Run-2 differs by exactly 1 cell (voter-detail party-drawer). Decision: accept the partial gate because (a) all Phase-84-scope tests are deterministic-PASS × 3, (b) the divergent cell is a pre-existing PASS_LOCKED-boundary graduate from Phase 83 DETERM-07b, (c) the cell is NOT imgproxy-related per 84-RCA-FINDINGS, (d) it is routed to Phase 86 (voter-app FAILURE-CLASS cleanup) per ROADMAP.md."
  - "Anchor count delta vs expected: directive predicted ~108 PASS_LOCKED (14 promotions); actual is 106 (12 promotions). The 2-test delta is explained by candidate-app-settings having 8 (not 11) `should …` non-SETTINGS-01-wave-A tests that needed promotion — the original 11-count conflated the SETTINGS-01 wave A entries (already PASS_LOCKED in Phase 83 baseline) with the `should …` entries (the actual cascade-decouple beneficiaries). The actual count 106 binds."

patterns-established:
  - "Playwright project-dependency cascade-break: when an upstream project has a flaky test that cascades into downstream projects, the cheapest fix is to repoint the downstream's `dependencies:` to a sibling non-flaky upstream rather than re-architecting the upstream"
  - "File-scoped beforeAll re-auth as minimal-blast-radius fix when a shared fixture's session state is mutated by a peer spec (works only if the offending peer doesn't run in the same project; cross-project session state is safe because Playwright re-runs project-deps per project)"
  - "Almost-strict 3-run determinism gate: accept N-of-3 identity when the divergent cell is (a) outside phase scope, (b) classified as pre-existing PASS_LOCKED-graduate, (c) routed to a follow-up phase"

# Phase metadata
metrics:
  duration: "~14 hours (planning + research + DETERM-08 fix + Rule 1 deviation + 1-run smoke + 3-run gate + atomic constants regen across 2026-05-13 → 2026-05-14)"
  completed: 2026-05-14
  task_count: 6
  file_count: 5 (modified) + 10 (created)
---

# Phase 84 Plan 01: Imgproxy Decoupling — Decouple Non-Image Tests from Imgproxy Infrastructure (DETERM-08) Summary

**One-liner:** DETERM-08 cascade-decouple — repointed Playwright re-auth-setup dependency from candidate-app-mutation → candidate-app to break the imgproxy-502 cascade-path that previously pooled 12 non-image-intrinsic tests into DATA_RACE; result is 15 → 3 DATA_RACE shrinkage + 94 → 106 PASS_LOCKED grow + new v2.10 All-Green Suite anchor `04ddfdd85c…`.

## Phase 84 SCs Achieved

| SC | Description | Status |
| -- | ----------- | ------ |
| #1 | DETERM-08 closed: re-auth-setup repointed (`tests/playwright.config.ts`) | ✅ Commit 93050e4fb — cascade-break verified empirically across 3-run gate |
| #2 | DETERM-09 trigger evaluation | ✅ NOT TRIGGERED — cheapest-first ladder halted at Plan 01; DATA_RACE = 3 after DETERM-08 alone |
| #3 | DATA_RACE pool 15 → 3 | ✅ Only image-intrinsic CAND-03/CAND-12 survivors remain |
| #4 | Phase 73 D-09 IMGPROXY_TIED_TITLES renegotiation | ✅ Const shrunk 14 → 3 in-place (commit c60200c36) |
| #5 | Fresh 3-run cold-start anchor | ⚠️ ALMOST-STRICT — Run-1 == Run-3 (SHA `04ddfdd85c…`); Run-2 differs by 1 non-phase-scope cell (party-drawer, routed to Phase 86) |

**v2.10 All-Green Suite Anchor (binding for Phases 85+ parity gates):**

```
04ddfdd85cfbcd6505626eb8fb50f3e6f35c11e5385df1f4c8695b22ed0655aa
```

(Run-1 and Run-3 SHA-identical; this hash supersedes Phase 83's anchor `d6bfeebdb0ac29d3b1632095f6ae325b468a9e5193eb350cdcc6607848173d11`.)

## Anchor Figures (Post-Regen, Actual)

| Bucket | Phase 83 anchor | Phase 84 anchor | Delta | Source of delta |
| ------ | --------------- | --------------- | ----- | --------------- |
| PASS_LOCKED | 94 | **106** | **+12** | DETERM-08 cascade-decouple promotions |
| DATA_RACE | 15 | **3** | **-12** | Phase 73 D-09 renegotiation (IMGPROXY_TIED_TITLES 14 → 3) + structural cascade-break |
| CASCADE | 47 | **47** | **0** | Variant-project cascades unchanged (out of phase scope) |
| **Total** | **156** | **156** | **0** | Test-count invariant preserved |

**+12 PASS_LOCKED promotions (exact list):**

1. `auth-setup :: setup/re-auth.setup.ts > re-authenticate as candidate`
2. `re-auth-setup :: setup/re-auth.setup.ts > re-authenticate as candidate`
3. `candidate-app-password :: should change password and login with new password`
4. `candidate-app-password :: should logout and return to login page`
5. `candidate-app-settings :: should display notification popup when enabled`
6. `candidate-app-settings :: should hide hero when hideHero is enabled`
7. `candidate-app-settings :: should render help page correctly`
8. `candidate-app-settings :: should render privacy page correctly`
9. `candidate-app-settings :: should show hero when hideHero is disabled`
10. `candidate-app-settings :: should show maintenance page when candidateApp is disabled`
11. `candidate-app-settings :: should show maintenance page when underMaintenance is true`
12. `candidate-app-settings :: should show read-only warning when answers are locked`

**3 DATA_RACE survivors (the only true image-intrinsic flake-bound tests):**

1. `candidate-app-mutation :: should upload a profile image (CAND-03)`
2. `candidate-app-mutation :: should show editable info fields on profile page (CAND-03)`
3. `candidate-app-mutation :: should persist profile image after page reload (CAND-12)`

### Anchor Count Delta vs Expected

The resume-directive predicted ~108 PASS_LOCKED (94 + 14 promotions: "11 settings + 2 password + 1 re-auth-dual"). The actual is 106 (94 + 12 promotions: "8 settings + 2 password + 2 re-auth-dual"). The 2-test delta is explained as follows: the original 11-count conflated:
- The 7 `SETTINGS-01 wave A — *` candidate-app-settings tests (which were ALREADY PASS_LOCKED in the Phase 83 baseline — cascade-unblocked by DETERM-06, not Phase 84)
- The 8 `should …` candidate-app-settings tests (the actual Phase 84 cascade-decouple beneficiaries: notifications, hero ×2, help, privacy, maintenance ×2, read-only-warning)

Plus the re-auth-setup dual entries arrive as TWO promotions (one per project: auth-setup + re-auth-setup), not one. So actual = 8 + 2 + 2 = 12. The **actual count 106 binds** for downstream phases.

## Rule 1 / 2 Deviation Record

### Rule 1 — File-Scoped Re-Auth Fix in candidate-settings.spec.ts

**Found during:** Task 5 (3-run cold-start gate; the first 1-run smoke after DETERM-08 surfaced a deterministic FAIL in `candidate-app-settings :: should show read-only warning when answers are locked` — not present in pre-DETERM-08 captures).

**Root cause:** Alpha (the candidate-app-settings test-account) had its session-refresh-token revoked by `tests/specs/candidate/candidate-registration.spec.ts > setPassword` flow. The setPassword flow runs in the candidate-app-mutation project (in a separate describe block) AFTER the re-auth.setup.ts fixture has stored Alpha's session. Supabase auth revokes refresh tokens on password change; this leaves the stored session usable for short-lived access (until access-token expiry, ~1hr) but Re-Auth-on-401 fails.

Pre-DETERM-08, this regression was MASKED because re-auth.setup.ts ran in `candidate-app-mutation`'s dependency chain — so it executed AFTER any imgproxy 502 cascade, and the cascade-failure short-circuited downstream candidate-app-settings cells (they all cascade-skipped, never executing the broken re-auth path). DETERM-08's cascade-break exposed the latent bug.

**Research-agent missed assumption:** The Phase 84 RESEARCH document asserted "candidate-app-mutation doesn't touch Alpha" — true for the first registration describe block, but FALSE for the second setPassword describe block which DOES touch Alpha's refresh token. The research scan looked at the first `describe()` only.

**Fix chosen (commit 86e94d3d1):** Add explicit Alpha re-auth in `tests/specs/candidate/candidate-settings.spec.ts > beforeAll`:

```typescript
test.beforeAll(async ({ browser }) => {
  // File-scoped re-auth to recover from Alpha refresh-token revocation by
  // candidate-registration.spec.ts > setPassword (cross-spec session-state
  // mutation per Phase 84 Rule 1 deviation). The shared re-auth.setup.ts
  // fixture stores Alpha's session once at project start; this beforeAll
  // refreshes it for this spec only.
  const context = await browser.newContext({ storageState: ALPHA_STORAGE });
  // … explicit auth.signIn() with Alpha's credentials …
});
```

**Files modified:** `tests/specs/candidate/candidate-settings.spec.ts` (beforeAll block + helper import).

**Alternatives rejected:**

| Alternative | Why rejected |
| ----------- | ------------ |
| Full Playwright dep-graph redesign | Out-of-scope for Phase 84 (was DETERM-09 contingent fallback — NOT TRIGGERED). Mutates all phases' project-shape. |
| Dedicated ToU-setup project | Overkill for one regression. Adds project-dep complexity (new edge in the dep graph) for marginal benefit. |
| Reorder candidate-registration setPassword | Reorders cross-spec project-shape globally. High blast radius; risks breaking forgot-password + change-password cells. |
| Use a different test-account for read-only-warning | Reduces signal coverage (the test specifically exercises Alpha's locked-answers state, set up by data.setup.ts). |

The file-scoped beforeAll re-auth has minimal blast radius — it touches one spec, doesn't expand the project-dep graph, and re-establishes Alpha's session deterministically.

## Run-2 Party-Drawer Flake (Transparent Disclosure)

**Test:** `voter-app :: tests/specs/voter/voter-detail.spec.ts > should open party detail drawer with info, candidates, and opinions tabs`

**Status across the 3-run Phase 84 gate:**
- Run-1: PASS
- Run-2: FAIL (timeout / hydration cell)
- Run-3: PASS

**Classification:** Pre-existing PASS_LOCKED-boundary graduate. This test was promoted to PASS_LOCKED in Phase 83 via DETERM-07b hydration-completeness guard. The Phase 84 run-2 flake is a regression IN the graduate set, but the failure mode is NOT phase-scope:

- Per `84-RCA-FINDINGS.md` instrumentation: party-drawer fetches **zero** `/storage/v1/*` (imgproxy) requests during cold-start. The flake is NOT imgproxy-decoupling-related.
- The failure mode is a hydration-completeness race (DETERM-07b territory), not a cascade race (DETERM-08 territory).

**Decision (operator path (a) ACCEPT):** Accept the almost-strict 3-run gate. Rationale:

1. Phase 84's mission goal (DATA_RACE 15 → 3 via DETERM-08) is fully achieved. All Phase-84-scope tests are deterministic-PASS × 3.
2. Rolling back DETERM-08 to chase a pre-existing voter-app flake would be wrong scope expansion.
3. The flake is NOT a Phase 84 regression in terms of structural binding; the underlying hydration race pre-existed and the Phase 83 fix is incomplete (the Phase 83 guard reduced flake rate from 100% → ~17% but didn't eliminate it).

**Routed to:** **Phase 86 (DETERM-12, voter-app popups + hydration cluster cleanup)** per `.planning/ROADMAP.md` v2.10 All-Green Suite. The disclosure is transparently noted in:
- `tests/scripts/diff-playwright-reports.ts` jsdoc (line ~83-99, "RUN-2 PARTY-DRAWER FLAKE" section)
- `.planning/phases/84-…/post-fix/sha256.txt` (3-run hash audit notes the run-2 divergence and the run-1/run-3 SHA-identity)

## DETERM-09 Ladder Verdict — NOT TRIGGERED

The Phase 84 plan defined a cheapest-first escalation ladder:

1. **DETERM-08 (Plan 01):** Cascade-decouple via dependency repoint — CHEAPEST, lowest blast radius.
2. **DETERM-09 (Plan 02):** Project-shape redesign — EXPENSIVE, high blast radius, contingent on DETERM-08 alone being insufficient.

DETERM-08 alone shrank DATA_RACE 15 → 3 (mission target reached). The Plan 02 trigger condition (DATA_RACE > 3 after DETERM-08) was NOT met.

**Plan 02 status:** `auto_complete: not_executed` for orchestrator handling. No Plan 02 SUMMARY is written by this agent (Plan 02 did not execute — that's Plan 02's own deliverable if it ever runs).

## Files Modified

| File | Change | Commit |
| ---- | ------ | ------ |
| `tests/playwright.config.ts` | re-auth-setup `dependencies: ['candidate-app-mutation']` → `['candidate-app']` (DETERM-08) | 93050e4fb |
| `tests/specs/candidate/candidate-settings.spec.ts` | beforeAll Alpha re-auth (Rule 1 deviation) | 86e94d3d1 |
| `.planning/phases/79-…/post-fix/regen-constants.mjs` | (1) IMGPROXY_TIED_TITLES const 14 → 3; (2) reportPath re-pointed at Phase 84 run-3.json | c60200c36, 11975ad6c |
| `tests/scripts/diff-playwright-reports.ts` | jsdoc Phase 84 narrative + 3 arrays (106 + 3 + 47 = 156) | 11975ad6c |
| `.planning/phases/79-…/post-fix/regen-output.txt` | regen script's output buffer (Phase 84 run) | 11975ad6c |

## Files Created

| File | Purpose |
| ---- | ------- |
| `.planning/phases/84-…/post-fix/smoke.json` + `smoke-output.txt` | 1-run cold-start smoke after DETERM-08 + Rule 1 fix |
| `.planning/phases/84-…/post-fix/run-{1,2,3}.json` | 3-run cold-start gate captures |
| `.planning/phases/84-…/post-fix/run-{1,2,3}.sha256` | per-run hash files |
| `.planning/phases/84-…/post-fix/sha256.txt` | 3-run hash audit (notes run-1==run-3, run-2 divergence on party-drawer) |
| `.planning/phases/84-…/post-fix/regen-output.txt` | Phase 84 copy of the constants regen output (plan-local reference) |

## TDD Gate Compliance

N/A — this plan is `type: execute` (not `type: tdd`). No RED/GREEN/REFACTOR gate sequence required. Standard per-task commits used throughout.

## State Document Changes — Confirmed NONE

Per the operator resume directive, this agent does **NOT** touch:
- `.planning/STATE.md` ✅ (untouched — orchestrator will update)
- `.planning/ROADMAP.md` ✅ (untouched — orchestrator will update)
- `apps/supabase/supabase/config.toml` ✅ (untouched — no schema or config changes needed)

Working-tree `git status --short` still shows STATE.md as modified (a pre-existing untracked / partial change from a prior orchestrator session); this agent did not stage it.

## Phase 86 Follow-Up Hand-Off

For the orchestrator + Phase 86 planning:

- **Add to Phase 86 scope (DETERM-12 voter-app FAILURE-CLASS cleanup):** `voter-app :: voter-detail.spec.ts > should open party detail drawer with info, candidates, and opinions tabs` — pre-existing PASS_LOCKED graduate from Phase 83 DETERM-07b; flaked 1/3 in Phase 84 run-2 (not phase-scope; Phase 84 ACCEPT decision logged in §"Run-2 Party-Drawer Flake" above). Phase 83 hydration-guard is incomplete — the test still races on at least one of: voter-results data hydration, party-section h3 paint, or drawer open-tab paint. Recommendation: extend DETERM-07b guard to also assert drawer's first tab `[role="tab"]` interactive-state before clicking through tabs.

## Self-Check: PASSED

- ✅ `tests/scripts/diff-playwright-reports.ts` exists and PASS_LOCKED has 106 entries
- ✅ `.planning/phases/79-…/post-fix/regen-constants.mjs` exists with reportPath pointing at Phase 84 run-3
- ✅ `.planning/phases/79-…/post-fix/regen-output.txt` exists (PASS_LOCKED 106 / DATA_RACE 3 / CASCADE 47)
- ✅ `.planning/phases/84-…/post-fix/regen-output.txt` exists (Phase 84 copy)
- ✅ Atomic commit `11975ad6c` exists (verified via `git log --oneline -3`)
- ✅ Rule 1 deviation commit `86e94d3d1` exists
- ✅ DETERM-08 fix commit `93050e4fb` exists
- ✅ IMGPROXY_TIED_TITLES shrink commit `c60200c36` exists
- ✅ Self-identity smoke test (diff run-3 against run-3): PARITY GATE PASS
