import { getLocalized } from '@openvaa/app-shared';
import { flushSync } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { UNVERIFIED_ANSWERS } from '$lib/api/base/universalDataWriter';
import { contestantUserDataState, EDITED_ANSWERS_KEY_STEM, editedAnswersKey } from './contestantUserDataState.svelte';
import { localStorageState } from '../utils/persistedState.svelte';
import type {
  ContestantUserData,
  EditableEntityProps,
  LocalizedAnswers,
  LocalizedCandidateData,
  LocalizedEntityNames,
  LocalizedOrganizationData,
  SavedEntityProps,
  SetAnswersResult,
  UpdateEntityPropertiesResult
} from '$lib/api/base/dataWriter.type';
import type { UniversalDataWriter } from '$lib/api/base/universalDataWriter';
import type { ContestantUserDataState } from './contestantUserDataState.type';

// The store reaches its writer through the getter it is constructed with — here a fake, so no browser guard is crossed — but `localStorageWritable` only persists when `browser` is `true`.
// The default app-environment stub sets `browser = false`, so override it here.
vi.mock('$app/environment', () => ({
  browser: true,
  dev: true,
  building: false,
  version: 'test'
}));

/**
 * Build a minimal `ContestantUserData<true>` for the store's `init`.
 */
function makeUserData(overrides?: Partial<LocalizedCandidateData>): ContestantUserData<true> {
  return {
    entity: {
      type: 'candidate',
      id: 'cand-1',
      firstName: 'A',
      lastName: 'B',
      answers: {},
      ...overrides
    } as LocalizedCandidateData,
    nominations: []
  };
}

/** The names the organization of {@link makeOrganizationUserData} is stored with, by locale. */
const ORGANIZATION_NAMES: LocalizedEntityNames = { name: { en: 'Org', fi: 'Järjestö' }, shortName: null };

/**
 * Build a minimal `ContestantUserData<true>` whose entity is an organization.
 */
function makeOrganizationUserData(
  overrides?: Partial<LocalizedOrganizationData>,
  localizedNames: LocalizedEntityNames = ORGANIZATION_NAMES
): ContestantUserData<true> {
  return {
    ...makeUserData(),
    entity: { type: 'organization', id: 'org-1', name: 'Org', answers: {}, ...overrides },
    localizedNames
  };
}

/**
 * The unsaved answers stored in the browser under `key`, or `undefined` when the key holds nothing.
 */
function storedDraft(key: string): LocalizedAnswers | undefined {
  const item = localStorage.getItem(key);
  return item === null ? undefined : (JSON.parse(item).data as LocalizedAnswers);
}

/**
 * Every key the browser's storage holds, sorted.
 */
function storedKeys(): Array<string> {
  const keys = new Array<string>();
  for (let index = 0; index < localStorage.length; index += 1) keys.push(localStorage.key(index) as string);
  return keys.sort();
}

/**
 * A promise settled from outside, for a backend call that is still in flight while the test goes on.
 */
function deferred<TValue>() {
  let resolve!: (value: TValue) => void;
  const promise = new Promise<TValue>((res) => (resolve = res));
  return { promise, resolve };
}

/**
 * Build an edited image carrying a file, the shape the profile form hands to `setImage`.
 */
function makeImage(): ImageWithFile {
  return { file: new File(['x'], 'p.png', { type: 'image/png' }) } as ImageWithFile;
}

/**
 * A minimal fake `UniversalDataWriter` exposing only the methods the store calls.
 * Both fakes MUST mimic the real adapter return SHAPES, because those shapes are what the store has to reconcile:
 * - `updateAnswers` returns the bare merged answers map (the `upsert_answers` RPC
 *   `RETURNS jsonb` of just the answers — NOT a candidate), or `UNVERIFIED_ANSWERS`, which the real adapter returns when the write succeeded but its read-back could not be validated; the fake's declared return is widened to match, so a case cannot inject a shape the adapter cannot produce.
 * - `updateEntityProperties` returns the saved result holding ONLY the properties it was given — NOT a full entity. A fake that returned a full entity (with `id`) would hide a store that drops `id` by replacing the entity wholesale with this partial object.
 */
type FakeTarget = { target: { type: string; id?: string } };

/**
 * What the real property writer resolves to for a write the backend stores: each given property in the form an entity read gives it, and each given name as stored by locale. A name is translated as the real writer translates it: to the locale asked for, else the default one, else the first one stored.
 */
function savedResultOf(properties: EditableEntityProps, locale = 'en'): UpdateEntityPropertiesResult {
  const saved: SavedEntityProps = {};
  const localizedNames: Partial<LocalizedEntityNames> = {};
  if (properties.image !== undefined) saved.image = properties.image;
  if (properties.name !== undefined) {
    localizedNames.name = properties.name;
    saved.name = getLocalized(properties.name, locale) ?? '';
  }
  if (properties.shortName !== undefined) {
    localizedNames.shortName = properties.shortName;
    saved.shortName = getLocalized(properties.shortName, locale);
  }
  if (properties.color !== undefined) saved.color = properties.color;
  if (properties.firstName !== undefined) saved.firstName = properties.firstName;
  if (properties.lastName !== undefined) saved.lastName = properties.lastName;
  return { type: 'saved', properties: saved, localizedNames };
}

function makeFakeWriter() {
  const updateAnswers = vi.fn(
    async ({ answers }: FakeTarget & { answers: LocalizedAnswers }): Promise<SetAnswersResult> => ({ ...answers })
  );
  const updateEntityProperties = vi.fn(
    async ({
      properties,
      locale
    }: FakeTarget & {
      properties: EditableEntityProps;
      locale?: string;
    }): Promise<UpdateEntityPropertiesResult> =>
      // Mirror the real `_updateEntityProperties`: returns ONLY what was written, with no `id` / static fields.
      savedResultOf(properties, locale)
  );
  const getEntityUserData = vi.fn();
  const writer = {
    updateAnswers,
    updateEntityProperties,
    getEntityUserData
  } as unknown as UniversalDataWriter;
  return { writer, updateAnswers, updateEntityProperties, getEntityUserData };
}

/** The signed-in users of these tests. */
const USER_A = '0a0a0a0a-0000-4000-8000-00000000000a';
const USER_B = '0b0b0b0b-0000-4000-8000-00000000000b';

describe('contestantUserDataState.save()', () => {
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
  function setup(userData: ContestantUserData<true>) {
    const fake = makeFakeWriter();
    let store!: ContestantUserDataState;
    cleanup = $effect.root(() => {
      store = contestantUserDataState({
        answersLocked: () => false,
        dataWriter: () => fake.writer,
        locale: () => 'en'
      });
    });
    store.init(userData, USER_A);
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
    // The bug: after the first save replaced the candidate with the bare answers map, savedData.entity.id was undefined → the second call sent undefined.
    expect(updateAnswers.mock.calls[1][0].target.id).toBe('cand-1');
  });

  it('Test 2: answers-only save preserves id + static fields and merges answer into candidate.answers', async () => {
    const { store, updateEntityProperties } = setup(makeUserData());

    store.setAnswer('q1', { value: 3 });
    flushSync();
    await store.save();
    flushSync();

    // With no image edited there is no property to write.
    expect(updateEntityProperties).not.toHaveBeenCalled();
    expect(store.savedEntityData?.id).toBe('cand-1');
    expect(store.savedEntityData).toMatchObject({ firstName: 'A' });
    expect(store.savedEntityData?.answers?.q1).toEqual({ value: 3 });
  });

  it('Test 3: properties-only save merges changed props into candidate (id + static fields preserved)', async () => {
    const { store, updateAnswers, updateEntityProperties } = setup(makeUserData());
    const image = makeImage();

    store.setImage(image);
    flushSync();
    await store.save();
    flushSync();

    expect(updateAnswers).not.toHaveBeenCalled();
    expect(updateEntityProperties).toHaveBeenCalledTimes(1);
    expect(updateEntityProperties.mock.calls[0][0].target.id).toBe('cand-1');
    // The image is the only property the store sends.
    expect(Object.keys(updateEntityProperties.mock.calls[0][0].properties)).toEqual(['image']);
    expect(updateEntityProperties.mock.calls[0][0].properties.image).toEqual(image);
    // The property setter returns ONLY { image }; the store must merge — not replace — so id + static fields survive.
    expect(store.savedEntityData?.id).toBe('cand-1');
    expect(store.savedEntityData).toMatchObject({ firstName: 'A' });
    expect(store.savedEntityData?.image).toEqual(image);
  });

  it('Test 4: regression — image/properties save then a later answers save still sends target.id (candidate-mega step 13→13.5)', async () => {
    const { store, updateAnswers, updateEntityProperties } = setup(makeUserData());

    // Step-13 analogue: an answers + image save in one go. The property branch's partial return ({ image }) must NOT wipe the candidate's id.
    store.setAnswer('q1', { value: 3 });
    store.setImage(makeImage());
    flushSync();
    await store.save();
    flushSync();

    expect(updateEntityProperties).toHaveBeenCalledTimes(1);
    expect(store.savedEntityData?.id).toBe('cand-1');

    // Step-13.5 analogue: a later answers-only save must still target cand-1.
    store.setAnswer('q-link', { value: '' });
    flushSync();
    await store.save();
    flushSync();

    // The bug sent p_entity_id: undefined here → PostgREST 404 on upsert_answers.
    const lastAnswersCall = updateAnswers.mock.calls.at(-1)?.[0];
    expect(lastAnswersCall?.target.id).toBe('cand-1');
    expect(store.savedEntityData?.id).toBe('cand-1');
  });

  /**
   * The unverified-save path (decision **B3**, ledger row 4).
   *
   * Before this phase a malformed post-upsert read-back reached the store as a truthy `{}`: it passed the nullish guard, was merged, and then `resetAnswers()` discarded the candidate's typing while `save()` reported `{ type: 'success' }`. The write itself had succeeded — only the read-back failed to parse — so what was lost was not the answer but the candidate's ability to try again.
   *
   * Each case asserts BOTH halves: the returned discriminant AND the preserved buffer. Asserting only the discriminant would pass with the exit placed after the resets, which is exactly the defect.
   */
  describe('unverified answers read-back (decision B3)', () => {
    it('Test 5: resolves a failure and preserves BOTH edit buffers when the writer reports an unverified write', async () => {
      const { store, updateAnswers, updateEntityProperties } = setup(makeUserData());
      updateAnswers.mockResolvedValue(UNVERIFIED_ANSWERS);

      store.setAnswer('q1', { value: 3 });
      store.setImage(makeImage());
      flushSync();
      const result = await store.save();
      flushSync();

      expect(result.type).toBe('failure');
      // The candidate's typing survives.
      expect(store.unsavedQuestionIds).toEqual(['q1']);
      // …and so does the image edit: the exit sits ahead of both resets, not just the answers one.
      expect(store.unsavedProperties).toEqual(['image']);
      expect(store.hasUnsaved).toBe(true);
      // The exit is ahead of the property write too, so an unverified answers save does not half-commit.
      expect(updateEntityProperties).not.toHaveBeenCalled();
    });

    it('Test 6: resolves a failure and preserves the buffer when the writer returns a genuinely nullish value', async () => {
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

    it('Test 7: a clean read-back resolves success and runs both resets', async () => {
      const { store } = setup(makeUserData());

      store.setAnswer('q1', { value: 3 });
      store.setImage(makeImage());
      flushSync();
      const result = await store.save();
      flushSync();

      expect(result.type).toBe('success');
      // On the success path both buffers are cleared.
      expect(store.unsavedQuestionIds).toEqual([]);
      expect(store.unsavedProperties).toEqual([]);
      expect(store.hasUnsaved).toBe(false);
      expect(store.savedEntityData?.answers?.q1).toEqual({ value: 3 });
    });

    it('Test 8: a save that does not touch answers is unaffected by the unverified path', async () => {
      const { store, updateAnswers } = setup(makeUserData());
      // Even with the writer primed to report an unverified answers write, a properties-only save never calls it.
      updateAnswers.mockResolvedValue(UNVERIFIED_ANSWERS);

      store.setImage(makeImage());
      flushSync();
      const result = await store.save();
      flushSync();

      expect(updateAnswers).not.toHaveBeenCalled();
      expect(result.type).toBe('success');
      expect(store.hasUnsaved).toBe(false);
    });
  });
});

describe('contestantUserDataState, an entity of either served type', () => {
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
   * Create the store inside an `$effect.root` and load `userData` into it.
   */
  function setup(userData: ContestantUserData<true>) {
    const fake = makeFakeWriter();
    let store!: ContestantUserDataState;
    cleanup = $effect.root(() => {
      store = contestantUserDataState({
        answersLocked: () => false,
        dataWriter: () => fake.writer,
        locale: () => 'fi'
      });
    });
    store.init(userData, USER_A);
    flushSync();
    return { store, ...fake };
  }

  it('save() for an organization targets the organization, for its answers and for its image', async () => {
    const { store, updateAnswers, updateEntityProperties } = setup(makeOrganizationUserData());

    store.setAnswer('q1', { value: 'text' });
    store.setImage(makeImage());
    flushSync();
    const result = await store.save();
    flushSync();

    expect(result).toEqual({ type: 'success', listedPropertySaved: true });
    expect(updateAnswers.mock.calls[0][0].target).toEqual({ type: 'organization', id: 'org-1' });
    expect(updateEntityProperties.mock.calls[0][0].target).toEqual({ type: 'organization', id: 'org-1' });
    expect(store.savedEntityData).toMatchObject({ type: 'organization', id: 'org-1', name: 'Org' });
    expect(store.savedEntityData?.answers?.q1).toEqual({ value: 'text' });
  });

  it('save() for a candidate targets the candidate', async () => {
    const { store, updateAnswers } = setup(makeUserData());

    store.setAnswer('q1', { value: 3 });
    flushSync();
    await store.save();

    expect(updateAnswers.mock.calls[0][0].target).toEqual({ type: 'candidate', id: 'cand-1' });
  });

  it("a reload asks for the loaded entity's own type and id and stores the answer", async () => {
    const { store, getEntityUserData } = setup(makeOrganizationUserData());
    const reloaded = { type: 'organization', id: 'org-1', name: 'Org renamed', answers: { q1: { value: 'stored' } } };
    getEntityUserData.mockResolvedValue({ ...makeOrganizationUserData(), entity: reloaded });

    const result = await store.reloadEntityData();
    flushSync();

    expect(getEntityUserData).toHaveBeenCalledWith({
      type: 'organization',
      id: 'org-1',
      loadNominations: false,
      locale: 'fi'
    });
    expect(result).toEqual(reloaded);
    expect(store.savedEntityData).toEqual(reloaded);
  });

  it('a reload started inside an effect does not rerun that effect when it stores its result', async () => {
    const { store, getEntityUserData } = setup(makeUserData());
    getEntityUserData.mockImplementation(async () => makeUserData({ firstName: 'Reloaded' }));

    let runs = 0;
    const stop = $effect.root(() => {
      $effect(() => {
        runs += 1;
        void store.reloadEntityData();
      });
    });
    flushSync();
    // Let the reload settle and store its result, then let any effect it invalidated run. A rerun would start a second reload.
    for (let turn = 0; turn < 5; turn += 1) {
      await Promise.resolve();
      flushSync();
    }
    stop();

    expect(store.savedEntityData).toMatchObject({ firstName: 'Reloaded' });
    expect(runs).toBe(1);
    expect(getEntityUserData).toHaveBeenCalledTimes(1);
  });

  it('a reload rejects when the backend holds no such entity for the user', async () => {
    const { store, getEntityUserData } = setup(makeUserData());
    getEntityUserData.mockResolvedValue(undefined);

    await expect(store.reloadEntityData()).rejects.toThrow('Failed to load user data');
    expect(store.savedEntityData?.id).toBe('cand-1');
  });
});

describe('contestantUserDataState, a draft for each entity', () => {
  const CANDIDATE_A = { type: 'candidate', id: 'cand-1' } as const;
  const ORGANIZATION_B = { type: 'organization', id: 'org-1' } as const;
  const KEY_A = editedAnswersKey(CANDIDATE_A, USER_A);
  const KEY_B = editedAnswersKey(ORGANIZATION_B, USER_A);

  let cleanups: Array<() => void> = [];

  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    cleanups.forEach((cleanup) => cleanup());
    cleanups = [];
    localStorage.clear();
    vi.restoreAllMocks();
  });

  /**
   * Create a store inside an `$effect.root` without loading anything into it.
   */
  function setup({ answersLocked = () => false }: { answersLocked?: () => boolean } = {}) {
    const fake = makeFakeWriter();
    let store!: ContestantUserDataState;
    cleanups.push(
      $effect.root(() => {
        store = contestantUserDataState({
          answersLocked,
          dataWriter: () => fake.writer,
          locale: () => 'en'
        });
      })
    );
    flushSync();
    return { store, ...fake };
  }

  it('builds an entity key from the stem, the signed-in user, the type and the id', () => {
    expect(EDITED_ANSWERS_KEY_STEM).toBe('contestantContext-userData-editedAnswers');
    expect(KEY_A).toBe(`contestantContext-userData-editedAnswers-${USER_A}-candidate-cand-1`);
    expect(KEY_B).toBe(`contestantContext-userData-editedAnswers-${USER_A}-organization-org-1`);
    expect(editedAnswersKey(CANDIDATE_A, USER_B)).not.toBe(KEY_A);
  });

  it("does not show one user's unsaved answers to another user of the same entity, and removes them", () => {
    const first = setup();
    first.store.init(makeUserData(), USER_A);
    first.store.setAnswer('q1', { value: 3 });
    flushSync();
    expect(storedDraft(KEY_A)).toEqual({ q1: { value: 3 } });

    const second = setup();
    second.store.init(makeUserData(), USER_B);
    flushSync();

    expect(second.store.current?.entity.answers).toEqual({});
    expect(second.store.unsavedQuestionIds).toEqual([]);
    expect(second.store.hasUnsaved).toBe(false);
    expect(storedKeys()).toEqual([editedAnswersKey(CANDIDATE_A, USER_B)]);
  });

  it("keeps a user's own unsaved answers for a later visit by the same user", () => {
    const first = setup();
    first.store.init(makeUserData(), USER_A);
    first.store.setAnswer('q1', { value: 3 });
    flushSync();
    first.store.leaveEntity();

    const second = setup();
    second.store.init(makeUserData(), USER_A);
    flushSync();

    expect(second.store.current?.entity.answers).toEqual({ q1: { value: 3 } });
  });

  it('removes a draft stored under a key that names no user', () => {
    localStorageState(`${EDITED_ANSWERS_KEY_STEM}-candidate-cand-1`, {} as LocalizedAnswers).set({
      q1: { value: 'left by an earlier session' }
    });
    const { store } = setup();
    store.init(makeUserData(), USER_A);
    flushSync();

    expect(store.current?.entity.answers).toEqual({});
    expect(storedKeys()).toEqual([KEY_A]);
  });

  it('reads as empty, with nothing unsaved, before an entity is loaded, and refuses an answer', () => {
    const { store } = setup();

    expect(store.current).toBeUndefined();
    expect(store.hasUnsaved).toBe(false);
    expect(store.unsavedQuestionIds).toEqual([]);
    expect(() => store.setAnswer('q1', { value: 3 })).toThrow('Cannot set an answer before user data is loaded');
    expect(storedKeys()).toEqual([]);
  });

  it.each([
    ['a candidate and an organization', makeUserData(), makeOrganizationUserData()],
    ['two candidates', makeUserData(), makeUserData({ id: 'cand-2' })],
    [
      'a candidate and an organization with the same id',
      makeUserData({ id: 'same' }),
      makeOrganizationUserData({ id: 'same' })
    ]
  ])('an edit made for A is absent for B and present again for A: %s', (_pair, dataA, dataB) => {
    const { store } = setup();
    const keyA = editedAnswersKey(dataA.entity, USER_A);
    const keyB = editedAnswersKey(dataB.entity, USER_A);
    expect(keyA).not.toBe(keyB);

    store.init(dataA, USER_A);
    store.setAnswer('q1', { value: 3 });
    flushSync();
    expect(store.unsavedQuestionIds).toEqual(['q1']);

    store.init(dataB, USER_A);
    flushSync();
    expect(store.current?.entity).toMatchObject({ type: dataB.entity.type, id: dataB.entity.id });
    expect(store.current?.entity.answers).toEqual({});
    expect(store.unsavedQuestionIds).toEqual([]);
    expect(store.hasUnsaved).toBe(false);

    store.init(dataA, USER_A);
    flushSync();
    expect(store.current?.entity.answers).toEqual({ q1: { value: 3 } });
    expect(store.unsavedQuestionIds).toEqual(['q1']);
    expect(storedDraft(keyA)).toEqual({ q1: { value: 3 } });
    expect(storedDraft(keyB)).toEqual({});
    // Nothing but the two drafts is stored: no key records which entity was opened last.
    expect(storedKeys()).toEqual([keyA, keyB].sort());
  });

  it('an image edit made for A is gone after B is loaded, and does not come back with A', () => {
    const { store } = setup();

    store.init(makeUserData(), USER_A);
    store.setImage(makeImage());
    flushSync();
    expect(store.unsavedProperties).toEqual(['image']);

    store.init(makeOrganizationUserData(), USER_A);
    flushSync();
    expect(store.unsavedProperties).toEqual([]);
    expect(store.current?.entity.image).toBeUndefined();

    store.init(makeUserData(), USER_A);
    flushSync();
    expect(store.unsavedProperties).toEqual([]);
  });

  it("loading A again with fresh data keeps A's draft and its image edit", () => {
    const { store } = setup();
    const image = makeImage();

    store.init(makeUserData(), USER_A);
    store.setAnswer('q1', { value: 3 });
    store.setImage(image);
    flushSync();

    store.init(makeUserData({ firstName: 'Fresh' }), USER_A);
    flushSync();

    expect(store.current?.entity).toMatchObject({ firstName: 'Fresh', answers: { q1: { value: 3 } } });
    expect(store.unsavedQuestionIds).toEqual(['q1']);
    expect(store.unsavedProperties).toEqual(['image']);
  });

  it("save() for A empties A's key and leaves B's", async () => {
    const { store, updateAnswers } = setup();

    store.init(makeOrganizationUserData(), USER_A);
    store.setAnswer('q2', { value: 'for B' });
    store.init(makeUserData(), USER_A);
    store.setAnswer('q1', { value: 3 });
    flushSync();

    const result = await store.save();
    flushSync();

    expect(result).toEqual({ type: 'success', listedPropertySaved: false });
    expect(updateAnswers).toHaveBeenCalledTimes(1);
    expect(updateAnswers.mock.calls[0][0]).toMatchObject({ target: CANDIDATE_A, answers: { q1: { value: 3 } } });
    expect(storedDraft(KEY_A)).toEqual({});
    expect(storedDraft(KEY_B)).toEqual({ q2: { value: 'for B' } });
  });

  it("leaveEntity() empties the store and leaves A's key as it was", () => {
    const { store } = setup();

    store.init(makeUserData(), USER_A);
    store.setAnswer('q1', { value: 3 });
    store.setImage(makeImage());
    flushSync();
    const storedBefore = localStorage.getItem(KEY_A);

    store.leaveEntity();
    flushSync();

    expect(store.current).toBeUndefined();
    expect(store.savedEntityData).toBeUndefined();
    expect(store.hasUnsaved).toBe(false);
    expect(localStorage.getItem(KEY_A)).toBe(storedBefore);
    expect(storedDraft(KEY_A)).toEqual({ q1: { value: 3 } });

    // The draft is shown again when the entity is loaded again; the image edit is not.
    store.init(makeUserData(), USER_A);
    flushSync();
    expect(store.unsavedQuestionIds).toEqual(['q1']);
    expect(store.unsavedProperties).toEqual([]);
  });

  it("reset() removes A's and B's keys and leaves a key outside the stem", () => {
    const { store } = setup();
    localStorage.setItem('appContext-userPreferences', 'kept');
    localStorage.setItem(`other-${EDITED_ANSWERS_KEY_STEM}-candidate-cand-1`, 'kept');

    store.init(makeUserData(), USER_A);
    store.setAnswer('q1', { value: 3 });
    store.init(makeOrganizationUserData(), USER_A);
    store.setAnswer('q2', { value: 'for B' });
    flushSync();
    expect(storedKeys()).toContain(KEY_A);
    expect(storedKeys()).toContain(KEY_B);

    store.reset();
    flushSync();

    expect(store.current).toBeUndefined();
    expect(store.hasUnsaved).toBe(false);
    expect(storedKeys()).toEqual(
      ['appContext-userPreferences', `other-${EDITED_ANSWERS_KEY_STEM}-candidate-cand-1`].sort()
    );

    // Nothing of either draft comes back after the sweep.
    store.init(makeUserData(), USER_A);
    flushSync();
    expect(store.unsavedQuestionIds).toEqual([]);
  });

  it('with answers locked, a draft stored for B beforehand is cleared when B is loaded', () => {
    let locked = $state(false);
    const { store } = setup({ answersLocked: () => locked });
    localStorageState(KEY_B, {} as LocalizedAnswers).set({ q9: { value: 'stored before the lock' } });

    store.init(makeUserData(), USER_A);
    store.setAnswer('q1', { value: 3 });
    store.setImage(makeImage());
    flushSync();
    expect(store.hasUnsaved).toBe(true);

    // The lock arrives while A is loaded: A's draft and image edit go, and B's stored draft is not touched yet.
    locked = true;
    flushSync();
    expect(store.hasUnsaved).toBe(false);
    expect(storedDraft(KEY_A)).toEqual({});
    expect(storedDraft(KEY_B)).toEqual({ q9: { value: 'stored before the lock' } });

    store.init(makeOrganizationUserData(), USER_A);
    flushSync();
    expect(store.unsavedQuestionIds).toEqual([]);
    expect(store.current?.entity.answers).toEqual({});
    expect(storedDraft(KEY_B)).toEqual({});
  });

  it('with answers locked and nothing drafted or staged, current stays the object it was when an entity is loaded', () => {
    // Without the lock nothing writes after a load, so the value read before the flush is the value after it.
    const unlocked = setup().store;
    unlocked.init(makeUserData(), USER_A);
    const loadedUnlocked = unlocked.current;
    flushSync();
    expect(loadedUnlocked).toBeDefined();
    expect(unlocked.current).toBe(loadedUnlocked);

    // Under the lock the store's own effect runs in that flush. With nothing to clear it writes nothing.
    const { store } = setup({ answersLocked: () => true });
    store.init(makeUserData(), USER_A);
    const loaded = store.current;
    flushSync();

    expect(loaded).toBeDefined();
    expect(store.current).toBe(loaded);
    expect(store.hasUnsaved).toBe(false);
  });

  it('the answers lock turning on with a drafted answer and nothing staged clears the draft', () => {
    let locked = $state(false);
    const { store } = setup({ answersLocked: () => locked });
    store.init(makeUserData(), USER_A);
    store.setAnswer('q1', { value: 3 });
    flushSync();
    expect(store.unsavedQuestionIds).toEqual(['q1']);
    expect(store.unsavedProperties).toEqual([]);

    locked = true;
    flushSync();

    expect(store.hasUnsaved).toBe(false);
    expect(store.current?.entity.answers).toEqual({});
    expect(storedDraft(KEY_A)).toEqual({});
  });

  it('the answers lock turning on with a staged property and nothing drafted discards the property', () => {
    let locked = $state(false);
    const { store } = setup({ answersLocked: () => locked });
    store.init(makeUserData(), USER_A);
    store.setImage(makeImage());
    flushSync();
    expect(store.unsavedQuestionIds).toEqual([]);
    expect(store.unsavedProperties).toEqual(['image']);

    locked = true;
    flushSync();

    expect(store.hasUnsaved).toBe(false);
    expect(store.unsavedProperties).toEqual([]);
    expect(store.current?.entity.image).toBeUndefined();
  });

  it("two store instances holding A and B do not read each other's edits", () => {
    const first = setup().store;
    const second = setup().store;

    first.init(makeUserData(), USER_A);
    second.init(makeOrganizationUserData(), USER_A);
    first.setAnswer('q1', { value: 3 });
    second.setAnswer('q2', { value: 'for B' });
    flushSync();

    expect(first.unsavedQuestionIds).toEqual(['q1']);
    expect(first.current?.entity.answers).toEqual({ q1: { value: 3 } });
    expect(second.unsavedQuestionIds).toEqual(['q2']);
    expect(second.current?.entity.answers).toEqual({ q2: { value: 'for B' } });

    // A reload of either tab reads that tab's own entity key.
    const reloaded = setup().store;
    reloaded.init(makeOrganizationUserData(), USER_A);
    flushSync();
    expect(reloaded.unsavedQuestionIds).toEqual(['q2']);
  });

  it('init called inside an effect does not rerun that effect when it swaps the draft', () => {
    const { store } = setup();

    let runs = 0;
    cleanups.push(
      $effect.root(() => {
        $effect(() => {
          runs += 1;
          store.init(makeUserData(), USER_A);
        });
      })
    );
    flushSync();
    flushSync();
    expect(runs).toBe(1);

    // Loading another entity from elsewhere replaces the draft; the effect must not answer by loading A again.
    store.init(makeOrganizationUserData(), USER_A);
    flushSync();
    expect(runs).toBe(1);
    expect(store.savedEntityData).toMatchObject(ORGANIZATION_B);
  });

  it("a save still in flight when B is loaded clears A's draft and leaves B's data, draft and image edit alone", async () => {
    const { store, updateAnswers, updateEntityProperties } = setup();
    const answersCall = deferred<SetAnswersResult>();
    updateAnswers.mockImplementationOnce(() => answersCall.promise);

    store.init(makeUserData(), USER_A);
    store.setAnswer('q1', { value: 3 });
    store.setImage(makeImage());
    flushSync();
    const pending = store.save();

    store.init(makeOrganizationUserData(), USER_A);
    store.setAnswer('q2', { value: 'for B' });
    store.setImage(makeImage());
    flushSync();
    answersCall.resolve({ q1: { value: 3 } });
    const result = await pending;
    flushSync();

    expect(result).toEqual({ type: 'success', listedPropertySaved: true });
    expect(updateAnswers.mock.calls[0][0].target).toEqual(CANDIDATE_A);
    expect(updateEntityProperties.mock.calls[0][0].target).toEqual(CANDIDATE_A);
    expect(storedDraft(KEY_A)).toEqual({});
    expect(store.savedEntityData).toEqual({ type: 'organization', id: 'org-1', name: 'Org', answers: {} });
    expect(store.unsavedQuestionIds).toEqual(['q2']);
    expect(store.unsavedProperties).toEqual(['image']);
    expect(storedDraft(KEY_B)).toEqual({ q2: { value: 'for B' } });
  });

  it("a save still in flight when the entity is left resolves, and clears that entity's draft", async () => {
    const { store, updateAnswers } = setup();
    const answersCall = deferred<SetAnswersResult>();
    updateAnswers.mockImplementationOnce(() => answersCall.promise);

    store.init(makeUserData(), USER_A);
    store.setAnswer('q1', { value: 3 });
    flushSync();
    const pending = store.save();

    store.leaveEntity();
    answersCall.resolve({ q1: { value: 3 } });

    await expect(pending).resolves.toEqual({ type: 'success', listedPropertySaved: false });
    expect(store.current).toBeUndefined();
    expect(storedDraft(KEY_A)).toEqual({});
  });

  it("a reload still in flight when B is loaded does not store A's data over B's", async () => {
    const { store, getEntityUserData } = setup();
    const reloadCall = deferred<ContestantUserData<true>>();
    getEntityUserData.mockImplementationOnce(() => reloadCall.promise);

    store.init(makeUserData(), USER_A);
    flushSync();
    const pending = store.reloadEntityData();

    store.init(makeOrganizationUserData(), USER_A);
    flushSync();
    reloadCall.resolve(makeUserData({ firstName: 'Reloaded' }));
    const reloaded = await pending;
    flushSync();

    expect(reloaded).toMatchObject({ type: 'candidate', id: 'cand-1', firstName: 'Reloaded' });
    expect(store.savedEntityData).toEqual({ type: 'organization', id: 'org-1', name: 'Org', answers: {} });
  });
});

describe('contestantUserDataState, staged properties', () => {
  const KEY_ORGANIZATION = editedAnswersKey({ type: 'organization', id: 'org-1' }, USER_A);

  let cleanups: Array<() => void> = [];

  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    cleanups.forEach((cleanup) => cleanup());
    cleanups = [];
    localStorage.clear();
    vi.restoreAllMocks();
  });

  /**
   * Create a store inside an `$effect.root` and, when given, load `userData` into it.
   */
  function setup({
    userData,
    answersLocked = () => false
  }: { userData?: ContestantUserData<true>; answersLocked?: () => boolean } = {}) {
    const fake = makeFakeWriter();
    let store!: ContestantUserDataState;
    cleanups.push(
      $effect.root(() => {
        store = contestantUserDataState({
          answersLocked,
          dataWriter: () => fake.writer,
          locale: () => 'fi'
        });
      })
    );
    if (userData) store.init(userData, USER_A);
    flushSync();
    return { store, ...fake };
  }

  /**
   * An organization stored with a name in two locales, a short name and a pair of colours.
   */
  function makeStyledOrganization(): ContestantUserData<true> {
    return makeOrganizationUserData(
      { shortName: 'ORG', color: { normal: '#2546A8', dark: '#ffffff' } },
      { name: { en: 'Org', fi: 'Järjestö' }, shortName: { en: 'ORG' } }
    );
  }

  it('savedLocalizedNames holds the stored names by locale, not a staged one, and nothing for a candidate or before a load', () => {
    const { store } = setup();
    expect(store.savedLocalizedNames).toBeUndefined();

    store.init(makeStyledOrganization(), USER_A);
    store.setProperty('name', { en: 'New' });
    flushSync();
    expect(store.current?.localizedNames?.name).toEqual({ en: 'New' });
    expect(store.savedLocalizedNames).toEqual({ name: { en: 'Org', fi: 'Järjestö' }, shortName: { en: 'ORG' } });

    store.init(makeUserData(), USER_A);
    flushSync();
    expect(store.savedLocalizedNames).toBeUndefined();
  });

  it('refuses a property before an entity is loaded', () => {
    const { store } = setup();

    expect(() => store.setProperty('name', { en: 'New' })).toThrow('Cannot set a property before user data is loaded');
    expect(store.hasUnsaved).toBe(false);
  });

  it('a name that differs from the saved one is unsaved, and current shows it by locale', () => {
    const { store } = setup({ userData: makeOrganizationUserData() });

    store.setProperty('name', { en: 'New', fi: 'Uusi' });
    flushSync();

    expect(store.hasUnsaved).toBe(true);
    expect(store.unsavedProperties).toEqual(['name']);
    expect(store.current?.localizedNames).toEqual({ name: { en: 'New', fi: 'Uusi' }, shortName: null });
    // The saved entity is what it was.
    expect(store.savedEntityData).toMatchObject({ name: 'Org' });
  });

  it.each([
    ['in another key order', { fi: 'Järjestö', en: 'Org' }],
    ['with padding', { en: ' Org ', fi: 'Järjestö  ' }],
    ['with a blank locale added', { en: 'Org', fi: 'Järjestö', sv: '', da: '   ' }]
  ])('staging the saved name again %s leaves nothing unsaved', (_form, name) => {
    const { store } = setup({ userData: makeOrganizationUserData() });

    store.setProperty('name', { en: 'New' });
    flushSync();
    expect(store.hasUnsaved).toBe(true);

    store.setProperty('name', name);
    flushSync();

    expect(store.hasUnsaved).toBe(false);
    expect(store.unsavedProperties).toEqual([]);
    expect(store.current?.localizedNames).toEqual(ORGANIZATION_NAMES);
  });

  it('a staged name is stored trimmed and without its blank entries', () => {
    const { store } = setup({ userData: makeOrganizationUserData() });

    store.setProperty('name', { en: '  New ', fi: '', sv: ' ' });
    flushSync();

    expect(store.current?.localizedNames?.name).toEqual({ en: 'New' });
  });

  it('a name with no entry left is staged as no name', () => {
    const { store } = setup({ userData: makeOrganizationUserData() });

    store.setProperty('name', { en: '', fi: ' ' });
    flushSync();

    expect(store.unsavedProperties).toEqual(['name']);
    expect(store.current?.localizedNames?.name).toBeNull();
  });

  it('a short name is unsaved exactly while it differs from the saved one', () => {
    const { store } = setup({ userData: makeStyledOrganization() });

    store.setProperty('shortName', { en: 'NEW' });
    flushSync();
    expect(store.unsavedProperties).toEqual(['shortName']);
    expect(store.current?.localizedNames?.shortName).toEqual({ en: 'NEW' });

    store.setProperty('shortName', { en: ' ORG', fi: '' });
    flushSync();
    expect(store.unsavedProperties).toEqual([]);
    expect(store.current?.localizedNames?.shortName).toEqual({ en: 'ORG' });

    // Clearing a stored short name is a change.
    store.setProperty('shortName', null);
    flushSync();
    expect(store.unsavedProperties).toEqual(['shortName']);
    expect(store.current?.localizedNames?.shortName).toBeNull();
  });

  it.each([
    ['null', null],
    ['blank entries alone', { en: '', fi: '  ' }]
  ])('a short name of %s is not unsaved when none is stored', (_form, shortName) => {
    const { store } = setup({ userData: makeOrganizationUserData() });

    store.setProperty('shortName', shortName);
    flushSync();

    expect(store.hasUnsaved).toBe(false);
  });

  it('a colour is unsaved exactly while its hex colour differs from the saved normal colour', () => {
    const { store } = setup({ userData: makeStyledOrganization() });

    // The stored pair in another letter case is the same colour: the pair stays as it is.
    store.setProperty('color', { normal: '#2546a8' });
    flushSync();
    expect(store.hasUnsaved).toBe(false);
    expect(store.current?.entity.color).toEqual({ normal: '#2546A8', dark: '#ffffff' });

    store.setProperty('color', { normal: '#ff0000' });
    flushSync();
    expect(store.unsavedProperties).toEqual(['color']);
    // The staged colour replaces the pair whole.
    expect(store.current?.entity.color).toEqual({ normal: '#ff0000' });

    store.setProperty('color', null);
    flushSync();
    expect(store.unsavedProperties).toEqual(['color']);
    expect(store.current?.entity.color).toBeNull();

    store.setProperty('color', { normal: '#2546A8' });
    flushSync();
    expect(store.hasUnsaved).toBe(false);
  });

  // The database accepts a colour object with no `normal`, or a JSON null there, beside a `dark`: it names no colour for the default theme, so it compares as no colour.
  it.each([
    ['a dark-theme colour alone', { dark: '#123456' }],
    ['a null normal colour', { normal: null, dark: '#123456' }],
    ['an empty object', {}]
  ])('a colour can be staged over a stored colour holding %s', (_form, stored) => {
    const { store } = setup({
      userData: makeOrganizationUserData({ color: stored as unknown as LocalizedOrganizationData['color'] })
    });

    expect(() => store.setProperty('color', { normal: '#ff0000' })).not.toThrow();
    flushSync();

    expect(store.unsavedProperties).toEqual(['color']);
    expect(store.current?.entity.color).toEqual({ normal: '#ff0000' });
  });

  it('a three-digit colour is the same colour as its six-digit form', () => {
    const { store } = setup({ userData: makeOrganizationUserData({ color: { normal: '#00aa00' } }) });

    store.setProperty('color', { normal: '#0A0' });
    flushSync();

    expect(store.hasUnsaved).toBe(false);
  });

  it('clearing the colour is not unsaved when none is stored', () => {
    const { store } = setup({ userData: makeOrganizationUserData() });

    store.setProperty('color', null);
    flushSync();

    expect(store.hasUnsaved).toBe(false);
  });

  it("a candidate's first and last name are unsaved exactly while they differ from the saved ones", () => {
    const { store } = setup({ userData: makeUserData() });

    store.setProperty('firstName', ' Ada ');
    store.setProperty('lastName', 'Lovelace');
    flushSync();
    expect([...store.unsavedProperties].sort()).toEqual(['firstName', 'lastName']);
    expect(store.current?.entity).toMatchObject({ firstName: 'Ada', lastName: 'Lovelace' });
    // A candidate has no names by locale.
    expect(store.current?.localizedNames).toBeUndefined();

    store.setProperty('firstName', ' A');
    store.setProperty('lastName', 'B ');
    flushSync();
    expect(store.hasUnsaved).toBe(false);
    expect(store.current?.entity).toMatchObject({ firstName: 'A', lastName: 'B' });
  });

  it('resetProperty discards one staged property and leaves the others', () => {
    const { store } = setup({ userData: makeOrganizationUserData() });

    store.setProperty('name', { en: 'New' });
    store.setProperty('color', { normal: '#ff0000' });
    store.setImage(makeImage());
    flushSync();

    store.resetProperty('name');
    flushSync();
    expect([...store.unsavedProperties].sort()).toEqual(['color', 'image']);
    expect(store.current?.localizedNames).toEqual(ORGANIZATION_NAMES);

    store.resetImage();
    flushSync();
    expect(store.unsavedProperties).toEqual(['color']);
  });

  it('setImage(null) with no stored image stages nothing and discards an unsaved image', () => {
    const { store } = setup({ userData: makeUserData() });

    store.setImage(makeImage());
    flushSync();
    expect(store.unsavedProperties).toEqual(['image']);

    store.setImage(null);
    flushSync();
    expect(store.unsavedProperties).toEqual([]);
    expect(store.hasUnsaved).toBe(false);
  });

  it('a value handed in as a reactive proxy is staged as a plain copy', async () => {
    const { store, updateEntityProperties } = setup({ userData: makeOrganizationUserData() });
    const name = $state({ en: 'New', fi: 'Uusi' });
    const color = $state({ normal: '#ff0000' });
    // The control: the platform refuses to clone the proxies themselves.
    expect(() => structuredClone(name)).toThrow();

    store.setProperty('name', name);
    store.setProperty('color', color);
    flushSync();

    expect(() => structuredClone(store.current)).not.toThrow();
    expect(structuredClone(store.current)?.localizedNames?.name).toEqual({ en: 'New', fi: 'Uusi' });

    // What is staged does not follow a later change of the object it was copied from.
    name.en = 'Changed afterwards';
    flushSync();
    expect(store.current?.localizedNames?.name).toEqual({ en: 'New', fi: 'Uusi' });

    await store.save();
    for (const [{ properties }] of updateEntityProperties.mock.calls)
      expect(() => structuredClone(properties)).not.toThrow();
  });

  it('staged properties are in no storage key, and a new store over the same storage holds the answer draft alone', () => {
    const { store } = setup({ userData: makeOrganizationUserData() });

    store.setAnswer('q1', { value: 3 });
    store.setProperty('name', { en: 'A name that must not be stored' });
    store.setProperty('shortName', { en: 'STAGED' });
    store.setProperty('color', { normal: '#ff0000' });
    store.setImage(makeImage());
    flushSync();
    expect([...store.unsavedProperties].sort()).toEqual(['color', 'image', 'name', 'shortName']);

    expect(storedKeys()).toEqual([KEY_ORGANIZATION]);
    expect(storedDraft(KEY_ORGANIZATION)).toEqual({ q1: { value: 3 } });
    const stored = localStorage.getItem(KEY_ORGANIZATION) ?? '';
    expect(stored).not.toContain('A name that must not be stored');
    expect(stored).not.toContain('STAGED');
    expect(stored).not.toContain('#ff0000');

    // A reload: another store reads the same storage.
    const reloaded = setup({ userData: makeOrganizationUserData() }).store;
    expect(reloaded.unsavedQuestionIds).toEqual(['q1']);
    expect(reloaded.unsavedProperties).toEqual([]);
    expect(reloaded.current?.localizedNames).toEqual(ORGANIZATION_NAMES);
  });

  /**
   * Stage one of each property an organization has, with an answer.
   */
  function stageEverything(store: ContestantUserDataState): void {
    store.setAnswer('q1', { value: 3 });
    store.setProperty('name', { en: 'New' });
    store.setProperty('shortName', { en: 'NEW' });
    store.setProperty('color', { normal: '#ff0000' });
    store.setImage(makeImage());
    flushSync();
    expect([...store.unsavedProperties].sort()).toEqual(['color', 'image', 'name', 'shortName']);
  }

  it('resetUnsaved discards every staged property and the answer draft', () => {
    const { store } = setup({ userData: makeOrganizationUserData() });
    stageEverything(store);

    store.resetUnsaved();
    flushSync();

    expect(store.hasUnsaved).toBe(false);
    expect(store.unsavedProperties).toEqual([]);
    expect(store.current?.localizedNames).toEqual(ORGANIZATION_NAMES);
    expect(store.current?.entity.color).toBeUndefined();
  });

  it('leaveEntity discards every staged property and keeps the answer draft in storage', () => {
    const { store } = setup({ userData: makeOrganizationUserData() });
    stageEverything(store);

    store.leaveEntity();
    store.init(makeOrganizationUserData(), USER_A);
    flushSync();

    expect(store.unsavedProperties).toEqual([]);
    expect(store.unsavedQuestionIds).toEqual(['q1']);
  });

  it('init with another entity discards every staged property, and they do not come back with the first', () => {
    const { store } = setup({ userData: makeOrganizationUserData() });
    stageEverything(store);

    store.init(makeUserData(), USER_A);
    flushSync();
    expect(store.unsavedProperties).toEqual([]);
    expect(store.current?.entity).toMatchObject({ firstName: 'A', lastName: 'B' });

    store.init(makeOrganizationUserData(), USER_A);
    flushSync();
    expect(store.unsavedProperties).toEqual([]);
    expect(store.unsavedQuestionIds).toEqual(['q1']);
  });

  it('init with the same entity keeps the answer draft and the staged properties', () => {
    const { store } = setup({ userData: makeOrganizationUserData() });
    stageEverything(store);

    store.init(makeOrganizationUserData({ info: 'Fresh' }), USER_A);
    flushSync();

    expect(store.unsavedQuestionIds).toEqual(['q1']);
    expect([...store.unsavedProperties].sort()).toEqual(['color', 'image', 'name', 'shortName']);
    expect(store.current?.entity).toMatchObject({ info: 'Fresh' });
  });

  it('the answers lock turning on discards every staged property with the answer draft', () => {
    let locked = $state(false);
    const { store } = setup({ userData: makeOrganizationUserData(), answersLocked: () => locked });
    stageEverything(store);

    locked = true;
    flushSync();

    expect(store.hasUnsaved).toBe(false);
    expect(store.unsavedProperties).toEqual([]);
    expect(store.current?.localizedNames).toEqual(ORGANIZATION_NAMES);
    expect(storedDraft(KEY_ORGANIZATION)).toEqual({});
  });

  it('a reload stores the names by locale with the entity', async () => {
    const { store, getEntityUserData } = setup({ userData: makeOrganizationUserData() });
    const reloadedNames = { name: { en: 'Renamed', fi: 'Uudelleennimetty' }, shortName: { en: 'RN' } };
    getEntityUserData.mockResolvedValue(makeOrganizationUserData({ name: 'Uudelleennimetty' }, reloadedNames));

    await store.reloadEntityData();
    flushSync();

    expect(store.savedEntityData).toMatchObject({ name: 'Uudelleennimetty' });
    expect(store.current?.localizedNames).toEqual(reloadedNames);
  });

  describe('save()', () => {
    /** The names of the properties each call of the property writer carried, sorted, in call order. */
    function writtenProperties(updateEntityProperties: ReturnType<typeof makeFakeWriter>['updateEntityProperties']) {
      return updateEntityProperties.mock.calls.map(([{ properties }]) => Object.keys(properties).sort());
    }

    it('with a staged name and nothing else, writes the name alone and stores it in both forms', async () => {
      const { store, updateAnswers, updateEntityProperties } = setup({ userData: makeOrganizationUserData() });
      store.setProperty('name', { en: 'New', fi: 'Uusi' });
      flushSync();

      const result = await store.save();
      flushSync();

      expect(result).toEqual({ type: 'success', listedPropertySaved: true });
      expect(updateAnswers).not.toHaveBeenCalled();
      expect(updateEntityProperties).toHaveBeenCalledTimes(1);
      expect(updateEntityProperties.mock.calls[0][0]).toEqual({
        target: { type: 'organization', id: 'org-1' },
        properties: { name: { en: 'New', fi: 'Uusi' } },
        locale: 'fi'
      });
      // The entity holds the name in the store's locale, and the names by locale hold the stored object.
      expect(store.savedEntityData).toMatchObject({ type: 'organization', id: 'org-1', name: 'Uusi' });
      expect(store.current?.localizedNames).toEqual({ name: { en: 'New', fi: 'Uusi' }, shortName: null });
      expect(store.hasUnsaved).toBe(false);
    });

    it('with staged answers only, writes no property and says no listed property was saved', async () => {
      const { store, updateAnswers, updateEntityProperties } = setup({ userData: makeOrganizationUserData() });
      store.setAnswer('q1', { value: 3 });
      flushSync();

      const result = await store.save();
      flushSync();

      expect(result).toEqual({ type: 'success', listedPropertySaved: false });
      expect(updateAnswers).toHaveBeenCalledTimes(1);
      expect(updateEntityProperties).not.toHaveBeenCalled();
    });

    it('sends only the properties that are staged, so an unchanged name is never sent', async () => {
      const { store, updateEntityProperties } = setup({ userData: makeStyledOrganization() });
      // The name and the short name are handed in again as they are saved: neither is staged.
      store.setProperty('name', { fi: 'Järjestö', en: 'Org ' });
      store.setProperty('shortName', { en: 'ORG', sv: '' });
      store.setProperty('color', { normal: '#ff0000' });
      flushSync();

      const result = await store.save();
      flushSync();

      expect(result).toEqual({ type: 'success', listedPropertySaved: true });
      expect(writtenProperties(updateEntityProperties)).toEqual([['color']]);
      expect(store.savedEntityData?.color).toEqual({ normal: '#ff0000' });
    });

    it('writes the names in a call of their own, after the other properties', async () => {
      const { store, updateEntityProperties } = setup({ userData: makeOrganizationUserData() });
      stageEverything(store);

      const result = await store.save();
      flushSync();

      expect(result).toEqual({ type: 'success', listedPropertySaved: true });
      expect(writtenProperties(updateEntityProperties)).toEqual([
        ['color', 'image'],
        ['name', 'shortName']
      ]);
      expect(store.savedEntityData).toMatchObject({ name: 'New', shortName: 'NEW', color: { normal: '#ff0000' } });
      expect(store.current?.localizedNames).toEqual({ name: { en: 'New' }, shortName: { en: 'NEW' } });
      expect(store.hasUnsaved).toBe(false);
    });

    it("writes a candidate's first and last name in a call of their own, after its image", async () => {
      const { store, updateEntityProperties } = setup({ userData: makeUserData() });
      store.setProperty('firstName', 'Ada');
      store.setProperty('lastName', 'Lovelace');
      store.setImage(makeImage());
      flushSync();

      const result = await store.save();
      flushSync();

      expect(result).toEqual({ type: 'success', listedPropertySaved: true });
      expect(writtenProperties(updateEntityProperties)).toEqual([['image'], ['firstName', 'lastName']]);
      expect(store.savedEntityData).toMatchObject({ id: 'cand-1', firstName: 'Ada', lastName: 'Lovelace' });
      expect(store.hasUnsaved).toBe(false);
    });

    it('a refused name does not cost the answers, the logo or the colour of the same save', async () => {
      const { store, updateAnswers, updateEntityProperties } = setup({ userData: makeOrganizationUserData() });
      const image = makeImage();
      store.setAnswer('q1', { value: 3 });
      store.setProperty('name', { en: 'New' });
      store.setProperty('color', { normal: '#ff0000' });
      store.setImage(image);
      flushSync();
      // The backend refuses the call that carries the name, and stores the other one.
      updateEntityProperties.mockImplementation(async ({ properties }) =>
        properties.name !== undefined ? { type: 'nameRefused' } : savedResultOf(properties)
      );

      const result = await store.save();
      flushSync();

      expect(result).toEqual({ type: 'nameRefused', listedPropertySaved: true });
      expect(updateAnswers).toHaveBeenCalledTimes(1);
      expect(writtenProperties(updateEntityProperties)).toEqual([['color', 'image'], ['name']]);
      // The answers, the colour and the logo are stored and merged.
      expect(store.savedEntityData?.answers?.q1).toEqual({ value: 3 });
      expect(store.savedEntityData?.color).toEqual({ normal: '#ff0000' });
      expect(store.savedEntityData?.image).toEqual(image);
      // The staged name is gone and the stored one is shown.
      expect(store.savedEntityData).toMatchObject({ name: 'Org' });
      expect(store.current?.localizedNames).toEqual(ORGANIZATION_NAMES);
      expect(store.unsavedProperties).toEqual([]);
      expect(store.unsavedQuestionIds).toEqual([]);
      expect(store.hasUnsaved).toBe(false);
    });

    it('a save whose name write fails after the logo and the colour were stored keeps only the name staged', async () => {
      const { store, updateEntityProperties } = setup({ userData: makeOrganizationUserData() });
      const image = makeImage();
      store.setProperty('name', { en: 'New' });
      store.setProperty('color', { normal: '#ff0000' });
      store.setImage(image);
      flushSync();
      // The call without the name is stored; the call with it fails for a reason other than a refused name.
      updateEntityProperties.mockImplementation(async ({ properties }) => {
        if (properties.name !== undefined) throw new Error('network down');
        return savedResultOf(properties);
      });

      await expect(store.save()).rejects.toThrow('network down');
      flushSync();

      // The logo and the colour are stored and merged, and are no longer staged: a second save does not upload the logo again.
      expect(store.savedEntityData?.color).toEqual({ normal: '#ff0000' });
      expect(store.savedEntityData?.image).toEqual(image);
      expect(store.unsavedProperties).toEqual(['name']);

      updateEntityProperties.mockImplementation(async ({ properties }) => savedResultOf(properties));
      await store.save();
      flushSync();

      expect(writtenProperties(updateEntityProperties)).toEqual([['color', 'image'], ['name'], ['name']]);
      expect(store.hasUnsaved).toBe(false);
    });

    it('a refused name saved alone reports the refusal and says no listed property was saved', async () => {
      const { store, updateEntityProperties } = setup({ userData: makeOrganizationUserData() });
      store.setProperty('name', { en: 'New' });
      store.setProperty('shortName', { en: 'NEW' });
      flushSync();
      updateEntityProperties.mockResolvedValue({ type: 'nameRefused' });

      const result = await store.save();
      flushSync();

      expect(result).toEqual({ type: 'nameRefused', listedPropertySaved: false });
      expect(store.hasUnsaved).toBe(false);
      expect(store.current?.localizedNames).toEqual(ORGANIZATION_NAMES);
    });

    it("a candidate's refused names are discarded and its image kept", async () => {
      const { store, updateEntityProperties } = setup({ userData: makeUserData() });
      const image = makeImage();
      store.setProperty('firstName', 'Ada');
      store.setImage(image);
      flushSync();
      updateEntityProperties.mockImplementation(async ({ properties }) =>
        properties.firstName !== undefined ? { type: 'nameRefused' } : savedResultOf(properties)
      );

      const result = await store.save();
      flushSync();

      expect(result).toEqual({ type: 'nameRefused', listedPropertySaved: true });
      expect(store.savedEntityData).toMatchObject({ firstName: 'A' });
      expect(store.savedEntityData?.image).toEqual(image);
      expect(store.hasUnsaved).toBe(false);
    });

    it('rejects when a write that carries no name is refused for a name, and keeps everything staged', async () => {
      const { store, updateEntityProperties } = setup({ userData: makeOrganizationUserData() });
      store.setProperty('color', { normal: '#ff0000' });
      flushSync();
      updateEntityProperties.mockResolvedValue({ type: 'nameRefused' });

      await expect(store.save()).rejects.toThrow(/name/);
      flushSync();

      expect(store.unsavedProperties).toEqual(['color']);
    });

    it('rejects when a property write throws, and keeps every staged property and the draft', async () => {
      const { store, updateEntityProperties } = setup({ userData: makeOrganizationUserData() });
      stageEverything(store);
      updateEntityProperties.mockRejectedValue(new Error('updateEntityProperties: the network is down'));

      await expect(store.save()).rejects.toThrow('updateEntityProperties: the network is down');
      flushSync();

      expect([...store.unsavedProperties].sort()).toEqual(['color', 'image', 'name', 'shortName']);
      expect(store.unsavedQuestionIds).toEqual(['q1']);
      expect(store.hasUnsaved).toBe(true);
      expect(storedDraft(KEY_ORGANIZATION)).toEqual({ q1: { value: 3 } });
    });

    it('rejects when the write of the names throws after the other properties were stored, and keeps the names and the draft', async () => {
      const { store, updateEntityProperties } = setup({ userData: makeOrganizationUserData() });
      stageEverything(store);
      updateEntityProperties.mockImplementation(async ({ properties }) => {
        if (properties.name !== undefined) throw new Error('updateEntityProperties: the network is down');
        return savedResultOf(properties);
      });

      await expect(store.save()).rejects.toThrow('updateEntityProperties: the network is down');
      flushSync();

      // Pressing Save again retries the names, and the answers, which are stored again unchanged; the stored logo and colour are not sent again.
      expect([...store.unsavedProperties].sort()).toEqual(['name', 'shortName']);
      expect(store.unsavedQuestionIds).toEqual(['q1']);
      expect(store.current?.localizedNames?.name).toEqual({ en: 'New' });
    });

    it('resolves a failure before any property write when the answers write is unverified, and keeps everything', async () => {
      const { store, updateAnswers, updateEntityProperties } = setup({ userData: makeOrganizationUserData() });
      stageEverything(store);
      updateAnswers.mockResolvedValue(UNVERIFIED_ANSWERS);

      const result = await store.save();
      flushSync();

      expect(result).toEqual({ type: 'failure' });
      expect(updateEntityProperties).not.toHaveBeenCalled();
      expect([...store.unsavedProperties].sort()).toEqual(['color', 'image', 'name', 'shortName']);
      expect(store.unsavedQuestionIds).toEqual(['q1']);
    });

    it('a property write that resolves after another entity was loaded merges nothing into that entity', async () => {
      const { store, updateEntityProperties } = setup({ userData: makeOrganizationUserData() });
      const propertiesCall = deferred<UpdateEntityPropertiesResult>();
      updateEntityProperties.mockImplementationOnce(() => propertiesCall.promise);
      store.setProperty('name', { en: 'New' });
      flushSync();
      const pending = store.save();

      store.init(makeUserData(), USER_A);
      store.setProperty('firstName', 'Ada');
      flushSync();
      propertiesCall.resolve(savedResultOf({ name: { en: 'New' } }));
      const result = await pending;
      flushSync();

      expect(result).toEqual({ type: 'success', listedPropertySaved: true });
      expect(updateEntityProperties.mock.calls[0][0].target).toEqual({ type: 'organization', id: 'org-1' });
      // The candidate loaded meanwhile holds its own data and its own staged edit.
      expect(store.savedEntityData).toEqual({
        type: 'candidate',
        id: 'cand-1',
        firstName: 'A',
        lastName: 'B',
        answers: {}
      });
      expect(store.current?.localizedNames).toBeUndefined();
      expect(store.unsavedProperties).toEqual(['firstName']);
    });
  });
});
