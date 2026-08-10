---
created: 2026-08-10
source: Phase 134 (wave 4, plan 134-04 — DEF-134-04-01)
resolves_phase: null
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
