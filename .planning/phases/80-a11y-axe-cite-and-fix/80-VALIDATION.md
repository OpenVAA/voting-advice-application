---
phase: 80
slug: a11y-axe-cite-and-fix
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-13
---

# Phase 80 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright (E2E axe-smoke + parity-gate full suite) |
| **Config file** | `tests/playwright.config.ts` (a11y-smoke project conditionally registered when `PLAYWRIGHT_A11Y=1`) |
| **Quick run command** | `PLAYWRIGHT_A11Y=1 yarn test:e2e --project=a11y-smoke --workers=1` |
| **Full suite command** | `yarn test:e2e` (default parity-gate; no a11y-smoke unless `PLAYWRIGHT_A11Y=1` also set) |
| **Estimated runtime** | ~30 sec for 6-route a11y-smoke (single-worker); ~25-40 min cold-start full suite |

---

## Sampling Rate

- **After every task commit:** Run `PLAYWRIGHT_A11Y=1 yarn test:e2e --project=a11y-smoke --workers=1` (~30 sec).
- **After every plan wave:** Same — a11y-smoke is fast enough per-commit.
- **Before `/gsd-verify-work`:** Full suite (`yarn test:e2e`) green + a11y-smoke 0-violation green + 3-run cold-start determinism record + parity-script self-identity smoke.
- **Max feedback latency:** ~30 sec (per-commit a11y-smoke).

---

## Per-Task Verification Map

> Task IDs are placeholders — finalized at PLAN.md authoring time. Default 1 bundled plan (Plan 01) per CONTEXT D-08.

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 80-01-01 | 01 | 1 | A11Y-04 SC #1 + SC #2 (NavGroup hoist) | — | `<h4>` hoisted outside `role="list"`; aria-labelledby links list to heading; `role="list"` migrates to inner `<div>` | E2E (axe) | `PLAYWRIGHT_A11Y=1 yarn test:e2e --project=a11y-smoke --workers=1 -g "A11Y-04 axe smoke — results"` | ✅ (a11y-smoke.spec.ts; Phase 80 modifies) | ⬜ pending |
| 80-01-02 | 01 | 1 | A11Y-04 SC #1 + SC #2 (NavItem context-detect) | — | NavItem auto-detects NavGroup ancestor via `getContext(NAV_GROUP_CONTEXT_KEY)`; renders `<div role="listitem">` only when inside; renders bare `<a>` / `<button>` when standalone | E2E (axe) | Same as 80-01-01 + `-g "voter-detail-drawer"` | ✅ + 1 new file `navGroupContext.ts` (Wave 0) | ⬜ pending |
| 80-01-03 | 01 | 1 | A11Y-04 SC #3 (Button aria-label) | — | Button.svelte:183 aria-label fires for `variant === 'icon' \|\| variant === 'floating-icon'`; icon-only variants get accessible name from `text` prop | E2E (axe) | `PLAYWRIGHT_A11Y=1 yarn test:e2e --project=a11y-smoke --workers=1 -g "voter-detail-drawer"` | ✅ | ⬜ pending |
| 80-01-04 | 01 | 1 | A11Y-04 SC #3 (i18n at Drawer call site) | — | `Drawer.svelte:99` passes `text={t('common.closeDialog')}` instead of `text="close"`; localized accessible name in all 7 locales | E2E (axe) | Same as 80-01-03 | ✅ (i18n key verified by research in en/fi/sv/da/lb/fr/et) | ⬜ pending |
| 80-01-05 | 01 | 1 | A11Y-04 SC #4 (per-rule + global-zero assertions) | — | `a11y-smoke.spec.ts` modified per CONTEXT D-06: 3 per-rule filter assertions (`aria-required-parent` / `list` / `button-name`) + global `expect(violations).toHaveLength(0)` per route across all 6 routes | E2E (axe) | `PLAYWRIGHT_A11Y=1 yarn test:e2e --project=a11y-smoke --workers=1` (all 6 routes; spec assertions hard-fail if any rule-ID nonzero OR if any new violation surfaces) | ✅ | ⬜ pending |
| 80-01-06 | 01 | 1 | A11Y-04 SC #5 (post-fix baseline artifact) | — | `80-A11Y-BASELINE.md` documents 0-violation state per route + cross-links backward to `76-A11Y-BASELINE.md` | Manual (doc artifact) | `test -f .planning/phases/80-a11y-axe-cite-and-fix/80-A11Y-BASELINE.md && grep -q "0 violations" .planning/phases/80-a11y-axe-cite-and-fix/80-A11Y-BASELINE.md` | ❌ Wave 0 — to create | ⬜ pending |
| 80-01-07 | 01 | 1 | Phase 80 determinism gate (CONTEXT D-09) | — | 2 successive `PLAYWRIGHT_A11Y=1` runs produce byte-identical per-route per-rule violation lists (0-violation lists are trivially identical) | E2E (axe, 2-run) | `for i in 1 2; do PLAYWRIGHT_A11Y=1 yarn test:e2e --project=a11y-smoke --workers=1 --reporter=json > run-$i.json; done && diff <(jq -S '.suites[].specs[].tests[].results[].attachments' run-1.json) <(jq -S '...' run-2.json)` | ✅ (Phase 80 verification gate; recipe Plan 01 close) | ⬜ pending |
| 80-01-08 | 01 | 1 | Phase 80 cold-start parity (CONTEXT D-10/D-11) | — | 3-run cold-start full suite PASS_LOCKED/DATA_RACE/CASCADE pools match Phase 79 v2.10 anchor (80/15/57 @ SHA `ff0334f856…`) | E2E (full suite, 3-run) | `yarn db:reset && yarn db:seed --template e2e && yarn dev:clean && for i in 1 2 3; do yarn test:e2e --workers=1 --reporter=json > run-$i.json; done && npx tsx tests/scripts/diff-playwright-reports.ts run-3.json` self-identity (CONTEXT D-12); compare to anchor | ✅ (`tests/scripts/diff-playwright-reports.ts` restored Phase 73 P06; locked Phase 79 P03) | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

**Sampling continuity check:** 80-01-{01..05} all have automated axe-smoke verification (~30 sec). 80-01-06 (baseline artifact) is doc-manual but immediately succeeded by 80-01-07 (axe 2-run) + 80-01-08 (parity gate). No 3-consecutive-task automated gap.

---

## Wave 0 Requirements

- [ ] `apps/frontend/src/lib/dynamic-components/navigation/navGroupContext.ts` — NEW Symbol-keyed module-scoped context (CONTEXT D-03)
- [ ] `.planning/phases/80-a11y-axe-cite-and-fix/80-A11Y-BASELINE.md` — NEW post-fix baseline artifact (CONTEXT D-07, created at Plan 01 close)
- [ ] (Optional sanity) Pre-fix re-baseline run: `PLAYWRIGHT_A11Y=1 yarn test:e2e --project=a11y-smoke --workers=1` at HEAD-pre-changes to confirm Phase 76's 5-violation baseline still holds (~30 sec). Per RESEARCH §Open Question 2.
- [ ] Framework install: none — `@axe-core/playwright@^4.11.3` already installed Phase 76 P03.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Post-fix baseline artifact documents 0-violation state per route + back-link | A11Y-04 SC #5 | Doc-only artifact; no automatable assertion beyond file-exists + content grep (covered by 80-01-06 above). The richer per-route table contents require human review for completeness. | Open `80-A11Y-BASELINE.md`; verify per-route rows show "0 violations — clean post-fix" + backward cross-link to `76-A11Y-BASELINE.md` exists. |
| Screen-reader smoke check (NVDA / VoiceOver) on /results + voter-detail-drawer | A11Y-04 SC #4 (defense-in-depth) | Axe is rule-based; live SR validation confirms list-count announcement + drawer close button accessible name match expected behavior on real assistive tech. Out of CI scope; recommended as Plan 01 close manual UAT. | Cold-start. Open Safari + VoiceOver. Visit `/en/results?electionId=…&constituencyId=…`. Open the menu drawer. Listen for "List with N items" announcement on first NavGroup. Open a voter-detail card. Listen for "Close dialog button" on the floating close. Confirm. |
| Vite-cache wipe + dev-server restart between determinism runs | CONTEXT D-11 | Standard recipe; not automatable in spec | `yarn db:reset && yarn db:seed --template e2e && yarn dev:clean` before each cold-start run. |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s (a11y-smoke)
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
