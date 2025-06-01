import { staticSettings } from '@openvaa/app-shared';
import { handleErrorWithSentry, replayIntegration } from '@sentry/sveltekit';
import * as Sentry from '@sentry/sveltekit';
import { constants } from '$lib/utils/constants';
import type { HandleClientError } from '@sveltejs/kit';

if (staticSettings.sentry.enabled) {
  Sentry.init({
    enabled: staticSettings.sentry.enabled,

    dsn: constants.PUBLIC_FRONTEND_SENTRY_DSN,

    tracesSampleRate: Number(constants.PUBLIC_FRONTEND_SENTRY_TRACES_SAMPLE_RATE),
    replaysSessionSampleRate: Number(constants.PUBLIC_FRONTEND_SENTRY_REPLAYS_SESSION_SAMPLE_RATE),
    replaysOnErrorSampleRate: Number(constants.PUBLIC_FRONTEND_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE),

    // If you don't want to use Session Replay, just remove the line below:
    integrations: [replayIntegration()]
  });
}

// The default behaviour is to log the error:
function handleErrorDefault({ error }: Parameters<HandleClientError>[0]) {
  console.error(error);
}

// If you have a custom error handler, pass it to `handleErrorWithSentry`
export const handleError = staticSettings.sentry.enabled
  ? handleErrorWithSentry(handleErrorDefault)
  : handleErrorDefault;
