/**
 * The hosted conformance probe: its comparisons as pure functions, and its entry run as a child process against a stub
 * Management API on 127.0.0.1. The child gets a minimal environment, so no access token of the shell that runs the
 * suite reaches it, and it talks to the stub only.
 */

import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { CHECKS, runChecks } from './probe/checks.mjs';
import { ProbeInputError, readExpected } from './probe/expected.mjs';
import type { IncomingMessage, Server, ServerResponse } from 'node:http';
import type { AddressInfo } from 'node:net';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '../..');
const ENTRY = join(HERE, 'probe-hosted.mjs');
const STAGING_ROOT = join(REPO_ROOT, 'infra/envs/staging/supabase');

const REF = 'abcdefghijklmnopqrst';
const STUB_JWT_SECRET = 'stub-jwt-secret-do-not-print-4f1c9a';
const TEST_TOKEN = 'probe-test-value';

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

// ── Pure comparisons ──

describe('api.max-rows', () => {
  const realExpected = readExpected({ root: STAGING_ROOT });
  function served(maxRows: unknown): object {
    return { management: { postgrest: { max_rows: maxRows } } };
  }
  function run(expected: object, responses: object): ReturnType<typeof runChecks>[number] {
    return runChecks(expected, responses)[0];
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
    expect(result.pass).toBe(false);
    expect(result.finding).toContain('500');
  });

  it('fails for the value served as a string, without printing it', () => {
    const result = run(realExpected, served(String(realExpected.maxRows.json)));
    expect(result.pass).toBe(false);
    expect(result.finding).toContain('a string');
  });

  it('fails when the JSON and pageSize disagree, naming both', () => {
    const expected = { ...realExpected, maxRows: { json: 50000, pageSize: 1000 } };
    const result = run(expected, served(50000));
    expect(result.pass).toBe(false);
    expect(result.finding).toContain('50000');
    expect(result.finding).toContain('1000');
  });

  it('runs the registry in order, one result per check', () => {
    const results = runChecks(realExpected, served(realExpected.maxRows.json));
    expect(results.map((r) => r.name)).toEqual(CHECKS.map((c) => c.name));
  });
});

describe('readExpected', () => {
  it('reads the staging root', () => {
    expect(readExpected({ root: STAGING_ROOT }).ref).toMatch(/^[a-z]{20}$/);
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

// ── The entry against a stub Management API ──

interface StubState {
  preflightStatus: number;
  maxRows: unknown;
  authorizations: Array<string | undefined>;
}

const stub: StubState = { preflightStatus: 200, maxRows: 0, authorizations: [] };
let server: Server;
let stubUrl: string;
let root: string;
let expectedMaxRows: number;

function handle(req: IncomingMessage, res: ServerResponse): void {
  stub.authorizations.push(req.headers.authorization);
  function send(status: number, body: unknown): void {
    res.writeHead(status, { 'content-type': 'application/json' });
    res.end(JSON.stringify(body));
  }
  if (req.method !== 'GET') return send(405, { message: 'method not allowed' });
  if (req.url === `/v1/projects/${REF}`) return send(stub.preflightStatus, { id: REF, status: 'ACTIVE_HEALTHY' });
  if (req.url === `/v1/projects/${REF}/postgrest`)
    return send(200, {
      db_schema: 'public,graphql_public',
      db_extra_search_path: 'public, extensions',
      max_rows: stub.maxRows,
      jwt_secret: STUB_JWT_SECRET
    });
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
  expect(run.stdout).not.toContain(STUB_JWT_SECRET);
  expect(run.stderr).not.toContain(STUB_JWT_SECRET);
  expect(run.stdout).not.toContain(TEST_TOKEN);
  expect(run.stderr).not.toContain(TEST_TOKEN);
  expectPasteSafe(run.stdout);
}

describe('probe-hosted.mjs', () => {
  beforeAll(async () => {
    expectedMaxRows = readExpected({ root: STAGING_ROOT }).maxRows.json;
    root = mkdtempSync(join(tmpdir(), 'probe-hosted-'));
    writeFileSync(join(root, 'terraform.tfvars'), `project_ref = "${REF}" # the stub's project\n`);
    server = createServer(handle);
    await new Promise<void>((done) => server.listen(0, '127.0.0.1', done));
    stubUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });

  afterAll(async () => {
    await new Promise<void>((done) => server.close(() => done()));
    rmSync(root, { recursive: true, force: true });
  });

  beforeEach(() => {
    stub.preflightStatus = 200;
    stub.maxRows = expectedMaxRows;
    stub.authorizations = [];
  });

  it('exits 0 and prints exactly one PASS line when the served value is correct, sending the bearer token', async () => {
    const run = await runProbe(['--root', root], withToken);
    expect(run.code).toBe(0);
    expect(run.stdout).toBe('PASS api.max-rows\n');
    expect(stub.authorizations.length).toBeGreaterThanOrEqual(2);
    expect(stub.authorizations.every((a) => a === `Bearer ${TEST_TOKEN}`)).toBe(true);
    expectNoSecret(run);
  });

  it('gives the same lines on every run', async () => {
    const first = await runProbe(['--root', root], withToken);
    const second = await runProbe(['--root', root], withToken);
    expect(second.code).toBe(first.code);
    expect(second.stdout).toBe(first.stdout);
  });

  it('exits 1 with a FAIL line naming the served value when it is wrong', async () => {
    stub.maxRows = 500;
    const run = await runProbe(['--root', root], withToken);
    expect(run.code).toBe(1);
    expect(run.stdout).toMatch(/^FAIL api\.max-rows: .*500/);
    expectNoSecret(run);
  });

  it('exits 1 for a served string, never printing a field it does not compare', async () => {
    stub.maxRows = String(expectedMaxRows);
    const run = await runProbe(['--root', root], withToken);
    expect(run.code).toBe(1);
    expect(run.stdout).toMatch(/^FAIL api\.max-rows: /);
    expectNoSecret(run);
  });

  it('exits 2 with COULD NOT RUN and no check line when the preflight answers 503', async () => {
    stub.preflightStatus = 503;
    const run = await runProbe(['--root', root], withToken);
    expect(run.code).toBe(2);
    expect(run.stdout).toContain('COULD NOT RUN management');
    expect(run.stdout).toContain('503');
    expect(run.stdout).not.toMatch(/^(PASS|FAIL) /m);
    expectNoSecret(run);
  });

  it('exits 2 when the access token is not set, before any request', async () => {
    const run = await runProbe(['--root', root]);
    expect(run.code).toBe(2);
    expect(run.stdout).toContain('COULD NOT RUN management: SUPABASE_ACCESS_TOKEN is not set');
    expect(stub.authorizations).toEqual([]);
    expectNoSecret(run);
  });

  it('exits 2 when the Management API cannot be reached', async () => {
    const run = await runProbe(['--root', root], { ...withToken, PROBE_MANAGEMENT_API_URL: 'http://127.0.0.1:1' });
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
    for (const args of [[], ['--root'], ['--root', root, '--root', root], ['--root', root, '--bogus']]) {
      const run = await runProbe(args, withToken);
      expect(run.code, args.join(' ')).toBe(2);
      expect(run.stderr).toContain('usage:');
      expect(run.stdout).toBe('');
    }
    expect(stub.authorizations).toEqual([]);
  });
});
