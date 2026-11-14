import fs from 'fs';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { afterEach, describe, expect, it } from 'vitest';
import {
  DEDICATED_SUPABASE_TFVARS,
  GATE_CHECK_ORDER,
  gateFailureMessage,
  readDedicatedTarget,
  runDeployedGate
} from './deployedTarget';
import type { IncomingMessage, Server, ServerResponse } from 'http';
import type { AddressInfo } from 'net';
import type { DedicatedTarget, GateEnv, GateResult } from './deployedTarget';

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

afterEach(async () => {
  const current = server;
  server = null;
  if (current) {
    current.closeAllConnections();
    await new Promise<void>((resolve) => current.close(() => resolve()));
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
  it('passes all four checks, in order, against the dedicated identity', async () => {
    const result = await gate(await startStub());
    expect(result.checks.map((check) => check.name)).toEqual([...GATE_CHECK_ORDER]);
    expect(GATE_CHECK_ORDER).toEqual(['service-role-key-absent', 'sha', 'ref', 'project-id']);
    expect(result.lines).toEqual(['PASS service-role-key-absent', 'PASS sha', 'PASS ref', 'PASS project-id']);
    expect(result.failed).toBe(0);
    expect(result.dedicated).toEqual(DEDICATED);
  });

  it('fails only the sha check when the expected commit differs from the served build', async () => {
    const result = await gate(await startStub(), { SMOKE_EXPECTED_SHA: OTHER_SHA });
    expect(result.failed).toBe(1);
    expect(failedNames(result)).toEqual(['sha']);
    expect(result.lines[1].startsWith(`FAIL sha: observed ${SHA}, expected ${OTHER_SHA}`)).toBe(true);
    expect([result.lines[0], result.lines[2], result.lines[3]]).toEqual([
      'PASS service-role-key-absent',
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
    expect(result.lines[0]).toContain('SUPABASE_SERVICE_ROLE_KEY');
    expect(result.lines[0]).not.toContain(MADE_UP_KEY_VALUE);
  });
});

describe('gateFailureMessage', () => {
  it('heads the message with the failure count and indents each FAIL line', async () => {
    const result = await gate(await startStub(), { SMOKE_EXPECTED_SHA: OTHER_SHA });
    const message = gateFailureMessage(result);
    expect(message.startsWith('DEPLOYED SMOKE GATE FAILED — 1 of 4 checks failed')).toBe(true);
    const failLine = result.lines[1];
    expect(message).toContain(`\n  ${failLine}`);
    expect(message.split('\n').filter((line) => /^(PASS|FAIL) /.test(line))).toEqual([]);
  });
});
