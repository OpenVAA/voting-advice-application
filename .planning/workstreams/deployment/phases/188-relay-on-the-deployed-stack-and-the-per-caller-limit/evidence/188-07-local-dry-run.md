# 188-07 — local dry run of the load check

**Date (UTC):** 2026-11-18, run started 2026-11-18T19:26:51Z
**Commit:** d22da1d669b4492c920bee16be72d20da7c7a026 (the tree under the plan's Task 1, uncommitted files `infra/scripts/load-check.sh` and `infra/scripts/load-check/{voter-journey.js,local-journey.json,figure.mjs}`)
**Target:** a dev server of this checkout only. Nothing hosted was called.

## The image

`docker buildx imagetools inspect grafana/k6:2.4.0` (run with a Docker config holding no credential helper: under the
operator's own config the inspect and the pull both stalled on the credential store and were stopped; the digest is the
registry's either way):

```
Name:      docker.io/grafana/k6:2.4.0
MediaType: application/vnd.oci.image.index.v1+json
Digest:    sha256:d41bb79cd8de5a7ad619b53570e3712633e8bff0937010a5c6c57a4747e7a276
  linux/amd64  sha256:70949facc324f13a8903d24ee5b817ff32aca02bda3458389611e6aa4b38a097
  linux/arm64  sha256:d716bcda2fe87308073e9d8f424dd3db30ab1b448e6fc72e7870a468b3212cc5
  (two attestation manifests)
```

K6_IMAGE_DIGEST=sha256:d41bb79cd8de5a7ad619b53570e3712633e8bff0937010a5c6c57a4747e7a276
K6_IMAGE_DIGEST_MATCHES=yes

The image was then pulled by that digest (`docker pull grafana/k6:2.4.0@sha256:d41bb79c…`, `Digest:` line equal).

## The dev server and its route

Started in the background from `apps/frontend` as
`FRONTEND_PORT=5275 ANALYTICS_PROVIDER=log __VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS=host.docker.internal yarn dev --host 127.0.0.1`.

Without `--host`, Vite bound `[::1]:5275` only, and the container's `wget http://host.docker.internal:5275/api/health`
was refused (`can't connect to remote host (192.168.65.254): Connection refused`). With `--host 127.0.0.1` it bound
`127.0.0.1:5275`, the same request from the k6 image answered `HTTP/1.1 200 OK`, and Vite admitted the
`host.docker.internal` host under the allowed-hosts variable.

DRY_RUN_TARGET=http://host.docker.internal:5275
DRY_RUN_ROUTE=host.docker.internal to a dev server bound to 127.0.0.1 (a [::1] bind is not reachable from the container)

Warmed with `curl` twice each: `/` 200, 200; `/api/health` 200, 200.

## The run

```
infra/scripts/load-check.sh --base-url http://host.docker.internal:5275 \
  --journey infra/scripts/load-check/local-journey.json \
  --steps 1 --step-seconds 60 --max-rate 5 --out <scratchpad>/lc/dry-run
```

Its last lines:

```
step_1 ✓ [ 100% ] 0/2 VUs  1m0s  0.02 iters/s
k6_exit=0
step=1 rate_per_min=1 page_p95_ms=83.5 relay_p95_ms=1.8 error_rate=0.0000 met=yes
figure_journeys_per_minute=1
figure_step=1
wrapper_exit=0
```

DRY_RUN_K6_EXIT=0
step=1 rate_per_min=1 page_p95_ms=83.5 relay_p95_ms=1.8 error_rate=0.0000 met=yes
DRY_RUN_SUMMARY_PRESENT=yes
DRY_RUN_SUMMARY_KEYS=options,state,metrics,root_group,load_check

The summary's per-step sub-metrics, present because each has a threshold:
`http_req_duration{kind:page,step:1}`, `http_req_duration{kind:relay,step:1}`, `http_req_failed{step:1}`. The field
paths `figure.mjs` reads, as k6 2.4.0 writes them: `metrics["http_req_duration{kind:page,step:<i>}"].values["p(95)"]`,
`metrics["http_req_duration{kind:relay,step:<i>}"].values["p(95)"]`, `metrics["http_req_failed{step:<i>}"].values.rate`
(a k6 Rate: `values.passes` counts the failed requests, `values.fails` the others), each with
`thresholds["<expression>"].ok`; and `load_check.steps`, the member the script adds.

The step made 2 iterations and 8 requests (`iterations.values.count=2`, `http_reqs.values.count=8`): at 1 journey a
minute over 60 s, k6 starts one at 0 s and one at 60 s. Every relay post was accepted: the dev server's log provider
wrote one `"msg":"answer"` line, `questionId` `load-check`, per relay post. A step of rate r and length T therefore holds
about r·T/60 + 1 journeys.

The local database served the default project with no published data, so `/` rendered with the server logging
`A DataProvider returned an invalid result.` (`reason: 'empty'`) and still answered 200. The dry run proves the method,
not a capacity.

## Stopped

The dev server was stopped after the run; `lsof -i :5275` exited 1.

LOCAL_DEV_SERVER_STOPPED=yes
