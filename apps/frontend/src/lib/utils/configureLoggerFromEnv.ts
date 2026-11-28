import { configureLogger, log } from '@openvaa/app-shared';
import { constants } from '$lib/utils/constants';
import { resolveLogLevel } from '$lib/utils/logLevel';

/**
 * Configure the shared logger from `PUBLIC_LOG_LEVEL`, and report a value that could not be used.
 *
 * The logger's threshold is module-scope state and SvelteKit runs the browser and the server as separate module graphs, so `hooks.client.ts` and `hooks.server.ts` each call this once at module scope, and both run at the same level.
 *
 * Resolve, configure, then emit, in that order: the logger drops records while its threshold is still `'silent'`, so a problem reported before `configureLogger` would be lost. An unset variable falls back to its documented default and is reported at `info`; a value outside the vocabulary is a misconfiguration and is reported at `error`.
 */
export function configureLoggerFromEnv(): void {
  const { level, problem } = resolveLogLevel(constants.PUBLIC_LOG_LEVEL, import.meta.env.DEV, constants.PUBLIC_DEBUG);
  configureLogger({ level });
  if (!problem) return;
  const emit = problem.reason === 'invalid' ? log.error : log.info;
  emit('PUBLIC_LOG_LEVEL is unusable; the logger fell back to a default level.', { ...problem, level });
}
