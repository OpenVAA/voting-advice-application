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
