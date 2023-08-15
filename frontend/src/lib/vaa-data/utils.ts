/**
 * Utilities used with DataProvider
 */

import type {PersonNameData} from './dataObjects/entities';

/**
 *
 * @param value Check if the value is empty wgt to filters and filtered values
 * @returns Whether the value is empty
 */
export function isEmpty(value: unknown): boolean {
  return value == null || value == '' || (Array.isArray(value) && value.length === 0);
}

/**
 * @param values Any array
 * @returns Values with duplicates removed
 */
export function removeDuplicates<T>(values: T[]): T[] {
  return [...new Set(values)];
}

/**
 * @param name A given name or full name
 * @returns Initials for the given name
 */
export function createInitials(name: string) {
  if (name === '') {
    return '';
  }
  return [...name.matchAll(/[^\s-]+|-+/g)]
    .map((n) => (n[0][0] === '-' ? '-' : n[0][0].toUpperCase() + '.'))
    .join('')
    .replaceAll(/\.(?!-)/g, '. ')
    .trim();
}

/**
 * @param data A person's prefix, given name, family name and suffix.
 * @returns An abbreviated version of the person's name.
 */
export function createShortName(
  {familyName, givenName, namePrefix}: PersonNameData,
  initialsOnly = false
) {
  const first = namePrefix ? namePrefix + ' ' : givenName ? createInitials(givenName) + ' ' : '';
  return initialsOnly ? first + createInitials(familyName) : first + familyName;
}
