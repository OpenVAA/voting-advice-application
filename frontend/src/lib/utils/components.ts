/**
 * Generate a random unique id for use with, e.g., html elements.
 * @returns a unique id
 */
export function getUUID(): string {
  return crypto?.randomUUID ? crypto.randomUUID() : (Math.random() * 10e15).toString(16);
}
