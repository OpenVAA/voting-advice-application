/**
 * The entity grant write, for the Edge Functions that mint an identity.
 *
 * Extracted from the Edge Function entry points for testability, in the shape `identity-callback/candidateRecord.ts` established. This module reaches the Deno runtime global nowhere and imports from a remote origin nowhere -- no environment read, no server registration, no URL import -- so it can be imported by both the Edge Function and vitest. The client is a parameter for that reason: the caller reads the environment and builds the service-role client, and this module holds only the row shape and the failure behaviour, which are the halves worth asserting.
 *
 * DUPLICATED ON PURPOSE. Byte-identical copies of this file live in `apps/supabase/supabase/functions/invite-candidate/` and `apps/supabase/supabase/functions/identity-callback/` -- this file is one of the two -- because Supabase treats each top-level function directory as its own deployment unit and this repository has no shared-module directory for Edge Functions. `jwtSegment.ts` already exists as two copies for exactly the same reason, so a reader who finds two identical files is looking at a choice rather than at an oversight.
 *
 * ENTITY-TYPE PARAMETERISED, which is D-21's instruction applied as far as wave 2 reaches. All four entity types are accepted and all four are exercised by this module's own test; only one is passed by a caller today, because entity-type SELECTION at the identity entry point and the creation paths for the other three entity tables are deferred to the sign-up phase by name. The literal naming the entity type therefore appears ONCE per Edge Function -- at the call site that says which entity was just created -- and nowhere in the authorisation check, nowhere in the insert, and nowhere in this file. Adding organizations later is a second call site rather than a control-flow change.
 *
 * WHY THE VOCABULARY IS ONE STRING RATHER THAN AN ARRAY OF LITERALS. The closed set of entity types has to be spelled somewhere for the runtime check below to exist at all, and spelling it as four quoted literals would put the candidate literal in this file -- the one place the whole point of the parameterisation is that it does not appear. A single whitespace-separated declaration names the vocabulary once, as a vocabulary, without any one member standing alone as a literal this module could accidentally come to depend on.
 *
 * WHY A FAILED WRITE IS A THROW. Under the grant model an identity holding no grant row can do nothing at all: the access-token hook projects `public.grants` and the claim it builds for a grant-less user is an empty array, which answers false for all 23 permissions. A caller that logged the failure and continued would report a successful invite or a successful registration to a principal who has just been locked out of the application, and the failure would surface later as an unexplained wall of denials rather than as an error anyone can attribute.
 */

/**
 * The entity types a grant's discriminator may name, as the database's `entity_type` enum declares them.
 *
 * Declared as one whitespace-separated string for the reason in this module's header. It is the runtime half of the type below; the type is the compile-time half, and neither alone would catch a caller reached through an `unknown`.
 */
const ENTITY_GRANT_VOCABULARY = 'candidate organization faction alliance';

/** PostgreSQL's SQLSTATE for a unique violation, which PostgREST passes through as the error `code`. */
const UNIQUE_VIOLATION = '23505';

/** The same vocabulary as a list, for the runtime membership check. */
const ENTITY_GRANT_TYPES: Array<string> = ENTITY_GRANT_VOCABULARY.split(' ');

/**
 * One of the four entity types a grant may point at.
 *
 * Derived from the vocabulary declared above rather than restated as a second union, so the runtime check and the compile-time type are the SAME declaration and cannot drift apart. The conditional type is a split on the separator, which is all it is.
 */
type SplitOnSpace<TSource extends string> = TSource extends `${infer THead} ${infer TRest}`
  ? THead | SplitOnSpace<TRest>
  : TSource;

export type EntityGrantType = SplitOnSpace<typeof ENTITY_GRANT_VOCABULARY>;

/**
 * The narrow slice of the Supabase client this module uses.
 *
 * Declared locally rather than imported so the module needs no import at all, which is what keeps it free of the remote specifier the Edge Function entry points hold.
 */
export interface GrantWriteClient {
  from(table: string): {
    insert(row: Record<string, unknown>): Promise<{ error: { message: string; code?: string } | null }>;
  };
}

/**
 * Write the entity grant that makes a newly minted identity able to act on its own entity.
 *
 * One row, one table. The role is the entity level of the two the vocabulary declares, and the scope is the entity scope: that pair is the whole of what the user-type-to-grant mapping gives every entity user, and what distinguishes one entity user from another is the discriminator and the target, both of which are parameters.
 * @param client - A Supabase client; normally the service-role admin client, which bypasses row-level security.
 * @param grant.userId - The auth user the grant is held by.
 * @param grant.entityType - Which entity table the target lives in.
 * @param grant.entityId - The entity row the grant reaches.
 * @throws {Error & { code: string }} `ERR_ENTITY_GRANT_TYPE_UNKNOWN` when the entity type is outside the declared four, rather than writing a row carrying an unknown discriminator; `ERR_GRANT_WRITE_FAILED` when the insert itself failed for any reason other than the grant already existing. The second message carries the client-reported text only.
 */
export async function writeEntityGrant(
  client: GrantWriteClient,
  { userId, entityType, entityId }: { userId: string; entityType: EntityGrantType; entityId: string }
): Promise<void> {
  if (!ENTITY_GRANT_TYPES.includes(entityType)) {
    throw Object.assign(new Error(`Unknown entity type for grant: ${entityType}`), {
      code: 'ERR_ENTITY_GRANT_TYPE_UNKNOWN'
    });
  }

  const { error } = await client.from('grants').insert({
    user_id: userId,
    scope: 'entity',
    target_type: entityType,
    target_id: entityId,
    role: 'editor'
  });

  // IDEMPOTENT (162-REVIEW WR-06). A unique violation on `grants_user_scope_target_role_key` means this exact grant already exists, which is the state the caller wanted -- so it is success, not failure. That is what lets a caller write the grant on EVERY pass rather than only when it has just created the entity: a request that created the entity and then failed to write the grant is repaired by the next one, instead of leaving the identity grant-less, and therefore denied everything, for good.
  if (error && error.code !== UNIQUE_VIOLATION) {
    throw Object.assign(new Error(`Grant write failed: ${error.message}`), {
      code: 'ERR_GRANT_WRITE_FAILED'
    });
  }
}
