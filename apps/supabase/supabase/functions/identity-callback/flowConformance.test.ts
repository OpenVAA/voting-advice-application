/**
 * Source-level conformance gate over `identity-callback`'s grant write — and over the gap it still carries.
 *
 * This is the IDENTITY ENTRY POINT, not an authorisation gate: it asks no authority question of a claim, it MINTS one. What criterion 7 needs checked here is therefore the other direction — that the grant it writes is one of § 3.1's eight rows, that its entity type reaches the write site as a VALUE rather than as a literal at each site (D-20's margin note, D-21's phase-wide instruction), and that no retired claim vocabulary survives on the path.
 *
 * AND THE GAP IS ASSERTED AS PRESENT, deliberately. D-22 records that entity-type SELECTION is absent at this entry point: the flow writes one entity type and the matrix admits four. 162-06 is prohibited from closing it and defers it to brief § 6.1 by name, so this gate pins the gap rather than pretending it is shut — and it will redden when somebody closes it, which is the moment `162-FLOW-CONFORMANCE.md`'s DEFERRED row stops being true.
 *
 * In the shape of `envReadSites.test.ts`, which sits beside this file and states the reason `index.ts` cannot be imported by vitest. The grant WRITE half is asserted by IMPORT of `entityGrant.ts`, which reaches no remote origin.
 */

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { writeEntityGrant } from './entityGrant.ts';

const INDEX_SOURCE = readFileSync(new URL('./index.ts', import.meta.url), 'utf8');
const GRANT_MODULE_SOURCE = readFileSync(new URL('./entityGrant.ts', import.meta.url), 'utf8');
const ENUM_SOURCE = readFileSync(new URL('../../schema/000-enums.sql', import.meta.url), 'utf8');

/** The 23 permission verbs, derived from the declarative enum declaration at run time. */
function derivePermissionVocabulary(sql: string): Array<string> {
  const block = sql.match(/CREATE TYPE public\.grant_permission AS ENUM\s*\(([\s\S]*?)\);/);
  if (!block) return [];
  return Array.from(block[1].matchAll(/'([^']+)'/g)).map((m) => m[1]);
}

const PERMISSIONS = derivePermissionVocabulary(ENUM_SOURCE);

/** The shape of a permission literal wherever one appears in TypeScript source. */
const PERMISSION_SHAPED = /\b(?:feedback|account|project|entity|nomination)\.[a-z0-9_]+\b/g;

const RETIRED_CLAIM_KEYS = ['user_roles', 'user_role_type', 'role_scope_type'] as const;
const GRANT_SCOPES = ['global', 'account', 'project', 'entity'] as const;
const GRANT_ROLES = ['admin', 'editor'] as const;

describe('identity-callback flow conformance', () => {
  it('derived a 23-member permission vocabulary before any membership assertion uses it', () => {
    expect(PERMISSIONS.length).toBe(23);
  });

  it('read a non-empty index.ts, and it is the module under test', () => {
    expect(INDEX_SOURCE.length).toBeGreaterThan(1000);
    expect(INDEX_SOURCE).toContain('Provider-Agnostic Identity Callback Edge Function');
  });

  it('read a non-empty entityGrant.ts, and it is the module under test', () => {
    expect(GRANT_MODULE_SOURCE.length).toBeGreaterThan(1000);
    expect(GRANT_MODULE_SOURCE).toContain('ENTITY_GRANT_VOCABULARY');
  });

  it('names no permission literal outside the derived enum', () => {
    const named = Array.from(INDEX_SOURCE.matchAll(PERMISSION_SHAPED)).map((m) => m[0]);
    const outside = named.filter((n) => !PERMISSIONS.includes(n));
    expect(outside).toEqual([]);
  });

  it.each(RETIRED_CLAIM_KEYS)('reads no retired claim key: %s', (key) => {
    expect(INDEX_SOURCE).not.toContain(`payload.${key}`);
    expect(INDEX_SOURCE).not.toContain(`['${key}']`);
  });

  it('writes its grant through the extracted module rather than inline', () => {
    expect(INDEX_SOURCE).toContain('writeEntityGrant(');
    expect(INDEX_SOURCE).not.toContain("scope: 'entity'");
  });

  it('writes the grant on BOTH the new-candidate and the existing-candidate branch, so a failed first write is repaired (162-REVIEW WR-06)', () => {
    const branchEnd = INDEX_SOURCE.indexOf('candidateId = candidate.id;\n    }\n');
    const grantAt = INDEX_SOURCE.indexOf('await writeEntityGrant(supabaseAdmin');
    expect(branchEnd).toBeGreaterThan(-1);
    expect(grantAt).toBeGreaterThan(branchEnd);
    expect(INDEX_SOURCE.split('await writeEntityGrant(').length - 1).toBe(1);
  });

  it('writes a grant shape that is one of § 3.1’s eight rows', async () => {
    const written: Array<Record<string, unknown>> = [];
    const client = {
      from: () => ({
        insert: async (row: Record<string, unknown>) => {
          written.push(row);
          return { error: null };
        }
      })
    };
    await writeEntityGrant(client, {
      userId: '00000000-0000-0000-0000-0000000000aa',
      entityType: 'candidate',
      entityId: '00000000-0000-0000-0000-0000000000bb'
    });
    expect(written).toHaveLength(1);
    expect(GRANT_SCOPES).toContain(written[0].scope as (typeof GRANT_SCOPES)[number]);
    expect(GRANT_ROLES).toContain(written[0].role as (typeof GRANT_ROLES)[number]);
    expect(written[0].scope).toBe('entity');
    expect(written[0].role).toBe('editor');
    expect(written[0].target_type).toBe('candidate');
  });

  it('takes the entity type as a VALUE at the write site rather than as a literal (D-20, D-21)', async () => {
    const written: Array<Record<string, unknown>> = [];
    const client = {
      from: () => ({
        insert: async (row: Record<string, unknown>) => {
          written.push(row);
          return { error: null };
        }
      })
    };
    for (const entityType of ['candidate', 'organization', 'faction', 'alliance'] as const) {
      await writeEntityGrant(client, {
        userId: '00000000-0000-0000-0000-0000000000aa',
        entityType,
        entityId: '00000000-0000-0000-0000-0000000000bb'
      });
    }
    expect(written.map((r) => r.target_type)).toEqual(['candidate', 'organization', 'faction', 'alliance']);
    expect(GRANT_MODULE_SOURCE).not.toContain("'candidate'");
  });

  it('a failed grant write THROWS rather than being swallowed (D-20)', async () => {
    const client = {
      from: () => ({
        insert: async () => ({ error: { message: 'boom' } })
      })
    };
    await expect(
      writeEntityGrant(client, {
        userId: '00000000-0000-0000-0000-0000000000aa',
        entityType: 'candidate',
        entityId: '00000000-0000-0000-0000-0000000000bb'
      })
    ).rejects.toThrow(/Grant write failed/);
  });

  /**
   * D-22, PINNED AS OPEN. The entity type is named at exactly ONE call site in this function and nowhere else, and there is no selection of it anywhere on the path — no request field, no parameter, no branch. `162-FLOW-CONFORMANCE.md` records this as DEFERRED with brief § 6.1 as its owner. When the sign-up phase closes it, this assertion reddens, which is the signal that the DEFERRED row has stopped being true and the document needs re-deriving.
   */
  it('still names exactly ONE entity type on the whole path — D-22’s gap, pinned as OPEN', () => {
    const entityTypeArguments = Array.from(INDEX_SOURCE.matchAll(/entityType:\s*'([a-z]+)'/g)).map((m) => m[1]);
    expect(entityTypeArguments).toEqual(['candidate']);
  });
});
