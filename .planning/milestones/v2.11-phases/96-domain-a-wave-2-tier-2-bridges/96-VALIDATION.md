---
phase: 96
slug: domain-a-wave-2-tier-2-bridges
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-04
---

# Phase 96 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Per-criterion validation detail is in `96-RESEARCH.md` → "## Validation Architecture".

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (unit, frontend) + Playwright (E2E) |
| **Config file** | `apps/frontend/vitest.config.ts`; `tests/playwright.config.ts` |
| **Quick run command** | `yarn workspace @openvaa/frontend test:unit` |
| **Full suite command** | `yarn test:unit` + `yarn test:e2e` (voter-journey + candidate-journey) |
| **Estimated runtime** | unit ~5s; voter/candidate-journey ~1–2m each |

---

## Sampling Rate

- **After every task commit:** Run `yarn workspace @openvaa/frontend test:unit` (+ `tsc`/svelte-check on touched files)
- **After every plan wave:** Run `yarn build` + `yarn test:unit`
- **Before `/gsd-verify-work`:** voter-journey + candidate-journey E2E green (the contexts under migration drive both)
- **Max feedback latency:** ~30s (unit); ~2m (journey E2E)

---

## Per-Criterion Validation Map

| SC | Requirement | Validation | Test Type | Command / Assertion |
|----|-------------|-----------|-----------|---------------------|
| SC-1 | CTX-06 | `survey` + `trackingService` have zero `svelte/store` imports; values via `.current` getters | source assertion | `grep -L "svelte/store" survey*.ts trackingService*.ts` returns the files; grep for `fromStore(`/`toStore(` over appSettings/sessionId/userPreferences = 0 in those files |
| SC-2 | CTX-07 | voterContext + candidateContext are rune-native factories composing Tier-1 via `getXContext()`; all reactive accessors exposed as getters; `runeSessionStorage` (via `sessionStorageState`) backs `voterContext.firstQuestionId` | source + behavior | `firstQuestionId` round-trips through sessionStorage across reload (E2E or unit); accessors return live values (not snapshots) |
| SC-3 | CTX-06/07 | destructure-trap reproduces + is preserved (consumers read `ctx.X`); existing E2E stays green | E2E regression | `yarn test:e2e --project=voter-journey` + `--project=candidate-journey` green; no consumer destructures reactive accessors |

---

## Wave 0 Requirements

- Existing infrastructure covers all phase requirements (vitest + Playwright already configured; `localStorageState`/`persistedState.svelte.ts` core shipped in Phase 95). No new framework install.
- A `sessionStorageState` unit test (sibling of the existing `persistedState.svelte.test.ts` localStorage coverage) is the only net-new test stub.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| (none expected) | — | Tier-2 migration is a surface swap with full unit + journey-E2E coverage | — |
