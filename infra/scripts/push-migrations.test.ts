/**
 * The migration push script, run against stand-ins: its `--confirmed-ref` path, and its refusals of every wrong target.
 *
 * `push-migrations.sh` is the one command that applies the repository's migrations to a hosted project, and a migration applied there can never be revised by a later push, so every wrong target must be refused before the Supabase CLI is called at all.
 *
 * The accepted path pushes, so it can only be run against a stand-in for the Supabase CLI. Each of its cases builds a throwaway repository root holding a copy of the real script and of the redaction it sources, a stub CLI at `node_modules/.bin/supabase` that records its arguments and answers the dry run, a stub drift check, and a linked work directory. The copy resolves its CLI and drift check against that root, so no database, no Supabase API and no Docker is reached. The script is started in a new session, so it has no terminal to confirm on, which is the case of every runner. The child gets a minimal environment, so no credential of the shell that runs the suite reaches it.
 *
 * The refusal cases run the real script from the repository root against a temporary work directory that is wrong in exactly one way, and assert the refusal's exit status, a fragment of its message, and that the log directory it was given stays empty: the script writes the CLI's output there, so an empty directory shows that no CLI call was made. No such case holds a credential or reaches a network: the password variable, where a case sets it, is a placeholder, and every case is refused first.
 */

import { spawn, spawnSync } from 'node:child_process';
import {
  chmodSync,
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, afterEach, describe, expect, it } from 'vitest';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '../..');
const SCRIPT = join(HERE, 'push-migrations.sh');
const REDACT_LIB = join(HERE, '../../scripts/lib/redact.sh');
const CLI_LIB = join(HERE, '../../scripts/lib/cli.sh');
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
  mkdirSync(join(root, 'scripts/lib'), { recursive: true });
  copyFileSync(REDACT_LIB, join(root, 'scripts/lib/redact.sh'));
  copyFileSync(CLI_LIB, join(root, 'scripts/lib/cli.sh'));
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
 * The non-comment lines of a script that name a path under the descriptor directory. Reopening a stream through such a path fails on Linux when the stream is a socket, which it is under a Node pipe spawn, so a line like this passes on macOS and fails on the runner.
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

const SCRIPT_PATH = 'infra/scripts/push-migrations.sh';

/** A ref of the right shape: 20 lower-case letters. */
const REF = 'abcdefghijklmnopqrst';
const OTHER_REF = 'zyxwvutsrqponmlkjihg';

/** A proxy on a closed local port, so that a case which wrongly reached the CLI would fail fast instead of reaching a hosted API. */
const UNREACHABLE_NETWORK = {
  HTTPS_PROXY: 'http://127.0.0.1:9',
  HTTP_PROXY: 'http://127.0.0.1:9',
  ALL_PROXY: 'http://127.0.0.1:9'
};

const TEMP_DIRS: Array<string> = [];
afterAll(() => {
  for (const dir of TEMP_DIRS) rmSync(dir, { recursive: true, force: true });
});

function tempDir(prefix: string): string {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  TEMP_DIRS.push(dir);
  return dir;
}

/**
 * A work directory for the wrapper.
 * @param options.migrations - Whether it holds `supabase/migrations`.
 * @param options.linkedRef - The content of `supabase/.temp/project-ref`, or `undefined` for no such file.
 * @returns The work directory's absolute path.
 */
function workdir({ migrations = true, linkedRef }: { migrations?: boolean; linkedRef?: string }): string {
  const dir = tempDir('push-migrations-workdir-');
  mkdirSync(join(dir, 'supabase'), { recursive: true });
  if (migrations) mkdirSync(join(dir, 'supabase', 'migrations'));
  if (linkedRef !== undefined) {
    mkdirSync(join(dir, 'supabase', '.temp'));
    writeFileSync(join(dir, 'supabase', '.temp', 'project-ref'), linkedRef);
  }
  return dir;
}

interface RefusalResult {
  status: number | null;
  stderr: string;
  logEntries: Array<string>;
}

/**
 * Run the wrapper with `args` plus a fresh `--log-dir`.
 * @param password - The value of `SUPABASE_DB_PASSWORD`, or `null` to leave it unset.
 */
function runRefused(args: Array<string>, password: string | null = 'placeholder-not-a-password'): RefusalResult {
  const logDir = tempDir('push-migrations-log-');
  const env: NodeJS.ProcessEnv = { ...process.env, ...UNREACHABLE_NETWORK };
  delete env.SUPABASE_DB_PASSWORD;
  delete env.SUPABASE_ACCESS_TOKEN;
  if (password !== null) env.SUPABASE_DB_PASSWORD = password;
  const result = spawnSync('bash', [SCRIPT_PATH, ...args, '--log-dir', logDir], {
    cwd: REPO_ROOT,
    env,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout: 15_000
  });
  return { status: result.status, stderr: result.stderr, logEntries: readdirSync(logDir) };
}

describe('push-migrations.sh refuses every wrong target before the CLI runs', () => {
  it('refuses a run with no --ref', () => {
    const { status, stderr, logEntries } = runRefused(['--workdir', workdir({ linkedRef: REF })]);
    expect(status).toBe(2);
    expect(stderr).toContain('--ref');
    expect(logEntries).toEqual([]);
  });

  it('refuses a ref that is not 20 lower-case letters', () => {
    const { status, stderr, logEntries } = runRefused(['--ref', 'Abc', '--workdir', workdir({ linkedRef: 'Abc' })]);
    expect(status).toBe(2);
    expect(stderr).toContain('20 lower-case letters');
    expect(logEntries).toEqual([]);
  });

  it('refuses a run with no --workdir', () => {
    const { status, stderr, logEntries } = runRefused(['--ref', REF]);
    expect(status).toBe(2);
    expect(stderr).toContain('--workdir');
    expect(logEntries).toEqual([]);
  });

  it('refuses the work directory of the shared local stack', () => {
    const { status, stderr, logEntries } = runRefused(['--ref', REF, '--workdir', 'apps/supabase']);
    expect(status).toBe(2);
    expect(stderr).toContain('shared local stack');
    expect(logEntries).toEqual([]);
  });

  it('refuses a work directory with no supabase/migrations', () => {
    const { status, stderr, logEntries } = runRefused([
      '--ref',
      REF,
      '--workdir',
      workdir({ migrations: false, linkedRef: REF })
    ]);
    expect(status).toBe(2);
    expect(stderr).toContain('supabase/migrations');
    expect(logEntries).toEqual([]);
  });

  it('refuses a work directory that is not linked', () => {
    const { status, stderr, logEntries } = runRefused(['--ref', REF, '--workdir', workdir({})]);
    expect(status).toBe(2);
    expect(stderr).toContain('not linked');
    expect(logEntries).toEqual([]);
  });

  it('refuses a work directory linked to another project, naming both refs', () => {
    const { status, stderr, logEntries } = runRefused(['--ref', REF, '--workdir', workdir({ linkedRef: OTHER_REF })]);
    expect(status).toBe(2);
    expect(stderr).toContain(REF);
    expect(stderr).toContain(OTHER_REF);
    expect(logEntries).toEqual([]);
  });

  it('refuses a run without SUPABASE_DB_PASSWORD', () => {
    const { status, stderr, logEntries } = runRefused(['--ref', REF, '--workdir', workdir({ linkedRef: REF })], null);
    expect(status).toBe(2);
    expect(stderr).toContain('SUPABASE_DB_PASSWORD');
    expect(logEntries).toEqual([]);
  });

  it('refuses a run with an empty SUPABASE_DB_PASSWORD', () => {
    const { status, stderr, logEntries } = runRefused(['--ref', REF, '--workdir', workdir({ linkedRef: REF })], '');
    expect(status).toBe(2);
    expect(stderr).toContain('SUPABASE_DB_PASSWORD');
    expect(logEntries).toEqual([]);
  });

  it('refuses an unknown argument', () => {
    const { status, logEntries } = runRefused([
      '--ref',
      REF,
      '--workdir',
      workdir({ linkedRef: REF }),
      '--db-url',
      'x'
    ]);
    expect(status).toBe(2);
    expect(logEntries).toEqual([]);
  });
});

/** The script's text. */
function scriptText(): string {
  return readFileSync(resolve(REPO_ROOT, SCRIPT_PATH), 'utf8');
}

/** The wrapper's lines that are not comments. */
function commandLines(): string {
  return scriptText()
    .split('\n')
    .filter((line) => !line.trimStart().startsWith('#'))
    .join('\n');
}

describe('push-migrations.sh calls the CLI as a push to a hosted project requires', () => {
  it('dry-runs first, skips the vault, answers in text and confirms on the terminal', () => {
    for (const fragment of ['--dry-run', '--skip-vault', '--agent no', '--output-format text', '/dev/tty'])
      expect(scriptText()).toContain(fragment);
  });

  it('never pushes a seed, never links, and runs the drift check against the linked target', () => {
    expect(commandLines()).not.toContain('include-seed');
    expect(commandLines()).not.toContain('include-all');
    expect(commandLines()).not.toMatch(/CLI"? link( |$)/m);
    expect(commandLines()).toContain('check-drift.sh');
    expect(commandLines()).toContain('--target linked');
  });
});
