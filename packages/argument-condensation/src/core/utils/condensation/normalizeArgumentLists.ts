import type { Argument } from '../../types';

/**
 * Validates and normalizes the input to be of type `Argument[][]`.
 *
 * This function takes an input that can be either a single array of arguments (`Argument[]`)
 * or an array of argument arrays (`Argument[][]`). It ensures the structural integrity
 * of the data by checking that no deeper nesting (e.g., `Argument[][][]`) exists.
 *
 * @param {Array<Argument> - | Array<Array<Argument>>} argumentData - The input data to normalize.
 * @returns {Array<Array<Argument>>} The normalized data as an array of argument arrays.
 * @throws {Error} If the input data has an invalid structure, such as being too deeply nested.
 */
export function normalizeArgumentLists(argumentData: Array<Argument> | Array<Array<Argument>>): Array<Array<Argument>> {
  if (!Array.isArray(argumentData)) {
    throw new Error('Invalid input: argumentData must be an array.');
  }

  // If the first element is not an array, we assume it's a single list of arguments.
  if (argumentData.length > 0 && !Array.isArray(argumentData[0])) {
    // Before wrapping, ensure no element in the single list is an array itself.
    for (const item of argumentData) {
      if (Array.isArray(item)) {
        throw new Error('Invalid input: A single argument list should not contain nested arrays.');
      }
    }
    return [argumentData as Array<Argument>];
  }

  // If we have an array of arrays, validate that it's not more than two levels deep.
  for (const list of argumentData as Array<Array<Argument>>) {
    if (!Array.isArray(list)) {
      throw new Error('Invalid input: Mismatched types in argument lists. Expected all elements to be arrays.');
    }
    for (const item of list) {
      if (Array.isArray(item)) {
        throw new Error('Invalid input: Argument lists should not be nested more than two levels deep.');
      }
    }
  }

  return argumentData as Array<Array<Argument>>;
}
