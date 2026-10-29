/**
 * Source-level conformance checks over `identity-callback`'s path.
 *
 * This is the IDENTITY ENTRY POINT, not an authorisation gate on a claim: it decides from the project's stored matrix which entity type may be created, creates the account the passwordless way, and has one database function find or create the identity's entity and its grant. What is checked here is the shape of that path: the frontend server's credential is checked before anything else is read, and the frontend's callback sends it under the header the function reads; the project is the one the request names; no account is created by a call that stores a password; no admin update carries an address, and the only confirmation is of the placeholder the identity's account was created on; every `app_metadata` written is built by `identityAppMetadata`, so no claim of the provider's token is spread into it; the matrix decides before anything is written; the account is resolved, then the entity is found or created with the decided type, then `app_metadata` is written, then the sign-in link is generated; and every answer is built by `resultBody`.
 *
 * `index.ts` cannot be imported by vitest (see `envReadSites.test.ts`), so these checks read its source with the comments stripped: the comments describe the path in the same words the checks look for. The entity, its grant and the record are written by `public.identity_entity_find_or_create`, whose own pgTAP file asserts them.
 */

import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { SERVER_CREDENTIAL_HEADER } from './serverCredential.ts';

const RAW_INDEX_SOURCE = readFileSync(new URL('./index.ts', import.meta.url), 'utf8');
const ENUM_SOURCE = readFileSync(new URL('../../schema/000-enums.sql', import.meta.url), 'utf8');
const CALLBACK_SOURCE = readFileSync(
  new URL('../../../../frontend/src/routes/api/oidc/callback/+server.ts', import.meta.url),
  'utf8'
);

/** The source without block comments and without whole-line `//` comments. */
function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .filter((line) => !/^\s*\/\//.test(line))
    .join('\n');
}

const CODE = stripComments(RAW_INDEX_SOURCE);

/** The 23 permission verbs, derived from the declarative enum declaration at run time. */
function derivePermissionVocabulary(sql: string): Array<string> {
  const block = sql.match(/CREATE TYPE public\.grant_permission AS ENUM\s*\(([\s\S]*?)\);/);
  if (!block) return [];
  return Array.from(block[1].matchAll(/'([^']+)'/g)).map((m) => m[1]);
}

const PERMISSIONS = derivePermissionVocabulary(ENUM_SOURCE);

/** The shape of a permission literal wherever one appears in TypeScript source: a quoted string, so a property read such as `account.id` is not one. */
const PERMISSION_SHAPED = /(?<=['"`])(?:feedback|account|project|entity|nomination)\.[a-z0-9_]+(?=['"`])/g;

const RETIRED_CLAIM_KEYS = ['user_roles', 'user_role_type', 'role_scope_type'] as const;

/** How many times `needle` occurs in the code. */
function occurrences(needle: string): number {
  return CODE.split(needle).length - 1;
}

/** Every position at which `needle` occurs in the code. */
function positions(needle: string): Array<number> {
  const found: Array<number> = [];
  let at = CODE.indexOf(needle);
  while (at !== -1) {
    found.push(at);
    at = CODE.indexOf(needle, at + needle.length);
  }
  return found;
}

/**
 * The argument text of every call of `callee`, from its opening parenthesis to the one that closes it.
 *
 * Bracket-balanced and aware of quoted strings, so an argument object spanning several lines is read whole.
 */
function callArguments(callee: string): Array<string> {
  return positions(`${callee}(`).map((start) => {
    const open = start + callee.length;
    let depth = 0;
    let quote: string | null = null;
    for (let index = open; index < CODE.length; index++) {
      const char = CODE[index];
      if (quote) {
        if (char === '\\') index++;
        else if (char === quote) quote = null;
        continue;
      }
      if (char === "'" || char === '"' || char === '`') quote = char;
      else if (char === '(' || char === '{' || char === '[') depth++;
      else if (char === ')' || char === '}' || char === ']') {
        depth--;
        if (depth === 0) return CODE.slice(open + 1, index);
      }
    }
    return CODE.slice(open + 1);
  });
}

/** The first position of `needle` in the code, asserted present. */
function firstAt(needle: string): number {
  const at = CODE.indexOf(needle);
  expect(at, `${needle} not found in index.ts`).toBeGreaterThan(-1);
  return at;
}

/** The function's modules other than its tests, each with its comments stripped. */
const MODULE_CODE: Record<string, string> = Object.fromEntries(
  readdirSync(new URL('./', import.meta.url))
    .filter((name) => name.endsWith('.ts') && !name.endsWith('.test.ts'))
    .map((name) => [name, stripComments(readFileSync(new URL(`./${name}`, import.meta.url), 'utf8'))])
);

/**
 * The exported values the function's own code does not use, by module, each with the reason it stays exported.
 *
 * `isPlaceholderAddress` is a member of a copy that `placeholderAddress.test.ts` holds equal to `account-access`'s and the frontend's.
 */
const EXPORTS_HELD_FOR_PARITY: Readonly<Record<string, ReadonlyArray<string>>> = {
  'placeholderAddress.ts': ['isPlaceholderAddress']
};

/** Every exported function, constant and class of the function's modules, by module. */
const EXPORTED_VALUES: Array<{ module: string; name: string }> = Object.entries(MODULE_CODE).flatMap(([module, code]) =>
  Array.from(code.matchAll(/^export (?:async )?(?:function|const|let|class)\s+([A-Za-z_$][\w$]*)/gm))
    .map((match) => ({ module, name: match[1] }))
    .filter(({ name }) => !(EXPORTS_HELD_FOR_PARITY[module] ?? []).includes(name))
);

describe('identity-callback modules', () => {
  it('were read, and export values', () => {
    expect(Object.keys(MODULE_CODE)).toContain('index.ts');
    expect(Object.keys(MODULE_CODE)).toContain('ownEntity.ts');
    expect(EXPORTED_VALUES.length).toBeGreaterThan(10);
  });

  it.each(EXPORTED_VALUES)('export no value the function does not use: $name of $module', ({ module, name }) => {
    const reference = new RegExp(`(?<![\\w$])${name.replace(/\$/g, '\\$')}(?![\\w$])`, 'g');
    const uses = Object.values(MODULE_CODE).reduce((count, code) => count + (code.match(reference)?.length ?? 0), 0);
    expect(uses, `${name} of ${module} is named nowhere but in its own declaration`).toBeGreaterThan(1);
  });
});

describe('identity-callback flow conformance', () => {
  it('derived a 23-member permission vocabulary before any membership assertion uses it', () => {
    expect(PERMISSIONS.length).toBe(23);
  });

  it('read a non-empty index.ts, and it is the module under test', () => {
    expect(RAW_INDEX_SOURCE.length).toBeGreaterThan(1000);
    expect(RAW_INDEX_SOURCE).toContain('Provider-Agnostic Identity Callback Edge Function');
    expect(CODE).toContain('Deno.serve(');
    expect(CODE.length).toBeGreaterThan(5000);
  });

  describe('the caller', () => {
    it('is checked before the request body, the provider configuration or the token is read', () => {
      const credentialAt = firstAt('presentsServerCredential(');
      for (const later of ['req.json()', "requireEnv('IDENTITY_PROVIDER_TYPE'", 'parseIdentityCallbackRequest(']) {
        expect(firstAt(later), `${later} comes before the credential check`).toBeGreaterThan(credentialAt);
      }
    });

    it('is refused at once without the header, before the configured secret is read', () => {
      const headerAt = firstAt('req.headers.get(SERVER_CREDENTIAL_HEADER)');
      const secretAt = firstAt("requireEnv('IDENTITY_CALLBACK_SERVER_SECRET'");
      const refusalAt = CODE.indexOf('return respond(IDENTITY_CALLBACK_RESULT.refused);', headerAt);
      expect(refusalAt).toBeGreaterThan(headerAt);
      expect(refusalAt).toBeLessThan(secretAt);
    });

    it('is refused when the header does not carry the configured secret', () => {
      const credentialAt = firstAt('presentsServerCredential(');
      expect(callArguments('presentsServerCredential')).toHaveLength(1);
      const refusalAt = CODE.indexOf('return respond(IDENTITY_CALLBACK_RESULT.refused);', credentialAt);
      expect(refusalAt).toBeGreaterThan(credentialAt);
      expect(refusalAt).toBeLessThan(firstAt('req.json()'));
    });

    it('is not offered the credential header by the CORS answer', () => {
      const corsAt = firstAt('const corsHeaders = {');
      const corsBlock = CODE.slice(corsAt, CODE.indexOf('};', corsAt));
      expect(corsBlock).not.toContain(SERVER_CREDENTIAL_HEADER);
    });

    it("is the frontend's callback, which sends the credential under the header the function reads", () => {
      expect(CALLBACK_SOURCE).toContain(`'${SERVER_CREDENTIAL_HEADER}': `);
      expect(CALLBACK_SOURCE).toContain('constants.IDENTITY_CALLBACK_SERVER_SECRET');
    });
  });

  describe('the request', () => {
    it('names the project, and no other source of a project is read', () => {
      expect(CODE).toContain('const projectId = request.projectId;');
      expect(CODE).not.toContain('PUBLIC_PROJECT_ID');
    });

    it('is answered with the token alone, never with a whole sign-in link', () => {
      expect(CODE).toContain('function respond(result: IdentityCallbackResult, token?: string): Response {');
      expect(CODE).not.toMatch(/session\s*:/);
      expect(CODE).not.toMatch(/action_link\s*:/);
    });
  });

  it('names no permission literal outside the derived enum', () => {
    const named = Array.from(CODE.matchAll(PERMISSION_SHAPED)).map((m) => m[0]);
    const outside = named.filter((n) => !PERMISSIONS.includes(n));
    expect(outside).toEqual([]);
  });

  it.each(RETIRED_CLAIM_KEYS)('reads no claim key outside the grant model: %s', (key) => {
    expect(CODE).not.toContain(`payload.${key}`);
    expect(CODE).not.toContain(`['${key}']`);
  });

  describe('the account', () => {
    it('is never created by createUser, which always stores a password', () => {
      expect(CODE).not.toMatch(/\.createUser\s*\(/);
      expect(CODE).not.toContain('createUser');
    });

    it('is created by an invite for the placeholder of the match value', () => {
      const invites = callArguments('generateLink').filter((args) => args.includes("type: 'invite'"));
      expect(invites).toHaveLength(1);
      expect(invites[0]).toMatch(/email:\s*placeholderAddress\b/);
      expect(CODE).toContain('const placeholderAddress = placeholderAddressFor(matchValue);');
    });

    it('passes no address to any admin update', () => {
      const updates = callArguments('updateUserById');
      expect(updates.length).toBeGreaterThan(0);
      for (const args of updates) {
        expect(args).not.toMatch(/(^|[^A-Za-z0-9_])email\s*:/);
        expect(args).not.toMatch(/[{,]\s*email\s*[,}]/);
      }
    });

    it('finds the account on its placeholder whatever the case of the stored address', () => {
      const lookup = CODE.slice(CODE.indexOf('function findUserByPlaceholderAddress('));
      expect(lookup.slice(0, lookup.indexOf('\n}\n'))).toContain(
        'findUser(supabaseAdmin, (user) => holdsPlaceholderAddress(user, placeholderAddress))'
      );
      expect(CODE).not.toMatch(/user\.email\s*===/);
    });

    it('looks the account up on its placeholder whenever the invite fails, so a request that lost the race to create it goes on with it', () => {
      const inviteAt = firstAt("type: 'invite'");
      const lookupAt = CODE.indexOf(
        'account = inviteError ? await findUserByPlaceholderAddress(supabaseAdmin, placeholderAddress) : invited?.user;',
        inviteAt
      );
      expect(lookupAt).toBeGreaterThan(inviteAt);
      const createFailureAt = CODE.indexOf("throw failure('ERR_ACCOUNT_CREATE_FAILED'", inviteAt);
      expect(createFailureAt).toBeGreaterThan(lookupAt);
      expect(CODE.slice(lookupAt, createFailureAt)).toContain('if (inviteError && !account)');
      expect(CODE).not.toContain("inviteError.code !== 'email_exists'");
    });

    it('finishes an account no request has finished yet, and refuses one of another identity', () => {
      const setupAt = firstAt('existingAccountSetup(account.app_metadata, matchValue)');
      expect(setupAt).toBeLessThan(firstAt('email_confirm: true'));
      expect(CODE).toMatch(/setup\.kind === 'refuse'/);
      expect(CODE).toContain("initialise = setup.kind === 'initialise';");
    });

    it('confirms exactly once, in the one admin update, and only for an account it finishes', () => {
      expect(occurrences('email_confirm')).toBe(1);
      expect(occurrences('email_confirm: true')).toBe(1);
      expect(callArguments('updateUserById')).toHaveLength(1);
      expect(callArguments('updateUserById')[0]).toContain('...(initialise ? { email_confirm: true } : {})');
    });
  });

  describe('app_metadata', () => {
    it('is written only as a call of identityAppMetadata', () => {
      const values = Array.from(CODE.matchAll(/app_metadata\s*:\s*([^\s,}]+)/g)).map((m) => m[1]);
      expect(values.length).toBeGreaterThan(0);
      for (const value of values) expect(value.startsWith('identityAppMetadata(')).toBe(true);
    });

    it('never carries the registered-entities record, which the find-or-create alone writes', () => {
      const writes = callArguments('identityAppMetadata');
      expect(writes.length).toBeGreaterThan(0);
      for (const args of writes) expect(args).not.toContain('registeredEntities');
    });

    it('never receives a spread of the claims or of the token', () => {
      expect(CODE).not.toMatch(/\.\.\.\s*(claims|extraClaims|extractedClaims|payload|claimResult)\b/);
      expect(CODE).not.toMatch(/extraClaims|extractedClaims/);
    });
  });

  describe('the order', () => {
    it('decides the entity type from the matrix before any account or row is written', () => {
      const decidedAt = firstAt('resolveEntityType(');
      for (const call of ['generateLink(', 'updateUserById(', "rpc('identity_entity_find_or_create'"]) {
        const first = CODE.indexOf(call);
        expect(first, `${call} is not called`).toBeGreaterThan(-1);
        expect(first, `${call} comes before resolveEntityType`).toBeGreaterThan(decidedAt);
      }
      expect(CODE).toMatch(
        /if \('refused' in decision\) return respond\(IDENTITY_CALLBACK_RESULT\.mode_not_allowed\);/
      );
    });

    it('resolves the account, then finds or creates the entity, then writes app_metadata, then generates the link', () => {
      const serveAt = firstAt('Deno.serve(');
      const accountAt = CODE.indexOf('findUserByIdentityMatch(supabaseAdmin, matchValue)', serveAt);
      const inviteAt = firstAt("type: 'invite'");
      const entityAt = firstAt("rpc('identity_entity_find_or_create'");
      const metadataAt = firstAt('updateUserById(');
      const currentAt = firstAt('getUserById(');
      const linkAt = firstAt("type: 'magiclink'");

      expect(occurrences("rpc('identity_entity_find_or_create'")).toBe(1);
      expect(occurrences('.rpc(')).toBe(1);
      expect(accountAt).toBeGreaterThan(serveAt);
      expect(inviteAt).toBeGreaterThan(accountAt);
      expect(entityAt).toBeGreaterThan(inviteAt);
      expect(metadataAt).toBeGreaterThan(entityAt);
      expect(currentAt).toBeGreaterThan(metadataAt);
      expect(linkAt).toBeGreaterThan(currentAt);

      const links = callArguments('generateLink').filter((args) => args.includes("type: 'magiclink'"));
      expect(links).toHaveLength(1);
      expect(links[0]).toMatch(/email:\s*currentAddress\b/);
    });

    it('throws when the find-or-create reports an error, and reads its answer through findOrCreateOutcome', () => {
      const entityAt = firstAt("rpc('identity_entity_find_or_create'");
      const throwAt = CODE.indexOf("if (entityError) throw failure('ERR_ENTITY_RESOLVE_FAILED'", entityAt);
      const readAt = CODE.indexOf('findOrCreateOutcome(entityAnswer, projectId, entityType)', entityAt);
      expect(throwAt).toBeGreaterThan(entityAt);
      expect(readAt).toBeGreaterThan(throwAt);
      expect(readAt).toBeLessThan(firstAt('updateUserById('));
    });

    it.each([
      'resolveOwnEntity(',
      'createCandidate(',
      'createOrganization(',
      'writeEntityGrant(',
      'deleteCandidate(',
      'deleteOrganization('
    ])('calls no separate lookup, insert, grant write or compensating delete: %s', (call) => {
      expect(CODE).not.toContain(call);
    });
  });

  describe('the entity type', () => {
    it('reaches the find-or-create as the decided value, never as a literal', () => {
      expect(CODE).toContain('const entityType = decision.entityType;');
      const calls = callArguments('supabaseAdmin.rpc');
      expect(calls).toHaveLength(1);
      expect(calls[0]).toMatch(/p_entity_type:\s*entityType\s*[,}]/);
    });

    it('is never named as a literal argument anywhere on the path', () => {
      expect(Array.from(CODE.matchAll(/entityType:\s*'([a-z]+)'/g)).map((m) => m[1])).toEqual([]);
      expect(Array.from(CODE.matchAll(/p_entity_type:\s*'([a-z]+)'/g)).map((m) => m[1])).toEqual([]);
    });

    it("hands the find-or-create the account, the request's project and the names read from the token", () => {
      const [args] = callArguments('supabaseAdmin.rpc');
      expect(args).toMatch(/p_user_id:\s*userId\s*,/);
      expect(args).toMatch(/p_project_id:\s*projectId\s*,/);
      expect(args).toMatch(/p_first_name:\s*firstName\s*,/);
      expect(args).toMatch(/p_last_name:\s*lastName\s*[,}]/);
    });
  });

  describe('the answers', () => {
    it('builds every answer body with resultBody, in one place', () => {
      expect(occurrences('new Response(')).toBe(2);
      expect(occurrences("new Response('ok'")).toBe(1);
      expect(occurrences('JSON.stringify(')).toBe(1);

      const respondAt = firstAt('function respond(');
      const respondEnd = CODE.indexOf('\n}\n', respondAt);
      const respondBody = CODE.slice(respondAt, respondEnd);
      expect(respondBody).toContain('resultBody(result, token)');
      expect(respondBody).toContain('new Response(JSON.stringify(');
      expect(respondBody).toContain('resultStatus(result)');
    });

    it('tells a configuration failure from an outage by its code alone', () => {
      expect(CODE).toMatch(
        /isConfigurationFailure\(e\) \? IDENTITY_CALLBACK_RESULT\.configuration : IDENTITY_CALLBACK_RESULT\.unavailable/
      );
      for (const code of ['ERR_ENV_UNCONFIGURED', 'ERR_AUDIENCE_UNCONFIGURED', 'ERR_ISSUER_UNCONFIGURED']) {
        expect(CODE).toContain(`'${code}'`);
      }
    });

    it('answers every refusal and failure through respond, with no message of its own', () => {
      expect(CODE).not.toMatch(/error:\s*'[^']*'/);
      expect(CODE).not.toContain('Internal server error');
    });
  });

  it('writes no grant and no entity row itself', () => {
    expect(CODE).not.toContain("from('grants')");
    expect(CODE).not.toContain("from('candidates')");
    expect(CODE).not.toContain("from('organizations')");
    expect(CODE).not.toContain("scope: 'entity'");
  });
});
