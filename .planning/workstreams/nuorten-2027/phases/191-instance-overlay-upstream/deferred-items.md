# Phase 191: deferred items

Found during Plan 06. Neither is caused by this phase, and neither file is touched by it.

## 1. `tests/tests/utils/tcpForward.test.ts` "gives up on an unreachable upstream in BOUNDED time" fails on the cloud host

- **Symptom:** `AssertionError: expected 404 to be greater than or equal to 550` (`tcpForward.test.ts:182`). It is the only failure in `yarn test:unit` (root `tests` workspace: 1 failed, 439 passed).
- **Cause:** the test dials `BLACKHOLE_HOST = 198.51.100.1` (TEST-NET-2) and expects the SYN to hang until the relay's deadline. In this sandbox that address is refused at once: `net.connect(9, '198.51.100.1')` gets `ECONNREFUSED` after 2 ms. Each dial fails fast instead of timing out, so the ladder finishes in about 400 ms, below the `attempts x timeout` lower bound. The premise is false on this host, but the code is not defective.
- **Control:** the same test fails the same way at base 8f2bb68a7, in a detached worktree with a fresh `yarn install --immutable`. No file under `tests/` differs between 8f2bb68a7 and HEAD.
- **Suggested follow-up (not this phase):** have the test probe whether `BLACKHOLE_HOST` really drops SYNs on the host and fail with a named precondition message when it does not, or use a local listener that never accepts, such as a full backlog, instead of a routed address.

## 2. `yarn lint:check` fails at `@openvaa/supabase#typecheck` on the cloud host under turbo's strict env mode

- **Symptom:** `deno check` reports `Failed loading https://registry.npmjs.org/@supabase%2fsupabase-js … invalid peer certificate: UnknownIssuer`.
- **Cause:** the host reaches the registry only through the agent proxy. `DENO_CERT` and `DENO_TLS_CA_STORE` are set in the environment, but turbo's strict env mode strips them from the task. The same `yarn typecheck` run directly in `apps/supabase` exits 0, and `TURBO_ENV_MODE=loose yarn lint:check` exits 0. CI's normal network needs neither.
- **Suggested follow-up (not this phase):** add `DENO_CERT` and `DENO_TLS_CA_STORE` to the root `turbo.json` `globalPassThroughEnv`, so proxied hosts typecheck under the default mode. This changes no cache key.

## 3. `infra/scripts/workflow-errexit.test.ts` has 6 failures on the cloud host

- **Symptom:** `yarn test:unit:infra` reports 6 failed and 524 passed, all six in `workflow-errexit.test.ts`. They are the two wrong-subject cases of `infra-plan.yml`, `deploy.yml deploy Alert the operator`, `destroy.yml plan-destroy Show the Supabase root's state is out of reach`, and the two Supabase-root cases of `destroy.yml`. In each, the step under `bash -e` prints none of the lines the case expects.
- **Control:** the same command at base 8f2bb68a7, in a detached worktree with a fresh `yarn install --immutable`, gives the same 6 failures and the same 524 passes. This phase changes no file under `infra/` and none of those workflows; it changes only two lines of `.github/workflows/main.yaml`.
- **Cause:** not diagnosed in this phase. The harness runs each step with a PATH of stubs plus symlinks to host utilities (`UTILITY_PATHS`), so a host utility that behaves differently is the first suspect.
- **Note:** `yarn test:unit` runs `turbo run test:unit && yarn test:unit:tests && yarn test:unit:infra`, so the item-1 failure stops it before this suite runs. It was run on its own for this record.
