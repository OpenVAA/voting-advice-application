---
created: 2026-11-19T11:00:00.000Z
title: The deployed voter smoke fails on any deployment with analytics.trackEvents on, because the consent prompt covers an answer control
area: testing
severity: major
source: Phase 188, plan 188-12 (evidence/188-12-shutdown-flush.md; runs tests/e2e-runs/188-12-obs-20261119T104646Z and 188-12-restore-20261119T105211Z)
owner: a later deployment or testing phase
completed: 2026-11-22
status: completed
files:
  - tests/tests/deployed/voter.smoke.ts
  - apps/frontend/src/lib/dynamic-components/dataConsent/popup/DataConsentPopup.svelte
  - apps/frontend/src/lib/contexts/app/tracking/gates.ts
---

## Problem

With the staging project's `analytics.trackEvents` set to `true` (2026-11-19T09:30:36Z, for 188-11's consenting journey), every deployed smoke run was red: `voter.smoke.ts` timed out after 90 s clicking the fifth `question-choice`, because `<div role="dialog" aria-label="Collecting Usage Data">` intercepted the pointer events. The same run with no override was red the same way, so the cause is the prompt, not 188-12's override. The pipeline's own smoke stage would fail the same way, so any deployment that turns `trackEvents` on cannot roll out through `deploy.yml`.

The operator set `trackEvents` back to `false` at 2026-11-19T10:59:26Z to unblock phase 188 (decision recorded in 188-CONTEXT.md, B-03 note).

## To do

- Make `voter.smoke.ts` answer the consent prompt when it is shown (accept or decline as the spec chooses, read-mostly), so the smoke holds whatever `trackEvents` is.
- Check whether the prompt (a non-modal dialog fixed at the bottom of the viewport) covering an answer control on desktop is a WCAG 2.1 AA problem (2.4.11 focus not obscured is AA in 2.2 only; check pointer reachability and the local E2E a11y scans, which run with which `trackEvents`?).
- Find out why no local E2E project caught it: whether any local project runs the voter flow with `trackEvents` on and the prompt unanswered.

## Closed (phase 189.1), 2026-11-22

Closed by plan 189.1-09. The evidence is in `.planning/workstreams/deployment/phases/189.1-address-tech-debt-invitation-limit-guard-and-trackevents-smo/evidence/` (`189.1-05-deployed-entry.md`, `189.1-07-deploy.md`, `189.1-08-prompt-on.md`, `189.1-09-prompt-off.md`).

- **Item 1, the smoke answers the prompt.** `tests/tests/deployed/voter.smoke.ts` declines the consent prompt through a locator handler of its own, installed before the walk: `page.addLocatorHandler` on the `Collecting Usage Data` dialog's "don't want to share my data" button, which fires only when the prompt obstructs an action (plan 189.1-05). The shared walk `navigateToFirstQuestion` stays free of any handler. With `analytics.trackEvents` true on the deployed commit `2ddc331d1`, the unchanged spec (`d9baffc89`, the spec that was red in phase 188) was red again, `consent-dialog-intercepts` (`tests/e2e-runs/deployed-189.1-on-red-20261121T224726Z`), and the changed spec was green (`tests/e2e-runs/deployed-189.1-on-green-20261121T224916Z`) (plan 189.1-08). The pipeline's own smoke gate passed with the setting true, `3 passed (40.5s)`, in run 44939177207 (plan 189.1-07). With the setting false the changed spec was green, `1 passed (7.3s)`, verdict exit 0 (`tests/e2e-runs/deployed-189.1-off-20261122T093500Z`, plan 189.1-09). The smoke now holds whatever `trackEvents` is. Staging was left with the setting true, by the operator's `keep-on` ruling.
- **Item 2, the WCAG check.** Measured at 1280x720 on staging (plan 189.1-08): the prompt (`x=304,y=526,w=672,h=174`) covers the whole label of the fifth and last answer choice (`x=812.8,y=566.2,w=115.2,h=69.8`) at scroll 0; with that choice focused by keyboard, focus sits entirely behind the dialog, and one second after the focus the centres of its label and its input both hit the dialog (`A11Y_CENTER_HITS_DIALOG=yes`); Escape does not close the prompt. `A11Y_FINDING=focus-entirely-obscured`: a WCAG 2.4.11 (Focus Not Obscured, AA in 2.2) failure, and a 2.4.7 (Focus Visible, AA in 2.1) concern. The operator ruled `todo` with the `modal` fix: no application code changed in phase 189.1, and the overlap is filed as `.planning/todos/pending/2026-11-21-voter-consent-prompt-covers-an-answer-control.md` (`area: frontend`, `severity: major`), with the prompt as a modal dialog first and `scroll-padding` and `escape-closes` as alternatives, and the gap that no axe scan runs with the voter prompt open.
- **Item 3, why no local project caught it.** Re-derived on 2026-11-22. `git grep -ln navigateToFirstQuestion -- tests/tests/specs` lists four local specs that use the raw walk, and each runs with `trackEvents` off or drives the prompt itself: `perm/perm-hide-category-tags.spec.ts` and `perm/perm-hide-election-tags.spec.ts` run on the perm baseline, whose settings set `analytics: { trackEvents: false }` (`packages/dev-seed/src/templates/e2e/perm/shared.ts`); `voter/voter-pageview-only.spec.ts` runs on the base dataset, whose settings hold no `analytics` member, so `trackEvents` takes the shipped default, off, and the spec asserts that no prompt is shown; `voter/analytics-privacy.spec.ts` runs on the analytics-tracking dataset with `trackEvents` true and grants consent through the prompt before it walks. `git grep -ln addLocatorHandler -- tests/tests` lists `deployed/voter.smoke.ts` (the fix), `fixtures/voter/voter-journey.fixture.ts`, whose shared journey walk `walkUntilQuestionsIntro` grants consent through its own handler for every journey consumer, including `voter/eperm07-term-trigger.spec.ts` and `voter/voter-journey-mobile.spec.ts`, which name it, and `utils/deployedSmokeGuards.test.ts`, the unit guard that pins the smoke's handler and keeps one out of the raw walk. So no local project ran the raw walk with `trackEvents` on and the prompt left unanswered: that combination existed only in the deployed smoke against a project whose setting an operator had turned on.
