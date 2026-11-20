import { mkdtemp, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import * as path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  buildNavigationStructure,
  compareNavigations,
  generateTypeScript,
  loadCurrentConfig
} from './generate-navigation-config';
import type { Navigation, NavigationItem, NavigationSection } from '../src/lib/navigation.type';
import type { RouteInfo } from './utils/routes';

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

describe('a nested section with a page of its own', () => {
  function routes(...paths: Array<string>): Array<RouteInfo> {
    return paths.map((route) => ({ route, fullPath: route, title: route.split('/').pop(), hasPage: true }));
  }

  function findChild(navigation: Navigation, route: string): NavigationSection | NavigationItem | undefined {
    return navigation[0].children.find((child) => child.route === route);
  }

  it('lists its own page first, as an Overview child with a fixed title', () => {
    const navigation = buildNavigationStructure(routes('/guide', '/guide/topic', '/guide/topic/deep'));

    const topic = findChild(navigation, '/guide/topic');
    expect(topic && 'children' in topic ? topic.children[0] : undefined).toEqual({
      title: 'Overview',
      route: '/guide/topic',
      fixedTitle: true
    });
  });

  it('gets no Overview child when the section has no page of its own', () => {
    const navigation = buildNavigationStructure(routes('/guide', '/guide/topic/deep'));

    const topic = findChild(navigation, '/guide/topic');
    expect(topic && 'children' in topic ? topic.children.map((child) => child.route) : undefined).toEqual([
      '/guide/topic/deep'
    ]);
  });

  it('keeps an Overview child already in the config as an existing entry', () => {
    const current: Navigation = [
      {
        title: 'Guide',
        route: '/guide',
        children: [
          {
            title: 'Topic',
            route: '/guide/topic',
            children: [
              { title: 'Overview', route: '/guide/topic', fixedTitle: true },
              { title: 'deep', route: '/guide/topic/deep' }
            ]
          }
        ]
      }
    ];
    const discovered = buildNavigationStructure(routes('/guide', '/guide/topic', '/guide/topic/deep'));

    const output = generateTypeScript(compareNavigations(current, discovered));

    expect(output).not.toContain('// Removed');
    expect(output).not.toContain('// New');
    expect(output).toMatch(/title: "Overview",\s+route: "\/guide\/topic",\s+fixedTitle: true/);
  });
});
