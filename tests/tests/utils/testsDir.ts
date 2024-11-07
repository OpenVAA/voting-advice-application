import path from 'path';
import { fileURLToPath } from 'url';

/**
 * The folder containing the e2e test files.
 */
export const TESTS_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
