# 184-13: the throwaway's forwarded headers, the anon timeout, and the drift check red and green

Attempt: 184-13-2 20261110T132949Z.512ce3d9b
Attempt: 184-13-3 20261110T200119Z.512ce3d9b

- **Project:** the throwaway `begckvkapaopoztbreqc` (`eu-west-1`), root `infra/envs/scratch/supabase`, linked work directory `tmp/supabase-linked/begckvkapaopoztbreqc`. Nothing in this plan touched the persistent project. Its ref appears only as the wrong host of the guard's refusal (item 4), which refuses before any connection.
- **Who ran the sitting:** the orchestrator, under the operator's authorisation of 2026-11-10, with the throwaway's credentials read from the operator's macOS keychain (service `openvaa-184-scratch`). The executor held no credential and ran nothing hosted.
- **Dates (UTC):** attempt `184-13-2` opened at 2026-11-10T13:29:49Z. The sitting ran from **2026-11-10T19:57:04Z to 2026-11-10T20:00:07Z**. Every observation below falls inside that window.
- **How it was run:** nine numbered scripts, `01-plant.sh` to `09-cleanup.sh`. Each ran in a fresh shell and sourced one prelude, which loads the credentials, enters the repository root, and sets the ref, the session pooler variables (`aws-0-eu-west-1.pooler.supabase.com:5432`, user `postgres.<ref>`) and a fixed log directory. Only `s<n>_` lines were printed.
  - **03x:** the orchestrator added a tenth script, `03x-xff-only.sh`, while the planted objects existed. It is read-only. It classified the two 403 bodies and repeated the spoofed call with `x-forwarded-for` alone (§ 2).
  - **05:** it ran while 04's drift check ran in the background. 05 is read-only and separate from the drift check.
- **How the record was written:** from the attempt file of `184-13-2`, stored under `OPERATOR_REPLY=received attempt=20261110T132949Z.512ce3d9b plan=184-13 task=2 head=512ce3d9b45ce32e730cdf5136336f60328f6395`. The screen accepted it on the first `put`.
- **What is kept out:** no key, no body other than Cloudflare's `error code: 1000`, and no address. The workstation's addresses were read into shell variables and only compared. The spoofed values are the documentation addresses `203.0.113.7` (`x-forwarded-for`) and `203.0.113.8` (`cf-connecting-ip`).
- **The key used:** the publishable key, in `apikey` and, for REST, as the Bearer header (`s0_anon_shape=publishable`, `s0_access_shape=sbp`).

## 1. The temporary objects

The objects were written under `tmp/184-header-echo/`, which Git ignores. None was committed, and none was placed under `apps/supabase/supabase/`.

- **`header-echo`:** an Edge Function deployed with `verify_jwt = false`. It answers with the request headers named `x-forwarded-*`, `x-real-ip`, `forwarded`, `via`, `true-client-ip`, `x-client-ip` or `x-envoy-external-address`, or beginning `cf-`, and no other.
- **`public.probe_request_headers()`:** a SQL function returning the same header family from `current_setting('request.headers', true)`.
- **`public.probe_sleep(double precision)`:** a SQL function that calls `pg_sleep`.
- **Grants:** EXECUTE on both SQL functions was revoked from PUBLIC and granted to `anon`.

| Line                                                   | Value                     |
| ------------------------------------------------------ | ------------------------- |
| `s0_ref`, `s0_linked_ref`                              | `begckvkapaopoztbreqc`, both |
| `s0_is_throwaway`                                      | `yes`                     |
| `s0_docker_exit`, `s0_pg_connect_exit`                 | `0`, `0` (session pooler) |
| `s1_echo_deploy_exit`                                  | **0**                     |
| `s1_sql_create_exit`                                   | **0**                     |
| `s1_sql_functions_present`                             | `2`                       |

## 2. The forwarded headers (D-19)

| Line (`s2_echo_` function, `s3_pg_` database, `s3x_` x-forwarded-for spoof alone) | Function, plain | Function, both spoofed | Function, x-forwarded-for spoofed | Database, plain | Database, both spoofed | Database, x-forwarded-for spoofed |
| --- | --- | --- | --- | --- | --- | --- |
| HTTP status | 200 | **403**, `error code: 1000` | 200 | 200 | **403**, `error code: 1000` | 200 |
| Header names | `cf-connecting-ip`, `cf-ew-via`, `cf-ray`, `cf-visitor`, `cf-worker`, `x-forwarded-for`, `x-forwarded-port`, `x-forwarded-proto` | (refused) | same as plain | `cf-connecting-ip`, `cf-ew-via`, `cf-ipcountry`, `cf-ray`, `cf-visitor`, `cf-worker`, `x-forwarded-for`, `x-forwarded-proto` | (refused) | same as plain |
| `cf-connecting-ip` present / is the client / is the spoof | yes / **yes** / no | — | yes / **yes** / no | yes / **yes** / no | — | yes / **yes** / no |
| `cf-connecting-ip` family | 4 | — | 4 | 4 | — | 4 |
| `x-forwarded-for` entries | 3 | — | 3 | 1 | — | 2 |
| `x-forwarded-for` holds the spoof | no | — | **no** | no | — | **yes** |
| last `x-forwarded-for` entry is the client | no | — | no | **yes** | — | **yes** |
| last `x-forwarded-for` entry is private | no | — | no | no | — | no |
| the client appears in `x-forwarded-for` | yes | — | yes | yes | — | yes |

The workstation had a known IPv4 address and no IPv6 route (`client_v4_known=yes`, `client_v6_known=no`). Every call went over IPv4. No `x-real-ip`, `true-client-ip`, `x-client-ip`, `x-envoy-external-address`, `forwarded` or `via` header reached either side.

**What the record shows:**

- **A client cannot send its own `cf-connecting-ip`.** Both calls that carried a client-sent `cf-connecting-ip` were refused before the project, by Cloudflare, with 403 and the body `error code: 1000`. The same calls with only `x-forwarded-for` spoofed (03x) answered 200. So the one header that differs between the two is what Cloudflare refused, and a request that tries to choose `cf-connecting-ip` never reaches PostgREST or a function. That Cloudflare's code 1000 means exactly this is UNCONFIRMED; the refusal itself is measured.
- **`cf-connecting-ip` is the client on every request that is served.** This held on both sides, plain and with `x-forwarded-for` spoofed.
- **The function sees an `x-forwarded-for` rebuilt by the platform.** It held three entries. The spoof was dropped, the client was among them, and the last entry was neither the client nor a private address.
- **The database sees the client's own `x-forwarded-for` with one hop appended.** The plain call held one entry, the client. The spoofed call held two: the spoof first, the client last. The earlier entries are written by the client, as the rate-limit key's comment says, and the last is the connecting client here, not a platform-internal address.
- **`cf-ipcountry` reaches the database and not the function**, and `x-forwarded-port` reaches the function and not the database.

## 3. The verdict on `behind_cloudflare` (D-08)

BEHIND_CLOUDFLARE=true

**Reason.** On the database side, `cf-connecting-ip` was the connecting client on every served request, and a client cannot choose it: Cloudflare refused, with 403, every request that set it. That is the condition `private.deployment_settings.behind_cloudflare` states. The gateway is the platform's, so the throwaway stands for the persistent project (D-19).

**How the plan's rule was applied.** The plan decides from the spoofed call's `cf-connecting-ip` on the database side. That value does not exist, because Cloudflare refused the call before the database. The rule's purpose, that the platform sets the header and a client cannot choose it, is met more strongly than the rule assumed: a client-chosen value is never delivered at all, rather than overwritten. Three facts give the verdict:
- `s3_pg_plain_cf_is_client=yes`;
- `s3x_pg_xffonly_cf_is_client=yes` with `s3x_pg_xffonly_cf_is_spoof=no`;
- `s3_pg_spoof_http=403`.

**What `false` would do here.** With `behind_cloudflare` false, the key would be the last `x-forwarded-for` entry. On this measurement that entry is also the client (`xff_last_is_client=yes`, not private), so `false` would not have collapsed voters into one bucket today. `true` is still the right value: the last entry is the client only while exactly one hop appends to the header in front of PostgREST, which the platform does not promise, while `cf-connecting-ip` cannot be chosen by a client at all.

**Not measured:** a request that reaches the project's origin without passing through Cloudflare, and a request sent from another Cloudflare Worker.

## 4. The drift check red and its guard (D-22)

| Line                         | Value |
| ---------------------------- | ----- |
| `s4_drift_red_exit`          | **1** |
| `s4_drift_names_planted`     | `2` (lines of `schema.diff.sql` naming a planted function) |
| `s4_diff_names_headers_fn`, `s4_diff_names_sleep_fn` | `yes`, `yes` |
| `s4_diff_other_stmts`        | `0`: no other statement in the diff |
| `s4_report`                  | `history: manifest: 00001`, `history: database: 00001`, `history: holds`, `SCHEMA DRIFT: …`, `DRIFT` |
| `s4_port_6543_exit`          | **2**, reason names `PGPORT 6543` |
| `s4_other_ref_exit`          | **2**, reason: PGHOST is neither the linked project's host nor a session pooler host |

**The drift check is red on a hosted database.** With the two planted functions present, `check-drift.sh --target linked` exited 1. Its history part held, and its schema part reported a diff naming both functions and nothing else. The guard refused the transaction pooler port and a host of another project, each with exit 2, before connecting.

## 5. The anon timeout on a served request (OBS-07)

| Line | `{"seconds":9}` | `{"seconds":7}` |
| ---- | --------------- | --------------- |
| HTTP status | **500** | **204** |
| body `code` | **`57014`** | none |
| time, whole seconds | **8** | 7 |

`POST /rest/v1/rpc/probe_sleep` as `anon`, with the publishable key in `apikey` and the Bearer header. The 9 s sleep was cancelled after about 8 s with SQLSTATE 57014. The 7 s sleep completed. PostgREST applies the `anon` role's `statement_timeout = '8s'` of the baseline to a served request.

## 6. Removal, the drift check green, the second push and the functions

| Line | Value |
| ---- | ----- |
| `s6_echo_delete_exit` | **0** |
| `s6_sql_drop_exit` | **0** |
| `s6_sql_functions_left` | `0` |
| `s6_echo_listed` | `no` (`s6_list_http=200`) |
| `s7_drift_clean_exit` | **0**, `CLEAN -- the history equals the manifest and the diff is empty` |
| `s16_push_exit` | **0** |
| `s16_push_up_to_date` | **yes** |
| `s16_push_connection` | `unknown` (the CLI-marker gap of deferred-items.md, "From 184-11") |
| `s16_drift_status` | `0`, `CLEAN` |
| `s17_list_http` | `200` |
| `s17_function` | `account-access status=ACTIVE verify_jwt=true` |
| `s17_function` | `identity-callback status=ACTIVE verify_jwt=false` |
| `s17_function` | `send-email status=ACTIVE verify_jwt=true` |

**Nothing temporary is left on the project.** The echo function was deleted and is no longer listed, and both SQL functions were dropped (count 0).

**The drift check is green after the removal.** It is the same check and the same hosted database that were red in § 4, so the green result is trusted.

**The second run of the push wrapper was up to date.** It pushed nothing, asked nothing, and exited 0. The functions list holds the three functions only.

## 7. The shadow cache and the logs

| Line | Value |
| ---- | ----- |
| `s8_cache_before` | `1` |
| `s8_cache_after` | **0** |
| `s9_logs_removed` | **yes** |

The CLI's `~/.supabase/cache/shadow-baseline/` held one archive and now holds none. The log directory of the sitting was removed. The temporary directory `tmp/184-header-echo/` was removed after this record was written.

## 8. Deviations

- **Both spoofed calls were refused by Cloudflare.** Items 2 and 3 sent the two spoofed headers together and got 403, `error code: 1000`, so the lines the plan's verdict rule reads were not produced. The orchestrator's read-only 03x spoofed `x-forwarded-for` alone while the planted objects existed. The verdict uses 03x together with the refusal (§ 3).
- **05 ran while 04 ran.** The timed requests went to PostgREST while the drift check's shadow database ran locally in Docker. The two share nothing on the project.
