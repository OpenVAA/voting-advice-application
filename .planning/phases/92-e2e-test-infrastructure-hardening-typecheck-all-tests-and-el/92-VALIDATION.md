---
phase: 92
slug: e2e-test-infrastructure-hardening
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-02
---

# Phase 92 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> NOTE: This is a test-*infrastructure* phase — the "system under test" IS the e2e suite + its
> typecheck/lint gates. Validation here means the new gates run green and the existing suite still
> behaves identically (locator/fixture/timeout refactors must not change test semantics).

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright (e2e) + tsc (typecheck) + ESLint (lint) — `tests/` workspace |
| **Config file** | `tests/playwright.config.ts`; new `tests/tsconfig.json` (WS1); eslint config governing `tests/` |
| **Quick run command** | `yarn typecheck:tests` (new root script — `tests/` is NOT a yarn workspace) + `yarn lint:check` (locator rule) |
| **Full suite command** | `yarn test:e2e` (requires `yarn dev` / Supabase up) |
| **Estimated runtime** | typecheck ~seconds; lint ~seconds; full e2e ~minutes |

---

## Sampling Rate

- **After every task commit:** Run the relevant quick gate (`typecheck:tests` for WS1 type fixes; `lint:check` for the locator rule; targeted spec run for fixture/timeout migrations).
- **After every plan wave:** Run the full quick-gate set (typecheck + lint) and a representative spec subset.
- **Before `/gsd:verify-work`:** typecheck green, lint green (locator rule enforced), and a full or near-full e2e run shows no semantic regressions vs the pre-refactor baseline.
- **Max feedback latency:** typecheck/lint < 60s; spec subset < 5 min.

---

## Per-Task Verification Map

> Planner fills concrete task IDs/commands. Skeleton by workstream:

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 92-01-* | WS1 | 1 | TYPECHECK | — | N/A | type | `yarn workspace tests typecheck:tests` exits 0 | ❌ W0 | ⬜ pending |
| 92-01-* | WS1 | 1 | LOCATORS | — | N/A | lint | `yarn lint:check` exits 0 with no-restricted-locators active | ✅ | ⬜ pending |
| 92-02-* | WS2 | 2 | FIXTURES | — | N/A | e2e | migrated specs pass; no raw `page.goto` in scope | ✅ | ⬜ pending |
| 92-03-* | WS3 | 2 | TIMEOUTS | — | N/A | grep+e2e | no local `TIMEOUT` objects / scattered literals remain; specs green | ✅ | ⬜ pending |
| 92-04-* | WS4 | 1 | DIAGNOSIS | — | N/A | grep | annotation present at identified sites | ✅ | ⬜ pending |
| 92-05-* | WS5 | 1 | FRESHGUARD | — | N/A | behavior | guard no longer warns on `seed_`-prefixed baseline; warns on genuine contamination | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/tsconfig.json` — establishes the dedicated typecheck scope for WS1 (does not exist today).
- [ ] `typecheck:tests` script wired into the **root** `package.json` (`tests/` is not a yarn workspace, so the alias-form `yarn workspace tests …` does not apply).

*Everything else uses existing infrastructure (Playwright, ESLint, the dev-seed `seed_` prefix).*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Full e2e suite shows no semantic regression after locator/fixture/timeout refactor | FIXTURES/LOCATORS/TIMEOUTS | Full deterministic run needs Supabase + dev server up; CI/local operator gate | `yarn db:reset && yarn dev` then `yarn test:e2e`; compare pass set to pre-refactor baseline |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references (tests/tsconfig.json + typecheck script)
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s for quick gates
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
