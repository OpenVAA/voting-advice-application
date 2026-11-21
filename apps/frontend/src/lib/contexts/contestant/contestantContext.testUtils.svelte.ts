import type { DeepPartial } from '@openvaa/app-shared';
import type { AnyQuestionVariant } from '@openvaa/data';
import type { RouteOptions } from '$lib/routes';
import type { ContestantContext } from './contestantContext.type';

/**
 * A question as a fake contestant context holds one: its id, and whatever else of a question the case reads.
 */
export type FakeQuestion = { readonly id: string };

/**
 * The reactive members a fake contestant context reads from its box, typed as the real context types them. The settings and the question lists are the exceptions: a case holds only the parts of them it reads.
 */
export type FakeBox = Pick<
  ContestantContext,
  | 'dataRoot'
  | 'locale'
  | 'user'
  | 'entities'
  | 'selectedEntity'
  | 'answersLocked'
  | 'nominationsLocked'
  | 'questionsReady'
  | 'nominations'
  | 'taskState'
  | 'entryFlow'
  | 'logoutFailed'
  | 'isAuthenticated'
> & {
  appSettings: DeepPartial<AppSettings>;
  infoQuestions: ReadonlyArray<FakeQuestion>;
  requiredInfoQuestions: ReadonlyArray<FakeQuestion>;
  opinionQuestions: ReadonlyArray<FakeQuestion>;
  unansweredOpinionQuestions: ReadonlyArray<FakeQuestion>;
  unansweredRequiredInfoQuestions: ReadonlyArray<FakeQuestion>;
};

/**
 * The state behind a fake contestant context: one raw state, replaced whole on every write, never changed in place.
 */
export type FakeBoxHolder<TBox> = {
  /** The state the context's members read. Assigning it notifies every reader. */
  current: TBox;
  /** Replace the state with a copy that carries `changes`. */
  set: (changes: Partial<TBox>) => void;
};

/**
 * Build a fake contestant context for a component test, to hand to a `vi.mock` of `$lib/contexts/contestant`.
 *
 * Every member of {@link FakeBox} is a getter over the box, as the real context's reactive accessors are, and answers `undefined` while the box holds no value for it. Nothing is derived from the box: a member such as `taskState` is whatever the box holds. `t` answers a message's key, and `getRoute` answers `/route/` followed by the route's name.
 *
 * `members` adds the members a test varies or needs beyond these, or replaces them: stable functions, a `t` or `getRoute` of its own, or a getter over the box that derives a member. Its getters stay getters.
 *
 * @param initial - What the box holds first. Members a test reads that the context does not serve may ride along, for its own getters in `members`.
 * @param members - Builds the test's own members from the box.
 * @returns The context, and the box behind it.
 */
export function fakeContestantContext<TBox extends Partial<FakeBox>, TMembers extends object = Record<never, never>>(
  initial: TBox,
  members?: (box: FakeBoxHolder<TBox>) => TMembers
) {
  let held = $state.raw(initial);
  const box: FakeBoxHolder<TBox> = {
    get current() {
      return held;
    },
    set current(next) {
      held = next;
    },
    set: (changes) => {
      held = { ...held, ...changes };
    }
  };
  const shared = {
    t: (key: string) => key,
    getRoute: { current: (options: RouteOptions) => `/route/${typeof options === 'string' ? options : options.route}` },
    get appSettings() {
      return box.current.appSettings as AppSettings | undefined;
    },
    get dataRoot() {
      return box.current.dataRoot;
    },
    get locale() {
      return box.current.locale;
    },
    get user() {
      return box.current.user;
    },
    get entities() {
      return box.current.entities;
    },
    get selectedEntity() {
      return box.current.selectedEntity;
    },
    get answersLocked() {
      return box.current.answersLocked;
    },
    get nominationsLocked() {
      return box.current.nominationsLocked;
    },
    get questionsReady() {
      return box.current.questionsReady;
    },
    get nominations() {
      return box.current.nominations;
    },
    get taskState() {
      return box.current.taskState;
    },
    get entryFlow() {
      return box.current.entryFlow;
    },
    get logoutFailed() {
      return box.current.logoutFailed;
    },
    get isAuthenticated() {
      return box.current.isAuthenticated;
    },
    get infoQuestions() {
      return asQuestions(box.current.infoQuestions);
    },
    get requiredInfoQuestions() {
      return asQuestions(box.current.requiredInfoQuestions);
    },
    get opinionQuestions() {
      return asQuestions(box.current.opinionQuestions);
    },
    get unansweredOpinionQuestions() {
      return asQuestions(box.current.unansweredOpinionQuestions);
    },
    get unansweredRequiredInfoQuestions() {
      return asQuestions(box.current.unansweredRequiredInfoQuestions);
    }
  } satisfies Partial<ContestantContext>;
  const own = members?.(box) ?? {};
  // Descriptors rather than a spread, so that the test's getters stay getters. `defineProperties` types its result as its target alone.
  const context = Object.defineProperties(shared, Object.getOwnPropertyDescriptors(own)) as unknown as Omit<
    typeof shared,
    keyof TMembers
  > &
    TMembers;
  return { context, box };
}

/** A fake question list, handed on as the list of questions the context holds. */
function asQuestions(questions: ReadonlyArray<FakeQuestion> | undefined): Array<AnyQuestionVariant> | undefined {
  return questions as Array<AnyQuestionVariant> | undefined;
}
