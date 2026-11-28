# 189-03 — the orphan compose file and the root compose (F-02, F-03)

Measured 2026-11-20 on `feat/deployment-terraform-supabase`, HEAD `f3e5a930a` before this plan.
Local tree only; the image tag `openvaa-frontend:ci` was built locally and not pushed.

## Task 1 — the orphan `apps/frontend/docker-compose.dev.yml` and the `development` stage

Command: `git grep -n -E "frontend/docker-compose|target: *development|--target[ =]development" -- ':!.planning'`

F02_REFERENCES=0

The command printed one line, inside the orphan itself:
`apps/frontend/docker-compose.dev.yml:6:      target: development`. No hit outside it, so nothing
under `.github/`, `infra/`, `apps/docs/` or anywhere else names the file or builds the
`development` target. A second grep, `git grep -n -E "AS development|development stage|development target" -- ':!.planning'`,
found only the stage's own `FROM frontend AS development` line. Every other reader of
`apps/frontend/Dockerfile` builds `production`: the CI `docker-image-build` job
(`--target production`), `infra/scripts/build-push-image.sh` (target production),
`infra/local/docker-compose.proxy.yml` (`target: production`), the root `docker-compose.dev.yml`
(`target: production`) and `packages/dev-seed/tests/ciDockerImageBuildGate.test.ts` (asserts
`AS production`).

Change: `git rm apps/frontend/docker-compose.dev.yml`, and the Dockerfile's `development` stage
removed, its `FROM frontend AS development` line to its `CMD yarn workspace @openvaa/frontend dev --host`
line inclusive (with the blank line that separated it from the next stage). No other line of the
Dockerfile changed; the `base`, `shared`, `frontend` and `production` stages are byte-identical.

Build, from the repository root, the CI job's own command, run in the background with its exit
status written to a file:
`docker build --progress=plain --file apps/frontend/Dockerfile --target production --tag openvaa-frontend:ci .`

F02_PRODUCTION_BUILD_EXIT=0

Last summary lines: `#20 naming to docker.io/library/openvaa-frontend:ci 0.0s done`, `#20 DONE 27.0s`
(image `sha256:ac7a98d47eff237e5d30b9ba8ad0618a9fb6f672f2f3903b2f0784c7d4c5b71a`).

F02_LAST_CMD=CMD ["node", "./apps/frontend/build/index.js"]
F02_STAGES=base shared frontend production

`grep -c '^FROM .* AS ' apps/frontend/Dockerfile` prints 4 (5 before). The last `CMD` line is the
one `infra/local/check-proxy-topology.sh` reads (`grep '^CMD' ... | sed -n '$p'`).

CI image gate: `yarn workspace @openvaa/dev-seed test:unit tests/ciDockerImageBuildGate.test.ts`
exit 0, `Test Files 1 passed (1)`, `Tests 7 passed (7)`.

## Task 2 — the root `docker-compose.dev.yml` (F-03, the operator's note on ruling 181-12)

The ROADMAP note asks, once the orphan is retired, whether the root `docker-compose.dev.yml` can
be retired too, and whether the tests that read it are needed.

Command, after Task 1: `git grep -n -F 'docker-compose.dev.yml' -- ':!.planning'` printed 18
lines in 10 files. One is the root file's own usage comment (`docker-compose.dev.yml:3`). The
other nine files:

F03_REFERENCE=apps/docs/src/routes/(content)/developers-guide/deployment/+page.md: lines 123 and 127, the guide's production-build section, the documented way to build the production image and run it against the local Supabase stack (`docker compose -f docker-compose.dev.yml up --build`)
F03_REFERENCE=CLAUDE.md: lines 206 and 334, the project instructions stating that the root compose is for production build testing only
F03_REFERENCE=.env.example: line 124, the reason the production-server variables stay commented out (CI copies the file to `.env`, and Compose would pass a live ORIGIN to the root compose's production image)
F03_REFERENCE=.github/workflows/main.yaml: line 182, the `docker-image-build` job's comment naming the root compose (`target: production`) as one of the two consumers of the image the job builds
F03_REFERENCE=packages/dev-seed/tests/deploymentTemplates.test.ts: lines 6, 74, 75, its `describe('docker-compose.dev.yml')` block pinning that the root compose passes each server variable with a default
F03_REFERENCE=packages/dev-seed/tests/analyticsEnvTemplates.test.ts: lines 5, 29, 78, 79, its `docker-compose.dev.yml` template entry and block pinning that the root compose passes all six analytics variables with a default
F03_REFERENCE=packages/dev-seed/tests/localSupabaseUrl.test.ts: lines 233, 234, the root compose's `PUBLIC_SUPABASE_URL` default captured as one of the local Supabase URL sources that must agree
F03_REFERENCE=packages/dev-seed/tests/ciDockerImageBuildGate.test.ts: line 7, the docblock naming the root compose as a consumer of the image the CI job builds
F03_REFERENCE=scripts/fixtures/assert-test-keys-scope.input.txt: line 21, a `# @as docker-compose.dev.yml` path label in the test-key scope guard's self-test fixture (the guard scans the root compose)

F03_ROOT_COMPOSE=kept
F03_ROOT_COMPOSE_TESTS=kept

The root compose is the documented way to run the production image against the local stack, and
its tests pin the variables it passes, which the AWS task environment's guard does not cover.

F03_PROXY_COMPOSE=infra/local/docker-compose.proxy.yml (different purpose, not touched)

`infra/local/docker-compose.proxy.yml` runs the same production image behind a reverse proxy for
`infra/local/check-proxy-topology.sh` (ORIGIN, ADDRESS_HEADER and XFF_DEPTH as a deployment sets
them); it does not replace the root compose's plain local run.
