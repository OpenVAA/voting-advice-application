import { chmod, mkdir, mkdtemp, readdir, readFile, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import * as path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { moveTarget, transformMarkdownLinks } from './move-generated';

let root: string;

beforeEach(async () => {
  root = await mkdtemp(path.join(tmpdir(), 'docs-move-'));
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

describe('moveTarget', () => {
  it('leaves the committed destination whole when the transform fails partway', async () => {
    const routes = path.join(root, 'routes');
    const dest = path.join(routes, 'generated');
    const src = path.join(root, 'temp', 'components');
    await mkdir(path.join(dest, 'kept'), { recursive: true });
    await writeFile(path.join(dest, 'kept', '+page.md'), '# Kept\n');
    await mkdir(src, { recursive: true });
    await writeFile(path.join(src, 'a.md'), '# A\n');
    await writeFile(path.join(src, 'b.md'), '# B\n');
    await chmod(path.join(src, 'b.md'), 0o000);

    try {
      await expect(moveTarget(src, dest, routes)).rejects.toThrow();
    } finally {
      await chmod(path.join(src, 'b.md'), 0o644);
    }
    expect(await readdir(dest)).toEqual(['kept']);
    expect(await readFile(path.join(dest, 'kept', '+page.md'), 'utf-8')).toBe('# Kept\n');
  });

  it('refuses to clear a destination outside the routes directory', async () => {
    const routes = path.join(root, 'routes');
    const outside = path.join(root, 'elsewhere');
    const src = path.join(root, 'temp', 'components');
    await mkdir(routes, { recursive: true });
    await mkdir(outside, { recursive: true });
    await writeFile(path.join(outside, 'precious.txt'), 'keep');
    await mkdir(src, { recursive: true });
    await writeFile(path.join(src, 'a.md'), '# A\n');

    await expect(moveTarget(src, outside, routes)).rejects.toThrow(/outside/);
    expect(await readdir(outside)).toEqual(['precious.txt']);
  });

  it('replaces the destination with the transformed source and removes the source', async () => {
    const routes = path.join(root, 'routes');
    const dest = path.join(routes, 'generated');
    const src = path.join(root, 'temp', 'components');
    await mkdir(path.join(dest, 'stale'), { recursive: true });
    await writeFile(path.join(dest, 'stale', '+page.md'), '# Stale\n');
    await mkdir(src, { recursive: true });
    await writeFile(path.join(src, 'README.md'), '# Index\n');
    await writeFile(path.join(src, 'a.md'), '# A\n');

    await moveTarget(src, dest, routes);

    expect((await readdir(dest)).sort()).toEqual(['+page.md', 'a']);
    expect(await readFile(path.join(dest, 'a', '+page.md'), 'utf-8')).toBe('# A\n');
    await expect(readdir(src)).rejects.toThrow();
  });
});

describe('transformMarkdownLinks', () => {
  it('turns README and .md links into directory links', () => {
    expect(transformMarkdownLinks('[a](foo/README.md) [b](README.md) [c](foo/bar.md#x)')).toBe(
      '[a](foo) [b](.) [c](foo/bar#x)'
    );
  });

  it('leaves an external URL ending in /README.md as it is', () => {
    const external = '[repo](https://github.com/OpenVAA/voting-advice-application/blob/main/README.md)';
    expect(transformMarkdownLinks(external)).toBe(external);
  });

  it('keeps the anchor of a README link', () => {
    expect(transformMarkdownLinks('[a](foo/README.md#setup) [b](README.md#setup)')).toBe('[a](foo#setup) [b](.#setup)');
  });

  it('leaves a fenced code block as it is', () => {
    const fenced = '```md\n[a](foo/README.md) [c](foo/bar.md)\n```';
    expect(transformMarkdownLinks(fenced)).toBe(fenced);
  });
});
