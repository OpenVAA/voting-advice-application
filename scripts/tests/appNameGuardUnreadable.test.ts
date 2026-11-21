/**
 * The app-name guard, `scripts/assert-no-candidate-app-names.mjs`, fails closed on a tracked file it cannot read.
 *
 * The guard scans every path `git ls-files` lists. A file whose contents it cannot read, a broken symbolic link among them, is a file whose names it never saw, so in gate mode it is reported on stderr and fails the run. Two entries are not reported: a tracked symbolic link to a directory, which has no contents of its own while the files under its target are scanned where they are tracked, and a tracked path deleted from the working tree, which holds nothing.
 *
 * The guard, its module and its fixtures are copied into a throwaway repository of its own and run there as a child process, so the tracked set is exactly what each case states and the real tree is never touched.
 */

import { spawnSync } from 'node:child_process';
import {
  chmodSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  symlinkSync,
  writeFileSync
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import type { SpawnSyncReturns } from 'node:child_process';

const HERE = dirname(fileURLToPath(import.meta.url));
/** `scripts/tests` → repo root. */
const REPO_ROOT = resolve(HERE, '../..');
const GUARD = 'scripts/assert-no-candidate-app-names.mjs';
/** The guard's module and the fixtures its gate runs its self-test over, copied beside it. */
const GUARD_SUPPORT = [
  'scripts/lib/text-guard.mjs',
  'scripts/fixtures/assert-no-candidate-app-names.input.ts',
  'scripts/fixtures/assert-no-candidate-app-names.expected.ts.violations'
];

const roots = new Array<string>();

afterEach(() => {
  for (const root of roots.splice(0)) {
    // The unreadable case's file is given its mode back, so the directory can be removed.
    if (existsSync(join(root, 'unreadable.ts'))) chmodSync(join(root, 'unreadable.ts'), 0o644);
    rmSync(root, { recursive: true, force: true });
  }
});

/**
 * A repository holding the guard with its module and fixtures, one readable file and whatever `populate` adds, every file tracked.
 * @param populate - Adds the case's own entries, given the repository's root.
 * @returns The repository's root.
 */
function repositoryWith(populate: (root: string) => void): string {
  const root = mkdtempSync(join(tmpdir(), 'app-name-guard-'));
  roots.push(root);
  for (const file of [GUARD, ...GUARD_SUPPORT]) {
    mkdirSync(dirname(join(root, file)), { recursive: true });
    copyFileSync(resolve(REPO_ROOT, file), join(root, file));
  }
  writeFileSync(join(root, 'readable.ts'), 'export const contestant = 1;\n');
  populate(root);
  spawnSync('git', ['init', '-q'], { cwd: root });
  spawnSync('git', ['add', '-A'], { cwd: root });
  return root;
}

/**
 * Run the guard in a repository.
 * @param root - The repository's root.
 * @returns The spawn result.
 */
function runGuard(root: string): SpawnSyncReturns<string> {
  return spawnSync(process.execPath, [GUARD], { cwd: root, encoding: 'utf8' });
}

describe('the app-name guard on a tracked file it cannot read', () => {
  it('passes a repository whose every tracked file it reads', () => {
    const result = runGuard(repositoryWith(() => undefined));
    expect(result.status).toBe(0);
    expect(result.stdout).toBe('');
  });

  // Run as root, a mode of 000 still reads, so the case has nothing to show.
  it.skipIf(process.getuid?.() === 0)('fails and names a tracked file whose contents it cannot read', () => {
    const root = repositoryWith((r) => writeFileSync(join(r, 'unreadable.ts'), 'export const x = 1;\n'));
    chmodSync(join(root, 'unreadable.ts'), 0o000);

    const result = runGuard(root);

    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/cannot read unreadable\.ts: EACCES/);
    expect(result.stderr).toMatch(/1 unreadable/);
  });

  it('passes over a tracked symbolic link to a directory without a report', () => {
    const root = repositoryWith((r) => {
      mkdirSync(join(r, 'target'));
      writeFileSync(join(r, 'target', 'inside.ts'), 'export const y = 1;\n');
      symlinkSync('target', join(r, 'linked'));
    });

    const result = runGuard(root);

    expect(result.status).toBe(0);
    expect(result.stderr).not.toMatch(/cannot read/);
  });

  it('fails and names a tracked symbolic link whose target is missing', () => {
    const root = repositoryWith((r) => symlinkSync('nowhere.ts', join(r, 'broken.ts')));

    const result = runGuard(root);

    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/cannot read broken\.ts: ENOENT/);
    expect(result.stderr).toMatch(/1 unreadable/);
  });

  it('passes over a tracked file deleted from the working tree without a report', () => {
    const root = repositoryWith((r) => writeFileSync(join(r, 'deleted.ts'), 'export const z = 1;\n'));
    rmSync(join(root, 'deleted.ts'));

    const result = runGuard(root);

    expect(result.status).toBe(0);
    expect(result.stderr).not.toMatch(/cannot read/);
  });
});
