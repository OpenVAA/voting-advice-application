---
phase: 191
slug: instance-overlay-upstream
status: complete
nyquist_compliant: true
wave_0_complete: true
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
- **After every plan:** red→green runs for new tests; after the plan's last code commit, one targeted `tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/191-<plan>-<project> --no-db-reset --no-watch --project <p>` run per affected project, sequentially. Plan 01 (dist byte-identical) runs `voter-journey`; Plans 02, 03 and 04 (frontend-wide changes) each run all five: `visual-regression`, `voter-dark-mode`, `perm-localisation-positive`, `a11y-smoke`, `voter-journey`; Plan 05 changes nothing the suite serves; Plan 06 runs the full suite. Plans 01–04 record per-project test counts, deltas and title pins (sorted titles from `npx playwright test -c tests/playwright.config.ts --list --project <p>`) against the last full run, falling back to absolute counts and the listing when no prior full-run record exists
- **Phase gate (final plan):** full E2E run + build-identity comparison against `8f2bb68a7` + `yarn lint:check` + `yarn format:check`
- **Max feedback latency:** 120 seconds (unit)

---

## Per-Task Verification Map

Filled by the Plan 06 executor from the six PLAN.md files and their SUMMARYs. Commands are the tasks' `<automated>` verifies, abbreviated where long.

| Task ID | Plan | Requirement | Automated command | Status |
|---------|------|-------------|-------------------|--------|
| 191-01-T1 | 01 | SC-1 | `yarn workspace @openvaa/app-shared test:unit -- src/settings/staticSettings.schema.test.ts && yarn workspace @openvaa/app-shared typecheck` | ✅ green (f61992766 RED, bfd66586c GREEN) |
| 191-01-T2 | 01 | SC-1, SC-3 | `yarn workspace @openvaa/app-shared test:unit && … typecheck && … tsc -p tsconfig.config.json && … build && cmp dist/index.js(.map)` against the pre-plan build | ✅ green (4a90e6359 RED, 2b5331cfd GREEN); dist byte-identical |
| 191-02-T1 | 02 | SC-2, SC-3 | `cd apps/frontend && yarn vitest run vite.instanceTheme.test.ts && yarn workspace @openvaa/frontend typecheck` | ✅ green (3521b4e52 RED, 58a843863 GREEN) |
| 191-02-T2 | 02 | SC-2, SC-3 | `cd apps/frontend && yarn vitest run src/lib/dynamic-components/appLogo/AppLogo.svelte.test.ts && yarn workspace @openvaa/frontend check` | ✅ green (2bcd6fa4d RED, 1d3ca7eb1 GREEN) |
| 191-03-T1 | 03 | SC-2, SC-3 | `cd apps/frontend && yarn vitest run instanceAssets.test.ts && yarn workspace @openvaa/frontend typecheck` | ✅ green (0285eccc7 RED, d46876f67 GREEN) |
| 191-03-T2 | 03 | SC-2, SC-3 | `cd apps/frontend && yarn vitest run svelte.config.test.ts instanceAssets.test.ts && yarn workspace @openvaa/frontend check && test ! -e apps/frontend/.instance` | ✅ green (bc4bf4031 RED, b94079109 GREEN, 398ae9e0e style) |
| 191-04-T1 | 04 | SC-2, SC-3 | `cd apps/frontend && yarn vitest run src/lib/i18n/utils/messageCatalog.test.ts src/lib/i18n/tests/translations.test.ts` | ✅ green (107e3d5fc RED, 6ac693125 GREEN) |
| 191-04-T2 | 04 | SC-2, SC-3 | `cd apps/frontend && yarn vitest run src/lib/i18n/utils/instanceMessages.test.ts … src/lib/i18n/tests && yarn workspace @openvaa/frontend paraglide:compile && … typecheck` | ✅ green (6349b8b9e RED, b5b527b9b GREEN) |
| 191-05-T1 | 05 | SC-3 | `yarn workspace @openvaa/dev-seed vitest run tests/turboBuildInputsGate.test.ts tests/ciDockerImageBuildGate.test.ts && prettier --check instance/README.md apps/frontend/turbo.json` | ✅ green (c11a68801 RED, 4e73dc5d1 GREEN) |
| 191-05-T2 | 05 | SC-1, SC-2, SC-3 | `bash …/191-05-instance-smoke.sh` (34 assertions) `&& ! grep -q '^FAIL' evidence.log && test -z "$(git status --porcelain)"` | ✅ green (34 passed, 0 failed) |
| 191-05-T3 | 05 | SC-2 | `prettier --check` on the six docs files `&& grep -q "instance/…"` per page | ✅ green (506a50479) |
| 191-06-T1 | 06 | SC-3 | build 8f2bb68a7 and HEAD at one absolute path; `cmp`/`diff -r` of app-shared dist, Paraglide output, static copy, CSS assets; `diff -rq` of `_app` and `build/server` with every difference attributed | ✅ green (see 191-06-SUMMARY.md) |
| 191-06-T2 | 06 | SC-3 | `yarn test:unit && yarn lint:check && yarn format:check`; full `tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/191-06-full --no-db-reset --no-watch` | ✅ E2E full run 742/742 green (`tests/e2e-runs/191-06-full`), `lint:check` and `format:check` exit 0; ⚠ `yarn test:unit`: every turbo workspace task green, and the 1 + 6 failures in the root `tests` and `infra` vitest suites are host-dependent, predate this phase and are identical at 8f2bb68a7 (`deferred-items.md`) |

Requirement → test map (from research):

| Req | Behavior | Test Type | Automated Command | File Exists |
|-----|----------|-----------|-------------------|-------------|
| SC-1 | Schema ≡ `StaticSettings`; shipped literal parses | unit + typecheck | `yarn workspace @openvaa/app-shared test:unit && yarn workspace @openvaa/app-shared typecheck` | ✅ |
| SC-1 | `resolveStaticSettings` merge and rejection cases | unit | same | ✅ |
| SC-1 | tsup build inlines overlay; none → byte-identical dist | build smoke | vitest running tsup into a temp dir (`tsup.config.test.ts`) | ✅ |
| SC-2 | Assets helper / `kit.files.assets` | unit | `yarn workspace @openvaa/frontend test:unit` | ✅ |
| SC-2 | Message overlay project + key/placeholder checks + compile | unit + integration | same | ✅ |
| SC-2 | Theme transform identity / replacement | unit | same | ✅ |
| SC-2 | AppLogo precedence | component unit | same | ✅ |
| SC-3 | turbo inputs include instance paths | repo-meta unit | `yarn workspace @openvaa/dev-seed vitest run tests/turboBuildInputsGate.test.ts` | ✅ |
| SC-3 | UI unchanged / whole suite unchanged | E2E | targeted projects (Plans 01–04), then the full run (Plan 06) | ✅ |

*Status: ⬜ pending · ✅ green · ❌ red*

---

## Wave 0 Requirements

- [x] `packages/app-shared/src/settings/staticSettings.schema.test.ts`, `resolveStaticSettings.test.ts`
- [x] frontend instance tests (theme transform, message project, locale check) with fixture overlays
- [x] assets helper test + `svelte.config.test.ts` extensions
- [x] `turboBuildInputsGate.test.ts` extension
- [x] shared i18n flatten/placeholder module extracted from `translations.test.ts`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Docker image builds with and without overlay | SC-3 | needs dockerd; CI job `docker-image-build` covers it | `docker build --file apps/frontend/Dockerfile --target production .` |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 120s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** signed off by the Plan 06 executor, 2026-11-23, on the build-identity comparison and the green full E2E run recorded in 191-06-SUMMARY.md
