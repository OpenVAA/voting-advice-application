/**
 * The Edge Functions import their npm packages as `npm:<name>@<version>` literals, which Deno resolves when a function boots, outside `yarn.lock` and outside the dependency audit. These cases hold the literals to each other and, for a package this workspace also installs, to the installed version, so a lockfile refresh that moves the installed package cannot leave a function on another version unnoticed.
 */

import { readdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const FUNCTIONS_DIR = fileURLToPath(new URL('../supabase/functions', import.meta.url));
const NPM_PIN = /from 'npm:((?:@[^/@']+\/)?[^@']+)@([^']+)'/g;

/** Every `npm:` pin of every function entry point, by package name. */
function pinsByPackage(): Map<string, Array<{ fn: string; version: string }>> {
  const pins = new Map<string, Array<{ fn: string; version: string }>>();
  for (const entry of readdirSync(FUNCTIONS_DIR, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    let source: string;
    try {
      source = readFileSync(path.join(FUNCTIONS_DIR, entry.name, 'index.ts'), 'utf8');
    } catch {
      continue;
    }
    for (const [, name, version] of source.matchAll(NPM_PIN)) {
      pins.set(name, [...(pins.get(name) ?? []), { fn: entry.name, version }]);
    }
  }
  return pins;
}

/**
 * The version of a package this workspace installs, or `undefined` when it installs none.
 * @param name - The package name.
 */
function installedVersion(name: string): string | undefined {
  try {
    return createRequire(import.meta.url)(`${name}/package.json`).version;
  } catch {
    return undefined;
  }
}

describe('the npm pins of the Edge Functions', () => {
  it('pin supabase-js in every function', () => {
    const functions = readdirSync(FUNCTIONS_DIR, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .filter((name) => {
        try {
          readFileSync(path.join(FUNCTIONS_DIR, name, 'index.ts'));
          return true;
        } catch {
          return false;
        }
      });

    expect(functions.length).toBeGreaterThan(0);
    expect((pinsByPackage().get('@supabase/supabase-js') ?? []).map((pin) => pin.fn).sort()).toEqual(functions.sort());
  });

  it('pin one version of each package across the functions', () => {
    for (const [name, pins] of pinsByPackage()) {
      expect(new Set(pins.map((pin) => pin.version)), name).toHaveProperty('size', 1);
    }
  });

  it('pin the version this workspace installs, for each package it installs', () => {
    const checked = [...pinsByPackage()].filter(([name]) => installedVersion(name) !== undefined);

    expect(checked.map(([name]) => name)).toContain('@supabase/supabase-js');
    for (const [name, pins] of checked) {
      for (const pin of pins)
        expect(`${pin.fn}: ${name}@${pin.version}`).toBe(`${pin.fn}: ${name}@${installedVersion(name)}`);
    }
  });
});
