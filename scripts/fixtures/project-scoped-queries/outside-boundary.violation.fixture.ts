/**
 * Fixture: the call shapes `scripts/assert-project-scoped-queries.mjs` must REPORT in a source
 * OUTSIDE the adapter directory.
 *
 * This file is never imported, never built and never executed. It exists so the boundary check can
 * be SEEN to fire, which a run over the real tree cannot show: nothing outside the adapter directory
 * reaches a table today, so that corpus is clean by construction and a zero there says nothing about
 * whether the rule works.
 *
 * It is a module of plain functions rather than a class, because that is the shape of the code out
 * here: the receiver is a request-scoped client handed to a route handler, not a field of a
 * long-lived class. The rule its adapter-side siblings model — reach tables through the scoped
 * helper — has no meaning at this address, because a route has no such helper. The rule modelled
 * here is the boundary itself: a table is not reachable from this side at all.
 */

type AnyBuilder = {
  select: (columns?: string) => AnyBuilder;
  eq: (column: string, value: string) => AnyBuilder;
  order: (column: string) => AnyBuilder;
};

type AnyClient = {
  from: (table: string) => AnyBuilder;
  rpc: (name: string, args?: Record<string, unknown>) => AnyBuilder;
  storage: { from: (bucket: string) => AnyBuilder };
  functions: { invoke: (name: string, options?: { body?: Record<string, unknown> }) => Promise<unknown> };
  /** A NON-STORAGE intermediate member, so a chain link out here can carry the optional access operator and still move a count. A storage link cannot: a bucket is dropped structurally before it is counted, so an operator placed there proves nothing about whether the chain position is read. */
  rest: { rpc: (name: string, args?: Record<string, unknown>) => AnyBuilder };
};

/** The request-scoped locals a route handler is handed, which is how the client is reached out here. */
type RequestLocals = { supabase: AnyClient };

/** REPORTED by check 9: a project-scoped table read from outside the adapter directory, where not one of the checks that decide whether a table is project-scoped can reach it. */
export function unscopedTableRead(locals: RequestLocals): AnyBuilder {
  return locals.supabase.from('elections').select('*').order('sort_order');
}

/** REPORTED by check 9: an rpc called from outside the adapter directory. It passes the project key its disposition requires, and that is deliberate — the boundary is about WHERE the call lives, so a correctly parameterised call is reported out here just the same. */
export function unscopedRpcCall(locals: RequestLocals, projectId: string): AnyBuilder {
  return locals.supabase.rpc('get_nominations', { p_project_id: projectId });
}

/** REPORTED by check 9: the same table read spelled with the OPTIONAL access operator. `?.` is one spelling of one access, not a second rule, so this shape gets the same disposition as its plain-dot sibling above — same check, same message text, same tally family. */
export function optionalChainedTableRead(locals: RequestLocals): AnyBuilder {
  return locals.supabase?.from('elections').select('*').order('sort_order');
}

/** REPORTED by check 9: the same rpc call spelled with the OPTIONAL access operator. It passes its project key for the same deliberate reason its plain-dot sibling does — the boundary is about WHERE the call lives, and a correctly parameterised call at the wrong address is still at the wrong address. */
export function optionalChainedRpcCall(locals: RequestLocals, projectId: string): AnyBuilder {
  return locals.supabase?.rpc('get_nominations', { p_project_id: projectId });
}

/** REPORTED by check 9: the same table read reached through the optional-CALL punctuator, which is the third and last punctuator optional chaining has and the one no matcher read. Same check, same message text, same tally family as its two siblings — the punctuator is a spelling of the access, not a case of its own. */
export function optionalCallTableRead(locals: RequestLocals): AnyBuilder {
  return locals.supabase.from?.('elections').select('*').order('sort_order');
}

/** REPORTED by check 9: the same rpc call with the optional operator at an INTERVENING chain link, reached through the non-storage member this file's client type carries for exactly that purpose. It passes its project key for the same deliberate reason its siblings do — the boundary is about WHERE the call lives, and a correctly parameterised call at the wrong address is still at the wrong address. */
export function optionalChainLinkRpcCall(locals: RequestLocals, projectId: string): AnyBuilder {
  return locals.supabase?.rest.rpc('get_nominations', { p_project_id: projectId });
}

/**
 * REPORTED by check 7: an Edge Function reached through a COMPUTED member key, at the one address
 * the invocation check was deliberately unanchored to reach.
 *
 * This is the shape a fourth review of this guard injected here and watched go unreported: the
 * invocation check's computed spelling was dispositioned to a matcher that runs over the adapter
 * corpus alone, so nothing read this line out here and the function's absent disposition was never
 * checked. The function name is deliberately one no `PROJECT_SCOPED_EDGE_FUNCTIONS` entry names, so
 * the shape would be a live leak if the guard could read it at all.
 */
export function computedInvokeMember(locals: RequestLocals): Promise<unknown> {
  return locals.supabase.functions['invoke']('probe_undispositioned_function', { body: {} });
}

/**
 * REPORTED by check 7: the same computed member reached through the OPTIONAL access operator.
 *
 * It is what this shape is FOR: it is the only committed shape that makes the computed-invocation
 * matcher's FIRST optional-punctuator cell load-bearing, so reverting that cell to a plain form must
 * break the self-test. Without it the position would be widened in source and exercised by nothing,
 * which is the unproven-widening defect rather than a closure of it.
 */
export function optionalComputedInvokeMember(locals: RequestLocals): Promise<unknown> {
  return locals.supabase.functions?.['invoke']('probe_undispositioned_function_2', { body: {} });
}

/**
 * REPORTED by check 7: the same computed member called through the optional-CALL punctuator.
 *
 * It is the only committed shape that makes the computed-invocation matcher's SECOND
 * optional-punctuator cell load-bearing, for the reason its sibling above gives about the first.
 */
export function optionalCallComputedInvokeMember(locals: RequestLocals): Promise<unknown> {
  return locals.supabase.functions['invoke']?.('probe_undispositioned_function_3', { body: {} });
}

/**
 * REPORTED by check 7: the client's `functions` member itself reached by a computed key, which is
 * the second half of the pair the corpus-axis finding named, at the boundary address.
 *
 * The invocation check anchors on the literal member name `functions` immediately before `invoke`,
 * and a bracketed key spells that name inside a string literal — so the invocation behind it is past
 * the anchor and the function's absent disposition was never checked out here.
 */
export function computedFunctionsMember(locals: RequestLocals): Promise<unknown> {
  return locals.supabase['functions'].invoke('probe_undispositioned_function_4', { body: {} });
}

/**
 * REPORTED by check 7: the same computed `functions` member with its key written as a TEMPLATE
 * LITERAL rather than a quoted string.
 *
 * JavaScript has three spellings of a string key — apostrophe, double quote and backtick — and a
 * closure that read two of them would leave the third an enumerable spelling that evades it on the
 * day it lands. The spelling is exercised here rather than assumed.
 */
export function templateKeyComputedFunctionsMember(locals: RequestLocals): Promise<unknown> {
  return locals.supabase[`functions`].invoke('probe_undispositioned_function_5', { body: {} });
}

/**
 * REPORTED by check 9: the same table read past TypeScript's NON-NULL ASSERTION, at the boundary
 * address.
 *
 * CR-01 is a punctuator finding rather than a corpus one, so it is committed at BOTH addresses:
 * `BOUNDARY_ACCESS_RE` spelled its member operator the same way every adapter-side matcher did, and
 * was blind in the same way. The asymmetry the review recorded is why this one matters on its own —
 * the ESLint adapter-boundary rule fires on any `.supabase` member access outside its allowlist, so
 * out here there was defence in depth, while inside the adapter directory the same evasion was
 * unmitigated.
 */
export function nonNullAssertedTableRead(locals: RequestLocals): AnyBuilder {
  return locals.supabase!.from('elections').select('*').order('sort_order');
}

/** REPORTED by check 7: an undispositioned Edge Function invoked past a non-null assertion at the boundary address, so the punctuator is exercised on the invocation surface out here as well as on the table surface. */
export function nonNullAssertedInvocation(locals: RequestLocals): Promise<unknown> {
  return locals.supabase.functions!.invoke('probe_undispositioned_function_6', { body: {} });
}
