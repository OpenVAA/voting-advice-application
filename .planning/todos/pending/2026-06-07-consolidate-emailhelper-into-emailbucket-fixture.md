---
created: 2026-06-07T06:30:00.000Z
title: Consolidate emailHelper into emailBucket fixture (gated on live-stack run)
area: testing
files:
  - tests/tests/utils/emailHelper.ts
  - tests/tests/fixtures/shared/emailBucket.fixture.ts
  - tests/tests/specs/candidate/candidate-journey.spec.ts:79
  - tests/tests/specs/perm/perm-localisation-positive.spec.ts:64
---

## Problem

This is the one remaining item (item 6) from the e2e test-folder cleanup
(report `.planning/quick/260607-cd0-clean-up-e2e-test-folder-catalogue-fixtu/260607-cd0-E2E-CLEANUP-REPORT.md`).
It was DEFERRED out of the 2026-06-07 follow-up because it cannot be completed
safely without a live stack, and because a new finding invalidated the report's
original sub-plan:

- `fixtures/shared/emailBucket.fixture.ts` **wraps / imports from**
  `utils/emailHelper.ts` (its own docstring: "this fixture WRAPS emailHelper.ts").
  So `emailHelper.ts` is **load-bearing for the fixture**, not just for the 2
  specs — it cannot simply be deleted after a spec migration.
- The 2 spec importers only use `toCallbackUrl` (a pure URL-string transform,
  arguably util-shaped, not fixture-shaped). The Mailpit functions
  (`getRegistrationLink`/`getLatestEmailHtml`/`fetchEmails`/etc.) are reached
  only through the `emailBucket` fixture.

`emailHelper.ts` is D3-superseded (the `emailBucket` fixture is the intended
surface) but the retirement is a fixture-internalisation, not a free delete.

## Solution

When the live dev stack is available:
1. Move the Mailpit HTTP plumbing currently in `emailHelper.ts` INTO
   `emailBucket.fixture.ts` (or a private module the fixture owns), so the
   fixture no longer depends on `emailHelper.ts`.
2. Decide where `toCallbackUrl` lives — it is a pure string transform; keep it
   as a small util (it does not need to be a fixture method) OR expose it via the
   fixture. Update the 2 spec import sites accordingly.
3. Run ONLY the 2 affected specs to green:
   `candidate/candidate-journey.spec.ts` + `perm/perm-localisation-positive.spec.ts`.
4. THEN delete `utils/emailHelper.ts`. Do NOT delete before steps 1–3 land green.

Guardrails (from report §3 / RESEARCH §6) still apply: barrel/import edits in the
same commit; do not consolidate the deliberate-distinct sibling pairs or the
seed-literal setup graph.
