# Data import and deletion

The database has two functions for writing and removing many records at once: `bulk_import` and `bulk_delete`, defined in [`501-bulk-operations.sql`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/supabase/supabase/schema/501-bulk-operations.sql). Both match records by their `external_id`, an identifier you choose for each record, so the same import can be run again to update what it created.

## External ids

The content tables that take part in imports have a nullable `external_id` column. [`500-external-id.sql`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/supabase/supabase/schema/500-external-id.sql) makes it unique within a project, through a unique index on `(project_id, external_id)` per table, and immutable: once set, a trigger refuses to change it or set it back to null. Signed-in users cannot update it directly; it is not among the columns the `authenticated` role may update (see [Authentication and authorisation](/developers-guide/backend/authentication#row-level-security-and-column-grants)).

## `bulk_import`

`bulk_import(p_data jsonb)` takes an object keyed by collection name, each value an array of records:

```json
{
  "elections": [
    { "external_id": "election-2027", "project_id": "<project id>", "name": { "en": "Parliamentary election" } }
  ],
  "nominations": [
    {
      "external_id": "nom-001",
      "project_id": "<project id>",
      "candidate": { "external_id": "cand-001" },
      "election": { "external_id": "election-2027" },
      "constituency": { "external_id": "const-001" }
    }
  ]
}
```

- **Collections.** `elections`, `constituency_groups`, `constituencies`, `organizations`, `alliances`, `factions`, `candidates`, `question_categories`, `questions`, `nominations` and `app_settings`. They are processed in that order, so a record can refer to records of an earlier collection in the same call. Any other key is an error.
- **Each record** must carry its `external_id` and the `project_id` it belongs to. Its other keys are column names or relationships.
- **Relationships**, such as a nomination's `candidate`, `election` and `constituency` or a question's `category`, are written as `{ "external_id": "…" }` objects. `resolve_external_ref` looks the referenced record up in the same project and fails the call when it does not exist. A plain uuid string is used as it is.
- **Upsert.** A record whose `external_id` already exists in the project is updated; otherwise it is inserted.
- **Result.** The function returns `{ "<collection>": { "created": n, "updated": m }, … }`.

## `bulk_delete`

`bulk_delete(p_data jsonb)` takes the project and one deletion rule per collection:

```json
{
  "project_id": "<project id>",
  "collections": {
    "elections": { "prefix": "import-2027-" },
    "candidates": { "ids": ["<candidate id>"] },
    "nominations": { "external_ids": ["nom-001"] }
  }
}
```

A rule deletes the collection's records in that project whose `external_id` starts with `prefix`, whose `id` is in `ids`, or whose `external_id` is in `external_ids`. Collections are processed in reverse dependency order, nominations first, and the function returns `{ "<collection>": { "deleted": n }, … }`.

## Who may call them

Each call runs in one transaction, so it writes every record or none.

Both functions are executable by the `authenticated` role, but they are `SECURITY INVOKER`: every insert, update and delete still passes the table's row-level security, which admits only callers whose grants carry the table's write permission on the project, such as a project admin. A service-role client bypasses row-level security and is meant for local tooling only.

## Who calls them

- `@openvaa/dev-seed` writes its templates with `bulk_import` and removes them with `bulk_delete`, through a service-role client (see [Seed data (dev-seed)](/developers-guide/development/seed-data)).
- The E2E test harness extends the same client to set up and tear down its data.

The frontend does not call either function. The one admin function in [`504-admin-rpcs.sql`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/supabase/supabase/schema/504-admin-rpcs.sql), `merge_question_custom_data`, merges a JSON patch into a question's `custom_data`. The Admin App's question-info and argument-condensation features save their results with it, and row-level security limits it to callers with `project.edit_questions` on the question's project.
