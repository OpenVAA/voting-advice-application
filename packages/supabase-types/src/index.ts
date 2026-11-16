export type { Database } from './database.merged';
// `Database` expands to a structure that mentions `FunctionReturnOverrides`, so consumers inferring a type from it must be able to name that type through this entry point; without this re-export TypeScript reports "cannot be named without a reference to .../database.overrides" at every consumer that infers a `SupabaseClient<Database>`-shaped return.
export type { FunctionReturnOverrides } from './database.overrides';
// Tables/TablesInsert/TablesUpdate/Enums/CompositeTypes are NOT generic over `Database` — they close over the module-local alias inside `database.ts` — and they read only Tables/Views/Enums/CompositeTypes, never Functions. A Functions-only override therefore leaves them correct as generated, so they keep coming straight from `./database`.
export type { CompositeTypes, Enums, Json, Tables, TablesInsert, TablesUpdate } from './database';
export { Constants } from './database';
export { COLUMN_MAP, PROPERTY_MAP, TABLE_MAP, COLLECTION_NAME_MAP } from './column-map';
export type { ColumnName, PropertyName, CollectionName, TableName } from './column-map';
