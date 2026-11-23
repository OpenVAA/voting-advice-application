// @vitest-environment node

/**
 * The `instanceStaticSettings` esbuild plugin of `tsup.config.ts`, driven through tsup's programmatic build of `src/index.ts`.
 *
 * Each case writes its overlay into its own throwaway directory and hands that path to the plugin factory, so nothing here reads or writes the checkout's own `instance/` directory.
 */

import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'tsup';
import { afterEach, describe, expect, it } from 'vitest';
import { instanceStaticSettings } from './tsup.config';
import type { Options } from 'tsup';

const ENTRY = fileURLToPath(new URL('./src/index.ts', import.meta.url));
const STATIC_SETTINGS = fileURLToPath(new URL('./src/settings/staticSettings.ts', import.meta.url));

describe('instanceStaticSettings', { timeout: 30_000 }, () => {
  const dirs: Array<string> = [];

  function makeDir(): string {
    const dir = mkdtempSync(join(tmpdir(), 'openvaa-instance-static-settings-'));
    dirs.push(dir);
    return dir;
  }

  /**
   * Write `contents` as an overlay file in a new directory and answer its path, or a path to a file that does not exist when `contents` is `null`.
   */
  function makeOverlay(contents: string | null): string {
    const overlayPath = join(makeDir(), 'staticSettings.json');
    if (contents !== null) writeFileSync(overlayPath, contents, 'utf8');
    return overlayPath;
  }

  /**
   * Build `src/index.ts` with the given plugins and answer the emitted `index.js`.
   */
  async function buildIndex(esbuildPlugins: NonNullable<Options['esbuildPlugins']>): Promise<string> {
    const outDir = makeDir();
    await build({
      config: false,
      silent: true,
      entry: [ENTRY],
      format: ['esm'],
      sourcemap: false,
      dts: false,
      outDir,
      clean: true,
      esbuildPlugins
    });
    return readFileSync(join(outDir, 'index.js'), 'utf8');
  }

  /**
   * The plugin pointed at the overlay at `overlayPath`.
   */
  function pluginFor(overlayPath: string): NonNullable<Options['esbuildPlugins']> {
    return [instanceStaticSettings({ overlayPath, staticSettingsPath: STATIC_SETTINGS })];
  }

  afterEach(() => {
    while (dirs.length) rmSync(dirs.pop() as string, { recursive: true, force: true });
  });

  it('leaves the output byte-identical when the overlay file is missing', async () => {
    const without = await buildIndex([]);
    const withMissing = await buildIndex(pluginFor(makeOverlay(null)));
    expect(withMissing).toBe(without);
  });

  it('inlines the merged settings when the overlay is valid', async () => {
    const output = await buildIndex(pluginFor(makeOverlay('{ "admin": { "email": "overlay@example.org" } }')));
    expect(output).toContain('overlay@example.org');
    expect(output).not.toContain('first.last@openvaa.org');
  });

  it('fails the build on an unknown key', async () => {
    await expect(buildIndex(pluginFor(makeOverlay('{ "colours": {} }')))).rejects.toThrow(/Unrecognized key/);
  });

  it('fails the build on invalid JSON, naming the file', async () => {
    await expect(buildIndex(pluginFor(makeOverlay('{ "admin": ')))).rejects.toThrow(
      /instance\/staticSettings\.json is not valid JSON/
    );
  });
});
