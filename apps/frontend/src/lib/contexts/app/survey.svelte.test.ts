import { describe, expect, it } from 'vitest';
import { surveyLink } from './survey.svelte';

/**
 * Minimal rune-shaped handle used to feed the pure-rune `surveyLink` producer
 * its inputs. The producer reads its `ReactiveHandle` inputs via their `current`
 * getter directly (no `fromStore`), so the tests construct `{ current }` handles.
 * (NB: these are producer-INPUT handles — the consumer-facing `ctx.appSettings`
 * surface went bare (see phase 113), but the producer input contract is kept.)
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
});
