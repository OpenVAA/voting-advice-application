---
phase: 42
slug: runtime-validation-and-poc
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-26
---

# Phase 42 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (existing) + deno test (new for POC-01) |
| **Config file** | `vitest.workspace.ts` (existing), per-package `deno.json` (Wave 0) |
| **Quick run command** | `deno test packages/core/tests_deno/` |
| **Full suite command** | `yarn test:unit && deno test packages/core/tests_deno/` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `deno test packages/core/tests_deno/` (for POC-01 tasks)
- **After every plan wave:** Run full validation suite (all smoke + unit + targeted e2e)
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 42-01-01 | 01 | 1 | VAL-01 | smoke | `deno run --allow-env --allow-read --allow-net apps/frontend/build/index.js & sleep 3 && curl -f http://localhost:3000 && kill %1` | Wave 0 (script) | ⬜ pending |
| 42-01-02 | 01 | 1 | VAL-03 | smoke | `yarn build && yarn test:unit` | ✅ existing | ⬜ pending |
| 42-01-03 | 01 | 1 | VAL-04 | smoke | `yarn changeset status` | ✅ existing | ⬜ pending |
| 42-02-01 | 02 | 1 | POC-01 | unit | `deno test packages/core/tests_deno/` | ❌ Wave 0 | ⬜ pending |
| 42-02-02 | 02 | 1 | POC-02 | smoke | `deno check packages/core/src/index.ts` | ❌ Wave 0 | ⬜ pending |
| 42-02-03 | 02 | 1 | POC-03 | smoke | `yarn workspace @openvaa/core build` | ✅ existing | ⬜ pending |
| 42-03-01 | 03 | 2 | VAL-05 | e2e | `npx playwright test --project=auth-setup --project=candidate-app` | ✅ existing specs | ⬜ pending |
| 42-03-02 | 03 | 2 | VAL-02 | e2e | `npx playwright test --project=voter-app` | ✅ existing specs | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Install Deno 2.7.x on development machine
- [ ] `packages/core/tests_deno/` directory with deno-test-compatible test files
- [ ] `packages/core/deno.json` — Deno workspace member config
- [ ] Root `deno.json` — workspace declaration with `nodeModulesDir: "manual"`
- [ ] Smoke test script for VAL-01 (start server, curl, stop)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Supabase auth full flow | VAL-05 | Requires running Supabase + browser session | Start Supabase, start Deno server, run Playwright auth specs, verify session persistence |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
