import defaultDataset from '../data/default-dataset.json' with { type: 'json' };

/**
 * Shared credentials for the primary test candidate (Test Candidate Alpha).
 *
 * Used by auth.setup.ts and individual test files.
 * The email comes from the default dataset; the password is set during
 * data.setup.ts and must match the value used there.
 */
export const TEST_CANDIDATE_EMAIL = defaultDataset.candidates[0].email;
export const TEST_CANDIDATE_PASSWORD = 'Password1!';
