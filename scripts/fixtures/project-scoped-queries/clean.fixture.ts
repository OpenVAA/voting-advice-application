/**
 * Fixture: the call shapes `scripts/assert-project-scoped-queries.mjs` must NOT report.
 *
 * It is the self-test's negative control. A guard that reddens on everything is as useless as one
 * that reddens on nothing, so the self-test asserts this file produces zero violations while its
 * sibling `violation.fixture.ts` produces several. Both are needed: either alone would pass under
 * a broken guard.
 *
 * This file is never imported, never built and never executed.
 */

type AnyBuilder = {
  select: (columns?: string) => AnyBuilder;
  eq: (column: string, value: string) => AnyBuilder;
  upload: (path: string, file: unknown) => AnyBuilder;
};

type AnyClient = {
  from: (table: string) => AnyBuilder;
  rpc: (name: string, args?: Record<string, unknown>) => AnyBuilder;
  storage: { from: (bucket: string) => AnyBuilder };
  functions: { invoke: (name: string, options?: { body?: Record<string, unknown> }) => Promise<unknown> };
  auth: {
    updateUser: (attributes: Record<string, unknown>) => Promise<unknown>;
    /** Declared so `destructuredCallResult` below stays self-describing. Its result shape mirrors the live call site's, which destructures `data` off it. */
    getUser: () => Promise<{ data: { user: unknown } }>;
  };
};

/** An object whose IDENTIFIER merely ends in `functions`, declared so the near miss below is self-describing rather than a bare literal. */
type SubFunctions = { invoke: (name: string, options?: { body?: Record<string, unknown> }) => Promise<unknown> };

/** A flag record one of whose KEYS merely begins with `functions`, declared for the same reason. */
type FeatureFlags = { functionsEnabled: boolean };

export class CleanFixture {
  supabase: AnyClient = null as unknown as AnyClient;
  projectId = '00000000-0000-0000-0000-000000000001';
  /** A stand-in for the real scoped helper. It deliberately does not touch `this.supabase`: the helper is what the guard is steering callers TOWARD, and a stub that reached the raw client would make the fixture report the very shape it is modelling as correct. */
  scopedFrom(_table: string): AnyBuilder {
    return null as unknown as AnyBuilder;
  }

  /** A storage bucket, which has no project column and is not a table. */
  bucketUpload(file: unknown): AnyBuilder {
    return this.supabase.storage.from('public-assets').upload('a/b/c.jpg', file);
  }

  /** The sanctioned route to a project-scoped table. */
  scopedTableRead(): AnyBuilder {
    return this.scopedFrom('elections').select('*');
  }

  /** A dispositioned rpc, called with the project key its disposition requires. */
  dispositionedRpc(): AnyBuilder {
    return this.supabase.rpc('get_nominations', { p_project_id: this.projectId });
  }

  /** A dispositioned rpc reached through the OPTIONAL access operator, called with the project key its disposition requires. It is the positive control for the widened access matcher: the matcher performs a real check on the optional spelling rather than reddening on sight of it. */
  optionalChainedDispositionedRpc(): AnyBuilder {
    return this.supabase?.rpc('get_questions', { p_project_id: this.projectId });
  }

  /** A dispositioned rpc reached through the optional-CALL punctuator, called with the project key its disposition requires. It is the positive control for that punctuator: the widened matcher performs a real check on the shape rather than reddening on sight of it, which is the failure mode a widening most easily introduces. */
  optionalCallDispositionedRpc(): AnyBuilder {
    return this.supabase.rpc?.('get_nominations', { p_project_id: this.projectId });
  }

  /**
   * NOT reported: a destructure of a CALL RESULT rather than of the client.
   *
   * It is LIVE, at `apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts:166`, and it is the nearest live shape to the binding rule as check 6 now spells it: the initialiser begins with the receiver and destructures, exactly as `destructuredFrom` in the sibling fixture does, and the ONLY thing that separates them is that this chain TERMINATES IN A CALL. The widened lookahead leaving it alone is what says the widening cost no live call site — the control the closure would otherwise be asserting rather than measuring.
   *
   * It contributes zero counted sites, so this fixture's own count must be unchanged by it.
   */
  async destructuredCallResult(): Promise<unknown> {
    const { data } = await this.supabase.auth.getUser();
    return data;
  }

  /** An Edge Function dispositioned as needing a project term, invoked with the camelCase spelling one of its two live call sites uses. */
  dispositionedInvocationCamelCase(): Promise<unknown> {
    return this.supabase.functions.invoke('invite-candidate', {
      body: { firstName: 'Ada', lastName: 'Lovelace', email: 'ada@example.org', projectId: this.projectId }
    });
  }

  /** The same disposition satisfied by the snake_case spelling the other live call site uses. Both spellings are live, so a check that accepted only one would be wrong about one of them. */
  dispositionedInvocationSnakeCase(): Promise<unknown> {
    return this.supabase.functions.invoke('send-email', {
      body: { recipient_user_ids: [], project_id: this.projectId }
    });
  }

  /** A dispositioned Edge Function invoked through the OPTIONAL access operator on both positions, carrying the project term its disposition requires. The point of the shape is the OPERATOR rather than the function: both live spellings of the project term are already exercised by the two methods above, and what is new here is only that the invocation matcher reads `?.` at each of its positions. */
  optionalChainedDispositionedInvocation(): Promise<unknown> {
    return this.supabase?.functions?.invoke('send-email', {
      body: { recipient_user_ids: [], project_id: this.projectId }
    });
  }

  /** A dispositioned Edge Function invoked through the optional-CALL punctuator, carrying the project term its disposition requires. The point of the shape is the PUNCTUATOR rather than the function: both live spellings of the project term are already exercised above, and what is new here is only that the invocation matcher reads this punctuator and still performs a real check behind it. */
  optionalCallDispositionedInvocation(): Promise<unknown> {
    return this.supabase.functions.invoke?.('invite-candidate', {
      body: { firstName: 'Ada', lastName: 'Lovelace', email: 'ada@example.org', projectId: this.projectId }
    });
  }

  /** An Edge Function that resolves its project from deployment configuration and treats a body project term as a claim it refuses. Its payload carries no project term BY DESIGN, so demanding one here would be a false demand. */
  deploymentScopedInvocation(): Promise<unknown> {
    return this.supabase.functions.invoke('identity-callback', { body: { id_token: 'header.payload.signature' } });
  }

  /** A client call that reaches no table at all. It is the near miss for the invocation and schema-hop rules: both must leave it alone, and it is committed so that stays measured rather than assumed. */
  nonTableClientCall(): Promise<unknown> {
    return this.supabase.auth.updateUser({ password: 'not-a-real-password' });
  }

  /** NOT reported: the sharpest near miss the computed-invocation rule has, committed at the adapter address as well as at the boundary one. Identical key, identical call, on an identifier that merely ENDS in `functions` — only the word boundary distinguishes it from the violating shape in the sibling fixture. This fixture's site count must be UNCHANGED by it. */
  nearMissSuffixedFunctions(subfunctions: SubFunctions): Promise<unknown> {
    return subfunctions['invoke']('probe_not_a_client_function', { body: {} });
  }

  /** NOT reported: a computed key whose text merely BEGINS with `functions`. The closing-quote backreference is what excludes it — drop that backreference for a looser character class and this flag read starts reporting as an invocation surface. This fixture's site count must be UNCHANGED by it. */
  nearMissFunctionsPrefixedKey(config: FeatureFlags): boolean {
    return config['functionsEnabled'];
  }

  /** NOT reported: a binding taken off the owner that is NOT the owner. The owner rule's trailing lookahead is what excludes it — widen that lookahead to admit a following member access and this ordinary scalar read starts reporting as an owner binding. It is the near miss that keeps the rule anchored on a BARE `this`. */
  nearMissOwnerMemberBinding(): string {
    const id = this.projectId;
    return id;
  }

  /** NOT reported: an equality COMPARISON against the owner, which shares the owner rule's `this` but none of its meaning. The negative lookbehind is what excludes it — drop that lookbehind and every `=== this` in the corpus reads as a binding. */
  nearMissOwnerComparison(other: unknown): boolean {
    return other === this;
  }

  /** NOT reported: a TERNARY whose test is the owner. It binds whichever branch is taken, never `this`, so reporting it would be a false statement about the site. It is the near miss for CR-05's repair: the fix widened the lookahead's `?` exclusion to a `?` NOT followed by a second `?` so that `??` becomes reportable, and the cheap spelling of that — dropping the `?` exclusion outright — turns this ordinary ternary into a violation. */
  nearMissOwnerTernary(other: AnyClient): AnyClient {
    const chosen = this ? this.supabase : other;
    return chosen;
  }

  /** NOT reported: a strict INEQUALITY against the owner. Its `!` is the same first character as the non-null assertion CR-05 made reportable, and the two are told apart only by what follows — `!=` here, `!;` there. Widen the `!` exclusion to the bare character and `nonNullAssertedOwner` stops being reported; narrow it away entirely and this comparison starts being. */
  nearMissOwnerInequality(other: unknown): boolean {
    const differs = this !== other;
    return differs;
  }
}
