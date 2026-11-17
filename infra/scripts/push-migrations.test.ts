/**
 * The migration push script's `--confirmed-ref` path and its refusals, run against stand-ins.
 *
 * The accepted path pushes, so it can only be run against a stand-in for the Supabase CLI. Each case builds a
 * throwaway repository root holding a copy of the real script, a stub CLI at `node_modules/.bin/supabase` that records
 * its arguments and answers the dry run, a stub drift check, and a linked work directory. The copy resolves its CLI and
 * drift check against that root, so no database, no Supabase API and no Docker is reached. The script is started in a
 * new session, so it has no terminal to confirm on, which is the case of every runner. The child gets a minimal
 * environment, so no credential of the shell that runs the suite reaches it.
 */

import { spawn } from 'node:child_process';
import { chmodSync, copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';

const HERE = dirname(fileURLToPath(import.meta.url));
const SCRIPT = join(HERE, 'push-migrations.sh');
const PROJECT_REF = 'abcdefghijklmnopqrst';

const STUB_CLI = `#!/usr/bin/env bash
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
echo "$*" >>"$ROOT/cli.log"
case " $* " in
  *" --dry-run "*)
    if [ "\${STUB_DRY:-pending}" = "up-to-date" ]; then
      echo "Remote database is up to date."
    else
      echo "Would push these migrations:"
      echo " • 00002_x.sql"
    fi
    ;;
esac
exit 0
`;

const STUB_DRIFT_CHECK = `#!/usr/bin/env bash
echo "stub drift check"
exit "\${STUB_DRIFT_STATUS:-0}"
`;

interface RunResult {
  status: number | null;
  stdout: string;
  stderr: string;
  cliLog: string;
}

const roots: Array<string> = [];

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

function makeRoot(): string {
  const root = mkdtempSync(join(tmpdir(), 'push-migrations-test-'));
  roots.push(root);
  mkdirSync(join(root, 'infra/scripts'), { recursive: true });
  copyFileSync(SCRIPT, join(root, 'infra/scripts/push-migrations.sh'));
  writeFileSync(join(root, 'infra/scripts/check-drift.sh'), STUB_DRIFT_CHECK);
  chmodSync(join(root, 'infra/scripts/check-drift.sh'), 0o755);
  mkdirSync(join(root, 'node_modules/.bin'), { recursive: true });
  writeFileSync(join(root, 'node_modules/.bin/supabase'), STUB_CLI);
  chmodSync(join(root, 'node_modules/.bin/supabase'), 0o755);
  mkdirSync(join(root, 'work/supabase/migrations'), { recursive: true });
  mkdirSync(join(root, 'work/supabase/.temp'), { recursive: true });
  writeFileSync(join(root, 'work/supabase/.temp/project-ref'), `${PROJECT_REF}\n`);
  writeFileSync(join(root, 'cli.log'), '');
  return root;
}

function run(args: Array<string>, caseEnv: Record<string, string> = {}): Promise<RunResult> {
  const root = makeRoot();
  return new Promise((resolvePromise, reject) => {
    const child = spawn(
      'bash',
      [join(root, 'infra/scripts/push-migrations.sh'), '--log-dir', join(root, 'logs'), ...args],
      {
        cwd: root,
        detached: true,
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 60_000,
        env: {
          PATH: process.env.PATH ?? '',
          HOME: process.env.HOME ?? '',
          TMPDIR: process.env.TMPDIR ?? '/tmp',
          SUPABASE_DB_PASSWORD: 'stand-in',
          ...caseEnv
        }
      }
    );
    let stdout = '';
    let stderr = '';
    child.stdout.setEncoding('utf8').on('data', (chunk: string) => (stdout += chunk));
    child.stderr.setEncoding('utf8').on('data', (chunk: string) => (stderr += chunk));
    child.stdin.end();
    child.on('error', reject);
    child.on('close', (status) =>
      resolvePromise({ status, stdout, stderr, cliLog: readFileSync(join(root, 'cli.log'), 'utf8') })
    );
  });
}

const PIPELINE_ENV = {
  GITHUB_ACTIONS: 'true',
  OPENVAA_DEPLOY_ENVIRONMENT: 'staging',
  GITHUB_REF: 'refs/heads/deploy/staging'
};
const CONFIRMED = ['--ref', PROJECT_REF, '--workdir', 'work', '--confirmed-ref', PROJECT_REF];

/** The positions of `lines` in `text`, each the index of the first line equal to it, or -1. */
function lineIndexes(text: string, lines: Array<string>): Array<number> {
  const all = text.split('\n');
  return lines.map((line) => all.indexOf(line));
}

describe('push-migrations.sh --confirmed-ref', () => {
  it('pushes without a terminal when the ref is confirmed in a staging Actions job, and runs the drift check', async () => {
    const { status, stdout, cliLog } = await run(CONFIRMED, PIPELINE_ENV);
    const indexes = lineIndexes(stdout, [
      'push_pending=00002',
      'push_up_to_date=no',
      'push_confirmation=environment',
      'push_status=0',
      'drift_status=0'
    ]);
    expect(indexes.every((index) => index >= 0)).toBe(true);
    expect([...indexes].sort((a, b) => a - b)).toEqual(indexes);
    expect(cliLog).toMatch(/^db push --linked --yes /m);
    expect(status).toBe(0);
  }, 60_000);

  it('refuses a confirmed ref that differs from --ref before the CLI runs', async () => {
    const { status, stderr, cliLog } = await run(
      ['--ref', PROJECT_REF, '--workdir', 'work', '--confirmed-ref', 'abcdefghijklmnopqrsu'],
      PIPELINE_ENV
    );
    expect(stderr).toMatch(/FATAL -- --confirmed-ref .* is not --ref/);
    expect(cliLog).toBe('');
    expect(status).toBe(2);
  }, 60_000);

  it('refuses a confirmed ref outside a GitHub Actions job before the CLI runs', async () => {
    const { status, stderr, cliLog } = await run(CONFIRMED, { ...PIPELINE_ENV, GITHUB_ACTIONS: '' });
    expect(stderr).toMatch(/FATAL -- .*GITHUB_ACTIONS/);
    expect(cliLog).toBe('');
    expect(status).toBe(2);
  }, 60_000);

  it('refuses a confirmed ref in a job of another environment before the CLI runs', async () => {
    const { status, stderr, cliLog } = await run(CONFIRMED, {
      ...PIPELINE_ENV,
      OPENVAA_DEPLOY_ENVIRONMENT: 'production'
    });
    expect(stderr).toMatch(/FATAL -- .*OPENVAA_DEPLOY_ENVIRONMENT/);
    expect(cliLog).toBe('');
    expect(status).toBe(2);
  }, 60_000);

  it.each([['refs/heads/main'], ['refs/heads/deploy-evidence-other'], ['refs/tags/deploy/staging'], ['']])(
    'refuses a confirmed ref on the ref %j, which the staging environment admits no deploy from',
    async (ref) => {
      const { status, stderr, cliLog } = await run(CONFIRMED, { ...PIPELINE_ENV, GITHUB_REF: ref });
      expect(stderr).toMatch(/FATAL -- .*GITHUB_REF/);
      expect(cliLog).toBe('');
      expect(status).toBe(2);
    },
    60_000
  );

  it('accepts a confirmed ref on a deploy-evidence branch', async () => {
    const { status, stdout } = await run(CONFIRMED, {
      ...PIPELINE_ENV,
      GITHUB_REF: 'refs/heads/deploy-evidence/187-x'
    });
    expect(stdout.split('\n')).toContain('push_confirmation=environment');
    expect(status).toBe(0);
  }, 60_000);

  it('pushes nothing when the database is up to date and the ref is confirmed', async () => {
    const { status, stdout, cliLog } = await run(CONFIRMED, { ...PIPELINE_ENV, STUB_DRY: 'up-to-date' });
    expect(stdout.split('\n')).toContain('push_up_to_date=yes');
    expect(stdout.split('\n')).toContain('drift_status=0');
    expect(cliLog).not.toMatch(/--yes/);
    expect(status).toBe(0);
  }, 60_000);

  it('still refuses a push with no terminal when the ref is not confirmed', async () => {
    const { status, stderr, cliLog } = await run(['--ref', PROJECT_REF, '--workdir', 'work']);
    expect(stderr).toContain('there is no terminal to confirm the push on; nothing was pushed');
    expect(cliLog).not.toMatch(/--yes/);
    expect(status).toBe(2);
  }, 60_000);

  it('exits 2 when --confirmed-ref has no value', async () => {
    const { status, stderr, cliLog } = await run(
      ['--ref', PROJECT_REF, '--workdir', 'work', '--confirmed-ref'],
      PIPELINE_ENV
    );
    expect(stderr).toContain('--confirmed-ref requires a value');
    expect(cliLog).toBe('');
    expect(status).toBe(2);
  }, 60_000);
});

/**
 * The non-comment lines of a script that name a path under the descriptor directory. Reopening a stream through such
 * a path fails on Linux when the stream is a socket, which it is under a Node pipe spawn, so a line like this passes on
 * macOS and fails on the runner.
 */
function descriptorPathLines(script: string): Array<string> {
  return script
    .split('\n')
    .filter((line) => !/^\s*#/.test(line))
    .filter((line) => /\/dev\/fd\/|\/proc\/self\/fd\/|\/dev\/std(?:in|out|err)\b/.test(line));
}

describe('push-migrations.sh reopens no stream through the descriptor directory', () => {
  const script = readFileSync(SCRIPT, 'utf8');

  it('finds no line naming a descriptor path in the script', () => {
    expect(descriptorPathLines(script)).toEqual([]);
  });

  it('finds such a line in a copy where a redirection or an assignment through one is added', () => {
    const redirected = script.replace('run_child() {\n', 'run_child() {\n  echo started >/dev/fd/2\n');
    const assigned = script.replace('run_child() {\n', 'run_child() {\n  [ "$out" = "-" ] && out=/dev/fd/1\n');
    expect(redirected).not.toBe(script);
    expect(assigned).not.toBe(script);
    expect(descriptorPathLines(redirected)).toEqual(['  echo started >/dev/fd/2']);
    expect(descriptorPathLines(assigned)).toEqual(['  [ "$out" = "-" ] && out=/dev/fd/1']);
  });
});
