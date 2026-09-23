---
phase: 155-edge-function-hardening-env-jwt-provider-identity
plan: 02
subsystem: supabase-edge-functions
tags: [security, jwt, base64url, env-defaults, negative-control, edge-functions, non-disclosure]
status: complete

requires:
  - apps/supabase/vitest.config.ts collecting supabase/functions/**/*.test.ts (proven by 155-01)
  - the URL-import-free sibling-module pattern established by 155-01
provides:
  - decodeJwtSegment — the canonical base64url JWT segment decoder, copied verbatim by Plan 04
  - requireEnv — the canonical required-environment-variable helper, copied verbatim by Plans 03 and 04
  - a permanent in-suite negative control on a fixture that genuinely carries a base64url-only character
  - invite-candidate's outer catch brought to the identity-callback non-disclosure convention
affects:
  - apps/supabase/supabase/functions/invite-candidate (admin-authorisation decode, SITE_URL now mandatory, error body now opaque)

tech-stack:
  added: []
  patterns:
    - env read at the boundary, validation in a pure sibling module (inherited from 155-01)
    - negative control kept as a permanent in-test assertion that guards its own fixture premise first
    - duplication-by-deployment-unit recorded in the module docstring rather than left for a reader to infer

key-files:
  created:
    - apps/supabase/supabase/functions/invite-candidate/jwtSegment.ts
    - apps/supabase/supabase/functions/invite-candidate/jwtSegment.test.ts
    - apps/supabase/supabase/functions/invite-candidate/envConfig.ts
    - apps/supabase/supabase/functions/invite-candidate/envConfig.test.ts
  modified:
    - apps/supabase/supabase/functions/invite-candidate/index.ts

key-decisions:
  - The negative control is built on the base64url ALPHABET, not on stripped padding, because measurement shows the platform decoder accepts unpadded input at every length class a real JWT segment can produce.
  - The fixture premise is asserted as a real expectation before the negative control fires, so the control cannot silently degrade into a tautology.
  - requireEnv treats undefined and the empty string as missing and returns every other string unchanged, so a legitimate '0' or 'false' is never swallowed by a truthiness test.
  - invite-candidate's outer catch was changed to log and return a fixed opaque response, because the plan's premise that it already did so was false and the new throw names an environment variable.
  - The two static no-Deno-reference criteria were reported as unsatisfiable and proven by two flip-tested alternate routes rather than satisfied by trimming the docstring that states the contract.

requirements-completed: []

coverage:
  - deliverable: "invite-candidate decodes a base64url JWT segment that the previous expression rejects"
    human_judgment: false
    verification:
      - kind: test
        ref: "apps/supabase/supabase/functions/invite-candidate/jwtSegment.test.ts#decodes a segment that the previous base64 expression rejects"
        status: pass
      - kind: test
        ref: "apps/supabase/supabase/functions/invite-candidate/jwtSegment.test.ts#preserves the authorisation claim the decode feeds"
        status: pass
      - kind: command
        ref: "yarn workspace @openvaa/supabase test:unit — 37/37 (was 26/26)"
        status: pass
  - deliverable: "The negative control is load-bearing: the fixture genuinely carries a base64url-only character, and the old expression is observed failing on it"
    human_judgment: false
    verification:
      - kind: command
        ref: "fixture premise measured before use: segment ...LCJtYXJrZXIiOiJ-fn4ifQ contains '-'; atob() on it THREW DOMException 'Invalid character'; both halves recorded in /private/tmp/gsd-155-02/red-before-module.log and green-task1.log"
        status: pass
  - deliverable: "A non-ASCII claim value survives the decode as UTF-8 rather than as latin1 mojibake"
    human_judgment: false
    verification:
      - kind: test
        ref: "apps/supabase/supabase/functions/invite-candidate/jwtSegment.test.ts#round-trips a non-ASCII claim value as UTF-8 rather than as latin1"
        status: pass
  - deliverable: "An unset SITE_URL throws naming SITE_URL instead of addressing invite links at the Supabase API host"
    human_judgment: false
    verification:
      - kind: test
        ref: "apps/supabase/supabase/functions/invite-candidate/envConfig.test.ts#requireEnv"
        status: pass
      - kind: command
        ref: "offline before/after with SITE_URL genuinely unset: OLD redirectTo https://abcdefgh.supabase.co/candidate/complete-registration with no error raised; NEW THREW ERR_ENV_UNCONFIGURED. Log /private/tmp/gsd-155-02/site-url-before-after.log"
        status: pass
  - deliverable: "requireEnv's missing-value set is exactly {undefined, ''} and its message names the variable and nothing else"
    human_judgment: false
    verification:
      - kind: test
        ref: "apps/supabase/supabase/functions/invite-candidate/envConfig.test.ts#returns values that merely read as falsy, because only undefined and the empty string are missing"
        status: pass
      - kind: test
        ref: "apps/supabase/supabase/functions/invite-candidate/envConfig.test.ts#names the variable and nothing else, so the message carries no value, host or URL"
        status: pass
  - deliverable: "The deployed Deno function behaves as the Node tests show"
    human_judgment: true
    rationale: "Both modules are pure and Deno-global-free, so their vitest results transfer by construction, and RESEARCH assumption A1 (Deno's atob is the same WHATWG forgiving-base64 algorithm) holds in the direction that matters — base64url is not base64 under any implementation, and the fix pads unconditionally so it is correct under either padding behaviour. What is NOT proven here is a served run: deno is not installed in this tree and no suite invokes the deployed function. A local `supabase functions serve invite-candidate` exercising an admin invite would close it."

metrics:
  duration: 15 min
  completed: 2026-08-29
  tasks: 2
  files: 5
  commits: 4

actuals:
  tokens: 5891
  tasks: 2
  commits: 4
---

# Phase 155 Plan 02: base64url Segment Decode and Mandatory SITE_URL Summary

`invite-candidate` now decodes its admin-authorisation JWT segment as base64url UTF-8 and refuses to
run with an unset `SITE_URL`, with the pre-fix expression observed throwing on the same fixture the
fixed one parses — and a third defect found by measurement along the way: the function's outer catch
was publishing raw error text to the caller, so the plan's own non-disclosure invariant would have
been broken by the change the plan asked for.

## Accomplishments

- **`jwtSegment.ts`** — canonical `decodeJwtSegment(segment)`: translate the two base64url-only
  characters, pad to a multiple of four, decode, then `TextDecoder`. The docstring carries both
  measured corrections that contradict the wording the fix was requested with — that it is the
  ALPHABET that breaks rather than the padding, and that the defect is latent (0 of 2205 realistic
  payloads) rather than a live outage — so a future reader cannot re-derive them wrongly.
- **`jwtSegment.test.ts`** — 6 tests. The round-trip case asserts its own fixture premise
  (`expect(/[-_]/.test(ADMIN_SEGMENT), 'fixture must actually exercise the base64url alphabet')`)
  **before** the negative control fires, so the control cannot become a tautology; the negative
  control (`JSON.parse(atob(segment))` throws) is permanent. Also covers the authorisation claim the
  decode feeds, UTF-8 versus latin1, the padding no-op on an already-aligned segment, the empty
  segment, and a segment valid in neither alphabet.
- **`envConfig.ts`** — canonical `requireEnv(name, value)`, throwing `ERR_ENV_UNCONFIGURED` with a
  `variable` property. The two-parameter signature is explained in the docstring so a future reader
  does not "tidy" it into a one-parameter helper that would either be untestable or lose the name.
- **`envConfig.test.ts`** — 5 tests pinning both boundaries: `undefined` and `''` are both missing,
  while `'0'` and `'false'` are returned unchanged.
- **`invite-candidate/index.ts`** — three hunks. The decode goes through `decodeJwtSegment`; the
  `SITE_URL` read goes through `requireEnv` and no longer falls back to the API host; the outer catch
  logs and returns a fixed opaque response instead of echoing `err.message`.
- **Both duplicated modules record their duplication as a decision** in the docstring, naming the
  sibling directories and the guard (`scripts/assert-edge-env-defaults.mjs`, Plan 05) that will hold
  the copies byte-identical.

## Task / Commit Ledger

| Task | Gate | Commit | Files |
|---|---|---|---|
| 1 | RED | `eb6b4fa6d` | `jwtSegment.test.ts` |
| 1 | GREEN | `0bdfab19f` | `jwtSegment.ts`, `jwtSegment.test.ts`, `index.ts` |
| 2 | RED | `f53f324d3` | `envConfig.test.ts` |
| 2 | GREEN | `6b2a6ec21` | `envConfig.ts`, `index.ts` |

## The negative control, both halves, on a fixture that can actually distinguish them

The success criterion this plan was given is that the control uses a token whose segments **genuinely
contain** `-` or `_`. That was measured, not assumed, before the control was written:

| | Value |
|---|---|
| Payload | `{"user_roles":[{"role":"super_admin","scope_type":"project","scope_id":"proj-1"}],"marker":"~~~"}` |
| Segment | `eyJ1c2VyX3JvbGVzIjpbeyJyb2xlIjoic3VwZXJfYWRtaW4i…LCJtYXJrZXIiOiJ-fn4ifQ` |
| Contains a base64url-only character | **true** (`-` present; guarded in-test) |

| Half | HEAD | Result | Log |
|---|---|---|---|
| BEFORE | `4129694c2` (pre-plan) | suite could not collect (`Cannot find module './jwtSegment'`); the permanent assertion that `JSON.parse(atob(segment))` **THROWS** was already written | `/private/tmp/gsd-155-02/red-before-module.log` |
| AFTER | `6b2a6ec21` | `Tests 37 passed (37)`; the same segment parses to the original payload, `user_roles` intact | `/private/tmp/gsd-155-02/green-task2.log` |

The independent confirmation that the fixture distinguishes the two implementations:
`atob()` on that segment threw `DOMException: Invalid character`, while the fixed decoder round-tripped
it. A payload chosen without the `~~~` marker produces no such character (measured 0 of 2205 in
RESEARCH), which is exactly why the premise guard is an assertion rather than a comment.

For the `SITE_URL` half, the before/after was reproduced offline with the variable genuinely unset:

```
OLD  redirectTo: https://abcdefgh.supabase.co/candidate/complete-registration
OLD  outcome   : no error raised; the invite email addresses the API origin, not the site origin
NEW  outcome   : THREW ERR_ENV_UNCONFIGURED - Missing required environment variable: SITE_URL.
NEW  SITE_URL= : THREW ERR_ENV_UNCONFIGURED
```

Log: `/private/tmp/gsd-155-02/site-url-before-after.log`.

## Unsatisfiable criteria — reported, flip-tested, registered

Task 1 AC4 and Task 2 AC5 require `grep -cE "https://deno.land|https://esm.sh|Deno\."` over the new
modules to be **0**, while the same tasks' actions mandate reproducing `claimConfig.ts`'s docstring —
which **names** `Deno.env`, `Deno.serve` and `deno.land` in order to declare their absence. This is
the wall 155-01 hit at its own AC7 and explicitly predicted for this plan. Measured: `jwtSegment.ts`
scores 1, `envConfig.ts` scores 3, and the analog the plan itself names (`claimConfig.ts`) also
scores 1. The greps examine the sentence stating the contract, not a violation of it.

Not engineered around — no docstring was trimmed to make a grep pass. Proven by the two routes
155-01 established, each flip-tested by injecting a real `Deno.env.get` on a **code** line:

| Route | Baseline | After injection |
|---|---|---|
| A — same grep, non-comment lines only | `jwtSegment.ts` 0, `envConfig.ts` 0 | 1 and 1 |
| B — the module imports under plain Node in vitest, where no `Deno` global exists | 37/37 pass | `Deno is not defined` failures |

Logs: `/private/tmp/gsd-155-02/ac4-alternate-route-fliptest.log`,
`/private/tmp/gsd-155-02/ac5-envconfig-fliptest.log`. Both injections were reverted with
`git checkout --` **after** the work was committed, and `git diff --stat HEAD` confirmed clean.

**Distinction worth recording:** Task 1 AC2 (`grep -c 'atob' index.ts` is 0) looked like the same
wall and is **not**. My first draft of the call-site comment named `atob` while explaining the
change, scoring 1 — but that word is not load-bearing there, unlike the docstring's declaration of
absence. The comment was reworded and the criterion now genuinely passes at 0. A criterion is only
unsatisfiable when the thing it forbids is the thing the task requires; otherwise it is just a
criterion that has not been met yet.

## Corrections to inherited claims (measured, not assumed)

1. **The plan's Task 2 premise and threat row T-155-10 are both FALSE for this file.** The plan says
   the throw "is caught by the existing handler, which logs the real error and returns its fixed
   opaque response", and T-155-10 rates the disclosure risk `low` on that basis. Measured at the
   pre-fix HEAD, `invite-candidate`'s catch did the opposite of **both** halves: it did not log, and
   it returned `err.message` in the body. That description belongs to `identity-callback`. Left
   alone, `requireEnv`'s message would have published `Missing required environment variable:
   SITE_URL.` to the caller — the plan's own stated invariant broken by the change the plan asked
   for. Fixed under Rule 2; see Deviations.
2. **The plan's line citations for `index.ts` are accurate** — `:81` (decode) and `:131` (site-url)
   both matched. Recorded because the standing instruction is to distrust inherited line numbers:
   here the check passed, and saying so is worth as much as reporting a miss. Navigation was still
   by symbol.
3. **The comment-hygiene gate is live and this plan's comments pass it** — 1570 files scanned
   (up from 155-01's 1566; the four new files are covered), 0 violations. Its Rule 2 forbids
   hard-wrapped comment prose, which is why every docstring paragraph here is a single long line.
4. **The E2E `inviteUserByEmail` hits under `tests/` are name-matches, not call-matches** — see the
   E2E decision below. This is RESEARCH Pitfall 6's exact shape and was checked rather than inferred.

## Deviations from Plan

**1. [Rule 2 — Missing critical functionality] `invite-candidate`'s outer catch echoed raw error text to the caller**
- **Found during:** Task 2, while verifying the plan's stated non-disclosure premise rather than assuming it
- **Issue:** the catch built `const message = err instanceof Error ? err.message : 'Internal server error'`
  and returned it in the response body, with no logging. The plan required that the new throw's
  variable name "must not reach the HTTP response body"; without a change, it would have.
- **Fix:** the catch now `console.error`s the real error and returns a fixed `'Internal server error'`,
  matching `identity-callback`'s convention, with a comment recording why.
- **Files modified:** `apps/supabase/supabase/functions/invite-candidate/index.ts`
- **Verification:** `grep -n "err.message\|error: message" index.ts` returns nothing; the frontend
  caller is unaffected (`supabaseDataWriter.ts` wraps a supabase-js `FunctionsHttpError`, whose
  `.message` is the generic non-2xx string, not the body); `yarn test:unit` 25/25.
- **Commit:** `6b2a6ec21`

**2. [Rule 1 — Bug] My own test helper hardcoded one padding character where the fixture needed three**
- **Found during:** Task 1 GREEN
- **Issue:** the latin1-comparison line padded `NON_ASCII_SEGMENT` with a single `=`. That segment is
  29 characters, so `29 % 4 == 1` — the one length class `atob` rejects outright — and the test failed
  with `InvalidCharacterError` for a reason unrelated to what it was asserting.
- **Fix:** added a `padToFour` helper in the test with a comment saying it exists so the comparison
  isolates the encoding difference instead of tripping on padding.
- **Verification:** 37/37.
- **Commit:** `0bdfab19f`

**3. [Reported, not fixed] Task 1 AC4 and Task 2 AC5 unsatisfiable** — see above.

**Total deviations:** 2 auto-fixed (1 × Rule 2, 1 × Rule 1), 2 criteria reported with alternate proof.
**Impact:** no scope change. The Rule 2 fix was a prerequisite for an invariant the plan already stated.

## Out of scope, deliberately, and recorded

- **The non-null `Deno.env.get(...)!` reads** at the two `createClient` calls: the plan assigns this
  class to Plan 06. Untouched.
- **`payload.user_roles || []`**: a legitimate absent-claim default, not an environment default.
  Verified still present exactly once, as Task 2 AC4 requires.
- **Two explicit 500 branches still echo Supabase error text** via `details: candidateError?.message`
  and `details: inviteError?.message` — the same disclosure class as the catch I repaired, but
  pre-existing and caused by nothing in this diff. **Not fixed**, filed to `WINDOWS.md` as a `todo`
  so the catch-arm repair in the same file is not mistaken for closing the class.
- **The frontend/Deno provider-config divergence on `country`** stays with Plan 03, untouched.

## Verification

| Gate | Baseline | After |
|---|---|---|
| `yarn workspace @openvaa/supabase test:unit` | 26/26 | **37/37** (4 files) |
| `yarn test:unit` | 25/25 tasks | 25/25 tasks |
| `yarn build` | 14/14 | 14/14 |
| `yarn lint:check` | 22/22 | 22/22, exit 0 |
| `yarn format:check` | clean | clean |
| `yarn assert:comment-hygiene` | 0 / 1566 files | 0 / **1570** files |

Plan-level criterion "no environment-defaulting expression remains in `invite-candidate/index.ts`":
the guard predicate `grep -cE "Deno\.env\.get\(\s*['\"\`][^'\"\`]+['\"\`]\s*\)\s*(\?\?|\|\|)"` returns
**0**.

`yarn db:lint:sql` was not run: it is pre-existing red by construction (its failing half lints the
live database), and this plan touches no SQL.

## E2E decision — declined, on this diff's own measurement

Unlike 155-01's surface, `invite-candidate` is ordinary admin-gated app functionality, so "it is an
Edge Function, therefore the suite cannot reach it" would have been an assumption. It was checked:

1. **`functions.invoke` appears ZERO times anywhere under `tests/`.** No spec, setup, teardown or
   fixture invokes any Edge Function.
2. **The many `inviteUserByEmail` hits under `tests/` are Pitfall 6's name-match shape, not calls
   into the changed code.** `tests/tests/utils/supabaseAdminClient.ts` calls
   `this.client.auth.admin.inviteUserByEmail` **directly from the Node test process**, with its own
   locally-computed `redirectTo` (`SUPABASE_URL.replace('54321','5173')`). The Edge Function is never
   entered, and it does not supply that redirect.
3. **`preregisterWithApiToken`, the sole frontend caller of `invite-candidate`, is referenced only by
   its own interface and its own mocked unit test** — no route and no `.svelte` component calls it,
   so no UI path reaches the function.
4. The Deno function shares no module graph with SvelteKit.

The frontend-side contract **is** covered by `yarn test:unit` (`supabaseDataWriter.test.ts` mocks
`functions.invoke`), which ran green. **Still owed before ship**, and registered: no run has ever
exercised the *deployed* function, so both fixes rest on Node-side tests plus the offline before/after
rather than on a served Deno run.

**Operator note:** the repo-root `.env` does **not** set `SITE_URL` (`.env.example:113` does, added by
155-01), so a local `supabase functions serve invite-candidate` will now throw `ERR_ENV_UNCONFIGURED`
until `.env` is updated. That is the intended loud failure under decision D-D2, not a regression —
and it is precisely the `reversibility rating="costly"` the plan flagged, now concrete.

## Flagged assumption — status

The plan's `<flagged_assumptions>` block (the unclassified edge: a segment valid in neither alphabet)
is **addressed as the plan specified and no further**. `jwtSegment.test.ts` asserts only that such
input throws, using a stray `.` — the malformed-token shape the block names. Which error type is
thrown is still unspecified, and the caller treats any throw as an authorisation failure, so the
distinction remains non-load-bearing. Left open for the phase checker.

## Known Stubs

None. No placeholder values, no skipped tests, no unwired data paths, no `TODO`/`FIXME` introduced.

## Broken-windows entries filed (`.planning/WINDOWS.md`, 4)

| Kind | Subject |
|---|---|
| `deviation` | Task 1 AC4 / Task 2 AC5 unsatisfiable; two flip-tested routes; action for plans 03 and 04 |
| `deviation` | plan Task 2 premise + T-155-10 falsified — the catch echoed `err.message`; fixed under Rule 2 |
| `todo` | the two `details:` error-text leaks left unfixed as out-of-scope, handed to the non-disclosure owner |
| `unrun-verify` | no Playwright suite run; default suite proven unable to reach the changed code; a served-function run still owed |

## Threat Flags

None. Every surface this diff touches is covered by the plan's `<threat_model>`; no new network
endpoint, auth path, file access pattern or schema change is added. T-155-07, T-155-08, T-155-09 and
T-155-11 are mitigated as specified. **T-155-10 required correction rather than mitigation** — its
premise was false, and the disclosure it rated `low` was real until this plan closed it. T-155-SC
holds: this plan installs nothing.

## Requirements

`requirements-completed` is deliberately **empty**. `requirements.ready-ids` reports **0/2 ready**:
`REVIEW-EDGE-01` is also declared by Plan 04 and `REVIEW-EDGE-02` by Plans 01, 03, 04, 05 and 06, so
neither may read `Complete` until every declaring plan has produced a SUMMARY. This plan discharges
the whole of `REVIEW-EDGE-01`'s `invite-candidate` half and site 7 of `REVIEW-EDGE-02`'s seven.

## Next

Phase 155 Plan 03. It copies `envConfig.ts` from here verbatim, so it inherits the AC-grep wall
documented above — use route A's comment-excluding form. It also owns the `country` divergence 155-01
handed forward.

## Self-Check: PASSED

All 4 created files exist on disk; all 4 commit hashes resolve in `git log`; every task's acceptance
criteria re-run (2 reported unsatisfiable with flip-tested alternate routes, the rest pass); all
plan-level `<verification>` commands re-run and pass.
