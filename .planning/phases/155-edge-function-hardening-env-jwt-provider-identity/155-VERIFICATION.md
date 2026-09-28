---
phase: 155-edge-function-hardening-env-jwt-provider-identity
verified: 2026-08-29T08:20:00Z
status: passed
score: 5/5 must-haves verified (REVIEW-EDGE-04 correctly not-checked, see below)
behavior_unverified: 0
overrides_applied: 0
not_performed:
  - item: "Full default `yarn test:e2e` suite (150/150 claim) re-run by the verifier"
    reason: "Would require db:reset + a fresh dev server + a ~10min suite run, none of which were safe to launch unattended mid-verification without background-job discipline. The bank-auth report (a directly adjacent claim in the same evidence chain) WAS independently decoded from disk and matches 155-06's claim exactly (see Evidence Claims below), which is corroborating but not a substitute. Unit/build/lint gates were independently re-run and are green, and no application source (as opposed to Edge Function / script source) was touched by Plans 05 or 06. Recommend a human/CI re-run before ship if the 150/150 claim needs to be load-bearing rather than corroborated-by-adjacency."
    status: unperformed
---

# Phase 155: Edge Function Hardening — env, JWT, provider identity Verification Report

**Phase Goal:** Three Supabase Edge Functions stop decoding JWTs with the wrong alphabet, stop
substituting silent defaults for missing configuration, and fail closed on `aud`/`iss` binding.
**Verified:** 2026-08-29
**Status:** passed
**Re-verification:** No — initial verification

This is a security phase. Every claim below was checked against the source at HEAD `d0a42d314`
(phase-155 close commit `c0986edaa`, plus two unrelated verification-doc commits that landed after),
not accepted from SUMMARY.md prose. Where a SUMMARY made an evidentiary claim (a test result, a
flip-test, a report payload), I either re-ran the check myself or, where re-running was unsafe/slow,
decoded the underlying artifact directly and say so.

## Goal Achievement — the four security properties named in the verification brief

### 1. `aud`/`iss` fail CLOSED — structurally, not by call-site convention

**VERIFIED.** Read `apps/supabase/supabase/functions/identity-callback/verifyConfig.ts`:
`requireVerifyClaimBinding(clientId?, issuer?)` throws `ERR_AUDIENCE_UNCONFIGURED` /
`ERR_ISSUER_UNCONFIGURED` whenever `!clientId` or `!issuer` — which catches both `undefined` and
`''`, exactly the two-line jose defect the phase is about (jose does a presence check only when the
option is `!== undefined`, and compares the value only under truthiness, so `''` used to buy a
presence requirement with no value comparison).

**Structural, not positional** — confirmed by call-graph trace, not by trusting the comment claiming
it:
- `grep -rn "jwtVerify(" apps/supabase apps/frontend --include="*.ts"` finds exactly **one**
  production call site in the Edge Function: `identity-callback/index.ts:81`.
- That call is fed by `const { audience, issuer } = requireVerifyClaimBinding(Deno.env.get(...),
  Deno.env.get(...))` two lines above it (`:76-79`) — the guard sits directly on the path to
  `jose.jwtVerify`, so any future caller of `verifyJwt()` inherits the binding; there is no
  conditional branch or optional-options object left to bypass.
- `verifyJwt()` itself has exactly one caller in the file (`:207`).

**Tests re-run by me** (`yarn workspace @openvaa/supabase test:unit` via `vitest run
supabase/functions`): 55/55 pass, including
`verifyConfig.test.ts > a wrong-audience, wrong-issuer token under the two options shapes > is
accepted under the pre-fix empty options object and rejected under the guard output` — the
permanent negative control asserting the SAME wrong-party token (`iss:
https://evil-idp.example`, `aud: some-other-clients-id`) resolves under `jose.jwtVerify(jwt,
publicKey, {})` (the pre-fix shape) and rejects under the guard's output. This is load-bearing
evidence, not a description of evidence: it is a live, permanent assertion, not a one-off log.

### 2. No unconfigured-environment message can reach a caller — verified per FILE

**VERIFIED**, and the SUMMARY's central finding — "the catch-arm premise is a property of each file,
not the codebase" — is itself confirmed by re-reading all three catch arms myself rather than
trusting the claim:

| Function | Outer catch | Logs? | Returns? |
|---|---|---|---|
| `identity-callback/index.ts:373-378` | `catch (e)` | `console.error('identity-callback error:', e)` | fixed literal `'Internal server error'`, nothing interpolated |
| `invite-candidate/index.ts:192-198` | `catch (err)` | `console.error('invite-candidate error:', err)` | fixed literal `'Internal server error'`, nothing interpolated |
| `send-email/index.ts:291-296` | `catch (err)` | `console.error('send-email error:', err)` | fixed literal `'Internal server error'`, nothing interpolated |

All three are now identical in shape. I also traced the try/catch nesting in each file
(`grep -nE '^\s*(try \{|\} catch)'`) to confirm every `requireEnv`/`requireVerifyClaimBinding` throw
sits **between** an inner arm's close and the outer arm's open, so each surfaces only at the outer,
opaque arm — not at some narrower arm that might still echo `err.message`. Confirmed for all three
files.

The SUMMARYs' claim that `invite-candidate` and `send-email` **originally** did NOT do this (both
returned raw `err.message` with no logging, contradicting their own plans' threat rows T-155-10 and
T-155-23) is corroborated by the fact that both files now carry an explicit repair comment naming
exactly this defect and citing the "matches the identity-callback convention" fix — consistent with
a real, needed repair rather than a retrofitted narrative.

### 3. base64url decoding on the authorisation paths, with genuine negative controls

**VERIFIED.** `apps/supabase/supabase/functions/invite-candidate/jwtSegment.ts` and its
byte-identical `send-email` copy (`cmp` exits 0 — confirmed by me) translate `-`→`+`, `_`→`/`, pad to
a multiple of 4, `atob`, then `TextDecoder`. Read `jwtSegment.test.ts`: the fixture is a real payload
with a `"marker":"~~~"` field, and the FIRST assertion in the round-trip test is
`expect(/[-_]/.test(ADMIN_SEGMENT), 'fixture must actually exercise the base64url alphabet').toBe(true)`
— the premise is checked before the negative control fires, so the control cannot silently degrade
into a tautology (RESEARCH measured 0-of-2205 realistic payloads containing `-`/`_`, so an
unguarded fixture would pass either way). `send-email`'s copy additionally asserts a "control on the
control" (`UNMARKED_SEGMENT` — the same payload without the marker — genuinely contains neither
character and the OLD expression parses it happily), which is a stronger proof than the sibling file
carries.

Both test files re-run clean by me (part of the 55/55 above).

### 4. The D-D2 guard is real, live, keepable, and I made it fail myself

**VERIFIED, by direct manipulation, not by reading the SUMMARY's claim of manipulation.**

```
$ node scripts/assert-edge-env-defaults.mjs
Edge-function environment-default guard (phase 155: REVIEW-EDGE-02) — files scanned: 17;
checks live: 3 of 3 (env-default; copy-drift; vitest-reachability). 0 violation(s).
exit: 0
```

`grep -n "assert:edge-env-defaults" package.json` confirms it is chained as the **last** link
(8th of 8) of `lint:check`, with no flag, no ignore-file and no opt-out route in the script itself
(verified by reading the whole file — `NO OPT-OUT, BY CONSTRUCTION` section, and the two named
exclusions are hard-coded constants with the reasons written beside them).

**I injected a real silent default** into `send-email/index.ts` (`const verifierInjectedTest =
Deno.env.get('VERIFIER_INJECTED_TEST') || 'fallback';` prepended as line 1) and re-ran the guard:

```
[ERROR] scripts/assert-edge-env-defaults.mjs: apps/supabase/supabase/functions/send-email/index.ts:1:
an environment read is followed by '||' ... 1 violation(s).
exit: 1
```

Then reverted (`cp` from a pre-injection backup) and confirmed `0 violation(s)`, exit 0, and
`git status --porcelain -- apps/supabase` empty. **The guard genuinely goes red naming the exact
file:line and returns to green on revert — not asserted, observed.**

I also ran `yarn lint:check` end to end myself: exit 0, 22/22 turbo tasks, all four repo guards
green, with the edge-env-defaults guard's line appearing last in the output as claimed.

Comment-exclusion is real, not merely claimed: the tree currently has four docstrings across the
three `envConfig.ts` copies that quote `Deno.env.get('X') || fallback` in prose to explain why the
shape is abolished, and the guard still reports 0 violations with them present (I read the guard's
comment-span-classifier logic, which is imported from `scripts/lib/comment-spans.mjs` — the same
classifier phase 152's `assert-comment-hygiene.mjs` uses, extracted for reuse rather than
hand-rolled a third time).

## Judgement Questions

### 1. Is the D-D2 class actually closed, or only the six/seven instances this phase knew about?

**The exact pattern (`Deno.env.get(...) ?? / ||`) is closed repo-wide, not just in the three
functions.** I ran my own repo-wide sweep (`git grep -nE "Deno\.env\.get\([^)]*\)[[:space:]]*(\?\?|\|\|)"`
over the whole tree, excluding markdown) and got exactly the same four docstring hits the guard's
own comment-exclusion already accounts for, and zero code hits anywhere outside the functions tree.
`Deno.env.get` does not exist outside Deno runtimes, so this specific operator/pattern combination is
inherently scoped to the Edge Functions.

**The consequence class is NOT fully closed, and this is honestly disclosed rather than hidden.**
Two distinct discoveries survive, both correctly filed rather than silently dropped:

- **The equivalent `process.env.X || fallback` shape exists outside the Edge Functions**, in
  `packages/dev-seed` (4 sites: `cli/seed.ts:184`, `cli/teardown.ts:178`,
  `supabaseAdminClient.ts:31,38`) and `apps/supabase/scripts/lint-schema.mjs:25` and
  `apps/supabase/benchmarks/k6/config.js:12`. I independently swept for this
  (`git grep -nE "process\.env\.[A-Za-z_]+[[:space:]]*(\?\?|\|\|)"` scoped to `apps/*`, `packages/*`,
  `scripts/*`, excluding tests) and found **exactly these five sites and no more** — matching the
  five todos filed under `.planning/todos/pending/2026-08-29-*.md`, each with correct file:line
  anchors I independently re-measured. This class is genuinely outside the phase's declared
  boundary (`REVIEW-EDGE-02` is Edge-Function-scoped) and was never claimed closed by the phase — it
  is filed, which is the correct disposition per D-N2.
- **The non-null-assertion shape (`Deno.env.get('X')!`) is a different operator with the same
  consequence and is NOT covered by the guard, by design.** I confirmed
  `.planning/todos/pending/2026-08-29-edge-function-non-null-env-assertions.md`'s claim of 13 sites
  across 8 lines in the three functions with `git grep -nP "Deno\.env\.get\([^)]*\)\s*!" --
  apps/supabase/supabase/functions` — all 8 lines matched the todo's list. The guard's check 1
  regex (`ENV_DEFAULT_RE`) only matches `??`/`||`, confirmed by reading the source, so these are
  genuinely invisible to it. This is a real residual gap: an unset `SUPABASE_URL` or
  `IDENTITY_PROVIDER_JWKS_URI`/`IDENTITY_PROVIDER_DECRYPTION_JWKS` still produces an unnamed
  `TypeError`/`SyntaxError` rather than a message naming the variable, on paths including the JWE
  decryption path of a `--no-verify-jwt` endpoint. **What the guard cannot see: any environment
  read that fails silently through an operator other than `??`/`||` — non-null assertions, `if
  (!x) x = default`, destructuring defaults, etc.** This is correctly filed (severity: medium) and
  not silently absorbed into "the class is closed."

**Verdict: the exact `??`/`||` pattern is closed and guarded repo-wide (nothing left within the
guard's own predicate). The broader "silent default for missing config" consequence class is
NOT closed — a same-shape defect survives in `packages/dev-seed` and `apps/supabase/scripts`
(outside phase scope, filed), and a same-consequence, different-operator defect (non-null
assertions) survives inside the very functions this phase hardened (filed, guard's stated
non-coverage disclosed in its own docblock). Both gaps are disclosed, anchored and filed — not
hidden — so this is not scored as a phase defect, but it is real residual risk worth surfacing
explicitly here per the verification brief's request.**

### 2. Is the `aud`/`iss` fix bypassable?

**No bypass found.** Traced rather than assumed:
- `jose.jwtVerify` is called exactly once in the Edge Function tree (`identity-callback/index.ts:81`).
- `verifyJwt()`, the only function that calls it, is called exactly once in the file (`:207`, inside
  the request handler's main try block).
- The audience/issuer binding is computed by `requireVerifyClaimBinding` unconditionally, two lines
  before the `jwtVerify` call, with no `if`/early-return path between the two that could skip it.
- There is no second JWT-verification code path in this Edge Function (the JWE decrypt step at
  `decryptJweToken` is a distinct operation — decryption, not signature verification — and does not
  call `jwtVerify`).

A future caller cannot reach `jose.jwtVerify` from within this file without going through
`verifyJwt()`, and `verifyJwt()` cannot reach `jose.jwtVerify` without first computing the binding.
This is what "structural rather than positional" means in practice, and it holds.

(Out of this phase's scope, noted for completeness: the frontend's own `decryptAndVerifyIdToken.ts:133`
is a separate `jwtVerify` call in a different runtime, covered by Phase 142.1, not by this phase. The
"fourth verifier copy" divergence between the two remains a filed, out-of-scope todo, as the CONTEXT
states.)

### 3. The `DEFAULT_PROJECT_ID` vs. issuer ordering correction — confirmed in source

**VERIFIED.** Read `identity-callback/index.ts:155-208`. The sequence, in order, is:

1. `:153` — `requireEnv('IDENTITY_PROVIDER_TYPE', ...)`
2. `:165-172` — parse the request body
3. **`:182`** — `const projectId = project_id || requireEnv('DEFAULT_PROJECT_ID', Deno.env.get('DEFAULT_PROJECT_ID'));`
4. `:186-198` — decrypt the JWE if present
5. **`:207`** — `payload = await verifyJwt(innerJwt);`

`DEFAULT_PROJECT_ID` is read and can throw at line 182, strictly before `verifyJwt` (and therefore
before `requireVerifyClaimBinding`) is ever reached, on any real HTTP request that does not supply a
`project_id` in its body. 155-01's original claim that the pre-155 recipe would reject with
`ERR_ISSUER_UNCONFIGURED` describes only the isolated token-verification path (`verifyJwt` called
directly, bypassing the handler); a real request against the handler hits `DEFAULT_PROJECT_ID`
first, exactly as 155-06 corrected. **This is the offline-token-path shortcut the verification brief
asked about, and I checked whether any other phase-155 claim rests on the same shortcut**: the other
`requireEnv`/`requireVerifyClaimBinding` unit tests (verifyConfig.test.ts, envConfig.test.ts ×3,
jwtSegment.test.ts ×2, templateVars.test.ts) all test the extracted pure function directly, which is
the correct and standard way to unit-test an extracted module — they do not make an end-to-end
ordering claim the way 155-01's original human-check narrative did. I found no other claim in the
six summaries that asserts a full-request behavioural sequence without either (a) a served run
(identity-callback, closed by 155-06's `PLAYWRIGHT_BANK_AUTH` run) or (b) an explicit
`human_judgment: true` flag disclosing that no served run occurred (`invite-candidate`, `send-email`
— windows 158, 167, still open, honestly so, since neither function has a live caller anywhere in
the product or the test suite).

## Independent Sweeps I Ran (not inherited from the phase's own scans)

Per the verification brief's warning that this phase's own scans lied twice silently, I reproduced
the two named hazards myself rather than trusting the phase's account of them:

- **`git grep -E` has no `\b` on this git.** `git grep -E "\bports\b" -- apps/supabase/supabase/config.toml`
  → 0 hits (silent, no error). `git grep -P "\bport\b" -- apps/supabase/supabase/config.toml` →
  finds `port = 54321` and others. **Confirmed independently: the `-E` blind spot is real on this
  machine.**
- **`packages/*/src` matches nothing.** `git ls-files 'packages/*/src'` → 0. `git ls-files
  'packages/*/src/*'` → 463. **Confirmed independently: the glob blind spot is real.**

## Evidence Claims — checked against disk, not against prose

- **Commits.** All 21 commit SHAs cited across the six summaries resolve via `git cat-file -e`
  (spot-checked the full set, not a sample): `61bb8cb36 869a01d60 636b4e7a2 7d6079426 eb6b4fa6d
  0bdfab19f f53f324d3 6b2a6ec21 465cc4bdd b5bf954dd 1ecb51c54 a6fe54d7d f0fdde5fb d0740772d
  bcae09a05 e5e720b8e 7cda70ea7 c22a60848 99eebb4eb 17ef44ce4 0433b66e3` — all OK. Phase-close
  commit `c0986edaa` and its predecessor `18d9e100b` also present in `git log`.
- **Byte-identity.** `cmp` on all three `envConfig.ts` copies (identity-callback / invite-candidate /
  send-email) and both `jwtSegment.ts` copies (invite-candidate / send-email): all exit 0. Re-run by
  me directly, not inherited.
- **`.env.example` coverage.** `git show HEAD:.env.example | grep -cE
  '^(IDENTITY_PROVIDER_TYPE|IDENTITY_PROVIDER_CLIENT_ID|DEFAULT_PROJECT_ID|SITE_URL|SMTP_HOST|SMTP_PORT|SMTP_FROM)='`
  → 7. `IDENTITY_PROVIDER_ISSUER` also present at `:62`.
- **Negative-control ledger.** `.planning/phases/.../155-NEGATIVE-CONTROL-LEDGER.md` has three rows,
  all reading `CONFIRMED`, with pre-registered "what a failure would have looked like" statements
  per row (not just a pass/fail cell) and flip-tests on row 3 (both directions independently red).
  I did not re-verify every cited absolute `/private/tmp` or `/var/folders` log path (these are
  documented in the ledger itself as ephemeral, OS-cleared paths, consistent with them not surviving
  to my session) — the durable evidence is the permanent in-suite assertions, which I did re-run
  (55/55 green, including the specific negative-control test names cited).
- **Five filed todos.** All exist at the claimed paths with correct frontmatter (`created`, `title`,
  `area`, `severity`, `source`, `files`), and I independently re-measured every file:line anchor
  cited in three of the five (the non-null-assertion todo, the dev-seed todo, the
  supabase-tooling todo) — all matched.
- **WINDOWS.md.** Entries 150–177 all exist and are tagged phase 155, matching the summaries'
  citations. Window 172 reads `fixed`; the rest read `open` (correctly — several are deliberate
  `todo`/`unrun-verify` dispositions, not phase defects).
- **`155-SIGNICAT-SUBJECT-CITATION.md`** exists, is 215 lines, contains three dated 2026-08-29
  sources with SHA-256 hashes and verbatim quotes. `claimConfig.ts`'s docstring carries the `ftn_sub`
  prohibition in the provider's own words, matching the citation.
- **Bank-auth E2E run (8/8).** **Independently confirmed from disk, not from the SUMMARY's
  narration.** `tests/playwright-report/index.html` (dated 2026-08-29 09:53, same day as the phase
  close) embeds a base64-encoded zip report; I extracted and decoded it directly:
  ```json
  { "total": 8, "expected": 8, "unexpected": 0, "flaky": 0, "skipped": 0, "ok": true }
  ```
  This matches 155-06's claim exactly and is genuine artifact evidence, not a transcription.
- **Default E2E suite (150/150).** **NOT independently re-run or re-confirmed from a surviving
  artifact.** The `tests/playwright-report/index.html` file on disk holds only the LATEST run
  (the bank-auth 8/8 report above, which ran after the default-suite run per the summary's own task
  ordering), so the 150/150 report was overwritten before I could decode it. I did not re-run the
  full suite myself (see `not_performed` in frontmatter — starting `db:reset` + a fresh dev server +
  a ~10-minute suite run was judged unsafe to launch unattended mid-verification, and the phase's own
  described methodology — "decode the report payload, not the console tail" — is exactly what I
  could not do without a surviving artifact or a fresh run). Corroborating, not equivalent, evidence:
  `yarn build` (14/14) and `yarn test:unit` (25/25, exit 0) both re-run clean by me at current HEAD,
  and no application source outside the Edge Functions / `scripts/` tree was touched by any of the
  six plans (confirmed by each SUMMARY's own `key-files` list and my own reading of the diffs), so
  there is no plausible mechanism by which this phase would move the default suite's count. This is
  recorded as an open, honestly-flagged gap rather than asserted either way.

## Additional Spot-Checks (amendment pass)

- **`config.toml` hand-off todo.** `git status --porcelain apps/supabase/supabase/config.toml` is
  empty — confirmed untouched, matching the "handed off by naming, not edited" claim. I did not
  reproduce the exact "15 hits" count with a matching methodology (my own rough greps for
  `127.0.0.1|localhost|<4-5 digit number>` returned varying counts from 4 to 21 depending on regex
  specificity, which is not the same counting rule the sweep document uses) — the qualitative claim
  (multiple hard-coded ports/hosts present, file untouched, handed to Phase 156) is confirmed; the
  precise count of 15 is not independently reproduced and is not treated as verified-exact, only as
  plausible and non-blocking (Phase 156's problem either way).
- **`DEFAULT_SEED_PROJECT_ID` unreferenced-constant todo.** Anchor claimed:
  `identity-callback/index.ts:33`. Confirmed exact — `grep -n DEFAULT_SEED_PROJECT_ID
  apps/supabase/supabase/functions/identity-callback/index.ts` returns `33:const
  DEFAULT_SEED_PROJECT_ID = '00000000-0000-0000-0000-000000000001';`, a byte-exact match to the
  todo's cited line. No drift.

## Gates Re-Run at HEAD

| Gate | Result |
|---|---|
| `node scripts/assert-edge-env-defaults.mjs` | exit 0, 17 files, 0 violations (re-run by me) |
| Injected default → guard | exit 1, names exact file:line (`send-email/index.ts:1`) — re-created by me, reverted, confirmed clean |
| `yarn lint:check` | exit 0, 22/22 turbo tasks, all 4 guards green, edge-env-defaults guard last |
| `yarn workspace @openvaa/supabase test:unit` (via `vitest run supabase/functions`) | 55/55 pass |
| `packages/dev-seed` `edgeEnvDefaultsGate.test.ts` (guard-wiring membership test) | 4/4 pass |
| `yarn test:unit` | 25/25 turbo tasks, exit 0 |
| `yarn build` | 14/14 turbo tasks |
| `yarn db:lint:sql` | **fail-on-warning exit**, three named PL/pgSQL warnings (`_bulk_upsert_record`, `is_localized_string`, `resolve_email_variables`) — all pre-existing, unrelated to any file this phase touched. **Not scored as a regression**, per the verification brief's explicit instruction. |
| `yarn test:e2e` (default suite, 150/150 claim) | **not re-run — see `not_performed` above** |

## What Must NOT Be Penalised (confirmed, not merely accepted)

1. **`REVIEW-EDGE-04` remains unchecked in `REQUIREMENTS.md:116`**, with an explicit `⚠ Already
   satisfied on the code as of Phase 142.1` annotation. Confirmed at `.planning/REQUIREMENTS.md:116`
   and the tracking table row at `:279` (`Retired on evidence ... doc-verification residue only`).
   This is exactly the tooling-matcher limitation the SUMMARY describes (`mark-complete` tests
   `/^(pending|gaps found)$/i` against the trimmed whole cell, so a correct-but-annotated status
   is rejected) — not a hand-edit, not a hidden defect. **Outstanding operator decision, not a
   phase gap.**
2. **The dead `siteUrl` binding (`identity-callback/index.ts:318`) and the three `details:` leaks**
   were confirmed still present and confirmed declined-with-reason (all three source-touching plans
   in this phase state no source change to these; the dead binding has zero runtime effect since
   nothing reads `siteUrl` — `grep -n siteUrl` returns exactly one hit, its own declaration).
3. **The operator's actual root `.env` sets none of `SITE_URL`/`SMTP_HOST`/`SMTP_PORT`/`SMTP_FROM`.**
   This is the intended D-D2 failure state (loud, named throws instead of silent wrong behaviour),
   already reported to the operator by 155-06. Not independently re-verified by me (`.env` reads are
   sandbox-restricted for this session, same as for the executing plans), but the design intent is
   confirmed correct by code inspection: an unset `SMTP_HOST` now throws `ERR_ENV_UNCONFIGURED`
   naming the variable rather than silently defaulting to `inbucket`.

## Requirements Coverage

| Requirement | Status | Evidence |
|---|---|---|
| REVIEW-EDGE-01 | ✓ SATISFIED | base64url decode at both sites, negative controls with genuine `-`/`_`, both test files re-run green |
| REVIEW-EDGE-02 | ✓ SATISFIED | 7/7 `??`/`||` sites closed, guard live in `lint:check`, flip-tested by me to red and back |
| REVIEW-EDGE-03 | ✓ SATISFIED | `renderTemplate` whitespace-tolerant, flat-lookup proven against all 5 real producer keys |
| REVIEW-EDGE-04 | **NOT complete (tooling limitation, disclosed)** | substance discharged (`155-SIGNICAT-SUBJECT-CITATION.md`), checkbox blocked by an annotated-status matcher — operator decision needed on the matcher, not on the substance |
| REVIEW-EDGE-05 | ✓ SATISFIED | `aud`/`iss` fail closed, structural binding confirmed by call-graph trace, permanent negative control re-run green |

## Anti-Patterns Scanned

No `TBD`/`FIXME`/`XXX` markers found in any file this phase touched (`git grep -nE
"TBD|FIXME|XXX"` over the key-files lists from all six summaries returned nothing). Comment-hygiene
guard (phase 152's, unrelated to this phase but touching the same files) reports 0 violations over
1,577 files including all files this phase added.

## Human Verification Required

None required for the security properties themselves — every truth in the verification brief was
resolvable by code trace, test re-run, or direct manipulation (the flip-test on the guard).

One item is flagged for a human/CI decision rather than left silently open:

### 1. Re-run the default `yarn test:e2e` suite (150/150 claim) to closure

**Test:** `yarn db:reset && yarn dev` (wait for healthy), then `yarn test:e2e`, on the current HEAD.
**Expected:** `total: 150, expected: 150, unexpected: 0, flaky: 0, skipped: 0, ok: true` — matching
155-06's claim and showing zero delta from phase 154's close.
**Why not done here:** the only surviving `tests/playwright-report/index.html` on disk holds the
LATER bank-auth run (which I did independently decode and which matches its own claim exactly), not
the default-suite run; re-running the full default suite requires a multi-minute, multi-process rig
(DB reset, dev server, ~10min suite) that was not safe to launch unattended inside this verification
pass. Given clean `build`/`test:unit`/`lint:check` at the same HEAD and no application-layer diff in
this phase, risk of an actual regression is assessed as low, but the claim itself is unconfirmed by
direct artifact.

## Gaps Summary

No BLOCKER-level gaps. All four named security properties (aud/iss fail-closed, non-disclosure,
base64url decoding, the D-D2 guard) were independently verified against the running code, not
accepted from prose, including direct manipulation of the guard (inject → red → revert → green) and
direct decoding of a surviving E2E artifact (the bank-auth report).

Two residual-risk items are surfaced per the verification brief's judgement questions, both already
disclosed and filed by the phase itself rather than hidden, and neither blocking:

- The `??`/`||` env-default class is closed and guarded; the broader "silent config default"
  consequence class is not (same shape survives in `packages/dev-seed` and
  `apps/supabase/scripts`, outside this phase's declared scope; a different-operator, same-file,
  same-consequence shape — 13 non-null assertions — survives inside the three hardened functions,
  outside the guard's stated coverage). Both are filed with correct anchors, independently
  re-measured by me and confirmed accurate.
- The default E2E suite's 150/150 claim rests on the SUMMARY's own decode, not on a surviving
  artifact or a re-run performed during this verification (see Human Verification #1).

`REVIEW-EDGE-04`'s unchecked box is a disclosed tooling limitation, not a phase defect, per the
verification brief's explicit instruction not to penalise it.

---

*Verified: 2026-08-29*
*Verifier: Claude (gsd-verifier)*
