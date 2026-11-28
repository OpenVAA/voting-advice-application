/**
 * Source-level conformance checks over `send-email`'s authority decision.
 *
 * This module gates BULK SEND on the caller's authority, so a gate that silently answered "no" would be an authorisation outage rather than a display defect, and a gate that answered "yes" too widely would let any caller mail a project's recipients. The checks below bind the gate to one `user_can` question through the caller's own client, the refusal to that question's answer, and the send to the configured project.
 *
 * In the shape of `identity-callback/envReadSites.test.ts`: `index.ts` imports `@supabase/supabase-js` and `nodemailer` through `npm:` specifiers, which only Deno resolves, so it cannot be imported by vitest, and the properties are asserted against the module's SOURCE TEXT.
 *
 * THE PERMISSION VOCABULARY IS DERIVED, NEVER TRANSCRIBED. It is read out of the declarative enum source at `schema/000-enums.sql`. The `beforeAll` below aborts the describe when the derivation finds no members, so no membership assertion runs against a vocabulary that failed to parse. A partial derivation still reddens: every check names the permission it needs, and a member the derivation missed reads as a literal outside the enum.
 */

import { readFileSync } from 'node:fs';
import { beforeAll, describe, expect, it } from 'vitest';

const INDEX_SOURCE = readFileSync(new URL('./index.ts', import.meta.url), 'utf8');
const ENUM_SOURCE = readFileSync(new URL('../../schema/000-enums.sql', import.meta.url), 'utf8');

/** The permission verbs, derived from the declarative enum declaration at run time. */
function derivePermissionVocabulary(sql: string): Array<string> {
  const block = sql.match(/CREATE TYPE public\.grant_permission AS ENUM\s*\(([\s\S]*?)\);/);
  if (!block) return [];
  return Array.from(block[1].matchAll(/'([^']+)'/g)).map((m) => m[1]);
}

const PERMISSIONS = derivePermissionVocabulary(ENUM_SOURCE);

/** The shape of a permission literal wherever one appears in TypeScript source. */
const PERMISSION_SHAPED = /\b(?:feedback|account|project|entity|nomination)\.[a-z0-9_]+\b/g;

/**
 * `index.ts` with its comments removed, for the assertions that must measure CODE.
 *
 * `PERMISSION_SHAPED` applied to the raw file text matches PROSE as readily as source: `send-email/index.ts` names `project.edit_entities` in the comment above the gate as well as in the call, so an assertion over the raw text would pass on the comment alone.
 *
 * The NEGATIVE check (`names no permission literal outside the derived enum`) reads the raw text on purpose: a permission named only in prose, and not a member of the enum, is a documentation defect this file should still catch.
 */
const CODE_ONLY = INDEX_SOURCE.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

const RETIRED_CLAIM_KEYS = ['user_roles', 'user_role_type', 'role_scope_type'] as const;

describe('send-email flow conformance', () => {
  // Throwing here aborts the describe, so no membership assertion below can run against a vocabulary that failed to parse.
  beforeAll(() => {
    if (PERMISSIONS.length === 0) {
      throw new Error('derivePermissionVocabulary parsed no members out of schema/000-enums.sql');
    }
  });

  it('read a non-empty index.ts, and it is the module under test', () => {
    expect(INDEX_SOURCE.length).toBeGreaterThan(1000);
    expect(INDEX_SOURCE).toContain('nodemailer');
  });

  it('names at least one permission literal IN CODE, so the membership assertion below is not vacuous', () => {
    // Measured over `CODE_ONLY` rather than the raw text: one of this module's `project.edit_entities` occurrences is prose in the comment above the gate.
    const named = Array.from(CODE_ONLY.matchAll(PERMISSION_SHAPED)).map((m) => m[0]);
    expect(named.length).toBeGreaterThan(0);
    expect(named).toContain('project.edit_entities');
  });

  it('names no permission literal outside the derived enum', () => {
    const named = Array.from(INDEX_SOURCE.matchAll(PERMISSION_SHAPED)).map((m) => m[0]);
    const outside = named.filter((n) => !PERMISSIONS.includes(n));
    expect(outside).toEqual([]);
  });

  it('names the permission bulk send asks for in code, and it is a member of the enum', () => {
    expect(CODE_ONLY).toContain('project.edit_entities');
    expect(PERMISSIONS).toContain('project.edit_entities');
  });

  it.each(RETIRED_CLAIM_KEYS)('reads no retired claim key: %s', (key) => {
    // The bare key name, not one access form of it: `claims.user_roles`, `payload['user_roles']` and a destructured `{ user_roles }` all redden. The module contains none of the three names in any form, so binding the bare name costs nothing.
    expect(INDEX_SOURCE).not.toContain(key);
  });

  it('asks the database for the authority decision rather than re-deriving it', () => {
    // The decision is one `user_can` call through the caller's own client, on the project the request names. A gate that reads `payload.grants` and matches (scope, role) pairs in TypeScript is the shape refused here: its account arm admits an account admin of ANY account, because which account owns a project is a reach rule only the database holds.
    //
    // AND THE GATE'S ANSWER IS THE SOLE INPUT TO THE REFUSAL. Matching only the call text or the assignment's prefix would accept `const mayBulkSend = (await callerMayOnProject(...)) || body.debugBypass === true` (`await X || Y` parses as `(await X) || Y`), which lets any caller that posts the bypass flag bulk-send. The WHOLE assignment statement is therefore bound, terminator included, and the number of assignments to the gate variable is pinned at one so a later re-assignment cannot widen it either.
    expect(INDEX_SOURCE).toContain("callerMayOnProject(callerClient, project_id, 'project.edit_entities')");
    expect(INDEX_SOURCE).toMatch(
      /\n\s*const mayBulkSend = await callerMayOnProject\(callerClient, project_id, 'project\.edit_entities'\);\n/
    );
    expect(INDEX_SOURCE.split(/\bmayBulkSend\s*=/).length - 1).toBe(1);
    expect(INDEX_SOURCE).not.toContain('payload.grants');
    expect(INDEX_SOURCE).not.toMatch(/g\.scope\s*===/);
    expect(INDEX_SOURCE).not.toMatch(/g\.role\s*===/);
  });

  it('takes its gate from the callerAuthority module and declares none of its own', () => {
    // Guards a LOCAL SHADOW of the helper: a same-named function declared in index.ts would satisfy every call-shape assertion here while answering whatever it likes.
    expect(INDEX_SOURCE).toContain("import { callerMayOnProject } from './callerAuthority.ts';");
    expect(INDEX_SOURCE).not.toMatch(/\bfunction\s*\*?\s*callerMayOnProject\b/);
    expect(INDEX_SOURCE).not.toMatch(/\b(?:const|let|var)\s+callerMayOnProject\b/);
  });

  it('refuses on the answer of the gate, with a 403 it RETURNS, before the service-role client exists', () => {
    // The gate's answer must end the request: the refusal is matched as one contiguous block whose answer is `return`ed, so a refusal that is built but not returned, or a condition replaced by a constant, reddens this test. The service-role client must come after the block ends.
    const refusal = INDEX_SOURCE.match(/if \(!mayBulkSend\) \{\s*return jsonAnswer\(([\s\S]*?)\);\s*\}/);
    expect(refusal).not.toBeNull();
    expect(refusal![1]).toMatch(/, 403$/);
    expect(refusal![1]).toContain('Forbidden: caller may not send bulk email for this project');
    const gateAt = INDEX_SOURCE.indexOf('const mayBulkSend = await callerMayOnProject(callerClient');
    expect(gateAt).toBeGreaterThan(-1);
    expect(refusal!.index!).toBeGreaterThan(gateAt);
    const adminAt = INDEX_SOURCE.indexOf('SUPABASE_SERVICE_ROLE_KEY');
    expect(adminAt).toBeGreaterThan(refusal!.index! + refusal![0].length);
  });

  it('binds bulk send to the configured project after the gate, and resolves recipients only in that project', () => {
    // Guards a REQUEST-CHOSEN project: a caller who passes the gate for one project could otherwise resolve another project's recipients through the service-role client.
    const gateRefusalAt = INDEX_SOURCE.indexOf('Forbidden: caller may not send bulk email for this project');
    const configuredAt = INDEX_SOURCE.indexOf("requireEnv('PUBLIC_PROJECT_ID'", gateRefusalAt);
    const mismatchAt = INDEX_SOURCE.indexOf("jsonAnswer({ error: 'Invalid project_id' }, 400)", configuredAt);
    const resolveAt = INDEX_SOURCE.indexOf("rpc('resolve_email_variables'", mismatchAt);
    expect(gateRefusalAt).toBeGreaterThan(-1);
    expect(configuredAt).toBeGreaterThan(gateRefusalAt);
    expect(mismatchAt).toBeGreaterThan(configuredAt);
    expect(resolveAt).toBeGreaterThan(mismatchAt);
    expect(INDEX_SOURCE).toContain('p_project_id: configuredProjectId');
    expect(INDEX_SOURCE).not.toContain('p_project_id: project_id');
  });

  it('asks the gate through the CALLER client, before the service-role client exists', () => {
    expect(INDEX_SOURCE).not.toMatch(/callerMayOnProject\(\s*supabaseAdmin/);
    const gateAt = INDEX_SOURCE.indexOf('callerMayOnProject(callerClient');
    const adminAt = INDEX_SOURCE.indexOf('SUPABASE_SERVICE_ROLE_KEY');
    expect(gateAt).toBeGreaterThan(-1);
    expect(adminAt).toBeGreaterThan(gateAt);
  });

  it('sends the HTML part with escaped variables and never as a caller-chosen sender', () => {
    expect(INDEX_SOURCE).toContain('html: rendered.html');
    expect(INDEX_SOURCE).toContain('renderTemplateHtml(template.body, vars)');
    expect(INDEX_SOURCE).toContain('const senderAddress = configuredSender(smtp);');
    expect(INDEX_SOURCE).toContain("jsonAnswer({ error: 'Invalid from' }, 400)");
    // THE SENDER ACTUALLY USED, POSITIVELY. A negative match on one spelling of a caller-chosen sender misses `from ?? senderAddress`, `from || senderAddress` and `from: body.from`; this asserts that the envelope sender is the configured one at the one line that decides it.
    expect(CODE_ONLY).toMatch(/await transport\.sendMail\(\{\s*from: senderAddress,/);
    // Exactly one `from:` in executable code, so a second send site -- or a caller-chosen sender added beside this one -- reddens rather than hiding behind the assertion above.
    expect(CODE_ONLY.split(/\bfrom:\s/).length - 1).toBe(1);
    expect(CODE_ONLY).not.toMatch(/from:\s*(?:from\b|body\.|req\b|[a-zA-Z_$][\w$]*\s*(?:\?\?|\|\|))/);
  });

  it('writes no grant at all — it is an authorisation gate, not an identity entry point', () => {
    expect(INDEX_SOURCE).not.toContain('writeEntityGrant');
    expect(INDEX_SOURCE).not.toContain(".from('grants')");
  });
});
