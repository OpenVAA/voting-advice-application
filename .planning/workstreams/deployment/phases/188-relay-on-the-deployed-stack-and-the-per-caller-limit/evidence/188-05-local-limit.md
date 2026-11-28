# 188-05 local proof of the per-caller limit

Date: 2026-11-18, the call loop at 2026-11-18T18:23:38Z (UTC)
Stack: the shared local Supabase stack (`openvaa-local`). Migrations applied: `23|00023`. Local `private.deployment_settings.behind_cloudflare = t`, as seed.sql sets it.
Function: `supabase_edge_runtime_openvaa-local` restarted with `docker restart` after its mount was confirmed to name this checkout's `apps/supabase/supabase/functions`. The working tree held the 188-05 `index.ts`, `callerLimit.ts` and `contract.ts` on top of 7377a5384.
Target: `POST http://127.0.0.1:54321/functions/v1/account-access` through the local gateway, using the local anon key (a public demo value, not recorded here). Project `00000000-0000-0000-0000-000000000001`. Addresses are TEST-NET-2 only.
Body of every check: `{"operation":"check-code","project_id":"00000000-0000-0000-0000-000000000001","code":"ZZZZ-ZZZZ-ZZZZ"}`, an unknown code.

## Named lines

LOCAL_200_COUNT=30
LOCAL_31ST_STATUS=429
LOCAL_RETRY_AFTER_PRESENT=yes
LOCAL_OTHER_CALLER_STATUS=200
LOCAL_NO_HEADER_STATUS=200
LOCAL_CALLER_ROWS=2
LOCAL_GATEWAY_FORWARDS_HEADER=yes
LOCAL_CALLER_ROWS_AFTER=0

- `LOCAL_200_COUNT=30`: calls 1 to 30 with `cf-connecting-ip: 198.51.100.7` each answered `local_call_status=200` with `{"status":"unknown"}`.
- `LOCAL_31ST_STATUS=429`: call 31 from the same address answered `local_call_status=429`, body `{"error":"too-many-requests"}`, `Retry-After: 600`.
- `LOCAL_OTHER_CALLER_STATUS=200`: the next call, with `cf-connecting-ip: 198.51.100.8`, answered `local_call_status=200`.
- `LOCAL_NO_HEADER_STATUS=200`: the next call, with no `cf-connecting-ip`, answered `local_call_status=200` and wrote no row.
- `LOCAL_CALLER_ROWS=2`: after the loop, `select key, count from private.invitation_throttle where key like 'caller:%'` answered `caller:00000000-0000-0000-0000-000000000001:198.51.100.7|31` and `caller:00000000-0000-0000-0000-000000000001:198.51.100.8|1`. The local gateway therefore forwards a client-sent `cf-connecting-ip` to `/functions/v1` (research assumption A7 holds).
- `LOCAL_CALLER_ROWS_AFTER=0`: `delete from private.invitation_throttle where key like 'caller:%'` removed them, and the count afterwards was 0.

## The other operations from the limited caller

These calls ran right after the loop, before the rows were deleted, each with `cf-connecting-ip: 198.51.100.7`:

| Operation | Status | Body | Retry-After |
| --- | --- | --- | --- |
| `request-link` | 429 | `{"error":"too-many-requests"}` | 589 |
| `request-recovery` | 429 | `{"error":"too-many-requests"}` | 589 |
| `code-sign-in` | 429 | `{"error":"too-many-requests"}` | 589 |
| `confirm-address` (no signed-in token) | 401 | `{"error":"unauthenticated"}` | none |

The `198.51.100.7` row went from 31 to 34. The three anonymous operations each took a slot, and `confirm-address` took none.

## Calls, verbatim (status lines)

```
call=1..30 caller=198.51.100.7 local_call_status=200 body={"status":"unknown"}
call=31 caller=198.51.100.7 local_call_status=429 body={"error":"too-many-requests"} retry_after=600
call=other caller=198.51.100.8 local_call_status=200 body={"status":"unknown"}
call=no-header local_call_status=200 body={"status":"unknown"}
```

An earlier run of the same loop, a few minutes before, never sent its no-header call: under `set -u`, bash 3.2 rejected the script's empty header array. Its 31 calls from `198.51.100.7` answered 200 thirty times and then 429 with `Retry-After: 600`, and its `198.51.100.8` call answered 200. Its two `caller:` rows were deleted, the script was fixed, and the loop above was run again from zero rows. The lines above come from that second run only.

Nothing hosted was called, and no `supabase functions deploy` was run.
