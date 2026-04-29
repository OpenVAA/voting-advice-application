---
phase: 65
slug: svelte-5-audit-sweeps
status: draft
nyquist_compliant: false
wave_0_complete: true
created: 2026-04-29
revised: 2026-04-29
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
| 65-01-1 (audit worklist) | 65-01 | 1 | SVELTE5-01 | — | N/A — read-only audit | static / file-presence | `test -f /tmp/65-01-bind-classified.txt && [ "$(wc -l < /tmp/65-01-bind-classified.txt)" -eq 93 ]` | ✅ existing tooling | ⬜ pending |
| 65-01-2a (Pattern 1/2/Pitfall 2 fixes) | 65-01 | 1 | SVELTE5-01 | — | N/A — refactor only | static / type | `yarn workspace @openvaa/frontend check`; verify zero `investigate:missing-bindable` lines remain in worklist | ✅ existing tooling | ⬜ pending |
| 65-01-2b (annotate 93 sites) | 65-01 | 1 | SVELTE5-01 | — | N/A — annotation only | static / grep + type | `grep -rn "bind:" apps/frontend/src/lib --include='*.svelte'` (verify each line carries adjacent inline comment); `yarn workspace @openvaa/frontend check` | ✅ existing tooling | ⬜ pending |
| 65-02-* | 65-02 | 2 | SVELTE5-02, SVELTE5-03 | — | N/A — refactor + docs only | static / grep + type | `grep -B2 "{#key" apps/frontend/src --include='*.svelte'` (verify adjacent comments); `grep -A3 "Context Destructuring Rule" CLAUDE.md` (verify rule text); `! grep "\[Code review checklist\](docs/code-review-checklist.md)" CLAUDE.md` (verify line 293 link fix); `yarn workspace @openvaa/frontend check` | ✅ existing tooling | ⬜ pending |
| 65-03-* | 65-03 | 3 | SVELTE5-01, 02, 03 (regression) | — | N/A — verification only | E2E + manual smoke | `yarn playwright test -c ./tests/playwright.config.ts --workers=1 --reporter=json` then `node .planning/phases/65-svelte-5-audit-sweeps/scripts/diff-parity.mjs <baseline> <post>`; voter 9-step + candidate 4-step manual smoke | ✅ existing Playwright + new in-phase parity helper + new manual checklist | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `tests/playwright.config.ts` — canonical Playwright invocation (existing)
- [x] `apps/frontend/vitest.config.ts` — unit suite (existing)
- [x] `apps/frontend/package.json` `check` script — svelte-check (existing)
- [ ] `.planning/phases/65-svelte-5-audit-sweeps/scripts/diff-parity.mjs` — inline parity diff helper (NEW; written as part of Plan 65-03 Task 1; reuses Phase 64's `flattenReport` pattern from `.planning/milestones/v2.6-phases/64-voter-results-reactivity-completion/post-fix/regen-constants.mjs:26-50`. The earlier-referenced `.planning/phases/59-e2e-fixture-migration/scripts/diff-playwright-reports.ts` does NOT exist on disk; Phase 64 used a manual count comparison per `.planning/milestones/v2.6-phases/64-voter-results-reactivity-completion/post-fix/diff.md`.)
- [x] `.planning/milestones/v2.5-phases/59-e2e-fixture-migration/post-swap/playwright-report.json` — v2.5 baseline (preserved per Phase 64 D-15; located at v2.5-phases NOT v2.6-phases — verified by `find`)
- [x] `.planning/milestones/v2.6-phases/64-voter-results-reactivity-completion/post-fix/playwright-report.json` — v2.6 anchor baseline (Phase 64 D-08; HEAD `190a42d7c`; the parity target for Phase 65)

**Wave 0 status:** PARTIALLY COMPLETE. The Playwright + vitest + svelte-check infrastructure is all in place. The inline parity-diff helper is NEW for Plan 65-03 Task 1; it reuses Phase 64's existing `flattenReport` walk pattern (no new dependencies). The Phase 64 anchor JSON at `.planning/milestones/v2.6-phases/64-voter-results-reactivity-completion/post-fix/playwright-report.json` is the v2.6 baseline (NOT a `v2.6-phases/`-prefixed alternative path — verified). The earlier-referenced `.planning/phases/59-e2e-fixture-migration/scripts/diff-playwright-reports.ts` was a phantom path; Phase 59 is at `.planning/milestones/v2.5-phases/59-e2e-fixture-migration/` and has no `scripts/` subdirectory.

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

**Pass criterion:** Zero `binding_property_non_reactive` warnings in browser dev console across all 9 steps. Operator records the explicit line `voter binding_property_non_reactive: 0` in `/tmp/65-03-manual-smoke.md` (the strict gate replacing the lax `voter PASS` substring match).

### Candidate-App Smoke (4 steps)

Specifically targets the heavy `bind:*` concentration in candidate-app components (PasswordSetter, PasswordValidator, TermsOfUseForm, LogoutButton). Walk:
1. Candidate login (registration or password)
2. View a question; answer it
3. Save the answer
4. Logout

**Pass criterion:** Zero `binding_property_non_reactive` warnings; password setter / validator / terms-of-use bindings function correctly. Operator records the explicit line `candidate binding_property_non_reactive: 0` in `/tmp/65-03-manual-smoke.md`.

---

## Regression Gate

- **v2.6 anchor baseline at HEAD `190a42d7c`** (Phase 64 D-08 anchor) — full Playwright suite must produce a JSON report whose pass/fail/cascade counts match `.planning/milestones/v2.6-phases/64-voter-results-reactivity-completion/post-fix/playwright-report.json` per the inline parity helper at `.planning/phases/65-svelte-5-audit-sweeps/scripts/diff-parity.mjs`.
- **Phase 64 reference contract:** `Baseline: 67p / 1f / 34c, Post: 67p / 1f / 34c, PARITY GATE: PASS` (per `.planning/milestones/v2.6-phases/64-voter-results-reactivity-completion/post-fix/diff.md`).
- **Tolerance:** ±1 fail count, accommodating a single isolated imgproxy CAND-03 flake (data-race pool member; STATE.md §Blockers/Concerns documents as known infrastructure debt). Newly-failing tests that passed in baseline are an immediate hard fail with no tolerance.
- **No constants regeneration in Phase 65** — Phase 65 must not move the baseline; the parity gate is a pass-through count check. Phase 64 D-08 already regenerated the constants.

---

## Sources

- `.planning/phases/65-svelte-5-audit-sweeps/65-RESEARCH.md` §Validation Architecture (mirrors this file's content with full source citations)
- `.planning/phases/65-svelte-5-audit-sweeps/65-CONTEXT.md` D-03 (manual smoke scope decision)
- `.planning/milestones/v2.6-phases/64-voter-results-reactivity-completion/64-CONTEXT.md` D-08 (parity-script constants regeneration ownership)
- `.planning/milestones/v2.6-phases/64-voter-results-reactivity-completion/post-fix/diff.md` (Phase 64 PARITY GATE: PASS report — the parity methodology Phase 65 reuses inline)
- `.planning/milestones/v2.6-phases/64-voter-results-reactivity-completion/post-fix/regen-constants.mjs` (Phase 64's `flattenReport` walk pattern reused in the new diff-parity.mjs helper)
- `.planning/milestones/v2.6-phases/60-layout-runes-migration-hydration-fix/` (origin of the 9-step voter manual checkpoint)
