---
phase: 155-edge-function-hardening-env-jwt-provider-identity
plan: 03
subsystem: supabase-edge-functions
tags: [security, env-defaults, non-disclosure, identity, oidc, signicat, provider-config, citation]
status: complete

requires:
  - requireEnv, the canonical helper 155-02 published in invite-candidate/envConfig.ts
  - the URL-import-free sibling-module pattern established by 155-01
  - 155-01's .env.example and IDURA-TEST-RUNBOOK.md documentation of the seven Edge Function variables
provides:
  - identity-callback's third envConfig.ts copy, byte-identical to the canonical one Plan 05 will guard
  - three named throws replacing a silent provider choice, a silent tenant choice and a hard-coded loopback redirect
  - 155-SIGNICAT-SUBJECT-CITATION.md, the dated citation record REVIEW-EDGE-04 is retired on
  - a claimConfig.ts docstring block carrying the ftn_sub prohibition in the provider's own words
affects:
  - apps/supabase/supabase/functions/identity-callback (IDENTITY_PROVIDER_TYPE, DEFAULT_PROJECT_ID and SITE_URL now mandatory)
  - the opt-in bank-auth Playwright project, whose serve step must supply all three (already documented by 155-01)

tech-stack:
  added: []
  patterns:
    - env read at the boundary, validation in a pure sibling module (inherited from 155-01/155-02)
    - a byte-identical copy per deployment unit, with the duplication recorded in the module docstring
    - external claims retired on a re-fetched, hashed, dated citation record rather than on transcription

key-files:
  created:
    - apps/supabase/supabase/functions/identity-callback/envConfig.ts
    - .planning/phases/155-edge-function-hardening-env-jwt-provider-identity/155-SIGNICAT-SUBJECT-CITATION.md
  modified:
    - apps/supabase/supabase/functions/identity-callback/index.ts
    - apps/supabase/supabase/functions/identity-callback/claimConfig.ts

key-decisions:
  - Every plan line citation for index.ts was stale by 18 to 40 lines and was re-measured before use; the one number the plan got right is the one it forbade touching.
  - The three throws were proven to surface only at the outer catch by reading the try/catch nesting, not by trusting the plan's premise -- the failure mode 155-02 was bitten by in the sibling file.
  - The country divergence was LEFT, on three measurements rather than on preference, the decisive one being that the Deno-side absence is deliberately test-locked by candidate-bank-auth.spec.ts:174.
  - The birthdate account-collision handed forward in the execution brief was re-measured and found ALREADY CLOSED; the brief's premise is stale, not open work.
  - Task 1 AC2 is genuinely unsatisfiable and was already false at HEAD before this diff; reported with a flip-tested alternate route rather than engineered around.
  - The file-head docstring was extended beyond the plan's instruction to mark DEFAULT_PROJECT_ID required and to document SITE_URL, because leaving a docstring that lies about two now-mandatory variables is the trap the phase exists to remove.

requirements-completed: []

coverage:
  - deliverable: "An unset IDENTITY_PROVIDER_TYPE throws naming it instead of silently selecting which provider's claim map is applied to a verified token"
    human_judgment: false
    verification:
      - kind: command
        ref: "offline before/after with the variable genuinely unset: OLD -> 'signicat' with no error; NEW -> THREW ERR_ENV_UNCONFIGURED naming IDENTITY_PROVIDER_TYPE. Log /private/tmp/gsd-155-03/before-after.log"
        status: pass
      - kind: command
        ref: "grep -cE for a Deno.env default in identity-callback/index.ts: 3 at baseline, 0 after"
        status: pass
  - deliverable: "An unset DEFAULT_PROJECT_ID throws naming it instead of seeding self-registered candidates into a hard-coded seed tenant, while the request body's project_id still short-circuits ahead of it"
    human_judgment: false
    verification:
      - kind: command
        ref: "offline before/after: OLD -> '00000000-0000-0000-0000-000000000001'; NEW -> THREW ERR_ENV_UNCONFIGURED; and with a body project_id present and the variable still unset, NEW -> 'body-project' with no throw. Log /private/tmp/gsd-155-03/before-after.log"
        status: pass
  - deliverable: "An unset SITE_URL throws naming it instead of addressing a production login redirect at a developer loopback address"
    human_judgment: false
    verification:
      - kind: command
        ref: "offline before/after: OLD -> 'http://127.0.0.1:5173/candidate'; NEW -> THREW ERR_ENV_UNCONFIGURED. grep -c '127.0.0.1:5173' in the file: 1 at baseline, 0 after"
        status: pass
  - deliverable: "No unconfigured-environment message can reach an HTTP caller from any of the three new throws"
    human_judgment: false
    verification:
      - kind: command
        ref: "try/catch nesting mapped by grep -nE '^\\s*(try \\{|\\} catch)': every inner arm (165-167, 190-192, 207-209, 225-227) closes before the next requireEnv, so 154, 183 and 322 surface only at the 151 -> 374 outer pair, which console.errors the real error and returns a fixed literal 'Internal server error' with nothing interpolated"
        status: pass
  - deliverable: "identity-callback's envConfig.ts is byte-identical to the canonical invite-candidate copy Plan 05 will assert"
    human_judgment: false
    verification:
      - kind: command
        ref: "cmp identity-callback/envConfig.ts invite-candidate/envConfig.ts -- exit 0"
        status: pass
  - deliverable: "The Phase 161 boundary is intact and greppable"
    human_judgment: false
    verification:
      - kind: command
        ref: "DEFAULT_SEED_PROJECT_ID count 1 (declaration only, use in the fallback chain gone); no bare PROJECT_ID identifier (grep -cE '(^|[^_])PROJECT_ID' is 0); Deno.env.get('SUPABASE_URL')! count unchanged at 2"
        status: pass
  - deliverable: "REVIEW-EDGE-04 retired on cited, dated, re-derivable provider documentation"
    human_judgment: false
    verification:
      - kind: command
        ref: "all three developer.signicat.com pages re-fetched 2026-08-29 with a browser UA and the .md suffix; each SHA-256 recorded in 155-SIGNICAT-SUBJECT-CITATION.md; all three RESEARCH quotes confirmed present verbatim; verdict unchanged, escalation branch did not fire"
        status: pass
      - kind: test
        ref: "apps/supabase/supabase/functions/identity-callback/claimConfig.test.ts -- 20 tests, unchanged"
        status: pass
  - deliverable: "The three environment changes behave as shown on the DEPLOYED Deno function"
    human_judgment: true
    rationale: "envConfig.ts is pure and Deno-global-free, so its behaviour transfers by construction, and the call-site expressions were reproduced verbatim offline. What is NOT proven is a served run: deno is not installed in this tree, and the only suite that reaches identity-callback is the opt-in bank-auth project. A PLAYWRIGHT_BANK_AUTH=1 run with the seven variables the runbook documents would close it, and is owed phase-wide."

metrics:
  duration: 15 min
  completed: 2026-08-29
  tasks: 2
  files: 4
  commits: 3

actuals:
  tokens: 9535
  tasks: 2
  commits: 3
---

# Phase 155 Plan 03: identity-callback Environment Throws and the Signicat Citation Summary

`identity-callback` now refuses to run without `IDENTITY_PROVIDER_TYPE`, `DEFAULT_PROJECT_ID` and
`SITE_URL` — closing a silently chosen identity provider, a silently chosen tenant and a hard-coded
loopback login redirect — and REVIEW-EDGE-04 is retired on three Signicat pages re-fetched and hashed
today rather than transcribed from research.

## Accomplishments

- **`identity-callback/envConfig.ts`** — the third copy of `requireEnv`, produced by `cp` rather than
  by retyping, and `cmp`-verified byte-identical to `invite-candidate/envConfig.ts` so Plan 05's guard
  finds what it expects.
- **Three throws replacing three silent defaults.** The provider-type read no longer defaults to
  `'signicat'`; the project-id chain no longer ends at the seed-tenant constant; the magic-link
  `redirectTo` no longer ends at `http://127.0.0.1:5173`.
- **The provider-type comment tells one story, not two.** Unset is a configuration error and throws
  naming the variable; set-but-unrecognised keeps falling through to the pre-existing 500 that names
  the value. The comment says why the split exists, so a reader does not "unify" them.
- **`redirectSiteUrl`, deliberately not `siteUrl`.** The plan warned about the name collision and it
  was real — and worse than described: the existing `siteUrl` binding is *dead* (see Findings).
- **File-head docstring made honest** for all three variables, not just the one the plan named.
- **The outer catch's comment now names the class it newly receives**, and states that the returned
  string is a fixed literal with nothing interpolated — the property that keeps the non-disclosure bar
  true for future throws, not just these three.
- **`155-SIGNICAT-SUBJECT-CITATION.md`** — three sources, each with URL, ISO retrieval date, SHA-256 of
  the retrieved bytes, and verbatim block quotes; the reproducible fetch recipe; the
  Transient-versus-persistent contradiction confronted in one section; three caveats; and the honest
  limitation that the eID-Hub-to-our-tenant tie is an inference from a shared `/auth/open` path
  segment, with both sides quoted so a reader can judge rather than being asked to accept.
- **`claimConfig.ts` docstring block** — three sentences at the exact place a maintainer looks before
  changing `identityMatchProp`, carrying the confirmation, the organisation re-key consequence, the
  `ftn_sub` prohibition in the provider's own words, and the record's filename.

## Task / Commit Ledger

| Task | Commit | Files |
|---|---|---|
| 1 | `465cc4bdd` | `envConfig.ts` (new), `index.ts` |
| 1 (hygiene repair) | `b5bf954dd` | `index.ts` |
| 2 | `1ecb51c54` | `155-SIGNICAT-SUBJECT-CITATION.md` (new), `claimConfig.ts` |

## Where each new throw actually surfaces — read, not assumed

This is the check 155-02's finding demanded, and it was done by reading the arm rather than by
trusting the plan's sentence about it. Every `try`/`catch` in the file, with indentation:

| Line | Construct | Body |
|---|---|---|
| 151 → 374 | outer `try` / `catch (e)` | the whole request |
| 165 → 167 | inner | `body = await req.json()` |
| 190 → 192 | inner | `decryptJweToken` |
| 207 → 209 | inner | `verifyJwt` |
| 225 → 227 | inner | `extractIdentityClaims` |

The three `requireEnv` calls sit at **154**, **183** and **322**. Each inner arm closes before the next
call, so none of the three is nested inside one: all three surface at the outer arm and nowhere else.
That arm, verbatim:

```ts
  } catch (e) {
    console.error('identity-callback error:', e);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
```

It logs the real error and returns a **fixed literal** — no template, no interpolation, no `err.message`.
Unlike `invite-candidate` before 155-02, `identity-callback`'s arm genuinely did both halves already.
The plan's premise held here; it was verified rather than inherited, and the verification is what makes
saying so worth anything.

## The observed before/after, all three sites

Reproduced offline with the variables genuinely unset (`/private/tmp/gsd-155-03/before-after.log`):

```
OLD providerType  -> "signicat"
NEW providerType  -> THREW ERR_ENV_UNCONFIGURED : Missing required environment variable: IDENTITY_PROVIDER_TYPE.
OLD projectId     -> "00000000-0000-0000-0000-000000000001"
NEW projectId     -> THREW ERR_ENV_UNCONFIGURED : Missing required environment variable: DEFAULT_PROJECT_ID.
OLD redirectTo    -> "http://127.0.0.1:5173/candidate"
NEW redirectTo    -> THREW ERR_ENV_UNCONFIGURED : Missing required environment variable: SITE_URL.
```

Three further cases were exercised in the same run rather than reasoned about: all three variables set
to the **empty string** throw as well (`requireEnv`'s closed missing-set), all three configured
correctly return their values, and — the D-D3 boundary made concrete — a request body carrying
`project_id` returns `'body-project'` **with `DEFAULT_PROJECT_ID` still unset**, proving the body value
remains the first operand and short-circuits before the environment is read.

## Findings that correct the inputs

**1. Every line citation in the plan for `index.ts` was stale, by 18 to 40 lines.** Measured, then
navigated by symbol:

| Plan says | Actually | Site |
|---|---|---|
| `:17` | `:16` | the provider-type docstring line |
| `:169` | `:151` | the provider-type read |
| `:197` | `:179` | the project-id expression |
| `:355` | `:315` | the `siteUrl` binding to leave alone |
| `:361` | `:321` | the `redirectTo` fallback |
| `:31` | `:31` | the Phase-161 constant — **correct** |

The one number the plan got right is the one it forbade touching, which is a small mercy. `155-PATTERNS.md`
§ 6 carries the same stale numbers.

**2. `siteUrl` at `:315` is not merely a name collision — it is a dead binding.** `grep -n siteUrl`
returns exactly one hit: its own declaration. It is assigned from `Deno.env.get('SUPABASE_URL')!` and
never read. Pre-existing, and the plan says to leave it exactly as it is (AC7 pins the count), so it was
left. It matters because a reader will reasonably assume the new `redirectSiteUrl` five lines below is
related to it, and the two hold different values for different purposes. Filed.

**3. The `birthdate` account-collision handed forward in the execution brief is ALREADY CLOSED, not open
work.** Measured rather than accepted: `grep -c "identityMatchProp: 'sub'"` in `claimConfig.ts` is **2**
— both providers — and the frontend twin `authConfig.ts:21,37` agrees on both. The collision is also
test-locked at both ends (`claimConfig.test.ts` "a shared birthdate does NOT merge two candidates" for
each provider; `signicat.test.ts:317` asserts distinctness across two real tokens). Phase 142.1 rekeyed
it and the brief's description of it as still open is stale. **Neither fixed nor silently dropped: it is
reported here as not-a-defect, with the measurement that shows why.** The related review finding the
brief names as *since fixed* — the jose error oracle echoing the incoming `kid` — is likewise confirmed
fixed: the three inner catch arms log and return fixed strings.

**4. `tests/IDURA-TEST-RUNBOOK.md` was already repaired by 155-01 for this exact change.** Verified at
`:80-88` and `:120-130`: all seven variables, `DEFAULT_PROJECT_ID` and `SITE_URL` among them, are
documented as required under an explicit "Changed in Phase 155" note and appear in the `--env-file`
examples. So this plan owes the opt-in suite no further repair — checked, not assumed.

## Deviations from Plan

**1. [Rule 1 — Bug] My own Task 1 comment tripped the comment-hygiene gate**
- **Found during:** Task 1 verification, by `yarn assert:comment-hygiene`, after the commit had landed
- **Issue:** the new long comment came to rest directly beneath the pre-existing
  `// Resolve provider configuration` line at the same indent, which is exactly rule 2 (D-A4): a comment
  line ending without terminal punctuation, continued by the line under it. Baseline was 0 violations
  over 1570 files; my diff made it 1 over 1571.
- **Fix:** joined the two into one line.
- **Verification:** guard back to `0 violation(s)`, 1571 files.
- **Commit:** `b5bf954dd`

**2. [Rule 2 — Missing critical functionality] The file-head docstring was corrected for two variables
the plan did not name**
- **Found during:** Task 1
- **Issue:** the plan asks only for the provider-type line. But `DEFAULT_PROJECT_ID` was described as
  "Project to assign self-registered candidates to" with no hint that it is now mandatory, and `SITE_URL`
  — which this task makes mandatory — was **not documented at all**. Leaving a deployment-facing
  docstring silent about two variables that now refuse to start the function is the same class of trap
  the phase exists to remove.
- **Fix:** `DEFAULT_PROJECT_ID` marked required, with a note that the request body's `project_id` takes
  precedence; `SITE_URL` added and marked required. The two lines Plan 01 corrected were left alone.
- **Verification:** `yarn format:check` and the hygiene gate both clean; no behaviour change.
- **Commit:** `465cc4bdd`

**3. [Reported, not fixed] Task 1 AC2 is unsatisfiable** — see below.

**Total deviations:** 2 auto-fixed (1 × Rule 1, 1 × Rule 2), 1 criterion reported with a flip-tested
alternate route.
**Impact:** no scope change. Deviation 2 completes the edit the plan asked for rather than widening it.

## Unsatisfiable criterion — reported, flip-tested, registered

**Task 1 AC2** requires the repo-wide `Deno.env.get(...) ?? / ||` grep to print **only** the
`send-email/index.ts` line, with no `invite-candidate` or `identity-callback` file appearing.

It was **already false at HEAD, before this diff**. Measured at baseline:

```
apps/supabase/supabase/functions/invite-candidate/envConfig.ts:1
apps/supabase/supabase/functions/invite-candidate/envConfig.test.ts:1
apps/supabase/supabase/functions/send-email/index.ts:3
apps/supabase/supabase/functions/identity-callback/index.ts:3
```

Both `invite-candidate` hits are **prose inside docstrings** that quote the anti-pattern in order to
declare why it is abolished. The byte-identical copy AC8 mandates then necessarily adds a third.

**Applying 155-02's refinement:** is the forbidden word load-bearing, or merely present? Here it is
load-bearing and the criterion is genuinely unsatisfiable — I am *forbidden* from rewording the canonical
docstring, because AC8 requires `cmp` to exit 0 and Plan 05's guard will assert exactly that. It is not a
draft to revise. No docstring was trimmed to make a grep pass.

**Alternate route, flip-tested.** The same grep restricted to non-comment lines
(`| grep -vE '^[^:]+:[0-9]+: *(\*|//|/\*)'`):

| State | Result |
|---|---|
| Committed baseline | exactly the three `send-email/index.ts` **code** lines (207, 208, 228) — AC2's actual intent, at line rather than file granularity |
| After injecting `const injectedFlipTest = Deno.env.get('FLIP_TEST') \|\| 'fallback';` on a code line | `identity-callback/index.ts:35` appears — the control can fail |
| After `git checkout --` (work already committed) | baseline restored; `git diff --stat HEAD` clean apart from a pre-existing unrelated modification |

**Action carried to Plan 05:** `scripts/assert-edge-env-defaults.mjs` must exclude comment lines, or it
will fail the build on three docstrings written to explain the very defect it enforces against.

## The provider-config divergence — LEFT, with the reason stated

The `country` re-divergence 155-01 handed forward is **still open and was deliberately not resolved.**
Frontend `IDURA_AUTH_CONFIG.extractClaims` is `['birthdate','hetu','country']`
(`authConfig.ts:38`); the Deno twin is `['birthdate','hetu']`. The security half agrees on both sides
(`identityMatchProp: 'sub'`, both providers), so this is metadata drift, not an open hole.

Three measurements, not a preference:

1. **`country` has zero consumers.** Grepping the claim across `apps/frontend/src` and
   `apps/supabase/supabase` returns only two `authConfig.ts` docstring mentions, the array element
   itself, and an unrelated i18n locale-matching comment. Nothing reads it.
2. **The Deno-side absence is deliberately test-locked.**
   `tests/tests/specs/candidate/candidate-bank-auth.spec.ts:174` says verbatim: *"`country` is NOT in the
   production extractClaims set, so it is intentionally not asserted"*, and asserts the exact two-element
   set. Adding `country` would contradict a spec's stated intent.
3. **This plan's Task 2 instructs "Change no value in `PROVIDER_CONFIGS`."**

**The honest observation, recorded rather than swallowed:** this pair has now drifted undetected twice,
which is a missing-assertion problem, not an editing problem. The real fix is a drift guard of the same
class as Plan 05's byte-identity assertion for `envConfig.ts`, and it needs a prior decision — should the
two configs agree on `extractClaims` at all, or only on `identityMatchProp`? That is a decision the
operator or a guard-owning plan takes, not one an executor takes at 5am on a docstring task. Filed as
WINDOWS 160 with all three measurements so the next reader inherits the finding, not the search.

## Verification

| Gate | Baseline | After |
|---|---|---|
| `yarn workspace @openvaa/supabase test:unit` | 37/37 | **37/37** (`claimConfig.test.ts` still 20) |
| `yarn test:unit` | 25/25 tasks | 25/25 tasks |
| `yarn build` | 14/14 | 14/14 |
| `yarn lint:check` | 22/22 | 22/22, exit 0 |
| `yarn assert:comment-hygiene` | 0 / 1570 files | 0 / **1571** files |
| `yarn format:check` | clean | clean |

Plan-level criteria:

- No environment-defaulting expression remains in `identity-callback/index.ts` (3 → **0**) or
  `invite-candidate/index.ts` (already 0, re-measured).
- The 155/161 boundary holds: `DEFAULT_SEED_PROJECT_ID` count **1** (declaration survives, use gone), no
  bare `PROJECT_ID` identifier anywhere in the file, `:31` unmodified.
- `cmp` of the two `envConfig.ts` copies exits **0**.

`yarn db:lint:sql` was not run: it is pre-existing red by construction (its failing half lints the live
database) and this plan touches no SQL.

## E2E decision — declined, on this diff's own proof

1. **The default run cannot reach the changed code.** `identity-callback` is exercised only by the
   `bank-auth` project, which is opt-in behind `PLAYWRIGHT_BANK_AUTH`: `tests/playwright.config.ts:258`
   lists it among the opt-in projects excluded from the default run, and `:334-335` gates the project on
   the environment variable.
2. **`functions.invoke` appears zero times under `tests/`**, re-measured this session — no spec, setup,
   teardown or fixture invokes any Edge Function on the default path.
3. **The changed modules have no non-Deno importer.** `index.ts` and `envConfig.ts` are imported only by
   the Deno function; `claimConfig.ts`'s change is docstring-only. Grepping `identity-callback/` across
   `apps/frontend/src`, `packages` and `tests` returns only prose in comments and documentation, never an
   import.
4. **`yarn build` 14/14 and `yarn test:unit` 25/25 green**, so no SvelteKit-side contract moved.

**The opt-in `bank-auth` suite genuinely IS affected** — three previously-optional variables are now
mandatory on the served function — but the repair was already landed by 155-01 in
`tests/IDURA-TEST-RUNBOOK.md` and was verified rather than assumed (see Finding 4). No further repair is
owed from this plan.

**Still owed phase-wide:** a real `PLAYWRIGHT_BANK_AUTH=1` run. No run has exercised the *deployed*
`identity-callback` since Phase 155 began, so all three throws rest on the offline reproduction plus the
structural read of the catch arms. `deno` is not installed in this tree. Registered as WINDOWS 163.

## Out of scope, deliberately, and recorded

- **`DEFAULT_SEED_PROJECT_ID` at `:31` is now declared and unreferenced.** Exactly as D-D3 requires:
  Phase 161 owns the constant and the `DEFAULT_PROJECT_ID` → `PROJECT_ID` convergence. The call site
  carries a comment saying so, and **Plan 06 owns filing the pending todo** per this plan's own text.
- **The `Unknown identity provider type: ${providerType}` 500 echoes the configured value** to an
  unauthenticated caller on a `--no-verify-jwt` endpoint. Pre-existing, the same disclosure class as the
  two `details:` leaks 155-02 filed (WINDOWS 157), untouched by instruction. Filed as WINDOWS 162 so the
  three throws landing beside it are not mistaken for closing the class.
- **The dead `siteUrl` binding at `:315`** — Finding 2. Filed as WINDOWS 161.
- **The non-null `Deno.env.get(...)!` reads** — assigned to Plan 06. Untouched; AC7 pins the count at 2.

## Known Stubs

None. No placeholder values, no skipped tests, no unwired data paths, no `TODO`/`FIXME` introduced.

## Broken-windows entries filed (`.planning/WINDOWS.md`, 5)

| id | Kind | Subject |
|---|---|---|
| 159 | `deviation` | Task 1 AC2 unsatisfiable and already false at HEAD; flip-tested route; action for Plan 05's guard |
| 160 | `todo` | the `country` provider-config divergence left, with the three measurements and the drift-guard recommendation |
| 161 | `todo` | `siteUrl` at `index.ts:315` is a dead binding whose name collides with the new concept |
| 162 | `todo` | the unknown-provider 500 echoes the configured value to an unauthenticated caller |
| 163 | `unrun-verify` | no Playwright run; default suite proven unable to reach the diff; `PLAYWRIGHT_BANK_AUTH=1` owed phase-wide |

## Threat Flags

None. Every surface this diff touches is covered by the plan's `<threat_model>`; no new network endpoint,
auth path, file access pattern or schema change. T-155-12, T-155-13 and T-155-14 are mitigated exactly as
specified. **T-155-17 was verified rather than assumed** — the premise 155-02 found false in the sibling
file is true here, and the outer arm was read to prove it. **T-155-15 required no code change**: the
mitigation was already in place and is now backed by dated citations. **T-155-16 is discharged** by the
`ftn_sub` prohibition now sitting in the docstring a maintainer reads first. T-155-SC holds: this plan
installs nothing, and `yarn.lock` is untouched.

## Requirements

`requirements-completed` is deliberately **empty**. `requirements.ready-ids` reports **0/2 ready**:
`REVIEW-EDGE-02` is also declared by Plans 01, 04, 05 and 06, and `REVIEW-EDGE-04` is not yet releasable
while sibling declarers lack summaries. This plan discharges sites 1, 2 and 3 of `REVIEW-EDGE-02`'s seven
(sites 4–6 are `send-email`, Plan 04; site 7 was `invite-candidate`, Plan 02) and **the whole of
`REVIEW-EDGE-04`**, whose remaining obligation was evidentiary rather than code.

## Next

Phase 155 Plan 04 (`send-email`: the last three environment defaults, plus the base64url decode and the
template regex). It copies `envConfig.ts` and `jwtSegment.ts` verbatim, so it inherits the AC-grep wall
documented above — use the comment-excluding route. Plan 05 must fold that exclusion into
`scripts/assert-edge-env-defaults.mjs` or the guard will red on three explanatory docstrings.

## Self-Check: PASSED

Both created files exist on disk (`envConfig.ts`, `155-SIGNICAT-SUBJECT-CITATION.md`); all three commit
hashes resolve in `git log`; every acceptance criterion re-run (one reported unsatisfiable with a
flip-tested alternate route, the rest pass); all plan-level `<verification>` commands re-run and pass.
