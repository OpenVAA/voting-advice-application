# Phase 182: closing record

This record adds no new evidence. It points at the evidence the earlier plans left and says where that evidence stops. Before it was written, each of the six run records the table names was compared with `cmp -s` against the file its pointer under `tmp/182-evidence/` names, and each is a byte copy of the current attempt of its slot, with no status or verdict key written twice.

## Header

CLOSING_DATE=2026-10-20
FULL_RUN_DIR=tests/e2e-runs/182-28-full-20261020T055034Z.cb8da595b414
FULL_RUN_HEAD=cb8da595b414c15572ad05e23b7658731834727c
FULL_RUN_COUNTS=total 548, passed 548, failed 0, flaky 0, skipped 0, did not run 0
CONSENT_FREE_RUN_DIR=tests/e2e-runs/182-28-consent-free-20261020T055034Z.cb8da595b414
UNLOAD_FORM=direct form
UNLOAD_FORM_IN_TREE=proxy form, as of 0e343a40d (plan 182-24); UNLOAD_FORM above is the value plan 182-23 recorded and no longer describes the test in the tree

Commits the evidence describes. `cb8da595b` (the closing runs of plan 182-28), `7d35eef74` (the consent-mode red controls of plan 182-31) and `0e343a40d` (the single-project green runs of plan 182-24) do not differ outside `.planning` (`git diff --quiet` exits 0 for each pair). `95449c502` is the tree before the cutover (the red runs of plan 182-11). `e97a38ccf` is the tree just after the cutover (the green runs of plan 182-23).

## RELAY-12: red and green

| Property | Red artefact | Green artefact |
|----------|--------------|----------------|
| no analytics identifier in any device store | `evidence/11-red-unchanged.txt` (on `95449c502`: "the device holds state outside the allowlist: sessionStorage: appContext-sessionId") | `evidence/23-green-cutover.txt` (on `e97a38ccf`) and `evidence/28-full-suite.txt` (on `cb8da595b`) |
| no request to a third-party origin | `evidence/11-red-unchanged.txt` (on `95449c502`: "script https://cloud.umami.is/script.js: origin https://cloud.umami.is is not allowed") | `evidence/23-green-cutover.txt` (on `e97a38ccf`) and `evidence/28-full-suite.txt` (on `cb8da595b`) |
| nothing but the pageview before consent in the default mode | `evidence/31-red-free-mode.txt` (on `7d35eef74`, server in consent-free mode: "non-pageview events were sent before consent: answer, results_ranked") | `evidence/28-full-suite.txt` (on `cb8da595b`, default mode) |
| events without a prompt in consent-free mode | `evidence/31-red-default-mode.txt` (on `7d35eef74`, server in the default mode: the mode precondition failed, its message naming `ANALYTICS_CONSENT_MODE`) | `evidence/28-consent-free-final.txt` (on `cb8da595b`, `ANALYTICS_CONSENT_MODE=free`, 7 of 7) |

Each red run failed by the test's own assertion, not by a timeout or a setup error, and each red and green run of the table used a database the wrapper reset from this worktree, with the schema probe printing `t`. The two consent-mode properties also have green runs on `0e343a40d`, the commit their red controls were made against: `evidence/24-default-standalone.txt` (22 of 22) and `evidence/24-consent-free.txt` (7 of 7).

Other seen-red controls of the phase:

The pgTAP assertion of the closed-project member (`contestant_app_public_config` gives a signed-out reader of a project not open for voters the `analytics.trackEvents` member): red `evidence/02-d13-red.txt` (8 of 20 assertions of file 38 failed on the unchanged function), green `evidence/02-d13-green.txt` (2605 tests, all files pass).

The environment-template test (`analyticsEnvTemplates.test.ts`): red `evidence/06-templates-red.txt` (18 of 23 failed on the templates before the analytics variables were added).

## Not checked by a machine, not reviewed by a person

The wording that matters legally was checked by a test in English only (plan 182-12). The other catalogues were checked for having the same keys and for compiling, not for what they say. One line per locale other than the base locale `en`, taken from `apps/frontend/project.inlang/settings.json`:

The translation of the privacy strings into `fi` is unreviewed by a speaker.
The translation of the privacy strings into `sv` is unreviewed by a speaker.
The translation of the privacy strings into `da` is unreviewed by a speaker.
The translation of the privacy strings into `et` is unreviewed by a speaker.
The translation of the privacy strings into `fr` is unreviewed by a speaker.
The translation of the privacy strings into `lb` is unreviewed by a speaker.

The classification of the events the research marked as assumption A11 is unreviewed by the operator.

Not yet observed by a person: the visibility of the focus ring on the opt-out checkbox. Keyboard operation, the axe scan and reflow at 320 px of that checkbox are asserted by `contestant-terms-tracking.spec.ts`.

Keepalive at page leave: as of `0e343a40d` the page-leave test in `analytics-privacy.spec.ts` ("a keepalive POST to the relay made as the page is left is captured and answered (proxy form)") reads the relay's answer through the recording proxy (`startRelayRecordingProxy()`), not as the captured request's own response, because Playwright reports that response only when it arrives before the page is left; it passed in the full run of `evidence/28-full-suite.txt` (status `passed` in that run directory's `results.json`). It shows that a keepalive send started as the page is left is captured and that the relay answers it with 204; it does not show that the `keepalive` flag is necessary for such a send to arrive. Keepalive necessity was not measured. `evidence/23-keepalive-control.txt` records `CONTROL_KEEPALIVE_TEST=passed` and `KEEPALIVE_NECESSITY=not observed` for a run on `e97a38ccf` with keepalive off, but that run used the direct form, which cannot see an answer that arrives after the page is left, so the control measured nothing about whether a send survives page close without keepalive.

Human check outstanding (plan 182-04, Task 1): open `.planning/workstreams/deployment/phases/182-analytics-relay/evidence/04-event-catalogue.md` and look for an attribute that holds text a visitor typed or text taken from published content, and for a reading above the table that should be changed.

Human check outstanding (plan 182-12, Task 2): open `privacy.json` in each of the seven locale directories under `apps/frontend/messages` and look, in the eight new strings and in `privacy.cookies.content`, for a translation that does not say what the English says, for a text that names a processor, and for a text that states or implies anything about whether a visitor must be asked.

## Open questions

The legal questions are open, and they are the deployer's to determine (ruling B7: the documentation describes the mechanism, and the determination is the deployer's). Open are: whether consent is needed for the page-view count and for events in a given jurisdiction, including whether a script-sent pageview before consent is "access" under ePrivacy Art. 5(3); and whether acceptance of the terms of use with an opt-out checkbox is valid consent in the Contestant app. The operator chose that form with its weakness stated (D-12 of `182-CONTEXT.md`). This phase determined neither question, and no test of it bears on them.

The follow-ups this phase rests on, from `.planning/workstreams/deployment/v2.17-181-183-RESEARCH-FOLLOWUPS.md`. No box of these entries is ticked and no NOTE is written there, and `182-CONTEXT.md` records the planned answers as amendments that the operator has not ruled on. The plans were written on the recommended answers; a recommended answer is not a ruling.

182-R1: unanswered by the operator. Planned on the recommended answer (amendment A-01): one pageview per view, sent at the first of a client navigation, the tab becoming hidden, or `pagehide` as a fallback. An overrule changes the one-pageview-per-view tracker (`viewTracker`) and its tests; the no-duration option also removes the pageview's `duration` member from the event schema and reverses the operator's note, and the two-send option adds a per-view token, which conflicts with "no id".
182-R2: unanswered by the operator. Planned on the recommended answer (amendment A-03): the opt-out checkbox is unticked by default, labelled "do not collect usage data", pre-ticked when this browser holds a refusal, and hidden under `Sec-GPC`. An overrule to a ticked "allow" box changes `TrackingOptOut`, its gate in `TermsOfUseGate.svelte` and `contestant-terms-tracking.spec.ts`; an overrule to a per-user choice stored on the server is a schema change that must land before the freeze of phase 181.
182-R3: unanswered by the operator. Planned on the recommended answer (amendment A-03): the Contestant privacy page shows the existing consent control when tracking is enabled. An overrule removes that control from the Contestant privacy page and its assertion from the E2E suite, and a contestant could then not change the choice in the Contestant app.
182-R4: unanswered by the operator. Planned on the recommended answer (amendment A-04): `.env.example` sets `ANALYTICS_PROVIDER=log` and the code default stays `none`. An overrule puts `.env.example` back to `none`, changes `analyticsEnvTemplates.test.ts`, and leaves every gate run to set the provider by an environment prefix, as the E2E runs of this phase already did.
182-R5: unanswered by the operator. Planned on the recommended answer (amendment A-05): a consent grant stored under the old text stays a grant. An overrule bumps `requireUserDataVersion`, which also discards voters' stored answers.
182-R6: unanswered by the operator. Planned on the recommended answer (amendment A-08, which narrows D-14): the terms-of-use paragraph on tracking is shown when `trackEvents` is on and a provider is configured. An overrule makes the condition in `TermsOfUse.svelte` `trackEvents` alone, and the unit case "`trackEvents` true, provider configured false" in `TermsOfUse.svelte.test.ts` then expects both keys; nothing else changes (plan 182-18).
X-1: unanswered by the operator. Planned on the recommended answer: the operator carries a note to the v2.16 session; the note is the heading "For the v2.16 session (follow-up X-1)" of `182-02-SUMMARY.md` (cherry-pick `87ae648f6`, regenerate there, and keep the `analytics` member in any later `CREATE OR REPLACE` of `contestant_app_public_config`). Whether it has been handed over is not recorded. An overrule to the second option has the note written into the `-gsd` worktree instead; an overrule to the third holds the `[db]` change back until after the freeze and reverses the operator's ruling on the 182-12 gap (D-13).
X-2: unanswered by the operator. Planned on the recommended answer: database observations ran on the isolated instance `p182`, and each E2E window on the shared stack was a checkpoint. The operator's standing words of 2026-10-19 ("I'll keep the stack free, so just continue w the rest of the steps at will") answered the window checkpoints of plans 182-24, 182-31 and 182-28; they are not a choice among the options of X-2. An overrule to a permanent own project id and ports for `-infra` removes the checkpoints, and whether the E2E wrapper's preflight accepts other ports is unmeasured; an overrule to never running the two sessions at once changes when windows may be opened, not the evidence.

## Left to later phases

Not done here:

- Real capture at PostHog, and the placement of the id in a batch item: phase 188 (RELAY-04). This phase tested the PostHog provider against a stand-in only (`evidence/09-production-relay.txt`, observation 4).
- The WAF rate rule: phase 188 (RELAY-09). This phase built the same-origin check, the body cap, the bounded queue and the fixed destination.
- The analytics documentation, the event catalogue for deployers and the deployer's checklist: phase 189 (DOCS-05), together with the five `ANALYTICS_` variables on the documentation page of environment variables and the closure record of the absorbed todo `2026-06-01-convert-analytics-to-dynamic-setting-add-consent-e2e`.

The contact with phase 181, from `evidence/22-sweep.txt`:

STARTUP_CONTACT=already
SHUTDOWN_FORM=registerShutdownFlush

The start-up contact is made: `STARTUP_RULES` in `apps/frontend/src/lib/server/startup/requiredEnv.ts` already holds `analyticsStartupProblems`. The shutdown contact is open: `apps/frontend/src/lib/server/startup/shutdown.ts` was not tracked at the sweep, so `apps/frontend/src/lib/server/analytics/runtime.ts` keeps `registerShutdownFlush(queue)`. The rule: when plan 181-14 lands `onShutdown(task)`, `runtime.ts` must register the queue's flush through it and attach no listener of its own, and the tests under `src/lib/server/analytics` and `src/routes/api/usage` are run again.

## The shared local database

This session last reset the shared local database (`openvaa-local`) in the window of plan 182-28 (attempt `20261020T055034Z.cb8da595b414`): the E2E wrapper reset it from this worktree for the full run and for the consent-free run, and the stack was stopped at the end of the window (`evidence/28-window.txt`, `STACK_STOPPED_AT_END=yes`).

The v2.16 session must run `yarn db:reset` from its own worktree before it uses the local stack again.

## Open items carried from deferred-items.md

These were found during the phase, are outside its scope, and stay open. Each names who should act.

- The focus gap fixed on the voter privacy page (`e06816d05`, NAVA11Y-02) remains on four page headings that cannot take the post-navigation focus (no `tabindex="-1"` on 2026-10-20): `apps/frontend/src/routes/(voters)/about/+page.svelte`, `apps/frontend/src/routes/admin/login/+page.svelte`, `apps/frontend/src/routes/(voters)/(located)/questions/category/[categoryId]/+page.svelte` and `apps/frontend/src/lib/layouts/main/MaintenancePage.svelte`. Act: whoever next owns NAVA11Y-02 or edits one of these files, with a unit test that is red first.
- `scripts/assert-a11y-scan-wiring.mjs`, Check 4a, does not list `tests/tests/specs/contestant/contestant-terms-tracking.spec.ts`. Act: whoever next edits the guard.
- `apps/frontend/src/hooks.server.ts`: the start-up error says "not set" also for an invalid `ANALYTICS_` value. Act: phase 181, which owns that wording.
- Stale comments: the class comments "Inherited appContext members" in `contestantContext.svelte.ts` and `adminContext.svelte.ts`, and the docblock of `tests/tests/setup/perm/perm-analytics-tracking.setup.ts`. Act: whoever next edits each file; comment only.
- Texts left stale by the keepalive form change (`0e343a40d`): 182-20-PLAN Task 1 and its form verify (a re-run of that verify is expected to fail), the `UNLOAD_FORM=direct form` line of `evidence/23-green-cutover.txt`, the `GREEN_RUN=` line of `evidence/23-window.txt`, the reading of `evidence/23-keepalive-control.txt`, the 182-23-PLAN must-have on the two forms, and research assumption A1 in 182-RESEARCH (settled: not reported). The evidence files are byte copies and are not edited; 182-20-SUMMARY, 182-23-SUMMARY and 182-VALIDATION carry dated corrections.
- No action required, recorded so they are not mistaken for misses: the two accurate `analytics.platform` comments in `38-contestant-app-public-config.test.sql` (a deliberate stale-row fixture in a file shared with v2.16), and `NEEDLE = 'appContext-sessionId'` in `tests/tests/utils/e2eSpecVerdict.test.ts` (fixture text naming the removed key as a violation).
