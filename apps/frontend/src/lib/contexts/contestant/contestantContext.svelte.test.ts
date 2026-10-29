// The REAL `ContestantContextProvider`, constructed under `$effect.root` over fakes of what it reads. The upstream `../app` and `../auth` context modules, `$app/state` and the user data store are `vi.mock`-ed. Each fake answers from a box a test fills, with a plain value or with a getter over a `$state` it then changes, so that a change reaches the provider the way a change of the real collaborator does.
//
// CLAUDE.md Context Destructuring Rule: this harness never destructures a reactive context accessor. The provider's members are read through the live instance only.

import { log as appLog } from '@openvaa/app-shared';
import { ENTITY_TYPE, QUESTION_CATEGORY_TYPE } from '@openvaa/data';
import { flushSync } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LINK_REQUEST_SETTLE_BOUND_MS, RESEND_WAIT_SECONDS } from '$lib/contestant/entryFlow';
import { requiredNameLocale } from '$lib/contestant/utils/nameRule';
import type { LocalizedString } from '@openvaa/app-shared';
import type { EntityType } from '@openvaa/data';
import type { BasicUserData, EntityNomination, UserEntity } from '$lib/api/base/dataWriter.type';
import type { QuestionRollupTargets } from '../utils/questionRollup';
import type { ContestantContextProvider } from './contestantContext.svelte';

/** A question as far as the context reads one. `entityType`, when set, is the one type the question is addressed to. */
type FakeQuestion = {
  id: string;
  isMatchable: boolean;
  required: boolean;
  customData: Record<string, unknown>;
  category: { id: string };
  entityType?: EntityType;
};

type FakeCategory = {
  id: string;
  type: string;
  appliesTo: (targets: QuestionRollupTargets) => boolean;
  getApplicableQuestions: (targets: QuestionRollupTargets) => Array<FakeQuestion>;
};

type FakeDataRoot = {
  questionCategories: Array<FakeCategory>;
  elections: Array<{ id: string }>;
  constituencies: Array<{ id: string }>;
  getElection: (id: string) => { id: string };
  getConstituency: (id: string) => { id: string };
};

/** What the stubbed user data store holds: the saved entity, its names by locale and its nominations. */
type FakeUserData = {
  entity: { type: 'candidate' | 'organization'; id: string; answers?: Record<string, { value: unknown }> } & Record<
    string,
    unknown
  >;
  localizedNames?: { name: LocalizedString | null; shortName: LocalizedString | null };
  nominations: Array<{ electionId: string; constituencyId: string }>;
};

type FakeSettings = { access: { answersLocked?: boolean; nominationsLocked?: boolean } };

type FakePage = { data: Record<string, unknown>; params: Record<string, string> };

/** The targets every category method was called with. */
type CallLog = { appliesTo: Array<QuestionRollupTargets>; getApplicableQuestions: Array<QuestionRollupTargets> };

const ELECTION = { id: 'election-1' };
const CONSTITUENCY = { id: 'constituency-1' };

/** A data root with no election, so that no election is ever selected. */
const EMPTY_DATA_ROOT: FakeDataRoot = {
  questionCategories: [],
  elections: [],
  constituencies: [],
  getElection: () => ELECTION,
  getConstituency: () => CONSTITUENCY
};

const UNLOCKED: FakeSettings = { access: { answersLocked: false } };

// `page` is whatever the box holds when it is read. A test that needs a navigation to reach the context puts a `$state` object in the box; the others leave the plain one.
const { pageBox, world } = vi.hoisted(() => ({
  pageBox: { page: { data: {}, params: {} } as FakePage },
  // Each member is read anew on every access, so a test may replace it with a getter over a `$state`.
  world: {
    settings: undefined as unknown as FakeSettings,
    dataRoot: undefined as unknown as FakeDataRoot,
    userData: undefined as FakeUserData | undefined
  }
}));

/** Put every box back to what a test that sets nothing reads. */
function resetWorld(): void {
  Object.defineProperties(world, {
    settings: { value: UNLOCKED, writable: true, configurable: true, enumerable: true },
    dataRoot: { value: EMPTY_DATA_ROOT, writable: true, configurable: true, enumerable: true },
    userData: { value: undefined, writable: true, configurable: true, enumerable: true }
  });
  pageBox.page = { data: {}, params: {} };
}
resetWorld();

// The app context's tracking members, one reference each for the whole file, so that a case can compare what the provider holds with what the app context forwards. `analyticsGate` is a `{ current }` handle whose getter reads the box's `gateInput` on every access, the way the app context's handle reads its producer's gate input; a case that changes the input puts a getter over a `$state` in the box.
const { tracking } = vi.hoisted(() => {
  const box = {
    gateInput: undefined as unknown,
    startPageview: () => undefined,
    startEvent: () => ({}),
    track: () => undefined,
    submitAllEvents: () => undefined,
    resetAllEvents: () => undefined,
    setPageVisible: (_visible: boolean) => undefined,
    analyticsGate: undefined as unknown as { readonly current: unknown }
  };
  box.analyticsGate = {
    get current() {
      return box.gateInput;
    }
  };
  return { tracking: box };
});

vi.mock('../app', () => ({
  getAppContext: () => ({
    get dataRoot() {
      return world.dataRoot;
    },
    get appSettings() {
      return world.settings;
    },
    locale: 'en',
    getRoute: { current: (route: unknown) => (typeof route === 'string' ? `/route/${route}` : '/') },
    startPageview: tracking.startPageview,
    startEvent: tracking.startEvent,
    track: tracking.track,
    submitAllEvents: tracking.submitAllEvents,
    resetAllEvents: tracking.resetAllEvents,
    setPageVisible: tracking.setPageVisible,
    analyticsGate: tracking.analyticsGate
  })
}));

// The REAL auth context, so `isAuthenticated` is its own-enumerable accessor over `page.data.session` and the way the candidate context inherits it is what the cases below measure. It is built where the provider asks for it, inside the test's effect root.
vi.mock('../auth', async () => {
  const { AuthContextProvider } = await import('../auth/authContext.svelte');
  return { getAuthContext: () => new AuthContextProvider() };
});

vi.mock('$app/state', () => ({
  get page() {
    return pageBox.page;
  }
}));

// The real helper forwards accessors live. The provider reads the app context through its own private getters, so a copy of the members onto the instance is all the harness needs.
vi.mock('../utils/inheritContextMembers', () => ({
  inheritContextMembers: (target: object, source: object) => Object.assign(target, source)
}));

// The user data store is constructed in a field initializer. The stub answers its three reads from the box, so construction reaches neither the data writer nor the persisted state.
vi.mock('./contestantUserDataState.svelte', () => ({
  contestantUserDataState: () => ({
    get current() {
      return world.userData;
    },
    get savedEntityData() {
      return world.userData?.entity;
    },
    get savedLocalizedNames() {
      return world.userData?.localizedNames;
    },
    reset: () => undefined
  })
}));

vi.mock('$lib/api/dataWriter', () => ({ dataWriter: Promise.resolve({}) }));

// The writer a call of the context prepares. A test that reads it fills the box.
const { writerBox } = vi.hoisted(() => ({ writerBox: { writer: undefined as unknown } }));
vi.mock('../utils/prepareDataWriter', () => ({ prepareDataWriter: () => writerBox.writer }));
// `$app/navigation` is resolved via the vitest.config alias stub (src/lib/i18n/tests/__mocks__/app-navigation.ts) — no per-test mock needed.

function makeQuestion({
  id,
  categoryId,
  entityType,
  required = false
}: {
  id: string;
  categoryId: string;
  entityType?: EntityType;
  required?: boolean;
}): FakeQuestion {
  return { id, isMatchable: true, required, customData: {}, category: { id: categoryId }, entityType };
}

/**
 * A category whose lookup answers as the data model's does: a question addressed to one entity type is returned for that type and for a lookup that names no type, and an unscoped question for every lookup.
 */
function makeCategory({
  id,
  type,
  questions,
  log
}: {
  id: string;
  type: string;
  questions: Array<Omit<Parameters<typeof makeQuestion>[0], 'categoryId'>>;
  log?: CallLog;
}): FakeCategory {
  const all = questions.map((question) => makeQuestion({ ...question, categoryId: id }));
  return {
    id,
    type,
    appliesTo: (targets) => {
      log?.appliesTo.push(targets);
      return true;
    },
    getApplicableQuestions: (targets) => {
      log?.getApplicableQuestions.push(targets);
      return all.filter((q) => !q.entityType || !targets.entityType || q.entityType === targets.entityType);
    }
  };
}

/** A data root with one election and one constituency, which every nomination of {@link makeUserData} names. */
function makeDataRoot(questionCategories: Array<FakeCategory>): FakeDataRoot {
  return {
    questionCategories,
    elections: [ELECTION],
    constituencies: [CONSTITUENCY],
    getElection: () => ELECTION,
    getConstituency: () => CONSTITUENCY
  };
}

/** One opinion category holding a question for each entity type and one for both, and one info category holding a required question for both. */
function makeScopedDataRoot(log?: CallLog): FakeDataRoot {
  return makeDataRoot([
    makeCategory({
      id: 'opinion',
      type: QUESTION_CATEGORY_TYPE.Opinion,
      questions: [
        { id: 'q-candidate', entityType: ENTITY_TYPE.Candidate },
        { id: 'q-organization', entityType: ENTITY_TYPE.Organization },
        { id: 'q-any' }
      ],
      log
    }),
    makeCategory({
      id: 'info',
      type: QUESTION_CATEGORY_TYPE.Info,
      questions: [{ id: 'q-info', required: true }],
      log
    })
  ]);
}

const ENTITY_ID = '7c1f0a52-3d7e-4b1f-9c56-2f1a8e0d4b63';

/** The stored data of an entity nominated in the one election, with an answer to each of `answered`. */
function makeUserData({
  type,
  answered = [],
  entity = {},
  localizedNames
}: {
  type: 'candidate' | 'organization';
  answered?: Array<string>;
  entity?: Record<string, unknown>;
  localizedNames?: FakeUserData['localizedNames'];
}): FakeUserData {
  return {
    entity: {
      type,
      id: ENTITY_ID,
      answers: Object.fromEntries(answered.map((id) => [id, { value: 'answer' }])),
      ...entity
    },
    ...(localizedNames && { localizedNames }),
    nominations: [{ electionId: ELECTION.id, constituencyId: CONSTITUENCY.id }]
  };
}

/** The ids of a list of questions, in order. */
function ids(questions: ReadonlyArray<{ id: string }>): Array<string> {
  return questions.map((q) => q.id);
}

/**
 * Construct the real provider inside an effect root and settle its effects.
 * @returns The live provider and the root's teardown.
 */
async function construct(): Promise<{ provider: ContestantContextProvider; cleanup: () => void }> {
  // Imported here so that the module mocks above are wired before the provider class evaluates its field initializers.
  const { ContestantContextProvider: Provider } = await import('./contestantContext.svelte');
  let provider!: ContestantContextProvider;
  const cleanup = $effect.root(() => {
    provider = new Provider();
  });
  flushSync();
  return { provider, cleanup };
}

describe('contestantContext — the nominations lock', () => {
  let cleanup: (() => void) | undefined;

  afterEach(() => {
    cleanup?.();
    cleanup = undefined;
    resetWorld();
  });

  it.each([
    ['absent', false, { access: {} }],
    ['false', false, { access: { nominationsLocked: false } }],
    ['true', true, { access: { nominationsLocked: true } }]
  ] as const)('with the setting %s it is %s', async (_label, expected, settings) => {
    world.settings = settings;
    const built = await construct();
    cleanup = built.cleanup;

    expect(built.provider.nominationsLocked).toBe(expected);
  });

  it('reads its own key and not the answers lock, and the answers lock does not read it', async () => {
    world.settings = { access: { answersLocked: true, nominationsLocked: false } };
    const answers = await construct();
    expect(answers.provider.nominationsLocked).toBe(false);
    expect(answers.provider.answersLocked).toBe(true);
    answers.cleanup();

    world.settings = { access: { answersLocked: false, nominationsLocked: true } };
    const nominations = await construct();
    cleanup = nominations.cleanup;
    expect(nominations.provider.nominationsLocked).toBe(true);
    expect(nominations.provider.answersLocked).toBe(false);
  });

  it('follows a settings payload that replaces the first, for a consumer reading it in an effect', async () => {
    let settings = $state.raw<FakeSettings>({ access: {} });
    Object.defineProperty(world, 'settings', { get: () => settings, configurable: true });
    const { ContestantContextProvider } = await import('./contestantContext.svelte');
    const seen: Array<boolean> = [];
    cleanup = $effect.root(() => {
      const provider = new ContestantContextProvider();
      $effect(() => {
        seen.push(provider.nominationsLocked);
      });
    });
    flushSync();
    expect(seen).toEqual([false]);

    settings = { access: { nominationsLocked: true } };
    flushSync();
    expect(seen).toEqual([false, true]);

    settings = { access: { nominationsLocked: false } };
    flushSync();
    expect(seen).toEqual([false, true, false]);
  });
});

describe('contestantContext — the tracking members of the app context', () => {
  let cleanup: (() => void) | undefined;

  afterEach(() => {
    cleanup?.();
    cleanup = undefined;
    resetWorld();
    Object.defineProperty(tracking, 'gateInput', { value: undefined, writable: true, configurable: true });
  });

  it('holds `setPageVisible` and `analyticsGate` as the references the app context forwards', async () => {
    const built = await construct();
    cleanup = built.cleanup;

    expect(typeof built.provider.setPageVisible).toBe('function');
    expect(built.provider.setPageVisible).toBe(tracking.setPageVisible);
    expect(built.provider.analyticsGate).toBe(tracking.analyticsGate);
    const descriptor = Object.getOwnPropertyDescriptor(built.provider.analyticsGate, 'current');
    expect(typeof descriptor?.get).toBe('function');
  });

  it('has no own member for a send handler', async () => {
    const built = await construct();
    cleanup = built.cleanup;

    // The app context has no member for a third-party send handler. A declaration left on the class would still make an own member, holding `undefined`.
    expect(Object.keys(built.provider).filter((key) => /tracking/i.test(key))).toEqual([]);
  });

  it('reads `analyticsGate.current` through to a change of the gate input, for a consumer reading it in an effect', async () => {
    const inactive = {
      projection: { active: false, consentMode: 'gated', visitIdMode: 'memory' },
      globalPrivacyControl: false,
      trackEvents: true,
      consent: undefined
    };
    const active = { ...inactive, projection: { ...inactive.projection, active: true } };
    let gateInput = $state.raw<typeof inactive>(inactive);
    Object.defineProperty(tracking, 'gateInput', { get: () => gateInput, configurable: true });
    const { ContestantContextProvider } = await import('./contestantContext.svelte');
    const seen: Array<unknown> = [];
    cleanup = $effect.root(() => {
      const provider = new ContestantContextProvider();
      $effect(() => {
        seen.push(provider.analyticsGate.current);
      });
    });
    flushSync();
    expect(seen).toEqual([inactive]);

    gateInput = active;
    flushSync();
    expect(seen).toEqual([inactive, active]);
  });
});

describe("contestantContext — the question scope is the loaded entity's type", () => {
  let cleanup: (() => void) | undefined;

  afterEach(() => {
    cleanup?.();
    cleanup = undefined;
    resetWorld();
  });

  it.each([[ENTITY_TYPE.Candidate], [ENTITY_TYPE.Organization]] as const)(
    'every applicability check and every applicable-question lookup receives the %s type while one is loaded',
    async (type) => {
      const log: CallLog = { appliesTo: [], getApplicableQuestions: [] };
      world.dataRoot = makeScopedDataRoot(log);
      world.userData = makeUserData({ type });
      const built = await construct();
      cleanup = built.cleanup;

      // The blocks are built by a lookup of the context's own, beside the shared rollup's, so both logs hold calls of both.
      expect(log.appliesTo.length).toBeGreaterThan(0);
      expect(log.getApplicableQuestions.length).toBeGreaterThan(0);
      for (const targets of [...log.appliesTo, ...log.getApplicableQuestions]) expect(targets.entityType).toBe(type);
    }
  );

  it.each([
    [ENTITY_TYPE.Candidate, ['q-candidate', 'q-any']],
    [ENTITY_TYPE.Organization, ['q-organization', 'q-any']]
  ] as const)(
    'the %s is asked the questions addressed to its type and the unscoped ones, in its lists and in its blocks',
    async (type, expected) => {
      world.dataRoot = makeScopedDataRoot();
      world.userData = makeUserData({ type });
      const built = await construct();
      cleanup = built.cleanup;

      expect(ids(built.provider.opinionQuestions)).toEqual(expected);
      expect(ids(built.provider.questionBlocks.questions)).toEqual(expected);
      expect(built.provider.questionBlocks.blocks.map(ids)).toEqual([expected]);
      expect(ids(built.provider.infoQuestions)).toEqual(['q-info']);
      expect(ids(built.provider.opinionQuestionCategories)).toEqual(['opinion']);
      expect(ids(built.provider.infoQuestionCategories)).toEqual(['info']);
    }
  );

  it('with no entity loaded the lists and the blocks are empty and no lookup is made, scoped or not', async () => {
    const log: CallLog = { appliesTo: [], getApplicableQuestions: [] };
    world.dataRoot = makeScopedDataRoot(log);
    const built = await construct();
    cleanup = built.cleanup;

    expect(built.provider.opinionQuestions).toEqual([]);
    expect(built.provider.infoQuestions).toEqual([]);
    expect(built.provider.opinionQuestionCategories).toEqual([]);
    expect(built.provider.infoQuestionCategories).toEqual([]);
    expect(built.provider.questionBlocks.blocks).toEqual([]);
    expect(built.provider.questionBlocks.questions).toEqual([]);
    expect(built.provider.questionBlocks.getByCategory({ id: 'opinion' })).toBeUndefined();
    expect(built.provider.questionBlocks.getByQuestion({ id: 'q-any' })).toBeUndefined();
    expect(log.appliesTo).toEqual([]);
    expect(log.getApplicableQuestions).toEqual([]);
  });

  it('follows the store from an entity of one type to an entity of the other, and to none', async () => {
    let userData = $state.raw<FakeUserData | undefined>(makeUserData({ type: 'candidate' }));
    Object.defineProperty(world, 'userData', { get: () => userData, configurable: true });
    world.dataRoot = makeScopedDataRoot();
    const built = await construct();
    cleanup = built.cleanup;
    expect(ids(built.provider.opinionQuestions)).toEqual(['q-candidate', 'q-any']);

    userData = makeUserData({ type: 'organization' });
    flushSync();
    expect(ids(built.provider.opinionQuestions)).toEqual(['q-organization', 'q-any']);
    expect(ids(built.provider.questionBlocks.questions)).toEqual(['q-organization', 'q-any']);

    userData = undefined;
    flushSync();
    expect(built.provider.opinionQuestions).toEqual([]);
    expect(built.provider.questionBlocks.blocks).toEqual([]);
  });
});

describe('contestantContext — questionsReady', () => {
  let cleanup: (() => void) | undefined;

  afterEach(() => {
    cleanup?.();
    cleanup = undefined;
    resetWorld();
  });

  it('is false while no entity is loaded, whatever the data root holds', async () => {
    world.dataRoot = makeScopedDataRoot();
    const built = await construct();
    cleanup = built.cleanup;

    expect(built.provider.questionsReady).toBe(false);
  });

  it('is false for a loaded entity while no election is selected', async () => {
    world.userData = makeUserData({ type: 'organization' });
    const built = await construct();
    cleanup = built.cleanup;

    expect(built.provider.selectedElections).toEqual([]);
    expect(built.provider.questionsReady).toBe(false);
  });

  it('with a loaded entity and no selected election the lists and the blocks are empty and no lookup is made, whatever the data root holds', async () => {
    const log: CallLog = { appliesTo: [], getApplicableQuestions: [] };
    // Categories whose questions apply to any election, in a data root that resolves no election for the entity.
    world.dataRoot = { ...makeScopedDataRoot(log), elections: [], constituencies: [] };
    world.userData = makeUserData({ type: 'candidate' });
    const built = await construct();
    cleanup = built.cleanup;

    expect(built.provider.selectedElections).toEqual([]);
    expect(built.provider.opinionQuestions).toEqual([]);
    expect(built.provider.infoQuestions).toEqual([]);
    expect(built.provider.opinionQuestionCategories).toEqual([]);
    expect(built.provider.infoQuestionCategories).toEqual([]);
    expect(built.provider.questionBlocks.blocks).toEqual([]);
    expect(built.provider.questionBlocks.questions).toEqual([]);
    expect(built.provider.questionsReady).toBe(false);
    expect(log.appliesTo).toEqual([]);
    expect(log.getApplicableQuestions).toEqual([]);
  });

  it('is true after a rollup for a loaded entity that produced questions', async () => {
    world.dataRoot = makeScopedDataRoot();
    world.userData = makeUserData({ type: 'organization' });
    const built = await construct();
    cleanup = built.cleanup;

    expect(built.provider.questionsReady).toBe(true);
    expect(built.provider.opinionQuestions.length).toBeGreaterThan(0);
  });

  it('is true after a rollup for a loaded entity that produced none', async () => {
    world.dataRoot = makeDataRoot([
      makeCategory({
        id: 'opinion',
        type: QUESTION_CATEGORY_TYPE.Opinion,
        questions: [{ id: 'q-candidate', entityType: ENTITY_TYPE.Candidate }]
      })
    ]);
    world.userData = makeUserData({ type: 'organization' });
    const built = await construct();
    cleanup = built.cleanup;

    expect(built.provider.questionsReady).toBe(true);
    expect(built.provider.opinionQuestions).toEqual([]);
    expect(built.provider.infoQuestions).toEqual([]);
  });

  /** A data root that holds the one election and constituency of these tests and answers nothing for any other id, as a data root does. */
  function strictDataRoot(): FakeDataRoot {
    function lookup(known: { id: string }): (id: string) => { id: string } {
      return (id) => {
        if (id !== known.id) throw new Error(`no such object: ${id}`);
        return known;
      };
    }
    return { ...makeScopedDataRoot(), getElection: lookup(ELECTION), getConstituency: lookup(CONSTITUENCY) };
  }

  it('skips, and logs, a nomination whose election or constituency the data root does not hold, and rolls up for the others', async () => {
    const logged = vi.spyOn(appLog, 'error').mockImplementation(() => undefined);
    world.dataRoot = strictDataRoot();
    world.userData = {
      ...makeUserData({ type: 'organization' }),
      nominations: [
        { electionId: 'election-not-in-the-data', constituencyId: 'constituency-not-in-the-data' },
        { electionId: ELECTION.id, constituencyId: CONSTITUENCY.id }
      ]
    };
    const built = await construct();
    cleanup = built.cleanup;

    expect(built.provider.selectedElections).toEqual([ELECTION]);
    expect(built.provider.selectedConstituencies).toEqual([CONSTITUENCY]);
    expect(built.provider.questionsReady).toBe(true);
    expect(built.provider.opinionQuestions.length).toBeGreaterThan(0);
    expect(logged).toHaveBeenCalled();
  });

  it('is true with no question for an entity whose nominations name no election the data root holds, so its state is decided', async () => {
    vi.spyOn(appLog, 'error').mockImplementation(() => undefined);
    world.dataRoot = strictDataRoot();
    world.userData = {
      ...makeUserData({ type: 'organization' }),
      nominations: [{ electionId: 'election-not-in-the-data', constituencyId: CONSTITUENCY.id }]
    };
    const built = await construct();
    cleanup = built.cleanup;

    expect(built.provider.selectedElections).toEqual([]);
    expect(built.provider.questionsReady).toBe(true);
    expect(built.provider.opinionQuestions).toEqual([]);
    expect(built.provider.infoQuestions).toEqual([]);
  });

  it('is false again once the store holds no entity, as after leaveEntity', async () => {
    let userData = $state.raw<FakeUserData | undefined>(makeUserData({ type: 'organization' }));
    Object.defineProperty(world, 'userData', { get: () => userData, configurable: true });
    world.dataRoot = makeScopedDataRoot();
    const built = await construct();
    cleanup = built.cleanup;
    expect(built.provider.questionsReady).toBe(true);

    userData = undefined;
    flushSync();
    expect(built.provider.questionsReady).toBe(false);
    expect(built.provider.opinionQuestions).toEqual([]);
  });

  it('never disagrees with the lists in what a consumer reads: ready with the questions, not ready without', async () => {
    let userData = $state.raw<FakeUserData | undefined>(undefined);
    Object.defineProperty(world, 'userData', { get: () => userData, configurable: true });
    world.dataRoot = makeScopedDataRoot();
    const { ContestantContextProvider } = await import('./contestantContext.svelte');
    const seen: Array<{ ready: boolean; opinion: number }> = [];
    cleanup = $effect.root(() => {
      const provider = new ContestantContextProvider();
      $effect(() => {
        seen.push({ ready: provider.questionsReady, opinion: provider.opinionQuestions.length });
      });
    });
    flushSync();

    userData = makeUserData({ type: 'organization' });
    flushSync();
    userData = undefined;
    flushSync();

    expect(seen.at(0)).toEqual({ ready: false, opinion: 0 });
    expect(seen).toContainEqual({ ready: true, opinion: 2 });
    expect(seen.at(-1)).toEqual({ ready: false, opinion: 0 });
    // This data root holds questions for an organization, so a reading that is ready with none, or holds some without being ready, is a frame in which the two disagreed.
    for (const reading of seen) expect(reading.ready).toBe(reading.opinion > 0);
  });
});

describe('contestantContext — profileComplete and the required name fields', () => {
  const REQUIRED_LOCALE = requiredNameLocale();
  const OTHER_LOCALE = REQUIRED_LOCALE === 'fi' ? 'sv' : 'fi';
  /** Every question an organization or a candidate is asked in {@link makeScopedDataRoot}, whichever type the scope is. */
  const ALL_ANSWERED = ['q-candidate', 'q-organization', 'q-any', 'q-info'];

  let cleanup: (() => void) | undefined;

  afterEach(() => {
    cleanup?.();
    cleanup = undefined;
    resetWorld();
  });

  /**
   * Load an entity into the store and list it, selected by the route, with the given confirmation.
   */
  function loadEntity({
    type,
    confirmed,
    answered = ALL_ANSWERED,
    entity,
    localizedNames
  }: {
    type: 'candidate' | 'organization';
    confirmed: boolean;
    answered?: Array<string>;
    entity?: Record<string, unknown>;
    localizedNames?: FakeUserData['localizedNames'];
  }): void {
    world.dataRoot = makeScopedDataRoot();
    world.userData = makeUserData({ type, answered, entity, localizedNames });
    const listed =
      type === 'candidate'
        ? ({ type, id: ENTITY_ID, firstName: 'Listed', lastName: 'Entity', confirmed } satisfies UserEntity)
        : ({ type, id: ENTITY_ID, name: 'Listed', confirmed } satisfies UserEntity);
    // The page data holds the entity's user data beside the list, as it does on every page below the entity-level load.
    pageBox.page = {
      data: { entities: [listed], contestantUserData: world.userData },
      params: { entityType: type, entityId: ENTITY_ID }
    };
  }

  const NAME_IN_OTHER_LOCALE = { name: { [OTHER_LOCALE]: 'Nimi' }, shortName: null };
  const NAME_IN_REQUIRED_LOCALE = { name: { [REQUIRED_LOCALE]: 'Name' }, shortName: null };

  it('is false for an unconfirmed organization whose saved name has no entry in the required locale', async () => {
    loadEntity({ type: 'organization', confirmed: false, localizedNames: NAME_IN_OTHER_LOCALE });
    const built = await construct();
    cleanup = built.cleanup;

    expect(built.provider.unansweredOpinionQuestions).toEqual([]);
    expect(built.provider.unansweredRequiredInfoQuestions).toEqual([]);
    expect(built.provider.profileComplete).toBe(false);
  });

  it.each([
    ['no name at all', { name: null, shortName: null }],
    [
      'a blank entry in the required locale',
      { name: { [REQUIRED_LOCALE]: '   ', [OTHER_LOCALE]: 'Nimi' }, shortName: null }
    ]
  ])('is false for an unconfirmed organization with %s', async (_label, localizedNames) => {
    loadEntity({ type: 'organization', confirmed: false, localizedNames });
    const built = await construct();
    cleanup = built.cleanup;

    expect(built.provider.profileComplete).toBe(false);
  });

  it('is true for an unconfirmed organization once its saved name has an entry in the required locale, with no short name', async () => {
    loadEntity({ type: 'organization', confirmed: false, localizedNames: NAME_IN_REQUIRED_LOCALE });
    const built = await construct();
    cleanup = built.cleanup;

    expect(built.provider.profileComplete).toBe(true);
  });

  it('follows the saved name: false without the required entry, true once a save stores it', async () => {
    let userData = $state.raw<FakeUserData | undefined>(undefined);
    loadEntity({ type: 'organization', confirmed: false, localizedNames: NAME_IN_OTHER_LOCALE });
    userData = world.userData;
    Object.defineProperty(world, 'userData', { get: () => userData, configurable: true });
    const built = await construct();
    cleanup = built.cleanup;
    expect(built.provider.profileComplete).toBe(false);

    userData = makeUserData({ type: 'organization', answered: ALL_ANSWERED, localizedNames: NAME_IN_REQUIRED_LOCALE });
    flushSync();
    expect(built.provider.profileComplete).toBe(true);
  });

  it('is true for a confirmed organization whose saved name has no entry in the required locale', async () => {
    loadEntity({ type: 'organization', confirmed: true, localizedNames: NAME_IN_OTHER_LOCALE });
    const built = await construct();
    cleanup = built.cleanup;

    expect(built.provider.profileComplete).toBe(true);
  });

  it('is true for an unconfirmed organization without the required entry while answers are locked', async () => {
    loadEntity({ type: 'organization', confirmed: false, localizedNames: NAME_IN_OTHER_LOCALE });
    world.settings = { access: { answersLocked: true } };
    const built = await construct();
    cleanup = built.cleanup;

    expect(built.provider.profileComplete).toBe(true);
  });

  it.each([
    ['first name is blank', { firstName: '  ', lastName: 'Candidate' }],
    ['first name is absent', { lastName: 'Candidate' }],
    ['last name is blank', { firstName: 'Ada', lastName: '' }]
  ])('is false for an unconfirmed candidate whose saved %s', async (_label, entity) => {
    loadEntity({ type: 'candidate', confirmed: false, entity });
    const built = await construct();
    cleanup = built.cleanup;

    expect(built.provider.unansweredOpinionQuestions).toEqual([]);
    expect(built.provider.profileComplete).toBe(false);
  });

  it('is true for an unconfirmed candidate with both saved names', async () => {
    loadEntity({ type: 'candidate', confirmed: false, entity: { firstName: 'Ada', lastName: 'Candidate' } });
    const built = await construct();
    cleanup = built.cleanup;

    expect(built.provider.profileComplete).toBe(true);
  });

  it('is true for a confirmed candidate, whatever its saved names hold', async () => {
    loadEntity({ type: 'candidate', confirmed: true, entity: { firstName: '', lastName: '' } });
    const built = await construct();
    cleanup = built.cleanup;

    expect(built.provider.profileComplete).toBe(true);
  });

  it.each([
    ['an opinion question', ['q-candidate', 'q-organization', 'q-info']],
    ['a required info question', ['q-candidate', 'q-organization', 'q-any']]
  ])('is false for an entity with its name while %s is unanswered, as before', async (_label, answered) => {
    loadEntity({ type: 'organization', confirmed: false, answered, localizedNames: NAME_IN_REQUIRED_LOCALE });
    const organization = await construct();
    expect(organization.provider.profileComplete).toBe(false);
    organization.cleanup();

    loadEntity({ type: 'candidate', confirmed: true, answered, entity: { firstName: 'Ada', lastName: 'Candidate' } });
    const candidate = await construct();
    cleanup = candidate.cleanup;
    expect(candidate.provider.profileComplete).toBe(false);
  });

  it('is false with no entity loaded, although no question is unanswered then', async () => {
    const built = await construct();
    cleanup = built.cleanup;

    expect(built.provider.unansweredOpinionQuestions).toEqual([]);
    expect(built.provider.unansweredRequiredInfoQuestions).toEqual([]);
    expect(built.provider.profileComplete).toBe(false);
  });
});

describe('contestantContext — the task state', () => {
  /** An id of an entity other than the one the route names. */
  const OTHER_ID = '0b9d6f3a-5c2e-4d81-a7f4-6e3c1b2a9d70';
  const NOMINATION = { electionId: ELECTION.id, constituencyId: CONSTITUENCY.id };
  const NOMINATION_TASK_ROUTE = { route: 'ContestantAppNominations' };
  const EDITOR_ENTRY_ROUTE = { route: 'ContestantAppNominationElections' };

  let cleanup: (() => void) | undefined;

  afterEach(() => {
    cleanup?.();
    cleanup = undefined;
    resetWorld();
  });

  /** The root load's elections: one that admits every entity type. */
  const ADMITTING_ELECTIONS = [{ id: ELECTION.id, nominationShape: 'organization_list_and_independents' }];

  /**
   * Open a page of a confirmed, listed entity: the route names it and the page data holds its user data with the given nominations, beside the root load's elections. The store is left as it is.
   */
  function openEntity({
    type = 'candidate',
    nominations,
    electionData = ADMITTING_ELECTIONS
  }: {
    type?: 'candidate' | 'organization';
    nominations: Array<{ electionId: string; constituencyId: string }>;
    electionData?: Array<{ id: string; nominationShape?: string }>;
  }): void {
    const listed =
      type === 'candidate'
        ? ({ type, id: ENTITY_ID, firstName: 'Listed', lastName: 'Entity', confirmed: true } satisfies UserEntity)
        : ({ type, id: ENTITY_ID, name: 'Listed', confirmed: true } satisfies UserEntity);
    pageBox.page = {
      data: { entities: [listed], electionData, contestantUserData: { entity: { type, id: ENTITY_ID }, nominations } },
      params: { entityType: type, entityId: ENTITY_ID }
    };
  }

  /** The id and status of each task, in order. */
  function statuses(provider: ContestantContextProvider): Array<[string, string | undefined]> {
    return provider.tasks.map((task) => [task.id, task.status]);
  }

  const NO_NOMINATION = [
    ['nomination', 'incomplete'],
    ['profile', 'blocked'],
    ['questions', 'blocked']
  ];

  it('answers with the nominations of the page data, and with nothing on a page whose data holds no entity', async () => {
    const page = $state<FakePage>({ data: {}, params: {} });
    pageBox.page = page;
    const built = await construct();
    cleanup = built.cleanup;
    expect(built.provider.nominations).toBeUndefined();

    page.data = { contestantUserData: { entity: { type: 'candidate', id: ENTITY_ID }, nominations: [NOMINATION] } };
    flushSync();
    expect(built.provider.nominations).toEqual([NOMINATION]);

    page.data = { contestantUserData: { entity: { type: 'candidate', id: ENTITY_ID }, nominations: [] } };
    flushSync();
    expect(built.provider.nominations).toEqual([]);
  });

  it('knows an entity with no nomination from the page data alone, before the store holds anything', async () => {
    openEntity({ nominations: [] });
    const built = await construct();
    cleanup = built.cleanup;

    expect(statuses(built.provider)).toEqual(NO_NOMINATION);
    expect(built.provider.nextStep).toEqual({ task: 'nomination', route: EDITOR_ENTRY_ROUTE });
    expect(built.provider.previewOpen).toBe(false);
    expect(built.provider.taskState.known).toBe(true);
    expect(built.provider.profileComplete).toBe(false);
  });

  it("leads the nomination task of an entity with no nomination to the editor's entry while neither lock is on", async () => {
    world.settings = { access: { answersLocked: false, nominationsLocked: false } };
    openEntity({ nominations: [] });
    const built = await construct();
    cleanup = built.cleanup;

    expect(built.provider.tasks[0]).toEqual({ id: 'nomination', status: 'incomplete', route: EDITOR_ENTRY_ROUTE });
    expect(built.provider.nextStep).toEqual({ task: 'nomination', route: EDITOR_ENTRY_ROUTE });
  });

  it.each([
    ['no election', []],
    ['only an election that does not admit its type', [{ id: ELECTION.id, nominationShape: 'organization_only' }]]
  ])(
    'leads the nomination task of an entity with no nomination to the nominations view where the project holds %s, with neither lock on',
    async (_label, electionData) => {
      world.settings = { access: { answersLocked: false, nominationsLocked: false } };
      openEntity({ nominations: [], electionData });
      const built = await construct();
      cleanup = built.cleanup;

      expect(statuses(built.provider)).toEqual(NO_NOMINATION);
      expect(built.provider.tasks[0]).toEqual({ id: 'nomination', status: 'incomplete', route: NOMINATION_TASK_ROUTE });
      expect(built.provider.nextStep).toEqual({ task: 'nomination', route: NOMINATION_TASK_ROUTE });
    }
  );

  it.each([
    ['the nominations lock', { access: { answersLocked: false, nominationsLocked: true } }],
    ['the answers lock', { access: { answersLocked: true, nominationsLocked: false } }],
    ['both locks', { access: { answersLocked: true, nominationsLocked: true } }]
  ])(
    'leads the nomination task of an entity with no nomination to the nominations view under %s',
    async (_label, settings) => {
      world.settings = settings;
      openEntity({ nominations: [] });
      const built = await construct();
      cleanup = built.cleanup;

      expect(statuses(built.provider)).toEqual(NO_NOMINATION);
      expect(built.provider.tasks[0]).toEqual({ id: 'nomination', status: 'incomplete', route: NOMINATION_TASK_ROUTE });
      expect(built.provider.nextStep).toEqual({ task: 'nomination', route: NOMINATION_TASK_ROUTE });
    }
  );

  it('follows a lock that comes on and goes off again under a live context, for an entity with no nomination', async () => {
    let settings = $state.raw<FakeSettings>({ access: { answersLocked: false, nominationsLocked: false } });
    Object.defineProperty(world, 'settings', { get: () => settings, configurable: true });
    openEntity({ nominations: [] });
    const built = await construct();
    cleanup = built.cleanup;
    expect(built.provider.nextStep?.route).toEqual(EDITOR_ENTRY_ROUTE);

    settings = { access: { answersLocked: true, nominationsLocked: false } };
    flushSync();
    expect(built.provider.nextStep?.route).toEqual(NOMINATION_TASK_ROUTE);
    expect(built.provider.tasks[0].route).toEqual(NOMINATION_TASK_ROUTE);

    settings = { access: { answersLocked: false, nominationsLocked: false } };
    flushSync();
    expect(built.provider.nextStep?.route).toEqual(EDITOR_ENTRY_ROUTE);
  });

  it.each([
    ['the nominations lock', { access: { answersLocked: false, nominationsLocked: true } }],
    ['neither lock', { access: { answersLocked: false, nominationsLocked: false } }]
  ])(
    'leads the nomination task of an entity that has a nomination to the nominations view under %s',
    async (_label, settings) => {
      world.settings = settings;
      openEntity({ nominations: [NOMINATION] });
      world.dataRoot = makeScopedDataRoot();
      world.userData = makeUserData({ type: 'candidate' });
      const built = await construct();
      cleanup = built.cleanup;

      expect(built.provider.tasks[0]).toEqual({ id: 'nomination', status: 'complete', route: NOMINATION_TASK_ROUTE });
    }
  );

  it('keeps that answer once the store holds the entity, also over a data root that holds questions it is not asked', async () => {
    openEntity({ nominations: [] });
    world.dataRoot = makeScopedDataRoot();
    world.userData = {
      ...makeUserData({ type: 'candidate', answered: ['q-candidate', 'q-any', 'q-info'] }),
      nominations: []
    };
    const built = await construct();
    cleanup = built.cleanup;

    expect(built.provider.opinionQuestions).toEqual([]);
    expect(built.provider.infoQuestions).toEqual([]);
    expect(statuses(built.provider)).toEqual(NO_NOMINATION);
    expect(built.provider.tasks.every((task) => task.count === undefined)).toBe(true);
    expect(built.provider.nextStep).toEqual({ task: 'nomination', route: EDITOR_ENTRY_ROUTE });
    expect(built.provider.previewOpen).toBe(false);
    expect(built.provider.profileComplete).toBe(false);
  });

  it('with a nomination and the store still empty the profile and the questions have no status, and nothing is complete', async () => {
    openEntity({ nominations: [NOMINATION] });
    world.dataRoot = makeScopedDataRoot();
    const built = await construct();
    cleanup = built.cleanup;

    expect(statuses(built.provider)).toEqual([
      ['nomination', 'complete'],
      ['profile', undefined],
      ['questions', undefined]
    ]);
    expect(built.provider.nextStep).toBeUndefined();
    expect(built.provider.previewOpen).toBe(false);
    expect(built.provider.taskState.known).toBe(false);
    expect(built.provider.profileComplete).toBe(false);
  });

  it('counts the unanswered required info questions on the profile, which is the next step, and the questions by their own count', async () => {
    openEntity({ nominations: [NOMINATION] });
    world.dataRoot = makeScopedDataRoot();
    world.userData = makeUserData({ type: 'candidate', answered: ['q-candidate'] });
    const built = await construct();
    cleanup = built.cleanup;

    expect(built.provider.tasks).toEqual([
      { id: 'nomination', status: 'complete', route: NOMINATION_TASK_ROUTE },
      { id: 'profile', status: 'incomplete', route: { route: 'ContestantAppProfile' }, count: 1 },
      {
        id: 'questions',
        status: 'incomplete',
        route: { route: 'ContestantAppQuestions' },
        count: 1,
        resume: { route: 'ContestantAppQuestion', questionId: 'q-any' }
      }
    ]);
    expect(built.provider.nextStep).toEqual({ task: 'profile', route: { route: 'ContestantAppProfile' } });
    expect(built.provider.previewOpen).toBe(false);
    expect(built.provider.profileComplete).toBe(false);
  });

  it.each([
    ['another id', { type: 'candidate', id: OTHER_ID }],
    ['the same id under the other type', { type: 'organization', id: ENTITY_ID }]
  ] as const)(
    'gives the profile and the questions no status while the store holds an entity of %s than the route names',
    async (_label, stored) => {
      openEntity({ nominations: [NOMINATION] });
      world.dataRoot = makeScopedDataRoot();
      world.userData = makeUserData({
        type: stored.type,
        answered: ['q-candidate', 'q-organization', 'q-any', 'q-info'],
        entity: { id: stored.id }
      });
      const built = await construct();
      cleanup = built.cleanup;

      // The lists are those of the stored entity, and every question of them is answered.
      expect(built.provider.questionsReady).toBe(true);
      expect(built.provider.unansweredOpinionQuestions).toEqual([]);
      expect(statuses(built.provider)).toEqual([
        ['nomination', 'complete'],
        ['profile', undefined],
        ['questions', undefined]
      ]);
      expect(built.provider.previewOpen).toBe(false);
      expect(built.provider.profileComplete).toBe(false);
    }
  );

  it('follows the saved answers without a load: the statuses, the next step, the preview and what complete means', async () => {
    let userData = $state.raw<FakeUserData | undefined>(makeUserData({ type: 'candidate' }));
    Object.defineProperty(world, 'userData', { get: () => userData, configurable: true });
    openEntity({ nominations: [NOMINATION] });
    world.dataRoot = makeScopedDataRoot();
    const built = await construct();
    cleanup = built.cleanup;
    expect(built.provider.nextStep?.task).toBe('profile');

    userData = makeUserData({ type: 'candidate', answered: ['q-info'] });
    flushSync();
    expect(statuses(built.provider)).toEqual([
      ['nomination', 'complete'],
      ['profile', 'complete'],
      ['questions', 'incomplete']
    ]);
    expect(built.provider.nextStep).toEqual({ task: 'questions', route: { route: 'ContestantAppQuestions' } });
    expect(built.provider.previewOpen).toBe(false);
    expect(built.provider.profileComplete).toBe(false);

    userData = makeUserData({ type: 'candidate', answered: ['q-info', 'q-candidate', 'q-any'] });
    flushSync();
    expect(statuses(built.provider)).toEqual([
      ['nomination', 'complete'],
      ['profile', 'complete'],
      ['questions', 'complete']
    ]);
    expect(built.provider.nextStep).toBeUndefined();
    expect(built.provider.previewOpen).toBe(true);
    expect(built.provider.taskState.allComplete).toBe(true);
    expect(built.provider.profileComplete).toBe(true);
  });

  it.each([
    ['every question it is asked answered', ['q-info', 'q-candidate', 'q-any']],
    ['one question it is asked answered', ['q-candidate']],
    ['nothing answered', []]
  ])(
    'counts no stored answer to a question the entity is not asked: the task state and what complete means are the same with %s',
    async (_label, answered) => {
      // `q-organization` is a question of the data root that a candidate is not asked, and `q-gone` is no question of the data root: the question of an election the entity is no longer nominated in.
      const NOT_ASKED = ['q-organization', 'q-gone'];
      let userData = $state.raw<FakeUserData | undefined>(makeUserData({ type: 'candidate', answered }));
      Object.defineProperty(world, 'userData', { get: () => userData, configurable: true });
      openEntity({ nominations: [NOMINATION] });
      world.dataRoot = makeScopedDataRoot();
      const built = await construct();
      cleanup = built.cleanup;
      const stateBefore = built.provider.taskState;
      const completeBefore = built.provider.profileComplete;
      expect(stateBefore.known).toBe(true);

      userData = makeUserData({ type: 'candidate', answered: [...answered, ...NOT_ASKED] });
      flushSync();

      expect(built.provider.taskState).toEqual(stateBefore);
      expect(built.provider.profileComplete).toBe(completeBefore);
      expect(ids(built.provider.opinionQuestions)).toEqual(['q-candidate', 'q-any']);
      expect(ids(built.provider.unansweredOpinionQuestions)).toEqual(
        ['q-candidate', 'q-any'].filter((id) => !answered.includes(id))
      );
    }
  );

  it.each([
    ['a route that names no entity', {}],
    ['a route that names an entity the list does not hold', { entityType: 'candidate', entityId: OTHER_ID }]
  ])('has no task and no next step on %s', async (_label, params) => {
    openEntity({ nominations: [NOMINATION] });
    pageBox.page = { data: pageBox.page.data, params };
    world.dataRoot = makeScopedDataRoot();
    world.userData = makeUserData({ type: 'candidate', answered: ['q-info', 'q-candidate', 'q-any'] });
    const built = await construct();
    cleanup = built.cleanup;

    expect(built.provider.tasks).toEqual([]);
    expect(built.provider.nextStep).toBeUndefined();
    expect(built.provider.previewOpen).toBe(false);
    expect(built.provider.profileComplete).toBe(false);
  });

  it('exposes the parts of one state: the tasks, the next step and the preview are its own members', async () => {
    openEntity({ nominations: [NOMINATION] });
    world.dataRoot = makeScopedDataRoot();
    world.userData = makeUserData({ type: 'candidate' });
    const built = await construct();
    cleanup = built.cleanup;

    const state = built.provider.taskState;
    expect(state.tasks.length).toBe(3);
    expect(built.provider.tasks).toBe(state.tasks);
    expect(built.provider.nextStep).toBe(state.nextStep);
    expect(built.provider.previewOpen).toBe(state.previewOpen);
    expect(built.provider.profileComplete).toBe(state.allComplete);
  });
});

describe('contestantContext — the user-level accessors derived from page data', () => {
  const USER: BasicUserData = {
    id: 'user-1',
    email: 'user@example.test',
    username: 'user@example.test',
    role: 'contestant',
    settings: {},
    termsOfUseAccepted: '2026-10-06T00:54:12.277826+00:00',
    passwordSet: true,
    addressState: 'proved',
    pendingEmail: null,
    ownOrganizationUnnamed: false,
    pendingEmailTaken: false
  };
  /** One id shared by an entity of each type, as the independent primary keys of the entity tables allow. */
  const SHARED_ID = '3f2b8c1e-9a4d-4e6f-8b7a-0c1d2e3f4a5b';
  const CANDIDATE: UserEntity = { type: 'candidate', id: SHARED_ID, firstName: 'A', lastName: 'B', confirmed: true };
  const ORGANIZATION: UserEntity = { type: 'organization', id: SHARED_ID, name: 'Org', confirmed: true };
  const OTHER_CANDIDATE: UserEntity = {
    type: 'candidate',
    id: 'other-id',
    firstName: 'C',
    lastName: 'D',
    confirmed: true
  };

  type Seen = {
    user: BasicUserData | undefined;
    entities: ReadonlyArray<UserEntity>;
    selectedEntity: UserEntity | undefined;
    homeRoute: string;
    isAuthenticated: boolean;
  };

  let cleanup: (() => void) | undefined;

  afterEach(() => {
    cleanup?.();
    cleanup = undefined;
    resetWorld();
  });

  /**
   * Construct the real provider over `page` and record what a consumer reading `ctx.X` inside an effect sees, once at the start and again after every change that reaches it.
   * @param page - The page the context derives from. Pass a `$state` object to change it afterwards.
   * @returns Every reading the consumer made, the latest last.
   */
  async function observe(page: FakePage): Promise<Array<Seen>> {
    pageBox.page = page;
    const { ContestantContextProvider } = await import('./contestantContext.svelte');
    const seen: Array<Seen> = [];
    cleanup = $effect.root(() => {
      const provider = new ContestantContextProvider();
      $effect(() => {
        seen.push({
          user: provider.user,
          entities: provider.entities,
          selectedEntity: provider.selectedEntity,
          homeRoute: provider.homeRoute,
          isAuthenticated: provider.isAuthenticated
        });
      });
    });
    flushSync();
    return seen;
  }

  it('are empty when the page data holds no user and no list, as on a page outside the protected tree', async () => {
    const seen = await observe({ data: {}, params: { entityType: 'candidate', entityId: SHARED_ID } });

    expect(seen).toHaveLength(1);
    expect(seen[0].user).toBeUndefined();
    expect(seen[0].entities).toEqual([]);
    expect(seen[0].selectedEntity).toBeUndefined();
  });

  it('are empty for a gated load, which carries the user and no list', async () => {
    const seen = await observe({ data: { gate: 'termsOfUse', user: USER }, params: {} });

    expect(seen[0].user).toEqual(USER);
    expect(seen[0].entities).toEqual([]);
    expect(seen[0].selectedEntity).toBeUndefined();
  });

  it('reflect the page data, and follow it when a navigation replaces it', async () => {
    const page = $state<FakePage>({ data: {}, params: {} });
    const seen = await observe(page);

    page.data = { user: USER, entities: [CANDIDATE, ORGANIZATION] };
    flushSync();

    expect(seen.at(-1)?.user).toEqual(USER);
    expect(seen.at(-1)?.entities).toEqual([CANDIDATE, ORGANIZATION]);

    page.data = {};
    flushSync();

    expect(seen.at(-1)?.user).toBeUndefined();
    expect(seen.at(-1)?.entities).toEqual([]);
    // Two pages without a list answer with the same array, so a consumer is not told of a change that did not happen.
    expect(seen.at(-1)?.entities).toBe(seen[0].entities);
  });

  it.each([
    ['candidate', CANDIDATE],
    ['organization', ORGANIZATION]
  ] as const)(
    'selects the %s when two entities share an id, matching the type and the id together',
    async (entityType, expected) => {
      const seen = await observe({
        data: { user: USER, entities: [OTHER_CANDIDATE, ORGANIZATION, CANDIDATE] },
        params: { entityType, entityId: SHARED_ID }
      });

      expect(seen[0].selectedEntity).toEqual(expected);
    }
  );

  it('selects nothing for an id listed under the other type only', async () => {
    const seen = await observe({
      data: { user: USER, entities: [ORGANIZATION, OTHER_CANDIDATE] },
      params: { entityType: 'candidate', entityId: SHARED_ID }
    });

    expect(seen[0].selectedEntity).toBeUndefined();
  });

  it.each([
    ['no entity params', {}],
    ['the type alone', { entityType: 'candidate' }],
    ['the id alone', { entityId: SHARED_ID }],
    ['an entity that is not in the list', { entityType: 'candidate', entityId: 'unlisted-id' }]
  ])('selects nothing with %s', async (_label, params) => {
    const seen = await observe({ data: { user: USER, entities: [CANDIDATE, ORGANIZATION] }, params });

    expect(seen[0].selectedEntity).toBeUndefined();
  });

  it('follows the route params from one entity to the other, and to a page that names none', async () => {
    const page = $state<FakePage>({
      data: { user: USER, entities: [CANDIDATE, ORGANIZATION] },
      params: { entityType: 'candidate', entityId: SHARED_ID }
    });
    const seen = await observe(page);
    expect(seen.at(-1)?.selectedEntity).toEqual(CANDIDATE);

    page.params = { entityType: 'organization', entityId: SHARED_ID };
    flushSync();
    expect(seen.at(-1)?.selectedEntity).toEqual(ORGANIZATION);

    page.params = {};
    flushSync();
    expect(seen.at(-1)?.selectedEntity).toBeUndefined();
  });

  it.each([
    ['a route that names no entity', {}],
    ['a route that carries only the type', { entityType: 'candidate' }],
    ['a route that carries only the id', { entityId: SHARED_ID }]
  ])('leads home to the app root on %s', async (_, params) => {
    const seen = await observe({ data: { user: USER, entities: [CANDIDATE] }, params });
    expect(seen.at(-1)?.homeRoute).toBe('/route/ContestantAppHome');
  });

  it('leads home to the entity home on a route that names an entity, whether or not the list holds it', async () => {
    const listed = await observe({
      data: { user: USER, entities: [CANDIDATE] },
      params: { entityType: 'candidate', entityId: SHARED_ID }
    });
    expect(listed.at(-1)?.homeRoute).toBe('/route/ContestantAppEntityHome');
    cleanup?.();

    const unlisted = await observe({
      data: { user: USER, entities: [] },
      params: { entityType: 'organization', entityId: 'unlisted-id' }
    });
    expect(unlisted.at(-1)?.selectedEntity).toBeUndefined();
    expect(unlisted.at(-1)?.homeRoute).toBe('/route/ContestantAppEntityHome');
  });

  it('follows the route params from the app root into an entity and back out', async () => {
    const page = $state<FakePage>({ data: { user: USER, entities: [CANDIDATE] }, params: {} });
    const seen = await observe(page);
    expect(seen.at(-1)?.homeRoute).toBe('/route/ContestantAppHome');

    page.params = { entityType: 'candidate', entityId: SHARED_ID };
    flushSync();
    expect(seen.at(-1)?.homeRoute).toBe('/route/ContestantAppEntityHome');

    page.params = {};
    flushSync();
    expect(seen.at(-1)?.homeRoute).toBe('/route/ContestantAppHome');
  });

  it('reads isAuthenticated live, so a sign-in and a sign-out reach a consumer while the context stays mounted', async () => {
    const page = $state<FakePage>({ data: {}, params: {} });
    const seen = await observe(page);
    expect(seen.at(-1)?.isAuthenticated).toBe(false);

    page.data = { session: { expires_at: 1893456000 } };
    flushSync();
    expect(seen.at(-1)?.isAuthenticated).toBe(true);

    page.data = { session: null };
    flushSync();
    expect(seen.at(-1)?.isAuthenticated).toBe(false);
  });
});

describe('contestantContext — the calls on the nominations of the entity the route names', () => {
  const ORGANIZATION_ID = '5a0e6c7d-2b1f-4c3a-9d8e-7f6a5b4c3d2e';
  const ORGANIZATION: UserEntity = { type: 'organization', id: ORGANIZATION_ID, name: 'Org', confirmed: true };
  const CONTESTS = [{ electionId: ELECTION.id, constituencyId: CONSTITUENCY.id }];
  const NOMINATIONS = [
    { electionId: ELECTION.id, constituencyId: CONSTITUENCY.id, electionSymbol: '7', parent: { kind: 'none' as const } }
  ];
  /** The nominations the set is computed from, which the context hands the writer as they are. */
  const READ_FROM: Array<EntityNomination> = [
    {
      id: 'nomination-1',
      electionId: ELECTION.id,
      electionName: 'Election',
      constituencyId: CONSTITUENCY.id,
      constituencyName: 'Constituency',
      electionRound: 1,
      electionSymbol: '6',
      confirmed: true,
      customData: null,
      updatedAt: '2026-10-01T12:00:00+00:00'
    }
  ];

  let cleanup: (() => void) | undefined;

  afterEach(() => {
    cleanup?.();
    cleanup = undefined;
    writerBox.writer = undefined;
    resetWorld();
  });

  /** A writer whose two nomination methods record what they are called with and answer what a test gives them. */
  function fakeWriter({ saved, options }: { saved?: unknown; options?: unknown } = {}) {
    const writer = {
      setEntityNominations: vi.fn(async () => saved),
      getNominationParentOptions: vi.fn(async () => options)
    };
    writerBox.writer = writer;
    return writer;
  }

  it('setEntityNominations writes the set for the entity the route names and answers what the writer answers', async () => {
    const saved = { type: 'saved', inserted: 1, updated: 0, deleted: 0, unchanged: 0, parentsCreated: 0 };
    const writer = fakeWriter({ saved });
    pageBox.page = {
      data: { entities: [ORGANIZATION] },
      params: { entityType: 'organization', entityId: ORGANIZATION_ID }
    };
    const constructed = await construct();
    cleanup = constructed.cleanup;

    await expect(constructed.provider.setEntityNominations(NOMINATIONS, READ_FROM)).resolves.toBe(saved);

    expect(writer.setEntityNominations).toHaveBeenCalledTimes(1);
    expect(writer.setEntityNominations).toHaveBeenCalledWith({
      target: { type: 'organization', id: ORGANIZATION_ID },
      nominations: NOMINATIONS,
      readFrom: READ_FROM
    });
    expect(writer.getNominationParentOptions).not.toHaveBeenCalled();
  });

  it('getNominationParentOptions asks for the entity the route names, in the locale of the application', async () => {
    const options = [{ entity: { type: 'alliance', id: 'alliance-1', name: 'Alliance' }, nominatedIn: [] }];
    const writer = fakeWriter({ options });
    pageBox.page = {
      data: { entities: [ORGANIZATION] },
      params: { entityType: 'organization', entityId: ORGANIZATION_ID }
    };
    const constructed = await construct();
    cleanup = constructed.cleanup;

    await expect(constructed.provider.getNominationParentOptions(CONTESTS)).resolves.toBe(options);

    expect(writer.getNominationParentOptions).toHaveBeenCalledTimes(1);
    expect(writer.getNominationParentOptions).toHaveBeenCalledWith({
      target: { type: 'organization', id: ORGANIZATION_ID },
      contests: CONTESTS,
      locale: 'en'
    });
    expect(writer.setEntityNominations).not.toHaveBeenCalled();
  });

  it('each reads the selected entity when it is called, so a call follows the route to another entity', async () => {
    const OTHER_ID = '9c8b7a6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d';
    const OTHER: UserEntity = { type: 'candidate', id: OTHER_ID, firstName: 'A', lastName: 'B', confirmed: false };
    const writer = fakeWriter();
    const page = $state<FakePage>({
      data: { entities: [ORGANIZATION, OTHER] },
      params: { entityType: 'organization', entityId: ORGANIZATION_ID }
    });
    pageBox.page = page;
    const constructed = await construct();
    cleanup = constructed.cleanup;
    // Taken off the context once, as a page does with a stable function.
    const { getNominationParentOptions, setEntityNominations } = constructed.provider;

    page.params = { entityType: 'candidate', entityId: OTHER_ID };
    flushSync();
    await setEntityNominations(NOMINATIONS, READ_FROM);
    await getNominationParentOptions(CONTESTS);

    expect(writer.setEntityNominations).toHaveBeenCalledWith({
      target: { type: 'candidate', id: OTHER_ID },
      nominations: NOMINATIONS,
      readFrom: READ_FROM
    });
    expect(writer.getNominationParentOptions).toHaveBeenCalledWith({
      target: { type: 'candidate', id: OTHER_ID },
      contests: CONTESTS,
      locale: 'en'
    });
  });

  it('each rejects, and no writer is called, on a route that names no entity the user is listed with', async () => {
    const writer = fakeWriter();
    pageBox.page = {
      data: { entities: [ORGANIZATION] },
      params: { entityType: 'candidate', entityId: ORGANIZATION_ID }
    };
    const constructed = await construct();
    cleanup = constructed.cleanup;

    await expect(constructed.provider.setEntityNominations(NOMINATIONS, READ_FROM)).rejects.toThrow(/names no entity/);
    await expect(constructed.provider.getNominationParentOptions(CONTESTS)).rejects.toThrow(/names no entity/);

    expect(writer.setEntityNominations).not.toHaveBeenCalled();
    expect(writer.getNominationParentOptions).not.toHaveBeenCalled();
  });
});

describe('contestantContext — the entry flow', () => {
  /** The moment the fake clock starts at. */
  const START = Date.UTC(2030, 0, 1, 12, 0, 0);
  const WAIT_MS = RESEND_WAIT_SECONDS * 1000;
  const ADDRESS = 'entry-flow-case@example.org';
  const OTHER_ADDRESS = 'entry-flow-other@example.org';
  const CODE = 'ENTRY-FLOW-CODE';

  let cleanups: Array<() => void> = [];

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(START);
  });

  afterEach(() => {
    for (const cleanup of cleanups) cleanup();
    cleanups = [];
    writerBox.writer = undefined;
    resetWorld();
    vi.useRealTimers();
  });

  /** A writer whose calls record what they are given. Each link request answers what `answer` returns, a fulfilled success unless a test says otherwise. */
  function fakeWriter(answer: () => Promise<unknown> = async () => ({ type: 'success' })) {
    const writer = {
      checkInvitationCode: vi.fn(async () => 'valid'),
      requestSignInLink: vi.fn((_opts: unknown) => answer()),
      requestPasswordRecovery: vi.fn((_opts: unknown) => answer()),
      logout: vi.fn(async () => undefined)
    };
    writerBox.writer = writer;
    return writer;
  }

  /** Construct a provider that is torn down with the test. */
  async function provide(): Promise<ContestantContextProvider> {
    const constructed = await construct();
    cleanups.push(constructed.cleanup);
    return constructed.provider;
  }

  /** Every string the page could have kept the flow in, outside the context's memory. */
  function everythingOutsideMemory(): string {
    const stored = [localStorage, sessionStorage].flatMap((storage) =>
      Array.from({ length: storage.length }, (_, index) => {
        const key = storage.key(index) ?? '';
        return `${key}=${storage.getItem(key)}`;
      })
    );
    return [...stored, document.cookie, window.location.href, JSON.stringify(window.history.state)].join('\n');
  }

  describe('the state', () => {
    it('is `undefined` on a new context', async () => {
      fakeWriter();
      const provider = await provide();

      expect(provider.entryFlow).toBeUndefined();
    });

    it('is held by one instance alone: a second context holds none of it', async () => {
      fakeWriter();
      const first = await provide();
      const second = await provide();

      first.holdEntryCode({ code: CODE, status: 'valid' });
      await first.sendEntryLink({ origin: 'registerEmail', email: ADDRESS, code: CODE });

      expect(first.entryFlow?.code).toEqual({ code: CODE, status: 'valid' });
      expect(first.entryFlow?.request?.email).toBe(ADDRESS);
      expect(second.entryFlow).toBeUndefined();
    });

    it('is in no web storage, cookie, URL or history state', async () => {
      fakeWriter();
      const provider = await provide();
      const before = everythingOutsideMemory();

      provider.holdEntryCode({ code: CODE, status: 'used' });
      await provider.sendEntryLink({ origin: 'registerEmail', email: ADDRESS, code: CODE });

      const after = everythingOutsideMemory();
      expect(provider.entryFlow?.request?.code).toBe(CODE);
      expect(after).toBe(before);
      expect(after).not.toContain(CODE);
      expect(after).not.toContain(ADDRESS);
    });

    it('reaches an effect that reads it off the context', async () => {
      fakeWriter();
      const provider = await provide();
      const seen = new Array<string | undefined>();
      cleanups.push(
        $effect.root(() => {
          $effect(() => {
            seen.push(provider.entryFlow?.code?.status);
          });
        })
      );
      flushSync();

      provider.holdEntryCode({ code: CODE, status: 'used' });
      flushSync();
      provider.clearEntryFlow();
      flushSync();

      expect(seen).toEqual([undefined, 'used', undefined]);
    });
  });

  describe('holdEntryCode', () => {
    it('holds the code with its status', async () => {
      fakeWriter();
      const provider = await provide();

      provider.holdEntryCode({ code: CODE, status: 'valid' });

      expect(provider.entryFlow).toStrictEqual({ code: { code: CODE, status: 'valid' } });
    });

    it('removes a held request', async () => {
      fakeWriter();
      const provider = await provide();
      await provider.sendEntryLink({ origin: 'signIn', email: ADDRESS });
      expect(provider.entryFlow?.request).toBeDefined();

      provider.holdEntryCode({ code: CODE, status: 'used' });

      expect(provider.entryFlow).toStrictEqual({ code: { code: CODE, status: 'used' } });
    });
  });

  describe('the three calls the flow makes', () => {
    it('forwards each to the writer with what it was given and answers what the writer answers', async () => {
      const writer = fakeWriter();
      const provider = await provide();
      // Taken off the context once, as a page does with a stable function.
      const { checkInvitationCode, requestPasswordRecovery, requestSignInLink } = provider;

      await expect(checkInvitationCode({ code: CODE })).resolves.toBe('valid');
      await expect(requestSignInLink({ email: ADDRESS, locale: 'fi' })).resolves.toEqual({ type: 'success' });
      await expect(requestPasswordRecovery({ email: ADDRESS, locale: 'fi' })).resolves.toEqual({ type: 'success' });

      expect(writer.checkInvitationCode.mock.calls).toEqual([[{ code: CODE }]]);
      expect(writer.requestSignInLink.mock.calls).toEqual([[{ email: ADDRESS, locale: 'fi' }]]);
      expect(writer.requestPasswordRecovery.mock.calls).toEqual([[{ email: ADDRESS, locale: 'fi' }]]);
    });

    it('hold nothing: a direct call leaves the flow as it was', async () => {
      fakeWriter();
      const provider = await provide();

      await provider.requestSignInLink({ email: ADDRESS, locale: 'en' });
      await provider.requestPasswordRecovery({ email: ADDRESS, locale: 'en' });
      await provider.checkInvitationCode({ code: CODE });

      expect(provider.entryFlow).toBeUndefined();
    });
  });

  describe('sendEntryLink — which request is made', () => {
    it('asks for a sign-in link with the address and the context’s locale, and no code, from the sign-in form', async () => {
      const writer = fakeWriter();
      const provider = await provide();

      await provider.sendEntryLink({ origin: 'signIn', email: ADDRESS });

      expect(writer.requestSignInLink).toHaveBeenCalledTimes(1);
      expect(writer.requestSignInLink.mock.calls[0][0]).toStrictEqual({ email: ADDRESS, locale: 'en' });
      expect(writer.requestPasswordRecovery).not.toHaveBeenCalled();
    });

    it('passes the address and the code from the screen that takes the address for a valid code', async () => {
      const writer = fakeWriter();
      const provider = await provide();

      await provider.sendEntryLink({ origin: 'registerEmail', email: ADDRESS, code: CODE });

      expect(writer.requestSignInLink).toHaveBeenCalledTimes(1);
      expect(writer.requestSignInLink.mock.calls[0][0]).toStrictEqual({ email: ADDRESS, code: CODE, locale: 'en' });
    });

    it('passes the code and no address from the screen that signs in the holder of a used code', async () => {
      const writer = fakeWriter();
      const provider = await provide();

      await provider.sendEntryLink({ origin: 'registerSignIn', code: CODE });

      expect(writer.requestSignInLink).toHaveBeenCalledTimes(1);
      expect(writer.requestSignInLink.mock.calls[0][0]).toStrictEqual({ code: CODE, locale: 'en' });
    });

    it('asks for a password-recovery link, and for no sign-in link, from the forgot-password page', async () => {
      const writer = fakeWriter();
      const provider = await provide();

      await provider.sendEntryLink({ origin: 'forgotPassword', email: ADDRESS });

      expect(writer.requestPasswordRecovery).toHaveBeenCalledTimes(1);
      expect(writer.requestPasswordRecovery.mock.calls[0][0]).toStrictEqual({ email: ADDRESS, locale: 'en' });
      expect(writer.requestSignInLink).not.toHaveBeenCalled();
    });

    it('acts on its context when it was taken off it', async () => {
      const writer = fakeWriter();
      const provider = await provide();
      const { sendEntryLink } = provider;

      await sendEntryLink({ origin: 'register', email: ADDRESS });

      expect(writer.requestSignInLink).toHaveBeenCalledTimes(1);
      expect(provider.entryFlow?.request?.origin).toBe('register');
    });
  });

  describe('sendEntryLink — what its caller and the state learn', () => {
    /** The held request without the one member that is a time. */
    function heldWithoutTime(provider: ContestantContextProvider): Record<string, unknown> {
      const { settledAt: _settledAt, ...rest } = provider.entryFlow?.request ?? { settledAt: 0 };
      return rest;
    }

    it('resolves to nothing and holds the request with its wording and the time it settled when the request fulfils', async () => {
      fakeWriter(async () => ({ type: 'success', somethingOfTheAnswer: 'kept nowhere' }));
      const provider = await provide();
      vi.setSystemTime(START + 250);

      await expect(provider.sendEntryLink({ origin: 'signIn', email: ADDRESS })).resolves.toBeUndefined();

      expect(provider.entryFlow).toStrictEqual({
        request: { origin: 'signIn', email: ADDRESS, wording: 'signIn', settledAt: START + 250, askedAgain: false }
      });
    });

    it('resolves to nothing and holds the same when the request rejects', async () => {
      fakeWriter(async () => {
        throw new Error('a failed request');
      });
      const provider = await provide();

      await expect(provider.sendEntryLink({ origin: 'signIn', email: ADDRESS })).resolves.toBeUndefined();

      expect(provider.entryFlow).toStrictEqual({
        request: { origin: 'signIn', email: ADDRESS, wording: 'signIn', settledAt: START, askedAgain: false }
      });
    });

    it('resolves to nothing and holds the same when the writer throws before it returns a promise', async () => {
      const writer = fakeWriter();
      writer.requestSignInLink.mockImplementation(() => {
        throw new Error('a writer that throws at the call');
      });
      const provider = await provide();

      await expect(provider.sendEntryLink({ origin: 'signIn', email: ADDRESS })).resolves.toBeUndefined();

      expect(heldWithoutTime(provider)).toStrictEqual({
        origin: 'signIn',
        email: ADDRESS,
        wording: 'signIn',
        askedAgain: false
      });
    });

    it('resolves at the ten-second bound, and not before, when the request neither fulfils nor rejects', async () => {
      fakeWriter(() => new Promise(() => undefined));
      const provider = await provide();
      let resolved = false;

      const sent = provider.sendEntryLink({ origin: 'signIn', email: ADDRESS }).then(() => {
        resolved = true;
      });
      await vi.advanceTimersByTimeAsync(LINK_REQUEST_SETTLE_BOUND_MS - 1);
      expect(resolved).toBe(false);
      expect(provider.entryFlow).toBeUndefined();

      await vi.advanceTimersByTimeAsync(1);
      await sent;

      expect(resolved).toBe(true);
      expect(provider.entryFlow).toStrictEqual({
        request: {
          origin: 'signIn',
          email: ADDRESS,
          wording: 'signIn',
          settledAt: START + LINK_REQUEST_SETTLE_BOUND_MS,
          askedAgain: false
        }
      });
    });

    it('holds nothing that tells a fulfilled request from a rejected one or from one that never answered', async () => {
      const request = { origin: 'forgotPassword', email: ADDRESS } as const;

      fakeWriter(async () => ({ type: 'success' }));
      const fulfilled = await provide();
      await fulfilled.sendEntryLink(request);

      fakeWriter(async () => {
        throw new Error('a failed request');
      });
      const rejected = await provide();
      await rejected.sendEntryLink(request);

      fakeWriter(() => new Promise(() => undefined));
      const unanswered = await provide();
      const sent = unanswered.sendEntryLink(request);
      await vi.advanceTimersByTimeAsync(LINK_REQUEST_SETTLE_BOUND_MS);
      await sent;

      const expected = { origin: 'forgotPassword', email: ADDRESS, wording: 'recovery', askedAgain: false };
      expect(heldWithoutTime(fulfilled)).toStrictEqual(expected);
      expect(heldWithoutTime(rejected)).toStrictEqual(expected);
      expect(heldWithoutTime(unanswered)).toStrictEqual(expected);
    });

    it('holds the wording of the screen the request was made from', async () => {
      fakeWriter();
      const provider = await provide();

      await provider.sendEntryLink({ origin: 'registerSignIn', code: CODE });
      expect(provider.entryFlow?.request?.wording).toBe('code');

      await provider.sendEntryLink({ origin: 'forgotPassword', email: OTHER_ADDRESS });
      expect(provider.entryFlow?.request?.wording).toBe('recovery');

      await provider.sendEntryLink({ origin: 'registerEmail', email: ADDRESS, code: CODE });
      expect(provider.entryFlow?.request?.wording).toBe('signIn');
    });
  });

  describe('sendEntryLink — the held code', () => {
    it('keeps the held code beside a request made with it', async () => {
      fakeWriter();
      const provider = await provide();
      provider.holdEntryCode({ code: CODE, status: 'valid' });

      await provider.sendEntryLink({ origin: 'registerEmail', email: ADDRESS, code: CODE });

      expect(provider.entryFlow).toStrictEqual({
        code: { code: CODE, status: 'valid' },
        request: {
          origin: 'registerEmail',
          email: ADDRESS,
          code: CODE,
          wording: 'signIn',
          settledAt: START,
          askedAgain: false
        }
      });
    });

    it('replaces the whole flow, a held code included, with a request made without a code', async () => {
      fakeWriter();
      const provider = await provide();
      provider.holdEntryCode({ code: CODE, status: 'used' });

      await provider.sendEntryLink({ origin: 'signIn', email: ADDRESS });

      expect(provider.entryFlow?.code).toBeUndefined();
      expect(provider.entryFlow?.request?.email).toBe(ADDRESS);
    });
  });

  describe('sendEntryLink — a request asked again', () => {
    it('marks a second request for the same address made less than the wait after the first settled', async () => {
      fakeWriter();
      const provider = await provide();
      await provider.sendEntryLink({ origin: 'signIn', email: ADDRESS });
      expect(provider.entryFlow?.request?.askedAgain).toBe(false);

      vi.setSystemTime(START + WAIT_MS - 1);
      await provider.sendEntryLink({ origin: 'forgotPassword', email: ` ${ADDRESS.toUpperCase()} ` });

      expect(provider.entryFlow?.request?.askedAgain).toBe(true);
      expect(provider.entryFlow?.request?.settledAt).toBe(START + WAIT_MS - 1);
    });

    it('does not mark a second request for the same address made once the wait has passed', async () => {
      fakeWriter();
      const provider = await provide();
      await provider.sendEntryLink({ origin: 'signIn', email: ADDRESS });

      vi.setSystemTime(START + WAIT_MS);
      await provider.sendEntryLink({ origin: 'signIn', email: ADDRESS });

      expect(provider.entryFlow?.request?.askedAgain).toBe(false);
    });

    it('does not mark a request for another address', async () => {
      fakeWriter();
      const provider = await provide();
      await provider.sendEntryLink({ origin: 'signIn', email: ADDRESS });

      vi.setSystemTime(START + 5_000);
      await provider.sendEntryLink({ origin: 'signIn', email: OTHER_ADDRESS });

      expect(provider.entryFlow?.request?.askedAgain).toBe(false);
    });

    it('marks a second request with the same code made inside the wait', async () => {
      fakeWriter();
      const provider = await provide();
      provider.holdEntryCode({ code: CODE, status: 'valid' });
      await provider.sendEntryLink({ origin: 'registerEmail', email: ADDRESS, code: CODE });

      vi.setSystemTime(START + 20_000);
      await provider.sendEntryLink({ origin: 'registerEmail', email: OTHER_ADDRESS, code: CODE });

      expect(provider.entryFlow?.request?.askedAgain).toBe(true);
    });

    it('judges it from the time the first request settled, not from when it was made', async () => {
      let answer: (() => void) | undefined;
      fakeWriter(
        () =>
          new Promise<void>((resolve) => {
            answer = resolve;
          })
      );
      const provider = await provide();
      const first = provider.sendEntryLink({ origin: 'signIn', email: ADDRESS });
      await vi.advanceTimersByTimeAsync(4_000);
      answer?.();
      await first;
      expect(provider.entryFlow?.request?.settledAt).toBe(START + 4_000);

      // The wait after the first request was made has passed here, and the wait after it settled has not.
      vi.setSystemTime(START + WAIT_MS + 1_000);
      const second = provider.sendEntryLink({ origin: 'signIn', email: ADDRESS });
      answer?.();
      await second;

      expect(provider.entryFlow?.request?.askedAgain).toBe(true);
    });
  });

  describe('resendEntryLink', () => {
    it('repeats the held sign-in request through the same writer call and records a new settlement time', async () => {
      const writer = fakeWriter();
      const provider = await provide();
      provider.holdEntryCode({ code: CODE, status: 'valid' });
      await provider.sendEntryLink({ origin: 'registerEmail', email: ADDRESS, code: CODE });

      vi.setSystemTime(START + WAIT_MS + 2_000);
      await expect(provider.resendEntryLink()).resolves.toBeUndefined();

      expect(writer.requestSignInLink).toHaveBeenCalledTimes(2);
      expect(writer.requestSignInLink.mock.calls[1][0]).toStrictEqual(writer.requestSignInLink.mock.calls[0][0]);
      expect(writer.requestPasswordRecovery).not.toHaveBeenCalled();
      expect(provider.entryFlow).toStrictEqual({
        code: { code: CODE, status: 'valid' },
        request: {
          origin: 'registerEmail',
          email: ADDRESS,
          code: CODE,
          wording: 'signIn',
          settledAt: START + WAIT_MS + 2_000,
          askedAgain: false
        }
      });
    });

    it('repeats a held recovery request as a recovery request', async () => {
      const writer = fakeWriter();
      const provider = await provide();
      await provider.sendEntryLink({ origin: 'forgotPassword', email: ADDRESS });

      vi.setSystemTime(START + WAIT_MS);
      await provider.resendEntryLink();

      expect(writer.requestPasswordRecovery).toHaveBeenCalledTimes(2);
      expect(writer.requestPasswordRecovery.mock.calls[1][0]).toStrictEqual({ email: ADDRESS, locale: 'en' });
      expect(writer.requestSignInLink).not.toHaveBeenCalled();
      expect(provider.entryFlow?.request?.wording).toBe('recovery');
    });

    it('resolves alike, with a new settlement time, when the repeated request rejects', async () => {
      let fail = false;
      fakeWriter(async () => {
        if (fail) throw new Error('a failed request');
        return { type: 'success' };
      });
      const provider = await provide();
      await provider.sendEntryLink({ origin: 'signIn', email: ADDRESS });

      fail = true;
      vi.setSystemTime(START + WAIT_MS + 500);
      await expect(provider.resendEntryLink()).resolves.toBeUndefined();

      expect(provider.entryFlow?.request).toStrictEqual({
        origin: 'signIn',
        email: ADDRESS,
        wording: 'signIn',
        settledAt: START + WAIT_MS + 500,
        askedAgain: false
      });
    });

    it('does nothing when no request is held', async () => {
      const writer = fakeWriter();
      const provider = await provide();
      provider.holdEntryCode({ code: CODE, status: 'valid' });

      await expect(provider.resendEntryLink()).resolves.toBeUndefined();

      expect(writer.requestSignInLink).not.toHaveBeenCalled();
      expect(writer.requestPasswordRecovery).not.toHaveBeenCalled();
      expect(provider.entryFlow).toStrictEqual({ code: { code: CODE, status: 'valid' } });
    });
  });

  describe('the end of the flow', () => {
    it('`clearEntryFlow()` forgets the code and the request', async () => {
      fakeWriter();
      const provider = await provide();
      provider.holdEntryCode({ code: CODE, status: 'valid' });
      await provider.sendEntryLink({ origin: 'registerEmail', email: ADDRESS, code: CODE });
      expect(provider.entryFlow).toBeDefined();

      provider.clearEntryFlow();

      expect(provider.entryFlow).toBeUndefined();
    });

    it('a logout forgets the code and the request', async () => {
      const writer = fakeWriter();
      const provider = await provide();
      provider.holdEntryCode({ code: CODE, status: 'used' });
      await provider.sendEntryLink({ origin: 'registerSignIn', code: CODE });
      expect(provider.entryFlow).toBeDefined();

      await provider.logout();

      expect(writer.logout).toHaveBeenCalledTimes(1);
      expect(provider.entryFlow).toBeUndefined();
    });
  });
});
