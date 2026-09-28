/**
 * Source-level conformance gate over `send-email`'s authority decision — D-25's FIFTH module.
 *
 * THIS MODULE IS THE ONE THE BRIEF'S CENSUS MISSED. `162-IMPLEMENTATION-BRIEF.md` § 5 names four frontend claim readers; D-25 measured five, and the fifth is this one. It is NOT a display read: it gates BULK SEND, so when the claim changed under 162-06 the pre-change reader's `payload.user_roles || []` would have evaluated to the empty list and every administrator would have lost bulk send — a silent authorisation outage in a module no plan named. A flow check built on the brief's number would have omitted the only one of the five whose failure is an outage, which is why the census behind this file was re-derived from the tree rather than taken from any document.
 *
 * In the shape of `identity-callback/envReadSites.test.ts`: `index.ts` resolves remote Deno specifiers (`https://esm.sh/@supabase/supabase-js@2`, `npm:nodemailer@6.9.10`) and cannot be imported by vitest, so the properties are asserted against the module's SOURCE TEXT.
 *
 * THE PERMISSION VOCABULARY IS DERIVED, NEVER TRANSCRIBED. It is read out of the declarative enum source at `schema/000-enums.sql`, and its size is pinned at 23.
 *
 * WHAT THAT PIN ACTUALLY GUARDS (162-REVIEW WR-05). This docblock used to claim "an empty vocabulary would make every membership check pass." That is the OPPOSITE of what happens: with `PERMISSIONS === []`, `expect(outside).toEqual([])` fails (every named literal becomes "outside") and `expect(PERMISSIONS).toContain('project.edit_entities')` fails too. An empty derivation reddens loudly on its own. What the pin guards is a PARTIAL derivation — a regex that still matches but stops short, so a legitimate literal reads as a non-member and the file reports a confusing "permission outside the enum" rather than the parse failure that caused it. The pin turns that into one named red at the source.
 *
 * AND "BEFORE" IS NOW TRUE. The pin used to sit in a peer `it` block, which vitest runs alongside the assertions it claims to precede rather than as a precondition of them. The `beforeAll` below throws, which aborts the whole describe, so every membership assertion in this file genuinely runs only on a vocabulary that parsed.
 *
 * TIGHTENED BY 162-18. Until then this file asserted that the gate was PRESENT but nothing about its answer being USED: replacing the refusal condition with a constant false left every test here green. 162-18 added three assertions — the gate is the shared module's and not a local shadow, the refusal is conditioned on the gate's answer and precedes the service-role client, and bulk send is bound to the configured project with recipients resolved only there — and recorded a planted control reddening each one in `evidence/162-18/flow-controls.txt`.
 */

import { readFileSync } from 'node:fs';
import { beforeAll, describe, expect, it } from 'vitest';

const INDEX_SOURCE = readFileSync(new URL('./index.ts', import.meta.url), 'utf8');
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

/**
 * `index.ts` with its comments removed, for the assertions that must measure CODE.
 *
 * 162-REVIEW WR-02: `PERMISSION_SHAPED` applied to the raw file text matches PROSE as readily as source. Of the two `project.edit_entities` occurrences in `send-email/index.ts`, the first is in the comment block above the gate and only the second is executable, so `names the permission bulk send asks for` was satisfied by that comment alone — a module that had dropped the permission from its code entirely would still have passed it.
 *
 * The NEGATIVE check (`names no permission literal outside the derived enum`) keeps reading the raw text on purpose: a permission named only in prose, and not a member of the 23, is a documentation defect this file should still catch.
 */
const CODE_ONLY = INDEX_SOURCE.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

const RETIRED_CLAIM_KEYS = ['user_roles', 'user_role_type', 'role_scope_type'] as const;

describe('send-email flow conformance', () => {
  // THE PRECONDITION, ENFORCED AS ONE (162-REVIEW WR-05). Throwing here aborts the describe, so no membership assertion below can run against a vocabulary that failed to parse -- which is what the docblock's "before any membership assertion uses it" has always claimed and what a peer `it` guard could not deliver.
  beforeAll(() => {
    if (PERMISSIONS.length !== 23) {
      throw new Error(
        `derivePermissionVocabulary parsed ${PERMISSIONS.length} members out of schema/000-enums.sql, expected 23 -- every membership assertion below would measure a vocabulary that is not the enum's`
      );
    }
  });

  it('derived a 23-member permission vocabulary before any membership assertion uses it', () => {
    expect(PERMISSIONS.length).toBe(23);
  });

  it('read a non-empty index.ts, and it is the module under test', () => {
    expect(INDEX_SOURCE.length).toBeGreaterThan(1000);
    expect(INDEX_SOURCE).toContain('nodemailer');
  });

  it('names at least one permission literal IN CODE, so the membership assertion below is not vacuous', () => {
    // Measured over `CODE_ONLY` rather than the raw text (162-REVIEW WR-02): the first of this module's two `project.edit_entities` occurrences is prose in the comment above the gate, so the raw form was satisfiable by a comment.
    const named = Array.from(CODE_ONLY.matchAll(PERMISSION_SHAPED)).map((m) => m[0]);
    expect(named.length).toBeGreaterThan(0);
    expect(named).toContain('project.edit_entities');
  });

  it('names no permission literal outside the derived enum', () => {
    const named = Array.from(INDEX_SOURCE.matchAll(PERMISSION_SHAPED)).map((m) => m[0]);
    const outside = named.filter((n) => !PERMISSIONS.includes(n));
    expect(outside).toEqual([]);
  });

  it('names the permission bulk send asks for, and it is a member of the ratified 23 (D-30, operator S-3 NOTE)', () => {
    // IN CODE (162-REVIEW WR-02). The raw-text form of the first assertion was satisfied by the comment on `index.ts`'s line 114 alone.
    expect(CODE_ONLY).toContain('project.edit_entities');
    expect(PERMISSIONS).toContain('project.edit_entities');
  });

  it.each(RETIRED_CLAIM_KEYS)('reads no retired claim key: %s', (key) => {
    // THE KEY, NOT ONE ACCESS FORM OF IT (162-REVIEW WR-01). These three assertions used to be `not.toContain('payload.' + key)` and `not.toContain("['" + key + "']")`, and the token `payload` does not occur anywhere in this module -- the gate has read no claim at all since WR-09 -- so they could only redden if a future edit reintroduced that exact variable NAME as well as that exact access form. `const claims = decodeTokenPayload(jwt); claims.user_roles` slipped through untouched. Since the module contains none of the three key names in any form, binding the bare name costs nothing and is the assertion the test's own title makes.
    expect(INDEX_SOURCE).not.toContain(key);
  });

  it('asks the database for the authority decision rather than re-deriving it (SPEC section 9, 162-REVIEW WR-09)', () => {
    // The gate this replaced read `payload.grants` and matched (scope, role) pairs in TypeScript. Its account arm admitted an account admin of ANY account, and it disagreed with invite-candidate's copy on the ProjectEditor. The decision is now one `user_can` call through the caller's own client, on the project the request names.
    //
    // AND THE GATE'S ANSWER IS THE SOLE INPUT TO THE REFUSAL (162-REVIEW CR-02). Asserting the call TEXT is present, and locating the assignment by its `const mayBulkSend = await callerMayOnProject(callerClient` PREFIX, constrains nothing about what else contributes to `mayBulkSend`: `const mayBulkSend = (await callerMayOnProject(...)) || body.debugBypass === true` satisfies both (`await X || Y` parses as `(await X) || Y`, so the prefix still matches), names no retired pattern, and leaves this file green while any authenticated caller posting `{"debugBypass": true}` bulk-sends. The WHOLE assignment statement is therefore bound, terminator included, and the number of assignments to the gate variable is pinned at one so a later re-assignment cannot widen it either.
    expect(INDEX_SOURCE).toContain("callerMayOnProject(callerClient, project_id, 'project.edit_entities')");
    expect(INDEX_SOURCE).toMatch(
      /\n\s*const mayBulkSend = await callerMayOnProject\(callerClient, project_id, 'project\.edit_entities'\);\n/
    );
    expect(INDEX_SOURCE.split(/\bmayBulkSend\s*=/).length - 1).toBe(1);
    expect(INDEX_SOURCE).not.toContain('payload.grants');
    expect(INDEX_SOURCE).not.toMatch(/g\.scope\s*===/);
    expect(INDEX_SOURCE).not.toMatch(/g\.role\s*===/);
  });

  it('takes its gate from the shared callerAuthority module and declares none of its own', () => {
    // Guards a LOCAL SHADOW of the helper (162-REVIEW WR-09): a same-named function declared in index.ts would satisfy every call-shape assertion here while answering whatever it likes.
    expect(INDEX_SOURCE).toContain("import { callerMayOnProject } from './callerAuthority.ts';");
    expect(INDEX_SOURCE).not.toMatch(/\bfunction\s*\*?\s*callerMayOnProject\b/);
    expect(INDEX_SOURCE).not.toMatch(/\b(?:const|let|var)\s+callerMayOnProject\b/);
  });

  it('refuses on the answer of the gate, with a 403 it RETURNS, before the service-role client exists', () => {
    // Guards an IGNORED answer (162-REVIEW WR-09): before 162-18, a refusal condition replaced with a constant false left this whole file green, because nothing asserted the gate's result reached the refusal.
    //
    // AND A DISCARDED ONE (162-REVIEW CR-01). Until this assertion the refusal was pinned as five independent `indexOf` hits asserted to occur IN ORDER, which says nothing about the branch terminating the request: deleting the one word `return` in front of `new Response` -- the 403 constructed, thrown away, execution falling straight through to the service-role client below -- left all 16 tests here green while an unauthorised caller reached the service-role client and bulk-sent. The refusal is therefore matched as ONE CONTIGUOUS BLOCK whose `new Response` is `return`ed, and the service-role client is required to come after the block ENDS rather than after it begins.
    const refusal = INDEX_SOURCE.match(/if \(!mayBulkSend\) \{\s*return new Response\(([\s\S]*?)\);\s*\}/);
    expect(refusal).not.toBeNull();
    expect(refusal![1]).toContain('status: 403');
    expect(refusal![1]).toContain('Forbidden: caller may not send bulk email for this project');
    const gateAt = INDEX_SOURCE.indexOf('const mayBulkSend = await callerMayOnProject(callerClient');
    expect(gateAt).toBeGreaterThan(-1);
    expect(refusal!.index!).toBeGreaterThan(gateAt);
    const adminAt = INDEX_SOURCE.indexOf('SUPABASE_SERVICE_ROLE_KEY');
    expect(adminAt).toBeGreaterThan(refusal!.index! + refusal![0].length);
  });

  it('binds bulk send to the configured project after the gate, and resolves recipients only in that project', () => {
    // Guards a REQUEST-CHOSEN project (162-REVIEW WR-02): a caller who passes the gate for one project could otherwise resolve another project's recipients through the service-role client.
    const gateRefusalAt = INDEX_SOURCE.indexOf('Forbidden: caller may not send bulk email for this project');
    const configuredAt = INDEX_SOURCE.indexOf("requireEnv('PUBLIC_PROJECT_ID'", gateRefusalAt);
    const mismatchAt = INDEX_SOURCE.indexOf("JSON.stringify({ error: 'Invalid project_id' })", configuredAt);
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

  it('shares ONE gate module with invite-candidate, byte for byte', () => {
    const mine = readFileSync(new URL('./callerAuthority.ts', import.meta.url), 'utf8');
    const theirs = readFileSync(new URL('../invite-candidate/callerAuthority.ts', import.meta.url), 'utf8');
    expect(mine.length).toBeGreaterThan(500);
    expect(mine).toBe(theirs);
  });

  it('sends the HTML part with escaped variables and never as a caller-chosen sender (162-REVIEW WR-02)', () => {
    expect(INDEX_SOURCE).toContain('html: rendered.html');
    expect(INDEX_SOURCE).toContain('renderTemplateHtml(template.body, vars)');
    expect(INDEX_SOURCE).toContain("const senderAddress = requireEnv('SMTP_FROM'");
    expect(INDEX_SOURCE).toContain("JSON.stringify({ error: 'Invalid from' })");
    // THE SENDER ACTUALLY USED, POSITIVELY (162-REVIEW WR-06). The negative half of this test used to be `not.toMatch(/from\s*\|\|\s*requireEnv/)` alone -- ONE historical spelling of the defect WR-02 fixed. `from ?? senderAddress`, `from || senderAddress` and `from: body.from` at the `transport.sendMail` call all passed it, and nothing asserted the property that actually holds: the envelope sender is the configured one at the one line that decides it.
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
