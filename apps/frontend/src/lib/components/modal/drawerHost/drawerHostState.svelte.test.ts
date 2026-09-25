/**
 * The host-registration contract that lets each app mount its own `DrawerHost` against the one module-level state.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Snippet } from 'svelte';
import type { DrawerPayload } from './drawerHostState.svelte';

const warn = vi.hoisted(() => vi.fn());
vi.mock('@openvaa/app-shared', () => ({ log: { warn, error: vi.fn(), info: vi.fn(), debug: vi.fn() } }));
vi.mock('$app/environment', () => ({ browser: true }));

const { drawerHost } = await import('./drawerHostState.svelte');

function payload(key: string): DrawerPayload {
  return { key, title: () => key, content: (() => undefined) as unknown as Snippet };
}

let unregister: Array<() => void> = [];

beforeEach(() => warn.mockClear());
afterEach(() => {
  for (const u of unregister) u();
  unregister = [];
  drawerHost.close();
});

describe('drawerHost', () => {
  it('reports an open made where no host is mounted, and still records the payload', () => {
    drawerHost.open(payload('orphan'));
    expect(warn).toHaveBeenCalledOnce();
    expect(drawerHost.current?.key).toBe('orphan');
  });

  it('opens silently once a host is registered, and unregistering the last host clears the payload', () => {
    unregister.push(drawerHost.register());
    drawerHost.open(payload('a'));
    expect(warn).not.toHaveBeenCalled();
    unregister.pop()!();
    expect(drawerHost.current).toBeNull();
  });

  it('reports a second concurrent host, and keeps the payload until the last host unregisters', () => {
    const first = drawerHost.register();
    const second = drawerHost.register();
    expect(warn).toHaveBeenCalledOnce();
    drawerHost.open(payload('b'));
    first();
    expect(drawerHost.current?.key).toBe('b');
    second();
    expect(drawerHost.current).toBeNull();
  });

  it('close(key) only closes the payload it names', () => {
    unregister.push(drawerHost.register());
    drawerHost.open(payload('c'));
    drawerHost.close('other');
    expect(drawerHost.current?.key).toBe('c');
    drawerHost.close('c');
    expect(drawerHost.current).toBeNull();
  });
});
