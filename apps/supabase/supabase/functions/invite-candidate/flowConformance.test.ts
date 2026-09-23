/**
 * Source-level conformance gate over `invite-candidate`'s authority decisions.
 *
 * ROADMAP criterion 7 asks for the two flows to be CHECKED against the § 3 matrix rather than assumed compatible with it. `162-FLOW-CONFORMANCE.md` is the written half of that check; this file is the half that runs on every build, so a later change to the gate reddens rather than quietly diverging from a document nobody re-reads.
 *
 * In the shape of `identity-callback/envReadSites.test.ts`, and for the same stated reason: `index.ts` cannot be imported by vitest because it resolves `https://esm.sh/@supabase/supabase-js@2`, a Deno-only remote specifier, so the properties below are asserted against the module's SOURCE TEXT — the way this repository already gates call shapes it cannot execute. The grant WRITE is different: 162-06 extracted it into `entityGrant.ts`, which reaches no remote origin, so that half is asserted by IMPORT rather than by text. A property that can be asserted by import is better asserted that way.
 *
 * THE PERMISSION VOCABULARY IS DERIVED, NEVER TRANSCRIBED — and so are § 3.1's four grant scopes and two role levels (162-REVIEW WR-03). All three are read out of the declarative enum source at `schema/000-enums.sql`. Deriving them keeps this file from becoming a second copy of § 3.2, which is the thing phase 162 exists to end — and reading them as TEXT rather than importing the generated types is why this gate adds no workspace dependency.
 *
 * WHAT THE SIZE PINS ACTUALLY GUARD (162-REVIEW WR-05). This docblock used to claim the 23-pin existed "because a vocabulary that came back empty would make every `toContain`-style membership check below pass for everything." That is the OPPOSITE of what happens: with `PERMISSIONS === []`, `expect(outside).toEqual([])` fails (every named literal becomes "outside") and `expect(PERMISSIONS).toContain('project.edit_entities')` fails too. An empty derivation reddens loudly on its own. What the pins guard is a PARTIAL derivation — a regex that still matches but stops short, so a legitimate literal reads as a non-member and the file reports a confusing "permission outside the enum" rather than the parse failure that caused it. The pin turns that into one named red at the source.
 *
 * AND "BEFORE" IS NOW TRUE. The pins used to sit in peer `it` blocks, which vitest runs alongside the assertions they claim to precede rather than as a precondition of them; a failed derivation did not stop the rest of the file executing. The `beforeAll` below throws, which aborts the whole describe — so every membership assertion in this file genuinely runs only on a vocabulary that parsed. The named `it` guards are kept for readability, and because a thrown `beforeAll` reports the abort rather than the invariant.
 *
 * TIGHTENED BY 162-18. Until then this file asserted that the gate was PRESENT but nothing about its answer being USED: replacing the refusal condition with a constant false left every test here green. 162-18 added four assertions — the membership check is not vacuous, the gate is the shared module's and not a local shadow, the refusal is conditioned on the gate's answer and precedes the service-role client, and the RPC binds to the parameter names `user_can` declares — and recorded a planted control reddening each one in `evidence/162-18/flow-controls.txt`.
 */

import { readFileSync } from 'node:fs';
import { beforeAll, describe, expect, it } from 'vitest';
import { callerMayOnProject } from './callerAuthority.ts';
import { writeEntityGrant } from './entityGrant.ts';
import type { RpcClient } from './callerAuthority.ts';

const INDEX_SOURCE = readFileSync(new URL('./index.ts', import.meta.url), 'utf8');
const GRANT_MODULE_SOURCE = readFileSync(new URL('./entityGrant.ts', import.meta.url), 'utf8');
const ENUM_SOURCE = readFileSync(new URL('../../schema/000-enums.sql', import.meta.url), 'utf8');
const AUTH_FUNCTIONS_SOURCE = readFileSync(new URL('../../schema/301-auth-functions.sql', import.meta.url), 'utf8');

/**
 * The 23 permission verbs, derived from the declarative enum declaration at run time.
 *
 * Parsed out of `CREATE TYPE public.grant_permission AS ENUM( … );` — the one place the vocabulary is written down in this repository, and the one `scripts/assert-grant-permission-enum.mjs` already holds a committed canon against.
 */
function derivePermissionVocabulary(sql: string): Array<string> {
  const block = sql.match(/CREATE TYPE public\.grant_permission AS ENUM\s*\(([\s\S]*?)\);/);
  if (!block) return [];
  return Array.from(block[1].matchAll(/'([^']+)'/g)).map((m) => m[1]);
}

const PERMISSIONS = derivePermissionVocabulary(ENUM_SOURCE);

/** The four grant scopes, derived from `CREATE TYPE public.grant_scope_type AS ENUM( … );` in the same way as the permission vocabulary. */
function deriveScopeVocabulary(sql: string): Array<string> {
  const block = sql.match(/CREATE TYPE public\.grant_scope_type AS ENUM\s*\(([\s\S]*?)\);/);
  if (!block) return [];
  return Array.from(block[1].matchAll(/'([^']+)'/g)).map((m) => m[1]);
}

/** The two grant role levels, derived from `CREATE TYPE public.grant_role_type AS ENUM( … );` in the same way. */
function deriveRoleVocabulary(sql: string): Array<string> {
  const block = sql.match(/CREATE TYPE public\.grant_role_type AS ENUM\s*\(([\s\S]*?)\);/);
  if (!block) return [];
  return Array.from(block[1].matchAll(/'([^']+)'/g)).map((m) => m[1]);
}

/**
 * The parameter names `public.user_can` declares, parsed from its `CREATE OR REPLACE FUNCTION` header: the first identifier of each comma-separated entry before `) RETURNS`.
 *
 * PostgREST resolves an RPC by its NAMED arguments, so these names — not the argument order — are the contract `callerMayOnProject` has to meet.
 */
function deriveUserCanParameters(sql: string): Array<string> {
  const block = sql.match(/CREATE OR REPLACE FUNCTION public\.user_can\s*\(([\s\S]*?)\)\s*RETURNS/);
  if (!block) return [];
  return block[1]
    .split(',')
    .map((entry) => entry.trim().match(/^([a-z_][a-z0-9_]*)/i)?.[1])
    .filter((name): name is string => typeof name === 'string');
}

/** The shape of a permission literal wherever one appears in TypeScript source. */
const PERMISSION_SHAPED = /\b(?:feedback|account|project|entity|nomination)\.[a-z0-9_]+\b/g;

/**
 * `index.ts` with its comments removed, for the assertions that must measure CODE.
 *
 * 162-REVIEW WR-02: `PERMISSION_SHAPED` applied to the raw file text matches PROSE as readily as source. Of the three `project.edit_entities` occurrences in `invite-candidate/index.ts`, two are in the comment block above the gate and only the third is executable, so the "not vacuous" guard below would have stayed green against a module that named no permission in code at all — and a guard satisfiable by a comment guards nothing.
 *
 * The NEGATIVE check (`names no permission literal outside the derived enum`) keeps reading the raw text on purpose: a permission named only in prose, and not a member of the 23, is a documentation defect this file should still catch.
 */
const CODE_ONLY = INDEX_SOURCE.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

/**
 * Claim keys the retired authority model used. A module reading any of these is reading a vocabulary the access-token hook no longer emits, which fails OPEN in the worst case: `payload.user_roles || []` evaluates to the empty list and the gate silently denies everyone, or worse, a fallback admits them.
 */
const RETIRED_CLAIM_KEYS = ['user_roles', 'user_role_type', 'role_scope_type'] as const;

/**
 * § 3.1's grant vocabulary: the four scopes and the two role levels — DERIVED, like the permission vocabulary above, and for the same reason.
 *
 * 162-REVIEW WR-03: these two were hand-transcribed (`['global', 'account', 'project', 'entity']`, `['admin', 'editor']`) in the file whose own headline invariant is THE PERMISSION VOCABULARY IS DERIVED, NEVER TRANSCRIBED. The grant-shape assertion below checked against the transcribed copy, so a change to `public.grant_scope_type` or `public.grant_role_type` could not redden it, and `deriveScopeVocabulary` — which already existed — was used only once, in an unrelated test. Both are now read out of `schema/000-enums.sql`, the one place either vocabulary is written down.
 */
const GRANT_SCOPES = deriveScopeVocabulary(ENUM_SOURCE);
const GRANT_ROLES = deriveRoleVocabulary(ENUM_SOURCE);

describe('invite-candidate flow conformance', () => {
  // THE PRECONDITION, ENFORCED AS ONE (162-REVIEW WR-05). Throwing here aborts the describe, so no membership assertion below can run against a vocabulary that failed to parse -- which is what the docblock's "BEFORE any membership assertion uses it" has always claimed and what peer `it` guards could not deliver.
  beforeAll(() => {
    if (PERMISSIONS.length !== 23) {
      throw new Error(
        `derivePermissionVocabulary parsed ${PERMISSIONS.length} members out of schema/000-enums.sql, expected 23 -- every membership assertion below would measure a vocabulary that is not the enum's`
      );
    }
    if (GRANT_SCOPES.length !== 4 || GRANT_ROLES.length !== 2) {
      throw new Error(
        `derive{Scope,Role}Vocabulary parsed ${GRANT_SCOPES.length} scopes and ${GRANT_ROLES.length} role levels out of schema/000-enums.sql, expected 4 and 2`
      );
    }
  });

  it('derived a 23-member permission vocabulary before any membership assertion uses it', () => {
    expect(PERMISSIONS.length).toBe(23);
    expect(PERMISSIONS).toContain('project.edit_entities');
  });

  it('derived § 3.1’s grant vocabulary too — four scopes and two role levels, from the same enum source (162-REVIEW WR-03)', () => {
    // SIZE only, exactly as `PERMISSIONS` is pinned at 23 above — deliberately NOT the member names, which would be the second transcription this file exists to end. The members come out of `000-enums.sql` at run time; these two lines are what proves the parse reached both declarations rather than returning the empty list its `if (!block) return []` arm produces on a miss, and the VALUES are bound where they are used, against the derived lists (`toContain('entity')` / `toContain('editor')` at the grant-shape assertion below).
    expect(GRANT_SCOPES).toHaveLength(4);
    expect(GRANT_ROLES).toHaveLength(2);
  });

  it('read a non-empty index.ts, and it is the module under test', () => {
    expect(INDEX_SOURCE.length).toBeGreaterThan(1000);
    expect(INDEX_SOURCE).toContain('Forbidden: caller may not create candidates in this project');
  });

  it('read a non-empty entityGrant.ts, and it is the module under test', () => {
    expect(GRANT_MODULE_SOURCE.length).toBeGreaterThan(1000);
    expect(GRANT_MODULE_SOURCE).toContain('ENTITY_GRANT_VOCABULARY');
  });

  it('names at least one permission literal IN CODE, so the membership assertion below is not vacuous', () => {
    // Guards a membership check over an EMPTY match list, which passes for every source: without this, a gate that named no permission at all would satisfy the test below.
    //
    // Measured over `CODE_ONLY` rather than the raw text (162-REVIEW WR-02): two of this module's three `project.edit_entities` occurrences are prose in the comment above the gate, so the raw form was satisfiable by a comment.
    const named = Array.from(CODE_ONLY.matchAll(PERMISSION_SHAPED)).map((m) => m[0]);
    expect(named.length).toBeGreaterThan(0);
    expect(named).toContain('project.edit_entities');
  });

  it('names no permission literal outside the derived enum', () => {
    const named = Array.from(INDEX_SOURCE.matchAll(PERMISSION_SHAPED)).map((m) => m[0]);
    const outside = named.filter((n) => !PERMISSIONS.includes(n));
    expect(outside).toEqual([]);
  });

  it.each(RETIRED_CLAIM_KEYS)('reads no retired claim key: %s', (key) => {
    // THE KEY, NOT ONE ACCESS FORM OF IT (162-REVIEW WR-01). These three assertions used to be `not.toContain('payload.' + key)` and `not.toContain("['" + key + "']")`, and the token `payload` does not occur anywhere in this module -- the gate has read no claim at all since CR-05 -- so they could only redden if a future edit reintroduced that exact variable NAME as well as that exact access form. `const claims = decodeTokenPayload(jwt); claims.user_roles` slipped through untouched. Since the module contains none of the three key names in any form, binding the bare name costs nothing and is the assertion the test's own title makes.
    expect(INDEX_SOURCE).not.toContain(key);
  });

  it('asks the database for the authority decision rather than re-deriving it (SPEC section 9, 162-REVIEW CR-05)', () => {
    // The gate this replaced read `payload.grants` and matched (scope, role) pairs in TypeScript -- a second copy of the matrix that admitted an account admin of ANY account and refused a ProjectEditor the matrix grants project.edit_entities. The decision is now one `user_can` call through the caller's own client.
    //
    // AND THE GATE'S ANSWER IS THE SOLE INPUT TO THE REFUSAL (162-REVIEW CR-02). Asserting the call TEXT is present, and locating the assignment by its `const mayInvite = await callerMayOnProject(callerClient` PREFIX, constrains nothing about what else contributes to `mayInvite`: `const mayInvite = (await callerMayOnProject(...)) || body.debugBypass === true` satisfies both (`await X || Y` parses as `(await X) || Y`, so the prefix still matches), names no retired pattern, and leaves all 33 tests across both flow gates green while any authenticated caller posting `{"debugBypass": true}` creates candidates in any project. The WHOLE assignment statement is therefore bound, terminator included, and the number of assignments to the gate variable is pinned at one so a later re-assignment cannot widen it either.
    expect(INDEX_SOURCE).toContain("callerMayOnProject(callerClient, projectId, 'project.edit_entities')");
    expect(INDEX_SOURCE).toMatch(
      /\n\s*const mayInvite = await callerMayOnProject\(callerClient, projectId, 'project\.edit_entities'\);\n/
    );
    expect(INDEX_SOURCE.split(/\bmayInvite\s*=/).length - 1).toBe(1);
    expect(INDEX_SOURCE).not.toContain('payload.grants');
    expect(INDEX_SOURCE).not.toMatch(/g\.scope\s*===/);
    expect(INDEX_SOURCE).not.toMatch(/g\.role\s*===/);
  });

  it('takes its gate from the shared callerAuthority module and declares none of its own', () => {
    // Guards a LOCAL SHADOW of the helper (162-REVIEW CR-05): a same-named function declared in index.ts would satisfy every call-shape assertion here while answering whatever it likes.
    expect(INDEX_SOURCE).toContain("import { callerMayOnProject } from './callerAuthority.ts';");
    expect(INDEX_SOURCE).not.toMatch(/\bfunction\s*\*?\s*callerMayOnProject\b/);
    expect(INDEX_SOURCE).not.toMatch(/\b(?:const|let|var)\s+callerMayOnProject\b/);
  });

  it('refuses on the answer of the gate, with a 403 it RETURNS, before the service-role client exists', () => {
    // Guards an IGNORED answer (162-REVIEW CR-05): before 162-18, a refusal condition replaced with a constant false left this whole file green, because nothing asserted the gate's result reached the refusal.
    //
    // AND A DISCARDED ONE (162-REVIEW CR-01). Until this assertion the refusal was pinned as five independent `indexOf` hits asserted to occur IN ORDER, which says nothing about the branch terminating the request: deleting the one word `return` in front of `new Response` -- the 403 constructed, thrown away, execution falling straight through to the service-role client below -- left all 17 tests here green while a caller holding no grant at all created a candidate, was issued an auth user and was written an entity grant. That is the likelier regression than the constant-false condition 162-18 already caught, and lexical ordering cannot see it. The refusal is therefore matched as ONE CONTIGUOUS BLOCK whose `new Response` is `return`ed, and the service-role client is required to come after the block ENDS rather than after it begins.
    const refusal = INDEX_SOURCE.match(/if \(!mayInvite\) \{\s*return new Response\(([\s\S]*?)\);\s*\}/);
    expect(refusal).not.toBeNull();
    expect(refusal![1]).toContain('status: 403');
    expect(refusal![1]).toContain('Forbidden: caller may not create candidates in this project');
    const gateAt = INDEX_SOURCE.indexOf('const mayInvite = await callerMayOnProject(callerClient');
    expect(gateAt).toBeGreaterThan(-1);
    expect(refusal!.index!).toBeGreaterThan(gateAt);
    const adminAt = INDEX_SOURCE.indexOf('SUPABASE_SERVICE_ROLE_KEY');
    expect(adminAt).toBeGreaterThan(refusal!.index! + refusal![0].length);
  });

  it('asks the gate through the CALLER client, never the service-role client', () => {
    // A service-role token carries no grants claim, so user_can would describe the service role rather than the caller.
    expect(INDEX_SOURCE).not.toMatch(/callerMayOnProject\(\s*supabaseAdmin/);
    const gateAt = INDEX_SOURCE.indexOf('callerMayOnProject(callerClient');
    const adminAt = INDEX_SOURCE.indexOf('SUPABASE_SERVICE_ROLE_KEY');
    expect(gateAt).toBeGreaterThan(-1);
    expect(adminAt).toBeGreaterThan(gateAt);
  });

  it('rolls back the invited auth user as well as the candidate, and treats a failed link as fatal (162-REVIEW WR-07)', () => {
    expect(INDEX_SOURCE).toContain('supabaseAdmin.auth.admin.deleteUser(userId)');
    // Both failure arms after the invite was sent use the full rollback.
    expect(INDEX_SOURCE.split('await rollbackInvite(supabaseAdmin').length - 1).toBe(2);
    expect(INDEX_SOURCE).not.toContain("Log but don't fail");
    expect(INDEX_SOURCE).toContain('Failed to link the invited user to the candidate record');
  });

  it('names the invited identity as a CANDIDATE entity at the one write site in the flow (D-20, D-21)', () => {
    // THIS IS THE FLOW'S OWN CALL SITE, and until 162-REVIEW CR-03 nothing in this file reached it. The two tests below drive `writeEntityGrant` with arguments THIS FILE constructs, so they measure `entityGrant.ts` in isolation -- which `entityGrant.test.ts` already does, more completely -- and say nothing about what `index.ts` passes. Rewriting the call to `entityType: 'organization', entityId: projectId` left all 17 tests here green while every invited candidate was granted `(entity, organization, <projectId>)`: a grant row pointing at a target that is not an organization at all, and an invited principal unable to edit their own record. The sibling gate `identity-callback/flowConformance.test.ts` already carried this shape (`writes its grant through the extracted module rather than inline`); it was simply not applied here.
    //
    // `162-FLOW-CONFORMANCE.md` invite row 13 cites THIS test for § 3.1 row 5 `(entity, candidate, id, editor)`.
    expect(INDEX_SOURCE).toMatch(
      /await writeEntityGrant\(supabaseAdmin, \{\s*userId: inviteData\.user\.id,\s*entityType: 'candidate',\s*entityId: candidate\.id\s*\}\)/
    );
    // One write site, and one entity-type literal on the whole path -- D-20's "the entity type is named HERE and nowhere else in this function".
    expect(INDEX_SOURCE.split('await writeEntityGrant(').length - 1).toBe(1);
    expect(INDEX_SOURCE.split(/entityType:/).length - 1).toBe(1);
  });

  it('MODULE-LEVEL, not flow-level: writeEntityGrant writes a grant shape that is one of § 3.1’s eight rows', async () => {
    // Arguments below are constructed by THIS TEST, so what is measured is `entityGrant.ts` in isolation and NOT the invite flow -- see the call-site assertion above, which is what `162-FLOW-CONFORMANCE.md` row 13 rests on (162-REVIEW CR-03). Retained rather than deleted because the scope and role the module hard-codes are the half of § 3.1 row 5 the call site does not carry.
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
      entityType: 'organization',
      entityId: '00000000-0000-0000-0000-0000000000bb'
    });
    expect(written).toHaveLength(1);
    // The two halves are independent (162-REVIEW WR-03, IN-02): the first binds the SCHEMA -- `entity` and `editor` are still members of `public.grant_scope_type` and `public.grant_role_type` as `000-enums.sql` declares them -- and the second binds the MODULE to those exact values. `expect(GRANT_SCOPES).toContain(written[0].scope)` was strictly implied by the line below it and proved nothing.
    expect(GRANT_SCOPES).toContain('entity');
    expect(GRANT_ROLES).toContain('editor');
    expect(written[0].scope).toBe('entity');
    expect(written[0].role).toBe('editor');
  });

  it('MODULE-LEVEL, not flow-level: writeEntityGrant takes the entity type as a VALUE rather than as a literal (D-20, D-21)', async () => {
    // The same call with a different entity type must write a different discriminator. A write site carrying the literal would answer identically for both and the parameterisation would be decorative.
    //
    // Arguments below are constructed by THIS TEST (162-REVIEW CR-03): this is the parameterisation half, and the flow's own use of it is pinned by the call-site assertion above.
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
    // And the literal appears ONCE per Edge Function, at the call site that says which entity was created, and nowhere inside the grant module itself.
    expect(GRANT_MODULE_SOURCE).not.toContain("'candidate'");
  });

  it('refuses an entity type outside the declared four rather than writing an unknown discriminator', async () => {
    const client = {
      from: () => ({
        insert: async () => ({ error: null })
      })
    };
    await expect(
      writeEntityGrant(client, {
        userId: '00000000-0000-0000-0000-0000000000aa',
        // @ts-expect-error -- the runtime half of the vocabulary is what is under test here
        entityType: 'party',
        entityId: '00000000-0000-0000-0000-0000000000bb'
      })
    ).rejects.toThrow(/Unknown entity type/);
  });

  it('binds the gate RPC to the parameter names user_can declares in the schema', async () => {
    // Guards an OUTAGE rather than a widening: PostgREST resolves an RPC by argument NAME, so a parameter renamed in the schema without the helper would make every invite fail closed, and nothing else in this file would notice.
    //
    // AND THE ARGUMENT VALUES, NOT JUST THEIR NAMES (162-REVIEW WR-04). Until then this test asserted the key SET matched the declaration and that `p_scope` was ANY of the four grant scopes -- satisfied by `'global'`, `'account'` or `'entity'` alike -- while `p_target_id` and `p_permission` were never asserted at all. A helper asking `user_can('global', <projectId>, …)` denies every caller and turns every invite into a silent outage, which is precisely the failure this test's own comment says it exists to catch. All three arguments are now asserted exactly, and `p_scope` is additionally required to be a member of the DERIVED scope vocabulary so a scope dropped from `public.grant_scope_type` reddens here too.
    const declared = deriveUserCanParameters(AUTH_FUNCTIONS_SOURCE);
    expect(declared).toHaveLength(3);
    const calls: Array<{ fn: string; args: Record<string, unknown> }> = [];
    const client: RpcClient = {
      rpc: (fn, args) => {
        calls.push({ fn, args });
        return Promise.resolve({ data: true, error: null });
      }
    };
    await callerMayOnProject(client, '00000000-0000-0000-0000-0000000000cc', 'project.edit_entities');
    expect(calls).toHaveLength(1);
    expect(calls[0].fn).toBe('user_can');
    expect(calls[0].args).toEqual({
      p_scope: 'project',
      p_target_id: '00000000-0000-0000-0000-0000000000cc',
      p_permission: 'project.edit_entities'
    });
    expect(Object.keys(calls[0].args).sort()).toEqual([...declared].sort());
    expect(GRANT_SCOPES).toContain(calls[0].args.p_scope);
  });
});
