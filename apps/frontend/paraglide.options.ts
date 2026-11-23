import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { staticSettings } from '@openvaa/app-shared';
import { assertSupportedLocalesCompiled, instanceMessagesProject } from './src/lib/i18n/utils/instanceMessages';
import type { CompilerOptions } from '@inlang/paraglide-js';

const frontendDir = fileURLToPath(new URL('./', import.meta.url));
const repoRoot = fileURLToPath(new URL('../../', import.meta.url));

const compiledLocales: Array<string> = JSON.parse(
  readFileSync(new URL('./project.inlang/settings.json', import.meta.url), 'utf8')
).locales;

// Both the build and the compile script load this module, so the check runs before every compile.
assertSupportedLocalesCompiled({ supportedLocales: staticSettings.supportedLocales, compiledLocales });

/**
 * The Paraglide compiler options, shared by the Vite plugin in `vite.config.ts` and `scripts/compile-paraglide.ts`, so a job that compiles the messages without a frontend build produces what the app ships. The paths resolve against the working directory, `apps/frontend`.
 *
 * The project is the frontend's own `./project.inlang` unless `instance/messages/` at the repository root holds `<locale>.json` files. Then it is a generated project, validated against the base catalogue, that lists those files after the frontend's own, so an instance message overrides the base message of the same key in that locale.
 *
 * Loading this module also fails when `staticSettings.supportedLocales` offers a locale that has no compiled catalogue.
 */
export const PARAGLIDE_OPTIONS: CompilerOptions = {
  project: instanceMessagesProject({ frontendDir, repoRoot }),
  outdir: './src/lib/paraglide',
  strategy: ['url', 'cookie', 'baseLocale']
};
