# Phase 137 Plan 05 — Summary

**Plan:** 05 — Phase gate: full-suite green + observed CI run
**Status:** Task 1 COMPLETE · Task 2 DEFERRED (operator decision, 2026-08-13)
**Requirements:** INTEG-04, INTEG-05, INTEG-06

## Task 1 — Full-suite cardinal-rule gate: PASSED

Commit `68cbfcbc9`. Full detail in `137-05-TASK1-RESULT.md`.

| Measure | Result |
|---|---|
| `FRONTEND_PORT=5273 yarn test:e2e` | **exit 0** |
| Executed / passed / failed / skipped / flaky / did-not-run | **134 / 134 / 0 / 0 / 0 / 0** |
| Wall time | 648 s (10.8 min), 6 workers |
| `E2E PREFLIGHT FAILED` occurrences | **0** — gate passed first attempt, no retry |
| `yarn typecheck:tests` / `yarn lint:check` | exit 0 / exit 0 |

**The 142-vs-134 count question is settled and is NOT a regression.** They are two selections of one
suite: `--list` = 142 tests in 93 files (matches the wave-1 and wave-3 baselines exactly);
`--list --grep-invert @probe` = 134 in 88; and `yarn test:e2e` carries that same `--grep-invert @probe`
by definition. Executed 134 equals the grep-inverted list exactly. This also retires the standing
ambiguity about the v2.14 archive's "134 / 88" figure — that was this selection, not a smaller suite.

**Bank-auth, both directions** (the only invocation exercising the `webServer` entry):
- *Positive* (correct port): 8 passed in 6.7 s, exit 0, no preflight failure.
- *Negative* (port 5173): exit 1 with the clause-(b) block, **zero specs executed**,
  `served module root: /opt/frontend`. Stronger than a dead-port negative would have been — the
  foreign server answered 200 with `<title>Valkompass</title>`, which **is** a legitimate `appName`
  in this checkout's own catalogue, so clauses (a) and (c) both passed and clause (b) was isolated as
  the sole discriminator.
- *Ordering confirmed by observation, not inference:* an absent orphan cannot distinguish "started
  then torn down" from "never started", so the negative was re-run while polling `lsof` at 250 ms.
  The mock issuer was observed LISTENing as `node` PID 97207 on `127.0.0.1:9443` mid-run and free
  afterwards — confirming RESEARCH §R2.4's ordering end to end plus clean teardown.

**Static gates re-confirmed on the final tree:** retired process-type wording → 0 matches across all
three live docs; `seq 1 60` → 0; `Wait for frontend` → 0; `Start frontend` → 2.

**Port discipline:** the gate ran on **5273**, not 5173. The Docker sibling holds `*:5173` and the
measured wildcard shadow-bind means our server can still bind `[::1]:5173` even with `strictPort`
active — a suite run there would have measured an ambiguous target, i.e. exactly the false-green class
this phase exists to eliminate. The shell-prefix form was used throughout, so `.env` was never opened
or written and is byte-identical by construction.

## Task 2 — Observed CI run: DEFERRED

**Operator decision, 2026-08-13.** Not executed, and deliberately not inferred.

**Why deferred — a blocker discovered at execution time, not a choice of convenience.**
`.github/workflows/main.yaml` triggers only on `push` to `main` and on `pull_request` targeting
`main`. The working branch `feat-gsd-roadmap` is **2377 commits ahead of `origin/main`**, and its own
remote copy is **1425 commits stale** (last pushed 2026-05-19). Discharging this checkpoint therefore
requires opening a 2377-commit pull request against `OpenVAA/voting-advice-application` — a large,
visible event in the org repository, disproportionate to a verification step and far outside this
phase's scope. Pushing the branch alone does **not** trigger CI.

**What remains unobserved (state it plainly):**
- Both CI jobs (the E2E job and `e2e-visual`) reaching their Playwright step and passing the preflight
  on a real runner.
- The absence of the deleted `Wait for frontend` step in each job's rendered step list.
- The frontend-start-to-first-spec gap measured against the preflight's 120 s poll ceiling.

**Risk being carried — `T-137-11`, open.** The CI wait loops were deleted (D-05), so the preflight's
poll is now CI's ONLY cold-start absorber. The 120 s ceiling is **budget-preserving, not measured**:
it is exactly the budget the deleted loop already granted (60 × 2 s), and research could not obtain CI
timing data (newest available run was over two weeks stale). If a runner is slower than that budget,
CI fails at the preflight — and that failure mode is CI-only and unfalsifiable locally by construction.
The mitigation is that the ceiling is not a tolerance *reduction*: any run that would pass under the
old loop has the same budget under the new gate.

**Discharge condition:** the first time this branch is PR'd to `main`, confirm the four items above
and append a CI section to `137-NEGATIVE-CONTROL.md`, which plan 05 was to have written.

## Files

No source file was modified by this plan. Task 1 is verification-only; Task 2 did not run.

## Cleanup

Ports 5273 / 9443 / 8777 all free. Docker sibling on 5173 untouched throughout. Supabase (54321,
this repo's own) still up. `/tmp` EFLOW-10 artifacts including the test decryption JWK deleted.
Nothing pushed to any remote.
