/**
 * The provider factory, and every event of the vocabulary through every provider that sends.
 *
 * @vitest-environment node
 */

import { log } from '@openvaa/app-shared';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { VALID_EVENTS } from '$lib/analytics/events.fixtures';
import { EVENT_NAMES } from '$lib/analytics/events.schema';
import { createProvider } from './index';
import type { AnalyticsEvent } from '$lib/analytics/analyticsEvent.type';
import type { EventName } from '$lib/analytics/events.schema';
import type { AnalyticsConfig } from '../config';
import type { ProviderDeps } from './provider.type';

const HOST = 'https://posthog.example';
const KEY = 'phc_test_key';

/** The modes every configuration of this file holds; the factory does not read them. */
const MODES = { consentMode: 'gated', visitIdMode: 'memory' } as const;

/**
 * Stand-in dependencies that record what a provider does with them.
 *
 * @returns The dependencies and what they recorded.
 */
function recordingDeps(): { deps: ProviderDeps; lines: Array<string>; bodies: Array<string> } {
  const lines: Array<string> = [];
  const bodies: Array<string> = [];
  let n = 0;
  const deps: ProviderDeps = {
    fetch: (_input, init) => {
      bodies.push(String(init?.body));
      return Promise.resolve(new Response(null, { status: 200 }));
    },
    write: (line) => {
      lines.push(line);
    },
    randomId: () => {
      n += 1;
      return `random-${n}`;
    }
  };
  return { deps, lines, bodies };
}

/**
 * Turn a wire sample of the vocabulary into the event the relay keeps, with a fixed time and app.
 *
 * @param name - The name of the sample.
 * @returns The event, carrying the sample's visit id when the sample has one.
 */
function eventOf(name: EventName): AnalyticsEvent {
  const sample: { name: string; id?: string; attributes: Record<string, JSONData> } = VALID_EVENTS[name];
  const event: AnalyticsEvent = {
    name: sample.name,
    time: 1_792_400_000_000,
    app: 'voter',
    attributes: sample.attributes
  };
  if (sample.id !== undefined) event.id = sample.id;
  return event;
}

beforeEach(() => {
  vi.spyOn(log, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('createProvider', () => {
  it('returns the none provider for none', () => {
    expect(createProvider({ provider: 'none', ...MODES }, recordingDeps().deps).name).toBe('none');
  });

  it('returns the log provider for log, writing through the given stream', async () => {
    const { deps, lines } = recordingDeps();
    const provider = createProvider({ provider: 'log', ...MODES }, deps);
    expect(provider.name).toBe('log');
    await provider.capture([eventOf('menu_open')]);
    expect(lines).toHaveLength(1);
  });

  it('returns the PostHog provider for posthog with a key, sending through the given fetch', async () => {
    const { deps, bodies } = recordingDeps();
    const provider = createProvider({ provider: 'posthog', ...MODES, posthog: { host: HOST, key: KEY } }, deps);
    expect(provider.name).toBe('posthog');
    await provider.capture([eventOf('menu_open')]);
    expect(bodies).toHaveLength(1);
    expect(JSON.parse(bodies[0]).api_key).toBe(KEY);
  });

  it('returns the none provider for posthog with no PostHog settings', () => {
    expect(createProvider({ provider: 'posthog', ...MODES }, recordingDeps().deps).name).toBe('none');
  });

  it('returns the none provider for a configuration it does not recognise', () => {
    const unknown = { provider: 'matomo', ...MODES } as unknown as AnalyticsConfig;
    expect(createProvider(unknown, recordingDeps().deps).name).toBe('none');
  });
});

describe.each(EVENT_NAMES.map((name) => [name]))('the event %s', (name) => {
  it('passes through the log provider as a line named by the event', async () => {
    const { deps, lines } = recordingDeps();
    await createProvider({ provider: 'log', ...MODES }, deps).capture([eventOf(name)]);
    expect(lines).toHaveLength(1);
    expect(JSON.parse(lines[0]).msg).toBe(name);
  });

  it('passes through the PostHog provider as an item named by the event, with no person profile and no location', async () => {
    const { deps, bodies } = recordingDeps();
    await createProvider({ provider: 'posthog', ...MODES, posthog: { host: HOST, key: KEY } }, deps).capture([
      eventOf(name)
    ]);
    expect(bodies).toHaveLength(1);
    const [item] = JSON.parse(bodies[0]).batch;
    expect(item.event).toBe(name);
    expect(item.properties.$process_person_profile).toBe(false);
    expect(item.properties.$geoip_disable).toBe(true);
  });
});
