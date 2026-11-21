---
phase: 182-analytics-relay
plan: 21
subsystem: e2e-tracking
tags: [analytics, relay, e2e, playwright, consent-free, opt-in-project]
status: complete

requires:
  - phase: 182-10
    provides: createRelayCapture, expectOnlyAllowedDeviceState, the PLAYWRIGHT_ANALYTICS_STANDALONE spread with its guard and data-setup-analytics-standalone
  - phase: 182-16
    provides: the tracking spec's flush helpers and its named first test
  - phase: 182-17
    provides: the voter privacy page that shows privacy.analytics.content.free and no consent control in consent-free mode
  - phase: 182-20
    provides: the stand-alone project layout and the GPC spec's prompt and hydration helpers
provides:
  - tests/tests/specs/voter/voter-tracking-consent-free.spec.ts (five serial tests)
  - the opt-in Playwright project analytics-consent-free inside the PLAYWRIGHT_ANALYTICS_STANDALONE spread
  - evidence/21-gates.txt (tests typecheck, tests lint and a11y wiring green on 0ccdfe6ce)
affects: [182-24, 182-28, 182-31]

estimate:
  tokens: 50000
  tasks: 1
actuals:
  tokens: 5100      # chars/4 over the plan's code diff e504ed0f1..c971a5384 outside .planning (20461 chars)
  tasks: 1
  commits: 2        # MEASURED: git rev-list --count plan_head_before..HEAD at SUMMARY write; the SUMMARY and roadmap commits follow
plan_head_before: e504ed0f1c827760278c816c55272f7fba85b364
plan_head_after: c971a53846ac21c50e1262344bd76fd519818ac1

tech-stack:
  added: []
  patterns:
    - "A spec for one deployment mode asserts the mode on a page that reads the same projection, before any action the other mode could block, with a message that names the variables"
    - "A context init script with a MutationObserver records whether a consent prompt ever appeared in a document, so 'no prompt across the journey' is not a point-in-time snapshot"

key-files:
  created:
    - tests/tests/specs/voter/voter-tracking-consent-free.spec.ts
    - .planning/workstreams/deployment/phases/182-analytics-relay/evidence/21-gates.txt
  modified:
    - tests/playwright.config.ts

key-decisions:
  - "The non-sensitive event with the visit id is menu_open, buffered on the front page by opening and closing the menu, in the same document as the answer"
  - "The opt-in project reuses data-setup-analytics-standalone; it is collected only inside the PLAYWRIGHT_ANALYTICS_STANDALONE spread, so the guard refuses it in a run without --project"

requirements-completed: []   # left to the orchestrator: the spec is observed only by the runs of 182-24, 182-28 and 182-31

duration: about 3 min from the start-sha record (20:06Z) to the gate record (20:08Z); the reading came before
completed: 2026-10-19
---

# Phase 182 Plan 21: The consent-free spec and its opt-in project Summary

**A five-test serial spec, `voter-tracking-consent-free.spec.ts`, covers consent-free mode. It shows that events are sent with no prompt, that an `answer` and every `pageview` carry no id from the browser while a `menu_open` of the same document carries a UUIDv7, that the privacy page shows the consent-free text and no consent control, and that the device holds only allow-listed state. It runs only in the new opt-in project `analytics-consent-free`, and its first assertion fails by name when the server is not in consent-free mode. Tests typecheck, tests lint and the a11y wiring guard are green on `0ccdfe6ce`. No E2E run was made.**

**Start sha:** `e504ed0f1c827760278c816c55272f7fba85b364`.

## Accomplishments

### The spec (`0ccdfe6ce`)

`tests/tests/specs/voter/voter-tracking-consent-free.spec.ts` has one serial describe. A `beforeEach` attaches `createRelayCapture(context)` and a prompt watcher before the first navigation of each test. The watcher is a context init script with a `MutationObserver`. It records, per document, whether a dialog or alert holding the "agree to share my data" button ever appeared.

1. **"the server is in consent-free mode".**
   - Its first step opens `/en/privacy` by URL. It asserts that `voter-privacy-content` contains the English `privacy.analytics.content.free` text, read from `messages/en/privacy.json`.
   - The message is `MODE_MESSAGE`: "the server is not in consent-free mode: this spec needs the server started with ANALYTICS_CONSENT_MODE=free and ANALYTICS_PROVIDER=log …".
   - No click, fill or keyboard action comes before it.
   - Then it opens the voter front page (hydrated), starts, answers with `answerAndAdvanceToResults(page, 'max')`, and does not touch any dialog. It flushes in a bounded poll, with the same message, until an `answer` event is captured.
2. **"no prompt is shown".** The walk (front page, menu open and close, first question, answer, results) asserts at each step that no consent dialog and no granting button is on the page. At the end it asserts that the watcher saw no prompt in the document.
3. **"an answer cannot be linked".** The same walk, then:
   - no captured `answer` has an `id` member;
   - no `pageview` has one;
   - at least one `menu_open` was captured, and every one of them has a UUIDv7 `id`. The message names visit-id mode `memory`.
4. **"the privacy page describes the mode".** The privacy page, hydrated:
   - it contains the consent-free text;
   - there is no "Collecting Usage Data" heading, no granting button and no denying button;
   - the watcher saw no prompt.
5. **"the device holds only allow-listed state".** The same walk, then `expectOnlyAllowedDeviceState(context, page)`.

### The opt-in project (`0ccdfe6ce`)

In `tests/playwright.config.ts`, inside `ANALYTICS_STANDALONE_PROJECTS` (the spread keyed on `PLAYWRIGHT_ANALYTICS_STANDALONE`), there is a new project `analytics-consent-free`. It uses `testDir: './tests/specs/voter'`, `testMatch: /voter-tracking-consent-free\.spec\.ts$/`, `fullyParallel: false`, Desktop Chrome, and depends on `data-setup-analytics-standalone`.

The OPT-IN list of the configuration docblock has a new bullet with the command:

```
PLAYWRIGHT_ANALYTICS_STANDALONE=1 ANALYTICS_PROVIDER=log ANALYTICS_CONSENT_MODE=free tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/<new run name> --project analytics-consent-free
```

It says that the wrapper resets the database first. The command has no reset-skip flag. The comment above the spread names the new project too.

### Gates (`c971a5384`)

Attempt `20261019T200817Z.0ccdfe6ce` on `0ccdfe6ce`. The tree was clean before and after, and HEAD did not change.

| Gate | Exit |
|------|------|
| `yarn typecheck:tests` | 0 |
| `yarn eslint tests` | 0 |
| `yarn assert:a11y-scan-wiring` | 0 |

The tracked `evidence/21-gates.txt` is a `cp` of the attempt file.

## Verification

| Check | Result |
|-------|--------|
| `PLAYWRIGHT_ANALYTICS_STANDALONE=1 … --list --project analytics-consent-free` | exit 0; 7 tests in 3 files: the 5 spec tests plus the stand-alone setup and teardown |
| Default listing `--list --grep-invert @probe` does not name the spec | exit 0; 542 tests in 126 files, the same as after 182-20 |
| Slot `21-gates` pointer verify (as written in the plan) | exit 0 |
| No `(182-21):` commit lists `tests/scripts/e2e-run.sh` | 0 for both commits |
| `node scripts/assert-comment-hygiene.mjs` on the two files | 0 violations |
| Prettier on the two files | the spec was formatted before the commit; the config was unchanged |

`yarn eslint tests` printed one warning that was already there: an unused `no-console` disable in `tests/tests/support/mockOidcIssuerEntry.ts`. The exit was 0.

No E2E run was made, and no stack or dev server was started. The shared stack `openvaa-local` stayed stopped.

## Deviations from Plan

### 1. [Plan intent] "No prompt is shown" also uses a recorded observer, not only snapshots

The plan says that no consent dialog appears across the journey. A `toHaveCount(0)` only describes one moment. So the spec also installs an init script that records whether a consent prompt ever appeared in the document. Test 2 asserts on that record, and so does test 4. The point-in-time assertions of the GPC spec are kept as well.

### 2. [Handover, not plan] The Contestant terms spec is not in this plan

The orchestrator's handover from 182-20 says to add the Contestant terms spec to the stand-alone `testMatch`. The plan's objective says that half moved to plan 182-27. So `analytics-default-standalone`'s `testMatch` and `voter-prefs-tracking`'s `testMatch` are unchanged here.

### 3. [Shared-checkout] The worktree allow-list was not applied

The checkout is a linked worktree on the operator's integration branch `feat/deployment-terraform-supabase`, not an `agent-*` branch, and the orchestrator directed the work there. The protected-branch check returned `false`.

### 4. [Orchestrator instruction] State was not advanced

`state.advance-plan` and `state.record-session` were not run, STATE.md was not edited, and no requirement was ticked.

## Known Stubs

None.

## Threat Flags

None. No product file changed.
- **T-182-87:** the first test asserts the mode on the privacy page before any action, and then requires an `answer` with no prompt. Both messages name the variables.
- **T-182-89:** the project is in the guarded spread. The default listing does not name the spec.

## Notes for later plans

- **182-24 / 182-28 (the consent-free runs):**
  - Use the command in the docblock's opt-in list. Export the variables in the wrapper's background command, then put `bash tests/scripts/e2e-run.sh …` on its own line, with no reset-skip flag.
  - **First-run risks, all UNCONFIRMED in a real app run:**
    1. `openAndCloseMenu` on the front page under Desktop Chrome. The tracking spec does the same.
    2. That the `menu_open` batch (front page) and the `answer` batch (question page) are both sent at the client navigations of the walk. The flush poll covers a late send.
    3. That `expectOnlyAllowedDeviceState` accepts the stored preferences in free mode.
    4. That the prompt watcher's scan does not find a hidden but mounted alert holding a granting button. Code reading says the popup is not pushed in free mode.
- **182-31 (red control):** run the same command without `ANALYTICS_CONSENT_MODE=free`. The expected failure is test 1's `toContainText` with `MODE_MESSAGE`, after the `slowPage` timeout. Tests 2 to 5 then do not run, because the describe is serial. Count them as not run, not as passed.
- **182-27:** the Contestant terms spec still has to be added to `analytics-default-standalone`'s `testMatch`, which is `/(analytics-privacy|voter-prefs-tracking|analytics-gpc)\.spec\.ts$/`, and to `voter-prefs-tracking`'s if it belongs in the default run.
- **182-22:** the comment above the stand-alone spread already said "runs two spec files" before this plan, and it is stale: the default stand-alone project collects three. It is a comment-only fix and was left alone here.

## Self-Check: PASSED

- FOUND: `tests/tests/specs/voter/voter-tracking-consent-free.spec.ts` and `evidence/21-gates.txt`. The record is `cmp`-equal to the current attempt file.
- FOUND: commits `0ccdfe6ce` and `c971a5384`, each an ancestor of HEAD.
