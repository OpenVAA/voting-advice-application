import fs from 'fs';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { afterEach, describe, expect, it } from 'vitest';
import {
  assertSmokeProjects,
  DEDICATED_SUPABASE_TFVARS,
  DEFAULT_SMOKE_BASE_URL,
  evaluateGate,
  extractServedEnv,
  GATE_CHECK_ORDER,
  gateFailureMessage,
  readDedicatedTarget,
  readPublicOrigin,
  requireCredentialOrigin,
  requireSmokeInputs,
  runDeployedGate,
  servedSupabaseRef
} from './deployedTarget';
import type { IncomingMessage, Server, ServerResponse } from 'http';
import type { AddressInfo } from 'net';
import type { DedicatedTarget, FetchedDocument, GateCheckName, GateEnv, GateResult } from './deployedTarget';

/**
 * Unit tests for the deployed-target gate.
 *
 * The gate takes its target, its environment and its repository root as arguments, so every check runs here against a stub HTTP server on the loopback and the committed tfvars, with no network beyond it.
 */

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const DEDICATED: DedicatedTarget = readDedicatedTarget(
  fs.readFileSync(path.join(REPO_ROOT, DEDICATED_SUPABASE_TFVARS), 'utf8')
);
const DEDICATED_URL = `https://${DEDICATED.projectRef}.supabase.co`;
const SHA = '712947a1bd44a735f66ee8f51610f4748d76cd30';
const OTHER_SHA = 'ffffffffffffffffffffffffffffffffffffffff';
const MADE_UP_KEY_VALUE = 'made-up-service-role-value';

/** What a stub route answers: a status and a body, or `'hang'` to accept the request and never answer it. */
type StubAnswer = { status: number; body: string } | 'hang';

let server: Server | null = null;

/** The document SvelteKit renders, with the env line written the way its renderer writes it. */
function servedPage({
  projectId = DEDICATED.publicProjectId,
  supabaseUrl = DEDICATED_URL,
  envLine
}: {
  projectId?: string | null;
  supabaseUrl?: unknown;
  envLine?: string;
} = {}): string {
  const env = {
    PUBLIC_PROJECT_ID: projectId,
    PUBLIC_SUPABASE_ANON_KEY: 'not-a-key',
    PUBLIC_SUPABASE_URL: supabaseUrl
  };
  const line = envLine ?? `\t\t\t\t\t\tenv: ${JSON.stringify(env)},`;
  const attribute = projectId === null ? '' : ` data-project-id="${projectId}"`;
  return [
    '<!doctype html>',
    '<html lang="en">',
    `<body${attribute}>`,
    '\t\t<script>',
    '\t\t\t{',
    '\t\t\t\t__sveltekit_x8y83y = {',
    '\t\t\t\t\t\tbase: new URL(".", location).pathname.slice(0, -1),',
    line,
    '\t\t\t\t\t};',
    '\t\t\t}',
    '\t\t</script>',
    '</body>',
    '</html>'
  ].join('\n');
}

/** A 200 health answer naming the given build. */
function healthAnswer(build: unknown = SHA): StubAnswer {
  return { status: 200, body: JSON.stringify({ status: 'ok', build }) };
}

function startStub({
  health = healthAnswer(),
  page = { status: 200, body: servedPage() }
}: {
  health?: StubAnswer;
  page?: StubAnswer;
} = {}): Promise<string> {
  const answer = (res: ServerResponse, value: StubAnswer, contentType: string): void => {
    if (value === 'hang') return;
    res.writeHead(value.status, { 'content-type': contentType });
    res.end(value.body);
  };
  return new Promise((resolve) => {
    server = createServer((req: IncomingMessage, res: ServerResponse) => {
      if (req.url === '/api/health') answer(res, health, 'application/json');
      else if (req.url === '/') answer(res, page, 'text/html');
      else answer(res, { status: 404, body: 'not found' }, 'text/plain');
    });
    server.listen(0, '127.0.0.1', () => {
      const { port } = server?.address() as AddressInfo;
      resolve(`http://127.0.0.1:${port}`);
    });
  });
}

async function gate(
  baseURL: string,
  env: GateEnv = { SMOKE_EXPECTED_SHA: SHA },
  timeoutMs = 5000
): Promise<GateResult> {
  return runDeployedGate({ env, baseURL, repoRoot: REPO_ROOT, timeoutMs });
}

/** The names of the checks that failed, in order. */
function failedNames(result: GateResult): Array<string> {
  return result.checks.filter((check) => !check.pass).map((check) => check.name);
}

/** The line of one check, found by its name. */
function lineOf(result: GateResult, name: GateCheckName): string {
  return result.lines[result.checks.findIndex((check) => check.name === name)];
}

/** The observed value of one check, found by its name. */
function observedOf(checks: GateResult['checks'], name: GateCheckName): string {
  return checks.find((check) => check.name === name)?.observed ?? '(no such check)';
}

/** A second loopback server that answers every request with a redirect to the same path on `target`. */
const redirectors: Array<Server> = [];
function startRedirector(target: string): Promise<string> {
  return new Promise((resolve) => {
    const redirector = createServer((req: IncomingMessage, res: ServerResponse) => {
      res.writeHead(302, { location: `${target}${req.url ?? '/'}` });
      res.end();
    });
    redirectors.push(redirector);
    redirector.listen(0, '127.0.0.1', () => {
      const { port } = redirector.address() as AddressInfo;
      resolve(`http://127.0.0.1:${port}`);
    });
  });
}

/** A fetch that records every request and makes none. */
function recordingFetch(): { fetchImpl: typeof fetch; requested: Array<string> } {
  const requested: Array<string> = [];
  const fetchImpl = (async (input: string | URL | Request) => {
    requested.push(String(input));
    throw new Error('no request is made in this test');
  }) as typeof fetch;
  return { fetchImpl, requested };
}

afterEach(async () => {
  const current = server;
  server = null;
  for (const open of [...(current ? [current] : []), ...redirectors.splice(0)]) {
    open.closeAllConnections();
    await new Promise<void>((resolve) => open.close(() => resolve()));
  }
});

describe('readDedicatedTarget', () => {
  it('reads the ref and the project id of the committed tfvars', () => {
    expect(DEDICATED).toEqual({
      projectRef: 'cofbsatfrdysyphajsky',
      publicProjectId: '00000000-0000-0000-0000-000000000001'
    });
  });
});

describe('runDeployedGate against a stub target', () => {
  it('passes all five checks, in order, against the dedicated identity', async () => {
    const result = await gate(await startStub());
    expect(result.checks.map((check) => check.name)).toEqual([...GATE_CHECK_ORDER]);
    expect(GATE_CHECK_ORDER).toEqual(['service-role-key-absent', 'origin', 'sha', 'ref', 'project-id']);
    expect(result.lines).toEqual([
      'PASS service-role-key-absent',
      'PASS origin',
      'PASS sha',
      'PASS ref',
      'PASS project-id'
    ]);
    expect(result.failed).toBe(0);
    expect(result.dedicated).toEqual(DEDICATED);
  });

  it('fails only the sha check when the expected commit differs from the served build', async () => {
    const result = await gate(await startStub(), { SMOKE_EXPECTED_SHA: OTHER_SHA });
    expect(result.failed).toBe(1);
    expect(failedNames(result)).toEqual(['sha']);
    expect(lineOf(result, 'sha').startsWith(`FAIL sha: observed ${SHA}, expected ${OTHER_SHA}`)).toBe(true);
    expect(result.lines.filter((line) => line.startsWith('PASS '))).toEqual([
      'PASS service-role-key-absent',
      'PASS origin',
      'PASS ref',
      'PASS project-id'
    ]);
  });

  it('fails only the ref check when the page names a made-up ref', async () => {
    const page = { status: 200, body: servedPage({ supabaseUrl: 'https://aaaaaaaaaaaaaaaaaaaa.supabase.co' }) };
    const result = await gate(await startStub({ page }));
    expect(failedNames(result)).toEqual(['ref']);
    expect(result.failed).toBe(1);
  });

  it('fails only the project-id check when the page carries another project id', async () => {
    const page = { status: 200, body: servedPage({ projectId: '00000000-0000-0000-0000-0000000000ff' }) };
    const result = await gate(await startStub({ page }));
    expect(failedNames(result)).toEqual(['project-id']);
    expect(result.failed).toBe(1);
  });

  it('fails only the service-role-key-absent check when the key is set, naming the variable and not its value', async () => {
    const result = await gate(await startStub(), {
      SMOKE_EXPECTED_SHA: SHA,
      SUPABASE_SERVICE_ROLE_KEY: MADE_UP_KEY_VALUE
    });
    expect(failedNames(result)).toEqual(['service-role-key-absent']);
    expect(lineOf(result, 'service-role-key-absent')).toContain('SUPABASE_SERVICE_ROLE_KEY');
    expect(lineOf(result, 'service-role-key-absent')).not.toContain(MADE_UP_KEY_VALUE);
  });
});

describe('gateFailureMessage', () => {
  it('heads the message with the failure count and indents each FAIL line', async () => {
    const result = await gate(await startStub(), { SMOKE_EXPECTED_SHA: OTHER_SHA });
    const message = gateFailureMessage(result);
    expect(message.startsWith('DEPLOYED SMOKE GATE FAILED — 1 of 5 checks failed')).toBe(true);
    const failLine = lineOf(result, 'sha');
    expect(message).toContain(`\n  ${failLine}`);
    expect(message.split('\n').filter((line) => /^(PASS|FAIL) /.test(line))).toEqual([]);
  });
});

describe('the ref check fails closed', () => {
  it.each([
    ['a made-up ref', 'https://aaaaaaaaaaaaaaaaaaaa.supabase.co'],
    ['the deleted throwaway project', 'https://begckvkapaopoztbreqc.supabase.co'],
    ['the local stack by address', 'http://127.0.0.1:54321'],
    ['the local stack by name', 'http://localhost:54321'],
    ['the ref under a foreign domain', 'https://cofbsatfrdysyphajsky.supabase.co.evil.example'],
    ['the ref as user info of a foreign host', 'https://cofbsatfrdysyphajsky.supabase.co@evil.example'],
    ['a port', 'https://cofbsatfrdysyphajsky.supabase.co:8443'],
    ['plain http', 'http://cofbsatfrdysyphajsky.supabase.co'],
    ['a path', 'https://cofbsatfrdysyphajsky.supabase.co/rest/v1'],
    ['a query', 'https://cofbsatfrdysyphajsky.supabase.co/?x=1'],
    ['a host outside supabase.co', 'https://evil.example'],
    ['two labels before supabase.co', 'https://a.cofbsatfrdysyphajsky.supabase.co'],
    ['a numeric value', 54321],
    ['a value that is not a URL', 'not a url']
  ])('refuses %s', async (_label, supabaseUrl) => {
    const page = { status: 200, body: servedPage({ supabaseUrl }) };
    const result = await gate(await startStub({ page }));
    expect(failedNames(result)).toEqual(['ref']);
  });

  it.each([
    ['a document with no env line', ''],
    ['env: null', '\t\t\t\t\t\tenv: null,'],
    ['an env line that is not JSON', '\t\t\t\t\t\tenv: {PUBLIC_SUPABASE_URL: nope},'],
    [
      'an env object without PUBLIC_SUPABASE_URL',
      `\t\t\t\t\t\tenv: ${JSON.stringify({ PUBLIC_PROJECT_ID: '00000000-0000-0000-0000-000000000001' })},`
    ]
  ])('refuses %s', async (_label, envLine) => {
    const page = { status: 200, body: servedPage({ envLine }) };
    const result = await gate(await startStub({ page }));
    expect(failedNames(result)).toEqual(['ref']);
  });

  it('accepts the dedicated URL with a trailing slash', async () => {
    const page = { status: 200, body: servedPage({ supabaseUrl: `${DEDICATED_URL}/` }) };
    const result = await gate(await startStub({ page }));
    expect(result.failed).toBe(0);
  });

  it.each([
    ['no env block', null, '(no env block in the served document)'],
    ['no URL in the block', {}, '(PUBLIC_SUPABASE_URL absent from the env block)'],
    ['a numeric URL', { PUBLIC_SUPABASE_URL: 1 }, '(PUBLIC_SUPABASE_URL is not a string)'],
    ['an unparsable URL', { PUBLIC_SUPABASE_URL: 'not a url' }, '(unparsable URL: not a url)'],
    [
      'a foreign shape',
      { PUBLIC_SUPABASE_URL: 'http://localhost:54321' },
      'http://localhost:54321 (not https://<ref>.supabase.co)'
    ]
  ])('names why no ref was read from %s', (_label, env, observed) => {
    expect(servedSupabaseRef(env)).toEqual({ ref: null, observed });
  });

  it('reads no env from an array or a missing line', () => {
    expect(extractServedEnv('\tenv: [{}],')).toBeNull();
    expect(extractServedEnv('<html></html>')).toBeNull();
    expect(extractServedEnv(`\tenv: ${JSON.stringify({ PUBLIC_SUPABASE_URL: DEDICATED_URL })}`)).toEqual({
      PUBLIC_SUPABASE_URL: DEDICATED_URL
    });
  });
});

describe('no input widens the ref', () => {
  const foreignRef = 'aaaaaaaaaaaaaaaaaaaa';
  const foreignUrl = `https://${foreignRef}.supabase.co`;
  const foreignId = '00000000-0000-0000-0000-0000000000aa';
  const crowded: GateEnv = {
    SMOKE_EXPECTED_SHA: SHA,
    SUPABASE_URL: foreignUrl,
    PUBLIC_SUPABASE_URL: foreignUrl,
    SMOKE_BASE_URL: foreignUrl,
    SMOKE_EXPECTED_REF: foreignRef,
    SUPABASE_REF: foreignRef,
    DEDICATED_REF: foreignRef,
    SMOKE_PROJECT_REF: foreignRef,
    PROJECT_REF: foreignRef,
    SUPABASE_PROJECT_REF: foreignRef,
    SMOKE_SUPABASE_URL: foreignUrl,
    TF_VAR_project_ref: foreignRef,
    EXPECTED_SUPABASE_URL: foreignUrl,
    PUBLIC_PROJECT_ID: foreignId,
    SMOKE_EXPECTED_PROJECT_ID: foreignId,
    SUPABASE_PROJECT_ID: foreignId,
    TF_VAR_public_project_id: foreignId
  };

  it('still refuses a foreign ref when every input names it', async () => {
    const page = { status: 200, body: servedPage({ supabaseUrl: foreignUrl }) };
    const result = await gate(await startStub({ page }), crowded);
    expect(failedNames(result)).toEqual(['ref']);
    expect(result.dedicated).toEqual(DEDICATED);
  });

  it('gives the same checks for a crowded environment as for the expected commit alone', async () => {
    const baseURL = await startStub();
    const crowdedResult = await gate(baseURL, crowded);
    const plainResult = await gate(baseURL, { SMOKE_EXPECTED_SHA: SHA });
    expect(crowdedResult.checks).toEqual(plainResult.checks);
    expect(plainResult.failed).toBe(0);
  });
});

describe('the project-id check', () => {
  it.each([
    ['an absent attribute', null, '(attribute absent)'],
    ['the unsubstituted placeholder', '%projectId%', '(unsubstituted %projectId% placeholder)'],
    ['another project id', '00000000-0000-0000-0000-0000000000e2', '00000000-0000-0000-0000-0000000000e2']
  ])('refuses %s', async (_label, projectId, observed) => {
    const page = { status: 200, body: servedPage({ projectId }) };
    const result = await gate(await startStub({ page }));
    expect(failedNames(result)).toEqual(['project-id']);
    expect(observedOf(result.checks, 'project-id')).toBe(observed);
  });

  it('accepts the dedicated id in upper case', async () => {
    const page = { status: 200, body: servedPage({ projectId: DEDICATED.publicProjectId.toUpperCase() }) };
    const result = await gate(await startStub({ page }));
    expect(result.failed).toBe(0);
  });
});

describe('the sha check', () => {
  const notFullSha = '(SMOKE_EXPECTED_SHA is not a full 40-hex commit id)';

  it.each([
    ['unset', undefined],
    ['empty', ''],
    ['39 characters', SHA.slice(0, 39)],
    ['41 characters', `${SHA}0`],
    ['upper case', SHA.toUpperCase()]
  ])('refuses an expected commit that is %s', async (_label, expectedSha) => {
    const result = await gate(await startStub(), { SMOKE_EXPECTED_SHA: expectedSha });
    expect(failedNames(result)).toEqual(['sha']);
    expect(lineOf(result, 'sha')).toBe(`FAIL sha: observed ${SHA}, expected ${notFullSha}`);
  });

  it.each([
    ['status 500', { status: 500, body: JSON.stringify({ build: SHA }) }, '(status 500)'],
    ['a body that is not JSON', { status: 200, body: 'not json' }, '(body is not JSON)'],
    ['JSON without build', { status: 200, body: JSON.stringify({ status: 'ok' }) }, '(no build field)'],
    ['a numeric build', healthAnswer(7), '(no build field)']
  ])('refuses a health answer with %s', async (_label, health, reason) => {
    const result = await gate(await startStub({ health }));
    expect(failedNames(result)).toEqual(['sha']);
    expect(lineOf(result, 'sha')).toBe(`FAIL sha: observed ${reason}, expected ${SHA}`);
  });
});

describe('the service-role-key-absent check', () => {
  it.each([
    [{ SUPABASE_SERVICE_ROLE_KEY: MADE_UP_KEY_VALUE }, 'SUPABASE_SERVICE_ROLE_KEY is set (value withheld)'],
    [{ SUPABASE_SECRET_KEY: MADE_UP_KEY_VALUE }, 'SUPABASE_SECRET_KEY is set (value withheld)'],
    [{ SUPABASE_ACCESS_TOKEN: MADE_UP_KEY_VALUE }, 'SUPABASE_ACCESS_TOKEN is set (value withheld)'],
    [{ SUPABASE_DB_PASSWORD: MADE_UP_KEY_VALUE }, 'SUPABASE_DB_PASSWORD is set (value withheld)'],
    [{ TF_VAR_database_password: MADE_UP_KEY_VALUE }, 'TF_VAR_database_password is set (value withheld)'],
    [{ PGPASSWORD: MADE_UP_KEY_VALUE }, 'PGPASSWORD is set (value withheld)'],
    [
      { SUPABASE_SERVICE_ROLE_KEY: MADE_UP_KEY_VALUE, SUPABASE_SECRET_KEY: MADE_UP_KEY_VALUE },
      'SUPABASE_SERVICE_ROLE_KEY is set (value withheld), SUPABASE_SECRET_KEY is set (value withheld)'
    ]
  ])('refuses %o without printing the value', async (keys, observed) => {
    const result = await gate(await startStub(), { SMOKE_EXPECTED_SHA: SHA, ...keys });
    expect(failedNames(result)).toEqual(['service-role-key-absent']);
    expect(lineOf(result, 'service-role-key-absent')).toBe(
      `FAIL service-role-key-absent: observed ${observed}, expected unset`
    );
    expect(JSON.stringify(result)).not.toContain(MADE_UP_KEY_VALUE);
    expect(gateFailureMessage(result)).not.toContain(MADE_UP_KEY_VALUE);
  });

  it('passes a key variable that is empty or blank', async () => {
    const result = await gate(await startStub(), {
      SMOKE_EXPECTED_SHA: SHA,
      SUPABASE_SERVICE_ROLE_KEY: '',
      SUPABASE_SECRET_KEY: '  \t',
      SUPABASE_ACCESS_TOKEN: '',
      PGPASSWORD: ' '
    });
    expect(result.failed).toBe(0);
  });
});

describe('every check is evaluated', () => {
  it('reports the four failures in order when every check but origin fails', async () => {
    const page = {
      status: 200,
      body: servedPage({
        supabaseUrl: 'https://begckvkapaopoztbreqc.supabase.co',
        projectId: '00000000-0000-0000-0000-0000000000e2'
      })
    };
    const result = await gate(await startStub({ page }), { SUPABASE_SERVICE_ROLE_KEY: MADE_UP_KEY_VALUE });
    expect(result.failed).toBe(4);
    expect(result.lines.map((line) => line.split(':')[0])).toEqual([
      'FAIL service-role-key-absent',
      'PASS origin',
      'FAIL sha',
      'FAIL ref',
      'FAIL project-id'
    ]);
    expect(gateFailureMessage(result).startsWith('DEPLOYED SMOKE GATE FAILED — 4 of 5 checks failed')).toBe(true);
  });

  it('evaluates a failed page request without a thrown error', () => {
    const checks = evaluateGate({
      env: { SMOKE_EXPECTED_SHA: SHA },
      baseURL: DEFAULT_SMOKE_BASE_URL,
      health: { status: 200, body: JSON.stringify({ build: SHA }), url: `${DEFAULT_SMOKE_BASE_URL}/api/health` },
      page: { error: 'refused' },
      dedicated: DEDICATED
    });
    expect(checks.map((check) => check.pass)).toEqual([true, true, true, false, false]);
    expect(observedOf(checks, 'ref')).toBe('(request to / failed: refused)');
  });
});

describe('an unreachable target', () => {
  it('fails the three checks that need the target when nothing listens', async () => {
    const probe = createServer();
    const port = await new Promise<number>((resolve) =>
      probe.listen(0, '127.0.0.1', () => resolve((probe.address() as AddressInfo).port))
    );
    await new Promise<void>((resolve) => probe.close(() => resolve()));
    const result = await gate(`http://127.0.0.1:${port}`);
    expect(failedNames(result)).toEqual(['sha', 'ref', 'project-id']);
    expect(observedOf(result.checks, 'sha')).toContain('request to /api/health failed');
  });

  it('fails the page checks when the page never answers', async () => {
    const result = await gate(await startStub({ page: 'hang' }), { SMOKE_EXPECTED_SHA: SHA }, 200);
    expect(failedNames(result)).toEqual(['ref', 'project-id']);
    expect(observedOf(result.checks, 'ref')).toContain('failed');
    expect(observedOf(result.checks, 'project-id')).toContain('failed');
  });
});

describe('the origin check', () => {
  const originExpected =
    'an https origin, or http on a loopback host, with no user info, that answers /api/health and / itself';

  /** The two documents a target at `origin` serves when it passes every other check. */
  function servedFrom(origin: string): { health: FetchedDocument; page: FetchedDocument } {
    return {
      health: { status: 200, body: JSON.stringify({ build: SHA }), url: `${origin}/api/health` },
      page: { status: 200, body: servedPage(), url: `${origin}/` }
    };
  }

  function evaluate(baseURL: string, documents = servedFrom(new URL(baseURL).origin)): GateResult['checks'] {
    return evaluateGate({ env: { SMOKE_EXPECTED_SHA: SHA }, baseURL, ...documents, dedicated: DEDICATED });
  }

  it.each([
    ['the dedicated https origin', DEFAULT_SMOKE_BASE_URL],
    ['an https origin with a path', `${DEFAULT_SMOKE_BASE_URL}/en`],
    ['http on 127.0.0.1', 'http://127.0.0.1:3186'],
    ['http on localhost', 'http://localhost:5173'],
    ['http on the IPv6 loopback', 'http://[::1]:3186']
  ])('accepts %s', (_label, baseURL) => {
    expect(evaluate(baseURL).every((check) => check.pass)).toBe(true);
  });

  it.each([
    ['plain http on a public host', 'http://staging.openvaa.org', 'http://staging.openvaa.org'],
    ['plain http on another loopback address', 'http://127.0.0.2:3186', 'http://127.0.0.2:3186'],
    ['a scheme that is not http', 'ftp://staging.openvaa.org', 'ftp://staging.openvaa.org']
  ])('refuses %s, and only the origin check', (_label, baseURL, origin) => {
    const checks = evaluate(baseURL, servedFrom(origin));
    expect(checks.filter((check) => !check.pass).map((check) => check.name)).toEqual(['origin']);
    expect(observedOf(checks, 'origin')).toBe(`${origin} (not https, and not http on a loopback host)`);
    expect(checks.find((check) => check.name === 'origin')?.expected).toBe(originExpected);
  });

  it('accepts a redirect that stays on the origin', () => {
    const documents = {
      health: { status: 200, body: JSON.stringify({ build: SHA }), url: `${DEFAULT_SMOKE_BASE_URL}/api/health` },
      page: { status: 200, body: servedPage(), url: `${DEFAULT_SMOKE_BASE_URL}/en` }
    };
    expect(evaluate(DEFAULT_SMOKE_BASE_URL, documents).every((check) => check.pass)).toBe(true);
  });

  it('fails every check that read a document answered from another origin', () => {
    const elsewhere = 'https://elsewhere.example';
    const documents = {
      health: { status: 200, body: JSON.stringify({ build: SHA }), url: `${elsewhere}/api/health` },
      page: { status: 200, body: servedPage(), url: `${DEFAULT_SMOKE_BASE_URL}/` }
    };
    const checks = evaluate(DEFAULT_SMOKE_BASE_URL, documents);
    expect(checks.filter((check) => !check.pass).map((check) => check.name)).toEqual(['origin', 'sha']);
    expect(observedOf(checks, 'origin')).toBe(`${DEFAULT_SMOKE_BASE_URL}; /api/health answered from ${elsewhere}`);
    expect(observedOf(checks, 'sha')).toBe(
      `(request to /api/health failed: answered from another origin, ${elsewhere})`
    );
  });

  it('refuses a target that redirects to the dedicated deployment, on every check that read it', async () => {
    const dedicatedStub = await startStub();
    const front = await startRedirector(dedicatedStub);
    const result = await gate(front);
    expect(failedNames(result)).toEqual(['origin', 'sha', 'ref', 'project-id']);
    expect(lineOf(result, 'origin')).toBe(
      `FAIL origin: observed ${front}; /api/health answered from ${dedicatedStub}; / answered from ${dedicatedStub}, expected ${originExpected}`
    );
  });

  it('passes the stub target, answered from its own origin', async () => {
    const result = await gate(await startStub());
    expect(lineOf(result, 'origin')).toBe('PASS origin');
  });
});

describe('a base URL the gate cannot request', () => {
  it.each([
    ['no scheme', 'staging.openvaa.org', '(not an absolute URL: staging.openvaa.org)'],
    ['an empty string', '', '(not an absolute URL: )'],
    ['spaces', 'https://staging openvaa org', '(not an absolute URL: https://staging openvaa org)']
  ])(
    'fails every check that needs the target, with no request and no thrown error, for %s',
    async (_label, baseURL, observed) => {
      const { fetchImpl, requested } = recordingFetch();
      const result = await runDeployedGate({
        env: { SMOKE_EXPECTED_SHA: SHA },
        baseURL,
        repoRoot: REPO_ROOT,
        fetchImpl
      });
      expect(requested).toEqual([]);
      expect(failedNames(result)).toEqual(['origin', 'sha', 'ref', 'project-id']);
      expect(observedOf(result.checks, 'origin')).toBe(observed);
      expect(observedOf(result.checks, 'sha')).toBe(
        '(request to /api/health failed: not requested, the origin check refused the base URL)'
      );
      expect(gateFailureMessage(result).startsWith('DEPLOYED SMOKE GATE FAILED — 4 of 5 checks failed')).toBe(true);
    }
  );

  it('withholds user info in the base URL and requests nothing', async () => {
    const madeUpSecret = 'made-up-userinfo-secret';
    const { fetchImpl, requested } = recordingFetch();
    const result = await runDeployedGate({
      env: { SMOKE_EXPECTED_SHA: SHA },
      baseURL: `https://someone:${madeUpSecret}@staging.openvaa.org`,
      repoRoot: REPO_ROOT,
      fetchImpl
    });
    expect(requested).toEqual([]);
    expect(observedOf(result.checks, 'origin')).toBe('(the base URL carries user info, value withheld)');
    expect(JSON.stringify(result)).not.toContain(madeUpSecret);
    expect(gateFailureMessage(result)).not.toContain(madeUpSecret);
  });
});

describe('readPublicOrigin', () => {
  it('reads the origin of the committed tfvars', () => {
    expect(readPublicOrigin(fs.readFileSync(path.join(REPO_ROOT, DEDICATED_SUPABASE_TFVARS), 'utf8'))).toBe(
      DEFAULT_SMOKE_BASE_URL
    );
  });

  it.each([
    ['a missing key', 'project_ref = "cofbsatfrdysyphajsky"'],
    ['plain http', 'public_origin = "http://staging.openvaa.org"'],
    ['a trailing slash', 'public_origin = "https://staging.openvaa.org/"'],
    ['a path', 'public_origin = "https://staging.openvaa.org/en"'],
    ['a repeated key', 'public_origin = "https://a.example"\npublic_origin = "https://b.example"']
  ])('throws on %s', (_label, text) => {
    expect(() => readPublicOrigin(text)).toThrow(DEDICATED_SUPABASE_TFVARS);
  });
});

describe('requireCredentialOrigin', () => {
  it.each([
    ['the dedicated origin', DEFAULT_SMOKE_BASE_URL],
    ['the dedicated origin with a trailing slash', `${DEFAULT_SMOKE_BASE_URL}/`]
  ])('accepts %s', (_label, baseURL) => {
    expect(() => requireCredentialOrigin(baseURL, REPO_ROOT)).not.toThrow();
  });

  it.each([
    ['a local build', 'http://127.0.0.1:3186', 'http://127.0.0.1:3186'],
    ['a local dev server', 'http://localhost:5173', 'http://localhost:5173'],
    ['plain http on the dedicated host', 'http://staging.openvaa.org', 'http://staging.openvaa.org'],
    ['another port', 'https://staging.openvaa.org:8443', 'https://staging.openvaa.org:8443'],
    [
      'the host under a foreign domain',
      'https://staging.openvaa.org.evil.example',
      'https://staging.openvaa.org.evil.example'
    ],
    ['a foreign host', 'https://evil.example', 'https://evil.example'],
    ['no base URL', undefined, '(none)'],
    ['a value that is not a URL', 'staging.openvaa.org', '(not an absolute URL)']
  ])('refuses %s before any page action', (_label, baseURL, origin) => {
    expect(() => requireCredentialOrigin(baseURL, REPO_ROOT)).toThrow(
      `SMOKE TARGET REFUSED: the contestant's credentials are sent only to ${DEFAULT_SMOKE_BASE_URL}, public_origin of ${DEDICATED_SUPABASE_TFVARS}; the base URL's origin is ${origin}`
    );
  });
});

describe('readDedicatedTarget refusals', () => {
  const ref = 'project_ref     = "cofbsatfrdysyphajsky"';
  const id = 'public_project_id = "00000000-0000-0000-0000-000000000001"';

  it.each([
    ['a missing project_ref', [id]],
    ['a missing public_project_id', [ref]],
    ['a repeated key', [ref, ref, id]],
    ['a ref of 19 characters', ['project_ref = "cofbsatfrdysyphajsk"', id]],
    ['an upper-case ref', ['project_ref = "COFBSATFRDYSYPHAJSKY"', id]],
    ['a non-canonical id', [ref, 'public_project_id = "00000000000000000000000000000001"']],
    ['an upper-case id', [ref, 'public_project_id = "0000000A-0000-0000-0000-000000000001"']]
  ])('throws on %s', (_label, lines) => {
    expect(() => readDedicatedTarget(lines.join('\n'))).toThrow(DEDICATED_SUPABASE_TFVARS);
  });

  it('ignores a commented-out line', () => {
    const text = ['# project_ref = "aaaaaaaaaaaaaaaaaaaa"', '// project_ref = "bbbbbbbbbbbbbbbbbbbb"', ref, id].join(
      '\n'
    );
    expect(readDedicatedTarget(text)).toEqual(DEDICATED);
  });
});

describe('assertSmokeProjects', () => {
  it('passes one project named deployed-smoke', () => {
    expect(() => assertSmokeProjects([{ name: 'deployed-smoke', testMatch: /\.smoke\.ts$/ }])).not.toThrow();
  });

  it.each([
    ['no project', []],
    ['two projects', [{ name: 'deployed-smoke' }, { name: 'deployed-smoke' }]],
    ['another name', [{ name: 'chromium' }]],
    ['a dependency', [{ name: 'deployed-smoke', dependencies: ['x'] }]],
    ['a teardown', [{ name: 'deployed-smoke', teardown: 'x' }]],
    ['a name holding setup', [{ name: 'deployed-smoke-Setup' }]],
    ['a testMatch holding teardown', [{ name: 'deployed-smoke', testMatch: /base\.teardown\.ts/ }]]
  ])('refuses %s', (_label, projects) => {
    expect(() => assertSmokeProjects(projects)).toThrow(/^DEPLOYED SMOKE CONFIG REFUSED: /);
  });

  it('names the offending project', () => {
    expect(() => assertSmokeProjects([{ name: 'deployed-smoke', dependencies: ['data-setup-base'] }])).toThrow(
      'deployed-smoke'
    );
  });
});

describe('requireSmokeInputs', () => {
  const names = ['SMOKE_CONTESTANT_EMAIL', 'SMOKE_CONTESTANT_PASSWORD'];
  const missingBoth =
    'SMOKE INPUT MISSING: SMOKE_CONTESTANT_EMAIL, SMOKE_CONTESTANT_PASSWORD (read from the environment only, never printed)';

  it('returns the named values when set', () => {
    expect(
      requireSmokeInputs(names, {
        SMOKE_CONTESTANT_EMAIL: 'made-up-address',
        SMOKE_CONTESTANT_PASSWORD: 'made-up-word'
      })
    ).toEqual({ SMOKE_CONTESTANT_EMAIL: 'made-up-address', SMOKE_CONTESTANT_PASSWORD: 'made-up-word' });
  });

  it.each([
    ['unset', {}],
    ['blank', { SMOKE_CONTESTANT_EMAIL: '', SMOKE_CONTESTANT_PASSWORD: '  ' }]
  ])('names every missing input when they are %s', (_label, env) => {
    expect(() => requireSmokeInputs(names, env)).toThrow(missingBoth);
  });

  it('holds no value in its message', () => {
    expect(() => requireSmokeInputs(names, { SMOKE_CONTESTANT_PASSWORD: 'made-up-word' })).toThrow(
      /^SMOKE INPUT MISSING: SMOKE_CONTESTANT_EMAIL \(/
    );
    let message = '';
    try {
      requireSmokeInputs(names, { SMOKE_CONTESTANT_PASSWORD: 'made-up-word' });
    } catch (error) {
      message = (error as Error).message;
    }
    expect(message).not.toContain('made-up-word');
  });
});
