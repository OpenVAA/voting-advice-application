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

/** A JWT of the given payload, as the platform's legacy keys are written; the signature is not checked by the probe. */
function stubJwt(payload: Record<string, unknown>): string {
  function segment(value: unknown): string {
    return Buffer.from(JSON.stringify(value)).toString('base64url');
  }
  return `${segment({ alg: 'HS256', typ: 'JWT' })}.${segment(payload)}.c3R1Yi1zaWduYXR1cmUtZG8tbm90LXByaW50`;
}

const ANON_KEY = stubJwt({ iss: 'supabase', ref: REF, role: 'anon' });
const SERVICE_ROLE_JWT = stubJwt({ iss: 'supabase', ref: REF, role: 'service_role' });
const SECRET_KEY = 'sb_secret_stubsecretvaluedonotprint';
/** A value of the JWT's shape whose payload is not JSON, so its role cannot be read. */
const UNREADABLE_JWT = `${Buffer.from('{"alg":"HS256"}').toString('base64url')}.bm90LWpzb24.c3R1Yi1zaWc`;

/** The nominations a conforming project serves to the whole read: more than the hosted default page of 1000. */
const WHOLE_ROWS = 1510;

const FIXTURE_PROJECT_ID = '00000000-0000-0000-0000-000000000001';
const FIXTURE_ORIGIN = 'https://probe.example.org';
const FIXTURE_ADMIN_EMAIL = 'noreply@probe.example.org';
const FIXTURE_TFVARS = `project_ref              = "${REF}" # the stub's project
public_origin            = "${FIXTURE_ORIGIN}"
enable_access_token_hook = true
enable_send_email_hook   = true
public_project_id        = "${FIXTURE_PROJECT_ID}"

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
  publicProjectId: string | null;
  projectUrl: string;
  buckets: Array<{ id: string; public: boolean }>;
  anonTimeout: string;
  postgresMajor: number;
  hookFunctions: Array<string>;
}

/** What a served function answered: its status and which known body it was, never the body itself. */
interface Answer {
  status: number;
  kind: 'method-not-allowed' | 'internal-server-error' | 'status-object' | 'other' | 'not-json';
}

interface Responses {
  management: {
    postgrest: JsonObject;
    auth: JsonObject;
    functions: Array<JsonObject>;
    buckets: Array<JsonObject>;
    keys: JsonObject;
  };
  public: {
    settings: JsonObject;
    rows: { status: number; contentRange: string | null; rows: number | null };
    functions: {
      accountAccess: Answer;
      sendEmail: Answer;
      identityCallbackGet: Answer;
      identityCallbackPost: Answer;
    };
  };
  catalog: Catalog;
}

/** What the catalog source keeps: the catalog query's facts and the seed check's finding classes. */
interface Catalog {
  major: unknown;
  anonConfig: Array<string> | null;
  hooks: Record<string, boolean>;
  role: string;
  bypassrls: boolean;
  seed: { clean: true } | { clean: false; classes: Array<string> };
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
      buckets: expected.buckets.map((bucket) => ({ ...bucket })),
      keys: { issued: [], legacy: 'enabled' }
    },
    public: {
      settings: {
        disable_signup: expected.auth.disable_signup,
        mailer_autoconfirm: expected.auth.mailer_autoconfirm
      },
      rows: { status: 200, contentRange: `0-${WHOLE_ROWS - 1}/${WHOLE_ROWS}`, rows: WHOLE_ROWS },
      functions: {
        accountAccess: { status: 200, kind: 'status-object' },
        sendEmail: { status: 405, kind: 'method-not-allowed' },
        identityCallbackGet: { status: 405, kind: 'method-not-allowed' },
        identityCallbackPost: { status: 500, kind: 'internal-server-error' }
      }
    },
    catalog: {
      major: expected.postgresMajor,
      anonConfig: ['search_path=public', `statement_timeout=${expected.anonTimeout}`],
      hooks: Object.fromEntries(expected.hookFunctions.map((signature) => [signature, true])),
      role: 'postgres',
      bypassrls: true,
      seed: { clean: true }
    }
  };
}

/** `correctResponses` with the given catalog facts replaced. */
function withCatalog(fields: Partial<Catalog>): Responses {
  const responses = correctResponses(fixtureExpected);
  responses.catalog = { ...responses.catalog, ...fields };
  return responses;
}

/** `correctResponses` with the served nominations read replaced. */
function withRows(rows: Responses['public']['rows']): Responses {
  const responses = correctResponses(fixtureExpected);
  responses.public.rows = rows;
  return responses;
}

/** `correctResponses` with the given served function answers replaced. */
function withAnswers(answers: Partial<Responses['public']['functions']>): Responses {
  const responses = correctResponses(fixtureExpected);
  responses.public.functions = { ...responses.public.functions, ...answers };
  return responses;
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
  { check: 'functions.verify-jwt', marker: 'identity-callback' },
  { check: 'auth.public-settings', marker: 'disable_signup is false' },
  { check: 'rows.read-whole', marker: '0-499/1510' },
  { check: 'functions.served', marker: 'send-email answered 404' },
  { check: 'functions.identity-callback-unverified', marker: 'answered 401' },
  { check: 'storage.buckets', marker: 'private-assets' },
  { check: 'db.hook-functions', marker: 'public.custom_access_token_hook(jsonb)' },
  { check: 'db.anon-timeout', marker: '3s' },
  { check: 'db.postgres-major', marker: '16' },
  { check: 'no-seed', marker: 'seed user' }
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
  m.buckets = m.buckets.filter((bucket) => bucket.id !== 'private-assets');
  const p = responses.public;
  p.settings = { disable_signup: false, mailer_autoconfirm: true };
  p.rows = { status: 206, contentRange: `0-499/${WHOLE_ROWS}`, rows: 500 };
  p.functions = {
    ...p.functions,
    sendEmail: { status: 404, kind: 'other' },
    identityCallbackGet: { status: 401, kind: 'other' },
    identityCallbackPost: { status: 401, kind: 'other' }
  };
  responses.catalog = {
    ...responses.catalog,
    // A project's major cannot be broken on purpose; the live red run plants it on the expected side instead.
    major: 16,
    anonConfig: ['statement_timeout=3s'],
    hooks: { ...responses.catalog.hooks, 'public.custom_access_token_hook(jsonb)': false },
    seed: { clean: false, classes: ['seed user'] }
  };
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

/** The tracked files `readExpected` reads besides the root and the function directories. */
const REPO_FILES = [
  'infra/modules/supabase/hosted-settings.json',
  'packages/app-shared/src/settings/staticSettings.ts',
  'apps/supabase/supabase/config.toml',
  'apps/supabase/supabase/migrations/00001_initial_schema.sql'
];

/**
 * Runs `body` against a temporary repository holding copies of `REPO_FILES`, with each entry of `files` written over
 * them (relative path to content), and removes it afterwards.
 */
function withRepo(files: Record<string, string>, body: (repo: string) => void): void {
  const repo = mkdtempSync(join(tmpdir(), 'probe-hosted-repo-'));
  try {
    for (const file of REPO_FILES) {
      mkdirSync(dirname(join(repo, file)), { recursive: true });
      writeFileSync(join(repo, file), readFileSync(join(REPO_ROOT, file), 'utf8'));
    }
    for (const [file, text] of Object.entries(files)) {
      mkdirSync(dirname(join(repo, file)), { recursive: true });
      writeFileSync(join(repo, file), text);
    }
    body(repo);
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
}

const REAL_CONFIG = readFileSync(join(REPO_ROOT, 'apps/supabase/supabase/config.toml'), 'utf8');
const SEND_EMAIL_INDEX = { 'apps/supabase/supabase/functions/send-email/index.ts': '' };

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
    withRepo({}, (repo) => {
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
          '',
          '[storage.buckets.assets]',
          'public = true',
          '',
          '[db]',
          'major_version = 17',
          ''
        ].join('\n')
      );
      const expected = readExpected({ repoRoot: repo, root: fixtureRoot }) as Expected;
      expect(expected.functions).toEqual([
        { slug: 'alpha', verifyJwt: false },
        { slug: 'beta', verifyJwt: true },
        { slug: 'zeta', verifyJwt: true }
      ]);
    });
  });

  it("reads the root's public project id, the project's own address and the buckets of config.toml", () => {
    expect(fixtureExpected.publicProjectId).toBe(FIXTURE_PROJECT_ID);
    expect(fixtureExpected.projectUrl).toBe(`https://${REF}.supabase.co`);
    expect(fixtureExpected.buckets).toEqual([
      { id: 'private-assets', public: false },
      { id: 'public-assets', public: true }
    ]);
  });

  it('records a root without a public_project_id as null, and refuses one that is not a lower-case uuid', () => {
    const root = mkdtempSync(join(tmpdir(), 'probe-hosted-'));
    try {
      writeFileSync(join(root, 'terraform.tfvars'), FIXTURE_TFVARS.replace(/^public_project_id.*\n/m, ''));
      expect((readExpected({ root }) as Expected).publicProjectId).toBeNull();
      writeFileSync(
        join(root, 'terraform.tfvars'),
        FIXTURE_TFVARS.replace(FIXTURE_PROJECT_ID, FIXTURE_PROJECT_ID.replace(/1$/, 'A'))
      );
      expect(() => readExpected({ root })).toThrow(/terraform\.tfvars: .*public_project_id/);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('names the bucket when config.toml sets its public flag to no boolean', () => {
    const config = REAL_CONFIG.replace(/(\[storage\.buckets\.private-assets\]\npublic = )false/, '$1"no"');
    withRepo({ ...SEND_EMAIL_INDEX, 'apps/supabase/supabase/config.toml': config }, (repo) => {
      expect(() => readExpected({ repoRoot: repo, root: fixtureRoot })).toThrow(
        /config\.toml: \[storage\.buckets\.private-assets\] sets public/
      );
    });
  });

  it("reads the anon timeout, the Postgres major and the hook functions' signatures", () => {
    expect(fixtureExpected.anonTimeout).toBe('8s');
    expect(fixtureExpected.postgresMajor).toBe(17);
    expect(fixtureExpected.hookFunctions).toEqual([
      'public.custom_access_token_hook(jsonb)',
      'public.send_email_hook(jsonb)'
    ]);
  });

  it('takes the anon timeout of the last ALTER ROLE anon in filename order, written over several lines', () => {
    withRepo(
      {
        ...SEND_EMAIL_INDEX,
        'apps/supabase/supabase/migrations/00003_later.sql': "ALTER ROLE anon\n  SET statement_timeout\n  = '5s';\n",
        'apps/supabase/supabase/migrations/00002_middle.sql': "alter role anon set statement_timeout = '4s';\n"
      },
      (repo) => {
        expect((readExpected({ repoRoot: repo, root: fixtureRoot }) as Expected).anonTimeout).toBe('5s');
      }
    );
  });

  it('names the migrations when none sets the anon timeout', () => {
    withRepo(
      {
        ...SEND_EMAIL_INDEX,
        'apps/supabase/supabase/migrations/00001_initial_schema.sql': 'CREATE TABLE t (id int);\n'
      },
      (repo) => {
        expect(() => readExpected({ repoRoot: repo, root: fixtureRoot })).toThrow(/migrations: .*statement_timeout/);
      }
    );
  });

  it('refuses a hook URI whose schema or function name could not be written into SQL as it is', () => {
    const settings = readFileSync(join(REPO_ROOT, 'infra/modules/supabase/hosted-settings.json'), 'utf8').replace(
      'pg-functions://postgres/public/custom_access_token_hook',
      "pg-functions://postgres/public/hook'); DROP TABLE x; --"
    );
    withRepo({ ...SEND_EMAIL_INDEX, 'infra/modules/supabase/hosted-settings.json': settings }, (repo) => {
      expect(() => readExpected({ repoRoot: repo, root: fixtureRoot })).toThrow(
        /hosted-settings\.json: .*hook_custom_access_token_uri/
      );
    });
  });

  it('names config.toml when [db] sets no integer major_version', () => {
    const config = REAL_CONFIG.replace(/^major_version = 17$/m, 'major_version = "seventeen"');
    withRepo({ ...SEND_EMAIL_INDEX, 'apps/supabase/supabase/config.toml': config }, (repo) => {
      expect(() => readExpected({ repoRoot: repo, root: fixtureRoot })).toThrow(/config\.toml: .*major_version/);
    });
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

  it('holds the twenty-two checks in their order: management, public API, buckets, catalog', () => {
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
      'functions.verify-jwt',
      'auth.public-settings',
      'rows.read-whole',
      'functions.served',
      'functions.identity-callback-unverified',
      'storage.buckets',
      'db.hook-functions',
      'db.anon-timeout',
      'db.postgres-major',
      'no-seed'
    ]);
    for (const name of ['db.hook-functions', 'db.anon-timeout', 'db.postgres-major', 'no-seed'])
      expect(CHECKS.find((c) => c.name === name)?.source, name).toBe('catalog');
    expect(CHECKS.find((c) => c.name === 'storage.buckets')?.source).toBe('management');
    for (const name of ['auth.public-settings', 'rows.read-whole', 'functions.served'])
      expect(CHECKS.find((c) => c.name === name)?.source, name).toBe('public');
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

describe('the public-API checks and the bucket check', () => {
  it('fails only auth.public-settings when sign-up is served open or addresses are confirmed automatically', () => {
    for (const [fields, marker] of [
      [{ disable_signup: false }, 'disable_signup is false'],
      [{ mailer_autoconfirm: true }, 'mailer_autoconfirm is true']
    ] as Array<[JsonObject, string]>) {
      const responses = correctResponses(fixtureExpected);
      responses.public.settings = { ...responses.public.settings, ...fields };
      expect(failing(responses), marker).toEqual(['auth.public-settings']);
      expect(finding(responses, 'auth.public-settings')).toContain(marker);
    }
  });

  it('fails rows.read-whole for a truncated read, naming the rows returned and the total', () => {
    const responses = withRows({ status: 206, contentRange: '0-499/1510', rows: 500 });
    expect(failing(responses)).toEqual(['rows.read-whole']);
    const text = finding(responses, 'rows.read-whole');
    expect(text).toContain('500');
    expect(text).toContain('1510');
    expect(text).toContain('truncated');
  });

  it('fails rows.read-whole for */0, saying no rows are readable and the project may be closed', () => {
    const responses = withRows({ status: 200, contentRange: '*/0', rows: 0 });
    expect(failing(responses)).toEqual(['rows.read-whole']);
    const text = finding(responses, 'rows.read-whole');
    expect(text).toContain('no nominations');
    expect(text).toContain('closed');
  });

  it('fails rows.read-whole for a whole read of 900 rows, saying more than 1000 are needed', () => {
    const responses = withRows({ status: 200, contentRange: '0-899/900', rows: 900 });
    expect(failing(responses)).toEqual(['rows.read-whole']);
    expect(finding(responses, 'rows.read-whole')).toContain('more than 1000');
  });

  it('passes rows.read-whole for a whole read of 1001 rows', () => {
    expect(failing(withRows({ status: 200, contentRange: '0-1000/1001', rows: 1001 }))).toEqual([]);
  });

  it('fails rows.read-whole when the body holds fewer rows than the range says, and for a refused read', () => {
    expect(failing(withRows({ status: 200, contentRange: '0-1509/1510', rows: 1000 }))).toEqual(['rows.read-whole']);
    const refused = withRows({ status: 401, contentRange: null, rows: null });
    expect(failing(refused)).toEqual(['rows.read-whole']);
    expect(finding(refused, 'rows.read-whole')).toContain('401');
  });

  it('fails only functions.served naming send-email when it answers 404 with a gateway body', () => {
    const responses = withAnswers({ sendEmail: { status: 404, kind: 'other' } });
    expect(failing(responses)).toEqual(['functions.served']);
    expect(finding(responses, 'functions.served')).toContain('send-email answered 404');
  });

  it('fails only functions.served naming account-access when its answer holds no status', () => {
    const responses = withAnswers({ accountAccess: { status: 200, kind: 'other' } });
    expect(failing(responses)).toEqual(['functions.served']);
    expect(finding(responses, 'functions.served')).toContain('account-access');
  });

  it('fails only functions.identity-callback-unverified when both calls answer 401', () => {
    const responses = withAnswers({
      identityCallbackGet: { status: 401, kind: 'other' },
      identityCallbackPost: { status: 401, kind: 'other' }
    });
    expect(failing(responses)).toEqual(['functions.identity-callback-unverified']);
    expect(finding(responses, 'functions.identity-callback-unverified')).toContain('answered 401');
  });

  it('fails functions.identity-callback-unverified when the empty POST is not refused with the fixed body', () => {
    const responses = withAnswers({ identityCallbackPost: { status: 400, kind: 'other' } });
    expect(failing(responses)).toEqual(['functions.identity-callback-unverified']);
    expect(finding(responses, 'functions.identity-callback-unverified')).toContain('400');
  });

  it('fails only storage.buckets naming private-assets when it is absent', () => {
    const responses = correctResponses(fixtureExpected);
    responses.management.buckets = responses.management.buckets.filter((b) => b.id !== 'private-assets');
    expect(failing(responses)).toEqual(['storage.buckets']);
    expect(finding(responses, 'storage.buckets')).toContain('private-assets');
  });

  it('fails only storage.buckets naming public-assets when it is served private', () => {
    const responses = correctResponses(fixtureExpected);
    responses.management.buckets = responses.management.buckets.map((b) =>
      b.id === 'public-assets' ? { ...b, public: false } : b
    );
    expect(failing(responses)).toEqual(['storage.buckets']);
    expect(finding(responses, 'storage.buckets')).toContain('public-assets');
  });

  it('fails storage.buckets naming a bucket config.toml does not declare, and passes another order', () => {
    const responses = correctResponses(fixtureExpected);
    responses.management.buckets = [...responses.management.buckets, { id: 'planted-bucket', public: true }];
    expect(failing(responses)).toEqual(['storage.buckets']);
    expect(finding(responses, 'storage.buckets')).toContain('planted-bucket');
    const reversed = correctResponses(fixtureExpected);
    reversed.management.buckets.reverse();
    expect(failing(reversed)).toEqual([]);
  });
});

describe('the catalog checks', () => {
  it('fails only db.hook-functions naming the access-token hook function when it is absent', () => {
    const responses = withCatalog({
      hooks: { ...correctResponses(fixtureExpected).catalog.hooks, 'public.custom_access_token_hook(jsonb)': false }
    });
    expect(failing(responses)).toEqual(['db.hook-functions']);
    expect(finding(responses, 'db.hook-functions')).toContain('public.custom_access_token_hook(jsonb)');
    expect(finding(responses, 'db.hook-functions')).not.toContain('send_email_hook');
  });

  it('fails only db.anon-timeout naming 3s and 8s when anon has a 3 s timeout', () => {
    const responses = withCatalog({ anonConfig: ['statement_timeout=3s'] });
    expect(failing(responses)).toEqual(['db.anon-timeout']);
    expect(finding(responses, 'db.anon-timeout')).toContain('3s');
    expect(finding(responses, 'db.anon-timeout')).toContain('8s');
  });

  it('fails db.anon-timeout when anon sets no timeout at all', () => {
    for (const anonConfig of [null, ['search_path=public']]) {
      const responses = withCatalog({ anonConfig });
      expect(failing(responses)).toEqual(['db.anon-timeout']);
      expect(finding(responses, 'db.anon-timeout')).toContain('no statement_timeout');
    }
  });

  it('fails only db.postgres-major when the server runs 16 against 17 in config.toml', () => {
    const responses = withCatalog({ major: 16 });
    expect(failing(responses)).toEqual(['db.postgres-major']);
    expect(finding(responses, 'db.postgres-major')).toContain('16');
    expect(finding(responses, 'db.postgres-major')).toContain('17');
  });

  it('fails only no-seed naming the finding classes and nothing else', () => {
    const responses = withCatalog({ seed: { clean: false, classes: ['seed user', 'demo key'] } });
    expect(failing(responses)).toEqual(['no-seed']);
    const text = finding(responses, 'no-seed');
    expect(text).toContain('seed user');
    expect(text).toContain('demo key');
    expect(text).toContain('2');
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

interface StubRequest {
  method: string;
  url: string;
  authorization: string | undefined;
  apikey: string | undefined;
  prefer: string | undefined;
  body: string;
}

interface StubState {
  preflightStatus: number;
  publicPreflightStatus: number;
  responses: Responses;
  smtpUser: string;
  keysStatus: number;
  legacyStatus: number;
  legacyEnabled: unknown;
  requests: Array<string>;
  authorizations: Array<string | undefined>;
  log: Array<StubRequest>;
}

const stub: StubState = {
  preflightStatus: 200,
  publicPreflightStatus: 200,
  responses: {} as Responses,
  smtpUser: STUB_SMTP_USER,
  keysStatus: 200,
  legacyStatus: 200,
  legacyEnabled: true,
  requests: [],
  authorizations: [],
  log: []
};
let server: Server;
let stubUrl: string;

/** The prefix under which the stub answers the project's own API, passed to the probe as `PROBE_PROJECT_URL`. */
const PROJECT_PREFIX = '/project';

/** A body of the given kind, as the function or the gateway writes it. */
function answerBody(kind: Answer['kind']): string {
  if (kind === 'method-not-allowed') return JSON.stringify({ error: 'Method not allowed' });
  if (kind === 'internal-server-error') return JSON.stringify({ error: 'Internal server error' });
  if (kind === 'status-object') return JSON.stringify({ status: 'unknown' });
  if (kind === 'not-json') return 'gateway timeout';
  return JSON.stringify({ code: 'NOT_FOUND', message: 'Requested function was not found' });
}

/** The project's own API: the auth settings, the nominations read and the three functions. */
function handlePublic(req: IncomingMessage, res: ServerResponse, path: string): void {
  const served = stub.responses.public;
  function answer({ status, kind }: Answer): void {
    res.writeHead(status, { 'content-type': 'application/json' });
    res.end(answerBody(kind));
  }
  if (req.method === 'GET' && path === '/auth/v1/settings') {
    res.writeHead(stub.publicPreflightStatus, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ external: { email: true }, saml_enabled: false, ...served.settings }));
    return;
  }
  if (req.method === 'GET' && path === `/rest/v1/nominations?select=id&project_id=eq.${FIXTURE_PROJECT_ID}`) {
    const { status, contentRange, rows } = served.rows;
    const headers: Record<string, string> = { 'content-type': 'application/json' };
    // PostgREST gives the total only when the count is asked for.
    if (contentRange !== null)
      headers['content-range'] = /count=exact/.test(String(req.headers.prefer))
        ? contentRange
        : contentRange.replace(/\/\d+$/, '/*');
    res.writeHead(status, headers);
    res.end(
      rows === null ? '{"message":"refused"}' : JSON.stringify(Array.from({ length: rows }, (_, i) => ({ id: i })))
    );
    return;
  }
  if (req.method === 'POST' && path === '/functions/v1/account-access') return answer(served.functions.accountAccess);
  if (req.method === 'GET' && path === '/functions/v1/send-email') return answer(served.functions.sendEmail);
  if (path === '/functions/v1/identity-callback')
    return answer(req.method === 'GET' ? served.functions.identityCallbackGet : served.functions.identityCallbackPost);
  res.writeHead(404, { 'content-type': 'application/json' });
  res.end(JSON.stringify({ message: 'not found' }));
}

/** The raw bodies the stub serves for `stub.responses`, with the secrets a real body holds next to the compared fields. */
function authBody(): JsonObject {
  const { smtp_user_present: present, ...auth } = stub.responses.management.auth;
  return { ...auth, smtp_user: present ? stub.smtpUser : '', smtp_pass: STUB_SMTP_PASS, jwt_secret: STUB_JWT_SECRET };
}

function handle(req: IncomingMessage, res: ServerResponse): void {
  let body = '';
  req.on('data', (chunk) => (body += chunk));
  req.on('end', () => {
    stub.log.push({
      method: req.method ?? '',
      url: req.url ?? '',
      authorization: req.headers.authorization,
      apikey: req.headers.apikey as string | undefined,
      prefer: req.headers.prefer,
      body
    });
    if ((req.url ?? '').startsWith(`${PROJECT_PREFIX}/`))
      return handlePublic(req, res, (req.url ?? '').slice(PROJECT_PREFIX.length));
    handleManagement(req, res);
  });
}

function handleManagement(req: IncomingMessage, res: ServerResponse): void {
  stub.requests.push(req.url ?? '');
  stub.authorizations.push(req.headers.authorization);
  function send(status: number, body: unknown): void {
    res.writeHead(status, { 'content-type': 'application/json' });
    res.end(JSON.stringify(body));
  }
  if (req.method !== 'GET') return send(405, { message: 'method not allowed' });
  const project = `/v1/projects/${REF}`;
  if (req.url === `${project}/storage/buckets`)
    return send(
      200,
      stub.responses.management.buckets.map((bucket) => ({
        name: bucket.id,
        owner: '',
        created_at: '2026-10-26T00:00:00Z',
        updated_at: '2026-10-26T00:00:00Z',
        ...bucket
      }))
    );
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

/**
 * A stand-in for psql, written into a temporary directory and passed to the probe as `PROBE_PSQL`. It appends its
 * arguments to the log file `FAKE_PSQL_LOG`; for `-c` it prints `FAKE_PSQL_CATALOG` and exits
 * `FAKE_PSQL_CATALOG_STATUS`, and for `-f` it writes `FAKE_PSQL_SEED_STDERR` to stderr and exits
 * `FAKE_PSQL_SEED_STATUS`.
 */
const FAKE_PSQL = `#!/usr/bin/env node
const { appendFileSync } = require('node:fs');
const args = process.argv.slice(2);
const env = process.env;
if (env.FAKE_PSQL_LOG)
  appendFileSync(
    env.FAKE_PSQL_LOG,
    JSON.stringify({ args, inherited: Object.keys(env).filter((name) => name.startsWith('SUPABASE_')) }) + '\\n'
  );
if (args.includes('-c')) {
  process.stdout.write((env.FAKE_PSQL_CATALOG || '') + '\\n');
  process.exit(Number(env.FAKE_PSQL_CATALOG_STATUS || '0'));
}
if (args.includes('-f')) {
  process.stderr.write(env.FAKE_PSQL_SEED_STDERR || '');
  process.exit(Number(env.FAKE_PSQL_SEED_STATUS || '0'));
}
process.exit(1);
`;

/** The addresses and the user a seed finding of check-seed names, none of which may reach the probe's output. */
const SEED_MESSAGE_VALUES = ['planted@openvaa.test', 'openvaa.test', 'http://kong:8000', 'kong'];

/** The stderr check-seed gives through psql for the given finding classes. */
function seedStderr(classes: Array<string>): string {
  const lines: Record<string, string> = {
    'seed user':
      'seed user: auth.users holds 1 row(s) of the local seed, the first 1 being: planted@openvaa.test (id 00000000-0000-0000-0000-0000000000aa)',
    'local address':
      'local address: the supabase_url row of public.storage_config names a local host (http://kong:8000)',
    'demo key':
      'demo key: the service_role_key row of public.storage_config holds the public demo key of a local stack (a JWT whose issuer is supabase-demo)'
  };
  return [
    `psql:infra/scripts/check-seed.sql:97: ERROR:  check-seed: ${classes.length} finding(s)`,
    ...classes.map((c) => `  - ${lines[c]}`),
    'CONTEXT:  PL/pgSQL function inline_code_block line 96 at RAISE',
    ''
  ].join('\n');
}

/** The environment that makes the fake psql answer as a database holding `catalog`. */
function catalogEnv(catalog: Catalog): Record<string, string> {
  return {
    FAKE_PSQL_CATALOG: JSON.stringify({
      major: catalog.major,
      anon_config: catalog.anonConfig,
      hooks: catalog.hooks,
      role: catalog.role,
      bypassrls: catalog.bypassrls
    }),
    FAKE_PSQL_SEED_STATUS: catalog.seed.clean ? '0' : '3',
    FAKE_PSQL_SEED_STDERR: catalog.seed.clean ? '' : seedStderr(catalog.seed.classes)
  };
}

let fakeDir: string;
let fakePsql: string;
let fakeLog: string;

/** The calls the fake psql received since the log was last emptied. */
function psqlCalls(): Array<{ args: Array<string>; inherited: Array<string> }> {
  const text = readFileSync(fakeLog, 'utf8');
  return text
    .split('\n')
    .filter((l) => l !== '')
    .map((l) => JSON.parse(l));
}

/** A direct connection to the stub project, in the PG* variables. */
const PG_DIRECT = {
  PGHOST: `db.${REF}.supabase.co`,
  PGPORT: '5432',
  PGUSER: 'postgres',
  PGDATABASE: 'postgres'
};

interface Run {
  code: number | null;
  stdout: string;
  stderr: string;
}

function runProbe(args: Array<string>, env: Record<string, string> = {}): Promise<Run> {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(process.execPath, [ENTRY, ...args], {
      env: {
        PATH: process.env.PATH ?? '',
        PROBE_MANAGEMENT_API_URL: stubUrl,
        PROBE_PROJECT_URL: `${stubUrl}${PROJECT_PREFIX}`,
        PROBE_PSQL: fakePsql,
        FAKE_PSQL_LOG: fakeLog,
        ...PG_DIRECT,
        ...catalogEnv(stub.responses.catalog),
        ...env
      },
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

const withToken = { SUPABASE_ACCESS_TOKEN: TEST_TOKEN, SUPABASE_ANON_KEY: ANON_KEY };

function expectNoSecret(run: Run): void {
  for (const secret of [
    STUB_JWT_SECRET,
    STUB_SMTP_PASS,
    STUB_SMTP_USER,
    TEST_TOKEN,
    ANON_KEY,
    SERVICE_ROLE_JWT,
    SECRET_KEY,
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
    fakeDir = mkdtempSync(join(tmpdir(), 'probe-hosted-psql-'));
    fakePsql = join(fakeDir, 'psql');
    fakeLog = join(fakeDir, 'calls.log');
    writeFileSync(fakePsql, FAKE_PSQL, { mode: 0o755 });
  });

  afterAll(async () => {
    await new Promise<void>((done) => server.close(() => done()));
    rmSync(fakeDir, { recursive: true, force: true });
  });

  beforeEach(() => {
    stub.preflightStatus = 200;
    stub.publicPreflightStatus = 200;
    stub.responses = correctResponses(fixtureExpected);
    stub.smtpUser = STUB_SMTP_USER;
    stub.keysStatus = 200;
    stub.legacyStatus = 200;
    stub.legacyEnabled = true;
    stub.requests = [];
    stub.authorizations = [];
    stub.log = [];
    writeFileSync(fakeLog, '');
  });

  it('reads the catalog in one psql call and runs check-seed in a second, with no address on any command line', async () => {
    const run = await runProbe(['--root', fixtureRoot], withToken);
    expect(run.code).toBe(0);
    const calls = psqlCalls();
    expect(calls).toHaveLength(2);
    const [catalog, seed] = calls;
    expect(catalog.args.slice(0, 4)).toEqual(['-X', '-A', '-t', '-v']);
    expect(catalog.args).toContain('ON_ERROR_STOP=1');
    const query = catalog.args[catalog.args.indexOf('-c') + 1];
    expect(query).toContain('rolbypassrls');
    expect(query).toContain("to_regprocedure('public.custom_access_token_hook(jsonb)')");
    expect(query).toContain("to_regprocedure('public.send_email_hook(jsonb)')");
    expect(seed.args[0]).toBe('-X');
    expect(seed.args[seed.args.indexOf('-f') + 1]).toMatch(/infra\/scripts\/check-seed\.sql$/);
    for (const call of calls) {
      expect(call.args.join(' ')).not.toContain(PG_DIRECT.PGHOST);
      expect(call.inherited).toEqual([]);
    }
  });

  it('exits 1 with only no-seed failing when check-seed reports a seed user, printing no address or URL', async () => {
    stub.responses.catalog.seed = { clean: false, classes: ['seed user', 'local address'] };
    const run = await runProbe(['--root', fixtureRoot], withToken);
    expect(run.code).toBe(1);
    const failed = checkLines(run.stdout).filter((l) => l.startsWith('FAIL '));
    expect(failed).toHaveLength(1);
    expect(failed[0]).toMatch(/^FAIL no-seed: .*seed user/);
    expect(failed[0]).toContain('local address');
    for (const value of SEED_MESSAGE_VALUES) {
      expect(run.stdout).not.toContain(value);
      expect(run.stderr).not.toContain(value);
    }
    expectNoSecret(run);
  });

  it('exits 2 with COULD NOT RUN catalog and no check line when check-seed or the catalog query exits 2', async () => {
    for (const env of [{ FAKE_PSQL_SEED_STATUS: '2' }, { FAKE_PSQL_CATALOG_STATUS: '2' }]) {
      const run = await runProbe(['--root', fixtureRoot], { ...withToken, ...env });
      expect(run.code, JSON.stringify(env)).toBe(2);
      expect(run.stdout).toMatch(/^COULD NOT RUN catalog: /m);
      expect(run.stdout).not.toMatch(/^(PASS|FAIL) /m);
      expectNoSecret(run);
    }
  });

  it('exits 2 before psql is called or any request is made when the PG* variables name another connection', async () => {
    const cases: Array<[Record<string, string>, RegExp]> = [
      [{ PGPORT: '6543' }, /6543/],
      [{ PGHOST: 'db.zyxwvutsrqponmlkjihg.supabase.co' }, /PGHOST/],
      [{ PGHOST: 'aws-0-eu-north-1.pooler.supabase.com', PGUSER: 'postgres.zyxwvutsrqponmlkjihg' }, /PGUSER/],
      [{ PGHOST: 'aws-0-eu-north-1.pooler.supabase.com', PGUSER: 'postgres' }, /PGUSER/],
      [{ PGHOST: '' }, /PGHOST/],
      [{ PGHOSTADDR: '192.0.2.1' }, /PGHOSTADDR/],
      [{ PGSERVICE: 'other' }, /PGSERVICE/]
    ];
    for (const [env, reason] of cases) {
      writeFileSync(fakeLog, '');
      stub.log = [];
      const run = await runProbe(['--root', fixtureRoot], { ...withToken, ...env });
      expect(run.code, JSON.stringify(env)).toBe(2);
      expect(run.stdout).toMatch(/^COULD NOT RUN catalog: /m);
      expect(run.stdout, JSON.stringify(env)).toMatch(reason);
      expect(run.stdout).not.toMatch(/^(PASS|FAIL) /m);
      expect(psqlCalls()).toEqual([]);
      expect(stub.log).toEqual([]);
      expectNoSecret(run);
    }
  });

  it('accepts a session pooler host when PGUSER ends in the project ref', async () => {
    const run = await runProbe(['--root', fixtureRoot], {
      ...withToken,
      PGHOST: 'aws-0-eu-north-1.pooler.supabase.com',
      PGUSER: `postgres.${REF}`
    });
    expect(run.code).toBe(0);
  });

  it('exits 2 naming row-level security when the role does not bypass it', async () => {
    stub.responses.catalog.bypassrls = false;
    const run = await runProbe(['--root', fixtureRoot], withToken);
    expect(run.code).toBe(2);
    expect(run.stdout).toMatch(/^COULD NOT RUN catalog: .*row-level security/m);
    expect(run.stdout).not.toMatch(/^(PASS|FAIL) /m);
    expect(psqlCalls()).toHaveLength(1);
    expectNoSecret(run);
  });

  it('reads the public API with the anon key in the shape the frontend sends, and keeps only named facts', async () => {
    const responses = await collect({
      sources: ['public'],
      expected: fixtureExpected,
      env: { SUPABASE_ANON_KEY: ANON_KEY, PROBE_PROJECT_URL: `${stubUrl}${PROJECT_PREFIX}` }
    });
    expect(responses.public).toEqual(correctResponses(fixtureExpected).public);
    const rows = stub.log.find((r) => r.url.startsWith(`${PROJECT_PREFIX}/rest/v1/nominations`));
    expect(rows?.prefer).toContain('count=exact');
    expect(rows?.authorization).toBe(`Bearer ${ANON_KEY}`);
    expect(stub.log.every((r) => r.apikey === ANON_KEY)).toBe(true);
    const check = stub.log.find((r) => r.url === `${PROJECT_PREFIX}/functions/v1/account-access`);
    const sent = JSON.parse(check?.body ?? '{}');
    expect(sent.operation).toBe('check-code');
    expect(sent.project_id).toBe(FIXTURE_PROJECT_ID);
    expect(sent.code).toMatch(/^[A-Za-z0-9_-]{12}$/);
    const unverified = stub.log.filter((r) => r.url === `${PROJECT_PREFIX}/functions/v1/identity-callback`);
    expect(unverified.map((r) => r.method).sort()).toEqual(['GET', 'POST']);
    expect(unverified.every((r) => r.authorization === undefined)).toBe(true);
    expect(unverified.find((r) => r.method === 'POST')?.body).toBe('{}');
  });

  it('reads the buckets through the Management API, taking the name when an entry has no id', async () => {
    stub.responses.management.buckets = [{ name: 'public-assets', public: true }];
    const responses = await collect({
      sources: ['management'],
      expected: fixtureExpected,
      env: { SUPABASE_ACCESS_TOKEN: TEST_TOKEN, PROBE_MANAGEMENT_API_URL: stubUrl }
    });
    expect(responses.management.buckets).toEqual([{ id: 'public-assets', public: true }]);
  });

  it('exits 1 naming the rows returned and the total for a truncated read through the entry', async () => {
    stub.responses.public.rows = { status: 206, contentRange: '0-499/1510', rows: 500 };
    const run = await runProbe(['--root', fixtureRoot], withToken);
    expect(run.code).toBe(1);
    expect(checkLines(run.stdout).filter((l) => l.startsWith('FAIL '))).toHaveLength(1);
    expect(run.stdout).toMatch(/^FAIL rows\.read-whole: .*500.*1510/m);
    expectNoSecret(run);
  });

  it('exits 2 with COULD NOT RUN public and no request when SUPABASE_ANON_KEY is a service-role JWT, a secret key or an unreadable JWT', async () => {
    for (const key of [SERVICE_ROLE_JWT, SECRET_KEY, UNREADABLE_JWT]) {
      stub.log = [];
      const run = await runProbe(['--root', fixtureRoot], { ...withToken, SUPABASE_ANON_KEY: key });
      expect(run.code).toBe(2);
      expect(run.stdout).toMatch(/^COULD NOT RUN public: .*never takes the service-role key/m);
      expect(run.stdout).not.toMatch(/^(PASS|FAIL) /m);
      expect(stub.log).toEqual([]);
      expectNoSecret(run);
    }
  });

  it('exits 2 when SUPABASE_ANON_KEY is not set, before any request', async () => {
    const run = await runProbe(['--root', fixtureRoot], { SUPABASE_ACCESS_TOKEN: TEST_TOKEN });
    expect(run.code).toBe(2);
    expect(run.stdout).toContain('COULD NOT RUN public: SUPABASE_ANON_KEY is not set');
    expect(stub.log).toEqual([]);
  });

  it('exits 2 when the root sets no public_project_id, before any request', async () => {
    const root = mkdtempSync(join(tmpdir(), 'probe-hosted-'));
    try {
      writeFileSync(join(root, 'terraform.tfvars'), FIXTURE_TFVARS.replace(/^public_project_id.*\n/m, ''));
      const run = await runProbe(['--root', root], withToken);
      expect(run.code).toBe(2);
      expect(run.stdout).toMatch(/^COULD NOT RUN public: .*public_project_id/m);
      expect(stub.log).toEqual([]);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('exits 2 with COULD NOT RUN public and no check line when the auth settings preflight answers 503', async () => {
    stub.publicPreflightStatus = 503;
    const run = await runProbe(['--root', fixtureRoot], withToken);
    expect(run.code).toBe(2);
    expect(run.stdout).toMatch(/^COULD NOT RUN public: GET \/auth\/v1\/settings answered 503/m);
    expect(run.stdout).not.toMatch(/^(PASS|FAIL) /m);
    expectNoSecret(run);
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

  it('runs the batched break to exit 1 with one FAIL line per check, no COULD NOT RUN and every line paste-safe', async () => {
    stub.responses = batchedBreak();
    const run = await runProbe(['--root', fixtureRoot], withToken);
    expect(run.code).toBe(1);
    const lines = checkLines(run.stdout);
    expect(lines).toHaveLength(22);
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
