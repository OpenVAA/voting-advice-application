---
phase: 68
slug: dev-tooling-trio
status: approved
nyquist_compliant: true
wave_0_complete: true
created: 2026-05-08
---

# Phase 68 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework (unit)** | vitest 3.2.4 |
| **Framework (E2E + parity)** | Playwright 1.58.2 |
| **Config file (unit)** | `apps/frontend/vitest.config.ts` (workspace), per-package `vitest.config.ts` |
| **Config file (E2E)** | `tests/playwright.config.ts` |
| **Quick run command** | `yarn lint:check` |
| **Full suite command** | `yarn build && yarn test:unit && yarn lint:check` |
| **Parity gate command** | `node .planning/phases/65-svelte-5-audit-sweeps/scripts/diff-parity.mjs <baseline.json> <post.json>` |
| **Estimated runtime (quick)** | ~5–15 seconds |
| **Estimated runtime (full)** | ~3–5 minutes |
| **Estimated runtime (parity gate)** | ~2 minutes (after E2E run) |

---

## Sampling Rate

- **After every task commit:** Run `yarn lint:check` (quick — 5–15s)
- **After every plan wave:** Run `yarn build && yarn test:unit && yarn lint:check` (full — 3–5 min)
- **Before `/gsd-verify-work`:** Full suite must be green; v2.6 parity gate at HEAD `2c7ad2dea` must still pass
- **Max feedback latency:** 15 seconds for incremental signal (lint), 5 minutes for full gate
- **Autoreload-specific (D-01 only, observation-based, manual smoke):**
  - Package source edit → Vite HMR fires within **< 5s** of save (target < 2s; investigate > 10s)
  - `.env` save → Vite logs "server restarted" within **< 2s**

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 68-01-01 | 01 | 1 | DEVTOOLS-01 | — | N/A | manual smoke | edit `packages/data/src/index.ts`; observe Vite HMR fires < 5s | ✅ existing | ⬜ pending |
| 68-01-02 | 01 | 1 | DEVTOOLS-01 | — | N/A | manual smoke | edit `.env`; observe Vite log "server restarted" | ✅ existing | ⬜ pending |
| 68-01-03 | 01 | 1 | DEVTOOLS-01 | — | N/A | docs presence | `test -f apps/frontend/README.md && grep -q 'Dev workflow' apps/frontend/README.md` | ❌ W0 | ⬜ pending |
| 68-02-01 | 02 | 1 | DEVTOOLS-02 | — | N/A | static check | `yarn lint:check` exits 0 with new rules registered | ✅ existing | ⬜ pending |
| 68-02-02 | 02 | 1 | DEVTOOLS-02 | — | N/A | lint pass | `yarn lint:check 2>&1 \| grep -c 'unused-imports'` returns 0 | ✅ existing | ⬜ pending |
| 68-02-03 | 02 | 1 | DEVTOOLS-02 | — | N/A | lint pass | `yarn lint:check 2>&1 \| grep -c 'no-restricted-imports'` returns 0 | ✅ existing | ⬜ pending |
| 68-03-01 | 03 | 1 | DEVTOOLS-03 | — | N/A | static check | `grep -q '"apps/supabase/supabase/functions"' .vscode/settings.json` | ✅ existing | ⬜ pending |
| 68-03-02 | 03 | 1 | DEVTOOLS-03 | — | N/A | grep audit | `grep -ri 'deno' .github/workflows/` returns empty | ✅ existing | ⬜ pending |
| 68-03-03 | 03 | 1 | DEVTOOLS-03 | — | N/A | filesystem audit | `find . -name 'deno.json' -o -name 'deno.jsonc' -o -name 'deno.lock' \| grep -v node_modules \| wc -l` returns 0 | ✅ existing | ⬜ pending |
| 68-XX-PARITY | (last) | 2 | (cross-cutting SC-4) | — | N/A | E2E + parity diff | `yarn build && yarn test:unit && yarn lint:check && yarn test:e2e` then `node .planning/phases/65-svelte-5-audit-sweeps/scripts/diff-parity.mjs <baseline> <post>` returns `PARITY GATE: PASS` | ✅ existing (script + baseline) | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `apps/frontend/README.md` — NEW file, must contain a "Dev workflow" section documenting the autoreload mechanism (per ROADMAP SC-1)
- [ ] `eslint.config.mjs` `ignores` entry for `**/src/lib/paraglide/**` — preventive; avoids fix-then-regenerate churn (Pitfall 6 in RESEARCH.md)

*All other phase behaviors verify against existing infrastructure (`yarn lint:check`, `yarn build`, `yarn test:unit`, Playwright E2E, the v2.6 parity gate script).*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Vite HMR fires on `packages/*/dist/` rebuild | DEVTOOLS-01 | Wall-clock observation; automating would require Playwright + filesystem hooks (gold-plating per RESEARCH.md) | 1) Run `yarn dev`. 2) Edit a source file in `packages/data/src/`. 3) Observe Vite HMR log in console within < 5s. 4) Confirm browser updates without manual reload. |
| Vite full restart on `.env` save | DEVTOOLS-01 | Wall-clock observation | 1) Run `yarn dev`. 2) Save `.env` (no edit needed — touch). 3) Observe "server restarted" within < 2s. |
| `_deno_shims/` audit | DEVTOOLS-03 | Existence check (RESEARCH confirmed: not present) | `test ! -d _deno_shims && echo "OK" \|\| ls -la _deno_shims` |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify, manual smoke instructions, or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify (D-01 manual smokes are bracketed by D-02 lint tasks — OK)
- [ ] Wave 0 covers all MISSING references (`apps/frontend/README.md` creation, ESLint `ignores` for paraglide)
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s (quick) / < 5min (full gate)
- [ ] `nyquist_compliant: true` set in frontmatter (after planner confirms task IDs match)

**Approval:** approved 2026-05-08 (plan-checker VERIFICATION PASSED on first iteration)
