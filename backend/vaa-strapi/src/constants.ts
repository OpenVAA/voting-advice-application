/**
 * When set to true, will generate mock data when app is started and database is empty.
 */
export const generateMockDataOnInitialise =
  process.env.GENERATE_MOCK_DATA_ON_INITIALISE === 'true' || false;

/**
 * When set to true, will replace the database contents with new mock data on every restart.
 */
export const generateMockDataOnRestart =
  process.env.GENERATE_MOCK_DATA_ON_RESTART === 'true' || false;
