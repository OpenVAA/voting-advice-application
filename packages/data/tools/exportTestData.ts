/**
 * Export test data from in ./src/testUtils/testData.ts as multiple json files.
 *
 * ### Usage
 *
 * `yarn tsx ./exportTestData.ts path/to/export-folder`
 */

import { exportTestData } from '../src/testUtils/exportTestData';

const exportPath = process.argv.length === 3 ? process.argv.pop() : undefined;

exportTestData(exportPath || 'test-data');
