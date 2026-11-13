---
created: 2026-10-11T00:00:00.000Z
title: The whole application has not been tested for election rounds — a second round is modelled in the data and the database and exercised nowhere
area: Whole application / elections
severity: major
source: Phase 177 obligation O-7 item 2 (the operator's NOTE on 177-C5); filed by 177-21
owner: unassigned — a check of its own, before any deployment that runs a second round; the operator schedules it
files:
  - apps/supabase/supabase/schema/101-elections.sql
  - apps/supabase/supabase/schema/104-nominations.sql
  - apps/supabase/supabase/schema/503-entity-rpcs.sql
  - packages/data/src/objects/election/election.ts
  - apps/frontend/src/lib/contestant/nominations/editorFacts.ts
  - packages/dev-seed/src/templates/
---

## Problem

An election has a `current_round` and a nomination an `election_round`. The pieces Phase 177 built each honour the round, by reading the code:

- `set_entity_nominations` writes a new nomination at its election's current round and reaches only the nominations at that round; a nomination of another round is neither updated nor deleted;
- `get_nomination_parent_options` reports an option as nominated at a contest only at the election's current round;
- the editor's `inReachNominationsOf` gives a card only to a nomination at its election's current round, and the nominations view lists every nomination whatever its round;
- `Election.getNominations` of the data model returns the nominations of the election's own round.

**None of this has been seen with a round other than 1.** No built-in dev-seed template and no E2E data module states a current round or an election round other than 1 (a search of `packages/dev-seed/src` and `tests/tests` for either key with another value finds nothing), pgTAP file 43 asserts the reach at a round in its own fixture only, and no screen of the Voter App, the Contestant App or the Admin App was ever opened on a second round. The operator's note asks for a check of the whole application.

## What to check

1. The Voter App: which nominations and which questions a voter is shown when an election's current round is 2, and what happens to an entity nominated in round 1 alone.
2. The Contestant App: the task state's "has a nomination" (it counts any nomination, of any round), the question lists an entity is asked, the nominations view, and the editor's reach, for an entity nominated in round 1 when round 2 opens.
3. The database: the anon visibility rule and `get_nominations` with respect to the round; whether anything moves `current_round`, and what a round change does to rows that exist (nothing re-checks them, as with the election type).
4. A dataset with a second round, so that the above is a test and not a reading.

## Not established

Everything above the list is read from the code, not run.
