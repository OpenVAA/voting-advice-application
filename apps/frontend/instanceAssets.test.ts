// @vitest-environment node

// Node environment for the same reason as `vite.projectIdEnv.test.ts`: this file builds real directory trees and spawns child processes, neither of which wants the project-wide jsdom realm.
import { spawn } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  symlinkSync,
  writeFileSync
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import { instanceAssetsDir } from './instanceAssets.js';

/**
 * The instance static-asset layer: `instance/static/` laid over the frontend's `static/` by relative path.
 *
 * Each case builds a throwaway repo root holding a frontend directory, so nothing here depends on the checkout's own `instance/` or `apps/frontend/static/`.
 */
describe('instanceAssetsDir', () => {
  const roots: Array<string> = [];

  /** Make a repo root with a frontend dir whose `static/` holds `favicon.png` and `fonts/inter.css`. */
  function makeTree(): { repoRoot: string; frontendDir: string } {
    const repoRoot = mkdtempSync(join(tmpdir(), 'openvaa-instance-assets-'));
    roots.push(repoRoot);
    const frontendDir = join(repoRoot, 'apps', 'frontend');
    writeFile(join(frontendDir, 'static', 'favicon.png'), 'BASE');
    writeFile(join(frontendDir, 'static', 'fonts', 'inter.css'), 'BASE-FONT');
    writeFile(join(frontendDir, 'static', 'images', 'hero.png'), 'BASE-HERO');
    return { repoRoot, frontendDir };
  }

  /** Write `contents` to `path`, creating its parent directories. */
  function writeFile(path: string, contents: string): void {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, contents, 'utf8');
  }

  /** Every regular file under `dir`, as sorted relative paths. */
  function listFiles(dir: string): Array<string> {
    return (readdirSync(dir, { recursive: true, withFileTypes: true }) as Array<import('node:fs').Dirent>)
      .filter((entry) => entry.isFile())
      .map((entry) => relative(dir, join(entry.parentPath, entry.name)))
      .sort();
  }

  afterEach(() => {
    while (roots.length) rmSync(roots.pop() as string, { recursive: true, force: true });
  });

  it('returns static and creates nothing when there is no instance directory', () => {
    const { repoRoot, frontendDir } = makeTree();
    expect(instanceAssetsDir({ repoRoot, frontendDir })).toBe('static');
    expect(existsSync(join(frontendDir, '.instance'))).toBe(false);
  });

  it('returns static when instance/ holds only a README', () => {
    const { repoRoot, frontendDir } = makeTree();
    writeFile(join(repoRoot, 'instance', 'README.md'), '# Instance');
    expect(instanceAssetsDir({ repoRoot, frontendDir })).toBe('static');
    expect(existsSync(join(frontendDir, '.instance'))).toBe(false);
  });

  it('returns static when instance/static is empty or holds only empty directories', () => {
    const { repoRoot, frontendDir } = makeTree();
    mkdirSync(join(repoRoot, 'instance', 'static'), { recursive: true });
    expect(instanceAssetsDir({ repoRoot, frontendDir })).toBe('static');
    mkdirSync(join(repoRoot, 'instance', 'static', 'images', 'empty'), { recursive: true });
    expect(instanceAssetsDir({ repoRoot, frontendDir })).toBe('static');
    expect(existsSync(join(frontendDir, '.instance'))).toBe(false);
  });

  it('lays an instance file over the base file of the same path and keeps the base-only files', () => {
    const { repoRoot, frontendDir } = makeTree();
    writeFile(join(repoRoot, 'instance', 'static', 'favicon.png'), 'INSTANCE');
    const dir = instanceAssetsDir({ repoRoot, frontendDir });
    expect(dir).toBe(resolve(frontendDir, '.instance/static'));
    expect(readFileSync(join(dir, 'favicon.png'), 'utf8')).toBe('INSTANCE');
    expect(readFileSync(join(dir, 'fonts', 'inter.css'), 'utf8')).toBe('BASE-FONT');
    expect(readFileSync(join(frontendDir, 'static', 'favicon.png'), 'utf8')).toBe('BASE');
  });

  it('overrides a nested file by path and adds instance-only files', () => {
    const { repoRoot, frontendDir } = makeTree();
    writeFile(join(repoRoot, 'instance', 'static', 'images', 'hero.png'), 'INSTANCE-HERO');
    writeFile(join(repoRoot, 'instance', 'static', 'images', 'logo.svg'), 'INSTANCE-LOGO');
    const dir = instanceAssetsDir({ repoRoot, frontendDir });
    expect(readFileSync(join(dir, 'images', 'hero.png'), 'utf8')).toBe('INSTANCE-HERO');
    expect(readFileSync(join(dir, 'images', 'logo.svg'), 'utf8')).toBe('INSTANCE-LOGO');
    expect(readFileSync(join(dir, 'favicon.png'), 'utf8')).toBe('BASE');
    expect(listFiles(dir)).toEqual(
      ['.instance-fingerprint', 'favicon.png', 'fonts/inter.css', 'images/hero.png', 'images/logo.svg'].sort()
    );
  });

  it('rebuilds the merged dir when the inputs change, dropping files left from an earlier build', () => {
    const { repoRoot, frontendDir } = makeTree();
    writeFile(join(repoRoot, 'instance', 'static', 'favicon.png'), 'INSTANCE');
    writeFile(join(repoRoot, 'instance', 'static', 'extra.txt'), 'EXTRA');
    const dir = instanceAssetsDir({ repoRoot, frontendDir });
    writeFile(join(dir, 'stale.txt'), 'STALE');
    rmSync(join(repoRoot, 'instance', 'static', 'extra.txt'));
    expect(instanceAssetsDir({ repoRoot, frontendDir })).toBe(dir);
    expect(existsSync(join(dir, 'stale.txt'))).toBe(false);
    expect(existsSync(join(dir, 'extra.txt'))).toBe(false);
    expect(readFileSync(join(dir, 'favicon.png'), 'utf8')).toBe('INSTANCE');
  });

  it('reuses the merged dir untouched when the inputs are unchanged', () => {
    const { repoRoot, frontendDir } = makeTree();
    writeFile(join(repoRoot, 'instance', 'static', 'favicon.png'), 'INSTANCE');
    const dir = instanceAssetsDir({ repoRoot, frontendDir });
    const before = statSync(dir);
    const markerBefore = statSync(join(dir, '.instance-fingerprint'));
    expect(instanceAssetsDir({ repoRoot, frontendDir })).toBe(dir);
    const after = statSync(dir);
    expect(after.ino).toBe(before.ino);
    expect(statSync(join(dir, '.instance-fingerprint')).mtimeMs).toBe(markerBefore.mtimeMs);
    expect(readdirSync(join(frontendDir, '.instance'))).toEqual(['static']);
  });

  it('gives two concurrent loaders the same complete dir and leaves no temporary siblings', async () => {
    const { repoRoot, frontendDir } = makeTree();
    writeFile(join(repoRoot, 'instance', 'static', 'favicon.png'), 'INSTANCE');
    writeFile(join(repoRoot, 'instance', 'static', 'images', 'logo.svg'), 'INSTANCE-LOGO');
    const moduleUrl = pathToFileURL(fileURLToPath(new URL('./instanceAssets.js', import.meta.url))).href;
    const script = `import { instanceAssetsDir } from ${JSON.stringify(moduleUrl)};
process.stdout.write(instanceAssetsDir({ repoRoot: ${JSON.stringify(repoRoot)}, frontendDir: ${JSON.stringify(frontendDir)} }));`;

    function load(): Promise<{ code: number | null; out: string; err: string }> {
      return new Promise((done) => {
        const child = spawn(process.execPath, ['--input-type=module', '-e', script]);
        let out = '';
        let err = '';
        child.stdout.on('data', (chunk) => (out += chunk));
        child.stderr.on('data', (chunk) => (err += chunk));
        child.on('close', (code) => done({ code, out, err }));
      });
    }

    const results = await Promise.all([load(), load()]);
    const expected = resolve(frontendDir, '.instance/static');
    for (const result of results) {
      expect(result.err).toBe('');
      expect(result.code).toBe(0);
      expect(result.out).toBe(expected);
    }
    expect(listFiles(expected)).toEqual(
      ['.instance-fingerprint', 'favicon.png', 'fonts/inter.css', 'images/hero.png', 'images/logo.svg'].sort()
    );
    expect(readdirSync(join(frontendDir, '.instance'))).toEqual(['static']);
  });

  it('refuses a symlinked file, naming it, before writing anything', () => {
    const { repoRoot, frontendDir } = makeTree();
    const outside = join(repoRoot, 'secret.txt');
    writeFile(outside, 'SECRET');
    writeFile(join(repoRoot, 'instance', 'static', 'favicon.png'), 'INSTANCE');
    symlinkSync(outside, join(repoRoot, 'instance', 'static', 'link.png'));
    expect(() => instanceAssetsDir({ repoRoot, frontendDir })).toThrow(
      'instance/static/link.png is a symbolic link; symbolic links are not allowed in instance/static'
    );
    expect(existsSync(join(frontendDir, '.instance'))).toBe(false);
  });

  it('refuses a symlinked directory, naming it, and leaves an earlier merged dir intact', () => {
    const { repoRoot, frontendDir } = makeTree();
    writeFile(join(repoRoot, 'instance', 'static', 'favicon.png'), 'INSTANCE');
    const dir = instanceAssetsDir({ repoRoot, frontendDir });
    const outsideDir = join(repoRoot, 'outside');
    writeFile(join(outsideDir, 'secret.txt'), 'SECRET');
    mkdirSync(join(repoRoot, 'instance', 'static', 'images'), { recursive: true });
    symlinkSync(outsideDir, join(repoRoot, 'instance', 'static', 'images', 'linked'));
    expect(() => instanceAssetsDir({ repoRoot, frontendDir })).toThrow(
      'instance/static/images/linked is a symbolic link; symbolic links are not allowed in instance/static'
    );
    expect(readFileSync(join(dir, 'favicon.png'), 'utf8')).toBe('INSTANCE');
    expect(readdirSync(join(frontendDir, '.instance'))).toEqual(['static']);
  });
});
