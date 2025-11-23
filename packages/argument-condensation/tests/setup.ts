import { noOpController } from '@openvaa/core';
import { registerPrompts } from '@openvaa/llm';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Register prompts before tests run with silent controller to prevent log spam
await registerPrompts({
  packageName: 'argument-condensation',
  promptsDir: path.join(__dirname, '../src/core/condensation/prompts'),
  controller: noOpController
});