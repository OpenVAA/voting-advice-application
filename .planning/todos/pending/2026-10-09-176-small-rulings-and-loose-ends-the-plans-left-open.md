---
created: 2026-10-09T00:00:00.000Z
title: Small rulings and loose ends the plans of Phase 176 left open
area: Contestant app / E2E / cleanup
severity: trivial
source: Phase 176 (the orchestrator's list in 176-19-COLLECT.md; the deviations and § Not done, or not verified of 176-01, 176-03, 176-04, 176-05, 176-07, 176-13, 176-14, 176-15, 176-16 and 176-18-SUMMARY.md); filed by 176-19
owner: the operator for the two rulings of section 1 (each stands as built until overruled); the orchestrator for section 2, at the ship review; whoever next edits the file for the rest
files:
  - tests/tests/setup/shared/registerAndStoreSession.ts
  - apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/+page.svelte
  - tests/tests/utils/buildRoute.ts
  - tests/tests/utils/testIds.ts
  - scripts/assert-project-scoped-queries.mjs
---

## 1. Two rulings the orchestrator made on its own judgement

Both are built and green. Neither was put to the operator.

| Plan | What was accepted | The alternative |
|---|---|---|
| 14 | **The sign-in helper's wait raised from the default 5 s to `TIMEOUTS.slowPage`** (commit `2872bbf9e`, `tests/tests/setup/shared/registerAndStoreSession.ts`: the wait for the URL to leave the login page). The run `176-14-precommit` went red on it — 1 failed, 181 did not run — under a host load average near 30 from other sessions. **The diagnosis is unconfirmed**: one trace and its timings, not reproduced, and the rerun was fast enough to pass without the change. The orchestrator accepted it as consistent with the helper's next wait. | Reproduce the slow redirect under load, find what the sign-in waits on, and either keep the longer wait with that as its stated reason or restore the default. Until then a slow sign-in is hidden for up to the longer time. |
| 15 | **The home reads `task.count`** to choose the answers-locked note's second sentence: `hiddenForMissingAnswers` is true when the profile task carries a count, or when the questions task is incomplete and the setting hides the entity. The plan's prohibition (PROH-176-39) says the home "computes no status, no count-based disabling and no target of its own". The orchestrator accepted the read as outside the prohibition's letter: it disables nothing and decides no status. | A member of the task state — whether a required info question is unanswered — so that the page reads a decided fact and no count. |

## 2. For the ship review: commits that correct or depend on a neighbour

The code review checklist asks that a PR contain no fixes of itself. Three places in the phase's history do not meet it as it stands; the squash is the orchestrator's (`Skill("ship-review-stack")`).

- `c72f5ea18` revises the test file of `8a7716fff` (plan 03); plan 176-02's commits lie between them.
- `d14fb74c5`, the red-test commit of plan 13, fails `check` on its own: a test constant lacked `customData`, fixed in the next commit.
- `c23d8ce93` carries a guard entry that `fab21508d` should have carried (plan 05); three intermediate heads of plan 05 are read from the code as failing the scoped-query guard, and `81ba18e5e` as not type-checking on its own; neither was measured at its own commit.

## 3. Loose ends, none blocking

- **The tests' `buildRoute` takes a `locale` that selects nothing.** `tests/tests/utils/buildRoute.ts` requires a `locale` and puts it in the `[[lang=locale]]` segment of a route id; no route id of `apps/frontend/src/lib/routes/route.ts` holds that segment (searched), so every caller's `locale: 'en'` is inert, and a caller that passes another locale gets the default-locale page — which is how plan 176-18's Finnish test first went red. Its fixture now loads `/<locale><path>` itself. Either remove the parameter, or make it prefix the path as Paraglide's URL strategy does.
- **`contestant-home-task-badge`** (`testIds.contestant.home.taskBadge`) is on the tree and is not in the UI contract's locator list.
- **The E2E plan of 176-07 names a `logout:` title prefix**; the two logout tests are titled `holds:`. The spec's header is right; the plan's table is not.
- **`scripts/assert-project-scoped-queries.mjs` has 8 ESLint errors** on lines the phase did not touch (quotes, function style, `console`). The root lint chain does not lint `scripts/`.
- **svelte-check counted 2798 files in three runs and 2149 in two** during plan 05, with 0 errors and 0 warnings in all five. Why the count differs was not looked into.
- **`.planning/WINDOWS.md` was appended to by no plan of the phase.** Each summary says it had no stub, skipped test or unrun verify to record; plan 01 names two entries it would have made.
- **`EntityInfo.svelte` passes `t('common.alliance.singular')` to a `label` prop without capitalising it**; whether that component capitalises its label was not read (176-04-SUMMARY.md). The nominations view capitalises its own labels with the `uc-first` class.
- **Why the pre-commit run of plan 06 held one extra `Error formatting nomination` line** was not looked into; the logger is deleted since.
