---
phase: 187-deploy-pipeline
plan: "12"
subsystem: infra
tags: [final-gates, evidence-commits, docker-build, local-proof]
status: complete

requires:
  - phase: 187-11
    provides: "`yarn lint:workflows`, `workflows.test.ts` and the rest of the phase's final tree"
  - phase: 187-03
    provides: "`infra/scripts/build-push-image.sh` archive context and build flags"
provides:
  - "`evidence/187-12-final-gates.md`: the four repository gates, the infra-validate steps and the three example mock plans, all exit 0 at f1602487a"
  - "`refs/evidence/187/green` = 69d10a72357e149c1c35a7002d7779233ffc4d44 (source-only tree fa16b0c68, parent origin/main 340a20070), local only; its archive builds (exit 0)"
  - "`refs/evidence/187/red` = 4d4624315ef323b5f8bb712eebada6b394ee1074 (green tree plus one missing-module import in +layout.ts), local only; its archive build exits 1 in the frontend build"
  - "`evidence/187-12-evidence-commits.md`: both commits and their local build proofs"
affects: [187-13, 187-15, 187-17, 187-18, 187-19]

actuals:
  tokens: 3400
  tasks: 3
  commits: 3
plan_head_before: f1602487a0a466fa95925486d87b3d4361525945
plan_head_after: b34c30d359f5a19960b1bd9d1e7f0cd4c67c2246

tech-stack:
  added: []
  patterns:
    - "Evidence commits written through a temporary GIT_INDEX_FILE in the scratch directory, held by refs/evidence/*, never touching the working tree or the real index"
    - "The script's archive build reproduced locally with --output type=cacheonly in place of the registry tag and --load"

key-files:
  created:
    - .planning/workstreams/deployment/phases/187-deploy-pipeline/evidence/187-12-final-gates.md
    - .planning/workstreams/deployment/phases/187-deploy-pipeline/evidence/187-12-evidence-commits.md
  modified: []

key-decisions:
  - "The red commit fails in the shared stage's RUN yarn build (Dockerfile line 28, turbo task @openvaa/frontend#build), not at the production stage's line 56 as research Pitfall 4 expected; recorded as RED_FAILED_AT_FRONTEND_BUILD=yes with RED_FAILING_DOCKER_STEP naming the real step, since the failing work is the frontend build and the pipeline's build step still ends failed=build before any hosted write"

requirements-completed: []

metrics:
  duration: 12min
  completed: 2026-11-15
---

# Phase 187 Plan 12: Final gates and the two evidence commits Summary

**Every repository and infrastructure gate exits 0 on the final tree; the source-only green commit builds from its own archive for linux/arm64, and the red commit fails locally in the frontend's vite build, naming the missing module. Both commits live only under `refs/evidence/187/*`.**

```
lint:check exit=0
format:check exit=0
test:unit exit=0
lint:workflows exit=0
GREEN_LOCAL_BUILD_EXIT=0
RED_LOCAL_BUILD_EXIT=1
```

## Performance

- **Duration:** about 12 min (03:13Z to 03:26Z, 2026-11-15)
- **Tasks:** 3 of 3
- **Files created:** 2 evidence files

## Accomplishments

- **Task 1, the gates.** At `f1602487a0a466fa95925486d87b3d4361525945`: lint, format, unit (turbo 25/25; tests 323/323; infra 302/302 in 11 files, the nine named files among them) and `lint:workflows` (actionlint, 3 workflows clean) all exit 0. `GUARD_DEPLOYED_SMOKE=passed` (16 tests). `terraform fmt -check` exit 0, 8 roots validated, `frontend-service` (33) and `github-oidc` (8) module tests pass, the three example mock plans pass, and `check-settings-types.sh` passes. `SC4_LOCAL_GATE_DIFF=empty`, `PHASE_APP_DIFF=tests/README.md`. Every `init` used a scratch `TF_DATA_DIR`, so the checkout's backend-wired `.terraform/` directories were not touched.
- **Task 2, green.** `GREEN_COMMIT=69d10a72357e149c1c35a7002d7779233ffc4d44`, tree `fa16b0c68a9d32835f811344393d2bb31a173c9b` (HEAD's tree without `.planning/`), parent `340a200708c28fb7ed078d452138712f3400c789` from the local `refs/remotes/origin/main`. It has 3320 paths and 0 under `.planning/`. Its `git archive` builds with the script's flags (`linux/arm64`, target `production`, `BUILD_SHA`, provenance and SBOM off), exit 0, in 3.4 min.
- **Task 3, red.** `RED_COMMIT=4d4624315ef323b5f8bb712eebada6b394ee1074`, which differs from green only in `apps/frontend/src/routes/+layout.ts` (one added line, `import '$lib/does-not-exist-187-red';`). Its archive build exits 1 with `[UNLOADABLE_DEPENDENCY] Could not load src/lib/does-not-exist-187-red` and `Failed: @openvaa/frontend#build`. The working tree was unchanged, and the builder cache was pruned (4.9 GB).
- **Nothing pushed.** `git for-each-ref --contains` prints only `refs/evidence/187/green` for the green commit and only `refs/evidence/187/red` for the red one. There was no fetch, no ls-remote, no registry login and no cloud call.

## Task Commits

1. **Task 1: the gates on the final tree**: `e5bb3601e` (docs)
2. **Task 2: the green commit and its archive build**: `a664d7f77` (docs)
3. **Task 3: the red commit and its failing build**: `b34c30d35` (docs)

## Decisions Made

- The parent is the local `refs/remotes/origin/main`, as the plan specifies. Nothing was fetched.
- The local builds use `--output type=cacheonly` in place of the script's `-t <registry>:<sha> --load`, so no image is tagged for a registry. `--progress=plain` was added to get a readable log.

## Deviations from Plan

**1. [Rule 1 - expectation corrected, no code change] The red build fails one Docker stage earlier than the plan said**
- **Found during:** Task 3
- **Issue:** The plan and research Pitfall 4 expected the failure at the production stage's `RUN yarn workspace @openvaa/frontend build` (Dockerfile line 56). In fact the `shared` stage's `RUN yarn build` (line 28) runs turbo `build` over every workspace, the frontend included. So the frontend's own build fails there, on the missing module, and the production stage never starts.
- **Resolution:** Nothing before the frontend build failed: the base image, `yarn install --immutable` and 13 of 14 turbo tasks all completed. The failing task is `@openvaa/frontend#build`, and the missing module is named. The plan's stop condition ("fails earlier than the frontend build") therefore does not apply. `RED_FAILED_AT_FRONTEND_BUILD=yes` is recorded beside `RED_FAILING_DOCKER_STEP=shared 2/2 RUN yarn build (Dockerfile line 28), turbo task @openvaa/frontend#build`. Plan 187-18 expects only `failed=build` from the script's build step, and the whole `docker buildx build` is that step, so its expectations hold.
- **Files modified:** the evidence file only
- **Commit:** `b34c30d35`

**2. [Minor] The green commit's author date was set explicitly**
- `GIT_AUTHOR_DATE=2026-11-15T03:20:00Z` was passed to `git commit-tree`, so the author date is a few minutes after the committer date. This is cosmetic and recorded in the evidence. It changes neither the tree nor the parent, and the commit id is the one that was built and recorded.

## Issues Encountered

None.

## Requirements coverage (not marked complete, per operator notes)

- PIPE-09: the red half is proven locally (the red build fails in the frontend build). It is observed on the hosted pipeline in plan 187-18.
- PIPE-05: the archive context builds the image (C-02 control).
- SUPA-08: the evidence commits hold no `.planning/` path, and nothing was published.
- INFRA-19: the three example mock plans pass.

## Next Phase Readiness

- Plan 187-13 (the one full-suite E2E run) has the builder cache freed.
- Plans 187-15 onward push `refs/evidence/187/green` and `refs/evidence/187/red` at their checkpoints. If HEAD's tree outside `.planning/` changes before then, both commits must be rebuilt and the red build re-proven, as 187-18 states.

## Self-Check: PASSED

- FOUND: evidence/187-12-final-gates.md, evidence/187-12-evidence-commits.md
- FOUND commits: e5bb3601e, a664d7f77, b34c30d35 (ancestors of HEAD)
- FOUND refs: refs/evidence/187/green = 69d10a723, refs/evidence/187/red = 4d4624315
