/**
 * Auto-registration of question info generation prompts
 *
 * This file is imported at the top of the package's index.ts to ensure
 * prompts are registered when the package is first loaded.
 */

import { registerPrompts } from '@openvaa/llm';
import * as path from 'path';

// Register all question-info prompts with the global registry
registerPrompts({
  packageName: 'question-info',
  promptsDir: path.join(__dirname, 'prompts')
}).catch((err) => {
  console.error('[question-info] Failed to register prompts:', err);
});
