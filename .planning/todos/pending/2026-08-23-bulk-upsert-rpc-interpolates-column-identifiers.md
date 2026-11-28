---
created: 2026-08-23T17:33:00.000Z
title: _bulk_upsert_record interpolates column identifiers without quote_ident (values are quoted, keys are not)
area: supabase
files:
  - apps/supabase/supabase/schema/501-bulk-operations.sql:170
  - apps/supabase/supabase/schema/501-bulk-operations.sql:195
filed_by: Phase 144 (144-07), as residue RES-14 / threat T-144-28
---

## Measurement (taken at HEAD `47ee50054`, 2026-08-23)

`_bulk_upsert_record` builds its INSERT by string assembly. **Values go through `quote_literal`; keys
do not go through `quote_ident`.**

```
:170   col_names := array_append(col_names, item_key);          -- raw, unquoted
:164   col_values := array_append(col_values, quote_literal(resolved_uuid));
:177   col_values := array_append(col_values, quote_literal(item_value #>> '{}'));
:181   col_values := array_append(col_values, quote_literal(item_value::text) || '::jsonb');
```

and the assembly at `:195-201`:

```
sql_text := format(
  'INSERT INTO public.%I (%s) VALUES (%s) ON CONFLICT ... DO UPDATE SET %s ...',
  p_table_name,                          -- %I — quoted
  array_to_string(col_names, ', '),      -- %s — NOT quoted
  array_to_string(col_values, ', '),
  array_to_string(update_parts, ', ')
);
EXECUTE sql_text INTO was_inserted;
```

`%I` protects the **table name** only. Every column identifier reaches `EXECUTE` as raw text.

## What Phase 144 changed — a real narrowing, stated as partial

TMPL-02's Pass 0 (`assertKnownRowProps`) runs on the pre-deletion data and **throws on any key not on
the derived allow-list**, so nothing off that list now reaches `bulk_import` at all. The set of strings
that can become an interpolated identifier went from *"whatever a template declared"* to a **derived,
closed set** — the union of generated `TablesInsert<…>` column names, `LINK_SENTINELS`, the non-column
consts and the RPC's own relationship map.

**That is a narrowing, not a fix**, and the ledger says so on its face. The residual path is
service-role-only with developer-authored input — the same trust model as running `tsx` on a template
file — which is why it is filed rather than treated as an incident.

## Why Phase 144 did not fix it

Changing the SQL of a shipped public RPC is outside that phase's scope fence, and the schema has two
copies (`schema/501-bulk-operations.sql` and `migrations/00001_initial_schema.sql`) that Phase 144
proved byte-identical in their `CASE` block — any edit must land in both or that parity test goes red,
which is the desired behaviour and a real constraint on the change.

## Suggested approach

Wrap `item_key` (and the `update_parts` key halves at `:167`, `:179`, `:183`) in `quote_ident`. Then
re-run `yarn db:lint:sql` and the dev-seed integration test. Note the existing parity spec asserts the
two SQL copies agree — update both.

## Update 2026-10-09 — still true at the close of Phase 175, on one more carried key

Read again on the tree at the phase's close: `_bulk_upsert_record` in `apps/supabase/supabase/schema/501-bulk-operations.sql` still appends the item key to its column list as it came (`col_names := array_append(col_names, item_key);`) and builds `update_parts` from the same raw key, while every value goes through `quote_literal`. The line numbers in this file's frontmatter and first section are those of 2026-08-23; find the lines by their text.

Phase 175 plan 03 changed which keys reach that line: `entity_type` is no longer skipped on `question_categories` and `questions`, where `validate_entity_type_list` then checks the value. That adds no new identifier path, since the key is a fixed name, and it was accepted as threat T-175-17 with this todo as its record. The research of Phase 175 describes the same unquoted key as a security review item (`175-RESEARCH.md` § Security Domain, "Outside this phase, seen while reading it").

Unchanged: who can reach it. `bulk_import` is SECURITY INVOKER and executable by `authenticated`; an unknown column name fails in PostgreSQL, and the row-level security of the target table still applies to whatever statement the key produces.
