import { configureLoggerFromEnv } from '$lib/utils/configureLoggerFromEnv';

// Configure the shared logger for the browser module graph; `hooks.server.ts` makes the same call for SSR, so both run at the same level.
configureLoggerFromEnv();
