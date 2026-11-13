/**
 * Source-level conformance checks over `identity-callback`'s path.
 *
 * This is the IDENTITY ENTRY POINT, not an authorisation gate on a claim: it decides from the project's stored matrix which entity type may be created, creates the account the passwordless way, and has one database function find or create the identity's entity and its grant. What is checked here is the shape of that path: the frontend server's credential is checked before anything else is read, and the frontend's callback sends it under the header the function reads; the project is the one the request names; no account is created by a call that stores a password; no admin update carries an address or `app_metadata`, and the only admin update confirms the placeholder the identity's account was created on; the identity metadata is built by `identityAppMetadata`, so no claim of the provider's token is spread into it, and is handed to the database function, which writes it under the same lock as the record; the matrix decides before anything is written; the account is resolved, then the entity is found or created with the decided type and the metadata written, then the placeholder is confirmed, then the sign-in link is generated; and every answer is built by `resultBody`.
 *
 * `index.ts` cannot be imported by vitest (see `envReadSites.test.ts`), so these checks read its source with the comments stripped: the comments describe the path in the same words the checks look for. The entity, its grant and the record are written by `public.identity_entity_find_or_create`, whose own pgTAP file asserts them.
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

/** How many times `needle` occurs in the code. */
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
