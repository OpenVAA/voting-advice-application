/**
 * Shared credentials for the primary test candidate (Test Candidate Alpha).
 *
 * Used by auth.setup.ts, data.setup.ts, and individual test files. The email
 * is sourced from the Phase 58 `e2e` template (via e2eFixtureRefs). The
 * password is a tests/-only constant set by data.setup.ts's forceRegister
 * call — it lives here because @openvaa/dev-seed (per D-24 split) does not
 * own auth concerns.
 */
import { TEST_CANDIDATE_ALPHA_EMAIL } from './e2eFixtureRefs';

export const TEST_CANDIDATE_EMAIL = TEST_CANDIDATE_ALPHA_EMAIL;
export const TEST_CANDIDATE_PASSWORD = 'Password1!';
