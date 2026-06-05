---
phase: 97
slug: domain-a-wave-3-getroute-consumer-codemod
status: approved
nyquist_compliant: true
wave_0_complete: false
created: 2026-06-05
---

# Phase 97 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Per-criterion validation detail is in `97-RESEARCH.md` → "## Validation Architecture".

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (unit, frontend) + Playwright (E2E) |
| **Config file** | `apps/frontend/vitest.config.ts`; `tests/playwright.config.ts` |
| **Quick run command** | `yarn workspace @openvaa/frontend test:unit` + `yarn build --filter=@openvaa/frontend` (typecheck catches the Pitfall-1 `.current` resolution) |
| **Full suite command** | `yarn test:unit` + `yarn test:e2e` (voter-journey + candidate-journey) |
| **Estimated runtime** | unit ~5s; frontend build/typecheck ~30s; voter/candidate-journey ~1–2m each |

---

## Sampling Rate

- **After every task commit:** `yarn workspace @openvaa/frontend test:unit` + `yarn build --filter=@openvaa/frontend` (the typecheck is the gating proof that `appSettings.current`/`dataRoot.current` resolve post-Step-3 — Pitfall 1).
- **After every plan wave:** `yarn build` + `yarn test:unit`.
- **Codemod-specific gate:** dry-run BEFORE `--apply` (capture live counts); dry-run AGAIN after `--apply` (must report **0** rewrites — proves idempotency); human review of the full diff (D-02) before the single mechanical commit.
- **Before `/gsd-verify-work`:** operator-run voter-journey + candidate-journey E2E green vs the v2.10 baseline (82 passed / 2 skipped — DX-4); admin manual UAT (CONS-03) signed off.
- **Max feedback latency:** ~30s (unit + frontend typecheck); ~2m (journey E2E).

---

## Per-Criterion Validation Map

| SC | Requirement | Validation | Test Type | Command / Assertion |
|----|-------------|-----------|-----------|---------------------|
| SC-1 | CTX-08 | `getRoute` is pure `$derived.by` over `page.params`/`page.route`/`page.url` per-field; no `writable<RouteBuilder>`, no `afterNavigate` republish; path/query-param/locale nav resolves | source + E2E | `grep -c "svelte/store" .../getRoute.svelte.ts` → 0; `grep -c "afterNavigate" .../getRoute.svelte.ts` → 0; `yarn test:e2e --project=voter-journey` (the `/elections → /constituencies → /questions` flow the old `toStore` trap broke) green |
| SC-2 | CONS-01 | All `$store.X` template sites (~145 live; ROADMAP est. 146 — live-recaptured, not hard-coded) rewritten to `.current`; build green; no behavior change; codemod idempotent | build + unit + codemod self-check | `yarn build --filter=@openvaa/frontend` green; `yarn workspace @openvaa/frontend test:unit` green; post-apply `node apps/frontend/scripts/spike-009-store-codemod.mjs` reports 0 `$store.X` rewrites |
| SC-3 | CONS-02 | All `$getRoute(` template sites (~133 live; ROADMAP est. 134 — live-recaptured, not hard-coded) + 13 script-block `getRouteState.current(...)` sites migrated; 0 `getRouteState` remain; build green | static grep + build | `grep -rEc '\$getRoute\(' apps/frontend/src --include='*.svelte'` → 0; `grep -rn 'getRouteState' apps/frontend/src` → 0; `yarn build --filter=@openvaa/frontend` green |
| SC-4 | CONS-03 | `adminContext` spread-of-context replaced with explicit delegating getters (fixed FIRST, D-01); `AdminNav` destructure-trap fixed; codemod Pass-2 trap count drops 2→1; admin auth nav reacts to login | codemod audit + **manual UAT** | `node apps/frontend/scripts/spike-009-store-codemod.mjs` → "Total traps flagged: 1" (only the intentional `DestructureTrapConsumer` demo); **manual admin UAT** (see below — no automated admin E2E exists) |

---

## Wave 0 Requirements

- Existing infrastructure covers all phase requirements (vitest + Playwright already configured; the codemod script `apps/frontend/scripts/spike-009-store-codemod.mjs` ships from spike 009). No new framework install.
- **Optional (recommended, non-blocking):** a small unit test asserting `getRoute.current('Home')` builds the expected URL would lock CTX-08. Not required — the existing voter-journey E2E exercises the exact nav flow.
- **No net-new admin E2E spec required** (out of scope) — CONS-03 admin reactivity is verified via manual UAT (see below).

*The existing frontend unit suite (722 tests at Phase 96 close) is the regression net for the mechanical rewrite.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Admin nav reacts to login (auth-context `$derived` accessors live, not captured) | CONS-03 | **No automated admin E2E spec exists** (`tests/tests/specs/` has voter/candidate/perm/a11y/visual/perf, no `admin/*.spec.ts`). The CONTEXT "UI hint: yes" calls for visual verification. | Log into the admin app; confirm the nav switches from the login-link to the authenticated nav group **reactively without a hard refresh**; confirm `AdminAppHome`/`Jobs`/`FactorAnalysis`/`QuestionInfo`/`ArgumentCondensation` links resolve. Add a `checkpoint:human-verify` task in the plan and record the result in `97-UAT.md`. |

---

## Validation Sign-Off

- [ ] All tasks have automated verify or a manual-UAT / Wave 0 dependency
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify (build/typecheck runs per task commit)
- [ ] Wave 0 covers all MISSING references (none — infra exists)
- [ ] No watch-mode flags
- [ ] Feedback latency < 120s
- [ ] `nyquist_compliant: true` set in frontmatter (after plan-checker confirms Dimension 8)

**Approval:** pending
