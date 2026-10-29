/**
 * The error the answer setters throw when the database refuses the write because the project's answers are locked. Nothing of the write was stored. A page that meets it tells the user that answers can no longer be edited, rather than that the save failed.
 */
export class AnswersLockedError extends Error {
  override name = 'AnswersLockedError';

  constructor() {
    super('The answers of this project are locked');
  }
}
