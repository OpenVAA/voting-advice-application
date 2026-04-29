---
phase: 65
slug: svelte-5-audit-sweeps
status: draft
nyquist_compliant: false
wave_0_complete: true
created: 2026-04-29
---

# Phase 65 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (unit) + Playwright (E2E) + svelte-check (type) |
| **Config files** | `apps/frontend/vitest.config.ts`, `tests/playwright.config.ts`, `apps/frontend/tsconfig.json` |
| **Quick run command** | `yarn workspace @openvaa/frontend check` (type, ~30s) |
| **Full suite command** | `yarn playwright test -c ./tests/playwright.config.ts --workers=1 --reporter=json` (parity gate, ~3-5 min) |
| **Estimated runtime** | ~30s quick / ~3-5 min full / ~10 min including manual smoke |

---

## Sampling Rate

- **After every task commit:** Run `yarn workspace @openvaa/frontend check` (type gate)
- **After every plan wave:** Run `yarn test:unit && yarn workspace @openvaa/frontend check`
- **Before `/gsd-verify-work`:** Full suite must be green + manual smoke (voter 9-step + candidate 4-step) clean
- **Max feedback latency:** ~30 seconds (type) / ~3 min (unit suite)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 65-01-* | 65-01 | 1 | SVELTE5-01 | — | N/A — refactor only | static / grep + type | `grep -rn "bind:" apps/frontend/src/lib --include='*.svelte'` (verify each line carries adjacent inline comment); `yarn workspace @openvaa/frontend check` | ✅ existing tooling | ⬜ pending |
| 65-02-* | 65-02 | 2 | SVELTE5-02, SVELTE5-03 | — | N/A — refactor + docs only | static / grep + type | `grep -B2 "{#key" apps/frontend/src --include='*.svelte'` (verify adjacent comments); `grep -A3 "Context Destructuring Rule" CLAUDE.md` (verify rule text); `yarn workspace @openvaa/frontend check` | ✅ existing tooling | ⬜ pending |
| 65-03-* | 65-03 | 3 | SVELTE5-01, 02, 03 (regression) | — | N/A — verification only | E2E + manual smoke | `yarn playwright test -c ./tests/playwright.config.ts --workers=1 --reporter=json` then `node .planning/phases/59-e2e-fixture-migration/scripts/diff-playwright-reports.ts`; voter 9-step + candidate 4-step manual smoke | ✅ existing tooling + new manual checklist | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `tests/playwright.config.ts` — canonical Playwright invocation (existing)
- [x] `apps/frontend/vitest.config.ts` — unit suite (existing)
- [x] `apps/frontend/package.json` `check` script — svelte-check (existing)
- [x] `.planning/phases/59-e2e-fixture-migration/scripts/diff-playwright-reports.ts` — parity diff (existing)
- [x] `.planning/phases/59-e2e-fixture-migration/post-swap/playwright-report.json` — v2.5 baseline (preserved per Phase 64 D-15)
- [x] `.planning/phases/64-voter-results-reactivity-completion/post-fix/playwright-report.json` — v2.6 baseline (Phase 64 D-08)

**Wave 0 status:** COMPLETE. All required test infrastructure exists at HEAD `2c7ad2dea`. The only NEW artifact Phase 65 creates is the manual smoke checklist (Plan 65-03 inline), not a code-side test file.

---

## Behavioral / Manual Verification

The phase's primary verification is a **manual smoke** — automated tests cannot detect runtime warnings (`binding_property_non_reactive`) without a running dev server + visual inspection of the dev console.

### Voter Flow Smoke (9 steps)

Reused from Phase 60-04 / Phase 64 D-10 manual checkpoint. Walk:
1. Landing page loads, language switcher present
2. Election + constituency selection works
3. Question flow renders (categorical, ordinal, boolean question types)
4. Save + skip controls work; navigation between questions
5. Results page renders; tabs (candidates / parties / alliances if seeded)
6. Filter open + apply (party affiliation filter)
7. Drawer open + close (entity detail view)
8. Deeplink to a results URL with all 4 segments populated
9. Browser back/forward across the flow

**Pass criterion:** Zero `binding_property_non_reactive` warnings in browser dev console across all 9 steps.

### Candidate-App Smoke (4 steps)

Specifically targets the heavy `bind:*` concentration in candidate-app components (PasswordSetter, PasswordValidator, TermsOfUseForm, LogoutButton). Walk:
1. Candidate login (registration or password)
2. View a question; answer it
3. Save the answer
4. Logout

**Pass criterion:** Zero `binding_property_non_reactive` warnings; password setter / validator / terms-of-use bindings function correctly.

---

## Regression Gate

- **v2.6 parity baseline at HEAD `2c7ad2dea`** — full Playwright suite must produce a JSON report that diffs clean against `.planning/phases/64-voter-results-reactivity-completion/post-fix/playwright-report.json` per the parity-script constants embedded in `.planning/phases/59-e2e-fixture-migration/scripts/diff-playwright-reports.ts`.
- **No constants regeneration in Phase 65** — Phase 65 must not move the baseline; the parity gate is a pass-through check. Phase 64 D-08 already regenerated the constants.

---

## Sources

- `.planning/phases/65-svelte-5-audit-sweeps/65-RESEARCH.md` §Validation Architecture (mirrors this file's content with full source citations)
- `.planning/phases/65-svelte-5-audit-sweeps/65-CONTEXT.md` D-03 (manual smoke scope decision)
- `.planning/milestones/v2.6-phases/64-voter-results-reactivity-completion/64-CONTEXT.md` D-08 (parity-script constants regeneration ownership)
- `.planning/milestones/v2.6-phases/60-layout-runes-migration-hydration-fix/` (origin of the 9-step voter manual checkpoint)
