/**
 * Every workspace package this package's source imports is declared in its `package.json`.
 *
 * A workspace package resolves through the monorepo's hoisted `node_modules` whether or not it is declared, so an undeclared import builds and passes its tests here and breaks only for a consumer that installs this package alone, or for a build tool that orders packages by their declared dependencies. The source files are read as text: every `from '@openvaa/…'` and `import('@openvaa/…')` specifier of a non-test file is collected and its package looked up in `dependencies` and `peerDependencies`.
 */

import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';

const PACKAGE_DIR = fileURLToPath(new URL('..', import.meta.url));
const SOURCE_DIR = join(PACKAGE_DIR, 'src');
const SPECIFIER = /(?:\bfrom\s*|\bimport\s*\(\s*)['"](@openvaa\/[^'"/]+)/g;

type Manifest = {
  name: string;
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
};

const manifest = JSON.parse(readFileSync(join(PACKAGE_DIR, 'package.json'), 'utf8')) as Manifest;
const declared = new Set([
  ...Object.keys(manifest.dependencies ?? {}),
  ...Object.keys(manifest.peerDependencies ?? {})
]);

/**
 * Each workspace import of a non-test source file, as the file's path relative to the package and the imported package's name.
 */
function workspaceImports(): Array<{ file: string; pkg: string }> {
  const files = readdirSync(SOURCE_DIR, { recursive: true, encoding: 'utf8' }).filter(
    (path) => path.endsWith('.ts') && !path.endsWith('.test.ts')
  );
  return files.flatMap((path) => {
    const text = readFileSync(join(SOURCE_DIR, path), 'utf8');
    const file = relative(PACKAGE_DIR, join(SOURCE_DIR, path));
    return [...text.matchAll(SPECIFIER)].map((match) => ({ file, pkg: match[1] }));
  });
}

describe(`${manifest.name} — declared workspace dependencies`, () => {
  const imports = workspaceImports();

  test('the source imports at least one workspace package, so the check has something to read', () => {
    expect(imports.length).toBeGreaterThan(0);
  });

  test('every workspace package the source imports is a dependency or a peer dependency', () => {
    const undeclared = imports
      .filter(({ pkg }) => pkg !== manifest.name && !declared.has(pkg))
      .map(({ file, pkg }) => `${file} imports ${pkg}`);
    expect(undeclared).toEqual([]);
  });
});
