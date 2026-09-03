/**
 * The exported `Database` type: the generated schema with the RPC return-row corrections applied.
 *
 * This module adds no policy of its own — it is a mechanical merge. The single locus a human edits is `database.overrides.ts`; every decision about which column is nullable and why lives there and in `RPC-NULLABILITY.md`.
 *
 * `Omit` removes each overridden member before the intersection, on both this side and inside the override helpers, so the result does not depend on which side of the `&` the generated type sits.
 */
import type { FunctionReturnOverrides } from './database.overrides';
import type { Database as GeneratedDatabase } from './database';

export type Database = Omit<GeneratedDatabase, 'public'> & {
  public: Omit<GeneratedDatabase['public'], 'Functions'> & {
    Functions: Omit<GeneratedDatabase['public']['Functions'], keyof FunctionReturnOverrides> & FunctionReturnOverrides;
  };
};
