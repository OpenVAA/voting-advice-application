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
  column is **not**, because the `CONTINUE` at `apps/supabase/supabase/schema/502-email-helpers.sql:59`
  fires before the row is ever emitted.
- `get_candidate_user_data.first_name` — the source column `candidates.first_name` is `NOT NULL`
  (`src/database.ts:229`), the output column **is** nullable, because of the `NULL::text` at
  `apps/supabase/supabase/schema/503-entity-rpcs.sql:128`.

A disposition for a column of a `UNION ALL` function that cites only a `database.ts` Row line is a
defect. Widen a column in `src/database.overrides.ts` and record its evidence here; never with a cast
at the consumer.

<!-- BEGIN DERIVED: node scripts/assert-rpc-return-nullability.mjs --write -->

```text
apps/supabase/supabase/schema/502-email-helpers.sql:15  resolve_email_variables  (RETURNS TABLE at :20, 4 columns)
   1. user_id           uuid
   2. email             text
   3. preferred_locale  text
   4. variables         jsonb

apps/supabase/supabase/schema/503-entity-rpcs.sql:9  get_nominations  (RETURNS TABLE at :15, 32 columns)
   1. id                      uuid
   2. name                    jsonb
   3. short_name              jsonb
   4. info                    jsonb
   5. color                   jsonb
   6. image                   jsonb
   7. sort_order              integer
   8. subtype                 text
   9. custom_data             jsonb
  10. entity_type             public.entity_type
  11. candidate_id            uuid
  12. organization_id         uuid
  13. faction_id              uuid
  14. alliance_id             uuid
  15. election_id             uuid
  16. constituency_id         uuid
  17. election_round          integer
  18. election_symbol         text
  19. parent_nomination_id    uuid
  20. entity_id               uuid
  21. entity_name             jsonb
  22. entity_short_name       jsonb
  23. entity_info             jsonb
  24. entity_color            jsonb
  25. entity_image            jsonb
  26. entity_sort_order       integer
  27. entity_subtype          text
  28. entity_custom_data      jsonb
  29. entity_answers          jsonb
  30. entity_first_name       text
  31. entity_last_name        text
  32. entity_organization_id  uuid

apps/supabase/supabase/schema/503-entity-rpcs.sql:93  get_candidate_user_data  (RETURNS TABLE at :96, 15 columns)
   1. id                     uuid
   2. project_id             uuid
   3. name                   jsonb
   4. short_name             jsonb
   5. info                   jsonb
   6. color                  jsonb
   7. image                  jsonb
   8. sort_order             integer
   9. subtype                text
  10. custom_data            jsonb
  11. answers                jsonb
  12. terms_of_use_accepted  timestamptz
  13. first_name             text
  14. last_name              text
  15. organization_id        uuid
```

<!-- END DERIVED -->

## 1. `resolve_email_variables` — 4 columns, 0 overridden, 4 no-change

Declared at `apps/supabase/supabase/schema/502-email-helpers.sql:15`; generated `Returns` at
`src/database.ts:1283-1288`.

**Whole-RPC disposition: zero override keys, by decision rather than by oversight.** Every output
column is non-null once the body has run, so widening any of them would describe the function
incorrectly. Two body citations carry the whole argument:
`apps/supabase/supabase/schema/502-email-helpers.sql:57` (`IF u_email IS NULL THEN`) with its
`CONTINUE` at `:59`, and `apps/supabase/supabase/schema/502-email-helpers.sql:52`
(`COALESCE(au.raw_user_meta_data->>'preferred_locale', 'en')`).

**Correction.** An earlier reading called `email` and `preferred_locale` semantically nullable by
reasoning from the _source_ column `auth.users.email`. That is the wrong source: the generated type
describes the _output_ column, and the body makes both non-null before `RETURN NEXT` at
`apps/supabase/supabase/schema/502-email-helpers.sql:140` ever runs.

**A second, independent reason an override would buy nothing here.** The only caller is
`apps/supabase/supabase/functions/send-email/index.ts:134`, a Deno Edge Function that imports
`createClient` from an `esm.sh` URL (`:1`) and does not import `@openvaa/supabase-types` at all. Its
`recipient.preferred_locale` read (`:169`) is therefore untyped by this package's `Database`
regardless of what the override file says. No type-level guarantee from `packages/supabase-types`
reaches `apps/supabase/supabase/functions/**`.

| #   | Column             | SQL type | Generated TS | Semantically nullable? | Evidence                                                                                                                                                                                                                                                           | Disposition                                             |
| --- | ------------------ | -------- | ------------ | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------- |
| 1   | `user_id`          | `uuid`   | `string`     | No                     | **SQL body** — assigned `uid` at `502-email-helpers.sql:136`, the `FOREACH` loop variable over the non-null `p_user_ids uuid[]` parameter (`:16`).                                                                                                                 | No change needed — a loop variable over non-null uuids. |
| 2   | `email`            | `text`   | `string`     | No                     | **SQL body** — `502-email-helpers.sql:57` `IF u_email IS NULL THEN` and `:59` `CONTINUE;` run before `email := u_email` (`:137`) and `RETURN NEXT` (`:140`), so a row with a null email is never emitted. The source column is nullable; the output column is not. | No change needed — the body filters it out.             |
| 3   | `preferred_locale` | `text`   | `string`     | No                     | **SQL body** — `502-email-helpers.sql:52` coalesces to the string literal `'en'` into `u_locale`, assigned at `:138`. A coalesce to a literal cannot be null.                                                                                                      | No change needed — the body coalesces it.               |
| 4   | `variables`        | `jsonb`  | `Json`       | n/a                    | **Type** — `src/database.ts:1` declares `Json` as already including `null`, so a `jsonb` output column needs no widening.                                                                                                                                          | No change needed — nullable by type.                    |

## 2. `get_nominations` — 32 columns, 14 overridden, 18 no-change

Declared at `apps/supabase/supabase/schema/503-entity-rpcs.sql:9`; generated `Returns` at
`src/database.ts:1195-1228`; `nominations` table `Row` at `src/database.ts:683-710`.

**Whole-RPC disposition: 14 columns widened, 18 dispositioned "no change needed"** — 13 of those are
`jsonb`/`Json` and already nullable by type, and 5 are scalars proven non-null.

Three of these dispositions are non-obvious and would otherwise be "fixed" by the next reader:

- **`entity_id` is NOT widened.** It is provably non-null, but only because of the `WHERE` clause at
  `apps/supabase/supabase/schema/503-entity-rpcs.sql:84`
  (`AND COALESCE(c.id, o.id, f.id, a.id) IS NOT NULL`), the row-level-security leak guard that drops
  every row whose entity-side joins all resolved to `NULL`. **This disposition depends on that
  clause.** A future change to the leak guard voids it and `entity_id` must then be widened.
- **The four mutually exclusive entity keys** — `candidate_id`, `organization_id`, `faction_id` and
  `alliance_id` — are all widened even though the generator declares all four `string`. At most one
  is ever non-null (`nominations` carries `CHECK (num_nonnulls(...) = 1)`), so three of the four are
  null on every row.
- **`entity_first_name` / `entity_last_name`** are widened despite `candidates.first_name` and
  `candidates.last_name` being `NOT NULL`: they arrive through a `LEFT JOIN`
  (`apps/supabase/supabase/schema/503-entity-rpcs.sql:74`) that does not match on organization,
  faction or alliance rows.

| #   | Column                   | SQL type             | Generated TS | Semantically nullable? | Evidence                                                                                                                                                                                                                            | Disposition                                                                                                                          |
| --- | ------------------------ | -------------------- | ------------ | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | `id`                     | `uuid`               | `string`     | No                     | **Table Row** — `src/database.ts:696` `id: string`, the primary key, projected straight through at `503-entity-rpcs.sql:54`.                                                                                                        | No change needed — a primary key, unbranched.                                                                                        |
| 2   | `name`                   | `jsonb`              | `Json`       | n/a                    | **Type** — `src/database.ts:1`; `Json` includes `null`.                                                                                                                                                                             | No change needed — nullable by type.                                                                                                 |
| 3   | `short_name`             | `jsonb`              | `Json`       | n/a                    | **Type** — `src/database.ts:1`.                                                                                                                                                                                                     | No change needed — nullable by type.                                                                                                 |
| 4   | `info`                   | `jsonb`              | `Json`       | n/a                    | **Type** — `src/database.ts:1`.                                                                                                                                                                                                     | No change needed — nullable by type.                                                                                                 |
| 5   | `color`                  | `jsonb`              | `Json`       | n/a                    | **Type** — `src/database.ts:1`.                                                                                                                                                                                                     | No change needed — nullable by type.                                                                                                 |
| 6   | `image`                  | `jsonb`              | `Json`       | n/a                    | **Type** — `src/database.ts:1`.                                                                                                                                                                                                     | No change needed — nullable by type.                                                                                                 |
| 7   | `sort_order`             | `integer`            | `number`     | **Yes**                | **Table Row** — `src/database.ts:706` `sort_order: number \| null`, projected unchanged at `503-entity-rpcs.sql:55`.                                                                                                                | **OVERRIDE**                                                                                                                         |
| 8   | `subtype`                | `text`               | `string`     | **Yes**                | **Table Row** — `src/database.ts:707` `subtype: string \| null`, projected unchanged at `503-entity-rpcs.sql:55`.                                                                                                                   | **OVERRIDE**                                                                                                                         |
| 9   | `custom_data`            | `jsonb`              | `Json`       | n/a                    | **Type** — `src/database.ts:1`.                                                                                                                                                                                                     | No change needed — nullable by type.                                                                                                 |
| 10  | `entity_type`            | `public.entity_type` | enum         | No                     | **Table Row** — `src/database.ts:693` non-null; a generated column on `nominations` derived from whichever entity key is set.                                                                                                       | No change needed — a non-null generated discriminator.                                                                               |
| 11  | `candidate_id`           | `uuid`               | `string`     | **Yes**                | **Table Row** — `src/database.ts:685` `candidate_id: string \| null`. One of four mutually exclusive keys; the generator declares all four non-null.                                                                                | **OVERRIDE**                                                                                                                         |
| 12  | `organization_id`        | `uuid`               | `string`     | **Yes**                | **Table Row** — `src/database.ts:701` `\| null`; same mutual exclusion.                                                                                                                                                             | **OVERRIDE**                                                                                                                         |
| 13  | `faction_id`             | `uuid`               | `string`     | **Yes**                | **Table Row** — `src/database.ts:695` `\| null`; same mutual exclusion.                                                                                                                                                             | **OVERRIDE**                                                                                                                         |
| 14  | `alliance_id`            | `uuid`               | `string`     | **Yes**                | **Table Row** — `src/database.ts:684` `\| null`; same mutual exclusion.                                                                                                                                                             | **OVERRIDE**                                                                                                                         |
| 15  | `election_id`            | `uuid`               | `string`     | No                     | **Table Row** — `src/database.ts:690` `election_id: string`, `NOT NULL`, projected unchanged at `503-entity-rpcs.sql:58`.                                                                                                           | No change needed — a required scope key.                                                                                             |
| 16  | `constituency_id`        | `uuid`               | `string`     | No                     | **Table Row** — `src/database.ts:687` `constituency_id: string`, `NOT NULL`, projected unchanged at `503-entity-rpcs.sql:58`.                                                                                                       | No change needed — a required scope key.                                                                                             |
| 17  | `election_round`         | `integer`            | `number`     | **Yes**                | **Table Row** — `src/database.ts:691` `\| null`, projected unchanged at `503-entity-rpcs.sql:58`.                                                                                                                                   | **OVERRIDE**                                                                                                                         |
| 18  | `election_symbol`        | `text`               | `string`     | **Yes**                | **Table Row** — `src/database.ts:692` `\| null`, projected unchanged at `503-entity-rpcs.sql:58`.                                                                                                                                   | **OVERRIDE**                                                                                                                         |
| 19  | `parent_nomination_id`   | `uuid`               | `string`     | **Yes**                | **Table Row** — `src/database.ts:702` `\| null`, projected unchanged at `503-entity-rpcs.sql:59`. A root nomination has none. This is the column phase 126 compensated for with an ad-hoc cast.                                     | **OVERRIDE**                                                                                                                         |
| 20  | `entity_id`              | `uuid`               | `string`     | **No**                 | **SQL body** — derived at `503-entity-rpcs.sql:60` by `COALESCE` over the four entity keys, and the `WHERE` clause at `503-entity-rpcs.sql:84` drops every row where no entity-side join resolved.                                  | No change needed — non-null only because of the leak guard at `503-entity-rpcs.sql:84`. Changing that clause voids this disposition. |
| 21  | `entity_name`            | `jsonb`              | `Json`       | n/a                    | **Type** — `src/database.ts:1`.                                                                                                                                                                                                     | No change needed — nullable by type.                                                                                                 |
| 22  | `entity_short_name`      | `jsonb`              | `Json`       | n/a                    | **Type** — `src/database.ts:1`.                                                                                                                                                                                                     | No change needed — nullable by type.                                                                                                 |
| 23  | `entity_info`            | `jsonb`              | `Json`       | n/a                    | **Type** — `src/database.ts:1`.                                                                                                                                                                                                     | No change needed — nullable by type.                                                                                                 |
| 24  | `entity_color`           | `jsonb`              | `Json`       | n/a                    | **Type** — `src/database.ts:1`.                                                                                                                                                                                                     | No change needed — nullable by type.                                                                                                 |
| 25  | `entity_image`           | `jsonb`              | `Json`       | n/a                    | **Type** — `src/database.ts:1`.                                                                                                                                                                                                     | No change needed — nullable by type.                                                                                                 |
| 26  | `entity_sort_order`      | `integer`            | `number`     | **Yes**                | **SQL body** — `503-entity-rpcs.sql:66` coalesces over four `LEFT JOIN`ed sources, each itself nullable (`candidates.sort_order`, `src/database.ts:239`).                                                                           | **OVERRIDE**                                                                                                                         |
| 27  | `entity_subtype`         | `text`               | `string`     | **Yes**                | **SQL body** — `503-entity-rpcs.sql:67`, same coalesce over nullable sources (`candidates.subtype`, `src/database.ts:240`).                                                                                                         | **OVERRIDE**                                                                                                                         |
| 28  | `entity_custom_data`     | `jsonb`              | `Json`       | n/a                    | **Type** — `src/database.ts:1`.                                                                                                                                                                                                     | No change needed — nullable by type.                                                                                                 |
| 29  | `entity_answers`         | `jsonb`              | `Json`       | n/a                    | **Type** — `src/database.ts:1`.                                                                                                                                                                                                     | No change needed — nullable by type.                                                                                                 |
| 30  | `entity_first_name`      | `text`               | `string`     | **Yes**                | **SQL body** — `503-entity-rpcs.sql:70` reads `c.first_name` through the `LEFT JOIN public.candidates c` at `:74`, which does not match on an organization, faction or alliance row. The table Row is `NOT NULL` and would mislead. | **OVERRIDE**                                                                                                                         |
| 31  | `entity_last_name`       | `text`               | `string`     | **Yes**                | **SQL body** — `503-entity-rpcs.sql:71`, same `LEFT JOIN` at `:74`. The table Row is `NOT NULL` and would mislead.                                                                                                                  | **OVERRIDE**                                                                                                                         |
| 32  | `entity_organization_id` | `uuid`               | `string`     | **Yes**                | **SQL body** — `503-entity-rpcs.sql:72`, same `LEFT JOIN` at `:74`, and `candidates.organization_id` is itself `\| null` (`src/database.ts:235`).                                                                                   | **OVERRIDE**                                                                                                                         |

## 3. `get_candidate_user_data` — 15 columns, 6 overridden, 9 no-change

Declared at `apps/supabase/supabase/schema/503-entity-rpcs.sql:93`; generated `Returns` at
`src/database.ts:1166-1182`; `candidates` table `Row` at `src/database.ts:222-243`.

**The decisive body fact.** The function is a `UNION ALL` of a candidate branch
(`apps/supabase/supabase/schema/503-entity-rpcs.sql:117-123`) and an organization branch
(`:125-131`), joined at `:124`. The organization branch selects `NULL::timestamptz` at
`apps/supabase/supabase/schema/503-entity-rpcs.sql:127` and `NULL::text, NULL::text, NULL::uuid` at
`apps/supabase/supabase/schema/503-entity-rpcs.sql:128` — positionally `terms_of_use_accepted`,
`first_name`, `last_name` and `organization_id`. Four of the six widened columns are widened by that
one line, and the `candidates` table Row would have said the opposite for two of them.

**Whole-RPC disposition: 6 columns widened, 9 dispositioned "no change needed"** — 7 of those are
`jsonb`/`Json` and already nullable by type, and 2 are scalars both branches select from a real row.

| #   | Column                  | SQL type      | Generated TS | Semantically nullable? | Evidence                                                                                                                                                                                               | Disposition                                                    |
| --- | ----------------------- | ------------- | ------------ | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------- |
| 1   | `id`                    | `uuid`        | `string`     | No                     | **SQL body** — both branches select a real primary key (`503-entity-rpcs.sql:117` and `:125`); **Table Row** `src/database.ts:230` `id: string` agrees.                                                | No change needed — a primary key on both branches.             |
| 2   | `project_id`            | `uuid`        | `string`     | No                     | **SQL body** — both branches select it (`503-entity-rpcs.sql:117` and `:125`); **Table Row** `src/database.ts:236` `project_id: string` agrees.                                                        | No change needed — required on both branches.                  |
| 3   | `name`                  | `jsonb`       | `Json`       | n/a                    | **SQL body** — the candidate branch selects `NULL::jsonb` at `503-entity-rpcs.sql:117`, so it really is null on that branch; `Json` already includes `null` (`src/database.ts:1`).                     | No change needed — nullable by type, and the body confirms it. |
| 4   | `short_name`            | `jsonb`       | `Json`       | n/a                    | **Type** — `src/database.ts:1`.                                                                                                                                                                        | No change needed — nullable by type.                           |
| 5   | `info`                  | `jsonb`       | `Json`       | n/a                    | **Type** — `src/database.ts:1`.                                                                                                                                                                        | No change needed — nullable by type.                           |
| 6   | `color`                 | `jsonb`       | `Json`       | n/a                    | **Type** — `src/database.ts:1`.                                                                                                                                                                        | No change needed — nullable by type.                           |
| 7   | `image`                 | `jsonb`       | `Json`       | n/a                    | **Type** — `src/database.ts:1`.                                                                                                                                                                        | No change needed — nullable by type.                           |
| 8   | `sort_order`            | `integer`     | `number`     | **Yes**                | **Table Row** — `src/database.ts:239` `sort_order: number \| null`; both branches project it unchanged (`503-entity-rpcs.sql:118`, `:126`).                                                            | **OVERRIDE**                                                   |
| 9   | `subtype`               | `text`        | `string`     | **Yes**                | **Table Row** — `src/database.ts:240` `subtype: string \| null`; both branches project it unchanged (`503-entity-rpcs.sql:118`, `:126`).                                                               | **OVERRIDE**                                                   |
| 10  | `custom_data`           | `jsonb`       | `Json`       | n/a                    | **Type** — `src/database.ts:1`.                                                                                                                                                                        | No change needed — nullable by type.                           |
| 11  | `answers`               | `jsonb`       | `Json`       | n/a                    | **Type** — `src/database.ts:1`.                                                                                                                                                                        | No change needed — nullable by type.                           |
| 12  | `terms_of_use_accepted` | `timestamptz` | `string`     | **Yes**                | **SQL body** — `NULL::timestamptz` on the organization branch at `503-entity-rpcs.sql:127`; the table Row agrees (`src/database.ts:241` `\| null`).                                                    | **OVERRIDE**                                                   |
| 13  | `first_name`            | `text`        | `string`     | **Yes**                | **SQL body** — `NULL::text` on the organization branch at `503-entity-rpcs.sql:128`. The table Row is misleading here: `src/database.ts:229` declares `first_name: string`, `NOT NULL`. The body wins. | **OVERRIDE** — evidence is the SQL body, not the table.        |
| 14  | `last_name`             | `text`        | `string`     | **Yes**                | **SQL body** — `NULL::text` on the organization branch at `503-entity-rpcs.sql:128`. Same misleading table Row: `src/database.ts:234` declares `last_name: string`, `NOT NULL`.                        | **OVERRIDE** — evidence is the SQL body, not the table.        |
| 15  | `organization_id`       | `uuid`        | `string`     | **Yes**                | **SQL body** — `NULL::uuid` on the organization branch at `503-entity-rpcs.sql:128`; the table Row agrees (`src/database.ts:235` `\| null`).                                                           | **OVERRIDE**                                                   |

## Attribution note — one nearby cast that is not this file's business

`apps/frontend/src/lib/api/adapters/supabase/dataProvider/supabaseDataProvider.ts:613` carries
`(row.allow_open as boolean | null) ?? true`. It is **redundant**: `row` comes from a `questions`
_table_ read and `src/database.ts:1008` already declares `allow_open: boolean | null`. It is not an
output column of any `RETURNS TABLE` function, the cast gate does not match it, and this file makes
no claim about it. It belongs to the adapter-boundary rewrite of `_getQuestionData`.
