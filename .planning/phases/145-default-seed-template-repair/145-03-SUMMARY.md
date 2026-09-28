---
phase: 145-default-seed-template-repair
plan: "03"
subsystem: testing
tags: [playwright, probe, negative-control, anon-rls, dev-seed, voter-results, evidence]

# Dependency graph
requires:
  - phase: 145-default-seed-template-repair
    provides: "145-01 — the 30-row negative-control ledger with A1-RED / A2-PRE pre-written, the HYGIENE-LOOP, and the § Sequencing hazard ordering rule"
  - phase: 145-default-seed-template-repair
    provides: "145-02 — the anon-client standing guard observed RED (P1-RED), which this plan mirrors at the app level rather than duplicates"
  - phase: 136-fake-guard-sweep
    provides: "the orphan-probe guard in tests/playwright.config.ts — the reason a new probe file must be registered in PROBE_TEST_MATCH to be runnable at all"
provides:
  - "tests/tests/specs/_probes/defaultTemplateResults.probe.spec.ts — criterion 1's evidence instrument: two @probe tests that walk the warm voter path and assert both of criterion 1's clauses in the running app"
  - "A screenshot-path convention (${TMPDIR}/gsd-145/app-${GSD_145_HALF}-<slug>.png) that produces the before/after pair from one source file with no edit between halves"
  - "Ledger row A1-RED measured RED with the rendered tab set quoted verbatim: [\"Parties\",\"Alliances\"] — no candidates tab"
  - "Ledger row A2-PRE measured GREEN (must-NOT-fire) at 8 organization cards — the in-phase measurement disproving the roadmap's (currently 0) parenthetical for parties"
  - "The measured fact that the shared journey fixture's first-constituency pick lands on Pirkanmaa (c_05) on the default template — D-08's nominated constituency, reached without steering"
affects: [145-04, 145-05, 145-08]

actuals:
  tokens: 4634
  tasks: 2
  commits: 3

tech-stack:
  added: []
  patterns:
    - "Evidence-instrument probe: a measurement spec that lives outside the cardinal gate (@probe + --grep-invert @probe + out-of-band seeding), so a dataset the gate cannot tolerate can still be asserted against in the running app"
    - "Half-name-from-environment screenshot naming: GSD_145_HALF is read at run time and encoded into the filename, so the before and after halves come from one unedited source file and a mismatched pair is visible in the filenames"
    - "Record-before-assert: the observed tab set and the screenshot are written BEFORE the assertion that is expected to fail, so a red half's evidence survives its own failure"
    - "Local-surface rule for probes: anything the shared fixtures do not provide is written inside the probe file, never by editing a gate surface under tests/tests/fixtures|helpers|utils"

key-files:
  created:
    - tests/tests/specs/_probes/defaultTemplateResults.probe.spec.ts
  modified:
    - tests/playwright.config.ts
    - .planning/phases/145-default-seed-template-repair/145-NEGATIVE-CONTROL-LEDGER.md

key-decisions:
  - "The probe does NOT override D-04. The standing regression guard for TMPL-03 remains 145-02's anon integration assertion; this file is criterion 1's evidence instrument. The distinction is written into the file's own header so a later reader cannot mistake it for a second standing guard."
  - "The tab assertion is over the tab SET (expectEntityTabs), not over a card count on a tab that may not exist — because an RLS-invisible entity type presents as a MISSING tab, the tab set being Object.keys(matches[electionId]) and the nomination tree dropping a whole leaf at zero nominations."
  - "A 240s per-test budget is declared inline with a // reason: block (above the 90s TIMEOUTS.testMax ceiling, per that file's own convention) because the default template's 26 questions and 327 candidates do not fit the ceiling — and a probe that times out is a VOID measurement, not a red one."
  - "The docstring's constituency claim was corrected from an assumption to the measurement (Pirkanmaa, not Uudenmaa North) in its own comment-only commit rather than by amending the measured commit, so the HEAD the ledger cites still exists."

patterns-established:
  - "Probe evidence pairs cite a screenshot path and a run log path in the ledger cell, not a recollection — two files on disk instead of two claims in prose"
  - "A register whose placeholder word is a bare lower-case token forbids that token anywhere in a filled row, including inside a directory path — the path is spelled around rather than the check weakened"

requirements-completed: []  # TMPL-03 is declared by sibling plans still in flight; requirements.ready-ids returned 0/1 ready.

coverage:
  - id: D1
    description: "A runnable instrument for criterion 1: two @probe tests that walk the warm voter path against whatever dataset is seeded and assert both clauses — a non-empty organizations list and an entity-tab set including candidates"
    requirement: "TMPL-03"
    verification:
      - kind: e2e
        ref: "tests/tests/specs/_probes/defaultTemplateResults.probe.spec.ts#parties list is non-empty @probe"
        status: pass
      - kind: e2e
        ref: "tests/tests/specs/_probes/defaultTemplateResults.probe.spec.ts#entity tabs include candidates @probe"
        status: fail
    human_judgment: false
    rationale: "The mixed pass/fail IS the designed outcome of this plan — see § Polarity. A2-PRE is the must-NOT-fire green, A1-RED is the recorded absence. 145-05 turns the second one green as A1-GREEN."
  - id: D2
    description: "The probe is reachable rather than orphaned coverage: registered in PROBE_TEST_MATCH so the orphan-probe guard (which throws on every playwright test invocation, --list included) stays satisfied"
    requirement: "TMPL-03"
    verification:
      - kind: other
        ref: "npx playwright test -c tests/playwright.config.ts --list — exit 0, both new test titles listed at ${TMPDIR}/gsd-145/pw-list-1.log:135-136"
        status: pass
    human_judgment: false
  - id: D3
    description: "The probe cannot contaminate the cardinal gate: it lives under specs/_probes, every test title carries @probe, the root test:e2e script appends --grep-invert @probe, and no shared fixture/helper/util was modified"
    requirement: "TMPL-03"
    verification:
      - kind: other
        ref: "git diff --name-only b35db47a6..HEAD -- tests/tests/fixtures tests/tests/helpers tests/tests/utils → empty; grep -c 'test(' = 2 and both titles end in @probe; no webServer block added"
        status: pass
    human_judgment: false
  - id: D4
    description: "Criterion 1's before half recorded as two files and an exit code: A1-RED quoting the rendered tab set verbatim and citing app-before-tabs.png, A2-PRE recording 8 organization cards and citing app-before-parties.png"
    requirement: "TMPL-03"
    verification:
      - kind: other
        ref: "Task 2 <automated> verify — exit 0: both screenshots non-empty, 0 placeholders across the two rows, 90 register-wide, A1-RED cites the screenshot, the parties test absent from every failure line"
        status: pass
    human_judgment: false
  - id: D5
    description: "The assertions ran against a page served by this checkout"
    verification:
      - kind: other
        ref: "${TMPDIR}/gsd-145/pw-A-before-1.log:2 — 'E2E PREFLIGHT OK …/apps/frontend (verified against …/voting-advice-application-gsd)', one success line, zero failure lines"
        status: pass
    human_judgment: false

# Metrics
duration: 14 min
completed: 2026-08-24
status: complete
---

# Phase 145 Plan 03: The Criterion-1 Probe, Observed at the Pre-Fix Template Summary

**A `@probe`-tagged Playwright spec that walks the warm voter path and asserts criterion 1's two clauses in the running app, run once against the pre-fix `default` template: the parties list already renders 8 organization cards (GREEN, must-NOT-fire) while the entity-tab bar renders `["Parties","Alliances"]` with no candidates tab at all (RED) — the app-level mirror of `D1-ANON-PRE`'s absent `candidate` key, and criterion 1's "before" half turned into two screenshots and an exit code.**

## Performance

- **Duration:** 14 min
- **Started:** 2026-08-24T13:31:38Z
- **Completed:** 2026-08-24T13:45:09Z
- **Tasks:** 2
- **Files modified:** 3 (1 created, 2 modified)

## Accomplishments

- **Criterion 1 now has an instrument.** `defaultTemplateResults.probe.spec.ts` asserts, in the running app, both halves of criterion 1 — a non-empty organizations list and an entity-tab set including candidates — against whatever dataset happens to be seeded. It is re-runnable, citable by exit code, and checkable by anyone else, which a remembered walk is none of.
- **The pre-fix state is recorded rather than remembered.** One run at HEAD `49954257e` produced `app-before-parties.png` and `app-before-tabs.png` plus `pw-A-before-1.log`; the tab screenshot shows the tab bar reading `Parties | Alliances` above `8 parties in constituency Pirkanmaa`.
- **`A1-RED` filled — RED (catch).** Observed tab set verbatim: `["Parties","Alliances"]`. `expectEntityTabs(['cands', 'orgs', 'alliances'])` failed at its count clause (`Expected: 3 · Received: 2`, `9 × locator resolved to 2 elements`) before ever reaching the per-tab name clauses.
- **`A2-PRE` filled — GREEN, must-NOT-fire.** 8 organization cards. This is the in-phase measurement that disproves the roadmap's *(currently 0)* parenthetical for parties (D-01); `145-08` carries the record correction.
- **The gate is untouched.** No file under `tests/tests/fixtures/`, `tests/tests/helpers/` or `tests/tests/utils/` was modified, no `webServer` block was added, the `--grep-invert @probe` exclusion is unchanged, and both test titles carry `@probe`.
- **A bonus measurement:** the shared journey fixture's first-constituency pick lands on **Pirkanmaa (`c_05`)** on the default template — exactly D-08's nominated constituency (48 candidates, the smallest count), reached without the spec steering for it.

## Task Commits

1. **Task 1: Add the probe and register it in `PROBE_TEST_MATCH`** — `49954257e` (test)
2. **Deviation fix: correct the docstring's constituency claim** — `3d386050b` (docs, comment-only)
3. **Task 2: Record rows `A1-RED` and `A2-PRE`** — `31c64fa2a` (docs)

**Plan metadata:** see the `docs(145-03): complete …` commit.

## Files Created/Modified

- `tests/tests/specs/_probes/defaultTemplateResults.probe.spec.ts` — **created.** Two `@probe` tests plus three local helpers (`captureHalf`, `walkToResults`, `readRenderedEntityTabs`) and a header docstring stating what it measures, why it is not the standing guard, the out-of-band seed step, the run command, and why the walk is warm-path-only.
- `tests/playwright.config.ts` — `defaultTemplateResults` added as one more alternative in `PROBE_TEST_MATCH`. Nothing else about the regex or the `_probes` project changed (Prettier reflowed the line to two).
- `.planning/phases/145-default-seed-template-repair/145-NEGATIVE-CONTROL-LEDGER.md` — rows `A1-RED` and `A2-PRE` filled. Register placeholder count 100 → **90**.

## Polarity — one red and one green, both by design

| Row | Test | Expected | Observed | Verdict |
|---|---|---|---|---|
| `A1-RED` | `entity tabs include candidates @probe` | RED | tab set `["Parties","Alliances"]`, `Expected: 3 · Received: 2` | **RED (catch)** — as declared |
| `A2-PRE` | `parties list is non-empty @probe` | GREEN (must-NOT-fire) | 8 organization cards | **GREEN** — as declared |

The run's exit code is **1**, driven entirely by `A1-RED`. A search of every failure-reporting line in `pw-A-before-1.log` for `parties list is non-empty` returns **0** matches, so the green half is green on its own evidence and not by absence of attention.

**Nothing was retried, skipped or annotated flaky.** The probe was run **once**, and its result is the record.

## Decisions Made

- **This probe does not override D-04.** D-04 rejected "a Playwright spec seeding `default` mid-suite" for two reasons — shared-database contamination and cardinal-gate risk. Neither reaches this file: it seeds nothing (out-of-band pre-step, as for the five sibling probes) and never runs in the gate. The standing regression guard for TMPL-03 remains `145-02`'s anon integration assertion. The file's own header says so, in the place a reader would otherwise assume otherwise.
- **Assert over the tab SET, not over a card count.** The layout derives its tabs from `Object.keys(matches[electionId])` and the nomination tree drops a whole leaf at zero nominations, so an RLS-invisible entity type presents as a **missing tab**, never as an empty list. A card-count assertion would have to select a tab that does not exist. The reasoning is written as a comment immediately above the assertion.
- **A 240s per-test budget, declared inline with a `// reason:` block.** Above the 90s `TIMEOUTS.testMax` ceiling, per that file's own convention for exceptions (`perm-localisation-positive`'s 180s is the precedent). The default template's 26 questions and 327 candidates do not fit the ceiling, and a probe that times out is a **void** measurement, not a red one — the budget exists to make the failure be the assertion.
- **Web-first assertions (`expect(cards).not.toHaveCount(0)`) rather than `expect(await cards.count()).toBeGreaterThan(0)`**, so `playwright/prefer-web-first-assertions` stays quiet under the suite's 0-warnings lint gate. The observed counts are still logged, separately from the assertion, for the ledger to quote.
- **Correct the docstring in its own commit, not by amending.** The measured commit `49954257e` is cited by HEAD in `A1-RED`; amending it would have left the ledger naming a commit that no longer exists.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The probe docstring asserted the wrong constituency**

- **Found during:** Task 2 (reading the pre-fix run's screenshots)
- **Issue:** The header I wrote in Task 1 claimed the shared journey fixture's first-constituency pick resolves to "Uudenmaa North / `c_01`" on the default template. That was an inference from `default.ts`'s `sort_order`, not a measurement. The run showed `8 parties in constituency **Pirkanmaa**` — `c_05`. A file that makes a false claim about its own behaviour is a defect even when the claim is a comment, and this one would have misled `145-05` about which surface the after-half is measured on.
- **Fix:** Replaced the claim with the measurement, citing the screenshots it can be checked against, and noted that this happens to be exactly D-08's nominated constituency.
- **Files modified:** `tests/tests/specs/_probes/defaultTemplateResults.probe.spec.ts` (comment-only)
- **Verification:** `npx prettier --check` clean; the two test bodies and every assertion are byte-identical across the change (`git show 3d386050b` touches only the header block).
- **Committed in:** `3d386050b`

**2. [Rule 3 - Blocking] The register's placeholder word appeared inside a real directory path**

- **Found during:** Task 2 (the automated verify's first run, exit 1)
- **Issue:** `A2-PRE`'s outcome cell cited the todo file by its full path, `.planning/todos/pending/2026-06-06-…`. That path contains the register's placeholder token as a directory segment, so the ledger's own "no placeholder in a filled row" check counted 1 instead of 0 and the register-wide count read 91 instead of 90.
- **Fix:** Spelled the reference around the token — the todo is named by filename with its directory described rather than pasted, and the cell says why. The check was **not** weakened, and no other row was touched.
- **Files modified:** `.planning/phases/145-default-seed-template-repair/145-NEGATIVE-CONTROL-LEDGER.md`
- **Verification:** Task 2's `<automated>` verify re-run at exit 0; A-row placeholder count 0, register-wide 90.
- **Committed in:** `31c64fa2a` (part of the Task 2 commit — the fix preceded the commit)

---

**Total deviations:** 2 auto-fixed (1 bug, 1 blocking).
**Impact on plan:** None on scope. Neither touched an assertion, a fixture, or a measured value — one corrected a false claim a file made about itself, the other corrected prose so an existing check could be satisfied honestly rather than relaxed.

## Issues Encountered

None. The dev server started clean on `:5173` (nothing was holding the port), the preflight passed on the first attempt, and the probe produced the declared shape on its single run.

## Prohibitions — disposition

| Prohibition | Disposition |
|---|---|
| No modification to `tests/tests/fixtures\|helpers\|utils` | Honoured — `git status` and `git diff b35db47a6..HEAD` over those paths are both empty. Everything the probe needed beyond the fixture surface is local to the probe file. |
| Probe added to no project other than `_probes` | Honoured — the only config change is one alternative inside `PROBE_TEST_MATCH`. |
| `--grep-invert @probe` not removed or weakened; no `webServer` block | Honoured — `package.json` and the config's project list are otherwise untouched. |
| No untagged test in the probe file | Honoured — 2 `test(` calls, both titles ending in `@probe`, and the enclosing `describe` tagged too. |
| No direct navigation to a `/results` URL | Honoured — the file contains no `page.goto` at all; both tests reach results through `walkUntilQuestionsIntro` + `answerAndAdvanceToResults`. |
| No soft assertions | Honoured — `grep -c 'expect\.soft'` = 0. |
| No retry-until-green, no skip, no flaky annotation | Honoured — one run, one record. |

## Environment left behind — read this before the next wave

- **The Vite dev server this plan started is STILL RUNNING** on `http://localhost:5173` (started with `yarn dev` from the repository root; its output is at `${TMPDIR}/gsd-145/devserver-145-03.log`). It is the only server on that port, and the preflight verified it is serving **this** checkout. `145-04` does not need it; `145-05` does. Stop it with a `pkill -f "vite dev"` (or by killing the `yarn dev` process group) if a plan needs the port free — `yarn dev` uses `strictPort` and will fail loudly rather than drift.
- **The database holds the PRE-FIX `default` dataset**, seeded in this session by `yarn db:reset-with-data` (`${TMPDIR}/gsd-145/seed-reset-145-03-1.log`: 327 candidates · 377 nominations · 8 organizations · 2 alliances · 5 constituencies · 26 questions). It is **not** `e2e/base`, so the cardinal gate suite must not be run against it — `145-08` runs `yarn db:reset` plus the suite's own data-setup projects first, which is the protocol Phase 144 required.
- **⚠ Do not run `yarn test:unit` before the next measurement that depends on this dataset.** The dev-seed integration test rewrites the full default template to the live database and has no teardown.
- Local Supabase is up (REST 200 on `http://127.0.0.1:54321`).

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- **`145-04` (the fix) is unblocked.** It changes `defaults/candidates-override.ts` and the `PUBLISHABLE_TABLES` comment block; it owns `P1-GREEN`, `U1-GREEN` and the second half of `U2`. It does not need the dev server, and it must **re-seed** before any app-level claim.
- **`145-05` inherits a ready instrument.** `A1-GREEN` and `A2-POST` are produced by re-seeding (`yarn db:reset-with-data`) on the fixed tree and running `GSD_145_HALF=after yarn test:e2e:probes defaultTemplateResults` — the same unedited spec file, writing `app-after-parties.png` and `app-after-tabs.png` beside the before pair. **If `A2-POST` comes out red, stop:** it is a must-NOT-fire row and a colour change would mean the assertion is coupled to the fix rather than to the parties surface it pins.
- **`145-08` inherits a record correction to carry:** `A2-PRE` is the measurement disproving the roadmap's *(currently 0)* parenthetical for parties (D-01). ROADMAP criterion 1, `REQUIREMENTS.md:70` and the 2026-06-06 todo all still state the stale premise.
- Register placeholder count: **90**, leaving the twenty rows `145-04` … `145-08` own.

## Self-Check: PASSED

- `tests/tests/specs/_probes/defaultTemplateResults.probe.spec.ts` — **FOUND** on disk, non-empty.
- Commits `49954257e`, `3d386050b`, `31c64fa2a` — all **FOUND** in `git log`.
- `${TMPDIR}/gsd-145/app-before-parties.png` (130,672 B), `app-before-tabs.png` (105,908 B), `pw-A-before-1.log`, `pw-list-1.log` — all **FOUND**, all non-empty.
- Task 1 `<automated>` verify — re-run at **exit 0**.
- Task 2 `<automated>` verify — re-run at **exit 0**.
- Plan-level `<verification>`: 6 probe files ✓ · `playwright test --list` exit 0 ✓ · no gate fixture modified ✓ · run exit 1 in the declared shape ✓ · two screenshots cited by two rows ✓ · register placeholder count 90 ✓.

---
*Phase: 145-default-seed-template-repair*
*Completed: 2026-08-24*
