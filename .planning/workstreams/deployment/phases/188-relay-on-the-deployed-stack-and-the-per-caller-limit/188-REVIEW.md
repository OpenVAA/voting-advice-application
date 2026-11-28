---
phase: 188-relay-on-the-deployed-stack-and-the-per-caller-limit
reviewed: 2026-11-19T18:46:39Z
depth: standard
files_reviewed: 49
files_reviewed_list:
  - .env.example
  - apps/frontend/src/lib/server/analytics/config.test.ts
  - apps/frontend/src/lib/server/analytics/config.ts
  - apps/frontend/src/lib/server/analytics/providers/index.test.ts
  - apps/frontend/src/lib/server/analytics/queue.test.ts
  - apps/frontend/src/lib/server/analytics/queue.ts
  - apps/frontend/src/lib/server/analytics/relay.test.ts
  - apps/frontend/src/lib/server/analytics/runtime.ts
  - apps/frontend/src/lib/server/startup/taskEnvironment.test.ts
  - apps/supabase/supabase/functions/account-access/callerLimit.test.ts
  - apps/supabase/supabase/functions/account-access/callerLimit.ts
  - apps/supabase/supabase/functions/account-access/contract.test.ts
  - apps/supabase/supabase/functions/account-access/contract.ts
  - apps/supabase/supabase/functions/account-access/flowConformance.test.ts
  - apps/supabase/supabase/functions/account-access/index.ts
  - apps/supabase/supabase/migrations.manifest.json
  - apps/supabase/supabase/migrations/00023_invitation_caller_limit.sql
  - apps/supabase/supabase/schema/107-feedback.sql
  - apps/supabase/supabase/schema/506-invitation-rpcs.sql
  - apps/supabase/supabase/tests/database/07-rpc-security.test.sql
  - apps/supabase/supabase/tests/database/39-invitations.test.sql
  - apps/supabase/supabase/tests/database/59-invitation-caller-limit.test.sql
  - docker-compose.dev.yml
  - infra/envs/example/aws/main.tf
  - infra/envs/example/aws/terraform.tfvars
  - infra/envs/example/aws/tests/plan.tftest.hcl
  - infra/envs/example/aws/variables.tf
  - infra/envs/staging/aws/main.tf
  - infra/envs/staging/aws/terraform.tfvars
  - infra/envs/staging/aws/variables.tf
  - infra/modules/frontend-service/edge.tf
  - infra/modules/frontend-service/outputs.tf
  - infra/modules/frontend-service/task-environment.json
  - infra/modules/frontend-service/tests/frontend_service.tftest.hcl
  - infra/modules/frontend-service/variables.tf
  - infra/modules/frontend-service/waf.tf
  - infra/scripts/load-check.sh
  - infra/scripts/load-check.test.ts
  - infra/scripts/load-check/figure.mjs
  - infra/scripts/load-check/journey-from-trace.mjs
  - infra/scripts/load-check/local-journey.json
  - infra/scripts/load-check/staging-journey.json
  - infra/scripts/load-check/voter-journey.js
  - infra/scripts/posthog-read.sh
  - infra/scripts/posthog-read.test.ts
  - infra/scripts/relay-refusals.sh
  - infra/scripts/relay-refusals.test.ts
  - packages/dev-seed/tests/analyticsEnvTemplates.test.ts
  - render.example.yaml
findings:
  critical: 1
  warning: 3
  info: 5
  total: 9
  necessity: 0
status: issues_found
---

# Phase 188: Code Review Report

**Reviewed:** 2026-11-19T18:46:39Z
**Depth:** standard
**Files Reviewed:** 49
**Status:** issues_found

## Summary

I reviewed the phase's changes to the 49 scoped files, from the `(188` commits (`git diff de5da4940~1 HEAD`), and read the surrounding code where a change depends on it: adapter-node's shutdown path, the PostHog provider's forward timeout, SvelteKit's path decoding, Paraglide's `reroute`, `private.invitation_throttle_take`, the frontend callers of `account-access`, and the deploy workflow's order of migrations and functions.

The following are sound:

- **Queue tick skip:** the queue's skip-a-tick change is correct. The shutdown flush runs alongside a hanging timer flush, and the two never hand on the same events.
- **Flush interval:** the new variable is resolved, bounded and refused at startup, and it is threaded through every template.
- **Grants and `SECURITY DEFINER` in `invitation_caller_take`:**
  - every revoke and grant is correct;
  - `search_path = ''` is set and every reference is schema-qualified;
  - a missing settings row reads as untrusted.
- **The `account-access` wiring:**
  - it fails closed;
  - it runs before any operation's work;
  - only browser-side callers reach the three limited operations; `code-sign-in` is called from `contestant/register/sign-in/+page.server.ts` and is rightly excluded.
- **`posthog-read.sh`:**
  - the key is written only by a builtin `printf` into a 077 file;
  - the host is allowlisted;
  - every value interpolated into HogQL passes a pattern that admits no quote.
- **`load-check.sh`:** it passes the anon key by name only.

**Key concerns:**

1. **CR-01:** the opt-in WAF rate rule can be bypassed trivially. A locale-prefixed path or a percent-encoded path reaches the relay and never matches the scope-down.
2. **WR-01:** the caller take deletes expired rows across all callers before it takes its advisory lock. Two concurrent takes can therefore deadlock.
3. **WR-02 and WR-03:** the load check's figure and method have two defects that distort the recorded capacity figure.

The `necessity:` count is 0. The necessity rubric (`necessity-review.md`) was read, and no candidate met its evidence rule. The flush-interval variable holds 2000 in every template, but it exists for the hand overrides that CONTEXT B-04 and C-02 record, so it is not generality without instantiation. Comment hygiene: no added line cites a plan, a decision id or a historical narrative.

## Critical Issues

### CR-01: The relay WAF rule is bypassed by a locale prefix or a percent-encoded path

**File:** `infra/modules/frontend-service/waf.tf:36-52` (pinned by `infra/modules/frontend-service/tests/frontend_service.tftest.hcl:790`)

**Issue:** The scope-down matches only a raw URI path that starts with `/api/usage`, after `NORMALIZE_PATH` alone. The application, however, serves the relay at many other paths.

- **Locale prefix:** `apps/frontend/src/hooks.ts:5-7` reroutes every request through Paraglide's `deLocalizeUrl`. Paraglide strips a leading locale segment: `urlPatterns` in `apps/frontend/src/lib/paraglide/runtime.js:57`, with the locales `en`, `fi`, `sv`, `da`, `et`, `fr` and `lb`. So `POST /fi/api/usage` and `POST /en/api/usage` reach `routes/api/usage/+server.ts`, but they do not start with `/api/usage`. They are never counted and never blocked.
- **Percent-encoding:** SvelteKit decodes the path before it matches routes (`decode_pathname`, which is `decodeURI`, in `@sveltejs/kit/src/runtime/server/respond.js:268`). So `/api/%75sage` routes to the relay. CloudFront forwards the raw path, and WAF inspects it without `URL_DECODE`, so this path does not match either.
- **Origin check:** the relay's same-origin check is header-based, so a non-browser flooder sets `Sec-Fetch-Site: same-origin` and gets past it.

Switching the variable on therefore costs about 6 USD a month and gives no protection against the abuse it is meant to stop. The tftest also pins the transformation list to exactly `["NORMALIZE_PATH"]`, which locks the defect in.

**Fix:** Decode first, then normalise, and match the relay segment anywhere in the path. The route is case-sensitive, so `LOWERCASE` is not needed. A page path that merely contains `/api/usage` is harmless to count.

```hcl
scope_down_statement {
  byte_match_statement {
    search_string         = "/api/usage"
    positional_constraint = "CONTAINS"
    field_to_match {
      uri_path {}
    }
    text_transformation {
      priority = 0
      type     = "URL_DECODE"
    }
    text_transformation {
      priority = 1
      type     = "NORMALIZE_PATH"
    }
  }
}
```

Two alternatives, if `CONTAINS` is judged too wide:
- a `regex_match_statement` on `^/(?:[A-Za-z-]+/)?api/usage(?:/|$)`, with the same two transformations;
- a `reroute` hook that refuses a locale prefix on `/api/`.

Whichever is chosen, update the tftest assertion at line 790 and the 2026-11-19 Observations row in `infra/envs/staging/aws/README.md`, which describes the rule as scoped after `NORMALIZE_PATH`.

## Warnings

### WR-01: `invitation_caller_take` can deadlock two concurrent takes

**File:** `apps/supabase/supabase/migrations/00023_invitation_caller_limit.sql:53-57` (the same code is in `apps/supabase/supabase/schema/506-invitation-rpcs.sql:722-726`)

**Issue:** Each take does three things, in this order:
1. It deletes every expired `caller:` row, and holds the row locks until commit.
2. It takes `pg_advisory_xact_lock` for its own key, inside `private.invitation_throttle_take`.
3. It upserts that key.

`now()` is fixed when each transaction starts, so two concurrent transactions can disagree about whether a row has expired. Two requests from one caller that straddle the moment the window expires deadlock:
1. T2 started just before the expiry. Its `DELETE` skips K, it takes advisory lock K, and it reaches the upsert.
2. T1 started just after the expiry. Its `DELETE` locks and deletes K, and it then waits for advisory lock K, which T2 holds.
3. T2's `ON CONFLICT` waits for T1's deleted tuple.

PostgreSQL aborts one of the two after `deadlock_timeout`. The Edge Function then logs it and answers 500 `internal`. The same cycle can form across three callers, because any take can delete another caller's expired row while that caller's transaction holds its advisory lock. Each occurrence is rare, but each one is a 500 on an anonymous sign-in path and a one-second stall.

**Fix:** Take the slot first. Then clean up without ever waiting on a row lock, so that the transaction holding the advisory lock waits on nothing. Make the change in both the migration and `506-invitation-rpcs.sql`, and update the comment that says the cleanup runs first.

```sql
v_key := 'caller:' || p_project_id::text || ':' || v_caller;
v_admitted := private.invitation_throttle_take(v_key, v_max, v_window);

DELETE FROM private.invitation_throttle t
WHERE t.ctid IN (
  SELECT x.ctid FROM private.invitation_throttle x
  WHERE x.key LIKE 'caller:%' AND x.key <> v_key AND x.window_start + v_window <= now()
  FOR UPDATE SKIP LOCKED
);

IF v_admitted THEN RETURN 0; END IF;
```

Migration `00023` is already pushed to the hosted project, and the schema is append-only. The change therefore lands as a new migration, `00024`, with `CREATE OR REPLACE FUNCTION`.

### WR-02: The capacity figure is the last step that passed, not the highest rate below the first failure

**File:** `infra/scripts/load-check/figure.mjs:77` (steps are accepted unordered at `infra/scripts/load-check.sh:138-141`)

**Issue:** `computeFigure` returns `steps.filter(met).at(-1)`, which is the last step in run order that met the thresholds. Two consequences:
- **Unordered steps are accepted:** nothing requires `--steps` to rise. With `--steps 20,10`, a met 20 and a met 10 give a figure of 10.
- **A failed lower step is ignored:** with `--steps 5,10,20,40`, where 10 fails (for example, during a scale-out) and 20 passes, the recorded figure is 20, although the stack already failed at a lower rate.

CONTEXT D-04 defines the figure as "the highest step meeting all thresholds". That wording is meant for a rising series, in which every step below the figure also passed.

**Fix:** In `check_arguments`, refuse a `--steps` that is not strictly increasing. In `computeFigure`, take the last step of the leading run of met steps, so that the first unmet step ends the figure:

```js
const firstUnmet = steps.findIndex((entry) => !entry.met);
const passed = firstUnmet === -1 ? steps : steps.slice(0, firstUnmet);
const highest = passed.at(-1);
```

Add a `figure.mjs` case with a failed middle step to `load-check.test.ts`.

### WR-03: Fonts count as page requests, and each one triggers a relay post

**File:** `infra/scripts/load-check/journey-from-trace.mjs:110-112`, `infra/scripts/load-check/voter-journey.js:172-178`, `infra/scripts/load-check/staging-journey.json`

**Issue:** The extractor tags every GET to the base origin as `kind: page`. In the committed staging journey, 9 of its 14 `page` requests are font files: `/fonts/inter.css` and two `.woff2` files, repeated on three navigations. Only 5 are server-rendered pages. The k6 script posts one relay batch after every `page` request. This has two effects:
- **Page threshold:** the page p95 threshold of 1000 ms is computed over a sample that is mostly static font responses, so it understates the server-rendered latency that D-04 means to bound.
- **Relay load:** each journey sends 14 relay posts instead of about 5, so the relay load per journey is about 2.8 times a real visitor's.

The recorded figure, in journeys per minute, therefore measures neither the page latency nor the relay load of a real journey. The README describes this behaviour, but describing it does not make the figure what D-04 asks for.

**Fix:** In `journey-from-trace.mjs`, tag only document navigations as `page`. Use the trace's `resourceType`/`_resourceType` of `document` where present, or else a path without a file extension. Tag the other base-origin GETs `kind: asset`. In `voter-journey.js`, send `asset` requests untagged by the page threshold and with no relay post. Then regenerate `staging-journey.json`. Make the same change in the journey check in `load-check.sh` and in `REQUESTS` in `voter-journey.js`.

## Info

### IN-01: The browser cannot read `Retry-After`

**File:** `apps/supabase/supabase/functions/account-access/index.ts:75-78`

**Issue:** The 429 answer carries `Retry-After`, but `corsHeaders` has no `Access-Control-Expose-Headers`, and `Retry-After` is not a CORS-safelisted response header. A cross-origin browser caller, which is every caller of the three limited operations, cannot read it. This changes nothing today, because E-05 keeps the existing error and adds no new strings. It does make the header dead weight for the only clients it is sent to.

**Fix:** Add `'Access-Control-Expose-Headers': 'Retry-After'` to `corsHeaders`, or note that the header is for non-browser callers.

### IN-02: An IPv4-mapped IPv6 address falls into one shared `::/64` bucket

**File:** `apps/supabase/supabase/migrations/00023_invitation_caller_limit.sql:44-47`

**Issue:** For an address of the form `::ffff:198.51.100.7`, `family(v_inet)` is 6, and `set_masklen(v_inet, 64)` makes it `::/64`. Every such caller would then share one bucket, which is the failure the function's own comment says it avoids. Cloudflare normally sends plain IPv4 in `cf-connecting-ip`, so this is latent.

**Fix:** Before the `CASE`, key a mapped address by its host: `IF family(v_inet) = 6 AND v_inet << '::ffff:0:0/96'::inet THEN v_caller := host(v_inet); ...`. Add one pgTAP case for it.

### IN-03: No test pins that the bucket is per project

**File:** `apps/supabase/supabase/tests/database/59-invitation-caller-limit.test.sql`

**Issue:** The test covers:
- the 30/31 boundary;
- trust;
- blank and unparseable addresses;
- masks;
- the /64 grouping;
- unknown projects;
- the cleanup;
- the grants.

No case shows that the same address, once it is refused in `project_a`, is still admitted in another project. E-03 states the `caller:<project>:<address>` keying, but a change that dropped the project from the key would pass every assertion.

**Fix:** After the thirty-first refused take in block 1, assert `invitation_caller_take(test_id('project_b'), '198.51.100.7') = 0`, and bump `plan(25)`.

### IN-04: The load figure does not check for dropped iterations

**File:** `infra/scripts/load-check/figure.mjs:63-76`, `infra/scripts/load-check/voter-journey.js:100-104`

**Issue:** `constant-arrival-rate` drops iterations once `maxVUs` is exhausted, and k6 counts them only in `dropped_iterations`, not in `http_req_failed`. A step that ran short of virtual users could therefore show passing p95 and error rate at a lower real arrival rate than its label. With `maxVUs` at 8 times the estimate this is unlikely, but nothing in the figure detects it.

**Fix:** Tag `dropped_iterations` per step, with a threshold such as `count<1` per step, and make `figure.mjs` treat a step with drops as not met.

### IN-05: The 40-second stop timeout covers one slice of the shutdown flush

**File:** `apps/frontend/src/lib/server/analytics/queue.ts:89-95`, `infra/envs/staging/aws/terraform.tfvars:25-26`

**Issue:** The shutdown flush sends its slices of 100 one after another, each with up to the 10-second forward timeout. With 1000 events queued and PostHog slow, the flush needs up to 100 seconds after `SHUTDOWN_TIMEOUT`, which exceeds `stop_timeout_seconds = 40`. The module variable's description states this limitation. The tfvars comment, however, reads as if the bound were complete.

**Fix:** Either give the shutdown flush one overall deadline and send its slices concurrently, or extend the tfvars comment to say that the bound covers one slice.

---

_Reviewed: 2026-11-19T18:46:39Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
