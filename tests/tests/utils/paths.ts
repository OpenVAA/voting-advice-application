import path from 'path';
import { TESTS_DIR } from './testsDir';

/** Root of the monorepo */
export const REPO_ROOT = path.join(TESTS_DIR, '../..');

/** Frontend application directory */
export const FRONTEND_DIR = path.join(REPO_ROOT, 'apps', 'frontend');
