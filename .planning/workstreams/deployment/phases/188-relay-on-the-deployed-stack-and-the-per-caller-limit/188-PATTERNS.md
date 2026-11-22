# Phase 188: Relay on the Deployed Stack, and the Per-Caller Limit - Pattern Map

**Mapped:** 2026-11-15
**Files analyzed:** 27 new or modified
**Analogs found:** 25 / 27

> **Note:** another agent is landing phase-187 review fixes in `infra/` and `.github/` while this map is written. Line numbers in `infra/` (module `variables.tf`, `edge.tf`, `main.tf`, the staging README) may move a little once those fixes land. Find each place by its content (variable name, resource name, section heading), not by line number. This map does not touch `.github/`.

RESEARCH.md § Architecture Patterns 1-6 already quotes most target code verbatim. This map adds the analog for each file and points to those sections instead of copying them again.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `apps/frontend/src/lib/server/analytics/config.ts` (mod) | config resolver | transform | itself: `ANALYTICS_ENV` + `resolveAnalyticsConfig` | exact |
| `apps/frontend/src/lib/server/analytics/config.test.ts` (mod) | test | transform | itself | exact |
| `apps/frontend/src/lib/server/analytics/runtime.ts` (mod, l.29) | wiring | — | itself | exact |
| `apps/frontend/src/lib/server/analytics/queue.ts` (mod, C-03) | service | batch/event-driven | itself (`createQueue` timer) | exact |
| `apps/frontend/src/lib/server/analytics/queue.test.ts` (mod) | test | batch | itself, fake timers at `:127-149` | exact |
| `apps/frontend/src/lib/server/startup/taskEnvironment.test.ts` (mod, `ANALYTICS_NAMES`) | contract test | — | itself `:33-39` | exact |
| `infra/modules/frontend-service/task-environment.json` (mod) | config contract | — | the `ADDRESS_HEADER` entry (value, not required) | exact |
| `.env.example`, `docker-compose.dev.yml` (mod) | config | — | existing `ANALYTICS_*` lines | exact |
| `infra/envs/{staging,example}/aws/terraform.tfvars` (mod) | config | — | existing `environment_values` entries | exact |
| `infra/envs/{staging,example}/aws/variables.tf` + `main.tf` (mod: `stop_timeout_seconds`, `relay_rate_limit`) | config / root wiring | — | `module "frontend"` block in `infra/envs/staging/aws/main.tf` | exact |
| `infra/modules/frontend-service/variables.tf` (mod) | config | — | `variable "stop_timeout_seconds"` (validated) | exact |
| `infra/modules/frontend-service/waf.tf` (new) | IaC resource | request-response (edge) | `infra/modules/frontend-service/edge.tf` (`provider = aws.us_east_1` resources) | role-match |
| `infra/modules/frontend-service/edge.tf` (mod: `web_acl_id`) | IaC resource | — | itself, `aws_cloudfront_distribution.this` | exact |
| `infra/modules/frontend-service/tests/frontend_service.tftest.hcl` (mod) | test | — | `run "stop_timeout_refuses_above_fargate"` | exact |
| `apps/supabase/supabase/migrations/00002_invitation_caller_limit.sql` (new) | migration | CRUD | `00001_initial_schema.sql` (only migration); body from `schema/506-invitation-rpcs.sql` throttle | partial (first appended migration) |
| `apps/supabase/supabase/migrations.manifest.json` (mod) | config | — | its existing `migrations[]` entry | exact |
| `apps/supabase/supabase/schema/506-invitation-rpcs.sql` (mod) | schema mirror | CRUD | `private.invitation_throttle_take` | exact |
| `apps/supabase/supabase/schema/107-feedback.sql` (comment only) | schema | — | itself `:30` | exact |
| `apps/supabase/supabase/tests/database/48-invitation-caller-limit.test.sql` (new) | pgTAP test | CRUD | `35-feedback-rate-limit-key.test.sql` | exact |
| `apps/supabase/supabase/tests/database/07-rpc-security.test.sql`, `39-invitations.test.sql` (census pins) | test | — | themselves (`:428`, `~:4697-4724`) | exact |
| `apps/supabase/supabase/functions/account-access/callerLimit.ts` (new) | utility (pure) | request-response | `account-access/deploymentChecks.ts` | exact |
| `apps/supabase/supabase/functions/account-access/callerLimit.test.ts` (new) | test | — | `account-access/deploymentChecks.test.ts` | exact |
| `apps/supabase/supabase/functions/account-access/contract.ts` + `contract.test.ts` (mod: `TOO_MANY_REQUESTS_BODY`) | contract | — | `INTERNAL_ERROR_BODY` (`contract.ts:83`), census `contract.test.ts:292-299` | exact |
| `apps/supabase/supabase/functions/account-access/index.ts` + `flowConformance.test.ts` (mod) | edge function | request-response | itself (`answer()` l.70, `parseAccountAccessRequest` l.295) | exact |
| `infra/scripts/relay-refusals.sh` + `relay-refusals.test.ts` (new) | script + test | request-response | `infra/scripts/request-loop.sh` + `request-loop.test.ts` | exact |
| `infra/scripts/load-check.sh` + `load-check.test.ts` (new) | script + test | batch | `infra/scripts/request-loop.sh` (header, self-test) | role-match |
| `infra/scripts/load-check/voter-journey.js` (new) | k6 script | batch | none | **no analog** |
| `infra/envs/staging/{aws,supabase}/README.md` Observations rows; `apps/docs/.../authentication/+page.md`, `.../deployment/+page.md` (mod) | docs | — | the existing `## Observations` table, `infra/envs/staging/aws/README.md` (~l.3711) | exact |

## Pattern Assignments

### Analytics flush interval (B-04): `config.ts`, `runtime.ts`, `task-environment.json`, tfvars, `.env.example`, `taskEnvironment.test.ts`, tftest
**Analog:** the existing `ANALYTICS_*` variables. Follow RESEARCH.md § Pattern 1, which gives the full touch list. Current `config.ts:11-17`:
```ts
export const ANALYTICS_ENV = {
  provider: 'ANALYTICS_PROVIDER',
  consentMode: 'ANALYTICS_CONSENT_MODE',
  visitIdMode: 'ANALYTICS_VISIT_ID_MODE',
  posthogKey: 'ANALYTICS_POSTHOG_KEY',
  posthogHost: 'ANALYTICS_POSTHOG_HOST'
} as const;
```
Problem shape (`config.ts`, `AnalyticsConfigProblem`): `{ variable, reason: 'invalid' | 'missing', provided? }`. Leave `provided` out, because it is only for vocabulary variables. Any problem resolves the provider to `none`, and through `STARTUP_RULES` it refuses start.
Shape of the task-environment entry (copy from `ADDRESS_HEADER`):
```json
{ "name": "ANALYTICS_FLUSH_INTERVAL_MS", "source": "value", "required": false, "description": "…" }
```
Tftest: add the key to both `environment_values` blocks, and change `length(output.task_environment_names) == 16` to 17.

### `queue.ts` (C-03)
**Analog:** itself. Current timer (end of `createQueue`):
```ts
const timer = setInterval(() => void flush(), flushIntervalMs);
timer.unref();
```
Replace it with the `inFlight` guard from RESEARCH.md § Pattern 2. `registerShutdownFlush` keeps calling `queue.flush()` directly:
```ts
target.once(SHUTDOWN_EVENT, () => { queue.stop(); void queue.flush(); });
```
Test: a hanging provider plus `vi.advanceTimersByTimeAsync`, in the style of `queue.test.ts:127-149`.

### `stop_timeout_seconds` through the root (B-05)
**Analog:** module `infra/modules/frontend-service/variables.tf`:
```hcl
variable "stop_timeout_seconds" {
  description = "Seconds between the stop signal and the kill of the container. The server's SHUTDOWN_TIMEOUT must be lower, so that it exits by itself."
  type        = number
  default     = 30
  validation {
    condition     = var.stop_timeout_seconds >= 2 && var.stop_timeout_seconds <= 120
    error_message = "stop_timeout_seconds must be between 2 and 120, the range Fargate accepts."
  }
}
```
RESEARCH.md Pitfall 1: neither root declares this variable today. Declare it in `infra/envs/{staging,example}/aws/variables.tf` and pass it in the `module "frontend"` block (`source = "../../../modules/frontend-service"`, providers `aws` and `aws.us_east_1`). Only then set `40` in the staging tfvars. Add the bound 25 + 10 + 5 to the description, "for a responsive PostHog" (Pitfall 2).

### `waf.tf` (new), `edge.tf`, module `variables.tf` `relay_rate_limit` (C-04)
**Analog:** the resources in `edge.tf` that already set `provider = aws.us_east_1` (l.7, l.35), and the validated-variable style above. RESEARCH.md § Pattern 3 has the full HCL: a nullable object variable, `count = var.relay_rate_limit == null ? 0 : 1`, and `web_acl_id = one(aws_wafv2_web_acl.relay[*].arn)` inside `aws_cloudfront_distribution.this` (`edge.tf:64`). Before committing, check the `[ASSUMED]` arguments in that section against the provider docs.
**Tests:** copy `run "stop_timeout_refuses_above_fargate"` (tftest ~l.382):
```hcl
run "stop_timeout_refuses_above_fargate" {
  command = plan
  variables { stop_timeout_seconds = 121 }
  expect_failures = [var.stop_timeout_seconds]
}
```
Add `mock_resource "aws_wafv2_web_acl"` to the `us_east_1` mock provider, then the four runs in § Pattern 3.

### `migrations/00002_invitation_caller_limit.sql` + `migrations.manifest.json` + `schema/506` mirror (E-02 to E-04)
**Analog:** `private.invitation_throttle_take` in `schema/506-invitation-rpcs.sql`. It is SECURITY DEFINER with `SET search_path = ''` and an advisory lock, and EXECUTE is revoked from every API role. Trust read and address parse precedent, `schema/107-feedback.sql` (~l.78-87):
```sql
IF p_trust_cf_connecting_ip THEN
  p_candidate := NULLIF(btrim(p_headers ->> 'cf-connecting-ip'), '');
  IF p_candidate IS NOT NULL THEN
    BEGIN
      RETURN host(p_candidate::inet);
    EXCEPTION WHEN invalid_text_representation THEN NULL;
    END;
  END IF;
END IF;
```
The full RPC body is in RESEARCH.md § Pattern 4 (`public.invitation_caller_take`; it returns 0 when the call is admitted or the limit is skipped, and N seconds when it is refused). The manifest gets a second `migrations[]` entry `{ "file": "00002_…", "sha256": "…" }` next to the baseline entry; `baseline` stays unchanged. Comments that become false and must be rewritten: the `506` throttle header ("No key holds an address in clear … no key is derived from a request header"), and `107-feedback.sql:30` ("Its only reader…"). RESEARCH.md Pitfall 13: the migration must reach the hosted project before the function.

### `tests/database/48-invitation-caller-limit.test.sql` (new)
**Analog:** `35-feedback-rate-limit-key.test.sql`. Copy its header-comment style, the preamble, TEST-NET address ranges and `UPDATE private.deployment_settings SET behind_cloudflare = …` inside the transaction, ending with `ROLLBACK`:
```sql
BEGIN;
SET search_path = public, extensions;
DROP TABLE IF EXISTS __tcache__;
SELECT plan (N);
SELECT create_test_data ();
```
To move a window, `UPDATE window_start`, as `39-invitations.test.sql:~3793` does (`now()` is frozen inside the transaction). The list of cases is in § Pattern 4. Census pins to bump: `07-rpc-security.test.sql:428` (9 to 10, alphabetical) and `39-invitations.test.sql` `'11 true'` to `'12 true'`.

### `account-access/callerLimit.ts` + `.test.ts` (new)
**Analog:** `account-access/deploymentChecks.ts`. It is a pure module, imported by both Deno and vitest. Copy its header doc:
```ts
/**
 * …
 * Pure functions and constants with no Deno imports, no URL imports and no reference to the Deno global, so the module can be imported by both the Edge Function and vitest.
 */
export const SIGN_UP_CHECK_TTL_MS = 60000;
```
Export `CALLER_ADDRESS_HEADER = 'cf-connecting-ip'` and `callerAddress(headers: Headers): string | null`. The test follows `deploymentChecks.test.ts`.

### `contract.ts` / `contract.test.ts`
**Analog:** `contract.ts:83`:
```ts
/** The answer when a dependency of the function failed during a code check. */
export const INTERNAL_ERROR_BODY = Object.freeze({ error: 'internal' } as const);
```
Add `TOO_MANY_REQUESTS_BODY = Object.freeze({ error: 'too-many-requests' } as const)` with TSDoc, and add it to the `*_BODY` census at `contract.test.ts:292-299`.

### `account-access/index.ts` + `flowConformance.test.ts`
**Analog:** itself. Response helper (`index.ts:70-73`):
```ts
function answer(body: unknown, status: number): Response {
  … headers: { ...corsHeaders, 'Content-Type': 'application/json' }
```
`tooManyRequests(n)` copies it and adds `'Retry-After': String(n)`. Put the take after `const request = parseAccountAccessRequest(body);` (~l.295) and before the first operation branch; the snippet is in § Pattern 5. Log failures only through `log(…, describeFailure(err))` (`index.ts:77-81`), and never log the address. Two conformance pins change on purpose (read set to `['headers','json','method']`). Add the new pins listed in § Pattern 5. The origin-header pin at `:257` stays unchanged.

### `infra/scripts/relay-refusals.sh` + `relay-refusals.test.ts` (C-01)
**Analog:** `infra/scripts/request-loop.sh` + `request-loop.test.ts`. Copy:
- the header block: name and purpose, "What it does", "What it does not record" (no body, no header written), Usage, flags, `--self-test` against loopback node servers, Exit codes 0/1/2, then `set -euo pipefail`;
- the output format: one line per case, a final summary line, and a `self_test <name> PASS|FAIL` line per self-test case;
- the test harness (`request-loop.test.ts`): `spawnSync('bash', [SCRIPT, '--self-test'])` with a stripped env (`PATH`, `HOME`, `TMPDIR`), filtering on `/^self_test \S+ (PASS|FAIL)$/`, expecting no FAIL, and checking each case name is present.
The cases and statuses are in RESEARCH.md § Code Examples "Relay refusal cases" and in Pitfall 6 (33 KiB chunked).

### `infra/scripts/load-check.sh` + `load-check.test.ts` (OBS-11)
**Analog:** the same `request-loop.sh` pattern for the wrapper. It runs the k6 container at a pinned version, mounts `/out`, and takes the anon key from the environment. The self-test covers k6 option parsing and a local dry run. Keep it under `infra/`: `infra/vitest.config.ts` includes `scripts/**/*.test.ts`, and the `tests/` lint would reject `k6/http`.

## Shared Patterns

- **Comment hygiene (CLAUDE.md):** no history, no `D-NN`/`.planning` references, and TSDoc on every export. SQL `--` comments describe the code as it is now.
- **Never print secrets:** scripts and HogQL reads print named lines only. Keys come from the keychain or `__ENV`. Problems never carry a `provided` value for secrets (`config.ts`).
- **Validated Terraform variables:** `validation { condition … error_message … }` that names the accepted range, plus a tftest `expect_failures` run for each bound.
- **Supabase definer functions:** `SECURITY DEFINER SET search_path = ''`, `REVOKE EXECUTE … FROM PUBLIC, anon, authenticated`, `GRANT … TO service_role` for an RPC the function calls. Each one changes the pgTAP census pins.
- **Evidence records:** a dated row in `## Observations` (`| Date (UTC) | Observation |`) in `infra/envs/staging/aws/README.md` and `infra/envs/staging/supabase/README.md` (l.1787). Raw output goes to `188-*/evidence/`.

## No Analog Found

| File | Role | Data Flow | Reason |
|---|---|---|---|
| `infra/scripts/load-check/voter-journey.js` | k6 load script | batch | The repo has no load-test tooling. Use RESEARCH.md § Pattern 6 and Pitfalls 15-16 (k6 v2). |
| `migrations/00002_…` (as an appended migration) | migration | — | Only the baseline exists, so this is the first appended migration. Body patterns exist (see above). Shape and manifest follow the freeze rules checked by `scripts/fixtures/schema-migration-freeze/`. |

## Metadata

**Analog search scope:** `apps/frontend/src/lib/server/analytics/`, `apps/supabase/supabase/{schema,migrations,tests/database,functions/account-access}/`, `infra/modules/frontend-service/`, `infra/envs/staging/`, `infra/scripts/`
**Files scanned:** ~30
**Pattern extraction date:** 2026-11-15
