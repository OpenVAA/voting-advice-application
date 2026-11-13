---
created: 2026-10-06T19:00:27.000Z
title: "Error formatting nomination: Child in collection elections with id … not found" is logged three times in every full E2E run
area: Contestant app / data
severity: minor
source: Phase 173 (deferred-items.md item 3; every full run since 173-07-split); filed by 173-13
owner: Phase 176 (the home screen's nomination list), or the next plan that edits the nomination formatting
files:
  - apps/frontend/src/lib/contestant
  - tests/e2e-runs/173-e2e
---

## Problem

The dev-server log of every full E2E run of Phase 173 that was checked holds `Error formatting nomination: Error: Child in collection elections with id … not found` exactly three times (`grep -c "Error formatting nomination" tests/e2e-runs/173-e2e/<label>/devserver.log`). No error view is rendered and no test fails.

Not established: which page logs it and for which test identity; whether a nomination is then shown without its election's name; whether it predates Phase 173 (the first run checked is `173-07-split`).

## Solution

Find the caller from the log line's stack in a run with source maps, name the identity and the page, and either provide the election the nomination refers to or stop formatting a nomination whose election is not in the data root. A log line that every green run produces hides the next real one.

## Resolution

**Closed 2026-10-09** by Phase 176: the cause was read in the application by plan 176-01 (`.planning/phases/176-contestant-home-task-state-nominations-view/176-D9-FINDING.md`), and the code that logged the line was deleted by plan 176-13 (`3117d9896`). Closed at the phase's close (plan 176-19).

**The cause, from 176-D9-FINDING.md.** The line was logged by `parseNomination` in the profile page, in the browser, on a full page load of the profile: the page's nominations block was formatted before the data root held the election, and again, resolved, a moment later. Read in run `176-01-d9-reading`: one line for one nomination on a full load, with the card resolved afterwards; no line when the page was entered from the home by a client navigation; and the answers-locked dataset's profile, which the committed test closed before hydration, logged when held open. No nomination was shown without its election once a page had settled, so nothing was wrong for the user beyond the console.

While `access.answersLocked` was on, a full load logged the line twice for one nomination, 2 to 3 ms apart. The finding's supplementary reading gives the reason: the user-data store's answers-lock effect ran between the entity layout's effect and the root layout's and replaced `userData.current` by an equal copy, so the block was formatted twice in that window. That defect of the store survives the block and is filed on its own (`2026-10-09-176-user-data-store-rewrites-current-on-every-run-of-the-answers-lock-effect.md`).

**What was done.** The profile's nominations block and its `parseNomination` are gone. The nominations are shown by the nominations view, which takes the names of the election and of the constituency from its own read (`get_entity_nominations`) and resolves nothing on the data root, so it inherits neither condition.

**The evidence.** `grep -c "Error formatting nomination"` over the dev-server log of a full E2E run: **47** in the phase's baseline run (`tests/e2e-runs/175-e2e/175-13-final`), **0** in plan 176-13's closing run and **0** in the phase's closing run (`tests/e2e-runs/176-e2e/176-19-final/devserver.log`).

**The todo's `files:` entry named another directory than the one that logged.** It names `apps/frontend/src/lib/contestant`; the logger was the profile page, under `apps/frontend/src/routes/contestant/`. Its three open questions are answered above: the profile page, for any identity whose profile is loaded as a document; no nomination was shown without its election's name once the page settled; and the line predates Phase 173 only in so far as the block did.
