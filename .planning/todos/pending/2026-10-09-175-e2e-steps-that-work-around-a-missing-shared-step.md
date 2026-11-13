---
created: 2026-10-09T00:00:00.000Z
title: Two E2E workarounds a shared step could replace — a card without subcards, and waiting for hydration
area: E2E / fixtures
severity: minor
source: Phase 175 plans 05 and 09 (175-05-SUMMARY.md § What the next plans should know; 175-09-SUMMARY.md deviation 2); filed by 175-13
owner: the next plan that edits the voter results fixture or the contestant profile fixture; Phase 176 meets the second one
files:
  - tests/tests/fixtures/voter/resultsPage.fixture.ts
  - tests/tests/fixtures/voter/organizationDetail.fixture.ts
  - tests/tests/specs/voter/voter-results-redraw.spec.ts
  - tests/tests/specs/perm/perm-show-feedback-survey.spec.ts
  - tests/tests/fixtures/contestant/contestantProfilePage.fixture.ts
  - tests/tests/fixtures/contestant/contestantPreviewPage.fixture.ts
---

## 1. `resultsPage.openEntityDetailsForCard` cannot open a card without subcards

The step clicks the first `entity-card-action` inside the matched card. A card whose entity has no member a voter can see has no subcard, and then **its link wraps the card** instead of sitting inside it: the lookup inside the card finds nothing and the step times out.

- Measured in plan 175-05 on the organization-editing dataset, whose organizations have no visible candidate: the step cannot open either organization's card. `organizationDetail.openFromResults` clicks the card's title instead.
- Three callers work around it by clicking the title: `organizationDetail.fixture.ts`, one test of `voter-results-redraw.spec.ts`, and `perm-show-feedback-survey.spec.ts`, whose docblock describes the same scoping.
- Not measured: whether a candidate card ever takes the wrapping form.

**Option:** let the step find the action either inside the card or as the card's own wrapping link, and re-point the three callers. It is a change to a fixture most voter specs run through, so its proof is the full suite.

## 2. The contestant fixtures wait on something only a filled store renders

The suite has no hydration signal. An edit made before a contestant page hydrates reaches no handler, so each page fixture waits for an element that is rendered only from the store, which an effect fills after hydration:

- `contestantProfilePage.open()` waits for the nominations block to list a nomination (a `group` inside `contestant-profile-nominations`);
- `contestantPreviewPage.open()` waits for the card.

**Phase 176 changes the profile's nominations block.** When a nomination is no longer listed there, `open()` breaks by name. Give it another element that only the filled store renders, or add one real hydration signal the fixtures share (an attribute the entity layout sets from an effect).

## What is measured and what is inferred

Measured: both workarounds are in the tree and green in every full run of Phase 175 (the last one before this todo: 268 passed in 110 projects). Inferred: that one shared step is cheaper than the three and two copies; nobody has written it.
