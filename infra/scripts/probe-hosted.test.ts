/**
 * The hosted conformance probe: its comparisons as pure functions, and its entry run as a child process against a stub
 * Management API on 127.0.0.1. The child gets a minimal environment, so no access token of the shell that runs the
 * suite reaches it, and it talks to the stub only.
 */

import { spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { CHECKS, runChecks } from './probe/checks.mjs';
import { ProbeInputError, readExpected } from './probe/expected.mjs';
import { collect } from './probe/sources.mjs';
import type { IncomingMessage, Server, ServerResponse } from 'node:http';
import type { AddressInfo } from 'node:net';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '../..');
const ENTRY = join(HERE, 'probe-hosted.mjs');
const STAGING_ROOT = join(REPO_ROOT, 'infra/envs/staging/supabase');
const EXAMPLE_ROOT = join(REPO_ROOT, 'infra/envs/example/supabase');

const REF = 'abcdefghijklmnopqrst';
const STUB_JWT_SECRET = 'stub-jwt-secret-do-not-print-4f1c9a';
const STUB_SMTP_PASS = 'stub-smtp-pass-do-not-print-77b2e0';
const STUB_SMTP_USER = 'STUBSMTPUSERDONOTPRINT';
const TEST_TOKEN = 'probe-test-value';
const STUB_KEYS = [
  { type: 'legacy', name: 'anon', value: 'stub-anon-key-value-do-not-print-91d0' },
  { type: 'legacy', name: 'service_role', value: 'stub-service-role-value-do-not-print-3e5a' },
  { type: 'publishable', name: 'default', value: 'sb_publishable_stubvaluedonotprint' },
  { type: 'secret', name: 'default', value: 'sb_secret_stubvaluedonotprint' }
];

const FIXTURE_ORIGIN = 'https://probe.example.org';
const FIXTURE_ADMIN_EMAIL = 'noreply@probe.example.org';
const FIXTURE_TFVARS = `project_ref              = "${REF}" # the stub's project
public_origin            = "${FIXTURE_ORIGIN}"
enable_access_token_hook = true
enable_send_email_hook   = true

smtp = {
  host = "email-smtp.eu-north-1.amazonaws.com"
  # The port the hosted service can reach.
  port        = "2587"
  admin_email = "${FIXTURE_ADMIN_EMAIL}"
  sender_name = "OpenVAA"
}
`;

/** The paste screen every stdout line must pass, written out here independently of the probe's own. */
const SCREEN = [
  { rule: 'no =', re: /=/ },
  { rule: 'no @', re: /@/ },
  { rule: 'no run of 32 or more hexadecimal digits', re: /[0-9A-Fa-f]{32,}/ },
  {
    rule: 'no secret word directly followed by : or =',
    re: /(?:^|[^A-Za-z])(?:secret|secrets|password|passwd|pass|pwd|token|tokens|key|keys|credential|bearer|authorization)[:=]/i
  }
];

function expectPasteSafe(stdout: string): void {
  for (const line of stdout.split('\n').filter((l) => l !== '')) {
    for (const { rule, re } of SCREEN) expect(re.test(line), `${rule}: ${line}`).toBe(false);
  }
}

// ── Fixtures ──

type JsonObject = Record<string, unknown>;

interface Expected {
  ref: string;
  maxRows: { json: number; pageSize: number };
  publicOrigin: string;
  hooks: { accessToken: boolean; sendEmail: boolean };
  smtp: { host: string; port: string; admin_email: string; sender_name: string } | null;
  auth: JsonObject;
  authHook: JsonObject;
  authSendEmailHook: JsonObject;
  redirectPaths: Array<string>;
  oauthServer: { enabled: boolean; allow_dynamic_registration: boolean };
  api: { db_schema: string; db_extra_search_path: string };
  functions: Array<{ slug: string; verifyJwt: boolean }>;
}

interface Responses {
  management: {
    postgrest: JsonObject;
    auth: JsonObject;
    functions: Array<JsonObject>;
    keys: JsonObject;
  };
}

let fixtureRoot: string;
let fixtureExpected: Expected;

beforeAll(() => {
  fixtureRoot = mkdtempSync(join(tmpdir(), 'probe-hosted-root-'));
  writeFileSync(join(fixtureRoot, 'terraform.tfvars'), FIXTURE_TFVARS);
  fixtureExpected = readExpected({ root: fixtureRoot }) as Expected;
});

afterAll(() => {
  rmSync(fixtureRoot, { recursive: true, force: true });
});

/** What a project that conforms to `expected` serves, in the shape `collect` returns. */
function correctResponses(expected: Expected): Responses {
  const origin = expected.publicOrigin;
  return {
    management: {
      postgrest: {
        max_rows: expected.maxRows.json,
        db_schema: expected.api.db_schema,
        db_extra_search_path: expected.api.db_extra_search_path
      },
      auth: {
        ...expected.auth,
        ...expected.authHook,
        ...expected.authSendEmailHook,
        site_url: origin,
        uri_allow_list: expected.redirectPaths.map((p) => `${origin}${p}`).join(','),
        smtp_host: expected.smtp?.host ?? null,
        smtp_port: expected.smtp?.port ?? null,
        smtp_admin_email: expected.smtp?.admin_email ?? null,
        smtp_sender_name: expected.smtp?.sender_name ?? null,
        smtp_user_present: expected.smtp !== null,
        oauth_server_enabled: expected.oauthServer.enabled,
        oauth_server_allow_dynamic_registration: expected.oauthServer.allow_dynamic_registration
      },
      functions: expected.functions.map(({ slug, verifyJwt }) => ({ slug, status: 'ACTIVE', verify_jwt: verifyJwt })),
      keys: { issued: [], legacy: 'enabled' }
    }
  };
}

/** `correctResponses` with the given served functions list. */
function withFunctions(functions: Array<JsonObject>, expected: Expected = fixtureExpected): Responses {
  const responses = correctResponses(expected);
  responses.management.functions = functions;
  return responses;
}

/** The served functions list of a conforming project, with `change` applied to the entry of one slug. */
function functionsWith(slug: string, change: JsonObject | null): Array<JsonObject> {
  return correctResponses(fixtureExpected).management.functions.flatMap((entry) =>
    entry.slug !== slug ? [entry] : change === null ? [] : [{ ...entry, ...change }]
  );
}

/**
 * Every planted fault of the batched break at once, one per check, with the marker each finding must hold. These are
 * the faults the live red run plants on the throwaway project.
 */
const BATCHED_BREAK: Array<{ check: string; marker: string }> = [
  { check: 'api.max-rows', marker: '500' },
  { check: 'auth.access-token-hook', marker: 'hook_custom_access_token_enabled is false' },
  { check: 'auth.send-email-hook', marker: 'hook_send_email_enabled is false' },
  { check: 'auth.site-url', marker: 'planted.invalid' },
  { check: 'auth.redirects', marker: '1 entry' },
  { check: 'auth.signup-closed', marker: 'disable_signup is false' },
  { check: 'auth.email-confirm', marker: 'mailer_autoconfirm is true' },
  { check: 'auth.smtp', marker: '2465' },
  { check: 'auth.oauth-server', marker: 'oauth_server_enabled is true' },
  { check: 'auth.other-settings', marker: 'password_min_length is 12' },
  { check: 'api.schemas', marker: 'db_schema is "public"' },
  { check: 'functions.deployed', marker: 'send-email' },
  { check: 'functions.verify-jwt', marker: 'identity-callback' }
];

function batchedBreak(expected: Expected = fixtureExpected): Responses {
  const responses = correctResponses(expected);
  const m = responses.management;
  m.postgrest = { ...m.postgrest, max_rows: 500, db_schema: 'public' };
  m.auth = {
    ...m.auth,
    hook_custom_access_token_enabled: false,
    hook_send_email_enabled: false,
    site_url: 'https://planted.invalid',
    uri_allow_list: `${expected.publicOrigin}${expected.redirectPaths[0]}`,
    disable_signup: false,
    mailer_autoconfirm: true,
    smtp_port: '2465',
    oauth_server_enabled: true,
    oauth_server_allow_dynamic_registration: true,
    password_min_length: 12
  };
  m.functions = m.functions
    .filter((entry) => entry.slug !== 'send-email')
    .map((entry) => (entry.slug === 'identity-callback' ? { ...entry, verify_jwt: true } : entry));
  return responses;
}

/** `correctResponses` with the given served auth fields replaced. */
function withAuth(fields: JsonObject, expected: Expected = fixtureExpected): Responses {
  const responses = correctResponses(expected);
  responses.management.auth = { ...responses.management.auth, ...fields };
  return responses;
}

function results(responses: Responses, expected: Expected = fixtureExpected): ReturnType<typeof runChecks> {
  return runChecks(expected, responses);
}

function failing(responses: Responses, expected: Expected = fixtureExpected): Array<string> {
  return results(responses, expected)
    .filter((r) => !r.pass)
    .map((r) => r.name);
}

function finding(responses: Responses, name: string, expected: Expected = fixtureExpected): string {
  const result = results(responses, expected).find((r) => r.name === name);
  expect(result, name).toBeDefined();
  return result?.finding ?? '';
}

// ── readExpected ──

describe('readExpected', () => {
  it('reads the staging root', () => {
    const expected = readExpected({ root: STAGING_ROOT }) as Expected;
    expect(expected.ref).toMatch(/^[a-z]{20}$/);
    expect(expected.publicOrigin).toMatch(/^https:\/\//);
    expect(typeof expected.hooks.accessToken).toBe('boolean');
    expect(typeof expected.hooks.sendEmail).toBe('boolean');
  });

  it("reads the fixture root's origin, hook switches and smtp object", () => {
    expect(fixtureExpected.publicOrigin).toBe(FIXTURE_ORIGIN);
    expect(fixtureExpected.hooks).toEqual({ accessToken: true, sendEmail: true });
    expect(fixtureExpected.smtp).toEqual({
      host: 'email-smtp.eu-north-1.amazonaws.com',
      port: '2587',
      admin_email: FIXTURE_ADMIN_EMAIL,
      sender_name: 'OpenVAA'
    });
  });

  it("reads the example root's multi-line smtp object, with its comment lines", () => {
    // The example's project_ref is a stand-in that is no project ref, so a copy with a ref of the right form is read.
    const root = mkdtempSync(join(tmpdir(), 'probe-hosted-'));
    try {
      const text = readFileSync(join(EXAMPLE_ROOT, 'terraform.tfvars'), 'utf8');
      writeFileSync(join(root, 'terraform.tfvars'), text.replace(/^project_ref\s*=.*$/m, `project_ref = "${REF}"`));
      const expected = readExpected({ root }) as Expected;
      expect(expected.smtp?.port).toBe('587');
      expect(expected.smtp?.host).toBe('email-smtp.eu-north-1.amazonaws.com');
      expect(expected.publicOrigin).toBe('https://vaa.example.org');
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('reads the JSON groups and the [auth.oauth_server] flags of config.toml', () => {
    expect(fixtureExpected.auth.disable_signup).toBe(true);
    expect(fixtureExpected.auth.mailer_autoconfirm).toBe(false);
    expect(Object.keys(fixtureExpected.authHook)).toEqual([
      'hook_custom_access_token_enabled',
      'hook_custom_access_token_uri'
    ]);
    expect(Object.keys(fixtureExpected.authSendEmailHook)).toEqual(['hook_send_email_enabled', 'hook_send_email_uri']);
    expect(fixtureExpected.redirectPaths.length).toBeGreaterThan(0);
    expect(fixtureExpected.oauthServer).toEqual({ enabled: false, allow_dynamic_registration: false });
  });

  it('reads the API settings, and the functions from the directories that hold an index.ts', () => {
    expect(fixtureExpected.api?.db_schema).toBe('public,graphql_public');
    expect(fixtureExpected.api?.db_extra_search_path).toBe('public, extensions');
    const slugs = fixtureExpected.functions.map((f) => f.slug);
    expect(slugs).toEqual([...slugs].sort());
    expect(slugs).toEqual(expect.arrayContaining(['account-access', 'identity-callback', 'send-email']));
    expect(fixtureExpected.functions.find((f) => f.slug === 'identity-callback')?.verifyJwt).toBe(false);
    expect(fixtureExpected.functions.find((f) => f.slug === 'send-email')?.verifyJwt).toBe(true);
  });

  it('expects a function verified when config.toml has no table or no verify_jwt for it, and skips a directory without index.ts', () => {
    const repo = mkdtempSync(join(tmpdir(), 'probe-hosted-repo-'));
    try {
      for (const file of [
        'infra/modules/supabase/hosted-settings.json',
        'packages/app-shared/src/settings/staticSettings.ts'
      ]) {
        mkdirSync(dirname(join(repo, file)), { recursive: true });
        writeFileSync(join(repo, file), readFileSync(join(REPO_ROOT, file), 'utf8'));
      }
      const functions = join(repo, 'apps/supabase/supabase/functions');
      for (const slug of ['zeta', 'alpha', 'beta', '_shared']) mkdirSync(join(functions, slug), { recursive: true });
      for (const slug of ['zeta', 'alpha', 'beta']) writeFileSync(join(functions, slug, 'index.ts'), '');
      writeFileSync(
        join(repo, 'apps/supabase/supabase/config.toml'),
        [
          '[auth.oauth_server]',
          'enabled = false',
          'allow_dynamic_registration = false',
          '',
          '[functions.alpha]',
          'verify_jwt = false # the function checks its caller itself',
          '',
          '[functions.beta]',
          'import_map = "./import_map.json"',
          ''
        ].join('\n')
      );
      const expected = readExpected({ repoRoot: repo, root: fixtureRoot }) as Expected;
      expect(expected.functions).toEqual([
        { slug: 'alpha', verifyJwt: false },
        { slug: 'beta', verifyJwt: true },
        { slug: 'zeta', verifyJwt: true }
      ]);
    } finally {
      rmSync(repo, { recursive: true, force: true });
    }
  });

  it('records a root without an smtp object as null', () => {
    const root = mkdtempSync(join(tmpdir(), 'probe-hosted-'));
    try {
      writeFileSync(join(root, 'terraform.tfvars'), FIXTURE_TFVARS.replace(/\nsmtp = \{[\s\S]*\}\n/, '\n'));
      expect((readExpected({ root }) as Expected).smtp).toBeNull();
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('names the file and the value when an origin, a switch or an smtp attribute is missing', () => {
    const cases: Array<[string, RegExp]> = [
      [FIXTURE_TFVARS.replace(/^public_origin.*\n/m, ''), /terraform\.tfvars: .*public_origin/],
      [FIXTURE_TFVARS.replace(/^enable_access_token_hook.*\n/m, ''), /terraform\.tfvars: .*enable_access_token_hook/],
      [FIXTURE_TFVARS.replace(/^enable_send_email_hook.*\n/m, ''), /terraform\.tfvars: .*enable_send_email_hook/],
      [
        FIXTURE_TFVARS.replace(/^enable_send_email_hook.*\n/m, 'enable_send_email_hook = "yes"\n'),
        /enable_send_email_hook/
      ],
      [FIXTURE_TFVARS.replace(/^\s*sender_name.*\n/m, ''), /terraform\.tfvars: .*smtp.*sender_name/]
    ];
    for (const [text, message] of cases) {
      const root = mkdtempSync(join(tmpdir(), 'probe-hosted-'));
      try {
        writeFileSync(join(root, 'terraform.tfvars'), text);
        expect(() => readExpected({ root }), String(message)).toThrow(ProbeInputError);
        expect(() => readExpected({ root }), String(message)).toThrow(message);
      } finally {
        rmSync(root, { recursive: true, force: true });
      }
    }
  });

  it('names the file when the root has no terraform.tfvars', () => {
    const empty = mkdtempSync(join(tmpdir(), 'probe-hosted-'));
    try {
      expect(() => readExpected({ root: empty })).toThrow(ProbeInputError);
      expect(() => readExpected({ root: empty })).toThrow(/terraform\.tfvars: could not be read/);
    } finally {
      rmSync(empty, { recursive: true, force: true });
    }
  });
});

// ── Pure comparisons ──

describe('api.max-rows', () => {
  let realExpected: Expected;
  beforeAll(() => {
    realExpected = readExpected({ root: STAGING_ROOT }) as Expected;
  });
  function served(maxRows: unknown, expected: Expected = realExpected): Responses {
    const responses = correctResponses(expected);
    responses.management.postgrest = { ...responses.management.postgrest, max_rows: maxRows };
    return responses;
  }
  function run(expected: Expected, responses: Responses): ReturnType<typeof runChecks>[number] | undefined {
    return runChecks(expected, responses).find((r) => r.name === 'api.max-rows');
  }

  it('reads the expected value from the tracked JSON and pageSize, which agree', () => {
    expect(realExpected.maxRows.json).toBe(realExpected.maxRows.pageSize);
    expect(Number.isInteger(realExpected.maxRows.json)).toBe(true);
  });

  it('passes for the JSON value served as a number', () => {
    expect(run(realExpected, served(realExpected.maxRows.json))).toEqual({
      name: 'api.max-rows',
      pass: true,
      finding: null
    });
  });

  it('fails for 500 and names it', () => {
    const result = run(realExpected, served(500));
    expect(result?.pass).toBe(false);
    expect(result?.finding).toContain('500');
  });

  it('fails for the value served as a string, without printing it', () => {
    const result = run(realExpected, served(String(realExpected.maxRows.json)));
    expect(result?.pass).toBe(false);
    expect(result?.finding).toContain('a string');
  });

  it('fails when the JSON and pageSize disagree, naming both', () => {
    const expected = { ...realExpected, maxRows: { json: 50000, pageSize: 1000 } };
    const result = run(expected, served(50000, expected));
    expect(result?.pass).toBe(false);
    expect(result?.finding).toContain('50000');
    expect(result?.finding).toContain('1000');
  });
});

describe('the registry', () => {
  it('runs in order, one result per check', () => {
    expect(results(correctResponses(fixtureExpected)).map((r) => r.name)).toEqual(CHECKS.map((c) => c.name));
  });

  it('holds the thirteen management checks in their order', () => {
    expect(CHECKS.map((c) => c.name)).toEqual([
      'api.max-rows',
      'auth.access-token-hook',
      'auth.send-email-hook',
      'auth.site-url',
      'auth.redirects',
      'auth.signup-closed',
      'auth.email-confirm',
      'auth.smtp',
      'auth.oauth-server',
      'auth.other-settings',
      'api.schemas',
      'functions.deployed',
      'functions.verify-jwt'
    ]);
  });

  it('passes every check for the correct responses', () => {
    expect(failing(correctResponses(fixtureExpected))).toEqual([]);
  });
});

describe('the auth checks', () => {
  it('fails only auth.access-token-hook when the access-token hook is served off', () => {
    const responses = withAuth({ hook_custom_access_token_enabled: false });
    expect(failing(responses)).toEqual(['auth.access-token-hook']);
    expect(finding(responses, 'auth.access-token-hook')).toContain('hook_custom_access_token_enabled is false');
  });

  it('fails only auth.access-token-hook when the hook points at another function', () => {
    const responses = withAuth({ hook_custom_access_token_uri: 'pg-functions://postgres/public/planted_hook' });
    expect(failing(responses)).toEqual(['auth.access-token-hook']);
    expect(finding(responses, 'auth.access-token-hook')).toContain('planted_hook');
  });

  it('expects the hook served off when the root switches it off', () => {
    const expected = { ...fixtureExpected, hooks: { ...fixtureExpected.hooks, accessToken: false } };
    expect(failing(correctResponses(fixtureExpected), expected)).toEqual(['auth.access-token-hook']);
    expect(failing(withAuth({ hook_custom_access_token_enabled: false }), expected)).toEqual([]);
  });

  it('fails only auth.send-email-hook when the send-email hook is served off', () => {
    const responses = withAuth({ hook_send_email_enabled: false });
    expect(failing(responses)).toEqual(['auth.send-email-hook']);
    expect(finding(responses, 'auth.send-email-hook')).toContain('hook_send_email_enabled is false');
  });

  it('fails auth.site-url naming the planted address', () => {
    const responses = withAuth({ site_url: 'https://planted.invalid' });
    expect(failing(responses)).toEqual(['auth.site-url']);
    expect(finding(responses, 'auth.site-url')).toContain('planted.invalid');
  });

  it('fails auth.redirects for one entry, the two in the other order, and a space after the comma', () => {
    const [first, second] = fixtureExpected.redirectPaths.map((p) => `${FIXTURE_ORIGIN}${p}`);
    const cases: Array<[string, string]> = [
      [first, '1 entry'],
      [`${second},${first}`, 'another order'],
      [`${first}, ${second}`, 'spacing']
    ];
    for (const [served, marker] of cases) {
      const responses = withAuth({ uri_allow_list: served });
      expect(failing(responses), served).toEqual(['auth.redirects']);
      expect(finding(responses, 'auth.redirects'), served).toContain(marker);
    }
  });

  it('fails auth.signup-closed when sign-up is open, and when true is served as a string', () => {
    expect(failing(withAuth({ disable_signup: false }))).toEqual(['auth.signup-closed']);
    expect(finding(withAuth({ disable_signup: false }), 'auth.signup-closed')).toContain('disable_signup is false');
    const asString = withAuth({ disable_signup: 'true' });
    expect(failing(asString)).toEqual(['auth.signup-closed']);
    expect(finding(asString, 'auth.signup-closed')).toContain('the string "true"');
  });

  it('fails auth.email-confirm when addresses are confirmed automatically', () => {
    const responses = withAuth({ mailer_autoconfirm: true });
    expect(failing(responses)).toEqual(['auth.email-confirm']);
    expect(finding(responses, 'auth.email-confirm')).toContain('mailer_autoconfirm is true');
  });

  it('fails auth.smtp naming a planted port', () => {
    const responses = withAuth({ smtp_port: '2465' });
    expect(failing(responses)).toEqual(['auth.smtp']);
    expect(finding(responses, 'auth.smtp')).toContain('2465');
  });

  it('fails auth.smtp for the port served as a number', () => {
    const responses = withAuth({ smtp_port: 2587 });
    expect(failing(responses)).toEqual(['auth.smtp']);
  });

  it('fails auth.smtp naming the field and never the value when the user name is not set', () => {
    const responses = withAuth({ smtp_user_present: false });
    expect(failing(responses)).toEqual(['auth.smtp']);
    expect(finding(responses, 'auth.smtp')).toContain('smtp_user');
  });

  it('fails auth.smtp naming the field and never the address when the sender address differs', () => {
    const responses = withAuth({ smtp_admin_email: 'planted@planted.invalid' });
    expect(failing(responses)).toEqual(['auth.smtp']);
    expect(finding(responses, 'auth.smtp')).toContain('smtp_admin_email');
    expect(finding(responses, 'auth.smtp')).not.toContain('planted');
  });

  it('fails auth.smtp saying the root declares none when it has no smtp object', () => {
    const expected = { ...fixtureExpected, smtp: null };
    const responses = correctResponses(fixtureExpected);
    expect(failing(responses, expected)).toEqual(['auth.smtp']);
    expect(finding(responses, 'auth.smtp', expected)).toContain('declares no smtp object');
  });

  it('fails auth.oauth-server when both flags are on', () => {
    const responses = withAuth({ oauth_server_enabled: true, oauth_server_allow_dynamic_registration: true });
    expect(failing(responses)).toEqual(['auth.oauth-server']);
    expect(finding(responses, 'auth.oauth-server')).toContain('oauth_server_enabled is true');
    expect(finding(responses, 'auth.oauth-server')).toContain('oauth_server_allow_dynamic_registration is true');
  });

  it('fails only auth.other-settings for a planted password length, naming the key, 12 and 8', () => {
    const responses = withAuth({ password_min_length: 12 });
    expect(failing(responses)).toEqual(['auth.other-settings']);
    const text = finding(responses, 'auth.other-settings');
    expect(text).toContain('password_min_length');
    expect(text).toContain('12');
    expect(text).toContain('8');
  });

  it('fails auth.other-settings for a number served as a string', () => {
    expect(failing(withAuth({ jwt_exp: '3600' }))).toEqual(['auth.other-settings']);
  });
});

describe('the API and function checks', () => {
  it('fails only api.schemas when the exposed schemas are planted', () => {
    const responses = correctResponses(fixtureExpected);
    responses.management.postgrest.db_schema = 'public';
    expect(failing(responses)).toEqual(['api.schemas']);
    expect(finding(responses, 'api.schemas')).toContain('db_schema is "public"');
  });

  it('fails only functions.deployed naming a missing function', () => {
    const responses = withFunctions(functionsWith('send-email', null));
    expect(failing(responses)).toEqual(['functions.deployed']);
    expect(finding(responses, 'functions.deployed')).toContain('send-email');
  });

  it('fails functions.deployed naming a function the repository does not have', () => {
    const responses = withFunctions([
      ...correctResponses(fixtureExpected).management.functions,
      { slug: 'header-echo', status: 'ACTIVE', verify_jwt: false }
    ]);
    expect(failing(responses)).toEqual(['functions.deployed']);
    expect(finding(responses, 'functions.deployed')).toContain('header-echo');
  });

  it('fails functions.deployed naming the slug and the status of a function that is not ACTIVE', () => {
    const responses = withFunctions(functionsWith('account-access', { status: 'REMOVED' }));
    expect(failing(responses)).toEqual(['functions.deployed']);
    expect(finding(responses, 'functions.deployed')).toContain('account-access');
    expect(finding(responses, 'functions.deployed')).toContain('REMOVED');
  });

  it('fails only functions.deployed for an empty list, naming every function, in sorted order', () => {
    const responses = withFunctions([]);
    expect(failing(responses)).toEqual(['functions.deployed']);
    const slugs = fixtureExpected.functions.map((f) => f.slug);
    expect(finding(responses, 'functions.deployed')).toContain(slugs.join(', '));
  });

  it('fails only functions.verify-jwt naming identity-callback when it is served verified', () => {
    const responses = withFunctions(functionsWith('identity-callback', { verify_jwt: true }));
    expect(failing(responses)).toEqual(['functions.verify-jwt']);
    expect(finding(responses, 'functions.verify-jwt')).toContain('identity-callback');
  });

  it('fails functions.verify-jwt for the flag served as a string', () => {
    const responses = withFunctions(functionsWith('send-email', { verify_jwt: 'true' }));
    expect(failing(responses)).toEqual(['functions.verify-jwt']);
  });

  it('passes the functions served in another order', () => {
    expect(failing(withFunctions([...correctResponses(fixtureExpected).management.functions].reverse()))).toEqual([]);
  });

  it('reports missing and unexpected functions in sorted order whatever the served order', () => {
    const extra = [
      { slug: 'zz-temp', status: 'ACTIVE', verify_jwt: true },
      { slug: 'header-echo', status: 'ACTIVE', verify_jwt: true }
    ];
    const one = finding(withFunctions(extra), 'functions.deployed');
    const two = finding(withFunctions([...extra].reverse()), 'functions.deployed');
    expect(one).toBe(two);
    expect(one.indexOf('header-echo')).toBeLessThan(one.indexOf('zz-temp'));
  });
});

describe('the batched break', () => {
  it('fails every check, each finding holding its own planted marker', () => {
    const responses = batchedBreak();
    expect(failing(responses)).toEqual(CHECKS.map((c) => c.name));
    expect(BATCHED_BREAK.map((b) => b.check)).toEqual(CHECKS.map((c) => c.name));
    for (const { check, marker } of BATCHED_BREAK) expect(finding(responses, check), check).toContain(marker);
  });
});

// ── The entry against a stub Management API ──

interface StubState {
  preflightStatus: number;
  responses: Responses;
  smtpUser: string;
  keysStatus: number;
  legacyStatus: number;
  legacyEnabled: unknown;
  requests: Array<string>;
  authorizations: Array<string | undefined>;
}

const stub: StubState = {
  preflightStatus: 200,
  responses: { management: { postgrest: {}, auth: {}, functions: [], keys: {} } },
  smtpUser: STUB_SMTP_USER,
  keysStatus: 200,
  legacyStatus: 200,
  legacyEnabled: true,
  requests: [],
  authorizations: []
};
let server: Server;
let stubUrl: string;

/** The raw bodies the stub serves for `stub.responses`, with the secrets a real body holds next to the compared fields. */
function authBody(): JsonObject {
  const { smtp_user_present: present, ...auth } = stub.responses.management.auth;
  return { ...auth, smtp_user: present ? stub.smtpUser : '', smtp_pass: STUB_SMTP_PASS, jwt_secret: STUB_JWT_SECRET };
}

function handle(req: IncomingMessage, res: ServerResponse): void {
  stub.requests.push(req.url ?? '');
  stub.authorizations.push(req.headers.authorization);
  function send(status: number, body: unknown): void {
    res.writeHead(status, { 'content-type': 'application/json' });
    res.end(JSON.stringify(body));
  }
  if (req.method !== 'GET') return send(405, { message: 'method not allowed' });
  const project = `/v1/projects/${REF}`;
  if (req.url === project) return send(stub.preflightStatus, { id: REF, status: 'ACTIVE_HEALTHY' });
  if (req.url === `${project}/postgrest`)
    return send(200, {
      db_schema: 'public,graphql_public',
      db_extra_search_path: 'public, extensions',
      ...stub.responses.management.postgrest,
      jwt_secret: STUB_JWT_SECRET
    });
  if (req.url === `${project}/config/auth`) return send(200, authBody());
  if (req.url === `${project}/functions`)
    return send(
      200,
      stub.responses.management.functions.map((entry, i) => ({ id: `fn-${i}`, version: 3, name: entry.slug, ...entry }))
    );
  if (req.url === `${project}/api-keys?reveal=false`)
    return send(
      stub.keysStatus,
      STUB_KEYS.map(({ type, name, value }) => ({
        type,
        name,
        api_key: value,
        id: `${name}-id`,
        prefix: value.slice(0, 4)
      }))
    );
  if (req.url === `${project}/api-keys/legacy`)
    return stub.legacyStatus === 200
      ? send(200, { enabled: stub.legacyEnabled })
      : send(stub.legacyStatus, { message: 'not found' });
  return send(404, { message: 'not found' });
}

interface Run {
  code: number | null;
  stdout: string;
  stderr: string;
}

function runProbe(args: Array<string>, env: Record<string, string> = {}): Promise<Run> {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(process.execPath, [ENTRY, ...args], {
      env: { PATH: process.env.PATH ?? '', PROBE_MANAGEMENT_API_URL: stubUrl, ...env },
      stdio: ['ignore', 'pipe', 'pipe']
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => (stdout += chunk));
    child.stderr.on('data', (chunk) => (stderr += chunk));
    child.on('error', reject);
    child.on('close', (code) => resolvePromise({ code, stdout, stderr }));
  });
}

const withToken = { SUPABASE_ACCESS_TOKEN: TEST_TOKEN };

function expectNoSecret(run: Run): void {
  for (const secret of [
    STUB_JWT_SECRET,
    STUB_SMTP_PASS,
    STUB_SMTP_USER,
    TEST_TOKEN,
    FIXTURE_ADMIN_EMAIL,
    ...STUB_KEYS.map((k) => k.value)
  ]) {
    expect(run.stdout).not.toContain(secret);
    expect(run.stderr).not.toContain(secret);
  }
  expectPasteSafe(run.stdout);
}

function checkLines(stdout: string): Array<string> {
  return stdout.split('\n').filter((l) => /^(PASS|FAIL) /.test(l));
}

describe('probe-hosted.mjs', () => {
  beforeAll(async () => {
    server = createServer(handle);
    await new Promise<void>((done) => server.listen(0, '127.0.0.1', done));
    stubUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });

  afterAll(async () => {
    await new Promise<void>((done) => server.close(() => done()));
  });

  beforeEach(() => {
    stub.preflightStatus = 200;
    stub.responses = correctResponses(fixtureExpected);
    stub.smtpUser = STUB_SMTP_USER;
    stub.keysStatus = 200;
    stub.legacyStatus = 200;
    stub.legacyEnabled = true;
    stub.requests = [];
    stub.authorizations = [];
  });

  it('keeps only the named auth fields, reducing the SMTP user name to whether it is set', async () => {
    const responses = await collect({
      sources: ['management'],
      expected: fixtureExpected,
      env: { SUPABASE_ACCESS_TOKEN: TEST_TOKEN, PROBE_MANAGEMENT_API_URL: stubUrl }
    });
    const auth = responses.management.auth as JsonObject;
    expect(auth.smtp_user_present).toBe(true);
    expect(Object.hasOwn(auth, 'smtp_user')).toBe(false);
    expect(JSON.stringify(responses)).not.toContain(STUB_SMTP_PASS);
    expect(JSON.stringify(responses)).not.toContain(STUB_SMTP_USER);
    expect(JSON.stringify(responses)).not.toContain(STUB_JWT_SECRET);
  });

  it('exits 0 with one PASS line per check, in registry order, sending the bearer token', async () => {
    const run = await runProbe(['--root', fixtureRoot], withToken);
    expect(run.code).toBe(0);
    expect(checkLines(run.stdout)).toEqual(CHECKS.map((c) => `PASS ${c.name}`));
    expect(stub.requests).toContain(`/v1/projects/${REF}/config/auth`);
    expect(stub.requests).toContain(`/v1/projects/${REF}/functions`);
    expect(
      run.stdout
        .split('\n')
        .filter((l) => l !== '')
        .at(-1)
    ).toBe(
      'NOTE key-model: issued legacy/anon, legacy/service_role, publishable/default, secret/default; legacy keys enabled'
    );
    expect(stub.authorizations.length).toBeGreaterThanOrEqual(3);
    expect(stub.authorizations.every((a) => a === `Bearer ${TEST_TOKEN}`)).toBe(true);
    expectNoSecret(run);
  });

  it('gives the same lines on every run', async () => {
    const first = await runProbe(['--root', fixtureRoot], withToken);
    const second = await runProbe(['--root', fixtureRoot], withToken);
    expect(second.code).toBe(first.code);
    expect(second.stdout).toBe(first.stdout);
  });

  it('exits 1 with a FAIL line naming the served value when it is wrong', async () => {
    stub.responses.management.postgrest.max_rows = 500;
    const run = await runProbe(['--root', fixtureRoot], withToken);
    expect(run.code).toBe(1);
    expect(run.stdout).toMatch(/^FAIL api\.max-rows: .*500/m);
    expectNoSecret(run);
  });

  it('exits 1 for a served string, never printing a field it does not compare', async () => {
    stub.responses.management.postgrest.max_rows = String(fixtureExpected.maxRows.json);
    const run = await runProbe(['--root', fixtureRoot], withToken);
    expect(run.code).toBe(1);
    expect(run.stdout).toMatch(/^FAIL api\.max-rows: /m);
    expectNoSecret(run);
  });

  it('exits 1 when the SMTP user name is empty, naming the field and printing no value', async () => {
    stub.smtpUser = '';
    const run = await runProbe(['--root', fixtureRoot], withToken);
    expect(run.code).toBe(1);
    expect(checkLines(run.stdout).filter((l) => l.startsWith('FAIL '))).toHaveLength(1);
    expect(run.stdout).toMatch(/^FAIL auth\.smtp: .*smtp_user/m);
    expectNoSecret(run);
  });

  it('prints the legacy keys as enabled, disabled or gone, with the exit status the checks give', async () => {
    const cases: Array<[number, unknown, string]> = [
      [200, true, 'legacy keys enabled'],
      [200, false, 'legacy keys disabled'],
      [404, null, 'legacy keys endpoint gone']
    ];
    for (const [status, enabled, text] of cases) {
      stub.legacyStatus = status;
      stub.legacyEnabled = enabled;
      const green = await runProbe(['--root', fixtureRoot], withToken);
      expect(green.code, text).toBe(0);
      expect(green.stdout).toMatch(new RegExp(`^NOTE key-model: .*; ${text}$`, 'm'));
      expect(green.stdout).not.toContain('COULD NOT RUN');
      expectNoSecret(green);
      stub.responses.management.postgrest.max_rows = 500;
      const red = await runProbe(['--root', fixtureRoot], withToken);
      expect(red.code, text).toBe(1);
      expect(red.stdout).toMatch(new RegExp(`^NOTE key-model: .*; ${text}$`, 'm'));
      expectNoSecret(red);
      stub.responses = correctResponses(fixtureExpected);
    }
  });

  it('says the issued keys were not read when that read is refused, with the exit status the checks give', async () => {
    stub.keysStatus = 403;
    const run = await runProbe(['--root', fixtureRoot], withToken);
    expect(run.code).toBe(0);
    expect(run.stdout).toMatch(
      /^NOTE key-model: issued not read \(GET \/v1\/projects\/abcdefghijklmnopqrst\/api-keys answered 403\); legacy keys enabled$/m
    );
    expectNoSecret(run);
  });

  it('runs the batched break to exit 1 with thirteen FAIL lines, no COULD NOT RUN and every line paste-safe', async () => {
    stub.responses = batchedBreak();
    const run = await runProbe(['--root', fixtureRoot], withToken);
    expect(run.code).toBe(1);
    const lines = checkLines(run.stdout);
    expect(lines).toHaveLength(13);
    expect(lines.every((l) => l.startsWith('FAIL '))).toBe(true);
    for (const { check, marker } of BATCHED_BREAK)
      expect(
        lines.find((l) => l.startsWith(`FAIL ${check}: `)),
        check
      ).toContain(marker);
    expect(run.stdout).not.toContain('COULD NOT RUN');
    expectNoSecret(run);
  });

  it('exits 2 with COULD NOT RUN and no check line when the preflight answers 503', async () => {
    stub.preflightStatus = 503;
    const run = await runProbe(['--root', fixtureRoot], withToken);
    expect(run.code).toBe(2);
    expect(run.stdout).toContain('COULD NOT RUN management');
    expect(run.stdout).toContain('503');
    expect(run.stdout).not.toMatch(/^(PASS|FAIL) /m);
    expectNoSecret(run);
  });

  it('exits 2 when the access token is not set, before any request', async () => {
    const run = await runProbe(['--root', fixtureRoot]);
    expect(run.code).toBe(2);
    expect(run.stdout).toContain('COULD NOT RUN management: SUPABASE_ACCESS_TOKEN is not set');
    expect(stub.authorizations).toEqual([]);
    expectNoSecret(run);
  });

  it('exits 2 when the Management API cannot be reached', async () => {
    const run = await runProbe(['--root', fixtureRoot], {
      ...withToken,
      PROBE_MANAGEMENT_API_URL: 'http://127.0.0.1:1'
    });
    expect(run.code).toBe(2);
    expect(run.stdout).toMatch(/^COULD NOT RUN management: GET \/v1\/projects\/abcdefghijklmnopqrst did not answer/);
    expect(run.stdout).not.toMatch(/^(PASS|FAIL) /m);
    expectNoSecret(run);
  });

  it('exits 2 naming the file when the root has no terraform.tfvars', async () => {
    const empty = mkdtempSync(join(tmpdir(), 'probe-hosted-'));
    try {
      const run = await runProbe(['--root', empty], withToken);
      expect(run.code).toBe(2);
      expect(run.stdout).toMatch(/^COULD NOT RUN expected: .*terraform\.tfvars: could not be read/);
      expect(stub.authorizations).toEqual([]);
      expectNoSecret(run);
    } finally {
      rmSync(empty, { recursive: true, force: true });
    }
  });

  it('exits 2 with the usage when --root is missing, given twice or joined by an unknown flag', async () => {
    const root = fixtureRoot;
    for (const args of [[], ['--root'], ['--root', root, '--root', root], ['--root', root, '--bogus']]) {
      const run = await runProbe(args, withToken);
      expect(run.code, args.join(' ')).toBe(2);
      expect(run.stderr).toContain('usage:');
      expect(run.stdout).toBe('');
    }
    expect(stub.authorizations).toEqual([]);
  });
});
