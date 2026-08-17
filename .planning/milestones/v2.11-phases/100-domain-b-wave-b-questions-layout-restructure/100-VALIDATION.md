---
phase: 100
slug: domain-b-wave-b-questions-layout-restructure
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-04
---

# Phase 100 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Per-criterion validation detail is in `100-RESEARCH.md` → "## Validation Architecture".

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (unit, frontend) + Playwright (E2E) |
| **Config file** | `apps/frontend/vitest.config.ts`; `tests/playwright.config.ts` |
| **Quick run command** | `yarn workspace @openvaa/frontend test:unit` + `yarn typecheck:tests` |
| **Full suite command** | `yarn test:e2e --project=voter-journey` + `PLAYWRIGHT_A11Y=1 yarn test:e2e --project=a11y-smoke` |
| **Estimated runtime** | unit ~5s; voter-journey ~1–2m; a11y-smoke ~20s |

---

## Sampling Rate

- **After every task commit:** `yarn build` (frontend compiles with the layout/leaf restructure) + `yarn workspace @openvaa/frontend test:unit`
- **After every plan wave:** voter-journey E2E (the answer-loop walks Q→Q across variant boundaries — the core behavior under change)
- **Before `/gsd-verify-work`:** voter-journey + a11y-smoke E2E green (Phase 99 VT-names/focus/announcer must not regress)
- **Max feedback latency:** ~30s (build+unit); ~2m (voter-journey)

---

## Per-Criterion Validation Map

| SC | Requirement | Validation | Test Type | Command / Assertion |
|----|-------------|-----------|-----------|---------------------|
| SC-1 | QLAYOUT-01 | `/questions` rendering hoisted from `[questionId]/+page.svelte` into `questions/+layout.svelte` (mirrors results pattern); leaf is an empty stub; intro + category sibling routes still render (layout branches on route) | source + E2E | leaf `+page.svelte` contains only a stub/comment (no `MainContent`); `questions/+layout.svelte` renders the question UI; voter-journey reaches /questions intro, a question, and a category-intro without regression |
| SC-2 | QLAYOUT-02 | Variant remount uses `{#key question.type}` (NOT `{#key question.id}`); input stays mounted across same-variant Q→Q, remounts only at type boundaries; layout-owned `$state` answers survive Q→Q | source + behavior | `grep "{#key question.type}"` present in `questions/+layout.svelte`; `grep -c "{#key question.id}"` = 0; voter-journey answer-loop completes across mixed-variant questions; answers persist (results reflect them) |
| (regression) | — | Phase 99 Wave A surface preserved: `view-transition-name: question-hero`, `question-heading`, `data-focus-on-nav`, `tabindex="-1"`, and the `MainContent` routeTitle announcer all move verbatim | source + E2E | grep the 4 markers present post-move; `PLAYWRIGHT_A11Y=1 a11y-smoke` route-announcer + focus blocks stay green |

---

## Wave 0 Requirements

- Existing infrastructure covers all phase requirements (vitest + Playwright configured). No new framework install.
- One new/updated E2E assertion (D-03 per research): variant input survives same-type Q→Q and remounts at type boundaries — added to the existing voter-journey or a11y-smoke spec, not a new harness.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Perceived smoothness of Q→Q (no full redraw) with VT active | QLAYOUT-01/02 | Perceptual; the objective proof is element survival + answer persistence which E2E covers | In a browser, walk Q→Q within a variant run and across a type boundary; confirm no full-page redraw and answers persist |
