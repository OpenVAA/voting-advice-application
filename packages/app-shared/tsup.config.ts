import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'tsup';
import { resolveStaticSettings } from './src/settings/resolveStaticSettings';
import { staticSettings } from './src/settings/staticSettings';
import type { Options } from 'tsup';

/**
 * An esbuild plugin as tsup accepts it.
 */
type EsbuildPlugin = NonNullable<Options['esbuildPlugins']>[number];

/**
 * Options of {@link instanceStaticSettings}.
 */
export type InstanceStaticSettingsOptions = {
  /**
   * The absolute path of the instance overlay, a JSON file holding a deep partial of `StaticSettings`. The plugin does nothing when no file exists there.
   */
  overlayPath: string;
  /**
   * The absolute path of the `staticSettings.ts` module whose contents the merged settings replace.
   */
  staticSettingsPath: string;
};

/**
 * An esbuild plugin that builds the static settings with an instance overlay merged over them.
 *
 * When the overlay file exists, it is parsed, merged over the shipped `staticSettings` and validated with `resolveStaticSettings`, and the `staticSettings.ts` module is loaded as the merged literal. An invalid overlay fails the build with a message naming the file and each offending path.
 *
 * @param options - See {@link InstanceStaticSettingsOptions}.
 * @returns The plugin.
 */
export function instanceStaticSettings({
  overlayPath,
  staticSettingsPath
}: InstanceStaticSettingsOptions): EsbuildPlugin {
  return {
    name: 'openvaa:instance-static-settings',
    setup(build) {
      // Without an overlay the plugin registers no hook at all, so the build and its output stay exactly those of the source.
      if (!existsSync(overlayPath)) return;
      let overlay: unknown;
      try {
        overlay = JSON.parse(readFileSync(overlayPath, 'utf8'));
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`instance/staticSettings.json is not valid JSON: ${message}`, { cause: error });
      }
      const merged = resolveStaticSettings({ base: staticSettings, overlay, source: 'instance/staticSettings.json' });
      const contents = [
        "import type { StaticSettings } from './staticSettings.type';",
        '',
        `export const staticSettings: StaticSettings = ${JSON.stringify(merged, null, 2)};`,
        ''
      ].join('\n');
      build.onLoad({ filter: /settings[\\/]staticSettings\.ts$/ }, (args) =>
        path.resolve(args.path) === path.resolve(staticSettingsPath)
          ? { contents, loader: 'ts', resolveDir: path.dirname(staticSettingsPath) }
          : undefined
      );
    }
  };
}

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  outDir: 'dist',
  clean: true,
  sourcemap: true,
  esbuildPlugins: [
    instanceStaticSettings({
      overlayPath: fileURLToPath(new URL('../../instance/staticSettings.json', import.meta.url)),
      staticSettingsPath: fileURLToPath(new URL('./src/settings/staticSettings.ts', import.meta.url))
    })
  ]
});
