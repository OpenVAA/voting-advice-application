import { mkdtemp, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import * as path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { compareNavigations, generateTypeScript, loadCurrentConfig } from './generate-navigation-config';
import type { Navigation } from '../src/lib/navigation.type';

let root: string;

beforeEach(async () => {
  root = await mkdtemp(path.join(tmpdir(), 'docs-navigation-'));
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

const NAVIGATION: Navigation = [
  {
    title: 'Guide',
    route: '/guide',
    fixedTitle: true,
    children: [{ title: 'Start', route: '/guide/start', isSecondary: true }]
  }
];

describe('loadCurrentConfig', () => {
  it('reads a config whose array is followed by a TypeScript construct', async () => {
    const file = path.join(root, 'navigation.config.ts');
    await writeFile(
      file,
      `import type { Navigation } from './navigation.type';\n\nexport const navigation = ${JSON.stringify(NAVIGATION)} satisfies Navigation;\n`
    );

    expect(await loadCurrentConfig(file)).toEqual(NAVIGATION);
  });

  it('fails on a config it cannot read, rather than starting from an empty navigation', async () => {
    const file = path.join(root, 'navigation.config.ts');
    await writeFile(file, 'export const navigation: Navigation = [{ title: };\n');

    await expect(loadCurrentConfig(file)).rejects.toThrow();
  });

  it('starts from an empty navigation when there is no config yet', async () => {
    expect(await loadCurrentConfig(path.join(root, 'absent.config.ts'))).toEqual([]);
  });
});

describe('a section that becomes an item', () => {
  it('records each of its children as removed', () => {
    const current: Navigation = [
      {
        title: 'Guide',
        route: '/guide',
        children: [{ title: 'Topic', route: '/guide/topic', children: [{ title: 'Deep', route: '/guide/topic/deep' }] }]
      }
    ];
    const discovered: Navigation = [
      { title: 'Guide', route: '/guide', children: [{ title: 'Topic', route: '/guide/topic' }] }
    ];

    const output = generateTypeScript(compareNavigations(current, discovered));

    expect(output).toContain('// Removed: /guide/topic/deep');
    expect(output).toContain('route: "/guide/topic"');
  });
});
