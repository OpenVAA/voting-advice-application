import {derived} from 'svelte/store';
import {parse} from '$lib/i18n';
import {settings} from '$lib/stores';
import {sessionId} from './track';

/**
 * A link to the user survey, including the session ID, or `undefined` if the survey is not configured.
 */
export const surveyLink = derived(
  [settings, sessionId],
  ([$settings, $sessionId]) => {
    const linkTemplate = $settings.analytics.survey?.linkTemplate;
    return linkTemplate ? parse(linkTemplate, {sessionId: $sessionId ?? ''}) : undefined;
  },
  ''
);
