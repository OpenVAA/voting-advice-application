/**
 * `openEntityDrawer`: opens once per open transition, swaps entities in place, closes on undefined and on teardown, and renders from the last defined entity.
 */

import { flushSync } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { openEntityDrawer } from './openEntityDrawer.svelte';
import type { DrawerPayload } from '$lib/components/modal/drawerHost';
import type { EntityDetailsProps } from './EntityDetails.type';

const mocks = vi.hoisted(() => {
  let counter = 0;
  function EntityDetailsStub(_internals: unknown, _props: EntityDetailsProps): Record<string, never> {
    return {};
  }
  return {
    EntityDetailsStub,
    newKey: vi.fn((prefix: string) => `${prefix}-${++counter}`),
    open: vi.fn(),
    close: vi.fn()
  };
});

vi.mock('$lib/components/modal/drawerHost', () => ({
  drawerHost: { newKey: mocks.newKey, open: mocks.open, close: mocks.close }
}));
vi.mock('./EntityDetails.svelte', () => ({ default: mocks.EntityDetailsStub }));
vi.mock('$lib/utils/entities', () => ({ unwrapEntity: (e: unknown) => ({ entity: e }) }));

type EntityPayload = DrawerPayload<EntityDetailsProps>;

const A = { name: 'Entity A' } as unknown as MaybeWrappedEntityVariant;
const B = { name: 'Entity B' } as unknown as MaybeWrappedEntityVariant;
const C = { name: 'Entity C' } as unknown as MaybeWrappedEntityVariant;

let cleanup: (() => void) | undefined;

afterEach(() => {
  cleanup?.();
  cleanup = undefined;
  mocks.newKey.mockClear();
  mocks.open.mockClear();
  mocks.close.mockClear();
});

/**
 * Call `openEntityDrawer` inside an `$effect.root`, driven by a test-owned entity cell.
 */
function setup(): { set: (entity: MaybeWrappedEntityVariant | undefined) => void; onClose: () => void } {
  let current = $state.raw<MaybeWrappedEntityVariant | undefined>(undefined);
  const onClose = vi.fn();
  cleanup = $effect.root(() => {
    openEntityDrawer(() => current, onClose);
  });
  flushSync();
  return {
    set: (entity) => {
      current = entity;
      flushSync();
    },
    onClose
  };
}

function openedPayload(call: number): EntityPayload {
  return mocks.open.mock.calls[call][0] as EntityPayload;
}

describe('openEntityDrawer', () => {
  it('never opens while the getter returns undefined', () => {
    const { set } = setup();
    set(undefined);
    expect(mocks.open).not.toHaveBeenCalled();
  });

  it('opens once when an entity appears, with a fresh entity key and the entity payload', () => {
    const { set, onClose } = setup();
    set(A);
    expect(mocks.open).toHaveBeenCalledOnce();
    expect(mocks.newKey).toHaveBeenCalledWith('entity');
    const payload = openedPayload(0);
    expect(payload.key).toBe(mocks.newKey.mock.results[0].value);
    expect(payload.testId).toBe('voter-results-drawer');
    expect(payload.onDismiss).toBe(onClose);
    expect(payload.component).toBe(mocks.EntityDetailsStub);
    expect(payload.props()).toEqual({ entity: A, class: 'min-h-full' });
    expect(payload.props().entity).toBe(A);
    expect(payload.title()).toBe('Entity A');
  });

  it('swaps A to B in the open drawer without reopening it', () => {
    const { set } = setup();
    set(A);
    set(B);
    expect(mocks.open).toHaveBeenCalledOnce();
    expect(mocks.close).not.toHaveBeenCalled();
    const payload = openedPayload(0);
    expect(payload.props().entity).toBe(B);
    expect(payload.title()).toBe('Entity B');
  });

  it('closes by key when the getter returns undefined, and keeps rendering the last defined entity', () => {
    const { set } = setup();
    set(A);
    set(B);
    set(undefined);
    const payload = openedPayload(0);
    expect(mocks.close).toHaveBeenCalledOnce();
    expect(mocks.close).toHaveBeenCalledWith(payload.key);
    expect(payload.props().entity).toBe(B);
    expect(payload.title()).toBe('Entity B');
  });

  it('reopens with a new key when an entity appears again after closing', () => {
    const { set } = setup();
    set(A);
    set(undefined);
    set(C);
    expect(mocks.open).toHaveBeenCalledTimes(2);
    const first = openedPayload(0);
    const second = openedPayload(1);
    expect(second.key).not.toBe(first.key);
    expect(second.props().entity).toBe(C);
  });

  it('closes the open drawer when the calling scope is destroyed', () => {
    const { set } = setup();
    set(A);
    const payload = openedPayload(0);
    cleanup?.();
    cleanup = undefined;
    expect(mocks.close).toHaveBeenCalledOnce();
    expect(mocks.close).toHaveBeenCalledWith(payload.key);
  });
});
