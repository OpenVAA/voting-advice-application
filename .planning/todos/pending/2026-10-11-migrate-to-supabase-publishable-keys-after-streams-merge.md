---
created: 2026-10-11T00:00:00.000Z
title: Migrate to Supabase publishable keys, right after v2.16 and v2.17 are merged
area: supabase / keys
severity: major
source: operator, 2026-10-11 (note under C5 of v2.17-DISCUSSION-POINTS.md, workstream deployment)
---

## Problem

Supabase's legacy `anon` and `service_role` keys are reported as retired by the end of 2026
(research/STACK.md, a docs reading, not observed). v2.17 measures what a new project issues and
stays on legacy keys if they work (SUPA-13), because the migration touches the frontend, the Edge
Functions and the storage cleanup trigger, in code the v2.16 stream is working near.

## Solution

Queue this as the first work after both streams are merged, per the operator. Start from the key
model v2.17 records for the hosted project. Cover the frontend's client construction, the three
Edge Functions, the storage cleanup trigger and its `storage_config` row, the Terraform outputs
and secrets, and the environment-variable reference.

## Observed key model (phase 184)

Recorded on 2026-11-11 (UTC) by plan 184-23, from the phase-184 evidence: `184-10-throwaway-reads.md`,
`184-12-throwaway-functions-and-gateway.md`, `184-14-key-and-gateway-rulings.md`,
`184-15-throwaway-bootstrap-admin-seed.md`, `184-18-throwaway-break-red.md`,
`184-20-persistent-reads-and-plan.md`, `184-22-persistent-bootstrap-admin-seed.md` and
`184-23-persistent-probe-and-records.md`. Key types, names, states and dates only; no key value is
written here or was stored by any of those plans.

### The two projects

| | Throwaway `begckvkapaopoztbreqc` | Persistent staging `cofbsatfrdysyphajsky` |
| --- | --- | --- |
| Read on | 2026-11-08/09 (184-10) | 2026-11-11 (184-20) |
| Keys issued (type/name) | `legacy/anon`, `legacy/service_role`, `publishable/default`, `secret/default` | the same four |
| Legacy-keys endpoint | status 200, legacy keys enabled (`true`) | status 200, legacy keys enabled (`true`) |
| Dashboard, legacy state | legacy anon and service_role keys enabled; the page offers "Disable JWT-based API keys" | legacy keys active under "View legacy API keys", with a note to prefer the publishable and secret keys; "Disable JWT-based API keys" offered |
| Dashboard, retirement | "early 2027" | the legacy keys shown "retiring early 2027" (banner: "Legacy API keys will be retired in early 2027"), as the operator reported from the dashboard on 2026-11-11 |
| Publishable key issued | yes | yes |

The conformance probe's `NOTE key-model:` line read the same model on both projects in its green
runs (184-17 and 184-19 on the throwaway, 184-23 on staging): `issued legacy/anon,
legacy/service_role, publishable/default, secret/default; legacy keys enabled`.

The retirement is a season, not a day, and no merge date for v2.16 and v2.17 is recorded. The
operator ruled on 2026-11-10 that nothing recorded puts the merge after it (`D12_RAISED=no`,
184-14). If the merge slips toward early 2027, this todo becomes urgent rather than queued.

### Which call shapes each key was seen working for

- **Legacy anon key, `D12_LEGACY_ANON=works`** (184-12, throwaway): REST (`GET /rest/v1/...`) and
  auth (`GET /auth/v1/settings`) with the key in `apikey` and `Authorization: Bearer`, status 200;
  `account-access` with the same two headers (200, the function's answer) and `send-email` (405,
  the function's own refusal). With the key in `apikey` alone, a function served with
  `verify_jwt = true` was refused by the gateway, 401 `UNAUTHORIZED_NO_AUTH_HEADER` (184-12; and
  401 on `identity-callback` while a fault set it true, 184-18).
- **Legacy service-role key, `D12_SERVICE_ROLE=works`** (184-15 throwaway, 184-22 staging): the
  stored key of the bootstrap runs, the dev-seed writes of the `smoke` dataset, and on staging the
  Auth Admin API's `POST /auth/v1/admin/users` (status 200).
- **Publishable key:** REST and auth with `apikey` and `Authorization: Bearer`, status 200, and
  `account-access` with the same headers, 200 (184-12). A password sign-in of the first
  administrator, status 200, on both projects (184-15, 184-22), and an anonymous read of 1001
  nominations, status 206 (184-15, 184-22). The probe has used it as `SUPABASE_ANON_KEY` in every
  run since the operator's ruling of 2026-11-09. Unlike the legacy anon key, it passed the
  gateway's JWT check in `apikey` alone, on a function served with `verify_jwt = true` (184-18:
  405 from the function where the legacy anon key got 401 from the gateway). So passing that check
  authenticates nobody.
- **Secret key:** issued on both projects, used by nothing in phase 184.

### `D09_APPLIED=yes` and what it means for the migration

Ruled on 2026-11-10 (184-14): `account-access` is declared with `verify_jwt = false` in
`apps/supabase/supabase/config.toml`, beside `identity-callback`, which already had it; only
`send-email`, which the auth hook calls, keeps `verify_jwt = true`. Both projects serve it so
(184-15, 184-21), and `account-access` then answered the `apikey`-only shape itself (184-15).

For this migration: the gateway's JWT check no longer depends on the key shape for the two
functions the browser calls, so swapping the legacy anon key for the publishable key changes
nothing at the gateway for them. What is left to migrate is what reads a key itself: the
frontend's client construction, the functions' own admin clients (the platform-provided service-role
key), the storage cleanup trigger and its `storage_config` row (the service-role key the bootstrap
stores), the Terraform outputs and secrets, and the environment-variable reference.

### Status

Unchanged by phase 184: the deployment stays on the legacy keys (C5, D-12), and this todo stays
queued as the first work after v2.16 and v2.17 are merged. No other todo was created for it.

**2026-11-25:** pulled forward by the operator ("I want the move done as soon as possible"): phase 189.1.2 of workstream `deployment`, run right after 189.1.1, no longer waiting for the merge.
