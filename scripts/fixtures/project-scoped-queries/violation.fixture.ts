/**
 * Fixture: the call shapes `scripts/assert-project-scoped-queries.mjs` must REPORT, plus two that
 * it must NOT.
 *
 * This file is never imported, never built and never executed. It exists so the guard's
 * `--self-test` can prove it still fires, which a run over the real adapter cannot do: every
 * guarded source reaches the database through the scoped helper, so the real corpus is clean by
 * construction and a zero there says nothing about whether the guard works.
 */

type AnyBuilder = {
  select: (columns?: string) => AnyBuilder;
  insert: (values: unknown) => AnyBuilder;
  eq: (column: string, value: string) => AnyBuilder;
  order: (column: string) => AnyBuilder;
  upload: (path: string, file: unknown) => AnyBuilder;
};

type AnyClient = {
  from: (table: string) => AnyBuilder;
  rpc: (name: string, args?: Record<string, unknown>) => AnyBuilder;
  storage: { from: (bucket: string) => AnyBuilder };
  functions: { invoke: (name: string, options?: { body?: Record<string, unknown> }) => Promise<unknown> };
  schema: (name: string) => { from: (table: string) => AnyBuilder };
  /**
   * A NON-STORAGE intermediate member, so a chain link can carry the optional access operator and
   * still move a count.
   *
   * It is load-bearing rather than decorative. The only chain links the other shapes here place an
   * operator at are storage buckets, and a bucket is dropped structurally whether its chain matched
   * or not — so that operator position can never move a count and is proven by nothing. A member
   * that reaches a real table is what makes the intervening-chain position measurable.
   */
  rest: { from: (table: string) => AnyBuilder; schema: (name: string) => { from: (table: string) => AnyBuilder } };
  /**
   * A plain SCALAR member, declared so `boundClientMemberRead` below stays self-describing.
   *
   * It reaches no table and is not a client sub-object, which is exactly the point of it: the
   * binding rule cannot tell the two apart from source, so this shape is reported and the message
   * is a false statement about it. See that method's docblock, and the residual it is pinned to.
   */
  restUrl: string;
};

/**
 * A second client, for the nullish-coalesced binding below to fall back to.
 *
 * It exists so that binding is a genuine alias of the raw client rather than a syntax curiosity: a
 * `??` whose right-hand side is not a client would model nothing anybody would write.
 */
const fallbackClient: AnyClient = null as unknown as AnyClient;

export class ViolationFixture {
  supabase: AnyClient = null as unknown as AnyClient;
  /** A stand-in for the real scoped helper. It deliberately does not touch `this.supabase`: the helper is what the guard is steering callers TOWARD, and a stub that reached the raw client would make the fixture report the very shape it is modelling as correct. */
  scopedFrom(_table: string): AnyBuilder {
    return null as unknown as AnyBuilder;
  }

  /** REPORTED by check 1: a declared project-scoped table reached without the scoped helper. */
  unscopedTableRead(): AnyBuilder {
    return this.supabase.from('elections').select('*').order('sort_order');
  }

  /** REPORTED by check 1: the same forbidden shape spelled with the OPTIONAL access operator, and bound to a local before it is used. The binding is load-bearing rather than stylistic — it is the only shape that exercises check 6's trailing lookahead, so it is what proves an optional-chained access is counted ONCE, as an access, rather than a second time as an aliased client. The table literal is its own, so this violation is tellable apart from `unscopedTableRead`'s by its message. */
  optionalChainedTableRead(): AnyBuilder {
    const builder = this.supabase?.from('candidates');
    return builder.select('*');
  }

  /** REPORTED by check 1: the same forbidden shape reached through the optional-CALL punctuator, which is the third and last punctuator optional chaining has and the one no matcher read. Its table literal is its own, so this violation is tellable apart from its siblings' by its message alone. The binding is load-bearing rather than stylistic, in the same terms `optionalChainedTableRead`'s is: this is the only shape that exercises the optional-CALL position of check 6's trailing lookahead, so reverting that position must make this access be reported a SECOND time, as an alias. It is one access site before and after, and zero escape hatches either way. */
  optionalCallTableRead(): AnyBuilder {
    const builder = this.supabase.from?.('constituencies');
    return builder.select('*');
  }

  /** REPORTED by check 1: the same forbidden shape with the optional operator at the RECEIVER position, between `this` and the client field. That position is widened in the matcher but was exercised by nothing, so it was a claim rather than a measurement. Its table literal is its own. */
  optionalReceiverTableRead(): AnyBuilder {
    return this?.supabase.from('factions').select('*');
  }

  /** REPORTED by check 1: the same forbidden shape with the optional operator at an INTERVENING chain link. A storage link cannot serve this purpose — a bucket is dropped structurally before it is counted, so an operator placed there can never move a count — which is why the client type carries a non-storage member for this shape to reach through. Its table literal is its own. */
  optionalChainLinkTableRead(): AnyBuilder {
    return this.supabase?.rest.from('feedback').select('*');
  }

  /** REPORTED by check 3: the table is chosen at runtime, so the guard cannot see which one it is. */
  dynamicTableRead(someVariable: string): AnyBuilder {
    return this.supabase.from(someVariable).select('*');
  }

  /** REPORTED by check 4: an rpc with no written disposition. */
  undispositionedRpc(): AnyBuilder {
    return this.supabase.rpc('not_declared_anywhere', {});
  }

  /** REPORTED by check 4: an rpc with no written disposition, reached through the OPTIONAL access operator. Its name is its own so this violation is tellable apart from `undispositionedRpc`'s by its message. */
  optionalChainedUndispositionedRpc(): AnyBuilder {
    return this.supabase?.rpc('also_not_declared_anywhere', {});
  }

  /** REPORTED by check 6: the client is aliased to a local binding, which reaches every table with no receiver the access matcher can see. */
  aliasedClient(): AnyBuilder {
    const db = this.supabase;
    return db.from('elections').select('*');
  }

  /** REPORTED by check 6: the client is aliased through nullish coalescing, which reaches every table just as the plain alias above does. It is the NEAR MISS for check 6's own repair. The naive way to stop the binding rule reading `this.supabase?.from(…)` as an alias is to add a bare `?` to its trailing lookahead's character class, and that spelling also excludes `??` — so this genuine alias silently stops being reported. Measured, which is why the shape is committed rather than described. */
  nullishCoalescedClient(): AnyBuilder {
    const db = this.supabase ?? fallbackClient;
    return db.from('elections').select('*');
  }

  /** REPORTED by check 6: the client is aliased through the optional operator at the RECEIVER position. It is the same alias its plain sibling above is, and it is what makes the binding rule's own operator position load-bearing rather than merely widened. */
  optionalReceiverAliasedClient(): AnyBuilder {
    const db = this?.supabase;
    return db.from('elections').select('*');
  }

  /** REPORTED by check 6: the call method is destructured off the client, leaving no receiver at the call site at all. */
  destructuredFrom(): AnyBuilder {
    const { from } = this.supabase;
    return from('candidates').select('*');
  }

  /**
   * REPORTED by check 6: a client SUB-OBJECT bound to a local, which reaches the same tables one link past where the binding rule used to stop.
   *
   * This is the exact shape the fourth re-verification injected into this fixture and watched change nothing. The SECOND line is reported by NOTHING — `INVOKE_RE` requires the literal member name `functions` immediately before `invoke`, which an aliased local does not carry, and no other rule anchors on a bare identifier — which is precisely why the FIRST line has to be. Two undispositioned Edge Function invocations inside the guard's strictest corpus were uncounted, so the per-family non-vacuity floor could not see them either.
   */
  subObjectAliasedClient(): Promise<unknown> {
    const fns = this.supabase.functions;
    return fns.invoke('probe_undispositioned_function', { body: {} });
  }

  /**
   * REPORTED by check 6, as a DESTRUCTURE rather than an alias: the invocation method taken off the client's `functions` member.
   *
   * `bindsByDestructuring` reads the pattern to the left of the `=` that bound the client, so this lands in the destructure count rather than the alias count. The two counts are pinned SEPARATELY in the self-test, so one cannot stand in for the other — which is what keeps the two halves of this receiver-depth finding measured apart rather than pooled into a single number that would move either way.
   */
  destructuredSubObjectMethod(): Promise<unknown> {
    const { invoke } = this.supabase.functions;
    return invoke('probe_undispositioned_function_2', { body: {} });
  }

  /**
   * REPORTED by check 6, as a DESTRUCTURE: the same shape WRAPPED across lines, which is what a formatter does to a pattern that outgrows the print width.
   *
   * It is the fixture that makes the classifier's line-vs-statement scope load-bearing. The rule read the text before the `=` on the MATCH'S OWN LINE, which for this shape is just `} ` — no opening brace, so the pattern rejected it and the site landed in the ALIAS count with a message calling it an alias. Every other destructure shape here is single-line, so nothing measured the difference: a formatting change at a live site moved one family into the other's total with no test failing and the pooled sum intact.
   *
   * Spell `bindsByDestructuring` back to a line-scoped read and this shape moves — destructure 4 to 3, alias 5 to 6 — so the position is held by a count rather than by this docblock.
   */
  destructuredAcrossLines(): AnyBuilder {
    const {
      from
    } = this.supabase;
    return from('constituencies').select('*');
  }

  /**
   * REPORTED by check 6, as a DESTRUCTURE: a NESTED pattern, which the classifier's old `[^{}]*` could not span either.
   *
   * Not part of the review's finding — found by measuring the shape it did name, which is why it is committed rather than mentioned. `{ auth: { getUser } }` puts braces inside the pattern, and a character class excluding both brace characters cannot cross them, so this was rejected for a second reason independent of where the line breaks fall. Brace BALANCE handles both, and this shape is what says the fix was balance rather than a wider character class.
   */
  destructuredNestedPattern(): Promise<unknown> {
    const { auth: { getUser } } = this.supabase;
    return getUser();
  }

  /**
   * REPORTED by check 6, and this one is the FALSE POSITIVE the promotion costs.
   *
   * `restUrl` is a string, not a client sub-object: nothing is reachable through it and the message's "or one of its members" is, for this site, a false statement about what was bound. The binding rule decides from the member NAME alone and no client-member disposition list is declared — both shapes are spelled `= this.supabase.<identifier>;` — so as the rule stands the choice is between reporting this and not reporting `subObjectAliasedClient` above. A `CLIENT_SUB_OBJECTS` map WOULD separate the two at source level; it is not declared, which makes this a decided cost rather than an impossibility, and one instance of an unbounded class rather than one site.
   *
   * It is committed as a violating shape rather than deleted from the fixtures, because a limitation nobody can see is not a disposed limitation. It moved here out of `clean.fixture.ts`, where it used to be the negative control for the narrow lookahead, and the residual that states the limitation in the module docblock is pinned to it in both directions.
   */
  boundClientMemberRead(): string {
    const restUrl = this.supabase?.restUrl;
    return restUrl;
  }

  /** REPORTED by check 6: the member is reached by a computed key, which is the same call spelled so no dot-access matcher sees it. */
  computedAccess(): AnyBuilder {
    return this.supabase['from']('nominations');
  }

  /** REPORTED by check 6: the same computed member spelled with the OPTIONAL access operator. Its table literal is its own so the two computed-access shapes are tellable apart by a reader; the guard's message names neither, which is why the self-test pins this pair by an exact count rather than by a literal. */
  optionalChainedComputedAccess(): AnyBuilder {
    return this.supabase?.['from']('questions');
  }

  /** REPORTED by check 6: a computed member at a CHAINED link rather than directly on the client. It is the identical escape one link further along than check 6 used to look, so it reached the client past both the dot-access matcher and the computed rule that exists to catch exactly this. */
  chainedComputedAccess(): AnyBuilder {
    return this.supabase.rest['from']('feedback');
  }

  /** REPORTED by check 6: the same computed member at a chained link, with the OPTIONAL access operator at that link. It is what makes the chain position of the computed rule load-bearing: spell that link with a plain dot in both chained shapes and the position can be reverted with no count moving, which is the unproven-widening defect rather than a closure of it. The terminal computed punctuator is proven separately, by the unchained optional shape above. */
  optionalChainLinkComputedAccess(): AnyBuilder {
    return this.supabase?.rest['from']('nominations');
  }

  /** REPORTED by check 6: a computed access to the CLIENT FIELD itself — the receiver reached by a bracketed string key rather than by name. The client reached this way is past every receiver anchor checks 1 to 4 depend on, which is the same reason the shapes already enumerated in the check-6 docblock are forbidden. */
  computedClientFieldAccess(): AnyBuilder {
    return this['supabase'].from('elections').select('*');
  }

  /** REPORTED by check 6: the same computed access to the client field with the optional computed punctuator on `this`, reaching an rpc rather than a table — the receiver is past the anchor either way, so which member follows it changes nothing about why it is forbidden. */
  optionalComputedClientFieldAccess(): AnyBuilder {
    return this?.['supabase'].rpc('get_nominations', {});
  }

  /** REPORTED by check 8: the table is reached through a call in the MIDDLE of the chain, which the receiver-anchored table matcher stops at — so the access is uncounted rather than merely unchecked. */
  schemaHopTableRead(): AnyBuilder {
    return this.supabase.schema('public').from('elections').select('*');
  }

  /** REPORTED by check 8: the same schema hop whose FIRST access operator is the optional one. The hop already defeated the table matcher; spelling its first operator `?.` defeated the schema-hop matcher too, which is the same blind spot one rule over. */
  optionalChainedSchemaHop(): AnyBuilder {
    return this.supabase?.schema('public').from('elections').select('*');
  }

  /** REPORTED by check 8: the same schema hop whose SCHEMA CALL is reached through the optional-CALL punctuator. The hop already defeated the table matcher; this punctuator defeated the schema-hop matcher too, one spelling further along than the operator that defeated it last. */
  optionalCallSchemaHop(): AnyBuilder {
    return this.supabase.schema?.('public').from('elections').select('*');
  }

  /** REPORTED by check 8: the same schema hop with the optional operator at the RECEIVER position, between `this` and the client field. */
  optionalReceiverSchemaHop(): AnyBuilder {
    return this?.supabase.schema('public').from('elections').select('*');
  }

  /** REPORTED by check 8: the same schema hop with the optional operator at an INTERVENING chain link, reached through the non-storage member for the reason the table read at that position gives — a storage link is dropped before it is counted, so an operator placed there can never move a count. */
  optionalChainLinkSchemaHop(): AnyBuilder {
    return this.supabase?.rest.schema('public').from('elections').select('*');
  }

  /** REPORTED by check 7: an Edge Function nobody has written a disposition for. The guard cannot see inside a function body, so an undispositioned invocation is a scoping question nobody answered. */
  undispositionedInvocation(): Promise<unknown> {
    return this.supabase.functions.invoke('not_dispositioned_anywhere', { body: {} });
  }

  /** REPORTED by check 7: an Edge Function dispositioned as needing a project term, invoked with a body that carries neither spelling of it. */
  invocationMissingProjectTerm(): Promise<unknown> {
    return this.supabase.functions.invoke('invite-candidate', {
      body: { firstName: 'Ada', lastName: 'Lovelace', email: 'ada@example.org' }
    });
  }

  /** REPORTED by check 7: an Edge Function with no disposition, invoked with the OPTIONAL access operator on BOTH positions — receiver-to-`functions` and `functions`-to-`invoke`. The second of those is the one that was actually blind. Its name is its own so this violation is tellable apart from `undispositionedInvocation`'s by its message. */
  optionalChainedUndispositionedInvocation(): Promise<unknown> {
    return this.supabase?.functions?.invoke('also_not_dispositioned_anywhere', { body: {} });
  }

  /** REPORTED by check 7: an Edge Function with no disposition, invoked through the optional-CALL punctuator on `invoke`. Its name is its own so this violation is tellable apart from its two siblings' by its message. */
  optionalCallUndispositionedInvocation(): Promise<unknown> {
    return this.supabase.functions.invoke?.('one_more_undispositioned', { body: {} });
  }

  /**
   * REPORTED TWICE, by check 6 AND by check 7, and that is the point of the shape.
   *
   * Inside the adapter directory this ONE line is matched by two rules and they SEPARATE rather than
   * merge. Check 6's computed-member rule reports it and counts it into the ESCAPE-HATCH family,
   * because the member is reached by a key no dot-access matcher sees. Check 7's computed-invocation
   * rule reports it and counts it into the INVOCATION family, because the Edge Function behind that
   * key has no disposition anybody can check. Both tallies therefore rise by one for a single line,
   * and neither rule suppresses the other — the self-test asserts both messages and both family
   * counts, so a change that merged them would be a named failure rather than a quieter number.
   */
  computedInvokeMemberInsideAdapter(): Promise<unknown> {
    return this.supabase.functions['invoke']('adapter_computed_undispositioned', { body: {} });
  }

  /**
   * REPORTED by check 1: the table reached past TypeScript's NON-NULL ASSERTION, which sits between the receiver and the access punctuator.
   *
   * This is CR-01, and it is the punctuator the whole enumeration was blind to by construction. `PUNCTUATOR_TOKENS` held three forms all spelled with a question mark, and the closure assertion tested only for a residual `\?` — so a fourth form admitting `!` contains no `\?` at all and would have arrived unnoticed. The set the guard called "a closed set fixed by the language" was JAVASCRIPT's optional-chaining set; the language this repository is written in is TypeScript, whose member-access punctuator set also contains `!.`, spelled 54 times under `apps/frontend/src` today.
   *
   * It was UNCOUNTED rather than merely unreported: `collectAccesses` yielded no site, so check 3's "a site the guard cannot parse is a site it cannot cover" never fired for it, `tally.accesses` did not move, and the per-family floor could not see the family go silent.
   */
  nonNullAssertedTableRead(): AnyBuilder {
    return this.supabase!.from('organizations').select('*');
  }

  /** REPORTED by check 8: the same non-null assertion in front of a SCHEMA HOP, which is the punctuator and the mid-chain call defeating two rules at once. */
  nonNullAssertedSchemaHop(): AnyBuilder {
    return this.supabase!.schema('public').from('elections').select('*');
  }

  /** REPORTED by check 7: an undispositioned Edge Function invoked past a non-null assertion at the `functions`-to-`invoke` position — the one operator position of the invocation matcher that was actually blind, now in its third spelling. */
  nonNullAssertedInvocation(): Promise<unknown> {
    return this.supabase.functions!.invoke('probe_nonnull_undispositioned', { body: {} });
  }

  /** REPORTED by check 6: a computed member reached past a non-null assertion. The assertion sits directly before the BRACKET here rather than before a dot, which is the computed-or-call position's own spelling of the same punctuator — `!['from']` rather than `!.from`. */
  nonNullAssertedComputedAccess(): AnyBuilder {
    return this.supabase!['from']('nominations');
  }

  /** NOT reported: a storage bucket is not a table, and has no project column to filter on. */
  bucketUpload(file: unknown): AnyBuilder {
    return this.supabase.storage.from('public-assets').upload('a/b/c.jpg', file);
  }

  /** NOT reported: the same bucket reached with the OPTIONAL access operator on both positions. It is the negative control for the access matcher's chain capture group, which is what drops a bucket structurally rather than by name. Damage that group while the operator is widened and this shape fires loudly — as an extra counted site AND a check-1 violation naming a bucket as if it were a table. */
  optionalChainedBucketUpload(file: unknown): AnyBuilder {
    return this.supabase?.storage?.from('public-assets').upload('a/b/c.jpg', file);
  }

  /** NOT reported: the same bucket reached through the optional-CALL punctuator. It is the negative control for the access matcher's chain capture group under the newest punctuator: damage that group while the punctuator is admitted and this shape fires loudly, as an extra counted site AND a check-1 violation naming a bucket as if it were a table. */
  optionalCallBucketUpload(file: unknown): AnyBuilder {
    return this.supabase.storage.from?.('public-assets').upload('a/b/c.jpg', file);
  }

  /**
   * REPORTED by check 6: the client's OWNER aliased to a local, one link earlier than every other escape hatch.
   *
   * This is CR-04's first shape. `ACCESS_RE` anchors on the literal `this` immediately before `supabase`, so it never sees `self.supabase.from(...)`; `CLIENT_BINDING_RE` requires `this.supabase` right of the `=`, and this initialiser is bare `this`. It was UNCOUNTED rather than merely unreported — `tally.escapeHatches` did not move for it, so the per-family floor could not see the family go silent.
   */
  ownerAliasedClient(): AnyBuilder {
    const self = this;
    return self.supabase.from('elections').select('*');
  }

  /**
   * REPORTED by check 6: the client DESTRUCTURED out of its owner, which is the same defect spelled without an intermediate receiver at all.
   *
   * CR-04's second shape, and the sharper of the two: after it the table read is a bare `supabase.from(...)` carrying no receiver any matcher here anchors on. `BOUNDARY_ACCESS_RE` does match it, which is exactly why this is a corpus defect — that matcher is never run over this corpus.
   */
  ownerDestructuredClient(): AnyBuilder {
    const { supabase } = this;
    return supabase.from('elections').select('*');
  }

  /**
   * REPORTED by check 6: the owner bound past a NON-NULL ASSERTION that TERMINATES rather than continuing a chain.
   *
   * CR-05's first shape. The rule's lookahead excluded the bare character `!` in order to decline `this!.supabase` — a mid-chain assertion check 1 already reports — and in doing so it also declined this, where the `!` ends the expression and the binding is of the owner itself. `nonNullAssertedTableRead` above is the same punctuator one link along the chain and IS reported, so the guard knew the spelling at the client level while the owner level was blind to it.
   */
  nonNullAssertedOwner(): AnyBuilder {
    const self = this!;
    return self.supabase.from('elections').select('*');
  }

  /** NOT reported: the scoped helper is the sanctioned route. */
  scopedTableRead(): AnyBuilder {
    return this.scopedFrom('elections').select('*');
  }
}
