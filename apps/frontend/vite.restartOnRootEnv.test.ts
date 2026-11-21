// @vitest-environment node

import { EventEmitter } from 'node:events';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RESTART_DEBOUNCE_MS, restartOnRootEnv } from './vite.restartOnRootEnv';
import type { Plugin, ViteDevServer } from 'vite';

const repoRoot = join('/', 'repo');
const rootEnv = join(repoRoot, '.env');

/**
 * A stand-in for the two parts of `ViteDevServer` the plugin touches: a watcher that can be told to add a path and emits chokidar-style events, and `restart`.
 */
function fakeServer() {
  const watcher = Object.assign(new EventEmitter(), { add: vi.fn() });
  const restart = vi.fn(() => Promise.resolve());
  return { server: { watcher, restart } as unknown as ViteDevServer, watcher, restart };
}

/** Run the plugin's `configureServer` hook against `server`, whichever hook form the plugin uses. */
function configure(plugin: Plugin, server: ViteDevServer): void {
  const hook = plugin.configureServer;
  if (!hook) throw new Error('the plugin has no configureServer hook');
  const handler = typeof hook === 'function' ? hook : hook.handler;
  void handler.call({} as never, server);
}

describe('restartOnRootEnv', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('is a dev-server-only plugin with a namespaced name', () => {
    const plugin = restartOnRootEnv(repoRoot);
    expect(plugin.name).toBe('openvaa:restart-on-root-env');
    expect(plugin.apply).toBe('serve');
  });

  it('adds the repo-root .env to the watcher', () => {
    const { server, watcher } = fakeServer();
    configure(restartOnRootEnv(repoRoot), server);
    expect(watcher.add).toHaveBeenCalledWith(rootEnv);
  });

  it('restarts once when the repo-root .env changes', () => {
    const { server, watcher, restart } = fakeServer();
    configure(restartOnRootEnv(repoRoot), server);
    watcher.emit('change', rootEnv);
    vi.advanceTimersByTime(RESTART_DEBOUNCE_MS);
    expect(restart).toHaveBeenCalledTimes(1);
  });

  it('restarts when the repo-root .env is created', () => {
    const { server, watcher, restart } = fakeServer();
    configure(restartOnRootEnv(repoRoot), server);
    watcher.emit('add', rootEnv);
    vi.advanceTimersByTime(RESTART_DEBOUNCE_MS);
    expect(restart).toHaveBeenCalledTimes(1);
  });

  it('matches the repo-root .env through a non-normalised path', () => {
    const { server, watcher, restart } = fakeServer();
    configure(restartOnRootEnv(repoRoot), server);
    watcher.emit('change', `${repoRoot}/apps/../.env`);
    vi.advanceTimersByTime(RESTART_DEBOUNCE_MS);
    expect(restart).toHaveBeenCalledTimes(1);
  });

  it('restarts when the repo-root .env is deleted', () => {
    const { server, watcher, restart } = fakeServer();
    configure(restartOnRootEnv(repoRoot), server);
    watcher.emit('unlink', rootEnv);
    vi.advanceTimersByTime(RESTART_DEBOUNCE_MS);
    expect(restart).toHaveBeenCalledTimes(1);
  });

  it('restarts once for the burst of events a save by rename makes', () => {
    const { server, watcher, restart } = fakeServer();
    configure(restartOnRootEnv(repoRoot), server);
    watcher.emit('unlink', rootEnv);
    vi.advanceTimersByTime(20);
    watcher.emit('add', rootEnv);
    vi.advanceTimersByTime(20);
    watcher.emit('change', rootEnv);
    vi.advanceTimersByTime(RESTART_DEBOUNCE_MS);
    expect(restart).toHaveBeenCalledTimes(1);
  });

  it('ignores changes to any other file', () => {
    const { server, watcher, restart } = fakeServer();
    configure(restartOnRootEnv(repoRoot), server);
    watcher.emit('change', join(repoRoot, 'apps', 'frontend', '.env'));
    watcher.emit('change', join(repoRoot, '.env.example'));
    watcher.emit('add', join(repoRoot, '.env.local'));
    watcher.emit('change', join(repoRoot, 'apps', 'frontend', 'src', 'app.html'));
    watcher.emit('unlink', join(repoRoot, '.env.local'));
    vi.advanceTimersByTime(RESTART_DEBOUNCE_MS);
    expect(restart).not.toHaveBeenCalled();
  });
});
