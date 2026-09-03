import { describe, expect, test } from 'vitest';
import { inheritContextMembers } from './inheritContextMembers';

/**
 * Regression guard. inheritContextMembers must forward accessor members as LIVE accessors (not snapshot their current value the way Object.assign does), while copying data members by value. A regression here silently freezes the reactivity of inherited bare reactive accessors (appSettings / dataRoot / locale) on the voter / candidate / admin orchestrator contexts.
 */
describe('inheritContextMembers', () => {
  test('forwards a getter accessor as a LIVE accessor (reads current value, not a snapshot)', () => {
    let backing = 1;
    const source = {};
    Object.defineProperty(source, 'value', {
      get() {
        return backing;
      },
      enumerable: true,
      configurable: true
    });

    const target = {} as { value: number };
    inheritContextMembers(target, source);

    expect(target.value).toBe(1);
    backing = 999;
    // Object.assign would have frozen this at 1 — the live forward re-reads.
    expect(target.value).toBe(999);
  });

  test('forwards a setter accessor back to the source', () => {
    let backing = 0;
    const source = {};
    Object.defineProperty(source, 'value', {
      get() {
        return backing;
      },
      set(v: number) {
        backing = v;
      },
      enumerable: true,
      configurable: true
    });

    const target = {} as { value: number };
    inheritContextMembers(target, source);

    target.value = 42;
    expect(backing).toBe(42);
    expect(target.value).toBe(42);
  });

  test('copies data members (functions and plain values) by value', () => {
    function fn(): string {
      return 'hi';
    }
    const source = { fn, count: 7, handle: { current: 'x' } };

    const target = {} as typeof source;
    inheritContextMembers(target, source);

    expect(target.fn).toBe(fn);
    expect(target.count).toBe(7);
    // stable handle objects keep reference equality (matches the former spread copy)
    expect(target.handle).toBe(source.handle);
  });

  test('forwarded accessor members are own-enumerable on the target', () => {
    const source = {};
    Object.defineProperty(source, 'value', { get: () => 1, enumerable: true, configurable: true });

    const target = {};
    inheritContextMembers(target, source);

    expect(Object.keys(target)).toContain('value');
  });
});
