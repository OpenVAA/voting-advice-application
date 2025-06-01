import { staticSettings } from '@openvaa/app-shared';
import { constants } from '$lib/utils/constants';

let optionalHandleErrorWithSentry = () => {};

if (staticSettings.analytics.sentryErrorReporting) {
  import('@sentry/sveltekit').then(Sentry => { 
    Sentry.init({
      dsn: constants.PUBLIC_FRONTEND_SENTRY_DSN,

      tracesSampleRate: 1.0,

      // This sets the sample rate to be 10%. You may want this to be 100% while
      // in development and sample at a lower rate in production
      replaysSessionSampleRate: 0.1,

      // If the entire session is not sampled, use the below sample rate to sample
      // sessions when an error occurs.
      replaysOnErrorSampleRate: 1.0,

      // If you don't want to use Session Replay, just remove the line below:
      integrations: [Sentry.replayIntegration()]
    });

    optionalHandleErrorWithSentry = Sentry.handleErrorWithSentry()
  });
}

// If you have a custom error handler, pass it to `handleErrorWithSentry`
// Note, since optionalHandleErrorWithSentry is assigned in a promise,
// there might be a runtime delay before Sentry handler is used to handle errors.
export const handleError = optionalHandleErrorWithSentry;