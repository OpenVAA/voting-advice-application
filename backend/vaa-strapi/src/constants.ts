const nodeEnv = process.env.NODE_ENV;

/**
 * When set to true, will generate mock data when app is started and database is empty.
 */
export const generateMockDataOnInitialise =
  process.env.GENERATE_MOCK_DATA_ON_INITIALISE === 'true' || false;

/**
 * When set to true, will replace the database contents with new mock data on every restart.
 * Only applicable in development environments
 */
export const generateMockDataOnRestart =
  (process.env.GENERATE_MOCK_DATA_ON_RESTART === 'true' && nodeEnv === 'development') || false;
