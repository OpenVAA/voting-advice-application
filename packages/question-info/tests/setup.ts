import { noOpController } from '@openvaa/core';
import { registerPrompts } from '@openvaa/llm';
import * as path from 'path';

// Register prompts before tests run
await registerPrompts({
  packageName: 'question-info',
  promptsDir: path.join(process.cwd(), 'src/prompts'),
  controller: noOpController
});
