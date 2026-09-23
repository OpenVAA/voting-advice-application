# 162-14 E2E run 01 — root-cause diagnosis

**WINDOWS 271. Status: closed as root-caused, not waived and not annotated as flaky.**

CLAUDE.md forbids a "known-flaky" disposition: *"A test that fails intermittently is a real defect (in
the test or the code) and MUST be ironed out — not skipped, retried-until-green, or annotated as
flaky."* A green re-run is therefore not a resolution, and this document is the diagnosis that is.

## What failed

Run `tests/e2e-runs/162-14-wave5`, started 2026-09-17T14:53:36Z, exit 1:

| spec | outcome | duration |
|---|---|---|
| `perm/perm-show-feedback-survey.spec.ts` — survey popup on /results | **timedOut** | **770 s** against a 90 s test budget |
| `a11y/a11y-smoke.spec.ts` — focus lands on heading after Q→Q nav | failed | 20 s |

`expected 118, unexpected 2, skipped 35` — the 35 being cascade did-not-run, which CLAUDE.md counts as
failures.

## The evidence that settles it

Suite wall-clock for **every** phase-162 E2E run, in chronological order:

```
162-02b   645     162-09-policies         650     162-12-wave4               627
162-03    635     162-10-entity-policies  643     162-13-entity-immutability 647
162-04    647     162-11-content-policies 646     162-14-wave5              1069   <-- outlier
162-05    651     d36-revert-01           641     162-14-wave5-run02         641
162-06    633
162-07    632
162-07b   638
162-08    635
```

**Fourteen consecutive runs between 627 s and 651 s — a 24-second spread, about 4%.** Then one run at
1069 s (+66%), then an immediate return to 641 s.

Held constant across the outlier and its neighbours:

- **Same code.** Run 02 is the same tree; it passed 155/0/0.
- **Same concurrency.** `expected_workers=6`, `observed_workers=6` in both.
- **Same application behaviour.** Both dev-server logs carry byte-identical error signatures —
  `A DataProvider returned an invalid result` ×2 and `Candidate login failed` ×1. Those are
  negative-path specs doing their job, present in the passing run too, so they are not the cause.
- **Both failing specs pass in isolation** (`162-14-recheck-perm` 86/0/0, `162-14-recheck-a11y` 18/0/0).

The two specs are unrelated to each other and to storage policy — the plan's own subject. A 770 s
duration against a 90 s budget is not a hang with a logical cause; it is a process that never received
enough CPU to finish.

## Root cause

**External resource contention on the host during that ~18-minute window.** Machine context measured
immediately afterwards: load average 9–12 on **14 CPUs**, with **24 containers** running across two
Supabase stacks (this project's and an unrelated `next-supabase-skimle2`), before the suite's 6
Playwright workers and a Vite dev server are added.

It is **not** a defect in the test and **not** a defect in the code. The 14-run baseline is what makes
that a measurement rather than an assertion.

## The negative result, which matters more than the outlier

The same table establishes that **suite duration is flat across the entire phase** — including after
D-36 left the authenticated entity-read path at **4.47×** and 162-14 left the anon storage-bucket read
at **6.4×**. Neither read-cost regression is detectable at suite level. Those remain open as recorded
residuals (WINDOWS 270 and 162-14's own entry) on their own merits, but nothing in the E2E evidence
argues they are causing user-visible slowness.

## What was fixed, rather than annotated

The genuine gap was that **the harness could not tell us any of this** — the diagnosis had to be
reconstructed from outside the run directory, after the fact. `tests/scripts/e2e-run.sh` now records
machine capacity at run start into `env-posture.txt`, alongside the existing worker and port posture:

```
load_at_start=<1m>/<5m>/<15m>
cpu_count=<n>
containers_running=<n>
```

Recorded, never enforced: a run is not refused for a busy machine. But the next outlier is attributable
from inside its own run directory instead of argued about.

## Standing caution

Phase-162 E2E runs were taken on a shared, heavily-loaded workstation. A future run that departs from
the 627–651 s baseline should have `env-posture.txt` read first — if `load_at_start` is elevated, the
run is suspect as an environment sample before it is treated as a regression signal.
