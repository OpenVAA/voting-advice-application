---
phase: 117
slug: dataroot-cold-entry-reactivity-fix
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-06-13
---

# Phase 117 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Derived from 117-RESEARCH.md § Validation Architecture (HIGH confidence).
> Governed by CLAUDE.md's **E2E Hard Rule**: failing E2E is a cardinal failure;
> NO known-flaky exemptions; the full suite is the trusted signal.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **E2E framework** | Playwright (`tests/` workspace; `tests/playwright.config.ts` — NO `webServer`, live `yarn dev` required) |
| **Unit framework** | Vitest (frontend) |
| **Static gates** | `yarn lint:check` (turbo lint + tests eslint + `yarn typecheck:tests`), `yarn build` |
| **Quick run command** | `yarn test:e2e --project=<cold-spec-or-voter-journey>` + `yarn lint:check` on touched files |
| **Full suite command** | `yarn test:e2e` (incl. a11y-smoke + perm family) `&&` `yarn test:unit` `&&` `yarn lint:check` |
| **Estimated runtime** | E2E full suite ~minutes (per CLAUDE.md, "does not take long" — run the whole suite) |

**Precondition (A1):** local Supabase up + frontend dev server on :5173 + `e2e/base`
seed (`data-setup-base`). The Playwright config has no `webServer` block, so the
plan MUST include an explicit "dev server up + DB seeded" precondition before any
E2E task.

---

## Sampling Rate

- **After every task commit:** the relevant single spec/project + `yarn lint:check` on touched files
- **After every plan wave:** `yarn test:e2e --project=voter-journey` (+ the new cold-entry project) + `yarn test:unit`
- **Before `/gsd-verify-work` / phase gate:** **full** `yarn test:e2e` + `yarn test:unit` + `yarn lint:check` all green (= Phase 116 GATE-01)
- **Max feedback latency:** single-project E2E (seconds–low minutes); full suite at wave/gate boundaries

---

## Per-Task Verification Map

| Req | Behavior | Wave | Test Type | Automated Command | File Exists | Status |
|-----|----------|------|-----------|-------------------|-------------|--------|
| COLD-01 | All `dataRoot` alias-then-read consumers rewritten to direct `ctx.dataRoot.<prop>` reads; no broad codemod | 1 | static grep | `grep -rn '\$derived(.*\.dataRoot)' apps/frontend/src/routes apps/frontend/src/lib` → only the 2 allowed writer sites remain | ✅ (grep) | ⬜ pending |
| COLD-01 | Rewritten consumers compile + lint clean | 1 | static | `yarn lint:check` + `yarn build` | ✅ existing | ⬜ pending |
| COLD-02 | CLAUDE.md carve-out documents the `dataRoot` alias-indirection hole | 1 | grep/manual | grep CLAUDE.md "Context Destructuring Rule" for the carve-out (cites Spike 024 / `#version`-bridge / identity-stable) | ❌ W0 (doc edit) | ⬜ pending |
| COLD-03 | Cold direct-URL `/en/elections` renders populated list | 1 | E2E | new cold spec: `await expect(getByTestId('voter-elections-list')).toBeVisible()` after `page.goto('/en/elections')` (no intro walk) | ❌ W0 (new spec) | ⬜ pending |
| COLD-03 | Cold direct-URL `/en/info` asserts the `dataRoot.elections` region (not just static `{@html}`) | 1 | E2E | extend/assert the election-data region on cold `/en/info` | ❌ W0 | ⬜ pending |
| COLD-03 | Negative control: new cold spec RED-fails against pre-fix source | 1 | E2E | run the new spec with the alias re-introduced → must FAIL, proving it exercises the regression | ❌ W0 | ⬜ pending |
| COLD-03 | **Full suite green (Phase 116 GATE-01)** | 2 | E2E + unit + lint | `yarn test:e2e` && `yarn test:unit` && `yarn lint:check` | ✅ existing | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky (flaky is NOT an accepted state — per the E2E Hard Rule it must be root-caused)*

---

## Wave 0 Requirements

- [ ] New cold-entry E2E spec (or step) under a `data-setup-base`-dependent project — covers COLD-03. Assert `voter-elections-list` visibility on cold `page.goto('/en/elections')`.
- [ ] CLAUDE.md "Context Destructuring Rule" carve-out edit — covers COLD-02.
- [ ] (No framework install — Playwright + Vitest already wired.)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Negative-control confirmation that the cold spec actually catches the bug | COLD-03 | Requires temporarily reintroducing the alias (a throwaway local edit) before the fix is final | `git stash` the elections fix OR re-add `const dataRoot = $derived(ctx.dataRoot)` + alias read in one site; run the new cold spec; confirm RED; restore |

*All shipping behaviors otherwise have automated verification.*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references (cold spec + CLAUDE.md edit)
- [ ] No watch-mode flags
- [ ] Negative-control RED-fail confirmed before COLD-03 sign-off
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
