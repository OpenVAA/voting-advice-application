import { spawnSync } from 'child_process';
import { mkdir, mkdtemp, readdir, readFile, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import * as path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { REPO_ROOT } from './docs-scripts.config';
import { findTypeFile, generateComponentDocs } from './generate-component-docs';

let root: string;

beforeEach(async () => {
  root = await mkdtemp(path.join(tmpdir(), 'docs-components-'));
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

/**
 * Write a component with a `@component` docstring.
 * @param dir - The directory it is written to.
 * @param name - The component's name.
 */
async function writeComponent(dir: string, name: string): Promise<void> {
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, `${name}.svelte`), `<!--\n@component\nThe ${name} component.\n-->\n<div></div>\n`);
}

describe('generateComponentDocs', () => {
  it('fails, and writes nothing, when a component directory holds no component', async () => {
    const empty = path.join(root, 'empty');
    const out = path.join(root, 'out');
    await mkdir(empty);

    await expect(
      generateComponentDocs({
        outputDir: out,
        componentDirs: [{ dir: empty, name: 'Empty', importPrefix: '$lib/components', categorySubdir: 'components' }]
      })
    ).rejects.toThrow(/no component/i);
    await expect(readdir(out)).rejects.toThrow();
  });

  it('removes a page left in the output directory by an earlier run', async () => {
    const components = path.join(root, 'components');
    const out = path.join(root, 'out');
    await writeComponent(components, 'Alpha');
    await mkdir(path.join(out, 'components', 'Removed'), { recursive: true });
    await writeFile(path.join(out, 'components', 'Removed', '+page.md'), '# Removed\n');

    await generateComponentDocs({
      outputDir: out,
      componentDirs: [
        { dir: components, name: 'Static', importPrefix: '$lib/components', categorySubdir: 'components' }
      ]
    });

    expect((await readdir(out)).sort()).toEqual(['README.md', 'components']);
    expect(await readdir(path.join(out, 'components'))).toEqual(['Alpha']);
  });

  it('links each component in the table of contents to the page it writes', async () => {
    const statics = path.join(root, 'statics');
    const contestant = path.join(root, 'contestant');
    const out = path.join(root, 'out');
    await writeComponent(path.join(statics, 'button'), 'Button');
    await writeComponent(path.join(contestant, 'card'), 'Card');

    await generateComponentDocs({
      outputDir: out,
      componentDirs: [
        { dir: statics, name: 'Static', importPrefix: '$lib/components', categorySubdir: 'components' },
        {
          dir: contestant,
          name: 'Contestant',
          importPrefix: '$contestant/components',
          categorySubdir: 'contestant/components'
        }
      ]
    });

    const toc = await readFile(path.join(out, 'README.md'), 'utf-8');
    const linked = [...toc.matchAll(/\]\(\/developers-guide\/frontend\/components\/generated\/([^)]+)\)/g)].map(
      (m) => m[1]
    );
    expect(linked).toEqual(['components/button/Button', 'contestant/components/card/Card']);
    for (const page of linked) {
      await expect(readFile(path.join(out, page, '+page.md'), 'utf-8')).resolves.toContain('# ');
    }
  });
});

describe('findTypeFile', () => {
  it('finds the type file of a component in a directory whose name contains .svelte', async () => {
    const dir = path.join(root, 'a.svelte-kit', 'thing');
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, 'Thing.svelte'), '<div></div>\n');
    await writeFile(path.join(dir, 'Thing.type.ts'), 'export type ThingProps = object;\n');

    expect(await findTypeFile(path.join(dir, 'Thing.svelte'))).toBe(path.join(dir, 'Thing.type.ts'));
  });
});

describe('the staging directory', () => {
  it('is ignored by git', () => {
    const probe = spawnSync('git', ['check-ignore', '-q', 'apps/docs/scripts/.temp/components/README.md'], {
      cwd: REPO_ROOT
    });
    expect(probe.status).toBe(0);
  });
});
