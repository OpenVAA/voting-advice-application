import { isHiddenIfMissingAnswers } from './hideIfMissingAnswers';
import type { ContestantContext } from '$lib/contexts/contestant/contestantContext.type';
import type { LogoutWarning } from '$lib/dynamic-components/logoutButton';

/**
 * The members of the contestant context the warning is read from.
 */
export type ContestantLogoutWarningSource = Pick<
  ContestantContext,
  | 'userData'
  | 'answersLocked'
  | 'taskState'
  | 'unansweredOpinionQuestions'
  | 'unansweredRequiredInfoQuestions'
  | 'selectedEntity'
  | 'appSettings'
>;

/**
 * What the Contestant App's Log out warns about: the counts of what is left undone, or `undefined` when nothing counted is left.
 *
 * Something is left while the entity being edited is loaded, answers are not locked and its `profile` or `questions` task is incomplete with a count above 0. Data can be missing only from an entity that is loaded: without one, the unanswered lists hold every question. A blocked task, the nomination and a task with nothing to count give no warning.
 *
 * Every accessor is read at the call, so a caller that calls it inside a tracking scope follows them.
 *
 * @param ctx - The contestant context.
 * @returns The warning, or `undefined` when nothing counted is left.
 */
export function contestantLogoutWarning(ctx: ContestantLogoutWarningSource): LogoutWarning | undefined {
  const countedTaskLeft =
    !!ctx.userData.savedEntityData &&
    !ctx.answersLocked &&
    ctx.taskState.tasks.some(
      (task) =>
        (task.id === 'profile' || task.id === 'questions') && task.status === 'incomplete' && (task.count ?? 0) > 0
    );
  if (!countedTaskLeft) return undefined;
  return {
    opinionQuestionsLeft: ctx.unansweredOpinionQuestions.length,
    infoQuestionsLeft: ctx.unansweredRequiredInfoQuestions.length,
    hiddenIfMissing: isHiddenIfMissingAnswers({ entityType: ctx.selectedEntity?.type, appSettings: ctx.appSettings })
  };
}
