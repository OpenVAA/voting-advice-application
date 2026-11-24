# Phase 190 deferred items

Out-of-scope discoveries logged by executors; not fixed by the plan that found them.

| Found in | Item | Why deferred |
|----------|------|--------------|
| 190-03 | `yarn lint:check` exits 1 on 11 comment-hygiene violations (rule 2, forced line break) in `infra/scripts/resolve-deployment.sh` lines 15-25, the column table of its output contract. | File of plan 190-02; no file of 190-03 is flagged. Join or punctuate the table lines in a later plan touching the resolver (190-07 or 190-08), or before the phase-end lint gate. |
| 190-03 | `yarn test:unit:tests` has one host-only failure: `tests/utils/tcpForward.test.ts` "gives up on an unreachable upstream in BOUNDED time" (elapsed about 409 ms against a 550 ms floor; the unreachable dial is refused fast on this host instead of timing out). | Imports none of the files 190-03 touched; reproduces on every rerun here. |
| 190-03 | `.github/workflows/deploy.yml` (line 333) still calls `push-migrations.sh --confirmed-ref` without `--deployment`, which the script now refuses with exit 2. | deploy.yml is plan 190-07's file; it passes `--deployment` from the resolve job. Until then a push to `deploy/staging` would stop at the migration step. |
| 190-03 | `tests/README.md` inputs table (line 206) names `SMOKE_BASE_URL`'s default as `https://staging.openvaa.org` and the staging tfvars, and has no `SMOKE_DEPLOYMENT` row. | Documentation of the phase's docs plan (190-13 touches tests/README.md). |
