/**
 * The service-role locality guard as seen through the seed and teardown CLIs.
 *
 * Each case runs the real CLI in a subprocess. SUPABASE_URL, PUBLIC_SUPABASE_URL, the key and the opt-out are all preset in the child's environment, so the repo-root `.env` the CLI loads cannot change them.
 *
 * The `.env` load-order cases instead export none of them and simulate the repo-root `.env` through the `fixtures/simulateRootEnv.mjs` preload, which also disables the network, so the real `.env` is neither read nor written and no database is contacted.
 */

import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';
import { USAGE } from '../../src/cli/help';
import { TEARDOWN_USAGE } from '../../src/cli/teardown-help';

const HERE = dirname(fileURLToPath(import.meta.url));
const PACKAGE_ROOT = resolve(HERE, '../..');
const TEARDOWN_CLI = resolve(PACKAGE_ROOT, 'src/cli/teardown.ts');
const SEED_CLI = resolve(PACKAGE_ROOT, 'src/cli/seed.ts');
const SIMULATE_ROOT_ENV = pathToFileURL(resolve(HERE, 'fixtures/simulateRootEnv.mjs')).href;

const REFUSAL_MARKER = 'Refusing to use the service-role key against non-local Supabase host';
const DUMMY_KEY = 'not-a-real-key';

// Non-local by the allowlist, yet nothing can answer on it, so the refusal and its opt-out need no network.
const UNREACHABLE_NON_LOCAL = 'http://0.0.0.0:9';
const UNREACHABLE_LOCAL = 'http://127.0.0.1:9';

interface CliRun {
  status: number | null;
  stdout: string;
  stderr: string;
}

function runCli(cli: string, cliArgs: Array<string>, supabaseUrl: string, allowRemoteEnv = ''): CliRun {
  const result = spawnSync(process.execPath, ['--import', 'tsx', cli, ...cliArgs], {
    cwd: PACKAGE_ROOT,
    encoding: 'utf8',
    timeout: 60000,
    env: {
      ...process.env,
      SUPABASE_URL: supabaseUrl,
      PUBLIC_SUPABASE_URL: supabaseUrl,
      SUPABASE_SERVICE_ROLE_KEY: DUMMY_KEY,
      DEV_SEED_ALLOW_REMOTE: allowRemoteEnv
    }
  });
  return { status: result.status, stdout: result.stdout, stderr: result.stderr };
}

describe('teardown CLI locality guard', () => {
  function teardown(url: string, extra: Array<string> = [], allowRemoteEnv = ''): CliRun {
    return runCli(TEARDOWN_CLI, ['--prefix', 'guardprobe_', ...extra], url, allowRemoteEnv);
  }

  it('refuses a remote host by name without leaking the key', () => {
    const run = teardown('https://guard-probe.invalid');
    expect(run.status).toBe(1);
    expect(run.stderr).toContain(REFUSAL_MARKER);
    expect(run.stderr).toContain('guard-probe.invalid');
    expect(run.stdout).not.toContain('Teardown complete');
    expect(run.stdout + run.stderr).not.toContain(DUMMY_KEY);
  });

  it('refuses a non-local host with no opt-out', () => {
    const run = teardown(UNREACHABLE_NON_LOCAL);
    expect(run.status).toBe(1);
    expect(run.stderr).toContain(REFUSAL_MARKER);
  });

  it('gets past the guard with --allow-remote', () => {
    const run = teardown(UNREACHABLE_NON_LOCAL, ['--allow-remote']);
    expect(run.status).toBe(1);
    expect(run.stderr).toContain(`Cannot reach Supabase at ${UNREACHABLE_NON_LOCAL}`);
    expect(run.stderr).not.toContain(REFUSAL_MARKER);
  });

  it('gets past the guard with DEV_SEED_ALLOW_REMOTE=1', () => {
    const run = teardown(UNREACHABLE_NON_LOCAL, [], '1');
    expect(run.status).toBe(1);
    expect(run.stderr).toContain(`Cannot reach Supabase at ${UNREACHABLE_NON_LOCAL}`);
    expect(run.stderr).not.toContain(REFUSAL_MARKER);
  });

  it('lets a local host through', () => {
    const run = teardown(UNREACHABLE_LOCAL);
    expect(run.status).toBe(1);
    expect(run.stderr).toContain('Cannot reach Supabase');
    expect(run.stderr).not.toContain(REFUSAL_MARKER);
  });
});

describe('TEARDOWN_USAGE documents the locality guard', () => {
  it('names --allow-remote', () => {
    expect(TEARDOWN_USAGE).toContain('--allow-remote');
  });

  it('names DEV_SEED_ALLOW_REMOTE', () => {
    expect(TEARDOWN_USAGE).toContain('DEV_SEED_ALLOW_REMOTE');
  });
});

describe('seed CLI locality guard', () => {
  function seed(url: string, extra: Array<string> = [], allowRemoteEnv = ''): CliRun {
    return runCli(SEED_CLI, ['--template', 'e2e/base', ...extra], url, allowRemoteEnv);
  }

  it('refuses a remote host by name without leaking the key', () => {
    const run = seed('https://guard-probe.invalid');
    expect(run.status).toBe(1);
    expect(run.stderr).toContain(REFUSAL_MARKER);
    expect(run.stderr).toContain('guard-probe.invalid');
    expect(run.stdout + run.stderr).not.toContain(DUMMY_KEY);
  });

  it('refuses a non-local host with no opt-out', () => {
    const run = seed(UNREACHABLE_NON_LOCAL);
    expect(run.status).toBe(1);
    expect(run.stderr).toContain(REFUSAL_MARKER);
  });

  it('gets past the guard with --allow-remote', () => {
    const run = seed(UNREACHABLE_NON_LOCAL, ['--allow-remote']);
    expect(run.status).toBe(1);
    expect(run.stderr).toContain(`Cannot reach Supabase at ${UNREACHABLE_NON_LOCAL}`);
    expect(run.stderr).not.toContain(REFUSAL_MARKER);
  });

  it('gets past the guard with DEV_SEED_ALLOW_REMOTE=1', () => {
    const run = seed(UNREACHABLE_NON_LOCAL, [], '1');
    expect(run.status).toBe(1);
    expect(run.stderr).toContain(`Cannot reach Supabase at ${UNREACHABLE_NON_LOCAL}`);
    expect(run.stderr).not.toContain(REFUSAL_MARKER);
  });

  it('lets a local host through', () => {
    const run = seed(UNREACHABLE_LOCAL);
    expect(run.status).toBe(1);
    expect(run.stderr).toContain('Cannot reach Supabase');
    expect(run.stderr).not.toContain(REFUSAL_MARKER);
  });
});

describe('seed USAGE documents the locality guard', () => {
  it('names --allow-remote', () => {
    expect(USAGE).toContain('--allow-remote');
  });

  it('names DEV_SEED_ALLOW_REMOTE', () => {
    expect(USAGE).toContain('DEV_SEED_ALLOW_REMOTE');
  });
});

describe('the CLIs read the Supabase URL and key after loading the repo-root .env', () => {
  const REMOTE_HOST = 'guard-probe.invalid';
  const REMOTE_URL = `https://${REMOTE_HOST}`;

  /** Run a CLI with the given simulated repo-root `.env` and none of the Supabase variables exported. */
  function runWithRootEnv(cli: string, cliArgs: Array<string>, rootEnv: Record<string, string>): CliRun {
    const env: NodeJS.ProcessEnv = { ...process.env, SIMULATED_ROOT_ENV: JSON.stringify(rootEnv) };
    delete env.SUPABASE_URL;
    delete env.PUBLIC_SUPABASE_URL;
    delete env.SUPABASE_SERVICE_ROLE_KEY;
    delete env.DEV_SEED_ALLOW_REMOTE;
    const result = spawnSync(process.execPath, ['--import', 'tsx', '--import', SIMULATE_ROOT_ENV, cli, ...cliArgs], {
      cwd: PACKAGE_ROOT,
      encoding: 'utf8',
      timeout: 60000,
      env
    });
    return { status: result.status, stdout: result.stdout, stderr: result.stderr };
  }

  it('teardown refuses a non-local SUPABASE_URL that only the .env sets', () => {
    const run = runWithRootEnv(TEARDOWN_CLI, ['--prefix', 'guardprobe_'], {
      SUPABASE_URL: REMOTE_URL,
      SUPABASE_SERVICE_ROLE_KEY: DUMMY_KEY
    });
    expect(run.status).toBe(1);
    expect(run.stderr).toContain(REFUSAL_MARKER);
    expect(run.stderr).toContain(REMOTE_HOST);
    expect(run.stdout).not.toContain('Teardown complete');
    expect(run.stdout + run.stderr).not.toContain(DUMMY_KEY);
  });

  it('teardown refuses a non-local PUBLIC_SUPABASE_URL that only the .env sets', () => {
    const run = runWithRootEnv(TEARDOWN_CLI, ['--prefix', 'guardprobe_'], {
      PUBLIC_SUPABASE_URL: REMOTE_URL,
      SUPABASE_SERVICE_ROLE_KEY: DUMMY_KEY
    });
    expect(run.status).toBe(1);
    expect(run.stderr).toContain(REFUSAL_MARKER);
    expect(run.stderr).toContain(REMOTE_HOST);
    expect(run.stdout).not.toContain('Teardown complete');
  });

  it('seed refuses a non-local SUPABASE_URL that only the .env sets', () => {
    // A control: the seed CLI's Writer reads the environment when it is constructed, after the `.env` load.
    const run = runWithRootEnv(SEED_CLI, ['--template', 'e2e/base'], {
      SUPABASE_URL: REMOTE_URL,
      SUPABASE_SERVICE_ROLE_KEY: DUMMY_KEY
    });
    expect(run.status).toBe(1);
    expect(run.stderr).toContain(REFUSAL_MARKER);
    expect(run.stderr).toContain(REMOTE_HOST);
    expect(run.stdout + run.stderr).not.toContain(DUMMY_KEY);
  });
});
