import { ENTITY_TYPE } from '@openvaa/data';
import { flushSync } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { candidateUserDataStore } from './candidateUserDataStore.svelte';
import type { CandidateUserData, LocalizedAnswers, LocalizedCandidateData } from '$lib/api/base/dataWriter.type';
import type { UniversalDataWriter } from '$lib/api/base/universalDataWriter';
import type { CandidateUserDataStore } from './candidateUserDataStore.type';

// The store calls `prepareDataWriter`, which throws unless `browser` is `true`,
// and `localStorageWritable`, which only persists when `browser` is `true`.
// The default app-environment stub sets `browser = false`, so override it here.
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

const EDITED_ANSWERS_KEY = 'CandidateContext-candidateUserDataStore-editedAnswers';

/**
 * Build a minimal `CandidateUserData<true>` for the store's `init`.
 */
function makeUserData(overrides?: Partial<LocalizedCandidateData>): CandidateUserData<true> {
  return {
    user: { id: 'user-1', email: 'a@test', username: 'a', settings: {} } as CandidateUserData<true>['user'],
    candidate: {
      id: 'cand-1',
      firstName: 'A',
      lastName: 'B',
      answers: {},
      ...overrides
    } as LocalizedCandidateData,
    nominations: [] as unknown as CandidateUserData<true>['nominations']
  };
}

/**
 * A minimal fake `UniversalDataWriter` exposing only the methods the store calls.
 * `updateAnswers` mimics the RPC by returning the bare merged answers map.
 * `updateEntityProperties` returns a full candidate (the property-setter contract).
 */
function makeFakeWriter() {
  const updateAnswers = vi.fn(
    async ({ answers }: { answers: LocalizedAnswers }): Promise<LocalizedAnswers> => ({ ...answers })
  );
  const updateEntityProperties = vi.fn(
    async ({ properties }: { properties: { termsOfUseAccepted?: string | null } }): Promise<LocalizedCandidateData> =>
      ({
        id: 'cand-1',
        firstName: 'A',
        lastName: 'B',
        answers: {},
        termsOfUseAccepted: properties.termsOfUseAccepted
      }) as LocalizedCandidateData
  );
  const getCandidateUserData = vi.fn();
  const init = vi.fn();
  const writer = {
    init,
    updateAnswers,
    updateEntityProperties,
    getCandidateUserData
  } as unknown as UniversalDataWriter;
  return { writer, updateAnswers, updateEntityProperties };
}

describe('candidateUserDataStore.save()', () => {
  let cleanup: (() => void) | undefined;

  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    cleanup?.();
    cleanup = undefined;
    localStorage.clear();
    vi.restoreAllMocks();
  });

  /**
   * Create the store inside an `$effect.root` so its `$state`/`$derived`/`$effect`
   * settle, returning the store handle plus the writer spies.
   */
  function setup(userData: CandidateUserData<true>) {
    const fake = makeFakeWriter();
    let store!: CandidateUserDataStore;
    cleanup = $effect.root(() => {
      store = candidateUserDataStore({
        answersLocked: () => false,
        dataWriterPromise: Promise.resolve(fake.writer),
        locale: () => 'en'
      });
    });
    store.init(userData);
    flushSync();
    return { store, ...fake };
  }

  it('Test 1: two consecutive answers-only saves both call updateAnswers with target.id === cand-1 (no dropped id)', async () => {
    const { store, updateAnswers } = setup(makeUserData());

    store.setAnswer('q1', { value: 3 });
    flushSync();
    await store.save();
    flushSync();

    store.setAnswer('q2', { value: 5 });
    flushSync();
    await store.save();
    flushSync();

    expect(updateAnswers).toHaveBeenCalledTimes(2);
    expect(updateAnswers.mock.calls[0][0].target.id).toBe('cand-1');
    // The bug: after the first save replaced the candidate with the bare answers
    // map, savedData.candidate.id was undefined → the second call sent undefined.
    expect(updateAnswers.mock.calls[1][0].target.id).toBe('cand-1');
  });

  it('Test 2: answers-only save preserves id + static fields and merges answer into candidate.answers', async () => {
    const { store } = setup(makeUserData());

    store.setAnswer('q1', { value: 3 });
    flushSync();
    await store.save();
    flushSync();

    expect(store.savedCandidateData?.id).toBe('cand-1');
    expect(store.savedCandidateData?.firstName).toBe('A');
    expect(store.savedCandidateData?.answers?.q1).toEqual({ value: 3 });
  });

  it('Test 3: properties-only save still replaces the candidate (id preserved)', async () => {
    const { store, updateAnswers, updateEntityProperties } = setup(makeUserData());

    store.setTermsOfUseAccepted('2026-05-31T00:00:00Z');
    flushSync();
    await store.save();
    flushSync();

    expect(updateAnswers).not.toHaveBeenCalled();
    expect(updateEntityProperties).toHaveBeenCalledTimes(1);
    expect(updateEntityProperties.mock.calls[0][0].target.id).toBe('cand-1');
    expect(store.savedCandidateData?.id).toBe('cand-1');
    expect(store.savedCandidateData?.termsOfUseAccepted).toBe('2026-05-31T00:00:00Z');
  });
});
