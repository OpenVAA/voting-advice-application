import { flushSync } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { UNVERIFIED_ANSWERS } from '$lib/api/base/universalDataWriter';
import { candidateUserDataState } from './candidateUserDataState.svelte';
import type {
  CandidateUserData,
  LocalizedAnswers,
  LocalizedCandidateData,
  SetAnswersResult
} from '$lib/api/base/dataWriter.type';
import type { UniversalDataWriter } from '$lib/api/base/universalDataWriter';
import type { CandidateUserDataState } from './candidateUserDataState.type';

// The store reaches its writer through the getter it is constructed with — here a fake, so no browser guard is crossed — but `localStorageWritable` only persists when `browser` is `true`.
// The default app-environment stub sets `browser = false`, so override it here.
vi.mock('$app/environment', () => ({
  browser: true,
  dev: true,
  building: false,
  version: 'test'
}));

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
 * Both fakes MUST mimic the real adapter return SHAPES, because those shapes are what the store has to reconcile:
 * - `updateAnswers` returns the bare merged answers map (the `upsert_answers` RPC
 *   `RETURNS jsonb` of just the answers — NOT a candidate), or `UNVERIFIED_ANSWERS`, which the real adapter returns when the write succeeded but its read-back could not be validated (decision B3); the fake's declared return is widened to match, so a case cannot inject a shape the adapter cannot produce.
 * - `updateEntityProperties` returns ONLY the changed properties (`termsOfUseAccepted`,
 *   `image`) — NOT a full candidate. A fake that returned a full candidate (with `id`) would mask the real bug where the store dropped `id` by wholesale-replacing the candidate with this partial object.
 */
type FakeTarget = { target: { type: string; id?: string } };

function makeFakeWriter() {
  const updateAnswers = vi.fn(
    async ({ answers }: FakeTarget & { answers: LocalizedAnswers }): Promise<SetAnswersResult> => ({ ...answers })
  );
  const updateEntityProperties = vi.fn(
    async ({
      properties
    }: FakeTarget & {
      properties: { termsOfUseAccepted?: string | null; image?: unknown };
    }): Promise<LocalizedCandidateData> =>
      // Mirror the real `_updateEntityProperties`: returns ONLY the changed properties, with no `id` / static fields.
      ({
        termsOfUseAccepted: properties.termsOfUseAccepted ?? null,
        image: properties.image ?? null
      }) as unknown as LocalizedCandidateData
  );
  const getCandidateUserData = vi.fn();
  const writer = {
    updateAnswers,
    updateEntityProperties,
    getCandidateUserData
  } as unknown as UniversalDataWriter;
  return { writer, updateAnswers, updateEntityProperties };
}

describe('candidateUserDataState.save()', () => {
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
   * Create the store inside an `$effect.root` so its `$state`/`$derived`/`$effect` settle, returning the store handle plus the writer spies.
   */
  function setup(userData: CandidateUserData<true>) {
    const fake = makeFakeWriter();
    let store!: CandidateUserDataState;
    cleanup = $effect.root(() => {
      store = candidateUserDataState({
        answersLocked: () => false,
        dataWriter: () => fake.writer,
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
    // The bug: after the first save replaced the candidate with the bare answers map, savedData.candidate.id was undefined → the second call sent undefined.
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

  it('Test 3: properties-only save merges changed props into candidate (id + static fields preserved)', async () => {
    const { store, updateAnswers, updateEntityProperties } = setup(makeUserData());

    store.setTermsOfUseAccepted('2026-05-31T00:00:00Z');
    flushSync();
    await store.save();
    flushSync();

    expect(updateAnswers).not.toHaveBeenCalled();
    expect(updateEntityProperties).toHaveBeenCalledTimes(1);
    expect(updateEntityProperties.mock.calls[0][0].target.id).toBe('cand-1');
    // The property setter returns ONLY { termsOfUseAccepted, image }; the store must merge — not replace — so id + static fields survive.
    expect(store.savedCandidateData?.id).toBe('cand-1');
    expect(store.savedCandidateData?.firstName).toBe('A');
    expect(store.savedCandidateData?.termsOfUseAccepted).toBe('2026-05-31T00:00:00Z');
  });

  it('Test 4: regression — image/properties save then a later answers save still sends target.id (candidate-mega step 13→13.5)', async () => {
    const { store, updateAnswers, updateEntityProperties } = setup(makeUserData());

    // Step-13 analogue: an answers + image save in one go. The property branch's partial return ({ image }) must NOT wipe the candidate's id.
    store.setAnswer('q1', { value: 3 });
    store.setImage({ file: new File(['x'], 'p.png', { type: 'image/png' }) } as never);
    flushSync();
    await store.save();
    flushSync();

    expect(updateEntityProperties).toHaveBeenCalledTimes(1);
    expect(store.savedCandidateData?.id).toBe('cand-1');

    // Step-13.5 analogue: a later answers-only save must still target cand-1.
    store.setAnswer('q-link', { value: '' });
    flushSync();
    await store.save();
    flushSync();

    // The bug sent p_entity_id: undefined here → PostgREST 404 on upsert_answers.
    const lastAnswersCall = updateAnswers.mock.calls.at(-1)?.[0];
    expect(lastAnswersCall?.target.id).toBe('cand-1');
    expect(store.savedCandidateData?.id).toBe('cand-1');
  });

  it('Test 5: explicit termsOfUseAccepted: null is sent to updateEntityProperties (tri-state null persists)', async () => {
    const { store, updateAnswers, updateEntityProperties } = setup(makeUserData());

    // The tri-state contract: null is an EDITED value (not "unedited"). The old truthy guard (`termsOfUseAccepted ?`) silently dropped it; the `!== undefined` guard sends it.
    store.setTermsOfUseAccepted(null);
    flushSync();
    await store.save();
    flushSync();

    expect(updateAnswers).not.toHaveBeenCalled();
    expect(updateEntityProperties).toHaveBeenCalledTimes(1);
    expect(updateEntityProperties.mock.calls[0][0].properties.termsOfUseAccepted).toBeNull();
  });

  it('Test 6: unedited termsOfUseAccepted (undefined) is NOT sent (behavior-neutrality guard)', async () => {
    const { store, updateAnswers, updateEntityProperties } = setup(makeUserData());

    // No setter call → #editedTermsOfUseAccepted stays undefined (unedited) → no property save.
    flushSync();
    await store.save();
    flushSync();

    expect(updateAnswers).not.toHaveBeenCalled();
    expect(updateEntityProperties).not.toHaveBeenCalled();
  });

  /**
   * The unverified-save path (decision **B3**, ledger row 4).
   *
   * Before this phase a malformed post-upsert read-back reached the store as a truthy `{}`: it passed the nullish guard, was merged, and then `resetAnswers()` discarded the candidate's typing while `save()` reported `{ type: 'success' }`. The write itself had succeeded — only the read-back failed to parse — so what was lost was not the answer but the candidate's ability to try again.
   *
   * Each case asserts BOTH halves: the returned discriminant AND the preserved buffer. Asserting only the discriminant would pass with the exit placed after the resets, which is exactly the defect.
   */
  describe('unverified answers read-back (decision B3)', () => {
    it('Test 7: resolves a failure and preserves ALL THREE edit buffers when the writer reports an unverified write', async () => {
      const { store, updateAnswers, updateEntityProperties } = setup(makeUserData());
      updateAnswers.mockResolvedValue(UNVERIFIED_ANSWERS);

      store.setAnswer('q1', { value: 3 });
      store.setImage({ file: new File(['x'], 'p.png', { type: 'image/png' }) } as never);
      store.setTermsOfUseAccepted('2026-05-31T00:00:00Z');
      flushSync();
      const result = await store.save();
      flushSync();

      expect(result.type).toBe('failure');
      // The candidate's typing survives — this is the assertion the defect was about.
      expect(store.unsavedQuestionIds).toEqual(['q1']);
      // …and so do the other two edits: the exit sits ahead of all three resets, not just the answers one.
      expect(store.unsavedProperties).toEqual(expect.arrayContaining(['image', 'termsOfUseAccepted']));
      expect(store.hasUnsaved).toBe(true);
      // The exit is ahead of the property write too, so an unverified answers save does not half-commit.
      expect(updateEntityProperties).not.toHaveBeenCalled();
    });

    it('Test 8: resolves a failure and preserves the buffer when the writer returns a genuinely nullish value', async () => {
      const { store, updateAnswers } = setup(makeUserData());
      // The pre-existing nullish detector, kept in place by decision E1. Its consequent is now a failure return rather than a throw.
      updateAnswers.mockResolvedValue(undefined as unknown as SetAnswersResult);

      store.setAnswer('q1', { value: 3 });
      flushSync();
      const result = await store.save();
      flushSync();

      expect(result.type).toBe('failure');
      expect(store.unsavedQuestionIds).toEqual(['q1']);
    });

    it('Test 9: a clean read-back still resolves success and still runs all three resets', async () => {
      const { store } = setup(makeUserData());

      store.setAnswer('q1', { value: 3 });
      store.setTermsOfUseAccepted('2026-05-31T00:00:00Z');
      flushSync();
      const result = await store.save();
      flushSync();

      expect(result.type).toBe('success');
      // Behaviour neutrality on the success path: the buffers are cleared exactly as before.
      expect(store.unsavedQuestionIds).toEqual([]);
      expect(store.unsavedProperties).toEqual([]);
      expect(store.hasUnsaved).toBe(false);
      expect(store.savedCandidateData?.answers?.q1).toEqual({ value: 3 });
    });

    it('Test 10: a save that does not touch answers is unaffected by the unverified path', async () => {
      const { store, updateAnswers } = setup(makeUserData());
      // Even with the writer primed to report an unverified answers write, a properties-only save never calls it.
      updateAnswers.mockResolvedValue(UNVERIFIED_ANSWERS);

      store.setTermsOfUseAccepted('2026-05-31T00:00:00Z');
      flushSync();
      const result = await store.save();
      flushSync();

      expect(updateAnswers).not.toHaveBeenCalled();
      expect(result.type).toBe('success');
      expect(store.hasUnsaved).toBe(false);
    });
  });
});
