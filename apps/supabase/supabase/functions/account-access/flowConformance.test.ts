/**
 * Source-level conformance of the account-access handler: the hazards its source must not hold.
 *
 * `index.ts` imports `@supabase/supabase-js` and `nodemailer` through `npm:` specifiers and names the Deno global, so vitest cannot import it and none of these properties has a runtime to observe here. They are asserted against the module's source text, with comments removed wherever the assertion is about code.
 *
 * Each case forbids one named hazard: an `await` before the uniform answer, a user created by a direct call, an address confirmed on the service's word, a header a caller could steer a link with, a project other than the deployment's, state about a caller kept by a worker, a secret in a log line. A test that ran the handler against stubs would show what the stubs were handed, not what the source can do. Where a property is about every occurrence of something, two counts of the source are compared rather than a count and a constant.
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

/** The text of a top-level function of a module's code, from its declaration to the closing brace at column 0. */
function functionBody(name: string, code = CODE): string {
  const start = code.search(new RegExp(`^(?:async )?function ${name}\\(`, 'm'));
  expect(start, `function ${name} was not found`).toBeGreaterThan(-1);
  const end = code.indexOf('\n}\n', start);
  expect(end).toBeGreaterThan(start);
  return code.slice(start, end);
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
    expect(CODE).toContain('parseAccountAccessRequest(');
  });

  it('cannot drift from send-email’s remote dependencies: its `npm:` imports are send-email’s, at the same versions, and it imports nothing by URL', () => {
    const mine = npmImports(INDEX_SOURCE);
    expect(mine.length).toBeGreaterThan(0);
    expect(mine).toEqual(npmImports(SEND_EMAIL_SOURCE));
    expect(INDEX_SOURCE).not.toMatch(/from\s*['"`](https?:\/\/|jsr:)/);
  });

  describe.each(LINK_OPERATIONS)('the uniform answer of $operation', ({ operation, background, issuer }) => {
    it(`cannot let its timing tell an address apart: no await in the ${operation} branch, and its one return after the hand-off to EdgeRuntime.waitUntil`, () => {
      const branch = branchOf(operation);
      const handOff = branch.indexOf('EdgeRuntime.waitUntil(');
      expect(handOff).toBeGreaterThan(-1);
      expect(branch.indexOf('return ')).toBeGreaterThan(handOff);
      expect(count(branch, 'return ')).toBe(1);
      expect(branch).not.toMatch(/\bawait\b/);
    });

    it(`cannot reject after the answer: the background function of ${operation} calls its issuer inside a try with a catch`, () => {
      const body = functionBody(background);
      const tried = body.indexOf('try {');
      const issued = body.indexOf(`${issuer}(`);
      expect(tried).toBeGreaterThan(-1);
      expect(issued).toBeGreaterThan(tried);
      expect(body.indexOf('catch', issued)).toBeGreaterThan(issued);
    });
  });

  describe('accounts', () => {
    it('creates no user by the admin API’s direct calls', () => {
      const directCalls = ['create' + 'User', 'inviteUser' + 'ByEmail'];
      expect(SOURCES.length).toBeGreaterThan(5);
      for (const [name, code] of SOURCES) {
        for (const call of directCalls) expect(code, name).not.toContain(call);
      }
    });

    it('creates no account for a recovery request: the recovery arm of the issue never calls the account-creating dependency', () => {
      const start = LINK_ISSUE_CODE.indexOf("if (mail === 'recovery') {");
      expect(start).toBeGreaterThan(-1);
      const end = LINK_ISSUE_CODE.indexOf('} else {', start);
      expect(end).toBeGreaterThan(start);
      const arm = LINK_ISSUE_CODE.slice(start, end);
      expect(arm).toContain('deps.mintRecoveryToken(');
      expect(arm).not.toContain('createPasswordlessUser');
    });

    it('mails no token of an invite: the call that creates the user reads no data of its answer', () => {
      const invite = CODE.split('\n').filter((line) => line.includes("type: 'invite'"));
      expect(invite.length).toBeGreaterThan(0);
      for (const line of invite) {
        expect(line).not.toMatch(/\bdata\b/);
        expect(line).not.toContain('hashed_token');
      }
    });
  });

  describe('no address becomes an account’s by any route but the mailed link', () => {
    /** Every admin update in the function's modules whose arguments carry an email key, as `file: arguments`. */
    const carrying = SOURCES.flatMap(([name, code]) =>
      Array.from(code.matchAll(/updateUserById\(([^;]*?)\)\s*;/gs))
        .map((match) => match[1])
        .filter((args) => /\bemail\b/.test(args))
        .map((args) => `${name}: ${args}`)
    );

    it('writes no typed address to an account: the one admin update carrying an address is guarded to the placeholder, and no update goes through the caller’s own session', () => {
      expect(carrying).toHaveLength(1);
      expect(carrying[0].startsWith('index.ts: ')).toBe(true);
      const guard = CODE.indexOf('if (!isPlaceholderEmail(email)) throw');
      expect(guard).toBeGreaterThan(-1);
      expect(guard).toBeLessThan(CODE.indexOf('updateUserById('));
      for (const [name, code] of SOURCES) expect(code, `a user update in ${name}`).not.toMatch(/\bupdateUser\(/);
    });

    it('confirms no address on the service’s word: email_confirm only in the admin update that puts the placeholder back', () => {
      const confirming = SOURCES.reduce(
        (total, [, code]) => total + (code.match(/\bemail_confirm\b/g)?.length ?? 0),
        0
      );
      expect(confirming).toBe(carrying.length);
      expect(carrying[0]).toContain('email_confirm');
    });

    it('verifies no token with the service role’s key: the effects of the address confirmation name neither the key nor an Authorization header', () => {
      expect(functionBody('addressConfirmationDeps')).not.toMatch(/SERVICE_ROLE|Authorization/);
    });
  });

  describe('the address confirmation', () => {
    it('cannot answer before its work: its branch hands nothing to the runtime', () => {
      expect(branchOf('confirm-address')).not.toContain('EdgeRuntime');
    });

    it('lets no body name the user: the caller is read from the auth service by their own token', () => {
      expect(CODE).toContain('getUser(token)');
      expect(CODE).not.toMatch(/request\.(userId|user_id)/);
    });

    it('makes no service-role client before the caller’s token is accepted: the client is made lazily, and every effect comes after the caller is read', () => {
      const deps = functionBody('addressConfirmationDeps');
      expect(deps).toMatch(/\?\?=\s*createAdminClient\(\)/);
      expect(deps).not.toMatch(/(?<!\?\?)=\s*createAdminClient\(\)/);
      const read = CONFIRMATION_CODE.indexOf('deps.callerAccount(');
      expect(read).toBeGreaterThan(-1);
      for (const effect of [
        'deps.takeSlot(',
        'deps.emailInvitationHold(',
        'deps.generateEmailChange(',
        'deps.verifyCurrent(',
        'deps.sendMail('
      ]) {
        expect(CONFIRMATION_CODE.indexOf(effect), effect).toBeGreaterThan(read);
      }
    });

    it('says nothing of an invitation without a slot: the invitation-hold question comes after the slot and before any link', () => {
      const asked = CONFIRMATION_CODE.indexOf('deps.emailInvitationHold(');
      expect(asked).toBeGreaterThan(CONFIRMATION_CODE.indexOf('deps.takeSlot('));
      expect(asked).toBeLessThan(CONFIRMATION_CODE.indexOf('deps.generateEmailChange('));
    });
  });

  describe('the mail', () => {
    it('cannot bypass the configured transport: every transport and every send is in the one sendMail function', () => {
      const send = functionBody('sendMail');
      expect(count(send, 'createTransport(')).toBeGreaterThan(0);
      expect(count(send, 'createTransport(')).toBe(count(CODE, 'createTransport('));
      expect(count(send, '.sendMail(')).toBe(count(CODE, '.sendMail('));
    });

    it('cannot send as a sender a caller chose, or to a recipient it did not name: the sender is the configured one, and there is no copy', () => {
      const send = functionBody('sendMail');
      expect(send).toMatch(/from: configuredSender\(/);
      expect(send).not.toContain('request');
      expect(send).not.toMatch(/\b(cc|bcc|replyTo)\b/);
    });
  });

  describe('the request', () => {
    it('cannot steer a link with a header: it names none of the headers a caller could set an origin with', () => {
      expect(CODE).not.toMatch(/['"`](origin|referer|host|x-forwarded-host|x-forwarded-for|x-real-ip)['"`]/i);
    });

    it('reads no request header but Authorization, and no answer header but the Location of the redirect question', () => {
      const headerReads = Array.from(CODE.matchAll(/(\w+)\.headers\.get\(\s*'([^']*)'\s*\)/g)).map(
        (match) => `${match[1]}:${match[2]}`
      );
      expect(headerReads.sort()).toEqual(['req:Authorization', 'response:location']);
      expect(count(CODE, '.headers.get(')).toBe(headerReads.length);
      expect(CODE).not.toMatch(/\breq\s*\[/);
      expect(CODE).not.toMatch(/\brequest\.headers\b/);
    });
  });

  describe('the project', () => {
    it('reads nothing from its environment but the deployment’s project, the site, the mail transport and the platform’s three', () => {
      const literalReads = Array.from(CODE.matchAll(/Deno\.env\.get\(\s*'([A-Z0-9_]+)'\s*\)/g)).map(
        (match) => match[1]
      );
      expect(literalReads.length).toBe(count(CODE, 'Deno.env.get('));
      expect([...new Set(literalReads)].sort()).toEqual([
        'PUBLIC_PROJECT_ID',
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
    });

    it('serves the deployment’s project alone: the configured project is required, and compared with the parsed request before any operation is answered', () => {
      expect(CODE).toMatch(/requireEnv\(\s*'PUBLIC_PROJECT_ID'/);
      const handler = functionBody('handleRequest');
      const parsedAt = handler.indexOf('parseAccountAccessRequest(');
      const checkedAt = handler.indexOf('servesProject(');
      expect(parsedAt).toBeGreaterThan(-1);
      expect(checkedAt).toBeGreaterThan(parsedAt);
      for (const later of ['admitWitness(', 'request.operation ===']) {
        expect(handler.indexOf(later), later).toBeGreaterThan(checkedAt);
      }
      expect(functionBody('servesProject')).toContain('isDeploymentProject(');
    });

    it('asks the database about no project but the request’s', () => {
      const passed = Array.from(CODE.matchAll(/p_project_id:\s*([\w.]+)/g)).map((match) => match[1]);
      expect(passed.length).toBeGreaterThan(0);
      expect(passed.length).toBe(count(CODE, 'p_project_id'));
      for (const value of passed) expect(['request.projectId', 'projectId']).toContain(value);
    });
  });

  describe('clients and sessions', () => {
    it('keeps no session in a worker: every client is built with persistSession and autoRefreshToken off', () => {
      const sessionless = Array.from(
        CODE.matchAll(/createClient\([^;]*?auth: \{ persistSession: false, autoRefreshToken: false \}/g)
      );
      expect(sessionless.length).toBeGreaterThan(0);
      expect(sessionless).toHaveLength(count(CODE, 'createClient('));
    });

    it('checks no password with the service role’s key, and never answers with the claimant', () => {
      const signIn = functionBody('codeSignIn');
      expect(signIn).toContain('signInWithPassword(');
      expect(signIn).not.toContain('SERVICE_ROLE');
      expect(signIn).not.toMatch(/answer\([^)]*claimant/);
    });

    it('keeps no state about a caller at module level: no module-level let or var', () => {
      expect(CODE).not.toMatch(/^(let|var)\s/m);
      expect(LINK_ISSUE_CODE).not.toMatch(/^(let|var)\s/m);
      expect(CONFIRMATION_CODE).not.toMatch(/^(let|var)\s/m);
    });
  });

  describe('the memory of the deployment checks', () => {
    /** Every module-level `const` with an initialiser, as `[name, the start of its initialiser]`. */
    const moduleConstants = Array.from(CODE.matchAll(/^const (\w+) = (.*)$/gm)).map((match) => [match[1], match[2]]);

    it('keeps no state about a caller at module level: every module constant is a literal, the frozen header set or an expiring memory of a deployment check', () => {
      expect(moduleConstants.length).toBeGreaterThan(0);
      for (const [name, initialiser] of moduleConstants) {
        expect(initialiser, `the module-level constant ${name}`).toMatch(
          /^('[^']*';|\d+;|Object\.freeze\(\{|createExpiringPositive\((SIGN_UP|REDIRECT)_CHECK_TTL_MS, )/
        );
      }
    });

    it('holds no boolean, Map or Set that could remember a check for a worker’s lifetime', () => {
      expect(CODE).not.toMatch(/new (Map|Set|WeakMap|WeakSet)\b/);
      expect(CODE).not.toMatch(/^(?:const|let|var) \w+(?:: \w+)? = (?:true|false)\b/m);
      expect(CODE).not.toMatch(/^(?:const|let|var) \w+(?:: [^=]+)? = (?:\[|\{)/m);
    });

    it('cannot keep a reopened sign-up closed: a memory forgets within its bounded lifetime and remembers only a positive answer', () => {
      expect(SIGN_UP_CHECK_TTL_MS).toBeLessThanOrEqual(60000);
      expect(REDIRECT_CHECK_TTL_MS).toBeLessThanOrEqual(600000);
      const remembered = count(CODE, 'Memory.remember(');
      expect(remembered).toBeGreaterThan(0);
      expect(Array.from(CODE.matchAll(/if \((closed|admitted)\) \w+Memory\.remember\(/g))).toHaveLength(remembered);
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

    it('cannot be written around its prefix: every console call is in the one log function', () => {
      expect(count(functionBody('log'), 'console.')).toBeGreaterThan(0);
      expect(count(functionBody('log'), 'console.')).toBe(count(CODE, 'console.'));
      expect(functionBody('log')).toContain('${LOG_PREFIX}');
    });

    it('cannot carry a value: it is called with a fixed message and, at most, the name and code of a caught failure', () => {
      const calls = Array.from(CODE.matchAll(/(?<![\w.])log\((.*)\);$/gm)).map((match) => match[1]);
      expect(calls.length).toBeGreaterThan(0);
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

    it('cannot carry a value inside the link issue either', () => {
      expect(LINK_ISSUE_CODE).not.toContain('console.');
      const calls = Array.from(LINK_ISSUE_CODE.matchAll(/\bsay\(deps, (.*)\);$/gm)).map((match) => match[1]);
      expect(calls.length).toBeGreaterThan(0);
      for (const args of calls) {
        expect(args, `a log call with the arguments ${args}`).toMatch(
          /^'[^'$]*'(, describeFailure\((error|releaseError|witnessError)\))?$/
        );
      }
      expect(count(functionBody('say', LINK_ISSUE_CODE), 'deps.log(')).toBe(count(LINK_ISSUE_CODE, 'deps.log('));
    });

    it('cannot carry a value inside the address confirmation either', () => {
      expect(CONFIRMATION_CODE).not.toContain('console.');
      const calls = Array.from(CONFIRMATION_CODE.matchAll(/\bsay\(\s*deps,\s*([\s\S]*?)\);$/gm)).map((match) =>
        match[1].replace(/\s+/g, ' ').trim()
      );
      expect(calls.length).toBeGreaterThan(0);
      for (const args of calls) {
        expect(args, `a log call with the arguments ${args}`).toMatch(
          /^'[^'$]*',? ?(describeFailure\((error|releaseError)\),?)?$/
        );
      }
      expect(count(functionBody('say', CONFIRMATION_CODE), 'deps.log(')).toBe(count(CONFIRMATION_CODE, 'deps.log('));
    });
  });
});
