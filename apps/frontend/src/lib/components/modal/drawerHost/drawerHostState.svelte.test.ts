/**
 * The host-registration contract that lets each app mount its own `DrawerHost` against the one module-level state.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { DrawerPayload } from './drawerHostState.svelte';

const warn = vi.hoisted(() => vi.fn());
vi.mock('@openvaa/app-shared', () => ({ log: { warn, error: vi.fn(), info: vi.fn(), debug: vi.fn() } }));
vi.mock('$app/environment', () => ({ browser: true }));

const { drawerHost } = await import('./drawerHostState.svelte');

function Stub(_internals: unknown, _props: { label: string }): Record<string, never> {
  return {};
}

function payload(key: string): DrawerPayload<{ label: string }> {
  return { key, title: () => key, component: Stub, props: () => ({ label: key }) };
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

  it('stores the component and re-reads the props getter rather than holding a snapshot', () => {
    unregister.push(drawerHost.register());
    let label = 'first';
    drawerHost.open({ key: 'd', title: () => label, component: Stub, props: () => ({ label }) });
    expect(drawerHost.current?.component).toBe(Stub);
    expect(drawerHost.current?.props()).toEqual({ label: 'first' });
    label = 'second';
    expect(drawerHost.current?.props()).toEqual({ label: 'second' });
  });

  it('rejects a props getter that does not return the component props at compile time', () => {
    unregister.push(drawerHost.register());
    // @ts-expect-error -- the props getter must return the props the component accepts.
    drawerHost.open({ key: 'e', title: () => 'e', component: Stub, props: () => ({ wrong: 1 }) });
    expect(drawerHost.current?.key).toBe('e');
  });
});
