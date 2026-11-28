# 187-28 evidence: the CI measurement after plan 187-27 stopped

Made on 2026-11-16 and 2026-11-17 by the orchestrator at top level, under the operator's rulings of 2026-11-16. The rulings were to start from measuring CI, to fix in -gsd on a new branch on top of `ship/v2.16-12-planning`, and then to rebase the -infra stack onto it. Every run below was pushed to a `ci-evidence/187-ci-measure-*` branch. Each push is a measurement commit whose parent is the pushed green commit `2b0842fd46bf6f26dfa6dad009a13b2297197b30` (`ci-evidence/187-final-3`). It changes only the files named, and none of them is merged anywhere. The artifacts were downloaded into the session scratchpad and are not kept.

## The failing run, read from its artifact

Run 43938990256, job `e2e-tests`, artifact `e2e-run`:

- **The seven failures.** In every one, the waited element arrived late; none was absent. Each page was still `Loading…`, or not yet interactive, when its 10 s wait ended. The page's first Supabase REST call fired 9–15 s after navigation, and each call took 10–250 ms.
- **Where they fell.** All seven fell between minutes 3 and 7 of the run, while the 4-vCPU runner's load1 read 20–24.
- **What was not there.** The dev-server and job logs hold no dependency re-optimisation, no page reload and no HTTP 500.
- **Tracing.** The trace setting keys on `CI`, which `tests/scripts/e2e-run.sh` unsets. So every CI test recorded a trace, though the config's own comment says CI first attempts run untraced.

## Round 1: workers and tracing (run 43955282151, `ci-evidence/187-ci-measure-1`, commit f9ed24968)

The commit made `workers` and `trace` overridable (`E2E_WORKERS`, `E2E_TRACE`) and ran `e2e-tests` as five matrix legs. No other job ran.

```
LEG=w6-trace   workers=6 trace=retain-on-failure passed=729 failed=0 did_not_run=0   duration_s=2111
LEG=w6-notrace workers=6 trace=off               passed=729 failed=0 did_not_run=0   duration_s=1415
LEG=w4-trace   workers=4 trace=retain-on-failure passed=317 failed=1 did_not_run=411 duration_s=1185
LEG=w4-notrace workers=4 trace=off               passed=729 failed=0 did_not_run=0   duration_s=1382
LEG=w3-trace   workers=3 trace=retain-on-failure passed=729 failed=0 did_not_run=0   duration_s=2655
```

- **`w6-trace`** is the configuration of the failing run. It passed this time, so the failure is load-dependent, not deterministic.
- **The `w4-trace` failure** is `contestant-journey.spec.ts:345` (`contestant-questions-continue` not visible).
- **Tracing** costs about a third of a full run at 6 workers (2111 s against 1415 s).
- **4 workers, untraced,** finish no later than 6 (1382 s against 1415 s).

## Round 2: untraced, 6 workers, four repeats (run 43964172506, `ci-evidence/187-ci-measure-2`, commit 4d947aba7)

The commit carried -gsd `2934f0c67` (trace keyed on `GITHUB_ACTIONS` too) and `e6ba6921e` (voter-results baselines). It ran `e2e-tests` four times and `e2e-visual` once.

```
REP=1 workers=6 passed=729 failed=0 did_not_run=0   duration_s=1596
REP=2 workers=6 passed=207 failed=1 did_not_run=521 duration_s=534
REP=3 workers=6 passed=729 failed=0 did_not_run=0   duration_s=1333
REP=4 workers=6 passed=729 failed=0 did_not_run=0   duration_s=1380
E2E_VISUAL=success
```

- **The rep-2 failure** is `auth.setup.ts:44` at 21:56:10Z, the first tests of the run. It is `not.toHaveURL(/login/)` in `registerAndStoreSession.ts:85`, still waiting for the sign-in navigation after its 10 s budget. Everything after it depends on `auth-setup`.
- **`e2e-visual` is green** on the new baselines.

## Round 3: untraced, 4 workers, five repeats (run 43969731414, `ci-evidence/187-ci-measure-3`, commit 5202d34df)

The commit carried -gsd `e6ba6921e`, `2934f0c67` and `dfe9cae8b` (4 workers under `GITHUB_ACTIONS`), with no override. It ran `e2e-tests` five times and `e2e-visual` once.

```
REP=1 workers=4 passed=729 failed=0 did_not_run=0 duration_s=1398
REP=2 workers=4 passed=729 failed=0 did_not_run=0 duration_s=1385
REP=3 workers=4 passed=729 failed=0 did_not_run=0 duration_s=1615
REP=4 workers=4 passed=729 failed=0 did_not_run=0 duration_s=1988
REP=5 workers=4 passed=729 failed=0 did_not_run=0 duration_s=1553
E2E_VISUAL=success
```

## The two auth-setup tests' durations, the cold-start reading

The two `auth.setup.ts` tests (lines 31 and 44) start together on a cold dev server. Their whole-test durations, in seconds:

```
6 workers, traced:    14.7/17.6 (r1), 12.3/13.6 (r1, 4 workers)
6 workers, untraced:  11.9/12.7 (r1), 13.4/13.9, 19.1/22.0 (failed), 11.0/12.3, 11.2/12.5 (r2)
4 workers, untraced:  6.0/6.3 (r1), 6.0/6.4, 5.9/6.3, 8.2/9.0, 9.8/10.5, 7.9/8.7 (r3)
```

## Reading

```
CI_MEASUREMENT_RUNS=43955282151,43964172506,43969731414
CAUSE=confirmed: CPU oversubscription of the 4-vCPU runner (6 workers plus a trace recorder on every test), which pushes cold-load readiness waits past their 10 s budgets
FIX_TRACE=gsd 2934f0c67 (CI first attempts untraced, as the trace setting intends)
FIX_WORKERS=gsd dfe9cae8b (4 workers under GITHUB_ACTIONS)
FIX_VISUAL=gsd e6ba6921e (voter-results baselines, from run 43938990256's Linux actuals)
FIXED_CONFIG_GREEN_LEGS=6 of 6 (round 1 w4-notrace, round 3 reps 1-5)
GSD_FIX_BRANCH=fix/v2.16-ci-e2e (on ship/v2.16-12-planning 9cd30f7a5)
INFRA_REBASED_ONTO=dfe9cae8b
INFRA_PRE_REBASE_HEAD=15e82a60bb49bed2983b03728923c443aaf7a324 (kept as backup/infra-pre-rebase-2026-11-17)
INFRA_REBASE_SOURCE_DELTA=exactly the fix branch's diff (the -gsd delta ship/v2.16-12-planning..fix/v2.16-ci-e2e)
INFRA_REBASE_PLANNING_DELTA=none
```

- **Readiness budgets.** None of the budgets changed. The fix removes load rather than lengthening waits.
- **The local suite.** The three -gsd commits do not change it, since `GITHUB_ACTIONS` is unset there. The rebased tree's full local run belongs to the closing plan.
