import { fromStore, toStore } from 'svelte/store';
import type { Readable } from 'svelte/store';
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
  const appSettingsReactive = fromStore(appSettings);
  const sessionIdReactive = fromStore(sessionId);

  const linkValue = $derived.by(() => {
    const linkTemplate = appSettingsReactive.current.survey?.linkTemplate;
    return linkTemplate ? linkTemplate.replace(/\{\s*sessionId\s*\}/, sessionIdReactive.current ?? '') : undefined;
  });

  return toStore(() => linkValue);
}
