---
phase: 188-relay-on-the-deployed-stack-and-the-per-caller-limit
plan: "05"
status: complete
subsystem: edge-functions
tags: [supabase, edge-function, account-access, rate-limit, OBS-09, docs]
requires:
  - "188-04: public.invitation_caller_take(uuid, text) -> integer (migration 00023)"
provides:
  - "account-access takes one caller slot before check-code, request-link, request-recovery and code-sign-in; confirm-address takes none"
  - "HTTP 429 { error: 'too-many-requests' } with Retry-After, the same for the four; a failed take answers 500 internal"
  - "callerLimit.ts: CALLER_ADDRESS_HEADER, callerAddress, retryAfterSeconds"
  - "Docs: the per-caller limit, its trust rule, its 429 and what it stores"
affects:
  - "188-08 (full E2E run)"
  - "188-10 (hosted push; the function is deployed after migration 00023)"
tech-stack:
  added: []
  patterns:
    - "Pure importable module for a request-header read, unit-tested under vitest"
    - "Source-level conformance pins for where and how often the handler reads the caller's address"
key-files:
  created:
    - apps/supabase/supabase/functions/account-access/callerLimit.ts
    - apps/supabase/supabase/functions/account-access/callerLimit.test.ts
    - .planning/workstreams/deployment/phases/188-relay-on-the-deployed-stack-and-the-per-caller-limit/evidence/188-05-local-limit.md
    - .planning/workstreams/deployment/phases/188-relay-on-the-deployed-stack-and-the-per-caller-limit/deferred-items.md
  modified:
    - apps/supabase/supabase/functions/account-access/index.ts
    - apps/supabase/supabase/functions/account-access/contract.ts
    - apps/supabase/supabase/functions/account-access/contract.test.ts
    - apps/supabase/supabase/functions/account-access/flowConformance.test.ts
    - apps/docs/src/routes/(content)/developers-guide/backend/authentication/+page.md
    - apps/docs/src/routes/(content)/developers-guide/deployment/+page.md
    - apps/docs/src/routes/(content)/developers-guide/backend/edge-functions/+page.md
decisions:
  - "The caller take fails closed: an RPC error answers 500 internal, and a call is never admitted silently"
  - "answer() takes optional extra headers, so the 429 reuses it and the handler still serialises in one place"
  - "code-sign-in stays inside the take as E-02 decided. That it is called from the frontend server, so its bucket is likely the server's address, is recorded as a pre-launch risk and as an operator decision before 188-10"
metrics:
  duration: 46min
  completed: 2026-11-18
  tasks: 2
  files: 12
estimate:
  tokens: 85000
  tasks: 2
actuals:
  tokens: 6930
  tasks: 2
  commits: 4
plan_head_before: 461d8558eec5388c658b1cb8c2fd82d1bd645516
plan_head_after: 7dcf7cc2d1231265be48047bb29de65c6d94d6bf
---

# Phase 188 Plan 05: The per-caller limit, function half, Summary

`account-access` reads `cf-connecting-ip` through `callerAddress(req.headers)`. After the request is parsed and the witness admitted, it calls `invitation_caller_take` once, before the first operation branch, for every operation but `confirm-address`. A caller over the limit gets HTTP 429 `{ "error": "too-many-requests" }` with `Retry-After`, the same answer from each of the four anonymous operations. A failed take gets 500 `internal`. On the local stack one caller was limited at the 31st call, and another caller, and a call with no header, were not.

## Local proof (evidence/188-05-local-limit.md)

```
LOCAL_200_COUNT=30
LOCAL_31ST_STATUS=429
LOCAL_RETRY_AFTER_PRESENT=yes
LOCAL_OTHER_CALLER_STATUS=200
LOCAL_NO_HEADER_STATUS=200
LOCAL_CALLER_ROWS=2
LOCAL_GATEWAY_FORWARDS_HEADER=yes
LOCAL_CALLER_ROWS_AFTER=0
```

- The local gateway forwards a client-sent `cf-connecting-ip` to `/functions/v1`, so assumption A7 holds. Locally `behind_cloudflare` is `t`, as `seed.sql` sets it.
- Call 31 answered `Retry-After: 600`. Right after it, `request-link`, `request-recovery` and `code-sign-in` from the same address each answered 429 with `Retry-After: 589`, and the row went from 31 to 34. `confirm-address`, with no signed-in token, answered 401 and took no slot.
- An earlier loop never sent its no-header call because of a bash 3.2 `set -u` empty-array error in the script. Its rows were deleted and the loop was run again from zero. The named lines come from the second loop only.

## The two amended pins

1. **Request read** (`the origin of the link`): the read set stays `['headers', 'json', 'method']`. `count(CODE, 'req.headers')` went from **1 to 2**, and the pin now also asserts `count(CODE, 'callerAddress(req.headers)') === 1`. Its title now names the caller's address beside the Authorization.
2. **Project scoping** (`the project`): `p_project_id` passes went from **7 to 8**, all still `request.projectId` or `projectId`. The plan did not name this pin (see Deviations).

The origin-header pin and the two-header-read pin (`['response:location', 'req:Authorization']`) are unchanged. `callerAddress` reads `headers.get(CALLER_ADDRESS_HEADER)` inside `callerLimit.ts`, so `index.ts` holds no new `.headers.get('…')`. The log pins, the `JSON.stringify` count of 3, the module-level-constant pin and the uniform-answer pins of both link branches are unchanged and pass.

New pins (`describe('the per-caller limit')`, 6 cases):
- `'invitation_caller_take'` appears once, after `Deno.serve(`, `parseAccountAccessRequest(body)` and `admitWitness(parsed,`, before the first `request.operation ===`, with no `return` between the witness and the take.
- The take sits under the one `request.operation !==` condition, `!== 'confirm-address'`. All five branches come after it, and the `confirm-address` branch does not contain the take.
- The take passes `p_project_id: request.projectId` and `p_address: callerAddress(req.headers)`. `callerAddress(` and `p_address` each appear once, the address is never assigned to a variable, and `index.ts` never names `cf-connecting-ip` or `CALLER_ADDRESS_HEADER`.
- It fails closed: `if (error) { log('the caller limit could not be read', describeFailure(error)); return answer(INTERNAL_ERROR_BODY, 500); }`.
- A refusal returns `tooManyRequests(seconds)`, which is `answer(TOO_MANY_REQUESTS_BODY, 429, { 'Retry-After': String(seconds) })`, with the CORS headers and `Content-Type` spread in `answer`.
- No log call's arguments mention `req`, `headers`, `callerAddress`, `retryAfter` or `seconds`.

## Tests and gates

- `yarn workspace @openvaa/supabase test:unit account-access`: 8 files, 787 tests passed, including `callerLimit.test.ts` (22), `contract.test.ts` and `flowConformance.test.ts`. RED first: 10 failed and 1 file failed to import before the implementation.
- `yarn assert:edge-function-env`: 0 violations. `yarn assert:comment-hygiene`: 0 violations. `yarn workspace @openvaa/supabase typecheck` (`deno check .`): exit 0. Prettier passed on the function and the three docs pages.
- Task 1 was a tracer and auto mode was active. Its `<verify>` was re-run end to end before Task 2 and passed.

## E2E (targeted, against last full run 187-28-close, 729/0)

| Run | Result |
| --- | --- |
| `188-05-invitation-contract-20261118T182838Z` | wrapper 0; 18 passed (invitation-contract 16) |
| `188-05-invitation-landing-20261118T182838Z` | wrapper 0; 10 passed (invitation-landing 8) |
| `188-05-contestant-identity-provider-20261118T182838Z` | **wrapper 1**; 237 passed, 2 failed, 375 did not run (see below) |
| `188-05-contestant-identity-provider-r2-20261118T183748Z` | wrapper 0; **614 passed, 0 failed, 0 flaky** |

The contestant-identity-provider run pulls in every other project that drives `account-access`: contestant-entry-scan 38, contestant-entry-phone 24, contestant-a11y-scan 34, admin-account-flows 22, contestant-email-registration 16, contestant-code-registration 6, contestant-password-recovery 6, contestant-journey 3, perm-localisation-positive 2, contestant-terms-gate-phone 2, and the identity-provider spec 42. **Test-count deltas against 187-28-close: none**, for every project in the three green runs. No title changed.

**The red first run.** `admin-account-flows` and `contestant-password-recovery` each lost one test to a 90 s timeout on the forgot-password submit button, which stays disabled until the screen mounts. The two traces show Chrome aborting every module request of the page with `net::ERR_NETWORK_CHANGED` at 18:31:17Z and 18:31:35Z. The dev server logged 18 `Failed to fetch dynamically imported module` lines, all at those two moments. The frontend tree is the one 188-01 ran green, and `account-access` answered every request it got. What changed the host's network was not found: `log show` returned nothing for the window. The run is recorded as a failure, because it carries no VOID marker. The re-run on the same tree is green. Root cause and the open question for the wrapper are in `deferred-items.md` § 1.

## Commits

| Task | Commit | Message |
| --- | --- | --- |
| 1 (RED) | 7377a5384 | test(188-05): the per-caller limit's header read, its 429 body and the take's pins |
| 1 (GREEN) | 4d90cd05b | feat(188-05): account-access takes a caller slot before any anonymous operation |
| 2 | e88c8b1fa | docs(188-05): the per-caller limit, its trust rule, its 429 and what it stores |
| 2 (follow-up) | 7dcf7cc2d | docs(188-05): the code sign-in reaches the limit from the frontend server |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] The project-scoping pin counted seven `p_project_id` passes**
- **Found during:** Task 1 (RED).
- **Issue:** the take is an eighth database call that names the request's project, so `passes the request's project to every database function that takes one` would go red. The plan named only the request-read pin.
- **Fix:** 7 became 8. The rule that every value is `request.projectId` or `projectId` still holds.
- **Commit:** 7377a5384

**2. [Rule 3 - Blocking] The log pin admits `describeFailure(error)` only**
- **Issue:** research Pattern 5 sketched `takeError`, which the log pin's regex rejects.
- **Fix:** the take destructures `{ data: retryAfter, error }`, so the log pin is unchanged.
- **Commit:** 4d90cd05b

**3. [Rule 2 - Correctness] A false premise about who calls `code-sign-in`**
- **Found during:** Task 2, checking which caller address each operation carries.
- **Issue:** `routes/contestant/register/sign-in/+page.server.ts` calls `code-sign-in` from the frontend server, not the browser. On a deployment its caller address is therefore likely the server's, which would put every code sign-in into one bucket per server. 188-DISCUSSION-POINTS.md says the frontend server is in the path of none of the four operations.
- **Fix:** the design was not changed, because E-02 and E-03 are operator decisions. The authentication docs now list it as a pre-launch risk under Known residuals, the deployment section links to it, and `deferred-items.md` § 2 sets out the three options for the operator to choose from before 188-10.
- **Commit:** 7dcf7cc2d

### E2E

Three targeted runs and one re-run, as above. The re-run is a second data point taken while diagnosing the red run, not a retry until green. The red run's cause is recorded.

## Known Stubs

None.

## Threat Flags

| Flag | File | Description |
|------|------|-------------|
| threat_flag: availability | apps/frontend/src/routes/contestant/register/sign-in/+page.server.ts | `code-sign-in` reaches the per-caller take from the frontend server, so on a deployment every code sign-in likely shares the server's bucket (not in the plan's threat model; UNCONFIRMED on hosted) |

## Self-Check: PASSED

- FOUND: callerLimit.ts, callerLimit.test.ts, evidence/188-05-local-limit.md, deferred-items.md, the three docs pages
- FOUND in HEAD: 7377a5384, 4d90cd05b, e88c8b1fa, 7dcf7cc2d
