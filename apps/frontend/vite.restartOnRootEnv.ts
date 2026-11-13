import { resolve } from 'node:path';
import type { Plugin } from 'vite';

/** How long the plugin waits after the last event on the file before it restarts, so the events of one save give one restart. */
export const RESTART_DEBOUNCE_MS = 200;

/**
 * A dev-server plugin that restarts Vite when the repo-root `.env` is changed, created or deleted.
 *
 * The app reads its environment from the repo root (`loadEnv` in `vite.config.ts`, `kit.env.dir` in `svelte.config.js`), so only that one file is watched. Vite already reloads on its own env files inside the app directory. The plugin compares paths and never opens the file, so nothing it holds is read or logged here. `apply: 'serve'` keeps it out of production builds.
 *
 * The restart is debounced: an editor that saves by rename emits a deletion and a creation, and the restart follows the last event of such a burst.
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
      let pending: ReturnType<typeof setTimeout> | undefined;
      function restartIfRootEnv(file: string): void {
        if (resolve(file) !== envFile) return;
        clearTimeout(pending);
        pending = setTimeout(() => void server.restart(), RESTART_DEBOUNCE_MS);
      }
      server.watcher.on('change', restartIfRootEnv);
      server.watcher.on('add', restartIfRootEnv);
      server.watcher.on('unlink', restartIfRootEnv);
    }
  };
}
