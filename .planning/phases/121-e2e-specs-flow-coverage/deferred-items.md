# Phase 121 — Deferred Items (out-of-scope discoveries)

## From Plan 07 (voter-prefs-tracking, EFLOW-08)

- **`voter-journey` E2E fails during the full-chain run (out of scope for Plan 07).**
  - **Discovered:** running `yarn test:e2e --project=voter-prefs-tracking` (full deps).
  - **Symptom:** `[voter-journey] › tests/tests/specs/voter/voter-journey.spec.ts:326 › full voter journey end-to-end` fails; because `voter-journey` is a setup dependency in the perm serial chain, the failure cascades and `voter-prefs-tracking` "did not run" in the dependency-driven run.
  - **Scope:** `voter-journey.spec.ts` is NOT modified by Plan 07 (Plan 07 only adds `voter-prefs-tracking.spec.ts`). `voter-journey` is being EXTENDED by sibling plans (EFLOW-01/04, Plan 01) in this phase — its end-to-end failure must be resolved by that work / the wave-merge owner, not by Plan 07.
  - **Plan-07 verification path used instead:** the `voter-prefs-tracking` project was verified in isolation by seeding `data-setup-base` + `data-setup-perm-analytics-tracking` with `--no-deps`, then running `voter-prefs-tracking --no-deps` — 3/3 tests green, 3× determinism gate green (re-seeding the analytics overlay before each rerun per the shared `app_settings` singleton discipline).
  - **Action required at wave merge:** fix `voter-journey` (sibling-plan scope) so the full `yarn test:e2e` is green end-to-end ("did not run" counts as failure per the E2E Hard Rule).
