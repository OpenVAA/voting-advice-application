import { resolve } from 'node:path';
import type { Plugin } from 'vite';

/**
 * A dev-server plugin that restarts Vite when the repo-root `.env` is changed or created.
 *
 * The app reads its environment from the repo root (`loadEnv` in `vite.config.ts`, `kit.env.dir` in `svelte.config.js`), so only that one file is watched. Vite already reloads on its own env files inside the app directory. The plugin compares paths and never opens the file, so nothing it holds is read or logged here. `apply: 'serve'` keeps it out of production builds.
 * @param repoRoot - The directory holding the repo-root `.env`.
 * @returns The Vite plugin.
 */
export function restartOnRootEnv(repoRoot: string): Plugin {
  const envFile = resolve(repoRoot, '.env');
  return {
    name: 'openvaa:restart-on-root-env',
    apply: 'serve',
    configureServer(server) {
      server.watcher.add(envFile);
      function restartIfRootEnv(file: string): void {
        if (resolve(file) === envFile) void server.restart();
      }
      server.watcher.on('change', restartIfRootEnv);
      server.watcher.on('add', restartIfRootEnv);
    }
  };
}
