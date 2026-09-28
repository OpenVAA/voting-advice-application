---
phase: 142-assertion-design-wiring-only-tests-assert-output
plan: 06
subsystem: testing
tags: [gates, negative-control, assertion-design, e2e, bank-auth, record-propagation, todo-reconciliation]

# Dependency graph
requires:
  - phase: 142-assertion-design-wiring-only-tests-assert-output
    plan: 04
    provides: 'The last revert and last post-gate of the phase, so the gates could run on a clean tree; the A-05 environment decision taken at that plan''s checkpoint; the B-1 blocked-instruction record; P-2''s first half'
  - phase: 142-assertion-design-wiring-only-tests-assert-output
    plan: 03
    provides: 'The 12-row negative-control ledger this plan completes with its gate section and final counts'
  - phase: 141-package-unit-test-coverage-test-unit-invariant-guard
    provides: 'The `test:unit` coverage guard whose two checks are the belt to the D-14 gate''s braces — it names the 11 executing and 4 deliberately-unwired workspaces, so a workspace silently not executing fails loudly'
  - phase: 137-e2e-preflight-integrity
    provides: 'The unbypassable served-application preflight, which mattered concretely here: an unrelated project''s Vite server was holding :5173 at gate time'
provides:
  - 'D-14 satisfied: root `yarn test:unit` exit 0 on three consecutive runs under parallel turbo load, each logged, coverage guard clean, no cached test result, all five edited workspaces confirmed executing'
  - 'D-16 satisfied: full `yarn test:e2e` exit 0, 135 passed, zero skipped, zero did-not-run, first attempt'
  - 'A-05 satisfied: the opt-in bank-auth gate RAN and passed — 121 passed, `bank-auth` 6 tests + `bank-auth-journey` 1 test, both verified to have actually executed'
  - 'D-18 satisfied: 12 remediation annotations in the audit naming commit and ledger row, plus ASSERT-07 evidence clauses in REQUIREMENTS.md and ROADMAP.md, with all four records cross-checked to agree'
  - 'The withdrawal count of 0 stated explicitly in all four records rather than implied — ROADMAP criterion 4 satisfied vacuously AND visibly'
  - 'F17''s scoped exception to criterion 1 made visible in the ledger, the audit annotation and the evidence clauses — not rounded away'
  - 'P-2 half 2: a NEW finding of the sweep''s own class — the provider tests that pin `getIdTokenClaims` are wiring-only, which is why the duplication drifted undetected'
  - 'Standing todos reconciled against what actually happened: A-10''s closed as already-done, P-1 and P-2 filed, D-19 i/ii/iii and the three D-01 exclusions left open'
affects: []

actuals:
  tokens: 18950
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - 'A gate result is recorded with its exit code, its counts and its out-of-repo log path, or it is not recorded — this is the phase that exists to separate a stated result from a measured one, so its own closing record must not violate that'
    - 'Verify that an opt-in Playwright project actually EXECUTED rather than trusting a green exit: a project reporting 0 tests is a did-not-run and therefore a cardinal failure, and a green suite exit looks identical either way'
    - 'When a port is held by an unrelated process, use the sanctioned `FRONTEND_PORT` escape hatch on BOTH the dev server and the runner rather than killing someone else''s work — and record the deviation with its cause'
    - 'Derive a shared count ONCE, in the source document, and propagate the derivation rather than the number — three targets that disagree are worse than one that is silent, because each looks authoritative'
    - 'Reconcile todos against what happened, not against what the plan predicted: two of the five items this plan was told to capture described work the operator had already directed be fixed'

key-files:
  created:
    - .planning/todos/pending/provider-getidtokenclaims-duplication.md
    - .planning/todos/pending/condenser-run-result-arguments-nested.md
  modified:
    - .planning/phases/142-assertion-design-wiring-only-tests-assert-output/142-NEGATIVE-CONTROL-LEDGER.md
    - .planning/phases/142-assertion-design-wiring-only-tests-assert-output/deferred-items.md
    - .planning/audits/2026-08-11-fake-guard-sweep.md
    - .planning/REQUIREMENTS.md
    - .planning/ROADMAP.md
    - .planning/WINDOWS.md
    - .planning/todos/done/playwright-config-bank-auth-doc-drift.md

key-decisions:
  - 'The bank-auth gate was RUN rather than recorded as an environment gap. The runbook''s own sanctioned key source (`supabase status -o env`) supplied ANON_KEY/SERVICE_ROLE_KEY without touching the permission-denied `.env`, so B-1''s block did not have to become a coverage gap — but B-1 itself is re-confirmed OPEN, since `.env.example` still lacks the key'
  - 'No read-around of the `.env` deny was attempted — not `git show`, not `cat`, not a dotenv-loading script to extract the value programmatically, which would have been the same circumvention wearing a different hat'
  - 'FRONTEND_PORT=5174 rather than killing the unrelated project holding :5173. Applied to BOTH the dev server and both Playwright runs so they cannot disagree; the preflight still ran and still passed, since FRONTEND_PORT moves the target rather than skipping the check'
  - 'The full suite was run against a STOCK dev server and the bank-auth projects against a separate one carrying the mock-IdP env, rather than sharing one server. Two dev-server lifecycles cost ~2 minutes and keep the D-16 gate free of test-only IdP configuration'
  - 'P-2 half 2 is filed as a FINDING of the sweep''s own class, not as a coverage gap. Mis-filing it as missing coverage is exactly what would let it survive a second sweep'
  - 'A-10''s todo was CLOSED rather than left open, and no todo was filed for the api/cache swallow or the getIdTokenClaims import-time parse — all three were fixed under the operator''s scope expansion. The plan instructed capture; capturing them would have filed todos for completed work'
  - 'The ASSERT-07 checkbox was found ALREADY flipped by 142-04, contradicting the plan''s premise that it had been held unmarked through all five prior plans. Recorded in the evidence clause rather than quietly accepted'

patterns-established:
  - 'Derive-once-propagate-thrice: the ledger carries a Final counts table with a derivation column explaining what each number means, and the other three targets quote it. The pair count is 12 = 11 + 1, not 12 = one per finding, and the table says so'
  - 'Name the measurements that are deliberately NOT counted. Three sit beside the twelve pairs (F17''s N/A cells, F20-1''s supplementary B, F20-3''s B′) and each would inflate the total if silently included'

requirements-completed: [ASSERT-07]

metrics:
  duration: ~50 min
  completed: 2026-08-21

status: complete
---

# Phase 142 Plan 06: Gates and Record Propagation Summary

Closed ASSERT-07 by proving the phase holds under its gates — three consecutive green root unit runs
under parallel turbo load, plus **both** halves of the dual E2E gate green first-attempt including the
opt-in bank-auth projects that nothing in CI ever runs — and landing the enumeration in three
propagation targets that agree with the ledger and with each other.

## What was done

### Task 1 — ledger completion and the D-14 unit gate

**Entry checks first.** All three `<gate_preconditions>` passed before any command: scoped porcelain
printed nothing, the phase-marker grep exited 1, and the auth-scoped `git diff --exit-code` exited 0.
This is not ceremony — `turbo.json` declares `test:unit` with `dependsOn: ["build"]`, so a root run
over a live `packages/*/src` injection would hand the injected `dist/` to every dependent.

**The ledger arrived more complete than the plan assumed.** All twelve rows plus the supplementary
row 5s already carried verdicts (`remediated`, uniformly); the withdrawal count already read 0 with
D-13's bar reproduced; the scoped-exceptions section already held exactly the F17 entry with its
four-part reasoning; and **no measurement cell read `pending`** — the nine remaining occurrences of
that word are prose describing the ordering guarantee, plus `todos/pending/` paths. What was genuinely
missing was the **gate section** and a **derived count block**, both of which this plan added.

**The D-14 gate — three consecutive greens, first attempt, no retries:**

| Run | Exit | Shell wall | Turbo `Time:` | Log |
|---|---|---|---|---|
| 1 | **0** | 25 s | 21.610 s | `${TMPDIR}/gsd-142/unit-gate-1.log` |
| 2 | **0** | 22 s | 19.618 s | `${TMPDIR}/gsd-142/unit-gate-2.log` |
| 3 | **0** | 22 s | 20.273 s | `${TMPDIR}/gsd-142/unit-gate-3.log` |

Identical in all three: Phase 141's guard reporting `Check 1: 0 violation(s)` / `Check 2: 0
violation(s)`, 11 workspaces executed and the same 4 unwired by name; `Tasks: 25 successful, 25 total`;
and **`cache bypass, force executing` 11 times per run** — once per `test:unit` task, which is the
direct evidence no test result came from cache. The 14 cache hits are `build` tasks.

**Per-workspace counts against `142-RESEARCH.md` § D.1's measured pre-phase baseline:**

| Workspace | Baseline | Gate | Δ |
|---|---|---|---|
| **`@openvaa/question-info`** | 20 | **22** | **+2** |
| `@openvaa/argument-condensation` | 30 | 30 | 0 |
| `@openvaa/data` | 244 | 244 | 0 |
| `@openvaa/dev-seed` | 446 | 446 | 0 |
| `@openvaa/frontend` | 773 | 773 | 0 |
| *(six unedited workspaces)* | 149 | 149 | 0 |
| **Total** | **1 662** | **1 664** | **+2** |

All five edited workspaces executed under turbo in every run. The **+2** is exactly the expected
shape — `question-info` gains A-04's same-name/varying-type fixture (T2/T3). **Every other edited
workspace is unchanged, and that is correct rather than suspicious:** those remediations strengthened
existing assertions in place (added matchers, rewrote a test, renamed a file) and E9 *deleted* a
wall-clock line without deleting its test.

### Task 2 — the dual E2E gate

**Both runs first-attempt, neither retried.** Prerequisites per D-15: `yarn db:reset` (DB only — not
`dev:reset`, which would wipe the vite cache mid-gate), exactly one hand-started dev server, no
Playwright `webServer` for the app.

| Gate | Command | Exit | Result | Wall |
|---|---|---|---|---|
| **1 — full suite (D-16)** | `FRONTEND_PORT=5174 yarn test:e2e` | **0** | **135 passed**, 0 failed, 0 skipped, **0 did-not-run** | 680 s |
| **2 — opt-in bank-auth (A-05)** | `PLAYWRIGHT_BANK_AUTH=1 FRONTEND_PORT=5174 npx playwright test -c ./tests/playwright.config.ts --project=bank-auth --project=bank-auth-journey` | **0** | **121 passed**, 0 failed, 0 skipped, **0 did-not-run** | 687 s |

Both logged (`e2e-full-1.log`, `e2e-bankauth-1.log`); both preceded and followed by a scoped porcelain
check printing nothing; both carrying the preflight verdict
`E2E PREFLIGHT OK …/apps/frontend (verified against …/voting-advice-application-gsd)`.

**Gate 2's projects were verified to have ACTUALLY EXECUTED, not merely to have exited 0.** A project
reporting 0 tests is a did-not-run and therefore a cardinal failure, and a green exit looks identical
either way. `bank-auth` ran **6** tests by title (create-candidate via the Edge Function, magic-link
session, wrong-decryption-key rejection, invalid-token rejection, missing-id_token rejection, CORS
preflight); `bank-auth-journey` ran **1** — the full self-registration journey through the real
authorize→callback→exchange→decrypt chain. The other 114 are the transitive serial perm chain, which
is why this gate costs full-suite wall-clock. `grep -c 'skipped|did not run|interrupted'` over the log
returns **0**.

**What Gate 1 does NOT prove, corrected on the record.** D-16 locked the full-suite gate on the
rationale that the Phase-122 bank-auth specs exercise the authorize endpoint directly. **A-05 measured
that claim and it is factually wrong** — the specs sit behind an opt-in guard and nothing sets
`PLAYWRIGHT_BANK_AUTH`, CI included. So Gate 1 proves the three product changes broke nothing *else*;
**Gate 2 is what exercised the endpoint D-02 changed.** Without A-05's widening, the one product change
with an E2E surface would have shipped unexercised at that level.

### Task 3 — propagation to three targets, and todo reconciliation

**Audit** (`.planning/audits/2026-08-11-fake-guard-sweep.md`): twelve remediation annotations, each
naming its commit and its ledger row, with the original finding text left intact — annotation, not
rewrite. Plus a § Remediation status table near the top carrying the counts. F17's annotation spells
out the scoped exception and the words **"remediated, not withdrawn"**. **No finding is struck**, and
that is stated rather than implied: 139 § 6's strike-rather-than-delete precedent applies only to
withdrawals, and there are none.

| Finding | Ledger row | Commit(s) |
|---|---|---|
| F15-A | 1 | `0d3700e58`, `80acc432c` (tests) · `0bc21e3b3`, `0b15c5e86` (D-01 product) |
| F15-B | 2 | `fbb103c10` |
| F15-C | 3 | `fbb103c10` (same injection instance as row 2) |
| F16 | 4 | `73eda4ff7` |
| F17 | 5 + 5s | `a25355369` |
| F18 | 6 | `c456a381f` |
| F20-1 | 7 | `ea5d34109` (test) · `0f8e99a68` (D-02/A-02 product) |
| F20-2 | 8 | `cba97b2a1` |
| F20-3 | 9 | `ea5d34109` (test) · `0f8e99a68` (A-07 product) |
| F20-4 | 10 | `2372935bf` |
| F20-5 | 11 | `a02b92e51` |
| F20-6 | 12 | `8e71038c1` |

**REQUIREMENTS + ROADMAP:** ASSERT-07 carries an ASSERT-01-style evidence clause with the ledger path
and all three counts; the ROADMAP phase line is marked complete, the plan list filled to 6/6, and each
of criteria 1 / 4 / 5 traced to what satisfies it.

## The counts, and what they mean

**All four records agree — verified by reading all four, not by assuming the edits matched.**

> **⚠ AMENDED 2026-08-21 by the W-1 gap-closure pass — this table was edited after `142-06` closed, and
> says so rather than being rewritten silently.** Phase verification (`142-VERIFICATION.md`) returned
> `human_needed` on finding **W-1**: Configuration 2 of `questionTypes.test.ts` carried no assertion on
> the composed prompt. Closing it added ledger row **1s**, a second measured pair for F15-A. **As
> executed by `142-06` the pair count was 12 (11 + 1); it is now 13 (11 + 1 + 1)**, and the rows below
> carry the current figures so this table does not diverge from the other three records. Nothing else in
> this summary was touched. Gap-closure record: `142-W1-SUMMARY.md`.

| Count | Value | What it actually means |
|---|---|---|
| Corpus | **12** | D-00. F19a/b/c are ASSERT-03's class, closed by Phase 140 |
| **Remediated** | **12** | every row's verdict |
| **Withdrawn** | **0** | D-13's bar never met. **F17 is not a withdrawal** |
| **Negative-control pairs** | **13** *(was 12 at `142-06` close)* | **11 + 1 + 1**, not "one per finding" |
| ↳ under 139's pre-specified regression | 11 | rows 1, 2, 3, 4, 6, 7, 8, 9, 10, 11, 12 |
| ↳ supplementary | 2 | row **5s** (F17) and row **1s** (F15-A's Configuration 2, W-1) — each a new injection with **both** halves measured |
| ↳ OLD half cited from 139 § 5.N.4 | 8 | rows 2, 3, 4, 6, 8, 10, 11, 12 |
| ↳ OLD half re-run in this phase | 5 | rows 1, 7, 9 (D-06 exceptions) and 5s, 1s |
| NEW halves measured here | **13** | every one — there is no NEW-half citation in 139 to borrow |
| **Scoped exceptions to criterion 1** | **1** | **F17 / row 5 only** |

**The pair count is not simply 13-because-twelve-findings.** Row 5 (F17) contributes **no** pair — its
cells read `N/A — by construction` (A-06). Row 5s contributes one under a *new* injection, and row 1s a
second one for F15-A. 11 + 1 + 1 = 13, and the arithmetic is written down in all four records so it
reads as legible rather than surprising.

**Four measurements sit beside the thirteen and are deliberately NOT counted**, because each would
inflate the total:

1. **F17's row 5** itself — counting the finding as a pair would hide the exception.
2. **F20-1's supplementary injection B post-fix** (9/9 pass, labelled `not the negative control`) — a
   *third* measurement on that row, evidence the swallow is gone, not a second pair.
3. **F20-3's B′** — the symmetric relocation of B. B and B′ together are the **one** pair that proves
   the two sites are genuinely discriminated, each red alone under its own branch and green under the
   other's.
4. *(added by the W-1 pass)* **Row 1s's two injections, Q and C** — same shape as B/B′. Both halves were
   measured under both, because the row asserts on two axes (type string, choice labels). Counting them
   separately would report 14.

**The exception is not rounded away.** F17's `N/A — by construction` appears in the ledger row, the
Final counts table, the scoped-exceptions section, the audit annotation, and both evidence clauses.
Its visibility is the point.

## P-2, recorded precisely — the phase's highest-value follow-up

Independently confirmed, and **worse than `142-04`'s report stated**:

- **`/api/oidc/token/+server.ts:26` calls `provider.getIdTokenClaims(idToken)`** — the providers' own
  implementations at `providers/idura.ts:114` and `providers/signicat.ts:77` — **not** the standalone
  `getIdTokenClaims.ts` helper A-07's two-code split fixed. Each provider carries a duplicated copy
  including an identical **uncoded** kid-lookup throw and its own `JSON.parse` of the same env var, and
  neither has the lazy-parse property `0f8e99a68` gave the helper.
- **Not in wave 5's report, measured here:** `providers/idura.test.ts:90-91` and
  `providers/signicat.test.ts:54-55` assert only
  `expect(typeof provider.getIdTokenClaims).toBe('function')` under titles claiming the method is
  *implemented*. **That is itself a wiring-only assertion of exactly the class ASSERT-07 remediates.**
  It was never in the twelve-finding corpus, and it is almost certainly *why* the duplicated copies
  drifted from the helper undetected — it is the only thing pinning the method on either provider, and
  it stays green no matter what the method does. Filed as a **finding of the sweep's own class**, not
  as a coverage gap.

**What this means for A-07, stated plainly:** the **phase criterion is met** — D-11 E6 asks that
F20-3's two *tests* differ observably against the helper they exercise, and ledger row 9's B/B′ pair
measures exactly that — **but the production path is untouched**, so the operational benefit of the
split does not yet reach `/api/oidc/token`. Neither gate exercises it there: Gate 2 walks the success
path and does not discriminate the two codes. Recorded in the ledger, `deferred-items.md`,
`.planning/WINDOWS.md` (45 + 48) and
`.planning/todos/pending/provider-getidtokenclaims-duplication.md`.

## Todo reconciliation — against what happened, not what the plan predicted

| Item | Disposition |
|---|---|
| D-19 i (six F19-class `!`-on-`null` sites) | **OPEN** — unchanged |
| D-19 ii (`getIdTokenClaims` bad-signature / wrong-issuer / wrong-audience) | **OPEN** — a coverage gap, not a fake guard |
| D-19 iii (D-01's three named exclusions) | **OPEN** — all three; WINDOWS 42/43/44 |
| **P-1** (`Condenser.run()` nesting behind an `as Array<Argument>` cast) | **OPEN — todo created here**; it had been prose only |
| **P-2** (both halves) | **OPEN — marked the highest-value follow-up**; todo created here |
| P-3 (`tsconfig.tsbuildinfo` tracked) · B-1 (`SUPABASE_ANON_KEY`) | **OPEN** |
| ~~**A-10** (Playwright doc drift)~~ | **CLOSED** — superseded by the operator at `142-04`'s checkpoint, fixed in `f4e0fc1ec`, moved to `todos/done/` with the resolution written in |
| ~~`api/cache/+server.ts:56` swallow~~ · ~~`getIdTokenClaims.ts:6` import-time parse~~ | **CLOSED — no todo owed**; both FIXED in `0f8e99a68` under the same expansion |

**The operator-approved scope expansion is recorded as part of the phase record**, not a footnote:
A-10's *"capture as a todo, do not fix"* was explicitly superseded, and three fixes landed beyond
D-02's named scope. Two of the five todos this plan was instructed to capture therefore describe **work
already done**; filing them would have been the stale-record failure this milestone keeps hitting. Two
follow-ups the plan did not anticipate were filed in their place.

## Deviations from Plan

**1. [Rule 3 — blocking] `FRONTEND_PORT=5174` instead of the default `:5173`**
- **Found during:** Task 2, starting the dev server.
- **Issue:** an **unrelated project's** Vite server (`…/Treader/apps/web/…/vite.js dev`) held
  `[::1]:5173`. `yarn dev` failed loudly with `Error: Port 5173 is already in use` — `strictPort`
  doing precisely the job Phase 137 gave it.
- **Fix:** CLAUDE.md's sanctioned `FRONTEND_PORT` escape hatch, applied to **both** the dev server and
  both Playwright runs so they cannot disagree. The runbook independently specifies 5174 for the
  bank-auth run. Killing the other project's server was not attempted.
- **Impact on the gate: none.** The preflight still ran and still passed — `FRONTEND_PORT` moves the
  target, it does not skip the check — and its verdict line is recorded for both runs, naming this
  checkout.

**2. [Rule 2 — missing critical record] ASSERT-07 was already marked `[x]` before the gates ran**
- **Found during:** Task 3, editing `REQUIREMENTS.md:60`.
- **Issue:** the plan's premise was that ASSERT-07 had been correctly held unmarked through all five
  prior plans. It had not — `142-04` flipped it in `743e848d1`, before any gate had run. Each prior
  SUMMARY declares `requirements-completed: [ASSERT-07]`, so the state tooling marked it complete on
  every wave.
- **Fix:** the evidence clause was added, and the early flip is **recorded in the clause itself**
  rather than quietly accepted. Surfacing it is the point — a checkbox marked before its evidence
  exists is the exact failure mode this phase's protocol was built against.

**3. [Rule 3 — blocking, resolved without circumvention] `SUPABASE_ANON_KEY` for Gate 2**
- **Found during:** Task 2, preparing the bank-auth run.
- **Issue:** `candidate-bank-auth.spec.ts:44-49` throws at module load without `SUPABASE_ANON_KEY`,
  which is absent from `.env`; and `.env`/`.env.example` are refused by this environment's permission
  settings, exactly as they were for wave 5 (B-1).
- **Fix:** the values were taken from the **runbook's own sanctioned alternative source** —
  `supabase status -o env` (`ANON_KEY` / `SERVICE_ROLE_KEY`) — and exported **inline for that one
  run**, never persisted to any file, script or commit. **No read-around of the deny was attempted:**
  not `git show`, not `cat`, and not a dotenv-loading script to extract the value programmatically,
  which would have been the same circumvention wearing a different hat.
- **B-1 is therefore still BLOCKED and still OPEN.** The gate running is not evidence it is
  discharged — `.env.example` still lacks the key, and the next person to run this gate hits the same
  wall. **This needs the operator.**

**4. [Scope, recorded] the ledger was already substantially complete**
- Task 1 Step 1 anticipated filling verdicts and confirming sections. All thirteen rows already carried
  verdicts; the withdrawal and scoped-exception sections were already correct. The plan's expectation
  was met by prior waves rather than by this one, and the work reduced to adding the gate section and
  the derived Final counts block. Recorded so the SUMMARY does not claim work it did not do.

## Threat Flags

None. This plan modified **no product source and no test source** — only `.planning/` records. Its
security surface was entirely about *how* the gates were run:

- **T-142-21 (stranded injection during a gate):** mitigated — three entry checks before the first
  command, and a scoped porcelain check immediately before and after each E2E run, all printing
  nothing.
- **T-142-22 (keys and `--no-verify-jwt` in Gate 2):** mitigated — local-development values against a
  local Supabase; the opt-in flag set on one command line and never persisted; all test-only material
  (test JWKs, the mock domain, `NODE_TLS_REJECT_UNAUTHORIZED=0`) written to gitignored `/tmp` scratch
  paths **derived from `tests/tests/utils/testKeys.ts`** rather than hand-copied, so there is no key
  drift; **no key value written into any log the ledger references, into any `.planning/` file, or
  into any commit** (verified by grep after the fact). The JWT-verification-disabled Edge Function
  serve, the static test-JWKS server on `:8777` and the TLS-bypassing dev server were all **torn down
  after the run** and confirmed no longer listening.
- **T-142-23 (testing a different application):** mitigated — the preflight ran and passed on both
  runs, and its verdict is quoted. This was not hypothetical: an unrelated project's server was on the
  default port at gate time.
- **T-142-24 (a result recorded without evidence):** mitigated — every gate result above carries its
  exit code, counts and out-of-repo log path, and all four runs are first-attempt.

## Commits

| Commit | What |
|---|---|
| `68f3223a5` | ledger gate section + Final counts + P-2 half 2 + todo-reconciliation table; `deferred-items.md`; WINDOWS id 48 |
| `ae50cf011` | the three-target propagation — audit (12 annotations + status table), `REQUIREMENTS.md:60`, ROADMAP |
| `f5280fd86` | todo reconciliation — A-10 closed to `done/`, P-1 and P-2 filed |

## Self-Check: PASSED

Verified against disk, 2026-08-21 — every artifact this SUMMARY claims exists, and every commit hash
it names resolves.

- **Files created/modified:** all 6 present, including the two new todos and the A-10 todo now in
  `todos/done/` and **absent** from `todos/pending/`.
- **Gate logs:** all 5 present at `${TMPDIR}/gsd-142/` — `unit-gate-1/2/3.log` (~195 KB each),
  `e2e-full-1.log` (46 KB), `e2e-bankauth-1.log` (44 KB).
- **Commits:** all 19 named hashes resolve — this plan's 3, the 12 remediation commits, the 3
  scope-expansion/product commits, and `743e848d1` (the pre-plan HEAD every gate ran at).
- **Counts:** 12 / 12 / 0 / 12 (11+1) / 8 cited / 4 re-run / 1 scoped exception — read back and
  confirmed identical in the ledger, the audit, `REQUIREMENTS.md:60` and the ROADMAP.
- **No measurement cell reads `pending`:** the 9 remaining occurrences in the ledger are prose about
  the D-09 ordering guarantee, plus `todos/pending/` paths.
