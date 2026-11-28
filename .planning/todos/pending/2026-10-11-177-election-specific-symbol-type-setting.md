---
created: 2026-10-11T00:00:00.000Z
title: What an election symbol may be is the same free text for every election — a setting for each election is not built
area: Contestant app / nomination editor / settings
severity: minor
source: Phase 177 obligation O-7 item 3 (the operator's NOTE on 177-D1); filed by 177-21
owner: unassigned — backlog; the operator schedules it
files:
  - apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/nominations/(edit)/details/+page.svelte
  - apps/supabase/supabase/schema/503-entity-rpcs.sql
  - apps/supabase/supabase/schema/104-nominations.sql
---

## What is built

A nomination's `election_symbol` is one optional text field on a card of the nomination editor, for every election and both entity types. It is trimmed, a blank one is stored as none, and it holds at most 50 characters: the field carries the limit as an attribute, and `set_entity_nominations` refuses a longer one. Nothing says whether an election's symbols are numbers, letters or free text, and nothing checks one symbol against another.

## What this todo asks

A setting for each election that says what a symbol is there: for example a number in a range, a fixed set, free text, or no symbol at all. The editor's field would follow it (its kind, its label and its check) and the database would hold the same rule.

Open questions the operator has not been asked: whether two nominees of one contest may hold the same symbol; whether the administrator assigns symbols and the entity's user only reads them; and whether the setting belongs on the election row or in the application settings.
