---
phase: 155-edge-function-hardening-env-jwt-provider-identity
plan: 01
subsystem: supabase-edge-functions
tags: [security, jwt, oidc, fail-closed, negative-control, edge-functions]
status: complete

requires:
  - apps/supabase/vitest.config.ts already collecting supabase/functions/**/*.test.ts
  - jose reachable from apps/supabase
provides:
  - requireVerifyClaimBinding — the unconditional aud/iss guard every identity-callback verification path calls
  - VerifyClaimBinding — the non-optional two-field binding type
  - DEFAULT_TOKEN_OPTS — buildTestIdToken's iss/aud defaults, now exported so the bank-auth recipe cannot drift from the token it mints
  - 155-NEGATIVE-CONTROL-LEDGER.md — the phase's evidence record, format decided, row 3 complete
  - the URL-import-free sibling-module + vitest pattern, proven end to end for plans 02, 03 and 04
affects:
  - apps/supabase/supabase/functions/identity-callback (verifyJwt now throws on unconfigured aud/iss)
  - the opt-in PLAYWRIGHT_BANK_AUTH projects (their env recipe was repaired in the same plan)

tech-stack:
  added:
    - jose@^6.2.1 as a devDependency of @openvaa/supabase (declared, not newly installed — deduped onto the existing 6.2.1 hoist)
  patterns:
    - env read at the boundary, validation in a pure sibling module
    - guard placed on the path to the call it protects, so the binding is structural rather than positional
    - negative control kept as a permanent in-test assertion, not a one-off measurement

key-files:
  created:
    - apps/supabase/supabase/functions/identity-callback/verifyConfig.ts
    - apps/supabase/supabase/functions/identity-callback/verifyConfig.test.ts
    - .planning/phases/155-edge-function-hardening-env-jwt-provider-identity/155-NEGATIVE-CONTROL-LEDGER.md
  modified:
    - apps/supabase/supabase/functions/identity-callback/index.ts
    - apps/supabase/package.json
    - yarn.lock
    - .env.example
    - tests/IDURA-TEST-RUNBOOK.md
    - tests/tests/utils/buildTestIdToken.ts

key-decisions:
  - An empty-string jose verify option is not a disabled check but a check that passes everything, so both the absent and the empty case are treated as unconfigured and throw.
  - The guard is called on the path to jose.jwtVerify rather than beside a single env read, making the binding structural for every caller.
  - The phase records demonstrations in a ledger with one row per exercised criterion; a half is admissible only when this phase ran it.
  - The prefixed and un-prefixed env twins both stay, documented as deliberate rather than as redundancy awaiting consolidation.

requirements-completed: []

coverage:
  - deliverable: "identity-callback rejects a wrong-aud, wrong-iss token even when both env vars are unset"
    human_judgment: false
    verification:
      - kind: test
        ref: "apps/supabase/supabase/functions/identity-callback/verifyConfig.test.ts#requireVerifyClaimBinding"
        status: pass
      - kind: test
        ref: "apps/supabase/supabase/functions/identity-callback/verifyConfig.test.ts#is accepted under the pre-fix empty options object and rejected under the guard output"
        status: pass
      - kind: command
        ref: "yarn workspace @openvaa/supabase test:unit — 26/26 (was 20/20)"
        status: pass
  - deliverable: "The negative control is load-bearing: it fails when the fix is reverted and when the fixture stops carrying wrong claims"
    human_judgment: false
    verification:
      - kind: command
        ref: "flip A (module reverted) -> 2 failed; flip B (correct-claim fixture) -> premise guard fires. Log /var/folders/3p/10hbv0415234v3x5ctp50l4m0000gn/T/gsd-155-01/flip-tests.log"
        status: pass
  - deliverable: "identity-callback carries no prose arguing for the conditional binding, and its env docstring marks both variables required"
    human_judgment: false
    verification:
      - kind: command
        ref: "grep -c 'verifyOptions' -> 0; grep -c 'keeps its current behaviour' -> 0; grep -c 'checked when set' -> 0"
        status: pass
  - deliverable: "Every variable this phase makes mandatory is documented in .env.example"
    human_judgment: false
    verification:
      - kind: command
        ref: "git show HEAD:.env.example | grep -cE '^(IDENTITY_PROVIDER_TYPE|IDENTITY_PROVIDER_CLIENT_ID|DEFAULT_PROJECT_ID|SITE_URL|SMTP_HOST|SMTP_PORT|SMTP_FROM)=' -> 7"
        status: pass
  - deliverable: "Both Idura runbook recipes set every variable the Edge Function now requires"
    human_judgment: false
    verification:
      - kind: command
        ref: "Step E-1 run verbatim, then a real buildTestIdToken token decrypted and verified: 7-line recipe ACCEPTED, old 4-line recipe REJECTED [ERR_ISSUER_UNCONFIGURED]. Log /var/folders/3p/10hbv0415234v3x5ctp50l4m0000gn/T/gsd-155-01/eflow10-recipe-proof.log"
        status: pass
  - deliverable: "The deployed Deno function (jose@v5.9.6) behaves as the test (jose@6.2.1) shows"
    human_judgment: true
    rationale: "Layer 1, the pure guard, is version-independent and is the primary proof. Layer 2's presence-versus-value semantics were measured on v6 only; v5 equivalence rests on the todo's v5 source reading, not on a v5 run in this session. deno is not installed in this tree. A real PLAYWRIGHT_BANK_AUTH run against the served function would close it."

metrics:
  duration: 20 min
  completed: 2026-08-29
  tasks: 3
  files: 9
  commits: 4

actuals:
  tokens: 9005
  tasks: 3
  commits: 4
---

# Phase 155 Plan 01: Fail-Closed `aud`/`iss` Binding Summary

`identity-callback` now binds audience and issuer on every verification through a pure sibling
module, so a deployment that configured neither variable throws instead of accepting a token minted
by an attacker-controlled issuer for a different relying party — demonstrated by a wrong-party token
observed accepted under the old options shape and rejected under the new one, offline, in this repo.

## Accomplishments

- **`verifyConfig.ts`** — `VerifyClaimBinding` + `requireVerifyClaimBinding(clientId?, issuer?)`.
  Treats an absent value and an empty string alike as unconfigured, throws opaque messages carrying
  `ERR_AUDIENCE_UNCONFIGURED` / `ERR_ISSUER_UNCONFIGURED` — the same code strings the frontend
  verifier uses, so the two copies share their cheapest possible surface. No Deno references on any
  code line, so vitest reaches it.
- **`verifyConfig.test.ts`** — 6 tests in two layers. Layer 1 is the pure, version-independent guard.
  Layer 2 mints a real RS256 token with `iss: https://evil-idp.example` / `aud: some-other-clients-id`,
  guards the premise that those claims genuinely differ from the expected ones, records the token
  **resolving** under `jose.jwtVerify(jwt, publicKey, {})`, and requires
  `ERR_JWT_CLAIM_VALIDATION_FAILED` under the guard's output.
- **`verifyJwt` rewritten** — the conditionally-populated `verifyOptions` and both `if` branches are
  gone; one guard call sits on the path to `jose.jwtVerify`, so the binding is structural for every
  caller rather than positional. The multi-line comment that argued *for* the fail-open is deleted,
  not merely contradicted. The file-head env docstring no longer reads `(checked when set)`.
- **`jose` declared where it is used** — `apps/supabase` no longer resolves it only through the root
  hoist.
- **`.env.example`** — a 31-line un-prefixed Edge Function block covering all seven newly mandatory
  variables, headed by an explanation of why the prefixed and un-prefixed twins both exist.
- **`tests/IDURA-TEST-RUNBOOK.md`** — 4 hunks. Step 3's required list goes from 4-required-plus-2-optional
  to 7 required; Option B's sample uncomments `DEFAULT_PROJECT_ID` / `SITE_URL` and adds
  `IDENTITY_PROVIDER_ISSUER`; the `/tmp/eflow10.env` generator goes from 4 lines to 7 and now reads
  `iss`/`aud` from the builder's own exported defaults.
- **`155-NEGATIVE-CONTROL-LEDGER.md`** — the phase's evidence format, decided and opened. Row 3
  complete with per-half HEADs and resolvable absolute log paths; rows 1 and 2 reserved for `155-06`.

## Task / Commit Ledger

| Task | Name | Commit | Files |
|---|---|---|---|
| 1 (RED) | failing aud/iss test + jose devDep | `61bb8cb36` | `verifyConfig.test.ts`, `apps/supabase/package.json`, `yarn.lock` |
| 1 (GREEN) | `verifyConfig.ts` + `verifyJwt` rewrite | `869a01d60` | `verifyConfig.ts`, `identity-callback/index.ts` |
| 2 | env + runbook documentation | `636b4e7a2` | `.env.example`, `tests/IDURA-TEST-RUNBOOK.md`, `tests/tests/utils/buildTestIdToken.ts` |
| 3 | negative-control ledger | `7d6079426` | `155-NEGATIVE-CONTROL-LEDGER.md` |

## The accept-then-reject demonstration, both halves

| Half | HEAD | Result | Log |
|---|---|---|---|
| OLD | `8ebc3ebe4` | `Test Files 1 failed \| 1 passed`; new suite could not collect (`Cannot find module './verifyConfig'`). Substantive half: the permanent assertion that the wrong-party token **RESOLVES** under `{}` | `…/gsd-155-01/red-before-module.log` |
| NEW | `636b4e7a2` | `Tests 26 passed (26)`; the same token **REJECTED** with `ERR_JWT_CLAIM_VALIDATION_FAILED` | `…/gsd-155-01/new-half-at-committed-head.log` |

Both flips went red, so the control can fail: reverting the module to the pre-fix shape broke the
rejection assertion (2 failed), and re-minting the fixture with correct claims fired the premise
guard. Log `…/gsd-155-01/flip-tests.log`.

## Unsatisfiable criterion — reported, not engineered around

Task 1 acceptance criterion 7 required `grep -cE "https://deno.land|https://esm.sh|Deno\."` over
`verifyConfig.ts` to be **0**, while the same task's action mandated reproducing `claimConfig.ts`'s
docstring — which *names* `Deno.env`, `Deno.serve` and `deno.land` in order to declare their absence.
The analog the plan itself names, `claimConfig.ts`, scores **1** on the identical grep. The criterion
examines the sentence stating the contract, not a violation of it.

Proven by two named routes, both flip-tested by injecting a real `Deno.env.get`:

| Route | Baseline | After injection |
|---|---|---|
| A — same grep, non-comment lines only | 0 | 1 |
| B — the module imports under plain Node in vitest, where no `Deno` global exists | 26/26 | `ReferenceError: Deno is not defined` |

Registered in `.planning/WINDOWS.md`. **Plans 02, 03 and 04 will hit the same wall** — their
`envConfig.ts` / `jwtSegment.ts` / `templateVars.ts` modules carry the same docstring.

## Pair-divergence check (required, recorded either way)

| Pair | Verdict |
|---|---|
| ID-token verifier: `decryptAndVerifyIdToken.ts` vs `identity-callback` | **Converged on `aud`/`iss` by this plan** — both now throw the same two code strings. **Still divergent elsewhere:** the Deno copy has no `ERR_JWKS_EMPTY` / `ERR_JWK_KID_MISMATCH` / `ERR_JWKS_MALFORMED`; its kid-miss throw is uncoded and its empty-JWKS case is not distinguished. Out of scope — the fourth-verifier-copy todo stays filed. |
| Non-disclosure bar | **Not diverged.** Both sides keep messages off the wire. |
| Provider claim config: `authConfig.ts` vs `claimConfig.ts` | **RE-DIVERGED.** Security half agrees (`identityMatchProp: 'sub'` both sides, both providers). Metadata half differs: frontend `IDURA` `extractClaims` is `['birthdate','hetu','country']`, the Deno copy `['birthdate','hetu']` — missing `country`. Not fixed here; handed to Plan 03. |

## Corrections to inherited claims (measured, not assumed)

1. **The prior review's CR-02 is stale.** It reported that `identity-callback` echoes jose's error
   text, including the incoming `kid`, to unauthenticated callers at `:208,224,241,393`. Re-measured:
   every catch arm logs and returns a fixed opaque string (`Token verification failed`,
   `Token decryption failed`, `Internal server error`), each with an explicit comment saying so. The
   `kid` appears only in a thrown message that is caught and never returned. The cited line numbers
   are also stale. **No error oracle exists on this tree.**
2. **CR-03's birthdate-collision claim is stale** — Signicat has been keyed on `sub` since Phase 142.1.
3. **RESEARCH Pitfall 7 and the plan's D-N1 note are stale.** Both state that Phase 152's comment scan
   has not executed and is not a link of `lint:check`. It is: root `lint:check` now ends
   `&& yarn assert:comment-hygiene`, which reports *files scanned: 1566; rules live: 2 of 2;
   0 violation(s)*. The gate is live, it does gate this phase, and it does **not** forbid `--` as an
   em dash. This plan's comments pass it.
4. **Threat-model entry T-155-SC is falsified in one half.** It claims `jose` is already in the
   lockfile and no registry fetch occurs. The plan's literal command resolved **`jose@6.2.10`**, a
   version not previously present, adding a second lockfile descriptor and a private copy under
   `apps/supabase/node_modules`. Corrected by pinning to `^6.2.1`, the range the two existing
   consumers declare, which dedupes onto the audited copy. Same package and maintainer, so not a
   supply-chain event; the false half is "no new fetch".
5. **`DEFAULT_SEED_PROJECT_ID` is at `:30`, not `:31`** as CONTEXT fact 27 states. Every pre-Phase-152
   line number in this phase's documents is treated as stale; navigation was by symbol throughout.

## Deviations from Plan

**1. [Rule 3 — Blocking] `DEFAULT_OPTS` was not exported, so the plan's Step E-1 instruction was unexecutable**
- **Found during:** Task 2
- **Issue:** the plan says to read `iss`/`aud` from `buildTestIdToken.ts`'s *exported* defaults rather
  than retyping them. `const DEFAULT_OPTS` was module-private.
- **Fix:** exported it as `DEFAULT_TOKEN_OPTS` with a docstring explaining why it is now public, and
  updated its one internal reference. `tests/tests/utils/buildTestIdToken.ts` was not in the plan's
  file list.
- **Verification:** `typecheck:tests` clean; `eslint --flag v10_config_lookup_from_file tests` 0 errors;
  `tests` vitest 21/21 including `buildTestIdToken.test.ts` 4/4; Step E-1 executes.
- **Commit:** `636b4e7a2`

**2. [Rule 3 — Blocking] `yarn add -D jose` pulled a new version**
- **Found during:** Task 1
- **Issue:** resolved `jose@6.2.10`, splitting the tree across two versions.
- **Fix:** re-ran with `jose@^6.2.1`. Verified one `jose@npm` descriptor in `yarn.lock`, root copy at
  6.2.1, no `apps/supabase`-local copy.
- **Commit:** `61bb8cb36`

**3. [Reported, not fixed] Task 1 acceptance criterion 7 unsatisfiable** — see above.

**Total deviations:** 2 auto-fixed (both Rule 3), 1 criterion reported with alternate proof.
**Impact:** no scope change; both fixes were prerequisites for instructions the plan already gave.

## Verification

| Gate | Baseline | After |
|---|---|---|
| `yarn workspace @openvaa/supabase test:unit` | 20/20 | **26/26** |
| `yarn test:unit` | 25/25 tasks | 25/25 tasks |
| `yarn build` | 14/14 | 14/14 |
| `yarn format:check` | clean | clean |
| `yarn assert:comment-hygiene` | — | 0 violations / 1566 files |
| `eslint --flag v10_config_lookup_from_file tests` | — | 0 errors, 2 pre-existing warnings in untouched files |
| `yarn typecheck:tests` | — | clean |

`yarn db:lint:sql` was not run: it is pre-existing red by construction (its failing half lints the
live database and reads no working-tree file), and this plan touches no SQL.

## E2E decision — declined for the default suite, on this diff's own proof

**Default `yarn test:e2e` was NOT run, and that is correct here.** Measured, not argued:

1. The only runtime artifact changed is the Deno Edge Function. It shares no module graph with the
   SvelteKit app, so nothing the default suite loads is affected.
2. Every spec, setup, teardown and fixture referencing `identity-callback`
   (`candidate-bank-auth.spec.ts`, `candidate-bank-auth-journey.spec.ts`,
   `bank-auth-journey.setup.ts`/`.teardown.ts`) sits in a project gated on `PLAYWRIGHT_BANK_AUTH`.
   The default run selects none.
3. The one non-spec reference, `tests/utils/supabaseAdminClient.ts`, is **docstring prose, not
   `functions.invoke`** — checked rather than inferred, because this is exactly the shape RESEARCH's
   Pitfall 6 warns about.
4. The default run never even *serves* the function; bank-auth requires the manual
   `supabase functions serve --no-verify-jwt --env-file` step.
5. The remaining files are a devDependency line, a template read by nobody at runtime, and Markdown.

**The opt-in suite IS affected** — and this plan would have broken it, which is why Task 2 exists.
Rather than leave that on an argument, the repaired recipe was executed: Step E-1 verbatim, then a
real `buildTestIdToken` token through the full JWE-decrypt → JWT-verify path. Corrected 7-line recipe
**ACCEPTED**; previous 4-line recipe **REJECTED [ERR_ISSUER_UNCONFIGURED]**. A real
`PLAYWRIGHT_BANK_AUTH=1` run is still owed and is registered as an open window.

## Known Stubs

None. No placeholder values, no skipped tests, no unwired data paths.

## Broken-windows entries filed (`.planning/WINDOWS.md`, 5)

| Kind | Subject |
|---|---|
| `unrun-verify` | the opt-in `PLAYWRIGHT_BANK_AUTH` projects were not executed; proven offline instead |
| `deviation` | Task 1 AC7 unsatisfiable; two named flip-tested routes; action for plans 02/03/04 |
| `deviation` | frontend/Deno provider-config pair re-diverged on `country`; handed to Plan 03 |
| `deviation` | T-155-SC's "no new registry fetch" falsified; `jose` pinned to `^6.2.1` |
| `deviation` | RESEARCH Pitfall 7 / D-N1 stale — the comment-hygiene gate IS live |

## Threat Flags

None. The plan's `<threat_model>` covers every surface this diff touches, and the diff adds no new
network endpoint, auth path, file access pattern or schema change. T-155-01 through T-155-04 are
mitigated as specified; T-155-06 is the accepted, intended loud failure; T-155-SC's supply-chain
premise was corrected as recorded above.

## Requirements

`requirements-completed` is deliberately **empty**. `REVIEW-EDGE-02` is also declared by plans 02, 03,
04, 05 and 06, and `REVIEW-EDGE-05` by plan 06; the shared-ID gate reports `0/2 ready`, which is
correct — neither may read `Complete` until every declaring plan has produced a SUMMARY. This plan
discharges the whole of `REVIEW-EDGE-05`'s code half and the documentation half of `REVIEW-EDGE-02`.

## Flagged assumption carried forward

The plan's `<flagged_assumptions>` block is **not** discharged here: this plan adds no explicit test
for a token carrying *no* `aud`/`iss` claim at all. jose treats a missing claim as a validation
failure once the option is supplied, so rejection is expected, but it is not asserted. Left open for
the phase checker, as the plan intended.

## Next

Phase 155 Plan 02. This plan is the phase tracer and its architecture held end to end: the
URL-import-free sibling module, the vitest file beside the Edge Function with zero config change, the
Deno-side `.ts`-suffixed import, and the recorded negative control are all proven and ready to be
copied by plans 02, 03 and 04 — with the AC7 correction above applied to their static criteria.

## Self-Check: PASSED

All 3 created files exist on disk; all 4 commit hashes resolve in `git log`; every task's acceptance
criteria re-run and pass; all plan-level `<verification>` commands re-run and pass.
