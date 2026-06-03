---
phase: 93
slug: clean-up-and-reorganise-e2e-tests-fixtures-setup-and-seed-te
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-03
---

# Phase 93 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> This is a **rename/relocation refactor** — it adds ZERO new test coverage. Validation
> proves that moves/renames stay transitively consistent and the suite stays green at
> every commit, NOT that new behavior works.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework (E2E)** | Playwright (`tests/playwright.config.ts`) |
| **Framework (dev-seed)** | Vitest (`packages/dev-seed`, `test:unit`) |
| **Type gate** | `tsc -p tests/tsconfig.json --noEmit` (via `yarn typecheck:tests`) |
| **Quick run command** | `yarn typecheck:tests && eslint --flag v10_config_lookup_from_file tests` |
| **Project-graph resolve** | `npx playwright test --list -c tests/playwright.config.ts` |
| **Full suite command** | `yarn test:e2e` (requires `yarn dev` running) |
| **Estimated runtime (quick trio)** | ~30–60 seconds |

---

## Sampling Rate

- **After every task commit:** quick trio — `yarn typecheck:tests` + `eslint … tests` + scoped `dev-seed test:unit`; add `playwright test --list` whenever `playwright.config.ts` is touched.
- **After every workstream/wave merge:** full `yarn workspace @openvaa/dev-seed test:unit` + `playwright test --list` + zero-token grep.
- **Before `/gsd:verify-work` (phase gate):** full `yarn test:e2e` green + zero-token grep proof.
- **Max feedback latency:** < 60 seconds (cheap gates); full e2e is the single expensive final gate.

---

## Validation Signals (rename/relocation refactor)

| Signal | Command | Cost | Proves |
|--------|---------|------|--------|
| Typecheck clean | `yarn typecheck:tests` | cheap | every moved/renamed import path resolves |
| Lint clean | `eslint --flag v10_config_lookup_from_file tests` | cheap | no-unused / style after moves |
| dev-seed templates pass | `yarn workspace @openvaa/dev-seed test:unit` | cheap | template shapes after D-03 retarget (Wave-0 fix required first) |
| Graph resolves | `npx playwright test --list -c tests/playwright.config.ts` | cheap | project keys + dependencies + testMatch all valid |
| Zero stale tokens | `grep -rn "mega\|baseV1" tests/ packages/dev-seed/src/` → empty (perm `e2e-perm-` namespace explicitly out of scope, FLAG-3) | cheap | D-09/D-10 invariant |
| Full suite green | `yarn test:e2e` | expensive | data seeding + spec behaviour after all moves |

---

## Wave 0 Requirements

- [ ] **Fix the 2 pre-existing dev-seed `test:unit` failures (FLAG-1)** so the gate is meaningful:
  - `packages/dev-seed/tests/templates/e2e.test.ts` (`questions.fixed.length` 25≠18 — mooted/superseded by the D-03 rewrite to the base dataset).
  - `packages/dev-seed/tests/templates/variant-app-settings.test.ts` (imports git-deleted `setup/templates/variant-constituency` — quarantine or fix; unrelated to D-01..D-16 but blocks the same vitest run).
- [ ] **Establish the Playwright graph baseline:** confirm `npx playwright test --list` parses cleanly TODAY, before the D-08 config rewrite, so post-rewrite breakage is attributable.
- [ ] No NEW test files required — phase adds zero coverage.

---

## Manual-Only Verifications

| Behavior | Why Manual | Test Instructions |
|----------|------------|-------------------|
| Full e2e suite green | Requires `yarn dev` (local Supabase + Vite) running; not run per-commit | Start dev stack, `yarn test:e2e`, confirm no DATA_RACE / CASCADE / FAILURE-CLASS regressions vs. pre-phase baseline |

*All structural invariants (import resolution, graph validity, zero-token) have automated cheap-gate verification.*

---

## Validation Sign-Off

- [ ] Every task has a cheap-gate `<automated>` verify (typecheck / lint / `--list` / grep) or a Wave-0 dependency
- [ ] Sampling continuity: no 3 consecutive tasks without an automated verify
- [ ] Wave 0 fixes the 2 dev-seed failures + captures the pre-rewrite graph baseline
- [ ] No watch-mode flags in any command
- [ ] Feedback latency < 60s for the quick trio
- [ ] `nyquist_compliant: true` set in frontmatter once the planner maps each task to a signal

**Approval:** pending
