/**
 * Auto-registration of argument condensation prompts
 *
 * This file is imported at the top of the package's index.ts to ensure
 * prompts are registered when the package is first loaded.
 */

import { registerPrompts } from '@openvaa/llm';
import * as path from 'path';

// Register all condensation prompts with the global registry
registerPrompts({
  packageName: 'argument-condensation',
  promptsDir: path.join(__dirname, 'core/condensation/prompts')
}).catch((err) => {
  console.error('[argument-condensation] Failed to register prompts:', err);
});
