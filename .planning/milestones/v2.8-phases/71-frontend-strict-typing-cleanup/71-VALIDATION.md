---
phase: 71
slug: frontend-strict-typing-cleanup
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-09
---

# Phase 71 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Source: §Validation Architecture in `71-RESEARCH.md`.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | ESLint flat-config (lint), svelte-check 4.x (type baseline), Vitest (unit), Playwright (E2E parity baseline) |
| **Config file** | `packages/shared-config/eslint.config.mjs` (lint rules); `apps/frontend/tsconfig.json` (svelte-check) |
| **Quick run command** | `yarn workspace @openvaa/frontend lint:check 2>&1 \| tail -10` |
| **Full suite command** | `yarn lint:check && yarn workspace @openvaa/frontend check && yarn test:unit` |
| **Estimated runtime** | ~30s lint + ~45s svelte-check + ~60s unit ≈ 2-3 min full suite |

---

## Sampling Rate

- **After every task commit:** Run `yarn workspace @openvaa/frontend lint:check 2>&1 | grep "<rule-being-fixed>" | wc -l` — count should drop monotonically toward 0 for that rule.
- **After every plan wave:** Run `yarn workspace @openvaa/frontend lint:check; echo $?` — if 0, that wave's rule cluster is cleared.
- **Before `/gsd-verify-work`:** Full suite must be green: `yarn lint:check && yarn workspace @openvaa/frontend check && yarn test:unit`. Playwright parity baseline runs manually against the 11 v2.7 P67 specs (per the v2.7-close convention).
- **Max feedback latency:** ~30 seconds for the per-rule grep (the rule grep is sub-second; a full `lint:check` run dominates).

---

## Per-Task Verification Map

| Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|------|------|-------------|-----------|-------------------|-------------|--------|
| 71-01 (no-explicit-any sweep, 67 errors) | 1 | TYPING-01 | static (rule) | `yarn workspace @openvaa/frontend lint:check 2>&1 \| grep -c "no-explicit-any"` → 0 | ✅ | ⬜ pending |
| 71-02 (naming-convention sweep, 13 errors — type-parameter renames) | 1 | TYPING-01 | static (rule) | `yarn workspace @openvaa/frontend lint:check 2>&1 \| grep -c "naming-convention"` → 0 | ✅ | ⬜ pending |
| 71-03 (func-style sweep, 11 errors) | 1 | TYPING-01 | static (rule) | `yarn workspace @openvaa/frontend lint:check 2>&1 \| grep -c "func-style"` → 0 | ✅ | ⬜ pending |
| 71-04 (long-tail: consistent-type-imports + no-unused-expressions, 4 errors) | 1 | TYPING-01 | static (rule) | `yarn workspace @openvaa/frontend lint:check 2>&1 \| grep -cE "consistent-type-imports\|no-unused-expressions"` → 0 | ✅ | ⬜ pending |
| Phase gate | end | TYPING-01 | static (root) | `yarn lint:check; echo $?` → 0 | ✅ | ⬜ pending |
| Phase gate | end | TYPING-01 | static (svelte-check baseline) | `yarn workspace @openvaa/frontend check 2>&1 \| grep -oE "[0-9]+ ERRORS" \| head -1 \| awk '{print $1}'` → ≤ 160 | ✅ | ⬜ pending |
| Phase gate | end | TYPING-01 | unit | `yarn test:unit; echo $?` → 0 | ✅ | ⬜ pending |
| Phase gate | end | TYPING-01 | E2E (manual) | `yarn dev` (bg) + `yarn test:e2e` against the 11 v2.7 P67 specs | manual | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

**Note on parallelism:** All four plans are designated Wave 1 — they are independent at the rule level. The single cross-plan file conflict (`EntityListWithControls.svelte`, both naming-convention and func-style) is resolved via merge-sequential auto-rebase (per RESEARCH.md §Cross-plan Conflict Audit).

---

## Wave 0 Requirements

- [x] No new test files needed — existing infrastructure covers all 95 errors via static (lint) + svelte-check + unit (vitest) + E2E (playwright).
- [x] No framework install needed — lint, svelte-check, vitest, playwright all present.
- [x] No new fixtures needed — the existing `createMockSupabaseClient` factory in test files is the type source for the test-mock sub-batch (44 of 67 anys).

*Existing infrastructure covers all phase requirements.*

---

## Coverage Bookkeeping (per RESEARCH §9)

Each plan's PLAN.md contains an `## Error List` section with the exact file:line entries from RESEARCH §Cluster Analysis (full enumeration of all 95 errors). After plan completion, the executor's STATE/COMPLETION report includes a per-file:line checkmark verifying the entry was resolved. The verifier's final sweep runs `lint:check` once and confirms 0 errors — any error remaining triggers a per-line audit against the plan's Error List to identify the gap.

**Schema:** `## Error List` table in each plan, columns: `File | Line:Col | Rule | Status | Resolved By (commit SHA)`. Mark `Status: pending → fixed → verified`.

This protects against the failure mode where a plan claims to fix N errors but actually fixes a different N (mis-clustering or rule-string typo).

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| v2.7-close Playwright parity baseline still passes | TYPING-01 (SC-4) | E2E suite runs against a live `yarn dev` server; cannot be reasonably gated in CI for this hygiene phase. Per v2.7-close + Phase 69 P02 convention, parity baseline is a manual smoke. | `yarn dev:reset-with-data` → wait for Supabase + frontend healthy → `yarn test:e2e` against the 11 specs that ran for v2.7 Phase 67. Capture in phase verification report. |

*All other phase behaviors have automated verification via `lint:check` / svelte-check / vitest.*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify (static/unit) or are marked manual (Playwright parity)
- [ ] Sampling continuity: per-rule grep is run after every task commit; full lint:check after every plan
- [ ] Wave 0 gaps: NONE — existing infrastructure covers all paths
- [ ] No watch-mode flags (lint:check, vitest --run, svelte-check are all one-shot)
- [ ] Feedback latency < 30s per rule grep
- [ ] `nyquist_compliant: true` set in frontmatter (after plan-checker approval)

**Approval:** pending
