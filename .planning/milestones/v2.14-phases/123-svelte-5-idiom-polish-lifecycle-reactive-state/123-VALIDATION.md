---
phase: 123
slug: svelte-5-idiom-polish-lifecycle-reactive-state
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-17
---

# Phase 123 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Source: `123-RESEARCH.md` § Validation Architecture. This phase is **behavior-neutral idiom polish** — validation's job is to prove *nothing changed* for existing paths, plus guard the two RUNES-05 bug fixes.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (unit/regression) + Playwright (E2E final trust) |
| **Config file** | `apps/frontend` workspace vitest config; `tests/playwright.config.ts` (E2E) |
| **Quick run command** | `yarn workspace @openvaa/frontend test:unit` |
| **Full suite command** | `yarn test:e2e` (root — `playwright test -c ./tests/playwright.config.ts ./tests --grep-invert @probe`) |
| **Static gate** | `yarn workspace @openvaa/frontend check` (svelte-check) |
| **Estimated runtime** | unit: seconds · svelte-check: ~1–2 min · full E2E: minutes |

---

## Sampling Rate

- **After every task commit (D-06 atomic commits):** Run `yarn workspace @openvaa/frontend test:unit` + `yarn workspace @openvaa/frontend check` for any touched file.
- **After every plan wave:** Re-run the unit suite; confirm svelte-check error count ≤ baseline (151).
- **Before phase completion (D-03 gate):** build green + full unit suite green + svelte-check ≤ baseline (151 errors / 1 warning) + **one full E2E suite run green**.
- **Max feedback latency:** unit < 30s; static gate < 120s.

---

## Per-Task Verification Map

> Task IDs are assigned at planning time; rows are keyed by requirement until then. Every requirement below has an automated verify — no 3-consecutive-task automated-verify gap is possible.

| Item | Requirement | Test Type | Automated Command | File Exists | Status |
|------|-------------|-----------|-------------------|-------------|--------|
| Bug 2 — explicit `null` terms reaches backend; `undefined` skipped; string path unchanged | RUNES-05 | unit | `yarn workspace @openvaa/frontend test:unit -- candidateUserDataState` | ✅ extend `candidateUserDataState.svelte.test.ts` (add Test 5 + Test 6) | ⬜ pending |
| Bug 1 — `getApplicableQuestions` called with `entityType` in `questionBlocks` path | RUNES-05 | unit | `yarn workspace @openvaa/frontend test:unit -- candidateContext` | ❌ **W0** — NEW `candidateContext.svelte.test.ts` | ⬜ pending |
| Lifecycle audit — each migrated/left site behavior-neutral (per-site D-04) | RUNES-01 | E2E + static | `yarn test:e2e` + `yarn workspace @openvaa/frontend check` | ✅ existing E2E suite | ⬜ pending |
| Reactive-`let`→`$state` behavior-neutral (per-site D-05) | RUNES-02 | unit + E2E | `yarn workspace @openvaa/frontend test:unit` + `yarn test:e2e` | ✅ existing suites | ⬜ pending |
| No net-new svelte-check errors over baseline (criterion 4) | RUNES-01/02/05 | static gate | `yarn workspace @openvaa/frontend check` | ✅ baseline pinned below | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## svelte-check Baseline (pinned)

Captured 2026-06-17 on the clean phase-start working tree via `yarn workspace @openvaa/frontend check`:

```
COMPLETED 2086 FILES  151 ERRORS  1 WARNINGS  30 FILES_WITH_PROBLEMS
```

All 151 errors are pre-existing (TYPE-01/TYPE-02 deferred: `qs` ambient TS7016, admin-jobs `+server.ts` cookies/fetch drift, a few route `string`→`number` errors) — **none in this phase's edit surface.** Criterion 4 = error count must remain **≤ 151** after migration. Re-measure with the identical command on the same tree state if other phases land first (baseline valid only against the phase-start tree).

---

## Wave 0 Requirements

- [ ] `apps/frontend/src/lib/contexts/candidate/candidateContext.svelte.test.ts` — NEW file; covers RUNES-05 Bug 1 (`entityType` in blocks path). Confirm the construction/test seam (research open-question A2: `$effect.root` with stubbed upstream contexts vs. behavior-neutral pure-helper extract) before writing — the assertion (`getApplicableQuestions` called with `entityType`) is invariant either way.
- [ ] Pin the svelte-check baseline (151 errors / 1 warning) as the criterion-4 reference before any source edit.
- [ ] (No framework install needed — vitest + Playwright already present.)

---

## Manual-Only Verifications

*All phase behaviors have automated verification (unit regression for both bugs, existing unit + E2E suites for behavior-neutrality, svelte-check static gate for criterion 4). Per-site lifecycle/reactive-`let` dispositions are documented in-plan and verified by the full E2E suite as the final trust signal.*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers the NEW `candidateContext.svelte.test.ts` + pinned baseline
- [ ] No watch-mode flags
- [ ] Feedback latency < 120s (static gate)
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
