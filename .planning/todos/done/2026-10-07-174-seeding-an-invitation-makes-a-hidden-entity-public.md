---
created: 2026-10-07T12:53:29.000Z
title: Decision open - seeding an invitation confirms its entity, so an entity a dataset keeps hidden becomes public once it has a confirmed nomination
area: database / E2E harness / Phase 175
severity: major
source: Phase 174 (decision D-11 and obligations O-6, O-7 of 174-CONTEXT.md; ruling 19 of 174-01-PLAN.md; measured by 174-09, rows J1 and J2 of 174-NAME-MAP.md; filed by 174-10)
owner: the operator (the decision); Phase 175 (the specs)
files:
  - apps/supabase/supabase/schema/506-invitation-rpcs.sql
  - tests/tests/fixtures/shared/invitationFlow.fixture.ts
  - tests/tests/specs/contestant/contestant-journey.spec.ts
  - packages/dev-seed/src/templates/e2e/base.ts
scheduled: "Phase 177.1 (inserted 2026-10-07 at the operator's direction): create_invitations takes a required p_confirm_entity and an optional p_nominations; the hiding wrapper is removed there"
---

## Problem

INV-05 as built: `create_invitations` sets `confirmed = true` on the entity an invitation names, when the entity has a name. Anonymous visibility is three conjuncts: the project is open for voters, the entity is confirmed, and it has a confirmed nomination. So an invited entity that has never been signed in for is public from the moment it is seeded, if its nomination is confirmed and its project is open.

**Confirmed in isolation** (174-09, one rolled-back transaction on a candidate of the default project): as `anon`, 0 rows while the candidate is unconfirmed; after `create_invitations` as the service role, `confirmed` is true and `anon` reads 1 row; with the candidate's nominations then unconfirmed, 0 rows again.

This met the E2E dataset first. The journey's candidate, `test-e2e-base-ca-aa-unregistered`, is seeded unconfirmed ("Unconfirmed, so voters do not see it") with a nomination the seed writer confirms. Re-pointing the journey at an invitation would have published it. 174-09 therefore added `invitationFlow.whileHiddenFromVoters(entity, action)`: the entity's nominations are unconfirmed while the invitation is seeded and the link requested, the entity is set unconfirmed again, and only then are the nominations restored. **Under the wrapper the journey's invited candidate runs unconfirmed**, which is not what INV-05 gives a real invited candidate.

**Not observed:** any spec failing without the wrapper. In the closing run of 174-09 `voter-journey`, which pins party AA at five visible candidates, ended before `contestant-journey` started.

## What is open

This is a decision, not a defect, and it is recorded as open:

1. **Is "confirmed from the moment it is seeded" the intended product behaviour for every entity type?** Ruling 19 names the fallback if the Phase 175 discussion decides that an invited organization is not confirmed: one type test in `create_invitations` (the `WHEN 'organization'` arm of the confirming `CASE`, and by the same reasoning the faction and alliance arms) and its pgTAP rows.
2. **Should the journey exercise the real path** (an invited candidate that is confirmed) with the dataset's pins adjusted, instead of holding its candidate hidden with a wrapper no production caller has?

## For Phase 175

Any spec that invites an entity the dataset keeps hidden must wrap the invitation in `invitationFlow.whileHiddenFromVoters`, or the entity becomes public when it has a confirmed nomination and voter-side specs that pin visible counts turn red, depending on scheduling. A spec whose entity is already confirmed in the dataset needs nothing (the localisation spec's candidate is one).

## Resolution

**Closed 2026-10-18** by Phase 177.1, the phase inserted for it (plans 177.1-04 to 177.1-06).

- **The confirmation is the caller's statement.** `public.create_invitations (p_project_id, p_invitations, p_confirm_entity)` in `apps/supabase/supabase/schema/506-invitation-rpcs.sql` takes a required `p_confirm_entity` with no default, and refuses `null`. `true` confirms each named entity of the batch, as the caller; `false` confirms none; no call unconfirms an entity, so `false` never hides one. An entity-scope item for a candidate or an organization may also state the entity's nominations under a `nominations` key, each object with its own `confirmed`. Commits `d204c3e12` and `d65814195` (plan 04); held by pgTAP files 39 and 47, green with every file on a freshly reset database (`Files=47, Tests=2602`, gate run `177.1-04-db`).
- **Every caller states it.** The seed writer `SupabaseAdminClient.createInvitations` passes `true` unless told otherwise (`6ff35c7c3`), and the E2E admin client's `inviteByEmail` and every seeding step of `invitationFlow` require it (`ccea22262`), plan 05.
- **The journey runs in the state an invitation gives.** Step 3 of `contestant-journey.spec.ts` invites its candidate with `confirmEntity: true` and states its one nomination `confirmed: false`, which the invitation creates under party AA; `e2e/base` no longer seeds that nomination. The candidate is hidden from voters by its nomination at every moment, and no row is toggled. `invitationFlow.whileHiddenFromVoters` is removed, with its doc and its entry in the fixture's header. Commit `9443f915b` (plan 06).
- **Run:** `177.1-06-close` at `9443f915b`: 530 of 530 passed in 123 projects; `contestant-journey` 1/1, `invitation-contract` 15/15, `voter-journey` 2/2 with its visible counts unchanged. `invitation-contract`'s first test seeds a candidate with `true` and an organization with `false` and asserts the one confirmed and the other not.

**The two open questions, answered.** 1. Whether an invited entity is confirmed is the admin's choice on each call (operator decision F1 (a), 2026-10-08), not a property of the entity type, so no type test was added. 2. Yes: the journey exercises an invited candidate that is confirmed, with an unconfirmed nomination (177.1 decision D-14).

**What was not tested.** How the voter app shows a confirmed candidate whose nomination is confirmed under a party nomination that is not, a state an invitation can now produce: filed as `2026-10-18-177.1-a-confirmed-nomination-under-an-unconfirmed-parent-nomination-is-unobserved-in-the-voter-app.md`.
