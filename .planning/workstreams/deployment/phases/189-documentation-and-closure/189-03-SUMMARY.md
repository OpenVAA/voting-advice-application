---
phase: 189-documentation-and-closure
plan: "03"
subsystem: frontend
tags: [docker, dockerfile, docker-compose, ci, cleanup]
status: complete

requires:
  - phase: 189 (CONTEXT F-02, F-03; ROADMAP note on ruling 181-12)
    provides: the decision to retire the orphan compose if unreferenced and keep the root compose
provides:
  - "apps/frontend/docker-compose.dev.yml is deleted and the Dockerfile's development stage removed; stages are now base, shared, frontend, production"
  - "The production target builds from the repository root with the CI job's command (exit 0); the last CMD is the production one"
  - "A recorded answer to the ROADMAP's root-compose question: kept, with nine referencing files named"
affects: [189-09, 189-20]

actuals:
  tokens: 1870
  tasks: 2
  commits: 2
plan_head_before: f3e5a930aa98b8cb570c79dd9d84dccb94ec8352
plan_head_after: 262e23ed7c0b60e85e62361a886e221f8cb85d84

tech-stack:
  added: []
  patterns:
    - "Remove a Dockerfile stage only after a re-grep shows no build of its target, then rebuild the shipped target with the CI job's own command"

key-files:
  created:
    - .planning/workstreams/deployment/phases/189-documentation-and-closure/evidence/189-03-orphan-compose.md
  modified:
    - apps/frontend/Dockerfile
  deleted:
    - apps/frontend/docker-compose.dev.yml

key-decisions:
  - "F-02 as measured: the re-grep outside .planning finds no reference to apps/frontend/docker-compose.dev.yml and no other build of the development target (F02_REFERENCES=0), so the file and the stage are retired"
  - "F-03: the root docker-compose.dev.yml and its tests are kept. It is the documented way to run the production image against the local stack, and its tests pin the variables it passes, which the AWS task environment's guard does not cover"

requirements-completed: [DOCS-07]

coverage:
  - id: D1
    description: "The orphan and the development stage are gone, and the production image still builds"
    requirement: DOCS-07
    verification:
      - kind: build
        ref: "docker build --progress=plain --file apps/frontend/Dockerfile --target production --tag openvaa-frontend:ci . -> exit 0, image sha256:ac7a98d4..."
        status: pass
      - kind: unit
        ref: "yarn workspace @openvaa/dev-seed test:unit tests/ciDockerImageBuildGate.test.ts -> 1 file, 7 passed"
        status: pass
    human_judgment: false
  - id: D2
    description: "The root compose stays, with what references it recorded"
    requirement: DOCS-07
    verification:
      - kind: evidence
        ref: "evidence/189-03-orphan-compose.md: 9 F03_REFERENCE lines, F03_ROOT_COMPOSE=kept, F03_ROOT_COMPOSE_TESTS=kept"
        status: pass
    human_judgment: false

duration: ~25min
completed: 2026-11-20
---

# Phase 189 Plan 03: Orphan Compose Retirement Summary

**The unreferenced `apps/frontend/docker-compose.dev.yml` and the Dockerfile's `development` stage, which only it used, are deleted. The production image still builds from the repository root. The root compose is kept, and the evidence names what references it.**

## Performance

- **Duration:** about 25 min, including a session interruption (host sleep) after both task commits
- **Completed:** 2026-11-20
- **Tasks:** 2/2
- **Files:** 1 deleted, 1 modified, 1 evidence file created

## Accomplishments

- Re-grep, `.github`, `infra/` and `apps/docs` included: `F02_REFERENCES=0`. The only hit was inside the orphan itself (`target: development`). Every other reader of the Dockerfile builds `production`: the CI job, `build-push-image.sh`, the proxy compose, the root compose and the CI gate test.
- Removed the `development` stage, from its `FROM frontend AS development` line to its `CMD` line. The `base`, `shared`, `frontend` and `production` stages are unchanged (`F02_STAGES=base shared frontend production`, 4 `FROM ... AS` lines, 5 before).
- Production build with the CI job's command, run in the background with its exit status written to a file: `F02_PRODUCTION_BUILD_EXIT=0`. The last `CMD` is still `CMD ["node", "./apps/frontend/build/index.js"]`, which `check-proxy-topology.sh` reads. `ciDockerImageBuildGate.test.ts`: 7/7.
- Root compose (F-03, the note on ruling 181-12): 18 lines in 10 files reference it, nine of them other than the file itself. They are recorded as `F03_REFERENCE=` lines: the deployment guide, `CLAUDE.md`, `.env.example`, the CI job comment, the deploymentTemplates, analyticsEnvTemplates, localSupabaseUrl and ciDockerImageBuildGate tests, and the test-key scope guard's fixture. Kept, together with its tests. `infra/local/docker-compose.proxy.yml` serves a different purpose and was not touched.

## Task Commits

1. **Task 1 (tracer): The orphan and its stage gone, the production image built.** `96b53fc8b` (chore). The tracer gate re-ran the automated verify, which passed, before Task 2 began.
2. **Task 2: Why the root compose and its tests stay, recorded.** `262e23ed7` (docs)

## Deviations from Plan

None. The plan was executed as written. Two notes on the record:

- The plan expected 5 or more `F03_REFERENCE` lines and seven expected files. The grep found nine files besides the root compose itself. The two extras are the `ciDockerImageBuildGate.test.ts` docblock and the path label in `scripts/fixtures/assert-test-keys-scope.input.txt`. All nine are recorded.
- When the `development` stage was removed, the blank line that separated it from the `production` stage went with it, so one blank line still separates the stages.

## Verification

- Before the interruption, Task 1's and Task 2's `<automated>` checks passed (exit 0) and both acceptance criteria printed their expected values (4; 1; 9 ≥ 5).
- After the session resumed, both `<automated>` checks were re-run on the committed tree and passed again (CI gate test 7/7). The Docker build had finished and been recorded before the sleep. The image it produced is still present under the recorded ID, so the build was not re-run.
- E2E: this plan changes no source that a spec or fixture serves, and no project is affected. Delta 0, and no targeted run is required. Unit delta: 0.

## Notes for later plans

- 189-09 and 189-20 (docs): no page described the `development` stage or the orphan compose, so there is no documentation to update for this plan. The deployment guide's production-build section points at the root compose, which stays.
- H-02: the phase's final plan rebuilds the same production target.

## Issues Encountered

A host sleep ended the session after the two task commits, before the SUMMARY was written. After it resumed, the tree was re-checked and the task checks re-run. No result was lost.

## Self-Check: PASSED

- FOUND: evidence/189-03-orphan-compose.md
- ABSENT (intended): apps/frontend/docker-compose.dev.yml
- FOUND: 96b53fc8b, 262e23ed7 (ancestors of HEAD)
