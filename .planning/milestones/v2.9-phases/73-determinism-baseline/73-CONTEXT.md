# Phase 73: Determinism Baseline - Context

**Gathered:** 2026-05-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Reduce the existing Playwright suite to a hard pass/fail signal so v2.9 coverage phases (74–77) can rely on test failures = real regressions, not flake. Three workstreams:

- **DETERM-01** — sweep `test.skip(...)` modifiers per the `2026-04-27-remove-e2e-skip-modifiers.md` protocol; the only remaining instance at HEAD is `tests/tests/specs/candidate/candidate-bank-auth.spec.ts:199` (`test.skip(!createdUserId, …)`), env-gated bank-auth.
- **DETERM-02** — investigate and resolve the data-loading races in the parity-script's race pool (anchor: 36 tests = 15 `DATA_RACE` + 21 `CASCADE_BASELINE` from the v2.6 P64 baseline at HEAD `2c7ad2dea`); fix at the test level by default; code-level fix in 73 if scoped (≤50 LOC, ≤2 files).
- **DETERM-03** — clear all `playwright/*` ESLint warnings in `tests/` (actual at HEAD: **103 warnings**, not the 98 referenced by REQUIREMENTS.md — re-baseline at planning time). Paired with DETERM-02: the `no-conditional-in-test` (36) + `no-conditional-expect` (18) rewrites are the same pattern that drives several races.

Phase 73 is a HARD prerequisite for Phases 74–77; Phase 78 (CLEAN) is independent and may run in parallel.

</domain>

<decisions>
## Implementation Decisions

### Race anchor + scope (DETERM-02)
- **D-01 — Race anchor:** The binding race-investigation list is **all 36 tests** in the parity-script's race pool (15 `DATA_RACE` + 21 `CASCADE_BASELINE` from P64 baseline `67p / 1f / 34c`). This is broader than the "19 races" framing in REQUIREMENTS.md — that figure is approximate; the parity-script's actual constants are the binding contract.
- **D-02 — Closure criterion:** "Done" = **3 cold `--workers=1` runs produce identical pass/fail sets**, the parity-script constants are regenerated against the new baseline, and any test that lands in the post-Phase-73 `DATA_RACE` pool is **explicitly justified per-test in VERIFICATION.md** (rationale: env-gated, infrastructure flake, deferred product bug, etc.). Not "all 36 must green" — that pretends the un-fixable cases don't exist.
- **D-03 — REQUIREMENTS number drift:** REQUIREMENTS.md DETERM-03 says "98 warnings" — actual at HEAD is **103** (37 `no-raw-locators` + 36 `no-conditional-in-test` + 18 `no-conditional-expect` + 6 `no-networkidle` + 2 `no-wait-for-timeout` + 1 `no-skipped-test` + 1 `expect-expect`). REQUIREMENTS.md DETERM-01 says `test.skip(true, …)` — actual remaining is `test.skip(!createdUserId, …)`. The planner should re-baseline these counts in PLAN.md and treat 0 warnings as the closure target.

### Plan structure (Hybrid, ordered)
- **D-04 — Plan order:** Inventory → mechanical → races.
  1. **Plan 1 (inventory):** 3 cold `yarn dev:reset-with-data && yarn test:e2e --workers=1` runs at HEAD; classify failures by failure type (initial-fetch race / subscription-not-flushed / auth-cookie / hydration-timing); lock the binding 36-test list and per-spec failure-type clustering. Output: `73-01-INVENTORY.md` (or equivalent capture) feeding the rest.
  2. **Plan 2 (mechanical sweep):** `playwright/no-networkidle` (6 sites) + `playwright/no-raw-locators` (37 sites) — quick wins, zero behavioral risk, no race investigation needed.
  3. **Plans 3–5 (per-spec investigative passes):** `playwright/no-conditional-in-test` (36 sites) + `playwright/no-conditional-expect` (18 sites) clustered **by failure type from D-04 Plan 1**, not by file. Each plan owns 1–2 spec files end-to-end (rewrite warnings + race-fix together, per DETERM-02+03 pairing in REQUIREMENTS).
  4. **Plan 6 (parity-gate regen + 3-run smoke):** restore/rebuild the parity-script tooling (see D-08), regenerate constants against new post-Phase-73 baseline, run end-of-phase 3-run determinism gate, produce VERIFICATION.md.

### Real-bug escalation (DETERM-02)
- **D-05 — Code cap:** Code-level fix lands in Phase 73 if **≤50 LOC, ≤2 files, no public-API change, no migration**. Anything larger → capture as `.planning/todos/pending/` entry with full repro + leave the failing test in the documented post-73 `DATA_RACE` pool (with rationale per D-02). This is the looser cap (vs. ≤30 LOC / single file) chosen because legitimate fixes often span a context + its consumer.
- **D-06 — Default scope:** Test-level fix preferred (proper `waitFor` against asserted element, replace `waitForLoadState('networkidle')`, remove `if (...)` masks). Escalate to code-level only when test-level masks the contract (e.g., the test would have to assert "either A or B" which weakens the contract).

### Bank-auth skip policy (DETERM-01)
- **D-07 — `test.skip(!createdUserId, …)` at `candidate-bank-auth.spec.ts:199`:** Document as **legitimate skip** + add inline `// reason:` justification + ESLint `// eslint-disable-next-line playwright/no-skipped-test` with rationale. Bank-auth is opt-in via `@bank-auth` tag (env-gated, disabled by default in CI). This sets the convention for future env-gated runtime skips: legitimate-skip + inline-justification is OK; the lint rule is enforced for the rest of the suite. Do NOT convert to `expect.poll` (this is a precondition-not-met situation, not a race).

### Parity-gate verification
- **D-08 — Parity-script tooling restoration:** **`scripts/diff-playwright-reports.ts` no longer exists at HEAD** — it was deleted in commit `64ccbe284` (v2.7 milestone start) along with the post-swap baseline JSON. The Phase 73 Plan 6 (parity-gate regen) **must first restore or rebuild the diff-script** before regenerating constants. Sources to draw from:
  - Git blob at SHA `2832c4410` (commit "regenerate parity-script constants from v2.6 anchor baseline (D-08 + D-09 + Pitfall 5)") contains the last-known-good `diff-playwright-reports.ts` with PASS_LOCKED/DATA_RACE/CASCADE constants.
  - `.planning/milestones/v2.6-phases/64-voter-results-reactivity-completion/post-fix/regen-constants.mjs` — one-shot constants generator; uses `categorizeStatus` + `flattenReport` + `IMGPROXY_TIED_TITLES` rules.
  - `.planning/milestones/v2.7-phases/65-svelte-5-audit-sweeps/scripts/diff-parity.mjs` — lighter v2.7-era script; reference only.
  - Path that planner should land tooling at: TBD (likely `tests/scripts/` or `scripts/` — planner picks; both directories currently empty/non-existent).
- **D-09 — Verification shape:** Per-plan validates its own changes via a single `--workers=1` smoke + a spot-check (`for i in {1..3}; do yarn test:e2e --grep "<spec>"; done`) only on plans that touched a flake-prone spec. The **end-of-phase 3-run determinism gate** is run once in Plan 6, captures the new parity baseline, regenerates `diff-playwright-reports.ts` constants, produces VERIFICATION.md. Same shape as v2.6 P64 + v2.8 bundled smoke.
- **D-10 — Vite-cache wipe recipe:** Plan 6's smoke MUST include `rm -rf apps/frontend/node_modules/.vite apps/frontend/.svelte-kit` before the run, per the v2.8 close gotcha (pre-bundled deps retained pre-rename source between phases). This recipe is documented in `.planning/milestones/v2.8-MILESTONE-AUDIT.md` "Bundled Manual Smoke" section.

### Folded Todos
- **`.planning/todos/pending/2026-04-27-remove-e2e-skip-modifiers.md`** (DETERM-01) — already tagged `resolves_phase: 73`. Provides the inventory + classification protocol (Removable / Documented-flake / Genuinely conditional) and the optional follow-up (lint rule / CI grep gate). The follow-up lint enforcement is **deferred** — Phase 73 closes the substantive sweep; CI gate is a v2.10+ cleanup item.
- **`.planning/todos/pending/2026-05-10-tests-playwright-hygiene-sweep.md`** (DETERM-03) — already tagged `resolves_phase: 73`. Provides the per-rule sweep order + final-step "drop `--quiet` flag and bump gate from 'warnings allowed' to 'warnings forbidden'" — the planner should include this gate-bump in Plan 6.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase 73 anchors (REQUIREMENTS / ROADMAP / STATE)
- `.planning/REQUIREMENTS.md` §DETERM (DETERM-01 / DETERM-02 / DETERM-03) — locked success criteria; note number drift in D-03 above.
- `.planning/ROADMAP.md` §"Phase 73: Determinism Baseline" — phase goal + dependencies + 5 success criteria + estimate (4–6 plans).
- `.planning/STATE.md` lines 119, 132 — Phase 73 risk profile (high — race investigations may surface real product bugs requiring code-level fixes; explicit "branching risk" callout) + plan-shape estimate.
- `.planning/PROJECT.md` §"Current Milestone: v2.9" + §"Future" §"Determinism baseline" — milestone framing.

### Inputs to DETERM-01 / 02 / 03
- `.planning/todos/pending/2026-04-27-remove-e2e-skip-modifiers.md` — DETERM-01 sweep + classification protocol (Removable / Documented-flake / Genuinely conditional).
- `.planning/todos/pending/2026-05-10-tests-playwright-hygiene-sweep.md` — DETERM-03 inventory + per-rule sweep order (no-networkidle → no-raw-locators → no-conditional-in-test, smallest first) + final lint-gate bump.
- `.planning/notes/2026-05-10-v2.9-e2e-coverage-inventory.md` §"Strategy: Determinism First" + §"Skip-modifier & flake debt" — operator framing of why determinism is gating.
- `.planning/notes/2026-05-08-e2e-test-inventory.md` — broader E2E inventory underlying v2.9 framing.

### Pattern references (v2.6 P64)
- `.planning/milestones/v2.6-phases/64-voter-results-reactivity-completion/64-CONTEXT.md` — D-07/D-08/D-09/D-10/Pitfall 5 (race-tolerant `expect.poll(...).toBeGreaterThan(0)` pattern; parity-script constants regen protocol; IMGPROXY_TIED_TITLES classification).
- `.planning/milestones/v2.6-phases/64-voter-results-reactivity-completion/64-VERIFICATION.md` — verdict + 5/5 PASS table + parity-script self-identity smoke output (`PARITY GATE: PASS` shape).
- `.planning/milestones/v2.6-phases/64-voter-results-reactivity-completion/post-fix/regen-constants.mjs` — constants regenerator; bind-source for the parity-script tooling restoration in Plan 6.

### Bundled-smoke / vite-cache caveats (v2.8)
- `.planning/milestones/v2.8-MILESTONE-AUDIT.md` §"Bundled Manual Smoke (2026-05-10)" — `rm -rf apps/frontend/node_modules/.vite apps/frontend/.svelte-kit` recipe and why it's required between phases that touch i18n keys or shared types.
- `.planning/todos/completed/2026-05-09-phase-69-parity-gate-followup.md` §"Pre-capture caveat" — permanent home for the vite-cache gotcha.

### Parity-script git history (D-08 restoration)
- Git commit `5b449ab73` — `feat(59-03): add diff-playwright-reports parity-gate script` (original landing).
- Git commit `90a7f08ba` — `chore(60-01): restore diff-playwright-reports.ts and baseline report from SHA 3c57949c8` (last restoration).
- Git commit `2832c4410` — `chore(64-03): regenerate parity-script constants from v2.6 anchor baseline` (last-known-good constants — 66 PASS_LOCKED + 15 DATA_RACE + 21 CASCADE).
- Git commit `64ccbe284` — `docs: start milestone v2.7` (deletion of `diff-playwright-reports.ts` + post-swap baseline JSON).

### Project-level conventions
- `CLAUDE.md` §"Context Destructuring Rule (Svelte 5)" — referenced if a race investigation surfaces a Svelte 5 reactivity hazard (e.g., destructured reactive accessor) requiring a code-level fix.
- `.planning/milestones/v2.6-phases/63-e2e-template-extension-greening/post-v2.6/diff.md` lines 11–32 (referenced from regen-constants.mjs) — the IMGPROXY_TIED_TITLES list bound by P64 CONTEXT D-09; structurally fragile (a renamed test fails the regen loudly).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`expect.poll(...)` race-tolerant assertion pattern** (v2.6 P64): `await expect.poll(async () => /* count */).toBeGreaterThan(0)`. Replaced 6 silent `test.skip(true)` voter-results paths in P64. Default polling is 5s, configurable via `{ timeout, intervals }`. Use this as the default replacement for races where the test contract is "X must eventually appear" rather than "X must appear synchronously".
- **`waitFor` against asserted element**: `await page.getByRole('...').waitFor({ state: 'visible' })` — the no-networkidle replacement of choice. Already used in some specs; should become the default.
- **Semantic locators**: `getByRole`, `getByText`, `getByTestId` — replacements for raw `page.locator('...')`. The no-raw-locators sweep (37 sites) follows this hierarchy.
- **Parity-script constants from `regen-constants.mjs`**: `PASS_LOCKED` (66) + `DATA_RACE` (15) + `CASCADE` (21) categorization rules + `IMGPROXY_TIED_TITLES` list. Restore as the basis for Plan 6 tooling.
- **Vite-cache wipe recipe**: `rm -rf apps/frontend/node_modules/.vite apps/frontend/.svelte-kit` before any "true cold start" smoke. Folded as the v2.9 Phase 78 / CLEAN-01's `dev:clean` script — Phase 73 Plan 6 should use this recipe directly (don't wait for CLEAN-01).

### Established Patterns
- **3-run determinism gate** (v2.6 P64): single fresh `yarn dev:reset-with-data && yarn test:e2e --workers=1` followed by 2 re-runs without resetting; identical pass/fail set across all 3 runs is the gate.
- **Per-spec investigative pass for tests** (v2.6 P64 D-11): rewrite the silent skip + race-fix in one go; produces a deterministic test contract per spec; the parity-script reclassifies tests at the end.
- **Inline justification for accepted lint warnings** (v2.8 P70 Cat A "Option A inline ignore-with-rationale preamble"): the canonical shape for ESLint disables with rationale. Anchor lives in CLAUDE.md (CLEAN-03 sub-finding 3 will formalize this further). Use this shape for the bank-auth skip (D-07).
- **Cluster-level vs per-cast `// reason:` annotations** (v2.8 P71 D-04): per-cast distribution preferred where strict reading expects it. If race fixes introduce `// reason:` annotations, distribute per-site.

### Integration Points
- **`tests/playwright.config.ts`** — workers, reporters, retries config; the `--workers=1` determinism gate convention.
- **`tests/eslint.config.mjs`** — playwright/* rule config; the post-Phase-73 lint-gate bump (DETERM-03 final step) lands here.
- **`tests/tests/specs/voter/voter-results.spec.ts`** — exemplar for `expect.poll` race-tolerant pattern (P64 D-11).
- **`tests/tests/specs/candidate/candidate-bank-auth.spec.ts:199`** — the only remaining `test.skip(...)` site (D-07).
- **`tests/tests/fixtures/*.ts`** + **`packages/dev-seed/src/templates/e2e.ts`** — fixture/template extension surface if a race fix requires a deterministic seed prerequisite (per skip-modifier todo's "Removable" classification).
- **`.planning/milestones/v2.7-phases/65-svelte-5-audit-sweeps/scripts/diff-parity.mjs`** — v2.7-era lightweight diff script; reference for restoration shape but probably superseded by the full P64 script.

</code_context>

<specifics>
## Specific Ideas

- **Anchor list for Plan 1 inventory:** the 36-test pool from P64's parity-script — concretely, the IMGPROXY_TIED_TITLES (14 titles, 15 entries with the dual-project `re-authenticate as candidate` row) + the CASCADE_BASELINE (21) — derived by re-running `regen-constants.mjs` against the cold-run baseline at HEAD. Plan 1's deliverable is the binding 36-test list + per-test failure-type classification.
- **Acceptable post-73 DATA_RACE pool entries** (per D-02): tests that fail for infrastructure reasons (imgproxy 502, supabase imgproxy crash) — these are not Phase 73's job to fix. Leave in the pool with rationale; the v2.8 close already classified imgproxy as infrastructure debt out of scope.
- **Bank-auth skip rationale text** (per D-07): something like `// reason: bank-auth is opt-in via @bank-auth tag (env-gated, disabled by default in CI); this skip is the precondition-gate for the Edge Function integration test, not a race.` — pattern matches the v2.8 P71 D-04 `// reason:` anchor convention.
- **Planner re-baseline at PLAN.md time:** re-run `yarn workspace @openvaa/tests lint:check 2>&1 | grep -E "playwright/" | awk '{print $NF}' | sort | uniq -c | sort -rn` to confirm the 103-warning split (it may shift between context-write and PLAN.md-write). Lock the per-rule counts in PLAN.md.

</specifics>

<deferred>
## Deferred Ideas

- **Lint-rule enforcement carry-forward:** the skip-modifier todo's optional follow-up — an ESLint rule or CI grep gate that flags `test.skip(true, ...)` going forward. Phase 73 closes the substantive sweep; CI-gate enforcement is a v2.10+ cleanup item (similar to how DETERM-03's final lint-gate bump in `tests/eslint.config.mjs` IS in scope, but a custom skip-modifier rule isn't).
- **Default-parallelism stability follow-up:** REQUIREMENTS.md DETERM-02 specifies `--workers=1`. Phase 73 doesn't validate stability under default parallelism (which exposes more races). If v2.9 Phases 74–77 need parallelism for time, a separate stability follow-up phase may be needed.
- **Custom matchers / shared race-tolerant assertion helpers:** if Plan 3–5 surface 5+ uses of the `expect.poll(...).toBeGreaterThan(0)` pattern, consider extracting a `expectEventually(locator, predicate)` helper in `tests/tests/utils/`. Defer to v2.10+ unless the count is overwhelming during Phase 73 execution.
- **Imgproxy 502 root-cause:** known infrastructure flake (PROJECT.md §"Known infrastructure issue"); fix recipe is `supabase stop && supabase start`. Out of v2.9 scope per the v2.8 close.

### Reviewed Todos (not folded)
- `2026-04-27-extend-e2e-filter-type-coverage.md` — folds into v2.9 Phase 77 / SETTINGS-01 (toggle matrix), not Phase 73. Surfaced by `todo.match-phase` with score 0.6 on keyword overlap; Phase 73 is determinism-only, not new coverage.
- `2026-05-10-rename-package-scripts-dev-to-db.md` — Phase 78 / CLEAN-01. Phase 73 will USE the equivalent of `dev:clean` (vite-cache wipe in Plan 6) but won't rename scripts.
- `2026-05-09-tighten-i18n-wrapper.md` — Phase 78 / CLEAN-04, paired with E2E-08 (locale switching). Not Phase 73.
- The remaining `todo.match-phase` matches (score 0.4–0.9) are noise — Phase 73 is determinism-only. Examples: `2026-03-28-investigate-migrating-candidate-answer-store.md`, `password-reset-code-method.md`, `rename-admin-writer.md` — none touch the test suite.

</deferred>

---

*Phase: 73-Determinism Baseline*
*Context gathered: 2026-05-10*
