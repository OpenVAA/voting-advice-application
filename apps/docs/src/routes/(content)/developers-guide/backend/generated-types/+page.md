# Generated types

The TypeScript types of the database live in the [`@openvaa/supabase-types`](https://github.com/OpenVAA/voting-advice-application/tree/main/packages/supabase-types) package. The frontend and `@openvaa/dev-seed` import the `Database` type and the column maps from it.

## Regenerating the types

Run this after every schema change, with the local stack running and reset to the new schema:

```bash
yarn db:reset
yarn db:types
```

`yarn db:types` runs the package's `generate` script, which asks the Supabase CLI to generate types from the running local database (`supabase gen types typescript --local`) and writes them, formatted with Prettier, to `src/database.ts`. It reads the database, not the migration file, so a database that has not been reset since a schema edit produces the old types. Commit the regenerated file together with the schema change; see [Backend overview](/developers-guide/backend/intro#schema-and-migrations) for the whole sequence.

## The files

| File                                                                                                                                            | Kept by         | Contents                                                                                                                                               |
| ----------------------------------------------------------------------------------------------------------------------------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [`src/database.ts`](https://github.com/OpenVAA/voting-advice-application/blob/main/packages/supabase-types/src/database.ts)                     | `yarn db:types` | the generated `Database` type; never edit it by hand                                                                                                   |
| [`src/database.overrides.ts`](https://github.com/OpenVAA/voting-advice-application/blob/main/packages/supabase-types/src/database.overrides.ts) | hand            | nullability corrections for the output columns of `RETURNS TABLE` functions, which the generator always declares non-null                              |
| [`src/database.merged.ts`](https://github.com/OpenVAA/voting-advice-application/blob/main/packages/supabase-types/src/database.merged.ts)       | hand            | the exported `Database` type: the generated type with the overrides applied                                                                            |
| [`src/column-map.ts`](https://github.com/OpenVAA/voting-advice-application/blob/main/packages/supabase-types/src/column-map.ts)                 | hand            | `COLUMN_MAP` and its reverse `PROPERTY_MAP`, which map snake_case column names to the camelCase property names of `@openvaa/data` where the two differ |
| [`RPC-NULLABILITY.md`](https://github.com/OpenVAA/voting-advice-application/blob/main/packages/supabase-types/RPC-NULLABILITY.md)               | hand            | the reason for each output column's nullability                                                                                                        |

`yarn db:types` rewrites only `src/database.ts`, so the hand-kept files survive regeneration.

## When a function returns a table

PostgreSQL records no nullability for the output columns of a `RETURNS TABLE` function, so the generated type marks every such column non-null even when it can be null. Correct a column in `src/database.overrides.ts`, never with a cast where the value is used.

`yarn assert:rpc-nullability`, which `yarn lint:check` runs, keeps this honest: it collects every `RETURNS TABLE` function from the schema files, fails when `RPC-NULLABILITY.md` does not record a decision for one of its columns, and fails when it finds a nullability cast on such a column under `apps`, `packages` or `tests`.
