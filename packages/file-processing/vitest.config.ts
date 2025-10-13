import { defineConfig } from 'vitest/config';

/**
 * Vitest configuration for file-processing package
 */
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'build/', 'tests/', '**/*.type.ts', '**/*.d.ts']
    }
  }
});
