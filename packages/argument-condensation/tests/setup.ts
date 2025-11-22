import { noOpController } from '@openvaa/core';
import { registerPrompts } from '@openvaa/llm';
import * as path from 'path';

// Register prompts before tests run with silent controller to prevent log spam
await registerPrompts({
  packageName: 'argument-condensation',
  promptsDir: path.join(process.cwd(), 'src/core/condensation/prompts'),
  controller: noOpController
});
