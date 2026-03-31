import { describe, expect, it } from 'vitest';
import { StackedState, simpleStackedState } from './StackedState.svelte';

describe('StackedState', () => {
  it('constructor sets initial value as current (getLength() returns 1)', () => {
    const stack = new StackedState<string>('initial', (current, value) => [...current, value]);
    expect(stack.getLength()).toBe(1);
    expect(stack.current).toBe('initial');
  });

  it('push adds item to stack (getLength() increases, current changes)', () => {
    const stack = new StackedState<string>('first', (current, value) => [...current, value]);
    stack.push('second');
    expect(stack.getLength()).toBe(2);
    expect(stack.current).toBe('second');
    stack.push('third');
    expect(stack.getLength()).toBe(3);
    expect(stack.current).toBe('third');
  });

  it('revert to index 0 restores initial value', () => {
    const stack = new StackedState<string>('first', (current, value) => [...current, value]);
    stack.push('second');
    stack.push('third');
    expect(stack.getLength()).toBe(3);
    const result = stack.revert(0);
    expect(result).toBe('first');
    expect(stack.getLength()).toBe(1);
    expect(stack.current).toBe('first');
  });

  it('revert with index >= stack length - 1 does not modify stack', () => {
    const stack = new StackedState<string>('first', (current, value) => [...current, value]);
    stack.push('second');
    expect(stack.getLength()).toBe(2);
    // Revert to last index (no-op)
    const result1 = stack.revert(1);
    expect(result1).toBe('second');
    expect(stack.getLength()).toBe(2);
    // Revert to index beyond stack
    const result2 = stack.revert(5);
    expect(result2).toBe('second');
    expect(stack.getLength()).toBe(2);
  });

  it('revert with negative index throws Error', () => {
    const stack = new StackedState<string>('first', (current, value) => [...current, value]);
    expect(() => stack.revert(-1)).toThrow('StackedState.revert: index cannot be negative');
  });

  it('subscribe provides Readable-compatible interface', () => {
    const stack = new StackedState<string>('initial', (current, value) => [...current, value]);
    // The subscribe getter should return a function
    expect(typeof stack.subscribe).toBe('function');
    // Subscribing should immediately call with current value
    let received: string | undefined;
    const unsub = stack.subscribe((v) => {
      received = v;
    });
    expect(received).toBe('initial');
    unsub();
  });

  it('simpleStackedState creates a StackedState that appends items directly', () => {
    const stack = simpleStackedState<number>(10);
    expect(stack.getLength()).toBe(1);
    expect(stack.current).toBe(10);
    stack.push(20);
    expect(stack.getLength()).toBe(2);
    expect(stack.current).toBe(20);
    stack.push(30);
    expect(stack.getLength()).toBe(3);
    expect(stack.current).toBe(30);
    stack.revert(0);
    expect(stack.current).toBe(10);
  });

  it('push with mergeSettings-style updater (matching layoutContext pattern)', () => {
    // Simulates the pattern used in layoutContext.ts: mergeSettings on the last element
    type Settings = { a: number; b: string };
    const mergeUpdater = (current: Settings[], value: Partial<Settings>) => [
      ...current,
      { ...current[current.length - 1], ...value }
    ];
    const stack = new StackedState<Settings, Partial<Settings>>({ a: 1, b: 'hello' }, mergeUpdater);
    expect(stack.current).toEqual({ a: 1, b: 'hello' });

    stack.push({ a: 2 });
    expect(stack.current).toEqual({ a: 2, b: 'hello' });

    stack.push({ b: 'world' });
    expect(stack.current).toEqual({ a: 2, b: 'world' });

    // Revert to index 1 should restore the { a: 2, b: 'hello' } state
    stack.revert(1);
    expect(stack.current).toEqual({ a: 2, b: 'hello' });
    expect(stack.getLength()).toBe(2);
  });
});
