---
created: 2026-08-27T16:08:00.000Z
title: The 14 candidate scans are proven deterministic at a frequency, not proven free of flake
area: tests / determinism
severity: minor
source: Phase 147 (147-NEGATIVE-CONTROL.md row DET-RUNS; filed by 147-05)
files:
  - tests/tests/specs/a11y/candidate-a11y.spec.ts
  - tests/tests/utils/axeScan.ts
---

## What was actually proven

Phase 147 added 14 candidate scans to the blocking suite and ran the **full default suite four
consecutive times on one HEAD** (`ff37a87fc`), each preceded by `yarn db:reset`, each
preflight-confirmed: **150 passed / 0 failed / 0 skipped / 0 flaky / 0 did-not-run**, four times,
wall clocks within 2.1 s. No run was retried, replaced or abandoned. The 14 added scans summed
33.4 / 32.6 / 32.1 s; the widest single-scan spread was 0.7 s.

That meets the Phase-136 gate's standard and it is the first time these scans have met **real suite
contention** at all — the scout's 42-scan zero was taken at `--workers=1` with nothing else running
(`147-SCOUT-INVENTORY.md` § 9.2).

## What was NOT proven, and why it is filed

**Four green runs evidence a low failure frequency. They do not prove absence.** Three green runs
clear a 1-in-20 defect with probability ≈ 0.86 — i.e. a defect that fires one run in twenty had
roughly a **one-in-seven** chance of hiding from this gate.

This matters specifically for axe scans in this repository, and not as a general caution:
`tests/tests/utils/axeScan.ts`'s own docblock records that **scan-timing pressure previously
produced phantom `color-contrast` failures on the voter side**. The failure mode is known, it is
timing-driven, and the candidate half has now met contention four times rather than many.

Under this project's cardinal rule there is no such thing as an acceptable flaky test, so a phantom
failure here would be a real defect to iron out — not something to annotate.

## Solution

No code change is proposed. The action is to **watch the right thing**: if any candidate scan ever
fails on a rule with a timing history (`color-contrast` first among them), treat it as this known
mechanism rather than as a new product regression, and go to `axeScan.ts`'s docblock and the
`awaitAnimationsSettled` path before touching the product.

A longer determinism run (the Phase-138 shape, 16 consecutive full-suite runs on one pinned HEAD)
would tighten the bound if the scans ever earn the suspicion.

## Note

Filed so the four-run green is not later read as "these scans are proven stable". It is a bound with
a number attached, which is the honest form.
