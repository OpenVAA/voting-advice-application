/**
 * Every package the source imports is declared in this package's manifest. An undeclared import resolves only through a copy another workspace hoisted, so it breaks, or changes version, when that workspace's manifest changes.
 */

import { readdirSync, readFileSync } from 'node:fs';
import { builtinModules } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const PACKAGE_ROOT = fileURLToPath(new URL('../..', import.meta.url));

/** The specifier of every static `import` or `export ... from` statement that names a package rather than a relative path. */
const PACKAGE_IMPORT = /(?:^|\n)\s*(?:import|export)\b[^;]*?\bfrom\s+'([^'.][^']*)'/g;

function sourceFiles(dir: string): Array<string> {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(entryPath);
    return entry.name.endsWith('.ts') ? [entryPath] : [];
  });
}

function packageName(specifier: string): string {
  const segments = specifier.split('/');
  return specifier.startsWith('@') ? segments.slice(0, 2).join('/') : segments[0];
}

describe('the manifest', () => {
  it('declares every package the source imports', () => {
    const manifest = JSON.parse(readFileSync(path.join(PACKAGE_ROOT, 'package.json'), 'utf8'));
    const declared = new Set(Object.keys({ ...manifest.dependencies, ...manifest.peerDependencies }));
    const imported = new Set(
      sourceFiles(path.join(PACKAGE_ROOT, 'src')).flatMap((file) =>
        Array.from(readFileSync(file, 'utf8').matchAll(PACKAGE_IMPORT), (match) => packageName(match[1]))
      )
    );

    expect(imported.size).toBeGreaterThan(0);
    const undeclared = [...imported].filter(
      (name) => !name.startsWith('node:') && !builtinModules.includes(name) && !declared.has(name)
    );
    expect(undeclared).toEqual([]);
  });
});
