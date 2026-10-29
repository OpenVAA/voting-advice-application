import type { CompilerOptions } from '@inlang/paraglide-js';

/**
 * The Paraglide compiler options, shared by the Vite plugin in `vite.config.ts` and `scripts/compile-paraglide.ts`, so a job that compiles the messages without a frontend build produces what the app ships. The paths resolve against the working directory, `apps/frontend`.
 */
export const PARAGLIDE_OPTIONS: CompilerOptions = {
  project: './project.inlang',
  outdir: './src/lib/paraglide',
  strategy: ['url', 'cookie', 'baseLocale']
};
