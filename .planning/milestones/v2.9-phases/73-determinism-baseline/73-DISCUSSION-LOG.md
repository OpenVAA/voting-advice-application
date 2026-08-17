# Phase 73: Determinism Baseline - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-10
**Phase:** 73-determinism-baseline
**Areas discussed:** Race anchor + scope, Plan structure, Real-bug escalation, Bank-auth skip policy

---

## Race anchor + scope

| Option | Description | Selected |
|--------|-------------|----------|
| Re-inventory from cold runs | (Recommended) 3 cold `yarn dev:reset-with-data && yarn test:e2e --workers=1` runs at HEAD; classify failures + flakes per failure type; that list is binding. Most accurate to current state, costs ~1 plan upfront but right-sizes the rest. | |
| 15 DATA_RACE pool only | Anchor on the parity-script's 15 `DATA_RACE` constants from P64. Smallest scope; stable green target = 67→82 pass. Misses the 21 `CASCADE_BASELINE` which may also harbor races. | |
| 36 = 15 DATA_RACE + 21 CASCADE | Broadest scope; stable green target = 67→103 pass. Most ambitious; `CASCADE_BASELINE` includes some intentionally-skipped paths so will likely surface a mix of races + legitimate skips. | ✓ |

**User's choice:** 36 = 15 DATA_RACE + 21 CASCADE
**Notes:** Implies Plan 1 is still a 3-run inventory (to classify failures by type), but the binding list is the parity-script's 36, not a fresh re-list. CONTEXT D-01 / D-02 capture this.

---

## Plan structure

| Option | Description | Selected |
|--------|-------------|----------|
| Per-spec investigative pass | (Recommended) Each plan owns 1–2 spec files end-to-end — rewrite warnings + race-fix together. Aligns DETERM-02+03 pairing per REQUIREMENTS. ~5–6 plans. Race investigation drives prioritization. | |
| Per-rule sweep then race pass | Rule-batched warnings first (no-networkidle → no-raw-locators → no-conditional-in-test/expect, smallest first per hygiene-sweep todo), then a separate DETERM-02 race investigation. ~4 plans. Risk: warning rewrites land before the race that drives them is understood. | |
| Hybrid | Rule-batched for the mechanical no-raw-locators (37 sites) + no-networkidle (6 sites), per-spec investigative for no-conditional-* (54 sites — these mask races). ~5 plans. Captures the mechanical wins fast without rewriting conditional masks blindly. | ✓ |

**User's choice:** Hybrid
**Notes:** Captured as CONTEXT D-04 with explicit ordering: Plan 1 inventory → Plan 2 mechanical (no-networkidle + no-raw-locators) → Plans 3–5 per-spec investigative for no-conditional-* clustered by failure type → Plan 6 parity-gate.

## Hybrid plan order (follow-up)

| Option | Description | Selected |
|--------|-------------|----------|
| Inventory → mechanical → races | (Recommended) Plan 1 inventory; Plan 2 mechanical (no-networkidle 6 + no-raw-locators 37 — quick wins); Plans 3–5 per-spec investigative for no-conditional-* clustered by failure type; Plan 6 parity-gate regen + 3-run smoke. | ✓ |
| Inventory → races → mechanical | Plan 1 inventory; Plans 2–4 per-spec race passes (rewriting conditionals as the race fix demands); Plans 5–6 mechanical sweep + parity gate. Risk: mechanical sweep may collide with files already touched by race plans. | |
| Mechanical → inventory → races | Mechanical first (no-networkidle + no-raw-locators) since they're zero-risk; THEN inventory; THEN per-spec races. Slight risk: mechanical rewrites may shift line numbers in spec files referenced by inventory. | |

**User's choice:** Inventory → mechanical → races

---

## Real-bug escalation

| Option | Description | Selected |
|--------|-------------|----------|
| Test-level + defer product bug | (Recommended) Default to test-level fix (proper `waitFor` / `expect.poll`); log the product bug as a `.planning/todos/pending/` entry with full repro; product fix lands in its own phase. Keeps Phase 73 bounded. | |
| Code-level if scoped | Test-level fix is preferred; code-level fix lands in Phase 73 only when scoped (≤30 LOC, single file, no public-API change). Anything bigger → defer todo. Operator-pragmatic but introduces judgment calls per case. | ✓ |
| Always escalate before code fix | Test-level always; code-level only after operator approval per case. Safest — zero scope creep risk — but adds a sync per surfaced bug. | |

**User's choice:** Code-level if scoped

## Code cap (follow-up)

| Option | Description | Selected |
|--------|-------------|----------|
| ≤30 LOC, single file, no API | (Recommended) Code-level fix lands in Phase 73 if: ≤30 LOC diff, single file, no public-API change, no migration. Cross-file or > 30 LOC → capture as `.planning/todos/pending/` entry. | |
| ≤50 LOC, ≤2 files | Looser cap: ≤50 LOC, up to 2 files (e.g., a context + its consumer). More room for legitimate small fixes. | ✓ |
| Operator-judged per case | No fixed cap; operator approves each code-level fix at plan time. Most flexible; introduces a sync per surfaced bug. | |

**User's choice:** ≤50 LOC, ≤2 files
**Notes:** Captured as CONTEXT D-05.

---

## Bank-auth skip policy

| Option | Description | Selected |
|--------|-------------|----------|
| Legitimate + inline justify | (Recommended) Document as legitimate (env-gated bank-auth, opt-in via @bank-auth tag); add inline `// reason:` justification + ESLint `// eslint-disable-next-line playwright/no-skipped-test` with rationale. Sets convention: env-gated runtime skips are OK if justified. | ✓ |
| Precondition gate / split | Split the conditional skip path into a separate test (or whole file) gated by an env precondition + `test.describe.configure({ mode: 'serial' })`. Removes the runtime skip without changing behavior. More refactor effort. | |
| Convert to expect.poll | Rewrite to `expect.poll(() => createdUserId).toBeTruthy()` then proceed. Matches P64 pattern uniformly. Risk: this isn't a race — it's a precondition-not-met situation; polling waits 5s+ then fails noisily instead of skipping cleanly. | |

**User's choice:** Legitimate + inline justify
**Notes:** Captured as CONTEXT D-07.

---

## Closure criterion

| Option | Description | Selected |
|--------|-------------|----------|
| Stable set across 3 runs | (Recommended) 3 cold `--workers=1` runs produce identical pass/fail sets; the parity-script constants are regenerated against the new baseline; any test that lands in the post-Phase-73 `DATA_RACE` pool is explicitly justified in VERIFICATION.md. Honest criterion. | ✓ |
| All 36 must pass | Hard target: all 36 tests pass on 3 consecutive cold runs; zero remaining `DATA_RACE` pool. Risks scope expansion if a few tests turn out to be product bugs that don't fit the cap. | |
| Lift target ≥ 80% (≥ 29/36) | Quantitative target: ≥29/36 of the pool moves to PASS_LOCKED; remaining ≤7 stay in a documented `DATA_RACE` pool with per-test rationale. | |

**User's choice:** Stable set across 3 runs
**Notes:** Captured as CONTEXT D-02.

---

## Parity-gate verification

| Option | Description | Selected |
|--------|-------------|----------|
| End-of-phase bundled gate | (Recommended) Per-plan does a single `--workers=1` smoke (1 run); end-of-phase 3-run gate runs once, regenerates constants, produces VERIFICATION.md. Same shape as v2.6 P64 + v2.8 bundled smoke. | |
| Per-plan 3-run gate | Each plan runs its own 3-run gate before merging. Catches per-plan flake earlier; significantly more expensive. | |
| End-of-phase + spot-checks | End-of-phase 3-run gate (as Recommended); per-plan spot-checks via `for i in {1..3}; do yarn test:e2e --grep "${spec}"; done` only on plans that touched a flake-prone spec. Middle ground. | ✓ |

**User's choice:** End-of-phase + spot-checks
**Notes:** Captured as CONTEXT D-09.

---

## Claude's Discretion

- **REQUIREMENTS.md number drift handling** (D-03): the planner re-baselines REQUIREMENTS.md's "98 warnings / test.skip(true,…)" against the actual HEAD numbers (103 warnings / `test.skip(!createdUserId,…)`) at PLAN.md time. No user input requested — purely mechanical.
- **Parity-script tooling restoration approach** (D-08): planner picks between (a) restore from git blob at SHA `2832c4410`, (b) rebuild from `regen-constants.mjs` + manual diff scaffolding, (c) extend the v2.7-era `diff-parity.mjs` with PASS_LOCKED/DATA_RACE/CASCADE rules. Option (a) is fastest-default; (b) is cleanest if the restored script's constants are stale.
- **Path to land parity-script tooling** (D-08): `tests/scripts/` vs `scripts/` vs `.planning/milestones/v2.6-phases/.../scripts/` — planner picks based on intended longevity (a permanent v2.9+ asset → `tests/scripts/` or `scripts/`; an ephemeral phase artifact → keep in `.planning/`).
- **Plan 6 lint-gate bump location** (Folded Todo follow-up): the DETERM-03 todo's "drop `--quiet` flag and bump gate from 'warnings allowed' to 'warnings forbidden'" lands in `tests/eslint.config.mjs` or root `package.json` lint scripts — planner picks.

## Deferred Ideas

- **CI grep gate / custom ESLint rule for `test.skip(true, …)`** — skip-modifier todo's optional follow-up; v2.10+ cleanup item (CONTEXT §Deferred).
- **Default-parallelism stability validation** — Phase 73 only validates `--workers=1`; default parallelism may expose additional races. Separate follow-up phase if v2.9 Phases 74–77 need parallelism (CONTEXT §Deferred).
- **Custom `expectEventually(locator, predicate)` helper** — extract if `expect.poll` is used 5+ times across the plans; defer to v2.10+ otherwise (CONTEXT §Deferred).
- **Imgproxy 502 root-cause** — known infrastructure flake (`supabase stop && supabase start` workaround); out of v2.9 scope (CONTEXT §Deferred).
