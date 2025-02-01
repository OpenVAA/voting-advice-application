/**
 * Load the env variables we need for the application and throw if these are not set.
 */

export const frontendUrl = process.env.PUBLIC_BROWSER_FRONTEND_URL;
if (!frontendUrl) throw new Error('Missing PUBLIC_BROWSER_FRONTEND_URL environment variable');

const nodeEnv = process.env.NODE_ENV;

/**
 * When set to true, will generate mock data when app is started and database is empty.
 */
export const generateMockDataOnInitialise = process.env.GENERATE_MOCK_DATA_ON_INITIALISE === 'true' || false;

/**
 * When set to true, will replace the database contents with new mock data on every restart.
 * Only applicable in development environments
 */
export const generateMockDataOnRestart =
  (process.env.GENERATE_MOCK_DATA_ON_RESTART === 'true' && nodeEnv === 'development') || false;

/**
 * If available, data will be loaded from this folder on initialise, if the database contains no Election objects. This will override mock data generation
 */
export const loadDataFolder = process.env.LOAD_DATA_ON_INITIALISE_FOLDER ?? '';
