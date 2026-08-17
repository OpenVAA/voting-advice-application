---
created: "2026-07-22T00:00:00.000Z"
title: candidate-journey:661 (step 13.5 link-URL / candidate-home-status) cold-start load-contention flake
area: testing
priority: medium
resolves_phase: 132
files:
  - tests/tests/specs/candidate/candidate-journey.spec.ts (step 13.5, line ~661)
source: Phase 131 Plan 05 targeted-3x gate (first-attempt with-deps run surfaced it)
---

## Problem

During the Phase 131 Plan 05 phase-gate, the FIRST-ATTEMPT gate command (the plan's
`--grep "perm-hide-election-tags|perm-hide-if-missing-answers|perm-hide-category-tags|perm-disable-allow-open|perm-show-feedback-survey"`
run WITH project dependencies) transitively pulled the entire journey suite, because the
perm-DAG anchor project declares `dependencies: ['voter-journey','candidate-journey']`
(`tests/playwright.config.ts:415`). That run reported 27 passed / 1 FAILED. The single
failure was NOT a Phase-131 changed spec but:

```
candidate-journey.spec.ts:661 › step 13.5 "profile rejects an invalid URL in a link question with an inline error"
  Error: expect(getByTestId('candidate-home-status')).toBeVisible() failed
         element(s) not found — waiting for candidate-home-status (post profile-submit status message)
         timeout TIMEOUTS.slowPage (10000ms)
```

## Characterization (reproduce-in-isolation, per feedback_flag_unverified_root_cause)

candidate-journey run ISOLATED (`--project=candidate-journey`, its own
`data-setup-base → data-setup-candidate-journey` chain, NO perm chain, NO concurrent load):
**2/2 GREEN — 5 passed (32.8s) + 5 passed (33.1s)** (`post-fix/131-phase-gate-summary.txt`
closing note). The :661 assertion passes reliably and fast in isolation.

=> Root cause: a COLD-START LOAD-CONTENTION flake. The post-submit `candidate-home-status`
message exceeds `TIMEOUTS.slowPage` ONLY when the full perm-DAG runs concurrently against the
single shared dev server + local Supabase (SSR/route-compile + DB contention under load). It is
NOT a product regression and NOT reproducible in isolation.

## Attribution

Phase 131 changed ONLY `tests/tests/utils/voterNavigation.ts` (voter nav helper) and
`tests/tests/specs/perm/perm-show-feedback-survey.spec.ts` (voter feedback). The
candidate-journey spec, the candidate profile link-question, and the `candidate-home-status`
surface were UNTOUCHED. The flake is NOT introduced by Phase 131 (Phase 130 closed cardinal-clean).

## Disposition (open — escalated to Phase 132 full-suite gate)

Per the project cardinal no-skip rule: NO skip directive was added and NO retry-until-green was
performed for this surface in Phase 131. Because this is a load-contention flake that manifests
ONLY under the concurrent full-DAG run — precisely the Phase-132 full-suite-3x-gate territory
(D-04 §5.3), and outside Phase 131's triage budget (its 7 voter/perm todos) — it is ESCALATED to
the operator / Phase 132.

## Solution (for Phase 132)

Harden the step-13.5 wait so the `candidate-home-status` assertion tolerates cold-start load —
e.g. wait for the profile-submit network settle / the home route to be interactive before asserting
`toBeVisible`, or bump the specific timeout for this post-submit status message under the
full-suite-load profile. Root-cause the load-contention window (SSR compile vs. status-message
render) rather than papering with a blanket retry. Evidence: `post-fix/131-phase-gate-summary.txt`
(first-attempt with-deps failure line + isolation 2/2-green characterization).

## Disposition: FIXED

Fixed in Phase 132.

- **Harden (Plan 01, Task 1, commit cd06625bf):** step 13.5 in `candidate-journey.spec.ts` was
  hardened per the Solution above — the post-submit `candidate-home-status` assertion now settles the
  profile-submit navigation (`waitForURL` back to the `/candidate` home route) BEFORE asserting the
  status element visible, so `toBeVisible` no longer races the `save()` + `goto()` + home-remount chain
  under concurrent load.
- **Proven isolated (Plan 01, D-01/D-03):** `--project=candidate-journey` green.
- **Proven under the full concurrent DAG (Plan 03, gate run 1, D-02):** the milestone-close 3× E2E
  determinism gate run 1 exercised `candidate-journey` (incl. step 13.5 / :661) under the FULL
  concurrent perm-DAG at the stricter local `workers:6` profile and passed — 129 passed / 0 failed /
  0 did-not-run. Runs 2 and 3 also green. See `132-MILESTONE-CLOSE-ANCHOR.md`.

The terminal FIXED disposition is authorized by the full-DAG proof (gate run 1), per D-02.
Cite: `132-01`, `132-03`.
