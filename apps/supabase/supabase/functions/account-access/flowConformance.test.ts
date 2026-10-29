/**
 * Source-level conformance of the account-access handler: the uniform answer of each of its two link operations, the address confirmation and its caller, the calls that create a user or mint a token, the rule that the one admin update carrying an address puts the account's placeholder back, the link's origin, the bounded memory of the deployment checks, and what a log line may hold.
 *
 * The handler answers two operations before it does their work, `request-link` and `request-recovery`. Four properties are asserted for each by name, so a failure says which branch broke, and four more are asserted of the two together. The address confirmation answers after its work, to the caller its own access token names.
 *
 * `index.ts` imports `@supabase/supabase-js` and `nodemailer` through `npm:` specifiers and names the Deno global, so vitest cannot import it and none of these properties has a runtime to observe here. They are asserted against the module's source text, with comments removed wherever the assertion is about code.
 *
 * Each property is negative in spirit: an `await` that must not stand before a return, a header that must not be read, a value that must not reach a log line. A test that ran the handler against stubs would show what the stubs were handed, not what the source can do.
 */

import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { REDIRECT_CHECK_TTL_MS, SIGN_UP_CHECK_TTL_MS } from './deploymentChecks.ts';

const INDEX_SOURCE = readFileSync(new URL('./index.ts', import.meta.url), 'utf8');
const LINK_ISSUE_SOURCE = readFileSync(new URL('./linkIssue.ts', import.meta.url), 'utf8');
const CONFIRMATION_SOURCE = readFileSync(new URL('./addressConfirmation.ts', import.meta.url), 'utf8');
const SEND_EMAIL_SOURCE = readFileSync(new URL('../send-email/index.ts', import.meta.url), 'utf8');

/** A source with its block comments and its whole-line comments removed. */
function codeOf(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
}

const CODE = codeOf(INDEX_SOURCE);
const LINK_ISSUE_CODE = codeOf(LINK_ISSUE_SOURCE);
const CONFIRMATION_CODE = codeOf(CONFIRMATION_SOURCE);

/** The code of every module of the function that is not a test, by file name. */
const SOURCES = readdirSync(new URL('.', import.meta.url))
  .filter((name) => name.endsWith('.ts') && !name.endsWith('.test.ts'))
  .map((name) => [name, codeOf(readFileSync(new URL(`./${name}`, import.meta.url), 'utf8'))] as const);

/** How many times a text holds another. */
function count(haystack: string, needle: string): number {
  return haystack.split(needle).length - 1;
}

/** The text of a top-level function, from its declaration to the closing brace at column 0. */
function functionBody(name: string): string {
  const start = CODE.search(new RegExp(`^(?:async )?function ${name}\\(`, 'm'));
  expect(start, `function ${name} was not found in index.ts`).toBeGreaterThan(-1);
  const end = CODE.indexOf('\n}\n', start);
  expect(end).toBeGreaterThan(start);
  return CODE.slice(start, end);
}

/** The text of one method of the dependency object a factory returns, `linkIssueDeps` unless another is named. */
function dependencyBody(name: string, factory = 'linkIssueDeps'): string {
  const deps = functionBody(factory);
  const start = deps.indexOf(`    async ${name}(`);
  expect(start, `the dependency ${name} was not found in ${factory}`).toBeGreaterThan(-1);
  const end = deps.indexOf('\n    },', start);
  expect(end).toBeGreaterThan(start);
  return deps.slice(start, end);
}

/** The two operations that are answered before their work is done, each with the background function its branch hands over and the issuer that function calls. */
const LINK_OPERATIONS = [
  { operation: 'request-link', background: 'issueInBackground', issuer: 'issueSignInLink' },
  { operation: 'request-recovery', background: 'issueRecoveryInBackground', issuer: 'issueRecoveryLink' }
] as const;

/** The branch of the handler for one operation, from its condition to its closing brace. */
function branchOf(operation: string): string {
  const start = CODE.indexOf(`if (request.operation === '${operation}') {`);
  expect(start, `the ${operation} branch was not found in the handler`).toBeGreaterThan(-1);
  const end = CODE.indexOf('\n  }\n', start);
  expect(end).toBeGreaterThan(start);
  return CODE.slice(start, end);
}

/** The lines of a source that import through an `npm:` specifier. */
function npmImports(source: string): Array<string> {
  return source.split('\n').filter((line) => /from 'npm:/.test(line));
}

describe('account-access flow conformance', () => {
  it('read the handler, and it is the module under test', () => {
    expect(INDEX_SOURCE.length).toBeGreaterThan(1000);
    expect(CODE).toContain('Deno.serve(');
    expect(CODE).toContain('parseAccountAccessRequest(body)');
  });

  describe('its remote imports', () => {
    it('are the two `npm:` lines of send-email, at the same versions, and no other', () => {
      const mine = npmImports(INDEX_SOURCE);
      expect(mine).toHaveLength(2);
      expect(mine).toEqual(npmImports(SEND_EMAIL_SOURCE));
      expect(INDEX_SOURCE).not.toMatch(/from\s*['"`](https?:\/\/|jsr:)/);
    });
  });

  describe.each(LINK_OPERATIONS)('the uniform answer of $operation', ({ operation, background, issuer }) => {
    it(`returns after handing the work to EdgeRuntime.waitUntil, with no await in the ${operation} branch`, () => {
      const branch = branchOf(operation);
      const handOff = branch.indexOf('EdgeRuntime.waitUntil(');
      const returned = branch.indexOf('return ');
      expect(handOff).toBeGreaterThan(-1);
      expect(returned).toBeGreaterThan(handOff);
      expect(count(branch, 'return ')).toBe(1);
      expect(count(branch, 'EdgeRuntime.waitUntil(')).toBe(1);
      expect(branch).not.toMatch(/\bawait\b/);
    });

    it(`builds the accepted answer before the hand-off of ${operation} and returns that same value`, () => {
      const branch = branchOf(operation);
      const built = branch.indexOf('const accepted = answer(ACCEPTED_BODY, 200);');
      expect(built).toBeGreaterThan(-1);
      expect(built).toBeLessThan(branch.indexOf('EdgeRuntime.waitUntil('));
      expect(branch).toContain('return accepted;');
      expect(count(branch, 'answer(')).toBe(1);
      expect(count(branch, 'ACCEPTED_BODY')).toBe(1);
    });

    it(`hands over the one background function of ${operation}, which is the only caller of its issuer`, () => {
      const branch = branchOf(operation);
      expect(branch).toContain(`EdgeRuntime.waitUntil(${background}(request));`);
      expect(branch).not.toContain(issuer);
      expect(branch).not.toContain('linkIssueDeps');
      expect(count(CODE, `${background}(`)).toBe(2);
      expect(functionBody(background)).toContain(`await ${issuer}(request, linkIssueDeps());`);
      expect(count(CODE, `${issuer}(`)).toBe(1);
    });

    it(`catches whatever the background function of ${operation} meets, so the hand-off cannot reject`, () => {
      const body = functionBody(background);
      expect(body).toMatch(
        new RegExp(`try \\{\\s*await ${issuer}\\(request, linkIssueDeps\\(\\)\\);\\s*\\} catch \\(error\\) \\{`)
      );
      expect(count(body, 'await ')).toBe(1);
    });
  });

  describe('the two link operations together, request-link and request-recovery', () => {
    it('are two branches of the handler, each found by its own condition', () => {
      const [link, recovery] = LINK_OPERATIONS.map(({ operation }) => branchOf(operation));
      expect(link).not.toBe(recovery);
      expect(link).not.toContain('request-recovery');
      expect(recovery).not.toContain('request-link');
    });

    it('hand work to the runtime twice in the whole handler, once each', () => {
      expect(count(CODE, 'EdgeRuntime.waitUntil(')).toBe(2);
    });

    it('build the accepted answer twice in the whole handler, once each, beside its one import', () => {
      expect(count(CODE, 'ACCEPTED_BODY')).toBe(3);
      expect(count(CODE, 'answer(ACCEPTED_BODY, 200)')).toBe(2);
    });

    it('build the effects of an issue in their two background functions and nowhere else', () => {
      expect(count(CODE, 'linkIssueDeps(')).toBe(3);
      for (const { background } of LINK_OPERATIONS) expect(count(functionBody(background), 'linkIssueDeps(')).toBe(1);
    });
  });

  describe('the order of issue', () => {
    it('creates the user with the type invite, mints a sign-in token with the type magiclink and a recovery token with the type recovery', () => {
      const create = dependencyBody('createPasswordlessUser');
      const mint = dependencyBody('mintToken');
      const recover = dependencyBody('mintRecoveryToken');
      expect(create).toContain("generateLink({ type: 'invite'");
      expect(create).not.toContain('magiclink');
      expect(create).not.toContain("'recovery'");
      expect(mint).toContain("generateLink({ type: 'magiclink'");
      expect(mint).not.toContain("'invite'");
      expect(mint).not.toContain("'recovery'");
      expect(recover).toContain("generateLink({ type: 'recovery'");
      expect(recover).not.toContain("'invite'");
      expect(recover).not.toContain('magiclink');
      expect(count(CODE, 'generateLink(')).toBe(4);
      const types = Array.from(CODE.matchAll(/generateLink\(\{ type: '([a-z]+)'/g)).map((match) => match[1]);
      expect(types).toEqual(['invite', 'magiclink', 'recovery']);
    });

    it('mints the two tokens of a change of address in one call, of the types email_change_current and email_change_new, from the account’s address to the typed one', () => {
      const change = dependencyBody('generateEmailChange', 'addressConfirmationDeps');
      expect(change).toContain("const type = kind === 'current' ? 'email_change_current' : 'email_change_new';");
      expect(change).toContain('generateLink({ type, email: currentEmail, newEmail })');
      expect(change).toContain('hashedToken: data.properties.hashed_token');
      expect(change).toContain('actionLinkToken: actionLinkToken(data.properties.action_link)');
      expect(count(CODE, "'email_change_current'")).toBe(1);
      expect(count(CODE, "'email_change_new'")).toBe(1);
    });

    it('names five types in all among the calls that create a user or mint a token', () => {
      const literal = Array.from(CODE.matchAll(/generateLink\(\{ type: '([a-z_]+)'/g)).map((match) => match[1]);
      const changes = Array.from(CODE.matchAll(/'(email_change_(?:current|new))'/g)).map((match) => match[1]);
      expect([...literal, ...changes].sort()).toEqual([
        'email_change_current',
        'email_change_new',
        'invite',
        'magiclink',
        'recovery'
      ]);
      expect(count(CODE, 'generateLink(')).toBe(literal.length + 1);
    });

    it('mints a recovery token without creating a user: the recovery arm of the issue holds no call of the account-creating dependency', () => {
      const start = LINK_ISSUE_CODE.indexOf("if (mail === 'recovery') {");
      expect(start).toBeGreaterThan(-1);
      const end = LINK_ISSUE_CODE.indexOf('} else {', start);
      expect(end).toBeGreaterThan(start);
      const arm = LINK_ISSUE_CODE.slice(start, end);
      expect(arm).toContain('await deps.mintRecoveryToken(address)');
      expect(arm).not.toContain('createPasswordlessUser');
      expect(count(LINK_ISSUE_CODE, 'deps.createPasswordlessUser(')).toBe(1);
      expect(LINK_ISSUE_CODE.indexOf('deps.createPasswordlessUser(')).toBeGreaterThan(end);
      expect(dependencyBody('mintRecoveryToken')).toContain('return data.properties.hashed_token;');
    });

    it('asks the database which mail a recovery request earns, with the project and the address and nothing else', () => {
      const question = dependencyBody('recoveryEligibility');
      expect(question).toContain("admin.rpc('recovery_link_request', {");
      expect(question).toContain('p_project_id: projectId');
      expect(question).toContain('p_email: email');
      expect(question).not.toContain('p_code');
      expect(question).toContain('if (error) throw error;');
      expect(question).toContain('return readRecoveryEligibility(data);');
      expect(count(CODE, "'recovery_link_request'")).toBe(1);
    });

    it('discards the token of the invite', () => {
      const create = dependencyBody('createPasswordlessUser');
      expect(create).toContain('const { error } = await');
      expect(create).not.toContain('data');
      expect(create).not.toContain('hashed_token');
    });

    it('compares an error against one code only, email_exists, read from the key the auth client carries it on', () => {
      const compared = Array.from(CODE.matchAll(/\.code\s*[!=]==?\s*'([^']*)'/g)).map((match) => match[1]);
      expect(compared).toEqual(['email_exists', 'email_exists']);
      expect(dependencyBody('createPasswordlessUser')).toContain(
        "if (error && error.code !== 'email_exists') throw error;"
      );
      expect(dependencyBody('generateEmailChange', 'addressConfirmationDeps')).toContain(
        "if (error.code === 'email_exists') return 'email-exists';"
      );
      expect(CODE).not.toMatch(/'[^']*'\s*[!=]==?\s*\w+\.code\b/);
      expect(CODE).not.toMatch(/\.(message|status|name)\s*[!=]==?/);
      expect(count(INDEX_SOURCE, 'email_exists')).toBe(2);
    });

    it('never creates a user by the admin API’s direct calls', () => {
      const directCalls = ['create' + 'User', 'inviteUser' + 'ByEmail'];
      const sources = readdirSync(new URL('.', import.meta.url))
        .filter((name) => name.endsWith('.ts') && !name.endsWith('.test.ts'))
        .map((name) => readFileSync(new URL(`./${name}`, import.meta.url), 'utf8'));
      expect(sources.length).toBeGreaterThan(5);
      for (const source of sources) {
        for (const call of directCalls) expect(source).not.toContain(call);
      }
    });
  });

  describe('no address becomes an account’s by any route but the mailed link', () => {
    it('reads every module of the function', () => {
      expect(SOURCES.map(([name]) => name)).toContain('index.ts');
      expect(SOURCES.map(([name]) => name)).toContain('addressConfirmation.ts');
    });

    it('holds one admin update that carries an email key, the placeholder put back, and no update of the user through the caller’s own session', () => {
      const carrying: Array<string> = [];
      for (const [name, code] of SOURCES) {
        const updates = Array.from(code.matchAll(/updateUserById\(([^;]*?)\)\s*;/gs)).map((match) => match[1]);
        for (const args of updates) if (/\bemail\b/.test(args)) carrying.push(`${name}: ${args}`);
        expect(code, `a user update in ${name}`).not.toMatch(/\bupdateUser\(/);
      }
      expect(carrying).toEqual(['index.ts: userId, { email, email_confirm: true }']);
      const restore = dependencyBody('restoreAddress', 'addressConfirmationDeps');
      expect(restore).toContain('admin().auth.admin.updateUserById(userId, { email, email_confirm: true });');
      expect(restore.indexOf('if (!isPlaceholderAddress(email)) throw')).toBeGreaterThan(-1);
      expect(restore.indexOf('if (!isPlaceholderAddress(email)) throw')).toBeLessThan(
        restore.indexOf('updateUserById(')
      );
    });

    it('puts back only the account’s own placeholder, and only after a verification that completed the change', () => {
      expect(count(CONFIRMATION_CODE, 'deps.restoreAddress(')).toBe(1);
      expect(CONFIRMATION_CODE).toContain('await deps.restoreAddress(restoration);');
      expect(CONFIRMATION_CODE).toContain(
        'return undoCompletedChange(deps, { userId: account.id, email: currentEmail }, slot);'
      );
      expect(CONFIRMATION_CODE.indexOf("if (verification !== 'confirmed') {")).toBeGreaterThan(
        CONFIRMATION_CODE.indexOf('const verification = await deps.verifyCurrent(')
      );
    });

    it('confirms no address on the service’s word: email_confirm only where the placeholder is put back', () => {
      for (const [name, code] of SOURCES) {
        expect(count(code, 'email_confirm'), name).toBe(name === 'index.ts' ? 1 : 0);
      }
      expect(dependencyBody('restoreAddress', 'addressConfirmationDeps')).toContain('email_confirm: true');
    });

    it('verifies only the current address’s token itself, with the public key, and mails the new one', () => {
      const verify = dependencyBody('verifyCurrent', 'addressConfirmationDeps');
      expect(verify).toContain('`${supabaseUrl}/auth/v1/verify`');
      expect(verify).toContain("JSON.stringify({ type: 'email_change', token_hash: tokenHash })");
      expect(verify).toContain('headers: { apikey: anonKey,');
      expect(verify).toContain('isSingleConfirmation(response.status, verified)');
      expect(verify).toContain("if (isCompletedChange(response.status, verified)) return 'completed';");
      expect(verify).not.toMatch(/SERVICE_ROLE|Authorization/);
      expect(count(CODE, '/auth/v1/verify')).toBe(2);
      expect(CONFIRMATION_CODE).toContain(
        'const verification = await deps.verifyCurrent(tokenOf(current.hashedToken));'
      );
      expect(CONFIRMATION_CODE).toContain('tokenHash: tokenOf(next.actionLinkToken),');
      expect(CONFIRMATION_CODE).toContain("type: 'email_change'");
      expect(count(CONFIRMATION_CODE, 'deps.verifyCurrent(')).toBe(1);
    });
  });

  describe('the address confirmation', () => {
    it('is answered after its work, with no hand-off to the runtime, by the one function that builds its answer', () => {
      const branch = branchOf('confirm-address');
      expect(branch).toContain('return answerAddressConfirmation(request, bearerToken(authorization));');
      expect(branch).not.toContain('EdgeRuntime');
      expect(count(CODE, 'answerAddressConfirmation(')).toBe(2);
    });

    it('answers no body but the four of its outcome', () => {
      const answering = functionBody('answerAddressConfirmation');
      expect(answering).toContain('const { status, body } = addressConfirmationAnswer(outcome);');
      expect(answering).toContain('return answer(body, status);');
      expect(count(answering, 'answer(')).toBe(1);
      expect(answering).toContain("let outcome: AddressConfirmationOutcome = 'refused';");
      expect(count(CODE, 'addressConfirmationAnswer(')).toBe(1);
      expect(count(CODE, 'addressConfirmationDeps(')).toBe(2);
    });

    it('reads its caller from the auth service by the caller’s own token, and nothing of the body names a user', () => {
      const caller = dependencyBody('callerAccount', 'addressConfirmationDeps');
      expect(caller).toContain('await visitor.auth.getUser(token);');
      expect(caller).toContain('if (callerTokenRefused(error)) return null;');
      expect(caller).toContain('identityProvider: identityProviderOf(data.user.app_metadata),');
      expect(caller).toContain('registeredProjects: registeredProjectsOf(data.user.app_metadata)');
      expect(count(CODE, 'getUser(')).toBe(1);
      expect(CODE).not.toMatch(/request\.(userId|user_id)/);
    });

    it('makes no service-role client before the caller’s token is accepted', () => {
      const deps = functionBody('addressConfirmationDeps');
      expect(deps).toContain('const admin = () => (adminClient ??= createAdminClient());');
      expect(count(deps, 'createAdminClient()')).toBe(1);
      const caller = dependencyBody('callerAccount', 'addressConfirmationDeps');
      expect(caller).toContain('createClient(supabaseUrl, anonKey,');
      expect(caller).not.toContain('admin');
      const read = CONFIRMATION_CODE.indexOf('deps.callerAccount(');
      expect(read).toBeGreaterThan(-1);
      for (const effect of [
        'deps.takeSlot(',
        'deps.addressHoldsOpenInvitation(',
        'deps.generateEmailChange(',
        'deps.verifyCurrent(',
        'deps.sendMail('
      ]) {
        expect(CONFIRMATION_CODE.indexOf(effect), effect).toBeGreaterThan(read);
      }
    });

    it('takes the account’s and the address’s slot through the one database function, and gives back the address’s alone', () => {
      const take = dependencyBody('takeSlot', 'addressConfirmationDeps');
      expect(take).toContain("admin().rpc('address_confirmation_request', {");
      expect(take).toContain('p_user_id: userId');
      expect(take).toContain('return data === true;');
      const release = dependencyBody('releaseSlot', 'addressConfirmationDeps');
      expect(release).toContain("admin().rpc('address_confirmation_release', { p_email: email })");
      expect(release).not.toContain('p_code');
      expect(count(CODE, "'address_confirmation_request'")).toBe(1);
      const projectCheck = CONFIRMATION_CODE.indexOf(
        "if (!registeredIn(account, request.projectId)) return 'refused';"
      );
      expect(projectCheck).toBeGreaterThan(-1);
      expect(projectCheck).toBeLessThan(CONFIRMATION_CODE.indexOf('deps.takeSlot('));
    });

    it('asks whether an open invitation holds the address through the one database function, after the slot and before any link, refusing an answer that is not a boolean', () => {
      const check = dependencyBody('addressHoldsOpenInvitation', 'addressConfirmationDeps');
      expect(check).toContain("admin().rpc('address_holds_open_invitation', {");
      expect(check).toContain('p_project_id: projectId');
      expect(check).toContain('p_email: email');
      expect(check).toContain("if (typeof data !== 'boolean')");
      expect(count(CODE, "'address_holds_open_invitation'")).toBe(1);
      const asked = CONFIRMATION_CODE.indexOf('deps.addressHoldsOpenInvitation(');
      expect(asked).toBeGreaterThan(CONFIRMATION_CODE.indexOf('deps.takeSlot('));
      expect(asked).toBeLessThan(CONFIRMATION_CODE.indexOf('deps.generateEmailChange('));
    });

    it('mails through the one transport the link issue uses', () => {
      expect(functionBody('addressConfirmationDeps')).toMatch(/^\s{4}sendMail,$/m);
      expect(functionBody('linkIssueDeps')).toMatch(/^\s{4}sendMail,$/m);
    });
  });

  describe('the mail', () => {
    it('reaches the transport only through the one sendMail function', () => {
      const send = functionBody('sendMail');
      expect(count(CODE, '.sendMail(')).toBe(1);
      expect(count(CODE, 'createTransport(')).toBe(1);
      expect(send).toContain('nodemailer.createTransport(');
      expect(send).toContain('await transport.sendMail(');
      expect(count(CODE, 'nodemailer.')).toBe(1);
    });

    it('takes its recipient, subject and parts from its caller and its sender from configuration', () => {
      const send = functionBody('sendMail');
      expect(send).toContain('async function sendMail({ to, subject, text, html }: OutgoingMail)');
      expect(send).toContain("from: requireEnv('SMTP_FROM', Deno.env.get('SMTP_FROM'))");
      expect(send).not.toContain('request');
      expect(send).not.toMatch(/\b(cc|bcc|replyTo)\b/);
    });
  });

  describe('the origin of the link', () => {
    it('reads SITE_URL through requireEnv, once, for both kinds of mail', () => {
      expect(functionBody('configuredSiteUrl')).toContain("return requireEnv('SITE_URL', Deno.env.get('SITE_URL'));");
      expect(count(CODE, "Deno.env.get('SITE_URL')")).toBe(1);
      expect(count(CODE, 'siteUrl: configuredSiteUrl(),')).toBe(2);
    });

    it('reads nothing of the request but its method, its body and its Authorization, once, for the address confirmation and the witness', () => {
      const read = new Set(Array.from(CODE.matchAll(/\breq\.(\w+)/g)).map((match) => match[1]));
      expect([...read].sort()).toEqual(['headers', 'json', 'method']);
      expect(count(CODE, 'req.headers')).toBe(1);
      expect(CODE).toContain("const authorization = req.headers.get('Authorization');");
      expect(branchOf('confirm-address')).toContain('bearerToken(authorization)');
      expect(CODE).toContain("admitWitness(parsed, authorization, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'))");
      expect(count(CODE, 'admitWitness(')).toBe(1);
      expect(CODE).not.toMatch(/\breq\s*\[/);
      expect(CODE).not.toMatch(/\brequest\.headers\b/);
    });

    it('names none of the headers a caller could set an origin with', () => {
      expect(CODE).not.toMatch(/['"`](origin|referer|host|x-forwarded-host|x-forwarded-for|x-real-ip)['"`]/i);
    });

    it('reads two headers only, the Location of the redirect question and the caller’s Authorization', () => {
      const headerReads = Array.from(CODE.matchAll(/(\w+)\.headers\.get\(\s*'([^']*)'\s*\)/g)).map(
        (match) => `${match[1]}:${match[2]}`
      );
      expect(headerReads).toEqual(['response:location', 'req:Authorization']);
    });
  });

  describe('the project', () => {
    it('reads no project from its environment', () => {
      const literalReads = Array.from(CODE.matchAll(/Deno\.env\.get\(\s*'([A-Z0-9_]+)'\s*\)/g)).map(
        (match) => match[1]
      );
      expect(literalReads.length).toBe(count(CODE, 'Deno.env.get('));
      expect([...new Set(literalReads)].sort()).toEqual([
        'SITE_URL',
        'SMTP_FROM',
        'SMTP_HOST',
        'SMTP_PASS',
        'SMTP_PORT',
        'SMTP_USER',
        'SUPABASE_ANON_KEY',
        'SUPABASE_SERVICE_ROLE_KEY',
        'SUPABASE_URL'
      ]);
      expect(INDEX_SOURCE).not.toMatch(/PROJECT_ID/);
    });

    it('passes the request’s project to every database function that takes one', () => {
      const passed = Array.from(CODE.matchAll(/p_project_id:\s*([\w.]+)/g)).map((match) => match[1]);
      expect(passed.length).toBe(7);
      for (const value of passed) expect(['request.projectId', 'projectId']).toContain(value);
    });
  });

  describe('clients and sessions', () => {
    it('builds every client with persistSession and autoRefreshToken off', () => {
      const sessionless = Array.from(
        CODE.matchAll(/createClient\([^;]*?auth: \{ persistSession: false, autoRefreshToken: false \}/g)
      );
      expect(count(CODE, 'createClient(')).toBe(3);
      expect(sessionless).toHaveLength(3);
    });

    it('signs in on a client made inside the operation, with the public key', () => {
      const signIn = functionBody('codeSignIn');
      expect(signIn).toContain("createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {");
      expect(signIn).toContain('visitor.auth.signInWithPassword(');
      expect(count(CODE, 'signInWithPassword(')).toBe(1);
      expect(signIn).not.toContain('SERVICE_ROLE');
    });

    it('answers every failure of a code sign-in with the one body and never returns the claimant', () => {
      const signIn = functionBody('codeSignIn');
      const answers = Array.from(signIn.matchAll(/return answer\(([^,]+), (\d+)\)/g)).map(
        (match) => `${match[1]} ${match[2]}`
      );
      expect(answers).toEqual([
        'INVALID_CREDENTIALS_BODY 200',
        'INVALID_CREDENTIALS_BODY 200',
        'INVALID_CREDENTIALS_BODY 200',
        'signedInBody(session) 200',
        'INVALID_CREDENTIALS_BODY 200'
      ]);
      expect(signIn).not.toMatch(/answer\([^)]*claimant/);
    });

    it('holds no module-level let or var', () => {
      expect(CODE).not.toMatch(/^(let|var)\s/m);
      expect(LINK_ISSUE_CODE).not.toMatch(/^(let|var)\s/m);
      expect(CONFIRMATION_CODE).not.toMatch(/^(let|var)\s/m);
    });
  });

  describe('the memory of the deployment checks', () => {
    /** Every module-level `const` with an initialiser, as `[name, the start of its initialiser]`. */
    const moduleConstants = Array.from(CODE.matchAll(/^const (\w+) = (.*)$/gm)).map((match) => [match[1], match[2]]);

    it('is the only module-level state: two holders made by createExpiringPositive', () => {
      const holders = moduleConstants.filter(([, initialiser]) => initialiser.startsWith('createExpiringPositive('));
      expect(holders).toEqual([
        ['signUpClosedMemory', 'createExpiringPositive(SIGN_UP_CHECK_TTL_MS, () => Date.now());'],
        ['redirectAdmittedMemory', 'createExpiringPositive(REDIRECT_CHECK_TTL_MS, () => Date.now());']
      ]);
      expect(count(CODE, 'createExpiringPositive(')).toBe(2);

      const others = moduleConstants.filter(([, initialiser]) => !initialiser.startsWith('createExpiringPositive('));
      for (const [name, initialiser] of others) {
        expect(initialiser, `the module-level constant ${name} is neither a literal nor the frozen header set`).toMatch(
          /^('[^']*';|\d+;|Object\.freeze\(\{)$/
        );
      }
    });

    it('holds no boolean, Map or Set that could remember a check for a worker’s lifetime', () => {
      expect(CODE).not.toMatch(/new (Map|Set|WeakMap|WeakSet)\b/);
      expect(CODE).not.toMatch(/^(?:const|let|var) \w+(?:: \w+)? = (?:true|false)\b/m);
      expect(CODE).not.toMatch(/^(?:const|let|var) \w+(?:: [^=]+)? = (?:\[|\{)/m);
    });

    it('believes a closed sign-up for the bounded lifetime, and only a positive answer', () => {
      const check = dependencyBody('signUpClosed');
      expect(SIGN_UP_CHECK_TTL_MS).toBeLessThanOrEqual(60000);
      expect(check).toContain('if (signUpClosedMemory.isFresh(SIGN_UP_KEY)) return true;');
      expect(check).toContain('/auth/v1/settings');
      expect(check).toContain('isSignUpClosed(await response.json())');
      expect(check).toContain('if (closed) signUpClosedMemory.remember(SIGN_UP_KEY);');
      expect(count(CODE, 'signUpClosedMemory.remember(')).toBe(1);
    });

    it('believes an admitted callback URL per URL, for its own lifetime, and only a positive answer', () => {
      const check = dependencyBody('redirectAdmitted');
      expect(REDIRECT_CHECK_TTL_MS).toBe(600000);
      expect(check).toContain('if (redirectAdmittedMemory.isFresh(callbackUrl)) return true;');
      expect(check).toContain("redirect: 'manual'");
      expect(check).toContain(
        "isRedirectAdmitted({ requested: callbackUrl, location: response.headers.get('location') })"
      );
      expect(check).toContain('if (admitted) redirectAdmittedMemory.remember(callbackUrl);');
      expect(count(CODE, 'redirectAdmittedMemory.remember(')).toBe(1);
    });
  });

  describe('the log', () => {
    /** The identifiers that hold an address, a code, a password, a token or a request anywhere in the handler. */
    const SENSITIVE = [
      'recipient',
      'claimant',
      'address',
      'email',
      'to',
      'code',
      'password',
      'tokenHash',
      'hashed_token',
      'session',
      'signedIn',
      'data',
      'request',
      'body',
      'link'
    ];

    it('is written in one place, with the fixed prefix first', () => {
      expect(CODE).toContain("const LOG_PREFIX = 'account-access:';");
      expect(count(CODE, 'console.')).toBe(1);
      expect(functionBody('log')).toContain('console.error(`${LOG_PREFIX} ${message}${suffix}`);');
    });

    it('serialises only the failure detail it was handed', () => {
      expect(functionBody('log')).toContain('JSON.stringify(detail)');
      expect(count(CODE, 'JSON.stringify(')).toBe(3);
      expect(functionBody('answer')).toContain('JSON.stringify(body)');
      expect(dependencyBody('verifyCurrent', 'addressConfirmationDeps')).toContain('JSON.stringify(');
    });

    it('is called with a fixed message and, at most, the name and code of a caught failure', () => {
      const calls = Array.from(CODE.matchAll(/(?<![\w.])log\((.*)\);$/gm)).map((match) => match[1]);
      expect(calls.length).toBeGreaterThan(3);
      for (const args of calls) {
        expect(args, `a log call with the arguments ${args}`).toMatch(
          /^'[^'$]*'(, describeFailure\((error|lookupError)\))?$/
        );
      }
    });

    it('receives none of the identifiers that hold an address, a code, a password or a token', () => {
      const calls = Array.from(CODE.matchAll(/(?<![\w.])log\((.*)\);$/gm)).map((match) =>
        match[1].replace(/'[^']*'/g, '')
      );
      for (const args of calls) {
        for (const identifier of SENSITIVE) {
          expect(args, `the identifier ${identifier} in a log call`).not.toMatch(new RegExp(`\\b${identifier}\\b`));
        }
      }
    });

    it('holds the same rule inside the link issue', () => {
      expect(LINK_ISSUE_CODE).not.toContain('console.');
      const calls = Array.from(LINK_ISSUE_CODE.matchAll(/\bsay\(deps, (.*)\);$/gm)).map((match) => match[1]);
      expect(calls.length).toBeGreaterThan(3);
      for (const args of calls) {
        expect(args, `a log call with the arguments ${args}`).toMatch(
          /^'[^'$]*'(, describeFailure\((error|releaseError|witnessError)\))?$/
        );
      }
      expect(count(LINK_ISSUE_CODE, 'deps.log(')).toBe(2);
    });

    it('holds the same rule inside the address confirmation', () => {
      expect(CONFIRMATION_CODE).not.toContain('console.');
      const calls = Array.from(CONFIRMATION_CODE.matchAll(/\bsay\(\s*deps,\s*([\s\S]*?)\);$/gm)).map((match) =>
        match[1].replace(/\s+/g, ' ').trim()
      );
      expect(calls.length).toBeGreaterThan(4);
      for (const args of calls) {
        expect(args, `a log call with the arguments ${args}`).toMatch(
          /^'[^'$]*',? ?(describeFailure\((error|releaseError)\),?)?$/
        );
      }
      expect(count(CONFIRMATION_CODE, 'deps.log(')).toBe(2);
    });
  });
});
