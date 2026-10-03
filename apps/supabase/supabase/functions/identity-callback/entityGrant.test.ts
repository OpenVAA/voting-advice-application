/**
 * Entity grant write tests.
 *
 * The grant row is the whole of a newly minted identity's authority: the access-token hook projects `public.grants` and nothing else, so an identity whose grant write failed can do nothing at all and the failure surfaces later as an unexplained wall of denials. These cases state the three properties that follow -- the row written, the table written to, and that a failure ABORTS rather than being logged -- and they state them as OBSERVED BEHAVIOUR of an importable module. `index.ts` resolves remote Deno specifiers and cannot be imported by vitest, so an insert written inline there could only be asserted against source text.
 *
 * ALL FOUR ENTITY TYPES ARE EXERCISED, although only candidates have a caller: organizations, factions and alliances have no creation path that writes a grant. Three of the module's four branches are therefore exercised by this file and by nothing else until a second call site exists.
 *
 * The client is a hand-built fake rather than a mocking library: it records the table it was asked for and the row it was handed, and answers `insert()` with a value each case controls.
 */

import { describe, expect, it } from 'vitest';
import { writeEntityGrant } from './entityGrant';
import type { EntityGrantType, GrantWriteClient } from './entityGrant';

const USER_ID = '11111111-1111-1111-1111-111111111111';
const ENTITY_ID = '22222222-2222-2222-2222-222222222222';

/** What one drive of the fake client observed: the tables asked for and the rows handed to `insert`. */
interface Recording {
  tables: Array<string>;
  rows: Array<Record<string, unknown>>;
}

/**
 * A recording client whose `insert()` resolves to `result`.
 * @param result - What `insert()` resolves to; `{ error: null }` for a write that succeeded.
 * @returns The client to pass to the write, and the recording it fills in.
 */
function recordingClient(result: { error: { message: string; code?: string } | null }): {
  client: GrantWriteClient;
  recorded: Recording;
} {
  const recorded: Recording = { tables: [], rows: [] };

  const client = {
    from(table: string) {
      recorded.tables.push(table);
      return {
        insert(row: Record<string, unknown>) {
          recorded.rows.push(row);
          return Promise.resolve(result);
        }
      };
    }
  };

  return { client: client as unknown as GrantWriteClient, recorded };
}

describe('writeEntityGrant', () => {
  // The parameterisation, exercised rather than declared. Each row asserts the WHOLE written shape, so a discriminator taken from the wrong side of a mapping -- a grant that is well-formed, passes every database constraint and points at the wrong entity class -- reddens here.
  it.each<EntityGrantType>(['candidate', 'organization', 'faction', 'alliance'])(
    'writes one entity/editor grant carrying target_type %s',
    async (entityType) => {
      const { client, recorded } = recordingClient({ error: null });

      await writeEntityGrant(client, { userId: USER_ID, entityType, entityId: ENTITY_ID });

      expect(recorded.rows).toEqual([
        {
          user_id: USER_ID,
          scope: 'entity',
          target_type: entityType,
          target_id: ENTITY_ID,
          role: 'editor'
        }
      ]);
    }
  );

  it('writes to the grants table and to no other table', async () => {
    const { client, recorded } = recordingClient({ error: null });

    await writeEntityGrant(client, { userId: USER_ID, entityType: 'candidate', entityId: ENTITY_ID });

    expect(recorded.tables).toEqual(['grants']);
  });

  // THE ABORT, observed rather than inferred from source text. A path that logged this failure and returned success would leave a candidate who received an invite holding no grant, and so no access at all.
  it('throws when the insert reports an error, carrying the client-reported text', async () => {
    const { client } = recordingClient({ error: { message: 'duplicate key value violates unique constraint' } });

    await expect(
      writeEntityGrant(client, { userId: USER_ID, entityType: 'candidate', entityId: ENTITY_ID })
    ).rejects.toThrow('duplicate key value violates unique constraint');
  });

  // IDEMPOTENT: the grant already existing is the state the caller wanted, so a unique violation naming the grants table's own key is success. That is what lets a caller write the grant without first asking whether it exists.
  it('treats a unique violation on the grant key (the grant already exists) as success', async () => {
    const { client, recorded } = recordingClient({
      error: {
        message: 'duplicate key value violates unique constraint "grants_user_scope_target_role_key"',
        code: '23505'
      }
    });

    await expect(
      writeEntityGrant(client, { userId: USER_ID, entityType: 'candidate', entityId: ENTITY_ID })
    ).resolves.toBeUndefined();
    expect(recorded.rows).toHaveLength(1);
  });

  // A unique violation on any key other than the grant's own is a refusal: another identity already holds the one editor grant that key admits, so reading it as success would report an identity that was never granted anything.
  it('throws when a unique violation names a key other than the grant key', async () => {
    const { client } = recordingClient({
      error: {
        message: 'duplicate key value violates unique constraint "idx_grants_one_candidate_editor"',
        code: '23505'
      }
    });

    await expect(
      writeEntityGrant(client, { userId: USER_ID, entityType: 'candidate', entityId: ENTITY_ID })
    ).rejects.toMatchObject({ code: 'ERR_GRANT_WRITE_FAILED' });
  });

  it('still throws for any other coded failure, such as a foreign-key violation', async () => {
    const { client } = recordingClient({ error: { message: 'violates foreign key constraint', code: '23503' } });

    await expect(
      writeEntityGrant(client, { userId: USER_ID, entityType: 'candidate', entityId: ENTITY_ID })
    ).rejects.toMatchObject({ code: 'ERR_GRANT_WRITE_FAILED' });
  });

  it('marks that throw with a named code, so a caller can distinguish it from any other failure', async () => {
    const { client } = recordingClient({ error: { message: 'connection reset' } });

    await expect(
      writeEntityGrant(client, { userId: USER_ID, entityType: 'candidate', entityId: ENTITY_ID })
    ).rejects.toMatchObject({ code: 'ERR_GRANT_WRITE_FAILED' });
  });

  // A discriminator outside the declared vocabulary must not reach the table. The column is enum-typed, so the database would reject it too -- but it would reject it as an opaque insert failure on a path whose whole job is to report why an identity has no authority.
  it('throws on an entity type outside the declared four, rather than writing a row with an unknown discriminator', async () => {
    const { client, recorded } = recordingClient({ error: null });

    await expect(
      writeEntityGrant(client, {
        userId: USER_ID,
        entityType: 'party' as EntityGrantType,
        entityId: ENTITY_ID
      })
    ).rejects.toMatchObject({ code: 'ERR_ENTITY_GRANT_TYPE_UNKNOWN' });
    expect(recorded.rows).toEqual([]);
    expect(recorded.tables).toEqual([]);
  });
});
