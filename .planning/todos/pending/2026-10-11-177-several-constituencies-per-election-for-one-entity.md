---
created: 2026-10-11T00:00:00.000Z
title: In the application an entity is given one constituency for each election — a party that stands in several is seeded by an administrator
area: Contestant app / nomination editor
severity: minor
source: Phase 177 context decision D-17 (177-C3 (a) with the operator's NOTE) and obligation O-7 item 1; filed by 177-21
owner: unassigned — a feature for a later milestone; the operator schedules it. The cap's ruling (operator item G3) comes first
files:
  - apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/nominations/(edit)/constituencies/+page.svelte
  - apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/nominations/(edit)/stepSelection.ts
  - apps/frontend/src/lib/contestant/nominations/editorFacts.ts
  - apps/frontend/src/lib/components/constituencySelector/ConstituencySelector.svelte
  - apps/supabase/supabase/schema/503-entity-rpcs.sql
  - apps/docs/src/routes/(content)/publishers-guide/preparing/candidates-and-parties-data-be/+page.md
---

## What is built

The nomination editor's constituency step asks one constituency for each chosen election, "the same way a voter does": `ConstituencySelector`'s bound value is one id per election. So an entity's user can define at most one nomination in an election through the application.

An entity that already holds several nominations in one election (a party seeded in many constituencies) is not broken by the editor: `constituencyChoiceOf` puts that election among the *kept* ones, the constituency step shows a section in a selector's place, and the details step has one card for each stored nomination, on which the user edits the election symbol and the parent. The database side has no such limit: `set_entity_nominations` accepts several nominations of one election where each names a stored row by `id`, and refuses only a **new** object that is not the only object of its election.

The limitation is stated for the administrator who must do the seeding in the Publishers' Guide (`preparing/candidates-and-parties-data-be`).

## What this todo asks

1. **Selection of several constituencies for one election by an organization's user**: a selector mode that takes a set of constituencies for an election, a draft that holds a new card for each, and the lifting of the function's rule on new objects.
2. **It could be enabled for candidates too, through a setting** (the operator's note on 177-C3): some electoral systems let a candidate stand in several constituencies.
3. **The cap must be settled first.** The cap of ten unconfirmed parent nominations is counted by user and includes the caller's own organization's rows (`2026-10-11-177-cap-of-ten-counts-an-editors-own-nominations.md`). A party's editor that adds eleven constituencies would be refused its own eleventh nomination. The cap must stop counting rows of an entity the caller edits before this is built.

## Not established

The kept section of the constituency step, which is what an entity with several nominations in one election meets today, has been in no browser: it is held by component cases alone (`2026-10-11-177-states-held-by-component-cases-and-seen-in-no-browser.md`).
