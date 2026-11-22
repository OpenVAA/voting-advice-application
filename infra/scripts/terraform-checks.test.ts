/**
 * The credential-free Terraform checks of CI, run against a stub `terraform`.
 *
 * Each case copies the script into a throwaway tree of root and module directories and runs it with a `terraform` stub first on the `PATH` that records its arguments and fails on the one call a case names. No Terraform command runs, and the child gets a minimal environment, so no credential of the shell that runs the suite reaches it.
 */

import { spawnSync } from 'node:child_process';
import {
  chmodSync,
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
import { afterEach, describe, expect, it } from 'vitest';
import { TERRAFORM_CHECKS_SCRIPT, terraformChecksArray } from './terraformChecksLists';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '../..');
const SCRIPT = TERRAFORM_CHECKS_SCRIPT;
const CLI = join(REPO_ROOT, 'scripts', 'lib', 'cli.sh');

const REQUIRED_ROOTS = terraformChecksArray('REQUIRED_ROOTS');
const LOCKED_MODULES = terraformChecksArray('LOCKED_MODULES');
const EXAMPLE_ROOTS = REQUIRED_ROOTS.filter((root) => root.startsWith('infra/envs/example/'));

/** The layout of a tree: its roots, and its modules with whether each has a tests directory. */
type Tree = { roots: Array<string>; testedRoots: Array<string>; modules: Record<string, boolean> };

const FULL_TREE: Tree = {
  roots: [...REQUIRED_ROOTS, 'infra/envs/scratch/supabase'],
  testedRoots: [...EXAMPLE_ROOTS, 'infra/bootstrap'],
  modules: { 'infra/modules/supabase': true, 'infra/modules/frontend-service': true, 'infra/modules/budget': false }
};

interface RunResult {
  status: number | null;
  stdout: string;
  stderr: string;
  /** The stub's calls, one argument list per line. */
  calls: Array<string>;
}

const dirs: Array<string> = [];

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

/** Run the script with `args` in a fresh tree laid out as `tree`; the stub fails with status 7 on the call `failOn`. */
function run(args: Array<string>, tree: Tree = FULL_TREE, failOn = ''): RunResult {
  const root = mkdtempSync(join(tmpdir(), 'terraform-checks-test-'));
  dirs.push(root);
  const repo = join(root, 'repo');
  const bin = join(root, 'bin');
  const log = join(root, 'calls.log');
  mkdirSync(join(repo, 'infra', 'scripts'), { recursive: true });
  copyFileSync(SCRIPT, join(repo, 'infra', 'scripts', 'terraform-checks.sh'));
  mkdirSync(join(repo, 'scripts', 'lib'), { recursive: true });
  copyFileSync(CLI, join(repo, 'scripts', 'lib', 'cli.sh'));
  for (const dir of tree.roots) mkdirSync(join(repo, dir), { recursive: true });
  for (const dir of tree.testedRoots) mkdirSync(join(repo, dir, 'tests'), { recursive: true });
  for (const [module, tested] of Object.entries(tree.modules))
    mkdirSync(join(repo, module, ...(tested ? ['tests'] : [])), { recursive: true });
  mkdirSync(bin);
  writeFileSync(
    join(bin, 'terraform'),
    '#!/usr/bin/env bash\nprintf \'%s\\n\' "$*" >> "$CALLS_LOG"\nif [ "$*" = "$FAIL_ON" ]; then exit 7; fi\nexit 0\n'
  );
  chmodSync(join(bin, 'terraform'), 0o755);
  writeFileSync(log, '');
  const result = spawnSync('bash', [join(repo, 'infra', 'scripts', 'terraform-checks.sh'), ...args], {
    cwd: root,
    encoding: 'utf8',
    env: { PATH: `${bin}:${process.env.PATH ?? ''}`, HOME: root, CALLS_LOG: log, FAIL_ON: failOn },
    timeout: 30_000
  });
  return {
    status: result.status,
    stdout: result.stdout,
    stderr: result.stderr,
    calls: readFileSync(log, 'utf8').split('\n').filter(Boolean)
  };
}

/** `tree` without the root or module `dir`. */
function without(tree: Tree, dir: string): Tree {
  return {
    roots: tree.roots.filter((root) => root !== dir),
    testedRoots: tree.testedRoots.filter((root) => root !== dir),
    modules: Object.fromEntries(Object.entries(tree.modules).filter(([module]) => module !== dir))
  };
}

describe('terraform-checks.sh validate', () => {
  it('initialises against the lock file and validates every root, whatever the working directory', () => {
    const result = run(['validate']);
    expect(result.status, result.stderr).toBe(0);
    const roots = FULL_TREE.roots;
    expect(result.calls.sort()).toEqual(
      roots
        .flatMap((root) => [
          `-chdir=${root} init -backend=false -input=false -lockfile=readonly`,
          `-chdir=${root} validate -no-color`
        ])
        .sort()
    );
    expect(result.stdout).toContain(`validated ${roots.length} roots:`);
  });

  for (const missing of REQUIRED_ROOTS.filter((root) => root.startsWith('infra/envs/'))) {
    it(`fails naming ${missing} when the glob does not reach it`, () => {
      const result = run(['validate'], without(FULL_TREE, missing));
      expect(result.status).toBe(1);
      expect(result.stdout).toContain(`::error::${missing} was not among the roots validated`);
    });
  }

  it('stops with the status of a validate that failed', () => {
    const result = run(['validate'], FULL_TREE, '-chdir=infra/envs/staging/aws validate -no-color');
    expect(result.status).toBe(7);
    expect(result.stdout).not.toContain('validated ');
  });
});

describe('terraform-checks.sh test-modules', () => {
  it('tests every module that has a tests directory, reading the tracked lock files read-only', () => {
    const result = run(['test-modules']);
    expect(result.status, result.stderr).toBe(0);
    expect(result.calls).toEqual([
      '-chdir=infra/modules/frontend-service init -backend=false -input=false',
      '-chdir=infra/modules/frontend-service test -no-color',
      '-chdir=infra/modules/supabase init -backend=false -input=false -lockfile=readonly',
      '-chdir=infra/modules/supabase test -no-color'
    ]);
    expect(result.stdout).toContain('tested 2 modules:');
  });

  it('fails when no module has a tests directory', () => {
    const result = run(['test-modules'], { ...FULL_TREE, modules: { 'infra/modules/budget': false } });
    expect(result.status).toBe(1);
    expect(result.stdout).toContain('::error::No module under infra/modules has a tests directory');
    expect(result.calls).toEqual([]);
  });

  it('stops with the status of a module test that failed', () => {
    const result = run(['test-modules'], FULL_TREE, '-chdir=infra/modules/supabase test -no-color');
    expect(result.status).toBe(7);
  });
});

describe('terraform-checks.sh plan-examples', () => {
  it('runs the tests of every example root that has them, against the lock file', () => {
    const result = run(['plan-examples']);
    expect(result.status, result.stderr).toBe(0);
    expect(result.calls.sort()).toEqual(
      EXAMPLE_ROOTS.flatMap((root) => [
        `-chdir=${root} init -backend=false -input=false -lockfile=readonly`,
        `-chdir=${root} test -verbose -no-color`
      ]).sort()
    );
  });

  for (const missing of EXAMPLE_ROOTS) {
    it(`fails naming ${missing} when it has no tests directory`, () => {
      const result = run(['plan-examples'], { ...FULL_TREE, testedRoots: EXAMPLE_ROOTS.filter((r) => r !== missing) });
      expect(result.status).toBe(1);
      expect(result.stdout).toContain(`::error::${missing} was not among the example roots planned`);
    });
  }
});

describe('terraform-checks.sh test-bootstrap', () => {
  it('runs the tests of the bootstrap root, against the lock file', () => {
    const result = run(['test-bootstrap']);
    expect(result.status, result.stderr).toBe(0);
    expect(result.calls).toEqual([
      '-chdir=infra/bootstrap init -backend=false -input=false -lockfile=readonly',
      '-chdir=infra/bootstrap test -verbose -no-color'
    ]);
    expect(result.stdout).toContain('tested 1 bootstrap roots: infra/bootstrap');
  });

  it('fails naming infra/bootstrap when it has no tests directory', () => {
    const result = run(['test-bootstrap'], { ...FULL_TREE, testedRoots: EXAMPLE_ROOTS });
    expect(result.status).toBe(1);
    expect(result.stdout).toContain('::error::infra/bootstrap was not among the bootstrap roots tested');
    expect(result.calls).toEqual([]);
  });

  it('stops with the status of a bootstrap test that failed', () => {
    const result = run(['test-bootstrap'], FULL_TREE, '-chdir=infra/bootstrap test -verbose -no-color');
    expect(result.status).toBe(7);
    expect(result.stdout).not.toContain('tested ');
  });
});

describe('terraform-checks.sh usage', () => {
  for (const args of [[], ['plan'], ['validate', 'test-modules']]) {
    it(`exits 2 on ${JSON.stringify(args)}`, () => {
      const result = run(args);
      expect(result.status).toBe(2);
      expect(result.stderr).toContain('usage: terraform-checks.sh');
      expect(result.calls).toEqual([]);
    });
  }

  it('prints its header on --help', () => {
    const result = run(['--help']);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('Usage:');
  });
});

describe('the lists of terraform-checks.sh match the repository', () => {
  it('names required roots that exist and hold Terraform, three of them example roots', () => {
    expect(EXAMPLE_ROOTS).toHaveLength(3);
    for (const root of REQUIRED_ROOTS) {
      expect(existsSync(join(REPO_ROOT, root)), root).toBe(true);
      expect(
        readdirSync(join(REPO_ROOT, root)).some((name) => name.endsWith('.tf')),
        root
      ).toBe(true);
    }
  });

  it('names as locked only modules that have tests and a lock file', () => {
    expect(LOCKED_MODULES.length).toBeGreaterThan(0);
    for (const module of LOCKED_MODULES) {
      expect(existsSync(join(REPO_ROOT, module, 'tests')), module).toBe(true);
      expect(existsSync(join(REPO_ROOT, module, '.terraform.lock.hcl')), module).toBe(true);
    }
  });

  it('names as locked every module whose lock file git tracks or would track', () => {
    const listed = spawnSync(
      'git',
      ['ls-files', '--cached', '--others', '--exclude-standard', '--', 'infra/modules/*/.terraform.lock.hcl'],
      { cwd: REPO_ROOT, encoding: 'utf8' }
    );
    expect(listed.status, listed.stderr).toBe(0);
    const lockedOnDisk = listed.stdout
      .split('\n')
      .filter(Boolean)
      .map((path) => dirname(path));
    expect(lockedOnDisk.length).toBeGreaterThan(0);
    for (const module of lockedOnDisk) expect(LOCKED_MODULES, module).toContain(module);
  });
});
