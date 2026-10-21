/**
 * Source-level conformance checks over `identity-callback`'s grant write.
 *
 * This is the IDENTITY ENTRY POINT, not an authorisation gate: it asks no authority question of a claim, it MINTS one. What is checked here is therefore the grant it writes: that the row is an entity-scope editor grant, that the entity type reaches the write site as a VALUE rather than as a literal inside the grant module, that the write happens once after both candidate branches with the new candidate deleted when it fails, and that no claim key outside the grant model is read on the path.
 *
 * The entry point also names exactly one entity type and takes no type selection from the request. That is asserted as present, so the check reddens when a selection is added and the entry point starts creating other entity kinds.
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

/** How many times `needle` occurs in the entry point's source. */
function occurrences(needle: string): number {
  return INDEX_SOURCE.split(needle).length - 1;
}

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

  it.each(RETIRED_CLAIM_KEYS)('reads no claim key outside the grant model: %s', (key) => {
    expect(INDEX_SOURCE).not.toContain(`payload.${key}`);
    expect(INDEX_SOURCE).not.toContain(`['${key}']`);
  });

  it('writes its grant through the extracted module rather than inline', () => {
    expect(INDEX_SOURCE).toContain('writeEntityGrant(');
    expect(INDEX_SOURCE).not.toContain("scope: 'entity'");
  });

  it('writes the grant once, after both candidate branches, and deletes a just-created candidate when that write fails', () => {
    // The grant is the only link from the identity to its candidate, so a candidate created on this request whose grant write failed could never be found again, and the next login would create a second one. The delete sits in the write's catch arm, guarded to the create branch, and runs before the failure is rethrown.
    const branchEnd = INDEX_SOURCE.indexOf('candidateId = candidate.id;\n    }\n');
    const grantAt = INDEX_SOURCE.indexOf('await writeEntityGrant(supabaseAdmin');
    expect(branchEnd).toBeGreaterThan(-1);
    expect(grantAt).toBeGreaterThan(branchEnd);
    expect(occurrences('await writeEntityGrant(')).toBe(1);

    const tryAt = INDEX_SOURCE.lastIndexOf('try {', grantAt);
    expect(tryAt).toBeGreaterThan(branchEnd);

    const catchAt = INDEX_SOURCE.indexOf('catch (grantError)', grantAt);
    const guardAt = INDEX_SOURCE.indexOf('if (!existingCandidate)', catchAt);
    const deleteAt = INDEX_SOURCE.indexOf('await deleteCandidate(supabaseAdmin', guardAt);
    const rethrowAt = INDEX_SOURCE.indexOf('throw grantError', deleteAt);
    expect(catchAt).toBeGreaterThan(grantAt);
    expect(guardAt).toBeGreaterThan(catchAt);
    expect(deleteAt).toBeGreaterThan(guardAt);
    expect(rethrowAt).toBeGreaterThan(deleteAt);
    expect(occurrences('await deleteCandidate(')).toBe(1);
  });

  it('writes an entity-scope editor grant, one of the scope and role pairs the grant model defines', async () => {
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

  it('takes the entity type as a VALUE at the write site rather than as a literal in the grant module', async () => {
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

  it('a failed grant write THROWS rather than being swallowed', async () => {
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
   * The entity type is named at exactly ONE call site in this function and nowhere else, and there is no selection of it anywhere on the path: no request field, no parameter, no branch. When the entry point starts accepting a type selection, this assertion reddens, which is the signal to re-derive the checks in this file for every entity kind it can then create.
   */
  it('names exactly ONE entity type on the whole path and takes no type selection from the request', () => {
    const entityTypeArguments = Array.from(INDEX_SOURCE.matchAll(/entityType:\s*'([a-z]+)'/g)).map((m) => m[1]);
    expect(entityTypeArguments).toEqual(['candidate']);
  });
});
