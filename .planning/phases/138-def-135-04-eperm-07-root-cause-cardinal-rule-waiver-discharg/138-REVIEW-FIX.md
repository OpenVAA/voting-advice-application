---
phase: 138-def-135-04-eperm-07-root-cause-cardinal-rule-waiver-discharg
fixed_at: 2026-08-14T08:05:00Z
review_path: .planning/phases/138-def-135-04-eperm-07-root-cause-cardinal-rule-waiver-discharg/138-REVIEW.md
iteration: 1
findings_in_scope: 10
fixed: 9
skipped: 1
deferred: [WR-04]
status: partial
---

# Phase 138: Code Review Fix Report

**Fixed at:** 2026-08-14
**Source review:** `138-REVIEW.md`
**Scope:** Critical + Warning (WR-01 … WR-10). The nine `IN-*` Info findings were out of
scope and are untouched, with one stated exception noted under WR-09.
**Iteration:** 1

**Summary:**

- Findings in scope: 10
- Addressed: 10 (9 applied as code changes, 1 — WR-04 — deliberately deferred with the
  reviewer's own stated alternative applied instead)
- Skipped without action: 0

Every finding got a commit. Ten commits, `24ee33be3` … `70c147a0e`, one per finding, in
finding order.

---

## Verification

All three gates were run after the last commit, on `70c147a0e`. Numbers below are read
from `results.json`, not from console prose.

### 1. Static gates

| Gate | Command | Result |
|---|---|---|
| Repo lint | `yarn lint:check` | **exit 0** — 0 errors, 18 warnings, all pre-existing (`dev-seed` ×15, `frontend` ×1, `tests` ×2) and none in a file this session touched |
| Tests typecheck | `npx tsc -p tests/tsconfig.json --noEmit` | **exit 0**, no errors |
| Formatting | `npx prettier --check` on every changed TS/MD file | clean |

### 2. Criterion-2 adversary — the guard still catches what it was built to catch

```
FRONTEND_PORT=5273 EPERM07_FORCE_BUDGET_MS=400 EPERM07_FORCE_CPU_RATE=40 \
  npx playwright test -c tests/playwright.config.ts --project=eperm07-term-trigger
```

**Result: 3 passed (16.9 s), exit 0.** This is the load-bearing check on WR-01/WR-02:
the settle they rewrote is the thing this adversary measures, and it still passes at a
400 ms budget under a 40× CPU throttle.

**On the WR-03 interaction, stated explicitly because it was asked:** the invocation did
**not** have to change. `138-NEGATIVE-CONTROL.md:134-135`, `:195-196` and `:330-331` all
use exactly `EPERM07_FORCE_BUDGET_MS=400` / `EPERM07_FORCE_CPU_RATE=40`, and that is what
was run here. Both are positive finite numbers, so the new `forcedNumber` parser returns
`400` and `40` — bit-identical to what `Number()` returned before. Strict parsing changed
behaviour only for values the old code mis-handled (unset, blank, non-numeric,
non-positive); it did not move the adversary. Verified independently in both directions:

- `EPERM07_FORCE_BUDGET_MS=2s` → `Error: EPERM07_FORCE_BUDGET_MS must be a finite number >= 1 (got '2s')` at collection time (was: `NaN`).
- `EPERM07_FORCE_BUDGET_MS= EPERM07_FORCE_CPU_RATE=` (exported but empty) → collects normally and falls back to the production defaults (was: `0`, i.e. Playwright's *no timeout* and a silently unapplied throttle).

### 3. Full gate suite

Run through `tests/scripts/e2e-run.sh` — which is itself three of these findings' subject
matter, so this doubles as end-to-end verification of WR-05, WR-06 and WR-09. The wrapper
performs `yarn db:reset`, polls Supabase readiness, then **spawns and owns exactly one
fresh dev server** on 5273 and tears it down from a trap. It runs the full gate suite with
the identical invocation the root `test:e2e` script uses (`tests --grep-invert @probe`).

| Measure | Value |
|---|---|
| Wrapper exit | **0** |
| `executed` | **135** |
| `passed` | **135** |
| `failed` | **0** |
| `flaky` | **0** |
| `didNotRun` | **0** |
| Spec files | **89** |
| Observed workers / retries | 6 / 0 (no CI posture) |
| Suite duration | 686 981 ms (11.4 min) |
| `preflight-failures` | **0** |
| `preflight-successes` | **1** |

135 executed of 135 expected, in 89 files. `preflight-successes = 1` is the new positive
verdict from WR-09 working end to end — the served-application gate is now *confirmed to
have run*, not merely *not observed to have failed*.

**WR-10 ordering, confirmed from the run rather than from the config:**

```
[3/135]   [eperm07-term-trigger]
[28/135]  [voter-journey]
[29/135]  [candidate-journey]
[30/135]  [data-setup-perm-1e1cg1co]     <- the anchor, now waiting on all three
[31/135]  [perm-1e1cg1co]
```

The new leaf completes long before the first perm setup, which is the intent: no perm
setup can clobber `app_settings` while the eperm07 guard is reading it.

**No skip, quarantine, retry or `.only` was added anywhere.**
`grep -rnE 'test\.(skip|fixme|only)\(|describe\.(skip|only)\b' tests/tests` returns
nothing, and no line added across the ten commits introduces one.

### A discarded run, recorded rather than omitted

An earlier full-suite attempt reported `53 passed / 3 failed / 79 did not run`. It is
**not** evidence of a red suite and was not counted: the agent's stream was interrupted
mid-run and the harness sent `SIGTERM` to the process tree, killing the dev server
(`devserver.log`: `yarn workspace @openvaa/frontend dev exited with code SIGTERM`). All
three failures are `Target page, context or browser has been closed`, and the 79
did-not-run are the cascade behind them. No failure referenced the settle: grepping that
run's `results.json` for `settleAfterClientNavigation`, `expectClientNavigation` or the
new baseline-rejection message returns nothing. The run above was started clean
afterwards, detached in its own session so an interruption could not repeat it. This is
recorded because silence about a discarded attempt is what makes a green arguable.

---

## Fixed Issues

### WR-01: The settle's baseline is captured before the caller's entry gate

**Files modified:** `tests/tests/helpers/navigation.ts`, `tests/tests/helpers/index.ts`,
`tests/tests/specs/voter/voter-journey.spec.ts`,
`tests/tests/specs/voter/eperm07-term-trigger.spec.ts`
**Commit:** `24ee33be3`

**Applied fix.** The reviewer's primary suggestion, generalised so the precondition is
enforced rather than remembered. A new shared `expectClientNavigation(page, action)` hands
the action a `capture()` callback; each action gates on the page it is leaving, calls
`capture()`, then clicks. `expectUrlChange` (voter-journey) and
`settleOnUrlChangeAsProductionDoes` (eperm07) become one-line delegations, so the walk and
its instrument cannot drift. All nine call sites were updated. An action that never calls
`capture()` throws with a message naming the contract, so the bad state is unreachable
rather than undetected. Both URL and landmark text are now captured at that same instant.

**Not applied, deliberately:** the reviewer also observed that three neighbourhoods
(`page.goBack()` at `:823`, the `previousButton` hops at `:930-958` and `:991-1014`)
bridge to the next wrapper only through non-aborting `expect.soft` gates, and suggested
D-08's soft→hard promotion applies to them too. Those gates were left alone. They were
*why* a stale baseline was reachable; with the baseline now read after each action's own
gate, a page-behind DOM at wrapper entry can no longer reach the settle at all, so the
promotion is no longer needed for this defect. Promoting them is a separate behavioural
change to a passing walk, is outside the finding's own Fix section, and would be better
made on its own evidence. Recorded here as an open item rather than done quietly.

### WR-02: Stage 2's predicate is unconditionally true when the baseline is `null`

**Files modified:** `tests/tests/helpers/navigation.ts`
**Commit:** `6ef313bca`

**Applied fix.** All three holes closed:

- **(a) the tautology.** `(target.textContent ?? '') !== previous` is always true when
  `previous` is `null`, collapsing the settle to the attachment-only wait its own docblock
  rejects by name. A `null` or blank baseline is now **rejected loudly** — the settle
  throws, naming the capture contract — rather than honoured. This is the stronger of the
  two options the reviewer offered ("any non-empty text is acceptable" was the weaker),
  and it is safe precisely *because* WR-01 landed first: the baseline is now read
  immediately after a hard gate on the origin page, so a `null` there means the caller
  captured mid-swap, which is exactly when the baseline is meaningless. Empirically
  confirmed by the 135/135 run — the throw fired zero times across every hop in the suite.
- **(b) the empty destination.** The predicate now requires non-empty text, so a skeleton,
  a one-frame `{#key}` remount or a hydration boundary cannot satisfy it.
- **(c) whitespace.** Both sides are whitespace-normalised identically
  (`.replace(/\s+/g, ' ').trim()`), in `readNavigationLandmarkText` and in the in-page
  predicate, each carrying a comment that they must not drift. `readNavigationLandmarkText`
  still distinguishes "no element" (`null`) from "element with no text" (`''`).

### WR-03: A malformed or empty `EPERM07_FORCE_*` value silently becomes the most permissive setting

**Files modified:** `tests/tests/specs/voter/eperm07-term-trigger.spec.ts`
**Commit:** `d2e94f039`

**Applied fix.** A `forcedNumber(name, fallback, min)` helper replaces
`Number(process.env.X ?? default)`. Blank means unset (production default); anything
non-finite or below `min` throws at collection time, where a usage error belongs. `min` is
`1` for both knobs, and each carries the reason: a budget of `0` is Playwright's *no
timeout*, and a CPU rate below `1` is silently dropped by `applyCpuThrottleKnob`. The
fallback is always the production value, never a more permissive one. `EPERM07_NO_VT` was
already correct (`=== 'true'`) and is unchanged. Both directions verified above.

### WR-04: The named root cause is still live in two shared navigation helpers — **DEFERRED**, with the reviewer's stated alternative applied

**Files modified:** `tests/tests/helpers/navigation.ts`, `tests/tests/utils/voterNavigation.ts`
**Commit:** `e28a37989` (a `docs(138)` commit — no behaviour changed)

The mechanical change (route `advanceClick` and `clickAndRaceSettle` through
`settleAfterClientNavigation`) was **not** made. The reviewer's finding offers two
resolutions and the second was taken: *"if the swallow is genuinely wanted for the
best-effort click path — document the residual exposure explicitly in each docblock and
file it as an open item, so a later reader does not take 'the settle was fixed in Phase
138' as covering the whole suite."*

**Why deferred, in full.** The swallow is not an oversight at either site; removing it
would re-open defects each helper's own docblock records as fixed.

- **`advanceClick` is a resilient walker, not an assertion path.** `advanceVoterFlow`
  loops over checkpoints that may legitimately be absent (intermediate pages can be
  disabled in app settings) or may detach mid-click (concurrent settings mutation). A
  click that does not take effect *must* let the loop re-detect the current screen. A
  throwing DOM settle converts every such benign no-op into a hard failure and restores
  the 90 s actionability stall the helper exists to prevent — the failure mode quoted
  verbatim in its docstring. Its guarantee is terminal instead:
  `navigateToFirstQuestion` ends in a hard `waitForURL` plus a hard answer-option
  visibility wait on the settled URL.
- **`clickAndRaceSettle`'s two call sites each follow it with a HARD landing assertion
  that *is* the DOM settle** (the intro CTA `toBeVisible`, then the caller's
  `expectation()`). DEF-133-01 measured that design and moved the failure signal
  downstream deliberately, on the hydration boundary where a bounded click was measured
  to time out from ~60× contention upward.

Doing this properly would need its own negative control, and the change would alter the
fixture stack under `perm-hide-category-tags`, `perm-hide-election-tags`,
`minimalVoterResultsPage` and `candidate-journey`. A half-applied change across four
specs' fixture stack is worse than a stated deferral.

**What was applied instead.** Three docblocks now state the exposure precisely — that both
helpers still have link 4's shape (settle on the URL alone, swallow the timeout), what
bounds it at each site, and that *"the settle was fixed in Phase 138" covers the voter
walk's Q→Q hops only, not this function*. The module docblock, which previously described
the file only as "thin wrappers", now names the two different settle contracts living in
it and which one a new call site should reach for.

**Open item carried forward:** route `advanceClick`'s post-click settle and
`clickAndRaceSettle`'s destination wait through a DOM settle, with a negative control of
their own, or decide on the record that the terminal-assertion bound is sufficient.

### WR-05: `e2e-run.sh` adopts a dev server it did not spawn, then `kill -9`s it

**Files modified:** `tests/scripts/e2e-run.sh`
**Commit:** `74c4be80b`

**Applied fix.** Two halves.

- **Refuse to adopt.** The port is asserted free before the spawn; a pre-existing listener
  is now fatal (exit 5) and names the holding pids. The wait loop's probe order is also
  inverted — liveness before port — so the `kill -0 "$DEV_PID"` probe can no longer be
  skipped by a listener that answers on the first poll.
- **Scope the kill.** The teardown's belt-and-braces `kill -9 $holders` killed every holder
  of the port including ones it never spawned. It now kills only holders whose `pgid`
  matches the spawned job's own group (`set -m` guarantees the job has its own group whose
  pgid is `$DEV_PID`), and warns about the rest instead of SIGKILLing an operator's `yarn dev`.

The exit-code table and the header's step list were updated to match. This wrapper ran the
full suite above and exited 0.

### WR-06: A flag given without a value exits 1 — the code documented as "Playwright reported failures"

**Files modified:** `tests/scripts/e2e-run.sh`, `tests/scripts/determinism-batch.sh`
**Commit:** `135cbd7fd`

**Applied fix.** A `require_value` guard on every value-taking flag in both scripts, with
the mechanism explained where it lives (`shift 2` with one positional left fails under
`set -euo pipefail`, killing the script silently with exit 1 — which collides head-on with
`e2e-run.sh`'s own exit-code table). Verified by running both:

```
$ tests/scripts/e2e-run.sh --run-dir
e2e-run.sh: --run-dir requires a value      (+ usage)      exit=2
$ tests/scripts/determinism-batch.sh --runs 2 --project
determinism-batch.sh: --project requires a value  (+ usage) exit=2
```

### WR-07: `df -k` parsing is not portable

**Files modified:** `tests/scripts/determinism-batch.sh`
**Commit:** `00f2214f1`

**Applied fix.** `df -Pk … | awk 'END {print $4}'` — POSIX output format guarantees one
line per filesystem, so a wrapped device name can no longer make `$4` empty. An
unparsable value is now **refused** rather than treated as zero, and its abort reason says
so in as many words: a measurement failure and a full disk must not produce the same row.

### WR-08: The batch has no ERR/EXIT trap

**Files modified:** `tests/scripts/determinism-batch.sh`
**Commit:** `9bc91d9ec`

**Applied fix.** An EXIT trap stamps an incomplete batch, guarded three ways so it can only
fire for a death nobody recorded: `BATCH_COMPLETE` (clean finish), `INTERRUPTED` (signal),
`ABORT_RECORDED` (any deliberate `record_abort`). Verified in both directions against
scratch copies of the script:

- an injected `set -e` death (`du -sk /definitely-not-a-path-xyz`) → the ledger's Aborts
  section carries `batch terminated UNEXPECTEDLY (exit 1) -- this ledger is INCOMPLETE and
  proves nothing about consecutiveness`, instead of the previous affirmative *"**None.** No
  run in this batch was aborted"*;
- a forced HEAD mismatch → still exactly **one** abort row and still exit 4, i.e. no
  double-recording of a deliberate abort.

### WR-09: "Preflight-confirmed" is an absence check

**Files modified:** `tests/tests/support/preflight.ts`, `tests/scripts/e2e-run.sh`,
`tests/scripts/determinism-batch.sh`, `tests/README.md`
**Commit:** `ac4c443ab`

**Applied fix.** The reviewer's full option, not the minimal one.

- `assertServedApp` now prints `E2E PREFLIGHT OK <served module root> (verified against
  <repo root>)` exactly once per invocation. Success was previously *silent*, which is why
  a positive confirmation was not merely absent but impossible.
- Both headlines are exported constants, and `e2e-run.sh` asserts at start that the
  literals it greps for still exist in `preflight.ts` (new exit 7), closing the drift hole
  where a rename plus a stale copy would agree on "0 preflight failures" forever.
- `e2e-run.sh` writes `preflight-successes` and requires `successes >= 1 && failures == 0`;
  `determinism-batch.sh` adds the success count as a validity rule and as a ledger column.
- `tests/README.md` documents the success line and what it is for.

Verified live: the gate run wrote `preflight-failures=0` and `preflight-successes=1`, and
the failure path still works (`FRONTEND_PORT=54321` → `E2E PREFLIGHT FAILED — the server on
port 54321 is not this checkout's dev server`).

**One Info finding was swept in, and it is called out rather than hidden.** `usage()` in
both scripts used a hardcoded `sed -n '2,Np'` range that already truncated the exit-code
table (IN-04, out of scope). This commit adds lines to both header blocks, which would
have truncated them further, so the range was replaced with the reviewer's own delimiter
form. The remaining eight Info findings are untouched.

### WR-10: The new `eperm07-term-trigger` leaf is outside the perm-chain anchor

**Files modified:** `tests/playwright.config.ts`
**Commit:** `70c147a0e`

**Applied fix.** The concern was judged real before changing the wiring, and it is. The
other base leaves that sit outside the anchor are fine there because they do not
hard-assert settings-dependent UI; this one does, twice — the category-intro page it walks
through exists only while `questions.categoryIntros.show` is true, and
`voterQuestionsPage.clickStart()` only while `questionsIntro.show` is. An `app_settings`
clobber would therefore land inside the phase's designated permanent regression guard for
the shared settle and read as a settle regression.

`eperm07-term-trigger` was added to `data-setup-perm-1e1cg1co`'s `dependencies`, with the
reasoning in the config beside the invariant it upholds. Suite semantics were checked, not
assumed: `--list` still reports **135 tests in 89 files** (dependencies order projects,
they do not add tests), and the run above confirms the intended order — the leaf completes
at `[3/135]`, the anchor at `[30/135]`.

---

## Open items carried forward

1. **WR-04 (deferred).** Route `advanceClick` and `clickAndRaceSettle` through a DOM
   settle with a negative control of their own, or decide on the record that the
   terminal-assertion bound is sufficient. The exposure is documented in-code at all three
   sites in the meantime.
2. **WR-01 residue.** The three non-aborting `expect.soft` bridging gates in
   `voter-journey.spec.ts` (`:823`, `:930-958`, `:991-1014`) were not promoted to hard.
   No longer load-bearing for this defect; worth deciding on its own evidence.
3. **IN-01 … IN-09** remain open by scope, except IN-04, which was fixed incidentally
   under WR-09 for the reason given there.

---

_Fixed: 2026-08-14_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
