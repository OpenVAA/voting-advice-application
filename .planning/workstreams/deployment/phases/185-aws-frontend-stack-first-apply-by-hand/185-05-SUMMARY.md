---
phase: 185-aws-frontend-stack-first-apply-by-hand
plan: "05"
subsystem: infra
status: complete
tags: [bash, ecr, docker-buildx, curl, rollout, self-test, vitest]
requires: []
provides:
  - "infra/scripts/build-push-image.sh --repository-url <url> [--platform <p>] | --self-test; lines refused=<dirty-tree|not-a-commit-id|planning-in-tree|head-not-pushed|account>, tag_exists=yes image_digest=, image_tag=, image_digest=, failed=<describe-images|login|build|push|read-digest|ls-remote>; exit 0 pushed, 1 refused/failed, 2 usage, 3 tag exists, 130 interrupted"
  - "infra/scripts/request-loop.sh --url --out (--until <file> | --duration <s>) [--interval <s>] | --self-test; out lines <utc>,<status>; summary requests=<n> non_2xx=<m> first_utc=<t> last_utc=<t>; exit 0 when n>0 and m=0, 1 otherwise, 2 usage"
  - "infra/scripts/build-push-image.test.ts and request-loop.test.ts in the infra Vitest suite (yarn test:unit chains it)"
affects: [185-12, 185 rollout plans that count requests, 187 pipeline]
tech-stack:
  added: []
  patterns:
    - "Self-test that runs the real entry against a throwaway bare origin and clone, with AWS and DOCKER command variables pointed at recording shell functions"
    - "Flag needles in a self-test built from string parts, so an acceptance grep that counts a flag's occurrences counts the command line only"
key-files:
  created:
    - infra/scripts/build-push-image.sh
    - infra/scripts/build-push-image.test.ts
    - infra/scripts/request-loop.sh
    - infra/scripts/request-loop.test.ts
  modified: []
decisions:
  - "build-push-image.sh adds a planning-in-tree refusal: HEAD's tree or the working tree holding .planning/ is refused before origin is read, which turns the plan's flagged prohibition into a check"
  - "The repository URL must be an ECR repository of OPENVAA_ACCOUNT_ID in AWS_REGION, or the run is a usage error (exit 2) before any git or AWS step"
  - "describe-images distinguishes ImageNotFoundException (build) from every other error (failed=describe-images), so an access error is never read as 'tag absent'"
  - "docker is signed out of the registry on exit after a successful login"
  - "request-loop.sh refuses an existing stop file as a usage error and exits 1 when no request was made, so a stale stop file or an instant interrupt cannot report a clean rollout"
  - "--until and --duration may both be given; the first that ends the run wins"
metrics:
  duration: "about 12 min"
  completed: 2026-11-12
estimate:
  tokens: 24000
  tasks: 2
actuals:
  tokens: 9258
  tasks: 2
  commits: 2
plan_head_before: 2da39a8604ae7d4883a4539c163f53afe668fda3
plan_head_after: ff85071fac70373ffc7c4583513f6e6d352cf5c3
requirements-completed: [INFRA-01, INFRA-09]
coverage:
  - id: D1
    description: "build-push-image.sh refuses a dirty tree, an unpushed HEAD, a tree holding .planning/ and another account, and stops before any AWS call for the git refusals"
    requirement: INFRA-01
    verification:
      - kind: unit
        ref: "infra/scripts/build-push-image.test.ts#passes every case of its self-test"
        status: pass
    human_judgment: false
  - id: D2
    description: "build-push-image.sh tags and sets BUILD_SHA from one 40-hex HEAD id, builds target production for linux/arm64 with provenance and SBOM off, pipes the password to docker login on stdin, exits 3 on an existing tag"
    requirement: INFRA-01
    verification:
      - kind: unit
        ref: "infra/scripts/build-push-image.test.ts#passes every case of its self-test"
        status: pass
    human_judgment: false
  - id: D3
    description: "request-loop.sh writes utc,status per request and prints requests= non_2xx=, exit 0 only with no non-2xx answer; ends on stop file, duration or SIGTERM"
    requirement: INFRA-09
    verification:
      - kind: unit
        ref: "infra/scripts/request-loop.test.ts#passes every case of its self-test"
        status: pass
    human_judgment: false
  - id: D4
    description: "build-push-image.sh against the real registry and docker (the real push)"
    verification: []
    human_judgment: true
    rationale: "No AWS call is allowed in this plan; the real build and push is plan 185-12's"
---

# Phase 185 Plan 05: The Build-and-Push and Request-Loop Scripts Summary

**`build-push-image.sh` builds and pushes the frontend image only for a clean, pushed, 40-hex HEAD without `.planning/`, with the tag and `BUILD_SHA` taken from that one id. `request-loop.sh` counts a viewer's non-2xx answers during a rollout. Both scripts have offline self-tests, and the infra Vitest suite runs them.**

## Performance

- **Duration:** about 12 min
- **Started:** 2026-11-12T16:58Z
- **Completed:** 2026-11-12T17:10Z
- **Tasks:** 2 of 2
- **Files created:** 4

## Accomplishments

- **The build-and-push script.** It refuses, in this order: `dirty-tree` (porcelain status with untracked files, set explicitly with `--untracked-files=all`), `not-a-commit-id`, `planning-in-tree`, `head-not-pushed` (an exact match of the whole id against `git ls-remote origin`) and `account`, which names only the expected account. Then it looks the tag up. If the tag exists, the script exits 3 and prints the digest. Otherwise it signs docker in through a pipe from `get-login-password` to `docker login` on stdin, runs `docker buildx build` (target `production`, `BUILD_SHA=<id>`, provenance and SBOM off, `--load`), pushes the image, reads the digest back, and prints `image_tag=` / `image_digest=`.
- **The build-and-push self-test (37 cases).** It runs against a temporary bare origin and a clone, with `AWS`/`DOCKER` pointed at shell functions that record every call. The cases cover each refusal and confirm no AWS call happens before the account check. When the account check refuses, the only call made is `sts get-caller-identity`. The other cases cover an existing tag (exit 3, no docker call), an unreadable registry, a failed build (nothing pushed, docker signed out), and a full stubbed push. The full push checks that the password went to docker on stdin and never appeared in any recorded argument or in the output. Mutation checks confirmed the self-test fails when the dirty-tree check, the remote match, the stdin login, `--provenance=false`, `--sbom=false` or `BUILD_SHA` is broken.
- **The request loop.** One `curl -sS -o /dev/null -w '%{http_code}' --max-time 10` per request writes one `<utc>,<status>` line, with `000` when no answer comes. The run ends on a stop file, the end of the duration, or SIGTERM/INT/HUP. The pause runs as a background `sleep` that the script waits on, so a signal ends it at once. At the end the script prints `requests=<n> non_2xx=<m> first_utc= last_utc=`.
- **The request-loop self-test (21 cases, about 10 s).** It uses loopback `node -e` servers on free ports: one answers 200 throughout, one answers 503 on every third request. The cases also cover a stop file created after 2 s, a stale stop file (usage error), SIGTERM during a 60 s run, a closed port (`000`, exit 1), a missing end condition, and a check that no response body is ever recorded. Mutation checks confirmed it fails when the non-2xx count or the signal trap is removed.

## Task Commits

1. **Task 1: The build-and-push script** - `a7dba648f` (feat)
2. **Task 2: The request loop** - `ff85071fa` (feat)

## Verification

- Task 1 verify: `bash -n`, executable bit, `vitest run --config infra/vitest.config.ts build-push-image` → 3 tests passed, exit 0.
- Acceptance greps: `--password-stdin` count 1; `get-login-password\)` count 0; `--provenance=false` count 1; `non_2xx=` count 7 in `request-loop.sh`.
- Task 2 verify: `vitest run ... request-loop` → 3 tests passed. `yarn test:unit:infra` → 3 files, 102 tests passed, exit 0. `node scripts/assert-unit-test-coverage.mjs` → 0 violations, exit 0.
- Prettier and ESLint are clean on both test files. Shellcheck is not installed on this host.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical check] Refusal `planning-in-tree`**
- **Found during:** Task 1
- **Issue:** The plan's flagged prohibition ("MUST NOT push from a working tree that holds `.planning/`") had no check among the four refusals.
- **Fix:** The script now refuses when `git ls-tree -r HEAD -- .planning` is non-empty or `.planning` exists in the working tree. The check runs before origin is read, and a self-test case covers it. Plan 185-12 builds from a detached worktree of a source-only commit, so this refusal does not get in its way.
- **Files modified:** infra/scripts/build-push-image.sh
- **Committed in:** a7dba648f

**2. [Rule 2 - Correctness] A registry error is not read as "tag absent"**
- **Found during:** Task 1
- **Issue:** If any `describe-images` failure counted as "tag absent", an access error would lead to a login and a build.
- **Fix:** Only `ImageNotFoundException` leads to a build. Any other error prints `failed=describe-images` with the error code alone and exits 1. A self-test case covers this.
- **Committed in:** a7dba648f

**3. [Rule 2 - Correctness] A request loop that made no request is not a pass**
- **Found during:** Task 2
- **Issue:** The plan says exit 0 when `m` is 0. A stale stop file or an immediate interrupt would then report a clean rollout with no evidence behind it.
- **Fix:** A stop file that already exists is a usage error (exit 2), and a run with `requests=0` exits 1. The loop always makes its first request before it checks whether to stop.
- **Committed in:** ff85071fa

**4. [Rule 1 - Bug] `set -e` and a trailing `&&` in a `while` body**
- **Found during:** Task 1
- **Issue:** `[ "$id" = "$SHA" ] && found=1` as the last command of the `ls-remote` loop gave the `while` loop a status of 1 on a non-matching last line. Under `set -e` the real run would then have exited 1 silently.
- **Fix:** Rewritten as an `if` statement, before the first commit.
- **Committed in:** a7dba648f

**Additions beyond the plan:** exit 130 on an interrupt (the `check-drift.sh` convention); a usage error for a repository URL whose account or region does not match the environment; `docker logout` on exit after a successful login.

**Total deviations:** 4 auto-fixed (3 Rule 2, 1 Rule 1). **Impact:** each one closes a way the script could report a false success. There is no scope creep and no new interface beyond the extra `refused=planning-in-tree` and `failed=` step names.

## Issues Encountered

- `docker login` stores its credential wherever docker's own credential store is configured: on macOS Docker Desktop that is the keychain helper, and on a host without one it is `~/.docker/config.json`. The script itself never writes the password, and it signs docker out on exit. This was noted in the header and not changed, because a temporary `DOCKER_CONFIG` would also hide Docker Desktop's context and buildx builders.

## Known Stubs

None. The `st_aws`/`st_docker` functions are stand-ins used only by the self-test.

## User Setup Required

None.

## Next Phase Readiness

- Plan 185-12 can run `infra/scripts/build-push-image.sh --repository-url "$U"` from its detached worktree, and gets `SCRIPT_TAG_EXISTS_EXIT=3` from a second run.
- The rollout plans can run `request-loop.sh --until <stop file>` beside an apply and record its `requests= non_2xx=` line.

## Self-Check: PASSED

- FOUND: infra/scripts/build-push-image.sh, infra/scripts/build-push-image.test.ts, infra/scripts/request-loop.sh, infra/scripts/request-loop.test.ts
- FOUND: a7dba648f, ff85071fa (both ancestors of HEAD)
