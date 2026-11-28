---
created: 2026-08-27T16:09:00.000Z
title: Disk headroom falls ~0.5–1 GiB per full-suite db:reset cycle, and this repository has voided runs on ENOSPC before
area: environment / E2E
severity: medium
source: Phase 147 (147-04 Issues Encountered; 147-02 lost two runs to it; filed by 147-05)
files: []
---

## The observation

Across `147-04`'s four full-suite runs, free disk fell from ~25 GiB to ~23 GiB — roughly
**0.5–1 GiB per run**.

**It is not the run directories.** Those were measured at 1.8–1.9 MB each. The growth tracks the
`yarn db:reset` cycles (Docker / Postgres image and volume growth), which every evidence-producing
run in this phase performs by design, because a run taken against a contaminated dataset measures
the dataset rather than the gate.

## Why it is filed rather than mentioned

It has already cost this project runs. **`147-02` lost two full-suite runs to ENOSPC**, and they are
disclosed in that plan's record rather than deleted. A voided run is not a neutral event here: under
the E2E Hard Rule a test that *did not run* counts as a failure, so an ENOSPC mid-suite converts an
otherwise-clean gate into one that has to be re-taken in full (~10.4 min per run).

At the current rate, a determinism campaign of the Phase-138 shape (16 consecutive full-suite runs)
would consume on the order of 8–16 GiB.

## What must NOT be reclaimed

**`tests/e2e-runs/` is cited by the phase registers.** `147-NEGATIVE-CONTROL.md` names run
directories as the evidence for its rows; deleting them would leave the register pointing at
nothing. They are also small (~2 MB each), so they are not where the space is.

The space is in the Docker layer.

## Solution

Reclaim from Docker rather than from the repository — the Docker.raw sparse file does not shrink on
its own after container churn, and reclaiming it needs a host-level operation the agent cannot
perform. Check headroom **before** committing to a multi-run gate, not after run three fails.
