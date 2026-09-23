---
phase: 142-assertion-design-wiring-only-tests-assert-output
plan: 04
subsystem: auth
tags: [vitest, negative-control, assertion-design, oidc, sveltekit, product-change, checkpoint, scope-expansion]

# Dependency graph
requires:
  - phase: 139-single-source-sweep-findings-confirm-or-withdraw
    provides: 'The F20-1 injections A and B (§ 5.10.2), the F20-3 injections A and B (§ 5.12.2), the recorded OLD-half greens (§ 5.10.4 / § 5.12.4), and the prohibitions R-7 / R-9 (§ 8.3)'
  - phase: 142-assertion-design-wiring-only-tests-assert-output
    plan: 01
    provides: 'The pre-fix tree this plan measured its OLD halves against; the `git checkout HEAD --` restore trap, which this plan hit exactly as predicted and handled'
provides:
  - 'D-02 + A-02 landed: three endpoints (authorize, token, cache) re-throw framework HTTP errors from the head of their catch arms, so each endpoint''s own 4xx contract survives its own catch'
  - 'A-07 landed: `getIdTokenClaims` distinguishes the empty-JWK-set and kid-mismatch incidents by opaque code through its existing catch branch'
  - 'A fourth product change: `defaultOptions.privateEncryptionJWKSet` is parsed lazily on read, so a malformed env var is catchable and coded rather than an uncatchable import-time crash'
  - 'F20-1 ledger row 7 closed with the A-03 injection INVERSION confirmed by measurement — both `[DERIVED]` predictions held'
  - 'F20-3 ledger row 9 closed, with a measured DIVERGENCE: 139''s injection A is zero-delta on both sites, so the on-axis controls are two relocated injections instead'
  - 'Zero `pending` cells remain in the phase ledger — all twelve findings resolved'
  - 'Operator-approved scope expansion recorded: three file-don''t-fix items were fixed and their todos closed; A-10 explicitly superseded'
affects: [142-06]

actuals:
  tokens: 96000
  tasks: 4
  commits: 5

tech-stack:
  added: []
  patterns:
    - 'A catch arm that returns a generic 5xx must re-throw framework HTTP errors FIRST, or the handler''s own 4xx guards are unreachable from outside — `error()` throws, so an in-`try` `error(400, …)` is caught by its own function'
    - 'Prefer the framework''s own predicate (`isHttpError`) over an in-tree duck-type analog when the analog tests a property the target type lacks — copying the sibling route''s `''location'' in e` form verbatim would have been a silent no-op'
    - 'Defer an env-var parse to a getter when it would otherwise run at module-evaluation time: the throw then lands inside the consumer''s try and can carry the same discriminant as every other failure on that path'
    - 'An injection is only a negative control if it changes something the ASSERTION UNDER TEST observes. F20-3''s injection A changes the success return, which neither error-handling fixture can reach — zero delta, and its green proves nothing'
    - 'When one branch''s control goes off-axis, add the SYMMETRIC relocation at the sibling branch rather than accepting one unproven assertion: each site red under its own branch and green under the other''s is strictly stronger than one red'
    - '`expect.soft` NOT used — a fifth consecutive wave. Each strengthened assertion here is a single `toMatchObject` on one value, so there is no independent-failure axis to soften'

key-files:
  created: []
  modified:
    - apps/frontend/src/routes/api/oidc/authorize/+server.ts
    - apps/frontend/src/routes/api/oidc/token/+server.ts
    - apps/frontend/src/routes/api/cache/+server.ts
    - apps/frontend/src/lib/api/utils/auth/getIdTokenClaims.ts
    - apps/frontend/src/lib/api/utils/auth/__tests__/authorize-endpoint.test.ts
    - apps/frontend/src/lib/api/utils/auth/getIdTokenClaims.test.ts
    - tests/playwright.config.ts
    - .planning/phases/142-assertion-design-wiring-only-tests-assert-output/142-NEGATIVE-CONTROL-LEDGER.md
    - .planning/phases/142-assertion-design-wiring-only-tests-assert-output/deferred-items.md
    - .planning/WINDOWS.md

key-decisions:
  - "F20-3's injection A was measured ZERO-DELTA on both sites and recorded as NOT the negative control, rather than being reported as the predicted red. Both fixtures throw before the injected success return is reachable, so the sites still received their correct codes and passed. Recording that green as the control would have been exactly the proves-nothing control § 8.3 exists to prevent"
  - "Rather than accept one site without an on-axis control, a SYMMETRIC relocated injection (B′) was added at the empty-set throw. Each site now reds alone under its own branch's regression and stays green under the other's — which proves the two branches are genuinely discriminated, not merely that one of them is"
  - "The strengthened assertions' PRE-FIX colour was MEASURED, not cited: product source rolled back to a552e78b1 with tests at HEAD, giving `HttpError { status: 500 }` against expected 400 and `error: {}` against both expected codes. The plan asserts this red but never scheduled the measurement"
  - "The fourth product change used a GETTER rather than any change to `defaultOptions`' shape or call contract, so the operator's stop-condition was not triggered. Verified by measurement: `defaultOptions` has zero consumers outside this file's own default parameter, and the property's type improves from `any` to `Array<jose.JWK>`"
  - "`isHttpError` was used rather than the in-tree `callback/+server.ts:97` duck-type, because that model tests `'location' in e` and an HttpError carries `status` + `body` but no `location` — copying its form verbatim would have compiled, passed review, and fixed nothing"
  - "P-2 recorded and NOT fixed: the production `/api/oidc/token` route calls `provider.getIdTokenClaims`, and both providers carry their own uncoded duplicate of the logic. A-07's split therefore did not reach the path production actually uses. Surfaced rather than absorbed, because the checkpoint approved `getIdTokenClaims.ts` specifically"

patterns-established:
  - "A plan's predicted injection outcome is a hypothesis about REACHABILITY, and reachability is the thing to check first: ask which fixture reaches the injected line before trusting a predicted red"
  - "When a control goes off-axis, the repair is a better control, never a weaker assertion — and the off-axis result is itself a finding worth recording about the injection design"

requirements-completed: [ASSERT-07]

coverage:
  - id: D1
    description: "D-02 / A-02 landed in three endpoints: each re-throws framework HTTP errors from the head of its catch, so an in-`try` 4xx reaches the caller instead of being re-reported as a 5xx"
    requirement: ASSERT-07
    verification:
      - kind: unit
        ref: 'apps/frontend/src/lib/api/utils/auth/__tests__/authorize-endpoint.test.ts#returns 400 when redirectUri is missing'
        status: pass
      - kind: other
        ref: "grep -c isHttpError → 2 in each of authorize/token/cache; git diff shows the re-throw inserted ABOVE console.error in each, with no cookies.set and no guard line changed; callback/+server.ts byte-unchanged"
        status: pass
      - kind: other
        ref: "The catch-arm stderr signature 'Failed to construct authorization request: HttpError { status: 400 }' is GONE post-fix (F20-1-postfix-cleantree.log) — direct evidence the swallow is removed"
        status: pass
    human_judgment: false
  - id: D2
    description: "A-07's two-code split: the empty-JWK-set and kid-mismatch incidents carry distinct opaque codes through the existing catch branch, with no catch, return-type or defaultOptions-shape change"
    requirement: ASSERT-07
    verification:
      - kind: unit
        ref: 'apps/frontend/src/lib/api/utils/auth/getIdTokenClaims.test.ts#returns success=false when kid not in JWKS + #returns success=false when kid does not match available keys'
        status: pass
      - kind: other
        ref: "Two distinct codes declared and asserted (ERR_JWKS_EMPTY at :241, ERR_JWK_KID_MISMATCH at :268); leak grep shows no privateEncryptionJWKSet/JWKS_/issuer/audience interpolated into any thrown message; git diff removes exactly 3 lines, none in the catch or return type"
        status: pass
    human_judgment: false
  - id: D3
    description: "The fourth product change: a malformed IDENTITY_PROVIDER_DECRYPTION_JWKS is catchable and coded (ERR_JWKS_MALFORMED) instead of an uncatchable import-time SyntaxError"
    requirement: ASSERT-07
    verification:
      - kind: other
        ref: "Parse moved into a getter, so every read occurs inside getIdTokenClaims's try; defaultOptions' shape and call contract preserved (zero external consumers, verified by grep); property type improves from any to Array<jose.JWK>; tsc reports 0 errors in the file"
        status: pass
    human_judgment: true
    rationale: "No test exercises the malformed-env path — the fix makes the failure catchable, but a negative test for it is D-19 ii's standing todo, not this plan's scope. The control-flow claim is verified by reading and by tsc, not by a run."
  - id: D4
    description: "F20-1's negative-control pair completed across the fix with the A-03 injection inversion, both [DERIVED] predictions confirmed by measurement"
    requirement: ASSERT-07
    verification:
      - kind: other
        ref: "F20-1-OLD-B-1.log — injection B pre-fix, PASS blind, 9/9, exit 0 (reproduces 139 § 5.10.4 row B); F20-1-NEW-A-1.log — injection A post-fix, RED at :240:5, '- status: 400 / + HttpError status: 500', 1 failed | 8 passed, exit 1"
        status: pass
      - kind: other
        ref: "F20-1-supp-B-1.log — injection B post-fix, PASS 9/9 exit 0, labelled verbatim 'not the negative control' (evidence the swallow is gone, since :52 is now off-path)"
        status: pass
    human_judgment: false
  - id: D5
    description: "F20-3's negative-control pair completed via two relocated injections, after injection A was measured off-axis"
    requirement: ASSERT-07
    verification:
      - kind: other
        ref: "F20-3-NEW-B-1.log — relocated B reds :268:22 ALONE (1 failed | 4 passed, exit 1); F20-3-NEW-Bprime-1.log — symmetric B′ reds :241:22 ALONE (1 failed | 4 passed, exit 1); each site green under the other's branch"
        status: pass
      - kind: other
        ref: "F20-3-NEW-A-1.log — injection A post-fix: BOTH sites PASS (zero-delta, they throw before the injected line is reachable); only C-5 collateral at :147/:174/:203 reds. Recorded as NOT the negative control"
        status: pass
    human_judgment: false
  - id: D6
    description: "Both strengthened assertions measured RED against the rolled-back pre-fix product source — the phase's central diagnosis measured rather than stated"
    requirement: ASSERT-07
    verification:
      - kind: other
        ref: "F20-strengthened-PREFIX.log — exit 1, 3 failed | 11 passed: authorize :240:5 'HttpError { status: 500 }' vs expected 400, and getIdTokenClaims :241:22 / :268:22 both 'error: {}' vs their expected codes. Restored with git checkout HEAD -- and verified byte-identical"
        status: pass
    human_judgment: false
  - id: D7
    description: "Injection hygiene held across six loop iterations; no injection reached a commit and nothing cross-workspace broke"
    requirement: ASSERT-07
    verification:
      - kind: integration
        ref: 'root yarn test:unit → 25/25 tasks successful, exit 0 (F20-root-testunit.log)'
        status: pass
      - kind: other
        ref: "Three-condition post-gate passed after each of the six injections; git status --porcelain -- apps tests packages empty at plan close; no INJECTED (142) marker anywhere; git diff --exit-code HEAD over both auth directories → exit 0"
        status: pass
    human_judgment: false
  - id: D8
    description: "Operator-approved scope expansion: three file-don't-fix items fixed, their todos closed, A-10 superseded"
    requirement: ASSERT-07
    verification:
      - kind: other
        ref: "cache/+server.ts re-throw (upstream 404 no longer reported as 500); playwright.config.ts:334-338 corrected comment-only with no gate changed and the whole file swept for further drift; getIdTokenClaims.ts:6 lazy parse. Recorded as SE-1/SE-2/SE-3 in the ledger"
        status: pass
    human_judgment: false

duration: 2h 32m
completed: 2026-08-21
status: complete
---

# Phase 142 Plan 04: F20-1 + F20-3 and the OIDC Auth Surface Summary

**Landed five product changes across the OIDC auth surface — three endpoints that were reporting their own client-side 4xx as server-side 5xx, plus a two-code split and a lazy env parse in `getIdTokenClaims` — then drove both strengthened assertions red under the regressions they name, confirming A-03's predicted injection inversion by measurement and discovering that 139's F20-3 injection A is zero-delta on both sites, which forced two relocated controls instead of the predicted one.**

## Performance

- **Duration:** 2h 32m wall clock (the gap includes the operator checkpoint)
- **Tasks:** 4 of 4
- **Files modified:** 10 (6 product/test, 1 config doc, 3 records)
- **Injection loop iterations:** 6, each with a clean three-condition post-gate

## The checkpoint decisions, verbatim

Task 2 stopped and returned a four-part decision. The operator replied:

1. **Fix form: `rethrow`** — "Copy the shape, use `isHttpError`. Apply to `authorize/` and `token/`; `callback/` unchanged. Keep it to the two lines, first statement in the catch, above `console.error`."
2. **A-07: `approve` — the two-code split**, with the leak-safety argument required verbatim in the threat model.
3. **A-05: `run-both`, AND fix `.env` properly** — carry the three prerequisites into wave 6, and add `SUPABASE_ANON_KEY` to `.env` plus `.env.example`.
4. **Fix ALL THREE of the don't-fix items — the operator overrode the deferral.** "Record it that way in the SUMMARY and the ledger: *operator-approved scope expansion at the 142-04 checkpoint*, with A-10's 'capture as todo, do not fix' explicitly superseded. Then close the corresponding todos rather than leaving them open."
5. **Approved — measure the pre-fix RED.**

No file under `apps/`, `packages/` or `tests/` was modified during Task 2 (`changed_paths=0`).

## Accomplishments

- **Three endpoints stopped swallowing their own 4xx.** `error()` throws unconditionally, so an in-`try` `error(400, …)` was caught by the very function that raised it. The measured evidence was the handler's own stderr on the clean tree — `Failed to construct authorization request: HttpError { status: 400, … }` printed *from inside the catch* — and the direct proof of the fix is that **the line is gone** post-fix. `authorize/` now returns 400 for a missing `redirectUri`; `token/` stops mislabelling a claims failure as a token-exchange failure; `cache/` stops reporting an upstream 404 as a 500.
- **The in-tree analog was deliberately not copied.** `callback/+server.ts:97` duck-types on `'status' in e && 'location' in e`. An `HttpError` carries `status` and `body` but **no `location`**, so the sibling's form would have compiled, read as idiomatic, and fixed nothing. `isHttpError` is the framework's own predicate for exactly this.
- **A-07's split landed through the existing catch branch** with no change to the catch, the return type, or `defaultOptions`' shape — `git diff` removes exactly three lines. Both codes are opaque failure-class identifiers; the leak grep confirms no JWKS contents, kids, issuer or audience reach any thrown message.
- **A fourth product change closed a hole that would have exempted itself from A-07's own contract.** `defaultOptions` ran `JSON.parse(...)` at module-evaluation time, outside any `try` — a malformed env var threw an uncatchable `SyntaxError` at *import*, so the one failure mode that most needs a code could never carry one. Deferring the parse to a getter puts every read inside the function's try. The operator's stop-condition was **not** triggered, and that was verified rather than assumed: `defaultOptions` has **zero** consumers outside this file's own default parameter, and the property's type *improves* from `any` to `Array<jose.JWK>`.
- **F20-1's inversion confirmed by measurement, both halves.** OLD half (injection **B**, pre-fix): PASS blind, 9/9 — reproducing 139 § 5.10.4 exactly. NEW half (injection **A**, post-fix): **RED** at `:240:5`, `- "status": 400` / `+ HttpError { "status": 500 }`, 1 failed / 8 passed. Supplementary (injection **B**, post-fix): PASS 9/9, labelled `not the negative control` — B is now off-path because the 400 never reaches `:52`. Research marked both post-fix rows `[DERIVED]`; **both held**.
- **The pre-fix RED is now a measurement.** The plan asserts the strengthened assertions are red before the fixes but never scheduled the run. Rolling the product source back to `a552e78b1` with tests at HEAD produced all three reds — `HttpError { status: 500 }` against expected 400, and `error: {}` against both expected codes.
- **Root `yarn test:unit` green**: 25/25 tasks, exit 0. Auth suite 55/55 including the sibling `token-endpoint.test.ts`.
- **Zero `pending` cells remain in the phase ledger.** Rows 7 and 9 were the last two; all twelve findings now carry verdicts.

## The divergence — F20-3's injection A proves nothing, and I did not pretend otherwise

The plan predicted injection A would red both code assertions. **Measured: both sites PASS.**

The reason is structural and was mis-analysed at plan time. Injection A replaces the *success return*. But **neither F20-3 fixture can reach it** — the empty-set fixture throws at the empty-set check, and the kid-mismatch fixture throws at the lookup. Replacing a line neither fixture executes changes nothing either site observes; under the injection both sites received their **correct** codes, which the strengthened assertions demonstrate *by passing*.

This is **139 § 8.3 R-7's class, applied to F20-3**: an injection that changes something real (the success path) but nothing on the axis the sites read. Pre-fix it *looked* like blindness, because the sites could not see cause at all. Post-fix, with cause asserted, the zero-delta nature is exposed — even a strengthened assertion cannot red under it. 139's injection A arguably warranted an R-prohibition for these two sites on the same reasoning R-7 applies to F20-1's injection A.

**What I did instead of weakening anything:** used the **relocated injection B** (the plan's own design — category kept, reason varied, code lost) at the kid-mismatch throw, which reds `:268` alone; then added the **symmetric relocation B′** at the empty-set throw, which reds `:241` alone. Each site reds under its own branch's regression and stays **green** under the other's. That is strictly stronger than the single red the plan predicted: it proves the two branches are *genuinely discriminated* rather than collapsing to a shared code — which is precisely what D-11 E6 asks for.

Without B′, site `:241` would have carried no on-axis control at all, and the row would have been half-evidenced while looking complete.

## Task Commits

1. **Task 1: OLD halves** — `a552e78b1` (docs, ledger rows 7 + 9 OLD cells)
2. **Task 2: CHECKPOINT** — no commit by construction; decisions recorded above
3. **Task 3: five product changes** — `0f8e99a68` (fix) + `f4e0fc1ec` (docs, the Playwright doc correction, committed separately as it is not product code)
4. **Task 4: assertions + NEW halves** — `ea5d34109` (test) + `2524bd3f7` (docs, ledger NEW halves + records)

Product and test commits are separate, so the two revert independently. Every durable edit was committed **before** the injection that measured it; no injection was ever live at a commit.

## Deviations from Plan

**1. [Rule 1 — the plan's prediction was wrong] F20-3's injection A is zero-delta on both sites**

- **Found during:** Task 4, Step 6.
- **Issue:** the plan predicted RED on both code assertions; both passed, because neither fixture reaches the injected success return.
- **Fix:** recorded as a finding about the *injection design*, explicitly not as the negative control; supplied on-axis controls via the relocated B and a new symmetric B′.
- **Verification:** `F20-3-NEW-A-1.log` (both sites `✓`, only C-5 collateral red), `F20-3-NEW-B-1.log`, `F20-3-NEW-Bprime-1.log`.
- **No assertion was weakened.**

**2. [Operator-directed scope expansion] Three file-don't-fix items were fixed**

- **Found during:** Task 2, surfaced at the checkpoint; directed by the operator.
- **Change:** `api/cache/+server.ts:56` re-throw; `tests/playwright.config.ts:334-338` doc correction; `getIdTokenClaims.ts:6` lazy parse. A-10's "do not fix" **superseded**; the three todos are **closed**, not left open.
- **Committed in:** `0f8e99a68`, `f4e0fc1ec`.

**3. [Improvement over the plan's minimum] The symmetric injection B′**

- **Found during:** Task 4, Step 7, as the repair for deviation 1.
- **Rationale:** without it, `:241` had no on-axis control.

**4. [Improvement over the plan's minimum, operator-approved] The pre-fix RED measured**

- **Found during:** Task 2; approved as item 5.
- **Rationale:** the plan states this red as a fact but never schedules its measurement — a stated diagnosis is exactly what this phase exists to replace.
- **Note:** hit the wave-4 git trap as predicted. `git checkout <sha> -- <path>` stages what it restores, so the restore is `git checkout HEAD -- <path>`, verified with `git diff --exit-code HEAD`.

**5. [Rule 3 — blocking, out of scope] `tsconfig.tsbuildinfo` dirtied by `tsc`**

- **Found during:** Task 4, post-gate after the typecheck.
- **Issue:** the tracked artifact `apps/frontend/tsconfig.tsbuildinfo` is rewritten by `npx tsc --noEmit`, tripping the porcelain post-gate.
- **Fix:** restored with `git checkout HEAD --` (twice); recorded as **P-3**, not fixed.

---

**Total deviations:** 5 (1 wrong plan prediction recorded rather than smoothed, 1 operator-directed scope expansion, 2 improvements over the plan's minimum, 1 blocking-but-out-of-scope artifact).
**Impact:** No assertion was weakened; no injection was redesigned to manufacture a colour; no package installed. Deviation 1 made the F20-3 record *smaller in claim and larger in evidence* — one predicted red became two measured reds plus an honest negative result about the injection itself.

## Issues Encountered

**One BLOCKED operator instruction, and it is not a deferral by choice.**

**B-1 — `SUPABASE_ANON_KEY` could not be added to `.env` / `.env.example`.** Every access path to both files is refused by this environment's permission settings: the `Read` tool returns *"File is in a directory that is denied by your permission settings"*, and Bash `grep` / `awk` / `ls` on either path are denied. **I did not attempt to circumvent it** — for instance by reading the tracked copy through `git show` — because the deny plainly exists to protect env files, and routing around it would defeat the control rather than satisfy the request.

The block is on **access**, not on judgement: `git check-ignore -v .env` returns `.gitignore:3:.env`, so no key value was ever at risk of being committed; only `.env.example` would have been touched in git. **This needs the operator to apply it by hand, or to grant access.** Until then `142-06`'s bank-auth run must export `SUPABASE_ANON_KEY` inline, since `candidate-bank-auth.spec.ts:48-50` throws at module load without it.

Three further observations recorded honestly:

1. **`tsc --noEmit` reports 62 pre-existing errors in the frontend workspace**, none in any file this plan touched (verified by grep: 0 hits across all five). They are `TS7006` implicit-any and `$types` resolution errors in admin routes, contexts and layouts. **Surfaced, not absorbed and not fixed.**
2. **The plan's `:47-59` anchor for `getIdTokenClaims`'s catch is `:47-60` at this HEAD**, and the F20-3 test sites moved to `:241`/`:268` after the comment additions. Consistent with A-01's locate-by-content rule; no impact.
3. **`prettier --check` and `eslint` are clean** over all six edited source files.

## Deferred Items

**Two new findings, both surfaced in passing and recorded in all three places** (ledger § New findings, `deferred-items.md`, `.planning/WINDOWS.md` — now 47 rows):

- **P-2 — the two OIDC providers duplicate `getIdTokenClaims`, uncoded.** `providers/idura.ts:114-122` and `providers/signicat.ts:77-85` each carry their own copy of the logic, including an identical uncoded kid-lookup throw. **This is the one that most deserves a follow-up:** the production `/api/oidc/token` route calls `provider.getIdTokenClaims`, so A-07's split did **not** reach the path production actually uses. Outside the surface approved at the checkpoint, and no test asserts codes there.
- **P-3 — `apps/frontend/tsconfig.tsbuildinfo` is a tracked generated artifact.**

Wave 2's **P-1** remains open. Wave 4's D-01-i/ii/iii remain open. **SE-1, SE-2 and SE-3 are closed** by this plan's fixes.

## Evidence — run logs (outside the repository, per D-07)

Resolved `$TMPDIR`: `/var/folders/3p/10hbv0415234v3x5ctp50l4m0000gn/T/`. HEAD at plan open: `d0d856d2c`.

| Log | Purpose | Result |
| --- | --- | --- |
| `F20-1-OLD-B-1.log` | **F20-1 OLD half** — injection B, pre-fix | `9 passed (9)`, exit 0 — PASS blind |
| `F20-3-OLD-A-1.log` | **F20-3 OLD half** — injection A, pre-fix | `3 failed \| 2 passed (5)`, exit 1 — sites blind, C-5 collateral |
| `F20-3-OLD-B-1.log` | **F20-3 OLD half** — injection B, pre-fix | `5 passed (5)`, exit 0 — sites blind, zero collateral |
| `F20-1-postfix-cleantree.log` | Post-fix clean tree; swallow-removal proof | `9 passed (9)`, exit 0; catch-arm stderr line **gone** |
| `F20-NEW-0-cleantree.log` | Strengthened assertions, post-fix clean tree | `14 passed (14)`, exit 0 |
| `F20-strengthened-PREFIX.log` | **Pre-fix RED, measured** (src rolled back, tests at HEAD) | exit 1, `3 failed \| 11 passed (14)` |
| `F20-1-NEW-A-1.log` | **F20-1 NEW half — the RED** (inverted injection A) | exit 1, `:240:5`, status 500 vs 400 |
| `F20-1-supp-B-1.log` | F20-1 supplementary — **not the negative control** | `9 passed (9)`, exit 0 |
| `F20-3-NEW-A-1.log` | F20-3 injection A post-fix — **zero-delta, not the control** | exit 1; both sites `✓`, only C-5 red |
| `F20-3-NEW-B-1.log` | **F20-3 NEW half — RED at `:268` alone** | exit 1, `1 failed \| 4 passed (5)` |
| `F20-3-NEW-Bprime-1.log` | **F20-3 NEW half — RED at `:241` alone** (symmetric) | exit 1, `1 failed \| 4 passed (5)` |
| `F20-root-testunit.log` | Root `yarn test:unit`, all workspaces | 25/25 tasks, exit 0 |

## Plan Verification

| Check | Result |
| --- | --- |
| `git status --porcelain -- apps tests packages` at plan close | **empty** |
| `grep -rn 'INJECTED (142)' apps packages tests` at plan close | **no hits** |
| `git diff --exit-code HEAD -- apps/frontend/src/routes/api/oidc/ apps/frontend/src/lib/api/utils/auth/` | **exit 0** — the auth tamper proof |
| `npx vitest run src/lib/api/utils/auth/` | **exit 0** — 55 tests, 6 files |
| Root `yarn test:unit` | **exit 0** — 25/25 tasks |
| Ledger rows 7 and 9 have no `pending` cells | **pass** — 0 `pending` table cells anywhere in the ledger |
| F20-1 NEW half used injection **A**, not B | **pass** |
| F20-1 supplementary labelled `not the negative control` | **pass** — verbatim |
| F20-3 OLD halves **re-run** with the D-06 derivation recorded | **pass** |
| Seven+ logs exist at their recorded paths | **pass** — 11 present and non-empty |
| `callback/+server.ts` unmodified | **pass** — `git diff --exit-code d0d856d2c` exit 0 |
| `api/cache/+server.ts` modified | **operator-directed** — SE-1, scope expansion recorded |
| `isHttpError` count in each of the three endpoints | **2** each (import + guard) |
| No key material in any thrown message | **pass** — leak grep returns nothing |
| Two distinct error codes declared and asserted | **pass** — `ERR_JWKS_EMPTY`, `ERR_JWK_KID_MISMATCH` |
| D-05's F19-class sites untouched | **pass** — diff confined to the assertion lines |
| `prettier --check` + `eslint` over edited files | **clean** |
| Withdrawal count | **0** — unchanged |

## User Setup Required

**One item needs the operator** — see **B-1** under Issues Encountered: add `SUPABASE_ANON_KEY` to `.env` (value = `PUBLIC_SUPABASE_ANON_KEY`'s) and to `.env.example` with a placeholder. I could not, because the environment denies all access to those paths.

## Next Phase Readiness

**Ready for `142-06` (wave 6: gates, audit, propagation).** All twelve findings carry verdicts; the ledger has zero `pending` cells.

Cautions to carry forward:

1. **A-05's bank-auth run needs three things this machine can supply but does not supply automatically:** export `SUPABASE_ANON_KEY` inline (**B-1 is unresolved** — the spec throws at module load without it), serve the Edge Function (`npx supabase functions serve identity-callback --no-verify-jwt --env-file ../../../.env` from `apps/supabase/supabase`), and use `FRONTEND_PORT=5174` for both the dev server and the Playwright run. Local Supabase was measured up (`:54321` → 200); `SUPABASE_SERVICE_ROLE_KEY` and the `IDURA_*` vars are present; `bank-auth-journey` needs no external credentials (it spawns a mock issuer).
2. **`npx tsc --noEmit` dirties the tree** via `apps/frontend/tsconfig.tsbuildinfo` (P-3). Restore with `git checkout HEAD --` before trusting any porcelain gate.
3. **D-14's 3× unit gate starts from a green baseline** — root `yarn test:unit` measured 25/25, exit 0, in ~23 s.
4. **Four standing todos for `/gsd-capture` per D-19**, exact wording in `deferred-items.md`: **P-2** (provider duplication — the highest-value one, since production calls the unfixed path), **P-3** (tracked tsbuildinfo), plus D-19 i's six F19-class `!` sites in the two auth test files and D-19 ii's missing `getIdTokenClaims` negative tests — the latter now including a test for the newly catchable `ERR_JWKS_MALFORMED` path, which has none.
5. **SE-1/SE-2/SE-3 must be recorded as closed, not open**, and **A-10 as superseded**, when `142-06` propagates to the audit / REQUIREMENTS / ROADMAP.
6. **`expect.soft` remains unused across all five waves.**

**One blocker: B-1.**

---

_Phase: 142-assertion-design-wiring-only-tests-assert-output_
_Completed: 2026-08-21_

## Self-Check: PASSED

All claims verified against disk and git, not asserted from reasoning:

- **Files** — 10/10 modified files present; this SUMMARY written.
- **Commits** — 5/5 resolve in `git log`: `a552e78b1`, `0f8e99a68`, `f4e0fc1ec`, `ea5d34109`, `2524bd3f7`.
- **Logs** — 11/11 present and non-empty under `${TMPDIR}/gsd-142/`, each the source of the outcome cell citing it.
- **Tree** — `git status --porcelain -- apps tests packages` empty; no `INJECTED (142)` marker under `apps packages tests`; `git diff --exit-code HEAD` over both auth directories exit 0.
- **Gates** — auth suite 55/55; root `yarn test:unit` 25/25 tasks exit 0; `prettier` and `eslint` clean over every edited file; `tsc` reports 0 errors in the five touched source files (62 pre-existing errors elsewhere, surfaced not absorbed).
- **Ledger** — 0 `pending` table cells in the entire ledger; the 3 remaining `pending` string hits are prose describing the convention.
- **Records** — P-2, P-3 and B-1 appear in all three places; `.planning/WINDOWS.md` grew 44 → 47 rows.

The one place I could not do what was asked — **B-1**, the `.env` / `.env.example` addition — is reported as a blocker rather than worked around, and the environment refusal is quoted rather than paraphrased. The one place the plan's prediction was wrong — **F20-3's injection A** — is recorded as a negative result about the injection design, with the assertion left at full strength and two better controls supplied in its place.
