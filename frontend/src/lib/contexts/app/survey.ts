import { derived, type Readable } from 'svelte/store';
import type { TrackingService } from './tracking';

/**
 * A link to the user survey, including the session ID, or `undefined` if the survey is not configured.
 */
export function surveyLink({
  appSettings,
  sessionId
}: {
  appSettings: Readable<AppSettings>;
  sessionId: TrackingService['sessionId'];
}): Readable<string | undefined> {
  return derived(
    [appSettings, sessionId],
    ([appSettings, sessionId]) => {
      const linkTemplate = appSettings.survey?.linkTemplate;
      return linkTemplate ? linkTemplate.replace(/\{\s*sessionId\s*\}/, sessionId ?? '') : undefined;
    },
    undefined
  );
}
