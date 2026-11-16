import { configureLogger, log } from '@openvaa/app-shared';
import { constants } from '$lib/utils/constants';
import { resolveLogLevel } from '$lib/utils/logLevel';

// Configure the shared logger for the BROWSER module graph.
// The logger's enablement is module-scope state and SvelteKit runs the client and the server as separate module graphs, so this call configures only the browser half; `hooks.server.ts` makes the matching call for SSR.
// THE ORDER OF THE THREE STATEMENTS BELOW IS LOAD-BEARING (decision C3's NOTE, pitfall P3): resolve, then configure, and only then emit. `emit` early-returns while the threshold is still `'silent'` (`packages/app-shared/src/logging/logger.ts:67`), so a record emitted before `configureLogger` would be dropped and the message about silence would itself be silent. The three statements are byte-identical in the other entry point because decision C2 requires the browser and the server to run at the same level.
const { level: logLevel, problem: logLevelProblem } = resolveLogLevel(
  constants.PUBLIC_LOG_LEVEL,
  import.meta.env.DEV,
  constants.PUBLIC_DEBUG
);
configureLogger({ level: logLevel });
if (logLevelProblem) {
  // ⚠ THE SEVERITY IS SPLIT BY REASON, and the split is what keeps the new `error` channel worth reading. An absent optional variable with a documented default is an `info`-level FACT; a value that was set and is out of vocabulary is an `error`. Reporting both at `error` meant every existing deployment and every developer with a pre-existing `.env` emitted an error-severity record naming a default that is working as designed — once per process start on the server, but once per FULL PAGE LOAD PER VISITOR in the browser entry point, since that file runs in the browser module graph. A constant, non-actionable record at the top of a production error stream is the noise floor that trains people to ignore the channel, which is the opposite of what ruling D9 raised the level for.
  const emit = logLevelProblem.reason === 'invalid' ? log.error : log.info;
  emit('PUBLIC_LOG_LEVEL is unusable; the logger fell back to a default level.', {
    ...logLevelProblem,
    level: logLevel
  });
}
