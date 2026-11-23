---
phase: 191-instance-overlay-upstream
plan: 02
subsystem: frontend build / theme / logo
tags: [instance-overlay, vite-plugin, daisyui, tailwind, app-logo, static-settings]
requires:
  - 191-01 (merged staticSettings with optional logo and *-content colours)
provides:
  - applyThemeToAppCss({ css, settings }) and the instanceTheme Vite plugin (openvaa:instance-theme, enforce pre)
  - app.css drift guard (each mapped declaration exactly once per theme block)
  - AppLogo precedence publisherLogo > staticSettings.logo > OpenVAA logo
affects:
  - every page's compiled CSS (identity with the shipped settings)
  - the header logo of both apps
tech-stack:
  added: []
  patterns:
    - pre-transform of a single CSS module before Tailwind compiles it, by value-span splice
    - static-settings fallback tier read inside $derived alongside a stable context reference
key-files:
  created:
    - apps/frontend/vite.instanceTheme.ts
    - apps/frontend/vite.instanceTheme.test.ts
    - apps/frontend/src/lib/dynamic-components/appLogo/AppLogo.svelte.test.ts
  modified:
    - apps/frontend/vite.config.ts
    - apps/frontend/tsconfig.json
    - apps/frontend/src/lib/dynamic-components/appLogo/AppLogo.svelte
decisions:
  - "The theme transform checks every mapped declaration for exactly-one occurrence, set or not, so app.css drift fails the build even for an instance that overrides nothing"
  - "AppLogo's static tier is chosen by an isStaticTier boolean (no publisherLogo url and a staticSettings.logo url), and only that tier falls back to t('dynamic.appName') for alt; the publisher tier keeps its empty alt"
  - "visual-regression is judged by its CI-literal run in the pinned Playwright container; on this host its baselines do not reproduce with or without this plan (byte-identical actual PNGs)"
requirements: [SC-2, SC-3]
metrics:
  duration: ~38 min
  completed: 2026-11-23
  tasks: 2
  files: 6
---

# Phase 191 Plan 02: app.css theme transform and the static logo tier Summary

A `pre` Vite plugin writes the merged `staticSettings` colours (both DaisyUI themes, `--line-color`) and font (`--font-base` family and, for `serif`, the fallback list) into `src/app.css` before Tailwind compiles it. With the shipped settings the output is byte-for-byte the input. A drifted `app.css` fails the build naming the declaration and theme. `AppLogo` now falls back to `staticSettings.logo` below the backend's `publisherLogo`, and names that image with the localised application name.

## Tasks

| Task | Name | Commits | Files |
| ---- | ---- | ------- | ----- |
| 1 | app.css theme transform plugin and its wiring | 3521b4e52 (RED), 58a843863 (GREEN) | vite.instanceTheme.ts(+test), vite.config.ts, tsconfig.json |
| 2 | AppLogo static fallback tier | 2bcd6fa4d (RED), 1d3ca7eb1 (GREEN) | AppLogo.svelte(+test) |

## Verification evidence

- **Task 1 RED:** the test file failed to collect (the module did not exist). **GREEN:** 13/13 passed. The cases cover strict identity, the light primary (exactly 2 lines differ), accent and warning mapping, dark line-color (1 line), an optional content colour, sans and serif fonts, missing, duplicated and line-color drift, and the plugin's name, enforce, other-id and `?query` cases.
- **Task 2 RED:** 7 failed and 3 passed. The 7 are every static-tier case. The 3 that passed are the publisher-over-static case, the OpenVAA fallback and the empty publisher-tier alt. **GREEN:** 10/10 passed.
- **Build identity:** I recorded `ls` of `apps/frontend/build/client/_app/immutable/assets/*.css` before the vite.config change and again after it. The names are equal (`0.eM3aWFsc.css`, `51.CXgf1j-8.css`, `entityCard.CR5i2mt3.css`, `main.3TER8PAr.css`), and `cmp` of all four files passes.
- **Live overlay proof (SC-2):** I created a temporary `instance/staticSettings.json` with `colors.light.primary` `#a1b2c3` and a serif `Merriweather` font, then rebuilt app-shared and the frontend.
  - The CSS hash changed to `0.ClF6gIKc.css`, which contains `a1b2c3` four times.
  - It also contains `Merriweather", ui-serif, Georgia, Cambria, "Times New Roman", Times, serif, "Apple Color Emoji", …`.
  - I then removed `instance/` and rebuilt. All four CSS files are again `cmp`-identical to the baseline.
- **Gates:** frontend `typecheck` 0, `check` (svelte-check, fail-on-warnings) 0, `test:unit` 0 (339 files, 8895 tests), `lint` 0 errors, and `yarn assert:comment-hygiene` 0.
  - The one lint warning is pre-existing, in `IdentityProviderGate.svelte.test.ts`, and out of scope.
  - The `awk` order check (instanceTheme before tailwindcss) exits 0.
  - `staticSettings.logo` appears 3 times in AppLogo.svelte. The destructure grep prints 0.

## E2E (targeted runs, per the 2026-11-09 ruling)

| Run dir | Project | Result | Listed | Executed | Delta vs last full run | Title pins |
| ------- | ------- | ------ | ------ | -------- | ---------------------- | ---------- |
| tests/e2e-runs/191-02-voter-dark-mode | voter-dark-mode | GREEN, exit 0, 3 passed, not void | 3 | 3 | 0 | unchanged |
| tests/e2e-runs/191-02-perm-localisation-positive | perm-localisation-positive | GREEN, exit 0, 273 passed, not void | 273 | 273 | 0 | unchanged |
| tests/e2e-runs/191-02-a11y-smoke | a11y-smoke | GREEN, exit 0, 20 passed, not void | 20 | 20 | 0 | unchanged |
| tests/e2e-runs/191-02-voter-journey | voter-journey | GREEN, exit 0, 4 passed, not void | 4 | 4 | 0 | unchanged (equal to 191-01-voter-journey-2/titles.txt) |
| tests/e2e-runs/191-02-visual-regression-container | visual-regression (pinned CI container, `--ci-literal`) | GREEN, exit 0, 8 passed, 0 unexpected, 0 flaky, 0 skipped | 8 | 8 | 0 | unchanged |

- Every run had 0 failed, 0 flaky, 0 skipped and 0 did-not-run, per each run dir's `results.json` stats.
- Each run dir has `list.txt` (the `--list` output) and `titles.txt` (the sorted `›` lines).
- **Last full-run record:** this is the same one plan 01 used, `.planning/workstreams/deployment/phases/189.1-…/evidence/189.1-10-closing-e2e.md` (tree d5216b03, totals only).
  - For each of the five project specs, the sorted literal `test`/`it`/`describe` titles at d5216b03 equal HEAD's, so the delta is 0 for every project.
  - This plan changes no spec or fixture.
  - `visual-regression` is opt-in (`PLAYWRIGHT_VISUAL`), so it is not in the default full run. Plan 06's full run is judged on its own listing.
- **visual-regression, the other run dirs (kept):**
  - `191-02-visual-regression` exited 6 at config load: `Project(s) "visual-regression" not found`, because `PLAYWRIGHT_VISUAL` was not set. No test executed.
  - `191-02-visual-regression-2` (`PLAYWRIGHT_VISUAL=1`, the wrapper on the host, as CI invokes it) was red: 4 of 4 screenshots differed, for example 1280x821 expected against 1280x829 received.
  - The control `191-02-visual-regression-control-preplan` reverted this plan's `vite.config.ts` and `AppLogo.svelte` to 4cd6fe365 in the working tree. It is red with the same sizes and pixel counts. All 12 PNGs in the two HTML reports (expected, actual and diff for each case) are sha256-identical, so on this host the plan changes no rendered pixel.
  - The baselines are Linux/x86_64 captures from the pinned `mcr.microsoft.com/playwright@sha256:eff16c30…` image (spec docblock, `main.yaml`). They do not reproduce under the host's rasterisation.
  - I pulled that pinned digest, served the plan's tree on `0.0.0.0` with `PUBLIC_PROJECT_ID` set to the E2E project, and ran `tests/scripts/visual-container.sh --ci-literal`. It was green (row above). The dev server was stopped afterwards.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] visual-regression needs `PLAYWRIGHT_VISUAL=1` and the CI container**
- **Found during:** the E2E verification.
- **Issue:** the plan's plain `--project visual-regression` command is rejected at config load. With the env var set, the host run cannot reproduce the container-captured baselines, and that is equally true of the pre-plan tree.
- **Fix:** I ran the project the way CI judges it. That was the pinned image by digest, through `visual-container.sh --ci-literal`. I kept the host and control runs as evidence that the host red does not depend on this plan.
- **Files modified:** none.

**2. [Rule 1 - Lint] `consistent-type-imports` in the AppLogo test**
- **Fix:** `importActual<typeof AppShared>()` with `import type * as AppShared from '@openvaa/app-shared'` replaces the inline `typeof import(...)`.
- **Commit:** 2bcd6fa4d

**3. Test fake carries `publisherName` in the hoisted box**
- **Fix:** the plan's fake context fixed `publisherName: undefined`, but the 'Pub' alt case needs it, so the box holds it.
- **Commit:** 2bcd6fa4d

## Known Stubs

None.

## Threat model coverage

| Threat | Mitigation |
| ------ | ---------- |
| T-191-06 | `applyThemeToAppCss` splices only the value span of known declarations, never appends rules, and throws on drift. Values arrive through Plan 01's schema (six-digit hex, charset-restricted font name), which the TSDoc states as a precondition. |
| T-191-07 | `staticSettings.logo.url` is constrained by Plan 01's `AssetUrlSchema`. It reaches the DOM only as a Svelte-escaped `src` attribute. |
| T-191-08 | Accepted. Drift fails the build, naming `--color-<x>` and the theme (tested). |
| T-191-09 | Transferred. `a11y-smoke` is green on the base palette. |

## Self-Check: PASSED

- FOUND: apps/frontend/vite.instanceTheme.ts, apps/frontend/vite.instanceTheme.test.ts, apps/frontend/src/lib/dynamic-components/appLogo/AppLogo.svelte.test.ts
- FOUND: commits 3521b4e52, 58a843863, 2bcd6fa4d, 1d3ca7eb1
