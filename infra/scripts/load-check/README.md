# The voter-journey load check

The method behind the capacity figure of the deployed stack, and the tools that apply it. The figure is the highest
arrival rate of voter journeys, in **journeys per minute**, at which the stack stays within the thresholds below.

| File                     | What it is                                                                                                         |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `../load-check.sh`       | The wrapper: checks the target, the journey and the steps, runs k6 in its pinned image, prints the per-step lines. |
| `voter-journey.js`       | The k6 2.4.0 script: replays the journey at stepped arrival rates and writes the summary.                          |
| `figure.mjs`             | Reads the summary and prints one line per step and the figure.                                                     |
| `journey-from-trace.mjs` | Turns a Playwright trace of a voter run into a journey file.                                                       |
| `local-journey.json`     | A two-page journey against a local dev server, for a dry run of the method.                                        |

## The tool

k6 2.4.0, run from the official `grafana/k6` image pinned by digest
(`grafana/k6:2.4.0@sha256:d41bb79cd8de5a7ad619b53570e3712633e8bff0937010a5c6c57a4747e7a276`, the multi-arch index).
Nothing is added to the repository's packages. The wrapper mounts this directory read-only at `/scripts`, the journey
file read-only, and the new output directory writable at `/out`, and turns k6's anonymous usage report off. The anon key
reaches k6 through the environment, named on the `docker run` command line without its value.

The script lives under `infra/`, not `tests/`: `tests/` is linted and typechecked, and `k6/http` resolves nowhere in
Node.

## One journey

A journey file is one JSON object:

```json
{
  "base": "https://staging.openvaa.org",
  "routeId": "/(voters)",
  "locale": "en",
  "requests": [{ "method": "GET", "url": "https://staging.openvaa.org/", "kind": "page" }]
}
```

`requests` holds the requests a browser made during one recorded voter run, in their order: the server-rendered pages
and other requests to the staging host (`kind: page`), and the reads to the project's Supabase host (`kind: data`), with
the body for a POST to `/rest/v1/rpc/`. It holds no immutable asset (`/_app/immutable/`), no Supabase Auth call
(`/auth/v1/`), no Edge Function call (`/functions/v1/`, `account-access` among them), no relay post, and no header or
cookie. The Supabase Auth limits would be load-tested instead of the stack, and the voter journey is anonymous.

One iteration replays every request of the file in its order, and after each page request posts one relay batch to
`/api/usage`: `Content-Type: application/json`, `Sec-Fetch-Site: same-origin`, one valid `answer` event whose visit id
is stamped with the current time, under the journey's route id and locale. The requests to the Supabase host carry
`apikey` and `Authorization: Bearer` with the anon key; no other request carries a credential. Response bodies are
discarded.

## Steps, thresholds and the abort

The run is a list of steps, each an arrival rate in journeys per minute held for 5 minutes (`--step-seconds 300`, the
default). Each step is one `constant-arrival-rate` scenario that starts when the one before it ends, tagged
`step: <index from 1>`; arrival rate is an open model, so a slower answer does not slow the arrivals. The stack is
measured as configured, at its own task floor and ceiling.

Per step, each a k6 threshold on that step's sub-metric:

| Threshold          | Sub-metric                               |
| ------------------ | ---------------------------------------- |
| page p95 < 1000 ms | `http_req_duration{kind:page,step:<i>}`  |
| relay p95 < 300 ms | `http_req_duration{kind:relay,step:<i>}` |
| errors < 1 %       | `http_req_failed{step:<i>}`              |

Over the whole run, `http_req_failed` above 5 % aborts the run once it has held for a minute (`abortOnFail`,
`delayAbortEval: '1m'`). k6 then exits 99, as it does when any threshold was crossed, which is expected at a step above
the capacity. The steps after an abort have no values and are not met.

## The figure

`figure.mjs` reads `summary.json` and prints, per step,

```
step=<i> rate_per_min=<r> page_p95_ms=<x> relay_p95_ms=<y> error_rate=<e> met=yes|no
```

and then `figure_journeys_per_minute=<r>` and `figure_step=<i>`: the rate of the highest step that met every threshold,
or `0` and `none` when no step did. The values are read from `metrics["<sub-metric>"].values["p(95)"]` and
`metrics["http_req_failed{step:<i>}"].values.rate`, and the step rates from the `load_check` member the script adds to
k6's summary. The figure is recorded with the date, the commit the stack served (`build` of `/api/health`), the task
count and the task CPU during that step, and the resource that bound the next step: the task's CPU or memory, the
Supabase project, or the generator.

The analytics provider is `log` for the whole run, so the relay is measured up to its queue and nothing reaches
PostHog; it is set by hand before the run and restored afterwards.

## The generator

The load is generated from one workstation, by k6 in Docker Desktop's VM. Every minute of a run, read the generator's
own load beside it:

```bash
while sleep 60; do date -u +%FT%TZ; docker stats --no-stream; netstat -ib; done > <out>-generator.txt
```

A step bound by the generator's CPU or network is named as such and is not a figure of the stack.

A single client measures the **origin**, the frontend task and the Supabase project, not CloudFront: one client reaches
only a small part of one edge location. The script lets k6 pick among the addresses a lookup returns at random
(`dns.select: 'random'`, a one-minute TTL), which spreads the requests over them but does not make the figure an edge
capacity.

## Policies

As read on 2026-11-15:

- **AWS** permits testing one's own CloudFront, ECS and Fargate resources without approval; a stress test has its own
  policy, and approval is needed only above 1 Gbps, and for CloudFront above 500,000 requests a second or 300 Gbps. A
  workstation-sized load is far below each.
- **Supabase** recommends load-testing a staging project, names k6, and asks Team and Enterprise plans for two weeks'
  notice of heavy load testing. The hosted project's plan sets the step caps: `--max-rate` is chosen from it, and the
  first step is small.

## Recording a journey

Record one voter run on staging with a Playwright trace, unzip the trace, then extract its requests:

```bash
unzip -q <trace.zip> -d <trace dir>
cat <trace dir>/*.network \
  | node infra/scripts/load-check/journey-from-trace.mjs \
      --base https://staging.openvaa.org \
      --supabase https://<project ref>.supabase.co \
      --resources <trace dir>/resources \
      --route-id '/(voters)' --locale en \
      > <journey.json>
```

It keeps a GET or HEAD to either origin and a POST to the Supabase origin's `/rest/v1/rpc/`, drops the paths listed
above, every other origin and every other method (no write is replayed), and orders the requests by their start time.
Of each it copies the method, the URL with its query and, for an RPC, the body, which a trace stores as a resource read
from `--resources`; never a header, a cookie or a response. It prints `journey_requests=<n>` on standard error, and
exits 1 when the trace yields no request or an RPC body could not be read (`journey_bodies_missing=<n>`). `--route-id`
and `--locale` are those of the relay batches the load script posts. Read the file before committing it.

## Running it

A local dry run, against a dev server of this checkout bound to IPv4 loopback so the container reaches it through
`host.docker.internal`:

```bash
FRONTEND_PORT=5275 ANALYTICS_PROVIDER=log \
  __VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS=host.docker.internal \
  yarn workspace @openvaa/frontend dev --host 127.0.0.1
infra/scripts/load-check.sh \
  --base-url http://host.docker.internal:5275 \
  --journey infra/scripts/load-check/local-journey.json \
  --steps 1 --step-seconds 60 --max-rate 5 --out <new dir>
```

A staging run, with the provider set to `log` and the anon key in the environment:

```bash
SUPABASE_ANON_KEY=<anon key> infra/scripts/load-check.sh \
  --base-url https://staging.openvaa.org \
  --confirm-target https://staging.openvaa.org \
  --journey <journey.json> \
  --steps 5,10,20,40 --max-rate 40 --out <new dir>
```

The wrapper refuses, with exit 2 and before anything runs, any other base URL, a staging run without a matching
`--confirm-target`, a step above `--max-rate`, a journey to any other host or path, a data request without a key, and an
existing `--out`. `infra/scripts/load-check.sh --self-test` runs those refusals with no Docker. It prints `k6_exit=<n>`
and then the lines of `figure.mjs`; it exits 0 when k6 exited 0 or 99 and the figure was printed.
