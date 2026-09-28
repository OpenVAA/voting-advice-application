---
phase: 62
slug: results-page-consolidation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-24
---

# Phase 62 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution. Source-of-truth Validation Architecture lives in 62-RESEARCH.md §Validation Architecture; this file projects it onto the Nyquist compliance form.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 3.2.4 (unit) + Playwright 1.49.1 (E2E) |
| **Config file** | `apps/frontend/vitest.config.ts`, `apps/frontend/playwright.config.ts` |
| **Quick run command** | `yarn workspace @openvaa/frontend test:unit --run` |
| **Full suite command** | `yarn test:unit && yarn test:e2e` |
| **Estimated runtime** | ~45s unit; ~8min targeted Playwright |

---

## Sampling Rate

- **After every task commit:** `yarn workspace @openvaa/frontend test:unit --run` (scoped to touched file when feasible)
- **After every plan wave:** `yarn test:unit` across affected packages; plus targeted Playwright spec (`voter-results.spec.ts` + any new `entityListWithControls` / `filterContext` test)
- **Before `/gsd-verify-work`:** Full unit suite green; targeted E2E green; no infinite-loop console warnings (effect_update_depth_exceeded) during interactive smoke
- **Max feedback latency:** 45s unit; 8min targeted E2E re-run

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 62-01-* | 01 | 1 | RESULTS-01, RESULTS-02 (filterContext + EntityListWithControls) | — | N/A (consumer-side refactor, no new surfaces) | unit + e2e | `yarn workspace @openvaa/frontend test:unit --run src/lib/contexts src/lib/dynamic-components/entityList` + `yarn playwright test --grep voter-results` | ✅ existing | ⬜ pending |
| 62-02-* | 02 | 2 | RESULTS-03 (route collapse + matchers) | — | N/A | unit + e2e | targeted Playwright for deeplink scenarios | ✅ existing | ⬜ pending |
| 62-03-* | 03 | 2 | RESULTS-01, RESULTS-02, RESULTS-03 (drawer-first paint + re-enable filters + scoping) | — | N/A | e2e (primary) | `yarn playwright test --grep voter-results` | ✅ existing | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `apps/frontend/src/lib/contexts/voter/__tests__/filterContext.test.ts` — new unit test module for `filterContext` scoping rules (per election + plural tuple) and persistence across drawer open/close.
- [ ] `apps/frontend/src/lib/dynamic-components/entityList/__tests__/EntityListWithControls.test.ts` — basic mount + interaction smoke (filter toggle narrows list, no infinite-loop warning).
- [ ] Param matchers: ensure matchers at `apps/frontend/src/params/entityTypePlural.ts` and `apps/frontend/src/params/entityTypeSingular.ts` are introduced before their routes rely on them (Wave 0 gate).

*If these scaffolds already exist, Wave 0 is satisfied. Planner inspects before authoring.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| No visual regression on cold deeplink: drawer paints before list beneath | RESULTS-03 SC-3 (D-10) | Perceived-performance quality — automatable with paint-order mocking but manual QA is faster | Open `/results/<election>/candidates/candidate/<id>` as a cold page load → confirm drawer content appears before list renders behind it |
| Filter-active badge color in both light + dark themes | RESULTS-01 | Visual/tone check — theme contrast confirmation | Toggle dark mode → confirm warning-tinted filter badge remains legible (≥4.5:1 per UI-SPEC) |
| No `effect_update_depth_exceeded` during filter toggle flurry | RESULTS-02 SC-4 | Runtime anomaly — automated test can miss intermittent cycles | DevTools console → toggle 3 filters quickly → confirm no Svelte warnings |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 45s (unit) / 8min (targeted E2E)
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
