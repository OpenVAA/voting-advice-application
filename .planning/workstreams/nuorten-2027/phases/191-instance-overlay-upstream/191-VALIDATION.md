---
phase: 191
slug: instance-overlay-upstream
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-11-23
---

# Phase 191 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution. Source: `191-RESEARCH.md` § Validation Architecture.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (per workspace); Playwright for E2E |
| **Config file** | `packages/app-shared/vitest.config.ts`, `apps/frontend/vitest.config.ts`, `tests/playwright.config.ts` |
| **Quick run command** | `yarn workspace @openvaa/app-shared test:unit` / `yarn workspace @openvaa/frontend test:unit` |
| **Full suite command** | `yarn test:unit`; E2E full run only in the final plan |
| **Estimated runtime** | ~60 seconds (unit); E2E targeted ~3–8 min per project |

---

## Sampling Rate

- **After every task commit:** affected workspace `test:unit` + `typecheck`
- **After every plan:** red→green runs for new tests; one targeted `tests/scripts/e2e-run.sh --project <p>` run per affected project (`visual-regression`, `voter-dark-mode`, `perm-localisation-positive`, `a11y-smoke`, `voter-journey` for frontend-wide changes); record test-count deltas
- **Phase gate (final plan):** full E2E run + build-identity comparison against `8f2bb68a7` + `yarn lint:check` + `yarn format:check`
- **Max feedback latency:** 120 seconds (unit)

---

## Per-Task Verification Map

To be filled by the planner/executor from the PLAN.md tasks. Requirement → test map:

| Req | Behavior | Test Type | Automated Command | File Exists |
|-----|----------|-----------|-------------------|-------------|
| SC-1 | Schema ≡ `StaticSettings`; shipped literal parses | unit + typecheck | `yarn workspace @openvaa/app-shared test:unit && yarn workspace @openvaa/app-shared typecheck` | ❌ W0 |
| SC-1 | `resolveStaticSettings` merge and rejection cases | unit | same | ❌ W0 |
| SC-1 | tsup build inlines overlay; none → byte-identical dist | build smoke | vitest running tsup into a temp dir | ❌ |
| SC-2 | Assets helper / `kit.files.assets` | unit | `yarn workspace @openvaa/frontend test:unit` | ❌ W0 / ✅ extend |
| SC-2 | Message overlay project + key/placeholder checks + compile | unit + integration | same | ❌ W0 |
| SC-2 | Theme transform identity / replacement | unit | same | ❌ W0 |
| SC-2 | AppLogo precedence | component unit | same | ❌ |
| SC-3 | turbo inputs include instance paths | repo-meta unit | `yarn workspace @openvaa/dev-seed vitest run tests/turboBuildInputsGate.test.ts` | ✅ extend |
| SC-3 | UI unchanged / whole suite unchanged | E2E | targeted projects, then full run | ✅ |

*Status: ⬜ pending · ✅ green · ❌ red*

---

## Wave 0 Requirements

- [ ] `packages/app-shared/src/settings/staticSettings.schema.test.ts`, `resolveStaticSettings.test.ts`
- [ ] frontend instance tests (theme transform, message project, locale check) with fixture overlays
- [ ] assets helper test + `svelte.config.test.ts` extensions
- [ ] `turboBuildInputsGate.test.ts` extension
- [ ] shared i18n flatten/placeholder module extracted from `translations.test.ts`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Docker image builds with and without overlay | SC-3 | needs dockerd; CI job `docker-image-build` covers it | `docker build --file apps/frontend/Dockerfile --target production .` |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 120s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
