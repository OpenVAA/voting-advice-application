---
phase: 66
slug: nominations-schema-adapter-type-cleanup
status: approved
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-29
---

# Phase 66 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution. Derived from `66-RESEARCH.md` §Validation Architecture.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 1.x (unit) + svelte-check 3.x (type) + Playwright (E2E parity) |
| **Config file** | `apps/frontend/vitest.config.ts` (existing); `apps/frontend/tsconfig.json` (existing); `tests/playwright.config.ts` (existing) |
| **Quick run command** | `yarn workspace @openvaa/frontend check` |
| **Full suite command** | `yarn workspace @openvaa/frontend test:unit && yarn playwright test -c ./tests/playwright.config.ts --workers=1 --reporter=json` |
| **Estimated runtime** | ~30s quick / ~5-10 min full |

---

## Sampling Rate

- **After every task commit:** `yarn workspace @openvaa/frontend check` (~30s — type gate; canonical signal that the type-only change compiles)
- **After every plan wave:** `yarn workspace @openvaa/frontend check && yarn workspace @openvaa/frontend test:unit` (~2-3 min — adds vitest regression on the existing 1519-line `supabaseDataProvider.test.ts`)
- **Before `/gsd-verify-work`:** Full suite + parity gate green
- **Max feedback latency:** 30s (per-task), ~10 min (phase gate)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 66-01-01 | 01 | 1 | ADAPTER-01 (SC-1: sibling type file) | — | N/A (type-only change) | static / file presence | `test -f apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.type.ts && grep -q 'InternalFlatNomination' apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.type.ts` | ❌ NEW (created in plan) | ⬜ pending |
| 66-01-02 | 01 | 1 | ADAPTER-01 (SC-1: zero `as unknown as`) | — | N/A | static / grep | `! grep -nE 'as unknown as' apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts` | ✅ existing | ⬜ pending |
| 66-01-02 | 01 | 1 | ADAPTER-01 (SC-1: zero `: any` annotations) | — | N/A | static / grep | `! grep -nE ':\s*any\b' apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts \| grep -vE 'as any\b'` | ✅ existing | ⬜ pending |
| 66-01-02 | 01 | 1 | ADAPTER-01 (SC-1: type used at both cast sites) | — | N/A | static / grep | `[ "$(grep -c 'InternalFlatNomination' apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts)" -ge 2 ]` | ✅ existing | ⬜ pending |
| 66-01-03 | 01 | 1 | ADAPTER-01 (SC-3: type-check passes) | — | N/A | static / type | `yarn workspace @openvaa/frontend check` | ✅ existing | ⬜ pending |
| 66-01-03 | 01 | 1 | ADAPTER-01 (SC-3: existing test still green) | — | N/A | unit / regression | `yarn workspace @openvaa/frontend test:unit -- --run apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.test.ts` | ✅ existing | ⬜ pending |
| 66-01-04 | 01 | 2 | ADAPTER-01 (SC-2: no leak into shared packages) | — | N/A | static / git | `! git diff --stat HEAD~N HEAD -- packages/supabase-types/ packages/data/ \| grep -q '\.ts'` (no Phase 66 changes to those packages) | ✅ existing git | ⬜ pending |
| 66-01-04 | 01 | 2 | ADAPTER-01 (SC-4: v2.6 parity gate) | — | N/A | E2E / parity | `yarn playwright test -c ./tests/playwright.config.ts --workers=1 --reporter=json > /tmp/66-post-fix.json && node .planning/phases/65-svelte-5-audit-sweeps/scripts/diff-parity.mjs .planning/milestones/v2.6-phases/64-voter-results-reactivity-completion/post-fix/playwright-report.json /tmp/66-post-fix.json` | ✅ existing (script + baseline JSON) | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.type.ts` — NEW, created in Plan 66-01 Task 01 (defines `InternalFlatNomination`)

*Note: All test infrastructure is already in place — Wave 0 has only the new sibling type file.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| (none) | — | — | All phase behaviors have automated verification (type-check, vitest regression, Playwright parity gate). |

*All Phase 66 behaviors are statically and integration-level verifiable; no manual smoke is required because the change is type-only and the parity gate proves runtime invariance.*

---

## Pre-Capture Protocol (Parity Gate)

The Playwright parity gate (SC-4) requires a clean DB to avoid the documented Phase 64 attempts 1-3 / Phase 65 false-positive symptom (mixed default+e2e seed → 40 voter questions). Before the parity capture run:

```bash
yarn supabase:reset
```

This is the **Phase 64 attempt-4 protocol** documented in `.planning/milestones/v2.6-phases/64-voter-results-reactivity-completion/post-fix/diff.md`. Skipping this step has produced 20-test false-positive regressions in both Phase 64 (attempts 1-3) and Phase 65 (initial Task 1 capture).

Also: the raw Playwright JSON has dotenv stdout pollution at byte 0 (`[dotenv@17.3.1] injecting env...`). Strip via `tail -n +2 raw.json > clean.json` before passing to `diff-parity.mjs`.

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: every task in Plan 66-01 has a per-task verify command (no 3 consecutive tasks without automated verify)
- [x] Wave 0 covers all MISSING references (`supabaseDataProvider.type.ts` is the only new artifact and is part of the first task)
- [x] No watch-mode flags
- [x] Feedback latency < 30s for per-task gate
- [ ] `nyquist_compliant: true` set in frontmatter (set after planner verification confirms tasks meet the contract)

**Approval:** pending (set to `approved 2026-04-29` after planner emits `## PLANNING COMPLETE`)
