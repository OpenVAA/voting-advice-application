import { describe, expect, it } from 'vitest';
import { surveyLink } from './survey.svelte';
import { trackingService } from './tracking';
import { getVisitId } from './tracking/visitId';
import type { VisitIdMode } from '$lib/analytics/modes';
import type { UserPreferences } from './userPreferences.type';

/**
 * Minimal rune-shaped handle used to feed the pure-rune `surveyLink` producer its inputs. The producer reads its `ReactiveHandle` inputs via their `current` getter directly (no `fromStore`), so the tests construct `{ current }` handles.
 * (NB: these are producer-INPUT handles — the consumer-facing `ctx.appSettings` surface is bare, but the producer input contract is a handle.)
 */
function handle<TValue>(value: TValue): { current: TValue } {
  return { current: value };
}

describe('surveyLink (pure-rune producer)', () => {
  it('interpolates the sessionId into a configured linkTemplate', () => {
    const cleanup = $effect.root(() => {
      const appSettings = handle({
        survey: { linkTemplate: 'https://survey.example/?s={sessionId}' }
      } as unknown as AppSettings);
      const sessionId = handle<string | undefined>('abc-123');
      const link = surveyLink({ appSettings, sessionId });
      expect(link.current).toBe('https://survey.example/?s=abc-123');
    });
    cleanup();
  });

  it('tolerates whitespace inside the {sessionId} placeholder', () => {
    const cleanup = $effect.root(() => {
      const appSettings = handle({
        survey: { linkTemplate: 'https://survey.example/?s={ sessionId }' }
      } as unknown as AppSettings);
      const sessionId = handle<string | undefined>('xyz');
      const link = surveyLink({ appSettings, sessionId });
      expect(link.current).toBe('https://survey.example/?s=xyz');
    });
    cleanup();
  });

  it('interpolates an empty string when sessionId is undefined', () => {
    const cleanup = $effect.root(() => {
      const appSettings = handle({
        survey: { linkTemplate: 'https://survey.example/?s={sessionId}' }
      } as unknown as AppSettings);
      const sessionId = handle<string | undefined>(undefined);
      const link = surveyLink({ appSettings, sessionId });
      expect(link.current).toBe('https://survey.example/?s=');
    });
    cleanup();
  });

  it('is undefined when no survey.linkTemplate is configured', () => {
    const cleanup = $effect.root(() => {
      const appSettings = handle({ survey: {} } as unknown as AppSettings);
      const sessionId = handle<string | undefined>('abc');
      const link = surveyLink({ appSettings, sessionId });
      expect(link.current).toBeUndefined();
    });
    cleanup();
  });
  describe("fed by the tracking producer's surveySessionId", () => {
    /** The survey link built the way `appContext` builds it, for a deployment in `visitIdMode` with a granted consent. */
    function linkFor(visitIdMode: VisitIdMode): string | undefined {
      const appSettings = handle({
        analytics: { trackEvents: true },
        survey: { linkTemplate: 'https://survey.example/?s={sessionId}' }
      } as unknown as AppSettings);
      const tracking = trackingService({
        appSettings,
        userPreferences: handle({ dataCollection: { consent: 'granted', date: '2026-10-19' } } as UserPreferences),
        projection: handle({ active: true, consentMode: 'gated' as const, visitIdMode }),
        locale: () => 'en'
      });
      return surveyLink({ appSettings, sessionId: tracking.surveySessionId }).current;
    }

    it('holds the visit id in visit-id mode memory', () => {
      const cleanup = $effect.root(() => {
        expect(linkFor('memory')).toBe(`https://survey.example/?s=${getVisitId()}`);
      });
      cleanup();
    });

    it('holds an empty value in visit-id mode none', () => {
      const cleanup = $effect.root(() => {
        expect(linkFor('none')).toBe('https://survey.example/?s=');
      });
      cleanup();
    });
  });
});
