/**
 * The repository runs Yarn with `enableScripts: false`, and the root manifest's `dependenciesMeta` re-enables install scripts package by package. An entry for a package that has no install script allows nothing today and would allow, unreviewed, any script a later release of it adds; the `supabase` CLI this workspace runs is one such package. So each entry must name a package whose installed manifest declares an install script.
 */

import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const ROOT_MANIFEST = fileURLToPath(new URL('../../../package.json', import.meta.url));
const INSTALL_SCRIPTS = ['preinstall', 'install', 'postinstall'];

describe('the install-script allow-list', () => {
  it('names only packages that declare an install script', () => {
    const manifest = JSON.parse(readFileSync(ROOT_MANIFEST, 'utf8'));
    const allowed = Object.entries(manifest.dependenciesMeta ?? {})
      .filter(([, meta]) => (meta as { built?: boolean }).built === true)
      .map(([name]) => name);
    const require = createRequire(ROOT_MANIFEST);

    expect(allowed.length).toBeGreaterThan(0);
    const withoutScript = allowed.filter((name) => {
      const scripts: Record<string, string> = require(`${name}/package.json`).scripts ?? {};
      return !INSTALL_SCRIPTS.some((script) => script in scripts);
    });
    expect(withoutScript).toEqual([]);
  });
});
