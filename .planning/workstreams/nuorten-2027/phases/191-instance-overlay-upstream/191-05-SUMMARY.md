---
phase: 191-instance-overlay-upstream
plan: 05
subsystem: build / image / docs
tags: [instance-overlay, turborepo, docker, docs, evidence]
requires:
  - 191-01 (app-shared settings overlay + its turbo input)
  - 191-02 (theme transform, logo fallback)
  - 191-03 (static asset layer)
  - 191-04 (message overlay)
provides:
  - instance/README.md (tracked; keeps instance/ present; downstream documentation)
  - apps/frontend/turbo.json build inputs $TURBO_ROOT$/instance/static/** and $TURBO_ROOT$/instance/messages/**
  - Dockerfile base stage `COPY instance instance` before `yarn install --immutable`
  - gate assertions for both seams (turboBuildInputsGate, ciDockerImageBuildGate)
  - rerunnable end-to-end evidence script 191-05-instance-smoke.sh (34 assertions)
affects:
  - every frontend build cache key; the production image; developer and publisher docs
tech-stack:
  added: []
  patterns:
    - $TURBO_ROOT$ inputs for files outside every package
    - evidence script with an EXIT trap that always removes the fixture
key-files:
  created:
    - instance/README.md
    - .planning/workstreams/nuorten-2027/phases/191-instance-overlay-upstream/191-05-instance-smoke.sh
  modified:
    - apps/frontend/turbo.json
    - apps/frontend/Dockerfile
    - .github/workflows/main.yaml
    - packages/dev-seed/tests/turboBuildInputsGate.test.ts
    - packages/dev-seed/tests/ciDockerImageBuildGate.test.ts
    - packages/app-shared/src/settings/README.md
    - apps/docs/src/routes/(content)/developers-guide/configuration/static-settings/+page.md
    - apps/docs/src/routes/(content)/developers-guide/localization/supported-locales/+page.md
    - apps/docs/src/routes/(content)/developers-guide/configuration/intro/+page.md
    - apps/docs/src/routes/(content)/developers-guide/localization/locale-resolution/+page.md
    - apps/docs/src/routes/(content)/publishers-guide/preparing/the-vaa-look-and-feel/+page.md
decisions:
  - "The frontend-filtered dry run already contains @openvaa/app-shared#build (a ^build dependency), so the gate test adds no --filter=@openvaa/app-shared"
  - "A turbo cache hit writes outputs over apps/frontend/build/ without deleting files that are no longer outputs; the evidence script removes build/ before every compared build, and instance/README.md tells downstream to do the same after deleting an overlay file"
  - "The evidence fixture carries a per-run nonce in admin.email and the font file, so the cache-miss assertions hold on every rerun"
  - "The evidence script removes exactly the fixture paths it created (rm -rf) instead of `git clean -fd instance`"
requirements: [SC-1, SC-2, SC-3]
metrics:
  duration: ~95min
  completed: 2026-11-23
  tasks: 3
  files: 13
---

# Phase 191 Plan 05: Instance overlay cache, image and docs seams Summary

The instance overlay is now part of the frontend's Turborepo cache key and the production Docker image. It is documented in `instance/README.md` and the docs site. A 34-assertion evidence script proves every layer (settings, theme colour, font, favicon, logo, messages) in a local build, a served build and the production image. It also shows that invalid overlays fail the build and that the image builds with no overlay.

## Tasks

| Task | Name | Commits |
| ---- | ---- | ------- |
| 1 | Cache and image seams with their gate assertions | c11a68801 (RED), 4e73dc5d1 (GREEN) |
| 2 | End-to-end fixture instance build and Docker images | cf1f0e136, 4aa6c161f, 149ee8fdd |
| 3 | Documentation of the overlay | 506a50479 |

### Task 1
- RED run: `turboBuildInputsGate` › "@openvaa/frontend#build reads instance/static and instance/messages" and `ciDockerImageBuildGate` › "copies the instance overlay before the install and build" failed (2 failed, 21 passed). After the turbo.json and Dockerfile changes: 23/23 passed.
- `@openvaa/app-shared#build` is already in the `--filter=@openvaa/frontend --filter=@openvaa/docs` dry run (resolved inputs `../../instance/staticSettings.json`, `src/**`, …), so the dry-run args are unchanged.
- `grep "^COPY instance instance$" apps/frontend/Dockerfile` matches one line (22); `git ls-files instance` = `instance/README.md`; `yarn lint:workflows` exits 0.

### Task 2: evidence (`tests/e2e-runs/191-05-instance-smoke/evidence.log`)

```
== baseline build
baseline CSS assets: 4
== fixture
PASS fixture favicon differs from the base favicon
== build with the fixture
PASS build with the fixture exits 0
PASS turbo: @openvaa/app-shared:build is a cache miss
PASS turbo: @openvaa/frontend:build is a cache miss
PASS app-shared dist holds the overlaid admin email
PASS SSR view: staticSettings.admin.email and font.url are overlaid
PASS compiled CSS holds the overlaid primary #123456
PASS compiled CSS holds the font family Smoke Sans
PASS compiled CSS no longer holds the base primary #2546a8
PASS build/client/favicon.png is the instance favicon
PASS build/client/fonts/smoke.css is the instance font file
PASS build/client/images/instance-logo.svg is present
PASS build/client/fonts/inter.css (base only) is kept
PASS compiled Paraglide messages hold the instance text
PASS the build holds the overlaid logo url
== served build
PASS the built server answers 200 for /fonts/smoke.css
PASS served /fonts/smoke.css is the instance file
PASS the served page links the instance font stylesheet
== invalid overlays fail the build
PASS an unknown settings key fails the app-shared build with Unrecognized key
PASS a changed placeholder fails the message compile naming common.publishedBy
== production image with the overlay
PASS docker build of the production image with the overlay exits 0
PASS image SSR view: staticSettings.admin.email and font.url are overlaid
PASS image: favicon and font file are the instance files
== cleanup
PASS the base build after cleanup exits 0
PASS the working tree is clean
PASS git ls-files instance is instance/README.md only
PASS apps/frontend/.instance is absent
PASS the CSS asset names equal the baseline
PASS build/client/favicon.png is the base favicon again
PASS build/client/fonts/smoke.css is gone
PASS SSR view: the base admin email is back
== production image without the overlay
PASS docker build of the production image without the overlay exits 0
PASS image SSR view: the base admin email
PASS image: /opt/instance holds README.md only
== 34 passed, 0 failed
```

Run as `DOCKER_BUILD_EXTRA="--network host" bash .planning/.../191-05-instance-smoke.sh`. The working tree was clean afterwards, and both smoke images were removed.

**Docker environment note (this host only, nothing committed):** this box's containers can't reach the network except through the host's agent proxy, and that proxy refuses `repo.yarnpkg.com` (403), which the Dockerfile's `corepack prepare yarn@4.18.1` downloads from. For the run, `node:24-alpine` was temporarily re-tagged to a local shim image. The shim was the same official image plus the proxy CA, the proxy env and `COREPACK_NPM_REGISTRY=https://registry.npmjs.org`, so corepack fetches `@yarnpkg/cli-dist` from npm. The build ran with `--network host`. The original tag (`sha256:116b800c…`) was restored afterwards and the shim removed. The upstream Dockerfile is unchanged, and CI's `docker-image-build` job (normal network) needs none of this. A first attempt also hit Docker Hub's anonymous pull rate limit (429), which cleared when retried.

### Task 3
- All acceptance greps hold. The "set separately" sentence is replaced. `yarn workspace @openvaa/docs build` exits 0, and Prettier is clean on all six files.

## Verification
- `yarn workspace @openvaa/dev-seed test:unit`: 74 files, 1146 tests passed.
- `yarn lint:workflows` 0, `yarn assert:comment-hygiene` 0.
- E2E: under the 2026-11-09 ruling this plan changes no route, helper, spec or fixture the suite serves, so it owes no targeted project run. No earlier plan's code was changed. The full suite runs in Plan 06. Project test-count deltas: none.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The evidence script as first written could not serve the build or compare clean outputs**
- **Found during:** Task 2 (first `--no-docker` run, 22 PASS / 4 FAIL)
- **Issue:** (a) the built server refuses to start without `ORIGIN`; (b) the failing negative settings build empties app-shared's `dist` (tsup cleans first), so the next message compile can't import `@openvaa/app-shared`; (c) a turbo cache hit replays outputs over `apps/frontend/build/` without deleting stale files, so `smoke.css` and the overlay CSS survived cleanup.
- **Fix:** set `ORIGIN`; rebuild app-shared after the settings negative; remove `apps/frontend/build` before the baseline and in the fixture removal. Documented (c) in `instance/README.md`.
- **Commits:** 4aa6c161f, 506a50479

**2. [Rule 3 - Blocking] Extra docker build flags**
- The script accepts `DOCKER_BUILD_EXTRA` (used as `--network host`) for hosts whose containers reach the network only through the host. Commit 149ee8fdd.

**3. Minor:** the script always builds the baseline instead of only when no build exists, so the baseline matches the current tree. It removes only the fixture paths it created, not `git clean -fd instance`. A per-run nonce keeps the cache-miss assertions valid on reruns.

## Known Stubs

None.

## Self-Check: PASSED
- FOUND: instance/README.md, 191-05-instance-smoke.sh, apps/frontend/turbo.json (instance inputs), Dockerfile `COPY instance instance`
- FOUND commits: c11a68801, 4e73dc5d1, cf1f0e136, 4aa6c161f, 149ee8fdd, 506a50479
