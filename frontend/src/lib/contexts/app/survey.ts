import { derived, type Readable } from 'svelte/store';
import type { SessionData } from './tracking';

/**
 * A link to the user survey, including the session ID, or `undefined` if the survey is not configured.
 */
export function surveyLink({
  appSettings,
  sessionData
}: {
  appSettings: Readable<AppSettings>;
  sessionData: Readable<SessionData>;
}): Readable<string | undefined> {
  return derived(
    [appSettings, sessionData],
    ([appSettings, sessionData]) => {
      let linkTemplate = appSettings.survey?.linkTemplate;
      if (!linkTemplate) return undefined;
      for (const v of ['vaaSessionId', 'trackingId'] as const) {
        linkTemplate = replaceVar(linkTemplate, v, sessionData);
      }
      return linkTemplate;
    },
    undefined
  );
}

function replaceVar(text: string, variable: keyof SessionData, data: SessionData): string {
  const re = new RegExp(`\\{\\s*${variable}\\s*\\}`, 'g');
  return text.replace(re, encodeURIComponent(data[variable] ?? ''));
}
