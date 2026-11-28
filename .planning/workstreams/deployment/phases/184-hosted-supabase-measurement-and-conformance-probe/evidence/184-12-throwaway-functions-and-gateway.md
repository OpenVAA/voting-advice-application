# 184-12: the throwaway's functions, the gateway's call shapes, and what each key works for

Attempt: 184-12-1 20261110T130509Z.d5938c622
Attempt: 184-12-2 20261110T131417Z.d5938c622

- **Project:** the throwaway `begckvkapaopoztbreqc` (`eu-west-1`), root `infra/envs/scratch/supabase`, linked work directory `tmp/supabase-linked/begckvkapaopoztbreqc`. Nothing in this plan touched the persistent project.
- **Dates (UTC):** attempt `184-12-1` opened at 2026-11-10T13:05:09Z. The operator's sitting ran after that, and the orchestrator relayed the reply, received at 2026-11-10T13:14Z. The sitting gave no times for single items, so every observation below is dated **2026-11-10**, between 13:05Z and 13:14Z.
- **How the record was written:** from the attempt file of `184-12-1`, stored under `OPERATOR_REPLY=received attempt=20261110T130509Z.d5938c622 plan=184-12 task=1 head=d5938c622416fca14ab894ee622759bffbc4d2fc`. The screen accepted it on the first `put`.
- **What is kept out:** no key, no token, no response body beyond the function's fixed fields or the gateway's `code` and `message`, no IP address and no e-mail address.
- **Keys used:** the legacy `anon` key and the `publishable` key, each read at a silent prompt. The shape lines confirm each kind without printing a value: `s0_access_shape=sbp`, `s0_anon_shape=jwt` and `s0_pub_shape=publishable`. The operator ran the secrets block twice, because the first run's last prompt ended without a newline. The second run set all three variables.

## 1. The deploy and the served functions

| Line | Value |
| ---- | ----- |
| `s0_ref`, `s0_linked_ref` | `begckvkapaopoztbreqc`, both |
| `s0_functions_linked` | `yes`: the work directory's `supabase/functions` is a symbolic link to the repository's |
| `s0_docker_exit` | `0` |
| `s0_project_id` | `00000000-0000-0000-0000-000000000001`, the root's `public_project_id` |
| `s17_deploy_exit` | **0** |
| `s17_list_http` | `200` (`GET /v1/projects/<ref>/functions`) |
| `s17_function` | `account-access status=ACTIVE verify_jwt=true` |
| `s17_function` | `identity-callback status=ACTIVE verify_jwt=false` |
| `s17_function` | `send-email status=ACTIVE verify_jwt=true` |

**The functions were deployed from the linked work directory with exit 0.** The CLI followed the symbolic link to `functions` and read `verify_jwt` from the linked `config.toml`. The Management API lists all three as `ACTIVE`, with `verify_jwt=false` for `identity-callback` alone, which is what `config.toml` declares: only `[functions.identity-callback]` sets it. The others take the hosted default, `true`.

## 2. The call shapes

The answering party: `function` when the body is the function's own fixed body; `other` with the body's `code` and `message` fields otherwise.

| Item | Function, method | Headers | Status | Who answered |
| ---- | ---------------- | ------- | ------ | ------------ |
| 2a | `account-access`, POST check-code | `apikey: <anon>` only | **401** | gateway: `code=UNAUTHORIZED_NO_AUTH_HEADER`, `message=Missing authorization header` |
| 2b | `account-access`, POST check-code | `apikey: <anon>` + `Authorization: Bearer <anon>` (the frontend's shape) | **200** | function: `{"status":"unknown"}` |
| 2c | `account-access`, POST check-code | the publishable key in `apikey` and `Authorization: Bearer` | **200** | function: `{"status":"unknown"}` |
| 3a | `send-email`, GET | `apikey: <anon>` only | **401** | gateway: `code=UNAUTHORIZED_NO_AUTH_HEADER`, `message=Missing authorization header` |
| 3b | `send-email`, GET | `apikey: <anon>` + `Authorization: Bearer <anon>` | **405** | function: `{"error":"Method not allowed"}` |
| 4 GET | `identity-callback`, GET | `apikey: <anon>`, no Authorization | **405** | function: `{"error":"Method not allowed"}` |
| 4 POST | `identity-callback`, POST `{}` | `apikey: <anon>`, no Authorization | **500** | function: `{"error":"Internal server error"}` |
| 5 | REST `GET /rest/v1/elections?select=id&limit=1` | anon in `apikey` + Bearer | **200** | API |
| 5 | auth `GET /auth/v1/settings` | anon in `apikey` + Bearer | **200** | API |
| 5 | REST, same request | the publishable key in `apikey` + Bearer | **200** | API |
| 5 | auth, same request | the publishable key in `apikey` + Bearer | **200** | API |

`s5_curl_errors=no` (no call failed at the transport), `s6_logs_removed=yes`.

**What the gateway does.** On a function served with `verify_jwt=true`, the hosted gateway refuses a call that carries the anon key in `apikey` alone. It answers 401 itself, with `UNAUTHORIZED_NO_AUTH_HEADER`, and the function never runs (items 2a and 3a). With an `Authorization: Bearer` header the call reaches the function. That holds for the legacy anon JWT (2b, 3b) and for the publishable key (2c), whose header is not a JWT. So the platform's JWT check accepts the publishable key on the Authorization header, as the API-keys documentation says, and passing the check does not authenticate a caller.

**`check-code` reached the database.** The 200 `{"status":"unknown"}` of 2b and 2c means the function's admin client called `invitation_code_status` with the platform-provided service-role key and got an answer, on a project that holds only the migrations.

**`identity-callback` fails closed on the served function.** With no `IDENTITY_PROVIDER_TYPE` among the function secrets (the seven names of 184-11), a POST answered 500 with the fixed body `{"error":"Internal server error"}`, and a GET answered 405 with its own body. Both came from the function, through a gateway that does not verify a JWT for it.

## 3. Verdicts

D09_TRIGGER=yes

The gateway refused the `apikey`-only shape (2a: 401 from the gateway, not the function). The other arm of the rule does not hold: 2c also passed, so the legacy JWT is not the only shape that gets through. One arm is enough. Plan 184-14 declares `verify_jwt = false` for `account-access` in `config.toml`, redeploys, and measures 2a and 2b again.

D04_FAILS_CLOSED=yes

The GET answered 405 and the POST answered 500, both with the function's own fixed bodies.

D12_LEGACY_ANON=works

The legacy anon key worked for every call shape measured here:
- function calls: 2b (200, the function's answer) and 3b (405, the function's own refusal)
- REST and auth: 200 each (item 5)

The publishable key worked for the same REST, auth and `account-access` calls. Under D-12 the project stays on the legacy keys, and no checkpoint on FUT-02 is raised. The service-role shapes are judged in plans 184-15 and 184-16. The retirement date shown in the dashboard, "early 2027" (184-10), is added to the FUT-02 todo by plan 184-23, which owns that file.
