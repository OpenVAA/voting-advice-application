---
created: 2026-11-19T11:00:00.000Z
title: The deployed voter smoke fails on any deployment with analytics.trackEvents on, because the consent prompt covers an answer control
area: testing
severity: major
source: Phase 188, plan 188-12 (evidence/188-12-shutdown-flush.md; runs tests/e2e-runs/188-12-obs-20261119T104646Z and 188-12-restore-20261119T105211Z)
owner: a later deployment or testing phase
files:
  - tests/tests/specs/smoke/voter.smoke.ts
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
