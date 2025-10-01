/**
 * An error thrown when a controlled operation should be aborted.
 */
export class AbortError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AbortError';
  }
}
