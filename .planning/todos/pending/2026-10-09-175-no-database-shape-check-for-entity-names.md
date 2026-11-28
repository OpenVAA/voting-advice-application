---
created: 2026-10-09T00:00:00.000Z
title: The database checks the shape of an entity's colour and not of its name or short_name
area: Supabase / validation
severity: minor
source: Phase 175 plan 03 (orchestrator ruling 3, the part left to the planner; plan 175-03 ruling 4); filed by 175-13
owner: a database plan of a later milestone; needs a survey of stored values first
files:
  - apps/supabase/supabase/schema/011-validation-functions.sql
  - apps/supabase/supabase/schema/102-entities.sql
  - apps/supabase/supabase/schema/501-bulk-operations.sql
  - apps/frontend/src/lib/utils/parseJsonbColumn.ts
  - apps/frontend/src/lib/utils/localizedText.ts
---

## Finding

`name` (on `organizations`, `factions` and `alliances`) and `short_name` (on all four entity tables) are `jsonb` columns meant to hold a locale-keyed object of strings: `{"en": "Green Party", "fi": "Vihreät"}`. Both are in the `authenticated` UPDATE grant of their tables, so an entity's own editor writes them through the API while the entity is unconfirmed. **Nothing in the database holds them to that shape.**

Phase 175 added that kind of check for two other columns and not for these:

- `validate_entity_color` binds `color` on the four entity tables to null or an object of hex colours;
- `validate_entity_type_list` binds `entity_type` on the two question tables to null or an array of entity types.

So a row may store a name that is a bare string, a number, an array, an object whose values are not strings, or an object keyed by something that is no locale. The frontend reads defensively: `parseJsonbColumn.ts` parses the stored names into a locale object or null, and `normalizeLocalizedName` in `localizedText.ts` drops blank entries before a write. The database's own readers do not: `get_localized` returns whatever `->>` gives, and `private.localized_has_text` decides from it whether an invited entity "has a name" and is therefore confirmed.

The writers that reach these columns: the entity's editor through the API; `_bulk_upsert_record`, which `bulk_import` calls and which writes any JSON value an item carries; the service role; and the `identity-callback` Edge Function for a candidate's `first_name` and `last_name`, which are `text` and not part of this.

### What is measured and what is inferred

- Measured: no trigger and no CHECK constraint on `name` or `short_name` of the four entity tables (`pg_trigger` and the schema files at the phase's close); the two validation triggers that exist, each with its pgTAP file (40 and 41).
- Measured: every built-in dev-seed template stores names of the intended shape (the dev-seed suite, 1037 cases, and the default seed are green against the applied schema).
- Not measured: what a hosted database would hold. Nothing is deployed, so there are no stored rows to survey today; a check added later needs the survey first, because a trigger does not re-check rows stored before it.
- Inferred: that a malformed name is harmful beyond rendering as nothing. A name is rendered as text, never into a `style` attribute, so this is not the stored-CSS path the colour check closed.

## Options

1. **A third validation trigger**, `validate_localized_text`, on `name` and `short_name` of the four entity tables: null, or an object whose every value is a string. Whether a key must be a supported locale is a second question; the database does not know the frontend's supported locales, and `projects.default_locale` is the only locale it holds.
2. **A CHECK constraint** with an immutable helper, since the rule reads one row and no other table. It cannot say which member was wrong; a trigger can.
3. **Leave it**, on the grounds that both readers that matter parse defensively.

Under 1 or 2 the same rule would fit `info` and the localized columns of the other content tables; scope it before writing it.
