/**
 * The hosted-settings parity guard's WIRING and TEETH, asserted rather than described.
 *
 * The guard compares the security-relevant API and auth settings of the local `config.toml` with the hosted settings the Terraform module sends, and fails when they disagree. It is only worth anything on the days it runs and on the days it can still fail: a guard deleted from the `lint:check` chain keeps passing when run by hand, and a guard that stopped comparing keeps reporting green on a clean tree. This spec holds both properties, wiring by reading `package.json`, teeth by running the guard on a hosted settings file that disagrees on one key and on an environments directory that holds no origin.
 *
 * The guard is run as a child process and never imported, so no copy of its classification exists here to drift from the real one.
 *
 * The invariant on the chain is MEMBERSHIP of the `&&` chain, never position, never the whole string, never the link count. Guards are appended to the chain freely, and an assertion on position or length reddens a correct append.
 */

import { spawnSync } from 'node:child_process';
import {
  copyFileSync,
  existsSync,
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
import { afterAll, describe, expect, it } from 'vitest';
import type { SpawnSyncReturns } from 'node:child_process';

const HERE = dirname(fileURLToPath(import.meta.url));
/** `packages/dev-seed/tests` → repo root. */
const REPO_ROOT = resolve(HERE, '../../..');

const GUARD_PATH = 'scripts/assert-hosted-settings-parity.mjs';
const SETTINGS_PATH = 'infra/modules/supabase/hosted-settings.json';
const FIXTURE_MAX_ROWS = 'scripts/fixtures/hosted-settings-parity/hosted-settings.max-rows-49999.json';

const ROOT_PACKAGE_JSON = JSON.parse(readFileSync(resolve(REPO_ROOT, 'package.json'), 'utf8')) as {
  scripts: Record<string, string>;
};

/** An empty directory standing in for `infra/envs`, so that the guard finds no Supabase root and no origin. */
const EMPTY_ENVS = mkdtempSync(join(tmpdir(), 'hosted-settings-parity-'));
/** The copies of `infra/envs` made by `copyOfEnvs`, removed after the run. */
const COPIES: Array<string> = [];
afterAll(() => {
  for (const dir of [EMPTY_ENVS, ...COPIES]) rmSync(dir, { recursive: true, force: true });
});

/**
 * Copy the `.tf` files and the `terraform.tfvars` of every Supabase root under `infra/envs` into a directory of its own, so that a test can edit a root the guard must then refuse. Nothing else is copied: no state, no plan and no `.terraform/`.
 * @returns The directory, standing in for `infra/envs`.
 */
function copyOfEnvs(): string {
  const dir = mkdtempSync(join(tmpdir(), 'hosted-settings-parity-envs-'));
  COPIES.push(dir);
  const envsDir = resolve(REPO_ROOT, 'infra/envs');
  for (const env of readdirSync(envsDir)) {
    const root = join(envsDir, env, 'supabase');
    if (!existsSync(root)) continue;
    mkdirSync(join(dir, env, 'supabase'), { recursive: true });
    for (const name of readdirSync(root))
      if (name.endsWith('.tf') || name === 'terraform.tfvars')
        copyFileSync(join(root, name), join(dir, env, 'supabase', name));
  }
  return dir;
}

/**
 * Replace one text in a file, failing when it is not there, so that an edit cannot silently test nothing.
 * @param file - The file.
 * @param from - The text to replace.
 * @param to - Its replacement.
 */
function edit(file: string, from: string | RegExp, to: string): void {
  const text = readFileSync(file, 'utf8');
  const edited = text.replace(from, to);
  if (edited === text) throw new Error(`${file} does not hold ${String(from)}`);
  writeFileSync(file, edited);
}

/** A proxy on a closed local port, so that a run which wrongly reached a network would fail fast instead of reaching a hosted API. */
const UNREACHABLE_NETWORK = {
  HTTPS_PROXY: 'http://127.0.0.1:9',
  HTTP_PROXY: 'http://127.0.0.1:9',
  ALL_PROXY: 'http://127.0.0.1:9'
};

/**
 * Run the guard from the repository root, offline and with no hosted credential.
 * @param args - The guard's arguments.
 * @returns The spawn result, with stdout and stderr as text.
 */
function runGuard(args: Array<string>): SpawnSyncReturns<string> {
  const env: NodeJS.ProcessEnv = { ...process.env, ...UNREACHABLE_NETWORK };
  delete env.SUPABASE_ACCESS_TOKEN;
  return spawnSync(process.execPath, [GUARD_PATH, ...args], {
    cwd: REPO_ROOT,
    env,
    encoding: 'utf8',
    timeout: 15_000
  });
}

/**
 * Copy the repository's `config.toml` into a directory of its own, with a text appended.
 * @param appended - The text appended to the copy.
 * @returns The copy's path.
 */
function copyOfConfig(appended = ''): string {
  const dir = mkdtempSync(join(tmpdir(), 'hosted-settings-parity-config-'));
  COPIES.push(dir);
  const config = join(dir, 'config.toml');
  writeFileSync(config, `${readFileSync(resolve(REPO_ROOT, 'apps/supabase/supabase/config.toml'), 'utf8')}${appended}`);
  return config;
}

/**
 * Every leaf of a parsed JSON value, as a path and the leaf's JSON text.
 * @param value - The parsed value.
 * @param prefix - The path of `value`.
 * @returns A map from leaf path to the leaf's JSON text.
 */
function leaves(value: unknown, prefix = ''): Map<string, string> {
  const out = new Map<string, string>();
  if (value !== null && typeof value === 'object') {
    for (const [key, child] of Object.entries(value))
      for (const entry of leaves(child, `${prefix}/${key}`)) out.set(...entry);
  } else out.set(prefix, JSON.stringify(value));
  return out;
}

describe('the hosted-settings parity guard is wired so it actually runs', () => {
  it('keeps `yarn assert:hosted-settings-parity` a blocking link of lint:check', () => {
    const links = ROOT_PACKAGE_JSON.scripts['lint:check'].split('&&').map((link) => link.trim());
    expect(links).toContain('yarn assert:hosted-settings-parity');
  });

  it('points the registered script at the guard it claims to run', () => {
    // A chain link naming a script key that no longer exists fails with a bare "command not found", which names no invariant.
    expect(ROOT_PACKAGE_JSON.scripts['assert:hosted-settings-parity']).toBe(
      'node scripts/assert-hosted-settings-parity.mjs'
    );
  });

  it('keeps the guard file itself present and recognisable', () => {
    expect(readFileSync(resolve(REPO_ROOT, GUARD_PATH), 'utf8')).toContain('HOSTED-SETTINGS PARITY GUARD');
  });
});

describe('the hosted-settings parity guard still has teeth', () => {
  it('passes on the repository and prints its census', () => {
    const result = runGuard([]);
    expect(result.status).toBe(0);
    expect(result.stderr).toMatch(/census: [1-9]\d* live key\(s\)/);
    expect(result.stderr).toMatch(/[1-9]\d* origin\(s\) checked/);
  });

  it('keeps the fixture one value away from the real hosted settings, so it cannot drift into testing nothing', () => {
    const real = leaves(JSON.parse(readFileSync(resolve(REPO_ROOT, SETTINGS_PATH), 'utf8')));
    const fixture = leaves(JSON.parse(readFileSync(resolve(REPO_ROOT, FIXTURE_MAX_ROWS), 'utf8')));
    const paths = new Set([...real.keys(), ...fixture.keys()]);
    const differing = [...paths].filter((p) => real.get(p) !== fixture.get(p));
    expect(differing).toEqual(['/api/max_rows']);
    expect(fixture.get('/api/max_rows')).toBe('49999');
  });

  it('fails on hosted settings that disagree on max_rows and names the key', () => {
    const result = runGuard(['--settings', FIXTURE_MAX_ROWS]);
    expect(result.status).toBe(1);
    expect(result.stdout).toContain('api/max_rows');
  });

  it('fails when no Supabase root yields an origin, because a check that examined nothing does not pass', () => {
    const result = runGuard(['--envs-dir', EMPTY_ENVS]);
    expect(result.status).toBe(1);
    expect(result.stdout).toContain('auth/site_url');
  });

  it("fails when a root's module call switches the send-email hook off with a literal false", () => {
    const envs = copyOfEnvs();
    edit(
      join(envs, 'staging/supabase/main.tf'),
      /enable_send_email_hook(\s*)= var\.enable_send_email_hook/,
      'enable_send_email_hook$1= false'
    );
    const result = runGuard(['--envs-dir', envs]);
    expect(result.status).toBe(1);
    expect(result.stdout).toMatch(/staging\/supabase\/main\.tf: auth\.hook\.send_email\/enabled: /);
  });

  it('fails when a root leaves a hook switch out of terraform.tfvars and its own default is false', () => {
    const envs = copyOfEnvs();
    edit(join(envs, 'staging/supabase/terraform.tfvars'), /^enable_access_token_hook\s*=.*\n/m, '');
    edit(
      join(envs, 'staging/supabase/variables.tf'),
      'variable "enable_access_token_hook" {\n',
      'variable "enable_access_token_hook" {\n  default = false\n'
    );
    const result = runGuard(['--envs-dir', envs]);
    expect(result.status).toBe(1);
    expect(result.stdout).toMatch(/staging\/supabase\/variables\.tf: auth\.hook\.custom_access_token\/enabled: /);
  });

  it('fails on a Supabase root with no terraform.tfvars next to the good ones, and names it', () => {
    const envs = copyOfEnvs();
    mkdirSync(join(envs, 'prod/supabase'), { recursive: true });
    copyFileSync(join(envs, 'staging/supabase/main.tf'), join(envs, 'prod/supabase/main.tf'));
    const result = runGuard(['--envs-dir', envs]);
    expect(result.status).toBe(1);
    expect(result.stdout).toMatch(/prod\/supabase\/terraform\.tfvars: root\/terraform\.tfvars: /);
  });

  it('checks a root that calls the module from a directory not named supabase', () => {
    const envs = copyOfEnvs();
    mkdirSync(join(envs, 'prod/app'), { recursive: true });
    for (const name of ['main.tf', 'variables.tf', 'terraform.tfvars'])
      copyFileSync(join(envs, 'staging/supabase', name), join(envs, 'prod/app', name));
    edit(
      join(envs, 'prod/app/terraform.tfvars'),
      /^enable_send_email_hook(\s*)= true/m,
      'enable_send_email_hook$1= false'
    );
    const result = runGuard(['--envs-dir', envs]);
    expect(result.status).toBe(1);
    expect(result.stdout).toMatch(/prod\/app\/terraform\.tfvars: auth\.hook\.send_email\/enabled: /);
  });

  it('passes on an unedited copy of the roots, so the tests above fail on their edit alone', () => {
    expect(runGuard(['--envs-dir', copyOfEnvs()]).status).toBe(0);
  });

  it('classifies the keys under a quoted table header that follows a table outside the family', () => {
    const result = runGuard(['--config', copyOfConfig('\n[auth.external."github"]\nenabled = true\n')]);
    expect(result.status).toBe(1);
    expect(result.stdout).toContain('auth.external.github/enabled');
  });

  it('fails on a [functions.*] key that no row classifies, and names it', () => {
    const result = runGuard(['--config', copyOfConfig('\n[functions.new-function]\nverify_jwt = false\n')]);
    expect(result.status).toBe(1);
    expect(result.stdout).toContain('functions.new-function/verify_jwt');
  });

  it('passes on an unedited copy of config.toml, so the test above fails on its added table alone', () => {
    expect(runGuard(['--config', copyOfConfig()]).status).toBe(0);
  });

  it('fails when a further map is merged into the auth settings the module sends', () => {
    const dir = mkdtempSync(join(tmpdir(), 'hosted-settings-parity-module-'));
    COPIES.push(dir);
    const moduleDir = resolve(REPO_ROOT, 'infra/modules/supabase');
    for (const name of readdirSync(moduleDir))
      if (name.endsWith('.tf') || name === 'hosted-settings.json') copyFileSync(join(moduleDir, name), join(dir, name));
    edit(join(dir, 'settings.tf'), /(local\.auth_smtp,\n)(\s*\))/, '$1    var.extra_auth,\n$2');
    const result = runGuard(['--module-dir', dir]);
    expect(result.status).toBe(1);
    expect(result.stdout).toContain('module/local.auth');
  });

  it('reproduces its embedded cases in self-test mode', () => {
    expect(runGuard(['--self-test']).status).toBe(0);
  });

  it('refuses an unknown argument with a usage error', () => {
    const result = runGuard(['--no-such-flag']);
    expect(result.status).toBe(2);
    expect(result.stderr).toContain('usage:');
  });
});
