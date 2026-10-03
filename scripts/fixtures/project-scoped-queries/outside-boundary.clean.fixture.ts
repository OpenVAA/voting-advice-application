/**
 * Fixture: the call shapes `scripts/assert-project-scoped-queries.mjs` must NOT report in a source
 * OUTSIDE the adapter directory.
 *
 * The boundary rule's negative control. A rule that reddened every `.from(` in the frontend would be
 * worse than no rule at all — it would be switched off within a day — so the near misses it must
 * leave alone are committed here rather than assumed, and the self-test requires this file to
 * produce zero violations while its sibling produces two.
 *
 * This file is never imported, never built and never executed.
 */

type AnyBuilder = {
  select: (columns?: string) => AnyBuilder;
  upload: (path: string, file: unknown) => AnyBuilder;
};

type AnyClient = {
  from: (table: string) => AnyBuilder;
  rpc: (name: string, args?: Record<string, unknown>) => AnyBuilder;
  storage: { from: (bucket: string) => AnyBuilder };
  functions: { invoke: (name: string, options?: { body?: Record<string, unknown> }) => Promise<unknown> };
};

/** The request-scoped locals a route handler is handed, which is how the client is reached out here. */
type RequestLocals = { supabase: AnyClient };

/** The adapter's public surface: what a source outside the adapter directory is supposed to call instead of a table. */
type AdapterSurface = { getElections: () => Promise<Array<unknown>> };

/** An object whose IDENTIFIER merely ends in `functions`, declared so the near miss below is self-describing rather than a bare literal. */
type SubFunctions = { invoke: (name: string, options?: { body?: Record<string, unknown> }) => Promise<unknown> };

/** A flag record one of whose KEYS merely begins with `functions`, declared for the same reason. */
type FeatureFlags = { functionsEnabled: boolean };

/** NOT reported: a storage bucket is not a table and has no project column to filter on. It is excluded by the shape of the chain rather than by a list of bucket names, so no bucket ever has to be named to keep this rule quiet. */
export function bucketUpload(locals: RequestLocals, file: unknown): AnyBuilder {
  return locals.supabase.storage.from('public-assets').upload('a/b/c.jpg', file);
}

/** NOT reported: the sanctioned route from out here is the adapter's own public surface. Its receiver names Supabase, which makes it the nearest miss there is — the rule reads the receiver, so a matcher one step wider would report this. */
export function viaAdapterSurface(supabaseAdapter: AdapterSurface): Promise<Array<unknown>> {
  return supabaseAdapter.getElections();
}

/** NOT reported: a `from(` whose receiver is not a client at all. It is the widest way a boundary rule goes wrong — reddening every collection helper in the tree — so it is committed rather than assumed. */
export function collectRows(rows: Iterable<unknown>): Array<unknown> {
  return Array.from(rows);
}

/** NOT reported, but EXAMINED: an Edge Function invocation from outside the adapter directory, held to the same written disposition the adapter's invocations are held to. It models the one live invocation out here, whose function resolves its project from deployment configuration and whose payload therefore carries no project term by design. */
export function deploymentScopedInvocation(locals: RequestLocals, idToken: string): Promise<unknown> {
  return locals.supabase.functions.invoke('identity-callback', { body: { id_token: idToken } });
}

/** NOT reported, for the first of the two reasons a shape is not reported out here — it reaches no table. The same bucket as `bucketUpload` above, spelled with the OPTIONAL access operator on both positions. The exclusion is structural, on the shape of the chain, so it has to hold under either spelling of the operator or the widening would have quietly turned a bucket into a table. */
export function optionalChainedBucketUpload(locals: RequestLocals, file: unknown): AnyBuilder {
  return locals.supabase?.storage?.from('public-assets').upload('a/b/c.jpg', file);
}

/** NOT reported, for the second reason — it IS examined, and it keeps its disposition's promise. The same deployment-scoped invocation as `deploymentScopedInvocation` above, reached with the OPTIONAL access operator on both positions, so the invocation check is shown to read the optional spelling out here rather than only inside the adapter directory. */
export function optionalChainedDeploymentScopedInvocation(locals: RequestLocals, idToken: string): Promise<unknown> {
  return locals.supabase?.functions?.invoke('identity-callback', { body: { id_token: idToken } });
}

/** NOT reported, for the first reason — it reaches no table. The adapter's public surface reached with the OPTIONAL access operator, which is the NEAREST MISS the boundary rule has: the receiver names Supabase, so only the method name distinguishes it from a violation, and a matcher one step wider would report it under either spelling of the operator. */
export function viaOptionalAdapterSurface(supabaseAdapter: AdapterSurface): Promise<Array<unknown>> {
  return supabaseAdapter?.getElections();
}

/** NOT reported, for the first of the two reasons a shape is not reported out here — it reaches no table. The same bucket again, reached through the optional-CALL punctuator. It is the negative control for the boundary check's chain exclusion under the newest punctuator: the exclusion is structural, on the shape of the chain, so it has to hold under every spelling of every operator or the widening would have quietly turned a bucket into a table. This fixture's site count must be UNCHANGED by it. */
export function optionalCallBucketUpload(locals: RequestLocals, file: unknown): AnyBuilder {
  return locals.supabase.storage.from?.('public-assets').upload('a/b/c.jpg', file);
}

/** NOT reported: the SHARPEST near miss the computed-invocation rule has. Identical key, identical call, on an identifier that merely ENDS in `functions` — only the word boundary distinguishes it from the violating shape in the sibling fixture. A rule one character wider would report every helper in the tree whose name happens to end that way, and this fixture's site count must be UNCHANGED by it. */
export function nearMissSuffixedFunctions(subfunctions: SubFunctions): Promise<unknown> {
  return subfunctions['invoke']('probe_not_a_client_function', { body: {} });
}

/** NOT reported: a computed key whose text merely BEGINS with `functions`. The closing-quote backreference is what excludes it — drop that backreference for a looser character class and this flag read starts reporting as an invocation surface. This fixture's site count must be UNCHANGED by it. */
export function nearMissFunctionsPrefixedKey(config: FeatureFlags): boolean {
  return config['functionsEnabled'];
}
