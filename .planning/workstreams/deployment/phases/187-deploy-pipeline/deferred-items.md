# Phase 187: deferred items

Out-of-scope discoveries made while executing phase 187 plans. They are recorded here and not fixed in this phase.

## 2026-11-15: a load-sensitive spawn timeout in `checkDriftLinkedGuard.test.ts` (found re-running plan 187-12 Task 1)

- **Where:** `packages/dev-seed/tests/checkDriftLinkedGuard.test.ts`, case `check-drift.sh --target local is unchanged > still refuses a PGHOST that is not a loopback address, with its own message`. Its `run()` helper calls `spawnSync('bash', ['infra/scripts/check-drift.sh', …], { timeout: 15_000 })`.
- **What was seen:** in the first `yarn test:unit` of the 187-12 re-run at `1e10dff7f`, the child was killed at 15 s (`status` `null`, `expected null to be 2`). The Terraform loops were running alongside turbo's own parallel builds and tests at the time. Alone, the case takes 160 to 181 ms (three runs in a row), and the gate passed when run again by itself.
- **Why it is deferred:** neither the script nor the test has changed since phase 184. A fix (a wider budget, or finding why plain shell work can stall for 15 s under load) belongs to the owner of the drift check, not to the deploy pipeline phase.
- **Evidence:** `evidence/187-12-final-gates.md` § Re-run 2026-11-15 (after review fixes), logs in `tmp/187-gates/187-12-rerun/`.
