import { flushSync } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { answerState } from './answerState.svelte';
import type { TrackingService } from '../app/tracking';
import type { AnswerState } from './answerState.type';

// `localStorageState` only persists when `browser` is `true`. The default
// app-environment stub sets `browser = false`, so override it here.
vi.mock('$app/environment', () => ({
  browser: true,
  dev: true,
  building: false,
  version: 'test'
}));

vi.mock('$lib/utils/logger', () => ({
  logDebugError: vi.fn(),
  logDebugWarning: vi.fn(),
  logError: vi.fn()
}));

describe('answerState', () => {
  let cleanup: (() => void) | undefined;
  let startEvent: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    localStorage.clear();
    startEvent = vi.fn();
  });

  afterEach(() => {
    cleanup?.();
    cleanup = undefined;
    localStorage.clear();
    vi.restoreAllMocks();
  });

  /**
   * Create the store inside an `$effect.root` so its `$state` settles, returning
   * the store handle.
   */
  function setup(): AnswerState {
    let store!: AnswerState;
    cleanup = $effect.root(() => {
      store = answerState({ startEvent: startEvent as unknown as TrackingService['startEvent'] });
    });
    flushSync();
    return store;
  }

  it('setting an answer makes it readable via .answers and persists it', () => {
    const store = setup();
    store.setAnswer('q1', 3);
    flushSync();
    expect(store.answers.q1).toEqual({ value: 3 });
    // Persisted in versioned localStorage format under the canonical key.
    const saved = localStorage.getItem('VoterContext-answerStore');
    expect(saved).toBeTruthy();
    const parsed = JSON.parse(saved as string);
    expect(parsed.data.q1).toEqual({ value: 3 });
  });

  it('deleting an answer removes it from .answers and emits startEvent("answer_delete")', () => {
    const store = setup();
    store.setAnswer('q1', 3);
    flushSync();
    store.deleteAnswer('q1');
    flushSync();
    expect(store.answers.q1).toBeUndefined();
    expect(startEvent).toHaveBeenCalledWith('answer_delete', { questionId: 'q1' });
  });

  it('reset clears .answers and emits startEvent("answer_resetAll")', () => {
    const store = setup();
    store.setAnswer('q1', 3);
    store.setAnswer('q2', 5);
    flushSync();
    store.reset();
    flushSync();
    expect(Object.keys(store.answers)).toHaveLength(0);
    expect(startEvent).toHaveBeenCalledWith('answer_resetAll');
  });

  it('returned .answers is deep-frozen', () => {
    const store = setup();
    store.setAnswer('q1', { foo: 'bar' } as never);
    flushSync();
    // Frozen — the returned answers map and its nested values are deep-frozen,
    // preventing accidental external mutation of stored answers.
    expect(Object.isFrozen(store.answers)).toBe(true);
    expect(Object.isFrozen(store.answers.q1)).toBe(true);
    expect(Object.isFrozen(store.answers.q1?.value)).toBe(true);
  });

  it('startEvent receives the expected event names on set / delete / reset', () => {
    const store = setup();
    store.setAnswer('q1', 7);
    flushSync();
    expect(startEvent).toHaveBeenCalledWith('answer', { questionId: 'q1', value: 7 });

    store.deleteAnswer('q1');
    flushSync();
    expect(startEvent).toHaveBeenCalledWith('answer_delete', { questionId: 'q1' });

    store.reset();
    flushSync();
    expect(startEvent).toHaveBeenCalledWith('answer_resetAll');
  });
});
