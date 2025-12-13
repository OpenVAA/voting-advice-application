import { noOpController } from '@openvaa/core';
import { registerPrompts } from '@openvaa/llm';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Register prompts before tests run
await registerPrompts({
  packageName: 'question-info',
  promptsDir: path.join(__dirname, '../src/prompts'),
  controller: noOpController
});
