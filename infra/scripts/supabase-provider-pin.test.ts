/**
 * Keeps one pin for the Supabase provider, so that a lock cannot select a version the roots would refuse.
 *
 * - Every `required_providers` entry for `supabase/supabase`, in `infra/modules/supabase/main.tf` and in each `infra/envs/<env>/supabase/main.tf`, pins `= PIN`.
 * - Every tracked `.terraform.lock.hcl` that holds the provider records `version = "PIN"` and `constraints = "PIN"`. A lock records the union of the constraints of the module and the root it was written in, so a wider constraint in either one shows up here.
 *
 * The locks are the ones git tracks, so a lock left in a `.terraform` directory is not read. Each lock is written by `terraform providers lock`, never by hand. No Terraform runs.
 *
 * The rule is shown red on mutated in-memory copies, so that its green result on the real files means something.
 */

import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '../..');

/** The one version of the Supabase provider every pin and every lock names. */
const PIN = '1.11.0';
/** The provider's address in a lock. */
const PROVIDER_ADDRESS = 'registry.terraform.io/supabase/supabase';
/** The provider's source in `required_providers`. */
const PROVIDER_SOURCE = 'supabase/supabase';
/** The module directory whose `main.tf` declares the provider. */
const MODULE_DIR = 'infra/modules/supabase';
/** The Supabase roots that must be read, so the rule is not vacuous. */
const REQUIRED_ROOTS = ['infra/envs/staging/supabase', 'infra/envs/example/supabase', 'infra/envs/scratch/supabase'];

/** A file the rule reads: its path from the repository root and its text. */
type SourceFile = { path: string; text: string };

/** One provider block of a dependency lock: its address, the version it selects and the constraints it records. */
type LockProvider = { address: string; version: string | undefined; constraints: string | undefined };

/** The provider blocks of a `.terraform.lock.hcl` text. */
function lockProviders(text: string): Array<LockProvider> {
  return [...text.matchAll(/^provider "([^"]+)" \{\n([\s\S]*?)^\}/gm)].map(([, address, body]) => ({
    address,
    version: /^\s*version\s*=\s*"([^"]*)"/m.exec(body)?.[1],
    constraints: /^\s*constraints\s*=\s*"([^"]*)"/m.exec(body)?.[1]
  }));
}

/** The `version` of every `required_providers` entry whose source is the Supabase provider, in a `main.tf` text. */
function providerPins(text: string): Array<string | undefined> {
  return [...text.matchAll(/^\s*[A-Za-z0-9_-]+\s*=\s*\{([^{}]*)\}/gm)]
    .map(([, body]) => body)
    .filter((body) => new RegExp(`^\\s*source\\s*=\\s*"${PROVIDER_SOURCE}"`, 'm').test(body))
    .map((body) => /^\s*version\s*=\s*"([^"]*)"/m.exec(body)?.[1]);
}

/** Every tracked lock that holds the Supabase provider. */
function supabaseLocks(): Array<SourceFile> {
  const tracked = execFileSync('git', ['ls-files', '*.terraform.lock.hcl'], { cwd: REPO_ROOT, encoding: 'utf8' })
    .split('\n')
    .filter((path) => path.length > 0);
  return tracked
    .map((path) => ({ path, text: readFileSync(join(REPO_ROOT, path), 'utf8') }))
    .filter(({ text }) => lockProviders(text).some(({ address }) => address === PROVIDER_ADDRESS))
    .sort((a, b) => a.path.localeCompare(b.path));
}

/** The `main.tf` of the module and of every `infra/envs/<env>/supabase` root. */
function pinFiles(): Array<SourceFile> {
  const envs = join(REPO_ROOT, 'infra', 'envs');
  const roots = readdirSync(envs, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && existsSync(join(envs, entry.name, 'supabase', 'main.tf')))
    .map((entry) => `infra/envs/${entry.name}/supabase`);
  return [MODULE_DIR, ...roots.sort()].map((dir) => ({
    path: `${dir}/main.tf`,
    text: readFileSync(join(REPO_ROOT, dir, 'main.tf'), 'utf8')
  }));
}

/** The violations of the one-pin rule across `locks` and `pins`. */
function pinViolations(locks: Array<SourceFile>, pins: Array<SourceFile>): Array<string> {
  const violations: Array<string> = [];
  for (const { path, text } of locks) {
    for (const { address, version, constraints } of lockProviders(text)) {
      if (address !== PROVIDER_ADDRESS) continue;
      if (version !== PIN || constraints !== PIN) {
        violations.push(
          `${path} records version ${JSON.stringify(version)} and constraints ${JSON.stringify(constraints)} for ${address}, not "${PIN}" and "${PIN}"`
        );
      }
    }
  }
  for (const { path, text } of pins) {
    const found = providerPins(text);
    if (found.length === 0) violations.push(`${path} declares no required_providers entry for ${PROVIDER_SOURCE}`);
    for (const version of found) {
      if (version !== `= ${PIN}`) {
        violations.push(`${path} pins ${PROVIDER_SOURCE} to ${JSON.stringify(version)}, not "= ${PIN}"`);
      }
    }
  }
  return violations;
}

const LOCKS = supabaseLocks();
const PINS = pinFiles();

describe(`supabase-provider-pin: the module, the roots and every lock name ${PROVIDER_SOURCE} ${PIN} alone`, () => {
  it('reads the module lock, the three root locks and the four main.tf files, so the rule is not vacuous', () => {
    const dirs = [MODULE_DIR, ...REQUIRED_ROOTS];
    expect(LOCKS.map(({ path }) => path)).toEqual(
      expect.arrayContaining(dirs.map((dir) => `${dir}/.terraform.lock.hcl`))
    );
    expect(PINS.map(({ path }) => path)).toEqual(expect.arrayContaining(dirs.map((dir) => `${dir}/main.tf`)));
  });

  it('finds no violation in the real files', () => {
    expect(pinViolations(LOCKS, PINS)).toEqual([]);
  });

  it('reports a red copy of a lock whose constraints also hold a wider range', () => {
    const lock = LOCKS[0];
    const text = lock.text.replace(/^(\s*constraints\s*=\s*)"[^"]*"/m, `$1"${PIN}, ~> 1.11"`);
    expect(text).not.toBe(lock.text);
    expect(pinViolations([{ path: lock.path, text }], PINS)).toHaveLength(1);
  });

  it('reports a red copy of a main.tf that pins a range', () => {
    const pin = PINS[0];
    const text = pin.text.replace(/(source\s*=\s*"supabase\/supabase"\s*\n\s*version\s*=\s*)"[^"]*"/, '$1"~> 1.11"');
    expect(text).not.toBe(pin.text);
    expect(pinViolations(LOCKS, [{ path: pin.path, text }])).toHaveLength(1);
  });
});
