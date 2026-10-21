/**
 * The tasks an entity has in the Contestant App — define a nomination, fill in the profile, answer the opinion questions — as one state: each task's status and route, the next step, whether the preview is open, and where each button that continues from a page leads.
 *
 * CALLER CONTRACT: every function takes values the caller has already read. Inside a reactive scope the caller reads the context's accessors in its own tracking scope and hands the values over; this module is never given the context or the data root. Every function is pure and returns fresh objects, so a result can replace the one before it wholesale.
 *
 * The types are structural and the module imports nothing: route names and message keys are literal unions that the caller's route builder and translation function accept. The context, a page and a server load can therefore all import it, and its test loads the test runner, this file and, for the counts of its cases on stored answers, the filter of unanswered questions beside it.
 *
 * "Not known" is stated in `taskStateOf` alone. A list that is empty because nothing is loaded looks the same as one that is empty because nothing is left to do, so no status, next step, open preview or completeness is read off a count before the facts behind it are loaded. Every other function reads the state and repeats no such rule.
 *
 * A button's label and its target are asked at two moments, with two sets of inputs. The label is shown before the save, so the caller asks with a state computed from the saved data together with the draft. The target is taken once the save has succeeded, so the caller asks again with the state as it stands then.
 *
 * The nomination editor's label is the exception in its inputs: `nominationsSaveAction` is asked with the state as it stands and three facts of the draft, because a draft of nominations changes which questions the entity is asked, and that is not known before the save.
 *
 * Tested in `taskState.test.ts`.
 */

/** The tasks, in the order they are listed and suggested. */
export type TaskId = 'nomination' | 'profile' | 'questions';

/** What is known of a task: done, still to do, or not reachable yet. A task whose facts are not loaded has no status. */
export type TaskStatus = 'complete' | 'incomplete' | 'blocked';

/** A route as a page hands it to its route builder: the route's name and, for one question, its id. */
export type TaskRoute =
  | { route: 'ContestantAppNominations' }
  | { route: 'ContestantAppNominationElections' }
  | { route: 'ContestantAppProfile' }
  | { route: 'ContestantAppQuestions' }
  | { route: 'ContestantAppQuestion'; questionId: string }
  | { route: 'ContestantAppEntityHome' }
  | { route: 'ContestantAppPreview' };

/** One task of the entity. */
export type Task = {
  id: TaskId;
  /** `undefined` while the facts the status rests on are not loaded. */
  status: TaskStatus | undefined;
  /** The task's own page. */
  route: TaskRoute;
  /** On the questions task alone, while a question is unanswered: the first unanswered question. */
  resume?: TaskRoute;
  /** How many questions the task still lacks an answer to. Absent when there is nothing to count, and on a task that is blocked or has no status. */
  count?: number;
};

/** The first incomplete task and where it leads. */
export type NextStep = {
  task: TaskId;
  route: TaskRoute;
};

/** The state of an entity's tasks. */
export type TaskState = {
  /** The tasks the entity has, in order. Empty while nothing is known of the entity. */
  tasks: ReadonlyArray<Task>;
  /** The first incomplete task, or `undefined` when there is none or the state is not known. */
  nextStep: NextStep | undefined;
  /** Whether the entity's preview can be opened. False while the state is not known. */
  previewOpen: boolean;
  /** Whether every task's status is decided. While it is false nothing else in the state says what is left to do. */
  known: boolean;
  /** Whether every task the entity has is complete. False while the state is not known. */
  allComplete: boolean;
};

/** What `taskStateOf` is told. Each member is a value the caller has already read. */
export type TaskStateInput = {
  /** Whether the entity is known: whether it has a nomination has been read. */
  entityKnown: boolean;
  /** Whether the entity has at least one nomination, as `hasNomination` answers. */
  hasNomination: boolean;
  /** Whether the entity's nominations may be edited: the caller has read both locks, the one on nominations and the one on answers, through the one predicate that states the rule. Read for an entity with no nomination alone. A caller that leaves it out is answered as for nominations that may not be edited. */
  nominationsEditable?: boolean;
  /** Whether the entity's question lists are loaded. They never are for an entity with no nomination, so that case is decided before this is read. */
  questionsReady: boolean;
  /** How many required info questions have no saved answer. */
  unansweredRequiredInfoCount: number;
  /** Whether a required name is missing. The caller counts a name only while the user can still edit it. */
  requiredNameMissing: boolean;
  /** How many opinion questions the entity is asked. */
  opinionCount: number;
  /** How many of those opinion questions have no saved answer. */
  unansweredOpinionCount: number;
  /** The id of the first opinion question with no saved answer, or `undefined` when every one is answered. */
  firstUnansweredOpinionId: string | undefined;
};

/** What the preview's rule reads. */
export type PreviewOpenInput = Pick<
  TaskStateInput,
  'hasNomination' | 'unansweredRequiredInfoCount' | 'unansweredOpinionCount'
>;

/** The message keys of the task rows' labels. Structural, so the caller's translation function accepts them. */
export type TaskLabelKey =
  | 'contestantApp.home.nomination.enter'
  | 'contestantApp.home.nomination.view'
  | 'contestantApp.home.basicInfo.enter'
  | 'contestantApp.home.basicInfo.edit'
  | 'contestantApp.home.basicInfo.view'
  | 'contestantApp.home.questions.enter'
  | 'contestantApp.home.questions.edit'
  | 'contestantApp.home.questions.view';

/** Where a button leads, and whether it takes the user onward (`continues`, a "continue" label) or back (a "return" label). */
export type ContinueTarget = {
  route: TaskRoute;
  continues: boolean;
};

/** The main action of the entity's home: nothing yet while the state is not known, the first incomplete task, or the preview once every task is complete. */
export type HomeAction =
  { kind: 'pending' } | { kind: 'task'; task: TaskId; route: TaskRoute } | { kind: 'preview'; route: TaskRoute };

/** What the nomination editor has already computed of its draft, before its main button is pressed. */
export type NominationsDraftFacts = {
  /** Whether a save would write anything: the caller has compared every card of the draft with what is stored. */
  somethingToWrite: boolean;
  /** Whether at least one card is kept or new: the caller has looked for a card that is not about to be removed. */
  anyKeptOrNew: boolean;
  /** Whether the entity had a nomination the editor manages when the draft was started: the caller has read the nominations the cards were built on. */
  hadNomination: boolean;
};

/** The message keys of the labels of the nomination editor's main button. Structural, so the caller's translation function accepts them. */
export type NominationsSaveLabelKey =
  'common.continue' | 'common.return' | 'common.saveAndContinue' | 'common.saveAndReturn';

/** What the nomination editor's main button says and does: its label's message key, and whether a press takes the user onward (`continue`) or back (`return`). */
export type NominationsSaveAction = {
  labelKey: NominationsSaveLabelKey;
  action: 'continue' | 'return';
};

/** What the nominations view read before it asked where its button leads. */
export type NominationsViewFacts = {
  /** Whether the view offers an entry to the nomination editor: nominations may be edited and an election admits the entity. The task state cannot tell, because it is told nothing of elections. */
  entryOffered: boolean;
};

/** Where the nominations view's button leads, and which button it is. */
export type NominationsViewTarget = ContinueTarget & {
  /** What the button does: `continue` leads on to the entity's next task, `return` back to the entity's home, and `define` into the nomination editor, for an entity with no nomination. The caller picks the button's label by it and compares no route. */
  action: 'continue' | 'return' | 'define';
};

/** What a question page read before it saved an answer. */
export type QuestionSaveFacts = {
  /** Whether the question had no saved answer before the save. The save takes the question out of the unanswered ones, so the state read after it cannot tell. */
  wasUnanswered: boolean;
};

/** The route of one question. */
function questionRoute(questionId: string): TaskRoute {
  return { route: 'ContestantAppQuestion', questionId };
}

/** A copy of a route, so that no two results hold one object. */
function copyOf(route: TaskRoute): TaskRoute {
  return { ...route };
}

/**
 * Whether an entity has a nomination. One is enough, confirmed or not.
 * @param nominations - The entity's nominations, or nothing when no list was read.
 * @returns `true` for a list with at least one element.
 */
export function hasNomination(nominations: ReadonlyArray<unknown> | null | undefined): boolean {
  return !!nominations && nominations.length > 0;
}

/**
 * Whether the entity's preview can be opened: it has a nomination, no required info question is unanswered and no opinion question is unanswered. A missing name does not close the preview, and an entity that is asked no opinion question has none unanswered.
 *
 * The counts must be those of loaded question lists: a count of zero read before the lists are loaded says nothing.
 * @param facts - Whether the entity has a nomination, and the two counts of unanswered questions.
 * @returns Whether the preview is open.
 */
export function previewOpenOf(facts: PreviewOpenInput): boolean {
  return facts.hasNomination && facts.unansweredRequiredInfoCount === 0 && facts.unansweredOpinionCount === 0;
}

/**
 * The state of an entity's tasks. The rules are applied in this order and the first that applies decides:
 *
 * 1. Nothing is known of the entity: no task, and the state is not known.
 * 2. The entity has no nomination: the nomination task is incomplete and is the next step, and the profile and the questions are blocked and listed. The task and the next step lead to the nomination editor's entry while nominations may be edited, and to the nominations view while they may not. No question input is read, so a blocked task carries no count.
 * 3. The entity has a nomination and its question lists are not loaded: the nomination task is complete, the profile and the questions are listed with no status, and the state is not known.
 * 4. The lists are loaded: the profile is incomplete while a required info question is unanswered or a required name is missing; the questions task is left out for an entity that is asked no opinion question and is otherwise incomplete while one is unanswered; the next step is the first incomplete task; the preview follows `previewOpenOf`.
 * @param input - The already-read facts of the entity.
 * @returns A fresh state.
 */
export function taskStateOf(input: TaskStateInput): TaskState {
  // 1. Nothing is known of the entity.
  if (!input.entityKnown) {
    return { tasks: [], nextStep: undefined, previewOpen: false, known: false, allComplete: false };
  }

  // 2. No nomination. This is decided before any question input is read: the question lists of such an entity are never loaded, and an empty list would read as nothing left to do.
  if (!input.hasNomination) {
    // Where the user can define a nomination the task leads straight into the editor; where they cannot, to the view, which says why.
    const route: TaskRoute = input.nominationsEditable
      ? { route: 'ContestantAppNominationElections' }
      : { route: 'ContestantAppNominations' };
    return {
      tasks: [
        { id: 'nomination', status: 'incomplete', route },
        { id: 'profile', status: 'blocked', route: { route: 'ContestantAppProfile' } },
        { id: 'questions', status: 'blocked', route: { route: 'ContestantAppQuestions' } }
      ],
      nextStep: { task: 'nomination', route: copyOf(route) },
      previewOpen: false,
      known: true,
      allComplete: false
    };
  }

  const nomination: Task = { id: 'nomination', status: 'complete', route: { route: 'ContestantAppNominations' } };

  // 3. The question lists are not loaded: the profile and the questions are listed, and no count is read.
  if (!input.questionsReady) {
    return {
      tasks: [
        nomination,
        { id: 'profile', status: undefined, route: { route: 'ContestantAppProfile' } },
        { id: 'questions', status: undefined, route: { route: 'ContestantAppQuestions' } }
      ],
      nextStep: undefined,
      previewOpen: false,
      known: false,
      allComplete: false
    };
  }

  // 4. The lists are loaded.
  const profileIncomplete = input.unansweredRequiredInfoCount > 0 || input.requiredNameMissing;
  const profile: Task = {
    id: 'profile',
    status: profileIncomplete ? 'incomplete' : 'complete',
    route: { route: 'ContestantAppProfile' }
  };
  if (input.unansweredRequiredInfoCount > 0) profile.count = input.unansweredRequiredInfoCount;

  const tasks: Array<Task> = [nomination, profile];

  // An entity that is asked no opinion question has no questions task.
  if (input.opinionCount > 0) {
    const unanswered = input.unansweredOpinionCount > 0;
    const firstUnanswered =
      unanswered && input.firstUnansweredOpinionId !== undefined
        ? questionRoute(input.firstUnansweredOpinionId)
        : undefined;
    // The task leads to its own page, the questions list, also while a question is unanswered: that is where the user arrives from outside the questions. The first unanswered question is carried beside it, for the buttons inside the questions.
    const route: TaskRoute = { route: 'ContestantAppQuestions' };
    const questions: Task = { id: 'questions', status: unanswered ? 'incomplete' : 'complete', route };
    if (unanswered) questions.count = input.unansweredOpinionCount;
    if (firstUnanswered) questions.resume = firstUnanswered;
    tasks.push(questions);
  }

  const firstIncomplete = tasks.find((task) => task.status === 'incomplete');
  return {
    tasks,
    nextStep: firstIncomplete ? { task: firstIncomplete.id, route: copyOf(firstIncomplete.route) } : undefined,
    previewOpen: previewOpenOf(input),
    known: true,
    allComplete: tasks.every((task) => task.status === 'complete')
  };
}

/**
 * The message key of a task row's label, which is also the label of the home's main action when it leads to that task.
 *
 * The nomination's label follows its completion alone. The profile's and the questions' read "view" for every status while answers are locked, "edit" once the task is complete, and "enter" otherwise.
 * @param task - The task's id and status.
 * @param answersLocked - Whether answers are locked.
 * @returns The label's message key.
 */
export function taskLabelKey(task: Pick<Task, 'id' | 'status'>, answersLocked: boolean): TaskLabelKey {
  const complete = task.status === 'complete';
  switch (task.id) {
    case 'nomination':
      return complete ? 'contestantApp.home.nomination.view' : 'contestantApp.home.nomination.enter';
    case 'profile':
      if (answersLocked) return 'contestantApp.home.basicInfo.view';
      return complete ? 'contestantApp.home.basicInfo.edit' : 'contestantApp.home.basicInfo.enter';
    case 'questions':
      if (answersLocked) return 'contestantApp.home.questions.view';
      return complete ? 'contestantApp.home.questions.edit' : 'contestantApp.home.questions.enter';
  }
}

/**
 * The main action of the entity's home.
 * @param state - The entity's task state.
 * @returns Nothing to show yet while the state is not known; otherwise the first incomplete task with its page, or the preview when no task is incomplete.
 */
export function homeAction(state: TaskState): HomeAction {
  if (!state.known) return { kind: 'pending' };
  if (state.nextStep) return { kind: 'task', task: state.nextStep.task, route: copyOf(state.nextStep.route) };
  return { kind: 'preview', route: { route: 'ContestantAppPreview' } };
}

/**
 * Where the profile page's save button leads: on to the questions when they are the next step, and otherwise back to the entity's home — the profile is still incomplete, or nothing is left to do.
 * @param state - The entity's task state.
 * @returns The target and whether it continues.
 */
export function profileSaveTarget(state: TaskState): ContinueTarget {
  const next = state.nextStep;
  if (next?.task === 'questions') return { route: copyOf(next.route), continues: true };
  return { route: { route: 'ContestantAppEntityHome' }, continues: false };
}

/**
 * Where the buttons inside the questions resume: the first unanswered opinion question.
 * @param state - The entity's task state.
 * @returns The question's route, or `undefined` when no question is unanswered or the state is not known.
 */
export function questionsResumeRoute(state: TaskState): TaskRoute | undefined {
  const resume = state.tasks.find((task) => task.id === 'questions')?.resume;
  return resume ? copyOf(resume) : undefined;
}

/**
 * Where a question page's save button leads.
 *
 * While a question is unanswered it leads to the first unanswered one. When none is left it depends on the question that was saved: if that question had no answer before, the save finished the questions and the button leads to the first incomplete task or, with none, to the entity's home; if it had one, the save was an edit and the button leads back to the questions list.
 * @param state - The entity's task state.
 * @param facts - What the page read before the save.
 * @returns The target and whether it continues.
 */
export function questionSaveTarget(state: TaskState, facts: QuestionSaveFacts): ContinueTarget {
  // While a question is unanswered the user keeps answering: the button leads to the first unanswered question, whatever else is incomplete and whether or not the question just saved had an answer before.
  const resume = questionsResumeRoute(state);
  if (resume) return { route: resume, continues: true };

  // No question is left. An edit of a question that already had an answer leads back to the questions list, and so does a save in a state that is not known, from which nothing is decided.
  if (!facts.wasUnanswered || !state.known) return { route: { route: 'ContestantAppQuestions' }, continues: false };

  // The save answered the last unanswered question: on to the first incomplete task, or to the entity's home when there is none.
  if (state.nextStep) return { route: copyOf(state.nextStep.route), continues: true };
  return { route: { route: 'ContestantAppEntityHome' }, continues: true };
}

/**
 * Where the nominations view's button leads, and which button it is.
 *
 * For an entity with a nomination it leads on to the first incomplete task, or back to the entity's home when nothing is left to do, whatever the view's fact. For an entity with no nomination it leads into the nomination editor where the view offers an entry and the nomination task leads there, and otherwise back to the entity's home: never to the view itself, and never into an editor that would turn the user away.
 * @param state - The entity's task state.
 * @param facts - What the view read.
 * @returns The target, whether it continues and what the button does, or `undefined` while the state is not known.
 */
export function nominationsViewTarget(
  state: TaskState,
  facts: NominationsViewFacts
): NominationsViewTarget | undefined {
  if (!state.known) return undefined;
  const next = state.nextStep;
  if (next && next.task !== 'nomination') return { route: copyOf(next.route), continues: true, action: 'continue' };
  if (next && facts.entryOffered && next.route.route === 'ContestantAppNominationElections')
    return { route: copyOf(next.route), continues: true, action: 'define' };
  return { route: { route: 'ContestantAppEntityHome' }, continues: false, action: 'return' };
}

/**
 * Where the nomination editor leads once a save has been stored: on to the first incomplete task, and otherwise back to the entity's home — the save left the entity with no nomination, whose next step is the nomination task again, or nothing is left to do.
 *
 * The caller asks with the state as it stands after the save. While that state is not known it holds no next step, and the target is the entity's home.
 * @param state - The entity's task state.
 * @returns The target and whether it continues.
 */
export function nominationsSaveTarget(state: TaskState): ContinueTarget {
  const next = state.nextStep;
  if (!next || next.task === 'nomination') return { route: { route: 'ContestantAppEntityHome' }, continues: false };
  return { route: copyOf(next.route), continues: true };
}

/**
 * What the nomination editor's main button says before it is pressed. The rows are read in this order and the first that applies decides:
 *
 * 1. Nothing to write, and the state is known: "Continue" where a press leads on to a task other than the nomination itself, and "Return" otherwise.
 * 2. Nothing to write, and the state is not known: "Continue".
 * 3. Every card is about to be removed: "Save and Return", whatever the state holds.
 * 4. Something to write with a card kept or new, for an entity that had no nomination: "Save and Continue". The label is a prediction here, since the question lists of such an entity are not loaded before it has a nomination.
 * 5. Something to write with a card kept or new, and the state is known: "Save and Continue" where a press leads on, and "Save and Return" when no task is left.
 * 6. Something to write with a card kept or new, and the state is not known: "Save and Continue".
 *
 * The caller asks with the state as it stands, which the draft has not changed, and asks `nominationsSaveTarget` again once the save is stored.
 * @param state - The entity's task state as it stands.
 * @param draft - What the caller has computed of the draft.
 * @returns The label's message key and the button's action.
 */
export function nominationsSaveAction(state: TaskState, draft: NominationsDraftFacts): NominationsSaveAction {
  // A state that is not known holds no next step, so it is asked first and never read as "no task is left".
  const leadsOn = !state.known || nominationsSaveTarget(state).continues;

  if (!draft.somethingToWrite) {
    return leadsOn
      ? { labelKey: 'common.continue', action: 'continue' }
      : { labelKey: 'common.return', action: 'return' };
  }
  if (!draft.anyKeptOrNew) return { labelKey: 'common.saveAndReturn', action: 'return' };
  if (!draft.hadNomination || leadsOn) return { labelKey: 'common.saveAndContinue', action: 'continue' };
  return { labelKey: 'common.saveAndReturn', action: 'return' };
}
