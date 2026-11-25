# `RETURNS TABLE` RPC output-column nullability

The enumeration block below is generated from `apps/supabase/supabase/schema/**` by
`node scripts/assert-rpc-return-nullability.mjs --write`. Everything outside the two `DERIVED`
sentinels is hand-written and is copied through unchanged by that command. Running the same script
with no flag asserts that the block is still current, that every column it lists also has a
disposition row below, that no consumer compensates for a missing null with an ad-hoc cast, and that
every key in `src/database.overrides.ts` names a column the schema really declares. The script is a
link of the root `lint:check` chain, so deleting it or its wiring turns the standard lint gate red.

## How to read the evidence column

PostgreSQL carries no nullability metadata on a function's OUT parameters, so the type generator
declares every output column of a `RETURNS TABLE` function non-null. Recovering the truth means
reading one of two sources, and **they disagree — the function body wins**:

- **SQL body** — the `SELECT` list, the `UNION` branches and the `WHERE` clause of the function
  itself. Authoritative whenever the function transforms, filters or substitutes.
- **generated table Row** — the `Row` type of the underlying table in `src/database.ts`. Usable only
  when the column is projected straight through with no branch and no filter touching it.

Two measured cases prove the disagreement runs in both directions, and both appear below:

- `resolve_email_variables.email` — the source column `auth.users.email` **is** nullable, the output
  column is **not**, because the `IF u_email IS NULL THEN ... CONTINUE` in
  `apps/supabase/supabase/schema/502-email-helpers.sql` fires before the row is ever emitted.
- `get_entity_user_data.first_name` — the source column `candidates.first_name` is `NOT NULL`, the
  output column **is** nullable, because of the `NULL::text, NULL::text` pair the organization branch
  selects in `apps/supabase/supabase/schema/503-entity-rpcs.sql` — cited by its content rather than by
  a line number.

A disposition for a column of a `UNION ALL` function that cites only a `database.ts` Row line is a
defect. Widen a column in `src/database.overrides.ts` and record its evidence here; never with a cast
at the consumer.

<!-- BEGIN DERIVED: node scripts/assert-rpc-return-nullability.mjs --write -->

```text
apps/supabase/supabase/schema/502-email-helpers.sql:22  resolve_email_variables  (RETURNS TABLE at :27, 4 columns)
   1. user_id           uuid
   2. email             text
   3. preferred_locale  text
   4. variables         jsonb

apps/supabase/supabase/schema/503-entity-rpcs.sql:14  get_nominations  (RETURNS TABLE at :20, 31 columns)
   1. id                    uuid
   2. name                  jsonb
   3. short_name            jsonb
   4. info                  jsonb
   5. color                 jsonb
   6. image                 jsonb
   7. sort_order            integer
   8. subtype               text
   9. custom_data           jsonb
  10. entity_type           public.entity_type
  11. candidate_id          uuid
  12. organization_id       uuid
  13. faction_id            uuid
  14. alliance_id           uuid
  15. election_id           uuid
  16. constituency_id       uuid
  17. election_round        integer
  18. election_symbol       text
  19. parent_nomination_id  uuid
  20. entity_id             uuid
  21. entity_name           jsonb
  22. entity_short_name     jsonb
  23. entity_info           jsonb
  24. entity_color          jsonb
  25. entity_image          jsonb
  26. entity_sort_order     integer
  27. entity_subtype        text
  28. entity_custom_data    jsonb
  29. entity_answers        jsonb
  30. entity_first_name     text
  31. entity_last_name      text

apps/supabase/supabase/schema/503-entity-rpcs.sql:237  get_entity_user_data  (RETURNS TABLE at :241, 13 columns)
   1. id           uuid
   2. project_id   uuid
   3. name         jsonb
   4. short_name   jsonb
   5. info         jsonb
   6. color        jsonb
   7. image        jsonb
   8. sort_order   integer
   9. subtype      text
  10. custom_data  jsonb
  11. answers      jsonb
  12. first_name   text
  13. last_name    text
```

<!-- END DERIVED -->

## 1. `resolve_email_variables` — 4 columns, 0 overridden, 4 no-change

Declared in `apps/supabase/supabase/schema/502-email-helpers.sql` as `public.resolve_email_variables
(p_project_id, p_user_ids, p_template_body, p_template_subject)`; generated `Returns` under
`resolve_email_variables` in `Functions` of `src/database.ts`. Every schema and generated-type
citation in this section is by content, not by line number.

**Whole-RPC disposition: zero override keys, by decision rather than by oversight.** Every output
column is non-null once the body has run, so widening any of them would describe the function
incorrectly. Two body citations carry the whole argument, both
in `apps/supabase/supabase/schema/502-email-helpers.sql`: `IF u_email IS NULL THEN` with its
`CONTINUE`, and `COALESCE(au.raw_user_meta_data->>'preferred_locale', 'en')` in the
`SELECT ... INTO u_email, u_locale` from `auth.users`.

**Correction.** An earlier reading called `email` and `preferred_locale` semantically nullable by
reasoning from the _source_ column `auth.users.email`. That is the wrong source: the generated type
describes the _output_ column, and the body makes both non-null before the `RETURN NEXT` that ends
each pass of the `FOREACH uid IN ARRAY p_user_ids` loop ever runs.

**A second, independent reason an override would buy nothing here.** The only caller is
`apps/supabase/supabase/functions/send-email/index.ts:134`, a Deno Edge Function that imports
`createClient` from an `esm.sh` URL (`:1`) and does not import `@openvaa/supabase-types` at all. Its
`recipient.preferred_locale` read (`:169`) is therefore untyped by this package's `Database`
regardless of what the override file says. No type-level guarantee from `packages/supabase-types`
reaches `apps/supabase/supabase/functions/**`.

| #   | Column             | SQL type | Generated TS | Semantically nullable? | Evidence                                                                                                                                                                                                                | Disposition                                             |
| --- | ------------------ | -------- | ------------ | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| 1   | `user_id`          | `uuid`   | `string`     | No                     | **SQL body** — `user_id := uid`, the `FOREACH uid IN ARRAY p_user_ids` loop variable over the non-null `p_user_ids uuid[]` parameter.                                                                                   | No change needed — a loop variable over non-null uuids. |
| 2   | `email`            | `text`   | `string`     | No                     | **SQL body** — `IF u_email IS NULL THEN` and its `CONTINUE;` run before `email := u_email` and `RETURN NEXT`, so a row with a null email is never emitted. The source column is nullable; the output column is not.     | No change needed — the body filters it out.             |
| 3   | `preferred_locale` | `text`   | `string`     | No                     | **SQL body** — `COALESCE(au.raw_user_meta_data->>'preferred_locale', 'en')` coalesces to the string literal `'en'` into `u_locale`, assigned by `preferred_locale := u_locale`. A coalesce to a literal cannot be null. | No change needed — the body coalesces it.               |
| 4   | `variables`        | `jsonb`  | `Json`       | n/a                    | **Type** — `src/database.ts:1` declares `Json` as already including `null`, so a `jsonb` output column needs no widening.                                                                                               | No change needed — nullable by type.                    |

## 2. `get_nominations` — 31 columns, 13 overridden, 18 no-change

Declared in `apps/supabase/supabase/schema/503-entity-rpcs.sql` as `public.get_nominations
(p_project_id, p_election_id, p_constituency_id, p_include_unconfirmed, p_election_round)`; generated
`Returns` under `get_nominations` in `Functions` of `src/database.ts`; the `nominations` table `Row`
in the same file. Every citation in this section is by content, not by line number.

**Whole-RPC disposition: 13 columns widened, 18 dispositioned "no change needed"** — 13 of those are
`jsonb`/`Json` and already nullable by type, and 5 are scalars proven non-null.

Three of these dispositions are non-obvious and would otherwise be "fixed" by the next reader:

- **`entity_id` is NOT widened.** It is provably non-null, but only because of the last `WHERE` term in
  `apps/supabase/supabase/schema/503-entity-rpcs.sql`
  (`AND COALESCE(c.id, o.id, f.id, a.id) IS NOT NULL`), the row-level-security leak guard that drops
  every row whose entity-side joins all resolved to `NULL`. **This disposition depends on that
  clause.** A future change to the leak guard voids it and `entity_id` must then be widened.
- **The four mutually exclusive entity keys** — `candidate_id`, `organization_id`, `faction_id` and
  `alliance_id` — are all widened even though the generator declares all four `string`. At most one
  is ever non-null (`nominations` carries `CHECK (num_nonnulls(...) = 1)`), so three of the four are
  null on every row.
- **`entity_first_name` / `entity_last_name`** are widened despite `candidates.first_name` and
  `candidates.last_name` being `NOT NULL`: they arrive through the
  `LEFT JOIN public.candidates c` in `apps/supabase/supabase/schema/503-entity-rpcs.sql`, which does not match on organization,
  faction or alliance rows.

| #   | Column                 | SQL type             | Generated TS | Semantically nullable? | Evidence                                                                                                                                                                                                                          | Disposition                                                                                                                                                 |
| --- | ---------------------- | -------------------- | ------------ | ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `id`                   | `uuid`               | `string`     | No                     | **Table Row** — `nominations` `Row` `id: string`, the primary key, projected straight through as `n.id`.                                                                                                                          | No change needed — a primary key, unbranched.                                                                                                               |
| 2   | `name`                 | `jsonb`              | `Json`       | n/a                    | **Type** — `src/database.ts:1`; `Json` includes `null`.                                                                                                                                                                           | No change needed — nullable by type.                                                                                                                        |
| 3   | `short_name`           | `jsonb`              | `Json`       | n/a                    | **Type** — `src/database.ts:1`.                                                                                                                                                                                                   | No change needed — nullable by type.                                                                                                                        |
| 4   | `info`                 | `jsonb`              | `Json`       | n/a                    | **Type** — `src/database.ts:1`.                                                                                                                                                                                                   | No change needed — nullable by type.                                                                                                                        |
| 5   | `color`                | `jsonb`              | `Json`       | n/a                    | **Type** — `src/database.ts:1`.                                                                                                                                                                                                   | No change needed — nullable by type.                                                                                                                        |
| 6   | `image`                | `jsonb`              | `Json`       | n/a                    | **Type** — `src/database.ts:1`.                                                                                                                                                                                                   | No change needed — nullable by type.                                                                                                                        |
| 7   | `sort_order`           | `integer`            | `number`     | **Yes**                | **Table Row** — `nominations` `Row` `sort_order: number \| null`, projected unchanged as `n.sort_order`.                                                                                                                          | **OVERRIDE**                                                                                                                                                |
| 8   | `subtype`              | `text`               | `string`     | **Yes**                | **Table Row** — `nominations` `Row` `subtype: string \| null`, projected unchanged as `n.subtype`.                                                                                                                                | **OVERRIDE**                                                                                                                                                |
| 9   | `custom_data`          | `jsonb`              | `Json`       | n/a                    | **Type** — `src/database.ts:1`.                                                                                                                                                                                                   | No change needed — nullable by type.                                                                                                                        |
| 10  | `entity_type`          | `public.entity_type` | enum         | No                     | **Table Row** — `nominations` `Row` `entity_type` non-null; a generated column on `nominations` derived from whichever entity key is set.                                                                                         | No change needed — a non-null generated discriminator.                                                                                                      |
| 11  | `candidate_id`         | `uuid`               | `string`     | **Yes**                | **Table Row** — `nominations` `Row` `candidate_id: string \| null`. One of four mutually exclusive keys; the generator declares all four non-null.                                                                                | **OVERRIDE**                                                                                                                                                |
| 12  | `organization_id`      | `uuid`               | `string`     | **Yes**                | **Table Row** — `nominations` `Row` `organization_id: string \| null`; same mutual exclusion.                                                                                                                                     | **OVERRIDE**                                                                                                                                                |
| 13  | `faction_id`           | `uuid`               | `string`     | **Yes**                | **Table Row** — `nominations` `Row` `faction_id: string \| null`; same mutual exclusion.                                                                                                                                          | **OVERRIDE**                                                                                                                                                |
| 14  | `alliance_id`          | `uuid`               | `string`     | **Yes**                | **Table Row** — `nominations` `Row` `alliance_id: string \| null`; same mutual exclusion.                                                                                                                                         | **OVERRIDE**                                                                                                                                                |
| 15  | `election_id`          | `uuid`               | `string`     | No                     | **Table Row** — `nominations` `Row` `election_id: string`, `NOT NULL`, projected unchanged as `n.election_id`.                                                                                                                    | No change needed — a required scope key.                                                                                                                    |
| 16  | `constituency_id`      | `uuid`               | `string`     | No                     | **Table Row** — `nominations` `Row` `constituency_id: string`, `NOT NULL`, projected unchanged as `n.constituency_id`.                                                                                                            | No change needed — a required scope key.                                                                                                                    |
| 17  | `election_round`       | `integer`            | `number`     | **Yes**                | **Table Row** — `nominations` `Row` `election_round: number \| null`, projected unchanged as `n.election_round`.                                                                                                                  | **OVERRIDE**                                                                                                                                                |
| 18  | `election_symbol`      | `text`               | `string`     | **Yes**                | **Table Row** — `nominations` `Row` `election_symbol: string \| null`, projected unchanged as `n.election_symbol`.                                                                                                                | **OVERRIDE**                                                                                                                                                |
| 19  | `parent_nomination_id` | `uuid`               | `string`     | **Yes**                | **Table Row** — `nominations` `Row` `parent_nomination_id: string \| null`, projected unchanged as `n.parent_nomination_id`. A root nomination has none. This is the column phase 126 compensated for with an ad-hoc cast.        | **OVERRIDE**                                                                                                                                                |
| 20  | `entity_id`            | `uuid`               | `string`     | **No**                 | **SQL body** — derived by `COALESCE(n.candidate_id, n.organization_id, n.faction_id, n.alliance_id)`, and the `WHERE` term `AND COALESCE(c.id, o.id, f.id, a.id) IS NOT NULL` drops every row where no entity-side join resolved. | No change needed — non-null only because of the leak guard `AND COALESCE(c.id, o.id, f.id, a.id) IS NOT NULL`. Changing that clause voids this disposition. |
| 21  | `entity_name`          | `jsonb`              | `Json`       | n/a                    | **Type** — `src/database.ts:1`.                                                                                                                                                                                                   | No change needed — nullable by type.                                                                                                                        |
| 22  | `entity_short_name`    | `jsonb`              | `Json`       | n/a                    | **Type** — `src/database.ts:1`.                                                                                                                                                                                                   | No change needed — nullable by type.                                                                                                                        |
| 23  | `entity_info`          | `jsonb`              | `Json`       | n/a                    | **Type** — `src/database.ts:1`.                                                                                                                                                                                                   | No change needed — nullable by type.                                                                                                                        |
| 24  | `entity_color`         | `jsonb`              | `Json`       | n/a                    | **Type** — `src/database.ts:1`.                                                                                                                                                                                                   | No change needed — nullable by type.                                                                                                                        |
| 25  | `entity_image`         | `jsonb`              | `Json`       | n/a                    | **Type** — `src/database.ts:1`.                                                                                                                                                                                                   | No change needed — nullable by type.                                                                                                                        |
| 26  | `entity_sort_order`    | `integer`            | `number`     | **Yes**                | **SQL body** — `COALESCE(c.sort_order, o.sort_order, f.sort_order, a.sort_order)` coalesces over four `LEFT JOIN`ed sources, each itself nullable (`candidates` `Row` `sort_order: number \| null`).                              | **OVERRIDE**                                                                                                                                                |
| 27  | `entity_subtype`       | `text`               | `string`     | **Yes**                | **SQL body** — `COALESCE(c.subtype, o.subtype, f.subtype, a.subtype)`, same coalesce over nullable sources (`candidates` `Row` `subtype: string \| null`).                                                                        | **OVERRIDE**                                                                                                                                                |
| 28  | `entity_custom_data`   | `jsonb`              | `Json`       | n/a                    | **Type** — `src/database.ts:1`.                                                                                                                                                                                                   | No change needed — nullable by type.                                                                                                                        |
| 29  | `entity_answers`       | `jsonb`              | `Json`       | n/a                    | **Type** — `src/database.ts:1`.                                                                                                                                                                                                   | No change needed — nullable by type.                                                                                                                        |
| 30  | `entity_first_name`    | `text`               | `string`     | **Yes**                | **SQL body** — `c.first_name AS entity_first_name` reads through the `LEFT JOIN public.candidates c`, which does not match on an organization, faction or alliance row. The table Row is `NOT NULL` and would mislead.            | **OVERRIDE**                                                                                                                                                |
| 31  | `entity_last_name`     | `text`               | `string`     | **Yes**                | **SQL body** — `c.last_name AS entity_last_name`, through the same `LEFT JOIN public.candidates c`. The table Row is `NOT NULL` and would mislead.                                                                                | **OVERRIDE**                                                                                                                                                |

## 3. `get_entity_user_data` — 13 columns, 4 overridden, 9 no-change

Declared in `apps/supabase/supabase/schema/503-entity-rpcs.sql` as `public.get_entity_user_data
(p_project_id, p_entity_type, p_entity_id)`; generated `Returns` under `get_entity_user_data` in
`src/database.ts`; the `candidates` and `organizations` table `Row` types in the same file. Every
citation in this section is by content, not by line number.

**The decisive body fact.** The function is a `UNION ALL` of a candidate branch (`FROM
public.candidates c WHERE p_entity_type = 'candidate'`) and an organization branch (`FROM
public.organizations o WHERE p_entity_type = 'organization'`). The organization branch selects
`NULL::text, NULL::text` — positionally `first_name` and `last_name`. Two of the four widened columns
are widened by that pair, and the `candidates` table Row would have said the opposite for both. The
candidate-to-organization association is not part of this shape: it is stated once, on the nomination
edge.

**Whole-RPC disposition: 4 columns widened, 9 dispositioned "no change needed"** — 7 of those are
`jsonb`/`Json` and already nullable by type, and 2 are scalars both branches select from a real row.

`get_user_entities` and `get_caller_account_state` have no section here: each returns one `jsonb`
object, is not a `RETURNS TABLE` function, and has the generated type `Json`, which already includes
`null`. The frontend narrows each answer with `parseRpcAnswer`.

| #   | Column        | SQL type  | Generated TS | Semantically nullable? | Evidence                                                                                                                                                                                  | Disposition                                                    |
| --- | ------------- | --------- | ------------ | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| 1   | `id`          | `uuid`    | `string`     | No                     | **SQL body** — both branches select a real primary key (`c.id` and `o.id`); **Table Row** `id: string` on `candidates` and on `organizations` agrees.                                     | No change needed — a primary key on both branches.             |
| 2   | `project_id`  | `uuid`    | `string`     | No                     | **SQL body** — both branches select it (`c.project_id` and `o.project_id`); **Table Row** `project_id: string` on both tables agrees.                                                     | No change needed — required on both branches.                  |
| 3   | `name`        | `jsonb`   | `Json`       | n/a                    | **SQL body** — the candidate branch selects `NULL::jsonb` in the third position, so it really is null on that branch; `Json` already includes `null` (`src/database.ts:1`).               | No change needed — nullable by type, and the body confirms it. |
| 4   | `short_name`  | `jsonb`   | `Json`       | n/a                    | **Type** — `src/database.ts:1`.                                                                                                                                                           | No change needed — nullable by type.                           |
| 5   | `info`        | `jsonb`   | `Json`       | n/a                    | **Type** — `src/database.ts:1`.                                                                                                                                                           | No change needed — nullable by type.                           |
| 6   | `color`       | `jsonb`   | `Json`       | n/a                    | **Type** — `src/database.ts:1`.                                                                                                                                                           | No change needed — nullable by type.                           |
| 7   | `image`       | `jsonb`   | `Json`       | n/a                    | **Type** — `src/database.ts:1`.                                                                                                                                                           | No change needed — nullable by type.                           |
| 8   | `sort_order`  | `integer` | `number`     | **Yes**                | **Table Row** — `sort_order: number \| null` on `candidates` and on `organizations`; both branches project it unchanged (`c.sort_order`, `o.sort_order`).                                 | **OVERRIDE**                                                   |
| 9   | `subtype`     | `text`    | `string`     | **Yes**                | **Table Row** — `subtype: string \| null` on `candidates` and on `organizations`; both branches project it unchanged (`c.subtype`, `o.subtype`).                                          | **OVERRIDE**                                                   |
| 10  | `custom_data` | `jsonb`   | `Json`       | n/a                    | **Type** — `src/database.ts:1`.                                                                                                                                                           | No change needed — nullable by type.                           |
| 11  | `answers`     | `jsonb`   | `Json`       | n/a                    | **Type** — `src/database.ts:1`.                                                                                                                                                           | No change needed — nullable by type.                           |
| 12  | `first_name`  | `text`    | `string`     | **Yes**                | **SQL body** — `NULL::text` on the organization branch, in the twelfth position. The table Row is misleading here: `candidates` declares `first_name: string`, `NOT NULL`. The body wins. | **OVERRIDE** — evidence is the SQL body, not the table.        |
| 13  | `last_name`   | `text`    | `string`     | **Yes**                | **SQL body** — `NULL::text` on the organization branch, in the thirteenth position. Same misleading table Row: `candidates` declares `last_name: string`, `NOT NULL`.                     | **OVERRIDE** — evidence is the SQL body, not the table.        |

## Attribution note — one nearby cast that is not this file's business

`apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts:613` carries
`(row.allow_open as boolean | null) ?? true`. It is **redundant**: `row` comes from a `questions`
_table_ read and `src/database.ts:1008` already declares `allow_open: boolean | null`. It is not an
output column of any `RETURNS TABLE` function, the cast gate does not match it, and this file makes
no claim about it. It belongs to the adapter-boundary rewrite of `_getQuestionData`.
