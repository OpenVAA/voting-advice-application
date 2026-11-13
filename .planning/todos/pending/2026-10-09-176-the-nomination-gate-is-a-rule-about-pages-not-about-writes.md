---
created: 2026-10-09T00:00:00.000Z
title: An entity with no nomination cannot open its profile or questions pages, and can still write its answers through the API
area: Contestant app / database
severity: minor
source: Phase 176 plan 08 (the gate group) and plan 19 (176-19-PLAN.md, Task 3 step 4); filed by 176-19
owner: the operator, to rule whether the database should refuse the write; no item of the decision document covers it — it is a new question
files:
  - apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/(nominated)/+layout.server.ts
  - apps/supabase/supabase/schema/503-entity-rpcs.sql
  - apps/supabase/supabase/schema/302-rls.sql
---

## What is so

NOM-07 is built as a rule about pages. The group `(nominated)` holds the profile, the questions pages and the preview, and its server load redirects an entity with no nomination to its home. The preview's own load adds its rule.

Nothing in the database states the same rule. `upsert_answers` in `503-entity-rpcs.sql` reads no nomination, and the entity UPDATE policies ask `user_can('entity', id, 'entity.edit_answers', <type>)`, which an editor holds whether or not the entity is nominated. A signed-in editor of an entity with no nomination can therefore store answers, a profile image and the other editable columns by calling the API directly, without opening a page.

## What it costs today

Little that was found:

- An entity with no nomination is asked no question in the app: the entity-level load reads no question data for it. An answer written through the API needs a question id; the developers' guide lists `project.read_structure` among an entity editor's permissions, so the questions of the project can be read by one.
- Nothing shows such an entity to voters: public visibility needs a confirmed nomination.
- When the entity is later nominated, answers stored that way are there, and count as answered for the questions of its elections.

## The ruling asked for

1. **Leave it** (as built): the gate is guidance, and the database's rules are about who may edit an entity, not about when.
2. **Refuse in the database**: a condition in `upsert_answers`, or in the entity UPDATE policies, that the entity has a nomination in the project. It would also have to say what an administrator's write does, and it changes what Phase 177's editor may write before the first nomination exists.

Not built, not tested, and not asked for by any requirement of the phase.
