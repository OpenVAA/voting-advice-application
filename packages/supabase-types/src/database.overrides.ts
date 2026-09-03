/**
 * Hand-maintained output-nullability corrections for `RETURNS TABLE` RPCs.
 *
 * PostgreSQL carries no nullability metadata on a function's OUT parameters, so the Supabase type generator declares every output column of a `RETURNS TABLE` function non-null. Several of those columns really can be null at runtime — a LEFT JOIN that did not match, a UNION branch selecting a NULL literal, or a nullable base-table column projected straight through. A null-guard written against such a column reads as dead code to TypeScript, and the absence of one is invisible.
 *
 * This file is the single locus that restores the lost nullability. Widen a column here; never with a per-site cast at the consumer, and never with a non-null assertion or a suppression comment.
 *
 * It is hand-maintained and is NOT rewritten by `yarn db:types`, which regenerates only `src/database.ts`. That separation is what makes these corrections survive regeneration.
 *
 * Per-column evidence and the disposition of every output column of every `RETURNS TABLE` RPC are recorded in `RPC-NULLABILITY.md` in this package.
 *
 * `resolve_email_variables` is deliberately absent: its body makes every output column non-null, so it has zero override keys. Its absence is a recorded decision, not an oversight.
 */
import type { Database as GeneratedDatabase } from './database';

type GeneratedFunctions = GeneratedDatabase['public']['Functions'];

/** The element type of a `RETURNS TABLE` function's generated `Returns` array. */
type ReturnsRow<F extends keyof GeneratedFunctions> =
  GeneratedFunctions[F]['Returns'] extends ReadonlyArray<infer R> ? R : never;

/**
 * The generated return row of `F` with each column in `K` widened to include null.
 *
 * `Omit` removes the generated column before it is re-declared, so the widened type REPLACES the non-null one. A bare intersection would collapse `string & (string | null)` back to `string` and the override would silently do nothing.
 *
 * The `K extends keyof ReturnsRow<F>` constraint is load-bearing: it turns a key that no longer names a generated column — because a regeneration renamed or dropped it — into a compile error here rather than a silent no-op.
 */
type Nullable<F extends keyof GeneratedFunctions, K extends keyof ReturnsRow<F>> = Omit<ReturnsRow<F>, K> & {
  [P in K]: ReturnsRow<F>[P] | null;
};

/**
 * The generated function entry for `F` with its `Returns` replaced by `Array<Row>`.
 *
 * `Omit<..., 'Returns'>` preserves `Args` and any other postgrest-js member such as `SetofOptions`; a hand-written `{ Args; Returns }` literal would silently drop them.
 */
type WithReturns<F extends keyof GeneratedFunctions, Row> = Omit<GeneratedFunctions[F], 'Returns'> & {
  Returns: Array<Row>;
};

/**
 * The complete set of RPC return-row corrections. Consumed only by `database.merged.ts`.
 *
 * Columns absent from a member are non-null by evidence, not by omission. On `get_nominations` those are the primary key, the two scope keys, the entity discriminator, and the derived entity key — the last of which is non-null only because the function's WHERE clause drops every row whose entity joins all resolved to NULL. On `get_candidate_user_data` they are the primary key and the project key, which both UNION branches select from a real row.
 */
export type FunctionReturnOverrides = {
  get_nominations: WithReturns<
    'get_nominations',
    Nullable<
      'get_nominations',
      | 'parent_nomination_id'
      | 'candidate_id'
      | 'organization_id'
      | 'faction_id'
      | 'alliance_id'
      | 'election_round'
      | 'election_symbol'
      | 'sort_order'
      | 'subtype'
      | 'entity_sort_order'
      | 'entity_subtype'
      | 'entity_first_name'
      | 'entity_last_name'
      | 'entity_organization_id'
    >
  >;
  get_candidate_user_data: WithReturns<
    'get_candidate_user_data',
    Nullable<
      'get_candidate_user_data',
      'organization_id' | 'first_name' | 'last_name' | 'subtype' | 'sort_order' | 'terms_of_use_accepted'
    >
  >;
};
