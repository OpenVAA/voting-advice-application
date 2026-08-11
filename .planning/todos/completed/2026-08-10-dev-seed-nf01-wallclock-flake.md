---
created: 2026-08-10
source: Phase 134 (wave 4, plan 134-04 — DEF-134-04-01)
resolves_phase: 135
severity: medium
area: packages/dev-seed
---

# dev-seed NF-01 seed-budget test is a wall-clock flake under parallel load

## Symptom

Root `yarn test:unit` exits 1 on `tests/integration/default-template.integration.test.ts`:

```
applies default template and meets NF-01 (<10s) + D-58-20 assertions
  → expected 23630 to be less than 10000
```

## Characterization (measured 2026-08-10, Phase 134)

- **Under load** (Vite dev server on :5173 + Playwright + concurrent agent processes):
  **FAILS** at 23630ms against a 10000ms budget.
- **In isolation** (`cd packages/dev-seed && yarn test:unit`): **PASSES**, 42 files /
  444 tests, whole-test wall clock 10458ms.

The margin is thin even when the machine is quiet, so this is not a "sometimes slow"
test — it is a hard wall-clock assertion sitting close to its own budget, and any
concurrent load pushes it over.

## Why this matters

`yarn test:unit` is a blocking CI step (`.github/workflows/main.yaml`). A timing
assertion that depends on machine load is exactly the class of test CLAUDE.md refuses
to tolerate ("a test that fails intermittently is a real defect… diagnose the root
cause and fix it"). Today it is masked because CI runs on a quiet runner — but any
future parallelism in CI, or a slower runner, turns this into an intermittent red build
that will be misattributed to whatever change happens to be in flight.

It also imposes a hidden serialization constraint on local work: you cannot trust
`yarn test:unit` while a dev server or E2E run is active.

## Attribution

**NOT caused by Phase 134.** `@openvaa/dev-seed` declares no dependency on
`@openvaa/frontend`, and Phase 134 touched no dev-seed file. Recorded, not fixed, per
the executor scope boundary.

## Suggested resolution (not yet decided)

Options, roughly in order of preference:
1. Assert on **work done** rather than wall-clock (row counts, query count, or a
   deterministic operation budget) — removes the load sensitivity entirely.
2. Keep a wall-clock guard but make it a **soft signal**: log the duration, fail only on
   a much larger regression threshold (e.g. 60s) that indicates genuine pathology rather
   than scheduling noise.
3. Mark the test as requiring an isolated runner and enforce that in the test setup, so
   it cannot silently run under contention.

Do NOT resolve by simply raising 10000 to a bigger number — that preserves the flaky
shape and only moves the threshold.

## Related

- Phase 134 `deferred-items.md` — DEF-134-04-01 (the original scope call)

## Resolution (Phase 135, plan 135-03 — 2026-08-11)

Resolved by suggestion 1: **assert work, not wall-clock**. The
`toBeLessThan(10_000)` line is gone (`grep -c` → 0) and NF-01 is now a
deterministic budget over `SupabaseAdminClient` operations — 3 batched write
passes, 1 candidate lookup, exactly 2 round-trips per candidate, 1 merge RPC
per `app_settings` row, and zero calls to anything outside that set.

Explicitly NOT resolved by raising the threshold. Evidence the new guard is
stronger, not merely looser: an injected 327-query N+1 cost only **+937 ms**
(5817 → 6754 ms), so the old 10 000 ms gate would have passed it — while the
operation budget failed immediately with `expected 328 to be 1`.

Load independence proven, not assumed: root `yarn test:unit` exits 0 beside a
Vite dev server with 7, 11 and 14 CPU burners on a 14-core machine, at seed
elapsed 14281 / 12793 / 62437 ms respectively. The 14-burner run holds every
assertion at 10.7x the quiet duration.

Proving that also surfaced a second load-dependent gate the original
characterization did not name — the 60 s per-test timeout, whose value had been
DERIVED from the deleted 10 s budget. It was re-derived from measurement (68 s
worst legitimately-completing run → 300 s hang guard) and relabelled as a hang
guard rather than a budget.

See `.planning/phases/135-close-phase-134-coverage-carry-overs/135-03-SUMMARY.md`.
