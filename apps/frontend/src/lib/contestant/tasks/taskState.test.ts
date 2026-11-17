import { describe, expect, it } from 'vitest';
import {
  hasNomination,
  homeAction,
  nominationsSaveAction,
  nominationsSaveTarget,
  nominationsViewTarget,
  previewOpenOf,
  profileSaveTarget,
  questionSaveTarget,
  questionsResumeRoute,
  taskLabelKey,
  taskStateOf
} from './taskState';
import { unansweredQuestionsOf } from './unanswered';
import type {
  ContinueTarget,
  HomeAction,
  NominationsDraftFacts,
  NominationsSaveAction,
  NominationsViewFacts,
  NominationsViewTarget,
  PreviewOpenInput,
  Task,
  TaskId,
  TaskLabelKey,
  TaskRoute,
  TaskState,
  TaskStateInput,
  TaskStatus
} from './taskState';
import type { SavedAnswers } from './unanswered';

/**
 * The contract of `taskState.ts`, as one case table per function. The module imports nothing, so this file loads the test runner and that module, with two exceptions: the cases on answers outside the applicable set take their counts from the real `unansweredQuestionsOf`, and the last test loads the directory's barrel.
 *
 * What the tables state, in full:
 *
 * - `taskStateOf` decides in a fixed order: an unknown entity has no task; an entity with no nomination has an incomplete nomination task and blocked profile and questions tasks, whatever the question inputs hold; an entity with a nomination whose question lists are not loaded has two tasks with no status; only then are the counts read.
 * - Where the nomination task of an entity with no nomination leads follows one input: the editor's entry while the editor would let the entity in, and the nominations view otherwise. The task's label follows where it leads. That input changes nothing else, and nothing at all for an entity that is not known or has a nomination.
 * - A stored answer to a question the entity is not asked changes no count, and so no state.
 * - Nothing is decided from a count that was not loaded: while the state is not known there is no next step, the preview is closed and nothing is "all complete", also when every count is zero.
 * - The questions task is never blocked by an incomplete profile. It is left out only when the lists are loaded and hold no opinion question, and the preview then opens on the required info alone.
 * - A missing required name leaves the profile incomplete and does not close the preview.
 * - The next step is the first incomplete task in the order nomination, profile, questions. The questions task leads to the questions list and carries the first unanswered question beside it.
 * - Each button that continues from a page has one function over the state. The question page's also takes what the page read before the save, because the state read after the save no longer tells whether the saved question had been unanswered. The nominations view's also takes whether the view offers an entry to the editor, because the state does not tell whether any election admits the entity: with no nomination it leads into the editor only where an entry is offered, and never back to itself.
 * - The nomination editor's button has a second function, for what it says before the press: it reads the state as it stands and three facts of the draft, and says "continue" exactly where the press leads on. Every card removed returns whatever the state holds; with a card kept or new, an entity that had no nomination and a state that is not known both continue.
 * - Every function returns fresh objects and changes nothing it was handed.
 */

const NOMINATIONS: TaskRoute = { route: 'ContestantAppNominations' };
const EDITOR_ENTRY: TaskRoute = { route: 'ContestantAppNominationElections' };
const PROFILE: TaskRoute = { route: 'ContestantAppProfile' };
const QUESTIONS_LIST: TaskRoute = { route: 'ContestantAppQuestions' };
const HOME: TaskRoute = { route: 'ContestantAppEntityHome' };
const PREVIEW: TaskRoute = { route: 'ContestantAppPreview' };

/** The route of one question. */
function question(questionId: string): TaskRoute {
  return { route: 'ContestantAppQuestion', questionId };
}

/** Build an input, defaulting the parts a case does not care about to an entity with a nomination, nominations that cannot be edited, loaded lists, four opinion questions and nothing left to do. */
function input(overrides: Partial<TaskStateInput> = {}): TaskStateInput {
  return {
    entityKnown: true,
    hasNomination: true,
    nominationEntryOffered: false,
    questionsReady: true,
    unansweredRequiredInfoCount: 0,
    requiredNameMissing: false,
    opinionCount: 4,
    unansweredOpinionCount: 0,
    firstUnansweredOpinionId: undefined,
    ...overrides
  };
}

const NOMINATION_COMPLETE: Task = { id: 'nomination', status: 'complete', route: NOMINATIONS };
const PROFILE_COMPLETE: Task = { id: 'profile', status: 'complete', route: PROFILE };
const QUESTIONS_COMPLETE: Task = { id: 'questions', status: 'complete', route: QUESTIONS_LIST };

/** The state of an entity nothing is known of. */
const ENTITY_NOT_KNOWN: TaskState = {
  tasks: [],
  nextStep: undefined,
  previewOpen: false,
  known: false,
  allComplete: false
};

/** The state of an entity with no nomination while nominations cannot be edited. */
const NO_NOMINATION: TaskState = {
  tasks: [
    { id: 'nomination', status: 'incomplete', route: NOMINATIONS },
    { id: 'profile', status: 'blocked', route: PROFILE },
    { id: 'questions', status: 'blocked', route: QUESTIONS_LIST }
  ],
  nextStep: { task: 'nomination', route: NOMINATIONS },
  previewOpen: false,
  known: true,
  allComplete: false
};

/** The state of an entity with no nomination while nominations can be edited: the nomination task and the next step lead to the editor's entry. */
const NO_NOMINATION_EDITABLE: TaskState = {
  tasks: [
    { id: 'nomination', status: 'incomplete', route: EDITOR_ENTRY },
    { id: 'profile', status: 'blocked', route: PROFILE },
    { id: 'questions', status: 'blocked', route: QUESTIONS_LIST }
  ],
  nextStep: { task: 'nomination', route: EDITOR_ENTRY },
  previewOpen: false,
  known: true,
  allComplete: false
};

/** The state of an entity with a nomination whose question lists are not loaded. */
const LISTS_NOT_LOADED: TaskState = {
  tasks: [
    NOMINATION_COMPLETE,
    { id: 'profile', status: undefined, route: PROFILE },
    { id: 'questions', status: undefined, route: QUESTIONS_LIST }
  ],
  nextStep: undefined,
  previewOpen: false,
  known: false,
  allComplete: false
};

/** The state of an entity with nothing left to do. */
const ALL_COMPLETE: TaskState = {
  tasks: [NOMINATION_COMPLETE, PROFILE_COMPLETE, QUESTIONS_COMPLETE],
  nextStep: undefined,
  previewOpen: true,
  known: true,
  allComplete: true
};

////////////////////////////////////////////////////////////////////
// The case tables
////////////////////////////////////////////////////////////////////

type TaskStateCase = {
  title: string;
  input: TaskStateInput;
  expected: TaskState;
};

const TASK_STATE_CASES: Array<TaskStateCase> = [
  // The entity is not known.
  {
    title: 'the entity is not known',
    input: input({ entityKnown: false }),
    expected: ENTITY_NOT_KNOWN
  },
  {
    title: 'the entity is not known, whatever the other inputs hold',
    input: input({
      entityKnown: false,
      hasNomination: true,
      questionsReady: true,
      unansweredRequiredInfoCount: 3,
      unansweredOpinionCount: 2,
      firstUnansweredOpinionId: 'q-3'
    }),
    expected: ENTITY_NOT_KNOWN
  },

  // No nomination: one answer, whatever the question inputs hold.
  {
    title: 'no nomination',
    input: input({ hasNomination: false, questionsReady: false, opinionCount: 0 }),
    expected: NO_NOMINATION
  },
  {
    title: 'no nomination, with every count at zero and the lists said to be loaded',
    input: input({ hasNomination: false, questionsReady: true }),
    expected: NO_NOMINATION
  },
  {
    title: 'no nomination, with counts above zero and a first unanswered question',
    input: input({
      hasNomination: false,
      questionsReady: true,
      unansweredRequiredInfoCount: 3,
      unansweredOpinionCount: 2,
      firstUnansweredOpinionId: 'q-3'
    }),
    expected: NO_NOMINATION
  },
  {
    title: 'no nomination, with counts above zero and the lists not loaded',
    input: input({
      hasNomination: false,
      questionsReady: false,
      unansweredRequiredInfoCount: 3,
      unansweredOpinionCount: 2,
      firstUnansweredOpinionId: 'q-3'
    }),
    expected: NO_NOMINATION
  },
  {
    title: 'no nomination and no opinion question: the questions task is blocked, not left out',
    input: input({ hasNomination: false, questionsReady: true, opinionCount: 0 }),
    expected: NO_NOMINATION
  },
  {
    title: 'no nomination and a required name missing',
    input: input({ hasNomination: false, questionsReady: false, requiredNameMissing: true }),
    expected: NO_NOMINATION
  },

  // No nomination, while nominations can be edited: the nomination task leads to the editor's entry.
  {
    title: 'no nomination, and nominations can be edited',
    input: input({ hasNomination: false, nominationEntryOffered: true, questionsReady: false, opinionCount: 0 }),
    expected: NO_NOMINATION_EDITABLE
  },
  {
    title: 'no nomination, nominations can be edited, with counts above zero and the lists said to be loaded',
    input: input({
      hasNomination: false,
      nominationEntryOffered: true,
      questionsReady: true,
      unansweredRequiredInfoCount: 3,
      unansweredOpinionCount: 2,
      firstUnansweredOpinionId: 'q-3'
    }),
    expected: NO_NOMINATION_EDITABLE
  },

  // The entity is not known, or has a nomination: whether nominations can be edited changes nothing.
  {
    title: 'the entity is not known, and nominations can be edited',
    input: input({ entityKnown: false, nominationEntryOffered: true }),
    expected: ENTITY_NOT_KNOWN
  },
  {
    title: 'a nomination and nothing left to do, and nominations can be edited',
    input: input({ nominationEntryOffered: true }),
    expected: ALL_COMPLETE
  },

  // A nomination, the question lists not loaded.
  {
    title: 'a nomination, the lists not loaded, counts above zero',
    input: input({
      questionsReady: false,
      unansweredRequiredInfoCount: 3,
      unansweredOpinionCount: 2,
      firstUnansweredOpinionId: 'q-3'
    }),
    expected: LISTS_NOT_LOADED
  },
  {
    title: 'a nomination, the lists not loaded, every count at zero: nothing is complete',
    input: input({ questionsReady: false }),
    expected: LISTS_NOT_LOADED
  },
  {
    title: 'a nomination, the lists not loaded, no opinion question counted: the questions task is not left out',
    input: input({ questionsReady: false, opinionCount: 0 }),
    expected: LISTS_NOT_LOADED
  },
  {
    title: 'a nomination, the lists not loaded, a required name missing',
    input: input({ questionsReady: false, requiredNameMissing: true }),
    expected: LISTS_NOT_LOADED
  },

  // The lists are loaded.
  {
    title: 'required info unanswered and opinions unanswered',
    input: input({ unansweredRequiredInfoCount: 3, unansweredOpinionCount: 2, firstUnansweredOpinionId: 'q-3' }),
    expected: {
      tasks: [
        NOMINATION_COMPLETE,
        { id: 'profile', status: 'incomplete', route: PROFILE, count: 3 },
        { id: 'questions', status: 'incomplete', route: QUESTIONS_LIST, count: 2, resume: question('q-3') }
      ],
      nextStep: { task: 'profile', route: PROFILE },
      previewOpen: false,
      known: true,
      allComplete: false
    }
  },
  {
    title: 'required info unanswered and a required name missing: the count is the questions alone',
    input: input({ unansweredRequiredInfoCount: 1, requiredNameMissing: true }),
    expected: {
      tasks: [
        NOMINATION_COMPLETE,
        { id: 'profile', status: 'incomplete', route: PROFILE, count: 1 },
        QUESTIONS_COMPLETE
      ],
      nextStep: { task: 'profile', route: PROFILE },
      previewOpen: false,
      known: true,
      allComplete: false
    }
  },
  {
    title: 'required info answered, a required name missing, an opinion unanswered: the preview is closed',
    input: input({ requiredNameMissing: true, unansweredOpinionCount: 1, firstUnansweredOpinionId: 'q-4' }),
    expected: {
      tasks: [
        NOMINATION_COMPLETE,
        { id: 'profile', status: 'incomplete', route: PROFILE },
        { id: 'questions', status: 'incomplete', route: QUESTIONS_LIST, count: 1, resume: question('q-4') }
      ],
      nextStep: { task: 'profile', route: PROFILE },
      previewOpen: false,
      known: true,
      allComplete: false
    }
  },
  {
    title: 'required info answered, a required name missing, no opinion unanswered: the preview is open',
    input: input({ requiredNameMissing: true }),
    expected: {
      tasks: [NOMINATION_COMPLETE, { id: 'profile', status: 'incomplete', route: PROFILE }, QUESTIONS_COMPLETE],
      nextStep: { task: 'profile', route: PROFILE },
      previewOpen: true,
      known: true,
      allComplete: false
    }
  },
  {
    title: 'the profile complete and opinions unanswered: the next step is the questions',
    input: input({ unansweredOpinionCount: 2, firstUnansweredOpinionId: 'q-3' }),
    expected: {
      tasks: [
        NOMINATION_COMPLETE,
        PROFILE_COMPLETE,
        { id: 'questions', status: 'incomplete', route: QUESTIONS_LIST, count: 2, resume: question('q-3') }
      ],
      nextStep: { task: 'questions', route: QUESTIONS_LIST },
      previewOpen: false,
      known: true,
      allComplete: false
    }
  },
  {
    title: 'required info unanswered and no opinion unanswered: the preview is closed',
    input: input({ unansweredRequiredInfoCount: 2 }),
    expected: {
      tasks: [
        NOMINATION_COMPLETE,
        { id: 'profile', status: 'incomplete', route: PROFILE, count: 2 },
        QUESTIONS_COMPLETE
      ],
      nextStep: { task: 'profile', route: PROFILE },
      previewOpen: false,
      known: true,
      allComplete: false
    }
  },
  {
    title: 'nothing unanswered',
    input: input(),
    expected: ALL_COMPLETE
  },

  // The lists are loaded and hold no opinion question.
  {
    title: 'no opinion question, required info answered: two tasks, the preview open',
    input: input({ opinionCount: 0 }),
    expected: {
      tasks: [NOMINATION_COMPLETE, PROFILE_COMPLETE],
      nextStep: undefined,
      previewOpen: true,
      known: true,
      allComplete: true
    }
  },
  {
    title: 'no opinion question, required info unanswered: two tasks, the preview closed',
    input: input({ opinionCount: 0, unansweredRequiredInfoCount: 2 }),
    expected: {
      tasks: [NOMINATION_COMPLETE, { id: 'profile', status: 'incomplete', route: PROFILE, count: 2 }],
      nextStep: { task: 'profile', route: PROFILE },
      previewOpen: false,
      known: true,
      allComplete: false
    }
  },
  {
    title: 'no opinion question, a required name missing: two tasks, the preview open, not all complete',
    input: input({ opinionCount: 0, requiredNameMissing: true }),
    expected: {
      tasks: [NOMINATION_COMPLETE, { id: 'profile', status: 'incomplete', route: PROFILE }],
      nextStep: { task: 'profile', route: PROFILE },
      previewOpen: true,
      known: true,
      allComplete: false
    }
  }
];

type HasNominationCase = {
  title: string;
  nominations: ReadonlyArray<unknown> | null | undefined;
  expected: boolean;
};

const HAS_NOMINATION_CASES: Array<HasNominationCase> = [
  { title: 'no list (undefined)', nominations: undefined, expected: false },
  { title: 'no list (null)', nominations: null, expected: false },
  { title: 'an empty list', nominations: [], expected: false },
  { title: 'a list of one', nominations: [{ confirmed: false }], expected: true },
  { title: 'a list of two', nominations: [{ confirmed: true }, { confirmed: false }], expected: true }
];

type PreviewOpenCase = {
  title: string;
  facts: PreviewOpenInput;
  expected: boolean;
};

const PREVIEW_OPEN_CASES: Array<PreviewOpenCase> = [
  {
    title: 'a nomination and nothing unanswered',
    facts: { hasNomination: true, unansweredRequiredInfoCount: 0, unansweredOpinionCount: 0 },
    expected: true
  },
  {
    title: 'no nomination and nothing unanswered',
    facts: { hasNomination: false, unansweredRequiredInfoCount: 0, unansweredOpinionCount: 0 },
    expected: false
  },
  {
    title: 'a required info question unanswered',
    facts: { hasNomination: true, unansweredRequiredInfoCount: 1, unansweredOpinionCount: 0 },
    expected: false
  },
  {
    title: 'an opinion question unanswered',
    facts: { hasNomination: true, unansweredRequiredInfoCount: 0, unansweredOpinionCount: 1 },
    expected: false
  },
  {
    title: 'both unanswered',
    facts: { hasNomination: true, unansweredRequiredInfoCount: 2, unansweredOpinionCount: 3 },
    expected: false
  }
];

type TaskLabelCase = {
  id: TaskId;
  status: TaskStatus | undefined;
  route: TaskRoute;
  answersLocked: boolean;
  expected: TaskLabelKey;
};

const TASK_LABEL_CASES: Array<TaskLabelCase> = [
  // The nomination: "enter" while it is incomplete and leads into the editor, "view" once it is complete or while it leads to the nominations view, with or without the answers lock.
  {
    id: 'nomination',
    status: undefined,
    route: EDITOR_ENTRY,
    answersLocked: false,
    expected: 'contestantApp.home.nomination.enter'
  },
  {
    id: 'nomination',
    status: 'incomplete',
    route: EDITOR_ENTRY,
    answersLocked: false,
    expected: 'contestantApp.home.nomination.enter'
  },
  {
    id: 'nomination',
    status: 'complete',
    route: NOMINATIONS,
    answersLocked: false,
    expected: 'contestantApp.home.nomination.view'
  },
  {
    id: 'nomination',
    status: undefined,
    route: EDITOR_ENTRY,
    answersLocked: true,
    expected: 'contestantApp.home.nomination.enter'
  },
  {
    id: 'nomination',
    status: 'incomplete',
    route: EDITOR_ENTRY,
    answersLocked: true,
    expected: 'contestantApp.home.nomination.enter'
  },
  {
    id: 'nomination',
    status: 'complete',
    route: NOMINATIONS,
    answersLocked: true,
    expected: 'contestantApp.home.nomination.view'
  },

  {
    id: 'nomination',
    status: 'incomplete',
    route: NOMINATIONS,
    answersLocked: false,
    expected: 'contestantApp.home.nomination.view'
  },
  {
    id: 'nomination',
    status: 'incomplete',
    route: NOMINATIONS,
    answersLocked: true,
    expected: 'contestantApp.home.nomination.view'
  },

  // The profile: "enter" while incomplete, blocked or without a status, "edit" once complete, "view" under the answers lock.
  {
    id: 'profile',
    status: undefined,
    route: PROFILE,
    answersLocked: false,
    expected: 'contestantApp.home.basicInfo.enter'
  },
  {
    id: 'profile',
    status: 'incomplete',
    route: PROFILE,
    answersLocked: false,
    expected: 'contestantApp.home.basicInfo.enter'
  },
  {
    id: 'profile',
    status: 'blocked',
    route: PROFILE,
    answersLocked: false,
    expected: 'contestantApp.home.basicInfo.enter'
  },
  {
    id: 'profile',
    status: 'complete',
    route: PROFILE,
    answersLocked: false,
    expected: 'contestantApp.home.basicInfo.edit'
  },
  {
    id: 'profile',
    status: undefined,
    route: PROFILE,
    answersLocked: true,
    expected: 'contestantApp.home.basicInfo.view'
  },
  {
    id: 'profile',
    status: 'incomplete',
    route: PROFILE,
    answersLocked: true,
    expected: 'contestantApp.home.basicInfo.view'
  },
  {
    id: 'profile',
    status: 'blocked',
    route: PROFILE,
    answersLocked: true,
    expected: 'contestantApp.home.basicInfo.view'
  },
  {
    id: 'profile',
    status: 'complete',
    route: PROFILE,
    answersLocked: true,
    expected: 'contestantApp.home.basicInfo.view'
  },

  // The questions: as the profile.
  {
    id: 'questions',
    status: undefined,
    route: QUESTIONS_LIST,
    answersLocked: false,
    expected: 'contestantApp.home.questions.enter'
  },
  {
    id: 'questions',
    status: 'incomplete',
    route: QUESTIONS_LIST,
    answersLocked: false,
    expected: 'contestantApp.home.questions.enter'
  },
  {
    id: 'questions',
    status: 'blocked',
    route: QUESTIONS_LIST,
    answersLocked: false,
    expected: 'contestantApp.home.questions.enter'
  },
  {
    id: 'questions',
    status: 'complete',
    route: QUESTIONS_LIST,
    answersLocked: false,
    expected: 'contestantApp.home.questions.edit'
  },
  {
    id: 'questions',
    status: undefined,
    route: QUESTIONS_LIST,
    answersLocked: true,
    expected: 'contestantApp.home.questions.view'
  },
  {
    id: 'questions',
    status: 'incomplete',
    route: QUESTIONS_LIST,
    answersLocked: true,
    expected: 'contestantApp.home.questions.view'
  },
  {
    id: 'questions',
    status: 'blocked',
    route: QUESTIONS_LIST,
    answersLocked: true,
    expected: 'contestantApp.home.questions.view'
  },
  {
    id: 'questions',
    status: 'complete',
    route: QUESTIONS_LIST,
    answersLocked: true,
    expected: 'contestantApp.home.questions.view'
  }
];

type HomeActionCase = {
  title: string;
  input: TaskStateInput;
  expected: HomeAction;
};

const HOME_ACTION_CASES: Array<HomeActionCase> = [
  { title: 'the entity is not known', input: input({ entityKnown: false }), expected: { kind: 'pending' } },
  {
    title: 'a nomination and the lists not loaded',
    input: input({ questionsReady: false }),
    expected: { kind: 'pending' }
  },
  {
    title: 'no nomination',
    input: input({ hasNomination: false, questionsReady: false }),
    expected: { kind: 'task', task: 'nomination', route: NOMINATIONS }
  },
  {
    title: 'no nomination, and nominations can be edited',
    input: input({ hasNomination: false, nominationEntryOffered: true, questionsReady: false }),
    expected: { kind: 'task', task: 'nomination', route: EDITOR_ENTRY }
  },
  {
    title: 'the profile incomplete, with opinions unanswered too',
    input: input({ unansweredRequiredInfoCount: 3, unansweredOpinionCount: 2, firstUnansweredOpinionId: 'q-3' }),
    expected: { kind: 'task', task: 'profile', route: PROFILE }
  },
  {
    title: 'the profile lacking only its required name',
    input: input({ requiredNameMissing: true }),
    expected: { kind: 'task', task: 'profile', route: PROFILE }
  },
  {
    title: 'only the questions incomplete',
    input: input({ unansweredOpinionCount: 2, firstUnansweredOpinionId: 'q-3' }),
    expected: { kind: 'task', task: 'questions', route: QUESTIONS_LIST }
  },
  { title: 'everything complete', input: input(), expected: { kind: 'preview', route: PREVIEW } },
  {
    title: 'everything complete for an entity that is asked no opinion question',
    input: input({ opinionCount: 0 }),
    expected: { kind: 'preview', route: PREVIEW }
  }
];

type ContinueCase = {
  title: string;
  input: TaskStateInput;
  expected: ContinueTarget;
};

const PROFILE_SAVE_CASES: Array<ContinueCase> = [
  {
    title: 'the next step is the questions',
    input: input({ unansweredOpinionCount: 2, firstUnansweredOpinionId: 'q-3' }),
    expected: { route: QUESTIONS_LIST, continues: true }
  },
  {
    title: 'the profile is still incomplete',
    input: input({ unansweredRequiredInfoCount: 1, unansweredOpinionCount: 2, firstUnansweredOpinionId: 'q-3' }),
    expected: { route: HOME, continues: false }
  },
  {
    title: 'the profile still lacks its required name',
    input: input({ requiredNameMissing: true, unansweredOpinionCount: 2, firstUnansweredOpinionId: 'q-3' }),
    expected: { route: HOME, continues: false }
  },
  { title: 'everything is complete', input: input(), expected: { route: HOME, continues: false } },
  {
    title: 'the profile is complete and the entity is asked no opinion question',
    input: input({ opinionCount: 0 }),
    expected: { route: HOME, continues: false }
  },
  {
    title: 'the lists are not loaded',
    input: input({ questionsReady: false }),
    expected: { route: HOME, continues: false }
  },
  {
    title: 'the entity is not known',
    input: input({ entityKnown: false }),
    expected: { route: HOME, continues: false }
  },
  {
    title: 'the entity has no nomination',
    input: input({ hasNomination: false, questionsReady: false }),
    expected: { route: HOME, continues: false }
  }
];

type QuestionSaveCase = ContinueCase & {
  /** Whether the saved question had no answer before the save. */
  wasUnanswered: boolean;
};

const QUESTION_SAVE_CASES: Array<QuestionSaveCase> = [
  // A question is still unanswered after the save: on to the first unanswered one.
  {
    title: 'a question is unanswered and the profile is complete',
    input: input({ unansweredOpinionCount: 2, firstUnansweredOpinionId: 'q-3' }),
    wasUnanswered: true,
    expected: { route: question('q-3'), continues: true }
  },
  {
    title: 'a question is unanswered and the profile is incomplete',
    input: input({ unansweredRequiredInfoCount: 3, unansweredOpinionCount: 2, firstUnansweredOpinionId: 'q-3' }),
    wasUnanswered: true,
    expected: { route: question('q-3'), continues: true }
  },
  {
    title: 'a question is unanswered and the one saved was already answered',
    input: input({ unansweredOpinionCount: 2, firstUnansweredOpinionId: 'q-3' }),
    wasUnanswered: false,
    expected: { route: question('q-3'), continues: true }
  },
  {
    title: 'exactly one question is left unanswered: that question, not the home',
    input: input({ unansweredOpinionCount: 1, firstUnansweredOpinionId: 'q-4' }),
    wasUnanswered: true,
    expected: { route: question('q-4'), continues: true }
  },

  // None is left and the save answered the last one: on to the first incomplete task, or home.
  {
    title: 'none is unanswered, the one saved was unanswered, the profile is incomplete',
    input: input({ unansweredRequiredInfoCount: 3 }),
    wasUnanswered: true,
    expected: { route: PROFILE, continues: true }
  },
  {
    title: 'none is unanswered, the one saved was unanswered, the profile lacks only its required name',
    input: input({ requiredNameMissing: true }),
    wasUnanswered: true,
    expected: { route: PROFILE, continues: true }
  },
  {
    title: 'none is unanswered, the one saved was unanswered, everything is complete',
    input: input(),
    wasUnanswered: true,
    expected: { route: HOME, continues: true }
  },

  // None is left and the save edited an answer: back to the questions list.
  {
    title: 'none is unanswered and the one saved was already answered',
    input: input(),
    wasUnanswered: false,
    expected: { route: QUESTIONS_LIST, continues: false }
  },
  {
    title: 'none is unanswered, the one saved was already answered, a next step exists: an edit does not lead on',
    input: input({ hasNomination: false, questionsReady: false }),
    wasUnanswered: false,
    expected: { route: QUESTIONS_LIST, continues: false }
  },

  // The state is not known: nothing is decided from it.
  {
    title: 'the lists are not loaded and the one saved was unanswered',
    input: input({ questionsReady: false }),
    wasUnanswered: true,
    expected: { route: QUESTIONS_LIST, continues: false }
  },
  {
    title: 'the lists are not loaded and the one saved was already answered',
    input: input({ questionsReady: false }),
    wasUnanswered: false,
    expected: { route: QUESTIONS_LIST, continues: false }
  }
];

type NominationsViewCase = {
  title: string;
  input: TaskStateInput;
  facts: NominationsViewFacts;
  expected: NominationsViewTarget | undefined;
};

/** The view offers an entry to the editor, and the view offers none. */
const ENTRY_OFFERED: NominationsViewFacts = { entryOffered: true };
const NO_ENTRY_OFFERED: NominationsViewFacts = { entryOffered: false };

const RETURN_HOME: NominationsViewTarget = { route: HOME, continues: false, action: 'return' };

const NOMINATIONS_VIEW_CASES: Array<NominationsViewCase> = [
  // No nomination: into the editor only where the view offers an entry and the nomination task leads there.
  {
    title: 'no nomination, nominations can be edited and an entry is offered: into the editor',
    input: input({ hasNomination: false, nominationEntryOffered: true, questionsReady: false }),
    facts: ENTRY_OFFERED,
    expected: { route: EDITOR_ENTRY, continues: true, action: 'define' }
  },
  {
    title: 'no nomination, an entry offered, with counts above zero: into the editor',
    input: input({
      hasNomination: false,
      nominationEntryOffered: true,
      questionsReady: true,
      unansweredRequiredInfoCount: 3,
      unansweredOpinionCount: 2,
      firstUnansweredOpinionId: 'q-3'
    }),
    facts: ENTRY_OFFERED,
    expected: { route: EDITOR_ENTRY, continues: true, action: 'define' }
  },
  {
    title:
      'no nomination, nominations can be edited and no entry is offered, as where no election admits the entity: home',
    input: input({ hasNomination: false, nominationEntryOffered: true, questionsReady: false }),
    facts: NO_ENTRY_OFFERED,
    expected: RETURN_HOME
  },
  {
    title: 'no nomination and nominations cannot be edited: home',
    input: input({ hasNomination: false, questionsReady: false }),
    facts: NO_ENTRY_OFFERED,
    expected: RETURN_HOME
  },
  {
    title: 'no nomination, an entry said to be offered while the nomination task leads to the view: home',
    input: input({ hasNomination: false, questionsReady: false }),
    facts: ENTRY_OFFERED,
    expected: RETURN_HOME
  },

  // The state is not known: nothing, whatever the fact.
  {
    title: 'a nomination and the lists not loaded',
    input: input({ questionsReady: false }),
    facts: NO_ENTRY_OFFERED,
    expected: undefined
  },
  {
    title: 'a nomination and the lists not loaded, an entry offered',
    input: input({ questionsReady: false, nominationEntryOffered: true }),
    facts: ENTRY_OFFERED,
    expected: undefined
  },
  {
    title: 'the entity is not known',
    input: input({ entityKnown: false }),
    facts: NO_ENTRY_OFFERED,
    expected: undefined
  },
  {
    title: 'the entity is not known, an entry offered',
    input: input({ entityKnown: false, nominationEntryOffered: true }),
    facts: ENTRY_OFFERED,
    expected: undefined
  },

  // A nomination: the next step, or home, whatever the fact.
  {
    title: 'the next step is the profile',
    input: input({ unansweredRequiredInfoCount: 3, unansweredOpinionCount: 2, firstUnansweredOpinionId: 'q-3' }),
    facts: NO_ENTRY_OFFERED,
    expected: { route: PROFILE, continues: true, action: 'continue' }
  },
  {
    title: 'the next step is the profile, an entry offered',
    input: input({
      nominationEntryOffered: true,
      unansweredRequiredInfoCount: 3,
      unansweredOpinionCount: 2,
      firstUnansweredOpinionId: 'q-3'
    }),
    facts: ENTRY_OFFERED,
    expected: { route: PROFILE, continues: true, action: 'continue' }
  },
  {
    title: 'the next step is the questions',
    input: input({ unansweredOpinionCount: 2, firstUnansweredOpinionId: 'q-3' }),
    facts: NO_ENTRY_OFFERED,
    expected: { route: QUESTIONS_LIST, continues: true, action: 'continue' }
  },
  { title: 'everything is complete', input: input(), facts: NO_ENTRY_OFFERED, expected: RETURN_HOME },
  {
    title: 'everything is complete, an entry offered',
    input: input({ nominationEntryOffered: true }),
    facts: ENTRY_OFFERED,
    expected: RETURN_HOME
  },
  {
    title: 'everything is complete for an entity that is asked no opinion question',
    input: input({ opinionCount: 0 }),
    facts: NO_ENTRY_OFFERED,
    expected: RETURN_HOME
  }
];

type NominationsSaveCase = {
  title: string;
  input: TaskStateInput;
  expected: ContinueTarget;
};

const NOMINATIONS_SAVE_CASES: Array<NominationsSaveCase> = [
  {
    title: 'the save left the entity with no nomination',
    input: input({ hasNomination: false, questionsReady: false }),
    expected: { route: HOME, continues: false }
  },
  {
    title: 'no nomination, with counts above zero',
    input: input({
      hasNomination: false,
      questionsReady: true,
      unansweredRequiredInfoCount: 3,
      unansweredOpinionCount: 2,
      firstUnansweredOpinionId: 'q-3'
    }),
    expected: { route: HOME, continues: false }
  },
  {
    title: "no nomination and the next step is the editor's entry: home, and never back into the editor",
    input: input({ hasNomination: false, nominationEntryOffered: true, questionsReady: false }),
    expected: { route: HOME, continues: false }
  },
  {
    title: 'the next step is the profile',
    input: input({ unansweredRequiredInfoCount: 3, unansweredOpinionCount: 2, firstUnansweredOpinionId: 'q-3' }),
    expected: { route: PROFILE, continues: true }
  },
  {
    title: 'the next step is the profile for a missing name alone',
    input: input({ requiredNameMissing: true }),
    expected: { route: PROFILE, continues: true }
  },
  {
    title: 'the next step is the questions, which leads to their list and not to a question',
    input: input({ unansweredOpinionCount: 2, firstUnansweredOpinionId: 'q-3' }),
    expected: { route: QUESTIONS_LIST, continues: true }
  },
  { title: 'everything is complete', input: input(), expected: { route: HOME, continues: false } },
  {
    title: 'everything is complete for an entity that is asked no opinion question',
    input: input({ opinionCount: 0 }),
    expected: { route: HOME, continues: false }
  },
  {
    title: 'a nomination and the lists not loaded: the state is not known',
    input: input({ questionsReady: false }),
    expected: { route: HOME, continues: false }
  },
  {
    title: 'the entity is not known',
    input: input({ entityKnown: false }),
    expected: { route: HOME, continues: false }
  }
];

type ResumeCase = {
  title: string;
  input: TaskStateInput;
  expected: TaskRoute | undefined;
};

const QUESTIONS_RESUME_CASES: Array<ResumeCase> = [
  {
    title: 'a question is unanswered',
    input: input({ unansweredOpinionCount: 2, firstUnansweredOpinionId: 'q-3' }),
    expected: question('q-3')
  },
  {
    title: 'a question is unanswered and the profile is incomplete',
    input: input({ unansweredRequiredInfoCount: 3, unansweredOpinionCount: 2, firstUnansweredOpinionId: 'q-3' }),
    expected: question('q-3')
  },
  { title: 'no question is unanswered', input: input(), expected: undefined },
  {
    title: 'no question is unanswered, whatever first question is named',
    input: input({ unansweredOpinionCount: 0, firstUnansweredOpinionId: 'q-3' }),
    expected: undefined
  },
  { title: 'the entity is asked no opinion question', input: input({ opinionCount: 0 }), expected: undefined },
  {
    title: 'the lists are not loaded, whatever first question is named',
    input: input({ questionsReady: false, unansweredOpinionCount: 2, firstUnansweredOpinionId: 'q-3' }),
    expected: undefined
  },
  {
    title: 'the entity has no nomination, whatever first question is named',
    input: input({ hasNomination: false, unansweredOpinionCount: 2, firstUnansweredOpinionId: 'q-3' }),
    expected: undefined
  }
];

////////////////////////////////////////////////////////////////////
// Helpers of the tests
////////////////////////////////////////////////////////////////////

/** A draft that equals what is stored, for an entity that had a nomination. */
const DRAFT_AS_STORED: NominationsDraftFacts = { somethingToWrite: false, anyKeptOrNew: true, hadNomination: true };
/** A draft that changes, adds or removes something and keeps at least one card, for an entity that had a nomination. */
const DRAFT_CHANGED: NominationsDraftFacts = { somethingToWrite: true, anyKeptOrNew: true, hadNomination: true };
/** A draft in which every card is about to be removed. */
const DRAFT_ALL_REMOVED: NominationsDraftFacts = { somethingToWrite: true, anyKeptOrNew: false, hadNomination: true };
/** The draft of an entity that had no nomination: its cards are new. */
const DRAFT_FIRST: NominationsDraftFacts = { somethingToWrite: true, anyKeptOrNew: true, hadNomination: false };

const CONTINUE: NominationsSaveAction = { labelKey: 'common.continue', action: 'continue' };
const RETURN: NominationsSaveAction = { labelKey: 'common.return', action: 'return' };
const SAVE_AND_CONTINUE: NominationsSaveAction = { labelKey: 'common.saveAndContinue', action: 'continue' };
const SAVE_AND_RETURN: NominationsSaveAction = { labelKey: 'common.saveAndReturn', action: 'return' };

type NominationsActionCase = {
  title: string;
  input: TaskStateInput;
  draft: NominationsDraftFacts;
  expected: NominationsSaveAction;
};

const NOMINATIONS_ACTION_CASES: Array<NominationsActionCase> = [
  {
    title: 'nothing to write and the profile is the next step: Continue',
    input: input({ unansweredRequiredInfoCount: 1 }),
    draft: DRAFT_AS_STORED,
    expected: CONTINUE
  },
  {
    title: 'nothing to write and the questions are the next step: Continue',
    input: input({ unansweredOpinionCount: 2, firstUnansweredOpinionId: 'q-3' }),
    draft: DRAFT_AS_STORED,
    expected: CONTINUE
  },
  {
    title: 'nothing to write and no task is left: Return',
    input: input(),
    draft: DRAFT_AS_STORED,
    expected: RETURN
  },
  {
    title: 'nothing to write for an entity whose next step is the nomination task itself: Return',
    input: input({ hasNomination: false, questionsReady: false }),
    draft: { somethingToWrite: false, anyKeptOrNew: false, hadNomination: false },
    expected: RETURN
  },
  {
    title: 'something to write with a new card, for an entity that had no nomination: Save and Continue',
    input: input({ hasNomination: false, questionsReady: false }),
    draft: DRAFT_FIRST,
    expected: SAVE_AND_CONTINUE
  },
  {
    title: 'something to write with a card kept, and the profile is the next step: Save and Continue',
    input: input({ requiredNameMissing: true }),
    draft: DRAFT_CHANGED,
    expected: SAVE_AND_CONTINUE
  },
  {
    title: 'something to write with a card kept, and no task is left: Save and Return',
    input: input(),
    draft: DRAFT_CHANGED,
    expected: SAVE_AND_RETURN
  },
  {
    title: 'every card removed while a task is left: Save and Return',
    input: input({ unansweredRequiredInfoCount: 1 }),
    draft: DRAFT_ALL_REMOVED,
    expected: SAVE_AND_RETURN
  },
  {
    title: 'every card removed while no task is left: Save and Return',
    input: input(),
    draft: DRAFT_ALL_REMOVED,
    expected: SAVE_AND_RETURN
  },
  {
    title: 'every card removed while the state is not known: Save and Return',
    input: input({ questionsReady: false }),
    draft: DRAFT_ALL_REMOVED,
    expected: SAVE_AND_RETURN
  },
  {
    title: 'nothing to write while the state is not known, for an entity that has a nomination: Continue',
    input: input({ questionsReady: false }),
    draft: DRAFT_AS_STORED,
    expected: CONTINUE
  },
  {
    title: 'something to write with a card kept while the state is not known: Save and Continue',
    input: input({ questionsReady: false }),
    draft: DRAFT_CHANGED,
    expected: SAVE_AND_CONTINUE
  },
  {
    title: 'nothing to write while the entity is not known: Continue',
    input: input({ entityKnown: false }),
    draft: DRAFT_AS_STORED,
    expected: CONTINUE
  }
];

/** Every object reachable from a value, the value itself included, once for each place it is reached from. */
function objectsIn(value: unknown): Array<object> {
  if (typeof value !== 'object' || value === null) return [];
  return [value, ...Object.values(value).flatMap((member) => objectsIn(member))];
}

/** How many objects two values share by reference. */
function sharedObjectCount(first: unknown, second: unknown): number {
  const inFirst = new Set(objectsIn(first));
  return objectsIn(second).filter((object) => inFirst.has(object)).length;
}

/** Freeze a value and everything reachable from it, so a function that writes to what it was handed throws. */
function deepFrozen<TValue>(value: TValue): TValue {
  for (const object of objectsIn(value)) Object.freeze(object);
  return value;
}

/** Every combination of inputs over two values of each member, with the unanswered opinion count never above the opinion count. */
function everyInput(): Array<TaskStateInput> {
  const booleans = [false, true];
  const opinionCounts = [
    { opinionCount: 0, unansweredOpinionCount: 0 },
    { opinionCount: 4, unansweredOpinionCount: 0 },
    { opinionCount: 4, unansweredOpinionCount: 2 }
  ];
  const inputs: Array<TaskStateInput> = [];
  for (const entityKnown of booleans)
    for (const nominated of booleans)
      for (const nominationEntryOffered of booleans)
        for (const questionsReady of booleans)
          for (const unansweredRequiredInfoCount of [0, 3])
            for (const requiredNameMissing of booleans)
              for (const counts of opinionCounts)
                for (const firstUnansweredOpinionId of [undefined, 'q-first'])
                  inputs.push({
                    entityKnown,
                    hasNomination: nominated,
                    nominationEntryOffered,
                    questionsReady,
                    unansweredRequiredInfoCount,
                    requiredNameMissing,
                    ...counts,
                    firstUnansweredOpinionId
                  });
  return inputs;
}

/** An input that throws when a member outside the named ones is read. */
function readingOnly(base: TaskStateInput, readable: ReadonlyArray<keyof TaskStateInput>): TaskStateInput {
  return new Proxy(base, {
    get(target, member, receiver) {
      if (!readable.some((name) => name === member)) throw new Error(`${String(member)} was read`);
      return Reflect.get(target, member, receiver);
    }
  });
}

const TASK_ORDER: ReadonlyArray<TaskId> = ['nomination', 'profile', 'questions'];

////////////////////////////////////////////////////////////////////
// The tests
////////////////////////////////////////////////////////////////////

describe('taskStateOf', () => {
  it.each(TASK_STATE_CASES)('$title', ({ input: caseInput, expected }) => {
    expect(taskStateOf(caseInput)).toStrictEqual(expected);
  });

  describe('what is read before a state is decided', () => {
    const UNANSWERED = input({
      unansweredRequiredInfoCount: 3,
      requiredNameMissing: true,
      unansweredOpinionCount: 2,
      firstUnansweredOpinionId: 'q-3'
    });

    it('reads nothing but whether the entity is known, for an entity that is not', () => {
      const unknownEntity = readingOnly({ ...UNANSWERED, entityKnown: false }, ['entityKnown']);
      expect(taskStateOf(unknownEntity)).toStrictEqual(ENTITY_NOT_KNOWN);
    });

    it('reads no question input, and not whether the lists are loaded, for an entity with no nomination', () => {
      const READ = ['entityKnown', 'hasNomination', 'nominationEntryOffered'] as const;
      const noNomination = readingOnly({ ...UNANSWERED, hasNomination: false }, READ);
      expect(taskStateOf(noNomination)).toStrictEqual(NO_NOMINATION);
      const editable = readingOnly({ ...UNANSWERED, hasNomination: false, nominationEntryOffered: true }, READ);
      expect(taskStateOf(editable)).toStrictEqual(NO_NOMINATION_EDITABLE);
    });

    it('does not read whether nominations can be edited for an entity that has a nomination', () => {
      const nominated = readingOnly(
        UNANSWERED,
        (Object.keys(UNANSWERED) as Array<keyof TaskStateInput>).filter((name) => name !== 'nominationEntryOffered')
      );
      expect(taskStateOf(nominated).tasks[0]).toStrictEqual(NOMINATION_COMPLETE);
    });

    it('reads no count while the question lists are not loaded', () => {
      const listsNotLoaded = readingOnly({ ...UNANSWERED, questionsReady: false }, [
        'entityKnown',
        'hasNomination',
        'questionsReady'
      ]);
      expect(taskStateOf(listsNotLoaded)).toStrictEqual(LISTS_NOT_LOADED);
    });
  });

  describe('over every combination of inputs', () => {
    const INPUTS = everyInput();

    it('answers one state for an entity that is not known', () => {
      for (const caseInput of INPUTS.filter((i) => !i.entityKnown))
        expect(taskStateOf(caseInput)).toStrictEqual(ENTITY_NOT_KNOWN);
    });

    it('answers one state for an entity with no nomination, whatever the question inputs hold: by whether nominations can be edited, and by nothing else', () => {
      const withoutNomination = INPUTS.filter((i) => i.entityKnown && !i.hasNomination);
      expect(withoutNomination.some((i) => i.nominationEntryOffered)).toBe(true);
      expect(withoutNomination.some((i) => !i.nominationEntryOffered)).toBe(true);
      for (const caseInput of withoutNomination)
        expect(taskStateOf(caseInput)).toStrictEqual(
          caseInput.nominationEntryOffered ? NO_NOMINATION_EDITABLE : NO_NOMINATION
        );
    });

    it('answers the same state whether or not nominations can be edited, for an entity that is not known and for one that has a nomination', () => {
      const others = INPUTS.filter((i) => !i.entityKnown || i.hasNomination);
      expect(others.length).toBeGreaterThan(0);
      for (const caseInput of others)
        expect(taskStateOf({ ...caseInput, nominationEntryOffered: !caseInput.nominationEntryOffered })).toStrictEqual(
          taskStateOf(caseInput)
        );
    });

    it('decides no next step, no open preview and no completeness while the state is not known', () => {
      const notKnown = INPUTS.map((i) => taskStateOf(i)).filter((state) => !state.known);
      expect(notKnown.length).toBeGreaterThan(0);
      for (const state of notKnown) {
        expect(state.nextStep).toBeUndefined();
        expect(state.previewOpen).toBe(false);
        expect(state.allComplete).toBe(false);
        expect(state.tasks.some((task) => task.status === 'incomplete')).toBe(false);
      }
    });

    it('is known exactly when every task has a status and the entity is known', () => {
      for (const caseInput of INPUTS) {
        const state = taskStateOf(caseInput);
        const everyStatusDecided = state.tasks.every((task) => task.status !== undefined);
        expect(state.known).toBe(caseInput.entityKnown && everyStatusDecided);
      }
    });

    it('gives a blocked task and a task with no status neither a count nor a first unanswered question', () => {
      for (const caseInput of INPUTS)
        for (const task of taskStateOf(caseInput).tasks)
          if (task.status === 'blocked' || task.status === undefined) {
            expect(task).not.toHaveProperty('count');
            expect(task).not.toHaveProperty('resume');
          }
    });

    it('lists the tasks in order, and never blocks the questions for an entity with a nomination', () => {
      for (const caseInput of INPUTS) {
        const state = taskStateOf(caseInput);
        const ids = state.tasks.map((task) => task.id);
        expect(ids).toStrictEqual(TASK_ORDER.filter((id) => ids.includes(id)));
        if (caseInput.hasNomination) expect(state.tasks.some((task) => task.status === 'blocked')).toBe(false);
      }
    });

    it('leaves the questions task out only for a nominated entity whose loaded lists hold no opinion question', () => {
      for (const caseInput of INPUTS.filter((i) => i.entityKnown)) {
        const listed = taskStateOf(caseInput).tasks.some((task) => task.id === 'questions');
        const knownToHaveNone = caseInput.hasNomination && caseInput.questionsReady && caseInput.opinionCount === 0;
        expect(listed).toBe(!knownToHaveNone);
      }
    });

    it('names the first incomplete task as the next step', () => {
      for (const caseInput of INPUTS) {
        const state = taskStateOf(caseInput);
        const firstIncomplete = state.tasks.find((task) => task.status === 'incomplete');
        expect(state.nextStep?.task).toBe(firstIncomplete?.id);
        expect(state.nextStep?.route).toStrictEqual(firstIncomplete?.route);
      }
    });

    it('says all complete exactly when the state is known and every task listed is complete', () => {
      for (const caseInput of INPUTS) {
        const state = taskStateOf(caseInput);
        const everyTaskComplete = state.tasks.length > 0 && state.tasks.every((task) => task.status === 'complete');
        expect(state.allComplete).toBe(state.known && everyTaskComplete);
      }
    });

    it('opens the preview exactly when the state is known and the one rule for the preview holds', () => {
      for (const caseInput of INPUTS) {
        const state = taskStateOf(caseInput);
        expect(state.previewOpen).toBe(state.known && previewOpenOf(caseInput));
      }
    });
  });
});

describe('hasNomination', () => {
  it.each(HAS_NOMINATION_CASES)('$title → $expected', ({ nominations, expected }) => {
    expect(hasNomination(nominations)).toBe(expected);
  });
});

describe('previewOpenOf', () => {
  it.each(PREVIEW_OPEN_CASES)('$title → $expected', ({ facts, expected }) => {
    expect(previewOpenOf(facts)).toBe(expected);
  });
});

describe('taskLabelKey', () => {
  it.each(TASK_LABEL_CASES)(
    '$id, status $status, route $route.route, answers locked $answersLocked → $expected',
    ({ id, status, route, answersLocked, expected }) => {
      expect(taskLabelKey({ id, status, route }, answersLocked)).toBe(expected);
    }
  );

  it('labels the tasks of a state', () => {
    expect(
      taskStateOf(input({ hasNomination: false, nominationEntryOffered: true })).tasks.map((task) =>
        taskLabelKey(task, false)
      )
    ).toStrictEqual([
      'contestantApp.home.nomination.enter',
      'contestantApp.home.basicInfo.enter',
      'contestantApp.home.questions.enter'
    ]);
    expect(taskStateOf(input({ hasNomination: false })).tasks.map((task) => taskLabelKey(task, false))).toStrictEqual([
      'contestantApp.home.nomination.view',
      'contestantApp.home.basicInfo.enter',
      'contestantApp.home.questions.enter'
    ]);
    expect(taskStateOf(input()).tasks.map((task) => taskLabelKey(task, false))).toStrictEqual([
      'contestantApp.home.nomination.view',
      'contestantApp.home.basicInfo.edit',
      'contestantApp.home.questions.edit'
    ]);
  });
});

describe('homeAction', () => {
  it.each(HOME_ACTION_CASES)('$title', ({ input: caseInput, expected }) => {
    expect(homeAction(taskStateOf(caseInput))).toStrictEqual(expected);
  });
});

describe('profileSaveTarget', () => {
  it.each(PROFILE_SAVE_CASES)('$title', ({ input: caseInput, expected }) => {
    expect(profileSaveTarget(taskStateOf(caseInput))).toStrictEqual(expected);
  });
});

describe('questionsResumeRoute', () => {
  it.each(QUESTIONS_RESUME_CASES)('$title', ({ input: caseInput, expected }) => {
    expect(questionsResumeRoute(taskStateOf(caseInput))).toStrictEqual(expected);
  });
});

describe('questionSaveTarget', () => {
  it.each(QUESTION_SAVE_CASES)('$title', ({ input: caseInput, wasUnanswered, expected }) => {
    expect(questionSaveTarget(taskStateOf(caseInput), { wasUnanswered })).toStrictEqual(expected);
  });

  it('leads to two places from one state read after the save, by what was read before it', () => {
    // The state after the save holds no unanswered question in both readings: it cannot tell a save that answered the last question from an edit of an answered one.
    const state = taskStateOf(input());
    expect(questionsResumeRoute(state)).toBeUndefined();
    expect(questionSaveTarget(state, { wasUnanswered: true })).toStrictEqual({ route: HOME, continues: true });
    expect(questionSaveTarget(state, { wasUnanswered: false })).toStrictEqual({
      route: QUESTIONS_LIST,
      continues: false
    });
  });

  it('leads on after the last unanswered question is answered, although the save has emptied the unanswered ones', () => {
    // Before the save one question, the one on the page, is unanswered: the page reads that it is.
    const beforeTheSave = taskStateOf(input({ unansweredOpinionCount: 1, firstUnansweredOpinionId: 'q-4' }));
    expect(questionsResumeRoute(beforeTheSave)).toStrictEqual(question('q-4'));
    const wasUnanswered = true;
    // The save answers it: the state read afterwards holds no unanswered question and no count.
    const afterTheSave = taskStateOf(input({ unansweredOpinionCount: 0, firstUnansweredOpinionId: undefined }));
    expect(questionsResumeRoute(afterTheSave)).toBeUndefined();
    expect(afterTheSave.tasks.find((task) => task.id === 'questions')).not.toHaveProperty('count');
    expect(questionSaveTarget(afterTheSave, { wasUnanswered })).toStrictEqual({ route: HOME, continues: true });
  });
});

describe('nominationsViewTarget', () => {
  it.each(NOMINATIONS_VIEW_CASES)('$title', ({ input: caseInput, facts, expected }) => {
    expect(nominationsViewTarget(taskStateOf(caseInput), facts)).toStrictEqual(expected);
  });

  it('never leads to the nominations view itself, and into the editor only for an entity with no nomination', () => {
    for (const { input: caseInput } of TASK_STATE_CASES)
      for (const facts of [ENTRY_OFFERED, NO_ENTRY_OFFERED]) {
        const target = nominationsViewTarget(taskStateOf(caseInput), facts);
        if (!target) continue;
        expect(target.route).not.toStrictEqual(NOMINATIONS);
        expect(target.action === 'define').toBe(target.route.route === EDITOR_ENTRY.route);
        if (target.action === 'define') expect(caseInput.hasNomination).toBe(false);
        expect(target.continues).toBe(target.action !== 'return');
      }
  });
});

describe('nominationsSaveTarget', () => {
  it.each(NOMINATIONS_SAVE_CASES)('$title', ({ input: caseInput, expected }) => {
    expect(nominationsSaveTarget(taskStateOf(caseInput))).toStrictEqual(expected);
  });
});

describe('nominationsSaveAction', () => {
  it.each(NOMINATIONS_ACTION_CASES)('$title', ({ input: caseInput, draft, expected }) => {
    expect(nominationsSaveAction(taskStateOf(caseInput), draft)).toStrictEqual(expected);
  });

  it('says "continue" exactly where a press with nothing to write leads on, for every known state', () => {
    for (const { input: caseInput } of TASK_STATE_CASES) {
      const state = taskStateOf(caseInput);
      if (!state.known) continue;
      expect(nominationsSaveAction(state, DRAFT_AS_STORED).action).toBe(
        nominationsSaveTarget(state).continues ? 'continue' : 'return'
      );
    }
  });

  it('returns a fresh answer on every call and changes neither argument', () => {
    for (const { input: caseInput, draft } of NOMINATIONS_ACTION_CASES) {
      const state = deepFrozen(taskStateOf(caseInput));
      const facts = Object.freeze({ ...draft });
      const first = nominationsSaveAction(state, facts);
      const second = nominationsSaveAction(state, facts);
      expect(second).toStrictEqual(first);
      expect(second).not.toBe(first);
      expect(sharedObjectCount(first, state)).toBe(0);
      expect(state).toStrictEqual(taskStateOf(caseInput));
      expect(facts).toStrictEqual(draft);
    }
  });
});

describe('fresh results', () => {
  const INPUTS = TASK_STATE_CASES.map((testCase) => testCase.input);

  it('taskStateOf returns equal states that share no object, and repeats no object inside one state', () => {
    for (const caseInput of INPUTS) {
      const first = taskStateOf(caseInput);
      const second = taskStateOf(caseInput);
      expect(second).toStrictEqual(first);
      expect(sharedObjectCount(first, second)).toBe(0);
      expect(new Set(objectsIn(first)).size).toBe(objectsIn(first).length);
    }
  });

  it('taskStateOf changes nothing in its input', () => {
    for (const caseInput of INPUTS) {
      const frozenInput = Object.freeze({ ...caseInput });
      taskStateOf(frozenInput);
      expect(frozenInput).toStrictEqual(caseInput);
    }
  });

  const SITES: Array<{ name: string; call: (state: TaskState) => unknown }> = [
    { name: 'homeAction', call: homeAction },
    { name: 'profileSaveTarget', call: profileSaveTarget },
    { name: 'questionsResumeRoute', call: questionsResumeRoute },
    {
      name: 'questionSaveTarget for a question that was unanswered',
      call: (state) => questionSaveTarget(state, { wasUnanswered: true })
    },
    {
      name: 'questionSaveTarget for a question that was answered',
      call: (state) => questionSaveTarget(state, { wasUnanswered: false })
    },
    {
      name: 'nominationsViewTarget where an entry to the editor is offered',
      call: (state) => nominationsViewTarget(state, { entryOffered: true })
    },
    {
      name: 'nominationsViewTarget where no entry is offered',
      call: (state) => nominationsViewTarget(state, { entryOffered: false })
    },
    { name: 'nominationsSaveTarget', call: nominationsSaveTarget }
  ];

  it.each(SITES)(
    '$name returns equal values that share no object with each other or with the state, and leaves the state as it was',
    ({ call }) => {
      for (const caseInput of INPUTS) {
        const state = deepFrozen(taskStateOf(caseInput));
        const first = call(state);
        const second = call(state);
        expect(second).toStrictEqual(first);
        expect(sharedObjectCount(first, second)).toBe(0);
        expect(sharedObjectCount(first, state)).toBe(0);
        expect(state).toStrictEqual(taskStateOf(caseInput));
      }
    }
  );
});

describe('answers to questions the entity is not asked', () => {
  /** The questions the entity is asked, and stored answers to two it is not: those of an election it is no longer nominated in. */
  const ASKED_OPINIONS = [{ id: 'opinion-shared' }, { id: 'opinion-of-election-a' }];
  const ASKED_REQUIRED_INFO = [{ id: 'info-required' }];
  const NOT_ASKED = { 'opinion-of-election-b': { value: 4 }, 'info-of-election-b': { value: 'kept' } };

  /** The state an entity with a nomination is in, with the counts the stored answers give over the questions it is asked. */
  function stateWith(answers: SavedAnswers): TaskState {
    const unansweredOpinions = unansweredQuestionsOf(ASKED_OPINIONS, answers);
    return taskStateOf(
      input({
        unansweredRequiredInfoCount: unansweredQuestionsOf(ASKED_REQUIRED_INFO, answers).length,
        opinionCount: ASKED_OPINIONS.length,
        unansweredOpinionCount: unansweredOpinions.length,
        firstUnansweredOpinionId: unansweredOpinions[0]?.id
      })
    );
  }

  const ANSWERED: Array<{ title: string; answers: SavedAnswers }> = [
    { title: 'nothing answered', answers: {} },
    { title: 'one opinion question answered', answers: { 'opinion-shared': { value: 2 } } },
    {
      title: 'every opinion question answered and the required info not',
      answers: { 'opinion-shared': { value: 2 }, 'opinion-of-election-a': { value: 5 } }
    },
    {
      title: 'everything answered',
      answers: {
        'opinion-shared': { value: 2 },
        'opinion-of-election-a': { value: 5 },
        'info-required': { value: 'text' }
      }
    }
  ];

  it.each(ANSWERED)('change no count and no state: $title', ({ answers }) => {
    const without = stateWith(answers);
    const withNotAsked = stateWith({ ...answers, ...NOT_ASKED });

    expect(withNotAsked).toStrictEqual(without);
    expect(unansweredQuestionsOf(ASKED_OPINIONS, { ...answers, ...NOT_ASKED })).toStrictEqual(
      unansweredQuestionsOf(ASKED_OPINIONS, answers)
    );
    expect(unansweredQuestionsOf(ASKED_REQUIRED_INFO, { ...answers, ...NOT_ASKED })).toStrictEqual(
      unansweredQuestionsOf(ASKED_REQUIRED_INFO, answers)
    );
  });

  it('do not complete a task: with every asked question unanswered the stored answers leave both tasks incomplete', () => {
    const state = stateWith(NOT_ASKED);

    expect(state.tasks.map((task) => [task.id, task.status, task.count])).toStrictEqual([
      ['nomination', 'complete', undefined],
      ['profile', 'incomplete', 1],
      ['questions', 'incomplete', 2]
    ]);
    expect(state.allComplete).toBe(false);
    expect(state.previewOpen).toBe(false);
  });
});

describe('the barrel', () => {
  it('exports the task state and the unanswered filters', async () => {
    const barrel = await import('./index');
    expect(barrel.taskStateOf).toBe(taskStateOf);
    expect(barrel.questionSaveTarget).toBe(questionSaveTarget);
    expect(typeof barrel.requiredInfoQuestionsOf).toBe('function');
    expect(typeof barrel.unansweredQuestionsOf).toBe('function');
  });
});
