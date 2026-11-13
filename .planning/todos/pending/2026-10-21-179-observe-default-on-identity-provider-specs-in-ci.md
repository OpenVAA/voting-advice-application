---
created: 2026-10-22T14:00:00.000Z
title: The identity-provider E2E projects are default-on, but no CI run has observed them; the wrapper's environment for them is CI's by construction only
area: CI / E2E harness
severity: minor
source: Phase 179 (item PL-16 of 179-EXECUTION-RULES.md; 179-05-SUMMARY.md § Statements observed and inferred; filed by 179-23)
owner: unassigned
files:
  - .github/workflows/main.yaml (the `e2e-tests` job: `tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/ci --no-db-reset --no-watch`)
  - tests/scripts/e2e-run.sh (serves `identity-callback` with a generated environment; the JWKS document on port 8777; restores the stack)
  - tests/playwright.config.ts (the `webServer` entry that starts the mock issuer on 127.0.0.1:9443)
---

## Problem

Since 179-05 (`640eb5fa3`), `bank-auth` and `contestant-identity-provider` run in every default E2E run. The wrapper prepares their environment:

- a generated Edge Function environment pointing at the mock issuer;
- `supabase functions serve` for `identity-callback`, replacing the shared stack's edge-runtime container;
- the JWKS document served on port 8777 to that container, which reaches the host through `host.docker.internal`;
- the server's secret for the dev server and Playwright;
- a stop-and-start restore of the stack at the end.

The CI `e2e-tests` job runs the same wrapper with `--no-watch`, so it should get the same environment by construction. That was not observed:

- **CI has not run this branch's E2E job green.** See `2026-09-03-ci-e2e-ssr-500.md`: the job has never passed on this branch. Also, `main.yaml` triggers on `main` only, and the `ci-evidence/**` channel pushes to a public repository, which is the operator's act.
- **Inferred, not measured:** that `host.docker.internal` resolves inside the edge-runtime container on a Linux runner, and that the runner can bind ports 8777 and 9443. On the development host both hold.
- **The CI runner is about 4.3 times slower.** The identity-provider spec verifies about 95 links per run with no pacing (`tests/README.md`, the auth budget). The local stack does not enforce the verification limit. Whether CI's does is the same open question.

## Solution

When CI's E2E job is next made to run (after `2026-09-03-ci-e2e-ssr-500.md`, or through the `ci-evidence/**` channel by the operator):

- Read the run's `idp-env.txt`, `idp-functions.log` and `restore.txt` from the `e2e-run` artifact.
- Confirm that both identity-provider projects ran and passed, with `restore: ok`.
- On a failure, read the issuer the edge runtime held and the JWKS fetch before the specs.
- Record the verification count and whether any `429` appeared.
