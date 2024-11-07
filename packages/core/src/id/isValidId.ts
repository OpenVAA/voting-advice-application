import { Id } from './id.type';

const INVALID_ID_CHAR_RE = /\s/;

/**
 * Returns `true` if the given value is a valid `Id`, `false` otherwise.
 * @param id The value to check
 * @returns `true` if the given value is a valid `Id`, `false` otherwise.
 */
export function isValidId(id: Id): id is Id {
  return typeof id === 'string' && id.match(INVALID_ID_CHAR_RE) === null;
}
