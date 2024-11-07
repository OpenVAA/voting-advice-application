import type { Alliance, Candidate } from '../internal';

/**
 * Creates intials for a `Candidate`.
 * @example Ben Johnson → BJ
 * @example Johan af Gran → JaG
 * @example John Maynard-Keynes → JMK
 */
export function formatInitials({ object }: { object: Candidate }): string {
  return `${object.firstName} ${object.lastName}`
    .split(/[ -]+/)
    .map((word) => `${word.substring(0, 1)}`)
    .join('');
}

/**
 * Format the full name of a `Candidate` based on first and last name.
 */
export function formatName({ object }: { object: Candidate }): string {
  return `${object.firstName} ${object.lastName}`;
}

/**
 * Construct a name for an `Alliance` based on it’s member `Organization`s’ names.
 * @param object
 */
export function formatAllianceName({ object }: { object: Alliance }): string {
  const names = object.organizations.map((o) => o.name).filter((n) => n !== '');
  // In theory, objects should always have at least two organizations, so this check is somewhat redundant
  return names.length > 1 ? `${names.slice(0, -1).join(', ')} & ${names[names.length - 1]}` : (names[0] ?? '—');
}

/**
 * Construct a shortName for an `Alliance` based on it’s member `Organization`s’ shortNames.
 * @param object
 */
export function formatAllianceShortName({ object }: { object: Alliance }): string {
  const shortNames = object.organizations.map((o) => o.shortName).filter((n) => n !== '');
  // In theory, objects should always have at least two organizations, so this check is somewhat redundant
  return shortNames.length ? shortNames.join('–') : '—';
}
