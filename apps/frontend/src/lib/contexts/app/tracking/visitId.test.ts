import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { isUuidV7 } from '$lib/analytics/uuidv7';
import { getVisitId, resetVisitIdForTests } from './visitId';

describe('getVisitId', () => {
  beforeEach(() => {
    resetVisitIdForTests();
    sessionStorage.clear();
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns a UUIDv7', () => {
    expect(isUuidV7(getVisitId())).toBe(true);
  });

  it('returns the same value on every call', () => {
    const first = getVisitId();
    expect(getVisitId()).toBe(first);
    expect(getVisitId()).toBe(first);
  });

  it('returns a new value after a reset', () => {
    const first = getVisitId();
    resetVisitIdForTests();
    const second = getVisitId();
    expect(isUuidV7(second)).toBe(true);
    expect(second).not.toBe(first);
  });

  it('writes nothing to a browser store or a cookie', () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    const cookieSetter = vi.fn();
    const descriptor = Object.getOwnPropertyDescriptor(Document.prototype, 'cookie');
    expect(descriptor?.set).toBeTypeOf('function');
    Object.defineProperty(document, 'cookie', {
      configurable: true,
      get: () => '',
      set: cookieSetter
    });
    try {
      getVisitId();
      getVisitId();
      resetVisitIdForTests();
      getVisitId();
    } finally {
      delete (document as unknown as Record<string, unknown>).cookie;
    }
    expect(setItem).not.toHaveBeenCalled();
    expect(cookieSetter).not.toHaveBeenCalled();
    expect(sessionStorage.length).toBe(0);
    expect(localStorage.length).toBe(0);
  });
});
