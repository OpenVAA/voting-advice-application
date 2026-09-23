# Phase 157.1 — deferred items

Out-of-scope discoveries made during execution. Logged rather than fixed, per the executor's scope
boundary: only issues directly caused by the current task's changes are auto-fixed.

---

## DEF-1 — `storedSettings.schema.ts:13` documents a degradation the phase has retired

- **Found during:** `157.1-05` task 3, while verifying the criterion
  `grep -rn "log\.warn" apps/frontend/src packages/app-shared/src` returns nothing outside test files.
- **File:** `packages/app-shared/src/data/schemas/storedSettings.schema.ts:13` (the
  `StoredNotificationSchema` docstring).
- **What is stale.** The sentence reads: *"because `SupabaseDataProvider._getAppSettings` degrades a
  failed parse to `{}` rather than throwing, ONE absent notification title silently discarded EVERY
  OTHER SETTING in the column"*, and the following sentence refers to *"the accompanying `log.warn`"*.
  After `157.1-05` task 1 both clauses are false: `_getAppSettings` consumes a partial-preserve outcome,
  so the offending top-level ancestor is dropped and the siblings survive, and the record is emitted at
  `error` (decision C5(b)). This is the same class of defect task 1 was told to fix in the donor's own
  docstring — the tree asserting a defect it no longer has.
- **Why it was NOT fixed here.** `157.1-05`'s prohibitions forbid it twice over. *"MUST NOT widen any
  schema … verification: `git diff --name-only HEAD -- packages/app-shared` is empty"*, and task 1's
  acceptance criterion requires `git diff --name-only HEAD -- apps/frontend/src/routes packages` to be
  empty. Editing this docstring — even prose only — makes both non-empty and would make the plan
  unverifiable against its own contract.
- **Side effect on a criterion.** The prose mention is also the ONLY remaining `log.warn` substring in
  the non-test tree, so task 3's grep criterion cannot return empty as literally written. Zero `log.warn`
  CALL sites remain (`grep -rn "log\.warn(" apps packages | grep -v '\.test\.'` is empty), which is what
  the criterion is about. See the SUMMARY's criterion-conflict note.
- **Suggested owner:** `157.1-08` (phase close), or whichever later plan next has
  `packages/app-shared` in its `files_modified`.

---

## CLOSED by `157.1-08` — the stale `log.warn` prose reference

The item above (`storedSettings.schema.ts:13`) is **closed**. `157.1-08` had `packages/app-shared` in
scope for exactly this, reworded the sentence to say the record "was emitted at the `warn` level when this
comment was written" and now carries `error` per decision **C5(b)**, and pointed it at
`157.1-OVER-DISCLOSURE-AUDIT.md` § "The empty `warn` tier is the intended end state". Task 3's grep
criterion now returns empty as literally written. Commit `bf2c311ad`.

---

## OPEN — `yarn test:unit` seeds the LIVE local database, contaminating any E2E run that follows it

**Found by `157.1-08` while running the phase-closing gate. Reproduced, root-caused and worked around
inside the plan's own precondition; the underlying defect is NOT fixed and belongs to a later phase.**

- **File:** `packages/dev-seed/tests/integration/default-template.integration.test.ts`.
- **What happens.** The file is gated on `describe.skipIf(!process.env.SUPABASE_URL)`, so on a developer
  machine with `yarn db:start` already up — which is the state the phase gate requires for its pgTAP and
  E2E halves — it RUNS, and it applies `defaultTemplate` to the **live local Supabase**: 327 candidates,
  8 organizations, 4 question categories, 377 nominations and one election
  (`seed_election_default`, "OpenVAA Demo Parliamentary Election 2026"). Its teardown is incomplete:
  measured immediately after the first gate run, **328 candidates, 8 organizations, 4 question categories,
  377 nominations and 1 election survived** into the E2E suite, and `app_settings.settings` was no longer
  the `{}` that `seed.sql` writes.
- **What that costs.** The voter app then sees TWO elections. `voter-journey`'s election combobox
  assertion reads `toHaveCount(1)` and receives `2`; the category-intro assertion expects
  `/Base Opinion Questions/i` and receives `"Economy & Taxation  7 questions"` because the journey landed
  on the demo election's first category; and `performance-budget` reads 17 results fetches against a
  budget of 13. **Four deterministic failures and 79 did-not-run**, none of them flaky and none of them
  caused by the code under test.
- **Why the gate order makes it inevitable.** Decision **E2(a)** orders the gate
  `db:reset → build → lint → format → test:unit → check → pgTAP → e2e`. `test:unit` is DB-mutating, and it
  sits between the reset and the suite. Any gate run of that shape on a machine with Supabase up starts the
  E2E half against a contaminated database.
- **How `157.1-08` proceeded.** Task 3's own `<precondition>` names "a database reset immediately
  beforehand" for the E2E half. The first run violated it; the second satisfied it — plain `yarn db:reset`
  and a fresh dev server immediately before `yarn test:e2e` — and the suite was **150 passed, 0 failed,
  0 did-not-run, exit 0**. Both runs are recorded in `157.1-08-SUMMARY.md`; no test was skipped, retried
  until green, or annotated as flaky.
- **What would have to change.** Either (a) make the integration test's teardown complete, so the file
  leaves the database as it found it — it deletes via `SupabaseAdminClient.bulkDelete` over ten tables and
  something in that set is not reaching the default template's rows; or (b) move the file out of
  `yarn test:unit` into its own script, matching how CI already isolates it in the dedicated
  `dev-seed-integration` job; or (c) amend the phase-gate order so the plain reset sits immediately before
  the E2E half rather than at the head of the whole chain. (c) is a documentation change and the cheapest;
  (a) is the actual defect.
- **Suggested owner:** a later v2.15 phase touching `packages/dev-seed` or the gate definition. Worth
  raising because every future phase that runs this gate will hit it.
