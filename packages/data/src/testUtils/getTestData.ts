import { DataRoot } from '../internal';
import { TEST_DATA } from '.';

/**
 * Use this function to get a deep copy of the test data so that any changes made to the copy won't affect other tests.
 * @returns A deep copy of `EXAMPLE_DATA`.
 */
export function getTestData(): typeof TEST_DATA {
  return structuredClone(TEST_DATA);
}

/**
 * A utility to function to create a `DataRoot` initialized with the test data.
 * @returns A `DataRoot` object
 */
export function getTestDataRoot(debug = false): DataRoot {
  const root = new DataRoot();
  root.debug = debug;
  root.provideFullData(getTestData());
  return root;
}
