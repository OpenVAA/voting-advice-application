/**
 * The drift check's LINKED-TARGET GUARD, asserted by running it.
 *
 * `infra/scripts/check-drift.sh` judges one database in two parts: the history over the PG* variables, with psql, and the schema over the work directory's link, with the Supabase CLI. With `--target linked` the two parts must name the same hosted project, or the check compares one project's schema with another database's history and can report a clean result that holds for neither. Each case below runs the check against a temporary work directory, with PG* variables that are wrong in exactly one way, and asserts the refusal's exit status and a fragment of its message.
 *
 * Every case runs with a PATH that holds no `docker`. The unguarded script stops at that missing tool with a message of its own, so a case that sees its own refusal shows the guard runs first, on any host. The two accepting cases end at that same missing tool, which shows the guard let them through.
 *
 * No case holds a credential or reaches a database.
 */

import { spawnSync } from 'node:child_process';
import {
  chmodSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  rmSync,
  symlinkSync,
  writeFileSync
} from 'node:fs';
import { tmpdir } from 'node:os';
import { delimiter, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, describe, expect, it } from 'vitest';

const HERE = dirname(fileURLToPath(import.meta.url));
/** `packages/dev-seed/tests` → repo root. */
const REPO_ROOT = resolve(HERE, '../../..');

const SCRIPT_PATH = 'infra/scripts/check-drift.sh';
const CONFIG_PATH = 'apps/supabase/supabase/config.toml';

const REF = 'abcdefghijklmnopqrst';
const OTHER_REF = 'zyxwvutsrqponmlkjihg';
const POOLER_HOST = 'aws-0-eu-north-1.pooler.supabase.com';

/** The tools the script may call before its Docker check. `docker` is never among them. */
const TOOLS = [
  'bash',
  'node',
  'psql',
  'pgrep',
  'dirname',
  'sed',
  'awk',
  'cat',
  'grep',
  'head',
  'cut',
  'tr',
  'mktemp',
  'rm',
  'mkdir'
];

const TEMP_DIRS: Array<string> = [];
afterAll(() => {
  for (const dir of TEMP_DIRS) rmSync(dir, { recursive: true, force: true });
});

function tempDir(prefix: string): string {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  TEMP_DIRS.push(dir);
  return dir;
}

/** Finds an executable on the PATH this spec runs with, or `undefined`. */
function which(tool: string): string | undefined {
  for (const dir of (process.env.PATH ?? '').split(delimiter)) {
    const candidate = join(dir, tool);
    if (dir && existsSync(candidate)) return candidate;
  }
  return undefined;
}

/** Writes an executable that exits 0, standing in for a tool the host lacks. */
function shim(dir: string, tool: string): void {
  writeFileSync(join(dir, tool), '#!/bin/sh\nexit 0\n');
  chmodSync(join(dir, tool), 0o755);
}

/**
 * A directory of links to the tools that are present, standing in for PATH. A missing `psql` or `pgrep` gets a stand-in, so that the accepting cases reach the Docker check on any host.
 * @param withDockerShim - Whether to add a `docker` that answers `docker info` with status 0, for the case of `--target local`.
 */
function binDir(withDockerShim: boolean): string {
  const dir = tempDir('check-drift-bin-');
  for (const tool of TOOLS) {
    const found = which(tool);
    if (found) symlinkSync(found, join(dir, tool));
    else if (tool === 'psql' || tool === 'pgrep') shim(dir, tool);
  }
  if (withDockerShim) shim(dir, 'docker');
  return dir;
}

const BIN_WITHOUT_DOCKER = binDir(false);
const BIN_WITH_DOCKER_SHIM = binDir(true);

/**
 * A work directory: the local `config.toml`, an empty `supabase/migrations`, and the link file when given.
 * @param linkedRef - The content of `supabase/.temp/project-ref`, or `undefined` for no such file.
 */
function workdir(linkedRef: string | undefined): string {
  const dir = tempDir('check-drift-workdir-');
  mkdirSync(join(dir, 'supabase', 'migrations'), { recursive: true });
  copyFileSync(resolve(REPO_ROOT, CONFIG_PATH), join(dir, 'supabase', 'config.toml'));
  if (linkedRef !== undefined) {
    mkdirSync(join(dir, 'supabase', '.temp'));
    writeFileSync(join(dir, 'supabase', '.temp', 'project-ref'), linkedRef);
  }
  return dir;
}

interface RunResult {
  status: number | null;
  stderr: string;
}

/**
 * Run the check with no PG* variable of this process, and the case's own.
 * @param pg - The PG* variables of the case.
 */
function run(args: Array<string>, pg: Record<string, string>, bin: string = BIN_WITHOUT_DOCKER): RunResult {
  const env: NodeJS.ProcessEnv = {};
  for (const [key, value] of Object.entries(process.env)) if (!key.startsWith('PG')) env[key] = value;
  Object.assign(env, pg, { PATH: bin });
  const result = spawnSync('bash', [SCRIPT_PATH, ...args], {
    cwd: REPO_ROOT,
    env,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout: 15_000
  });
  return { status: result.status, stderr: result.stderr };
}

/** The arguments of a linked run in `dir`. */
function linked(dir: string): Array<string> {
  return ['--target', 'linked', '--workdir', dir];
}

const DIRECT = { PGHOST: `db.${REF}.supabase.co`, PGPORT: '5432', PGUSER: 'postgres', PGDATABASE: 'postgres' };

describe('the stand-in PATH', () => {
  it('holds no docker, so a refusal seen below came before the Docker check', () => {
    expect(readdirSync(BIN_WITHOUT_DOCKER)).not.toContain('docker');
  });
});

describe('check-drift.sh --target linked refuses a connection that is not the linked project', () => {
  it('refuses a work directory that is not linked', () => {
    const { status, stderr } = run(linked(workdir(undefined)), DIRECT);
    expect(status).toBe(2);
    expect(stderr).toContain('not linked');
  });

  it('refuses a link file that does not hold a project ref', () => {
    const { status, stderr } = run(linked(workdir('Not-A-Ref')), DIRECT);
    expect(status).toBe(2);
    expect(stderr).toContain('20 lower-case letters');
  });

  it('refuses a direct host of another project, naming both refs', () => {
    const { status, stderr } = run(linked(workdir(REF)), { ...DIRECT, PGHOST: `db.${OTHER_REF}.supabase.co` });
    expect(status).toBe(2);
    expect(stderr).toContain(REF);
    expect(stderr).toContain(OTHER_REF);
    expect(stderr).toContain('two different databases');
  });

  it('refuses a pooler user of another project, naming both refs', () => {
    const { status, stderr } = run(linked(workdir(REF)), {
      ...DIRECT,
      PGHOST: POOLER_HOST,
      PGUSER: `postgres.${OTHER_REF}`
    });
    expect(status).toBe(2);
    expect(stderr).toContain(REF);
    expect(stderr).toContain(OTHER_REF);
  });

  it('refuses a host that only ends like a pooler host', () => {
    const { status, stderr } = run(linked(workdir(REF)), {
      ...DIRECT,
      PGHOST: `db.example.com,${POOLER_HOST}`,
      PGUSER: `postgres.${REF}`
    });
    expect(status).toBe(2);
    expect(stderr).toContain('two different databases');
  });

  it('refuses the transaction pooler port', () => {
    const { status, stderr } = run(linked(workdir(REF)), { ...DIRECT, PGPORT: '6543' });
    expect(status).toBe(2);
    expect(stderr).toContain('transaction pooler');
  });

  it('refuses a run with no PGHOST', () => {
    const { status, stderr } = run(linked(workdir(REF)), {
      PGPORT: '5432',
      PGUSER: 'postgres',
      PGDATABASE: 'postgres'
    });
    expect(status).toBe(2);
    expect(stderr).toContain('PGHOST');
  });

  it('refuses PGHOSTADDR and PGSERVICE, which can send psql past PGHOST', () => {
    for (const extra of [{ PGHOSTADDR: '192.0.2.1' }, { PGSERVICE: 'elsewhere' }]) {
      const { status, stderr } = run(linked(workdir(REF)), { ...DIRECT, ...extra });
      expect(status).toBe(2);
      expect(stderr).toContain(Object.keys(extra)[0]);
    }
  });

  it('refuses the work directory of the shared local stack', () => {
    const { status, stderr } = run(linked('apps/supabase'), DIRECT);
    expect(status).toBe(2);
    expect(stderr).toContain('shared local stack');
  });
});

describe('check-drift.sh --target linked lets the linked project through', () => {
  it('accepts the direct host of the linked project, and stops only at the missing docker', () => {
    const { status, stderr } = run(linked(workdir(REF)), DIRECT);
    expect(status).toBe(2);
    expect(stderr).toContain('docker is not on PATH');
  });

  it('accepts a session pooler host with the linked project in the user, and stops only at the missing docker', () => {
    const { status, stderr } = run(linked(workdir(REF)), { ...DIRECT, PGHOST: POOLER_HOST, PGUSER: `postgres.${REF}` });
    expect(status).toBe(2);
    expect(stderr).toContain('docker is not on PATH');
  });
});

describe('check-drift.sh --target local is unchanged', () => {
  it('still refuses a PGHOST that is not a loopback address, with its own message', () => {
    const { status, stderr } = run(
      ['--target', 'local', '--workdir', workdir(undefined)],
      { ...DIRECT, PGHOST: 'db.example.com', PGPORT: '54322' },
      BIN_WITH_DOCKER_SHIM
    );
    expect(status).toBe(2);
    expect(stderr).toContain('PGHOST is not a loopback address');
  });
});
