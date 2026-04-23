---
phase: 58
slug: templates-cli-default-dataset
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-23
---

# Phase 58 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

Source: derived from `58-RESEARCH.md` § Validation Architecture. Concrete per-task mapping is filled in once `58-*-PLAN.md` files exist — the per-task table is created/expanded by the planner in step 8 of plan-phase.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (existing in `@openvaa/dev-seed`) |
| **Config file** | `packages/dev-seed/vitest.config.ts` |
| **Quick run command** | `yarn workspace @openvaa/dev-seed test:unit` |
| **Full suite command** | `yarn test:unit` (turbo, all packages) |
| **Integration test** | `yarn workspace @openvaa/dev-seed test:integration` (Wave 0: add script if absent) |
| **Estimated runtime** | ~3 s dev-seed unit; ~30 s full turbo suite; integration test <10 s against local Supabase |

---

## Sampling Rate

- **After every task commit:** Run `yarn workspace @openvaa/dev-seed test:unit`
- **After every plan wave:** Run `yarn test:unit` (full turbo suite, includes 613 frontend + all package tests)
- **Before `/gsd-verify-work`:** Full suite must be green AND integration test against local Supabase must pass
- **Max feedback latency:** 30 s

---

## Per-Task Verification Map

Per-task rows are populated by the planner (step 8) after PLAN.md files are written. Each task must map to:

| Column | Meaning |
|--------|---------|
| `Task ID` | `58-{plan}-{task}` |
| `Plan` | plan number |
| `Wave` | wave number |
| `Requirement` | one of GEN-09, GEN-10, TMPL-03..07, CLI-01..05, NF-04, DX-01, DX-03, DX-04 |
| `Threat Ref` | threat model ID from PLAN.md `<threat_model>` block (if any) |
| `Secure Behavior` | expected behavior when threat mitigation is active |
| `Test Type` | unit / integration / e2e / manual |
| `Automated Command` | concrete `yarn ...` invocation with workspace + test filter |
| `File Exists` | ✅ (file exists at plan time) / ❌ W0 (needs Wave 0 scaffolding) |
| `Status` | ⬜ pending · ✅ green · ❌ red · ⚠️ flaky |

*Planner fills this table before verification.*

---

## Validation Signals by Success Criterion

Cross-reference (from `58-RESEARCH.md` § Validation Architecture):

| SC | Signal | Assertion |
|----|--------|-----------|
| SC1 | Row counts post-`seed --template default` | elections=1, constituencies≈6, organizations≈8, candidates≈40, questions≈20 (tolerance ±1 where synthesized) |
| SC1 | Candidate portrait coverage | `SELECT count(*) FROM candidates WHERE image IS NOT NULL` = candidate count |
| SC1 | <10 s budget | Elapsed wall time from CLI exit captured and asserted `< 10000` ms |
| SC2 | Locale fan-out completeness | For each `staticSettings.supportedLocales` locale, every translatable JSONB column has a key for that locale (no missing keys) |
| SC2 | Hand-authored + synthetic mix | E.g. organizations with `count: 8, fixed: [{name:'Vihreät'},{name:'Kokoomus'}]` yields exactly 8 rows where 2 have the fixed names and 6 are synthesized |
| SC3 | Template resolution | `.ts`, `.js`, `.json` template loads succeed from absolute and relative paths (3 parameterized test cases); built-in `e2e` template loads by short name |
| SC3 | E2E template parity | Row counts + testId-bearing fields match current `tests/seed-test-data.ts` snapshot (per D-58-15 audit output) |
| SC4 | Teardown idempotence | Pre-count bootstrap rows → seed → count all rows → teardown → post-count = pre-count for bootstrap tables; generator-tagged rows = 0 after teardown |
| SC4 | Bootstrap preservation | Bootstrap rows (default account, project, storage_config) identified by `external_id NOT LIKE 'seed_%'` remain after teardown |
| SC5 | `--help` output | grep for each documented flag (`--template`, `--seed`, `--generateTranslationsForAllLocales`, `--verbose`), for built-in template list, and for custom-template authoring link |
| SC5 | Run summary output | grep CLI stdout for `rows: `, `template: `, `elapsed: ` lines (or equivalent structured summary) |
| SC6 | Determinism | Same `seed: <N>` across two runs → `diff <(run1_dump) <(run2_dump)` is empty (byte-identical) |
| SC6 | Integration test | `.test.ts` file exists under `packages/dev-seed/tests/integration/`, runs against local Supabase, asserts SC1 + SC4 row counts and spot-checks relational wiring |
| SC6 | CLAUDE.md docs | grep `CLAUDE.md` "Common Workflows" section for `yarn dev:reset-with-data` + `seed:teardown` commands |

---

## Wave 0 Requirements

- [ ] `packages/dev-seed/vitest.integration.config.ts` — integration test runner config (or reuse `vitest.config.ts` with glob filter)
- [ ] `packages/dev-seed/package.json` — add `test:integration` script if absent
- [ ] `packages/dev-seed/tests/integration/` — directory scaffolding for integration tests
- [ ] Portrait asset directory: `packages/dev-seed/src/seed/assets/portraits/` — 10-20 permissively-licensed images checked in (or `@openvaa/dev-tools` path — resolve nomenclature before Wave 1; research recommends `@openvaa/dev-seed`)
- [ ] Portrait license attribution: `packages/dev-seed/src/seed/assets/portraits/LICENSE.md` with per-image source + license text

*Research (Section 2) recommends `node:util/parseArgs` and confirms faker v8.4.1 + locale packs are already present — no framework installs required beyond what Phase 57 brought in.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Portrait visual quality | NF-04 / DX-03 | Subjective — "looks like a plausible candidate profile" can't be asserted programmatically | Run `yarn dev:reset-with-data` → open voter app → browse 5 candidate cards → confirm portraits render, are not obviously broken, and are distinguishable from each other |
| E2E template driving existing Playwright specs | TMPL-06 | Full E2E suite lives in a separate phase (59); Phase 58 only provides the template | After `seed --template e2e` completes, run `yarn test:e2e --list` — confirm it lists the same specs as against legacy `tests/seed-test-data.ts` fixtures |
| Licensing posture for bundled portraits | (legal, not a REQ) | Legal judgment call — permissive license wording varies | Review `packages/dev-seed/src/seed/assets/portraits/LICENSE.md` and confirm each image source has an explicit grant to redistribute (not just "personal use") |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies (filled by planner)
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references (integration test scaffolding, portrait assets)
- [ ] No watch-mode flags (vitest runs with `run`, not `watch`)
- [ ] Feedback latency < 30 s
- [ ] `nyquist_compliant: true` set in frontmatter after planner fills per-task map

**Approval:** pending
