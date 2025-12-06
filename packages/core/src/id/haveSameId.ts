import type { HasId } from './id.type';

/**
 * Returns true if all targets have the same id and there are at least two targets.
 */
export function haveSameId(...targets: Array<HasId>): boolean {
  const [first, ...others] = targets;
  if (!first || others.length === 0) return false;
  return others.every(({ id }) => id === first.id);
}
