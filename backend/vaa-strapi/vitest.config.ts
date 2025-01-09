import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    exclude: [path.join(__dirname, 'tests/**/*.*')]
  }
});
