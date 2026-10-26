/**
 * The migration push wrapper's REFUSALS, asserted by running it.
 *
 * `infra/scripts/push-migrations.sh` is the one command that applies the repository's migrations to a hosted project, and a migration applied there can never be revised by a later push. Every wrong target must therefore be refused before the Supabase CLI is called at all. Each case below runs the wrapper against a temporary work directory that is wrong in exactly one way, and asserts the refusal's exit status, a fragment of its message, and that the log directory it was given stays empty: the wrapper writes the CLI's output there, so an empty directory shows that no CLI call was made.
 *
 * No case holds a credential or reaches a network: the password variable, where a case sets it, is a placeholder, and every case is refused first.
 */

import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, describe, expect, it } from 'vitest';

const HERE = dirname(fileURLToPath(import.meta.url));
/** `packages/dev-seed/tests` → repo root. */
const REPO_ROOT = resolve(HERE, '../../..');

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

interface RunResult {
  status: number | null;
  stderr: string;
  logEntries: Array<string>;
}

/**
 * Run the wrapper with `args` plus a fresh `--log-dir`.
 * @param password - The value of `SUPABASE_DB_PASSWORD`, or `null` to leave it unset.
 */
function run(args: Array<string>, password: string | null = 'placeholder-not-a-password'): RunResult {
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
    const { status, stderr, logEntries } = run(['--workdir', workdir({ linkedRef: REF })]);
    expect(status).toBe(2);
    expect(stderr).toContain('--ref');
    expect(logEntries).toEqual([]);
  });

  it('refuses a ref that is not 20 lower-case letters', () => {
    const { status, stderr, logEntries } = run(['--ref', 'Abc', '--workdir', workdir({ linkedRef: 'Abc' })]);
    expect(status).toBe(2);
    expect(stderr).toContain('20 lower-case letters');
    expect(logEntries).toEqual([]);
  });

  it('refuses a run with no --workdir', () => {
    const { status, stderr, logEntries } = run(['--ref', REF]);
    expect(status).toBe(2);
    expect(stderr).toContain('--workdir');
    expect(logEntries).toEqual([]);
  });

  it('refuses the work directory of the shared local stack', () => {
    const { status, stderr, logEntries } = run(['--ref', REF, '--workdir', 'apps/supabase']);
    expect(status).toBe(2);
    expect(stderr).toContain('shared local stack');
    expect(logEntries).toEqual([]);
  });

  it('refuses a work directory with no supabase/migrations', () => {
    const { status, stderr, logEntries } = run([
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
    const { status, stderr, logEntries } = run(['--ref', REF, '--workdir', workdir({})]);
    expect(status).toBe(2);
    expect(stderr).toContain('not linked');
    expect(logEntries).toEqual([]);
  });

  it('refuses a work directory linked to another project, naming both refs', () => {
    const { status, stderr, logEntries } = run(['--ref', REF, '--workdir', workdir({ linkedRef: OTHER_REF })]);
    expect(status).toBe(2);
    expect(stderr).toContain(REF);
    expect(stderr).toContain(OTHER_REF);
    expect(logEntries).toEqual([]);
  });

  it('refuses a run without SUPABASE_DB_PASSWORD', () => {
    const { status, stderr, logEntries } = run(['--ref', REF, '--workdir', workdir({ linkedRef: REF })], null);
    expect(status).toBe(2);
    expect(stderr).toContain('SUPABASE_DB_PASSWORD');
    expect(logEntries).toEqual([]);
  });

  it('refuses a run with an empty SUPABASE_DB_PASSWORD', () => {
    const { status, stderr, logEntries } = run(['--ref', REF, '--workdir', workdir({ linkedRef: REF })], '');
    expect(status).toBe(2);
    expect(stderr).toContain('SUPABASE_DB_PASSWORD');
    expect(logEntries).toEqual([]);
  });

  it('refuses an unknown argument', () => {
    const { status, logEntries } = run(['--ref', REF, '--workdir', workdir({ linkedRef: REF }), '--db-url', 'x']);
    expect(status).toBe(2);
    expect(logEntries).toEqual([]);
  });
});

/** The wrapper's text. */
function text(): string {
  return readFileSync(resolve(REPO_ROOT, SCRIPT_PATH), 'utf8');
}

/** The wrapper's lines that are not comments. */
function commandLines(): string {
  return text()
    .split('\n')
    .filter((line) => !line.trimStart().startsWith('#'))
    .join('\n');
}

describe('push-migrations.sh calls the CLI as a push to a hosted project requires', () => {
  it('dry-runs first, skips the vault, answers in text and confirms on the terminal', () => {
    for (const fragment of ['--dry-run', '--skip-vault', '--agent no', '--output-format text', '/dev/tty'])
      expect(text()).toContain(fragment);
  });

  it('never pushes a seed, never links, and runs the drift check against the linked target', () => {
    expect(commandLines()).not.toContain('include-seed');
    expect(commandLines()).not.toContain('include-all');
    expect(commandLines()).not.toMatch(/CLI"? link( |$)/m);
    expect(commandLines()).toContain('check-drift.sh');
    expect(commandLines()).toContain('--target linked');
  });
});
