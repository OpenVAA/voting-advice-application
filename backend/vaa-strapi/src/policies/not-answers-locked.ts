import { isAnswersLocked } from '../util/answersLocked';

/**
 * A policy that requires answers not being locked.
 */
export default async function notAnswersLocked(): Promise<boolean> {
  return !(await isAnswersLocked());
}
